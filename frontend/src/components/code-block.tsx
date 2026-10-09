'use client';

import { useState } from 'react';
import { Copy, CopyCheck, Terminal } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { copyText } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  title?: string;
  language?: string;
}

export default function CodeBlock({ code, title, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      toast('已复制到剪贴板', 'success');
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-black/45">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[11px] text-mist-faint">
          <Terminal className="h-3.5 w-3.5 text-mist-dim" />
          {title ?? language}
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="btn-ghost h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="复制代码"
        >
          {copied ? <CopyCheck className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[12.5px] leading-relaxed">
        <code className="font-mono text-mist-dim">{code}</code>
      </pre>
    </div>
  );
}
