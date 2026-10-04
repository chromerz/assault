import { normalizeSettings } from './settingsValidation.ts';
// Storage service and validation engine for Assault BeefBot Automod & Safety Shield
export interface AutoReplyRule {
  id: string;
  trigger: string;
  reply: string;
  enabled: boolean;
}

export interface AutomodSettings {
  phishingGuard: boolean;
  keywordFilter: boolean;
  blacklistedKeywords: string[];
  soundAlerts: boolean;
  autoReplyEnabled: boolean;
  autoReplies: AutoReplyRule[];
  strictMode: boolean;
  interceptCount: number;
}

const STORAGE_KEY = 'assault_automod_settings_v1';

export const DEFAULT_AUTOMOD_SETTINGS: AutomodSettings = {
  phishingGuard: true,
  keywordFilter: true,
  blacklistedKeywords: ['free-nitro', 'discord-gift', 'steam-community', 'airdrop', 'claim-crypto', 't.me/free'],
  soundAlerts: true,
  autoReplyEnabled: true,
  autoReplies: [
    {
      id: 'ar-1',
      trigger: '!help',
      reply: '🛡️ BeefBot Shield active. Commands: /assault export, /assault ghost-pings, /assault search',
      enabled: true,
    },
    {
      id: 'ar-2',
      trigger: '!ping',
      reply: '⚡ Pong! Simulated latency: 1.1ms. This browser reply is a preview.',
      enabled: true,
    },
  ],
  strictMode: false,
  interceptCount: 0,
};

// Known suspicious phishing / scam URL patterns targeting Discord users
const PHISHING_REGEX = /(?:discord(?:app)?\.(?:giveaway|nitro|promo|claims)|steam(?:communltly|communilty|communlty|nitro)|free-nitro|claim-nitro|discord-drop)/i;

type SettingsListener = (settings: AutomodSettings) => void;
const listeners = new Set<SettingsListener>();

/**
 * Load persisted Automod settings from localStorage with safe fallback.
 */
export function getAutomodSettings(): AutomodSettings {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_AUTOMOD_SETTINGS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_AUTOMOD_SETTINGS);
    const parsed = JSON.parse(raw);
    return normalizeSettings(DEFAULT_AUTOMOD_SETTINGS, parsed);
  } catch (err) {
    console.warn('[Assault Automod] Failed to read from localStorage, using defaults:', err);
    return structuredClone(DEFAULT_AUTOMOD_SETTINGS);
  }
}

/**
 * Persist Automod settings and notify active subscribers.
 */
export function saveAutomodSettings(settings: AutomodSettings): boolean {
  settings = normalizeSettings(DEFAULT_AUTOMOD_SETTINGS, settings);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    listeners.forEach(fn => {
      try { fn(settings); } catch (e) { console.error(e); }
    });
    return true;
  } catch (err) {
    console.warn('[Assault Automod] Failed to save settings to localStorage:', err);
    return false;
  }
}

/**
 * Subscribe to Automod setting modifications across components.
 */
export function subscribeAutomodSettings(listener: SettingsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Validates a message content against active automod rules.
 */
export interface ValidationResult {
  safe: boolean;
  blocked: boolean;
  reason?: 'phishing' | 'keyword';
  flaggedTerm?: string;
  sanitizedContent: string;
  autoReply?: string;
}

export function validateChatMessage(content: string, settings: AutomodSettings): ValidationResult {
  let sanitized = content;
  let blocked = false;
  let reason: 'phishing' | 'keyword' | undefined;
  let flaggedTerm: string | undefined;

  // 1. Phishing & Scam URL Detection
  if (settings.phishingGuard && PHISHING_REGEX.test(content)) {
    const match = content.match(PHISHING_REGEX);
    blocked = true;
    reason = 'phishing';
    flaggedTerm = match ? match[0] : 'suspicious-link';
    sanitized = `[🛡️ Phishing Link Intercepted by BeefBot: ${flaggedTerm}]`;
  }

  // 2. Keyword Filter & Scrubber
  if (!blocked && settings.keywordFilter && settings.blacklistedKeywords.length > 0) {
    for (const kw of settings.blacklistedKeywords) {
      if (!kw || kw.trim().length === 0) continue;
      const term = kw.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`${/^\w/.test(term) ? '\\b' : ''}${escaped}${/\w$/.test(term) ? '\\b' : ''}`, 'gi');
      if (regex.test(content)) {
        if (settings.strictMode) {
          blocked = true;
          reason = 'keyword';
          flaggedTerm = term;
          sanitized = `[🛡️ Message Scrubbed: Blacklisted keyword detected]`;
          break;
        } else {
          // Soft filter: redact term with asterisks
          sanitized = sanitized.replace(regex, '****');
          reason = 'keyword';
          flaggedTerm = term;
        }
      }
    }
  }

  // 3. Auto-Reply Trigger Detection
  let autoReply: string | undefined;
  if (!blocked && settings.autoReplyEnabled && settings.autoReplies.length > 0) {
    const lower = content.trim().toLowerCase();
    for (const rule of settings.autoReplies) {
      if (rule.enabled && rule.trigger && lower === rule.trigger.trim().toLowerCase()) {
        autoReply = rule.reply;
        break;
      }
    }
  }

  return {
    safe: !blocked && !reason,
    blocked,
    reason,
    flaggedTerm,
    sanitizedContent: sanitized,
    autoReply,
  };
}

/**
 * Lightweight Web Audio Synthesizer for in-client shield sound alerts.
 * Uses zero external audio files.
 */
export function playShieldSound(type: 'alert' | 'block' | 'ping') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); void ctx.close().catch(() => {}); };

    const now = ctx.currentTime;
    if (type === 'block') {
      // Low dual-tone buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'alert') {
      // Two-tone warning beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(587.33, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Pleasant ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Gracefully ignore audio synthesis errors
  }
}
