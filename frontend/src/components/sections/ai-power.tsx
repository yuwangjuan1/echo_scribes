import { BrainCircuit, FileText, Tags, Languages, ListChecks } from 'lucide-react';
import { AI_ACTIONS } from '@/lib/constants';

const ICONS = [BrainCircuit, ListChecks, Tags, Languages];

export default function AiPower() {
  return (
    <section id="ai" className="border-b border-white/[0.07] py-20">
      <div className="mx-auto grid w-full items-start gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="stagger">
          <p className="section-eyebrow">ai enhanced</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            转写只是开始，
            <br />
            AI 帮你把活干完
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-mist-dim">
            别人还在对照进度条抄文案的时候，你已经拿到摘要、要点和标签——它们足够拿来直接发笔记、写周报、拆选题。
          </p>

          <ul className="mt-9 space-y-0">
            {AI_ACTIONS.map((action, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <li
                  key={action.title}
                  className="flex items-start gap-4 border-t border-white/[0.07] py-4 last:border-b"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <h3 className="text-sm font-semibold text-paper">{action.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-mist-dim">{action.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:pt-14">
          <div className="glass overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
              <span className="font-mono text-[11px] text-mist-faint">echoscribe://workspace</span>
              <span className="font-mono text-[11px] text-mist-faint">转写结果</span>
            </div>

            <div className="p-5">
              <p className="flex items-center gap-2 font-mono text-[11px] text-mist-faint">
                <FileText className="h-3.5 w-3.5 text-mist-dim" />
                transcript/普通人的第一桶金.txt
              </p>

              <div className="mt-4 space-y-2.5 rounded-md border border-white/[0.07] bg-black/25 p-4">
                <p className="text-sm leading-relaxed text-paper">
                  <span className="mr-2 font-mono text-[10px] text-accent">01:24</span>
                  他的打法特别简单，先把同城领养信息整理成一个免费文档…
                </p>
                <p className="text-sm leading-relaxed text-mist-dim">
                  <span className="mr-2 font-mono text-[10px] text-mist-faint">01:32</span>
                  两个星期加了八百多个好友，第二步才开始卖猫粮试吃装…
                </p>
              </div>

              <div className="mt-4 rounded-md border border-accent/30 bg-accent/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                  ai summary
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-paper">
                  用宠物社群的真实案例拆解冷启动姿势：先提供免费价值（同城领养文档）建立信任，再顺势推出低门槛产品完成转化——「先给价值，再谈生意」。
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-mist-faint">
                  {['#副业', '#案例拆解', '#内容获客', '#私域'].map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 border-t border-white/[0.07] pt-4">
                {['TXT', 'SRT', 'VTT'].map((ext, i) => (
                  <span
                    key={ext}
                    className={`font-mono text-xs text-mist-faint ${i > 0 ? 'border-l border-white/[0.07] pl-4' : ''} ${i < 2 ? 'pr-4' : ''}`}
                  >
                    .{ext}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
