import type { PlatformId } from '../types.js';
import { randomBetween } from '../lib/id.js';
import { segmentsFromLines, templateFor } from '../lib/templates.js';
import type { TranscribeContext, TranscribeInput, TranscribeResult, TranscriptionProvider } from './provider.js';

const STAGE_PLAN: Array<{ stage: string; to: number }> = [
  { stage: '解析链接', to: 12 },
  { stage: '获取音频流', to: 34 },
  { stage: '语音识别中', to: 78 },
  { stage: '生成时间轴', to: 94 },
];

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('任务已取消'));
      },
      { once: true },
    );
  });
}

export class MockProvider implements TranscriptionProvider {
  readonly name = 'demo-engine';
  readonly isDemo = true;

  async transcribe(input: TranscribeInput, ctx: TranscribeContext): Promise<TranscribeResult> {
    const template = templateFor(input.platform as PlatformId);
    const totalMs = randomBetween(9000, 14000);
    const stepMs = Math.max(450, Math.round(totalMs / 26));
    let progress = 3;
    ctx.onProgress(progress, '任务已入队');

    for (const plan of STAGE_PLAN) {
      while (progress < plan.to) {
        await sleep(stepMs, ctx.signal);
        progress = Math.min(plan.to, progress + randomBetween(1.5, 4.5));
        ctx.onProgress(Math.round(progress * 10) / 10, plan.stage);
      }
    }

    const segments = segmentsFromLines(template.lines);
    const durationSec = Math.round(segments[segments.length - 1].end * 10) / 10;

    return {
      title: template.title,
      durationSec,
      segments,
      engine: this.name,
    };
  }
}
