import { normalizeSettings, stringMap } from './settingsValidation.ts';
// Storage & Execution service for Self-Defense Automation Hub and Fleet Orchestration

export interface WpmSettings {
  normalWpmRange: [number, number];
  slowWpm: number;
  typoChance: number;
  typoWordsMin: number;
  typoWordsMax: number;
  typoLettersPerWord: number;
}

export interface AgctConfig {
  enabled: boolean;
  trapMessage: string;
  trapIconUrl: string;
  autoDeleteDelay: number;
  whitelist: string[];
}

export interface ReactionConfig {
  botReaction: string | null;
  reactTargets: Record<string, string>; // userId -> emoji
}

export interface AutomationConfig {
  prefix: string;
  capsMode: boolean;
  afkEnabled: boolean;
  triggerEnabled: boolean;
  pingChance: number;
  wpm: WpmSettings;
  agct: AgctConfig;
  reactions: ReactionConfig;
  userWhitelist: string[];
  blacklistedWords: string[];
  jokes: string[];
}

export interface RpcActivitySlot {
  id: string;
  type: number; // 0 = Game, 1 = Streaming, 2 = Listening
  enabled: boolean;
  card: 'playstation' | 'spotify' | 'stream' | 'custom';
  appName: string;
  name: string;
  details: string;
  state: string;
  album?: string;
  artId: string;
  url?: string;
  syncId?: string | null;
}

export interface FleetAccount {
  id: string;
  token: string;
  username: string;
  discriminator?: string;
  avatarUrl?: string;
  isMaster: boolean;
  platform: 'vr' | 'desktop' | 'web' | 'ios' | 'android' | 'xbox' | 'playstation';
  status: 'online' | 'idle' | 'dnd' | 'offline';
  pingMs: number;
  preserveMobileNotifs: boolean;
  activeQuestsCount: number;
}

export interface QuestItem {
  id: string;
  title: string;
  type: 'WATCH_VIDEO' | 'PLAY_ON_DESKTOP' | 'STREAM_ON_DESKTOP' | 'PLAY_ACTIVITY';
  reward: string;
  targetSeconds: number;
  progressSeconds: number;
  enrolled: boolean;
  completed: boolean;
  claimed: boolean;
}

export interface FleetConfig {
  fleetAccounts: FleetAccount[];
  voiceChannelId: string;
  voiceConnected: boolean;
  rpcSlots: RpcActivitySlot[];
  quests: QuestItem[];
}

// QWERTY Key Proximity Map for Human Typo Simulation
export const KEYBOARD_LAYOUT: Record<string, string[]> = {
  q: ['w', 'a', '1', '2'],
  w: ['q', 'e', 's', 'a', '2', '3'],
  e: ['w', 'r', 'd', 's', '3', '4'],
  r: ['e', 't', 'f', 'd', '4', '5'],
  t: ['r', 'y', 'g', 'f', '5', '6'],
  y: ['t', 'u', 'h', 'g', '6', '7'],
  u: ['y', 'i', 'j', 'h', '7', '8'],
  i: ['u', 'o', 'k', 'j', '8', '9'],
  o: ['i', 'p', 'l', 'k', '9', '0'],
  p: ['o', '[', ';', 'l', '0', '-'],
  a: ['q', 'w', 's', 'z'],
  s: ['w', 'e', 'd', 'a', 'x', 'z'],
  d: ['e', 'r', 'f', 's', 'c', 'x'],
  f: ['r', 't', 'g', 'd', 'v', 'c'],
  g: ['t', 'y', 'h', 'f', 'b', 'v'],
  h: ['y', 'u', 'j', 'g', 'n', 'b'],
  j: ['u', 'i', 'k', 'h', 'm', 'n'],
  k: ['i', 'o', 'l', 'j', ',', 'm'],
  l: ['o', 'p', ';', 'k', '.', ','],
  z: ['a', 's', 'x'],
  x: ['z', 's', 'd', 'c'],
  c: ['x', 'd', 'f', 'v'],
  v: ['c', 'f', 'g', 'b'],
  b: ['v', 'g', 'h', 'n'],
  n: ['b', 'h', 'j', 'm'],
  m: ['n', 'j', 'k', ','],
  ' ': [' '],
};

const DEFAULT_AUTOMATION: AutomationConfig = {
  prefix: '$',
  capsMode: false,
  afkEnabled: true,
  triggerEnabled: true,
  pingChance: 100,
  wpm: {
    normalWpmRange: [80, 120],
    slowWpm: 90,
    typoChance: 15,
    typoWordsMin: 1,
    typoWordsMax: 3,
    typoLettersPerWord: 1,
  },
  agct: {
    enabled: true,
    trapMessage: 'nice try trapping a god you fucking loser',
    trapIconUrl: 'https://files.catbox.moe/w360q0.jpg',
    autoDeleteDelay: 2000,
    whitelist: ['104928472918274910', '984729182736451092'],
  },
  reactions: {
    botReaction: '🔥',
    reactTargets: {
      '984729182736451092': '👑',
      '847291827364510923': '🛡️',
    },
  },
  userWhitelist: ['104928472918274910', '984729182736451092'],
  blacklistedWords: ['hail', 'hailk', 'massacre', 'trix', 'envyk', 'restrict', 'vital', 'carn'],
  jokes: [
    'Why did the chicken cross the road? To evade the rate limit.',
    'Your packet round-trip is slower than dial-up in 1998.',
    'Imagine trying to trap an account that runs ring-0 hooks.',
    'Nice try stepping to me, log off and reconsider your life choices.',
    'Assault client latency: 1.1ms. Your response time: 3 business days.',
  ],
};

const DEFAULT_FLEET: FleetConfig = {
  fleetAccounts: [
    {
      id: 'acc-1',
      token: '',
      username: 'AssaultMaster',
      discriminator: '0001',
      isMaster: true,
      platform: 'vr',
      status: 'online',
      pingMs: 14,
      preserveMobileNotifs: true,
      activeQuestsCount: 2,
    },
    {
      id: 'acc-2',
      token: '',
      username: 'FleetDrone-Alpha',
      discriminator: '1337',
      isMaster: false,
      platform: 'playstation',
      status: 'idle',
      pingMs: 22,
      preserveMobileNotifs: true,
      activeQuestsCount: 1,
    },
    {
      id: 'acc-3',
      token: '',
      username: 'FleetDrone-Beta',
      discriminator: '2024',
      isMaster: false,
      platform: 'ios',
      status: 'online',
      pingMs: 19,
      preserveMobileNotifs: true,
      activeQuestsCount: 0,
    },
  ],
  voiceChannelId: '109283746592837465',
  voiceConnected: false,
  rpcSlots: [
    {
      id: 'slot-ps',
      type: 0,
      enabled: true,
      card: 'playstation',
      appName: 'PlayStation 5',
      name: 'Grand Theft Auto VI',
      details: 'Roaming Vice City',
      state: 'Campaign Mode',
      artId: 'mp:1551777519470907442',
    },
    {
      id: 'slot-sp',
      type: 2,
      enabled: true,
      card: 'spotify',
      appName: 'Spotify',
      name: 'Spotify',
      details: 'STARGAZING',
      state: 'Travis Scott',
      album: 'ASTROWORLD',
      artId: 'ab67616d00001e02b7c9f0b8d0d0f1a5d3e9e5f0',
      url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      syncId: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
    },
    {
      id: 'slot-stream',
      type: 1,
      enabled: true,
      card: 'stream',
      appName: 'Twitch',
      name: 'High Elo Cyber Tournament',
      details: 'Speedrunning Defense Hooks',
      state: 'Competitive',
      artId: 'mp:1545994660894212116',
      url: 'https://twitch.tv/ninja',
    },
  ],
  quests: [
    {
      id: 'quest-991',
      title: 'Watch Genshin Impact 5.0 Showcase',
      type: 'WATCH_VIDEO',
      reward: '50 Primogems + Exclusive Discord Avatar Deco',
      targetSeconds: 900,
      progressSeconds: 900,
      enrolled: true,
      completed: true,
      claimed: false,
    },
    {
      id: 'quest-992',
      title: 'Play The First Descendant on PC',
      type: 'PLAY_ON_DESKTOP',
      reward: 'Assault Cyber Weapon Skin Bundle',
      targetSeconds: 900,
      progressSeconds: 450,
      enrolled: true,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest-993',
      title: 'Stream Honkai: Star Rail to Friends',
      type: 'STREAM_ON_DESKTOP',
      reward: 'Discord Nitro 1-Month Trial',
      targetSeconds: 900,
      progressSeconds: 0,
      enrolled: false,
      completed: false,
      claimed: false,
    },
  ],
};

const sessionTokens = new Map<string, string>();
const AUTO_STORAGE_KEY = 'assault_automation_cfg_v1';
const FLEET_STORAGE_KEY = 'assault_fleet_cfg_v1';

export function normalizeAutomation(value: unknown): AutomationConfig {
  const cfg = normalizeSettings(DEFAULT_AUTOMATION, value);
  const raw = value as Partial<AutomationConfig> | null;
  cfg.prefix = cfg.prefix.trim().slice(0, 8) || '$';
  cfg.pingChance = Math.max(0, Math.min(100, cfg.pingChance));
  const range = cfg.wpm.normalWpmRange;
  cfg.wpm.normalWpmRange = [Math.max(1, Math.min(500, range[0] || 80)), Math.max(1, Math.min(500, range[1] || 120))].sort((a,b) => a-b) as [number,number];
  cfg.wpm.slowWpm = Math.max(1, Math.min(500, cfg.wpm.slowWpm));
  cfg.wpm.typoChance = Math.max(0, Math.min(100, cfg.wpm.typoChance));
  cfg.agct.autoDeleteDelay = Math.max(0, cfg.agct.autoDeleteDelay);
  cfg.reactions.reactTargets = stringMap(raw?.reactions?.reactTargets ?? DEFAULT_AUTOMATION.reactions.reactTargets);
  if (raw?.reactions?.botReaction === null) cfg.reactions.botReaction = null;
  return cfg;
}

export function getAutomationConfig(): AutomationConfig {
  try { return normalizeAutomation(JSON.parse(localStorage.getItem(AUTO_STORAGE_KEY) || 'null')); }
  catch { return normalizeAutomation(null); }
}

export function saveAutomationConfig(cfg: AutomationConfig): boolean {
  try { localStorage.setItem(AUTO_STORAGE_KEY, JSON.stringify(normalizeAutomation(cfg))); return true; }
  catch { return false; }
}

export function normalizeFleet(value: unknown): FleetConfig {
  const cfg = normalizeSettings(DEFAULT_FLEET, value);
  const accounts = (value as Partial<FleetConfig> | null)?.fleetAccounts;
  const originals = Array.isArray(accounts) ? accounts.filter(a => a !== null && typeof a === 'object') : DEFAULT_FLEET.fleetAccounts;
  cfg.fleetAccounts = cfg.fleetAccounts.map((account, i) => ({ ...account,
    avatarUrl: typeof originals[i]?.avatarUrl === 'string' ? originals[i].avatarUrl : undefined,
    platform: ['vr','desktop','web','ios','android','xbox','playstation'].includes(account.platform) ? account.platform : 'desktop',
    status: ['online','idle','dnd','offline'].includes(account.status) ? account.status : 'offline',
  }));
  // Preserve optional card fields omitted from the first template entry.
  const slots = (value as Partial<FleetConfig> | null)?.rpcSlots;
  cfg.rpcSlots = cfg.rpcSlots.map((slot, i) => {
    const original = Array.isArray(slots) ? slots[i] : DEFAULT_FLEET.rpcSlots[i];
    return { ...slot, album: typeof original?.album === 'string' ? original.album : '',
      url: typeof original?.url === 'string' ? original.url : '',
      syncId: typeof original?.syncId === 'string' ? original.syncId : null,
      type: [0,1,2,3,5].includes(slot.type) ? slot.type : 0 };
  });
  cfg.quests = cfg.quests.map(q => ({ ...q, targetSeconds: Math.max(1,q.targetSeconds), progressSeconds: Math.max(0,Math.min(q.targetSeconds,q.progressSeconds)) }));
  return cfg;
}

export function getFleetConfig(): FleetConfig {
  try {
    const cfg = normalizeFleet(JSON.parse(localStorage.getItem(FLEET_STORAGE_KEY) || 'null'));
    for (const a of cfg.fleetAccounts) {
      if (a.token) sessionTokens.set(a.id, a.token);
      a.token = sessionTokens.get(a.id) || '';
    }
    // Migrate existing saved credentials into this tab's memory; keep roster and settings.
    saveFleetConfig(cfg);
    return cfg;
  } catch { return normalizeFleet(null); }
}

export function saveFleetConfig(cfg: FleetConfig): boolean {
  const safe = normalizeFleet(cfg);
  for (const id of sessionTokens.keys()) if (!safe.fleetAccounts.some(a => a.id === id)) sessionTokens.delete(id);
  for (const a of safe.fleetAccounts) { if (a.token) sessionTokens.set(a.id, a.token); a.token = ''; }
  try { localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(safe)); return true; }
  catch { return false; }
}

// Generate realistic human typing typos based on proximity QWERTY layout
export function generateHumanTypo(text: string, typoChancePercent: number = 15): string {
  if (text.length < 5 || /^\d+$/.test(text)) return text;
  if (typoChancePercent <= 0 || Math.random() * 100 >= typoChancePercent) return text;

  const words = text.split(' ');
  const numWordsToTypo = Math.floor(Math.random() * 2) + 1;
  const wordsToTypo = new Set<number>();
  while (wordsToTypo.size < numWordsToTypo && wordsToTypo.size < words.length) {
    wordsToTypo.add(Math.floor(Math.random() * words.length));
  }

  const bottomRowKeys = ['b', 'v', 'n', 'm', 'c', 'x'];
  wordsToTypo.forEach(wordIndex => {
    const word = words[wordIndex];
    if (word && word.length > 2) {
      const charIndex = Math.floor(Math.random() * word.length);
      const char = word[charIndex].toLowerCase();
      if (bottomRowKeys.includes(char) && Math.random() < 0.3) {
        if (Math.random() < 0.5) {
          words[wordIndex] = word.substring(0, charIndex) + ' ' + word.substring(charIndex);
        } else {
          words[wordIndex] = word.substring(0, charIndex + 1) + ' ' + word.substring(charIndex + 1);
        }
      } else if (KEYBOARD_LAYOUT[char]) {
        const nearbyKeys = KEYBOARD_LAYOUT[char];
        const typoChar = nearbyKeys[Math.floor(Math.random() * nearbyKeys.length)];
        const isUpper = word[charIndex] === word[charIndex].toUpperCase();
        const finalChar = isUpper ? typoChar.toUpperCase() : typoChar;
        words[wordIndex] = word.substring(0, charIndex) + finalChar + word.substring(charIndex + 1);
      }
    }
  });

  return words.join(' ');
}

// Dynamic AFK Counter Escalation Engine
export function generateEscalatedAfkResponse(count: number, username: string = 'TARGET'): string {
  if (count <= 1) {
    const first = [
      'IM HERE BITCH',
      'WHAT U WANT',
      'IM NOT AFK',
      'STILL HERE',
      'WHATS GOOD',
      'IM ACTIVE RIGHT HERE',
    ];
    return first[Math.floor(Math.random() * first.length)];
  }

  const templates = [
    `${count} AFK CHECKS FOCUS THE FUCK UP`,
    `AFK CHECK #${count} AND UR STILL FAILING?`,
    `WHY THE FUCK ARE YOU AFK CHECKING ME ${count} TIMES?`,
    `${count} TIMES? GET A LIFE`,
    `THIS IS CHECK NUMBER ${count} IM RIGHT HERE`,
    count > 3 ? `${username.toUpperCase()} YOU'RE OBSESSED CHECKING ME ${count} TIMES` : `CHECKED ME ${count} TIMES ALREADY`,
    `DO YOU NOT SEE ME RESPONDING? THATS ${count} CHECKS NOW`,
    `${count} CHECKS AND YOU STILL DONT GET IT? IM ACTIVE`,
    `"aFk ChEcK" FOR THE ${count}${count === 2 ? 'ND' : count === 3 ? 'RD' : 'TH'} TIME`,
    `${count} TIMES YOU'VE PINGED ME AND IM STILL STANDING`,
  ];

  if (count > 5) {
    templates.push(
      `${count} CHECKS? BRO GET OFF MY CHAT ALREADY`,
      `OVER ${count} TIMES? YOU'RE FAN BEHAVIOR`,
      `${count} AFK CHECKS IS CRAZY WORK NGL`
    );
  }

  return templates[Math.floor(Math.random() * templates.length)];
}
