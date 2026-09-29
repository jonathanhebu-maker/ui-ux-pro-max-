import * as THREE from 'three';
import { mulberry32 } from './noise.js';

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function finish(c, renderer, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

// Top face of the central processor. Returns { map, emissive }.
export function chipTextures(renderer, size = 512) {
  const [c, g] = canvas(size);
  const [ce, ge] = canvas(size);
  const s = size;
  // Base: deep graphite with fine grain + silicon grid
  const grd = g.createLinearGradient(0, 0, s, s);
  grd.addColorStop(0, '#1b2030');
  grd.addColorStop(1, '#0b0e17');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(120,150,220,.07)';
  g.lineWidth = 1;
  for (let i = 0; i < s; i += s / 32) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke();
  }
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, s, s);

  // Gold bevel frame
  const m = s * 0.07;
  g.strokeStyle = '#c9a052';
  g.lineWidth = s * 0.012;
  g.strokeRect(m, m, s - 2 * m, s - 2 * m);
  g.strokeStyle = 'rgba(201,160,82,.35)';
  g.lineWidth = s * 0.004;
  g.strokeRect(m * 1.6, m * 1.6, s - 3.2 * m, s - 3.2 * m);

  // Traces running from edges to the die
  const rand = mulberry32(11);
  const traces = (ctx, color, w) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < 7; i++) {
        const off = s * 0.26 + i * s * 0.08;
        const inner = s * 0.3 + rand() * s * 0.02;
        ctx.beginPath();
        if (k === 0) { ctx.moveTo(off, m * 1.6); ctx.lineTo(off, inner); }
        if (k === 1) { ctx.moveTo(off, s - m * 1.6); ctx.lineTo(off, s - inner); }
        if (k === 2) { ctx.moveTo(m * 1.6, off); ctx.lineTo(inner, off); }
        if (k === 3) { ctx.moveTo(s - m * 1.6, off); ctx.lineTo(s - inner, off); }
        ctx.stroke();
      }
    }
  };
  traces(g, 'rgba(90,170,255,.45)', s * 0.006);
  traces(ge, 'rgba(60,150,255,.55)', s * 0.006);

  // Die
  const d0 = s * 0.29;
  const d1 = s - 2 * d0;
  g.fillStyle = '#0a0d16';
  g.fillRect(d0, d0, d1, d1);
  g.strokeStyle = 'rgba(140,190,255,.55)';
  g.lineWidth = s * 0.006;
  g.strokeRect(d0, d0, d1, d1);
  ge.strokeStyle = 'rgba(80,170,255,.8)';
  ge.lineWidth = s * 0.008;
  ge.strokeRect(d0, d0, d1, d1);

  // "AI" — crisp, readable
  const drawAI = (ctx, fill, glow) => {
    ctx.save();
    ctx.font = `600 ${Math.round(s * 0.26)}px Inter, "Heebo", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'ltr';
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = s * 0.05; }
    ctx.fillStyle = fill;
    ctx.fillText('AI', s / 2, s / 2 + s * 0.012);
    ctx.restore();
  };
  drawAI(g, '#eef6ff', 'rgba(90,180,255,.9)');
  drawAI(ge, '#7fd2ff', 'rgba(120,120,255,1)');

  // Corner marker + tiny label
  g.fillStyle = '#c9a052';
  g.beginPath();
  g.arc(m * 2.4, m * 2.4, s * 0.012, 0, Math.PI * 2);
  g.fill();
  g.font = `500 ${Math.round(s * 0.032)}px Inter, system-ui, sans-serif`;
  g.fillStyle = 'rgba(180,200,240,.55)';
  g.textAlign = 'center';
  g.fillText('NX-CORE · 7NM', s / 2, s - d0 + s * 0.06);

  return { map: finish(c, renderer), emissive: finish(ce, renderer) };
}

// Inner face of skull panels / board: circuit traces.
export function circuitTexture(renderer, size = 512, seed = 3, { emissive = false } = {}) {
  const [c, g] = canvas(size);
  const rand = mulberry32(seed);
  g.fillStyle = emissive ? '#000' : '#10131b';
  g.fillRect(0, 0, size, size);
  const step = size / 24;
  for (let n = 0; n < 70; n++) {
    let x = Math.floor(rand() * 24) * step;
    let y = Math.floor(rand() * 24) * step;
    const segs = 2 + Math.floor(rand() * 5);
    const gold = rand() < 0.12;
    g.strokeStyle = emissive
      ? gold ? 'rgba(255,190,90,.7)' : `rgba(${60 + rand() * 60},${140 + rand() * 60},255,${0.35 + rand() * 0.4})`
      : gold ? 'rgba(200,160,80,.8)' : 'rgba(70,90,130,.55)';
    g.lineWidth = rand() < 0.2 ? 2.2 : 1.1;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < segs; s++) {
      const dirn = Math.floor(rand() * 4);
      const len = (1 + Math.floor(rand() * 4)) * step;
      if (dirn === 0) x += len; else if (dirn === 1) x -= len;
      else if (dirn === 2) y += len; else y -= len;
      if (rand() < 0.4) { x += step * (rand() < 0.5 ? 1 : -1); y += step; }
      g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = g.strokeStyle;
    g.beginPath();
    g.arc(x, y, 2.4, 0, Math.PI * 2);
    g.fill();
  }
  // Micro chips
  if (!emissive) {
    for (let n = 0; n < 9; n++) {
      const w = step * (1.5 + rand() * 2);
      const x = rand() * (size - w);
      const y = rand() * (size - w);
      g.fillStyle = '#07090e';
      g.fillRect(x, y, w, w * 0.7);
      g.strokeStyle = 'rgba(200,160,80,.5)';
      g.strokeRect(x, y, w, w * 0.7);
    }
  }
  return finish(c, renderer, { repeat: true });
}

// Memory module label/contacts.
export function memoryTexture(renderer) {
  const [c, g] = canvas(256);
  g.fillStyle = '#0d1018';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = '#05070b';
    g.fillRect(18 + i * 58, 40, 46, 120);
    g.strokeStyle = 'rgba(110,150,220,.35)';
    g.strokeRect(18 + i * 58, 40, 46, 120);
  }
  g.fillStyle = '#caa050';
  for (let i = 0; i < 22; i++) g.fillRect(8 + i * 11, 206, 7, 44);
  g.fillStyle = 'rgba(120,200,255,.8)';
  g.fillRect(18, 176, 220, 4);
  return finish(c, renderer);
}

// Soft radial sprite used for glows and volumetric light.
export function glowTexture(renderer) {
  const [c, g] = canvas(128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,.45)');
  grd.addColorStop(0.6, 'rgba(255,255,255,.08)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return finish(c, renderer);
}
