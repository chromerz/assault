import { CustomFontItem } from '../types';

export const DEFAULT_FONTS: CustomFontItem[] = [
  {
    id: 'font_default',
    name: 'System Default',
    family: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    category: 'Sans-Serif',
    previewText: 'The quick brown fox jumps over the lazy dog',
    isBuiltin: true,
    author: 'Platform System'
  },
  {
    id: 'font_whitney',
    name: 'Whitney (Classic Discord)',
    family: '"Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif',
    category: 'Sans-Serif',
    previewText: 'Experience classic Discord messaging typography',
    isBuiltin: true,
    author: 'Discord Inc.'
  },
  {
    id: 'font_gg_sans',
    name: 'gg sans (Modern Discord)',
    family: '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    category: 'Sans-Serif',
    previewText: 'Official modern Discord interface font',
    isBuiltin: true,
    author: 'Discord Design'
  },
  {
    id: 'font_roboto',
    name: 'Roboto Variable',
    family: '"Roboto", sans-serif',
    sourceUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    category: 'Sans-Serif',
    previewText: 'Google Material typography with crisp legibility',
    isBuiltin: true,
    author: 'Google Fonts'
  },
  {
    id: 'font_inter',
    name: 'Inter',
    family: '"Inter", sans-serif',
    sourceUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    category: 'Sans-Serif',
    previewText: 'Crafted for computer screens with tall x-height',
    isBuiltin: true,
    author: 'Rasmus Andersson'
  },
  {
    id: 'font_jetbrains_mono',
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", monospace',
    sourceUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
    category: 'Monospace',
    previewText: 'const assault = new ClientEngine({ stealth: true });',
    isBuiltin: true,
    author: 'JetBrains'
  },
  {
    id: 'font_fira_code',
    name: 'Fira Code (Ligatures)',
    family: '"Fira Code", monospace',
    sourceUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap',
    category: 'Monospace',
    previewText: '=> !== === >= <= && || =>>',
    isBuiltin: true,
    author: 'Nikita Prokopov'
  },
  {
    id: 'font_poppins',
    name: 'Poppins Geometric',
    family: '"Poppins", sans-serif',
    sourceUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    category: 'Display',
    previewText: 'Geometric sans-serif with friendly curves',
    isBuiltin: true,
    author: 'Indian Type Foundry'
  },
  {
    id: 'font_comic_neue',
    name: 'Comic Neue',
    family: '"Comic Neue", cursive, sans-serif',
    sourceUrl: 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap',
    category: 'Handwriting',
    previewText: 'Casual friendly handwriting for comfy chatting',
    isBuiltin: true,
    author: 'Craig Rozynski'
  }
];

class FontEngineManager {
  private activeFontId: string = 'font_default';
  private loadedFonts: Map<string, CustomFontItem> = new Map();

  constructor() {
    DEFAULT_FONTS.forEach((f) => this.loadedFonts.set(f.id, f));
    try {
      const saved = localStorage.getItem('assault_active_font');
      if (saved && this.loadedFonts.has(saved)) {
        this.activeFontId = saved;
        this.applyFont(saved);
      }
    } catch (_e) {
      // ignore
    }
  }

  public getFonts(): CustomFontItem[] {
    return Array.from(this.loadedFonts.values());
  }

  public getActiveFontId(): string {
    return this.activeFontId;
  }

  public applyFont(fontId: string): void {
    const font = this.loadedFonts.get(fontId);
    if (!font) return;

    this.activeFontId = fontId;
    try {
      localStorage.setItem('assault_active_font', fontId);
    } catch (_e) {}

    // Load webfont link if external
    if (font.sourceUrl) {
      const existingLink = document.getElementById(`font-link-${font.id}`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.id = `font-link-${font.id}`;
        link.rel = 'stylesheet';
        link.href = font.sourceUrl;
        document.head.appendChild(link);
      }
    }

    // Apply to :root
    document.documentElement.style.setProperty('--font-family', font.family);
  }

  public addCustomFont(font: CustomFontItem): void {
    this.loadedFonts.set(font.id, font);
    this.applyFont(font.id);
  }
}

export const fontEngine = new FontEngineManager();
