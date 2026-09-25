let counter = 0;
export function makeId(prefix: string, seed = 0): string { counter += 1; return `${prefix}_${seed.toString(36)}_${counter.toString(36)}`; }
export function resetIdCounter(): void { counter = 0; }
