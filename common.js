/* Injected across every page: builds the sticky glass header + dark navy footer
   for the single-page NExBMS site, then wires theme, mobile menu, smooth scroll,
   active-section highlighting, scroll reveals, count-up numbers, back-to-top,
   floating quick actions and direct Calendly booking links. */
(function () {
  const page = document.body.dataset.page || 'home';
  const logoMark = `<span class="logo" aria-hidden="true">
    <svg viewBox="0 0 40 40" focusable="false">
      <path class="logo-n" d="M8.5 28V12l11 16V12" />
      <path class="logo-b" d="M22 12h5.2a4 4 0 0 1 0 8H22m0 0h6.2a4 4 0 0 1 0 8H22V12" />
      <circle class="logo-node node-a" cx="8.5" cy="12" r="1.6" />
      <circle class="logo-node node-b" cx="19.5" cy="28" r="1.6" />
      <circle class="logo-node node-c" cx="32.2" cy="20" r="1.6" />
    </svg>
  </span>`;

  const header = document.getElementById('site-header');
  if (header) header.innerHTML = `
    <nav class="nav container" aria-label="Primary navigation">
      <a class="brand" href="#home">${logoMark}<span><b>NExBMS</b><small>Nexum Global Solutions</small></span></a>
      <div class="links" id="navLinks">
        <a href="#home" data-nav="home">Home</a>
        <a href="#about" data-nav="about">About</a>
        <a href="#features" data-nav="features">Features</a>
        <a href="#process" data-nav="process">Process</a>
        <a href="#pricing" data-nav="pricing">Pricing</a>
        <a href="#contact" data-nav="contact">Contact</a>
      </div>
      <div class="nav-actions">
        <button class="theme" id="theme" aria-label="Switch to light mode" title="Change theme">☀</button>
        <a class="btn btn-ghost nav-cta-hide" href="#pricing">Get Pricing</a>
        <a class="btn btn-primary" href="https://calendly.com/nexumglobalsolutions" target="_blank" rel="noopener noreferrer">Book a Demo</a>
        <button class="menu" id="menu" aria-label="Open navigation" aria-expanded="false">☰</button>
      </div>
    </nav>`;

  const footer = document.getElementById('site-footer');
  if (footer) footer.innerHTML = `
    <div class="container">
      <div class="foot-card">
        <div class="foot-grid">
          <div class="foot-brand">
            <a class="brand" href="#home">${logoMark}<span><b>NExBMS</b><small>Nexum Global Solutions</small></span></a>
            <p>Unified people, operations and delivery management for growing teams, built by Nexum Global Solutions.</p>
            <span class="powered-by">Powered by <a href="https://nexumglobal.solutions/" target="_blank" rel="noopener noreferrer"><strong>Nexum Global Solutions</strong></a></span>
          </div>
          <div class="foot-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#process">Process</a>
            <a href="#pricing">Pricing</a>
            <a href="https://calendly.com/nexumglobalsolutions" target="_blank" rel="noopener noreferrer">Book a Demo</a>
          </div>
          <div class="foot-col">
            <h4>Company</h4>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
            <a href="privacy.html">Privacy Policy</a>
            <a href="terms.html">Terms of Service</a>
          </div>
          <div class="foot-office">
            <h4>Office &amp; Contact</h4>
            <p><span>Head Office</span>137 A, Muslim Town, Lahore, Pakistan</p>
            <p><span>Phone</span><a href="tel:+923278223333">+92 327 8223333</a></p>
            <p><span>Email</span><a href="mailto:info@nexumglobal.solutions">info@nexumglobal.solutions</a></p>
          </div>
          <div class="foot-social">
            <h4>Let's Connect</h4>
            <div class="foot-social-links">
              <a class="soc" data-net="email" href="mailto:info@nexumglobal.solutions" title="Email" aria-label="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a>
              <a class="soc" data-net="whatsapp" href="https://wa.me/923278223333" target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.7 20l3.8-1A8.5 8.5 0 1 0 12 3.5Z"/><path d="M8.5 8.5c.2-.3.5-.4.8-.3l1 .5c.3.2.4.5.3.8l-.5 1c.6 1.3 1.7 2.4 3 3l1-.5c.3-.1.6 0 .8.3l.5 1c.1.3 0 .6-.3.8-.6.4-1.3.6-2 .4a8.2 8.2 0 0 1-5-5c-.2-.7 0-1.4.4-2Z"/></svg></a>
              <a class="soc" data-net="linkedin" href="https://www.linkedin.com/company/nexum-global-solutions/" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.4 2.63 4.4 6.05V21h-4v-5.6c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95V21H9z"/></svg></a>
              <a class="soc" data-net="facebook" href="https://www.facebook.com/nexumglobalsolutions/" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg></a>
              <a class="soc" data-net="instagram" href="https://www.instagram.com/nexumglobalsolutions/" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg></a>
              <a class="soc" data-net="youtube" href="https://www.youtube.com/@NexumGlobalSolutions" target="_blank" rel="noopener noreferrer" title="YouTube" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.4-.44-5.04a3 3 0 0 0-2.12-2.12C18.86 4.4 12 4.4 12 4.4s-6.86 0-8.44.44a3 3 0 0 0-2.12 2.12C1 8.6 1 12 1 12s0 3.4.44 5.04a3 3 0 0 0 2.12 2.12c1.58.44 8.44.44 8.44.44s6.86 0 8.44-.44a3 3 0 0 0 2.12-2.12C23 15.4 23 12 23 12Zm-13.2 3.2V8.8l5.7 3.2-5.7 3.2Z"/></svg></a>
            </div>
          </div>
        </div>
        <div class="footer-legal-row">
          <span>© 2026 Nexum Global Solutions. All rights reserved.</span>
          <nav class="footer-legal-links" aria-label="Legal links">
            <a href="privacy.html">Privacy Policy</a>
            <a href="terms.html">Terms of Service</a>
          </nav>
        </div>
      </div>
    </div>`;

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  /* ---------- Mobile menu drawer ---------- */
  const menu = $('#menu');
  const navLinks = $('#navLinks');
  if (menu && navLinks) {
    menu.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menu.setAttribute('aria-expanded', open);
      menu.textContent = open ? '×' : '☰';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.textContent = '☰';
    }));
  }

  /* ---------- Theme toggle (dark default, persisted) ---------- */
  const THEME_KEY = 'nexum-standalone-theme';
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) document.documentElement.dataset.theme = saved;
  function themeLabel() {
    const dark = document.documentElement.dataset.theme !== 'light';
    const t = $('#theme');
    if (!t) return;
    t.textContent = dark ? '◐' : '☀';
    t.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = dark ? '#06111E' : '#F4F7FB';
  }
  themeLabel();
  const theme = $('#theme');
  if (theme) theme.addEventListener('click', () => {
    const d = document.documentElement;
    const next = d.dataset.theme === 'light' ? 'dark' : 'light';
    d.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    themeLabel();
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  });

  /* ---------- Reveal observer ---------- */
  const revealObs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px' });
  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ---------- Active section highlight on scroll ---------- */
  const sections = ['home', 'about', 'features', 'process', 'pricing', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  const navAnchors = new Map(Array.from($$('[data-nav]')).map(a => [a.dataset.nav, a]));
  const setActive = id => {
    navAnchors.forEach((a, key) => a.classList.toggle('active', key === id));
  };
  if (sections.length && navAnchors.size) {
    const spy = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .forEach(e => setActive(e.target.id));
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach(s => spy.observe(s));
    setActive(sections[0].id);
  }

  /* ---------- Count-up numbers ---------- */
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const countIO = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const el = e.target, end = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
    let t0 = null; const dur = 1800;
    (function tick(t) {
      if (t0 === null) t0 = t;
      const pr = Math.min((t - t0) / dur, 1), v = 1 - Math.pow(1 - pr, 3);
      el.textContent = (end * v).toFixed(dec);
      if (pr < 1) requestAnimationFrame(tick); else el.textContent = end.toFixed(dec);
    })(performance.now());
  }), { threshold: .6 }) : null;
  $$('[data-to]').forEach(el => countIO ? countIO.observe(el) : el.textContent = (+el.dataset.to).toFixed(+(el.dataset.dec || 0)));

  /* ---------- Hero flip word ---------- */
  const flip = document.getElementById('flipWord');
  if (flip) {
    const words = ['company', 'business', 'workforce'];
    let fi = 0;
    setInterval(() => {
      fi = (fi + 1) % words.length;
      if (reduce) { flip.firstChild.nodeValue = words[fi]; return; }
      flip.classList.add('flip-out');
      setTimeout(() => {
        flip.firstChild.nodeValue = words[fi];
        flip.classList.remove('flip-out');
        flip.classList.add('flip-in');
        requestAnimationFrame(() => requestAnimationFrame(() => flip.classList.remove('flip-in')));
      }, 360);
    }, 2500);
  }

  /* ---------- Hero sidebar walkthrough ---------- */
  try {
    const dash = document.querySelector('.hero-card');
    const demoItems = dash ? [...dash.querySelectorAll('.side-item')] : [];
    if (dash && demoItems.length > 1 && !reduce) {
      const bars = [...dash.querySelectorAll('.hd-chart i')];
      let di = Math.max(0, demoItems.findIndex(i => i.classList.contains('active')));
      const replayBars = () => bars.forEach(b => { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; });
      const step = () => {
        demoItems[di].classList.remove('active');
        di = (di + 1) % demoItems.length;
        demoItems[di].classList.add('active');
        replayBars();
      };
      let demoTimer = setInterval(step, 2200);
      document.addEventListener('visibilitychange', () => {
        clearInterval(demoTimer);
        if (!document.hidden) demoTimer = setInterval(step, 2200);
      });
    }
  } catch (e) { /* non-critical */ }

  /* ---------- Floating action — scroll-to-top only ---------- */
  const fab = document.createElement('div');
  fab.className = 'fab-stack';
  fab.innerHTML = `
    <button class="fab" type="button" id="toTop" aria-label="Back to top" title="Back to top">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
    </button>`;
  document.body.appendChild(fab);
  const toTop = fab.querySelector('#toTop');
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  const toTopUpd = () => toTop.classList.toggle('show', window.scrollY > 600);
  toTopUpd(); window.addEventListener('scroll', toTopUpd, { passive: true });

  /* ---------- Scroll progress bar ---------- */
  if (!reduce) {
    document.body.insertAdjacentHTML('afterbegin', '<div class="scroll-prog"><i></i></div>');
    const bar = document.querySelector('.scroll-prog i');
    const upd = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    upd();
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
  }

  /* ---------- Live pricing sync ----------
     Overlays the default HTML prices with whatever is stored in MongoDB via
     /.netlify/functions/pricing. The default numbers ship inline so the cards
     stay readable instantly; this fetch replaces them once the API responds.
     pricing.js listens for the dispatched event to keep its cart total current. */
  if (document.querySelector('[data-price-id]')) {
    fetch('/.netlify/functions/pricing', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!j || !j.ok || !Array.isArray(j.items)) return;
        const fmt = n => `Rs ${Number(n).toLocaleString('en-PK')}`;
        j.items.forEach(it => {
          if (!it || !it.id) return;
          document.querySelectorAll(`[data-price-id="${it.id}"]`).forEach(el => {
            const amount = Number(it.currentAmount);
            if (Number.isFinite(amount)) el.textContent = fmt(amount);
          });
        });
        document.dispatchEvent(new CustomEvent('nexum:prices-updated', { detail: { items: j.items } }));
      })
      .catch(() => { /* leave defaults in place */ });
  }
})();
