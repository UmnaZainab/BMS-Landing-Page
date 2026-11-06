/* Premium landing-page motion powered by Motion.dev. All effects are
   transform/opacity based, run once on entry, and respect reduced motion. */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MotionAPI = window.Motion;

  // Fallback: make sure NOTHING is left hidden. Runs whenever Motion can't
  // drive the page (CDN missing, reduced motion, or a runtime error). Clears
  // the runtime gate class and any inline hiding, and marks reveals visible.
  function revealAll() {
    root.classList.remove('motion-run');
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    document.querySelectorAll(
      '.hero-copy > .eyebrow, .hero-copy > h1, .hero-copy > p, .hero-copy > .hero-actions, ' +
      '.feature, .impact-card, .ring b, .acc > b, .sec-vis em, .impact-fig b, .st-badge'
    ).forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
  }

  // No Motion or reduced motion → use the plain CSS/visible fallback and stop.
  // (motion-run is never added, so the hero keeps its normal visible state.)
  if (!MotionAPI || reduce) {
    root.classList.remove('motion-page');
    revealAll();
    return;
  }

  try {
    const { animate, inView, stagger } = MotionAPI;

    // Hero: a short, sequential entrance without changing document flow.
    // The gate class is added only now, right before we animate, so the hero
    // is never hidden unless this code is actually running.
    const heroItems = document.querySelectorAll(
      '.hero-copy > .eyebrow, .hero-copy > h1, .hero-copy > p, .hero-copy > .hero-actions'
    );
    if (heroItems.length) {
      root.classList.add('motion-run');
      const heroAnim = animate(
        heroItems,
        { y: [24, 0], opacity: [0, 1] },
        { duration: .55, delay: stagger(.09), ease: [.22, 1, .36, 1] }
      );
      // If the entrance ever rejects, snap the hero to its visible end state.
      if (heroAnim && heroAnim.finished && heroAnim.finished.catch) {
        heroAnim.finished.catch(() => heroItems.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; }));
      }
    }

  // Card groups: initialize below the fold, then spring in once as a group.
  function springCards(containerSelector, cardSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const cards = container.querySelectorAll(cardSelector);
    if (!cards.length) return;

    animate(cards, { scale: .94, opacity: 0 }, { duration: 0 });
    inView(container, () => {
      animate(
        cards,
        { scale: [.94, 1], opacity: [0, 1] },
        { delay: stagger(.08), type: 'spring', stiffness: 300, damping: 26, mass: .75 }
      );
    }, { amount: .12, margin: '0px 0px -8% 0px' });
  }

  springCards('.feature-grid', '.feature');
  springCards('.impact-grid', '.impact-card');

  // Primary CTA hover: lift, scale and add a restrained indigo glow.
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    document.querySelectorAll('.btn-primary, .btn-trial').forEach(button => {
      const baseShadow = getComputedStyle(button).boxShadow;
      let control;
      const run = (keyframes, options) => {
        if (control) control.stop();
        control = animate(button, keyframes, options);
      };
      button.addEventListener('pointerenter', () => run(
        { y: -2, scale: 1.02, boxShadow: '0 16px 34px rgba(79,70,229,.34)' },
        { duration: .18, ease: 'easeOut' }
      ));
      button.addEventListener('pointerleave', () => run(
        { y: 0, scale: 1, boxShadow: baseShadow },
        { duration: .22, ease: 'easeOut' }
      ));
    });

    // Feature-card hover uses Motion as its entrance transform remains inline.
    document.querySelectorAll('.feature').forEach(card => {
      const styles = getComputedStyle(card);
      const baseShadow = styles.boxShadow;
      const baseBorder = styles.borderColor;
      let control;
      const run = (keyframes, options) => {
        if (control) control.stop();
        control = animate(card, keyframes, options);
      };
      card.addEventListener('pointerenter', () => run(
        {
          y: -6,
          scale: 1.01,
          borderColor: 'rgba(99,102,241,.42)',
          boxShadow: '0 24px 50px rgba(79,70,229,.14)'
        },
        { duration: .2, ease: 'easeOut' }
      ));
      card.addEventListener('pointerleave', () => run(
        { y: 0, scale: 1, borderColor: baseBorder, boxShadow: baseShadow },
        { duration: .24, ease: 'easeOut' }
      ));
    });
  }

  // Trusted-by logos: replace the CSS keyframe with Motion's linear timeline.
  const logoTrack = document.getElementById('logoTrack');
  if (logoTrack) {
    const carousel = animate(
      logoTrack,
      { x: ['0%', '-50%'] },
      { duration: 34, ease: 'linear', repeat: Infinity }
    );
    const marquee = logoTrack.closest('.logo-marquee');
    if (marquee && finePointer) {
      marquee.addEventListener('pointerenter', () => carousel.pause());
      marquee.addEventListener('pointerleave', () => carousel.play());
    }
  }

  // Impact figures get a separate, subtle pop as their cards enter view.
  const impact = document.querySelector('.impact-grid');
  if (impact) {
    const metrics = impact.querySelectorAll(
      '.ring b, .acc > b, .sec-vis em, .impact-fig b, .st-badge'
    );
    animate(metrics, { scale: .86, y: 8, opacity: 0 }, { duration: 0 });
    inView(impact, () => {
      animate(
        metrics,
        { scale: [.86, 1], y: [8, 0], opacity: [0, 1] },
        { delay: stagger(.07, { startDelay: .18 }), type: 'spring', stiffness: 340, damping: 24 }
      );
    }, { amount: .12, margin: '0px 0px -8% 0px' });
    }
  } catch (e) {
    // Any Motion runtime failure must not strand content — reveal everything.
    revealAll();
  }
})();
