export interface IconPack {
  id: string;
  name: string;
  description: string;
  author: string;
  previewColor: string;
  styleClass: string;
  hashIcon: string; // text channel icon
  voiceIcon: string; // voice channel icon
  announcementIcon: string;
  lockIcon: string;
  micIcon: string;
  headphonesIcon: string;
  settingsIcon: string;
  beefIcon: string;
}

export const ICON_PACKS: IconPack[] = [
  {
    id: 'default',
    name: 'Discord Classic Standard',
    description: 'Original Discord vector glyphs with standard styling',
    author: 'Discord Official',
    previewColor: '#5865f2',
    styleClass: 'discord-classic',
    hashIcon: '#',
    voiceIcon: '🔊',
    announcementIcon: '📢',
    lockIcon: '🔒',
    micIcon: '🎙️',
    headphonesIcon: '🎧',
    settingsIcon: '⚙️',
    beefIcon: '🥩'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon 2077',
    description: 'Futuristic glowing glyphs with electric cyan and magenta accents',
    author: 'NightCity Mods',
    previewColor: '#00f0ff',
    styleClass: 'neon-cyber',
    hashIcon: '⚡',
    voiceIcon: '📡',
    announcementIcon: '🚨',
    lockIcon: '🛑',
    micIcon: '🎤',
    headphonesIcon: '🥽',
    settingsIcon: '🛠️',
    beefIcon: '🔥'
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin Pastel Soft',
    description: 'Cozy, rounded pastel symbols in lavender and peach',
    author: 'Catppuccin Org',
    previewColor: '#cba6f7',
    styleClass: 'catppuccin-soft',
    hashIcon: '✦',
    voiceIcon: '♬',
    announcementIcon: '📣',
    lockIcon: '🔐',
    micIcon: '🎙',
    headphonesIcon: '🎧',
    settingsIcon: '⚙',
    beefIcon: '🍖'
  },
  {
    id: 'pixel_retro',
    name: 'Pixel Retro 8-Bit',
    description: 'Chiptune nostalgia with arcade pixel iconography',
    author: 'ArcadeStudio',
    previewColor: '#fee75c',
    styleClass: 'pixel-arcade',
    hashIcon: '❖',
    voiceIcon: '🕹️',
    announcementIcon: '👾',
    lockIcon: '🗝️',
    micIcon: '📻',
    headphonesIcon: '🎮',
    settingsIcon: '🔧',
    beefIcon: '🥓'
  },
  {
    id: 'minimal_feather',
    name: 'Minimalist Monoline',
    description: 'Ultra-thin, elegant geometric line symbols',
    author: 'Nordic Design',
    previewColor: '#88c0d0',
    styleClass: 'minimal-mono',
    hashIcon: '§',
    voiceIcon: '◈',
    announcementIcon: '▲',
    lockIcon: '⚿',
    micIcon: '☊',
    headphonesIcon: '☡',
    settingsIcon: '☼',
    beefIcon: '⚔️'
  }
];

export class IconPackEngine {
  static getPack(id: string): IconPack {
    return ICON_PACKS.find((p) => p.id === id) || ICON_PACKS[0];
  }
}
