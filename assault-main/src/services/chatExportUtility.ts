import { DiscordMessage } from '../types';

export class ChatExportUtility {
  static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static generateHtmlExport(
    guildName: string,
    channelName: string,
    messages: DiscordMessage[]
  ): string {
    const exportTime = new Date().toLocaleString();

    const messageRowsHtml = messages
      .map((msg) => {
        const msgTime = new Date(msg.timestamp).toLocaleString();
        const avatar = msg.author.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
        const roleColor = msg.author.roleColor || '#f2f3f5';
        const deletedBadge = msg.isDeleted
          ? `<span class="badge deleted">DELETED</span>`
          : '';
        const editedBadge = msg.isEdited
          ? `<span class="badge edited">(edited)</span>`
          : '';
        const replyBlock = msg.replyAuthorName
          ? `<div class="reply-bar"><span class="reply-author">↳ @${this.escapeHtml(msg.replyAuthorName)}</span>: <span class="reply-snippet">${this.escapeHtml(msg.replySnippet || '')}</span></div>`
          : '';

        const attachmentsBlock =
          msg.attachments && msg.attachments.length > 0
            ? `<div class="attachments-container">${msg.attachments
                .map(
                  (att) =>
                    `<div class="attachment"><span class="att-icon">📎</span> <a href="${this.escapeHtml(att)}" target="_blank">${this.escapeHtml(att)}</a></div>`
                )
                .join('')}</div>`
            : '';

        return `
        <div class="message-card ${msg.isDeleted ? 'is-deleted' : ''}">
            ${replyBlock}
            <div class="message-header">
                <img class="avatar" src="${this.escapeHtml(avatar)}" alt="${this.escapeHtml(msg.author.globalName || msg.author.username)}" />
                <div class="author-info">
                    <span class="username" style="color: ${roleColor}">${this.escapeHtml(msg.author.globalName || msg.author.username)}</span>
                    ${msg.author.isBot ? '<span class="bot-tag">BOT</span>' : ''}
                    <span class="timestamp">${msgTime}</span>
                    ${deletedBadge}
                    ${editedBadge}
                </div>
            </div>
            <div class="message-body">
                ${this.escapeHtml(msg.content).replace(/\n/g, '<br/>')}
            </div>
            ${attachmentsBlock}
        </div>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assault Chat Backup - #${this.escapeHtml(channelName)}</title>
    <style>
        :root {
            --bg-base: #0f1015;
            --bg-card: #161822;
            --text-primary: #f2f3f5;
            --text-secondary: #949ba4;
            --accent: #5865f2;
            --danger: #ed4245;
            --edit-color: #f59e0b;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-base);
            color: var(--text-primary);
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            background-color: var(--bg-card);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid var(--accent);
            margin-bottom: 24px;
        }
        .header h1 {
            margin: 0 0 6px 0;
            font-size: 22px;
            color: var(--text-primary);
        }
        .header p {
            margin: 4px 0;
            color: var(--text-secondary);
            font-size: 13px;
        }
        .message-card {
            background-color: var(--bg-card);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 8px;
            transition: background 0.15s;
        }
        .message-card.is-deleted {
            border-left: 3px solid var(--danger);
            background: rgba(237, 66, 69, 0.08);
        }
        .message-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 6px;
        }
        .avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            object-fit: cover;
        }
        .author-info {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }
        .username {
            font-weight: 600;
            font-size: 15px;
        }
        .bot-tag {
            background: var(--accent);
            color: #ffffff;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
        .timestamp {
            font-size: 11px;
            color: var(--text-secondary);
        }
        .badge {
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .badge.deleted {
            background: rgba(237, 66, 69, 0.2);
            color: var(--danger);
        }
        .badge.edited {
            color: var(--edit-color);
        }
        .message-body {
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-primary);
            word-break: break-word;
            padding-left: 50px;
        }
        .reply-bar {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 6px;
            padding-left: 50px;
        }
        .reply-author {
            color: var(--accent);
            font-weight: 600;
        }
        .attachments-container {
            margin-top: 8px;
            padding-left: 50px;
        }
        .attachment {
            font-size: 12px;
            background: rgba(255, 255, 255, 0.05);
            padding: 6px 10px;
            border-radius: 6px;
            display: inline-block;
        }
        .attachment a {
            color: var(--accent);
            text-decoration: none;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: var(--text-secondary);
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Assault Backup: #${this.escapeHtml(channelName)}</h1>
            <p><strong>Server:</strong> ${this.escapeHtml(guildName)} | <strong>Exported:</strong> ${exportTime}</p>
            <p><strong>Total Messages:</strong> ${messages.length} | <strong>Retained Deleted Messages:</strong> ${messages.filter((m) => m.isDeleted).length}</p>
        </div>
        <div class="messages-list">
            ${messageRowsHtml}
        </div>
        <div class="footer">
            Generated with Assault Client Backup Utility • Encrypted SQLite Vault
        </div>
    </div>
</body>
</html>`;
  }

  static triggerDownload(fileName: string, htmlContent: string) {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
