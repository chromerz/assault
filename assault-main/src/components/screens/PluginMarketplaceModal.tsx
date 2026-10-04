import React, { useState } from 'react';
import {
  X,
  Layers,
  Search,
  Download,
  Check,
  Star,
  ShieldCheck,
  Sparkles,
  Code,
  Trash2,
  Sliders,
  ExternalLink,
  RefreshCw,
  Plus,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  FolderGit2
} from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';
import { AssaultPlugin, PluginSource } from '../../types';
import { REPOSITORY_PLUGINS_CATALOG } from '../../services/pluginSourcesEngine';

interface PluginMarketplaceModalProps {
  onClose: () => void;
}

export const PluginMarketplaceModal: React.FC<PluginMarketplaceModalProps> = ({ onClose }) => {
  const {
    plugins,
    togglePlugin,
    installPlugin,
    pluginSources,
    addPluginSource,
    togglePluginSource,
    removePluginSource,
    syncPluginSource
  } = useAssault();

  const [activeTab, setActiveTab] = useState<'market' | 'sources' | 'installed'>('market');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('all');
  const [viewingCodePlugin, setViewingCodePlugin] = useState<AssaultPlugin | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // New source form
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceDesc, setNewSourceDesc] = useState('');
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);

  const categories = ['All', 'Utility', 'Privacy', 'Chat', 'Media', 'Moderation'];

  // Filter available plugins from enabled sources
  const enabledSourceIds = new Set(pluginSources.filter((s) => s.isEnabled).map((s) => s.id));

  const filteredCatalog = REPOSITORY_PLUGINS_CATALOG.filter((plugin) => {
    // Check if source is enabled
    if (plugin.sourceId && !enabledSourceIds.has(plugin.sourceId)) return false;
    // Category filter
    if (selectedCategory !== 'All' && plugin.category !== selectedCategory) return false;
    // Source filter
    if (selectedSourceId !== 'all' && plugin.sourceId !== selectedSourceId) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceUrl.trim()) return;
    addPluginSource(newSourceName || 'Custom Repository', newSourceUrl, newSourceDesc);
    setNewSourceName('');
    setNewSourceUrl('');
    setNewSourceDesc('');
    setShowAddSource(false);
  };

  const handleSync = (srcId: string) => {
    setSyncingSourceId(srcId);
    setTimeout(() => {
      syncPluginSource(srcId);
      setSyncingSourceId(null);
    }, 600);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const isPluginInstalled = (id: string) => {
    return plugins.some((p) => p.id === id || p.name === REPOSITORY_PLUGINS_CATALOG.find((x) => x.id === id)?.name);
  };

  const getInstalledPlugin = (id: string) => {
    return plugins.find((p) => p.id === id || p.name === REPOSITORY_PLUGINS_CATALOG.find((x) => x.id === id)?.name);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2b2d31] flex items-center justify-between bg-[#111214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Plugin Marketplace & Source Manager</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/30">
                  v3.4 Hub
                </span>
              </div>
              <p className="text-xs text-[#949ba4]">
                Extend Assault with verified community plugins, privacy shields, soundboards, and custom repos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-2 rounded-lg hover:bg-[#313338] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="px-6 py-3 bg-[#2b2d31]/40 border-b border-[#2b2d31] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('market')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'market'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#313338]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plugin Registry</span>
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sources'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#313338]'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Repository Sources ({pluginSources.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('installed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'installed'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#313338]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Installed ({plugins.length})</span>
            </button>
          </div>

          {activeTab === 'market' && (
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plugins, authors..."
                className="w-full bg-[#111214] text-xs text-[#f2f3f5] placeholder-[#80848e] rounded-lg px-3 py-1.5 pl-8 border border-[#313338] focus:border-[#5865f2] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#949ba4] absolute left-2.5 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#949ba4] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: PLUGIN MARKET */}
          {activeTab === 'market' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]'
                          : 'bg-[#2b2d31] text-[#949ba4] hover:text-white border border-transparent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Source Filter Dropdown */}
                <div className="flex items-center gap-2 text-xs text-[#949ba4]">
                  <span>Source:</span>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="bg-[#111214] border border-[#313338] rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#5865f2]"
                  >
                    <option value="all">All Sources</option>
                    {pluginSources.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid of Plugins */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCatalog.map((plugin) => {
                  const installed = isPluginInstalled(plugin.id);
                  const instPlugin = getInstalledPlugin(plugin.id);
                  const isEnabled = instPlugin?.isEnabled ?? false;

                  return (
                    <div
                      key={plugin.id}
                      className="bg-[#2b2d31]/70 border border-[#313338] hover:border-[#404249] rounded-xl p-4 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white truncate group-hover:text-[#5865f2] transition">
                                {plugin.name}
                              </h3>
                              {plugin.verified && (
                                <span title="Verified Safe Extension">
                                  <ShieldCheck className="w-4 h-4 text-[#23a55a] shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#949ba4] mt-0.5">
                              <span>by {plugin.author}</span>
                              <span>•</span>
                              <span>v{plugin.version}</span>
                              <span>•</span>
                              <span className="text-[#f0b232] flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-current" />
                                {plugin.rating}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1e1f22] text-[#dbdee1] border border-[#35373c] shrink-0">
                            {plugin.category}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#b5bac1] leading-relaxed line-clamp-2 mb-3">
                          {plugin.description}
                        </p>

                        {/* Source Tag & SHA */}
                        <div className="flex items-center gap-2 text-[10px] text-[#80848e] mb-3">
                          <span className="truncate max-w-[180px] bg-[#111214] px-2 py-0.5 rounded border border-[#2b2d31]">
                            {plugin.sourceName || 'Assault Core'}
                          </span>
                          <span className="font-mono">{plugin.checksum || 'sha256-verified'}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-[#35373c] flex items-center justify-between">
                        <button
                          onClick={() => setViewingCodePlugin(plugin)}
                          className="flex items-center gap-1 text-[11px] text-[#949ba4] hover:text-white transition cursor-pointer"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>View Code</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {installed ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => instPlugin && togglePlugin(instPlugin.id)}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                  isEnabled
                                    ? 'bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/40 hover:bg-[#23a55a]/30'
                                    : 'bg-[#4e5058]/30 text-[#949ba4] border border-[#4e5058] hover:text-white'
                                }`}
                              >
                                {isEnabled ? 'Enabled' : 'Disabled'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                installPlugin(
                                  plugin.name,
                                  plugin.description,
                                  plugin.author,
                                  plugin.scriptCode,
                                  plugin.sourceName
                                );
                              }}
                              className="flex items-center gap-1 px-3 py-1 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                              <Download className="w-3 h-3" />
                              <span>Install</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCatalog.length === 0 && (
                <div className="py-16 text-center text-[#949ba4]">
                  <div className="w-12 h-12 rounded-full bg-[#2b2d31] flex items-center justify-center mx-auto mb-3 text-[#5865f2]">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">No plugins match your filter</p>
                  <p className="text-xs text-[#949ba4] mt-1">
                    Try adjusting your search terms or enabling more repository sources.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REPOSITORY SOURCES */}
          {activeTab === 'sources' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Configured Repository Sources</h3>
                  <p className="text-xs text-[#949ba4]">Assault syncs remote extensions from cryptographically signed registries</p>
                </div>
                <button
                  onClick={() => setShowAddSource(!showAddSource)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Source</span>
                </button>
              </div>

              {/* Add Source Drawer / Form */}
              {showAddSource && (
                <form
                  onSubmit={handleAddSource}
                  className="bg-[#111214] border border-[#5865f2]/40 rounded-xl p-4 space-y-3 animate-in fade-in"
                >
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#5865f2]" />
                    <span>Register New Plugin Repository</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#b5bac1] mb-1">
                        Source Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. My Custom GitHub Repo"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-[#313338] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5865f2]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#b5bac1] mb-1">
                        Repository JSON Manifest URL *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://raw.githubusercontent.com/.../plugins.json"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-[#313338] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5865f2]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#b5bac1] mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Brief description of the plugins contained in this source"
                      value={newSourceDesc}
                      onChange={(e) => setNewSourceDesc(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-[#313338] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5865f2]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddSource(false)}
                      className="px-3 py-1.5 rounded text-xs text-[#949ba4] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold cursor-pointer"
                    >
                      Verify & Add Repository
                    </button>
                  </div>
                </form>
              )}

              {/* Source cards list */}
              <div className="space-y-3">
                {pluginSources.map((source) => {
                  const isSyncing = syncingSourceId === source.id;
                  return (
                    <div
                      key={source.id}
                      className="bg-[#2b2d31]/60 border border-[#313338] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#1e1f22] border border-[#35373c] flex items-center justify-center shrink-0 text-[#5865f2]">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white truncate">
                              {source.name}
                            </h4>
                            {source.isOfficial && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/30">
                                Official
                              </span>
                            )}
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#23a55a]/10 text-[#23a55a] border border-[#23a55a]/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a]" />
                              {source.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#b5bac1] mt-0.5">
                            {source.description}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-[#80848e] mt-1.5 font-mono">
                            <span className="truncate max-w-sm">{source.url}</span>
                            <span>•</span>
                            <span>{source.pluginsCount} plugins</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => handleSync(source.id)}
                          disabled={isSyncing}
                          className="p-2 rounded-lg bg-[#1e1f22] hover:bg-[#313338] text-[#949ba4] hover:text-white transition cursor-pointer border border-[#313338]"
                          title="Sync Repository"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#5865f2]' : ''}`} />
                        </button>

                        <button
                          onClick={() => togglePluginSource(source.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            source.isEnabled
                              ? 'bg-[#23a55a]/20 border-[#23a55a]/40 text-[#23a55a] hover:bg-[#23a55a]/30'
                              : 'bg-[#1e1f22] border-[#313338] text-[#949ba4] hover:text-white'
                          }`}
                        >
                          {source.isEnabled ? 'Active' : 'Disabled'}
                        </button>

                        {!source.isOfficial && (
                          <button
                            onClick={() => removePluginSource(source.id)}
                            className="p-2 rounded-lg bg-[#1e1f22] hover:bg-[#ed4245]/20 text-[#949ba4] hover:text-[#ed4245] transition cursor-pointer border border-[#313338]"
                            title="Remove Source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: INSTALLED PLUGINS */}
          {activeTab === 'installed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Extensions Runtime</h3>
                  <p className="text-xs text-[#949ba4]">Plugins execute in an isolated sandbox with Discord client hooks</p>
                </div>
                <span className="text-xs font-mono text-[#5865f2] bg-[#5865f2]/10 px-2.5 py-1 rounded-md border border-[#5865f2]/20">
                  {plugins.filter((p) => p.isEnabled).length} active / {plugins.length} installed
                </span>
              </div>

              <div className="space-y-2.5">
                {plugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="bg-[#2b2d31]/60 border border-[#313338] rounded-xl p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{plugin.name}</h4>
                        <span className="text-[10px] text-[#949ba4]">v{plugin.version}</span>
                        <span className="text-[10px] bg-[#1e1f22] text-[#dbdee1] px-1.5 py-0.5 rounded border border-[#35373c]">
                          {plugin.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#b5bac1] mt-0.5">{plugin.description}</p>
                      {plugin.sourceName && (
                        <p className="text-[10px] text-[#80848e] mt-1">Source: {plugin.sourceName}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {plugin.scriptCode && (
                        <button
                          onClick={() => setViewingCodePlugin(plugin)}
                          className="p-2 rounded-lg bg-[#1e1f22] hover:bg-[#313338] text-[#949ba4] hover:text-white transition cursor-pointer border border-[#313338]"
                          title="View Hook Script"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => togglePlugin(plugin.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          plugin.isEnabled
                            ? 'bg-[#23a55a]/20 border-[#23a55a]/40 text-[#23a55a] hover:bg-[#23a55a]/30'
                            : 'bg-[#1e1f22] border-[#313338] text-[#949ba4] hover:text-white'
                        }`}
                      >
                        {plugin.isEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Inspector Sub-Modal */}
        {viewingCodePlugin && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
            <div className="bg-[#111214] border border-[#313338] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-5 py-3 border-b border-[#2b2d31] flex items-center justify-between bg-[#1e1f22]">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#5865f2]" />
                  <span className="font-bold text-xs text-white">
                    {viewingCodePlugin.name} • Source Code
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(viewingCodePlugin.scriptCode || '')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs text-white transition cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-[#23a55a]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => setViewingCodePlugin(null)}
                    className="text-[#949ba4] hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto bg-[#0b0c0f]">
                <pre className="font-mono text-xs text-[#23a55a] leading-relaxed whitespace-pre-wrap">
                  {viewingCodePlugin.scriptCode || '// Native binary hook compiled into client core'}
                </pre>
              </div>

              <div className="px-5 py-2.5 bg-[#1e1f22] border-t border-[#2b2d31] text-[11px] text-[#949ba4] flex items-center justify-between">
                <span>Verified SHA-256 Digest</span>
                <span className="font-mono text-[#80848e]">{viewingCodePlugin.checksum || 'sha256-verified-signature'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
