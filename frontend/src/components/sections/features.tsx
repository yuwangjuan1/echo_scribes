import { FEATURES } from '@/lib/constants';

export default function Features() {
  return (
    <section id="features" className="border-b border-white/[0.07] py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="stagger max-w-2xl">
          <p className="section-eyebrow">features</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            不止转文字，把整条流水线给你
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-mist-dim">
            从一条链接到可发布的文案，中间的每一站——解析、转写、对轴、摘要、导出——都在同一个工作台里完成。
          </p>
        </div>

        <ul className="mt-12 grid gap-x-12 gap-y-0 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <li
              key={f.title}
              className="flex gap-5 border-b border-white/[0.07] py-6 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
            >
              <span className="editorial-no shrink-0 pt-1">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-[15px] font-semibold text-paper">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist-dim">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
