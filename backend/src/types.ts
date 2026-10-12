export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type SourceType = 'link' | 'upload';

export type PlatformId =
  | 'douyin'
  | 'xiaohongshu'
  | 'bilibili'
  | 'youtube'
  | 'tiktok'
  | 'kuaishou'
  | 'channels'
  | 'wechat'
  | 'instagram'
  | 'x'
  | 'weibo'
  | 'unknown'
  | 'file';

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

export interface AgentStep {
  tool: string;
  args: Record<string, unknown>;
  preview: string;
  ms: number;
}

export interface AgentHighlight {
  timecode: string;
  quote: string;
  reason: string;
}

export interface AgentReport {
  model: string;
  elapsedMs: number;
  steps: AgentStep[];
  title: string;
  overview: string;
  keypoints: string[];
  tags: string[];
  highlights: AgentHighlight[];
}

export interface Task {
  id: string;
  sourceType: SourceType;
  url?: string;
  fileName?: string;
  fileSize?: number;
  platform: PlatformId;
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
  insightEngine?: string;
  agentReport?: AgentReport;
}

export interface UsageInfo {
  freeMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  totalTasks: number;
}

export interface PlatformMeta {
  id: PlatformId;
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

export type AiAction = 'summary' | 'keypoints' | 'translate' | 'agent';

export interface SubmitLinksBody {
  links: string[] | string;
  aiEnhance?: boolean;
}
