import React, { useState } from 'react';
import { X, Layers, Plus, Code, Check, ExternalLink } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';

interface CommunityPluginsModalProps {
  onClose: () => void;
}

export const CommunityPluginsModal: React.FC<CommunityPluginsModalProps> = ({ onClose }) => {
  const { plugins, togglePlugin, installPlugin } = useAssault();
  const [showInstallScript, setShowInstallScript] = useState(false);
  const [scriptName, setScriptName] = useState('');
  const [scriptDesc, setScriptDesc] = useState('');
  const [scriptAuthor, setScriptAuthor] = useState('');
  const [scriptCode, setScriptCode] = useState(`// Custom Assault Plugin Script Hook
assault.on('message', (msg) => {
  if (msg.content.includes('spoof')) {
    console.log('[PLUGIN] Hook fired on msg:', msg.id);
  }
});`);

  const handleInstall = () => {
    if (!scriptName.trim()) return;
    installPlugin(scriptName, scriptDesc || 'Custom community script hook', scriptAuthor || 'Local Developer', scriptCode);
    setShowInstallScript(false);
    setScriptName('');
    setScriptDesc('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#fee75c]" />
            <div>
              <h3 className="font-bold text-base text-white">Plugin Engine & Community Hooks</h3>
              <p className="text-xs text-[#949ba4]">Extend Assault with external JavaScript/TypeScript hooks and mods</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
              Installed Plugins ({plugins.length})
            </span>
            <button
              onClick={() => setShowInstallScript(!showInstallScript)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#fee75c] text-black text-xs font-bold hover:bg-[#ebd34f] transition cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Load Script Hook</span>
            </button>
          </div>

          {showInstallScript && (
            <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#fee75c] space-y-2">
              <h4 className="text-xs font-bold text-white">Install Custom Script Plugin</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Plugin Name (e.g. Auto-Translate)"
                  value={scriptName}
                  onChange={(e) => setScriptName(e.target.value)}
                  className="bg-[#1e1f22] text-xs p-2 rounded text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={scriptAuthor}
                  onChange={(e) => setScriptAuthor(e.target.value)}
                  className="bg-[#1e1f22] text-xs p-2 rounded text-white focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Description"
                value={scriptDesc}
                onChange={(e) => setScriptDesc(e.target.value)}
                className="w-full bg-[#1e1f22] text-xs p-2 rounded text-white focus:outline-none"
              />
              <textarea
                value={scriptCode}
                onChange={(e) => setScriptCode(e.target.value)}
                rows={4}
                className="w-full bg-[#0b0c0f] font-mono text-xs text-[#23a55a] p-2 rounded focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowInstallScript(false)}
                  className="px-3 py-1 text-xs text-[#949ba4] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInstall}
                  className="px-3 py-1 bg-[#fee75c] text-black text-xs font-bold rounded"
                >
                  Install & Run
                </button>
              </div>
            </div>
          )}

          {/* Plugins List */}
          <div className="space-y-2">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c] flex items-center justify-between"
              >
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{plugin.name}</span>
                    <span className="text-[10px] bg-[#1e1f22] text-[#949ba4] px-1.5 py-0.5 rounded">
                      v{plugin.version}
                    </span>
                    <span className="text-[10px] text-[#5865f2] font-medium">by {plugin.author}</span>
                  </div>
                  <p className="text-xs text-[#949ba4] mt-1">{plugin.description}</p>
                </div>

                <button
                  onClick={() => togglePlugin(plugin.id)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    plugin.isEnabled ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      plugin.isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#fee75c] text-black font-semibold text-xs hover:bg-[#ebd34f] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
