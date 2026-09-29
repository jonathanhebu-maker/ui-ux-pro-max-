// Pick a rendering tier once per load. Weak devices get fewer particles,
// lower mesh density and no mouse parallax.
export function detectTier() {
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (w <= 760 || mem <= 2 || (coarse && cores <= 4)) {
    return { name: 'low', maxDpr: 1.5, mesh: 0.55, particles: 260, synapses: 420, mouse: false, parallax: false, headRot: 0, pointScale: 1.1, bg: 26, labels: 3 };
  }
  if (w <= 1100 || cores <= 4 || mem <= 4) {
    return { name: 'mid', maxDpr: 1.5, mesh: 0.75, particles: 520, synapses: 800, mouse: fine, parallax: fine, headRot: 0.045, pointScale: 1, bg: 46, labels: 4 };
  }
  return { name: 'high', maxDpr: 2, mesh: 1, particles: 950, synapses: 1400, mouse: fine, parallax: fine, headRot: 0.075, pointScale: 1, bg: 80, labels: 5 };
}

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;

// Probe WebGL once. CPU-only renderers (SwiftShader, llvmpipe — VMs, remote
// desktops, PageSpeed/Lighthouse servers) can't animate the brain smoothly,
// so they get a pre-rendered poster instead of a slideshow. The probe runs in
// a worker so that slow context creation never blocks the main thread.
export function probeWebGL() {
  if (typeof OffscreenCanvas === 'undefined' || typeof Worker === 'undefined') return Promise.resolve(probeMainThread());
  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => {
      if (done) return;
      done = true;
      resolve(r);
    };
    try {
      const w = new Worker(new URL('./glprobe.worker.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => {
        w.terminate();
        // OffscreenCanvas WebGL may be unavailable while main-thread WebGL works
        finish(e.data.ok ? e.data : probeMainThread());
      };
      w.onerror = () => finish(probeMainThread());
      setTimeout(() => finish({ ok: true, software: false, renderer: 'timeout' }), 4000);
    } catch {
      finish(probeMainThread());
    }
  });
}

function probeMainThread() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return { ok: false, software: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { ok: true, software: SOFTWARE.test(name), renderer: name };
  } catch {
    return { ok: false, software: false };
  }
}

