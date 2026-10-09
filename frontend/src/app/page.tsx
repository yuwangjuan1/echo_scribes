import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Hero from '@/components/sections/hero';
import Features from '@/components/sections/features';
import Platforms from '@/components/sections/platforms';
import Workflow from '@/components/sections/workflow';
import AiPower from '@/components/sections/ai-power';
import Faq from '@/components/sections/faq';
import Cta from '@/components/sections/cta';
import PricingCards from '@/components/pricing-cards';
import { PRICING_PLANS } from '@/lib/constants';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Platforms />
      <Workflow />
      <AiPower />

      <section id="pricing" className="py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="stagger flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="section-eyebrow">pricing</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
                按需购买，用完再买
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-mist-dim">
                不订阅、不自动续费，购买的额度可累计。先用免费的 10 分钟跑通全流程，再决定要不要继续。
              </p>
            </div>
            <Link
              href="/pricing"
              className="hidden shrink-0 items-center gap-1.5 text-sm text-paper-dim transition-colors hover:text-paper sm:flex"
            >
              完整定价说明
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="stagger mt-14">
            <PricingCards plans={PRICING_PLANS} />
          </div>
        </div>
      </section>

      <Faq />
      <Cta />
    </>
  );
}
