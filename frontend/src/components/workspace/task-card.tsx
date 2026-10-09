'use client';

import clsx from 'clsx';
import { Link2, FileAudio, ChevronDown, CheckCircle2, AlertCircle, Clock3 } from 'lucide-react';
import Equalizer from '@/components/equalizer';
import TaskDetail from './task-detail';
import ErrorAdvice from './error-advice';
import { formatClock, formatTimeAgo, formatFileSize } from '@/lib/utils';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  active: boolean;
  onToggle: (id: string) => void;
  onDeleted: (id: string) => void;
  onRetry?: (url: string) => void;
}

export default function TaskCard({ task, active, onToggle, onDeleted, onRetry }: TaskCardProps) {
  const isProcessing = task.status === 'queued' || task.status === 'processing';

  return (
    <article
      className={clsx(
        'glass overflow-hidden transition-colors duration-200',
        active && 'border-accent/45',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="w-full px-5 py-4 text-left sm:px-6"
        aria-expanded={active}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-mist-dim">
            {task.sourceType === 'link' ? <Link2 className="h-4 w-4" /> : <FileAudio className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="truncate text-sm font-medium text-mist">
                {task.status === 'completed' ? task.insights?.title ?? task.title : task.title}
              </h3>
              {task.aiEnhance && (
                <span className="chip chip-amber !px-2 !py-0.5 !text-[10px]">AI</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-mist-faint">
              <span>{task.platformLabel}</span>
              <span aria-hidden>·</span>
              <span className="font-mono">{formatTimeAgo(task.createdAt)}</span>
              {task.sourceType === 'upload' && task.fileSize != null && (
                <>
                  <span aria-hidden>·</span>
                  <span className="font-mono">{formatFileSize(task.fileSize)}</span>
                </>
              )}
              {task.status === 'completed' && task.transcript && (
                <>
                  <span aria-hidden>·</span>
                  <span className="font-mono">
                    {formatClock(task.durationSec)} / {task.transcript.wordCount} 字
                  </span>
                </>
              )}
            </div>
          </div>

          <StatusBadge task={task} />
          <ChevronDown
            className={clsx(
              'h-4 w-4 shrink-0 text-mist-faint transition-transform duration-300',
              active && 'rotate-180',
            )}
          />
        </div>

        {isProcessing && (
          <div className="mt-4">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${task.progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
              <span className="text-paper">{task.stage}</span>
              <span className="text-mist-faint">{Math.round(task.progress)}%</span>
            </div>
          </div>
        )}

      </button>

      {task.status === 'failed' && (
        <div className="px-5 pb-4 sm:px-6">
          <ErrorAdvice
            code={task.errorCode}
            message={task.error}
            onRetry={task.url && onRetry ? () => onRetry(task.url as string) : undefined}
          />
        </div>
      )}

      {active && task.status === 'completed' && (
        <TaskDetail task={task} onDeleted={() => onDeleted(task.id)} />
      )}
    </article>
  );
}

function StatusBadge({ task }: { task: Task }) {
  if (task.status === 'queued') {
    return (
      <span className="chip shrink-0 cursor-default">
        <Clock3 className="h-3 w-3" />
        排队中
      </span>
    );
  }
  if (task.status === 'processing') {
    return (
      <span className="chip chip-mint shrink-0 cursor-default">
        <Equalizer bars={3} className="h-3" />
        转写中
      </span>
    );
  }
  if (task.status === 'completed') {
    return (
      <span className="chip chip-mint shrink-0 cursor-default">
        <CheckCircle2 className="h-3 w-3 text-mint" />
        完成
      </span>
    );
  }
  return (
    <span className="chip shrink-0 cursor-default !border-rose/30 !text-rose">
      <AlertCircle className="h-3 w-3" />
      失败
    </span>
  );
}
