'use client';

import { useState } from 'react';
import clsx from 'clsx';
import {
  Copy,
  CopyCheck,
  Download,
  FileText,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { copyText, downloadExport, formatClock, formatTimestampPrecise } from '@/lib/utils';
import type { Task } from '@/lib/types';

const EXPORTS: Array<{ format: 'txt' | 'srt' | 'vtt' | 'md'; label: string }> = [
  { format: 'txt', label: 'TXT' },
  { format: 'srt', label: 'SRT' },
  { format: 'vtt', label: 'VTT' },
  { format: 'md', label: 'MD' },
];

export default function TaskDetail({ task, onDeleted }: { task: Task; onDeleted: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const segments = task.transcript?.segments ?? [];

  async function copySegment(text: string, start: number) {
    const ok = await copyText(`[${formatTimestampPrecise(start)}] ${text}`);
    if (ok) {
      toast('已复制该句（含时间戳）', 'success');
      setCopied(text);
      setTimeout(() => setCopied(null), 1600);
    }
  }

  async function copyAll() {
    if (!task.transcript) return;
    const ok = await copyText(task.transcript.fullText);
    toast(ok ? '已复制完整文案' : '复制失败，请手动选择复制', ok ? 'success' : 'error');
  }

  async function remove() {
    try {
      await api.deleteTask(task.id);
      toast('任务已删除', 'success');
      onDeleted();
    } catch {
      toast('删除失败，请稍后再试', 'error');
    }
  }

  return (
    <div className="animate-scale-in border-t border-white/[0.06] px-5 pb-5 pt-5 sm:px-6">
      {task.insights && (
        <div className="rounded-lg border border-accent/25 bg-accent/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
              ai insights
            </span>
            <span className="ml-auto font-mono text-[10px] text-mist-faint">{task.engine ?? 'demo-engine'}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mist">{task.insights.overview}</p>
          {task.insights.keypoints.length > 0 && (
            <ol className="mt-4 space-y-2">
              {task.insights.keypoints.map((kp, i) => (
                <li key={kp} className="flex gap-2.5 text-[13px] leading-relaxed text-mist-dim">
                  <span className="mt-0.5 font-mono text-accent/70">{String(i + 1).padStart(2, '0')}</span>
                  {kp}
                </li>
              ))}
            </ol>
          )}
          {task.insights.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {task.insights.tags.map((tag) => (
                <span key={tag} className="chip chip-amber">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!task.insights && task.status === 'completed' && (
        <p className="mb-4 rounded-lg border border-dashed border-white/10 px-4 py-3 text-xs text-mist-faint">
          该任务未开启 AI 增强，重新提交并打开 AI 增强即可获得摘要、要点与标签。
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void copyAll()} className="btn-ghost h-9 px-4 text-xs">
          <Copy className="h-3.5 w-3.5" />
          复制全文
        </button>
        {EXPORTS.map(({ format, label }) => (
          <button
            key={format}
            type="button"
            onClick={() => downloadExport(api.exportUrl(task.id, format))}
            className="btn-ghost h-9 gap-1.5 px-3 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void remove()}
          className="btn-ghost ml-auto h-9 w-9 !border-rose/25 text-rose hover:!border-rose/50"
          aria-label="删除任务"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-5 max-h-[380px] overflow-y-auto rounded-lg border border-white/[0.06] bg-black/25">
        {segments.map((seg) => (
          <button
            key={`${seg.start}-${seg.text.slice(0, 8)}`}
            type="button"
            onClick={() => void copySegment(seg.text, seg.start)}
            className="group flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.03]"
          >
            <span className="mt-0.5 shrink-0 font-mono text-[11px] text-mist-faint">
              {formatClock(seg.start)}
            </span>
            <span className="flex-1 text-sm leading-relaxed text-mist-dim transition-colors group-hover:text-mist">
              {seg.text}
            </span>
            <span className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              {copied === seg.text ? (
                <CopyCheck className="h-3.5 w-3.5 text-mint" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-mist-faint" />
              )}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-mist-faint">
        <FileText className="h-3 w-3" />
        点击任意一句即可复制（自动带上时间戳）
      </p>
    </div>
  );
}
