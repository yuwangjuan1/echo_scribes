import { WORKFLOW_STEPS } from '@/lib/constants';

export default function Workflow() {
  return (
    <section id="workflow" className="border-b border-white/[0.07] py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="stagger max-w-2xl">
          <p className="section-eyebrow">workflow</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            三步，从链接到成品稿
          </h2>
        </div>

        <ol className="stagger mt-12 grid md:grid-cols-3">
          {WORKFLOW_STEPS.map((step) => (
            <li
              key={step.no}
              className="border-l border-white/[0.12] py-1 pl-6 md:border-b md:border-l-0 md:border-t-0 md:border-white/[0.07] md:pb-8 md:pl-0 md:pt-6"
            >
              <span className="font-mono text-xs tracking-[0.18em] text-accent">{step.no}</span>
              <h3 className="mt-3 font-display text-lg font-bold text-paper">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-mist-dim">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
