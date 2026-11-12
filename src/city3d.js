/* =====================================================================
   The five cities again, this time as low-poly models for the Front,
   Rear and 3D views. Each is a loop of river L3 units long with a quay
   on both banks, rows of buildings and that city's landmarks, so the
   plane can fly along it forever. x runs along the river, y is up.
   ===================================================================== */
const L3 = 2400, RW3 = 150, GY = 6.5, CHUNK3 = 300;

function kit3(B, rng, S) {
  const resv = [], marks = [], spinners = [];
  const K = {
    S, marks, spinners,
    reserve(side, x0, x1, z0, z1) { resv.push([side, x0, x1, z0, z1]); },
    free(side, x0, x1, z0, z1) { for (const r of resv) if (r[0] === side && x0 < r[2] && x1 > r[1] && z0 < r[4] && z1 > r[3]) return false; return true; },
    mark(name, x) { marks.push({ name, x }); },
    zbox(x0, y0, za, x1, y1, zb, col, mat, top) { B.box(x0, y0, Math.min(za, zb), x1, y1, Math.max(za, zb), col, mat, top); },
    tree(x, z, col, k) {
      k = k || 1;
      B.block(x, z, 0.9, 0.9, GY, GY + 3 * k, '#6b4a35');
      B.block(x, z, 5.2 * k, 5.2 * k, GY + 3 * k, GY + 7 * k, col); B.block(x, z, 3.4 * k, 3.4 * k, GY + 7 * k, GY + 9.4 * k, shade3(col, 1.12));
    },
    lamp(x, z, y) {
      y = y === undefined ? GY : y;
      B.block(x, z, 0.5, 0.5, y, y + 7, '#3a3540'); B.block(x, z, 1.5, 1.5, y + 7, y + 8.4, '#ffe2a0', MT.night);
    },
    boat(x, z, type) {
      if (type === 'sail') {
        B.taper(x, z, 0.3, 11, 3.4, 2.4, 14, 4.4, '#f1ece0'); B.block(x - 1, z, 0.5, 0.5, 2.4, 17, '#6b4a35');
        B.tri([x - 0.6, 3.6, z], [x - 0.6, 16.4, z], [x - 8, 3.6, z], '#fff8ea'); B.tri([x - 0.4, 4, z], [x - 0.4, 14, z], [x + 5.5, 4, z], '#ffe1d0');
      } else if (type === 'tug') {
        B.taper(x, z, 0.3, 15, 5, 3.2, 18, 6.4, '#8a2f2a', 0, 0, 0, '#c9b79a'); B.block(x - 1, z, 7, 4.4, 3.2, 7.4, '#f1ece0', MT.windows, '#b84a3a');
        B.block(x - 3, z, 1.8, 1.8, 7.4, 11, '#2f2a31'); B.block(x - 3, z, 2, 2, 10, 10.8, '#e8443a');
      } else if (type === 'ferry') {
        B.taper(x, z, 0.3, 30, 8, 3, 34, 9.6, '#e98a3a', 0, 0, 0, '#d8d2c4'); B.block(x, z, 28, 8, 3, 7.4, '#f4efe2', MT.windows, '#d8d2c4');
        B.block(x - 2, z, 14, 6, 7.4, 10.6, '#f4efe2', MT.windows, '#3d4a66'); B.block(x - 6, z, 2, 2, 10.6, 14, '#3d4a66');
      } else if (type === 'barge') {
        B.taper(x, z, 0.3, 30, 6, 2.2, 34, 7.2, '#f4f1e6', 0, 0, 0, '#d8d2c4'); B.block(x, z, 26, 5.6, 2.2, 5.2, '#bfe3f0', MT.windows, '#3f5f8a');
        for (let i = -12; i <= 12; i += 6) B.block(x + i, z + 3, 0.8, 0.8, 5.2, 6, '#ffe2a0', MT.night);
      } else {
        B.taper(x, z, 0.3, 22, 5, 2, 26, 6.2, '#4a3a33', 0, 0, 0, '#8a6a4a'); B.block(x, z, 17, 5, 2, 5.4, '#e9dcc0', MT.windows, '#3f4652');
        B.taper(x, z, 5.4, 19, 6.6, 7.4, 15, 2.4, '#3f4652');
        for (let i = -8; i <= 8; i += 4) B.block(x + i, z + 3.4, 1, 1, 3.4, 4.6, '#ff6a4a', MT.night);
      }
    },
    /* a suspension bridge across the river at x */
    susp(x, o) {
      const W = o.w || 18, dy = o.deckY, tz = o.towerZ, th = o.towerH, c = o.col, cd = o.colD || shade3(c, 0.78), cab = o.cable || c, ct = o.cableT || 1;
      B.box(x - W / 2, dy - 2.6, -RW3 - 14, x + W / 2, dy, RW3 + 14, o.deck || '#676c78', 0, '#4c505b');
      B.box(x - W / 2, dy, -RW3 - 14, x - W / 2 + 1, dy + 1.5, RW3 + 14, cd); B.box(x + W / 2 - 1, dy, -RW3 - 14, x + W / 2, dy + 1.5, RW3 + 14, cd);
      for (const s of [-1, 1]) {
        const z = s * tz;
        if (o.style === 'stone') {
          B.box(x - W / 2 - 5, 0, z - 6, x + W / 2 + 5, dy - 2.6, z + 6, c);
          for (const k of [-1, 0, 1]) B.box(x + k * (W / 2 + 1.4) - 2.4, dy - 2.6, z - 4.4, x + k * (W / 2 + 1.4) + 2.4, th - 16, z + 4.4, c);
          for (const k of [-0.5, 0.5]) B.taper(x + k * (W / 2 + 1.4), z, th - 24, 0.1, 8.8, th - 16, W / 2 - 1, 8.8, c);
          B.box(x - W / 2 - 4.4, th - 16, z - 4.8, x + W / 2 + 4.4, th, z + 4.8, c, 0, cd);
          B.box(x - W / 2 - 5.2, th - 4, z - 5.4, x + W / 2 + 5.2, th - 2.4, z + 5.4, cd);
        } else {
          for (const k of [-1, 1]) B.box(x + k * (W / 2 + 1.6) - 1.9, 0, z - 2.6, x + k * (W / 2 + 1.6) + 1.9, th, z + 2.6, c);
          for (const yy of o.braces || [th - 3, th * 0.7, dy + 9]) B.box(x - W / 2 - 1.6, yy - 1.7, z - 2, x + W / 2 + 1.6, yy + 1.7, z + 2, cd);
          if (o.style === 'steel') {
            B.beam([x - W / 2 - 1.6, th * 0.7, z], [x + W / 2 + 1.6, th - 3, z], 1.1, cd); B.beam([x + W / 2 + 1.6, th * 0.7, z], [x - W / 2 - 1.6, th - 3, z], 1.1, cd);
            B.beam([x - W / 2 - 1.6, dy + 9, z], [x + W / 2 + 1.6, th * 0.7, z], 1.1, cd); B.beam([x + W / 2 + 1.6, dy + 9, z], [x - W / 2 - 1.6, th * 0.7, z], 1.1, cd);
          }
          B.box(x - W / 2 - 3, 0, z - 4, x + W / 2 + 3, 5, z + 4, '#8f8a84');
        }
        for (const k of [-1, 1]) {
          const cx = x + k * (W / 2 + 0.4), N = 7;
          let py = th - 1, pz = z;
          for (let i = 1; i <= N; i++) {
            const u = 1 - i / N, zz = z * u, yy = dy + 2.4 + (th - 3.4 - dy) * u * u;
            B.beam([cx, py, pz], [cx, yy, zz], ct, cab, MT.night);
            if (i < N) B.box(cx - 0.22, dy, zz - 0.22, cx + 0.22, yy, zz + 0.22, cd);
            py = yy; pz = zz;
          }
          const ze = s * (RW3 + 12);
          py = th - 1; pz = z;
          for (let i = 1; i <= 4; i++) {
            const u = 1 - i / 4, zz = lerp(ze, z, u), yy = dy + 1 + (th - 2 - dy) * u * u;
            B.beam([cx, py, pz], [cx, yy, zz], ct, cab, MT.night);
            if (i < 4) B.box(cx - 0.22, dy, zz - 0.22, cx + 0.22, yy, zz + 0.22, cd);
            py = yy; pz = zz;
          }
        }
        K.reserve(s, x - W / 2 - 14, x + W / 2 + 14, RW3, RW3 + 96);
      }
    },
    /* a low masonry bridge on piers */
    arch(x, o) {
      const W = o.w || 14, dy = o.deckY, n = o.piers || 5, c = o.col, cd = shade3(c, 0.8);
      B.box(x - W / 2, dy - 3, -RW3 - 12, x + W / 2, dy, RW3 + 12, c, 0, o.road || '#6b6660');
      B.box(x - W / 2 - 0.5, dy, -RW3 - 12, x - W / 2 + 0.6, dy + 1.6, RW3 + 12, o.rail || cd); B.box(x + W / 2 - 0.6, dy, -RW3 - 12, x + W / 2 + 0.5, dy + 1.6, RW3 + 12, o.rail || cd);
      const span = (2 * RW3) / n;
      for (let i = 0; i <= n; i++) {
        const z = -RW3 + i * span;
        if (i > 0 && i < n) { B.box(x - W / 2 - 1.5, 0, z - 3.2, x + W / 2 + 1.5, dy - 3, z + 3.2, c); B.taper(x, z, 1, W + 6, 9, 4, W + 3, 6.4, cd); }
        B.taper(x, z, Math.max(2, dy - 3 - span * 0.26), W, 6.4, dy - 3, W, span * 0.72, cd);
        if (o.lamps && i < n) K.lamp(x - W / 2 + 0.6, z + span / 2, dy);
      }
      for (const s of [-1, 1]) K.reserve(s, x - W / 2 - 10, x + W / 2 + 10, RW3, RW3 + 70);
    },
  };
  return K;
}

/* water, quays, the ground behind them, trees and lamps */
function land3(B, rng, K) {
  const S = K.S;
  B.quad([0, 0, -RW3], [L3, 0, -RW3], [L3, 0, RW3], [0, 0, RW3], '#ffffff', MT.water);
  for (const s of [-1, 1]) {
    K.zbox(0, 0, s * RW3, L3, GY + 0.5, s * (RW3 + 9), S.quay, 0, S.quayTop);
    K.zbox(0, GY + 0.5, s * (RW3 + 8), L3, GY + 1.5, s * (RW3 + 9), shade3(S.quay, 0.85));
    B.quad([0, GY, s * (RW3 + 9)], [L3, GY, s * (RW3 + 9)], [L3, GY, s * 1250], [0, GY, s * 1250], S.ground);
    B.quad([0, GY + 0.5, s * (RW3 + 44)], [L3, GY + 0.5, s * (RW3 + 44)], [L3, GY + 0.5, s * (RW3 + 52)], [0, GY + 0.5, s * (RW3 + 52)], S.road || '#5d5a60');
    for (let x = rf(rng, 4, 20); x < L3; x += rf(rng, 15, 30)) if (K.free(s, x - 3, x + 3, RW3, RW3 + 12)) K.tree(x, s * (RW3 + 4.4), pick(rng, S.trees), rf(rng, 0.85, 1.2));
    for (let x = 12; x < L3; x += 48) if (K.free(s, x - 2, x + 2, RW3, RW3 + 6)) K.lamp(x, s * (RW3 + 1.6), GY + 0.5);
  }
}

function basicBuilding(B, rng, S, cx, z, w, d, h) {
  const col = pick(rng, S.pal), roof = shade3(col, 0.66);
  B.block(cx, z, w, d, GY, GY + h, col, MT.windows, roof);
  if (h > 74 && rng() < 0.65) {
    const w2 = w * rf(rng, 0.5, 0.74), d2 = d * rf(rng, 0.5, 0.74), h2 = rf(rng, 10, 30);
    B.block(cx, z, w2, d2, GY + h, GY + h + h2, col, MT.windows, roof);
    if (rng() < 0.55) { B.block(cx, z, 1.2, 1.2, GY + h + h2, GY + h + h2 + rf(rng, 8, 20), '#8a8f98'); B.block(cx, z, 1.6, 1.6, GY + h + h2 + 20, GY + h + h2 + 21.4, '#ff5a4a', MT.night); }
  } else if (rng() < 0.4) B.block(cx + rf(rng, -w * 0.2, w * 0.2), z, w * 0.34, d * 0.4, GY + h, GY + h + rf(rng, 2, 5), roof);
  return col;
}

function rows3(B, rng, K) {
  const S = K.S;
  for (const s of [-1, 1]) for (let r = 0; r < S.rows.length; r++) {
    const R = S.rows[r];
    if (R.side && R.side !== s) continue;          // rows may keep to one bank ...
    const xEnd = R.x1 == null ? L3 : R.x1;         // ... and to one stretch of the river
    let x = (R.x0 || 0) + rf(rng, 0, 16);
    while (x < xEnd - 8) {
      const w = rf(rng, R.w[0], R.w[1]), d = rf(rng, R.d[0], R.d[1]);
      let h = rf(rng, R.h[0], R.h[1]);
      if (R.tall && rng() < R.tall) h = rf(rng, R.tallH[0], R.tallH[1]);
      const zd = RW3 + R.z + rf(rng, -2, 2);
      if (x + w > xEnd - 1) break;
      if (K.free(s, x - 1, x + w + 1, zd, zd + d)) (S.building || basicBuilding)(B, rng, S, x + w / 2, s * (zd + d / 2), w, d, h, r, s);
      x += w + rf(rng, R.gap[0], R.gap[1]);
    }
  }
}

function latticeTower(B, x, z, cols, H) {
  const c = cols[0], cd = shade3(c, 0.8), k = H / 172;
  for (const a of [-1, 1]) for (const b of [-1, 1]) B.taper(x + a * 27 * k, z + b * 27 * k, GY, 13 * k, 13 * k, GY + 40 * k, 9 * k, 9 * k, c, MT.lattice, -a * 9.5 * k, -b * 9.5 * k);
  for (const a of [-1, 1]) { B.box(x - 27 * k, GY + 21 * k, z + a * 22 * k - 1, x + 27 * k, GY + 23.4 * k, z + a * 22 * k + 1, cd, MT.lattice); B.box(x + a * 22 * k - 1, GY + 21 * k, z - 27 * k, x + a * 22 * k + 1, GY + 23.4 * k, z + 27 * k, cd, MT.lattice); }
  B.block(x, z, 47 * k, 47 * k, GY + 40 * k, GY + 44 * k, cols[1] || cd, MT.lattice);
  for (const a of [-1, 1]) for (const b of [-1, 1]) B.taper(x + a * 15 * k, z + b * 15 * k, GY + 44 * k, 9 * k, 9 * k, GY + 76 * k, 6 * k, 6 * k, c, MT.lattice, -a * 6.5 * k, -b * 6.5 * k);
  B.block(x, z, 25 * k, 25 * k, GY + 76 * k, GY + 79.5 * k, cols[1] || cd, MT.lattice);
  const seg = cols.length > 2 ? 4 : 1, y0 = GY + 79.5 * k, y1 = GY + 154 * k;
  for (let i = 0; i < seg; i++) {
    const u0 = i / seg, u1 = (i + 1) / seg;
    B.taper(x, z, lerp(y0, y1, u0), lerp(15, 4.6, u0) * k, lerp(15, 4.6, u0) * k, lerp(y0, y1, u1), lerp(15, 4.6, u1) * k, lerp(15, 4.6, u1) * k, cols.length > 2 ? cols[i % 2 ? 2 : 0] : c, MT.lattice);
  }
  B.block(x, z, 7.4 * k, 7.4 * k, y1, y1 + 4 * k, cols[1] || cd, MT.lattice); B.taper(x, z, y1 + 4 * k, 4 * k, 4 * k, GY + 172 * k, 1, 1, c, MT.lattice);
  B.block(x, z, 0.9, 0.9, GY + 172 * k, GY + 184 * k, '#8a7a66'); B.block(x, z, 2.2, 2.2, GY + 184 * k, GY + 186 * k, '#fff1c8', MT.night);
}
function dome3(B, x, z, y, r, col, n) {
  const st = [[0, 1], [0.34, 0.94], [0.62, 0.78], [0.84, 0.52], [0.97, 0.2]];
  for (let i = 0; i + 1 < st.length; i++) B.cyl(x, z, y + st[i][0] * r, st[i][1] * r, y + st[i + 1][0] * r, st[i + 1][1] * r, n || 10, col, MT.night);
  return y + 0.97 * r;
}

/* each city file adds its own entry */
const STYLE3 = {};


/* Build a city, then sort its triangles into chunks along the river so that
   only the stretches near the camera need to be drawn. */
const city3Cache = {};
function getCity3(id) {
  if (city3Cache[id]) return city3Cache[id];
  const S = STYLE3[id], B = new Mesh3(), rng = mulberry32(S.seed), K = kit3(B, rng, S);
  S.gen(B, rng, K);
  land3(B, rng, K);
  rows3(B, rng, K);
  const n = Math.ceil(L3 / CHUNK3), chunks = Array.from({ length: n }, () => new Mesh3());
  const wide = new Mesh3();
  for (let t = 0; t < B.count; t += 3) {
    const i = t * 3, x0 = B.P[i], x1 = B.P[i + 3], x2 = B.P[i + 6];
    const big = Math.abs(x0 - x1) > CHUNK3 || Math.abs(x0 - x2) > CHUNK3;
    const T = big ? wide : chunks[clamp(Math.floor((x0 + x1 + x2) / 3 / CHUNK3), 0, n - 1)];
    for (let k = 0; k < 9; k++) { T.P.push(B.P[i + k]); T.N.push(B.N[i + k]); }
    for (let k = 0; k < 12; k++) T.C.push(B.C[t * 4 + k]);
  }
  let backdrop = null;
  if (S.backdrop) { backdrop = new Mesh3(); S.backdrop(backdrop); }
  K.marks.sort((a, b) => a.x - b.x);
  return (city3Cache[id] = { id, chunks, wide, backdrop, spinners: K.spinners, marks: K.marks, gpu: null, tris: B.count / 3 });
}
