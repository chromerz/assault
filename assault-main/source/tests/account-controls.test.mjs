import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('android/loader/src/main/assets/account-controls.js', 'utf8');
const html = readFileSync('android/loader/src/main/assets/html-export.js', 'utf8');
function setup(config = {}, utilities = {}) {
  let now = 100000, sendHook, failReaction;
  const reacted = [], outbound = [], notices = [], frames = [];
  class Socket { constructor(url) { this.url = url; } send(value) { frames.push(value); return 7; } }
  const originalSend = Socket.prototype.send;
  const user = { getCurrentUser: () => ({ id: 'self' }) };
  const reactions = { addReaction(...args) { reacted.push(args); return failReaction ? Promise.reject(failReaction) : Promise.resolve(); }, removeReaction() {} };
  const messages = { sendMessage(...args) { outbound.push(args); }, sendBotMessage() {} };
  const context = { WebSocket: Socket, Date: { now: () => now } };
  vm.runInNewContext(readFileSync('android/loader/src/main/assets/rich-presence.js', 'utf8'), context);
  vm.runInNewContext(source, context);
  const control = context.__ASSAULT_ACCOUNT_CONTROLS__({ metro: { findByProps: (...props) => [user, reactions, messages].find(mod => props.every(p => p in mod)) }, patcher: { instead(name, target, fn) { sendHook = fn; return () => { sendHook = undefined; }; } } }, config, text => notices.push(text), utilities);
  return { control, Socket, originalSend, frames, notices, reacted, outbound, tick: ms => { now += ms; }, fail: value => { failReaction = value; }, send: content => sendHook ? sendHook(['channel', { content }], (...args) => outbound.push(args)) : outbound.push(content) };
}
const message = (id, author = 'self') => ({ type: 'MESSAGE_CREATE', message: { id, channel_id: 'channel', author: { id: author } } });
test('profiles are off by default; enabled owner commands never enter outgoing chat', async () => {
  const off = setup(); off.send('$help'); off.control.event(message('1')); assert.equal(off.outbound.length, 1); assert.equal(off.reacted.length, 0);
  const r = setup({ accountProfile: 'controls' }); await r.send('$help'); await r.send('$status');
  assert.equal(r.outbound.length, 0); assert.equal(r.notices.length, 2);
  r.send('$unknown'); r.send('hello'); r.send('$constructor'); assert.equal(r.outbound.length, 3);
  await r.send('$prefix !'); await r.send('!status'); assert.equal(r.outbound.length, 3);
});
test('reaction handling deduplicates, limits rate, ignores other accounts and pauses on logout', async () => {
  const r = setup({ accountProfile: 'controls', selfReaction: true });
  r.control.event(message('other', 'elsewhere')); r.control.event(message('1')); r.control.event(message('1')); r.control.event(message('2'));
  assert.equal(r.reacted.length, 1);
  r.tick(10000); r.control.event(message('3')); assert.equal(r.reacted.length, 2);
  await r.send('$stop'); r.tick(10000); r.control.event(message('4')); assert.equal(r.reacted.length, 2);
  await r.send('$start'); r.control.event(message('5')); assert.equal(r.reacted.length, 3);
  r.control.event({ type: 'ACCOUNT_SWITCH' }); r.tick(10000); r.control.event(message('6')); assert.equal(r.reacted.length, 3);
  r.control.unload(); r.send('$help'); assert.equal(r.outbound.length, 1);
});
test('reaction 429 retry delay is respected without retry loops', async () => {
  const r = setup({ accountProfile: 'controls', selfReaction: true }); r.fail({ body: { retry_after: 120 } });
  r.control.event(message('1')); await new Promise(setImmediate); r.tick(60000); r.control.event(message('2')); assert.equal(r.reacted.length, 1);
  r.tick(60000); r.control.event(message('3')); assert.equal(r.reacted.length, 2);
});
test('presence touches only gateway presence frames and unload restores the original method', async () => {
  const r = setup({ accountProfile: 'presence', activityName: 'A game', presenceStatus: 'idle' });
  const socket = new r.Socket('wss://gateway.discord.gg/?v=9');
  const presence = JSON.stringify({ op: 3, d: { status: 'online', activities: [], since: null, afk: false } });
  assert.equal(socket.send(presence), 7); const frame = JSON.parse(r.frames.at(-1)); assert.equal(frame.d.status, 'idle'); assert.equal(frame.d.activities[0].name, 'A game'); assert.equal(frame.d.afk, false);
  for (const data of [JSON.stringify({ op: 2, d: { token: 'never-copy' } }), 'not JSON', JSON.stringify({ op: 1, d: 13 })]) { socket.send(data); assert.equal(r.frames.at(-1), data); }
  new r.Socket('wss://example.com').send(presence); assert.equal(r.frames.at(-1), presence);
  await r.send('$stop'); socket.send(presence); assert.equal(r.frames.at(-1), presence);
  r.control.unload(); assert.equal(r.Socket.prototype.send, r.originalSend);
});
test('dynamic activity and status override commands update presence frames on the fly', async () => {
  const r = setup({ accountProfile: 'presence', activityName: 'Old Title', presenceStatus: 'idle' });
  const socket = new r.Socket('wss://gateway.discord.gg/?v=9');
  const presence = JSON.stringify({ op: 3, d: { status: 'online', activities: [], since: null, afk: false } });

  await r.send('$activity playing Halo Infinite');
  await r.send('$status_override dnd');
  socket.send(presence);
  const frame = JSON.parse(r.frames.at(-1));
  assert.equal(frame.d.status, 'dnd');
  assert.equal(frame.d.activities[0].name, 'Halo Infinite');
  assert.equal(frame.d.activities[0].type, 0);

  await r.send('$activity listening Music');
  socket.send(presence);
  const streamFrame = JSON.parse(r.frames.at(-1));
  assert.equal(streamFrame.d.activities[0].name, 'Music');
  assert.equal(streamFrame.d.activities[0].type, 2);
});
test('HTML escapes all message-controlled text and never embeds remote media or scripts', () => {
  const context = {}; vm.runInNewContext(html, context);
  const result = context.__ASSAULT_HTML_EXPORT__([{ author: { username: '<img src=x onerror=alert(1)>' }, timestamp: '<bad>', content: '<script>alert(1)</script>&', deleted: true, edits: [{ editedAt: '<date>', content: '<svg/onload=1>' }], attachments: [{ filename: '<file>', url: 'javascript:alert(1)' }, { filename: 'good', url: 'https://example.com/a?a=1&b=2' }] }], '<channel>');
  assert.match(result, /^<!doctype html>/); assert.match(result, /&lt;script&gt;/); assert.match(result, /&lt;img/); assert.match(result, /https:\/\/example.com\/a\?a=1&amp;b=2/);
  assert.doesNotMatch(result, /<script|<img|<svg|href="javascript:/); assert.match(result, /default-src 'none'/); assert.match(result, /<strong>Deleted/); assert.match(result, /Edit history/);
});

test('token guard works with profiles off and does not expose or send the detected secret', async () => {
  const r = setup(); const token = 'mfa.' + 'x'.repeat(40);
  await r.send('accidental ' + token);
  assert.equal(r.outbound.length, 0); assert.match(r.notices.at(-1), /Message blocked/);
  assert.ok(r.notices.every(notice => !notice.includes(token)));
  await r.send('normal text'); assert.equal(r.outbound.length, 1);
  const disabled = setup({ maskTokens: false }); disabled.send(token); assert.equal(disabled.outbound.length, 1);
});
test('presence clear differs from reset and controls-only profiles report unavailable presence', async () => {
  const r = setup({ accountProfile: 'presence', activityName: 'Saved', presenceStatus: 'idle' });
  const socket = new r.Socket('wss://gateway.discord.gg');
  const frame = JSON.stringify({ op: 3, d: { status: 'online', activities: [{ name: 'Discord activity', type: 0 }] } });
  await r.send('$activity clear'); await r.send('$status_override clear'); socket.send(frame);
  assert.equal(JSON.parse(r.frames.at(-1)).d.activities[0].name, 'Discord activity');
  assert.equal(JSON.parse(r.frames.at(-1)).d.status, 'online');
  await r.send('$activity reset'); await r.send('$status_override reset'); socket.send(frame);
  assert.equal(JSON.parse(r.frames.at(-1)).d.activities[0].name, 'Saved'); assert.equal(JSON.parse(r.frames.at(-1)).d.status, 'idle');
  const local = setup({ accountProfile: 'controls' }); await local.send('$activity playing Test'); assert.match(local.notices.at(-1), /presence/);
});
test('own-message reactions honor channel allowlists, configurable intervals and minimum retry spacing', async () => {
  const r = setup({ accountProfile: 'controls', selfReaction: true, reactionChannels: '10', reactionIntervalSeconds: 30 });
  const event = id => ({ type: 'MESSAGE_CREATE', message: { id, channel_id: '10', author: { id: 'self' } } });
  r.control.event(message('ignored')); assert.equal(r.reacted.length, 0);
  r.fail({ body: { retry_after: 1 } }); r.control.event(event('1')); await new Promise(setImmediate);
  r.tick(2000); r.control.event(event('2')); assert.equal(r.reacted.length, 1);
  r.tick(28000); r.control.event(event('3')); assert.equal(r.reacted.length, 2);
  await r.send('$react emoji ✅'); await r.send('$react channels 20'); r.tick(30000);
  r.control.event(event('4')); assert.equal(r.reacted.length, 2);
  r.control.event({ type: 'MESSAGE_CREATE', message: { id: '5', channel_id: '20', author: { id: 'self' } } });
  assert.equal(r.reacted.at(-1)[2].name, '✅');
});

test('local utilities receive the current channel and never become outgoing messages', async () => {
  const calls = []; const r = setup({ accountProfile: 'controls' }, { run: (...args) => { calls.push(args); } });
  await r.send('$search some words'); await r.send('$export json'); await r.send('$privacy typing on');
  assert.equal(r.outbound.length, 0);
  assert.deepEqual(Array.from(calls[0]), ['search', 'some words', 'channel']);
  assert.deepEqual(Array.from(calls[1]), ['export', 'json', 'channel']);
  assert.deepEqual(Array.from(calls[2]), ['privacy', 'typing on', 'channel']);
});
test('rich card enters only existing gateway presence frames and pauses after logout', async () => {
  const r = setup({ accountProfile: 'presence', richPresence: { enabled: true, name: 'Rich card', details: 'Built-in', largeImage: '123', button1Label: 'Docs', button1Url: 'https://example.com', partySize: 1, partyMax: 3 } });
  const socket = new r.Socket('wss://gateway.discord.gg');
  const frame = JSON.stringify({ op: 3, d: { status: 'online', activities: [], afk: false } });
  socket.send(frame); let card = JSON.parse(r.frames.at(-1)).d.activities[0];
  assert.equal(card.details, 'Built-in'); assert.equal(card.assets.large_image, '123'); assert.equal(card.buttons[0], 'Docs');
  await r.send('$rpc details Changed'); socket.send(frame); assert.equal(JSON.parse(r.frames.at(-1)).d.activities[0].details, 'Changed');
  r.control.event({ type: 'LOGOUT' }); socket.send(frame); assert.equal(r.frames.at(-1), frame);
  await r.send('$start'); socket.send(frame); assert.equal(JSON.parse(r.frames.at(-1)).d.activities[0].details, 'Built-in');
});

test('missing message tools report unavailable without forwarding local commands', async () => {
  const r = setup({ accountProfile: 'controls' });
  await r.send('$export history');
  assert.equal(r.outbound.length, 0);
  assert.match(r.notices.at(-1), /Message tools are unavailable/);
});

test('saved simple presence only accepts supported integer activity types', () => {
  for (const type of [0, 2, 3, 5, 1, 4, -1, 2.5, '3', null]) {
    const r = setup({ accountProfile: 'presence', activityName: 'Saved activity', activityType: type });
    const socket = new r.Socket('wss://gateway.discord.gg');
    socket.send(JSON.stringify({ op: 3, d: { status: 'online', activities: [] } }));
    const activity = JSON.parse(r.frames.at(-1)).d.activities[0];
    assert.equal(activity.type, [0, 2, 3, 5].includes(type) ? type : 0);
  }
});
