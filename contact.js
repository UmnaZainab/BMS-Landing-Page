/* Contact Us page: validate inputs, POST to /api/contact, show status.
 *
 * If the landing page is served from a different origin than the API
 * (static host + separate backend), set `window.NEXBMS_API_BASE` before
 * this script loads, e.g. <script>window.NEXBMS_API_BASE="https://api.example.com"</script>.
 * Default is same-origin. */
(function () {
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const API_BASE = (window.NEXBMS_API_BASE || '').replace(/\/+$/, '');
  const ENDPOINT = (API_BASE || '') + '/.netlify/functions/contact';

  function validate(field) {
    const err = field.parentElement.querySelector('.error'); let msg = '';
    const val = field.value.trim();
    if (field.required && !val) msg = 'This field is required.';
    else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'Enter a valid email address.';
    else if (field.type === 'tel' && (val.match(/\d/g) || []).length < 6) msg = 'Enter a valid phone number.';
    else if (field.minLength > 0 && val.length < field.minLength) msg = `Use at least ${field.minLength} characters.`;
    err.textContent = msg; field.setAttribute('aria-invalid', !!msg); return !msg;
  }

  const form = $('#contactForm');
  const status = $('#formStatus');
  const submitBtn = $('#contactSubmit');
  const fields = () => [...$$('#contactForm input, #contactForm textarea')].filter(f => f.required);
  fields().forEach(f => f.addEventListener('blur', () => validate(f)));

  function showStatus(kind, text) {
    status.classList.add('show');
    status.dataset.kind = kind; // 'ok' | 'err'
    status.textContent = text;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const ok = fields().every(validate);
    if (!ok) {
      showStatus('err', 'Please correct the highlighted fields before continuing.');
      return;
    }

    const payload = {
      full_name: $('#name').value.trim(),
      email: $('#email').value.trim(),
      phone: $('#phone').value.trim(),
      subject: $('#subject').value,
      message: $('#message').value.trim(),
    };

    submitBtn.disabled = true;
    const prevLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending…';
    showStatus('info', 'Sending your message…');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json()).detail || ''; } catch { /* non-JSON */ }
        throw new Error(detail || `Server responded with ${res.status}.`);
      }
      showStatus('ok', 'Thanks! Your message was sent — we’ll be in touch within one business day.');
      form.reset();
      fields().forEach(f => { f.setAttribute('aria-invalid', 'false'); const er = f.parentElement.querySelector('.error'); if (er) er.textContent = ''; });
    } catch (err) {
      showStatus('err', err.message || 'Something went wrong. Please try again in a moment.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = prevLabel;
    }
  });
})();
