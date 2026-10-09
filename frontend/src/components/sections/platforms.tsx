import { Plus } from 'lucide-react';
import { PLATFORMS } from '@/lib/constants';

export default function Platforms() {
  return (
    <section id="platforms" className="border-b border-white/[0.07] py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="stagger max-w-2xl">
          <p className="section-eyebrow">platforms</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            常见平台，同一个入口
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-mist-dim">
            一个输入框搞定所有公开视频链接。粘贴整段分享文案也能自动提取链接，实际可用性取决于源视频能否公开访问。
          </p>
        </div>

        <div className="stagger mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="glass glass-hover flex items-center gap-3.5 p-4">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-xs font-bold"
                style={{ borderColor: `${p.color}55`, color: p.color }}
              >
                {p.label.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-paper">{p.label}</p>
                <p className="truncate font-mono text-[11px] text-mist-faint">{p.sample}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3.5 rounded-lg border border-dashed border-white/15 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
              <Plus className="h-4 w-4 text-mist-dim" />
            </span>
            <p className="text-sm text-mist-dim">
              更多平台
              <br />
              持续接入
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
