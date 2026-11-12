'use strict';
/* =====================================================================
   DuckAir — core helpers: math, color, seeded random, pixel rasters
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const approach = (cur, target, rate, dt) => target + (cur - target) * Math.exp(-rate * dt);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const rf = (rng, a, b) => a + rng() * (b - a);
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); }
function vnoise(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = hash1(i), b = hash1(i + 1);
  return (a + (b - a) * u) * 2 - 1;
}

const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const luma = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
function css(c, a) {
  const r = clamp(c[0], 0, 255) | 0, g = clamp(c[1], 0, 255) | 0, b = clamp(c[2], 0, 255) | 0;
  if (a === undefined || a >= 1) return 'rgb(' + r + ',' + g + ',' + b + ')';
  return 'rgba(' + r + ',' + g + ',' + b + ',' + (a < 0 ? 0 : a).toFixed(3) + ')';
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

function makeCanvas(w, h, willRead) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  c.ctx = c.getContext('2d', willRead ? { willReadFrequently: true } : undefined);
  c.ctx.imageSmoothingEnabled = false;
  return c;
}
function sizeCanvas(c, w, h) {
  w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  c.ctx.imageSmoothingEnabled = false;
}

/* ---------------------------------------------------------------------
   Raster: an indexed pixel buffer (one material index per pixel).
   Horizontal coordinates wrap, so anything drawn across the right edge
   continues on the left: every scenery tile loops without a seam.
   --------------------------------------------------------------------- */
class Raster {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  px(x, y, m) {
    x = Math.round(x); y = Math.round(y);
    if (y < 0 || y >= this.h) return;
    x %= this.w; if (x < 0) x += this.w;
    this.d[y * this.w + x] = m;
  }
  get(x, y) {
    x = Math.round(x); y = Math.round(y);
    if (y < 0 || y >= this.h) return 0;
    x %= this.w; if (x < 0) x += this.w;
    return this.d[y * this.w + x];
  }
  span(x0, x1, y, m) {
    if (y < 0 || y >= this.h || x1 <= x0) return;
    const W = this.w, row = y * W;
    let n = x1 - x0; if (n > W) n = W;
    let x = x0 % W; if (x < 0) x += W;
    const d = this.d;
    for (let i = 0; i < n; i++) { d[row + x] = m; if (++x === W) x = 0; }
  }
  rect(x, y, w, h, m) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const y0 = Math.max(0, y), y1 = Math.min(this.h, y + h);
    for (let yy = y0; yy < y1; yy++) this.span(x, x + w, yy, m);
  }
  ellipse(cx, cy, rx, ry, m) {
    const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      const dy = (y + 0.5 - cy) / ry;
      if (dy <= -1 || dy >= 1) continue;
      const hw = rx * Math.sqrt(1 - dy * dy);
      this.span(Math.round(cx - hw), Math.round(cx + hw), y, m);
    }
  }
  disc(cx, cy, r, m) { this.ellipse(cx, cy, r, r, m); }
  ring(cx, cy, r, t, m) {
    const y0 = Math.floor(cy - r - 1), y1 = Math.ceil(cy + r + 1);
    const x0 = Math.floor(cx - r - 1), x1 = Math.ceil(cx + r + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r && d > r - t) this.px(x, y, m);
    }
  }
  poly(pts, m) {
    const n = pts.length >> 1;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) { const y = pts[2 * i + 1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const xs = [];
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const sy = y + 0.5; xs.length = 0;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const yi = pts[2 * i + 1], yj = pts[2 * j + 1];
        if ((yi > sy) !== (yj > sy)) { const xi = pts[2 * i], xj = pts[2 * j]; xs.push(xi + (sy - yi) * (xj - xi) / (yj - yi)); }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) this.span(Math.round(xs[k]), Math.round(xs[k + 1]), y, m);
    }
  }
  line(x0, y0, x1, y1, m) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 4000; guard++) {
      this.px(x0, y0, m);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  dither(x, y, w, h, m, ph) {
    ph = ph || 0;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (((xx + yy + ph) & 1) === 0) this.px(xx, yy, m);
  }
  recolor(x, y, w, h, from, to) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (this.get(xx, yy) === from) this.px(xx, yy, to);
  }
  // stamp a string sprite: rows of characters mapped through legend (0/undefined = skip)
  stamp(x, y, rows, legend, flipX) {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const m = legend[row[i]];
        if (m) this.px(flipX ? x + row.length - 1 - i : x + i, y + j, m);
      }
    }
  }
}
function rasterFromRows(rows, legend) {
  const w = rows.reduce((a, r) => Math.max(a, r.length), 0);
  const R = new Raster(w, rows.length);
  R.stamp(0, 0, rows, legend);
  return R;
}
