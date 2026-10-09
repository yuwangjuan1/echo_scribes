import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Infinity as InfinityIcon, Coins, SplitSquareHorizontal } from 'lucide-react';
import PricingCards from '@/components/pricing-cards';
import { PRICING_PLANS } from '@/lib/constants';

export const metadata: Metadata = {
  title: '定价',
  description: '按分钟数购买转写额度，不订阅、不自动续费，额度可累计。新用户免费获得 10 分钟。',
};

const RULES = [
  {
    icon: Coins,
    title: '按分钟计费',
    desc: '额度按已完成任务的转写视频时长扣减，提交失败不扣，重复提交同一任务在完成后会计费。',
  },
  {
    icon: InfinityIcon,
    title: '额度可累计',
    desc: '购买的额度永久有效，不同套餐叠加不冲突；网页、上传与 API 共用同一个余额池。',
  },
  {
    icon: SplitSquareHorizontal,
    title: '三种入口一个价',
    desc: '链接转写、本地文件上传、API 调用使用同一套额度和费率，不需要分开购买。',
  },
];

const PRICING_FAQS = [
  {
    q: '会自动续费吗？',
    a: '不会。声稿没有订阅制，所有额度都是一次性买断，用完再买，完全由你决定。',
  },
  {
    q: '免费额度能干什么？',
    a: '10 分钟大约可以转写 8-12 条短视频，或一节 8 分钟以内的课程片段，足够跑通完整流程：链接解析、AI 转写、时间轴、摘要与导出全部开放。',
  },
  {
    q: '转写失败会扣额度吗？',
    a: '不会。只有任务状态变为「已完成」才按时长计费；链接无法访问、识别失败等情况均不扣减额度。',
  },
  {
    q: '可以开发票吗？',
    a: '可以。基础包及以上支持开具增值税普通发票，付款后联系客服邮箱 hello@echoscribe.cn 提供开票信息即可。',
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-8">
      <div className="stagger mx-auto max-w-2xl text-center">
        <p className="section-eyebrow">pricing</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-paper sm:text-5xl">
          定价，一次说清
        </h1>
        <p className="mt-5 leading-relaxed text-mist-dim">
          没有月费、没有自动续费、没有隐藏条款。
          先用免费的 10 分钟跑通全流程，觉得值，再按需购买分钟数。
        </p>
      </div>

      <div className="stagger mt-16">
        <PricingCards plans={PRICING_PLANS} />
      </div>

      <div className="stagger mt-16 grid gap-5 sm:grid-cols-3">
        {RULES.map((rule) => (
          <div key={rule.title} className="glass glass-hover p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.1] text-accent">
              <rule.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-medium text-paper">{rule.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-dim">{rule.desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-20">
        <h2 className="font-display text-2xl font-bold text-paper">关于计费的常见问题</h2>
        <div className="mt-8">
          {PRICING_FAQS.map((item) => (
            <details
              key={item.q}
              className="group border-t border-white/[0.09] px-1 py-5 last:border-b [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] font-medium text-paper">
                {item.q}
                <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                  <span className="absolute h-px w-3.5 bg-mist-dim transition-transform duration-200" />
                  <span className="absolute h-3.5 w-px bg-mist-dim transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="mt-3.5 text-sm leading-relaxed text-mist-dim">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="glass mt-16 flex flex-col items-center gap-5 px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-bold text-paper">10 分钟免费额度，现在就能用</h2>
        <Link href="/workspace" className="btn-glow h-12 px-8 text-sm">
          打开工作台
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
