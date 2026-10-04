import React, { useState } from 'react';
import { Search, UserPlus, Users, MessageSquare, X, Check, Sparkles, Play } from 'lucide-react';
import { useAssault } from '../context/AssaultContext';
import { DiscordUser } from '../types';

interface DiscordMobileDMsTabProps {
  onSelectChannel: (channelId: string) => void;
  onOpenUserProfile: (user: DiscordUser) => void;
}

interface DMPreviewItem {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE' | 'STREAMING';
  lastSnippet: string;
  time: string;
  badges?: string[];
  unread?: boolean;
}

const DMS_PREVIEW_LIST: DMPreviewItem[] = [
  {
    id: 'dm_rep',
    name: 'rep',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
    status: 'OFFLINE',
    lastSnippet: 'You: sob',
    time: '5:07 AM'
  },
  {
    id: 'dm_blod',
    name: 'blod',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop',
    status: 'OFFLINE',
    lastSnippet: 'You: huh',
    time: '4:52 AM'
  },
  {
    id: 'dm_winterlosers',
    name: ':3',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
    status: 'OFFLINE',
    lastSnippet: 'You: kewl',
    time: '3:29 AM'
  },
  {
    id: 'dm_rick_owens',
    name: 'rick owens',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
    status: 'OFFLINE',
    lastSnippet: 'rick owens: ...',
    time: 'Yesterday'
  },
  {
    id: 'dm_x',
    name: 'x',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
    status: 'OFFLINE',
    lastSnippet: 'You: thats a',
    time: 'Yesterday'
  },
  {
    id: 'dm_solange',
    name: 'solange',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop',
    status: 'OFFLINE',
    lastSnippet: 'You: wat',
    time: 'Sep 29'
  },
  {
    id: 'dm_mel',
    name: 'mel 🍁🗡️',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop',
    status: 'DND',
    lastSnippet: 'You: i would',
    time: 'Sep 29'
  },
  {
    id: 'dm_xssault',
    name: 'xssault',
    avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop',
    status: 'STREAMING',
    lastSnippet: 'Streaming: lol on PlayStation',
    time: 'Sep 28'
  }
];

export const DiscordMobileDMsTab: React.FC<DiscordMobileDMsTabProps> = ({
  onSelectChannel,
  onOpenUserProfile
}) => {
  const { channels } = useAssault();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendTag, setFriendTag] = useState('');
  const [friendAddedMessage, setFriendAddedMessage] = useState(false);

  const filteredItems = DMS_PREVIEW_LIST.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lastSnippet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatus = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#23a55a] border-2 border-[#000000]" />;
      case 'IDLE':
        return <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#f0b232] border-2 border-[#000000]" />;
      case 'DND':
        return (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#f23f43] border-2 border-[#000000] flex items-center justify-center">
            <span className="w-1.5 h-0.5 bg-white rounded-full" />
          </span>
        );
      case 'STREAMING':
        return (
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#593695] border-2 border-[#000000] flex items-center justify-center">
            <Play className="w-2 h-2 text-white fill-current" />
          </span>
        );
      default:
        // Offline grey ring
        return (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#000000] border-2 border-[#000000] flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#80848e] bg-[#000000]" />
          </span>
        );
    }
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendTag.trim()) return;
    setFriendAddedMessage(true);
    setTimeout(() => {
      setFriendAddedMessage(false);
      setShowAddFriendModal(false);
      setFriendTag('');
    }, 1500);
  };

  return (
    <div className="flex-1 bg-[#000000] text-white overflow-y-auto select-none flex flex-col">
      {/* 1. Authentic Header from Screenshot 3 */}
      <div className="h-14 px-4 flex items-center justify-between shrink-0 bg-[#000000]">
        <h1 className="font-extrabold text-xl text-white tracking-tight">Messages</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchTerm(searchTerm ? '' : ' ')}
            className="w-9 h-9 rounded-full bg-[#1e1f22] flex items-center justify-center text-[#dbdee1] hover:text-white transition cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="w-9 h-9 rounded-full bg-[#1e1f22] flex items-center justify-center text-[#dbdee1] hover:text-white transition cursor-pointer"
            title="Add Friend"
          >
            <UserPlus className="w-4 h-4 text-[#5865f2]" />
          </button>
        </div>
      </div>

      {/* 2. Active Now / Stories Horizontal Row (Screenshot 3) */}
      <div className="px-4 py-2 flex items-center gap-3 overflow-x-auto border-b border-[#141517] shrink-0">
        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1f22] border border-[#2b2d31] p-1 flex items-center justify-center relative overflow-hidden group-hover:border-[#5865f2] transition">
            <img
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop"
              alt="x"
              className="w-full h-full rounded-xl object-cover"
            />
            <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-[#593695] border border-[#000000]" />
          </div>
          <span className="text-[11px] text-[#dbdee1] font-semibold truncate max-w-[56px]">x</span>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1f22] border border-[#2b2d31] p-1 flex items-center justify-center relative overflow-hidden group-hover:border-[#5865f2] transition">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"
              alt="rep"
              className="w-full h-full rounded-xl object-cover"
            />
            <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-[#23a55a] border border-[#000000]" />
          </div>
          <span className="text-[11px] text-[#dbdee1] font-semibold truncate max-w-[56px]">rep</span>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1f22] border border-[#2b2d31] p-1 flex items-center justify-center relative overflow-hidden group-hover:border-[#5865f2] transition">
            <img
              src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop"
              alt="rick"
              className="w-full h-full rounded-xl object-cover"
            />
          </div>
          <span className="text-[11px] text-[#dbdee1] font-semibold truncate max-w-[56px]">rick owens</span>
        </div>
      </div>

      {/* 3. Direct Messages List matching Screenshot 3 */}
      <div className="px-2 py-2 space-y-0.5 flex-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectChannel(item.id)}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-[#141517] transition cursor-pointer text-left group"
          >
            {/* Avatar with authentic status ring */}
            <div
              className="relative shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onOpenUserProfile({
                  id: item.id,
                  username: item.name,
                  globalName: item.name,
                  avatarUrl: item.avatarUrl,
                  status: item.status === 'STREAMING' ? 'ONLINE' : item.status,
                  badges: [],
                  bio: 'i love daddy assault im his little girl he makes me so wet'
                });
              }}
            >
              <img
                src={item.avatarUrl}
                alt={item.name}
                className="w-11 h-11 rounded-full object-cover"
              />
              {renderStatus(item.status)}
            </div>

            {/* Conversation text info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm text-white truncate group-hover:text-[#5865f2] transition">
                  {item.name}
                </span>
                <span className="text-[11px] text-[#80848e] shrink-0 font-medium">
                  {item.time}
                </span>
              </div>
              <p className="text-xs text-[#949ba4] truncate mt-0.5">
                {item.lastSnippet}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#111214] border border-[#2b2d31] rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-white">Add by Discord Tag</h3>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-[#949ba4] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {friendAddedMessage ? (
              <div className="p-4 bg-[#23a55a]/20 border border-[#23a55a] rounded-xl text-center text-[#23a55a] text-xs font-bold">
                ✓ Friend request sent to {friendTag}!
              </div>
            ) : (
              <form onSubmit={handleAddFriend} className="space-y-4">
                <p className="text-xs text-[#949ba4]">
                  Enter username or tag to send friend request.
                </p>
                <input
                  type="text"
                  required
                  placeholder="winterlosers or rep"
                  value={friendTag}
                  onChange={(e) => setFriendTag(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#5865f2]"
                  autoFocus
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFriendModal(false)}
                    className="px-4 py-2 text-xs text-[#949ba4] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition"
                  >
                    Send Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
