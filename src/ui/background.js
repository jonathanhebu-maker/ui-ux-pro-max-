// Very subtle drifting particles + faint neural links behind everything.
// 2D canvas at 1x DPR: cheap, and paused whenever the tab is hidden.
export function startBackground(canvas, { count = 60, reducedMotion = false, interactive = true } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = false;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const pts = [];

  function resize() {
    w = canvas.width = Math.round(window.innerWidth);
    h = canvas.height = Math.round(window.innerHeight);
  }
  resize();
  for (let i = 0; i < count; i++) {
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.3 + Math.random() * 0.7, // depth: parallax + alpha
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.05 - 0.02,
      r: 0.5 + Math.random() * 1.1,
      hue: Math.random(),
    });
  }

  const LINK = 150;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const ox = mouse.x * 14;
    const oy = mouse.y * 10;
    for (const p of pts) {
      if (!reducedMotion) {
        p.x += p.vx;
        p.y += p.vy;
      }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;
      p.sx = p.x + ox * p.z;
      p.sy = p.y + oy * p.z;
    }
    // neural links — extremely faint
    ctx.lineWidth = 0.6;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.sx - b.sx;
        const dy = a.sy - b.sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          const al = (1 - Math.sqrt(d2) / LINK) * 0.07 * Math.min(a.z, b.z);
          ctx.strokeStyle = `rgba(90,140,255,${al})`;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      const al = 0.1 + p.z * 0.22;
      ctx.fillStyle = p.hue > 0.7 ? `rgba(170,120,255,${al})` : `rgba(120,200,255,${al})`;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, p.r * p.z, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  window.addEventListener('resize', resize, { passive: true });
  if (interactive && !reducedMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        mouse.tx = (e.clientX / w) * 2 - 1;
        mouse.ty = (e.clientY / h) * 2 - 1;
      },
      { passive: true },
    );
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  if (reducedMotion) draw();
  else start();
  return { start, stop };
}
