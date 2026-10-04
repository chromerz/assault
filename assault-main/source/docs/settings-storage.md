# Settings storage lifecycle

The loader downloads the checksum-pinned Revenge v1.11.6 bundle. Gradle's
`runtimeAssets` task runs `scripts/patch_runtime.py` before applying display
branding, and packages only `assault-runtime.js`. The upstream download stays
unchanged. Both a checksum mismatch and a changed patch target fail the build;
an upstream update requires reviewing the patches again.

## Crash and repair

The original `wrapSync(createStorage(...))` returned a facade backed by `{}`
until the asynchronous native read completed. That object had no storage
emitter. Startup called `initSettings()` and `patchSettings()` without waiting
for settings. Discord's `SettingHookHarness` could then call the developer row's
`usePredicate`, which called `useProxy(settings)` and threw the reported error.

Startup now awaits settings, loader configuration, themes, fonts and the legacy
plugin registry before installing UI hooks. Rejected reads reach the existing
runtime initialization error handler before any settings rows are registered.
Fresh settings explicitly default `developerSettings` to false; existing keys
and persisted values are preserved.

The wrapper also supplies a real proxy while loading. Its hydration notification
causes mounted consumers to render again and subscribe to the loaded emitter.
`useProxy` resubscribes when either storage or emitter changes, cleans up on
unmount, and checks for missed changes when effects mount. Writes before loading
finishes throw: a placeholder must never overwrite saved settings. Invalid
storage roots reject initialization without a write. JSON objects and arrays
remain supported, including nested null values.

## Hook API

Existing `vendetta.storage` names and signatures remain available. Two helpers
are added:

```js
const storage = vendetta.storage.wrapSync(
    vendetta.storage.createStorage(backend)
);

// Outside React: resolves after loading, rejects with the original read error.
await vendetta.storage.awaitSyncWrapper(storage);

// In a React component: always call the hook before conditional returns.
const { status, error } = vendetta.storage.useStorageState(storage);
// status is "loading", "ready", or "error"; render loading/error UI before
// reading required nested keys or enabling writes. This hook also subscribes.

// Outside React, inspect without subscribing:
vendetta.storage.getStorageState(storage);
```

A direct proxy is already `ready`. `useProxy` still returns the supplied storage
and rejects plain objects: plugins must create storage through the storage API.
The helpers apply to the legacy proxy API; they do not replace Revenge's newer
Observable storage API.

## Consumer audit

All bundled `useProxy` calls and `usePredicate` definitions were inspected:

- Settings pages, the error boundary and developer predicate consume the shared
  settings wrapper; developer settings also consume loader configuration.
- Plugin/theme lists and install UI consume the root plugin/theme registries.
  Plugin cards now subscribe to the registry itself, so uninstalling a plugin
  cannot pass a deleted entry to `useProxy`.
- Theme cards receive proxied entries from the theme registry. Font lists use
  the font registry; the font editor constructs its own proxy with `createProxy`.
- Theme/font predicates check loader support without consuming storage. The
  settings adapter forwards registered predicates to Discord.
- Legacy plugins receive awaited storage during registration. The public
  `useProxy` entry point retains validation for third-party callers. Observable
  plugin settings are awaited by the existing `updatePlugins()` startup work.

Four redundant public forwarding functions were replaced by direct references
without deleting their API names. The wrapper's callback queue and unused
Reflect trap generation were replaced by a settling promise and explicit proxy
operations. No runtime dependency or unrelated module was removed.

## Verification and device checks

`npm test` checks the actual pinned bundle, reproduces the original crash, applies
the production patch and exercises pending/failed reads, hydration between render
and effects, subscription cleanup, store replacement, plugin uninstall/reinstall,
null serialization, and startup ordering. It uses React server rendering for the
developer predicate and a controlled harness for subscription lifecycles; these
do not run Android's React Native renderer. If the ignored upstream asset is
absent, this test downloads it from the pinned URL and verifies its checksum.

On Android, prepare/reinstall a client containing the rebuilt loader using the
same signing identity. Cold-start Discord and open settings immediately; repeat
with existing settings and a fresh test profile. Toggle developer settings and
confirm row visibility, restart to verify persistence, open theme/font settings,
and uninstall/reinstall a test plugin while its list is open. Check logcat for
the undefined-emitter error and hook-order/subscription errors. Third-party
plugins and a custom runtime endpoint need separate checks; these patches apply
to the bundled runtime only.
