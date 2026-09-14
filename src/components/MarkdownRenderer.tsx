import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-2 space-y-1 pl-5 list-disc text-inherit">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="my-2 space-y-1 pl-5 list-decimal text-inherit">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  // Helper to format inline bold, italic, code
  const formatInlineText = (text: string): React.ReactNode[] => {
    // Regex splits by code, bold, italic
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|_([^_]+)_)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[2]) {
        // Bold: **text**
        parts.push(
          <strong key={`b-${parts.length}-${match.index}`} className="font-bold text-inherit">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic: *text*
        parts.push(
          <em key={`i-${parts.length}-${match.index}`} className="italic text-inherit">
            {match[3]}
          </em>
        );
      } else if (match[4]) {
        // Code: `code`
        parts.push(
          <code
            key={`c-${parts.length}-${match.index}`}
            className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-mono text-xs text-emerald-700 dark:text-emerald-400"
          >
            {match[4]}
          </code>
        );
      } else if (match[5]) {
        // Italic: _text_
        parts.push(
          <em key={`i2-${parts.length}-${match.index}`} className="italic text-inherit">
            {match[5]}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h3-${i}`} className="font-bold text-base mt-3 mb-1.5 text-inherit">
          {formatInlineText(trimmed.substring(4))}
        </h4>
      );
      continue;
    }

    // Heading 2: ##
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${i}`} className="font-black text-lg mt-3.5 mb-2 text-inherit">
          {formatInlineText(trimmed.substring(3))}
        </h3>
      );
      continue;
    }

    // Heading 1: #
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h1-${i}`} className="font-black text-xl mt-4 mb-2 text-inherit">
          {formatInlineText(trimmed.substring(2))}
        </h2>
      );
      continue;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="pl-3 border-l-2 border-emerald-500 italic my-2 text-slate-600 dark:text-slate-300"
        >
          {formatInlineText(trimmed.substring(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet List: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(formatInlineText(trimmed.substring(2)));
      continue;
    }

    // Numbered List: 1. 2. etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(formatInlineText(numMatch[2]));
      continue;
    }

    // Standard Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed">
        {formatInlineText(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className={`prose-sm ${className}`}>{elements}</div>;
}
