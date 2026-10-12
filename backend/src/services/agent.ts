import { llm, type AgentMessage, type ToolCall, type ToolSpec } from '../providers/llm.js';
import { ProviderError } from '../providers/provider.js';
import type { AgentHighlight, AgentReport, AgentStep, Transcript } from '../types.js';

const MAX_STEPS = 6;
const PREVIEW_CHARS = 240;
const BODY_CHARS = 4000;

const AGENT_SYSTEM = [
  '你是视频内容分析 Agent。你只能通过工具获取带时间码的原文证据，自主决定调用哪些工具、调用几次。',
  '工作规则：',
  '1. 先用 top_keywords / transcript_stats 把握全貌，再用 search_transcript 或 get_time_range 检索关键证据；',
  '2. highlights 必须引用工具返回的真实原文与时间码，禁止编造时间码或原文；timecode 使用 mm:ss 格式（如 02:35）；',
  '3. 完成分析后输出严格 JSON（禁止 markdown 代码块），结构：',
  '{"title":"更精准的视频标题（不超过20字）","overview":"150-250字内容概述","keypoints":["要点1","要点2","要点3","要点4","要点5"],"tags":["标签1","标签2","标签3","标签4","标签5"],"highlights":[{"timecode":"mm:ss","quote":"原文金句","reason":"值得看的理由"}]}',
  '4. keypoints 4-6 条且每条不超过 40 字；tags 4-6 个短词；highlights 2-4 条；全部使用中文。',
].join('\n');

interface AgentContext {
  transcript: Transcript;
  platformLabel: string;
  title: string;
}

interface ToolDef {
  spec: ToolSpec;
  run(args: Record<string, unknown>, ctx: AgentContext): string;
}

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function str(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  return typeof v === 'string' ? v.trim() : '';
}

function num(args: Record<string, unknown>, key: string): number {
  const v = args[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : Number.NaN;
}

const TOOLS: ToolDef[] = [
  {
    spec: {
      type: 'function',
      function: {
        name: 'search_transcript',
        description:
          '在视频转写文本中检索包含关键词的句子，返回句子及时间码（用于定位证据与精彩片段）',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string', description: '检索关键词（2-10 字）' },
            limit: { type: 'number', description: '最多返回条数，默认 6' },
          },
          required: ['keyword'],
        },
      },
    },
    run(args, ctx) {
      const keyword = str(args, 'keyword');
      if (!keyword) return JSON.stringify({ error: 'keyword 不能为空' });
      const n = num(args, 'limit');
      const limit = Number.isFinite(n) ? Math.min(20, Math.max(1, Math.round(n))) : 6;
      const results = ctx.transcript.segments
        .filter((s) => s.text.includes(keyword))
        .slice(0, limit)
        .map((s) => ({ timecode: fmtClock(s.start), text: s.text }));
      return JSON.stringify({ keyword, matches: results.length, results });
    },
  },
  {
    spec: {
      type: 'function',
      function: {
        name: 'transcript_stats',
        description: '获取转写文本统计信息：总时长、句子数、总字数、平均句长',
        parameters: { type: 'object', properties: {} },
      },
    },
    run(_args, ctx) {
      const chars = ctx.transcript.fullText.replace(/\s/g, '').length;
      const sentences = ctx.transcript.segments.length;
      return JSON.stringify({
        durationSec: ctx.transcript.durationSec,
        sentences,
        chars,
        avgSentenceChars: sentences > 0 ? Math.round(chars / sentences) : 0,
      });
    },
  },
  {
    spec: {
      type: 'function',
      function: {
        name: 'get_time_range',
        description: '获取指定时间范围内的转写原文（含时间码），跨度不超过 300 秒',
        parameters: {
          type: 'object',
          properties: {
            startSec: { type: 'number', description: '起始秒' },
            endSec: { type: 'number', description: '结束秒' },
          },
          required: ['startSec', 'endSec'],
        },
      },
    },
    run(args, ctx) {
      const start = num(args, 'startSec');
      const end = num(args, 'endSec');
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return JSON.stringify({ error: 'startSec/endSec 无效' });
      }
      const results = ctx.transcript.segments
        .filter((s) => s.end >= start && s.start <= end && end - start <= 300)
        .slice(0, 30)
        .map((s) => ({ timecode: fmtClock(s.start), text: s.text }));
      return JSON.stringify({ range: [start, end], results });
    },
  },
  {
    spec: {
      type: 'function',
      function: {
        name: 'top_keywords',
        description: '统计转写文本高频词（2-4 字中文词元与英文单词），用于快速把握主题',
        parameters: {
          type: 'object',
          properties: {
            count: { type: 'number', description: '返回词数，默认 12' },
          },
        },
      },
    },
    run(args, ctx) {
      const n = num(args, 'count');
      const count = Number.isFinite(n) ? Math.min(30, Math.max(3, Math.round(n))) : 12;
      const freq = new Map<string, number>();
      const tokens = ctx.transcript.fullText.match(/[\u4e00-\u9fa5]{2,4}|[A-Za-z]{2,}/g) ?? [];
      for (const t of tokens) {
        freq.set(t, (freq.get(t) ?? 0) + 1);
      }
      const top = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([word, c]) => ({ word, count: c }));
      return JSON.stringify({ top });
    },
  },
];

interface ParsedReport {
  title: string;
  overview: string;
  keypoints: string[];
  tags: string[];
  highlights: AgentHighlight[];
}

function resolveHighlights(highlights: AgentHighlight[], transcript: Transcript): AgentHighlight[] {
  return highlights.map((h) => {
    const probe = h.quote.trim().slice(0, 14);
    if (!probe) return { ...h, timecode: '' };
    const seg = transcript.segments.find((s) => s.text.includes(probe));
    return seg ? { ...h, timecode: fmtClock(seg.start) } : { ...h, timecode: '' };
  });
}

function parseReport(content: string, transcript: Transcript): ParsedReport {
  let raw = content.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);

  let parsed: {
    title?: unknown;
    overview?: unknown;
    keypoints?: unknown;
    tags?: unknown;
    highlights?: unknown;
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new ProviderError('Agent 最终报告 JSON 解析失败', 'agent_bad_json');
  }

  const strArr = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim())
      : [];

  const overview = typeof parsed.overview === 'string' ? parsed.overview.trim() : '';
  const keypoints = strArr(parsed.keypoints);
  if (!overview && keypoints.length === 0) {
    throw new ProviderError('Agent 最终报告内容为空', 'agent_bad_json');
  }

  const highlights: AgentHighlight[] = Array.isArray(parsed.highlights)
    ? parsed.highlights
        .filter((h): h is Record<string, unknown> => typeof h === 'object' && h !== null)
        .map((h) => ({
          timecode: typeof h.timecode === 'string' ? h.timecode.trim() : '',
          quote: typeof h.quote === 'string' ? h.quote.trim() : '',
          reason: typeof h.reason === 'string' ? h.reason.trim() : '',
        }))
        .filter((h) => h.quote || h.reason)
        .slice(0, 4)
    : [];

  return {
    title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
    overview: overview || keypoints.join('；'),
    keypoints,
    tags: strArr(parsed.tags)
      .map((t) => t.replace(/^#/, '').replace(/\s+/g, ''))
      .filter(Boolean),
    highlights: resolveHighlights(highlights, transcript),
  };
}

function executeTool(call: ToolCall, ctx: AgentContext): { content: string; step: AgentStep } {
  const started = Date.now();
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
  } catch {
    args = {};
  }
  const tool = TOOLS.find((t) => t.spec.function.name === call.function.name);
  let content: string;
  if (!tool) {
    content = JSON.stringify({ error: `未知工具：${call.function.name}` });
  } else {
    try {
      content = tool.run(args, ctx);
    } catch (err) {
      content = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  }
  return {
    content,
    step: {
      tool: call.function.name,
      args,
      preview: content.length > PREVIEW_CHARS ? `${content.slice(0, PREVIEW_CHARS)}…` : content,
      ms: Date.now() - started,
    },
  };
}

export async function runAgent(ctx: AgentContext, signal?: AbortSignal): Promise<AgentReport> {
  if (!llm.enabled) {
    throw new ProviderError('未配置 LLM_API_KEY，无法运行 Agent 分析', 'llm_not_configured');
  }
  const started = Date.now();
  const bodyText =
    ctx.transcript.fullText.length > BODY_CHARS
      ? `${ctx.transcript.fullText.slice(0, BODY_CHARS)}\n…（全文更长，可用工具检索其余内容）`
      : ctx.transcript.fullText;

  const messages: AgentMessage[] = [
    { role: 'system', content: AGENT_SYSTEM },
    {
      role: 'user',
      content: `视频平台：${ctx.platformLabel}\n原始标题：${ctx.title || '（无）'}\n\n转写全文（未含时间码）：\n${bodyText}`,
    },
  ];

  const steps: AgentStep[] = [];
  const specs = TOOLS.map((t) => t.spec);

  for (let round = 0; round < MAX_STEPS; round++) {
    const message = await llm.chatWithTools(messages, specs, signal);
    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls,
      });
      for (const call of message.tool_calls) {
        const { content, step } = executeTool(call, ctx);
        steps.push(step);
        messages.push({ role: 'tool', tool_call_id: call.id, content });
      }
      continue;
    }
    const content = (message.content ?? '').trim();
    if (!content) throw new ProviderError('Agent 未产出最终报告', 'agent_no_final');
    return {
      model: llm.model,
      elapsedMs: Date.now() - started,
      steps,
      ...parseReport(content, ctx.transcript),
    };
  }
  throw new ProviderError(`Agent 超过最大推理轮数（${MAX_STEPS}）仍未完成`, 'agent_max_steps');
}
