import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Wifi,
  Battery,
  RotateCcw,
  Sparkles,
  Send,
  Shield,
  Palette,
  EyeOff,
  Bell,
  HardDrive,
  Cpu,
  Trash2,
  Check,
  Search,
  MessageSquare,
  Hash,
  Volume2,
  Radio,
  Sliders,
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy,
  Pin,
  Mic,
  MicOff,
  Headphones,
  Bookmark,
  Info,
  VolumeX,
  FileText,
  PhoneCall,
  PhoneOff,
  Activity,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { ModSettings } from './ModsCustomizationStudio';
import { AutomodShieldSettings } from './AutomodShieldSettings';
import { validateChatMessage, getAutomodSettings, playShieldSound } from '../services/automodSettingsStorage';

interface ChatMessage {
  id: string;
  channel?: string;
  author: string;
  avatarColor: string;
  role?: string;
  time: string;
  content: string;
  deleted?: boolean;
  ghostPing?: boolean;
  edits?: string[];
  pinned?: boolean;
}

interface PhoneEmulatorProps {
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
  currentSystemTheme: 'dark' | 'amoled';
  modSettings?: ModSettings;
}

export function PhoneEmulator({ onLog, currentSystemTheme, modSettings }: PhoneEmulatorProps) {
  const [deviceModel, setDeviceModel] = useState<'pixel' | 'galaxy' | 'tablet'>('pixel');
  const [clientTheme, setClientTheme] = useState<'amoled' | 'dark'>(currentSystemTheme);
  const [activeChannel, setActiveChannel] = useState<string>('general-chat');
  const [inputText, setInputText] = useState('');
  const [showAssaultSheet, setShowAssaultSheet] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'general' | 'automod' | 'voice' | 'appearance' | 'notes'>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Additional In-App Features
  const [showPinsDrawer, setShowPinsDrawer] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [inspectingMessage, setInspectingMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [notesError, setNotesError] = useState('');
  const [savedNotes, updateSavedNotes] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('assault_preview_notes_v1') || '[]'); return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : []; }
    catch { return []; }
  });
  const currentNotes = useRef(savedNotes);
  const setSavedNotes = (updater: (notes: string[]) => string[]) => {
    const next = updater(currentNotes.current);
    currentNotes.current = next;
    updateSavedNotes(next);
    try { localStorage.setItem('assault_preview_notes_v1', JSON.stringify(next)); setNotesError(''); }
    catch { setNotesError('Notes are only in memory: browser storage could not be written. Copy them before leaving.'); }
  };
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  function later(callback: () => void, delay: number) {
    const timer = setTimeout(() => { timers.current.delete(timer); callback(); }, delay);
    timers.current.add(timer);
  }
  function clearTimers() { for (const timer of timers.current) clearTimeout(timer); timers.current.clear(); }
  useEffect(() => () => clearTimers(), []);
  const [newNoteInput, setNewNoteInput] = useState('');

  // Voice Lounge & Audio Engine
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState<'krisp' | 'rnnoise' | 'off'>('krisp');
  const [voicePing, setVoicePing] = useState(19);

  // Appearance & Reading Experience
  const [compactMode, setCompactMode] = useState(false);
  const [chatFontSize, setChatFontSize] = useState<number>(11);
  const [showAnimatedAvatars, setShowAnimatedAvatars] = useState(true);

  // Assault Client In-App Mod Toggles
  const [modSilentTyping, setModSilentTyping] = useState(modSettings?.silentTyping ?? true);
  const [modAntiDelete, setModAntiDelete] = useState(modSettings?.antiDelete ?? true);
  const [modGhostPing, setModGhostPing] = useState(modSettings?.ghostPingRadar ?? true);
  const [modTokenProtect, setModTokenProtect] = useState(modSettings?.tokenProtection ?? true);
  const [customStatus, setCustomStatus] = useState(
    modSettings ? `${modSettings.presenceType} ${modSettings.presenceText}` : 'Playing Assault v2.11.2'
  );

  // Sync with incoming modSettings
  useEffect(() => {
    if (modSettings) {
      setModSilentTyping(modSettings.silentTyping);
      setModAntiDelete(modSettings.antiDelete);
      setModGhostPing(modSettings.ghostPingRadar);
      setModTokenProtect(modSettings.tokenProtection);
      setCustomStatus(`${modSettings.presenceType} ${modSettings.presenceText}`);
      setClientTheme(modSettings.themeMode);
    }
  }, [modSettings]);

  // Interactive Live Chat Feed
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      author: 'dgrondin',
      avatarColor: modSettings?.accentColor || '#ff6471',
      role: 'DEV',
      time: '12:04 PM',
      content: 'Assault v2.9.2 client successfully loaded on Android 16 ART runtime.',
    },
    {
      id: 'm2',
      author: 'krypton',
      avatarColor: '#38bdf8',
      role: 'CORE',
      time: '12:05 PM',
      content: 'Tested /assault export with anti-delete retention. Verified zero memory leaks.',
    },
    {
      id: 'm3',
      author: 'shadow_ninja',
      avatarColor: '#f59e0b',
      time: '12:06 PM',
      content: 'Hey @everyone this was a secret mention that got deleted immediately!',
      deleted: true,
      ghostPing: true,
    },
    {
      id: 'm4',
      author: 'BeefBot',
      avatarColor: '#10b981',
      role: 'BOT',
      time: '12:06 PM',
      content: '🛡️ Ghost Ping Intercepted: Mention by shadow_ninja retained by Assault Shield.',
    },
  ]);

  // Synchronize system theme changes with client preview
  useEffect(() => {
    setClientTheme(currentSystemTheme);
  }, [currentSystemTheme]);

  const pinnedMessages = messages.filter(m => m.pinned && (m.channel || 'general-chat') === activeChannel);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const trimmed = inputText.trim();
    if (modTokenProtect && /(?:mfa\.[\w-]{20,}|[\w-]{20,}\.[\w-]{6,}\.[\w-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(trimmed)) {
      onLog?.('Message blocked: recognized credential text. Content was not logged.', 'warning', 'SHIELD');
      return;
    }
    const newId = `msg-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const scopedMessages = messages.filter(m => (m.channel || 'general-chat') === activeChannel);
    // Handle slash commands
    if (trimmed.startsWith('/assault')) {
      if (/^\/assault export(?:-all|-json)?$/.test(trimmed)) {
        const all = trimmed === '/assault export-all';
        const rows = all ? messages : scopedMessages;
        const json = trimmed === '/assault export-json';
        const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
        const content = json ? JSON.stringify({ coverage: 'browser-simulator-only', messages: rows }, null, 2)
          : '<!doctype html><meta charset="utf-8"><title>Assault simulator transcript</title><h1>Browser simulator transcript</h1>' + rows.map(m => `<article><h2>${escape(m.author)}</h2><pre>${escape(m.content)}</pre></article>`).join('');
        const url = URL.createObjectURL(new Blob([content], { type: json ? 'application/json' : 'text/html' }));
        const link = document.createElement('a'); link.href = url; link.download = `Assault-preview.${json ? 'json' : 'html'}`;
        document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        const cmdMsg: ChatMessage = {
          channel: activeChannel,
          id: newId,
          author: 'You',
          avatarColor: '#a855f7',
          role: 'OWNER',
          time: timeStr,
          content: trimmed,
        };
        const botReply: ChatMessage = {
          channel: activeChannel,
          id: `bot-${Date.now()}`,
          author: 'Assault Core',
          avatarColor: '#ff6471',
          role: 'SYSTEM',
          time: timeStr,
          content: `Browser download requested for ${rows.length} simulator messages (${json ? 'JSON' : 'HTML'}).`,
        };
        setMessages(prev => [...prev, cmdMsg, botReply]);
        onLog?.(`Executed in-client command: ${trimmed}`, 'success', 'CLIENT');
      } else if (trimmed.includes('ghost-pings')) {
        const botReply: ChatMessage = {
          channel: activeChannel,
          id: `bot-${Date.now()}`,
          author: 'Assault Core',
          avatarColor: '#ff6471',
          role: 'SYSTEM',
          time: timeStr,
          content: '👻 Ghost Ping Audit Log: 1 deleted mention detected in the last 15 minutes by shadow_ninja.',
        };
        setMessages(prev => [...prev, botReply]);
      } else if (trimmed.includes('search')) {
        const query = trimmed.replace('/assault search', '').trim();
        const found = scopedMessages.filter(m => m.content.toLowerCase().includes(query.toLowerCase()));
        const botReply: ChatMessage = {
          channel: activeChannel,
          id: `bot-${Date.now()}`,
          author: 'Assault Core',
          avatarColor: '#ff6471',
          role: 'SYSTEM',
          time: timeStr,
          content: `🔍 Search results for "${query}": Found ${found.length} matches in local cache buffer.`,
        };
        setMessages(prev => [...prev, botReply]);
      } else {
        const botReply: ChatMessage = {
          channel: activeChannel,
          id: `bot-${Date.now()}`,
          author: 'Assault Core',
          avatarColor: '#ff6471',
          role: 'SYSTEM',
          time: timeStr,
          content: 'Available commands: /assault export, /assault export-all, /assault ghost-pings, /assault search <query>',
        };
        setMessages(prev => [...prev, botReply]);
      }
      setInputText('');
      setReplyingTo(null);
      return;
    }

    if (trimmed.startsWith('/shield')) {
      if (trimmed.includes('status') || trimmed.includes('audit')) {
        const botReply: ChatMessage = {
          channel: activeChannel,
          id: `shield-${Date.now()}`,
          author: 'BeefBot Shield',
          avatarColor: '#10b981',
          role: 'BOT',
          time: timeStr,
          content: `Simulator shield: phishing rules ${getAutomodSettings().phishingGuard ? 'on' : 'off'}, keywords ${getAutomodSettings().keywordFilter ? 'on' : 'off'}, token guard ${modTokenProtect ? 'on' : 'off'}. Detection is best-effort.`,
        };
        setMessages(prev => [...prev, botReply]);
      }
      setInputText('');
      setReplyingTo(null);
      return;
    }

    if (trimmed.startsWith('/voice')) {
      const command = trimmed.split(/\s+/)[1]?.toLowerCase();
      const connected = command === 'join' ? true : command === 'leave' ? false : !isVoiceConnected;
      setIsVoiceConnected(connected);
      const botReply: ChatMessage = {
        channel: activeChannel,
        id: `voice-${Date.now()}`,
        author: 'Assault Voice',
        avatarColor: '#38bdf8',
        role: 'VOICE',
        time: timeStr,
        content: connected ? '🎙️ Browser voice preview connected (simulated Opus/Krisp settings).' : '📞 Browser voice preview disconnected.',
      };
      setMessages(prev => [...prev, botReply]);
      setInputText('');
      setReplyingTo(null);
      return;
    }

    if (trimmed.startsWith('/theme')) {
      const isAmoled = trimmed.includes('amoled') || trimmed.includes('black');
      setClientTheme(isAmoled ? 'amoled' : 'dark');
      onLog?.(`Switched Discord client theme to ${isAmoled ? 'Pure Black OLED' : 'Slate Dark'}`, 'info', 'THEME');
      setInputText('');
      setReplyingTo(null);
      return;
    }

    if (/^\/notes?(?:\s|$)/i.test(trimmed)) {
      const noteText = trimmed.replace(/^\/notes?(?:\s+(?:add|save)\b)?\s*/i, '').trim();
      if (noteText) {
        setSavedNotes(prev => [...prev, noteText]);
        const botReply: ChatMessage = {
          channel: activeChannel,
          id: `note-${Date.now()}`,
          author: 'Assault Vault',
          avatarColor: '#f59e0b',
          role: 'VAULT',
          time: timeStr,
          content: `📝 Saved note to offline vault: "${noteText}"`,
        };
        setMessages(prev => [...prev, botReply]);
      }
      setInputText('');
      setReplyingTo(null);
      return;
    }

    // Inspect message with BeefBot Automod & Safety Shield
    const automodCfg = getAutomodSettings();
    const validation = validateChatMessage(trimmed, automodCfg);

    if (validation.blocked) {
      if (automodCfg.soundAlerts) playShieldSound('block');
      const blockMsg: ChatMessage = {
        channel: activeChannel,
        id: `beefbot-${Date.now()}`,
        author: 'BeefBot Shield',
        avatarColor: '#10b981',
        role: 'BOT',
        time: timeStr,
        content: validation.sanitizedContent,
      };
      setMessages(prev => [...prev, blockMsg]);
      onLog?.(`Automod blocked a simulator message (${validation.reason})`, 'warning', 'SHIELD');
      setInputText('');
      setReplyingTo(null);
      return;
    }

    const displayContent = replyingTo
      ? `💬 Replying to @${replyingTo.author}:\n> ${replyingTo.content.slice(0, 45)}${replyingTo.content.length > 45 ? '…' : ''}\n${validation.sanitizedContent}`
      : validation.sanitizedContent;

    const newMsg: ChatMessage = {
      channel: activeChannel,
      id: newId,
      author: 'You',
      avatarColor: '#a855f7',
      role: 'OWNER',
      time: timeStr,
      content: displayContent,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setReplyingTo(null);
    onLog?.(`Simulator message added in #${activeChannel}`, 'info', 'GATEWAY');

    // Trigger auto-reply if rule matched
    if (validation.autoReply) {
      if (automodCfg.soundAlerts) playShieldSound('ping');
      later(() => {
        setMessages(prev => [
          ...prev,
          {
            channel: activeChannel,
          id: `bot-reply-${Date.now()}`,
            author: 'BeefBot',
            avatarColor: '#10b981',
            role: 'BOT',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: validation.autoReply!,
          },
        ]);
      }, 500);
    }

    // Simulate occasional incoming reply
    setIsTyping(true);
    later(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          channel: activeChannel,
          id: `reply-${Date.now()}`,
          author: 'krypton',
          avatarColor: '#38bdf8',
          role: 'CORE',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'Acknowledged! Hook latency is rock solid at 1.1ms.',
        },
      ]);
    }, 1800);
  };

  const handleSimulateDelete = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const ghostMsg: ChatMessage = {
      channel: activeChannel,
      id: `ghost-${Date.now()}`,
      author: 'test_user',
      avatarColor: '#ec4899',
      time: timeStr,
      content: 'Hey @You did you check the private beta build? [Purged]',
      deleted: true,
      ghostPing: true,
    };
    setMessages(prev => [...prev, ghostMsg]);
    onLog?.('Anti-Delete demo: Caught and badged deleted message with mention tag', 'warning', 'ANTI-DELETE');
  };

  const handleReloadClient = () => {
    clearTimers(); setIsTyping(false); setReplyingTo(null);
    onLog?.('Reloading Assault client on Android 16 emulator…', 'info', 'EMULATOR');
    setMessages([
      {
        id: 'init-1',
        author: 'Assault Loader',
        avatarColor: '#ff6471',
        role: 'SYSTEM',
        time: 'Just now',
        content: 'Hermes runtime re-injected. 8 privacy hooks & AMOLED CSS theme active.',
      },
    ]);
  };

  return (
    <section className="phone-emulator-section" id="emulator" role="region" aria-label="Android Client Emulator">
      <div className="emulator-header">
        <div className="emulator-title-group">
          <div className="emulator-icon-badge">
            <Smartphone size={18} />
          </div>
          <div>
            <div className="emulator-eyebrow">STREAMING DEVICE SIMULATOR</div>
            <h3>Interactive Android Client Emulator</h3>
          </div>
        </div>

        <div className="emulator-controls-bar">
          <div className="device-pills">
            <button
              type="button"
              className={`device-pill ${deviceModel === 'pixel' ? 'active' : ''}`}
              onClick={() => setDeviceModel('pixel')}
            >
              Pixel 9 Pro
            </button>
            <button
              type="button"
              className={`device-pill ${deviceModel === 'galaxy' ? 'active' : ''}`}
              onClick={() => setDeviceModel('galaxy')}
            >
              Galaxy S24 Ultra
            </button>
            <button
              type="button"
              className={`device-pill ${deviceModel === 'tablet' ? 'active' : ''}`}
              onClick={() => setDeviceModel('tablet')}
            >
              Tablet View
            </button>
          </div>

          <button
            type="button"
            className="emulator-action-btn"
            onClick={() => setClientTheme(clientTheme === 'amoled' ? 'dark' : 'amoled')}
            title="Toggle client OLED true black vs standard dark"
          >
            <Palette size={13} />
            <span>{clientTheme === 'amoled' ? 'OLED #000000' : 'Slate Dark'}</span>
          </button>

          <button
            type="button"
            className="emulator-action-btn"
            onClick={handleReloadClient}
            title="Reboot simulated client"
          >
            <RotateCcw size={13} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            className="emulator-action-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse size' : 'Expand full screen'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      <p className="emulator-desc">
        Experience the live Assault-patched Discord client directly in your browser. Interact with real-time channels, test anti-delete retention, trigger <code>/assault</code> commands, and toggle the floating <strong>AS Controls</strong> sheet on the fly.
      </p>

      {/* EMULATOR WORKSPACE */}
      <div className={`emulator-stage ${isExpanded ? 'stage-expanded' : ''} model-${deviceModel}`}>
        {/* PHONE CHASSIS */}
        <div className={`phone-chassis ${clientTheme === 'amoled' ? 'chassis-amoled' : ''}`}>
          {/* CAMERA PUNCH HOLE */}
          <div className="phone-notch">
            <div className="camera-lens" />
            <div className="speaker-grille" />
          </div>

          {/* ANDROID 16 STATUS BAR */}
          <div className="android-status-bar">
            <span className="status-clock">12:08</span>
            <div className="status-icons">
              <span className="status-network">5G UC</span>
              <Wifi size={12} />
              <Battery size={13} />
            </div>
          </div>

          {/* DISCORD CLIENT SCREEN */}
          <div className={`client-app-viewport theme-${clientTheme}`}>
            {/* DISCORD TOP APP BAR */}
            <div className="discord-app-bar">
              <div className="discord-channel-info">
                <Hash size={16} className="hash-icon" />
                <strong>{activeChannel}</strong>
                <span className="channel-topic">Assault Dev & Community</span>
              </div>
              <div className="discord-bar-actions">
                <button
                  type="button"
                  className={`appbar-action-icon ${showPinsDrawer ? 'active' : ''}`}
                  onClick={() => { setShowPinsDrawer(!showPinsDrawer); setShowNotesDrawer(false); }}
                  title="Pinned Messages"
                >
                  <Pin size={13} color={messages.some(m => m.pinned) ? '#ff6471' : undefined} />
                </button>
                <button
                  type="button"
                  className={`appbar-action-icon ${showNotesDrawer ? 'active' : ''}`}
                  onClick={() => { setShowNotesDrawer(!showNotesDrawer); setShowPinsDrawer(false); }}
                  title="Offline Vault & Notes"
                >
                  <Bookmark size={13} color={savedNotes.length > 0 ? '#38bdf8' : undefined} />
                </button>
                <button
                  type="button"
                  className={`appbar-action-icon ${isVoiceConnected ? 'active-voice' : ''}`}
                  onClick={() => setIsVoiceConnected(!isVoiceConnected)}
                  title={isVoiceConnected ? "Disconnect Voice" : "Connect Opus HD Voice"}
                >
                  <Headphones size={13} color={isVoiceConnected ? '#10b981' : undefined} />
                </button>
                <button
                  type="button"
                  className="as-floating-badge"
                  onClick={() => setShowAssaultSheet(!showAssaultSheet)}
                  title="Open Assault Settings & Account Controls"
                >
                  <span className="badge-text">AS</span>
                </button>
              </div>
            </div>

            {/* CHANNEL SELECTOR TABS */}
            <div className="mini-channel-strip">
              {['general-chat', 'dev-builds', 'voice-lounge'].map(ch => (
                <button
                  key={ch}
                  type="button"
                  className={`mini-ch-tab ${activeChannel === ch ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChannel(ch);
                    if (ch === 'voice-lounge' && !isVoiceConnected) {
                      setIsVoiceConnected(true);
                      onLog?.('Auto-joined Voice Lounge (Opus 96kbps HD)', 'info', 'VOICE');
                    }
                  }}
                >
                  <Hash size={11} />
                  <span>{ch}</span>
                </button>
              ))}
            </div>

            {/* IN-APP VOICE STATUS BAR */}
            {isVoiceConnected && (
              <div className="in-app-voice-bar">
                <div className="voice-bar-info">
                  <div className="voice-pulse-dot" />
                  <div>
                    <strong>Voice Connected</strong>
                    <small>#voice-lounge • 96k Opus • {voicePing}ms • {noiseSuppression.toUpperCase()}</small>
                  </div>
                </div>
                <div className="voice-bar-btns">
                  <button
                    type="button"
                    className={`v-ctrl-btn ${isMicMuted ? 'muted' : ''}`}
                    onClick={() => {
                      setIsMicMuted(!isMicMuted);
                      onLog?.(isMicMuted ? 'Microphone unmuted' : 'Microphone muted (Silent Gateway)', 'info', 'VOICE');
                    }}
                    title={isMicMuted ? "Unmute" : "Mute Microphone"}
                  >
                    {isMicMuted ? <MicOff size={11} /> : <Mic size={11} />}
                  </button>
                  <button
                    type="button"
                    className={`v-ctrl-btn ${isDeafened ? 'muted' : ''}`}
                    onClick={() => {
                      setIsDeafened(!isDeafened);
                      onLog?.(isDeafened ? 'Audio undeafened' : 'Client deafened', 'info', 'VOICE');
                    }}
                    title={isDeafened ? "Undeafen" : "Deafen"}
                  >
                    {isDeafened ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                  <button
                    type="button"
                    className="v-ctrl-btn disconnect"
                    onClick={() => {
                      setIsVoiceConnected(false);
                      onLog?.('Voice session terminated', 'warning', 'VOICE');
                    }}
                    title="Disconnect Voice"
                  >
                    <PhoneOff size={11} />
                  </button>
                </div>
              </div>
            )}

            {/* CHAT MESSAGES STREAM */}
            <div className="discord-chat-stream">
              <div className="chat-welcome-banner">
                <div className="welcome-avatar">#</div>
                <h4>Welcome to #{activeChannel}!</h4>
                <p>This is the start of the #{activeChannel} channel. Patched with Assault v2.11.2.</p>
              </div>

              {messages.filter(m => (m.channel || 'general-chat') === activeChannel).map(m => (
                <div
                  key={m.id}
                  className={`chat-message-row ${m.deleted ? 'is-deleted' : ''} ${compactMode ? 'compact-row' : ''}`}
                  style={{ fontSize: `${chatFontSize}px` }}
                >
                  <div
                    className="chat-avatar"
                    style={{
                      backgroundColor: m.avatarColor,
                      display: compactMode ? 'none' : 'grid'
                    }}
                  >
                    {m.author.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="chat-content-col">
                    <div className="chat-meta-row">
                      <strong className="chat-author">{m.author}</strong>
                      {m.role && <span className="chat-role-badge">{m.role}</span>}
                      <span className="chat-time">{m.time}</span>
                      {m.pinned && <span className="chat-tag-pinned">📌 Pinned</span>}
                      {m.deleted && <span className="chat-tag-deleted">Deleted</span>}
                      {m.ghostPing && <span className="chat-tag-ghost">Ghost Ping</span>}
                    </div>
                    <div className="chat-message-text">{m.content}</div>

                    {/* INTERACTIVE MESSAGE QUICK ACTION BAR */}
                    <div className="msg-quick-bar">
                      <button
                        type="button"
                        onClick={async () => {
                          try { await navigator.clipboard.writeText(m.content); onLog?.('Message copied', 'info', 'CLIENT'); }
                          catch { onLog?.('Clipboard unavailable. Select and copy the text manually.', 'warning', 'CLIENT'); }
                        }}
                        title="Copy Raw Text"
                      >
                        <Copy size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, pinned: !msg.pinned } : msg));
                          onLog?.(m.pinned ? `Unpinned message #${m.id}` : `Pinned message to #${activeChannel}`, 'success', 'PIN');
                        }}
                        title={m.pinned ? "Unpin message" : "Pin message"}
                      >
                        <Pin size={10} color={m.pinned ? '#ff6471' : undefined} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(m);
                          onLog?.(`Replying to @${m.author}`, 'info', 'CLIENT');
                        }}
                        title="Quote / Reply"
                      >
                        <CornerDownLeft size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const note = `[@${m.author} in #${activeChannel}]: ${m.content}`;
                          setSavedNotes(prev => [...prev, note]);
                          onLog?.(`Saved to browser-local notes`, 'success', 'VAULT');
                        }}
                        title="Save to Offline Notes"
                      >
                        <Bookmark size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectingMessage(m)}
                        title="Inspect Hook & Byte Metadata"
                      >
                        <Info size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="typing-indicator-row">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>krypton is typing…</span>
                </div>
              )}
            </div>

            {/* ASSAULT IN-APP SETTINGS SHEET OVERLAY */}
            {showAssaultSheet && (
              <div className="assault-settings-drawer">
                <div className="drawer-header">
                  <div className="drawer-title">
                    <span className="drawer-logo">AS</span>
                    <div>
                      <strong>Assault Client Controls</strong>
                      <small>v2.9.0 Native Loader</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="drawer-close"
                    onClick={() => setShowAssaultSheet(false)}
                  >
                    ×
                  </button>
                </div>

                {/* DISCORD SETTINGS SPOT: SECTION NAVIGATION TABS */}
                <div style={{ display: 'flex', gap: 4, margin: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, overflowX: 'auto' }}>
                  <button
                    type="button"
                    style={{
                      background: drawerTab === 'general' ? '#ff6471' : 'rgba(255,255,255,0.05)',
                      color: drawerTab === 'general' ? '#190a10' : '#cbd5e1',
                      border: 0,
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setDrawerTab('general')}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    style={{
                      background: drawerTab === 'automod' ? '#ff6471' : 'rgba(255,255,255,0.05)',
                      color: drawerTab === 'automod' ? '#190a10' : '#cbd5e1',
                      border: 0,
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setDrawerTab('automod')}
                  >
                    🛡️ Shield
                  </button>
                  <button
                    type="button"
                    style={{
                      background: drawerTab === 'voice' ? '#ff6471' : 'rgba(255,255,255,0.05)',
                      color: drawerTab === 'voice' ? '#190a10' : '#cbd5e1',
                      border: 0,
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setDrawerTab('voice')}
                  >
                    🎙️ Voice
                  </button>
                  <button
                    type="button"
                    style={{
                      background: drawerTab === 'appearance' ? '#ff6471' : 'rgba(255,255,255,0.05)',
                      color: drawerTab === 'appearance' ? '#190a10' : '#cbd5e1',
                      border: 0,
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setDrawerTab('appearance')}
                  >
                    🎨 Look
                  </button>
                  <button
                    type="button"
                    style={{
                      background: drawerTab === 'notes' ? '#ff6471' : 'rgba(255,255,255,0.05)',
                      color: drawerTab === 'notes' ? '#190a10' : '#cbd5e1',
                      border: 0,
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setDrawerTab('notes')}
                  >
                    📝 Vault
                  </button>
                </div>

                {drawerTab === 'general' && (
                  <div className="drawer-body">
                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>AMOLED Pure Black (#000000)</span>
                        <small>Shut down OLED pixels for 22% battery savings</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={clientTheme === 'amoled'}
                        onChange={e => setClientTheme(e.target.checked ? 'amoled' : 'dark')}
                      />
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Silent Typing Stealth</span>
                        <small>Suppresses /typing gateway events in all chats</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={modSilentTyping}
                        onChange={e => setModSilentTyping(e.target.checked)}
                      />
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Anti-Delete Retention</span>
                        <small>Persists deleted messages with crimson indicators</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={modAntiDelete}
                        onChange={e => setModAntiDelete(e.target.checked)}
                      />
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Ghost Ping Interceptor</span>
                        <small>Badges purged mentions with author timestamps</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={modGhostPing}
                        onChange={e => setModGhostPing(e.target.checked)}
                      />
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Discord Token Protection</span>
                        <small>Blocks accidental token exposure in outgoing chats</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={modTokenProtect}
                        onChange={e => setModTokenProtect(e.target.checked)}
                      />
                    </div>

                    <div className="drawer-status-input">
                      <label>Dynamic Activity Spoof ($activity):</label>
                      <input
                        type="text"
                        value={customStatus}
                        onChange={e => setCustomStatus(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {drawerTab === 'automod' && (
                  <div className="drawer-body" style={{ overflowY: 'auto', maxHeight: 340 }}>
                    <AutomodShieldSettings compact={true} onLog={onLog} />
                  </div>
                )}

                {drawerTab === 'voice' && (
                  <div className="drawer-body">
                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Opus 96kbps High-Fidelity</span>
                        <small>Studio audio bitrate for voice channels</small>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>AI Noise Suppression</span>
                        <small>Krisp neural filter for background isolation</small>
                      </div>
                      <select
                        value={noiseSuppression}
                        onChange={e => setNoiseSuppression(e.target.value as any)}
                        style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: 5, padding: '3px 6px', fontSize: 10 }}
                      >
                        <option value="krisp">Krisp AI</option>
                        <option value="rnnoise">RNNoise</option>
                        <option value="off">Off (Raw)</option>
                      </select>
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Mic Gain Normalization</span>
                        <small>Auto-level volume across different microphones</small>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Spatial Voice Stereo</span>
                        <small>Positional 3D audio panning in voice calls</small>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                  </div>
                )}

                {drawerTab === 'appearance' && (
                  <div className="drawer-body">
                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Compact Message Density</span>
                        <small>Hides avatars and condenses chat line spacing</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={compactMode}
                        onChange={e => setCompactMode(e.target.checked)}
                      />
                    </div>

                    <div className="mod-toggle-item">
                      <div className="mod-info">
                        <span>Animated Avatars (APNG/GIF)</span>
                        <small>Render animations without battery throttling</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={showAnimatedAvatars}
                        onChange={e => setShowAnimatedAvatars(e.target.checked)}
                      />
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Chat Font Size</span>
                        <span style={{ color: '#ff6471', fontWeight: 700 }}>{chatFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="16"
                        step="1"
                        value={chatFontSize}
                        onChange={e => setChatFontSize(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#ff6471' }}
                      />
                    </div>
                  </div>
                )}

                {notesError && <p role="alert">{notesError}</p>}
                {drawerTab === 'notes' && (
                  <div className="drawer-body">
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="Add quick offline note or snippet..."
                        value={newNoteInput}
                        onChange={e => setNewNoteInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newNoteInput.trim()) {
                            setSavedNotes(prev => [...prev, newNoteInput.trim()]);
                            setNewNoteInput('');
                            onLog?.('Saved note to offline vault', 'success', 'VAULT');
                          }
                        }}
                        style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#fff', fontSize: 10, padding: '5px 8px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newNoteInput.trim()) {
                            setSavedNotes(prev => [...prev, newNoteInput.trim()]);
                            setNewNoteInput('');
                            onLog?.('Saved note to offline vault', 'success', 'VAULT');
                          }
                        }}
                        style={{ background: '#ff6471', border: 0, color: '#190a10', fontWeight: 700, borderRadius: 6, padding: '5px 8px', fontSize: 10, cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {savedNotes.map((note, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: 8, fontSize: 10, color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ flex: 1, wordBreak: 'break-word' }}>{note}</span>
                          <button
                            type="button"
                            onClick={() => setSavedNotes(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="drawer-footer">
                  <button
                    type="button"
                    className="drawer-btn"
                    onClick={() => {
                      setShowAssaultSheet(false);
                      onLog?.('Client settings synchronized to Assault storage', 'success', 'STORAGE');
                    }}
                  >
                    Apply & Save
                  </button>
                </div>
              </div>
            )}

            {/* PINNED MESSAGES DRAWER OVERLAY */}
            {showPinsDrawer && (
              <div className="in-app-popup-drawer">
                <div className="popup-drawer-header">
                  <strong>📌 Pinned Messages ({pinnedMessages.length})</strong>
                  <button type="button" onClick={() => setShowPinsDrawer(false)}><X size={12} /></button>
                </div>
                <div className="popup-drawer-body">
                  {pinnedMessages.length === 0 ? (
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '12px 0', textAlign: 'center' }}>
                      No pinned messages in #{activeChannel}. Click the pin icon on any message to pin it here.
                    </p>
                  ) : (
                    pinnedMessages.map(p => (
                      <div key={p.id} className="pin-popup-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <strong style={{ fontSize: 10, color: p.avatarColor }}>{p.author}</strong>
                          <span style={{ fontSize: 8, color: '#64748b' }}>{p.time}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#e2e8f0', wordBreak: 'break-word' }}>{p.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* OFFLINE NOTES VAULT OVERLAY */}
            {showNotesDrawer && (
              <div className="in-app-popup-drawer">
                <div className="popup-drawer-header">
                  <strong>📝 Offline Vault ({savedNotes.length})</strong>
                  <button type="button" onClick={() => setShowNotesDrawer(false)}><X size={12} /></button>
                </div>
                <div className="popup-drawer-body">
                  {notesError && <p role="alert">{notesError}</p>}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Save snippet to offline vault..."
                      value={newNoteInput}
                      onChange={e => setNewNoteInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newNoteInput.trim()) {
                          setSavedNotes(prev => [...prev, newNoteInput.trim()]);
                          setNewNoteInput('');
                        }
                      }}
                      style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 4, color: '#fff', fontSize: 10, padding: '4px 6px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newNoteInput.trim()) {
                          setSavedNotes(prev => [...prev, newNoteInput.trim()]);
                          setNewNoteInput('');
                        }
                      }}
                      style={{ background: '#38bdf8', border: 0, color: '#0f172a', fontWeight: 700, borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
                    >
                      Save
                    </button>
                  </div>
                  {savedNotes.map((note, idx) => (
                    <div key={idx} className="pin-popup-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#e2e8f0', flex: 1 }}>{note}</span>
                      <button
                        type="button"
                        onClick={() => setSavedNotes(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGE METADATA INSPECTOR MODAL */}
            {inspectingMessage && (
              <div className="inspect-modal-overlay" onClick={() => setInspectingMessage(null)}>
                <div className="inspect-modal-box" onClick={e => e.stopPropagation()}>
                  <div className="inspect-modal-header">
                    <strong>Message Metadata Inspector</strong>
                    <button type="button" onClick={() => setInspectingMessage(null)}><X size={12} /></button>
                  </div>
                  <div className="inspect-modal-grid">
                    <div><span className="i-label">Message ID:</span> <code>{inspectingMessage.id}</code></div>
                    <div><span className="i-label">Author:</span> <strong>{inspectingMessage.author}</strong></div>
                    <div><span className="i-label">Channel:</span> <code>#{inspectingMessage.channel || 'general-chat'}</code></div>
                    <div><span className="i-label">Timestamp:</span> <span>{inspectingMessage.time}</span></div>
                    <div><span className="i-label">Deleted:</span> <span style={{ color: inspectingMessage.deleted ? '#ff6471' : '#10b981' }}>{inspectingMessage.deleted ? 'Yes (Retained by Anti-Delete)' : 'No'}</span></div>
                    <div><span className="i-label">Ghost Ping:</span> <span style={{ color: inspectingMessage.ghostPing ? '#f59e0b' : '#94a3b8' }}>{inspectingMessage.ghostPing ? 'Yes (Mention Logged)' : 'None'}</span></div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span className="i-label">Raw Content:</span>
                      <pre className="i-pre">{inspectingMessage.content}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QUOTE REPLY BANNER */}
            {replyingTo && (
              <div className="in-app-reply-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                  <CornerDownLeft size={11} color="#ff6471" />
                  <span style={{ fontSize: 9, color: '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    Replying to <strong>@{replyingTo.author}</strong>: {replyingTo.content.slice(0, 32)}…
                  </span>
                </div>
                <button type="button" onClick={() => setReplyingTo(null)} className="reply-close-btn">
                  <X size={10} />
                </button>
              </div>
            )}

            {/* SLASH COMMAND AUTOCOMPLETE SUGGESTIONS POPUP */}
            {inputText.startsWith('/') && (
              <div className="in-app-slash-menu">
                <div className="slash-menu-header">AVAILABLE COMMANDS</div>
                {[
                  { cmd: '/assault export', desc: 'Export full HTML/JSON transcript of #' + activeChannel },
                  { cmd: '/assault ghost-pings', desc: 'Audit detected deleted mentions & authors' },
                  { cmd: '/assault search ', desc: 'Search cached message buffer locally' },
                  { cmd: '/shield status', desc: 'Run BeefBot & Anti-Raid Defense Audit' },
                  { cmd: '/voice join', desc: 'Connect to Opus 96kbps Voice Lounge' },
                  { cmd: '/theme amoled', desc: 'Switch client to OLED Pitch Black #000000' },
                  { cmd: '/note ', desc: 'Save snippet to browser-local vault' },
                ].filter(s => s.cmd.toLowerCase().startsWith(inputText.toLowerCase()) || inputText === '/').map(s => (
                  <button
                    key={s.cmd}
                    type="button"
                    className="slash-menu-item"
                    onClick={() => {
                      setInputText(s.cmd);
                    }}
                  >
                    <strong>{s.cmd}</strong>
                    <span>{s.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* CHAT INPUT BAR */}
            <div className="discord-input-container">
              <input
                type="text"
                placeholder={`Message #${activeChannel} (try / for slash commands)`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="discord-text-input"
              />
              <button
                type="button"
                className="discord-send-btn"
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
              >
                <Send size={14} />
              </button>
            </div>

            {/* ANDROID GESTURE NAVIGATION BAR */}
            <div className="android-nav-bar">
              <div className="nav-gesture-pill" />
            </div>
          </div>
        </div>

        {/* EMULATOR ACTION SIDEBAR */}
        <div className="emulator-side-toolbox">
          <h4>Emulator Test Tools</h4>

          <div className="toolbox-card">
            <span className="toolbox-label">Interactive Simulation</span>
            <div className="toolbox-btns">
              <button
                type="button"
                className="tool-btn"
                onClick={handleSimulateDelete}
              >
                <Trash2 size={12} />
                Simulate Anti-Delete Breach
              </button>

              <button
                type="button"
                className="tool-btn"
                onClick={() => {
                  setInputText('/assault export');
                }}
              >
                <Sparkles size={12} />
                Fill "/assault export" Command
              </button>

              <button
                type="button"
                className="tool-btn"
                onClick={() => {
                  setInputText('/assault ghost-pings');
                }}
              >
                <Bell size={12} />
                Fill "/assault ghost-pings"
              </button>
            </div>
          </div>

          <div className="toolbox-card">
            <span className="toolbox-label">Client Runtime Stats</span>
            <div className="toolbox-stats">
              <div className="t-stat-row">
                <span>Target SDK:</span>
                <strong>Android 16 (API 36)</strong>
              </div>
              <div className="t-stat-row">
                <span>Hook Engine:</span>
                <strong>LSPatch v0.6 + Xposed</strong>
              </div>
              <div className="t-stat-row">
                <span>JS Runtime:</span>
                <strong>Hermes v0.12.0</strong>
              </div>
              <div className="t-stat-row">
                <span>Current Mode:</span>
                <strong>{clientTheme === 'amoled' ? 'Pure Black OLED' : 'Slate Dark'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
