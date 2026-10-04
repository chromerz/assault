import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Exercise the actual pinned source and the exact patch used by Gradle.
const dependency = JSON.parse(await readFile('scripts/android-dependencies.json')).find(d => d.path.endsWith('/revenge.js'));
let upstream;
try { upstream = await readFile(dependency.path); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const response = await fetch(dependency.url, { signal: AbortSignal.timeout(120000) });
  assert.equal(response.ok, true, `Runtime download: ${response.status}`);
  upstream = Buffer.from(await response.arrayBuffer());
}
assert.equal(createHash('sha256').update(upstream).digest('hex'), dependency.sha256);
const temporary = await mkdtemp(join(tmpdir(), 'assault-storage-'));
let patched;
try {
  const source = join(temporary, 'revenge.js');
  const output = join(temporary, 'runtime.js');
  await writeFile(source, upstream);
  const result = spawnSync('python3', ['scripts/patch_runtime.py', source, output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  patched = await readFile(output, 'utf8');
  const syntax = spawnSync(process.execPath, ['--check', output], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
  await writeFile(source, Buffer.concat([upstream, Buffer.from('\n')]));
  const corrupt = spawnSync('python3', ['scripts/patch_runtime.py', source, output], { encoding: 'utf8' });
  assert.notEqual(corrupt.status, 0);
  assert.match(corrupt.stderr, /checksum mismatch/);
} finally { await rm(temporary, { recursive: true, force: true }); }

function asyncGenerator(fn) {
  return async function (...args) {
    const iterator = fn.apply(this, args);
    let step = iterator.next();
    while (!step.done) {
      try { step = iterator.next(await step.value); }
      catch (error) { step = iterator.throw(error); }
    }
    return step.value;
  };
}
class Emitter {
  listeners = { GET: new Set(), SET: new Set(), DEL: new Set() };
  on(event, listener) { this.listeners[event].add(listener); }
  off(event, listener) { this.listeners[event].delete(listener); }
  emit(event, data) { for (const listener of this.listeners[event]) listener(event, data); }
}
// Model render/effect separation, dependency changes and cleanup without a device.
function harness(source = patched) {
  let effect, previous, cleanup, updates = 0;
  const React = {
    useReducer: () => [0, () => updates++],
    useEffect: (fn, deps) => {
      if (!previous || deps.some((dep, i) => dep !== previous[i])) effect = { fn, deps };
    },
  };
  const context = vm.createContext({ React, Emitter, _async_to_generator: asyncGenerator });
  vm.runInContext('var emitterSymbol = Symbol.for("vendetta.storage.emitter"); var syncAwaitSymbol = Symbol.for("vendetta.storage.accessor");', context);
  vm.runInContext(source.slice(source.indexOf('  function createProxy(target = {})'), source.indexOf('  var import_react_native, emitterSymbol')), context);
  return {
    context,
    commit() { if (effect) { cleanup?.(); previous = effect.deps; cleanup = effect.fn(); effect = undefined; } },
    unmount() { cleanup?.(); },
    get updates() { return updates; },
  };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('the unmodified pinned runtime reproduces the reported first-render crash', () => {
  const { context: c } = harness(upstream.toString());
  const store = c.wrapSync(new Promise(() => {}));
  assert.throws(() => c.useProxy(store), /storage\?\.\[emitterSymbol\] is undefined/);
});

test('the developer predicate renders through React before and after storage loads', async () => {
  const { context: c } = harness();
  c.React = React;
  const load = deferred();
  c.settings = c.wrapSync(load.promise);
  const predicate = patched.match(/usePredicate: (\(\) => useProxy\(settings\)\.developerSettings \?\? false)/)[1];
  const usePredicate = vm.runInContext(predicate, c);
  function SettingHookHarness() {
    return React.createElement('span', null, usePredicate() ? 'visible' : 'hidden');
  }
  assert.equal(renderToStaticMarkup(React.createElement(SettingHookHarness)), '<span>hidden</span>');
  load.resolve(c.createProxy({ developerSettings: true }).proxy);
  await c.awaitStorage(c.settings);
  assert.equal(renderToStaticMarkup(React.createElement(SettingHookHarness)), '<span>visible</span>');
});

test('pending settings render, hydrate and resubscribe to persisted changes', async () => {
  const h = harness(), c = h.context, load = deferred();
  const writes = [];
  const storage = c.wrapSync(c.createStorage({ get: () => load.promise, set: data => writes.push(JSON.stringify(data)) }));
  assert.equal(c.useProxy(storage).developerSettings ?? false, false);
  assert.equal(c.useStorageState(storage).status, 'loading');
  h.commit();
  assert.throws(() => { storage.developerSettings = true; }, /Await storage/);
  assert.throws(() => { delete storage.developerSettings; }, /Await storage/);
  assert.equal(writes.length, 0);
  load.resolve({ developerSettings: true, nested: { value: 1 } });
  await c.awaitStorage(storage);
  assert.ok(h.updates >= 2, 'hydration notifies mounted predicates');
  assert.equal(c.useProxy(storage).developerSettings, true);
  assert.equal(c.getStorageState(storage).status, 'ready');
  h.commit();
  const before = h.updates;
  storage.developerSettings = false;
  storage.nested.value = 2;
  storage.nested = null;
  assert.equal(h.updates, before + 3);
  assert.deepEqual(JSON.parse(writes.at(-1)), { developerSettings: false, nested: null });
  assert.equal(JSON.parse(JSON.stringify(storage)).developerSettings, false);
  h.unmount();
  storage.developerSettings = true;
  assert.equal(h.updates, before + 3);
});

test('hydration between render and effects is observed, and switching stores cleans subscriptions', async () => {
  const h = harness(), c = h.context, load = deferred();
  const store = c.wrapSync(load.promise);
  c.useProxy(store);
  load.resolve(c.createProxy({ enabled: true }).proxy);
  await c.awaitStorage(store);
  h.commit();
  assert.equal(h.updates, 1, 'effect catches the missed hydration event');
  assert.equal(c.useProxy(store).enabled, true);
  h.commit();
  const second = c.createProxy({ enabled: false }).proxy;
  c.useProxy(second);
  h.commit();
  const before = h.updates;
  store.enabled = false;
  assert.equal(h.updates, before);
  second.enabled = true;
  assert.equal(h.updates, before + 1);
  h.unmount();
});

test('load errors settle awaiters and remain inspectable without overwriting storage', async () => {
  const h = harness(), c = h.context, load = deferred();
  let writes = 0;
  const storage = c.wrapSync(c.createStorage({ get: () => load.promise, set: () => writes++ }));
  c.useStorageState(storage);
  h.commit();
  const failure = new Error('native read failed');
  load.reject(failure);
  await assert.rejects(c.awaitStorage(storage), error => error === failure);
  await tick();
  assert.equal(c.useStorageState(storage).status, 'error');
  assert.equal(c.getStorageState(storage).error, failure);
  assert.throws(() => { storage.value = 1; }, error => error === failure);
  assert.equal(writes, 0);
  // A wrapper with no awaiter also handles its rejected initialization promise.
  const unattended = c.wrapSync(Promise.reject(failure));
  await tick();
  assert.equal(c.getStorageState(unattended).status, 'error');
});

test('invalid persisted roots and unproxied hook arguments fail explicitly', async () => {
  const { context: c } = harness();
  for (const data of [null, false, 3, 'plain', undefined]) {
    let writes = 0;
    await assert.rejects(c.createStorage({ get: async () => data, set: () => writes++ }), /JSON object or array/);
    assert.equal(writes, 0);
  }
  for (const data of [null, undefined, {}]) assert.throws(() => c.useProxy(data), /requires storage/);
  await assert.rejects(c.awaitStorage(c.wrapSync(Promise.resolve({}))), /promise of proxied storage/);
  await assert.rejects(c.awaitStorage({}), /requires a proxied store/);
  const store = await c.createStorage({ get: async () => ({ enabled: false }), set() {} });
  await c.awaitStorage(store);
  assert.equal(c.getStorageState(store).status, 'ready');
});

test('plugin cards subscribe to the registry across uninstall and reinstall', () => {
  const h = harness(), c = h.context;
  c.VdPluginManager = { plugins: c.createProxy({ example: { enabled: true } }).proxy };
  vm.runInContext(patched.slice(patched.indexOf('  function unifyVdPlugin('), patched.indexOf('  var init_vendetta =')), c);
  const plugin = c.unifyVdPlugin({ id: 'example', manifest: {} });
  plugin.usePluginState();
  h.commit();
  delete c.VdPluginManager.plugins.example;
  assert.equal(plugin.isInstalled(), false);
  assert.doesNotThrow(() => plugin.usePluginState());
  c.VdPluginManager.plugins.example = { enabled: false };
  assert.equal(plugin.isInstalled(), true);
  assert.ok(h.updates >= 3);
});

test('runtime startup waits for every legacy settings store before publishing UI', async () => {
  for (const fail of [false, true]) {
    const { context: c } = harness();
    const loads = Array.from({ length: 5 }, deferred);
    const stores = loads.map(load => c.wrapSync(load.promise));
    [c.settings, c.loaderConfig, c.themes, c.fonts] = stores;
    c.VdPluginManager = { plugins: stores[4], initPlugins: () => Promise.resolve(() => {}) };
    const calls = [];
    for (const name of ['initThemes', 'injectFluxInterceptor', 'patchSettings', 'patchCommands', 'patchJsx', 'initVendettaObject', 'initFetchI18nStrings', 'initSettings', 'fixes_default', 'patchErrorBoundary', 'updatePlugins', 'initDebugger', 'initPlugins', 'updateFonts']) c[name] = () => { calls.push(name); };
    c.unload = []; c.lib_exports = {}; c.logger = { log() {} };
    const start = patched.indexOf('      src_default = () =>');
    const end = patched.indexOf('\n    }\n  });', start);
    vm.runInContext(patched.slice(start, end), c);
    const running = c.src_default();
    for (const load of loads.slice(0, -1)) load.resolve(c.createProxy({}).proxy);
    await tick();
    assert.deepEqual(calls, []);
    if (fail) {
      loads.at(-1).reject(new Error('cannot read plugins'));
      await assert.rejects(running, /cannot read plugins/);
      assert.deepEqual(calls, []);
    } else {
      loads.at(-1).resolve(c.createProxy({}).proxy);
      await running;
      assert.ok(calls.includes('initSettings'));
      assert.ok(calls.includes('patchSettings'));
    }
  }
});


test('startup failure preserves the original diagnostic when native client info is absent or throws', async () => {
  const start = patched.indexOf('  function initializeRevenge() {');
  const end = patched.indexOf('  if (typeof globalThis.__r', start);
  for (const [module, expectedBuild] of [[undefined, 'unknown'], [{getConstants() {throw new Error('secondary failure');}}, 'unknown'], [{getConstants:()=>({Build:'12345'})}, '12345']]) {
    const alerts = [];
    const context = {console: {log(){}}, alert: text=>alerts.push(text),
      _async_to_generator: fn => () => Promise.resolve(fn().next().value),
      init_caches() {throw new Error('original-startup-failure');}, init_modules(){},
      modules_exports:{NativeClientInfoModule:module}, __toCommonJS: x=>x};
    vm.runInNewContext(patched.slice(start,end),context);
    await context.initializeRevenge();
    assert.equal(alerts.length,1); assert.match(alerts[0],/original-startup-failure/);
    assert.ok(alerts[0].includes(`Build Number: ${expectedBuild}`));
  }
});
