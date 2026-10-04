import React, { useState } from 'react';
import {
  X,
  MoreHorizontal,
  MessageSquare,
  Phone,
  Video,
  UserCheck,
  FileText,
  Play,
  Tv,
  Gamepad2,
  Headphones,
  Music,
  ExternalLink,
  Sparkles,
  Shield,
  Check
} from 'lucide-react';
import { DiscordUser, UserStatus } from '../../types';
import { useAssault } from '../../context/AssaultContext';

interface UserProfileModalProps {
  user: DiscordUser;
  onClose: () => void;
  onOpenDirectMessage?: (user: DiscordUser) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onOpenDirectMessage }) => {
  const { currentUser, updateCurrentUserStatus, updateCurrentUserProfile, playAudio } = useAssault();
  const isSelf = user.id === currentUser.id;

  const [activeTab, setActiveTab] = useState<'main' | 'board' | 'wishlist'>('main');
  const [noteText, setNoteText] = useState('');
  const [isPlayingSpotify, setIsPlayingSpotify] = useState(false);

  // Status indicators matching recent Discord mobile
  const renderStatusIndicator = (status: UserStatus) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#23a55a] border-4 border-[#090a0c]" />
        );
      case 'IDLE':
        return (
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#090a0c] border-2 border-[#090a0c] flex items-center justify-center">
            <span className="w-5 h-5 rounded-full bg-[#f0b232] flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-[#090a0c] -translate-x-1 -translate-y-1" />
            </span>
          </span>
        );
      case 'DND':
        return (
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#f23f43] border-4 border-[#090a0c] flex items-center justify-center">
            <span className="w-3 h-0.5 bg-[#090a0c] rounded-full" />
          </span>
        );
      default:
        // OFFLINE: authentic grey ring with hollow center
        return (
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#090a0c] border-4 border-[#090a0c] flex items-center justify-center">
            <span className="w-4 h-4 rounded-full border-3 border-[#80848e] bg-[#090a0c]" />
          </span>
        );
    }
  };

  const handleSpotifyPlay = () => {
    setIsPlayingSpotify(!isPlayingSpotify);
    playAudio('victory');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-end justify-center z-50 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="bg-[#090a0c] rounded-t-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 border-t border-[#202225] animate-in slide-in-from-bottom duration-200">
        {/* Top white drag handle bar */}
        <div className="w-10 h-1 bg-white/40 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Scrollable Container */}
        <div className="overflow-y-auto pb-6">
          {/* Top Banner with 3 dots menu */}
          <div
            className="h-28 w-full relative bg-gradient-to-r from-[#202225] to-[#2b2d31]"
            style={{
              backgroundImage: user.bannerUrl ? `url(${user.bannerUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs text-white/90 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs text-white/90 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Header Details (Overlapping Banner) */}
          <div className="px-5 -mt-12 space-y-3.5">
            {/* Avatar with Status Ring */}
            <div className="relative inline-block">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop'}
                alt={user.username}
                className="w-22 h-22 rounded-full border-4 border-[#090a0c] object-cover shadow-xl bg-[#111214]"
              />
              {renderStatusIndicator(user.status)}
            </div>

            {/* Display Name & Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {user.globalName || user.username}
                </h2>
                {user.isBot && (
                  <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    APP
                  </span>
                )}
                {/* Badges icons */}
                <div className="flex items-center gap-1 ml-1">
                  <span className="w-4 h-4 rounded bg-[#e67e22] text-[10px] flex items-center justify-center text-white" title="HypeSquad Bravery">
                    ⚡
                  </span>
                  <span className="w-4 h-4 rounded bg-[#f47fff] text-[10px] flex items-center justify-center text-white" title="Nitro Subscriber">
                    ▲
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#949ba4]">
                <span>{user.username}</span>
                {user.customStatus && (
                  <>
                    <span>•</span>
                    <span className="text-[#dbdee1]">{user.customStatus}</span>
                  </>
                )}
              </div>

              {/* Mutual Friends / Servers */}
              <div className="flex items-center gap-2 text-xs text-[#949ba4] pt-1">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <img className="inline-block h-4 w-4 rounded-full ring-1 ring-[#090a0c]" src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=40&auto=format&fit=crop" alt="" />
                  <img className="inline-block h-4 w-4 rounded-full ring-1 ring-[#090a0c]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&auto=format&fit=crop" alt="" />
                  <img className="inline-block h-4 w-4 rounded-full ring-1 ring-[#090a0c]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&auto=format&fit=crop" alt="" />
                </div>
                <span>4 Mutual Friends • 1 Mutual Server</span>
              </div>
            </div>

            {/* Action Buttons: [Message] [Call] */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenDirectMessage?.(user);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </button>

              <button
                onClick={() => {
                  playAudio('discord_join');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </button>
            </div>

            {/* Profile Tabs: Main, Board, Wishlist */}
            <div className="flex items-center border-b border-[#202225] pt-2">
              <button
                onClick={() => setActiveTab('main')}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center relative cursor-pointer ${
                  activeTab === 'main' ? 'text-white' : 'text-[#80848e] hover:text-[#dbdee1]'
                }`}
              >
                <span>Main</span>
                {activeTab === 'main' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('board')}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center relative cursor-pointer ${
                  activeTab === 'board' ? 'text-white' : 'text-[#80848e] hover:text-[#dbdee1]'
                }`}
              >
                <span>Board</span>
                {activeTab === 'board' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center relative cursor-pointer ${
                  activeTab === 'wishlist' ? 'text-white' : 'text-[#80848e] hover:text-[#dbdee1]'
                }`}
              >
                <span>Wishlist</span>
                {activeTab === 'wishlist' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </button>
            </div>

            {/* TAB CONTENT: MAIN */}
            {activeTab === 'main' && (
              <div className="space-y-3 pt-2">
                {/* 1. Rich Presence Activity: Streaming */}
                <div className="bg-[#111214] border border-[#202225] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#949ba4]">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-[#593695]" />
                      Streaming
                    </span>
                    <span className="text-[10px] bg-[#593695]/20 text-[#a970ff] px-2 py-0.5 rounded-full font-bold">
                      LIVE
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Assault Client Development & Reversing</h4>
                    <p className="text-[11px] text-[#80848e]">Playing Counter-Strike 2 • 342 Viewers</p>
                  </div>
                  <button
                    onClick={() => playAudio('victory')}
                    className="w-full py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Watch
                  </button>
                </div>

                {/* 2. Rich Presence Activity: PlayStation */}
                <div className="bg-[#111214] border border-[#202225] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#949ba4]">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-[#003791]" />
                      Playing on PlayStation 🎮
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">lol</h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#23a55a] font-mono">
                    <span>🎮</span>
                    <span>2:25:18</span>
                  </div>
                </div>

                {/* 3. Rich Presence Activity: Spotify (Screenshot 6) */}
                <div className="bg-[#111214] border border-[#202225] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#949ba4]">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-[#1db954]" />
                      Listening to Spotify 🟢
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&auto=format&fit=crop"
                      alt="Album art"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">you</h4>
                      <p className="text-[11px] text-[#80848e] truncate">rep • assault records</p>
                    </div>
                  </div>

                  {/* Audio Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-[#202225] h-1 rounded-full overflow-hidden">
                      <div className="bg-[#1db954] h-full w-[45%] rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#80848e] font-mono">
                      <span>02:25:18</span>
                      <span>479952:00:00</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSpotifyPlay}
                    className="w-full py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span className="text-[#1db954]">🟢</span>
                    <span>{isPlayingSpotify ? 'Playing on Spotify' : 'Play on Spotify'}</span>
                  </button>
                </div>

                {/* 4. Bio Section */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-[#80848e] uppercase tracking-wider block">
                    Bio
                  </span>
                  <p className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-wrap">
                    {user.bio || 'i love daddy assault im his little girl he makes me so wet'}
                  </p>
                </div>

                {/* 5. Member Since / Friends Since */}
                <div className="space-y-2 pt-2 border-t border-[#202225]">
                  <div>
                    <span className="text-[11px] font-bold text-[#80848e] uppercase tracking-wider block">
                      Member Since
                    </span>
                    <p className="text-xs text-[#dbdee1] mt-0.5 flex items-center gap-1.5">
                      <span>👾</span>
                      <span>Aug 27, 2024</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#80848e] uppercase tracking-wider block">
                      Friends Since
                    </span>
                    <p className="text-xs text-[#dbdee1] mt-0.5">
                      Sep 30, 2026
                    </p>
                  </div>
                </div>

                {/* 6. Note Field (only visible to you) */}
                <div className="pt-2">
                  <div className="bg-[#111214] border border-[#202225] rounded-xl p-3 flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Note (only visible to you)"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="bg-transparent text-xs text-[#f2f3f5] placeholder-[#80848e] focus:outline-none flex-1"
                    />
                    <FileText className="w-4 h-4 text-[#80848e] shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: BOARD */}
            {activeTab === 'board' && (
              <div className="py-8 text-center text-[#80848e] space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-[#5865f2]" />
                <p className="text-xs text-white font-semibold">User Soundboard & Pins</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  Custom sounds and pins shared by {user.globalName || user.username}
                </p>
              </div>
            )}

            {/* TAB CONTENT: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="py-8 text-center text-[#80848e] space-y-2">
                <span className="text-2xl">🎁</span>
                <p className="text-xs text-white font-semibold">No items on wishlist</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  When this user adds Nitro gifts or avatar decorations to their wishlist, they will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
