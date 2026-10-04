import React, { useState } from 'react';
import { X, Palette, Check, Sparkles } from 'lucide-react';
import { CSS_TEMPLATES, CssThemeEngine } from '../../services/cssThemeEngine';
import { useAssault } from '../../context/AssaultContext';

interface CssThemeModalProps {
  onClose: () => void;
}

export const CssThemeModal: React.FC<CssThemeModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useAssault();
  const [cssText, setCssText] = useState(settings.customCss);
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = CSS_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setSelectedTemplate(templateId);
      setCssText(tmpl.css);
      updateSettings((prev) => ({ ...prev, customCss: tmpl.css, enableCustomCss: true }));
    }
  };

  const handleSave = () => {
    updateSettings((prev) => ({ ...prev, customCss: cssText, enableCustomCss: true }));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#eb459e]" />
            <div>
              <h3 className="font-bold text-base text-white">CSS Theme Studio & Variable Editor</h3>
              <p className="text-xs text-[#949ba4]">Inject real-time custom CSS styles, fonts, and theme variables</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Preset Theme Cards */}
          <div>
            <label className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider block mb-2">
              Preset Themes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CSS_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                    selectedTemplate === tmpl.id
                      ? 'bg-[#eb459e]/20 border-[#eb459e] text-white'
                      : 'bg-[#2b2d31] border-[#35373c] text-[#949ba4] hover:bg-[#35373c]'
                  }`}
                >
                  <p className="font-bold text-xs text-[#f2f3f5] truncate">{tmpl.name}</p>
                  <p className="text-[10px] text-[#949ba4] line-clamp-2 mt-0.5">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Live CSS Editor */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
                Live CSS Code Editor
              </label>
              <span className="text-[11px] text-[#23a55a] flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Injected directly into DOM root
              </span>
            </div>
            <textarea
              value={cssText}
              onChange={(e) => setCssText(e.target.value)}
              rows={12}
              className="w-full bg-[#0b0c0f] border border-[#2b2d31] rounded-lg p-3 font-mono text-xs text-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#eb459e]"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-between items-center">
          <button
            onClick={() => {
              CssThemeEngine.applyCss(cssText, true);
            }}
            className="px-3 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs font-semibold text-white transition cursor-pointer"
          >
            Preview Changes
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs font-semibold text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-[#eb459e] hover:bg-[#d63384] text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
