import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Cinematic scroll: hero → camera push + brain closing + chip beam,
// then the beam branches into the three AI modules.
export function initScroll({ hero, stageEl, getStage, reducedMotion }) {
  const root = document.documentElement;

  ScrollTrigger.create({
    trigger: stageEl || hero,
    start: 'top top',
    end: 'bottom top',
    scrub: reducedMotion ? true : 0.8,
    onUpdate(self) {
      const p = self.progress;
      getStage()?.setScroll(p);
      hero.style.setProperty('--beam', Math.min(1, Math.max(0, (p - 0.08) / 0.5)).toFixed(3));
    },
  });

  // Signal paths draw with scroll (pathLength=1 keeps dashes resolution-free)
  const all = [...document.querySelectorAll('.signal__path, .signal__glow')];
  all.forEach((p) => {
    p.style.strokeDasharray = '1';
    p.style.strokeDashoffset = reducedMotion ? '0' : '1';
  });
  const trunk = all.filter((p) => p.hasAttribute('data-trunk'));
  const branches = all.filter((p) => !p.hasAttribute('data-trunk'));
  if (!reducedMotion) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.signal', start: 'top 92%', end: 'bottom 55%', scrub: 0.6 },
    });
    tl.to(trunk, { strokeDashoffset: 0, ease: 'none', duration: 0.45 })
      .to(branches, { strokeDashoffset: 0, ease: 'none', duration: 0.55 })
      .fromTo('.signal__node', { scale: 0, transformOrigin: 'center' }, { scale: 1, duration: 0.2 }, 0.4);

    // Modules materialise as the signal reaches them
    gsap.from('.module', {
      opacity: 0,
      y: 40,
      scale: 0.97,
      filter: 'blur(8px)',
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.14,
      scrollTrigger: { trigger: '.modules', start: 'top 82%' },
    });
    gsap.from('.systems .section-head > *', {
      opacity: 0,
      y: 24,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.systems .section-head', start: 'top 85%' },
    });

    const reveal = (sel, trigger, opts = {}) =>
      gsap.from(sel, {
        opacity: 0,
        y: 26,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        ...opts,
        scrollTrigger: { trigger: trigger || sel, start: 'top 85%' },
      });
    reveal('.how .section-head > *', '.how .section-head');
    reveal('.step', '.steps', { stagger: 0.12 });
    reveal('.faq .section-head > *', '.faq .section-head');
    reveal('.faq__item', '.faq__list', { stagger: 0.08 });
    reveal('.contact__copy > *', '.contact__grid');
    reveal('.lead-form', '.contact__grid', { delay: 0.15 });
  }

  // The trunk starts exactly under the AI chip, then bends to the centre
  const svg = document.querySelector('.signal');
  let lastX = -1;
  const alignTrunk = (chipX) => {
    if (!svg || Math.abs(chipX - lastX) < 3) return;
    lastX = chipX;
    const r = svg.getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    const x = Math.max(0, Math.min(1200, ((hr.left + chipX - r.left) / r.width) * 1200));
    const d = `M${x.toFixed(1)} 0 C${x.toFixed(1)} 70 600 50 600 120`;
    trunk.forEach((p) => p.setAttribute('d', d));
  };

  // Keep measurements right once fonts settle
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  return { refresh: () => ScrollTrigger.refresh(), alignTrunk, root };
}
