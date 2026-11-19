/* NExBMS motion effects: staggered scroll reveals, gentle card hover lifts,
   and reliable fallbacks. Works without external dependencies and respects
   prefers-reduced-motion. If anything fails, elements never stay hidden. */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Belt-and-braces fallback: no matter what, nothing stays at opacity:0.
  const safetyTimer = setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }, 2400);

  try {
    // Mark hover-capable devices so hover-only styles stay off touch screens.
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) root.classList.add('has-hover');

    // Staggered reveal: give every section's reveal children incremental
    // delays, so cards flow in one after another once their section enters
    // the viewport. Delays only apply if no inline --d is already set.
    const groups = [
      '.feature-grid', '.process-grid', '.mod-grid',
      '.insights-grid', '.about-cards', '.arch-grid',
      '.hd-kpis', '.hd-grid'
    ];
    groups.forEach(sel => {
      const container = document.querySelector(sel);
      if (!container) return;
      const children = container.children;
      for (let i = 0; i < children.length; i++) {
        const el = children[i];
        if (!el.classList.contains('reveal')) el.classList.add('reveal');
        if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 0.07) + 's');
      }
    });

    // Scroll-triggered reveal via IntersectionObserver. common.js installs
    // its own observer too; this one is a safety net and also adds a brief
    // class to any element with data-motion for custom hooks.
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add('visible');
          io.unobserve(e.target);
        });
      }, { threshold: .12, rootMargin: '0px 0px -40px' });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }

    // Reduced motion short-circuit: everything just appears.
    if (reduce) {
      clearTimeout(safetyTimer);
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }

    // Subtle card hover: primary CTA, feature, process, pricing and insight
    // cards all lift a little on pointer enter. We use inline transitions
    // defined in CSS; this JS only toggles a .hover-lift class, so there is
    // no runtime dependency.
    if (fine) {
      const hoverables = [
        '.btn-primary', '.feature', '.process-card', '.mod-card',
        '.insight-card', '.about-card', '.arch-card'
      ];
      hoverables.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.addEventListener('pointerenter', () => el.classList.add('hover-lift'));
          el.addEventListener('pointerleave', () => el.classList.remove('hover-lift'));
        });
      });
    }

    clearTimeout(safetyTimer);
  } catch (e) {
    // Any error, reveal everything so nothing stays hidden.
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    clearTimeout(safetyTimer);
  }
})();
