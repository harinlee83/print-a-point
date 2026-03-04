export interface SnapResult {
  value: number;
  snapped: boolean;
}

export function snapToCenter(value: number, threshold = 1.5): SnapResult {
  if (Math.abs(value) <= threshold) {
    return { value: 0, snapped: true };
  }
  return { value, snapped: false };
}
