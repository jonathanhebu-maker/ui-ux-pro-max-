// Live AI voice-agent panel.
// Ships with a self-contained demo conversation (Hebrew TTS + optional speech
// recognition + real microphone level). To connect a production voice stack
// (Vapi, Retell, ElevenLabs, OpenAI Realtime…), assign
//   window.NEXORA_VOICE_PROVIDER = { start({ onLevel, onState, onText }), stop() }
// before the page loads — the panel, waveform and 3D brain will follow it.

const REPLIES = [
  { re: /פגיש|לקבוע|יומן|זמן/, text: 'מעולה. אני יכול לקבוע לכם שיחת אפיון כבר השבוע — השאירו פרטים בטופס ונחזור אליכם עוד היום.' },
  { re: /מחיר|עולה|עלות|כמה/, text: 'המחיר תלוי בהיקף. סוכן קולי ממוקד עולה לאוויר תוך שבועות ספורים — נשמח לבנות לכם הצעה מדויקת.' },
  { re: /ליד|לקוח|מכיר/, text: 'אני עונה לכל ליד תוך שניות, מסנן אותו, ומעביר לצוות רק את מי שמוכן לסגור.' },
  { re: /אוטומצ|מערכת|CRM|וואטסאפ/, text: 'אני מתחבר ל-CRM, ליומן ולוואטסאפ — ומבצע את הפעולות בעצמי, בלי עבודה ידנית.' },
];
const GREETING = 'שלום! אני סוכן ה-AI של העסק. אפשר לשאול אותי כל שאלה, או לבקש שאקבע לכם פגישה.';
const FALLBACK = 'שאלה מצוינת. סוכן AI יכול לענות ללקוחות, לסנן לידים ולקבוע פגישות 24/7. רוצים שנתאם הדגמה?';

export function initVoiceAgent(panel, { onLevel, reducedMotion = false } = {}) {
  const btn = panel.querySelector('[data-voice-toggle]');
  const line = panel.querySelector('[data-voice-line]');
  const statusEl = panel.querySelector('[data-voice-status]');
  const timerEl = panel.querySelector('[data-voice-timer]');
  const live = panel.querySelector('[data-voice-live]');
  const wave = panel.querySelector('[data-voice-wave]');
  const idleText = line.textContent;
  const ctx = wave.getContext('2d');

  let mode = 'idle'; // idle | connecting | speaking | listening
  let level = 0;
  let target = 0;
  let session = 0;
  let startedAt = 0;
  let timerId = 0;
  let mic = null; // { stream, analyser, data, ac }
  let recog = null;
  let heVoice = null;

  const loadVoices = () => {
    const vs = window.speechSynthesis?.getVoices?.() || [];
    heVoice = vs.find((v) => /^he|iw/i.test(v.lang)) || null;
  };
  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
  }

  const setStatus = (t) => (statusEl.textContent = t);
  const setMode = (m) => {
    mode = m;
    panel.dataset.mode = m;
  };

  function typeLine(text) {
    line.textContent = '';
    live.textContent = text;
    if (reducedMotion) {
      line.textContent = text;
      return;
    }
    let i = 0;
    const id = session;
    const tick = () => {
      if (id !== session) return;
      line.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 24);
    };
    tick();
  }

  function speak(text) {
    const id = session;
    setMode('speaking');
    setStatus('הסוכן מדבר…');
    typeLine(text);
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve(id === session);
      };
      const est = 900 + text.length * 62;
      if ('speechSynthesis' in window && heVoice) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = heVoice.lang;
        u.voice = heVoice;
        u.rate = 1.03;
        u.onend = finish;
        u.onerror = finish;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        setTimeout(finish, est + 4000);
      } else {
        setTimeout(finish, est);
      }
    });
  }

  function listen() {
    const id = session;
    setMode('listening');
    setStatus('מקשיב…');
    line.textContent = 'דברו עכשיו — אני מקשיב.';
    return new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      let settled = false;
      const done = (text) => {
        if (settled) return;
        settled = true;
        try {
          recog?.stop();
        } catch {}
        resolve(id === session ? text : null);
      };
      if (SR && mic) {
        try {
          recog = new SR();
          recog.lang = 'he-IL';
          recog.interimResults = true;
          recog.maxAlternatives = 1;
          recog.onresult = (e) => {
            const r = e.results[e.results.length - 1];
            line.textContent = `„${r[0].transcript}"`;
            if (r.isFinal) done(r[0].transcript);
          };
          recog.onerror = () => done('');
          recog.onend = () => done('');
          recog.start();
        } catch {
          setTimeout(() => done(''), 5500);
        }
        setTimeout(() => done(''), 9000);
      } else {
        setTimeout(() => done(''), 5200);
      }
    });
  }

  const replyFor = (text) => (REPLIES.find((r) => r.re.test(text || ''))?.text) || FALLBACK;

  async function openMic() {
    if (!navigator.mediaDevices?.getUserMedia) return null;
    try {
      // Never let a pending permission prompt stall the demo
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('mic-timeout')), 8000)),
      ]);
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      return { stream, ac, analyser, data: new Uint8Array(analyser.fftSize) };
    } catch {
      return null;
    }
  }
  function closeMic() {
    if (!mic) return;
    mic.stream.getTracks().forEach((t) => t.stop());
    mic.ac.close?.();
    mic = null;
  }

  async function start() {
    session++;
    const id = session;
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'סיום השיחה עם סוכן ה-AI');
    setMode('connecting');
    setStatus('מתחבר…');
    startedAt = performance.now();
    timerId = setInterval(() => {
      const s = Math.floor((performance.now() - startedAt) / 1000);
      timerEl.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 500);

    const provider = window.NEXORA_VOICE_PROVIDER;
    if (provider?.start) {
      provider.start({
        onLevel: (v, speaking) => {
          target = v;
          setMode(speaking ? 'speaking' : 'listening');
        },
        onState: (s) => setStatus(s),
        onText: (t) => typeLine(t),
      });
      return;
    }

    mic = await openMic();
    if (id !== session) return;
    let ok = await speak(GREETING);
    for (let round = 0; ok && round < 3; round++) {
      const heard = await listen();
      if (heard === null || id !== session) return;
      ok = await speak(heard ? replyFor(heard) : round === 0 ? FALLBACK : 'אשמח להמשיך — השאירו פרטים למטה ונחזור אליכם.');
    }
    if (id === session) stop();
  }

  function stop() {
    session++;
    window.speechSynthesis?.cancel?.();
    try {
      recog?.abort();
    } catch {}
    window.NEXORA_VOICE_PROVIDER?.stop?.();
    closeMic();
    clearInterval(timerId);
    timerEl.textContent = '00:00';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'התחילו שיחה עם סוכן ה-AI');
    setMode('idle');
    setStatus('סוכן AI מחובר');
    line.textContent = idleText;
  }

  btn.addEventListener('click', () => (mode === 'idle' ? start() : stop()));

  // ---- level + waveform ----
  let w = 0;
  let h = 0;
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = wave.clientWidth;
    h = wave.clientHeight;
    wave.width = Math.round(w * dpr);
    wave.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(wave);

  const BARS = 44;
  const hist = new Float32Array(BARS);
  let raf = 0;
  let visible = true;
  let t0 = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    // Level source
    if (mode === 'speaking') {
      const syll = Math.abs(Math.sin(t * 9.3)) * 0.55 + Math.abs(Math.sin(t * 3.1 + 1)) * 0.35;
      target = 0.35 + syll * 0.6 * (0.7 + Math.random() * 0.3);
    } else if (mode === 'listening') {
      if (mic) {
        mic.analyser.getByteTimeDomainData(mic.data);
        let sum = 0;
        for (let i = 0; i < mic.data.length; i++) {
          const v = (mic.data[i] - 128) / 128;
          sum += v * v;
        }
        target = Math.min(1, Math.sqrt(sum / mic.data.length) * 5.5) * 0.9 + 0.08;
      } else {
        target = 0.1 + Math.max(0, Math.sin(t * 2.2)) * 0.15 * Math.random();
      }
    } else if (mode === 'connecting') {
      target = 0.15 + 0.1 * Math.sin(t * 6);
    } else if (!window.NEXORA_VOICE_PROVIDER || mode === 'idle') {
      target = 0;
    }
    level += (target - level) * 0.18;
    onLevel?.(level, mode === 'speaking', mode);

    if (!visible || !w) return;
    // Waveform: mirrored rounded bars
    ctx.clearRect(0, 0, w, h);
    for (let i = BARS - 1; i > 0; i--) hist[i] = hist[i - 1];
    hist[0] = level;
    const gap = w / BARS;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#bc5cff');
    grad.addColorStop(0.5, '#5274ff');
    grad.addColorStop(1, '#36c8ff');
    ctx.fillStyle = grad;
    for (let i = 0; i < BARS; i++) {
      const center = 1 - Math.abs(i - (BARS - 1) / 2) / (BARS / 2);
      const idle = 0.08 + 0.06 * Math.sin(t * 1.6 + i * 0.45) * (reducedMotion ? 0 : 1);
      const v = Math.max(idle, hist[Math.abs(i - Math.floor(BARS / 2))] * (0.35 + 0.65 * center) * (0.75 + 0.25 * Math.sin(i * 1.7 + t * 7)));
      const bh = Math.max(3, v * h * 0.95);
      const x = i * gap + gap * 0.3;
      const bw = Math.max(2, gap * 0.4);
      const y = (h - bh) / 2;
      ctx.globalAlpha = 0.35 + 0.65 * Math.min(1, v * 1.6);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, bw, bh, bw / 2) : ctx.rect(x, y, bw, bh);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  raf = requestAnimationFrame(frame);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(panel);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });

  return { start: () => mode === 'idle' && start(), stop, get mode() { return mode; } };
}
