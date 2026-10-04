import React from 'react';
import { MessageSquare, Bell, Compass, Shield } from 'lucide-react';
import { useAssault } from '../context/AssaultContext';
import { haptics } from '../services/hapticsService';

export type MobileTab = 'servers' | 'chat' | 'dms' | 'notifications' | 'you';

interface DiscordMobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  unreadNotificationsCount?: number;
}

export const DiscordMobileBottomNav: React.FC<DiscordMobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadNotificationsCount = 2
}) => {
  const { currentUser } = useAssault();

  const handleTabClick = (tab: MobileTab) => {
    haptics.tabSwitch();
    onTabChange(tab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return '#23a55a';
      case 'IDLE':
        return '#f0b232';
      case 'DND':
        return '#f23f43';
      default:
        return '#80848e';
    }
  };

  const isServersOrChat = activeTab === 'servers' || activeTab === 'chat';

  return (
    <nav className="h-14 bg-[#000000] border-t border-[#141517] flex items-center justify-around px-2 z-40 shrink-0 select-none">
      {/* 1. Servers & Chat Tab */}
      <button
        onClick={() => handleTabClick('servers')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer active:scale-95 ${
          isServersOrChat ? 'text-white' : 'text-[#949ba4] hover:text-[#dbdee1]'
        }`}
      >
        <div className="relative">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          {isServersOrChat && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5">Servers</span>
      </button>

      {/* 2. Messages / DMs Tab */}
      <button
        onClick={() => handleTabClick('dms')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer active:scale-95 ${
          activeTab === 'dms' ? 'text-white' : 'text-[#949ba4] hover:text-[#dbdee1]'
        }`}
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {activeTab === 'dms' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5">Messages</span>
      </button>

      {/* 3. Notifications Tab */}
      <button
        onClick={() => handleTabClick('notifications')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer active:scale-95 ${
          activeTab === 'notifications' ? 'text-white' : 'text-[#949ba4] hover:text-[#dbdee1]'
        }`}
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ed4245] text-white text-[9px] font-bold px-1 rounded-full border border-[#1e1f22]">
              {unreadNotificationsCount}
            </span>
          )}
          {activeTab === 'notifications' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5">Notifications</span>
      </button>

      {/* 4. You Tab (Discord Mobile Iconic Avatar Profile Dock) */}
      <button
        onClick={() => handleTabClick('you')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer active:scale-95 ${
          activeTab === 'you' ? 'text-white' : 'text-[#949ba4] hover:text-[#dbdee1]'
        }`}
      >
        <div className="relative">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.username}
            className={`w-6 h-6 rounded-full object-cover border-2 ${
              activeTab === 'you' ? 'border-white' : 'border-transparent'
            }`}
          />
          <span
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-1 border-[#1e1f22]"
            style={{ backgroundColor: getStatusColor(currentUser.status) }}
          />
          {activeTab === 'you' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5">You</span>
      </button>
    </nav>
  );
};
