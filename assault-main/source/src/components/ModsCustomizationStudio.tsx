import React, { useState, useEffect } from 'react';
import {
  Shield,
  Palette,
  EyeOff,
  Zap,
  Radio,
  Sliders,
  Sparkles,
  Download,
  Upload,
  Check,
  Copy,
  RotateCcw,
  Bell,
  Lock,
  Flame,
  Moon,
  Smartphone,
  MessageSquare,
  Activity,
  Smile,
  Code,
  Terminal,
  ChevronRight,
  Layers,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { AutomodShieldSettings } from './AutomodShieldSettings';

export interface ModSettings {
  // Privacy & Stealth
  silentTyping: boolean;
  antiDelete: boolean;
  ghostPingRadar: boolean;
  tokenProtection: boolean;
  telemetryBlocker: boolean;

  // Visuals & Themes
  accentColor: string;
  themeMode: 'dark' | 'amoled';
  spoilerAutoReveal: boolean;
  chatDensity: 'cozy' | 'compact' | 'minimal';
  avatarShape: 'circle' | 'rounded' | 'hexagon';

  // Chat & Automation
  nitroEmotes: boolean;
  quickReactions: string[];
  presenceType: 'Playing' | 'Streaming' | 'Listening' | 'Watching';
  presenceText: string;
  developerTools: boolean;
}

export const DEFAULT_MOD_SETTINGS: ModSettings = {
  silentTyping: true,
  antiDelete: true,
  ghostPingRadar: true,
  tokenProtection: true,
  telemetryBlocker: true,
  accentColor: '#ff6471',
  themeMode: 'dark',
  spoilerAutoReveal: true,
  chatDensity: 'cozy',
  avatarShape: 'rounded',
  nitroEmotes: true,
  quickReactions: ['🔥', '👍', '❤️', '💀', '✨'],
  presenceType: 'Playing',
  presenceText: 'Assault v2.9.2 on Android 16',
  developerTools: false,
};

export const ACCENT_PALETTES = [
  { name: 'Assault Coral', hex: '#ff6471' },
  { name: 'Electric Mint', hex: '#00f59b' },
  { name: 'Neon Cyan', hex: '#00d2ff' },
  { name: 'Cyber Violet', hex: '#a855f7' },
  { name: 'Solar Amber', hex: '#ffb703' },
  { name: 'Rose Quartz', hex: '#ec4899' },
];

interface Props {
  settings: ModSettings;
  onChange: (newSettings: ModSettings) => void;
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
  onApplyTheme?: (mode: 'dark' | 'amoled') => void;
}

export function ModsCustomizationStudio({ settings, onChange, onLog, onApplyTheme }: Props) {
  const [activeCategory, setActiveCategory] = useState<'privacy' | 'visuals' | 'chat' | 'presets' | 'automod'>('privacy');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [testSlashCommand, setTestSlashCommand] = useState('');

  // Apply accent color to document root
  useEffect(() => {
    document.documentElement.style.setProperty('--mint', settings.accentColor);
  }, [settings.accentColor]);

  function updateSetting<K extends keyof ModSettings>(key: K, value: ModSettings[K]) {
    const updated = { ...settings, [key]: value };
    onChange(updated);
    if (key === 'themeMode' && onApplyTheme) {
      onApplyTheme(value as 'dark' | 'amoled');
    }
    if (onLog) {
      onLog(`Mod updated: ${String(key)} → ${String(value)}`, 'info', 'MODS');
    }
  }

  function applyPreset(presetName: string) {
    let preset: Partial<ModSettings> = {};
    if (presetName === 'stealth') {
      preset = {
        silentTyping: true,
        antiDelete: true,
        ghostPingRadar: true,
        tokenProtection: true,
        telemetryBlocker: true,
        spoilerAutoReveal: true,
        themeMode: 'amoled',
        presenceText: 'Invisible Stealth',
      };
      if (onApplyTheme) onApplyTheme('amoled');
      if (onLog) onLog('Applied Preset: Ultra Stealth Defense Mode', 'success', 'PRESET');
    } else if (presetName === 'battery') {
      preset = {
        themeMode: 'amoled',
        chatDensity: 'compact',
        spoilerAutoReveal: false,
        developerTools: false,
      };
      if (onApplyTheme) onApplyTheme('amoled');
      if (onLog) onLog('Applied Preset: OLED Battery Optimization', 'success', 'PRESET');
    } else if (presetName === 'cyberpunk') {
      preset = {
        accentColor: '#a855f7',
        avatarShape: 'hexagon',
        nitroEmotes: true,
        developerTools: true,
        presenceType: 'Streaming',
        presenceText: 'Assault Hermes v2.9.2',
      };
      if (onLog) onLog('Applied Preset: Cyberpunk Glow & Dev Tools', 'success', 'PRESET');
    } else if (presetName === 'reset') {
      onChange(DEFAULT_MOD_SETTINGS);
      if (onApplyTheme) onApplyTheme('dark');
      if (onLog) onLog('Restored all mods and customizations to factory default', 'warning', 'RESET');
      return;
    }

    onChange({ ...settings, ...preset });
  }

  function copyConfigToClipboard() {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2)).then(() => {
      setCopiedConfig(true);
      if (onLog) onLog('Exported mod configuration copied to clipboard', 'success', 'CONFIG');
      setTimeout(() => setCopiedConfig(false), 2000);
    });
  }

  function downloadConfig() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assault-config-v2.9.2.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onLog) onLog('Saved assault-config-v2.9.2.json to downloads', 'info', 'EXPORT');
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(importJson);
      const validated: ModSettings = { ...DEFAULT_MOD_SETTINGS, ...parsed };
      onChange(validated);
      if (validated.themeMode && onApplyTheme) {
        onApplyTheme(validated.themeMode);
      }
      setShowImportModal(false);
      setImportJson('');
      setImportError('');
      if (onLog) onLog('Custom profile JSON loaded and applied successfully', 'success', 'CONFIG');
    } catch {
      setImportError('Invalid JSON format. Please verify configuration structure.');
    }
  }

  const activeModsCount = [
    settings.silentTyping,
    settings.antiDelete,
    settings.ghostPingRadar,
    settings.tokenProtection,
    settings.telemetryBlocker,
    settings.spoilerAutoReveal,
    settings.nitroEmotes,
    settings.developerTools,
    settings.themeMode === 'amoled'
  ].filter(Boolean).length;

  return (
    <section className="mods-studio-card" id="mods" role="region" aria-label="Mods and Customization Studio">
      {/* HEADER */}
      <div className="mods-studio-header">
        <div className="mods-studio-title-box">
          <div className="mods-icon-badge">
            <Sliders size={20} />
          </div>
          <div>
            <div className="mods-eyebrow">ASSAULT RUNTIME CUSTOMIZATION</div>
            <h3>Mods & Client Studio</h3>
            <p>Customize Hermes bytecode hooks, stealth privacy defenses, themes, and interactive client tweaks.</p>
          </div>
        </div>

        <div className="mods-header-actions">
          <div className="mods-active-status">
            <span className="tiny-dot pulse" style={{ background: settings.accentColor }} />
            <strong>{activeModsCount} Active Mods</strong>
            <small>· Android 16 Verified</small>
          </div>
          <button type="button" className="action-btn" onClick={copyConfigToClipboard} title="Copy profile JSON">
            {copiedConfig ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copiedConfig ? 'Copied' : 'Export JSON'}</span>
          </button>
          <button type="button" className="action-btn" onClick={() => setShowImportModal(true)} title="Import JSON profile">
            <Upload size={14} />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* QUICK PRESET BAR */}
      <div className="presets-ribbon">
        <span className="preset-label"><Sparkles size={13} /> Quick Presets:</span>
        <button type="button" className="preset-pill" onClick={() => applyPreset('stealth')}>
          <Shield size={12} /> Ultra Stealth
        </button>
        <button type="button" className="preset-pill" onClick={() => applyPreset('battery')}>
          <Zap size={12} /> OLED Battery Saver
        </button>
        <button type="button" className="preset-pill" onClick={() => applyPreset('cyberpunk')}>
          <Flame size={12} /> Cyberpunk Glow
        </button>
        <button type="button" className="preset-pill reset" onClick={() => applyPreset('reset')}>
          <RotateCcw size={12} /> Reset Defaults
        </button>
      </div>

      {/* CATEGORY NAV TABS */}
      <div className="mods-category-nav">
        <button
          type="button"
          className={`category-tab ${activeCategory === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveCategory('privacy')}
        >
          <EyeOff size={15} /> Privacy & Stealth
          <span className="tab-pill">
            {[settings.silentTyping, settings.antiDelete, settings.ghostPingRadar, settings.tokenProtection, settings.telemetryBlocker].filter(Boolean).length} / 5
          </span>
        </button>
        <button
          type="button"
          className={`category-tab ${activeCategory === 'visuals' ? 'active' : ''}`}
          onClick={() => setActiveCategory('visuals')}
        >
          <Palette size={15} /> Visuals & Themes
          <span className="color-swatch-indicator" style={{ backgroundColor: settings.accentColor }} />
        </button>
        <button
          type="button"
          className={`category-tab ${activeCategory === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveCategory('chat')}
        >
          <MessageSquare size={15} /> Chat & Presence
        </button>
        <button
          type="button"
          className={`category-tab ${activeCategory === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveCategory('presets')}
        >
          <Terminal size={15} /> Slash Commands & Tools
        </button>
        <button
          type="button"
          className={`category-tab ${activeCategory === 'automod' ? 'active' : ''}`}
          onClick={() => setActiveCategory('automod')}
        >
          <ShieldAlert size={15} /> Automod & Safety
          <span className="tab-pill">Shield</span>
        </button>
      </div>

      {/* TAB CONTENT: PRIVACY & STEALTH */}
      {activeCategory === 'privacy' && (
        <div className="mods-grid">
          <div className={`mod-card ${settings.silentTyping ? 'enabled' : ''}`}>
            <div className="mod-card-top">
              <div className="mod-info">
                <div className="mod-name">
                  <EyeOff size={16} /> Silent Typing
                </div>
                <p>Suppresses outgoing typing broadcast opcodes. Friends will never see you typing in channels or DMs.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.silentTyping}
                  onChange={e => updateSetting('silentTyping', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="mod-card-footer">
              <span className="mod-badge">Stealth Protocol</span>
              <span className="mod-tag">Gateway Opcode 26</span>
            </div>
          </div>

          <div className={`mod-card ${settings.antiDelete ? 'enabled' : ''}`}>
            <div className="mod-card-top">
              <div className="mod-info">
                <div className="mod-name">
                  <Shield size={16} /> Anti-Delete & Edit Ledger
                </div>
                <p>Retains all deleted messages highlighted in crimson with exact timestamps. Preserves full message edit revisions.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.antiDelete}
                  onChange={e => updateSetting('antiDelete', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="mod-card-footer">
              <span className="mod-badge">Message Retention</span>
              <span className="mod-tag">Bounded In-Memory Cache</span>
            </div>
          </div>

          <div className={`mod-card ${settings.ghostPingRadar ? 'enabled' : ''}`}>
            <div className="mod-card-top">
              <div className="mod-info">
                <div className="mod-name">
                  <Bell size={16} /> Ghost Ping Radar
                </div>
                <p>Captures stealth mentions deleted within seconds. Displays author tag, message content, and trigger timestamp.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.ghostPingRadar}
                  onChange={e => updateSetting('ghostPingRadar', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="mod-card-footer">
              <span className="mod-badge">Mention Radar</span>
              <span className="mod-tag">/assault ghost-pings</span>
            </div>
          </div>

          <div className={`mod-card ${settings.tokenProtection ? 'enabled' : ''}`}>
            <div className="mod-card-top">
              <div className="mod-info">
                <div className="mod-name">
                  <Lock size={16} /> Token & Credential Shield
                </div>
                <p>Scrubs authorization headers and auth tokens from client logs, crash dumps, and clipboard injection attacks.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.tokenProtection}
                  onChange={e => updateSetting('tokenProtection', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="mod-card-footer">
              <span className="mod-badge">Zero-Trust Security</span>
              <span className="mod-tag">Memory Sanitizer</span>
            </div>
          </div>

          <div className={`mod-card ${settings.telemetryBlocker ? 'enabled' : ''}`}>
            <div className="mod-card-top">
              <div className="mod-info">
                <div className="mod-name">
                  <Radio size={16} /> Telemetry & Science Blocker
                </div>
                <p>Nullifies analytics, science telemetry, and tracking endpoints to preserve mobile bandwidth and eliminate background beaconing.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.telemetryBlocker}
                  onChange={e => updateSetting('telemetryBlocker', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="mod-card-footer">
              <span className="mod-badge">Network Filter</span>
              <span className="mod-tag">Zero Telemetry</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VISUALS & THEMES */}
      {activeCategory === 'visuals' && (
        <div className="visuals-config-container">
          {/* ACCENT COLOR SELECTOR */}
          <div className="config-block">
            <div className="config-block-title">
              <Palette size={16} />
              <span>Primary System Accent Color</span>
            </div>
            <p className="config-block-desc">
              Instantly applies across all active buttons, progress indicators, status chips, and the streaming device emulator.
            </p>
            <div className="accent-palette-grid">
              {ACCENT_PALETTES.map(p => (
                <button
                  key={p.hex}
                  type="button"
                  className={`accent-palette-item ${settings.accentColor === p.hex ? 'active' : ''}`}
                  onClick={() => updateSetting('accentColor', p.hex)}
                >
                  <span className="palette-swatch" style={{ backgroundColor: p.hex }} />
                  <span className="palette-name">{p.name}</span>
                  {settings.accentColor === p.hex && <Check size={14} className="palette-check" />}
                </button>
              ))}
              <div className="custom-hex-box">
                <label>Custom Hex:</label>
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={e => updateSetting('accentColor', e.target.value)}
                  placeholder="#ff6471"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* THEME BACKGROUND TOGGLE */}
          <div className="config-block">
            <div className="config-block-title">
              <Moon size={16} />
              <span>Display Theme Background</span>
            </div>
            <div className="theme-duo-grid">
              <button
                type="button"
                className={`theme-duo-card ${settings.themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => updateSetting('themeMode', 'dark')}
              >
                <div className="theme-duo-preview dark" />
                <div className="theme-duo-info">
                  <strong>Dark Mode (Slate)</strong>
                  <small>Standard high-contrast dark palette (#0b1017)</small>
                </div>
                {settings.themeMode === 'dark' && <Check size={16} color="var(--mint)" />}
              </button>

              <button
                type="button"
                className={`theme-duo-card ${settings.themeMode === 'amoled' ? 'active' : ''}`}
                onClick={() => updateSetting('themeMode', 'amoled')}
              >
                <div className="theme-duo-preview amoled" />
                <div className="theme-duo-info">
                  <strong>AMOLED Pure Black</strong>
                  <small>True #000000 background · Up to 24% OLED power saving</small>
                </div>
                {settings.themeMode === 'amoled' && <Check size={16} color="var(--mint)" />}
              </button>
            </div>
          </div>

          {/* CHAT DENSITY & LAYOUT CONTROLS */}
          <div className="config-block">
            <div className="config-block-title">
              <Layers size={16} />
              <span>Chat Density & Visual Details</span>
            </div>
            <div className="density-options-grid">
              {(['cozy', 'compact', 'minimal'] as const).map(density => (
                <button
                  key={density}
                  type="button"
                  className={`density-btn ${settings.chatDensity === density ? 'active' : ''}`}
                  onClick={() => updateSetting('chatDensity', density)}
                >
                  <strong style={{ textTransform: 'capitalize' }}>{density}</strong>
                  <small>{density === 'cozy' ? 'Spacious with full avatars' : density === 'compact' ? 'Condensed padding' : 'Maximized text flow'}</small>
                  {settings.chatDensity === density && <Check size={14} color="var(--mint)" />}
                </button>
              ))}
            </div>

            <div className="extra-toggles-row">
              <div className="extra-toggle-item">
                <div>
                  <strong>Spoiler Auto-Reveal</strong>
                  <p>Renders all spoiler text blocks visible without needing to tap them.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.spoilerAutoReveal}
                    onChange={e => updateSetting('spoilerAutoReveal', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="extra-toggle-item">
                <div>
                  <strong>Avatar Geometry Shape</strong>
                  <p>Select avatar border style in chat feeds and profile viewports.</p>
                </div>
                <select
                  value={settings.avatarShape}
                  onChange={e => updateSetting('avatarShape', e.target.value as any)}
                  className="shape-select"
                >
                  <option value="rounded">Rounded Square (Assault Modern)</option>
                  <option value="circle">Classic Circle</option>
                  <option value="hexagon">Cyber Hexagon</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHAT & PRESENCE */}
      {activeCategory === 'chat' && (
        <div className="chat-config-container">
          <div className="config-block">
            <div className="config-block-title">
              <Smile size={16} />
              <span>Nitro Emote Emulation</span>
            </div>
            <div className="mod-card-top" style={{ border: 'none', padding: 0 }}>
              <div className="mod-info">
                <p>Send animated stickers and custom emotes from servers without requiring a paid Nitro subscription. Emotes are transparently dispatched as high-resolution WebP image embeds.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.nitroEmotes}
                  onChange={e => updateSetting('nitroEmotes', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="config-block">
            <div className="config-block-title">
              <Radio size={16} />
              <span>Custom Rich Presence Spoofing ($activity)</span>
            </div>
            <p className="config-block-desc">
              Broadcast custom presence titles to your friends list without requiring a desktop RPC client or bot server.
            </p>
            <div className="presence-builder-grid">
              <div className="presence-type-field">
                <label>Presence Type:</label>
                <select
                  value={settings.presenceType}
                  onChange={e => updateSetting('presenceType', e.target.value as any)}
                  className="shape-select"
                >
                  <option value="Playing">Playing</option>
                  <option value="Streaming">Streaming</option>
                  <option value="Listening">Listening to</option>
                  <option value="Watching">Watching</option>
                </select>
              </div>
              <div className="presence-text-field">
                <label>Activity Title & Details:</label>
                <input
                  type="text"
                  value={settings.presenceText}
                  onChange={e => updateSetting('presenceText', e.target.value)}
                  placeholder="e.g. Assault v2.9.2 on Android 16"
                  maxLength={64}
                />
              </div>
            </div>
            <div className="presence-live-preview">
              <div className="presence-preview-dot" />
              <span>
                <strong>{settings.presenceType}</strong> {settings.presenceText}
              </span>
            </div>
          </div>

          <div className="config-block">
            <div className="config-block-title">
              <Activity size={16} />
              <span>Quick Reactions Bar</span>
            </div>
            <p className="config-block-desc">Customize your 1-tap reaction strip for rapid message acknowledgments.</p>
            <div className="reactions-pill-row">
              {settings.quickReactions.map((emoji, idx) => (
                <div key={idx} className="reaction-chip">
                  <span>{emoji}</span>
                </div>
              ))}
              <span className="reaction-note">Configurable through AS quick menu</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SLASH COMMANDS & TOOLS */}
      {activeCategory === 'presets' && (
        <div className="tools-container">
          <div className="config-block">
            <div className="config-block-title">
              <Code size={16} />
              <span>Assault Slash Command Reference</span>
            </div>
            <p className="config-block-desc">
              Built-in client commands available directly in any chat channel without server bot invites.
            </p>
            <div className="slash-commands-list">
              {[
                { cmd: '/assault export', desc: 'Generate standalone offline HTML transcript for current channel with anti-delete retention' },
                { cmd: '/assault export-all', desc: 'Export all cached channels into a zipped transcript package' },
                { cmd: '/assault ghost-pings', desc: 'Display audit log of deleted mentions with user tags and timestamps' },
                { cmd: '/assault search <query>', desc: 'Search current in-memory message history including deleted messages' },
                { cmd: '/assault clean-cache', desc: 'Trim resident memory and purge expired retention buffers' },
              ].map(item => (
                <div key={item.cmd} className="slash-command-row">
                  <code>{item.cmd}</code>
                  <p>{item.desc}</p>
                  <button
                    type="button"
                    className="copy-cmd-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(item.cmd);
                      setTestSlashCommand(item.cmd);
                      if (onLog) onLog(`Copied command: ${item.cmd}`, 'info', 'COMMAND');
                    }}
                  >
                    {testSlashCommand === item.cmd ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="config-block">
            <div className="config-block-title">
              <Settings size={16} />
              <span>Developer & Runtime Diagnostics</span>
            </div>
            <div className="mod-card-top" style={{ border: 'none', padding: 0 }}>
              <div className="mod-info">
                <strong>Raw Gateway Frame Inspector & Debug Logs</strong>
                <p>Enables detailed WebSockets frame interception and in-client debugger window for custom plugin developers.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.developerTools}
                  onChange={e => updateSetting('developerTools', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AUTOMOD & SAFETY SHIELD */}
      {activeCategory === 'automod' && (
        <div style={{ marginTop: 8 }}>
          <AutomodShieldSettings compact={false} onLog={onLog} />
        </div>
      )}

      {/* PROFILE JSON IMPORT MODAL */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Import Mod Configuration</h4>
              <button type="button" className="close-btn" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <p className="modal-desc">Paste your exported Assault JSON configuration below to restore all mod settings.</p>
            <textarea
              className="import-textarea"
              rows={8}
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder="Paste JSON here..."
            />
            {importError && <p className="import-error-msg">{importError}</p>}
            <div className="modal-footer">
              <button type="button" className="action-btn" onClick={downloadConfig}>
                <Download size={13} /> Save Current to File
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="action-btn" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button type="button" className="primary-button" style={{ padding: '8px 16px' }} onClick={handleImport}>
                  Apply Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
