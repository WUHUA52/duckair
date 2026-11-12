/* ---------- New York City ----------
   The same flight as the side view: north up the East River from the Battery
   to the Queensboro Bridge. x = routePx * 2400 / 4096, with the same piecewise
   metres -> route px mapping as city-nyc.js (Lower Manhattan and Midtown East
   at full scale, the Lower East Side to Kips Bay squeezed). The far bank (-z)
   is Manhattan; the near bank (+z) is Brooklyn and Queens: DUMBO, the Navy
   Yard, Domino, Williamsburg, Greenpoint, Newtown Creek, Long Island City,
   and Roosevelt Island in the river under the Queensboro. Depth inland is
   compressed (0.12 per metre); heights are 0.45 per metre. */
function city3NewYork(B, rng, K) {
  const KH = 0.69, MB = 2320, MC = 7140, RB = (MB + 40) * KH, KC = (4096 - 2 * RB) / (MC - MB), RC = RB + (MC - MB) * KC;
  const rp = m => m <= MB ? (m + 40) * KH : m <= MC ? RB + (m - MB) * KC : RC + (m - MC) * KH;
  const X = m => rp(m) * 2400 / 4096, Z = d => -(RW3 + 16 + d * 0.12), ZN = d => RW3 + 16 + d * 0.12, H = 0.45;
  let x, z;
  const tower = (m, d, w, dd, h, col, top, mat) => { const tx = X(m), tz = Z(d); B.block(tx, tz, w, dd, GY, GY + h * H, col, mat == null ? MT.windows : mat, top || shade3(col, 0.7)); K.reserve(-1, tx - w / 2 - 2, tx + w / 2 + 2, -tz - dd / 2 - 2, -tz + dd / 2 + 2); return [tx, tz]; };
  const near = (m, d, w, dd, h, col, top) => { const tx = X(m), tz = ZN(d); B.block(tx, tz, w, dd, GY, GY + h * H, col, MT.windows, top || shade3(col, 0.7)); K.reserve(1, tx - w / 2 - 2, tx + w / 2 + 2, tz - dd / 2 - 2, tz + dd / 2 + 2); return [tx, tz]; };

  /* ---- the bridges, south to north ---- */
  K.susp(X(1588), { col: '#c8b89c', colD: '#a3937a', towerH: 66, deckY: 24, towerZ: 118, style: 'stone', w: 18, cable: '#e6dcc8', cableT: 0.9 }); K.mark('the Brooklyn Bridge', X(1588));
  K.susp(X(2245), { col: '#7f97b2', colD: '#5f7690', towerH: 74, deckY: 24, towerZ: 132, style: 'steel', w: 20, cable: '#a5bad0' }); K.mark('the Manhattan Bridge', X(2245));
  K.susp(X(3727), { col: '#8d9299', colD: '#686d75', towerH: 75, deckY: 24, towerZ: 136, style: 'steel', w: 20, cable: '#9aa0a8' }); K.mark('the Williamsburg Bridge', X(3727));
  /* Queensboro: a cantilever truss on stone piers, over Roosevelt Island */
  {
    x = X(9247); const W = 16, dy = 24, col = '#9a9488', cd = '#746f66', piers = [-RW3 + 4, 58, RW3 + 6];
    B.box(x - W / 2, dy - 2.6, -RW3 - 14, x + W / 2, dy, RW3 + 14, '#676c78', 0, '#4c505b');
    const top = zz => { let best = 1e9; for (const p of piers) best = Math.min(best, Math.abs(zz - p)); return dy + 6 + 30 * Math.exp(-(best * best) / (2 * 34 * 34)); };
    for (const s of [-1, 1]) {
      const cx = x + s * W / 2;
      let pz = -RW3 - 14, py = top(pz), k = 0;
      for (let zz = pz + 8; zz <= RW3 + 14; zz += 8, k++) {
        const yy = top(zz);
        B.beam([cx, py, pz], [cx, yy, zz], 0.9, col, MT.night);
        B.beam([cx, dy, pz], [cx, dy, zz], 0.9, cd);
        B.beam(k & 1 ? [cx, dy, pz] : [cx, py, pz], k & 1 ? [cx, yy, zz] : [cx, dy, zz], 0.6, cd);
        B.box(cx - 0.3, dy, zz - 0.3, cx + 0.3, yy, zz + 0.3, cd);
        py = yy; pz = zz;
      }
    }
    for (const p of piers) {
      B.box(x - W / 2 - 4, 0, p - 7, x + W / 2 + 4, dy - 2.6, p + 7, '#b6aa94');
      for (const s of [-1, 1]) { B.block(x + s * W / 2, p, 2.4, 2.4, dy, dy + 38, col); B.taper(x + s * W / 2, p, dy + 38, 2.4, 2.4, dy + 46, 0.2, 0.2, col); B.block(x + s * W / 2, p, 1.2, 1.2, dy + 46, dy + 47, '#ffe2b0', MT.night); }
      B.box(x - W / 2, dy + 30, p - 1, x + W / 2, dy + 32, p + 1, cd);
    }
    for (const s of [-1, 1]) K.reserve(s, x - W / 2 - 14, x + W / 2 + 14, RW3, RW3 + 96);
    /* the Roosevelt Island Tram alongside, with its red cabin */
    const tx = x + 22;
    B.taper(tx, -RW3 - 10, GY, 5, 5, GY + 52, 2, 2, '#9aa2ab'); B.taper(tx, 30, 0, 5, 5, 46, 2, 2, '#9aa2ab');
    B.beam([tx, GY + 51, -RW3 - 10], [tx, 45, 30], 0.35, '#4a4f57');
    B.block(tx, -40, 6, 9, 38, 43, '#c63f35', MT.windows);
    K.mark('the Queensboro Bridge', x);
  }

  /* ---- Lower Manhattan (far bank) ---- */
  /* Battery Maritime Building, green cast iron over three slips */
  x = X(180); B.block(x, -(RW3 + 12), 46, 20, GY, GY + 18, '#5f8f7a', MT.windows, '#7b8a85'); B.block(x, -(RW3 + 12), 12, 10, GY + 18, GY + 22, '#7b8a85');
  K.reserve(-1, x - 26, x + 26, RW3, RW3 + 26); K.mark('the Battery Maritime Building', x);
  /* 55 Water, 120 Wall, 70 Pine, 40 Wall, 28 Liberty */
  tower(553, 185, 34, 22, 209, '#5a4f48', '#463d37'); tower(600, 160, 20, 16, 60, '#5a4f48');
  [x, z] = tower(887, 141, 30, 30, 50, '#d2bc96'); B.block(x, z, 22, 22, GY + 50 * H, GY + 80 * H, '#d2bc96', MT.windows); B.block(x, z, 14, 14, GY + 80 * H, GY + 122 * H, '#d2bc96', MT.windows);
  K.mark('120 Wall Street', x);
  [x, z] = tower(884, 340, 22, 22, 200, '#c9b394'); B.block(x, z, 14, 14, GY + 200 * H, GY + 240 * H, '#c9b394', MT.windows); B.block(x, z, 6, 6, GY + 240 * H, GY + 255 * H, '#e9eef2', MT.night); B.taper(x, z, GY + 255 * H, 2, 2, GY + 290 * H, 0.2, 0.2, '#d7d7cf');
  K.mark('70 Pine Street', x);
  [x, z] = tower(774, 500, 24, 24, 232, '#c8b896'); B.taper(x, z, GY + 232 * H, 16, 16, GY + 265 * H, 0.5, 0.5, '#6fa792', MT.night); B.block(x, z, 1, 1, GY + 265 * H, GY + 283 * H, '#6fa792');
  K.mark('40 Wall Street', x);
  tower(888, 533, 30, 24, 248, '#c5ccd2', '#9aa2aa');
  /* One World Trade Center: square base, tapering faceted shaft, mast */
  x = X(960); z = Z(1223);
  B.block(x, z, 30, 30, GY, GY + 57 * H, '#a9b8c8', MT.windows);
  B.taper(x, z, GY + 57 * H, 30, 30, GY + 417 * H, 21, 21, '#86a8cb', MT.glass, 0, 0, '#b3cbe2');
  B.block(x, z, 14, 14, GY + 417 * H, GY + 425 * H, '#a9b8c8'); B.taper(x, z, GY + 425 * H, 2.2, 2.2, GY + 541 * H, 0.4, 0.4, '#e0e4e9', MT.night);
  K.reserve(-1, x - 20, x + 20, -z - 20, -z + 20); K.mark('One World Trade Center', x);
  tower(1010, 1150, 26, 26, 329, '#5f82aa', 0, MT.glass);
  /* the Seaport: Pier 17 and the tall ships */
  x = X(1139); B.box(x - 32, 0, -RW3 + 30, x + 32, GY + 0.5, -RW3, '#a9a59c'); B.block(x, -RW3 + 15, 52, 22, GY + 0.5, GY + 12, '#9fb8c7', MT.glass, '#f1e8d0');
  for (const [m, n] of [[1030, 4], [1085, 3]]) { const sx = X(m); B.taper(sx, -RW3 + 10, 0.3, 40, 7, 3, 44, 8, '#2b2e36'); for (let i = 0; i < n; i++) B.block(sx - 14 + i * 9, -RW3 + 10, 0.8, 0.8, 3, 30, '#5a4636'); }
  K.mark('the South Street Seaport', x);
  /* Woolworth, 8 Spruce, the Municipal Building */
  [x, z] = tower(1327, 861, 40, 30, 118, '#e3dccb'); B.block(x, z, 18, 18, GY + 118 * H, GY + 220 * H, '#e3dccb', MT.windows); B.taper(x, z, GY + 220 * H, 14, 14, GY + 241 * H, 0.5, 0.5, '#78a58f', MT.night);
  K.mark('the Woolworth Building', x);
  [x, z] = tower(1352, 605, 26, 24, 265, '#c9ced3', '#a9b0b8'); K.mark('8 Spruce Street', x);
  [x, z] = tower(1610, 696, 60, 30, 135, '#ddd3bd'); B.block(x, z, 18, 14, GY + 135 * H, GY + 155 * H, '#ddd3bd', MT.windows); B.cyl(x, z, GY + 155 * H, 5, GY + 170 * H, 3, 8, '#ddd3bd'); B.block(x, z, 1.4, 1.4, GY + 170 * H, GY + 177 * H, '#d9b14a', MT.night);
  K.mark('the Municipal Building', x);
  /* One Manhattan Square at the Manhattan Bridge */
  [x, z] = tower(2290, 80, 30, 22, 247, '#3f5672', '#30435a'); K.mark('One Manhattan Square', x);
  /* the Lower East Side housing slabs */
  for (const m of [2400, 2560, 2900, 3150, 3450, 3900, 4250, 4600]) tower(m, 220 + rng() * 200, 22, 12, 60, '#9a5845', '#6e3e31');
  /* Con Edison East River station */
  x = X(5389); z = Z(173); B.block(x, z, 44, 26, GY, GY + 30 * H * 1.6, '#8d5242', MT.windows, '#6d3d31');
  for (const dx of [-12, 0, 12]) { B.cyl(x + dx, z, GY, 2.6, GY + 125 * H, 2.2, 8, '#bfb7aa'); B.cyl(x + dx, z, GY + 115 * H, 2.4, GY + 125 * H, 2.3, 8, '#c0453a'); }
  K.reserve(-1, x - 26, x + 26, -z - 16, -z + 16); K.mark('the Con Edison station', x);
  /* Stuyvesant Town and Peter Cooper Village: brick slabs */
  for (let m = 5560; m < 6300; m += 60) for (const d of [300, 420]) tower(m, d, 10, 14, 40, '#8a4c3c', '#6e3e31');
  K.mark('Stuyvesant Town', X(5930));
  /* Waterside Plaza on its deck, Bellevue, Kips Bay */
  x = X(6423); B.box(x - 24, 0, -RW3 + 6, x + 24, GY + 1, -RW3 - 20, '#8f8a84');
  for (const [dx, h] of [[-15, 120], [-5, 130], [5, 130], [15, 100]]) B.cyl(x + dx, -(RW3 + 4), GY + 1, 4.2, GY + h * H, 4.2, 8, '#6d4a3c', MT.windows);
  K.reserve(-1, x - 26, x + 26, RW3 - 6, RW3 + 22); K.mark('Waterside Plaza', x);
  tower(6610, 273, 40, 30, 100, '#c7b28f'); K.mark('Bellevue', X(6610));
  tower(6700, 377, 34, 10, 65, '#d5d0c4'); tower(6990, 377, 34, 10, 65, '#d5d0c4');

  /* ---- Midtown East (far bank) ---- */
  /* American Copper Buildings, leaning apart, with their skybridge */
  x = X(7213); z = Z(89);
  B.taper(x - 7, z, GY, 10, 14, GY + 165 * H, 10, 14, '#b0704a', MT.windows, -3, 0); B.taper(x + 7, z, GY, 10, 14, GY + 140 * H, 10, 14, '#b0704a', MT.windows, 3, 0);
  B.block(x, z, 6, 6, GY + 95 * H, GY + 104 * H, '#9fc0d6', MT.night); K.reserve(-1, x - 16, x + 16, -z - 10, -z + 10); K.mark('the American Copper Buildings', x);
  /* Empire State Building */
  x = X(7375); z = Z(1299);
  B.block(x, z, 48, 30, GY, GY + 25 * H, '#cfc6b2', MT.windows); B.block(x, z, 30, 22, GY + 25 * H, GY + 80 * H, '#cfc6b2', MT.windows);
  B.block(x, z, 22, 16, GY + 80 * H, GY + 320 * H, '#cfc6b2', MT.windows); B.block(x, z, 14, 10, GY + 320 * H, GY + 335 * H, '#d9d0bc', MT.night);
  B.cyl(x, z, GY + 335 * H, 4, GY + 381 * H, 2.4, 8, '#e3ddcd', MT.night); B.taper(x, z, GY + 381 * H, 1.2, 1.2, GY + 443 * H, 0.2, 0.2, '#9aa0a8');
  K.reserve(-1, x - 26, x + 26, -z - 18, -z + 18); K.mark('the Empire State Building', x);
  /* One Vanderbilt, Chrysler, MetLife, Tudor City */
  [x, z] = tower(7604, 1006, 26, 26, 330, '#b9c3c9'); B.taper(x, z, GY + 330 * H, 26, 26, GY + 400 * H, 6, 6, '#b9c3c9', MT.glass); B.block(x, z, 1, 1, GY + 400 * H, GY + 427 * H, '#d8cfc2');
  [x, z] = tower(7651, 701, 22, 22, 240, '#d7d3cb');
  for (let i = 0; i < 5; i++) B.taper(x, z, GY + (240 + i * 9) * H, 18 - i * 3.2, 18 - i * 3.2, GY + (249 + i * 9) * H, 15 - i * 3.2, 15 - i * 3.2, '#d6dce2', MT.night);
  B.taper(x, z, GY + 285 * H, 2.4, 2.4, GY + 319 * H, 0.2, 0.2, '#e3e8ee', MT.night); K.mark('the Chrysler Building', x);
  tower(7726, 905, 46, 18, 246, '#b9b8b0');
  [x, z] = tower(7733, 188, 40, 20, 85, '#9d6450', '#7c4c3c'); B.block(x, z + 6, 26, 1, GY + 85 * H, GY + 85 * H + 4, '#d8473a', MT.night); K.mark('Tudor City', x);
  /* the United Nations: Secretariat, General Assembly, Conference Building */
  x = X(7825); z = Z(67);
  B.block(x, z, 42, 12, GY, GY + 154 * H, '#5f9a8c', MT.glass, '#2f3a3c'); B.block(x - 21.4, z, 1, 12.4, GY, GY + 154 * H, '#e6e3da'); B.block(x + 21.4, z, 1, 12.4, GY, GY + 154 * H, '#e6e3da');
  B.block(x + 20, -(RW3 + 8), 60, 8, GY, GY + 10, '#c6c7c4', MT.windows);
  B.block(X(7930), z - 8, 38, 24, GY, GY + 12, '#e8e4d8'); dome3(B, X(7930), z - 8, GY + 12, 7, '#c9c3b2', 10);
  K.reserve(-1, x - 26, X(7930) + 24, RW3, -z + 26); K.mark('the United Nations', x);
  tower(7880, 201, 18, 18, 154, '#5f8d8a', 0, MT.glass);
  [x, z] = tower(8095, 235, 20, 12, 262, '#4a4238', '#38322b');
  /* 270 Park, Citigroup, 432 Park, 731 Lexington, Billionaires' Row */
  [x, z] = tower(7995, 1040, 30, 26, 340, '#a8b5c0'); B.block(x, z, 18, 16, GY + 340 * H, GY + 388 * H, '#a8b5c0', MT.windows);
  [x, z] = tower(8517, 831, 24, 24, 220, '#cfd4da');
  B.tri([x - 12, GY + 220 * H, z - 12], [x - 12, GY + 220 * H, z + 12], [x + 12, GY + 279 * H, z + 12], '#e3e8ee', MT.night);
  B.tri([x - 12, GY + 220 * H, z - 12], [x + 12, GY + 279 * H, z + 12], [x + 12, GY + 279 * H, z - 12], '#e3e8ee', MT.night);
  B.tri([x + 12, GY + 220 * H, z + 12], [x + 12, GY + 279 * H, z + 12], [x - 12, GY + 220 * H, z + 12], '#cfd4da');
  B.tri([x + 12, GY + 220 * H, z - 12], [x - 12, GY + 220 * H, z - 12], [x + 12, GY + 279 * H, z - 12], '#cfd4da');
  B.tri([x + 12, GY + 220 * H, z - 12], [x + 12, GY + 279 * H, z - 12], [x + 12, GY + 279 * H, z + 12], '#cfd4da'); B.tri([x + 12, GY + 220 * H, z - 12], [x + 12, GY + 279 * H, z + 12], [x + 12, GY + 220 * H, z + 12], '#cfd4da');
  K.mark('the Citigroup Center', x);
  [x, z] = tower(8701, 1148, 14, 14, 426, '#e8e5de'); K.mark('432 Park Avenue', x);
  tower(9039, 865, 24, 20, 246, '#6f8fae');
  tower(8890, 1732, 8, 12, 435, '#b9a58c'); tower(8950, 1800, 16, 16, 306, '#6d8fb8'); tower(9010, 2063, 14, 14, 472, '#c8d3dc');
  K.mark("Billionaires' Row", X(8950));
  /* the FDR Drive along the far bank, elevated in Lower Manhattan and Sutton Place */
  for (const [a, b] of [[140, 1530], [1650, 2190], [8150, 9200]]) {
    const x0 = X(a), x1 = X(b);
    B.box(x0, GY + 7, -(RW3 + 14), x1, GY + 9, -(RW3 + 24), '#a9a59c', 0, '#55585f');
    for (let xx = x0 + 4; xx < x1; xx += 14) B.box(xx, GY, -(RW3 + 20), xx + 1.4, GY + 7, -(RW3 + 18), '#2c2d33');
  }
  /* Battery Park and the Carl Schurz end: trees across the seam */
  for (let i = 0; i < 70; i++) { const tx = rng() < 0.5 ? rng() * 26 : 2330 + rng() * 70, tz = RW3 + 10 + rng() * 120; if (K.free(-1, tx - 3, tx + 3, tz - 3, tz + 3)) K.tree(tx, -tz, pick(rng, K.S.trees), rf(rng, 1, 1.6)); }
  K.reserve(-1, 0, 26, RW3, RW3 + 140); K.reserve(-1, 2330, 2400, RW3, RW3 + 140);
  /* East River Park */
  for (let i = 0; i < 60; i++) { const tx = X(2400) + rng() * (X(5200) - X(2400)), tz = RW3 + 10 + rng() * 22; if (K.free(-1, tx - 3, tx + 3, tz - 3, tz + 3)) K.tree(tx, -tz, pick(rng, K.S.trees), rf(rng, 1, 1.5)); }
  K.reserve(-1, X(2400), X(5200), RW3, RW3 + 34);

  /* ---- Brooklyn and Queens (near bank, +z) ---- */
  /* Brooklyn Bridge Park piers and the DUMBO warehouses */
  for (let m = 1150; m < 2150; m += 140) K.zbox(X(m) - 18, 0, RW3 - 26, X(m) + 18, GY + 0.5, RW3, '#8f8a84', 0, '#7aa65e');
  for (const m of [1700, 1850, 2000, 2150, 2300, 2450]) near(m, 120 + rng() * 120, 26, 22, 30 + rng() * 25, '#9a5845');
  near(2120, 260, 18, 18, 60, '#a9643f'); K.mark('DUMBO', X(1950));
  /* Brooklyn Navy Yard: dry docks, sheds and a gantry crane */
  x = X(3300); B.block(x, ZN(140), 60, 30, GY, GY + 10, '#7d7f84', MT.windows); B.block(x + 40, ZN(90), 30, 18, GY, GY + 8, '#8a4f3f', MT.windows);
  B.block(x - 30, ZN(40), 3, 3, GY, GY + 34, '#c0453a'); B.block(x - 22, ZN(40), 20, 3, GY + 32, GY + 35, '#c0453a'); K.reserve(1, x - 40, x + 60, RW3, RW3 + 170); K.mark('the Brooklyn Navy Yard', x);
  /* Domino Sugar Refinery with its sign, and the new Williamsburg towers */
  x = X(4031); B.block(x, ZN(60), 30, 26, GY, GY + 34, '#9b6a4f', MT.windows, '#6d4a37'); B.block(x + 8, ZN(60), 6, 6, GY + 34, GY + 48, '#9b6a4f');
  B.block(x, ZN(60) - 13.4, 24, 0.6, GY + 36, GY + 40, '#ffd34a', MT.night); B.block(x, ZN(60) - 13.6, 24, 0.4, GY + 41, GY + 42.6, '#ffd34a', MT.night);
  K.reserve(1, x - 18, x + 18, RW3, RW3 + 86); K.mark('the Domino Sugar Refinery', x);
  for (const m of [4300, 4550, 4800]) near(m, 40, 20, 20, 150, '#7a93ad');
  /* Newtown Creek's silver digester eggs */
  x = X(6473);
  for (const dx of [-14, 0, 14]) for (const dz of [0, 16]) { const ez = ZN(300) + dz; B.cyl(x + dx, ez, GY, 4, GY + 10, 6, 10, '#c9ced4'); B.cyl(x + dx, ez, GY + 10, 6, GY + 22, 5.2, 10, '#d6dbe0'); B.cyl(x + dx, ez, GY + 22, 5.2, GY + 28, 0.4, 10, '#c9ced4'); }
  K.reserve(1, x - 24, x + 24, ZN(280), ZN(330)); K.mark('Newtown Creek', x);
  /* Long Island City: Gantry Plaza's cranes, the Pepsi-Cola sign, the new towers */
  x = X(7928);
  for (const dx of [-10, 10]) { B.block(x + dx, RW3 + 6, 3, 3, GY, GY + 22, '#3a3d44'); B.block(x + dx, RW3 + 14, 3, 3, GY, GY + 22, '#3a3d44'); B.box(x + dx - 2, GY + 22, RW3 - 4, x + dx + 2, GY + 25, RW3 + 16, '#3a3d44'); B.block(x + dx, RW3 + 10, 6, 4, GY + 25, GY + 29, '#3a3d44'); }
  K.reserve(1, x - 16, x + 16, RW3, RW3 + 24); K.mark('Gantry Plaza State Park', x);
  x = X(8203); B.box(x - 18, GY + 4, RW3 + 4, x + 18, GY + 13, RW3 + 5, '#e03a2e', MT.night); B.box(x - 18, GY, RW3 + 4.5, x - 17, GY + 4, RW3 + 5, '#3a3d44'); B.box(x + 17, GY, RW3 + 4.5, x + 18, GY + 4, RW3 + 5, '#3a3d44');
  K.reserve(1, x - 20, x + 20, RW3, RW3 + 10); K.mark('the Pepsi-Cola sign', x);
  for (const [m, d, h] of [[7700, 80, 140], [7850, 100, 150], [8050, 90, 120], [8400, 300, 200], [8622, 600, 200], [8700, 650, 160]]) near(m, d, 22, 22, h, pick(rng, ['#8fa9c4', '#c9c7c0', '#6f8fae', '#b8a58c']));
  /* Roosevelt Island in the river under the Queensboro */
  x = X(8462);
  B.box(x, 0, 30, 2398, GY - 1, 96, '#77806a', 0, '#7d8f6a');
  for (let i = 0; i < 40; i++) { const tx = x + 6 + rng() * (2390 - x - 12), tz = 38 + rng() * 52; if (Math.abs(tx - X(9247)) > 14) K.tree(tx, tz, pick(rng, K.S.trees), rf(rng, 0.9, 1.4)); }
  for (const tx of [x + 40, x + 90, X(9247) + 40]) B.block(tx, 62, 18, 14, GY - 1, GY + 30, '#b8a58c', MT.windows);
  K.mark('Roosevelt Island', x + 60);

  /* boats: NYC Ferry catamarans, a water taxi, tug and barge */
  const nycFerry = (bx2, bz) => { B.taper(bx2, bz, 0.3, 26, 9, 2.4, 30, 10, '#eeeae0', 0, 0, 0, '#d8d2c4'); B.block(bx2, bz, 28, 9, 2.4, 3.4, '#2f5c8a'); B.block(bx2 - 2, bz, 18, 7, 3.4, 7.4, '#f4efe2', MT.windows, '#3fa4b8'); };
  const taxi = (bx2, bz) => { B.taper(bx2, bz, 0.3, 16, 5, 2.4, 19, 6, '#f2c230', 0, 0, 0, '#c99a1a'); B.block(bx2 - 1, bz, 10, 4.4, 2.4, 5.6, '#f2c230', MT.windows, '#2d2b31'); };
  nycFerry(X(800), 70); nycFerry(X(7800), -60); taxi(X(1300), -90); taxi(X(3000), 40);
  K.boat(X(2600), 90, 'tug'); K.boat(X(2600) - 26, 90, 'barge'); K.boat(X(8500), -110, 'tug');
}
function nycBuilding(B, rng, S, cx, z, w, d, h, r) {
  basicBuilding(B, rng, S, cx, z, w, d, h);
  if (h < 80 && rng() < 0.4) {
    const tx = cx + rf(rng, -w * 0.25, w * 0.25), tz = z + rf(rng, -d * 0.2, d * 0.2), y = GY + h;
    for (const a of [-1, 1]) for (const b of [-1, 1]) B.block(tx + a, tz + b, 0.4, 0.4, y, y + 3, '#4a3a33');
    B.cyl(tx, tz, y + 3, 2.1, y + 6.4, 2.1, 6, '#7a5a44'); B.cyl(tx, tz, y + 6.4, 2.4, y + 8.2, 0.2, 6, '#5a4434');
  }
}

STYLE3.nyc = {
  gen: city3NewYork, seed: 1624, building: nycBuilding, synced: true, hero: 1700,
  pal: ['#b9a58c', '#8f6a55', '#7c8ea3', '#a39a8f', '#5f7389', '#c2b6a3', '#8a4f3f', '#9fb2c4', '#d9d8d2'], quay: '#8f8a84', quayTop: '#a8a39c', ground: '#6b6a70', trees: ['#5f8f52', '#6a9558', '#7fa364'],
  rows: [
    /* Manhattan: the Financial District, low through the Lower East Side, Midtown East */
    { side: -1, x0: 20, x1: 960, z: 36, h: [40, 90], w: [18, 30], d: [18, 26], gap: [1, 4], tall: 0.2, tallH: [100, 140] },
    { side: -1, x0: 20, x1: 960, z: 100, h: [70, 130], w: [20, 32], d: [20, 30], gap: [2, 6], tall: 0.25, tallH: [130, 170] },
    { side: -1, x0: 960, x1: 1446, z: 40, h: [14, 30], w: [16, 26], d: [16, 22], gap: [2, 6] },
    { side: -1, x0: 960, x1: 1446, z: 110, h: [12, 26], w: [16, 26], d: [16, 22], gap: [2, 8] },
    { side: -1, x0: 1446, x1: 2330, z: 36, h: [26, 60], w: [18, 30], d: [18, 26], gap: [1, 5], tall: 0.15, tallH: [70, 100] },
    { side: -1, x0: 1446, x1: 2330, z: 100, h: [50, 110], w: [20, 32], d: [20, 30], gap: [1, 5], tall: 0.25, tallH: [110, 160] },
    { side: -1, x0: 1446, x1: 2330, z: 190, h: [60, 140], w: [24, 40], d: [24, 36], gap: [4, 14] },
    /* Brooklyn and Queens: low warehouses and rowhouses, LIC rising */
    { side: 1, x0: 600, x1: 1300, z: 30, h: [10, 24], w: [18, 30], d: [16, 24], gap: [3, 10] },
    { side: 1, x0: 600, x1: 1700, z: 90, h: [8, 20], w: [16, 26], d: [16, 22], gap: [3, 12] },
    { side: 1, x0: 1300, x1: 1700, z: 30, h: [8, 16], w: [16, 26], d: [16, 22], gap: [4, 14] },
    { side: 1, x0: 10, x1: 600, z: 40, h: [12, 28], w: [16, 26], d: [16, 22], gap: [2, 8] },
    { side: 1, x0: 10, x1: 600, z: 100, h: [20, 50], w: [18, 30], d: [18, 26], gap: [3, 10], tall: 0.12, tallH: [60, 90] },
    { side: 1, x0: 2100, x1: 2390, z: 50, h: [10, 26], w: [18, 30], d: [16, 24], gap: [4, 14] },
    { side: 1, x0: 1700, x1: 2100, z: 50, h: [30, 80], w: [20, 30], d: [20, 28], gap: [6, 16], tall: 0.2, tallH: [90, 120] },
  ],
};
