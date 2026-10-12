import { Router } from 'express';
import { store } from '../store.js';
import { llm } from '../providers/llm.js';
import { runAgent } from '../services/agent.js';
import type { AiAction } from '../types.js';

export const aiRouter = Router();

aiRouter.post('/enhance', async (req, res) => {
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

  if (action === 'translate') {
    if (!llm.enabled) {
      res.status(501).json({
        error:
          '翻译需要文本大模型支持：请在 backend/.env 配置 LLM_API_KEY（智谱 / DeepSeek / OpenAI 均可）后重启服务',
      });
      return;
    }
    const targetLang = typeof target === 'string' && target.trim() ? target.trim() : '英语';
    try {
      const text = await llm.translate(task.transcript.fullText, targetLang);
      res.json({
        action,
        taskId,
        engine: llm.model,
        target: targetLang,
        text,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: `翻译失败：${message}` });
    }
    return;
  }

  if (action === 'agent') {
    if (!llm.enabled) {
      res.status(501).json({
        error:
          'Agent 分析需要文本大模型支持：请在 backend/.env 配置 LLM_API_KEY（智谱 / DeepSeek / OpenAI 均可）后重启服务',
      });
      return;
    }
    try {
      const report = await runAgent({
        transcript: task.transcript,
        platformLabel: task.platformLabel,
        title: task.title,
      });
      task.agentReport = report;
      store.put(task);
      res.json({ action, taskId, engine: report.model, agent: report });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: `Agent 分析失败：${message}` });
    }
    return;
  }

  const insights = task.insights;
  if (!insights) {
    res.status(409).json({ error: '该任务创建时未开启 AI 增强，可在控制台重新提交并勾选' });
    return;
  }

  const engine = task.insightEngine ?? task.engine ?? 'demo-engine';

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

  res.status(400).json({ error: `不支持的 AI 动作：${action}` });
});
