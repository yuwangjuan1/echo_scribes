import { Router } from 'express';
import { store } from '../store.js';
import { queue } from '../services/queue.js';
import { sseBus, type SsePayload } from '../services/sse.js';
import { exportContent } from '../lib/subtitles.js';

export const tasksRouter = Router();

tasksRouter.get('/', (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
  const status = typeof req.query.status === 'string' && req.query.status ? req.query.status : undefined;
  const tasks = store.list(limit, status);
  res.json({ tasks });
});

tasksRouter.get('/:id', (req, res) => {
  const task = store.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在或已被删除' });
    return;
  }
  res.json({ task });
});

tasksRouter.get('/:id/export', (req, res) => {
  const task = store.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在或已被删除' });
    return;
  }
  if (task.status !== 'completed' || !task.transcript) {
    res.status(409).json({ error: '任务尚未转写完成，暂不可导出' });
    return;
  }
  const format = String(req.query.format ?? 'txt').toLowerCase();
  const content = exportContent(task, format);
  if (!content) {
    res.status(400).json({ error: `不支持的导出格式：${format}（可选 txt / srt / vtt / md）` });
    return;
  }
  const baseName = (task.insights?.title ?? task.title).replace(/[\r\n"<>|/\\:*?]/g, '_').slice(0, 60) || task.id;
  res.setHeader('Content-Type', `${content.mime}; charset=utf-8`);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(baseName)}.${content.ext}"`);
  res.send(content.body);
});

tasksRouter.get('/:id/events', (req, res) => {
  const task = store.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在或已被删除' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (payload: SsePayload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send({
    type: 'progress',
    taskId: task.id,
    progress: task.progress,
    stage: task.stage,
    ts: Date.now(),
    ...(task.status === 'completed' || task.status === 'failed' ? { task } : {}),
  });

  if (task.status === 'completed') {
    send({ type: 'completed', taskId: task.id, task, ts: Date.now() });
    res.end();
    return;
  }
  if (task.status === 'failed') {
    send({ type: 'failed', taskId: task.id, task, error: task.error, ts: Date.now() });
    res.end();
    return;
  }

  const unsubscribe = sseBus.subscribe(task.id, send);
  const heartbeat = setInterval(() => send({ type: 'ping', taskId: task.id, ts: Date.now() }), 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

tasksRouter.delete('/:id', (req, res) => {
  const task = store.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在或已被删除' });
    return;
  }
  queue.cancel(task.id);
  store.remove(task.id);
  res.json({ ok: true });
});
