import * as THREE from 'three';
import { axialPatch, patchEdge, edgeAlongU, tubeFrom } from './geometry.js';
import { smoothstep } from './easing.js';
import { circuitTexture } from './textures.js';

// Head is an ellipsoid sculpted by a radial function. The face looks toward
// local -X, the back of the skull (which opens) points toward local +X.
export const HEAD_SCALE = [1.08, 1.2, 0.9];
export const SEAM_DX = 0.1; // seam position in direction space (cos u)
const U_SEAM = Math.acos(SEAM_DX);

const g = (v, c, s) => Math.exp(-((v - c) * (v - c)) / (2 * s * s));

export function headRadius(d) {
  const x = d.x;
  const y = d.y;
  const z = d.z;
  const az = Math.abs(z);
  const fw = smoothstep(0.05, 0.7, -x); // weight of the face region
  let r = 1;

  // Cranium: fuller occipital bulge, slight forehead slope
  r += 0.05 * g(y, 0.25, 0.4) * smoothstep(0.0, 0.8, x);
  r -= 0.035 * fw * smoothstep(0.35, 0.85, y);

  // Face plane: flatten the sides so the face reads as a mask
  r -= 0.07 * fw * smoothstep(0.18, 0.75, az);

  // Brow ridge & eye sockets
  r += 0.045 * fw * g(y, 0.27, 0.06) * g(z, 0, 0.42);
  r -= 0.075 * fw * g(y, 0.13, 0.065) * (g(z, 0.31, 0.11) + g(z, -0.31, 0.11));

  // Nose: bridge + tip
  r += fw * (0.05 * g(z, 0, 0.055) * g(y, 0.1, 0.09) + 0.19 * g(z, 0, 0.07) * g(y, -0.11, 0.1));
  r -= 0.03 * fw * g(y, -0.25, 0.03) * g(z, 0, 0.12); // under-nose

  // Cheekbones
  r += 0.03 * fw * g(y, -0.02, 0.1) * (g(z, 0.45, 0.1) + g(z, -0.45, 0.1));

  // Lips
  r += 0.07 * fw * g(y, -0.33, 0.045) * g(z, 0, 0.19);
  r -= 0.028 * fw * g(y, -0.385, 0.014) * g(z, 0, 0.17);
  r += 0.05 * fw * g(y, -0.44, 0.04) * g(z, 0, 0.16);
  r -= 0.02 * fw * g(y, -0.51, 0.03) * g(z, 0, 0.2);

  // Chin & jaw
  r += 0.08 * fw * g(y, -0.64, 0.085) * g(z, 0, 0.24);
  r -= 0.14 * smoothstep(-0.3, -0.85, y) * smoothstep(0.1, 0.7, az);

  // Underside behind the jaw retracts toward the neck
  r -= 0.28 * smoothstep(-0.45, -0.95, y) * smoothstep(-0.35, 0.35, x);
  return r;
}

const _d = new THREE.Vector3();
export function headSurfacePoint(y, z, lift = 1.004, out = new THREE.Vector3()) {
  const x = -Math.sqrt(Math.max(0, 1 - y * y - z * z));
  _d.set(x, y, z).normalize();
  const r = headRadius(_d) * lift;
  return out.set(_d.x * r * HEAD_SCALE[0], _d.y * r * HEAD_SCALE[1], _d.z * r * HEAD_SCALE[2]);
}

export function createMaterials(renderer) {
  const innerMap = circuitTexture(renderer, 512, 5);
  innerMap.repeat.set(3, 2);
  const innerEm = circuitTexture(renderer, 512, 5, { emissive: true });
  innerEm.repeat.set(3, 2);
  return {
    ceramic: new THREE.MeshPhysicalMaterial({
      color: '#e6eaf1',
      roughness: 0.36,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      sheen: 0.25,
      sheenColor: new THREE.Color('#bcd2ff'),
    }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e3e9f2', metalness: 1, roughness: 0.14 }),
    graphite: new THREE.MeshStandardMaterial({ color: '#1a1e27', metalness: 0.55, roughness: 0.42 }),
    seam: new THREE.MeshStandardMaterial({ color: '#0b0d12', metalness: 0.3, roughness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: '#d4a64a', metalness: 1, roughness: 0.28 }),
    inner: new THREE.MeshStandardMaterial({
      color: '#161a22',
      metalness: 0.6,
      roughness: 0.45,
      map: innerMap,
      emissive: new THREE.Color('#3c6dff'),
      emissiveMap: innerEm,
      emissiveIntensity: 0,
      side: THREE.BackSide,
    }),
    rim: new THREE.MeshStandardMaterial({
      color: '#d9e2ee',
      metalness: 1,
      roughness: 0.2,
      emissive: new THREE.Color('#3aa0ff'),
      emissiveIntensity: 0,
    }),
    glowLine: new THREE.MeshBasicMaterial({ color: '#5fb8ff', transparent: true, opacity: 0.0, toneMapped: false }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#a9ccff',
      metalness: 0,
      roughness: 0.06,
      transparent: true,
      opacity: 0.2,
      clearcoat: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };
}

/* Rear panels: [v0, v1] around the X axis, gap between them is the seam */
export const REAR_PANELS = [
  { key: 'top', v0: -0.98, v1: 0.98, dist: 1.9, lift: [0, 0.1, 0], rot: [0, -0.2, -0.1] },
  { key: 'near', v0: 1.01, v1: 2.52, dist: 2.05, lift: [0, -0.02, 0.26], rot: [0.08, -0.34, 0] },
  { key: 'low', v0: 2.55, v1: Math.PI * 2 - 1.01, dist: 1.75, lift: [0, -0.14, -0.1], rot: [-0.06, -0.12, 0.08] },
];

export function buildRobot(renderer, quality) {
  const M = createMaterials(renderer);
  const q = quality;
  const root = new THREE.Group();
  root.name = 'robot';

  // Head pivot sits at the top of the neck so rotations feel anatomical
  const headPivot = new THREE.Group();
  headPivot.position.set(0.12, -0.78, 0);
  root.add(headPivot);
  const head = new THREE.Group();
  head.position.set(-0.12, 0.78, 0);
  headPivot.add(head);

  const radiusFn = (d) => headRadius(d);

  // --- Front shell (face) ---
  const frontGeo = axialPatch({
    u0: U_SEAM,
    u1: Math.PI,
    segU: Math.round(110 * q.mesh),
    segV: Math.round(200 * q.mesh),
    scale: HEAD_SCALE,
    radiusFn,
  });
  const face = new THREE.Mesh(frontGeo, M.ceramic);
  const faceInner = new THREE.Mesh(frontGeo, M.inner);
  head.add(face, faceInner);

  // Chrome rim along the seam of the face shell
  const seamPts = patchEdge({ u: U_SEAM, v0: -Math.PI, v1: Math.PI, steps: 120, scale: HEAD_SCALE, radiusFn, inset: 0.995 });
  const seamRim = tubeFrom(seamPts, 0.017, M.rim, { closed: true, seg: 200 });
  head.add(seamRim);

  // --- Rear skull panels (these open to the right) ---
  const panels = REAR_PANELS.map((p) => {
    const geo = axialPatch({
      u0: 0,
      u1: U_SEAM - 0.012,
      v0: p.v0,
      v1: p.v1,
      segU: Math.round(44 * q.mesh),
      segV: Math.round(70 * q.mesh),
      scale: HEAD_SCALE,
      radiusFn,
    });
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, -c.z);
    const grp = new THREE.Group();
    grp.position.copy(c);
    grp.userData = { home: c.clone(), cfg: p };
    grp.add(new THREE.Mesh(geo, M.ceramic), new THREE.Mesh(geo, M.inner));
    // Rims: seam edge + both side edges
    const off = [-c.x, -c.y, -c.z];
    const e1 = patchEdge({ u: U_SEAM - 0.012, v0: p.v0, v1: p.v1, steps: 40, scale: HEAD_SCALE, center: off, radiusFn, inset: 0.994 });
    const e2 = edgeAlongU({ v: p.v0, u0: 0.02, u1: U_SEAM - 0.012, steps: 30, scale: HEAD_SCALE, center: off, radiusFn, inset: 0.994 });
    const e3 = edgeAlongU({ v: p.v1, u0: 0.02, u1: U_SEAM - 0.012, steps: 30, scale: HEAD_SCALE, center: off, radiusFn, inset: 0.994 });
    grp.add(tubeFrom(e1, 0.014, M.rim), tubeFrom(e2, 0.011, M.rim), tubeFrom(e3, 0.011, M.rim));
    head.add(grp);
    return grp;
  });

  // --- Face details: closed eyelids, glow, mouth, face-plate seam ---
  const faceDetail = new THREE.Group();
  head.add(faceDetail);
  const eyeGlows = [];
  for (const side of [1, -1]) {
    const lid = [];
    const glow = [];
    for (let k = 0; k <= 16; k++) {
      const s = k / 16 - 0.5;
      const z = side * (0.31 + s * 0.2);
      const yy = 0.118 + 0.01 * (1 - 4 * s * s);
      lid.push(headSurfacePoint(yy, z, 1.003));
      glow.push(headSurfacePoint(yy - 0.012, z, 1.001));
    }
    faceDetail.add(tubeFrom(lid, 0.0042, M.seam, { radial: 6 }));
    const gl = tubeFrom(glow, 0.0038, M.glowLine, { radial: 5 });
    faceDetail.add(gl);
    eyeGlows.push(gl);
  }

  // Mouth (moves very subtly when the agent speaks)
  const mouth = new THREE.Group();
  const mouthPts = [];
  for (let k = 0; k <= 20; k++) {
    const s = k / 20 - 0.5;
    mouthPts.push(headSurfacePoint(-0.386 + 0.012 * 4 * s * s, s * 0.26, 1.001));
  }
  const mouthLine = tubeFrom(mouthPts, 0.006, M.seam, { radial: 6 });
  const lowerLip = new THREE.Group();
  const lipPts = [];
  for (let k = 0; k <= 20; k++) {
    const s = k / 20 - 0.5;
    lipPts.push(headSurfacePoint(-0.395 + 0.01 * 4 * s * s, s * 0.22, 1.0));
  }
  const mouthGlow = tubeFrom(lipPts, 0.0035, M.glowLine, { radial: 5 });
  lowerLip.add(mouthGlow);
  mouth.add(mouthLine, lowerLip);
  faceDetail.add(mouth);

  // Face plate outline — reads as a sculpted mask
  const plate = [
    [0.8, 0.2], [0.72, 0.36], [0.56, 0.54], [0.28, 0.64], [-0.02, 0.64], [-0.32, 0.57],
    [-0.56, 0.42], [-0.7, 0.22], [-0.76, 0], [-0.7, -0.22], [-0.56, -0.42], [-0.32, -0.57],
    [-0.02, -0.64], [0.28, -0.64], [0.56, -0.54], [0.72, -0.36], [0.8, -0.2], [0.83, 0],
  ].map(([y, z]) => headSurfacePoint(y, z, 1.002));
  faceDetail.add(tubeFrom(plate, 0.0042, M.seam, { closed: true, radial: 5, seg: 180 }));
  // Temple accent lines
  for (const side of [1, -1]) {
    const pts = [[0.46, 0.62], [0.3, 0.72], [0.1, 0.76]].map(([y, z]) => headSurfacePoint(y, side * z, 1.002));
    faceDetail.add(tubeFrom(pts, 0.004, M.chrome, { radial: 5 }));
  }

  // --- Ear modules ---
  for (const side of [1, -1]) {
    const ear = new THREE.Group();
    const p = new THREE.Vector3(-0.2, 0.02, side * 0.97).normalize();
    const r = headRadius(p);
    ear.position.set(p.x * r * HEAD_SCALE[0], p.y * r * HEAD_SCALE[1], p.z * r * HEAD_SCALE[2]);
    ear.lookAt(ear.position.clone().multiply(new THREE.Vector3(0.4, 0.4, 1.4)));
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.06, 48), M.ceramic);
    disc.rotation.x = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 12, 64), M.chrome);
    ring.position.z = 0.03;
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 40), M.graphite);
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.03;
    const light = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.005, 8, 64), M.glowLine);
    light.position.z = 0.058;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 16), M.chrome);
    cap.scale.z = 0.5;
    cap.position.z = 0.06;
    ear.add(disc, ring, core, light, cap);
    head.add(ear);
  }

  // --- Neck ---
  const neck = new THREE.Group();
  root.add(neck);
  const neckCore = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.34, 1.35, 40, 1, true), M.graphite);
  neckCore.position.set(0.14, -1.45, 0);
  neck.add(neckCore);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29 + i * 0.02, 0.012, 10, 48), M.chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0.14, -1.2 - i * 0.28, 0);
    neck.add(ring);
  }
  const throat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.37, 1.05, 40, 1, true, Math.PI * 0.95, Math.PI * 1.1),
    M.ceramic,
  );
  throat.position.set(0.12, -1.5, 0);
  neck.add(throat);
  // Cables at the back of the neck
  for (const [dz, rad] of [[0.12, 0.035], [-0.12, 0.035], [0, 0.045]]) {
    const pts = [
      new THREE.Vector3(0.42, -0.72, dz),
      new THREE.Vector3(0.5, -1.2, dz * 1.2),
      new THREE.Vector3(0.47, -1.7, dz * 1.4),
      new THREE.Vector3(0.62, -2.1, dz * 1.8),
    ];
    neck.add(tubeFrom(pts, rad, M.graphite, { radial: 10 }));
  }

  // --- Torso / shoulders ---
  const torso = new THREE.Group();
  root.add(torso);
  const profile = [
    [0.33, 0.1], [0.5, 0.02], [0.8, -0.1], [1.15, -0.26], [1.42, -0.45], [1.56, -0.68],
    [1.6, -0.95], [1.56, -1.4], [1.48, -2.1], [1.42, -2.8],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const lathe = new THREE.LatheGeometry(profile, Math.round(96 * q.mesh));
  const chest = new THREE.Mesh(lathe, new THREE.MeshPhysicalMaterial({
    color: '#e9edf3', roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.2, side: THREE.DoubleSide,
  }));
  chest.scale.set(0.5, 1, 1);
  chest.position.set(0.14, -2.0, 0);
  torso.add(chest);
  // Collar ring + chest seams
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.028, 12, 64), M.chrome);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0.14, -1.93, 0);
  torso.add(collar);
  for (const side of [1, -1]) {
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      const ang = side * (0.25 + t * 1.15);
      const y = -2.02 - Math.sin(t * Math.PI * 0.9) * 0.28 - t * 0.35;
      pts.push(new THREE.Vector3(0.14 - Math.cos(ang) * 0.5 * (0.5 + t * 1.05) * 0.99, y, Math.sin(ang) * (0.5 + t * 1.05) * 0.99));
    }
    torso.add(tubeFrom(pts, 0.006, M.seam, { radial: 5 }));
    // Shoulder joints
    const sh = new THREE.Group();
    sh.position.set(0.16, -2.62, side * 1.5);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.36, 40, 28), M.ceramic);
    const jr = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 10, 56), M.chrome);
    jr.rotation.y = Math.PI / 2;
    jr.rotation.x = 0.4 * side;
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.2, 8, 28), M.ceramic);
    arm.position.set(0.02, -0.9, side * 0.08);
    const armBand = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.012, 8, 48), M.graphite);
    armBand.rotation.x = Math.PI / 2;
    armBand.position.set(0.02, -0.55, side * 0.06);
    sh.add(ball, jr, arm, armBand);
    torso.add(sh);
  }
  // Sternum status light (very restrained)
  const status = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.22, 4, 10), M.glowLine);
  status.position.set(0.14 - 0.52 * 0.5 * 1.02, -2.55, 0);
  torso.add(status);

  return {
    root,
    headPivot,
    head,
    panels,
    faceDetail,
    mouth: lowerLip,
    eyeGlows,
    torso,
    neck,
    materials: M,
  };
}
