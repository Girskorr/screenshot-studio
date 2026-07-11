import type { Format, FontKey } from "./constants";

export type FrameStyle = "android" | "minimal" | "none";
export type PhoneMode = "2d" | "3d";

export interface RenderSettings {
  format: Format;
  bg1: string;
  bg2: string;
  angle: number;
  gradientOn: boolean; // aus = einfarbiger Hintergrund (nur bg1)
  font: FontKey;
  textColor: string;
  hSize: number;
  shadow: number;
  textAnchor: { x: number; y: number };
  frame: FrameStyle;
  frameColor: string;
  scale: number;
  offsetY: number;
  rot: number;
  // 3D-Modus (rot gilt nur in 2D; rotX/Y/Z, fov, lightAngle und lightIntensity nur in 3D)
  mode: PhoneMode;
  rotX: number;
  rotY: number;
  rotZ: number;
  fov: number;
  lightAngle: number;
  lightIntensity: number; // Prozent, 100 = Standard
}

export interface Slide {
  imgId: number | null;
  headlineHTML: string;
  subHTML: string;
}

export interface GalleryItem {
  id: number;
  img: HTMLImageElement;
  name: string; // Original-Dateiname, wird als Label in der Galerie-Kachel angezeigt
}

export interface TextBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
