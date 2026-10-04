import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Link,
  Filter,
  Volume2,
  VolumeX,
  MessageSquare,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Play,
  Sparkles,
} from 'lucide-react';
import {
  AutomodSettings,
  DEFAULT_AUTOMOD_SETTINGS,
  getAutomodSettings,
  saveAutomodSettings,
  subscribeAutomodSettings,
  validateChatMessage,
  playShieldSound,
} from '../services/automodSettingsStorage';
import '../automod.css';

interface Props {
  compact?: boolean;
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
}

export function AutomodShieldSettings({ compact = false, onLog }: Props) {
  const [settings, setSettings] = useState<AutomodSettings>(getAutomodSettings);
  const [newKeyword, setNewKeyword] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newReply, setNewReply] = useState('');
  const [testText, setTestText] = useState('free-nitro on discordapp.gift/free');
  const [testResult, setTestResult] = useState(() => validateChatMessage('free-nitro on discordapp.gift/free', getAutomodSettings()));
  const [saveError, setSaveError] = useState(false);
  const [saveConfirmed, setSaveConfirmed] = useState(false);

  // Synchronize state with persistent storage changes
  useEffect(() => {
    return subscribeAutomodSettings(updated => {
      setSettings(updated);
    });
  }, []);

  // Update test output whenever test input or settings change
  useEffect(() => {
    setTestResult(validateChatMessage(testText, settings));
  }, [testText, settings]);

  function updateSetting<K extends keyof AutomodSettings>(key: K, value: AutomodSettings[K]) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaveError(!saveAutomodSettings(updated));
    if (onLog) {
      onLog(`Automod rule updated: ${String(key)} → ${String(value)}`, 'info', 'AUTOMOD');
    }
  }

  function handleAddKeyword() {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed || settings.blacklistedKeywords.includes(trimmed)) return;
    const updated = {
      ...settings,
      blacklistedKeywords: [...settings.blacklistedKeywords, trimmed],
    };
    setSettings(updated);
    setSaveError(!saveAutomodSettings(updated));
    setNewKeyword('');
    if (onLog) onLog(`Added keyword filter: "${trimmed}"`, 'success', 'AUTOMOD');
  }

  function handleRemoveKeyword(keyword: string) {
    const updated = {
      ...settings,
      blacklistedKeywords: settings.blacklistedKeywords.filter(k => k !== keyword),
    };
    setSettings(updated);
    setSaveError(!saveAutomodSettings(updated));
    if (onLog) onLog(`Removed keyword filter: "${keyword}"`, 'info', 'AUTOMOD');
  }

  function handleAddAutoReply() {
    const trigger = newTrigger.trim();
    const reply = newReply.trim();
    if (!trigger || !reply) return;
    const rule = {
      id: `rule-${Date.now()}`,
      trigger,
      reply,
      enabled: true,
    };
    const updated = {
      ...settings,
      autoReplies: [...settings.autoReplies, rule],
    };
    setSettings(updated);
    setSaveError(!saveAutomodSettings(updated));
    setNewTrigger('');
    setNewReply('');
    if (onLog) onLog(`Registered auto-responder: "${trigger}" → "${reply}"`, 'success', 'AUTOMOD');
  }

  function handleToggleRule(ruleId: string) {
    const updated = {
      ...settings,
      autoReplies: settings.autoReplies.map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    };
    setSettings(updated);
    setSaveError(!saveAutomodSettings(updated));
  }

  function handleDeleteRule(ruleId: string) {
    const updated = {
      ...settings,
      autoReplies: settings.autoReplies.filter(r => r.id !== ruleId),
    };
    setSettings(updated);
    setSaveError(!saveAutomodSettings(updated));
  }

  function handleResetDefaults() {
    const defaults = structuredClone(DEFAULT_AUTOMOD_SETTINGS);
    setSettings(defaults);
    const saved = saveAutomodSettings(defaults);
    setSaveError(!saved);
    if (saved && onLog) onLog('Restored BeefBot Automod to default security rules', 'warning', 'RESET');
  }

  function testSound(type: 'alert' | 'block' | 'ping') {
    playShieldSound(type);
    if (onLog) onLog(`Tested sound synthesis: ${type}`, 'info', 'AUDIO');
  }

  return (
    <div className={`automod-container ${compact ? 'automod-compact' : ''}`}>
      {/* Header Banner */}
      <div className="automod-header-card">
        <div className="automod-header-left">
          <div className="automod-badge-icon">
            <ShieldAlert size={18} />
          </div>
          <div className="automod-header-titles">
            <strong>BeefBot Automod & Shield</strong>
            <small>Client-Side Gateway Filter & Phishing Guard</small>
          </div>
        </div>
        <div className="automod-intercept-badge">
          <span>Shield: <strong>Active</strong></span>
          <span>·</span>
          <span><strong>{settings.interceptCount}</strong> Intercepts</span>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="automod-toggle-grid">
        <div className={`automod-toggle-card ${settings.phishingGuard ? 'is-active' : ''}`}>
          <div className="automod-toggle-info">
            <Link size={16} className="automod-toggle-icon" />
            <div className="automod-toggle-text">
              <strong>Anti-Phishing URL Guard</strong>
              <small>Intercepts fake Discord Nitro & Steam gift domains</small>
            </div>
          </div>
          <label className="automod-switch">
            <input
              type="checkbox"
              checked={settings.phishingGuard}
              onChange={e => updateSetting('phishingGuard', e.target.checked)}
            />
            <span className="automod-slider" />
          </label>
        </div>

        <div className={`automod-toggle-card ${settings.keywordFilter ? 'is-active' : ''}`}>
          <div className="automod-toggle-info">
            <Filter size={16} className="automod-toggle-icon" />
            <div className="automod-toggle-text">
              <strong>Keyword & Spam Scrubber</strong>
              <small>Redacts blacklisted terms in incoming & outgoing chats</small>
            </div>
          </div>
          <label className="automod-switch">
            <input
              type="checkbox"
              checked={settings.keywordFilter}
              onChange={e => updateSetting('keywordFilter', e.target.checked)}
            />
            <span className="automod-slider" />
          </label>
        </div>

        <div className={`automod-toggle-card ${settings.soundAlerts ? 'is-active' : ''}`}>
          <div className="automod-toggle-info">
            {settings.soundAlerts ? (
              <Volume2 size={16} className="automod-toggle-icon" />
            ) : (
              <VolumeX size={16} className="automod-toggle-icon" />
            )}
            <div className="automod-toggle-text">
              <strong>Synthesized Audio Cues</strong>
              <small>Plays Web Audio chimes on intercept & alerts</small>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="automod-btn"
              style={{ padding: '3px 7px', fontSize: 10 }}
              onClick={() => testSound('block')}
              title="Test audio alert"
            >
              Test
            </button>
            <label className="automod-switch">
              <input
                type="checkbox"
                checked={settings.soundAlerts}
                onChange={e => updateSetting('soundAlerts', e.target.checked)}
              />
              <span className="automod-slider" />
            </label>
          </div>
        </div>

        <div className={`automod-toggle-card ${settings.autoReplyEnabled ? 'is-active' : ''}`}>
          <div className="automod-toggle-info">
            <MessageSquare size={16} className="automod-toggle-icon" />
            <div className="automod-toggle-text">
              <strong>Client Auto-Responder</strong>
              <small>Triggers canned replies to custom command phrases</small>
            </div>
          </div>
          <label className="automod-switch">
            <input
              type="checkbox"
              checked={settings.autoReplyEnabled}
              onChange={e => updateSetting('autoReplyEnabled', e.target.checked)}
            />
            <span className="automod-slider" />
          </label>
        </div>
      </div>

      {/* Keyword Manager */}
      <div className="automod-section-box">
        <div className="automod-section-title">
          <span>Active Blacklisted Keywords ({settings.blacklistedKeywords.length})</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.strictMode}
              onChange={e => updateSetting('strictMode', e.target.checked)}
            />
            Strict Block Mode (Full purge instead of ****)
          </label>
        </div>

        <div className="automod-input-row">
          <input
            type="text"
            className="automod-input"
            placeholder="Add keyword (e.g., free-robux, airdrop)..."
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
          />
          <button type="button" className="automod-btn automod-btn-primary" onClick={handleAddKeyword}>
            <Plus size={13} /> Add Word
          </button>
        </div>

        <div className="automod-chips-list">
          {settings.blacklistedKeywords.map(kw => (
            <span key={kw} className="automod-chip">
              <code>{kw}</code>
              <button
                type="button"
                className="automod-chip-remove"
                onClick={() => handleRemoveKeyword(kw)}
                title="Remove keyword"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Auto-Responder Rules */}
      <div className="automod-section-box">
        <div className="automod-section-title">
          <span>Canned Auto-Replies ({settings.autoReplies.length})</span>
        </div>

        <div className="automod-input-row" style={{ flexWrap: 'wrap' }}>
          <input
            type="text"
            className="automod-input"
            style={{ maxWidth: 140 }}
            placeholder="Trigger (e.g. !faq)"
            value={newTrigger}
            onChange={e => setNewTrigger(e.target.value)}
          />
          <input
            type="text"
            className="automod-input"
            placeholder="Automated Response Text..."
            value={newReply}
            onChange={e => setNewReply(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddAutoReply()}
          />
          <button type="button" className="automod-btn automod-btn-primary" onClick={handleAddAutoReply}>
            <Plus size={13} /> Add Reply
          </button>
        </div>

        <div className="automod-rules-list">
          {settings.autoReplies.map(rule => (
            <div key={rule.id} className="automod-rule-item">
              <div className="automod-rule-text">
                <span className="automod-rule-trigger">{rule.trigger}</span>
                <span className="automod-rule-reply">→ {rule.reply}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggleRule(rule.id)}
                  title="Enable/disable this rule"
                />
                <button
                  type="button"
                  className="automod-chip-remove"
                  onClick={() => handleDeleteRule(rule.id)}
                  title="Delete rule"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Interactive Shield Simulator */}
      <div className="automod-section-box">
        <div className="automod-section-title">
          <span>Interactive Shield Test Sandbox</span>
          <small style={{ color: '#94a3b8' }}>Type test messages to preview real-time filter action</small>
        </div>
        <div className="automod-input-row">
          <input
            type="text"
            className="automod-input"
            value={testText}
            onChange={e => setTestText(e.target.value)}
            placeholder="Type a test phrase..."
          />
          <button
            type="button"
            className="automod-btn"
            onClick={() => {
              if (settings.soundAlerts) {
                playShieldSound(testResult.blocked ? 'block' : 'ping');
              }
            }}
          >
            <Play size={12} /> Test Filter
          </button>
        </div>

        <div className={`automod-test-output ${testResult.safe ? 'automod-test-safe' : 'automod-test-blocked'}`}>
          {testResult.safe ? (
            <>
              <CheckCircle size={15} />
              <span>Safe message. Ready for gateway dispatch.</span>
            </>
          ) : (
            <>
              <AlertTriangle size={15} />
              <span>
                <strong>{testResult.reason === 'phishing' ? 'Phishing URL Blocked' : 'Blacklisted Keyword Intercepted'}:</strong>{' '}
                {testResult.sanitizedContent}
              </span>
            </>
          )}
        </div>
        {testResult.autoReply && (
          <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 4 }}>
            🤖 <strong>Auto-Responder trigger match:</strong> "{testResult.autoReply}"
          </div>
        )}
      </div>

      {saveError && <p role="alert">Unable to save settings. Browser storage may be full or unavailable.</p>}
      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
        <button type="button" className="automod-btn" onClick={handleResetDefaults}>
          <RotateCcw size={12} /> Reset to Defaults
        </button>
        <button
          type="button"
          className="automod-btn automod-btn-primary"
          onClick={() => {
            const saved = saveAutomodSettings(settings);
            setSaveError(!saved);
            setSaveConfirmed(saved);
            setTimeout(() => setSaveConfirmed(false), 2000);
            if (saved && onLog) onLog('Synchronized Automod settings to storage', 'success', 'STORAGE');
          }}
        >
          {saveConfirmed ? '✓ Saved' : 'Apply & Save Settings'}
        </button>
      </div>
    </div>
  );
}
