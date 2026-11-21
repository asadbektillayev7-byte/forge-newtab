/*
 * Forge — more line art, plus the theme map that ties art to quotes.
 * Same contract as art.js: { id, label, k: [themes], setup(g), draw(g, state, t, dt) }.
 * Themes: discipline · fear · fall · seen · compare · become · time · body · build
 */
(function () {
  'use strict';

  const { TAU, clamp, lerp, easeOut, easeInOut, rand, randInt, W, seg, dot, ring, text } = window.FORGE_KIT;

  /* ------------------------------------------------------------------ */
  /* HOURGLASS — it runs out. Then you turn it over.                     */
  /* ------------------------------------------------------------------ */
  const hourglass = {
    id: 'hourglass',
    label: 'Sand',
    setup(g) {
      const H = g.bh * 0.9;
      const Wd = Math.min(H * 0.6, g.bw * 0.6);
      const neck = Wd * 0.06;
      const width = (u) => neck + (Wd - neck) * Math.pow(Math.sin(clamp(u) * Math.PI / 2), 0.75);
      const sp = Math.max(4, Wd / 24);
      const grains = [];
      let row = 0;
      for (let y = sp; y < H * 0.97; y += sp * 0.87, row++) {
        const u = y / H;
        const w = width(u) - 4;
        for (let x = -w + (row % 2 ? sp / 2 : 0); x < w; x += sp) grains.push({ x, u, j: rand(-0.6, 0.6) });
      }
      return { H, Wd, width, grains, sp, period: 15 };
    },
    draw(g, st, t) {
      const { ctx, cx, cy } = g;
      const { H, Wd, width, grains, sp } = st;
      const appear = easeOut(t / 1);
      const P = st.period + 1.8;
      const tau = t % P;
      const f = clamp(tau / st.period);
      const flip = easeInOut((tau - st.period - 0.3) / 1.3);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(flip * Math.PI);

      ctx.strokeStyle = W(0.95 * appear);
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const u = -1 + (2 * i) / 48;
          const x = s * width(Math.abs(u));
          i ? ctx.lineTo(x, u * H) : ctx.moveTo(x, u * H);
        }
        ctx.stroke();
      }
      seg(ctx, -Wd * 1.15, -H, Wd * 1.15, -H);
      seg(ctx, -Wd * 1.15, H, Wd * 1.15, H);

      const top = 0.68 * (1 - f);
      const bot = 0.68 * f;
      ctx.fillStyle = W(0.8 * appear);
      for (const gr of grains) {
        const edge = Math.abs(gr.x) / Wd;
        const dip = f > 0 && f < 1 ? 0.1 * (1 - edge) : 0;
        if (gr.u < top - dip) ctx.fillRect(gr.x + gr.j - 0.8, -gr.u * H - 0.8, 1.6, 1.6);
        if (bot > 0.005 && gr.u > 1 - bot + 0.12 * edge - 0.04) ctx.fillRect(gr.x + gr.j - 0.8, gr.u * H - 0.8, 1.6, 1.6);
      }
      if (f > 0 && f < 1) {
        const end = (1 - bot + 0.02) * H;
        for (let y = (t * H * 1.4) % (sp * 1.6); y < end; y += sp * 1.6) ctx.fillRect(-0.8, y, 1.6, 1.6);
      }
      ctx.restore();
    },
  };

  /* ------------------------------------------------------------------ */
  /* DRIP — water beats stone. Not by force. By showing up.              */
  /* ------------------------------------------------------------------ */
  const drip = {
    id: 'drip',
    label: 'Drop by drop',
    setup(g) {
      return {
        src: g.cy - g.bh * 0.9,
        top: g.cy + g.bh * 0.2,
        bot: g.cy + g.bh * 0.72,
        hw: g.bw * 0.6,
        period: 1.3,
        max: g.bh * 0.4,
      };
    },
    draw(g, st, t) {
      const { ctx, cx } = g;
      const appear = easeOut(t / 0.8);
      const n = Math.max(0, (t - 0.6) / st.period);
      const k = Math.floor(n);
      const ph = n - k;
      const depth = st.max * (1 - Math.exp(-(k + 4) / 22));
      const gw = g.bw * 0.07 + depth * 0.55;

      ctx.strokeStyle = W(appear);
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - st.hw, st.bot);
      ctx.lineTo(cx - st.hw, st.top);
      for (let i = 0; i <= 40; i++) {
        const u = (i / 40) * 2 - 1;
        ctx.lineTo(cx + u * gw, st.top + depth * 0.5 * (1 + Math.cos(Math.PI * u)));
      }
      ctx.lineTo(cx + st.hw, st.top);
      ctx.lineTo(cx + st.hw, st.bot);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = W(0.35 * appear);
      ctx.lineWidth = 1;
      seg(ctx, cx - 18, st.src, cx + 18, st.src);

      const surf = st.top + depth;
      const fall = 0.42;
      ctx.fillStyle = W(appear);
      if (t > 0.6) {
        if (ph < fall) {
          const u = ph / fall;
          const y = lerp(st.src + 4, surf - 3, u * u);
          dot(ctx, cx, y, 3);
          ctx.strokeStyle = W(0.5);
          ctx.lineWidth = 1.5;
          seg(ctx, cx, y - 3 - 10 * u, cx, y - 3);
        } else {
          const u = (ph - fall) / 0.4;
          if (u < 1) {
            ctx.strokeStyle = W(0.7 * (1 - u));
            ctx.lineWidth = 1.25;
            for (const s of [-1, 1]) seg(ctx, cx + s * (4 + u * 16), surf - Math.sin(Math.PI * u) * 12, cx + s * (6 + u * 20), surf - Math.sin(Math.PI * u) * 12 - 3);
          }
          const r = 3 * clamp((ph - 0.6) / 0.4);
          if (r > 0.2) dot(ctx, cx, st.src + 4, r);
        }
      }
      text(ctx, `${k}`, cx, st.bot + 22, { align: 'center', alpha: 0.35 * appear, size: 11 });
    },
  };

  /* ------------------------------------------------------------------ */
  /* BRICKS — you don't build a wall. You lay a brick. Then another.     */
  /* ------------------------------------------------------------------ */
  const bricks = {
    id: 'bricks',
    label: 'Brick by brick',
    setup(g) {
      const cols = 7;
      const rows = 8;
      const bw = Math.min((g.bw * 1.6) / cols, (g.bh * 1.7) / rows / 0.45);
      const bh = bw * 0.45;
      const x0 = g.cx - (bw * cols) / 2;
      const y0 = g.cy + (bh * rows) / 2;
      const list = [];
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? bw / 2 : 0;
        const xs = [];
        if (off) xs.push([x0, bw / 2]);
        for (let c = 0; c < cols - (off ? 1 : 0); c++) xs.push([x0 + off + c * bw, bw]);
        if (off) xs.push([x0 + bw * cols - bw / 2, bw / 2]);
        for (const [x, w] of xs) list.push({ x, y: y0 - (r + 1) * bh, w, h: bh });
      }
      return { list, x0, y0, total: bw * cols, step: 0.2 };
    },
    draw(g, st, t) {
      const { ctx } = g;
      const cycle = 0.6 + st.list.length * st.step + 4;
      const tau = t % cycle;
      const fade = 1 - clamp((tau - (cycle - 0.8)) / 0.8);
      ctx.strokeStyle = W(0.25 * easeOut(t / 0.6));
      ctx.lineWidth = 1;
      seg(ctx, st.x0 - 40, st.y0, st.x0 + st.total + 40, st.y0);
      const placed = Math.floor((tau - 0.6) / st.step);
      ctx.lineWidth = 1.6;
      st.list.forEach((b, i) => {
        const u = easeOut((tau - 0.6 - i * st.step) / 0.35);
        if (u <= 0) return;
        const latest = i === placed;
        ctx.strokeStyle = W((latest ? 1 : 0.62) * u * fade);
        ctx.strokeRect(b.x + 2, b.y + 2 - (1 - u) * 26, b.w - 4, b.h - 4);
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* KINTSUGI — it breaks. The cracks become the strongest part.         */
  /* ------------------------------------------------------------------ */
  const kintsugi = {
    id: 'kintsugi',
    label: 'Broken places',
    setup(g) {
      const s = g.R * 0.82;
      const inside = (x, y) => Math.abs(x) < s && Math.abs(y) < s;
      const ix = rand(-0.25, 0.25) * s;
      const iy = rand(-0.25, 0.25) * s;
      const segs = [];
      const walk = (x, y, ang, d, life, w) => {
        for (let n = 0; n < life; n++) {
          const step = s * rand(0.07, 0.13);
          ang += rand(-0.45, 0.45);
          let nx = x + Math.cos(ang) * step;
          let ny = y + Math.sin(ang) * step;
          let out = false;
          if (!inside(nx, ny)) {
            let a = 0, b = 1;
            for (let k = 0; k < 12; k++) {
              const m = (a + b) / 2;
              inside(x + (nx - x) * m, y + (ny - y) * m) ? (a = m) : (b = m);
            }
            nx = x + (nx - x) * b;
            ny = y + (ny - y) * b;
            out = true;
          }
          const len = Math.hypot(nx - x, ny - y);
          segs.push({ x, y, nx, ny, d0: d, d1: d + len, w });
          d += len;
          x = nx;
          y = ny;
          if (out) return;
          if (w > 1 && Math.random() < 0.22) walk(x, y, ang + rand(0.5, 1.1) * (Math.random() < 0.5 ? -1 : 1), d, randInt(2, 5), 1);
        }
      };
      const rays = randInt(5, 7);
      for (let i = 0; i < rays; i++) walk(ix, iy, (i / rays) * TAU + rand(-0.3, 0.3), 0, 40, 2);
      return { s, ix, iy, segs, maxD: Math.max(...segs.map((q) => q.d1)) };
    },
    draw(g, st, t) {
      const { ctx, cx, cy } = g;
      const { s } = st;
      const appear = easeOut(t / 0.8);
      ctx.strokeStyle = W(0.9 * appear);
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);

      const hit = t - 1.1;
      if (hit > -0.3 && hit < 0.4) {
        ctx.fillStyle = W(1 - Math.abs(hit) / 0.4);
        dot(ctx, cx + st.ix, cy + st.iy, 5);
      }
      const D = Math.max(0, hit) * st.maxD * 1.4;
      const G = Math.max(0, t - 3.2) * st.maxD * 0.45;
      for (const q of st.segs) {
        if (D <= q.d0) continue;
        const p = clamp((D - q.d0) / (q.d1 - q.d0));
        const gold = clamp((G - q.d0) / (q.d1 - q.d0));
        ctx.strokeStyle = W(lerp(0.4, 1, gold));
        ctx.lineWidth = lerp(1, q.w > 1 ? 2.6 : 1.8, gold);
        seg(ctx, cx + q.x, cy + q.y, cx + lerp(q.x, q.nx, p), cy + lerp(q.y, q.ny, p));
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* SISYPHUS — slips twice. The third time it goes over.                */
  /* ------------------------------------------------------------------ */
  const sisyphus = {
    id: 'sisyphus',
    label: 'Again',
    setup(g) {
      const A = { x: g.cx - g.bw, y: g.cy + g.bh * 0.72 };
      const C = { x: g.cx + g.bw * 0.38, y: g.cy - g.bh * 0.42 };
      const B = { x: g.cx + g.bw, y: g.cy + g.bh * 0.3 };
      const L1 = Math.hypot(C.x - A.x, C.y - A.y);
      const L2 = Math.hypot(B.x - C.x, B.y - C.y);
      const rb = g.R * 0.12;
      const d0 = rb + 24;
      const ph = [];
      const add = (dur, f) => ph.push({ dur, f });
      for (const p of [0.42, 0.74]) {
        const top = p * L1;
        add(2.4 * p + 0.6, (u) => { const b = lerp(d0, top, easeInOut(u)); return [b, b - rb - 7]; });
        add(0.5, () => [top, top - rb - 7]);
        add(1.1, (u) => [lerp(top, d0, u * u), top - rb - 7]);
        add(1.2, (u) => [d0, lerp(top - rb - 7, d0 - rb - 7, easeInOut(u))]);
      }
      add(3.4, (u) => { const b = lerp(d0, L1, easeInOut(u)); return [b, b - rb - 7]; });
      add(1.6, (u) => [lerp(L1, L1 + L2 * 0.8, u * u), L1 - rb - 7 + (rb + 7) * easeOut(u)]);
      add(3, () => [L1 + L2 * 0.8, L1]);
      add(0.8, () => [L1 + L2 * 0.8, L1]);
      return { A, B, C, L1, L2, rb, ph, total: ph.reduce((s, p) => s + p.dur, 0) };
    },
    at(st, d) {
      const { A, B, C, L1, L2 } = st;
      let p, q, u;
      if (d <= L1) { p = A; q = C; u = d / L1; } else { p = C; q = B; u = Math.min(1, (d - L1) / L2); }
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const len = Math.hypot(dx, dy);
      return { x: p.x + dx * u, y: p.y + dy * u, nx: dy / len, ny: -dx / len };
    },
    draw(g, st, t) {
      const { ctx } = g;
      const appear = easeOut(t / 0.8);
      let tau = t % st.total;
      let i = 0;
      while (tau > st.ph[i].dur && i < st.ph.length - 1) tau -= st.ph[i++].dur;
      const [db, dm] = st.ph[i].f(clamp(tau / st.ph[i].dur));
      const fade = i === st.ph.length - 1 ? 1 - clamp(tau / st.ph[i].dur) : 1;

      ctx.strokeStyle = W(0.85 * appear);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(st.A.x, st.A.y);
      ctx.lineTo(st.C.x, st.C.y);
      ctx.lineTo(st.B.x, st.B.y);
      ctx.stroke();

      const b = sisyphus.at(st, db);
      const bx = b.x + b.nx * st.rb;
      const by = b.y + b.ny * st.rb;
      ctx.strokeStyle = W(appear * fade);
      ring(ctx, bx, by, st.rb);
      const rot = db / st.rb;
      ctx.lineWidth = 1.25;
      seg(ctx, bx, by, bx + Math.cos(rot) * st.rb * 0.6, by + Math.sin(rot) * st.rb * 0.6);

      const m = sisyphus.at(st, Math.max(4, dm));
      ctx.fillStyle = W(appear * fade);
      dot(ctx, m.x + m.nx * 5, m.y + m.ny * 5, 4.5);
    },
  };

  /* ------------------------------------------------------------------ */
  /* LIGHTHOUSE — somebody is looking for you.                           */
  /* ------------------------------------------------------------------ */
  const lighthouse = {
    id: 'lighthouse',
    label: 'Lighthouse',
    setup(g) {
      const hy = g.cy + g.bh * 0.32;
      const rows = [];
      for (let r = 0; r < 5; r++) {
        const y = hy + 12 + Math.pow(r / 4, 1.5) * g.bh * 0.5;
        const dashes = [];
        for (let x = g.cx - g.bw + rand(0, 60); x < g.cx + g.bw - 30; x += rand(60, 150)) dashes.push({ x, w: rand(8, 26) * (0.6 + r / 5), p: rand(0, TAU) });
        rows.push({ y, dashes });
      }
      return { hy, rows, lx: g.cx - g.bw * 0.66, th: g.bh * 0.78, boat: g.cx + g.bw * 0.72 };
    },
    draw(g, st, t) {
      const { ctx, cx, bw } = g;
      const appear = easeOut(t / 1);
      const { hy, lx, th } = st;
      ctx.strokeStyle = W(0.3 * appear);
      ctx.lineWidth = 1;
      seg(ctx, cx - bw, hy, cx + bw, hy);

      const phi = t * 0.75;
      const reach = Math.cos(phi);
      const ly = hy - th;
      const beamLen = (reach > 0 ? bw * 1.9 : bw * 0.5) * Math.abs(reach);
      const dir = reach > 0 ? 1 : -1;

      for (const row of st.rows) {
        for (const d of row.dashes) {
          const lit = reach > 0 && d.x > lx && d.x < lx + beamLen ? 0.35 * reach : 0;
          ctx.strokeStyle = W((0.12 + 0.06 * Math.sin(t * 1.3 + d.p) + lit) * appear);
          seg(ctx, d.x, row.y, d.x + d.w, row.y);
        }
      }

      ctx.strokeStyle = W(appear);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx - 15, hy);
      ctx.lineTo(lx - 9, ly + 14);
      ctx.lineTo(lx + 9, ly + 14);
      ctx.lineTo(lx + 15, hy);
      ctx.stroke();
      ctx.strokeRect(lx - 9, ly - 2, 18, 16);
      seg(ctx, lx - 12, ly - 2, lx, ly - 12);
      seg(ctx, lx, ly - 12, lx + 12, ly - 2);
      ctx.lineWidth = 1;
      for (const f of [0.35, 0.65]) seg(ctx, lx - 15 + 6 * f * 2, lerp(hy, ly + 14, f), lx + 15 - 6 * f * 2, lerp(hy, ly + 14, f));

      const glow = 0.4 + 0.6 * Math.abs(Math.sin(phi));
      ctx.fillStyle = W(glow * appear);
      dot(ctx, lx, ly + 6, 3.5);
      if (beamLen > 4) {
        const spread = 0.08;
        ctx.strokeStyle = W(0.9 * Math.abs(reach) * appear);
        ctx.lineWidth = 1.25;
        for (const s of [-1, 1]) seg(ctx, lx, ly + 6, lx + dir * beamLen, ly + 6 + s * beamLen * spread);
        ctx.strokeStyle = W(0.25 * Math.abs(reach) * appear);
        ctx.lineWidth = 1;
        for (const s of [-0.5, 0, 0.5]) seg(ctx, lx, ly + 6, lx + dir * beamLen * 0.96, ly + 6 + s * beamLen * spread);
      }

      const boatLit = reach > 0 && lx + beamLen > st.boat ? reach : 0;
      ctx.strokeStyle = W((0.3 + 0.7 * boatLit) * appear);
      ctx.lineWidth = 1.5;
      const bx = st.boat;
      ctx.beginPath();
      ctx.moveTo(bx - 10, hy - 4);
      ctx.lineTo(bx - 6, hy);
      ctx.lineTo(bx + 6, hy);
      ctx.lineTo(bx + 10, hy - 4);
      ctx.closePath();
      ctx.stroke();
      seg(ctx, bx, hy - 4, bx, hy - 16);
    },
  };

  /* ------------------------------------------------------------------ */
  /* CONSTELLATION — you were never as alone as it felt.                 */
  /* ------------------------------------------------------------------ */
  const constellation = {
    id: 'constellation',
    label: 'Not alone',
    setup(g) {
      const pts = [{ x: 0, y: 0 }];
      const min = g.R * 0.16;
      let tries = 0;
      while (pts.length < 44 && tries++ < 4000) {
        const x = rand(-1, 1) * g.bw * 0.95;
        const y = rand(-1, 1) * g.bh * 0.9;
        if (pts.every((p) => Math.hypot(p.x - x, p.y - y) > min)) pts.push({ x, y, p: rand(0, TAU) });
      }
      const inTree = new Set([0]);
      const edges = [];
      while (inTree.size < pts.length) {
        let best = null;
        for (const i of inTree) for (let j = 0; j < pts.length; j++) {
          if (inTree.has(j)) continue;
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (!best || d < best.d) best = { i, j, d };
        }
        inTree.add(best.j);
        edges.push(best);
      }
      return { pts, edges };
    },
    draw(g, st, t) {
      const { ctx, cx, cy } = g;
      const appear = easeOut(t / 0.8);
      ctx.lineWidth = 1;
      st.edges.forEach((e, n) => {
        const p = easeOut((t - 1 - n * 0.11) / 0.5);
        if (p <= 0) return;
        const a = st.pts[e.i];
        const b = st.pts[e.j];
        ctx.strokeStyle = W(0.38);
        seg(ctx, cx + a.x, cy + a.y, cx + lerp(a.x, b.x, p), cy + lerp(a.y, b.y, p));
      });
      st.pts.forEach((p, i) => {
        if (i === 0) return;
        ctx.fillStyle = W((0.45 + 0.35 * Math.sin(t * 1.4 + p.p)) * appear);
        dot(ctx, cx + p.x, cy + p.y, 1.8);
      });
      ctx.fillStyle = W(appear);
      dot(ctx, cx, cy, 4);
      const ph = (t % 3) / 3;
      ctx.strokeStyle = W(0.5 * (1 - ph) * appear);
      ring(ctx, cx, cy, 4 + ph * 16);
    },
  };

  /* ------------------------------------------------------------------ */
  /* LANES — everyone is running a different race. Run yours.            */
  /* ------------------------------------------------------------------ */
  const lanes = {
    id: 'lanes',
    label: 'Your lane',
    setup() {
      const n = 7;
      const me = 3;
      return { n, me, v: Array.from({ length: n }, (_, i) => (i === me ? 0.11 : rand(0.05, 0.22))), o: Array.from({ length: n }, () => rand(0, 1)) };
    },
    draw(g, st, t) {
      const { ctx, cx, cy, bw, bh } = g;
      const appear = easeOut(t / 0.8);
      const x0 = cx - bw;
      const Wd = bw * 2;
      for (let i = 0; i < st.n; i++) {
        const y = cy + (i - (st.n - 1) / 2) * ((bh * 1.6) / (st.n - 1));
        const mine = i === st.me;
        const grow = easeOut((t - 0.1 - i * 0.06) / 0.8);
        ctx.strokeStyle = W((mine ? 0.5 : 0.16) * appear);
        ctx.lineWidth = 1;
        seg(ctx, x0, y, x0 + Wd * grow, y);
        if (t < 0.9) continue;
        const pos = (st.o[i] + (t - 0.9) * st.v[i]) % 1;
        const x = x0 + pos * Wd;
        if (mine) {
          const trail = Math.min(x - x0, Wd * 0.18);
          const K = 24;
          ctx.lineWidth = 2.4;
          for (let s = 0; s < K; s++) {
            ctx.strokeStyle = W(Math.pow((s + 1) / K, 1.5));
            seg(ctx, x - trail * (1 - s / K), y, x - trail * (1 - (s + 1) / K), y);
          }
          ctx.fillStyle = W(1);
          dot(ctx, x, y, 4.5);
        } else {
          ctx.fillStyle = W(0.32);
          dot(ctx, x, y, 3);
        }
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* LEVER — small force, right place, big weight moves.                 */
  /* ------------------------------------------------------------------ */
  const lever = {
    id: 'lever',
    label: 'Leverage',
    setup(g) {
      const gy = g.cy + g.bh * 0.6;
      const a = g.bw * 0.3;
      const b = g.bw * 1.2;
      const fx = g.cx - g.bw * 0.45;
      const hf = a * 0.5;
      return { gy, a, b, fx, hf, py: gy - hf, block: g.R * 0.42, t0: Math.asin(hf / a), t1: -Math.asin(hf / b) };
    },
    draw(g, st, t) {
      const { ctx, cx, bw } = g;
      const { gy, a, b, fx, hf, py, block } = st;
      const appear = easeOut(t / 0.8);
      const cyc = 9;
      const tau = t % cyc;
      const drop = clamp((tau - 1.2) / 0.55);
      const tilt = easeOut((tau - 1.75) / 1.1);
      const back = easeInOut((tau - 6.6) / 1.6);
      const th = lerp(lerp(st.t0, st.t1, tilt), st.t0, back);

      ctx.strokeStyle = W(0.25 * appear);
      ctx.lineWidth = 1;
      seg(ctx, cx - bw, gy, cx + bw, gy);

      ctx.strokeStyle = W(appear);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx - hf * 0.55, gy);
      ctx.lineTo(fx, py);
      ctx.lineTo(fx + hf * 0.55, gy);
      ctx.stroke();

      ctx.save();
      ctx.translate(fx, py);
      ctx.rotate(-th);
      ctx.lineWidth = 2.5;
      seg(ctx, -a, -3, b, -3);
      ctx.lineWidth = 2;
      ctx.strokeRect(-a + 2, -3 - block, block, block);
      const dropY = lerp(-(gy - (g.cy - g.bh * 0.9)), -9, drop * drop);
      const lifted = back > 0 ? -back * 120 : 0;
      if (tau > 1.2 || tau < 0.1) {
        ctx.fillStyle = W(1 - back);
        dot(ctx, b - 8, (tau > 1.75 ? -9 : dropY) + lifted, 6);
      }
      ctx.restore();
    },
  };

  /* ------------------------------------------------------------------ */
  /* SIGNAL — the noise doesn't go away. You just stop following it.     */
  /* ------------------------------------------------------------------ */
  const signal = {
    id: 'signal',
    label: 'Signal',
    setup() {
      return { comps: Array.from({ length: 7 }, () => ({ f: rand(0.04, 0.16), w: rand(1.5, 5), p: rand(0, TAU), a: rand(0.3, 1) })) };
    },
    draw(g, st, t) {
      const { ctx, cx, cy, bw, bh } = g;
      const appear = easeOut(t / 0.8);
      const clean = easeInOut((t - 1.2) / 5);
      const x0 = cx - bw;
      const N = 520;
      const noise = (x) => {
        let s = 0;
        let n = 0;
        for (const c of st.comps) { s += c.a * Math.sin(x * c.f + t * c.w + c.p); n += c.a; }
        return s / n;
      };
      const sine = (x) => Math.sin(x * ((TAU * 2.5) / (bw * 2)) - t * 1.4);
      const draw = (mix, alpha, lw) => {
        ctx.strokeStyle = W(alpha);
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const x = (i / N) * bw * 2;
          const env = Math.sin((i / N) * Math.PI);
          const y = cy - env * bh * 0.55 * lerp(noise(x) * 1.25, sine(x), mix);
          i ? ctx.lineTo(x0 + x, y) : ctx.moveTo(x0 + x, y);
        }
        ctx.stroke();
      };
      draw(0, 0.16 * appear * clean, 1);
      draw(clean, appear, 2);
    },
  };

  /* ------------------------------------------------------------------ */
  /* RIPPLE — one small act. It travels further than you think.          */
  /* ------------------------------------------------------------------ */
  const ripple = {
    id: 'ripple',
    label: 'Ripple',
    setup(g) {
      return { y: g.cy + g.bh * 0.3, top: g.cy - g.bh * 0.9, period: 7 };
    },
    draw(g, st, t) {
      const { ctx, cx, bw } = g;
      const appear = easeOut(t / 0.8);
      ctx.strokeStyle = W(0.2 * appear);
      ctx.lineWidth = 1;
      seg(ctx, cx - bw, st.y - g.bh * 0.5, cx + bw, st.y - g.bh * 0.5);
      const tau = (t + st.period - 0.6) % st.period;
      const fallT = 0.75;
      if (tau < fallT && t > 0.6) {
        const u = tau / fallT;
        ctx.fillStyle = W(1);
        dot(ctx, cx, lerp(st.top, st.y, u * u), 4);
      }
      const since = tau - fallT;
      for (let k = 0; k < 6; k++) {
        const age = since - k * 0.42;
        if (age <= 0) continue;
        const rx = age * bw * 0.42;
        const a = clamp(1 - rx / (bw * 1.05)) * (1 - k * 0.12);
        if (a <= 0.01) continue;
        ctx.strokeStyle = W(a * appear);
        ctx.lineWidth = k === 0 ? 2 : 1.25;
        ctx.beginPath();
        ctx.ellipse(cx, st.y, rx, rx * 0.24, 0, 0, TAU);
        ctx.stroke();
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* ROOTS — what you see above ground is the small part.                */
  /* ------------------------------------------------------------------ */
  const roots = {
    id: 'roots',
    label: 'Roots',
    setup(g) {
      const gy = g.cy - g.bh * 0.12;
      const segs = [];
      const grow = (x, y, ang, len, depth) => {
        const ex = x + Math.cos(ang) * len;
        const ey = y + Math.sin(ang) * len;
        segs.push({ x, y, ex, ey, depth });
        if (depth >= 6) return;
        const kids = Math.random() < 0.7 ? 2 : 1;
        for (let i = 0; i < kids; i++) {
          const na = ang + (kids === 1 ? rand(-0.4, 0.4) : (i ? 1 : -1) * rand(0.25, 0.7));
          const clampA = Math.min(Math.PI - 0.25, Math.max(0.25, na));
          grow(ex, ey, clampA, len * rand(0.68, 0.85), depth + 1);
        }
      };
      grow(g.cx, gy, Math.PI / 2, g.bh * 0.3, 0);
      let maxY = gy;
      for (const s of segs) maxY = Math.max(maxY, s.ey);
      const k = Math.min(1, (g.cy + g.bh * 0.95 - gy) / (maxY - gy));
      for (const s of segs) { s.y = gy + (s.y - gy) * k; s.ey = gy + (s.ey - gy) * k; s.x = g.cx + (s.x - g.cx) * k; s.ex = g.cx + (s.ex - g.cx) * k; }
      const stemH = g.bh * 0.5;
      const leaves = [0.35, 0.55, 0.72, 0.86].map((f, i) => ({ f, s: i % 2 ? 1 : -1 }));
      return { gy, segs, stemH, leaves, bend: rand(-0.12, 0.12) };
    },
    draw(g, st, t) {
      const { ctx, cx, bw } = g;
      const appear = easeOut(t / 0.6);
      ctx.strokeStyle = W(0.3 * appear);
      ctx.lineWidth = 1;
      seg(ctx, cx - bw, st.gy, cx + bw, st.gy);

      for (const s of st.segs) {
        const p = easeOut((t - 0.4 - s.depth * 0.5) / 0.6);
        if (p <= 0) continue;
        ctx.strokeStyle = W(0.55 - s.depth * 0.05);
        ctx.lineWidth = Math.max(0.8, 2.2 - s.depth * 0.25);
        seg(ctx, s.x, s.y, lerp(s.x, s.ex, p), lerp(s.y, s.ey, p));
      }

      const h = easeInOut((t - 1.5) / 3) * st.stemH;
      const sway = Math.sin(t * 0.8) * 0.04;
      const at = (f) => [cx + Math.sin(f * 1.6) * st.bend * st.stemH + sway * f * st.stemH, st.gy - f * st.stemH];
      if (h > 0) {
        ctx.strokeStyle = W(1);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, st.gy);
        for (let f = 0; f <= h / st.stemH; f += 0.02) ctx.lineTo(...at(f));
        ctx.stroke();
        ctx.lineWidth = 1.5;
        for (const lf of st.leaves) {
          const k = easeOut((h / st.stemH - lf.f) / 0.12);
          if (k <= 0) continue;
          const [x, y] = at(lf.f);
          const L = 18 * k;
          seg(ctx, x, y, x + lf.s * L, y - L * 0.6);
        }
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* BLOCKS — build it one block at a time.                              */
  /* ------------------------------------------------------------------ */
  const blocks = {
    id: 'blocks',
    label: 'Build',
    setup(g) {
      const N = 4;
      const cubes = [];
      for (let k = 0; k < N; k++) for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
        const j = s - i;
        if (j < 0 || j >= N) continue;
        if (N - Math.max(i, j) > k) cubes.push({ i, j, k });
      }
      const c30 = Math.cos(Math.PI / 6);
      const c = Math.min((g.bw * 1.6) / (2 * N * c30), (g.bh * 1.75) / (N + N));
      const ox = g.cx;
      const oy = g.cy; // spans oy - N·c (top) to oy + N·c (front corner)
      const P = (i, j, k) => [ox + (i - j) * c * c30, oy + (i + j) * c * 0.5 - k * c];
      cubes.forEach((q, n) => (q.n = n));
      const order = cubes.slice().sort((p, q) => p.i + p.j - (q.i + q.j) || p.k - q.k);
      return { cubes, order, P, step: 0.22 };
    },
    draw(g, st, t) {
      const { ctx } = g;
      const { P } = st;
      const face = (pts, dy) => {
        ctx.beginPath();
        pts.forEach(([i, j, k], n) => {
          const [x, y] = P(i, j, k);
          n ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      const last = Math.floor((t - 0.5) / st.step);
      for (const q of st.order) {
        const u = easeOut((t - 0.5 - q.n * st.step) / 0.4);
        if (u <= 0) continue;
        const dy = -(1 - u) * 30;
        const { i, j, k } = q;
        ctx.fillStyle = '#000';
        ctx.strokeStyle = W((q.n === last ? 1 : 0.75) * u);
        face([[i, j, k + 1], [i + 1, j, k + 1], [i + 1, j + 1, k + 1], [i, j + 1, k + 1]], dy);
        face([[i, j + 1, k], [i + 1, j + 1, k], [i + 1, j + 1, k + 1], [i, j + 1, k + 1]], dy);
        face([[i + 1, j, k], [i + 1, j + 1, k], [i + 1, j + 1, k + 1], [i + 1, j, k + 1]], dy);
      }
    },
  };

  const ART = window.FORGE_ART;
  ART.push(hourglass, drip, bricks, kintsugi, sisyphus, lighthouse, constellation, lanes, lever, signal, ripple, roots, blocks);

  // Which pieces fit which quote themes.
  const THEMES = {
    days: ['time', 'discipline'],
    compound: ['discipline', 'build', 'compare'],
    climb: ['discipline', 'fall', 'body'],
    focus: ['build', 'fear', 'become'],
    lissajous: ['seen', 'time'],
    stand: ['compare', 'fear', 'become'],
    fall: ['fall', 'fear'],
    pulse: ['seen', 'body', 'time'],
    deeper: ['seen', 'become'],
    path: ['compare', 'become', 'discipline'],
    choices: ['become', 'fear', 'compare'],
    hourglass: ['time'],
    drip: ['discipline', 'body', 'time'],
    bricks: ['build', 'discipline'],
    kintsugi: ['fall', 'seen'],
    sisyphus: ['fall', 'discipline', 'body'],
    lighthouse: ['seen', 'fear'],
    constellation: ['seen', 'become'],
    lanes: ['compare'],
    lever: ['build'],
    signal: ['build', 'become', 'seen'],
    ripple: ['fear', 'become'],
    roots: ['become', 'time', 'build'],
    blocks: ['build', 'discipline'],
  };
  for (const a of ART) a.k = THEMES[a.id] || [];
})();
