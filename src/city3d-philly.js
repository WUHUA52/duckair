/* ---------- Philadelphia ----------
   The same stretch of the Schuylkill as the side view: x = (m - 760) * 0.762,
   m being metres along the river (see city-philly.js). The far bank (-z) is
   Center City, the near bank (+z) is West Philadelphia. Depth inland is
   compressed (0.14 per metre) so the skyline stays inside the haze. */
function city3Philadelphia(B, rng, K) {
  const X = m => (m - 760) * 0.762, Z = d => -(RW3 + 16 + d * 0.14), H = 0.62;
  let x, z;
  /* bridges, north to south */
  const stone = '#b8a88f', steel = '#4f8f8a', conc = '#b5b1a8', blue = '#4a78a8';
  K.arch(X(1696), { col: blue, deckY: 17, piers: 4, w: 14, lamps: true }); K.mark('the Spring Garden Street Bridge', X(1696));
  K.arch(X(2246), { col: conc, deckY: 18, piers: 5, w: 22 }); K.mark('the Vine Street Expressway', X(2246));
  K.arch(X(2731), { col: '#cbbfa8', deckY: 16, piers: 3, w: 17, lamps: true });
  K.arch(X(2846), { col: '#cbbfa8', deckY: 15, piers: 3, w: 17, lamps: true }); K.mark('the Market Street Bridge', X(2846));
  K.arch(X(3016), { col: steel, deckY: 16, piers: 4, w: 12, lamps: true });
  K.arch(X(3196), { col: steel, deckY: 17, piers: 4, w: 13, lamps: true }); K.mark('the Walnut Street Bridge', X(3196));
  K.arch(X(3846), { col: conc, deckY: 18, piers: 4, w: 16, lamps: true }); K.mark('the South Street Bridge', X(3846));
  /* Fairmount Dam */
  B.box(X(1346) - 2.5, 0, -RW3, X(1346) + 2.5, 1.6, RW3, '#e8f1f5'); B.box(X(1346) + 2.5, 0, -RW3, X(1346) + 7, 0.5, RW3, '#cfe0ea');
  /* Boathouse Row, lit along every edge, and its little lighthouse */
  const hc = ['#ece3d1', '#d9c597', '#b9785c', '#e6d8b2', '#c9b79f', '#a8866a'];
  B.block(X(852), -(RW3 + 14), 4, 4, GY, GY + 17, '#ece3d1'); B.block(X(852), -(RW3 + 14), 3, 3, GY + 17, GY + 20, '#fff4c4', MT.night); B.taper(X(852), -(RW3 + 14), GY + 20, 5, 5, GY + 24, 0.4, 0.4, '#6b3f38');
  for (let i = 0; i < 10; i++) {
    const hx = X(880) + i * 21.4, hz = -(RW3 + 19), hw = 18, c = hc[i % hc.length];
    B.block(hx, hz, hw, 14, GY, GY + 9, c); B.gable(hx, hz, hw, 15, GY + 9, 7, i % 2 ? '#6b3f38' : '#5c4a40', 0, true);
    if (i % 3 !== 2) { B.block(hx + (i % 2 ? -5 : 5), hz + 4, 5, 5, GY + 9, GY + 17, c); B.taper(hx + (i % 2 ? -5 : 5), hz + 4, GY + 17, 6, 6, GY + 23, 0.4, 0.4, '#5c4a40'); }
    for (const e of [-hw / 2, hw / 2]) B.box(hx + e - 0.25, GY, hz + 7, hx + e + 0.25, GY + 9, hz + 7.5, '#ffe2a0', MT.night);
    B.beam([hx - hw / 2, GY + 9, hz + 7.5], [hx, GY + 16, hz + 7.5], 0.5, '#ffe2a0', MT.night); B.beam([hx + hw / 2, GY + 9, hz + 7.5], [hx, GY + 16, hz + 7.5], 0.5, '#ffe2a0', MT.night);
  }
  K.reserve(-1, X(840), X(1160), RW3, RW3 + 60); K.mark('Boathouse Row', X(1000));
  /* Lemon Hill behind it */
  B.taper(X(1000), -(RW3 + 110), GY, 260, 110, GY + 16, 150, 50, '#5f8552');
  for (let i = 0; i < 46; i++) K.tree(X(820) + rng() * 290, -(RW3 + 46 + rng() * 110), pick(rng, K.S.trees), rf(rng, 1.2, 1.9));
  B.block(X(990), -(RW3 + 112), 14, 10, GY + 16, GY + 24, '#ead9a0', MT.windows, '#6a5a4c');
  /* Fairmount Water Works on its terrace */
  x = X(1507);
  B.box(x - 54, 0, -(RW3 + 26), x + 54, GY + 3.5, -RW3 + 1.5, '#cdc4b2', 0, '#ddd6c6');
  const temple = (tx, tz, w, d, h) => { B.block(tx, tz, w, d, GY + 3.5, GY + 3.5 + h, '#efe9dc', 0, '#cfc7b6'); B.gable(tx, tz, w + 1, d + 1, GY + 3.5 + h, w * 0.22, '#8d8f8a', 0, false); for (let i = -1; i <= 1; i++) B.block(tx + i * w * 0.3, tz + d / 2 + 0.4, 1, 1, GY + 3.5, GY + 3.5 + h, '#f7f3ea'); };
  temple(x - 40, -(RW3 + 12), 18, 12, 9); temple(x + 36, -(RW3 + 12), 11, 9, 8);
  B.block(x - 2, -(RW3 + 10), 52, 9, GY + 3.5, GY + 8.5, '#efe9dc', 0, '#d9d2c2'); temple(x - 22, -(RW3 + 10), 8, 7, 10.5); temple(x + 18, -(RW3 + 10), 8, 7, 10.5);
  B.cyl(x + 50, -(RW3 + 6), GY + 3.5, 3.4, GY + 8.5, 3.4, 8, '#efe9dc'); B.cyl(x + 50, -(RW3 + 6), GY + 8.5, 4.2, GY + 11, 0.5, 8, '#8d8f8a');
  /* the Art Museum on Fairmount, above the Water Works */
  x = X(1446); z = -(RW3 + 78);
  B.taper(x, z, GY, 190, 92, GY + 15, 150, 62, '#5f8552');
  const tan = '#e0c38c', roof = '#5d8d97';
  B.block(x, z - 4, 96, 26, GY + 15, GY + 39, tan, 0, roof);
  B.block(x, z + 12, 30, 14, GY + 15, GY + 41, tan); B.gable(x, z + 12, 31, 15, GY + 41, 7, roof, 0, true);
  for (let i = -3; i <= 3; i++) B.block(x + i * 4, z + 19.6, 1.5, 1.5, GY + 15, GY + 40, '#f0e2bf');
  for (const a of [-44, 44]) { B.block(x + a, z + 10, 20, 34, GY + 15, GY + 36, tan); B.gable(x + a, z + 10, 21, 35, GY + 36, 6, roof, 0, true); for (let i = -1; i <= 1; i++) B.block(x + a + i * 5.4, z + 27.4, 1.5, 1.5, GY + 15, GY + 35, '#f0e2bf'); }
  K.reserve(-1, x - 100, x + 100, RW3 + 26, RW3 + 140); K.reserve(-1, X(1436) - 4, X(1580) + 4, RW3, RW3 + 28); K.mark('the Art Museum', x);
  /* the Philadelphian */
  B.block(X(1330), -(RW3 + 150), 70, 16, GY, GY + 38, '#cdbb9c', MT.windows, '#a8977b'); K.reserve(-1, X(1330) - 40, X(1330) + 40, RW3 + 138, RW3 + 164);
  /* East Park woods north of Spring Garden */
  for (let i = 0; i < 110; i++) { const tx = rng() * X(1690), tz = RW3 + 12 + rng() * 170; if (K.free(-1, tx - 3, tx + 3, tz - 3, tz + 3)) K.tree(tx, -tz, pick(rng, K.S.trees), rf(rng, 1, 1.7)); }
  /* Park Towne Place */
  for (const m of [2012, 2054, 2100, 2142]) B.block(X(m), Z(400), 24, 12, GY, GY + 36, '#cfccc4', MT.windows, '#8f8d88');
  K.reserve(-1, X(2000) - 6, X(2150) + 6, RW3 + 60, RW3 + 84);
  /* Cathedral dome on Logan Square */
  x = X(2353); z = Z(980);
  B.block(x, z, 26, 34, GY, GY + 22, '#9c7a66', 0, '#7d5f50'); B.cyl(x, z - 6, GY + 22, 7, GY + 30, 7, 10, '#9c7a66'); dome3(B, x, z - 6, GY + 30, 7.4, '#6fa590', 10);
  K.reserve(-1, x - 16, x + 16, -z - 20, -z + 20);
  /* the skyline, each tower at its own street and depth */
  const tower = (m, d, w, dd, h, col, top) => { const tx = X(m), tz = Z(d); B.block(tx, tz, w, dd, GY, GY + h * H, col, MT.windows, top || shade3(col, 0.7)); K.reserve(-1, tx - w / 2 - 2, tx + w / 2 + 2, -tz - dd / 2 - 2, -tz + dd / 2 + 2); return [tx, tz]; };
  /* Three Logan Square */
  [x, z] = tower(2592, 985, 30, 26, 170, '#a4604e'); B.block(x, z, 22, 20, GY + 170 * H, GY + 205 * H, '#a4604e', MT.windows); B.block(x, z, 12, 12, GY + 205 * H, GY + 225 * H, '#a4604e', MT.windows);
  /* Comcast Center */
  [x, z] = tower(2656, 1056, 26, 34, 297, '#93b3cb', '#c4dbec'); B.block(x, z + 17.2, 8, 0.6, GY + 252 * H, GY + 290 * H, '#3d5673');
  K.mark('the Comcast Center', x);
  /* Comcast Technology Center, with its lantern */
  [x, z] = tower(2662, 875, 26, 30, 264, '#4d6480'); B.block(x - 4, z, 18, 26, GY + 264 * H, GY + 296 * H, '#4d6480', MT.windows); B.block(x - 8, z, 8, 14, GY + 296 * H, GY + 342 * H, '#eef3f7', MT.night);
  B.block(x - 8, z, 1.6, 1.6, GY + 342 * H, GY + 352 * H, '#d9e2ea'); K.mark('the Comcast Technology Center', x);
  /* BNY Mellon Center */
  [x, z] = tower(2800, 970, 30, 30, 196, '#b9b3a6'); B.taper(x, z, GY + 196 * H, 24, 24, GY + 236 * H, 1, 1, '#e9ecee'); B.block(x, z, 1, 1, GY + 236 * H, GY + 248 * H, '#e9ecee');
  /* Independence Blue Cross */
  tower(2800, 770, 30, 24, 191, '#4f7fb5');
  /* Commerce Square */
  for (const d of [540, 640]) { [x, z] = tower(2766, d, 28, 12, 158, '#9a9aa3'); B.taper(x, z, GY + 158 * H, 20, 10, GY + 172 * H, 6, 6, '#84848e'); }
  /* Murano and PECO, near the river north of Market */
  tower(2812, 392, 22, 16, 145, '#5d90c4');
  [x, z] = tower(2800, 150, 34, 16, 98, '#2f3a4c', '#232c3b'); B.block(x, z, 34.6, 16.6, GY + 91 * H, GY + 97 * H, '#ffd15a', MT.night);
  K.mark('the PECO Building', x);
  /* City Hall, on the Market Street axis */
  x = X(2846); z = Z(1490);
  B.block(x, z, 66, 60, GY, GY + 26, '#d8cdb8', MT.windows, '#8f8a80');
  for (const a of [-27, 27]) for (const b of [-24, 24]) { B.block(x + a, z + b, 13, 13, GY + 26, GY + 36, '#d8cdb8', MT.windows); B.taper(x + a, z + b, GY + 36, 13, 13, GY + 45, 3, 3, '#6f7a86'); }
  B.block(x, z + 20, 17, 17, GY + 26, GY + 92, '#e0d6c2', MT.windows); B.block(x, z + 20, 20, 20, GY + 92, GY + 105, '#e0d6c2');
  for (const a of [[0, 10.1], [0, -10.1], [10.1, 0], [-10.1, 0]]) B.block(x + a[0], z + 20 + a[1], a[0] ? 0.5 : 9, a[0] ? 9 : 0.5, GY + 94, GY + 103, '#fff3c4', MT.night);
  B.cyl(x, z + 20, GY + 105, 9.5, GY + 117, 5.5, 8, '#56627a'); B.cyl(x, z + 20, GY + 117, 5, GY + 125, 2.2, 8, '#56627a');
  B.block(x, z + 20, 2.4, 2.4, GY + 125, GY + 133, '#5d5140'); B.block(x, z + 20, 3.4, 3.4, GY + 133, GY + 134, '#4a4743');
  K.reserve(-1, x - 38, x + 38, -z - 34, -z + 34); K.mark('City Hall', x);
  /* keep Market Street open from the bridge to City Hall */
  K.reserve(-1, x - 7, x + 7, RW3, -z);
  /* One and Two Liberty Place */
  [x, z] = tower(2893, 1110, 28, 28, 190, '#5f83ad');
  for (let i = 0; i < 3; i++) B.taper(x, z, GY + (190 + i * 22) * H, 28 - i * 7, 28 - i * 7, GY + (212 + i * 22) * H, 20 - i * 7, 20 - i * 7, '#6f96c4', MT.windows);
  B.taper(x, z, GY + 250 * H, 5, 5, GY + 288 * H, 0.2, 0.2, '#c9d6e3');
  [x, z] = tower(2971, 1180, 28, 28, 190, '#557aa8');
  for (let i = 0; i < 2; i++) B.taper(x, z, GY + (190 + i * 24) * H, 28 - i * 9, 28 - i * 9, GY + (214 + i * 24) * H, 19 - i * 9, 19 - i * 9, '#6a8fbd', MT.windows);
  B.taper(x, z, GY + 238 * H, 4, 4, GY + 258 * H, 0.2, 0.2, '#c9d6e3'); K.mark('Liberty Place', x - 30);
  /* 2400 Chestnut, the Laurel, One Riverside */
  tower(3062, 150, 30, 16, 100, '#e9e6de', '#c4c0b6'); tower(3267, 750, 18, 18, 184, '#a9bccb'); tower(3300, 120, 18, 18, 78, '#6f9cc9');
  /* West Philadelphia, on the near bank: 30th Street Station, Cira Centre, FMC Tower */
  x = X(2790); z = RW3 + 70;
  B.block(x, z, 110, 60, GY, GY + 30, '#d9cdb4', MT.windows, '#a79b84');
  for (let i = -4; i <= 4; i++) B.block(x + i * 5, z - 31.5, 2, 2, GY + 3, GY + 27, '#ebe2cf');
  B.block(x, z - 31, 48, 3, GY + 27, GY + 31, '#e3d9c4'); K.reserve(1, x - 60, x + 60, RW3 + 30, RW3 + 110); K.mark('30th Street Station', x);
  x = X(2610); z = RW3 + 60;
  B.taper(x, z, GY, 30, 26, GY + 133 * H, 24, 14, '#a9c4d9', MT.glass); K.reserve(1, x - 18, x + 18, RW3 + 44, RW3 + 76); K.mark('the Cira Centre', x);
  x = X(3180); z = RW3 + 52;
  B.block(x, z, 30, 26, GY, GY + 150 * H, '#8fa9bd', MT.windows, '#7189a0'); B.block(x + 3, z, 22, 22, GY + 150 * H, GY + 222 * H, '#9db6c9', MT.windows); K.reserve(1, x - 18, x + 18, RW3 + 36, RW3 + 68); K.mark('the FMC Tower', x);
  /* West Fairmount Park north of Spring Garden on the near bank */
  for (let i = 0; i < 80; i++) K.tree(rng() * X(1650), RW3 + 14 + rng() * 150, pick(rng, K.S.trees), rf(rng, 1, 1.7));
  K.boat(X(1000), -60, 'sail'); K.boat(X(2400), 70, 'tug'); K.boat(X(3500), -80, 'sail'); K.boat(X(1900), 40, 'barge');
}

STYLE3.philadelphia = {
  gen: city3Philadelphia, seed: 1776, synced: true, hero: 1560,
  pal: ['#d9c7a3', '#b9785a', '#8fa3b8', '#c9b08a', '#a8553f', '#7f93a8', '#e3d6b8'], quay: '#a89a86', quayTop: '#c2b6a0', ground: '#77806a', trees: ['#5f8f52', '#6f9a5a', '#c98a3a', '#d9a23f'],
  rows: [
    /* Center City: low by the river, rising inland, from Vine Street to South Street */
    { side: -1, x0: 1140, x1: 1890, z: 20, h: [12, 30], w: [16, 30], d: [16, 24], gap: [2, 9] },
    { side: -1, x0: 1890, x1: 2400, z: 20, h: [8, 12], w: [10, 16], d: [14, 20], gap: [0.5, 3] },
    { side: -1, x0: 1140, x1: 2340, z: 62, h: [26, 60], w: [18, 34], d: [20, 30], gap: [2, 7], tall: 0.14, tallH: [70, 100] },
    { side: -1, x0: 1300, x1: 2100, z: 112, h: [40, 90], w: [22, 36], d: [22, 32], gap: [3, 10], tall: 0.16, tallH: [90, 120] },
    { side: -1, x0: 1380, x1: 2000, z: 232, h: [40, 100], w: [26, 44], d: [26, 36], gap: [10, 30] },
    { side: -1, x0: 720, x1: 1140, z: 30, h: [8, 16], w: [14, 24], d: [14, 20], gap: [6, 20] },
    /* University City on the near bank */
    { side: 1, x0: 1280, x1: 2400, z: 100, h: [20, 60], w: [20, 36], d: [20, 30], gap: [4, 14], tall: 0.1, tallH: [70, 100] },
    { side: 1, x0: 1700, x1: 2400, z: 28, h: [10, 24], w: [18, 30], d: [16, 22], gap: [6, 18] },
  ],
};
