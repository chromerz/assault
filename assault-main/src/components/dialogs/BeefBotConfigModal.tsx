import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Terminal,
  Play,
  Send,
  Trash2,
  Plus,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';
import { BeefEscalationLevel } from '../../types';

interface BeefBotConfigModalProps {
  onClose: () => void;
}

export const BeefBotConfigModal: React.FC<BeefBotConfigModalProps> = ({ onClose }) => {
  const {
    beefBotConfig,
    toggleBeefBotRule,
    setBeefEscalation,
    addCustomCommand,
    toggleCustomCommand,
    deleteCustomCommand,
    clearBeefIncidents,
    beefBotEngine
  } = useAssault();

  const [activeTab, setActiveTab] = useState<'rules' | 'keywords' | 'commands' | 'terminal' | 'incidents'>('rules');
  const [terminalCmd, setTerminalCmd] = useState('');
  const [logs, setLogs] = useState(beefBotEngine.getLogs());
  const [beefState, setBeefState] = useState(beefBotEngine.getState());

  // Custom keywords filter state
  const [customKeywords, setCustomKeywords] = useState([
    { id: 'kw_1', word: 'free nitro', action: 'DELETE', enabled: true },
    { id: 'kw_2', word: 'steam gift', action: 'DELETE', enabled: true },
    { id: 'kw_3', word: 'afk check', action: 'ROAST', enabled: true },
    { id: 'kw_4', word: 'ez clap', action: 'ROAST', enabled: true },
    { id: 'kw_5', word: 'discord.gg/', action: 'WARN', enabled: true }
  ]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordAction, setNewKeywordAction] = useState<'DELETE' | 'ROAST' | 'WARN' | 'MUTE'>('DELETE');

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    setCustomKeywords((prev) => [
      ...prev,
      {
        id: `kw_${Date.now()}`,
        word: newKeyword.trim().toLowerCase(),
        action: newKeywordAction,
        enabled: true
      }
    ]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (id: string) => {
    setCustomKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  const handleToggleKeyword = (id: string) => {
    setCustomKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, enabled: !k.enabled } : k))
    );
  };

  // New command modal state
  const [showAddCmd, setShowAddCmd] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newPerm, setNewPerm] = useState('Everyone');

  useEffect(() => {
    const unsub = beefBotEngine.subscribe(() => {
      setLogs(beefBotEngine.getLogs());
      setBeefState(beefBotEngine.getState());
    });
    return unsub;
  }, [beefBotEngine]);

  const handleRunCommand = (cmdToRun?: string) => {
    const text = cmdToRun || terminalCmd;
    if (!text.trim()) return;
    beefBotEngine.executeCommand(text);
    if (!cmdToRun) setTerminalCmd('');
  };

  const handleSimulateAfk = () => {
    beefBotEngine.handleIncomingMessage(
      'sim_user_123',
      'TrollRaider',
      'afk check say "test" <@user_me_9981>',
      false,
      'user_me_9981'
    );
  };

  const handleCreateCmd = () => {
    if (!newTrigger.trim() || !newResponse.trim()) return;
    addCustomCommand(newTrigger.replace(/^\$/, ''), newResponse, newPerm);
    setNewTrigger('');
    setNewResponse('');
    setShowAddCmd(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥩</span>
            <div>
              <h3 className="font-bold text-base text-white">BeefBot AutoMod & Defense Suite</h3>
              <p className="text-xs text-[#949ba4]">Selfbot moderation daemon, AFK checks & automated anti-raid</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2b2d31] bg-[#18191c] px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 transition cursor-pointer border-b-2 ${
              activeTab === 'rules'
                ? 'border-[#ed4245] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            AutoMod Rules
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`px-4 py-2.5 transition cursor-pointer border-b-2 ${
              activeTab === 'keywords'
                ? 'border-[#ed4245] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            Keyword Filters ({customKeywords.length})
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-2.5 transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'border-[#ed4245] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive Terminal ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`px-4 py-2.5 transition cursor-pointer border-b-2 ${
              activeTab === 'commands'
                ? 'border-[#ed4245] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            Custom Commands ({beefBotConfig.customCommands.length})
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2.5 transition cursor-pointer border-b-2 ${
              activeTab === 'incidents'
                ? 'border-[#ed4245] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            Incident Log ({beefBotConfig.incidents.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Escalation Level Selector */}
              <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#35373c]">
                <label className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider block mb-2">
                  Auto-Roast Escalation Policy
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CHILL', 'MILD', 'RUTHLESS'] as BeefEscalationLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setBeefEscalation(level)}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        beefBotConfig.escalationLevel === level
                          ? 'bg-[#ed4245]/20 border-[#ed4245] text-white'
                          : 'bg-[#1e1f22] border-[#35373c] text-[#949ba4] hover:bg-[#35373c]'
                      }`}
                    >
                      <p className="font-bold text-xs capitalize">{level.toLowerCase()}</p>
                      <p className="text-[10px] text-[#949ba4] mt-0.5">
                        {level === 'CHILL' && 'Playful banter & sarcasm'}
                        {level === 'MILD' && 'Strict warnings & purges'}
                        {level === 'RUTHLESS' && 'Instant savage roast & counter-fire'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Protection Shield Toggles */}
              <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#35373c] space-y-3">
                <label className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider block">
                  Active Protection Shields
                </label>

                {[
                  { key: 'antiSpamEnabled', label: 'Anti-Spam Filter', desc: 'Auto rate-limits users sending >5 msgs in 3 seconds' },
                  { key: 'antiMassMentionEnabled', label: 'Mass Mention Shield', desc: 'Blocks unauthorized @everyone and pings >3 targets' },
                  { key: 'antiInviteLinksEnabled', label: 'Anti-Invite Stripper', desc: 'Automatically deletes discord.gg link spam' },
                  { key: 'antiToxicFilterEnabled', label: 'Anti-Toxic Word Shield', desc: 'Purges hate speech and hostile triggers' },
                  { key: 'antiCapsShieldEnabled', label: 'Caps Lock Shield', desc: 'Prevents excessive screaming in public channels' },
                  { key: 'autoRaidQuarantineEnabled', label: 'Raid Lockdown Protocol', desc: 'Instantly mutes new accounts during raid spikes' },
                  { key: 'autoRoastBeefMode', label: 'Beef Mode (Counter-Roasts)', desc: 'Answers insults with witty punchlines from the joke vault' }
                ].map((rule) => {
                  const isChecked = (beefBotConfig as any)[rule.key] ?? false;
                  return (
                    <div key={rule.key} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-semibold text-[#f2f3f5]">{rule.label}</p>
                        <p className="text-xs text-[#949ba4]">{rule.desc}</p>
                      </div>
                      <button
                        onClick={() => toggleBeefBotRule(rule.key, !isChecked)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          isChecked ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-4">
              {/* Add Keyword Box */}
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#ed4245]/40 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Add Blocked Keyword or Pattern
                  </h3>
                  <span className="text-[11px] text-[#949ba4]">Case-insensitive matching</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter word, phrase, or pattern (e.g. free nitro, scam, spam)..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1 bg-[#1e1f22] border border-[#35373c] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ed4245]"
                  />
                  <select
                    value={newKeywordAction}
                    onChange={(e) => setNewKeywordAction(e.target.value as any)}
                    className="bg-[#1e1f22] border border-[#35373c] rounded px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="DELETE">Action: Delete Message</option>
                    <option value="ROAST">Action: BeefBot Roast</option>
                    <option value="WARN">Action: Warn Member</option>
                    <option value="MUTE">Action: Mute / Timeout</option>
                  </select>
                  <button
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-[#ed4245] hover:bg-[#da373a] text-white text-xs font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Filter</span>
                  </button>
                </div>
              </div>

              {/* Active Keywords List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider block">
                  Active Filter Rules ({customKeywords.length})
                </label>

                {customKeywords.map((kw) => (
                  <div
                    key={kw.id}
                    className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-white bg-[#1e1f22] px-2.5 py-1 rounded border border-[#35373c]">
                        "{kw.word}"
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          kw.action === 'ROAST'
                            ? 'bg-[#ed4245]/20 text-[#ed4245]'
                            : kw.action === 'DELETE'
                            ? 'bg-[#fee75c]/20 text-[#fee75c]'
                            : kw.action === 'WARN'
                            ? 'bg-[#5865f2]/20 text-[#5865f2]'
                            : 'bg-[#80848e]/20 text-[#dbdee1]'
                        }`}
                      >
                        Action: {kw.action}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleKeyword(kw.id)}
                        className={`text-xs px-2 py-1 rounded font-bold transition cursor-pointer ${
                          kw.enabled ? 'bg-[#23a55a]/20 text-[#23a55a]' : 'bg-[#80848e]/20 text-[#80848e]'
                        }`}
                      >
                        {kw.enabled ? 'Active' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleRemoveKeyword(kw.id)}
                        className="p-1 text-[#ed4245] hover:bg-[#ed4245]/20 rounded cursor-pointer"
                        title="Remove keyword"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-3">
              {/* Quick Actions Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSimulateAfk}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ed4245]/20 hover:bg-[#ed4245]/30 text-xs font-bold text-[#ed4245] border border-[#ed4245]/40 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Simulate AFK Check</span>
                </button>

                <button
                  onClick={() => handleRunCommand('$status')}
                  className="px-2.5 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs font-medium text-[#dbdee1] transition cursor-pointer"
                >
                  $status
                </button>
                <button
                  onClick={() => handleRunCommand('$caps')}
                  className="px-2.5 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs font-medium text-[#dbdee1] transition cursor-pointer"
                >
                  $caps toggle
                </button>
                <button
                  onClick={() => handleRunCommand('$shuffle')}
                  className="px-2.5 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs font-medium text-[#dbdee1] transition cursor-pointer"
                >
                  $shuffle jokes
                </button>
                <button
                  onClick={() => handleRunCommand('$help')}
                  className="px-2.5 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs font-medium text-[#dbdee1] transition cursor-pointer"
                >
                  $help
                </button>
              </div>

              {/* Terminal Logs Window */}
              <div className="bg-[#0b0c0f] border border-[#2b2d31] rounded-lg p-3 font-mono text-xs text-[#23a55a] h-64 overflow-y-auto space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="leading-relaxed break-words">
                    <span className="text-[#80848e]">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{' '}
                    <span
                      className={`font-bold ${
                        log.sender === 'USER'
                          ? 'text-[#5865f2]'
                          : log.sender === 'SYSTEM'
                          ? 'text-[#f0b232]'
                          : 'text-[#ed4245]'
                      }`}
                    >
                      {log.sender}:
                    </span>{' '}
                    <span className={log.isCommand ? 'text-white' : 'text-[#f2f3f5]'}>
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Terminal Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter BeefBot command (e.g. $status, $typo 25, $r 🔥 @user, $help)..."
                  value={terminalCmd}
                  onChange={(e) => setTerminalCmd(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
                  className="flex-1 bg-[#0b0c0f] border border-[#2b2d31] rounded px-3 py-2 text-xs font-mono text-[#f2f3f5] focus:outline-none focus:border-[#ed4245]"
                />
                <button
                  onClick={() => handleRunCommand()}
                  className="px-4 py-2 bg-[#ed4245] hover:bg-[#da373a] text-white text-xs font-bold rounded flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#949ba4]">
                  Registered AutoMod Commands (Prefix: {beefBotConfig.commandPrefix})
                </span>
                <button
                  onClick={() => setShowAddCmd(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Command</span>
                </button>
              </div>

              {showAddCmd && (
                <div className="bg-[#2b2d31] p-3 rounded-lg border border-[#5865f2] space-y-2">
                  <h4 className="text-xs font-bold text-white">Create Custom Command</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Trigger (e.g. gg, rule1)"
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      className="bg-[#1e1f22] text-xs p-2 rounded text-white focus:outline-none"
                    />
                    <select
                      value={newPerm}
                      onChange={(e) => setNewPerm(e.target.value)}
                      className="bg-[#1e1f22] text-xs p-2 rounded text-white focus:outline-none"
                    >
                      <option value="Everyone">Everyone</option>
                      <option value="Mod">Mod Only</option>
                      <option value="Admin">Admin Only</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Response template (supports {user})"
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    className="w-full bg-[#1e1f22] text-xs p-2 rounded text-white focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddCmd(false)}
                      className="px-3 py-1 text-xs text-[#949ba4] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCmd}
                      className="px-3 py-1 bg-[#23a55a] text-white text-xs font-bold rounded"
                    >
                      Save Command
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {beefBotConfig.customCommands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#ed4245]">
                          ${cmd.trigger}
                        </span>
                        <span className="text-[10px] bg-[#1e1f22] px-1.5 py-0.5 rounded text-[#949ba4]">
                          {cmd.permissionLevel}
                        </span>
                        <span className="text-[10px] text-[#80848e]">
                          Used {cmd.usageCount} times
                        </span>
                      </div>
                      <p className="text-xs text-[#dbdee1] mt-1">{cmd.response}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCustomCommand(cmd.id)}
                        className={`text-xs px-2 py-1 rounded font-bold transition cursor-pointer ${
                          cmd.isEnabled
                            ? 'bg-[#23a55a]/20 text-[#23a55a]'
                            : 'bg-[#80848e]/20 text-[#80848e]'
                        }`}
                      >
                        {cmd.isEnabled ? 'Active' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => deleteCustomCommand(cmd.id)}
                        className="p-1 text-[#ed4245] hover:bg-[#ed4245]/20 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#949ba4]">
                  Total Violations Blocked: {beefBotConfig.totalViolationsBlocked}
                </span>
                <button
                  onClick={clearBeefIncidents}
                  className="flex items-center gap-1 text-xs text-[#ed4245] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Incidents</span>
                </button>
              </div>

              {beefBotConfig.incidents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#949ba4]">
                  No incidents logged. Server quiet.
                </div>
              ) : (
                beefBotConfig.incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="bg-[#2b2d31] p-3 rounded-lg border-l-4 border-[#ed4245] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#ed4245]" />
                        <span className="font-bold text-xs text-white">{inc.targetUser}</span>
                        <span className="text-[10px] text-[#949ba4]">
                          {new Date(inc.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#f2f3f5] mt-1 font-medium">{inc.ruleTriggered}</p>
                      <p className="text-[11px] text-[#23a55a] mt-0.5">{inc.actionTaken}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#ed4245] hover:bg-[#da373a] text-xs font-semibold text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
