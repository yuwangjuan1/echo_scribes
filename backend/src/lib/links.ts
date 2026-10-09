import type { PlatformId, PlatformMeta } from '../types.js';

export const PLATFORMS: PlatformMeta[] = [
  { id: 'douyin', label: '抖音', domains: ['douyin.com', 'iesdouyin.com', 'v.douyin.com'], color: '#FE2C55', popular: true },
  { id: 'xiaohongshu', label: '小红书', domains: ['xiaohongshu.com', 'xhslink.com'], color: '#FF2442', popular: true },
  { id: 'bilibili', label: 'B 站', domains: ['bilibili.com', 'b23.tv', 'bili2233.cn'], color: '#00A1D6', popular: true },
  { id: 'youtube', label: 'YouTube', domains: ['youtube.com', 'youtu.be', 'm.youtube.com'], color: '#FF3D3D', popular: true },
  { id: 'tiktok', label: 'TikTok', domains: ['tiktok.com', 'vm.tiktok.com'], color: '#25F4EE', popular: true },
  { id: 'kuaishou', label: '快手', domains: ['kuaishou.com', 'chenzhongtech.com', 'v.kuaishou.com'], color: '#FE3666', popular: false },
  { id: 'channels', label: '视频号', domains: ['channels.weixin.qq.com'], color: '#FA9D3B', popular: false },
  { id: 'wechat', label: '公众号', domains: ['mp.weixin.qq.com'], color: '#07C160', popular: true },
  { id: 'instagram', label: 'Instagram', domains: ['instagram.com', 'instagr.am'], color: '#E1306C', popular: false },
  { id: 'x', label: 'X / Twitter', domains: ['x.com', 'twitter.com', 't.co'], color: '#8C8C8C', popular: false },
  { id: 'weibo', label: '微博', domains: ['weibo.com', 'weibo.cn'], color: '#E6162D', popular: false },
];

const URL_PATTERN = /https?:\/\/[^\s"'（）()<>\u4e00-\u9fa5]+/gi;

export function extractUrls(raw: string): string[] {
  const matches = raw.match(URL_PATTERN) ?? [];
  return matches
    .map((u) => u.replace(/[.,;、。'"'\s]+$/, ''))
    .filter((u) => /^https?:\/\/.+\..+/.test(u));
}

export function detectPlatform(url: string): PlatformMeta {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return unknownPlatform();
  }
  const hit = PLATFORMS.find((p) => p.domains.some((d) => host === d || host.endsWith(`.${d}`) || host.includes(d)));
  return hit ?? unknownPlatform();
}

function unknownPlatform(): PlatformMeta {
  return { id: 'unknown', label: '其他平台', domains: [], color: '#22E5A6', popular: false };
}

export function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

export function parseLinksPayload(raw: string | string[]): { urls: string[]; invalid: number } {
  const text = Array.isArray(raw) ? raw.join('\n') : String(raw ?? '');
  const urls = dedupeUrls(extractUrls(text));
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const invalid = Math.max(0, lines.length - urls.length);
  return { urls, invalid };
}
