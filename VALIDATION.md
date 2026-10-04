# Android code runner — candidate verification

Base repository revision: `d35e10cf59b8a6ff74b5ea7ae0eed7003e75e556`. Source: `assault-main/source/`. Changes remain in the working tree.

## Delivered behavior

- JavaScript (CommonJS and ES modules), Python and Bash tabs in the actual React Native settings.
- File import, persistent project source/arguments/setup commands, opt-in restart and safe-mode handling.
- Explicit dependency setup in each project directory; stdin, status/exit codes, refresh, stop and bounded console output.
- Certificate-authenticated Manager-to-Termux broker, idempotent launches, process-group cleanup and recovery.
- Project backup/restore through verified Android document writes. Generated Termux files require separate backup.
- Unsaved-edit confirmation, synchronous duplicate-action guard, unmount protection and theme-aware contrast.

## Automated checks

64 distinct selected Node test cases pass across this increment, with 23 affected cases rerun after the final fixes and 41 equivalent earlier passes reused. The process-helper test also runs thirteen Python integration cases with real Node/Python/Bash subprocesses. An additional standalone smoke test exercised the exact broker bootstrap/stdin protocol with a 64 KiB source requiring worst-case JSON escaping.

Coverage includes source and settings validation, duplicate launches/taps, setup commands, durable IDs before dispatch, uncertain callback recovery, process exit/stop/escalation, supervisor death, stdin, working-directory persistence, console bounds, restored project preferences, corrupted addon storage, bright themes, and the actual Java authorization method with a synthetic certificate. Native mailbox regression includes polling after picker request IDs are exhausted. A binary AXML regression verifies the new Manager query preserves existing package queries and application attributes.

The Android build passes release assembly, lint, signatures, ZIP alignment and matching embedded-loader checks. The first build failed on an API33-only Java call; this was replaced with the existing API28-compatible bounded reader and subsequent builds passed. An initial test fixture cleanup error was corrected and rerun successfully. Existing unchanged portal TypeScript/Vite passes were reused after verifying 23 source/configuration/lockfile hashes.

Versions: Node24.14.1, npm11.11.0, Python3.9.25, OpenJDK21.0.2, SDK36, Gradle8.13/AGP8.11.1. No new npm/Gradle dependency. Termux with Python/Node/Bash is an external runtime prerequisite.

## Review

CodeRabbit pass 1 reported three findings (1 major, 2 minor); pass 2 reported two more major findings. All five were fixed: foreground-service launch, document-picker counter exhaustion during polling, escaped-source request sizing, Termux success-code decoding, and bounded completed-run retention. Pass 3 reported three minor issues, also fixed: string output-length metadata, permission-denial recovery, and isolation of runner versus addon mailboxes. Pass 4 reported four major issues, fixed and covered by regression tests: schema-invalid journal fallback, delayed supervisor reservation, per-plugin startup recovery, and stalled upload cancellation. Pass 5 reported two major issues: optional addon injection failure aborted existing runtime loading, and the transfer deadline ended before the server response. Both were fixed and tested, including stalled response headers and bodies. Pass 6 reported one major issue: a stalled document provider could retain the native session. Added a document deadline with cancellation, session release and late-result rejection; its regression includes an interruption-ignoring provider. Pass 7 completed with two minor findings: stop signaling raced child exit, and temporary request cleanup skipped unavailable/failed deletion. Both were fixed and their affected tests passed. Across seven completed passes: 17 findings (10 major, 7 minor), all addressed. The required stop-hook review (pass 8) subsequently completed with zero findings on the unchanged current diff. All 17 findings from earlier passes are resolved. No review remains running. Source/dependency hashes still match the tested candidate, so the existing 64 automated passes and APK build checks are reused.

## Blocked device acceptance

No Android device is attached. The earlier API30 software emulator lost package/system services before Manager could install; diagnostics remain in the previous `android-ui-review` output. Actual Android Binder and Termux permission/command handoff, React Native visuals, keyboard, rotation, font scaling, TalkBack, force-stop/restart and foreground-service restrictions are not verified. API28/API36 acceptance remains outstanding, as do authenticated Discord DM/voice/RPC checks. Host fixtures do not establish those passes.

These are signed **candidate Manager and Loader APKs**, not a production-certified patched Discord client. Manager fetches and patches the official client on the device. Preserve Manager data: it contains the client signing key. A differently signed Manager installation requires its original signing key for an in-place update.

## Setup

Install the candidate Manager, prepare and install the client again for its targeted package-visibility entry, then follow `source/docs/code-runner.md` in the release ZIP. In Termux install `python nodejs bash` and enable `allow-external-apps=true`; in Manager enable Code runner and grant its execution permission. Scripts run with Termux permissions, separately from addon sandbox code. No Discord account credentials are forwarded by the runner.
