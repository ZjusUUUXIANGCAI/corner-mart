import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildStore, disposeStore, STYLES } from './store.js';
import { SkySystem } from './sky.js';
import { WeatherSystem } from './weather.js';
import { damp, mulberry32, randRange } from './util.js';
import { softCircleTexture } from './textures.js';
import { AmbientMusic } from './audio.js';

const STYLE_ORDER = ['jp', 'cn', 'us'];
const TIME_LABELS = { day: '白天', dusk: '黄昏', night: '夜晚' };
const WEATHER_LABELS = { clear: '晴', rain: '雨', snow: '雪', fog: '雾', storm: '雷雨' };

const sceneHost = document.querySelector('#scene');
const app = document.querySelector('#app');
const loader = document.querySelector('#loader');
const styleFlash = document.querySelector('#style-flash');
const lightningFlash = document.querySelector('#lightning-flash');
const statusText = document.querySelector('#status-text');
const styleIndex = document.querySelector('#style-index');
const styleEn = document.querySelector('#style-en');
const styleTitle = document.querySelector('#style-title');
const styleDesc = document.querySelector('#style-desc');
const timeLabel = document.querySelector('#time-label');
const weatherLabel = document.querySelector('#weather-label');
const autoButton = document.querySelector('#btn-auto');
const resetButton = document.querySelector('#btn-reset');
const fullButton = document.querySelector('#btn-full');
const musicButton = document.querySelector('#btn-music');
const styleButtons = [...document.querySelectorAll('[data-style]')];
const weatherButtons = [...document.querySelectorAll('[data-weather]')];
const timeButtons = [...document.querySelectorAll('[data-time]')];

let renderer;
let scene;
let camera;
let controls;
let composer;
let bloomPass;
let sky;
let weather;
let store = null;
let currentStyle = 'jp';
let currentWeather = 'clear';
let currentTime = 'dusk';
let transitioning = false;
let cameraTween = null;
let stage;
let dust;
let lastFrame = performance.now();
let elapsed = 0;
let ready = false;
let autoRotate = true;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio = new AmbientMusic();
const moveKeys = new Set();
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight']);

function hexToRgb(value) {
  const hex = value.replace('#', '');
  const number = parseInt(hex, 16);
  return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`;
}

function showFatal(message) {
  if (!loader) return;
  loader.innerHTML = `<div class="loader-mark">!</div><div class="loader-word">SCENE ERROR</div><p>${message}</p>`;
  loader.style.opacity = '1';
  loader.style.visibility = 'visible';
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
    stencil: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.25 : 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor('#0b1010', 1);
  sceneHost.appendChild(renderer.domElement);
}

const DEFAULT_TARGET = [0, 1.2, 1.2];

function getView() {
  const portrait = window.innerWidth / window.innerHeight < 0.82;
  return portrait
    ? { fov: 50, position: [15.6, 10.2, 27.5] }
    : { fov: 36, position: [11.2, 7.1, 25.5] };
}

function applyViewProjection() {
  if (!camera) return;
  const view = getView();
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
}

function initScene() {
  scene = new THREE.Scene();
  const initialView = getView();
  camera = new THREE.PerspectiveCamera(initialView.fov, window.innerWidth / window.innerHeight, 0.1, 180);
  camera.position.set(...initialView.position);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTarget = pmrem.fromScene(room, 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...DEFAULT_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.panSpeed = 0.9;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  controls.minDistance = 12;
  controls.maxDistance = 34;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = 1.52;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.32;
  controls.update();
  autoRotate = controls.autoRotate;
  autoButton.classList.toggle('is-on', autoRotate);
  autoButton.setAttribute('aria-pressed', String(autoRotate));

  sky = new SkySystem(scene, renderer);
  weather = new WeatherSystem(scene);

  // A quiet ground far beyond the diorama keeps the horizon from falling away.
  const farGround = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    new THREE.MeshStandardMaterial({ color: '#323a34', roughness: 1 })
  );
  farGround.rotation.x = -Math.PI / 2;
  farGround.position.y = -0.26;
  farGround.receiveShadow = true;
  scene.add(farGround);

  stage = new THREE.Group();
  scene.add(stage);

  createDust();

  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.25 : 1.6));
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.18, 0.48, 1.02);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  window.addEventListener('resize', onResize);
  setupUI();
  const params = new URLSearchParams(window.location.search);
  const initialStyle = STYLE_ORDER.includes(params.get('style')) ? params.get('style') : 'jp';
  const initialTime = TIME_LABELS[params.get('time')] ? params.get('time') : 'dusk';
  const initialWeather = WEATHER_LABELS[params.get('weather')] ? params.get('weather') : 'clear';
  applyStyle(initialStyle, true);
  applyTime(initialTime, true);
  applyWeather(initialWeather, true);
  const azimuthParam = params.get('az');
  const initialAzimuth = azimuthParam === null ? NaN : Number(azimuthParam);
  if (Number.isFinite(initialAzimuth)) {
    const view = getView();
    const radius = Math.hypot(view.position[0], view.position[2]);
    camera.position.set(Math.sin(initialAzimuth) * radius, view.position[1], Math.cos(initialAzimuth) * radius);
    controls.update();
  }
  updateStatus();
}

function createDust() {
  const count = 150;
  const positions = new Float32Array(count * 3);
  const rand = mulberry32(921);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = randRange(rand, -12, 12);
    positions[i * 3 + 1] = randRange(rand, 0.3, 6.2);
    positions[i * 3 + 2] = randRange(rand, -4, 13);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.userData.base = positions.slice();
  const mat = new THREE.PointsMaterial({
    map: softCircleTexture({ inner: 'rgba(255,241,205,0.9)', outer: 'rgba(255,241,205,0)' }),
    color: '#ffe0a4',
    size: 0.075,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  dust = new THREE.Points(geo, mat);
  dust.frustumCulled = false;
  scene.add(dust);
}

function setupUI() {
  for (const button of styleButtons) {
    button.addEventListener('click', () => applyStyle(button.dataset.style));
  }
  for (const button of weatherButtons) {
    button.addEventListener('click', () => applyWeather(button.dataset.weather));
  }
  for (const button of timeButtons) {
    button.addEventListener('click', () => applyTime(button.dataset.time));
  }
  if (musicButton) {
    if (!audio.supported) {
      musicButton.disabled = true;
      musicButton.title = '当前浏览器不支持背景音乐';
      musicButton.setAttribute('aria-label', '当前浏览器不支持背景音乐');
    } else {
      musicButton.addEventListener('click', async () => {
        const playing = await audio.toggle();
        musicButton.classList.toggle('is-on', playing);
        musicButton.setAttribute('aria-pressed', String(playing));
        const label = playing ? '关闭背景音乐' : '开启背景音乐';
        musicButton.title = label;
        musicButton.setAttribute('aria-label', label);
      });
    }
  }
  autoButton.addEventListener('click', () => {
    autoRotate = !autoRotate;
    controls.autoRotate = autoRotate;
    autoButton.classList.toggle('is-on', autoRotate);
    autoButton.setAttribute('aria-pressed', String(autoRotate));
  });
  resetButton.addEventListener('click', () => resetCamera());
  fullButton.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await app.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Browsers can refuse fullscreen outside of a direct gesture; the scene still works.
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullButton.classList.toggle('is-on', Boolean(document.fullscreenElement));
  });
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (MOVE_KEYS.has(event.code)) {
      moveKeys.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'Digit1') applyStyle('jp');
    if (event.code === 'Digit2') applyStyle('cn');
    if (event.code === 'Digit3') applyStyle('us');
    if (event.code === 'KeyR') resetCamera();
    if (event.code === 'KeyM') musicButton?.click();
  });
  window.addEventListener('keyup', (event) => {
    moveKeys.delete(event.code);
  });
  window.addEventListener('blur', () => moveKeys.clear());
}

function applyStyle(style, initial = false) {
  const meta = STYLES[style];
  if (!meta || (!initial && style === currentStyle)) return;
  currentStyle = style;
  audio.setStyle(style);

  const next = buildStore(style);
  if (store) {
    stage.remove(store.group);
    disposeStore(store);
  }
  next.group.scale.setScalar(initial ? 1 : 0.955);
  next.group.position.y = initial ? 0 : -0.12;
  stage.add(next.group);
  store = next;
  initializeStoreMood(store);

  const root = document.documentElement;
  root.style.setProperty('--accent', meta.accent);
  root.style.setProperty('--accent-2', meta.accent2);
  root.style.setProperty('--accent-rgb', hexToRgb(meta.accent));

  styleIndex.textContent = String(STYLE_ORDER.indexOf(style) + 1).padStart(2, '0');
  styleEn.textContent = meta.en;
  styleTitle.textContent = meta.title;
  styleDesc.textContent = meta.description;
  updateStatus();

  for (const button of styleButtons) {
    const active = button.dataset.style === style;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }

  if (!initial) {
    styleFlash.classList.remove('run');
    // Restart the CSS animation without keeping a timer around.
    void styleFlash.offsetWidth;
    styleFlash.classList.add('run');
    updateMood(0, true);
  }
  updateMood(0, true);
}

function initializeStoreMood(next) {
  for (const mat of next.signMats) {
    if (mat.isMeshBasicMaterial) {
      mat.userData.baseOpacity = mat.opacity;
    } else {
      mat.userData.baseEmissive = mat.emissiveIntensity;
    }
  }
  for (const mat of next.windowMats) {
    mat.userData.baseEmissive = mat.emissiveIntensity;
  }
  for (const light of next.interiorLights) {
    light.userData.baseIntensity = light.intensity;
  }
  for (const entry of next.sway) {
    entry.baseRotation = entry.object.rotation[entry.axis];
  }
  if (next.steam) {
    for (const sprite of next.steam) {
      sprite.userData.baseY = sprite.position.y;
    }
  }
  if (next.snowMat) {
    next.snowMat.transparent = true;
    next.snowMat.opacity = 0;
    next.snowMat.visible = false;
  }
}

function applyWeather(name, initial = false) {
  if (!WEATHER_LABELS[name]) return;
  currentWeather = name;
  weather.setWeather(name);
  sky.setWeather(name);
  updateStatus();
  for (const button of weatherButtons) {
    const active = button.dataset.weather === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (!initial) updateMood(0, true);
}

function applyTime(name, initial = false) {
  if (!TIME_LABELS[name]) return;
  currentTime = name;
  sky.setTime(name);
  updateStatus();
  for (const button of timeButtons) {
    const active = button.dataset.time === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (!initial) updateMood(0, true);
}

function updateStatus() {
  const meta = STYLES[currentStyle];
  statusText.textContent = `${meta.name} · ${TIME_LABELS[currentTime]} · ${WEATHER_LABELS[currentWeather]}`;
  timeLabel.textContent = TIME_LABELS[currentTime];
  weatherLabel.textContent = WEATHER_LABELS[currentWeather];
}

function updateMood(dt, instant = false) {
  if (!store) return;
  const night = sky.nightFactor;
  const raining = currentWeather === 'rain' || currentWeather === 'storm';
  const signTarget = 0.05 + night * 0.28 + (raining ? 0.05 : 0);
  const windowTarget = 0.3 + night * 0.55;

  for (const mat of store.signMats) {
    if (!mat) continue;
    if (mat.isMeshBasicMaterial) {
      const target = 0.56 + night * 0.44;
      mat.opacity = instant ? target : damp(mat.opacity, target, 2.2, dt);
    } else {
      const target = signTarget * (mat.userData.emissiveBoost || 1);
      mat.emissiveIntensity = instant ? target : damp(mat.emissiveIntensity, target, 2.2, dt);
    }
  }
  for (const mat of store.windowMats) {
    if (!mat) continue;
    const base = mat.userData.baseEmissive || 1;
    const target = base * windowTarget;
    mat.emissiveIntensity = instant ? target : damp(mat.emissiveIntensity, target, 2.0, dt);
  }
  for (const light of store.interiorLights) {
    const base = light.userData.baseIntensity || light.intensity;
    const target = base * (0.58 + night * 0.4);
    light.intensity = instant ? target : damp(light.intensity, target, 1.7, dt);
  }
  for (const entry of store.exteriorLights) {
    let target;
    if (night <= 0.58) {
      target = THREE.MathUtils.lerp(entry.day ?? 0, entry.dusk ?? entry.day ?? 0, night / 0.58);
    } else {
      target = THREE.MathUtils.lerp(entry.dusk ?? entry.day ?? 0, entry.night ?? 0, (night - 0.58) / 0.42);
    }
    entry.light.intensity = instant ? target : damp(entry.light.intensity, target, 1.8, dt);
  }
  if (store.streetLampBulb) {
    const target = 0.5 + night * 1.8;
    store.streetLampBulb.emissiveIntensity = instant ? target : damp(store.streetLampBulb.emissiveIntensity, target, 2.0, dt);
  }
  if (store.streetLampGlow) {
    const target = 0.05 + night * 0.3;
    store.streetLampGlow.material.opacity = instant ? target : damp(store.streetLampGlow.material.opacity, target, 2.0, dt);
  }
  if (store.spill) {
    const target = 0.035 + night * 0.06;
    store.spill.material.opacity = instant ? target : damp(store.spill.material.opacity, target, 1.8, dt);
  }
  if (store.groundSpill) {
    const target = 0.12 + night * 0.28 + (raining ? 0.1 : 0);
    store.groundSpill.material.opacity = instant ? target : damp(store.groundSpill.material.opacity, target, 1.4, dt);
  }
  if (store.rearPool) {
    const target = 0.09 + night * 0.2;
    store.rearPool.material.opacity = instant ? target : damp(store.rearPool.material.opacity, target, 1.4, dt);
  }
  if (store.snowMat) {
    const target = weather.snowCover * 0.9;
    store.snowMat.opacity = instant ? target : damp(store.snowMat.opacity, target, 1.2, dt);
    store.snowMat.visible = store.snowMat.opacity > 0.008;
  }
  scene.environmentIntensity = instant ? 0.42 - night * 0.15 : damp(scene.environmentIntensity, 0.42 - night * 0.15, 1.2, dt);
}

function animateStore(dt) {
  if (!store) return;
  const targetScale = 1;
  store.group.scale.setScalar(damp(store.group.scale.x, targetScale, 5.2, dt));
  store.group.position.y = damp(store.group.position.y, 0, 5.2, dt);

  const wind = weather.wind;
  for (const entry of store.sway) {
    const base = entry.baseRotation ?? 0;
    entry.object.rotation[entry.axis] = base + Math.sin(elapsed * entry.speed + entry.phase) * entry.amplitude * (0.25 + wind);
  }

  if (store.steam) {
    for (const sprite of store.steam) {
      const baseY = sprite.userData.baseY || sprite.position.y;
      sprite.position.y += dt * (0.13 + wind * 0.04);
      if (sprite.position.y > baseY + 0.85) sprite.position.y = baseY;
      sprite.position.x += Math.sin(elapsed * 0.8 + baseY * 5) * dt * 0.035;
      sprite.material.opacity = 0.2 + 0.16 * (1 - (sprite.position.y - baseY) / 0.85);
      sprite.material.rotation += dt * 0.03;
    }
  }

  if (store.sakura) {
    const petals = store.sakura.userData.petals || [];
    const petalOpacity = currentWeather === 'snow' ? 0.25 : 0.9;
    for (const petal of petals) {
      petal.position.y -= petal.userData.speed * dt * (0.5 + wind);
      petal.position.x += Math.sin(elapsed * 1.1 + petal.userData.phase) * dt * 0.08;
      petal.position.z += dt * 0.02;
      petal.material.opacity = petalOpacity;
      if (petal.position.y < 0.28) {
        petal.position.set(randRange(Math.random, -0.8, 0.8), 2.4 + Math.random() * 0.6, randRange(Math.random, -0.5, 0.5));
      }
    }
  }

  if (dust) {
    dust.material.opacity = damp(dust.material.opacity, 0.06 + sky.nightFactor * 0.22 - weather.values.rain * 0.06, 1.2, dt);
    const positions = dust.geometry.attributes.position.array;
    const base = dust.geometry.userData.base;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] += dt * 0.06 * (0.4 + (i % 5) * 0.1);
      positions[i * 3] += Math.sin(elapsed * 0.22 + i) * dt * 0.012;
      if (positions[i * 3 + 1] > 6.4) positions[i * 3 + 1] = 0.3;
      if (Math.abs(positions[i * 3] - base[i * 3]) > 0.5) positions[i * 3] = base[i * 3];
    }
    dust.geometry.attributes.position.needsUpdate = true;
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function resetCamera(instant = false) {
  const view = getView();
  const position = new THREE.Vector3(...view.position);
  const target = new THREE.Vector3(...DEFAULT_TARGET);
  if (instant) {
    camera.fov = view.fov;
    camera.updateProjectionMatrix();
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    return;
  }
  cameraTween = {
    fromPosition: camera.position.clone(),
    toPosition: position,
    fromTarget: controls.target.clone(),
    toTarget: target,
    time: 0,
    duration: 1.05,
    fromFov: camera.fov,
    toFov: view.fov,
    restoreAuto: controls.autoRotate
  };
  controls.autoRotate = false;
  controls.enabled = false;
}

function onResize() {
  if (!renderer || !camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.fov = getView().fov;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 760 ? 1.25 : 1.6));
  renderer.setSize(width, height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 760 ? 1.25 : 1.6));
  composer.setSize(width, height);
  if (bloomPass) bloomPass.setSize(width, height);
}

function moveView(dt) {
  if (!moveKeys.size || cameraTween) return;
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  forward.y = 0;
  if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const move = new THREE.Vector3();
  if (moveKeys.has('KeyW')) move.add(forward);
  if (moveKeys.has('KeyS')) move.sub(forward);
  if (moveKeys.has('KeyD')) move.add(right);
  if (moveKeys.has('KeyA')) move.sub(right);
  if (moveKeys.has('KeyE')) move.y += 1;
  if (moveKeys.has('KeyQ')) move.y -= 1;
  if (move.lengthSq() === 0) return;
  const boost = moveKeys.has('ShiftLeft') || moveKeys.has('ShiftRight') ? 2.2 : 1;
  move.normalize().multiplyScalar(8 * boost * dt);
  camera.position.add(move);
  controls.target.add(move);
}

function render(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
  lastFrame = now;
  elapsed += dt;

  if (cameraTween) {
    cameraTween.time += dt;
    const t = Math.min(1, cameraTween.time / cameraTween.duration);
    const e = easeInOutCubic(t);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, e);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, e);
    if (cameraTween.fromFov !== undefined) {
      camera.fov = THREE.MathUtils.lerp(cameraTween.fromFov, cameraTween.toFov, e);
      camera.updateProjectionMatrix();
    }
    if (t >= 1) {
      const restoreAuto = cameraTween.restoreAuto;
      cameraTween = null;
      controls.enabled = true;
      controls.autoRotate = restoreAuto;
    }
  }

  moveView(dt);
  sky.update(dt, elapsed);
  weather.update(dt, elapsed);
  updateMood(dt);
  animateStore(dt);
  controls.update();

  if (lightningFlash) {
    lightningFlash.style.opacity = (sky.flash * 0.55).toFixed(3);
  }

  composer.render();

  if (!ready) {
    ready = true;
    setTimeout(() => document.body.classList.add('is-ready'), 650);
  }
}

function boot() {
  try {
    initRenderer();
    initScene();
    renderer.setAnimationLoop(render);
    window.__storeDemo = {
      scene,
      camera,
      renderer,
      controls,
      sky,
      weather,
      audio,
      setStyle: (style) => applyStyle(style),
      setWeather: (name) => applyWeather(name),
      setTime: (name) => applyTime(name),
      resetCamera
    };
  } catch (error) {
    console.error(error);
    showFatal('三维场景初始化失败，请确认浏览器支持 WebGL。');
  }
}

boot();
