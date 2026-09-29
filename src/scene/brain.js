import * as THREE from 'three';
import { axialPatch } from './geometry.js';
import { createNoise3D, mulberry32 } from './noise.js';
import { smoothstep } from './easing.js';
import {
  brainTissueMaterial,
  membraneMaterial,
  sectionMaterial,
  fiberGeometry,
  fiberMaterial,
  dataParticleMaterial,
  synapseMaterial,
} from './shaders.js';
import { chipTextures, circuitTexture, memoryTexture, glowTexture } from './textures.js';

// Brain ellipsoid inside the cranium (head-local coordinates)
const C = new THREE.Vector3(0.2, 0.2, 0);
const R = new THREE.Vector3(0.8, 0.66, 0.6);
const X1 = 0.08; // A | B cut
const X2 = 0.5; //  B | C cut

const uFromX = (x) => Math.acos(THREE.MathUtils.clamp((x - C.x) / R.x, -1, 1));

// Offsets along the explode axis (fully open, desktop)
export const LAYER_OFFSETS = { A: 0.02, B: 0.72, C: 1.22 };

export function buildBrain(renderer, quality, shared) {
  const q = quality;
  const group = new THREE.Group();
  group.name = 'brain';
  const noise = createNoise3D(19);
  const rand = mulberry32(42);

  // Folded cortex: ridged noise, with a domain warp for worm-like gyri.
  let lastKey = NaN;
  let lastFold = null;
  const fold = (dir) => {
    const key = dir.x * 7919.1 + dir.y * 104.7 + dir.z;
    if (key === lastKey) return lastFold;
    lastKey = key;
    const px = dir.x * 2.6;
    const py = dir.y * 2.6;
    const pz = dir.z * 2.6;
    const w = noise(px * 0.7 + 3.1, py * 0.7, pz * 0.7) * 0.45;
    const n = noise(px + w, py - w, pz + w * 0.5);
    const ridge = 1 - Math.abs(n);
    const fine = noise(px * 3.1, py * 3.1, pz * 3.1);
    lastFold = { ridge: Math.pow(ridge, 2.2), fine };
    return lastFold;
  };

  const tissue = brainTissueMaterial(shared);
  const membrane = membraneMaterial(shared);

  const sliceDefs = [
    { key: 'A', u0: uFromX(X1), u1: Math.PI, capBack: X1 },
    { key: 'B', u0: uFromX(X2), u1: uFromX(X1), capFront: X1, capBack: X2, membrane: true },
    { key: 'C', u0: 0, u1: uFromX(X2), capFront: X2, membrane: true },
  ];

  const slices = {};
  const segU = Math.round(56 * q.mesh);
  const segV = Math.round(150 * q.mesh);
  sliceDefs.forEach((s, si) => {
    const edgeFade = (u) => smoothstep(0, 0.035, u - s.u0) * (s.u1 >= Math.PI - 1e-3 ? 1 : smoothstep(0, 0.035, s.u1 - u));
    const radiusFn = (dir, u) => {
      const f = fold(dir);
      const fissure = 0.07 * Math.exp(-(dir.z * dir.z) / 0.004) * smoothstep(0.1, 0.6, dir.y);
      const fade = s.u0 <= 1e-3 ? smoothstep(0, 0.035, s.u1 - u) : edgeFade(u);
      return 1 + (0.07 * f.ridge + 0.012 * f.fine - fissure) * fade;
    };
    const geo = axialPatch({
      u0: s.u0,
      u1: s.u1,
      segU,
      segV,
      scale: [R.x, R.y, R.z],
      center: [C.x, C.y, C.z],
      radiusFn,
      attribFn: (dir, u) => {
        const f = fold(dir);
        const fade = s.u0 <= 1e-3 ? smoothstep(0, 0.035, s.u1 - u) : edgeFade(u);
        return THREE.MathUtils.lerp(0.18, f.ridge, fade);
      },
    });
    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox.getCenter(center);
    center.y = C.y;
    center.z = C.z;
    geo.translate(-center.x, -center.y, -center.z);

    const grp = new THREE.Group();
    grp.position.copy(center);
    grp.userData.home = center.clone();
    grp.add(new THREE.Mesh(geo, tissue));

    // Cross-section caps
    const addCap = (x, facing) => {
      const k = (x - C.x) / R.x;
      const sr = Math.sqrt(Math.max(0, 1 - k * k));
      const cap = new THREE.Mesh(new THREE.CircleGeometry(1, Math.round(96 * q.mesh)), sectionMaterial(shared, si * 3.7 + (facing > 0 ? 1 : 0)));
      cap.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
      cap.scale.set(R.z * sr * 1.002, R.y * sr * 1.002, 1);
      cap.position.set(x - center.x + facing * 0.001, C.y - center.y, C.z - center.z);
      grp.add(cap);
    };
    if (s.capBack !== undefined) addCap(s.capBack, 1);
    if (s.capFront !== undefined) addCap(s.capFront, -1);

    // Transparent membrane
    if (s.membrane) {
      const mg = axialPatch({
        u0: Math.max(0, s.u0 - 0.02),
        u1: s.u1 + 0.02,
        segU: 24,
        segV: 64,
        scale: [R.x * 1.1, R.y * 1.1, R.z * 1.12],
        center: [C.x - center.x, C.y - center.y, C.z - center.z],
      });
      const mem = new THREE.Mesh(mg, membrane);
      mem.renderOrder = 5;
      grp.add(mem);
    }

    // Synapses & neuron clusters (surface + volume)
    const n = Math.round(q.synapses * (s.key === 'A' ? 0.25 : 0.45));
    const pos = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    const dir = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const u = s.u0 + rand() * (s.u1 - s.u0);
      const v = rand() * Math.PI * 2;
      dir.set(Math.cos(u), Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v));
      const cluster = rand() < 0.55;
      const rr = cluster ? 1.0 + 0.05 * rand() : 0.25 + 0.7 * Math.cbrt(rand());
      pos[i * 3] = C.x + dir.x * R.x * rr - center.x;
      pos[i * 3 + 1] = C.y + dir.y * R.y * rr - center.y;
      pos[i * 3 + 2] = C.z + dir.z * R.z * rr - center.z;
      seeds[i] = rand();
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sg.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const smat = synapseMaterial(shared);
    const pts = new THREE.Points(sg, smat);
    pts.renderOrder = 6;
    grp.add(pts);
    grp.userData.synapseMat = smat;

    group.add(grp);
    slices[s.key] = grp;
  });

  /* ---------------- Central AI processor ---------------- */
  const chipTex = chipTextures(renderer);
  const chip = new THREE.Group();
  chip.name = 'chip';
  const S = 0.52;
  const chipTop = new THREE.MeshStandardMaterial({
    map: chipTex.map,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: chipTex.emissive,
    emissiveIntensity: 0.6,
    metalness: 0.5,
    roughness: 0.32,
  });
  const chipSide = new THREE.MeshStandardMaterial({ color: '#141821', metalness: 0.7, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(S, S, 0.06), [chipSide, chipSide, chipSide, chipSide, chipTop, chipSide]);
  chip.add(body);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(S * 1.18, S * 1.18, 0.03),
    new THREE.MeshStandardMaterial({ color: '#dfe6ef', metalness: 1, roughness: 0.18 }),
  );
  frame.position.z = -0.03;
  chip.add(frame);
  // Gold pins
  const pinGeo = new THREE.BoxGeometry(0.018, 0.05, 0.01);
  const gold = new THREE.MeshStandardMaterial({ color: '#d7a84c', metalness: 1, roughness: 0.25 });
  const pins = new THREE.InstancedMesh(pinGeo, gold, 40);
  const m4 = new THREE.Matrix4();
  let pi = 0;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 10; i++) {
      const t = (i / 9 - 0.5) * S * 0.84;
      const e = S * 0.59 + 0.022;
      const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), side < 2 ? 0 : Math.PI / 2);
      const p = side === 0 ? [t, e, -0.03] : side === 1 ? [t, -e, -0.03] : side === 2 ? [e, t, -0.03] : [-e, t, -0.03];
      m4.compose(new THREE.Vector3(...p), rot, new THREE.Vector3(1, 1, 1));
      pins.setMatrixAt(pi++, m4);
    }
  }
  chip.add(pins);

  // Heat-sink fins behind the die (cooling)
  const fins = new THREE.InstancedMesh(
    new THREE.BoxGeometry(S * 0.9, 0.012, 0.09),
    new THREE.MeshStandardMaterial({ color: '#9aa6b8', metalness: 1, roughness: 0.3 }),
    9,
  );
  for (let i = 0; i < 9; i++) {
    m4.makeTranslation(0, (i / 8 - 0.5) * S * 0.85, -0.1);
    fins.setMatrixAt(i, m4);
  }
  chip.add(fins);

  // Memory modules fanned around the processor
  const memTex = memoryTexture(renderer);
  const memMat = new THREE.MeshStandardMaterial({ map: memTex, metalness: 0.5, roughness: 0.4 });
  const memEdge = new THREE.MeshStandardMaterial({ color: '#0e1118', metalness: 0.6, roughness: 0.4 });
  const memory = [];
  [[0.36, 0.3, -0.12, 0.35], [0.4, -0.02, -0.16, 0.08], [0.34, -0.33, -0.12, -0.3]].forEach(([x, y, z, r]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.018), [memEdge, memEdge, memEdge, memEdge, memMat, memEdge]);
    m.position.set(x, y, z);
    m.rotation.set(0, -0.5, r);
    m.userData.home = m.position.clone();
    chip.add(m);
    memory.push(m);
  });

  // Glow halo behind the chip
  const glowTex = glowTexture(renderer);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: new THREE.Color('#3f8cff'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  }));
  halo.scale.set(1.3, 1.3, 1);
  halo.position.z = -0.02;
  chip.add(halo);
  chip.userData = { chipTop, halo };
  group.add(chip);

  /* ---------------- Circuit board between B and C ---------------- */
  const boardMap = circuitTexture(renderer, 512, 9);
  const boardEm = circuitTexture(renderer, 512, 9, { emissive: true });
  const boardMat = new THREE.MeshStandardMaterial({
    map: boardMap,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: boardEm,
    emissiveIntensity: 0.9,
    metalness: 0.6,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const board = new THREE.Group();
  const boardMesh = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.5, 64, 1, 0, Math.PI * 2), boardMat);
  board.add(boardMesh);
  const micro = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), chipSide, 10);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    m4.makeTranslation(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.012);
    micro.setMatrixAt(i, m4);
  }
  board.add(micro);
  board.rotation.y = -Math.PI / 2 + 0.25;
  board.position.set(X2, C.y, C.z);
  board.userData.home = board.position.clone();
  group.add(board);

  /* ---------------- Transparent mechanical rings ---------------- */
  const rings = [];
  const ringDefs = [
    { x: 0.3, r: 0.8, open: 0.6, tilt: 0.22 },
    { x: 0.55, r: 0.7, open: 0.92, tilt: -0.1 },
    { x: 0.8, r: 0.58, open: 1.5, tilt: 0.12 },
  ];
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#9fc6ff',
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.16,
    clearcoat: 1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#dfe7f1', metalness: 1, roughness: 0.16, transparent: true, opacity: 1 });
  const ringGlowMat = new THREE.MeshBasicMaterial({ color: '#57b6ff', transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false });
  ringDefs.forEach((d, i) => {
    const holder = new THREE.Group();
    holder.position.set(d.x, C.y, C.z);
    holder.userData = { home: holder.position.clone(), def: d };
    const spin = new THREE.Group();
    holder.add(spin);
    const band = new THREE.Mesh(new THREE.RingGeometry(d.r - 0.025, d.r + 0.02, 96), glassMat.clone());
    const torus = new THREE.Mesh(new THREE.TorusGeometry(d.r + 0.02, 0.008, 10, 128), chromeMat.clone());
    const inner = new THREE.Mesh(new THREE.TorusGeometry(d.r - 0.025, 0.003, 6, 128), ringGlowMat.clone());
    const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.022, 0.008), chromeMat.clone(), 24);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      m4.compose(
        new THREE.Vector3(Math.cos(a) * (d.r - 0.01), Math.sin(a) * (d.r - 0.01), 0),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a + Math.PI / 2),
        new THREE.Vector3(1, k % 3 === 0 ? 1.8 : 1, 1),
      );
      ticks.setMatrixAt(k, m4);
    }
    spin.add(band, torus, inner, ticks);
    holder.rotation.y = Math.PI / 2 - 0.55 + d.tilt;
    holder.rotation.x = d.tilt * 0.5;
    holder.userData.mats = [band.material, torus.material, inner.material, ticks.material];
    holder.userData.spin = spin;
    group.add(holder);
    rings.push(holder);
  });

  /* ---------------- Fibre-optic network ---------------- */
  const fibers = [];
  const addFiber = (fromPart, fromLocal, toPart, toLocal, radius, kind = 0) => {
    fibers.push({ fromPart, fromLocal, toPart, toLocal, radius, kind, seed: rand(), bend: new THREE.Vector3((rand() - 0.5) * 0.3, (rand() - 0.5) * 0.5, 0.1 + rand() * 0.3) });
  };
  const insideSlice = (part, x, spread = 0.75) => {
    const k = (x - C.x) / R.x;
    const sr = Math.sqrt(Math.max(0, 1 - k * k));
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * spread;
    return new THREE.Vector3(x, C.y + Math.cos(a) * R.y * sr * rr, C.z + Math.sin(a) * R.z * sr * rr).sub(part.userData.home);
  };
  const chipLocal = (sx, sy) => new THREE.Vector3(sx * S * 0.5, sy * S * 0.5, -0.02);
  for (let i = 0; i < 6; i++) addFiber(chip, chipLocal(-1, (i / 5 - 0.5) * 1.6), slices.A, insideSlice(slices.A, X1 - 0.02), 0.007);
  for (let i = 0; i < 7; i++) addFiber(chip, chipLocal(1, (i / 6 - 0.5) * 1.6), slices.B, insideSlice(slices.B, X1 + 0.004), 0.007);
  for (let i = 0; i < 5; i++) addFiber(chip, chipLocal((i / 4 - 0.5) * 1.6, i % 2 ? 1 : -1), slices.C, insideSlice(slices.C, X2 + 0.004, 0.6), 0.006);
  memory.forEach((m) => addFiber(chip, chipLocal(0.9, 0), chip, m.position.clone(), 0.005, 1));
  for (let i = 0; i < 4; i++) addFiber(slices.B, insideSlice(slices.B, X2 - 0.004, 0.8), slices.C, insideSlice(slices.C, X2 + 0.004, 0.8), 0.006);
  addFiber(slices.C, insideSlice(slices.C, X2 + 0.2, 0.3), rings[2], new THREE.Vector3(ringDefs[2].r, 0, 0), 0.005, 1);
  addFiber(slices.B, insideSlice(slices.B, X1 + 0.2, 0.3), board, new THREE.Vector3(0.3, 0.2, 0), 0.005, 1);

  const FCOUNT = fibers.length;
  const fGeo = fiberGeometry(40, 5);
  const aIdx = new Float32Array(FCOUNT);
  const aRadius = new Float32Array(FCOUNT);
  const aSeed = new Float32Array(FCOUNT);
  const aKind = new Float32Array(FCOUNT);
  fibers.forEach((f, i) => {
    aIdx[i] = i;
    aRadius[i] = f.radius;
    aSeed[i] = f.seed;
    aKind[i] = f.kind;
  });
  fGeo.setAttribute('aIdx', new THREE.InstancedBufferAttribute(aIdx, 1));
  fGeo.setAttribute('aRadius', new THREE.InstancedBufferAttribute(aRadius, 1));
  fGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  fGeo.setAttribute('aKind', new THREE.InstancedBufferAttribute(aKind, 1));
  fGeo.instanceCount = FCOUNT;
  const fMat = fiberMaterial(shared, FCOUNT);
  const fiberMesh = new THREE.Mesh(fGeo, fMat);
  fiberMesh.frustumCulled = false;
  fiberMesh.renderOrder = 7;
  group.add(fiberMesh);

  // Data particles along fibres
  const PCOUNT = q.particles;
  const pg = new THREE.BufferGeometry();
  const jitter = new Float32Array(PCOUNT * 3);
  const pIdx = new Float32Array(PCOUNT);
  const pOff = new Float32Array(PCOUNT);
  const pSpeed = new Float32Array(PCOUNT);
  const pDir = new Float32Array(PCOUNT);
  for (let i = 0; i < PCOUNT; i++) {
    jitter[i * 3] = rand() - 0.5;
    jitter[i * 3 + 1] = rand() - 0.5;
    jitter[i * 3 + 2] = rand() - 0.5;
    pIdx[i] = Math.floor(rand() * FCOUNT);
    pOff[i] = rand();
    pSpeed[i] = 0.12 + rand() * 0.28;
    pDir[i] = rand() < 0.6 ? 0 : 1;
  }
  pg.setAttribute('position', new THREE.BufferAttribute(jitter, 3));
  pg.setAttribute('aIdx', new THREE.BufferAttribute(pIdx, 1));
  pg.setAttribute('aOff', new THREE.BufferAttribute(pOff, 1));
  pg.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeed, 1));
  pg.setAttribute('aDir', new THREE.BufferAttribute(pDir, 1));
  const pMat = dataParticleMaterial(fMat, shared, FCOUNT);
  const dataPts = new THREE.Points(pg, pMat);
  dataPts.frustumCulled = false;
  dataPts.renderOrder = 8;
  group.add(dataPts);

  // Volumetric blue glow behind the brain
  const volume = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: new THREE.Color('#2a5dff'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  }));
  volume.scale.set(4.2, 3.4, 1);
  volume.renderOrder = -1;
  group.add(volume);

  const inside = new THREE.PointLight('#3f74ff', 0, 3.2, 1.6);
  inside.position.copy(C);
  group.add(inside);

  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  const _tmp = new THREE.Vector3();

  function updateFibers(layers) {
    const U = fMat.uniforms;
    for (let i = 0; i < FCOUNT; i++) {
      const f = fibers[i];
      // Anchors are stored in their part's local space
      _a.copy(f.fromLocal).applyMatrix4(f.fromPart.matrix);
      _b.copy(f.toLocal).applyMatrix4(f.toPart.matrix);
      U.uA.value[i].copy(_a);
      U.uD.value[i].copy(_b);
      _tmp.subVectors(_b, _a);
      const bend = f.bend;
      U.uB.value[i].copy(_a).addScaledVector(_tmp, 0.3).addScaledVector(bend, 0.35 * layers);
      U.uC.value[i].copy(_a).addScaledVector(_tmp, 0.7).addScaledVector(bend, 0.22 * layers);
    }
  }

  return {
    group,
    slices,
    chip,
    memory,
    board,
    rings,
    fiberMat: fMat,
    particleMat: pMat,
    membrane,
    volume,
    inside,
    updateFibers,
    center: C.clone(),
    anchors: {
      core: { obj: chip, local: new THREE.Vector3(0, S * 0.5, 0.03) },
      memory: { obj: memory[2], local: new THREE.Vector3(0.1, -0.02, 0) },
      reasoning: { obj: slices.B, local: new THREE.Vector3(0.0, R.y * 0.95, 0.12) },
      language: { obj: slices.C, local: new THREE.Vector3(0.05, R.y * 0.72, 0.28) },
      automation: { obj: rings[2], local: new THREE.Vector3(0, -ringDefs[2].r, 0) },
    },
    X1,
    X2,
    chipSize: S,
  };
}
