export interface Rng { next(): number; integer(min: number, max: number): number; pick<T>(items: T[]): T; state(): number; }
export function createRng(seed: number): Rng {
  let s = seed >>> 0 || 0x6d2b79f5;
  return {
    next() { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
    integer(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; },
    pick<T>(items: T[]) { if (!items.length) throw new Error("Cannot pick from empty array"); return items[this.integer(0, items.length - 1)]; },
    state() { return s >>> 0; }
  };
}
