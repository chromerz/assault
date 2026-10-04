# Assault 2.7 expansion

This extends the existing Java / Gradle native wrapper. Manager downloads verified official Discord APK splits and embeds the Xposed loader. Discord supplies its React Native UI, account flows, media and voice. The separate web project is only a download portal.

## Features and weight

| Area | Expansion | Weight control |
| --- | --- | --- |
| Capture | Configurable count, edit depth, content budget, expiry, optional attachments; logout/account-switch reset | Bounded maps, truncated strings, no periodic cleanup timer |
| Exports | JSON, text, deleted-only, redacted authors; clear channel/all | Uses existing clipboard and command APIs; no database or export dependency |
| Privacy | Separate crash-report fetch filter and request counters | Existing fetch hook; no background service; does not claim to intercept all native telemetry |
| Recovery | Hook/theme diagnostics, safe mode, independently disabled native theme/runtime, left/right controls | Dialog constructed on demand; optional runtime skipped entirely |
| Themes/plugins | Existing Revenge settings retained; bounded native color maps and resource-ID caching | Same pinned bundle; no new plugin engine |
| Downloads | Cancellation, bounded retry, storage preflight, verified staging and safe cache cleanup | Existing streams/executor; previous prepared set survives errors |
| Updates | Client and loader version checks; 6/24/72-hour schedule with network/charging controls | Android JobScheduler, no polling service; UI uses preference events |
| Branding | Black/red AS silhouette, adaptive foreground/background and monochrome | Vector XML; self-contained icon inserted before original patch signing |

The 4 MiB default capture budget measures serialized content plus a per-entry allowance. It is not a total process-memory cap. Exporting creates temporary strings. Actual startup time and device memory have not been benchmarked. No claim is made that Discord itself has been stripped; its original APK remains intact inside LSPatch's compact nested layout.

## Build/config changes

- Java 21, Android SDK/build tools 36, Gradle wrapper 8.13, existing pinned native dependencies.
- Both modules: version 2.7.0 / 27000, R8 optimization, resource shrinking and targeted keep rules.
- Shared icons live in `android/branding/res`; both manifests use them.
- The Manager dependency preparation task excludes the upstream `ApkPatcher.class`, compiles its scoped source adaptation, and packages original injection assets separately from Java program inputs. Never feed the embedded DEX into R8 as program classes.
- npm is the portal package manager; `package-lock.json` replaces the obsolete Bun lock. Removed unused JSZip/Tailwind and unreachable simulated-client source. No shipped native feature depended on those files.
- Run `npm ci`, `npm test`, `npm run build`, and `ANDROID_HOME=/your/sdk npm run build:android`. Preserve the existing release keystore; never regenerate it for an update.

## Validation boundaries

Release builds, Android lint, APK signatures, JavaScript regression cases and host patching are testable in this sandbox. Phone installation, Android 16 lifecycle behavior, native hook compatibility, login, voice, notifications and third-party plugins still need a real device. The API 36 software emulator previously failed to boot reliably without hardware acceleration. Windows build-script execution is also unverified. Unsupported hooks show recovery diagnostics; unsupported signatures or launcher resources stop preparation instead of replacing a verified client.

The APK is the separate Manager. The client is downloaded and patched locally with the Manager's private signing identity; the source bundle does not redistribute Discord APKs.
