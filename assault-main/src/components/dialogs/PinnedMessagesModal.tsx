import React from 'react';
import { X, Pin, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';
import { DiscordMessage } from '../../types';

interface PinnedMessagesModalProps {
  onClose: () => void;
  onJumpToMessage?: (msgId: string) => void;
}

export const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({ onClose, onJumpToMessage }) => {
  const { pinnedMessages, togglePinMessage, activeChannel } = useAssault();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between bg-[#111214]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center">
              <Pin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Pinned Messages</h3>
              <p className="text-xs text-[#949ba4]">#{activeChannel?.name || 'chat'} • {pinnedMessages.length} pinned</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-md hover:bg-[#313338] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3">
          {pinnedMessages.length === 0 ? (
            <div className="py-12 text-center text-[#949ba4]">
              <div className="w-12 h-12 rounded-full bg-[#2b2d31] flex items-center justify-center mx-auto mb-3 text-[#5865f2]">
                <Pin className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#f2f3f5]">No pinned messages yet</p>
              <p className="text-xs text-[#949ba4] mt-1 max-w-xs mx-auto">
                Hover any message in the chat and click the Pin icon to keep track of important announcements and links.
              </p>
            </div>
          ) : (
            pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-[#2b2d31] border border-[#35373c] rounded-xl p-3.5 hover:border-[#5865f2]/50 transition group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={msg.author.avatarUrl}
                      alt={msg.author.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-white">
                      {msg.author.globalName || msg.author.username}
                    </span>
                    <span className="text-[10px] text-[#949ba4]">
                      {new Date(msg.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePinMessage(msg.id)}
                      className="text-[#949ba4] hover:text-[#ed4245] p-1 rounded hover:bg-[#313338] transition cursor-pointer"
                      title="Unpin message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#dbdee1] whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
                {onJumpToMessage && (
                  <button
                    onClick={() => {
                      onJumpToMessage(msg.id);
                      onClose();
                    }}
                    className="mt-2.5 flex items-center gap-1 text-[11px] text-[#5865f2] hover:underline cursor-pointer"
                  >
                    <span>Jump to message</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
