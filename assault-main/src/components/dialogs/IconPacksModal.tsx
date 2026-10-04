import React, { useState } from 'react';
import { X, Sparkles, Check, Plus, Image as ImageIcon, Sliders } from 'lucide-react';
import { ICON_PACKS, IconPack } from '../../services/iconPackEngine';
import { useAssault } from '../../context/AssaultContext';

interface IconPacksModalProps {
  onClose: () => void;
}

export const IconPacksModal: React.FC<IconPacksModalProps> = ({ onClose }) => {
  const { iconPack, setIconPack } = useAssault();
  const [selectedPackId, setSelectedPackId] = useState(iconPack);
  const [showCustomImporter, setShowCustomImporter] = useState(false);

  // Custom Icon Pack form state
  const [customName, setCustomName] = useState('');
  const [customHash, setCustomHash] = useState('💬');
  const [customVoice, setCustomVoice] = useState('🎙️');
  const [customAnnouncement, setCustomAnnouncement] = useState('📣');
  const [customBeef, setCustomBeef] = useState('🔥');

  const [availablePacks, setAvailablePacks] = useState<IconPack[]>(ICON_PACKS);

  const handleApply = (id: string) => {
    setSelectedPackId(id);
    setIconPack(id);
  };

  const handleCreateCustomPack = () => {
    if (!customName.trim()) return;
    const newPack: IconPack = {
      id: `custom_${Date.now()}`,
      name: customName,
      description: 'Custom imported user icon set',
      author: 'User Created',
      previewColor: '#fee75c',
      styleClass: 'custom-pack',
      hashIcon: customHash || '💬',
      voiceIcon: customVoice || '🎙️',
      announcementIcon: customAnnouncement || '📣',
      lockIcon: '🔒',
      micIcon: '🎙️',
      headphonesIcon: '🎧',
      settingsIcon: '⚙️',
      beefIcon: customBeef || '🔥'
    };
    setAvailablePacks((prev) => [...prev, newPack]);
    setSelectedPackId(newPack.id);
    setIconPack(newPack.id);
    setShowCustomImporter(false);
    setCustomName('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2b2d31] bg-[#18191c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#fee75c]/15 text-[#fee75c] border border-[#fee75c]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Icon Packs Manager</h2>
              <p className="text-xs text-[#949ba4]">
                Switch Discord channels, action buttons, and status iconography
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
              Installed Icon Packs ({availablePacks.length})
            </span>
            <button
              onClick={() => setShowCustomImporter(!showCustomImporter)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fee75c] text-black text-xs font-bold hover:bg-[#ebd34f] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Custom Pack</span>
            </button>
          </div>

          {/* Custom Importer Drawer */}
          {showCustomImporter && (
            <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#fee75c]/40 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Create / Import Custom Icon Glyphs
              </h3>
              <input
                type="text"
                placeholder="Pack Name (e.g. Cyber Glyphs)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#1e1f22] border border-[#35373c] rounded px-3 py-2 text-xs text-white focus:outline-none"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-[#949ba4]">Text Channel</label>
                  <input
                    type="text"
                    value={customHash}
                    onChange={(e) => setCustomHash(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#35373c] rounded p-1.5 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#949ba4]">Voice Channel</label>
                  <input
                    type="text"
                    value={customVoice}
                    onChange={(e) => setCustomVoice(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#35373c] rounded p-1.5 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#949ba4]">Announcement</label>
                  <input
                    type="text"
                    value={customAnnouncement}
                    onChange={(e) => setCustomAnnouncement(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#35373c] rounded p-1.5 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#949ba4]">BeefBot Icon</label>
                  <input
                    type="text"
                    value={customBeef}
                    onChange={(e) => setCustomBeef(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#35373c] rounded p-1.5 text-xs text-center text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowCustomImporter(false)}
                  className="px-3 py-1.5 text-xs text-[#949ba4] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomPack}
                  className="px-4 py-1.5 bg-[#fee75c] text-black font-bold text-xs rounded"
                >
                  Create & Apply
                </button>
              </div>
            </div>
          )}

          {/* Icon Packs Grid */}
          <div className="space-y-3">
            {availablePacks.map((pack) => {
              const isActive = selectedPackId === pack.id;
              return (
                <div
                  key={pack.id}
                  onClick={() => handleApply(pack.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                    isActive
                      ? 'bg-[#fee75c]/10 border-[#fee75c]'
                      : 'bg-[#2b2d31] border-[#35373c] hover:bg-[#313338]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{pack.name}</h4>
                      <span className="text-[10px] text-[#949ba4]">by {pack.author}</span>
                      {isActive && (
                        <span className="text-[10px] bg-[#fee75c] text-black px-2 py-0.5 rounded font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#949ba4] mt-0.5">{pack.description}</p>
                  </div>

                  {/* Icon Glyphs Preview Bar */}
                  <div className="flex items-center gap-2.5 bg-[#1e1f22] px-3 py-2 rounded-lg border border-[#35373c] shrink-0">
                    <span className="text-base" title="Text Channel">{pack.hashIcon}</span>
                    <span className="text-base" title="Voice Channel">{pack.voiceIcon}</span>
                    <span className="text-base" title="Announcement">{pack.announcementIcon}</span>
                    <span className="text-base" title="Locked Channel">{pack.lockIcon}</span>
                    <span className="text-base" title="Microphone">{pack.micIcon}</span>
                    <span className="text-base" title="BeefBot">{pack.beefIcon}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#fee75c] text-black font-bold text-xs rounded-lg hover:bg-[#ebd34f] transition cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
