import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const script = readFileSync('android/loader/src/main/assets/history-export.js', 'utf8');
const html = readFileSync('android/loader/src/main/assets/html-export.js', 'utf8');
const message = (id, channel = '10') => ({ id: String(id), channel_id: channel, content: '<script>full</script>', author: { id: '12', username: 'Alice' }, attachments: [], embeds: [{ title: 'embed' }], reactions: [{ count: 3 }], poll: { question: { text: 'Question' } } });
function setup(get, { config = {}, channels = { a: { id: '10', type: 1 } }, captured = [], disk, remove } = {}) {
  const files = new Map(), notices = [], calls = [];
  const ctx = { setTimeout: (fn, ms) => setTimeout(fn, ms === 250 ? 0 : ms), clearTimeout, console };
  vm.runInNewContext(html, ctx); vm.runInNewContext(script, ctx);
  const store = { getChannel() {}, getDMFromUserId() {}, getChannels: () => channels, getMutablePrivateChannels: () => ({}) };
  const rest = { async get(options) { calls.push(options); return get(options, calls.length); } };
  const io = { async writeFile(_, path, data) { if (disk) await disk(path, data); files.set(path, data); }, async removeFile(_, path) { if (remove) await remove(path); files.delete(path); } };
  const control = ctx.__ASSAULT_HISTORY_EXPORT__({ metro: { common: { RestAPI: rest }, findByProps: () => store } }, config, () => io, ctx.__ASSAULT_HTML_EXPORT__, n => notices.push(n), () => captured);
  return { control, files, calls, notices, manifest: () => JSON.parse(files.get('assault-history-manifest.json')), ctx };
}
test('history fetches beyond capture limits, short pages and known closed DMs without truncation', async () => {
  const r = setup(({ url, query }) => {
    const channel = url.split('/')[2];
    if (channel === '99') return { body: query.before ? [] : [message(1, '99')] };
    const top = query.before ? Number(query.before) - 1 : 1205;
    return { body: Array.from({ length: Math.min(top, 73) }, (_, i) => message(top - i)) };
  });
  await r.control.start('99'); const report = r.manifest();
  assert.equal(report.messageCount, 1206); assert.equal(report.accountComplete, false); assert.equal(report.scannedChannelsComplete, true);
  assert.equal(report.channels.find(c => c.id === '99').source, 'supplied');
  const pages = report.entries.filter(e => /channels\/10\/.*json$/.test(e.name)).map(e => JSON.parse(r.files.get(e.file)));
  assert.equal(pages.flatMap(p => p.messages).length, 1205);
  assert.equal(pages[0].messages[0].poll.question.text, 'Question'); assert.equal(pages[0].messages[0].reactions[0].count, 3);
  const rendered = r.files.get(report.entries.find(e => e.name.endsWith('.html')).file);
  assert.match(rendered, /&lt;script&gt;/); assert.doesNotMatch(rendered, /<script>/);
});
test('closed captured channel absent from stores is still scanned and supplement is retained', async () => {
  const r = setup(() => ({ body: [] }), { channels: {}, captured: [{ ...message(9, '44'), deleted: true }] });
  await r.control.start(); assert.equal(r.manifest().channels[0].id, '44');
  const retained = JSON.parse(r.files.get(r.manifest().entries[0].file)); assert.equal(retained.messages[0].deleted, true);
});
test('403 is recorded and other channels proceed; 429 stops without retrying or claiming completeness', async () => {
  const r = setup((_options, call) => { const e = new Error('private content must not enter report'); e.status = call === 1 ? 403 : 429; throw e; }, { channels: { a: { id: '1' }, b: { id: '2' }, c: { id: '3' } } });
  await r.control.start(); const m = r.manifest();
  assert.deepEqual(m.channels.map(c => c.status), ['incomplete', 'incomplete', 'not-scanned']);
  assert.equal(m.scannedChannelsComplete, false); assert.equal(r.calls.length, 2); assert.equal(m.channels[1].reason, 'HTTP 429');
  assert.doesNotMatch(JSON.stringify(m), /private content/);
});
test('duplicate or nonprogressing pages stop visibly instead of looping or duplicating history', async () => {
  const r = setup(() => ({ body: [message(5)] })); await r.control.start();
  assert.equal(r.calls.length, 2); assert.equal(r.manifest().channels[0].reason, 'invalid-page'); assert.equal(r.manifest().messageCount, 1);
});
test('logout cancellation while request pending removes data and never publishes late manifest', async () => {
  let resolve, began; const started = new Promise(r => began = r);
  const r = setup(() => { began(); return new Promise(r => resolve = r); });
  const pending = r.control.start(); await started; await r.control.cancel(); resolve({ body: [message(1)] }); await pending;
  assert.equal(r.files.size, 0);
});
test('cancellation during file write removes the late file and prevents a ready archive', async () => {
  let finish, began; const started = new Promise(r => began = r);
  const r = setup(() => ({ body: [] }), { disk: async path => { if (path.endsWith('-manifest.json')) return; began(); await new Promise(r => finish = r); } });
  const pending = r.control.start(); await started; await r.control.cancel(); finish(); await pending; assert.equal(r.files.size, 0);
});
test('privacy choices apply recursively to referenced authors and attachment fields', async () => {
  const m = { ...message(1), attachments: [{ url: 'https://example.com/private' }], referenced_message: { ...message(2), member: { nick: 'Alice' } } };
  const r = setup((_options, n) => ({ body: n === 1 ? [m] : [] }), { config: { redactAuthors: true, captureAttachments: false } });
  await r.control.start(); const page = JSON.parse(r.files.get(r.manifest().entries.find(e => e.name.endsWith('/1.json')).file)).messages[0];
  assert.equal(page.author.username, 'redacted'); assert.equal(page.referenced_message.author.id, 'redacted'); assert.equal(page.referenced_message.member, undefined); assert.deepEqual(page.attachments, []);
});
test('missing inventory stays explicitly incomplete, invalid channel IDs make no request', async () => {
  const r = setup(() => ({ body: [] }), { channels: {} }); await r.control.start('not-a-channel'); assert.equal(r.calls.length, 0); assert.equal(r.files.size, 0);
  await r.control.start(); assert.equal(r.manifest().scannedChannelsComplete, false); assert.equal(r.manifest().accountComplete, false);
});

test('failed cleanup invalidates the archive, retains ownership for retries and blocks new scans', async () => {
  let deny = false;
  const r = setup(() => ({ body: [] }), { remove: () => { if (deny) throw new Error('disk denied'); } });
  await r.control.start(); assert.equal(r.manifest().ready, true);
  const count = r.calls.length; deny = true;
  assert.equal(await r.control.cancel(), false);
  assert.equal(r.manifest().ready, false);
  assert.match(r.notices.at(-1), /cleanup failed/);
  await r.control.start(); assert.equal(r.calls.length, count);
  deny = false; assert.equal(await r.control.cancel(), true); assert.equal(r.files.size, 0);
});
