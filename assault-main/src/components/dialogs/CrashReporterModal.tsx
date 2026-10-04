import React, { useState } from 'react';
import { DiagnosticErrorReport } from '../../types';
import {
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Terminal,
  Cpu,
  X
} from 'lucide-react';

interface CrashReporterModalProps {
  errorReport?: DiagnosticErrorReport | null;
  onClose: () => void;
  onEnterSafeMode: () => void;
}

export const CrashReporterModal: React.FC<CrashReporterModalProps> = ({
  errorReport,
  onClose,
  onEnterSafeMode
}) => {
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(true);
  const [showComponentStack, setShowComponentStack] = useState(false);

  const sampleReport: DiagnosticErrorReport = errorReport || {
    id: `diag_${Date.now()}`,
    timestamp: Date.now(),
    message: 'React Fiber Scheduler encountered an uncaught runtime exception in messageList.render()',
    componentStack: `    in ChatView (at App.tsx:184)\n    in DiscordMobileView (at App.tsx:210)\n    in AssaultAppContent (at App.tsx:92)\n    in AssaultProvider (at App.tsx:64)`,
    stackFrames: [
      {
        functionName: 'renderMessageRow',
        fileName: 'src/components/ChatView.tsx',
        lineNumber: 412,
        columnNumber: 18
      },
      {
        functionName: 'Array.map',
        fileName: '<anonymous>',
        lineNumber: 0,
        columnNumber: 0
      },
      {
        functionName: 'performConcurrentWorkOnRoot',
        fileName: 'node_modules/react-dom/client.js',
        lineNumber: 1942,
        columnNumber: 24
      }
    ],
    culpritAddon: 'plugin_notrack',
    safeModeOffered: true,
    deviceInfo: {
      platform: 'Linux x86_64 / Android 14 Emulated',
      userAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      memoryMb: 4096
    }
  };

  const copyDiagnosticJson = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#111214] border border-[#f23f43]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#f23f43]/10 border-b border-[#f23f43]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f23f43]/20 flex items-center justify-center text-[#f23f43] border border-[#f23f43]/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Diagnostic Crash Reporter
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f23f43]/20 text-[#f23f43] border border-[#f23f43]/40">
                  RECOVERED
                </span>
              </h2>
              <p className="text-xs text-[#949ba4]">
                The client error boundary intercepted an unhandled runtime exception
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
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Error Message banner */}
          <div className="p-3.5 rounded-xl bg-[#1e1f22] border border-[#2b2d31] space-y-1.5">
            <span className="text-[11px] font-semibold text-[#f23f43] uppercase tracking-wider">
              Exception Message
            </span>
            <p className="text-sm font-mono text-white break-words">
              {sampleReport.message}
            </p>
          </div>

          {/* Culprit Addon Analysis */}
          <div className="p-3.5 rounded-xl bg-[#2b2d31]/50 border border-[#35373c] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#f0b232]" />
              <div>
                <span className="text-white font-semibold">Probable Addon Cause:</span>
                <span className="ml-1.5 font-mono text-[#f0b232] bg-[#f0b232]/10 px-2 py-0.5 rounded border border-[#f0b232]/20">
                  {sampleReport.culpritAddon || 'Core UI Engine'}
                </span>
              </div>
            </div>
            <button
              onClick={onEnterSafeMode}
              className="px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Safe Mode Boot
            </button>
          </div>

          {/* Stack trace accordion */}
          <div className="border border-[#2b2d31] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowStack(!showStack)}
              className="w-full px-3.5 py-2.5 bg-[#1e1f22] flex items-center justify-between text-left text-[#dbdee1] font-semibold hover:bg-[#232428] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#5865f2]" />
                Parsed JavaScript Stack ({sampleReport.stackFrames.length} frames)
              </span>
              {showStack ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showStack && (
              <div className="p-3 bg-[#0d0e10] font-mono text-[11px] text-[#dbdee1] space-y-1.5 overflow-x-auto max-h-48 border-t border-[#2b2d31]">
                {sampleReport.stackFrames.map((frame, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#949ba4] select-none">{idx + 1}.</span>
                    <div>
                      <span className="text-[#f23f43] font-semibold">{frame.functionName}</span>
                      <span className="text-[#949ba4] ml-1.5">
                        at {frame.fileName}:{frame.lineNumber}:{frame.columnNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Component stack accordion */}
          {sampleReport.componentStack && (
            <div className="border border-[#2b2d31] rounded-xl overflow-hidden">
              <button
                onClick={() => setShowComponentStack(!showComponentStack)}
                className="w-full px-3.5 py-2.5 bg-[#1e1f22] flex items-center justify-between text-left text-[#dbdee1] font-semibold hover:bg-[#232428] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#57f287]" />
                  React Component Tree Hierarchy
                </span>
                {showComponentStack ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showComponentStack && (
                <div className="p-3 bg-[#0d0e10] font-mono text-[11px] text-[#949ba4] whitespace-pre overflow-x-auto max-h-36 border-t border-[#2b2d31]">
                  {sampleReport.componentStack}
                </div>
              )}
            </div>
          )}

          {/* Environment details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#949ba4] bg-[#1e1f22]/40 p-3 rounded-xl border border-[#2b2d31]">
            <div>Platform: <span className="text-white">{sampleReport.deviceInfo.platform}</span></div>
            <div>Viewport: <span className="text-white">{sampleReport.deviceInfo.screenResolution}</span></div>
            <div className="col-span-2 truncate">
              User-Agent: <span className="text-white">{sampleReport.deviceInfo.userAgent}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1e1f22] border-t border-[#2b2d31] flex items-center justify-between">
          <button
            onClick={copyDiagnosticJson}
            className="px-3 py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-white font-medium text-xs flex items-center gap-1.5 transition-colors border border-white/5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#57f287]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied JSON' : 'Copy Full Report'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-white font-medium text-xs transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium text-xs transition-colors shadow-sm"
            >
              Reload Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
