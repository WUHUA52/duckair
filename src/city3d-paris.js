/* ---------- Paris ----------
   The same stretch of the Seine as the side view: x = (s + 150) * 0.375, s
   being metres along the river from Pont de Sully (see city-paris.js), so
   x = route px * 2400 / 4096. The far bank (-z) is the Île de la Cité and the
   Left Bank; the near bank (+z) is the Right Bank: Hôtel de Ville, the Louvre
   and the Tuileries, the Concorde obelisk, the Grand Palais, the Palais de
   Chaillot, with the Arc de Triomphe and Sacré-Cœur far back. Depth inland is
   compressed (0.3 per metre); heights are 0.6 per metre. */
function city3Paris(B, rng, K) {
  const X = s => (s + 150) * 0.375, Z = d => -(RW3 + 12 + d * 0.3), ZN = d => RW3 + 12 + d * 0.3, H = 0.6;
  const stone = '#e6d8b8', stoneD = '#c9b994', slate = '#5d6576', zincC = '#7f8ba0', gold = '#d9b24a';
  let x, z, ty;
  /* bridges, east to west: stone arches, light iron and steel footbridges */
  const foot = (s, col, w, deck) => {
    x = X(s);
    B.box(x - w / 2, 15, -RW3 - 12, x + w / 2, 16.4, RW3 + 12, col, 0, deck || '#a07c58');
    for (const e of [-w / 2, w / 2]) B.box(x + e - 0.3, 16.4, -RW3 - 12, x + e + 0.3, 17.6, RW3 + 12, col);
    for (let i = -3; i <= 3; i++) { const zz = i * 40; B.block(x, zz, w + 1.5, 4, 0, 15, '#b1a385'); }
    for (const s2 of [-1, 1]) K.reserve(s2, x - w / 2 - 8, x + w / 2 + 8, RW3, RW3 + 40);
  };
  const st = '#d9cdb0', stP = '#c9bea2';
  K.arch(X(515), { col: st, deckY: 15, piers: 3, w: 9, lamps: true });
  K.arch(X(822), { col: '#4b5552', deckY: 15, piers: 1, w: 11, lamps: true });
  K.arch(X(973), { col: stP, deckY: 15, piers: 3, w: 11, lamps: true });
  K.arch(X(1116), { col: st, deckY: 15, piers: 3, w: 16, lamps: true });
  K.arch(X(1544), { col: st, deckY: 15, piers: 7, w: 12, lamps: true }); K.mark('the Pont Neuf', X(1544));
  foot(1855, '#4b5552', 6); K.mark('the Pont des Arts', X(1855));
  K.arch(X(2207), { col: stP, deckY: 15, piers: 3, w: 17, lamps: true });
  K.arch(X(2443), { col: st, deckY: 15, piers: 5, w: 10, lamps: true }); K.mark('the Pont Royal', X(2443));
  foot(2869, '#93a19e', 8, '#a07c58');
  K.arch(X(3289), { col: st, deckY: 15, piers: 5, w: 18, lamps: true }); K.mark('the Pont de la Concorde', X(3289));
  /* Pont Alexandre III: one low steel arch, four pylons with gilded horses */
  x = X(3718);
  K.arch(x, { col: '#93a19e', deckY: 14, piers: 1, w: 21, lamps: true, rail: '#3a3d44' });
  for (const s of [-1, 1]) for (const a of [-13, 13]) {
    B.block(x + a, s * (RW3 + 4), 4.4, 4.4, GY, GY + 24, '#e9dcc0'); B.block(x + a, s * (RW3 + 4), 5.6, 5.6, GY + 24, GY + 25.4, '#cdbf9f');
    B.taper(x + a, s * (RW3 + 4), GY + 25.4, 3.4, 3.4, GY + 31, 1.2, 1.2, '#e6c45a', MT.night);
  }
  K.mark('the Pont Alexandre III', x);
  K.arch(X(3963), { col: st, deckY: 15, piers: 4, w: 11, lamps: true });
  K.arch(X(4584), { col: '#6d7a78', deckY: 15, piers: 1, w: 22, lamps: true }); K.mark("the Pont de l'Alma", X(4584));
  foot(4956, '#4b5552', 5, '#8d7a62');
  K.arch(X(5426), { col: st, deckY: 15, piers: 5, w: 18, lamps: true }); K.mark("the Pont d'Iéna", X(5426));
  /* Bir-Hakeim: road deck, metro viaduct on iron columns above */
  x = X(5990);
  K.arch(x, { col: '#5a6a62', deckY: 14, piers: 4, w: 14, lamps: true });
  B.box(x - 2.4, 26, -RW3 - 12, x + 2.4, 28, RW3 + 12, '#5a6a62', 0, '#3d4943');
  for (let zz = -RW3; zz <= RW3; zz += 15) for (const e of [-2, 2]) B.block(x + e, zz, 0.7, 0.7, 14, 26, '#3d4943');
  K.mark('the Pont de Bir-Hakeim', x);

  /* ---------- the far bank: the island and the Left Bank ---------- */
  /* Notre-Dame: nave along the river, transept, spire, twin west towers to the west (+x) */
  x = X(740); z = Z(145);
  B.block(x - 4, z, 44, 14, GY, GY + 21, '#d3c6a6', MT.windows); B.gable(x - 4, z, 44, 14, GY + 21, 6, '#6b7380');
  B.cyl(x - 26, z, GY, 7, GY + 21, 7, 8, '#d3c6a6'); B.cyl(x - 26, z, GY + 21, 7, GY + 26, 0.5, 8, '#6b7380');
  B.block(x, z, 9, 26, GY, GY + 22, '#d3c6a6'); B.gable(x, z, 9, 26, GY + 22, 5, '#6b7380', 0, true);
  B.cyl(x, z, GY + 26, 2, GY + 30, 2, 8, '#6b7380'); B.cyl(x, z, GY + 30, 2, GY + 58, 0.1, 8, '#6b7380');
  for (let i = -3; i <= 3; i++) if (i) for (const s of [-1, 1]) B.beam([x - 4 + i * 6, GY + 18, z + s * 7], [x - 4 + i * 6, GY + 4, z + s * 13], 0.8, '#bfb090');
  for (const s of [-1, 1]) B.block(x + 23, z + s * 4.5, 8, 8, GY, GY + 41, '#d9ccb0', MT.windows, '#b3a78f');
  B.block(x + 23, z, 8, 18, GY, GY + 27, '#d9ccb0', MT.windows);
  K.reserve(-1, x - 36, x + 30, -z - 22, -z + 22); K.mark('Notre-Dame', x);
  /* Sainte-Chapelle and the Palais de Justice; the Conciergerie on the quai */
  x = X(1195); z = Z(120);
  B.block(x, z, 40, 34, GY, GY + 18, stone, MT.windows, slate);
  B.block(x, z, 8, 18, GY, GY + 24, '#d4c7a8', MT.windows); B.gable(x, z, 8, 18, GY + 24, 8, slate, 0, true);
  B.cyl(x, z, GY + 30, 1.4, GY + 45, 0.1, 6, gold, MT.night);
  K.reserve(-1, x - 22, x + 22, -z - 18, -z + 18); K.mark('the Sainte-Chapelle', x);
  x = X(1202); z = Z(20);
  B.block(x, z, 44, 14, GY, GY + 14, '#d1c6ae', MT.windows); B.gable(x, z, 44, 14, GY + 14, 6, slate);
  for (const a of [-4, 4]) { B.cyl(x + a, z + 7, GY, 3.2, GY + 18, 3.2, 10, '#d1c6ae'); B.cyl(x + a, z + 7, GY + 18, 3.6, GY + 25, 0.2, 10, slate); }
  B.cyl(x + 16, z + 7, GY, 2.8, GY + 15, 2.8, 10, '#d1c6ae'); B.cyl(x + 16, z + 7, GY + 15, 3.1, GY + 20, 0.2, 10, slate);
  B.block(x - 30, z + 4, 6, 6, GY, GY + 22, '#d1c6ae', MT.windows); B.taper(x - 30, z + 4, GY + 22, 6.4, 6.4, GY + 29, 0.3, 0.3, slate);
  K.reserve(-1, x - 36, x + 22, RW3, RW3 + 32); K.mark('the Conciergerie', x);
  /* Henri IV and the Vert-Galant trees at the island's tip */
  for (let i = 0; i < 9; i++) K.tree(X(1590) + i * 4, -(RW3 + 6 + (i % 3) * 4), '#94ad5c', 1.2);
  B.block(X(1560), -(RW3 + 6), 3, 3, GY, GY + 4, '#b9ae96'); B.block(X(1560), -(RW3 + 6), 3.5, 1.5, GY + 4, GY + 8, '#55624f');
  K.reserve(-1, X(1556), X(1640), RW3, RW3 + 30);
  /* Monnaie and the Institut de France with its dome on the Pont des Arts axis */
  x = X(1676); z = Z(25);
  B.block(x, z, 44, 16, GY, GY + 15, stone, MT.windows, slate); B.block(x, z + 6, 10, 4, GY, GY + 18, '#f1e8d4');
  K.reserve(-1, x - 24, x + 24, RW3 + 8, RW3 + 34); K.mark('the Monnaie de Paris', x);
  x = X(1855); z = Z(30);
  for (const a of [-1, 1]) { B.block(x + a * 16, z - 2, 18, 10, GY, GY + 10, stone, MT.windows, slate); B.block(x + a * 26, z + 2, 6, 12, GY, GY + 12, stone, MT.windows, slate); }
  B.block(x, z, 14, 14, GY, GY + 14, stone); B.gable(x, z + 4, 14, 6, GY + 14, 3, stone);
  B.cyl(x, z - 3, GY + 14, 5.4, GY + 20, 5.4, 12, stone); ty = dome3(B, x, z - 3, GY + 20, 5.6, '#566378', 12);
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; B.beam([x + Math.cos(a) * 5.6, GY + 20, z - 3 + Math.sin(a) * 5.6], [x + Math.cos(a) * 1.2, ty, z - 3 + Math.sin(a) * 1.2], 0.4, gold, MT.night); }
  B.cyl(x, z - 3, ty, 1.2, ty + 4, 1, 6, stone); B.block(x, z - 3, 0.5, 0.5, ty + 4, ty + 6, gold, MT.night);
  K.reserve(-1, x - 32, x + 32, RW3 + 10, RW3 + 40); K.mark('the Institut de France', x);
  /* Saint-Germain-des-Prés, Saint-Sulpice, the Panthéon */
  x = X(1896); z = Z(470);
  B.block(x, z, 22, 10, GY, GY + 12, '#d6cbb2', 0, slate); B.block(x + 13, z, 6, 6, GY, GY + 22, '#d6cbb2'); B.taper(x + 13, z, GY + 22, 6.4, 6.4, GY + 30, 0.2, 0.2, slate);
  K.reserve(-1, x - 14, x + 18, -z - 8, -z + 8);
  x = X(1855); z = Z(760);
  B.block(x, z, 30, 40, GY, GY + 22, '#d6cbb2', MT.windows, slate);
  for (const [a, h] of [[-12, 41], [12, 44]]) { B.block(x + a, z + 18, 8, 8, GY, GY + h, '#d6cbb2', MT.windows); B.cyl(x + a, z + 18, GY + h, 3.6, GY + h + 2, 3.6, 8, '#d6cbb2'); }
  K.reserve(-1, x - 20, x + 20, -z - 26, -z + 26); K.mark('Saint-Sulpice', x);
  x = X(782); z = Z(1060);
  B.block(x, z, 50, 40, GY, GY + 20, '#ddd4c0', 0, '#b9ae98'); B.block(x, z + 22, 26, 6, GY, GY + 20, '#ddd4c0'); B.gable(x, z + 22, 26, 6, GY + 20, 5, '#ddd4c0');
  B.cyl(x, z, GY + 20, 9, GY + 36, 9, 14, '#ddd4c0'); ty = dome3(B, x, z, GY + 36, 9.4, '#cfc8b8', 14); B.cyl(x, z, ty, 1.6, ty + 6, 1, 6, '#ddd4c0');
  K.reserve(-1, x - 28, x + 28, -z - 24, -z + 30); K.mark('the Panthéon', x);
  /* the Tour Montparnasse, the one tall dark slab */
  x = X(2244); z = Z(2000);
  B.block(x, z, 28, 18, GY, GY + 126, '#4d5160', MT.windows, '#3a3d48'); B.block(x, z, 1, 1, GY + 126, GY + 134, '#8a8f98'); B.block(x, z, 1.6, 1.6, GY + 134, GY + 135.4, '#ff5a4a', MT.night);
  K.reserve(-1, x - 16, x + 16, -z - 12, -z + 12); K.mark('the Tour Montparnasse', x);
  /* Musée d'Orsay: the long station front, clock pavilions, glass barrel roof */
  x = X(2669); z = Z(45);
  B.block(x, z, 70, 34, GY, GY + 18, '#e6d9bd', MT.windows, '#4c5565');
  for (let i = 0; i < 6; i++) { const y0 = GY + 18 + Math.sin(i / 5 * Math.PI) * 6, y1 = GY + 18 + Math.sin((i + 1) / 5 * Math.PI) * 6; B.quad([x - 30, y0, z - 15 + i * 6], [x + 30, y0, z - 15 + i * 6], [x + 30, y1, z - 15 + (i + 1) * 6], [x - 30, y1, z - 15 + (i + 1) * 6], '#aebfcc', MT.glass); }
  for (const a of [-32, 32]) { B.block(x + a, z + 12, 10, 10, GY, GY + 22, '#e6d9bd', MT.windows); B.taper(x + a, z + 12, GY + 22, 10.4, 10.4, GY + 28, 4, 4, '#4c5565'); B.block(x + a, z + 17.2, 5, 0.6, GY + 15, GY + 20, '#f3ecd8', MT.night); }
  B.block(x + 46, z, 22, 26, GY, GY + 16, '#e6d9bd', MT.windows, '#4c5565');
  K.reserve(-1, x - 40, x + 58, RW3 + 18, RW3 + 70); K.mark("the Musée d'Orsay", x);
  /* Légion d'Honneur, Sainte-Clotilde, Palais Bourbon */
  x = X(2836); z = Z(60);
  B.block(x, z, 26, 18, GY, GY + 9, stone, MT.windows, slate); B.cyl(x, z + 9, GY, 5, GY + 10, 5, 10, stone); dome3(B, x, z + 9, GY + 10, 4, slate, 10);
  K.reserve(-1, x - 14, x + 14, RW3 + 22, RW3 + 52);
  x = X(3052); z = Z(435);
  B.block(x, z, 16, 34, GY, GY + 20, '#d6cbb2', 0, slate);
  for (const a of [-5, 5]) { B.block(x + a, z + 16, 6, 6, GY, GY + 28, '#d6cbb2'); B.cyl(x + a, z + 16, GY + 28, 3, GY + 42, 0.1, 8, '#d6cbb2'); }
  K.reserve(-1, x - 12, x + 12, -z - 20, -z + 22); K.mark('Sainte-Clotilde', x);
  x = X(3289); z = Z(60);
  B.block(x, z, 60, 26, GY, GY + 12, '#e6dabf', MT.windows, slate);
  B.block(x, z + 15, 22, 5, GY, GY + 15, '#e6dabf'); B.gable(x, z + 15, 23, 5, GY + 15, 4, '#e6dabf');
  for (let i = 0; i < 12; i++) B.block(x - 10 + i * 1.82, z + 17.6, 0.8, 0.8, GY, GY + 15, '#f4ecd9');
  K.reserve(-1, x - 32, x + 32, RW3 + 18, RW3 + 52); K.mark('the Palais Bourbon', x);
  /* Les Invalides: the Esplanade open from the quai to the golden dome */
  x = X(3800);
  B.quad([x - 34, GY + 0.2, -(RW3 + 9)], [x + 34, GY + 0.2, -(RW3 + 9)], [x + 34, GY + 0.2, Z(500)], [x - 34, GY + 0.2, Z(500)], '#7fa05e');
  for (let zz = RW3 + 14; zz < RW3 + 160; zz += 9) for (const a of [-30, 30]) K.tree(x + a, -zz, '#6f9a5a', 0.9);
  z = Z(560); B.block(x, z, 74, 10, GY, GY + 13, '#ddd4c0', MT.windows, slate); B.block(x, z + 1, 12, 12, GY, GY + 18, '#ddd4c0');
  z = Z(900);
  B.block(x, z, 36, 36, GY, GY + 18, '#ddd4c0', MT.windows, slate);
  B.cyl(x, z, GY + 18, 9, GY + 33, 9, 14, '#ddd4c0'); ty = dome3(B, x, z, GY + 33, 9.5, gold, 14);
  B.cyl(x, z, ty, 1.8, ty + 8, 1.4, 8, gold, MT.night); B.cyl(x, z, ty + 8, 1, ty + 16, 0.1, 6, gold, MT.night);
  K.reserve(-1, x - 36, x + 36, RW3, -Z(590)); K.reserve(-1, x - 24, x + 24, -z - 22, -z + 22); K.mark('Les Invalides', x);
  /* the American Church, the Musée du Quai Branly */
  x = X(4243); z = Z(20);
  B.block(x, z, 14, 26, GY, GY + 14, '#e3d6bc', 0, slate); B.block(x - 4, z + 10, 6, 6, GY, GY + 26, '#e3d6bc'); B.cyl(x - 4, z + 10, GY + 26, 3.4, GY + 36, 0.1, 8, slate);
  K.reserve(-1, x - 10, x + 10, RW3 + 4, RW3 + 34);
  x = X(5062); z = Z(70);
  for (let i = 0; i < 10; i++) K.tree(X(4880) + i * 13, -(RW3 + 14 + (i % 2) * 8), '#6f9a5a', 1.3);
  for (let i = -8; i <= 8; i++) B.block(x + i * 4.6, z, 0.6, 0.6, GY, GY + 6, '#363740');
  B.block(x, z, 80, 16, GY + 6, GY + 14, '#6e3a2c', MT.windows);
  for (let i = -6; i <= 6; i++) B.block(x + i * 6, z + 9, 4, 4, GY + 4 + (i & 1) * 3, GY + 12 + (i & 1) * 3, pick(rng, ['#b5482f', '#d39a3a', '#7d5a3a', '#c46a35']));
  B.block(X(4870), Z(10), 8, 4, GY, GY + 18, '#617f40');
  K.reserve(-1, X(4860), X(5190), RW3 + 4, RW3 + 70); K.mark('the Musée du Quai Branly', x);
  /* the Eiffel Tower on the Champ-de-Mars, École Militaire at its far end */
  x = X(5454); z = Z(200);
  latticeTower(B, x, z, ['#7b5b44', '#5e4433'], 198);
  for (let i = 0; i < 26; i++) for (const a of [-1, 1]) K.tree(x + a * (52 + (i % 3) * 7), z - 10 - i * 11, '#6f9a5a', 1);
  B.quad([x - 44, GY + 0.2, z - 50], [x + 44, GY + 0.2, z - 50], [x + 44, GY + 0.2, z - 290], [x - 44, GY + 0.2, z - 290], '#7fa05e');
  B.block(x, z - 300, 110, 22, GY, GY + 14, '#ddd4c0', MT.windows, slate); B.cyl(x, z - 296, GY + 14, 6, GY + 20, 4, 8, slate);
  K.reserve(-1, x - 70, x + 70, -z - 60, -z + 320); K.reserve(-1, x - 12, x + 12, RW3, -z - 50); K.mark('the Eiffel Tower', x);
  /* Jardin Tino-Rossi at the start, plane trees along the quai Branly at the end */
  for (let i = 0; i < 20; i++) K.tree(rng() * X(-10), -(RW3 + 12 + rng() * 40), '#6f9a5a', rf(rng, 1, 1.5));
  K.reserve(-1, 0, X(-10), RW3, RW3 + 56);

  /* ---------- the near bank: the Right Bank ---------- */
  /* Hôtel de Ville */
  x = X(726); z = ZN(110);
  B.block(x, z, 60, 36, GY, GY + 18, '#e3d6bc', MT.windows, slate);
  for (const a of [-27, 0, 27]) { B.block(x + a, z - 14, a ? 10 : 14, 10, GY, GY + 22, '#e3d6bc', MT.windows); B.taper(x + a, z - 14, GY + 22, a ? 10.4 : 14.4, 10.4, GY + 29, 3, 3, slate); }
  B.block(x, z - 14, 2, 2, GY + 29, GY + 34, '#cdbf9f');
  K.reserve(1, x - 32, x + 32, z - 24, z + 24); K.mark('the Hôtel de Ville', x);
  /* the Louvre: the long Grande Galerie along the quai, pavilions, the Cour Carrée */
  x = X(1700); const xL = X(2440);
  B.block((x + xL) / 2, ZN(30), xL - x, 12, GY, GY + 15, '#e6dabf', MT.windows, slate);
  B.gable((x + xL) / 2, ZN(30), xL - x, 12, GY + 15, 4, slate);
  for (let px = x; px <= xL; px += 46) { B.block(px, ZN(30), 10, 16, GY, GY + 18, '#e6dabf', MT.windows); B.taper(px, ZN(30), GY + 18, 10.4, 16.4, GY + 24, 4, 8, slate); }
  B.block(X(1830), ZN(130), 64, 64, GY, GY + 16, '#e6dabf', MT.windows, slate);
  B.block(X(2080), ZN(150), 70, 10, GY, GY + 16, '#e6dabf', MT.windows, slate);
  B.taper(X(2080), ZN(110), GY, 12, 12, GY + 12, 0.5, 0.5, '#bcd6e4', MT.glass);
  K.reserve(1, x - 8, xL + 8, RW3 + 16, RW3 + 140); K.mark('the Louvre', X(2000));
  /* the Tuileries */
  for (let i = 0; i < 70; i++) { const tx = X(2460) + rng() * (X(3170) - X(2460)), tz = ZN(30) + rng() * 90; K.tree(tx, tz, pick(rng, K.S.trees), rf(rng, 1, 1.4)); }
  K.reserve(1, X(2450), X(3180), RW3, RW3 + 140); K.mark('the Tuileries', X(2800));
  /* Place de la Concorde and its obelisk */
  x = X(3286); z = ZN(277);
  B.quad([x - 40, GY + 0.2, z - 40], [x + 40, GY + 0.2, z - 40], [x + 40, GY + 0.2, z + 40], [x - 40, GY + 0.2, z + 40], '#b9ae98');
  B.block(x, z, 4, 4, GY, GY + 3, '#a89a80'); B.taper(x, z, GY + 3, 2.6, 2.6, GY + 17, 1.6, 1.6, '#c9a57a'); B.taper(x, z, GY + 17, 1.6, 1.6, GY + 19, 0, 0, gold, MT.night);
  for (const a of [-14, 14]) B.cyl(x + a, z, GY, 3, GY + 2, 3, 8, '#9ab6c4');
  K.reserve(1, x - 42, x + 42, RW3 + 12, z + 42); K.mark('the Place de la Concorde', x);
  /* the Grand Palais and its glass vault */
  x = X(3800); z = ZN(265);
  B.block(x, z, 80, 46, GY, GY + 14, '#e3d6bc', MT.windows);
  for (let i = 0; i < 7; i++) { const a0 = i / 7 * Math.PI, a1 = (i + 1) / 7 * Math.PI; B.quad([x - 38, GY + 14 + Math.sin(a0) * 12, z - Math.cos(a0) * 20], [x + 38, GY + 14 + Math.sin(a0) * 12, z - Math.cos(a0) * 20], [x + 38, GY + 14 + Math.sin(a1) * 12, z - Math.cos(a1) * 20], [x - 38, GY + 14 + Math.sin(a1) * 12, z - Math.cos(a1) * 20], '#bcd6e4', MT.glass); }
  B.cyl(x, z, GY + 14, 8, GY + 30, 2, 10, '#bcd6e4', MT.glass);
  K.reserve(1, x - 44, x + 44, z - 26, z + 26); K.mark('the Grand Palais', x);
  /* the Palais de Chaillot: two curved wings facing the tower across the river */
  x = X(5420); z = ZN(413);
  for (const a of [-1, 1]) for (let i = 0; i < 4; i++) B.block(x + a * (24 + i * 12), z - i * 6, 13, 12, GY, GY + 14, '#e8dfca', MT.windows, '#d6ccb4');
  for (let i = 0; i < 18; i++) K.tree(x + rf(rng, -18, 18), ZN(40) + rng() * 90, '#6f9a5a', 1.1);
  K.reserve(1, x - 76, x + 76, RW3, z + 12); K.mark('the Palais de Chaillot', x);
  /* the Arc de Triomphe and Sacré-Cœur far back */
  x = X(4782); z = ZN(1237);
  for (const a of [-7, 7]) B.block(x + a, z, 8, 14, GY, GY + 30, '#e3d6bc');
  B.block(x, z, 24, 14, GY + 22, GY + 32, '#e3d6bc', 0, '#cdbf9f'); K.reserve(1, x - 16, x + 16, z - 10, z + 10); K.mark('the Arc de Triomphe', x);
  x = X(2553); z = ZN(2300);
  B.cyl(x, z, GY, 120, GY + 40, 60, 12, '#8fa37a'); B.block(x, z, 26, 22, GY + 40, GY + 56, '#f1ece0', MT.windows);
  B.cyl(x, z, GY + 56, 8, GY + 66, 8, 8, '#f1ece0'); ty = dome3(B, x, z, GY + 66, 9, '#f6f2e6', 8); B.taper(x, z, ty, 2.2, 2.2, ty + 8, 0.2, 0.2, '#f6f2e6');
  for (const a of [-12, 12]) { B.cyl(x + a, z - 7, GY + 56, 3.2, GY + 62, 3.2, 6, '#f1ece0'); dome3(B, x + a, z - 7, GY + 62, 3.5, '#f6f2e6', 6); }
  K.reserve(1, x - 120, x + 120, z - 120, z + 120); K.mark('Sacré-Cœur', x);

  K.boat(X(1500), -70, 'barge'); K.boat(X(2900), 60, 'barge'); K.boat(X(4200), -40, 'other'); K.boat(X(5300), 80, 'barge'); K.boat(X(3500), -95, 'tug');
}
function parisBuilding(B, rng, S, cx, z, w, d, h) {
  const col = pick(rng, S.pal), zinc = pick(rng, ['#7d8794', '#6f7a88', '#8a93a0']);
  B.block(cx, z, w, d, GY, GY + h, col, MT.windows, zinc);
  B.block(cx, z, w + 0.8, d + 0.8, GY + h - 4.6, GY + h - 4, shade3(col, 0.82));
  B.taper(cx, z, GY + h, w, d, GY + h + 5, w - 4.5, d - 4.5, zinc, 0, 0, 0, shade3(zinc, 0.85));
  for (let i = 0, n = 1 + Math.floor(rng() * 3); i < n; i++) { const px = cx + rf(rng, -w * 0.35, w * 0.35); B.block(px, z, 1.6, 2.6, GY + h + 5, GY + h + 8, '#b9785a'); B.block(px, z, 0.8, 0.8, GY + h + 8, GY + h + 9.2, '#8a5a4a'); }
}

STYLE3.paris = {
  gen: city3Paris, seed: 1889, building: parisBuilding, synced: true, hero: 2101,
  pal: ['#ead9b8', '#e3cfa8', '#f0e2c6', '#d9c6a0', '#e6d6bc'], quay: '#c9bc9f', quayTop: '#ddd2b8', ground: '#8a917a', road: '#77726a', trees: ['#6f9a5a', '#7fa364', '#86a86c', '#b0943f'],
  /* one even Haussmann roofline on both banks: six storeys and a mansard everywhere */
  rows: [
    { z: 16, h: [13, 16], w: [18, 30], d: [16, 22], gap: [0.5, 3] },
    { z: 52, h: [13, 17], w: [20, 34], d: [18, 26], gap: [1, 4] },
    { z: 96, h: [12, 16], w: [22, 38], d: [20, 28], gap: [1, 6] },
    { z: 150, h: [12, 16], w: [24, 44], d: [22, 30], gap: [2, 8] },
    { z: 220, h: [11, 15], w: [28, 48], d: [24, 34], gap: [4, 14] },
  ],
};
