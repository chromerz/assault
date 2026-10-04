import React, { useState } from 'react';
import { CustomIconConfig, IconShapeType } from '../../types';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Grid,
  Layers,
  X
} from 'lucide-react';

interface AppIconDesignerModalProps {
  initialConfig?: CustomIconConfig;
  onSave: (config: CustomIconConfig) => void;
  onClose: () => void;
}

export const ICON_COLOR_PRESETS: Array<{
  id: string;
  name: string;
  primary: string;
  background: string;
  badgeBg: string;
}> = [
  { id: 'blurple', name: 'Classic Blurple', primary: '#FFFFFF', background: '#5865F2', badgeBg: '#57F287' },
  { id: 'amoled', name: 'Onyx AMOLED', primary: '#FFFFFF', background: '#000000', badgeBg: '#5865F2' },
  { id: 'crimson', name: 'Crimson Red', primary: '#FFFFFF', background: '#ED4245', badgeBg: '#FEE75C' },
  { id: 'cyberpunk', name: 'Neon Cyberpunk', primary: '#000000', background: '#00F0FF', badgeBg: '#FF007F' },
  { id: 'emerald', name: 'Emerald Mint', primary: '#0F1015', background: '#57F287', badgeBg: '#5865F2' },
  { id: 'gold', name: 'Sunlight Gold', primary: '#0F1015', background: '#FEE75C', badgeBg: '#ED4245' },
  { id: 'midnight', name: 'Midnight Violet', primary: '#F2F3F5', background: '#2D1B69', badgeBg: '#EB459E' }
];

export const AppIconDesignerModal: React.FC<AppIconDesignerModalProps> = ({
  initialConfig,
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState<CustomIconConfig>(
    initialConfig || {
      shape: 'rounded',
      primaryColor: '#FFFFFF',
      backgroundColor: '#5865F2',
      monochrome: false,
      opacity: 100,
      presetId: 'blurple',
      hasCustomBadge: true,
      badgeLabel: 'MOD'
    }
  );

  const [hexColorInput, setHexColorInput] = useState(config.backgroundColor);

  const shapes: Array<{ id: IconShapeType; label: string; roundedClass: string }> = [
    { id: 'rounded', label: 'Rounded Squircle', roundedClass: 'rounded-2xl' },
    { id: 'squircle', label: 'Adaptive Squircle', roundedClass: 'rounded-3xl' },
    { id: 'circle', label: 'Circular', roundedClass: 'rounded-full' },
    { id: 'teardrop', label: 'Teardrop', roundedClass: 'rounded-2xl rounded-tr-xs' },
    { id: 'classic', label: 'Sharp Classic', roundedClass: 'rounded-xl' }
  ];

  const handleSelectPreset = (preset: typeof ICON_COLOR_PRESETS[0]) => {
    setConfig((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      backgroundColor: preset.background,
      presetId: preset.id
    }));
    setHexColorInput(preset.background);
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const currentShape = shapes.find((s) => s.id === config.shape) || shapes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#111214] border border-[#232428] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#1e1f22] border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5865f2]/20 flex items-center justify-center text-[#5865f2] border border-[#5865f2]/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Custom App Icon Designer
              </h2>
              <p className="text-xs text-[#949ba4]">
                Design custom adaptive launcher icons and notification badges for the patched client
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

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs font-sans">
          {/* Transparency Grid Canvas Preview */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#0b0c0f] rounded-2xl border border-[#232428] relative">
            <div className="text-[11px] font-semibold text-[#949ba4] mb-3 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-[#5865f2]" />
              Interactive Vector Icon Preview
            </div>

            {/* Checkerboard transparency background */}
            <div className="p-3 rounded-2xl bg-[radial-gradient(#2b2d31_1px,transparent_1px)] [background-size:8px_8px] border border-white/5 shadow-inner">
              <div
                className={`w-28 h-28 ${currentShape.roundedClass} relative flex items-center justify-center shadow-xl transition-all duration-200`}
                style={{
                  backgroundColor: config.monochrome ? '#111214' : config.backgroundColor,
                  opacity: config.opacity / 100
                }}
              >
                {/* Discord Clyde Gamepad Symbol */}
                <svg
                  className="w-16 h-16 transition-colors duration-200 drop-shadow-sm"
                  viewBox="0 0 127.14 96.36"
                  fill={config.monochrome ? '#ffffff' : config.primaryColor}
                >
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>

                {/* Badge Overlay */}
                {config.hasCustomBadge && (
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-[#57f287] text-[#0f1015] shadow-md border-2 border-[#111214]">
                    {config.badgeLabel || 'MOD'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-white font-semibold mb-2">Color Theme Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ICON_COLOR_PRESETS.map((preset) => {
                const isSelected = config.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-[#5865f2] bg-[#5865f2]/10 shadow-sm'
                        : 'border-[#232428] bg-[#1e1f22] hover:border-[#35373c]'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: preset.background }}
                    />
                    <span className="text-white truncate font-medium">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Shape */}
          <div>
            <label className="block text-white font-semibold mb-2">Mask & Adaptive Shape</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {shapes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setConfig({ ...config, shape: s.id })}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                    config.shape === s.id
                      ? 'border-[#5865f2] bg-[#5865f2]/10 text-white'
                      : 'border-[#232428] bg-[#1e1f22] text-[#949ba4] hover:text-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 bg-[#5865f2] ${s.roundedClass} border border-white/10`}
                  />
                  <span className="text-[11px] font-medium text-center truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Opacity Controls */}
          <div className="p-4 bg-[#1e1f22] rounded-2xl border border-[#232428] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Background Color (Hex)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => {
                    setConfig({ ...config, backgroundColor: e.target.value, presetId: 'custom' });
                    setHexColorInput(e.target.value);
                  }}
                  className="w-7 h-7 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={hexColorInput}
                  onChange={(e) => {
                    setHexColorInput(e.target.value);
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      setConfig({ ...config, backgroundColor: e.target.value, presetId: 'custom' });
                    }
                  }}
                  className="w-24 px-2 py-1 bg-[#111214] border border-[#2b2d31] rounded-lg text-white font-mono text-center focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[#dbdee1] mb-1">
                <span>Icon Opacity</span>
                <span className="font-mono">{config.opacity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={config.opacity}
                onChange={(e) => setConfig({ ...config, opacity: Number(e.target.value) })}
                className="w-full accent-[#5865f2] cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-medium block">Monochrome Themed Icon</span>
                <span className="text-[11px] text-[#949ba4]">
                  Compatible with Android 13+ wallpaper color tinting
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.monochrome}
                onChange={(e) => setConfig({ ...config, monochrome: e.target.checked })}
                className="w-4 h-4 accent-[#5865f2] rounded"
              />
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-medium block">Display Custom Badge</span>
                <span className="text-[11px] text-[#949ba4]">
                  Corner badge badge label on launcher icon
                </span>
              </div>
              <div className="flex items-center gap-2">
                {config.hasCustomBadge && (
                  <input
                    type="text"
                    maxLength={4}
                    value={config.badgeLabel}
                    onChange={(e) => setConfig({ ...config, badgeLabel: e.target.value.toUpperCase() })}
                    className="w-16 px-2 py-0.5 bg-[#111214] border border-[#2b2d31] rounded-lg text-white font-mono text-center uppercase"
                  />
                )}
                <input
                  type="checkbox"
                  checked={config.hasCustomBadge}
                  onChange={(e) => setConfig({ ...config, hasCustomBadge: e.target.checked })}
                  className="w-4 h-4 accent-[#5865f2] rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1e1f22] border-t border-[#232428] flex items-center justify-between">
          <button
            onClick={() => handleSelectPreset(ICON_COLOR_PRESETS[0])}
            className="px-3.5 py-1.5 rounded-xl bg-[#232428] hover:bg-[#2b2d31] text-[#dbdee1] text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply to Patcher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
