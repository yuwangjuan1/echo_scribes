import clsx from 'clsx';

interface EqualizerProps {
  bars?: number;
  className?: string;
  active?: boolean;
}

const HEIGHTS = [0.35, 0.6, 0.9, 0.55, 0.75, 0.95, 0.45, 0.7, 0.85, 0.5];
const DELAYS = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.96, 1.08];

export default function Equalizer({ bars = 4, className, active = true }: EqualizerProps) {
  const count = Math.min(Math.max(bars, 1), HEIGHTS.length);
  return (
    <span
      className={clsx('flex h-4 items-center justify-end gap-[2px]', className)}
      role="img"
      aria-label={active ? '声波跳动中' : '声波静止'}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="w-[2.5px] origin-bottom rounded-[1px] bg-paper-dim"
          style={{
            height: `${HEIGHTS[i % HEIGHTS.length] * 100}%`,
            animation: active
              ? `eq-jump ${1.15 + (i % 3) * 0.13}s ease-in-out ${DELAYS[i % DELAYS.length]}s infinite`
              : undefined,
            transform: active ? undefined : 'scaleY(0.35)',
            transition: 'transform .4s ease',
          }}
        />
      ))}
    </span>
  );
}
