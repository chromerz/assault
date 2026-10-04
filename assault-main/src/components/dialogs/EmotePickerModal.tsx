import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface EmotePickerModalProps {
  onSelectEmote: (emote: string) => void;
  onClose: () => void;
}

const NITRO_EMOTES = [
  { name: 'fire', emoji: '🔥' },
  { name: 'heart', emoji: '❤️' },
  { name: 'sparkles', emoji: '✨' },
  { name: 'skull', emoji: '💀' },
  { name: 'meat', emoji: '🥩' },
  { name: 'rocket', emoji: '🚀' },
  { name: 'sunglasses', emoji: '😎' },
  { name: 'lightning', emoji: '⚡' },
  { name: '100', emoji: '💯' },
  { name: 'shield', emoji: '🛡️' },
  { name: 'gem', emoji: '💎' },
  { name: 'crying', emoji: '😭' },
  { name: 'eyes', emoji: '👀' },
  { name: 'salute', emoji: '🫡' },
  { name: 'party', emoji: '🎉' },
  { name: 'gamepad', emoji: '🎮' }
];

export const EmotePickerModal: React.FC<EmotePickerModalProps> = ({ onSelectEmote, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#eb459e]" />
            <h3 className="font-bold text-base text-white">Nitro Emote Bypass</h3>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-4 gap-3 max-h-72 overflow-y-auto">
          {NITRO_EMOTES.map((e) => (
            <button
              key={e.name}
              onClick={() => {
                onSelectEmote(e.emoji);
                onClose();
              }}
              className="p-3 bg-[#2b2d31] hover:bg-[#35373c] rounded-xl text-2xl flex items-center justify-center transition cursor-pointer hover:scale-110"
              title={`:${e.name}:`}
            >
              {e.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
