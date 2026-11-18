/*
 * Forge — generative line art for the new tab.
 *
 * White strokes on pure black. Each piece draws itself in, then stays quietly alive.
 * A piece is: { id, label, setup(g) -> state, draw(g, state, t, dt) }
 *   g  = { ctx, w, h, cx, cy, bw, bh, R }  (art box centre, half-width, half-height, min radius)
 *   t  = seconds since the piece started, dt = seconds since last frame
 */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOut = (t) => {
    t = clamp(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const W = (a = 1) => `rgba(255,255,255,${clamp(a)})`;
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

  function seg(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function dot(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function ring(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
  }

  function text(ctx, str, x, y, { align = 'left', alpha = 0.45, size = 11 } = {}) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.font = `500 ${size}px ${MONO}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.14em';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = W(alpha);
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 01 · DAYS — every day of this year. The filled ones are gone.       */
  /* ------------------------------------------------------------------ */
  const days = {
    id: 'days',
    label: 'Days',
    setup(g) {
      const now = new Date();
      const y = now.getFullYear();
      const today = Math.round(
        (new Date(y, now.getMonth(), now.getDate()) - new Date(y, 0, 1)) / 864e5
      );
      const cells = [];
      for (let m = 0; m < 12; m++) {
        const n = new Date(y, m + 1, 0).getDate();
        for (let d = 0; d < n; d++) cells.push([m, d]);
      }
      const s = Math.min((g.bw * 2) / 33, (g.bh * 1.35) / 11, 24);
      return { y, today, cells, s, x0: g.cx - s * 15, y0: g.cy - s * 6 };
    },
    draw(g, st, t) {
      const { ctx } = g;
      const { s, x0, y0, cells, today } = st;
      const r = Math.max(1.4, s * 0.14);
      const fill = 1.8;
      const shown = easeOut(t / 0.6);

      for (let i = 0; i < cells.length; i++) {
        if (i === today) continue;
        const x = x0 + cells[i][1] * s;
        const y = y0 + cells[i][0] * s;
        if (i < today) {
          const k = clamp((t - 0.3 - (i / Math.max(1, today)) * fill) / 0.2);
          ctx.fillStyle = W(lerp(0.14 * shown, 1, k));
        } else {
          ctx.fillStyle = W(0.14 * shown);
        }
        dot(ctx, x, y, r);
      }

      const tx = x0 + cells[today][1] * s;
      const ty = y0 + cells[today][0] * s;
      const tt = t - 0.3 - fill;
      if (tt > 0) {
        ctx.fillStyle = W(1);
        dot(ctx, tx, ty, r * 1.6);
        const ph = (tt % 2.4) / 2.4;
        ctx.strokeStyle = W((1 - ph) * 0.7);
        ctx.lineWidth = 1;
        ring(ctx, tx, ty, r * 1.6 + ph * s * 0.9);
      } else {
        ctx.fillStyle = W(0.14 * shown);
        dot(ctx, tx, ty, r);
      }

      'JFMAMJJASOND'.split('').forEach((c, m) =>
        text(ctx, c, x0 - s * 1.5, y0 + m * s, { align: 'center', alpha: 0.26 * shown, size: 10 })
      );
      const la = 0.5 * easeOut((tt - 0.2) / 0.8);
      const by = y0 + 11 * s + s * 1.7;
      text(ctx, `DAY ${today + 1} / ${cells.length}`, x0, by, { alpha: la });
      text(ctx, `${cells.length - today - 1} LEFT IN ${st.y}`, x0 + 30 * s, by, { align: 'right', alpha: la });
    },
  };

  /* ------------------------------------------------------------------ */
  /* 02 · 1% — 1.01^365 vs 0.99^365. Same start. Different man.          */
  /* ------------------------------------------------------------------ */
  const compound = {
    id: 'compound',
    label: 'One percent',
    setup() {
      return {};
    },
    draw(g, st, t) {
      const { ctx, cx, cy, bw, bh } = g;
      const x0 = cx - bw;
      const x1 = cx + bw;
      const y0 = cy + bh * 0.14;
      const up = bh * 0.95;
      const down = bh * 0.55;
      const UP = Math.pow(1.01, 365) - 1;
      const DN = 1 - Math.pow(0.99, 365);
      const X = (d) => x0 + (d / 365) * (x1 - x0);
      const Yu = (d) => y0 - ((Math.pow(1.01, d) - 1) / UP) * up;
      const Yd = (d) => y0 + ((1 - Math.pow(0.99, d)) / DN) * down;

      ctx.strokeStyle = W(0.22);
      ctx.lineWidth = 1;
      seg(ctx, x0, y0, lerp(x0, x1, easeOut(t / 0.9)), y0);

      const p = clamp((t - 0.7) / 4.2);
      const end = p * 365;
      const curve = (Y, color, lw) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(X(0), Y(0));
        for (let d = 1; d < end; d++) ctx.lineTo(X(d), Y(d));
        ctx.lineTo(X(end), Y(end));
        ctx.stroke();
      };
      if (p > 0) {
        curve(Yd, W(0.42), 1.5);
        curve(Yu, W(1), 2);
        ctx.fillStyle = W(0.6);
        dot(ctx, X(end), Yd(end), 3);
        ctx.fillStyle = W(1);
        dot(ctx, X(end), Yu(end), 4);
      }

      const la = easeOut((t - 5) / 1);
      text(ctx, 'DAY 1', x0, y0 - 16, { alpha: 0.35 * easeOut((t - 0.6) / 0.8) });
      text(ctx, '365', x1, y0 + 16, { align: 'right', alpha: 0.35 * la });
      text(ctx, '1.01³⁶⁵ = 37.8', x1 - 14, Yu(365) + 2, { align: 'right', alpha: 0.85 * la, size: 12 });
      text(ctx, '0.99³⁶⁵ = 0.03', x1, Yd(365) + 22, { align: 'right', alpha: 0.5 * la, size: 12 });
    },
  };

  /* ------------------------------------------------------------------ */
  /* 03 · CLIMB — an endless staircase. Uneven steps. Keep going.        */
  /* ------------------------------------------------------------------ */
  const climb = {
    id: 'climb',
    label: 'Climb',
    setup(g) {
      const st = { a: g.R * 0.34, b: g.R * 0.2, steps: [{ x: 0, y: 0, w: g.R * 0.34, h: g.R * 0.2 }], cam: null };
      return st;
    },
    ensure(st, n) {
      while (st.steps.length <= n) {
        const p = st.steps[st.steps.length - 1];
        st.steps.push({ x: p.x + p.w, y: p.y - p.h, w: st.a * rand(0.7, 1.35), h: st.b * rand(0.55, 1.55) });
      }
    },
    draw(g, st, t, dt) {
      const { ctx, cx, cy, bw, bh } = g;
      const T = 1.05;
      const r = 5;
      const tt = Math.max(0, t - 0.6);
      const k = 10 + Math.floor(tt / T);
      const f = (tt % T) / T;
      climb.ensure(st, k + 12);

      const restAt = (i) => {
        const s = st.steps[i];
        return [s.x + s.w * 0.5, s.y - r];
      };
      let [px, py] = restAt(k);
      if (f > 0.45) {
        const u = easeInOut((f - 0.45) / 0.55);
        const [nx, ny] = restAt(k + 1);
        px = lerp(px, nx, u);
        py = lerp(py, ny, u) - Math.sin(Math.PI * u) * st.b * 0.9;
      }

      if (!st.cam) st.cam = { x: px, y: py };
      const kk = 1 - Math.exp(-(dt || 0.016) * 2.6);
      st.cam.x += (px - st.cam.x) * kk;
      st.cam.y += (py - st.cam.y) * kk;
      const ox = cx - st.cam.x;
      const oy = cy - st.cam.y;
      const appear = easeOut(t / 0.9);

      const fade = (x, y) => clamp(1.15 - Math.hypot((x - cx) / bw, (y - cy) / bh)) * appear;
      ctx.lineWidth = 2;
      for (let i = Math.max(0, k - 12); i < k + 12; i++) {
        const s = st.steps[i];
        const ax = s.x + ox, ay = s.y + oy;
        const bx = ax + s.w;
        const a1 = fade((ax + bx) / 2, ay);
        if (a1 > 0.01) {
          ctx.strokeStyle = W(a1);
          seg(ctx, ax, ay, bx, ay);
        }
        const a2 = fade(bx, ay - s.h / 2);
        if (a2 > 0.01) {
          ctx.strokeStyle = W(a2);
          seg(ctx, bx, ay, bx, ay - s.h);
        }
      }
      ctx.fillStyle = W(appear);
      dot(ctx, px + ox, py + oy, r);
    },
  };

  /* ------------------------------------------------------------------ */
  /* 04 · FOCUS — everything points at one thing.                       */
  /* ------------------------------------------------------------------ */
  const focus = {
    id: 'focus',
    label: 'Focus',
    setup(g) {
      const N = 72;
      const P = 4 * (g.bw + g.bh);
      const pts = [];
      for (let i = 0; i < N; i++) {
        let s = ((i + 0.5) / N) * P;
        let x, y;
        if (s < 2 * g.bw) { x = -g.bw + s; y = -g.bh; }
        else if ((s -= 2 * g.bw) < 2 * g.bh) { x = g.bw; y = -g.bh + s; }
        else if ((s -= 2 * g.bh) < 2 * g.bw) { x = g.bw - s; y = g.bh; }
        else { s -= 2 * g.bw; x = -g.bw; y = g.bh - s; }
        pts.push({ x, y, d: rand(0, 0.9) });
      }
      return { pts, ph: rand(0, TAU) };
    },
    draw(g, st, t) {
      const { ctx, cx, cy, bw, bh, R } = g;
      const fx = cx + bw * 0.2 * Math.sin(t * 0.19 + st.ph);
      const fy = cy + bh * 0.22 * Math.sin(t * 0.15 + st.ph * 1.7);
      const gap = R * 0.09;
      ctx.strokeStyle = W(0.34);
      ctx.lineWidth = 1;
      for (const p of st.pts) {
        const k = easeOut((t - 0.2 - p.d) / 1.3);
        if (k <= 0) continue;
        const x = cx + p.x;
        const y = cy + p.y;
        const dx = fx - x;
        const dy = fy - y;
        const len = Math.hypot(dx, dy);
        const reach = ((len - gap) / len) * k;
        seg(ctx, x, y, x + dx * reach, y + dy * reach);
      }
      const a = easeOut((t - 1.4) / 0.6);
      ctx.fillStyle = W(a);
      dot(ctx, fx, fy, 4 + Math.sin(t * 2.2) * 0.7);
    },
  };

  /* ------------------------------------------------------------------ */
  /* 05 · ORBIT — one line that never ends, never repeats the same day.  */
  /* ------------------------------------------------------------------ */
  const lissajous = {
    id: 'lissajous',
    label: 'Rhythm',
    setup() {
      const pairs = [[3, 2], [3, 4], [5, 4], [5, 6], [2, 3], [4, 5]];
      const [a, b] = pairs[randInt(0, pairs.length - 1)];
      return { a, b, ph: rand(0, TAU) };
    },
    draw(g, st, t) {
      const { ctx, cx, cy, R, bw } = g;
      const A = Math.min(bw, R * 1.15);
      const B = R * 0.92;
      const delta = st.ph + t * 0.1;
      const pt = (s) => [cx + A * Math.sin(st.a * s + delta), cy + B * Math.sin(st.b * s)];
      const N = 1400;
      const p = easeInOut((t - 0.2) / 3);
      const n = Math.floor(N * p);
      if (n > 1) {
        ctx.strokeStyle = W(0.3);
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const [x, y] = pt((i / N) * TAU);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // a bright comet riding the curve
      const c = easeOut((t - 2.6) / 1);
      if (c > 0) {
        const head = (t - 2.6) * 0.35;
        const L = 0.7;
        const K = 40;
        ctx.lineWidth = 2.2;
        for (let i = 0; i < K; i++) {
          const s0 = head - L + (L * i) / K;
          const s1 = head - L + (L * (i + 1)) / K;
          const [x0, y0] = pt(s0);
          const [x1, y1] = pt(s1);
          ctx.strokeStyle = W(c * Math.pow((i + 1) / K, 1.6));
          seg(ctx, x0, y0, x1, y1);
        }
        const [hx, hy] = pt(head);
        ctx.fillStyle = W(c);
        dot(ctx, hx, hy, 3.2);
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* 06 · STAND — the field bends with the wind. One doesn't.            */
  /* ------------------------------------------------------------------ */
  const stand = {
    id: 'stand',
    label: 'Stand',
    setup(g) {
      const cols = 19;
      const rows = 9;
      const s = Math.min((g.bw * 2) / (cols - 1), (g.bh * 1.7) / (rows - 1));
      const cells = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ c, r, d: rand(0, 0.12) });
      const odd = { c: randInt(4, cols - 5), r: randInt(2, rows - 3) };
      return { cols, rows, s, cells, odd, x0: g.cx - (s * (cols - 1)) / 2, y0: g.cy - (s * (rows - 1)) / 2 };
    },
    draw(g, st, t) {
      const { ctx } = g;
      const { s, x0, y0, odd } = st;
      const L = s * 0.56;
      const wind = clamp((t - 1) / 2);
      ctx.lineCap = 'round';
      for (const cell of st.cells) {
        const k = easeOut((t - 0.1 - cell.c * 0.045 - cell.d) / 0.5);
        if (k <= 0) continue;
        const x = x0 + cell.c * s;
        const y = y0 + cell.r * s;
        const isOdd = cell.c === odd.c && cell.r === odd.r;
        let ang;
        let alpha = 0.36;
        let lw = 1.5;
        let len = L;
        if (isOdd) {
          const u = easeInOut((t - 1.8) / 1.1);
          ang = lerp(0, -Math.PI / 2, u);
          alpha = lerp(0.36, 1, u);
          lw = lerp(1.5, 2.4, u);
          len = lerp(L, L * 1.2, u);
        } else {
          ang = wind * 0.42 * Math.sin(t * 1.1 - cell.c * 0.48 - cell.r * 0.21);
        }
        const hx = (Math.cos(ang) * len * k) / 2;
        const hy = (Math.sin(ang) * len * k) / 2;
        ctx.strokeStyle = W(alpha);
        ctx.lineWidth = lw;
        seg(ctx, x - hx, y - hy, x + hx, y + hy);
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* 07 · FALL 7 — seven falls. Stand up eight.                          */
  /* ------------------------------------------------------------------ */
  const fall = {
    id: 'fall',
    label: 'Seven, eight',
    setup(g) {
      const r = 5;
      const ground = g.cy + g.bh * 0.62;
      const gy = ground - r;
      const xs = g.cx - g.bw * 0.86;
      const xe = g.cx + g.bw * 0.5;
      const ys = g.cy - g.bh * 0.82;
      const H = gy - ys;
      const tFall = 0.85;
      const G = (2 * H) / (tFall * tFall);
      const v = Math.sqrt(2 * G * H);
      const e = 0.7;
      const hits = [tFall];
      for (let k = 1; k <= 6; k++) hits.push(hits[k - 1] + (2 * Math.pow(e, k) * v) / G);
      const air = hits[6];
      const vx = (xe - xs) / air;
      const xr = xe + g.bw * 0.22; // after the 7th fall it rolls a little, then stands
      return { r, ground, gy, xs, xe, xr, ys, G, v, e, hits, air, vx };
    },
    pos(st, tau) {
      if (tau >= st.air) return [st.xe, st.gy];
      const x = st.xs + st.vx * tau;
      if (tau < st.hits[0]) return [x, st.ys + 0.5 * st.G * tau * tau];
      let k = 0;
      while (k < 6 && tau >= st.hits[k + 1]) k++;
      const dt = tau - st.hits[k];
      const vy = -Math.pow(st.e, k + 1) * st.v;
      return [x, st.gy + vy * dt + 0.5 * st.G * dt * dt];
    },
    draw(g, st, t) {
      const { ctx, cx, bw } = g;
      const cycle = st.air + 0.6 + 1.5 + 2.2 + 0.9;
      const tau = t % cycle;
      const fadeOut = 1 - clamp((tau - (cycle - 0.9)) / 0.9);
      const appear = easeOut(t / 0.8);

      ctx.strokeStyle = W(0.24 * appear);
      ctx.lineWidth = 1;
      seg(ctx, cx - bw, st.ground, cx + bw, st.ground);

      // trail
      const end = Math.min(tau, st.air);
      ctx.strokeStyle = W(0.3 * fadeOut);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let s = 0; s <= end; s += 1 / 120) {
        const [x, y] = fall.pos(st, s);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const [ex, ey] = fall.pos(st, end);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // impact count
      st.hits.forEach((h, i) => {
        if (tau >= h) {
          const [hx] = fall.pos(st, h);
          text(ctx, String(i + 1), hx, st.ground + 18, { align: 'center', alpha: 0.42 * fadeOut, size: 10 });
        }
      });

      // roll a little, then stand up
      let [x, y] = fall.pos(st, tau);
      const roll = easeOut((tau - st.air) / 0.6);
      if (tau > st.air) {
        x = lerp(st.xe, st.xr, roll);
        ctx.strokeStyle = W(0.3 * fadeOut);
        ctx.lineWidth = 1.25;
        seg(ctx, st.xe, st.gy, x, st.gy);
      }
      const rise = easeInOut((tau - st.air - 0.6) / 1.5);
      if (rise > 0) {
        y = lerp(st.gy, st.ys, rise);
        ctx.strokeStyle = W(fadeOut);
        ctx.lineWidth = 2;
        seg(ctx, st.xr, st.ground, st.xr, y);
        text(ctx, '8', st.xr, st.ground + 18, { align: 'center', alpha: fadeOut * rise, size: 10 });
      }
      ctx.fillStyle = W(fadeOut);
      dot(ctx, x, y, st.r);
    },
  };

  /* ------------------------------------------------------------------ */
  /* 08 · PULSE — still here. Still in it.                               */
  /* ------------------------------------------------------------------ */
  const bump = (u, c, w, a) => {
    const x = (u - c) / w;
    return Math.abs(x) < 1 ? a * 0.5 * (1 + Math.cos(Math.PI * x)) : 0;
  };
  const ecg = (u) =>
    bump(u, 0.14, 0.05, 0.1) -
    bump(u, 0.245, 0.014, 0.12) +
    bump(u, 0.272, 0.02, 1) -
    bump(u, 0.302, 0.02, 0.3) +
    bump(u, 0.5, 0.075, 0.2);

  const pulse = {
    id: 'pulse',
    label: 'Pulse',
    setup() {
      return { P: 60 / 57 };
    },
    draw(g, st, t) {
      const { ctx, cx, cy, bw, bh } = g;
      const x0 = cx - bw;
      const Wd = bw * 2;
      const speed = Wd / 3.6;
      const sweep = Wd / speed;
      const head = (t * speed) % Wd;
      const gapPx = 36;
      const amp = bh * 0.72;
      const yAt = (age) => {
        const tau = t - age;
        const u = (((tau % st.P) + st.P) % st.P) / st.P;
        return cy - ecg(u) * amp;
      };
      ctx.lineWidth = 2;
      const step = 2;
      let prev = null;
      for (let d = 0; d <= Wd - gapPx; d += step) {
        const age = d / speed;
        if (age > t) break;
        const x = x0 + ((head - d + Wd) % Wd);
        const y = yAt(age);
        if (prev && prev.x > x) {
          ctx.strokeStyle = W(1 - (age / sweep) * 0.85);
          seg(ctx, prev.x, prev.y, x, y);
        }
        prev = { x, y };
      }
      ctx.fillStyle = W(1);
      dot(ctx, x0 + head, yAt(0), 3);
      text(ctx, '57 BPM', cx + bw, cy - bh * 0.92, { align: 'right', alpha: 0.38 * easeOut((t - 0.8) / 1) });
    },
  };

  /* ------------------------------------------------------------------ */
  /* 09 · DEEPER — an endless way in.                                    */
  /* ------------------------------------------------------------------ */
  const deeper = {
    id: 'deeper',
    label: 'Deeper',
    setup() {
      return { dir: Math.random() < 0.5 ? 1 : -1 };
    },
    draw(g, st, t) {
      const { ctx, cx, cy, R } = g;
      const N = 18;
      const min = R * 0.025;
      const max = R * 1.02;
      const appear = easeOut(t / 1.4);
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'miter';
      for (let i = 0; i < N; i++) {
        const z = (t * 0.06 + i / N) % 1;
        const size = min * Math.pow(max / min, z);
        const a = clamp(z / 0.25) * clamp((1 - z) / 0.4) * appear;
        if (a <= 0.01) continue;
        const rot = st.dir * (z * 1.4 + Math.sin(t * 0.25) * 0.15);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = W(a * 0.9);
        ctx.strokeRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      }
      ctx.fillStyle = W(appear);
      dot(ctx, cx, cy, 2.5);
    },
  };

  /* ------------------------------------------------------------------ */
  /* 10 · PATH — it was never going to be a straight line.               */
  /* ------------------------------------------------------------------ */
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const path = {
    id: 'path',
    label: 'Path',
    setup(g) {
      const s = Math.max(14, g.R * 0.1);
      const nx = Math.floor((g.bw * 2) / s);
      const ny = Math.floor((g.bh * 2) / s);
      const st = {
        s, nx, ny,
        x0: g.cx - (nx * s) / 2,
        y0: g.cy - (ny * s) / 2,
        pts: [{ i: nx >> 1, j: ny >> 1 }],
        base: 0,
        dir: randInt(0, 3),
        seen: new Map(),
        TAIL: 150,
      };
      st.seen.set(`${nx >> 1},${ny >> 1}`, 0);
      return st;
    },
    advance(st) {
      const last = st.pts[st.pts.length - 1];
      const idx = st.base + st.pts.length;
      const free = (d) => {
        const i = last.i + DIRS[d][0];
        const j = last.j + DIRS[d][1];
        if (i < 0 || j < 0 || i > st.nx || j > st.ny) return null;
        const seen = st.seen.get(`${i},${j}`);
        return { i, j, fresh: seen === undefined || idx - seen > st.TAIL };
      };
      const straight = st.dir;
      const turns = Math.random() < 0.5 ? [(st.dir + 1) % 4, (st.dir + 3) % 4] : [(st.dir + 3) % 4, (st.dir + 1) % 4];
      const order = Math.random() < 0.72 ? [straight, ...turns] : [...turns, straight];
      let pick = null;
      for (const d of order) {
        const c = free(d);
        if (c && c.fresh) { pick = { d, c }; break; }
      }
      if (!pick) for (const d of [...order, (st.dir + 2) % 4]) {
        const c = free(d);
        if (c) { pick = { d, c }; break; }
      }
      st.dir = pick.d;
      st.pts.push({ i: pick.c.i, j: pick.c.j });
      st.seen.set(`${pick.c.i},${pick.c.j}`, idx);
      if (st.pts.length > st.TAIL + 4) {
        st.pts.shift();
        st.base++;
      }
    },
    draw(g, st, t) {
      const { ctx } = g;
      const { s, x0, y0 } = st;
      const STEP = 0.085;
      const appear = easeOut(t / 0.8);

      ctx.fillStyle = W(0.12 * appear);
      for (let i = 0; i <= st.nx; i++) for (let j = 0; j <= st.ny; j++) ctx.fillRect(x0 + i * s - 0.75, y0 + j * s - 0.75, 1.5, 1.5);

      const steps = Math.max(0, Math.floor((t - 0.4) / STEP));
      while (st.base + st.pts.length - 1 < steps + 1) path.advance(st);
      const f = t < 0.4 ? 0 : ((t - 0.4) / STEP) % 1;

      const headIdx = steps - st.base;
      const P = (k) => [x0 + st.pts[k].i * s, y0 + st.pts[k].j * s];
      ctx.lineWidth = 2;
      const start = Math.max(0, headIdx - st.TAIL);
      for (let k = start; k < headIdx; k++) {
        const [ax, ay] = P(k);
        const [bx, by] = P(k + 1);
        const a = 0.04 + 0.96 * Math.pow((k - start + 1) / Math.max(1, headIdx - start), 1.7);
        ctx.strokeStyle = W(a);
        seg(ctx, ax, ay, bx, by);
      }
      const [hx0, hy0] = P(headIdx);
      const [hx1, hy1] = P(headIdx + 1);
      const hx = lerp(hx0, hx1, f);
      const hy = lerp(hy0, hy1, f);
      ctx.strokeStyle = W(1);
      seg(ctx, hx0, hy0, hx, hy);
      ctx.fillStyle = W(appear);
      dot(ctx, hx, hy, 3.6);
    },
  };

  /* ------------------------------------------------------------------ */
  /* 11 · CHOICES — every fork. One path is yours.                       */
  /* ------------------------------------------------------------------ */
  const choices = {
    id: 'choices',
    label: 'Choices',
    setup(g) {
      const D = 7;
      const segs = [];
      const grow = (x, y, ang, len, depth, spread, chosen) => {
        const ex = x + Math.cos(ang) * len;
        const ey = y + Math.sin(ang) * len;
        segs.push({ x, y, ex, ey, depth, chosen });
        if (depth === D - 1) return;
        const pick = Math.random() < 0.5 ? 0 : 1;
        [-1, 1].forEach((side, i) => {
          grow(
            ex, ey,
            ang + side * spread + rand(-0.07, 0.07),
            len * rand(0.72, 0.84),
            depth + 1,
            spread * 0.86,
            chosen && i === pick
          );
        });
      };
      grow(0, 0, -Math.PI / 2, 1, 0, 0.58, true);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const s of segs) {
        minX = Math.min(minX, s.x, s.ex); maxX = Math.max(maxX, s.x, s.ex);
        minY = Math.min(minY, s.y, s.ey); maxY = Math.max(maxY, s.y, s.ey);
      }
      const k = Math.min((g.bw * 1.9) / (maxX - minX), (g.bh * 1.9) / (maxY - minY));
      const ox = g.cx - ((minX + maxX) / 2) * k;
      const oy = g.cy - ((minY + maxY) / 2) * k;
      for (const s of segs) {
        s.x = s.x * k + ox; s.y = s.y * k + oy; s.ex = s.ex * k + ox; s.ey = s.ey * k + oy;
      }
      segs.sort((a, b) => a.chosen - b.chosen);
      const leaf = segs[segs.length - 1];
      return { segs, leaf, D };
    },
    draw(g, st, t) {
      const { ctx } = g;
      const LEVEL = 0.38;
      for (const s of st.segs) {
        const p = easeOut((t - 0.3 - s.depth * LEVEL) / 0.5);
        if (p <= 0) continue;
        ctx.strokeStyle = s.chosen ? W(1) : W(0.24);
        ctx.lineWidth = s.chosen ? 2.2 : 1;
        seg(ctx, s.x, s.y, lerp(s.x, s.ex, p), lerp(s.y, s.ey, p));
      }
      const root = st.segs.find((s) => s.depth === 0);
      ctx.fillStyle = W(easeOut(t / 0.4));
      dot(ctx, root.x, root.y, 3);
      const done = t - 0.3 - st.D * LEVEL - 0.2;
      if (done > 0) {
        const { ex, ey } = st.leaf;
        ctx.fillStyle = W(easeOut(done / 0.4));
        dot(ctx, ex, ey, 4);
        const ph = (done % 2.6) / 2.6;
        ctx.strokeStyle = W((1 - ph) * 0.6);
        ctx.lineWidth = 1;
        ring(ctx, ex, ey, 4 + ph * 18);
      }
    },
  };

  window.FORGE_ART = [days, compound, climb, focus, lissajous, stand, fall, pulse, deeper, path, choices];
})();
