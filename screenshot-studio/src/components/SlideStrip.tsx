import { useEffect, useRef } from "react";
import { renderTo } from "../render/render";
import { imgOf, useStudio } from "../store";

// Thumbnails rendern über dieselbe renderTo()-Pipeline in voller Auflösung.
// Leicht verzögert, damit schnelle Folgen von Änderungen (Slider, Text-Drag)
// nicht bei jedem Zwischenschritt alle Folien neu zeichnen.
function Thumb({ index }: { index: number }) {
  const st = useStudio();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const slide = st.slides[index];
      if (slide && ref.current) renderTo(ref.current, st, slide, imgOf(st, slide));
    }, 100);
    return () => clearTimeout(t);
  });

  return (
    <div
      className={"thumb" + (index === st.current ? " active" : "")}
      onClick={() => st.selectSlide(index)}
    >
      <canvas ref={ref} />
      <div className="num">{index + 1}</div>
      {st.slides.length > 1 && (
        <div
          className="del"
          onClick={(e) => {
            e.stopPropagation();
            st.removeSlide(index);
          }}
        >
          ×
        </div>
      )}
    </div>
  );
}

export function SlideStrip() {
  const slides = useStudio((s) => s.slides);
  const addSlide = useStudio((s) => s.addSlide);

  return (
    <div className="slides">
      {slides.map((_, i) => (
        <Thumb key={i} index={i} />
      ))}
      <div className="addslide" title="Add slide" onClick={addSlide}>
        +
      </div>
    </div>
  );
}
