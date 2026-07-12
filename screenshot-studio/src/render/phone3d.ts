// Echtzeit-3D-Handy (siehe 3d-feature-plan.md): das Handy wird prozedural —
// ohne externe Assets — in einen separaten, transparenten WebGL-Canvas
// gerendert; renderTo() komponiert diesen als Ebene zwischen Hintergrund und
// Text ins 2D-Bild. Szene ist ein Singleton, Screen-Texturen werden pro
// Galerie-Bild gecacht. Die Platzierung übernimmt die 2D-Layoutformeln, damit
// das Handy an derselben Stelle und in derselben Größe erscheint wie der
// flache Rahmen.

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { chassisSpec, defaultAspect } from "./chassis";
import type { DeviceKind } from "./constants";
import { FONTS } from "./constants";
import type { FrameStyle, RenderSettings } from "./types";

const DEPTH = 0.035; // Körperdicke (Handy-Breite = 1 Welteinheit)
const BEVEL = 0.012;

interface PhoneModel {
  key: string;
  group: THREE.Group;
  body: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial>;
  screen: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshPhysicalMaterial>;
  punch: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  height: number;
}

interface Ctx3D {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ambient: THREE.AmbientLight;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  shadow: THREE.Sprite;
  model: PhoneModel | null;
}

let ctx3d: Ctx3D | null = null;

function makeShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.55, "rgba(0,0,0,0.25)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function getCtx3D(): Ctx3D {
  if (ctx3d) return ctx3d;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true, // sicheres drawImage/Readback für den Export
  });
  renderer.setPixelRatio(1); // exakte Pixelmaße, Auflösung steuert renderTo
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-1.5, -0.5, 2);
  scene.add(fillLight);

  const shadow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false }),
  );
  scene.add(shadow);

  ctx3d = { renderer, scene, camera, ambient, keyLight, fillLight, shadow, model: null };
  return ctx3d;
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  return s;
}

// ShapeGeometry-UVs liegen in Formkoordinaten; auf 0..1 normieren, damit der
// Screenshot die Fläche exakt füllt (Geometrie hat bereits das Bild-Seitenverhältnis).
function remapUVs(geo: THREE.BufferGeometry, w: number, h: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / h + 0.5);
  }
  uv.needsUpdate = true;
}

function ensureModel(c: Ctx3D, kind: DeviceKind, frame: FrameStyle, aspect: number): PhoneModel {
  const key = `${kind}|${frame}|${aspect.toFixed(4)}`;
  if (c.model?.key === key) return c.model;
  if (c.model) {
    c.scene.remove(c.model.group);
    c.model.body.geometry.dispose();
    c.model.screen.geometry.dispose();
    c.model.punch.geometry.dispose();
  }

  const spec = chassisSpec(kind, frame);
  // "none" braucht in 3D einen hauchdünnen Körper, ganz ohne (bezel 0) geht nicht.
  const bezel = spec.bezel === 0 ? 0.008 : spec.bezel;
  const radius = spec.radius;
  const innerW = 1 - 2 * bezel;
  const innerH = innerW / aspect;
  const height = innerH + 2 * bezel;

  // Körper: abgerundetes Rechteck mit Bevel → echte runde Kanten + Dicke.
  // Bevel wächst nach außen, daher die Form um BEVEL verkleinern.
  const bodyGeo = new THREE.ExtrudeGeometry(
    roundedRectShape(1 - 2 * BEVEL, height - 2 * BEVEL, Math.max(0.01, radius - BEVEL)),
    { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 4, curveSegments: 16 },
  );
  bodyGeo.translate(0, 0, -DEPTH / 2);
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ metalness: 0.85, roughness: 0.35 }),
  );

  const screenGeo = new THREE.ShapeGeometry(
    roundedRectShape(innerW, innerH, Math.max(0, radius - bezel)),
    24,
  );
  remapUVs(screenGeo, innerW, innerH);
  const screen = new THREE.Mesh(
    screenGeo,
    // Der Screen leuchtet rein emissiv (Basisfarbe schwarz → Szenenlicht hellt
    // das Bild nicht auf, es bleibt farbtreu und lesbar); Clearcoat liefert
    // den Glas-Sheen darüber.
    new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      roughness: 0.4,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.25,
      emissive: 0xffffff,
      emissiveIntensity: 1,
    }),
  );
  screen.position.z = DEPTH / 2 + BEVEL + 0.002;

  const punchR = innerW * 0.016;
  const punch = new THREE.Mesh(
    new THREE.CircleGeometry(punchR, 24),
    new THREE.MeshBasicMaterial({ color: 0x050507 }),
  );
  punch.position.set(0, innerH / 2 - bezel * 1.4 - punchR, screen.position.z + 0.001);
  punch.visible = spec.punch;

  const group = new THREE.Group();
  group.add(body, screen, punch);
  c.scene.add(group);
  c.model = { key, group, body, screen, punch, height };
  return c.model;
}

// ---------- Screen-Texturen ----------

const texCache = new Map<HTMLImageElement, THREE.Texture>();

function textureFor(c: Ctx3D, img: HTMLImageElement): THREE.Texture {
  let tex = texCache.get(img);
  if (!tex) {
    tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = c.renderer.capabilities.getMaxAnisotropy();
    texCache.set(img, tex);
  }
  return tex;
}

/** GPU-Speicher freigeben, wenn ein Bild aus der Galerie entfernt wird. */
export function disposeTextureFor(img: HTMLImageElement) {
  texCache.get(img)?.dispose();
  texCache.delete(img);
}

let placeholder: THREE.CanvasTexture | null = null;
function placeholderTexture(c: Ctx3D): THREE.CanvasTexture {
  if (placeholder) return placeholder;
  const cv = document.createElement("canvas");
  cv.width = 450;
  cv.height = 975; // 9:19.5 wie der 2D-Platzhalter
  const x = cv.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0, "#f2f3f7");
  g.addColorStop(1, "#dde0e8");
  x.fillStyle = g;
  x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = "#9aa0ad";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `600 ${cv.width * 0.07}px ${FONTS.sans}`;
  x.fillText("Choose a screenshot", cv.width / 2, cv.height / 2);
  placeholder = new THREE.CanvasTexture(cv);
  placeholder.colorSpace = THREE.SRGBColorSpace;
  placeholder.anisotropy = c.renderer.capabilities.getMaxAnisotropy();
  return placeholder;
}

// ---------- Rendern ----------

const deg = THREE.MathUtils.degToRad;

export function renderPhone3D(
  s: RenderSettings,
  img: HTMLImageElement | null,
  W: number,
  H: number,
): HTMLCanvasElement {
  const c = getCtx3D();
  const kind = s.format.kind ?? "phone";
  const aspect = img ? img.width / img.height : defaultAspect(kind);
  const model = ensureModel(c, kind, s.frame, aspect);

  model.body.material.color.set(s.frameColor);
  const tex = img ? textureFor(c, img) : placeholderTexture(c);
  model.screen.material.emissiveMap = tex;

  // Ziel-Bounding-Box in Pixeln — dieselben Formeln wie drawPhone() in 2D.
  const phoneWpx = W * 0.62 * (s.scale / 100);
  const phoneHpx = phoneWpx * model.height;
  const phoneCYpx = H * 0.085 + (s.offsetY / 100) * H + phoneHpx / 2;

  const size = new THREE.Vector2();
  c.renderer.getSize(size);
  if (size.x !== W || size.y !== H) c.renderer.setSize(W, H, false);

  // Kameradistanz so, dass die Handyhöhe (Welt) auf phoneHpx projiziert wird;
  // vertikale Platzierung über die Gruppen-Position in Weltkoordinaten.
  const visibleH = (model.height * H) / phoneHpx;
  const dist = visibleH / (2 * Math.tan(deg(s.fov) / 2));
  const cam = c.camera;
  cam.fov = s.fov;
  cam.aspect = W / H;
  cam.near = dist / 20;
  cam.far = dist * 20;
  cam.position.set(0, 0, dist);
  cam.updateProjectionMatrix();

  const g = model.group;
  g.position.set(0, ((H / 2 - phoneCYpx) / H) * visibleH, 0);
  g.rotation.set(deg(s.rotX), deg(s.rotY), deg(s.rotZ));

  const la = deg(s.lightAngle);
  c.keyLight.position.set(Math.sin(la) * 2.5, 2.2, Math.cos(la) * 2.5);

  // Lichtintensität skaliert alle Lichtquellen inkl. Environment-Reflexionen;
  // der Screen leuchtet emissiv und bleibt dadurch bei wenig Licht gut lesbar.
  const li = s.lightIntensity / 100;
  c.ambient.intensity = 0.35 * li;
  c.keyLight.intensity = 1.6 * li;
  c.fillLight.intensity = 0.5 * li;
  c.scene.environmentIntensity = li;

  // Schattenblob: wandert bei Drehung leicht mit → „natürliche Erdung".
  c.shadow.position.set(
    g.position.x + Math.sin(deg(s.rotY)) * 0.08,
    g.position.y - model.height / 2 - 0.05,
    -0.15,
  );
  c.shadow.scale.set(1.3 - Math.abs(Math.sin(deg(s.rotY))) * 0.25, 0.34, 1);

  c.renderer.render(c.scene, cam);
  return c.renderer.domElement;
}
