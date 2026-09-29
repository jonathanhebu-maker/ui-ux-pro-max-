// Lead form: accessible inline validation. Set data-endpoint on the form to
// POST JSON to your CRM / webhook (n8n, Make, Zapier, HubSpot…).
export function initLeadForm(form) {
  if (!form) return;
  const status = form.querySelector('.lead-form__status');
  const rules = {
    name: (v) => (v.trim().length >= 2 ? '' : 'נא להזין שם מלא'),
    phone: (v) => (/^[+\d][\d\s-]{7,}$/.test(v.trim()) ? '' : 'נא להזין מספר טלפון תקין'),
  };
  const check = (input) => {
    const rule = rules[input.name];
    if (!rule) return true;
    const msg = rule(input.value);
    const err = document.getElementById(`${input.id}-err`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) input.setAttribute('aria-describedby', err.id);
    else input.removeAttribute('aria-describedby');
    err.textContent = msg;
    return !msg;
  };
  form.querySelectorAll('input[required]').forEach((i) => i.addEventListener('blur', () => check(i)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = [...form.querySelectorAll('input[required]')];
    const bad = inputs.filter((i) => !check(i));
    if (bad.length) {
      bad[0].focus();
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const data = Object.fromEntries(new FormData(form));
    try {
      if (form.dataset.endpoint) {
        await fetch(form.dataset.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await new Promise((r) => setTimeout(r, 700));
      }
      status.textContent = 'תודה! קיבלנו את הפרטים ונחזור אליכם בהקדם.';
      form.reset();
    } catch {
      status.textContent = 'משהו השתבש. נסו שוב או כתבו לנו ישירות.';
    } finally {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
    }
  });
}
