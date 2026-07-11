import { FONT_OPTIONS, FONTS, type FontKey } from "../render/constants";
import { useStudio } from "../store";

export function TypographyGroup() {
  const font = useStudio((s) => s.font);
  const textColor = useStudio((s) => s.textColor);
  const hSize = useStudio((s) => s.hSize);
  const patch = useStudio((s) => s.patch);

  return (
    <div className="group">
      <label className="title">Typography</label>
      <div className="field">
        <label>Font</label>
        <select value={font} onChange={(e) => patch({ font: e.target.value as FontKey })}>
          {FONT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key} style={{ fontFamily: FONTS[o.key] }}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <div className="colorrow">
          <input
            type="color"
            value={textColor}
            onChange={(e) => patch({ textColor: e.target.value })}
          />
          <span>Text color</span>
        </div>
      </div>
      <div className="field">
        <label>
          Text size <span className="sliderval">{hSize}%</span>
        </label>
        <input
          type="range"
          min={50}
          max={170}
          value={hSize}
          onChange={(e) => patch({ hSize: +e.target.value })}
        />
      </div>
    </div>
  );
}
