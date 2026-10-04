import React, { useState } from 'react';
import { Plus, Compass, X, Check, Users, Sparkles, Hash, Shield } from 'lucide-react';
import { useAssault } from '../context/AssaultContext';
import { haptics } from '../services/hapticsService';

interface ServerRailProps {
  onOpenSettings: () => void;
  onOpenTokens: () => void;
  onOpenProfile?: () => void;
}

interface PublicCommunityServer {
  id: string;
  name: string;
  description: string;
  category: string;
  members: string;
  iconUrl: string;
  bannerUrl: string;
}

const PUBLIC_SERVERS: PublicCommunityServer[] = [
  {
    id: 'pub_react',
    name: 'React & Frontend Hub',
    description: 'The global community for modern React, Vite, Next.js, and TypeScript developers.',
    category: 'Development',
    members: '142,800',
    iconUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=120&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'pub_cyber',
    name: 'Cyberpunk & Modding HQ',
    description: 'Custom client modifications, reverse engineering, CSS themes, and neon aesthetics.',
    category: 'Gaming & Tech',
    members: '89,450',
    iconUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'pub_lofi',
    name: 'Chill Vibes & Lo-Fi Lounge',
    description: '24/7 relaxed study beats, cozy voice chats, and aesthetic community hangout.',
    category: 'Music & Art',
    members: '215,900',
    iconUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'pub_ai',
    name: 'AI Engineering & Models',
    description: 'Gemini, LLMs, neural networks, automations, and self-hosted model pipelines.',
    category: 'Science & Tech',
    members: '168,200',
    iconUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=120&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80'
  }
];

export const ServerRail: React.FC<ServerRailProps> = ({ onOpenSettings, onOpenTokens, onOpenProfile }) => {
  const { guilds, activeGuildId, selectGuild, addGuild, currentUser, setViewMode } = useAssault();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerDesc, setNewServerDesc] = useState('');
  const [newServerIcon, setNewServerIcon] = useState('');

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    addGuild(
      newServerName.trim(),
      newServerDesc.trim() || undefined,
      newServerIcon.trim() || undefined
    );
    setNewServerName('');
    setNewServerDesc('');
    setNewServerIcon('');
    setShowCreateModal(false);
  };

  const handleJoinPublic = (pub: PublicCommunityServer) => {
    addGuild(pub.name, pub.description, pub.iconUrl);
    setShowExploreModal(false);
  };

  return (
    <nav className="w-[72px] bg-[#000000] border-r border-[#141517] flex flex-col items-center py-3 gap-2 shrink-0 select-none z-20">
      {/* Authentic Discord Clyde / Direct Messages Home Button */}
      <div className="relative group flex items-center justify-center w-full">
        {activeGuildId === null ? (
          <div className="absolute left-0 w-1 h-10 bg-white rounded-r-full" />
        ) : (
          <div className="absolute left-0 w-1 h-0 group-hover:h-5 bg-white rounded-r-full transition-all duration-200" />
        )}
        <button
          onClick={() => {
            haptics.serverSwitch();
            selectGuild(null);
          }}
          className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
            activeGuildId === null
              ? 'bg-[#5865f2] rounded-[16px] text-white shadow-lg'
              : 'bg-[#1e1f22] text-[#dbdee1] group-hover:bg-[#5865f2] group-hover:text-white'
          }`}
          title="Direct Messages"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </button>
      </div>

      <div className="w-8 h-[2px] bg-[#232428] rounded-full my-0.5" />

      {/* Guilds List */}
      <div className="flex flex-col gap-2 w-full items-center overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
        {guilds.map((guild) => {
          const isActive = activeGuildId === guild.id;
          return (
            <div key={guild.id} className="relative group flex items-center justify-center w-full">
              {/* Active indicator pill on left edge */}
              <div
                className={`absolute left-0 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'w-1 h-10' : 'w-1 h-0 group-hover:h-5'
                }`}
              />

              <button
                onClick={() => {
                  haptics.serverSwitch();
                  selectGuild(guild.id);
                }}
                className={`relative w-12 h-12 rounded-[24px] group-hover:rounded-[16px] overflow-hidden transition-all duration-200 cursor-pointer flex items-center justify-center bg-[#313338] active:scale-90 ${
                  isActive ? 'rounded-[16px] ring-2 ring-[#5865f2] bg-[#5865f2]' : ''
                }`}
                title={guild.name}
              >
                {guild.iconUrl ? (
                  <img
                    src={guild.iconUrl}
                    alt={guild.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-sm text-[#dbdee1]">
                    {guild.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 3)}
                  </span>
                )}

                {/* Unread badge */}
                {guild.unreadCount > 0 && (
                  <span className="absolute bottom-0 right-0 bg-[#ed4245] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1e1f22]">
                    {guild.unreadCount}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full mt-1">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#313338] text-[#23a55a] group-hover:bg-[#23a55a] group-hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
            title="Create a Server"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Explore Public Community Servers */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setShowExploreModal(true)}
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#1e1f22] text-[#dbdee1] group-hover:bg-[#5865f2] group-hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
            title="Discover Public Servers"
          >
            <Compass className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Patcher & User Avatar in Server Rail */}
      <div className="w-full flex flex-col items-center pt-2 pb-1 border-t border-[#141517] gap-2">
        <button
          onClick={() => setViewMode('manager')}
          className="relative group cursor-pointer"
          title="Open APK Patcher & Extension Studio"
        >
          <div className="w-10 h-10 rounded-[20px] group-hover:rounded-[12px] bg-[#23262e] hover:bg-[#5865f2] text-[#949ba4] hover:text-white flex items-center justify-center transition-all duration-200">
            <Shield className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={onOpenProfile}
          className="relative group cursor-pointer"
          title={`${currentUser.globalName || currentUser.username} (click to view profile)`}
        >
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.username}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#5865f2] transition"
          />
          {/* Status Indicator (Yellow crescent for Idle, green for online) */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#000000] border-2 border-[#000000] flex items-center justify-center">
            {currentUser.status === 'IDLE' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#f0b232] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#000000] -translate-x-0.5 -translate-y-0.5" />
              </span>
            ) : currentUser.status === 'DND' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#f23f43]" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#23a55a]" />
            )}
          </span>
        </button>
      </div>

      {/* Real Discord "Create a Server" Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#313338] border border-[#2b2d31] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#949ba4] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Create Your Server</h2>
              <p className="text-xs text-[#949ba4] mt-1 max-w-xs mx-auto">
                Your server is where you and your friends hang out. Make yours and start talking.
              </p>

              <form onSubmit={handleCreateServer} className="mt-5 space-y-4 text-left">
                <div>
                  <label className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider block mb-1">
                    SERVER NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Awesome Club"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#232428] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider block mb-1">
                    SERVER TOPIC / DESCRIPTION
                  </label>
                  <input
                    type="text"
                    placeholder="Hangout for coding, gaming, and banter"
                    value={newServerDesc}
                    onChange={(e) => setNewServerDesc(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#232428] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider block mb-1">
                    ICON URL (OPTIONAL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newServerIcon}
                    onChange={(e) => setNewServerIcon(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#232428] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                  />
                </div>

                <div className="pt-2 flex justify-between items-center bg-[#2b2d31] -mx-6 -mb-6 p-4 border-t border-[#232428] mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs text-[#dbdee1] hover:underline cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-md transition cursor-pointer"
                  >
                    Create Server
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Real Discord "Discover Public Servers" Modal */}
      {showExploreModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#313338] border border-[#2b2d31] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232428] bg-[#2b2d31] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5865f2]/20 text-[#5865f2]">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Discover Public Communities</h3>
                  <p className="text-xs text-[#949ba4]">Join verified gaming, coding, and creator servers</p>
                </div>
              </div>
              <button
                onClick={() => setShowExploreModal(false)}
                className="text-[#949ba4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PUBLIC_SERVERS.map((pub) => (
                  <div
                    key={pub.id}
                    className="bg-[#2b2d31] rounded-xl border border-[#232428] overflow-hidden hover:border-[#5865f2]/50 transition flex flex-col justify-between"
                  >
                    <div
                      className="h-20 w-full bg-cover bg-center relative"
                      style={{ backgroundImage: `url(${pub.bannerUrl})` }}
                    >
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute -bottom-4 left-4">
                        <img
                          src={pub.iconUrl}
                          alt={pub.name}
                          className="w-10 h-10 rounded-xl border-2 border-[#2b2d31] object-cover shadow-md"
                        />
                      </div>
                    </div>

                    <div className="p-4 pt-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">{pub.name}</h4>
                        </div>
                        <span className="text-[10px] text-[#5865f2] font-semibold">{pub.category}</span>
                        <p className="text-xs text-[#949ba4] mt-1 line-clamp-2 leading-relaxed">
                          {pub.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#35373c] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-[#949ba4]">
                          <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
                          <span>{pub.members} members</span>
                        </div>
                        <button
                          onClick={() => handleJoinPublic(pub)}
                          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-md transition cursor-pointer"
                        >
                          Join Server
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
