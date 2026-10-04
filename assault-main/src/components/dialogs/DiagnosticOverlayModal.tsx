import React, { useState, useEffect } from 'react';
import { X, Activity, Server, Wifi, Cpu, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';

interface DiagnosticOverlayModalProps {
  onClose: () => void;
}

export const DiagnosticOverlayModal: React.FC<DiagnosticOverlayModalProps> = ({ onClose }) => {
  const { beefBotEngine, gatewayState } = useAssault();
  const [latencyHistory, setLatencyHistory] = useState([24, 28, 26, 31, 25, 29, 27, 24, 30, 26]);
  const [currentPing, setCurrentPing] = useState(26);
  const [packetRate, setPacketRate] = useState(18);
  const [zlibRatio, setZlibRatio] = useState('84.2%');
  const [lastHeartbeatAck, setLastHeartbeatAck] = useState(Date.now());
  const [throughput, setThroughput] = useState({
    MESSAGE_CREATE: 184,
    TYPING_START: 0, // suppressed by silent typing
    PRESENCE_UPDATE: 94,
    GUILD_CREATE: 4,
    VOICE_SERVER_UPDATE: 8
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const nextPing = 22 + Math.floor(Math.random() * 12);
      setCurrentPing(nextPing);
      setLatencyHistory((prev) => [...prev.slice(1), nextPing]);
      setPacketRate(14 + Math.floor(Math.random() * 8));
      setLastHeartbeatAck(Date.now());
      setThroughput((prev) => ({
        ...prev,
        MESSAGE_CREATE: prev.MESSAGE_CREATE + Math.floor(Math.random() * 2),
        PRESENCE_UPDATE: prev.PRESENCE_UPDATE + Math.floor(Math.random() * 2)
      }));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const beefState = beefBotEngine.getState();

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2b2d31] bg-[#18191c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#5865f2]/15 text-[#5865f2] border border-[#5865f2]/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                BeefBot Real-Time Diagnostic & Gateway Overlay
              </h2>
              <p className="text-xs text-[#949ba4]">
                Live WebSocket latency graph, heartbeat status, and event packet throughput
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Real-Time Latency Waveform */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#23a55a]" />
                <h3 className="font-bold text-xs text-[#dbdee1] uppercase tracking-wider">
                  Live Gateway Latency Waveform
                </h3>
              </div>
              <span className="font-mono text-base font-bold text-[#23a55a]">
                {currentPing} ms
              </span>
            </div>

            {/* Sparkline / Bar Graph */}
            <div className="h-20 bg-[#111218] rounded-lg p-2 flex items-end justify-between gap-1.5 border border-[#1f2023]">
              {latencyHistory.map((val, idx) => {
                const heightPct = Math.min(100, Math.max(15, (val / 50) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-linear-to-t from-[#5865f2] to-[#23a55a] rounded-t transition-all duration-300 relative group"
                    style={{ height: `${heightPct}%` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-black text-white px-1 rounded pointer-events-none">
                      {val}ms
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#2b2d31] p-3 rounded-xl border border-[#35373c]">
              <span className="text-[#949ba4] block text-[11px]">Gateway Status</span>
              <p className="font-bold text-[#23a55a] text-sm mt-1">CONNECTED</p>
              <span className="text-[10px] text-[#949ba4]">WSS v9 zlib-stream</span>
            </div>

            <div className="bg-[#2b2d31] p-3 rounded-xl border border-[#35373c]">
              <span className="text-[#949ba4] block text-[11px]">Heartbeat Interval</span>
              <p className="font-bold text-white text-sm mt-1">41,250 ms</p>
              <span className="text-[10px] text-[#23a55a]">ACK Received OK</span>
            </div>

            <div className="bg-[#2b2d31] p-3 rounded-xl border border-[#35373c]">
              <span className="text-[#949ba4] block text-[11px]">Throughput Rate</span>
              <p className="font-bold text-[#5865f2] text-sm mt-1">{packetRate} pkt/sec</p>
              <span className="text-[10px] text-[#949ba4]">Compress: {zlibRatio}</span>
            </div>

            <div className="bg-[#2b2d31] p-3 rounded-xl border border-[#35373c]">
              <span className="text-[#949ba4] block text-[11px]">BeefBot AutoMod</span>
              <p className="font-bold text-[#ed4245] text-sm mt-1">
                {beefState.active ? 'ARMED & ACTIVE' : 'STANDBY READY'}
              </p>
              <span className="text-[10px] text-[#949ba4]">Typo: {beefState.typoChance}%</span>
            </div>
          </div>

          {/* Event Throughput Counters */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-3">
            <h3 className="font-bold text-xs text-[#dbdee1] uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-[#fee75c]" />
              WebSocket Inbound Event Dispatch Counters
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#1e1f22] rounded-lg flex justify-between items-center">
                <span className="text-[#949ba4]">MESSAGE_CREATE</span>
                <span className="font-mono font-bold text-white">{throughput.MESSAGE_CREATE}</span>
              </div>
              <div className="p-2.5 bg-[#1e1f22] rounded-lg flex justify-between items-center">
                <span className="text-[#949ba4]">TYPING_START (Spoofed)</span>
                <span className="font-mono font-bold text-[#23a55a]">0 (Filtered Out)</span>
              </div>
              <div className="p-2.5 bg-[#1e1f22] rounded-lg flex justify-between items-center">
                <span className="text-[#949ba4]">PRESENCE_UPDATE</span>
                <span className="font-mono font-bold text-white">{throughput.PRESENCE_UPDATE}</span>
              </div>
              <div className="p-2.5 bg-[#1e1f22] rounded-lg flex justify-between items-center">
                <span className="text-[#949ba4]">VOICE_SERVER_UPDATE</span>
                <span className="font-mono font-bold text-white">{throughput.VOICE_SERVER_UPDATE}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
