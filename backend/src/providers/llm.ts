import { config } from '../config.js';
import type { Insights } from '../types.js';
import { ProviderError } from './provider.js';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface ChatResponse {
  choices?: Array<{ message?: AssistantMessage }>;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface AssistantMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface ToolSpec {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type AgentMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | AssistantMessage
  | { role: 'tool'; tool_call_id: string; content: string };

const MAX_CHARS = 12000;

const INSIGHTS_SYSTEM = [
  '你是视频文案分析助手。基于给定的视频转写文本输出严格 JSON（禁止 markdown 代码块），结构：',
  '{"title":"更精准的视频标题（不超过20字）","overview":"120-200字内容概述","keypoints":["要点1","要点2","要点3","要点4","要点5"],"tags":["标签1","标签2","标签3","标签4","标签5"]}',
  '要求：keypoints 4-6 条且每条不超过 40 字；tags 4-6 个短词；标题、概述、要点、标签全部使用中文。',
].join('\n');

export class LlmClient {
  get enabled(): boolean {
    return Boolean(config.llm.apiKey);
  }

  get model(): string {
    return config.llm.model;
  }

  async enhanceInsights(
    fullText: string,
    platformLabel: string,
    title: string,
    signal?: AbortSignal,
  ): Promise<Insights> {
    const content = await this.chat(
      [
        { role: 'system', content: INSIGHTS_SYSTEM },
        {
          role: 'user',
          content: `视频平台：${platformLabel}\n原始标题：${title || '（无）'}\n\n转写文本：\n${this.clip(fullText)}`,
        },
      ],
      signal,
      1600,
    );
    return this.parseInsights(content);
  }

  async translate(text: string, target: string, signal?: AbortSignal): Promise<string> {
    const targetLabel = target.trim() || '英语';
    return this.chat(
      [
        {
          role: 'system',
          content: `你是专业字幕译者。把用户提供的视频转写文本完整翻译成${targetLabel}：保持原有分段结构逐段翻译，译文中不得残留任何原文词汇，只输出译文，不要附加解释。`,
        },
        { role: 'user', content: this.clip(text) },
      ],
      signal,
      4000,
    );
  }

  private clip(text: string): string {
    return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n…（内容过长已截断）` : text;
  }

  private async postChat(
    body: Record<string, unknown>,
    signal: AbortSignal | undefined,
  ): Promise<AssistantMessage> {
    if (!this.enabled) {
      throw new ProviderError('未配置 LLM_API_KEY，无法调用文本大模型', 'llm_not_configured');
    }

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), config.llm.timeoutMs);

    try {
      const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.llm.apiKey}`,
        },
        body: JSON.stringify({ model: config.llm.model, ...body }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 200);
        throw new ProviderError(
          `LLM 接口返回 ${res.status}：${detail || res.statusText}`,
          'llm_request_failed',
        );
      }

      const data = (await res.json()) as ChatResponse;
      const message = data.choices?.[0]?.message;
      if (!message) throw new ProviderError('LLM 返回内容为空', 'llm_empty_response');
      return message;
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (controller.signal.aborted) {
        throw new ProviderError(
          signal?.aborted ? '任务已取消' : `LLM 请求超时（${Math.round(config.llm.timeoutMs / 1000)}s）`,
          signal?.aborted ? 'llm_cancelled' : 'llm_timeout',
        );
      }
      throw new ProviderError(
        `LLM 请求失败：${err instanceof Error ? err.message : String(err)}`,
        'llm_request_failed',
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  private async chat(
    messages: ChatMessage[],
    signal: AbortSignal | undefined,
    maxTokens: number,
  ): Promise<string> {
    const message = await this.postChat({ messages, temperature: 0.4, max_tokens: maxTokens }, signal);
    const content = message.content?.trim();
    if (!content) throw new ProviderError('LLM 返回内容为空', 'llm_empty_response');
    return content;
  }

  async chatWithTools(
    messages: AgentMessage[],
    tools: ToolSpec[],
    signal?: AbortSignal,
  ): Promise<AssistantMessage> {
    return this.postChat({ messages, tools, temperature: 0.3, max_tokens: 1800 }, signal);
  }

  private parseInsights(content: string): Insights {
    let raw = content.trim();
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) raw = fence[1].trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) raw = raw.slice(start, end + 1);

    let parsed: { title?: unknown; overview?: unknown; keypoints?: unknown; tags?: unknown };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      throw new ProviderError('LLM 返回的 insights JSON 解析失败', 'llm_bad_json');
    }

    const strArr = (value: unknown): string[] =>
      Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim())
        : [];

    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const overview = typeof parsed.overview === 'string' ? parsed.overview.trim() : '';
    const keypoints = strArr(parsed.keypoints);
    const tags = strArr(parsed.tags)
      .map((t) => t.replace(/^#/, '').replace(/\s+/g, ''))
      .filter(Boolean);

    if (!overview && keypoints.length === 0) {
      throw new ProviderError('LLM 返回的 insights 内容为空', 'llm_bad_json');
    }

    return {
      title,
      overview: overview || keypoints.join('；'),
      keypoints,
      tags,
    };
  }
}

export const llm = new LlmClient();
