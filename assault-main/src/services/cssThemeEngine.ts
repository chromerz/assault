export interface CssThemeTemplate {
  id: string;
  name: string;
  description: string;
  css: string;
}

export const CSS_TEMPLATES: CssThemeTemplate[] = [
  {
    id: 'default',
    name: 'Assault Midnight (Default)',
    description: 'Deep onyx base with signature Discord blurple accents',
    css: `/* Assault Midnight Theme */
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
}`
  },
  {
    id: 'catppuccin_mocha',
    name: 'Catppuccin Mocha',
    description: 'Soothing pastel theme with lavender and deep violet tones',
    css: `/* Catppuccin Mocha Theme */
:root {
  --background-primary: #1e1e2e;
  --background-secondary: #181825;
  --background-tertiary: #11111b;
  --accent-color: #cba6f7;
  --text-normal: #cdd6f4;
  --text-muted: #a6adc8;
  --chat-bubble: #313244;
  --border-radius: 14px;
  --chat-font-size: 14px;
  --message-spacing: 8px;
  --font-family: ui-sans-serif, system-ui, sans-serif;
}`
  },
  {
    id: 'dracula',
    name: 'Dracula Dark',
    description: 'Classic dark palette featuring vibrant pink and cyan accents',
    css: `/* Dracula Dark Theme */
:root {
  --background-primary: #282a36;
  --background-secondary: #21222c;
  --background-tertiary: #191a21;
  --accent-color: #ff79c6;
  --text-normal: #f8f8f2;
  --text-muted: #6272a4;
  --chat-bubble: #44475a;
  --border-radius: 12px;
  --chat-font-size: 14px;
  --message-spacing: 6px;
  --font-family: ui-monospace, monospace;
}`
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon 2077',
    description: 'Electric cyan and neon yellow on pitch dark carbon',
    css: `/* Cyberpunk Neon 2077 Theme */
:root {
  --background-primary: #05050a;
  --background-secondary: #0d0e1a;
  --background-tertiary: #16182b;
  --accent-color: #00f0ff;
  --text-normal: #00ffcc;
  --text-muted: #5c677d;
  --chat-bubble: #121424;
  --border-radius: 4px;
  --chat-font-size: 13px;
  --message-spacing: 8px;
  --font-family: ui-monospace, monospace;
}`
  },
  {
    id: 'nordic_frost',
    name: 'Nordic Frost',
    description: 'Clean arctic dark palette with cold glacial blues',
    css: `/* Nordic Frost Theme */
:root {
  --background-primary: #2e3440;
  --background-secondary: #242933;
  --background-tertiary: #1f232a;
  --accent-color: #88c0d0;
  --text-normal: #eceff4;
  --text-muted: #d8dee9;
  --chat-bubble: #3b4252;
  --border-radius: 8px;
  --chat-font-size: 14px;
  --message-spacing: 6px;
  --font-family: ui-sans-serif, system-ui, sans-serif;
}`
  },
  {
    id: 'amoled_pitch',
    name: 'AMOLED Pure Pitch Black',
    description: '0% brightness black for maximum OLED battery savings and contrast',
    css: `/* AMOLED Pure Pitch Black */
:root {
  --background-primary: #000000;
  --background-secondary: #080808;
  --background-tertiary: #101010;
  --accent-color: #5865f2;
  --text-normal: #ffffff;
  --text-muted: #72767d;
  --chat-bubble: #0a0a0a;
  --border-radius: 8px;
  --chat-font-size: 14px;
  --message-spacing: 6px;
  --font-family: ui-sans-serif, system-ui, sans-serif;
}`
  }
];

export class CssThemeEngine {
  static applyCss(css: string, enabled: boolean = true) {
    let styleTag = document.getElementById('assault-custom-css') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'assault-custom-css';
      document.head.appendChild(styleTag);
    }

    if (!enabled || !css.trim()) {
      styleTag.textContent = CSS_TEMPLATES[0].css;
      return;
    }

    styleTag.textContent = css;
  }

  static parseCssVariables(css: string): Record<string, string> {
    const vars: Record<string, string> = {};
    const regex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = regex.exec(css)) !== null) {
      vars[match[1]] = match[2].trim();
    }
    return vars;
  }
}
