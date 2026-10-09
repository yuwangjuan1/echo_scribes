import { Router } from 'express';
import multer from 'multer';
import { newTaskId, randomBetween } from '../lib/id.js';
import { detectPlatform, parseLinksPayload } from '../lib/links.js';
import { store } from '../store.js';
import { queue } from '../services/queue.js';
import { MAX_BATCH, MAX_UPLOAD_BYTES, FREE_MINUTES } from '../config.js';
import type { PlatformId, Task } from '../types.js';
import type { SubmitLinksBody } from '../types.js';

export const transcribeRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

function remainingSeconds(): number {
  const usage = store.usage();
  return Math.round(usage.remainingMinutes * 60);
}

function createLinkTask(url: string, aiEnhance: boolean): Task {
  const platform = detectPlatform(url);
  const estimatedSec = Math.round(randomBetween(45, 210));
  const task: Task = {
    id: newTaskId(),
    sourceType: 'link',
    url,
    platform: platform.id as PlatformId,
    platformLabel: platform.label,
    title: '链接解析中…',
    durationSec: 0,
    status: 'queued',
    progress: 0,
    stage: '排队中',
    aiEnhance,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return task;
}

transcribeRouter.post('/links', (req, res) => {
  const body = (req.body ?? {}) as SubmitLinksBody;
  const aiEnhance = Boolean(body.aiEnhance);
  const { urls, invalid } = parseLinksPayload(body.links ?? '');

  if (urls.length === 0) {
    res.status(400).json({ error: '未识别到有效的视频链接，请粘贴包含 https:// 的公开视频链接' });
    return;
  }
  if (urls.length > MAX_BATCH) {
    res.status(400).json({ error: `单次最多提交 ${MAX_BATCH} 条链接` });
    return;
  }

  const remaining = remainingSeconds();
  if (remaining < Math.min(30, urls.length * 8)) {
    res.status(402).json({
      error: `免费转写额度不足（剩余 ${Math.round((remaining / 60) * 10) / 10} 分钟），请先清理历史任务或购买额度`,
      usage: store.usage(),
    });
    return;
  }

  const tasks = urls.map((url) => createLinkTask(url, aiEnhance));
  for (const task of tasks) {
    store.put(task);
    queue.enqueue(task.id);
  }

  console.log(`[transcribe] 收到 ${tasks.length} 条链接转写请求，剩余额度 ${Math.round(remaining)}s`);
  res.status(201).json({ tasks, invalid, usage: store.usage() });
});

transcribeRouter.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const aiEnhance = String(req.body?.aiEnhance ?? 'true') === 'true';

  if (!file) {
    res.status(400).json({ error: '未收到上传文件，请选择音频或视频文件（字段名 file）' });
    return;
  }
  if (remainingSeconds() < 30) {
    res.status(402).json({ error: '免费转写额度不足，请清理历史任务或购买额度', usage: store.usage() });
    return;
  }

  const safeName = file.originalname.replace(/[\r\n"<>|/\\:*?]/g, '_').slice(0, 80) || '未命名文件';
  const task: Task = {
    id: newTaskId(),
    sourceType: 'upload',
    fileName: safeName,
    fileSize: file.size,
    platform: 'file',
    platformLabel: '本地文件',
    title: safeName,
    durationSec: 0,
    status: 'queued',
    progress: 0,
    stage: '排队中',
    aiEnhance,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  store.put(task);
  queue.enqueue(task.id);

  queue.attachBuffer?.(task.id, {
    buffer: file.buffer,
    mimeType: file.mimetype,
    fileName: safeName,
  });

  console.log(`[transcribe] 收到上传文件 ${safeName}（${(file.size / 1024 / 1024).toFixed(2)} MB）`);
  res.status(201).json({ task, usage: store.usage() });
});

export { FREE_MINUTES };
