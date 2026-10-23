import * as THREE from 'three';
import { damp, mulberry32, randRange } from './util.js';
import { puddleTexture, softCircleTexture, snowTexture } from './textures.js';

const WEATHER_TARGETS = {
  clear: { rain: 0, snow: 0, fog: 0.08, wet: 0, snowCover: 0, wind: 0.18 },
  rain: { rain: 1, snow: 0, fog: 0.32, wet: 1, snowCover: 0, wind: 0.85 },
  snow: { rain: 0, snow: 1, fog: 0.38, wet: 0.08, snowCover: 1, wind: 0.45 },
  fog: { rain: 0, snow: 0, fog: 1, wet: 0.12, snowCover: 0, wind: 0.2 },
  storm: { rain: 1.45, snow: 0, fog: 0.55, wet: 1.15, snowCover: 0, wind: 1.7 }
};

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.weather = 'clear';
    this.values = { rain: 0, snow: 0, fog: 0.08, wet: 0, snowCover: 0, wind: 0.18 };
    this.targets = { ...WEATHER_TARGETS.clear };
    this.rainDrops = [];
    this.snowFlakes = [];
    this.ripples = [];
    this.fogSprites = [];
    this.#createRain();
    this.#createSnow();
    this.#createPuddles();
    this.#createFog();
    this.random = mulberry32(881);
    this.lightningFlash = 0;
  }

  #createRain() {
    const count = 1500;
    this.rainData = [];
    const positions = new Float32Array(count * 2 * 3);
    const rand = mulberry32(303);
    for (let i = 0; i < count; i++) {
      const x = randRange(rand, -21, 21);
      const y = randRange(rand, 0, 17);
      const z = randRange(rand, -7, 20);
      const speed = randRange(rand, 12, 22);
      const length = randRange(rand, 0.25, 0.7);
      this.rainData.push({ x, y, z, speed, length });
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x + 0.04;
      positions[i * 6 + 4] = y + length;
      positions[i * 6 + 5] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainGeo = geo;
    this.rainMat = new THREE.LineBasicMaterial({
      color: '#cfe4ee',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    this.rain = new THREE.LineSegments(geo, this.rainMat);
    this.rain.frustumCulled = false;
    this.rain.renderOrder = 2;
    this.scene.add(this.rain);
  }

  #createSnow() {
    const count = 1300;
    const positions = new Float32Array(count * 3);
    const rand = mulberry32(404);
    for (let i = 0; i < count; i++) {
      const x = randRange(rand, -20, 20);
      const y = randRange(rand, 0, 16);
      const z = randRange(rand, -7, 19);
      const speed = randRange(rand, 0.55, 1.8);
      const phase = rand() * Math.PI * 2;
      this.snowFlakes.push({ x, y, z, speed, phase, sway: randRange(rand, 0.2, 0.8) });
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.snowGeo = geo;
    this.snowMat = new THREE.PointsMaterial({
      map: snowTexture(),
      color: '#f4f9ff',
      size: 0.2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
      alphaTest: 0.02
    });
    this.snow = new THREE.Points(geo, this.snowMat);
    this.snow.frustumCulled = false;
    this.snow.renderOrder = 2;
    this.scene.add(this.snow);
  }

  #createPuddles() {
    this.puddleGroup = new THREE.Group();
    const tex = puddleTexture();
    this.puddleMaterials = [];
    const rand = mulberry32(505);
    const spots = [
      [-4.6, 0.193, 5.5, 2.4, 1.35],
      [1.9, 0.193, 6.0, 3.2, 1.6],
      [6.4, 0.193, 7.0, 2.2, 1.15],
      [-8.5, 0.193, 6.7, 2.8, 1.3],
      [-1.0, 0.193, 3.7, 1.7, 0.9],
      [4.8, 0.072, 11.6, 3.4, 1.9],
      [-6.0, 0.072, 14.8, 4.8, 2.2],
      [8.2, 0.072, 16.0, 3.0, 1.8],
      [-13.5, 0.072, 12.5, 4.2, 2.0],
      [12.5, 0.193, 5.4, 2.1, 1.1],
      [2.2, 0.072, 18.5, 5.2, 2.4]
    ];
    for (const [x, y, z, w, h] of spots) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: '#283a3e',
        roughness: 0.035,
        metalness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transparent: true,
        opacity: 0,
        alphaMap: tex,
        envMapIntensity: 2.2,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = randRange(rand, 0, Math.PI);
      mesh.position.set(x, y, z);
      mesh.renderOrder = 1;
      this.puddleGroup.add(mesh);
      this.puddleMaterials.push(mat);
    }
    this.scene.add(this.puddleGroup);

    // ripples use independent tiny rings so each can animate on its own phase
    const rippleGeo = new THREE.RingGeometry(0.55, 0.68, 20);
    const rippleSpots = [
      [-4.4, 0.198, 5.4], [1.6, 0.198, 5.9], [6.2, 0.198, 6.8],
      [-8.3, 0.198, 6.6], [-0.8, 0.198, 3.8], [4.7, 0.078, 11.4],
      [-5.8, 0.078, 14.6], [8.0, 0.078, 15.8], [-13.2, 0.078, 12.3],
      [12.3, 0.198, 5.3], [2.0, 0.078, 18.2]
    ];
    for (let i = 0; i < rippleSpots.length; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: '#d9eaf0',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(rippleGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(...rippleSpots[i]);
      mesh.renderOrder = 2;
      mesh.visible = false;
      this.scene.add(mesh);
      this.ripples.push({
        mesh,
        mat,
        base: rippleSpots[i],
        timer: this.random ? this.random() * 2 : Math.random() * 2,
        duration: randRange(rand, 1.2, 2.4)
      });
    }
  }

  #createFog() {
    this.fogGroup = new THREE.Group();
    this.fogGroup.renderOrder = 1;
    const tex = softCircleTexture({ inner: 'rgba(255,255,255,0.35)', outer: 'rgba(255,255,255,0)' });
    const rand = mulberry32(606);
    for (let i = 0; i < 9; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: '#d6dcd7',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(randRange(rand, -15, 15), randRange(rand, 0.45, 2.1), randRange(rand, 0.0, 14));
      const s = randRange(rand, 5, 11);
      sprite.scale.set(s, s * randRange(rand, 0.35, 0.6), 1);
      sprite.userData.speed = randRange(rand, 0.04, 0.12);
      sprite.userData.phase = rand() * 8;
      this.fogGroup.add(sprite);
      this.fogSprites.push(sprite);
    }
    this.scene.add(this.fogGroup);
  }

  setWeather(name) {
    if (!WEATHER_TARGETS[name]) return;
    this.weather = name;
    this.targets = { ...WEATHER_TARGETS[name] };
  }

  update(dt, elapsed) {
    this.values.rain = damp(this.values.rain, this.targets.rain, 2.4, dt);
    this.values.snow = damp(this.values.snow, this.targets.snow, 2.2, dt);
    this.values.fog = damp(this.values.fog, this.targets.fog, 0.85, dt);
    this.values.wet = damp(this.values.wet, this.targets.wet, 1.5, dt);
    this.values.snowCover = damp(this.values.snowCover, this.targets.snowCover, 1.1, dt);
    this.values.wind = damp(this.values.wind, this.targets.wind, 1.0, dt);
    const rainAmount = this.values.rain;
    const snowAmount = this.values.snow;
    const wind = this.values.wind;

    this.rainMat.opacity = Math.min(0.5, rainAmount * 0.33);
    this.rain.visible = rainAmount > 0.025;
    if (this.rain.visible) {
      const positions = this.rainGeo.attributes.position.array;
      for (let i = 0; i < this.rainData.length; i++) {
        const d = this.rainData[i];
        d.y -= d.speed * dt * (0.65 + rainAmount * 0.55);
        d.x += wind * dt * 1.8;
        if (d.y < 0.1) {
          d.y = 15 + this.random() * 5;
          d.x = randRange(this.random, -21, 21);
          d.z = randRange(this.random, -7, 20);
          d.speed = randRange(this.random, 12, 22);
          d.length = randRange(this.random, 0.25, 0.7);
        }
        if (d.x > 21) d.x -= 42;
        const ix = i * 6;
        positions[ix] = d.x;
        positions[ix + 1] = d.y;
        positions[ix + 2] = d.z;
        positions[ix + 3] = d.x + 0.055;
        positions[ix + 4] = d.y + d.length;
        positions[ix + 5] = d.z;
      }
      this.rainGeo.attributes.position.needsUpdate = true;
    }

    this.snowMat.opacity = Math.min(0.95, snowAmount * 0.9);
    this.snow.visible = snowAmount > 0.015;
    if (this.snow.visible) {
      const positions = this.snowGeo.attributes.position.array;
      for (let i = 0; i < this.snowFlakes.length; i++) {
        const f = this.snowFlakes[i];
        f.y -= f.speed * dt;
        f.x += Math.sin(elapsed * 0.6 + f.phase) * f.sway * dt + wind * dt * 0.45;
        if (f.y < 0.06) {
          f.y = 14 + this.random() * 4;
          f.x = randRange(this.random, -20, 20);
          f.z = randRange(this.random, -7, 19);
        }
        if (f.x > 21) f.x -= 42;
        const ix = i * 3;
        positions[ix] = f.x;
        positions[ix + 1] = f.y;
        positions[ix + 2] = f.z;
      }
      this.snowGeo.attributes.position.needsUpdate = true;
    }

    // wet sheen and puddles
    for (const mat of this.puddleMaterials) {
      mat.opacity = Math.min(0.72, this.values.wet * 0.68);
    }
    this.puddleGroup.visible = this.values.wet > 0.015;
    const rippleActive = rainAmount > 0.18;
    for (const ripple of this.ripples) {
      ripple.mesh.visible = rippleActive;
      if (!rippleActive) {
        ripple.mat.opacity = 0;
        continue;
      }
      ripple.timer += dt;
      const t = (ripple.timer % ripple.duration) / ripple.duration;
      const scale = 0.08 + t * 0.72;
      ripple.mesh.scale.setScalar(scale);
      ripple.mat.opacity = (1 - t) * 0.38 * rainAmount;
      if (ripple.timer > ripple.duration * 3.5) {
        ripple.timer = 0;
        ripple.base[0] += randRange(this.random, -0.2, 0.2);
        ripple.mesh.position.x = ripple.base[0];
      }
    }

    // ground mist
    const fogStrength = Math.min(1, this.values.fog);
    for (const sprite of this.fogSprites) {
      sprite.material.opacity = Math.pow(fogStrength, 1.5) * 0.33;
      sprite.position.x += sprite.userData.speed * dt * (1 + wind * 0.8);
      if (sprite.position.x > 18) sprite.position.x = -18;
      sprite.position.y += Math.sin(elapsed * 0.22 + sprite.userData.phase) * dt * 0.02;
    }
    this.fogGroup.visible = fogStrength > 0.02;
  }

  get snowCover() {
    return this.values.snowCover;
  }

  get wetness() {
    return this.values.wet;
  }

  get wind() {
    return this.values.wind;
  }
}
