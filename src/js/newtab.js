/*
 * Forge — new tab.
 * One quote. One piece of line art. Black.
 *
 * Quotes come from a shuffled deck saved in localStorage, so you see every quote
 * once before any repeats. The art is picked to fit the quote's theme.
 *
 * Keys (click the page first; the address bar has focus on a new tab):
 *   N, →, Space   next quote + art
 * Debug: newtab.html?art=<id> forces a piece (ids in js/art.js).
 */
(function () {
  'use strict';

  const QUOTES = window.FORGE_QUOTES || [];
  const ART = window.FORGE_ART || [];
  const KEY_DECK = 'forge.deck.v1';
  const KEY_ART = 'forge.art.recent';

  const canvas = document.getElementById('art');
  const ctx = canvas.getContext('2d');
  const quoteEl = document.getElementById('quote');
  const textEl = document.getElementById('quote-text');
  const authorEl = document.getElementById('quote-author');
  const params = new URLSearchParams(location.search);
  const stillAt = params.has('t') ? Number(params.get('t')) || 0 : null; // debug: ?t=6 renders one frame at 6s
  const reduceMotion = stillAt !== null || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (stillAt !== null) document.documentElement.classList.add('still');

  const store = {
    get(k) {
      try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* private mode etc. */ }
    },
  };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function nextQuoteIndex() {
    let deck = store.get(KEY_DECK);
    if (!deck || deck.size !== QUOTES.length || !Array.isArray(deck.order) || deck.order.length === 0) {
      const order = shuffle(QUOTES.map((_, i) => i));
      if (deck && order[0] === deck.last && order.length > 1) order.push(order.shift());
      deck = { size: QUOTES.length, order, last: deck ? deck.last : -1 };
    }
    const i = deck.order.shift();
    deck.last = i;
    store.set(KEY_DECK, deck);
    return i;
  }

  // Art that fits the quote's theme, skipping the last few pieces you saw.
  function nextArt(theme) {
    const forced = ART.find((a) => a.id === params.get('art'));
    if (forced) return forced;
    const recent = Array.isArray(store.get(KEY_ART)) ? store.get(KEY_ART) : [];
    const fits = ART.filter((a) => a.k.includes(theme));
    const pools = [
      fits.filter((a) => !recent.includes(a.id)),
      fits.filter((a) => a.id !== recent[0]),
      ART.filter((a) => !recent.includes(a.id)),
      ART,
    ];
    const pool = pools.find((p) => p.length) || ART;
    const art = pool[Math.floor(Math.random() * pool.length)];
    store.set(KEY_ART, [art.id, ...recent.filter((id) => id !== art.id)].slice(0, 4));
    return art;
  }

  /* ---------- quote ---------- */

  function showQuote() {
    if (!QUOTES.length) return null;
    const i = nextQuoteIndex();
    const q = QUOTES[i];
    textEl.textContent = `“${q.t}”`;
    authorEl.textContent = q.a ? ` — ${q.a}` : '';
    quoteEl.classList.remove('in');
    void quoteEl.offsetWidth; // restart the fade
    quoteEl.classList.add('in');
    return q;
  }

  /* ---------- art ---------- */

  let piece = null;
  let state = null;
  let g = null;
  let start = 0;
  let last = 0;
  let lastDraw = 0;
  let raf = 0;

  function geometry() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const qTop = quoteEl.getBoundingClientRect().top || h * 0.85;
    const top = h * 0.08;
    const bottom = Math.max(top + 140, qTop - h * 0.09);
    const bh = Math.min((bottom - top) / 2, 290);
    const bw = Math.min(w * 0.36, 500, bh * 2.4);
    return { ctx, w, h, cx: w / 2, cy: (top + bottom) / 2, bw, bh, R: Math.min(bw, bh) };
  }

  function paint(t, dt) {
    ctx.clearRect(0, 0, g.w, g.h);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    piece.draw(g, state, t, dt);
    ctx.restore();
  }

  function frame(now) {
    const t = (now - start) / 1000;
    // after the intro, 30fps is plenty — easier on the battery
    if (t > 20 && now - lastDraw < 32) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    lastDraw = now;
    paint(t, dt);
    raf = requestAnimationFrame(frame);
  }

  function run(newPiece) {
    cancelAnimationFrame(raf);
    piece = newPiece;
    g = geometry();
    state = piece.setup(g);
    if (reduceMotion) {
      // settled final frame, no motion
      paint(stillAt ?? 30, 1 / 60);
      return;
    }
    start = last = lastDraw = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function next() {
    const q = showQuote();
    run(nextArt(q && q.k));
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      g = geometry();
      state = piece.setup(g);
      if (reduceMotion) paint(stillAt ?? 30, 1 / 60);
    }, 120);
  });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      next();
    }
  });

  next();
})();
