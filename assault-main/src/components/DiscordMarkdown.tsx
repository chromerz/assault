import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface DiscordMarkdownProps {
  content: string;
}

export const DiscordMarkdown: React.FC<DiscordMarkdownProps> = ({ content }) => {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard?.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const toggleSpoiler = (idx: number) => {
    setRevealedSpoilers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // If text contains multi-line code block: ```lang\ncode\n```
  if (content.includes('```')) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <div className="space-y-1.5 leading-relaxed">
        {parts.map((part, i) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const raw = part.slice(3, -3);
            const firstLineBreak = raw.indexOf('\n');
            let lang = 'code';
            let code = raw;

            if (firstLineBreak > 0 && firstLineBreak < 20) {
              lang = raw.slice(0, firstLineBreak).trim() || 'code';
              code = raw.slice(firstLineBreak + 1);
            }

            return (
              <div
                key={i}
                className="my-1.5 rounded-lg border border-[#202225] bg-[#1e1f22] overflow-hidden text-xs shadow-inner"
              >
                <div className="flex items-center justify-between px-3 py-1 bg-[#111214] border-b border-[#2b2d31] text-[10px] text-[#949ba4] font-mono">
                  <span>{lang.toUpperCase()}</span>
                  <button
                    onClick={() => handleCopyCode(code, i)}
                    className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="w-3 h-3 text-[#23a55a]" />
                        <span className="text-[#23a55a]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto font-mono text-[#23a55a] text-[12px] leading-relaxed">
                  {code}
                </pre>
              </div>
            );
          }
          return <span key={i}>{renderInlineMarkdown(part, revealedSpoilers, toggleSpoiler)}</span>;
        })}
      </div>
    );
  }

  return (
    <div className="leading-relaxed">
      {renderInlineMarkdown(content, revealedSpoilers, toggleSpoiler)}
    </div>
  );
};

// Helper for inline markdown: bold, italic, strike, spoiler, mentions, inline code
function renderInlineMarkdown(
  text: string,
  revealedSpoilers: Record<number, boolean>,
  toggleSpoiler: (idx: number) => void
) {
  // Split on blockquotes
  if (text.startsWith('> ')) {
    return (
      <div className="border-l-4 border-[#4e5058] pl-3 py-0.5 my-1 text-[#b5bac1] italic">
        {renderInlineSpans(text.slice(2), revealedSpoilers, toggleSpoiler)}
      </div>
    );
  }

  return renderInlineSpans(text, revealedSpoilers, toggleSpoiler);
}

function renderInlineSpans(
  text: string,
  revealedSpoilers: Record<number, boolean>,
  toggleSpoiler: (idx: number) => void
): React.ReactNode[] {
  // Regex to match spoiler ||text||, bold **text**, italic *text*, strike ~~text~~, code `text`, mention @user
  const regex = /(\|\|[\s\S]*?\|\||\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|~~[\s\S]*?~~|`[^`]+`|@\w+|https?:\/\/[^\s]+)/g;
  const tokens = text.split(regex);

  let spoilerIndex = 0;

  return tokens.map((tok, idx) => {
    if (!tok) return null;

    // Spoiler ||...||
    if (tok.startsWith('||') && tok.endsWith('||') && tok.length >= 4) {
      const sIdx = spoilerIndex++;
      const isRevealed = !!revealedSpoilers[sIdx];
      const inner = tok.slice(2, -2);
      return (
        <span
          key={idx}
          onClick={() => toggleSpoiler(sIdx)}
          className={`inline-block mx-0.5 px-1.5 py-0.5 rounded text-xs transition cursor-pointer select-none ${
            isRevealed
              ? 'bg-[#4e5058]/40 text-[#f2f3f5]'
              : 'bg-[#2b2d31] hover:bg-[#35373c] text-transparent hover:text-transparent border border-[#35373c]'
          }`}
          title={isRevealed ? 'Click to hide spoiler' : 'Spoiler: click to reveal'}
        >
          {inner}
        </span>
      );
    }

    // Bold **...**
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {tok.slice(2, -2)}
        </strong>
      );
    }

    // Italic *...*
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 2) {
      return (
        <em key={idx} className="italic text-[#e0e2e5]">
          {tok.slice(1, -1)}
        </em>
      );
    }

    // Strikethrough ~~...~~
    if (tok.startsWith('~~') && tok.endsWith('~~') && tok.length >= 4) {
      return (
        <span key={idx} className="line-through text-[#949ba4]">
          {tok.slice(2, -2)}
        </span>
      );
    }

    // Inline Code `...`
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length >= 2) {
      return (
        <code
          key={idx}
          className="mx-0.5 px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#f23f43] font-mono text-[12px] border border-[#2b2d31]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }

    // Mention @username
    if (tok.startsWith('@') && tok.length > 1) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#5865f2]/20 hover:bg-[#5865f2]/30 text-[#c9cdfb] hover:text-white font-medium text-xs transition cursor-pointer"
        >
          {tok}
        </span>
      );
    }

    // URL links
    if (tok.startsWith('http://') || tok.startsWith('https://')) {
      return (
        <a
          key={idx}
          href={tok}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00a8fc] hover:underline break-all"
        >
          {tok}
        </a>
      );
    }

    return <span key={idx}>{tok}</span>;
  });
}
