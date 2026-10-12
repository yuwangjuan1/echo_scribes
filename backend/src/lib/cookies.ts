import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COOKIES_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../transcriber/cookies.txt',
);

export interface CookiesStatus {
  configured: boolean;
  updatedAt?: string;
  sizeBytes?: number;
}

export function cookiesStatus(): CookiesStatus {
  try {
    const stat = fs.statSync(COOKIES_PATH);
    return { configured: true, updatedAt: stat.mtime.toISOString(), sizeBytes: stat.size };
  } catch {
    return { configured: false };
  }
}

export function saveCookies(content: string): CookiesStatus {
  const text = String(content ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!text) {
    throw httpError(400, 'cookies 内容为空，请粘贴或上传完整文件');
  }
  const valid = text
    .split('\n')
    .some((line) => line.startsWith('#HttpOnly_') || (!line.startsWith('#') && line.split('\t').filter(Boolean).length >= 6));
  if (!valid) {
    throw httpError(
      400,
      '内容不是有效的 cookies.txt（Netscape 格式），请使用「Get cookies.txt LOCALLY」扩展导出的原始文件',
    );
  }
  fs.mkdirSync(path.dirname(COOKIES_PATH), { recursive: true });
  fs.writeFileSync(COOKIES_PATH, `${text}\n`, 'utf-8');
  return cookiesStatus();
}

export function deleteCookies(): boolean {
  try {
    fs.rmSync(COOKIES_PATH);
    return true;
  } catch {
    return false;
  }
}

function httpError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
