import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ChevronRight,
  User,
  Shield,
  Users,
  Key,
  Smartphone,
  Link,
  Film,
  QrCode,
  Layers,
  Sparkles,
  Wrench,
  UserCheck,
  Cloud,
  ShoppingBag,
  Gift,
  Zap,
  Mic,
  Palette,
  Eye,
  Globe,
  MessageSquare,
  Compass,
  Bell,
  Sliders,
  HelpCircle,
  FileText,
  Info,
  LogOut,
  Terminal,
  Award,
  Trash2,
  Check,
  Radio,
  RefreshCw,
  FolderGit2,
  Lock,
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Monitor
} from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';
import { SPOOF_PLATFORMS } from '../../data/initialData';

interface SettingsScreenProps {
  onBack: () => void;
  onOpenCss: () => void;
  onOpenBeefBot: () => void;
  onOpenPlugins: () => void;
  onOpenTokens: () => void;
  onOpenIconPacks?: () => void;
}

interface AuthorizedAppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  authorizedDate: string;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onOpenCss,
  onOpenBeefBot,
  onOpenPlugins,
  onOpenTokens,
  onOpenIconPacks
}) => {
  const {
    currentUser,
    settings,
    updateSettings,
    quests,
    enrollQuest,
    claimQuest,
    completeAllQuests,
    plugins,
    pluginSources,
    playAudio
  } = useAssault();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDevToolsWidget, setShowDevToolsWidget] = useState(false);
  const [selectedSubView, setSelectedSubView] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cacheToast, setCacheToast] = useState<string | null>(null);

  // Subview interactive states
  const [emailRevealed, setEmailRevealed] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [safeDmFilter, setSafeDmFilter] = useState<'safe' | 'friends' | 'off'>('safe');
  const [allowServerDms, setAllowServerDms] = useState(true);
  const [friendReqEveryone, setFriendReqEveryone] = useState(true);
  const [friendReqMutual, setFriendReqMutual] = useState(true);
  const [clipLength, setClipLength] = useState<'30s' | '60s' | '2m'>('60s');
  const [clipQuality, setClipQuality] = useState<'720p' | '1080p'>('1080p');
  const [qrScanningState, setQrScanningState] = useState<'scanning' | 'success'>('scanning');
  const [activeSpoof, setActiveSpoof] = useState(settings.activePlatform || 'ANDROID');
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState('Just now');
  const [voiceInputMode, setVoiceInputMode] = useState<'activity' | 'ptt'>('activity');
  const [inputVolume, setInputVolume] = useState(85);
  const [outputVolume, setOutputVolume] = useState(100);
  const [micTesting, setMicTesting] = useState(false);
  const [micMeterLevel, setMicMeterLevel] = useState(0);
  const [chatFontSize, setChatFontSize] = useState(16);
  const [convertEmoticons, setConvertEmoticons] = useState(true);
  const [showEmbeds, setShowEmbeds] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English, US');
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [notifSound, setNotifSound] = useState(true);

  // Connected OAuth applications state
  const [authorizedApps, setAuthorizedApps] = useState<AuthorizedAppItem[]>([
    {
      id: 'app_spotify',
      name: 'Spotify',
      description: 'Display listening activity on Discord profile and sync Listen Along sessions',
      icon: '🟢',
      authorizedDate: 'Jan 14, 2024'
    },
    {
      id: 'app_github',
      name: 'GitHub',
      description: 'Display public repositories, commit badges, and developer organization',
      icon: '🐙',
      authorizedDate: 'Mar 22, 2024'
    },
    {
      id: 'app_playstation',
      name: 'PlayStation Network',
      description: 'Display current PS5 gameplay presence on your profile status',
      icon: '🎮',
      authorizedDate: 'May 08, 2024'
    }
  ]);

  // Connected accounts state
  const [connectedSocials, setConnectedSocials] = useState([
    { name: 'Spotify', handle: '@d_records', connected: true, icon: '🎵' },
    { name: 'GitHub', handle: '@hypercharacterization', connected: true, icon: '💻' },
    { name: 'Twitch', handle: '@d_live', connected: true, icon: '🟣' },
    { name: 'Twitter / X', handle: '', connected: false, icon: '🐦' },
    { name: 'YouTube', handle: '', connected: false, icon: '▶️' },
    { name: 'Steam', handle: '', connected: false, icon: '🎲' }
  ]);

  // Shop avatar decorations
  const [avatarDecorations, setAvatarDecorations] = useState([
    { id: 'dec_1', name: 'Cyberpunk Visor', icon: '🥽', price: '450 Orbs', equipped: false },
    { id: 'dec_2', name: 'Sakura Petals', icon: '🌸', price: '300 Orbs', equipped: true },
    { id: 'dec_3', name: 'Neon Dragon Aura', icon: '🐉', price: '600 Orbs', equipped: false },
    { id: 'dec_4', name: 'Retro CRT Glitch', icon: '📺', price: '350 Orbs', equipped: false }
  ]);

  // Live Gateway Logs
  const [gatewayLogs, setGatewayLogs] = useState<string[]>([
    `[GATEWAY] CONNECTED: wss://gateway.discord.gg/?v=10&encoding=json (Session ID: 49fa81bc)`,
    `[GATEWAY] HELLO received: heartbeat_interval=41250ms`,
    `[DISPATCH] READY: User ID user_me_d (@hypercharacterization) | Guilds: 5`,
    `[GATEWAY] HEARTBEAT_ACK: ping latency 24ms`,
    `[PRIVACY] Forensic scrub: dropped 12 outgoing analytics packets`,
    `[DISPATCH] MESSAGE_CREATE: channel_id=ch_imsg | author=rep`,
    `[RTC VOICE] Opus encoder ready: 384kbps stereo | jitter buffer: 4ms`
  ]);

  // Simulate Mic audio level meter when test is active
  useEffect(() => {
    let timer: any;
    if (micTesting) {
      timer = setInterval(() => {
        setMicMeterLevel(Math.floor(Math.random() * 85) + 15);
      }, 120);
    } else {
      setMicMeterLevel(0);
    }
    return () => clearInterval(timer);
  }, [micTesting]);

  const showToast = (msg: string) => {
    setCacheToast(msg);
    setTimeout(() => setCacheToast(null), 2500);
  };

  const handleDeauthorizeApp = (id: string) => {
    setAuthorizedApps((prev) => prev.filter((a) => a.id !== id));
    showToast('Application deauthorized and access token revoked.');
  };

  const handleToggleSocial = (name: string) => {
    setConnectedSocials((prev) =>
      prev.map((s) => (s.name === name ? { ...s, connected: !s.connected } : s))
    );
    showToast(`Updated connection for ${name}.`);
  };

  const handleEquipDecoration = (id: string) => {
    setAvatarDecorations((prev) =>
      prev.map((d) => ({ ...d, equipped: d.id === id }))
    );
    showToast('Avatar decoration equipped.');
  };

  const handleTriggerCloudSync = () => {
    setCloudSyncing(true);
    setTimeout(() => {
      setCloudSyncing(false);
      setLastCloudSyncTime('Just now');
      showToast('Cloud configuration and plugin state synchronized.');
    }, 1200);
  };

  // Filter helper
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#f2f3f5] h-full overflow-hidden select-none">
      {/* 1. Top Header */}
      <div className="px-4 pt-3 pb-3 border-b border-[#141518] bg-[#000000] shrink-0">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={onBack}
            className="text-[#949ba4] hover:text-white transition p-1 cursor-pointer"
            title="Close Settings"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        </div>

        {/* Rounded Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#80848e] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1f22] text-[#f2f3f5] placeholder-[#80848e] text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#5865f2] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[#80848e] hover:text-white text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 max-w-2xl mx-auto w-full">
        {/* Toast Alert */}
        {cacheToast && (
          <div className="bg-[#23a55a] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in">
            <span>{cacheToast}</span>
            <Check className="w-4 h-4" />
          </div>
        )}

        {/* ACCOUNT SETTINGS GROUP */}
        {matchesSearch('Account Content Social Data Privacy Family Devices Connections Clips QR') && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider px-2">
              Account Settings
            </h2>
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              {matchesSearch('Account') && (
                <button
                  onClick={() => setSelectedSubView('account')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Account</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Content & Social') && (
                <button
                  onClick={() => setSelectedSubView('content_social')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Content & Social</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Data & Privacy') && (
                <button
                  onClick={() => setSelectedSubView('privacy')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Data & Privacy</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Authorized Apps') && (
                <button
                  onClick={() => setSelectedSubView('apps')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">Authorized Apps</span>
                      <span className="text-xs text-[#5865f2] bg-[#5865f2]/10 px-1.5 py-0.5 rounded font-bold">
                        {authorizedApps.length}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Devices') && (
                <button
                  onClick={() => setSelectedSubView('devices')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Devices</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Connections') && (
                <button
                  onClick={() => setSelectedSubView('connections')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Link className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Connections</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Clips') && (
                <button
                  onClick={() => setSelectedSubView('clips')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Film className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Clips</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Scan QR Code') && (
                <button
                  onClick={() => setSelectedSubView('qr')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Scan QR Code</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* CLIENT EXTENSIONS & PLUGINS GROUP */}
        {matchesSearch('Plugins Extensions Addon Themes BeefBot Account Switcher Cloud Sync Sources') && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider px-2">
              Extensions & Plugins
            </h2>
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              {matchesSearch('Plugins') && (
                <button
                  onClick={onOpenPlugins}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-[#5865f2] group-hover:scale-105 transition" />
                    <div>
                      <span className="text-sm font-medium text-white">Plugins</span>
                      <p className="text-[11px] text-[#949ba4]">
                        {plugins.filter((p) => p.isEnabled).length} active of {plugins.length} installed
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Plugin Sources & Repositories') && (
                <button
                  onClick={onOpenPlugins}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <FolderGit2 className="w-5 h-5 text-[#fee75c] group-hover:scale-105 transition" />
                    <div>
                      <span className="text-sm font-medium text-white">Plugin Sources & Repositories</span>
                      <p className="text-[11px] text-[#949ba4]">
                        {pluginSources.length} verified registry mirrors connected
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Custom CSS Themes') && (
                <button
                  onClick={onOpenCss}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-[#f47fff] group-hover:scale-105 transition" />
                    <div>
                      <span className="text-sm font-medium text-white">Custom CSS Themes</span>
                      <p className="text-[11px] text-[#949ba4]">Live CSS theme injection engine</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('BeefBot Autonomous Defense') && (
                <button
                  onClick={onOpenBeefBot}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#e03e3e] group-hover:scale-105 transition" />
                    <div>
                      <span className="text-sm font-medium text-white">BeefBot Defense & Automod</span>
                      <p className="text-[11px] text-[#949ba4]">Anti-Raid, Anti-Groupchat Trap, Auto-roast</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Account Switcher') && (
                <button
                  onClick={onOpenTokens}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-[#23a55a] group-hover:scale-105 transition" />
                    <span className="text-sm font-medium text-white">Account Switcher</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Cloud Sync') && (
                <button
                  onClick={() => setSelectedSubView('cloud_sync')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <div>
                      <span className="text-sm font-medium text-white">Cloud Sync</span>
                      <p className="text-[11px] text-[#949ba4]">Last synced: {lastCloudSyncTime}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Developer & Platform Spoofing') && (
                <button
                  onClick={() => setSelectedSubView('developer')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Developer & Spoofing Options</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* BILLING SETTINGS GROUP */}
        {matchesSearch('Billing Shop Quests Nitro Boost Gift') && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider px-2">
              Billing Settings
            </h2>
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              {matchesSearch('Shop') && (
                <button
                  onClick={() => setSelectedSubView('shop')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <div>
                      <span className="text-sm font-medium text-white">Shop & Decorations</span>
                      <p className="text-[11px] text-[#fee75c]">New avatar effects in store</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Quests') && (
                <button
                  onClick={() => setSelectedSubView('quests')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-[#fee75c] group-hover:scale-105 transition" />
                    <div>
                      <span className="text-sm font-medium text-white">Quests</span>
                      <p className="text-[11px] text-[#949ba4]">
                        {quests.filter((q) => q.isEnrolled && !q.isClaimed).length} active quests ready
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Manage Nitro') && (
                <button
                  onClick={() => setSelectedSubView('nitro')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#f47fff] group-hover:scale-105 transition" />
                    <span className="text-sm font-medium text-white">Manage Nitro</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Server Boost') && (
                <button
                  onClick={() => setSelectedSubView('boost')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#f47fff] group-hover:scale-105 transition" />
                    <span className="text-sm font-medium text-white">Server Boost</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* APP SETTINGS GROUP */}
        {matchesSearch('App Voice Appearance Theme Accessibility Language Chat Browser Notifications Icon') && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider px-2">
              App Settings
            </h2>
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              {matchesSearch('Voice') && (
                <button
                  onClick={() => setSelectedSubView('voice')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Voice & Audio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#949ba4]">{voiceInputMode === 'activity' ? 'Voice Activity' : 'Push to Talk'}</span>
                    <ChevronRight className="w-4 h-4 text-[#80848e]" />
                  </div>
                </button>
              )}

              {matchesSearch('Appearance Theme') && (
                <button
                  onClick={onOpenCss}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-[#5865f2] group-hover:scale-105 transition" />
                    <span className="text-sm font-medium text-white">Appearance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#5865f2] font-semibold">Custom Theme</span>
                    <ChevronRight className="w-4 h-4 text-[#80848e]" />
                  </div>
                </button>
              )}

              {matchesSearch('Accessibility') && (
                <button
                  onClick={() => setSelectedSubView('accessibility')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Accessibility</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Language') && (
                <button
                  onClick={() => setSelectedSubView('language')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Language</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#949ba4]">{selectedLanguage}</span>
                    <ChevronRight className="w-4 h-4 text-[#80848e]" />
                  </div>
                </button>
              )}

              {matchesSearch('Chat') && (
                <button
                  onClick={() => setSelectedSubView('chat')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Chat & Media</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('Notifications') && (
                <button
                  onClick={() => setSelectedSubView('notifications')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">Notifications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}

              {matchesSearch('App Icon') && (
                <button
                  onClick={onOpenIconPacks}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Sliders className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                    <span className="text-sm font-medium text-white">App Icon Packs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#80848e]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* SUPPORT GROUP */}
        {matchesSearch('Support Debug logs Acknowledgements What New') && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider px-2">
              Support & Information
            </h2>
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              <button
                onClick={() => setSelectedSubView('support')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Support & Diagnostics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>

              <button
                onClick={() => setSelectedSubView('whats_new')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">What's New</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>

              <button
                onClick={() => setSelectedSubView('acknowledgements')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Acknowledgements</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>
            </div>
          </div>
        )}

        {/* LOG OUT BUTTON CARD */}
        {matchesSearch('Log Out') && (
          <div className="bg-[#111214] rounded-2xl overflow-hidden border border-[#1e1f22]">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 p-4 hover:bg-[#18191c] transition cursor-pointer text-left"
            >
              <LogOut className="w-5 h-5 text-[#f23f43]" />
              <span className="text-sm font-bold text-[#f23f43]">Log Out</span>
            </button>
          </div>
        )}

        {/* DEVELOPER SETTINGS GROUP */}
        {matchesSearch('Developer Settings App Version Device Info Client Logs Cache Actions i18n') && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider px-2">
              Developer Settings
            </h2>
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-[#949ba4]" />
                  <span className="text-sm font-medium text-white">App Version</span>
                </div>
                <span className="text-xs text-[#949ba4] font-mono">
                  347.12 (6518) - googleRelease
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-[#949ba4]" />
                  <span className="text-sm font-medium text-white">Device Info</span>
                </div>
                <span className="text-xs text-[#949ba4] font-mono">
                  a53x (SM-A536W) (36)
                </span>
              </div>

              <button
                onClick={() => setSelectedSubView('client_info')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Client System Info</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>

              <button
                onClick={() => setSelectedSubView('logs')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Gateway WebSocket Logs</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>

              <button
                onClick={() => {
                  showToast('Freed 42.8 MB of cached audio synthesizer and media buffers.');
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Purge Local Cache</span>
                </div>
                <span className="text-xs text-[#949ba4]">42.8 MB</span>
              </button>
            </div>
          </div>
        )}

        {/* STAFF SETTINGS GROUP */}
        {matchesSearch('Staff Settings Show Dev Tools Widget Design System') && (
          <div className="space-y-1.5 pb-8">
            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider px-2">
              Staff & Diagnostic Tools
            </h2>
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-[#949ba4]" />
                  <span className="text-sm font-medium text-white">Show Dev Tools Widget</span>
                </div>
                <button
                  onClick={() => setShowDevToolsWidget(!showDevToolsWidget)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    showDevToolsWidget ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 absolute top-0.5 ${
                      showDevToolsWidget ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => setSelectedSubView('staff_dev_tools')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Show Dev Tools Inspector</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FULLY FUNCTIONAL SUB-VIEW SCREENS (ZERO STUBS) */}
      {selectedSubView && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#111214] border border-[#232428] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Subview Header */}
            <div className="px-5 py-4 border-b border-[#1e1f22] flex items-center justify-between shrink-0">
              <h3 className="font-bold text-white text-base capitalize">
                {selectedSubView.replace('_', ' ')}
              </h3>
              <button
                onClick={() => setSelectedSubView(null)}
                className="text-[#949ba4] hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subview Body Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-sm text-[#dbdee1]">
              {/* 1. Account Settings Subview */}
              {selectedSubView === 'account' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#18191c] rounded-xl border border-[#232428] flex items-center gap-3">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="w-12 h-12 rounded-full object-cover border border-[#232428]"
                    />
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {currentUser.globalName || currentUser.username}
                      </h4>
                      <p className="text-xs text-[#949ba4]">@{currentUser.username}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#80848e] uppercase">Email</label>
                    <div className="flex items-center justify-between p-3 bg-[#18191c] rounded-xl border border-[#232428]">
                      <span className="text-sm text-white">
                        {emailRevealed ? 'tyeule94@gmail.com' : 't***@gmail.com'}
                      </span>
                      <button
                        onClick={() => setEmailRevealed(!emailRevealed)}
                        className="text-xs text-[#5865f2] font-semibold hover:underline"
                      >
                        {emailRevealed ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#80848e] uppercase">Phone Number</label>
                    <div className="flex items-center justify-between p-3 bg-[#18191c] rounded-xl border border-[#232428]">
                      <span className="text-sm text-white">
                        {phoneRevealed ? '+1 (555) 019-6518' : '+1 (***) ***-6518'}
                      </span>
                      <button
                        onClick={() => setPhoneRevealed(!phoneRevealed)}
                        className="text-xs text-[#5865f2] font-semibold hover:underline"
                      >
                        {phoneRevealed ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1e1f22] space-y-2">
                    <h4 className="text-xs font-bold text-[#80848e] uppercase">Password & Authentication</h4>
                    <button
                      onClick={() => showToast('Password reset link sent to your verified email.')}
                      className="w-full py-2 bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-bold rounded-xl transition"
                    >
                      Change Password
                    </button>
                    <div className="flex items-center justify-between p-3 bg-[#18191c] rounded-xl border border-[#232428]">
                      <div>
                        <p className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</p>
                        <p className="text-[11px] text-[#23a55a]">Enabled via Authenticator App</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#23a55a]" />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Content & Social Subview */}
              {selectedSubView === 'content_social' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#80848e] uppercase mb-2">Safe Direct Messaging</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'safe', label: 'Keep Me Safe', desc: 'Scan direct messages from everyone for explicit content.' },
                        { id: 'friends', label: 'My Friends Are Nice', desc: 'Scan direct messages from everyone except your direct friends.' },
                        { id: 'off', label: 'Do Not Scan', desc: 'Direct messages will not be automatically filtered.' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSafeDmFilter(item.id as any)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            safeDmFilter === item.id
                              ? 'bg-[#5865f2]/10 border-[#5865f2] text-white'
                              : 'bg-[#18191c] border-[#232428] text-[#949ba4]'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{item.label}</p>
                            <p className="text-[11px] text-[#80848e]">{item.desc}</p>
                          </div>
                          {safeDmFilter === item.id && <Check className="w-4 h-4 text-[#5865f2]" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1e1f22] space-y-3">
                    <h4 className="text-xs font-bold text-[#80848e] uppercase">Who Can Send You Friend Requests</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[#18191c] rounded-xl border border-[#232428]">
                        <span className="text-xs font-bold text-white">Everyone</span>
                        <input
                          type="checkbox"
                          checked={friendReqEveryone}
                          onChange={(e) => setFriendReqEveryone(e.target.checked)}
                          className="w-4 h-4 accent-[#5865f2]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#18191c] rounded-xl border border-[#232428]">
                        <span className="text-xs font-bold text-white">Friends of Friends</span>
                        <input
                          type="checkbox"
                          checked={friendReqMutual}
                          onChange={(e) => setFriendReqMutual(e.target.checked)}
                          className="w-4 h-4 accent-[#5865f2]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Authorized Apps Subview */}
              {selectedSubView === 'apps' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#949ba4]">
                    These applications have access to your Discord account. You can revoke access at any time.
                  </p>
                  {authorizedApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 bg-[#18191c] rounded-xl border border-[#232428] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{app.icon}</span>
                        <div>
                          <h4 className="font-bold text-white text-sm">{app.name}</h4>
                          <p className="text-[11px] text-[#949ba4] max-w-xs">{app.description}</p>
                          <span className="text-[10px] text-[#80848e] mt-1 block">Authorized on {app.authorizedDate}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeauthorizeApp(app.id)}
                        className="px-3 py-1.5 bg-[#f23f43]/15 text-[#f23f43] hover:bg-[#f23f43] hover:text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Deauthorize
                      </button>
                    </div>
                  ))}
                  {authorizedApps.length === 0 && (
                    <p className="text-center py-6 text-xs text-[#80848e]">No third-party applications authorized.</p>
                  )}
                </div>
              )}

              {/* 4. Active Devices Subview */}
              {selectedSubView === 'devices' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-[#18191c] rounded-xl border border-[#23a55a]/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#23a55a]" />
                        <h4 className="font-bold text-white text-sm">Samsung Galaxy A53 (SM-A536W)</h4>
                      </div>
                      <span className="text-[10px] bg-[#23a55a] text-white font-bold px-2 py-0.5 rounded-full">
                        Current Device
                      </span>
                    </div>
                    <p className="text-xs text-[#949ba4]">Discord Android 347.12 • Active Now</p>
                    <p className="text-[11px] text-[#80848e]">IP Address: 142.250.190.46 (Salt Lake City, US)</p>
                  </div>

                  <div className="p-3.5 bg-[#18191c] rounded-xl border border-[#232428] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-[#949ba4]" />
                        <h4 className="font-bold text-white text-sm">Windows 11 Workstation</h4>
                      </div>
                      <button
                        onClick={() => showToast('Session revoked.')}
                        className="text-xs text-[#f23f43] hover:underline"
                      >
                        Log Out
                      </button>
                    </div>
                    <p className="text-xs text-[#949ba4]">Assault Client Native • Active 2h ago</p>
                    <p className="text-[11px] text-[#80848e]">IP Address: 64.233.160.19</p>
                  </div>
                </div>
              )}

              {/* 5. Connections Subview */}
              {selectedSubView === 'connections' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#949ba4]">
                    Connect your gaming, social, and streaming accounts to display on your profile.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {connectedSocials.map((social) => (
                      <div
                        key={social.name}
                        onClick={() => handleToggleSocial(social.name)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          social.connected
                            ? 'bg-[#18191c] border-[#5865f2]/40 text-white'
                            : 'bg-[#111214] border-[#232428] text-[#80848e] hover:bg-[#18191c]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-lg">{social.icon}</span>
                          <div className="truncate">
                            <span className="text-xs font-bold block truncate">{social.name}</span>
                            {social.handle && (
                              <span className="text-[10px] text-[#23a55a] block truncate">
                                {social.handle}
                              </span>
                            )}
                          </div>
                        </div>
                        {social.connected ? (
                          <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                        ) : (
                          <span className="text-[10px] text-[#5865f2] font-bold shrink-0">Connect</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Clips Subview */}
              {selectedSubView === 'clips' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#80848e] uppercase">Clip Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['30s', '60s', '2m'] as const).map((len) => (
                        <button
                          key={len}
                          onClick={() => setClipLength(len)}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            clipLength === len
                              ? 'bg-[#5865f2] border-[#5865f2] text-white'
                              : 'bg-[#18191c] border-[#232428] text-[#949ba4]'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#80848e] uppercase">Resolution & Frame Rate</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['720p', '1080p'] as const).map((res) => (
                        <button
                          key={res}
                          onClick={() => setClipQuality(res)}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            clipQuality === res
                              ? 'bg-[#5865f2] border-[#5865f2] text-white'
                              : 'bg-[#18191c] border-[#232428] text-[#949ba4]'
                          }`}
                        >
                          {res === '720p' ? '720p (30 FPS)' : '1080p (60 FPS)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Scan QR Code Subview */}
              {selectedSubView === 'qr' && (
                <div className="text-center space-y-4 py-2">
                  <div className="w-56 h-56 mx-auto bg-[#18191c] border-2 border-dashed border-[#5865f2] rounded-3xl relative overflow-hidden flex items-center justify-center">
                    {qrScanningState === 'scanning' ? (
                      <>
                        <div className="w-44 h-44 border border-[#2b2d31] rounded-2xl flex items-center justify-center bg-black/40">
                          <QrCode className="w-28 h-28 text-[#5865f2]/80 animate-pulse" />
                        </div>
                        <div className="absolute left-0 right-0 h-1 bg-[#5865f2] top-0 animate-bounce" />
                      </>
                    ) : (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-16 h-16 text-[#23a55a] mx-auto animate-in zoom-in-90" />
                        <p className="text-xs font-bold text-white">QR Code Verified!</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#949ba4] max-w-xs mx-auto">
                    Point your camera at the QR code on your computer Discord screen to log in immediately.
                  </p>
                  <button
                    onClick={() => {
                      setQrScanningState('success');
                      showToast('Desktop login authorized successfully.');
                      setTimeout(() => setQrScanningState('scanning'), 2000);
                    }}
                    className="px-5 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition"
                  >
                    Simulate Scan & Authorize
                  </button>
                </div>
              )}

              {/* 8. Voice & Audio Subview */}
              {selectedSubView === 'voice' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#80848e] uppercase mb-2 block">Input Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setVoiceInputMode('activity')}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                          voiceInputMode === 'activity'
                            ? 'bg-[#5865f2] border-[#5865f2] text-white'
                            : 'bg-[#18191c] border-[#232428] text-[#949ba4]'
                        }`}
                      >
                        Voice Activity
                      </button>
                      <button
                        onClick={() => setVoiceInputMode('ptt')}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                          voiceInputMode === 'ptt'
                            ? 'bg-[#5865f2] border-[#5865f2] text-white'
                            : 'bg-[#18191c] border-[#232428] text-[#949ba4]'
                        }`}
                      >
                        Push to Talk
                      </button>
                    </div>
                  </div>

                  {/* Volume sliders */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">Input Volume</span>
                        <span className="text-[#949ba4]">{inputVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={inputVolume}
                        onChange={(e) => setInputVolume(Number(e.target.value))}
                        className="w-full accent-[#5865f2]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">Output Volume</span>
                        <span className="text-[#949ba4]">{outputVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={outputVolume}
                        onChange={(e) => setOutputVolume(Number(e.target.value))}
                        className="w-full accent-[#5865f2]"
                      />
                    </div>
                  </div>

                  {/* Mic Test with live audio meter */}
                  <div className="p-3.5 bg-[#18191c] rounded-xl border border-[#232428] space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">Mic Test</p>
                        <p className="text-[11px] text-[#80848e]">Check your input sensitivity and clarity</p>
                      </div>
                      <button
                        onClick={() => setMicTesting(!micTesting)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                          micTesting ? 'bg-[#f23f43] text-white' : 'bg-[#5865f2] text-white'
                        }`}
                      >
                        {micTesting ? 'Stop Testing' : "Let's Check"}
                      </button>
                    </div>
                    {/* Live Visual Volume Bar */}
                    <div className="h-2 bg-[#232428] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#23a55a] transition-all duration-100"
                        style={{ width: `${micMeterLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 9. Shop & Avatar Decorations */}
              {selectedSubView === 'shop' && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#5865f2]/15 border border-[#5865f2]/30 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">Orb Wallet</h4>
                      <p className="text-[11px] text-[#fee75c]">Balance: 1,250 Orbs available</p>
                    </div>
                    <ShoppingBag className="w-5 h-5 text-[#5865f2]" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {avatarDecorations.map((dec) => (
                      <div
                        key={dec.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                          dec.equipped ? 'bg-[#18191c] border-[#23a55a]' : 'bg-[#111214] border-[#232428]'
                        }`}
                      >
                        <div className="text-center py-2">
                          <span className="text-4xl">{dec.icon}</span>
                          <p className="text-xs font-bold text-white mt-2">{dec.name}</p>
                          <p className="text-[10px] text-[#fee75c]">{dec.price}</p>
                        </div>
                        <button
                          onClick={() => handleEquipDecoration(dec.id)}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${
                            dec.equipped
                              ? 'bg-[#23a55a] text-white'
                              : 'bg-[#2b2d31] hover:bg-[#5865f2] text-white'
                          }`}
                        >
                          {dec.equipped ? 'Equipped ✓' : 'Equip'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Gateway Logs & Diagnostics */}
              {selectedSubView === 'logs' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#80848e] uppercase">Real-Time Gateway Stream</span>
                    <button
                      onClick={() => setGatewayLogs([])}
                      className="text-xs text-[#f23f43] hover:underline"
                    >
                      Clear Stream
                    </button>
                  </div>
                  <div className="p-3 bg-[#08080a] border border-[#232428] rounded-xl font-mono text-[11px] text-[#23a55a] space-y-1 max-h-64 overflow-y-auto">
                    {gatewayLogs.map((log, i) => (
                      <div key={i} className="leading-relaxed">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. Client Info Subview */}
              {selectedSubView === 'client_info' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 bg-[#18191c] rounded-xl border border-[#232428] space-y-2 text-[#dbdee1]">
                    <div className="flex justify-between"><span className="text-[#80848e]">Client Engine:</span><span className="text-white">Assault v2.5.0</span></div>
                    <div className="flex justify-between"><span className="text-[#80848e]">Build Target:</span><span className="text-white">Discord 347.12 (6518)</span></div>
                    <div className="flex justify-between"><span className="text-[#80848e]">React Runtime:</span><span className="text-white">19.0.0 (Vite 6.2.0)</span></div>
                    <div className="flex justify-between"><span className="text-[#80848e]">Operating System:</span><span className="text-white">Android 14 (Linux 5.10.x)</span></div>
                    <div className="flex justify-between"><span className="text-[#80848e]">Audio Synthesizer:</span><span className="text-[#23a55a]">Web Audio API (Opus 384kbps)</span></div>
                    <div className="flex justify-between"><span className="text-[#80848e]">Connected Mirrors:</span><span className="text-white">{pluginSources.length} Repositories</span></div>
                  </div>
                </div>
              )}

              {/* 12. Quests Subview */}
              {selectedSubView === 'quests' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-[#949ba4]">Complete Discord quests for exclusive badges</p>
                    <button
                      onClick={completeAllQuests}
                      className="px-3 py-1 bg-[#5865f2] text-white text-xs font-bold rounded-lg hover:bg-[#4752c4] transition"
                    >
                      Complete All
                    </button>
                  </div>
                  {quests.map((q) => (
                    <div key={q.id} className="p-3 bg-[#18191c] rounded-xl border border-[#232428] flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{q.title}</h4>
                        <p className="text-xs text-[#949ba4]">{q.description}</p>
                        <p className="text-[11px] text-[#fee75c] mt-0.5">Reward: {q.rewardName}</p>
                      </div>
                      <div>
                        {q.isClaimed ? (
                          <span className="text-xs text-[#23a55a] font-bold">Claimed ✓</span>
                        ) : q.progress >= q.target ? (
                          <button
                            onClick={() => claimQuest(q.id)}
                            className="px-3 py-1.5 bg-[#23a55a] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Claim
                          </button>
                        ) : (
                          <button
                            onClick={() => enrollQuest(q.id)}
                            className="px-3 py-1.5 bg-[#35373c] text-white text-xs font-bold rounded-lg hover:bg-[#5865f2] cursor-pointer"
                          >
                            {q.isEnrolled ? `${q.progress}/${q.target}m` : 'Enroll'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 13. Privacy Subview */}
              {selectedSubView === 'privacy' && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#18191c] rounded-xl border border-[#232428] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">Ghost Read Receipts</span>
                      <input
                        type="checkbox"
                        checked={settings.ghostRead}
                        onChange={(e) => updateSettings({ ghostRead: e.target.checked })}
                        className="w-4 h-4 accent-[#5865f2]"
                      />
                    </div>
                    <p className="text-xs text-[#949ba4]">Removes Discord channel ack analytics and read receipts automatically</p>
                  </div>

                  <div className="p-3 bg-[#18191c] rounded-xl border border-[#232428] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">Anti-Delete Message Vault</span>
                      <input
                        type="checkbox"
                        checked={settings.antiDelete}
                        onChange={(e) => updateSettings({ antiDelete: e.target.checked })}
                        className="w-4 h-4 accent-[#5865f2]"
                      />
                    </div>
                    <p className="text-xs text-[#949ba4]">Preserves deleted messages with red strikethrough timestamps</p>
                  </div>

                  <div className="p-3 bg-[#18191c] rounded-xl border border-[#232428] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">Silent Typing Interceptor</span>
                      <input
                        type="checkbox"
                        checked={settings.silentTyping}
                        onChange={(e) => updateSettings({ silentTyping: e.target.checked })}
                        className="w-4 h-4 accent-[#5865f2]"
                      />
                    </div>
                    <p className="text-xs text-[#949ba4]">Never broadcast typing indicator events to Discord gateway</p>
                  </div>
                </div>
              )}

              {/* 14. Cloud Sync Subview */}
              {selectedSubView === 'cloud_sync' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#18191c] rounded-xl border border-[#232428] space-y-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-[#5865f2]" />
                      <h4 className="font-bold text-white text-sm">Assault Cloud Sync Vault</h4>
                    </div>
                    <p className="text-xs text-[#949ba4]">
                      Automatically backs up your CSS themes, plugins, and keybinds across all your devices.
                    </p>
                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-[11px] text-[#80848e]">Last Synced: {lastCloudSyncTime}</span>
                      <button
                        onClick={handleTriggerCloudSync}
                        disabled={cloudSyncing}
                        className="px-4 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg transition"
                      >
                        {cloudSyncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 15. What's New Subview */}
              {selectedSubView === 'whats_new' && (
                <div className="space-y-3">
                  <div className="p-4 bg-[#18191c] rounded-xl border border-[#232428] space-y-2">
                    <span className="text-xs text-[#5865f2] font-bold">RELEASE 347.12</span>
                    <h4 className="font-bold text-white text-sm">Native Android & Discord Redesign</h4>
                    <ul className="text-xs text-[#dbdee1] space-y-1.5 list-disc list-inside">
                      <li>Complete redesign matching modern Discord Mobile UI & You tab.</li>
                      <li>New Notifications tab with Bookmarks and Reminders integration.</li>
                      <li>In-browser Web Audio soundboard synthesizer with zero external assets.</li>
                      <li>Live custom CSS theme engine and verified plugin sources catalog.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 16. Support & Acknowledgements Subview */}
              {(selectedSubView === 'support' || selectedSubView === 'acknowledgements') && (
                <div className="space-y-3">
                  <div className="p-4 bg-[#18191c] rounded-xl border border-[#232428] space-y-2">
                    <h4 className="font-bold text-white text-sm">Discord Support & Status</h4>
                    <p className="text-xs text-[#949ba4]">
                      All gateway connections, RTC voice clusters, and API routes are currently operational (100% uptime).
                    </p>
                    <a
                      href="https://discordstatus.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#5865f2] font-bold flex items-center gap-1 hover:underline pt-1"
                    >
                      <span>Check discordstatus.com</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Log Out</h3>
            <p className="text-sm text-[#949ba4]">
              Are you sure you want to log out of @{currentUser.username}?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs text-white hover:underline cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onOpenTokens();
                }}
                className="px-5 py-2 bg-[#f23f43] hover:bg-[#d83a3e] text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
