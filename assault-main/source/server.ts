import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { createReleaseReader } from './scripts/release-manifest';
import { releaseWriteRouter, releaseDownloadRouter } from './scripts/release-api';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();


const releasesDir = path.join(root, 'public/releases');
const readRelease = createReleaseReader(releasesDir);

app.get('/api/releases', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try { res.json(readRelease()); }
  catch { res.status(503).json({ error: 'No verified release is available. Build the Android release first.' }); }
});

app.use('/api/releases', releaseWriteRouter(releasesDir, JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version));
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Unknown API endpoint' }); });
app.use('/releases', releaseDownloadRouter(releasesDir));
app.use('/releases', express.static(path.join(root, 'public/releases'), { dotfiles: 'deny' }));
app.use('/releases', (_req, res) => { res.status(404).send('Release file not found'); });
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', () => console.log(`Assault download portal: http://localhost:${port}`));
