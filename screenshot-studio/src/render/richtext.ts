// Rich-Text-Pipeline: contenteditable-HTML → formatierte Runs → manueller
// Zeilenumbruch → Canvas-Zeichnung. Bold/Italic/Underline werden über die
// computed styles eines versteckten Parser-Elements erkannt, damit beliebig
// verschachteltes Editor-HTML (b/strong, i/em, u, spans) korrekt gelesen wird.

export interface Run {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string | null; // null = globale Textfarbe
}

export type Paragraph = Run[];

interface Token {
  text: string;
  run: Run;
  sp: boolean;
  mw: number;
}

export interface Line {
  seg: Token[];
  w: number;
}

export interface TextLayout {
  lines: Line[];
  width: number;
  height: number;
  lineH: number;
}

// Sentinel-Farbe am Parser-Root: erbt ein Textknoten diese computed color,
// hat der Editor keine eigene Farbe gesetzt → Run nutzt die globale Textfarbe.
const COLOR_SENTINEL = "rgb(1, 2, 3)";

let parser: HTMLDivElement | null = null;
function getParser(): HTMLDivElement {
  if (!parser) {
    parser = document.createElement("div");
    parser.id = "rt-parser";
    parser.style.color = COLOR_SENTINEL;
    document.body.appendChild(parser);
  }
  return parser;
}

export function parseHTML(html: string): Paragraph[] {
  const el = getParser();
  el.innerHTML = html || "";
  const paras: Paragraph[] = [];
  let cur: Paragraph = [];
  const brk = () => {
    paras.push(cur);
    cur = [];
  };
  function walk(node: Node) {
    node.childNodes.forEach((ch) => {
      if (ch.nodeType === Node.TEXT_NODE) {
        const t = ch.nodeValue;
        if (t && ch.parentElement) {
          const cs = getComputedStyle(ch.parentElement);
          cur.push({
            text: t,
            bold: (parseInt(cs.fontWeight) || 400) >= 600 || cs.fontWeight === "bold",
            italic: cs.fontStyle === "italic",
            underline: (cs.textDecorationLine || cs.textDecoration || "").includes("underline"),
            color: cs.color === COLOR_SENTINEL ? null : cs.color,
          });
        }
      } else if (ch.nodeType === Node.ELEMENT_NODE) {
        const tag = (ch as Element).tagName;
        if (tag === "BR") {
          brk();
        } else if (tag === "DIV" || tag === "P") {
          if (cur.length) brk();
          walk(ch);
          brk();
        } else {
          walk(ch);
        }
      }
    });
  }
  walk(el);
  if (cur.length) paras.push(cur);
  return paras.filter((p) => p.length);
}

export function fontStr(
  run: Pick<Run, "bold" | "italic">,
  size: number,
  family: string,
  nw: number,
  bw: number,
): string {
  return `${run.italic ? "italic " : ""}${run.bold ? bw : nw} ${size}px ${family}`;
}

export function layout(
  ctx: CanvasRenderingContext2D,
  paras: Paragraph[],
  maxW: number,
  size: number,
  family: string,
  nw: number,
  bw: number,
): TextLayout {
  const lines: Line[] = [];
  for (const para of paras) {
    const toks: Omit<Token, "mw">[] = [];
    para.forEach((run) => {
      (run.text || "").split(/(\s+)/).forEach((p) => {
        if (p.length) toks.push({ text: p, run, sp: /^\s+$/.test(p) });
      });
    });
    let seg: Token[] = [];
    let w = 0;
    const flush = () => {
      while (seg.length && seg[seg.length - 1].sp) {
        w -= seg[seg.length - 1].mw;
        seg.pop();
      }
      lines.push({ seg, w });
      seg = [];
      w = 0;
    };
    toks.forEach((t) => {
      ctx.font = fontStr(t.run, size, family, nw, bw);
      const mw = ctx.measureText(t.text).width;
      if (!t.sp && seg.some((s) => !s.sp) && w + mw > maxW) flush();
      if (t.sp && seg.length === 0) return;
      seg.push({ ...t, mw });
      w += mw;
    });
    flush();
  }
  const width = lines.length ? Math.max(...lines.map((l) => l.w)) : 0;
  const lineH = size * 1.18;
  return { lines, width, height: lines.length * lineH, lineH };
}

export function drawBlock(
  ctx: CanvasRenderingContext2D,
  lay: TextLayout,
  cx: number,
  topY: number,
  size: number,
  family: string,
  nw: number,
  bw: number,
  color: string,
  shadow: number,
) {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  let y = topY;
  for (const line of lay.lines) {
    let x = cx - line.w / 2;
    const base = y + size * 0.82;
    for (const s of line.seg) {
      ctx.font = fontStr(s.run, size, family, nw, bw);
      ctx.fillStyle = s.run.color ?? color;
      if (shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.20)";
        ctx.shadowBlur = size * 0.13;
        ctx.shadowOffsetY = size * 0.05;
      }
      ctx.fillText(s.text, x, base);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (s.run.underline && !s.sp) {
        ctx.strokeStyle = s.run.color ?? color;
        ctx.lineWidth = Math.max(1, size * 0.05);
        const uy = base + size * 0.14;
        ctx.beginPath();
        ctx.moveTo(x, uy);
        ctx.lineTo(x + s.mw, uy);
        ctx.stroke();
      }
      x += s.mw;
    }
    y += lay.lineH;
  }
}
