<template>
  <div ref="containerRef" class="room3d-container">
    <div v-if="!imageLoaded" class="room3d-loading">
      <div class="room3d-spinner" />
    </div>
    <canvas ref="canvasRef" class="room3d-canvas" />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import { useMapStore } from "~/stores/map";
import { getPrintSpec, getWrapPercent } from "~~/shared/printSpecs";
import { getProductTypeById } from "~~/shared/productCatalog";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const store = useMapStore();
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageLoaded = ref(false);

const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const roomGroup = shallowRef<THREE.Group | null>(null);
const productGroup = shallowRef<THREE.Group | null>(null);
const texture = shallowRef<THREE.Texture | null>(null);
const woodTextures = shallowRef<{
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
} | null>(null);

let animationId = 0;
let controls: OrbitControls | null = null;

const imageUrl = computed(() => store.designUrl);
const spec = computed(() => getPrintSpec(store.selectedProductType));
const product = computed(() => getProductTypeById(store.selectedProductType));
const variant = computed(() => store.selectedVariant);

const frameColor = computed(() => {
  if (!spec.value.hasFrame) return null;
  const opt = product.value.frameOptions.find(
    (f) => f.id === store.selectedFrameColor,
  );
  return opt?.colorHex ?? "#1a1a1a";
});

const wrapPctX = computed(() => {
  if (!spec.value.hasWrap || !variant.value) return 0;
  return getWrapPercent(spec.value.wrapInches, variant.value.widthInches);
});

const wrapPctY = computed(() => {
  if (!spec.value.hasWrap || !variant.value) return 0;
  return getWrapPercent(spec.value.wrapInches, variant.value.heightInches);
});

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (renderer.value) {
          tex.anisotropy = renderer.value.capabilities.getMaxAnisotropy();
        }
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

function loadEXR(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new EXRLoader().load(
      url,
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

async function loadPlywoodTextures() {
  try {
    const [map, normalMap, roughnessMap] = await Promise.all([
      loadTexture("/textures/frame/plywood_diff_2k.jpg"),
      loadEXR("/textures/frame/plywood_nor_gl_4k.exr"),
      loadEXR("/textures/frame/plywood_rough_4k.exr"),
    ]);

    if (woodTextures.value) {
      woodTextures.value.map.dispose();
      woodTextures.value.normalMap.dispose();
      woodTextures.value.roughnessMap.dispose();
    }

    [map, normalMap, roughnessMap].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1, 1); 
    });

    woodTextures.value = { map, normalMap, roughnessMap };
  } catch (err) {
    console.warn("Could not load plywood textures, will use procedural fallback.");
  }
}

function getAspect(): { w: number; h: number } {
  // We want the print size to be roughly realistic relative to the room.
  // We'll scale it down by a factor to match Three.js units (1 unit ~ 1 foot roughly, or 10 inches).
  // E.g., a 24x36 poster -> 2.4 x 3.6 units
  const inchesW = store.selectedOrientation === "landscape" ? variant.value?.heightInches : variant.value?.widthInches;
  const inchesH = store.selectedOrientation === "landscape" ? variant.value?.widthInches : variant.value?.heightInches;
  
  const width = inchesW ? inchesW / 12 : 1.5;
  const height = inchesH ? inchesH / 12 : 2.0;
  
  return { w: width, h: height };
}

// ------------------------------------------------------------------
// PRODUCT BUILDING (Adapted from ProductPreview3D)
// ------------------------------------------------------------------

function buildProduct() {
  if (!scene.value || !texture.value || !roomGroup.value) return;

  if (productGroup.value) {
    roomGroup.value.remove(productGroup.value);
    productGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  const group = new THREE.Group();
  const { w, h } = getAspect();
  const type = store.selectedProductType;
  const isCanvas = type === "canvas" || type === "framed-canvas";
  const isFramed = type === "framed-poster" || type === "framed-canvas";

  if (isCanvas) {
    buildCanvas(group, w, h, isFramed);
  } else if (isFramed) {
    buildFramedPoster(group, w, h);
  } else {
    buildPoster(group, w, h);
  }

  // Position product flush against the new procedural back wall
  // Wall is at z = -6. We place the artwork slightly in front of it to prevent z-fighting
  group.position.set(0, 5, -5.9);
  
  roomGroup.value.add(group);
  productGroup.value = group;
}

function generateWoodTexture(baseColorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; // Higher resolution for better grain detail
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Fill base color (warm oak)
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Add subtle overall color noise for natural variation
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 200, 200);
  }

  // 3. Growth Rings (Main Grain) - Wavy dark lines
  ctx.strokeStyle = "rgba(60, 30, 10, 0.25)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 150; i++) {
    let y = Math.random() * 1024;
    let waviness = 5 + Math.random() * 10;
    let frequency = 0.005 + Math.random() * 0.01;
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 20) {
      const dy = Math.sin(x * frequency) * waviness + (Math.random() - 0.5) * 2;
      ctx.lineTo(x, y + dy);
    }
    ctx.stroke();
  }

  // 4. Fine Fibers - Very thin, high-frequency lines
  ctx.strokeStyle = "rgba(40, 20, 5, 0.15)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 400; i++) {
    let y = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y + (Math.random() - 0.5) * 5);
    ctx.stroke();
  }

  // 5. Pores - Tiny dark elongated specks typical of oak
  ctx.fillStyle = "rgba(30, 15, 5, 0.35)";
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const w = 1 + Math.random() * 2;
    const h = 0.5 + Math.random();
    ctx.fillRect(x, y, w, h);
  }

  // 6. Light Flecks (Medullary Rays) - Subtle light streaks
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    ctx.fillRect(x, y, 40, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // Repeat to make the grain appear denser along the frame edges
  // Since we use 1024x1024 now, we might need to adjust repeat
  tex.repeat.set(1, 2); 
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildPoster(group: THREE.Group, w: number, h: number) {
  const tex = texture.value!;

  // Match the visual mass of the framed versions by including the missing frame borders
  const frameWidth = 0.12; 
  const outerW = w + frameWidth * 2;
  const outerH = h + frameWidth * 2;
  const depth = 0.01;
  
  // Paper backing
  const backGeo = new THREE.BoxGeometry(outerW, outerH, depth);
  const paperColor = new THREE.Color(0xf5f0e8);
  const paperMat = new THREE.MeshStandardMaterial({ 
    color: paperColor,
    roughness: 0.95,
  });
  const backMesh = new THREE.Mesh(backGeo, paperMat);
  backMesh.castShadow = true;
  group.add(backMesh);

  // Print surface
  const printGeo = new THREE.PlaneGeometry(outerW, outerH);
  const printMat = new THREE.MeshStandardMaterial({ 
    map: tex,
    roughness: 0.8, // Matte poster surface
  });
  const print = new THREE.Mesh(printGeo, printMat);
  print.position.z = depth / 2 + 0.001; 
  print.receiveShadow = true;
  group.add(print);
}

function buildFramedPoster(group: THREE.Group, w: number, h: number) {
  const tex = texture.value!;
  const fc = frameColor.value ?? "#1a1a1a";
  
  // Base properties using PhysicalMaterial for photorealism
  const frameParams: THREE.MeshPhysicalMaterialParameters = {
    color: new THREE.Color(fc),
  };
  
  if (fc === "#1a1a1a" || fc === "black") {
    // Black frame: moderately rough but reflects sharp highlights with a clearcoat
    frameParams.roughness = 0.6;
    frameParams.metalness = 0.1;
    frameParams.clearcoat = 0.3;
    frameParams.clearcoatRoughness = 0.2;
  } else if (fc === "#f5f5f0" || fc === "white") {
    // White frame: matte and diffuse
    frameParams.roughness = 0.8;
    frameParams.metalness = 0.0;
    frameParams.clearcoat = 0.1;
    frameParams.clearcoatRoughness = 0.4;
  } else if (woodTextures.value) {
    // Red Oak / wood: Use high-quality plywood textures
    const wt = woodTextures.value;
    frameParams.map = wt.map;
    frameParams.normalMap = wt.normalMap;
    frameParams.roughnessMap = wt.roughnessMap;
    // @ts-ignore
    frameParams.normalScale = new THREE.Vector2(1, 1);
    frameParams.roughness = 1.0;
    frameParams.metalness = 0.0;
    frameParams.color = new THREE.Color(0xffffff);
  } else {
    // Fallback Red Oak / wood: procedural wood grain texture
    const woodTex = generateWoodTexture(fc);
    frameParams.color = new THREE.Color(0xffffff); // Override color to let texture shine through
    frameParams.map = woodTex;
    frameParams.bumpMap = woodTex;
    frameParams.bumpScale = 0.005;
    frameParams.roughness = 0.85;
    frameParams.metalness = 0.02;
  }
  
  const frameMat = new THREE.MeshPhysicalMaterial(frameParams);

  const frameWidth = 0.12; // frame border width in scene units
  const frameDepth = 0.06;

  // Print surface (set back slightly inside frame)
  const printGeo = new THREE.PlaneGeometry(w, h);
  const printMat = new THREE.MeshStandardMaterial({ 
    map: tex,
    roughness: 0.9 
  });
  const print = new THREE.Mesh(printGeo, printMat);
  print.position.z = frameDepth * 0.3;
  print.receiveShadow = true;
  group.add(print);

  // Frame pieces (4 sides)
  const outerW = w + frameWidth * 2;
  const outerH = h + frameWidth * 2;

  // Top
  const topGeo = new THREE.BoxGeometry(outerW, frameWidth, frameDepth);
  const top = new THREE.Mesh(topGeo, frameMat);
  top.position.y = h / 2 + frameWidth / 2;
  top.position.z = frameDepth / 2;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Bottom
  const bottom = new THREE.Mesh(topGeo, frameMat);
  bottom.position.y = -(h / 2 + frameWidth / 2);
  bottom.position.z = frameDepth / 2;
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  group.add(bottom);

  // Left
  const sideGeo = new THREE.BoxGeometry(frameWidth, h, frameDepth);
  const left = new THREE.Mesh(sideGeo, frameMat);
  left.position.x = -(w / 2 + frameWidth / 2);
  left.position.z = frameDepth / 2;
  left.castShadow = true;
  left.receiveShadow = true;
  group.add(left);

  // Right
  const right = new THREE.Mesh(sideGeo, frameMat);
  right.position.x = w / 2 + frameWidth / 2;
  right.position.z = frameDepth / 2;
  right.castShadow = true;
  right.receiveShadow = true;
  group.add(right);
}

function buildCanvas(
  group: THREE.Group,
  w: number,
  h: number,
  isFramed: boolean,
) {
  const tex = texture.value!;
  const wpx = wrapPctX.value / 100;
  const wpy = wrapPctY.value / 100;

  // Canvas depth (the stretcher bar depth) proportional to wrap
  const canvasDepth = Math.min(w * wpx * 0.7, 0.25);

  // Use bump map on the canvas face for realistic texture
  const baseMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.85,
  });

  // ---- Face ----
  const faceW = w * (1 - 2 * wpx);
  const faceH = h * (1 - 2 * wpy);

  const faceGeo = new THREE.PlaneGeometry(faceW, faceH);
  const faceUvs = faceGeo.attributes.uv;
  for (let i = 0; i < faceUvs.count; i++) {
    const u = faceUvs.getX(i);
    const v = faceUvs.getY(i);
    faceUvs.setXY(i, wpx + u * (1 - 2 * wpx), wpy + v * (1 - 2 * wpy));
  }
  const face = new THREE.Mesh(faceGeo, baseMat);
  face.position.z = canvasDepth / 2;
  face.castShadow = true;
  face.receiveShadow = true;
  group.add(face);

  // ---- Side wraps ----
  // Right side
  const rightGeo = new THREE.PlaneGeometry(canvasDepth, faceH);
  const rightUvs = rightGeo.attributes.uv;
  for (let i = 0; i < rightUvs.count; i++) {
    const u = rightUvs.getX(i);
    const v = rightUvs.getY(i);
    rightUvs.setXY(
      i,
      (1 - wpx) + u * wpx,
      wpy + v * (1 - 2 * wpy),
    );
  }
  const rightSide = new THREE.Mesh(rightGeo, baseMat);
  rightSide.position.x = faceW / 2;
  rightSide.rotation.y = Math.PI / 2;
  rightSide.castShadow = true;
  rightSide.receiveShadow = true;
  group.add(rightSide);

  // Left side
  const leftGeo = new THREE.PlaneGeometry(canvasDepth, faceH);
  const leftUvs = leftGeo.attributes.uv;
  for (let i = 0; i < leftUvs.count; i++) {
    const u = leftUvs.getX(i);
    const v = leftUvs.getY(i);
    leftUvs.setXY(i, wpx * (1 - u), wpy + v * (1 - 2 * wpy));
  }
  const leftSide = new THREE.Mesh(leftGeo, baseMat);
  leftSide.position.x = -faceW / 2;
  leftSide.rotation.y = -Math.PI / 2;
  leftSide.castShadow = true;
  leftSide.receiveShadow = true;
  group.add(leftSide);

  // Top side
  const topGeo = new THREE.PlaneGeometry(faceW, canvasDepth);
  const topUvs = topGeo.attributes.uv;
  for (let i = 0; i < topUvs.count; i++) {
    const u = topUvs.getX(i);
    const v = topUvs.getY(i);
    topUvs.setXY(i, wpx + u * (1 - 2 * wpx), (1 - wpy) + v * wpy);
  }
  const topSide = new THREE.Mesh(topGeo, baseMat);
  topSide.position.y = faceH / 2;
  topSide.rotation.x = -Math.PI / 2;
  topSide.castShadow = true;
  topSide.receiveShadow = true;
  group.add(topSide);

  // Bottom side
  const bottomGeo = new THREE.PlaneGeometry(faceW, canvasDepth);
  const bottomUvs = bottomGeo.attributes.uv;
  for (let i = 0; i < bottomUvs.count; i++) {
    const u = bottomUvs.getX(i);
    const v = bottomUvs.getY(i);
    bottomUvs.setXY(i, wpx + u * (1 - 2 * wpx), wpy * (1 - v));
  }
  const bottomSide = new THREE.Mesh(bottomGeo, baseMat);
  bottomSide.position.y = -faceH / 2;
  bottomSide.rotation.x = Math.PI / 2;
  bottomSide.castShadow = true;
  bottomSide.receiveShadow = true;
  group.add(bottomSide);

  // Back panel (stretcher bars / white backing)
  const backGeo = new THREE.PlaneGeometry(faceW, faceH);
  const backMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.9,
  });
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.z = -canvasDepth / 2;
  back.rotation.y = Math.PI;
  group.add(back);

  // Frame for framed canvas
  if (isFramed) {
    const fc = frameColor.value ?? "#1a1a1a";

    const frameParams: THREE.MeshPhysicalMaterialParameters = {
      color: new THREE.Color(fc),
    };
    
    if (fc === "#1a1a1a" || fc === "black") {
      frameParams.roughness = 0.6;
      frameParams.metalness = 0.1;
      frameParams.clearcoat = 0.3;
      frameParams.clearcoatRoughness = 0.2;
    } else if (fc === "#f5f5f0" || fc === "white") {
      frameParams.roughness = 0.8;
      frameParams.metalness = 0.0;
      frameParams.clearcoat = 0.1;
      frameParams.clearcoatRoughness = 0.4;
    } else if (woodTextures.value) {
      const wt = woodTextures.value;
      frameParams.map = wt.map;
      frameParams.normalMap = wt.normalMap;
      frameParams.roughnessMap = wt.roughnessMap;
      // @ts-ignore
      frameParams.normalScale = new THREE.Vector2(1, 1);
      frameParams.roughness = 1.0;
      frameParams.metalness = 0.0;
      frameParams.color = new THREE.Color(0xffffff);
    } else {
      const woodTex = generateWoodTexture(fc);
      frameParams.color = new THREE.Color(0xffffff); // Override color to let texture shine through
      frameParams.map = woodTex;
      frameParams.bumpMap = woodTex;
      frameParams.bumpScale = 0.005;
      frameParams.roughness = 0.85;
      frameParams.metalness = 0.02;
    }

    const frameMat = new THREE.MeshPhysicalMaterial(frameParams);

    const frameW = 0.08;
    const outerW = faceW + frameW * 2;
    const outerH = faceH + frameW * 2;
    const fd = canvasDepth + 0.02;

    // Top
    const ftGeo = new THREE.BoxGeometry(outerW, frameW, fd);
    const ft = new THREE.Mesh(ftGeo, frameMat);
    ft.position.y = faceH / 2 + frameW / 2;
    ft.castShadow = true;
    ft.receiveShadow = true;
    group.add(ft);

    // Bottom
    const fb = new THREE.Mesh(ftGeo, frameMat);
    fb.position.y = -(faceH / 2 + frameW / 2);
    fb.castShadow = true;
    fb.receiveShadow = true;
    group.add(fb);

    // Left
    const fsGeo = new THREE.BoxGeometry(frameW, faceH, fd);
    const fl = new THREE.Mesh(fsGeo, frameMat);
    fl.position.x = -(faceW / 2 + frameW / 2);
    fl.castShadow = true;
    fl.receiveShadow = true;
    group.add(fl);

    // Right
    const fr = new THREE.Mesh(fsGeo, frameMat);
    fr.position.x = faceW / 2 + frameW / 2;
    fr.castShadow = true;
    fr.receiveShadow = true;
    group.add(fr);
  }
}

// ------------------------------------------------------------------
// SCENE & INTERACTION
// ------------------------------------------------------------------

function setupLighting(s: THREE.Scene) {
  // Ambient Skylight (soft Scandinavian lighting)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe0e5ec, 0.7);
  hemiLight.position.set(0, 20, 0);
  s.add(hemiLight);

  // Soft directional warm light (simulates a window to the right)
  const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.1);
  dirLight.position.set(10, 15, 10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.0005;
  s.add(dirLight);

  // Subtle interior fill light from the opposite side
  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.5);
  fillLight.position.set(-15, 10, -10);
  s.add(fillLight);
}

function buildRoom(group: THREE.Group) {
  // Materials that evoke a Scandinavian loft
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0xeae6df, // Light, natural oak color
    roughness: 0.8,
    metalness: 0.05
  });

  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0xfaf9f6, // Very soft eggshell white
    roughness: 0.95,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x8c969c, // Soft slate blue-grey accent wall
    roughness: 0.95,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd4c4b7, // Birch wood
    roughness: 0.7,
  });

  // Floor
  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Back Wall (Accent)
  const backWallGeo = new THREE.BoxGeometry(30, 20, 1);
  const backWall = new THREE.Mesh(backWallGeo, accentMat);
  backWall.position.set(0, 10, -6.5);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Left Wall Removed to prevent camera obstruction 

  // Soft Rug on Floor
  const rugGeo = new THREE.PlaneGeometry(16, 12);
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.02, 2);
  rug.receiveShadow = true;
  group.add(rug);
}

function initScene() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;

  const w = container.clientWidth;
  const h = container.clientHeight;

  const r = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.setSize(w, h);
  r.outputColorSpace = THREE.SRGBColorSpace; 
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.value = r;

  const s = new THREE.Scene();
  s.background = new THREE.Color(0xdce3e6); // Soft sky color
  scene.value = s;

  // Camera positioned cleanly to view the scandinavian layout
  const cam = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  cam.position.set(0, 6, 20);
  camera.value = cam;

  const mainGroup = new THREE.Group();
  s.add(mainGroup);
  roomGroup.value = mainGroup;

  setupLighting(s);
  buildRoom(mainGroup);

  // Controls
  const ctrl = new OrbitControls(cam, canvas);
  ctrl.enableDamping = true;
  ctrl.enableZoom = true;
  ctrl.enablePan = false;
  // Limit distance so we don't zoom out of the room completely or clip into walls
  ctrl.minDistance = 6;
  ctrl.maxDistance = 25;
  // Keep camera above floor level
  ctrl.minPolarAngle = Math.PI / 4;
  ctrl.maxPolarAngle = Math.PI / 2.1;
  // Restrict horizontal turning so the user primarily looks at the back wall / poster
  ctrl.minAzimuthAngle = -Math.PI / 3;
  ctrl.maxAzimuthAngle = Math.PI / 3;
  // Target the artwork area
  ctrl.target.set(0, 5, -5.9);
  controls = ctrl;
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (controls) {
    controls.update();
  }

  if (renderer.value && scene.value && camera.value) {
    renderer.value.render(scene.value, camera.value);
  }
}

function handleResize() {
  const container = containerRef.value;
  if (!container || !renderer.value || !camera.value) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.value.setSize(w, h);
  camera.value.aspect = w / h;
  camera.value.updateProjectionMatrix();
}

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  if (!import.meta.client) return;

  initScene();
  animate();

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.value);
  }

  const loadTasks: Promise<any>[] = [
    loadPlywoodTextures(),
    new Promise<void>((resolve) => {
      new GLTFLoader().load(
        "/CouchMedium.glb",
        (gltf) => {
          const model = gltf.scene;
          
          // Position under the poster on the floor
          // Back wall is around z = -6.5, poster at -5.9.
          // Adjust z so couch sits comfortably against the wall, but not clipping.
          model.position.set(0, 0, -4.2);
          model.scale.set(1.4, 1.4, 1.4);
          
          // Ensure it can cast and receive lighting properly
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          
          if (roomGroup.value) {
            roomGroup.value.add(model);
          }
          resolve();
        },
        undefined,
        (err) => {
          console.error("Failed to load couch:", err);
          resolve(); // Resolve anyway so it doesn't block the promise all!
        }
      );
    }),
    new Promise<void>((resolve) => {
      new GLTFLoader().load(
        "/house_plant.glb",
        (gltf) => {
          const model = gltf.scene;
          // Position right of the couch
          model.position.set(5.5, 0, -4.2);
          model.scale.set(0.55, 0.55, 0.55);
          
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          
          if (roomGroup.value) {
            roomGroup.value.add(model);
          }
          resolve();
        },
        undefined,
        (err) => {
          console.error("Failed to load house plant:", err);
          resolve();
        }
      );
    }),
    new Promise<void>((resolve) => {
      new GLTFLoader().load(
        "/retro_wood_coffee_table.glb",
        (gltf) => {
          const model = gltf.scene;
          // Position in front of the couch
          model.position.set(0, 0, 0.75);
          model.scale.set(7.5, 7.5, 7.5);
          model.rotation.y = Math.PI / 3.1; // Rotate further
          
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          
          if (roomGroup.value) {
            roomGroup.value.add(model);
          }
          resolve();
        },
        undefined,
        (err) => {
          console.error("Failed to load coffee table:", err);
          resolve();
        }
      );
    })
  ];

  if (imageUrl.value) {
    loadTasks.push(
      loadTexture(imageUrl.value)
        .then((tex) => {
          texture.value = tex;
        })
        .catch(() => {})
    );
  }

  await Promise.all(loadTasks);

  if (texture.value) {
    buildProduct();
  }
  
  imageLoaded.value = true;
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);

  if (controls) {
    controls.dispose();
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  renderer.value?.dispose();
  scene.value?.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
  texture.value?.dispose();
  if (woodTextures.value) {
    woodTextures.value.map.dispose();
    woodTextures.value.normalMap.dispose();
    woodTextures.value.roughnessMap.dispose();
  }
});

watch(
  [
    () => store.selectedProductType,
    () => store.selectedFrameColor,
    () => variant.value?.sizeLabel,
    () => store.selectedOrientation,
  ],
  () => {
    if (texture.value) {
      buildProduct();
    }
  },
);
</script>

<style scoped>
.room3d-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-width: 0;
  position: relative;
  background: #383b50;
  overflow: hidden;
  display: flex;
}

.room3d-canvas {
  width: 100% !important;
  height: 100% !important;
  flex: 1;
  display: block;
  cursor: grab;
  touch-action: none;
}

.room3d-canvas:active {
  cursor: grabbing;
}

.room3d-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #383b50;
  z-index: 10;
}

.room3d-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
