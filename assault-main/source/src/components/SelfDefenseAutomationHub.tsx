import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Zap,
  Terminal,
  Clock,
  MessageSquare,
  Smile,
  Sliders,
  UserCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  AutomationConfig,
  getAutomationConfig,
  saveAutomationConfig,
  generateHumanTypo,
  generateEscalatedAfkResponse,
} from '../services/automationStorage';

interface Props {
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
}

export function SelfDefenseAutomationHub({ onLog }: Props) {
  const [cfg, setCfg] = useState<AutomationConfig>(getAutomationConfig);
  const [activeTab, setActiveTab] = useState<'agct' | 'reactions' | 'wpm' | 'afk' | 'jokes' | 'terminal'>('agct');

  // AGCT form
  const [newGcWlId, setNewGcWlId] = useState('');
  const [trapSimulationOutput, setTrapSimulationOutput] = useState<string | null>(null);

  // Reactions form
  const [newTargetUser, setNewTargetUser] = useState('');
  const [newTargetEmoji, setNewTargetEmoji] = useState('🔥');

  // WPM & Typo Live Tester
  const [testInputText, setTestInputText] = useState('hey bro are you ready for the raid defense?');
  const [typoResultText, setTypoResultText] = useState('');

  // AFK Counter Tester
  const [simulatedCheckCount, setSimulatedCheckCount] = useState(1);
  const [simulatedUsername, setSimulatedUsername] = useState('rival_user');
  const [afkOutput, setAfkOutput] = useState('');

  // Jokes
  const [newJokeText, setNewJokeText] = useState('');
  const [jokeFilterWord, setJokeFilterWord] = useState('');

  // Terminal CLI
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState<Array<{ cmd: string; output: string; time: string }>>([
    {
      cmd: '$status',
      output: 'Active: Yes | Triggers: Enabled | WPM: 80-120 | AGCT: Armed | Reactions: 2 active',
      time: '12:00:15',
    },
  ]);

  const currentConfig = useRef(cfg);
  const updateConfig = (updater: (prev: AutomationConfig) => AutomationConfig) => {
    const next = updater(currentConfig.current);
    currentConfig.current = next;
    setCfg(next);
    if (!saveAutomationConfig(next)) onLog?.('Settings could not be saved; this preview will reset on reload.', 'error', 'STORAGE');
  };

  // Run Typo Simulation
  const handleTestTypo = () => {
    const typo = generateHumanTypo(testInputText, cfg.wpm.typoChance);
    setTypoResultText(typo);
    onLog?.(`Simulated human typing typo with ${cfg.wpm.typoChance}% chance: "${typo}"`, 'info', 'WPM');
  };

  // Run AFK Counter Simulation
  useEffect(() => {
    setAfkOutput(generateEscalatedAfkResponse(simulatedCheckCount, simulatedUsername));
  }, [simulatedCheckCount, simulatedUsername]);

  // Execute Simulated CLI Command
  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    if (!cliInput.trim().startsWith(cfg.prefix)) { onLog?.(`Commands must start with ${cfg.prefix}`, 'warning', 'TERMINAL'); return; }

    const trimmed = cliInput.trim();
    const args = trimmed.slice(cfg.prefix.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase() || '';
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let response = '';

    if (cmd === 'status' || cmd === 's') {
      response = `[STATUS] Active: ${cfg.triggerEnabled ? 'YES' : 'NO'} | Target: None | WPM: ${cfg.wpm.normalWpmRange[0]}-${cfg.wpm.normalWpmRange[1]} | Caps: ${cfg.capsMode ? 'ON' : 'OFF'} | AGCT: ${cfg.agct.enabled ? 'ARMED' : 'OFF'} | Reactions: ${Object.keys(cfg.reactions.reactTargets).length} targets`;
    } else if (cmd === 'pc') {
      const chance = parseInt(args[0]);
      if (!isNaN(chance)) {
        updateConfig(c => ({ ...c, pingChance: Math.max(0, Math.min(100, chance)) }));
        response = `ping chance set to ${Math.max(0, Math.min(100, chance))}%`;
      } else {
        response = `usage: ${cfg.prefix}pc <0-100>`;
      }
    } else if (cmd === 'caps') {
      const state = args[0]?.toLowerCase() === 'on';
      updateConfig(c => ({ ...c, capsMode: state }));
      response = `caps mode ${state ? 'ON' : 'OFF'}`;
    } else if (cmd === 'afk') {
      const state = args[0]?.toLowerCase() === 'on';
      updateConfig(c => ({ ...c, afkEnabled: state }));
      response = `afk monitoring ${state ? 'ON' : 'OFF'}`;
    } else if (cmd === 'r') {
      if (!args[0]) {
        response = `usage: ${cfg.prefix}r <emoji> [@user]`;
      } else if (args[1]) {
        const u = args[1].replace(/[<@!>]/g, '');
        updateConfig(c => ({
          ...c,
          reactions: { ...c.reactions, reactTargets: { ...c.reactions.reactTargets, [u]: args[0] } },
        }));
        response = `set reaction ${args[0]} for user ${u}`;
      } else {
        updateConfig(c => ({
          ...c,
          reactions: { ...c.reactions, botReaction: args[0] },
        }));
        response = `set global bot reaction ${args[0]}`;
      }
    } else if (cmd === 'rend') {
      updateConfig(c => ({
        ...c,
        reactions: { botReaction: null, reactTargets: {} },
      }));
      response = 'all auto-reactions stopped';
    } else if (cmd === 'agct') {
      response = `[AGCT STATUS] ${cfg.agct.enabled ? 'ACTIVE & ARMED' : 'DISABLED'} | Whitelist: ${cfg.agct.whitelist.length} users | Trap Msg: "${cfg.agct.trapMessage}"`;
    } else if (cmd === 'stop') {
      updateConfig(c => ({ ...c, triggerEnabled: false, afkEnabled: false, agct: { ...c.agct, enabled: false }, reactions: { botReaction: null, reactTargets: {} } }));
      response = 'Preview automation stopped';
    } else if (cmd === 'wpm') {
      response = `Preview typing range: ${cfg.wpm.normalWpmRange.join('-')} WPM; slow: ${cfg.wpm.slowWpm} WPM`;
    } else if (cmd === 'help' || cmd === 'h') {
      response = `Commands: ${cfg.prefix}status, ${cfg.prefix}pc <0-100>, ${cfg.prefix}caps <on/off>, ${cfg.prefix}afk <on/off>, ${cfg.prefix}r <emoji>, ${cfg.prefix}rend, ${cfg.prefix}agct, ${cfg.prefix}wpm, ${cfg.prefix}stop`;
    } else {
      response = `Unknown command: ${trimmed}. Type ${cfg.prefix}help for command list.`;
    }

    setCliHistory(prev => [{ cmd: trimmed, output: response, time: nowStr }, ...prev.slice(0, 19)]);
    setCliInput('');
    onLog?.(`CLI executed: "${trimmed}" → ${response}`, 'info', 'TERMINAL');
  };

  return (
    <section className="self-defense-hub-section" id="automation-hub" role="region" aria-label="Self-Defense Automation Hub">
      <p role="note">Local simulator: these settings and command previews do not control a connected Discord account. Native account controls are configured in the Android app.</p>
      <div className="hub-header">
        <div className="hub-title-group">
          <div className="hub-icon-badge">
            <Shield size={20} color="#ff6471" />
          </div>
          <div>
            <div className="hub-eyebrow">DEFENSE & AUTO-RESPONSE ENGINE</div>
            <h3>Self-Defense Automation Hub</h3>
            <p className="hub-subtitle">
              Integrated anti-trap countermeasures, automated reaction matrix, humanized WPM typo generation, and escalated AFK responder.
            </p>
          </div>
        </div>

        <div className="hub-quick-chips">
          <span className="hub-status-chip">
            <span className="hub-dot live" /> AGCT: {cfg.agct.enabled ? 'ARMED' : 'OFF'}
          </span>
          <span className="hub-status-chip">
            <Clock size={12} /> {cfg.wpm.normalWpmRange[0]}-{cfg.wpm.normalWpmRange[1]} WPM
          </span>
          <span className="hub-status-chip">
            <Zap size={12} color="#ff6471" /> Prefix: <code>{cfg.prefix}</code>
          </span>
        </div>
      </div>

      {/* HUB SECTION TABS */}
      <div className="hub-tabs-bar">
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'agct' ? 'active' : ''}`}
          onClick={() => setActiveTab('agct')}
        >
          <Shield size={14} />
          <span>AGCT Group-Chat Trap</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'reactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('reactions')}
        >
          <Smile size={14} />
          <span>Auto-Reaction Matrix</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'wpm' ? 'active' : ''}`}
          onClick={() => setActiveTab('wpm')}
        >
          <Sliders size={14} />
          <span>WPM & Typo Engine</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'afk' ? 'active' : ''}`}
          onClick={() => setActiveTab('afk')}
        >
          <Clock size={14} />
          <span>AFK Counter Guardian</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'jokes' ? 'active' : ''}`}
          onClick={() => setActiveTab('jokes')}
        >
          <MessageSquare size={14} />
          <span>Response & Joke DB</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
          onClick={() => setActiveTab('terminal')}
        >
          <Terminal size={14} />
          <span>Live CLI Terminal</span>
        </button>
      </div>

      {/* TAB 1: AGCT GROUP CHAT TRAP DEFENSE */}
      {activeTab === 'agct' && (
        <div className="hub-panel-body">
          <div className="panel-grid-2col">
            <div className="hub-card">
              <div className="card-header-row">
                <div className="card-title">
                  <Shield size={16} color="#ff6471" />
                  <strong>Anti-Group-Chat Trap (AGCT) Settings</strong>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={cfg.agct.enabled}
                    onChange={e => updateConfig(c => ({ ...c, agct: { ...c.agct, enabled: e.target.checked } }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <p className="card-desc">
                When added to an unauthorized Group DM, Assault automatically changes the GC name, uploads the trap icon, fires the warning payload, and purges the channel.
              </p>

              <div className="field-group">
                <label>Counter-Attack Trap Message:</label>
                <input
                  type="text"
                  value={cfg.agct.trapMessage}
                  onChange={e => updateConfig(c => ({ ...c, agct: { ...c.agct, trapMessage: e.target.value } }))}
                  className="hub-input"
                />
              </div>

              <div className="field-group">
                <label>Auto-Delete Group Channel Delay (ms):</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={cfg.agct.autoDeleteDelay}
                  onChange={e => updateConfig(c => ({ ...c, agct: { ...c.agct, autoDeleteDelay: Number(e.target.value) } }))}
                  className="hub-input"
                />
              </div>

              <div className="field-group">
                <label>Trap Icon Avatar URL:</label>
                <input
                  type="text"
                  value={cfg.agct.trapIconUrl}
                  onChange={e => updateConfig(c => ({ ...c, agct: { ...c.agct, trapIconUrl: e.target.value } }))}
                  className="hub-input"
                />
              </div>

              <button
                type="button"
                className="hub-action-btn primary"
                onClick={() => {
                  setTrapSimulationOutput(
                    `[SIMULATION] Trap activated on unauthorized Group DM:\n` +
                    `1. Renamed to: "u cant trap a god fucking dork"\n` +
                    `2. Set Avatar: ${cfg.agct.trapIconUrl}\n` +
                    `3. Sent Payload: "${cfg.agct.trapMessage}"\n` +
                    `4. Deleted Group DM channel in ${cfg.agct.autoDeleteDelay}ms.`
                  );
                  onLog?.('Simulated AGCT Group Trap interception', 'warning', 'AGCT');
                }}
              >
                <Play size={13} />
                Test Trap Countermeasure
              </button>
            </div>

            <div className="hub-card">
              <div className="card-title">
                <UserCheck size={16} color="#38bdf8" />
                <strong>Whitelisted User IDs (Safe to create GCs with)</strong>
              </div>
              <p className="card-desc">
                Users on this whitelist are authorized to create group chats with you without triggering the AGCT wipe.
              </p>

              <div className="add-row">
                <input
                  type="text"
                  placeholder="Enter Discord User ID (e.g. 104928472918274910)"
                  value={newGcWlId}
                  onChange={e => setNewGcWlId(e.target.value)}
                  className="hub-input"
                />
                <button
                  type="button"
                  className="hub-action-btn"
                  onClick={() => {
                    if (newGcWlId.trim() && !cfg.agct.whitelist.includes(newGcWlId.trim())) {
                      updateConfig(c => ({
                        ...c,
                        agct: { ...c.agct, whitelist: [...c.agct.whitelist, newGcWlId.trim()] },
                      }));
                      setNewGcWlId('');
                      onLog?.(`Added user ID ${newGcWlId.trim()} to AGCT whitelist`, 'success', 'AGCT');
                    }
                  }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              <div className="whitelist-pills-list">
                {cfg.agct.whitelist.map(id => (
                  <div key={id} className="wl-pill">
                    <code>{id}</code>
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig(c => ({
                          ...c,
                          agct: { ...c.agct, whitelist: c.agct.whitelist.filter(x => x !== id) },
                        }))
                      }
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>

              {trapSimulationOutput && (
                <div className="sim-output-box">
                  <div className="sim-output-header">LIVE SIMULATION LOG</div>
                  <pre>{trapSimulationOutput}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTO-REACTION MATRIX */}
      {activeTab === 'reactions' && (
        <div className="hub-panel-body">
          <div className="panel-grid-2col">
            <div className="hub-card">
              <div className="card-title">
                <Smile size={16} color="#f59e0b" />
                <strong>Global Bot Self-Reaction ($r &lt;emoji&gt;)</strong>
              </div>
              <p className="card-desc">
                Automatically react with this emoji to all messages sent by your account across Discord channels.
              </p>

              <div className="field-group">
                <label>Default Self Reaction Emoji:</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={cfg.reactions.botReaction || ''}
                    placeholder="e.g. 🔥, 🛡️, 👑"
                    onChange={e => updateConfig(c => ({ ...c, reactions: { ...c.reactions, botReaction: e.target.value || null } }))}
                    className="hub-input"
                    style={{ fontSize: 16, width: 80, textAlign: 'center' }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['🔥', '🛡️', '👑', '⚡', '💯', '💀'].map(em => (
                      <button
                        key={em}
                        type="button"
                        className="emoji-preset-btn"
                        onClick={() => updateConfig(c => ({ ...c, reactions: { ...c.reactions, botReaction: em } }))}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="hub-action-btn"
                onClick={() => updateConfig(c => ({ ...c, reactions: { ...c.reactions, botReaction: null } }))}
              >
                Clear Self-Reaction
              </button>
            </div>

            <div className="hub-card">
              <div className="card-title">
                <Zap size={16} color="#ff6471" />
                <strong>Targeted User Auto-Reactions ($r &lt;emoji&gt; @user)</strong>
              </div>
              <p className="card-desc">
                Whenever these targeted users post messages, Assault automatically attaches the assigned reaction emoji.
              </p>

              <div className="add-row">
                <input
                  type="text"
                  placeholder="Target User ID"
                  value={newTargetUser}
                  onChange={e => setNewTargetUser(e.target.value)}
                  className="hub-input"
                  style={{ flex: 2 }}
                />
                <input
                  type="text"
                  placeholder="Emoji"
                  value={newTargetEmoji}
                  onChange={e => setNewTargetEmoji(e.target.value)}
                  className="hub-input"
                  style={{ width: 60, textAlign: 'center', fontSize: 15 }}
                />
                <button
                  type="button"
                  className="hub-action-btn primary"
                  onClick={() => {
                    if (newTargetUser.trim() && newTargetEmoji.trim()) {
                      updateConfig(c => ({
                        ...c,
                        reactions: {
                          ...c.reactions,
                          reactTargets: { ...c.reactions.reactTargets, [newTargetUser.trim()]: newTargetEmoji.trim() },
                        },
                      }));
                      setNewTargetUser('');
                      onLog?.(`Mapped auto-reaction ${newTargetEmoji} for user ${newTargetUser}`, 'success', 'REACT');
                    }
                  }}
                >
                  <Plus size={13} /> Map
                </button>
              </div>

              <div className="react-targets-grid">
                {Object.entries(cfg.reactions.reactTargets).map(([uid, em]) => (
                  <div key={uid} className="target-card">
                    <span className="target-emoji">{em}</span>
                    <div className="target-info">
                      <strong>User ID:</strong>
                      <code>{uid}</code>
                    </div>
                    <button
                      type="button"
                      className="target-del-btn"
                      onClick={() => {
                        updateConfig(c => {
                          const copy = { ...c.reactions.reactTargets };
                          delete copy[uid];
                          return { ...c, reactions: { ...c.reactions, reactTargets: copy } };
                        });
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WPM & TYPO ENGINE */}
      {activeTab === 'wpm' && (
        <div className="hub-panel-body">
          <div className="panel-grid-2col">
            <div className="hub-card">
              <div className="card-title">
                <Sliders size={16} color="#38bdf8" />
                <strong>WPM & Typing Speed Tuning</strong>
              </div>
              <p className="card-desc">
                Adjust realistic human typing speeds to prevent Discord anti-bot gateway rate limits (`status: 429`).
              </p>

              <div className="field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>Normal WPM Range:</span>
                  <strong style={{ color: '#ff6471' }}>{cfg.wpm.normalWpmRange[0]} - {cfg.wpm.normalWpmRange[1]} WPM</strong>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="range"
                    min="50"
                    max="110"
                    value={cfg.wpm.normalWpmRange[0]}
                    onChange={e => updateConfig(c => ({ ...c, wpm: { ...c.wpm, normalWpmRange: [Number(e.target.value), c.wpm.normalWpmRange[1]] } }))}
                    style={{ flex: 1, accentColor: '#ff6471' }}
                  />
                  <input
                    type="range"
                    min="110"
                    max="180"
                    value={cfg.wpm.normalWpmRange[1]}
                    onChange={e => updateConfig(c => ({ ...c, wpm: { ...c.wpm, normalWpmRange: [c.wpm.normalWpmRange[0], Number(e.target.value)] } }))}
                    style={{ flex: 1, accentColor: '#ff6471' }}
                  />
                </div>
              </div>

              <div className="field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>Slow WPM (Fallback during Discord Rate Limits):</span>
                  <strong style={{ color: '#f59e0b' }}>{cfg.wpm.slowWpm} WPM</strong>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={cfg.wpm.slowWpm}
                  onChange={e => updateConfig(c => ({ ...c, wpm: { ...c.wpm, slowWpm: Number(e.target.value) } }))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>

              <div className="field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>Natural QWERTY Typo Chance:</span>
                  <strong style={{ color: '#10b981' }}>{cfg.wpm.typoChance}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={cfg.wpm.typoChance}
                  onChange={e => updateConfig(c => ({ ...c, wpm: { ...c.wpm, typoChance: Number(e.target.value) } }))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>
            </div>

            <div className="hub-card">
              <div className="card-title">
                <Sparkles size={16} color="#ff6471" />
                <strong>Live Human Typo Simulator</strong>
              </div>
              <p className="card-desc">
                Simulates real-world keyboard proximity slips (e.g. typing adjacent keys like 'w' for 'e' or space slips).
              </p>

              <div className="field-group">
                <label>Input Message to Humanize:</label>
                <input
                  type="text"
                  value={testInputText}
                  onChange={e => setTestInputText(e.target.value)}
                  className="hub-input"
                />
              </div>

              <button
                type="button"
                className="hub-action-btn primary"
                onClick={handleTestTypo}
              >
                <Sparkles size={13} />
                Generate Human Typo
              </button>

              {typoResultText && (
                <div className="sim-output-box">
                  <div className="sim-output-header">HUMANIZED OUTPUT PREVIEW</div>
                  <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{typoResultText}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AFK COUNTER GUARDIAN */}
      {activeTab === 'afk' && (
        <div className="hub-panel-body">
          <div className="panel-grid-2col">
            <div className="hub-card">
              <div className="card-header-row">
                <div className="card-title">
                  <Clock size={16} color="#ff6471" />
                  <strong>AFK Check Responder ($afk &lt;on/off&gt;)</strong>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={cfg.afkEnabled}
                    onChange={e => updateConfig(c => ({ ...c, afkEnabled: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <p className="card-desc">
                When rivals ping you with "afk check" or "client check", Assault automatically detects the attempt, prevents self-insult entrapment, and responds with a dynamic escalated counter.
              </p>

              <div className="field-group">
                <label>Simulate Check Counter (#):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={simulatedCheckCount}
                    onChange={e => setSimulatedCheckCount(Math.max(1, Number(e.target.value)))}
                    className="hub-input"
                    style={{ width: 80 }}
                  />
                  <input
                    type="text"
                    placeholder="Challenger Username"
                    value={simulatedUsername}
                    onChange={e => setSimulatedUsername(e.target.value)}
                    className="hub-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="sim-output-box" style={{ marginTop: 12 }}>
                <div className="sim-output-header">DYNAMIC ESCALATION RESPONSE (CHECK #{simulatedCheckCount})</div>
                <div style={{ fontSize: 13, color: '#ff6471', fontWeight: 700 }}>"{afkOutput}"</div>
              </div>
            </div>

            <div className="hub-card">
              <div className="card-title">
                <AlertTriangle size={16} color="#f59e0b" />
                <strong>Anti-Self-Insult Guard &amp; Blacklist Filter</strong>
              </div>
              <p className="card-desc">
                Prevents trick commands like <code>say "im a pedo"</code> from trapping your account into saying self-incriminating phrases by flipping "I am" to "You are".
              </p>

              <div className="field-group">
                <label>Blacklisted Keywords:</label>
                <div className="whitelist-pills-list">
                  {cfg.blacklistedWords.map(w => (
                    <div key={w} className="wl-pill">
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: JOKE / RESPONSE VAULT */}
      {activeTab === 'jokes' && (
        <div className="hub-panel-body">
          <div className="hub-card">
            <div className="card-header-row">
              <div className="card-title">
                <MessageSquare size={16} color="#38bdf8" />
                <strong>Automated Joke &amp; Counter Database ({cfg.jokes.length} entries)</strong>
              </div>
              <button
                type="button"
                className="hub-action-btn"
                onClick={() => {
                  updateConfig(c => ({
                    ...c,
                    jokes: [...c.jokes].sort(() => Math.random() - 0.5),
                  }));
                  onLog?.('Shuffled automated response cycle ($shuffle)', 'info', 'JOKES');
                }}
              >
                <RotateCcw size={12} /> $shuffle
              </button>
            </div>

            <div className="add-row">
              <input
                type="text"
                placeholder="Add custom automated response or joke..."
                value={newJokeText}
                onChange={e => setNewJokeText(e.target.value)}
                className="hub-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="hub-action-btn primary"
                onClick={() => {
                  if (newJokeText.trim()) {
                    updateConfig(c => ({ ...c, jokes: [...c.jokes, newJokeText.trim()] }));
                    setNewJokeText('');
                    onLog?.('Added new entry to joke vault', 'success', 'JOKES');
                  }
                }}
              >
                <Plus size={13} /> Add
              </button>
            </div>

            <div className="add-row" style={{ marginTop: 8 }}>
              <input
                type="text"
                placeholder="Filter/Delete jokes containing word ($jw <word>)..."
                value={jokeFilterWord}
                onChange={e => setJokeFilterWord(e.target.value)}
                className="hub-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="hub-action-btn"
                onClick={() => {
                  if (jokeFilterWord.trim()) {
                    const word = jokeFilterWord.trim().toLowerCase();
                    const filtered = cfg.jokes.filter(j => !j.toLowerCase().includes(word));
                    const count = cfg.jokes.length - filtered.length;
                    updateConfig(c => ({ ...c, jokes: filtered }));
                    setJokeFilterWord('');
                    onLog?.(`Removed ${count} entries containing '${word}' ($jw)`, 'warning', 'JOKES');
                  }
                }}
              >
                <Trash2 size={12} /> Purge by Word ($jw)
              </button>
            </div>

            <div className="jokes-list-scroll">
              {cfg.jokes.map((jk, idx) => (
                <div key={idx} className="joke-item-row">
                  <span>{jk}</span>
                  <button
                    type="button"
                    onClick={() => updateConfig(c => ({ ...c, jokes: c.jokes.filter((_, i) => i !== idx) }))}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LIVE CLI TERMINAL */}
      {activeTab === 'terminal' && (
        <div className="hub-panel-body">
          <div className="hub-card terminal-card">
            <div className="terminal-header-bar">
              <span className="term-dot red" />
              <span className="term-dot yellow" />
              <span className="term-dot green" />
              <span className="term-title">assault-selfbot-v13 ~ bash</span>
            </div>

            <div className="terminal-screen">
              <div className="term-banner">
                {`┌─────────────────────────────────────────────────────────────────┐
│                            DONT DIE                             │
│                        restrict x vital                         │
│                             #envy                               │
└─────────────────────────────────────────────────────────────────┘`}
              </div>

              {cliHistory.map((item, idx) => (
                <div key={idx} className="term-entry">
                  <div className="term-cmd-line">
                    <span className="term-prompt">{cfg.prefix}&gt;</span>
                    <strong>{item.cmd}</strong>
                    <span className="term-time">{item.time}</span>
                  </div>
                  <div className="term-out-line">{item.output}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleRunCommand} className="terminal-input-form">
              <span className="term-prompt">{cfg.prefix}&gt;</span>
              <input
                type="text"
                value={cliInput}
                onChange={e => setCliInput(e.target.value)}
                placeholder={`Try: ${cfg.prefix}status, ${cfg.prefix}pc 85, ${cfg.prefix}caps on, ${cfg.prefix}rlist...`}
                className="terminal-text-input"
              />
              <button type="submit" className="terminal-submit-btn">Execute</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
