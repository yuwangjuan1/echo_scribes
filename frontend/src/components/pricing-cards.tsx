'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Check, ArrowRight } from 'lucide-react';
import type { PricingPlan } from '@/lib/types';

export default function PricingCards({ plans }: { plans: PricingPlan[] }) {
  const visible = plans.filter((p) => p.id !== 'business');
  const business = plans.find((p) => p.id === 'business');

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-3">
        {visible.map((plan) => (
          <div
            key={plan.id}
            className={clsx(
              'glass relative flex flex-col p-7',
              plan.highlight && 'border-accent/50',
            )}
          >
            {plan.highlight && (
              <>
                <span
                  className="absolute inset-x-0 top-0 h-[2px] bg-accent"
                  aria-hidden
                />
                <p className="absolute -top-[13px] left-5 bg-ink px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  最受欢迎
                </p>
              </>
            )}
            <h3 className="font-display text-lg font-bold text-paper">{plan.name}</h3>
            <p className="mt-1.5 min-h-[2.5em] text-sm leading-relaxed text-mist-dim">{plan.tagline}</p>
            <div className="mt-5 flex items-end gap-1.5">
              {plan.priceCny === 0 ? (
                <span className="font-display text-4xl font-bold text-paper">免费</span>
              ) : (
                <>
                  <span className="text-lg text-mist-dim">¥</span>
                  <span className="font-display text-4xl font-bold text-paper">{plan.priceCny}</span>
                </>
              )}
              <span className="pb-1.5 text-sm text-mist-faint">
                / {plan.minutes} {plan.unit}
              </span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 border-t border-white/[0.07] pt-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-mist-dim">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mist-faint" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/workspace"
              className={clsx('mt-7 h-11 w-full text-sm', plan.highlight ? 'btn-glow' : 'btn-ghost')}
            >
              {plan.priceCny === 0 ? '免费开始' : '立即购买'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      {business && (
        <div className="glass mt-5 flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-paper">{business.name}</h3>
            <p className="mt-1 text-sm text-mist-dim">{business.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {business.features.slice(0, 3).map((f) => (
              <span key={f} className="chip">
                {f}
              </span>
            ))}
          </div>
          <a href="mailto:hello@echoscribe.cn" className="btn-ghost h-10 shrink-0 px-5 text-sm">
            联系我们
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
