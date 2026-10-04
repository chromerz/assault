import React from 'react';
import { X, History } from 'lucide-react';
import { DiscordMessage } from '../../types';

interface EditHistoryModalProps {
  message: DiscordMessage;
  onClose: () => void;
}

export const EditHistoryModal: React.FC<EditHistoryModalProps> = ({ message, onClose }) => {
  const history = message.editHistory || [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#f59e0b]" />
            <h3 className="font-bold text-base text-white">Message Edit Forensics</h3>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="text-xs text-[#949ba4] mb-2">
            Author: <span className="font-bold text-white">@{message.author.username}</span>
          </div>

          {/* Current message */}
          <div className="p-3 bg-[#2b2d31] rounded-lg border border-[#23a55a]">
            <span className="text-[10px] font-bold text-[#23a55a] uppercase">Current Version</span>
            <p className="text-xs text-[#f2f3f5] mt-1">{message.content}</p>
          </div>

          {/* Historical revisions */}
          {history.map((rev, idx) => (
            <div key={idx} className="p-3 bg-[#18191c] rounded-lg border border-[#35373c]">
              <span className="text-[10px] font-bold text-[#949ba4] uppercase">
                Revision #{history.length - idx}
              </span>
              <p className="text-xs text-[#dbdee1] line-through mt-1 opacity-70">{rev}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#5865f2] text-white font-semibold text-xs hover:bg-[#4752c4] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
