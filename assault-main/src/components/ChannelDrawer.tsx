import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Mic,
  MicOff,
  Headphones,
  Settings,
  PhoneOff,
  Plus,
  Volume2,
  Bell,
  Shield,
  X,
  Search,
  Users,
  Lock,
  Tv
} from 'lucide-react';
import { useAssault } from '../context/AssaultContext';
import { IconPackEngine } from '../services/iconPackEngine';
import { DiscordChannel } from '../types';
import { haptics } from '../services/hapticsService';

interface ChannelDrawerProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onCloseDrawer?: () => void;
  onChannelSelected?: () => void;
}

export const ChannelDrawer: React.FC<ChannelDrawerProps> = ({
  onOpenSettings,
  onOpenProfile,
  onCloseDrawer,
  onChannelSelected
}) => {
  const {
    activeGuild,
    channels,
    addChannel,
    activeGuildId,
    activeChannelId,
    selectChannel,
    currentUser,
    settings,
    connectedVoiceChannelId,
    toggleVoiceChannel,
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    iconPack
  } = useAssault();

  const pack = IconPackEngine.getPack(iconPack);

  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'GUILD_TEXT' | 'GUILD_VOICE'>('GUILD_TEXT');
  const [channelSearch, setChannelSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const currentChannels = channels.filter(
    (c) =>
      c.guildId === activeGuildId &&
      (!c.isHiddenOrLocked || settings.showHiddenChannels) &&
      (channelSearch ? c.name.toLowerCase().includes(channelSearch.toLowerCase()) : true)
  );

  const connectedVoiceChannel = channels.find((c) => c.id === connectedVoiceChannelId);

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Group channels by category
  const categorized: { [category: string]: DiscordChannel[] } = {};
  const uncategorized: DiscordChannel[] = [];

  currentChannels.forEach((ch) => {
    if (ch.category) {
      if (!categorized[ch.category]) {
        categorized[ch.category] = [];
      }
      categorized[ch.category].push(ch);
    } else {
      uncategorized.push(ch);
    }
  });

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !activeGuildId) return;
    addChannel(activeGuildId, newChannelName.trim(), newChannelType);
    setNewChannelName('');
    setShowCreateChannelModal(false);
  };

  return (
    <aside className="flex-1 w-full bg-[#08080a] flex flex-col justify-between shrink-0 select-none z-10 border-r border-[#16171a] relative min-w-0">
      {/* 1. Server Header & Search Bar matching modern Discord mobile */}
      <div className="pt-3 px-3 pb-2 border-b border-[#141518]">
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={() => activeGuild && setShowServerMenu(!showServerMenu)}
            className="flex items-center gap-1.5 font-bold text-base text-[#f2f3f5] hover:text-white transition cursor-pointer text-left truncate"
          >
            <span className="truncate">{activeGuild ? `@ ${activeGuild.name}` : 'Direct Messages'}</span>
            <ChevronRight className="w-4 h-4 text-[#80848e] shrink-0" />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowServerMenu(!showServerMenu)}
              className="p-1.5 text-[#949ba4] hover:text-white rounded-lg hover:bg-[#1e1f22] transition cursor-pointer"
              title="Add member or invite"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-[#949ba4] hover:text-white rounded-lg hover:bg-[#1e1f22] transition cursor-pointer"
              title="Server Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pill Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#80848e] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={channelSearch}
            onChange={(e) => setChannelSearch(e.target.value)}
            className="w-full bg-[#18191c] text-[#f2f3f5] placeholder-[#80848e] text-xs rounded-full pl-8 pr-3 py-1.5 focus:outline-none focus:bg-[#202225] transition"
          />
        </div>

        {/* Purple Accent Horizon Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-purple-500/80 via-fuchsia-500/40 to-transparent mt-2.5 rounded-full" />

        {/* Server Dropdown Modal */}
        {showServerMenu && activeGuild && (
          <div className="absolute top-16 left-3 right-3 bg-[#111214] border border-[#232428] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
            <button
              onClick={() => {
                setShowServerMenu(false);
                setShowCreateChannelModal(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#5865f2] hover:bg-[#5865f2] hover:text-white transition cursor-pointer"
            >
              <span>Create Channel</span>
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setShowServerMenu(false);
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#dbdee1] hover:bg-[#35373c] transition cursor-pointer"
            >
              <span>Server Settings</span>
              <Settings className="w-4 h-4 text-[#949ba4]" />
            </button>

            <button
              onClick={() => setShowServerMenu(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#dbdee1] hover:bg-[#35373c] transition cursor-pointer"
            >
              <span>Notification Settings</span>
              <Bell className="w-4 h-4 text-[#949ba4]" />
            </button>

            <button
              onClick={() => setShowServerMenu(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#dbdee1] hover:bg-[#35373c] transition cursor-pointer"
            >
              <span>Privacy & Forensics</span>
              <Shield className="w-4 h-4 text-[#949ba4]" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Categorized Channels matching screenshot 8 */}
      <div className="px-2 py-2 space-y-3 overflow-y-auto flex-1 no-scrollbar">
        {/* Uncategorized channels (e.g. x_x) */}
        {uncategorized.length > 0 && (
          <div className="space-y-0.5">
            {uncategorized.map((channel) => {
              const isActive = activeChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    haptics.channelSwitch();
                    selectChannel(channel.id);
                    onCloseDrawer?.();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition cursor-pointer group active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#2b2d31] text-white font-medium'
                      : 'text-[#949ba4] hover:bg-[#1a1b1e] hover:text-[#dbdee1]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {channel.isHiddenOrLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[#949ba4] shrink-0" />
                    ) : (
                      <span className="text-sm font-semibold shrink-0 text-[#80848e]">#</span>
                    )}
                    <span className="truncate">{channel.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Categorized groups */}
        {Object.entries(categorized).map(([catName, chList]) => {
          const isCollapsed = collapsedCategories[catName];
          return (
            <div key={catName} className="space-y-0.5">
              {/* Category Header */}
              <button
                onClick={() => {
                  haptics.buttonPress();
                  toggleCategory(catName);
                }}
                className="w-full flex items-center gap-1.5 text-xs font-medium text-[#949ba4] hover:text-[#dbdee1] px-2 py-1 transition cursor-pointer text-left active:opacity-75"
              >
                <span className="truncate">{catName}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90 text-[#80848e]' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Channel list inside category */}
              {!isCollapsed &&
                chList.map((channel) => {
                  const isActive = activeChannelId === channel.id;
                  const isVoice = channel.type === 'GUILD_VOICE';
                  const isConnectedVoice = connectedVoiceChannelId === channel.id;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        haptics.channelSwitch();
                        if (isVoice) {
                          toggleVoiceChannel(channel.id);
                        } else {
                          selectChannel(channel.id);
                          onCloseDrawer?.();
                          onChannelSelected?.();
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition cursor-pointer group active:scale-[0.98] ${
                        isActive
                          ? 'bg-[#2b2d31] text-white font-medium'
                          : isConnectedVoice
                          ? 'bg-[#23a55a]/15 text-[#23a55a] font-medium'
                          : 'text-[#949ba4] hover:bg-[#1a1b1e] hover:text-[#dbdee1]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isVoice ? (
                          <Volume2 className="w-3.5 h-3.5 text-[#949ba4] shrink-0" />
                        ) : channel.isHiddenOrLocked ? (
                          <Lock className="w-3.5 h-3.5 text-[#949ba4] shrink-0" />
                        ) : (
                          <span className="text-sm font-semibold shrink-0 text-[#80848e]">#</span>
                        )}
                        <span className="truncate">{channel.name}</span>
                      </div>

                      {channel.unreadCount && channel.unreadCount > 0 ? (
                        <span className="bg-[#ed4245] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {channel.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* 3. Connected Voice Bar (if connected) */}
      {connectedVoiceChannel && (
        <div className="bg-[#111214] border-t border-[#1e1f22] p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
            <div className="truncate">
              <p className="text-[11px] font-bold text-[#23a55a] uppercase tracking-wider">
                Voice Connected
              </p>
              <p className="text-xs text-[#949ba4] truncate">{connectedVoiceChannel.name}</p>
            </div>
          </div>
          <button
            onClick={() => toggleVoiceChannel(connectedVoiceChannel.id)}
            className="p-1.5 text-[#f23f43] hover:bg-[#f23f43]/10 rounded-lg transition cursor-pointer"
            title="Disconnect Voice"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Sleek User Bottom Banner Card matching screenshots 6 & 8 */}
      <div className="p-2 border-t border-[#141518]">
        <div
          onClick={onOpenProfile}
          className="w-full relative overflow-hidden rounded-2xl bg-[#1e1f22] hover:bg-[#232428] transition cursor-pointer flex items-center justify-between p-2 shadow-lg group border border-[#2b2d31]/50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 60%), linear-gradient(90deg, #18191c 0%, #1c1d22 100%)'
          }}
        >
          {/* Subtle hands illustration overlay mimic from screenshot */}
          <div className="absolute right-8 top-0 bottom-0 w-24 opacity-20 pointer-events-none flex items-center justify-end text-2xl select-none">
            🖐️✋
          </div>

          {/* Left: Avatar with cutout moon status */}
          <div className="flex items-center gap-2.5 z-10 truncate">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-9 h-9 rounded-full object-cover border border-[#2b2d31]"
              />
              {/* Crescent Moon Idle Badge cutout matching screenshot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#18191c] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#f0b232] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#18191c] -translate-x-0.5 -translate-y-0.5" />
                </div>
              </div>
            </div>

            {/* Middle: Name, Maple Leaf Badge, Chevron, Screen Icon */}
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm font-bold text-white truncate">
                {currentUser.globalName || currentUser.username}
              </span>

              {/* Maple Leaf custom badge */}
              <span className="px-1 py-0.5 rounded bg-[#e03e3e]/20 text-[#e03e3e] text-[10px] font-bold shrink-0">
                🍁!
              </span>

              <ChevronDown className="w-3.5 h-3.5 text-[#949ba4] shrink-0" />

              {/* Desktop / Streaming Green Icon */}
              <Tv className="w-3.5 h-3.5 text-[#23a55a] shrink-0 ml-0.5" />
            </div>
          </div>

          {/* Right: Bell Notification Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1.5 rounded-full text-[#949ba4] hover:text-white hover:bg-black/20 transition cursor-pointer z-10 shrink-0"
            title="Settings & Alerts"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real Discord "Create Channel" Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Create Channel</h3>
              <button
                onClick={() => setShowCreateChannelModal(false)}
                className="text-[#949ba4] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">
                  CHANNEL TYPE
                </label>
                <div className="space-y-2">
                  <label
                    onClick={() => setNewChannelType('GUILD_TEXT')}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      newChannelType === 'GUILD_TEXT'
                        ? 'bg-[#35373c] border-[#5865f2] text-white'
                        : 'bg-[#2b2d31] border-[#232428] text-[#949ba4]'
                    }`}
                  >
                    <span className="text-lg font-bold text-[#5865f2]">{pack.hashIcon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Text</div>
                      <div className="text-xs text-[#949ba4]">Post messages, images, and memes</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setNewChannelType('GUILD_VOICE')}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      newChannelType === 'GUILD_VOICE'
                        ? 'bg-[#35373c] border-[#5865f2] text-white'
                        : 'bg-[#2b2d31] border-[#232428] text-[#949ba4]'
                    }`}
                  >
                    <span className="text-lg font-bold text-[#23a55a]">{pack.voiceIcon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Voice</div>
                      <div className="text-xs text-[#949ba4]">Hang out with voice, video, and screen share</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider block mb-1">
                  CHANNEL NAME
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[#80848e] font-bold">
                    {newChannelType === 'GUILD_TEXT' ? pack.hashIcon : pack.voiceIcon}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="new-channel"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full bg-[#111214] border border-[#232428] rounded-lg px-3 py-2 pl-8 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="px-4 py-2 text-xs text-white hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
