import type { Task, TranscriptSegment } from '../types.js';

export function formatTimestamp(seconds: number, delimiter: string): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  const ms = String(Math.round((seconds - total) * 1000)).padStart(3, '0');
  return `${h}:${m}:${s}${delimiter}${ms}`;
}

export function toSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, i) => {
      return `${i + 1}\n${formatTimestamp(seg.start, ',')} --> ${formatTimestamp(seg.end, ',')}\n${seg.text}`;
    })
    .join('\n\n')
    .concat('\n');
}

export function toVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .map((seg) => `${formatTimestamp(seg.start, '.')} --> ${formatTimestamp(seg.end, '.')}\n${seg.text}`)
    .join('\n\n');
  return `WEBVTT\n\n${body}\n`;
}

export function toTxt(task: Task): string {
  const lines: string[] = [`# ${task.title}`, ''];
  lines.push(`平台：${task.platformLabel}`);
  lines.push(`时长：${formatClock(task.durationSec)}`);
  lines.push(`转写时间：${new Date(task.completedAt ?? task.createdAt).toLocaleString('zh-CN')}`);
  lines.push('');
  if (task.insights) {
    lines.push('【AI 摘要】', task.insights.overview, '');
    lines.push('【核心要点】');
    task.insights.keypoints.forEach((k, i) => lines.push(`${i + 1}. ${k}`));
    lines.push('');
  }
  lines.push('【完整文案】', '');
  for (const seg of task.transcript?.segments ?? []) {
    lines.push(`[${formatClock(seg.start)}] ${seg.text}`);
  }
  return lines.join('\n');
}

export function toMarkdown(task: Task): string {
  const lines: string[] = [`# ${task.insights?.title ?? task.title}`, ''];
  lines.push(`> 平台：**${task.platformLabel}** · 时长：**${formatClock(task.durationSec)}** · 字数：**${task.transcript?.wordCount ?? 0}**`, '');
  if (task.insights) {
    lines.push('## AI 摘要', '', task.insights.overview, '');
    lines.push('## 核心要点', '');
    task.insights.keypoints.forEach((k) => lines.push(`- ${k}`));
    lines.push('');
    if (task.insights.tags.length) {
      lines.push(task.insights.tags.map((t) => `\`#${t}\``).join(' '), '');
    }
  }
  lines.push('## 完整文案（含时间轴）', '');
  lines.push('| 时间 | 内容 |', '| --- | --- |');
  for (const seg of task.transcript?.segments ?? []) {
    lines.push(`| \`${formatClock(seg.start)}\` | ${seg.text.replace(/\|/g, '\\|')} |`);
  }
  return lines.join('\n');
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function exportContent(task: Task, format: string): { body: string; mime: string; ext: string } | null {
  const segs = task.transcript?.segments ?? [];
  switch (format) {
    case 'srt':
      return { body: toSrt(segs), mime: 'application/x-subrip', ext: 'srt' };
    case 'vtt':
      return { body: toVtt(segs), mime: 'text/vtt', ext: 'vtt' };
    case 'md':
      return { body: toMarkdown(task), mime: 'text/markdown', ext: 'md' };
    case 'txt':
      return { body: toTxt(task), mime: 'text/plain', ext: 'txt' };
    default:
      return null;
  }
}
