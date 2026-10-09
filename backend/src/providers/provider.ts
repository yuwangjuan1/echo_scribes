import type { Insights, TranscriptSegment } from '../types.js';

export interface TranscribeInput {
  platform: string;
  platformLabel: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  buffer?: Buffer;
  mimeType?: string;
  aiEnhance?: boolean;
  signal?: AbortSignal;
}

export interface TranscribeContext {
  onProgress: (progress: number, stage: string) => void;
  signal?: AbortSignal;
}

export interface TranscribeResult {
  title: string;
  durationSec: number;
  segments: TranscriptSegment[];
  engine: string;
  language?: string;
  insights?: Insights;
}

export interface TranscriptionProvider {
  readonly name: string;
  readonly isDemo: boolean;
  transcribe(input: TranscribeInput, ctx: TranscribeContext): Promise<TranscribeResult>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderNotConfiguredError';
  }
}

export class ProviderError extends Error {
  readonly code: string;

  constructor(message: string, code = 'engine_failed') {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}

export const ERROR_CODES = [
  'cookies_required',
  'login_required',
  'video_unavailable',
  'no_speech',
  'duration_limit',
  'download_failed',
  'embed_unsupported',
  'media_unreadable',
  'quota_exceeded',
  'engine_failed',
] as const;
