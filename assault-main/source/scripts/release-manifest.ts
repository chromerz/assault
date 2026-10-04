import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export function readRelease(directory: string) {
  const release = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  if (!release || typeof release.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(release.version)) throw new Error('Invalid release version');
  for (const [key, label] of [['manager', 'Manager'], ['loader', 'Loader']]) {
    const artifact = release[key];
    if (!artifact || !/^[a-f0-9]{64}$/.test(artifact.sha256)
      || artifact.url !== `/releases/Assault-${label}-${artifact.sha256}.apk`) {
      throw new Error(`Invalid ${label} artifact`);
    }
    const bytes = fs.readFileSync(path.join(directory, path.basename(artifact.url)));
    if (bytes.length !== artifact.size || createHash('sha256').update(bytes).digest('hex') !== artifact.sha256) {
      throw new Error(`${label} checksum mismatch`);
    }
  }
  return { version: release.version, manager: release.manager, loader: release.loader };
}

export function createReleaseReader(directory: string) {
  let cached: ReturnType<typeof readRelease> | undefined;
  let verifiedFingerprint: string | undefined;
  function fingerprint() {
    const manifest = fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8');
    const release = JSON.parse(manifest);
    const metadata = ['manager', 'loader'].map(component => {
      const url = release?.[component]?.url;
      if (typeof url !== 'string' || !/^\/releases\/Assault-(Manager|Loader)-[a-f0-9]{64}\.apk$/.test(url)) {
        throw new Error('Invalid artifact path');
      }
      const stat = fs.statSync(path.join(directory, path.basename(url)), { bigint: true });
      return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].map(String);
    });
    return JSON.stringify([manifest, metadata]);
  }
  return () => {
    const before = fingerprint();
    if (cached && before === verifiedFingerprint) return cached;
    const release = readRelease(directory);
    const after = fingerprint();
    if (before !== after) throw new Error('Release changed during verification; retry');
    cached = release;
    verifiedFingerprint = after;
    return release;
  };
}
