'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (toast: ToastItem) => void;

let listeners: Listener[] = [];
let nextId = 1;

export function toast(message: string, kind: ToastKind = 'info'): void {
  const item: ToastItem = { id: nextId++, kind, message };
  for (const fn of listeners) fn(item);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (item) => {
      setItems((prev) => [...prev.slice(-3), item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, item.kind === 'error' ? 5000 : 3200);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((fn) => fn !== listener);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {items.map((item) => (
        <div
          key={item.id}
          className={clsx(
            'pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-md border px-4 py-3 text-sm',
            item.kind === 'success' && 'border-mint/40 bg-ink-soft text-mist',
            item.kind === 'error' && 'border-rose/40 bg-ink-soft text-mist',
            item.kind === 'info' && 'border-white/15 bg-ink-soft text-mist',
          )}
          style={{ animation: 'scale-in 0.25s ease both' }}
        >
          {item.kind === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" />}
          {item.kind === 'error' && <AlertTriangle className="h-4 w-4 shrink-0 text-rose" />}
          {item.kind === 'info' && <Info className="h-4 w-4 shrink-0 text-mist-dim" />}
          <span className="leading-relaxed">{item.message}</span>
        </div>
      ))}
    </div>
  );
}
