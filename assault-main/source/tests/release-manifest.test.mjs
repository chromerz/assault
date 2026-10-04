import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, statSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readRelease, createReleaseReader } from '../scripts/release-manifest.ts';

test('release API rejects missing, corrupt or redirected artifacts and accepts matching pairs', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'assault-release-'));
  const manifest = { version: '2.10.0' };
  const save = () => writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  try {
    assert.throws(() => readRelease(dir));
    for (const invalid of [null, [], { version: ['2.11.0'] }, { version: 211000 }]) {
      writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(invalid));
      assert.throws(() => readRelease(dir), /Invalid release version/);
    }
    for (const label of ['Manager', 'Loader']) {
      const data = Buffer.from(`synthetic ${label} fixture`);
      const sha256 = createHash('sha256').update(data).digest('hex');
      const name = `Assault-${label}-${sha256}.apk`;
      writeFileSync(path.join(dir, name), data);
      manifest[label.toLowerCase()] = { url: `/releases/${name}`, sha256, size: data.length };
    }
    save(); assert.deepEqual(readRelease(dir), manifest);
    const readCached = createReleaseReader(dir);
    const first = readCached();
    assert.strictEqual(readCached(), first, 'unchanged files reuse the verified result');
    const loaderPath = path.join(dir, path.basename(manifest.loader.url));
    const originalStat = statSync(loaderPath);
    writeFileSync(loaderPath, Buffer.alloc(manifest.loader.size, 120));
    utimesSync(loaderPath, originalStat.atime, originalStat.mtime);
    assert.throws(() => readCached(), /checksum mismatch/, 'same-size corruption invalidates cache even with restored mtime');
    writeFileSync(loaderPath, Buffer.from('synthetic Loader fixture'));
    assert.deepEqual(readCached(), manifest);
    manifest.version = '2.10.1'; save();
    assert.equal(readCached().version, '2.10.1', 'manifest changes invalidate cache');
    const url = manifest.loader.url;
    manifest.loader.url = '/releases/../../private.apk'; save();
    assert.throws(() => readRelease(dir), /Invalid Loader/);
    manifest.loader.url = url;
    manifest.manager.size++; save(); assert.throws(() => readRelease(dir), /checksum mismatch/);
    manifest.manager.size--; save();
    writeFileSync(path.join(dir, path.basename(url)), 'corrupt');
    assert.throws(() => readRelease(dir), /checksum mismatch/);
    rmSync(path.join(dir, path.basename(url))); assert.throws(() => readRelease(dir)); assert.throws(() => readCached());
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
