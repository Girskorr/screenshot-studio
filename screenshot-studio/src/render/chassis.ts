// Einzige Quelle für die Gehäuse-Geometrie. Sowohl der 2D-Renderer (phone.ts)
// als auch der 3D-Renderer (phone3d.ts) lesen hier — so bleiben Vorschau,
// Thumbnails und Export garantiert deckungsgleich. Alle Maße sind Anteile der
// Gerätebreite (2D multipliziert mit phoneW, 3D nimmt Breite = 1 Welteinheit).

import type { DeviceKind } from "./constants";
import type { FrameStyle } from "./types";

export interface ChassisSpec {
  bezel: number; // Randbreite als Anteil der Gerätebreite
  radius: number; // Eckenradius als Anteil der Gerätebreite
  punch: boolean; // Kamera-Punch-Hole (nur Smartphones)
}

export function chassisSpec(kind: DeviceKind, frame: FrameStyle): ChassisSpec {
  if (kind === "ipad" || kind === "android-tablet") {
    // Tablets: dünner, gleichmäßiger Rand, moderat gerundete Ecken, nie ein
    // Punch-Hole. Der Style-Regler modelliert weiter die Randstärke.
    const radius = kind === "ipad" ? 0.05 : 0.04; // iPad-Ecken minimal runder
    if (frame === "minimal") return { bezel: 0.02, radius: radius * 0.85, punch: false };
    if (frame === "none") return { bezel: 0, radius: radius * 0.6, punch: false };
    return { bezel: 0.035, radius, punch: false };
  }
  // Smartphone
  if (frame === "android") return { bezel: 0.03, radius: 0.13, punch: true };
  if (frame === "minimal") return { bezel: 0.016, radius: 0.11, punch: false };
  return { bezel: 0, radius: 0.07, punch: false }; // none
}

// Seitenverhältnis für den Platzhalter (noch kein Screenshot gewählt): Tablets
// erscheinen dann tablet-förmig statt schmal wie ein Handy.
export function defaultAspect(kind: DeviceKind): number {
  return kind === "phone" ? 9 / 19.5 : 3 / 4;
}
