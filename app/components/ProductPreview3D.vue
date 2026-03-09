<template>
  <div ref="containerRef" class="preview3d-container">
    <div v-if="!imageLoaded" class="preview3d-loading">
      <div class="preview3d-spinner" />
    </div>
    <canvas ref="canvasRef" class="preview3d-canvas" />
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

const store = useMapStore();
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageLoaded = ref(false);

const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const productGroup = shallowRef<THREE.Group | null>(null);
const texture = shallowRef<THREE.Texture | null>(null);
const woodTextures = shallowRef<{
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
} | null>(null);
let animationId = 0;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let targetRotY = -0.35;
let targetRotX = 0.25;
let currentRotY = -0.35;
let currentRotX = 0.25;
let targetZoom = 8.8;

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
        
        // Improve texture resolution at oblique angles
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

    // Cleanup old if exists
    if (woodTextures.value) {
      woodTextures.value.map.dispose();
      woodTextures.value.normalMap.dispose();
      woodTextures.value.roughnessMap.dispose();
    }

    // Configure tiling
    [map, normalMap, roughnessMap].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1, 1); // We'll adjust this per frame piece
    });

    woodTextures.value = { map, normalMap, roughnessMap };
  } catch (err) {
    console.error("Failed to load plywood textures:", err);
  }
}

function getAspect(): { w: number; h: number } {
  const ratio = store.aspectRatio; // width / height
  if (ratio >= 1) {
    return { w: 3, h: 3 / ratio };
  }
  return { w: 3 * ratio, h: 3 };
}

function buildProduct() {
  if (!scene.value || !texture.value) return;

  // Remove old group
  if (productGroup.value) {
    scene.value.remove(productGroup.value);
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

  scene.value.add(group);
  productGroup.value = group;
}

function buildPoster(group: THREE.Group, w: number, h: number) {
  const tex = texture.value!;

  // Thin paper plane
  const depth = 0.008;
  const geo = new THREE.BoxGeometry(w, h, depth);
  const paperColor = new THREE.Color(0xf5f0e8);
  
  const paperMat = new THREE.MeshStandardMaterial({ 
    color: paperColor,
    roughness: 0.95,
  });
  const printMat = new THREE.MeshStandardMaterial({ 
    map: tex,
    roughness: 0.8, // Matte poster surface
  });

  const materials = [
    paperMat, // right
    paperMat, // left
    paperMat, // top
    paperMat, // bottom
    printMat, // front
    paperMat, // back
  ];

  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  group.add(mesh);
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

  /* 
  // Glass (Realistic transmission) - REMOVED for clarity as it makes the poster look blurry
  const glassGeo = new THREE.PlaneGeometry(w, h);
  const glassMat = new THREE.MeshPhysicalMaterial({
    roughness: 0.05,
    transmission: 0.95, // Glass-like transparency
    thickness: 0.02,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    color: 0xffffff,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.z = frameDepth * 0.4;
  group.add(glass);
  */
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

function addWallShadow(
  group: THREE.Group,
  w: number,
  h: number,
  offset: number,
) {
  const shadowGeo = new THREE.PlaneGeometry(w + 0.4, h + 0.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.18,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.z = -offset;
  shadow.position.x = 0.05;
  shadow.position.y = -0.08;
  group.add(shadow);
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

function initScene() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;

  const w = container.clientWidth;
  const h = container.clientHeight;

  // Renderer
  const r = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.setSize(w, h);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.35;
  
  // Enable shadows
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.value = r;

  // Scene
  const s = new THREE.Scene();
  // s.background = new THREE.Color(0xECE6D9); // REMOVED: User does not want the tan background
  scene.value = s;

  // Camera
  const cam = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  cam.position.z = 8.8;
  camera.value = cam;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  s.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(5, 6, 8);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 25;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0005;
  s.add(key);

  const fill = new THREE.DirectionalLight(0xaaccff, 0.7);
  fill.position.set(-4, 2, 4);
  s.add(fill);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  // Smooth rotation
  currentRotY += (targetRotY - currentRotY) * 0.08;
  currentRotX += (targetRotX - currentRotX) * 0.08;

  if (productGroup.value) {
    productGroup.value.rotation.y = currentRotY;
    productGroup.value.rotation.x = currentRotX;
  }

  if (renderer.value && scene.value && camera.value) {
    // Smooth zoom
    camera.value.position.z += (targetZoom - camera.value.position.z) * 0.1;
    renderer.value.render(scene.value, camera.value);
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  targetZoom += e.deltaY * 0.01;
  targetZoom = Math.max(3.0, Math.min(10.0, targetZoom));
}

function onPointerDown(e: PointerEvent) {
  isDragging = true;
  prevMouse = { x: e.clientX, y: e.clientY };
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return;
  const dx = e.clientX - prevMouse.x;
  const dy = e.clientY - prevMouse.y;
  targetRotY += dx * 0.005;
  targetRotX += dy * 0.005;
  targetRotX = Math.max(-0.5, Math.min(0.5, targetRotX));
  targetRotY = Math.max(-0.8, Math.min(0.8, targetRotY));
  prevMouse = { x: e.clientX, y: e.clientY };
}

function onPointerUp() {
  isDragging = false;
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

  const canvas = canvasRef.value;
  if (canvas) {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.value);
  }

  const loadTasks: Promise<any>[] = [loadPlywoodTextures()];

  if (imageUrl.value) {
    loadTasks.push(
      loadTexture(imageUrl.value)
        .then((tex) => {
          texture.value = tex;
        })
        .catch(() => {
          // Texture load failed
        })
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

  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("wheel", onWheel);
  }
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);

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

// Rebuild when product config changes
watch(
  [
    () => store.selectedProductType,
    () => store.selectedFrameColor,
    () => store.selectedVariant,
    () => store.aspectRatio,
  ],
  () => {
    if (texture.value) buildProduct();
  },
);

// Reload texture if design URL changes
watch(imageUrl, async (url) => {
  if (!url) return;
  imageLoaded.value = false;
  try {
    texture.value?.dispose();
    texture.value = await loadTexture(url);
    imageLoaded.value = true;
    buildProduct();
  } catch {
    // ignore
  }
});
</script>

<style scoped>
.preview3d-container {
  width: 100%;
  height: 100%;
  min-height: 50vh;
  position: relative;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}

.preview3d-container:active {
  cursor: grabbing;
}

.preview3d-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.preview3d-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3d3832;
  z-index: 2;
}

.preview3d-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(232, 223, 208, 0.1);
  border-top-color: var(--accent, #c8a96e);
  border-radius: 50%;
  animation: preview3d-spin 1s linear infinite;
}

@keyframes preview3d-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
