import { BG_PRESETS } from "../render/constants";
import { useStudio } from "../store";

export function BackgroundGroup() {
  const bg1 = useStudio((s) => s.bg1);
  const bg2 = useStudio((s) => s.bg2);
  const angle = useStudio((s) => s.angle);
  const gradientOn = useStudio((s) => s.gradientOn);
  const patch = useStudio((s) => s.patch);

  return (
    <div className="group">
      <label className="title">Background</label>
      <div className="swatches">
        {BG_PRESETS.map((p) => (
          <div
            key={p.name}
            className={"swatch" + (bg1 === p.c1 && bg2 === p.c2 ? " active" : "")}
            style={{ background: `linear-gradient(135deg,${p.c1},${p.c2})` }}
            title={p.name}
            onClick={() => patch({ bg1: p.c1, bg2: p.c2 })}
          />
        ))}
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>Custom colors</label>
        <div className="colorrow">
          <input type="color" value={bg1} onChange={(e) => patch({ bg1: e.target.value })} />
          {gradientOn && (
            <input type="color" value={bg2} onChange={(e) => patch({ bg2: e.target.value })} />
          )}
          <label className="checkrow">
            <input
              type="checkbox"
              checked={gradientOn}
              onChange={(e) => patch({ gradientOn: e.target.checked })}
            />
            Gradient
          </label>
        </div>
      </div>
      {gradientOn && (
        <div className="field">
          <label>
            Gradient angle <span className="sliderval">{angle}°</span>
          </label>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => patch({ angle: +e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
