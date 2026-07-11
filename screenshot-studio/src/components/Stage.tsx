import { FORMATS } from "../render/constants";
import { download } from "../render/export";
import { renderTo } from "../render/render";
import type { Slide } from "../render/types";
import { imgOf, useStudio } from "../store";
import { Preview } from "./Preview";
import { SlideStrip } from "./SlideStrip";

function exportSlide(slide: Slide, name: string) {
  const st = useStudio.getState();
  const c = document.createElement("canvas");
  renderTo(c, st, slide, imgOf(st, slide));
  download(c, name);
}

export function Stage() {
  const format = useStudio((s) => s.format);
  const patch = useStudio((s) => s.patch);

  return (
    <main className="stage">
      <div className="topbar">
        <select
          value={FORMATS.indexOf(format)}
          onChange={(e) => patch({ format: FORMATS[+e.target.value] })}
        >
          {FORMATS.map((f, i) => (
            <option key={f.name} value={i}>
              {f.name}
            </option>
          ))}
        </select>
        <div className="spacer" />
        <button
          className="btn ghost"
          onClick={() => {
            const st = useStudio.getState();
            exportSlide(st.slides[st.current], `screenshot-${st.current + 1}.png`);
          }}
        >
          This slide
        </button>
        <button
          className="btn primary"
          onClick={() => {
            useStudio.getState().slides.forEach((s, i) => {
              setTimeout(() => exportSlide(s, `screenshot-${i + 1}.png`), i * 500);
            });
          }}
        >
          Download all
        </button>
      </div>
      <Preview />
      <SlideStrip />
    </main>
  );
}
