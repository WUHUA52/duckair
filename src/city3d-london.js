/* ---------- London ----------
   The same stretch of the Thames as the side view: x = routePx * 2400 / 4096
   (see city-london.js: positions are map px, drawn at route = 180 + 0.9 * map). The far bank (-z) is the north
   bank (Westminster, the Embankment, the City); the near bank (+z) is the
   South Bank, which the side view never shows: Lambeth Palace, St Thomas',
   County Hall, the London Eye, the Royal Festival Hall, the National Theatre,
   the Oxo Tower, One Blackfriars, Tate Modern, the Globe, Southwark Cathedral,
   the Shard, HMS Belfast and City Hall. Depth inland is compressed (0.14 per
   metre); heights are 0.7 per metre. */
function city3London(B, rng, K) {
  const X = r => (180 + 0.9 * r) * 2400 / 4096, Zn = d => -(RW3 + 16 + d * 0.14), Zs = d => RW3 + 16 + d * 0.14, H = 0.7;
  let x, z;
  /* ---- bridges, west to east ---- */
  K.arch(X(465), { col: '#5c9474', deckY: 15, piers: 7, w: 16, lamps: true, rail: '#3b6c50', road: '#5d5a60' }); K.mark('Westminster Bridge', X(465));
  B.box(X(465) - 4, 15, -20, X(465), 20.6, -6, '#d8362b', MT.windows, '#b02a22'); B.box(X(465) + 1, 15, 40, X(465) + 5, 20.6, 54, '#d8362b', MT.windows, '#b02a22');
  K.arch(X(939), { col: '#5a524c', deckY: 16, piers: 5, w: 10, road: '#4b4d55' }); K.mark('Hungerford Bridge', X(939));
  for (const s of [-1, 1]) {
    const fx = X(939) + s * 8;
    B.box(fx - 1.5, 17, -RW3 - 10, fx + 1.5, 18, RW3 + 10, '#d9dde0');
    for (let zz = -RW3 + 30; zz < RW3; zz += 50) B.beam([fx, 17, zz], [fx + s * 4, 40, zz], 0.7, '#f1f3f4', MT.night);
  }
  K.arch(X(1276), { col: '#d8d6cf', deckY: 17, piers: 5, w: 15, lamps: true }); K.mark('Waterloo Bridge', X(1276));
  K.arch(X(2067), { col: '#b8433a', deckY: 15, piers: 5, w: 16, lamps: true, rail: '#e8e4dc' }); K.mark('Blackfriars Bridge', X(2067));
  for (let i = 1; i < 5; i++) B.box(X(2098) - 2, 0, -RW3 + i * 60 - 3, X(2098) + 2, 11, -RW3 + i * 60 + 3, '#b5463c');
  K.arch(X(2129), { col: '#3d4d6a', deckY: 15, piers: 5, w: 18, road: '#4b4d55' });
  B.box(X(2129) - 9, 15, -RW3 - 12, X(2129) + 9, 25, RW3 + 12, '#8fa3b5', MT.windows, '#3a4a58');
  for (let zz = -RW3; zz < RW3; zz += 12) B.box(X(2129) - 9, 25, zz, X(2129) + 9, 26.4, zz + 6, '#2f3a4a');
  /* the Millennium Bridge: a thin blade on Y piers */
  x = X(2385);
  B.box(x - 2, 11, -RW3 - 10, x + 2, 12, RW3 + 10, '#c9cfd4', 0, '#b8bec4');
  for (const zz of [-50, 50]) { B.box(x - 0.6, 0, zz - 0.6, x + 0.6, 7, zz + 0.6, '#aeb6bd'); B.beam([x, 7, zz], [x - 4, 11, zz], 0.6, '#aeb6bd'); B.beam([x, 7, zz], [x + 4, 11, zz], 0.6, '#aeb6bd'); }
  K.reserve(-1, x - 8, x + 8, RW3, RW3 + 50); K.reserve(1, x - 8, x + 8, RW3, RW3 + 30); K.mark('the Millennium Bridge', x);
  K.arch(X(2624), { col: '#4d7f62', deckY: 15, piers: 3, w: 13, lamps: true, rail: '#d9b23c' }); K.mark('Southwark Bridge', X(2624));
  K.arch(X(2856), { col: '#6a4a40', deckY: 14, piers: 5, w: 20, road: '#4b4d55' });
  K.arch(X(3029), { col: '#c7c4bc', deckY: 16, piers: 3, w: 20, lamps: true }); K.mark('London Bridge', X(3029));

  /* ---- Tower Bridge ---- */
  x = X(3851);
  {
    const st = '#d2c8b3', bl = '#5e98c8', roof = '#55606a';
    B.box(x - 8, 15.4, -RW3 - 14, x + 8, 18, RW3 + 14, '#676c78', 0, '#4c505b');
    B.box(x - 8.2, 18, -RW3 - 14, x - 7.4, 19.6, RW3 + 14, bl); B.box(x + 7.4, 18, -RW3 - 14, x + 8.2, 19.6, RW3 + 14, bl);
    for (const s of [-1, 1]) {
      const z0 = s * 40;
      B.box(x - 13, 0, z0 - 10, x + 13, 9, z0 + 10, '#8e877a');
      B.block(x, z0, 15, 15, 9, 66, st, MT.windows); B.taper(x, z0, 66, 12, 12, 80, 0.4, 0.4, roof);
      for (const a of [-7, 7]) for (const b of [-7, 7]) { B.block(x + a, z0 + b, 3.4, 3.4, 9, 70, st); B.taper(x + a, z0 + b, 70, 3.4, 3.4, 78, 0.2, 0.2, roof); }
      B.box(x - 4, 18, z0 - 7.6, x + 4, 30, z0 + 7.6, '#2f2a31');
      for (const a of [-7.4, 7.4]) {
        let py = 58, pz = z0 + s * 7.5; const ze = s * (RW3 + 4);
        for (let i = 1; i <= 6; i++) { const u = 1 - i / 6, zz = lerp(ze, z0 + s * 7.5, u), yy = 21 + 37 * u * u; B.beam([x + a, py, pz], [x + a, yy, zz], 1.2, bl, MT.night); if (i < 6) B.box(x + a - 0.25, 18, zz - 0.25, x + a + 0.25, yy, zz + 0.25, bl); py = yy; pz = zz; }
      }
      B.block(x, s * (RW3 + 4), 12, 9, GY, GY + 24, st, MT.windows); B.taper(x, s * (RW3 + 4), GY + 24, 12, 9, GY + 32, 0.4, 0.4, roof);
      K.reserve(s, x - 22, x + 22, RW3, RW3 + 40);
    }
    for (const yy of [46, 51]) B.box(x - 6, yy, -32, x + 6, yy + 3.4, 32, bl, MT.windows, '#e9eef2');
    K.mark('Tower Bridge', x);
  }

  /* ======== the north bank (-z), west to east ======== */
  /* the Palace of Westminster: Victoria Tower at the west end, the Elizabeth Tower at the bridge */
  {
    const st = '#d8be86', roof = '#4f5a62';
    x = X(320); z = Zn(30);
    B.block(x, z, 120, 30, GY, GY + 24, st, MT.windows, roof);
    for (let i = 0; i < 13; i++) { const px = X(222) + 4 + i * 9.4; B.block(px, z + 15.5, 1.6, 1.6, GY + 24, GY + 30, st); B.taper(px, z + 15.5, GY + 30, 1.6, 1.6, GY + 33, 0.2, 0.2, '#b8925a'); }
    for (const px of [X(226), X(320), X(416)]) { B.block(px, z + 12, 11, 8, GY, GY + 30, st); B.taper(px, z + 12, GY + 30, 11, 8, GY + 36, 4, 2, roof); }
    B.block(X(300), z - 8, 10, 10, GY + 24, GY + 42, st, MT.windows); B.taper(X(300), z - 8, GY + 42, 10, 10, GY + 64, 0.4, 0.4, '#c9a56a');
    x = X(208); z = Zn(60);
    B.block(x, z, 17, 17, GY, GY + 98 * H - 6, st, MT.windows, '#6f6a66');
    for (const a of [-8, 8]) for (const b of [-8, 8]) B.taper(x + a, z + b, GY + 98 * H - 6, 3, 3, GY + 98 * H + 4, 0.2, 0.2, '#b8925a');
    B.block(x, z, 0.6, 0.6, GY + 98 * H - 6, GY + 98 * H + 10, '#3b3633'); B.box(x + 0.3, GY + 98 * H + 6, z - 0.2, x + 6, GY + 98 * H + 10, z + 0.2, '#c8312c');
    K.reserve(-1, X(190), X(440), RW3, RW3 + 80); K.mark('the Houses of Parliament', X(320));
    x = X(432); z = Zn(40);
    B.block(x, z, 11, 11, GY, GY + 60, st, MT.windows); B.block(x, z, 13, 13, GY + 60, GY + 73, '#e2c992');
    for (const a of [[0, 6.6], [0, -6.6], [6.6, 0], [-6.6, 0]]) {
      B.push().move(x + a[0], GY + 66.5, z + a[1]); if (a[0]) B.ry(Math.PI / 2);
      B.push().rx(Math.PI / 2).cyl(0, 0, -0.25, 4.6, 0.25, 4.6, 10, '#fff6d6', MT.night).pop();
      B.box(-0.3, -0.2, -0.5, 0.3, 3.8, 0.5, '#2b2523'); B.box(-0.3, -0.3, -0.5, 2.6, 0.3, 0.5, '#2b2523'); B.pop();
    }
    B.block(x, z, 11, 11, GY + 73, GY + 80, st); B.taper(x, z, GY + 80, 12, 12, GY + 98, 0.4, 0.4, '#4f5560');
    B.block(x, z, 0.8, 0.8, GY + 98, GY + 104, '#e6c45a', MT.night);
    K.mark('Big Ben', x);
  }
  /* Westminster Abbey behind */
  x = X(250); z = Zn(240);
  B.block(x, z, 60, 18, GY, GY + 24, '#d2cab6', MT.windows, '#7a8088'); B.gable(x, z, 60, 18, GY + 24, 6, '#7a8088', 0, false);
  for (const b of [-6, 6]) B.block(x - 28, z + b, 7, 7, GY, GY + 69 * H, '#d2cab6');
  K.reserve(-1, x - 32, x + 32, -z - 12, -z + 12); K.mark('Westminster Abbey', x);
  /* Portcullis House and its chimneys, New Scotland Yard, the Ministry of Defence, Whitehall Court */
  x = X(507); z = Zn(30);
  B.block(x, z, 28, 26, GY, GY + 22, '#7d7569', MT.windows, '#5f584f');
  for (let i = -3; i <= 3; i++) for (const b of [-12, 12]) B.block(x + i * 3.8, z + b, 1.6, 1.6, GY + 22, GY + 31, '#6c5539');
  K.reserve(-1, x - 16, x + 16, -z - 14, -z + 14);
  x = X(596); z = Zn(60);
  B.block(x, z, 18, 18, GY, GY + 24, '#a9583f', MT.windows); B.gable(x, z, 18, 18, GY + 24, 6, '#59606b', 0, false);
  for (const a of [-9, 9]) for (const b of [-9, 9]) { B.cyl(x + a, z + b, GY, 2, GY + 28, 2, 6, '#a9583f'); B.cyl(x + a, z + b, GY + 28, 2.2, GY + 32, 0.2, 6, '#59606b'); }
  K.reserve(-1, x - 12, x + 12, -z - 12, -z + 12);
  x = X(709); z = Zn(150);
  B.block(x, z, 60, 30, GY, GY + 30, '#d9d5c9', MT.windows, '#73a891'); B.gable(x, z, 60, 30, GY + 30, 4, '#73a891', 0, false);
  K.reserve(-1, x - 32, x + 32, -z - 16, -z + 16); K.mark('the Ministry of Defence', x);
  x = X(858); z = Zn(130);
  B.block(x, z, 50, 22, GY, GY + 26, '#d4cfc2', MT.windows, '#59606b');
  for (let i = -2; i <= 2; i++) { B.block(x + i * 10, z + 8, 5, 5, GY + 26, GY + 32, '#d4cfc2'); B.taper(x + i * 10, z + 8, GY + 32, 5, 5, GY + (i & 1 ? 40 : 44), 0.3, 0.3, '#59606b'); }
  K.reserve(-1, x - 27, x + 27, -z - 12, -z + 12); K.mark('Whitehall Court', x);
  /* Charing Cross under its arched roof, Cleopatra's Needle, Shell Mex House, the Savoy */
  x = X(972); z = Zn(290);
  B.block(x, z, 40, 34, GY, GY + 28, '#d9d6cf', MT.windows, '#adaaa2');
  B.push().move(x, GY + 28, z).rz(Math.PI / 2).cyl(0, 0, -15, 14, 0, 14, 12, '#7fa2a8', MT.glass).pop();
  K.reserve(-1, x - 22, x + 22, -z - 18, -z + 18); K.mark('Charing Cross', x);
  x = X(1117); z = -(RW3 + 4);
  B.block(x, z, 4, 4, GY, GY + 2, '#8e8b86'); B.taper(x, z, GY + 2, 2.4, 2.4, GY + 17, 1.2, 1.2, '#9a8a76'); B.taper(x, z, GY + 17, 1.2, 1.2, GY + 18.4, 0.1, 0.1, '#9a8a76');
  K.reserve(-1, x - 6, x + 6, RW3, RW3 + 9); K.mark("Cleopatra's Needle", x);
  x = X(1160); z = Zn(200);
  B.block(x, z, 32, 26, GY, GY + 34, '#ece9e1', MT.windows); B.block(x, z + 8, 9, 9, GY + 34, GY + 46, '#ece9e1');
  B.push().move(x, GY + 41, z + 12.6).rx(Math.PI / 2).cyl(0, 0, -0.3, 3.4, 0.3, 3.4, 10, '#fff3cc', MT.night).pop();
  K.reserve(-1, x - 18, x + 18, -z - 14, -z + 14); K.mark('Shell Mex House', x);
  x = X(1222); z = Zn(160);
  B.block(x, z, 22, 20, GY, GY + 26, '#efece4', MT.windows, '#8b939a'); K.reserve(-1, x - 12, x + 12, -z - 11, -z + 11);
  /* the BT Tower far inland */
  x = X(1260); z = Zn(1000);
  B.cyl(x, z, GY, 5, GY + 110, 5, 8, '#9fb2ba', MT.windows); for (const y of [92, 100, 108]) B.cyl(x, z, GY + y, 7.6, GY + y + 5, 7.6, 10, '#c9d3d8');
  B.cyl(x, z, GY + 113, 3, GY + 124, 2.6, 6, '#8f9aa3'); B.block(x, z, 1.4, 1.4, GY + 124, GY + 125.4, '#ff5a4a', MT.night);
  K.reserve(-1, x - 10, x + 10, -z - 10, -z + 10); K.mark('the BT Tower', x);
  /* Somerset House on the Embankment */
  x = X(1380); z = Zn(110);
  B.block(x, z, 106, 26, GY, GY + 8, '#c9c1ad', MT.windows); B.block(x, z - 2, 102, 22, GY + 8, GY + 20, '#ddd6c5', MT.windows, '#6c747c');
  B.block(x, z + 2, 16, 12, GY + 20, GY + 24, '#ddd6c5'); dome3(B, x, z + 2, GY + 24, 4.5, '#8b939a', 10);
  K.reserve(-1, x - 55, x + 55, -z - 15, -z + 15); K.mark('Somerset House', x);
  /* the Temple: gardens, red brick chambers, the round church */
  for (let i = 0; i < 26; i++) { const tx = X(1500) + rng() * (X(1810) - X(1500)), tz = RW3 + 12 + rng() * 26; if (K.free(-1, tx - 3, tx + 3, tz - 3, tz + 3)) K.tree(tx, -tz, pick(rng, K.S.trees), rf(rng, 1.1, 1.6)); }
  K.reserve(-1, X(1490), X(1820), RW3, RW3 + 42);
  x = X(1698); z = Zn(200);
  B.cyl(x, z, GY, 6, GY + 10, 6, 10, '#cfc6b0'); B.cyl(x, z, GY + 10, 6.4, GY + 14, 0.5, 10, '#59606b'); B.block(x + 10, z, 14, 9, GY, GY + 11, '#cfc6b0'); B.gable(x + 10, z, 14, 9, GY + 11, 4, '#59606b', 0, false);
  K.reserve(-1, x - 8, x + 20, -z - 8, -z + 8); K.mark('the Temple', x);
  /* HMS Wellington moored at Temple Stairs */
  K.boat(X(1575), -(RW3 - 10), 'cargo');
  /* Unilever House by Blackfriars Bridge */
  x = X(1989); z = Zn(90);
  B.block(x - 4, z, 40, 26, GY, GY + 30, '#e8e4da', MT.windows, '#8b939a'); B.cyl(x + 14, z, GY, 12, GY + 30, 12, 12, '#e8e4da', MT.windows);
  K.reserve(-1, x - 26, x + 28, -z - 14, -z + 14); K.mark('Unilever House', x);
  /* ST PAUL'S, its axis kept open to the river */
  x = X(2385); z = Zn(320);
  {
    const st = '#e2ddd0';
    B.block(x, z, 64, 24, GY, GY + 24, st, MT.windows, '#8f9aa3'); B.block(x, z, 22, 46, GY, GY + 24, st, MT.windows, '#8f9aa3');
    B.cyl(x, z, GY + 24, 13, GY + 40, 13, 12, '#e8e3d6'); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; B.block(x + Math.cos(a) * 13.6, z + Math.sin(a) * 13.6, 1.1, 1.1, GY + 25, GY + 39, '#f1ece0'); }
    B.cyl(x, z, GY + 40, 11, GY + 45, 11, 12, st);
    const ty = dome3(B, x, z, GY + 45, 12.5, '#8f9aa3', 12);
    B.cyl(x, z, ty, 2.8, ty + 8, 2.3, 8, st); B.cyl(x, z, ty + 8, 2.6, ty + 11, 0.4, 8, '#8f9aa3'); B.block(x, z, 0.7, 0.7, ty + 11, ty + 17, '#e6c45a', MT.night); B.block(x, z, 2.8, 0.7, ty + 14, ty + 14.8, '#e6c45a', MT.night);
    for (const b of [-8, 8]) { B.block(x - 30, z + b, 7, 7, GY + 24, GY + 44, st, MT.windows); B.cyl(x - 30, z + b, GY + 44, 3.4, GY + 51, 0.5, 8, '#8f9aa3'); }
    K.reserve(-1, x - 36, x + 36, -z - 26, -z + 26); K.reserve(-1, x - 6, x + 6, RW3, -z); K.mark("St Paul's Cathedral", x);
  }
  /* the Barbican's towers far behind */
  for (const [r, d] of [[2351, 975], [2419, 1134], [2462, 1040]]) { x = X(r); z = Zn(d); B.taper(x, z, GY, 9, 9, GY + 123 * H, 8, 8, '#8b8a86', MT.windows); K.reserve(-1, x - 6, x + 6, -z - 6, -z + 6); }
  K.mark('the Barbican', X(2419));
  /* Wren steeples among the City offices */
  for (const [r, d, h] of [[1942, 314, 69], [2184, 374, 50], [2423, 124, 37], [2553, 419, 68], [2598, 196, 44], [2815, 191, 39], [3065, 40, 56], [3306, 177, 45]]) {
    x = X(r); z = Zn(d);
    B.block(x, z, 5, 5, GY, GY + h * H * 0.55, '#ebe7dc'); B.block(x, z, 3.4, 3.4, GY + h * H * 0.55, GY + h * H * 0.8, '#ebe7dc'); B.taper(x, z, GY + h * H * 0.8, 3, 3, GY + h * H, 0.2, 0.2, '#8b939a');
    K.reserve(-1, x - 4, x + 4, -z - 4, -z + 4);
  }
  /* Cannon Street's towers, Fishmongers' Hall, the Monument */
  x = X(2856);
  for (const a of [-10, 10]) { B.block(x + a, -(RW3 + 14), 5, 5, GY, GY + 41 * H, '#b48f68'); dome3(B, x + a, -(RW3 + 14), GY + 41 * H, 2.8, '#8b939a', 8); }
  B.block(x, -(RW3 + 40), 22, 50, GY, GY + 14, '#b48f68', MT.windows, '#5f676f'); K.reserve(-1, x - 14, x + 14, RW3, RW3 + 66); K.mark('Cannon Street station', x);
  x = X(2980); B.block(x, Zn(40), 40, 20, GY, GY + 18, '#d4cebf', MT.windows, '#8b939a'); K.reserve(-1, x - 21, x + 21, RW3, RW3 + 70); K.mark("Fishmongers' Hall", x);
  x = X(3142); z = Zn(166);
  B.block(x, z, 5, 5, GY, GY + 5, '#e6e1d4'); B.cyl(x, z, GY + 5, 1.8, GY + 40, 1.6, 8, '#e6e1d4'); B.block(x, z, 3.6, 3.6, GY + 40, GY + 42, '#2f2d30'); B.cyl(x, z, GY + 42, 1.2, GY + 46, 0.4, 6, '#e6c45a', MT.night);
  K.reserve(-1, x - 4, x + 4, -z - 4, -z + 4); K.mark('the Monument', x);
  /* the City cluster, each tower at its own depth */
  const tower = (r, d, w, dd, h, col, mat) => { const tx = X(r), tz = Zn(d); B.block(tx, tz, w, dd, GY, GY + h * H, col, mat || MT.windows, shade3(col, 0.7)); K.reserve(-1, tx - w / 2 - 2, tx + w / 2 + 2, -tz - dd / 2 - 2, -tz + dd / 2 + 2); return [tx, tz]; };
  /* the Walkie-Talkie: widening as it rises, the Sky Garden on top */
  x = X(3249); z = Zn(320);
  B.taper(x, z, GY, 26, 24, GY + 60, 30, 26, '#6f8aa3', MT.windows); B.taper(x, z, GY + 60, 30, 26, GY + 106, 36, 28, '#6f8aa3', MT.windows); B.taper(x, z, GY + 106, 36, 28, GY + 114, 32, 16, '#bfe0c9', MT.glass);
  K.reserve(-1, x - 20, x + 20, -z - 16, -z + 16); K.mark('the Walkie-Talkie', x);
  [x, z] = tower(3217, 678, 30, 28, 278, '#9fb6c9'); K.mark('22 Bishopsgate', x);
  tower(3190, 605, 20, 20, 204, '#8d99a6');
  x = X(3263); z = Zn(607);
  B.taper(x, z, GY, 24, 26, GY + 225 * H, 24, 2, '#a9c0d2', MT.windows, 0, -12); K.reserve(-1, x - 14, x + 14, -z - 15, -z + 15); K.mark('the Cheesegrater', x);
  x = X(3256); z = Zn(527);
  B.taper(x, z, GY, 20, 16, GY + 190 * H, 4, 6, '#b5cbdc', MT.windows, 6, 0); K.reserve(-1, x - 12, x + 12, -z - 10, -z + 10); K.mark('the Scalpel', x);
  tower(3284, 520, 16, 22, 88, '#b9c0c6');
  tower(3154, 751, 20, 20, 183, '#4c5560');
  [x, z] = tower(3300, 877, 18, 18, 202, '#7f9ab0'); B.block(x, z, 1, 1, GY + 202 * H, GY + 202 * H + 20, '#8a8f98'); B.block(x, z, 1.6, 1.6, GY + 202 * H + 20, GY + 202 * H + 21.4, '#ff5a4a', MT.night);
  tower(3347, 533, 22, 18, 125, '#5f7f9a');
  x = X(3351); z = Zn(702);
  const gp = [[0, 9], [20, 12], [56, 12.6], [84, 10], [104, 5.6], [114, 1]];
  for (let i = 0; i + 1 < gp.length; i++) B.cyl(x, z, GY + gp[i][0] * 1.1, gp[i][1], GY + gp[i + 1][0] * 1.1, gp[i + 1][1], 10, i % 2 ? '#4f7a8a' : '#3f6a86', MT.windows, i * 0.2);
  K.reserve(-1, x - 14, x + 14, -z - 14, -z + 14); K.mark('the Gherkin', x);
  /* Old Billingsgate and the Custom House */
  x = X(3272); B.block(x, Zn(30), 46, 22, GY, GY + 16, '#d9c9a2', MT.windows, '#59606b'); K.reserve(-1, x - 24, x + 24, RW3, RW3 + 64);
  x = X(3378); B.block(x, Zn(50), 64, 22, GY, GY + 17, '#e0dbcf', MT.windows, '#8b939a'); K.reserve(-1, x - 33, x + 33, RW3, RW3 + 70); K.mark('the Custom House', x);
  /* the Tower of London: the White Tower inside its walls, Traitors' Gate at the river */
  x = X(3692); z = Zn(120);
  {
    const st = '#d8d0bc';
    B.box(x - 60, GY, z - 40, x + 60, GY + 8, z - 36, st); B.box(x - 60, GY, z + 36, x + 60, GY + 8, z + 40, st);
    B.box(x - 60, GY, z - 40, x - 56, GY + 8, z + 40, st); B.box(x + 56, GY, z - 40, x + 60, GY + 8, z + 40, st);
    for (const [a, b] of [[-60, -40], [60, -40], [-60, 40], [60, 40], [0, 40], [-30, 40], [30, 40]]) B.cyl(x + a, z + b, GY, 4, GY + 12, 4, 8, st);
    B.block(x, z, 26, 22, GY, GY + 22, '#e5dfcf', MT.windows, '#8b939a');
    for (const a of [-12, 12]) for (const b of [-10, 10]) { B.block(x + a, z + b, 4, 4, GY + 22, GY + 26, '#e5dfcf'); B.cyl(x + a, z + b, GY + 26, 2.6, GY + 30, 0.3, 8, '#8b939a'); }
    B.box(x - 5, GY, z + 40, x + 5, GY + 5, z + 41, '#3e3a37');
    K.reserve(-1, x - 64, x + 64, -z - 44, -z + 44); K.mark('the Tower of London', x);
  }
  /* St Katharine Docks: warehouses and the Ivory House */
  x = X(3935); z = Zn(90);
  B.block(x, z, 60, 18, GY, GY + 18, '#cdb98f', MT.windows, '#59606b'); B.block(X(3969), z - 14, 8, 8, GY + 18, GY + 30, '#cdb98f'); B.taper(X(3969), z - 14, GY + 30, 8, 8, GY + 34, 0.4, 0.4, '#59606b');
  K.reserve(-1, x - 32, x + 40, -z - 24, -z + 12); K.mark('St Katharine Docks', X(3969));

  /* ======== the South Bank (+z), west to east ======== */
  /* Lambeth Palace (opposite Victoria Tower Gardens) */
  x = X(40); z = Zs(110);
  B.block(x, z, 36, 22, GY, GY + 14, '#a9583f', MT.windows, '#59606b'); for (const a of [-14, -8]) B.block(x + a, z - 10, 5, 5, GY, GY + 22, '#a9583f');
  K.reserve(1, x - 20, x + 20, z - 14, z + 14);
  /* St Thomas' Hospital, County Hall */
  x = X(290); z = Zs(110); B.block(x, z, 90, 26, GY, GY + 34, '#d8d4cb', MT.windows, '#8f9aa3'); K.reserve(1, x - 46, x + 46, z - 14, z + 14);
  x = X(577); z = Zs(60);
  B.block(x, z, 70, 34, GY, GY + 30, '#e2dccd', MT.windows, '#b9653f'); B.gable(x, z, 70, 34, GY + 30, 6, '#b9653f', 0, false);
  for (let i = -3; i <= 3; i++) B.block(x + i * 5, z - 17.6, 1.6, 1.6, GY + 10, GY + 26, '#efe9dc');
  K.reserve(1, x - 36, x + 36, z - 18, z + 18); K.mark('County Hall', x);
  /* the LONDON EYE: its wheel is a separate mesh so it can turn */
  x = X(685); z = RW3 + 6;
  {
    const E = new Mesh3(), ER = 46;
    for (let i = 0; i < 32; i++) {
      const a0 = i * TAU / 32, a1 = (i + 1) * TAU / 32;
      E.beam([Math.cos(a0) * ER, Math.sin(a0) * ER, 0], [Math.cos(a1) * ER, Math.sin(a1) * ER, 0], 1.3, '#dfe6ec');
      if (i % 2 === 0) { E.beam([0, 0, 0], [Math.cos(a0) * ER, Math.sin(a0) * ER, 0], 0.45, '#c9d3dc'); const px = Math.cos(a0) * (ER + 2.8), py = Math.sin(a0) * (ER + 2.8); E.box(px - 1.8, py - 1.5, -1.4, px + 1.8, py + 1.5, 1.4, '#cfeaff', MT.night); }
    }
    E.push().rx(Math.PI / 2).cyl(0, 0, -2, 3, 2, 3, 8, '#aeb9c4').pop();
    K.spinners.push({ mesh: E, x, y: GY + 52, z: z - 2.2, speed: 0.045 });
    B.beam([x - 20, GY, z + 12], [x, GY + 52, z], 2, '#dfe5ea'); B.beam([x + 20, GY, z + 12], [x, GY + 52, z], 2, '#dfe5ea'); B.block(x, z - 3, 26, 5, GY, GY + 3, '#aeb9c4');
    K.reserve(1, x - 52, x + 52, RW3, RW3 + 34); K.mark('the London Eye', x);
  }
  /* the Royal Festival Hall, the National Theatre */
  x = X(1050); z = Zs(64); B.block(x, z, 50, 34, GY, GY + 20, '#e9e6de', MT.windows, '#73a891'); B.taper(x, z + 4, GY + 20, 30, 20, GY + 26, 26, 14, '#73a891');
  K.reserve(1, x - 26, x + 26, z - 18, z + 18); K.mark('the Royal Festival Hall', x);
  x = X(1260); z = Zs(130); B.block(x, z, 46, 34, GY, GY + 14, '#a9a59c', MT.windows, '#8f8d88'); B.block(x - 6, z, 34, 26, GY + 14, GY + 22, '#a9a59c'); B.block(x + 8, z + 4, 14, 14, GY + 22, GY + 34, '#95918a');
  K.reserve(1, x - 24, x + 24, z - 18, z + 18); K.mark('the National Theatre', x);
  /* the Oxo Tower, One Blackfriars */
  x = X(1826); z = Zs(74); B.block(x, z, 40, 22, GY, GY + 24, '#a9583f', MT.windows, '#59606b'); B.block(x, z - 6, 7, 7, GY + 24, GY + 40, '#d9d5c9'); B.block(x, z - 9.6, 5, 0.4, GY + 30, GY + 38, '#ff5a3a', MT.night);
  K.reserve(1, x - 21, x + 21, z - 12, z + 12); K.mark('the Oxo Tower', x);
  x = X(2037); z = Zs(68); B.taper(x, z, GY, 20, 16, GY + 80, 26, 18, '#4f6d8a', MT.windows); B.taper(x, z, GY + 80, 26, 18, GY + 118, 14, 12, '#4f6d8a', MT.windows);
  K.reserve(1, x - 15, x + 15, z - 10, z + 10);
  /* Tate Modern: the brick block and its central chimney */
  x = X(2340); z = Zs(95);
  B.block(x, z, 80, 40, GY, GY + 28, '#7d5a48', MT.windows, '#3f3a38'); B.block(x, z - 18, 10, 6, GY + 28, GY + 70, '#7d5a48'); B.block(x, z - 18, 10.6, 6.6, GY + 66, GY + 70, '#f4efe2', MT.night);
  K.reserve(1, x - 42, x + 42, z - 22, z + 22); K.mark('Tate Modern', x);
  /* Shakespeare's Globe */
  x = X(2532); z = Zs(10);
  B.cyl(x, z, GY, 9, GY + 8, 9, 12, '#efe6d0'); B.cyl(x, z, GY + 8, 9.6, GY + 11, 6, 12, '#b9a06a');
  K.reserve(1, x - 11, x + 11, z - 11, z + 11); K.mark("Shakespeare's Globe", x);
  /* Southwark Cathedral */
  x = X(3002); z = Zs(83);
  B.block(x, z, 40, 14, GY, GY + 14, '#bdb19a', MT.windows, '#59606b'); B.block(x, z, 8, 8, GY + 14, GY + 30, '#bdb19a'); for (const a of [-3.5, 3.5]) for (const b of [-3.5, 3.5]) B.block(x + a, z + b, 1.2, 1.2, GY + 30, GY + 34, '#bdb19a');
  K.reserve(1, x - 21, x + 21, z - 8, z + 8); K.mark('Southwark Cathedral', x);
  /* THE SHARD */
  x = X(3176); z = Zs(214);
  B.taper(x, z, GY, 34, 34, GY + 300 * H, 3, 3, '#a9cbe0', MT.windows); B.taper(x, z, GY + 300 * H, 3, 3, GY + 310 * H, 0.4, 0.4, '#c9dcea', MT.night);
  K.reserve(1, x - 20, x + 20, z - 20, z + 20); K.mark('The Shard', x);
  /* HMS Belfast moored off the south bank */
  x = X(3426); z = RW3 - 20;
  B.taper(x, z, 0.3, 80, 11, 4.4, 86, 12.4, '#7f8a92', 0, 0, 0, '#9aa3ab');
  B.block(x + 4, z, 26, 8, 4.4, 10, '#8b959d', MT.windows); B.block(x + 4, z, 10, 6, 10, 16, '#8b959d'); B.block(x - 2, z, 2.6, 2.6, 10, 18, '#5d666e'); B.block(x + 10, z, 2.6, 2.6, 10, 17, '#5d666e');
  B.block(x + 4, z, 0.6, 0.6, 16, 30, '#3a3d42');
  for (const a of [-28, -18, 26, 34]) { B.block(x + a, z, 6, 6, 4.4, 7.4, '#76808a'); B.box(x + a + (a < 0 ? -9 : 3), 6, z - 0.6, x + a + (a < 0 ? -3 : 9), 6.8, z + 0.6, '#5d666e'); }
  K.mark('HMS Belfast', x);
  /* City Hall: the leaning glass egg */
  x = X(3681); z = Zs(26);
  for (let i = 0; i < 5; i++) { const u0 = i / 5, u1 = (i + 1) / 5, r = u => 13 * Math.sin(Math.PI * (0.15 + 0.8 * u)); B.cyl(x + i * 0.9, z, GY + u0 * 42, r(u0), GY + u1 * 42, r(u1), 12, '#9fbdd2', MT.windows); }
  K.reserve(1, x - 16, x + 16, z - 15, z + 15); K.mark('City Hall', x);

  K.boat(X(1100), 70, 'barge'); K.boat(X(1700), -90, 'tug'); K.boat(X(2700), 84, 'ferry'); K.boat(X(3550), -70, 'barge');
}
function londonBuilding(B, rng, S, cx, z, w, d, h, r) {
  if (h > 30) {
    basicBuilding(B, rng, S, cx, z, w, d, h);
    if (r === 1 && rng() < 0.1) { B.block(cx, z, 5, 5, GY + h, GY + h + 12, '#ebe7dc'); B.taper(cx, z, GY + h + 12, 5, 5, GY + h + 26, 0.3, 0.3, '#8b939a'); }
    return;
  }
  const col = pick(rng, S.pal);
  B.block(cx, z, w, d, GY, GY + h, col, MT.windows); B.gable(cx, z, w, d, GY + h, 5.5, '#59606b', 0, false);
  for (let i = 0, n = 1 + Math.floor(rng() * 2); i < n; i++) { const px = cx + rf(rng, -w * 0.35, w * 0.35); B.block(px, z, 1.8, 1.8, GY + h + 3, GY + h + 8.6, '#8a5a4a'); B.block(px, z, 0.9, 0.9, GY + h + 8.6, GY + h + 9.8, '#c9785a'); }
}

STYLE3.london = {
  gen: city3London, seed: 1859, building: londonBuilding, synced: true, hero: 300,
  pal: ['#d8d3c6', '#cdb98f', '#a9583f', '#e2ded3', '#bea97f', '#975041', '#c9c3b5'], quay: '#8e8b86', quayTop: '#b6b1a8', ground: '#767a70', trees: ['#5d8a4b', '#4a6c3d', '#6f9a5a'],
  rows: [
    /* the north bank: Westminster and the Strand low behind the Embankment trees, the City denser */
    { side: -1, x0: 0, x1: 1420, z: 46, h: [16, 28], w: [16, 28], d: [16, 22], gap: [2, 8] },
    { side: -1, x0: 0, x1: 1700, z: 100, h: [20, 34], w: [18, 30], d: [18, 26], gap: [2, 8] },
    { side: -1, x0: 1100, x1: 2280, z: 20, h: [14, 26], w: [16, 30], d: [14, 20], gap: [1, 5] },
    { side: -1, x0: 1100, x1: 2400, z: 58, h: [22, 40], w: [18, 32], d: [20, 28], gap: [1, 6], tall: 0.05, tallH: [50, 70] },
    { side: -1, x0: 1300, x1: 2300, z: 120, h: [26, 46], w: [22, 36], d: [22, 32], gap: [3, 10] },
    { side: -1, x0: 0, x1: 2400, z: 190, h: [20, 40], w: [26, 44], d: [26, 36], gap: [8, 24] },
    /* the South Bank: low, with gaps for the riverside walk */
    { side: 1, x0: 0, x1: 2400, z: 30, h: [10, 22], w: [16, 28], d: [14, 20], gap: [8, 26] },
    { side: 1, x0: 0, x1: 2400, z: 80, h: [16, 34], w: [18, 32], d: [20, 28], gap: [4, 14], tall: 0.05, tallH: [50, 80] },
    { side: 1, x0: 0, x1: 2400, z: 150, h: [20, 40], w: [26, 44], d: [26, 36], gap: [8, 24] },
  ],
};
