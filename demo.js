/* Book a Demo page: booking widget validation. If the visitor arrived from
   the pricing builder, show the modules they selected above the form. */
(function () {
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);

  // Show selected modules carried over from the pricing builder.
  try {
    const cart = JSON.parse(localStorage.getItem('nexum-cart') || '[]');
    if (Array.isArray(cart) && cart.length) {
      const el = $('#demoSel');
      el.textContent = `Selected for your walkthrough: ${cart.join(', ')}`;
      el.hidden = false;
      localStorage.removeItem('nexum-cart');
    }
  } catch (e) {}

  function validate(field) {
    const err = field.parentElement.querySelector('.error'); let msg = '';
    if (field.required && !field.value.trim()) msg = 'This field is required.';
    else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) msg = 'Enter a valid work email.';
    else if (field.minLength > 0 && field.value.trim().length < field.minLength) msg = `Use at least ${field.minLength} characters.`;
    err.textContent = msg; field.setAttribute('aria-invalid', !!msg); return !msg;
  }
  const fields = () => [...$$('#demoForm input[required]')];
  fields().forEach(f => f.addEventListener('blur', () => validate(f)));

  // On a valid submit, send the visitor to Calendly in a new tab with their
  // email prefilled. Invalid submits still get inline validation feedback.
  const CALENDLY_URL = 'https://calendly.com/nexumglobalsolutions';
  $('#demoForm').addEventListener('submit', e => {
    e.preventDefault();
    const status = $('#formStatus');
    if (!fields().every(validate)) {
      status.classList.add('show');
      status.textContent = 'Please correct the highlighted fields before continuing.';
      return;
    }
    status.classList.remove('show'); status.textContent = '';
    const email = ($('#email').value || '').trim();
    const url = email ? `${CALENDLY_URL}?email=${encodeURIComponent(email)}` : CALENDLY_URL;
    window.open(url, '_blank', 'noopener');
  });
})();
