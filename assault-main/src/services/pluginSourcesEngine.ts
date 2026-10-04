import { PluginSource, AssaultPlugin, SoundboardItem } from '../types';

export const DEFAULT_PLUGIN_SOURCES: PluginSource[] = [
  {
    id: 'source_official',
    name: 'Official Core Repository',
    url: 'https://repo.assault.network/v3/registry.json',
    description: 'Cryptographically signed core extensions, high-efficiency gateway hooks, and telemetry blockers.',
    author: 'Core Engineering Team',
    isEnabled: true,
    isOfficial: true,
    pluginsCount: 10,
    lastSync: Date.now() - 3600000,
    status: 'ONLINE'
  },
  {
    id: 'source_community_mirror',
    name: 'Community Extensions Registry',
    url: 'https://repo.community.mods/registry.json',
    description: 'Community-maintained client extensions: Nitro emote bypass, Spotify controls, and rich media tools.',
    author: 'Community Contributors',
    isEnabled: true,
    isOfficial: false,
    pluginsCount: 16,
    lastSync: Date.now() - 7200000,
    status: 'ONLINE'
  },
  {
    id: 'source_beefbot_defense',
    name: 'Autonomous Defense Hub',
    url: 'https://beefbot.network/plugins/manifest.json',
    description: 'Automated anti-groupchat traps (AGCT), anti-spam rate limiters, toxicity neural classifiers, and raid defense.',
    author: 'Security Vanguard',
    isEnabled: true,
    isOfficial: true,
    pluginsCount: 6,
    lastSync: Date.now() - 1800000,
    status: 'ONLINE'
  },
  {
    id: 'source_mobile_addons',
    name: 'Native Mobile Extensions Hub',
    url: 'https://mobile.plugins.hub/mobile.json',
    description: 'Native mobile gesture adaptations, true AMOLED zero-black surfaces, and background presence maskers.',
    author: 'Mobile Addons Team',
    isEnabled: true,
    isOfficial: false,
    pluginsCount: 8,
    lastSync: Date.now() - 14400000,
    status: 'ONLINE'
  }
];

export const REPOSITORY_PLUGINS_CATALOG: AssaultPlugin[] = [
  {
    id: 'plugin_notrack',
    name: 'No-Track Privacy Firewall',
    description: 'Drops all outgoing Discord science, tracking, Sentry, and Meticulous analytics pings to protect user privacy.',
    version: '2.1.0',
    author: 'Privacy Vanguard',
    category: 'Privacy',
    downloads: '420.5k',
    rating: 5.0,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-8a9d10e01c...',
    scriptCode: `// Telemetry & Tracking interceptor\nassault.firewall.blockTelemetry((url) => {\n  console.log('[FIREWALL] Intercepted tracking endpoint:', url);\n  return true;\n});`
  },
  {
    id: 'plugin_messagefix',
    name: 'MessageFix & Markdown Enhanced',
    description: 'Restores original message jump links, unbreaks markdown tables, formats raw timestamps, and enhances codeblocks.',
    version: '1.9.4',
    author: 'Core Engineering Team',
    category: 'Chat',
    downloads: '315.2k',
    rating: 4.9,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-42ee91bc73...',
    scriptCode: `// Message formatting patches\nassault.patchMessageParser({\n  preserveRaw: true,\n  renderTables: true,\n  formatTimestamps: true\n});`
  },
  {
    id: 'plugin_badges',
    name: 'Custom Profile Badges System',
    description: 'Renders custom profile badge flair for certified modders, early adopters, bot masters, and contributors.',
    version: '2.0.1',
    author: 'Styling Team',
    category: 'Visual',
    downloads: '280.9k',
    rating: 4.8,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-11f8e99aa2...',
    scriptCode: `// Custom Profile Badges\nassault.badges.register({\n  contributor: { title: 'Contributor', icon: '⚡', color: '#5865F2' },\n  vanguard: { title: 'Security Vanguard', icon: '🛡️', color: '#57F287' }\n});`
  },
  {
    id: 'plugin_custom_fonts',
    name: 'Dynamic Typography Engine',
    description: 'Switch between Whitney, gg sans, Roboto, Inter, JetBrains Mono, Fira Code, and custom web fonts in real-time.',
    version: '1.6.0',
    author: 'TypeStudio',
    category: 'Visual',
    downloads: '198.4k',
    rating: 4.9,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-9a00cd421f...',
    scriptCode: `// Font Family Switcher\nassault.fonts.apply('font_whitney');`
  },
  {
    id: 'plugin_asset_browser',
    name: 'Runtime Asset Inspector',
    description: 'Inspect embedded Discord UI assets, icons, sound effects, and color tokens with live copy-to-clipboard tools.',
    version: '1.2.1',
    author: 'Developer Tools',
    category: 'Utility',
    downloads: '84.6k',
    rating: 4.7,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-72bb409ca8...',
    scriptCode: `// Asset Inspector tool\nassault.commands.register('/assets', () => assault.ui.openAssetBrowser());`
  },
  {
    id: 'plugin_crash_reporter',
    name: 'Diagnostic Crash Boundary Reporter',
    description: 'Intercepts React runtime errors, displays human-readable stack traces, culprit addon detection, and Safe Mode recovery.',
    version: '2.3.0',
    author: 'Core Engineering Team',
    category: 'Utility',
    downloads: '210.7k',
    rating: 5.0,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-62ce98b71d...',
    scriptCode: `// Error boundary interceptor\nassault.setErrorHandler((error, stack) => {\n  assault.ui.openErrorDialog(error, stack);\n});`
  },
  {
    id: 'mp_custom_soundboard',
    name: 'Voice Soundboard Synthesizer Plus',
    description: 'Play punchy sound effects directly into voice channels with live audio synthesizer and hotkey binds.',
    version: '2.4.0',
    author: 'AudioForge',
    category: 'Media',
    downloads: '142.8k',
    rating: 4.9,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-a9f8e401c2...',
    scriptCode: `// Voice Soundboard Extension\nassault.soundboard.register({\n  hotkey: 'Ctrl+Shift+S',\n  duckVoiceOnPlay: true,\n  volume: 0.8\n});`
  },
  {
    id: 'mp_read_receipt_scrubber',
    name: 'Stealth Read Receipt Scrubber',
    description: 'Drops all outgoing read-acknowledgment gateway packets and prevents typing presence leakage.',
    version: '1.9.2',
    author: 'GhostProtocol',
    category: 'Privacy',
    downloads: '210.4k',
    rating: 5.0,
    isEnabled: true,
    sourceId: 'source_official',
    sourceName: 'Official Core Repository',
    verified: true,
    checksum: 'sha256-7bb3d109f0...',
    scriptCode: `// Intercept and nullify gateway read telemetry\nassault.interceptGateway('CHANNEL_ACK', (packet) => {\n  console.log('[STEALTH] Dropped read receipt for channel', packet.channel_id);\n  return false;\n});`
  },
  {
    id: 'mp_animated_emotes',
    name: 'Nitro Animated Emotes Unlocked',
    description: 'Automatically converts custom server emojis to animated CDN links allowing non-Nitro users to post anywhere.',
    version: '3.4.1',
    author: 'ModSquad',
    category: 'Chat',
    downloads: '389.2k',
    rating: 4.9,
    isEnabled: true,
    sourceId: 'source_community_mirror',
    sourceName: 'Community Extensions Registry',
    verified: true,
    checksum: 'sha256-e41c09ab82...',
    scriptCode: `// Replace emoji tags with direct CDN image URLs\nassault.on('message_preprocess', (text) => {\n  return text.replace(/<a?:(\\w+):(\\d+)>/g, 'https://cdn.discordapp.com/emojis/$2.gif?size=64');\n});`
  },
  {
    id: 'mp_server_counter',
    name: 'Server Analytics & Ping Overlay',
    description: 'Renders real-time member counters, live voice occupants, and RTC ping latency directly into channel headers.',
    version: '1.5.0',
    author: 'UIWizard',
    category: 'Utility',
    downloads: '85.6k',
    rating: 4.8,
    isEnabled: true,
    sourceId: 'source_community_mirror',
    sourceName: 'Community Extensions Registry',
    verified: true,
    checksum: 'sha256-3fa128cd61...',
    scriptCode: `// Header telemetry hook\nassault.injectUI('channel_header', () => {\n  return { pingMs: 24, voiceCount: 4, onlineCount: 18450 };\n});`
  },
  {
    id: 'mp_toxic_auto_timeout',
    name: 'BeefBot Hyper Toxicity Classifier',
    description: 'Heuristic sentiment engine that automatically counters toxic attacks with ruthless BeefBot defense retorts.',
    version: '2.8.0',
    author: 'BeefBotTeam',
    category: 'Moderation',
    downloads: '165.1k',
    rating: 4.9,
    isEnabled: true,
    sourceId: 'source_beefbot_defense',
    sourceName: 'Autonomous Defense Hub',
    verified: true,
    checksum: 'sha256-62ce98b71d...',
    scriptCode: `// Neural toxicity scanner\nassault.on('incoming_chat', (msg) => {\n  if (beefBot.isAttack(msg.content)) {\n    beefBot.escalate(msg.author.id, msg.content);\n  }\n});`
  },
  {
    id: 'mp_spotify_sync',
    name: 'Spotify Rich Presence Controller',
    description: 'Displays current playback album art in Discord profile, with pause/skip controls and Listen Along party sync.',
    version: '2.1.3',
    author: 'MusicConnect',
    category: 'Media',
    downloads: '94.2k',
    rating: 4.7,
    isEnabled: false,
    sourceId: 'source_community_mirror',
    sourceName: 'Community Extensions Registry',
    verified: true,
    checksum: 'sha256-89cc01eef4...',
    scriptCode: `// Spotify IPC hook\nassault.connectIPC('spotify:status', (track) => {\n  assault.rpc.setActivity({ type: 'LISTENING', details: track.title });\n});`
  },
  {
    id: 'mp_agct_sentinel',
    name: 'AGCT Trapdoor Sentinel',
    description: 'Detects unauthorized additions to group direct messages (GDMs) and instantly deploys trap text before leaving.',
    version: '3.1.0',
    author: 'BeefBotTeam',
    category: 'Moderation',
    downloads: '112.5k',
    rating: 5.0,
    isEnabled: true,
    sourceId: 'source_beefbot_defense',
    sourceName: 'Autonomous Defense Hub',
    verified: true,
    checksum: 'sha256-11f8e99aa2...',
    scriptCode: `// Instant GDM defense\nassault.on('group_dm_join', (gdm) => {\n  if (!assault.defense.isWhitelisted(gdm.ownerId)) {\n    assault.sendMessage(gdm.id, assault.defense.trapMessage);\n    assault.leaveChannel(gdm.id);\n  }\n});`
  },
  {
    id: 'mp_amoled_zero',
    name: 'True AMOLED Zero Black Surface',
    description: 'Enforces pure #000000 black canvas for OLED displays, reducing battery consumption by 32% on mobile devices.',
    version: '1.2.4',
    author: 'DarkMatter',
    category: 'Utility',
    downloads: '78.9k',
    rating: 4.9,
    isEnabled: false,
    sourceId: 'source_mobile_addons',
    sourceName: 'Native Mobile Extensions Hub',
    verified: true,
    checksum: 'sha256-29ba04fae1...',
    scriptCode: `// Inject zero black CSS overrides\ndocument.documentElement.style.setProperty('--background-primary', '#000000');\ndocument.documentElement.style.setProperty('--background-secondary', '#050505');`
  }
];

export const SOUNDBOARD_PRESETS: SoundboardItem[] = [
  { id: 'sb_airhorn', name: 'DJ Airhorn', emoji: '📢', category: 'Memes', duration: '1.2s', soundType: 'airhorn' },
  { id: 'sb_badumtss', name: 'Ba-Dum-Tss', emoji: '🥁', category: 'Sound FX', duration: '1.0s', soundType: 'badumtss' },
  { id: 'sb_quack', name: 'Duck Quack', emoji: '🦆', category: 'Memes', duration: '0.8s', soundType: 'quack' },
  { id: 'sb_discord_join', name: 'User Joined', emoji: '🟢', category: 'Discord Classic', duration: '0.8s', soundType: 'discord_join' },
  { id: 'sb_discord_leave', name: 'User Left', emoji: '🔴', category: 'Discord Classic', duration: '0.8s', soundType: 'discord_leave' },
  { id: 'sb_cricket', name: 'Crickets Chirping', emoji: '🦗', category: 'Memes', duration: '1.5s', soundType: 'cricket' },
  { id: 'sb_victory', name: '8-Bit Victory', emoji: '🏆', category: 'Sound FX', duration: '1.2s', soundType: 'victory' },
  { id: 'sb_bruh', name: 'Bruh Moment', emoji: '🗿', category: 'Memes', duration: '0.9s', soundType: 'bruh' },
  { id: 'sb_laser', name: 'Sci-Fi Laser', emoji: '⚡', category: 'Sound FX', duration: '0.6s', soundType: 'laser' }
];

export class PluginSourcesEngine {
  private sources: PluginSource[] = [...DEFAULT_PLUGIN_SOURCES];
  private catalog: AssaultPlugin[] = [...REPOSITORY_PLUGINS_CATALOG];

  public getSources(): PluginSource[] {
    return [...this.sources];
  }

  public getCatalog(): AssaultPlugin[] {
    return [...this.catalog];
  }

  public addSource(name: string, url: string, description = ''): PluginSource {
    const cleanUrl = url.trim();
    const newSource: PluginSource = {
      id: `source_custom_${Date.now()}`,
      name: name.trim() || 'Custom Extensions Repository',
      url: cleanUrl,
      description: description || 'User-added external extension source mirror',
      author: 'Community Contributor',
      isEnabled: true,
      isOfficial: false,
      pluginsCount: Math.floor(Math.random() * 8) + 3,
      lastSync: Date.now(),
      status: 'ONLINE'
    };
    this.sources.push(newSource);
    return newSource;
  }

  public toggleSource(sourceId: string): void {
    this.sources = this.sources.map((s) =>
      s.id === sourceId ? { ...s, isEnabled: !s.isEnabled } : s
    );
  }

  public removeSource(sourceId: string): void {
    this.sources = this.sources.filter((s) => s.id !== sourceId);
  }

  public syncSource(sourceId: string): void {
    this.sources = this.sources.map((s) => {
      if (s.id === sourceId) {
        return {
          ...s,
          lastSync: Date.now(),
          status: 'ONLINE'
        };
      }
      return s;
    });
  }
}

export const pluginSourcesEngine = new PluginSourcesEngine();
