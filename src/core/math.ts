export const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));
export const round = (value: number, decimals = 0): number => { const m = 10 ** decimals; return Math.round(value * m) / m; };
export const mean = (values: number[]): number => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
