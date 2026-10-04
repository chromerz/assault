# Publish Assault 2.11.1 on your GitHub repository

This guide covers uploading the ready-built release, building releases with GitHub Actions, and installing updates. Publishing a GitHub release does not install the app on anyone's phone.

## What you have

Extract `Assault-2.11.1-release.zip`. It contains:

- `Assault-Manager.apk` — install this; the matching loader is already inside it.
- `Assault-Loader.apk` — optional standalone module for advanced use, with no launcher.
- `SHA256SUMS` — SHA-256 values for both APKs.
- `source/` — the full buildable source, lockfile, Gradle wrapper and release workflow.
- `docs/` and `licenses/` — usage, publication, validation and license information.

There is no Discord APK or private signing key in the ZIP. Manager obtains and verifies the client on the device.

## Route A: upload these built APKs yourself

Use this route if you want to publish the supplied build without configuring a build machine.

1. Put the supplied `source/` contents into your repository checkout, preserving `.github/`, and commit the changes. Keep your existing repository history and remotes. Do not upload `node_modules`, private keys or the extracted APKs as source files.
2. Push that source commit to a branch in your repository and merge it as appropriate. The release tag must identify the source used for these APKs. If you modify the source, rebuild the APKs before releasing the modified version.
3. Open **your repository → Releases → Draft a new release**.
4. Choose/create the unused tag **`v2.11.1`** and target the commit containing the supplied source. If that version is already published, use a new version after updating and rebuilding; do not replace an existing release's APKs.
5. Set the title to **Assault 2.11.1** and paste the contents of `docs/release-notes.md` into the description.
6. Attach **all four**: `Assault-Manager.apk`, `Assault-Loader.apk`, `SHA256SUMS`, and `Assault-2.11.1-release.zip`. Upload the individual Manager APK as well as the ZIP: the in-app updater looks for the exact asset name `Assault-Manager.apk`.
7. Use a prerelease while performing device acceptance checks. Once tested, publish a stable release and mark it latest if appropriate. The Manager's `/releases/latest` update check does not use draft or prerelease builds.
8. Open the published release from a signed-out browser and confirm its APK assets download. Compare the files against `SHA256SUMS` before installing.

Choose one publisher per version. If using this manual route while the tag-triggered **Android release** workflow is enabled, disable that workflow in its Actions menu before creating this tag, or use Route B. The automatic publisher deliberately refuses to overwrite an existing release.

GitHub's [release creation instructions](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) explain the tag, target, assets, prerelease and latest controls.

### Checksums on your computer

From the extracted ZIP directory:

```bash
# Linux
sha256sum -c SHA256SUMS

# macOS
shasum -a 256 -c SHA256SUMS
```

On Windows PowerShell:

```powershell
Get-FileHash .\Assault-Manager.apk -Algorithm SHA256
Get-FileHash .\Assault-Loader.apk -Algorithm SHA256
```

If Android build-tools are available, run `apksigner verify --print-certs Assault-Manager.apk` to inspect the public certificate SHA-256. Compare that certificate with your prior release before distributing updates.

Compare the APK file hashes with `SHA256SUMS`. A checksum confirms that files match this package; Android also checks signing certificates during installation.

## Route B: build and publish with GitHub Actions

Use this route for repeatable future releases. First put the source and `.github/workflows/android-release.yml` in your repository. `ci/android-release.yml` is the matching maintained copy.

### 1. Preserve your release identity

There are **two different signing identities**:

| Identity | Where it lives | Why it matters |
| --- | --- | --- |
| Manager/Loader release signing key | Build machine's private keystore, or GitHub Actions secrets | New Manager APKs can update an installed Manager only when the certificates match. |
| Patched-client signing key | Manager's private Android app data | Future patched Discord installs can update the client only while this key is preserved. |

The supplied 2.11.1 build reuses the same private release identity as the 2.10.0 build from this task. Uploading these APKs requires no keystore. Rebuilding compatible updates requires that same private release keystore and password.

The local build script stores its default release key at `$HOME/.local/share/assault/signing/manager.p12` and its password in the adjacent `password` file, on the machine that built it. Those files are deliberately excluded from the release ZIP. Back them up privately. If you do not have an existing release identity, a first local build can create one for your new distribution; it will not update installations signed by a different key.

### 2. Configure Actions secrets

In **repository Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret | Value |
| --- | --- |
| `ASSAULT_KEYSTORE_BASE64` | Base64 encoding of the existing PKCS12 keystore; the key alias must be `assault`. |
| `ASSAULT_SIGNING_PASSWORD` | That keystore/key password. |

If GitHub CLI is installed and authenticated to your own account, run these on the machine holding the private key. Replace `YOUR_OWNER/YOUR_REPO` with your repository:

```bash
base64 < "$HOME/.local/share/assault/signing/manager.p12" |
  gh secret set ASSAULT_KEYSTORE_BASE64 --repo YOUR_OWNER/YOUR_REPO

gh secret set ASSAULT_SIGNING_PASSWORD --repo YOUR_OWNER/YOUR_REPO \
  < "$HOME/.local/share/assault/signing/password"
```

Do not paste the key or password into a commit, issue, chat, release asset or workflow log. The workflow fails when either secret is missing. Its `GITHUB_TOKEN` is supplied by GitHub; you do not need to add a PAT secret for publishing. See [GitHub's repository-secret instructions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

### 3. Configure the repository used by in-app updates

The current Manager checks:

```text
https://api.github.com/repos/hypercharacterization/assault/releases/latest
```

For a different repository, update `MANAGER_RELEASE` in `android/manager/src/main/java/app/assault/manager/ReleaseSource.java`, then rebuild. Change the repository links in the native notices and portal too. Simply uploading an unchanged APK to a fork will not redirect its updater. This unauthenticated updater needs a public release and downloadable assets.

### 4. Choose a version and build

For the supplied source, these are already synchronized:

- `package.json` and `package-lock.json`: `2.11.1`.
- Both Android `build.gradle` files: `versionName '2.11.1'`, `versionCode 211001`.
- Release tag: `v2.11.1`.

For a future release, change the semantic version everywhere above, increase **both** Android version codes, and refresh the lockfile with `npm install --package-lock-only`. Update the runtime diagnostic version in `android/loader/src/main/assets/assault.js`, the release notes, and the workflow's manual-run default tag. Never reuse a published tag or lower the Android version code.

Commit and merge the source before tagging. In your local checkout, after confirming it points at the intended release commit:

```bash
git tag v2.11.1
git push origin v2.11.1
```

The workflow builds and lints debug/release Manager and Loader, checks APK signatures/alignment/embedded assets, runs regression tests and the portal build, packages the ZIP, and creates the GitHub release. Watch **Actions → Android release** until it succeeds. Repository policy must allow the workflow's `contents: write` permission.

A failed build does not mean a release exists. Fix the underlying problem and use the manual workflow input to build an existing tag when appropriate. If the tagged source needs changing, create a new version and tag; don't move a published tag. Running an old workflow job again uses that job's original source.

## Build locally instead

Requirements: Node 24, npm, Python 3.9+, JDK 21, Android SDK platform 36 and build-tools 36.0.0. The repository includes the Gradle 8.13 wrapper.

```bash
export ANDROID_HOME=/absolute/path/to/android-sdk
npm ci
python3 scripts/build_android.py --all-variants
npm test
npm run build
npm run release:zip
```

The ZIP is written to `release/`. For an existing distribution, provide the original signing identity before building:

```bash
export ASSAULT_KEYSTORE_PATH=/absolute/private/path/manager.p12
read -rsp 'Signing password: ' ASSAULT_SIGNING_PASSWORD; echo
export ASSAULT_SIGNING_PASSWORD
python3 scripts/build_android.py --all-variants
unset ASSAULT_SIGNING_PASSWORD
```

Do not use a new signing key to work around an update conflict. A missing/corrupt keystore requires restoring its private backup.

## Install and activate the in-app features

1. Install `Assault-Manager.apk` on Android 9+.
2. In Manager, choose **Download & prepare client**, then **Install prepared update**. Grant install permission and confirm Android's prompt. Official Discord has a different signer; removing it clears its local data. Prepare the client before deciding to uninstall anything.
3. Open the patched client. In **AS → Account controls**, choose **Local controls** or **Controls + custom presence** and save. Profiles are off by default.
4. For a full activity card, open **AS → Rich presence**, configure it, preview it and enable it. If configuring in Manager instead, choose **Apply profile to client**, confirm in the client, and restart the client.
5. Enable activity sharing in Discord where available. Check the activity from another account/client. Local preview is not confirmation that Discord accepted every rich field.
6. Open **AS → Command guide** or send `$help` locally. Change `$` if you configured another prefix. Unknown commands still send as ordinary chat messages.
7. After future Manager updates, prepare/install the client again so its embedded loader is upgraded too. A Manager update alone does not replace code already embedded in the client.

Keep Manager installed and preserve its app data. Clearing Manager data loses the separate client signing key; future client upgrades may then require reinstalling and losing client-local data.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| No GitHub release created | Actions log, matching tag/version, signing secrets and workflow write permission. |
| Updater says no update | Stable/latest public release, exact `Assault-Manager.apk` asset name, higher version code, configured repository and matching signing certificate. |
| Android signature conflict | Compare release signing identity. Don't regenerate keys or clear Manager data to bypass the conflict. |
| Rich presence not visible | Presence profile enabled, client restarted, activity sharing enabled, correct application/asset IDs, supported hook shown by `$status` and `$rpc status`; inspect from another client. |
| Images missing | Try a numeric asset ID. Named assets/URLs need an application ID and a compatible client asset resolver. |
| Buttons invisible on your own profile | Check from another account; client/server rendering can differ. |
| Commands appear in chat | Enable the account profile, restart, verify the prefix and use `$status` to check the message hook. |
| JSON export missing | Run `/assault action:export-json`, then **AS → Save JSON transcript**. Logout or capture clear removes cached exports. |

No GitHub publication or physical-device acceptance test was performed by preparing this ZIP. See `docs/android-validation.md` for actual checks.

For history export, install this updated Manager and prepare/install the client again. Use `/assault action:export-history`, then **AS → Save history archive**. Supply known closed DM channel IDs in the command's `query` field. Read the archive manifest for gaps and attachment download failures; see the in-app guide.


## Portal upload and GitHub sync

The portal keeps both upload and GitHub-sync controls. Writes require an administrator key configured in the **server process** as `ASSAULT_RELEASE_ADMIN_TOKEN` (at least 32 random characters). Enter the same key in the release editor. It is never included in the browser bundle or stored in browser storage. Serve this editor over HTTPS outside localhost. The editor updates portal downloads; it does not publish a GitHub release.

The server needs Python 3, Java and Android SDK build-tools **36.0.0**, with `ANDROID_HOME` pointing to the SDK. Each APK is limited to 32 MiB. Both APKs must have matching package versions/signing certificates, and Manager must embed the supplied Loader exactly. Existing release signing identity is preserved and lower Android version codes are rejected. Missing verifier tools fail the upload without changing the manifest.

Partial upload uses the currently verified counterpart; uploading a new Manager whose embedded Loader changed also requires that Loader. GitHub sync accepts a repository name and stable version tag, bounds downloads and sends any optional GitHub credential only to the GitHub API. Downloaded APKs undergo the same validation as local uploads. The portal administrator key and GitHub token are different credentials.

Stable portal URLs (`Assault-Manager.apk`, `Assault-Loader.apk`, `SHA256SUMS`) resolve through the committed manifest, so staging a new release does not expose partially switched aliases. Use the immutable URLs from `/api/releases` when pinning downloads across requests. Loader-only uploads are accepted only when the existing Manager embeds that exact Loader; a changed Loader requires its matching Manager.

The portal and Python build publisher share a `.publication.lock` directory under the release directory to prevent concurrent writers, including separate processes. Normal completion and errors release it. If a publisher is forcibly terminated, confirm no publisher is running before removing a stale lock directory and retrying. Never remove an active publisher’s lock.

For a partial upload with no explicit version, the portal uses the committed counterpart’s version. For a complete pair, it reads and validates the version from signed APK metadata. An explicitly supplied version must match the APKs.
