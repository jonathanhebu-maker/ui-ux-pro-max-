// Word-by-word headline reveal, then subheadline → CTAs → stats.
export function playIntro(root, { reducedMotion = false } = {}) {
  const words = [...root.querySelectorAll('.hero__title .w')];
  const FIRST = 0.25;
  const STEP = 0.07;
  words.forEach((w, i) => w.style.setProperty('--d', `${(FIRST + i * STEP).toFixed(2)}s`));
  const afterTitle = FIRST + (words.length - 1) * STEP + 0.45;
  const seq = [...root.querySelectorAll('.reveal-seq')];
  seq.forEach((el) => {
    const n = Number(el.dataset.seq || 0);
    // eyebrow leads the headline; the rest follow it
    const d = n === 0 ? 0.1 : afterTitle + (n - 1) * 0.22;
    el.style.setProperty('--d', `${d.toFixed(2)}s`);
  });
  if (reducedMotion) {
    root.classList.add('is-intro');
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-intro')));
}
