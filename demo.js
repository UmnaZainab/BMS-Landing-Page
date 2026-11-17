/* Book a Demo section: validates the inline booking form on the single-page
   site. On a valid submit, opens Calendly with the visitor's work email
   prefilled. Picks up the pricing cart from localStorage to show above the form. */
(function () {
  const form = document.getElementById('demoForm');
  if (!form) return;

  const $ = s => form.querySelector(s);
  const $$ = s => form.querySelectorAll(s);

  /* Show selected modules carried over from the pricing builder. */
  try {
    const cart = JSON.parse(localStorage.getItem('nexum-cart') || '[]');
    if (Array.isArray(cart) && cart.length) {
      const el = document.getElementById('demoSel');
      if (el) {
        el.textContent = `Selected for your walkthrough: ${cart.join(', ')}`;
        el.hidden = false;
        localStorage.removeItem('nexum-cart');
      }
    }
  } catch (e) { /* ignore */ }

  function validate(field) {
    const err = field.parentElement.querySelector('.error');
    let msg = '';
    const val = (field.value || '').trim();
    if (field.required && !val) msg = 'This field is required.';
    else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'Enter a valid work email.';
    else if (field.minLength > 0 && val.length < field.minLength) msg = `Use at least ${field.minLength} characters.`;
    if (err) err.textContent = msg;
    field.setAttribute('aria-invalid', !!msg);
    return !msg;
  }

  const requiredFields = () => [...$$('input[required], select[required]')];
  requiredFields().forEach(f => f.addEventListener('blur', () => validate(f)));

  const status = document.getElementById('demoStatus');
  const CALENDLY_URL = window.__NEXUM_CALENDLY_URL || 'https://calendly.com/nexumglobal-solutions/nexum-ems-demo';

  function setStatus(kind, text) {
    if (!status) return;
    status.classList.add('show');
    status.dataset.kind = kind;
    status.textContent = text;
  }
  function clearStatus() {
    if (!status) return;
    status.classList.remove('show');
    status.textContent = '';
    status.removeAttribute('data-kind');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!requiredFields().every(validate)) {
      setStatus('err', 'Please correct the highlighted fields before continuing.');
      return;
    }
    clearStatus();
    const emailInput = $('#demoEmail');
    const email = emailInput ? (emailInput.value || '').trim() : '';
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    const url = params.toString() ? `${CALENDLY_URL}?${params.toString()}` : CALENDLY_URL;
    window.open(url, '_blank', 'noopener');
    setStatus('ok', 'Opening the Calendly scheduler in a new tab — pick a slot that works for you.');
  });
})();
