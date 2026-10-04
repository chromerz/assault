import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  MoreHorizontal,
  X,
  ChevronRight,
  AtSign,
  Bell,
  Settings,
  Sparkles,
  BookMarked
} from 'lucide-react';

interface NotificationActivityItem {
  id: string;
  avatarUrl?: string;
  sender: string;
  action: 'mentioned you in' | 'replied to you in';
  location: string;
  quote: string;
  time: string;
  channelId: string;
}

interface DiscordMobileNotificationsTabProps {
  onSelectChannel: (channelId: string) => void;
}

export const DiscordMobileNotificationsTab: React.FC<DiscordMobileNotificationsTabProps> = ({
  onSelectChannel
}) => {
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);

  // Settings toggles matching Screenshot 1
  const [showRoleMentions, setShowRoleMentions] = useState(true);
  const [showIndirectMentions, setShowIndirectMentions] = useState(true);

  // Notifications matching Screenshot 3
  const [activities] = useState<NotificationActivityItem[]>([
    {
      id: 'act_1',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      sender: 'cosmin',
      action: 'mentioned you in',
      location: 'Heist - rewdrd-earn-free-giftcards',
      quote:
        '@everyone earn free giftcards with <https://rewrrd.com/r/arc> (code **GX5** for free points!) on-going $300 giveaway in their dc server above 🙂',
      time: '4h',
      channelId: 'ch_imsg'
    },
    {
      id: 'act_2',
      sender: 'catgirl rosy',
      action: 'replied to you in',
      location: '@ block party - imsg',
      quote: 'shes my bestfriend shush',
      time: '4h',
      channelId: 'ch_imsg'
    },
    {
      id: 'act_3',
      sender: 'catgirl rosy',
      action: 'replied to you in',
      location: '@ block party - imsg',
      quote: 'urs is cool atleast',
      time: '5h',
      channelId: 'ch_imsg'
    },
    {
      id: 'act_4',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop',
      sender: '@vampyre',
      action: 'replied to you in',
      location: '@ block party - imsg',
      quote: "i'm 15",
      time: '7h',
      channelId: 'ch_imsg'
    },
    {
      id: 'act_5',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop',
      sender: '@vampyre',
      action: 'mentioned you in',
      location: '@ block party - imsg',
      quote: 'huh',
      time: '7h',
      channelId: 'ch_imsg'
    },
    {
      id: 'act_6',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
      sender: 'Zah',
      action: 'replied to you in',
      location: '@ block party - imsg',
      quote: 'not emma buddy',
      time: '7h',
      channelId: 'ch_imsg'
    },
    {
      id: 'act_7',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
      sender: 'Zah',
      action: 'mentioned you in',
      location: '@ block party - imsg',
      quote: 'niggas can always larp',
      time: '7h',
      channelId: 'ch_imsg'
    },
    {
      id: 'act_8',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
      sender: 'Zah',
      action: 'replied to you in',
      location: '@ block party - imsg',
      quote: 'look at how unfunny n annoying she is bru',
      time: '7h',
      channelId: 'ch_imsg'
    }
  ]);

  return (
    <div className="flex-1 bg-[#000000] text-[#f2f3f5] overflow-y-auto select-none flex flex-col relative pb-20">
      {/* 1. Header matching Screenshot 3 */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#141517] shrink-0 bg-[#000000]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectChannel('ch_imsg')}
            className="text-[#949ba4] hover:text-white p-1 cursor-pointer"
            title="Back to chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">Notifications</h1>
        </div>

        {/* Top Right Action Icons: Bookmarks, Reminders, Options */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowBookmarksModal(true)}
            className="p-2 text-[#949ba4] hover:text-white hover:bg-[#1e1f22] rounded-full transition cursor-pointer"
            title="Bookmarks"
          >
            <Bookmark className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowRemindersModal(true)}
            className="p-2 text-[#949ba4] hover:text-white hover:bg-[#1e1f22] rounded-full transition cursor-pointer"
            title="Reminders"
          >
            <Clock className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowOptionsSheet(true)}
            className="p-2 text-[#949ba4] hover:text-white hover:bg-[#1e1f22] rounded-full transition cursor-pointer"
            title="Notification Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Section Header: Recent Activity */}
      <div className="px-4 pt-3 pb-1">
        <h2 className="text-xs font-bold text-[#80848e] tracking-tight">Recent Activity</h2>
      </div>

      {/* 3. Notifications List matching Screenshot 3 */}
      <div className="divide-y divide-[#141517]/80">
        {activities.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectChannel(item.channelId)}
            className="p-4 hover:bg-[#111214] transition cursor-pointer flex gap-3 group"
          >
            {/* Avatar or Placeholder */}
            <div className="shrink-0 pt-0.5">
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={item.sender}
                  className="w-10 h-10 rounded-full object-cover border border-[#1e1f22]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#18191c] border border-[#2b2d31] flex items-center justify-center text-xs font-bold text-[#949ba4]">
                  {item.sender.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-[#949ba4] leading-snug">
                  <span className="font-bold text-white">{item.sender}</span>{' '}
                  <span className="text-[#949ba4]">{item.action}</span>{' '}
                  <span className="text-white font-medium">{item.location}</span>:
                </p>
                <span className="text-[11px] text-[#80848e] shrink-0 font-medium">{item.time}</span>
              </div>

              {/* Quote block line */}
              <div className="mt-1 pl-2.5 border-l-2 border-[#35373c] text-xs text-[#dbdee1] font-normal leading-relaxed line-clamp-3">
                {item.quote}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Options Bottom Sheet matching Screenshot 1 */}
      {showOptionsSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setShowOptionsSheet(false)}
          />

          <div className="w-full max-w-lg bg-[#18191c] rounded-t-3xl border-t border-[#2b2d31] p-4 pb-8 space-y-4 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div className="w-10 h-1.5 bg-[#4e5058] rounded-full mx-auto" />

            <h3 className="text-base font-bold text-white px-2">Notifications</h3>

            {/* Group 1: Role Mentions & Indirect Mentions toggles */}
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AtSign className="w-5 h-5 text-[#949ba4]" />
                  <span className="text-sm font-medium text-white">Show Role Mentions</span>
                </div>
                <button
                  onClick={() => setShowRoleMentions(!showRoleMentions)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    showRoleMentions ? 'bg-[#5865f2]' : 'bg-[#4e5058]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 absolute top-0.5 ${
                      showRoleMentions ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#949ba4]" />
                  <div>
                    <span className="text-sm font-medium text-white block">
                      Show Indirect Mentions
                    </span>
                    <span className="text-xs text-[#80848e]">@here and @everyone</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowIndirectMentions(!showIndirectMentions)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    showIndirectMentions ? 'bg-[#5865f2]' : 'bg-[#4e5058]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 absolute top-0.5 ${
                      showIndirectMentions ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Group 2: Bookmarks, Reminders, Settings */}
            <div className="bg-[#111214] rounded-2xl overflow-hidden divide-y divide-[#1e1f22] border border-[#1e1f22]">
              <button
                onClick={() => {
                  setShowOptionsSheet(false);
                  setShowBookmarksModal(true);
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <Bookmark className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Bookmarks</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>

              <button
                onClick={() => {
                  setShowOptionsSheet(false);
                  setShowRemindersModal(true);
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Reminders</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>

              <button
                onClick={() => setShowOptionsSheet(false)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#18191c] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-[#949ba4] group-hover:text-white transition" />
                  <span className="text-sm font-medium text-white">Notification Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Bookmarks Screen matching Screenshot 2 */}
      {showBookmarksModal && (
        <div className="fixed inset-0 z-50 bg-[#000000] text-[#f2f3f5] flex flex-col animate-in fade-in duration-150">
          {/* Top Bar with X and Title */}
          <div className="h-14 px-4 flex items-center gap-4 border-b border-[#141517]">
            <button
              onClick={() => setShowBookmarksModal(false)}
              className="text-[#949ba4] hover:text-white p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-white tracking-tight">Bookmarks</h2>
          </div>

          {/* Bookmarks Hero & Illustration */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center space-y-6">
            {/* Wumpus Bookmark Graphic Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#5865f2] to-[#eb459e] flex items-center justify-center shadow-xl">
                <span className="text-5xl">👾</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#5865f2] border-2 border-[#000000] flex items-center justify-center text-white">
                <Bookmark className="w-5 h-5 fill-white" />
              </div>
              <Sparkles className="w-5 h-5 text-[#fee75c] absolute -top-2 -right-2 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Collect your favorite memories</h3>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                Long press any message and tap <strong className="text-white">Bookmark Message</strong>. Find it here, for your eyes only.
              </p>
            </div>

            {/* Interactive Preview Card matching Screenshot 2 */}
            <div className="w-full bg-[#111214] border border-[#232428] rounded-2xl p-4 text-left space-y-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-sm font-bold text-white">
                  W
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Wumpus</span>
                  <p className="text-[11px] text-[#dbdee1] leading-tight">
                    Concert tickets go on sale Friday at 10am! wait, did you see this the setlist for tonight looks unreal
                  </p>
                </div>
              </div>

              {/* Action sheet mockup inside preview card */}
              <div className="bg-[#1e1f22] rounded-xl p-2.5 space-y-2 border border-[#2b2d31]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Bookmark className="w-4 h-4 text-[#5865f2]" />
                  <span>Bookmark Message</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#949ba4]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Create Reminder</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBookmarksModal(false)}
              className="px-6 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
            >
              Back to Notifications
            </button>
          </div>
        </div>
      )}

      {/* 6. Reminders Screen */}
      {showRemindersModal && (
        <div className="fixed inset-0 z-50 bg-[#000000] text-[#f2f3f5] flex flex-col animate-in fade-in duration-150">
          <div className="h-14 px-4 flex items-center gap-4 border-b border-[#141517]">
            <button
              onClick={() => setShowRemindersModal(false)}
              className="text-[#949ba4] hover:text-white p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-white tracking-tight">Reminders</h2>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Clock className="w-12 h-12 text-[#5865f2] opacity-80" />
            <h3 className="text-lg font-bold text-white">No active reminders</h3>
            <p className="text-xs text-[#949ba4] max-w-xs">
              Never forget a message. Long press and choose "Create Reminder" to set an alert.
            </p>
            <button
              onClick={() => setShowRemindersModal(false)}
              className="px-5 py-2 bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
