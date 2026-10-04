import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync('android/loader/src/main/assets/assault.js', 'utf8');
const accountScript = readFileSync('android/loader/src/main/assets/account-controls.js', 'utf8');
const htmlScript = readFileSync('android/loader/src/main/assets/html-export.js', 'utf8');
function runtime(config = {}) {
  let tick, dispatch, fetchHook, copied, lastSnapshot, undone = 0, now = Date.now();
  const commands = new Map(), files = new Map();
  const sent = [], notices = [];
  const ctx = {
    __ASSAULT_CONFIG__: config, console, Response, fetch() {},
    Date: class extends Date { static now() { return now; } },
    setTimeout, clearTimeout,
    setInterval(fn) { tick = fn; return 1; }, clearInterval() {},
    nativeModuleProxy: { DCDFileManager: {
      async writeFile(storage, path, data, encoding) { assert.equal(storage, 'cache'); assert.equal(encoding, 'utf8'); copied = data; files.set(path, data); },
      async removeFile(storage, path) { files.delete(path); },
    } },
    vendetta: {
      metro: { common: { FluxDispatcher: {}, ReactNative: { Alert: { alert(_title, message) { notices.push(message); } } } } },
      patcher: { instead(name, target, fn) { if (name === 'dispatch') dispatch = fn; else fetchHook = fn; return () => { undone++; }; } },
      commands: { registerCommand(value) { assert.equal(commands.has(value.name), false); commands.set(value.name, value); return () => { commands.delete(value.name); }; } },
    },
  };
  vm.runInNewContext(accountScript, ctx);
  vm.runInNewContext(htmlScript, ctx);
  vm.runInNewContext(readFileSync('android/loader/src/main/assets/history-export.js', 'utf8'), ctx);
  const render = ctx.__ASSAULT_HTML_EXPORT__;
  ctx.__ASSAULT_HTML_EXPORT__ = (messages, channel, coverage) => { lastSnapshot = JSON.parse(JSON.stringify(messages)); return render(messages, channel, coverage); };
  vm.runInNewContext(script, ctx);
  const execute = async (action, channel) => { await commands.get('assault').execute([{ name: 'action', value: action }], { channel: { id: channel } }); return copied; };
  return { ctx, commands, files, notices, advance: ms => { now += ms; }, get undone() { return undone; }, request: url => fetchHook([url], value => value), event: event => dispatch ? dispatch([event], e => sent.push(e)) : sent.push(event), sent, execute, export: async (channel, deleted = false) => { await execute(deleted ? 'export-deleted' : 'export', channel); return lastSnapshot; } };
}
const create = (id = '1', content = 'original') => ({ type: 'MESSAGE_CREATE', message: { id, channel_id: '10', content, author: { id: 'a', username: 'Alice', token: 'must-not-copy' } } });
test('retention captures edits and deletion without exporting author secrets', async () => {
  const r = runtime({ antiDelete: true, antiEdit: true });
  r.event(create());
  r.event({ type: 'MESSAGE_UPDATE', message: { id: '1', channel_id: '10', content: 'edited' } });
  r.event({ type: 'MESSAGE_DELETE', id: '1', channelId: '10' });
  const [message] = (await r.export('10'));
  assert.equal(message.content, 'edited'); assert.equal(message.deleted, true);
  assert.equal(message.edits[0].content, 'original'); assert.equal(message.author.token, undefined);
  assert.equal(r.sent.length, 2); assert.deepEqual((await r.export('other')), []);
});
test('disabled retention lets deletions through; logout clears capture', async () => {
  const r = runtime(); r.event(create());
  r.event({ type: 'MESSAGE_DELETE', id: '1', channelId: '10' });
  assert.equal(r.sent.length, 2); assert.deepEqual((await r.export('10')), []);
  r.event(create()); r.event({ type: 'LOGOUT' }); assert.deepEqual((await r.export('10')), []);
});
test('capture and edit history have bounded memory', async () => {
  const r = runtime({ antiEdit: true });
  for (let i = 0; i < 600; i++) r.event(create(String(i)));
  assert.equal(r.ctx.assault.captured.size, 500);
  for (let i = 0; i < 30; i++) r.event({ type: 'MESSAGE_UPDATE', message: { id: '599', channel_id: '10', content: String(i) } });
  assert.equal((await r.export('10')).at(-1).edits.length, 20);
});
test('uncaptured deletes and unrelated gateway events reach Discord', async () => {
  const r = runtime({ antiDelete: true });
  r.event({ type: 'MESSAGE_DELETE', id: 'unseen', channelId: '10' });
  r.event({ type: 'CHANNEL_DELETE', channelId: '10' }); assert.equal(r.sent.length, 2);
});

test('loaded history is captured and mixed bulk deletion preserves only captured messages', async () => {
  const r = runtime({ antiDelete: true });
  r.event({ type: 'LOAD_MESSAGES_SUCCESS', messages: [create().message] });
  r.event({ type: 'MESSAGE_DELETE_BULK', ids: ['1', 'unseen'], channelId: '10' });
  assert.deepEqual(Array.from(r.sent.at(-1).ids), ['unseen']);
  assert.equal((await r.export('10'))[0].deleted, true);
});


test('content budget evicts oldest messages and clear releases accounting', async () => {
  const r = runtime({ memoryKiB: 64, maxMessages: 1000 });
  for (let i = 0; i < 20; i++) r.event(create(String(i), 'x'.repeat(16000)));
  assert.ok(r.ctx.assault.retainedBytes <= 64 * 1024);
  assert.ok(r.ctx.assault.stats.evicted > 0);
  assert.equal((await r.export('10')).at(-1).id, '19');
  await r.execute('clear-all');
  assert.equal(r.ctx.assault.retainedBytes, 0);
});

test('expiry, redacted export and attachment controls apply without cleanup timers', async () => {
  const r = runtime({ retentionMinutes: 15, redactAuthors: true, captureAttachments: false });
  const event = create(); event.message.attachments = [{ filename: 'file', url: 'https://example.com/file' }];
  r.event(event);
  assert.equal((await r.export('10'))[0].author.id, 'redacted');
  assert.deepEqual((await r.export('10'))[0].attachments, []);
  r.advance(15 * 60000);
  r.event({ type: 'PRESENCE_UPDATE' });
  assert.equal(r.ctx.assault.captured.size, 0, 'next event expires content before export');
  assert.deepEqual((await r.export('10')), []);
  assert.equal(r.ctx.assault.retainedBytes, 0);
});

test('HTML/deleted exports and channel clear preserve other channels', async () => {
  const r = runtime({ antiDelete: true }); r.event(create());
  const other = create('2'); other.message.channel_id = '20'; r.event(other);
  r.event({ type: 'MESSAGE_DELETE', id: '1', channelId: '10' });
  assert.equal((await r.export('10', true)).length, 1);
  assert.match(await r.execute('export', '10'), /Alice<\/b>.*<strong>Deleted<\/strong>/);
  await r.execute('clear', '10'); assert.deepEqual((await r.export('10')), []);
  assert.equal((await r.export('20')).length, 1);
  r.event({ type: 'ACCOUNT_SWITCH' }); assert.deepEqual((await r.export('20')), []);
});

test('capture errors fail open and disabled capture retains no messages', async () => {
  const r = runtime(); const bad = { type: 'MESSAGE_CREATE', get message() { throw new Error('malformed'); } };
  r.event(bad); assert.equal(r.sent[0], bad); assert.equal(r.ctx.assault.stats.captureErrors, 1);
  const off = runtime({ captureEnabled: false, antiDelete: true }); off.event(create());
  assert.equal(off.sent.length, 1); assert.deepEqual((await off.export('10')), []);
});

test('analytics filtering preserves ordinary traffic and optional crash reporting', async () => {
  const r = runtime({ noTrack: true, blockCrashReports: false });
  assert.equal((await r.request('/api/v9/science')).status, 204);
  assert.equal(r.request('https://discord.com/api/v9/channels'), 'https://discord.com/api/v9/channels');
  assert.equal(r.request('https://abc.ingest.sentry.io/api/1'), 'https://abc.ingest.sentry.io/api/1');
  assert.equal(r.ctx.assault.stats.blockedAnalytics, 1);
  const crash = runtime({ noTrack: true });
  assert.equal((await crash.request('https://abc.ingest.sentry.io/api/1')).status, 204);
  assert.equal(crash.ctx.assault.stats.blockedCrashes, 1);
});

test('reinjection is idempotent and unload removes hooks and commands', async () => {
  const r = runtime({ noTrack: true }); r.event(create());
  vm.runInNewContext(script, r.ctx); assert.equal(r.commands.size, 1);
  r.ctx.assault.unload(); assert.equal(r.undone, 2); assert.equal(r.commands.size, 0);
  assert.equal(r.ctx.assault, undefined);
});

test('partial registration rolls back and unavailable API stops bounded bootstrap', async () => {
  let undos = 0, tick, clears = 0;
  const ctx = { console: { error() {} }, setInterval(fn) { tick = fn; return 1; }, clearInterval() { clears++; } };
  vm.runInNewContext(script, ctx);
  for (let i = 0; i < 119; i++) tick();
  assert.equal(clears, 1); assert.equal(ctx.__assaultPending, undefined);
  ctx.vendetta = { metro: { common: { FluxDispatcher: {} } }, patcher: { instead() { return () => { undos++; }; } }, commands: { registerCommand() { throw new Error('unsupported'); } } };
  vm.runInNewContext(script, ctx);
  assert.equal(undos, 1); assert.equal(ctx.assault, undefined);
});


test('expired messages are not retained by a deletion on the next event', async () => {
  const r = runtime({ retentionMinutes: 15, antiDelete: true });
  r.event(create()); r.advance(15 * 60000);
  r.event({ type: 'MESSAGE_DELETE', id: '1', channelId: '10' });
  assert.equal(r.sent.length, 2);
  assert.equal(r.ctx.assault.captured.size, 0);
  r.event(create('2')); r.advance(14 * 60000); r.event({ type: 'PRESENCE_UPDATE' });
  assert.equal(r.ctx.assault.captured.size, 1);
  r.advance(60000); r.event({ type: 'PRESENCE_UPDATE' });
  assert.equal(r.ctx.assault.captured.size, 0);
});

test('clear-all cancels an in-flight HTML export instead of recreating cleared data', async () => {
  const r = runtime(); r.event(create());
  let complete;
  const writing = new Promise(resolve => { complete = resolve; });
  r.ctx.nativeModuleProxy.DCDFileManager.writeFile = async (_storage, path, data) => { await writing; r.files.set(path, data); };
  const pending = r.execute('export', '10');
  await r.execute('clear-all'); complete(); await pending;
  assert.equal(r.files.has('assault-export.html'), false);
});

test('HTML write failure removes a previous cached export and dispatch remains usable', async () => {
  const r = runtime(); r.event(create()); await r.execute('export', '10');
  r.ctx.nativeModuleProxy.DCDFileManager.writeFile = async () => { throw new Error('disk full'); };
  await r.execute('export', '10'); assert.equal(r.files.has('assault-export.html'), false);
  r.event(create('2')); assert.equal(r.ctx.assault.captured.size, 2);
});

test('export-all and export without channel export everything across all channels', async () => {
  const r = runtime({ antiDelete: true });
  r.event(create('1', 'first in ch10'));
  const other = create('2', 'second in ch20');
  other.message.channel_id = '20';
  r.event(other);
  await r.execute('export-all');
  assert.equal(r.files.has('assault-export.html'), true);
  const exported = r.files.get('assault-export.html');
  assert.match(exported, /first in ch10/);
  assert.match(exported, /second in ch20/);
  assert.match(exported, /All channels/);

  // Command execution without channel context also exports everything
  await r.commands.get('assault').execute([{ name: 'action', value: 'export' }], {});
  const fallbackAll = r.files.get('assault-export.html');
  assert.match(fallbackAll, /first in ch10/);
  assert.match(fallbackAll, /second in ch20/);
});

test('silentTyping mod suppresses outgoing typing indicators and export-json saves structured json', async () => {
  const r = runtime({ noTrack: true, silentTyping: true });
  const typingResponse = await r.request('https://discord.com/api/v9/channels/10/typing');
  assert.equal(typingResponse.status, 204);
  assert.equal(r.ctx.assault.stats.blockedTyping, 1);

  r.event(create('1', 'sample text for json'));
  await r.commands.get('assault').execute([{ name: 'action', value: 'export-json' }], { channel: { id: '10' } });
  assert.equal(r.files.has('assault-export.json'), true);
  const data = JSON.parse(r.files.get('assault-export.json'));
  assert.equal(data.count, 1);
  assert.equal(data.channel, '10');
  assert.equal(data.messages[0].content, 'sample text for json');
});

test('ghost ping detector tracks deleted mentions and search finds messages', async () => {
  const r = runtime({ antiDelete: true });
  const pingMsg = create('gp1', 'Hey <@12345> check this out');
  pingMsg.message.mentions = [{ id: '12345' }];
  r.event(pingMsg);

  // Search finds it
  let searchAlert;
  r.ctx.vendetta.metro.common.ReactNative.Alert.alert = (title, msg) => { searchAlert = msg; };
  await r.commands.get('assault').execute([{ name: 'action', value: 'search' }, { name: 'query', value: 'check this out' }], {});
  assert.match(searchAlert, /check this out/);

  // Deleting message flags it as a ghost ping
  r.event({ type: 'MESSAGE_DELETE', id: 'gp1', channelId: '10' });
  let ghostAlert;
  r.ctx.vendetta.metro.common.ReactNative.Alert.alert = (title, msg) => { ghostAlert = msg; };
  await r.commands.get('assault').execute([{ name: 'action', value: 'ghost-pings' }], {});
  assert.match(ghostAlert, /1 ghost ping/);

  // HTML export badges ghost ping
  await r.execute('export', '10');
  const html = r.files.get('assault-export.html');
  assert.match(html, /Ghost Ping/);
});




test('privacy toggles are independent and typing filter only matches Discord typing endpoints', async () => {
  const r = runtime({ noTrack: false, blockCrashReports: true, silentTyping: true });
  assert.equal((await r.request('https://discord.com/api/v9/channels/10/typing')).status, 204);
  assert.equal(r.request('https://example.com/api/v9/channels/10/typing'), 'https://example.com/api/v9/channels/10/typing');
  assert.equal(r.request('https://discord.com/api/v9/channels/10/typing-extra'), 'https://discord.com/api/v9/channels/10/typing-extra');
  assert.equal(r.request('/api/v9/science'), '/api/v9/science');
  assert.equal((await r.request('https://abc.ingest.sentry.io/api/1')).status, 204);
  await r.commands.get('assault').execute([{ name: 'action', value: 'privacy' }, { name: 'query', value: 'typing off' }], {});
  assert.equal(r.request('/api/v9/channels/10/typing'), '/api/v9/channels/10/typing');
});
test('JSON exports are removed by logout, clear and an in-flight export invalidation', async () => {
  const r = runtime(); r.event(create());
  await r.execute('export-json', '10'); assert.ok(r.files.has('assault-export.json'));
  r.event({ type: 'LOGOUT' }); assert.equal(r.files.has('assault-export.json'), false);
  r.event(create('2')); let finish;
  const writing = new Promise(resolve => { finish = resolve; });
  r.ctx.nativeModuleProxy.DCDFileManager.writeFile = async (_storage, path, data) => { await writing; r.files.set(path, data); };
  const pending = r.execute('export-json', '10'); await r.execute('clear-all'); finish(); await pending;
  assert.equal(r.files.has('assault-export.json'), false);
});
test('ghost ping state follows expiry, channel clear, budgets and its disabled setting', async () => {
  const r = runtime({ antiDelete: true, retentionMinutes: 15 });
  let notice = ''; r.ctx.vendetta.metro.common.ReactNative.Alert.alert = (_title, value) => { notice = value; };
  r.event(create('1', 'hey <@123>')); r.event({ type: 'MESSAGE_DELETE', id: '1', channelId: '10' });
  await r.execute('ghost-pings', '10'); assert.match(notice, /1 ghost ping/);
  r.advance(15 * 60000); await r.execute('ghost-pings', '10'); assert.match(notice, /No retained/);
  r.event(create('2', 'hey <@123>')); r.event({ type: 'MESSAGE_DELETE', id: '2', channelId: '10' });
  await r.execute('clear', '10'); await r.execute('ghost-pings', '10'); assert.match(notice, /No retained/);
  const off = runtime({ antiDelete: true, ghostPingAlert: false }); off.event(create('3', 'hey <@123>')); off.event({ type: 'MESSAGE_DELETE', id: '3', channelId: '10' });
  assert.equal((await off.export('10'))[0].ghost_ping, false);
});
test('search respects current/all channel scope, redaction and expiration', async () => {
  const r = runtime({ redactAuthors: true, retentionMinutes: 15 }); let notice = '';
  r.ctx.vendetta.metro.common.ReactNative.Alert.alert = (_title, value) => { notice = value; };
  r.event(create('1', 'find me')); const other = create('2', 'find me too'); other.message.channel_id = '20'; r.event(other);
  const args = [{ name: 'action', value: 'search' }, { name: 'query', value: 'find' }];
  await r.commands.get('assault').execute(args, { channel: { id: '10' } }); assert.match(notice, /Found 1/); assert.doesNotMatch(notice, /Alice/);
  await r.commands.get('assault').execute([...args, { name: 'scope', value: 'all' }], { channel: { id: '10' } }); assert.match(notice, /Found 2/);
  r.advance(15 * 60000); await r.commands.get('assault').execute(args, { channel: { id: '10' } }); assert.match(notice, /No retained/);
});
test('capture off clears content and exports; on resumes without restarting', async () => {
  const r = runtime(); r.event(create()); await r.execute('export', '10');
  const capture = value => r.commands.get('assault').execute([{ name: 'action', value: 'capture' }, { name: 'query', value }], {});
  await capture('off'); r.event(create('2')); assert.equal(r.ctx.assault.captured.size, 0); assert.equal(r.files.has('assault-export.html'), false);
  await capture('on'); r.event(create('3')); assert.equal(r.ctx.assault.captured.size, 1);
});

test('history commands route extra closed DM IDs and account switch clears prepared pages', async () => {
  const r = runtime(); const requests = [];
  r.ctx.vendetta.metro.common.RestAPI = { async get(args) { requests.push(args); return { body: [] }; } };
  await r.commands.get('assault').execute([{ name: 'action', value: 'export-history' }, { name: 'query', value: '987' }], {});
  assert.equal(requests[0].url, '/channels/987/messages');
  assert.ok(r.files.has('assault-history-manifest.json'));
  r.event({ type: 'ACCOUNT_SWITCH' }); await r.execute('history-cancel');
  assert.equal(r.files.size, 0);
});
test('session HTML and JSON explicitly report limited coverage', async () => {
  const r = runtime(); r.event(create());
  assert.match(await r.execute('export', '10'), /Partial session capture/);
  await r.execute('export-json', '10');
  const report = JSON.parse(r.files.get('assault-export.json'));
  assert.equal(report.coverage.complete, false); assert.equal(report.coverage.source, 'bounded-session-capture');
});


for (const captureEnabled of [true, false]) test(`native notes receive query and clear on account switch with capture ${captureEnabled}`, async () => {
  const r = runtime({captureEnabled});
  await r.commands.get('assault').execute([{name:'action',value:'notes'}, {name:'query',value:'remember this'}], {});
  assert.match(r.notices.at(-1), /saved for this session/);
  await r.execute('notes'); assert.match(r.notices.at(-1), /remember this/);
  r.event({type:'ACCOUNT_SWITCH'}); await r.execute('notes'); assert.match(r.notices.at(-1), /No session notes/);
  await r.execute('quests'); assert.match(r.notices.at(-1), /local preview/);
});
