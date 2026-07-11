import { create } from "zustand";
import { FORMATS } from "./render/constants";
import { disposeTextureFor } from "./render/phone3d";
import type { GalleryItem, RenderSettings, Slide } from "./render/types";

// Der Store erweitert RenderSettings, damit er dank struktureller Typisierung
// direkt an renderTo() übergeben werden kann — kein Mapping-Schritt nötig.
export interface StudioStore extends RenderSettings {
  gallery: GalleryItem[];
  slides: Slide[];
  current: number;

  patch: (p: Partial<RenderSettings>) => void;
  addImages: (imgs: { img: HTMLImageElement; name: string }[]) => void;
  removeImage: (id: number) => void;
  assignImage: (id: number) => void;
  makeSlidesFromGallery: () => void;
  addSlide: () => void;
  removeSlide: (i: number) => void;
  selectSlide: (i: number) => void;
  setSlideText: (headlineHTML: string, subHTML: string) => void;
}

let gid = 1;

export const useStudio = create<StudioStore>((set) => ({
  format: FORMATS[0],
  bg1: "#5e7a55",
  bg2: "#5e7a55",
  angle: 135,
  gradientOn: true,
  font: "sans",
  textColor: "#ffffff",
  hSize: 100,
  shadow: 1,
  textAnchor: { x: 0.5, y: 0.9 },
  frame: "android",
  frameColor: "#0c0c10",
  scale: 100,
  offsetY: 0,
  rot: 0,
  mode: "2d",
  rotX: -4,
  rotY: 18,
  rotZ: 0,
  fov: 30,
  lightAngle: 35,
  lightIntensity: 100,

  gallery: [],
  slides: [{ imgId: null, headlineHTML: "<b>Find your calm</b>", subHTML: "" }],
  current: 0,

  patch: (p) => set(p),
  addImages: (imgs) =>
    set((st) => ({
      gallery: [...st.gallery, ...imgs.map(({ img, name }) => ({ id: gid++, img, name }))],
    })),
  removeImage: (id) =>
    set((st) => {
      const item = st.gallery.find((g) => g.id === id);
      if (item) disposeTextureFor(item.img);
      return {
        gallery: st.gallery.filter((g) => g.id !== id),
        slides: st.slides.map((s) => (s.imgId === id ? { ...s, imgId: null } : s)),
      };
    }),
  assignImage: (id) =>
    set((st) => ({
      slides: st.slides.map((s, i) => (i === st.current ? { ...s, imgId: id } : s)),
    })),
  makeSlidesFromGallery: () =>
    set((st) =>
      st.gallery.length
        ? {
            slides: st.gallery.map((g) => ({ imgId: g.id, headlineHTML: "", subHTML: "" })),
            current: 0,
          }
        : {},
    ),
  addSlide: () =>
    set((st) => ({
      slides: [...st.slides, { imgId: null, headlineHTML: "<b>New headline</b>", subHTML: "" }],
      current: st.slides.length,
    })),
  removeSlide: (i) =>
    set((st) => {
      if (st.slides.length <= 1) return {};
      const slides = st.slides.filter((_, j) => j !== i);
      return { slides, current: Math.min(st.current, slides.length - 1) };
    }),
  selectSlide: (i) => set({ current: i }),
  setSlideText: (headlineHTML, subHTML) =>
    set((st) => ({
      slides: st.slides.map((s, i) => (i === st.current ? { ...s, headlineHTML, subHTML } : s)),
    })),
}));

export function imgOf(st: { gallery: GalleryItem[] }, slide: Slide): HTMLImageElement | null {
  return st.gallery.find((g) => g.id === slide.imgId)?.img ?? null;
}
