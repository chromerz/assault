# 2.11.2 audit validation

- 77 regression checks covered: final affected native suite 27/27 and 50 other passing checks, including release authorization/input validation, malformed browser settings, bounded GitHub transfers, session-note account isolation and existing history/export/native checks.
- TypeScript/Vite production build passes. `npm ci --dry-run --ignore-scripts` accepts the restored lockfile. npm audit reports zero known vulnerabilities.
- Manager and Loader debug/release variants build and pass signatures, 16 KiB alignment, embedded-loader/runtime validation and lint. Existing lint warnings remain: Manager 24 and Loader 19 per variant, zero errors.
- Shared-browser checks pass for nine automation/fleet tabs, note persistence across reload, release editor authorization controls and actual simulator JSON download content. No browser errors observed in these flows.
- Signed APK publication passes with real build artifacts; wrong versions and invalid Loader input leave the previous manifest intact. Signing continuity with 2.11.1 is verified.
- No phone/emulator install or live Discord account test was performed. Browser fleet/quest/voice controls are simulations. Native compatibility, real history/CDN retrieval, voice, rich-presence visibility and document-picker behavior still need device acceptance testing.

# 2.11.1 history export validation

- 65 regression tests pass, including histories beyond the capture limit, short pages, supplied closed DM IDs, HTTP failures, cancellation, privacy settings and native attachment URL/download checks using synthetic HTTPS responses.
- Manager/Loader debug and release builds, APK signatures, 16 KiB alignment and required embedded assets pass. Android lint reports zero errors; Manager 24 warnings and Loader 19 per variant.
- TypeScript/Vite production build passes. Quick exports explicitly mark session-only coverage. Full archives report coverage and attachment failures; they cannot guarantee unknown closed DMs or inaccessible/deleted server data.
- No logged-in Discord or Android device test has been performed. Client REST/store compatibility, real CDN downloads, very large archives, cancellation and document-picker behavior still require device acceptance testing.

# 2.11.0 validation (previous release)

- 51 regression tests pass, covering rich-presence payloads/asset timeouts, command isolation, token-text blocking, reaction restrictions/backoff, presence clear/reset, session privacy controls, scoped search, ghost-ping expiry HTML/JSON clearing races, and exclusion of machine-local signing properties from source ZIPs.
- Manager and Loader debug/release APKs compile and pass Android lint with zero errors. Manager has 24 warnings per variant and Loader 18 (translation, resource/compatibility suggestions and upstream helper-code warnings).
- All four APKs pass signature and 16 KB ZIP alignment checks. Each Manager embeds the matching Loader byte-for-byte, including the new rich-presence asset.
- TypeScript/Vite production build passes. The Manager signing certificate matches the prior 2.10.0 release from this task.
- These tests exercise isolated runtime modules and build outputs. No phone/emulator install or live account test was performed for this release. Rich-presence visibility/artwork/buttons, the native editor/JSON picker, plugin compatibility, login, voice and notifications require device acceptance checks.
- Private signing keys and Discord APKs are excluded from the release archive. GitHub publication is a documented user action and was not performed by building this release.

# 2.10.0 validation (previous release)

- Manager and loader, debug and release: compiled with Java 21 / SDK 36 / Gradle 8.13. Android lint completed with zero errors; Manager has 19 warnings per variant and Loader 13 (translation, resource, compatibility suggestions and unused upstream TLS helper code). Network downloads continue to use platform HTTPS verification.
- All four APK signatures and 16 KB ZIP alignment checks passed. Each Manager embeds its matching Loader byte-for-byte. Required runtime assets passed validation.
- 35 JavaScript/publication regression tests passed. TypeScript (including the server and manifest reader) and Vite production build passed.
- Portal returned HTTP 503 with no artifacts and HTTP 200 after publication. Browser checks cover unavailable and downloadable states, mobile layout and local APK verification.
- No Android device/emulator is attached for this task. Native installation, cancellation, checksum-error UI, patched-client login, voice, notifications and live plugins/themes remain unverified. Historical results below are not current task device results.
- This sandbox generated a new persistent local signing identity. Existing Manager installations signed with another certificate require a rebuild using their original key. The delivered ZIP excludes private keys.

## Historical validation

# Responsive AS settings follow-up

The native AS menu uses grouped cards, system light/dark colors, wrapping text and 48 dp minimum control targets. Its scrollable panel is capped at 560 dp and uses the current app window; the floating button follows visible keyboard/window/cutout bounds. Android 9+ remains required. No dependencies, permissions, WebView or runtime features were added/removed for this UI change.

All four APKs build and pass lint/signature/alignment/embedded-loader checks. An isolated Android UI fixture compiled the actual menu/control source and rendered the small-screen light layout on API 28 at 320×640, dark mode at 150% font scale, scrolled bottom controls, and an 800×1000 display override. System UI ANRs interrupted testing; fixture restarts also encountered timeouts before eventual successful rendering. This does not certify every OEM, Android version, foldable hinge, TV/controller, accessibility or live Discord integration scenario.

# 2.8.0 account controls and HTML export verification

- All four APK variants build, pass lint with no errors, verify signatures and 16 KB ZIP alignment, and contain the matching embedded loader. Nonblocking lint warnings remain.
- 22 JavaScript/publication tests pass, including local-command isolation, own-message reaction limits, HTML escaping, export cancellation/clear races and required APK assets. TypeScript/Vite production build passes.
- The original pinned Revenge runtime remains checksum-identical. Generated packaging changes display labels to Assault and includes its BSD notice; custom runtime/patcher implementation is retained.
- API 28 software emulator accepted the release upgrade from 2.7.0 to 2.8.0 and Manager launched. The emulator still encounters System UI ANRs. These checks do not establish live Discord account functionality.
- Live prefix commands, presence/reactions, native transcript picker callbacks, and capture-to-HTML integration inside a logged-in patched client remain unverified on a stable device. Profiles are disabled by default. No token or account credentials were used.
- Release publishing remains blocked until the repository owner activates the corrected `ci/android-release.yml` workflow under `.github/workflows/`; the current integration cannot push workflow updates. Version 2.8.0 requires a matching tag after merging.

## Previous 2.7.0 verification (historical)

# Android build/install verification — 2026-10-02

Current build and release instructions: [android-build-release.md](android-build-release.md).

- Both modules' debug and release APKs assemble and pass lint with zero errors, signature verification and 16 KB ZIP alignment. Both Manager APKs embed their matching loader byte-for-byte; custom patcher/runtime code is retained. Non-blocking lint warnings remain.
- All four APKs install and reinstall on an API 28 x86_64 software emulator. Both Manager variants launch; native UI, stable-version lookup and persisted job scheduling are observed. No Manager fatal exception was captured after launch.
- The custom host patcher verified and patched real Discord 347012 base/x86_64/en/xxhdpi inputs. The resulting set passes signatures/alignment and installs/reinstalls. The release loader initializes inside Discord and its native AS button appears, but the client remained on its startup screen during observation; successful login/main-screen startup is **unverified**.
- The software emulator has no hardware acceleration or Google Play services and intermittently reports System UI ANRs. Discord logs missing Play services, an API 29 thermal-listener class on API 28, upstream reflection warnings and an original-component-factory warning. These are not a clean runtime pass. Manager's GitHub lookup also encounters the sandbox proxy's untrusted certificate; TLS checks remain enabled.
- Existing JavaScript/publication tests: 14 passed. TypeScript/Vite build passed. Release workflow passes actionlint and matching/mismatching tag checks. GitHub workflow execution/publication remains unverified; configure signing secrets and push the matching tag after merging.
- Release Manager also completed real on-device download, original verification, custom patching/signing and output verification, publishing all four splits with `prepared=347012`, `prepared_loader=27000`, and “Ready to install”.
- Android installer confirmation/cancel/retry, real version upgrades, API 36 compatibility, login, chat/voice/media/notifications, plugins/themes and capture integration require acceptance checks on a stable device. The host checks and standalone loader install do not replace those checks.

The sections below describe earlier historical work, including a different signing identity; they are not results from this task.

# Android validation — earlier 2.6 baseline

For the 2.7 expansion and its additional checks, see `expansion-2.7.md` and the delivered validation report. The results below are historical, not a substitute for validating changed 2.7 inputs.

Baseline: Discord 347012 (target SDK 36); Assault Manager and native loader 2.6.0.

## Passed

- Java 21 / Gradle 8.13 release build against Android API 36, including both native modules.
- Android release lint: no errors. Remaining warnings include English-only UI strings and unused TLS helper classes inside the upstream JAR. Downloads use platform HTTPS verification.
- Manager APK signing verified; debugging disabled; persistent release certificate SHA-256 `5d2e3aff39025b8ed351a0e712c98d2487e77aabe45d52672302b631c3825001`. Two release builds retained the same identity.
- Manager's LSPatch adapter patched the real Discord base and three required splits for both x86_64 and arm64. All four outputs pass APK signature verification for supported API 28+. The final release loader is embedded byte-for-byte in the patched base.
- Patched base and x86_64/arm64 native splits pass 16 KB ZIP alignment checks with Manager's adapter. The upstream CLI's 4 KB nesting default caused an observed alignment failure; Manager now explicitly sets 16 KB alignment before signing. All 43 Discord arm64 libraries and LSPatch arm64/x86_64 ELF load segments support 16 KB alignment. The ZIP tool warns about the upstream patcher's nested ZIP layout.
- Real original base and three splits pass the manager's signer/package/version verifier. Wrong versions and a non-Discord signing certificate are rejected.
- Five wrapper regression tests: retained edits/deletions, disabled controls/logout, bounded capture, unrelated events, loaded history and mixed bulk deletions.
- Host JVM checks: seven manager-version comparisons; sixteen concurrent prepare reservations yield one winner, exclude installation and allow retry. Seven installer callback cases pass using Android stubs. Four Manager task-lifecycle cases cover rejected installation/preparation queues, lookup failure and preserving a newer preparation reservation. A real-input preparation failure check preserves the previous set, removes new partial output and releases the reservation. Six isolated build signing-lifecycle checks pass, including failed initialization cleanup and retry. Eight simultaneous real signing initializers share one valid keystore. Both legacy command forms reject unsupported arguments. The browser clears stale release links after HTTP errors and recovers after a successful refresh. These host tests do not replace device testing.
- Web TypeScript/production build; browser checks at desktop and 390 px mobile widths; served APK checksum matches the generated file.
- Review checkpoint: nine completed CodeRabbit passes returned 2, 4, 2, 6, 1, 2, 2, 6 and 4 finding events. Pass eight repeats three issues twice; pass nine repeats one preparation issue. All actionable findings were fixed and validated, including signing concurrency, release state, legacy arguments, Manager task rejection/cleanup and explicit UTF-8 config. The loopback-only binding recommendation was declined because the public download portal intentionally supports externally reachable sandbox/deployment previews. Final follow-up results are recorded separately from this source checkpoint.

## Runtime blocker

A fresh API 36 x86_64 Google APIs emulator was started without hardware acceleration because `/dev/kvm` is unavailable. Android first-boot compilation took many minutes. Its system watchdog then killed `system_server` while waiting for ConnectivityService; SystemUI and PermissionController reported `DeadSystemException`. Manager installation attempts returned either `Can't find service: package` or `device is still booting` before the app was installed. This is an emulator startup failure, not a successful app launch.

Native Manager interaction, patching on-device, installation confirmation/cancel/retry, patched Discord launch, login, messaging, calls, notifications, themes/plugins and real update installation remain unverified. No Discord account credentials were used. A target-SDK declaration and a valid signature do not establish complete Android 16 compatibility.

## Feature scope

The native implementation uses Discord's existing interface and a real embedded loader. The old React prototype's billing/Nitro simulator, claimed E2EE, fake patch stages and simulated accounts are not shipped as native features. Not every old prototype control has been ported. Uninstalling Manager or clearing its data permanently loses the local client signing key; updating afterward requires reinstalling the client and losing its local app data. Manager explains this before installation. Windows executable selection is implemented but has not been run on Windows. Manager self-updates additionally require a newer GitHub release named `Assault-Manager.apk`, signed with the same persistent key.
