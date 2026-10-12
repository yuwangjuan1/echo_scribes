import type { Insights, PlatformId, Task } from '../types.js';
import { store } from '../store.js';
import { getProvider } from '../providers/index.js';
import { llm } from '../providers/llm.js';
import { ProviderError } from '../providers/provider.js';
import { templateFor } from '../lib/templates.js';
import { sseBus } from './sse.js';
import { config } from '../config.js';

function buildInsights(platform: PlatformId, title: string): Insights {
  const template = templateFor(platform);
  return {
    title: template.title,
    overview: template.overview,
    keypoints: template.keypoints,
    tags: template.tags,
  };
}

class TaskQueue {
  private pending: string[] = [];
  private active = new Set<string>();
  private cancelSignals = new Map<string, AbortController>();
  private buffers = new Map<string, { buffer: Buffer; mimeType?: string; fileName?: string }>();

  attachBuffer(taskId: string, data: { buffer: Buffer; mimeType?: string; fileName?: string }): void {
    this.buffers.set(taskId, data);
  }

  enqueue(taskId: string): void {
    this.pending.push(taskId);
    this.drain();
  }

  cancel(taskId: string): void {
    this.pending = this.pending.filter((id) => id !== taskId);
    this.cancelSignals.get(taskId)?.abort();
    this.cancelSignals.delete(taskId);
    this.buffers.delete(taskId);
  }

  private drain(): void {
    while (this.active.size < config.concurrency && this.pending.length > 0) {
      const taskId = this.pending.shift()!;
      const controller = new AbortController();
      this.cancelSignals.set(taskId, controller);
      this.active.add(taskId);
      void this.run(taskId, controller.signal)
        .catch(() => undefined)
        .finally(() => {
          this.active.delete(taskId);
          this.cancelSignals.delete(taskId);
          this.drain();
        });
    }
  }

  private async run(taskId: string, signal: AbortSignal): Promise<void> {
    const task = store.get(taskId);
    if (!task) return;

    task.status = 'processing';
    task.stage = '准备转写';
    task.progress = 2;
    store.put(task);
    sseBus.broadcastProgress(task);

    const { provider } = getProvider();
    let lastEmit = 0;
    const bufferData = this.buffers.get(taskId);

    try {
      const result = await provider.transcribe(
        {
          platform: task.platform,
          platformLabel: task.platformLabel,
          url: task.url,
          fileName: task.fileName,
          fileSize: task.fileSize,
          buffer: bufferData?.buffer,
          mimeType: bufferData?.mimeType,
          aiEnhance: task.aiEnhance,
          signal,
        },
        {
          signal,
          onProgress: (progress, stage) => {
            task.progress = Math.max(task.progress, Math.min(99, progress));
            task.stage = stage;
            task.status = 'processing';
            const now = Date.now();
            if (now - lastEmit > 350) {
              lastEmit = now;
              store.put(task);
              sseBus.broadcastProgress(task);
            }
          },
        },
      );

      const fullText = result.segments.map((s) => s.text).join('\n');
      const wordCount = result.segments.reduce((acc, s) => acc + s.text.replace(/\s/g, '').length, 0);

      task.title = task.sourceType === 'upload' ? task.fileName ?? result.title : result.title;
      task.durationSec = result.durationSec;
      task.engine = result.engine;
      if (result.language) task.language = result.language;
      task.status = 'completed';
      task.progress = 100;
      task.stage = '转写完成';
      task.completedAt = Date.now();
      task.transcript = {
        segments: result.segments,
        fullText,
        wordCount,
        durationSec: result.durationSec,
      };
      if (task.aiEnhance) {
        let insights =
          result.insights ??
          buildInsights(task.platform as PlatformId, task.title);
        if (llm.enabled && !provider.isDemo && task.transcript.fullText.trim().length > 0) {
          task.stage = 'AI 增强中';
          task.progress = Math.max(task.progress, 94);
          store.put(task);
          sseBus.broadcastProgress(task);
          try {
            insights = await llm.enhanceInsights(
              task.transcript.fullText,
              task.platformLabel,
              task.title,
              signal,
            );
            task.insightEngine = llm.model;
          } catch (err) {
            if (signal.aborted) throw err;
            console.warn(
              `[queue] LLM 摘要失败，回退抽取式结果：${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
        task.insights = insights;
      }
      store.put(task);
      sseBus.broadcastCompleted(task);
      this.buffers.delete(taskId);
      console.log(`[queue] 任务完成 ${taskId} · ${provider.name} · 时长 ${result.durationSec}s`);
    } catch (err) {
      if (signal.aborted) {
        if (store.get(taskId)) {
          store.remove(taskId);
        }
        return;
      }
      task.status = 'failed';
      task.stage = '转写失败';
      task.error = err instanceof Error ? err.message : String(err);
      task.errorCode = err instanceof ProviderError ? err.code : undefined;
      store.put(task);
      sseBus.broadcastFailed(task);
      console.warn(`[queue] 任务失败 ${taskId}：${task.error}`);
    }
  }
}

export const queue = new TaskQueue();
