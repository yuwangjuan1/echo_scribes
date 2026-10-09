import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Task, UsageInfo } from './types.js';
import { FREE_MINUTES } from './config.js';

export class TaskStore {
  private tasks = new Map<string, Task>();
  private file: string;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(dataDir: string) {
    this.file = path.join(process.cwd(), dataDir, 'tasks.json');
  }

  async init(): Promise<void> {
    const dir = path.dirname(this.file);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    if (existsSync(this.file)) {
      try {
        const raw = await readFile(this.file, 'utf-8');
        const list = JSON.parse(raw) as Task[];
        for (const t of list) {
          this.tasks.set(t.id, t);
        }
        console.log(`[store] 已加载 ${list.length} 条历史任务`);
      } catch (err) {
        console.warn('[store] 数据文件解析失败，将重建：', (err as Error).message);
      }
    }
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  list(limit = 100, status?: string): Task[] {
    let items = Array.from(this.tasks.values());
    if (status) items = items.filter((t) => t.status === status);
    items.sort((a, b) => b.createdAt - a.createdAt);
    return items.slice(0, limit);
  }

  put(task: Task): Task {
    task.updatedAt = Date.now();
    this.tasks.set(task.id, task);
    this.scheduleSave();
    return task;
  }

  remove(id: string): boolean {
    const ok = this.tasks.delete(id);
    this.scheduleSave();
    return ok;
  }

  usage(): UsageInfo {
    const totalTasks = this.tasks.size;
    let usedSec = 0;
    for (const t of this.tasks.values()) {
      if (t.status === 'completed') usedSec += t.durationSec;
    }
    const freeSec = FREE_MINUTES * 60;
    const remaining = Math.max(0, freeSec - usedSec);
    return {
      freeMinutes: FREE_MINUTES,
      usedMinutes: Math.round((usedSec / 60) * 10) / 10,
      remainingMinutes: Math.round((remaining / 60) * 10) / 10,
      totalTasks,
    };
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.save();
    }, 400);
  }

  private async save(): Promise<void> {
    try {
      const dir = path.dirname(this.file);
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });
      const tmp = `${this.file}.${Date.now()}.tmp`;
      await writeFile(tmp, JSON.stringify(Array.from(this.tasks.values()), null, 2), 'utf-8');
      await rename(tmp, this.file);
    } catch (err) {
      console.error('[store] 落盘失败：', (err as Error).message);
    }
  }
}

export const store = new TaskStore(process.env.DATA_DIR ?? 'data');
