import { BackgroundGroup } from "./BackgroundGroup";
import { FrameGroup } from "./FrameGroup";
import { GalleryGroup } from "./GalleryGroup";
import { PlacementGroup } from "./PlacementGroup";
import { TextEditorGroup } from "./TextEditorGroup";
import { TypographyGroup } from "./TypographyGroup";

export function Panel() {
  return (
    <aside className="panel">
      <div className="brand">
        <div className="dot" />
        <h1>Store Screenshot Studio</h1>
      </div>
      <p className="tagline">High-quality store assets — rich text, free placement, bulk upload.</p>
      <GalleryGroup />
      <TextEditorGroup />
      <PlacementGroup />
      <TypographyGroup />
      <BackgroundGroup />
      <FrameGroup />
    </aside>
  );
}
