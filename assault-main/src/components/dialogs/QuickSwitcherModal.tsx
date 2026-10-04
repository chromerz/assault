import React, { useState, useEffect } from 'react';
import { Search, Hash, Volume2, Users, Shield, Terminal, X, CornerDownLeft, Sparkles } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';

interface QuickSwitcherModalProps {
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenPlugins?: () => void;
  onOpenBeefBot?: () => void;
  onOpenSoundboard?: () => void;
}

export const QuickSwitcherModal: React.FC<QuickSwitcherModalProps> = ({
  onClose,
  onOpenSettings,
  onOpenPlugins,
  onOpenBeefBot,
  onOpenSoundboard
}) => {
  const { channels, guilds, selectGuild, selectChannel, activeChannelId } = useAssault();
  const [query, setQuery] = useState('');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGuilds = guilds.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase())
  );

  const quickActions = [
    { id: 'act_plugins', label: 'Plugin Marketplace & Sources', icon: <Sparkles className="w-4 h-4 text-[#fee75c]" />, action: () => { onClose(); onOpenPlugins?.(); } },
    { id: 'act_beefbot', label: 'BeefBot Security & Defense Terminal', icon: <Shield className="w-4 h-4 text-[#23a55a]" />, action: () => { onClose(); onOpenBeefBot?.(); } },
    { id: 'act_soundboard', label: 'Discord Soundboard FX', icon: <Volume2 className="w-4 h-4 text-[#5865f2]" />, action: () => { onClose(); onOpenSoundboard?.(); } },
    { id: 'act_settings', label: 'Client Settings & Custom CSS', icon: <Terminal className="w-4 h-4 text-[#dbdee1]" />, action: () => { onClose(); onOpenSettings?.(); } }
  ].filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-24 p-4 z-50 animate-in fade-in duration-100">
      <div className="bg-[#1e1f22] border border-[#313338] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search input bar */}
        <div className="p-4 border-b border-[#2b2d31] bg-[#111214] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#949ba4] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where would you like to go? (channels, servers, actions...)"
            className="flex-1 bg-transparent text-sm text-[#f2f3f5] placeholder-[#80848e] focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#949ba4] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results section */}
        <div className="p-3 overflow-y-auto space-y-4">
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Quick Actions
              </span>
              <div className="mt-1 space-y-0.5">
                {quickActions.map((act) => (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#35373c] text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-[#2b2d31] group-hover:bg-[#1e1f22] transition">
                        {act.icon}
                      </div>
                      <span className="text-xs font-semibold text-[#f2f3f5]">
                        {act.label}
                      </span>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-[#949ba4] opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Channels */}
          {filteredChannels.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Channels ({filteredChannels.length})
              </span>
              <div className="mt-1 space-y-0.5">
                {filteredChannels.slice(0, 8).map((ch) => {
                  const guild = guilds.find((g) => g.id === ch.guildId);
                  const isActive = ch.id === activeChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        if (ch.guildId) selectGuild(ch.guildId);
                        selectChannel(ch.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition cursor-pointer group ${
                        isActive ? 'bg-[#5865f2]/20 border border-[#5865f2]/30' : 'hover:bg-[#35373c]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="text-[#949ba4]">
                          {ch.type === 'GUILD_VOICE' ? (
                            <Volume2 className="w-4 h-4 text-[#23a55a]" />
                          ) : (
                            <Hash className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-white truncate">
                          {ch.name}
                        </span>
                        {guild && (
                          <span className="text-[11px] text-[#949ba4] truncate">
                            in {guild.name}
                          </span>
                        )}
                      </div>
                      <CornerDownLeft className="w-3.5 h-3.5 text-[#949ba4] opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Servers */}
          {filteredGuilds.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Servers ({filteredGuilds.length})
              </span>
              <div className="mt-1 space-y-0.5">
                {filteredGuilds.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      selectGuild(g.id);
                      const firstCh = channels.find((c) => c.guildId === g.id);
                      if (firstCh) selectChannel(firstCh.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#35373c] text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={g.iconUrl}
                        alt={g.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <span className="text-xs font-semibold text-white truncate">
                        {g.name}
                      </span>
                      <span className="text-[10px] text-[#949ba4]">
                        {g.memberCount.toLocaleString()} members
                      </span>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-[#949ba4] opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2.5 bg-[#111214] border-t border-[#2b2d31] flex items-center justify-between text-[11px] text-[#949ba4]">
          <span>Tip: Press <strong>Ctrl + K</strong> anytime to trigger Quick Switcher</span>
          <span>ESC to cancel</span>
        </div>
      </div>
    </div>
  );
};
