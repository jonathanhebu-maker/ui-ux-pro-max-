export function initHeader() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const open = () => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'סגירת תפריט');
    requestAnimationFrame(() => menu.classList.add('is-open'));
  };
  const close = (focusToggle = false) => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'פתיחת תפריט');
    setTimeout(() => {
      if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true;
    }, 350);
    if (focusToggle) toggle.focus();
  };
  toggle.addEventListener('click', () => (toggle.getAttribute('aria-expanded') === 'true' ? close() : open()));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true);
  });
  document.addEventListener('click', (e) => {
    if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) close();
  });

  // Active pill follows the section in view
  const pills = [...document.querySelectorAll('.nav__pill')];
  const map = new Map(pills.map((p) => [p.getAttribute('href').slice(1), p]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const pill = map.get(e.target.id);
        if (!pill) continue;
        pills.forEach((p) => p.removeAttribute('aria-current'));
        pill.setAttribute('aria-current', 'page');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of map.keys()) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
}
