import * as THREE from 'three';
import {
  makeCanvas,
  canvasTexture,
  fillRoundRect,
  roundRect,
  drawSpacedText,
  mulberry32,
  randRange
} from './util.js';

export function signTexture({
  width = 1024,
  height = 256,
  bg = '#f4efe4',
  fg = '#24303a',
  accent = '#c34a34',
  title = '',
  subtitle = '',
  top = '',
  titleFont = '900 112px "Yu Gothic", "Microsoft YaHei", sans-serif',
  subtitleFont = '600 34px Georgia, serif',
  border = true,
  logo = null,
  align = 'center'
} = {}) {
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (border) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(6, width * 0.008);
    ctx.strokeRect(ctx.lineWidth / 2 + 8, ctx.lineWidth / 2 + 8, width - ctx.lineWidth - 16, height - ctx.lineWidth - 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, width - 44, height - 44);
  }

  let x = width / 2;
  if (align === 'left') x = width * 0.09;
  if (align === 'right') x = width * 0.91;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if (logo) {
    const lx = align === 'left' ? width * 0.1 : width * 0.08;
    const ly = height * 0.5;
    ctx.fillStyle = logo.bg || accent;
    ctx.beginPath();
    ctx.arc(lx, ly, height * 0.29, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = logo.fg || '#fff8eb';
    ctx.font = logo.font || `800 ${Math.round(height * 0.34)}px "Yu Gothic", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(logo.text || '', lx, ly + 2);
    x = width * 0.58;
    ctx.textAlign = 'center';
  }

  if (top) {
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.round(height * 0.12)}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(top, x, height * 0.16);
  }

  const titleY = subtitle ? height * 0.47 : height * 0.52;
  ctx.fillStyle = fg;
  ctx.font = titleFont;
  ctx.textAlign = align;
  ctx.fillText(title, x, titleY);

  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = subtitleFont;
    ctx.textAlign = align;
    ctx.fillText(subtitle, x, height * 0.78);
  }

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(align === 'left' ? x : width * 0.4, height * 0.87);
  ctx.lineTo(align === 'left' ? x + width * 0.2 : width * 0.6, height * 0.87);
  ctx.stroke();

  return canvasTexture(canvas);
}

export function verticalSignTexture({
  width = 256,
  height = 1024,
  bg = '#bd3a2a',
  fg = '#fff6e6',
  accent = '#f0c47b',
  chars = [],
  top = '',
  bottom = ''
} = {}) {
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, width - 28, height - 28);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (top) {
    ctx.fillStyle = accent;
    ctx.font = '700 25px "Yu Gothic", "Microsoft YaHei", sans-serif';
    ctx.fillText(top, width / 2, 80);
  }

  const count = Math.max(1, chars.length);
  const areaTop = top ? 150 : 90;
  const areaBottom = bottom ? height - 150 : height - 90;
  const step = (areaBottom - areaTop) / count;
  ctx.fillStyle = fg;
  ctx.font = '900 120px "Yu Gothic", "Microsoft YaHei", "SimSun", sans-serif';
  chars.forEach((char, index) => {
    ctx.fillText(char, width / 2, areaTop + step * (index + 0.5));
  });

  if (bottom) {
    ctx.fillStyle = accent;
    ctx.font = '700 26px Georgia, serif';
    ctx.fillText(bottom, width / 2, height - 78);
  }

  return canvasTexture(canvas);
}

export function neonTexture(text, { color = '#ff5a3c', glow = '#ff2a18', width = 512, height = 256, font = 'italic 900 130px Georgia, serif' } = {}) {
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 32;
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.strokeText(text, width / 2, height / 2);
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#fff4e8';
  ctx.fillText(text, width / 2, height / 2);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,190,160,0.75)';
  ctx.lineWidth = 2;
  ctx.strokeText(text, width / 2, height / 2);
  return canvasTexture(canvas);
}

export function posterTexture(kind, palette) {
  const { canvas, ctx } = makeCanvas(512, 720);
  const { bg, ink, accent, soft } = palette;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 720);

  ctx.fillStyle = soft;
  ctx.beginPath();
  ctx.arc(400, 145, 185, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 28, 720);
  ctx.fillRect(484, 0, 28, 720);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = accent;
  ctx.font = '800 26px "Microsoft YaHei", "Yu Gothic", sans-serif';
  ctx.fillText(kind === 'jp' ? 'MACHI MART' : kind === 'cn' ? '长乐便利' : 'CORNER MARKET', 68, 58);

  ctx.fillStyle = ink;
  ctx.font = kind === 'cn' ? '900 92px "STKaiti", "KaiTi", "SimSun", serif' : '900 84px "Yu Gothic", "Microsoft YaHei", sans-serif';
  const lines = kind === 'jp' ? ['あたらしい', '毎日。'] : kind === 'cn' ? ['热气腾腾', '每一天'] : ['FRESH', 'EVERY DAY'];
  lines.forEach((line, index) => ctx.fillText(line, 68, 150 + index * 104));

  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(70, 390);
  ctx.lineTo(300, 390);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = '500 28px "Microsoft YaHei", "Yu Gothic", sans-serif';
  const sub = kind === 'jp'
    ? ['おにぎり・お弁当・ホットコーヒー', '24時間、灯りをともして。']
    : kind === 'cn'
      ? ['关东煮 · 热茶 · 新鲜饭团', '长乐路口，等你回家。']
      : ['COFFEE · SANDWICHES · DAILY GOODS', 'The corner is always open.'];
  sub.forEach((line, index) => ctx.fillText(line, 70, 430 + index * 42));

  // stylized product illustration
  ctx.save();
  ctx.translate(256, 610);
  if (kind === 'jp') {
    ctx.fillStyle = '#f7f2e7';
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.quadraticCurveTo(95, -40, 84, 38);
    ctx.quadraticCurveTo(0, 100, -84, 38);
    ctx.quadraticCurveTo(-95, -40, 0, -70);
    ctx.fill();
    ctx.fillStyle = '#22342f';
    ctx.fillRect(-40, -14, 80, 44);
    ctx.fillStyle = '#c94632';
    ctx.beginPath();
    ctx.arc(0, 12, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'cn') {
    ctx.fillStyle = '#b53a2d';
    ctx.beginPath();
    ctx.roundRect(-90, -70, 180, 110, 18);
    ctx.fill();
    ctx.strokeStyle = '#efd29d';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = '#efd29d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = -60; i <= 60; i += 20) {
      ctx.moveTo(i, -70);
      ctx.quadraticCurveTo(i + 8, -55, i, -40);
    }
    ctx.stroke();
    ctx.fillStyle = '#f4e6c9';
    ctx.font = '700 28px "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('热', 0, -12);
  } else {
    ctx.fillStyle = '#f4e6c9';
    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 94, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f4d3f';
    ctx.beginPath();
    ctx.arc(0, -6, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4e6c9';
    ctx.font = '700 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('C', 0, 6);
  }
  ctx.restore();

  return canvasTexture(canvas);
}

export function chalkboardTexture() {
  const { canvas, ctx } = makeCanvas(512, 680);
  ctx.fillStyle = '#20312b';
  ctx.fillRect(0, 0, 512, 680);
  ctx.strokeStyle = '#d8c39a';
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, 468, 636);

  ctx.fillStyle = '#f2e6ca';
  ctx.textAlign = 'center';
  ctx.font = '600 44px "Segoe Print", "Comic Sans MS", cursive';
  ctx.fillText('TODAY', 256, 108);
  ctx.font = '800 60px Georgia, serif';
  ctx.fillStyle = '#e8be76';
  ctx.fillText('FRESH', 256, 184);
  ctx.fillStyle = '#f2e6ca';
  ctx.font = '600 38px "Segoe Print", "Comic Sans MS", cursive';
  ctx.fillText('coffee', 256, 286);
  ctx.fillText('& pastry', 256, 338);
  ctx.font = '900 105px Georgia, serif';
  ctx.fillStyle = '#e8be76';
  ctx.fillText('$2', 256, 478);
  ctx.font = '500 24px "Segoe Print", "Comic Sans MS", cursive';
  ctx.fillStyle = '#bfd1bf';
  ctx.fillText('open 24 hours', 256, 572);
  return canvasTexture(canvas);
}

export function menuBoardTexture(kind) {
  const { canvas, ctx } = makeCanvas(640, 420);
  ctx.fillStyle = '#20302c';
  ctx.fillRect(0, 0, 640, 420);
  ctx.strokeStyle = '#c6a66b';
  ctx.lineWidth = 5;
  ctx.strokeRect(16, 16, 608, 388);
  ctx.fillStyle = '#f1e6cf';
  ctx.textAlign = 'left';
  ctx.font = kind === 'cn' ? '700 46px "STKaiti", "KaiTi", serif' : '700 42px Georgia, serif';
  ctx.fillText(kind === 'cn' ? '今日热食' : kind === 'jp' ? 'HOT SNACK' : 'COUNTER', 42, 76);
  ctx.strokeStyle = '#c6a66b';
  ctx.beginPath();
  ctx.moveTo(42, 96);
  ctx.lineTo(598, 96);
  ctx.stroke();
  const items = kind === 'cn'
    ? [['关东煮', '¥6'], ['茶叶蛋', '¥3'], ['热豆浆', '¥5'], ['饭团', '¥8']]
    : kind === 'jp'
      ? [['おでん', '¥280'], ['肉まん', '¥200'], ['コーヒー', '¥150'], ['おにぎり', '¥180']]
      : [['COFFEE', '$2'], ['HOT DOG', '$3.5'], ['PRETZEL', '$2.5'], ['SOUP', '$4']];
  ctx.font = kind === 'cn' ? '500 32px "STKaiti", "KaiTi", serif' : '500 30px Georgia, serif';
  items.forEach(([name, price], i) => {
    ctx.fillStyle = '#ede0c8';
    ctx.fillText(name, 48, 156 + i * 62);
    ctx.fillStyle = '#d9b875';
    ctx.textAlign = 'right';
    ctx.fillText(price, 588, 156 + i * 62);
    ctx.textAlign = 'left';
  });
  return canvasTexture(canvas);
}

export function brickTexture({ repeat = [2, 2], tone = '#8a4f3d' } = {}) {
  const { canvas, ctx } = makeCanvas(1024, 1024);
  const rand = mulberry32(72);
  ctx.fillStyle = '#c9b9a3';
  ctx.fillRect(0, 0, 1024, 1024);
  const bw = 128;
  const bh = 54;
  const gap = 7;
  for (let row = 0; row < 21; row++) {
    const offset = row % 2 === 0 ? 0 : -bw / 2;
    for (let col = -1; col < 10; col++) {
      const base = new THREE.Color(tone);
      base.offsetHSL(0, randRange(rand, -0.05, 0.04), randRange(rand, -0.1, 0.08));
      ctx.fillStyle = `#${base.getHexString()}`;
      const x = col * bw + offset + gap / 2;
      const y = row * bh + gap / 2;
      ctx.fillRect(x, y, bw - gap, bh - gap);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x + 4, y + 3, bw - gap - 8, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x + 4, y + bh - gap - 7, bw - gap - 8, 4);
      for (let n = 0; n < 12; n++) {
        ctx.fillStyle = `rgba(${rand() > 0.5 ? '0,0,0' : '255,240,220'},${randRange(rand, 0.02, 0.07)})`;
        ctx.fillRect(x + rand() * (bw - gap), y + rand() * (bh - gap), randRange(rand, 3, 22), randRange(rand, 1, 4));
      }
    }
  }
  return canvasTexture(canvas, { repeat });
}

export function stoneTexture({ repeat = [4, 4], base = '#9a9b92' } = {}) {
  const { canvas, ctx } = makeCanvas(1024, 1024);
  const rand = mulberry32(13);
  ctx.fillStyle = '#777a73';
  ctx.fillRect(0, 0, 1024, 1024);
  const size = 256;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const c = new THREE.Color(base);
      c.offsetHSL(randRange(rand, -0.02, 0.02), randRange(rand, -0.04, 0.03), randRange(rand, -0.08, 0.07));
      const x = col * size + 4;
      const y = row * size + 4;
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, size - 8, size - 8);
      for (let n = 0; n < 80; n++) {
        ctx.fillStyle = `rgba(${rand() > 0.5 ? '255,255,255' : '20,20,18'},${randRange(rand, 0.02, 0.09)})`;
        ctx.beginPath();
        ctx.arc(x + rand() * size, y + rand() * size, randRange(rand, 0.5, 3.2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, y, size - 8, 4);
    }
  }
  return canvasTexture(canvas, { repeat });
}

export function asphaltTexture({ repeat = [10, 10] } = {}) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = mulberry32(29);
  ctx.fillStyle = '#3d4045';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const gray = Math.floor(randRange(rand, 40, 120));
    ctx.fillStyle = `rgba(${gray},${gray + 2},${gray + 4},${randRange(rand, 0.12, 0.45)})`;
    const size = randRange(rand, 0.5, 3.2);
    ctx.fillRect(rand() * 512, rand() * 512, size, size);
  }
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `rgba(20,22,28,${randRange(rand, 0.08, 0.2)})`;
    ctx.lineWidth = randRange(rand, 1, 3);
    ctx.beginPath();
    let x = rand() * 512;
    let y = rand() * 512;
    ctx.moveTo(x, y);
    for (let n = 0; n < 5; n++) {
      x += randRange(rand, -40, 40);
      y += randRange(rand, 20, 70);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return canvasTexture(canvas, { repeat });
}

export function checkerTileTexture({ repeat = [4, 3], warm = '#e8dfcc', cool = '#cfc6b3' } = {}) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = mulberry32(5);
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, 512, 512);
  const size = 128;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? warm : cool;
      ctx.fillRect(x * size, y * size, size, size);
      for (let n = 0; n < 20; n++) {
        ctx.fillStyle = `rgba(90,80,65,${randRange(rand, 0.01, 0.04)})`;
        ctx.fillRect(x * size + rand() * size, y * size + rand() * size, randRange(rand, 1, 6), randRange(rand, 1, 4));
      }
    }
  }
  ctx.strokeStyle = 'rgba(104,93,77,0.42)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * size);
    ctx.lineTo(512, i * size);
    ctx.stroke();
  }
  return canvasTexture(canvas, { repeat });
}

export function woodTexture({ repeat = [1, 1], tone = '#8b5a3c' } = {}) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = mulberry32(99);
  const base = new THREE.Color(tone);
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    const c = base.clone().offsetHSL(0, randRange(rand, -0.04, 0.03), randRange(rand, -0.12, 0.08));
    ctx.strokeStyle = `#${c.getHexString()}`;
    ctx.lineWidth = randRange(rand, 1, 7);
    ctx.globalAlpha = randRange(rand, 0.2, 0.6);
    ctx.beginPath();
    const x = rand() * 512;
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 32) {
      ctx.lineTo(x + Math.sin(y * 0.02 + i) * randRange(rand, 1, 9), y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 5; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    ctx.strokeStyle = 'rgba(40,22,12,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, randRange(rand, 5, 20), randRange(rand, 2, 6), randRange(rand, 0, Math.PI), 0, Math.PI * 2);
    ctx.stroke();
  }
  return canvasTexture(canvas, { repeat });
}

export function roofTileTexture({ repeat = [8, 3], base = '#4d5b52', accent = '#7f8c7f' } = {}) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = mulberry32(44);
  ctx.fillStyle = '#314039';
  ctx.fillRect(0, 0, 512, 512);
  const cols = 8;
  const rows = 8;
  const cw = 512 / cols;
  const rh = 512 / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const c = new THREE.Color(base).offsetHSL(0, randRange(rand, -0.02, 0.02), randRange(rand, -0.05, 0.06));
      const x = col * cw + (row % 2) * cw * 0.5;
      const y = row * rh;
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cw - 4, rh - 3, [cw * 0.45, cw * 0.45, 4, 4]);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(x + cw * 0.25, y + 4, cw * 0.5, 3);
    }
  }
  return canvasTexture(canvas, { repeat });
}

export function plasterTexture({ repeat = [3, 2], tone = '#e5ddcb' } = {}) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = mulberry32(17);
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 7000; i++) {
    const shade = rand() > 0.5 ? '255,255,255' : '60,50,40';
    ctx.fillStyle = `rgba(${shade},${randRange(rand, 0.015, 0.05)})`;
    ctx.fillRect(rand() * 512, rand() * 512, randRange(rand, 1, 5), randRange(rand, 1, 5));
  }
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = `rgba(110,95,75,${randRange(rand, 0.02, 0.06)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let x = rand() * 512;
    ctx.moveTo(x, 0);
    for (let y = 0; y < 512; y += 25) ctx.lineTo(x + randRange(rand, -8, 8), y);
    ctx.stroke();
  }
  return canvasTexture(canvas, { repeat });
}

export function awningTexture({ colors = ['#1f4d3f', '#f1e5ca'], repeat = [3, 1] } = {}) {
  const { canvas, ctx } = makeCanvas(512, 256);
  const count = 12;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % 2];
    ctx.fillRect((512 / count) * i, 0, 512 / count + 1, 256);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.fillRect(0, 200, 512, 56);
  const texture = canvasTexture(canvas, { repeat });
  return texture;
}

export function awningValanceTexture({ colors = ['#1f4d3f', '#f1e5ca'], width = 1024, height = 192 } = {}) {
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);
  const count = 16;
  const sw = width / count;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % 2];
    ctx.beginPath();
    ctx.moveTo(i * sw, 0);
    ctx.lineTo((i + 1) * sw, 0);
    ctx.lineTo((i + 1) * sw, height * 0.6);
    ctx.quadraticCurveTo(i * sw + sw / 2, height, i * sw, height * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(i * sw, height * 0.5, sw, 6);
  }
  return canvasTexture(canvas);
}

export function cloudTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const rand = mulberry32(31);
  ctx.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 26; i++) {
    const x = randRange(rand, 80, 432);
    const y = randRange(rand, 90, 176);
    const r = randRange(rand, 35, 90);
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${randRange(rand, 0.12, 0.3)})`);
    g.addColorStop(0.6, `rgba(255,255,255,${randRange(rand, 0.06, 0.14)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return canvasTexture(canvas);
}

export function softCircleTexture({ inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)' } = {}) {
  const { canvas, ctx } = makeCanvas(128, 128);
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.45, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return canvasTexture(canvas);
}

export function petalTexture(color = '#ffc5d2') {
  const { canvas, ctx } = makeCanvas(64, 64);
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(32, 36, 17, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(28, 30, 5, 11, -0.5, 0, Math.PI * 2);
  ctx.fill();
  return canvasTexture(canvas);
}

export function leafTexture(color = '#426b4b') {
  const { canvas, ctx } = makeCanvas(64, 64);
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.quadraticCurveTo(58, 24, 32, 60);
  ctx.quadraticCurveTo(6, 24, 32, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 10);
  ctx.lineTo(32, 54);
  ctx.stroke();
  return canvasTexture(canvas);
}

export function radialShadowTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const gradient = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(canvas);
}

export function snowTexture() {
  const { canvas, ctx } = makeCanvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  const g = ctx.createRadialGradient(64, 64, 1, 64, 64, 46);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 12, 64 + Math.sin(a) * 12);
    ctx.lineTo(64 + Math.cos(a) * 30, 64 + Math.sin(a) * 30);
    ctx.stroke();
  }
  return canvasTexture(canvas);
}

export function frostTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const rand = mulberry32(61);
  ctx.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 60; i++) {
    const x = rand() * 512;
    const y = rand() * 256;
    const r = randRange(rand, 14, 60);
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${randRange(rand, 0.45, 0.9)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * randRange(rand, 0.3, 0.7), randRange(rand, 0, Math.PI), 0, Math.PI * 2);
    ctx.fill();
  }
  return canvasTexture(canvas);
}

export function puddleTexture() {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = mulberry32(83);
  ctx.clearRect(0, 0, 512, 512);
  ctx.translate(256, 256);
  ctx.fillStyle = 'rgba(220,235,244,1)';
  ctx.beginPath();
  const points = 22;
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = 170 + Math.sin(a * 3) * 22 + Math.sin(a * 7 + 1) * 12 + randRange(rand, -8, 8);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.58;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.quadraticCurveTo(Math.cos(a - 0.1) * (r + 10), Math.sin(a - 0.1) * (r + 10) * 0.58, x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 13; i++) {
    ctx.beginPath();
    ctx.ellipse(randRange(rand, -190, 190), randRange(rand, -95, 95), randRange(rand, 5, 28), randRange(rand, 2, 12), randRange(rand, 0, Math.PI), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  return canvasTexture(canvas);
}

export function posterA1(kind) {
  const { canvas, ctx } = makeCanvas(512, 720);
  ctx.fillStyle = kind === 'jp' ? '#f2e7d7' : kind === 'cn' ? '#f0e2c9' : '#e9e3d2';
  ctx.fillRect(0, 0, 512, 720);
  ctx.strokeStyle = kind === 'cn' ? '#a73329' : '#3b4b44';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, 476, 684);

  ctx.textAlign = 'center';
  ctx.fillStyle = kind === 'cn' ? '#a73329' : kind === 'jp' ? '#bc3c2c' : '#1f4d3f';
  ctx.font = kind === 'cn' ? '900 100px "STKaiti", "KaiTi", serif' : '900 94px "Yu Gothic", "Microsoft YaHei", sans-serif';
  const text = kind === 'cn' ? '新品' : kind === 'jp' ? '新発売' : 'NEW';
  ctx.fillText(text, 256, 250);
  ctx.fillStyle = '#26332f';
  ctx.font = kind === 'cn' ? '700 54px "STKaiti", "KaiTi", serif' : '800 48px "Yu Gothic", "Microsoft YaHei", sans-serif';
  const sub = kind === 'cn' ? '桂花乌龙' : kind === 'jp' ? 'ほうじ茶' : 'COLD BREW';
  ctx.fillText(sub, 256, 370);
  ctx.fillStyle = kind === 'cn' ? '#b23a2e' : kind === 'jp' ? '#3d5b4d' : '#8a4f3d';
  ctx.beginPath();
  ctx.roundRect(156, 440, 200, 160, 26);
  ctx.fill();
  ctx.fillStyle = '#f4e7ce';
  ctx.font = '700 30px Georgia, serif';
  ctx.fillText(kind === 'cn' ? '长乐限定' : kind === 'jp' ? 'MACHI MART' : 'CORNER');
  ctx.fillText(kind === 'cn' ? '秋日暖饮' : kind === 'jp' ? 'AUTUMN BLEND' : 'MARKET BLEND', 256, 640);
  return canvasTexture(canvas);
}

export function windowDecalTexture(kind) {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.clearRect(0, 0, 512, 512);
  ctx.textAlign = 'center';
  ctx.fillStyle = kind === 'cn' ? 'rgba(255,247,230,0.94)' : 'rgba(255,247,232,0.94)';
  ctx.strokeStyle = kind === 'cn' ? 'rgba(157,42,34,0.85)' : 'rgba(39,67,60,0.8)';
  ctx.lineWidth = 5;
  if (kind === 'jp') {
    ctx.font = '800 74px "Yu Gothic", sans-serif';
    ctx.fillText('おにぎり', 256, 190);
    ctx.font = '700 54px "Yu Gothic", sans-serif';
    ctx.fillText('100円〜', 256, 270);
    ctx.beginPath();
    ctx.arc(256, 380, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '700 34px Georgia, serif';
    ctx.fillText('HOT', 256, 372);
    ctx.fillText('COFFEE', 256, 414);
  } else if (kind === 'cn') {
    ctx.font = '900 84px "STKaiti", "KaiTi", serif';
    ctx.fillText('热茶', 256, 200);
    ctx.font = '700 44px "STKaiti", "KaiTi", serif';
    ctx.fillText('关东煮 · 暖胃', 256, 280);
    ctx.beginPath();
    ctx.arc(256, 380, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '700 34px "STKaiti", "KaiTi", serif';
    ctx.fillText('二十四', 256, 372);
    ctx.fillText('小时', 256, 414);
  } else {
    ctx.font = '800 64px Georgia, serif';
    ctx.fillText('FRESH', 256, 180);
    ctx.fillText('COFFEE', 256, 250);
    ctx.font = '600 34px "Segoe Print", "Comic Sans MS", cursive';
    ctx.fillText('hot & iced', 256, 312);
    ctx.beginPath();
    ctx.arc(256, 400, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '800 34px Georgia, serif';
    ctx.fillText('OPEN', 256, 392);
    ctx.fillText('24H', 256, 430);
  }
  return canvasTexture(canvas);
}

export function streetSignTexture(text, accent = '#2f6c5d') {
  const { canvas, ctx } = makeCanvas(512, 160);
  ctx.fillStyle = '#f0e9d8';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = '#26332f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 64px "Microsoft YaHei", "Yu Gothic", sans-serif';
  ctx.fillText(text, 256, 84);
  return canvasTexture(canvas);
}
