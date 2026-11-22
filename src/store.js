import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  addPlane,
  material,
  mulberry32,
  randRange,
  pick,
  makeCanvas,
  canvasTexture,
  fillRoundRect,
  roundRect,
  drawSpacedText,
  disposeObject
} from './util.js';
import {
  signTexture,
  verticalSignTexture,
  neonTexture,
  posterTexture,
  brickTexture,
  stoneTexture,
  asphaltTexture,
  checkerTileTexture,
  woodTexture,
  plasterTexture,
  roofTileTexture,
  menuBoardTexture,
  windowDecalTexture,
  frostTexture,
  softCircleTexture
} from './textures.js';
import {
  createShelf,
  createFridge,
  createCounter,
  createShopCat,
  createVendingMachine,
  createBicycle,
  createSakuraTree,
  createBambooPlanter,
  createSteamerCart,
  createStoneDrum,
  createBench,
  createFireHydrant,
  createNewsBox,
  createStreetLamp,
  createAframeSign,
  createPostbox,
  createPowerPole,
  createCable,
  createBushCluster,
  createPlanterBox,
  createAwning,
  createJapaneseEave,
  createChineseRoof,
  createLantern,
  createBollard,
  createWallMenu,
  createPosterStand,
  createWindowPoster,
  createSmallPlant
} from './props.js';

export const STYLES = {
  jp: {
    id: 'jp',
    name: '日系',
    en: 'MACHI MART',
    title: '街角の、小さな灯り。',
    description: '白い看板と藍ののれん。夕暮れにやわらかく灯る、いつもの街角。',
    accent: '#c84732',
    accent2: '#35556b'
  },
  cn: {
    id: 'cn',
    name: '国风',
    en: 'CHANGLE MART',
    title: '长乐路口，灯火长明。',
    description: '朱红木柱、青瓦飞檐，一盏灯笼守着二十四小时的烟火气。',
    accent: '#a73329',
    accent2: '#c9a35c'
  },
  us: {
    id: 'us',
    name: '欧美',
    en: 'CORNER MARKET',
    title: 'The corner is always open.',
    description: '红砖、条纹雨棚和一块霓虹 OPEN。像电影里那样，永远亮着的街角。',
    accent: '#214d3f',
    accent2: '#c89b54'
  }
};

const FRONT_Z = 3.0;
const INTERIOR_FLOOR_Y = 0.17;

function signMaterial(texture, { emissive = 0.5, transparent = false, basic = false } = {}) {
  if (basic) {
    return new THREE.MeshBasicMaterial({ map: texture, transparent, depthWrite: !transparent, opacity: 1 });
  }
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: emissive,
    roughness: 0.55,
    metalness: 0.02,
    transparent
  });
  if (transparent) mat.depthWrite = false;
  return mat;
}

function addSign(parent, texture, width, height, x, y, z, opts = {}) {
  const mat = signMaterial(texture, opts);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.position.set(x, y, z);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  parent.add(mesh);
  return { mesh, mat };
}

function makeCityFacadeTexture(variant = 0, seed = 1) {
  const { canvas, ctx } = makeCanvas(256, 512);
  const rand = mulberry32(seed);
  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, variant === 2 ? '#31383a' : '#252c2e');
  base.addColorStop(1, variant === 1 ? '#293537' : '#1d2426');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 512);

  // Concrete seams and grime make the facades read as built form, not posters.
  for (let x = 0; x < 256; x += 64) {
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(x, 0, 1, 512);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + 63, 0, 1, 512);
  }
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(${rand() > 0.55 ? '255,255,255' : '0,0,0'},${randRange(rand, 0.012, 0.04)})`;
    ctx.fillRect(rand() * 256, rand() * 512, randRange(rand, 1, 8), randRange(rand, 1, 4));
  }

  const floors = 9;
  const cols = 4;
  for (let f = 0; f < floors; f++) {
    const y = 18 + f * 49;
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(0, y + 37, 256, 4);
    for (let c = 0; c < cols; c++) {
      const x = 15 + c * 59;
      const lit = rand() < (variant === 1 ? 0.26 : variant === 2 ? 0.38 : 0.32);
      const cool = variant === 1 && rand() < 0.55;
      const inner = lit
        ? (cool ? pick(rand, ['#bcd7d8', '#d2e4df', '#a9c7cc']) : pick(rand, ['#f4d09a', '#ffdda4', '#d8ad79']))
        : pick(rand, ['#202b2e', '#172225', '#2b3234']);
      ctx.fillStyle = '#11181a';
      ctx.fillRect(x - 2, y - 2, 40, 31);
      ctx.fillStyle = inner;
      ctx.fillRect(x, y, 36, 27);
      if (lit) {
        ctx.fillStyle = 'rgba(255,255,255,0.24)';
        ctx.fillRect(x + 4, y + 3, 12, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 22, y + 2, 2, 23);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y + 26, 36, 1);
      if (variant === 0 && f % 2 === 0) {
        ctx.fillStyle = 'rgba(8,12,13,0.55)';
        ctx.fillRect(x - 5, y + 27, 46, 3);
        for (let b = -4; b < 42; b += 9) {
          ctx.fillRect(x + b, y + 28, 1, 5);
        }
      }
      if (rand() < 0.16) {
        ctx.fillStyle = '#171d1e';
        ctx.fillRect(x + 7, y + 29, 22, 8);
      }
    }
  }

  // Ground-floor retail glow.
  ctx.fillStyle = '#111719';
  ctx.fillRect(0, 454, 256, 58);
  for (let s = 0; s < 3; s++) {
    ctx.fillStyle = s === 1 ? '#d3a968' : '#b98653';
    ctx.fillRect(8 + s * 82, 463, 74, 35);
    ctx.fillStyle = 'rgba(255,244,213,0.35)';
    ctx.fillRect(12 + s * 82, 466, 65, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(8 + s * 82, 499, 74, 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(0, 10, 256, 2);
  return canvasTexture(canvas);
}

function makeShopWindowTexture(warm = true) {
  const { canvas, ctx } = makeCanvas(256, 128);
  ctx.fillStyle = '#141b1c';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#2e2922';
  ctx.fillRect(7, 7, 242, 114);
  const glow = ctx.createLinearGradient(0, 20, 0, 120);
  glow.addColorStop(0, warm ? '#f0c483' : '#acd2d2');
  glow.addColorStop(1, warm ? '#a5653c' : '#5d8a91');
  ctx.fillStyle = glow;
  ctx.fillRect(15, 22, 226, 88);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(18,25,25,0.8)';
    ctx.fillRect(26 + i * 44, 66, 31, 3);
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = j % 2 ? 'rgba(255,236,191,0.45)' : 'rgba(115,55,35,0.5)';
      ctx.fillRect(28 + i * 44 + j * 7, 45, 5, 18);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(15, 22, 3, 88);
  ctx.fillRect(94, 22, 2, 88);
  ctx.fillRect(174, 22, 2, 88);
  ctx.fillStyle = 'rgba(255,245,218,0.45)';
  ctx.fillRect(22, 26, 42, 4);
  return canvasTexture(canvas);
}

function makeNorenTexture(text, bg, fg, accent) {
  const { canvas, ctx } = makeCanvas(768, 320);
  ctx.clearRect(0, 0, 768, 320);
  const panelW = 256;
  for (let p = 0; p < 3; p++) {
    ctx.fillStyle = bg;
    ctx.fillRect(p * panelW + 4, 0, panelW - 8, 280);
    ctx.fillStyle = 'rgba(255,255,255,0.055)';
    ctx.fillRect(p * panelW + 10, 0, 8, 280);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(p * panelW + panelW - 14, 0, 5, 280);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 150px "Yu Gothic", "Microsoft YaHei", sans-serif';
  const letters = [...text];
  const count = Math.min(3, Math.max(1, letters.length));
  letters.slice(0, count).forEach((char, i) => {
    ctx.fillText(char, (768 / count) * (i + 0.5), 145);
  });
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(384, 260, 18, 0, Math.PI * 2);
  ctx.fill();
  return canvasTexture(canvas);
}

function makeDoorDecalTexture(style) {
  const { canvas, ctx } = makeCanvas(512, 256);
  ctx.clearRect(0, 0, 512, 256);
  const title = style === 'cn' ? '营业中' : style === 'us' ? 'PULL' : 'OPEN';
  const sub = style === 'cn' ? '推 · PUSH' : style === 'us' ? 'OPEN 24 HOURS' : '自動ドア';
  const accent = style === 'cn' ? '#b23b2d' : style === 'us' ? '#d8b16c' : '#d2a35e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 248, 232, 0.96)';
  ctx.font = style === 'cn'
    ? '800 88px "STKaiti", "KaiTi", "SimSun", serif'
    : '800 92px "Yu Gothic", "Microsoft YaHei", Georgia, serif';
  ctx.fillText(title, 256, 102);
  ctx.fillStyle = accent;
  ctx.font = style === 'cn' ? '600 30px "KaiTi", Georgia, serif' : '600 30px Georgia, serif';
  ctx.fillText(sub, 256, 186);
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.52)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(186, 143);
  ctx.lineTo(326, 143);
  ctx.stroke();
  return canvasTexture(canvas);
}

function makePoster(kind) {
  const palette = kind === 'jp'
    ? { bg: '#f3e9d9', ink: '#24342f', accent: '#bf3c2c', soft: '#e9c8b8' }
    : kind === 'cn'
      ? { bg: '#f0e0c4', ink: '#2c2721', accent: '#a53227', soft: '#d9b98d' }
      : { bg: '#ede4d2', ink: '#24332e', accent: '#1f4d3f', soft: '#c7b28a' };
  return posterTexture(kind, palette);
}

function makeRoadText(text, color = 'rgba(242,239,225,0.75)') {
  const { canvas, ctx } = makeCanvas(512, 256);
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 100px "Yu Gothic", "Microsoft YaHei", sans-serif';
  ctx.fillText(text, 256, 128);
  return canvasTexture(canvas);
}

function addRoadPlane(parent, texture, width, depth, x, z, opacity = 0.9) {
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.205, z);
  parent.add(mesh);
  return mesh;
}

function makeGroundSpillTexture() {
  const { canvas, ctx } = makeCanvas(1024, 512);
  ctx.clearRect(0, 0, 1024, 512);
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(18px)';
  const strips = [
    [-425, 170, 0.95],
    [-205, 190, 0.8],
    [25, 180, 0.72],
    [245, 160, 0.55],
    [408, 105, 0.9]
  ];
  for (const [x, width, strength] of strips) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, `rgba(255, 213, 153, ${0.85 * strength})`);
    gradient.addColorStop(0.28, `rgba(255, 203, 136, ${0.44 * strength})`);
    gradient.addColorStop(0.7, `rgba(255, 192, 122, ${0.12 * strength})`);
    gradient.addColorStop(1, 'rgba(255, 185, 110, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(512 + x - width / 2, 0, width, 512);
  }
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  return canvasTexture(canvas);
}

function createGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: '#c6e2e5',
    transparent: true,
    opacity: 0.075,
    roughness: 0.06,
    metalness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.7,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

function addWindowGrid(parent, x, y, z, width, height, mat, cols, rows) {
  addBox(parent, 0.06, height, 0.08, mat, x - width / 2, y, z, { castShadow: false });
  addBox(parent, 0.06, height, 0.08, mat, x + width / 2, y, z, { castShadow: false });
  addBox(parent, width, 0.06, 0.08, mat, x, y - height / 2, z, { castShadow: false });
  addBox(parent, width, 0.06, 0.08, mat, x, y + height / 2, z, { castShadow: false });
  for (let i = 1; i < cols; i++) {
    addBox(parent, 0.035, height, 0.07, mat, x - width / 2 + (width / cols) * i, y, z, { castShadow: false });
  }
  for (let i = 1; i < rows; i++) {
    addBox(parent, width, 0.035, 0.07, mat, x, y - height / 2 + (height / rows) * i, z, { castShadow: false });
  }
}

function addInteriorPendant(parent, x, y, z, color, shadeColor, data) {
  addCylinder(parent, 0.008, 0.008, 0.45, 5, material('pendant-wire', { color: '#3b3a34', roughness: 0.8 }), x, y + 0.25, z);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 14, 1, true), material('pendant-shade', { color: shadeColor, roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide }));
  shade.position.set(x, y, z);
  shade.rotation.x = Math.PI;
  shade.castShadow = true;
  parent.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffe3a6', emissive: color, emissiveIntensity: 0.75, roughness: 0.3 }));
  bulb.position.set(x, y - 0.09, z);
  parent.add(bulb);
}

function buildShell(data) {
  const { group, style } = data;
  const W = 9.6;
  const D = 6.2;
  const front = FRONT_Z;
  const back = -3.2;
  const wallH = 3.65;
  const isWestern = style === 'us';
  const wallTone = style === 'cn' ? '#d4bd99' : style === 'us' ? '#d9cbb4' : '#d8d1c1';
  const wallTexture = plasterTexture({ repeat: [2.2, 1.4], tone: wallTone });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.9 });
  const brickSide = isWestern ? new THREE.MeshStandardMaterial({ map: brickTexture({ repeat: [1.7, 1.2] }), color: '#b9aaa0', roughness: 0.92 }) : wallMat;

  addBox(group, W + 0.55, 0.24, D + 0.55, material('plinth', { color: style === 'cn' ? '#61564a' : '#918b80', roughness: 0.95 }), 0, 0.12, -0.1);
  addBox(group, W, 0.16, D, material('store-floor-base', { color: '#5f594e', roughness: 0.9 }), 0, 0.08, -0.1);
  const floorTex = checkerTileTexture({
    repeat: [4.2, 2.8],
    warm: style === 'cn' ? '#bfa988' : style === 'us' ? '#c9bea9' : '#c9bfac',
    cool: style === 'cn' ? '#9d876a' : style === 'us' ? '#a99a85' : '#a89d8b'
  });
  const floor = addPlane(group, W - 0.3, D - 0.3, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.62 }), 0, INTERIOR_FLOOR_Y, -0.1, { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true });
  floor.receiveShadow = true;

  addBox(group, W, wallH, 0.2, wallMat, 0, wallH / 2, back);
  addBox(group, 0.2, wallH, D, style === 'us' ? brickSide : wallMat, -W / 2, wallH / 2, -0.1);
  addBox(group, 0.2, wallH, D, brickSide, W / 2, wallH / 2, -0.1);
  addBox(group, W + 0.1, 0.2, D + 0.1, material('ceiling', { color: '#b8b0a0', roughness: 0.9 }), 0, 3.28, -0.1);
  addBox(group, W + 0.02, 0.13, D + 0.02, material('roof-cap', { color: '#6f685b', roughness: 0.9 }), 0, 3.69, -0.1);

  // front structural frame
  const frameMat = new THREE.MeshStandardMaterial({ color: style === 'cn' ? '#62382c' : style === 'us' ? '#263f36' : '#aaa394', roughness: 0.6, metalness: 0.05 });
  addBox(group, W, 0.28, 0.34, frameMat, 0, 0.27, front);
  addBox(group, W, 0.42, 0.34, frameMat, 0, 3.47, front);
  addBox(group, 0.32, 3.4, 0.34, frameMat, -4.75, 1.77, front);
  addBox(group, 0.3, 3.4, 0.34, frameMat, 4.02, 1.77, front);
  addBox(group, 0.42, 3.4, 0.34, frameMat, 4.68, 1.77, front);
  addBox(group, 0.26, 0.34, 0.3, frameMat, 4.75, 3.35, front);

  const glassMat = createGlassMaterial();
  const panelW = 6.09;
  const panelCenter = -1.425;
  const glass = addPlane(group, panelW, 2.95, glassMat, panelCenter, 1.72, front + 0.17, { rotation: [0, 0, 0] });
  glass.castShadow = false;
  for (let i = 1; i < 4; i++) {
    addBox(group, 0.065, 2.95, 0.1, frameMat, -4.47 + (panelW / 4) * i, 1.72, front + 0.2, { castShadow: false });
  }
  addBox(group, panelW, 0.06, 0.1, frameMat, panelCenter, 0.38, front + 0.2, { castShadow: false });
  addBox(group, panelW, 0.06, 0.1, frameMat, panelCenter, 3.02, front + 0.2, { castShadow: false });

  const doorGlass = addPlane(group, 1.52, 2.92, glassMat, 2.44, 1.72, front + 0.22);
  doorGlass.castShadow = false;
  const sideGlass = addPlane(group, 0.6, 2.92, glassMat, 3.56, 1.72, front + 0.22);
  sideGlass.castShadow = false;
  addBox(group, 0.08, 3.02, 0.11, frameMat, 1.66, 1.76, front + 0.24, { castShadow: false });
  addBox(group, 0.08, 3.02, 0.11, frameMat, 3.22, 1.76, front + 0.24, { castShadow: false });
  addBox(group, 1.64, 0.08, 0.11, frameMat, 2.44, 3.22, front + 0.24, { castShadow: false });
  addBox(group, 1.64, 0.08, 0.11, frameMat, 2.44, 0.3, front + 0.24, { castShadow: false });
  addBox(group, 0.56, 0.06, 0.1, frameMat, 3.56, 3.22, front + 0.24, { castShadow: false });
  addBox(group, 0.56, 0.06, 0.1, frameMat, 3.56, 0.3, front + 0.24, { castShadow: false });
  addBox(group, 0.05, 0.38, 0.05, material('door-handle', { color: '#c9c3b2', roughness: 0.25, metalness: 0.8 }), 2.86, 1.62, front + 0.31);
  addBox(group, 1.9, 0.03, 0.6, material('threshold', { color: '#918b7d', roughness: 0.6, metalness: 0.3 }), 2.8, 0.18, front + 0.3);

  // Door decal is centered on the glass panel, not the whole facade.
  const doorDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.33),
    new THREE.MeshBasicMaterial({
      map: makeDoorDecalTexture(style),
      transparent: true,
      depthWrite: false,
      opacity: 0.95
    })
  );
  doorDecal.position.set(2.44, 1.55, front + 0.285);
  doorDecal.renderOrder = 2;
  group.add(doorDecal);

  // subtle glass streaks
  const streakMat = new THREE.MeshBasicMaterial({ color: '#d9f2f0', transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false });
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 4.2), streakMat);
  streak.position.set(-3.2, 1.72, front + 0.2);
  streak.rotation.z = 0.22;
  group.add(streak);
  const streak2 = streak.clone();
  streak2.position.x = -1.15;
  streak2.rotation.z = -0.16;
  group.add(streak2);

  // interior ceiling strips
  const stripMat = new THREE.MeshStandardMaterial({ color: '#fff2d0', emissive: '#ffdca0', emissiveIntensity: 0.45, roughness: 0.4 });
  for (const x of [-3.2, -0.8, 1.6]) {
    addBox(group, 1.55, 0.045, 0.16, stripMat, x, 3.17, 0.2, { castShadow: false });
  }
  addInteriorPendant(group, -3.15, 2.75, -0.15, '#ffbd72', style === 'cn' ? '#9d3c2e' : style === 'us' ? '#2e4b41' : '#caa87f', data);
  addInteriorPendant(group, -1.2, 2.75, -0.15, '#ffbd72', style === 'cn' ? '#9d3c2e' : style === 'us' ? '#2e4b41' : '#caa87f', data);
  addInteriorPendant(group, 0.75, 2.75, -0.15, '#ffbd72', style === 'cn' ? '#9d3c2e' : style === 'us' ? '#2e4b41' : '#caa87f', data);

  data.wallMat = wallMat;
  data.frameMat = frameMat;
  data.glassMat = glassMat;
  data.stripMat = stripMat;
}

function buildFrontStyle(data) {
  const { group, style } = data;
  const signY = 4.17;
  const signZ = FRONT_Z + 0.18;
  const boardColor = style === 'cn' ? '#762c25' : style === 'us' ? '#1e3b32' : '#f4eee2';
  addBox(group, 9.85, 1.06, 0.26, material('sign-board', { color: boardColor, roughness: 0.5, metalness: 0.05 }), 0, signY, signZ - 0.07);
  addBox(group, 10.15, 0.1, 0.42, material('sign-cap', { color: style === 'cn' ? '#b88b4d' : style === 'us' ? '#cba15e' : '#cbc3b4', roughness: 0.4, metalness: 0.35 }), 0, 4.73, signZ - 0.02);

  if (style === 'jp') {
    const tex = signTexture({
      width: 1280,
      height: 240,
      bg: '#f4eee2',
      fg: '#1d2b34',
      accent: '#c73f2e',
      title: 'マチマート',
      subtitle: 'MACHI MART  ·  OPEN 24 HOURS',
      top: 'まちの、いつもの。',
      logo: { text: 'ま', bg: '#c73f2e', fg: '#fbf4e5', font: '800 85px "Yu Gothic", sans-serif' },
      titleFont: '900 108px "Yu Gothic", "Microsoft YaHei", sans-serif',
      subtitleFont: '600 28px Georgia, serif'
    });
    const { mat } = addSign(group, tex, 9.35, 0.8, 0, signY, signZ + 0.08, { emissive: 0.35 });
    data.signMats.push(mat);

    // eave and fabric noren
    const eave = createJapaneseEave({ width: 10.35, depth: 0.95, color: '#596968' });
    eave.position.set(0, 4.77, FRONT_Z + 0.02);
    group.add(eave);
    addBox(group, 9.55, 0.36, 0.15, material('noren-rod', { color: '#393b37', roughness: 0.6, metalness: 0.25 }), 0, 3.12, FRONT_Z + 0.27);
    const norenTex = makeNorenTexture('まちの', '#2d4a60', '#f4ebd7', '#d3a25f');
    const norenMat = new THREE.MeshStandardMaterial({ map: norenTex, transparent: true, alphaTest: 0.12, side: THREE.DoubleSide, roughness: 0.92 });
    const noren = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.54), norenMat);
    noren.position.set(2.44, 2.78, FRONT_Z + 0.28);
    noren.castShadow = true;
    group.add(noren);

    const bladeTex = verticalSignTexture({
      width: 256,
      height: 1024,
      bg: '#bd3b2d',
      fg: '#fff5e3',
      accent: '#f0cd93',
      chars: ['マ', 'チ', 'マ', 'ー', 'ト'],
      top: '24H',
      bottom: 'MACHI'
    });
    addBox(group, 0.12, 2.3, 0.78, material('blade-board', { color: '#a93226', roughness: 0.6 }), 5.04, 3.98, 2.12);
    const blade = addSign(group, bladeTex, 0.68, 2.18, 5.13, 3.98, 2.12, { emissive: 0.65, rotation: [0, Math.PI / 2, 0] });
    data.signMats.push(blade.mat);
    const bladeBack = addSign(group, bladeTex, 0.68, 2.18, 5.13, 3.98, 2.12, { emissive: 0.65, rotation: [0, Math.PI / 2, 0] });
    bladeBack.mesh.rotation.y = -Math.PI / 2;
    bladeBack.mesh.position.x = 4.95;
    data.signMats.push(bladeBack.mat);
    addBox(group, 0.05, 0.05, 0.55, material('blade-bracket', { color: '#414b48', roughness: 0.45, metalness: 0.5 }), 4.72, 4.85, 2.12);

    // upper shoji window on the side wall
    const shojiMat = material('shoji-frame', { color: '#5d5140', roughness: 0.65 });
    const shojiPaper = new THREE.MeshStandardMaterial({ color: '#f1e6cc', emissive: '#ffd79d', emissiveIntensity: 0.35, roughness: 0.8 });
    const shoji = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), shojiPaper);
    shoji.position.set(4.915, 2.75, -1.5);
    shoji.rotation.y = Math.PI / 2;
    group.add(shoji);
    data.windowMats.push(shojiPaper);
    for (let i = 0; i < 4; i++) {
      addBox(group, 0.04, 1.06, 0.035, shojiMat, 4.93, 2.75, -2.35 + i * 0.56, { castShadow: false });
      addBox(group, 0.04, 0.035, 1.7, shojiMat, 4.93, 2.22 + i * 0.26, -1.5, { castShadow: false });
    }

    const poster = addSign(group, makePoster('jp'), 0.84, 1.18, -2.35, 2.0, FRONT_Z + 0.205, { emissive: 0.1, transparent: false });
    poster.mesh.castShadow = false;
    data.signMats.push(poster.mat);
    const decalMat = new THREE.MeshBasicMaterial({ map: windowDecalTexture('jp'), transparent: true, depthWrite: false, opacity: 0.85 });
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), decalMat);
    decal.position.set(0.75, 2.07, FRONT_Z + 0.205);
    group.add(decal);

    // side wall banding and downpipe
    addBox(group, 0.03, 3.4, 0.16, material('side-band', { color: '#385b70', roughness: 0.6 }), 4.72, 1.8, 1.1);
    addCylinder(group, 0.045, 0.045, 3.2, 8, material('downpipe', { color: '#7c8077', roughness: 0.5, metalness: 0.3 }), 4.73, 1.75, -2.8);
    const signPlate = addSign(group, signTexture({ width: 512, height: 128, bg: '#f4eee2', fg: '#24332f', accent: '#c73f2e', title: '24H', subtitle: 'MACHI MART', titleFont: '900 74px Georgia, serif', subtitleFont: '600 20px Georgia, serif' }), 0.58, 0.145, 4.735, 2.45, 2.55, { rotation: [0, -Math.PI / 2, 0], emissive: 0.35 });
    data.signMats.push(signPlate.mat);
  }

  if (style === 'cn') {
    const tex = signTexture({
      width: 1400,
      height: 250,
      bg: '#efe1c2',
      fg: '#8c2d22',
      accent: '#a97b3f',
      title: '长乐便利',
      subtitle: 'CHANGLE MART  ·  长乐路口  ·  廿四小时',
      top: '二 十 四 小 时  ·  灯 火 长 明',
      titleFont: '900 142px "STKaiti", "KaiTi", "SimSun", serif',
      subtitleFont: '600 27px "KaiTi", Georgia, serif'
    });
    const { mat } = addSign(group, tex, 9.35, 0.82, 0, signY, signZ + 0.08, { emissive: 0.55 });
    mat.userData.emissiveBoost = 0.85;
    data.signMats.push(mat);
    addBox(group, 9.6, 0.1, 0.35, material('cn-gold-trim', { color: '#c79c55', roughness: 0.32, metalness: 0.55 }), 0, 3.73, signZ + 0.15);
    addBox(group, 9.6, 0.1, 0.35, material('cn-gold-trim2', { color: '#c79c55', roughness: 0.32, metalness: 0.55 }), 0, 4.61, signZ + 0.15);
    const cnSignLight = new THREE.PointLight('#ffc27d', 2.4, 5.2, 2);
    cnSignLight.position.set(0, 4.55, signZ + 1.25);
    group.add(cnSignLight);
    data.exteriorLights.push({ light: cnSignLight, day: 0.5, night: 3.6, dusk: 2.6 });

    const roof = createChineseRoof({ width: 11.1, depth: 1.8 });
    roof.position.set(0, 5.32, FRONT_Z - 0.15);
    group.add(roof);
    addBox(group, 10.8, 0.16, 0.26, material('cn-roof-beam', { color: '#6b2a22', roughness: 0.72 }), 0, 4.74, FRONT_Z + 0.22);

    // timber columns and lattice
    const wood = material('cn-wood', { color: '#7b3329', roughness: 0.65 });
    const gold = material('cn-gold', { color: '#c7a05a', roughness: 0.35, metalness: 0.4 });
    for (const x of [-4.72, 4.67]) {
      addBox(group, 0.24, 3.3, 0.25, wood, x, 1.82, FRONT_Z + 0.24);
      addBox(group, 0.32, 0.08, 0.32, gold, x, 3.3, FRONT_Z + 0.27);
    }
    addBox(group, 9.55, 0.2, 0.22, wood, 0, 3.35, FRONT_Z + 0.25);
    addBox(group, 1.2, 1.2, 0.12, material('cn-lattice-bg', { color: '#4b2f27', roughness: 0.8 }), 4.25, 2.52, FRONT_Z + 0.25);
    const latticeMat = material('cn-lattice', { color: '#c9a15a', roughness: 0.45, metalness: 0.25 });
    for (let i = 0; i < 5; i++) {
      addBox(group, 0.028, 1.14, 0.04, latticeMat, 3.72 + i * 0.25, 2.52, FRONT_Z + 0.32, { castShadow: false });
      addBox(group, 1.15, 0.026, 0.04, latticeMat, 4.25, 1.98 + i * 0.26, FRONT_Z + 0.32, { castShadow: false });
    }

    // wooden door frame and paper-cut fu
    const fuTex = (() => {
      const { canvas, ctx } = makeCanvas(256, 256);
      ctx.clearRect(0, 0, 256, 256);
      ctx.translate(128, 128);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#b33428';
      ctx.fillRect(-82, -82, 164, 164);
      ctx.strokeStyle = '#e8c786';
      ctx.lineWidth = 6;
      ctx.strokeRect(-68, -68, 136, 136);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#f0d194';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 110px "STKaiti", "KaiTi", serif';
      ctx.fillText('福', 0, 5);
      return canvasTexture(canvas);
    })();
    const fu = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), new THREE.MeshBasicMaterial({ map: fuTex, transparent: true, depthWrite: false }));
    fu.position.set(2.42, 2.3, FRONT_Z + 0.3);
    group.add(fu);

    // lanterns
    const lanternL = createLantern({ scale: 0.88 });
    lanternL.position.set(-4.1, 3.35, FRONT_Z + 0.62);
    group.add(lanternL);
    const lanternR = createLantern({ scale: 0.88 });
    lanternR.position.set(3.85, 3.35, FRONT_Z + 0.62);
    group.add(lanternR);
    const lanternLight = new THREE.PointLight('#ff9a62', 0.8, 4.2, 2);
    lanternLight.position.set(-4.1, 2.9, FRONT_Z + 0.7);
    group.add(lanternLight);
    data.exteriorLights.push({ light: lanternLight, day: 0.25, night: 2.4, dusk: 1.4 });
    data.sway.push({ object: lanternL, axis: 'z', amplitude: 0.035, speed: 1.3, phase: 0 });
    data.sway.push({ object: lanternR, axis: 'z', amplitude: 0.03, speed: 1.15, phase: 1.4 });

    const bannerTex = verticalSignTexture({
      width: 256,
      height: 1024,
      bg: '#a53227',
      fg: '#f3dba2',
      accent: '#d8b36c',
      chars: ['长', '乐', '便', '利'],
      top: '24H',
      bottom: 'CHANGLE'
    });
    addBox(group, 0.1, 2.4, 0.74, material('cn-banner-board', { color: '#7f2a22', roughness: 0.7 }), 5.02, 3.88, 2.02);
    const banner = addSign(group, bannerTex, 0.66, 2.28, 5.1, 3.88, 2.02, { emissive: 0.55, rotation: [0, Math.PI / 2, 0] });
    data.signMats.push(banner.mat);
    const bannerBack = addSign(group, bannerTex, 0.66, 2.28, 5.1, 3.88, 2.02, { emissive: 0.55, rotation: [0, -Math.PI / 2, 0] });
    bannerBack.mesh.position.x = 4.94;
    data.signMats.push(bannerBack.mat);

    const poster = addSign(group, makePoster('cn'), 0.8, 1.15, -2.55, 2.0, FRONT_Z + 0.21, { emissive: 0.12 });
    data.signMats.push(poster.mat);
    const decalMat = new THREE.MeshBasicMaterial({ map: windowDecalTexture('cn'), transparent: true, depthWrite: false, opacity: 0.9 });
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), decalMat);
    decal.position.set(-0.1, 2.02, FRONT_Z + 0.21);
    group.add(decal);

    // red curb line and stone base
    addBox(group, 0.18, 0.5, 6.3, material('cn-base', { color: '#5e4a3b', roughness: 0.9 }), -4.72, 0.25, -0.05);
    addCylinder(group, 0.03, 0.03, 2.4, 6, material('cn-cord', { color: '#3d2d23', roughness: 0.8 }), -4.1, 4.55, FRONT_Z + 0.62);
  }

  if (style === 'us') {
    const tex = signTexture({
      width: 1400,
      height: 250,
      bg: '#1e3b32',
      fg: '#f3e4ba',
      accent: '#cda15d',
      title: 'CORNER MARKET',
      subtitle: 'EST. 1987  ·  GROCERY  ·  DELI  ·  OPEN 24 HOURS',
      top: 'F R E S H   E V E R Y   D A Y',
      titleFont: '900 118px Georgia, "Times New Roman", serif',
      subtitleFont: '600 26px Georgia, serif'
    });
    const { mat } = addSign(group, tex, 9.35, 0.82, 0, signY, signZ + 0.08, { emissive: 0.45 });
    data.signMats.push(mat);
    addBox(group, 9.7, 0.11, 0.4, material('us-cornice', { color: '#d9c6a2', roughness: 0.62 }), 0, 4.69, signZ + 0.02);
    addBox(group, 9.7, 0.08, 0.36, material('us-cornice2', { color: '#bfa87d', roughness: 0.62 }), 0, 3.71, signZ + 0.02);

    const awning = createAwning({ width: 6.3, colors: ['#1f4d3f', '#f1e4c9'] });
    awning.position.set(-1.32, 3.48, FRONT_Z + 0.2);
    group.add(awning);
    data.sway.push({ object: awning, axis: 'z', amplitude: 0.006, speed: 0.9, phase: 0.2 });

    // brick facade band on the right, with an upper side window rather than
    // covering the hand-painted sign.
    addBox(group, 1.1, 3.2, 0.12, new THREE.MeshStandardMaterial({ map: brickTexture({ repeat: [0.6, 0.9] }), roughness: 0.9 }), 4.2, 2.0, FRONT_Z + 0.16);
    const frameMat = data.frameMat;
    const warmWindow = new THREE.MeshStandardMaterial({ color: '#f4e4c1', emissive: '#ffc477', emissiveIntensity: 1.3, roughness: 0.4 });
    const sidePane = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.35), warmWindow);
    sidePane.position.set(4.915, 2.55, -0.45);
    sidePane.rotation.y = Math.PI / 2;
    group.add(sidePane);
    addBox(group, 0.08, 1.55, 0.08, frameMat, 4.93, 2.55, -1.08);
    addBox(group, 0.08, 1.55, 0.08, frameMat, 4.93, 2.55, 0.18);
    addBox(group, 0.08, 0.08, 1.35, frameMat, 4.93, 1.83, -0.45);
    addBox(group, 0.08, 0.08, 1.35, frameMat, 4.93, 3.27, -0.45);
    addBox(group, 0.05, 1.4, 0.035, frameMat, 4.94, 2.55, -0.45);
    data.windowMats.push(warmWindow);

    // neon OPEN
    const neon = neonTexture('OPEN', { color: '#ff6b4a', glow: '#ff2f18', font: 'italic 900 138px Georgia, serif' });
    const neonMat = new THREE.MeshBasicMaterial({ map: neon, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const neonMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.4), neonMat);
    neonMesh.position.set(2.44, 2.36, FRONT_Z + 0.27);
    group.add(neonMesh);
    data.signMats.push(neonMat);
    data.neon = neonMesh;

    // wall sconces
    for (const x of [3.95]) {
      addBox(group, 0.06, 0.35, 0.06, material('sconce-arm', { color: '#2d3935', roughness: 0.4, metalness: 0.6 }), x, 2.95, FRONT_Z + 0.28);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 10, 1, true), material('sconce-shade', { color: '#2d3935', roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }));
      shade.position.set(x, 2.72, FRONT_Z + 0.34);
      group.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffe3ac', emissive: '#ffbd69', emissiveIntensity: 2.0, roughness: 0.3 }));
      bulb.position.set(x, 2.65, FRONT_Z + 0.34);
      group.add(bulb);
      const l = new THREE.PointLight('#ffc27a', 0.4, 3.6, 2);
      l.position.set(x, 2.62, FRONT_Z + 0.45);
      group.add(l);
      data.exteriorLights.push({ light: l, day: 0.1, night: 1.5, dusk: 0.8 });
    }

    const poster = addSign(group, makePoster('us'), 0.84, 1.18, -3.9, 2.0, FRONT_Z + 0.21, { emissive: 0.08 });
    data.signMats.push(poster.mat);
    const decalMat = new THREE.MeshBasicMaterial({ map: windowDecalTexture('us'), transparent: true, depthWrite: false, opacity: 0.86 });
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.76), decalMat);
    decal.position.set(-1.15, 2.03, FRONT_Z + 0.21);
    group.add(decal);

    // flower boxes below window
    for (const x of [-3.85, -1.9, 0.2]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.24, 0.32), material('flower-box', { color: '#4c3a2d', roughness: 0.85 }));
      box.position.set(x, 0.55, FRONT_Z + 0.32);
      box.castShadow = true;
      group.add(box);
      for (let i = 0; i < 6; i++) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), material('flower', { color: i % 2 ? '#e9b6b4' : '#d9d09a', roughness: 0.85 }));
        flower.position.set(x - 0.28 + i * 0.11, 0.7 + (i % 3) * 0.035, FRONT_Z + 0.33);
        group.add(flower);
      }
    }
  }

  // sign spotlights
  const spotColor = style === 'cn' ? '#ffb46b' : '#ffe4b6';
  const spot = new THREE.PointLight(spotColor, 2.6, 9, 2);
  spot.position.set(-1.8, 5.25, FRONT_Z + 1.2);
  group.add(spot);
  data.exteriorLights.push({ light: spot, day: 0.8, night: 5.4, dusk: 3.2 });
}

function buildInterior(data) {
  const { group, style } = data;
  const y = INTERIOR_FLOOR_Y;
  const shelf = createShelf({ width: 4.45, height: 1.95, depth: 0.58, kind: style, seed: style === 'jp' ? 11 : style === 'cn' ? 47 : 81 });
  shelf.position.set(-2.02, y, -2.72);
  group.add(shelf);

  const fridge = createFridge({ width: 2.1, height: 2.25, depth: 0.72, kind: style });
  fridge.position.set(3.28, y, -2.45);
  group.add(fridge);
  data.windowMats.push(fridge.userData.glowMat);

  const counter = createCounter({ kind: style });
  counter.position.set(2.5, y, 1.25);
  group.add(counter);

  // central display island
  const islandMat = material('island', { color: style === 'cn' ? '#6d4c35' : style === 'us' ? '#31433b' : '#d9d2c2', roughness: 0.6 });
  addBox(group, 2.25, 0.12, 0.95, material('island-top', { color: style === 'cn' ? '#b58e5d' : '#f1eadb', roughness: 0.55 }), -2.35, 0.72, -0.25);
  for (const x of [-3.3, -1.4]) {
    for (const z of [-0.58, 0.08]) addBox(group, 0.08, 0.7, 0.08, islandMat, x, 0.4, z);
  }
  addBox(group, 2.1, 0.06, 0.78, material('island-shelf', { color: '#8e8a7e', roughness: 0.7 }), -2.35, 0.32, -0.25);
  const rand = mulberry32(101);
  const productMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
  const productGeo = new THREE.BoxGeometry(1, 1, 1);
  const products = new THREE.InstancedMesh(productGeo, productMat, 30);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const colors = style === 'cn' ? ['#bd3c2e', '#e1b34e', '#f2e4c8', '#4f755b'] : style === 'us' ? ['#b94636', '#e6b44e', '#2f5d4d', '#f0e3ca'] : ['#d14835', '#e6bc4f', '#3e7596', '#efe5d1'];
  for (let i = 0; i < 30; i++) {
    const col = i % 10;
    const row = Math.floor(i / 10);
    dummy.position.set(-3.28 + col * 0.2, 0.86 + row * 0.13, -0.38 + (row % 2) * 0.2 + randRange(rand, -0.03, 0.03));
    dummy.scale.set(randRange(rand, 0.1, 0.16), randRange(rand, 0.12, 0.2), randRange(rand, 0.14, 0.22));
    dummy.rotation.y = randRange(rand, -0.2, 0.2);
    dummy.updateMatrix();
    products.setMatrixAt(i, dummy.matrix);
    products.setColorAt(i, color.set(pick(rand, colors)));
  }
  products.instanceColor.needsUpdate = true;
  products.receiveShadow = true;
  group.add(products);

  // baskets near the door
  const basketMat = material('basket', { color: '#b74d33', roughness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const basket = addBox(group, 0.36, 0.18, 0.28, basketMat, 1.55, 0.27 + i * 0.14, 2.35, { castShadow: false });
    basket.rotation.y = 0.1 * i;
  }

  const cat = createShopCat();
  cat.position.set(1.0, y + 0.01, 1.8);
  cat.rotation.y = -0.5;
  group.add(cat);
  data.cat = cat;

  // wall menu on the right interior wall
  const menu = createWallMenu(style);
  menu.position.set(4.47, 2.1, 0.9);
  menu.rotation.y = -Math.PI / 2;
  group.add(menu);

  // interior lights
  const lightColor = style === 'cn' ? '#ffc07f' : '#ffd7a4';
  for (const [x, z, intensity] of [[-2.35, 0.4, 2.5], [0.9, 0.5, 2.0], [3.15, -1.0, 1.5]]) {
    const light = new THREE.PointLight(lightColor, intensity, 8.5, 2);
    light.position.set(x, 2.85, z);
    group.add(light);
    data.interiorLights.push(light);
  }

  // warm floor bounce near the entrance
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.3), new THREE.MeshBasicMaterial({ color: '#ffc27e', transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false }));
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(1.9, 0.195, 4.3);
  group.add(spill);
  data.spill = spill;

  // entrance mat
  addBox(group, 1.6, 0.025, 0.95, material('entrance-mat', { color: style === 'cn' ? '#5b352d' : '#3c4c47', roughness: 0.95 }), 2.72, 0.19, 2.3, { castShadow: false });

  // A long, soft light pool on the pavement. It sells the storefront at dusk
  // more than any extra geometry can.
  const groundSpillMat = new THREE.MeshBasicMaterial({
    map: makeGroundSpillTexture(),
    color: style === 'cn' ? '#ffb66f' : '#ffd09a',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const groundSpill = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.5), groundSpillMat);
  groundSpill.rotation.x = -Math.PI / 2;
  groundSpill.position.set(-0.2, 0.196, 4.55);
  groundSpill.renderOrder = 1;
  group.add(groundSpill);
  data.groundSpill = groundSpill;
}

function buildStreetscape(data) {
  const { group, style } = data;
  const rand = mulberry32(style === 'jp' ? 23 : style === 'cn' ? 67 : 91);

  // ground and paving
  addBox(group, 60, 0.2, 44, material('earth', { color: '#3d433c', roughness: 1 }), 0, -0.11, 2);
  const sidewalkTex = style === 'us'
    ? stoneTexture({ repeat: [4.8, 1.9], base: '#8d6b58' })
    : style === 'cn'
      ? stoneTexture({ repeat: [4.8, 1.9], base: '#858681' })
      : stoneTexture({ repeat: [4.8, 1.9], base: '#9a9a90' });
  sidewalkTex.anisotropy = 16;
  sidewalkTex.minFilter = THREE.LinearMipmapLinearFilter;
  addBox(group, 25, 0.18, 5.7, new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.9 }), 0, 0.09, 5.9);
  addBox(group, 25, 0.3, 0.3, material('curb', { color: style === 'cn' ? '#8e7e6d' : '#b3ac9e', roughness: 0.9 }), 0, 0.14, 8.82);
  const roadTex = asphaltTexture({ repeat: [12, 2.6] });
  roadTex.anisotropy = 16;
  addBox(group, 60, 0.1, 13, new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92, metalness: 0.02 }), 0, 0.015, 15.3);
  addBox(group, 25, 0.06, 0.12, material('sidewalk-line', { color: '#e4decf', roughness: 0.8 }), 0, 0.19, 8.98);

  // road markings
  for (let i = -5; i <= 5; i++) {
    addBox(group, 1.25, 0.01, 0.12, new THREE.MeshBasicMaterial({ color: '#ded6c1', transparent: true, opacity: 0.55 }), i * 2.5, 0.075, 15.4, { castShadow: false });
  }
  // Six even bars span the road from kerb to kerb; the lane dashes run
  // along the road, but the crossing itself stays perpendicular to it.
  const zebraMat = new THREE.MeshBasicMaterial({ color: '#ede7d7', transparent: true, opacity: 0.72, depthWrite: false });
  for (let i = 0; i < 6; i++) {
    addBox(group, 0.46, 0.014, 12.4, zebraMat, -0.11 + i * 1.02, 0.079, 15.3, { castShadow: false });
  }

  // tactile paving strip for Japan
  if (style === 'jp') {
    addBox(group, 20, 0.035, 0.42, material('tactile', { color: '#d6b64b', roughness: 0.65 }), 0, 0.2, 4.0, { castShadow: false });
    const dotMat = material('tactile-dot', { color: '#b79a36', roughness: 0.6 });
    for (let i = 0; i < 18; i++) {
      for (let j = 0; j < 2; j++) {
        addCylinder(group, 0.025, 0.025, 0.018, 6, dotMat, -8.8 + i * 1.02, 0.225, 3.9 + j * 0.2, { castShadow: false });
      }
    }
  }

  if (style === 'cn') {
    addBox(group, 20, 0.03, 0.16, material('cn-curb-red', { color: '#9f3a2e', roughness: 0.7 }), 0, 0.21, 4.05, { castShadow: false });
    addBox(group, 8.5, 0.4, 0.25, material('cn-stone-wall', { color: '#7f7d72', roughness: 0.95 }), -9.2, 0.2, 2.2);
  }

  // street lamps
  const lamp = createStreetLamp();
  lamp.position.set(7.4, 0.1, 5.2);
  group.add(lamp);
  data.exteriorLights.push({ light: lamp.userData.light, day: 0, night: 2.7, dusk: 1.2 });
  data.streetLampBulb = lamp.userData.bulbMat;
  data.streetLampGlow = lamp.userData.glow;

  // storefront props by style
  if (style === 'jp') {
    const vending = createVendingMachine({ kind: 'jp' });
    vending.position.set(-6.35, 0.16, 4.55);
    vending.rotation.y = 0.2;
    group.add(vending);
    data.windowMats.push(vending.userData.glowMat);

    const bike = createBicycle({ color: '#577a68' });
    bike.position.set(-3.65, 0.17, 4.65);
    bike.rotation.y = 0.08;
    group.add(bike);

    const postbox = createPostbox();
    postbox.position.set(-8.55, 0.16, 4.75);
    postbox.rotation.y = 0.25;
    group.add(postbox);

    const streetCat = createShopCat();
    streetCat.scale.setScalar(0.72);
    streetCat.position.set(0.95, 0.19, 4.65);
    streetCat.rotation.y = -0.7;
    group.add(streetCat);

    const sakura = createSakuraTree();
    sakura.position.set(5.65, 0.16, 4.35);
    sakura.scale.setScalar(0.9);
    group.add(sakura);
    data.sakura = sakura;

    const planter = createPlanterBox({ width: 1.2, color: '#7e6752' });
    planter.position.set(-1.55, 0.17, 4.5);
    group.add(planter);

    const stand = createPosterStand(makePoster('jp'));
    stand.position.set(4.9, 0.17, 4.75);
    stand.rotation.y = -0.45;
    group.add(stand);

    // small parking sign
    addCylinder(group, 0.035, 0.035, 2.0, 8, material('parking-pole', { color: '#6f736b', roughness: 0.5, metalness: 0.4 }), -7.6, 1.1, 5.6);
    const parking = addSign(group, signTexture({ width: 512, height: 256, bg: '#f2ecde', fg: '#334c5b', accent: '#b43b2d', title: 'P', subtitle: '24H', titleFont: '900 170px Georgia, serif', subtitleFont: '700 52px Georgia, serif' }), 0.52, 0.26, -7.6, 2.25, 5.62, { emissive: 0.2 });
    parking.mesh.rotation.y = 0.1;
    data.signMats.push(parking.mat);
  }

  if (style === 'cn') {
    const cart = createSteamerCart();
    cart.position.set(-6.25, 0.16, 4.55);
    cart.rotation.y = 0.18;
    group.add(cart);
    data.steam = cart.userData.steam;

    const bamboo = createBambooPlanter();
    bamboo.position.set(-4.35, 0.16, 4.62);
    bamboo.scale.setScalar(1.1);
    group.add(bamboo);

    const drum = createStoneDrum();
    drum.position.set(4.6, 0.16, 4.55);
    drum.scale.setScalar(1.1);
    group.add(drum);

    const drum2 = createStoneDrum();
    drum2.position.set(6.0, 0.16, 4.55);
    drum2.scale.setScalar(0.9);
    group.add(drum2);

    const planter = createPlanterBox({ width: 1.2, color: '#7a5a42' });
    planter.position.set(-1.4, 0.17, 4.35);
    group.add(planter);

    // bamboo lantern string overhead
    const stringMat = material('lantern-string', { color: '#3c2d24', roughness: 0.8 });
    addCylinder(group, 0.012, 0.012, 4.8, 4, stringMat, 0.5, 3.05, 4.65, { rotation: [0, 0, Math.PI / 2] });
    for (let i = 0; i < 4; i++) {
      const l = createLantern({ scale: 0.42 });
      l.position.set(-1.0 + i * 1.15, 2.68, 4.65);
      group.add(l);
      data.sway.push({ object: l, axis: 'z', amplitude: 0.04, speed: 1.1 + i * 0.12, phase: i });
    }
  }

  if (style === 'us') {
    const bench = createBench();
    bench.position.set(-5.65, 0.17, 4.35);
    bench.rotation.y = 0.12;
    group.add(bench);

    const hydrant = createFireHydrant();
    hydrant.position.set(5.65, 0.17, 4.7);
    group.add(hydrant);

    const news = createNewsBox();
    news.position.set(4.55, 0.17, 4.55);
    news.rotation.y = -0.2;
    group.add(news);

    const aframe = createAframeSign();
    aframe.position.set(-1.55, 0.09, 4.85);
    aframe.rotation.y = -0.4;
    group.add(aframe);

    const planter = createPlanterBox({ width: 1.4, color: '#5a4537' });
    planter.position.set(1.4, 0.17, 4.25);
    group.add(planter);

    // street tree
    const trunk = addCylinder(group, 0.09, 0.13, 1.8, 9, material('street-tree-trunk', { color: '#5a4537', roughness: 0.95 }), -7.6, 1.05, 4.9);
    const crownMat = material('street-tree', { color: '#57784f', roughness: 0.95, flatShading: true });
    for (let i = 0; i < 5; i++) {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), crownMat);
      crown.position.set(-7.6 + Math.cos(i * 2.1) * 0.35, 2.1 + Math.sin(i * 1.3) * 0.28, 4.9 + Math.sin(i * 2.1) * 0.25);
      crown.castShadow = true;
      group.add(crown);
    }
    // bench cat
    const cat = createShopCat({ mat: false });
    cat.position.set(-5.8, 0.665, 4.31);
    cat.scale.setScalar(0.8);
    cat.rotation.y = 1.1;
    group.add(cat);
  }

  // shared sidewalk props
  const bollardL = createBollard();
  bollardL.position.set(-4.4, 0.2, 7.3);
  group.add(bollardL);
  const bollardR = createBollard();
  bollardR.position.set(4.9, 0.2, 7.3);
  group.add(bollardR);

  const trash = addCylinder(group, 0.24, 0.2, 0.7, 12, material('trash', { color: style === 'cn' ? '#5c4f40' : '#56625e', roughness: 0.6, metalness: 0.2 }), 3.9, 0.55, 3.85);
  addCylinder(group, 0.25, 0.25, 0.05, 12, material('trash-lid', { color: '#2e3936', roughness: 0.5, metalness: 0.3 }), 3.9, 0.92, 3.85);

  // little sidewalk deliveries / crates
  const crateMat = material('crate', { color: style === 'cn' ? '#8a5d3c' : '#b39d75', roughness: 0.85 });
  for (let i = 0; i < 3; i++) {
    addBox(group, 0.48, 0.22, 0.36, crateMat, -7.4, 0.3 + i * 0.23, 3.55, { castShadow: true });
  }

  // background
  buildBackground(data, rand);
}

function buildBackground(data, rand) {
  const { group, style } = data;
  const bg = new THREE.Group();
  group.add(bg);

  function gableRoof(parent, width, depth, rise, mat, x, y, z) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, rise);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
    geometry.translate(0, 0, -depth / 2);
    const roof = new THREE.Mesh(geometry, mat);
    roof.position.set(x, y, z);
    parent.add(roof);
    return roof;
  }

  function warmWindow(parent, mat, width, height, x, y, z, frameMat = null, rotationY = 0) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    win.position.set(x, y, z);
    win.rotation.y = rotationY;
    parent.add(win);
    if (frameMat) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, height + 0.14, 0.06), frameMat);
      frame.position.set(x, y, z - 0.035);
      frame.rotation.y = rotationY;
      parent.add(frame);
    }
    return win;
  }

  if (style === 'jp') {
    const bodyMat = material('jp-bg-house', { color: '#54534c', roughness: 0.98 });
    const trimMat = material('jp-bg-trim', { color: '#343936', roughness: 0.95 });
    const roofMat = material('jp-bg-roof', { color: '#262f2e', roughness: 0.96 });
    const windowFrame = material('jp-bg-window-frame', { color: '#2c302c', roughness: 0.9 });

    for (let i = 0; i < 5; i++) {
      const w = randRange(rand, 4.4, 6.2);
      const d = randRange(rand, 4.2, 5.2);
      const h = randRange(rand, 2.4, 3.35);
      const x = -16 + i * 7.6;
      const z = -31.5 - randRange(rand, 0, 2.0);
      addBox(bg, w, h, d, bodyMat, x, h / 2, z, { castShadow: false });
      addBox(bg, w + 0.08, 0.16, d + 0.08, trimMat, x, h - 0.08, z, { castShadow: false });
      addBox(bg, w * 0.94, 0.07, d * 0.94, trimMat, x, 1.15, z, { castShadow: false });
      gableRoof(bg, w + 0.5, d + 0.55, randRange(rand, 0.7, 1.05), roofMat, x, h, z);
      const winMat = new THREE.MeshStandardMaterial({ color: '#b79665', emissive: '#ffc477', emissiveIntensity: 0.24, roughness: 0.7 });
      const count = i % 2 === 0 ? 2 : 3;
      for (let n = 0; n < count; n++) {
        warmWindow(bg, winMat, 0.78, 0.58, x - w * 0.28 + n * (w * 0.28), h * 0.58, z + d / 2 + 0.015, windowFrame);
      }
      data.windowMats.push(winMat);
      if (i < 3) {
        const pipe = addCylinder(bg, 0.035, 0.035, h, 5, trimMat, x + w / 2 - 0.18, h / 2, z + d / 2 + 0.08, { castShadow: false });
      }
    }

    // One taller apartment block, kept dark and distant so it reads as a skyline.
    const tall = addBox(bg, 4.0, 5.4, 4.0, material('jp-bg-apartment', { color: '#414542', roughness: 0.98 }), 12.2, 2.7, -35.5, { castShadow: false });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const winMat = new THREE.MeshStandardMaterial({ color: '#a88c63', emissive: '#ffbc6f', emissiveIntensity: 0.16, roughness: 0.8 });
        warmWindow(bg, winMat, 0.52, 0.38, 10.8 + col * 1.3, 1.4 + row * 1.35, -33.48, null);
        data.windowMats.push(winMat);
      }
    }
    addBox(bg, 4.4, 0.18, 4.4, trimMat, 12.2, 5.48, -35.5, { castShadow: false });

    const pole = createPowerPole();
    pole.position.set(-8.4, 0, 1.6);
    bg.add(pole);
    bg.add(createCable([
      [-8.3, 6.65, 1.6],
      [-3.0, 6.3, 0.5],
      [2.0, 6.45, 0.2],
      [8.5, 6.15, -1.0],
      [13.0, 6.4, -1.8]
    ]));
    bg.add(createCable([
      [-8.3, 7.05, 1.7],
      [-2.0, 6.7, 0.8],
      [4.5, 6.8, 0.5],
      [10.5, 6.55, -0.6]
    ]));
    const backTree = createBushCluster({ radius: 1.25, color: '#334c3a' });
    backTree.position.set(-12.4, 0.1, -12.8);
    backTree.scale.set(1.2, 1.4, 1.2);
    bg.add(backTree);
  }

  if (style === 'cn') {
    const wallMat = material('cn-bg-wall', { color: '#514e46', roughness: 0.98 });
    const roofMat = material('cn-bg-roof', { color: '#293a34', roughness: 0.9 });
    const trimMat = material('cn-bg-trim', { color: '#392f28', roughness: 0.95 });
    const windowFrame = material('cn-bg-window-frame', { color: '#302820', roughness: 0.92 });
    for (let i = 0; i < 5; i++) {
      const w = randRange(rand, 4.6, 6.4);
      const d = randRange(rand, 4.4, 5.2);
      const h = randRange(rand, 2.5, 3.4);
      const x = -16 + i * 7.6;
      const z = -31 - randRange(rand, 0, 2);
      addBox(bg, w, h, d, wallMat, x, h / 2, z, { castShadow: false });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), roofMat);
      const roofHeight = randRange(rand, 1.0, 1.35);
      roof.scale.set((w + 0.8) / 2, roofHeight, (d + 0.8) / 2);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, h + roofHeight * 0.5, z);
      bg.add(roof);
      const winMat = new THREE.MeshStandardMaterial({ color: '#b28e5e', emissive: '#ffb96b', emissiveIntensity: 0.24, roughness: 0.72 });
      warmWindow(bg, winMat, 0.8, 0.56, x - 0.65, h * 0.56, z + d / 2 + 0.015, windowFrame);
      warmWindow(bg, winMat, 0.8, 0.56, x + 0.65, h * 0.56, z + d / 2 + 0.015, windowFrame);
      data.windowMats.push(winMat);
      if (i % 2 === 0) {
        for (let n = 0; n < 2; n++) {
          const lantern = createLantern({ scale: 0.3 });
          lantern.position.set(x - w * 0.32 + n * w * 0.64, h - 0.15, z + d / 2 + 0.32);
          bg.add(lantern);
        }
      }
    }
    addBox(bg, 8, 2.0, 0.3, material('cn-garden-wall', { color: '#56544c', roughness: 0.98 }), -10.5, 1.0, 3.3, { castShadow: false });
    const moongate = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.18, 10, 32), material('moongate', { color: '#4b4c46', roughness: 0.98 }));
    moongate.position.set(-11.8, 1.15, 3.5);
    bg.add(moongate);
    const backBamboo = createBambooPlanter();
    backBamboo.position.set(11.4, 0.1, -11.5);
    backBamboo.scale.setScalar(1.8);
    bg.add(backBamboo);
  }

  if (style === 'us') {
    const brick = new THREE.MeshStandardMaterial({ map: brickTexture({ repeat: [2.2, 2] }), color: '#95857a', roughness: 0.97 });
    const trim = material('brownstone-trim', { color: '#6f5e4a', roughness: 0.92 });
    for (let i = 0; i < 4; i++) {
      const w = randRange(rand, 4.3, 5.2);
      const h = randRange(rand, 5.0, 6.6);
      const x = -17 + i * 8.8;
      const z = -32 - randRange(rand, 0, 1.4);
      addBox(bg, w, h, 5, brick, x, h / 2, z, { castShadow: false });
      addBox(bg, w + 0.4, 0.34, 5.4, trim, x, h + 0.17, z, { castShadow: false });
      addBox(bg, w + 0.25, 0.12, 5.2, trim, x, h - 0.05, z, { castShadow: false });
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const winMat = new THREE.MeshStandardMaterial({ color: '#bda06f', emissive: '#ffc477', emissiveIntensity: 0.28, roughness: 0.7 });
          warmWindow(bg, winMat, 0.68, 1.05, x - 1.45 + col * 1.45, 1.75 + row * 2.35, z + 2.515, trim);
          data.windowMats.push(winMat);
        }
      }
      addBox(bg, 1.5, 0.8, 1.2, trim, x + 1.0, 0.4, z + 2.8, { castShadow: false });
      if (i === 1) {
        for (let floor = 0; floor < 2; floor++) {
          addBox(bg, 3.2, 0.06, 0.06, trim, x, 2.3 + floor * 2.35, z + 2.7, { castShadow: false });
          addBox(bg, 0.06, 2.0, 0.06, trim, x - 1.5, 1.4 + floor * 2.35, z + 2.7, { castShadow: false });
          addBox(bg, 0.06, 2.0, 0.06, trim, x + 1.5, 1.4 + floor * 2.35, z + 2.7, { castShadow: false });
        }
      }
    }
  }

  bg.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = false;
      obj.receiveShadow = false;
    }
  });
}

function buildCity(data) {
  const { group, style } = data;
  const city = new THREE.Group();
  city.name = 'city-density';
  group.add(city);
  const rand = mulberry32(style === 'jp' ? 701 : style === 'cn' ? 907 : 1103);

  const tint = style === 'cn' ? '#c4b6a2' : style === 'us' ? '#c8b7ac' : '#c5bbac';
  const cityTextures = [
    makeCityFacadeTexture(0, 17),
    makeCityFacadeTexture(1, 43),
    makeCityFacadeTexture(2, 79)
  ];
  const nearMats = cityTextures.map((texture) => new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: '#ffd7a0',
    emissiveIntensity: 0.6,
    color: tint,
    roughness: 0.92,
    metalness: 0.02
  }));
  const midMat = new THREE.MeshStandardMaterial({
    map: cityTextures[1],
    emissiveMap: cityTextures[1],
    emissive: '#dfd1b7',
    emissiveIntensity: 0.5,
    color: '#98a49e',
    roughness: 0.96
  });
  const farMat = new THREE.MeshStandardMaterial({
    map: cityTextures[2],
    emissiveMap: cityTextures[2],
    emissive: '#c9d5d7',
    emissiveIntensity: 0.55,
    color: '#8d9c96',
    roughness: 1
  });
  const glassMat = new THREE.MeshStandardMaterial({
    map: cityTextures[1],
    emissiveMap: cityTextures[1],
    emissive: '#b8d9df',
    emissiveIntensity: 0.55,
    color: '#a1b8ba',
    roughness: 0.52,
    metalness: 0.18
  });
  for (const mat of [...nearMats, midMat, farMat, glassMat]) data.windowMats.push(mat);

  const roofMat = material('city-roof', { color: style === 'cn' ? '#34443f' : style === 'us' ? '#443a32' : '#363f3d', roughness: 0.96 });
  const roofTrim = material('city-roof-trim', { color: style === 'cn' ? '#545b51' : style === 'us' ? '#645b4d' : '#565b55', roughness: 0.9 });
  const darkMat = material('city-base', { color: '#171d1e', roughness: 1 });
  const metal = material('city-metal', { color: '#343f3e', roughness: 0.6, metalness: 0.35 });

  addBox(city, 270, 0.14, 270, material('city-ground', { color: '#303735', roughness: 1 }), 0, -0.07, 0, { castShadow: false, receiveShadow: false });
  const southWalk = new THREE.MeshStandardMaterial({ map: stoneTexture({ repeat: [9, 2], base: '#88877e' }), roughness: 0.95 });
  southWalk.map.anisotropy = 16;
  addBox(city, 80, 0.16, 10.0, southWalk, 1, 0.08, 28.2, { castShadow: false });
  addBox(city, 80, 0.18, 0.28, material('city-curb', { color: '#a69e8f', roughness: 0.9 }), 1, 0.14, 23.28, { castShadow: false });

  const shopTexture = makeShopWindowTexture(true);
  const shopMat = new THREE.MeshStandardMaterial({
    map: shopTexture,
    emissiveMap: shopTexture,
    emissive: '#ffd19a',
    emissiveIntensity: 0.6,
    roughness: 0.55
  });
  data.windowMats.push(shopMat);
  const awningMat = material('city-awning', {
    color: style === 'cn' ? '#7b3a2d' : style === 'us' ? '#2e5848' : '#9b4c38',
    roughness: 0.78
  });
  const signLabels = style === 'cn' ? ['茶', '酒', '24H'] : style === 'us' ? ['CAFE', 'BAR', 'OPEN'] : ['CAFE', 'HOTEL', '24H'];
  const citySignMats = signLabels.map((label, i) => new THREE.MeshBasicMaterial({
    map: neonTexture(label, {
      color: i === 0 ? '#ffb45e' : i === 1 ? '#86d6d0' : '#ff7357',
      glow: i === 0 ? '#ff8d2e' : i === 1 ? '#49b8b4' : '#ff321c',
      width: 512,
      height: 256,
      font: style === 'cn' && label.length === 1
        ? '900 156px "STKaiti", "KaiTi", serif'
        : 'italic 900 112px Georgia, serif'
    }),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  for (const mat of citySignMats) data.signMats.push(mat);

  function shopFront(x, z, w, d) {
    const axisX = Math.abs(x) > Math.abs(z);
    const fx = axisX ? -Math.sign(x) : 0;
    const fz = axisX ? 0 : -Math.sign(z);
    const faceW = axisX ? d : w;
    const px = x + fx * (w / 2 + 0.035);
    const pz = z + fz * (d / 2 + 0.035);
    const rotY = fx > 0 ? Math.PI / 2 : fx < 0 ? -Math.PI / 2 : fz > 0 ? 0 : Math.PI;
    const shop = new THREE.Mesh(new THREE.PlaneGeometry(faceW * 0.68, 1.18), shopMat);
    shop.position.set(px, 1.35, pz);
    shop.rotation.y = rotY;
    city.add(shop);
    if (axisX) {
      addBox(city, 0.45, 0.08, faceW * 0.76, awningMat, x + fx * (w / 2 + 0.2), 2.05, z, { castShadow: false });
    } else {
      addBox(city, faceW * 0.76, 0.08, 0.45, awningMat, x, 2.05, z + fz * (d / 2 + 0.2), { castShadow: false });
    }
    if (rand() < 0.72) {
      const label = citySignMats[Math.floor(rand() * citySignMats.length)];
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(faceW * 0.46, 0.32), label);
      sign.position.set(px + fx * 0.02, 2.55, pz + fz * 0.02);
      sign.rotation.y = rotY;
      city.add(sign);
    }
  }

  function addBuilding({ x, z, w, d, h, tier = 0, shop = false, glass = false }) {
    const facade = glass
      ? glassMat
      : tier === 2
        ? farMat
        : tier === 1
          ? midMat
          : nearMats[Math.floor(rand() * nearMats.length)];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      [facade, facade, roofMat, darkMat, facade, facade]
    );
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    city.add(mesh);

    let roofY = h;
    if (tier >= 1 && rand() < 0.28) {
      const upperH = h * randRange(rand, 0.18, 0.3);
      const upperW = w * randRange(rand, 0.58, 0.76);
      const upperD = d * randRange(rand, 0.58, 0.76);
      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(upperW, upperH, upperD),
        [facade, facade, roofMat, darkMat, facade, facade]
      );
      upper.position.set(x + randRange(rand, -w * 0.08, w * 0.08), h + upperH / 2, z);
      upper.castShadow = false;
      upper.receiveShadow = false;
      city.add(upper);
      roofY = h + upperH;
    }

    if (tier < 2) {
      addBox(city, w + 0.16, 0.13, d + 0.16, roofTrim, x, roofY + 0.065, z, { castShadow: false });
      if (rand() < 0.52) {
        const tankX = x + randRange(rand, -w * 0.2, w * 0.2);
        const tankZ = z + randRange(rand, -d * 0.2, d * 0.2);
        addCylinder(city, 0.36, 0.4, 0.85, 9, metal, tankX, roofY + 0.55, tankZ, { castShadow: false });
        for (let l = 0; l < 3; l++) {
          addCylinder(city, 0.025, 0.025, 0.28, 5, metal, tankX - 0.22 + l * 0.22, roofY + 0.2, tankZ, { castShadow: false });
        }
      } else if (rand() < 0.5) {
        addBox(city, 0.7, 0.36, 0.55, metal, x + w * 0.16, roofY + 0.28, z - d * 0.1, { castShadow: false });
      }
      if (rand() < 0.48) {
        addCylinder(city, 0.018, 0.018, randRange(rand, 1.2, 3.2), 5, metal, x - w * 0.24, roofY + 1.0, z + d * 0.16, { castShadow: false });
        addBox(city, 0.7, 0.025, 0.025, metal, x - w * 0.24, roofY + 1.75, z + d * 0.16, { castShadow: false });
      }
    }
    if (roofY > 9 && rand() < 0.3) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshBasicMaterial({ color: '#ff5c4e' }));
      beacon.position.set(x + w * 0.2, roofY + 0.35, z);
      city.add(beacon);
    }
    if (shop && tier === 0) shopFront(x, z, w, d);
  }

  function rowX(z, from, to, step, { tier, shopChance = 0, minH, maxH }) {
    for (let x = from; x <= to; x += step) {
      if (rand() < 0.12) continue;
      const w = randRange(rand, tier === 2 ? 8 : 6.2, tier === 2 ? 13 : 9.2);
      const d = randRange(rand, tier === 2 ? 7 : 5.2, tier === 2 ? 10 : 7.8);
      addBuilding({
        x: x + randRange(rand, -1.2, 1.2),
        z: z + randRange(rand, -1.2, 1.2),
        w,
        d,
        h: randRange(rand, minH, maxH),
        tier,
        shop: rand() < shopChance,
        glass: tier >= 1 && rand() < 0.3
      });
    }
  }

  function rowZ(x, from, to, step, { tier, shopChance = 0, minH, maxH }) {
    for (let z = from; z <= to; z += step) {
      if (rand() < 0.14) continue;
      const w = randRange(rand, tier === 2 ? 8 : 6.2, tier === 2 ? 13 : 9.2);
      const d = randRange(rand, tier === 2 ? 7 : 5.2, tier === 2 ? 10 : 7.8);
      addBuilding({
        x: x + randRange(rand, -1.2, 1.2),
        z: z + randRange(rand, -1.2, 1.2),
        w,
        d,
        h: randRange(rand, minH, maxH),
        tier,
        shop: rand() < shopChance,
        glass: tier >= 1 && rand() < 0.3
      });
    }
  }

  // Layer 1: shopfront blocks just outside the diorama.
  rowX(-40, -54, 54, 11, { tier: 0, shopChance: 0.64, minH: 3.2, maxH: 5.4 });
  rowX(34, -50, 50, 10.4, { tier: 0, shopChance: 0.64, minH: 4, maxH: 7 });
  rowZ(44, -18, 18, 10.4, { tier: 0, shopChance: 0.4, minH: 4, maxH: 7.2 });
  rowZ(-44, -18, 18, 10.4, { tier: 0, shopChance: 0.4, minH: 4, maxH: 7.2 });

  // Layer 2: apartments and offices.
  rowX(-54, -64, 64, 13.5, { tier: 1, minH: 5.5, maxH: 10.5 });
  rowX(50, -62, 62, 13.5, { tier: 1, minH: 6, maxH: 11.5 });
  rowZ(58, -32, 32, 13.5, { tier: 1, minH: 6, maxH: 12 });
  rowZ(-58, -32, 32, 13.5, { tier: 1, minH: 6, maxH: 12 });

  // Layer 3: the distant skyline, tall enough to close the horizon.
  rowX(-72, -80, 80, 17, { tier: 2, minH: 8, maxH: 16 });
  rowX(68, -80, 80, 17, { tier: 2, minH: 8, maxH: 16 });
  rowZ(76, -48, 48, 17, { tier: 2, minH: 8, maxH: 17 });
  rowZ(-76, -48, 48, 17, { tier: 2, minH: 8, maxH: 17 });

  // A full ring of silhouettes guarantees no empty horizon when orbiting.
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + randRange(rand, -0.04, 0.04);
    const radius = randRange(rand, 104, 118);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const w = randRange(rand, 9, 16);
    const h = randRange(rand, 9, 19);
    addBuilding({ x, z, w, d: randRange(rand, 8, 14), h, tier: 2 });
  }

  // Street trees and lamps across the road.
  const trunkMat = material('city-trunk', { color: '#49382d', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#647d60', emissive: '#1d2a1e', emissiveIntensity: 0.22, roughness: 0.98, flatShading: true });
  for (const x of [-36, -25, -13, 1, 14, 28, 39]) {
    const z = 27.2;
    const h = randRange(rand, 2.1, 3.4);
    addCylinder(city, 0.08, 0.12, h, 7, trunkMat, x, 0.16 + h / 2, z, { castShadow: false });
    for (let n = 0; n < 3; n++) {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(randRange(rand, 0.45, 0.72), 0), leafMat);
      leaf.position.set(x + randRange(rand, -0.5, 0.5), 0.16 + h + randRange(rand, 0.1, 0.8), z + randRange(rand, -0.4, 0.4));
      leaf.castShadow = false;
      city.add(leaf);
    }
  }
  const lampMetal = material('city-lamp', { color: '#273331', roughness: 0.5, metalness: 0.5 });
  const lampGlow = new THREE.MeshStandardMaterial({ color: '#ffe7b5', emissive: '#ffc374', emissiveIntensity: 2.2, roughness: 0.35 });
  for (const x of [-31, -7, 17, 37]) {
    addCylinder(city, 0.045, 0.08, 3.8, 8, lampMetal, x, 1.9, 27.1, { castShadow: false });
    addBox(city, 0.08, 0.08, 0.7, lampMetal, x, 3.72, 26.8, { castShadow: false });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), lampGlow);
    lamp.position.set(x, 3.64, 26.5);
    city.add(lamp);
  }

  // One or two simple cars give the road a human scale.
  function addCar(x, z, color, rotY) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.86), material('car-body', { color, roughness: 0.35, metalness: 0.35 }));
    body.position.y = 0.4;
    car.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.38, 0.72), material('car-cabin', { color: '#202b2c', roughness: 0.25, metalness: 0.15 }));
    cabin.position.set(-0.1, 0.77, 0);
    car.add(cabin);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.74), new THREE.MeshStandardMaterial({ color: '#9cb7b7', roughness: 0.15, metalness: 0.1 }));
    glass.position.set(-0.1, 0.82, 0);
    car.add(glass);
    const wheelMat = material('car-wheel', { color: '#111616', roughness: 0.9 });
    for (const wx of [-0.62, 0.62]) {
      for (const wz of [-0.44, 0.44]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 10), wheelMat);
        wheel.position.set(wx, 0.24, wz);
        wheel.rotation.x = Math.PI / 2;
        car.add(wheel);
      }
    }
    const headMat = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffe3a1', emissiveIntensity: 2.4, roughness: 0.3 });
    for (const wz of [-0.28, 0.28]) {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.14), headMat);
      head.position.set(0.94, 0.46, wz);
      car.add(head);
    }
    car.position.set(x, 0.065, z);
    car.rotation.y = rotY;
    car.traverse((obj) => { obj.castShadow = false; obj.receiveShadow = false; });
    city.add(car);
  }
  addCar(-17, 13.1, '#3f5e68', 0);
  addCar(19, 18.4, '#7b3a35', Math.PI);
  addCar(3.2, 20.3, '#c8b08b', 0);
}

function buildSideLanes(data) {
  const { group, style } = data;
  const pathBase = style === 'cn' ? '#9f9484' : style === 'us' ? '#9b9489' : '#a3a094';
  const curbMat = material('lane-curb', { color: style === 'cn' ? '#9b8b79' : '#b4ada1', roughness: 0.9 });
  const tactile = material('lane-tactile', { color: '#d6b64b', roughness: 0.7 });

  // Far pavement apron joins the road to the existing city sidewalk without a
  // grass verge or dark strip; the crossing has flat tactile landings.
  const farWalkMat = new THREE.MeshStandardMaterial({
    map: (() => { const t = stoneTexture({ repeat: [14, 1], base: pathBase }); t.anisotropy = 16; return t; })(),
    roughness: 0.95
  });
  addBox(group, 60, 0.16, 1.75, farWalkMat, 0, 0.1, 22.55, { castShadow: false });
  addBox(group, 60, 0.12, 0.18, curbMat, 0, 0.06, 21.78, { castShadow: false });
  addBox(group, 4.3, 0.018, 0.18, tactile, 2.44, 0.19, 8.58, { castShadow: false });
  addBox(group, 4.3, 0.018, 0.18, tactile, 2.44, 0.19, 22.05, { castShadow: false });
}

function buildBackstage(data) {
  const { group, style } = data;
  const palette = style === 'cn'
    ? { door: '#74382c', metal: '#66665b', bin: '#46634d', accent: '#b8864b' }
    : style === 'us'
      ? { door: '#29483c', metal: '#47514c', bin: '#335243', accent: '#c59a58' }
      : { door: '#536b74', metal: '#747a74', bin: '#3d5f6d', accent: '#c44933' };

  const asphalt = new THREE.MeshStandardMaterial({
    map: stoneTexture({ repeat: [7, 4], base: '#858278' }),
    color: style === 'cn' ? '#8f8b80' : '#918d82',
    roughness: 0.95
  });
  addBox(group, 14.2, 0.16, 9.2, asphalt, 0, 0.02, -1.8, { castShadow: false });

  const doorMat = material('back-door', { color: palette.door, roughness: 0.62, metalness: 0.2 });
  const metal = material('back-metal', { color: palette.metal, roughness: 0.55, metalness: 0.35 });
  const dark = material('back-dark', { color: '#313936', roughness: 0.6, metalness: 0.25 });
  addBox(group, 1.18, 2.08, 0.08, doorMat, 1.75, 1.04, -3.33);
  addBox(group, 0.08, 0.08, 0.3, metal, 2.18, 1.05, -3.4);
  addBox(group, 1.45, 0.09, 0.52, metal, 1.75, 2.22, -3.47);
  addBox(group, 0.08, 0.42, 0.08, metal, 2.38, 2.02, -3.35);
  const staffSign = addSign(group, signTexture({
    width: 640, height: 160, bg: style === 'cn' ? '#efe1c2' : '#e8e2d4',
    fg: '#29322f', accent: style === 'cn' ? '#a23a2c' : '#b94532',
    title: style === 'cn' ? '员工通道' : 'STAFF ONLY',
    subtitle: 'STAFF ONLY',
    titleFont: style === 'cn' ? '900 62px "STKaiti", "KaiTi", serif' : '800 60px Georgia, serif',
    subtitleFont: '600 20px Georgia, serif'
  }), 0.82, 0.2, 1.75, 2.56, -3.39, { emissive: 0.15, rotation: [0, Math.PI, 0] });
  data.signMats.push(staffSign.mat);

  for (const [x, y, z, w, h, d] of [[-2.55, 1.15, -3.54, 0.82, 0.55, 0.48], [-3.55, 1.15, -3.54, 0.82, 0.55, 0.48], [2.7, 4.02, -1.7, 1.0, 0.7, 0.75]]) {
    addBox(group, w, h, d, metal, x, y, z);
    for (let i = 0; i < 4; i++) {
      addBox(group, w * 0.82, 0.035, 0.02, dark, x, y - 0.16 + i * 0.1, z - d / 2 - 0.012, { castShadow: false });
    }
    const fan = new THREE.Mesh(new THREE.TorusGeometry(w * 0.22, 0.025, 6, 18), dark);
    fan.position.set(x - w * 0.2, y + 0.1, z - d / 2 - 0.02);
    fan.rotation.y = Math.PI;
    group.add(fan);
  }

  addCylinder(group, 0.045, 0.045, 3.2, 8, metal, -4.55, 1.65, -3.35);
  addBox(group, 0.5, 0.62, 0.2, metal, -4.28, 2.15, -3.38);
  addBox(group, 0.36, 0.2, 0.02, dark, -4.28, 2.24, -3.49, { castShadow: false });

  addBox(group, 1.55, 0.96, 0.92, material('dumpster', { color: palette.bin, roughness: 0.72, metalness: 0.18 }), 4.25, 0.53, -4.18);
  addBox(group, 1.62, 0.08, 0.98, metal, 4.25, 1.04, -4.22, { rotation: [0.08, 0, 0] });
  for (const x of [3.72, 4.78]) {
    for (const z of [-4.48, -3.88]) {
      addCylinder(group, 0.08, 0.08, 0.12, 8, dark, x, 0.12, z, { rotation: [Math.PI / 2, 0, 0] });
    }
  }
  addBox(group, 0.42, 0.3, 0.38, material('back-crate', { color: '#8f7658', roughness: 0.9 }), 3.4, 0.25, -3.75);
  addBox(group, 0.38, 0.22, 0.32, material('back-crate2', { color: '#a48b68', roughness: 0.9 }), 3.4, 0.52, -3.78, { rotation: [0, 0.2, 0] });

  // Delivery van in the service bay: separate cab, cargo box, glazing,
  // wheel arches, door hardware and rear lamps instead of one white block.
  const van = new THREE.Group();
  const vanBody = material('van-body', { color: '#d9d2c0', roughness: 0.48, metalness: 0.18 });
  const vanCabMat = material('van-cab', { color: '#e2dccb', roughness: 0.44, metalness: 0.2 });
  const vanAccent = material('van-accent', { color: '#2f5a4f', roughness: 0.55 });
  const vanTrim = material('van-trim', { color: '#2a3331', roughness: 0.55, metalness: 0.35 });
  const vanGlassMat = new THREE.MeshStandardMaterial({ color: '#506d70', roughness: 0.15, metalness: 0.25 });
  const vanTire = material('van-wheel', { color: '#151a1a', roughness: 0.92 });
  const vanHub = material('van-hub', { color: '#9a9c92', roughness: 0.45, metalness: 0.65 });
  const vanLight = new THREE.MeshStandardMaterial({ color: '#fff2c6', emissive: '#ffd58c', emissiveIntensity: 1.8, roughness: 0.3 });
  const vanTail = new THREE.MeshStandardMaterial({ color: '#ff6045', emissive: '#ff2a14', emissiveIntensity: 1.4, roughness: 0.35 });

  addBox(van, 3.45, 0.16, 1.08, vanTrim, -2.8, 0.34, 0);
  addBox(van, 2.35, 1.0, 1.24, vanBody, -3.42, 0.9, 0);
  addBox(van, 1.1, 0.86, 1.18, vanCabMat, -1.78, 0.75, 0);
  addBox(van, 0.52, 0.5, 1.1, vanCabMat, -1.08, 0.55, 0);
  addBox(van, 2.38, 0.1, 1.2, vanCabMat, -3.42, 1.36, 0);
  addBox(van, 1.12, 0.08, 1.16, vanAccent, -1.78, 1.17, 0);

  // Side glazing, cargo door seam, stripe and MART decal.
  addBox(van, 0.72, 0.36, 0.035, vanGlassMat, -1.82, 0.92, -0.632);
  addBox(van, 0.72, 0.36, 0.035, vanGlassMat, -1.82, 0.92, 0.632);
  addBox(van, 2.9, 0.085, 0.025, vanAccent, -3.45, 0.68, -0.632);
  addBox(van, 0.025, 0.86, 0.025, vanTrim, -3.02, 0.88, -0.637);
  addBox(van, 0.025, 0.86, 0.025, vanTrim, -3.94, 0.88, -0.637);
  addBox(van, 0.12, 0.035, 0.03, vanHub, -3.18, 0.8, -0.65);
  addBox(van, 0.12, 0.035, 0.03, vanHub, -4.08, 0.8, -0.65);
  const decalTex = signTexture({
    width: 512, height: 160, bg: '#e5decc', fg: '#2b3d36', accent: '#2f5a4f',
    title: 'MART', subtitle: 'DELIVERY  ·  24H',
    titleFont: '900 84px Georgia, serif', subtitleFont: '600 20px Georgia, serif'
  });
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), new THREE.MeshStandardMaterial({ map: decalTex, roughness: 0.55, metalness: 0.05 }));
  decal.position.set(-3.45, 0.94, -0.644);
  decal.rotation.y = Math.PI;
  van.add(decal);

  // Side mirrors and cab handles.
  for (const z of [-0.68, 0.68]) {
    addBox(van, 0.06, 0.06, 0.22, vanTrim, -1.52, 1.12, z);
    addBox(van, 0.12, 0.16, 0.045, vanTrim, -1.48, 1.09, z + Math.sign(z) * 0.1);
    addBox(van, 0.12, 0.035, 0.03, vanHub, -1.7, 0.8, z);
  }

  // Wheels, hubs, arches and mud flaps.
  for (const wx of [-4.12, -2.12]) {
    for (const wz of [-0.64, 0.64]) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 14), vanTire);
      tire.position.set(wx, 0.24, wz);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      van.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.17, 10), vanHub);
      hub.position.set(wx, 0.24, wz);
      hub.rotation.x = Math.PI / 2;
      van.add(hub);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.028, 6, 18, Math.PI), vanTrim);
      arch.position.set(wx, 0.28, wz + Math.sign(wz) * 0.005);
      van.add(arch);
    }
    addBox(van, 0.08, 0.24, 0.06, vanTrim, wx - 0.28, 0.15, -0.7);
  }

  // Front end: grille, bumper, headlamps and plate.
  addBox(van, 0.06, 0.18, 0.72, vanTrim, -0.99, 0.48, 0);
  for (let i = 0; i < 4; i++) {
    addBox(van, 0.02, 0.025, 0.62, vanHub, -0.96, 0.41 + i * 0.045, 0, { castShadow: false });
  }
  addBox(van, 0.08, 0.14, 1.16, vanTrim, -0.94, 0.28, 0);
  for (const z of [-0.42, 0.42]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.22), vanLight);
    head.position.set(-0.97, 0.65, z);
    van.add(head);
  }
  addBox(van, 0.02, 0.13, 0.26, vanTrim, -1.0, 0.4, 0, { castShadow: false });

  // Rear doors, bumper, lamps and plate.
  addBox(van, 0.05, 1.0, 0.56, vanBody, -4.62, 0.9, -0.31);
  addBox(van, 0.05, 1.0, 0.56, vanBody, -4.62, 0.9, 0.31);
  addBox(van, 0.025, 0.92, 0.025, vanTrim, -4.65, 0.9, 0);
  for (const z of [-0.18, 0.18]) {
    addBox(van, 0.045, 0.04, 0.12, vanHub, -4.66, 0.78, z);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.16), vanTail);
    tail.position.set(-4.65, 0.5, z * 1.9);
    van.add(tail);
  }
  addBox(van, 0.09, 0.18, 1.2, vanTrim, -4.62, 0.3, 0);
  addBox(van, 0.02, 0.12, 0.28, vanHub, -4.64, 0.36, 0, { castShadow: false });

  // Roof vent and rails.
  addBox(van, 0.4, 0.08, 0.36, vanTrim, -3.5, 1.43, 0);
  addBox(van, 2.2, 0.035, 0.035, vanTrim, -3.45, 1.45, -0.45);
  addBox(van, 2.2, 0.035, 0.035, vanTrim, -3.45, 1.45, 0.45);

  van.position.set(0.2, 0.1, -4.9);
  van.rotation.y = -0.08;
  van.traverse((obj) => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
  group.add(van);

  const lampMat = new THREE.MeshStandardMaterial({ color: '#ffe4b1', emissive: '#ffc477', emissiveIntensity: 0.8, roughness: 0.4 });
  addBox(group, 0.24, 0.1, 0.24, dark, 1.75, 2.92, -3.45);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), lampMat);
  bulb.position.set(1.75, 2.85, -3.52);
  group.add(bulb);
  const backLight = new THREE.PointLight('#ffc17a', 0.6, 3.4, 2);
  backLight.position.set(1.75, 2.7, -3.7);
  group.add(backLight);
  data.exteriorLights.push({ light: backLight, day: 0.05, night: 1.2, dusk: 0.5 });
  const apronLight = new THREE.PointLight('#ffd3a0', 1.2, 9, 2);
  apronLight.position.set(-0.4, 3.4, -5.8);
  group.add(apronLight);
  data.exteriorLights.push({ light: apronLight, day: 0.08, night: 2.8, dusk: 1.4 });

  const rearPool = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 5.6),
    new THREE.MeshBasicMaterial({
      map: softCircleTexture({ inner: 'rgba(255,194,130,0.45)', outer: 'rgba(255,194,130,0)' }),
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  rearPool.rotation.x = -Math.PI / 2;
  rearPool.position.set(-0.3, 0.112, -5.1);
  rearPool.renderOrder = 1;
  group.add(rearPool);
  data.rearPool = rearPool;

  // Service wall seams and conduit keep the rear facade from reading as a blank slab.
  addBox(group, 9.1, 0.035, 0.03, dark, 0, 1.55, -3.305, { castShadow: false });
  addBox(group, 9.1, 0.025, 0.03, dark, 0, 2.7, -3.305, { castShadow: false });
  addBox(group, 0.025, 3.2, 0.03, dark, -0.4, 1.85, -3.305, { castShadow: false });
  addCylinder(group, 0.022, 0.022, 2.7, 5, metal, 0.7, 2.1, -3.36);

  const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.5), new THREE.MeshStandardMaterial({
    color: '#d5b780', emissive: '#ffc477', emissiveIntensity: 0.3, roughness: 0.7
  }));
  rearWindow.position.set(-1.25, 2.62, -3.31);
  rearWindow.rotation.y = Math.PI;
  group.add(rearWindow);
  data.windowMats.push(rearWindow.material);
  addBox(group, 1.02, 0.07, 0.06, dark, -1.25, 2.32, -3.3, { castShadow: false });
}

function buildSnowCaps(data) {
  const { group, style } = data;
  const snowMat = new THREE.MeshStandardMaterial({
    color: '#f7fbff',
    roughness: 0.85,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  data.snowMat = snowMat;
  const caps = [
    [9.7, 0.025, 0.5, 0, 4.86, FRONT_Z + 0.62],
    [9.6, 0.025, 0.32, 0, 4.69, FRONT_Z + 0.16],
    [2.0, 0.02, 0.32, 5.53, 0.44, 4.35],
    [1.4, 0.02, 0.3, -1.55, 0.45, 4.5],
    [0.65, 0.02, 0.28, 4.9, 1.48, 4.75]
  ];
  if (style === 'us') caps[0][5] = FRONT_Z + 1.1;
  if (style === 'cn') {
    caps[0][4] = 5.92;
    caps[0][5] = FRONT_Z + 0.55;
    caps.push([10.8, 0.03, 1.45, 0, 5.92, FRONT_Z + 0.9]);
  } else if (style === 'jp') {
    caps.push([10.2, 0.03, 0.85, 0, 4.82, FRONT_Z + 0.55]);
  } else {
    caps.push([6.3, 0.03, 0.9, -1.32, 3.54, FRONT_Z + 0.68]);
  }
  // Roof blanket.
  caps.push([9.55, 0.03, 5.85, 0, 3.78, -0.1]);
  for (const [w, h, d, x, y, z] of caps) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), snowMat);
    cap.position.set(x, y, z);
    cap.castShadow = false;
    cap.receiveShadow = false;
    group.add(cap);
  }

  // Snow-covered sidewalk and road. These planes are only visible when the
  // weather system raises the shared snow material's opacity.
  const sidewalkSnow = new THREE.Mesh(new THREE.PlaneGeometry(24.8, 5.55), snowMat);
  sidewalkSnow.rotation.x = -Math.PI / 2;
  sidewalkSnow.position.set(0, 0.198, 5.9);
  sidewalkSnow.renderOrder = 1;
  group.add(sidewalkSnow);
  const roadSnow = new THREE.Mesh(new THREE.PlaneGeometry(40, 12.7), snowMat);
  roadSnow.rotation.x = -Math.PI / 2;
  roadSnow.position.set(0, 0.085, 15.3);
  roadSnow.renderOrder = 1;
  group.add(roadSnow);
  const backSnow = new THREE.Mesh(new THREE.PlaneGeometry(14.1, 9.1), snowMat);
  backSnow.rotation.x = -Math.PI / 2;
  backSnow.position.set(0, 0.105, -1.8);
  backSnow.renderOrder = 1;
  group.add(backSnow);
  const vergeSnow = new THREE.Mesh(new THREE.PlaneGeometry(59, 1.15), snowMat);
  vergeSnow.rotation.x = -Math.PI / 2;
  vergeSnow.position.set(0, 0.198, 22.45);
  vergeSnow.renderOrder = 1;
  group.add(vergeSnow);

  // Soft drifts along the curb and storefront.
  for (let i = 0; i < 9; i++) {
    const drift = new THREE.Mesh(new THREE.SphereGeometry(randRange(mulberry32(9 + i), 0.25, 0.55), 8, 5), snowMat);
    drift.scale.set(randRange(mulberry32(i + 2), 1.0, 2.2), 0.18, randRange(mulberry32(i + 5), 0.6, 1.1));
    drift.position.set(-10 + i * 2.4, 0.2, 8.55 + randRange(mulberry32(i + 7), -0.1, 0.1));
    drift.castShadow = false;
    group.add(drift);
  }
}

export function buildStore(style) {
  const group = new THREE.Group();
  group.name = `store-${style}`;
  const data = {
    style,
    group,
    signMats: [],
    windowMats: [],
    interiorLights: [],
    exteriorLights: [],
    steam: [],
    sway: [],
    petals: [],
    snowMat: null
  };
  buildShell(data);
  buildFrontStyle(data);
  buildInterior(data);
  buildStreetscape(data);
  buildBackstage(data);
  buildSideLanes(data);
  buildCity(data);
  buildSnowCaps(data);
  data.bounds = new THREE.Box3(new THREE.Vector3(-8.5, 0, -4), new THREE.Vector3(8.5, 6, 9));
  return data;
}

export function disposeStore(store) {
  disposeObject(store.group);
}
