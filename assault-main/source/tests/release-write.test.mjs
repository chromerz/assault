import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtempSync, rmSync, readdirSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { releaseWriteRouter, releaseDownloadRouter, githubBytes } from '../scripts/release-api.ts';
import { decodeApk, publishArtifacts } from '../scripts/publish-release.ts';

test('release writes fail closed before parsing bodies; malformed authorized requests cannot publish', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'assault-api-'));
  const saved = process.env.ASSAULT_RELEASE_ADMIN_TOKEN;
  const app = express(); app.use('/api/releases', releaseWriteRouter(dir, '2.11.2'));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/releases`;
  try {
    delete process.env.ASSAULT_RELEASE_ADMIN_TOKEN;
    assert.equal((await fetch(url+'/upload', { method:'POST' })).status, 503);
    process.env.ASSAULT_RELEASE_ADMIN_TOKEN = 'synthetic-only-admin-key-for-tests';
    assert.equal((await fetch(url+'/upload', { method:'POST',headers:{'Content-Type':'application/json'},body:'not-json' })).status, 401);
    const headers = {Authorization:`Bearer ${process.env.ASSAULT_RELEASE_ADMIN_TOKEN}`,'Content-Type':'application/json'};
    for (const [endpoint, body] of [['upload',{managerBase64:'%%%'}],['upload',{}],['sync-github',{repo:'../../outside',tag:'v1.0.0'}]]) {
      const res = await fetch(url+'/'+endpoint,{method:'POST',headers,body:JSON.stringify(body)});
      assert.equal(res.status,400); assert.ok((await res.json()).error);
    }
    assert.deepEqual(readdirSync(dir), []);
  } finally {
    if (saved === undefined) delete process.env.ASSAULT_RELEASE_ADMIN_TOKEN; else process.env.ASSAULT_RELEASE_ADMIN_TOKEN = saved;
    await new Promise(resolve => server.close(resolve)); rmSync(dir,{recursive:true,force:true});
  }
});

test('publication rejects invalid versions and non-APKs without changing output', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'assault-invalid-'));
  try {
    assert.throws(() => decodeApk('%%%'), /Invalid/);
    await assert.rejects(publishArtifacts(dir,Buffer.from('bad'),Buffer.from('bad'),'../bad'), /version/);
    await assert.rejects(publishArtifacts(dir,Buffer.from('bad'),Buffer.from('bad'),'2.11.2'), /verification/);
    assert.deepEqual(readdirSync(dir), []);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('GitHub download bounds redirects and bytes, and strips credentials on CDN hops', async () => {
  const original = globalThis.fetch; let calls = [];
  try {
    globalThis.fetch = async (url, options) => { calls.push([url, options.headers]); return calls.length === 1 ? new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/test'}}) : new Response('apk'); };
    assert.equal((await githubBytes('https://api.github.com/test','synthetic-token',10,'application/octet-stream')).toString(),'apk');
    assert.equal(calls[0][1].Authorization,'Bearer synthetic-token'); assert.equal(calls[1][1].Authorization,undefined);
    globalThis.fetch = async () => new Response(null,{status:302,headers:{location:'http://127.0.0.1/secret'}});
    await assert.rejects(githubBytes('https://api.github.com/test','',10,'application/json'),/location/);
    globalThis.fetch = async () => new Response('too large');
    await assert.rejects(githubBytes('https://api.github.com/test','',3,'application/json'),/size limit/);
  } finally { globalThis.fetch = original; }
});


test('stable downloads expose only the manifest commit even while aliases contain another release', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'assault-download-'));
  const manifest = version => {
    const release = {version};
    for (const label of ['Manager','Loader']) {
      const bytes = Buffer.from(`${label}-${version}`), sha256 = createHash('sha256').update(bytes).digest('hex');
      const name = `Assault-${label}-${sha256}.apk`;
      writeFileSync(path.join(dir,name),bytes);
      release[label.toLowerCase()] = {url:'/releases/'+name,sha256,size:bytes.length};
    }
    return release;
  };
  const first = manifest('2.11.1'), second = manifest('2.11.2');
  writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(first));
  const app = express(); app.use('/releases',releaseDownloadRouter(dir));
  const server = app.listen(0,'127.0.0.1'); await once(server,'listening');
  const base = `http://127.0.0.1:${server.address().port}/releases/`;
  try {
    for (const name of ['Assault-Manager.apk','Assault-Loader.apk','SHA256SUMS']) writeFileSync(path.join(dir,name),'uncommitted-new-file');
    for (const release of [first,second]) {
      if (release === second) { writeFileSync(path.join(dir,'next.json'),JSON.stringify(second)); renameSync(path.join(dir,'next.json'),path.join(dir,'manifest.json')); }
      for (const label of ['Manager','Loader']) {
        const response = await fetch(base+`Assault-${label}.apk`);
        assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'no-store');
        assert.equal(await response.text(),`${label}-${release.version}`);
        assert.equal(await (await fetch(base+`assault-${label.toLowerCase()}.apk`)).text(),`${label}-${release.version}`);
      }
      assert.equal(await (await fetch(base+'SHA256SUMS')).text(),`${release.manager.sha256}  Assault-Manager.apk\n${release.loader.sha256}  Assault-Loader.apk\n`);
    }
    writeFileSync(path.join(dir,'manifest.json'),'invalid');
    assert.equal((await fetch(base+'Assault-Manager.apk')).status,503);
  } finally { await new Promise(resolve=>server.close(resolve)); rmSync(dir,{recursive:true,force:true}); }
});


test('a filesystem publication lock prevents competing writers and is never removed by a contender', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'assault-locked-'));
  const lock = path.join(dir,'.publication.lock');
  try {
    mkdirSync(lock);
    await assert.rejects(publishArtifacts(dir,Buffer.from('bad'),Buffer.from('bad'),'2.11.2'), /publication.lock/);
    assert.equal(existsSync(lock),true);
    rmSync(lock,{recursive:true});
    await assert.rejects(publishArtifacts(dir,Buffer.from('bad'),Buffer.from('bad'),'2.11.2'), /verification/);
    assert.equal(existsSync(lock),false);
  } finally {rmSync(dir,{recursive:true,force:true});}
});


test('Node publisher honors a lock held by the Python build publisher', async () => {
  const dir = mkdtempSync(path.join(tmpdir(),'assault-python-lock-'));
  const child = spawn('python3',['-u','-c',"import sys;sys.path.insert(0,'scripts');from pathlib import Path;from build_android import publication_lock\nwith publication_lock(Path(sys.argv[1])):\n print('held',flush=True)\n sys.stdin.read(1)",dir],{stdio:['pipe','pipe','pipe']});
  try {
    const [chunk] = await once(child.stdout,'data',{signal:AbortSignal.timeout(5000)});
    assert.match(chunk.toString(),/held/);
    await assert.rejects(publishArtifacts(dir,Buffer.from('bad'),Buffer.from('bad'),'2.11.2'),/publication.lock/);
    const exited = once(child,'exit'); child.stdin.end('x'); await exited;
    assert.equal(existsSync(path.join(dir,'.publication.lock')),false);
  } finally {child.kill();rmSync(dir,{recursive:true,force:true});}
});
