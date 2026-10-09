import { Router } from 'express';
import { PLATFORMS } from '../lib/links.js';
import { store } from '../store.js';
import { getProvider } from '../providers/index.js';
import { FREE_MINUTES } from '../config.js';
import type { PricingPlan } from '../types.js';

export const metaRouter = Router();

const PRICING: PricingPlan[] = [
  {
    id: 'trial',
    name: '免费试用',
    priceCny: 0,
    minutes: FREE_MINUTES,
    unit: '分钟',
    tagline: '注册即得，无需绑卡，跑通全流程',
    features: [`${FREE_MINUTES} 分钟转写额度`, 'AI 摘要与要点提取', 'TXT / SRT / VTT / MD 导出', '单次最多 100 条链接', '任务历史记录'],
  },
  {
    id: 'starter',
    name: '基础包',
    priceCny: 19,
    minutes: 120,
    unit: '分钟',
    tagline: '个人创作者的日常生产力',
    features: ['120 分钟转写额度', 'AI 摘要 / 要点 / 标签', '批量任务与优先队列', '上传本地音视频转写', '30 天任务保存'],
    highlight: true,
  },
  {
    id: 'pro',
    name: '专业包',
    priceCny: 79,
    minutes: 600,
    unit: '分钟',
    tagline: '团队与内容矩阵的弹药库',
    features: ['600 分钟转写额度', '优先转写通道', 'API 接入（10 QPS）', '批量导出与 Webhook 回调', '90 天任务保存', '工单支持'],
  },
  {
    id: 'business',
    name: '企业定制',
    priceCny: -1,
    minutes: -1,
    unit: '',
    tagline: '私有化部署与专属 SLA',
    features: ['分钟数与并发按需定制', '私有化 ASR 引擎接入', '专属域名与品牌定制', 'SLA 保障与专属客户成功', '私有化部署支持'],
  },
];

metaRouter.get('/platforms', (_req, res) => {
  res.json({ platforms: PLATFORMS });
});

metaRouter.get('/pricing', (_req, res) => {
  res.json({ plans: PRICING });
});

metaRouter.get('/usage', (_req, res) => {
  res.json({ usage: store.usage() });
});

metaRouter.get('/health', (_req, res) => {
  const { provider } = getProvider();
  res.json({ ok: true, provider: provider.name, demo: provider.isDemo, ts: Date.now() });
});

export { PRICING };
