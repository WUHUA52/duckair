/* ---------------- Paris ----------------
   Flight line: west, down the Seine (downstream), camera looking south at the
   Left Bank; east is screen-left. The loop starts east of Pont de Sully
   (Jardin Tino-Rossi), then the camera is in the river's northern arm, so the
   far bank is the north face of the Île Saint-Louis and the Île de la Cité.
   Every position in this file is s, metres along the Seine from Pont de Sully,
   projected from lat/lon onto the river's centre line; route px = (s + 150) * 0.64:
     s  515 rp  426  Pont Louis-Philippe      s 2443 rp 1660  Pont Royal
     s  767 rp  587  Notre-Dame (+ Panthéon)  s 2669 rp 1804  Musée d'Orsay
     s  822 rp  622  Pont d'Arcole            s 2869 rp 1932  Passerelle Senghor
     s  916 rp  682  Hôtel-Dieu               s 3052 rp 2049  Sainte-Clotilde
     s  973 rp  719  Pont Notre-Dame          s 3289 rp 2201  Pont de la Concorde / Palais Bourbon
     s 1041 rp  762  Tribunal de Commerce     s 3718 rp 2476  Pont Alexandre III
     s 1116 rp  810  Pont au Change           s 3800 rp 2528  Les Invalides (dome)
     s 1195 rp  861  Sainte-Chapelle          s 3963 rp 2632  Pont des Invalides
     s 1202 rp  865  Conciergerie             s 4243 rp 2812  American Church
     s 1544 rp 1084  Pont Neuf                s 4584 rp 3030  Pont de l'Alma
     s 1664 rp 1161  Vert-Galant (tip)        s 4956 rp 3268  Passerelle Debilly
     s 1676 rp 1169  Monnaie de Paris         s 5062 rp 3336  Musée du Quai Branly
     s 1855 rp 1283  Institut / Pont des Arts s 5426 rp 3569  Pont d'Iéna
     s 2207 rp 1508  Pont du Carrousel        s 5454 rp 3587  Eiffel Tower
     s 2244 rp 1532  Tour Montparnasse        s 5990 rp 3930  Pont de Bir-Hakeim
   The loop runs s = -150 .. 6250, ending in quiet Grenelle blocks before the
   Front de Seine towers. Depth inland from the quay sets the layer,
   p = 200 / (200 + metres): far .14 (Montparnasse, ~2 km: widened so the layer is wider than the screen)  dist .19 (~900 m)  mid .31
   (~450 m)  isle .5 (~200 m)  cite .625 (Notre-Dame, ~120 m behind the
   island's north quay)  near .75 (~65 m)  front .875 (the quay frontage)  bank 1.
   The camera flies about 40 m up, so a layer is lifted 28 * (1 - p) px.
   Scale: buildings are drawn about 1.3x true size (a Haussmann floor is 3 px
   on the quay frontage), distant domes 1.3-1.5x, the Eiffel Tower 1.18x
   (125 px). Notre-Dame and Eiffel share no frame across the loop seam. */
function genParis() {
  const rng = mulberry32(1889);
  const M = new Mats();
  const KPX = 0.64, LIFT = 28, SBEG = -150, SEND = 6250;
  const lay = (name, W, H) => mkLayer(name, W, H, { dy: -Math.round(LIFT * (1 - W / ROUTE)) });
  const LF = lay('far', 576, 36), LD = lay('dist', 768, 72), LM = lay('mid', 1280, 44), LI = lay('isle', 2048, 150), LC = lay('cite', 2560, 82);
  const LN = lay('near', 3072, 60), LQ = lay('front', 3584, 62), BK = mkLayer('bank', 4096, 46);
  const SH = mkLayer('shore', 4096, 14, { water: true, dy: 11 });
  const dyn = { blink: [], clocks: [], signs: [] }, landmarks = [];
  const rp = s => (s - SBEG) * KPX;                  // metres along the Seine -> route px
  const at = (Ly, s) => Math.round(Ly.p * rp(s));
  const bx = s => Math.round(rp(s));                 // on the bank layer
  const street = Ly => Math.round(9 * Ly.p);
  const B0 = Ly => Ly.R.h - street(Ly);

  /* ---- materials ---- */
  const W = winMats(M, '#4a5368');
  const stone = [M.add('#e5d7b9'), M.add('#ddcfb0'), M.add('#ebe1c9'), M.add('#d8c8a6')], stoneD = M.add('#c0af8f'), stoneL = M.add('#f3ebd8');
  const zinc = M.add('#7f8ba0'), zincD = M.add('#67728a'), zincL = M.add('#a0abbd'), slate = M.add('#59616f'), slateL = M.add('#7b8495');
  const dorm = M.add('#e9e3d6'), chim = M.add('#cfb894'), pot = M.add('#b8643f'), iron = M.add('#363740'), shop = M.add('#4d4543');
  const brick = M.add('#a85d47'), awnR = M.add('#b8463c'), awnG = M.add('#3f6e4f');
  const Q = quayMats(M, { wall: '#cbbf9f', wallD: '#a1957a', top: '#ded3b8', leaf0: '#4e6935', leaf1: '#617f40', leaf2: '#7f9c55', lamp: '#f2e3b4', lampE: '#ffd889', trunk: '#6d5c4a', post: '#2e3036', rail: '#3a3b42' });
  const leafFall = [M.add('#86753a'), M.add('#a8903f'), M.add('#c9ae58')];
  const leafFar = [M.add('#5a7048'), M.add('#6b8253'), M.add('#86996a')];
  const grass = M.add('#6f9450'), road = M.add('#8f8a80'), gnd = M.add('#7d8079');
  /* floodlit stone for the monuments */
  const fl = M.add('#e6dabf', KF, '#ffe2a6', 0.17), flD = M.add('#bfb090', KF, '#d6a865', 0.06), flL = M.add('#f4ecd9', KF, '#fff0c8', 0.15);
  const gold = M.add('#d4ad4c', KF, '#ffd36b', 0.6), goldD = M.add('#a8843a', KF, '#e8b24c', 0.3);
  const rose = M.add('#5d4f6e', KN, '#ffcf8a', 0.55);

  /* ---- the Paris block, at four levels of detail ---- */
  /* quay frontage: shops, entresol, 4-5 floors of tall windows with balconies
     on the 2nd and 5th, cornice, zinc mansard with dormers, chimney pots */
  function h3(R, x, w, B, o) {
    if (o.hotel) return hotel(R, x, w, B);
    const nf = o.nf || (o.tall ? 5 : (rng() < 0.72 ? 4 : 5)), old = o.old || o.brick;
    const m = o.brick ? brick : pick(rng, stone), top = B - 5 - nf * 3, rh = old ? 5 : (o.tall ? 5 : 4), rm = old ? slate : zinc;
    R.poly([x - 0.5, top + 0.5, x + w + 0.5, top + 0.5, x + w - (old ? 2.5 : 1.5), top - rh, x + (old ? 2.5 : 1.5), top - rh], rm);
    R.rect(x + w - 2, top - rh + 2, 1, rh - 1, old ? slateL : zincD);
    if (!old) R.rect(x + 2, top - rh, w - 4, 1, zincL);
    for (let dx = x + 2; dx < x + w - 2; dx += 3) { R.px(dx, top - 3, dorm); R.px(dx, top - 2, rng() < 0.3 ? pick(rng, W.on) : W.off); }
    if (rng() < 0.8) { R.rect(x - 1, top - rh - 2, 3, 2, chim); R.px(x - 1, top - rh - 3, pot); R.px(x + 1, top - rh - 3, pot); }
    if (w > 14 && rng() < 0.6) { const cx = x + (w >> 1); R.rect(cx, top - rh - 2, 2, 2, chim); R.px(cx, top - rh - 3, pot); }
    R.rect(x, top, w, B - top, m); R.rect(x + w - 1, top + 1, 1, B - top - 1, o.brick ? Q.trunk : stoneD);
    R.rect(x - 1, top, w + 2, 1, stoneL);
    if (o.brick) { R.rect(x, top, 1, B - top, stoneL); R.rect(x + w - 2, top, 1, B - top, stoneL); }
    /* ground floor */
    if (old) { R.rect(x, B - 3, w, 3, o.brick ? stoneL : m); for (let sx = x + 2; sx < x + w - 2; sx += 4) R.rect(sx, B - 3, 1, 3, rng() < 0.4 ? pick(rng, W.on) : shop); }
    else {
      R.rect(x, B - 3, w - 1, 3, shop);
      for (let sx = x + 1; sx < x + w - 2; sx += 3) R.rect(sx, B - 3, 2, 2, rng() < 0.55 ? pick(rng, W.on) : W.off);
    }
    R.rect(x, B - 4, w, 1, o.brick ? stoneL : stoneD);
    if (!old && rng() < 0.3) R.rect(x + 1, B - 4, Math.min(w - 2, ri(rng, 5, 9)), 1, rng() < 0.5 ? awnR : awnG);
    for (let f = 0; f < nf; f++) {
      const y = B - 7 - f * 3, lit = rng() < 0.55;
      for (let wx = x + 1; wx < x + w - 1; wx += 2) R.rect(wx, y, 1, 2, lit && rng() < 0.5 ? pick(rng, W.on) : W.off);
      if (o.brick) R.rect(x, y + 2, w, 1, stoneL);
      else if (f === 1 || (f === nf - 1 && !old)) R.rect(x, y + 2, w - 1, 1, iron);
    }
  }
  /* an hôtel particulier of the Île Saint-Louis: three tall floors in pale
     stone, a very steep slate roof with two rows of dormers, tall chimneys */
  function hotel(R, x, w, B) {
    const m = pick(rng, stone), top = B - 16, rh = ri(rng, 8, 10);
    R.poly([x - 0.5, top + 0.5, x + w + 0.5, top + 0.5, x + w - 3, top - rh, x + 3, top - rh], slate);
    R.rect(x + w - 3, top - rh + 2, 1, rh - 2, slateL); R.rect(x + 3, top - rh, w - 6, 1, slateL);
    for (let dx = x + 2; dx < x + w - 2; dx += 4) { R.rect(dx, top - 4, 2, 3, stoneL); R.px(dx, top - 3, rng() < 0.3 ? pick(rng, W.on) : W.off); }
    for (let dx = x + 5; dx < x + w - 5; dx += 6) { R.px(dx, top - 7, stoneL); R.px(dx, top - 6, W.off); }
    for (const cx of [x + 1, x + w - 3]) { R.rect(cx, top - rh - 3, 2, 4, chim); R.px(cx, top - rh - 4, pot); }
    R.rect(x, top, w, B - top, m); R.rect(x + w - 1, top, 1, B - top, stoneD); R.rect(x - 1, top, w + 2, 1, stoneL);
    for (let f = 0; f < 3; f++) {
      const y = B - 14 + f * 4, lit = rng() < 0.5;
      for (let wx = x + 1; wx < x + w - 1; wx += 3) R.rect(wx, y, 1, 3, lit && rng() < 0.5 ? pick(rng, W.on) : W.off);
    }
    R.rect(x, B - 2, w, 2, stoneD);
    if (w > 12) { const dx = x + (w >> 1) - 2; R.rect(dx, B - 5, 4, 5, iron); R.ellipse(dx + 2, B - 5, 2, 1.5, iron); }
  }
  /* the same block further back: 1 px windows on 2 px floors */
  function h2(R, x, w, B, nf, gh, rh, o) {
    const m = pick(rng, stone), top = B - gh - nf * 2 - 1, rm = o.old ? slate : zinc;
    R.rect(x + 1, top - rh, w - 2, rh, rm); R.rect(x + 1, top - rh, w - 2, 1, o.old ? slateL : zincL); R.rect(x + w - 2, top - rh + 1, 1, rh - 1, zincD);
    if (rh >= 3) for (let dx = x + 2; dx < x + w - 2; dx += 3) R.px(dx, top - 2, rng() < 0.3 ? pick(rng, W.on) : dorm);
    if (rng() < 0.7) { R.rect(x, top - rh - 1, 2, 1, chim); R.px(x, top - rh - 2, pot); }
    R.rect(x, top, w, B - top, m); R.rect(x + w - 1, top, 1, B - top, stoneD); R.rect(x, top, w, 1, stoneL);
    R.rect(x, B - gh, w - 1, gh, shop);
    for (let sx = x + 1; sx < x + w - 1; sx += 3) R.px(sx, B - gh, rng() < 0.5 ? pick(rng, W.on) : W.off);
    for (let f = 0; f < nf; f++) {
      const y = B - gh - 2 - 2 * f, lit = rng() < 0.5;
      for (let wx = x + 1; wx < x + w - 1; wx += 2) R.px(wx, y, lit && rng() < 0.5 ? pick(rng, W.on) : W.off);
      if (nf >= 4 && (f === 1 || f === nf - 1)) R.rect(x, y + 1, w - 1, 1, iron);
    }
  }
  /* distant roofs: a pale face, a zinc roof line, a few lit windows */
  function h1(R, x, w, B, fh, rh) {
    const m = pick(rng, stone);
    R.rect(x, B - fh - rh, w, rh, zinc); R.rect(x, B - fh - rh, w, 1, zincL);
    R.rect(x, B - fh, w, fh, m); R.rect(x + w - 1, B - fh, 1, fh, stoneD);
    for (let y = B - fh + 1; y < B; y += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rng() < 0.45) R.px(xx, y, rng() < 0.35 ? pick(rng, W.on) : W.off);
    if (rng() < 0.4) R.px(x + ri(rng, 0, w - 1), B - fh - rh - 1, chim);
  }
  function bldg(Ly, x, w, o) {
    const R = Ly.R, B = B0(Ly);
    if (Ly === LQ) h3(R, x, w, B, o);
    else if (Ly === LN) h2(R, x, w, B, o.nf || (o.tall ? 6 : (rng() < 0.8 ? 5 : 4)), 3, 3, o);
    else if (Ly === LC) h2(R, x, w, B, o.nf || 4, 2, 3, o);
    else if (Ly === LI) h2(R, x, w, B, o.nf || 3, 2, 2, o);
    else if (Ly === LM) h1(R, x, w, B, ri(rng, 4, 6), 2);
    else if (Ly === LD) h1(R, x, w, B, ri(rng, 2, 4), 1);
    else h1(R, x, w, B, ri(rng, 1, 2), 1);
  }
  const WID = { far: [2, 5], dist: [3, 6], mid: [4, 8], isle: [7, 13], cite: [8, 15], near: [10, 18], front: [12, 21] };
  /* fill a layer with blocks between two route positions, leaving `keep` open */
  function fabric(Ly, r0, r1, o) {
    o = o || {};
    const [a, b] = WID[Ly.name], keep = o.keep || [];
    let x = at(Ly, r0);
    const xe = at(Ly, r1);
    while (x < xe - 1) {
      let w = ri(rng, o.wMin || a, o.wMax || b);
      if (xe - x - w < a) w = xe - x;
      const ra = x / Ly.p, rb = (x + w) / Ly.p;
      if (!keep.some(k => rb > rp(k[0]) && ra < rp(k[1])) && rng() < (o.fill == null ? 1 : o.fill)) bldg(Ly, x, w, o);
      x += w;
    }
  }
  /* an institutional front: body, roof, window rows, pavilions */
  function palace(R, x0, x1, B, o) {
    const m = o.m || stone[0], mD = o.mD || stoneD, mL = o.mL || stoneL, h = o.h, top = B - h, rh = o.rh || 3, rm = o.rm || slate;
    const wins = (a, b, t) => { for (let y = t + 2; y + (o.wh || 2) <= B - 3; y += o.fh || 3) for (let wx = a + 2; wx < b - 2; wx += o.pitch || 3) R.rect(wx, y, 1, o.wh || 2, rng() < (o.lit == null ? 0.35 : o.lit) ? pick(rng, W.on) : W.off); };
    R.poly([x0 + 0.5, top + 0.5, x1 - 0.5, top + 0.5, x1 - 1.5 - rh * 0.4, top - rh, x0 + 1.5 + rh * 0.4, top - rh], rm);
    if (o.dormers) for (let dx = x0 + 3; dx < x1 - 3; dx += o.dormers) { R.px(dx, top - 2, mL); R.px(dx, top - 1, W.off); }
    R.rect(x0, top, x1 - x0, h, m); R.rect(x1 - 2, top, 2, h, mD); R.rect(x0 - 1, top, x1 - x0 + 2, 1, mL);
    wins(x0, x1, top);
    if (o.arcade) for (let ax = x0 + 2; ax < x1 - 3; ax += 4) { R.rect(ax, B - 3, 2, 3, iron); }
    else R.rect(x0, B - 2, x1 - x0, 1, mD);
    for (const pv of o.pav || []) {
      const [cx, w, eh, kind] = pv, px0 = Math.round(cx - w / 2), pt = top - eh;
      if (kind === 'roof') { R.poly([px0 - 0.5, pt + 0.5, px0 + w + 0.5, pt + 0.5, px0 + w - 2, pt - 4, px0 + 2, pt - 4], rm); }
      R.rect(px0, pt, w, h + eh, m); R.rect(px0 + w - 1, pt, 1, h + eh, mD); R.rect(px0 - 1, pt, w + 2, 1, mL);
      wins(px0, px0 + w, pt);
      if (kind === 'ped') pediment(R, px0, pt, w, Math.max(2, Math.round(w / 4.5)), m, mL);
      if (kind === 'attic') { R.rect(px0, pt - 2, w, 2, m); for (let sx = px0 + 1; sx < px0 + w; sx += 3) R.rect(sx, pt - 4, 1, 2, mD); }
    }
  }
  const treeAt = (R, x, base, r, fall) => tree(R, x, base, r, Q, fall ? leafFall : Q.leaf);

  /* ============ far: the low roofs of the 14th, and the Tour Montparnasse ============ */
  {
    const R = LF.R, B = B0(LF);
    R.rect(0, R.h - 3, R.w, 3, gnd);
    fabric(LF, SBEG, SEND);
    const mp = M.add('#4d5160'), mpD = M.add('#3a3d48'), mpL = M.add('#6b7282');
    const x = at(LF, 2244), h = Math.round(210 * KPX * LF.p);
    R.rect(x - 2, B - h, 5, h, mp); R.rect(x + 2, B - h, 1, h, mpD); R.rect(x - 2, B - h, 1, h, mpL); R.rect(x - 2, B - h - 1, 5, 1, mpD);
    for (let y = B - h + 2; y < B - 1; y += 2) R.px(x, y, rng() < 0.4 ? pick(rng, W.on) : mpD);
    dyn.blink.push({ L: 'far', x, y: B - h - 2 });
    landmarks.push({ L: 'far', x, name: 'the Tour Montparnasse' });
  }

  /* ============ dist: the Panthéon, Saint-Sulpice, the Dôme des Invalides, École Militaire ============ */
  {
    const R = LD.R, B = B0(LD);
    R.rect(0, R.h - 5, R.w, 5, gnd);
    fabric(LD, SBEG, SEND);
    /* Panthéon, about 4x (lead's call: it must read behind the island): portico
       block with pediment, colonnaded drum, attic, dome, lantern; ~41 px */
    let x = at(LD, 782);
    R.ellipse(x + 0.5, B - 28, 8, 8.5, fl); R.ellipse(x + 3, B - 29, 4, 7, flD); R.rect(x - 4, B - 36, 1, 3, flL);
    R.rect(x - 17, B - 14, 35, 14, fl); R.rect(x + 14, B - 14, 4, 14, flD); R.rect(x - 18, B - 14, 37, 1, flL);
    for (let wx = x - 15; wx < x + 14; wx += 4) R.rect(wx, B - 11, 1, 6, flD);
    R.rect(x - 9, B - 14, 19, 1, flL); pediment(R, x - 9, B - 14, 19, 4, fl, flL);
    R.rect(x - 9, B - 24, 19, 10, fl); R.rect(x + 7, B - 24, 3, 10, flD); R.rect(x - 10, B - 24, 21, 1, flL);
    for (let cx = x - 8; cx < x + 9; cx += 2) R.rect(cx, B - 23, 1, 8, flD);
    R.rect(x - 7, B - 28, 15, 4, fl); R.rect(x - 7, B - 28, 15, 1, flL);
    R.rect(x - 1, B - 41, 3, 5, fl); R.px(x, B - 42, flD);
    landmarks.push({ L: 'dist', x, name: 'the Panthéon' });
    /* Saint-Sulpice: two unequal towers */
    x = at(LD, 1855);
    R.rect(x - 2, B - 9, 6, 3, flD);
    R.rect(x - 5, B - 6, 11, 6, fl); for (let cx = x - 4; cx < x + 5; cx += 2) R.px(cx, B - 4, flD);
    R.rect(x - 5, B - 12, 3, 6, fl); R.rect(x - 5, B - 12, 3, 1, flL);
    R.rect(x + 3, B - 13, 3, 7, fl); R.px(x + 4, B - 14, fl); R.rect(x + 5, B - 13, 1, 7, flD);
    /* Dôme des Invalides, about 4x (lead's call): church, columned drum, attic,
       gilded ribbed dome, lantern and spire; ~54 px, framed by the open Esplanade */
    x = at(LD, 3801);
    R.rect(x - 15, B - 12, 31, 12, fl); R.rect(x + 12, B - 12, 4, 12, flD); R.rect(x - 16, B - 12, 33, 1, flL); pediment(R, x - 6, B - 12, 13, 3, fl, flL);
    for (let cx = x - 5; cx < x + 7; cx += 2) R.rect(cx, B - 10, 1, 8, flD);
    R.ellipse(x + 0.5, B - 26, 8.5, 12, gold);
    for (const dx of [-5, -2, 2, 5]) R.line(x + 0.5 + dx, B - 26, x + 0.5 + dx * 0.35, B - 36, goldD);
    R.rect(x - 9, B - 22, 19, 10, fl); R.rect(x + 7, B - 22, 3, 10, flD); for (let cx = x - 8; cx < x + 9; cx += 2) R.rect(cx, B - 21, 1, 7, flD);
    R.rect(x - 10, B - 22, 21, 1, flL); R.rect(x - 7, B - 26, 15, 4, fl); R.rect(x - 7, B - 26, 15, 1, flL);
    for (let cx = x - 6; cx < x + 7; cx += 3) R.px(cx, B - 24, W.off);
    R.rect(x - 1, B - 44, 3, 6, gold); R.px(x - 2, B - 40, goldD); R.px(x + 2, B - 40, goldD);
    R.rect(x, B - 52, 1, 8, gold); R.px(x, B - 53, goldD);
    landmarks.push({ L: 'dist', x, name: 'Les Invalides' });
    /* École Militaire closing the Champ-de-Mars */
    x = at(LD, 5795);
    R.rect(x - 12, B - 4, 25, 4, fl); R.rect(x - 3, B - 6, 7, 6, fl); R.ellipse(x + 0.5, B - 6, 3, 2, slate); R.rect(x - 3, B - 6, 7, 1, flL);
  }

  /* ============ mid: Saint-Germain-des-Prés, Sainte-Clotilde, the Invalides front, the Champ-de-Mars ============ */
  {
    const R = LM.R, B = B0(LM);
    R.rect(0, R.h - 6, R.w, 6, gnd);
    fabric(LM, SBEG, SEND, { keep: [[3670, 3906], [5364, 5684]] });
    woods(R, rng, at(LM, 5364), at(LM, 5684), B, x => 3 + Math.sin(x * 0.7), leafFar, { rMin: 1.2, rMax: 2 });
    /* Saint-Germain-des-Prés: the Romanesque belfry and its spire */
    let x = at(LM, 1896);
    R.rect(x - 6, B - 6, 10, 6, fl); R.rect(x - 6, B - 7, 10, 1, slate);
    R.rect(x - 1, B - 11, 4, 11, fl); R.rect(x + 2, B - 11, 1, 11, flD); R.px(x, B - 9, iron); R.px(x + 1, B - 9, iron);
    R.poly([x - 1.5, B - 11, x + 3.5, B - 11, x + 1, B - 17], slate);
    /* Sainte-Clotilde: twin Gothic spires */
    x = at(LM, 3052);
    R.rect(x - 2, B - 9, 5, 9, fl); R.poly([x - 2.5, B - 9, x + 2.5, B - 9, x, B - 12], slate);
    for (const tx of [x - 4, x + 4]) { R.rect(tx - 1, B - 11, 3, 11, fl); R.rect(tx + 1, B - 11, 1, 11, flD); R.poly([tx - 1.5, B - 11, tx + 1.5, B - 11, tx, B - 21], fl); R.px(tx, B - 12, flD); }
    landmarks.push({ L: 'mid', x, name: 'Sainte-Clotilde' });
    /* the Hôtel des Invalides closing the Esplanade */
    const cx = at(LM, 3785);
    R.rect(cx - 26, B - 7, 53, 2, slate); for (let dx = cx - 24; dx < cx + 26; dx += 3) R.px(dx, B - 7, flL);
    R.rect(cx - 26, B - 5, 53, 5, fl); for (let dx = cx - 25; dx < cx + 26; dx += 2) { R.px(dx, B - 4, W.off); R.px(dx, B - 2, rng() < 0.3 ? W.on[0] : W.off); }
    for (const px of [cx - 27, cx + 21]) { R.rect(px, B - 8, 6, 8, fl); R.rect(px, B - 9, 6, 1, slate); }
    R.rect(cx - 5, B - 9, 11, 9, fl); R.rect(cx - 2, B - 5, 5, 5, iron); R.ellipse(cx + 0.5, B - 5, 2.5, 2, iron); pediment(R, cx - 5, B - 9, 11, 2, slate);
    R.rect(cx - 26, B - 1, 53, 1, grass);
  }

  /* ============ isle: the Left Bank roofs ~200 m in, the Eiffel Tower ============ */
  const ex = at(LI, 5453);
  {
    const R = LI.R, B = B0(LI);
    R.rect(0, R.h - 8, R.w, 8, gnd);
    fabric(LI, SBEG, SEND, { keep: [[3642, 3851], [5337, 5576]] });
    for (const [a, b] of [[3642, 3851], [5337, 5576]]) { R.rect(at(LI, a), B - 1, at(LI, b) - at(LI, a), 1, grass); woods(R, rng, at(LI, a), at(LI, b), B, x => 4 + 1.5 * Math.sin(x * 0.4), leafFar, { rMin: 1.5, rMax: 2.5 }); }
    /* the Eiffel Tower, 330 m at 1.05x: 47 px across the legs, 125 px tall */
    {
      const eif = M.add('#7b5b44', KF, '#ffb84a', 0.55), eifD = M.add('#5e4433', KF, '#e09a38', 0.35), plat = M.add('#8f6d52', KF, '#ffd27a', 0.6);
      const prof = y => {
        if (y < 21.5) {
          const hw = 12.5 + 11.1 * Math.pow(1 - y / 21.5, 1.7);
          const legIn = 14.2 - 8 * (y / 21.5), arch = y < 14.7 ? 14.2 * Math.sqrt(1 - (y / 14.7) * (y / 14.7)) : 0;
          const inner = Math.min(legIn, arch);
          return { hw, inner: inner > 1.2 ? Math.min(inner, hw - 3) : 0, m: eif, e: eifD };
        }
        if (y < 23.5) return { hw: 14, solid: true, m: y < 22.5 ? eifD : plat };
        if (y < 43.7) {
          const t = (y - 23.5) / 20.2, inner = 5 * (1 - t * 1.25);
          return { hw: 7.6 + 4.6 * Math.pow(1 - t, 1.3), inner: inner > 1.2 ? inner : 0, m: eif, e: eifD };
        }
        if (y < 45.7) return { hw: 8.6, solid: true, m: plat };
        if (y < 104) { const t = (y - 45.7) / 58.3; return { hw: 1.6 + 5.4 * Math.pow(1 - t, 1.6), m: eif, e: eifD }; }
        if (y < 106) return { hw: 3, solid: true, m: plat };
        if (y < 113) return { hw: 1, solid: true, m: eifD };
        if (y < 125) return { hw: 0, solid: true, m: eifD };
        return null;
      };
      woods(R, rng, ex - 46, ex - 22, B, x => 6 + 1.5 * Math.sin(x * 0.5), Q.leaf, { rMin: 2, rMax: 3 });
      woods(R, rng, ex + 23, ex + 46, B, x => 6 + 1.5 * Math.sin(x * 0.5), Q.leaf, { rMin: 2, rMax: 3 });
      const pts = lattice(R, ex, B, 125, prof);
      dyn.sparkle = { L: 'isle', x: ex, pts: Int16Array.from(pts) };
      dyn.beacon = { x: ex, y: B - 115 };
      landmarks.push({ L: 'isle', x: ex, name: 'the Eiffel Tower' });
    }
  }

  /* ============ cite: the middle of the Île de la Cité, ~120 m behind its north quay ============ */
  {
    const R = LC.R, B = B0(LC);
    R.rect(0, R.h - 9, R.w, 9, gnd);
    fabric(LC, 0, 1640, { keep: [[656, 853], [1100, 1290]], old: true, fill: 0.85 });
    fabric(LC, 1100, 1290, { old: true, nf: 4 });
    /* Notre-Dame from the north, about 1.7x (the island's hero): rounded chevet,
       flying buttresses, the north transept rose, the rebuilt spire (~63 px), the
       twin west towers (~47 px) at the right-hand end */
    {
      const nd = M.add('#d3c6a6', KF, '#ffd890', 0.22), ndD = M.add('#ad9f80', KF, '#c99a5c', 0.1), ndL = M.add('#e6dcc4', KF, '#fff0c8', 0.24);
      const lead = M.add('#6b7380', KF, '#9db0c8', 0.08), leadL = M.add('#8c95a2', KF, '#c7d6ea', 0.12), dark = M.add('#3b3a42');
      const xw = at(LC, 809), xa = xw - 82, xt = xa + 46;
      /* choir and nave: clerestory to 22, lead roof ridge at 31 */
      R.rect(xa + 4, B - 22, xw - xa - 4, 22, nd); R.ellipse(xa + 7, B - 11, 7, 11, nd);
      R.poly([xa + 0.5, B - 22, xw, B - 22, xw, B - 31, xa + 11, B - 31], lead); R.rect(xa + 11, B - 31, xw - xa - 11, 1, leadL);
      R.line(xa + 1, B - 23, xa + 10, B - 30, leadL);
      for (let wx = xa + 5; wx < xw - 1; wx += 3) if (Math.abs(wx - xt) > 8) { R.rect(wx, B - 20, 1, 6, rng() < 0.55 ? rose : dark); R.px(wx, B - 21, ndD); }
      /* flying buttresses: pinnacled piers, flyers leaning in to the clerestory */
      for (let bx = xa + 3; bx < xw - 2; bx += 6) {
        if (Math.abs(bx - xt) < 9) continue;
        R.rect(bx, B - 17, 2, 17, ndD); R.px(bx, B - 18, ndL); R.px(bx, B - 19, ndL);
        R.line(bx + 1, B - 13, bx + 4, B - 19, ndD); R.line(bx + 1, B - 9, bx + 4, B - 14, ndD);
      }
      for (let gx = xa + 8; gx < xw; gx += 2) R.px(gx, B - 8, ndL);
      /* north transept and its rose */
      R.rect(xt - 7, B - 28, 15, 28, nd); R.rect(xt + 5, B - 28, 3, 28, ndD);
      R.poly([xt - 7.5, B - 28, xt + 8.5, B - 28, xt + 0.5, B - 37], nd); R.line(xt - 7, B - 28, xt, B - 36, ndL);
      R.disc(xt + 0.5, B - 20, 4.4, ndD); R.disc(xt + 0.5, B - 20, 3.2, rose); R.px(xt, B - 20, ndD);
      for (const px of [xt - 7, xt + 7]) { R.rect(px, B - 31, 1, 3, ndL); }
      for (const px of [xt - 4, xt + 2]) R.rect(px, B - 9, 3, 9, dark);
      /* the spire at the crossing (96 m) */
      const sx = xt + 11;
      R.rect(sx - 2, B - 41, 5, 10, lead); R.rect(sx - 2, B - 41, 1, 10, leadL);
      for (const px of [sx - 2, sx + 2]) R.px(px, B - 42, leadL);
      R.poly([sx - 2, B - 41, sx + 3, B - 41, sx + 0.5, B - 63], lead); R.line(sx, B - 42, sx + 0.5, B - 61, leadL); R.px(sx, B - 64, gold);
      /* the west front and its two square towers (69 m) */
      const t0 = xw, tw = 10, fw = 25;
      R.rect(t0, B - 31, fw, 31, nd); R.rect(t0 + fw - 3, B - 31, 3, 31, ndD);
      R.rect(t0, B - 47, tw, 16, nd); R.rect(t0 + fw - tw, B - 47, tw, 16, nd);
      R.rect(t0 + tw - 1, B - 47, 1, 16, ndD); R.rect(t0 + fw - 3, B - 47, 3, 16, ndD);
      for (const tx of [t0 + 2, t0 + 6, t0 + fw - tw + 2, t0 + fw - tw + 6]) { R.rect(tx, B - 44, 2, 11, dark); R.px(tx, B - 45, ndD); }
      R.rect(t0 - 1, B - 48, tw + 2, 1, ndL); R.rect(t0 + fw - tw - 1, B - 48, tw + 2, 1, ndL);
      for (let gx = t0; gx < t0 + fw; gx += 2) { R.px(gx, B - 32, ndL); R.px(gx, B - 13, ndD); R.px(gx, B - 12, ndL); }
      R.rect(t0, B - 31, fw, 1, ndL);
      R.disc(t0 + fw / 2, B - 22, 4.8, ndD); R.disc(t0 + fw / 2, B - 22, 3.4, rose);
      for (const px of [t0 + 2, t0 + 10, t0 + 18]) { R.rect(px, B - 9, 5, 9, dark); R.rect(px + 1, B - 10, 3, 1, dark); R.px(px + 2, B - 11, dark); }
      landmarks.push({ L: 'cite', x: xt, name: 'Notre-Dame' });
    }
    /* Saint-Louis-en-l'Île: the pierced iron spire on the Île Saint-Louis */
    { const x = at(LC, 330); R.rect(x - 4, B - 14, 9, 14, stone[1]); R.rect(x - 4, B - 16, 9, 2, slate); R.rect(x, B - 22, 2, 6, stone[1]); R.poly([x - 0.5, B - 22, x + 2.5, B - 22, x + 1, B - 31], iron); R.px(x + 1, B - 26, stone[2]); R.px(x + 1, B - 24, stone[2]); }
    /* Sainte-Chapelle: tall chapel, steep roof, gilded flèche, among the Palais roofs */
    {
      const x = at(LC, 1195);
      R.rect(x - 7, B - 16, 14, 16, fl); R.rect(x + 5, B - 16, 2, 16, flD);
      for (let wx = x - 5; wx < x + 5; wx += 3) R.rect(wx, B - 14, 1, 7, rose);
      R.poly([x - 7.5, B - 16, x + 7.5, B - 16, x + 6, B - 22, x - 6, B - 22], slate); R.rect(x - 5, B - 22, 10, 1, gold);
      R.px(x - 7, B - 17, flL); R.px(x + 6, B - 17, flL);
      R.poly([x - 1.5, B - 22, x + 1.5, B - 22, x, B - 34], slate); R.line(x, B - 23, x, B - 33, gold); R.px(x, B - 35, gold);
      landmarks.push({ L: 'cite', x, name: 'the Sainte-Chapelle' });
    }
  }

  /* ============ near: Légion d'Honneur, Quai Branly museum, gardens ============ */
  {
    const R = LN.R, B = B0(LN);
    R.rect(0, R.h - 10, R.w, 10, gnd);
    const kN = [[2798, 2878], [3635, 3858], [4844, 5191], [5337, 5576]];
    fabric(LN, SBEG, 3640, { keep: kN }); fabric(LN, 3640, SEND, { keep: kN, tall: true });
    for (const [a, b] of [[3635, 3858], [5337, 5576]]) { R.rect(at(LN, a), B - 1, at(LN, b) - at(LN, a), 1, grass); }
    woods(R, rng, at(LN, 5337), at(LN, 5576), B, x => 7 + 2 * Math.sin(x * 0.21) + 1.5 * Math.sin(x * 0.05), Q.leaf, { rMin: 2.5, rMax: 3.5 });
    for (const xx of [at(LN, 3645), at(LN, 3839)]) for (let k = 0; k < 4; k++) treeAt(R, xx + k * 3 - 4, B, 2, false);
    /* Palais de la Légion d'Honneur: the rotunda pavilion on the quai */
    {
      const x = at(LN, 2837);
      R.rect(x - 14, B - 10, 28, 10, fl); R.rect(x - 14, B - 12, 28, 2, slate); R.rect(x + 12, B - 10, 2, 10, flD);
      R.ellipse(x + 0.5, B - 13, 4.5, 3.5, slate);
      R.rect(x - 6, B - 13, 13, 13, fl); for (let cx = x - 5; cx < x + 7; cx += 2) R.rect(cx, B - 11, 1, 8, flD);
      R.rect(x - 6, B - 13, 13, 1, flL); for (let sx = x - 6; sx < x + 7; sx += 3) R.px(sx, B - 14, flD);
      woods(R, rng, x - 22, x - 14, B, () => 6, Q.leaf, { rMin: 2, rMax: 3 }); woods(R, rng, x + 15, x + 22, B, () => 6, Q.leaf, { rMin: 2, rMax: 3 });
      landmarks.push({ L: 'near', x, name: "the Légion d'Honneur" });
    }
    /* Musée du Quai Branly: long body on stilts, coloured boxes, in a garden */
    {
      const x0 = at(LN, 4885), x1 = at(LN, 5177), body = M.add('#6e3a2c'), boxes = [M.add('#b5482f'), M.add('#d39a3a'), M.add('#7d5a3a'), M.add('#c46a35')];
      for (let px = x0; px < x1; px += 6) R.rect(px, B - 6, 1, 6, iron);
      R.rect(x0, B - 13, x1 - x0, 7, body);
      for (let bx = x0 + 3; bx < x1 - 6; bx += ri(rng, 6, 10)) R.rect(bx, B - ri(rng, 14, 16), ri(rng, 3, 5), ri(rng, 5, 8), pick(rng, boxes));
      for (let wx = x0 + 2; wx < x1 - 2; wx += 4) R.px(wx, B - 9, rng() < 0.4 ? W.on[1] : W.off);
      woods(R, rng, at(LN, 4848), x0, B, () => 8, Q.leaf, { rMin: 2.5, rMax: 3.5 });
      landmarks.push({ L: 'near', x: Math.round((x0 + x1) / 2), name: 'the Musée du Quai Branly' });
    }
  }

  /* ============ front: the quay frontage, Cité and Left Bank ============ */
  {
    const R = LQ.R, B = B0(LQ), X = r => at(LQ, r);
    R.rect(0, R.h - 9, R.w, 9, gnd); R.rect(0, B, R.w, 1, road);
    /* Île Saint-Louis, the island's east tip, the Quai aux Fleurs */
    woods(R, rng, at(LQ, SBEG), at(LQ, -8), B, x => 9 + 2 * Math.sin(x * 0.17), Q.leaf, { rMin: 2.5, rMax: 4 });
    fabric(LQ, 0, 552, { hotel: true, wMin: 14 });
    for (let x = X(555); x < X(592); x += 6) treeAt(R, x, B, ri(rng, 3, 4), rng() < 0.3);
    fabric(LQ, 594, 823, { nf: 3 });
    /* Hôtel-Dieu */
    palace(R, X(837), X(969), B, { h: 16, rh: 3, dormers: 5, arcade: true, pitch: 3, pav: [[X(839) + 4, 9, 2, 'roof'], [X(902), 12, 2, 'ped'], [X(966) - 4, 9, 2, 'roof']] });
    landmarks.push({ L: 'front', x: X(902), name: "the Hôtel-Dieu" });
    /* Tribunal de Commerce and its dome on the Boulevard de Sébastopol axis */
    {
      palace(R, X(982), X(1110), B, { h: 16, rh: 3, dormers: 4, pitch: 3 });
      const x = X(1076), dm = M.add('#6f7c92', KF, '#b9c9e6', 0.1);
      R.ellipse(x + 0.5, B - 24, 6, 7, dm); for (const dx of [-3, 0, 3]) R.line(x + dx * 1.3 + 0.5, B - 24, x + dx * 0.4 + 0.5, B - 30, slateL);
      R.rect(x - 5, B - 24, 11, 8, fl); R.rect(x - 6, B - 17, 13, 1, flL); R.rect(x - 6, B - 24, 13, 1, flL);
      for (let wx = x - 4; wx < x + 5; wx += 3) R.rect(wx, B - 22, 1, 3, W.off);
      R.rect(x - 1, B - 34, 3, 4, fl); R.px(x, B - 35, iron); R.px(x, B - 36, gold);
      landmarks.push({ L: 'front', x, name: 'the Tribunal de Commerce' });
    }
    /* the Conciergerie: Tour de l'Horloge, Gothic front, twin round towers, Tour Bonbec */
    {
      const cg = M.add('#d1c6ae', KF, '#ffe6b0', 0.2), cgD = M.add('#a99e88', KF, '#c9a46a', 0.1), cgL = M.add('#e3dac6', KF, '#fff0c8', 0.24);
      const cs = M.add('#4c5362'), csL = M.add('#6c7486'), face = M.add('#2f4f8a', KN, '#7fa6ff', 0.3);
      const x0 = X(1126);
      /* Tour de l'Horloge, 1.3x */
      R.rect(x0 - 2, B - 29, 10, 29, cg); R.rect(x0 + 6, B - 29, 2, 29, cgD); R.rect(x0 - 2, B - 29, 10, 1, cgL);
      R.poly([x0 - 2.5, B - 29, x0 + 8.5, B - 29, x0 + 3, B - 42], cs); R.line(x0 - 1, B - 30, x0 + 2.5, B - 40, csL); R.px(x0 + 3, B - 43, gold);
      for (const px of [x0 - 2, x0 + 7]) R.rect(px, B - 31, 1, 2, cgL);
      R.disc(x0 + 3, B - 19, 3.4, gold); R.disc(x0 + 3, B - 19, 2.5, face);
      dyn.clocks.push({ L: 'front', x: x0 + 3, y: B - 19, r: 2 });
      for (const y of [B - 10, B - 6]) R.rect(x0 + 2, y, 1, 2, iron);
      /* the long Gothic front with its high roof and stone dormers */
      const wa = x0 + 8, wb = x0 + 41;
      R.poly([wa, B - 14, wb, B - 14, wb - 2, B - 20, wa + 2, B - 20], cs);
      for (let dx = wa + 3; dx < wb - 3; dx += 7) { R.rect(dx, B - 19, 2, 4, cgL); R.px(dx, B - 17, W.off); R.px(dx + 1, B - 17, W.off); R.px(dx, B - 20, cgL); }
      R.rect(wa, B - 14, wb - wa, 14, cg); R.rect(wa, B - 14, wb - wa, 1, cgL);
      for (let wx = wa + 2; wx < wb - 1; wx += 4) { R.rect(wx, B - 11, 1, 3, rng() < 0.3 ? W.on[0] : W.off); R.rect(wx, B - 5, 2, 5, cgD); R.px(wx, B - 6, cgD); }
      /* twin towers (César, Argent), then the 19th-century wing and Tour Bonbec */
      /* round towers with conical slate roofs, 1.4x */
      const roundT = (cx, h, cone, hw) => {
        R.rect(cx - hw, B - h, 2 * hw + 1, h, cg); R.rect(cx - hw, B - h, 1, h, cgL); R.rect(cx + hw - 2, B - h, 3, h, cgD);
        for (let mx = cx - hw; mx <= cx + hw; mx += 2) R.px(mx, B - h, cgD);
        R.rect(cx - hw - 1, B - h + 1, 2 * hw + 3, 1, cgD);
        R.poly([cx - hw - 0.5, B - h, cx + hw + 1.5, B - h, cx + 0.5, B - h - cone], cs); R.line(cx - hw + 1, B - h - 1, cx, B - h - cone + 1, csL); R.px(cx, B - h - cone - 1, cgD);
        for (const y of [B - h + 5, B - h + 13]) R.rect(cx, y, 1, 3, iron);
      };
      R.rect(wb, B - 18, 24, 18, cg); R.rect(wb, B - 18, 24, 1, cgL);
      roundT(wb + 5, 29, 13, 5); roundT(wb + 18, 29, 13, 5);
      const wc = wb + 24, wd = wc + 18;
      R.poly([wc, B - 15, wd, B - 15, wd - 2, B - 20, wc + 2, B - 20], cs);
      for (let dx = wc + 3; dx < wd - 2; dx += 5) { R.rect(dx, B - 19, 2, 3, cgL); R.px(dx, B - 18, W.off); }
      R.rect(wc, B - 15, wd - wc, 15, cg); R.rect(wc, B - 15, wd - wc, 1, cgL);
      for (let wx = wc + 2; wx < wd - 1; wx += 3) for (const y of [B - 12, B - 8]) R.rect(wx, y, 1, 2, rng() < 0.3 ? W.on[2] : W.off);
      const bx = wd + 5;
      R.rect(bx - 4, B - 25, 9, 25, cg); R.rect(bx - 4, B - 25, 1, 25, cgL); R.rect(bx + 2, B - 25, 3, 25, cgD);
      for (let mx = bx - 4; mx <= bx + 4; mx += 2) R.px(mx, B - 26, cg);
      R.poly([bx - 3.5, B - 26, bx + 4.5, B - 26, bx + 0.5, B - 35], cs);
      landmarks.push({ L: 'front', x: wb + 12, name: 'the Conciergerie' });
    }
    /* the Palais de Justice on the Quai de l'Horloge, Place Dauphine's brick houses */
    fabric(LQ, 1277, 1392, { old: true, nf: 4 });
    fabric(LQ, 1392, 1528, { brick: true, nf: 3 });
    fabric(LQ, 1528, 1594, {});
    /* Monnaie de Paris: long neoclassical front, centre with columns and an attic of statues */
    {
      const x0 = X(1594), x1 = X(1756), cx = X(1676);
      palace(R, x0, x1, B, { h: 18, rh: 3, m: fl, mD: flD, mL: flL, pitch: 3, fh: 5, wh: 3, lit: 0.3 });
      R.rect(cx - 9, B - 18, 19, 18, flL); R.rect(cx - 9, B - 20, 19, 2, fl);
      for (let c = cx - 8; c < cx + 10; c += 3) R.rect(c, B - 15, 1, 8, flD);
      for (let sx = cx - 8; sx < cx + 10; sx += 3) R.rect(sx, B - 22, 1, 2, flD);
      R.rect(cx - 2, B - 5, 5, 5, iron);
      landmarks.push({ L: 'front', x: cx, name: 'the Monnaie de Paris' });
    }
    /* Institut de France: curved wings, chapel portico, drum and gilded-ribbed dome */
    {
      const cx = X(1853), x0 = X(1762), x1 = X(1945), dm = M.add('#566378', KF, '#9fb3d6', 0.1);
      R.ellipse(cx + 0.5, B - 29, 9.5, 11, dm);
      for (const dx of [-7, -3.5, 0, 3.5, 7]) R.line(cx + 0.5 + dx, B - 29, cx + 0.5 + dx * 0.25, B - 38, gold);
      R.rect(cx - 2, B - 44, 5, 5, fl); R.rect(cx - 2, B - 44, 5, 1, flL); R.px(cx, B - 45, gold); R.px(cx, B - 46, gold); R.px(cx, B - 47, gold);
      R.rect(cx - 9, B - 29, 19, 11, fl); R.rect(cx + 7, B - 29, 3, 11, flD); R.rect(cx - 10, B - 29, 21, 1, flL);
      for (let wx = cx - 7; wx < cx + 8; wx += 3) { R.rect(wx, B - 26, 1, 5, flD); R.rect(wx + 1, B - 25, 1, 3, W.off); }
      /* wings, receding into shadow toward the centre */
      for (const [a, b, dir] of [[x0 + 12, cx - 12, 1], [cx + 13, x1 - 12, -1]]) {
        R.rect(a, B - 12, b - a, 12, fl); R.rect(a, B - 13, b - a, 1, flL); R.rect(a, B - 15, b - a, 2, slate);
        for (let px = a + 1; px < b; px += 3) { R.rect(px, B - 11, 1, 10, flL); R.rect(px + 1, B - 9, 1, 4, rng() < 0.3 ? W.on[0] : W.off); }
        const sh = dir > 0 ? b - 4 : a; R.rect(sh, B - 12, 4, 12, flD);
      }
      for (const [a, b] of [[x0, x0 + 12], [x1 - 12, x1]]) {
        R.poly([a - 0.5, B - 15, b + 0.5, B - 15, b - 2, B - 19, a + 2, B - 19], slate);
        R.rect(a, B - 15, b - a, 15, fl); R.rect(a, B - 15, b - a, 1, flL); R.rect(b - 2, B - 15, 2, 15, flD);
        for (let wx = a + 2; wx < b - 2; wx += 3) for (const y of [B - 12, B - 7]) R.rect(wx, y, 1, 3, W.off);
      }
      R.rect(cx - 12, B - 16, 25, 16, fl); R.rect(cx + 10, B - 16, 3, 16, flD);
      for (const c of [cx - 10, cx - 8, cx - 3, cx - 1, cx + 2, cx + 4, cx + 9, cx + 11]) R.rect(c, B - 14, 1, 11, flL);
      R.rect(cx - 12, B - 16, 25, 1, flL); pediment(R, cx - 12, B - 16, 25, 4, fl, flL);
      R.rect(cx - 1, B - 6, 3, 6, iron);
      landmarks.push({ L: 'front', x: cx, name: 'the Institut de France' });
    }
    /* Quai Malaquais and Quai Voltaire */
    fabric(LQ, 1948, 2208, {});
    fabric(LQ, 2212, 2441, { old: true });
    fabric(LQ, 2445, 2570, {});
    /* Musée d'Orsay: two clock pavilions, seven glazed arches under a glass barrel roof, the hotel wing */
    {
      const os = M.add('#e6d9bd', KF, '#ffe0a0', 0.18), osD = M.add('#bfae8c', KF, '#d9a85a', 0.06), osL = M.add('#f3ead6', KF, '#fff0c8', 0.15);
      const osl = M.add('#4c5565'), og = M.add('#aebfcc', KG), ofr = M.add('#3d4048'), oWin = M.add('#5e6c80', KW, '#ffd08a', 0.4), face = M.add('#efe8d6', KN, '#ffe9a8', 0.9);
      const x0 = X(2573), pw = 18, nb = 7, bw = 12, xm = x0 + pw, xn = xm + nb * bw, xh = xn + pw, xe = X(2798);
      /* the barrel roof of the old station hall */
      const mc = (xm + xn) / 2, mr = (xn - xm) / 2;
      R.ellipse(mc, B - 17, mr, 6, og);
      for (let gx = xm + 2; gx < xn - 1; gx += 4) R.line(gx, B - 17, gx, B - 17 - Math.round(6 * Math.sqrt(Math.max(0, 1 - ((gx - mc) / mr) ** 2))), ofr);
      /* main front */
      R.rect(xm, B - 17, xn - xm, 17, os); R.rect(xm - 1, B - 17, xn - xm + 2, 1, osL); R.rect(xm, B - 2, xn - xm, 2, osD);
      for (const sx of [xm + 12, Math.round(mc), xn - 12]) R.rect(sx, B - 20, 1, 3, osD);
      for (let i = 0; i < nb; i++) {
        const ax = xm + 2 + i * bw;
        R.ellipse(ax + 4, B - 11, 4.5, 3.5, oWin); R.rect(ax, B - 11, 9, 9, oWin);
        R.rect(ax + 4, B - 13, 1, 11, ofr); R.rect(ax, B - 8, 9, 1, ofr);
        R.rect(ax + 10, B - 15, 1, 13, osL);
      }
      /* clock pavilions */
      for (const px0 of [x0, xn]) {
        const cx = px0 + pw / 2;
        R.ellipse(cx, B - 21, pw / 2 + 0.5, 9, osl); R.px(cx - 4, B - 25, osL); R.px(cx + 4, B - 25, osL);
        R.rect(cx - 1.5, B - 32, 3, 3, osL); R.px(cx, B - 33, osl);
        R.rect(px0, B - 21, pw, 21, os); R.rect(px0 - 1, B - 21, pw + 2, 1, osL); R.rect(px0 + pw - 2, B - 21, 2, 21, osD);
        R.disc(cx, B - 15, 4.6, gold); R.disc(cx, B - 15, 3.7, face);
        dyn.clocks.push({ L: 'front', x: Math.round(cx), y: B - 15, r: 3 });
        for (const wx of [px0 + 3, px0 + 8, px0 + 13]) { R.rect(wx, B - 8, 2, 5, oWin); R.px(wx, B - 9, os); }
      }
      /* the hotel wing and its smaller third pavilion */
      palace(R, xh, xe, B, { h: 16, rh: 4, rm: osl, m: os, mD: osD, mL: osL, dormers: 3, pitch: 2 });
      const hx = xe - 6;
      R.ellipse(hx, B - 18, 5.5, 5, osl); R.rect(hx - 5, B - 18, 11, 18, os); R.rect(hx - 6, B - 18, 13, 1, osL); R.rect(hx + 3, B - 18, 2, 18, osD);
      landmarks.push({ L: 'front', x: Math.round(mc), name: "the Musée d'Orsay" });
    }
    /* the Légion d'Honneur's garden wall */
    R.rect(X(2801), B - 3, X(2873) - X(2801), 3, flD); R.rect(X(2801), B - 3, X(2873) - X(2801), 1, flL);
    for (let x = X(2803); x < X(2870); x += 7) treeAt(R, x, B - 3, 3, rng() < 0.3);
    fabric(LQ, 2876, 3237, {});
    /* Palais Bourbon: twelve columns under a pediment, facing the Pont de la Concorde */
    {
      const cx = X(3292);
      R.rect(cx - 34, B - 11, 96, 11, fl); R.rect(cx - 35, B - 12, 98, 1, flL); R.rect(cx + 59, B - 11, 3, 11, flD);
      for (let wx = cx - 32; wx < cx + 60; wx += 3) if (Math.abs(wx - cx) > 19) { R.rect(wx, B - 9, 1, 3, rng() < 0.3 ? W.on[2] : W.off); R.rect(wx, B - 5, 1, 3, W.off); }
      for (let bx = cx - 34; bx < cx + 62; bx += 2) R.px(bx, B - 13, flL);
      R.rect(cx - 20, B - 21, 40, 3, slate);
      R.rect(cx - 17, B - 15, 35, 12, flD);
      for (let i = 0; i < 12; i++) R.rect(cx - 16 + i * 3, B - 15, 1, 12, flL);
      R.rect(cx - 18, B - 17, 37, 2, fl); R.rect(cx - 18, B - 17, 37, 1, flL); pediment(R, cx - 18, B - 17, 37, 5, fl, flL);
      R.rect(cx - 19, B - 3, 39, 1, fl); R.rect(cx - 21, B - 2, 43, 2, flL);
      for (const sx of [cx - 25, cx - 22, cx + 22, cx + 25]) { R.rect(sx, B - 4, 2, 4, fl); R.rect(sx, B - 6, 2, 2, flD); }
      landmarks.push({ L: 'front', x: cx, name: 'the Palais Bourbon' });
    }
    fabric(LQ, 3395, 3420, {});
    /* the Quai d'Orsay ministry */
    palace(R, X(3423), X(3628), B, { h: 16, rh: 4, dormers: 4, m: fl, mD: flD, mL: flL, pitch: 3, lit: 0.45, pav: [[X(3526), 18, 3, 'ped'], [X(3428), 8, 2, 'roof'], [X(3623), 8, 2, 'roof']] });
    landmarks.push({ L: 'front', x: X(3526), name: "the Quai d'Orsay" });
    /* the Esplanade des Invalides: lawns between rows of lime trees, open to the dome */
    R.rect(X(3631), B - 1, X(3851) - X(3631), 1, grass);
    for (const [a, b] of [[3634, 3670], [3814, 3851]]) for (let x = X(a); x < X(b); x += 5) treeAt(R, x, B, 3, false);
    fabric(LQ, 3853, 4226, { tall: true });
    /* the American Church */
    {
      const x0 = X(4227), ac = stone[2];
      R.poly([x0, B - 14, x0 + 26, B - 14, x0 + 22, B - 18, x0 + 4, B - 18], slate);
      R.rect(x0, B - 14, 26, 14, ac); R.rect(x0 + 24, B - 14, 2, 14, stoneD);
      for (let wx = x0 + 12; wx < x0 + 24; wx += 3) { R.rect(wx, B - 11, 1, 6, rose); R.px(wx, B - 12, stoneD); }
      const tx = x0 + 3;
      R.rect(tx, B - 24, 6, 24, ac); R.rect(tx + 5, B - 24, 1, 24, stoneD); R.rect(tx + 2, B - 21, 2, 4, iron);
      R.px(tx, B - 25, ac); R.px(tx + 5, B - 25, ac);
      R.poly([tx - 0.5, B - 24, tx + 6.5, B - 24, tx + 3, B - 35], slate);
      R.rect(tx + 1, B - 6, 4, 6, iron);
      landmarks.push({ L: 'front', x: tx + 3, name: 'the American Church' });
    }
    fabric(LQ, 4267, 4844, { tall: true });
    /* Quai Branly: Patrick Blanc's green wall, then the glass screen in front of the museum garden */
    {
      const gx0 = X(4845), gx1 = X(4881);
      R.rect(gx0, B - 22, gx1 - gx0, 22, Q.leaf[1]); R.dither(gx0, B - 22, gx1 - gx0, 22, Q.leaf[0], 0); R.dither(gx0 + 1, B - 21, gx1 - gx0 - 2, 6, Q.leaf[2], 1);
      R.rect(gx0, B - 23, gx1 - gx0, 1, zinc);
      const ax = gx1, bx2 = X(5184), glass = M.add('#b4cbd6', KG);
      woods(R, rng, ax, bx2, B, x => 11 + 2 * Math.sin(x * 0.13), Q.leaf, { rMin: 2.5, rMax: 4 });
      R.dither(ax, B - 9, bx2 - ax, 9, glass, 0);
      for (let x = ax; x < bx2; x += 6) R.rect(x, B - 9, 1, 9, iron);
      R.rect(ax, B - 9, bx2 - ax, 1, iron);
    }
    fabric(LQ, 5187, 5344, { tall: true });
    /* the quai gardens below the Eiffel Tower */
    for (let x = X(5348); x < X(5566); x += 7) if (Math.abs(x - X(5451)) > 12) treeAt(R, x, B, ri(rng, 3, 4), rng() < 0.3);
    fabric(LQ, 5570, SEND, {});
  }

  /* ============ the river bank: two-level stone quays ============ */
  const BRs = [[515, 13], [822, 17], [973, 17], [1116, 26], [1544, 18], [1855, 9], [2207, 28], [2443, 15], [2869, 13], [3289, 30], [3718, 34], [3963, 17], [4584, 36], [4956, 7], [5426, 30], [5990, 22]];
  const BR = BRs.map(([s, w]) => [bx(s), w]);                 // landing point (bank px), deck width
  const nearBridge = (x, pad) => BR.some(([r, w]) => Math.abs(x - r) < w / 2 + pad);
  const inS = (x, a, b) => x > bx(a) && x < bx(b);
  {
    const R = BK.R, B = R.h;
    const pave = M.add('#c2b79d'), parapet = M.add('#d6cbb0'), ped = M.add('#b9ae96');
    const cite = x => inS(x, 552, 1678);
    /* lower port quay everywhere but along the Cité, where the wall drops straight into the water */
    for (let x = 0; x < R.w; x++) {
      if (cite(x)) { R.rect(x, B - 9, 1, 9, Q.wall); R.px(x, B - 1, Q.wallD); }
      else { R.px(x, B - 1, Q.wallD); R.px(x, B - 2, Q.wall); R.px(x, B - 3, pave); R.rect(x, B - 9, 1, 6, Q.wall); R.px(x, B - 4, Q.wallD); }
      R.px(x, B - 10, Q.top); R.px(x, B - 11, parapet);
    }
    for (let x = 0; x < R.w; x += 6) { const o = (x / 6) & 1 ? 3 : 0; R.px(x + o, B - 7, Q.wallD); R.px(x + 3 - o, B - 5, Q.wallD); }
    /* outfall arches */
    for (let x = 40; x < R.w; x += ri(rng, 120, 220)) if (!nearBridge(x, 10)) { R.rect(x, B - 6, 3, 2, iron); R.px(x + 1, B - 7, iron); }
    /* the Vert-Galant: the island's tip drops to a low garden of willows and planes */
    {
      const a = bx(1576), tip = bx(1678);
      R.rect(a, B - 11, tip - a + 4, 9, 0);
      R.rect(a, B - 3, tip - a - 4, 2, Q.wall); R.rect(a, B - 4, tip - a - 6, 1, grass);
      R.poly([tip - 6, B - 4, tip + 3, B - 1, tip + 3, B, tip - 6, B], Q.wall);
      R.rect(a - 2, B - 11, 3, 8, Q.wall); R.rect(a - 2, B - 11, 3, 1, Q.top);
      const willow = [M.add('#7f9a4e'), M.add('#94ad5c'), M.add('#adc274')];
      woods(R, rng, a + 2, tip - 4, B - 4, x => 13 + 4 * Math.sin((x - a) * 0.06) - Math.max(0, x - (tip - 24)) * 0.4, willow, { rMin: 3, rMax: 5 });
      treeAt(R, a + 14, B - 4, 7, false); treeAt(R, a + 34, B - 4, 6, true);
      /* Henri IV on the bridge terrace */
      const bronze = M.add('#55624f', KF, '#c9b07a', 0.25), hx = bx(1560);
      R.rect(hx - 2, B - 15, 6, 4, ped); R.rect(hx - 3, B - 15, 8, 1, parapet);
      R.rect(hx - 2, B - 18, 6, 3, bronze); R.px(hx + 4, B - 19, bronze); R.px(hx + 4, B - 18, bronze); R.px(hx - 3, B - 17, bronze);
      R.rect(hx, B - 21, 2, 3, bronze); R.px(hx, B - 22, bronze);
      landmarks.push({ L: 'bank', x: bx(1626), name: 'the Vert-Galant' });
    }
    /* bridge abutments */
    for (const [r, w] of BR) { R.rect(r - w / 2 - 2, B - 11, w + 4, 11, Q.wall); R.rect(r - w / 2 - 2, B - 11, w + 4, 1, Q.top); R.rect(r + w / 2, B - 11, 2, 11, Q.wallD); }
    /* stairs down to the port quays */
    for (const sx of [-80, 462, 2031, 2531, 2962, 3517, 4045, 4420, 4795, 5239, 5642, 5864].map(bx)) {
      if (nearBridge(sx, 14)) continue;
      for (let i = 0; i < 7; i++) R.rect(sx + i, B - 10 + i, 2, 1, parapet);
      R.line(sx, B - 12, sx + 7, B - 5, Q.rail);
    }
    /* plane trees on the upper quays, sparse along the Cité and where monuments stand */
    const open = [[1121, 1198], [1795, 1914], [2594, 2781], [3253, 3337], [3691, 3753], [5403, 5503], [1570, 1684]].map(([a, b]) => [bx(a), bx(b)]);
    let x = 6;
    while (x < R.w) {
      const isl = inS(x, -150, 552);
      if (!nearBridge(x, 9) && !open.some(o => x > o[0] && x < o[1])) treeAt(R, x, B - 11, isl ? ri(rng, 7, 9) : ri(rng, 4, 6), rng() < 0.3);
      x += isl ? ri(rng, 16, 26) : cite(x) ? ri(rng, 30, 60) : (inS(x, 2781, 5420) ? ri(rng, 15, 26) : ri(rng, 22, 44));
    }
    for (let lx = 14; lx < R.w; lx += 32) if (!nearBridge(lx, 5) && !inS(lx, 1570, 1684)) lampPost(R, lx, B - 11, 7, Q.post, Q.lamp);
    /* the bouquinistes' green boxes on the parapet, Quai Conti to Quai Voltaire */
    const bq = M.add('#3e6b4a'), bqD = M.add('#2c5037');
    for (let x = bx(1692); x < bx(2434); x += 6) if (!nearBridge(x, 6) && rng() < 0.75) { R.rect(x, B - 13, 5, 2, bq); R.rect(x, B - 13, 5, 1, bqD); }
  }

  /* ============ shore: péniches, bateaux-mouches, the vedettes at the Vert-Galant ============ */
  {
    const R = SH.R;
    const hullP = M.add('#2f3a46'), hullG = M.add('#3f5a48'), cab = M.add('#d9cdb4'), white = M.add('#f0ece2'), glassM = M.add('#9dc2d8', KG), lw = M.add('#3b4656', KW, '#ffd27a', 0.5), red = M.add('#a83b33'), plant = M.add('#5d7f3f');
    const Q2 = BK.R, QB = BK.R.h;          // shore rows 0-2 are the bank's bottom three rows
    const peniche = (x, n) => {
      const h = rng() < 0.5 ? hullP : hullG;
      R.rect(x, 1, n, 3, h); R.rect(x, 1, n, 1, rng() < 0.5 ? red : cab); R.px(x, 0, h); R.px(x + n - 1, 0, h);
      R.rect(x + 3, 0, n - 10, 1, cab);
      Q2.rect(x + 3, QB - 5, n - 10, 2, cab); Q2.rect(x + 3, QB - 6, n - 10, 1, h);
      for (let wx = x + 4; wx < x + n - 8; wx += 3) Q2.px(wx, QB - 4, rng() < 0.5 ? lw : W.off);
      Q2.rect(x + n - 6, QB - 8, 4, 5, cab); Q2.rect(x + n - 6, QB - 8, 4, 1, h); Q2.px(x + n - 5, QB - 6, lw);
      for (let px = x + 4; px < x + n - 9; px += ri(rng, 3, 6)) Q2.px(px, QB - 7, plant);
    };
    const mouche = (x, n) => {
      R.rect(x, 1, n, 3, white); R.rect(x, 2, n, 1, M.add('#2f5c8a'));
      Q2.rect(x + 2, QB - 5, n - 5, 3, glassM); for (let wx = x + 3; wx < x + n - 4; wx += 3) Q2.px(wx, QB - 4, lw);
      Q2.rect(x + 2, QB - 6, n - 5, 1, white);
    };
    const place = (sa, sb, fn, nMin, nMax) => { const b = bx(sb); let x = bx(sa); while (x < b - nMin) { const n = ri(rng, nMin, nMax); if (!nearBridge(x, 20) && !nearBridge(x + n, 20) && x + n < b) fn(x, n); x += n + ri(rng, 4, 14); } };
    place(-140, -30, peniche, 28, 36); place(430, 505, peniche, 28, 36);
    mouche(bx(1590), 26); R.rect(bx(1590) + 28, 2, 6, 1, M.add('#8a8f96'));
    place(2226, 2427, peniche, 30, 40);
    place(2892, 2976, peniche, 28, 34);
    place(3864, 3948, peniche, 28, 34);
    place(4031, 4559, peniche, 30, 44);
    place(5198, 5406, mouche, 40, 48);
    place(5462, 5559, mouche, 36, 42);
    place(5600, 5962, peniche, 30, 42);
  }

  /* ============ the bridges, each crossing toward the camera ============ */
  const bSt = M.add('#d9cdb0'), bStD = M.add('#b1a385'), bStP = M.add('#c9bea2'), deck = M.add('#6f6b66'), walkB = M.add('#bdb29a');
  const bIron = M.add('#4b5552'), bIronD = M.add('#343c3a'), bSteel = M.add('#93a19e'), bSteelD = M.add('#6d7a78'), wood = M.add('#a07c58');
  const lampB = M.add('#f3e3b4', KN, '#ffd889', 0.85), railB = M.add('#33363c'), goldB = M.add('#d9b44a', KN, '#ffd66b', 0.85);
  const metro = M.add('#5a6a62'), metroD = M.add('#3d4943');
  const spm = { g: goldB, s: bSt, d: bStD, L: M.add('#ece3cd'), k: railB, l: lampB };
  const sprites = [
    /* Pont Alexandre III: stone pylon crowned by a gilded winged horse */
    rasterFromRows(['g...g', 'gg.gg', '.ggg.', '.ggg.', '..g..', 'LLLLL', '.ssd.', '.sLd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', 'LLLLL', 'sssdd', 'sssdd', 'sssdd'], spm),
    /* Pont d'Iéna: equestrian warrior on its pedestal */
    rasterFromRows(['..L..', '.sL..', 'ssss.', 's.sss', '.s.s.', 'LLLLL', '.ssd.', '.ssd.', 'sssdd'], spm),
    /* Pont du Carrousel: tall lamp mast */
    rasterFromRows(['lll', '.k.', '.k.', '.k.', '.k.', '.k.', '.k.', '.k.', '.k.', '.k.', '.k.', '.k.', 'kkk'], spm),
  ];
  const pair = (spr, z, lat, base) => [{ z, spr, lat: -lat, base }, { z, spr, lat, base }];
  const via = [{ m: metro, pts: [[-4, 19, 0], [160, 19, 0]] }, { m: metroD, pts: [[-4, 17, 0], [160, 17, 0]] }];
  for (let z = 6; z < 140; z += 12) for (const lat of [-4, 4]) via.push({ m: metroD, pts: [[z, 9, lat], [z, 17, lat]] });
  const stoneB = (name, r, w, piers, arch, o) => Object.assign({ name, r, w, h: 10, th: 2, pw: 6, piers, arch, top: deck, walk: walkB, side: bSt, pier: bStD, rail: bStD, lamp: lampB, lampEvery: 18 }, o || {});
  const crossings = [
    stoneB('the Pont Louis-Philippe', bx(515), 13, [43, 87], 18, { pw: 5 }),
    stoneB("the Pont d'Arcole", bx(822), 17, [1, 129], 60, { pw: 5, side: bIron, rail: bIronD }),
    stoneB('the Pont Notre-Dame', bx(973), 17, [42, 88], 20, { side: bStP, rail: bIronD, lampEvery: 20 }),
    stoneB('the Pont au Change', bx(1116), 26, [43, 87], 20),
    stoneB('the Pont Neuf', bx(1544), 18, [19, 37, 56, 74, 93, 111], 8, { pw: 5, rail: bSt, lampEvery: 14 }),
    { name: 'the Pont des Arts', r: bx(1855), w: 9, h: 11, th: 1, pw: 3, piers: [16, 33, 49, 65, 81, 98, 114], arch: 7, top: wood, side: bIron, pier: bStD, rail: bIronD },
    stoneB('the Pont du Carrousel', bx(2207), 28, [43, 87], 22, { side: bStP, rail: bIronD, lampEvery: 30, towers: [...pair(2, 2, 15, 10), ...pair(2, 128, 15, 10)] }),
    stoneB('the Pont Royal', bx(2443), 15, [26, 52, 78, 104], 12, { rail: bSt, lampEvery: 20 }),
    { name: 'the Passerelle Léopold-Sédar-Senghor', r: bx(2869), w: 13, h: 11, th: 1, pw: 4, piers: [1, 129], arch: 62, top: wood, side: bSteel, pier: bStD, rail: bSteelD },
    stoneB('the Pont de la Concorde', bx(3289), 30, [26, 52, 78, 104], 12, { rail: bSt, lampEvery: 16 }),
    stoneB('the Pont Alexandre III', bx(3718), 34, [2, 128], 62, { h: 9, side: bSteel, pier: bSt, rail: railB, lamp: goldB, lampEvery: 9, towers: [...pair(0, -3, 19, 10), ...pair(0, 133, 19, 10)] }),
    stoneB('the Pont des Invalides', bx(3963), 17, [33, 65, 98], 15),
    stoneB("the Pont de l'Alma", bx(4584), 36, [18, 112], 0, { th: 3, pw: 5, side: bSteelD, rail: railB, lampEvery: 24 }),
    { name: 'the Passerelle Debilly', r: bx(4956), w: 7, h: 11, th: 1, pw: 3, piers: [30, 100], arch: 30, top: wood, side: bIron, pier: bStD, rail: bIronD },
    stoneB("the Pont d'Iéna", bx(5426), 30, [26, 52, 78, 104], 12, { rail: bSt, towers: [...pair(1, -2, 16, 10), ...pair(1, 132, 16, 10)] }),
    stoneB('the Pont de Bir-Hakeim', bx(5990), 22, [32, 65, 98], 20, { h: 9, pw: 5, side: metro, rail: metroD, lampEvery: 13, lines: via }),
  ];
  landmarks.push({ L: 'bank', x: bx(3718), name: 'the Pont Alexandre III' });
  landmarks.push({ L: 'bank', x: bx(5990), name: 'the Pont de Bir-Hakeim' });
  landmarks.push({ L: 'front', x: at(LQ, 280), name: 'the Île Saint-Louis' });

  /* boats on the move */
  const bm = {
    w: M.add('#f1eee6'), b: M.add('#2f5c8a'), g: M.add('#9dc2d8', KG), G: M.add('#7fa6bf', KG), k: M.add('#2d2b31'), K: M.add('#1e1d22'),
    W: M.add('#3b4656', KW, '#ffd27a', 0.5), L: M.add('#e9e2c8', KN, '#ffef9a', 0.9), r: M.add('#a83b33'), p: M.add('#e3b48c'), P: M.add('#5d7f3f'),
    n: M.add('#3c3434'),
  };
  const mouche = [
    '.....ggggggggggggggggggggggggggggggggggg.....', '...ggGgggGgggGgggGgggGgggGgggGgggGgggGggg....',
    '..wpwwpwwwpwwpwwwpwwpwwwpwwpwwwpwwpwwwpwwpw...', '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbL', '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.', '..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
  ];
  const peniche = [
    '.......................................wwww....', '..P.P..P.......P..P....................wWWw....',
    '.nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnwwwwwww..', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk', '.KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.',
  ];
  const vedette = ['......LL.......', '....wwWWw......', '..wwwwwwwww....', 'bbbbbbbbbbbbbbL', '.wwwwwwwwwwwww.', '..kkkkkkkkkkk..'];
  const boats = [
    { frames: [rasterFromRows(mouche, bm)], speed: 9, depth: 0.6, name: 'bateau-mouche' },
    { frames: [rasterFromRows(peniche, bm)], speed: 5, depth: 0.3 },
    { frames: [rasterFromRows(vedette, bm)], speed: 14, depth: 0.85, name: 'police launch' },
  ];
  return {
    id: 'paris', name: 'Paris', meta: '48.86° N · 2.35° E', river: 'La Seine',
    M, layers: [LF, LD, LM, LI, LC, LN, LQ, BK, SH], crossings, sprites, camD: 240, J0: 40, cloudAfter: 0,
    hero: { r: rp(5440), p: LI.p }, dyn, landmarks, boats, vehicle: null,
  };
}
