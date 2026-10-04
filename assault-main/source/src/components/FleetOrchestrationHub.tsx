import React, { useState, useRef } from 'react';
import {
  Users,
  Gamepad2,
  Tv,
  Music,
  Radio,
  PhoneCall,
  PhoneOff,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Shield,
  Smartphone,
  Eye,
  Plus,
  Trash2,
  Clock,
  Layers,
} from 'lucide-react';
import {
  FleetConfig,
  getFleetConfig,
  saveFleetConfig,
  FleetAccount,
  QuestItem,
} from '../services/automationStorage';

interface Props {
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
}

export function FleetOrchestrationHub({ onLog }: Props) {
  const [fleetCfg, setFleetCfg] = useState<FleetConfig>(getFleetConfig);
  const [activeTab, setActiveTab] = useState<'fleet' | 'platforms' | 'quests' | 'voice' | 'rpc'>('fleet');

  // New account form
  const [newToken, setNewToken] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPlatform, setNewPlatform] = useState<FleetAccount['platform']>('vr');

  const currentConfig = useRef(fleetCfg);
  const updateFleet = (updater: (prev: FleetConfig) => FleetConfig) => {
    const next = updater(currentConfig.current);
    currentConfig.current = next;
    setFleetCfg(next);
    if (!saveFleetConfig(next)) onLog?.('Settings could not be saved; this preview will reset on reload.', 'error', 'STORAGE');
  };

  // Add account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;

    const newAcc: FleetAccount = {
      id: `acc-${crypto.randomUUID()}`,
      token: newToken.trim(),
      username: newUsername.trim() || `FleetUser-${Math.floor(Math.random() * 9000 + 1000)}`,
      discriminator: '0000',
      isMaster: fleetCfg.fleetAccounts.length === 0,
      platform: newPlatform,
      status: 'online',
      pingMs: Math.floor(Math.random() * 20 + 10),
      preserveMobileNotifs: true,
      activeQuestsCount: 0,
    };

    updateFleet(f => ({ ...f, fleetAccounts: [...f.fleetAccounts, newAcc] }));
    setNewToken('');
    setNewUsername('');
    onLog?.(`Registered new fleet account [${newAcc.username}] under ${newPlatform.toUpperCase()} signature`, 'success', 'FLEET');
  };

  // Trigger Instant Video Quest Bypass
  const handleBypassVideoQuest = (questId: string) => {
    updateFleet(f => ({
      ...f,
      quests: f.quests.map(q =>
        q.id === questId ? { ...q, progressSeconds: q.targetSeconds, completed: true } : q
      ),
    }));
    onLog?.(`Dispatched simulated Quest video progress payload (WATCH_TOTAL_MS instant bypass)`, 'success', 'QUEST');
  };

  // Claim Quest
  const handleClaimQuest = (questId: string) => {
    updateFleet(f => ({
      ...f,
      quests: f.quests.map(q => (q.id === questId ? { ...q, claimed: true } : q)),
    }));
    onLog?.(`Preview reward marked as claimed locally; Discord inventory is unchanged`, 'success', 'QUEST');
  };

  // Mass Join Voice
  const handleMassJoin = () => {
    if (!fleetCfg.voiceChannelId.trim()) return;
    updateFleet(f => ({ ...f, voiceConnected: true }));
    onLog?.(`Preview: ${fleetCfg.fleetAccounts.length} accounts shown in voice channel ${fleetCfg.voiceChannelId}`, 'success', 'VOICE');
  };

  const handleMassLeave = () => {
    updateFleet(f => ({ ...f, voiceConnected: false }));
    onLog?.(`Dispatched $ml: Left voice channel on ${fleetCfg.fleetAccounts.length} bots`, 'info', 'VOICE');
  };

  return (
    <section className="fleet-hub-section" id="fleet-hub" role="region" aria-label="Fleet & Multi-Account Orchestration Hub">
      <p role="note">Browser simulation: accounts, voice, presence and quest rewards shown here are local previews. No Discord connections or rewards are created. Use sample credentials; entered tokens stay in this tab’s memory and clear on reload.</p>
      <div className="hub-header">
        <div className="hub-title-group">
          <div className="hub-icon-badge" style={{ background: '#1c2438', borderColor: '#2d3b58', color: '#38bdf8' }}>
            <Users size={20} color="#38bdf8" />
          </div>
          <div>
            <div className="hub-eyebrow" style={{ color: '#38bdf8' }}>MULTI-ACCOUNT ORCHESTRATION &amp; PROTOCOL ENGINE</div>
            <h3>Fleet &amp; Multi-Token Orchestration</h3>
            <p className="hub-subtitle">
              Manage multi-account bot fleets, spoof hardware signatures (Quest VR, PS5, Xbox, iOS), bypass video Quests, and broadcast multi-slot Rich Presence.
            </p>
          </div>
        </div>

        <div className="hub-quick-chips">
          <span className="hub-status-chip">
            <Users size={12} color="#38bdf8" /> Fleet Size: <strong>{fleetCfg.fleetAccounts.length} Accounts</strong>
          </span>
          <span className="hub-status-chip">
            <PhoneCall size={12} color={fleetCfg.voiceConnected ? '#10b981' : '#94a3b8'} /> Voice: {fleetCfg.voiceConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
          <span className="hub-status-chip">
            <Gamepad2 size={12} color="#ff6471" /> Multi-RPC: <strong>Active (3 Slots)</strong>
          </span>
        </div>
      </div>

      {/* HUB SECTION TABS */}
      <div className="hub-tabs-bar">
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          <Users size={14} />
          <span>Fleet Accounts ({fleetCfg.fleetAccounts.length})</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'platforms' ? 'active' : ''}`}
          onClick={() => setActiveTab('platforms')}
        >
          <Gamepad2 size={14} />
          <span>Platform &amp; Device Matrix</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          <CheckCircle size={14} />
          <span>Discord Quest Auto-Claimer</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          <PhoneCall size={14} />
          <span>Fleet Voice Coordinator</span>
        </button>
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'rpc' ? 'active' : ''}`}
          onClick={() => setActiveTab('rpc')}
        >
          <Radio size={14} />
          <span>Multi-Card Rich Presence</span>
        </button>
      </div>

      {/* TAB 1: FLEET ACCOUNTS & TOKENS */}
      {activeTab === 'fleet' && (
        <div className="hub-panel-body">
          <div className="panel-grid-2col">
            <div className="hub-card">
              <div className="card-title">
                <Plus size={16} color="#38bdf8" />
                <strong>Add Fleet Account / Token</strong>
              </div>
              <p className="card-desc">
                Tokens remain in this tab’s memory and clear on reload; they are not saved in browser storage. Fleet, quest and voice actions here are local simulations.
              </p>

              <form onSubmit={handleAddAccount} className="field-group">
                <label>Account Token:</label>
                <input
                  type="password"
                  placeholder="Paste user account token (e.g. MTIx...)"
                  value={newToken}
                  onChange={e => setNewToken(e.target.value)}
                  className="hub-input"
                  required
                />

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label>Label / Handle:</label>
                    <input
                      type="text"
                      placeholder="e.g. Drone-01"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="hub-input"
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <label>Platform Profile:</label>
                    <select
                      value={newPlatform}
                      onChange={e => setNewPlatform(e.target.value as any)}
                      className="hub-select"
                    >
                      <option value="vr">Quest 2 VR</option>
                      <option value="playstation">PlayStation 5</option>
                      <option value="xbox">Xbox Series X</option>
                      <option value="ios">Apple iOS</option>
                      <option value="android">Android 16</option>
                      <option value="desktop">Windows Desktop</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="hub-action-btn primary" style={{ marginTop: 12 }}>
                  <Plus size={13} /> Add to Fleet
                </button>
              </form>
            </div>

            <div className="hub-card">
              <div className="card-title">
                <Users size={16} color="#38bdf8" />
                <strong>Active Fleet Registry</strong>
              </div>
              <p className="card-desc">
                Current fleet roster. The first token operates as the Master dispatcher, while slaves mirror commands.
              </p>

              <div className="fleet-roster-list">
                {fleetCfg.fleetAccounts.map((acc, idx) => (
                  <div key={acc.id} className="fleet-account-row">
                    <div className="f-acc-avatar">
                      {acc.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="f-acc-meta">
                      <div className="f-acc-name-line">
                        <strong>{acc.username}</strong>
                        {acc.isMaster ? <span className="master-badge">MASTER</span> : <span className="slave-badge">SLAVE</span>}
                        <span className="platform-tag">{acc.platform.toUpperCase()}</span>
                      </div>
                      <div className="f-acc-stats-line">
                        <span>Ping: {acc.pingMs}ms</span>
                        <span>•</span>
                        <span>Push: {acc.preserveMobileNotifs ? 'Preserved' : 'Off'}</span>
                        <span>•</span>
                        <span>Quests: {acc.activeQuestsCount} Active</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="target-del-btn"
                      onClick={() =>
                        updateFleet(f => ({
                          ...f,
                          fleetAccounts: f.fleetAccounts.filter(a => a.id !== acc.id),
                        }))
                      }
                      title="Remove token"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLATFORM & DEVICE MATRIX */}
      {activeTab === 'platforms' && (
        <div className="hub-panel-body">
          <div className="hub-card">
            <div className="card-title">
              <Gamepad2 size={16} color="#a855f7" />
              <strong>Hardware Signature &amp; Device Identity Spoofing</strong>
            </div>
            <p className="card-desc">
              When Assault connects to the Discord gateway, it broadcasts client super-properties corresponding to real devices.
            </p>

            <div className="platforms-grid">
              {[
                { id: 'vr', name: 'Meta Quest 2 VR', os: 'Quest', client: 'Discord VR', build: '352000', badge: 'VR SPECIAL' },
                { id: 'playstation', name: 'Sony PlayStation 5', os: 'PlayStation', client: 'Discord PlayStation', build: '354100', badge: 'CONSOLE' },
                { id: 'xbox', name: 'Xbox Series X/S', os: 'Xbox', client: 'Discord Xbox', build: '351900', badge: 'CONSOLE' },
                { id: 'ios', name: 'Apple iPhone 14 Pro', os: 'iOS 16.0', client: 'Discord iOS', build: '353200', badge: 'MOBILE' },
                { id: 'android', name: 'Samsung Galaxy S24', os: 'Android 14', client: 'Discord Android', build: '352800', badge: 'MOBILE' },
                { id: 'desktop', name: 'Windows 11 x64', os: 'Windows 10/11', client: 'Discord Client', build: '352000', badge: 'DESKTOP' },
              ].map(p => (
                <div key={p.id} className="platform-card">
                  <div className="p-header">
                    <strong>{p.name}</strong>
                    <span className="p-badge">{p.badge}</span>
                  </div>
                  <div className="p-details">
                    <div><span>OS:</span> <code>{p.os}</code></div>
                    <div><span>Client:</span> <code>{p.client}</code></div>
                    <div><span>Build #:</span> <code>{p.build}</code></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-footer-box" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Preserve Mobile Push Notifications ($mobile on|off)</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                    Maintains presence with <code>afk: true</code> so Discord will continue sending mobile phone notifications while your bot fleet runs in the background.
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    defaultChecked
                    onChange={e => onLog?.(`Toggled mobile push preservation to ${e.target.checked}`, 'info', 'STATUS')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISCORD QUEST AUTO-CLAIMER */}
      {activeTab === 'quests' && (
        <div className="hub-panel-body">
          <div className="hub-card">
            <div className="card-header-row">
              <div className="card-title">
                <CheckCircle size={16} color="#10b981" />
                <strong>Discord Quest Auto-Completer &amp; Video Progress Bypass</strong>
              </div>
              <button
                type="button"
                className="hub-action-btn primary"
                onClick={() => {
                  updateFleet(f => ({
                    ...f,
                    quests: f.quests.map(q => ({ ...q, progressSeconds: q.targetSeconds, completed: true })),
                  }));
                  onLog?.('Bypassed all active Discord Quests in fleet ($q complete)', 'success', 'QUEST');
                }}
              >
                <Sparkles size={12} /> Complete All Quests ($q complete)
              </button>
            </div>
            <p className="card-desc">
              Sends spoofed video playback progress packets (<code>WATCH_TOTAL_MS</code>) and desktop heartbeat pings to complete promotional Discord Quests in seconds without downloading games or watching full videos.
            </p>

            <div className="quests-grid">
              {fleetCfg.quests.map(q => {
                const percent = Math.min(100, Math.round((q.progressSeconds / q.targetSeconds) * 100));
                return (
                  <div key={q.id} className="quest-card">
                    <div className="q-card-top">
                      <div>
                        <strong>{q.title}</strong>
                        <span className="q-type-badge">{q.type}</span>
                      </div>
                      <span className={`q-status-badge ${q.claimed ? 'claimed' : q.completed ? 'ready' : 'in-prog'}`}>
                        {q.claimed ? 'CLAIMED' : q.completed ? 'READY TO CLAIM' : `${percent}%`}
                      </span>
                    </div>

                    <div className="q-progress-bar-bg">
                      <div className="q-progress-bar-fill" style={{ width: `${percent}%` }} />
                    </div>

                    <div className="q-reward-line">
                      <span>Reward: <strong>{q.reward}</strong></span>
                    </div>

                    <div className="q-actions-row">
                      {!q.completed && q.type === 'WATCH_VIDEO' && (
                        <button
                          type="button"
                          className="hub-action-btn"
                          onClick={() => handleBypassVideoQuest(q.id)}
                        >
                          <Play size={11} /> Instant Video Bypass
                        </button>
                      )}
                      {!q.completed && q.type !== 'WATCH_VIDEO' && (
                        <button
                          type="button"
                          className="hub-action-btn"
                          onClick={() => handleBypassVideoQuest(q.id)}
                        >
                          <Clock size={11} /> Trigger Heartbeat Loop
                        </button>
                      )}
                      {q.completed && !q.claimed && (
                        <button
                          type="button"
                          className="hub-action-btn primary"
                          onClick={() => handleClaimQuest(q.id)}
                        >
                          <CheckCircle size={11} /> Claim Reward
                        </button>
                      )}
                      {q.claimed && (
                        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ Added to Inventory</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FLEET VOICE CONTROLLER */}
      {activeTab === 'voice' && (
        <div className="hub-panel-body">
          <div className="panel-grid-2col">
            <div className="hub-card">
              <div className="card-title">
                <PhoneCall size={16} color="#10b981" />
                <strong>Mass Voice Coordinator ($mj / $ml)</strong>
              </div>
              <p className="card-desc">
                Command your entire fleet of bot tokens to join or leave a specific Discord Voice Channel simultaneously with self-deafen and self-mute.
              </p>

              <div className="field-group">
                <label>Target Voice Channel ID:</label>
                <input
                  type="text"
                  placeholder="Enter Voice Channel ID (e.g. 109283746592837465)"
                  value={fleetCfg.voiceChannelId}
                  onChange={e => updateFleet(f => ({ ...f, voiceChannelId: e.target.value }))}
                  className="hub-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="hub-action-btn primary"
                  onClick={handleMassJoin}
                  disabled={fleetCfg.voiceConnected}
                >
                  <PhoneCall size={13} /> Mass Join Fleet ($mj)
                </button>
                <button
                  type="button"
                  className="hub-action-btn"
                  onClick={handleMassLeave}
                  disabled={!fleetCfg.voiceConnected}
                >
                  <PhoneOff size={13} /> Mass Leave ($ml)
                </button>
              </div>
            </div>

            <div className="hub-card">
              <div className="card-title">
                <Radio size={16} color="#38bdf8" />
                <strong>Fleet Voice Session Status ($mstatus)</strong>
              </div>
              <div className="voice-status-matrix">
                <div className="v-matrix-item">
                  <span>Connection State:</span>
                  <strong style={{ color: fleetCfg.voiceConnected ? '#10b981' : '#94a3b8' }}>
                    {fleetCfg.voiceConnected ? 'ACTIVE (All Connected)' : 'IDLE'}
                  </strong>
                </div>
                <div className="v-matrix-item">
                  <span>Codec:</span>
                  <strong>Opus 96kbps (Stereo 48kHz)</strong>
                </div>
                <div className="v-matrix-item">
                  <span>Self-Deafened:</span>
                  <strong style={{ color: '#10b981' }}>Enabled (0 Resource Usage)</strong>
                </div>
                <div className="v-matrix-item">
                  <span>Bots in Voice:</span>
                  <strong>{fleetCfg.voiceConnected ? fleetCfg.fleetAccounts.length : 0} of {fleetCfg.fleetAccounts.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MULTI-CARD RICH PRESENCE STUDIO */}
      {activeTab === 'rpc' && (
        <div className="hub-panel-body">
          <div className="panel-grid-2col">
            <div className="hub-card">
              <div className="card-title">
                <Radio size={16} color="#ff6471" />
                <strong>Multi-Slot Activity Customizer</strong>
              </div>
              <p className="card-desc">
                Broadcast multiple simultaneous activities (PlayStation 5 console game + Spotify Track + Twitch stream) on a single user profile.
              </p>

              {/* SLOT 1: PLAYSTATION */}
              <div className="rpc-slot-box">
                <div className="rpc-slot-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Gamepad2 size={14} color="#38bdf8" />
                    <strong>Slot 1: PlayStation 5 Activity ($ps)</strong>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={fleetCfg.rpcSlots[0]?.enabled}
                      onChange={e =>
                        updateFleet(f => {
                          const slots = [...f.rpcSlots];
                          slots[0] = { ...slots[0], enabled: e.target.checked };
                          return { ...f, rpcSlots: slots };
                        })
                      }
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Game Title (e.g. Grand Theft Auto VI)"
                  value={fleetCfg.rpcSlots[0]?.name || ''}
                  onChange={e =>
                    updateFleet(f => {
                      const slots = [...f.rpcSlots];
                      slots[0] = { ...slots[0], name: e.target.value };
                      return { ...f, rpcSlots: slots };
                    })
                  }
                  className="hub-input"
                />
              </div>

              {/* SLOT 2: SPOTIFY */}
              <div className="rpc-slot-box">
                <div className="rpc-slot-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Music size={14} color="#10b981" />
                    <strong>Slot 2: Spotify Track Spoofer ($spotify)</strong>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={fleetCfg.rpcSlots[1]?.enabled}
                      onChange={e =>
                        updateFleet(f => {
                          const slots = [...f.rpcSlots];
                          slots[1] = { ...slots[1], enabled: e.target.checked };
                          return { ...f, rpcSlots: slots };
                        })
                      }
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Track Title"
                    value={fleetCfg.rpcSlots[1]?.details || ''}
                    onChange={e =>
                      updateFleet(f => {
                        const slots = [...f.rpcSlots];
                        slots[1] = { ...slots[1], details: e.target.value };
                        return { ...f, rpcSlots: slots };
                      })
                    }
                    className="hub-input"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <input
                    type="text"
                    placeholder="Artist"
                    value={fleetCfg.rpcSlots[1]?.state || ''}
                    onChange={e =>
                      updateFleet(f => {
                        const slots = [...f.rpcSlots];
                        slots[1] = { ...slots[1], state: e.target.value };
                        return { ...f, rpcSlots: slots };
                      })
                    }
                    className="hub-input"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                </div>
              </div>

              {/* SLOT 3: STREAMING */}
              <div className="rpc-slot-box">
                <div className="rpc-slot-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tv size={14} color="#a855f7" />
                    <strong>Slot 3: Twitch Streaming ($stream)</strong>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={fleetCfg.rpcSlots[2]?.enabled}
                      onChange={e =>
                        updateFleet(f => {
                          const slots = [...f.rpcSlots];
                          slots[2] = { ...slots[2], enabled: e.target.checked };
                          return { ...f, rpcSlots: slots };
                        })
                      }
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Stream Broadcast Title"
                  value={fleetCfg.rpcSlots[2]?.name || ''}
                  onChange={e =>
                    updateFleet(f => {
                      const slots = [...f.rpcSlots];
                      slots[2] = { ...slots[2], name: e.target.value };
                      return { ...f, rpcSlots: slots };
                    })
                  }
                  className="hub-input"
                />
              </div>
            </div>

            {/* LIVE PROFILE CARD PREVIEW */}
            <div className="hub-card">
              <div className="card-title">
                <Eye size={16} color="#ff6471" />
                <strong>Discord User Profile Live Presence Preview</strong>
              </div>
              <p className="card-desc">
                This is how other users and mutual servers will see your account status across devices.
              </p>

              <div className="discord-profile-preview-card">
                <div className="dp-banner" />
                <div className="dp-avatar-row">
                  <div className="dp-avatar">
                    <span>A</span>
                    <div className="dp-status-dot streaming" />
                  </div>
                </div>
                <div className="dp-body">
                  <strong className="dp-user">AssaultMaster</strong>
                  <span className="dp-tag">@assault.core</span>

                  <div className="dp-divider" />

                  <div className="dp-activity-section">
                    <div className="dp-act-title">ACTIVITIES</div>

                    {/* PLAYSTATION */}
                    {fleetCfg.rpcSlots[0]?.enabled && (
                      <div className="dp-act-item">
                        <div className="dp-act-art ps" />
                        <div>
                          <strong>{fleetCfg.rpcSlots[0]?.name}</strong>
                          <small>PlayStation 5 • Playing</small>
                          <small>Elapsed 02:45:12</small>
                        </div>
                      </div>
                    )}

                    {/* SPOTIFY */}
                    {fleetCfg.rpcSlots[1]?.enabled && (
                      <div className="dp-act-item">
                        <div className="dp-act-art spotify" />
                        <div>
                          <strong>{fleetCfg.rpcSlots[1]?.details}</strong>
                          <small>by {fleetCfg.rpcSlots[1]?.state}</small>
                          <small>on Spotify</small>
                        </div>
                      </div>
                    )}

                    {/* STREAM */}
                    {fleetCfg.rpcSlots[2]?.enabled && (
                      <div className="dp-act-item">
                        <div className="dp-act-art stream" />
                        <div>
                          <strong>Streaming on Twitch</strong>
                          <small>{fleetCfg.rpcSlots[2]?.name}</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
