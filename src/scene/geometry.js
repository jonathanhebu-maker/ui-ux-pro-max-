import * as THREE from 'three';

// Ellipsoid patch parametrised around the +X axis so cuts perpendicular to X
// (skull seam, brain slices) land exactly on grid lines — no jagged edges.
//   u: angle from +X axis  (0 = back of head, PI = face)
//   v: angle around X axis (0 = +Y top, PI/2 = +Z camera side)
// radiusFn(dir, u, v) -> radial multiplier; scale = [sx, sy, sz].
export function axialPatch({
  u0 = 0,
  u1 = Math.PI,
  v0 = -Math.PI,
  v1 = Math.PI,
  segU = 64,
  segV = 96,
  scale = [1, 1, 1],
  center = [0, 0, 0],
  radiusFn = null,
  attribFn = null, // (dir, u, v) -> number, stored as "aExtra"
}) {
  const cols = segV + 1;
  const count = (segU + 1) * cols;
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const extra = attribFn ? new Float32Array(count) : null;
  const dir = new THREE.Vector3();
  let p = 0;
  for (let i = 0; i <= segU; i++) {
    const u = u0 + ((u1 - u0) * i) / segU;
    const su = Math.sin(u);
    const cu = Math.cos(u);
    for (let j = 0; j <= segV; j++) {
      const v = v0 + ((v1 - v0) * j) / segV;
      dir.set(cu, su * Math.cos(v), su * Math.sin(v));
      const r = radiusFn ? radiusFn(dir, u, v) : 1;
      pos[p * 3] = center[0] + dir.x * r * scale[0];
      pos[p * 3 + 1] = center[1] + dir.y * r * scale[1];
      pos[p * 3 + 2] = center[2] + dir.z * r * scale[2];
      uv[p * 2] = j / segV;
      uv[p * 2 + 1] = i / segU;
      if (extra) extra[p] = attribFn(dir, u, v);
      p++;
    }
  }
  const idx = [];
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = i * cols + j + 1;
      const d = (i + 1) * cols + j + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (extra) g.setAttribute('aExtra', new THREE.BufferAttribute(extra, 1));
  g.setIndex(idx);
  g.computeVertexNormals();

  // Weld normals across the v-seam of full revolutions.
  if (Math.abs(v1 - v0 - Math.PI * 2) < 1e-4) {
    const n = g.attributes.normal;
    for (let i = 0; i <= segU; i++) {
      const a = i * cols;
      const b = i * cols + segV;
      const x = n.getX(a) + n.getX(b);
      const y = n.getY(a) + n.getY(b);
      const z = n.getZ(a) + n.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l);
      n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  return g;
}

// Sample the boundary curve of a patch (for chrome rims / seams).
export function patchEdge({ u, v0, v1, steps = 64, scale, center = [0, 0, 0], radiusFn, inset = 1 }) {
  const pts = [];
  const dir = new THREE.Vector3();
  for (let k = 0; k <= steps; k++) {
    const v = v0 + ((v1 - v0) * k) / steps;
    dir.set(Math.cos(u), Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v));
    const r = (radiusFn ? radiusFn(dir, u, v) : 1) * inset;
    pts.push(new THREE.Vector3(
      center[0] + dir.x * r * scale[0],
      center[1] + dir.y * r * scale[1],
      center[2] + dir.z * r * scale[2],
    ));
  }
  return pts;
}

export function edgeAlongU({ v, u0, u1, steps = 48, scale, center = [0, 0, 0], radiusFn, inset = 1 }) {
  const pts = [];
  const dir = new THREE.Vector3();
  for (let k = 0; k <= steps; k++) {
    const u = u0 + ((u1 - u0) * k) / steps;
    dir.set(Math.cos(u), Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v));
    const r = (radiusFn ? radiusFn(dir, u, v) : 1) * inset;
    pts.push(new THREE.Vector3(
      center[0] + dir.x * r * scale[0],
      center[1] + dir.y * r * scale[1],
      center[2] + dir.z * r * scale[2],
    ));
  }
  return pts;
}

export function tubeFrom(points, radius, material, { closed = false, radial = 8, seg } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, seg || Math.max(16, points.length * 2), radius, radial, closed);
  return new THREE.Mesh(geo, material);
}
