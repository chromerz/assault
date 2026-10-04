import React from 'react';
import {
  Shield,
  Activity,
  Layers,
  Palette,
  Keyboard,
  KeyRound,
  Package,
  Settings
} from 'lucide-react';
import { useAssault } from '../context/AssaultContext';

interface TopBarProps {
  onOpenMonitor: () => void;
  onOpenPlugins: () => void;
  onOpenCss: () => void;
  onOpenKeybinds: () => void;
  onOpenTokens: () => void;
  onOpenPrivacy: () => void;
  onOpenSettings: () => void;
  onOpenBeefBot: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMonitor,
  onOpenPlugins,
  onOpenCss,
  onOpenKeybinds,
  onOpenTokens,
  onOpenPrivacy,
  onOpenSettings,
  onOpenBeefBot
}) => {
  const { beefBotEngine, setViewMode, viewMode } = useAssault();
  const beefState = beefBotEngine.getState();

  return (
    <header className="h-12 bg-[#111218] border-b border-[#1f212a] flex items-center justify-between px-3 shrink-0 z-30 select-none">
      {/* Left Brand & Gateway Pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#5865f2]/20 border border-[#5865f2]/30 text-[#5865f2] font-bold text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>Assault</span>
        </div>

        <button
          onClick={onOpenMonitor}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e2029] hover:bg-[#282a36] text-[11px] font-medium text-[#23a55a] transition cursor-pointer"
          title="Click to view Gateway & WebSocket Telemetry"
        >
          <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse"></span>
          <span>Gateway Live</span>
        </button>
      </div>

      {/* Center BeefBot Pill */}
      <button
        onClick={onOpenBeefBot}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
          beefState.active
            ? 'bg-[#ed4245]/20 text-[#ed4245] border border-[#ed4245]/40 animate-pulse'
            : 'bg-[#1e2029] hover:bg-[#282a36] text-[#dbdee1] border border-transparent'
        }`}
        title="Open BeefBot AutoMod & Terminal"
      >
        <span>🥩</span>
        <span>BeefBot: {beefState.prefix}</span>
        {beefState.active && <span className="text-[10px] bg-[#ed4245] text-white px-1 rounded font-bold">ARMED</span>}
      </button>

      {/* Right Power-User Action Dock */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenMonitor}
          className="p-1.5 rounded hover:bg-[#282a36] text-[#5865f2] hover:text-white transition cursor-pointer"
          title="Gateway & Throughput Monitor"
        >
          <Activity className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenPlugins}
          className="p-1.5 rounded hover:bg-[#282a36] text-[#fee75c] hover:text-white transition cursor-pointer"
          title="Community Plugins & Script Hooks"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenCss}
          className="p-1.5 rounded hover:bg-[#282a36] text-[#eb459e] hover:text-white transition cursor-pointer"
          title="CSS Theme Studio & Variable Editor"
        >
          <Palette className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenKeybinds}
          className="p-1.5 rounded hover:bg-[#282a36] text-[#949ba4] hover:text-white transition cursor-pointer"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenTokens}
          className="p-1.5 rounded hover:bg-[#282a36] text-[#23a55a] hover:text-white transition cursor-pointer"
          title="Token & Account Switcher"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenPrivacy}
          className="p-1.5 rounded hover:bg-[#282a36] text-[#23a55a] hover:text-white transition cursor-pointer"
          title="Centralized Privacy & Security Dashboard"
        >
          <Shield className="w-4 h-4" />
        </button>

        <button
          onClick={() => setViewMode(viewMode === 'client' ? 'manager' : 'client')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition cursor-pointer ${
            viewMode === 'manager'
              ? 'bg-[#fee75c] text-black'
              : 'hover:bg-[#282a36] text-[#fee75c]'
          }`}
          title="Assault Manager (Standalone Client & APK Modder)"
        >
          <Package className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Manager</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded hover:bg-[#282a36] text-[#949ba4] hover:text-white transition cursor-pointer"
          title="Assault Settings & Tweaks"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
