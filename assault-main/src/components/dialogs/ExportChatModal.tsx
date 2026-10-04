import React, { useState } from 'react';
import { X, Download, FileText, Check } from 'lucide-react';
import { useAssault } from '../../context/AssaultContext';
import { ChatExportUtility } from '../../services/chatExportUtility';

interface ExportChatModalProps {
  onClose: () => void;
}

export const ExportChatModal: React.FC<ExportChatModalProps> = ({ onClose }) => {
  const { activeGuild, activeChannel, filteredMessages } = useAssault();
  const [includeDeleted, setIncludeDeleted] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = () => {
    const msgsToExport = includeDeleted
      ? filteredMessages
      : filteredMessages.filter((m) => !m.isDeleted);

    const html = ChatExportUtility.generateHtmlExport(
      activeGuild?.name || 'Direct Messages',
      activeChannel?.name || 'chat',
      msgsToExport
    );

    ChatExportUtility.triggerDownload(
      `Assault_Backup_${activeChannel?.name || 'chat'}.html`,
      html
    );

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5865f2]" />
            <h3 className="font-bold text-base text-white">Export Offline Chat Backup</h3>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-[#dbdee1]">
          <p>
            Export all messages in <strong className="text-white">#{activeChannel?.name || 'chat'}</strong> into a standalone, styled HTML file readable in any web browser without internet access.
          </p>

          <div className="p-3 bg-[#2b2d31] rounded-lg border border-[#35373c] space-y-2">
            <div className="flex justify-between text-[#949ba4]">
              <span>Total Messages:</span>
              <span className="font-bold text-white">{filteredMessages.length}</span>
            </div>
            <div className="flex justify-between text-[#949ba4]">
              <span>Retained Deleted Messages:</span>
              <span className="font-bold text-[#ed4245]">
                {filteredMessages.filter((m) => m.isDeleted).length}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="rounded"
            />
            <span>Include Anti-Delete retained forensic messages</span>
          </label>
        </div>

        <div className="p-4 bg-[#18191c] border-t border-[#2b2d31] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download HTML File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
