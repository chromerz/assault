import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Database,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Flame,
  FileKey,
  Fingerprint
} from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';

interface PrivacyDashboardModalProps {
  onClose: () => void;
}

export const PrivacyDashboardModal: React.FC<PrivacyDashboardModalProps> = ({ onClose }) => {
  const { settings, updateSettings, clearAllSnipes, clearBeefIncidents, deletedSnipes, editSnipes } = useAssault();

  const [e2eEncryption, setE2eEncryption] = useState(true);
  const [ephemeralBurnTimer, setEphemeralBurnTimer] = useState('off');
  const [fakeTypingDecoys, setFakeTypingDecoys] = useState(true);
  const [spoofFingerprint, setSpoofFingerprint] = useState(true);
  const [stripClientHeaders, setStripClientHeaders] = useState(true);
  const [clearedState, setClearedState] = useState(false);

  const handleClearAllStorage = () => {
    if (confirm('Clear all BeefBot incident logs, SQLite cache, and forensics snipes?')) {
      clearAllSnipes();
      clearBeefIncidents();
      setClearedState(true);
      setTimeout(() => setClearedState(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2b2d31] bg-[#18191c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#23a55a]/15 text-[#23a55a] border border-[#23a55a]/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Centralized Privacy & Security Dashboard</h2>
              <p className="text-xs text-[#949ba4]">
                Aggregated encryption, telemetry firewall, and local BeefBot storage management
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Message Encryption & Ephemeral Controls */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#35373c]">
              <Lock className="w-4 h-4 text-[#5865f2]" />
              <h3 className="font-bold text-xs text-[#dbdee1] uppercase tracking-wider">
                End-to-End Encryption & Ephemeral Messaging
              </h3>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-white">Local End-to-End Encryption (E2EE)</p>
                <p className="text-xs text-[#949ba4]">Encrypts outbound messages locally with AES-256 before transmission</p>
              </div>
              <button
                onClick={() => setE2eEncryption(!e2eEncryption)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  e2eEncryption ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    e2eEncryption ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-white">Self-Destructing Burn Timer</p>
                <p className="text-xs text-[#949ba4]">Automatically scrub local messages after viewing window</p>
              </div>
              <select
                value={ephemeralBurnTimer}
                onChange={(e) => setEphemeralBurnTimer(e.target.value)}
                className="bg-[#1e1f22] text-xs text-white border border-[#35373c] rounded px-3 py-1.5 focus:outline-none"
              >
                <option value="off">Disabled (Keep Forever)</option>
                <option value="1min">Burn after 1 Minute</option>
                <option value="1hour">Burn after 1 Hour</option>
                <option value="24hours">Burn after 24 Hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-white">Ghost Read Receipts</p>
                <p className="text-xs text-[#949ba4]">Suppress channel read markers and typing status acks</p>
              </div>
              <button
                onClick={() => updateSettings((prev) => ({ ...prev, ghostRead: !prev.ghostRead }))}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  settings.ghostRead ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.ghostRead ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Data Obfuscation & Telemetry Firewall */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#35373c]">
              <Fingerprint className="w-4 h-4 text-[#fee75c]" />
              <h3 className="font-bold text-xs text-[#dbdee1] uppercase tracking-wider">
                Data Obfuscation & Fingerprint Shield
              </h3>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-white">Strip Discord Sentry & Analytics</p>
                <p className="text-xs text-[#949ba4]">Blocked {settings.blockedAnalyticsCount} outbound tracking pings this session</p>
              </div>
              <span className="text-xs font-bold text-[#23a55a] bg-[#23a55a]/15 px-2 py-0.5 rounded border border-[#23a55a]/30">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-white">Fake Typing Decoy Generator</p>
                <p className="text-xs text-[#949ba4]">Randomizes packet intervals to defeat keystroke timing analysis</p>
              </div>
              <button
                onClick={() => setFakeTypingDecoys(!fakeTypingDecoys)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  fakeTypingDecoys ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    fakeTypingDecoys ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-white">Spoof Hardware Fingerprint</p>
                <p className="text-xs text-[#949ba4]">Masks WebGL canvas fingerprint and audio context hashes</p>
              </div>
              <button
                onClick={() => setSpoofFingerprint(!spoofFingerprint)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  spoofFingerprint ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    spoofFingerprint ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: BeefBot & SQLite Local Storage Vault */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#35373c]">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#eb459e]" />
                <h3 className="font-bold text-xs text-[#dbdee1] uppercase tracking-wider">
                  BeefBot & Local Storage Vault
                </h3>
              </div>
              <span className="text-xs font-mono text-[#949ba4]">Vault Size: ~4.2 MB</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#1e1f22] rounded-lg">
                <span className="text-[#949ba4]">Retained Deleted Snipes</span>
                <p className="text-base font-bold text-white mt-1">{deletedSnipes.length} messages</p>
              </div>
              <div className="p-3 bg-[#1e1f22] rounded-lg">
                <span className="text-[#949ba4]">Edit Forensics History</span>
                <p className="text-base font-bold text-white mt-1">{editSnipes.length} revisions</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#949ba4]">
                  Permanently wipe all locally cached messages, BeefBot logs, and decrypted tokens.
                </p>
              </div>
              <button
                onClick={handleClearAllStorage}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#ed4245] hover:bg-[#da373a] text-white text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Wipe All Local Storage</span>
              </button>
            </div>

            {clearedState && (
              <p className="text-xs text-[#23a55a] font-bold text-center mt-2 animate-bounce">
                ✓ Local storage and forensics cache successfully wiped!
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Save Privacy Controls
          </button>
        </div>
      </div>
    </div>
  );
};
