import type { Task } from '../types.js';

export type SseEventType = 'progress' | 'completed' | 'failed';

export interface SsePayload {
  type: SseEventType | 'ping';
  taskId: string;
  progress?: number;
  stage?: string;
  task?: Task;
  error?: string;
  ts: number;
}

type Listener = (payload: SsePayload) => void;

class SseBus {
  private clients = new Map<string, Set<Listener>>();

  subscribe(taskId: string, listener: Listener): () => void {
    if (!this.clients.has(taskId)) this.clients.set(taskId, new Set());
    this.clients.get(taskId)!.add(listener);
    return () => {
      this.clients.get(taskId)?.delete(listener);
      if (this.clients.get(taskId)?.size === 0) this.clients.delete(taskId);
    };
  }

  emit(taskId: string, payload: Omit<SsePayload, 'ts'>): void {
    const msg: SsePayload = { ...payload, ts: Date.now() };
    const set = this.clients.get(taskId);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(msg);
      } catch {
        set.delete(listener);
      }
    }
  }

  broadcastProgress(task: Task): void {
    this.emit(task.id, {
      type: 'progress',
      taskId: task.id,
      progress: task.progress,
      stage: task.stage,
    });
  }

  broadcastCompleted(task: Task): void {
    this.emit(task.id, { type: 'completed', taskId: task.id, task });
  }

  broadcastFailed(task: Task): void {
    this.emit(task.id, { type: 'failed', taskId: task.id, task, error: task.error });
  }
}

export const sseBus = new SseBus();
