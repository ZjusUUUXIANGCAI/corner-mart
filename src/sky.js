import * as THREE from 'three';
import { damp, dampColor, mulberry32, randRange } from './util.js';
import { cloudTexture, softCircleTexture } from './textures.js';

const TIME_PRESETS = {
  day: {
    top: '#4ea6df',
    horizon: '#e7ede8',
    bottom: '#aab7ab',
    sun: '#fff0cc',
    sunPos: [15, 16, 9],
    sunIntensity: 2.85,
    hemiSky: '#a8d1e8',
    hemiGround: '#5f5d51',
    hemiIntensity: 0.95,
    ambient: 0.28,
    exposure: 0.98,
    stars: 0,
    clouds: 0.5,
    fog: 0.0055,
    fogColor: '#c7d2ca'
  },
  dusk: {
    top: '#2f4a73',
    horizon: '#ffad78',
    bottom: '#8d5f53',
    sun: '#ffcf9b',
    sunPos: [17, 3.8, 11],
    sunIntensity: 2.0,
    hemiSky: '#5d7090',
    hemiGround: '#463c34',
    hemiIntensity: 0.52,
    ambient: 0.16,
    exposure: 0.96,
    stars: 0.12,
    clouds: 0.45,
    fog: 0.0085,
    fogColor: '#8f6c5f'
  },
  night: {
    top: '#040b18',
    horizon: '#162a45',
    bottom: '#090f16',
    sun: '#b9d4ff',
    sunPos: [-12, 10, -7],
    sunIntensity: 0.46,
    hemiSky: '#1d3150',
    hemiGround: '#111719',
    hemiIntensity: 0.28,
    ambient: 0.1,
    exposure: 1.0,
    stars: 1,
    clouds: 0.2,
    fog: 0.0095,
    fogColor: '#0b1420'
  }
};

const WEATHER_LOOKS = {
  clear: {
    topTint: null,
    horizonTint: null,
    bottomTint: null,
    cloudBoost: 0,
    fogAdd: 0,
    sunMul: 1,
    exposureAdd: 0,
    saturation: 1
  },
  rain: {
    topTint: '#4c5d68',
    horizonTint: '#8b969a',
    bottomTint: '#5d6868',
    cloudBoost: 0.34,
    fogAdd: 0.016,
    sunMul: 0.34,
    exposureAdd: -0.08,
    saturation: 0.6
  },
  snow: {
    topTint: '#8b9db0',
    horizonTint: '#e0e6e8',
    bottomTint: '#c8d1d2',
    cloudBoost: 0.3,
    fogAdd: 0.012,
    sunMul: 0.5,
    exposureAdd: 0.06,
    saturation: 0.7
  },
  fog: {
    topTint: '#98a4a3',
    horizonTint: '#c7cec6',
    bottomTint: '#aab2aa',
    cloudBoost: 0.08,
    fogAdd: 0.055,
    sunMul: 0.45,
    exposureAdd: 0.02,
    saturation: 0.55
  },
  storm: {
    topTint: '#1e2a34',
    horizonTint: '#4d5a61',
    bottomTint: '#252f33',
    cloudBoost: 0.5,
    fogAdd: 0.026,
    sunMul: 0.12,
    exposureAdd: -0.15,
    saturation: 0.45
  }
};

function mixHex(base, tint, amount) {
  const color = new THREE.Color(base);
  if (tint) color.lerp(new THREE.Color(tint), amount);
  return color;
}

export class SkySystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.time = 'dusk';
    this.weather = 'clear';
    this.nightFactor = 0.55;
    this.flash = 0;

    this.current = {
      top: new THREE.Color('#48658f'),
      horizon: new THREE.Color('#ffb57d'),
      bottom: new THREE.Color('#bd8a72'),
      sun: new THREE.Color('#ffd7a1'),
      fog: new THREE.Color('#b98d78')
    };
    this.target = {
      top: this.current.top.clone(),
      horizon: this.current.horizon.clone(),
      bottom: this.current.bottom.clone(),
      sun: this.current.sun.clone(),
      fog: this.current.fog.clone()
    };

    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: this.current.top.clone() },
        horizonColor: { value: this.current.horizon.clone() },
        bottomColor: { value: this.current.bottom.clone() },
        sunColor: { value: this.current.sun.clone() },
        sunDirection: { value: new THREE.Vector3(0.6, 0.2, 0.6).normalize() },
        sunGlow: { value: 1.0 },
        haze: { value: 0.3 }
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorldPosition = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunDirection;
        uniform float sunGlow;
        uniform float haze;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = dir.y;
          float skyMix = smoothstep(-0.055, 0.24, h);
          vec3 color = mix(horizonColor, topColor, pow(skyMix, 0.66));
          color = mix(bottomColor, color, smoothstep(-0.2, 0.035, h));

          float sunAmount = max(dot(dir, normalize(sunDirection)), 0.0);
          float disc = pow(sunAmount, 420.0);
          float glow = pow(sunAmount, 12.0) * 0.32;
          float horizonGlow = pow(sunAmount, 4.0) * (1.0 - smoothstep(0.0, 0.35, abs(h))) * 0.22;
          color += sunColor * (disc * 2.4 + glow * sunGlow + horizonGlow * haze);

          float band = sin((h * 14.0) + sunAmount * 6.0) * 0.004;
          color += band;
          gl_FragColor = vec4(color, 1.0);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    this.skyMesh = new THREE.Mesh(new THREE.SphereGeometry(78, 32, 18), this.skyMaterial);
    this.skyMesh.renderOrder = -10;
    this.skyMesh.frustumCulled = false;
    scene.add(this.skyMesh);

    this.scene.fog = new THREE.FogExp2(this.current.fog.getHex(), 0.011);

    this.ambient = new THREE.AmbientLight('#ffffff', 0.28);
    scene.add(this.ambient);

    this.hemi = new THREE.HemisphereLight('#7a90b1', '#5e4e43', 0.9);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight('#ffd7a1', 2.65);
    this.sun.position.set(18, 6, 12);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 70;
    this.sun.shadow.camera.left = -18;
    this.sun.shadow.camera.right = 18;
    this.sun.shadow.camera.top = 16;
    this.sun.shadow.camera.bottom = -14;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.025;
    this.sun.target.position.set(0, 1.8, 0);
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
      map: softCircleTexture({ inner: 'rgba(255,255,255,1)', outer: 'rgba(255,255,255,0)' }),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      color: '#ffe4b5',
      opacity: 0.95
    }));
    this.sunDisc.scale.setScalar(9);
    this.sunDisc.renderOrder = -9;
    scene.add(this.sunDisc);

    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: softCircleTexture({ inner: 'rgba(255,255,255,0.5)', outer: 'rgba(255,255,255,0)' }),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      color: '#ffda9c',
      opacity: 0.35
    }));
    this.sunHalo.scale.setScalar(24);
    this.sunHalo.renderOrder = -9;
    scene.add(this.sunHalo);

    this.stars = this.#createStars();
    scene.add(this.stars);

    this.cloudSprite = cloudTexture();
    this.cloudGroup = new THREE.Group();
    this.clouds = [];
    const rand = mulberry32(76);
    for (let i = 0; i < 13; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.cloudSprite,
        transparent: true,
        depthWrite: false,
        opacity: 0,
        color: '#b9c6ca',
        fog: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(randRange(rand, -48, 48), randRange(rand, 17, 27), randRange(rand, -48, 10));
      const w = randRange(rand, 16, 32);
      sprite.scale.set(w, w * randRange(rand, 0.36, 0.52), 1);
      sprite.userData.speed = randRange(rand, 0.08, 0.24);
      sprite.userData.opacity = randRange(rand, 0.35, 0.9);
      sprite.userData.phase = rand() * 10;
      this.cloudGroup.add(sprite);
      this.clouds.push(sprite);
    }
    scene.add(this.cloudGroup);

    this.lightningLight = new THREE.PointLight('#dbe9ff', 0, 60, 1.5);
    this.lightningLight.position.set(-8, 22, -6);
    scene.add(this.lightningLight);

    this.flash = 0;
    this.flashTimer = 0;
    this.flashEnergy = 0;
    this.applyPreset('dusk', 'clear', true);
  }

  #createStars() {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const rand = mulberry32(123);
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const y = randRange(rand, -0.02, 1);
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      positions[i * 3] = Math.cos(theta) * r * 72;
      positions[i * 3 + 1] = y * 72;
      positions[i * 3 + 2] = Math.sin(theta) * r * 72;
      sizes[i] = randRange(rand, 0.5, 1.8);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: {
        opacity: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        uniform float pixelRatio;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * pixelRatio * 1.7;
          vAlpha = smoothstep(-0.1, 0.35, normalize(position).y);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float opacity;
        varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          float alpha = smoothstep(0.5, 0.08, d);
          gl_FragColor = vec4(vec3(0.86, 0.91, 1.0), alpha * vAlpha * opacity);
        }
      `
    });
    return new THREE.Points(geo, mat);
  }

  setTime(name) {
    this.time = name;
    this.applyPreset(name, this.weather);
  }

  setWeather(name) {
    this.weather = name;
    this.applyPreset(this.time, name);
  }

  applyPreset(time, weather, instant = false) {
    const t = TIME_PRESETS[time];
    const w = WEATHER_LOOKS[weather] || WEATHER_LOOKS.clear;
    if (!t) return;
    this.time = time;
    this.weather = weather;
    this.target.top.copy(mixHex(t.top, w.topTint, 0.75));
    this.target.horizon.copy(mixHex(t.horizon, w.horizonTint, 0.72));
    this.target.bottom.copy(mixHex(t.bottom, w.bottomTint, 0.7));
    this.target.sun.copy(new THREE.Color(t.sun));
    this.target.fog.copy(mixHex(t.fogColor, w.horizonTint, 0.65));

    this.targetSunIntensity = t.sunIntensity * w.sunMul;
    this.targetHemiIntensity = t.hemiIntensity * (weather === 'clear' ? 1 : 0.82);
    this.targetAmbient = t.ambient * (weather === 'clear' ? 1 : 0.9);
    this.targetExposure = t.exposure + w.exposureAdd;
    this.targetStars = time === 'night' ? 1 : time === 'dusk' ? 0.16 : 0;
    this.targetCloudOpacity = Math.min(0.95, t.clouds + w.cloudBoost);
    this.targetFogDensity = t.fog + w.fogAdd;
    this.targetSunDir = new THREE.Vector3(...t.sunPos).normalize();
    this.targetHemiSky = new THREE.Color(t.hemiSky).lerp(new THREE.Color(t.top), 0.18);
    this.targetHemiGround = new THREE.Color(t.hemiGround);
    this.nightFactor = time === 'night' ? 1 : time === 'dusk' ? 0.58 : 0;

    if (instant) {
      this.current.top.copy(this.target.top);
      this.current.horizon.copy(this.target.horizon);
      this.current.bottom.copy(this.target.bottom);
      this.current.sun.copy(this.target.sun);
      this.current.fog.copy(this.target.fog);
      this.sun.intensity = this.targetSunIntensity;
      this.hemi.intensity = this.targetHemiIntensity;
      this.ambient.intensity = this.targetAmbient;
      this.renderer.toneMappingExposure = this.targetExposure;
      this.scene.fog.density = this.targetFogDensity;
      this.scene.fog.color.copy(this.target.fog);
      this.sun.position.copy(this.targetSunDir).multiplyScalar(32);
      this.sunDisc.position.copy(this.targetSunDir).multiplyScalar(62);
      this.sunHalo.position.copy(this.targetSunDir).multiplyScalar(62);
      this.stars.material.uniforms.opacity.value = this.targetStars;
      for (const cloud of this.clouds) cloud.material.opacity = this.targetCloudOpacity * cloud.userData.opacity;
    }
  }

  update(dt, elapsed) {
    const lambda = 1.8;
    dampColor(this.current.top, this.target.top, lambda, dt);
    dampColor(this.current.horizon, this.target.horizon, lambda, dt);
    dampColor(this.current.bottom, this.target.bottom, lambda, dt);
    dampColor(this.current.sun, this.target.sun, lambda, dt);
    dampColor(this.current.fog, this.target.fog, lambda, dt);

    const uniforms = this.skyMaterial.uniforms;
    uniforms.topColor.value.copy(this.current.top);
    uniforms.horizonColor.value.copy(this.current.horizon);
    uniforms.bottomColor.value.copy(this.current.bottom);
    uniforms.sunColor.value.copy(this.current.sun);
    uniforms.sunDirection.value.lerp(this.targetSunDir, 1 - Math.exp(-1.2 * dt)).normalize();
    uniforms.sunGlow.value = damp(uniforms.sunGlow.value, this.weather === 'clear' ? 1.25 : 0.55, 1.2, dt);
    uniforms.haze.value = damp(uniforms.haze.value, this.weather === 'fog' ? 0.8 : 0.34, 1.2, dt);

    this.sun.intensity = damp(this.sun.intensity, this.targetSunIntensity, 1.6, dt);
    this.hemi.intensity = damp(this.hemi.intensity, this.targetHemiIntensity, 1.6, dt);
    this.ambient.intensity = damp(this.ambient.intensity, this.targetAmbient, 1.6, dt);
    this.hemi.color.lerp(this.targetHemiSky, 1 - Math.exp(-1.4 * dt));
    this.hemi.groundColor.lerp(this.targetHemiGround, 1 - Math.exp(-1.4 * dt));
    this.sun.color.lerp(this.current.sun, 1 - Math.exp(-1.4 * dt));
    this.renderer.toneMappingExposure = damp(this.renderer.toneMappingExposure, this.targetExposure, 1.4, dt);
    this.scene.fog.density = damp(this.scene.fog.density, this.targetFogDensity, 1.2, dt);
    this.scene.fog.color.lerp(this.current.fog, 1 - Math.exp(-1.4 * dt));

    this.sun.position.copy(this.targetSunDir).multiplyScalar(32);
    this.sun.position.y = Math.max(2.2, this.sun.position.y);
    this.sunDisc.position.copy(uniforms.sunDirection.value).multiplyScalar(62);
    this.sunHalo.position.copy(this.sunDisc.position);
    this.sunDisc.material.color.copy(this.current.sun);
    this.sunHalo.material.color.copy(this.current.sun);
    const discScale = this.time === 'night' ? 5.2 : this.time === 'dusk' ? 10 : 7.5;
    this.sunDisc.scale.setScalar(discScale);
    this.sunHalo.scale.setScalar(discScale * 3.4);
    this.sunDisc.material.opacity = this.weather === 'fog' || this.weather === 'storm' ? 0.2 : this.time === 'night' ? 0.9 : 0.75;
    this.sunHalo.material.opacity = this.weather === 'fog' || this.weather === 'storm' ? 0.1 : 0.35;

    this.stars.material.uniforms.opacity.value = damp(this.stars.material.uniforms.opacity.value, this.targetStars, 1.1, dt);
    for (const cloud of this.clouds) {
      cloud.material.opacity = damp(cloud.material.opacity, this.targetCloudOpacity * cloud.userData.opacity, 1.2, dt);
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 52) cloud.position.x = -52;
      cloud.position.y += Math.sin(elapsed * 0.07 + cloud.userData.phase) * dt * 0.015;
      const tint = new THREE.Color(this.time === 'night' ? '#2b3b50' : this.weather === 'storm' ? '#34424a' : this.weather === 'rain' ? '#7c8a8d' : this.weather === 'snow' ? '#d6dee1' : '#c8d2d3');
      cloud.material.color.lerp(tint, 1 - Math.exp(-0.5 * dt));
    }

    // lightning
    if (this.weather === 'storm') {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashTimer = 3.2 + Math.random() * 6.0;
        this.flashEnergy = 1;
        this.strike();
      }
    }
    this.flashEnergy = Math.max(0, this.flashEnergy - dt * 5.2);
    this.flash = this.flashEnergy;
    this.lightningLight.intensity = this.flash * 26;
    if (this.lightningBolt) {
      this.lightningBolt.material.opacity = Math.min(1, this.flash * 2.4);
      this.lightningBolt.visible = this.flash > 0.02;
    }
  }

  strike() {
    if (this.lightningBolt) {
      this.scene.remove(this.lightningBolt);
      this.lightningBolt.geometry.dispose();
      this.lightningBolt.material.dispose();
    }
    const points = [];
    const rand = mulberry32(Math.floor(Math.random() * 1e9));
    let x = randRange(rand, -16, 6);
    let y = 25;
    let z = randRange(rand, -18, -4);
    points.push(new THREE.Vector3(x, y, z));
    for (let i = 0; i < 9; i++) {
      x += randRange(rand, -1.3, 1.3);
      y -= randRange(rand, 1.7, 2.6);
      z += randRange(rand, -0.5, 0.5);
      points.push(new THREE.Vector3(x, y, z));
      if (rand() > 0.55) {
        const branch = [new THREE.Vector3(x, y, z)];
        let bx = x;
        let by = y;
        for (let n = 0; n < 3; n++) {
          bx += randRange(rand, -1.8, 1.8);
          by -= randRange(rand, 0.8, 1.8);
          branch.push(new THREE.Vector3(bx, by, z + randRange(rand, -0.4, 0.4)));
        }
        points.push(...branch);
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: '#d7e9ff',
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lightningBolt = new THREE.Line(geo, mat);
    this.lightningBolt.renderOrder = 3;
    this.scene.add(this.lightningBolt);
  }
}
