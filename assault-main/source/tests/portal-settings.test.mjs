import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAutomodSettings, DEFAULT_AUTOMOD_SETTINGS, validateChatMessage } from '../src/services/automodSettingsStorage.ts';
import { getAutomationConfig, getFleetConfig, saveFleetConfig, generateHumanTypo } from '../src/services/automationStorage.ts';

const storage = new Map();
globalThis.window = {};
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };

test('malformed persisted settings cannot crash controls or silently enable flags', () => {
  storage.set('assault_automod_settings_v1', JSON.stringify({ phishingGuard: 'false', autoReplies: [null, 10], blacklistedKeywords: [null, 7, 'safe'] }));
  const cfg = getAutomodSettings();
  assert.equal(cfg.phishingGuard, true); assert.deepEqual(cfg.blacklistedKeywords, ['safe']);
  assert.doesNotThrow(() => validateChatMessage('hello', cfg));
  storage.set('assault_automation_cfg_v1', JSON.stringify({ wpm: null, agct: null, reactions: { reactTargets: null }, prefix: '' }));
  const automation = getAutomationConfig();
  assert.equal(automation.prefix, '$'); assert.deepEqual(automation.wpm.normalWpmRange, [80,120]);
  assert.equal(typeof automation.agct.enabled, 'boolean');
});

test('filter accepts legitimate invite and gift domains; rejects scam patterns and blocks auto replies on blocked input', () => {
  const cfg = structuredClone(DEFAULT_AUTOMOD_SETTINGS); cfg.keywordFilter = false;
  assert.equal(validateChatMessage('https://discord.gg/example', cfg).blocked, false);
  assert.equal(validateChatMessage('https://discord.gift/example', cfg).blocked, false);
  assert.equal(validateChatMessage('https://steamcommunlty.example/offer', cfg).blocked, true);
  assert.equal(validateChatMessage('https://steamcommunity.com/example', cfg).blocked, false);
  cfg.autoReplies = [{id:'a', enabled:true, trigger:'claim-nitro', reply:'reply'}];
  const result = validateChatMessage('claim-nitro', cfg);
  assert.equal(result.blocked, true); assert.equal(result.autoReply, undefined);
  cfg.phishingGuard = false; cfg.keywordFilter = true; cfg.blacklistedKeywords = ['!secret!'];
  assert.equal(validateChatMessage('before !secret! after', cfg).sanitizedContent, 'before **** after');
});

test('defaults are independent; fleet credentials stay in memory and roster persists', () => {
  storage.clear();
  const first = getAutomationConfig(); first.wpm.normalWpmRange[0] = 1;
  assert.equal(getAutomationConfig().wpm.normalWpmRange[0], 80);
  const fleet = getFleetConfig(); fleet.fleetAccounts[0].avatarUrl = 'https://example.test/avatar.png'; fleet.fleetAccounts[0].token = 'synthetic-test-credential';
  assert.equal(saveFleetConfig(fleet), true);
  assert.ok(!storage.get('assault_fleet_cfg_v1').includes('synthetic-test-credential'));
  assert.equal(getFleetConfig().fleetAccounts[0].token, 'synthetic-test-credential');
  assert.equal(getFleetConfig().fleetAccounts[0].avatarUrl, 'https://example.test/avatar.png');
  assert.equal(getFleetConfig().rpcSlots[1].album, 'ASTROWORLD');
  assert.equal(generateHumanTypo('unchanged words', 0), 'unchanged words');
});
