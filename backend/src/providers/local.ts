import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import type { Insights, TranscriptSegment } from '../types.js';
import type { TranscribeContext, TranscribeInput, TranscribeResult, TranscriptionProvider } from './provider.js';
import { ProviderError } from './provider.js';

const TRANSCRIBER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../transcriber');
const SCRIPT_PATH = path.join(TRANSCRIBER_DIR, 'transcriber.py');
const OVERALL_TIMEOUT_MS = 40 * 60 * 1000;

const EXT_BY_MIME: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/webm': '.webm',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

function killTree(pid: number): void {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* 已退出 */
      }
    }
  }
}

function guessExt(input: TranscribeInput): string {
  if (input.fileName && path.extname(input.fileName)) return path.extname(input.fileName).toLowerCase();
  const mime = (input.mimeType ?? '').split(';')[0].trim();
  return EXT_BY_MIME[mime] ?? '.mp3';
}

interface PythonEvent {
  type: 'progress' | 'meta' | 'error';
  progress?: number;
  stage?: string;
  title?: string;
  duration?: number;
  error?: string;
  code?: string;
}

interface PythonResult {
  ok: boolean;
  error?: string;
  code?: string;
  title: string;
  duration: number;
  language?: string;
  segments: Array<{ start: number; end: number; text: string }>;
  wordCount?: number;
  insights?: Insights;
}

export class LocalWhisperProvider implements TranscriptionProvider {
  readonly name = 'faster-whisper';
  readonly isDemo = false;

  async transcribe(input: TranscribeInput, ctx: TranscribeContext): Promise<TranscribeResult> {
    if (!fs.existsSync(SCRIPT_PATH)) {
      throw new Error(`转写引擎脚本不存在：${SCRIPT_PATH}`);
    }

    let tempFile: string | null = null;
    const args: string[] = [SCRIPT_PATH];

    if (input.url) {
      args.push('--url', input.url);
    } else if (input.buffer) {
      tempFile = path.join(os.tmpdir(), `echoscribe_upload_${randomUUID()}${guessExt(input)}`);
      fs.writeFileSync(tempFile, input.buffer);
      args.push('--file', tempFile);
    } else {
      throw new Error('缺少视频链接或音频文件');
    }

    args.push('--model', config.whisper.model);
    args.push('--device', config.whisper.device);
    args.push('--compute-type', config.whisper.computeType);
    if (input.aiEnhance === false) args.push('--no-ai');

    const child = spawn(config.pythonBin, args, {
      cwd: TRANSCRIBER_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      detached: process.platform !== 'win32',
    });

    let settled = false;
    let stderrBuf = '';
    let stdoutBuf = '';

    const cleanup = () => {
      if (tempFile) fs.rm(tempFile, { force: true }, () => undefined);
    };

    return new Promise<TranscribeResult>((resolve, reject) => {
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        ctx.signal?.removeEventListener('abort', onAbort);
        cleanup();
        fn();
      };

      const timer = setTimeout(() => {
        killTree(child.pid ?? 0);
        finish(() => reject(new Error('转写超时（40 分钟），请尝试较短的视频或本地文件')));
      }, OVERALL_TIMEOUT_MS);

      const onAbort = () => {
        killTree(child.pid ?? 0);
        finish(() => reject(new Error('任务已取消')));
      };
      ctx.signal?.addEventListener('abort', onAbort, { once: true });

      child.on('error', (err) => {
        finish(() =>
          reject(
            new Error(
              `无法启动 Python 转写引擎（${config.pythonBin}）：${err.message}。请确认 PYTHON_BIN 指向可用的 Python 3.10+`,
            ),
          ),
        );
      });

      child.stderr.setEncoding('utf-8');
      child.stderr.on('data', (chunk: string) => {
        stderrBuf += chunk;
        const lines = stderrBuf.split(/\r?\n/);
        stderrBuf = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('{')) continue;
          try {
            const ev = JSON.parse(trimmed) as PythonEvent;
            if (ev.type === 'progress' && typeof ev.progress === 'number') {
              ctx.onProgress(ev.progress, ev.stage ?? '处理中');
            } else if (ev.type === 'meta' && ev.title) {
              ctx.onProgress(10, '已获取视频信息');
            } else if (ev.type === 'error') {
              finish(() => reject(new ProviderError(ev.error ?? '转写引擎执行失败', ev.code)));
              killTree(child.pid ?? 0);
            }
          } catch {
            /* 忽略非 JSON 行 */
          }
        }
      });

      child.stdout.setEncoding('utf-8');
      child.stdout.on('data', (chunk: string) => {
        stdoutBuf += chunk;
      });

      child.on('close', (code) => {
        const payload = stdoutBuf.trim().split(/\r?\n/).pop() ?? '';
        if (code === 0 && payload.startsWith('{')) {
          try {
            const parsed = JSON.parse(payload) as PythonResult;
            if (!parsed.ok || !Array.isArray(parsed.segments) || parsed.segments.length === 0) {
              finish(() => reject(new ProviderError(parsed.error ?? '未识别到语音内容', parsed.code)));
              return;
            }
            const segments: TranscriptSegment[] = parsed.segments.map((s) => ({
              start: s.start,
              end: s.end,
              text: s.text,
            }));
            finish(() =>
              resolve({
                title: parsed.title,
                durationSec: Math.round(parsed.duration * 10) / 10,
                segments,
                engine: this.name,
                language: parsed.language,
                insights: parsed.insights,
              }),
            );
            return;
          } catch {
            /* fallthrough */
          }
        }
        const hint = stderrBuf.trim().split(/\r?\n/).filter(Boolean).slice(-3).join(' | ');
        finish(() =>
          reject(new Error(hint || `转写进程异常退出（code ${code}）`)),
        );
      });
    });
  }
}
