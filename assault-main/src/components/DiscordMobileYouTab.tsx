import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Award,
  ShoppingBag,
  Settings,
  Pencil,
  FileText,
  X,
  Check,
  Diamond,
  Tv,
  Users
} from 'lucide-react';
import { useAssault } from '../context/AssaultContext';

interface DiscordMobileYouTabProps {
  onOpenPrivacy: () => void;
  onOpenBeefBot: () => void;
  onOpenMarketplace: () => void;
  onOpenCss: () => void;
  onOpenIconPacks: () => void;
  onOpenDiagnostics: () => void;
  onOpenTokens: () => void;
  onOpenSettings: () => void;
  onOpenManager: () => void;
}

export const DiscordMobileYouTab: React.FC<DiscordMobileYouTabProps> = ({
  onOpenPrivacy,
  onOpenBeefBot,
  onOpenMarketplace,
  onOpenCss,
  onOpenIconPacks,
  onOpenDiagnostics,
  onOpenTokens,
  onOpenSettings,
  onOpenManager
}) => {
  const { currentUser, updateCurrentUserStatus, updateCurrentUserProfile } = useAssault();

  const [activeSegment, setActiveSegment] = useState<'main' | 'wishlist'>('main');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Form states for profile editor
  const [editGlobalName, setEditGlobalName] = useState(currentUser.globalName || currentUser.username);
  const [editBio, setEditBio] = useState(currentUser.bio || 'a month ago');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatarUrl);
  const [customStatusInput, setCustomStatusInput] = useState(currentUser.customStatus || '+ Best dad joke?');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserProfile({
      globalName: editGlobalName,
      bio: editBio,
      avatarUrl: editAvatarUrl
    });
    setShowEditProfileModal(false);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserStatus(currentUser.status, customStatusInput);
    setShowStatusModal(false);
  };

  const sampleFriends = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop'
  ];

  return (
    <div className="flex-1 bg-[#000000] overflow-y-auto select-none pb-24 text-[#f2f3f5] relative">
      {/* 1. Profile Header with Avatar & Custom Status Pill matching Screenshot 5 */}
      <div className="p-4 pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with Cutout Idle Status */}
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#1e1f22]"
              />
              {/* Cutout crescent moon */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#000000] flex items-center justify-center">
                <div className="w-4.5 h-4.5 rounded-full bg-[#f0b232] flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#000000] -translate-x-0.5 -translate-y-0.5" />
                </div>
              </div>
            </div>

            {/* Status Bubble Pill: "+ Best dad joke?" */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#18191c] hover:bg-[#232428] text-xs font-medium text-white transition cursor-pointer border border-[#2b2d31]"
            >
              <span>{currentUser.customStatus || '+ Best dad joke?'}</span>
            </button>
          </div>

          {/* Top-Right Settings Gear matching Screenshot 5 */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-full bg-[#18191c] hover:bg-[#232428] text-[#949ba4] hover:text-white transition cursor-pointer border border-[#232428]"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Name, Handle & Badges */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-1.5">
              <span>{currentUser.globalName || currentUser.username}</span>
              <ChevronDown className="w-4 h-4 text-[#80848e]" />
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#949ba4] font-medium">
              {currentUser.username}
            </span>

            {/* Custom Maple leaf badge */}
            <span className="px-1.5 py-0.5 rounded bg-[#e03e3e]/20 text-[#e03e3e] text-[11px] font-bold">
              🍁!
            </span>

            {/* Nitro Booster badge */}
            <span className="w-5 h-5 rounded-full bg-[#f47fff]/20 text-[#f47fff] flex items-center justify-center text-[10px] font-bold">
              ▲
            </span>
          </div>
        </div>

        {/* Full-width "Edit Profile" Button */}
        <button
          onClick={() => setShowEditProfileModal(true)}
          className="w-full py-2.5 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-sm font-semibold text-white transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>

        {/* Segmented Tab Navigation: Main & Wishlist */}
        <div className="flex border-b border-[#1e1f22] pt-2">
          <button
            onClick={() => setActiveSegment('main')}
            className={`flex-1 pb-2.5 text-center text-sm font-bold transition cursor-pointer relative ${
              activeSegment === 'main' ? 'text-white' : 'text-[#80848e] hover:text-[#dbdee1]'
            }`}
          >
            Main
            {activeSegment === 'main' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveSegment('wishlist')}
            className={`flex-1 pb-2.5 text-center text-sm font-bold transition cursor-pointer relative ${
              activeSegment === 'wishlist' ? 'text-white' : 'text-[#80848e] hover:text-[#dbdee1]'
            }`}
          >
            Wishlist
            {activeSegment === 'wishlist' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Main Tab Cards Content */}
        {activeSegment === 'main' && (
          <div className="space-y-3 pt-2">
            {/* 1. Orbs Balance Card */}
            <div className="p-3.5 bg-[#111214] rounded-2xl border border-[#1e1f22] flex items-center justify-between">
              <span className="text-sm font-medium text-white">Orbs Balance</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2b2d31] rounded-full text-xs font-bold text-white">
                <Diamond className="w-3.5 h-3.5 text-[#5865f2] fill-[#5865f2]" />
                <span>0</span>
              </div>
            </div>

            {/* 2. Streaming Activity Card */}
            <div className="p-3.5 bg-[#111214] rounded-2xl border border-[#1e1f22] space-y-2 min-h-[90px]">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#23a55a]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Streaming
                </span>
              </div>
              <p className="text-xs text-[#949ba4]">
                Twitch / High-speed 1080p60 assault stream active
              </p>
            </div>

            {/* 3. Bio Card */}
            <div className="space-y-1 px-1">
              <h3 className="text-xs font-bold text-[#80848e] uppercase tracking-wider">
                Bio
              </h3>
              <p className="text-sm text-white font-medium">
                {currentUser.bio || 'a month ago'}
              </p>
            </div>

            {/* 4. Member Since Card */}
            <div className="space-y-1 px-1">
              <h3 className="text-xs font-bold text-[#80848e] uppercase tracking-wider">
                Member Since
              </h3>
              <div className="flex items-center gap-2 text-sm text-white">
                <svg className="w-4 h-4 text-[#5865f2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                </svg>
                <span>Aug 26, 2024</span>
              </div>
            </div>

            {/* 5. Friends Card with Overlapping Avatar Stack */}
            <div className="p-3.5 bg-[#111214] rounded-2xl border border-[#1e1f22] flex items-center justify-between cursor-pointer hover:bg-[#18191c] transition">
              <span className="text-sm font-medium text-white">Friends</span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {sampleFriends.map((f, i) => (
                    <img
                      key={i}
                      src={f}
                      alt="Friend"
                      className="w-6 h-6 rounded-full object-cover border border-[#111214]"
                    />
                  ))}
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </div>
            </div>

            {/* 6. Note (only visible to you) Card */}
            <div className="p-3.5 bg-[#111214] rounded-2xl border border-[#1e1f22] flex items-center justify-between cursor-pointer hover:bg-[#18191c] transition">
              <span className="text-sm font-medium text-white">
                Note (only visible to you)
              </span>
              <FileText className="w-4 h-4 text-[#80848e]" />
            </div>
          </div>
        )}

        {activeSegment === 'wishlist' && (
          <div className="p-8 text-center text-sm text-[#80848e] bg-[#111214] rounded-2xl border border-[#1e1f22]">
            <ShoppingBag className="w-8 h-8 mx-auto text-[#80848e] mb-2 opacity-50" />
            <p className="font-semibold text-white">Your wishlist is empty</p>
            <p className="text-xs text-[#80848e] mt-1">
              Add avatar decorations, profile effects, or Nitro items to your wishlist
            </p>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Pill Dock matching Screenshot 5 (Quests, Shop, Settings) */}
      <div className="fixed bottom-18 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <div className="pointer-events-auto bg-[#18191c]/95 backdrop-blur-md border border-[#2b2d31] rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-7">
          {/* Quests button */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 text-[#949ba4] hover:text-white transition cursor-pointer relative"
          >
            <Award className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold">Quests</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#ed4245]" />
          </button>

          {/* Shop button */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 text-[#949ba4] hover:text-white transition cursor-pointer"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold">Shop</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 text-[#949ba4] hover:text-white transition cursor-pointer"
          >
            <Settings className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold">Settings</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Edit Profile</h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-[#949ba4] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-1">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={editGlobalName}
                  onChange={(e) => setEditGlobalName(e.target.value)}
                  className="w-full bg-[#111214] border border-[#232428] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-1">
                  ABOUT ME / BIO
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#111214] border border-[#232428] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-1">
                  AVATAR IMAGE URL
                </label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full bg-[#111214] border border-[#232428] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 text-xs text-white hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Set Custom Status</h3>
            <form onSubmit={handleSaveStatus} className="space-y-4">
              <input
                type="text"
                value={customStatusInput}
                onChange={(e) => setCustomStatusInput(e.target.value)}
                placeholder="+ What's on your mind?"
                className="w-full bg-[#111214] border border-[#232428] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-xs text-white hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
