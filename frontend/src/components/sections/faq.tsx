import { FAQS } from '@/lib/constants';

export default function Faq() {
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="stagger">
          <p className="section-eyebrow">faq</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            开始前的常见问题
          </h2>
        </div>

        <div className="stagger mt-10">
          {FAQS.map((item) => (
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
      </div>
    </section>
  );
}
