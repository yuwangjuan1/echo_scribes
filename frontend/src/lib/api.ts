import type {
  AiEnhanceResult,
  PricingPlan,
  PlatformMeta,
  SseMessage,
  Task,
  UsageInfo,
} from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError('无法连接转写服务，请确认后端已启动（默认 http://localhost:4000）', 0);
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  if (!res.ok) {
    throw new ApiError((body.error as string) ?? `请求失败（${res.status}）`, res.status);
  }
  return body as T;
}

export interface CookiesStatus {
  configured: boolean;
  updatedAt?: string;
  sizeBytes?: number;
}

export interface SseHandlers {
  onProgress?: (progress: number, stage: string) => void;
  onCompleted?: (task: Task) => void;
  onFailed?: (task: Task, error?: string) => void;
  onError?: () => void;
}

export const api = {
  async health(): Promise<{ ok: boolean; provider: string; demo: boolean }> {
    return request('/api/v1/health');
  },

  async submitLinks(links: string, aiEnhance: boolean): Promise<{ tasks: Task[]; invalid: number; usage: UsageInfo }> {
    return request('/api/v1/transcribe/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ links, aiEnhance }),
    });
  },

  async uploadFile(file: File, aiEnhance: boolean): Promise<{ task: Task; usage: UsageInfo }> {
    const form = new FormData();
    form.append('file', file);
    form.append('aiEnhance', String(aiEnhance));
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/v1/transcribe/upload`, { method: 'POST', body: form });
    } catch {
      throw new ApiError('无法连接转写服务，请确认后端已启动', 0);
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string; task: Task; usage: UsageInfo };
    if (!res.ok) throw new ApiError(body.error ?? `上传失败（${res.status}）`, res.status);
    return body;
  },

  async listTasks(limit = 100): Promise<{ tasks: Task[] }> {
    return request(`/api/v1/tasks?limit=${limit}`);
  },

  async getTask(id: string): Promise<{ task: Task }> {
    return request(`/api/v1/tasks/${id}`);
  },

  async deleteTask(id: string): Promise<void> {
    await request(`/api/v1/tasks/${id}`, { method: 'DELETE' });
  },

  async usage(): Promise<{ usage: UsageInfo }> {
    return request('/api/v1/usage');
  },

  async platforms(): Promise<{ platforms: PlatformMeta[] }> {
    return request('/api/v1/platforms');
  },

  async cookiesStatus(): Promise<{ cookies: CookiesStatus }> {
    return request('/api/v1/cookies');
  },

  async saveCookies(content: string): Promise<{ cookies: CookiesStatus }> {
    return request('/api/v1/cookies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  },

  async pricing(): Promise<{ plans: PricingPlan[] }> {
    return request('/api/v1/pricing');
  },

  async aiEnhance(taskId: string, action: 'summary' | 'keypoints' | 'translate' | 'agent', target?: string): Promise<AiEnhanceResult> {
    return request('/api/v1/ai/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, action, target }),
    });
  },

  exportUrl(taskId: string, format: 'txt' | 'srt' | 'vtt' | 'md'): string {
    return `${API_BASE}/api/v1/tasks/${taskId}/export?format=${format}`;
  },

  subscribeTask(taskId: string, handlers: SseHandlers): () => void {
    const es = new EventSource(`${API_BASE}/api/v1/tasks/${taskId}/events`);
    let closed = false;
    const close = () => {
      if (!closed) {
        closed = true;
        es.close();
      }
    };

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as SseMessage;
        if (msg.type === 'progress') {
          if (msg.task && (msg.task.status === 'completed' || msg.task.status === 'failed')) {
            if (msg.task.status === 'completed') handlers.onCompleted?.(msg.task);
            else handlers.onFailed?.(msg.task, msg.task.error);
            close();
            return;
          }
          handlers.onProgress?.(msg.progress ?? 0, msg.stage ?? '');
        } else if (msg.type === 'completed' && msg.task) {
          handlers.onCompleted?.(msg.task);
          close();
        } else if (msg.type === 'failed') {
          handlers.onFailed?.(msg.task as Task, msg.error);
          close();
        }
      } catch {
        handlers.onError?.();
      }
    };
    es.onerror = () => {
      if (!closed) handlers.onError?.();
    };
    return close;
  },
};
