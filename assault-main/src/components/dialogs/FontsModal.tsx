import React, { useState } from 'react';
import { fontEngine, DEFAULT_FONTS } from '../../services/fontEngine';
import { CustomFontItem } from '../../types';
import {
  Type,
  Check,
  RotateCcw,
  Plus,
  Search,
  Sliders,
  ExternalLink,
  X
} from 'lucide-react';

interface FontsModalProps {
  onClose: () => void;
}

export const FontsModal: React.FC<FontsModalProps> = ({ onClose }) => {
  const [fonts, setFonts] = useState<CustomFontItem[]>(fontEngine.getFonts());
  const [activeFontId, setActiveFontId] = useState<string>(fontEngine.getActiveFontId());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sampleText, setSampleText] = useState('The quick brown fox jumps over the lazy dog');
  const [showAddModal, setShowAddModal] = useState(false);

  // New font form
  const [newFontName, setNewFontName] = useState('');
  const [newFontFamily, setNewFontFamily] = useState('');
  const [newFontUrl, setNewFontUrl] = useState('');

  const categories = ['All', 'Sans-Serif', 'Monospace', 'Display', 'Handwriting'];

  const filteredFonts = fonts.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.family.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectFont = (fontId: string) => {
    fontEngine.applyFont(fontId);
    setActiveFontId(fontId);
  };

  const handleAddCustomFont = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFontName.trim() || !newFontFamily.trim()) return;

    const fontItem: CustomFontItem = {
      id: `font_custom_${Date.now()}`,
      name: newFontName.trim(),
      family: newFontFamily.trim(),
      category: 'Sans-Serif',
      sourceUrl: newFontUrl.trim() || undefined,
      previewText: sampleText,
      isBuiltin: false,
      author: 'Custom Imported'
    };

    fontEngine.addCustomFont(fontItem);
    setFonts(fontEngine.getFonts());
    setActiveFontId(fontItem.id);
    setShowAddModal(false);
    setNewFontName('');
    setNewFontFamily('');
    setNewFontUrl('');
  };

  const handleResetDefault = () => {
    handleSelectFont('font_default');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#111214] border border-[#232428] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[88vh]">
        {/* Header */}
        <div className="p-4 bg-[#1e1f22] border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5865f2]/20 flex items-center justify-center text-[#5865f2] border border-[#5865f2]/30">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Custom Typography & Fonts Engine
              </h2>
              <p className="text-xs text-[#949ba4]">
                Override Discord client font families, weights, and rendering in real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#949ba4] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#16181c] border-b border-[#232428] space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#949ba4] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search typography and font families..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0b0c0f] border border-[#232428] rounded-xl text-white text-xs placeholder-[#949ba4] focus:outline-hidden focus:border-[#5865f2]"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Font
            </button>
            <button
              onClick={handleResetDefault}
              className="px-3 py-1.5 rounded-xl bg-[#232428] hover:bg-[#2b2d31] text-[#dbdee1] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/5 shrink-0"
              title="Reset to System Default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#5865f2] text-white'
                    : 'bg-[#232428] text-[#949ba4] hover:text-white hover:bg-[#2b2d31]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sample Text Preview Editor */}
          <div className="flex items-center gap-2 bg-[#0b0c0f] px-3 py-1.5 rounded-xl border border-[#232428]">
            <span className="text-[10px] text-[#949ba4] uppercase font-bold tracking-wider shrink-0">
              Preview:
            </span>
            <input
              type="text"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-hidden placeholder-[#949ba4]"
              placeholder="Type sample text to preview fonts..."
            />
          </div>
        </div>

        {/* Font Cards List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {filteredFonts.length === 0 ? (
            <div className="text-center py-8 text-[#949ba4] text-xs">
              No fonts match your search criteria.
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isSelected = activeFontId === font.id;
              return (
                <div
                  key={font.id}
                  onClick={() => handleSelectFont(font.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#5865f2]/10 border-[#5865f2] shadow-md shadow-[#5865f2]/10'
                      : 'bg-[#1e1f22]/70 border-[#232428] hover:border-[#35373c] hover:bg-[#1e1f22]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{font.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#949ba4] font-mono border border-white/5">
                        {font.category}
                      </span>
                      {font.isBuiltin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#57f287]/10 text-[#57f287] border border-[#57f287]/20">
                          Bundled
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] text-[#57f287] font-semibold bg-[#57f287]/10 px-2 py-0.5 rounded-full border border-[#57f287]/20">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <p
                    className="text-base text-white/95 my-1.5 truncate"
                    style={{ fontFamily: font.family }}
                  >
                    {sampleText || font.previewText}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#949ba4] font-mono pt-1 border-t border-white/5">
                    <span className="truncate max-w-[80%]">{font.family}</span>
                    <span>by {font.author}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Add Custom Web Font */}
        {showAddModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md bg-[#1e1f22] border border-[#2b2d31] rounded-2xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#5865f2]" />
                  Import Custom Web Font
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#949ba4] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomFont} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#dbdee1] font-semibold mb-1">
                    Font Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Outfit, Cascadia Code"
                    value={newFontName}
                    onChange={(e) => setNewFontName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111214] border border-[#2b2d31] rounded-xl text-white placeholder-[#949ba4] focus:outline-hidden focus:border-[#5865f2]"
                  />
                </div>

                <div>
                  <label className="block text-[#dbdee1] font-semibold mb-1">
                    CSS Font-Family String
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 'Outfit', sans-serif"
                    value={newFontFamily}
                    onChange={(e) => setNewFontFamily(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111214] border border-[#2b2d31] rounded-xl text-white placeholder-[#949ba4] focus:outline-hidden focus:border-[#5865f2]"
                  />
                </div>

                <div>
                  <label className="block text-[#dbdee1] font-semibold mb-1">
                    Google Fonts or Web Font URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    value={newFontUrl}
                    onChange={(e) => setNewFontUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111214] border border-[#2b2d31] rounded-xl text-white placeholder-[#949ba4] focus:outline-hidden focus:border-[#5865f2]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium transition-colors shadow-sm"
                  >
                    Save & Apply
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-[#1e1f22] border-t border-[#232428] flex items-center justify-between">
          <div className="text-xs text-[#949ba4]">
            Active Font: <span className="text-white font-semibold">{fonts.find((f) => f.id === activeFontId)?.name || 'Default'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
