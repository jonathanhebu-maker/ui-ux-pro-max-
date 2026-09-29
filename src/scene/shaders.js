import * as THREE from 'three';

// Shared GLSL helpers
const HASH = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
`;

export const PALETTE = {
  cyan: new THREE.Color('#36c8ff'),
  blue: new THREE.Color('#3f6bff'),
  violet: new THREE.Color('#a45cff'),
  gold: new THREE.Color('#ffc46b'),
};

/* ------------------------------------------------------------------ */
/* Organic cortex tissue with glowing sulci + travelling neural waves   */
/* ------------------------------------------------------------------ */
export function brainTissueMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute float aExtra;
      varying float vRidge;
      varying vec3 vObj;
      varying vec3 vN;
      varying vec3 vView;
      void main(){
        vRidge = aExtra;
        vObj = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uGlow, uPulse, uVoice, uFade;
      uniform vec3 uCyan, uBlue, uViolet, uGold;
      varying float vRidge;
      varying vec3 vObj;
      varying vec3 vN;
      varying vec3 vView;
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(vView);
        if (!gl_FrontFacing) N = -N;
        vec3 L1 = normalize(vec3(-0.4, 0.8, 0.6));
        vec3 L2 = normalize(vec3(0.7, -0.2, 0.5));
        float d1 = max(dot(N, L1), 0.0);
        float d2 = max(dot(N, L2), 0.0);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
        float crest = smoothstep(0.25, 0.95, vRidge);
        float groove = 1.0 - smoothstep(0.05, 0.55, vRidge);

        // pearly graphite tissue
        vec3 deep = vec3(0.05, 0.06, 0.11);
        vec3 tissue = vec3(0.46, 0.49, 0.62);
        vec3 col = mix(deep, tissue, crest * 0.85 + 0.1);
        col *= 0.28 + d1 * 0.75 + d2 * 0.25;
        vec3 H = normalize(L1 + V);
        col += pow(max(dot(N, H), 0.0), 38.0) * 0.45 * crest; // wet highlight

        // neural glow inside the sulci
        float band = 0.5 + 0.5 * sin(vObj.y * 6.0 + vObj.z * 4.0 + uTime * 0.7);
        vec3 neural = mix(mix(uCyan, uBlue, band), uViolet, smoothstep(0.2, 0.9, sin(vObj.x * 5.0 - uTime * 0.4) * 0.5 + 0.5) * 0.6);
        float wave = pow(0.5 + 0.5 * sin(dot(vObj, vec3(-3.2, 1.1, 0.7)) * 3.2 - uTime * (2.2 + uVoice * 3.0)), 8.0);
        float spark = pow(0.5 + 0.5 * sin(vObj.x * 41.0 + vObj.y * 37.0 + vObj.z * 29.0 + uTime * 3.0), 40.0);
        float intensity = uGlow * (0.35 + wave * (0.9 + uPulse * 1.2) + uVoice * 0.6);
        col += neural * groove * intensity;
        col += uGold * spark * groove * 0.35 * uGlow;
        col += mix(uBlue, uViolet, 0.4) * fres * (0.25 + 0.6 * uGlow);
        gl_FragColor = vec4(col * uFade, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/* Transparent membrane around exposed brain layers */
export function membraneMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying float vEdge;
      void main(){ vObj = position; vEdge = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y); vec4 mv = modelViewMatrix * vec4(position,1.0); vView = -mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uOpacity, uVoice;
      uniform vec3 uCyan, uViolet;
      varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying float vEdge;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.6) * vEdge;
        float veins = pow(0.5 + 0.5 * sin(vObj.y * 22.0 + sin(vObj.z * 9.0 + uTime * .3) * 2.0), 18.0);
        vec3 col = mix(uCyan, uViolet, f) * (f * 0.7 + veins * 0.08 * vEdge);
        gl_FragColor = vec4(col * uOpacity * (1.0 + uVoice * 0.6), 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/* Cross-section of a brain slice: cortex band, white matter tracts,
   neuron clusters and micro-circuitry. Geometry is a unit disc in XY. */
export function sectionMaterial(shared, seed = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uSeed: { value: seed } },
    transparent: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv2;
      void main(){ vUv2 = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uGlow, uPulse, uVoice, uSeed, uFade;
      uniform vec3 uCyan, uBlue, uViolet, uGold;
      varying vec2 vUv2;
      ${HASH}
      void main(){
        vec2 p = vUv2;
        float r = length(p);
        float a = atan(p.y, p.x);
        float t = uTime;
        // folded cortex band (gray matter) with sulci cutting inwards
        float wob = vnoise(vec2(a * 3.0 + uSeed, uSeed)) * 0.1;
        float inner = 0.8 + wob;
        float cortex = smoothstep(inner - 0.02, inner + 0.02, r);
        float sulci = smoothstep(0.82, 1.0, sin(a * 24.0 + vnoise(vec2(a * 4.0, uSeed)) * 5.0)) * smoothstep(inner - 0.1, 1.0, r);
        vec3 gray = vec3(0.045, 0.05, 0.1) + vnoise(p * 14.0 + uSeed) * 0.025;
        vec3 white = vec3(0.012, 0.016, 0.04);
        vec3 col = mix(white, gray, cortex);
        col = mix(col, vec3(0.01, 0.015, 0.04), sulci * 0.9);
        col += mix(uBlue, uViolet, 0.4) * sulci * 0.25 * uGlow;
        // cortical laminae (layered structure)
        float lam = smoothstep(0.4, 0.5, abs(sin((r - inner) * 38.0 + vnoise(p * 6.0) * 2.0))) * cortex * 0.035;
        col += lam;
        // white-matter fibre tracts radiating to the centre
        float tracts = pow(abs(sin(a * 46.0 + r * 3.0 + uSeed)), 30.0) * (1.0 - cortex) * smoothstep(0.08, 0.5, r);
        vec3 neural = mix(uCyan, uViolet, 0.5 + 0.5 * sin(a * 2.0 + t * 0.5));
        col += neural * tracts * 0.5 * uGlow;
        // micro circuitry: manhattan traces + pads
        vec2 g = p * 9.0;
        vec2 cell = floor(g);
        vec2 f = fract(g);
        float h = hash12(cell + uSeed * 7.0);
        float lineX = smoothstep(0.06, 0.0, abs(f.y - 0.5)) * step(0.62, h);
        float lineY = smoothstep(0.06, 0.0, abs(f.x - 0.5)) * step(h, 0.2);
        float pad = smoothstep(0.16, 0.08, length(f - 0.5)) * step(0.88, hash12(cell + 3.1));
        float circ = (lineX + lineY) * (1.0 - cortex) * smoothstep(0.05, 0.35, r);
        vec3 circCol = mix(uBlue, uCyan, h);
        col += circCol * circ * 0.6 * uGlow;
        col += mix(uGold, uCyan, step(0.5, h)) * pad * (1.0 - cortex * 0.7) * 0.9 * uGlow;
        // neuron clusters (twinkling)
        vec2 n = p * 26.0;
        vec2 nc = floor(n);
        float nh = hash12(nc + uSeed);
        vec2 np = vec2(hash12(nc + 1.3), hash12(nc + 7.7));
        float nd = length(fract(n) - np);
        float neuron = smoothstep(0.12, 0.0, nd) * step(0.55, nh);
        float tw = 0.5 + 0.5 * sin(t * (2.0 + nh * 4.0) + nh * 30.0);
        col += mix(uCyan, uViolet, nh) * neuron * (0.4 + tw) * uGlow;
        // pulse rings travelling outward from the core
        float rings = pow(0.5 + 0.5 * sin(r * 22.0 - t * (3.0 + uVoice * 4.0)), 14.0) * (1.0 - cortex);
        col += uBlue * rings * (0.25 + uPulse * 0.8 + uVoice * 0.6) * uGlow;
        // glowing core
        col += mix(uCyan, uBlue, r) * smoothstep(0.35, 0.0, r) * (0.35 + uPulse) * uGlow;
        // rim highlight
        col += mix(uCyan, uBlue, 0.5) * smoothstep(0.95, 1.0, r) * 0.45 * uGlow;
        gl_FragColor = vec4(col * uFade, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/* ------------------------------------------------------------------ */
/* Fibre-optic cables: instanced tubes whose centre-line is a cubic    */
/* Bezier evaluated on the GPU, so they stretch as parts separate.     */
/* ------------------------------------------------------------------ */
export function fiberGeometry(segT = 40, radial = 5) {
  const g = new THREE.InstancedBufferGeometry();
  const tArr = [];
  const angArr = [];
  const idx = [];
  for (let i = 0; i <= segT; i++) {
    for (let j = 0; j <= radial; j++) {
      tArr.push(i / segT);
      angArr.push((j / radial) * Math.PI * 2);
    }
  }
  for (let i = 0; i < segT; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const n = tArr.length;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(tArr), 1));
  g.setAttribute('aAng', new THREE.BufferAttribute(new Float32Array(angArr), 1));
  g.setIndex(idx);
  return g;
}

const BEZIER = /* glsl */ `
  vec3 bez(vec3 a, vec3 b, vec3 c, vec3 d, float t){ float it = 1.0 - t; return it*it*it*a + 3.0*it*it*t*b + 3.0*it*t*t*c + t*t*t*d; }
  vec3 bezD(vec3 a, vec3 b, vec3 c, vec3 d, float t){ float it = 1.0 - t; return 3.0*it*it*(b-a) + 6.0*it*t*(c-b) + 3.0*t*t*(d-c); }
`;

export function fiberMaterial(shared, count) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uA: { value: Array.from({ length: count }, () => new THREE.Vector3()) },
      uB: { value: Array.from({ length: count }, () => new THREE.Vector3()) },
      uC: { value: Array.from({ length: count }, () => new THREE.Vector3()) },
      uD: { value: Array.from({ length: count }, () => new THREE.Vector3()) },
      uOpacity: { value: 0 },
      uBeat: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      #define COUNT ${count}
      uniform vec3 uA[COUNT]; uniform vec3 uB[COUNT]; uniform vec3 uC[COUNT]; uniform vec3 uD[COUNT];
      attribute float aT; attribute float aAng;
      attribute float aIdx; attribute float aRadius; attribute float aSeed; attribute float aKind;
      varying float vT; varying float vSeed; varying float vKind; varying float vRim;
      ${BEZIER}
      void main(){
        int i = int(aIdx);
        vec3 P = bez(uA[i], uB[i], uC[i], uD[i], aT);
        vec3 T = normalize(bezD(uA[i], uB[i], uC[i], uD[i], aT) + 1e-5);
        vec3 up = abs(T.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 Nn = normalize(cross(T, up));
        vec3 Bn = cross(T, Nn);
        vec3 off = Nn * cos(aAng) + Bn * sin(aAng);
        float taper = 0.6 + 0.4 * sin(aT * 3.14159);
        vec3 pos = P + off * aRadius * taper;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vec3 nView = normalize(normalMatrix * off);
        vRim = 1.0 - abs(dot(nView, normalize(-mv.xyz)));
        vT = aT; vSeed = aSeed; vKind = aKind;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uOpacity, uBeat, uVoice, uGlow;
      uniform vec3 uCyan, uBlue, uViolet, uGold;
      varying float vT; varying float vSeed; varying float vKind; varying float vRim;
      void main(){
        // beat: 0-.45 inbound (to chip at t=0), .55-1 outbound
        float lag = vSeed * 0.12;
        float bin = clamp((uBeat - lag) / 0.42, 0.0, 1.0);
        float sIn = 1.0 - bin;
        float bout = clamp((uBeat - 0.55 - lag * 0.5) / 0.42, 0.0, 1.0);
        float pIn = exp(-pow((vT - sIn) * 16.0, 2.0)) * step(0.001, bin) * step(bin, 0.999);
        float pOut = exp(-pow((vT - bout) * 16.0, 2.0)) * step(0.001, bout) * step(bout, 0.999);
        float ambient = exp(-pow((vT - fract(uTime * (0.23 + vSeed * 0.2) + vSeed)) * 20.0, 2.0));
        vec3 base = vKind > 0.5 ? uGold * 0.55 : mix(uBlue, uCyan, vRim) * 0.28;
        vec3 pulseCol = vKind > 0.5 ? uGold : mix(uCyan, uViolet, vSeed);
        float pulse = pIn * 1.6 + pOut * 1.2 + ambient * 0.45;
        vec3 col = base * (0.5 + vRim) + pulseCol * pulse * (1.0 + uVoice * 1.4);
        gl_FragColor = vec4(col * uOpacity * (0.4 + 0.6 * uGlow), 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/* Data particles flowing along the fibres */
export function dataParticleMaterial(fiberMat, shared, count) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uA: fiberMat.uniforms.uA,
      uB: fiberMat.uniforms.uB,
      uC: fiberMat.uniforms.uC,
      uD: fiberMat.uniforms.uD,
      uOpacity: { value: 0 },
      uSize: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      #define COUNT ${count}
      uniform vec3 uA[COUNT]; uniform vec3 uB[COUNT]; uniform vec3 uC[COUNT]; uniform vec3 uD[COUNT];
      uniform float uTime, uVoice, uSize;
      attribute float aIdx; attribute float aOff; attribute float aSpeed; attribute float aDir;
      varying float vA; varying float vHue;
      ${BEZIER}
      void main(){
        int i = int(aIdx);
        float t = fract(aOff + uTime * aSpeed * (1.0 + uVoice * 1.5));
        t = aDir > 0.5 ? t : 1.0 - t;
        vec3 P = bez(uA[i], uB[i], uC[i], uD[i], t);
        P += position * 0.02; // jitter around the fibre
        vec4 mv = modelViewMatrix * vec4(P, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (4.0 + 5.0 * fract(aOff * 13.0)) * (6.0 / -mv.z);
        vA = sin(t * 3.14159);
        vHue = fract(aOff * 7.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uCyan, uViolet, uGold;
      varying float vA; varying float vHue;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 col = vHue > 0.93 ? uGold : mix(uCyan, uViolet, vHue);
        gl_FragColor = vec4(col * a * vA * uOpacity, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/* Synapses / neuron clusters twinkling on & inside the brain */
export function synapseMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uOpacity: { value: 0 }, uSize: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uSize, uVoice;
      attribute float aSeed;
      varying float vTw; varying float vSeed;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vTw = pow(0.5 + 0.5 * sin(uTime * (1.5 + aSeed * 3.0 + uVoice * 4.0) + aSeed * 40.0), 3.0);
        vSeed = aSeed;
        gl_PointSize = uSize * (2.5 + vTw * 4.0) * (6.0 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uCyan, uBlue, uViolet, uGold;
      varying float vTw; varying float vSeed;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 col = vSeed > 0.95 ? uGold : (vSeed > 0.6 ? uViolet : (vSeed > 0.3 ? uCyan : uBlue));
        gl_FragColor = vec4(col * a * (0.25 + vTw) * uOpacity, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}
