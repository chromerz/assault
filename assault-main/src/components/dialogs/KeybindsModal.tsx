import React, { useState } from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { INITIAL_SHORTCUTS } from '../../data/initialData';
import { CustomKeyShortcut } from '../../types';

interface KeybindsModalProps {
  onClose: () => void;
}

export const KeybindsModal: React.FC<KeybindsModalProps> = ({ onClose }) => {
  const [shortcuts] = useState<CustomKeyShortcut[]>(INITIAL_SHORTCUTS);

  const getShortcutString = (s: CustomKeyShortcut) => {
    const parts: string[] = [];
    if (s.modifierCtrl) parts.push('Ctrl');
    if (s.modifierAlt) parts.push('Alt');
    if (s.modifierShift) parts.push('Shift');
    parts.push(s.keyChar.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#949ba4]" />
            <h3 className="font-bold text-base text-white">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-[#2b2d31] rounded-lg border border-[#35373c]"
            >
              <div>
                <p className="text-sm font-semibold text-[#f2f3f5]">{s.label}</p>
                <span className="text-[10px] text-[#949ba4]">{s.category}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs bg-[#1e1f22] px-2.5 py-1 rounded text-[#5865f2] border border-[#35373c]">
                <Command className="w-3 h-3 text-[#949ba4]" />
                <span>{getShortcutString(s)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#5865f2] text-white font-semibold text-xs hover:bg-[#4752c4] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
