export interface MapShape {
  id: string;
  label: string;
  /** CSS clip-path polygon/circle/path for the preview container. */
  cssClipPath: string;
  /** Returns a Path2D for canvas clipping at given width/height. */
  canvasClipPath: (w: number, h: number) => Path2D;
  /** SVG path for the picker icon (viewBox 0 0 24 24). */
  iconPath: string;
  /**
   * Ratio (0-1) of the poster height where the shape ends.
   * Text is positioned below this line for non-none shapes.
   * "none" = 1 (full bleed, text overlays the map).
   */
  shapeBottomRatio: number;
}

export const DEFAULT_MAP_SHAPE_ID = "none";

export const MAP_SHAPES: MapShape[] = [
  {
    id: "none",
    label: "None",
    cssClipPath: "none",
    canvasClipPath: (w, h) => {
      const p = new Path2D();
      p.rect(0, 0, w, h);
      return p;
    },
    // Prohibition sign: circle with diagonal line using proper arcs
    iconPath: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM5.7 17.3 17.3 5.7a.9.9 0 0 1 1 1L6.7 18.3a.9.9 0 0 1-1-1z",
    shapeBottomRatio: 1,
  },
  {
    id: "classic",
    label: "Classic",
    cssClipPath: "inset(5% 6% 22% 6% round 2%)",
    canvasClipPath: (w, h) => {
      const p = new Path2D();
      const l = w * 0.06;
      const t = h * 0.05;
      const r = w * 0.94;
      const b = h * 0.78;
      const radius = Math.min(w, h) * 0.02;
      p.moveTo(l + radius, t);
      p.lineTo(r - radius, t);
      p.arcTo(r, t, r, t + radius, radius);
      p.lineTo(r, b - radius);
      p.arcTo(r, b, r - radius, b, radius);
      p.lineTo(l + radius, b);
      p.arcTo(l, b, l, b - radius, radius);
      p.lineTo(l, t + radius);
      p.arcTo(l, t, l + radius, t, radius);
      p.closePath();
      return p;
    },
    iconPath: "M5 4h14v14H5z",
    shapeBottomRatio: 0.78,
  },
  {
    id: "wave",
    label: "Wave",
    cssClipPath:
      "polygon(0% 0%, 100% 0%, 100% 68%, 90% 73%, 75% 71%, 60% 75%, 45% 73%, 30% 71%, 15% 75%, 0% 71%)",
    canvasClipPath: (w, h) => {
      const p = new Path2D();
      p.moveTo(0, 0);
      p.lineTo(w, 0);
      p.lineTo(w, h * 0.68);
      // wave curve
      p.bezierCurveTo(w * 0.85, h * 0.75, w * 0.7, h * 0.69, w * 0.5, h * 0.73);
      p.bezierCurveTo(w * 0.3, h * 0.77, w * 0.15, h * 0.69, 0, h * 0.71);
      p.closePath();
      return p;
    },
    iconPath:
      "M3 3h18v12c-1.5 1.2-3 1.8-4.5 1.2s-3-1.8-4.5-1.2-3 1.8-4.5 1.2S3 15 3 15z",
    shapeBottomRatio: 0.75,
  },
  {
    id: "circle",
    label: "Circle",
    // center at 40% down, radius 30% of min dimension
    cssClipPath: "circle(30% at 50% 38%)",
    canvasClipPath: (w, h) => {
      const p = new Path2D();
      const cx = w / 2;
      const cy = h * 0.38;
      const r = Math.min(w, h) * 0.30;
      p.arc(cx, cy, r, 0, Math.PI * 2);
      return p;
    },
    iconPath: "M12 4a8 8 0 100 16 8 8 0 000-16z",
    shapeBottomRatio: 0.72,
  },
  {
    id: "heart",
    label: "Heart",
    // Generated dynamically in PosterPreview to preserve aspect ratio
    cssClipPath: "heart",
    canvasClipPath: (w, h) => {
      // heart-icon.svg viewBox 0 0 122.88 107.41 — preserve aspect ratio
      const ar = 122.88 / 107.41;
      const hw = w * 0.84;
      const hh = h * 0.60;
      const finalW = hh * ar;
      const ox = (w - finalW) / 2;
      const oy = h * 0.10;
      const sx = (x: number) => ox + (x / 122.88) * finalW;
      const sy = (y: number) => oy + (y / 107.41) * hh;

      const p = new Path2D();
      p.moveTo(sx(60.83), sy(17.19));
      p.bezierCurveTo(sx(68.84), sy(8.84), sx(74.45), sy(1.62), sx(86.79), sy(0.21));
      p.bezierCurveTo(sx(109.96), sy(-2.45), sx(131.27), sy(21.27), sx(119.57), sy(44.62));
      p.bezierCurveTo(sx(116.24), sy(51.27), sx(109.46), sy(59.18), sx(101.96), sy(66.94));
      p.bezierCurveTo(sx(93.73), sy(75.46), sx(84.62), sy(83.81), sx(78.24), sy(90.14));
      p.lineTo(sx(60.84), sy(107.40));
      p.lineTo(sx(46.46), sy(93.56));
      p.bezierCurveTo(sx(29.16), sy(76.9), sx(0.95), sy(55.93), sx(0.02), sy(29.95));
      p.bezierCurveTo(sx(-0.63), sy(11.75), sx(13.73), sy(0.09), sx(30.25), sy(0.3));
      p.bezierCurveTo(sx(45.01), sy(0.5), sx(51.22), sy(7.84), sx(60.83), sy(17.19));
      p.closePath();
      return p;
    },
    iconPath:
      "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    shapeBottomRatio: 0.72,
  },
  {
    id: "house",
    label: "House",
    // Inset from edges to prevent cutoff
    cssClipPath: "polygon(50% 8%, 90% 32%, 90% 72%, 10% 72%, 10% 32%)",
    canvasClipPath: (w, h) => {
      const p = new Path2D();
      p.moveTo(w * 0.5, h * 0.08);
      p.lineTo(w * 0.9, h * 0.32);
      p.lineTo(w * 0.9, h * 0.72);
      p.lineTo(w * 0.1, h * 0.72);
      p.lineTo(w * 0.1, h * 0.32);
      p.closePath();
      return p;
    },
    iconPath: "M12 3L2 10h3v8h14v-8h3z",
    shapeBottomRatio: 0.76,
  },
];


export function getMapShapeById(id: string): MapShape | undefined {
  return MAP_SHAPES.find((s) => s.id === id);
}

export function resolveMapShape(id: string): MapShape {
  const found = MAP_SHAPES.find((s) => s.id === id);
  if (!found) return MAP_SHAPES[0]!;
  return found;
}

/** Scale factor: 0.5 = smaller shape, 1 = default, 1.5 = larger shape. */
export function getScaledCanvasClipPath(
  shapeId: string,
  w: number,
  h: number,
  scale: number,
): Path2D {
  const shape = resolveMapShape(shapeId);
  if (shapeId === "none" || scale === 1) {
    return shape.canvasClipPath(w, h);
  }

  if (shapeId === "classic") {
    const inv = 1 / scale;
    const l = w * 0.06 * inv;
    const t = h * 0.05 * inv;
    const r = w * (1 - 0.06 * inv);
    const b = h * (1 - 0.22 * inv);
    const radius = Math.min(w, h) * 0.02 * inv;
    const p = new Path2D();
    p.moveTo(l + radius, t);
    p.lineTo(r - radius, t);
    p.arcTo(r, t, r, t + radius, radius);
    p.lineTo(r, b - radius);
    p.arcTo(r, b, r - radius, b, radius);
    p.lineTo(l + radius, b);
    p.arcTo(l, b, l, b - radius, radius);
    p.lineTo(l, t + radius);
    p.arcTo(l, t, l + radius, t, radius);
    p.closePath();
    return p;
  }

  if (shapeId === "circle") {
    const r = Math.min(w, h) * 0.30 * scale;
    const cx = w / 2;
    const cy = h * 0.38;
    const p = new Path2D();
    p.arc(cx, cy, Math.min(r, w * 0.49, h * 0.49), 0, Math.PI * 2);
    return p;
  }

  if (shapeId === "wave") {
    const bottomY = h * Math.min(0.95, 0.68 * scale);
    const p = new Path2D();
    p.moveTo(0, 0);
    p.lineTo(w, 0);
    p.lineTo(w, bottomY);
    p.bezierCurveTo(w * 0.85, bottomY * 1.1, w * 0.7, bottomY * 1.02, w * 0.5, bottomY * 1.06);
    p.bezierCurveTo(w * 0.3, bottomY * 1.1, w * 0.15, bottomY * 1.02, 0, bottomY * 1.04);
    p.closePath();
    return p;
  }

  if (shapeId === "heart") {
    const ar = 122.88 / 107.41;
    const sizeFactor = 0.6 * scale;
    const hh = h * sizeFactor;
    const finalW = hh * ar;
    const ox = (w - finalW) / 2;
    const oy = h * 0.10;
    const sx = (x: number) => ox + (x / 122.88) * finalW;
    const sy = (y: number) => oy + (y / 107.41) * hh;

    const p = new Path2D();
    p.moveTo(sx(60.83), sy(17.19));
    p.bezierCurveTo(sx(68.84), sy(8.84), sx(74.45), sy(1.62), sx(86.79), sy(0.21));
    p.bezierCurveTo(sx(109.96), sy(-2.45), sx(131.27), sy(21.27), sx(119.57), sy(44.62));
    p.bezierCurveTo(sx(116.24), sy(51.27), sx(109.46), sy(59.18), sx(101.96), sy(66.94));
    p.bezierCurveTo(sx(93.73), sy(75.46), sx(84.62), sy(83.81), sx(78.24), sy(90.14));
    p.lineTo(sx(60.84), sy(107.40));
    p.lineTo(sx(46.46), sy(93.56));
    p.bezierCurveTo(sx(29.16), sy(76.9), sx(0.95), sy(55.93), sx(0.02), sy(29.95));
    p.bezierCurveTo(sx(-0.63), sy(11.75), sx(13.73), sy(0.09), sx(30.25), sy(0.3));
    p.bezierCurveTo(sx(45.01), sy(0.5), sx(51.22), sy(7.84), sx(60.83), sy(17.19));
    p.closePath();
    return p;
  }

  if (shapeId === "house") {
    const margin = 0.1 / scale;
    const topY = h * (0.08 / scale);
    const midY = h * 0.32;
    const bottomY = h * (1 - 0.28 / scale);
    const p = new Path2D();
    p.moveTo(w * 0.5, topY);
    p.lineTo(w * (1 - margin), midY);
    p.lineTo(w * (1 - margin), bottomY);
    p.lineTo(w * margin, bottomY);
    p.lineTo(w * margin, midY);
    p.closePath();
    return p;
  }

  return shape.canvasClipPath(w, h);
}

/** Returns CSS clip-path string for preview. Scale 0.5-1.5. */
export function getScaledCssClipPath(
  shapeId: string,
  fw: number,
  fh: number,
  scale: number,
): string | undefined {
  const shape = resolveMapShape(shapeId);
  if (shapeId === "none") return undefined;
  if (scale === 1 && shape.cssClipPath !== "heart") {
    return shape.cssClipPath;
  }

  if (shapeId === "classic") {
    const inv = 1 / scale;
    const t = 5 * inv;
    const s = 6 * inv;
    const b = 22 * inv;
    const r = 2 * inv;
    return `inset(${t}% ${s}% ${b}% ${s}% round ${r}%)`;
  }

  if (shapeId === "circle") {
    const r = Math.min(45, 30 * scale);
    return `circle(${r}% at 50% 38%)`;
  }

  if (shapeId === "wave") {
    const bottom = Math.min(95, 68 * scale);
    return `polygon(0% 0%, 100% 0%, 100% ${bottom}%, 90% ${bottom + 5}%, 75% ${bottom - 2}%, 60% ${bottom + 2}%, 45% ${bottom - 2}%, 30% ${bottom - 2}%, 15% ${bottom + 2}%, 0% ${bottom - 2}%)`;
  }

  if (shapeId === "heart") {
    const ar = 122.88 / 107.41;
    const sizeFactor = 0.6 * scale;
    const hh = fh * sizeFactor;
    const finalW = hh * ar;
    const ox = (fw - finalW) / 2;
    const oy = fh * 0.10;
    const sx = (x: number) => ox + (x / 122.88) * finalW;
    const sy = (y: number) => oy + (y / 107.41) * hh;
    return `path('M${sx(60.83)} ${sy(17.19)} C${sx(68.84)} ${sy(8.84)} ${sx(74.45)} ${sy(1.62)} ${sx(86.79)} ${sy(0.21)} C${sx(109.96)} ${sy(-2.45)} ${sx(131.27)} ${sy(21.27)} ${sx(119.57)} ${sy(44.62)} C${sx(116.24)} ${sy(51.27)} ${sx(109.46)} ${sy(59.18)} ${sx(101.96)} ${sy(66.94)} C${sx(93.73)} ${sy(75.46)} ${sx(84.62)} ${sy(83.81)} ${sx(78.24)} ${sy(90.14)} L${sx(60.84)} ${sy(107.40)} L${sx(46.46)} ${sy(93.56)} C${sx(29.16)} ${sy(76.9)} ${sx(0.95)} ${sy(55.93)} ${sx(0.02)} ${sy(29.95)} C${sx(-0.63)} ${sy(11.75)} ${sx(13.73)} ${sy(0.09)} ${sx(30.25)} ${sy(0.3)} C${sx(45.01)} ${sy(0.5)} ${sx(51.22)} ${sy(7.84)} ${sx(60.83)} ${sy(17.19)}Z')`;
  }

  if (shapeId === "house") {
    const margin = 10 / scale;
    const top = 8 / scale;
    const bottom = 100 - 28 / scale;
    return `polygon(50% ${top}%, ${100 - margin}% 32%, ${100 - margin}% ${bottom}%, ${margin}% ${bottom}%, ${margin}% 32%)`;
  }

  return shape.cssClipPath;
}
