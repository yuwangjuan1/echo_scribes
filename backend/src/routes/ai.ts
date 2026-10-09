import { Router } from 'express';
import { store } from '../store.js';
import type { AiAction } from '../types.js';

export const aiRouter = Router();

aiRouter.post('/enhance', (req, res) => {
  const { taskId, action, target } = (req.body ?? {}) as {
    taskId?: string;
    action?: AiAction;
    target?: string;
  };

  if (!taskId || !action) {
    res.status(400).json({ error: '参数缺失：需要 taskId 与 action（summary / keypoints / translate）' });
    return;
  }

  const task = store.get(taskId);
  if (!task) {
    res.status(404).json({ error: '任务不存在或已被删除' });
    return;
  }
  if (task.status !== 'completed' || !task.transcript) {
    res.status(409).json({ error: '任务尚未转写完成，无法执行 AI 增强' });
    return;
  }

  const insights = task.insights;
  if (!insights) {
    res.status(409).json({ error: '该任务创建时未开启 AI 增强，可在控制台重新提交并勾选' });
    return;
  }

  const engine = task.engine ?? 'demo-engine';

  if (action === 'summary') {
    res.json({
      action,
      taskId,
      demo: task.engine === undefined,
      engine,
      title: insights.title,
      overview: insights.overview,
      tags: insights.tags,
    });
    return;
  }

  if (action === 'keypoints') {
    res.json({
      action,
      taskId,
      demo: task.engine === undefined,
      engine,
      keypoints: insights.keypoints,
    });
    return;
  }

  if (action === 'translate') {
    res.status(501).json({
      error: '翻译需要接入大语言模型（在 .env 配置 PROVIDER=openai 或后续接入 LLM Key 后可用），当前本地引擎暂不支持该动作',
    });
    return;
  }

  res.status(400).json({ error: `不支持的 AI 动作：${action}` });
});
