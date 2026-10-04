import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('android/loader/src/main/assets/rich-presence.js', 'utf8');
function setup(config, resolver, timers = {}) {
  let now = 1700000000000;
  const notices = [], ctx = { setTimeout, clearTimeout, ...timers, Date: class extends Date { static now() { return now; } } };
  vm.runInNewContext(source, ctx);
  const rich = ctx.__ASSAULT_RICH_PRESENCE__({ metro: { findByProps: () => resolver } }, config, value => notices.push(value));
  return { rich, notices, tick: ms => { now += ms; }, card: () => JSON.parse(JSON.stringify(rich.activity())) };
}
test('rich card includes links, images, buttons, party and stable elapsed timestamp', () => {
  const r = setup({ enabled: true, name: 'Project', type: 0, applicationId: '123', details: 'Building', state: 'Testing', detailsUrl: 'https://example.com/details', stateUrl: 'https://example.com/state', largeImage: '456', largeText: 'Cover', smallImage: '789', smallUrl: 'https://example.com/small', button1Label: 'Read', button1Url: 'https://example.com', button2Label: 'Source', button2Url: 'https://example.com/source', partySize: 2, partyMax: 4, timestampMode: 'elapsed' });
  const card = r.card();
  assert.equal(card.application_id, '123'); assert.equal(card.assets.large_image, '456');
  assert.equal(card.assets.small_url, 'https://example.com/small');
  assert.deepEqual(card.buttons, ['Read', 'Source']); assert.deepEqual(card.metadata.button_urls, ['https://example.com', 'https://example.com/source']);
  assert.deepEqual(card.party.size, [2, 4]);
  r.tick(5000); assert.equal(r.card().timestamps.start, card.timestamps.start);
});
test('malformed or unsafe fields do not enter the activity payload', () => {
  const r = setup({ enabled: true, name: 'Card', applicationId: 'not-an-id', detailsUrl: 'javascript:alert(1)', largeImage: 'unsafe', button1Label: 'Bad', button1Url: 'http://example.com', partySize: 3, partyMax: 1, timestampMode: 'custom', startTime: '2000', endTime: '1000' });
  const card = r.card();
  for (const key of ['application_id', 'details_url', 'buttons', 'metadata', 'assets', 'party', 'timestamps']) assert.equal(card[key], undefined);
  assert.match(r.rich.status(), /unavailable/);
  assert.equal(setup({ enabled: true, name: 'Stream', type: 1, streamUrl: 'https://example.com' }).card(), null);
  assert.equal(setup({ enabled: true, name: 'Stream', type: 1, streamUrl: 'https://www.twitch.tv/example' }).card().url, 'https://www.twitch.tv/example');
});
test('asset resolution is bounded and pending results cannot revive an unloaded card', async () => {
  let finish, calls = 0;
  const r = setup({ enabled: true, name: 'Card', applicationId: '123', largeImage: 'cover' }, { fetchAssetIds: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  r.rich.command('refresh'); assert.equal(calls, 1);
  r.rich.unload(); finish(['999']); await new Promise(setImmediate);
  assert.equal(r.card(), null);
});
test('session card edits, clear/reset, custom times and resolved keys are usable', async () => {
  const r = setup({ enabled: true, name: 'Card', details: 'Saved', applicationId: '123', largeImage: 'cover', timestampMode: 'custom', startTime: '1700000000000', endTime: '1700000005000' }, { fetchAssetIds: async () => ['mp:external/example'] });
  await new Promise(setImmediate);
  assert.equal(r.card().assets.large_image, 'mp:external/example');
  assert.equal(r.card().timestamps.end, 1700000005000);
  r.rich.command('details Session'); assert.equal(r.card().details, 'Session');
  r.rich.command('clear'); assert.equal(r.card(), null);
  r.rich.command('reset'); assert.equal(r.card().details, 'Session');
  r.rich.reset(); assert.equal(r.card().details, 'Saved');
  r.rich.command('preview'); assert.match(r.notices.at(-1), /"name": "Card"/);
});

test('a stalled asset resolver times out and allows an explicit retry', async () => {
  let expire, calls = 0;
  const r = setup({ enabled: true, name: 'Card', applicationId: '123', largeImage: 'cover' }, { fetchAssetIds: () => { calls++; return new Promise(() => {}); } }, { setTimeout(fn) { expire = fn; return 1; }, clearTimeout() {} });
  assert.match(r.rich.status(), /resolving/); expire(); await new Promise(setImmediate);
  assert.match(r.rich.status(), /unavailable/);
  r.rich.command('refresh'); assert.equal(calls, 2); expire(); await new Promise(setImmediate);
});
