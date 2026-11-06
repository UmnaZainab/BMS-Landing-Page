/* Shared across every page: injects the header + footer so navigation and
   branding stay consistent, then wires theme, mobile menu, nav auto-hide,
   scroll reveals and count-up animations. */
(function () {
  const page = document.body.dataset.page || 'home';
  const on = k => (k === page ? ' class="on"' : '');
  const logoMark = `<span class="logo" aria-hidden="true">
    <svg viewBox="0 0 40 40" focusable="false">
      <path class="logo-n" d="M8.5 28V12l11 16V12" />
      <path class="logo-b" d="M22 12h5.2a4 4 0 0 1 0 8H22m0 0h6.2a4 4 0 0 1 0 8H22V12" />
      <circle class="logo-node node-a" cx="8.5" cy="12" r="1.6" />
      <circle class="logo-node node-b" cx="19.5" cy="28" r="1.6" />
      <circle class="logo-node node-c" cx="32.2" cy="20" r="1.6" />
    </svg>
  </span>`;

  document.getElementById('site-header').innerHTML = `
    <nav class="nav container" aria-label="Primary navigation">
      <a class="brand" href="index.html">${logoMark}<span><b>NExBMS</b><small>BUSINESS MANAGEMENT SYSTEM</small></span></a>
      <div class="links" id="navLinks">
        <a href="index.html"${on('home')}>Home</a>
        <a href="index.html#about">About Us</a>
        <a href="index.html#features">Features</a>
        <a href="pricing.html"${on('pricing')}>Pricing</a>
        <a href="index.html#blog">Blog</a>
        <a href="contact.html"${on('contact')}>Contact Us</a>
        <a href="demo.html"${on('demo')}>Book a Demo</a>
        <div class="header-social" aria-label="Nexum Global Solutions social media">
          <a href="https://www.linkedin.com/company/nexum-global-solutions/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://www.facebook.com/nexumglobalsolutions/" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://www.instagram.com/nexumglobalsolutions/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.youtube.com/@NexumGlobalSolutions" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>
      </div>
      <div class="nav-actions">
        <button class="theme" id="theme" aria-label="Switch to dark mode" title="Change theme">◐</button>
        <a class="btn btn-dark" href="pricing.html">Get Pricing</a>
        <a class="btn btn-primary" href="demo.html" data-calendly>Book a Demo</a>
        <button class="menu" id="menu" aria-label="Open navigation" aria-expanded="false">☰</button>
      </div>
    </nav>`;

  document.getElementById('site-footer').innerHTML = `
    <div class="container">
      <div class="foot-card">
        <div class="foot-grid">
          <div class="foot-brand">
            <a class="brand" href="index.html">${logoMark}<span><b>NExBMS</b><small>BUSINESS MANAGEMENT SYSTEM</small></span></a>
            <p>Unified people, operations and delivery management for growing teams.</p>
            <div class="foot-credit">
              <span class="powered-by">Powered by <a href="https://nexumglobal.solutions/" target="_blank" rel="noopener noreferrer"><strong>Nexum Global Solutions</strong></a></span>
            </div>
          </div>
          <div class="foot-col">
            <h4>Useful Links</h4>
            <a href="index.html">Home</a>
            <a href="index.html#features">Features</a>
            <a href="index.html#about">About Us</a>
            <a href="pricing.html">Pricing</a>
          </div>
          <div class="foot-col">
            <h4>Quick Links</h4>
            <a href="demo.html">Book a Demo</a>
            <a href="contact.html">Contact Us</a>
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
              <a class="soc" href="https://www.linkedin.com/company/nexum-global-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><span class="soc-ic"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.4 2.63 4.4 6.05V21h-4v-5.6c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95V21H9z"/></svg></span>LinkedIn</a>
              <a class="soc" href="https://www.facebook.com/nexumglobalsolutions/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span class="soc-ic"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg></span>Facebook</a>
              <a class="soc" href="https://www.instagram.com/nexumglobalsolutions/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span class="soc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg></span>Instagram</a>
              <a class="soc" href="https://www.youtube.com/@NexumGlobalSolutions" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><span class="soc-ic"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.4-.44-5.04a3 3 0 0 0-2.12-2.12C18.86 4.4 12 4.4 12 4.4s-6.86 0-8.44.44a3 3 0 0 0-2.12 2.12C1 8.6 1 12 1 12s0 3.4.44 5.04a3 3 0 0 0 2.12 2.12c1.58.44 8.44.44 8.44.44s6.86 0 8.44-.44a3 3 0 0 0 2.12-2.12C23 15.4 23 12 23 12Zm-13.2 3.2V8.8l5.7 3.2-5.7 3.2Z"/></svg></span>YouTube</a>
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

  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);

  // Mobile menu
  const menu = $('#menu'), navLinks = $('#navLinks');
  if (menu) menu.addEventListener('click', () => { const open = navLinks.classList.toggle('open'); menu.setAttribute('aria-expanded', open); menu.textContent = open ? '×' : '☰'; });
  $$('.links a').forEach(a => a.addEventListener('click', () => { navLinks.classList.remove('open'); if (menu) { menu.setAttribute('aria-expanded', 'false'); menu.textContent = '☰'; } }));

  // Theme (persisted), with a smooth cross-fade on switch
  const saved = localStorage.getItem('nexum-standalone-theme'); if (saved) document.documentElement.dataset.theme = saved;
  function themeLabel() { const dark = document.documentElement.dataset.theme === 'dark'; const t = $('#theme'); if (!t) return; t.textContent = dark ? '☀' : '◐'; t.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`); const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#080d18' : '#f6f8fc'; }
  themeLabel();
  const theme = $('#theme'); if (theme) theme.addEventListener('click', () => { const d = document.documentElement; if (!matchMedia('(prefers-reduced-motion:reduce)').matches) { d.classList.add('theming'); clearTimeout(d._th); d._th = setTimeout(() => d.classList.remove('theming'), 450); } d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('nexum-standalone-theme', d.dataset.theme); themeLabel(); });

  // Scroll reveals (runs after any page script has injected its .reveal content)
  const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), { threshold: .1 });
  const motionCards = document.documentElement.classList.contains('motion-page') && window.Motion;
  $$('.reveal').forEach(e => {
    if (motionCards && e.matches('.feature, .impact-card')) return;
    obs.observe(e);
  });

  // Count-up numbers (ease-out cubic); reduced motion jumps to the final value
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const countIO = ('IntersectionObserver' in window) && !reduce ? new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; countIO.unobserve(e.target); const el = e.target, end = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0); let t0 = null; const dur = 1800; (function tick(t) { if (t0 === null) t0 = t; const pr = Math.min((t - t0) / dur, 1), v = 1 - Math.pow(1 - pr, 3); el.textContent = (end * v).toFixed(dec); if (pr < 1) requestAnimationFrame(tick); else el.textContent = end.toFixed(dec); })(performance.now()); }), { threshold: .6 }) : null;
  $$('[data-to]').forEach(el => { countIO ? countIO.observe(el) : el.textContent = (+el.dataset.to).toFixed(+(el.dataset.dec || 0)); });

  // Auto-hide nav on scroll down, reveal on scroll up
  const nav = $('.nav'); let lastY = window.scrollY;
  window.addEventListener('scroll', () => { const y = window.scrollY; if (nav) nav.classList.toggle('hide', y > lastY && y > 260 && !$('#navLinks.open')); lastY = y; }, { passive: true });

  // Hero flip word (home): swap a single inline span's text every 2.5s with a
  // fade + vertical slide. Width is locked to the widest word so the centered
  // headline never reflows and only one word is ever shown.
  const flip = document.getElementById('flipWord');
  if (flip) {
    const words = ['company', 'business'];
    const reduceFlip = matchMedia('(prefers-reduced-motion:reduce)').matches;
    // Measure both words in the real inherited font and reserve the widest.
    const sizer = document.createElement('span');
    sizer.setAttribute('aria-hidden', 'true');
    sizer.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;font:inherit;letter-spacing:inherit';
    flip.appendChild(sizer);
    let maxW = 0;
    words.forEach(w => { sizer.textContent = w; maxW = Math.max(maxW, sizer.offsetWidth); });
    flip.removeChild(sizer);
    if (maxW) flip.style.minWidth = Math.ceil(maxW) + 'px';
    let fi = 0;
    setInterval(() => {
      fi = (fi + 1) % words.length;
      if (reduceFlip) { flip.textContent = words[fi]; return; }
      flip.classList.add('flip-out');
      setTimeout(() => {
        flip.textContent = words[fi];
        flip.classList.remove('flip-out');
        flip.classList.add('flip-in');            // start new word slightly below, hidden
        requestAnimationFrame(() => requestAnimationFrame(() => flip.classList.remove('flip-in')));
      }, 360);
    }, 2500);
  }

  // Infinite logo marquee (home): duplicate the track once for a seamless loop.
  const logoTrack = document.getElementById('logoTrack');
  if (logoTrack) {
    const clone = logoTrack.innerHTML;
    logoTrack.insertAdjacentHTML('beforeend', clone);
    [...logoTrack.children].slice(logoTrack.children.length / 2).forEach(el => el.setAttribute('aria-hidden', 'true'));
  }

  // Back-to-top: a floating button that fades in on scroll and returns to the hero.
  const toTop = document.createElement('button');
  toTop.id = 'toTop';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  document.body.appendChild(toTop);
  const toTopReduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: toTopReduce ? 'auto' : 'smooth' }));
  const toTopUpd = () => toTop.classList.toggle('show', window.scrollY > 600);
  toTopUpd(); window.addEventListener('scroll', toTopUpd, { passive: true });

  // Book a Demo → Calendly scheduler modal (lazy-loads the Calendly embed assets
  // on first open, then initializes the inline widget via the Calendly API).
  const CALENDLY_URL = 'https://calendly.com/umnazainab07/30min';
  let cal = null, calWidget = null, calReady = false, calInited = false, lastFocus = null;
  function ensureCalendlyAssets() {
    if (calReady) return;
    if (!document.querySelector('link[href*="calendly.com/assets"]')) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://assets.calendly.com/assets/external/widget.css'; document.head.appendChild(l);
    }
    if (window.Calendly) { calReady = true; initCalWidget(); return; }
    let s = document.querySelector('script[src*="calendly.com/assets"]');
    if (!s) { s = document.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true; document.head.appendChild(s); }
    s.addEventListener('load', () => { calReady = true; initCalWidget(); });
  }
  function initCalWidget() {
    if (calInited || !window.Calendly || !calWidget) return;
    calInited = true;
    calWidget.innerHTML = '';
    window.Calendly.initInlineWidget({ url: CALENDLY_URL, parentElement: calWidget });
  }
  function buildCal() {
    cal = document.createElement('div');
    cal.className = 'cal-modal';
    cal.innerHTML = `<div class="cal-backdrop" data-cal-close></div><div class="cal-dialog" role="dialog" aria-modal="true" aria-label="Book a demo"><button class="cal-close" type="button" aria-label="Close scheduler" data-cal-close>×</button><div class="cal-widget" style="min-width:320px;height:640px"><div class="cal-loading">Loading scheduler…</div></div></div>`;
    document.body.appendChild(cal);
    calWidget = cal.querySelector('.cal-widget');
    cal.addEventListener('click', e => { if (e.target.hasAttribute('data-cal-close')) closeCal(); });
  }
  function openCal() {
    if (!cal) buildCal();
    ensureCalendlyAssets();
    initCalWidget();
    lastFocus = document.activeElement;
    cal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const btn = cal.querySelector('.cal-close'); if (btn) btn.focus();
  }
  function closeCal() {
    if (!cal) return;
    cal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-calendly]');
    if (trigger) { e.preventDefault(); openCal(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cal && cal.classList.contains('open')) closeCal(); });

  // Hero dashboard preview (home): an auto-playing walkthrough that advances the
  // sidebar highlight (Overview → Leave Requests → Recruitment → …) on a loop and
  // replays the chart bars on each step for a "live product" feel. Wrapped in
  // try/catch and guarded so it no-ops off the home page and never halts the rest
  // of this file; pauses while the tab is hidden and self-heals on return.
  try {
    const dash = document.querySelector('.dash');
    const demoItems = dash ? [...dash.querySelectorAll('.side-item')] : [];
    const demoReduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (dash && demoItems.length > 1 && !demoReduce) {
      const bars = [...dash.querySelectorAll('.hd-chart i, .chart i')];
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
  } catch (e) { /* preview walkthrough is non-critical */ }

  // System-architecture tree (home): hovering a module lights its branch.
  const arch = document.querySelector('.arch-stage');
  if (arch) {
    const brs = [...arch.querySelectorAll('.br')];
    arch.querySelectorAll('.arch-node').forEach(n => {
      const i = n.dataset.br, set = v => { n.classList.toggle('lit', v); brs.forEach(b => { if (b.dataset.br === i) b.classList.toggle('lit', v); }); };
      n.addEventListener('mouseenter', () => set(true));
      n.addEventListener('mouseleave', () => set(false));
    });
  }

  // Scroll progress bar at the top of the viewport.
  if (!matchMedia('(prefers-reduced-motion:reduce)').matches) {
    document.body.insertAdjacentHTML('afterbegin', '<div class="scroll-prog"><i></i></div>');
    const bar = document.querySelector('.scroll-prog i');
    const upd = () => { const h = document.documentElement, max = h.scrollHeight - h.clientHeight; bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`; };
    upd(); window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd, { passive: true });
  }
})();
