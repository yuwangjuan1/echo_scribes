export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  segments: TranscriptSegment[];
  fullText: string;
  wordCount: number;
  durationSec: number;
}

export interface Insights {
  title: string;
  overview: string;
  keypoints: string[];
  tags: string[];
}

export interface Task {
  id: string;
  sourceType: 'link' | 'upload';
  url?: string;
  fileName?: string;
  fileSize?: number;
  platform: string;
  platformLabel: string;
  title: string;
  durationSec: number;
  status: TaskStatus;
  progress: number;
  stage: string;
  aiEnhance: boolean;
  engine?: string;
  language?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
  errorCode?: string;
  transcript?: Transcript;
  insights?: Insights;
}

export interface UsageInfo {
  freeMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  totalTasks: number;
}

export interface PlatformMeta {
  id: string;
  label: string;
  domains: string[];
  color: string;
  popular: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  priceCny: number;
  minutes: number;
  unit: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export interface SseMessage {
  type: 'progress' | 'completed' | 'failed' | 'ping';
  taskId: string;
  progress?: number;
  stage?: string;
  task?: Task;
  error?: string;
  ts: number;
}

export interface AiEnhanceResult {
  action: 'summary' | 'keypoints' | 'translate';
  taskId: string;
  demo?: boolean;
  engine?: string;
  title?: string;
  overview?: string;
  tags?: string[];
  keypoints?: string[];
  lang?: string;
  text?: string;
  note?: string;
}
