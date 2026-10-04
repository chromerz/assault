export type UserStatus = 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE' | 'online' | 'idle' | 'dnd' | 'offline';

export interface DiscordBadgeItem {
  id: string;
  title: string;
  iconLabel: string;
  colorHex: string;
}

export type DiscordBadge = DiscordBadgeItem | string;

export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  globalName?: string;
  avatarUrl: string;
  avatar?: string;
  bannerUrl?: string;
  bannerColor?: string;
  bio?: string;
  pronouns?: string;
  createdAt?: string;
  isBot?: boolean;
  status: UserStatus;
  customStatus?: string;
  badges: (DiscordBadgeItem | string)[];
  roleColor?: string;
  avatarDecoration?: string;
  profileEffect?: string;
  nitroType?: 'NONE' | 'NITRO_BASIC' | 'NITRO';
  nitroExpireDate?: string;
  orbsBalance?: number;
  serverBoostsCount?: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  iconUrl: string;
  bannerUrl?: string;
  channelsCount?: number;
  description: string;
  memberCount: number;
  ownerId: string;
  unreadCount: number;
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string;
  unread: boolean;
  mentions: number;
  memberCount: number;
  onlineCount: number;
  boostLevel: number;
  boostCount: number;
  channels: DiscordChannel[];
}

export type ChannelType = 'GUILD_TEXT' | 'DM' | 'GUILD_VOICE' | 'GROUP_DM' | 'GUILD_CATEGORY' | 'GUILD_ANNOUNCEMENT' | 'text' | 'voice' | 'announcement' | 'forum' | 'dm';

export interface DiscordChannel {
  id: string;
  guildId?: string | null;
  name: string;
  type: ChannelType;
  category?: string;
  parentId?: string | null;
  position?: number;
  topic?: string;
  unreadCount?: number;
  isHiddenOrLocked?: boolean;
  connectedUsers?: DiscordUser[];
  recipient?: any;
}

export interface ReactionItem {
  emoji: string;
  count: number;
  userReacted?: boolean;
  me?: boolean;
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  author: DiscordUser;
  content: string;
  timestamp: number | string;
  isEdited?: boolean;
  editHistory?: string[];
  isDeleted?: boolean;
  deletedTimestamp?: number;
  attachments?: (string | any)[];
  reactions?: (ReactionItem | any)[];
  replyToMessageId?: string | null;
  replyAuthorName?: string | null;
  replySnippet?: string | null;
  isPinned?: boolean;
}

export type AssaultThemeMode = 'AMOLED_BLACK' | 'DISCORD_DARK' | 'MIDNIGHT_PURPLE' | 'CYBER_NEON';

export interface SpoofPlatformItem {
  id: string;
  label: string;
  icon: string;
  os: string;
  browser: string;
  device: string;
}

export interface DiscordQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  isEnrolled: boolean;
  isCompleted: boolean;
  isClaimed: boolean;
  rewardName: string;
  iconUrl: string;
}

export interface DeletedSnipe {
  id: string;
  channelId: string;
  channelName: string;
  authorName: string;
  authorId: string;
  content: string;
  timestamp: number;
  attachments?: string[];
}

export interface EditSnipe {
  id: string;
  channelId: string;
  channelName: string;
  authorName: string;
  authorId: string;
  oldContent: string;
  newContent: string;
  timestamp: number;
}

export interface FleetBot {
  id: string;
  username: string;
  avatarUrl: string;
  isMaster: boolean;
  isConnected: boolean;
  voiceChannelName: string | null;
  pingMs: number;
}

export interface DefenseSettings {
  agctEnabled: boolean;
  trapMessage: string;
  whitelist: string[];
  antiAfkEnabled: boolean;
  afkCheckCount: number;
  lastAfkResponse?: string | null;
  autoReactEnabled: boolean;
  reactTargetId: string;
  reactEmojis: string[];
  silencedUserIds: string[];
  normalWpmMin: number;
  normalWpmMax: number;
  typoChance: number;
}

export interface AssaultSettings {
  antiDelete: boolean;
  antiEdit: boolean;
  silentTyping: boolean;
  ghostRead: boolean;
  compactMode: boolean;
  nitroEmoteBypass: boolean;
  showHiddenChannels: boolean;
  blockedAnalyticsCount: number;
  activeTheme: AssaultThemeMode;
  customAccentColor: string;
  activePlatform: string;
  immediateMobilePush: boolean;
  forceIdle: boolean;
  customRpcTitle: string;
  customCss: string;
  enableCustomCss: boolean;
}

export interface PluginSource {
  id: string;
  name: string;
  url: string;
  description: string;
  author: string;
  isEnabled: boolean;
  isOfficial?: boolean;
  pluginsCount: number;
  lastSync: number;
  status: 'ONLINE' | 'SYNCING' | 'OFFLINE';
}

export interface SoundboardItem {
  id: string;
  name: string;
  emoji: string;
  category: 'Memes' | 'Sound FX' | 'Voice' | 'Discord Classic';
  duration: string;
  soundType: 'airhorn' | 'quack' | 'badumtss' | 'discord_join' | 'discord_leave' | 'cricket' | 'victory' | 'bruh' | 'laser';
}

export interface ClientBuildInfo {
  installedVersion: string;
  latestVersion: string;
  buildChannel: 'stable' | 'beta' | 'nightly' | string;
  discordBaseVersion: string;
  commitHash: string;
  architecture: string;
  isPatched: boolean;
  rootMode: 'root' | 'non-root' | 'root-mount' | string;
  lastChecked: string;
  downloadUrl: string;
  releaseNotes: string[];
}

export interface AssaultPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  isEnabled: boolean;
  enabled?: boolean;
  category: string;
  scriptCode?: string;
  sourceId?: string;
  sourceName?: string;
  verified?: boolean;
  checksum?: string;
  downloads?: string;
  rating?: number;
}

export interface SavedAccount {
  id: string;
  username: string;
  token: string;
  isBot: boolean;
  avatarUrl: string;
  isActive: boolean;
}

export type BeefEscalationLevel = 'CHILL' | 'MILD' | 'RUTHLESS';

export interface CustomCommand {
  id: string;
  trigger: string;
  response: string;
  isEnabled: boolean;
  permissionLevel: string;
  usageCount: number;
}

export interface BeefIncident {
  id: string;
  timestamp: number;
  targetUser: string;
  ruleTriggered: string;
  actionTaken: string;
}

export interface BeefBotConfig {
  isEnabled: boolean;
  enabled?: boolean;
  commandPrefix: string;
  antiSpamEnabled: boolean;
  maxMessagesPer3Sec: number;
  antiMassMentionEnabled: boolean;
  maxMentionsAllowed: number;
  antiInviteLinksEnabled: boolean;
  antiToxicFilterEnabled: boolean;
  antiCapsShieldEnabled: boolean;
  autoRaidQuarantineEnabled: boolean;
  autoRoastBeefMode: boolean;
  escalationLevel: BeefEscalationLevel;
  customCommands: CustomCommand[];
  incidents: BeefIncident[];
  totalViolationsBlocked: number;
}

export interface BeefBotLiveState {
  active: boolean;
  targetUser: string | null;
  targetUserId: string | null;
  pingChance: number;
  capsMode: boolean;
  triggerEnabled: boolean;
  afkEnabled: boolean;
  inAfkSequence: boolean;
  afkTriggered: boolean;
  rateLimited: boolean;
  currentWpm: number;
  targetAfkCheckCount: number;
  lastMsgTime: number;
  prefix: string;
  botReaction: string | null;
  reactTargets: Record<string, string>;
  gcWhitelist: string[];
  userWhitelist: string[];
  gcTrapMessage: string;
  normalWpmMin: number;
  normalWpmMax: number;
  slowWpm: number;
  typoChance: number;
  typoWordsMin: number;
  typoWordsMax: number;
  typoLettersPerWord: number;
  jokeCount: number;
  uptimeSeconds: number;
}

export interface BeefBotTerminalLine {
  id: number;
  sender: string;
  text: string;
  isSystem: boolean;
  isCommand: boolean;
  timestamp: number;
}

export type ShortcutAction =
  | 'TOGGLE_MUTE'
  | 'TOGGLE_DEAFEN'
  | 'TOGGLE_SCREEN_SHARE'
  | 'NEXT_SERVER'
  | 'PREVIOUS_SERVER'
  | 'BATCH_DELETE_MODE'
  | 'PERFORMANCE_MONITOR'
  | 'TOGGLE_BEEFBOT'
  | 'TOGGLE_SILENT_TYPING';

export interface CustomKeyShortcut {
  action: ShortcutAction;
  modifierCtrl: boolean;
  modifierAlt: boolean;
  modifierShift: boolean;
  keyChar: string;
  label: string;
  category: string;
}

export type PatchStatus =
  | 'IDLE'
  | 'FETCHING_UPSTREAM'
  | 'DOWNLOADING_BASE_APK'
  | 'UNPACKING_RESOURCES'
  | 'INJECTING_CORE_ENGINE'
  | 'INJECTING_BEEFBOT'
  | 'REPACKING_APK'
  | 'SIGNING_APK'
  | 'INSTALL_READY'
  | 'FAILED';

export interface DiscordBuildRelease {
  version: string;
  buildNumber: number;
  releaseDate: string;
  channel: string;
  downloadUrl: string;
  isRecommended?: boolean;
  isInstalled?: boolean;
}

export interface GitHubReleaseAsset {
  name: string;
  downloadUrl: string;
  sizeMb: number;
  isApk: boolean;
}

export interface GitHubRelease {
  tagName: string;
  title: string;
  publishedDate: string;
  isLatest: boolean;
  changelog: string;
  assets: GitHubReleaseAsset[];
}

export interface ClientManagerLiveState {
  currentInstalledVersion: string;
  currentInstalledBuild: number;
  latestUpstreamVersion: string;
  latestUpstreamBuild: number;
  patchStatus: PatchStatus;
  patchProgress: number;
  patchStatusMessage: string;
  selectedChannel: string;
  autoUpdateCheck: boolean;
  injectBeefBotDaemon: boolean;
  injectCssThemeEngine: boolean;
  bypassAnalyticsAndTelemetry: boolean;
  unlockExperimentalBadges: boolean;
  gitHubRepo: string;
  isFetchingGitHub: boolean;
  isDownloadingGitHubAsset: boolean;
  gitHubDownloadProgress: number;
  gitHubStatusMessage: string;
  lastInstalledGitHubRelease: string | null;
  gitHubReleases: GitHubRelease[];
  availableReleases: DiscordBuildRelease[];
  managerLogs: string[];
}

export interface DiscordCollectableItem {
  id: string;
  name: string;
  category: 'AVATAR_DECORATION' | 'PROFILE_EFFECT' | 'BUNDLE';
  collection: string;
  priceUSD: number;
  nitroDiscountUSD?: number;
  orbsPrice?: number;
  previewUrl: string;
  assetUrl: string;
  description: string;
  isPurchased?: boolean;
  isEquipped?: boolean;
  isInWishlist?: boolean;
}

export interface DiscordBillingPlan {
  id: string;
  name: string;
  tier: 'BASIC' | 'NITRO' | 'BOOST' | 'ANNUAL';
  price: string;
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
}

export interface DiscordPaymentMethod {
  id: string;
  brand: 'VISA' | 'MASTERCARD' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY';
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface DiscordGiftItem {
  id: string;
  code: string;
  planName: string;
  recipientName?: string;
  createdAt: number;
  isClaimed: boolean;
  claimedBy?: string;
  giftCardTheme: string;
}

export interface DiscordInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  status: 'PAID' | 'REFUNDED';
  paymentMethod: string;
}

export type StepStateStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR' | 'SKIPPED';
export type StepGroupCategory = 'PREPARE' | 'DOWNLOAD' | 'PATCH' | 'INSTALL' | 'CLEANUP';

export interface PatcherStepItem {
  id: string;
  label: string;
  detail: string;
  category: StepGroupCategory;
  durationMs: number;
  status: StepStateStatus;
  progressPercent: number;
  outputLog?: string;
}

export interface PatcherStepGroup {
  id: StepGroupCategory;
  name: string;
  description: string;
  steps: PatcherStepItem[];
  isExpanded?: boolean;
}

export type IconShapeType = 'rounded' | 'squircle' | 'circle' | 'teardrop' | 'classic';

export interface CustomIconConfig {
  shape: IconShapeType;
  primaryColor: string;
  backgroundColor: string;
  monochrome: boolean;
  opacity: number;
  presetId?: string;
  hasCustomBadge: boolean;
  badgeLabel?: string;
}

export interface PatcherConfig {
  targetPackageName: string;
  customAppName: string;
  installMode: 'direct_download' | 'local_pm' | 'root_mount' | 'shizuku';
  baseBuildVersion: string;
  componentVersions: {
    hookCore: string;
    dexBridge: string;
    smaliSet: string;
    injector: string;
  };
  options: {
    antiDelete: boolean;
    antiEdit: boolean;
    noTrackFirewall: boolean;
    silentTyping: boolean;
    ghostRead: boolean;
    bypassSecurityConfig: boolean;
    debuggableManifest: boolean;
    nitroEmoteBypass: boolean;
    unlockExperiments: boolean;
    reorganizeDex: boolean;
    amoledTheme: boolean;
    enableCustomCss: boolean;
    customFontInjection: boolean;
  };
  iconConfig: CustomIconConfig;
  signingMode: 'debug_auto' | 'custom_keystore';
}

export interface PatcherBuildOutput {
  buildId: string;
  apkName: string;
  downloadUrl: string;
  sizeMb: number;
  sha256: string;
  packageName: string;
  versionName: string;
  builtAt: string;
  appliedPatches: string[];
}

export interface CustomFontItem {
  id: string;
  name: string;
  family: string;
  category: 'Serif' | 'Sans-Serif' | 'Monospace' | 'Display' | 'Handwriting';
  sourceUrl?: string;
  previewText: string;
  isBuiltin: boolean;
  author: string;
}

export interface ErrorStackFrame {
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface DiagnosticErrorReport {
  id: string;
  timestamp: number;
  message: string;
  componentStack?: string;
  stackFrames: ErrorStackFrame[];
  culpritAddon?: string | null;
  safeModeOffered: boolean;
  deviceInfo: {
    platform: string;
    userAgent: string;
    screenResolution: string;
    memoryMb?: number;
  };
}

export interface AddonAssetItem {
  id: string;
  name: string;
  category: 'icon' | 'audio' | 'image' | 'font' | 'module';
  sizeBytes: number;
  previewUrl: string;
  description: string;
}


