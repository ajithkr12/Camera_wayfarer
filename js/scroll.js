/**
 * scroll.js — Premium 3D Carousel Portfolio
 * Camera & Wayfarer
 *
 * ── How the 3D perspective works ──────────────────────────────────────────
 * CSS `perspective: 1400px` on .carousel__container sets the "eye distance."
 * Lower values = more dramatic warp; higher = subtler depth.
 * Each .carousel__card receives rotateY + translateZ + scale transforms
 * calculated from its distance to the viewport horizontal center.
 * Cards at center: rotateY(0°), scale(1), translateZ(0). Cards at edges:
 * up to rotateY(±28°), scale(0.78), translateZ(−160px) — creating genuine
 * depth rather than a flat 2-D slide effect.
 *
 * ── How scroll maps to horizontal animation ────────────────────────────────
 * ScrollTrigger pins .carousel-section for the duration of the horizontal
 * scroll. While pinned, the user's scroll position maps 1:1 (scrubbed with
 * 1.5 s inertia) to a translateX on .carousel__track, driving it from
 * x=0 (card-1 centered) to x=−maxScroll (card-8 centered). The symmetric
 * padding on the track ensures the first and last card are perfectly centered.
 *
 * ── How the GSAP timeline is structured ───────────────────────────────────
 * A single gsap.to() tween animates track.x from 0 → −maxScroll with
 * ease:'none' so scroll progress maps linearly. scrub:1.5 adds 1.5 s of
 * interpolated lag, giving the cinematic "glide." onUpdate fires on every
 * tween tick (post-interpolation), recalculating each card's 3D transform
 * via getBoundingClientRect() — so the math always reflects the actual
 * on-screen position, not a theoretical one.
 *
 * ── Customisation ─────────────────────────────────────────────────────────
 * CFG.rotateMax   → max card tilt in degrees (try 15–40)
 * CFG.scaleMin    → scale of outermost card (try 0.7–0.9)
 * CFG.zDepth      → translateZ depth in px (try 80–250)
 * CFG.scrub       → GSAP scrub inertia in seconds (try 0.8–3)
 * Card size/gap   → edit --card-w, --card-h, --card-gap in scroll.css
 */

'use strict';

/* ── Config ──────────────────────────────────────────────────────────────── */
const CFG = {
  rotateMax:  28,    // max rotateY (degrees)
  scaleMin:   0.78,  // minimum scale at edges
  zDepth:     160,   // translateZ depth (px)
  opacityMin: 0.32,  // minimum card opacity at edges
  scrub:      1.5,   // GSAP scrub lag in seconds
  grainAlpha: 14,    // grain canvas pixel alpha (0-255)
  lerpCursor: 0.1,   // cursor ring lerp factor (lower = lazier)
};

/* ── Utilities ───────────────────────────────────────────────────────────── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ── Cursor state ────────────────────────────────────────────────────────── */
const mouse = { x: 0, y: 0, rx: 0, ry: 0 };

/* ═══════════════════════════════════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL
   Lenis provides inertia-based smooth scrolling that integrates cleanly
   with GSAP's RAF loop so ScrollTrigger always reads the correct position.
   ═══════════════════════════════════════════════════════════════════════════ */
function initLenis() {
  const lenis = new Lenis({
    duration:       1.3,
    easing:         t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth:         true,
    smoothTouch:    false,
    touchMultiplier:2,
  });

  /* Sync lenis with GSAP ticker so both run in the same RAF frame */
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Notify ScrollTrigger on every lenis scroll event */
  lenis.on('scroll', ScrollTrigger.update);

  return lenis;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. HERO ENTRANCE ANIMATION
   ═══════════════════════════════════════════════════════════════════════════ */
function initHero() {
  const titleEl = document.querySelector('.hero__title');
  if (!titleEl) return;

  /* Split title lines (<br> separated) into animated word spans */
  titleEl.innerHTML = titleEl.innerHTML
    .split(/<br\s*\/?>/i)
    .filter(s => s.trim())
    .map(line => `<span class="word"><span class="word-inner">${line.trim()}</span></span>`)
    .join('<br>');

  const tl = gsap.timeline({ delay: 0.25 });

  tl.from('.hero__eyebrow', {
      opacity: 0, y: 18, duration: 0.85, ease: 'power3.out',
    })
    /* Words slide up from below — hidden by parent overflow:hidden */
    .from('.word-inner', {
      yPercent: 112, opacity: 0,
      duration: 1.15, stagger: 0.08,
      ease: 'expo.out',
    }, '-=0.5')
    .to('.hero__desc', {
      opacity: 1, y: 0, duration: 0.95, ease: 'power3.out',
    }, '-=0.55')
    .to('.hero__btn', {
      opacity: 1, duration: 0.7, ease: 'power2.out',
    }, '-=0.55')
    .to('.hero__scroll-indicator', {
      opacity: 1, duration: 0.6, ease: 'power2.out',
    }, '-=0.3');

  /* Hero background slow parallax as user scrolls past */
  gsap.to('.hero__visual img', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start:   'top top',
      end:     'bottom top',
      scrub:   true,
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. INTRO TEXT REVEAL
   ═══════════════════════════════════════════════════════════════════════════ */
function initIntro() {
  gsap.to('.intro__text', {
    opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
    scrollTrigger: {
      trigger:      '.intro',
      start:        'top 75%',
      toggleActions:'play none none reverse',
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. 3-D CAROUSEL — core feature
   ═══════════════════════════════════════════════════════════════════════════ */
function initCarousel() {
  const section  = document.querySelector('.carousel-section');
  const track    = document.getElementById('carouselTrack');
  const progBar  = document.getElementById('progressBar');

  if (!section || !track) return;

  /*
   * maxScroll: how far the track must travel so the last card centres.
   * track.scrollWidth includes the symmetric padding, so subtracting
   * window.innerWidth gives the exact distance from card-1-centred to card-8-centred.
   */
  const getMax = () => Math.max(0, track.scrollWidth - window.innerWidth);

  gsap.to(track, {
    x:        () => -getMax(),
    ease:     'none',
    onUpdate() {
      /* Fires on every GSAP tick (after scrub interpolation) — so
         getBoundingClientRect() returns the current on-screen position. */
      applyCardTransforms();

      /* Update thin progress bar */
      if (progBar) {
        const progress = Math.abs(gsap.getProperty(track, 'x')) / getMax();
        progBar.style.width = `${clamp(progress, 0, 1) * 100}%`;
      }
    },
    scrollTrigger: {
      trigger:          section,
      start:            'top top',
      /*
       * Pinning duration = maxScroll + 40% extra breathing room at start/end.
       * The += syntax adds pixel scroll distance while the section is pinned.
       */
      end:              () => `+=${getMax() + window.innerWidth * 0.4}`,
      pin:              true,
      scrub:            CFG.scrub,
      anticipatePin:    1,
      invalidateOnRefresh: true,
      onRefresh:        applyCardTransforms,  /* recalc after resize */
    },
  });

  /* Render initial 3D state before any scrolling */
  applyCardTransforms();
}

/* ─── Per-frame 3D card transform calculation ───────────────────────────── */
/*
 * For each card:
 *   dist   = (cardCenter − viewportCenter) / spread   → normalised −1..+1
 *   rotateY: dist × −rotateMax          (negative = rotates into screen on right)
 *   scale  : 1 − |dist| × (1−scaleMin)
 *   z      : −|dist| × zDepth          (recedes away from viewer)
 *   opacity: 1 − |dist| × 0.5
 *
 * transformOrigin is set dynamically so the card "hinges" from the edge
 * closest to the viewer, not from its own center — adds realism.
 */
function applyCardTransforms() {
  const cards  = document.querySelectorAll('.carousel__card');
  const viewCX = window.innerWidth / 2;
  /* Spread: a card at this many px from centre gets full rotation */
  const spread = Math.min(window.innerWidth * 0.58, 680);

  cards.forEach(card => {
    const { left, width } = card.getBoundingClientRect();
    const cardCX = left + width / 2;
    const dist   = clamp((cardCX - viewCX) / spread, -1.5, 1.5);
    const abs    = Math.abs(dist);

    gsap.set(card, {
      rotateY:         dist * -CFG.rotateMax,
      scale:           1 - abs * (1 - CFG.scaleMin),
      z:               -abs * CFG.zDepth,
      opacity:         clamp(1 - abs * 0.5, CFG.opacityMin, 1),
      transformOrigin: dist > 0 ? 'left center' : 'right center',
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. CARD HOVER TILT  (micro 3D interaction on mouse-move)
   ═══════════════════════════════════════════════════════════════════════════ */
function initHoverTilt() {
  document.querySelectorAll('.carousel__card').forEach(card => {
    const inner = card.querySelector('.card__inner');
    const img   = card.querySelector('.card__img');

    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      /* Normalise −1..+1 within the card */
      const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;

      /* Subtle tilt on card__inner — separate from the carousel rotateY */
      gsap.to(inner, {
        rotateX:  ny * -5,
        rotateY:  nx * 7,
        duration: 0.35,
        ease:     'power1.out',
        overwrite:'auto',
      });

      gsap.to(img, {
        scale:    1.07,
        duration: 0.5,
        ease:     'power2.out',
        overwrite:'auto',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(inner, {
        rotateX: 0, rotateY: 0,
        duration: 0.65,
        ease:    'power3.out',
        overwrite:'auto',
      });
      gsap.to(img, {
        scale:   1.04,
        duration:0.55,
        ease:    'power2.out',
        overwrite:'auto',
      });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. CASE STUDY CARD REVEALS
   ═══════════════════════════════════════════════════════════════════════════ */
function initCaseStudies() {
  gsap.utils.toArray('.case__card').forEach((card, i) => {
    gsap.from(card, {
      opacity: 0, y: 70,
      duration: 1.05,
      delay:    i * 0.1,
      ease:     'power3.out',
      scrollTrigger: {
        trigger:      card,
        start:        'top 88%',
        toggleActions:'play none none reverse',
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. CTA SECTION
   ═══════════════════════════════════════════════════════════════════════════ */
function initCTA() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger:      '.cta',
      start:        'top 72%',
      toggleActions:'play none none none',
    },
  });

  tl.from('.cta__title', {
      opacity: 0, y: 80,
      duration: 1.25, ease: 'expo.out',
    })
    .from('.cta__btn', {
      opacity: 0, scale: 0.88,
      duration: 0.8, ease: 'back.out(1.6)',
    }, '-=0.6');
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. SECTION HEADING REVEALS  (generic — targets .section__heading)
   ═══════════════════════════════════════════════════════════════════════════ */
function initHeadings() {
  gsap.utils.toArray('.section__heading').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 48,
      duration: 1, ease: 'power3.out',
      scrollTrigger: {
        trigger:      el,
        start:        'top 87%',
        toggleActions:'play none none reverse',
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. FILM-GRAIN CANVAS OVERLAY
   Generates new random noise on every animation frame (real film grain).
   Low alpha (14/255 ≈ 5%) so it's felt rather than seen.
   ═══════════════════════════════════════════════════════════════════════════ */
function initGrain() {
  const canvas = document.getElementById('grain-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const draw = () => {
    const img = ctx.createImageData(W, H);
    const buf = new Uint32Array(img.data.buffer);

    for (let i = 0; i < buf.length; i++) {
      const v = (Math.random() * 255) | 0;
      /* Pack RGBA as a single 32-bit int (little-endian: A is high byte) */
      buf[i] = (CFG.grainAlpha << 24) | (v << 16) | (v << 8) | v;
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(draw);
  };
  draw();
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. CUSTOM CURSOR
   Dot: snaps instantly to mouse via GSAP set.
   Ring: follows with lerp in a rAF loop — the lag is the "magnetic" feel.
   ═══════════════════════════════════════════════════════════════════════════ */
function initCursor() {
  const dot  = document.querySelector('.cursor__dot');
  const ring = document.querySelector('.cursor__ring');

  /* Only activate on non-touch devices */
  if (!dot || !ring || window.matchMedia('(hover: none)').matches) return;

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    gsap.set(dot, { x: mouse.x, y: mouse.y });
  });

  /* Ring lags via lerp */
  const ringLoop = () => {
    mouse.rx = lerp(mouse.rx, mouse.x, CFG.lerpCursor);
    mouse.ry = lerp(mouse.ry, mouse.y, CFG.lerpCursor);
    gsap.set(ring, { x: mouse.rx, y: mouse.ry });
    requestAnimationFrame(ringLoop);
  };
  ringLoop();

  /* Expand ring when hovering interactive elements */
  document.querySelectorAll('a, button, .carousel__card').forEach(el => {
    el.addEventListener('mouseenter', () =>
      gsap.to(ring, { scale: 2.6, opacity: 0.5, duration: 0.3, ease: 'power2.out' })
    );
    el.addEventListener('mouseleave', () =>
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' })
    );
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. SMART NAVIGATION  (hide on scroll down, reveal on scroll up)
   ═══════════════════════════════════════════════════════════════════════════ */
function initNav(lenis) {
  const nav   = document.getElementById('nav');
  if (!nav) return;

  let lastY   = 0;
  let pending = false;

  lenis.on('scroll', ({ scroll }) => {
    if (pending) return;
    pending = true;

    requestAnimationFrame(() => {
      const dir = scroll > lastY ? 'down' : 'up';
      nav.classList.toggle('nav--scrolled', scroll > 80);

      if (scroll < 80) {
        gsap.to(nav, { y: 0, duration: 0.4, ease: 'power2.out' });
      } else if (dir === 'down') {
        gsap.to(nav, { y: '-100%', duration: 0.38, ease: 'power2.in' });
      } else {
        gsap.to(nav, { y: 0, duration: 0.42, ease: 'power2.out' });
      }

      lastY   = scroll;
      pending = false;
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   12. MOBILE TOUCH SWIPE  (fallback for carousel on touch devices)
   ScrollTrigger handles desktop; touch devices get a direct drag handler.
   ═══════════════════════════════════════════════════════════════════════════ */
function initTouchSwipe() {
  const track = document.getElementById('carouselTrack');
  if (!track || !window.matchMedia('(hover: none)').matches) return;

  let startX  = 0;
  let baseX   = 0;
  let dragging= false;

  const getMax = () => Math.max(0, track.scrollWidth - window.innerWidth);

  track.addEventListener('touchstart', e => {
    startX   = e.touches[0].clientX;
    baseX    = gsap.getProperty(track, 'x') || 0;
    dragging = true;
  }, { passive: true });

  track.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dx   = e.touches[0].clientX - startX;
    const newX = clamp(baseX + dx, -getMax(), 0);
    gsap.set(track, { x: newX });
    applyCardTransforms();
  }, { passive: true });

  track.addEventListener('touchend', () => { dragging = false; });
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT — wire everything up after DOM is ready
   ═══════════════════════════════════════════════════════════════════════════ */
function init() {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = initLenis();

  /* Visual layer first */
  initGrain();

  /* Animations */
  initHero();
  initIntro();
  initCarousel();
  initHoverTilt();
  initCaseStudies();
  initCTA();
  initHeadings();

  /* UI */
  initCursor();
  initNav(lenis);
  initTouchSwipe();

  /* Global resize: refresh ScrollTrigger so all scroll distances recalculate */
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
    applyCardTransforms();
  });
}

document.addEventListener('DOMContentLoaded', init);
