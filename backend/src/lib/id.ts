import { randomBytes } from 'crypto';

export function newTaskId(): string {
  return `t_${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
