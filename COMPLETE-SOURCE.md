# Complete changed source — Android code runner

Paths are relative to `assault-main/source/`. Full file contents, including retained earlier work.

## core/index.js

````js
import { AddonManager } from '../plugins/index.js';
import { nativeTheme } from '../themes/index.js';
import { Journal } from '../utils/store.js';
import { nativeBridge } from './bridge.js';
import { createScreens } from './screens.js';
import { ScriptManager } from './scripts.js';
import { createScriptScreen } from './script-screen.js';
import { message } from '../utils/validation.js';
let screens, failure, api;
globalThis.__ASSAULT_ADDONS__ = {
  async initialize(vendetta, applyTheme, files) {
    api = vendetta;
    try {
      const rn = api.metro.common.ReactNative;
      if (!files?.readFile || !files?.writeFile || !files?.fileExists) throw new Error('This Discord version does not expose compatible addon storage.');
      const bridge = nativeBridge(files, rn.Linking);
      screens = {};
      let addonManager;
      try {
        const manager = new AddonManager(new Journal(bridge.io), {
          notify: text => api.ui.toasts.showToast(text), report: text => rn.Alert.alert('Addons', text),
          canActivate: () => !api.settings.safeMode?.enabled,
          applyTheme: record => { if (record && api.settings.safeMode?.enabled) throw new Error('Themes are paused in safe mode.'); return applyTheme(nativeTheme(record)); }
        });
        await manager.start();
        addonManager = manager;
        Object.assign(screens, createScreens(api, manager, bridge));
      } catch (error) { failure = message(error); console.error('[Assault addons]', failure); }
      try {
        const runner = nativeBridge(files, rn.Linking, 'script');
        const scripts = new ScriptManager(bridge.io, runner, () => !api.settings.safeMode?.enabled);
        await scripts.start();
        screens.script = createScriptScreen(api, scripts, bridge, addonManager);
        void scripts.resume();
      } catch (error) {
        const problem = message(error);
        screens.script = () => api.metro.common.React.createElement(rn.Text, { accessibilityRole: 'alert', style: { padding: 24, color: '#ffb0b8', backgroundColor: '#1e1f22' } }, problem);
      }
    } catch (error) { failure = message(error); console.error('[Assault addons]', failure); }
  },
  page(kind) {
    if (screens?.[kind]) return { default: screens[kind] };
    const common = api?.metro?.common ?? { React: globalThis.React, ReactNative: globalThis.ReactNative };
    return { default: () => common.React.createElement(common.ReactNative.Text, { accessibilityRole: 'alert', style: { padding: 24, backgroundColor: '#1e1f22', color: '#ffb0b8', fontSize: 16 } }, failure ?? 'Addon storage is still loading. Reopen this page in a moment.') };
  }
};

````

## core/scripts.js

````js
import { Journal } from '../utils/store.js';
import { ensure, jsonCopy, utf8Size } from '../utils/validation.js';

export const runtimes = { javascript: 'JavaScript', python: 'Python', shell: 'Shell' };
const active = new Set(['starting', 'running', 'stopping', 'unknown']);
const id = () => `s${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
export function scriptValues(value) {
  ensure(value && typeof value.name === 'string' && value.name.trim() && value.name.length <= 80, 'Use a project name of 1–80 characters.');
  ensure(Object.prototype.hasOwnProperty.call(runtimes, value.runtime), 'Choose a supported runtime.');
  ensure(typeof value.source === 'string' && value.source.trim() && utf8Size(value.source) <= 65536, 'Use a nonempty script of at most 64 KiB.');
  const args = typeof value.args === 'string' ? JSON.parse(value.args) : value.args ?? [];
  ensure(Array.isArray(args) && args.length <= 32 && args.every(item => typeof item === 'string' && item.length <= 2048 && !item.includes('\0')), 'Arguments must be a JSON array of at most 32 strings.');
  ensure(utf8Size(JSON.stringify(args)) <= 65536, 'Arguments exceed the 64 KiB encoded limit.');
  const module = value.module ?? 'commonjs';
  ensure(['commonjs', 'esm'].includes(module), 'Choose CommonJS or ES modules.');
  const setup = value.setup ?? '';
  ensure(typeof setup === 'string' && utf8Size(setup) <= 8192, 'Setup commands must be at most 8 KiB.');
  return { name: value.name.trim(), runtime: value.runtime, source: value.source, args, setup, module, restart: value.restart === true };
}

export class ScriptManager {
  constructor(io, bridge, canRun = () => true) {
    this.store = new Journal({ read: name => io.read(name.replace('assault-addons-', 'assault-scripts-')), write: (name, value) => io.write(name.replace('assault-addons-', 'assault-scripts-'), value) });
    this.bridge = bridge; this.canRun = canRun;
    this.data = { format: 1, projects: [] }; this.listeners = new Set(); this.queue = Promise.resolve();
  }
  subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  snapshot = () => this.data;
  emit() { for (const listener of this.listeners) listener(); }
  serial(action) { const next = this.queue.then(action); this.queue = next.catch(() => {}); return next; }
  async commit(data) { await this.store.save(data); this.data = data; this.emit(); }
  validateArchive(value) {
    const saved = jsonCopy(value, 4 * 1024 * 1024);
    ensure(saved.format === 1 && Array.isArray(saved.projects) && saved.projects.length <= 24, 'Script storage is invalid. Existing files are preserved.');
    const identifiers = new Set();
    saved.projects = saved.projects.map(project => {
      ensure(project && typeof project.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(project.id) && !identifiers.has(project.id), 'Script project identifier is invalid.');
      identifiers.add(project.id);
      if (project.run) ensure(typeof project.run.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(project.run.id) && ['starting', 'running', 'stopping', 'stopped', 'exited', 'failed', 'interrupted', 'missing', 'unknown'].includes(project.run.state), 'Script run record is invalid.');
      return { ...project, ...scriptValues(project) };
    });
    return saved;
  }
  async start() {
    const saved = await this.store.load(data => this.validateArchive(data));
    if (saved) this.data = this.validateArchive(saved);
    this.emit();
  }
  async resume() {
    for (const project of this.data.projects) {
      if (!project.restart || !this.canRun()) continue;
      try {
        if (project.run) await this.poll(project.id);
        const latest = this.find(project.id);
        if (!latest.run || !active.has(latest.run.state)) await this.run(project.id);
      } catch { /* Preserve the run for explicit reconciliation in the runner screen. */ }
    }
  }
  check() { return this.serial(() => this.bridge.request('runner', { request: { operation: 'check' } })); }
  find(projectId) { const project = this.data.projects.find(p => p.id === projectId); ensure(project, 'Project no longer exists.'); return project; }
  save(value, projectId) {
    return this.serial(async () => {
      const values = scriptValues(value), data = jsonCopy(this.data, 4 * 1024 * 1024);
      if (projectId) {
        const index = data.projects.findIndex(p => p.id === projectId); ensure(index >= 0, 'Project no longer exists.');
        data.projects[index] = { ...data.projects[index], ...values };
      } else {
        ensure(data.projects.length < 24, 'Export or remove a project before adding another (24 projects maximum).');
        data.projects.push({ ...values, id: id(), createdAt: new Date().toISOString(), run: null });
      }
      await this.commit(data);
      return projectId ?? data.projects[data.projects.length - 1].id;
    });
  }
  run(projectId, setup = false) {
    return this.serial(async () => {
      ensure(this.canRun(), 'Scripts are paused in safe mode.');
      const project = this.find(projectId);
      ensure(!project.run || !active.has(project.run.state), 'Refresh or stop the existing run before starting another.');
      if (setup) ensure(project.setup?.trim(), 'Enter a setup command first.');
      const run = { id: id(), phase: setup ? 'setup' : 'script', state: 'starting', startedAt: new Date().toISOString(), console: '' };
      const data = jsonCopy(this.data, 4 * 1024 * 1024);
      data.projects.find(p => p.id === projectId).run = run;
      await this.commit(data); // Acknowledged durable ID BEFORE dispatch, including crash/timeout recovery.
      try {
        const result = await this.bridge.request('runner', { request: { operation: 'start', project: projectId, run: run.id, runtime: setup ? 'shell' : project.runtime, module: project.module ?? 'commonjs', source: setup ? project.setup : project.source, args: setup ? [] : project.args } });
        await this.record(projectId, result);
      } catch (error) {
        await this.record(projectId, { state: 'unknown', error: `Launch result is unknown. Refresh before retrying. ${error.message}` });
        throw error;
      }
    });
  }
  async record(projectId, result) {
    const data = jsonCopy(this.data, 4 * 1024 * 1024), project = data.projects.find(p => p.id === projectId);
    ensure(project?.run, 'Run no longer exists.');
    ensure(['starting', 'running', 'stopping', 'stopped', 'exited', 'failed', 'interrupted', 'missing', 'unknown'].includes(result.state), 'Invalid runner response.');
    project.run = { id: project.run.id, phase: project.run.phase ?? 'script', startedAt: project.run.startedAt, state: result.state, console: String(result.console ?? project.run.console ?? '').slice(-16384), error: String(result.error ?? '').slice(0, 400), exitCode: Number.isInteger(result.exitCode) ? result.exitCode : null, truncated: result.truncated === true };
    if (JSON.stringify(project.run) !== JSON.stringify(this.find(projectId).run)) await this.commit(data);
  }
  poll(projectId) {
    return this.serial(async () => {
      const project = this.find(projectId); if (!project.run) return;
      const result = await this.bridge.request('runner', { request: { operation: 'poll', project: projectId, run: project.run.id } });
      await this.record(projectId, result);
    });
  }
  control(projectId, operation, text = '') {
    return this.serial(async () => {
      ensure(['stop', 'input'].includes(operation), 'Invalid process control.');
      const project = this.find(projectId); ensure(project.run, 'Start a script first.');
      ensure(utf8Size(JSON.stringify({ operation, data: text })) < 4000, 'Input is too long.');
      await this.bridge.request('runner', { request: { operation, project: projectId, run: project.run.id, data: text } });
    });
  }
  remove(projectId) {
    return this.serial(async () => {
      const project = this.find(projectId);
      ensure(!project.run || !active.has(project.run.state), 'Stop and refresh the run before removing this project.');
      await this.commit({ ...this.data, projects: this.data.projects.filter(p => p.id !== projectId) });
    });
  }
  export() { return this.serial(async () => JSON.stringify({ format: 'assault-scripts-1', projects: this.data.projects }, null, 2)); }
  restore(text) {
    return this.serial(async () => {
      ensure(this.data.projects.length === 0, 'Restore into an empty project library to preserve existing work.');
      const backup = JSON.parse(text);
      ensure(backup.format === 'assault-scripts-1' && Array.isArray(backup.projects) && backup.projects.length <= 24, 'Invalid script backup.');
      const projects = backup.projects.map(project => ({ ...scriptValues(project), restart: false, id: id(), createdAt: new Date().toISOString(), run: null }));
      await this.commit({ format: 1, projects });
    });
  }
}

````

## core/script-screen.js

````js
import { message } from '../utils/validation.js';
import { readableColor } from './ui.js';
import { runtimes, scriptValues } from './scripts.js';

export function createScriptScreen(api, manager, bridge, addons) {
  const { React: R, ReactNative: N } = api.metro.common, h = R.createElement;
  const blank = runtime => ({ name: '', runtime, source: '', args: '[]', setup: '', module: 'commonjs', restart: false });
  const draftOf = project => ({ name: project.name, runtime: project.runtime, source: project.source, args: JSON.stringify(project.args), setup: project.setup ?? '', module: project.module ?? 'commonjs', restart: project.restart });
  const active = state => ['starting', 'running', 'stopping', 'unknown'].includes(state);
  const defaults = { bg: '#111318', card: '#20232b', text: '#f2f3f5', muted: '#b5bac6', accent: '#a83349', error: '#ffb0b8' };

  const emptyTheme = { entries: [], selectedTheme: null };
  const subscribeTheme = addons?.subscribe ?? (() => () => {}), snapshotTheme = addons?.snapshot ?? (() => emptyTheme);

  function Button({ label, action, disabled = false, colors: c }) {
    const [focus, setFocus] = R.useState(false);
    return h(N.Pressable, { accessibilityRole: 'button', accessibilityLabel: label, accessibilityState: { disabled }, disabled,
      onPress: action, onFocus: () => setFocus(true), onBlur: () => setFocus(false),
      style: ({ pressed }) => ({ minHeight: 48, padding: 12, justifyContent: 'center', borderRadius: 10, backgroundColor: c.accent, borderWidth: 2, borderColor: focus || pressed ? readableColor(c.accent) : c.accent, opacity: disabled ? 0.5 : 1 }) },
    h(N.Text, { style: { color: readableColor(c.accent), fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 } }, label));
  }

  return function ScriptScreen({ navigation } = {}) {
    const data = R.useSyncExternalStore(manager.subscribe, manager.snapshot, manager.snapshot);
    const theme = R.useSyncExternalStore(subscribeTheme, snapshotTheme, snapshotTheme);
    const palette = theme.entries.find(item => item.manifest.id === theme.selectedTheme)?.manifest.colors ?? {};
    const c = { ...defaults, bg: palette.BACKGROUND_PRIMARY ?? defaults.bg, card: palette.BACKGROUND_SECONDARY ?? defaults.card, accent: palette.BRAND_500 ?? defaults.accent };
    c.text = readableColor(c.bg, palette.TEXT_NORMAL ?? defaults.text);
    c.muted = readableColor(c.bg, palette.TEXT_MUTED ?? defaults.muted);
    c.cardText = readableColor(c.card, palette.TEXT_NORMAL ?? defaults.text);
    c.cardMuted = readableColor(c.card, palette.TEXT_MUTED ?? defaults.muted);
    c.error = readableColor(c.bg, defaults.error);
    c.cardError = readableColor(c.card, defaults.error);
    const [runtime, setRuntime] = R.useState('javascript'), [selected, setSelected] = R.useState(null);
    const [draft, setDraft] = R.useState(blank('javascript')), [baseline, setBaseline] = R.useState(blank('javascript'));
    const [pending, setPending] = R.useState(''), [error, setError] = R.useState(''), [notice, setNotice] = R.useState(''), [stdin, setStdin] = R.useState('');
    const locked = R.useRef(false), mounted = R.useRef(false), leaving = R.useRef(false);
    const dirty = JSON.stringify(draft) !== JSON.stringify(baseline), busy = Boolean(pending);
    const project = data.projects.find(item => item.id === selected);
    const text = (value, style = {}) => h(N.Text, { style: { color: c.text, fontSize: 16, ...style } }, value);
    const button = (label, action, disabled = false) => h(Button, { label, action, disabled: busy || disabled, colors: c });
    const input = (label, value, change, options = {}) => h(N.View, { style: { gap: 6 } }, text(label, { color: c.cardMuted }),
      h(N.TextInput, { accessibilityLabel: label, value, onChangeText: change, editable: !busy, accessibilityState: { disabled: busy }, autoCorrect: false, autoCapitalize: 'none', maxLength: 65536,
        style: { minHeight: 48, borderColor: c.muted, borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: c.bg, color: c.text, fontSize: 16, ...(options.multiline ? { minHeight: 200, textAlignVertical: 'top', fontFamily: 'monospace' } : {}) }, ...options }));
    R.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    async function run(label, action) {
      if (locked.current || !mounted.current) return;
      locked.current = true; setPending(label); setError(''); setNotice('');
      try { await action(); }
      catch (failure) { if (mounted.current) setError(message(failure)); }
      finally { locked.current = false; if (mounted.current) setPending(''); }
    }
    function leave(action) {
      if (locked.current) return;
      if (!dirty) { action(); return; }
      N.Alert.alert('Discard unsaved script changes?', 'Save your project before switching to keep these edits.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => { if (mounted.current && !locked.current) action(); } },
      ]);
    }
    R.useEffect(() => {
      const unsubscribe = navigation?.addListener?.('beforeRemove', event => {
        if (leaving.current) { leaving.current = false; return; }
        if (!dirty && !locked.current) return;
        event.preventDefault(); leave(() => { leaving.current = true; navigation.dispatch(event.data.action); });
      });
      const back = N.BackHandler?.addEventListener('hardwareBackPress', () => {
        if (locked.current) return true;
        if (!dirty) return false;
        leave(() => { leaving.current = true; navigation?.goBack?.(); }); return true;
      });
      return () => { unsubscribe?.(); back?.remove(); };
    }, [dirty, busy, navigation]);
    R.useEffect(() => {
      if (!project?.run || !active(project.run.state)) return;
      let stopped = false, timer;
      const poll = async () => {
        if (!locked.current) {
          try { await manager.poll(project.id); }
          catch (failure) { if (!stopped && mounted.current) setError(message(failure)); }
        }
        if (!stopped) timer = setTimeout(poll, 4000);
      };
      timer = setTimeout(poll, 4000);
      return () => { stopped = true; clearTimeout(timer); };
    }, [project?.id, project?.run?.state]);
    function open(item, nextRuntime = runtime) {
      setSelected(item?.id ?? null);
      const next = item ? draftOf(item) : blank(nextRuntime);
      setRuntime(next.runtime); setDraft(next); setBaseline(next); setError(''); setNotice(''); setStdin('');
    }
    async function save() {
      scriptValues(draft);
      const savedId = await manager.save(draft, selected);
      if (mounted.current) {
        setSelected(savedId); setBaseline({ ...draft }); setNotice('Project saved.');
      }
      return savedId;
    }
    async function importScript() {
      const result = await bridge.request('importScript');
      const language = /\.py$/i.test(result.filename) ? 'python' : /\.sh$/i.test(result.filename) ? 'shell' : 'javascript';
      if (mounted.current) {
        open(null, language);
        setDraft({ ...blank(language), name: result.filename.replace(/\.[^.]+$/, '').slice(0, 80), source: result.data, module: /\.mjs$/i.test(result.filename) ? 'esm' : 'commonjs' });
      }
    }
    return h(N.KeyboardAvoidingView, { style: { flex: 1, backgroundColor: c.bg }, behavior: N.Platform?.OS === 'ios' ? 'padding' : 'height' },
      h(N.ScrollView, { keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'on-drag', contentContainerStyle: { padding: 16, paddingBottom: 48, gap: 14 } },
        text('Code runner', { fontSize: 26, fontWeight: '800' }),
        text('Run trusted scripts in Termux. Projects keep their own working directory. Enable execution in Manager → Code runner setup first.', { color: c.muted, lineHeight: 23 }),
        h(N.View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } }, ...Object.entries(runtimes).map(([name, label]) => h(N.Pressable, {
          key: name, accessibilityRole: 'tab', accessibilityLabel: label, accessibilityState: { selected: runtime === name, disabled: busy }, disabled: busy,
          onPress: () => leave(() => open(null, name)), style: ({ pressed }) => ({ padding: 14, minHeight: 48, borderRadius: 10, backgroundColor: runtime === name ? c.accent : c.card, borderWidth: 2, borderColor: pressed ? readableColor(runtime === name ? c.accent : c.card) : runtime === name ? c.accent : c.muted }),
        }, text(label, { fontWeight: '700', color: readableColor(runtime === name ? c.accent : c.card) })))),
        busy && h(N.View, { accessibilityLiveRegion: 'polite', accessibilityState: { busy: true }, style: { gap: 8 } }, h(N.ActivityIndicator, { color: c.text }), text(pending)),
        error && h(N.Text, { accessibilityRole: 'alert', accessibilityLiveRegion: 'assertive', style: { color: c.error, fontSize: 16 } }, error),
        notice && h(N.Text, { accessibilityLiveRegion: 'polite', style: { color: c.text } }, notice),
        button('Check runtimes', () => run('Checking Termux…', async () => {
          const result = await manager.check();
          if (mounted.current) setNotice(`Python ${result.python} · Node.js ${result.node ? 'available' : 'missing'} · Bash ${result.bash ? 'available' : 'missing'}`);
        })),
        button('Import script file', () => leave(() => run('Importing script…', importScript))),
        button('New project', () => leave(() => open(null))),
        ...data.projects.filter(item => item.runtime === runtime).map(item => h(N.View, { key: item.id }, button(`Open ${item.name}`, () => leave(() => open(item))))),
        data.projects.every(item => item.runtime !== runtime) && text('No saved projects in this tab. Import a file or write a script below.', { color: c.muted }),
        h(N.View, { style: { padding: 16, borderRadius: 16, backgroundColor: c.card, gap: 12 } },
          text(project ? project.name : 'New project', { fontSize: 21, fontWeight: '700', color: c.cardText }),
          dirty && text('Unsaved changes', { color: c.cardMuted }),
          input('Project name', draft.name, name => setDraft(previous => ({ ...previous, name })), { maxLength: 80 }),
          runtime === 'javascript' && button(`JavaScript mode: ${draft.module === 'esm' ? 'ES modules' : 'CommonJS'}`, () => setDraft(previous => ({ ...previous, module: previous.module === 'esm' ? 'commonjs' : 'esm' }))),
          input('Script source', draft.source, source => setDraft(previous => ({ ...previous, source })), { multiline: true }),
          input('Arguments (JSON array)', draft.args, args => setDraft(previous => ({ ...previous, args }))),
          input('Setup command (optional)', draft.setup, setup => setDraft(previous => ({ ...previous, setup })), { multiline: true, maxLength: 8192 }),
          text('For dependencies, use a command such as npm install <package> or python -m pip install <package>. Setup runs only when you tap Run setup, in this project’s working directory.', { color: c.cardMuted, fontSize: 14 }),
          h(N.View, { style: { flexDirection: 'row', gap: 12, alignItems: 'center' } }, text('Restart on client launch', { flex: 1, color: c.cardText }), h(N.Switch, {
            accessibilityLabel: 'Restart on client launch', accessibilityState: { checked: draft.restart, disabled: busy }, value: draft.restart, disabled: busy,
            onValueChange: restart => setDraft(previous => ({ ...previous, restart })), trackColor: { false: c.muted, true: c.accent },
          })),
          text('Opt-in restart checks the previous run first. Safe mode pauses automatic starts. JavaScript uses Node.js with the selected module mode; Python runs unbuffered; Shell uses Bash. Scripts have Termux file and network access.', { color: c.cardMuted, fontSize: 14, lineHeight: 21 }),
          button('Save project', () => run('Saving project…', save)),
          button('Run setup', () => run('Starting setup…', async () => { const projectId = await save(); await manager.run(projectId, true); }), active(project?.run?.state) || !draft.setup.trim()),
          button('Save and run', () => run('Starting script…', async () => { const projectId = await save(); await manager.run(projectId); if (mounted.current) setNotice('Launch submitted. Status appears below.'); }), active(project?.run?.state)),
          project && button('Remove project', () => N.Alert.alert('Remove project?', 'Export first to keep its source. Files generated inside Termux remain in its project directory.', [
            { text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => run('Removing project…', async () => { await manager.remove(project.id); if (mounted.current) open(null); }) },
          ]), active(project?.run?.state))),
        project?.run && h(N.View, { style: { padding: 16, backgroundColor: c.card, borderRadius: 16, gap: 12 } },
          text(`${project.run.phase === 'setup' ? 'Setup' : 'Run'}: ${project.run.state}${project.run.exitCode == null ? '' : ` · exit ${project.run.exitCode}`}`, { fontWeight: '700', color: c.cardText }),
          project.run.error && text(project.run.error, { color: c.cardError }),
          button('Refresh status', () => run('Refreshing run…', () => manager.poll(project.id))),
          button('Stop script', () => run('Requesting stop…', async () => { await manager.control(project.id, 'stop'); await manager.poll(project.id); }), !['running', 'stopping'].includes(project.run.state)),
          h(N.Text, { selectable: true, accessibilityLabel: 'Console output', style: { fontFamily: 'monospace', color: c.text, fontSize: 13, backgroundColor: c.bg, padding: 12 } }, project.run.console || 'No output yet.'),
          text('Showing the latest 16 KiB. Console storage rotates at 1 MiB; write project files for full program output.', { color: c.cardMuted, fontSize: 13 }),
          input('Standard input', stdin, setStdin, { maxLength: 1000 }),
          button('Send input', () => run('Sending input…', async () => { await manager.control(project.id, 'input', `${stdin}\n`); if (mounted.current) { setStdin(''); setNotice('Input queued for the script.'); } }), project.run.state !== 'running')),
        button('Export script projects', () => run('Saving and verifying backup…', async () => { await bridge.request('export', { data: await manager.export() }); if (mounted.current) setNotice('Script backup saved and verified. Includes sources, arguments, preferences and last saved run output; Termux-generated files are separate.'); })),
        button('Restore script projects', () => leave(() => run('Restoring scripts…', async () => { await manager.restore((await bridge.request('restore')).data); if (mounted.current) { open(null); setNotice('Projects restored. Automatic restart is off until you enable it.'); } })))));
  };
}

````

## scripts/patch_runtime.py

````py
#!/usr/bin/env python3
"""Apply reviewed fixes to the checksum-pinned runtime without editing its download."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(source, original, replacement):
    if source.count(original) != 1:
        raise ValueError(f"Expected exactly one runtime patch target: {original[:100]}")
    return source.replace(original, replacement, 1)


def patch_runtime(data):
    dependencies = json.loads((ROOT / "scripts/android-dependencies.json").read_text())
    runtime = next(item for item in dependencies if item["path"].endswith("/revenge.js"))
    if hashlib.sha256(data).hexdigest() != runtime["sha256"]:
        raise ValueError("Runtime checksum mismatch; review patches before changing upstream")
    source = data.decode("utf-8")
    start = source.index("  function useProxy(storage) {")
    end = source.index("  var import_react_native, emitterSymbol", start)
    source = source[:start] + (ROOT / "scripts/runtime-patches/storage-hooks.js").read_text() + source[end:]
    source = replace_once(source, 'if (typeof value === "object") {\n            if (childrens.has(value))',
                          'if (value !== null && typeof value === "object") {\n            if (childrens.has(value))')
    source = replace_once(source, 'src_default = () => _async_to_generator(function* () {\n        yield Promise.all([',
                          'src_default = () => _async_to_generator(function* () {\n'
                          '        yield awaitStorage(settings, loaderConfig, themes, fonts, VdPluginManager.plugins);\n'
                          '        yield Promise.all([')
    source = replace_once(source, 'useProxy(VdPluginManager.plugins[vdPlugin.id]);',
                          'useProxy(VdPluginManager.plugins);')
    source = replace_once(source, 'createMMKVBackend("VENDETTA_SETTINGS")',
                          'createMMKVBackend("VENDETTA_SETTINGS", { developerSettings: false })')
    # These wrappers only forwarded their arguments; keep the same public names.
    for name, argument in (("createProxy", "target"), ("useProxy", "_storage"),
                           ("createStorage", "backend"), ("wrapSync", "store")):
        source = replace_once(source, f'{name}: ({argument}) => {name}({argument}),', f'{name},')
    source = replace_once(source, '            awaitSyncWrapper: (store) => awaitStorage(store),',
                          '            getStorageState,\n            useStorageState,\n'
                          '            awaitSyncWrapper: (store) => awaitStorage(store),')
    source = replace_once(source, 'var { ClientInfoManager } = (init_modules(), __toCommonJS(modules_exports));',
                          'var buildNumber = "unknown";\n'
                          '        try {\n'
                          '          var { NativeClientInfoModule } = (init_modules(), __toCommonJS(modules_exports));\n'
                          '          buildNumber = NativeClientInfoModule?.getConstants?.()?.Build ?? "unknown";\n'
                          '        } catch {}')
    source = replace_once(source, 'Build Number: ${ClientInfoManager.getConstants().Build}', 'Build Number: ${buildNumber}')
    source = replace_once(source, '  function initSettings() {',
                          '  function assaultAddonPage(kind) {\n'
                          '    if (globalThis.__ASSAULT_ADDONS__) return globalThis.__ASSAULT_ADDONS__.page(kind);\n'
                          '    return { default: () => globalThis.React.createElement(globalThis.ReactNative.Text, { accessibilityRole: "alert", style: { padding: 24, backgroundColor: "#1e1f22", color: "#ffb0b8", fontSize: 16 } }, "Addons are unavailable. Restart Discord or reinstall the matching Assault loader.") };\n'
                          '  }\n'
                          '  function initSettings() {')
    source = replace_once(source, '          key: "BUNNY_THEMES",',
                          '          key: "ASSAULT_SCRIPTS",\n'
                          '          title: () => "Code runner",\n'
                          '          icon: findAssetId("PuzzlePieceIcon"),\n'
                          '          render: () => Promise.resolve(assaultAddonPage("script"))\n'
                          '        }, {\n'
                          '          key: "BUNNY_THEMES",')
    # Route both settings pages to the isolated addon managers. No legacy external
    # plugin evaluator is allowed to bypass this boundary, including auto-start.
    source = replace_once(source, '        evalPlugin(plugin) {',
                          '        evalPlugin(plugin) { throw new Error("Legacy plugins require porting to the Assault sandbox API.");')
    source = replace_once(source, '      if (isExternalPlugin(manifest)) {\n        try {',
                          '      if (isExternalPlugin(manifest)) {\n        throw new Error("External plugins must use the Assault sandbox API.");\n        try {')
    source = replace_once(source, 'render: () => Promise.resolve().then(() => (init_Plugins(), Plugins_exports))',
                          'render: () => Promise.resolve(assaultAddonPage("plugin"))')
    source = replace_once(source, 'render: () => Promise.resolve().then(() => (init_Themes(), Themes_exports))',
                          'render: () => Promise.resolve(assaultAddonPage("theme"))')
    source = replace_once(source, '        globalThis.bunny = lib_exports;',
                          '        globalThis.bunny = lib_exports;\n'
                          '        yield globalThis.__ASSAULT_ADDONS__?.initialize(globalThis.vendetta, (data) => updateBunnyColor(data, { update: true }), NativeFileModule);')
    source = replace_once(source, '        VdPluginManager.initPlugins().then((u) => unload.push(u)).catch(() => alert("Failed to initialize Vendetta plugins"));',
                          '        // Legacy external plugin auto-start is disabled; sources must be ported.')
    source = replace_once(source, '        updateThemes().catch((e) => console.error("Failed to update themes", e));',
                          '        // Theme selection is restored by the isolated addon manager.')
    return source


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.write_text(patch_runtime(args.source.read_bytes()), encoding="utf-8")

````

## README.md

````md
# Assault for Android

## 2.12.0 isolated addon candidate

Plugins and Themes now use a bounded JavaScript interpreter, React Native manager/settings screens, local `.js`/`.txt` imports, checksum-verified HTTPS installation, private persistent state, and complete backups with optional cloud upload/restore. Legacy arbitrary plugins must be ported to the new API. See [the addon contract and validation limits](docs/addon-framework.md). Production device acceptance remains required.

Assault Manager is a **native Android app** that downloads Discord's Android APK splits, verifies their signer and version, embeds the Assault loader with LSPatch, and invokes Android's package installer. The installed client runs **Discord's own React Native interface**. There is no WebView client or simulated APK generator.

## 2.11.1 in-app expansion

- **Rich presence builder** in Manager and AS controls: text, application ID, activity type, images, links, two buttons, timestamps, party size and preview. Remote rendering depends on the installed client and Discord support.
- **More local commands** for search, capture, exports, privacy, reactions and presence. A searchable native command guide is available in both apps.
- **JSON saving**, independent privacy filters, outgoing text token guard and bounded ghost-ping retention.

See the [complete in-app guide](docs/in-app-controls.md) and [publish-your-own-release guide](docs/publish-your-release.md).

## Integrated release

Install Manager once: its matching loader is embedded and verified before merging into the client. The Manager shows the prepared client and loader status and verifies prepared file checksums before installation. Older prepared sets must be prepared again to create integrity metadata.

The web portal displays only actual release artifacts, with a local APK checksum checker. It does not connect to a phone or simulate successful installation.

After building, create the distributable ZIP (APKs, buildable source, licenses, checksums and installation instructions):

```bash
npm run release:zip
```

The archive appears under `release/`. No Discord APK or private signing key is included.

## Install

1. Build/download `Assault-Manager.apk` and install it on Android.
2. Tap **Download & prepare client**. Manager fetches the stable base, device ABI, English and density splits automatically.
3. Tap **Install prepared update**, grant permission to install apps from Manager, and confirm Android's prompt.
4. Open Assault and sign in using Discord's native login.

Manager uses `app.assault.manager`. The patched client retains `com.discord` for native component compatibility. The initial patched install cannot update an official Discord installation signed by Discord: Android will report a signing conflict. Remove official Discord manually only after the patched client is ready; doing so clears its local data. Later Assault updates use the same private key and can preserve data. Keep Manager installed and its data intact: clearing it loses that local signing key. There is no key recovery: future updates then require reinstalling the patched client, which clears its local app data.

## Native features

- Discord supplies its native servers, channels, DMs, authentication, voice, media and attachment interface.
- The bundled runtime supplies its existing plugin and theme UI under Discord Settings → Assault. Third-party plugins may depend on a particular Discord version.
- Tap **AS** in the client for Assault controls: session message retention, edit capture, analytics-request blocking and safe mode. Restart Discord after changing a control.
- `/assault` → **export** prepares an HTML transcript for the current channel, including captured edit history and deletion markers. Tap **AS → Save latest HTML transcript** to save it through Android’s document picker. Capture is session-only, defaults to 500 messages / 20 edits and a 4 MiB retained-content budget, and clears on logout or account switch. Native controls offer smaller/larger limits, optional expiry, attachment capture and author-redacted exports. It cannot recover unseen messages or older deleted content.
- **Updates** in client controls opens the separate Manager. Manager checks on launch. Its scheduled job prepares newer client or loader builds; choose 6/24/72-hour checks, unmetered networking and charging requirements. Defaults are daily, unmetered and charging; installation always uses Android confirmation. Android can defer scheduled work.
- Automatic checks and **Check client & manager updates** also read this repository's latest GitHub release. A manager update must be named `Assault-Manager.apk`, have a newer version code, and be signed by the currently installed manager's certificate. New Manager releases are prepared automatically and get their own install button. A published release is required for this path.

The previous React demo's fake Nitro billing, synthetic accounts, fake encryption claims, pretend Smali pipeline and empty 4 KB APKs are no longer the application entry point. Their unreachable source and unused dependencies have been removed. They are **not implemented native functionality**. This build does not claim that every old prototype toggle has been ported.

## Account controls and HTML export (2.8.0)

- One `/assault` command offers **export**, **export-deleted**, **clear**, **clear-all**, **status** and **help**. The former separate command aliases are removed. HTML exports escape message text and attachment names, contain no scripts or remote images, and allow only HTTPS attachment links. Capture errors allow Discord dispatch to continue; counts and stored content are bounded. The budget estimates retained content, not the entire JavaScript heap or temporary export allocations.
- Native controls include hook/theme diagnostics, safe mode, independent native theme colors, left/right AS button placement, crash-report filtering and a native-only mode. Turning off the Assault runtime also turns off all JavaScript features; defaults retain plugins, themes and capture.
- Manager adds preparation cancellation, bounded download retries, storage checks, cleanup that keeps the prepared client and signing identity, event-driven status, and loader-aware updates. Automatic launch checks are cached for six hours; manual checks bypass the cache. Android controls scheduling and confirms installs.
- Black/red vector AS icons cover Manager, the loader and the patched client's default launcher icon, with adaptive and monochrome layers. Discord's optional alternate launcher icons remain selectable. Unsupported native ZIP alignment or default icon layouts fail preparation while preserving the existing prepared client.
- Release R8 optimization and resource shrinking apply to both Android modules. No new runtime dependency was added. The pinned patcher JAR is separated into Java code and opaque injection assets; the single patched `ApkPatcher` source replaces its dependency counterpart. Plugins/themes load only when enabled; native controls are built on demand. Idle UI polling and capture cleanup timers are absent.

Historical 2.7.0 measurement — Manager: **6,200,704 bytes (5.91 MiB)**, down **47.3%** from 11,771,650 bytes. Loader: **144,614 bytes**, up 6,556 bytes for controls, bounded capture and vector resources. Manager savings include removing unused patcher classes; the patcher's heavy build-time code is never injected into Discord. Discord's original libraries and behavior are preserved. See [expansion details](docs/expansion-2.7.md).

### Selecting an account profile

In Manager, open **Account controls → Configure profile**, choose **Local controls** or **Controls + custom presence**, then tap **Apply profile to client**. Confirm inside the client and restart it. You can also edit the same settings directly through **AS → Account controls**. Profiles start **off** and use the existing signed-in client; no account token or extra login is needed.

The supplied scripts' supported controls are adapted into built-in profiles:

- A configurable local prefix (default `$`) handles `help`, `status`, `stop`, `start`, `prefix <value>` and `react on|off` before messages are sent. Unknown commands and ordinary text continue through Discord normally. Prefix changes made by command last for the session; native settings hold the defaults.
- Optional reactions to **your own new messages**, deduplicated and limited to one per ten seconds. Server retry delays are respected; there are no retry loops. Availability is shown by the status command.
- The presence profile can set a Playing activity and online/idle/DND/invisible status on Discord's next existing gateway presence update. It does not open another connection, alter identify credentials, spoof Spotify/console sessions or change notification settings. Some client versions may not expose this hook; verify the status from another device.
- Logout or account switch pauses controls. `$start` resumes them explicitly. Capture still clears on logout/account switch.

These profiles are **not an arbitrary Node-script runner**. Node filesystem/HTTP servers, token fleets, multi-account voice joining, targeted spam, group renaming/deletion and fabricated quest progress/reward claims are not included. Discord's ordinary voice UI and the existing plugin/theme system remain available. Original runtime APIs, module identifiers, update URLs and license notices are preserved; only selected display labels use Assault branding.

HTML is prepared in the client's private cache. **Save latest HTML transcript** snapshots that file before opening the document picker. Canceling leaves the latest cached transcript available for retry. Clear-all/logout removes the latest cached export; files you have already saved are yours to manage. HTML displays deletion markers, edit history and optional captured attachments, and respects author-redaction settings.

## Build

Requirements: Java 21, Python 3.9+, Android SDK platform 36 and build-tools 36.0.0. The committed Gradle wrapper pins Gradle 8.13 and its checksum.

```bash
export ANDROID_HOME=/path/to/android-sdk
npm ci
npm run build:android
npm test
npm run build
npm run dev
```

`build:android` verifies pinned dependency SHA-256 values, builds Manager and its embedded loader, runs Android lint and verifies the APK signature. It writes `public/releases/Assault-Manager.apk`, an immutable content-hash APK for portal downloads, and an atomically switched manifest. Retain the immutable APKs while old download links are in use. These outputs are ignored by Git. No Discord APK is redistributed by this repository; Manager fetches and verifies it on-device. Release builds use a persistent private key at `$HOME/.local/share/assault/signing/manager.p12` with a protected password file beside it. Back up this directory securely before moving build environments. CI can supply `ASSAULT_KEYSTORE_PATH` and `ASSAULT_SIGNING_PASSWORD` (alias `assault`) to reuse the same identity. Never commit or distribute signing material. A different signing key cannot update an existing Manager installation.

The web app at port 3000 is a **download portal**. It serves actual generated artifacts and reports an unavailable build until Android compilation succeeds. It does not proxy Discord credentials or pretend to run Discord in an iframe.

See [Android build, install and release instructions](docs/android-build-release.md) for all four APK variants, reinstall commands, device checks, and the tag-triggered GitHub Releases workflow. Configure `ASSAULT_KEYSTORE_BASE64` and `ASSAULT_SIGNING_PASSWORD` as repository Actions secrets before pushing a version tag.

## Source and trust

- [LSPatch v1.2](https://github.com/JingMatrix/LSPatch/tree/v1.2): native APK patcher and embedded runtime, GPL-3.0.
- [Revenge v1.11.6](https://github.com/revenge-mod/revenge-bundle/tree/v1.11.6): native React Native plugin/theme runtime, BSD-3-Clause.
- Xposed API 82: compile-only API, Apache-2.0.
- Exact dependencies and checksums: `scripts/android-dependencies.json`. License texts: `android/licenses/`.

The new Android implementation is provided under GPL-3.0; see `android/LICENSE`. Revenge and Xposed retain their own notices. The code does not imply endorsement by these projects.

Base downloads currently use `tracker.vendetta.rocks`, the mirror used by the upstream manager. Every APK must verify cryptographically, match package `com.discord` and the requested version, and match the pinned baseline signer `3c39d23cf9367849a5c699395647fe0e5bfea5a1f1f40d8c717ddc70f8bfa113`. The pin was obtained from the verified 347012 baseline APK. If Discord rotates its signing key, update the pin only after verifying the new identity. Network failures, incompatible versions and signature failures are shown as errors; no fabricated success is returned.

## Validation scope

Build, lint, signature verification, native patching and wrapper regression checks can run without a phone. Real login, voice, notifications, plugin compatibility and Android install confirmation require device validation. Targeting SDK 36 alone does not establish complete Android 16 compatibility. See `docs/android-validation.md` for the observed results and remaining checks.

The floating **AS** control can be dragged to a saved position. Tap it to open controls; **Reset AS button position** restores its default left/right placement.

AS settings use native grouped cards with system light/dark colors, scalable text and touch targets. The panel adapts to the current phone/tablet or multi-window area; the draggable button stays inside visible bounds, including the keyboard and display cutouts. Android 9 (API 28) remains the minimum. OEM skins, unusual fold/hinge layouts and every Android version cannot be certified from the available emulator.

### Android script runner

See [Code runner setup and behavior](docs/code-runner.md) for the Termux-backed JavaScript, Python and Shell tabs, per-project dependencies, persistence and process controls. Rebuild Manager and prepare the client again for the new bridge.

````

## docs/code-runner.md

````md
# Android code runner

The native client has **Settings → Assault → Code runner**, with JavaScript, Python and Shell tabs. This is separate from restricted addon plugins and from the release portal's simulated terminal.

## Setup

1. Install the matching Manager APK, prepare the client again, and install that prepared update. The client manifest needs the new, targeted Manager package query. Preserve Manager app data and its client signing key.
2. Install and open [Termux](https://github.com/termux/termux-app#installation). Follow its installation guidance for compatible Android releases and distribution signatures. Run in Termux:

   ```sh
   pkg install python nodejs bash
   mkdir -p ~/.termux
   printf '\nallow-external-apps=true\n' >> ~/.termux/termux.properties
   termux-reload-settings
   ```

3. In **Manager → Code runner setup**, enable execution and grant the Termux execution permission. If Android permanently denied it, Grant permission opens Manager’s app settings so you can restore access. This is the only new Android permission (`com.termux.permission.RUN_COMMAND`); no new application library is required.
4. In the client's Code runner, tap **Check runtimes**, then create or import a project. `.txt` files are JavaScript source, `.mjs` selects JavaScript ES modules, `.py` selects Python, and `.sh` selects Bash. Importing never executes a file.
5. Save and run. JavaScript executes as Node.js CommonJS (`main.cjs`) or ES modules (`main.mjs`), selected in the editor, Python as `main.py` with unbuffered output, and shell scripts as `main.sh`. Arguments are a JSON array (at most 64 KiB encoded), passed directly as separate arguments.

## Dependencies, input and stopping

An optional **Setup command** runs Bash in that project's directory only when **Run setup** is tapped. For example, `npm install package-name` or `python -m pip install package-name`. Review dependency commands as code. Android/Termux does not support every desktop/native package; installation errors appear in the console with an exit code. An npm setup can create and retain `package.json`, lockfiles and `node_modules` in the project directory.

Each project's working directory is `~/.local/share/assault-runner/projects/<project-id>` inside Termux. Normal script runs preserve other project files. Standard input is line-based; this is a pipe console, not a PTY for curses/full-screen interactive programs. Stop sends SIGTERM to the script's process group, then SIGKILL after two seconds if necessary. A separate guard terminates the group when its supervisor disappears. Android may terminate Termux processes; this is reported as interrupted after reconciliation, not a successful completion.

Only one run per project is accepted. A launch ID is committed to the client's two-slot journal before dispatch, and retries with that ID are idempotent. Unknown/starting/running/stopping runs must be refreshed or stopped before a new launch. Multiple projects can run independently; broker commands are serialized on a dedicated runner mailbox. Script startup and polling do not occupy plugin/theme file operations. The screen polls while a run is active; Refresh also reconciles state after reopening. Already-started work continues if the settings screen closes.

## Persistence and backups

Project source, names, arguments, module mode, setup commands, restart preferences and the most recently saved run status/output persist in `assault-scripts-0.json` and `assault-scripts-1.json`, independently of addons. Saving verifies disk readback. **Export script projects** exports the complete project registry, using the existing close-and-readback-verified Android document export. Document operations have a 60-second native deadline, release the UI session on timeout, request provider cancellation and reject late results. Providers control underlying I/O cancellation; retry with another provider if one stays unresponsive. These backups do **not** contain files generated by scripts in Termux: back those up separately from Termux. Do not paste credentials into source if you intend to share its exported backup.

Restore requires an empty library. Restored projects receive new identities and have automatic restart disabled; archived processes are never treated as live. **Restart on client launch** is opt-in per project, checks the old run first, and is suppressed by Discord safe mode. Disabling execution in Manager prevents new starts/input; status and stop remain available while Termux permission remains granted.

The editor accepts scripts up to 64 KiB, setup up to 8 KiB, and 24 saved projects, within the existing journal limits. Console reads show the latest 16 KiB and the supervisor rotates its log at 1 MiB. This keeps rendering and IPC bounded. Termux keeps up to ten run snapshots/logs per project under `~/.local/share/assault-runner/runs`, pruning older completed runs under the launch lock. Active runs and project-generated files are preserved; deleting a project in Discord preserves generated Termux files. Use project files for complete application output. These limits do not change attachment exports.

## Trust boundary

Scripts are trusted user programs with Termux's filesystem and network permissions, not sandboxed addon code. The runner never evaluates arbitrary source in Discord's JavaScript engine, and never supplies the signed-in Discord account credentials. The addon interpreter's API whitelist remains intact.

Manager exposes a broker provider. Every call checks the Binder UID, rejects shared-UID impersonation, and compares the actual installed `com.discord` certificate against Manager's private client-signing keystore. Official Discord and clients signed by another Manager are rejected. Explicit, one-shot PendingIntents deliver Termux results to a non-exported receiver; request/result sizes and waiting time are bounded. Source crosses Binder as base64 to bound JSON-escaping expansion. No shell interpolation is used to transport source or arguments. The helper implements the official [Termux RUN_COMMAND interface](https://github.com/termux/termux-app/wiki/RUN_COMMAND-Intent).

## Verification and device gates

Run from `assault-main/source`:

```sh
ANDROID_HOME=/path/to/android-sdk mise exec java@21 -- node --test tests/scripts.test.mjs tests/script-screen.test.mjs tests/script-runner.test.mjs tests/script-trust.test.mjs tests/addon-documents.test.mjs tests/storage-runtime.test.mjs
npm run build:addons
python3 scripts/build_android.py
```

Host tests execute actual Node/Python/Bash processes, including stdin, working-directory persistence, duplicate launches, exit codes, stop escalation, forced supervisor death and bounded console output. React tests cover drafts, unsaved navigation, imports, duplicate taps and unmounts. JVM tests exercise the actual broker authorization method with synthetic installed-package data and a generated test certificate. These do not replace Android Binder/Termux acceptance.

On supported physical devices/API 28 and API 36: verify Termux installation and permission denial/retry, runtime checks, start/stdin/stop, setup failures, process death, force-stop/reopen, rotation, keyboard, large text, TalkBack, and a client signed by the wrong Manager. Live DM/voice/RPC regressions require an authenticated test session. The sandbox's software API 30 emulator previously lost Android system services before Manager installation; no current device pass or production certification is claimed.

````

## docs/addon-framework.md

````md
# Isolated addons (2.12.0)

## Implementation and acceptance status

The build adds React Native **Plugins** and **Themes** pages under Discord Settings → Assault. The authoritative project is `assault-main/source/`; its root modules are `plugins/`, `themes/`, `core/`, and `utils/`. `core/index.js` connects to the pinned upstream runtime and existing Android loader. `plugins/index.js`, `themes/index.js`, and `utils/store.js` are independent entry points for lifecycle, theme validation, and storage.

This is a candidate implementation, **not a production-certified Discord build**. Host regression tests and Android compilation do not establish live voice/audio, DMs, presence visibility, all theme surfaces, picker compatibility, accessibility, or crash-free operation on a device. The existing Manager downloads and patches device-specific Discord splits; its APK is not itself a patched Discord client. The target Discord version and device must be agreed and acceptance-tested before production installation.

## JavaScript input contract

Both `.js` and `.txt` contain the same UTF-8 JavaScript. No renaming is needed. Import through either library's **Import JavaScript file** button or use **Install from HTTPS URL** with the publisher's SHA-256 hash. Downloads are bounded, use platform HTTPS verification, reject redirects and mismatched checksums, and never inherit Discord authentication. The hash verifies the expected bytes; it does not certify the publisher's identity. Installed code is copied locally, starts disabled, and never auto-updates.

Files must export a single default object. See `plugins/examples/welcome.txt` and `themes/examples/midnight.txt`. The interpreter supports literal data, arrays, plain objects, const locals, if/else, conditional/logical expressions, primitive arithmetic/comparisons, return, and three lifecycle methods: `onStart(api)`, `onStop(api)`, `onSettingsChanged(api)`. It does not implement general JavaScript or existing Vendetta/Node plugin compatibility. Loops, imports, async functions, recursion, arbitrary function calls, prototype access, property getters and dynamic code generation are rejected.

The two user-provided scripts (`beefbot.txt` and `index.txt`) are Node.js selfbot applications. Their filesystem, HTTP server, account client and voice-library imports do not match this contract. They are treated as JavaScript and rejected by the addon loader. Import them into the separate [code runner](code-runner.md) as Node.js projects instead; their dependency and live-service compatibility still requires device testing. Their independent clients and unrestricted APIs cannot be used within this isolation model.

## API whitelist and isolation

Untrusted source is parsed with pinned Acorn, validated and interpreted as data. It is never passed to eval, Function, require, Hermes evaluation, or the upstream plugin evaluator. Both upstream external-plugin evaluators and legacy automatic plugin startup are blocked. Built-in runtime code remains trusted.

| Plugin call | Capability |
| --- | --- |
| `api.getSetting(name)` | Read the current plugin's validated settings |
| `api.getState(name, fallback)` | Copy a value from this plugin's persistent state |
| `api.setState(name, value)` | Write JSON data into this plugin's pending state transaction |
| `api.notify(text)` | Show a named Discord toast after the transaction commits |

There are **no native module functions exposed to addon code**. React, Metro, tokens, messages, voice, RPC, filesystem paths and network clients are not passed into the interpreter. Host-owned React Native components render plugin setting schemas. This avoids exposing React or native objects through plugin-generated components. Themes accept only the ten documented color tokens in `themes/index.js` and six-digit hex colors; they have no executable hooks or remote assets.

A failing hook rolls back its state and pending notifications and disables that plugin with an error on its card. Source is limited to 64 KiB of UTF-8 source, depth to 48 AST levels, execution to 5,000 node visits per hook, notifications to three per hook, state to 32 KiB per plugin, settings to 20 fields, and the library to 32 addons. Theme color propagation uses the pinned runtime's semantic color updater; Discord components outside that updater require device verification. App safe mode prevents activation.

## Persistence, exports and cloud backup

The device's private documents directory holds two journal slots. Operations serialize; a new revision is acknowledged only after exact read-back. An interrupted or malformed slot falls back to the previous valid revision. If both slots are damaged, startup reports an error and preserves the files. These checks detect incomplete writes, not malicious changes by a process that already controls the app's private storage. Android process-kill/power-loss behavior still requires device tests.

Backups include source, filenames/origins, metadata, install times, every plugin's settings and private state, inactive addons, activation preferences, all themes and the selected theme. Export waits for pending transactions. The native document writer closes the stream and reads the saved bytes back before reporting success. Failed writes attempt to delete the incomplete destination; a provider that refuses deletion may retain a failed file. The source journal is preserved. Android document-provider behavior cannot be guaranteed by host tests.

Restore requires an empty library and validates every entry before mutation. Restored plugins are disabled and the theme is reset, allowing deliberate activation. Existing legacy-plugin data is preserved separately and is not silently migrated or included in this new framework's backup.

Cloud backup is optional and explicit: provide an HTTPS endpoint that supports authenticated PUT and GET, then choose upload or restore. Local storage stays primary. Bearer credentials are not part of the journal or export; the temporary native request is removed after reading or bridge completion. Credentials briefly exist in app-private cache while an operation is pending; a process kill before cleanup can leave that request until next app startup. There is no automatic conflict merging or background sync. Remote storage access policy and encryption at rest are the operator's server configuration.

## Build and verification

Run `npm ci`, `npm run build:addons`, `npm test`, `npm run build`, and `python3 scripts/build_android.py` with Java 21 and SDK 36 configured. Gradle rebuilds `addons.js` from the module roots; Acorn's MIT license is packaged with the loader. Source packaging includes Xposed's entry point, ProGuard rules and all addon modules.

Device acceptance must cover import cancellation/permission errors, remote hash/network failures, backgrounding/rotation during picker use, repeated theme changes, large text/accessibility settings, multiple enabled plugins, force-stop/relaunch persistence, export/reimport equality, storage-full failures, voice join/leave/streaming, DM send/receive, RPC updates and safe-mode recovery. Record the exact Discord version, ABI, Android version and signing identity. Do not describe these checks as passed without exercising them.

````

## tests/addon-documents.test.mjs

````mjs
import { test } from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, delimiter } from 'node:path';
import { execFileSync } from 'node:child_process';

const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const android = sdk && join(sdk, 'platforms/android-36/android.jar');
const xposed = resolve('android/deps/xposed-api.jar');
test('an expired native request leaves the current mailbox intact for its rightful request', {
  skip: !android || !existsSync(android) || !existsSync(xposed) ? 'Requires prepared Android SDK36 and Xposed build dependency' : false,
}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'assault-documents-'));
  // Substitute Android host APIs only; execute the production begin method and real disk I/O.
  const fixtures = {
    'android/app/Activity.java': `package android.app;
public class Activity {
 public static final int RESULT_OK=-1; public static java.io.File cache; public static int opened;
 public java.io.File getCacheDir(){return cache;} public boolean isFinishing(){return false;}
 public void runOnUiThread(Runnable task){task.run();} public void finishActivity(int code){}
 public void startActivityForResult(android.content.Intent intent,int code){opened++;}
 public android.content.Context getApplicationContext(){return new android.content.Context();}
}`,
    'android/content/Context.java': `package android.content; public class Context { public android.content.ContentResolver getContentResolver(){return null;} public java.io.File getCacheDir(){return android.app.Activity.cache;} }`,
    'android/content/Intent.java': `package android.content;
public class Intent {
 public static final String ACTION_CREATE_DOCUMENT="create",ACTION_OPEN_DOCUMENT="open",CATEGORY_OPENABLE="openable",EXTRA_TITLE="title";
 public Intent(String action){} public Intent addCategory(String category){return this;}
 public Intent setType(String type){return this;} public Intent putExtra(String key,String value){return this;}
 public android.net.Uri getData(){return null;}
}`,
    'org/json/JSONObject.java': `package org.json;
public class JSONObject {
 private final java.util.Map<String,String> fields=new java.util.HashMap<>();
 public JSONObject(){}
 public JSONObject(String text){
  java.util.regex.Matcher matcher=java.util.regex.Pattern.compile("\\\"([^\\\"]+)\\\":\\\"([^\\\"]*)\\\"").matcher(text);
  while(matcher.find())fields.put(matcher.group(1),matcher.group(2));
 }
 public String optString(String key){return fields.getOrDefault(key,"");}
 public String getString(String key){if(!fields.containsKey(key))throw new IllegalArgumentException(key);return fields.get(key);}
 public boolean has(String key){return fields.containsKey(key);}
 public Object remove(String key){return fields.remove(key);}
 public JSONObject getJSONObject(String key){return new JSONObject(getString(key));}
 public JSONObject put(String key,Object value){fields.put(key,String.valueOf(value));return this;}
 public String toString(){return fields.toString();}
}`,
    'app/assault/loader/DocumentsTest.java': `package app.assault.loader;
public class DocumentsTest {
 public static void main(String[] args)throws Exception {
  android.app.Activity.cache=new java.io.File(args[0]);
  var mailbox=new java.io.File(args[0],"assault-addon-request.json");
  byte[] request="{\\\"id\\\":\\\"1234567890123-2\\\",\\\"operation\\\":\\\"import\\\"}".replace("\\\\\\\"","\\\"").getBytes(java.nio.charset.StandardCharsets.UTF_8);
  java.nio.file.Files.write(mailbox.toPath(),request);
  var begin=AddonDocuments.class.getDeclaredMethod("begin",android.app.Activity.class,String.class);begin.setAccessible(true);
  try{begin.invoke(null,new android.app.Activity(),"1234567890123-1");throw new AssertionError("stale request accepted");}
  catch(java.lang.reflect.InvocationTargetException expected){if(!expected.getCause().getMessage().equals("Expired addon request."))throw expected;}
  if(!java.util.Arrays.equals(request,java.nio.file.Files.readAllBytes(mailbox.toPath())))throw new AssertionError("current request lost");
  if(android.app.Activity.opened!=0)throw new AssertionError("stale request opened picker");
  begin.invoke(null,new android.app.Activity(),"1234567890123-2");
  if(mailbox.exists()||android.app.Activity.opened!=1)throw new AssertionError("valid request not consumed exactly once");
  var active=AddonDocuments.class.getDeclaredField("active");active.setAccessible(true);Object picker=active.get(null);
  var scriptMailbox=new java.io.File(args[0],"assault-script-request.json");
  byte[] scriptRequest=new String(request,java.nio.charset.StandardCharsets.UTF_8).replace("import","runner").getBytes(java.nio.charset.StandardCharsets.UTF_8);
  java.nio.file.Files.write(scriptMailbox.toPath(),scriptRequest);
  try{ScriptDocuments.begin(new android.content.Context(),"1234567890123-1");throw new AssertionError("stale script request accepted");}catch(java.io.IOException expected){}
  if(!java.util.Arrays.equals(scriptRequest,java.nio.file.Files.readAllBytes(scriptMailbox.toPath())))throw new AssertionError("script mailbox lost");
  ScriptDocuments.begin(new android.content.Context(),"1234567890123-2");
  var running=ScriptDocuments.class.getDeclaredField("running");running.setAccessible(true);
  for(int i=0;i<400;i++){synchronized(ScriptDocuments.class){if(!running.getBoolean(null))break;}Thread.sleep(5);}
  if(active.get(null)!=picker||!new java.io.File(args[0],"assault-script-result-1234567890123-2.json").isFile())throw new AssertionError("script request disturbed document picker");
  active.set(null,null);
  var sequence=AddonDocuments.class.getDeclaredField("sequence");sequence.setAccessible(true);sequence.setInt(null,0x1fff);
  byte[] runner=new String(request,java.nio.charset.StandardCharsets.UTF_8).replace("import","runner").getBytes(java.nio.charset.StandardCharsets.UTF_8);
  java.nio.file.Files.write(mailbox.toPath(),runner);
  begin.invoke(null,new android.app.Activity(),"1234567890123-2");
  if(sequence.getInt(null)!=0x1fff)throw new AssertionError("poll consumed a picker code");
  long deadline=System.nanoTime()+2_000_000_000L;
  while(active.get(null)!=null && System.nanoTime()<deadline)Thread.sleep(5);
  if(active.get(null)!=null)throw new AssertionError("worker did not finish");
 }
}`,
  };
  try {
    const sources = Object.entries(fixtures).map(([name, code]) => {
      const path = join(dir, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, code); return path;
    });
    const production = ['AddonDocuments', 'AddonTransfer', 'AddonFiles', 'ScriptDocuments', 'DocumentTask'].map(name => resolve(`android/loader/src/main/java/app/assault/loader/${name}.java`));
    const classpath = [dir, android, xposed].join(delimiter);
    execFileSync('javac', ['-cp', classpath, '-d', dir, ...sources, ...production]);
    execFileSync('java', ['-cp', classpath, 'app.assault.loader.DocumentsTest', dir]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

````

## android/loader/src/main/java/app/assault/loader/AddonDocuments.java

````java
package app.assault.loader;

import android.app.Activity;
import android.content.Intent;
import android.content.Context;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.provider.DocumentsContract;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.XposedBridge;
import de.robv.android.xposed.XposedHelpers;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.json.JSONObject;

/** Host-only document and HTTPS transport. The addon interpreter has no bridge references. */
final class AddonDocuments {
    private static final int ARCHIVE_LIMIT = 4 * 1024 * 1024;
    private static final int SOURCE_LIMIT = 64 * 1024;
    private static WeakReference<Activity> foreground = new WeakReference<>(null);
    private static Session active;
    private static int sequence;
    private static final class Session {
        final File cacheDirectory;
        final String id;
        final JSONObject request;
        final int code;
        boolean writing;
        Session(Activity activity, String id, JSONObject request, int code) {
            this.cacheDirectory = activity.getCacheDir(); this.id = id; this.request = request; this.code = code;
        }
    }
    static void cleanup(Context context) {
        ScriptDocuments.cleanup(context);
        File[] files = context.getCacheDir().listFiles((dir, name) -> name.equals("assault-addon-request.json") || name.startsWith("assault-addon-result-") || name.startsWith(".pending-assault-addon-result-"));
        if (files != null) for (File file : files) if (file.isFile()) file.delete();
    }
    static void resumed(Activity activity) { foreground = new WeakReference<>(activity); }
    static void install(ClassLoader loader) {
        try {
            Class<?> promise = loader.loadClass("com.facebook.react.bridge.Promise");
            XposedHelpers.findAndHookMethod("com.facebook.react.modules.intent.IntentModule", loader, "openURL", String.class, promise, new XC_MethodHook() {
                @Override protected void beforeHookedMethod(MethodHookParam call) {
                    String url = (String) call.args[0];
                    if (url == null || (!url.startsWith("assault-addons://") && !url.startsWith("assault-scripts://"))) return;
                    call.setResult(null);
                      try {
                            Uri uri = Uri.parse(url);
                            String id = uri.getLastPathSegment();
                            if (!"request".equals(uri.getHost()) || id == null || !id.matches("[0-9]{10,16}-[0-9]{1,6}")) throw new IOException("Invalid addon request.");
                            Activity activity = foreground.get();
                            if (activity == null || activity.isFinishing()) throw new IOException("Reopen Discord and retry.");
                            if ("assault-scripts".equals(uri.getScheme())) ScriptDocuments.begin(activity.getApplicationContext(), id);
                            else begin(activity, id);
                            XposedHelpers.callMethod(call.args[1], "resolve", true);
                        } catch (Exception error) {
                            XposedHelpers.callMethod(call.args[1], "reject", "ASSAULT_ADDONS", "Addon file operation unavailable: " + error.getMessage());
                        }
                    }
                });
            } catch (Throwable error) { XposedBridge.log("Assault addon document bridge unavailable: " + error.getClass().getSimpleName()); }
        }
        private static synchronized void begin(Activity activity, String id) throws Exception {
            if (active != null && active.writing) throw new IOException("Finish the existing file operation first.");
            File requestFile = new File(activity.getCacheDir(), "assault-addon-request.json");
            JSONObject request;
            try (InputStream in = new FileInputStream(requestFile)) { request = new JSONObject(AddonTransfer.decode(read(in, ARCHIVE_LIMIT * 2))); }
            if (!id.equals(request.optString("id"))) throw new IOException("Expired addon request.");
            requestFile.delete();
            String operation = request.getString("operation");
            if (!Arrays.asList("import", "importScript", "runner", "restore", "export", "download", "uploadBackup", "downloadBackup").contains(operation)) throw new IOException("Unknown addon operation.");
            if (operation.equals("export")) {
                byte[] bytes = request.getString("data").getBytes(StandardCharsets.UTF_8);
                if (bytes.length == 0 || bytes.length > ARCHIVE_LIMIT) throw new IOException("Invalid backup size.");
                new JSONObject(AddonTransfer.decode(bytes));
            }
            if (active != null) {
                // A picker can lose its callback after a React reload. A new valid
                // request supersedes it; unique request codes reject any late result.
                int previousCode = active.code;
                finish(active, null, "File selection replaced by a new request.");
                activity.runOnUiThread(() -> {
                    try { activity.finishActivity(previousCode); } catch (RuntimeException ignored) { }
                });
            }
            boolean picker = Arrays.asList("import", "importScript", "restore", "export").contains(operation);
            if (picker && sequence >= 0x1fff) throw new IOException("Restart Discord before another document operation.");
            Session session = new Session(activity, id, request, picker ? 0x2000 + ++sequence : 0);
            active = session;
            if (picker) {
                activity.runOnUiThread(() -> {
                    try {
                        Intent intent = new Intent(operation.equals("export") ? Intent.ACTION_CREATE_DOCUMENT : Intent.ACTION_OPEN_DOCUMENT)
                            .addCategory(Intent.CATEGORY_OPENABLE).setType(operation.equals("export") ? "application/json" : "*/*");
                        if (operation.equals("export")) intent.putExtra(Intent.EXTRA_TITLE, "Assault-addons.json");
                        activity.startActivityForResult(intent, session.code);
                    } catch (RuntimeException error) { finish(session, null, "Document picker unavailable. Please retry."); }
                });
            } else {
                session.writing = true;
                ContentResolver resolver = activity.getApplicationContext().getContentResolver();
                new Thread(() -> {
                    try { finish(session, transfer(session, resolver), null); }
                    catch (Exception error) { finish(session, null, error.getMessage()); }
                }, "Assault addon transfer").start();
            }
        }
        static synchronized void result(Activity activity, int request, int result, Intent intent) {
            Session session = active;
            if (session == null || session.code != request || session.writing) return;
            if (result != Activity.RESULT_OK || intent == null || intent.getData() == null) { finish(session, null, "File selection cancelled."); return; }
            session.writing = true;
            Uri uri = intent.getData();
            ContentResolver resolver = activity.getApplicationContext().getContentResolver();
            new Thread(() -> {
                try (DocumentTask task = new DocumentTask(() -> finish(session, null, "File operation timed out. Check the storage provider and retry."), 60000)) {
                  try {
                    JSONObject response = new JSONObject();
                    String operation = session.request.getString("operation");
                    if (operation.equals("export")) {
                        byte[] bytes = session.request.getString("data").getBytes(StandardCharsets.UTF_8);
                        if (bytes.length == 0 || bytes.length > ARCHIVE_LIMIT) throw new IOException("Invalid backup size.");
                        new JSONObject(new String(bytes, StandardCharsets.UTF_8));
                        try {
                            try (android.content.res.AssetFileDescriptor file = task.track(resolver.openAssetFileDescriptor(uri, "wt", task.signal));
                                 OutputStream out = task.track(file == null ? null : file.createOutputStream())) {
                                if (out == null) throw new IOException("Destination cannot be opened.");
                                out.write(bytes); out.flush();
                            }
                            try (android.content.res.AssetFileDescriptor file = task.track(resolver.openAssetFileDescriptor(uri, "r", task.signal));
                                 InputStream in = task.track(file == null ? null : file.createInputStream())) {
                                if (!Arrays.equals(bytes, read(in, ARCHIVE_LIMIT))) throw new IOException("Saved backup could not be verified.");
                            }
                        } catch (Exception error) {
                            try { DocumentsContract.deleteDocument(resolver, uri); } catch (Exception ignored) { }
                            throw error;
                        }
                        response.put("saved", true).put("bytes", bytes.length);
                    } else {
                        String name = "";
                        try (Cursor cursor = task.track(resolver.query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null, task.signal))) {
                            if (cursor != null && cursor.moveToFirst()) name = cursor.getString(0);
                        }
                        if (operation.equals("import") && (name == null || !name.toLowerCase(java.util.Locale.ROOT).matches(".*\\.(js|txt)$"))) throw new IOException("Choose a .js or .txt JavaScript file.");
                        if (operation.equals("importScript") && (name == null || !name.toLowerCase(java.util.Locale.ROOT).matches(".*\\.(js|cjs|mjs|py|sh|txt)$"))) throw new IOException("Choose a .js, .cjs, .mjs, .py, .sh or .txt script.");
                        try (android.content.res.AssetFileDescriptor file = task.track(resolver.openAssetFileDescriptor(uri, "r", task.signal));
                             InputStream in = task.track(file == null ? null : file.createInputStream())) {
                            response.put("data", AddonTransfer.decode(read(in, (operation.equals("import") || operation.equals("importScript")) ? SOURCE_LIMIT : ARCHIVE_LIMIT)));
                        }
                        response.put("filename", name);
                    }
                    task.complete(() -> finish(session, response, null));
                } catch (Exception error) { task.complete(() -> finish(session, null, "File operation failed: " + error.getMessage())); }
            }
        }, "Assault addon document").start();
    }
    private static JSONObject transfer(Session session, ContentResolver resolver) throws Exception {
        JSONObject request = session.request;
        String operation = request.getString("operation");
        if (operation.equals("runner")) {
            return runner(request, resolver);
        }
        byte[] data = AddonTransfer.transfer(operation, request.getString("url"), request.optString("token"),
            request.optString("sha256"), request.optString("data").getBytes(StandardCharsets.UTF_8),
            () -> finish(session, null, "Transfer timed out. Check your connection and retry."));
        if (operation.equals("uploadBackup")) return new JSONObject().put("saved", true);
        return new JSONObject().put("data", AddonTransfer.decode(data)).put("filename", "remote.js");
    }
    static JSONObject runner(JSONObject request, ContentResolver resolver) throws Exception {
        JSONObject payload = request.getJSONObject("request");
        // Base64 avoids 6x JSON escaping and UTF-16 Binder expansion for script source.
        if (payload.has("source")) {
            byte[] source = payload.getString("source").getBytes(StandardCharsets.UTF_8);
            if (source.length > SOURCE_LIMIT) throw new IOException("Script exceeds 64 KiB.");
            payload.remove("source");
            payload.put("sourceBase64", java.util.Base64.getEncoder().encodeToString(source));
        }
        android.os.Bundle result = resolver.call(Uri.parse("content://app.assault.manager.scripts"), "execute", payload.toString(), null);
        if (result == null) throw new IOException("Install the matching Manager and prepare the client again to enable the runner.");
        if (result.containsKey("error")) throw new IOException(result.getString("error"));
        return new JSONObject(result.getString("data", "{}"));
    }
    private static byte[] read(InputStream in, int limit) throws IOException { return AddonTransfer.read(in, limit); }
    private static synchronized void finish(Session session, JSONObject result, String error) {
        if (active != session) return;
        try {
            JSONObject response = result == null ? new JSONObject() : result;
            if (error != null) response.put("error", error.length() > 240 ? error.substring(0, 240) : error);
            AddonFiles.publish(new File(session.cacheDirectory, "assault-addon-result-" + session.id + ".json"),
                response.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Exception failure) { XposedBridge.log("Assault addon result could not be saved: " + failure.getClass().getSimpleName()); }
        finally { active = null; }
    }
}

````

## android/manager/src/main/AndroidManifest.xml

````xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
 <uses-permission android:name="android.permission.INTERNET"/>
 <!-- Required by network-constrained JobScheduler jobs on Android 14+. -->
 <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
 <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES"/>
 <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
 <uses-permission android:name="com.termux.permission.RUN_COMMAND"/>
 <queries><package android:name="com.discord"/><package android:name="com.termux"/></queries>
 <application android:label="Assault Manager" android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher" android:theme="@android:style/Theme.Material.NoActionBar" android:allowBackup="false" android:fullBackupContent="false" android:dataExtractionRules="@xml/data_extraction_rules" android:usesCleartextTraffic="false" android:enableOnBackInvokedCallback="true">
  <activity android:name=".ManagerActivity" android:exported="true">
   <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
   <intent-filter><action android:name="android.intent.action.VIEW"/><category android:name="android.intent.category.DEFAULT"/><category android:name="android.intent.category.BROWSABLE"/><data android:scheme="assault" android:host="updates"/></intent-filter>
  </activity>
  <provider android:name=".ScriptProvider" android:authorities="app.assault.manager.scripts" android:exported="true"/>
  <receiver android:name=".ScriptResultReceiver" android:exported="false"/>
  <receiver android:name=".InstallReceiver" android:exported="false"/>
  <service android:name=".UpdateJob" android:permission="android.permission.BIND_JOB_SERVICE" android:exported="true"/>
 </application>
</manifest>

````

## android/manager/src/main/java/app/assault/manager/ManagerActivity.java

````java
package app.assault.manager;

import android.app.*;
import android.app.job.*;
import android.content.*;
import android.content.pm.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.io.*;
import app.assault.shared.AccountSettings;
import app.assault.shared.CommandGuide;
import app.assault.shared.RichPresence;
import java.util.*;
import java.util.concurrent.*;

public class ManagerActivity extends Activity {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private TextView status, version, detail, loaderStatus;
    private Button install, fetch, managerInstall, cancel;
    private final java.util.concurrent.atomic.AtomicBoolean checking = new java.util.concurrent.atomic.AtomicBoolean();
    private final SharedPreferences.OnSharedPreferenceChangeListener changes=this::changed;
    private ProgressBar progress;
    private boolean awaitingPermission;
    private long latest;
    private final Runnable refresh = this::render;
    private void changed(SharedPreferences prefs,String key){handler.removeCallbacks(refresh);handler.postDelayed(refresh,100);}
    private static final int BG = 0xff09090b, CARD = 0xff19191e, MINT = 0xffff6370, WHITE = 0xffedf3fa, MUTED = 0xffa6b4c8;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        awaitingPermission = state != null && state.getBoolean("permission");
        LinearLayout page = new LinearLayout(this); page.setOrientation(LinearLayout.VERTICAL); page.setPadding(dp(24),dp(20),dp(24),dp(24)); page.setBackgroundColor(BG);
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true); scroll.addView(page); setContentView(scroll);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            scroll.setOnApplyWindowInsetsListener((view, insets) -> { var bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()); view.setPadding(bars.left,bars.top,bars.right,bars.bottom); return insets; });
        } else scroll.setFitsSystemWindows(true);
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::finish);
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.ic_launcher);page.addView(logo,new LinearLayout.LayoutParams(dp(72),dp(72)));
        text(page, "AS / ASSAULT", 14, MINT, true);
        text(page, "Your Discord.\nYour control.", 36, WHITE, true);
        text(page, "MANAGER  /  "+BuildConfig.VERSION_NAME, 12, MUTED, true);
        LinearLayout hero = card(page);
        text(hero, "NATIVE DISCORD", 12, MINT, true);
        version = text(hero, "Checking your client…", 25, WHITE, true);
        detail = text(hero, "", 14, MUTED, false);
        loaderStatus = text(hero, "", 14, MINT, false);
        text(hero, "1  Download verified client splits\n2  Merge the included loader\n3  Confirm installation in Android", 14, MUTED, false);
        fetch = button(hero, "Download & prepare client", true, v -> prepare());
        install = button(hero, "Install prepared update", false, v -> requestInstall());
        cancel=button(hero,"Cancel preparation",false,v->{ClientEngine.cancel();message("Cancellation requested. Downloads stop at the next progress boundary; patching stops before publication.");});
        button(hero, "Open Assault", false, v -> {
            Intent launch = getPackageManager().getLaunchIntentForPackage(ClientEngine.CLIENT);
            if (launch == null) message("Install the client first."); else {try {startActivity(launch);}catch(RuntimeException e){message("Android could not open the client.");}}
        });
        button(page, "Code runner setup", false, v -> ScriptSetup.show(this));
        LinearLayout controls = card(page);
        text(controls, "Account controls", 21, WHITE, true);
        text(controls, "Choose a built-in profile for the signed-in client: local commands, own-message reactions or custom presence. No account token is needed.", 14, MUTED, false);
        button(controls,"Configure profile",false,v->AccountSettings.show(this,getSharedPreferences("manager",0),()->message("Profile saved. Tap Apply profile to client, then confirm in the client.")));
        button(controls,"Rich presence builder",false,v->RichPresence.show(this,getSharedPreferences("manager",0),()->message("Rich presence saved. Apply profile to client, confirm there, then restart it.")));
        button(controls,"Command guide",false,v->CommandGuide.show(this));
        button(controls,"Apply profile to client",false,v->{
            Intent launch=getPackageManager().getLaunchIntentForPackage(ClientEngine.CLIENT);
            if(launch==null){message("Install the client first.");return;}
            launch.putExtra(AccountSettings.EXTRA,AccountSettings.read(getSharedPreferences("manager",0)).toString());
            try{startActivity(launch);}catch(RuntimeException e){message("Could not open the client. Use AS → Account controls inside the client.");}
        });
        LinearLayout updates = card(page);
        text(updates, "Updates, handled", 21, WHITE, true);
        Switch auto = new Switch(this); auto.setText("Prepare updates automatically"); auto.setTextColor(WHITE); auto.setTextSize(15);
        auto.setChecked(getSharedPreferences("manager",0).getBoolean("auto", true)); updates.addView(auto);
        text(updates, "Checks on your chosen schedule. Defaults: daily, Wi-Fi, charging. Android asks before installation. Keep Manager installed and do not clear its app data: this deletes your client signing key. There is no key recovery; future updates would require reinstalling the client and losing its local app data.", 13, MUTED, false);
        auto.setOnCheckedChangeListener((b,on) -> { getSharedPreferences("manager",0).edit().putBoolean("auto",on).apply(); schedule(this); });
        policySwitch(updates,"Only on unmetered networks","unmetered",true);
        policySwitch(updates,"Only while charging","charging",true);
        button(updates,"Update frequency",false,v->{
            int[] hours={6,24,72};String[] labels={"Every 6 hours","Daily","Every 3 days"};int selected=1;
            for(int i=0;i<hours.length;i++)if(hours[i]==getSharedPreferences("manager",0).getInt("intervalHours",24))selected=i;
            new AlertDialog.Builder(this).setTitle("Update frequency").setSingleChoiceItems(labels,selected,(d,i)->{getSharedPreferences("manager",0).edit().putInt("intervalHours",hours[i]).apply();schedule(this);d.dismiss();}).setNegativeButton("Cancel",null).show();
        });
        button(updates, "Check client & manager updates", false, v -> checkUpdates(true));
        managerInstall = button(updates, "Install Manager update", false, v -> {
            if (!getPackageManager().canRequestPackageInstalls()) {
                message("Grant install permission, then tap Install Manager update again.");
                openInstallPermission();
            } else installFiles(List.of(ManagerUpdater.prepared(this)),getPackageName());
        });
        LinearLayout activity = card(page);
        text(activity, "Activity", 21, WHITE, true);
        progress = new ProgressBar(this); activity.addView(progress);
        status = text(activity, "Ready", 14, MUTED, false); status.setTextIsSelectable(true);
        button(activity,"Clear failed downloads",false,v->{
            try{worker.execute(()->{try{ClientEngine.clearDownloads(getApplicationContext());message("Failed downloads cleared. Prepared client and signing key retained.");}catch(Exception e){message(e.getMessage());}});}catch(RejectedExecutionException e){message("Reopen Manager to retry.");}
        });
        button(activity,"Copy diagnostics",false,v->{
            try{getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("Assault diagnostics","Manager "+BuildConfig.VERSION_NAME+"\nAPI "+Build.VERSION.SDK_INT+" · "+Build.SUPPORTED_ABIS[0]+"\nInstalled Discord: "+ClientEngine.installed(this)+"\nLatest: "+latest+"\nPrepared APKs: "+ClientEngine.prepared(this).size()));message("Diagnostics copied without messages, tokens or signing material.");}catch(RuntimeException e){message("Clipboard unavailable.");}
        });
        LinearLayout about = card(page);
        text(about, "A separate manager. A native client.", 19, WHITE, true);
        text(about, "Discord supplies chat, voice, DMs and its mobile interface. Assault adds its loader, message controls, plugins and themes. No WebView client.", 14, MUTED, false);
        button(about, "Client app settings", false, v -> {
            try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:com.discord"))); }
            catch (RuntimeException e) { message("The client is not installed."); }
        });
        button(about,"Open-source notices",false,v->new AlertDialog.Builder(this).setTitle("Open-source notices").setMessage("LSPatch: GPL-3.0\nRevenge runtime: BSD-3-Clause (Assault display branding)\nXposed API: Apache-2.0\n\nSource and full licenses: github.com/hypercharacterization/assault").setPositiveButton("OK",null).show());
        schedule(this); checkUpdates(false);
    }
    private void render() {
        long installed = ClientEngine.installed(this);
        latest = getSharedPreferences("manager",0).getLong("latest",latest);
        version.setText(installed == 0 ? "Make it yours." : "Discord " + installed);
        detail.setText("Android " + Build.VERSION.RELEASE + " · " + Build.SUPPORTED_ABIS[0] + (latest > 0 ? "\nAvailable build " + latest : "\nUse Check updates to fetch stable release"));
        var prefs = getSharedPreferences("manager", 0);
        boolean ready = !ClientEngine.prepared(this).isEmpty();
        loaderStatus.setText("Included loader " + BuildConfig.VERSION_NAME + " · no separate install" +
            (ready ? "\nPrepared client " + prefs.getLong("prepared", 0) +
                (prefs.getInt("prepared_loader", 0) == BuildConfig.VERSION_CODE ? " · matching loader" : " · older loader; prepare again to update") : "\nPrepare a client to merge the loader"));
        boolean busy = ClientEngine.busy.get();
        fetch.setEnabled(!busy && !ClientEngine.installing.get()); fetch.setText(busy ? "Preparing client…" : installed > 0 ? "Prepare latest client" : "Download & prepare client");
        install.setEnabled(!busy && !ClientEngine.installing.get() && ready);
        managerInstall.setVisibility(ManagerUpdater.prepared(this).isFile() ? View.VISIBLE : View.GONE);
        managerInstall.setEnabled(!busy && !ClientEngine.installing.get());
        progress.setVisibility(busy ? View.VISIBLE : View.GONE);
        cancel.setVisibility(busy?View.VISIBLE:View.GONE);
        status.setText(busy ? ClientEngine.progress : getSharedPreferences("manager",0).getString("message","Ready"));
    }
    private void checkUpdates(boolean managerToo) {
        var prefs=getSharedPreferences("manager",0);
        if(!managerToo && System.currentTimeMillis()-prefs.getLong("lastCheck",0)<6*60*60*1000L)return;
        if(!checking.compareAndSet(false,true))return;
        try { worker.execute(() -> {
            try {
                long remote = ReleaseSource.latest();
                getSharedPreferences("manager",0).edit().putLong("latest",remote).putLong("lastCheck",System.currentTimeMillis()).apply();
                message(ClientEngine.needsUpdate(this,remote) ? "A client or loader update is available. Prepare the latest client." : "Discord and Assault loader are up to date.");
                if (managerToo || getSharedPreferences("manager",0).getBoolean("auto",true)) {
                    try { String result = ManagerUpdater.check(this); if (managerToo || ManagerUpdater.prepared(this).isFile()) message(result); }
                    catch(Exception error) { if (managerToo) message("Client check complete. Manager update unavailable: " + error.getMessage()); }
                }
            } catch (Exception e) { message("Update check failed: " + e.getMessage()); }
            finally {checking.set(false);}
        }); } catch(RejectedExecutionException e){checking.set(false);message("Reopen Manager to check updates.");}
    }
    private void prepare() {
        if (!ClientEngine.beginPrepare()) return;
        ClientEngine.progress = "Checking stable Discord release…";
        render();
        try {
            worker.execute(() -> {
                final long target;
                try { target = ReleaseSource.latest(); }
                catch(Exception e) { ClientEngine.busy.set(false); message("Preparation failed: " + e.getMessage()); return; }
                try { ClientEngine.prepareReserved(getApplicationContext(),target,this::message); }
                catch(Exception e) { message("Preparation failed: " + e.getMessage()); }
            });
        } catch (RejectedExecutionException e) {
            ClientEngine.busy.set(false);
            message("Manager closed before preparation started. Reopen it to retry.");
        }
    }
    private void openInstallPermission() {
        try{startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+getPackageName())));}
        catch(RuntimeException e){awaitingPermission=false;message("Open Android Settings → Apps → Special app access → Install unknown apps, and allow Assault Manager.");}
    }
    private void policySwitch(LinearLayout panel,String label,String key,boolean fallback){
        Switch control=new Switch(this);control.setText(label);control.setTextColor(WHITE);control.setChecked(getSharedPreferences("manager",0).getBoolean(key,fallback));panel.addView(control);
        control.setOnCheckedChangeListener((button,on)->{getSharedPreferences("manager",0).edit().putBoolean(key,on).apply();schedule(this);});
    }
    private void requestInstall() {
        if (!getPackageManager().canRequestPackageInstalls()) {
            awaitingPermission = true;
            openInstallPermission();
        } else confirmInstall();
    }
    private void confirmInstall() {
        new AlertDialog.Builder(this).setTitle("Install native Assault")
            .setMessage("Android will install the prepared Discord client. An existing official Discord install uses a different signing key and cannot be updated in place. If Android reports a conflict, remove it yourself in Settings after preparing the client; removal clears its local app data. Subsequent Assault updates keep your data while Manager retains its signing key. Uninstalling Manager or clearing its data permanently deletes that key; future updates then require reinstalling the client and losing its local app data.")
            .setNegativeButton("Cancel",null).setPositiveButton("Continue",(d,w)->installFiles(ClientEngine.prepared(this),ClientEngine.CLIENT)).show();
    }
    private void installFiles(List<File> files, String packageName) {
        if (!ClientEngine.beginInstall()) return;
        render();
        try { worker.execute(() -> {
            int sessionId = -1;
            PackageInstaller installer = getPackageManager().getPackageInstaller();
            try {
                if (files.isEmpty()) throw new IOException("Prepare the client first");
                if (ClientEngine.CLIENT.equals(packageName)) {
                    message("Checking prepared client integrity…");
                    ClientEngine.verifyPrepared(getApplicationContext(), files);
                }
                var params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                params.setAppPackageName(packageName);
                if (Build.VERSION.SDK_INT >= 31) params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
                sessionId = installer.createSession(params);
                try (var session = installer.openSession(sessionId)) {
                    for (File file : files) {
                        try (InputStream in = new FileInputStream(file); OutputStream out = session.openWrite(file.getName(),0,file.length())) { ReleaseSource.copy(in, out); session.fsync(out); }
                    }
                    Intent callback = new Intent(this,InstallReceiver.class).setAction("app.assault.manager.INSTALL_RESULT").putExtra("assault.package", packageName).putExtra("assault.loader", getSharedPreferences("manager",0).getInt("prepared_loader",0));
                    int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                    session.commit(PendingIntent.getBroadcast(this,sessionId,callback,flags).getIntentSender());
                }
                message("Waiting for Android installation confirmation.");
            } catch(Exception e) {
                if (sessionId >= 0) { try { installer.abandonSession(sessionId); } catch(RuntimeException ignored) { } }
                ClientEngine.installing.set(false);
                message("Install failed: " + e.getMessage());
            }
        }); } catch (RejectedExecutionException e) {
            ClientEngine.installing.set(false);
            message("Manager closed before installation started. Reopen it to retry.");
        }
    }
    static void schedule(Context context) {
        JobScheduler scheduler=context.getSystemService(JobScheduler.class);if(scheduler==null)return;
        var prefs=context.getSharedPreferences("manager",0);
        if(!prefs.getBoolean("auto",true)){scheduler.cancel(26000);return;}
        int hours=prefs.getInt("intervalHours",24);if(hours!=6 && hours!=24 && hours!=72)hours=24;
        boolean unmetered=prefs.getBoolean("unmetered",true), charging=prefs.getBoolean("charging",true);
        String policy=hours+":"+unmetered+":"+charging;
        JobInfo old=scheduler.getPendingJob(26000);if(old!=null && policy.equals(old.getExtras().getString("policy")))return;
        PersistableBundle extras=new PersistableBundle();extras.putString("policy",policy);
        int result=scheduler.schedule(new JobInfo.Builder(26000,new ComponentName(context,UpdateJob.class))
            .setRequiredNetworkType(unmetered?JobInfo.NETWORK_TYPE_UNMETERED:JobInfo.NETWORK_TYPE_ANY).setRequiresCharging(charging)
            .setRequiresBatteryNotLow(true).setRequiresStorageNotLow(true).setPersisted(true).setPeriodic(hours*60L*60*1000).setExtras(extras).build());
        if(result!=JobScheduler.RESULT_SUCCESS)prefs.edit().putString("message","Android could not schedule updates. Manual checks remain available.").apply();
    }
    private void message(String message) { getSharedPreferences("manager",0).edit().putString("message",message).apply(); }
    @Override protected void onResume() { super.onResume(); getSharedPreferences("manager",0).registerOnSharedPreferenceChangeListener(changes); handler.post(refresh); if (awaitingPermission) { awaitingPermission=false; if (getPackageManager().canRequestPackageInstalls()) confirmInstall(); else message("Install permission was not granted."); } }
    @Override protected void onPause() { getSharedPreferences("manager",0).unregisterOnSharedPreferenceChangeListener(changes);handler.removeCallbacks(refresh); super.onPause(); }
    @Override public void onSaveInstanceState(Bundle state) { state.putBoolean("permission",awaitingPermission); super.onSaveInstanceState(state); }
    @Override protected void onDestroy() { worker.shutdown(); super.onDestroy(); }
    private int dp(int v) { return Math.round(v*getResources().getDisplayMetrics().density); }
    private LinearLayout card(LinearLayout page) {
        LinearLayout card = new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL); card.setPadding(dp(22),dp(18),dp(22),dp(18));
        GradientDrawable bg=new GradientDrawable(); bg.setColor(CARD); bg.setCornerRadius(dp(24)); card.setBackground(bg);
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2); params.topMargin=dp(20); page.addView(card,params); return card;
    }
    private TextView text(LinearLayout parent,String value,int size,int color,boolean bold) {
        TextView view=new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(color); view.setPadding(0,dp(6),0,dp(8));
        if(bold)view.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL)); parent.addView(view); return view;
    }
    private Button button(LinearLayout parent,String title,boolean primary,View.OnClickListener listener) {
        Button button=new Button(this); button.setText(title); button.setAllCaps(false); button.setTextColor(primary?BG:WHITE); button.setTextSize(15);
        GradientDrawable bg=new GradientDrawable(); bg.setColor(primary?MINT:0xff263348); bg.setCornerRadius(dp(16)); button.setBackground(bg);
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,dp(52)); params.topMargin=dp(12); parent.addView(button,params); button.setOnClickListener(listener); return button;
    }
}

````

## android/manager/src/main/java/app/assault/manager/ScriptSetup.java

````java
package app.assault.manager;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.widget.Switch;

final class ScriptSetup {
    static void show(Activity activity) {
        var preferences = activity.getSharedPreferences("manager", 0);
        Switch enabled = new Switch(activity);
        enabled.setText("Enable trusted script execution");
        enabled.setPadding(24, 16, 24, 16);
        enabled.setChecked(preferences.getBoolean("scripts_enabled", false));
        boolean[] restoring = {false};
        enabled.setOnCheckedChangeListener((button, value) -> {
            if (restoring[0]) return;
            if (!preferences.edit().putBoolean("scripts_enabled", value).commit()) {
                restoring[0] = true;
                button.setChecked(!value);
                restoring[0] = false;
                new AlertDialog.Builder(activity).setMessage("Could not save runner preference.").setPositiveButton("OK", null).show();
            }
        });
        new AlertDialog.Builder(activity).setTitle("Code runner setup")
            .setMessage("Install and open Termux from its official distribution. In Termux run:\n\npkg install python nodejs bash\nmkdir -p ~/.termux\nprintf '\\nallow-external-apps=true\\n' >> ~/.termux/termux.properties\ntermux-reload-settings\n\nScripts run with Termux permissions and can access its files and network. Only run code you trust. Discord credentials are not passed to scripts. Turning execution off prevents new starts; stop any active script from the client runner.\n\nThen grant permission below. In Discord, open Assault settings → Code runner.")
            .setView(enabled).setNegativeButton("Close", null).setPositiveButton("Grant permission", (dialog, which) -> {
                if (activity.checkSelfPermission(ScriptProvider.PERMISSION) == PackageManager.PERMISSION_GRANTED) return;
                try {
                    activity.getPackageManager().getPermissionInfo(ScriptProvider.PERMISSION, 0);
                    if (preferences.getBoolean("termux_permission_requested", false) && !activity.shouldShowRequestPermissionRationale(ScriptProvider.PERMISSION)) {
                        activity.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + activity.getPackageName())));
                    } else {
                        preferences.edit().putBoolean("termux_permission_requested", true).apply();
                        activity.requestPermissions(new String[]{ScriptProvider.PERMISSION}, 7301);
                    }
                } catch (PackageManager.NameNotFoundException error) {
                    new AlertDialog.Builder(activity).setMessage("Install and open Termux first, then retry Grant permission.").setPositiveButton("OK", null).show();
                } catch (RuntimeException error) {
                    new AlertDialog.Builder(activity).setMessage("Open Android Settings → Apps → Assault Manager → Permissions and allow Termux execution.").setPositiveButton("OK", null).show();
                }
            }).show();
    }
}

````

## android/manager/src/main/java/app/assault/manager/ScriptProvider.java

````java
package app.assault.manager;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Binder;
import android.os.Build;
import android.os.Bundle;
import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import org.json.JSONObject;

/** UID and installation-key authenticated broker. No Discord credentials cross this boundary. */
public final class ScriptProvider extends ContentProvider {
    static final String PERMISSION = "com.termux.permission.RUN_COMMAND";
    static final ConcurrentHashMap<String, CompletableFuture<Bundle>> RESULTS = new ConcurrentHashMap<>();
    private static final ReentrantLock OPERATION = new ReentrantLock();
    @Override public boolean onCreate() { return true; }

    private void authorize() throws Exception {
        Context context = getContext();
        int uid = Binder.getCallingUid();
        if (uid == context.getApplicationInfo().uid) return;
        String[] packages = context.getPackageManager().getPackagesForUid(uid);
        // Shared UIDs would allow another application to impersonate the client.
        if (packages == null || packages.length != 1 || !"com.discord".equals(packages[0])) throw new SecurityException("Unrecognized runner caller.");
        var info = context.getPackageManager().getPackageInfo("com.discord", PackageManager.GET_SIGNING_CERTIFICATES);
        var signers = info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners();
        if (signers == null || signers.length != 1) throw new SecurityException("Client signer unavailable.");
        KeyStore store = KeyStore.getInstance(KeyStore.getDefaultType());
        try (var stream = new FileInputStream(new File(context.getFilesDir(), "client-signing.bks"))) {
            store.load(stream, "assault-local-key".toCharArray());
        }
        var certificate = store.getCertificate("client");
        if (certificate == null || !MessageDigest.isEqual(certificate.getEncoded(), signers[0].toByteArray())) throw new SecurityException("Client was not signed by this Manager.");
    }

    @Override public Bundle call(String method, String argument, Bundle extras) {
        Bundle response = new Bundle();
        boolean locked = false;
        try {
            authorize();
            if (!"execute".equals(method) || argument == null || argument.getBytes(StandardCharsets.UTF_8).length > 262144) throw new IllegalArgumentException("Invalid runner request.");
            Context context = getContext();
            if (context.checkSelfPermission(PERMISSION) != PackageManager.PERMISSION_GRANTED) throw new SecurityException("Grant Termux execution permission in Manager → Code runner setup.");
            JSONObject request = new JSONObject(argument);
            if (!java.util.List.of("check", "start", "poll", "input", "stop").contains(request.getString("operation"))) throw new IllegalArgumentException("Unknown runner operation.");
            if (java.util.List.of("start", "input").contains(request.getString("operation"))
                && !context.getSharedPreferences("manager", 0).getBoolean("scripts_enabled", false)) throw new IllegalStateException("Open Manager → Code runner setup and enable execution first.");
            locked = OPERATION.tryLock();
            if (!locked) throw new IllegalStateException("A runner request is already in progress. Retry shortly.");
            // Do not forward the client's Binder identity to Termux.
            long identity = Binder.clearCallingIdentity();
            try { response.putString("data", execute(context, argument)); }
            finally { Binder.restoreCallingIdentity(identity); }
        } catch (Exception error) {
            response.putString("error", error instanceof java.util.concurrent.TimeoutException
                ? "Termux did not reply within 25 seconds. Check Termux and refresh this run before retrying."
                : String.valueOf(error.getMessage()));
        } finally { if (locked) OPERATION.unlock(); }
        return response;
    }

    static boolean successful(int error, int exitCode) {
        return error == Activity.RESULT_OK && exitCode == 0;
    }

    static boolean truncated(String originalLength, int receivedLength) {
        if (originalLength == null) return false;
        try { long length = Long.parseLong(originalLength); return length < 0 || length > receivedLength; }
        catch (NumberFormatException error) { return true; }
    }

    private static String execute(Context context, String request) throws Exception {
        String helper;
        try (var in = context.getAssets().open("script_runner.py")) {
            helper = Base64.getEncoder().encodeToString(ReleaseSource.readBounded(in, 65536));
        }
        String bootstrap = "import base64; SOURCE=base64.b64decode('" + helper + "').decode('utf-8'); exec(compile(SOURCE, '<assault-runner>', 'exec'))";
        String id = UUID.randomUUID().toString();
        CompletableFuture<Bundle> future = new CompletableFuture<>();
        RESULTS.put(id, future);
        Intent callback = new Intent(context, ScriptResultReceiver.class).setData(Uri.parse("assault-runner-result://callback/" + id));
        int flags = PendingIntent.FLAG_ONE_SHOT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        PendingIntent result = PendingIntent.getBroadcast(context, 0, callback, flags);
        try {
            Intent command = new Intent("com.termux.RUN_COMMAND").setClassName("com.termux", "com.termux.app.RunCommandService")
                .putExtra("com.termux.RUN_COMMAND_PATH", "/data/data/com.termux/files/usr/bin/python")
                .putExtra("com.termux.RUN_COMMAND_ARGUMENTS", new String[]{"-c", bootstrap})
                .putExtra("com.termux.RUN_COMMAND_STDIN", request)
                .putExtra("com.termux.RUN_COMMAND_BACKGROUND", true)
                .putExtra("com.termux.RUN_COMMAND_PENDING_INTENT", result);
            if (context.startForegroundService(command) == null) throw new IllegalStateException("Install and open Termux, then install Python and Node.js.");
            Bundle received = future.get(25, TimeUnit.SECONDS);
            if (!successful(received.getInt("err", Activity.RESULT_CANCELED), received.getInt("exitCode", -1))) throw new IllegalStateException("Termux could not execute the helper. Open Termux, enable allow-external-apps and run pkg install python nodejs bash.");
            String output = received.getString("stdout", "");
            if (output.length() > 100000 || truncated(received.getString("stdout_original_length"), output.length())) throw new IllegalStateException("Termux response was truncated. Refresh and retry.");
            return new JSONObject(output).toString();
        } finally { RESULTS.remove(id); result.cancel(); }
    }
    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] arguments, String sort) { throw new UnsupportedOperationException(); }
    @Override public String getType(Uri uri) { return null; }
    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String selection, String[] arguments) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] arguments) { throw new UnsupportedOperationException(); }
}

````

## android/manager/src/main/java/app/assault/manager/ScriptResultReceiver.java

````java
package app.assault.manager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

/** Only the one-shot, explicit PendingIntent handed to Termux can deliver a result. */
public final class ScriptResultReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent.getData() == null) return;
        var future = ScriptProvider.RESULTS.get(intent.getData().getLastPathSegment());
        Bundle result = intent.getBundleExtra("result");
        if (future != null && result != null) future.complete(result);
    }
}

````

## android/manager/src/main/java/org/lsposed/patch/ApkPatcher.java

````java
// Derived from JingMatrix/LSPatch v1.2, GPL-3.0. See android/THIRD_PARTY.md.
// Assault changes: alignment, launcher XML, split identity/version consistency and code-less bootstrap handling.
package org.lsposed.patch;

import static org.lsposed.lspatch.share.Constants.CONFIG_ASSET_PATH;
import static org.lsposed.lspatch.share.Constants.EMBEDDED_MODULES_ASSET_PATH;
import static org.lsposed.lspatch.share.Constants.LOADER_DEX_ASSET_PATH;
import static org.lsposed.lspatch.share.Constants.ORIGINAL_APK_ASSET_PATH;
import static org.lsposed.lspatch.share.Constants.PROXY_APP_COMPONENT_FACTORY;

import com.android.tools.build.apkzlib.sign.SigningExtension;
import com.android.tools.build.apkzlib.sign.SigningOptions;
import com.android.tools.build.apkzlib.zip.AlignmentRules;
import com.android.tools.build.apkzlib.zip.NestedZip;
import com.android.tools.build.apkzlib.zip.StoredEntry;
import com.android.tools.build.apkzlib.zip.ZFile;
import com.android.tools.build.apkzlib.zip.ZFileOptions;
import com.google.gson.Gson;
import com.wind.meditor.core.ManifestEditor;
import com.wind.meditor.property.AttributeItem;
import com.wind.meditor.property.ModificationProperty;
import com.wind.meditor.utils.NodeValue;

import org.apache.commons.io.FilenameUtils;
import org.lsposed.lspatch.share.Constants;
import org.lsposed.lspatch.share.LSPConfig;
import org.lsposed.lspatch.share.PatchConfig;
import org.lsposed.patch.util.ApkSignatureHelper;
import org.lsposed.patch.util.Logger;
import org.lsposed.patch.util.ManifestParser;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Turns an apk into one that loads Xposed modules, without root.
 *
 * The principle is unchanged and is the whole of why LSPatch works: the original apk is kept intact
 * *inside* the patched one, as a nested zip at {@link Constants#ORIGINAL_APK_ASSET_PATH}, and the
 * manifest is rewritten so Android instantiates LSPatch's own {@code AppComponentFactory} first. At
 * runtime that factory brings the framework up and then hands control to the original application,
 * which loads from the nested copy and so sees itself byte-for-byte as its author shipped it. Every
 * entry that does not need changing is a *link* into the nested copy rather than a second copy of
 * the bytes, which is what keeps a patched apk close to the size of the original.
 *
 * What has changed is the shape. This used to be a single 150-line method on the command-line entry
 * point, which meant the engine could only be driven by parsing argv and every failure mode was a
 * {@code throw} from somewhere in the middle of it. The steps below are the same steps in the same
 * order, named, and reported through {@link Logger#stage} so a caller can show progress without
 * pattern-matching the log text.
 */
public final class ApkPatcher {

    private static final String ANDROID_MANIFEST_XML = "AndroidManifest.xml";

    /**
     * The native library is carried per-architecture under assets, never under {@code lib/}.
     *
     * An x86 device running an arm build through the native bridge would try to load the wrong one
     * out of {@code lib/} and crash; keeping them in assets means the loader picks by itself.
     */
    private static final Set<String> ARCHES = new LinkedHashSet<>(Arrays.asList(
            "armeabi-v7a",
            "arm64-v8a",
            "x86",
            "x86_64"
    ));

    /**
     * Page-aligned entries.
     *
     * The native library and the nested original both have to be mappable straight out of the apk,
     * which requires them to start on a 16 KiB boundary.
     */
    private static final ZFileOptions Z_FILE_OPTIONS = new ZFileOptions().setAlignmentRule(AlignmentRules.compose(
            AlignmentRules.constantForSuffix(".so", 16384),
            AlignmentRules.constantForSuffix(ORIGINAL_APK_ASSET_PATH, 16384),
            AlignmentRules.constantForSuffix(".xml", 4)
    ));

    private final Logger logger;
    private final PatchSpec spec;
    private final List<String> iconPaths;
    private final byte[] icon;

    public ApkPatcher(Logger logger, PatchSpec spec) {
        this(logger, spec, List.of(), null);
    }

    public ApkPatcher(Logger logger, PatchSpec spec, List<String> iconPaths, byte[] icon) {
        this.iconPaths = List.copyOf(iconPaths);
        this.icon = icon;
        this.logger = logger;
        this.spec = spec;
        logger.verbose = spec.verbose();
    }

    /**
     * Patches every apk in the spec and returns what was written, in the order given.
     *
     * A multi-apk app is patched as a set because its splits have to agree: only the apk carrying
     * the application element is rewritten, and the rest are repacked so that they stay installable
     * alongside it.
     */
    public List<File> patch() throws IOException {
        List<File> outputs = new ArrayList<>();
        File outputDir = spec.outputDir();
        if (!outputDir.isDirectory() && !outputDir.mkdirs()) {
            throw new PatchException("Cannot create output directory " + outputDir);
        }
        int index = 0;
        int total = spec.apks().size();
        for (File apk : spec.apks()) {
            index++;
            File src = apk.getAbsoluteFile();
            File output = outputFileFor(src);
            if (output.exists() && !spec.forceOverwrite()) {
                throw new PatchException(output + " exists. Use --force to overwrite");
            }
            logger.i("Processing " + src + " -> " + output);
            patchOne(src, output, index, total);
            outputs.add(output);
        }
        return outputs;
    }

    /**
     * Where a given input apk's result is written.
     *
     * {@link Locale#ROOT}, not the default locale: the version code is formatted into the file name,
     * and a locale with its own digits (Arabic-Indic, say) would produce a name the manager's own
     * suffix matching no longer recognises.
     */
    private File outputFileFor(File src) {
        String name = String.format(
                Locale.ROOT,
                "%s-%d-lspatched.apk",
                FilenameUtils.getBaseName(src.getName()),
                LSPConfig.instance.VERSION_CODE);
        return new File(spec.outputDir(), name).getAbsoluteFile();
    }

    private void patchOne(File srcApkFile, File outputFile, int index, int total) throws IOException {
        if (!srcApkFile.exists()) {
            throw new PatchException("The source apk file does not exist: " + srcApkFile);
        }

        // The output is opened read-write and grown in place, so anything already there would be
        // treated as a partially built apk rather than replaced.
        if (outputFile.exists() && !outputFile.delete()) {
            throw new PatchException("Cannot overwrite " + outputFile);
        }

        logger.d("apk path: " + srcApkFile);
        logger.stage(Logger.Stage.READING, index, total);
        logger.i("Parsing original apk...");

        try (ZFile dstZFile = ZFile.openReadWrite(outputFile, Z_FILE_OPTIONS);
             NestedZip srcZFile = dstZFile.addNestedZip((ignore) -> ORIGINAL_APK_ASSET_PATH, srcApkFile, false)) {

            registerSigner(dstZFile, index, total);

            String originalSignature = readOriginalSignature(srcApkFile);
            ManifestParser.Pair manifest = readManifest(srcZFile);

            // Package metadata, rather than file naming or factory presence, identifies splits.
            boolean isSplit = isSplitManifest(srcZFile);
            if (isSplit) {
                packSplit(srcZFile, dstZFile, index, total);
            } else {
                PatchConfig config = new PatchConfig(
                        spec.useManager(),
                        spec.debuggable(),
                        spec.manifestOverrides().versionCode,
                        spec.sigBypassLevel(),
                        originalSignature,
                        manifest.appComponentFactory,
                        spec.injectDex(),
                        spec.manifestOverrides().addedPermissions.toArray(new String[0]),
                        spec.manifestOverrides().injectDocumentsProvider,
                        spec.useManager() ? spec.managerPackageName() : null);
                byte[] configBytes = new Gson().toJson(config).getBytes(StandardCharsets.UTF_8);

                rewriteManifest(srcZFile, dstZFile, configBytes, manifest.packageName, manifest.minSdkVersion, index, total);
                injectLoader(srcZFile, dstZFile, index, total);
                if (!spec.useManager()) {
                    addLoaderPayload(dstZFile);
                    embedModules(dstZFile, index, total);
                }
                // Write replacements before linking the nested original. Reopening a finished
                // nested APK for mutation would overlap the original and its linked entries.
                for (String path : iconPaths) {
                    if (icon == null || !path.startsWith("res/") || !path.endsWith(".xml") || srcZFile.get(path) == null)
                        throw new PatchException("Unsupported launcher resource: " + path);
                    dstZFile.add(path, new ByteArrayInputStream(icon), false);
                }
                linkRemainingEntries(srcZFile, dstZFile);

            }

            dstZFile.realign();

            // Everything after this point -- deflation, realignment, v2 signing -- happens as the
            // zip is closed, and emits nothing for tens of seconds on a large app. A caller showing
            // progress has to know that this is where the silence is.
            logger.stage(Logger.Stage.WRITING, index, total);
            logger.i("Writing apk...");
        }
        logger.stage(Logger.Stage.DONE, index, total);
        logger.i("Done. Output APK: " + outputFile.getAbsolutePath());
    }

    /** Registers the v2 signer, so the finished zip is signed as it is closed. */
    private void registerSigner(ZFile dstZFile, int index, int total) throws IOException {
        logger.stage(Logger.Stage.SIGNING, index, total);
        logger.i(spec.keystore().isBuiltIn()
                ? "Register apk signer with default keystore..."
                : "Register apk signer with custom keystore...");
        try {
            KeyStore keyStore = spec.keystore().load(getClass().getClassLoader());
            KeyStore.PrivateKeyEntry entry = (KeyStore.PrivateKeyEntry) keyStore.getEntry(
                    spec.keystore().alias(),
                    new KeyStore.PasswordProtection(spec.keystore().aliasPassword().toCharArray()));
            if (entry == null) {
                throw new PatchException("No key named '" + spec.keystore().alias() + "' in the keystore");
            }
            new SigningExtension(SigningOptions.builder()
                    .setMinSdkVersion(28)
                    .setV2SigningEnabled(true)
                    .setCertificates((X509Certificate[]) entry.getCertificateChain())
                    .setKey(entry.getPrivateKey())
                    .build()).register(dstZFile);
        } catch (PatchException e) {
            throw e;
        } catch (Exception e) {
            throw new PatchException("Failed to register signer", e);
        }
    }

    /**
     * The original app's signature, recorded so the loader can report it back to the app.
     *
     * Only read when signature bypass is on: a patched apk is signed with LSPatch's key, and an app
     * that checks its own signature would otherwise notice. Nothing needs it when the bypass is off.
     */
    private String readOriginalSignature(File srcApkFile) throws IOException {
        if (spec.sigBypassLevel() <= Constants.SIGBYPASS_LV_DISABLE) return null;
        String signature = ApkSignatureHelper.getApkSignInfo(srcApkFile.getAbsolutePath());
        if (signature == null || signature.isEmpty()) {
            throw new PatchException("Could not read the original apk's signature");
        }
        logger.d("Original signature\n" + signature);
        return signature;
    }

    private ManifestParser.Pair readManifest(NestedZip srcZFile) throws IOException {
        StoredEntry manifestEntry = srcZFile.get(ANDROID_MANIFEST_XML);
        if (manifestEntry == null) {
            throw new PatchException("Provided file is not a valid apk");
        }
        try (InputStream is = manifestEntry.open()) {
            ManifestParser.Pair pair = ManifestParser.parseManifestFile(is);
            if (pair == null) {
                throw new PatchException("Failed to parse AndroidManifest.xml");
            }
            logger.d("original appComponentFactory class: " + pair.appComponentFactory);
            logger.d("original minSdkVersion: " + pair.minSdkVersion);
            return pair;
        }
    }

    private static boolean isSplitManifest(NestedZip source) throws IOException {
        final boolean[] split = {false};
        try (InputStream input = Objects.requireNonNull(source.get(ANDROID_MANIFEST_XML)).open()) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) {
                if (bytes.size() + count > 4 * 1024 * 1024) throw new PatchException("Manifest too large");
                bytes.write(buffer, 0, count);
            }
            byte[] manifest = bytes.toByteArray();
            new pxb.android.axml.AxmlReader(manifest).accept(new pxb.android.axml.AxmlVisitor() {
                @Override public pxb.android.axml.NodeVisitor child(String ns, String name) {
                    if (!"manifest".equals(name)) return null;
                    return new pxb.android.axml.NodeVisitor() {
                        @Override public void attr(String ns, String name, int id, int type, Object value) {
                            if (ns == null && "split".equals(name)) split[0] = value instanceof String && !((String) value).isEmpty();
                        }
                    };
                }
            });
        }
        return split[0];
    }

    /** Repacks a split with any requested version override and removes invalid signatures. */
    private void packSplit(NestedZip srcZFile, ZFile dstZFile, int index, int total) throws IOException {
        logger.stage(Logger.Stage.PACKING_SPLIT, index, total);
        logger.i("Packing split apk...");
        // Android requires one version code across the complete split set.
        // Only change this attribute; loader/factory injection belongs to the base.
        if (spec.manifestOverrides().versionCode != null) {
            ModificationProperty property = new ModificationProperty();
            property.addManifestAttribute(new AttributeItem(NodeValue.Manifest.VERSION_CODE, spec.manifestOverrides().versionCode));
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (InputStream input = Objects.requireNonNull(srcZFile.get(ANDROID_MANIFEST_XML)).open()) {
                new ManifestEditor(input, output, property).processManifest();
            }
            dstZFile.add(ANDROID_MANIFEST_XML, new ByteArrayInputStream(output.toByteArray()));
        }
        for (StoredEntry entry : srcZFile.entries()) {
            String name = entry.getCentralDirectoryHeader().getName();
            if (dstZFile.get(name) != null) continue;
            if (isSignatureEntry(name)) continue;
            linkAlignedEntry(srcZFile, entry);
        }
    }

    /**
     * Points the manifest at LSPatch's component factory and records the patch config in it.
     *
     * The config is written twice on purpose: into the manifest as metadata, where the *manager* can
     * read it from an installed app without opening the apk, and into an asset, where the *loader*
     * reads it at startup without a package manager.
     */
    private void rewriteManifest(
            NestedZip srcZFile, ZFile dstZFile, byte[] configBytes, String packageName, int minSdkVersion,
            int index, int total)
            throws IOException {
        logger.stage(Logger.Stage.REWRITING, index, total);
        logger.i("Patching apk...");
        String metadata = Base64.getEncoder().encodeToString(configBytes);
        StoredEntry manifestEntry = Objects.requireNonNull(srcZFile.get(ANDROID_MANIFEST_XML));
        try (InputStream is = new ByteArrayInputStream(modifyManifestFile(manifestEntry.open(), metadata, packageName, minSdkVersion))) {
            dstZFile.add(ANDROID_MANIFEST_XML, is);
        } catch (IOException e) {
            throw new PatchException("Error when modifying manifest", e);
        }

        logger.i("Adding config...");
        try (InputStream is = new ByteArrayInputStream(configBytes)) {
            dstZFile.add(CONFIG_ASSET_PATH, is);
        } catch (IOException e) {
            throw new PatchException("Error when saving config", e);
        }
    }

    /**
     * Adds the metaloader dex -- the small stub Android runs first.
     *
     * Normally it becomes {@code classes.dex} and the original's dex files are left in the nested
     * copy, untouched. With {@code injectDex} the original's dex files are kept in place and the
     * stub is appended after the last of them instead, because an app whose isolated processes load
     * their own dex (a browser's renderer, say) needs them present in the outer apk.
     */
    private void injectLoader(NestedZip srcZFile, ZFile dstZFile, int index, int total) throws IOException {
        logger.stage(Logger.Stage.INJECTING, index, total);
        logger.i("Adding metaloader dex...");
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(Constants.META_LOADER_DEX_ASSET_PATH)) {
            if (is == null) throw new PatchException("The metaloader dex is missing from this build");
            if (!spec.injectDex()) {
                dstZFile.add("classes.dex", is);
            } else {
                int dexCount = 1;
                for (StoredEntry entry : srcZFile.entries()) {
                    if (isDexEntry(entry.getCentralDirectoryHeader().getName())) dexCount++;
                }
                dstZFile.add(dexCount == 1 ? "classes.dex" : "classes" + dexCount + ".dex", is);
            }
        } catch (PatchException e) {
            throw e;
        } catch (IOException e) {
            throw new PatchException("Error when adding dex", e);
        }
    }

    /** The framework itself: the loader dex and its native library, for a manager-free patch. */
    private void addLoaderPayload(ZFile dstZFile) throws IOException {
        logger.i("Adding loader dex...");
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(LOADER_DEX_ASSET_PATH)) {
            if (is == null) throw new PatchException("The loader dex is missing from this build");
            dstZFile.add(LOADER_DEX_ASSET_PATH, is);
        } catch (PatchException e) {
            throw e;
        } catch (IOException e) {
            throw new PatchException("Error when adding assets", e);
        }

        logger.i("Adding native lib...");
        for (String arch : ARCHES) {
            String entryName = "assets/lspatch/so/" + arch + "/liblspatch.so";
            try (InputStream is = getClass().getClassLoader().getResourceAsStream(entryName)) {
                if (is == null) throw new PatchException("Missing native library for " + arch);
                // Stored, not deflated: it is mapped straight out of the apk at runtime.
                dstZFile.add(entryName, is, false);
            } catch (PatchException e) {
                throw e;
            } catch (IOException e) {
                throw new PatchException("Error when adding native lib for " + arch, e);
            }
            logger.d("added " + entryName);
        }
    }

    /**
     * Bakes each module apk in under its own package name.
     *
     * The entry name is the module's package, which is what the loader enumerates by -- so a module
     * appearing twice cannot be represented, and the first one wins. A module that cannot be read is
     * reported and skipped rather than failing the patch, because one bad module apk should not cost
     * the user the whole build.
     */
    private void embedModules(ZFile dstZFile, int index, int total) {
        if (spec.modules().isEmpty()) return;
        logger.stage(Logger.Stage.EMBEDDING, index, total);
        logger.i("Embedding modules...");
        Set<String> embedded = new LinkedHashSet<>();
        for (File module : spec.modules()) {
            try (ZFile apk = ZFile.openReadOnly(module);
                 InputStream fileIs = new java.io.FileInputStream(module);
                 InputStream xmlIs = Objects.requireNonNull(apk.get(ANDROID_MANIFEST_XML)).open()) {
                ManifestParser.Pair manifest = Objects.requireNonNull(ManifestParser.parseManifestFile(xmlIs));
                String packageName = manifest.packageName;
                if (!embedded.add(packageName)) {
                    logger.e("  - " + packageName + " given more than once, keeping the first");
                    continue;
                }
                logger.i("  - " + packageName);
                dstZFile.add(EMBEDDED_MODULES_ASSET_PATH + packageName + ".apk", fileIs);
            } catch (NullPointerException | IOException e) {
                logger.e(module + " does not exist or is not a valid apk file.");
            }
        }
    }

    /**
     * Links every remaining entry to the nested original instead of copying its bytes.
     *
     * This is what keeps a patched apk from being twice the size of the original. The exclusions are
     * the entries the patch has replaced or invalidated: the rewritten manifest, the original's
     * signatures, and -- unless the dex was injected -- the original's dex files, which are loaded
     * from the nested copy rather than the outer apk.
     */
    private void linkRemainingEntries(NestedZip srcZFile, ZFile dstZFile) throws IOException {
        logger.d("Creating nested apk link...");
        for (StoredEntry entry : srcZFile.entries()) {
            String name = entry.getCentralDirectoryHeader().getName();
            if (dstZFile.get(name) != null) continue;
            if (!spec.injectDex() && isDexEntry(name)) continue;
            if (name.equals(ANDROID_MANIFEST_XML)) continue;
            if (isSignatureEntry(name)) continue;
            linkAlignedEntry(srcZFile, entry);
        }
    }

    private static void linkAlignedEntry(NestedZip source, StoredEntry entry) throws IOException {
        var header = entry.getCentralDirectoryHeader();
        if (header.getName().endsWith(".so")
                && header.getCompressionInfoWithWait().getMethod() == com.android.tools.build.apkzlib.zip.CompressionMethod.STORE
                && (header.getOffset() + entry.getLocalHeaderSize()) % 16384 != 0) {
            // The original stays intact for runtime loading. Duplicating a library in the
            // outer ZIP would add weight without fixing an unaligned nested original.
            throw new PatchException("Unsupported native ZIP alignment: " + header.getName()
                    + ". Use a Discord build with 16 KB-aligned libraries.");
        }
        source.addFileLink(header.getName(), header.getName());
    }

    private static boolean isDexEntry(String name) {
        return name.startsWith("classes") && name.endsWith(".dex");
    }

    private static boolean isSignatureEntry(String name) {
        return name.startsWith("META-INF")
                && (name.endsWith(".SF") || name.endsWith(".MF") || name.endsWith(".RSA"));
    }

    private byte[] modifyManifestFile(InputStream is, String metadata, String packageName, int minSdkVersion)
            throws IOException {
        ModificationProperty property = new ModificationProperty();

        // The loader is built against 28; an app declaring less would be refused the APIs it uses.
        if (minSdkVersion < 28) {
            property.addUsesSdkAttribute(new AttributeItem(NodeValue.UsesSDK.MIN_SDK_VERSION, 28));
        }
        property.addApplicationAttribute(new AttributeItem("hasCode", Boolean.TRUE));
        property.addApplicationAttribute(new AttributeItem(NodeValue.Application.DEBUGGABLE, spec.debuggable()));
        property.addApplicationAttribute(new AttributeItem("appComponentFactory", PROXY_APP_COMPONENT_FACTORY));
        property.addMetaData(new ModificationProperty.MetaData("lspatch", metadata));
        applyManifestOverrides(property, packageName);
        // TODO: replace query_all with queries -> manager
        if (spec.useManager()) {
            property.addUsesPermission("android.permission.QUERY_ALL_PACKAGES");
        }

        ByteArrayOutputStream os = new ByteArrayOutputStream();
        try (InputStream in = is) {
            new ManifestEditor(in, os, property).processManifest();
        }
        os.flush();
        pxb.android.axml.AxmlWriter writer = new pxb.android.axml.AxmlWriter();
        new pxb.android.axml.AxmlReader(os.toByteArray()).accept(new pxb.android.axml.AxmlVisitor(writer) {
            @Override public pxb.android.axml.NodeVisitor child(String ns, String name) {
                pxb.android.axml.NodeVisitor node = super.child(ns, name);
                if (!"manifest".equals(name)) return node;
                return new pxb.android.axml.NodeVisitor(node) {
                    @Override public void end() {
                        pxb.android.axml.NodeVisitor queries = super.child(null, "queries");
                        pxb.android.axml.NodeVisitor manager = queries.child(null, "package");
                        manager.attr("http://schemas.android.com/apk/res/android", "name", 0x01010003, 3, "app.assault.manager");
                        manager.end(); queries.end(); super.end();
                    }
                };
            }
        });
        return writer.toByteArray();
    }

    /**
     * Applies the caller's chosen manifest overrides on top of the loader's own rewrites.
     *
     * Each is set only when the caller asked for it, so an app the user did not want changed keeps
     * every attribute exactly as its author wrote it. A version-code override decides what the
     * installer may replace the app with; a label override replaces the launcher name; a target-SDK
     * override changes the compatibility behaviours the platform applies; the two booleans flip
     * install-time and network policy an app otherwise fixes against a module's needs.
     */
    private void applyManifestOverrides(ModificationProperty property, String packageName) {
        ManifestOverrides o = spec.manifestOverrides();
        if (o.isEmpty()) return;
        if (o.versionCode != null) {
            logger.i("Override versionCode: " + o.versionCode);
            property.addManifestAttribute(new AttributeItem(NodeValue.Manifest.VERSION_CODE, o.versionCode));
        }
        if (o.label != null) {
            logger.i("Override label: " + o.label);
            property.addApplicationAttribute(new AttributeItem(NodeValue.Application.LABEL, o.label));
        }
        if (o.targetSdkVersion != null) {
            logger.i("Override targetSdkVersion: " + o.targetSdkVersion);
            property.addUsesSdkAttribute(new AttributeItem(NodeValue.UsesSDK.TARGET_SDK_VERSION, o.targetSdkVersion));
        }
        if (o.extractNativeLibs != null) {
            logger.i("Override extractNativeLibs: " + o.extractNativeLibs);
            property.addApplicationAttribute(new AttributeItem(NodeValue.Application.EXTRACTNATIVELIBS, o.extractNativeLibs));
        }
        if (o.usesCleartextTraffic != null) {
            logger.i("Override usesCleartextTraffic: " + o.usesCleartextTraffic);
            property.addApplicationAttribute(new AttributeItem("usesCleartextTraffic", o.usesCleartextTraffic));
        }
        // The editor keys uses-permission by name and drops a name the manifest already carries, so
        // handing it one the app declares is harmless -- the added set need not be filtered first.
        for (String permission : o.addedPermissions) {
            logger.i("Add permission: " + permission);
            property.addUsesPermission(permission);
        }
        if (o.injectDocumentsProvider) {
            addDocumentsProvider(property, packageName);
        }
    }

    /**
     * Declares the loader's {@code DocumentsProvider} so the app's private data shows up in the
     * system file picker.
     *
     * The authority is per-package so two patched apps never collide. {@code MANAGE_DOCUMENTS} is the
     * platform-signature permission the Documents UI holds, so gating the provider behind it means
     * only the system can bind it -- access still flows through the user granting a tree, not through
     * any app reaching the authority directly. {@code exported} and {@code grantUriPermissions} are
     * passed as real booleans; a string {@code "true"} would be read back as false and quietly
     * un-export the provider.
     */
    private void addDocumentsProvider(ModificationProperty property, String packageName) {
        String authority = packageName + Constants.DOCUMENTS_PROVIDER_AUTHORITY_SUFFIX;
        logger.i("Add documents provider: " + authority);
        List<AttributeItem> attributes = new ArrayList<>();
        attributes.add(new AttributeItem(NodeValue.Application.NAME, Constants.DOCUMENTS_PROVIDER_CLASS));
        attributes.add(new AttributeItem(NodeValue.Application.Provider.AUTHORITIES, authority));
        attributes.add(new AttributeItem("exported", Boolean.TRUE));
        attributes.add(new AttributeItem("grantUriPermissions", Boolean.TRUE));
        attributes.add(new AttributeItem(NodeValue.Application.Component.PERMISSION, "android.permission.MANAGE_DOCUMENTS"));
        property.addProvider(attributes, "android.content.action.DOCUMENTS_PROVIDER");
    }
}

````

## android/manager/src/main/assets/script_runner.py

````py
"""Termux process supervisor. Invoked only through the authenticated Manager broker."""
import base64
import fcntl
import json
import os
from pathlib import Path
import re
import selectors
import shutil
import signal
import subprocess
import sys
import time

ROOT = Path.home() / '.local/share/assault-runner'
MAX_LOG = 1024 * 1024


def atomic(path, value):
    temporary = path.with_suffix('.tmp')
    with temporary.open('w', encoding='utf-8') as stream:
        json.dump(value, stream)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, path)


def signal_group(pid, sig):
    try:
        os.killpg(pid, sig)
    except ProcessLookupError:
        # A child may exit after poll() but before the stop signal reaches it.
        pass


def identity(pid):
    try:
        # comm may itself contain spaces or parentheses.
        fields = Path('/proc/%s/stat' % pid).read_text().rsplit(')', 1)[1].split()
        if fields[0] == 'Z':
            return None
        return Path('/proc/sys/kernel/random/boot_id').read_text().strip() + ':' + fields[19]
    except (OSError, IndexError):
        return None


def checked_id(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}', value):
        raise ValueError('Invalid project or run identifier.')
    return value


def status(directory):
    path = directory / 'status.json'
    if not path.exists():
        return {'state': 'missing'}
    value = json.loads(path.read_text())
    if value['state'] in ('starting', 'running', 'stopping'):
        reservation = directory / 'owner.lock'
        if reservation.exists():
            with reservation.open('r+b') as owner:
                try:
                    fcntl.flock(owner, fcntl.LOCK_EX | fcntl.LOCK_NB)
                except BlockingIOError:
                    return value  # A launcher, supervisor, guard or script still owns this run.
            value['state'] = 'interrupted'
            value['error'] = 'The run owner stopped. You can run this project again.'
            return value
        if value['state'] == 'starting' and not value.get('identity'):
            # An old unowned reservation cannot safely expire: its supervisor may be delayed.
            return value
        alive = value.get('identity') and identity(value.get('pid')) == value['identity']
        if not alive and time.time() - value.get('updated', 0) > 10:
            value['state'] = 'interrupted'
            value['error'] = 'Android or Termux stopped the supervisor. You can run this project again.'
    return value


def command(directory, payload):
    current = status(directory)
    if current['state'] != 'running':
        raise ValueError('The process is not running. Refresh its status.')
    encoded = (json.dumps(payload) + '\n').encode()
    if len(encoded) > 4096:
        raise ValueError('Input is too long.')
    fd = os.open(directory / 'control', os.O_WRONLY | os.O_NONBLOCK)
    try:
        os.write(fd, encoded)  # <= PIPE_BUF: either the whole message or EAGAIN.
    finally:
        os.close(fd)
    return {'queued': True}


def append_log(stream, chunk):
    stream.write(chunk)
    if stream.tell() > MAX_LOG:
        stream.seek(-MAX_LOG // 2, os.SEEK_END)
        tail = stream.read()
        stream.seek(0)
        stream.truncate()
        stream.write(tail)


def supervise(directory, reservation):
    request = json.loads((directory / 'request.json').read_text())
    project = ROOT / 'projects' / checked_id(request['project'])
    project.mkdir(parents=True, exist_ok=True)
    runtime = request['runtime']
    executable, filename = {'javascript': ('node', 'main.cjs'), 'python': ('python', 'main.py'), 'shell': ('bash', 'main.sh')}[runtime]
    if runtime == 'javascript' and request.get('module') == 'esm':
        filename = 'main.mjs'
    executable = shutil.which(executable)
    child = None
    state = {'state': 'starting', 'pid': os.getpid(), 'identity': identity(os.getpid()), 'updated': time.time()}
    selector = selectors.DefaultSelector()
    stopping = False
    kill_at = None
    log = None
    control = None
    guard = None
    guard_write = None
    try:
        if not executable:
            raise ValueError('Runtime missing. In Termux run: pkg install python nodejs bash')
        source = request['source']
        if not isinstance(source, str) or not source.strip() or len(source.encode()) > 65536:
            raise ValueError('Use a nonempty script of at most 64 KiB.')
        target = project / filename
        # Replace the directory entry instead of following a script-created symlink.
        temporary = project / ('.source-' + checked_id(request['run']))
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            stream.write(source)
        os.replace(temporary, target)
        log = (directory / 'console.log').open('w+b', buffering=0)
        os.mkfifo(directory / 'control', 0o600)
        control = os.open(directory / 'control', os.O_RDWR | os.O_NONBLOCK)
        selector.register(control, selectors.EVENT_READ, 'control')
        child = subprocess.Popen([executable, str(target), *request.get('args', [])], cwd=project,
                                 stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                 start_new_session=True, pass_fds=(reservation,), env={**os.environ, 'PYTHONUNBUFFERED': '1'})
        # A separate guard observes EOF even if Android kills this supervisor with SIGKILL.
        # This prevents a lost supervisor from leaving its script process group behind.
        guard_read, guard_write = os.pipe()
        guard_code = "import os,signal,sys; fd=int(sys.argv[1]); group=int(sys.argv[2]); os.read(fd,1);\ntry: os.killpg(group,signal.SIGKILL)\nexcept ProcessLookupError: pass"
        try:
            guard = subprocess.Popen([sys.executable, '-c', guard_code, str(guard_read), str(child.pid)],
                                     pass_fds=(guard_read, reservation), stdin=subprocess.DEVNULL,
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        finally:
            os.close(guard_read)
        os.set_blocking(child.stdout.fileno(), False)
        os.set_blocking(child.stdin.fileno(), False)
        selector.register(child.stdout, selectors.EVENT_READ, 'output')
        state.update(state='running', updated=time.time())
        atomic(directory / 'status.json', state)
        pending = b''
        while child.poll() is None:
            for key, _ in selector.select(0.1):
                if key.data == 'output':
                    chunk = os.read(child.stdout.fileno(), 8192)
                    if chunk:
                        append_log(log, chunk)
                    else:
                        selector.unregister(child.stdout)
                else:
                    pending += os.read(control, 8192)
                    while b'\n' in pending:
                        line, pending = pending.split(b'\n', 1)
                        item = json.loads(line)
                        if item.get('operation') == 'stop':
                            stopping = True
                            if kill_at is None:
                                signal_group(child.pid, signal.SIGTERM)
                                kill_at = time.monotonic() + 2
                                state.update(state='stopping', updated=time.time())
                                atomic(directory / 'status.json', state)
                        elif item.get('operation') == 'input' and not stopping:
                            try:
                                os.write(child.stdin.fileno(), item['data'].encode())
                            except (BrokenPipeError, BlockingIOError):
                                append_log(log, b'\n[Input not delivered: stdin is closed or full. Retry after the script reads input.]\n')
            if kill_at is not None and time.monotonic() >= kill_at:
                signal_group(child.pid, signal.SIGKILL)
                kill_at = None
        # Close descendants too; completed scripts cannot retain hidden background jobs.
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        # Drain bytes buffered before exit (including immediate print-and-exit programs).
        while True:
            try:
                chunk = os.read(child.stdout.fileno(), 8192)
            except BlockingIOError:
                break
            if not chunk:
                break
            append_log(log, chunk)
        state.update(state='stopped' if stopping else 'exited', exitCode=child.wait(), updated=time.time())
    except Exception as error:
        state.update(state='failed', error=str(error)[:240], updated=time.time())
    finally:
        if child is not None:
            try:
                os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            child.wait()
        if guard_write is not None:
            os.close(guard_write)
        if guard is not None:
            guard.wait(timeout=5)
        selector.close()
        if control is not None:
            os.close(control)
        if log is not None:
            log.close()
        atomic(directory / 'status.json', state)


def prune_runs(parent):
    completed = []
    for directory in parent.iterdir():
        if not directory.is_dir() or directory.is_symlink():
            continue
        if status(directory)['state'] in ('exited', 'failed', 'stopped', 'interrupted', 'missing'):
            completed.append(directory)
    # Nine previous completions plus the new run; active runs and project files are preserved.
    completed.sort(key=lambda directory: directory.stat().st_mtime_ns, reverse=True)
    for directory in completed[9:]:
        shutil.rmtree(directory)


def dispatch(request):
    ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    operation = request['operation']
    if 'sourceBase64' in request:
        encoded = request.pop('sourceBase64')
        if not isinstance(encoded, str) or len(encoded) > 87384:
            raise ValueError('Script exceeds 64 KiB.')
        request['source'] = base64.b64decode(encoded, validate=True).decode('utf-8')
        if len(request['source'].encode()) > 65536:
            raise ValueError('Script exceeds 64 KiB.')
    if operation == 'check':
        return {'python': sys.version.split()[0], 'node': bool(shutil.which('node')), 'bash': bool(shutil.which('bash'))}
    project_id = checked_id(request['project'])
    run_id = checked_id(request['run'])
    directory = ROOT / 'runs' / project_id / run_id
    if operation == 'start':
        if request.get('runtime') not in ('javascript', 'python', 'shell'):
            raise ValueError('Unknown runtime.')
        args = request.get('args', [])
        if not isinstance(args, list) or len(args) > 32 or any(not isinstance(x, str) or len(x) > 2048 or '\0' in x for x in args):
            raise ValueError('Arguments must be an array of at most 32 strings.')
        # Serialize launches across helper invocations; retries with the same ID are idempotent.
        with (ROOT / 'launch.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            if directory.exists():
                return status(directory)
            parent = directory.parent
            parent.mkdir(parents=True, exist_ok=True)
            for previous in parent.iterdir():
                if previous.is_dir() and status(previous)['state'] in ('starting', 'running', 'stopping'):
                    raise ValueError('This project already has an active run. Stop it first.')
            prune_runs(parent)
            directory.mkdir(mode=0o700)
            with (directory / 'owner.lock').open('a+b') as owner:
                fcntl.flock(owner, fcntl.LOCK_EX)
                try:
                    atomic(directory / 'request.json', request)
                    atomic(directory / 'status.json', {'state': 'starting', 'updated': time.time()})
                    helper = directory / 'supervisor.py'
                    helper.write_text(SOURCE, encoding='utf-8')
                    with (directory / 'supervisor.log').open('wb') as errors:
                        subprocess.Popen([sys.executable, str(helper), '--supervise', str(directory), str(owner.fileno())],
                                         pass_fds=(owner.fileno(),), stdin=subprocess.DEVNULL,
                                         stdout=errors, stderr=errors, start_new_session=True)
                except Exception as error:
                    atomic(directory / 'status.json', {'state': 'failed', 'error': str(error)[:240], 'updated': time.time()})
                # Close our descriptor without LOCK_UN: the child inherits the same lock.
        return status(directory)
    if operation == 'poll':
        value = status(directory)
        log = directory / 'console.log'
        value['console'] = ''
        if log.exists():
            with log.open('rb') as stream:
                size = os.fstat(stream.fileno()).st_size
                stream.seek(max(0, size - 16384))
                value['console'] = stream.read(16384).decode('utf-8', errors='replace')
                value['truncated'] = size > 16384
        return value
    if operation in ('stop', 'input'):
        return command(directory, {'operation': operation, 'data': request.get('data', '')})
    raise ValueError('Unknown runner operation.')


# SOURCE is supplied by the broker's bootstrap, and saved for detached supervisors.
if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--supervise':
        reservation = int(sys.argv[3])
        try:
            supervise(Path(sys.argv[2]), reservation)
        finally:
            os.close(reservation)
    else:
        try:
            print(json.dumps(dispatch(json.loads(sys.stdin.read(262145)))))
        except Exception as error:
            print(json.dumps({'error': str(error)[:240]}))

````

## tests/scripts.test.mjs

````mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScriptManager, scriptValues } from '../core/scripts.js';
const script = { name: 'Example', runtime: 'javascript', source: "console.log('hello')", args: [], restart: false };
async function fixture(request = async () => ({ state: 'running' })) {
  const files = new Map();
  const io = { read: async name => files.get(name) ?? null, write: async (name, value) => files.set(name, value) };
  const bridge = { request };
  const manager = new ScriptManager(io, bridge);
  await manager.start();
  return { manager, files, io, bridge };
}
test('scripts persist across reconstruction and export saved sources, settings and run state', async () => {
  const { manager, files, io, bridge } = await fixture(async (_op, { request }) => request.operation === 'poll' ? { state: 'exited', exitCode: 0, console: 'hello\n' } : { state: 'running' });
  const id = await manager.save(script); await manager.run(id); await manager.poll(id);
  const restored = new ScriptManager(io, bridge); await restored.start();
  assert.deepEqual(restored.snapshot(), manager.snapshot());
  assert(files.has('assault-scripts-0.json')); assert(!files.has('assault-addons-0.json'));
  const backup = JSON.parse(await restored.export());
  assert.equal(backup.projects[0].source, script.source); assert.equal(backup.projects[0].run.console, 'hello\n');
  const other = await fixture(); await other.manager.restore(JSON.stringify(backup));
  assert.equal(other.manager.snapshot().projects[0].restart, false); assert.equal(other.manager.snapshot().projects[0].run, null);
  await assert.rejects(other.manager.restore(JSON.stringify(backup)), /empty project/);
});
test('duplicate launches serialize before dispatch and durable ID exists before execution', async () => {
  let launches = 0, unblock;
  const gate = new Promise(resolve => { unblock = resolve; });
  const { manager, files } = await fixture(async (_op, { request }) => { launches++; assert(files.size > 0); assert.equal(manager.snapshot().projects[0].run.id, request.run); await gate; return { state: 'running' }; });
  const id = await manager.save(script);
  const first = manager.run(id), second = manager.run(id);
  unblock(); await first; await assert.rejects(second, /existing run/); assert.equal(launches, 1);
});
test('timeouts preserve an unknown run until reconciliation and save failures never execute', async () => {
  let fail = true, calls = 0;
  const { manager, io } = await fixture(async () => { calls++; if (fail) throw Error('No callback'); return { state: 'missing' }; });
  const id = await manager.save(script);
  await assert.rejects(manager.run(id), /No callback/);
  assert.equal(manager.find(id).run.state, 'unknown');
  await assert.rejects(manager.run(id), /existing run/); assert.equal(calls, 1);
  fail = false; await manager.poll(id); assert.equal(manager.find(id).run.state, 'missing');
  io.write = async () => { throw Error('Disk full'); };
  await assert.rejects(manager.run(id), /Disk full/); assert.equal(calls, 2);
});
test('validation, safe mode, removal and opt-in restarts preserve disabled scripts', async () => {
  for (const value of [{ ...script, args: '[1]' }, { ...script, source: '€'.repeat(30000) }, { ...script, runtime: 'eval' }, { ...script, name: '' }]) assert.throws(() => scriptValues(value));
  let starts = 0;
  const { manager } = await fixture(async (_op, { request }) => { if (request.operation === 'start') starts++; return { state: 'running' }; });
  const id = await manager.save(script);
  await manager.resume(); assert.equal(starts, 0);
  await manager.save({ ...script, restart: true }, id);
  manager.canRun = () => false; await manager.resume(); assert.equal(starts, 0);
  await assert.rejects(manager.run(id), /safe mode/);
  manager.canRun = () => true; await manager.resume(); assert.equal(starts, 1);
  await manager.resume(); assert.equal(starts, 1);
  await assert.rejects(manager.remove(id), /Stop and refresh/);
});
test('setup runs only explicitly and uses the selected project working directory', async () => {
  const requests = [];
  const { manager } = await fixture(async (_op, { request }) => { requests.push(request); return { state: 'exited', exitCode: 0 }; });
  const id = await manager.save({ ...script, setup: 'npm install example' });
  await manager.run(id, true);
  assert.equal(requests[0].project, id); assert.equal(requests[0].runtime, 'shell'); assert.equal(requests[0].source, 'npm install example');
  assert.equal(manager.find(id).run.phase, 'setup');
  await manager.run(id);
  assert.equal(requests[1].runtime, 'javascript'); assert.equal(requests[1].source, script.source);
});
test('runtime checks queue behind an existing launch instead of racing the runner mailbox', async () => {
  let release, entered;
  const gate = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { entered = resolve; });
  const operations = [];
  const { manager } = await fixture(async (_operation, { request }) => {
    operations.push(request.operation);
    if (request.operation === 'start') { entered(); await gate; return { state: 'running' }; }
    return { python: 'test', node: true, bash: true };
  });
  const id = await manager.save(script), launch = manager.run(id); await started;
  const check = manager.check(); assert.deepEqual(operations, ['start']);
  release(); await launch; assert.equal((await check).node, true); assert.deepEqual(operations, ['start', 'check']);
});
test('script journal falls back from structurally invalid recent projects without overwriting either slot', async () => {
  const { manager, files, io, bridge } = await fixture();
  const id = await manager.save(script); await manager.save({ ...script, name: 'new revision' }, id);
  const newest = `assault-scripts-${manager.store.slot}.json`;
  const invalid = JSON.parse(files.get(newest)); invalid.data.projects[0].runtime = 'unsupported'; files.set(newest, JSON.stringify(invalid));
  const before = new Map(files), restarted = new ScriptManager(io, bridge); await restarted.start();
  assert.equal(restarted.find(id).name, 'Example'); assert.deepEqual(files, before);
});

````

## tests/script-screen.test.mjs

````mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { ScriptManager } from '../core/scripts.js';
import { createScriptScreen } from '../core/script-screen.js';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
async function fixture(request = async () => ({ state: 'running' }), addons) {
  const files = new Map(), alerts = [], listeners = new Map();
  const bridge = { request };
  const manager = new ScriptManager({ read: async name => files.get(name) ?? null, write: async (name, text) => files.set(name, text) }, bridge);
  await manager.start();
  const N = Object.fromEntries(['View', 'Text', 'TextInput', 'Pressable', 'ScrollView', 'Switch', 'KeyboardAvoidingView', 'ActivityIndicator'].map(key => [key, key]));
  N.Alert = { alert: (...args) => alerts.push(args) };
  const navigation = { addListener(name, handler) { listeners.set(name, handler); return () => listeners.delete(name); }, dispatch() {} };
  const Screen = createScriptScreen({ metro: { common: { React, ReactNative: N } } }, manager, bridge, addons);
  let view; await act(async () => { view = create(React.createElement(Screen, { navigation })); });
  const button = label => view.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === label);
  const input = label => view.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === label);
  const edit = async (label, value) => act(async () => input(label).props.onChangeText(value));
  const press = async label => act(async () => button(label).props.onPress());
  return { view, manager, alerts, listeners, button, input, edit, press };
}
test('runner validates drafts, preserves failed imports and confirms unsaved navigation', async () => {
  const f = await fixture(async () => { throw Error('Picker cancelled'); });
  await f.edit('Project name', 'Local'); await f.edit('Script source', 'print("hi")'); await f.edit('Arguments (JSON array)', '[1]');
  await f.press('Save project');
  assert.match(f.view.root.findByProps({ accessibilityRole: 'alert' }).props.children, /Arguments/);
  assert.equal(f.input('Script source').props.value, 'print("hi")'); assert.equal(f.manager.snapshot().projects.length, 0);
  await f.press('Python'); assert.equal(f.alerts.length, 1);
  await act(async () => f.alerts[0][2][0].onPress?.());
  assert.equal(f.input('Project name').props.value, 'Local');
  let prevented = false;
  f.listeners.get('beforeRemove')({ preventDefault() { prevented = true; }, data: { action: {} } });
  assert(prevented);
  await f.edit('Arguments (JSON array)', '[]'); await f.press('Save project');
  await f.press('Import script file');
  assert.equal(f.input('Script source').props.value, 'print("hi")');
  assert.match(f.view.root.findByProps({ accessibilityRole: 'alert' }).props.children, /Picker cancelled/);
  await act(async () => f.view.unmount()); assert.equal(f.manager.listeners.size, 0);
});
test('rapid run taps dispatch once, lock editing and finish durable launch after unmount', async () => {
  let started, release, calls = 0;
  const entered = new Promise(resolve => { started = resolve; }), gate = new Promise(resolve => { release = resolve; });
  const f = await fixture(async () => { calls++; started(); await gate; return { state: 'running' }; });
  await f.edit('Project name', 'Example'); await f.edit('Script source', 'console.log(1)');
  let launch;
  await act(async () => { launch = f.button('Save and run').props.onPress(); f.button('Save and run').props.onPress(); await entered; });
  assert.equal(calls, 1); assert.equal(f.input('Script source').props.editable, false);
  await act(async () => f.view.unmount());
  await act(async () => { release(); await launch; });
  assert.equal(f.manager.snapshot().projects[0].run.state, 'running');
});
test('txt imports stay editable JavaScript projects without executing them', async () => {
  let calls = 0;
  const f = await fixture(async op => { calls++; assert.equal(op, 'importScript'); return { filename: 'script.txt', data: 'console.log("imported")' }; });
  await f.press('Import script file');
  assert.equal(f.input('Project name').props.value, 'script');
  assert.equal(f.input('Script source').props.value, 'console.log("imported")');
  assert.equal(f.button('JavaScript').props.accessibilityState.selected, true);
  assert.equal(f.manager.snapshot().projects.length, 0); assert.equal(calls, 1);
  await f.press('Save project'); assert.equal(f.manager.snapshot().projects.length, 1);
  await act(async () => f.view.unmount());
});
test('damaged addon storage does not prevent the independent runner screen from loading', async () => {
  const N = Object.fromEntries(['View', 'Text', 'TextInput', 'Pressable', 'ScrollView', 'Switch', 'KeyboardAvoidingView', 'ActivityIndicator'].map(key => [key, key]));
  N.Alert = { alert() {} };
  await import('../core/index.js');
  const runtime = globalThis.__ASSAULT_ADDONS__, previous = console.error;
  console.error = () => {};
  let view;
  try {
    await runtime.initialize({ metro: { common: { React, ReactNative: N } }, settings: {} }, () => {}, {
      getConstants: () => ({ DocumentsDirPath: '/docs' }), fileExists: async name => name.includes('assault-addons'),
      readFile: async () => 'broken json', writeFile: async () => {},
    });
    assert.match(runtime.page('plugin').default().props.children, /storage is damaged/);
    await act(async () => { view = create(React.createElement(runtime.page('script').default)); });
    assert(view.root.findAllByType('Text').some(node => node.props.children === 'Code runner'));
  } finally { console.error = previous; if (view) await act(async () => view.unmount()); delete globalThis.__ASSAULT_ADDONS__; }
});
test('runner follows theme changes with readable text on bright backgrounds and buttons', async () => {
  let snapshot = { entries: [], selectedTheme: null };
  const listeners = new Set();
  const addons = { subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, snapshot: () => snapshot };
  const f = await fixture(undefined, addons);
  await act(async () => {
    snapshot = { selectedTheme: 'bright', entries: [{ manifest: { id: 'bright', colors: { BACKGROUND_PRIMARY: '#ffffff', BACKGROUND_SECONDARY: '#ffffff', BRAND_500: '#ffffff', TEXT_NORMAL: '#ffffff' } } }] };
    for (const listener of listeners) listener();
  });
  assert.equal(f.view.root.findByType('KeyboardAvoidingView').props.style.backgroundColor, '#ffffff');
  assert.equal(f.input('Script source').props.style.color, '#000000');
  assert.equal(f.button('Check runtimes').findByType('Text').props.style.color, '#000000');
  await act(async () => {
    snapshot = { ...snapshot, entries: [{ manifest: { ...snapshot.entries[0].manifest, colors: { ...snapshot.entries[0].manifest.colors, BRAND_500: '#000000' } } }] };
    for (const listener of listeners) listener();
  });
  assert.equal(f.button('Check runtimes').props.style({ pressed: true }).borderColor, '#ffffff');
  assert.equal(f.button('JavaScript').props.style({ pressed: true }).borderColor, '#ffffff');
  await act(async () => f.view.unmount()); assert.equal(listeners.size, 0);
});

````

## tests/script-runner.test.mjs

````mjs
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
test('Termux helper runs actual Node, Python and Bash processes, bounds output, reconciles and stops', () => {
  execFileSync('python3', ['tests/script-runner.py'], { timeout: 45000, stdio: 'pipe' });
});

````

## tests/script-runner.py

````py
import base64
import fcntl
from unittest.mock import patch
import json
import os
from pathlib import Path
import signal
import tempfile
import time
import unittest

SOURCE = Path('android/manager/src/main/assets/script_runner.py').read_text()


class RunnerTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = os.environ['HOME']
        os.environ['HOME'] = self.temp.name
        self.module = {'__name__': 'runner_test', 'SOURCE': SOURCE}
        exec(compile(SOURCE, 'script_runner.py', 'exec'), self.module)
        self.dispatch = self.module['dispatch']
        self.root = self.module['ROOT']

    def tearDown(self):
        for path in self.root.glob('runs/*/*/status.json'):
            value = json.loads(path.read_text())
            if value['state'] == 'running':
                try:
                    self.dispatch({'operation': 'stop', 'project': path.parent.parent.name, 'run': path.parent.name})
                except (OSError, ValueError):
                    pass
        time.sleep(.2)
        os.environ['HOME'] = self.home
        self.temp.cleanup()

    def start(self, runtime, source, run='run1', project='project1', args=None):
        return self.dispatch({'operation': 'start', 'project': project, 'run': run,
                              'runtime': runtime, 'source': source, 'args': args or []})

    def poll(self, run='run1', project='project1'):
        return self.dispatch({'operation': 'poll', 'project': project, 'run': run})

    def wait(self, predicate, run='run1', project='project1'):
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline:
            value = self.poll(run, project)
            if predicate(value):
                return value
            time.sleep(.04)
        self.fail(str(value))

    def done(self, run='run1', project='project1'):
        return self.wait(lambda value: value['state'] in ('exited', 'failed', 'stopped'), run, project)

    def test_real_node_arguments_and_immediate_output(self):
        self.start('javascript', "console.log('hello', process.argv[2]);", args=[';literal argument'])
        value = self.done()
        self.assertEqual(value['exitCode'], 0)
        self.assertEqual(value['console'], 'hello ;literal argument\n')

    def test_maximum_escaped_source_survives_transport(self):
        source = '#' + '\x01' * 65535
        encoded = base64.b64encode(source.encode()).decode()
        request = {'operation': 'start', 'project': 'project1', 'run': 'run1', 'runtime': 'python', 'sourceBase64': encoded}
        self.assertLess(len(json.dumps(request)), 196608)
        self.dispatch(request)
        self.assertEqual(self.done()['exitCode'], 0)
        self.assertEqual(json.loads((self.root / 'runs/project1/run1/request.json').read_text())['source'], source)
        with self.assertRaises(ValueError):
            self.dispatch({'operation': 'start', 'sourceBase64': 'not-base64'})

    def test_es_modules_allow_import_and_top_level_await(self):
        self.dispatch({'operation': 'start', 'project': 'project1', 'run': 'run1', 'runtime': 'javascript', 'module': 'esm',
                       'source': "import {basename} from 'node:path'; console.log(await Promise.resolve(basename('/a/module')));"})
        value = self.done()
        self.assertEqual(value['exitCode'], 0)
        self.assertEqual(value['console'], 'module\n')

    def test_python_input_and_working_directory_survive_runs(self):
        self.start('python', "print('ready', flush=True)\ntext=input()\nopen('saved.txt','w').write(text)\nprint(text)")
        self.wait(lambda value: 'ready' in value.get('console', ''))
        self.dispatch({'operation': 'input', 'project': 'project1', 'run': 'run1', 'data': 'persisted\n'})
        self.assertIn('persisted', self.done()['console'])
        self.start('python', "print(open('saved.txt').read())", run='run2')
        self.assertEqual(self.done('run2')['console'], 'persisted\n')

    def test_duplicate_start_is_idempotent_and_other_run_rejected(self):
        source = "import time\nprint('ready',flush=True)\ntime.sleep(30)"
        self.start('python', source)
        first = self.wait(lambda value: value['state'] == 'running')
        self.assertEqual(self.start('python', source)['pid'], first['pid'])
        with self.assertRaisesRegex(ValueError, 'already has an active'):
            self.start('python', source, run='run2')
        self.dispatch({'operation': 'stop', 'project': 'project1', 'run': 'run1'})
        self.assertEqual(self.done()['state'], 'stopped')

    def test_stop_signals_tolerate_already_exited_groups(self):
        for sig in (signal.SIGTERM, signal.SIGKILL):
            with patch('os.killpg', side_effect=ProcessLookupError) as send:
                self.module['signal_group'](123, sig)
                send.assert_called_once_with(123, sig)
            with patch('os.killpg', side_effect=PermissionError):
                with self.assertRaises(PermissionError):
                    self.module['signal_group'](123, sig)

    def test_stop_escalates_for_script_ignoring_term(self):
        self.start('python', "import signal,time\nsignal.signal(signal.SIGTERM,signal.SIG_IGN)\nprint('ready',flush=True)\nwhile True: time.sleep(.1)")
        self.wait(lambda value: 'ready' in value.get('console', ''))
        self.dispatch({'operation': 'stop', 'project': 'project1', 'run': 'run1'})
        self.assertEqual(self.done()['exitCode'], -signal.SIGKILL)

    def test_supervisor_death_stops_the_script_group(self):
        self.start('python', "import os,time\nprint(os.getpid(),flush=True)\ntime.sleep(30)")
        value = self.wait(lambda value: value.get('console', '').strip().isdigit())
        child = int(value['console'].strip())
        os.kill(value['pid'], signal.SIGKILL)
        deadline = time.monotonic() + 4
        while self.module['identity'](child) is not None and time.monotonic() < deadline:
            time.sleep(.04)
        self.assertIsNone(self.module['identity'](child))
        value['updated'] = 0
        self.module['atomic'](self.root / 'runs/project1/run1/status.json', value)
        self.assertEqual(self.poll()['state'], 'interrupted')

    def test_delayed_start_stays_reserved_until_its_owner_releases_the_lock(self):
        directory = self.root / 'runs/project1/delayed'
        directory.mkdir(parents=True)
        self.module['atomic'](directory / 'status.json', {'state': 'starting', 'updated': 0})
        self.assertEqual(self.module['status'](directory)['state'], 'starting', 'unowned legacy reservations do not expire')
        with (directory / 'owner.lock').open('a+b') as owner:
            fcntl.flock(owner, fcntl.LOCK_EX)
            self.assertEqual(self.module['status'](directory)['state'], 'starting')
            with self.assertRaisesRegex(ValueError, 'already has an active'):
                self.start('python', 'print("duplicate")')
        self.assertEqual(self.module['status'](directory)['state'], 'interrupted')
        self.start('python', 'print("recovered")')
        self.assertEqual(self.done()['exitCode'], 0)

    def test_known_spawn_failure_releases_the_reservation(self):
        with patch.object(self.module['subprocess'], 'Popen', side_effect=OSError('spawn denied')):
            value = self.start('python', 'print("never started")')
        self.assertEqual(value['state'], 'failed')
        self.assertIn('spawn denied', value['error'])
        self.start('python', 'print("retry")', run='run2')
        self.assertEqual(self.done('run2')['exitCode'], 0)

    def test_run_retention_preserves_active_runs_and_project_files(self):
        self.root.mkdir(parents=True)
        project = self.root / 'projects/project1'
        project.mkdir(parents=True)
        (project / 'user.txt').write_text('preserve')
        parent = self.root / 'runs/project1'
        for index in range(15):
            directory = parent / ('old%s' % index)
            directory.mkdir(parents=True)
            self.module['atomic'](directory / 'status.json', {'state': 'exited', 'exitCode': 0})
        active = parent / 'active'
        active.mkdir()
        self.module['atomic'](active / 'status.json', {'state': 'running', 'pid': os.getpid(), 'identity': self.module['identity'](os.getpid()), 'updated': time.time()})
        self.module['prune_runs'](parent)
        self.assertTrue(active.exists())
        self.assertEqual(len(list(parent.iterdir())), 10)
        self.assertEqual((project / 'user.txt').read_text(), 'preserve')
        self.module['atomic'](active / 'status.json', {'state': 'exited', 'exitCode': 0})
        self.start('python', 'print("new run")')
        self.assertEqual(self.done()['exitCode'], 0)
        self.assertEqual(len(list(parent.iterdir())), 10)

    def test_shell_failures_and_large_console(self):
        self.start('shell', "printf 'failure\\n' >&2\nexit 7")
        value = self.done()
        self.assertEqual(value['exitCode'], 7)
        self.assertEqual(value['console'], 'failure\n')
        self.start('python', "print('x'*2000000)\nprint('last line')", run='run2')
        value = self.done('run2')
        self.assertTrue(value['truncated'])
        self.assertLessEqual(len(value['console']), 16384)
        self.assertTrue(value['console'].endswith('last line\n'))
        self.assertLessEqual((self.root / 'runs/project1/run2/console.log').stat().st_size, 1048576)

    def test_invalid_source_arguments_paths_and_interrupted_identity(self):
        with self.assertRaises(ValueError):
            self.start('python', 'pass', project='../escape')
        with self.assertRaises(ValueError):
            self.start('python', 'pass', args=['\0'])
        self.start('python', '')
        self.assertEqual(self.done()['state'], 'failed')
        directory = self.root / 'runs/project1/run1'
        self.module['atomic'](directory / 'status.json', {'state': 'running', 'pid': os.getpid(), 'identity': 'wrong-boot', 'updated': 0})
        self.assertEqual(self.poll()['state'], 'interrupted')
        with self.assertRaises(ValueError):
            self.dispatch({'operation': 'stop', 'project': 'project1', 'run': 'run1'})


if __name__ == '__main__':
    unittest.main()

````

## tests/script-trust.test.mjs

````mjs
import { test } from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
test('broker authenticates the local signer and decodes Termux success and failure codes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'assault-script-trust-'));
  try {
    mkdirSync(join(dir, 'keys'));
    execFileSync('keytool', ['-genkeypair', '-alias', 'client', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '1', '-dname', 'CN=Synthetic Test', '-storepass', 'assault-local-key', '-keypass', 'assault-local-key', '-keystore', join(dir, 'keys/client-signing.bks')], { stdio: 'pipe' });
    const provider = readFileSync('android/manager/src/main/java/app/assault/manager/ScriptProvider.java', 'utf8');
    const method = provider.slice(provider.indexOf('    private void authorize()'), provider.indexOf('    @Override public Bundle call'));
    const truncated = provider.match(/    static boolean truncated[\s\S]*?\n    }/)[0];
    const successful = provider.match(/    static boolean successful[\s\S]*?\n    }/)[0];
    writeFileSync(join(dir, 'TrustTest.java'), `
import java.io.*;
import java.security.*;
public class TrustTest {
 static class Activity { static int RESULT_OK=-1; }
 ${successful}
 ${truncated}
 static class Binder { static int uid=1; static int getCallingUid(){return uid;} }
 static class PackageManager { static int GET_SIGNING_CERTIFICATES=1; String[] packages={"com.discord"};
  Info info=new Info(); String[] getPackagesForUid(int uid){return packages;} Info getPackageInfo(String p,int flags){return info;} }
 static class Info { SigningInfo signingInfo=new SigningInfo(); }
 static class SigningInfo { Signature[] signers; Signature[] getApkContentsSigners(){return signers;} }
 static class Signature { byte[] data; Signature(byte[] data){this.data=data;} byte[] toByteArray(){return data;} }
 static class AppInfo { int uid=1; }
 static class Context { File dir; PackageManager pm=new PackageManager(); AppInfo getApplicationInfo(){return new AppInfo();} PackageManager getPackageManager(){return pm;} File getFilesDir(){return dir;} }
 static Context context=new Context(); Context getContext(){return context;}
 ${method}
 static void rejected(TrustTest gate)throws Exception {try{gate.authorize();throw new AssertionError("accepted untrusted caller");}catch(SecurityException expected){}}
 public static void main(String[] args)throws Exception {
  if(!successful(-1,0)||successful(0,0)||successful(1,0)||successful(-1,7)||successful(-1,-1))throw new AssertionError("Termux result code handling");
  if(truncated("10",10)||truncated(null,10)||!truncated("11",10)||!truncated("bad",10)||!truncated("-1",10))throw new AssertionError("Termux string output length");
  context.dir=new File(args[0]); TrustTest gate=new TrustTest(); gate.authorize();
  Binder.uid=2;
  context.pm.packages=new String[]{"evil.app"};rejected(gate);
  context.pm.packages=new String[]{"com.discord","evil.app"};rejected(gate);
  context.pm.packages=new String[]{"com.discord"};
  KeyStore store=KeyStore.getInstance(KeyStore.getDefaultType());try(var in=new FileInputStream(new File(context.dir,"client-signing.bks"))){store.load(in,"assault-local-key".toCharArray());}
  byte[] cert=store.getCertificate("client").getEncoded();
  context.pm.info.signingInfo.signers=new Signature[]{new Signature(cert)};gate.authorize();
  context.pm.info.signingInfo.signers=new Signature[]{new Signature(new byte[]{1,2,3})};rejected(gate);
  context.pm.info.signingInfo.signers=new Signature[]{new Signature(cert),new Signature(cert)};rejected(gate);
  context.pm.info.signingInfo=null;rejected(gate);
 }
}`);
    execFileSync('javac', ['-d', dir, join(dir, 'TrustTest.java')]);
    execFileSync('java', ['-cp', dir, 'TrustTest', join(dir, 'keys')]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

````

## tests/script-visibility.test.mjs

````mjs
import { test } from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, delimiter } from 'node:path';
import { execFileSync } from 'node:child_process';
test('client manifest query rewrite preserves existing package visibility and app attributes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'assault-script-visibility-'));
  try {
    const source = readFileSync('android/manager/src/main/java/org/lsposed/patch/ApkPatcher.java', 'utf8');
    const start = source.indexOf('        pxb.android.axml.AxmlWriter writer =');
    const finish = source.indexOf('        return writer.toByteArray();', start) + '        return writer.toByteArray();'.length;
    if (start < 0 || finish < start) throw Error('Manifest query transform missing');
    writeFileSync(join(dir, 'VisibilityTest.java'), `
import pxb.android.axml.*;
public class VisibilityTest {
 static byte[] transform(byte[] input)throws Exception {
  java.io.ByteArrayOutputStream os=new java.io.ByteArrayOutputStream();os.write(input);
  ${source.slice(start, finish)}
 }
 public static void main(String[] args)throws Exception {
  AxmlWriter writer=new AxmlWriter();
  NodeVisitor manifest=writer.child(null,"manifest");manifest.attr(null,"package",-1,3,"com.discord");
  NodeVisitor queries=manifest.child(null,"queries");NodeVisitor original=queries.child(null,"package");
  original.attr("http://schemas.android.com/apk/res/android","name",0x01010003,3,"existing.provider");original.end();queries.end();
  NodeVisitor app=manifest.child(null,"application");app.attr("http://schemas.android.com/apk/res/android","label",0x01010001,3,"Assault");app.end();manifest.end();writer.end();
  java.util.Set<String> packages=new java.util.HashSet<>();boolean[] preserved={false,false};
  new AxmlReader(transform(writer.toByteArray())).accept(new AxmlVisitor(){
   @Override public NodeVisitor child(String ns,String name){
    if(!"manifest".equals(name))return null;
    return new NodeVisitor(){
     @Override public void attr(String ns,String name,int resource,int type,Object value){if("package".equals(name)&&"com.discord".equals(value))preserved[0]=true;}
     @Override public NodeVisitor child(String ns,String name){
      if("application".equals(name))return new NodeVisitor(){@Override public void attr(String ns,String name,int resource,int type,Object value){if("label".equals(name)&&"Assault".equals(value))preserved[1]=true;}};
      if(!"queries".equals(name))return null;
      return new NodeVisitor(){@Override public NodeVisitor child(String ns,String name){return new NodeVisitor(){@Override public void attr(String ns,String name,int resource,int type,Object value){if("name".equals(name))packages.add(String.valueOf(value));}};}};
     }
    };
   }
  });
  if(!packages.equals(java.util.Set.of("existing.provider","app.assault.manager"))||!preserved[0]||!preserved[1])throw new AssertionError(packages.toString());
 }
}`);
    const dependency = resolve('android/deps/lspatch.jar');
    execFileSync('javac', ['-cp', dependency, '-d', dir, join(dir, 'VisibilityTest.java')]);
    execFileSync('java', ['-cp', [dir, dependency].join(delimiter), 'VisibilityTest']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

````

## core/bridge.js

````js
import { ensure, LIMITS, utf8Size } from '../utils/validation.js';
export function nativeBridge(files, linking, channel = 'addon') {
  ensure(['addon', 'script'].includes(channel), 'Unknown native channel.');
  const prefix = `assault-${channel}`;
  const constants = files.getConstants();
  const read = async (directory, name) => {
    const path = `${directory}/${name}`;
    return await files.fileExists(path) ? files.readFile(path, 'utf8') : null;
  };
  let busy = false, sequence = 0;
  return {
    io: { read: name => read(constants.DocumentsDirPath, name), write: (name, text) => files.writeFile('documents', name, text, 'utf8') },
    async request(operation, options = {}) {
      ensure(channel !== 'script' || operation === 'runner', 'The script channel only accepts runner requests.');
      ensure(!busy, 'Finish the current file operation first.'); busy = true;
      const id = `${Date.now()}-${++sequence}`, output = `${prefix}-result-${id}.json`;
      let requestTouched = false;
      try {
        const payload = JSON.stringify({ id, operation, ...options });
        ensure(utf8Size(payload) <= LIMITS.archive * 2, 'Request is too large.');
        requestTouched = true;
        await files.writeFile('cache', `${prefix}-request.json`, payload, 'utf8');
        await linking.openURL(`${prefix}s://request/${id}`);
        const deadline = Date.now() + 2 * 60 * 1000;
        while (Date.now() < deadline) {
          const text = await read(constants.CacheDirPath, output);
          if (text !== null) { const result = JSON.parse(text); ensure(!result.error, result.error); return result; }
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        throw new Error('The file operation did not finish within 2 minutes. Close the picker and retry.');
      } finally {
        let cleanupFailed = false;
        try {
          if (requestTouched) for (const name of [output, `${prefix}-request.json`]) {
            try {
              ensure(typeof files.removeFile === 'function', 'File deletion unavailable.');
              await files.removeFile('cache', name);
              ensure(!await files.fileExists(`${constants.CacheDirPath}/${name}`), 'File deletion failed.');
            } catch {
              try {
                await files.writeFile('cache', name, '{}', 'utf8');
                ensure(await read(constants.CacheDirPath, name) === '{}', 'Cleanup verification failed.');
              } catch { cleanupFailed = true; }
            }
          }
        } finally { busy = false; }
        ensure(!cleanupFailed, 'Temporary request cleanup failed. Check device storage before retrying.');
      }
    }
  };
}

````

## tests/addon-ui.test.mjs

````mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { createScreens } from '../core/screens.js';
import { nativeBridge } from '../core/bridge.js';
import { AddonManager } from '../plugins/index.js';
import { Journal } from '../utils/store.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const source = `export default { id:'sample', kind:'plugin', name:'Sample', version:'1.0.0', settings:{ label:{type:'string',label:'Label',default:'initial'} }, onStart(api){api.setState('started',true);} };`;
const RN = Object.fromEntries(['Text', 'View', 'Pressable', 'TextInput', 'Switch', 'ScrollView', 'ActivityIndicator', 'KeyboardAvoidingView'].map(name => [name, name]));
RN.Alert = { alert() {} };
test('React Native manager opens individual settings, persists edits, toggles, and displays picker errors', async () => {
  const files = new Map(), manager = new AddonManager(new Journal({ read: async n => files.get(n) ?? null, write: async (n, t) => files.set(n, t) }), { applyTheme() {}, notify() {} });
  await manager.start(); await manager.install(source, 'sample.txt');
  const screens = createScreens({ metro: { common: { React, ReactNative: RN } } }, manager, { request: async () => { throw Error('Permission denied'); } });
  let view; await act(async () => { view = create(React.createElement(screens.plugin)); });
  const button = label => view.root.findAllByType('Pressable').find(n => n.props.accessibilityLabel === label);
  await act(async () => button('Plugin settings').props.onPress());
  assert.equal(view.root.findByType('TextInput').props.value, 'initial');
  await act(async () => view.root.findByType('TextInput').props.onChangeText('saved edit'));
  await act(async () => button('Save settings').props.onPress());
  assert.equal(manager.data.entries[0].settings.label, 'saved edit');
  assert.equal(view.root.findByType('TextInput').props.value, 'saved edit');
  await act(async () => button('Back to plugins').props.onPress());
  await act(async () => view.root.findByType('Switch').props.onValueChange(true));
  assert.equal(manager.data.entries[0].enabled, true);
  await act(async () => button('Import JavaScript file').props.onPress());
  assert.equal(view.root.findByProps({ accessibilityRole: 'alert' }).props.children, 'Permission denied');
  await act(async () => view.unmount()); assert.equal(manager.listeners.size, 0);
});
test('native bridge cleans temporary request credentials on success and bridge failure', async () => {
  const data = new Map();
  const files = { getConstants: () => ({ DocumentsDirPath: '/docs', CacheDirPath: '/cache' }), fileExists: async p => data.has(p), readFile: async p => data.get(p), writeFile: async (dir, n, text) => data.set(`/${dir}/${n}`, text), removeFile: async (dir, n) => data.delete(`/${dir}/${n}`) };
  const bridge = nativeBridge(files, { openURL: async uri => { const id = uri.split('/').at(-1); data.set(`/cache/assault-addon-result-${id}.json`, JSON.stringify({ saved: true })); } });
  assert.equal((await bridge.request('uploadBackup', { token: 'synthetic' })).saved, true);
  assert.equal(data.size, 0);
  const failed = nativeBridge(files, { openURL: async () => { throw Error('No bridge'); } });
  await assert.rejects(failed.request('uploadBackup', { token: 'synthetic' }), /No bridge/); assert.equal(data.size, 0);
});
test('addon bootstrap renders a readable fallback before initialization and on storage failure', async () => {
  globalThis.React = React; globalThis.ReactNative = RN;
  await import('../core/index.js');
  const runtime = globalThis.__ASSAULT_ADDONS__;
  assert.match(runtime.page('plugin').default().props.children, /still loading/);
  const report = console.error; console.error = () => {};
  try {
    await runtime.initialize({ metro: { common: { React, ReactNative: RN } } }, () => {}, { readFile() {}, writeFile() {}, fileExists: async () => { throw Error('Permission denied'); }, getConstants: () => ({ DocumentsDirPath: '/private' }) });
    assert.match(runtime.page('plugin').default().props.children, /Permission denied/);
  } finally { console.error = report; delete globalThis.React; delete globalThis.ReactNative; delete globalThis.__ASSAULT_ADDONS__; }
});
test('bridge rejects oversized UTF8 payloads before starting a native operation', async () => {
  let writes = 0, opens = 0;
  const bridge = nativeBridge({ getConstants: () => ({}), writeFile: async () => writes++, removeFile: async () => {} }, { openURL: async () => opens++ });
  await assert.rejects(bridge.request('uploadBackup', { data: '€'.repeat(3000000) }), /too large/);
  assert.equal(writes, 0); assert.equal(opens, 0);
});
test('a request stays exclusive until asynchronous cleanup finishes', async () => {
  let releaseCleanup, cleanupStarted;
  const cleanupGate = new Promise(resolve => { releaseCleanup = resolve; });
  const enteredCleanup = new Promise(resolve => { cleanupStarted = resolve; });
  const data = new Map();
  let blockCleanup = true, opens = 0;
  const files = {
    getConstants: () => ({ CacheDirPath: '/cache' }),
    fileExists: async p => data.has(p), readFile: async p => data.get(p),
    writeFile: async (dir, name, text) => data.set(`/${dir}/${name}`, text),
    removeFile: async (dir, name) => {
      if (blockCleanup) { cleanupStarted(); await cleanupGate; }
      data.delete(`/${dir}/${name}`);
    }
  };
  const bridge = nativeBridge(files, { openURL: async uri => {
    opens++; data.set(`/cache/assault-addon-result-${uri.split('/').at(-1)}.json`, '{"saved":true}');
  } });
  const first = bridge.request('export');
  await enteredCleanup;
  await assert.rejects(bridge.request('import'), /Finish the current file operation/);
  assert.equal(opens, 1);
  blockCleanup = false; releaseCleanup(); await first;
  assert.equal((await bridge.request('export')).saved, true);
  assert.equal(opens, 2); assert.equal(data.size, 0);
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function screenFixture({ plugin = source, request = async () => ({}), navigation } = {}) {
  const files = new Map(), alerts = [], handlers = new Set();
  const io = { read: async n => files.get(n) ?? null, write: async (n, value) => files.set(n, value) };
  const host = { applyTheme() {}, notify() {} };
  const manager = new AddonManager(new Journal(io), host);
  await manager.start();
  if (plugin) await manager.install(plugin, 'sample.txt');
  const native = { ...RN, Platform: { OS: 'android' }, Alert: { alert: (...args) => alerts.push(args) }, BackHandler: {
    addEventListener: (_event, fn) => { handlers.add(fn); return { remove: () => handlers.delete(fn) }; },
  } };
  const screens = createScreens({ metro: { common: { React, ReactNative: native } } }, manager, { request });
  let view;
  await act(async () => { view = create(React.createElement(screens.plugin, { navigation })); });
  return {
    manager, io, host, alerts, handlers, view,
    button: label => view.root.findAllByType('Pressable').find(n => n.props.accessibilityLabel === label),
    input: label => view.root.findAllByType('TextInput').find(n => n.props.accessibilityLabel === label),
    text: () => view.root.findAllByType('Text').map(n => n.props.children).filter(v => typeof v === 'string').join('\n'),
    close: async () => { await act(async () => view.unmount()); },
  };
}

test('immediate duplicate taps start one import; failure clears progress and retry works', async () => {
  const wait = deferred(); let calls = 0;
  const f = await screenFixture({ plugin: null, request: () => { calls++; return wait.promise; } });
  const press = f.button('Import JavaScript file').props.onPress;
  let first;
  await act(async () => { first = press(); press(); });
  assert.equal(calls, 1);
  assert.match(f.text(), /Importing addon/);
  assert.equal(f.button('Import JavaScript file').props.disabled, true);
  await act(async () => { wait.reject(Error('File missing')); await first; });
  assert.match(f.text(), /File missing/);
  assert.doesNotMatch(f.text(), /Importing addon/);
  assert.equal(f.button('Import JavaScript file').props.disabled, false);
  await act(async () => f.button('Import JavaScript file').props.onPress());
  assert.equal(calls, 2);
  await f.close();
});

test('numeric and string field errors retain drafts and corrected settings survive restart', async () => {
  const plugin = source.replace("label:{type:'string',label:'Label',default:'initial'}", "label:{type:'string',label:'Label',default:'initial'}, count:{type:'number',label:'Count',default:2,min:1,max:5}");
  const f = await screenFixture({ plugin });
  await act(async () => f.button('Plugin settings').props.onPress());
  await act(async () => { f.input('Count').props.onChangeText(''); f.input('Label').props.onChangeText('x'.repeat(513)); });
  await act(async () => f.button('Save settings').props.onPress());
  assert.match(f.text(), /Enter a number from 1 to 5/);
  assert.match(f.text(), /no more than 512/);
  assert.equal(f.input('Count').props.value, '');
  assert.equal(f.manager.snapshot().entries[0].settings.label, 'initial');
  await act(async () => { f.input('Count').props.onChangeText('4'); f.input('Label').props.onChangeText('corrected'); });
  await act(async () => f.button('Save settings').props.onPress());
  assert.match(f.text(), /Settings saved/);
  assert.doesNotMatch(f.text(), /Unsaved changes/);
  const restored = new AddonManager(new Journal(f.io), f.host);
  await restored.start();
  assert.equal(restored.snapshot().entries[0].settings.count, 4);
  assert.equal(restored.snapshot().entries[0].settings.label, 'corrected');
  await f.close();
});

test('slow and failed saves lock editing synchronously, retain drafts, and permit retry', async () => {
  const f = await screenFixture();
  await act(async () => f.button('Plugin settings').props.onPress());
  await act(async () => f.input('Label').props.onChangeText('draft'));
  const wait = deferred(), configure = f.manager.configure.bind(f.manager); let calls = 0;
  f.manager.configure = () => { calls++; return wait.promise; };
  const press = f.button('Save settings').props.onPress, edit = f.input('Label').props.onChangeText;
  let saving;
  await act(async () => { saving = press(); press(); edit('racing edit'); });
  assert.equal(calls, 1);
  assert.equal(f.input('Label').props.value, 'draft');
  assert.equal(f.input('Label').props.editable, false);
  assert.match(f.text(), /Saving plugin settings/);
  await act(async () => { wait.reject(Error('Disk full')); await saving; });
  assert.equal(f.input('Label').props.editable, true);
  assert.equal(f.input('Label').props.value, 'draft');
  assert.match(f.text(), /Disk full/);
  f.manager.configure = configure;
  await act(async () => f.button('Save settings').props.onPress());
  assert.equal(f.manager.snapshot().entries[0].settings.label, 'draft');
  await f.close();
});

test('saved settings and failed hook are reported together without false success notice', async () => {
  const plugin = source.replace('onStart(api)', "onSettingsChanged(api){api.getSetting('missing');}, onStart(api)");
  const f = await screenFixture({ plugin });
  await act(async () => f.manager.enable('sample', true));
  await act(async () => f.button('Plugin settings').props.onPress());
  await act(async () => f.input('Label').props.onChangeText('persisted'));
  await act(async () => f.button('Save settings').props.onPress());
  assert.equal(f.manager.snapshot().entries[0].enabled, false);
  assert.equal(f.manager.snapshot().entries[0].settings.label, 'persisted');
  assert.match(f.text(), /Settings saved\. Plugin is disabled: Unknown setting/);
  assert.doesNotMatch(f.text(), /Unsaved changes/);
  assert.equal(f.view.root.findAllByType('Text').filter(n => n.props.children === 'Settings saved.').length, 0);
  await f.close();
});

test('unsaved settings require confirmation for button, hardware and navigation back', async () => {
  let listener; const dispatched = [];
  const navigation = { addListener: (_name, fn) => { listener = fn; return () => { listener = null; }; }, dispatch: action => dispatched.push(action) };
  const f = await screenFixture({ navigation });
  await act(async () => f.button('Plugin settings').props.onPress());
  await act(async () => f.input('Label').props.onChangeText('unsaved'));
  await act(async () => f.button('Back to plugins').props.onPress());
  assert.equal(f.alerts.length, 1);
  assert.equal(f.input('Label').props.value, 'unsaved');
  await act(async () => [...f.handlers][0]());
  assert.equal(f.alerts.length, 2);
  let prevented = false;
  await act(async () => listener({ preventDefault: () => { prevented = true; }, data: { action: 'BACK' } }));
  assert.equal(prevented, true);
  await act(async () => f.alerts.at(-1)[2][1].onPress());
  assert.deepEqual(dispatched, ['BACK']);
  await act(async () => f.button('Back to plugins').props.onPress());
  await act(async () => f.alerts.at(-1)[2][1].onPress());
  assert.ok(f.button('Plugin settings'));
  assert.equal(f.handlers.size, 0);
  await f.close();
});

test('unmount during import lets durable installation finish without retained listeners', async () => {
  const wait = deferred();
  const f = await screenFixture({ plugin: null, request: () => wait.promise });
  let importing;
  await act(async () => { importing = f.button('Import JavaScript file').props.onPress(); });
  await f.close();
  await act(async () => { wait.resolve({ data: source, filename: 'sample.txt' }); await importing; });
  assert.equal(f.manager.snapshot().entries.length, 1);
  assert.equal(f.manager.listeners.size, 0);
});

test('failed remote download preserves form data and all actions recover', async () => {
  const f = await screenFixture({ request: async () => { throw Error('Network disconnected'); } });
  await act(async () => f.button('Install from HTTPS URL').props.onPress());
  await act(async () => { f.input('Direct HTTPS URL').props.onChangeText('https://example.test/plugin.js'); f.input('Publisher SHA-256 checksum').props.onChangeText('a'.repeat(64)); });
  await act(async () => f.button('Download and validate').props.onPress());
  assert.match(f.text(), /Network disconnected/);
  assert.equal(f.input('Direct HTTPS URL').props.value, 'https://example.test/plugin.js');
  assert.equal(f.input('Publisher SHA-256 checksum').props.value, 'a'.repeat(64));
  assert.ok(f.view.root.findAllByType('Pressable').every(n => !n.props.disabled));
  assert.equal(f.view.root.findByType('KeyboardAvoidingView').props.behavior, 'height');
  await f.close();
});

test('a lost native callback times out, cleans its mailbox and permits retry', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1700000000000 });
  const data = new Map(); let respond = false;
  const bridge = nativeBridge({
    getConstants: () => ({ CacheDirPath: '/cache' }),
    fileExists: async path => data.has(path), readFile: async path => data.get(path),
    writeFile: async (dir, name, value) => data.set(`/${dir}/${name}`, value),
    removeFile: async (dir, name) => data.delete(`/${dir}/${name}`),
  }, { openURL: async uri => {
    if (respond) data.set(`/cache/assault-addon-result-${uri.split('/').at(-1)}.json`, '{"saved":true}');
  } });
  const pending = bridge.request('import');
  const failure = assert.rejects(pending, /within 2 minutes/);
  await new Promise(setImmediate);
  t.mock.timers.tick(120000);
  await failure;
  assert.equal(data.size, 0);
  respond = true;
  assert.equal((await bridge.request('export')).saved, true);
  assert.equal(data.size, 0);
});
test('runner and addon channels keep independent mailboxes, locks and cleanup', async () => {
  const data = new Map();
  let release, entered;
  const gate = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { entered = resolve; });
  const files = {
    getConstants: () => ({ CacheDirPath: '/cache' }), fileExists: async path => data.has(path), readFile: async path => data.get(path),
    writeFile: async (directory, name, value) => data.set(`/${directory}/${name}`, value), removeFile: async (directory, name) => data.delete(`/${directory}/${name}`),
  };
  const linking = { async openURL(url) {
    const runner = url.startsWith('assault-scripts:'), id = url.split('/').at(-1);
    if (runner) { entered(); await gate; }
    data.set(`/cache/assault-${runner ? 'script' : 'addon'}-result-${id}.json`, JSON.stringify(runner ? { state: 'running' } : { filename: 'plugin.txt' }));
  } };
  const runner = nativeBridge(files, linking, 'script'), addons = nativeBridge(files, linking);
  const executing = runner.request('runner'); await started;
  assert.equal((await addons.request('import')).filename, 'plugin.txt');
  assert(data.has('/cache/assault-script-request.json'));
  release(); assert.equal((await executing).state, 'running'); assert.equal(data.size, 0);
  await assert.rejects(runner.request('import'), /only accepts runner/);
});
test('plugin startup write failures render saved settings and offer an explicit activation retry', async () => {
  const f = await screenFixture();
  await act(async () => f.manager.enable('sample', true));
  const write = f.io.write; f.io.write = async () => { throw Error('Disk unavailable'); };
  await act(async () => f.manager.start());
  assert.match(f.text(), /Needs attention/); assert.match(f.text(), /Saved configuration is preserved/);
  assert(f.button('Plugin settings')); assert(f.button('Retry plugin activation'));
  f.io.write = write; await act(async () => f.button('Retry plugin activation').props.onPress());
  assert.equal(f.button('Retry plugin activation'), undefined); assert.doesNotMatch(f.text(), /Could not start/);
  await f.close();
});

test('bridge overwrites and verifies temporary data if deletion is absent or fails', async () => {
  for (const mode of ['absent', 'throws', 'no-op']) {
    const data = new Map();
    const files = {
      getConstants: () => ({ CacheDirPath: '/cache' }),
      fileExists: async path => data.has(path), readFile: async path => data.get(path),
      writeFile: async (dir, name, value) => data.set(`/${dir}/${name}`, value),
    };
    if (mode === 'throws') files.removeFile = async () => { throw Error('Unavailable'); };
    if (mode === 'no-op') files.removeFile = async () => {};
    const bridge = nativeBridge(files, { openURL: async uri => {
      data.set(`/cache/assault-addon-result-${uri.split('/').at(-1)}.json`, '{"saved":true}');
    } });
    assert.equal((await bridge.request('uploadBackup', { token: 'synthetic-secret' })).saved, true);
    assert.ok([...data.values()].every(value => value === '{}'));
    const failed = nativeBridge(files, { openURL: async () => { throw Error('No bridge'); } });
    await assert.rejects(failed.request('uploadBackup', { token: 'synthetic-secret' }), /No bridge/);
    assert.ok([...data.values()].every(value => value === '{}'));
  }
});

test('failed cleanup is reported and releases the bridge for deliberate retry', async () => {
  const data = new Map(); let failCleanup = true;
  const files = {
    getConstants: () => ({ CacheDirPath: '/cache' }),
    fileExists: async path => data.has(path), readFile: async path => data.get(path),
    writeFile: async (dir, name, value) => { if (failCleanup && value === '{}') throw Error('Storage full'); data.set(`/${dir}/${name}`, value); },
  };
  const bridge = nativeBridge(files, { openURL: async uri => { data.set(`/cache/assault-addon-result-${uri.split('/').at(-1)}.json`, '{"saved":true}'); } });
  await assert.rejects(bridge.request('uploadBackup', { token: 'synthetic-secret' }), /Temporary request cleanup failed/);
  failCleanup = false;
  assert.equal((await bridge.request('uploadBackup')).saved, true);
  assert.ok(![...data.values()].some(value => value.includes('synthetic-secret')));
});

````

## android/loader/src/main/java/app/assault/loader/ScriptDocuments.java

````java
package app.assault.loader;

import android.content.Context;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import de.robv.android.xposed.XposedBridge;

/** Separate mailbox/worker so script status never occupies an addon document session. */
final class ScriptDocuments {
    private static boolean running;
    static void cleanup(Context context) {
        File[] files = context.getCacheDir().listFiles((directory, name) -> name.equals("assault-script-request.json") || name.startsWith("assault-script-result-") || name.startsWith(".pending-assault-script-result-"));
        if (files != null) for (File file : files) if (file.isFile()) file.delete();
    }
    static synchronized void begin(Context context, String id) throws Exception {
        if (running) throw new IOException("A runner request is already in progress. Refresh shortly.");
        File mailbox = new File(context.getCacheDir(), "assault-script-request.json");
        JSONObject request;
        try (var in = new FileInputStream(mailbox)) { request = new JSONObject(AddonTransfer.decode(AddonTransfer.read(in, 1024 * 1024))); }
        if (!id.equals(request.optString("id"))) throw new IOException("Expired script request.");
        if (!"runner".equals(request.optString("operation"))) throw new IOException("Unknown script request.");
        mailbox.delete();
        File output = new File(context.getCacheDir(), "assault-script-result-" + id + ".json");
        var resolver = context.getContentResolver();
        running = true;
        Thread worker = new Thread(() -> {
            try {
                JSONObject result;
                try { result = AddonDocuments.runner(request, resolver); }
                catch (Exception error) {
                    String message = String.valueOf(error.getMessage());
                    result = new JSONObject().put("error", message.substring(0, Math.min(240, message.length())));
                }
                AddonFiles.publish(output, result.toString().getBytes(StandardCharsets.UTF_8));
            } catch (Exception error) { XposedBridge.log("Assault script result could not be saved: " + error.getClass().getSimpleName()); }
            finally { synchronized (ScriptDocuments.class) { running = false; } }
        }, "Assault script bridge");
        try { worker.start(); }
        catch (RuntimeException error) { running = false; throw error; }
    }
}

````

## utils/store.js

````js
import { ensure, jsonCopy, LIMITS } from './validation.js';
// Two independent slots preserve the previous valid revision after an interrupted
// write. A save is acknowledged only after reading the exact bytes back.
export class Journal {
  constructor(io) { this.io = io; this.revision = 0; this.slot = 1; }
  async load(validate = value => value) {
    const candidates = [];
    let present = false;
    for (let slot = 0; slot < 2; slot++) {
      const text = await this.io.read(`assault-addons-${slot}.json`);
      if (text === null) continue;
      present = true;
      try {
        ensure(text.length * 2 <= LIMITS.archive, 'Archive too large.');
        const value = JSON.parse(text);
        ensure(value.format === 1 && Number.isSafeInteger(value.revision) && value.revision > 0 && value.data && typeof value.data === 'object', 'Invalid journal.');
        const data = await validate(value.data);
        candidates.push({ slot, ...value, data });
      } catch { /* The other slot may contain the previous committed revision. */ }
    }
    ensure(!present || candidates.length, 'Addon storage is damaged. Restore a backup; existing files have been preserved.');
    const latest = candidates.sort((a, b) => b.revision - a.revision)[0];
    if (!latest) return null;
    this.revision = latest.revision; this.slot = latest.slot;
    return latest.data;
  }
  async save(data) {
    const envelope = { format: 1, revision: this.revision + 1, data: jsonCopy(data, LIMITS.archive - 1024) };
    const text = JSON.stringify(envelope);
    const slot = 1 - this.slot, path = `assault-addons-${slot}.json`;
    await this.io.write(path, text);
    ensure(await this.io.read(path) === text, 'Storage verification failed. Your previous revision is preserved.');
    this.slot = slot; this.revision = envelope.revision;
  }
}

````

## plugins/index.js

````js
import { compile } from './sandbox.js';
import { ensure, jsonCopy, key, LIMITS, message, settingsValues } from '../utils/validation.js';
import { validateTheme } from '../themes/index.js';

function inspect(source, filename) {
  const compiled = compile(source, filename), m = compiled.manifest;
  key(m.id);
  ensure(['plugin', 'theme'].includes(m.kind) && typeof m.name === 'string' && m.name.length > 0 && m.name.length <= 80 && typeof m.version === 'string' && /^\d+\.\d+\.\d+$/.test(m.version), 'Addon needs id, kind, name and a semantic version.');
  ensure(m.description === undefined || typeof m.description === 'string' && m.description.length <= 500, 'Description is too long.');
  m.settings ??= {};
  ensure(m.settings && typeof m.settings === 'object' && !Array.isArray(m.settings) && Object.keys(m.settings).length <= 20, 'Invalid settings schema.');
  for (const [name, field] of Object.entries(m.settings)) {
    key(name);
    ensure(field && typeof field.label === 'string' && field.label.length > 0 && field.label.length <= 80 && ['boolean', 'string', 'number'].includes(field.type), 'Invalid settings field.');
    if (field.type === 'number') ensure(Number.isFinite(field.min) && Number.isFinite(field.max) && field.min <= field.max, 'Number settings require min and max.');
  }
  settingsValues(m.settings);
  if (m.kind === 'theme') { ensure(!compiled.hasHooks, 'Themes cannot contain lifecycle code.'); validateTheme(m.colors); }
  return compiled;
}
export class AddonManager {
  constructor(store, host) {
    this.store = store; this.host = host; this.listeners = new Set(); this.tail = Promise.resolve();
    this.data = { version: 1, entries: [], selectedTheme: null }; this.ready = false; this.startupErrors = Object.create(null);
  }
  subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  snapshot = () => this.data;
  emit() { for (const fn of this.listeners) try { fn(); } catch {} }
  async start() {
    const saved = await this.store.load(data => this.validateArchive(data));
    if (saved) this.data = this.validateArchive(saved);
    this.ready = true;
    for (const entry of this.data.entries.filter(e => e.enabled && e.manifest.kind === 'plugin' && this.host.canActivate?.() !== false)) {
      try { await this.enable(entry.manifest.id, true); }
      catch (error) { this.startupErrors[entry.manifest.id] = `Could not start: ${message(error)}. Saved configuration is preserved.`; }
    }
    this.data = { ...this.data };
    try { await this.host.applyTheme(this.data.entries.find(e => e.manifest.id === this.data.selectedTheme) ?? null); }
    catch (error) { this.themeError = message(error); }
    this.emit();
  }
  validateArchive(data) {
    data = jsonCopy(data, LIMITS.archive - 1024);
    ensure(data.version === 1 && Array.isArray(data.entries) && data.entries.length <= LIMITS.addons, 'Invalid addon backup.');
    const ids = new Set();
    for (const e of data.entries) {
      ensure(e && typeof e === 'object', 'Invalid addon record.');
      const { manifest } = inspect(e.source, e.filename);
      ensure(!ids.has(manifest.id), 'Duplicate addon identifier.'); ids.add(manifest.id);
      e.manifest = manifest;
      e.settings = settingsValues(manifest.settings, e.settings);
      ensure(e.state && typeof e.state === 'object' && !Array.isArray(e.state), 'Invalid plugin state.');
      e.state = jsonCopy(e.state); e.enabled = e.enabled === true && manifest.kind === 'plugin';
      e.error = typeof e.error === 'string' ? e.error.slice(0, 240) : null;
      ensure(typeof e.installedAt === 'string' && e.installedAt.length <= 40 && typeof e.origin === 'string' && e.origin.length <= 2048, 'Invalid addon metadata.');
    }
    ensure(data.selectedTheme === null || data.entries.some(e => e.manifest.id === data.selectedTheme && e.manifest.kind === 'theme'), 'Selected theme is missing.');
    return data;
  }
  transaction(change, rollback) {
    const next = this.tail.then(async () => {
      ensure(this.ready, 'Addon storage is not ready.');
      const draft = jsonCopy(this.data, LIMITS.archive - 1024), effects = [];
      let result;
      try { result = await change(draft, effects); await this.store.save(draft); }
      catch (error) { if (rollback) await rollback(); throw error; }
      this.data = draft; this.emit();
      for (const effect of effects) try { await effect(); } catch (error) { try { this.host.report?.(message(error)); } catch {} }
      return result;
    });
    this.tail = next.catch(() => {});
    return next;
  }
  record(data, id) { const e = data.entries.find(e => e.manifest.id === id); ensure(e, 'Addon was removed.'); return e; }
  hook(entry, name, effects) {
    const compiled = inspect(entry.source, entry.filename);
    let notifications = 0;
    compiled.invoke(name, (method, args) => {
      const [name, value] = args;
      if (method === 'notify') {
        ensure(args.length === 1 && typeof name === 'string' && name.length > 0 && name.length <= 240 && ++notifications <= 3, 'Notification limit exceeded.');
        effects.push(() => this.host.notify(`${entry.manifest.name}: ${name}`)); return null;
      }
      key(name);
      if (method === 'getSetting') { ensure(args.length === 1 && Object.prototype.hasOwnProperty.call(entry.settings, name), 'Unknown setting.'); return entry.settings[name]; }
      if (method === 'getState') { ensure(args.length === 2, 'getState requires a default value.'); return jsonCopy(Object.prototype.hasOwnProperty.call(entry.state, name) ? entry.state[name] : value); }
      if (method === 'setState') {
        ensure(args.length === 2, 'setState requires a value.'); entry.state[name] = jsonCopy(value); jsonCopy(entry.state); return null;
      }
      throw new Error('API access denied.');
    });
  }
  install(source, filename, origin = 'local') {
    const { manifest } = inspect(source, filename);
    ensure(typeof origin === 'string' && origin.length <= 2048, 'Invalid source.');
    return this.transaction(data => {
      ensure(data.entries.length < LIMITS.addons, 'Remove an addon before installing more (32 maximum).');
      ensure(!data.entries.some(e => e.manifest.id === manifest.id), 'This addon is already installed. Remove it before installing a replacement. Export its state first.');
      data.entries.push({ source, filename, origin, installedAt: new Date().toISOString(), manifest, enabled: false, settings: settingsValues(manifest.settings), state: {}, error: null });
    });
  }
  async enable(id, enabled) {
    await this.transaction((data, effects) => {
      ensure(!enabled || this.host.canActivate?.() !== false, 'Disable safe mode before activating plugins.');
      const entry = this.record(data, id); ensure(entry.manifest.kind === 'plugin', 'Use theme selection for themes.');
      if (!enabled && this.host.canActivate?.() === false) { entry.enabled = false; entry.error = null; return; }
      const savedState = jsonCopy(entry.state);
      try { this.hook(entry, enabled ? 'onStart' : 'onStop', effects); entry.enabled = enabled; entry.error = null; }
      catch (error) { entry.state = savedState; effects.length = 0; entry.enabled = false; entry.error = message(error); }
    });
    if (this.startupErrors[id]) { delete this.startupErrors[id]; this.data = { ...this.data }; this.emit(); }
  }
  configure(id, values) {
    return this.transaction((data, effects) => {
      const entry = this.record(data, id); entry.settings = settingsValues(entry.manifest.settings, values);
      if (entry.enabled && !this.startupErrors[id] && this.host.canActivate?.() !== false) {
        const savedState = jsonCopy(entry.state);
        try { this.hook(entry, 'onSettingsChanged', effects); entry.error = null; }
        catch (error) { entry.state = savedState; effects.length = 0; entry.enabled = false; entry.error = message(error); }
      }
    });
  }
  selectTheme(id) {
    return this.transaction(async data => {
      const target = id === null ? null : this.record(data, id);
      ensure(target === null || target.manifest.kind === 'theme', 'Choose a theme.');
      // Apply first; if the durable commit fails, transaction's caller restores the
      // last committed theme below. No selection is reported before both succeed.
      await this.host.applyTheme(target);
      data.selectedTheme = id;
    }, async () => {
      try { await this.host.applyTheme(this.data.entries.find(e => e.manifest.id === this.data.selectedTheme) ?? null); } catch (rollback) { this.themeError = message(rollback); }
    }).then(() => { this.themeError = null; this.emit(); });
  }
  async remove(id) {
    await this.transaction((data, effects) => {
      const entry = this.record(data, id);
      ensure(data.selectedTheme !== id, 'Switch to another theme before removing this one.');
      if (entry.enabled && !this.startupErrors[id] && this.host.canActivate?.() !== false) { try { this.hook(entry, 'onStop', effects); } catch { effects.length = 0; } }
      data.entries = data.entries.filter(e => e !== entry);
    });
    delete this.startupErrors[id];
  }
  async export() { await this.tail; ensure(this.ready, 'Storage is not ready.'); return JSON.stringify(this.validateArchive(this.data)); }
  restore(text) {
    ensure(typeof text === 'string' && text.length * 2 <= LIMITS.archive, 'Backup exceeds the size limit.');
    const restored = this.validateArchive(JSON.parse(text));
    // Backups never auto-activate code or override a running theme.
    restored.entries.forEach(e => { e.enabled = false; }); restored.selectedTheme = null;
    return this.transaction(data => {
      ensure(data.entries.length === 0, 'Restore requires an empty library. Export and remove existing addons first.');
      Object.assign(data, restored);
    });
  }
}
export { inspect as validateAddon };

````

## core/screens.js

````js
import { message } from '../utils/validation.js';
import { readableColor, settingsDraft } from './ui.js';

export function createScreens(api, manager, bridge) {
  const { React: R, ReactNative: N } = api.metro.common;
  const h = R.createElement;

  function useMounted() {
    const mounted = R.useRef(false);
    R.useEffect(() => {
      mounted.current = true;
      return () => { mounted.current = false; };
    }, []);
    return mounted;
  }

  function Button({ label, action, disabled, background, foreground, isBusy }) {
    const [focused, setFocused] = R.useState(false);
    return h(N.Pressable, {
      accessibilityRole: 'button', accessibilityLabel: label,
      disabled, accessibilityState: { disabled },
      onPress: () => { if (!isBusy()) return action(); },
      onFocus: () => setFocused(true), onBlur: () => setFocused(false),
      style: ({ pressed }) => ({
        minHeight: 48, justifyContent: 'center', padding: 12, borderRadius: 10,
        backgroundColor: background, borderWidth: 2,
        borderColor: focused || pressed ? foreground : background,
        opacity: disabled ? 0.6 : 1,
      }),
    }, h(N.Text, { style: { color: foreground, fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 } }, label));
  }

  function Input({ label, value, set, busy, isBusy, colors: c, secure = false, error, numeric = false, maxLength = 2048 }) {
    const [focused, setFocused] = R.useState(false);
    return h(N.View, { style: { gap: 6 } },
      h(N.Text, { style: { color: c.muted, fontSize: 14 } }, label),
      h(N.TextInput, {
        accessibilityLabel: label, accessibilityHint: error || undefined,
        accessibilityState: { disabled: busy }, editable: !busy, value,
        onChangeText: next => { if (!isBusy()) set(next); },
        onFocus: () => setFocused(true), onBlur: () => setFocused(false),
        secureTextEntry: secure, autoCapitalize: 'none', autoCorrect: false,
        keyboardType: numeric ? 'numbers-and-punctuation' : 'default',
        maxLength: secure ? 4096 : maxLength,
        style: { minHeight: 48, borderWidth: focused || error ? 2 : 1, borderColor: readableColor(c.bg, error ? c.error : c.accent), borderRadius: 10, color: readableColor(c.bg, c.text), padding: 12, backgroundColor: c.bg },
      }),
      error && h(N.Text, { accessibilityRole: 'alert', accessibilityLiveRegion: 'polite', style: { color: c.error, fontSize: 14 } }, error));
  }

  function Settings({ entry, busy, isBusy, input, text, button, card, run, onBack, navigation, colors: c }) {
    const [values, setValues] = R.useState(entry.settings);
    const [saved, setSaved] = R.useState(entry.settings);
    const [attempted, setAttempted] = R.useState(false);
    const mounted = useMounted();
    const leaving = R.useRef(false);
    const dirty = Object.keys(entry.manifest.settings).some(name => String(values[name]) !== String(saved[name]));
    const checked = settingsDraft(entry.manifest.settings, values);
    function leave(action = onBack) {
      if (isBusy()) return;
      if (!dirty) { action(); return; }
      N.Alert.alert('Discard unsaved settings?', 'Your changes have not been saved.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard changes', style: 'destructive', onPress: () => { if (mounted.current && !isBusy()) action(); } },
      ]);
    }
    R.useEffect(() => {
      const back = N.BackHandler?.addEventListener('hardwareBackPress', () => { leave(); return true; });
      const unsubscribe = navigation?.addListener?.('beforeRemove', event => {
        if (leaving.current) { leaving.current = false; return; }
        if (!dirty && !isBusy()) return;
        event.preventDefault();
        leave(() => { leaving.current = true; navigation.dispatch(event.data.action); });
      });
      return () => { back?.remove(); unsubscribe?.(); };
    }, [dirty, busy, navigation]);
    async function save() {
      if (isBusy()) return;
      setAttempted(true);
      if (Object.keys(checked.errors).length) return;
      const completed = await run(() => manager.configure(entry.manifest.id, checked.values), {
        pending: 'Saving plugin settings…', success: 'Settings saved.', entryId: entry.manifest.id,
      });
      if (completed && mounted.current) {
        setValues(checked.values); setSaved(checked.values); setAttempted(false);
      }
    }
    return card(
      button('Back to plugins', () => leave()),
      text(entry.manifest.name, { fontSize: 24, fontWeight: '800' }),
      dirty && text('Unsaved changes', { color: c.muted }),
      ...Object.entries(entry.manifest.settings).map(([name, field]) => h(N.View, { key: name },
        field.type === 'boolean'
          ? h(N.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 } },
            text(field.label, { flex: 1 }), h(N.Switch, {
              accessibilityLabel: field.label, accessibilityState: { disabled: busy, checked: values[name] },
              value: values[name], disabled: busy, trackColor: { false: '#80848e', true: c.accent },
              onValueChange: value => { if (!isBusy()) setValues(previous => ({ ...previous, [name]: value })); },
            }))
          : input(field.label, String(values[name]), value => setValues(previous => ({ ...previous, [name]: value })), {
            numeric: field.type === 'number', error: attempted ? checked.errors[name] : undefined,
            // Allow one extra character so pasted over-limit strings receive an explicit error.
            maxLength: field.type === 'string' ? 513 : 2048,
          }))),
      Object.keys(entry.manifest.settings).length === 0 && text('This plugin has no configurable settings.'),
      button('Save settings', save));
  }

  function Page({ kind, navigation }) {
    const data = R.useSyncExternalStore(manager.subscribe, manager.snapshot, manager.snapshot);
    const [pending, setPending] = R.useState('');
    const [error, setError] = R.useState(''), [notice, setNotice] = R.useState('');
    const [editing, setEditing] = R.useState(null), [remote, setRemote] = R.useState(false), [backup, setBackup] = R.useState(false);
    const [url, setUrl] = R.useState(''), [checksum, setChecksum] = R.useState(''), [endpoint, setEndpoint] = R.useState(''), [token, setToken] = R.useState('');
    const locked = R.useRef(false), mounted = useMounted();
    const isBusy = () => locked.current;
    const busy = Boolean(pending);
    const current = data.entries.find(e => e.manifest.id === data.selectedTheme)?.manifest.colors ?? {};
    const c = {
      bg: current.BACKGROUND_PRIMARY ?? '#1e1f22', card: current.BACKGROUND_SECONDARY ?? '#2b2d31',
      text: current.TEXT_NORMAL ?? '#f2f3f5', muted: current.TEXT_MUTED ?? '#b5bac1', accent: current.BRAND_500 ?? '#5865f2',
    };
    c.text = readableColor(c.card, c.text); c.muted = readableColor(c.card, c.muted);
    c.error = readableColor(c.card, '#ffb0b8');
    const text = (value, style = {}) => h(N.Text, { style: { color: c.text, fontSize: 16, flexShrink: 1, ...style } }, value);
    const card = (...children) => h(N.View, { style: { backgroundColor: c.card, borderRadius: 16, padding: 18, marginBottom: 14, gap: 12 } }, ...children);
    const button = (label, action, danger = false) => {
      const background = danger ? '#783044' : c.accent;
      return h(Button, { label, action, disabled: busy, background, foreground: readableColor(background), isBusy });
    };
    const input = (label, value, set, options = {}) => h(Input, { label, value, set, busy, isBusy, colors: c, ...options });
    async function run(action, { pending: progress, success = '', entryId } = {}) {
      if (locked.current || !mounted.current) return false;
      locked.current = true;
      setPending(progress || 'Working…'); setError(''); setNotice('');
      try {
        await action();
        if (mounted.current) {
          const failure = entryId && manager.snapshot().entries.find(e => e.manifest.id === entryId)?.error || (entryId && manager.startupErrors?.[entryId]);
          if (failure) setError(`${success ? `${success} ` : ''}Plugin is disabled: ${failure}`);
          else setNotice(success);
        }
        return true;
      } catch (e) {
        if (mounted.current) setError(message(e));
        return false;
      } finally {
        locked.current = false;
        if (mounted.current) setPending('');
      }
    }
    async function install(result, origin) {
      await manager.install(result.data, result.filename, origin);
    }
    function confirmRemove(entry) {
      N.Alert.alert(`Remove ${entry.manifest.name}?`, 'Its saved settings and state will be deleted. Export a backup first if you need them.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => run(() => manager.remove(entry.manifest.id), { pending: 'Removing addon…', success: 'Addon removed.' }) },
      ]);
    }
    const selected = data.entries.find(e => e.manifest.id === editing);
    const controls = selected
      ? h(Settings, { key: selected.manifest.id, entry: selected, busy, isBusy, input, text, button, card, run, colors: c, navigation, onBack: () => setEditing(null) })
      : h(R.Fragment, null,
        card(text(kind === 'plugin' ? 'Your plugins' : 'Your themes', { fontSize: 24, fontWeight: '800' }),
          text(kind === 'plugin' ? 'Add trusted extensions. Each plugin has its own settings and private saved state.' : 'Personalize Discord with a saved palette. Select a theme to apply it immediately.', { color: c.muted, lineHeight: 22 }),
          button('Import JavaScript file', () => run(async () => install(await bridge.request('import'), 'local'), { pending: 'Importing addon… Choose a file to continue.', success: 'Addon installed. Activate it from its library.' })),
          button(remote ? 'Close remote installer' : 'Install from HTTPS URL', () => setRemote(!remote)),
          remote && h(N.View, { style: { gap: 12 } }, input('Direct HTTPS URL', url, setUrl), input('Publisher SHA-256 checksum', checksum, setChecksum),
            button('Download and validate', () => run(async () => install(await bridge.request('download', { url, sha256: checksum }), url), { pending: 'Downloading and validating addon…', success: 'Download verified and addon installed.' })))),
        kind === 'theme' && button(data.selectedTheme ? 'Use Discord default theme' : 'Discord default theme is active', () => run(() => manager.selectTheme(null), { pending: 'Restoring Discord theme…', success: 'Discord default theme applied.' })),
        ...data.entries.filter(e => e.manifest.kind === kind).map(entry => h(N.View, { key: entry.manifest.id }, card(
          text(entry.manifest.name, { fontSize: 20, fontWeight: '700' }), text(`Version ${entry.manifest.version}`, { color: c.muted, fontSize: 13 }),
          entry.manifest.description && text(entry.manifest.description, { color: c.muted, lineHeight: 22 }),
          text((entry.error || manager.startupErrors?.[entry.manifest.id]) ? 'Needs attention' : kind === 'theme' ? data.selectedTheme === entry.manifest.id ? 'Selected' : 'Available' : entry.enabled ? manager.host.canActivate?.() === false ? 'Paused in safe mode' : 'Active' : 'Inactive', { color: (entry.error || manager.startupErrors?.[entry.manifest.id]) ? c.error : c.muted, fontWeight: '700' }),
          (entry.error || manager.startupErrors?.[entry.manifest.id]) && text(entry.error || manager.startupErrors[entry.manifest.id], { color: c.error }),
          manager.startupErrors?.[entry.manifest.id] && button('Retry plugin activation', () => run(() => manager.enable(entry.manifest.id, true), { pending: 'Retrying plugin activation…', entryId: entry.manifest.id })),
          kind === 'plugin'
            ? h(N.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 } }, text('Enable plugin', { flex: 1 }), h(N.Switch, {
              accessibilityLabel: `Enable ${entry.manifest.name}`, accessibilityState: { checked: entry.enabled, disabled: busy },
              value: entry.enabled, disabled: busy, trackColor: { false: '#80848e', true: c.accent },
              onValueChange: value => run(() => manager.enable(entry.manifest.id, value), { pending: value ? 'Activating plugin…' : 'Deactivating plugin…', entryId: entry.manifest.id }),
            }))
            : h(N.View, { style: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, accessibilityLabel: 'Theme color preview' }, ...Object.entries(entry.manifest.colors).map(([name, color]) => h(N.View, { key: name, accessible: true, accessibilityLabel: `${name} ${color}`, style: { width: 32, height: 32, borderRadius: 16, backgroundColor: color, borderWidth: 1, borderColor: c.muted } }))),
          kind === 'theme' && button('Apply theme', () => run(() => manager.selectTheme(entry.manifest.id), { pending: 'Applying theme…', success: 'Theme applied.' })),
          kind === 'plugin' && button('Plugin settings', () => { setError(''); setNotice(''); setEditing(entry.manifest.id); }),
          button('Remove', () => confirmRemove(entry), true)))),
        data.entries.every(e => e.manifest.kind !== kind) && card(text('Your library is empty', { fontWeight: '700' }), text('Import a .js or .txt addon, or install one from its HTTPS address.', { color: c.muted })),
        card(button(backup ? 'Close backup controls' : 'Backup and restore', () => setBackup(!backup)), backup && h(N.View, { style: { gap: 12 } },
          text('Backups include every installed plugin and theme, source, metadata, settings and saved state. Restored addons start disabled.', { color: c.muted, lineHeight: 22 }),
          button('Export complete backup', () => run(async () => bridge.request('export', { data: await manager.export() }), { pending: 'Saving and verifying backup…', success: 'Backup saved and verified.' })),
          button('Restore local backup', () => run(async () => manager.restore((await bridge.request('restore')).data), { pending: 'Reading and restoring backup…', success: 'Backup restored.' })),
          input('Optional cloud backup HTTPS endpoint', endpoint, setEndpoint), input('Optional bearer token (not saved)', token, setToken, { secure: true }),
          button('Upload complete backup', () => run(async () => {
            await bridge.request('uploadBackup', { url: endpoint, token, data: await manager.export() });
            if (mounted.current) setToken('');
          }, { pending: 'Uploading backup…', success: 'Server accepted the backup.' })),
          button('Restore cloud backup', () => run(async () => {
            const result = await bridge.request('downloadBackup', { url: endpoint, token });
            await manager.restore(result.data);
            if (mounted.current) setToken('');
          }, { pending: 'Downloading and restoring backup…', success: 'Cloud backup restored.' })))));
    return h(N.KeyboardAvoidingView, { style: { flex: 1, backgroundColor: c.bg }, behavior: N.Platform?.OS === 'ios' ? 'padding' : 'height' },
      h(N.ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: 16, paddingBottom: 48, gap: 12 }, keyboardShouldPersistTaps: 'handled', keyboardDismissMode: 'on-drag' },
        busy && h(N.View, { accessibilityLiveRegion: 'polite', accessibilityState: { busy: true }, style: { flexDirection: 'row', alignItems: 'center', gap: 12 } },
          h(N.ActivityIndicator, { color: readableColor(c.bg, c.accent) }), text(pending, { flex: 1, color: readableColor(c.bg, c.text) })),
        (error || manager.themeError) && card(h(N.Text, { accessibilityRole: 'alert', accessibilityLiveRegion: 'assertive', style: { color: c.error, fontSize: 16 } }, error || manager.themeError)),
        notice && h(N.Text, { accessibilityLiveRegion: 'polite', style: { color: readableColor(c.bg, c.text), fontSize: 16 } }, notice), controls));
  }
  return { plugin: props => h(Page, { ...props, kind: 'plugin' }), theme: props => h(Page, { ...props, kind: 'theme' }) };
}

````

## tests/addons.test.mjs

````mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AddonManager, validateAddon } from '../plugins/index.js';
import { Journal } from '../utils/store.js';
import { compile } from '../plugins/sandbox.js';
import { nativeTheme } from '../themes/index.js';

const plugin = (id = 'counter', extra = '') => `export default { id: '${id}', kind: 'plugin', name: 'Counter', version: '1.0.0', settings: { greeting: { type: 'string', label: 'Greeting', default: 'Hello' }, visible: { type: 'boolean', label: 'Visible', default: true } }, onStart(api) { const count = api.getState('starts', 0); api.setState('starts', count + 1); if (api.getSetting('visible')) api.notify(api.getSetting('greeting')); }, ${extra} };`;
const theme = (id = 'night') => `export default { id: '${id}', kind: 'theme', name: 'Night', version: '1.0.0', colors: { BACKGROUND_PRIMARY: '#111111', TEXT_NORMAL: '#eeeeee' } };`;
function fixture() {
  const files = new Map(), notices = [], applied = [];
  const io = { async read(name) { return files.get(name) ?? null; }, async write(name, value) { files.set(name, value); } };
  const host = { notify: value => notices.push(value), applyTheme: async value => applied.push(value) };
  return { files, notices, applied, io, host, manager: new AddonManager(new Journal(io), host) };
}
test('txt JavaScript and multiple plugins survive restart with complete inactive state exports', async () => {
  const f = fixture(), m = f.manager; await m.start();
  await Promise.all([m.install(plugin(), 'example.txt'), m.install(plugin('second'), 'second.js')]);
  await m.configure('counter', { greeting: 'Saved greeting', visible: true });
  await m.enable('counter', true); await m.enable('second', true); await m.enable('second', false);
  const before = JSON.parse(await m.export());
  assert.equal(before.entries[1].state.starts, 1); assert.equal(before.entries[1].enabled, false);
  assert.equal(before.entries[0].settings.greeting, 'Saved greeting'); assert.ok(before.entries.every(e => e.source && e.filename && e.origin && e.installedAt));
  const restarted = new AddonManager(new Journal(f.io), f.host); await restarted.start();
  const after = JSON.parse(await restarted.export());
  assert.equal(after.entries[0].state.starts, 2); assert.equal(after.entries[1].state.starts, 1);
  const restore = fixture(); await restore.manager.start(); await restore.manager.restore(await restarted.export());
  assert.ok(restore.manager.data.entries.every(e => !e.enabled));
  assert.equal(restore.manager.data.entries[0].state.starts, 2);
  assert.equal(restore.notices.length, 0);
});
test('sandbox rejects escapes, loops, imports, functions, regex and malformed input before activation', () => {
  const attacks = [
    `require('fs')`, `globalThis.fetch('https://example.com')`, `api.constructor.constructor('return this')()`,
    `api['notify']('x')`, `api.notify.call(null, 'x')`, `while(true) {}`, `for(;;) {}`, `throw 'bad'`,
    `const x = api;`, `const x = () => 1;`, `api.setState('__proto__', {});`, `const x = /a+/;`,
    `api.notify(typeof globalThis)`, `api.setState('x', new Date())`, `api.setState('x', { get x() { return 1; } })`
  ];
  for (const attack of attacks) {
    const source = `export default { id: 'test', kind: 'plugin', name: 'Test', version: '1.0.0', onStart(api) { ${attack} } };`;
    if (attack.includes("'__proto__'")) {
      const c = compile(source); assert.throws(() => c.invoke('onStart', (name, args) => { if (args[0] === '__proto__') throw Error('denied'); }));
    } else assert.throws(() => validateAddon(source, 'attack.txt'), attack);
  }
  for (const source of ['', 'export default {', `const fs = require('fs');`, `export default { constructor: 'x' };`, `export default { id:'a', id:'b' };`]) assert.throws(() => validateAddon(source, 'input.txt'));
  assert.throws(() => validateAddon(plugin(), 'plugin.json'));
});
test('faulting hooks roll back state and notifications, disable only the failed plugin', async () => {
  const f = fixture(), m = f.manager; await m.start();
  await m.install(plugin('good'), 'good.js'); await m.enable('good', true);
  await m.install(plugin('bad', `onSettingsChanged(api) { api.setState('partial', true); api.notify('discard'); api.setState('nan', 0 / 0); }`), 'bad.js');
  await m.enable('bad', true); const count = f.notices.length;
  await m.configure('bad', { greeting: 'x', visible: true });
  const bad = m.data.entries[1]; assert.equal(bad.enabled, false); assert.match(bad.error, /finite/); assert.equal(bad.state.partial, undefined);
  assert.equal(f.notices.length, count); assert.equal(m.data.entries[0].enabled, true);
});
test('failed durable writes do not activate, notify, or lose committed state', async () => {
  const f = fixture(); await f.manager.start(); await f.manager.install(plugin(), 'p.js');
  const before = await f.manager.export();
  f.io.write = async () => { throw Error('disk full'); };
  await assert.rejects(f.manager.enable('counter', true), /disk full/);
  assert.equal(await f.manager.export(), before); assert.equal(f.notices.length, 0);
});
test('journal recovers previous slot after truncated write and rejects corrupt-only storage', async () => {
  const f = fixture(), journal = new Journal(f.io);
  await journal.save({ value: 1 }); await journal.save({ value: 2 });
  f.files.set('assault-addons-1.json', '{"format":');
  assert.deepEqual(await new Journal(f.io).load(), { value: 1 });
  f.files.set('assault-addons-0.json', '');
  await assert.rejects(new Journal(f.io).load(), /damaged/);
});
test('journal catches silently truncated writes before acknowledgement', async () => {
  const f = fixture(); f.io.write = async (name, text) => f.files.set(name, text.slice(0, 10));
  await assert.rejects(new Journal(f.io).save({ data: 'complete' }), /verification failed/);
});
test('theme switching restores selection and rolls back on write failure', async () => {
  const f = fixture(), m = f.manager; await m.start(); await m.install(theme(), 't.txt'); await m.install(theme('other'), 'o.js');
  await m.selectTheme('night'); assert.equal(m.data.selectedTheme, 'night');
  assert.deepEqual(nativeTheme(m.data.entries[0]).semanticColors.TEXT_NORMAL, ['#eeeeee', '#eeeeee', '#eeeeee']);
  await assert.rejects(m.remove('night'), /Switch/);
  const restarted = new AddonManager(new Journal(f.io), f.host); await restarted.start(); assert.equal(f.applied.at(-1).manifest.id, 'night');
  f.io.write = async () => { throw Error('full'); };
  await assert.rejects(m.selectTheme('other'), /full/); assert.equal(m.data.selectedTheme, 'night'); assert.equal(f.applied.at(-1).manifest.id, 'night');
  assert.throws(() => validateAddon(theme().replace('#111111', 'url(secret)'), 't.js'));
  assert.throws(() => validateAddon(theme().replace('colors:', 'onStart(api) {}, colors:'), 't.js'));
});
test('invalid backups and duplicate installation preserve state', async () => {
  const f = fixture(); await f.manager.start(); await f.manager.install(plugin(), 'p.js');
  await assert.rejects(f.manager.install(plugin(), 'p.js'), /already/);
  const backup = await f.manager.export();
  await assert.rejects(f.manager.restore(backup), /empty library/);
  assert.equal(await f.manager.export(), backup);
  const data = JSON.parse(backup); data.entries[0].source = 'process.exit()';
  assert.throws(() => f.manager.restore(JSON.stringify(data)), /Export one/);
});
test('production patch disables both external evaluators and routes native settings', async () => {
  const patch = await readFile('scripts/patch_runtime.py', 'utf8');
  assert.match(patch, /Legacy plugins require porting/); assert.match(patch, /External plugins must use/);
  assert.match(patch, /assaultAddonPage\("plugin"\)/); assert.match(patch, /assaultAddonPage\("theme"\)/);
});
test('safe mode preserves activation preferences but never runs lifecycle hooks', async () => {
  const f = fixture(); await f.manager.start(); await f.manager.install(plugin('safe', `onStop(api) { api.notify('stopped'); }`), 'safe.js'); await f.manager.enable('safe', true);
  f.host.canActivate = () => false;
  const manager = new AddonManager(new Journal(f.io), f.host); const before = f.notices.length;
  await manager.start(); assert.equal(manager.data.entries[0].state.starts, 1);
  await assert.rejects(manager.enable('safe', true), /safe mode/);
  await manager.enable('safe', false); assert.equal(f.notices.length, before);
});
test('source limit measures UTF8 bytes and rejects oversized non-ASCII input', () => {
  assert.equal(validateAddon(plugin() + '/*' + 'x'.repeat(40000) + '*/', 'large.txt').manifest.id, 'counter');
  assert.throws(() => validateAddon(plugin() + '/*' + '€'.repeat(22000) + '*/', 'large.txt'), /too large/);
});
test('aliased data cannot expand exponentially during serialization', async () => {
  const f = fixture(); await f.manager.start();
  let body = `const v0 = ['12345678'];`;
  for (let i = 1; i < 23; i++) body += `const v${i} = [v${i - 1}, v${i - 1}];`;
  body += `api.setState('bomb', v22);`;
  await f.manager.install(`export default { id:'bomb', kind:'plugin', name:'Bomb', version:'1.0.0', onStart(api) { ${body} } };`, 'bomb.js');
  await f.manager.enable('bomb', true);
  assert.equal(f.manager.data.entries[0].enabled, false);
  assert.match(f.manager.data.entries[0].error, /limit|deeply|values/);
  assert.deepEqual(f.manager.data.entries[0].state, {});
});
test('addon journals ignore newer envelopes whose payload fails schema validation', async () => {
  const f = fixture(); await f.manager.start(); await f.manager.install(plugin(), 'counter.js');
  await f.manager.configure('counter', { greeting: 'newer', visible: true });
  const newest = `assault-addons-${f.manager.store.slot}.json`;
  const broken = JSON.parse(f.files.get(newest)); broken.data.entries[0].source = 'not an addon'; f.files.set(newest, JSON.stringify(broken));
  const manager = new AddonManager(new Journal(f.io), f.host); await manager.start();
  assert.equal(manager.data.entries[0].settings.greeting, 'Hello');
  assert.equal(JSON.parse(f.files.get(newest)).data.entries[0].source, 'not an addon', 'recovery does not delete the invalid slot');
});
test('one activation write failure preserves the library and does not prevent other plugins starting', async () => {
  const f = fixture(); await f.manager.start();
  await f.manager.install(plugin(), 'counter.js'); await f.manager.install(plugin('other'), 'other.js');
  await f.manager.enable('counter', true); await f.manager.enable('other', true);
  const write = f.io.write; let attempts = 0;
  f.io.write = async (...args) => { if (++attempts === 1) throw Error('Disk unavailable'); return write(...args); };
  const manager = new AddonManager(new Journal(f.io), f.host); await manager.start();
  assert(manager.ready); assert.equal(manager.data.entries.length, 2);
  assert.match(manager.startupErrors.counter, /Disk unavailable/);
  assert.equal(manager.data.entries[0].state.starts, 1);
  assert.equal(manager.data.entries[1].state.starts, 2);
  assert.equal(JSON.parse(await manager.export()).entries[0].enabled, true, 'saved activation preference remains intact');
  await manager.enable('counter', true);
  assert.equal(manager.startupErrors.counter, undefined); assert.equal(manager.data.entries[0].state.starts, 2);
});

````

## android/loader/src/main/java/app/assault/loader/AddonTransfer.java

````java
package app.assault.loader;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.net.ssl.HttpsURLConnection;

/** Bounded, redirect-free transport; no account credentials are inherited. */
final class AddonTransfer {
    static byte[] transfer(String operation, String address, String token, String expected, byte[] upload) throws Exception {
        return transfer(operation, address, token, expected, upload, () -> {});
    }
    static byte[] transfer(String operation, String address, String token, String expected, byte[] upload, Runnable timedOut) throws Exception {
        return transfer(operation, address, token, expected, upload, timedOut, 60000);
    }
    static byte[] transfer(String operation, String address, String token, String expected, byte[] upload, Runnable timedOut, long transferMillis) throws Exception {
        if (!operation.equals("download") && !operation.equals("uploadBackup") && !operation.equals("downloadBackup")) throw new IOException("Unknown addon operation.");
        URL url = new URL(address);
        if (!url.getProtocol().equals("https") || url.getUserInfo() != null || url.getRef() != null) throw new IOException("Use an HTTPS URL without credentials or fragment.");
        expected = expected.toLowerCase(java.util.Locale.ROOT);
        if (operation.equals("download") && !expected.matches("[0-9a-f]{64}")) throw new IOException("Enter the publisher's SHA-256 checksum.");
        if (token.length() > 4096 || token.contains("\r") || token.contains("\n")) throw new IOException("Invalid backup credential.");
        int limit = operation.equals("download") ? 64 * 1024 : 4 * 1024 * 1024;
        if (operation.equals("uploadBackup") && (upload.length == 0 || upload.length > limit)) throw new IOException("Invalid backup size.");
        HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
        connection.setInstanceFollowRedirects(false); connection.setConnectTimeout(15000); connection.setReadTimeout(20000);
        connection.setRequestProperty("Accept", operation.equals("download") ? "application/javascript,text/plain" : "application/json");
        if (!token.isEmpty()) connection.setRequestProperty("Authorization", "Bearer " + token);
        try (TransferDeadline deadline = new TransferDeadline(connection, timedOut, transferMillis)) {
            if (operation.equals("uploadBackup")) {
                connection.setRequestMethod("PUT"); connection.setDoOutput(true); connection.setFixedLengthStreamingMode(upload.length);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try (OutputStream out = connection.getOutputStream()) { out.write(upload); }
            }
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) throw new IOException("Server returned HTTP " + status + ". Redirects are not followed.");
            if (operation.equals("uploadBackup")) return new byte[0];
            long length = connection.getContentLengthLong();
            if (length > limit) throw new IOException("Download exceeds the size limit.");
            byte[] bytes;
            try (InputStream in = connection.getInputStream()) { bytes = read(in, limit, System.nanoTime() + 30_000_000_000L); }
            if (length >= 0 && bytes.length != length) throw new IOException("Incomplete download.");
            if (operation.equals("download")) {
                StringBuilder digest = new StringBuilder();
                for (byte value : MessageDigest.getInstance("SHA-256").digest(bytes)) digest.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
                if (!digest.toString().equals(expected)) throw new IOException("Checksum mismatch. Nothing was installed.");
            }
            return bytes;
        } finally { connection.disconnect(); }
    }
    private static final class TransferDeadline implements AutoCloseable {
        private final java.util.Timer timer = new java.util.Timer("Assault transfer deadline", true);
        private boolean settled, expired;
        TransferDeadline(HttpsURLConnection connection, Runnable timedOut, long millis) {
            timer.schedule(new java.util.TimerTask() {
                @Override public void run() {
                    synchronized (TransferDeadline.this) {
                        if (settled) return;
                        settled = true; expired = true;
                    }
                    try { timedOut.run(); } finally { connection.disconnect(); }
                }
            }, millis);
        }
        @Override public void close() throws IOException {
            boolean timeout;
            synchronized (this) { settled = true; timeout = expired; }
            timer.cancel();
            if (timeout) throw new java.net.SocketTimeoutException("Transfer timed out. Check your connection and retry.");
        }
    }
    static String decode(byte[] bytes) throws IOException {
        return StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(bytes)).toString();
    }
    static byte[] read(InputStream in, int limit) throws IOException {
        return read(in, limit, Long.MAX_VALUE);
    }
    static byte[] read(InputStream in, int limit, long deadline) throws IOException {
        if (in == null) throw new IOException("File could not be opened.");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while ((count = in.read(buffer)) != -1) {
            if (System.nanoTime() > deadline) throw new IOException("Download timed out.");
            if (out.size() + count > limit) throw new IOException("File exceeds the size limit.");
            out.write(buffer, 0, count);
        }
        if (out.size() == 0) throw new IOException("File is empty.");
        return out.toByteArray();
    }
}

````

## tests/addon-transport.test.mjs

````mjs
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
test('native HTTPS transport rejects redirects, wrong checksums, malformed UTF8, missing/oversized/truncated bodies', () => {
  const dir = mkdtempSync(join(tmpdir(), 'assault-addon-transport-'));
  try {
    const source = join(dir, 'AddonTransferTest.java');
    writeFileSync(source, `package app.assault.loader;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.cert.Certificate;
import javax.net.ssl.HttpsURLConnection;
public class AddonTransferTest {
 static int status=200; static long length=3; static byte[] payload="abc".getBytes(StandardCharsets.UTF_8);
 static volatile boolean disconnected; static boolean stalled, stalledResponse, stalledBody; static Connection current;
 static class Connection extends HttpsURLConnection {
  ByteArrayOutputStream uploaded=new ByteArrayOutputStream();
  Connection(URL url){super(url);current=this;disconnected=false;}
  public int getResponseCode()throws IOException{if(stalledResponse)awaitDisconnect();if(getInstanceFollowRedirects())throw new AssertionError("redirect enabled");return status;}
  public long getContentLengthLong(){return length;}
  public InputStream getInputStream(){return stalledBody?new InputStream(){public int read()throws IOException{awaitDisconnect();return -1;}}:new ByteArrayInputStream(payload);}
  void awaitDisconnect()throws IOException{while(!disconnected){try{Thread.sleep(2);}catch(InterruptedException e){Thread.currentThread().interrupt();throw new IOException(e);}}throw new IOException("socket closed");}
  public OutputStream getOutputStream(){return stalled?new OutputStream(){public void write(int value)throws IOException{while(!disconnected){try{Thread.sleep(2);}catch(InterruptedException e){Thread.currentThread().interrupt();throw new IOException(e);}}throw new IOException("socket closed");}}:uploaded;}
  public void disconnect(){disconnected=true;} public boolean usingProxy(){return false;} public void connect(){}
  public String getCipherSuite(){return "test";} public Certificate[] getLocalCertificates(){return null;} public Certificate[] getServerCertificates(){return null;}
 }
 interface Operation { void run() throws Exception; }
 static void rejected(Operation op)throws Exception {try{op.run();throw new AssertionError("accepted invalid input");}catch(IOException expected){}}
 static byte[] fetch(String url,String hash)throws Exception{return AddonTransfer.transfer("download",url,"",hash,new byte[0]);}
 public static void main(String[] args)throws Exception {
  URL.setURLStreamHandlerFactory(p->p.equals("https")?new URLStreamHandler(){protected URLConnection openConnection(URL u){return new Connection(u);}}:null);
  String good="https://addons.example/plugin.txt", hash="ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
  if(!AddonTransfer.decode(fetch(good,hash)).equals("abc")||!disconnected)throw new AssertionError();
  for(String url:new String[]{"http://example.com/a", "file:///tmp/a", "https://user@example.com/a", "https://example.com/a#part"})rejected(()->fetch(url,hash));
  rejected(()->fetch(good,""));rejected(()->fetch(good,"0".repeat(64)));
  for(int code:new int[]{301,302,401,403,429,500}){status=code;rejected(()->fetch(good,hash));if(!disconnected)throw new AssertionError();}
  status=200;length=4;rejected(()->fetch(good,hash));
  length=100000;rejected(()->fetch(good,hash));
  length=-1;payload=new byte[65537];rejected(()->fetch(good,hash));
  payload=new byte[0];rejected(()->fetch(good,hash));
  rejected(()->AddonTransfer.decode(new byte[]{(byte)0xc3,0x28}));
  rejected(()->AddonTransfer.read(null,100));
  byte[] backup="{\\"version\\":1}".getBytes(StandardCharsets.UTF_8);
  AddonTransfer.transfer("uploadBackup",good,"synthetic","",backup);
  if(!java.util.Arrays.equals(current.uploaded.toByteArray(),backup)||!current.getRequestMethod().equals("PUT")||!"Bearer synthetic".equals(current.getRequestProperty("Authorization")))throw new AssertionError();
  rejected(()->AddonTransfer.transfer("uploadBackup",good,"bad\\r\\nheader","",backup));
  rejected(()->AddonTransfer.transfer("uploadBackup",good,"","",new byte[0]));
  java.util.concurrent.atomic.AtomicInteger timeouts=new java.util.concurrent.atomic.AtomicInteger();
  stalled=true;
  rejected(()->AddonTransfer.transfer("uploadBackup",good,"","",backup,()->timeouts.incrementAndGet(),30));
  if(timeouts.get()!=1||!disconnected)throw new AssertionError("stalled upload was not cancelled");
  stalled=false;stalledResponse=true;
  rejected(()->AddonTransfer.transfer("uploadBackup",good,"","",backup,()->timeouts.incrementAndGet(),30));
  if(timeouts.get()!=2)throw new AssertionError("response deadline missing");
  stalledResponse=false;stalledBody=true;length=-1;
  rejected(()->AddonTransfer.transfer("downloadBackup",good,"","",new byte[0],()->timeouts.incrementAndGet(),30));
  if(timeouts.get()!=3)throw new AssertionError("response body deadline missing");
  stalledBody=false;
  AddonTransfer.transfer("uploadBackup",good,"","",backup,()->timeouts.incrementAndGet(),30);
  Thread.sleep(60);
  if(timeouts.get()!=3)throw new AssertionError("successful upload deadline was not cancelled");
 }
}`);
    execFileSync('javac', ['-d', dir, resolve('android/loader/src/main/java/app/assault/loader/AddonTransfer.java'), source]);
    execFileSync('java', ['-cp', dir, 'app.assault.loader.AddonTransferTest']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

````

## android/loader/src/main/java/app/assault/loader/AssaultLoader.java

````java
package app.assault.loader;

import android.app.*;
import android.content.*;
import android.content.res.*;
import android.graphics.Color;
import android.view.*;
import android.widget.*;
import de.robv.android.xposed.*;
import de.robv.android.xposed.callbacks.XC_LoadPackage;
import java.lang.reflect.Method;
import java.io.*;
import java.util.*;
import org.json.JSONObject;
import app.assault.shared.AccountSettings;

public final class AssaultLoader implements IXposedHookLoadPackage, IXposedHookZygoteInit {
    private static String modulePath;
    private final Set<Object> initialized = Collections.newSetFromMap(new WeakHashMap<>());
    private final Set<Activity> activities = Collections.newSetFromMap(new WeakHashMap<>());
    private final Set<Class<?>> callbackClasses = new HashSet<>();
    private Context context;
    private String failure;
    private String hookName = "No compatible script hook";
    @Override public void initZygote(StartupParam param) { modulePath=param.modulePath; }
    @Override public void handleLoadPackage(XC_LoadPackage.LoadPackageParam param) {
        if (!"com.discord".equals(param.packageName) || !param.packageName.equals(param.processName)) return;
        XposedHelpers.findAndHookMethod(Application.class,"attach",Context.class,new XC_MethodHook() {
            @Override protected void afterHookedMethod(MethodHookParam hook) { context=(Context)hook.args[0]; HtmlExport.clearOldCache(context); AddonDocuments.cleanup(context); Appearance.initialize(context,param.classLoader); }
        });
        AddonDocuments.install(param.classLoader);
        boolean hooked=false;
        for(String name: new String[]{"com.facebook.react.bridge.CatalystInstanceImpl", "com.facebook.react.runtime.ReactInstance$loadJSBundle$1", "com.facebook.react.runtime.ReactInstance$1"}) {
            try {
                Class<?> cls=param.classLoader.loadClass(name);
                Method assets=cls.getDeclaredMethod("loadScriptFromAssets",AssetManager.class,String.class,boolean.class);
                Method file=cls.getDeclaredMethod("loadScriptFromFile",String.class,String.class,boolean.class);
                XC_MethodHook hook=new XC_MethodHook() {
                    @Override protected void beforeHookedMethod(MethodHookParam call) {
                        if(context==null || initialized.contains(call.thisObject))return;
                        initialized.add(call.thisObject);
                        try {
                            var prefs=context.getSharedPreferences("assault",0);
                            if(prefs.getBoolean("safeMode",false) || !prefs.getBoolean("addonRuntime",true))return;
                            JSONObject config=AccountSettings.read(prefs);
                            for(String key:new String[]{"antiDelete","antiEdit","noTrack","captureEnabled","captureAttachments","redactAuthors","blockCrashReports","silentTyping","maskTokens","ghostPingAlert"})
                                config.put(key,prefs.getBoolean(key,key.equals("noTrack")||key.equals("captureEnabled")||key.equals("captureAttachments")||key.equals("blockCrashReports")||key.equals("maskTokens")||key.equals("ghostPingAlert")));
                            config.put("maxMessages",prefs.getInt("maxMessages",500)).put("maxEdits",prefs.getInt("maxEdits",20))
                                .put("memoryKiB",prefs.getInt("memoryKiB",4096)).put("retentionMinutes",prefs.getInt("retentionMinutes",0));
                            File globals=new File(context.getCacheDir(),"assault-config.js");
                            try(Writer out=new OutputStreamWriter(new FileOutputStream(globals),java.nio.charset.StandardCharsets.UTF_8)) { out.write("globalThis.__PYON_LOADER__="+Appearance.identity()+";globalThis.__ASSAULT_CONFIG__="+config+";"); }
                            XposedBridge.invokeOriginalMethod(file,call.thisObject,new Object[]{globals.getPath(),globals.getPath(),call.args[2]});
                            var resources=XModuleResources.createInstance(modulePath,null);
                            loadOptionalAddons(assets,call.thisObject,resources.getAssets(),call.args[2]);
                            XposedBridge.invokeOriginalMethod(assets,call.thisObject,new Object[]{resources.getAssets(),"assets://assault-runtime.js",call.args[2]});
                            for(String script:new String[]{"rich-presence.js","account-controls.js","history-export.js", "html-export.js","assault.js"})
                                XposedBridge.invokeOriginalMethod(assets,call.thisObject,new Object[]{resources.getAssets(),"assets://"+script,call.args[2]});
                        } catch(Throwable e) { failure="Injection failed: "+e.getClass().getSimpleName()+". Enable safe mode and restart Discord."; XposedBridge.log(e); }
                    }
                };
                XposedBridge.hookMethod(assets,hook); XposedBridge.hookMethod(file,hook); hooked=true; hookName=name;
            } catch(Throwable unsupported) { XposedBridge.log("Assault: unsupported script hook " + name); }
        }
        if(!hooked)failure="This Discord build has an unsupported React Native loader. Update Assault Manager.";
        XposedHelpers.findAndHookMethod(Activity.class,"onPostResume",new XC_MethodHook() {
            @Override protected void afterHookedMethod(MethodHookParam param) {
                Activity activity=(Activity)param.thisObject;
                if(!activity.getClass().getName().startsWith("com.discord."))return;
                if(callbackClasses.add(activity.getClass())) {
                    hookCallback(activity.getClass(),"onNewIntent",new Class<?>[]{Intent.class},new XC_MethodHook(){
                        @Override protected void afterHookedMethod(MethodHookParam call){Controls.receiveProfile((Activity)call.thisObject,(Intent)call.args[0]);}
                    });
                    hookCallback(activity.getClass(),"onActivityResult",new Class<?>[]{int.class,int.class,Intent.class},new XC_MethodHook(){
                        @Override protected void afterHookedMethod(MethodHookParam call){HtmlExport.result((Activity)call.thisObject,(int)call.args[0],(int)call.args[1],(Intent)call.args[2]);AddonDocuments.result((Activity)call.thisObject,(int)call.args[0],(int)call.args[1],(Intent)call.args[2]);}
                    });
                }
                AddonDocuments.resumed(activity);
                Controls.receiveProfile(activity,activity.getIntent());
                if(activities.contains(activity))return;
                activities.add(activity);
                ViewGroup decor=(ViewGroup)activity.getWindow().getDecorView();
                try {
                    ImageButton button=new ImageButton(activity); button.setContentDescription("Assault controls");
                    var resources=XModuleResources.createInstance(modulePath,null);
                    button.setImageDrawable(resources.getDrawable(R.drawable.ic_assault_foreground,null));
                    button.setBackgroundTintList(ColorStateList.valueOf(Color.rgb(9,9,11)));
                    float density=activity.getResources().getDisplayMetrics().density;
                    boolean left=activity.getSharedPreferences("assault",0).getBoolean("leftControl",false);
                    FrameLayout.LayoutParams layout=new FrameLayout.LayoutParams(Math.round(48*density),Math.round(48*density),Gravity.TOP|(left?Gravity.START:Gravity.END));
                    layout.topMargin=Math.round(48*density); layout.setMarginStart(Math.round(8*density));layout.setMarginEnd(Math.round(8*density));
                    decor.addView(button,layout);FloatingControl.attach(activity,decor,button);button.setOnClickListener(v->Controls.show(activity,failure,hookName));
                } catch(RuntimeException error) { XposedBridge.log("Assault controls unavailable: " + error.getClass().getSimpleName()); }
            }
        });
    }
    private void loadOptionalAddons(Method assets,Object instance,AssetManager resources,Object synchronous) {
        try { XposedBridge.invokeOriginalMethod(assets,instance,new Object[]{resources,"assets://addons.js",synchronous}); }
        catch(Throwable error) {
            failure="Addon screens could not load. Existing runtime features remain available; update Assault Manager and prepare the client again.";
            XposedBridge.log(error);
        }
    }
    private static void hookCallback(Class<?> type,String name,Class<?>[] args,XC_MethodHook hook) {
        while(type!=null) {
            try{XposedBridge.hookMethod(type.getDeclaredMethod(name,args),hook);return;}
            catch(NoSuchMethodException absent){type=type.getSuperclass();}
            catch(Throwable unsupported){XposedBridge.log("Assault callback unavailable: "+name);return;}
        }
        XposedBridge.log("Assault: unsupported activity callback "+name);
    }

}

````

## tests/loader-assets.test.mjs

````mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
test('loader publication rejects missing/empty assets, wrong entrypoints and duplicated runtime', () => {
  const python = `
import importlib.util,tempfile,zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('build_android','scripts/build_android.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assets={'licenses/Acorn-MIT.txt':b'notice','addons.js':b'addons','xposed_init':b'app.assault.loader.AssaultLoader','assault-runtime.js':b'runtime','assault.js':b'capture','account-controls.js':b'controls','rich-presence.js':b'presence','history-export.js':b'history','html-export.js':b'html','licenses/Revenge-BSD-3-Clause.txt':b'notice'}
with tempfile.TemporaryDirectory() as tmp:
 for case in ['valid','missing','empty','entrypoint','duplicate','oversized','missing-license']:
  values=dict(assets)
  if case=='missing-license':del values['licenses/Acorn-MIT.txt']
  if case=='missing':del values['assault-runtime.js']
  if case=='empty':values['assault.js']=b''
  if case=='entrypoint':values['xposed_init']=b'wrong.Class'
  if case=='duplicate':values['revenge.js']=b'extra runtime'
  if case=='oversized':values['assault-runtime.js']=b'x'*(16*1024*1024+1)
  apk=Path(tmp)/'loader.apk'
  with zipfile.ZipFile(apk,'w',zipfile.ZIP_DEFLATED) as z:
   for name,data in values.items():z.writestr('assets/'+name,data)
  try:m.verify_loader_assets(apk)
  except (RuntimeError,KeyError):assert case!='valid',case
  else:assert case=='valid',case
`;
  const result = spawnSync('python3', ['-c', python], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});

test('optional addon injection failure is reported and returns to the existing loader chain', () => {
  const dir = mkdtempSync(join(tmpdir(), 'assault-loader-isolation-'));
  try {
    const source = readFileSync('android/loader/src/main/java/app/assault/loader/AssaultLoader.java', 'utf8');
    const method = source.slice(source.indexOf('    private void loadOptionalAddons('), source.indexOf('    private static void hookCallback'));
    assert.match(source, /loadOptionalAddons\(assets,call.thisObject,resources.getAssets\(\),call.args\[2\]\);\s*XposedBridge.invokeOriginalMethod\(assets,call.thisObject,new Object\[\]\{resources.getAssets\(\),"assets:\/\/assault-runtime.js"/);
    writeFileSync(join(dir, 'LoaderIsolationTest.java'), `
import java.lang.reflect.Method;
public class LoaderIsolationTest {
 String failure;
 static class AssetManager {}
 static class XposedBridge {
  static boolean fail; static Throwable logged;
  static void invokeOriginalMethod(Method m,Object instance,Object[] args)throws Throwable {if(fail)throw new LinkageError("synthetic addon failure");}
  static void log(Throwable error){logged=error;}
 }
 ${method}
 public static void main(String[] args) {
  LoaderIsolationTest loader=new LoaderIsolationTest();
  loader.loadOptionalAddons(null,null,new AssetManager(),true);
  if(loader.failure!=null||XposedBridge.logged!=null)throw new AssertionError("successful optional load reported failure");
  XposedBridge.fail=true;
  loader.loadOptionalAddons(null,null,new AssetManager(),true);
  if(loader.failure==null||!(XposedBridge.logged instanceof LinkageError))throw new AssertionError("optional load failure was not reported");
 }
}`);
    execFileSync('javac', ['-d', dir, join(dir, 'LoaderIsolationTest.java')]);
    execFileSync('java', ['-cp', dir, 'LoaderIsolationTest']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

````

## android/loader/src/main/java/app/assault/loader/DocumentTask.java

````java
package app.assault.loader;

import android.os.CancellationSignal;
import java.io.Closeable;
import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;

/** Owns a document operation's deadline and rejects completion after cancellation. */
final class DocumentTask implements AutoCloseable {
    final CancellationSignal signal = new CancellationSignal();
    private final Timer timer = new Timer("Assault document deadline", true);
    private final Thread worker = Thread.currentThread();
    private boolean settled;
    private Closeable resource;

    DocumentTask(Runnable timedOut, long millis) {
        timer.schedule(new TimerTask() {
            @Override public void run() {
                Closeable pending;
                synchronized (DocumentTask.this) {
                    if (settled) return;
                    settled = true;
                    pending = resource;
                    resource = null;
                }
                // Release the client session before provider cancellation, which may block.
                try { timedOut.run(); }
                finally {
                    worker.interrupt();
                    try { signal.cancel(); }
                    finally { closeQuietly(pending); timer.cancel(); }
                }
            }
        }, millis);
    }

    <T extends Closeable> T track(T value) throws IOException {
        synchronized (this) {
            if (!settled) { resource = value; return value; }
        }
        closeQuietly(value);
        throw new IOException("Document operation expired. Please retry.");
    }

    synchronized void complete(Runnable publish) {
        if (settled) return;
        settled = true;
        timer.cancel();
        publish.run();
    }

    @Override public synchronized void close() {
        settled = true;
        resource = null;
        timer.cancel();
    }

    private static void closeQuietly(Closeable value) {
        if (value != null) try { value.close(); } catch (Exception ignored) { }
    }
}

````

## tests/document-deadline.test.mjs

````mjs
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('document deadlines cancel providers, release sessions and reject late completion and resources', () => {
  const dir = mkdtempSync(join(tmpdir(), 'assault-document-deadline-'));
  try {
    mkdirSync(join(dir, 'android/os'), { recursive: true });
    const signal = join(dir, 'android/os/CancellationSignal.java');
    writeFileSync(signal, 'package android.os; public class CancellationSignal { public volatile boolean cancelled; public void cancel(){cancelled=true;} }');
    const source = join(dir, 'DocumentDeadlineTest.java');
    writeFileSync(source, `package app.assault.loader;
import java.io.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
public class DocumentDeadlineTest {
 static class Resource implements Closeable { volatile boolean closed; public void close(){closed=true;} }
 public static void main(String[] args)throws Exception {
  AtomicInteger timeouts=new AtomicInteger(),results=new AtomicInteger();
  try(DocumentTask task=new DocumentTask(()->timeouts.incrementAndGet(),50)) {task.complete(()->results.incrementAndGet());}
  Thread.sleep(100);
  if(timeouts.get()!=0||results.get()!=1)throw new AssertionError("successful work retained deadline");
  CountDownLatch released=new CountDownLatch(1),providerReturns=new CountDownLatch(1);
  AtomicReference<DocumentTask> running=new AtomicReference<>();AtomicReference<Throwable> error=new AtomicReference<>();
  Resource open=new Resource(),late=new Resource();
  Thread worker=new Thread(()->{
   try(DocumentTask task=new DocumentTask(()->{timeouts.incrementAndGet();released.countDown();},50)) {
    running.set(task);task.track(open);
    // Model a provider that ignores interruption until its remote request finishes.
    for(;;){try{providerReturns.await();break;}catch(InterruptedException ignored){}}
    task.complete(()->results.incrementAndGet());
    try{task.track(late);throw new AssertionError("late resource accepted");}catch(IOException expected){}
   }catch(Throwable e){error.set(e);}
  });
  worker.start();
  if(!released.await(2,TimeUnit.SECONDS))throw new AssertionError("session not released");
  long until=System.nanoTime()+2_000_000_000L;
  while((!running.get().signal.cancelled||!open.closed)&&System.nanoTime()<until)Thread.sleep(2);
  if(!running.get().signal.cancelled||!open.closed)throw new AssertionError("provider/stream not cancelled");
  // A new operation is usable while the old provider is still stuck.
  try(DocumentTask retry=new DocumentTask(()->timeouts.incrementAndGet(),50)){retry.complete(()->results.incrementAndGet());}
  providerReturns.countDown();worker.join(2000);
  if(worker.isAlive()||error.get()!=null||!late.closed||results.get()!=2||timeouts.get()!=1)throw new AssertionError("late completion changed state",error.get());
 }
}`);
    execFileSync('javac', ['-d', dir, signal, resolve('android/loader/src/main/java/app/assault/loader/DocumentTask.java'), source]);
    execFileSync('java', ['-cp', dir, 'app.assault.loader.DocumentDeadlineTest'], { timeout: 10000 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

````

