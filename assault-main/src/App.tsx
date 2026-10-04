import React, { useState } from 'react';
import { useAssault, AssaultProvider } from './context/AssaultContext';
import { ServerRail } from './components/ServerRail';
import { ChannelDrawer } from './components/ChannelDrawer';
import { ChatView } from './components/ChatView';
import { MembersDrawer } from './components/MembersDrawer';
import { ManagerScreen } from './components/screens/ManagerScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { DiscordMobileBottomNav, MobileTab } from './components/DiscordMobileBottomNav';
import { DiscordMobileYouTab } from './components/DiscordMobileYouTab';
import { DiscordMobileDMsTab } from './components/DiscordMobileDMsTab';
import { DiscordMobileNotificationsTab } from './components/DiscordMobileNotificationsTab';

import { PerformanceMonitorModal } from './components/dialogs/PerformanceMonitorModal';
import { DiagnosticOverlayModal } from './components/dialogs/DiagnosticOverlayModal';
import { BeefBotConfigModal } from './components/dialogs/BeefBotConfigModal';
import { PluginMarketplaceModal } from './components/screens/PluginMarketplaceModal';
import { PrivacyDashboardModal } from './components/screens/PrivacyDashboardModal';
import { CssThemeModal } from './components/dialogs/CssThemeModal';
import { IconPacksModal } from './components/dialogs/IconPacksModal';
import { KeybindsModal } from './components/dialogs/KeybindsModal';
import { TokenSwitcherModal } from './components/dialogs/TokenSwitcherModal';
import { UserProfileModal } from './components/dialogs/UserProfileModal';
import { EditHistoryModal } from './components/dialogs/EditHistoryModal';
import { EmotePickerModal } from './components/dialogs/EmotePickerModal';
import { ExportChatModal } from './components/dialogs/ExportChatModal';
import { SoundboardModal } from './components/dialogs/SoundboardModal';
import { PinnedMessagesModal } from './components/dialogs/PinnedMessagesModal';
import { QuickSwitcherModal } from './components/dialogs/QuickSwitcherModal';
import { FontsModal } from './components/dialogs/FontsModal';
import { AppIconDesignerModal } from './components/dialogs/AppIconDesignerModal';
import { CrashReporterModal } from './components/dialogs/CrashReporterModal';
import { DiscordMessage, DiscordUser } from './types';
import { Smartphone, Monitor, Settings, Search, Wifi, Signal, BatteryCharging, Wrench, Palette, Type, AlertTriangle, Shield, Globe } from 'lucide-react';
import { haptics } from './services/hapticsService';

const AssaultAppContent: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    currentUser,
    selectChannel,
    sendMessage,
    activeMode,
    setActiveMode,
    activeAccountToken,
    gatewayStatus
  } = useAssault();

  // Discord Mobile navigation tabs (Default to 'servers' to match Screenshot 8)
  const [mobileTab, setMobileTab] = useState<MobileTab>('servers');

  // Preview frame mode: 'mobile' shows phone device shell on desktop, 'full' spans viewport
  const [deviceFrameMode, setDeviceFrameMode] = useState<'mobile' | 'full'>('mobile');

  // Hypothetical Battery State & Charging Animation
  const [isCharging, setIsCharging] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(84);

  // Drawers state (Right for members)
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [showDiagnosticOverlay, setShowDiagnosticOverlay] = useState(false);
  const [showBeefBotModal, setShowBeefBotModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCssModal, setShowCssModal] = useState(false);
  const [showIconPacksModal, setShowIconPacksModal] = useState(false);
  const [showKeybindsModal, setShowKeybindsModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [showSoundboardModal, setShowSoundboardModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showQuickSwitcherModal, setShowQuickSwitcherModal] = useState(false);
  const [showFontsModal, setShowFontsModal] = useState(false);
  const [showIconDesignerModal, setShowIconDesignerModal] = useState(false);
  const [showCrashReporterModal, setShowCrashReporterModal] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<DiscordUser | null>(null);
  const [selectedMessageForHistory, setSelectedMessageForHistory] = useState<DiscordMessage | null>(null);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowQuickSwitcherModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If in Standalone Manager view
  if (viewMode === 'manager') {
    return <ManagerScreen onBackToClient={() => setViewMode('client')} />;
  }

  // If Settings screen is open
  if (isSettingsOpen) {
    return (
      <div className="min-h-screen w-screen bg-[#000000] flex justify-center items-center">
        <div className={`w-full h-screen ${deviceFrameMode === 'mobile' ? 'max-w-[430px] border-x border-[#232428]' : ''} flex flex-col bg-[#000000] overflow-hidden`}>
          <SettingsScreen
            onBack={() => setIsSettingsOpen(false)}
            onOpenCss={() => setShowCssModal(true)}
            onOpenBeefBot={() => setShowBeefBotModal(true)}
            onOpenPlugins={() => setShowMarketplaceModal(true)}
            onOpenTokens={() => setShowTokenModal(true)}
            onOpenIconPacks={() => setShowIconPacksModal(true)}
          />
        </div>
      </div>
    );
  }

  // The Core Discord Mobile Application Shell
  const discordAppView = (
    <div className="flex flex-col h-full w-full bg-[#000000] text-[#f2f3f5] overflow-hidden select-none font-sans relative">
      {/* 1. Android/iOS Status Bar matching Screenshots (5:14, Wifi, Battery) */}
      <div className="h-6 bg-[#000000] px-4 flex items-center justify-between text-xs text-[#dbdee1] font-semibold shrink-0 select-none z-30">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] tracking-tight text-white font-medium">5:14</span>
          {/* Subtle notification dots */}
          <div className="w-1.5 h-1.5 rounded-full bg-[#5865f2]" />
        </div>

        <button
          onClick={() => {
            haptics.buttonPress();
            setIsCharging((prev) => !prev);
          }}
          className="flex items-center gap-1.5 text-[11px] text-[#dbdee1] cursor-pointer hover:opacity-90 transition group select-none active:scale-95"
          title={isCharging ? "Battery: Fast Charging (Click to toggle)" : "Battery: Discharging (Click to simulate charging)"}
        >
          <Signal className="w-3 h-3 text-[#dbdee1]" />
          <Wifi className="w-3.5 h-3.5 text-[#dbdee1]" />

          {/* Dynamic Battery Charging Indicator */}
          {isCharging ? (
            <div className="flex items-center gap-1 bg-[#23a55a]/15 text-[#23a55a] border border-[#23a55a]/30 px-1.5 py-0.2 rounded-full animate-pulse transition-all duration-300">
              <BatteryCharging className="w-3 h-3 text-[#23a55a] shrink-0 animate-bounce" />
              <span className="text-[9px] font-extrabold uppercase tracking-tight hidden group-hover:inline sm:inline">
                Charging
              </span>
              <span className="text-[10px] font-bold text-[#23a55a]">{batteryLevel}%</span>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-[#dbdee1]">{batteryLevel}%</span>
          )}

          {/* Graphical Battery Pill */}
          <div className={`w-4 h-2 border rounded-xs p-0.5 flex items-center transition-colors duration-300 ${
            isCharging
              ? 'border-[#23a55a] shadow-[0_0_6px_rgba(35,165,90,0.6)]'
              : 'border-white/70'
          }`}>
            <div
              className={`h-full rounded-xs transition-all duration-500 ${
                isCharging
                  ? 'bg-[#23a55a] animate-pulse'
                  : 'bg-white'
              }`}
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
        </button>
      </div>

      {/* 2. Main Viewport Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TAB 1: SERVERS & CHANNELS (Screenshot 8: ServerRail on left, ChannelDrawer on right) */}
        {mobileTab === 'servers' && (
          <div className="flex-1 flex overflow-hidden w-full h-full relative animate-in fade-in duration-100">
            {/* Server Rail (72px) */}
            <ServerRail
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenTokens={() => setShowTokenModal(true)}
              onOpenProfile={() => setSelectedUserForProfile(currentUser)}
            />

            {/* Channel Drawer (Fills remaining width) */}
            <ChannelDrawer
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenProfile={() => setSelectedUserForProfile(currentUser)}
              onCloseDrawer={() => {}}
              onChannelSelected={() => setMobileTab('chat')}
            />
          </div>
        )}

        {/* TAB 1 SUB-VIEW: FULL CHAT VIEW (Tapped from Channel List) */}
        {mobileTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative animate-in slide-in-from-right-2 duration-150">
            <ChatView
              onOpenDrawer={() => setMobileTab('servers')}
              onBackToServers={() => setMobileTab('servers')}
              onToggleMembers={() => setIsMembersOpen((prev) => !prev)}
              onOpenUserProfile={(u) => setSelectedUserForProfile(u)}
              onOpenEditHistory={(msg) => setSelectedMessageForHistory(msg)}
              onOpenEmotePicker={() => setShowEmotePicker(true)}
              onOpenExportDialog={() => setShowExportModal(true)}
              onOpenMonitor={() => setShowDiagnosticOverlay(true)}
              onOpenBeefBot={() => setShowBeefBotModal(true)}
              onOpenPlugins={() => setShowMarketplaceModal(true)}
              onOpenCss={() => setShowCssModal(true)}
              onOpenIconPacks={() => setShowIconPacksModal(true)}
              onOpenPrivacy={() => setShowPrivacyModal(true)}
              onOpenTokens={() => setShowTokenModal(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenSoundboard={() => setShowSoundboardModal(true)}
              onOpenPinnedMessages={() => setShowPinnedModal(true)}
              onOpenQuickSwitcher={() => setShowQuickSwitcherModal(true)}
            />
          </div>
        )}

        {/* TAB 2: MESSAGES / DMs */}
        {mobileTab === 'dms' && (
          <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative animate-in fade-in duration-100">
            <DiscordMobileDMsTab
              onSelectChannel={(chId) => {
                selectChannel(chId);
                setMobileTab('chat');
              }}
              onOpenUserProfile={(u) => setSelectedUserForProfile(u)}
            />
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS (Screenshots 9-11) */}
        {mobileTab === 'notifications' && (
          <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative animate-in fade-in duration-100">
            <DiscordMobileNotificationsTab
              onSelectChannel={(chId) => {
                selectChannel(chId);
                setMobileTab('chat');
              }}
            />
          </div>
        )}

        {/* TAB 4: YOU / PROFILE (Screenshots 5-6) */}
        {mobileTab === 'you' && (
          <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative animate-in fade-in duration-100">
            <DiscordMobileYouTab
              onOpenPrivacy={() => setShowPrivacyModal(true)}
              onOpenBeefBot={() => setShowBeefBotModal(true)}
              onOpenMarketplace={() => setShowMarketplaceModal(true)}
              onOpenCss={() => setShowCssModal(true)}
              onOpenIconPacks={() => setShowIconPacksModal(true)}
              onOpenDiagnostics={() => setShowDiagnosticOverlay(true)}
              onOpenTokens={() => setShowTokenModal(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenManager={() => setViewMode('manager')}
            />
          </div>
        )}

        {/* Discord Mobile Right Drawer (Members List) with Backdrop */}
        {isMembersOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsMembersOpen(false)}
          />
        )}

        <div
          className={`fixed inset-y-0 right-0 z-40 flex shadow-2xl transition-transform duration-300 ease-in-out ${
            isMembersOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <MembersDrawer
            onClose={() => setIsMembersOpen(false)}
            onSelectUser={(u) => setSelectedUserForProfile(u)}
          />
        </div>
      </div>

      {/* 3. Discord Mobile Authentic Bottom Navigation Bar */}
      <DiscordMobileBottomNav
        activeTab={mobileTab}
        onTabChange={(tab) => {
          setMobileTab(tab);
          setIsMembersOpen(false);
        }}
      />

      {/* 4. Android Home Indicator Pill */}
      <div className="h-4 bg-[#000000] flex items-center justify-center shrink-0">
        <div className="w-28 h-1 bg-[#ffffff]/35 rounded-full" />
      </div>

      {/* Modals & Dialogs */}
      {showMonitorModal && (
        <PerformanceMonitorModal onClose={() => setShowMonitorModal(false)} />
      )}

      {showDiagnosticOverlay && (
        <DiagnosticOverlayModal onClose={() => setShowDiagnosticOverlay(false)} />
      )}

      {showBeefBotModal && (
        <BeefBotConfigModal onClose={() => setShowBeefBotModal(false)} />
      )}

      {showMarketplaceModal && (
        <PluginMarketplaceModal onClose={() => setShowMarketplaceModal(false)} />
      )}

      {showPrivacyModal && (
        <PrivacyDashboardModal onClose={() => setShowPrivacyModal(false)} />
      )}

      {showCssModal && (
        <CssThemeModal onClose={() => setShowCssModal(false)} />
      )}

      {showIconPacksModal && (
        <IconPacksModal onClose={() => setShowIconPacksModal(false)} />
      )}

      {showKeybindsModal && (
        <KeybindsModal onClose={() => setShowKeybindsModal(false)} />
      )}

      {showTokenModal && (
        <TokenSwitcherModal onClose={() => setShowTokenModal(false)} />
      )}

      {showExportModal && (
        <ExportChatModal onClose={() => setShowExportModal(false)} />
      )}

      {showEmotePicker && (
        <EmotePickerModal
          onSelectEmote={(emote) => {
            sendMessage(emote);
            setShowEmotePicker(false);
          }}
          onClose={() => setShowEmotePicker(false)}
        />
      )}

      {showSoundboardModal && (
        <SoundboardModal onClose={() => setShowSoundboardModal(false)} />
      )}

      {showPinnedModal && (
        <PinnedMessagesModal onClose={() => setShowPinnedModal(false)} />
      )}

      {showQuickSwitcherModal && (
        <QuickSwitcherModal
          onClose={() => setShowQuickSwitcherModal(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPlugins={() => setShowMarketplaceModal(true)}
          onOpenBeefBot={() => setShowBeefBotModal(true)}
          onOpenSoundboard={() => setShowSoundboardModal(true)}
        />
      )}

      {selectedUserForProfile && (
        <UserProfileModal
          user={selectedUserForProfile}
          onClose={() => setSelectedUserForProfile(null)}
        />
      )}

      {selectedMessageForHistory && (
        <EditHistoryModal
          message={selectedMessageForHistory}
          onClose={() => setSelectedMessageForHistory(null)}
        />
      )}

      {showFontsModal && (
        <FontsModal onClose={() => setShowFontsModal(false)} />
      )}

      {showIconDesignerModal && (
        <AppIconDesignerModal
          onSave={() => {}}
          onClose={() => setShowIconDesignerModal(false)}
        />
      )}

      {showCrashReporterModal && (
        <CrashReporterModal
          onClose={() => setShowCrashReporterModal(false)}
          onEnterSafeMode={() => {
            setShowCrashReporterModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );

  // Desktop Responsive Viewport: Framing vs Full Width
  return (
    <div className="min-h-screen w-screen bg-[#0e0f12] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Subtle Desktop Preview Header Controls */}
      <div className="w-full max-w-6xl py-2 px-4 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${
            gatewayStatus.connected
              ? 'bg-[#23a55a] animate-pulse'
              : gatewayStatus.connecting
              ? 'bg-[#f0b232] animate-ping'
              : 'bg-[#5865f2]'
          }`} />
          <span className="text-xs font-bold text-white tracking-wide">
            {activeMode === 'DISCORD_OFFICIAL_WEB' ? 'Discord Web (Assault Merged)' : 'Discord Mobile Client'}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1e1f22] text-[#949ba4] font-mono border border-[#2b2d31]">
            {gatewayStatus.connected
              ? `Gateway Live (${gatewayStatus.ping}ms)`
              : gatewayStatus.connecting
              ? 'Connecting Gateway...'
              : 'v347.12 Beta'}
          </span>

          {/* Mode Switcher: Native Mobile vs Official Web */}
          <div className="flex items-center bg-[#1e1f22] rounded-full p-0.5 border border-[#2b2d31] ml-2">
            <button
              onClick={() => setActiveMode('NATIVE_APP')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeMode === 'NATIVE_APP'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white'
              }`}
            >
              Native Shell
            </button>
            <button
              onClick={() => setActiveMode('DISCORD_OFFICIAL_WEB')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeMode === 'DISCORD_OFFICIAL_WEB'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Official Web App</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('manager')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-full text-xs font-semibold shadow-sm transition cursor-pointer"
            title="Open APK Patcher & Extension Studio"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Patcher Studio</span>
          </button>

          <button
            onClick={() => setShowFontsModal(true)}
            className="p-1.5 bg-[#1e1f22] hover:bg-[#2b2d31] text-[#949ba4] hover:text-white rounded-full transition cursor-pointer border border-[#2b2d31]"
            title="Custom Fonts"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowIconDesignerModal(true)}
            className="p-1.5 bg-[#1e1f22] hover:bg-[#2b2d31] text-[#949ba4] hover:text-white rounded-full transition cursor-pointer border border-[#2b2d31]"
            title="App Icon Designer"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowCrashReporterModal(true)}
            className="p-1.5 bg-[#1e1f22] hover:bg-[#2b2d31] text-[#949ba4] hover:text-white rounded-full transition cursor-pointer border border-[#2b2d31]"
            title="Diagnostic Crash Reporter"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>

          {/* Switcher: Phone Device Frame vs Full Width */}
          <div className="flex items-center bg-[#1e1f22] rounded-full p-1 border border-[#2b2d31]">
            <button
              onClick={() => setDeviceFrameMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                deviceFrameMode === 'mobile'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Frame</span>
            </button>

            <button
              onClick={() => setDeviceFrameMode('full')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                deviceFrameMode === 'full'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Width</span>
            </button>
          </div>

          <button
            onClick={() => setShowQuickSwitcherModal(true)}
            className="p-1.5 bg-[#1e1f22] hover:bg-[#2b2d31] text-[#949ba4] hover:text-white rounded-full transition cursor-pointer border border-[#2b2d31]"
            title="Quick Switcher (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 bg-[#1e1f22] hover:bg-[#2b2d31] text-[#949ba4] hover:text-white rounded-full transition cursor-pointer border border-[#2b2d31]"
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container Container */}
      <div className="flex-1 w-full flex items-center justify-center pb-2 px-2 overflow-hidden">
        {activeMode === 'DISCORD_OFFICIAL_WEB' ? (
          <div className="w-full h-full max-h-[96vh] flex flex-col bg-[#313338] rounded-2xl overflow-hidden border border-[#232428] shadow-2xl relative">
            <iframe
              src={`/discord-embed?token=${encodeURIComponent(activeAccountToken)}`}
              className="w-full h-full border-0 bg-[#313338]"
              title="Official Discord Web Application"
              allow="camera; microphone; display-capture; clipboard-read; clipboard-write"
            />
          </div>
        ) : deviceFrameMode === 'mobile' ? (
          <div className="relative w-full max-w-[412px] h-[870px] max-h-[94vh] bg-[#000000] rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_0_8px_#1e1f22,0_0_0_10px_#2b2d31] flex flex-col overflow-hidden border border-[#2b2d31]">
            {/* Dynamic Camera Punch-hole Pill */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#000000] rounded-full z-40 pointer-events-none flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111214] ring-1 ring-[#232428]" />
            </div>

            {discordAppView}
          </div>
        ) : (
          <div className="w-full h-full max-h-[96vh] flex flex-col bg-[#000000] rounded-2xl overflow-hidden border border-[#232428] shadow-2xl">
            {discordAppView}
          </div>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AssaultProvider>
      <AssaultAppContent />
    </AssaultProvider>
  );
};

export default App;
