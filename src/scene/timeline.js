import { cinematic, inOut, clamp01 } from './easing.js';

// Master choreography for the head-opening loop.
// Absolute intro times follow the brief; after that the cycle repeats seamlessly.
const CYCLE_START = 0.9; // "Rear skull panels unlock" at 0.9s
const CYCLE = 14.5; // full loop length (brief: 12–16s)
const CLOSE_AT = 9.2; // start reassembly (relative to cycle start)

// [start, duration] relative to CYCLE_START for opening, and closing delays.
const OPEN = {
  unlock: [0.0, 0.35],
  shell: [0.3, 2.5], // 1.2s absolute
  rings: [0.6, 2.3], // 1.5s
  layers: [0.8, 2.3], // 1.7s
  chip: [1.1, 1.2], // 2.0s
  light: [1.3, 1.1], // 2.2s
  particles: [1.6, 1.0], // 2.5s
};
const CLOSE = {
  particles: [0.0, 0.8],
  light: [0.3, 1.6],
  chip: [0.9, 1.6],
  layers: [0.6, 2.4],
  rings: [0.9, 2.3],
  shell: [1.2, 2.5],
  unlock: [3.6, 0.4],
};

const seg = (t, [s, d], ease = cinematic) => ease(clamp01((t - s) / d));

export function sampleTimeline(t, { reducedMotion = false } = {}) {
  const out = {
    fade: 1,
    neural: 1,
    unlock: 1,
    shell: 1,
    rings: 1,
    layers: 1,
    chip: 1,
    light: 1,
    particles: 1,
    openHold: 1,
  };
  if (reducedMotion) return out;

  out.fade = cinematic(clamp01(t / 1.4));
  out.neural = cinematic(clamp01((t - 0.5) / 0.9));

  if (t < CYCLE_START) {
    for (const k of Object.keys(OPEN)) out[k] = 0;
    out.openHold = 0;
    return out;
  }
  const tau = (t - CYCLE_START) % CYCLE;
  for (const k of Object.keys(OPEN)) {
    const o = seg(tau, OPEN[k]);
    const c = seg(tau - CLOSE_AT, CLOSE[k], inOut);
    out[k] = o * (1 - c);
  }
  // Time spent fully open — drives staggered callouts.
  out.openHold = tau > 3.2 && tau < CLOSE_AT ? tau - 3.2 : -1;
  return out;
}
