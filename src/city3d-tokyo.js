/* ---------- Tokyo ----------
   The same stretch of the Sumida as the side view: x = (m + 200) * 0.3047,
   m being metres along the river from Sakura Bridge (see city-tokyo.js).
   The far bank (-z) is Sumida and Kōtō wards (Skytree, Asahi, Kokugikan,
   River City 21); the near bank (+z) is Taitō and Chūō wards (Asakusa and
   Sensō-ji, Kuramae, Yanagibashi, Hamachō, St. Luke's) with Tokyo Tower far
   back. Depth inland is compressed (0.14 per metre). */
function city3Tokyo(B, rng, K) {
  const X = m => (m + 200) * 0.3047, Z = d => RW3 + 16 + d * 0.14, H = 0.42;
  let x, z;
  /* bridges, north to south, in their real colours */
  K.arch(X(0), { col: '#d9d6cc', deckY: 13, piers: 3, w: 6 });
  K.arch(X(587), { col: '#4f80ba', deckY: 15, piers: 4, w: 12, lamps: true }); K.mark('the Kototoi Bridge', X(587));
  K.arch(X(999), { col: '#7d8f9c', deckY: 15, piers: 3, w: 10, road: '#6b625a' });
  for (let zz = -RW3; zz <= RW3; zz += 30) B.box(X(999) - 5, 15, zz - 0.4, X(999) + 5, 22, zz + 0.4, '#5a6672');
  K.mark('the Tobu railway bridge', X(999));
  K.arch(X(1231), { col: '#c8352b', deckY: 16, piers: 3, w: 12, lamps: true }); K.mark('the Azuma Bridge', X(1231));
  const overArch = (xc, w, z0, z1, rise, y0, col, n) => {
    for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, ya = y0 + rise * Math.sin(u0 * Math.PI), yb = y0 + rise * Math.sin(u1 * Math.PI);
      B.beam([xc + s * w / 2, ya, lerp(z0, z1, u0)], [xc + s * w / 2, yb, lerp(z0, z1, u1)], 1.6, col);
      if (i % 2 && i < n - 1) B.box(xc + s * w / 2 - 0.2, y0, lerp(z0, z1, u1) - 0.2, xc + s * w / 2 + 0.2, yb, lerp(z0, z1, u1) + 0.2, col);
    }
  };
  K.arch(X(1637), { col: '#8fb6d8', deckY: 15, piers: 3, w: 13, lamps: true }); overArch(X(1637), 13, -50, 50, 22, 15, '#8fb6d8', 10); K.mark('the Komagata Bridge', X(1637));
  K.arch(X(2062), { col: '#5f9c6e', deckY: 15, piers: 3, w: 14, lamps: true });
  for (const [a, b] of [[-RW3, -50], [-50, 50], [50, RW3]]) overArch(X(2062), 14, a, b, 14, 15, '#5f9c6e', 8);
  K.mark('the Umaya Bridge', X(2062));
  K.arch(X(2441), { col: '#dfb43a', deckY: 16, piers: 3, w: 16, lamps: true }); K.mark('the Kuramae Bridge', X(2441));
  K.arch(X(3130), { col: '#6c9a58', deckY: 15, piers: 3, w: 9, road: '#6b625a' });
  for (const [a, b] of [[-RW3, -50], [-50, 50], [50, RW3]]) overArch(X(3130), 9, a, b, 18, 15, '#6c9a58', 8);
  K.arch(X(3279), { col: '#7f978e', deckY: 15, piers: 4, w: 14, lamps: true }); K.mark('the Ryōgoku Bridge', X(3279));
  K.arch(X(3420), { col: '#6f9a93', deckY: 24, piers: 5, w: 15 });
  K.susp(X(4187), { col: '#e0a23a', towerH: 58, deckY: 16, towerZ: 55, braces: [54, 40], cable: '#f0c060', w: 14 }); K.mark('the Shin-Ōhashi', X(4187));
  K.susp(X(4671), { col: '#4f86c6', colD: '#3c6aa0', style: 'steel', towerH: 52, deckY: 16, towerZ: 70, braces: [49, 36], cable: '#4f86c6', cableT: 1.8, w: 13 }); K.mark('the Kiyosu Bridge', X(4671));
  K.arch(X(5472), { col: '#93b9d8', deckY: 16, piers: 2, w: 14, lamps: true }); overArch(X(5472), 14, -110, 110, 40, 16, '#93b9d8', 14); K.mark('the Eitai Bridge', X(5472));
  K.arch(X(6110), { col: '#e8ebee', deckY: 16, piers: 2, w: 14, lamps: true });
  x = X(6110);
  for (const s of [-1, 1]) { B.beam([x + s * 9, 0, 0], [x, 60, 0], 2.4, '#e8ebee'); for (let d = 20; d <= 120; d += 20) for (const zs of [-1, 1]) B.beam([x, 58 - d * 0.12, 0], [x + s * 7, 17, zs * d], 0.5, '#f4f6f8', MT.night); }
  B.block(x, 0, 2.4, 2.4, 60, 78, '#e8ebee'); K.mark('the Chūō-Ōhashi', x);
  /* the Shuto Route 6 viaduct along the far bank */
  for (let xx = X(230); xx < X(3420); xx += 22) B.block(xx, -(RW3 + 18), 3, 3, GY, GY + 13, '#b9b8b1');
  B.box(X(230), GY + 13, -(RW3 + 25), X(3420), GY + 16, -(RW3 + 11), '#6f9a93', 0, '#5d6068');
  B.box(X(230), GY + 16, -(RW3 + 11.6), X(3420), GY + 17, -(RW3 + 11), '#d6d8d2');
  K.reserve(-1, X(230), X(3420), RW3, RW3 + 30);
  /* TOKYO SKYTREE */
  x = X(1000); z = -Z(700);
  B.cyl(x, z, GY, 15, GY + 30, 10, 3, '#dfe6ee', MT.lattice); B.cyl(x, z, GY + 30, 10, GY + 140, 7, 10, '#dfe6ee', MT.lattice);
  B.cyl(x, z, GY + 140, 10.5, GY + 150, 10.5, 12, '#c9d3de', MT.windows); B.cyl(x, z, GY + 149, 10.6, GY + 150.6, 10.6, 12, '#b98aff', MT.night);
  B.cyl(x, z, GY + 150, 6, GY + 185, 5, 10, '#dfe6ee', MT.lattice); B.cyl(x, z, GY + 185, 7.4, GY + 191, 7.4, 12, '#c9d3de', MT.windows);
  B.cyl(x, z, GY + 191, 4.5, GY + 208, 3.4, 8, '#dfe6ee'); B.cyl(x, z, GY + 208, 1.6, GY + 266, 0.5, 4, '#f2f4f6', MT.lattice);
  B.cyl(x, z, GY + 60, 7.4, GY + 62, 7.2, 10, '#7fd6ff', MT.night); B.cyl(x, z, GY + 110, 7.5, GY + 112, 7.4, 10, '#7fd6ff', MT.night);
  K.reserve(-1, x - 22, x + 22, -z - 22, -z + 22); K.mark('Tokyo Skytree', x);
  /* the Asahi group at the east end of Azuma Bridge */
  x = X(1262); z = -Z(70);
  B.block(x, z, 20, 18, GY, GY + 100 * H * 1.3, '#d4a443', MT.windows, '#e9c46a');
  B.block(x, z, 21, 19, GY + 100 * H * 1.3, GY + 100 * H * 1.3 + 7, '#eef1f2', MT.night);
  B.taper(x + 22, z, GY, 16, 16, GY + 22, 22, 20, '#25242a');
  B.cyl(x + 17, z, GY + 25, 4.2, GY + 25.5, 4.2, 8, '#e3b23c');
  B.beam([x + 15, GY + 25, z], [x + 36, GY + 31, z], 4, '#e3b23c', MT.night);
  B.beam([x + 34, GY + 30, z], [x + 40, GY + 36, z], 2, '#e3b23c', MT.night);
  B.block(x + 28, z - 30, 18, 16, GY, GY + 115 * H * 1.2, '#93a9bd', MT.windows, '#71879c');
  K.reserve(-1, x - 14, x + 50, -z - 46, -z + 12); K.mark('the Asahi Beer Tower', x);
  /* the Ryōgoku Kokugikan, the Edo-Tokyo Museum behind it */
  x = X(2832); z = -Z(150);
  B.block(x, z, 44, 44, GY, GY + 10, '#d8d5cc', MT.windows);
  B.taper(x, z, GY + 10, 50, 50, GY + 22, 30, 30, '#5f9f86'); B.block(x, z, 30.4, 30.4, GY + 22, GY + 23, '#d6aa3e', MT.night);
  B.block(x, z, 24, 24, GY + 23, GY + 26, '#d8d5cc'); B.taper(x, z, GY + 26, 28, 28, GY + 34, 10, 10, '#5f9f86'); B.block(x, z, 1.4, 1.4, GY + 34, GY + 38, '#d6aa3e');
  K.reserve(-1, x - 30, x + 30, -z - 30, -z + 30); K.mark('the Ryōgoku Kokugikan', x);
  x = X(2765); z = -Z(400);
  for (const a of [-14, 14]) for (const b of [-10, 10]) B.block(x + a, z + b, 5, 5, GY, GY + 18, '#d9d6cf');
  B.taper(x, z, GY + 18, 44, 34, GY + 34, 54, 40, '#d9d6cf', MT.windows); B.block(x, z, 56, 42, GY + 34, GY + 37, '#5a5f68');
  K.reserve(-1, x - 30, x + 30, -z - 24, -z + 24); K.mark('the Edo-Tokyo Museum', x);
  /* River City 21 on Ishikawajima */
  const rc = [[6430, 40, 135, '#cdbba2'], [6475, 18, 150, '#8f7766'], [6520, 45, 165, '#bcb8b0'], [6565, 20, 180, '#8f7766'], [6615, 42, 150, '#c9b2a4'], [6660, 18, 140, '#cdbba2'], [6720, 40, 120, '#bcb8b0']];
  for (const [m, d, h, c] of rc) { const tx = X(m), tz = -Z(d + 60); B.block(tx, tz, 13, 13, GY, GY + h * H * 1.5, c, MT.windows, shade3(c, 0.7)); B.block(tx, tz, 8, 8, GY + h * H * 1.5, GY + h * H * 1.5 + 4, c); K.reserve(-1, tx - 9, tx + 9, -tz - 9, -tz + 9); }
  K.mark('River City 21', X(6565));
  /* Sumida Park cherry trees on both banks at the north end */
  for (let i = 0; i < 90; i++) { const s = rng() < 0.5 ? -1 : 1, tx = rng() * X(560), tz = RW3 + 12 + rng() * 60; if (K.free(s, tx - 3, tx + 3, tz - 3, tz + 3)) K.tree(tx, s * tz, rng() < 0.75 ? pick(rng, ['#f2a7c3', '#f7bcd2', '#e88fb4']) : '#6f9a5a', rf(rng, 1, 1.5)); }
  K.reserve(-1, 0, X(560), RW3, RW3 + 76); K.reserve(1, 0, X(560), RW3, RW3 + 76);
  /* near bank: Asakusa and Sensō-ji, with its five-storey pagoda */
  x = X(1128); z = Z(486);
  for (let i = 0; i < 5; i++) {
    const y = GY + 2 + i * 9.2, w = 11 - i * 1.1;
    B.block(x, z, w, w, y, y + 5.4, '#c8452f'); B.taper(x, z, y + 5.4, w + 11, w + 11, y + 6.4, w + 9.6, w + 9.6, '#3f4652'); B.taper(x, z, y + 6.4, w + 9.6, w + 9.6, y + 9.2, w - 1, w - 1, '#4a525f');
  }
  B.block(x, z, 16, 16, GY, GY + 2, '#b9ab94'); B.block(x, z, 0.8, 0.8, GY + 48, GY + 60, '#d9b24a', MT.night);
  B.block(x + 38, z + 4, 34, 22, GY, GY + 3, '#b9ab94'); B.block(x + 38, z + 4, 28, 16, GY + 3, GY + 13, '#c8452f', 0, '#3f4652');
  B.taper(x + 38, z + 4, GY + 13, 40, 28, GY + 15, 37, 25, '#3f4652'); B.gable(x + 38, z + 4, 37, 25, GY + 15, 9, '#4a525f', 0, false);
  B.block(x + 30, z - 30, 12, 6, GY, GY + 10, '#c8452f', 0, '#3f4652'); B.block(x + 30, z - 30.5, 4, 1, GY + 3, GY + 8, '#d84a3a', MT.night);
  K.reserve(1, x - 20, x + 62, z - 40, z + 26); K.mark('Sensō-ji', x + 10);
  /* Asakusa, Kuramae, Yanagibashi and Nihonbashi on the near bank are the generic rows; Hamachō Park */
  for (let i = 0; i < 40; i++) { const tx = X(3700) + rng() * (X(4250) - X(3700)), tz = RW3 + 12 + rng() * 50; if (K.free(1, tx - 3, tx + 3, tz - 3, tz + 3)) K.tree(tx, tz, '#6f9a5a', rf(rng, 1, 1.6)); }
  K.reserve(1, X(3700), X(4250), RW3, RW3 + 64);
  /* St. Luke's Tower */
  x = X(6557); z = Z(341);
  B.block(x, z, 18, 18, GY, GY + 220 * H, '#d9d4c8', MT.windows, '#b9b2a4'); B.taper(x, z, GY + 220 * H, 18, 18, GY + 220 * H + 8, 6, 6, '#7f8590');
  K.reserve(1, x - 12, x + 12, z - 12, z + 12); K.mark("St. Luke's Tower", x);
  /* Tokyo Tower, far back to the south-west */
  x = X(6400); z = Z(3499);
  latticeTower(B, x, z, ['#e8502e', '#f2efe8', '#f2efe8'], 150);
  K.reserve(1, x - 40, x + 40, z - 40, z + 40); K.mark('Tokyo Tower', x);
  /* boats: yakatabune, a water bus, a barge */
  K.boat(X(400), 70, 'yakata'); K.boat(X(1450), -92, 'yakata'); K.boat(X(2600), 60, 'ferry'); K.boat(X(4400), -70, 'barge'); K.boat(X(5800), 80, 'yakata');
}
const NEON = ['#ff4d6d', '#3ad6ff', '#ffd23f', '#7dff9a', '#ff8a3d', '#c77dff'];
function tokyoBuilding(B, rng, S, cx, z, w, d, h, r, s) {
  basicBuilding(B, rng, S, cx, z, w, d, h);
  if (r < 2 && rng() < 0.55) {
    const face = z - s * (d / 2 + 0.4), sw = rf(rng, 2, 3.4), sh = Math.min(h * 0.6, rf(rng, 8, 22)), px = cx + rf(rng, -w * 0.3, w * 0.3), y0 = GY + h * rf(rng, 0.25, 0.4);
    B.box(px - sw / 2, y0, Math.min(face, face - s * 0.6), px + sw / 2, y0 + sh, Math.max(face, face - s * 0.6), pick(rng, NEON), MT.night);
  }
  if (r < 2 && rng() < 0.2) { const bw = Math.min(w * 0.8, 14); B.box(cx - bw / 2, GY + h + 1, z - 0.4, cx + bw / 2, GY + h + 7, z + 0.4, pick(rng, NEON), MT.night); for (const a of [-bw / 2 + 1, bw / 2 - 1]) B.block(cx + a, z, 0.5, 0.5, GY + h, GY + h + 1, '#3a3540'); }
}

STYLE3.tokyo = {
  gen: city3Tokyo, seed: 1958, building: tokyoBuilding, synced: true, hero: 510,
  pal: ['#e8e4da', '#d9d7d1', '#cfc6b5', '#c6cacf', '#9b7f6b', '#80888f', '#b59c86', '#aab2bb'], quay: '#a3a39d', quayTop: '#c9c8c1', ground: '#6f7278', trees: ['#6f9a5a', '#5f8a52', '#f2a7c3', '#7a9f60'],
  rows: [
    /* far bank: dense, varied, low by the river */
    { side: -1, z: 34, h: [10, 26], w: [8, 16], d: [10, 16], gap: [0.4, 2.5] },
    { side: -1, z: 58, h: [14, 36], w: [10, 20], d: [12, 20], gap: [0.5, 3], tall: 0.06, tallH: [44, 60] },
    { side: -1, z: 90, h: [16, 42], w: [12, 24], d: [14, 22], gap: [0.6, 3.5], tall: 0.08, tallH: [48, 70] },
    { side: -1, z: 130, h: [16, 48], w: [14, 26], d: [16, 24], gap: [1, 5], tall: 0.08, tallH: [50, 80] },
    { side: -1, x0: 1450, x1: 1900, z: 24, h: [8, 14], w: [18, 34], d: [14, 20], gap: [2, 6] },
    /* near bank: Asakusa, Kuramae, Nihonbashi */
    { side: 1, z: 20, h: [10, 28], w: [8, 16], d: [10, 16], gap: [0.4, 2.5] },
    { side: 1, z: 48, h: [14, 40], w: [10, 22], d: [12, 20], gap: [0.5, 3], tall: 0.06, tallH: [44, 64] },
    { side: 1, z: 84, h: [16, 50], w: [12, 24], d: [14, 22], gap: [0.6, 4], tall: 0.1, tallH: [50, 80] },
    { side: 1, x0: 1800, z: 130, h: [20, 60], w: [14, 28], d: [16, 24], gap: [1, 6], tall: 0.12, tallH: [60, 90] },
  ],
};
