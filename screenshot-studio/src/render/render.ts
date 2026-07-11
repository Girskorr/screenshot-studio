// Zentraler Compositor: Vorschau, Folien-Thumbnails und PNG-Export laufen
// alle durch renderTo() in voller Zielauflösung — die Vorschau ist dadurch
// immer pixelidentisch mit dem Export. Dieses Modul ist bewusst React-frei.

import { FONTS } from "./constants";
import { drawPhone } from "./phone";
import { renderPhone3D } from "./phone3d";
import { drawBlock, layout, parseHTML } from "./richtext";
import type { RenderSettings, Slide, TextBox } from "./types";

export function renderTo(
  canvas: HTMLCanvasElement,
  s: RenderSettings,
  slide: Slide,
  img: HTMLImageElement | null,
): TextBox {
  const W = s.format.w;
  const H = s.format.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  // Hintergrund
  if (s.gradientOn) {
    const a = (s.angle * Math.PI) / 180;
    const len = Math.max(W, H);
    const gx = (Math.cos(a) * len) / 2;
    const gy = (Math.sin(a) * len) / 2;
    const grad = ctx.createLinearGradient(W / 2 - gx, H / 2 - gy, W / 2 + gx, H / 2 + gy);
    grad.addColorStop(0, s.bg1);
    grad.addColorStop(1, s.bg2);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = s.bg1;
  }
  ctx.fillRect(0, 0, W, H);
  // Handy — in 3D als Ebene aus dem WebGL-Canvas komponiert
  if (s.mode === "3d") {
    ctx.drawImage(renderPhone3D(s, img, W, H), 0, 0);
  } else {
    drawPhone(ctx, W, H, s, img);
  }
  // Text
  const fam = FONTS[s.font];
  const hSize = W * 0.072 * (s.hSize / 100);
  const sSize = hSize * 0.5;
  const maxW = W * 0.9;
  const hl = layout(ctx, parseHTML(slide.headlineHTML), maxW, hSize, fam, 400, 800);
  const sb = layout(ctx, parseHTML(slide.subHTML), maxW, sSize, fam, 400, 700);
  const gap = sb.lines.length ? hSize * 0.28 : 0;
  const totalH = hl.height + gap + sb.height;
  const blockW = Math.max(hl.width, sb.width);
  let cx = s.textAnchor.x * W;
  let cy = s.textAnchor.y * H;
  cx = Math.max(blockW / 2 + 8, Math.min(W - blockW / 2 - 8, cx));
  cy = Math.max(totalH / 2 + 8, Math.min(H - totalH / 2 - 8, cy));
  const topY = cy - totalH / 2;
  drawBlock(ctx, hl, cx, topY, hSize, fam, 400, 800, s.textColor, s.shadow);
  drawBlock(ctx, sb, cx, topY + hl.height + gap, sSize, fam, 400, 700, s.textColor, s.shadow);
  return { x: cx - blockW / 2, y: topY, w: blockW, h: totalH };
}
