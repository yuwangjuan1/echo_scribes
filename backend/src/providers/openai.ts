import { config } from '../config.js';
import { ProviderNotConfiguredError, type TranscribeContext, type TranscribeInput, type TranscribeResult, type TranscriptionProvider } from './provider.js';
import { segmentsFromLines, templateFor } from '../lib/templates.js';
import type { PlatformId } from '../types.js';

export class OpenAiWhisperProvider implements TranscriptionProvider {
  readonly name = 'openai-whisper';
  readonly isDemo = false;

  async transcribe(input: TranscribeInput, ctx: TranscribeContext): Promise<TranscribeResult> {
    if (!config.openai.apiKey) {
      throw new ProviderNotConfiguredError('未配置 OPENAI_API_KEY，无法使用 OpenAI Whisper 引擎');
    }
    if (!input.buffer || !input.fileName) {
      throw new ProviderNotConfiguredError('OpenAI Whisper 引擎当前仅支持上传文件转写；链接转写需部署流媒体下载服务（如 yt-dlp）后启用');
    }

    ctx.onProgress(15, '上传文件至 Whisper');

    const form = new FormData();
    const mime = input.mimeType && input.mimeType.startsWith('audio') ? input.mimeType : 'audio/mpeg';
    form.append('file', new Blob([new Uint8Array(input.buffer)], { type: mime }), input.fileName);
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('language', 'zh');

    ctx.onProgress(45, '语音识别中（Whisper）');

    const res = await fetch(`${config.openai.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.openai.apiKey}` },
      body: form,
      signal: ctx.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Whisper API 调用失败（${res.status}）：${text.slice(0, 200)}`);
    }

    ctx.onProgress(85, '生成时间轴');
    const data = (await res.json()) as {
      text?: string;
      duration?: number;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    const rawSegments = data.segments?.length
      ? data.segments.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }))
      : segmentsFromLines((data.text ?? '').split(/[。！？.!?]/).filter((s) => s.trim().length > 0));

    return {
      title: input.fileName,
      durationSec: Math.round((data.duration ?? rawSegments[rawSegments.length - 1]?.end ?? 0) * 10) / 10,
      segments: rawSegments,
      engine: this.name,
    };
  }
}
