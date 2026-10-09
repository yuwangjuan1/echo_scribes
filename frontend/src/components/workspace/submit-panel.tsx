'use client';

import { useState } from 'react';
import { Link2, FileUp, Zap, ArrowRight, X, FileAudio } from 'lucide-react';
import clsx from 'clsx';
import { toast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import { countLinks, formatFileSize } from '@/lib/utils';
import type { Task } from '@/lib/types';

interface SubmitPanelProps {
  onSubmitted: (tasks: Task[]) => void;
  initialTab?: 'links' | 'upload';
}

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export default function SubmitPanel({ onSubmitted, initialTab = 'links' }: SubmitPanelProps) {
  const [tab, setTab] = useState<'links' | 'upload'>(initialTab);
  const [links, setLinks] = useState('');
  const [aiEnhance, setAiEnhance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const linkCount = countLinks(links);

  async function submitLinks() {
    if (loading) return;
    if (linkCount === 0) {
      toast('请先粘贴至少一条视频链接', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.submitLinks(links, aiEnhance);
      toast(`已提交 ${res.tasks.length} 个转写任务`, 'success');
      setLinks('');
      onSubmitted(res.tasks);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '提交失败，请稍后再试', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function submitFile() {
    if (loading) return;
    if (!file) {
      toast('请先选择要上传的音视频文件', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.uploadFile(file, aiEnhance);
      toast('文件已提交，正在排队转写', 'success');
      setFile(null);
      onSubmitted([res.task]);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '上传失败，请稍后再试', 'error');
    } finally {
      setLoading(false);
    }
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_UPLOAD_BYTES) {
      toast(`文件过大（上限 100 MB），当前 ${formatFileSize(f.size)}`, 'error');
      return;
    }
    setFile(f);
  }

  return (
    <section className="glass p-5 sm:p-6" aria-label="提交转写任务">
      <div className="flex gap-1 rounded-lg bg-black/30 p-1">
        <button
          type="button"
          onClick={() => setTab('links')}
          className={clsx(
            'flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors',
            tab === 'links' ? 'bg-white/[0.09] text-paper' : 'text-mist-dim hover:text-paper',
          )}
        >
          <Link2 className="h-4 w-4" />
          粘贴链接
        </button>
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={clsx(
            'flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors',
            tab === 'upload' ? 'bg-white/[0.09] text-paper' : 'text-mist-dim hover:text-paper',
          )}
        >
          <FileUp className="h-4 w-4" />
          上传文件
        </button>
      </div>

      <div className="mt-5">
        {tab === 'links' ? (
          <div className="animate-scale-in">
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submitLinks();
              }}
              rows={5}
              spellCheck={false}
              placeholder={'粘贴视频链接或整段分享文案，每行一条…\n支持抖音 / B站 / 小红书 / YouTube 等，最多 100 条'}
              className="field-input min-h-[128px] resize-none leading-relaxed"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAiEnhance((v) => !v)}
                className={clsx('chip cursor-pointer transition-colors', aiEnhance && 'chip-amber')}
                aria-pressed={aiEnhance}
              >
                <Zap className={clsx('h-3.5 w-3.5', aiEnhance && 'text-accent')} />
                AI 增强{aiEnhance ? ' · 开' : ' · 关'}
              </button>
              <span className="font-mono text-[11px] text-mist-faint">
                {linkCount > 0 ? `已识别 ${linkCount} 条` : '⌘ / Ctrl + Enter'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void submitLinks()}
              disabled={loading}
              className="btn-glow mt-4 h-12 w-full text-sm"
            >
              {loading ? '提交中…' : linkCount > 0 ? `开始转写 · ${linkCount} 条` : '开始转写'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <div className="animate-scale-in">
            {!file ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                className={clsx(
                  'flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-colors',
                  dragging
                    ? 'border-accent/60 bg-accent/[0.05]'
                    : 'border-white/15 bg-black/20 hover:border-accent/40 hover:bg-accent/[0.03]',
                )}
              >
                <FileAudio className="h-8 w-8 text-mist-faint" />
                <p className="mt-3 text-sm text-mist-dim">
                  拖入文件，或<span className="text-paper underline underline-offset-4">点击选择</span>
                </p>
                <p className="mt-1.5 font-mono text-[11px] text-mist-faint">
                  MP3 / M4A / WAV / MP4 · ≤ 100 MB
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov,.aac,.flac,.ogg,.webm"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? undefined)}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-mist-dim">
                  <FileAudio className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-mist">{file.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-mist-faint">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-ghost h-8 w-8"
                  onClick={() => setFile(null)}
                  aria-label="移除文件"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAiEnhance((v) => !v)}
                className={clsx('chip cursor-pointer transition-colors', aiEnhance && 'chip-amber')}
                aria-pressed={aiEnhance}
              >
                <Zap className={clsx('h-3.5 w-3.5', aiEnhance && 'text-accent')} />
                AI 增强{aiEnhance ? ' · 开' : ' · 关'}
              </button>
              <span className="font-mono text-[11px] text-mist-faint">按转写时长扣减额度</span>
            </div>
            <button
              type="button"
              onClick={() => void submitFile()}
              disabled={loading || !file}
              className="btn-glow mt-4 h-12 w-full text-sm"
            >
              {loading ? '上传中…' : file ? '提交转写' : '请先选择文件'}
              {file && !loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
