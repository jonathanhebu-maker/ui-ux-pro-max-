// Technical labels pinned to 3D brain components (projected every frame).
export function createCallouts({ list, svg, maxLabels = 5 }) {
  const NS = 'http://www.w3.org/2000/svg';
  const items = [...list.querySelectorAll('.callout')]
    .sort((a, b) => Number(a.dataset.priority) - Number(b.dataset.priority))
    .map((el, i) => {
      const hidden = i >= maxLabels;
      el.classList.toggle('is-hidden', hidden);
      const line = document.createElementNS(NS, 'line');
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', '2.6');
      line.style.opacity = dot.style.opacity = '0';
      if (!hidden) svg.append(line, dot);
      return { el, line, dot, anchor: el.dataset.anchor, dx: Number(el.dataset.dx), dy: Number(el.dataset.dy), hidden, w: 0, h: 0, on: false, order: 0 };
    })
    .filter((it) => !it.hidden);

  // Stagger by on-screen order (right → left feels natural for RTL readers)
  items.forEach((it, i) => (it.order = i));

  const measure = () => {
    for (const it of items) {
      it.w = it.el.offsetWidth;
      it.h = it.el.offsetHeight;
    }
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });
  document.fonts?.ready.then(measure);

  const p = { x: 0, y: 0, z: 0 };
  let bounds = { w: 1, h: 1 };
  return {
    setBounds(w, h, scale = 1, top = 70) {
      bounds = { w, h, scale, top };
    },
    update({ labelsOn, openHold, project, unit }) {
      const sc = unit || bounds.scale || 1;
      for (const it of items) {
        const want = labelsOn && openHold >= it.order * 0.13;
        if (want !== it.on) {
          it.on = want;
          it.el.classList.toggle('is-on', want);
          it.line.style.opacity = it.dot.style.opacity = want ? '1' : '0';
        }
        if (!project(it.anchor, p)) continue;
        let lx = p.x + it.dx * sc;
        let ly = p.y + it.dy * sc;
        // keep inside the stage
        lx = Math.max(it.w / 2 + 8, Math.min(bounds.w - it.w / 2 - 8, lx));
        ly = Math.max(it.h / 2 + bounds.top, Math.min(bounds.h - it.h / 2 - 8, ly));
        it.el.style.transform = `translate3d(${(lx - it.w / 2).toFixed(1)}px, ${(ly - it.h / 2).toFixed(1)}px, 0)`;
        // line ends at the label edge nearest the anchor
        const ex = Math.max(lx - it.w / 2, Math.min(lx + it.w / 2, p.x));
        const ey = p.y < ly ? ly - it.h / 2 : ly + it.h / 2;
        it.line.setAttribute('x1', p.x.toFixed(1));
        it.line.setAttribute('y1', p.y.toFixed(1));
        it.line.setAttribute('x2', ex.toFixed(1));
        it.line.setAttribute('y2', ey.toFixed(1));
        it.dot.setAttribute('cx', p.x.toFixed(1));
        it.dot.setAttribute('cy', p.y.toFixed(1));
      }
    },
  };
}
