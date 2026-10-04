import {
  DiscordUser,
  DiscordGuild,
  DiscordChannel,
  DiscordMessage,
  DiscordQuest,
  DeletedSnipe,
  EditSnipe,
  FleetBot,
  DefenseSettings,
  AssaultSettings,
  AssaultPlugin,
  SavedAccount,
  BeefBotConfig,
  CustomKeyShortcut,
  SpoofPlatformItem
} from '../types';

export const SPOOF_PLATFORMS: SpoofPlatformItem[] = [
  {
    id: 'VR',
    label: 'Meta Quest VR (Green Headset)',
    icon: '🥽',
    os: 'android',
    browser: 'Discord VR',
    device: 'Quest 2'
  },
  {
    id: 'IOS',
    label: 'iOS (iPhone 16 Pro)',
    icon: '🍏',
    os: 'iOS',
    browser: 'Discord iOS',
    device: 'iPhone16,2'
  },
  {
    id: 'ANDROID',
    label: 'Android (Pixel 8)',
    icon: '📱',
    os: 'Android',
    browser: 'Discord Android',
    device: 'Pixel 8'
  },
  {
    id: 'DESKTOP',
    label: 'Windows Desktop App',
    icon: '💻',
    os: 'Windows',
    browser: 'Discord Client',
    device: 'PC'
  },
  {
    id: 'WEB',
    label: 'Chrome Web Browser',
    icon: '🌐',
    os: 'Windows',
    browser: 'Chrome',
    device: 'Browser'
  },
  {
    id: 'PS5',
    label: 'PlayStation 5 Console',
    icon: '🎮',
    os: 'Console',
    browser: 'Discord Embedded',
    device: 'PlayStation 5'
  },
  {
    id: 'XBOX',
    label: 'Xbox Series X',
    icon: '🎮',
    os: 'Console',
    browser: 'Discord Embedded',
    device: 'Xbox Series X'
  }
];

export const INITIAL_USER: DiscordUser = {
  id: 'user_me_d',
  username: 'hypercharacterization',
  discriminator: '0',
  globalName: 'd',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
  bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop',
  bio: 'a month ago',
  badges: [
    { id: 'maple', title: 'Maple Leaf', iconLabel: '🍁!', colorHex: '#e03e3e' },
    { id: 'nitro', title: 'Nitro Subscriber', iconLabel: '▲', colorHex: '#f47fff' }
  ],
  status: 'IDLE',
  customStatus: '+ Best dad joke?',
  roleColor: '#ffffff'
};

export const INITIAL_GUILDS: DiscordGuild[] = [
  {
    id: 'guild_block_party',
    name: '@ block party',
    iconUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop',
    description: 'block party community & music',
    memberCount: 2840,
    ownerId: 'user_me_d',
    unreadCount: 0
  },
  {
    id: 'guild_goth_girl',
    name: 'nightclub / archive',
    iconUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop',
    description: 'aesthetic archive and late night lounge',
    memberCount: 14200,
    ownerId: 'user_dev_01',
    unreadCount: 1
  },
  {
    id: 'guild_streetwear',
    name: 'skate & kicks',
    iconUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=150&auto=format&fit=crop',
    description: 'fashion, drops, and marketplace',
    memberCount: 8900,
    ownerId: 'user_gamer_99',
    unreadCount: 0
  },
  {
    id: 'guild_plushies',
    name: 'cozy hangout',
    iconUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop',
    description: 'chill vibes, music, and wholesome friends',
    memberCount: 6300,
    ownerId: 'user_global',
    unreadCount: 3
  },
  {
    id: 'guild_cyber_sun',
    name: 'solar / engineering',
    iconUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop',
    description: 'reverse engineering, low level protocols, and tooling',
    memberCount: 31200,
    ownerId: 'user_me_d',
    unreadCount: 0
  }
];

export const INITIAL_CHANNELS: DiscordChannel[] = [
  {
    id: 'ch_xx',
    guildId: 'guild_block_party',
    name: 'x_x',
    type: 'GUILD_TEXT',
    topic: 'private locked room',
    isHiddenOrLocked: true,
    unreadCount: 0
  },
  // Category: the times
  {
    id: 'ch_tos',
    guildId: 'guild_block_party',
    name: 'tos',
    category: 'the times',
    type: 'GUILD_TEXT',
    topic: 'server rules and community guidelines',
    unreadCount: 0
  },
  {
    id: 'ch_annc',
    guildId: 'guild_block_party',
    name: 'annc',
    category: 'the times',
    type: 'GUILD_ANNOUNCEMENT',
    topic: 'block party official announcements & drops',
    unreadCount: 0
  },
  {
    id: 'ch_bst',
    guildId: 'guild_block_party',
    name: 'bst',
    category: 'the times',
    type: 'GUILD_TEXT',
    topic: 'buy / sell / trade listings',
    unreadCount: 0
  },
  // Category: @ the blvd
  {
    id: 'ch_blvd',
    guildId: 'guild_block_party',
    name: 'blvd',
    category: '@ the blvd',
    type: 'GUILD_TEXT',
    topic: 'boulevard main chat lounge',
    unreadCount: 0
  },
  {
    id: 'ch_imsg',
    guildId: 'guild_block_party',
    name: 'imsg',
    category: '@ the blvd',
    type: 'GUILD_TEXT',
    topic: 'imsg text lounge • media and stickers active',
    unreadCount: 0
  },
  {
    id: 'ch_cmd',
    guildId: 'guild_block_party',
    name: 'cmd',
    category: '@ the blvd',
    type: 'GUILD_TEXT',
    topic: 'bot commands, BeefBot and soundboard triggers',
    unreadCount: 0
  },
  // Category: fame
  {
    id: 'ch_verify',
    guildId: 'guild_block_party',
    name: 'verify',
    category: 'fame',
    type: 'GUILD_TEXT',
    topic: 'member verification gate',
    unreadCount: 0
  },
  {
    id: 'ch_male',
    guildId: 'guild_block_party',
    name: 'male',
    category: 'fame',
    type: 'GUILD_TEXT',
    topic: 'roles & identity',
    unreadCount: 0
  },
  {
    id: 'ch_female',
    guildId: 'guild_block_party',
    name: 'female',
    category: 'fame',
    type: 'GUILD_TEXT',
    topic: 'roles & identity',
    unreadCount: 0
  },
  // Category: the park
  {
    id: 'ch_menu',
    guildId: 'guild_block_party',
    name: 'menu',
    category: 'the park',
    type: 'GUILD_TEXT',
    topic: 'park food & drink menu',
    unreadCount: 0
  },
  {
    id: 'ch_j2c',
    guildId: 'guild_block_party',
    name: 'j2c',
    category: 'the park',
    type: 'GUILD_VOICE',
    topic: 'join to create voice lounge',
    connectedUsers: [
      {
        id: 'u10',
        username: 'hypercharacterization',
        globalName: 'd',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
        status: 'IDLE',
        badges: []
      }
    ]
  },
  // Legacy / fallback channels
  {
    id: 'ch_general',
    guildId: 'guild_block_party',
    name: 'general-chat',
    type: 'GUILD_TEXT',
    topic: 'General discussion',
    unreadCount: 0
  },
  // Direct Messages matching screenshots
  {
    id: 'dm_rep',
    guildId: null,
    name: 'rep',
    type: 'DM',
    topic: 'Direct message with rep',
    unreadCount: 0
  },
  {
    id: 'dm_blod',
    guildId: null,
    name: 'blod',
    type: 'DM',
    topic: 'Direct message with blod',
    unreadCount: 0
  },
  {
    id: 'dm_winterlosers',
    guildId: null,
    name: ':3',
    type: 'DM',
    topic: 'Direct message with winterlosers',
    unreadCount: 0
  },
  {
    id: 'dm_rick_owens',
    guildId: null,
    name: 'rick owens',
    type: 'DM',
    topic: 'Direct message with rick owens',
    unreadCount: 0
  },
  {
    id: 'dm_x',
    guildId: null,
    name: 'x',
    type: 'DM',
    topic: 'Direct message with x',
    unreadCount: 0
  },
  {
    id: 'dm_solange',
    guildId: null,
    name: 'solange',
    type: 'DM',
    topic: 'Direct message with solange',
    unreadCount: 0
  },
  {
    id: 'dm_mel',
    guildId: null,
    name: 'mel 🍁🗡️',
    type: 'DM',
    topic: 'Direct message with mel',
    unreadCount: 0
  },
  {
    id: 'dm_xssault',
    guildId: null,
    name: 'xssault',
    type: 'DM',
    topic: 'Direct message with xssault',
    unreadCount: 0
  }
];

export const INITIAL_MESSAGES: DiscordMessage[] = [
  {
    id: 'msg_imsg_1',
    channelId: 'ch_imsg',
    author: {
      id: 'u_rep',
      username: 'rep',
      globalName: 'rep',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      badges: [],
      status: 'OFFLINE'
    },
    content: 'mr?\nor boost',
    timestamp: Date.now() - 7200000
  },
  {
    id: 'msg_imsg_2',
    channelId: 'ch_imsg',
    author: {
      id: 'u_sadface',
      username: ';(',
      globalName: ';(',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop',
      badges: [{ id: 'b1', title: 'Member', iconLabel: '👤', colorHex: '#5865f2' }],
      status: 'ONLINE'
    },
    content: 'but\ni dont want to\ngive me pic perms',
    timestamp: Date.now() - 5400000
  },
  {
    id: 'msg_imsg_3',
    channelId: 'ch_imsg',
    author: {
      id: 'user_me_d',
      username: 'd',
      globalName: 'd 🍁🗡️',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
      badges: [{ id: 'nitro', title: 'Nitro Subscriber', iconLabel: '▲', colorHex: '#f47fff' }],
      status: 'IDLE'
    },
    content: '🐰 [Pink bunny desk sticker]',
    timestamp: Date.now() - 4800000
  },
  {
    id: 'msg_imsg_4',
    channelId: 'ch_imsg',
    author: {
      id: 'u_catboy',
      username: 'catboy tears',
      globalName: 'catboy tears 🥀',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
      badges: [],
      status: 'OFFLINE'
    },
    content: 'rep',
    timestamp: Date.now() - 4200000
  },
  {
    id: 'msg_imsg_5',
    channelId: 'ch_imsg',
    author: {
      id: 'u_geo',
      username: 'Geo',
      globalName: 'Geo 🍂',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
      badges: [],
      status: 'ONLINE'
    },
    content: '🥣 [Fruit loops cereal picture]',
    timestamp: Date.now() - 1800000
  },
  // Direct Messages with rep matching Screenshot 2
  {
    id: 'msg_dm_rep_1',
    channelId: 'dm_rep',
    author: {
      id: 'user_me_d',
      username: 'd',
      globalName: 'd 🍁🗡️',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
      badges: [],
      status: 'IDLE'
    },
    content: '😭😭😭',
    timestamp: Date.now() - 600000
  },
  {
    id: 'msg_dm_rep_2',
    channelId: 'dm_rep',
    author: {
      id: 'u_rep',
      username: 'rep',
      globalName: 'rep',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      badges: [],
      status: 'OFFLINE'
    },
    content: 'so\nwhat were u doing while i was sleeping',
    timestamp: Date.now() - 300000
  },
  {
    id: 'msg_dm_rep_3',
    channelId: 'dm_rep',
    author: {
      id: 'user_me_d',
      username: 'd',
      globalName: 'd 🍁🗡️',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
      badges: [],
      status: 'IDLE'
    },
    content: 'on the game\nsob',
    timestamp: Date.now() - 120000
  },
  {
    id: 'msg_1',
    channelId: 'ch_general',
    author: {
      id: 'u_admin',
      username: 'ServerAdmin',
      globalName: 'Server Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
      badges: [
        { id: 'staff', title: 'Discord Staff', iconLabel: '🛡️', colorHex: '#5865f2' },
        { id: 'active_dev', title: 'Active Developer', iconLabel: '⚡', colorHex: '#00d26a' }
      ],
      roleColor: '#5865f2',
      status: 'ONLINE'
    },
    content:
      'Welcome to the server! Real-time gateway active with custom CSS themes, BeefBot moderation, and low-latency audio.',
    timestamp: Date.now() - 3600000 * 2,
    reactions: [
      { emoji: '🔥', count: 12, userReacted: true },
      { emoji: '⚡', count: 8, userReacted: false }
    ]
  },
  {
    id: 'msg_2',
    channelId: 'ch_general',
    author: {
      id: 'u_mod',
      username: 'BeefBot',
      globalName: 'BeefBot AutoMod',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop',
      isBot: true,
      badges: [{ id: 'bot', title: 'Verified Bot', iconLabel: '⚙️', colorHex: '#5865f2' }],
      roleColor: '#23a55a',
      status: 'ONLINE'
    },
    content:
      '🛡️ BeefBot AutoMod is ACTIVE. Raid Shield: ON | Anti-Spam: ON | Mass Mention Limit: 3 | Prefix: $',
    timestamp: Date.now() - 3600000,
    reactions: [{ emoji: '🥩', count: 19, userReacted: true }]
  },
  {
    id: 'msg_3',
    channelId: 'ch_general',
    author: {
      id: 'u_coder',
      username: 'QuantumCoder',
      globalName: 'Quantum Coder',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
      badges: [{ id: 'nitro', title: 'Nitro Booster', iconLabel: '💎', colorHex: '#eb459e' }],
      roleColor: '#f43f5e',
      status: 'ONLINE'
    },
    content: 'Client is running at 120 FPS with minimal RAM usage. Testing the custom CSS injection engine right now!',
    timestamp: Date.now() - 1800000,
    isEdited: true,
    editHistory: [
      'Client is running with normal RAM usage.',
      'Client is running at 120 FPS with minimal RAM usage. Testing the custom CSS injection engine right now!'
    ],
    reactions: [{ emoji: '🚀', count: 5, userReacted: true }]
  },
  {
    id: 'msg_4',
    channelId: 'ch_general',
    author: {
      id: 'u_sneaky',
      username: 'SneakyUser',
      globalName: 'Sneaky User',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      badges: [],
      status: 'IDLE'
    },
    content:
      "Wait, don't screenshot this, I am going to delete it right now!! (Testing Assault Anti-Delete protection)",
    timestamp: Date.now() - 900000,
    isDeleted: true,
    deletedTimestamp: Date.now() - 600000,
    reactions: [{ emoji: '👀', count: 3, userReacted: false }]
  },
  {
    id: 'msg_5',
    channelId: 'ch_general',
    author: {
      id: 'user_me_9981',
      username: 'AssaultOperator',
      globalName: 'Assault Operator',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
      badges: [
        { id: 'staff', title: 'Discord Staff', iconLabel: '🛡️', colorHex: '#5865f2' },
        { id: 'nitro', title: 'Nitro Booster', iconLabel: '💎', colorHex: '#eb459e' },
        { id: 'active_dev', title: 'Active Developer', iconLabel: '⚡', colorHex: '#00d26a' }
      ],
      roleColor: '#5865f2',
      status: 'ONLINE'
    },
    content:
      'Anti-Delete caught it instantly! Retained safely in our local encrypted SQLite vault for forensic review.',
    timestamp: Date.now() - 400000,
    replyToMessageId: 'msg_4',
    replyAuthorName: 'Sneaky User',
    replySnippet: "Wait, don't screenshot this, I am going to delete it...",
    reactions: [{ emoji: '🛡️', count: 7, userReacted: true }]
  }
];

export const INITIAL_QUESTS: DiscordQuest[] = [
  {
    id: 'quest_warthunder',
    title: 'War Thunder Ground Forces',
    description: 'Play 15 minutes on desktop or stream to friends',
    progress: 15,
    target: 15,
    isEnrolled: true,
    isCompleted: true,
    isClaimed: false,
    rewardName: 'Vehicle Decal + 3 Days Premium',
    iconUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop'
  },
  {
    id: 'quest_genshin',
    title: 'Genshin Impact Version Stream',
    description: 'Watch the game video progress preview for 10 minutes',
    progress: 600,
    target: 600,
    isEnrolled: true,
    isCompleted: true,
    isClaimed: true,
    rewardName: "60 Primogems + Hero's Wit",
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop'
  },
  {
    id: 'quest_fortnite',
    title: 'Fortnite Chapter Reboot',
    description: 'Play with friends in voice channel for 15 minutes',
    progress: 8,
    target: 15,
    isEnrolled: true,
    isCompleted: false,
    isClaimed: false,
    rewardName: 'Exclusive Discord Glider',
    iconUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop'
  },
  {
    id: 'quest_honkai',
    title: 'Honkai Star Rail Trailblaze',
    description: 'Watch trailer on mobile or desktop client',
    progress: 0,
    target: 1,
    isEnrolled: false,
    isCompleted: false,
    isClaimed: false,
    rewardName: '30 Stellar Jade + Avatar Frame',
    iconUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop'
  }
];

export const INITIAL_DELETED_SNIPES: DeletedSnipe[] = [
  {
    id: 'snipe_1',
    channelId: 'ch_general',
    channelName: 'general-chat',
    authorName: 'SneakyUser',
    authorId: '981245129',
    content: "Wait, don't screenshot this, I'm going to delete it right now!!",
    timestamp: Date.now() - 1800000
  },
  {
    id: 'snipe_2',
    channelId: 'ch_general',
    channelName: 'general-chat',
    authorName: 'GhostAccount',
    authorId: '109823412',
    content: 'Haha leaked token: MTAxOTIzND... (deleted instantly)',
    timestamp: Date.now() - 3600000
  }
];

export const INITIAL_EDIT_SNIPES: EditSnipe[] = [
  {
    id: 'edit_1',
    channelId: 'ch_general',
    channelName: 'general-chat',
    authorName: 'QuantumCoder',
    authorId: '551293819',
    oldContent: 'Client is running with normal RAM usage.',
    newContent: 'Client is running at 120 FPS with minimal RAM usage.',
    timestamp: Date.now() - 900000
  }
];

export const INITIAL_FLEET_BOTS: FleetBot[] = [
  {
    id: 'fleet_master',
    username: 'AssaultMaster',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop',
    isMaster: true,
    isConnected: true,
    voiceChannelName: 'General Voice',
    pingMs: 28
  },
  {
    id: 'fleet_zombie_1',
    username: 'AssaultZombie-01',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
    isMaster: false,
    isConnected: true,
    voiceChannelName: 'General Voice',
    pingMs: 31
  },
  {
    id: 'fleet_zombie_2',
    username: 'AssaultZombie-02',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
    isMaster: false,
    isConnected: true,
    voiceChannelName: 'General Voice',
    pingMs: 35
  },
  {
    id: 'fleet_zombie_3',
    username: 'AssaultZombie-03',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
    isMaster: false,
    isConnected: false,
    voiceChannelName: null,
    pingMs: 42
  }
];

export const INITIAL_DEFENSE: DefenseSettings = {
  agctEnabled: true,
  trapMessage: 'nice try trapping a god you fucking loser',
  whitelist: ['981245781290', '1554236986515'],
  antiAfkEnabled: true,
  afkCheckCount: 0,
  lastAfkResponse: null,
  autoReactEnabled: false,
  reactTargetId: '',
  reactEmojis: ['🔥', '⚡', '💀'],
  silencedUserIds: [],
  normalWpmMin: 80,
  normalWpmMax: 120,
  typoChance: 15
};

export const INITIAL_SETTINGS: AssaultSettings = {
  antiDelete: true,
  antiEdit: true,
  silentTyping: true,
  ghostRead: true,
  compactMode: false,
  nitroEmoteBypass: true,
  showHiddenChannels: true,
  blockedAnalyticsCount: 4182,
  activeTheme: 'AMOLED_BLACK',
  customAccentColor: '#5865f2',
  activePlatform: 'VR',
  immediateMobilePush: true,
  forceIdle: false,
  customRpcTitle: 'assault',
  customCss: `/* Custom Discord CSS Theme */
:root {
  --background-primary: #0f1015;
  --background-secondary: #161822;
  --background-tertiary: #1e212e;
  --accent-color: #5865f2;
  --text-normal: #f2f3f5;
  --text-muted: #949ba4;
  --chat-bubble: #161822;
  --border-radius: 10px;
  --chat-font-size: 14px;
  --message-spacing: 6px;
  --font-family: ui-sans-serif, system-ui, sans-serif;
}`,
  enableCustomCss: true
};

export const INITIAL_PLUGINS: AssaultPlugin[] = [
  {
    id: 'plugin_core_engine',
    name: 'Client Extension Engine',
    description: 'Runtime environment enabling custom JavaScript/TypeScript plugin injection and style overrides.',
    version: '1.8.0',
    author: 'Discord Extensions',
    isEnabled: true,
    category: 'Utility'
  },
  {
    id: 'plugin_better_folders',
    name: 'Enhanced Server Folders',
    description: 'Shows server folders in an organized popup grid with custom icon support.',
    version: '1.4.2',
    author: 'Community Developer',
    isEnabled: true,
    category: 'Visual'
  },
  {
    id: 'plugin_volume_booster',
    name: 'Volume Booster (500%)',
    description: 'Allows pushing participant volume up to 500% in voice channels.',
    version: '1.1.0',
    author: 'Audio Tools',
    isEnabled: true,
    category: 'Voice'
  },
  {
    id: 'plugin_spotify_controls',
    name: 'Spotify In-App Controller',
    description: 'Shows full Spotify playback controls and listen-along sync widget.',
    version: '2.0.4',
    author: 'Music Connect',
    isEnabled: true,
    category: 'Media'
  },
  {
    id: 'plugin_inline_translate',
    name: 'Chat Translator (DeepL / Google)',
    description: 'Adds 1-tap translation button directly to foreign language messages.',
    version: '1.3.1',
    author: 'Language Tools',
    isEnabled: true,
    category: 'Chat'
  },
  {
    id: 'plugin_open_in_app',
    name: 'Open In Native App',
    description: 'Redirects YouTube, Twitter/X, Twitch, and Reddit links directly to their native apps.',
    version: '1.2.0',
    author: 'Navigation Tools',
    isEnabled: true,
    category: 'Utility'
  },
  {
    id: 'plugin_image_zoom',
    name: 'Image Pinch-To-Zoom',
    description: 'Unlocks full interactive pinch, pan, and rotate on all media attachments.',
    version: '1.0.3',
    author: 'Media Tools',
    isEnabled: true,
    category: 'Media'
  },
  {
    id: 'plugin_review_db',
    name: 'User Trust & Safety Badges',
    description: 'Crowdsourced user ratings and verified safety badge indicators on profiles.',
    version: '2.1.0',
    author: 'Safety Team',
    isEnabled: true,
    category: 'Privacy'
  }
];

export const INITIAL_ACCOUNTS: SavedAccount[] = [
  {
    id: 'acc_main',
    username: 'AssaultOperator',
    token: 'demo_token_user_sandbox',
    isBot: false,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    isActive: true
  },
  {
    id: 'acc_bot',
    username: 'AssaultGuard#0001',
    token: 'Bot demo_bot_token_sandbox',
    isBot: true,
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop',
    isActive: false
  }
];

export const INITIAL_BEEFBOT_CONFIG: BeefBotConfig = {
  isEnabled: true,
  commandPrefix: '$',
  antiSpamEnabled: true,
  maxMessagesPer3Sec: 5,
  antiMassMentionEnabled: true,
  maxMentionsAllowed: 3,
  antiInviteLinksEnabled: true,
  antiToxicFilterEnabled: true,
  antiCapsShieldEnabled: true,
  autoRaidQuarantineEnabled: true,
  autoRoastBeefMode: true,
  escalationLevel: 'MILD',
  customCommands: [
    {
      id: 'cmd_beef',
      trigger: 'beef',
      response: '🥩 Beef detected! Settle down or BeefBot will pack you up, {user}.',
      isEnabled: true,
      permissionLevel: 'Everyone',
      usageCount: 42
    },
    {
      id: 'cmd_warn',
      trigger: 'warn',
      response: '⚠️ Warning logged for {user}. Cease rule violations immediately.',
      isEnabled: true,
      permissionLevel: 'Mod',
      usageCount: 15
    },
    {
      id: 'cmd_lockdown',
      trigger: 'lockdown',
      response: '🔒 Channel locked by BeefBot moderation protocol.',
      isEnabled: true,
      permissionLevel: 'Admin',
      usageCount: 3
    },
    {
      id: 'cmd_roast',
      trigger: 'roast',
      response: '🔥 {user} came to a battle of wits completely unarmed.',
      isEnabled: true,
      permissionLevel: 'Everyone',
      usageCount: 28
    },
    {
      id: 'cmd_status',
      trigger: 'status',
      response: '🛡️ BeefBot AutoMod is ACTIVE. Raid Shield: ON | Ping Defense: ON',
      isEnabled: true,
      permissionLevel: 'Everyone',
      usageCount: 19
    }
  ],
  incidents: [
    {
      id: 'inc_1',
      timestamp: Date.now() - 600000,
      targetUser: 'RaidBot_99',
      ruleTriggered: 'Mass Mention (@everyone x4)',
      actionTaken: 'Message purged & User Muted'
    },
    {
      id: 'inc_2',
      timestamp: Date.now() - 1500000,
      targetUser: 'SpamAccount',
      ruleTriggered: 'Anti-Invite Link (discord.gg/scam)',
      actionTaken: 'Invite link stripped & Warned'
    },
    {
      id: 'inc_3',
      timestamp: Date.now() - 3600000,
      targetUser: 'ToxicTroll',
      ruleTriggered: 'Anti-Spam (>6 msgs/3s)',
      actionTaken: 'Rate-limited for 60s'
    }
  ],
  totalViolationsBlocked: 184
};

export const INITIAL_SHORTCUTS: CustomKeyShortcut[] = [
  {
    action: 'TOGGLE_MUTE',
    modifierCtrl: true,
    modifierAlt: false,
    modifierShift: true,
    keyChar: 'M',
    label: 'Toggle Microphone Mute',
    category: 'Voice'
  },
  {
    action: 'TOGGLE_DEAFEN',
    modifierCtrl: true,
    modifierAlt: false,
    modifierShift: true,
    keyChar: 'D',
    label: 'Toggle Audio Deafen',
    category: 'Voice'
  },
  {
    action: 'NEXT_SERVER',
    modifierCtrl: true,
    modifierAlt: true,
    modifierShift: false,
    keyChar: 'ArrowDown',
    label: 'Switch to Next Server',
    category: 'Navigation'
  },
  {
    action: 'PREVIOUS_SERVER',
    modifierCtrl: true,
    modifierAlt: true,
    modifierShift: false,
    keyChar: 'ArrowUp',
    label: 'Switch to Previous Server',
    category: 'Navigation'
  },
  {
    action: 'BATCH_DELETE_MODE',
    modifierCtrl: true,
    modifierAlt: false,
    modifierShift: true,
    keyChar: 'X',
    label: 'Toggle Batch Purge Mode',
    category: 'Chat'
  },
  {
    action: 'PERFORMANCE_MONITOR',
    modifierCtrl: true,
    modifierAlt: true,
    modifierShift: false,
    keyChar: 'P',
    label: 'Open Gateway Monitor',
    category: 'Tools'
  },
  {
    action: 'TOGGLE_BEEFBOT',
    modifierCtrl: true,
    modifierAlt: false,
    modifierShift: true,
    keyChar: 'B',
    label: 'Toggle BeefBot Daemon',
    category: 'Moderation'
  },
  {
    action: 'TOGGLE_SILENT_TYPING',
    modifierCtrl: true,
    modifierAlt: false,
    modifierShift: true,
    keyChar: 'T',
    label: 'Toggle Silent Typing',
    category: 'Privacy'
  }
];
