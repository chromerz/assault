import React, { useState } from 'react';
import { X, Volume2, Sparkles, Music, Play, Radio, VolumeX } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';
import { SOUNDBOARD_PRESETS } from '../../services/pluginSourcesEngine';
import { SoundboardItem } from '../../types';

interface SoundboardModalProps {
  onClose: () => void;
  onSendToChat?: (soundName: string) => void;
}

export const SoundboardModal: React.FC<SoundboardModalProps> = ({ onClose, onSendToChat }) => {
  const { playAudio, connectedVoiceChannelId, channels } = useAssault();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  const categories = ['All', 'Memes', 'Sound FX', 'Discord Classic'];

  const filteredSounds = selectedCategory === 'All'
    ? SOUNDBOARD_PRESETS
    : SOUNDBOARD_PRESETS.filter((s) => s.category === selectedCategory);

  const activeVoiceName = channels.find((c) => c.id === connectedVoiceChannelId)?.name;

  const handlePlaySound = (item: SoundboardItem) => {
    setActivePlayingId(item.id);
    playAudio(item.soundType);
    if (onSendToChat) {
      onSendToChat(`🔊 [Soundboard: ${item.name} ${item.emoji}]`);
    }
    setTimeout(() => {
      setActivePlayingId((curr) => (curr === item.id ? null : curr));
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between bg-[#111214]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Soundboard</span>
                {connectedVoiceChannelId && (
                  <span className="text-[10px] bg-[#23a55a]/20 text-[#23a55a] font-semibold px-2 py-0.5 rounded-full border border-[#23a55a]/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a] animate-pulse" />
                    In #{activeVoiceName}
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#949ba4]">Play live synthesized audio effects directly into voice & chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-md hover:bg-[#313338] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2.5 bg-[#2b2d31]/50 border-b border-[#2b2d31] flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#313338]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sounds Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2.5">
          {filteredSounds.map((item) => {
            const isPlaying = activePlayingId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handlePlaySound(item)}
                className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                  isPlaying
                    ? 'bg-[#5865f2]/20 border-[#5865f2] scale-98 shadow-md shadow-[#5865f2]/20'
                    : 'bg-[#2b2d31]/70 hover:bg-[#2b2d31] border-[#313338] hover:border-[#404249]'
                }`}
              >
                <span className={`text-2xl transition-transform ${isPlaying ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`}>
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#5865f2] transition">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-[#949ba4] flex items-center gap-1.5 mt-0.5">
                    <span>{item.duration}</span>
                    <span>•</span>
                    <span className="truncate">{item.category}</span>
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition ${
                  isPlaying ? 'bg-[#5865f2] text-white' : 'bg-[#1e1f22] text-[#949ba4] group-hover:text-white'
                }`}>
                  <Play className="w-3 h-3 ml-0.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-[#111214] border-t border-[#2b2d31] flex items-center justify-between text-[11px] text-[#949ba4]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#fee75c]" />
            Synthesized via Web Audio API (Zero lag)
          </span>
          <span>{filteredSounds.length} sounds</span>
        </div>
      </div>
    </div>
  );
};
