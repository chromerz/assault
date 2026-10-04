import React from 'react';
import { X, Shield } from 'lucide-react';
import { DiscordUser } from '../types';
import { useAssault } from '../context/AssaultContext';

interface MembersDrawerProps {
  onClose: () => void;
  onSelectUser: (user: DiscordUser) => void;
}

export const MembersDrawer: React.FC<MembersDrawerProps> = ({ onClose, onSelectUser }) => {
  const { currentUser } = useAssault();

  const members: DiscordUser[] = [
    currentUser,
    {
      id: 'u_admin',
      username: 'ServerAdmin',
      globalName: 'Server Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop',
      badges: [
        { id: 'staff', title: 'Discord Staff', iconLabel: '🛡️', colorHex: '#5865f2' },
        { id: 'active_dev', title: 'Active Developer', iconLabel: '⚡', colorHex: '#00d26a' }
      ],
      roleColor: '#5865f2',
      status: 'ONLINE',
      customStatus: 'Maintaining server clusters'
    },
    {
      id: 'u_mod',
      username: 'BeefBot',
      globalName: 'BeefBot AutoMod',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop',
      isBot: true,
      badges: [{ id: 'bot', title: 'Verified Bot', iconLabel: '⚙️', colorHex: '#5865f2' }],
      roleColor: '#23a55a',
      status: 'ONLINE',
      customStatus: 'AutoMod Armed | Prefix: $'
    },
    {
      id: 'u_coder',
      username: 'QuantumCoder',
      globalName: 'Quantum Coder',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
      badges: [{ id: 'nitro', title: 'Nitro Booster', iconLabel: '💎', colorHex: '#eb459e' }],
      roleColor: '#f43f5e',
      status: 'ONLINE',
      customStatus: 'Writing client extensions'
    },
    {
      id: 'u_alex',
      username: 'AlexRivers',
      globalName: 'Alex Rivers',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      badges: [{ id: 'nitro', title: 'Nitro Booster', iconLabel: '💎', colorHex: '#eb459e' }],
      status: 'IDLE',
      customStatus: 'AFK in voice lobby'
    },
    {
      id: 'u_sneaky',
      username: 'SneakyUser',
      globalName: 'Sneaky User',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      badges: [],
      status: 'DND',
      customStatus: 'Testing anti-delete hooks'
    },
    {
      id: 'u_ghost',
      username: 'GhostAccount',
      globalName: 'Ghost Account',
      avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop',
      badges: [],
      status: 'OFFLINE'
    }
  ];

  const onlineMembers = members.filter((m) => m.status !== 'OFFLINE');
  const offlineMembers = members.filter((m) => m.status === 'OFFLINE');

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

  return (
    <aside className="w-60 bg-[#2b2d31] flex flex-col shrink-0 select-none z-10 border-l border-[#1f2023]">
      <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between font-bold text-xs text-[#949ba4] uppercase tracking-wider">
        <span>Members ({members.length})</span>
        <button onClick={onClose} className="p-1 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Online Section */}
        <div>
          <div className="px-2 py-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
            Online — {onlineMembers.length}
          </div>

          <div className="space-y-0.5 mt-1">
            {onlineMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => onSelectUser(member)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35373c] transition cursor-pointer text-left"
              >
                <div className="relative shrink-0">
                  <img
                    src={member.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt={member.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31]"
                    style={{ backgroundColor: getStatusColor(member.status) }}
                  />
                </div>

                <div className="truncate flex-1">
                  <div className="flex items-center gap-1">
                    <span
                      className="font-medium text-sm truncate"
                      style={{ color: member.roleColor || '#dbdee1' }}
                    >
                      {member.globalName || member.username}
                    </span>
                    {member.isBot && (
                      <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 rounded uppercase">
                        BOT
                      </span>
                    )}
                  </div>
                  {member.customStatus && (
                    <p className="text-[10px] text-[#949ba4] truncate">
                      {member.customStatus}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Offline Section */}
        {offlineMembers.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
              Offline — {offlineMembers.length}
            </div>

            <div className="space-y-0.5 mt-1 opacity-60">
              {offlineMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onSelectUser(member)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35373c] transition cursor-pointer text-left"
                >
                  <div className="relative shrink-0">
                    <img
                      src={member.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={member.username}
                      className="w-8 h-8 rounded-full object-cover grayscale"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] bg-[#80848e]" />
                  </div>

                  <div className="truncate flex-1">
                    <span className="font-medium text-sm text-[#949ba4] truncate">
                      {member.globalName || member.username}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
