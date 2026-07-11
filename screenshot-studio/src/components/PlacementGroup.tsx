import { useStudio } from "../store";
import { Seg } from "./Seg";

const POS_Y: Record<string, number> = { top: 0.12, mid: 0.5, bottom: 0.9 };

export function PlacementGroup() {
  const textAnchor = useStudio((s) => s.textAnchor);
  const shadow = useStudio((s) => s.shadow);
  const patch = useStudio((s) => s.patch);

  const posValue =
    Object.entries(POS_Y).find(([, y]) => textAnchor.x === 0.5 && textAnchor.y === y)?.[0] ?? null;

  return (
    <div className="group">
      <label className="title">Text placement</label>
      <Seg
        options={[
          { v: "top", label: "Top" },
          { v: "mid", label: "Middle" },
          { v: "bottom", label: "Bottom" },
        ]}
        value={posValue}
        onChange={(v) => patch({ textAnchor: { x: 0.5, y: POS_Y[v] } })}
      />
      <div className="hint">Or drag the text right on the preview to place it anywhere.</div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>
          Text shadow <span className="sliderval">{shadow ? "on" : "off"}</span>
        </label>
        <Seg
          options={[
            { v: "1", label: "On" },
            { v: "0", label: "Off" },
          ]}
          value={String(shadow)}
          onChange={(v) => patch({ shadow: +v })}
        />
      </div>
    </div>
  );
}
