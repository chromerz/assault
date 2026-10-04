import React, { useState } from 'react';
import { X, KeyRound, Check, Plus, User, Bot, Loader2, Radio } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';

interface TokenSwitcherModalProps {
  onClose: () => void;
}

export const TokenSwitcherModal: React.FC<TokenSwitcherModalProps> = ({ onClose }) => {
  const { accounts, switchAccount, connectToken, gatewayStatus } = useAssault();
  const [tokenInput, setTokenInput] = useState('');
  const [isBotToken, setIsBotToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const handleAdd = async () => {
    if (!tokenInput.trim() || isConnecting) return;
    setIsConnecting(true);
    setFeedback({ text: 'Authenticating with Discord Gateway v10...' });
    const success = await connectToken(tokenInput, isBotToken);
    setIsConnecting(false);
    if (success) {
      setFeedback({ text: 'Connected! Synced profile, guilds, and channels.' });
      setTokenInput('');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setFeedback({
        text: gatewayStatus.error || 'Invalid token or Gateway connection failed.',
        error: true
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#23a55a]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Discord Account & Token Switcher</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  gatewayStatus.connected
                    ? 'bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/40'
                    : gatewayStatus.connecting
                    ? 'bg-[#f0b232]/20 text-[#f0b232] border border-[#f0b232]/40'
                    : 'bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/40'
                }`}>
                  <Radio className="w-2.5 h-2.5" />
                  {gatewayStatus.connected
                    ? `Live (${gatewayStatus.ping}ms)`
                    : gatewayStatus.connecting
                    ? 'Connecting'
                    : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-[#949ba4]">Switch between user accounts, verify bots, or connect your real token</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Active / Saved Accounts */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider block">
              Saved Accounts ({accounts.length})
            </label>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => switchAccount(acc.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                  acc.isActive
                    ? 'bg-[#23a55a]/15 border-[#23a55a]'
                    : 'bg-[#2b2d31] border-[#35373c] hover:bg-[#35373c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={acc.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt={acc.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{acc.username}</span>
                      {acc.isBot ? (
                        <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 rounded uppercase">
                          BOT
                        </span>
                      ) : (
                        <span className="bg-[#23a55a] text-white text-[9px] font-bold px-1 rounded uppercase">
                          USER
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-[#949ba4]">
                      {acc.token.slice(0, 12)}••••••••
                    </span>
                  </div>
                </div>

                {acc.isActive && (
                  <span className="text-xs font-bold text-[#23a55a] flex items-center gap-1">
                    <Check className="w-4 h-4" /> Active
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Connect New Token */}
          <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#35373c] space-y-3">
            <label className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider block">
              Inject Discord Token
            </label>
            <input
              type="password"
              placeholder="Paste user or bot token here..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-[#1e1f22] border border-[#35373c] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#23a55a]"
            />

            {feedback && (
              <div className={`p-2.5 rounded text-xs font-medium ${
                feedback.error
                  ? 'bg-[#ed4245]/20 text-[#ed4245] border border-[#ed4245]/40'
                  : 'bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/40'
              }`}>
                {feedback.text}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[#dbdee1] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBotToken}
                  onChange={(e) => setIsBotToken(e.target.checked)}
                  className="rounded"
                />
                <span>Prefix with "Bot " (Bot Token)</span>
              </label>

              <button
                onClick={handleAdd}
                disabled={isConnecting}
                className="px-3.5 py-1.5 bg-[#23a55a] hover:bg-[#1f9250] disabled:opacity-50 text-white text-xs font-bold rounded flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                {isConnecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{isConnecting ? 'Verifying...' : 'Inject & Connect'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#23a55a] text-white font-semibold text-xs hover:bg-[#1f9250] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
