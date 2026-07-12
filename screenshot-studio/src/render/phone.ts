import { chassisSpec, defaultAspect } from "./chassis";
import { FONTS } from "./constants";
import type { RenderSettings } from "./types";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height;
  const tr = w / h;
  let dw: number, dh: number;
  if (ir > tr) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export function drawPhone(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: RenderSettings,
  img: HTMLImageElement | null,
) {
  const kind = s.format.kind ?? "phone";
  const aspect = img ? img.width / img.height : defaultAspect(kind);
  const phoneW = W * 0.62 * (s.scale / 100);
  const spec = chassisSpec(kind, s.frame);
  const bezel = phoneW * spec.bezel;
  const radius = phoneW * spec.radius;
  const notch = spec.punch;
  const innerW = phoneW - 2 * bezel;
  const innerH = innerW / aspect;
  const phoneH = innerH + 2 * bezel;
  const phoneX = (W - phoneW) / 2;
  const phoneY = H * 0.085 + (s.offsetY / 100) * H;
  ctx.save();
  const ccx = phoneX + phoneW / 2;
  const ccy = phoneY + phoneH / 2;
  ctx.translate(ccx, ccy);
  ctx.rotate((s.rot * Math.PI) / 180);
  ctx.translate(-ccx, -ccy);
  const px = phoneX;
  const py = phoneY;
  if (s.frame !== "none") {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.40)";
    ctx.shadowBlur = phoneW * 0.1;
    ctx.shadowOffsetY = phoneH * 0.025;
    ctx.fillStyle = s.frameColor;
    roundRect(ctx, px, py, phoneW, phoneH, radius);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = Math.max(1, phoneW * 0.004);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    roundRect(
      ctx,
      px + ctx.lineWidth,
      py + ctx.lineWidth,
      phoneW - 2 * ctx.lineWidth,
      phoneH - 2 * ctx.lineWidth,
      radius,
    );
    ctx.stroke();
  } else {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.30)";
    ctx.shadowBlur = phoneW * 0.08;
    ctx.shadowOffsetY = phoneH * 0.02;
  }
  const sx = px + bezel;
  const sy = py + bezel;
  const sw = innerW;
  const sh = innerH;
  const sR = Math.max(0, radius - bezel);
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, sR);
  ctx.clip();
  if (img) {
    drawCover(ctx, img, sx, sy, sw, sh);
  } else {
    const g = ctx.createLinearGradient(sx, sy, sx, sy + sh);
    g.addColorStop(0, "#f2f3f7");
    g.addColorStop(1, "#dde0e8");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = "#9aa0ad";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${sw * 0.07}px ${FONTS.sans}`;
    ctx.fillText("Choose a screenshot", sx + sw / 2, sy + sh / 2);
  }
  ctx.restore();
  if (s.frame === "none") ctx.restore();
  if (notch) {
    const r = innerW * 0.016;
    ctx.fillStyle = "#050507";
    ctx.beginPath();
    ctx.arc(sx + sw / 2, sy + bezel * 1.4 + r, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
