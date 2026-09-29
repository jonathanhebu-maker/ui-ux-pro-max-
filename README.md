# NEXORA AI — cinematic 3D landing page (Hebrew / RTL)

Premium landing page for an AI-automation company (custom AI systems, business
automations, human-like AI voice agents). The signature experience is a
real-time Three.js humanoid robot in side profile whose **rear skull opens to
the right**, revealing a sliced, glowing AI brain with a central processor
marked **AI**.

Built with Vite, Three.js and GSAP ScrollTrigger. No 3D model downloads: the
robot, brain, chip, rings and fibres are generated procedurally at runtime, so
the 3D chunk is ~157 KB gzipped (JS only) and lazy-loaded after first paint.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the build
```

## Rebranding

The brand name and site URL live in `.env`:

```
VITE_BRAND_NAME=NEXORA AI
VITE_SITE_URL=https://www.nexora-ai.co.il
```

They are injected into the title, header, footer, Open Graph tags and JSON-LD
at build time. Also update the domain in `public/robots.txt` and
`public/sitemap.xml`.

## Structure

| Path | What it does |
| --- | --- |
| `index.html` | Semantic RTL markup, all copy as real HTML text, SEO meta, OG, JSON-LD (Organization, WebSite, ProfessionalService, FAQPage) |
| `src/main.js` | Boot: intro, background, voice agent, callouts, scroll, lazy 3D |
| `src/scene/Stage.js` | Renderer, camera framing per breakpoint, idle life, mouse parallax, scroll push, adaptive DPR, pause when hidden |
| `src/scene/timeline.js` | Opening / reassembly loop (14.5 s) using `cubic-bezier(.22,.61,.24,1)` |
| `src/scene/robot.js` | Sculpted ceramic head, closed eyes, mouth, ear modules, neck, shoulders, rear skull panels |
| `src/scene/brain.js` | Folded cortex slices, cross-sections, membranes, AI chip, memory, heat sink, circuit board, glass rings, fibre-optic network, data particles |
| `src/scene/shaders.js` | GLSL for tissue, sections, membranes, GPU-evaluated Bezier fibres, particles, synapses |
| `src/ui/voice.js` | Live voice-agent panel (waveform, Hebrew TTS demo, mic level, speech recognition when available) |
| `src/ui/callouts.js` | Technical labels projected from 3D anchors every frame |
| `src/ui/scroll.js` | Camera push + brain closing on scroll; the chip beam turns into the signal that branches into the three modules |

## Connecting a real voice agent

The panel ships with a self-contained demo conversation. To plug in a
production stack (Vapi, Retell, ElevenLabs, OpenAI Realtime…), define a
provider before `main.js` loads:

```js
window.NEXORA_VOICE_PROVIDER = {
  start({ onLevel, onState, onText }) {
    // onLevel(0..1, isAgentSpeaking) drives the waveform, the robot's mouth and the brain glow
  },
  stop() {},
};
```

## Lead form

Add `data-endpoint="https://…"` to `#lead-form` to POST the lead as JSON
(n8n, Make, Zapier, CRM webhook). Without it the form validates and shows a
success message only.

## Performance strategy

- The 3D module is a separate chunk, imported after `load` + idle, so the H1 is the LCP.
- WebGL support is probed in a Web Worker (OffscreenCanvas). CPU-only renderers
  (SwiftShader / llvmpipe — VMs, remote desktops, PageSpeed servers) get a
  pre-rendered WebP poster of the open brain instead of a 1 fps slideshow.
- Quality tiers (desktop / tablet / mobile) set mesh density, particle counts,
  label count, parallax and head-rotation limits. The pixel ratio is capped at 2
  and adapts at runtime if frames get slow.
- Rendering pauses when the hero is off-screen or the tab is hidden; the
  background particles pause with the tab.
- `prefers-reduced-motion` shows the fully open brain as a still frame and
  turns off the word blur, loop and parallax.

Lighthouse (lab run on this build, poster path): Performance 100,
Accessibility 100, Best Practices 96, SEO 100 on desktop and mobile. GPU
devices run the live scene instead, and its cost there depends on the
hardware.

## Regenerating the posters / OG image

Open `/?force-webgl` to force the live scene on any renderer, seek the loop
with `window.__nexora.stage.seek(7)`, and capture `#stage` with a transparent
background to `public/poster-wide.webp` (1440×900) and
`public/poster-stack.webp` (1000px-wide stacked layout).
