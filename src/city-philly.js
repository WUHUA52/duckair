/* ---------------- Philadelphia ----------------
   Flight line: down the Schuylkill, heading south, camera looking east at
   Center City. Positions are written in metres south of a point above the
   Girard Avenue Bridge (m), as measured along the river:
     m =  846  Boathouse Row (to 1146)        m = 2731  JFK Boulevard
     m = 1346  Fairmount Dam                  m = 2846  Market Street (City Hall on its axis)
     m = 1446  Art Museum above the Water Works   m = 3016  Chestnut Street
     m = 1696  Spring Garden Street           m = 3196  Walnut Street
     m = 2246  Vine Street Expressway         m = 3846  South Street
   The loop covers m = 760..3910 at 1.3 px per metre on the bank. Depth sets
   the layer: p = 430 / (430 + metres inland). Buildings are drawn at about
   0.8 of true perspective size so the plane keeps some sky. */
function genPhiladelphia() {
  const rng = mulberry32(1682);
  const M = new Mats();
  const L1 = mkLayer('far', 1024, 88, { dy: -4 }), L2 = mkLayer('core', 1280, 116, { dy: -3 }), L3 = mkLayer('fore', 1536, 152, { dy: -2 });
  const L4 = mkLayer('mid', 2048, 108, { dy: -1 }), L5 = mkLayer('near', 3072, 88), BK = mkLayer('bank', 4096, 64);
  const SH = mkLayer('shore', 4096, 14, { water: true, dy: 11 });
  const dyn = { blink: [], clocks: [], signs: [] };
  const landmarks = [];
  const rp = m => (m - 760) * 1.3;                       // metres -> route px
  const at = (Ly, m) => Math.round(Ly.p * rp(m));
  const bx = m => Math.round(rp(m));
  /* Market Street runs straight inland to City Hall: keep its canyon open on every layer */
  const MKT = rp(2846);
  const clear = (ra, rb) => rb < MKT - 20 || ra > MKT + 20;

  const W = winMats(M, '#3a495c'), WG = winMats(M, '#4b6884'), WD = winMats(M, '#232a36');
  const brick = [M.add('#a9553f'), M.add('#9b4b39'), M.add('#b7664c')], brickD = M.add('#8d4535');
  const corn = M.add('#e8dec9'), cornD = M.add('#bdb19a');
  const lime = [M.add('#d5c3a0'), M.add('#c8b590'), M.add('#ddd0b4')], limeD = M.add('#ad9b79');
  const glass = [M.add('#6f98bf', KG), M.add('#5b84ab', KG), M.add('#7fa6c7', KG)], glassD = M.add('#4a6f94', KG), glassL = M.add('#94b6d2', KG);
  const conc = [M.add('#cfccc4'), M.add('#bdbab2')], concD = M.add('#8f8d88'), band = M.add('#5f6672');
  const Q = quayMats(M, { wall: '#a9a59c', wallD: '#77736c', top: '#cbc6ba', leaf0: '#35593a', leaf1: '#487645', leaf2: '#6a9a55' });
  const leafFar = [M.add('#4b6a4e'), M.add('#5d7f57'), M.add('#7a9a68')];
  const leafFall = [M.add('#8a5a34'), M.add('#b8793a'), M.add('#d9a04a')];
  const grass = M.add('#5f8f4c'), grassD = M.add('#47703f'), earth = M.add('#6b5a48');

  function style(R, x, w, h, B, small) {
    const k = rng(), ch = small ? 2 : 3, wh = small ? 1 : 2, sd = Math.max(1, w >> 2);
    if (k < 0.4) {
      const m = pick(rng, lime);
      R.rect(x, B - h, w, h, m); R.rect(x + w - sd, B - h, sd, h, limeD); R.rect(x, B - h, w, 1, corn);
      winGrid(R, rng, x + 1, B - h + 2, w - 2, h - 3, W, { cw: 2, ch, ww: 1, wh, lit: 0.4 });
      if (w > 8 && rng() < 0.4) { R.rect(x + 2, B - h - 3, w - 4, 3, m); R.rect(x + 2, B - h - 3, w - 4, 1, corn); }
    } else if (k < 0.72) {
      const m = pick(rng, glass);
      R.rect(x, B - h, w, h, m); R.rect(x + w - sd, B - h, sd, h, glassD);
      for (let xx = x + 3; xx < x + w - 1; xx += 3) R.rect(xx, B - h + 1, 1, h - 1, glassL);
      winGrid(R, rng, x + 1, B - h + 2, w - 2, h - 3, WG, { cw: 3, ch, ww: 2, wh: 1, lit: 0.34 });
    } else if (k < 0.88) {
      const m = pick(rng, brick);
      R.rect(x, B - h, w, h, m); R.rect(x + w - sd, B - h, sd, h, brickD); R.rect(x, B - h, w, 1, corn);
      winGrid(R, rng, x + 1, B - h + 2, w - 2, h - 3, W, { cw: 2, ch, ww: 1, wh, lit: 0.45 });
    } else {
      const m = pick(rng, conc);
      R.rect(x, B - h, w, h, m); R.rect(x + w - sd, B - h, sd, h, concD);
      for (let y = B - h + 2; y < B - 1; y += ch) R.rect(x + 1, y, w - 2, 1, band);
      winGrid(R, rng, x + 1, B - h + 2, w - 2, h - 3, W, { cw: 2, ch, ww: 1, wh: 1, lit: 0.4, skip: 0.35 });
    }
  }
  /* generic city fabric between two positions (metres); hM(m) is a typical height in metres */
  function fabric(Ly, S, m0, m1, hM, o) {
    o = o || {};
    const R = Ly.R, B = R.h - (o.base || 0), xEnd = at(Ly, m1);
    let x = at(Ly, m0);
    while (x < xEnd) {
      const w = ri(rng, o.wMin || 6, o.wMax || 13), ra = x / Ly.p, rb = (x + w) / Ly.p;
      const h = Math.round(hM((ra + rb) / 2.6 + 760) * S * rf(rng, 0.5, 1.05));
      if (h >= 3 && clear(ra, rb) && rng() < (o.fill || 0.9)) style(R, x, w, h, B, o.small);
      x += w + (rng() < (o.gap == null ? 0.25 : o.gap) ? ri(rng, 1, 4) : 0);
    }
  }

  /* ============ L1: the far side of Center City, and City Hall ============ */
  {
    const R = L1.R, B = R.h, gnd = M.add('#7c8a86');
    R.rect(0, B - 4, R.w, 4, gnd);
    woods(R, rng, 0, at(L1, 1700), B - 2, x => 3 + 2 * Math.sin(x * 0.11) + 1.5 * Math.sin(x * 0.037), leafFar, { rMin: 1.5, rMax: 2.5 });
    fabric(L1, 0.26, 1500, 3910, curve([[1500, 14], [2300, 40], [2600, 95], [3100, 110], [3400, 80], [3750, 40], [3910, 16]]), { small: true, wMin: 4, wMax: 10 });
    fabric(L1, 0.26, 760, 1500, () => 22, { small: true, wMin: 4, wMax: 8, fill: 0.3 });
    /* City Hall: 167 m of pale stone under a dark iron crown, William Penn on top.
       Drawn about 1.25x true size so the clock tower reads at this distance. */
    const ch = M.add('#e2d6be', KF, '#e8c48a', 0.2), chD = M.add('#c3b393', KF, '#b99560', 0.08), chL = M.add('#f0e8d6', KF, '#f6dca6', 0.16);
    const iron = M.add('#56627a'), ironL = M.add('#74819a'), face = M.add('#f3ecd8', KN, '#ffe9a8', 0.9), rim = M.add('#b08a4a'), penn = M.add('#5d5140', KF, '#c9a868', 0.25);
    const cx = at(L1, 2846);
    R.rect(cx - 24, B - 14, 48, 14, ch); R.rect(cx - 24, B - 14, 48, 1, chL);
    for (const px of [cx - 26, cx + 16]) { R.rect(px, B - 18, 10, 18, ch); R.rect(px + 8, B - 18, 2, 18, chD); R.poly([px - 0.5, B - 18, px + 10.5, B - 18, px + 8.5, B - 23, px + 1.5, B - 23], iron); R.rect(px + 2, B - 23, 6, 1, ironL); }
    R.poly([cx - 7.5, B - 14, cx + 7.5, B - 14, cx + 6, B - 20, cx - 6, B - 20], iron);
    for (let x = cx - 22; x < cx + 22; x += 3) for (const y of [B - 11, B - 6]) R.rect(x, y, 1, 3, rng() < 0.5 ? pick(rng, W.on) : W.off);
    R.rect(cx - 5, B - 37, 10, 24, ch); R.rect(cx + 2, B - 37, 3, 24, chD); R.rect(cx - 5, B - 37, 1, 24, chL);
    for (let y = B - 34; y < B - 16; y += 4) { R.rect(cx - 3, y, 1, 2, chD); R.rect(cx - 1, y, 1, 2, chD); R.rect(cx + 1, y, 1, 2, limeD); }
    R.rect(cx - 6, B - 38, 12, 1, chL);
    R.rect(cx - 5, B - 46, 10, 8, ch); R.rect(cx + 3, B - 46, 2, 8, chD);
    R.disc(cx, B - 42, 3.9, rim); R.disc(cx, B - 42, 3.0, face);
    dyn.clocks.push({ L: 'far', x: cx, y: B - 42, r: 3 });
    R.rect(cx - 6, B - 47, 12, 1, chL);
    R.poly([cx - 5, B - 47, cx + 5, B - 47, cx + 3, B - 54, cx - 3, B - 54], iron);
    R.line(cx - 4, B - 48, cx - 2.5, B - 53, ironL);
    R.rect(cx - 2, B - 57, 5, 3, iron); R.rect(cx - 2, B - 57, 1, 3, ironL);
    R.rect(cx - 1, B - 62, 2, 5, penn); R.px(cx, B - 63, penn); R.px(cx + 1, B - 61, penn); R.px(cx + 2, B - 60, penn);
    landmarks.push({ L: 'far', x: cx, name: 'City Hall' });
    /* Loews (PSFS) slab with its red letters, east of City Hall */
    const ps = M.add('#cfc8ba'), psG = M.add('#3d4453'), psSign = M.add('#bd4b40', KN, '#ff4636', 1);
    const px = at(L1, 2905);
    R.rect(px, B - 38, 8, 38, ps); R.rect(px + 6, B - 38, 2, 38, psG); R.rect(px, B - 42, 8, 4, psG); R.rect(px + 1, B - 41, 6, 2, psSign);
    /* Arthaus on South Broad */
    const ax = at(L1, 3514); R.rect(ax - 4, B - 42, 7, 42, glass[2]); R.rect(ax + 1, B - 42, 2, 42, glassD); winGrid(R, rng, ax - 3, B - 40, 4, 37, WG, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.4 }); dyn.blink.push({ L: 'far', x: ax, y: B - 43 });
  }

  /* ============ L2: the core towers around 16th-18th Streets ============ */
  {
    const R = L2.R, B = R.h, gnd = M.add('#77828a'), S = 0.325;
    R.rect(0, B - 4, R.w, 4, gnd);
    woods(R, rng, 0, at(L2, 1750), B - 2, x => 4 + 2 * Math.sin(x * 0.09) + 2 * Math.sin(x * 0.031 + 1), leafFar, { rMin: 1.5, rMax: 3 });
    fabric(L2, S, 1750, 3910, curve([[1750, 18], [2350, 45], [2550, 100], [2700, 145], [3050, 145], [3250, 125], [3400, 60], [3800, 30], [3910, 16]]), { small: true, wMin: 6, wMax: 13 });
    /* Cathedral Basilica of Saints Peter and Paul: brownstone under a green copper dome */
    {
      const st = M.add('#9c7a66'), stD = M.add('#7d5f50'), cu = M.add('#6fa590', KF, '#a9e0c4', 0.12), cuD = M.add('#55887a');
      const cx = at(L2, 2353);
      R.rect(cx - 11, B - 12, 22, 12, st); R.rect(cx + 6, B - 12, 5, 12, stD);
      pediment(R, cx - 11, B - 12, 12, 4, stD);
      R.rect(cx - 5, B - 18, 10, 6, st); R.rect(cx + 3, B - 18, 2, 6, stD);
      R.ellipse(cx, B - 18, 5.6, 6.2, cu); R.rect(cx + 2, B - 22, 3, 4, cuD); R.rect(cx - 5, B - 18, 10, 1, st);
      R.rect(cx - 1, B - 27, 2, 3, st); R.rect(cx, B - 30, 1, 3, st);
    }
    /* Three Logan Square: red granite, stepping in at the top */
    {
      const g = M.add('#a4604e'), gD = M.add('#864c3e'), gL = M.add('#b9735f');
      const cx = at(L2, 2592);
      block(R, cx, 17, 56, g, gD); block(R, cx, 13, 66, g, gD); block(R, cx, 7, 73, g, gD);
      for (let x = cx - 7; x < cx + 5; x += 2) R.rect(x, B - 54, 1, 52, WD.off);
      for (let x = cx - 5; x < cx + 4; x += 2) R.rect(x, B - 64, 1, 8, WD.off);
      R.rect(cx - 8, B - 56, 17, 1, gL); R.rect(cx - 6, B - 66, 13, 1, gL); R.rect(cx - 3, B - 73, 7, 1, gL);
      winGrid(R, rng, cx - 7, B - 53, 12, 50, WD, { cw: 2, ch: 3, ww: 1, wh: 2, lit: 0.3, skip: 0.3 });
    }
    /* Comcast Center: a pale glass slab, flat-topped, with the dark notch of its crown */
    {
      const g = M.add('#93b3cb', KG), gD = M.add('#7697b2', KG), gL = M.add('#b3cee0', KG), cap = M.add('#c4dbec', KF, '#e6f3ff', 0.4), slot = M.add('#3d5673', KG);
      const cx = at(L2, 2656), h = 97;
      block(R, cx, 15, h, g, gD);
      for (let x = cx - 5; x < cx + 4; x += 3) R.rect(x, B - h + 1, 1, h - 1, gL);
      winGrid(R, rng, cx - 6, B - h + 17, 11, h - 19, WG, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.3, skip: 0.1 });
      R.rect(cx - 7, B - h, 15, 2, cap); R.rect(cx - 2, B - h + 3, 5, 11, slot); R.rect(cx - 2, B - h + 3, 1, 11, gD);
      dyn.blink.push({ L: 'core', x: cx, y: B - h - 1 });
      landmarks.push({ L: 'core', x: cx, name: 'the Comcast Center' });
    }
    /* BNY Mellon Center: stone shaft, white lattice pyramid */
    {
      const s = M.add('#b9b3a6'), sD = M.add('#98927f'), pyr = M.add('#e9ecee', KF, '#fff6d8', 0.5), pyrD = M.add('#b9c2c9');
      const cx = at(L2, 2800);
      block(R, cx, 18, 58, s, sD); block(R, cx, 14, 64, s, sD);
      for (let x = cx - 8; x < cx + 6; x += 2) R.rect(x, B - 56, 1, 54, W.off);
      winGrid(R, rng, cx - 8, B - 55, 14, 52, W, { cw: 2, ch: 3, ww: 1, wh: 2, lit: 0.32, skip: 0.2 });
      R.rect(cx - 7, B - 64, 14, 1, pyr);
      R.poly([cx - 7, B - 64, cx + 7, B - 64, cx, B - 76], pyr); R.poly([cx + 1, B - 64, cx + 7, B - 64, cx, B - 76], pyrD);
      for (let y = B - 66; y > B - 74; y -= 2) R.rect(cx - (B - 64 - y < 6 ? 4 : 2), y, 3, 1, pyrD);
      R.rect(cx, B - 80, 1, 4, pyr);
      dyn.blink.push({ L: 'core', x: cx, y: B - 81 });
    }
    /* One and Two Liberty Place: blue glass, stacked chevron gables, a spire */
    const libG = M.add('#5f83ad', KG), libGD = M.add('#4c6c92', KG), libTrim = M.add('#c9d6e2'), libLight = M.add('#dfe9f3', KN, '#eef6ff', 0.75);
    function liberty(cx, w, shaft, tiers, spire) {
      block(R, cx, w, shaft, libG, libGD);
      for (let x = cx - (w >> 1) + 1; x < cx + (w >> 1) - 1; x += 3) R.rect(x, B - shaft + 1, 1, shaft - 1, libTrim);
      winGrid(R, rng, cx - (w >> 1) + 1, B - shaft + 2, w - 2, shaft - 4, WG, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.35 });
      let y = B - shaft, tw = w;
      for (const th of tiers) {
        const tl = cx - tw / 2, gh = Math.max(3, Math.round(tw / 2.6));
        R.rect(Math.round(tl), y - th, Math.round(tw), th, libG); R.rect(Math.round(tl + tw) - 2, y - th, 2, th, libGD);
        R.poly([tl - 0.5, y - th + 0.5, tl + tw + 0.5, y - th + 0.5, cx, y - th - gh], libG);
        R.line(tl, y - th, cx - 0.5, y - th - gh, libLight); R.line(tl + tw - 1, y - th, cx, y - th - gh, libLight);
        R.line(tl + 2, y, cx - 0.5, y - gh + 1, libTrim); R.line(tl + tw - 3, y, cx, y - gh + 1, libTrim);
        y -= th; tw -= 4;
      }
      y -= 2;
      R.poly([cx - 2.5, y, cx + 2.5, y, cx, y - spire * 0.6], libTrim);
      R.rect(cx, y - spire, 1, spire, libTrim);
      dyn.blink.push({ L: 'core', x: cx, y: y - spire - 1 });
    }
    liberty(at(L2, 2893), 17, 56, [7, 6, 5], 16);
    liberty(at(L2, 2971), 17, 54, [7, 6], 8);
    landmarks.push({ L: 'core', x: at(L2, 2932), name: 'Liberty Place' });
  }

  /* ============ L3: Comcast Technology Center and the towers west of 18th ============ */
  {
    const R = L3.R, B = R.h, gnd = M.add('#727d80'), S = 0.39;
    R.rect(0, B - 4, R.w, 4, gnd);
    woods(R, rng, 0, at(L3, 1800), B - 2, x => 5 + 2.5 * Math.sin(x * 0.07) + 2 * Math.sin(x * 0.023 + 2), leafFar, { rMin: 2, rMax: 3.2 });
    fabric(L3, S, 1800, 3910, curve([[1800, 16], [2400, 40], [2560, 85], [2700, 115], [3050, 110], [3300, 105], [3420, 50], [3850, 26], [3910, 14]]), { small: true, wMin: 7, wMax: 15 });
    /* Comcast Technology Center: dark striped glass, stepping up to the tall white lantern */
    {
      const g = M.add('#4d6480', KG), gD = M.add('#3c5069', KG), gL = M.add('#7d97b3', KG), fr = M.add('#d9e2ea'), lan = M.add('#eef3f7', KN, '#ffffff', 0.85);
      const cx = at(L3, 2662);
      R.rect(cx - 9, B - 115, 7, 115, g); R.rect(cx - 2, B - 104, 8, 104, g); R.rect(cx + 6, B - 88, 4, 88, gD);
      R.rect(cx + 4, B - 104, 2, 104, gD);
      for (const x of [cx - 8, cx - 6, cx - 4, cx - 1, cx + 1, cx + 3]) R.rect(x, B - 102, 1, 100, gL);
      R.rect(cx - 9, B - 115, 7, 1, fr); R.rect(cx - 2, B - 104, 8, 1, fr); R.rect(cx + 6, B - 88, 4, 1, fr);
      for (let y = B - 96; y < B - 4; y += 14) R.rect(cx - 9, y, 15, 1, gD);
      winGrid(R, rng, cx - 8, B - 100, 14, 96, WD, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.3, skip: 0.3 });
      R.rect(cx - 8, B - 132, 4, 17, lan); R.rect(cx - 5, B - 132, 1, 17, fr); R.rect(cx - 7, B - 136, 1, 4, fr);
      dyn.blink.push({ L: 'fore', x: cx - 7, y: B - 137 });
      landmarks.push({ L: 'fore', x: cx, name: 'the Comcast Technology Center' });
    }
    /* Independence Blue Cross: a blue glass slab with a canted top */
    {
      const g = M.add('#4f7fb5', KG), gD = M.add('#3f6896', KG), gL = M.add('#77a2cf', KG);
      const cx = at(L3, 2800), h = 72;
      block(R, cx, 19, h, g, gD); R.poly([cx - 9.5, B - h, cx + 9.5, B - h, cx + 9.5, B - h - 2, cx - 3, B - h - 5], g);
      for (let y = B - h + 3; y < B - 2; y += 3) R.rect(cx - 9, y, 14, 1, gL);
      winGrid(R, rng, cx - 8, B - h + 4, 13, h - 6, WG, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.3 });
    }
    /* The Laurel, on Rittenhouse Square */
    {
      const g = M.add('#a9bccb', KG), gD = M.add('#8598a8', KG);
      const cx = at(L3, 3267);
      block(R, cx, 12, 60, g, gD); block(R, cx - 1, 9, 67, g, gD); block(R, cx - 1, 5, 72, g, gD);
      winGrid(R, rng, cx - 5, B - 65, 9, 61, WG, { cw: 2, ch: 3, ww: 1, wh: 2, lit: 0.4 });
      dyn.blink.push({ L: 'fore', x: cx - 1, y: B - 73 });
    }
  }

  /* ============ L4: Commerce Square, the Art Museum on Fairmount ============ */
  {
    const R = L4.R, B = R.h, gnd = M.add('#4f6b4a'), S = 0.52;
    R.rect(0, B - 5, R.w, 5, gnd);
    const mx = at(L4, 1446);
    /* the Philadelphian, a long tan slab behind the museum */
    { const t = M.add('#cdbb9c'), tD = M.add('#a8977b'), x0 = mx - 150; R.rect(x0, B - 40, 74, 40, t); R.rect(x0 + 58, B - 40, 16, 40, tD); for (let y = B - 38; y < B - 6; y += 3) R.rect(x0 + 1, y, 72, 1, band); winGrid(R, rng, x0 + 2, B - 37, 70, 30, W, { cw: 3, ch: 3, ww: 1, wh: 1, lit: 0.5, skip: 0.4 }); }
    woods(R, rng, 0, mx - 150, B - 3, x => 9 + 3 * Math.sin(x * 0.045) + 2.5 * Math.sin(x * 0.017 + 1), Q.leaf, { rMin: 2.5, rMax: 4 });
    /* Fairmount, the hill the museum stands on */
    R.poly([mx - 120, B, mx - 96, B - 10, mx - 70, B - 16, mx + 72, B - 16, mx + 100, B - 9, mx + 124, B], gnd);
    {
      const tan = M.add('#e0c38c', KF, '#ffd68a', 0.3), tanD = M.add('#bd9f69', KF, '#d9a85a', 0.12), tanL = M.add('#efd9a8', KF, '#ffe6ac', 0.3);
      const roof = M.add('#5d8d97'), roofL = M.add('#7fb0b6'), col = M.add('#98794a'), shadow = M.add('#7d6844');
      const cx = mx, by = B - 16;
      R.rect(cx - 66, by - 3, 132, 3, tanD); R.rect(cx - 66, by - 3, 132, 1, tanL);
      R.rect(cx - 44, by - 16, 88, 13, tan); R.rect(cx - 44, by - 17, 88, 1, roofL); R.rect(cx - 44, by - 19, 88, 2, roof);
      for (let x = cx - 42; x < cx + 43; x += 3) R.rect(x, by - 13, 1, 7, shadow);
      for (const wx of [cx - 54, cx + 54]) {
        R.rect(wx - 12, by - 19, 24, 16, tan); R.rect(wx + 8, by - 19, 4, 16, tanD);
        pediment(R, wx - 12, by - 19, 24, 6, roof, tanL); R.rect(wx - 12, by - 19, 24, 1, tanL);
        for (let x = wx - 10; x < wx + 10; x += 3) R.rect(x, by - 17, 2, 12, col);
        R.rect(wx - 12, by - 5, 24, 2, tanL);
      }
      R.rect(cx - 17, by - 23, 34, 20, tan); R.rect(cx - 17, by - 23, 34, 1, tanL);
      pediment(R, cx - 17, by - 23, 34, 7, roof, tanL);
      for (let x = cx - 15; x < cx + 15; x += 4) R.rect(x, by - 21, 2, 16, col);
      R.rect(cx - 17, by - 5, 34, 2, tanL);
      landmarks.push({ L: 'mid', x: cx, name: 'the Art Museum' });
    }
    woods(R, rng, mx - 124, mx - 72, B - 3, x => 11, Q.leaf, { rMin: 2.5, rMax: 4 });
    woods(R, rng, mx - 74, mx + 76, B - 13, x => 4, Q.leaf, { rMin: 2, rMax: 3 });
    woods(R, rng, mx + 72, at(L4, 2000), B - 3, x => 8 + 2 * Math.sin(x * 0.06), Q.leaf, { rMin: 2.5, rMax: 3.5 });
    fabric(L4, S, 1640, 2000, () => 16, { wMin: 7, wMax: 12, fill: 0.5 });
    /* Park Towne Place: four pale slabs along the Parkway */
    for (const m of [2012, 2054, 2100, 2142]) { const cx = at(L4, m); block(R, cx, 20, 32, conc[0], concD); for (let y = B - 30; y < B - 2; y += 3) R.rect(cx - 10, y, 16, 1, band); winGrid(R, rng, cx - 9, B - 30, 15, 27, W, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.5, skip: 0.5 }); }
    fabric(L4, S, 2180, 3910, curve([[2180, 30], [2500, 55], [2650, 80], [3250, 85], [3400, 45], [3850, 26], [3910, 14]]), { wMin: 9, wMax: 18 });
    /* Commerce Square: twin granite towers, one behind the other from the river */
    {
      const g = M.add('#9a9aa3'), gD = M.add('#7b7b85'), gL = M.add('#b4b4bc'), gB = M.add('#84848e');
      const tw = (cx, m, mD) => {
        block(R, cx, 18, 82, m, mD); block(R, cx, 12, 87, m, mD);
        R.poly([cx - 4.5, B - 87, cx + 4.5, B - 87, cx, B - 92], m);
        R.rect(cx - 1, B - 85, 2, 4, WD.off);
        for (let y = B - 79; y < B - 3; y += 3) R.rect(cx - 8, y, 13, 1, WD.off);
      };
      const cx = at(L4, 2766);
      tw(cx + 11, gB, gD); tw(cx, g, gD);
      R.rect(cx - 9, B - 82, 18, 1, gL);
      winGrid(R, rng, cx - 8, B - 79, 13, 75, WD, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.32, skip: 0.2 });
    }
    /* the Murano: a curved blue glass condominium */
    {
      const g = M.add('#5d90c4', KG), gD = M.add('#467099', KG), gL = M.add('#9cc3e6', KG);
      const cx = at(L4, 2812), h = 74;
      R.poly([cx - 7, B, cx + 8, B, cx + 8, B - h + 8, cx - 7, B - h], g); R.rect(cx + 4, B - h + 8, 4, h - 8, gD);
      for (let y = B - h + 7; y < B - 2; y += 3) R.rect(cx - 7, y, 11, 1, gL);
      winGrid(R, rng, cx - 6, B - h + 9, 10, h - 11, WG, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.45 });
    }
  }

  /* ============ L5: the blocks just behind the river bank ============ */
  {
    const R = L5.R, B = R.h, gnd = M.add('#3f5e3e'), S = 0.62;
    R.rect(0, B - 5, R.w, 5, gnd);
    /* Lemon Hill, wooded, above Boathouse Row */
    const hill = curve([[0, 16], [70, 22], [200, 30], [330, 27], [430, 17], [520, 9], [700, 7], [900, 6], [1150, 9], [1250, 8]]);
    {
      const hx = at(L5, 990), y = B - 36, wl = M.add('#ead9a0', KF, '#ffe0a0', 0.2), rf2 = M.add('#6a5a4c');
      R.rect(hx - 8, y, 16, 10, wl); R.poly([hx - 9, y, hx + 9, y, hx + 5, y - 4, hx - 5, y - 4], rf2); R.rect(hx - 5, y - 6, 1, 2, rf2); R.rect(hx + 4, y - 6, 1, 2, rf2);
      for (const dx of [-5, -1, 3]) R.rect(hx + dx, y + 3, 2, 3, dx === -1 ? W.off : W.on[0]);
    }
    woods(R, rng, 0, at(L5, 1720), B - 3, x => hill(x) + 2 * Math.sin(x * 0.05) + 1.5 * Math.sin(x * 0.19), Q.leaf, { rMin: 3, rMax: 5.5 });
    for (let i = 0; i < 22; i++) { const x = ri(rng, 0, at(L5, 1180)); const h = hill(x); if (h > 12) tree(R, x, B - h * 0.5, ri(rng, 3, 5), Q, rng() < 0.5 ? leafFall : Q.leaf); }
    /* Spring Garden to Vine: Paine's Park, low blocks */
    woods(R, rng, at(L5, 1720), at(L5, 2260), B - 3, x => 7 + 2 * Math.sin(x * 0.08), Q.leaf, { rMin: 3, rMax: 4.5 });
    fabric(L5, S, 1760, 2240, () => 14, { wMin: 10, wMax: 18, fill: 0.35, gap: 1 });
    fabric(L5, S, 2260, 2660, curve([[2260, 20], [2450, 34], [2660, 30]]), { wMin: 11, wMax: 20, gap: 0.6 });
    fabric(L5, S, 2930, 3240, curve([[2930, 28], [3100, 34], [3240, 26]]), { wMin: 11, wMax: 20, gap: 0.5 });
    /* Riverwalk towers at 23rd and Arch */
    {
      const g = M.add('#8fa9bd', KG), gD = M.add('#7189a0', KG), wh = M.add('#e3e6e8');
      for (const [m, w, h] of [[2688, 17, 58], [2726, 15, 44]]) {
        const cx = at(L5, m); block(R, cx, w, h, g, gD);
        for (let y = B - h; y < B - 2; y += 3) R.rect(cx - (w >> 1), y, w, 1, wh);
        winGrid(R, rng, cx - (w >> 1) + 1, B - h + 1, w - 3, h - 3, WG, { cw: 3, ch: 3, ww: 2, wh: 2, lit: 0.45 });
      }
    }
    /* PECO: the black slab with the ring of lights round its crown */
    {
      const g = M.add('#2f3a4c', KG), gD = M.add('#232c3b', KG), gL = M.add('#43526a', KG), crown = M.add('#59606c', KN, '#ffd15a', 0.8);
      const x1 = Math.round(L5.p * (MKT - 22)), w = 40, x0 = x1 - w, h = 60;
      R.rect(x0, B - h, w, h, g); R.rect(x1 - 8, B - h, 8, h, gD);
      for (let x = x0 + 2; x < x1 - 8; x += 3) R.rect(x, B - h + 7, 1, h - 7, gL);
      winGrid(R, rng, x0 + 1, B - h + 8, w - 10, h - 10, WD, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.22, skip: 0.2 });
      R.rect(x0, B - h, w, 6, gD); R.rect(x0 + 1, B - h + 1, w - 2, 4, crown);
      dyn.signs.push({ L: 'near', x: x0 + 1, y: B - h + 1, w: w - 2, h: 4, mode: 'scan', ph: 0.4 });
      R.rect(x0 + 7, B - h - 4, 12, 4, gD);
    }
    /* 2400 Market: an old warehouse base under a dark glass box */
    {
      const base = M.add('#b9a98c'), baseD = M.add('#96886f'), box = M.add('#3c4a5e', KG), boxD = M.add('#2e3a4b', KG), boxL = M.add('#566880', KG);
      const x0 = Math.round(L5.p * (MKT + 22)), w = 74;
      R.rect(x0, B - 16, w, 16, base); R.rect(x0 + w - 9, B - 16, 9, 16, baseD);
      winGrid(R, rng, x0 + 1, B - 14, w - 11, 11, W, { cw: 3, ch: 3, ww: 2, wh: 2, lit: 0.5 });
      R.rect(x0 + 2, B - 31, w - 7, 15, box); R.rect(x0 + w - 14, B - 31, 9, 15, boxD);
      for (let x = x0 + 5; x < x0 + w - 14; x += 4) R.rect(x, B - 30, 1, 13, boxL);
      winGrid(R, rng, x0 + 3, B - 29, w - 19, 12, WD, { cw: 4, ch: 3, ww: 3, wh: 1, lit: 0.5 });
    }
    /* 2400 Chestnut: the white balconied apartment tower */
    {
      const wt = M.add('#e9e6de'), wtD = M.add('#c4c0b6'), bal = M.add('#8d9097');
      const cx = at(L5, 3062), w = 32, h = 64, x0 = cx - 16;
      R.rect(x0, B - h, w, h, wt); R.rect(x0 + w - 7, B - h, 7, h, wtD);
      for (let y = B - h + 3; y < B - 2; y += 3) R.rect(x0, y, w - 7, 1, bal);
      winGrid(R, rng, x0 + 1, B - h + 4, w - 9, h - 6, W, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.5, skip: 0.25 });
      R.rect(x0 + 9, B - h - 4, 12, 4, wtD);
    }
    /* Fitler Square: brick rowhouses under street trees, a few lofts, One Riverside */
    {
      let x = at(L5, 3240); const x1 = at(L5, 3840);
      while (x < x1) {
        const w = ri(rng, 5, 7), h = ri(rng, 9, 11), m = pick(rng, brick), y = B - 4 - h;
        R.rect(x, y, w, h, m); R.rect(x, y, w, 1, corn); R.rect(x + w - 1, y + 1, 1, h - 1, brickD);
        for (let f = 0; f < 3; f++) for (const wx of [x + 1, x + w - 3]) R.rect(wx, y + 2 + f * 3, 1, 2, rng() < 0.45 ? pick(rng, W.on) : W.off);
        if (rng() < 0.3) R.rect(x + 1, y - 2, 1, 2, brickD);
        x += w;
      }
      fabric(L5, S, 3320, 3800, () => 24, { wMin: 13, wMax: 22, fill: 0.3, gap: 1 });
      const g = M.add('#6f9cc9', KG), gD = M.add('#5580ad', KG), gL = M.add('#a5c6e3', KG);
      const cx = at(L5, 3300); block(R, cx, 16, 50, g, gD);
      for (let y = B - 48; y < B - 2; y += 3) R.rect(cx - 8, y, 12, 1, gL);
      winGrid(R, rng, cx - 7, B - 47, 11, 44, WG, { cw: 3, ch: 3, ww: 2, wh: 2, lit: 0.45 });
      for (let i = 0; i < 46; i++) tree(R, ri(rng, at(L5, 3240), x1), B - 3, ri(rng, 2, 4), Q, rng() < 0.25 ? leafFall : Q.leaf);
    }
    woods(R, rng, at(L5, 3840), 3072, B - 3, x => 9 + 3 * Math.sin(x * 0.07) + (x - at(L5, 3840)) * 0.06, Q.leaf, { rMin: 3, rMax: 4.5 });
    landmarks.push({ L: 'near', x: at(L5, 3540), name: 'Fitler Square' });
  }

  /* ============ the river bank ============ */
  const B = BK.R.h;
  const XM = [1696, 2246, 2731, 2846, 3016, 3196, 3846];          // where bridges land (metres)
  const nearBridge = (x, pad) => XM.some(m => Math.abs(x - rp(m)) < pad);
  {
    const R = BK.R, DAM = bx(1346);
    const stone = M.add('#9d907f'), stoneD = M.add('#7a6f62'), stoneL = M.add('#b8ab98'), rail = M.add('#3a3d44'), ballast = M.add('#8c8780');
    /* above the dam the river runs between grassy park banks; below it, a bulkhead and the Schuylkill Banks trail */
    R.rect(0, B - 5, DAM, 2, grass); R.rect(0, B - 3, DAM, 2, grassD); R.rect(0, B - 1, DAM, 1, earth);
    R.rect(DAM, B - 5, R.w - DAM, 1, Q.top); R.rect(DAM, B - 4, R.w - DAM, 3, Q.wall); R.rect(DAM, B - 1, R.w - DAM, 1, Q.wallD);
    for (let x = DAM; x < R.w; x += 6) R.px(x + ((x / 6) & 1 ? 3 : 0), B - 3, Q.wallD);
    /* CSX tracks and the stone retaining wall behind the trail */
    R.rect(bx(2290), B - 7, bx(3850) - bx(2290), 2, ballast); R.rect(bx(2290), B - 8, bx(3850) - bx(2290), 1, rail);
    R.rect(bx(3000), B - 16, 500, 8, stone); R.rect(bx(3000), B - 16, 500, 1, stoneL);
    for (let x = bx(3000); x < bx(3000) + 500; x += 8) R.rect(x, B - 14, 1, 6, stoneD);
    /* Boathouse Row: ten Victorian club houses, every edge traced in lights */
    {
      const wall = [M.add('#ece3d1'), M.add('#d9c597'), M.add('#b9785c'), M.add('#e6d8b2'), M.add('#c9b79f'), M.add('#a8866a')];
      const roofs = [M.add('#5c4a40'), M.add('#6b3f38'), M.add('#4d5a52')], roofL = M.add('#77604f'), light = M.add('#f1e7cc', KN, '#fff4c4', 0.9), door = M.add('#3e3a3a'), dock = M.add('#b9a98a'), timber = M.add('#6a4a38');
      const lh = bx(850);
      R.rect(lh, B - 26, 5, 21, wall[0]); R.rect(lh + 4, B - 26, 1, 21, cornD); R.rect(lh - 1, B - 27, 7, 1, door); R.rect(lh + 1, B - 31, 3, 4, light); R.poly([lh - 0.5, B - 31, lh + 5.5, B - 31, lh + 2.5, B - 35], roofs[1]);
      R.rect(lh + 1, B - 20, 1, 2, door); R.rect(lh + 1, B - 13, 1, 2, door);
      let x = lh + 14;
      for (let i = 0; i < 10; i++) {
        const w = ri(rng, 28, 36), h = ri(rng, 12, 15), m = wall[(i * 5 + 1) % wall.length], rh = ri(rng, 8, 11), rfm = roofs[i % 3], y0 = B - 5;
        R.rect(x, y0 - h, w, h, m); R.rect(x + w - 3, y0 - h, 3, h, cornD);
        if (i % 4 === 1) for (let tx = x + 3; tx < x + w - 3; tx += 5) R.rect(tx, y0 - h + 1, 1, h - 7, timber);
        for (const dx of [Math.round(w * 0.3) - 4, Math.round(w * 0.7) - 4]) { R.rect(x + dx, y0 - 6, 8, 6, door); R.rect(x + dx + 4, y0 - 6, 1, 6, m); }
        for (let wx = x + 3; wx < x + w - 4; wx += 6) R.rect(wx, y0 - h + 2, 2, 3, rng() < 0.5 ? W.on[0] : W.off);
        R.rect(x, y0 - 7, w, 1, cornD);
        R.poly([x - 1, y0 - h, x + w + 1, y0 - h, x + w / 2, y0 - h - rh], rfm);
        R.line(x + 1, y0 - h - 1, x + w / 2, y0 - h - rh + 1, roofL);
        R.line(x - 1, y0 - h, x + w / 2, y0 - h - rh, light); R.line(x + w, y0 - h, x + w / 2, y0 - h - rh, light);
        R.rect(x - 1, y0 - h, 1, h, light); R.rect(x + w, y0 - h, 1, h, light); R.rect(x - 1, y0 - h, w + 2, 1, light);
        if (i % 3 !== 2) {
          const tx = x + (i % 2 ? 4 : w - 12), ty = y0 - h - rh - 3;
          R.rect(tx, ty, 8, rh + 3, m); R.rect(tx + 3, ty + 2, 2, 3, W.on[2]);
          R.poly([tx - 1, ty, tx + 9, ty, tx + 4, ty - 8], rfm);
          R.line(tx - 1, ty, tx + 3.5, ty - 7, light); R.line(tx + 8, ty, tx + 4.5, ty - 7, light);
        } else { R.rect(x + (w >> 1) - 1, y0 - h - rh - 4, 2, 5, brickD); }
        SH.R.rect(x + 2, 3, w - 4, 1, dock); SH.R.rect(x + 2, 4, w - 4, 1, Q.wallD);
        x += w + ri(rng, 2, 4);
      }
      landmarks.push({ L: 'bank', x: bx(1000), name: 'Boathouse Row' });
    }
    /* Fairmount Water Works: white temple pavilions on a stone terrace at the dam */
    {
      const wt = M.add('#efe9dc', KF, '#fff0c8', 0.3), wtD = M.add('#cfc7b6', KF, '#d9c08c', 0.12), rf2 = M.add('#8d8f8a'), arch = M.add('#4a4f55'), ter = M.add('#cdc4b2'), terD = M.add('#a79e8c');
      const x0 = bx(1436), Wd = 186;
      R.rect(x0, B - 11, Wd, 11, ter); R.rect(x0, B - 11, Wd, 1, wt); R.rect(x0, B - 2, Wd, 2, terD);
      for (let x = x0 + 9; x < x0 + Wd - 8; x += 12) { R.rect(x, B - 6, 6, 6, arch); R.px(x, B - 6, ter); R.px(x + 5, B - 6, ter); }
      for (let x = x0; x < x0 + Wd; x += 2) R.px(x, B - 12, wt);
      const temple = (x, w, h, base) => { R.rect(x, base - h, w, h, wt); R.rect(x + w - 2, base - h, 2, h, wtD); pediment(R, x, base - h, w, Math.max(3, Math.round(w / 4.5)), rf2, wt); for (let c = x + 2; c < x + w - 2; c += 3) R.rect(c, base - h + 1, 1, h - 1, arch); };
      temple(x0 + 8, 30, 14, B - 11);
      R.rect(x0 + 46, B - 19, 92, 8, wt); R.rect(x0 + 46, B - 20, 92, 1, wtD);
      for (let x = x0 + 49; x < x0 + 136; x += 5) R.rect(x, B - 17, 3, 6, arch);
      for (let x = x0 + 46; x < x0 + 138; x += 2) R.px(x, B - 21, wt);
      temple(x0 + 48, 14, 8, B - 20); temple(x0 + 122, 14, 8, B - 20);
      temple(x0 + 144, 17, 12, B - 11);
      R.rect(x0 + 168, B - 19, 11, 8, wt); for (const c of [x0 + 170, x0 + 173, x0 + 176]) R.rect(c, B - 18, 1, 7, arch); R.ellipse(x0 + 173.5, B - 19, 6.5, 4, rf2); R.rect(x0 + 168, B - 19, 11, 1, wt); R.rect(x0 + 173, B - 25, 1, 3, rf2);
      landmarks.push({ L: 'bank', x: x0 + 150, name: 'the Fairmount Water Works' });
    }
    /* bridge abutments: stone shoulders where each bridge meets the bank */
    const ab = (m, w, h, mm, mD, mL) => { const r = bx(m); R.rect(r - w / 2 - 3, B - h - 1, w + 6, h + 1, mm); R.rect(r + w / 2, B - h - 1, 3, h + 1, mD); R.rect(r - w / 2 - 3, B - h - 2, w + 6, 1, mL); };
    ab(1696, 18, 12, stone, stoneD, stoneL); ab(2246, 28, 13, conc[1], concD, conc[0]);
    const mk = M.add('#cbbfa8'), mkD = M.add('#a79b84'), mkL = M.add('#e0d6c2');
    ab(2731, 22, 11, mk, mkD, mkL); ab(2846, 22, 10, mk, mkD, mkL);
    for (const px of [bx(2846) - 17, bx(2846) + 14]) { R.rect(px, B - 24, 3, 13, mk); R.rect(px + 2, B - 24, 1, 13, mkD); R.rect(px - 1, B - 25, 5, 1, mkL); R.rect(px, B - 28, 3, 3, stoneD); R.px(px + 3, B - 27, stoneD); }
    ab(3016, 15, 11, stone, stoneD, stoneL); ab(3196, 16, 12, stone, stoneD, stoneL); ab(3846, 20, 13, conc[1], concD, conc[0]);
    /* trees, lamps and the trail */
    let x = 6;
    const rowEnd = bx(1150), worksA = x0w => 0;
    while (x < R.w) {
      const inRow = x > bx(840) && x < bx(1165), inWorks = x > bx(1425) && x < bx(1590), north = x < DAM;
      if (!inRow && !inWorks && !nearBridge(x, 24) && clear(x - 7, x + 7)) {
        const fall = rng() < (north ? 0.3 : 0.15);
        tree(R, x, B - 5, ri(rng, north ? 5 : 4, north ? 8 : 6), Q, fall ? leafFall : Q.leaf);
      }
      x += north ? ri(rng, 11, 26) : (x > bx(3200) && x < bx(3840) ? ri(rng, 10, 18) : ri(rng, 16, 36));
    }
    for (let lx = 14; lx < R.w; lx += 40) if (!nearBridge(lx, 18) && !(lx > bx(1430) && lx < bx(1585)) && !(lx > bx(840) && lx < bx(1165))) lampPost(R, lx, B - 5, 8, Q.post, Q.lamp);
    /* Schuylkill Banks boardwalk, out over the water from Locust Street to South Street */
    {
      const deck = M.add('#b7a98f'), pile = M.add('#6f675c'), S2 = SH.R, a = bx(3350), n = bx(3825) - a;
      S2.rect(a, 1, n, 2, deck); S2.rect(a, 3, n, 1, pile);
      for (let px = a + 2; px < a + n; px += 10) S2.rect(px, 4, 1, 5, pile);
      for (let px = a; px < a + n; px += 3) S2.px(px, 0, rail);
      for (let px = a + 14; px < a + n; px += 44) { S2.px(px, 0, Q.lamp); }
    }
  }

  /* ============ the bridges, each crossing toward the camera ============ */
  const steel = M.add('#4f8f8a'), steelD = M.add('#3b6f6b'), blue = M.add('#4a78a8'), blueD = M.add('#375c84');
  const road = M.add('#5c5f66'), stone2 = M.add('#9d907f'), stone2D = M.add('#7a6f62'), brown = M.add('#8a6a55'), brownD = M.add('#6d5343'), ballast2 = M.add('#8c8780');
  const cc = M.add('#b5b1a8'), ccD = M.add('#8f8b83'), mkS = M.add('#cbbfa8'), mkSD = M.add('#a79b84'), foam = M.add('#eef5f8'), foamD = M.add('#bcd0dc');
  const lampM = M.add('#f1e2b6', KN, '#ffe08a', 0.8), railM = M.add('#33363d');
  const walk = M.add('#a9a59c'), mark = M.add('#d9d2b8');
  /* the South Street Bridge's four lantern pylons */
  const pyl = { s: M.add('#b5b1a8'), d: M.add('#8f8b83'), L: lampM, k: railM };
  const sprites = [rasterFromRows(['.LLL.', '.LLL.', 'kkkkk', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', '.ssd.', 'sssdd', 'sssdd'], pyl)];
  const pylons = [];
  for (const z of [120, 195]) for (const lat of [-12, 12]) pylons.push({ z, lat, spr: 0, base: 13 });
  const crossings = [
    { name: 'Fairmount Dam', r: rp(1346), w: 6, h: 1.5, th: 1.5, top: foam, side: foamD, rail: foam },
    { name: 'the Spring Garden Street Bridge', r: rp(1696), w: 18, h: 12, th: 3, pw: 4, piers: [50, 120, 190, 260], top: road, walk, mark, side: blue, pier: stone2, rail: blueD, lamp: lampM, lampEvery: 30 },
    { name: 'the Vine Street Expressway', r: rp(2246), w: 28, h: 13, th: 2, pw: 4, piers: [40, 100, 160, 220, 280], top: road, mark, side: cc, pier: ccD, rail: ccD },
    { name: 'the JFK Boulevard Bridge', r: rp(2731), w: 22, h: 11, th: 2, pw: 6, piers: [50, 125, 200, 275], arch: 28, top: road, walk, mark, side: mkS, pier: mkSD, rail: mkSD, lamp: lampM, lampEvery: 28 },
    { name: 'the Market Street Bridge', r: rp(2846), w: 22, h: 10, th: 2, pw: 6, piers: [50, 125, 200, 275], arch: 28, top: road, walk, mark, side: mkS, pier: mkSD, rail: mkSD, lamp: lampM, lampEvery: 24 },
    { name: 'the Chestnut Street Bridge', r: rp(3016), w: 15, h: 11, th: 3, pw: 5, piers: [50, 125, 200, 275], top: road, walk, mark, side: steel, pier: stone2, rail: steelD, lamp: lampM, lampEvery: 30 },
    { name: 'the Walnut Street Bridge', r: rp(3196), w: 16, h: 12, th: 3, pw: 5, piers: [50, 125, 200, 275], top: road, walk, mark, side: steel, pier: stone2D, rail: steelD, lamp: lampM, lampEvery: 30 },
    { name: 'the South Street Bridge', r: rp(3846), w: 20, h: 13, th: 2, pw: 5, piers: [45, 120, 195, 270], top: road, walk, mark, side: cc, pier: ccD, rail: railM, lamp: lampM, lampEvery: 22, towers: pylons,
      lines: [{ m: railM, pts: hangLine(120, 26, 195, 26, 5, -12, 8) }, { m: railM, pts: hangLine(120, 26, 195, 26, 5, 12, 8) }] },
  ];

  /* boats, a freight train and the sprites that move */
  const bm = {
    h: M.add('#c8473a'), w: M.add('#ece6d8'), k: M.add('#2f2d33'), K: M.add('#1f1e23'), o: M.add('#d9c08a'),
    b: M.add('#34497a'), p: M.add('#e3b48c'), W: M.add('#3c4656', KW, '#ffd27a', 0.4), L: M.add('#e9e2c8', KN, '#ffef9a', 0.9),
    s: M.add('#f3efe4'), S: M.add('#d6d0c2'), m: M.add('#8a6a4a'), r: M.add('#d24a3c'), g: M.add('#9aa2ad'), c: M.add('#c9ccd2'),
    B: M.add('#2f63b8'), R: M.add('#c43b35'), Y: M.add('#e0b23c'), G: M.add('#4d7a55'), n: M.add('#7b4a36'),
  };
  const shellA = ['....p...p...p...p...p...p...p...p.....p', '....b...b...b...b...b...b...b...b.....b', 'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh', '...o...o...o...o...o...o...o...o.......', '..o...o...o...o...o...o...o...o........'];
  const shellB = ['....p...p...p...p...p...p...p...p.....p', '....b...b...b...b...b...b...b...b.....b', 'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh', '.....o...o...o...o...o...o...o...o.....', '......o...o...o...o...o...o...o...o....'];
  const scull = ['....p.......', '....b.......', 'wwwwwwwwwwww', '..o...o.....'];
  const tug = ['.........kk.........', '.........RR.........', '.......wwwwww.......', '.......wWwWww.......', '....wwwwwwwwwwww....', '....wWwwWwwWwwww..L.', 'rrrrrrrrrrrrrrrrrrrr', '.kkkkkkkkkkkkkkkkkk.', '..kkkkkkkkkkkkkkkk..', '...KKKKKKKKKKKKKK...'];
  /* a CSX freight: blue and yellow locomotive, box cars and a tanker */
  const train = [
    '..BBBBBBBBBBBBB....nnnnnnnnnnnnnn..GGGGGGGGGGGGGG...kkkkkkkkkkkk...nnnnnnnnnnnnnn.',
    '.BBWWBBBBBBBBBBB...nnnnnnnnnnnnnn..GGGGGGGGGGGGGG..kkkkkkkkkkkkkk..nnnnnnnnnnnnnn.',
    '.BBBBBBYYYYYYBBB...nnnnnnnnnnnnnn..GGGGGGGGGGGGGG..kkkkkkkkkkkkkk..nnnnnnnnnnnnnn.',
    'LBBBBBBYYYYYYBBBkkknnnnnnnnnnnnnnkkGGGGGGGGGGGGGGkkkkkkkkkkkkkkkkkknnnnnnnnnnnnnn.',
    '..KK.KK...KK.KK.....KK......KK......KK......KK......KK......KK......KK......KK...',
  ];
  const boats = [
    { frames: [rasterFromRows(shellA, bm), rasterFromRows(shellB, bm)], speed: 16, fps: 2.2, depth: 0.25, name: 'rowing eight' },
    { frames: [rasterFromRows(scull, bm)], speed: 12, depth: 0.5 },
    { frames: [rasterFromRows(tug, bm)], speed: 9, depth: 0.75 },
  ];
  const vehicle = { L: 'bank', x0: bx(2290), x1: bx(3850), y: B - 13, sprite: rasterFromRows(train, bm), speed: 26, idle: 14 };
  return {
    id: 'philadelphia', name: 'Philadelphia', meta: '39.95° N · 75.17° W', river: 'Schuylkill River',
    M, layers: [L1, L2, L3, L4, L5, BK, SH], crossings, sprites, camD: 360, J0: 40, cloudAfter: 0,
    hero: { r: rp(2800), p: L2.p }, dyn, landmarks, boats, vehicle,
  };
}
