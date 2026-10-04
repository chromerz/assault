import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { decodeApk, MAX_APK_BYTES, publishArtifacts } from './publish-release.ts';
import { readRelease, createReleaseReader } from './release-manifest.ts';

export async function githubBytes(url: string, token: string, limit: number, accept: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    for (let hop = 0; hop < 5; hop++) {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port
          || !['api.github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(parsed.hostname)) {
        throw new Error('Unexpected GitHub download location');
      }
      const headers: Record<string, string> = { 'User-Agent': 'Assault-Release-Sync', Accept: accept };
      if (token && parsed.hostname === 'api.github.com') headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url, { headers, redirect: 'manual', signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) throw new Error('Missing GitHub redirect');
        url = new URL(location, url).href;
        continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error(`GitHub request failed (HTTP ${response.status})`); }
      if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); throw new Error('GitHub response exceeds size limit'); }
      if (!response.body) throw new Error('Empty GitHub response');
      const reader = response.body.getReader();
      const chunks: Buffer[] = []; let length = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > limit) throw new Error('GitHub response exceeds size limit');
          chunks.push(Buffer.from(value));
        }
      } finally { await reader.cancel(); reader.releaseLock(); }
      return Buffer.concat(chunks, length);
    }
    throw new Error('Too many GitHub redirects');
  } finally { clearTimeout(timer); }
}

/** Stable downloads resolve through one committed manifest, never transitional aliases. */
export function releaseDownloadRouter(releasesDir: string) {
  const router = express.Router();
  const readCommitted = createReleaseReader(releasesDir);
  router.get(['/Assault-Manager.apk', '/Assault-Loader.apk', '/SHA256SUMS'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const release = readCommitted();
      const name = path.basename(req.path).toLowerCase();
      if (name === 'sha256sums') {
        res.type('text/plain').send(`${release.manager.sha256}  Assault-Manager.apk\n${release.loader.sha256}  Assault-Loader.apk\n`);
        return;
      }
      const isManager = name === 'assault-manager.apk';
      const component = isManager ? release.manager : release.loader;
      res.attachment(isManager ? 'Assault-Manager.apk' : 'Assault-Loader.apk');
      res.sendFile(path.resolve(releasesDir, path.basename(component.url)), error => {
        if (error) {
          if (!res.headersSent) res.status(503).end('Release download unavailable');
          else res.destroy();
        }
      });
    } catch { res.status(503).json({ error: 'No verified release is available.' }); }
  });
  return router;
}

export function releaseWriteRouter(releasesDir: string, defaultVersion: string) {
  const router = express.Router();
  router.use((req, res, next) => {
    const expected = process.env.ASSAULT_RELEASE_ADMIN_TOKEN;
    if (!expected || expected.length < 32) { res.status(503).json({ error: 'Release editing requires a configured administrator key.' }); return; }
    const supplied = req.get('Authorization')?.replace(/^Bearer /, '') || '';
    const a = Buffer.from(supplied), b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) { res.status(401).json({ error: 'Administrator key required.' }); return; }
    // Authenticate before parsing large request bodies.
    next();
  });
  router.use(express.json({ limit: '90mb' }));
  router.post('/upload', async (req, res) => {
    try {
      const { managerBase64, loaderBase64, version } = req.body ?? {};
      if (managerBase64 === undefined && loaderBase64 === undefined) throw new Error('Select at least one APK');
      let current: ReturnType<typeof readRelease> | undefined;
      if (managerBase64 === undefined || loaderBase64 === undefined) current = readRelease(releasesDir);
      const existing = (part: 'manager' | 'loader') => fs.readFileSync(path.join(releasesDir, path.basename(current![part].url)));
      const manager = managerBase64 === undefined ? existing('manager') : decodeApk(managerBase64);
      const loader = loaderBase64 === undefined ? existing('loader') : decodeApk(loaderBase64);
      const requestedVersion = version ?? (current ? current.version : undefined);
      const manifest = await publishArtifacts(releasesDir, manager, loader, requestedVersion);
      res.json({ success: true, manifest });
    } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Upload failed' }); }
  });
  router.post('/sync-github', async (req, res) => {
    try {
      const { repo, tag = `v${defaultVersion}`, token = '' } = req.body ?? {};
      if (typeof repo !== 'string' || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(repo)
          || typeof tag !== 'string' || !/^v?\d+\.\d+\.\d+$/.test(tag)
          || typeof token !== 'string' || token.length > 1024 || /[\r\n]/.test(token)) throw new Error('Invalid repository, tag or token');
      const version = tag.replace(/^v/, '');
      const release = JSON.parse((await githubBytes(`https://api.github.com/repos/${repo}/releases/tags/v${version}`, token, 1024 * 1024, 'application/vnd.github+json')).toString());
      if (release.tag_name !== `v${version}` || !Array.isArray(release.assets) || release.draft) throw new Error('Invalid GitHub release');
      const download = async (name: string) => {
        const asset = release.assets.find((a: {name?: string}) => a.name === name);
        if (!asset || !Number.isSafeInteger(asset.id) || asset.id <= 0 || asset.size > MAX_APK_BYTES) throw new Error(`Missing or oversized ${name}`);
        return githubBytes(`https://api.github.com/repos/${repo}/releases/assets/${asset.id}`, token, MAX_APK_BYTES, 'application/octet-stream');
      };
      const manager = await download('Assault-Manager.apk');
      const loader = await download('Assault-Loader.apk');
      const manifest = await publishArtifacts(releasesDir, manager, loader, version);
      res.json({ success: true, manifest });
    } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Sync failed' }); }
  });
  router.use((error: { type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: 'Invalid or oversized release request' });
  });
  return router;
}
