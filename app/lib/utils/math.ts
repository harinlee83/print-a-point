export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
