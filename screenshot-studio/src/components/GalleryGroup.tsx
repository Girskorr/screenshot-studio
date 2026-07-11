import { useStudio } from "../store";

function loadFiles(files: File[]): Promise<{ img: HTMLImageElement; name: string }[]> {
  return Promise.all(
    files.map(
      (f) =>
        new Promise<{ img: HTMLImageElement; name: string }>((resolve, reject) => {
          const r = new FileReader();
          r.onload = (ev) => {
            const img = new Image();
            img.onload = () => resolve({ img, name: f.name });
            img.onerror = reject;
            img.src = ev.target!.result as string;
          };
          r.onerror = reject;
          r.readAsDataURL(f);
        }),
    ),
  );
}

export function GalleryGroup() {
  const gallery = useStudio((s) => s.gallery);
  const slides = useStudio((s) => s.slides);
  const current = useStudio((s) => s.current);
  const addImages = useStudio((s) => s.addImages);
  const removeImage = useStudio((s) => s.removeImage);
  const assignImage = useStudio((s) => s.assignImage);
  const makeSlidesFromGallery = useStudio((s) => s.makeSlidesFromGallery);

  return (
    <div className="group">
      <label className="title">Screenshot gallery</label>
      <label htmlFor="bulk" className="filebtn">
        📁 Upload screenshots (multiple allowed)
      </label>
      <input
        type="file"
        id="bulk"
        accept="image/*"
        multiple
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length) addImages(await loadFiles(files));
        }}
      />
      <div className="gallery">
        {gallery.map((item) => (
          <div
            key={item.id}
            className={"gthumb" + (slides[current].imgId === item.id ? " active" : "")}
            title={item.name}
            onClick={() => assignImage(item.id)}
          >
            <img src={item.img.src} alt={item.name} />
            <div className="gname">{item.name}</div>
            <div
              className="gx"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(item.id);
              }}
            >
              ×
            </div>
          </div>
        ))}
      </div>
      <button className="ghost-btn" onClick={makeSlidesFromGallery}>
        Create a slide for every gallery image
      </button>
      <div className="hint">
        Upload all screenshots at once, then click a gallery image to assign it to the current
        slide.
      </div>
    </div>
  );
}
