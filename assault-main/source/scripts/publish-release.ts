import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readRelease } from './release-manifest.ts';

const run = promisify(execFile);
export const MAX_APK_BYTES = 32 * 1024 * 1024;
const verifier = fileURLToPath(new URL('./verify_release_pair.py', import.meta.url));

export function decodeApk(value: unknown): Buffer {
  if (typeof value !== 'string' || !value.length || value.length > Math.ceil(MAX_APK_BYTES / 3) * 4
      || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Invalid APK encoding or size');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length > MAX_APK_BYTES || bytes.toString('base64') !== value) throw new Error('Invalid APK encoding or size');
  return bytes;
}

// Coordinate with other portal processes and the Python build publisher.
export async function publishArtifacts(releasesDir: string, managerBytes: Buffer, loaderBytes: Buffer, version?: string) {
  if (version !== undefined && (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version))) throw new Error('Invalid release version');
  for (const bytes of [managerBytes, loaderBytes]) {
    if (!bytes.length || bytes.length > MAX_APK_BYTES) throw new Error('APK exceeds size limit');
  }
  fs.mkdirSync(releasesDir, { recursive: true });
  const lock = path.join(releasesDir, '.publication.lock');
  try { fs.mkdirSync(lock); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Another publication holds .publication.lock. Retry later; after a crashed publisher, confirm it has stopped before removing the stale lock directory.');
    throw error;
  }
  let staging: string | undefined;
  try {
    staging = fs.mkdtempSync(path.join(os.tmpdir(), 'assault-verify-'));
    const manager = path.join(staging, 'manager.apk'), loader = path.join(staging, 'loader.apk');
    fs.writeFileSync(manager, managerBytes); fs.writeFileSync(loader, loaderBytes);
    const previous = fs.existsSync(path.join(releasesDir, 'manifest.json')) ? readRelease(releasesDir) : undefined;
    const args = [verifier, manager, loader, version ?? '-'];
    let verifiedVersion: string;
    if (previous) args.push(path.join(releasesDir, path.basename(previous.manager.url)));
    try {
      const result = await run(process.platform === 'win32' ? 'python' : 'python3', args, { timeout: 150000, maxBuffer: 65536 });
      verifiedVersion = result.stdout.trim();
      if (!/^\d+\.\d+\.\d+$/.test(verifiedVersion)) throw new Error('APK verifier returned an invalid version');
    }
    catch (error) {
      const message = (error as { stderr?: string }).stderr?.trim();
      throw new Error(message || 'APK verification unavailable or failed');
    }
    fs.mkdirSync(releasesDir, { recursive: true });
    const managerSha = crypto.createHash('sha256').update(managerBytes).digest('hex');
    const loaderSha = crypto.createHash('sha256').update(loaderBytes).digest('hex');
    // Unique staging files live on the destination filesystem for atomic renames.
    const stage = fs.mkdtempSync(path.join(releasesDir, '.publish-'));
    let preserveRecovery = false;
    try {
      const manifest = {
        version: verifiedVersion,
        manager: { url: `/releases/Assault-Manager-${managerSha}.apk`, size: managerBytes.length, sha256: managerSha },
        loader: { url: `/releases/Assault-Loader-${loaderSha}.apk`, size: loaderBytes.length, sha256: loaderSha },
      };
      // HTTP aliases resolve through manifest.json; only its final rename commits a release.
      const stable = ['Assault-Manager.apk', 'Assault-Loader.apk', 'SHA256SUMS', 'manifest.json'];
      const backups = new Map<string, string>();
      for (const name of stable) {
        const existing = path.join(releasesDir, name);
        if (fs.existsSync(existing)) {
          const backup = path.join(stage, `previous-${name}`);
          fs.copyFileSync(existing, backup); backups.set(name, backup);
        }
      }
      // Stage everything before switching any publicly named file.
      for (const [label, bytes, hash] of [['Manager', managerBytes, managerSha], ['Loader', loaderBytes, loaderSha]] as const) {
        for (const name of [`Assault-${label}-${hash}.apk`, `Assault-${label}.apk`]) fs.writeFileSync(path.join(stage, name), bytes);
      }
      fs.writeFileSync(path.join(stage, 'SHA256SUMS'), `${managerSha}  Assault-Manager.apk\n${loaderSha}  Assault-Loader.apk\n`);
      fs.writeFileSync(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
      for (const artifact of [manifest.manager, manifest.loader]) {
        const name = path.basename(artifact.url);
        fs.renameSync(path.join(stage, name), path.join(releasesDir, name));
      }
      const switched: string[] = [];
      try {
        for (const name of stable) {
          fs.renameSync(path.join(stage, name), path.join(releasesDir, name)); switched.push(name);
        }
      } catch (error) {
        for (const name of switched.reverse()) {
          try {
            const backup = backups.get(name);
            if (backup) fs.renameSync(backup, path.join(releasesDir, name));
            else fs.rmSync(path.join(releasesDir, name), { force: true });
          } catch { preserveRecovery = true; }
        }
        if (preserveRecovery) throw new Error('Publication recovery needs filesystem repair; previous files are retained in the hidden .publish directory.');
        throw error;
      }
      return manifest;
    } finally { if (!preserveRecovery) fs.rmSync(stage, { recursive: true, force: true }); }
  } finally {
    try { if (staging) fs.rmSync(staging, { recursive: true, force: true }); }
    finally { fs.rmdirSync(lock); }
  }
}
