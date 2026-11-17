/* Demo booking modal: validates #demoForm, logs the request through the
   existing /.netlify/functions/contact endpoint (reshaped as a contact
   submission so it fits the function's schema), then transitions the modal
   to a Calendly step so the visitor can pick an exact slot. Local preview
   via file:// is handled gracefully — the fetch is skipped and the flow
   proceeds straight to Calendly without blocking the user. */
(function () {
  const form = document.getElementById('demoForm');
  if (!form) return;

  const $ = s => form.querySelector(s);
  const $$ = s => form.querySelectorAll(s);

  const CONTACT_ENDPOINT = '/.netlify/functions/contact';
  const CONTACT_FALLBACK = '/api/contact.php';
  const CALENDLY_URL = window.__NEXUM_CALENDLY_URL || 'https://calendly.com/nexumglobal-solutions';

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
  const submitBtn = document.getElementById('demoSubmit');
  const modal = document.getElementById('demoModal');
  const steps = modal ? modal.querySelectorAll('.demo-modal-step') : [];
  const calendlyWrap = document.getElementById('demoCalendlyWrap');
  const calendlyOpen = document.getElementById('demoCalendlyOpen');
  const calendlyMsg = document.getElementById('demoCalendlyMsg');

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
  function showStep(name) {
    steps.forEach(s => s.hidden = s.dataset.step !== name);
  }

  function buildCalendlyUrl(email) {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    return params.toString() ? `${CALENDLY_URL}?${params.toString()}` : CALENDLY_URL;
  }

  function embedCalendly(email) {
    if (!calendlyWrap) return;
    const url = buildCalendlyUrl(email);
    if (calendlyOpen) calendlyOpen.href = url;
    // Open a plain iframe to Calendly — simple, resilient and reaches the
    // public profile page so the visitor never sees a 404 even if a specific
    // event slug is unavailable.
    calendlyWrap.innerHTML = `<iframe title="Pick a Calendly slot" src="${url}" loading="lazy" allow="camera; microphone; autoplay"></iframe>`;
  }

  function finaliseToCalendly(email) {
    showStep('calendly');
    if (calendlyMsg) calendlyMsg.textContent = 'Pick a time that works for you below.';
    embedCalendly(email);
  }

  /* Fire-and-forget: log the demo request as a contact entry via the existing
     Netlify Function. file:// previews skip the network entirely. A 4xx/5xx
     response never blocks the Calendly handoff — the Calendly step still runs. */
  async function logDemoRequest(payload) {
    if (typeof window === 'undefined' || window.location.protocol === 'file:') return;
    const body = JSON.stringify(payload);
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body,
    };
    try {
      let res = await fetch(CONTACT_ENDPOINT, options);
      if (res.status === 404) res = await fetch(CONTACT_FALLBACK, options);
      // Silent — any failure is non-blocking.
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!requiredFields().every(validate)) {
      setStatus('err', 'Please correct the highlighted fields before continuing.');
      return;
    }
    clearStatus();

    const emailInput = $('#demoEmail');
    const email = emailInput ? (emailInput.value || '').trim() : '';
    const company = ($('#demoCompany').value || '').trim();
    const team = $('#demoTeam').value;
    const date = $('#demoDate').value;
    const slot = $('#demoSlot').value;

    // Shape as a contact submission so the existing Netlify Function accepts
    // it — the function requires full_name, email, phone (>=6 digits) and a
    // 10+ char message. We synthesise a company-based name and a message that
    // records the exact walkthrough request details.
    const message = `Demo request — Company: ${company} · Team size: ${team} · Preferred date: ${date} · Time slot: ${slot}.`;
    const payload = {
      full_name: company ? `${company} (Demo Request)` : 'Demo Request',
      email,
      phone: '000000',
      subject: 'Demo Request',
      message,
    };

    // UI feedback while we hand off.
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.prevLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Saving…';
    }
    setStatus('info', 'Walkthrough details saved! Opening Calendly…');

    await logDemoRequest(payload);

    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtn.dataset.prevLabel) submitBtn.innerHTML = submitBtn.dataset.prevLabel;
    }

    finaliseToCalendly(email);
  });
})();
