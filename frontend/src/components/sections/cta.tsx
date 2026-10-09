import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Cta() {
  return (
    <section className="border-t border-white/[0.07] py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-paper sm:text-4xl">
              现在就把第一条视频，
              <br />
              交给声稿。
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mist-dim">
              免费额度 10 分钟，不用绑卡、不用订阅，粘贴链接立刻开始。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <Link href="/workspace" className="btn-glow h-12 px-7 text-sm">
              免费开始转写
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="btn-ghost h-12 px-7 text-sm">
              查看定价
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
