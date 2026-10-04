# Assault 2.11.1 in-app controls

## Enable a profile

Open **AS → Account controls**, choose a profile, save and restart the client. Or configure it in Manager, tap **Apply profile to client**, confirm in the client, and restart. Profiles are off by default. The command prefix defaults to `$`; recognized commands are local, while unknown commands and normal text continue through Discord.

**Local controls** enables prefix tools and optional own-message reactions. **Controls + custom presence** also enables presence overrides. `/assault` remains available when the account profile is off, provided the runtime is enabled. **AS → Command guide** is an offline searchable reference in both apps.

## Rich presence builder

Open **AS → Rich presence** (or Manager → Rich presence builder). An enabled card selects the presence profile. Save and restart; Manager settings additionally need applying to the client.

| Group | Fields |
| --- | --- |
| Identity | Activity name, application ID, Playing/Streaming/Listening/Watching/Competing |
| Text | Details, state, separate HTTPS links for each |
| Stream | Twitch or YouTube HTTPS stream URL, required for Streaming |
| Artwork | Large and small image asset IDs/keys/URLs, hover text, separate click URLs |
| Buttons | Up to two label + HTTPS URL pairs |
| Time | None, elapsed since client start, elapsed since local midnight, or custom start/end in Unix milliseconds |
| Party | Current and maximum size (1–9999), or both zero to disable |

Use your own Discord application ID and uploaded assets. Numeric asset IDs can be supplied directly; keys/URLs are resolved using the installed client's asset API if available. Fields are length-bounded and links require HTTPS without embedded credentials. The preview shows the local configuration; images are resolved in the runtime.

The current implementation modifies the next presence update on the client's existing gateway connection. It does not connect a second account or gateway session. Rich fields, assets and buttons may be filtered or rendered differently by Discord or a particular Android client. Enable activity sharing and check from another account. A saved/previewed card is not proof of remote visibility. The field model follows [Discord's activity schema](https://docs.discord.com/developers/events/gateway-events#activity-object).

### Presence commands

| Command | Effect |
| --- | --- |
| `$rpc status` | Report card and image-resolution availability |
| `$rpc preview` | Display the current generated activity payload locally |
| `$rpc refresh` | Request image resolution again |
| `$rpc details Working on something` | Change details for this session |
| `$rpc state Testing the app` | Change state for this session |
| `$rpc clear` / `$rpc reset` | Disable/re-enable the configured rich-card override |
| `$activity playing My game` | Set a simple session activity; also listening/watching/competing |
| `$activity clear` / `$activity reset` | Pass Discord activities through / restore the configured default |
| `$status_override idle` | online, idle, dnd or invisible on the next presence update |
| `$status_override clear` / `$status_override reset` | Pass Discord status through / restore the configured default |

Session changes do not rewrite the saved profile. Restart restores saved settings; logout/account switching pauses reactions/presence and clears dynamic presence text. `$start` resumes them explicitly.

## Local account and reaction commands

| Command | Effect |
| --- | --- |
| `$help`, `$status`, `$id` | Help, capabilities/settings, your user ID and current channel ID |
| `$prefix !` | Change the session prefix |
| `$stop`, `$start` | Pause/resume reactions and presence; local utilities remain available |
| `$react on`, `$react off` | Enable/disable reactions to your own new messages |
| `$react emoji ✅` | Set the Unicode emoji for this session |
| `$react interval 30` | Set a minimum interval of 10–300 seconds |
| `$react channels 123,456` | Limit to up to 20 channel IDs |
| `$react channels all` | Remove the channel restriction |

Permanent reaction settings are in **Account controls**. Reactions ignore other authors, deduplicate message events, obey the configured spacing and respect server retry delays. There are no retry loops or queued batches. Paused, unloaded or unavailable hooks do not send reactions.

## Message utilities

| Command | Effect |
| --- | --- |
| `$search words` | Search retained messages in the current channel |
| `$channels` | List up to 20 captured channels with counts |
| `$mentions` | Show the latest retained messages with mentions in this channel |
| `$stats` | Capture counts/budget, request counters and hook diagnostics |
| `$export html`, `$export json` | Prepare a current-channel transcript |
| `$export deleted` | Export retained deleted messages in the current channel |
| `$export all` | Prepare HTML for all captured channels |
| `$clear`, `$clear all` | Clear current-channel/all capture and cached transcripts |
| `$capture off`, `$capture on`, `$capture status` | Clear and pause capture, resume it, or inspect it |

The `/assault` actions expose these same tools without requiring a prefix profile. Use `scope:all` for search, mentions, ghost-pings and export across captured channels; the default is the current channel when available. `query` supplies search text or capture/privacy settings. Search and mention results follow expiry and author-redaction settings.

**AS → Save HTML transcript** and **AS → Save JSON transcript** use Android's document picker. Prepare the corresponding format first. Canceling the picker allows retry. Clearing capture or logging out discards cached HTML/JSON and invalidates an in-flight export; already saved files remain under your control.

Capture is limited to messages the client observed. It cannot fetch unseen/deleted history. Ghost-ping badges follow the same capture budget and expiry; retaining a deleted mention requires **Keep deleted messages**. Turning capture off clears its content. Author redaction replaces author metadata; message bodies and attachment links can still contain identifying information.

## Privacy and appearance

- **Silent typing** filters matching Discord typing requests through the supported JavaScript fetch hook, independently of analytics blocking.
- **Block analytics requests** and **Block crash-report requests** have independent settings. Native traffic or alternate network paths may not use these hooks.
- **Token protection** blocks supported outgoing text messages containing recognized Discord-token or private-key patterns. It is best-effort and does not scan attachments or recognize every possible secret. Inspect messages before sending.
- `$privacy` shows settings; use `$privacy typing on`, `$privacy analytics off`, `$privacy crashes on` or `$privacy tokens on` for session changes. Saved defaults remain in AS settings.
- Native themes, AMOLED mode, capture limits, safe mode, runtime enable/disable, floating-button placement and diagnostics remain in the native AS panel.
- The old auto-reveal-spoilers switch was removed because it had no runtime implementation. This release does not claim universal spoiler, native-network or desktop RPC compatibility.

Plugins/themes supplied by the bundled runtime remain accessible through Discord Settings → Assault. A plugin's compatibility depends on the installed Discord build. Use safe mode if a plugin prevents startup.

## Full history archive (2.11.1)

Use `/assault action:export-history` or `$export history`. This scans known client channels and pages backwards until the server returns an empty page. It does not use the 500-message capture ring. To include a closed DM that is absent from the client's stores, supply its channel ID: `$export history 123456789012345678` or `/assault action:export-history query:123456789012345678`. IDs can be separated by spaces or commas. Use IDs from saved message links or an account data package if available; the exporter cannot discover unknown closed conversations or restore access.

Use `$export status` or `/assault action:history-status` for progress. `$export cancel` or `/assault action:history-cancel` cancels and clears cached pages. Keep the app open until the scan completes. It respects client request scheduling, spaces pages and stops on authentication/rate-limit errors without a retry loop. Failed channels are reported; restarting a scan starts over.

Then choose **AS → Save history archive**. The native archive includes JSON and offline HTML message pages, the retained-session supplement, attachment files downloaded from supported Discord CDN attachment URLs, and `manifest.json`. Downloading files can take time and disk space; the preparation dialog has Cancel. **Save history archive (links only)** skips file downloads. Saving the ZIP streams pages/files and is not subject to the old 32 MiB total transcript cap; an individual page and manifest still have a 32 MiB safety limit. Download errors, unsupported URLs and expired files are listed under `attachmentDownloads`. HTML retains original attachment links; use manifest paths to locate downloaded files.

Always inspect `manifest.json`: `reached-end` means the selected channel was paginated to an empty response; `incomplete` and `not-scanned` identify gaps. `accountComplete` is always false because unknown closed DMs, undiscovered archived threads, inaccessible channels, deleted messages, and changes during the scan cannot be guaranteed. The server JSON fields are preserved, including embeds, reactions, replies, stickers and polls when returned; reaction-voter lists and previous edits are not fetched. Retained deleted messages/edits are included only in the bounded session supplement. Author redaction and attachment-link settings still apply, including to referenced messages.

`export`, `export-all` and `export-json` remain quick exports of retained session capture and now label that limitation explicitly. Logout, account switching, clear, unload and process restart invalidate history caches; save your archive before restarting. Export files already saved through Android are yours to manage.


## Browser preview versus Android controls

The portal's Automod, Fleet, Quests, Voice Lounge and Self-Defense panels remain interactive local simulations. They do not authenticate Discord accounts, join voice, claim rewards or sync their settings into the APK. Fleet tokens stay in the current tab's memory; existing persisted tokens migrate to memory while the account roster/settings remain saved. Use sample credentials for previews.

The browser notebook uses local browser storage (not encryption). It reports storage failures. Simulator exports download only the displayed simulator's messages, with explicit coverage metadata in JSON. They do not contain your Discord history. Use Android's history archive for actual account export coverage.

Native `/assault action:notes query:<text>` stores up to 100 notes of 4,000 characters in session memory; omit query to list them. Notes clear on logout, account switch or restart. Presence shortcut actions direct you to the existing native rich-presence builder and describe when changes apply.
