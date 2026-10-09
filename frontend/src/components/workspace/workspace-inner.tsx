'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ServerCrash } from 'lucide-react';
import SubmitPanel from '@/components/workspace/submit-panel';
import UsageCard from '@/components/workspace/usage-card';
import TaskCard from '@/components/workspace/task-card';
import Equalizer from '@/components/equalizer';
import { toast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import type { Task, UsageInfo } from '@/lib/types';

export default function WorkspaceInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'upload' ? ('upload' as const) : ('links' as const);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [engineName, setEngineName] = useState<string>('demo-engine');
  const subsRef = useRef<Map<string, () => void>>(new Map());

  const refresh = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([api.listTasks(), api.usage()]);
      setTasks(t.tasks);
      setUsage(u.usage);
      setOnline(true);
      api
        .health()
        .then((h) => setEngineName(h.provider))
        .catch(() => undefined);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) setOnline(false);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subs = subsRef.current;

    for (const task of tasks) {
      const live = task.status === 'queued' || task.status === 'processing';
      if (live && !subs.has(task.id)) {
        const close = api.subscribeTask(task.id, {
          onProgress: (progress, stage) => {
            setTasks((prev) =>
              prev.map((x) =>
                x.id === task.id ? { ...x, progress, stage, status: 'processing' as const } : x,
              ),
            );
          },
          onCompleted: (completed) => {
            subs.delete(completed.id);
            setTasks((prev) => prev.map((x) => (x.id === completed.id ? completed : x)));
            void api
              .usage()
              .then((r) => setUsage(r.usage))
              .catch(() => undefined);
            toast(`转写完成：${completed.insights?.title ?? completed.title}`, 'success');
          },
          onFailed: (failed) => {
            subs.delete(task.id);
            if (failed) setTasks((prev) => prev.map((x) => (x.id === task.id ? failed : x)));
            toast(failed?.error ?? '转写失败，展开任务卡片可查看处理建议', 'error');
          },
          onError: () => {
            window.setTimeout(() => void refresh(), 2500);
          },
        });
        subs.set(task.id, close);
      }
      if (!live && subs.has(task.id)) {
        subs.get(task.id)?.();
        subs.delete(task.id);
      }
    }

    for (const [id, close] of Array.from(subs.entries())) {
      if (!tasks.some((t) => t.id === id)) {
        close();
        subs.delete(id);
      }
    }
  }, [tasks, refresh]);

  useEffect(() => {
    const subs = subsRef.current;
    return () => {
      for (const close of subs.values()) close();
      subs.clear();
    };
  }, []);

  const processingCount = tasks.filter((t) => t.status === 'queued' || t.status === 'processing').length;

  useEffect(() => {
    if (processingCount === 0) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [processingCount, refresh]);

  function handleSubmitted(newTasks: Task[]) {
    setTasks((prev) => [...newTasks, ...prev]);
    setActiveId(newTasks[0]?.id ?? null);
    void refresh();
  }

  async function handleRetry(url: string) {
    try {
      const r = await api.submitLinks(url, true);
      handleSubmitted(r.tasks);
      toast('已重新提交转写', 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '提交失败，请检查后端服务';
      toast(msg, 'error');
    }
  }

  function handleDeleted(id: string) {
    subsRef.current.get(id)?.();
    subsRef.current.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
    void refresh();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">workspace</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            转写工作台
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist-dim">
            粘贴链接或上传文件，进度实时推送；完成后可复制文案、查看 AI 摘要、导出四种格式。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {processingCount > 0 && (
            <span className="chip chip-mint cursor-default">
              <Equalizer bars={3} className="h-3" />
              {processingCount} 个任务处理中
            </span>
          )}
          {online === true && (
            <span className="chip cursor-default">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-mint" />
              引擎在线 · {engineName === 'demo-engine' ? '演示数据' : engineName}
            </span>
          )}
          {online === false && (
            <span className="chip cursor-default !border-rose/35 !text-rose">
              <ServerCrash className="h-3 w-3" />
              后端未连接
            </span>
          )}
        </div>
      </div>

      {online === false && loaded && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-rose/30 bg-rose/[0.07] px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose" />
          <div className="text-sm leading-relaxed text-mist-dim">
            <p className="font-medium text-rose">无法连接转写服务（http://localhost:4000）</p>
            <p className="mt-1">
              请在 <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-paper">backend</code> 目录运行{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-paper">npm run dev</code>{' '}
              启动后端 API 后刷新本页。
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <SubmitPanel onSubmitted={handleSubmitted} initialTab={initialTab} />
          <UsageCard usage={usage} onRefresh={() => void refresh()} />
        </div>

        <div className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-mist-dim">
              任务记录
              {tasks.length > 0 && (
                <span className="ml-2 font-mono text-xs text-mist-faint">{tasks.length}</span>
              )}
            </h2>
          </div>

          <div className="mt-4 space-y-4">
            {!loaded && (
              <>
                <div className="glass h-28 animate-pulse" />
                <div className="glass h-28 animate-pulse" />
              </>
            )}

            {loaded && tasks.length === 0 && (
              <div className="glass flex flex-col items-center px-6 py-16 text-center">
                <Equalizer bars={7} className="h-8 justify-center opacity-60" />
                <p className="mt-6 text-sm font-medium text-mist">还没有转写任务</p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-mist-faint">
                  在左侧粘贴视频链接，或上传本地音视频文件，提交后这里会实时展示处理进度。
                </p>
              </div>
            )}

            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                active={activeId === task.id}
                onToggle={(id) => setActiveId((cur) => (cur === id ? null : id))}
                onDeleted={handleDeleted}
                onRetry={(url) => void handleRetry(url)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
