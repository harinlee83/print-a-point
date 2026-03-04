import {
  getPinStyleById,
  DEFAULT_PIN_STYLE_ID,
  pinSizeToRefPx,
} from "~/lib/pin/pinStyles";
import { TEXT_DIMENSION_REFERENCE_PX } from "./textLayout";

export interface DrawPinInput {
  width: number;
  height: number;
  showPin: boolean;
  pinStyleId: string;
  pinColor: string;
  pinSize: number;
}

export function drawPin(
  ctx: CanvasRenderingContext2D,
  input: DrawPinInput,
): void {
  if (!input.showPin) return;

  const style =
    getPinStyleById(input.pinStyleId) || getPinStyleById(DEFAULT_PIN_STYLE_ID);
  if (!style) return;

  const { width, height } = input;
  const dimScale = Math.min(width, height) / TEXT_DIMENSION_REFERENCE_PX;
  const refPx = pinSizeToRefPx(input.pinSize);
  const pinHeight = refPx * dimScale;
  const aspect = style.viewBox[2] / style.viewBox[3];
  const pinWidth = pinHeight * aspect;

  const anchorFractionX = style.anchor[0] / style.viewBox[2];
  const anchorFractionY = style.anchor[1] / style.viewBox[3];

  const x = width / 2 - anchorFractionX * pinWidth;
  const y = height / 2 - anchorFractionY * pinHeight;

  const scaleX = pinWidth / style.viewBox[2];
  const scaleY = pinHeight / style.viewBox[3];

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  const path = new Path2D(style.path);
  ctx.fillStyle = input.pinColor;
  ctx.fill(path);

  ctx.restore();
}
