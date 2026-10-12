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
  Languages,
  Bot,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { copyText, downloadExport, formatClock, formatTimestampPrecise } from '@/lib/utils';
import type { AgentReport, Task } from '@/lib/types';

const EXPORTS: Array<{ format: 'txt' | 'srt' | 'vtt' | 'md'; label: string }> = [
  { format: 'txt', label: 'TXT' },
  { format: 'srt', label: 'SRT' },
  { format: 'vtt', label: 'VTT' },
  { format: 'md', label: 'MD' },
];

const TRANSLATE_TARGETS = ['英语', '日语', '韩语', '繁体中文'];

export default function TaskDetail({ task, onDeleted }: { task: Task; onDeleted: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('英语');
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<{ target: string; text: string; engine?: string } | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [localAgent, setLocalAgent] = useState<AgentReport | null>(null);
  const agentReport = localAgent ?? task.agentReport ?? null;
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

  async function runTranslate() {
    if (!task.transcript || translating) return;
    setTranslating(true);
    try {
      const result = await api.aiEnhance(task.id, 'translate', targetLang);
      setTranslation({
        target: result.target ?? targetLang,
        text: result.text ?? '',
        engine: result.engine,
      });
      toast('翻译完成', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : '翻译失败，请稍后再试', 'error');
    } finally {
      setTranslating(false);
    }
  }

  async function copyTranslation() {
    if (!translation) return;
    const ok = await copyText(translation.text);
    if (ok) {
      toast('已复制译文', 'success');
      setCopied('translation');
      setTimeout(() => setCopied(null), 1600);
    }
  }

  async function runAgentAnalysis() {
    if (!task.transcript || agentRunning) return;
    setAgentRunning(true);
    try {
      const result = await api.aiEnhance(task.id, 'agent');
      if (result.agent) setLocalAgent(result.agent);
      toast('Agent 分析完成', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Agent 分析失败，请稍后再试', 'error');
    } finally {
      setAgentRunning(false);
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
            <span className="ml-auto font-mono text-[10px] text-mist-faint">{task.insightEngine ?? task.engine ?? 'demo-engine'}</span>
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

      {translation && (
        <div className="mt-4 rounded-lg border border-mint/25 bg-mint/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-mint" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mint">
              translation · {translation.target}
            </span>
            <span className="ml-auto font-mono text-[10px] text-mist-faint">{translation.engine ?? 'llm'}</span>
          </div>
          <div className="mt-3 max-h-[260px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-mist">
            {translation.text}
          </div>
          <button
            type="button"
            onClick={() => void copyTranslation()}
            className="btn-ghost mt-3 h-8 gap-1.5 px-3 text-[11px]"
          >
            {copied === 'translation' ? (
              <CopyCheck className="h-3.5 w-3.5 text-mint" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied === 'translation' ? '已复制' : '复制译文'}
          </button>
        </div>
      )}

      {agentReport && (
        <div className="mt-4 rounded-lg border border-accent/25 bg-accent/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
              agent report
            </span>
            <span className="ml-auto font-mono text-[10px] text-mist-faint">
              {agentReport.model} · {agentReport.steps.length} 步 · {(agentReport.elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mist">{agentReport.overview}</p>
          {agentReport.keypoints.length > 0 && (
            <ol className="mt-4 space-y-2">
              {agentReport.keypoints.map((kp, i) => (
                <li key={kp} className="flex gap-2.5 text-[13px] leading-relaxed text-mist-dim">
                  <span className="mt-0.5 font-mono text-accent/70">{String(i + 1).padStart(2, '0')}</span>
                  {kp}
                </li>
              ))}
            </ol>
          )}
          {agentReport.highlights.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {agentReport.highlights.map((h) => (
                <div
                  key={`${h.timecode}-${h.quote.slice(0, 12)}`}
                  className="rounded-lg border border-white/[0.06] bg-black/20 px-3.5 py-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] text-accent">{h.timecode || '--:--'}</span>
                    <span className="text-xs leading-relaxed text-mist">{h.quote}</span>
                  </div>
                  {h.reason && <p className="mt-1.5 text-xs leading-relaxed text-mist-faint">{h.reason}</p>}
                </div>
              ))}
            </div>
          )}
          {agentReport.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {agentReport.tags.map((tag) => (
                <span key={tag} className="chip chip-amber">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer select-none font-mono text-[10px] uppercase tracking-[0.2em] text-mist-faint transition-colors hover:text-mist-dim">
              reasoning trace · {agentReport.steps.length} tool calls
            </summary>
            <div className="mt-2.5 space-y-1.5">
              {agentReport.steps.map((step, i) => (
                <div key={`${step.tool}-${i}`} className="rounded-md border border-white/[0.06] bg-black/20 px-3 py-2">
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-accent/80">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-mist-dim">{step.tool}</span>
                    <span className="truncate text-mist-faint">{JSON.stringify(step.args)}</span>
                    <span className="ml-auto shrink-0 text-mist-faint">{step.ms}ms</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-mist-faint">{step.preview}</p>
                </div>
              ))}
              {agentReport.steps.length === 0 && (
                <p className="font-mono text-[10px] text-mist-faint">未调用工具，直接产出报告</p>
              )}
            </div>
          </details>
        </div>
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
        <div className="flex items-center gap-1.5">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            disabled={translating}
            className="btn-ghost h-9 cursor-pointer px-3 text-xs outline-none disabled:opacity-50"
            aria-label="翻译目标语言"
          >
            {TRANSLATE_TARGETS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void runTranslate()}
            disabled={translating || !task.transcript}
            className="btn-ghost h-9 gap-1.5 px-3 text-xs disabled:opacity-50"
          >
            <Languages className="h-3.5 w-3.5" />
            {translating ? '翻译中…' : '翻译'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void runAgentAnalysis()}
          disabled={agentRunning || !task.transcript}
          className="btn-ghost h-9 gap-1.5 px-3 text-xs disabled:opacity-50"
        >
          <Bot className="h-3.5 w-3.5" />
          {agentRunning ? 'Agent 运行中…' : 'Agent 分析'}
        </button>
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
