/* =====================================================================
   City drawing kit (all drawing happens in indexed rasters).
   Tiles: far (hazy distance), mid (skyline and landmarks), near
   (bridges and islands standing in the river).
   ===================================================================== */
const FAR_W = 1024, FAR_H = 150, MID_W = 1536, MID_H = 190, NEAR_W = 1280, NEAR_H = 104;
const MG = MID_H - 4;

/* ---- the layer stack ----
   A city is a stack of rasters, back to front. Every layer loops over the
   same stretch of river, ROUTE px of scroll, so its width fixes its parallax:
   p = W / ROUTE. A point r px along the route is drawn at x = p * r on a
   layer, and on screen at  VW/2 + p * (r - scroll): the stack is a true
   perspective view from a camera flying down the river. */
const ROUTE = 4096;
function mkLayer(name, W, H, o) {
  return Object.assign({ name, R: new Raster(W, H), W, H, p: W / ROUTE }, o || {});
} // street level in the mid tile; the quay wall sits below it

function winMats(M, glass) {
  return {
    off: M.add(glass),
    on: [
      M.add(glass, KW, '#ffd27a', 0.3),
      M.add(glass, KW, '#ffbd66', 0.24, true),
      M.add(glass, KW, '#fff0c8', 0.28),
      M.add(glass, KW, '#d2e5ff', 0.2, true),
    ],
  };
}
function winGrid(R, rng, x, y, w, h, W, o) {
  o = o || {};
  const cw = o.cw || 3, ch = o.ch || 3, ww = o.ww || 1, wh = o.wh || 1;
  const lit = o.lit === undefined ? 0.45 : o.lit;
  for (let yy = y; yy + wh <= y + h; yy += ch) {
    const rowLit = rng() < 0.72 ? Math.min(1, lit * 1.3) : lit * 0.25;
    for (let xx = x; xx + ww <= x + w; xx += cw) {
      if (o.skip && rng() < o.skip) continue;
      R.rect(xx, yy, ww, wh, rng() < rowLit ? W.on[(rng() * W.on.length) | 0] : W.off);
    }
  }
}
function envelope(Wd, base, peaks) {
  return x => {
    let v = base;
    for (const p of peaks) {
      const d = Math.abs(mod(x - p.x + Wd / 2, Wd) - Wd / 2);
      v = Math.max(v, base + (p.h - base) * Math.exp(-(d * d) / (2 * p.w * p.w)));
    }
    return v;
  };
}
function farFill(R, rng, mats, wins, o) {
  let x = 0;
  while (x < R.w) {
    const w = ri(rng, o.minW || 6, o.maxW || 15);
    const top = o.env(x + w / 2);
    const h = Math.max(4, Math.round(lerp(o.minH, top, 0.35 + 0.65 * rng())));
    const m = pick(rng, mats);
    R.rect(x, R.h - h, w, h, m);
    for (let yy = R.h - h + 2; yy < R.h - 2; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rng() < 0.17) R.px(xx, yy, pick(rng, wins));
    if (o.antenna && h > top * 0.75 && rng() < o.antenna) { const len = ri(rng, 4, 9); R.rect(x + (w >> 1), R.h - h - len, 1, len, m); }
    if (o.stepTop && rng() < o.stepTop && w > 7) { R.rect(x + 2, R.h - h - 3, w - 4, 3, m); }
    x += w + (rng() < 0.22 ? ri(rng, 1, 3) : 0);
  }
}
function quayMats(M, o) {
  o = o || {};
  return {
    wall: M.add(o.wall || '#8f8a83'), wallD: M.add(o.wallD || '#6c6761'), top: M.add(o.top || '#b9b2a8'),
    rail: M.add(o.rail || '#34343a'), post: M.add(o.post || '#2c2d33'),
    lamp: M.add(o.lamp || '#f1e2b6', KN, o.lampE || '#ffe08a', 0.75),
    leaf: [M.add(o.leaf0 || '#3b6237'), M.add(o.leaf1 || '#4e7b45'), M.add(o.leaf2 || '#6c9b57')],
    trunk: M.add(o.trunk || '#5b4636'),
  };
}
function tree(R, x, base, r, Q, leaf) {
  const L = leaf || Q.leaf;
  const th = Math.max(2, Math.round(r * 0.75));
  R.rect(x, base - th, 1, th, Q.trunk);
  const cy = base - th - r + 1.5;
  R.disc(x + 0.9, cy + 0.6, r, L[0]);
  R.disc(x + 0.3, cy, r - 0.5, L[1]);
  R.disc(x - r * 0.25, cy - r * 0.35, Math.max(1.2, r * 0.5), L[2]);
}
function lampPost(R, x, base, h, post, lamp) {
  R.rect(x, base - h, 1, h, post);
  R.rect(x - 1, base - h - 1, 3, 1, post);
  R.px(x - 1, base - h, lamp); R.px(x + 1, base - h, lamp);
}
function inRanges(x, ranges) { for (const r of ranges) if (x >= r[0] && x <= r[1]) return true; return false; }
function quayWall(R, Q) {
  const B = R.h, G = B - 4;
  R.rect(0, G, R.w, 4, Q.wall);
  R.rect(0, G, R.w, 1, Q.top);
  R.rect(0, B - 1, R.w, 1, Q.wallD);
  for (let x = 0; x < R.w; x += 5) R.px(x + (((x / 5) | 0) & 1 ? 2 : 0), G + 2, Q.wallD);
}
function promenade(R, rng, Q, o) {
  o = o || {};
  const G = R.h - 4, ex = o.exclude || [];
  if (o.rail) for (let x = 0; x < R.w; x++) if (!inRanges(x, ex)) { R.px(x, G - 2, Q.rail); if (x % 3 === 0) R.px(x, G - 1, Q.rail); }
  let x = 3;
  while (x < R.w) {
    if (!inRanges(x, ex) && rng() < (o.treeP === undefined ? 0.55 : o.treeP)) tree(R, x, G, ri(rng, o.rMin || 3, o.rMax || 4), Q, o.leaf);
    x += ri(rng, o.tMin || 9, o.tMax || 16);
  }
  for (let lx = 6; lx < R.w; lx += o.lampStep || 22) if (!inRanges(lx, ex)) lampPost(R, lx, G, o.lampH || 7, Q.post, Q.lamp);
}
/* Lattice towers (Eiffel, Tokyo Tower, Skytree): prof(yUp) gives the half
   width, an optional inner opening, and whether the row is solid. */
function lattice(R, cx, base, H, prof) {
  cx = Math.round(cx);
  let pL = null, pR = null, pIL = null, pIR = null;
  const pts = [];
  for (let yUp = 0; yUp < H; yUp++) {
    const p = prof(yUp);
    const y = base - 1 - yUp;
    if (!p) { pL = pR = pIL = pIR = null; continue; }
    const L = Math.round(cx - p.hw), Rr = Math.round(cx + p.hw);
    const iL = p.inner ? Math.round(cx - p.inner) : null, iR = p.inner ? Math.round(cx + p.inner) : null;
    for (let x = L; x <= Rr; x++) {
      if (p.inner && x > iL && x < iR) continue;
      if (p.solid || mod(x - cx + yUp, 3) === 0 || mod(x - cx - yUp, 3) === 0) { R.px(x, y, p.m); if (!p.solid) pts.push(x, y); }
    }
    const e = p.e || p.m;
    const edge = (a, b) => { if (b === null) R.px(a, y, e); else R.span(Math.min(a, b), Math.max(a, b) + 1, y, e); };
    edge(L, pL); edge(Rr, pR);
    if (p.inner) { edge(iL, pIL); edge(iR, pIR); }
    pL = L; pR = Rr; pIL = p.inner ? iL : null; pIR = p.inner ? iR : null;
  }
  return pts;
}
function cable(R, xa, ya, xb, yb, sag, m, o) {
  o = o || {};
  let px = null, py = null;
  const n = Math.max(1, Math.abs(xb - xa));
  const lights = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = Math.round(lerp(xa, xb, u));
    const y = Math.round(lerp(ya, yb, u) + 4 * sag * u * (1 - u));
    if (o.hang && i % o.hang === 0 && o.deckY - y > 2 && i > 1 && i < n - 1) R.rect(x, y + 1, 1, o.deckY - y - 1, o.hm);
    if (px !== null) R.line(px, py, x, y, m); else R.px(x, y, m);
    if (o.light && i % (o.ls || 3) === 1) lights.push(x, y);
    px = x; py = y;
  }
  for (let i = 0; i < lights.length; i += 2) R.px(lights[i], lights[i + 1], typeof o.light === 'function' ? o.light(lights[i]) : o.light);
}
function archBridge(R, o) {
  const B = R.h;
  R.rect(o.x0, o.deckY, o.x1 - o.x0, B - o.deckY, o.m);
  const span = (o.x1 - o.x0 - (o.n + 1) * o.pierW) / o.n;
  const arches = [];
  for (let i = 0; i < o.n; i++) {
    const ax = o.x0 + o.pierW + i * (span + o.pierW), cx = ax + span / 2;
    if (o.mD) R.ellipse(cx, o.spring, span / 2 + 1.6, o.rise + 1.6, o.mD);
    R.ellipse(cx, o.spring, span / 2, o.rise, 0);
    R.rect(ax, o.spring, span, B - o.spring, 0);
    arches.push({ ax, span, cx });
  }
  if (o.mTop) R.rect(o.x0 - 1, o.deckY - (o.parapetH || 2), o.x1 - o.x0 + 2, o.parapetH || 2, o.mTop);
  if (o.mTopL) R.rect(o.x0 - 1, o.deckY - (o.parapetH || 2), o.x1 - o.x0 + 2, 1, o.mTopL);
  return arches;
}
/* tiny 3x5 pixel font, used for painted signs */
const FONT3 = {
  P: ['###', '#.#', '###', '#..', '#..'], S: ['###', '#..', '###', '..#', '###'], F: ['###', '#..', '##.', '#..', '#..'],
};
function text3(R, x, y, s, m) { for (let i = 0; i < s.length; i++) R.stamp(x + i * 4, y, FONT3[s[i]], { '#': m }); }

/* The flying birds share one tiny sprite set across every city. */
const BIRD_ROWS = [
  ['k...k', '.k.k.', '..k..'],
  ['.....', 'kk.kk', '..k..'],
  ['.....', '.kkk.', 'k.k.k'],
];

/* ---- helpers for the layer stack ---- */
/* piecewise-linear curve through [x, y] knots */
function curve(k) {
  return x => {
    if (x <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (x <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
    return k[k.length - 1][1];
  };
}
/* a block centred on cx standing on `base`, shaded on its right flank; returns its top y */
function block(R, cx, w, h, m, mD, base) {
  const B = base == null ? R.h : base, x = Math.round(cx - w / 2);
  R.rect(x, B - h, w, h, m);
  if (mD) { const s = Math.max(1, Math.round(w * 0.22)); R.rect(x + w - s, B - h, s, h, mD); }
  return B - h;
}
/* a wooded mass: solid below, lumpy canopy on top. hFn(x) is its height in px. */
function woods(R, rng, x0, x1, base, hFn, L, o) {
  o = o || {};
  for (let x = x0; x < x1; x++) { const h = Math.round(hFn(x) * 0.72); if (h > 0) R.rect(x, base - h, 1, h, L[0]); }
  let x = x0;
  while (x < x1) {
    const h = hFn(x), r = rf(rng, o.rMin || 2, o.rMax || 4);
    if (h > 1.5) {
      const cy = base - h + r * 0.7 + rf(rng, 0, h * 0.2);
      R.disc(x, cy + 0.8, r, L[0]); R.disc(x - 0.4, cy, Math.max(1, r - 0.7), L[1]);
      if (rng() < 0.6) R.disc(x - r * 0.3, cy - r * 0.3, Math.max(0.9, r * 0.42), L[2]);
    }
    x += rf(rng, r * 0.7, r * 1.5);
  }
}
/* a pediment (low triangle) over a temple front */
function pediment(R, x, y, w, rise, m, mL) {
  R.poly([x - 0.5, y, x + w + 0.5, y, x + w / 2, y - rise], m);
  if (mL) { R.line(x, y - 1, x + w / 2, y - rise, mL); R.line(x + w - 1, y - 1, x + w / 2, y - rise, mL); }
}
/* a parabola of [z, height, lateral] points for a bridge's hanging cable */
function hangLine(z0, h0, z1, h1, sag, lat, n) {
  const pts = [];
  n = n || 10;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(z0, z1, t), lerp(h0, h1, t) - sag * 4 * t * (1 - t), lat]); }
  return pts;
}
