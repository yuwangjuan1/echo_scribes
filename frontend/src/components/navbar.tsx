'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { Menu, X, ArrowRight } from 'lucide-react';
import Equalizer from './equalizer';

const NAV = [
  { href: '/', label: '首页' },
  { href: '/workspace', label: '工作台' },
  { href: '/pricing', label: '定价' },
  { href: '/docs', label: 'API 文档' },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-baseline gap-2">
      <span className="font-display text-lg font-bold tracking-tight text-paper">
        Echo<span className="text-accent">Scribe</span>
      </span>
      <span className="hidden text-sm text-paper-dim sm:inline">声稿</span>
      {!compact && <Equalizer bars={3} className="ml-1 hidden h-3 sm:flex" />}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-ink">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="hidden items-center gap-6 md:flex" aria-label="主导航">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'border-b-2 pb-0.5 text-sm transition-colors',
                  active
                    ? 'border-accent text-paper'
                    : 'border-transparent text-mist-dim hover:text-paper',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/workspace" className="btn-glow h-9 px-4 text-sm">
            免费开始
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          className="btn-ghost h-9 w-9 md:hidden"
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.08] bg-ink px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="移动端导航">
            {NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'rounded-md px-3 py-2.5 text-sm',
                    active ? 'bg-white/[0.05] text-paper' : 'text-mist-dim',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/workspace"
              onClick={() => setOpen(false)}
              className="btn-glow mt-2 h-11 px-5 text-sm"
            >
              免费开始转写
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
