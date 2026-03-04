export interface PinStyle {
  id: string;
  label: string;
  path: string;
  viewBox: [number, number, number, number];
  /** Point in viewBox coordinates that should sit at the map center. */
  anchor: [number, number];
}

export const PIN_SIZE_MIN = 10;
export const PIN_SIZE_MAX = 100;

/** Reference pixel sizes at TEXT_DIMENSION_REFERENCE_PX (3600). */
const PIN_REF_MIN_PX = 90;
const PIN_REF_MAX_PX = 504;

export const DEFAULT_PIN_STYLE_ID = "classic";

export const PIN_STYLES: PinStyle[] = [
  {
    id: "classic",
    label: "Classic",
    path: "M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0zm0 16a4 4 0 110-8 4 4 0 010 8z",
    viewBox: [0, 0, 24, 36],
    anchor: [12, 36],
  },
  {
    id: "heart",
    label: "Heart",
    path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    viewBox: [0, 0, 24, 24],
    anchor: [12, 12],
  },
  {
    id: "circle",
    label: "Circle",
    path: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14z",
    viewBox: [0, 0, 24, 24],
    anchor: [12, 12],
  },
  {
    id: "star",
    label: "Star",
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    viewBox: [0, 0, 24, 24],
    anchor: [12, 12],
  },
  {
    id: "diamond",
    label: "Diamond",
    path: "M12 2L22 12 12 22 2 12z",
    viewBox: [0, 0, 24, 24],
    anchor: [12, 12],
  },
  {
    id: "crosshair",
    label: "Crosshair",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM11 6h2v5h5v2h-5v5h-2v-5H6v-2h5V6z",
    viewBox: [0, 0, 24, 24],
    anchor: [12, 12],
  },
];

export function getPinStyleById(id: string): PinStyle | undefined {
  return PIN_STYLES.find((s) => s.id === id);
}

/** Convert slider value (PIN_SIZE_MIN..PIN_SIZE_MAX) to reference px at 3600. */
export function pinSizeToRefPx(pinSize: number): number {
  const t = (pinSize - PIN_SIZE_MIN) / (PIN_SIZE_MAX - PIN_SIZE_MIN);
  return PIN_REF_MIN_PX + t * (PIN_REF_MAX_PX - PIN_REF_MIN_PX);
}
