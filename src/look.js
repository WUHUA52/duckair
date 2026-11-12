/* =====================================================================
   Looks: time of day x weather. A "look" is a set of lighting values;
   baking turns indexed rasters into lit, colored canvases for a look.
   ===================================================================== */
const KS = 0, KG = 1, KW = 2, KN = 3, KF = 4; // solid, glass, window, neon/lamp, floodlit

class Mats {
  constructor() { this.list = [null]; }
  add(c, k, e, glow, late) {
    this.list.push({ c: hex(c), k: k || KS, e: e ? hex(e) : null, g: glow || 0, late: !!late });
    return this.list.length - 1;
  }
}

function emissiveF(m, E) {
  switch (m.k) {
    case KW: return m.late ? clamp((E - 0.62) / 0.38, 0, 1) : clamp(E / 0.56, 0, 1);
    case KN: return clamp(E / 0.45, 0, 1);
    case KF: return clamp((E - 0.3) / 0.55, 0, 1);
    default: return 0;
  }
}

const TOD_DEF = {
  morning: {
    sky: ['#4a6fb5', '#8fb3e0', '#f1c7b4', '#ffe3bd'], glow: '#ffe9b8', glowAmt: 0.5, glowR: 0.36,
    body: 'sun', bx: 0.2, by: -36, br: 11,
    light: [1.0, 0.92, 0.86], haze: [0.5, 0.2, 0.07], emissive: 0.2, stars: 0.04,
    cloud: ['#b3a4c8', '#f2c4b8', '#ffe4d2', '#fff7ec'],
    water: ['#b4c1dd', '#5b7bab'], waterHi: '#fff1d2', reflA: 0.48,
    plane: '#ffb48c', planeA: 0.07, rain: '#eadfe6', rainA: 0.5,
  },
  day: {
    sky: ['#3d8bd8', '#6cb1e9', '#a9d6f1', '#e4f2ec'], glow: '#fff3c9', glowAmt: 0.26, glowR: 0.2,
    body: 'sun', bx: 0.8, by: 0.2, br: 10,
    light: [1, 0.99, 0.96], haze: [0.5, 0.16, 0.05], emissive: 0, stars: 0,
    cloud: ['#b9cde4', '#e7eff8', '#ffffff', '#ffffff'],
    water: ['#79acd6', '#3c6fa4'], waterHi: '#f2fbff', reflA: 0.42,
    plane: '#000000', planeA: 0, rain: '#dbe8f6', rainA: 0.55,
  },
  sunset: {
    sky: ['#2c3170', '#7b4c8e', '#e57e86', '#ffc27a'], glow: '#ffd08a', glowAmt: 0.62, glowR: 0.42,
    body: 'sunset', bx: 0.72, by: -50, br: 15,
    light: [1.0, 0.79, 0.68], haze: [0.48, 0.2, 0.07], emissive: 0.5, stars: 0.18,
    cloud: ['#77588e', '#e7958f', '#ffcc9c', '#fff0c6'],
    water: ['#c98c8e', '#574a82'], waterHi: '#ffdca2', reflA: 0.5,
    plane: '#ff8a52', planeA: 0.15, rain: '#f6cbc2', rainA: 0.5,
  },
  night: {
    sky: ['#050920', '#0e1740', '#1a295c', '#2e4377'], glow: '#a9bdff', glowAmt: 0.2, glowR: 0.13,
    body: 'moon', bx: 0.22, by: 0.17, br: 9,
    light: [0.25, 0.29, 0.48], haze: [0.36, 0.11, 0.035], emissive: 1, stars: 1,
    cloud: ['#1c2550', '#323d6d', '#55639a', '#8492c4'],
    water: ['#1d2a56', '#0a1130'], waterHi: '#ffe7a8', reflA: 0.62,
    plane: '#1b2560', planeA: 0.4, rain: '#9fb2dc', rainA: 0.45,
  },
};
const WX_DEF = {
  clear: { grey: 0, dark: 0, clouds: 0.22, rain: 0, vis: 1, stars: 1, emit: 0, haze: 0, wisps: 0.15 },
  cloudy: { grey: 0.36, dark: 0.06, clouds: 0.72, rain: 0, vis: 0.45, stars: 0.3, emit: 0.06, haze: 0.1, wisps: 0.55 },
  rain: { grey: 0.6, dark: 0.17, clouds: 1, rain: 1, vis: 0.06, stars: 0.04, emit: 0.2, haze: 0.18, wisps: 1 },
};

function greyOut(c, grey, dark) {
  const l = luma(c);
  const g = [l * 0.97 + 4, l * 0.99 + 5, l * 1.02 + 9];
  const o = mixc(c, g, grey);
  return [o[0] * (1 - dark), o[1] * (1 - dark), o[2] * (1 - dark)];
}

function buildLook(todId, wxId) {
  const T = TOD_DEF[todId], W = WX_DEF[wxId];
  const sky = T.sky.map(c => greyOut(hex(c), W.grey, W.dark));
  const light = T.light.map((v, i) => v * (1 - W.dark * 0.85) * (i === 2 ? 1 + W.grey * 0.05 : 1));
  const plane = mixc(hex(T.plane), greyOut(hex('#566479'), 0, 0), todId === 'day' ? 1 : W.grey * 0.5);
  return {
    tod: todId, wx: wxId, key: todId + '/' + wxId,
    sky, skyLow: sky[2], hazeC: sky[3],
    glow: hex(T.glow), glowAmt: T.glowAmt * (1 - W.grey * 0.8), glowR: T.glowR,
    body: T.body, bx: T.bx, by: T.by, br: T.br, vis: W.vis,
    light, haze: T.haze.map(v => clamp(v + W.haze, 0, 0.92)),
    emissive: clamp(T.emissive + W.emit, 0, 1), stars: T.stars * W.stars,
    cloud: T.cloud.map(c => greyOut(hex(c), W.grey * 0.85, W.dark * 0.6)),
    water: T.water.map(c => greyOut(hex(c), W.grey * 0.7, W.dark)),
    waterHi: hex(T.waterHi), reflA: T.reflA * (1 - W.grey * 0.3),
    plane, planeA: T.planeA + W.dark * 0.55 + W.grey * 0.06,
    rain: hex(T.rain), rainA: T.rainA, rainAmt: W.rain, cloudAmt: W.clouds, wisps: W.wisps,
  };
}

/* ---------- material lookup tables ---------- */
function buildLUT(mats, look, haze) {
  const n = mats.list.length;
  const lut = new Uint8ClampedArray(n * 4);
  const glow = new Float32Array(n * 3);
  let anyGlow = false;
  const L = look.light, H = look.hazeC, S = look.skyLow;
  for (let i = 1; i < n; i++) {
    const m = mats.list[i];
    let r = m.c[0] * L[0], g = m.c[1] * L[1], b = m.c[2] * L[2];
    if (m.k === KG) { r = lerp(r, S[0], 0.3); g = lerp(g, S[1], 0.3); b = lerp(b, S[2], 0.3); }
    const ef = m.e ? emissiveF(m, look.emissive) : 0;
    const hz = haze * (1 - ef * 0.8);
    r = lerp(r, H[0], hz); g = lerp(g, H[1], hz); b = lerp(b, H[2], hz);
    if (ef > 0) {
      /* floodlit stone keeps its own light and shade: the lamp colour tints
         the stone instead of replacing it, so a lit facade still shows its
         columns, windows and shadowed flank */
      const T = m.k === KF ? [m.c[0] * m.e[0] / 235, m.c[1] * m.e[1] / 235, m.c[2] * m.e[2] / 235] : m.e;
      r = lerp(r, T[0], ef); g = lerp(g, T[1], ef); b = lerp(b, T[2], ef);
    }
    lut[i * 4] = r; lut[i * 4 + 1] = g; lut[i * 4 + 2] = b; lut[i * 4 + 3] = 255;
    if (ef > 0 && m.g > 0) {
      const gi = ef * m.g;
      glow[i * 3] = m.e[0] * gi; glow[i * 3 + 1] = m.e[1] * gi; glow[i * 3 + 2] = m.e[2] * gi;
      anyGlow = true;
    }
  }
  return { lut, glow, anyGlow };
}

const GLOW_SCRATCH = { n: 0, r: null, g: null, b: null, t: null };
function glowScratch(n) {
  if (GLOW_SCRATCH.n < n) {
    GLOW_SCRATCH.n = n;
    GLOW_SCRATCH.r = new Float32Array(n); GLOW_SCRATCH.g = new Float32Array(n);
    GLOW_SCRATCH.b = new Float32Array(n); GLOW_SCRATCH.t = new Float32Array(n);
  }
  return GLOW_SCRATCH;
}
function blurH(src, dst, w, h, r, wrap) {
  const inv = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let k = -r; k <= r; k++) {
      let xx = k;
      if (xx < 0) xx = wrap ? xx + w : 0; else if (xx >= w) xx = wrap ? xx - w : w - 1;
      acc += src[row + xx];
    }
    for (let x = 0; x < w; x++) {
      dst[row + x] = acc * inv;
      let a = x + r + 1, s = x - r;
      if (a >= w) a = wrap ? a - w : w - 1;
      if (s < 0) s = wrap ? s + w : 0;
      acc += src[row + a] - src[row + s];
    }
  }
}
function blurV(src, dst, w, h, r) {
  const inv = 1 / (2 * r + 1);
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[(k < 0 ? 0 : k >= h ? h - 1 : k) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc * inv;
      const a = y + r + 1, s = y - r;
      acc += src[(a >= h ? h - 1 : a) * w + x] - src[(s < 0 ? 0 : s) * w + x];
    }
  }
}

/* Bake an indexed raster into a canvas under a look.
   opts.flip: mirror vertically (reflections); opts.tint/tintA: water tint;
   opts.wrap: horizontal wrap for glow blur (tiles). */
function bakeRaster(R, mats, look, haze, canvas, opts) {
  opts = opts || {};
  const w = R.w, h = opts.h ? Math.min(opts.h, R.h) : R.h;
  sizeCanvas(canvas, w, h);
  const ctx = canvas.ctx;
  const img = ctx.createImageData(w, h);
  const out = img.data;
  const { lut, glow, anyGlow } = buildLUT(mats, look, haze);
  const d = R.d;
  const flip = !!opts.flip;
  for (let y = 0; y < h; y++) {
    const sy = flip ? R.h - 1 - y : y;
    let si = sy * w, di = y * w * 4;
    for (let x = 0; x < w; x++, si++, di += 4) {
      const m = d[si];
      if (m) { const li = m << 2; out[di] = lut[li]; out[di + 1] = lut[li + 1]; out[di + 2] = lut[li + 2]; out[di + 3] = 255; }
    }
  }
  if (anyGlow && !flip && opts.glow !== false) addGlow(R, glow, out, w, h, opts.wrap !== false, opts.glowScale || 1);
  if (opts.tint) {
    const T = opts.tint, a = opts.tintA, dk = opts.darken || 1;
    for (let i = 0; i < out.length; i += 4) {
      if (!out[i + 3]) continue;
      out[i] = lerp(out[i], T[0], a) * dk; out[i + 1] = lerp(out[i + 1], T[1], a) * dk; out[i + 2] = lerp(out[i + 2], T[2], a) * dk;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* Soft halos around lit windows, neon and floodlit landmarks. Computed at
   half resolution (the halo is blurry anyway), then dithered back in. */
function addGlow(R, glowLUT, out, w, h, wrap, scale) {
  const hw = (w + 1) >> 1, hh = (h + 1) >> 1, N2 = hw * hh;
  const S = glowScratch(N2);
  const gr = S.r, gg = S.g, gb = S.b, tmp = S.t;
  gr.fill(0, 0, N2); gg.fill(0, 0, N2); gb.fill(0, 0, N2);
  const d = R.d;
  let any = false;
  for (let y = 0; y < h; y++) {
    const row = y * w, hrow = (y >> 1) * hw;
    for (let x = 0; x < w; x++) {
      const m = d[row + x];
      if (!m) continue;
      const k = m * 3, r = glowLUT[k], g = glowLUT[k + 1], b = glowLUT[k + 2];
      if (r || g || b) {
        const j = hrow + (x >> 1);
        gr[j] += r * 0.25; gg[j] += g * 0.25; gb[j] += b * 0.25; any = true;
      }
    }
  }
  if (!any) return;
  for (const ch of [gr, gg, gb]) {
    blurH(ch, tmp, hw, hh, 1, wrap); blurV(tmp, ch, hw, hh, 1);
    blurH(ch, tmp, hw, hh, 1, wrap); blurV(tmp, ch, hw, hh, 1);
  }
  const sc = scale * 2.2;
  for (let y = 0; y < h; y++) {
    const hrow = (y >> 1) * hw, brow = (y & 3) * 4;
    for (let x = 0, di = y * w * 4; x < w; x++, di += 4) {
      const j = hrow + (x >> 1);
      const r = gr[j] * sc, g = gg[j] * sc, b = gb[j] * sc;
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      if (mx < 5) continue;
      if (out[di + 3]) {
        out[di] += r * 0.55; out[di + 1] += g * 0.55; out[di + 2] += b * 0.55;
      } else {
        const q = Math.floor((mx / 255) * 1.5 * 5 + BAYER[brow + (x & 3)]) / 5;
        if (q <= 0) continue;
        const k = 255 / mx;
        out[di] = r * k; out[di + 1] = g * k; out[di + 2] = b * k; out[di + 3] = (q > 0.65 ? 0.65 : q) * 255;
      }
    }
  }
}

/* ---------- sky ---------- */
function skyBodyPos(look, vw, horizon) {
  return { x: Math.round(look.bx * vw), y: Math.round(look.by >= 0 ? look.by * horizon : horizon + look.by) };
}
function bakeSky(look, canvas, vw, vh, horizon) {
  sizeCanvas(canvas, vw, vh);
  const ctx = canvas.ctx;
  const img = ctx.createImageData(vw, vh);
  const o = img.data;
  const [c0, c1, c2, c3] = look.sky;
  const P = skyBodyPos(look, vw, horizon);
  const gR = look.glowR * Math.max(vw, horizon);
  const inv2 = 1 / (2 * gR * gR);
  const G = look.glow, ga = look.glowAmt;
  const STEP = 6;
  for (let y = 0; y < vh; y++) {
    const t = clamp(y / horizon, 0, 1);
    let a, b, u;
    if (t < 0.45) { a = c0; b = c1; u = t / 0.45; }
    else if (t < 0.8) { a = c1; b = c2; u = (t - 0.45) / 0.35; }
    else { a = c2; b = c3; u = (t - 0.8) / 0.2; }
    u = u * u * (3 - 2 * u);
    const R0 = a[0] + (b[0] - a[0]) * u, G0 = a[1] + (b[1] - a[1]) * u, B0 = a[2] + (b[2] - a[2]) * u;
    const dy = (y - P.y) * 1.3, dy2 = dy * dy;
    for (let x = 0, i = y * vw * 4; x < vw; x++, i += 4) {
      let r = R0, g = G0, bb = B0;
      if (ga > 0) {
        const dx = x - P.x;
        const f = Math.exp(-(dx * dx + dy2) * inv2) * ga;
        r += (G[0] - r) * f; g += (G[1] - g) * f; bb += (G[2] - bb) * f;
      }
      const th = BAYER[(y & 3) * 4 + (x & 3)];
      o[i] = Math.floor(r / STEP + th) * STEP;
      o[i + 1] = Math.floor(g / STEP + th) * STEP;
      o[i + 2] = Math.floor(bb / STEP + th) * STEP;
      o[i + 3] = 255;
    }
  }
  drawSkyBody(o, vw, vh, look, P);
  ctx.putImageData(img, 0, 0);
}
function drawSkyBody(o, vw, vh, look, P) {
  const vis = look.vis;
  if (vis <= 0.01) return;
  const put = (x, y, c, a) => {
    if (x < 0 || y < 0 || x >= vw || y >= vh) return;
    const i = (y * vw + x) * 4, k = a * vis;
    o[i] += (c[0] - o[i]) * k; o[i + 1] += (c[1] - o[i + 1]) * k; o[i + 2] += (c[2] - o[i + 2]) * k;
  };
  const r = look.br;
  if (look.body === 'sun') {
    const core = hex('#fffbef'), edge = hex('#ffe9a6'), halo = hex('#fff4cf');
    for (let y = -r - 3; y <= r + 3; y++) for (let x = -r - 3; x <= r + 3; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d <= r - 2) put(P.x + x, P.y + y, core, 1);
      else if (d <= r) put(P.x + x, P.y + y, edge, 1);
      else if (d <= r + 2.6 && ((x + y) & 1) === 0) put(P.x + x, P.y + y, halo, 0.55);
    }
  } else if (look.body === 'sunset') {
    const top = hex('#fff3b4'), bot = hex('#ff8f4f'), halo = hex('#ffd59a');
    for (let y = -r - 3; y <= r + 3; y++) for (let x = -r - 3; x <= r + 3; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      const yy = P.y + y;
      if (d <= r) {
        const u = (y + r) / (2 * r);
        if (u > 0.5 && mod(y, 4) === 0 && u < 0.98) continue; // retro stripes
        put(P.x + x, yy, mixc(top, bot, u), 1);
      } else if (d <= r + 3 && ((x + y) & 1) === 0) put(P.x + x, yy, halo, 0.4);
    }
  } else {
    const face = hex('#f4efd6'), crater = hex('#d6cdb0'), halo = hex('#b9c7f2');
    for (let y = -r - 5; y <= r + 5; y++) for (let x = -r - 5; x <= r + 5; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d <= r) put(P.x + x, P.y + y, face, 1);
      else if (d <= r + 4.5 && ((x + y) & 1) === 0) put(P.x + x, P.y + y, halo, 0.32 * (1 - (d - r) / 4.5) + 0.1);
    }
    const cr = [[-3, -2, 2.2], [3, 2, 1.6], [-1, 4, 1.4], [4, -4, 1.1], [-5, 2, 1]];
    for (const [cx, cy, rr] of cr) for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
      if (Math.hypot(x, y) <= rr && Math.hypot(cx + x + 0.5, cy + y + 0.5) < r - 0.5) put(P.x + cx + x, P.y + cy + y, crater, 0.85);
    }
  }
}

/* ---------- water base ---------- */
function bakeWater(look, canvas, vw, wh) {
  sizeCanvas(canvas, vw, wh);
  const ctx = canvas.ctx;
  const img = ctx.createImageData(vw, wh);
  const o = img.data;
  const a = look.water[0], b = look.water[1], hz = look.hazeC;
  const STEP = 6;
  for (let y = 0; y < wh; y++) {
    const u = Math.pow(y / Math.max(1, wh - 1), 0.8);
    let c = mixc(a, b, u);
    if (y < 3) c = mixc(c, hz, (3 - y) * 0.12);
    for (let x = 0, i = y * vw * 4; x < vw; x++, i += 4) {
      const th = BAYER[(y & 3) * 4 + (x & 3)];
      o[i] = Math.floor(c[0] / STEP + th) * STEP;
      o[i + 1] = Math.floor(c[1] / STEP + th) * STEP;
      o[i + 2] = Math.floor(c[2] / STEP + th) * STEP;
      o[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/* ---------- clouds ---------- */
function makeCloudMask(w, h, rng, wisp) {
  const m = new Uint8Array(w * h);
  const disc = (cx, cy, rx, ry) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) m[y * w + x] = 1;
    }
  };
  const base = h - 2;
  if (wisp) {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const cx = lerp(w * 0.12, w * 0.88, u) + rf(rng, -3, 3);
      const ry = h * (0.22 + 0.2 * Math.sin(Math.PI * u)) * rf(rng, 0.8, 1.1);
      disc(cx, base - ry * 0.9, w * 0.16 * rf(rng, 0.8, 1.2), ry);
    }
  } else {
    const n = 3 + Math.floor(w / 13);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const cx = lerp(w * 0.13, w * 0.87, u) + rf(rng, -2, 2);
      const r = h * (0.26 + 0.42 * Math.pow(Math.sin(Math.PI * u), 0.8)) * rf(rng, 0.82, 1.15);
      disc(cx, base - r * 0.5, r * rf(rng, 1.0, 1.25), r);
    }
    for (let i = 0; i < 2; i++) {
      const cx = w * rf(rng, 0.3, 0.7), r = h * rf(rng, 0.28, 0.36);
      disc(cx, base - h * 0.55, r * 1.1, r);
    }
  }
  for (let y = base; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : m[y * w + x];
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y * w + x]) continue;
    let v = 2;
    if (!at(x, y - 1)) v = 4;
    else if (!at(x, y - 2) || !at(x - 1, y - 2)) v = 3;
    else if (!at(x, y - 3) && ((x + y) & 1)) v = 3;
    if (!at(x, y + 1) || !at(x, y + 2)) v = 1;
    else if (!at(x, y + 3) && ((x + y) & 1)) v = 1;
    out[y * w + x] = v;
  }
  return { w, h, d: out, wisp: !!wisp };
}
const CLOUD_MASKS = (() => {
  const rng = mulberry32(4242);
  const defs = [[28, 11], [34, 13], [40, 14], [46, 16], [56, 19], [64, 21], [76, 25], [90, 28], [108, 33], [50, 9, 1], [66, 10, 1], [42, 8, 1]];
  return defs.map(([w, h, wisp]) => makeCloudMask(w, h, rng, wisp));
})();
const CLOUD_BIG = [5, 6, 7, 8], CLOUD_MED = [2, 3, 4, 5], CLOUD_SMALL = [0, 1, 2, 3], CLOUD_WISP = [9, 10, 11];

function bakeClouds(look, list) {
  const cols = look.cloud;
  CLOUD_MASKS.forEach((mk, i) => {
    const c = list[i] || (list[i] = makeCanvas(mk.w, mk.h));
    sizeCanvas(c, mk.w, mk.h);
    const img = c.ctx.createImageData(mk.w, mk.h);
    const o = img.data;
    for (let p = 0; p < mk.d.length; p++) {
      const v = mk.d[p];
      if (!v) continue;
      const col = cols[v - 1];
      o[p * 4] = col[0]; o[p * 4 + 1] = col[1]; o[p * 4 + 2] = col[2]; o[p * 4 + 3] = 255;
    }
    c.ctx.putImageData(img, 0, 0);
  });
  return list;
}
