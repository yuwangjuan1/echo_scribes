'use client';

import { RotateCcw, Hourglass } from 'lucide-react';
import type { UsageInfo } from '@/lib/types';

interface UsageCardProps {
  usage: UsageInfo | null;
  onRefresh: () => void;
}

export default function UsageCard({ usage, onRefresh }: UsageCardProps) {
  const percent =
    usage && usage.freeMinutes > 0
      ? Math.min(100, Math.round((usage.usedMinutes / usage.freeMinutes) * 100))
      : 0;

  return (
    <section className="glass p-5 sm:p-6" aria-label="转写额度">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-mist">
          <Hourglass className="h-4 w-4 text-mint" />
          免费转写额度
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          className="btn-ghost h-8 w-8"
          aria-label="刷新额度"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {usage ? (
        <>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-sm text-mist-dim">
              剩余
              <span className="ml-1.5 font-display text-2xl font-semibold text-gradient">
                {usage.remainingMinutes}
              </span>
              <span className="ml-1 text-mist-faint">/ {usage.freeMinutes} 分钟</span>
            </p>
            <span className="font-mono text-[11px] text-mist-faint">
              已用 {usage.usedMinutes} 分钟
            </span>
          </div>
          <div className="progress-track mt-3">
            <div
              className="progress-fill"
              style={{ width: `${percent}%`, animation: 'none' }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-mist-faint">
            额度按已完成任务的转写时长扣减；演示环境下删除已完成任务即可返还额度。
          </p>
        </>
      ) : (
        <div className="mt-4 h-20 animate-pulse rounded-md bg-white/[0.04]" />
      )}
    </section>
  );
}
