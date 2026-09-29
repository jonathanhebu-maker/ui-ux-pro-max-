import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildRobot } from './robot.js';
import { buildBrain, LAYER_OFFSETS } from './brain.js';
import { sampleTimeline } from './timeline.js';
import { PALETTE } from './shaders.js';
import { smoothstep, lerp, clamp01 } from './easing.js';

const TURN = 0.38; // robot yaw: face turned slightly toward the camera
// Explode axis in head space: pure screen-right once the yaw is applied
const EXPLODE = new THREE.Vector3(1, 0, Math.tan(TURN)).normalize();

const yieldToMain = () => new Promise((r) => setTimeout(r, 0));

export async function createStage({ container, tier, reducedMotion, onFrame }) {
  const quality = tier;
  const renderer = new THREE.WebGLRenderer({
    antialias: tier.name !== 'low',
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.2;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    'רובוט AI תלת־ממדי בפרופיל צד — החלק האחורי של הגולגולת נפתח ימינה וחושף מוח מלאכותי עם מעבד AI מרכזי',
  );
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);

  // Lighting: cool key on the face, blue rim from behind, violet fill
  const key = new THREE.DirectionalLight('#f1f5ff', 1.7);
  key.position.set(-6, 6, 3.5);
  const rim = new THREE.DirectionalLight('#3d7bff', 4.2);
  rim.position.set(5, 2.5, -4);
  const fill = new THREE.DirectionalLight('#8a5cff', 1.1);
  fill.position.set(3, -3, 3);
  const top = new THREE.DirectionalLight('#9cc4ff', 0.8);
  top.position.set(0, 6, 1);
  scene.add(key, rim, fill, top, new THREE.AmbientLight('#1a2140', 0.6));

  // Shared shader uniforms
  const shared = {
    uTime: { value: 0 },
    uGlow: { value: 0 },
    uPulse: { value: 0 },
    uVoice: { value: 0 },
    uFade: { value: 0 },
    uCyan: { value: PALETTE.cyan },
    uBlue: { value: PALETTE.blue },
    uViolet: { value: PALETTE.violet },
    uGold: { value: PALETTE.gold },
  };

  await yieldToMain();
  const robot = buildRobot(renderer, quality);
  await yieldToMain();
  const brain = buildBrain(renderer, quality, shared);
  await yieldToMain();
  robot.head.add(brain.group);
  robot.root.rotation.y = TURN;
  scene.add(robot.root);

  // ---------- state ----------
  const state = {
    width: 1,
    height: 1,
    explode: 1,
    layerScale: 1,
    framing: { x: 0.72, y: 0.46, w: 0.54, h: 0.72 },
    scroll: 0,
    mouse: new THREE.Vector2(),
    mouseTarget: new THREE.Vector2(),
    voice: 0,
    voiceTarget: 0,
    speaking: false,
    beat: 0,
    time: 0,
    running: false,
    visible: true,
    pageVisible: !document.hidden,
    dpr: Math.min(window.devicePixelRatio || 1, tier.maxDpr),
    maxDpr: Math.min(window.devicePixelRatio || 1, tier.maxDpr),
    frames: 0,
    acc: 0,
    lastAdapt: 0,
    camBase: new THREE.Vector3(),
    camLook: new THREE.Vector3(),
  };

  const camTarget = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const brainWorld = new THREE.Vector3();

  function layout() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    state.width = w;
    state.height = h;
    renderer.setPixelRatio(state.dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const vw = window.innerWidth;
    let frame;
    if (vw > 1100) {
      state.explode = 1;
      state.layerScale = 1;
      frame = { left: 0.5, right: 0.97, top: 0.16, bottom: 0.86, ymin: -2.1 };
    } else if (vw > 760) {
      state.explode = 0.8;
      state.layerScale = 0.9;
      frame = { left: 0.06, right: 0.94, top: 0.17, bottom: 0.95, ymin: -2.0 };
    } else {
      state.explode = 0.6;
      state.layerScale = 0.8;
      frame = { left: 0.03, right: 0.97, top: 0.15, bottom: 0.96, ymin: -1.85 };
    }
    // World-space bounding box of the full composition (head + exploded brain)
    const xmin = -1.35;
    const xmax = 1.2 + 2.05 * state.explode + 0.55;
    const ymax = 1.42;
    const ymin = frame.ymin;
    const rw = (frame.right - frame.left) * w;
    const rh = (frame.bottom - frame.top) * h;
    const ppu = Math.min(rw / (xmax - xmin), rh / (ymax - ymin));
    state.ppu = ppu;
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const worldH = h / ppu;
    const dist = worldH / (2 * Math.tan(fovRad / 2));
    const cx = (xmin + xmax) / 2;
    const cy = (ymin + ymax) / 2;
    const rx = ((frame.left + frame.right) / 2) * w;
    const ry = ((frame.top + frame.bottom) / 2) * h;
    const camX = cx - (rx - w / 2) / ppu;
    const camY = cy + (ry - h / 2) / ppu;
    state.camBase.set(camX, camY, dist);
    state.camLook.set(camX, camY, 0);
    camera.updateProjectionMatrix();
  }

  // ---------- per-frame update ----------
  const panelHome = robot.panels.map((p) => p.userData.home.clone());
  function update(dt) {
    state.time += dt;
    const t = state.time;
    const tl = sampleTimeline(t, { reducedMotion });

    // Smooth inputs
    const k = 1 - Math.exp(-dt * 3.2);
    state.mouse.lerp(state.mouseTarget, k);
    state.voice += (state.voiceTarget - state.voice) * (1 - Math.exp(-dt * 10));
    const voice = state.voice;

    // Scroll closes the brain partially and pushes the camera toward it
    const sp = smoothstep(0.02, 0.75, state.scroll);
    const closeBy = 1 - 0.55 * sp;
    const E = state.explode;
    const L = state.layerScale;

    const shell = tl.shell * closeBy;
    const rings = tl.rings * closeBy;
    const layers = tl.layers * closeBy;
    const chipShow = Math.max(tl.chip, smoothstep(0.05, 0.35, state.scroll) * tl.neural);
    const light = Math.max(tl.light, 0.3 * tl.neural);

    shared.uTime.value = t;
    shared.uFade.value = tl.fade;
    shared.uGlow.value = light * (1 + voice * 0.5);
    shared.uVoice.value = voice;
    renderer.toneMappingExposure = 0.15 + 0.95 * tl.fade;

    // Neural beat: inbound → chip flash → outbound
    const beatRate = (1 / 2.6) * (1 + voice * 1.3) * (reducedMotion ? 0.4 : 1);
    state.beat = (state.beat + dt * beatRate) % 1;
    const flash = Math.exp(-Math.pow((state.beat - 0.5) / 0.07, 2));
    shared.uPulse.value = flash * light;

    // Idle life: breathing + tiny neck & shoulder movement
    const breathe = reducedMotion ? 0 : Math.sin(t * 1.1);
    robot.torso.scale.set(1, 1 + breathe * 0.006, 1 + breathe * 0.004);
    robot.torso.position.y = breathe * 0.008;
    robot.neck.position.y = breathe * 0.006;

    const mx = state.mouse.x;
    const my = state.mouse.y;
    const hp = robot.headPivot;
    hp.rotation.y = (reducedMotion ? 0 : Math.sin(t * 0.37) * 0.012) + mx * tier.headRot;
    hp.rotation.z = (reducedMotion ? 0 : Math.sin(t * 0.29 + 1) * 0.01) + my * tier.headRot * 0.6 + breathe * 0.004;
    hp.position.y = -0.78 + breathe * 0.008;

    // Eyes (softly closed) + mouth
    const eyeOn = tl.neural * (0.35 + 0.4 * light + voice * 0.4);
    robot.materials.glowLine.opacity = eyeOn;
    const speakAmp = state.speaking ? voice : 0;
    robot.mouth.position.y = -0.012 * speakAmp * (0.6 + 0.4 * Math.sin(t * 17));
    robot.mouth.scale.set(1, 1, 1 + speakAmp * 0.06);

    // ---- Rear skull panels ----
    const unlockPop = Math.sin(Math.PI * clamp01(tl.unlock)) * 0.5 + tl.unlock * 0.5;
    robot.panels.forEach((p, i) => {
      const cfg = p.userData.cfg;
      const home = panelHome[i];
      const outward = tmpV.copy(home).normalize();
      const par = tier.parallax ? 0.06 : 0;
      p.position.copy(home)
        .addScaledVector(outward, 0.035 * unlockPop)
        .addScaledVector(EXPLODE, cfg.dist * E * shell)
        .add(tmpV.set(cfg.lift[0], cfg.lift[1], cfg.lift[2]).multiplyScalar(shell * E));
      p.position.x += mx * par * 2.2;
      p.position.y += my * par * 1.2;
      p.rotation.set(cfg.rot[0] * shell, cfg.rot[1] * shell, cfg.rot[2] * shell);
    });
    robot.materials.rim.emissiveIntensity = 0.15 * tl.neural + Math.sin(Math.PI * clamp01(tl.unlock)) * 1.6 + voice * 0.4;
    robot.materials.inner.emissiveIntensity = 0.12 + light * 0.9 + voice * 0.3;

    // ---- Brain layers ----
    const par = tier.parallax ? 0.045 : 0;
    const { slices, chip, board } = brain;
    const setLayer = (obj, off, rotY, pk) => {
      obj.position.copy(obj.userData.home).addScaledVector(EXPLODE, off);
      obj.position.x += mx * par * pk;
      obj.position.y += my * par * pk * 0.6;
      obj.rotation.y = rotY;
    };
    setLayer(slices.A, LAYER_OFFSETS.A * layers, 0, 0.2);
    setLayer(slices.B, LAYER_OFFSETS.B * L * layers, -0.1 * layers, 0.8);
    setLayer(slices.C, LAYER_OFFSETS.C * L * layers, -0.2 * layers, 1.25);

    // Chip slides out of slice B into the A|B gap
    const gap = (LAYER_OFFSETS.B * L * layers) / 2;
    chip.position.set(brain.X1, brain.center.y - 0.02, 0.4).addScaledVector(EXPLODE, gap + 0.02 + (1 - chipShow) * 0.12);
    chip.position.x += mx * par * 0.55;
    chip.position.y += my * par * 0.35;
    chip.rotation.set(-0.08, -TURN + 0.1 - mx * 0.05, 0);
    const cs = 0.35 + 0.65 * chipShow;
    chip.scale.setScalar(Math.max(0.001, cs * (layers > 0.02 || chipShow > 0.5 ? 1 : 0)));
    chip.visible = chipShow > 0.01;
    const chipGlow = chipShow * (0.45 + light * 0.5 + flash * 1.6 + voice * 0.9);
    chip.userData.chipTop.emissiveIntensity = chipGlow;
    chip.userData.halo.material.opacity = Math.min(1, chipShow * (0.25 + flash * 0.55 + voice * 0.35));
    chip.userData.halo.scale.setScalar(1.1 + flash * 0.35 + voice * 0.3);
    brain.memory.forEach((m, i) => {
      m.position.copy(m.userData.home).multiplyScalar(0.6 + 0.4 * layers);
      m.rotation.z = [0.35, 0.08, -0.3][i] * layers;
    });

    board.position.copy(board.userData.home).addScaledVector(EXPLODE, ((LAYER_OFFSETS.B + LAYER_OFFSETS.C) / 2) * L * layers);
    board.position.x += mx * par;
    board.scale.setScalar(Math.max(0.001, layers));
    board.visible = layers > 0.02;

    brain.rings.forEach((r, i) => {
      const d = r.userData.def;
      r.position.copy(r.userData.home).addScaledVector(EXPLODE, d.open * E * rings);
      r.position.x += mx * par * (1.4 + i * 0.2);
      r.position.y += my * par * (0.8 + i * 0.1);
      r.userData.spin.rotation.z = t * (0.08 + i * 0.05) * (i % 2 ? -1 : 1) + rings * 0.6;
      const op = smoothstep(0.02, 0.5, rings);
      const mats = r.userData.mats;
      mats[0].opacity = 0.08 * op;
      mats[1].opacity = op;
      mats[2].opacity = (0.35 + 0.5 * light + voice * 0.4) * op;
      mats[3].opacity = op;
      r.visible = op > 0.001;
    });

    // Membranes, synapses, fibres, data particles
    brain.membrane.uniforms.uOpacity.value = 0.55 * layers * light;
    for (const key of ['A', 'B', 'C']) {
      const sm = slices[key].userData.synapseMat;
      sm.uniforms.uOpacity.value = (0.3 + 0.7 * light) * (key === 'A' ? 0.6 : 1) * tl.neural;
      sm.uniforms.uSize.value = state.dpr * tier.pointScale;
    }
    brain.fiberMat.uniforms.uOpacity.value = smoothstep(0.05, 0.6, layers) * (0.7 + 0.3 * light);
    brain.fiberMat.uniforms.uBeat.value = state.beat;
    brain.particleMat.uniforms.uOpacity.value = tl.particles * closeBy * (0.8 + voice * 0.6);
    brain.particleMat.uniforms.uSize.value = state.dpr * tier.pointScale;
    brain.volume.material.opacity = (0.12 + 0.2 * light + voice * 0.25) * tl.fade;
    brain.volume.position.set(brain.center.x, brain.center.y, -0.6).addScaledVector(EXPLODE, 0.9 * E * layers);
    brain.inside.intensity = (0.4 + light * 3.2 + flash * 1.5 + voice * 2) * tl.neural;
    brain.inside.position.copy(brain.center).addScaledVector(EXPLODE, 0.5 * layers);

    robot.root.updateMatrixWorld(true);
    brain.updateFibers(layers);

    // Camera: gentle drift + scroll push toward the brain
    brain.group.localToWorld(brainWorld.copy(brain.center).addScaledVector(EXPLODE, 0.3 * layers));
    const push = sp;
    camTarget.copy(state.camBase);
    camTarget.x = lerp(camTarget.x, brainWorld.x, 0.35 * push);
    camTarget.y = lerp(camTarget.y, brainWorld.y, 0.25 * push);
    camTarget.z *= 1 - 0.16 * push;
    if (!reducedMotion) {
      camTarget.x += Math.sin(t * 0.13) * 0.03;
      camTarget.y += Math.sin(t * 0.17) * 0.02;
    }
    camera.position.copy(camTarget);
    camera.lookAt(camTarget.x, camTarget.y, 0);

    // Callouts become available once the brain is fully open
    const labelsOn = tl.layers > 0.94 && sp < 0.35 && (reducedMotion || tl.openHold >= 0);
    onFrame?.({
      t,
      tl,
      labelsOn,
      openHold: reducedMotion ? 10 : tl.openHold,
      voice,
      project,
      scroll: state.scroll,
      unit: (state.ppu || 131) / 131,
    });
  }

  // Project a named anchor to container pixels
  const proj = new THREE.Vector3();
  function project(name, out = { x: 0, y: 0, z: 0 }) {
    const a = brain.anchors[name];
    if (!a) return null;
    proj.copy(a.local);
    a.obj.localToWorld(proj);
    proj.project(camera);
    out.x = (proj.x * 0.5 + 0.5) * state.width;
    out.y = (-proj.y * 0.5 + 0.5) * state.height;
    out.z = proj.z;
    return out;
  }

  // ---------- adaptive resolution ----------
  function adapt(dt) {
    state.frames++;
    state.acc += dt;
    if (state.frames < 90) return;
    const avg = state.acc / state.frames;
    state.frames = 0;
    state.acc = 0;
    const now = performance.now();
    if (now - state.lastAdapt < 2500) return;
    if (avg > 1 / 45 && state.dpr > 0.75) {
      state.dpr = Math.max(0.75, state.dpr - 0.25);
      state.lastAdapt = now;
      renderer.setPixelRatio(state.dpr);
      renderer.setSize(state.width, state.height, false);
    } else if (avg < 1 / 58 && state.dpr < state.maxDpr) {
      state.dpr = Math.min(state.maxDpr, state.dpr + 0.25);
      state.lastAdapt = now;
      renderer.setPixelRatio(state.dpr);
      renderer.setSize(state.width, state.height, false);
    }
  }

  // ---------- loop ----------
  let raf = 0;
  let last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    renderer.render(scene, camera);
    adapt(dt);
  }
  function start() {
    if (state.running) return;
    state.running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    state.running = false;
    cancelAnimationFrame(raf);
  }
  const sync = () => (state.visible && state.pageVisible ? start() : stop());

  const io = new IntersectionObserver(([e]) => {
    state.visible = e.isIntersecting;
    sync();
  });
  io.observe(container);
  const onVis = () => {
    state.pageVisible = !document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVis);

  const ro = new ResizeObserver(() => layout());
  ro.observe(container);

  const onPointer = (e) => {
    state.mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  if (tier.mouse && !reducedMotion) window.addEventListener('pointermove', onPointer, { passive: true });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
  });
  canvas.addEventListener('webglcontextrestored', () => sync());

  layout();
  // Compile shaders up-front to avoid a hitch when the brain first opens
  renderer.compile(scene, camera);
  await yieldToMain();
  sync();

  return {
    setScroll(p) {
      state.scroll = clamp01(p);
    },
    setVoice(level, speaking = false) {
      state.voiceTarget = clamp01(level);
      state.speaking = speaking;
    },
    project,
    layout,
    renderOnce() {
      update(0.016);
      renderer.render(scene, camera);
    },
    seek(t) {
      state.time = t;
    },
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      renderer.dispose();
    },
  };
}
