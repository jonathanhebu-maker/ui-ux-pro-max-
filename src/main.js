import './styles/main.css';
import { detectTier, probeWebGL } from './ui/tier.js';
import { startBackground } from './ui/background.js';
import { initHeader } from './ui/header.js';
import { playIntro } from './ui/intro.js';
import { createCallouts } from './ui/callouts.js';
import { initVoiceAgent } from './ui/voice.js';
import { initScroll } from './ui/scroll.js';
import { initLeadForm } from './ui/form.js';

const docEl = document.documentElement;
docEl.classList.add('js');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tier = detectTier();
docEl.dataset.tier = tier.name;

const hero = document.querySelector('.hero');
const stageEl = document.getElementById('stage');
const canvasHost = document.getElementById('stage-canvas');
const voicePanel = document.getElementById('voice-agent');
let stage = null;

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

initHeader();
playIntro(hero, { reducedMotion });
requestAnimationFrame(() => document.body.classList.add('is-ready'));
startBackground(document.getElementById('bg-canvas'), {
  count: tier.bg,
  reducedMotion,
  interactive: tier.mouse,
});
initLeadForm(document.getElementById('lead-form'));

// ---- Voice agent ↔ brain ----
let voiceLevel = 0;
const voice = initVoiceAgent(voicePanel, {
  reducedMotion,
  onLevel(level, speaking) {
    if (Math.abs(level - voiceLevel) > 0.004) {
      voiceLevel = level;
      docEl.style.setProperty('--voice', level.toFixed(3));
    }
    stage?.setVoice(level, speaking);
  },
});
document.querySelectorAll('[data-action="talk"]').forEach((b) =>
  b.addEventListener('click', () => {
    voicePanel.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    voicePanel.classList.add('is-on');
    voice.start();
    voicePanel.querySelector('[data-voice-toggle]').focus({ preventScroll: true });
  }),
);
// Panel activates after the brain has opened (step 12 of the sequence)
setTimeout(() => voicePanel.classList.add('is-on'), reducedMotion ? 0 : 3300);

// ---- Callouts ----
const callouts = createCallouts({
  list: document.getElementById('callouts'),
  svg: document.getElementById('callout-lines'),
  maxLabels: tier.labels,
});
const syncBounds = () => {
  const r = stageEl.getBoundingClientRect();
  const scale = window.innerWidth > 1100 ? 1 : window.innerWidth > 760 ? 0.8 : 0.55;
  callouts.setBounds(r.width, r.height, scale, window.innerWidth > 1100 ? 76 : 6);
};
syncBounds();
window.addEventListener('resize', syncBounds, { passive: true });

// ---- Scroll choreography ----
const scroller = initScroll({ hero, stageEl, getStage: () => stage, reducedMotion });

// ---- 3D stage: lazy-loaded so text (LCP) paints first ----
let lastChip = '';
async function bootStage() {
  const gl = await probeWebGL();
  // ?force-webgl renders the live scene even on CPU renderers (QA / poster capture)
  if (new URLSearchParams(location.search).has('force-webgl')) gl.software = false;
  if (!gl.ok || gl.software) {
    // No GPU: show the pre-rendered open-brain poster (WebP) instead
    docEl.classList.add(gl.ok ? 'gl-poster' : 'no-webgl');
    return;
  }
  try {
    const { createStage } = await import('./scene/Stage.js');
    stage = await createStage({
      container: canvasHost,
      tier,
      reducedMotion,
      onFrame(f) {
        callouts.update(f);
        // chip position drives the scroll beam origin
        if (!f.project) return;
        const p = f.project('core');
        if (p) {
          const stageTop = stageEl.offsetTop;
          const key = `${Math.round(p.x)}|${Math.round(p.y)}`;
          if (key !== lastChip) {
            lastChip = key;
            hero.style.setProperty('--chip-x', `${p.x.toFixed(0)}px`);
            hero.style.setProperty('--chip-y', `${(p.y + stageTop).toFixed(0)}px`);
            scroller.alignTrunk(p.x);
          }
        }
      },
    });
    requestAnimationFrame(() => canvasHost.classList.add('is-live'));
  } catch (err) {
    console.error('[stage]', err);
    docEl.classList.add('no-webgl');
  }
}
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
const kick = () => idle(bootStage, { timeout: 600 });
if (document.readyState === 'complete') kick();
else window.addEventListener('load', kick, { once: true });

// Debug hooks for QA / screenshots
window.__nexora = { get stage() { return stage; }, voice };
