import React, { useState, useMemo } from 'react';
import { FileText, Download, Copy, Eye, Code, Search, Check, Sparkles, AlertTriangle, ExternalLink, Terminal, Shield, RefreshCw } from 'lucide-react';

interface SampleAttachment {
  filename: string;
  url?: string;
  size?: string;
}

interface SampleEdit {
  editedAt: string;
  content: string;
}

interface SampleMessage {
  id: string;
  author: {
    username: string;
    avatar?: string;
    role?: string;
    bot?: boolean;
  };
  timestamp: string;
  content: string;
  deleted?: boolean;
  ghost_ping?: boolean;
  edits: SampleEdit[];
  attachments: SampleAttachment[];
  channel: string;
}

const SAMPLE_DATASETS: Record<string, SampleMessage[]> = {
  general: [
    {
      id: 'msg-1',
      author: { username: 'dgrondin', role: 'Maintainer' },
      timestamp: 'Today at 10:14 AM',
      content: 'Just deployed the new Assault v2.8.0 APK build to the release channel. Targets Android 16 SDK 36.',
      edits: [],
      attachments: [],
      channel: 'general-discussion',
    },
    {
      id: 'msg-2',
      author: { username: 'krypton_dev', role: 'Core Contributor' },
      timestamp: 'Today at 10:18 AM',
      content: 'Did you include the new AMOLED pure black #000000 theme hook in this release?',
      edits: [],
      attachments: [],
      channel: 'general-discussion',
    },
    {
      id: 'msg-3',
      author: { username: 'dgrondin', role: 'Maintainer' },
      timestamp: 'Today at 10:20 AM',
      content: 'Yes! Both AMOLED #000000 mode and the D3 battery optimization monitor are live now.',
      edits: [
        {
          editedAt: 'Today at 10:19 AM',
          content: 'Yes! AMOLED #000000 mode is live now.',
        }
      ],
      attachments: [
        { filename: 'assault-manager-v2.8.0.apk', url: '/releases/Assault-Manager.apk', size: '14.0 MB' }
      ],
      channel: 'general-discussion',
    },
    {
      id: 'msg-4',
      author: { username: 'shadow_user', role: 'Member' },
      timestamp: 'Today at 10:25 AM',
      content: 'Hey @dgrondin did anyone see that leaked internal testing token? Wait let me delete this quickly',
      deleted: true,
      ghost_ping: true,
      edits: [],
      attachments: [],
      channel: 'general-discussion',
    },
    {
      id: 'msg-5',
      author: { username: 'BeefBot', role: 'AutoMod', bot: true },
      timestamp: 'Today at 10:25 AM',
      content: '⚠️ Ghost Ping Detected: @shadow_user pinged @dgrondin and immediately purged the message. Captured and preserved by Assault Anti-Delete engine.',
      edits: [],
      attachments: [],
      channel: 'general-discussion',
    },
    {
      id: 'msg-6',
      author: { username: 'krypton_dev', role: 'Core Contributor' },
      timestamp: 'Today at 10:27 AM',
      content: 'Good thing Assault captures everything locally before Discord gateway purges it.',
      edits: [],
      attachments: [],
      channel: 'general-discussion',
    },
  ],
  dev: [
    {
      id: 'dev-1',
      author: { username: 'dgrondin', role: 'Maintainer' },
      timestamp: 'Yesterday at 4:32 PM',
      content: 'Testing Xposed v100 bytecode injection on Android 16 QPR1 emulator. Hook latency averages 1.2ms.',
      edits: [],
      attachments: [],
      channel: 'dev-announcements',
    },
    {
      id: 'dev-2',
      author: { username: 'lsposed_lead', role: 'Engineer' },
      timestamp: 'Yesterday at 5:10 PM',
      content: 'The DexClassLoader patch avoids the ART verification penalty entirely.',
      edits: [
        { editedAt: 'Yesterday at 5:04 PM', content: 'Testing DexClassLoader patch.' }
      ],
      attachments: [
        { filename: 'benchmark_art_opt.json', url: '#', size: '4.2 KB' }
      ],
      channel: 'dev-announcements',
    },
    {
      id: 'dev-3',
      author: { username: 'tester_09', role: 'QA' },
      timestamp: 'Yesterday at 6:44 PM',
      content: 'Message deleted during sync test.',
      deleted: true,
      edits: [],
      attachments: [],
      channel: 'dev-announcements',
    }
  ]
};

// Generate standalone HTML string matching Assault's __ASSAULT_HTML_EXPORT__
function generateHtmlExport(messages: SampleMessage[], channelName: string): string {
  const escape = (val: string) =>
    String(val ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

  const body = messages.map(m => {
    const editsHtml = m.edits.length
      ? `<details><summary>Edit history (${m.edits.length})</summary>${m.edits
          .map(e => `<p><time>${escape(e.editedAt)}</time></p><div class="content">${escape(e.content)}</div>`)
          .join('')}</details>`
      : '';

    const attachmentsHtml = m.attachments.length
      ? `<ul>${m.attachments
          .map(a => `<li><a href="${escape(a.url || '#')}" rel="noreferrer noopener" target="_blank">Attachment: ${escape(a.filename)}</a>${a.size ? ` (${escape(a.size)})` : ''}</li>`)
          .join('')}</ul>`
      : '';

    return `<article${m.deleted ? ' class="deleted"' : ''}>
  <header>
    <b>${escape(m.author.username)}</b>
    ${m.author.role ? `<span class="badge">${escape(m.author.role)}</span>` : ''}
    <time>${escape(m.timestamp)}</time>
    ${m.deleted ? ' <strong>Deleted</strong>' : ''}
    ${m.ghost_ping ? ' <span class="ghost">Ghost Ping</span>' : ''}
  </header>
  <div class="content">${escape(m.content)}</div>
  ${editsHtml}
  ${attachmentsHtml}
</article>`;
  }).join('\n');

  const target = channelName === 'all' ? 'All channels (Unified Archive)' : `Channel #${escape(channelName)}`;
  const dateStr = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>Assault · ${escape(target)}</title>
  <style>
    body {
      font: 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #101014;
      color: #eaf0f7;
      max-width: 900px;
      margin: auto;
      padding: 32px 20px;
      line-height: 1.6;
    }
    header h1 {
      font-size: 26px;
      margin: 0 0 6px 0;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .meta-subtitle {
      color: #8da1b5;
      font-size: 13px;
      margin-bottom: 24px;
      border-bottom: 1px solid #232c38;
      padding-bottom: 14px;
    }
    article {
      background: #1c1d24;
      border: 1px solid #282a36;
      border-radius: 12px;
      padding: 16px 18px;
      margin: 14px 0;
      transition: border-color 0.2s;
    }
    article:hover {
      border-color: #3d4154;
    }
    article header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 13px;
    }
    article header b {
      color: #fff;
      font-size: 14px;
    }
    .badge {
      background: #2b3345;
      color: #8bb2ff;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
    }
    time {
      color: #798799;
      font-size: 0.85em;
    }
    .deleted {
      border-left: 4px solid #ff6370;
      background: #21161b;
    }
    .deleted strong {
      color: #ff6370;
      background: #421820;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      text-transform: uppercase;
    }
    .ghost {
      background: #501625;
      color: #ff8a98;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid #7d2538;
    }
    .content {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      margin-top: 10px;
      color: #dbe4ef;
    }
    a {
      color: #70b1ff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    details {
      margin-top: 12px;
      background: #15161c;
      border: 1px solid #232530;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12px;
    }
    summary {
      cursor: pointer;
      color: #9eb1c7;
      font-weight: 600;
      user-select: none;
    }
    summary:hover {
      color: #ff6471;
    }
    ul {
      margin: 12px 0 0;
      padding-left: 20px;
      font-size: 12px;
      color: #92a4b8;
    }
    .footer-stamp {
      text-align: center;
      margin-top: 40px;
      font-size: 11px;
      color: #556677;
    }
  </style>
</head>
<body>
  <header>
    <h1>⚡ Assault Chat Transcript</h1>
    <div class="meta-subtitle">${escape(target)} · ${messages.length} captured messages · Exported on ${escape(dateStr)}</div>
  </header>
  <main>
    ${body || '<p>No captured messages.</p>'}
  </main>
  <div class="footer-stamp">
    Exported with Assault Manager · Standalone offline format · No external scripts or fonts
  </div>
</body>
</html>`;
}

interface PreviewExportProps {
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
}

export function PreviewExport({ onLog }: PreviewExportProps) {
  const [selectedChannel, setSelectedChannel] = useState<'general' | 'dev' | 'all'>('general');
  const [viewMode, setViewMode] = useState<'layout' | 'code'>('layout');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Active messages based on channel
  const rawMessages = useMemo(() => {
    if (selectedChannel === 'all') {
      return [...SAMPLE_DATASETS.general, ...SAMPLE_DATASETS.dev];
    }
    return SAMPLE_DATASETS[selectedChannel] || SAMPLE_DATASETS.general;
  }, [selectedChannel]);

  // Filtered by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return rawMessages;
    const q = searchQuery.toLowerCase();
    return rawMessages.filter(
      m =>
        m.content.toLowerCase().includes(q) ||
        m.author.username.toLowerCase().includes(q) ||
        m.edits.some(e => e.content.toLowerCase().includes(q))
    );
  }, [rawMessages, searchQuery]);

  const channelTitle = selectedChannel === 'all' ? 'all' : selectedChannel === 'general' ? 'general-discussion' : 'dev-announcements';
  const fullHtmlCode = useMemo(() => {
    return generateHtmlExport(filteredMessages, channelTitle);
  }, [filteredMessages, channelTitle]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(fullHtmlCode);
      setCopied(true);
      onLog?.('Copied full HTML transcript markup to clipboard', 'info', 'EXPORT');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([fullHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assault-transcript-${channelTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onLog?.(`Saved HTML transcript: assault-transcript-${channelTitle}.html`, 'success', 'EXPORT');
  };

  const handleRunSimulatedExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);
    onLog?.(`Executed client command: /assault export channel:#${channelTitle}`, 'info', 'COMMAND');

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      onLog?.(
        `Export finished: ${filteredMessages.length} messages archived to /sdcard/Download/Assault-Transcripts/`,
        'success',
        'EXPORT'
      );
      setTimeout(() => setExportSuccess(false), 4000);
    }, 1200);
  };

  return (
    <section className="preview-export-card" id="export" role="region" aria-label="Sample HTML Transcript Previewer">
      <div className="preview-header">
        <div className="preview-title-group">
          <div className="preview-icon-badge">
            <FileText size={18} />
          </div>
          <div>
            <div className="preview-eyebrow">OFFLINE ARCHIVE ENGINE</div>
            <h3>Preview Export: Standalone HTML Transcripts</h3>
          </div>
        </div>

        <div className="preview-actions-header">
          <div className="view-mode-tabs">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'layout' ? 'active' : ''}`}
              onClick={() => setViewMode('layout')}
            >
              <Eye size={12} />
              <span>Layout View</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => setViewMode('code')}
            >
              <Code size={12} />
              <span>HTML Source</span>
            </button>
          </div>
        </div>
      </div>

      <p className="preview-desc">
        Preview the exact standalone HTML transcript generated by Assault’s <code>/assault export</code> and <code>/assault export-all</code> commands. Transcripts include anti-delete retention, ghost-ping detection badges, full edit timelines, and zero external script dependencies.
      </p>

      {/* FILTER & CHANNEL CONTROLS BAR */}
      <div className="preview-toolbar">
        <div className="channel-pills">
          <button
            type="button"
            className={`channel-pill ${selectedChannel === 'general' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('general')}
          >
            #general-discussion
            <span className="pill-counter">{SAMPLE_DATASETS.general.length}</span>
          </button>
          <button
            type="button"
            className={`channel-pill ${selectedChannel === 'dev' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('dev')}
          >
            #dev-announcements
            <span className="pill-counter">{SAMPLE_DATASETS.dev.length}</span>
          </button>
          <button
            type="button"
            className={`channel-pill ${selectedChannel === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('all')}
          >
            All Channels (Unified)
            <span className="pill-counter">{SAMPLE_DATASETS.general.length + SAMPLE_DATASETS.dev.length}</span>
          </button>
        </div>

        <div className="search-box">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Filter transcript messages"
          />
          {searchQuery && (
            <button type="button" className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      {/* MAIN PREVIEW CONTAINER */}
      <div className="preview-display-container">
        {viewMode === 'layout' ? (
          <div className="rendered-transcript-view">
            <div className="transcript-document-header">
              <div className="doc-title-row">
                <h4>Assault Transcript · #{channelTitle}</h4>
                <span className="badge-offline">Standalone Offline HTML</span>
              </div>
              <div className="doc-meta-row">
                <span>{filteredMessages.length} captured messages</span>
                <span>•</span>
                <span>Content-Security-Policy: default-src 'none'</span>
                <span>•</span>
                <span>Full Anti-Delete Active</span>
              </div>
            </div>

            <div className="transcript-articles-list">
              {filteredMessages.length === 0 ? (
                <div className="transcript-empty">
                  No messages matched "{searchQuery}".
                </div>
              ) : (
                filteredMessages.map(msg => (
                  <article
                    key={msg.id}
                    className={`transcript-article ${msg.deleted ? 'deleted-article' : ''}`}
                  >
                    <header className="article-header">
                      <b className="author-name">{msg.author.username}</b>
                      {msg.author.role && (
                        <span className="author-role-tag">{msg.author.role}</span>
                      )}
                      {msg.author.bot && (
                        <span className="author-bot-tag">BOT</span>
                      )}
                      <time className="msg-time">{msg.timestamp}</time>
                      {msg.deleted && (
                        <strong className="tag-deleted">Deleted</strong>
                      )}
                      {msg.ghost_ping && (
                        <span className="tag-ghost">Ghost Ping</span>
                      )}
                    </header>

                    <div className="msg-content-body">{msg.content}</div>

                    {msg.edits.length > 0 && (
                      <details className="article-edits" open>
                        <summary>Edit history ({msg.edits.length})</summary>
                        <div className="edit-timeline">
                          {msg.edits.map((edit, idx) => (
                            <div key={idx} className="edit-item">
                              <span className="edit-time">{edit.editedAt}</span>
                              <div className="edit-content">{edit.content}</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {msg.attachments.length > 0 && (
                      <div className="article-attachments">
                        <span className="attachments-title">Attachments:</span>
                        <ul>
                          {msg.attachments.map((att, idx) => (
                            <li key={idx}>
                              <a href={att.url} target="_blank" rel="noreferrer">
                                {att.filename}
                              </a>
                              {att.size && <span className="att-size">({att.size})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>

            <div className="transcript-document-footer">
              <span>Exported with Assault Manager · Compatible with any browser, phone or desktop</span>
            </div>
          </div>
        ) : (
          <div className="code-view-wrapper">
            <div className="code-toolbar">
              <span className="code-filename">assault-transcript-{channelTitle}.html</span>
              <span className="code-size">{(new Blob([fullHtmlCode]).size / 1024).toFixed(1)} KB</span>
            </div>
            <pre className="code-block">
              <code>{fullHtmlCode}</code>
            </pre>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="preview-footer-actions">
        <div className="cmd-hint">
          <Terminal size={13} />
          <span>In Discord chat, type: <code>/assault export</code> or <code>/assault export-all</code></span>
        </div>

        <div className="footer-btns">
          <button
            type="button"
            className="action-btn"
            onClick={handleCopyCode}
          >
            <Copy size={12} />
            {copied ? 'HTML Copied!' : 'Copy HTML'}
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={handleDownload}
          >
            <Download size={12} />
            Download .html
          </button>

          <button
            type="button"
            className={`action-btn primary-action ${isExporting ? 'loading' : ''} ${exportSuccess ? 'success' : ''}`}
            onClick={handleRunSimulatedExport}
            disabled={isExporting}
          >
            <RefreshCw size={12} className={isExporting ? 'spinning' : ''} />
            {isExporting ? 'Executing /assault export…' : exportSuccess ? 'Export Saved!' : 'Run /assault export'}
          </button>
        </div>
      </div>
    </section>
  );
}
