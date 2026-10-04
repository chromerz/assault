# Assault 2.11.2

## Audit fixes

- Restored npm lockfile, executable Gradle launcher, and consistent workflow version defaults.
- Protected portal release editing with administrator authentication; validate uploaded/synced APK identities, versions, signatures and embedded Loader before switching downloads.
- Bound GitHub download sizes/time and restrict redirects; prevent tokens from reaching CDN requests.
- Validate saved Automod and automation settings, preserve independent defaults and keep fleet credentials in tab memory.
- Preserve all simulator panels; label local voice/fleet/quest actions accurately. Browser exports now download real simulator transcripts; notes persist in browser storage.
- Publication rollback preserves stable download files on failure; loader verification bounds decompression and startup error reporting tolerates missing native device info.
- Native notes now accept query text and retain session notes; capability commands report actual support.

## Features & Enhancements

- **Automod & Shield browser preview**: Local phishing/keyword filtering and auto-reply settings. Browser configuration does not install native anti-raid or mention-spam hooks.
- **Battery Optimization & System Resources**: Retained browser preview controls; displayed resource figures are illustrative.
- **Mods & Customization Studio**: Retained browser styling and control previews, separate from native Android settings.
- Bumped Android version code to `211002` and version name to `2.11.2`.

# Assault 2.11.1

## In-app expansion

- Native rich-presence builder in Manager and the client: application/name/type, details/state and links, streaming URL, large/small artwork and hover/click text, two buttons, timestamp modes, party size, local preview and configuration copying.
- Session `$rpc` commands for preview, status, image refresh, details/state and clear/reset. Uses the existing gateway connection; asset hooks and remote field visibility vary by Discord build.
- Searchable offline command guide in both apps.
- Local search, captured-channel list, mention list, capture pause/resume, privacy toggles, export and cleanup commands.
- Own-message reactions with saved/session emoji, 10–300-second minimum interval and up to 20 allowed channel IDs.
- Correct presence clear/reset behavior and capability diagnostics. Account switching pauses automation and resets dynamic presence text.

## Repairs

- Native silent-typing, token-protection and ghost-ping settings now reach the runtime.
- Typing, analytics and crash-report filters operate independently; typing matching is restricted to Discord endpoints.
- Outgoing text guard recognizes common Discord-token/private-key patterns and blocks the message without logging its contents. Detection is best-effort.
- Native JSON transcript saving joins HTML saving through Android's document picker.
- HTML/JSON exports share cancellation/clear/logout handling. Ghost-ping data follows capture expiry, channel clearing and memory bounds.
- Search is scoped and follows expiry/redaction. Removed the unimplemented spoiler toggle.
- Corrupt preparation metadata now consistently asks the user to prepare again.

## Release delivery

- Signed Manager and embedded Loader 2.11.1 / Android version code 211001.
- Source, APKs, checksums, usage guide and detailed GitHub publishing instructions are packaged together.
- Keep the original Manager release signing key for compatible updates and preserve Manager app data for the separate patched-client signing key.

See `docs/in-app-controls.md` for commands and limits, `docs/publish-your-release.md` for publication and installation, and `docs/android-validation.md` for observed validation. Native installation and remote rich-presence visibility require device acceptance testing.

### 2.11.1 history export correction

- Added a disk-backed history archive that pages through known accessible channels and supplied closed DM IDs, independently of session capture limits.
- Preserves complete returned message fields in JSON, with offline HTML pages and optional attachment downloads.
- Added per-channel completion/failure reporting, cancellation and logout/account-switch cache invalidation.
- Quick session exports now explicitly identify their limited coverage. Unknown closed DMs and inaccessible/deleted server data cannot be guaranteed.
- Live account history retrieval and Android archive picker still require device acceptance testing.
