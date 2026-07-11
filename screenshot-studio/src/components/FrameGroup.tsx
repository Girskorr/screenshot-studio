import type { FrameStyle, PhoneMode, RenderSettings } from "../render/types";
import { useStudio } from "../store";
import { Seg } from "./Seg";

function Slider({
  label,
  unit = "",
  min,
  max,
  field,
}: {
  label: string;
  unit?: string;
  min: number;
  max: number;
  field: "scale" | "offsetY" | "rot" | "rotX" | "rotY" | "rotZ" | "fov" | "lightAngle" | "lightIntensity";
}) {
  const value = useStudio((s) => s[field]);
  const patch = useStudio((s) => s.patch);
  return (
    <div className="field">
      <label>
        {label}{" "}
        <span className="sliderval">
          {value}
          {unit}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => patch({ [field]: +e.target.value } as Partial<RenderSettings>)}
      />
    </div>
  );
}

export function FrameGroup() {
  const mode = useStudio((s) => s.mode);
  const frame = useStudio((s) => s.frame);
  const frameColor = useStudio((s) => s.frameColor);
  const patch = useStudio((s) => s.patch);

  return (
    <div className="group">
      <label className="title">Phone frame</label>
      <div className="field">
        <label>Rendering</label>
        <Seg
          options={[
            { v: "2d", label: "Flat (2D)" },
            { v: "3d", label: "3D" },
          ]}
          value={mode}
          onChange={(v) => patch({ mode: v as PhoneMode })}
        />
      </div>
      <div className="field">
        <label>Style</label>
        <Seg
          options={[
            { v: "android", label: "Android" },
            { v: "minimal", label: "Minimal" },
            { v: "none", label: "None" },
          ]}
          value={frame}
          onChange={(v) => patch({ frame: v as FrameStyle })}
        />
      </div>
      <div className="field">
        <div className="colorrow">
          <input
            type="color"
            value={frameColor}
            onChange={(e) => patch({ frameColor: e.target.value })}
          />
          <span>Frame color</span>
        </div>
      </div>
      <Slider label="Size" unit="%" min={55} max={135} field="scale" />
      <Slider label="Vertical position" min={-25} max={25} field="offsetY" />
      {mode === "2d" ? (
        <Slider label="Tilt" unit="°" min={-12} max={12} field="rot" />
      ) : (
        <>
          <Slider label="Y rotation" unit="°" min={-70} max={70} field="rotY" />
          <Slider label="X tilt" unit="°" min={-45} max={45} field="rotX" />
          <Slider label="Z roll" unit="°" min={-30} max={30} field="rotZ" />
          <Slider label="Perspective" unit="°" min={15} max={60} field="fov" />
          <Slider label="Light angle" unit="°" min={-180} max={180} field="lightAngle" />
          <Slider label="Light intensity" unit="%" min={0} max={200} field="lightIntensity" />
          <div className="hint">
            You can also rotate the phone right on the preview — drag outside the text.
          </div>
        </>
      )}
    </div>
  );
}
