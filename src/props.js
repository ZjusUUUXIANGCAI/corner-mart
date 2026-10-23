import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  addPlane,
  mulberry32,
  randRange,
  pick,
  material,
  canvasTexture,
  makeCanvas,
  fillRoundRect
} from './util.js';
import {
  woodTexture,
  checkerTileTexture,
  roofTileTexture,
  awningTexture,
  awningValanceTexture,
  chalkboardTexture,
  menuBoardTexture,
  softCircleTexture,
  petalTexture,
  streetSignTexture,
  windowDecalTexture
} from './textures.js';

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function cylinderBetween(start, end, radius, mat, segments = 8) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function signPlane(texture, width, height, matOpts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.52,
    metalness: 0.04,
    ...matOpts
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.castShadow = false;
  return mesh;
}

export function createShelf({ width = 4.32, height = 1.95, depth = 0.55, kind = 'jp', seed = 10 } = {}) {
  const group = new THREE.Group();
  const rand = mulberry32(seed);
  const frameColor = kind === 'cn' ? '#5c3f2e' : kind === 'us' ? '#293c35' : '#b7b1a4';
  const shelfMat = material('shelf-frame', { color: frameColor, roughness: 0.76, metalness: 0.06 });
  const shelfTopMat = material('shelf-top', { color: kind === 'cn' ? '#906d48' : '#c7bfae', roughness: 0.68 });
  const backMat = material('shelf-back', { color: kind === 'jp' ? '#a9a599' : kind === 'cn' ? '#60432f' : '#384c42', roughness: 0.94 });
  addBox(group, width, height, 0.06, backMat, 0, height / 2, -depth / 2 + 0.03);
  addBox(group, 0.08, height, depth, shelfMat, -width / 2 + 0.04, height / 2, 0);
  addBox(group, 0.08, height, depth, shelfMat, width / 2 - 0.04, height / 2, 0);
  addBox(group, width, 0.11, depth + 0.04, shelfMat, 0, 0.055, 0);

  const levels = 4;
  const palette = kind === 'cn'
    ? ['#c0392b', '#d4a53a', '#f1e5cd', '#3c6e5b', '#7d5a44', '#d86f45', '#f5efe2']
    : kind === 'us'
      ? ['#c44b3d', '#e2b04a', '#325d4e', '#f0e6d2', '#426a8a', '#d97846', '#8e4f3a']
      : ['#d94b3a', '#f2c94c', '#3f7ea8', '#f6efe1', '#5c9e75', '#e6814f', '#bf5c86'];
  const productGeo = new THREE.BoxGeometry(1, 1, 1);
  const productMat = new THREE.MeshStandardMaterial({ roughness: 0.56, metalness: 0.02 });
  const items = [];

  for (let level = 0; level < levels; level++) {
    const y = 0.2 + level * 0.45;
    addBox(group, width - 0.18, 0.055, depth, shelfTopMat, 0, y - 0.08, 0);
    const stripMat = material('price-strip', { color: '#fbf7ec', roughness: 0.5 });
    addBox(group, width - 0.2, 0.055, 0.026, stripMat, 0, y - 0.045, depth / 2 + 0.016, { castShadow: false });

    let x = -width / 2 + 0.18;
    while (x < width / 2 - 0.18) {
      const gap = randRange(rand, 0.025, 0.08);
      const w = randRange(rand, 0.11, 0.2);
      const h = randRange(rand, 0.22, 0.34);
      const d = depth * randRange(rand, 0.55, 0.82);
      const color = pick(rand, palette);
      items.push({
        x: x + w / 2,
        y: y + 0.04 + h / 2,
        z: randRange(rand, -0.02, 0.07),
        w,
        h,
        d,
        color
      });
      if (rand() < 0.34) {
        items.push({
          x: x + w / 2,
          y: y + 0.04 + h + 0.07,
          z: randRange(rand, -0.02, 0.03),
          w: w * 0.75,
          h: 0.14,
          d: d * 0.8,
          color: pick(rand, palette)
        });
      }
      x += w + gap;
    }
  }

  const instanced = new THREE.InstancedMesh(productGeo, productMat, items.length);
  instanced.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  items.forEach((item, index) => {
    dummy.position.set(item.x, item.y, item.z);
    dummy.scale.set(item.w, item.h, item.d);
    dummy.updateMatrix();
    instanced.setMatrixAt(index, dummy.matrix);
    instanced.setColorAt(index, color.set(item.color));
  });
  instanced.instanceColor.needsUpdate = true;
  instanced.castShadow = false;
  instanced.receiveShadow = true;
  group.add(instanced);

  // little promotional cards clipped to shelf edge
  for (let i = 0; i < 3; i++) {
    const cardMat = material('shelf-card', { color: pick(rand, ['#d84b3d', '#f1c14a', '#335f50']), roughness: 0.55 });
    addBox(group, randRange(rand, 0.18, 0.3), 0.16, 0.018, cardMat, randRange(rand, -width * 0.36, width * 0.36), 0.44 + i * 0.45, depth / 2 + 0.07, { castShadow: false });
  }

  return group;
}

export function createFridge({ width = 2.1, height = 2.25, depth = 0.72, kind = 'jp' } = {}) {
  const group = new THREE.Group();
  const rand = mulberry32(26);
  const bodyMat = material('fridge-body', { color: kind === 'cn' ? '#d8cdb7' : '#e9e5da', roughness: 0.35, metalness: 0.3 });
  const frameMat = material('fridge-frame', { color: '#4c5553', roughness: 0.4, metalness: 0.55 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: '#dff5ff',
    emissive: '#bdeaff',
    emissiveIntensity: 1.4,
    roughness: 0.4
  });
  addBox(group, width, height, depth, bodyMat, 0, height / 2, 0);
  addBox(group, width - 0.16, height - 0.2, depth, material('fridge-inner', { color: '#dce8e9', roughness: 0.9 }), 0, height / 2, 0.02);
  addBox(group, width - 0.28, height - 0.34, 0.04, glowMat, 0, height / 2, -depth / 2 + 0.12, { castShadow: false });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#d8f3ff',
    transparent: true,
    opacity: 0.22,
    roughness: 0.03,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.5
  });
  addBox(group, width - 0.18, height - 0.24, 0.025, glassMat, 0, height / 2, depth / 2 + 0.015, { castShadow: false });
  for (let i = 0; i <= 3; i++) {
    addBox(group, 0.035, height - 0.24, 0.05, frameMat, -width / 2 + 0.12 + i * ((width - 0.24) / 3), height / 2, depth / 2 + 0.03, { castShadow: false });
  }
  addBox(group, width - 0.2, 0.04, 0.05, frameMat, 0, 1.34, depth / 2 + 0.035, { castShadow: false });
  addBox(group, 0.035, 0.5, 0.04, frameMat, -0.18, 1.12, depth / 2 + 0.065, { castShadow: false });

  const canGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10);
  const canMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.4 });
  const cans = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 16; col++) {
      cans.push({
        x: -width / 2 + 0.24 + col * ((width - 0.48) / 15),
        y: 0.32 + row * 0.47,
        z: 0.04 + randRange(rand, -0.03, 0.03),
        color: pick(rand, ['#cf4b38', '#e9b743', '#3f799c', '#eae1c9', '#4d8d67', '#d27e46'])
      });
    }
  }
  const instanced = new THREE.InstancedMesh(canGeo, canMat, cans.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  cans.forEach((can, index) => {
    dummy.position.set(can.x, can.y, can.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    instanced.setMatrixAt(index, dummy.matrix);
    instanced.setColorAt(index, color.set(can.color));
  });
  instanced.instanceColor.needsUpdate = true;
  instanced.castShadow = false;
  group.add(instanced);

  const handle = addCylinder(group, 0.018, 0.018, 0.42, 8, frameMat, -width / 2 + 0.15, 1.22, depth / 2 + 0.11, { rotation: [0, 0, 0] });
  handle.castShadow = false;
  group.userData.glowMat = glowMat;
  return group;
}

export function createCounter({ kind = 'jp' } = {}) {
  const group = new THREE.Group();
  const trimColor = kind === 'cn' ? '#9e342a' : kind === 'us' ? '#294b3f' : '#b64533';
  const baseMat = material('counter-base', { color: kind === 'cn' ? '#5f422f' : kind === 'us' ? '#29352f' : '#c3bbaa', roughness: 0.62 });
  const topMat = material('counter-top', { color: kind === 'cn' ? '#a47f51' : '#dcd3c2', roughness: 0.42 });
  const trimMat = material('counter-trim', { color: trimColor, roughness: 0.45 });
  addBox(group, 1.9, 0.9, 0.72, baseMat, 0, 0.48, 0);
  addBox(group, 1.98, 0.08, 0.8, topMat, 0, 0.96, 0);
  addBox(group, 1.9, 0.055, 0.03, trimMat, 0, 0.82, 0.374, { castShadow: false });
  addBox(group, 1.9, 0.025, 0.03, trimMat, 0, 0.2, 0.374, { castShadow: false });

  const register = addBox(group, 0.42, 0.24, 0.32, material('register', { color: '#2b3334', roughness: 0.35, metalness: 0.35 }), -0.36, 1.12, 0.03);
  const screenMat = new THREE.MeshStandardMaterial({ color: '#bfe9e4', emissive: '#75d3c4', emissiveIntensity: 1.1, roughness: 0.4 });
  addBox(group, 0.29, 0.19, 0.02, screenMat, -0.36, 1.24, 0.2);
  addBox(group, 0.25, 0.04, 0.18, material('keypad', { color: '#d6d0c2', roughness: 0.5 }), -0.36, 1.14, -0.14);
  addBox(group, 0.11, 0.18, 0.13, material('scanner', { color: '#4f5d5c', roughness: 0.3, metalness: 0.5 }), -0.02, 1.11, 0.03);
  addCylinder(group, 0.02, 0.02, 0.18, 8, material('reader', { color: '#263230', roughness: 0.3 }), 0.18, 1.08, 0.12);
  addBox(group, 0.12, 0.07, 0.02, screenMat, 0.18, 1.15, 0.18);

  // hot food warmer
  const warmerBase = material('warmer', { color: '#4a4a45', roughness: 0.4, metalness: 0.35 });
  addBox(group, 0.62, 0.08, 0.38, warmerBase, 0.58, 1.03, 0.08);
  addBox(group, 0.54, 0.28, 0.32, material('warmer-inner', { color: '#d58a3d', roughness: 0.4, emissive: '#a34b11', emissiveIntensity: 0.4 }), 0.58, 1.21, 0.08);
  addBox(group, 0.58, 0.03, 0.35, new THREE.MeshStandardMaterial({ color: '#f6d6a0', transparent: true, opacity: 0.45, roughness: 0.1 }), 0.58, 1.4, 0.08, { castShadow: false });
  for (let i = 0; i < 3; i++) {
    addCylinder(group, 0.04, 0.045, 0.18, 8, material('snack', { color: i === 0 ? '#d9a653' : '#b76f31', roughness: 0.7 }), 0.44 + i * 0.14, 1.19, 0.08);
  }

  // coffee machine
  addBox(group, 0.3, 0.38, 0.3, material('coffee', { color: '#303b3b', roughness: 0.32, metalness: 0.4 }), 0.27, 1.22, -0.2);
  addBox(group, 0.22, 0.14, 0.02, screenMat, 0.27, 1.34, -0.05);
  addCylinder(group, 0.035, 0.035, 0.08, 10, material('portafilter', { color: '#9e9a8c', roughness: 0.3, metalness: 0.6 }), 0.27, 1.08, -0.04);
  addCylinder(group, 0.06, 0.05, 0.11, 12, material('cup', { color: '#f7f2e7', roughness: 0.45 }), 0.27, 1.03, -0.04);

  // small card stand + plant
  const cardTexture = streetSignTexture(kind === 'cn' ? '今日推荐' : kind === 'jp' ? '本日のおすすめ' : 'TODAY', trimColor);
  const card = signPlane(cardTexture, 0.34, 0.11, { transparent: false });
  card.position.set(-0.62, 1.07, 0.34);
  card.rotation.x = -0.1;
  group.add(card);
  createSmallPlant(group, 0.78, 1.0, 0.22, kind === 'cn' ? '#4b7353' : '#4d6d4a');

  group.userData.screenMat = screenMat;
  return group;
}

export function createSmallPlant(parent, x, y, scale = 1, leafColor = '#4b7353') {
  const potMat = material('pot', { color: '#b56a48', roughness: 0.8 });
  const pot = addCylinder(parent, 0.11 * scale, 0.08 * scale, 0.16 * scale, 10, potMat, x, y + 0.08 * scale, 0);
  pot.castShadow = true;
  const leafMat = material('leaf', { color: leafColor, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09 * scale, 6, 4), leafMat);
    leaf.scale.set(0.55, 1.4, 0.35);
    leaf.position.set(x + Math.cos(a) * 0.06 * scale, y + 0.24 * scale + Math.sin(i) * 0.03, Math.sin(a) * 0.06 * scale);
    leaf.rotation.z = Math.cos(a) * 0.55;
    leaf.rotation.x = Math.sin(a) * 0.4;
    leaf.castShadow = true;
    parent.add(leaf);
  }
}

export function createShopCat() {
  const group = new THREE.Group();
  const fur = material('cat-fur', { color: '#d99a5c', roughness: 0.88 });
  const cream = material('cat-cream', { color: '#f0dcc0', roughness: 0.9 });
  const dark = material('cat-dark', { color: '#3d3028', roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 12), fur);
  body.scale.set(1.25, 0.62, 0.78);
  body.position.y = 0.16;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), fur);
  head.position.set(0.27, 0.2, -0.08);
  head.scale.set(1, 0.95, 1);
  head.castShadow = true;
  group.add(head);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), cream);
  muzzle.position.set(0.38, 0.16, -0.08);
  muzzle.scale.set(1.2, 0.9, 1);
  group.add(muzzle);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 4), fur);
    ear.position.set(0.24, 0.33, -0.08 + side * 0.075);
    ear.rotation.z = -0.2;
    ear.rotation.x = side * 0.12;
    group.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), dark);
    eye.position.set(0.355, 0.23, -0.08 + side * 0.05);
    group.add(eye);
  }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 16, Math.PI * 1.5), fur);
  tail.position.set(-0.2, 0.14, 0.03);
  tail.rotation.x = Math.PI / 2;
  tail.rotation.z = 0.3;
  tail.castShadow = true;
  group.add(tail);
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.18 + i * 0.026, 0.02, 5, 12, Math.PI * 0.9), dark);
    stripe.position.set(0.02 + i * 0.1, 0.24, -0.05);
    stripe.rotation.x = Math.PI / 2;
    stripe.rotation.z = 0.1;
    stripe.scale.set(0.8, 1, 1);
    group.add(stripe);
  }
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.035, 20), material('cat-mat', { color: '#384b47', roughness: 0.95 }));
  mat.position.y = 0.018;
  mat.receiveShadow = true;
  group.add(mat);
  return group;
}

export function createVendingMachine({ kind = 'jp' } = {}) {
  const group = new THREE.Group();
  const rand = mulberry32(51);
  const bodyColor = kind === 'jp' ? '#dc4b38' : kind === 'cn' ? '#b6382d' : '#2f5f6b';
  const bodyMat = material('vending-body', { color: bodyColor, roughness: 0.42, metalness: 0.18 });
  const cream = material('vending-cream', { color: '#f4eddc', roughness: 0.55 });
  addBox(group, 1.05, 1.9, 0.72, bodyMat, 0, 0.95, 0);
  addBox(group, 0.88, 0.95, 0.04, cream, 0, 1.2, 0.37);
  const glowMat = new THREE.MeshStandardMaterial({ color: '#eaf7ff', emissive: '#b9e8ff', emissiveIntensity: 0.8, roughness: 0.4 });
  addBox(group, 0.82, 0.86, 0.02, glowMat, 0, 1.2, 0.39, { castShadow: false });

  const canGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.14, 9);
  const canMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.35 });
  const cans = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      cans.push({
        x: -0.32 + col * 0.128,
        y: 0.95 + row * 0.22,
        z: 0.42,
        color: pick(rand, ['#ca4435', '#ecc44b', '#3b7c88', '#f3e8cc', '#5c9b60', '#7c5e95'])
      });
    }
  }
  const instanced = new THREE.InstancedMesh(canGeo, canMat, cans.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  cans.forEach((can, i) => {
    dummy.position.set(can.x, can.y, can.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
    instanced.setColorAt(i, color.set(can.color));
  });
  instanced.instanceColor.needsUpdate = true;
  group.add(instanced);

  addBox(group, 0.72, 0.22, 0.03, material('vending-panel', { color: '#283332', roughness: 0.4 }), 0, 0.55, 0.38);
  for (let i = 0; i < 4; i++) {
    addBox(group, 0.1, 0.035, 0.02, material('vending-btn', { color: i === 0 ? '#e9c14a' : '#d7d2c4', roughness: 0.5 }), -0.2 + i * 0.13, 0.55, 0.4, { castShadow: false });
  }
  addBox(group, 0.5, 0.16, 0.05, material('vending-slot', { color: '#1f2726', roughness: 0.6 }), 0, 0.18, 0.38);
  addBox(group, 0.2, 0.32, 0.03, glowMat, 0.36, 1.55, 0.39, { castShadow: false });
  const logoTexture = streetSignTexture(kind === 'jp' ? 'DRINKS' : kind === 'cn' ? '冷饮' : 'SODA', '#f4eddc');
  const logo = signPlane(logoTexture, 0.36, 0.11);
  logo.position.set(0.36, 1.55, 0.415);
  group.add(logo);
  group.userData.glowMat = glowMat;
  return group;
}

export function createBicycle({ color = '#5e7a66' } = {}) {
  const group = new THREE.Group();
  const frameMat = material('bike-frame', { color, roughness: 0.5, metalness: 0.3 });
  const tireMat = material('bike-tire', { color: '#252a29', roughness: 0.9 });
  const metalMat = material('bike-metal', { color: '#aaa89a', roughness: 0.3, metalness: 0.7 });
  const wheelPositions = [-0.62, 0.62];
  for (const x of wheelPositions) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.022, 8, 28), tireMat);
    tire.position.set(x, 0.33, 0);
    tire.castShadow = true;
    group.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.008, 5, 24), metalMat);
    rim.position.set(x, 0.33, 0.01);
    group.add(rim);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spoke = cylinderBetween(
        [x, 0.33, 0.01],
        [x + Math.cos(a) * 0.28, 0.33 + Math.sin(a) * 0.28, 0.01],
        0.004,
        metalMat,
        5
      );
      spoke.castShadow = false;
      group.add(spoke);
    }
  }
  const rear = [-0.62, 0.33, 0];
  const front = [0.62, 0.33, 0];
  const crank = [-0.08, 0.31, 0];
  const seat = [-0.28, 0.72, 0];
  const head = [0.36, 0.7, 0];
  group.add(cylinderBetween(rear, crank, 0.016, frameMat));
  group.add(cylinderBetween(crank, front, 0.016, frameMat));
  group.add(cylinderBetween(seat, crank, 0.016, frameMat));
  group.add(cylinderBetween(seat, head, 0.018, frameMat));
  group.add(cylinderBetween(head, front, 0.016, frameMat));
  group.add(cylinderBetween(rear, seat, 0.014, frameMat));
  addBox(group, 0.22, 0.05, 0.12, material('bike-seat', { color: '#3a2d26', roughness: 0.8 }), -0.3, 0.78, 0);
  const handle = cylinderBetween([0.34, 0.72, 0], [0.35, 0.88, 0.16], 0.012, metalMat);
  group.add(handle);
  group.add(cylinderBetween([0.35, 0.88, 0.16], [0.35, 0.88, -0.16], 0.012, metalMat));
  const basketMat = material('bike-basket', { color: '#b5a887', roughness: 0.75, wireframe: false });
  addBox(group, 0.28, 0.18, 0.25, basketMat, 0.54, 0.68, 0);
  group.rotation.y = -0.15;
  group.rotation.z = 0.055;
  return group;
}

export function createSakuraTree() {
  const group = new THREE.Group();
  const potMat = material('tree-pot', { color: '#8f6b51', roughness: 0.9 });
  addCylinder(group, 0.4, 0.32, 0.44, 12, potMat, 0, 0.22, 0);
  addCylinder(group, 0.38, 0.38, 0.04, 12, material('soil', { color: '#3b2e24', roughness: 1 }), 0, 0.43, 0);
  const bark = material('sakura-bark', { color: '#5a3d33', roughness: 0.95 });
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, 0),
    new THREE.Vector3(0.1, 1.1, 0),
    new THREE.Vector3(-0.1, 1.7, 0.02),
    new THREE.Vector3(0.05, 2.2, 0)
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 8, 0.09, 7, false), bark);
  trunk.castShadow = true;
  group.add(trunk);
  const branchData = [
    [[0.02, 1.45, 0], [-0.55, 2.0, 0.15], 0.05],
    [[0.05, 1.75, 0], [0.55, 2.25, -0.12], 0.045],
    [[-0.02, 1.9, 0], [-0.25, 2.55, -0.2], 0.04],
    [[0.1, 2.0, 0], [0.3, 2.7, 0.15], 0.035]
  ];
  const blossomSpots = [];
  for (const [start, end] of branchData) {
    const branch = cylinderBetween(start, end, 0.035, bark, 7);
    group.add(branch);
    for (let i = 0; i < 5; i++) {
      const t = 0.3 + i * 0.16;
      blossomSpots.push([
        start[0] + (end[0] - start[0]) * t + randRange(mulberry32(i + 3), -0.16, 0.16),
        start[1] + (end[1] - start[1]) * t + randRange(mulberry32(i + 7), -0.1, 0.2),
        start[2] + (end[2] - start[2]) * t + randRange(mulberry32(i + 11), -0.16, 0.16)
      ]);
    }
  }
  blossomSpots.push([0.06, 2.45, 0], [-0.06, 2.6, 0.1], [0.2, 2.4, -0.1]);
  const blossomGeo = new THREE.IcosahedronGeometry(0.13, 0);
  const blossomMat = new THREE.MeshStandardMaterial({ color: '#f7b8c9', roughness: 0.8, flatShading: true });
  const blossoms = new THREE.InstancedMesh(blossomGeo, blossomMat, blossomSpots.length * 3);
  const dummy = new THREE.Object3D();
  const rand = mulberry32(7);
  let index = 0;
  for (const spot of blossomSpots) {
    for (let i = 0; i < 3; i++) {
      dummy.position.set(spot[0] + randRange(rand, -0.18, 0.18), spot[1] + randRange(rand, -0.12, 0.15), spot[2] + randRange(rand, -0.18, 0.18));
      const scale = randRange(rand, 0.5, 1.1);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      dummy.updateMatrix();
      blossoms.setMatrixAt(index++, dummy.matrix);
    }
  }
  blossoms.castShadow = true;
  group.add(blossoms);
  const petalMat = new THREE.SpriteMaterial({ map: petalTexture(), transparent: true, depthWrite: false, opacity: 0.9 });
  const petals = [];
  for (let i = 0; i < 12; i++) {
    const sprite = new THREE.Sprite(petalMat);
    sprite.position.set(randRange(rand, -0.8, 0.8), randRange(rand, 0.6, 2.4), randRange(rand, -0.5, 0.5));
    sprite.scale.setScalar(randRange(rand, 0.05, 0.1));
    sprite.userData.speed = randRange(rand, 0.1, 0.3);
    sprite.userData.phase = rand() * 10;
    group.add(sprite);
    petals.push(sprite);
  }
  group.userData.petals = petals;
  return group;
}

export function createBambooPlanter() {
  const group = new THREE.Group();
  const pot = addCylinder(group, 0.38, 0.3, 0.5, 10, material('bamboo-pot', { color: '#756150', roughness: 0.9 }), 0, 0.25, 0);
  pot.castShadow = true;
  const stalkMat = material('bamboo', { color: '#7d9b64', roughness: 0.75 });
  const leafMat = material('bamboo-leaf', { color: '#52794e', roughness: 0.8, side: THREE.DoubleSide });
  const rand = mulberry32(19);
  for (let i = 0; i < 6; i++) {
    const x = randRange(rand, -0.2, 0.2);
    const z = randRange(rand, -0.18, 0.18);
    const h = randRange(rand, 1.4, 2.4);
    const stalk = addCylinder(group, 0.025, 0.035, h, 7, stalkMat, x, 0.5 + h / 2, z);
    stalk.rotation.z = randRange(rand, -0.06, 0.06);
    for (let n = 0; n < 5; n++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.07), leafMat);
      leaf.position.set(x + randRange(rand, -0.2, 0.2), 0.9 + n * (h / 6), z + randRange(rand, -0.16, 0.16));
      leaf.rotation.set(randRange(rand, -0.6, 0.6), randRange(rand, 0, Math.PI), randRange(rand, -0.5, 0.5));
      leaf.castShadow = true;
      group.add(leaf);
    }
  }
  return group;
}

export function createSteamerCart() {
  const group = new THREE.Group();
  const wood = material('cart-wood', { color: '#8a5d3f', roughness: 0.75 });
  addBox(group, 0.9, 0.08, 0.55, wood, 0, 0.82, 0);
  for (const x of [-0.36, 0.36]) {
    for (const z of [-0.2, 0.2]) {
      addBox(group, 0.06, 0.8, 0.06, wood, x, 0.42, z);
    }
  }
  addBox(group, 0.82, 0.05, 0.48, material('cart-shelf', { color: '#6d4a32', roughness: 0.8 }), 0, 0.28, 0);
  const wheelMat = material('cart-wheel', { color: '#4b3a2e', roughness: 0.85 });
  for (const x of [-0.38, 0.38]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 20), wheelMat);
    wheel.position.set(x, 0.2, 0.3);
    wheel.rotation.y = Math.PI / 2;
    group.add(wheel);
  }
  const metal = material('steamer-metal', { color: '#b4b0a2', roughness: 0.35, metalness: 0.65 });
  addCylinder(group, 0.32, 0.32, 0.26, 20, metal, 0, 0.99, 0);
  addCylinder(group, 0.29, 0.29, 0.04, 20, material('steamer-water', { color: '#7f9b92', roughness: 0.2, metalness: 0.1 }), 0, 1.13, 0);
  const bambooMat = material('bamboo-steamer', { color: '#c6a16b', roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    addCylinder(group, 0.28 - i * 0.008, 0.28 - i * 0.008, 0.09, 20, bambooMat, 0, 1.18 + i * 0.095, 0);
    addCylinder(group, 0.29 - i * 0.008, 0.29 - i * 0.008, 0.015, 20, material('steamer-rim', { color: '#9f7a49', roughness: 0.85 }), 0, 1.23 + i * 0.095, 0);
  }
  const bunMat = material('bun', { color: '#f1e4cc', roughness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), bunMat);
    bun.scale.y = 0.7;
    bun.position.set(-0.1 + i * 0.1, 1.38, 0.02);
    group.add(bun);
  }
  const steamMat = new THREE.SpriteMaterial({ map: softCircleTexture({ inner: 'rgba(255,255,255,0.32)', outer: 'rgba(255,255,255,0)' }), transparent: true, depthWrite: false, opacity: 0.4 });
  const steam = [];
  for (let i = 0; i < 6; i++) {
    const sprite = new THREE.Sprite(steamMat.clone());
    sprite.position.set(-0.1 + (i % 3) * 0.1, 1.45 + Math.floor(i / 3) * 0.2, 0.02);
    sprite.scale.setScalar(0.3);
    sprite.userData.phase = i * 1.7;
    group.add(sprite);
    steam.push(sprite);
  }
  group.userData.steam = steam;
  return group;
}

export function createStoneDrum() {
  const group = new THREE.Group();
  const stone = material('stone', { color: '#8b8b80', roughness: 0.95 });
  addCylinder(group, 0.28, 0.32, 0.16, 16, stone, 0, 0.08, 0);
  addCylinder(group, 0.32, 0.32, 0.08, 16, stone, 0, 0.2, 0);
  const drum = addCylinder(group, 0.26, 0.26, 0.5, 16, stone, 0, 0.5, 0, { rotation: [Math.PI / 2, 0, 0] });
  drum.rotation.x = Math.PI / 2;
  for (const z of [-0.17, 0.17]) {
    addCylinder(group, 0.2, 0.2, 0.04, 16, material('stone-ring', { color: '#6f7068', roughness: 0.9 }), 0, 0.5, z, { rotation: [Math.PI / 2, 0, 0] });
  }
  const ridge = material('stone-ridge', { color: '#77786d', roughness: 1 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bar = addBox(group, 0.035, 0.5, 0.03, ridge, Math.cos(a) * 0.27, 0.5, Math.sin(a) * 0.27, { castShadow: false });
    bar.rotation.y = a;
  }
  return group;
}

export function createBench() {
  const group = new THREE.Group();
  const wood = material('bench-wood', { color: '#8f5f3f', roughness: 0.75 });
  const iron = material('bench-iron', { color: '#313b39', roughness: 0.45, metalness: 0.55 });
  for (let i = 0; i < 3; i++) {
    addBox(group, 1.6, 0.06, 0.14, wood, 0, 0.46, -0.16 + i * 0.16);
  }
  for (let i = 0; i < 2; i++) {
    addBox(group, 1.6, 0.05, 0.13, wood, 0, 0.74 + i * 0.16, -0.23);
  }
  for (const x of [-0.65, 0.65]) {
    addBox(group, 0.07, 0.44, 0.07, iron, x, 0.23, 0.1);
    addBox(group, 0.07, 0.44, 0.07, iron, x, 0.23, -0.28);
    addBox(group, 0.08, 0.06, 0.5, iron, x, 0.43, -0.08);
    addBox(group, 0.06, 0.5, 0.06, iron, x, 0.68, -0.28);
  }
  return group;
}

export function createFireHydrant() {
  const group = new THREE.Group();
  const red = material('hydrant', { color: '#b83a2f', roughness: 0.6, metalness: 0.15 });
  const dark = material('hydrant-dark', { color: '#76261f', roughness: 0.65 });
  addCylinder(group, 0.16, 0.18, 0.08, 12, dark, 0, 0.04, 0);
  addCylinder(group, 0.13, 0.14, 0.58, 14, red, 0, 0.37, 0);
  addCylinder(group, 0.17, 0.15, 0.07, 14, dark, 0, 0.68, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), red);
  dome.position.y = 0.71;
  group.add(dome);
  addCylinder(group, 0.05, 0.05, 0.2, 8, dark, 0.18, 0.45, 0, { rotation: [0, 0, Math.PI / 2] });
  addCylinder(group, 0.05, 0.05, 0.2, 8, dark, -0.18, 0.45, 0, { rotation: [0, 0, Math.PI / 2] });
  addCylinder(group, 0.06, 0.06, 0.16, 8, red, 0, 0.5, 0.14, { rotation: [Math.PI / 2, 0, 0] });
  return group;
}

export function createNewsBox() {
  const group = new THREE.Group();
  const blue = material('newsbox', { color: '#2f5e75', roughness: 0.48, metalness: 0.25 });
  addBox(group, 0.55, 0.72, 0.45, blue, 0, 0.58, 0);
  addBox(group, 0.46, 0.36, 0.02, material('news-window', { color: '#d8e3df', roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.55 }), 0, 0.73, 0.23, { castShadow: false });
  addBox(group, 0.4, 0.23, 0.015, material('newspaper', { color: '#ece5d4', roughness: 0.8 }), 0, 0.7, 0.235, { castShadow: false });
  addBox(group, 0.22, 0.05, 0.25, material('news-slot', { color: '#26393b', roughness: 0.4 }), 0, 0.34, 0.1);
  for (const x of [-0.18, 0.18]) addBox(group, 0.05, 0.2, 0.05, material('news-leg', { color: '#384542', roughness: 0.4 }), x, 0.1, 0);
  return group;
}

export function createPostbox() {
  const group = new THREE.Group();
  const red = material('postbox-red', { color: '#c53b2b', roughness: 0.48, metalness: 0.18 });
  const dark = material('postbox-dark', { color: '#72251d', roughness: 0.55, metalness: 0.2 });
  const cream = material('postbox-plate', { color: '#efe4cd', roughness: 0.65 });
  addCylinder(group, 0.22, 0.25, 0.72, 16, red, 0, 0.5, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), red);
  dome.position.y = 0.86;
  dome.castShadow = true;
  group.add(dome);
  addCylinder(group, 0.25, 0.25, 0.06, 16, dark, 0, 0.12, 0);
  addCylinder(group, 0.07, 0.07, 0.1, 8, dark, 0, 1.07, 0);
  addBox(group, 0.26, 0.035, 0.035, dark, 0, 0.78, 0.235, { castShadow: false });
  addBox(group, 0.18, 0.06, 0.02, cream, 0, 0.63, 0.238, { castShadow: false });
  addBox(group, 0.06, 0.13, 0.06, dark, 0, 0.2, 0.13, { castShadow: true });
  addBox(group, 0.06, 0.13, 0.06, dark, 0, 0.2, -0.13, { castShadow: true });
  return group;
}

export function createStreetLamp() {
  const group = new THREE.Group();
  const metal = material('lamp-metal', { color: '#2b3735', roughness: 0.42, metalness: 0.6 });
  addCylinder(group, 0.15, 0.2, 0.28, 12, metal, 0, 0.14, 0);
  addCylinder(group, 0.075, 0.1, 4.7, 12, metal, 0, 2.48, 0);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.8, 0),
    new THREE.Vector3(0, 5.02, 0.12),
    new THREE.Vector3(0.1, 5.1, 0.45),
    new THREE.Vector3(0.28, 5.05, 0.72)
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.05, 8, false), metal);
  arm.castShadow = true;
  group.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.24, 12, 1, true), metal);
  shade.position.set(0.3, 4.98, 0.74);
  shade.rotation.x = Math.PI;
  group.add(shade);
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff0c7', emissive: '#ffd58a', emissiveIntensity: 2.4, roughness: 0.45 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 8), bulbMat);
  bulb.position.set(0.3, 4.89, 0.74);
  group.add(bulb);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softCircleTexture({ inner: 'rgba(255,214,154,0.55)', outer: 'rgba(255,214,154,0)' }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.set(0.3, 4.88, 0.74);
  glow.scale.setScalar(0.95);
  group.add(glow);
  const light = new THREE.PointLight('#ffd39b', 1.6, 7, 2);
  light.position.set(0.3, 4.8, 0.74);
  light.castShadow = false;
  group.add(light);
  group.userData.bulbMat = bulbMat;
  group.userData.light = light;
  group.userData.glow = glow;
  return group;
}

export function createAframeSign() {
  const group = new THREE.Group();
  const frameMat = material('chalk-frame', { color: '#6e4c35', roughness: 0.8 });
  const boardMat = new THREE.MeshStandardMaterial({
    map: chalkboardTexture(),
    roughness: 0.95,
    side: THREE.DoubleSide
  });
  const tilt = 0.24;
  for (const side of [-1, 1]) {
    // Tops meet under the cap; feet open outward into a real A shape.
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.04), boardMat);
    board.position.set(0, 0.55, side * 0.11);
    board.rotation.x = -side * tilt;
    board.castShadow = true;
    board.receiveShadow = true;
    group.add(board);
  }
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.045, 0.16), frameMat);
  frameTop.position.set(0, 1.035, 0);
  frameTop.castShadow = true;
  group.add(frameTop);
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.035, 0.05), frameMat);
    foot.position.set(0, 0.095, side * 0.215);
    foot.castShadow = true;
    group.add(foot);
  }
  return group;
}

export function createPowerPole() {
  const group = new THREE.Group();
  const woodMat = material('pole', { color: '#5b4d42', roughness: 0.95 });
  addCylinder(group, 0.11, 0.17, 7.2, 10, woodMat, 0, 3.6, 0);
  addBox(group, 2.1, 0.09, 0.12, woodMat, 0, 6.5, 0);
  addBox(group, 1.5, 0.07, 0.1, woodMat, 0, 6.95, 0);
  for (const x of [-0.85, 0, 0.85]) {
    addCylinder(group, 0.045, 0.055, 0.16, 7, material('insulator', { color: '#8f9a8f', roughness: 0.4 }), x, 6.64, 0);
  }
  for (const x of [-0.6, 0.6]) {
    addCylinder(group, 0.04, 0.05, 0.14, 7, material('insulator', { color: '#8f9a8f', roughness: 0.4 }), x, 7.06, 0);
  }
  addCylinder(group, 0.22, 0.22, 0.6, 12, material('transformer', { color: '#777a72', roughness: 0.75 }), 0, 5.7, 0.16);
  return group;
}

export function createCable(points, color = '#2d3330') {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geometry = new THREE.TubeGeometry(curve, 60, 0.018, 4, false);
  const mat = material('cable', { color, roughness: 0.8 });
  return new THREE.Mesh(geometry, mat);
}

export function createBushCluster({ radius = 0.5, color = '#496d4b' } = {}) {
  const group = new THREE.Group();
  const rand = mulberry32(43);
  const leafMat = material('bush', { color, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.IcosahedronGeometry(radius * randRange(rand, 0.45, 0.8), 0);
    const mesh = new THREE.Mesh(geo, leafMat);
    mesh.position.set(randRange(rand, -radius, radius), radius * randRange(rand, 0.35, 0.75), randRange(rand, -radius * 0.6, radius * 0.6));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

export function createPlanterBox({ width = 1.0, color = '#8b6c52' } = {}) {
  const group = new THREE.Group();
  addBox(group, width, 0.4, 0.5, material('planter', { color, roughness: 0.9 }), 0, 0.2, 0);
  addBox(group, width - 0.08, 0.05, 0.42, material('planter-soil', { color: '#3b2d23', roughness: 1 }), 0, 0.42, 0);
  group.add(createBushCluster({ radius: 0.35, color: '#4d7050' }));
  return group;
}

export function createAwning({ width = 4.8, colors = ['#1f4d3f', '#f1e5ca'], kind = 'us' } = {}) {
  const group = new THREE.Group();
  const canvasMat = new THREE.MeshStandardMaterial({ map: awningTexture({ colors }), roughness: 0.85, side: THREE.DoubleSide });
  const depth = 1.0;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 1, 1), canvasMat);
  plane.rotation.x = -Math.PI / 2 + 0.24;
  plane.position.set(0, 0, depth / 2);
  plane.castShadow = true;
  group.add(plane);
  const valanceMat = new THREE.MeshStandardMaterial({
    map: awningValanceTexture({ colors }),
    transparent: true,
    alphaTest: 0.2,
    side: THREE.DoubleSide,
    roughness: 0.9
  });
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.34), valanceMat);
  valance.position.set(0, -0.15, depth);
  valance.castShadow = true;
  group.add(valance);
  const sideMat = material('awning-side', { color: colors[0], roughness: 0.9, side: THREE.DoubleSide });
  for (const x of [-width / 2, width / 2]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(depth, -0.24);
    shape.lineTo(depth, 0.06);
    shape.lineTo(0, 0.3);
    shape.closePath();
    const side = new THREE.Mesh(new THREE.ShapeGeometry(shape), sideMat);
    side.rotation.y = Math.PI / 2;
    side.position.set(x, 0, 0);
    group.add(side);
  }
  return group;
}

export function createJapaneseEave({ width = 10.4, depth = 0.9, color = '#52605e' } = {}) {
  const group = new THREE.Group();
  const tileMat = new THREE.MeshStandardMaterial({ map: roofTileTexture({ repeat: [9, 1], base: color }), roughness: 0.72, metalness: 0.08 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, depth), tileMat);
  top.rotation.x = -0.18;
  top.position.set(0, 0, depth / 2);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  addCylinder(group, 0.06, 0.06, width, 8, material('gutter', { color: '#8a908a', roughness: 0.5, metalness: 0.4 }), 0, -0.22, depth, { rotation: [0, 0, Math.PI / 2] });
  const edge = material('eave-edge', { color: '#d8d3c4', roughness: 0.7 });
  addBox(group, width, 0.2, 0.08, edge, 0, -0.15, depth + 0.02);
  for (const x of [-width / 2 + 0.2, width / 2 - 0.2]) {
    addBox(group, 0.09, 0.5, 0.09, material('eave-bracket', { color: '#3d4b48', roughness: 0.7 }), x, -0.45, 0.2);
  }
  return group;
}

export function createChineseRoof({ width = 11.2, depth = 1.7 } = {}) {
  const group = new THREE.Group();
  const tileMat = new THREE.MeshStandardMaterial({ map: roofTileTexture({ repeat: [9, 2], base: '#3f5a4d' }), roughness: 0.58, metalness: 0.05 });
  const underside = material('roof-underside', { color: '#8b3c2f', roughness: 0.8 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), [tileMat, tileMat, tileMat, underside, tileMat, underside]);
  roof.rotation.x = -0.28;
  roof.position.set(0, 0, depth * 0.42);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.1, depth * 0.7), tileMat);
  lower.rotation.x = -0.35;
  lower.position.set(0, -0.25, depth * 0.82);
  lower.castShadow = true;
  group.add(lower);
  const ridgeMat = material('roof-ridge', { color: '#283d34', roughness: 0.6 });
  addCylinder(group, 0.09, 0.09, width + 0.4, 8, ridgeMat, 0, 0.38, -0.18, { rotation: [0, 0, Math.PI / 2] });
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 5), ridgeMat);
    tip.rotation.z = side * -1.05;
    tip.position.set(side * (width / 2 + 0.03), 0.34, -0.08);
    group.add(tip);
    const tip2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 5), ridgeMat);
    tip2.rotation.z = side * -1.1;
    tip2.position.set(side * (width / 2 + 0.18), 0.16, depth * 0.85);
    group.add(tip2);
    const ornament = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), material('roof-ornament', { color: '#c49b54', roughness: 0.4, metalness: 0.5 }));
    ornament.position.set(side * (width / 2 - 0.2), 0.5, -0.14);
    group.add(ornament);
  }
  addBox(group, width - 0.3, 0.16, 0.12, underside, 0, -0.3, depth * 0.97);
  return group;
}

export function createLantern({ color = '#d33a2c', glow = '#ff7e55', scale = 1 } = {}) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, emissive: glow, emissiveIntensity: 0.75, roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28 * scale, 18, 12), bodyMat);
  body.scale.y = 1.25;
  body.position.y = 0.4 * scale;
  body.castShadow = true;
  group.add(body);
  const gold = material('lantern-gold', { color: '#d8ab5f', roughness: 0.35, metalness: 0.45 });
  for (const y of [0.12, 0.68]) {
    addCylinder(group, 0.14 * scale, 0.16 * scale, 0.05, 12, gold, 0, y * scale, 0);
  }
  addCylinder(group, 0.012, 0.012, 0.4 * scale, 4, material('lantern-cord', { color: '#3d3027' }), 0, 0.95 * scale, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    addCylinder(group, 0.006, 0.006, 0.32, 3, material('lantern-tassel', { color: '#f1c46c' }), Math.cos(a) * 0.03, 0.03 * scale, Math.sin(a) * 0.03);
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softCircleTexture({ inner: 'rgba(255,139,95,0.45)', outer: 'rgba(255,139,95,0)' }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.y = 0.4 * scale;
  halo.scale.setScalar(1.5 * scale);
  group.add(halo);
  group.userData.bodyMat = bodyMat;
  return group;
}

export function createBollard() {
  const group = new THREE.Group();
  const mat = material('bollard', { color: '#c2b9a5', roughness: 0.75 });
  addCylinder(group, 0.09, 0.11, 0.75, 10, mat, 0, 0.375, 0);
  addCylinder(group, 0.12, 0.12, 0.05, 10, material('bollard-band', { color: '#a23a2e', roughness: 0.6 }), 0, 0.56, 0);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6), mat);
  top.position.y = 0.75;
  group.add(top);
  return group;
}

export function createWallMenu(kind) {
  const texture = menuBoardTexture(kind === 'cn' ? 'cn' : kind === 'jp' ? 'jp' : 'us');
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.18), mat);
  board.castShadow = false;
  return board;
}

export function createPosterStand(texture) {
  const group = new THREE.Group();
  const frame = material('poster-frame', { color: '#3e4d48', roughness: 0.6, metalness: 0.2 });
  addBox(group, 0.62, 0.86, 0.04, frame, 0, 0.7, 0);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.74), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.75 }));
  poster.position.set(0, 0.7, 0.03);
  group.add(poster);
  addBox(group, 0.06, 0.5, 0.06, frame, -0.2, 0.25, 0);
  addBox(group, 0.06, 0.5, 0.06, frame, 0.2, 0.25, 0);
  addBox(group, 0.5, 0.05, 0.28, frame, 0, 0.03, 0);
  return group;
}

export function createWindowPoster(kind) {
  const mat = new THREE.MeshBasicMaterial({ map: windowDecalTexture(kind), transparent: true, depthWrite: false, opacity: 0.9 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), mat);
  mesh.castShadow = false;
  return mesh;
}
