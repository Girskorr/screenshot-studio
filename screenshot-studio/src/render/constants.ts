// Gerätetyp einer Ausgabe — steuert, wie phone.ts/phone3d.ts das Gehäuse
// zeichnen (Smartphone vs. Tablet). Fehlt das Feld, gilt "phone".
export type DeviceKind = "phone" | "ipad" | "android-tablet";

export interface Format {
  name: string;
  w: number;
  h: number;
  kind?: DeviceKind;
}

export const FORMATS: Format[] = [
  { name: "Google Play – Smartphone (1080×1920)", w: 1080, h: 1920 },
  { name: 'iPhone 6.7" (1290×2796)', w: 1290, h: 2796 },
  { name: 'iPhone 6.5" (1242×2688)', w: 1242, h: 2688 },
  { name: 'iPad 12.9" (2048×2732)', w: 2048, h: 2732, kind: "ipad" },
  { name: 'Android tablet 7" (1200×1920)', w: 1200, h: 1920, kind: "android-tablet" },
  { name: 'Android tablet 10" (1600×2560)', w: 1600, h: 2560, kind: "android-tablet" },
];

export const BG_PRESETS = [
  { name: "Dusk", c1: "#2b5876", c2: "#4e4376" },
  { name: "Ocean", c1: "#1e3c72", c2: "#2a5298" },
  { name: "Lavender", c1: "#667eea", c2: "#764ba2" },
  { name: "Sunrise", c1: "#ee9ca7", c2: "#ffdde1" },
  { name: "Mint", c1: "#43cea2", c2: "#185a9d" },
  { name: "Peach", c1: "#ffecd2", c2: "#fcb69f" },
  { name: "Midnight", c1: "#0f2027", c2: "#2c5364" },
  { name: "Sage", c1: "#5e7a55", c2: "#5e7a55" },
];

// Nur systemweit verfügbare Stacks — der Canvas rendert mit lokalen Fonts,
// Webfonts würden Preview/Export je nach Ladezustand auseinanderlaufen lassen.
export const FONTS = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  rounded: "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  classic: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  display: "'Arial Black', 'Helvetica Neue', Impact, sans-serif",
  condensed: "'Arial Narrow', 'Helvetica Neue Condensed', 'Roboto Condensed', sans-serif",
  humanist: "Verdana, Geneva, Tahoma, sans-serif",
  mono: "'SF Mono', 'Cascadia Code', Consolas, 'Courier New', monospace",
} as const;

export type FontKey = keyof typeof FONTS;

export const FONT_OPTIONS: { key: FontKey; label: string }[] = [
  { key: "sans", label: "Modern Sans" },
  { key: "rounded", label: "Rounded" },
  { key: "serif", label: "Elegant Serif" },
  { key: "classic", label: "Classic Serif" },
  { key: "display", label: "Bold Display" },
  { key: "condensed", label: "Condensed" },
  { key: "humanist", label: "Humanist" },
  { key: "mono", label: "Monospace" },
];
