import { useEffect, useRef } from "react";
import { renderTo } from "../render/render";
import type { TextBox } from "../render/types";
import { imgOf, useStudio } from "../store";

export function Preview() {
  const st = useStudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<TextBox | null>(null);
  const dragRef = useRef<
    | { type: "text"; x: number; y: number }
    | { type: "orbit"; px: number; py: number; rotX: number; rotY: number }
    | null
  >(null);

  // Auf jede Store-Änderung neu rendern (voll aufgelöst, wie der Export).
  useEffect(() => {
    const slide = st.slides[st.current];
    boxRef.current = renderTo(canvasRef.current!, st, slide, imgOf(st, slide));
    fit();
  });

  const fit = () => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const mh = wrap.clientHeight - 56;
    const mw = wrap.clientWidth - 56;
    const ratio = canvas.width / canvas.height;
    let h = mh;
    let w = h * ratio;
    if (w > mw) {
      w = mw;
      h = w / ratio;
    }
    canvas.style.height = h + "px";
    canvas.style.width = w + "px";
  };

  useEffect(() => {
    const ro = new ResizeObserver(fit);
    ro.observe(wrapRef.current!);
    return () => ro.disconnect();
  }, []);

  const toCanvas = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * canvas.width) / r.width,
      y: ((e.clientY - r.top) * canvas.height) / r.height,
    };
  };

  const inBox = (p: { x: number; y: number }) => {
    const b = boxRef.current;
    return !!b && p.x >= b.x - 12 && p.x <= b.x + b.w + 12 && p.y >= b.y - 12 && p.y <= b.y + b.h + 12;
  };

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        id="preview"
        onPointerDown={(e) => {
          const p = toCanvas(e);
          // Text-Hit-Test zuerst; daneben dreht der Drag in 3D das Handy
          if (inBox(p)) {
            const b = boxRef.current!;
            dragRef.current = { type: "text", x: p.x - (b.x + b.w / 2), y: p.y - (b.y + b.h / 2) };
          } else if (st.mode === "3d") {
            dragRef.current = {
              type: "orbit",
              px: e.clientX,
              py: e.clientY,
              rotX: st.rotX,
              rotY: st.rotY,
            };
          } else {
            return;
          }
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.style.cursor = "grabbing";
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          if (drag?.type === "text") {
            const p = toCanvas(e);
            useStudio.getState().patch({
              textAnchor: {
                x: (p.x - drag.x) / st.format.w,
                y: (p.y - drag.y) / st.format.h,
              },
            });
          } else if (drag?.type === "orbit") {
            const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
            useStudio.getState().patch({
              rotY: clamp(drag.rotY + (e.clientX - drag.px) * 0.3, -70, 70),
              rotX: clamp(drag.rotX + (e.clientY - drag.py) * 0.3, -45, 45),
            });
          } else {
            const p = toCanvas(e);
            e.currentTarget.style.cursor = inBox(p)
              ? "grab"
              : st.mode === "3d"
                ? "move"
                : "default";
          }
        }}
        onPointerUp={(e) => {
          if (dragRef.current) {
            dragRef.current = null;
            e.currentTarget.style.cursor = "grab";
          }
        }}
      />
    </div>
  );
}
