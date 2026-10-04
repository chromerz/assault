import React, { useState, useEffect } from 'react';
import { X, Activity, Server, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';

interface PerformanceMonitorModalProps {
  onClose: () => void;
}

export const PerformanceMonitorModal: React.FC<PerformanceMonitorModalProps> = ({ onClose }) => {
  const { plugins } = useAssault();
  const [ping, setPing] = useState(28);
  const [packetRate, setPacketRate] = useState(14);
  const [bytesIn, setBytesIn] = useState(1842000);
  const [eventsCount, setEventsCount] = useState({
    MESSAGE_CREATE: 184,
    PRESENCE_UPDATE: 92,
    TYPING_START: 0, // 0 because silent typing strips this!
    VOICE_STATE_UPDATE: 12
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setPing(24 + Math.floor(Math.random() * 8));
      setPacketRate(10 + Math.floor(Math.random() * 8));
      setBytesIn((prev) => prev + Math.floor(Math.random() * 1200));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const [reconnecting, setReconnecting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#5865f2]" />
            <h3 className="font-bold text-base text-white">Gateway & Throughput Monitor</h3>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c]">
              <span className="text-[11px] text-[#949ba4] font-medium">Gateway Ping</span>
              <p className="text-xl font-bold text-[#23a55a] mt-1">{ping} ms</p>
              <span className="text-[10px] text-[#23a55a] flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Excellent
              </span>
            </div>

            <div className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c]">
              <span className="text-[11px] text-[#949ba4] font-medium">Packet Rate</span>
              <p className="text-xl font-bold text-[#5865f2] mt-1">{packetRate} pkt/s</p>
              <span className="text-[10px] text-[#949ba4] mt-0.5">Zlib Decoded</span>
            </div>

            <div className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c]">
              <span className="text-[11px] text-[#949ba4] font-medium">Telemetry Blocked</span>
              <p className="text-xl font-bold text-[#fee75c] mt-1">4,182 req</p>
              <span className="text-[10px] text-[#fee75c] mt-0.5">Sentry & Analytics</span>
            </div>

            <div className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c]">
              <span className="text-[11px] text-[#949ba4] font-medium">Session Ingest</span>
              <p className="text-xl font-bold text-[#eb459e] mt-1">
                {(bytesIn / 1024 / 1024).toFixed(2)} MB
              </p>
              <span className="text-[10px] text-[#949ba4] mt-0.5">Encrypted Cache</span>
            </div>
          </div>

          {/* Gateway Events Breakdown */}
          <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#35373c]">
            <h4 className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#5865f2]" />
              Dispatched Gateway Events (v9 WebSocket)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between p-2 bg-[#1e1f22] rounded">
                <span className="text-[#949ba4]">MESSAGE_CREATE</span>
                <span className="font-mono font-bold text-white">{eventsCount.MESSAGE_CREATE}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#1e1f22] rounded">
                <span className="text-[#949ba4]">PRESENCE_UPDATE</span>
                <span className="font-mono font-bold text-white">{eventsCount.PRESENCE_UPDATE}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#1e1f22] rounded">
                <span className="text-[#949ba4]">TYPING_START</span>
                <span className="font-mono font-bold text-[#23a55a]">0 (Filtered by Assault)</span>
              </div>
              <div className="flex justify-between p-2 bg-[#1e1f22] rounded">
                <span className="text-[#949ba4]">VOICE_STATE_UPDATE</span>
                <span className="font-mono font-bold text-white">{eventsCount.VOICE_STATE_UPDATE}</span>
              </div>
            </div>
          </div>

          {/* Active Plugins Memory Breakdown */}
          <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#35373c]">
            <h4 className="text-xs font-bold text-[#dbdee1] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#fee75c]" />
              Active Plugins & Memory Allocation
            </h4>
            <div className="space-y-2">
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-[#35373c]/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        plugin.isEnabled ? 'bg-[#23a55a]' : 'bg-[#80848e]'
                      }`}
                    />
                    <span className="font-medium text-[#dbdee1]">{plugin.name}</span>
                    <span className="text-[10px] text-[#949ba4]">v{plugin.version}</span>
                  </div>
                  <span className="font-mono text-[#949ba4]">
                    {plugin.isEnabled ? `${(Math.random() * 3 + 1.2).toFixed(1)} MB` : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-between items-center">
          <button
            onClick={() => {
              setReconnecting(true);
              setTimeout(() => {
                setPing(18);
                setReconnecting(false);
              }, 800);
            }}
            disabled={reconnecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin text-[#5865f2]' : ''}`} />
            <span>{reconnecting ? 'Reconnecting Gateway...' : 'Reconnect Gateway'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-xs font-semibold text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
