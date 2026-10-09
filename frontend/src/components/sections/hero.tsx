'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import { countLinks } from '@/lib/utils';
import { HERO_STATS, PLATFORMS } from '@/lib/constants';

const MOCK_LINES = [
  '先把同城领养信息整理成一个免费文档，然后到各个小区业主群去发',
  '两个星期加了八百多个好友，第二步才开始卖猫粮试吃装',
  '信任建立起来之后，交易只是一个顺便的动作',
];

export default function Hero() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [aiEnhance, setAiEnhance] = useState(true);
  const [loading, setLoading] = useState(false);
  const linkCount = useMemo(() => countLinks(value), [value]);

  async function submit() {
    if (loading) return;
    if (linkCount === 0) {
      toast('请先粘贴至少一条视频链接', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.submitLinks(value, aiEnhance);
      toast(`已提交 ${res.tasks.length} 个转写任务，正在处理`, 'success');
      router.push('/workspace');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '提交失败，请稍后再试', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-b border-white/[0.07] pb-16 pt-12 sm:pt-16">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="stagger lg:col-span-7">
          <p className="font-mono text-xs text-mist-dim">
            视频文案提取工具 · 支持 10+ 平台公开链接
          </p>

          <h1 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.2] tracking-tight text-paper sm:text-[3.4rem]">
            把视频，
            <br />
            读成<span className="text-accent">文字</span>。
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-mist-dim sm:text-base">
            粘贴抖音、B 站、小红书、YouTube 的公开链接，十几秒生成
            <span className="text-paper">带时间轴的完整文案</span>，AI 再顺手给出摘要、要点和标签。
            不用下载视频，也不用守着进度条。
          </p>

          <div className="glass mt-9 p-3">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit();
              }}
              rows={3}
              spellCheck={false}
              placeholder={'粘贴视频链接或整段分享文案，每行一条，支持批量提交…\n例如：https://www.bilibili.com/video/BV…'}
              className="field-input min-h-[92px] resize-none border-transparent bg-transparent"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-mist-faint">
                <button
                  type="button"
                  onClick={() => setAiEnhance((v) => !v)}
                  className={`chip cursor-pointer ${aiEnhance ? 'chip-amber' : ''}`}
                  aria-pressed={aiEnhance}
                >
                  AI 摘要 {aiEnhance ? '已开启' : '已关闭'}
                </button>
                <span className="font-mono">⌘ / Ctrl + Enter</span>
                <span>{linkCount > 0 ? `已识别 ${linkCount} 条链接` : '每次最多 100 条'}</span>
              </div>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading}
                className="btn-glow h-11 shrink-0 px-6 text-sm sm:w-40"
              >
                {loading ? '提交中…' : '开始转写'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-mist-faint">
            原视频不下载、不存储 · 不订阅、不自动续费 · 新用户免费 10 分钟
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/[0.08] pt-7 sm:grid-cols-4">
            {HERO_STATS.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-xl font-medium text-paper">{s.value}</dt>
                <dd className="mt-1 text-xs text-mist-faint">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative hidden lg:col-span-5 lg:block">
          <div className="sticky top-28">
            <div className="glass overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-sm font-bold text-paper">抖音</span>
                  <span className="font-mono text-[11px] text-mist-faint">v.douyin.com/i2Lr…</span>
                </div>
                <span className="font-mono text-[11px] text-mint">转写中</span>
              </div>

              <div className="p-5">
                <div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '78%' }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-mist-faint">
                    <span>语音识别中</span>
                    <span>78%</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4 border-t border-white/[0.07] pt-5">
                  {MOCK_LINES.map((line, i) => (
                    <p key={line} className="text-sm leading-relaxed text-mist-dim">
                      <span className="mr-2.5 font-mono text-[10px] text-accent">
                        0{i + 1}:2{i * 4}
                      </span>
                      {line}
                    </p>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-mist-faint">
                  <span>AI 摘要生成中…</span>
                  <span className="font-mono">TXT / SRT / VTT / MD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.08] pt-5 text-xs text-mist-faint">
          <span className="font-mono text-mist-dim">已支持</span>
          {PLATFORMS.map((p) => (
            <span key={p.id} className="transition-colors hover:text-mist-dim">
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
