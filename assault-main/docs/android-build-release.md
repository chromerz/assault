# Build, install and publish Android APKs

## Toolchain and variants

Use JDK 21, Python 3.9+, Android SDK `platforms;android-36`, `build-tools;36.0.0`, and `platform-tools`. Set `JAVA_HOME` and `ANDROID_HOME` and put Java and platform-tools on `PATH`. The checked-in wrapper downloads checksum-pinned Gradle 8.13; AGP is 8.11.1 and automatically provisions its default build-tools 35.0.0; build-tools 36.0.0 are used by the explicit APK verification steps. Node 24/npm are needed only for the download portal and JavaScript regression tests.

```bash
sdkmanager 'platforms;android-36' 'build-tools;36.0.0' 'platform-tools'
python3 scripts/build_android.py --all-variants
npm ci
npm test
npm run build
```

The Python command downloads the three checksum-pinned dependencies, builds and lints all four APKs, verifies each signature and 16 KB ZIP alignment, and publishes the release Manager to `public/releases/`. Omit `--all-variants` to build/lint only both release APKs. No product flavors or ABI splits are configured. Manager and loader are universal APKs with minimum API 28 and target API 36; the patcher payload contains the existing four upstream ABI libraries. The downloaded Discord client has its own minimum SDK and device ABI requirements.

| APK | Output | Purpose |
| --- | --- | --- |
| Manager debug | `android/manager/build/outputs/apk/debug/manager-debug.apk` | Native Manager, debugging enabled |
| Manager release | `android/manager/build/outputs/apk/release/manager-release.apk` | R8/resource-shrunk distributable; also `public/releases/Assault-Manager.apk` |
| Loader debug | `android/loader/build/outputs/apk/debug/loader-debug.apk` | Xposed module embedded in debug Manager |
| Loader release | `android/loader/build/outputs/apk/release/loader-release.apk` | Xposed module embedded in release Manager |

After the Python command has prepared dependencies, debug-only Gradle builds require no release credentials:

```bash
cd android
./gradlew :manager:assembleDebug :loader:assembleDebug :manager:lintDebug :loader:lintDebug
```

Generated loader assets live under Manager's build directory. Legacy generated `android/manager/src/main/assets/loader.apk` files are excluded automatically. The custom `ApkPatcher` source, original injection assets, native controls/themes, plugin runtime and bounded capture logic remain included. The plugin runtime retains its functions with Assault display branding. Account profiles are off by default; export uses standalone HTML and Android’s document picker. No WebView is added. The only new permission is `ACCESS_NETWORK_STATE`: Android 14+ requires it for the updater's existing network-constrained JobScheduler job.

## Persistent signing

Local release builds reuse `$HOME/.local/share/assault/signing/manager.p12` (alias `assault`) and its adjacent `password` file, creating them privately on the first build. **Back up both securely.** To use an existing identity, set:

```bash
export ASSAULT_KEYSTORE_PATH=/absolute/private/path/manager.p12
read -rsp 'Signing password: ' ASSAULT_SIGNING_PASSWORD; echo
export ASSAULT_SIGNING_PASSWORD
python3 scripts/build_android.py --all-variants
```

Both release APKs use this key. Debug APKs use Android's local debug keystore. A direct Gradle release build requires these environment variables and fails if signing is missing. A new build machine must restore the existing release identity before publishing updates; never create a new key for an already distributed app.

Manager debug and release intentionally retain the same application ID `app.assault.manager`; loader variants retain `app.assault.loader`, which the custom patcher uses. Each variant can update a previous install signed with the same key. Switching between debug and release keys requires a separate emulator or uninstall, which deletes Manager's locally generated **client** signing key and prevents subsequent patched-client upgrades. Use a disposable emulator for variant-switch tests; do not clear a real user's Manager data.

## Install and reinstall

Select one device with `ANDROID_SERIAL` if multiple are connected. Confirm API >=28 and `adb shell getprop sys.boot_completed` returns `1`. Run each pair on a clean device for its signing identity; the second command tests a same-version reinstall while preserving data:

```bash
adb install android/manager/build/outputs/apk/debug/manager-debug.apk
adb install -r android/manager/build/outputs/apk/debug/manager-debug.apk
adb shell am start -W -n app.assault.manager/.ManagerActivity

adb install android/loader/build/outputs/apk/debug/loader-debug.apk
adb install -r android/loader/build/outputs/apk/debug/loader-debug.apk

# On a separate clean device, or after explicitly uninstalling debug variants:
adb install android/manager/build/outputs/apk/release/manager-release.apk
adb install -r android/manager/build/outputs/apk/release/manager-release.apk
adb shell am start -W -n app.assault.manager/.ManagerActivity

adb install android/loader/build/outputs/apk/release/loader-release.apk
adb install -r android/loader/build/outputs/apk/release/loader-release.apk
```

The loader has no launcher Activity and is normally installed only as an embedded module by Manager. Its standalone install is a packaging check. For a true version upgrade, increment both modules' `versionCode` and `versionName`, rebuild with the same key, and use `adb install -r`. Never use `-d` to conceal a version downgrade or regenerate keys to bypass a signature mismatch.

Use Manager to download/prepare the native client, grant its unknown-app install permission, and confirm the Android installer. Patched Discord retains `com.discord`; an official Discord install has a different signer. Prepare first, then remove official Discord manually if necessary, understanding that uninstall clears its data. Future patches require the same Manager data/signing key. If copying a prepared set to a host for validation, install all four together:

```bash
adb install-multiple -r base-487-lspatched.apk split_config.arm64_v8a-487-lspatched.apk split_config.en-487-lspatched.apk split_config.xxhdpi-487-lspatched.apk
```

This example uses an arm64 device and the pinned patcher build 487. Replace the ABI split with the one Manager prepared for your device (for example `split_config.x86_64-487-lspatched.apk`), and use actual filenames from that prepared set; do not mix APK versions, original and patched splits, or signing keys.

## Runtime acceptance checks

On API 28 and a current API 36 device/emulator, test both Manager variants and the release-patched client:

1. Clear logcat before launch, then open Manager, change schedule/network/charging controls, rotate/background/resume, and check updates. Check `adb logcat -b crash -d` and `adb logcat -d` for fatal exceptions, missing resources, permissions and verification errors.
2. Prepare the client; cancel/retry preparation; check cleanup preserves a previously prepared set and the local key. Test unknown-app permission denied/granted, installer cancel/retry/success, and reinstall a prepared client over itself.
3. Open Assault and test login, servers/channels/DMs, sending/editing/deleting messages, capture/export limits and logout clearing. Test voice, attachments, notifications, plugins/themes, native controls, safe mode and runtime-disabled mode. Use a test account; don't copy credentials into reports.
4. Publish a newer Manager with the same release key, check its self-update, then verify Manager data and the installed client's update path survive. A debug Manager cannot self-update from release-signed assets.

A successful build or standalone loader install cannot prove injection compatibility with a future Discord release. See `android-validation.md` for historical results and current task reports for actual observations.

## GitHub Releases

`.github/workflows/android-release.yml` runs on stable version tags such as `v2.8.0`. It builds/lints/signs every variant, verifies signatures/alignment, runs custom JavaScript regression tests and the portal build, then creates a GitHub Release with **Assault-Manager.apk**, **Assault-Loader.apk**, **SHA256SUMS**, and the release ZIP (including source). Debug APKs are validated but not published because CI debug identities are disposable. No Discord APK or keystore is uploaded. Manager reads `https://api.github.com/repos/hypercharacterization/assault/releases/latest` and accepts only a newer, same-signer Manager APK.

The maintained workflow copy is `ci/android-release.yml`. Copy it to `.github/workflows/android-release.yml` when activating or updating Actions. Android setup explicitly requests `platform-tools`; the setup action's default also requests the retired `tools` package, which fails on current SDK repositories.

Before tagging:

1. Merge this workflow and fixes into the repository. Ensure GitHub Actions is enabled and repository policy permits the workflow's `contents: write` permission.
2. Configure repository Actions secrets **ASSAULT_KEYSTORE_BASE64** (base64 of the existing PKCS12 keystore, alias `assault`) and **ASSAULT_SIGNING_PASSWORD** (store/key password). The workflow refuses missing secrets. Reuse the identity of any previously installed release. `GITHUB_TOKEN` is supplied automatically; no PAT secret is needed.
3. Set the same stable version in `package.json` and both Android modules' `versionName`; increase both `versionCode` values for upgrades. Keep the package lock's root version synchronized. The workflow rejects a tag/version mismatch.
4. Push a matching, unused tag from the commit containing the workflow:

```bash
git tag v2.8.0
git push origin v2.8.0
```

For later releases substitute the new version. To configure secrets using your authenticated GitHub CLI without printing their values (Linux/macOS):

```bash
base64 < "$HOME/.local/share/assault/signing/manager.p12" | gh secret set ASSAULT_KEYSTORE_BASE64 --repo hypercharacterization/assault
gh secret set ASSAULT_SIGNING_PASSWORD --repo hypercharacterization/assault < "$HOME/.local/share/assault/signing/password"
```

A release already published under that tag is not overwritten. If publication succeeded but a runner lost its response, inspect the release and checksums before rerunning. If build/test failed before publication, fix the cause and rerun the failed workflow; never replace an installed release with a differently signed APK.

For a workflow fix after a tag has already been pushed, update the active workflow on `main`, then open **Actions → Android release → Run workflow**, select branch **main**, and enter the existing tag (for example `v2.8.0`). This runs the updated workflow while checking out and building the original tagged source. Rerunning the old failed run uses its old workflow and will not pick up the correction. No tag needs to be moved.

## ZIP delivery

After a successful build, run `python3 scripts/pack_release_artifacts.py --output-dir release`. The packager rechecks APK signatures and alignment and confirms the embedded loader matches. It includes buildable source and excludes ignored build products and private signing material. It fails if compiled release outputs are missing.
