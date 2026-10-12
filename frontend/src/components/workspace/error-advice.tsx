'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RotateCcw, LifeBuoy, Cookie, FileUp, Loader2, CheckCircle2 } from 'lucide-react';
import { api, type CookiesStatus } from '@/lib/api';

interface Advice {
  title: string;
  detail: string;
  steps?: string[];
  helpLink?: { label: string; href: string };
  retryable?: boolean;
}

const ADVICE: Record<string, Advice> = {
  cookies_required: {
    title: '该平台需要一次性的 Cookies 配置',
    detail: '抖音等平台要求登录态才能取得视频流。配置一次即可长期使用，全程无需登录账号。',
    steps: [
      '用 Chrome / Edge 安装扩展「Get cookies.txt LOCALLY」',
      '浏览器访问 douyin.com（无需登录账号）',
      '点击扩展图标导出 cookies.txt，在下方直接上传',
      '配置完成后点击「重新提交」即可',
    ],
    retryable: true,
  },
  no_speech: {
    title: '没听清视频里的人声',
    detail: '这段视频可能无人声、纯音乐，或人声被背景音乐盖过，语音识别没有捕捉到可转写的内容。',
    steps: [
      '换一段以说话为主的视频（口播、访谈、讲课效果最佳）',
      '或把音频文件直接上传到「上传文件」页签，配合更高精度模型重试',
    ],
  },
  login_required: {
    title: '该视频需要登录才能观看',
    detail: '源视频设置了访问权限（会员、关注才可见等），服务端无法匿名取流。',
    steps: ['换一个公开可见的视频链接', '或把视频下载到本地后使用「上传文件」转写'],
  },
  video_unavailable: {
    title: '链接打不开或视频不可访问',
    detail: '视频可能已删除、设为私密、地区限制，或该链接不是受支持的视频页面。',
    steps: [
      '在浏览器里打开该链接确认视频能正常播放',
      '确认分享链接完整（短链未被截断）',
      '换用视频的原始页面链接重试',
    ],
    retryable: true,
  },
  duration_limit: {
    title: '视频时长超出上限',
    detail: '当前支持最长 30 分钟的音视频。更长的内容可以分段处理。',
    steps: ['用剪辑工具截取 30 分钟以内的片段', '分段提交，文案可按顺序拼接'],
  },
  download_failed: {
    title: '视频下载中断',
    detail: '资源可能已过期（部分平台链接时效很短），或网络波动导致下载中断。',
    steps: ['稍等片刻后重试（链接过期时重新分享即可拿到新地址）', '多次失败可改用「上传文件」方式'],
    retryable: true,
  },
  embed_unsupported: {
    title: '未能从该页面提取到视频',
    detail: '公众号文章内嵌的「视频号」或「腾讯视频」资源仅能在微信客户端内播放，服务端无法直接取流。',
    steps: [
      '确认文章里是普通上传视频（后台直传的可以转写）',
      '视频号内容：可在手机上保存后用「上传文件」转写',
    ],
  },
  media_unreadable: {
    title: '文件无法读取',
    detail: '文件可能已损坏、为空，或是不受支持的音视频格式。',
    steps: ['换用 mp4 / mp3 / m4a / wav 等常见格式', '确认文件完整可播放后重新上传'],
  },
  engine_failed: {
    title: '转写引擎出了点状况',
    detail: '引擎内部发生了未预期的错误，多数情况下重试即可恢复。',
    steps: ['点击下方重试', '持续失败请查看后端终端的日志输出定位原因'],
    retryable: true,
  },
};

const FALLBACK: Advice = {
  title: '转写失败',
  detail: '处理过程中出现问题，可检查链接是否公开可访问后重试。',
  retryable: true,
};

export default function ErrorAdvice({
  code,
  message,
  onRetry,
}: {
  code?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const advice = (code && ADVICE[code]) || FALLBACK;

  return (
    <div className="mt-3 rounded-lg border border-rose/25 bg-rose/[0.06] px-4 py-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-rose">{advice.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-mist-dim">{advice.detail}</p>
          {message && code === 'engine_failed' && (
            <p className="mt-1.5 break-all rounded bg-black/30 px-2 py-1 font-mono text-[10px] leading-relaxed text-mist-faint">
              {message}
            </p>
          )}

          {advice.steps && advice.steps.length > 0 && (
            <ol className="mt-2.5 space-y-1.5">
              {advice.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-mist-dim">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-white/[0.06] font-mono text-[10px] text-mist-faint">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}

          {code === 'cookies_required' && <CookiesSetup />}

          {(advice.retryable && onRetry) || advice.helpLink ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {advice.retryable && onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-xs text-mist transition-colors hover:border-white/30 hover:text-paper"
                >
                  <RotateCcw className="h-3 w-3" />
                  重新提交
                </button>
              )}
              {advice.helpLink && (
                <a
                  href={advice.helpLink.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-mist-dim underline-offset-2 hover:text-paper hover:underline"
                >
                  <LifeBuoy className="h-3 w-3" />
                  {advice.helpLink.label}
                </a>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CookiesSetup() {
  const [status, setStatus] = useState<CookiesStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    api
      .cookiesStatus()
      .then((res) => alive && setStatus(res.cookies))
      .catch(() => alive && setStatus({ configured: false }));
    return () => {
      alive = false;
    };
  }, []);

  const save = async (content: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await api.saveCookies(content);
      setStatus(res.cookies);
      setPasteOpen(false);
      setPasteText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = async (file: File) => {
    const text = await file.text();
    await save(text);
  };

  if (status?.configured) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-md border border-mint/25 bg-mint/[0.06] px-3 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-mint" />
        <p className="text-xs text-mist-dim">
          Cookies 已配置
          {status.updatedAt && (
            <span className="text-mist-faint">（{new Date(status.updatedAt).toLocaleString('zh-CN')}）</span>
          )}
          ，点击下方「重新提交」即可转写。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-2">
        <Cookie className="h-3.5 w-3.5 shrink-0 text-accent" />
        <p className="text-xs font-medium text-mist">在此配置 Cookies</p>
        {busy && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-mist-faint" />}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPickFile(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-xs text-mist transition-colors hover:border-white/30 hover:text-paper disabled:opacity-50"
        >
          <FileUp className="h-3 w-3" />
          上传 cookies.txt
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setPasteOpen((v) => !v)}
          className="text-xs text-mist-dim underline-offset-2 transition-colors hover:text-paper hover:underline"
        >
          {pasteOpen ? '收起粘贴框' : '或粘贴文件内容'}
        </button>
      </div>

      {pasteOpen && (
        <div className="mt-2.5">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="# Netscape HTTP Cookie File&#10;.douyin.com	TRUE	/	TRUE	0	cookie_name	value"
            rows={4}
            className="w-full resize-y rounded-md border border-white/10 bg-black/30 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-mist placeholder:text-mist-faint focus:border-white/25 focus:outline-none"
          />
          <button
            type="button"
            disabled={busy || !pasteText.trim()}
            onClick={() => void save(pasteText)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-xs text-mist transition-colors hover:border-white/30 hover:text-paper disabled:opacity-40"
          >
            保存配置
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs leading-relaxed text-rose">{error}</p>}
    </div>
  );
}
