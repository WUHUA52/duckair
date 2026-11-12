/* ---------------- Tokyo ----------------
   Flight line: down the Sumida River, heading south (downstream), camera
   looking east at Sumida and Kōtō wards. North is screen-left. Positions are
   metres along the river from Sakura Bridge (m = 0), measured on the polyline
   through the bridges:
     m =    0  Sakura Bridge                m = 3130  JR Sōbu Line bridge
     m =  587  Kototoi Bridge               m = 3279  Ryōgoku Bridge
     m =  999  Tobu railway bridge          m = 3420  Shuto Route 6 crosses
     m = 1231  Azuma Bridge (Asahi)         m = 4187  Shin-Ōhashi
     m = 1637  Komagata Bridge              m = 4671  Kiyosu Bridge
     m = 2062  Umaya Bridge                 m = 5472  Eitai Bridge
     m = 2441  Kuramae Bridge               m = 6110  Chūō-Ōhashi
     m = 2832  Kokugikan                    m = 6576  River City 21, Tsukuda
   The loop covers m = -200..7677 at 0.52 px per metre on the bank (the
   river is about 6.2 km between Sakura Bridge and Chūō-Ōhashi); the last
   900 m, Tsukuda and Tsukishima south of River City 21, are kept low and
   quiet so the seam back to Sumida Park reads as a plain waterside. Depth inland
   sets the layer: p = 200 / (200 + metres inland). The fabric is drawn at
   true perspective size; Skytree, the Asahi group and the Kokugikan are
   enlarged (see the notes at each). */
function genTokyo() {
  const rng = mulberry32(1958);
  const M = new Mats();
  const KM = 0.52, M0 = -200, END = M0 + ROUTE / KM;      // END = 7677
  const rp = m => (m - M0) * KM;                         // metres -> route px
  const at = (Ly, m) => Math.round(Ly.p * rp(m));
  const bx = m => Math.round(rp(m));
  const LF = mkLayer('far', 900, 140, { dy: -4 });       // p .22  ~700 m inland: Skytree
  const LC = mkLayer('core', 1352, 70, { dy: -3 });      // p .33  ~400 m: Edo-Tokyo Museum
  const LO = mkLayer('fore', 1843, 80, { dy: -2 });      // p .45  ~245 m
  const LM = mkLayer('mid', 2335, 100, { dy: -1 });      // p .57  ~150 m: Kokugikan, ward office
  const LN = mkLayer('near', 3072, 100);                 // p .75  ~65 m: Asahi, River City 21
  const BK = mkLayer('bank', 4096, 48);
  const SH = mkLayer('shore', 4096, 14, { water: true, dy: 11 });
  const dyn = { blink: [], clocks: [], signs: [] };
  const landmarks = [];
  const sc = Ly => KM * Ly.p;                            // px per metre on a layer
  /* At 0.52 px/m true-size Tokyo is a 10 px strip hidden behind the expressway, so
     the fabric is drawn 1.9x taller and 1.3x wider than true perspective size. */
  const VX = 1.9, HX = 1.3;

  /* ---------------- materials ---------------- */
  const W = winMats(M, '#3d4656'), WG = winMats(M, '#4f6a8a');
  const tile = [M.add('#e8e4da'), M.add('#d9d7d1'), M.add('#cfc6b5'), M.add('#ebe0cd'), M.add('#c6cacf'), M.add('#d8cfc8')], tileD = M.add('#a5a39d');
  const pen = [M.add('#9b7f6b'), M.add('#80888f'), M.add('#b59c86'), M.add('#8c7166'), M.add('#a9adb2'), M.add('#6f747c'), M.add('#c3b49a')], penD = M.add('#5c5e65');
  const offc = [M.add('#aab2bb'), M.add('#9fa7ae'), M.add('#c4c7cb')], offD = M.add('#7d858e');
  const glass = [M.add('#7f9fc2', KG), M.add('#6a88ad', KG), M.add('#90aecd', KG)], glassD = M.add('#56719a', KG), glassL = M.add('#a9c3dc', KG);
  const bal = M.add('#f2f0ea'), roofK = M.add('#4a4d56'), roofKL = M.add('#666a73');
  const fac = [M.add('#93a6b5'), M.add('#a9b0b4'), M.add('#b7ad9a')], facD = M.add('#6f7d88');
  const tank = M.add('#cdd0d3'), tankD = M.add('#7c8189');
  const tarp = M.add('#3d72c4');
  const ink = M.add('#2a2530');
  const NEON = [['#d0558c', '#ff5fb0'], ['#3a9fb5', '#5ff3ff'], ['#d0ad3c', '#ffe95c'], ['#469e62', '#69ff9a'], ['#c0403b', '#ff5050'], ['#e2e2e2', '#ffffff'], ['#4562b0', '#78a0ff'], ['#d07a32', '#ffaa4a']];
  const neon = NEON.map(([c, e]) => ({ m: M.add(c, KN, e, 0.85), e }));
  const vend = [M.add('#dfe9f5', KN, '#d8ecff', 0.8), M.add('#f2e2c8', KN, '#fff0c0', 0.8)];
  const verm = M.add('#c8432f', KF, '#ff7a4a', 0.35), vermD = M.add('#9c3324');
  const Q = quayMats(M, { wall: '#a3a39d', wallD: '#7a7a75', top: '#c9c8c1', rail: '#4a5058', post: '#3a3d44', leaf0: '#3d6638', leaf1: '#4f7c46', leaf2: '#6c9b57', trunk: '#5a4440', lamp: '#e9eef2', lampE: '#fff2d6' });
  const pink = [M.add('#d97fa2'), M.add('#eda3c0'), M.add('#f9cfdf')];
  const leafFar = [M.add('#56715a'), M.add('#66825f'), M.add('#7d996c')];
  const levee = M.add('#b8b6ae'), leveeL = M.add('#d3d1ca'), grass = M.add('#6b9150');

  /* a vertical sign with kanji-like marks */
  function vsign(Ly, x, y, w, h, anim) {
    const R = Ly.R, n = pick(rng, neon);
    R.rect(x, y, w, h, n.m);
    for (let gy = y + 1; gy + 1 < y + h; gy += 3) {
      const bits = ri(rng, 1, 15);
      if (w >= 3) { R.px(x + 1, gy, ink); if (bits & 1) R.px(x, gy + 1, ink); if (bits & 2) R.px(x + 2, gy + 1, ink); if (bits & 4) R.px(x + 1, gy + 1, ink); }
      else { if (bits & 1) R.px(x, gy, ink); if (bits & 2) R.px(x + 1, gy, ink); if (bits & 4) R.px(x + (bits & 8 ? 1 : 0), gy + 1, ink); }
    }
    if (anim) dyn.signs.push({ L: Ly.name, x, y, w, h, e: hex(n.e), mode: 'blink', ph: rng() * 10 });
  }
  /* a rooftop billboard on two legs */
  function board(Ly, x, top, w, anim) {
    const R = Ly.R, n = pick(rng, neon), h = w > 8 ? 4 : 3, y = top - h - 1;
    R.px(x + 1, top - 1, tankD); R.px(x + w - 2, top - 1, tankD);
    R.rect(x, y, w, h, n.m);
    for (let bx2 = x + 1; bx2 < x + w - 1; bx2 += 2) if (rng() < 0.6) R.px(bx2, y + 1 + (rng() < 0.5 ? 0 : 1), ink);
    if (anim) dyn.signs.push({ L: Ly.name, x, y, w, h, mode: 'scan', ph: rng() * 10 });
  }
  /* the clutter on a Tokyo roof: water tanks, lift housings, AC units */
  function roof(Ly, x, w, top, det) {
    const R = Ly.R, r = rng();
    if (det < 1) { if (w > 4 && r < 0.3) R.rect(x + 1, top - 1, 2, 1, tankD); return; }
    if (w >= 5 && r < 0.3) { const tx = x + ri(rng, 1, w - 4); R.rect(tx, top - 3, 3, 2, tank); R.rect(tx + 2, top - 3, 1, 2, tankD); R.px(tx, top - 1, tankD); R.px(tx + 2, top - 1, tankD); }
    else if (w >= 5 && r < 0.55) { const ew = Math.min(4, w >> 1); R.rect(x + w - ew - 1, top - 2, ew, 2, tileD); }
    else if (r < 0.75) { for (let i = x + 1; i < x + w - 1; i += 2) if (rng() < 0.5) R.px(i, top - 1, tankD); }
    else if (w >= 6 && r < 0.86) board(Ly, x + 1, top, Math.min(w - 2, 12), det > 1 && rng() < 0.3);
    else if (r < 0.9) R.rect(x + 1, top - 1, Math.min(4, w - 2), 1, tarp);
  }
  /* one building of the fabric */
  function bld(Ly, kind, x, w, hp, det) {
    const R = Ly.R, B = R.h, top = B - hp;
    if (kind === 'man') {                       // manshon: tiled slab, balcony stripes
      const m = pick(rng, tile);
      R.rect(x, top, w, hp, m); R.rect(x + w - 1, top, 1, hp, tileD);
      if (det >= 1) {
        const pitch = det > 1 ? 3 : 2;
        for (let y = top + 1; y + 1 < B - 1; y += pitch) {
          for (let xx = x + 1; xx < x + w - 2; xx += 2) R.px(xx, y, rng() < 0.45 ? pick(rng, W.on) : W.off);
          R.rect(x, y + 1, w - 1, 1, bal);
        }
      } else for (let y = top + 1; y < B - 1; y += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rng() < 0.4) R.px(xx, y, rng() < 0.5 ? pick(rng, W.on) : W.off);
      roof(Ly, x, w, top, det);
    } else if (kind === 'pen') {               // pencil building: narrow, signs down the side
      const m = pick(rng, pen);
      R.rect(x, top, w, hp, m); R.rect(x + w - 1, top, 1, hp, penD);
      for (let y = top + 1; y < B - 1; y += 2) { R.px(x + 1, y, rng() < 0.5 ? pick(rng, W.on) : W.off); if (w > 4) R.px(x + w - 3, y, rng() < 0.5 ? pick(rng, W.on) : W.off); }
      if (det >= 1 && hp >= 8 && rng() < 0.5) { const sw = det > 1 ? 3 : 2, sh = Math.min(hp - 3, ri(rng, 6, 15)); vsign(Ly, rng() < 0.5 ? x : x + w - sw, top + 2, sw, sh, det > 1 && rng() < 0.3); }
      if (det >= 1 && rng() < 0.3 && w >= 4) board(Ly, x, top, w, false);
      else if (rng() < 0.4) R.rect(x + 1, top - 1, Math.max(1, w - 3), 1, penD);
    } else if (kind === 'off') {               // office: ribbon windows, often dark glass
      const m = rng() < 0.45 ? glassD : pick(rng, offc);
      R.rect(x, top, w, hp, m); R.rect(x + w - Math.max(1, w >> 3), top, Math.max(1, w >> 3), hp, offD);
      for (let y = top + 2; y < B - 1; y += det > 1 ? 3 : 2) for (let xx = x + 1; xx < x + w - 2; xx += 2) R.rect(xx, y, 2, 1, rng() < 0.35 ? pick(rng, W.on) : W.off);
      roof(Ly, x, w, top, det);
    } else if (kind === 'low') {               // two or three floors under a dark tiled roof
      const m = rng() < 0.5 ? pick(rng, tile) : pick(rng, pen);
      R.rect(x, top, w, hp, m); R.rect(x + w - 1, top, 1, hp, tileD);
      if (rng() < 0.55) { R.poly([x - 0.5, top + 1, x + w + 0.5, top + 1, x + w - 1.5, top - 1.5, x + 1.5, top - 1.5], roofK); R.rect(x + 2, top - 2, Math.max(1, w - 4), 1, roofKL); }
      else R.rect(x, top, w, 1, roofK);
      for (let xx = x + 1; xx < x + w - 1; xx += 3) R.px(xx, top + 2, rng() < 0.5 ? pick(rng, W.on) : W.off);
      if (det >= 1 && rng() < 0.3) R.rect(x + 1, B - 2, 1, 2, pick(rng, vend));
    } else if (kind === 'fac') {               // small factory or warehouse
      const m = pick(rng, fac);
      R.rect(x, top, w, hp, m);
      for (let xx = x + 1; xx < x + w; xx += 2) R.rect(xx, top + 1, 1, hp - 1, facD);
      if (rng() < 0.5 && w > 6) { for (let xx = x; xx + 3 < x + w; xx += 4) R.poly([xx, top + 0.5, xx + 4, top + 0.5, xx + 4, top - 2.5], roofKL); }
      else { R.rect(x, top, w, 1, facD); if (det >= 1 && w > 8 && rng() < 0.5) { const n = pick(rng, neon); R.rect(x + 2, top + 1, Math.min(8, w - 4), 2, n.m); } }
      if (det >= 1 && rng() < 0.25) R.rect(x + 2, top - 1, 3, 1, tarp);
    } else if (kind === 'tall') {              // a 20-30 storey tower
      const isG = rng() < 0.3, m = isG ? pick(rng, glass) : pick(rng, tile);
      R.rect(x, top, w, hp, m); R.rect(x + w - Math.max(1, w >> 2), top, Math.max(1, w >> 2), hp, isG ? glassD : tileD);
      if (isG) { for (let xx = x + 2; xx < x + w - 1; xx += 3) R.rect(xx, top + 1, 1, hp - 1, glassL); winGrid(R, rng, x + 1, top + 2, w - 2, hp - 3, WG, { cw: 3, ch: 2, ww: 2, wh: 1, lit: 0.3, skip: 0.2 }); }
      else for (let y = top + 2; y < B - 1; y += 2) { for (let xx = x + 1; xx < x + w - 2; xx += 2) R.px(xx, y, rng() < 0.45 ? pick(rng, W.on) : W.off); R.rect(x, y + 1, w - 1, 1, bal); }
      R.rect(x + 1, top - 2, w - 2, 2, isG ? glassD : tileD);
      if (hp > 26) dyn.blink.push({ L: Ly.name, x: x + (w >> 1), y: top - 3 });
    }
  }
  /* the mix of building types in each district (by metres along the river) */
  const KINDS = ['man', 'pen', 'off', 'low', 'fac', 'tall'];
  function hood(m) {
    if (m < 560) return [0.4, 0.24, 0.1, 0.18, 0.02, 0.06];           // Mukōjima
    if (m < 2400) return [0.36, 0.26, 0.2, 0.04, 0.02, 0.12];          // Azumabashi, Honjo
    if (m < 4300) return [0.3, 0.34, 0.12, 0.16, 0.03, 0.05];          // Ryōgoku, Kuramae: lower and older
    if (m < 5700) return [0.34, 0.06, 0.14, 0.04, 0.32, 0.1];          // Kiyosumi, Fukagawa: warehouses and mid-rise
    if (m < 6780) return [0.44, 0.06, 0.26, 0.04, 0.04, 0.16];         // Etchūjima, Ishikawajima: taller
    return [0.12, 0.22, 0, 0.6, 0.06, 0];                              // old Tsukuda, Tsukishima: two-storey houses
  }
  function town(Ly, m0, m1, hM, o) {
    o = o || {};
    const s = sc(Ly), det = o.det == null ? (s >= 0.3 ? 2 : s >= 0.22 ? 1 : 0) : o.det, skip = o.skip || [];
    let x = at(Ly, m0);
    const xEnd = at(Ly, m1);
    while (x < xEnd) {
      const m = x / Ly.p / KM + M0, mix = o.mix || hood(m);
      let r = rng(), k = 0;
      while (k < 5 && r > mix[k]) { r -= mix[k]; k++; }
      const kind = KINDS[k];
      let wm = rf(rng, 14, 30), hm = hM(m) * rf(rng, 0.7, 1.2);
      if (kind === 'pen') { wm = rf(rng, 7, 13); hm *= rf(rng, 0.9, 1.35); }
      else if (kind === 'low') { wm = rf(rng, 9, 18); hm = rf(rng, 10, 16); }
      else if (kind === 'fac') { wm = rf(rng, 26, 52); hm = rf(rng, 12, 20); }
      else if (kind === 'tall') { wm = rf(rng, 20, 30); hm = rf(rng, 55, 95) * (Ly === LN ? 0.9 : 1.1); }
      const w = Math.max(3, Math.round(wm * s * HX)), hp = Math.round(hm * s * VX);
      const mm = (x + w / 2) / Ly.p / KM + M0;
      if (hp >= 2 && !skip.some(q => mm > q[0] && mm < q[1]) && rng() < (o.fill || 0.95)) bld(Ly, kind, x, w, hp, det);
      x += w + (rng() < (o.gap == null ? 0 : o.gap) ? ri(rng, 1, 3) : 0);
    }
  }
  /* utility poles and their sagging wires, in front of low streets */
  function poles(Ly, m0, m1, h) {
    const R = Ly.R, B = R.h;
    let x = at(Ly, m0), px2 = null;
    const xEnd = at(Ly, m1);
    while (x < xEnd) {
      R.rect(x, B - h, 1, h, roofK); R.rect(x - 1, B - h + 1, 3, 1, roofK);
      if (px2 !== null) { cable(R, px2, B - h + 1, x, B - h + 1, 1.2, roofK); cable(R, px2, B - h + 3, x, B - h + 3, 1.4, roofK); }
      px2 = x; x += ri(rng, 12, 20);
    }
  }
  /* a temple hall with a heavy curved tiled roof */
  function temple(Ly, cx, w, h) {
    const R = Ly.R, B = R.h;
    R.rect(cx - (w >> 1) + 1, B - h, w - 2, h, verm); R.rect(cx + (w >> 1) - 3, B - h, 2, h, vermD);
    const y = B - h, rw = w + 6;
    R.poly([cx - rw / 2, y + 1, cx + rw / 2, y + 1, cx + rw / 2 - 3, y - 1, cx + w / 2 - 2, y - 4, cx - w / 2 + 2, y - 4, cx - rw / 2 + 3, y - 1], roofK);
    R.rect(cx - w / 2 + 2, y - 5, w - 4, 1, roofKL); R.px(cx - rw / 2, y, roofK); R.px(cx + rw / 2, y, roofK);
  }
  /* a little shrine: a red torii in front of a small roof */
  function shrine(Ly, cx, base, s) {
    const R = Ly.R;
    R.rect(cx + 3, base - 4 * s, 6 * s, 4 * s, tile[3]); R.poly([cx + 2, base - 4 * s, cx + 4 + 6 * s, base - 4 * s, cx + 3 + 3 * s, base - 6.5 * s], roofK);
    R.rect(cx - 2 * s, base - 5 * s, 1, 5 * s, verm); R.rect(cx + 2 * s, base - 5 * s, 1, 5 * s, verm);
    R.rect(cx - 3 * s, base - 5 * s - 1, 6 * s + 1, 1, verm); R.rect(cx - 2 * s, base - 4 * s, 4 * s + 1, 1, vermD);
  }

  /* ============ far: Oshiage and the flat Kōtō plain, with Tokyo Skytree ============ */
  {
    const R = LF.R, B = R.h, gnd = M.add('#7d8790'), fA = M.add('#8a96a6'), fB = M.add('#7b889a'), fC = M.add('#97a2b0');
    const fW = [M.add('#7b889a', KW, '#ffd892', 0.14, true), M.add('#8a96a6', KW, '#fff0c6', 0.12)];
    R.rect(0, B - 3, R.w, 3, gnd);
    let x = 0;
    while (x < R.w) {
      const m = x / LF.p / KM + M0, w = ri(rng, 3, 8);
      let h = ri(rng, 3, 7);
      if (rng() < 0.06) h = ri(rng, 9, 15);
      if (m > 2600 && m < 3500 && rng() < 0.4) h = ri(rng, 16, 30);    // Kinshichō towers
      if (m > 1500 && m < 2100 && rng() < 0.2) h = ri(rng, 12, 20);    // Honjo-Azumabashi
      if (m > 4500 && m < 5200 && rng() < 0.25) h = ri(rng, 12, 22);   // Monzen-Nakachō, Kiba
      if (m > 5900 && m < 6800 && rng() < 0.3) h = ri(rng, 14, 24);               // Toyosu, Harumi towers
      const c = pick(rng, [fA, fB, fC]);
      R.rect(x, B - h, w, h, c);
      for (let yy = B - h + 1; yy < B - 1; yy += 2) for (let xx = x; xx < x + w - 1; xx += 2) if (rng() < 0.2) R.px(xx, yy, pick(rng, fW));
      if (h > 13) dyn.blink.push({ L: 'far', x: x + (w >> 1), y: B - h - 1 });
      x += w + (rng() < 0.2 ? 1 : 0);
    }
    /* TOKYO SKYTREE, 634 m. Drawn 118 px tall, about 1.45x true perspective size,
       so it reads as the tower of this view: tripod base, round shaft, the
       Tembo Deck at 350 m and the Tembo Galleria at 450 m, then the gantry. */
    const sk = M.add('#e3eaf1', KF, '#8fd0ff', 0.55), skD = M.add('#b7c5d3', KF, '#5f9ae8', 0.35), skDeck = M.add('#d3dce6', KN, '#c99bff', 0.75);
    const skWin = M.add('#56667c', KW, '#f2e6ff', 0.6);
    const cx = at(LF, 1000), H = 118, e = H / 634;
    const prof = yUp => {
      const mH = yUp / e;
      if (mH < 70) { const t = mH / 70, hw = 7.2 - 2.7 * t, inner = 4.8 * (1 - t); return { hw, inner: inner > 1.3 ? inner : 0, m: sk, e: skD }; }
      if (mH < 336) { const t = (mH - 70) / 266; return { hw: 4.5 - 1.3 * t, m: sk, e: skD }; }
      if (mH < 364) { const r = yUp - Math.ceil(336 * e); return { hw: r === 0 ? 4.4 : 5.2, solid: true, m: r === 1 || r === 3 ? skWin : (r === 0 ? skD : skDeck) }; }
      if (mH < 440) return { hw: 2.7 - 0.5 * (mH - 364) / 76, m: sk, e: skD };
      if (mH < 457) { const r = yUp - Math.ceil(440 * e); return { hw: 3.6, solid: true, m: r === 1 ? skWin : skDeck }; }
      if (mH < 497) return { hw: 1.7, solid: true, m: (yUp & 1) ? sk : skD };
      if (mH < 634) return { hw: mH < 590 ? 1 : 0.4, solid: true, m: mH < 590 && yUp % 3 === 0 ? skD : sk };
      return null;
    };
    lattice(R, cx, B, H, prof);
    dyn.blink.push({ L: 'far', x: cx, y: B - H - 1 });
    landmarks.push({ L: 'far', x: cx, name: 'Tokyo Skytree' });
  }

  /* ============ core: Honjo, Ryōgoku and Fukagawa, 400 m back; the Edo-Tokyo Museum ============ */
  {
    const R = LC.R, B = R.h, gnd = M.add('#78838a');
    R.rect(0, B - 3, R.w, 3, gnd);
    const ex = at(LC, 2765);
    town(LC, M0, END, curve([[-260, 48], [600, 62], [1300, 78], [2400, 66], [3300, 64], [4600, 56], [5800, 72], [6600, 60], [6900, 26], [7677, 26]]), { skip: [[2680, 2850]] });
    /* Kiyosumi Garden, the big walled landscape garden */
    woods(R, rng, at(LC, 4560), at(LC, 4760), B - 2, x2 => 5 + 1.5 * Math.sin(x2 * 0.3), leafFar, { rMin: 1.5, rMax: 2.5 });
    /* the Edo-Tokyo Museum: a huge pale storehouse mass raised on four legs.
       About 1.3x true size. */
    {
      const st = M.add('#d9d6cf', KF, '#ffe9c0', 0.15), stD = M.add('#aeaba4'), dk = M.add('#5a5f68'), pl = M.add('#c5c1b8');
      R.rect(ex - 18, B - 3, 36, 3, pl);
      for (const lx of [ex - 13, ex + 9]) { R.rect(lx, B - 12, 4, 10, st); R.rect(lx + 3, B - 12, 1, 10, stD); }
      R.rect(ex - 19, B - 13, 38, 1, dk);
      R.poly([ex - 16, B - 13, ex + 16, B - 13, ex + 19, B - 22, ex - 19, B - 22], st);
      R.poly([ex + 11, B - 13, ex + 16, B - 13, ex + 19, B - 22, ex + 14, B - 22], stD);
      for (let x2 = ex - 15; x2 < ex + 13; x2 += 3) R.px(x2, B - 18, W.off);
      R.rect(ex - 20, B - 24, 40, 2, dk); R.rect(ex - 18, B - 25, 36, 1, roofKL);
      landmarks.push({ L: 'core', x: ex, name: 'the Edo-Tokyo Museum' });
    }
  }

  /* ============ fore: 250 m back ============ */
  {
    const R = LO.R, B = R.h, gnd = M.add('#727c80');
    R.rect(0, B - 3, R.w, 3, gnd);
    town(LO, M0, END, curve([[-260, 40], [500, 52], [1100, 62], [2300, 58], [3000, 46], [4200, 48], [5200, 46], [6000, 62], [6600, 50], [6900, 20], [7677, 20]]), {});
    woods(R, rng, at(LO, 150), at(LO, 420), B - 2, x2 => 5 + 2 * Math.sin(x2 * 0.2), leafFar, { rMin: 1.5, rMax: 3 });
  }

  /* ============ mid: 150 m back; Sumida Ward Office, the Kokugikan ============ */
  {
    const R = LM.R, B = R.h, gnd = M.add('#6a7477');
    R.rect(0, B - 3, R.w, 3, gnd);
    const KX = 2832;
    town(LM, M0, END, curve([[-260, 34], [500, 44], [1000, 52], [1600, 54], [2300, 46], [2700, 36], [3400, 40], [4300, 40], [5200, 42], [5900, 54], [6700, 50], [6850, 16], [7677, 16]]),
      { skip: [[1290, 1345], [KX - 75, KX + 75], [6400, 6760]] });
    woods(R, rng, at(LM, 2700), at(LM, KX - 70), B - 2, x2 => 6 + 2 * Math.sin(x2 * 0.17), Q.leaf, { rMin: 2, rMax: 3 });
    /* Sumida Ward Office: the blue-silver tower behind the Asahi flame (1.2x) */
    {
      const g = M.add('#93a9bd', KG), gD = M.add('#71879c', KG), gL = M.add('#c6d4e0');
      const cx = at(LM, 1318), h = 60, w = 20;
      block(R, cx, w, h, g, gD);
      for (let y = B - h + 2; y < B - 2; y += 2) R.rect(cx - 10, y, w - 4, 1, gL);
      winGrid(R, rng, cx - 9, B - h + 3, w - 5, h - 5, WG, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.35, skip: 0.3 });
      R.rect(cx - 6, B - h - 3, 10, 3, gD); dyn.blink.push({ L: 'mid', x: cx - 1, y: B - h - 4 });
    }
    /* the Ryōgoku Kokugikan: pale walls under the great green copper roof with gold trim (about 1.9x) */
    {
      const wall = M.add('#d8d5cc', KF, '#ffe7b8', 0.2), wallD = M.add('#b3afa5'), cu = M.add('#5f9f86', KF, '#5fb090', 0.05), cuD = M.add('#467a68'), cuL = M.add('#83bea4');
      const gold = M.add('#d6aa3e', KN, '#ffd36b', 0.6);
      const cx = at(LM, KX), k = 1.45, q = v => Math.round(v * k);
      R.rect(cx - q(25), B - q(8), q(50), q(8), wall); R.rect(cx + q(19), B - q(8), q(6), q(8), wallD);
      for (let x2 = cx - q(23); x2 < cx + q(19); x2 += 3) R.rect(x2, B - q(6), q(2), q(3), W.off);
      R.rect(cx - q(28), B - q(9), q(56), q(1), gold);
      R.poly([cx - q(28), B - q(9), cx + q(28), B - q(9), cx + q(22), B - q(13), cx + q(17), B - q(17), cx - q(17), B - q(17), cx - q(22), B - q(13)], cu);
      R.poly([cx + q(12), B - q(9), cx + q(28), B - q(9), cx + q(22), B - q(13), cx + q(17), B - q(17), cx + q(10), B - q(17)], cuD);
      for (let x2 = cx - q(22); x2 < cx + q(22); x2 += 4) R.line(x2, B - q(10), x2 + (x2 - cx) * 0.18, B - q(16), cuL);
      R.rect(cx - q(18), B - q(18), q(36), q(1), gold);
      R.rect(cx - q(13), B - q(21), q(26), q(3), wall); R.rect(cx + q(9), B - q(21), q(4), q(3), wallD);
      R.rect(cx - q(15), B - q(22), q(30), q(1), gold);
      R.poly([cx - q(15), B - q(22), cx + q(15), B - q(22), cx + q(8), B - q(27), cx - q(8), B - q(27)], cu); R.poly([cx + q(5), B - q(22), cx + q(15), B - q(22), cx + q(8), B - q(27), cx + q(4), B - q(27)], cuD);
      R.rect(cx - q(8), B - q(28), q(16), q(1), gold); R.rect(cx - q(1), B - q(31), q(2), q(3), gold);
      landmarks.push({ L: 'mid', x: cx, name: 'the Ryōgoku Kokugikan' });
    }
    /* River City 21, the back row of towers on Ishikawajima */
    towers21(LM, [[6430, 135, 30], [6520, 165, 34], [6615, 150, 30], [6720, 120, 32]]);
  }

  /* River City 21 / Tsukuda: slender 40-54 storey apartment towers with crowned tops */
  function towers21(Ly, list) {
    const R = Ly.R, B = R.h, s = sc(Ly);
    const cols = [[M.add('#cdbba2'), M.add('#a8977f')], [M.add('#8f7766'), M.add('#6f5c4f')], [M.add('#bcb8b0'), M.add('#96928b')], [M.add('#c9b2a4'), M.add('#a38e81')]];
    list.forEach(([m, hm, wm], i) => {
      const [c, cD] = cols[(i + (Ly === LN ? 1 : 0)) % cols.length], cx = at(Ly, m), h = Math.round(hm * s * 1.5), w = Math.max(9, Math.round(wm * s * 1.3)) | 1;
      block(R, cx, w, h, c, cD);
      for (let y = B - h + 4; y < B - 2; y += 2) { R.rect(cx - (w >> 1), y, w - 2, 1, bal); for (let xx = cx - (w >> 1) + 1; xx < cx + (w >> 1) - 2; xx += 2) R.px(xx, y + 1, rng() < 0.5 ? pick(rng, W.on) : W.off); }
      R.rect(cx - (w >> 1) + 1, B - h - 2, w - 2, 2, cD); R.rect(cx - (w >> 1) + 2, B - h - 4, w - 4, 2, c); R.rect(cx - 1, B - h - 6, 2, 2, cD);
      dyn.blink.push({ L: Ly.name, x: cx, y: B - h - 7 });
    });
  }

  /* ============ near: right behind the river walls; the Asahi group, River City 21 ============ */
  {
    const R = LN.R, B = R.h, gnd = M.add('#5f686b');
    R.rect(0, B - 3, R.w, 3, gnd);
    const AS = [1240, 1350];
    town(LN, M0, END, curve([[-260, 26], [450, 30], [900, 38], [1500, 42], [2300, 38], [2600, 28], [3300, 30], [4300, 30], [5300, 34], [5900, 42], [6700, 40], [6850, 12], [7677, 12]]),
      { skip: [[-20, 560], AS, [2770, 2900], [6380, 6740], [6780, 7677]] });
    /* Sumida Park, Mukōjima side: cherry trees round Ushijima Shrine */
    woods(R, rng, at(LN, -260), at(LN, 560), B - 2, x2 => 8 + 3 * Math.sin(x2 * 0.06) + 2 * Math.sin(x2 * 0.21), Q.leaf, { rMin: 2.5, rMax: 4 });
    for (let i = 0; i < 26; i++) tree(R, ri(rng, at(LN, -240), at(LN, 540)), B - 2, ri(rng, 3, 5), Q, pink);
    { const sx = at(LN, 330); R.rect(sx - 8, B - 9, 18, 7, verm); R.poly([sx - 12, B - 8, sx + 14, B - 8, sx + 9, B - 13, sx - 7, B - 13], roofK); R.rect(sx - 6, B - 14, 14, 1, roofKL); landmarks.push({ L: 'near', x: sx, name: 'Ushijima Shrine' }); }
    poles(LN, 2600, 4200, 9);
    poles(LN, -250, 500, 9);
    temple(LN, at(LN, 3050), 14, 6); temple(LN, at(LN, 1880), 12, 5); temple(LN, at(LN, 4420), 12, 5);
    /* the Asahi Group headquarters at the east end of Azuma Bridge (1.6x):
       the gold Beer Tower with its white foam top, the black Super Dry Hall
       with the golden flame lying on its roof */
    {
      const gold = M.add('#d4a443', KF, '#e8a840', 0.16), goldD = M.add('#a8802e', KF, '#b07a2c', 0.1), goldL = M.add('#e9c46a', KF, '#ffd878', 0.22), goldM = M.add('#bf9438');
      const foam = M.add('#eef1f2', KF, '#ffffff', 0.5), foamD = M.add('#b8c4cc', KF, '#d8e4f0', 0.3);
      const hall = M.add('#25242a'), hallL = M.add('#3b3a42'), fl = M.add('#e3b23c', KF, '#ffd36a', 0.65), flL = M.add('#f7df8c', KF, '#fff0b0', 0.6), flD = M.add('#b3862a', KF, '#e0a040', 0.35);
      const f = 1.35, a = v => Math.round(v * f);
      const tx = at(LN, 1262), w = a(26), h = a(50), x0 = tx - (w >> 1), top = B - h, sd = a(6);
      R.rect(x0, top, w, h, gold); R.rect(x0 + w - sd, top, sd, h, goldD);
      for (let y = top + 2; y < B - 3; y += 3) R.rect(x0, y, w - sd, 1, goldL);
      for (let x2 = x0 + 3; x2 < x0 + w - sd; x2 += 4) R.rect(x2, top, 1, h - 3, goldM);
      for (let y = top + 3; y < B - 4; y += 3) for (let x2 = x0 + 1; x2 < x0 + w - sd - 1; x2 += 4) if (rng() < 0.2) R.rect(x2, y, 2, 1, pick(rng, W.on));
      R.rect(x0, B - 4, w, 4, hall);
      const fh = a(7);
      R.rect(x0 - 1, top - fh, w + 2, fh, foam); R.rect(x0 + w - sd, top - fh, sd + 1, fh, foamD);
      for (let x2 = x0; x2 < x0 + w; x2 += 4) { R.px(x2 + 1, top - fh - 1, foam); R.px(x2 + 2, top - fh - 1, foam); R.line(x2, top - fh + 1, x2 + 2, top - 2, foamD); R.line(x2 + 3, top - fh + 1, x2 + 1, top - 2, foamD); }
      R.rect(x0 - 1, top - 1, w + 2, 1, foamD);
      /* Super Dry Hall: a black block flaring toward its top */
      const hx = x0 + w, ht = B - a(17);
      R.poly([hx + a(2), B, hx + a(23), B, hx + a(26), ht, hx - 1, ht], hall);
      R.rect(hx - 1, ht, a(26) + 1, 1, hallL);
      /* the flame: fat bulb at the left, tail curling up to the right */
      const F = (x, y) => [hx + x * f, ht - y * f];
      R.ellipse(hx + 6 * f, ht - 4 * f, 7 * f, 4.3 * f, fl);
      R.poly([...F(6, 8), ...F(6, 0.4), ...F(18, 2.5), ...F(27, 6), ...F(32, 11), ...F(27, 9.5), ...F(18, 7)], fl);
      R.line(...F(1, 6), ...F(8, 7.5), flL); R.line(...F(9, 7.5), ...F(24, 8.5), flL); R.line(...F(10, 6.5), ...F(22, 7), flL);
      R.line(...F(2, 1), ...F(18, 2), flD); R.line(...F(19, 3), ...F(29, 8), flD);
      landmarks.push({ L: 'near', x: tx + 14, name: 'the Asahi Beer Tower and its golden flame' });
    }
    /* Mizumachi: little white arched shops under the Tobu tracks */
    { const wt = M.add('#ecebe6'), x0 = at(LN, 1020); for (let i = 0; i < 6; i++) { R.rect(x0 + i * 7, B - 7, 6, 5, wt); R.rect(x0 + i * 7 + 1, B - 5, 4, 3, pick(rng, W.on)); R.px(x0 + i * 7 + 1, B - 5, wt); R.px(x0 + i * 7 + 4, B - 5, wt); } R.rect(x0 - 2, B - 9, 44, 2, levee); }
    /* the Kokugikan forecourt: trees and banners */
    woods(R, rng, at(LN, 2770), at(LN, 2900), B - 2, x2 => 6 + 2 * Math.sin(x2 * 0.3), Q.leaf, { rMin: 2, rMax: 3 });
    for (let x2 = at(LN, 2780); x2 < at(LN, 2890); x2 += 5) { const n = pick(rng, neon); R.rect(x2, B - 13, 1, 9, roofK); R.rect(x2 + 1, B - 13, 1, 5, n.m); }
    /* River City 21, the front row, and old Tsukuda below it with Sumiyoshi Shrine */
    towers21(LN, [[6475, 150, 30], [6565, 180, 34], [6660, 140, 30]]);
    town(LN, 6740, END, () => 9, { mix: [0.2, 0.2, 0, 0.6, 0, 0] });
    woods(R, rng, at(LN, 6380), at(LN, 6740), B - 2, x2 => 5 + 2 * Math.sin(x2 * 0.2), Q.leaf, { rMin: 2, rMax: 3.5 });
    /* Tsukishima: a low warehouse or two by the water, street trees thickening toward the seam */
    for (const m of [7020, 7330]) bld(LN, 'fac', at(LN, m), 30, 13, 2);
    for (let i = 0; i < 40; i++) { const x2 = ri(rng, at(LN, 6800), at(LN, END) - 2); tree(R, x2, B - 2, ri(rng, 3, 5), Q, rng() < 0.3 ? pink : Q.leaf); }
    woods(R, rng, at(LN, 7450), at(LN, END), B - 2, x2 => 7 + 2 * Math.sin(x2 * 0.13), Q.leaf, { rMin: 2.5, rMax: 4 });
    shrine(LN, at(LN, 6880), B - 2, 2);
    landmarks.push({ L: 'near', x: at(LN, 6565), name: 'River City 21 on Tsukuda' });
    /* vending machines glowing at street corners */
    for (let i = 0; i < 70; i++) { const x2 = ri(rng, 0, R.w - 1); if (R.get(x2, B - 4) && R.get(x2, B - 4) !== Q.leaf[0]) R.rect(x2, B - 5, 1, 2, pick(rng, vend)); }
  }

  /* ============ the river bank: concrete walls, the River Terrace, the Shuto expressway ============ */
  const B = BK.R.h;
  const XM = [0, 587, 999, 1231, 1637, 2062, 2441, 3130, 3279, 3420, 4187, 4671, 5472, 6110];    // where crossings land
  const nearBridge = (x, pad) => XM.some(m => Math.abs(x - rp(m)) < pad);
  const EX0 = bx(230), EX1 = bx(3420);             // the Route 6 viaduct along the east bank
  const exTop = B - 17;
  {
    const R = BK.R;
    /* the river wall and the terrace walk on top of it */
    R.rect(0, B - 3, R.w, 3, Q.wall); R.rect(0, B - 1, R.w, 1, Q.wallD); R.rect(0, B - 4, R.w, 1, Q.top);
    for (let x = 0; x < R.w; x += 7) R.px(x, B - 2, Q.wallD);
    for (let x = 0; x < R.w; x++) { R.px(x, B - 6, Q.rail); if (x % 4 === 0) R.px(x, B - 5, Q.rail); }
    /* the flood wall behind the terrace (grass bank in Sumida Park) */
    for (let x = 0; x < R.w; x++) {
      const m = x / KM + M0, park = m < 570;
      if (park) { R.rect(x, B - 9, 1, 3, grass); }
      else { R.rect(x, B - 9, 1, 3, levee); R.px(x, B - 10, leveeL); }
    }
    /* Sumida Park: cherry trees along the bank, under the expressway */
    for (let x = 4; x < bx(570); x += ri(rng, 6, 11)) if (!nearBridge(x, 12)) tree(R, x, B - 6, ri(rng, 4, 6), Q, rng() < 0.75 ? pink : Q.leaf);
    /* street trees and lamps on the terrace elsewhere */
    for (let x = bx(600); x < R.w; x += ri(rng, 18, 40)) if (!nearBridge(x, 16)) tree(R, x, B - 9, ri(rng, 3, 4), Q, (x / KM + M0) > 6300 ? pink : Q.leaf);
    for (let lx = 10; lx < R.w; lx += 30) if (!nearBridge(lx, 12)) lampPost(R, lx, B - 6, 5, Q.post, Q.lamp);
    /* floodgates (suimon) at the canal mouths */
    const gateM = M.add('#5d7f9e', KF, '#7fb0ff', 0.25), gateC = M.add('#c2c0b8'), gateK = M.add('#2b3038');
    const gate = (m, w) => {
      const gx = bx(m);
      R.rect(gx - w / 2, B - 4, w, 4, gateK);
      for (const px2 of [gx - w / 2 - 4, gx + w / 2]) { R.rect(px2, B - 18, 4, 18, gateC); R.rect(px2 + 3, B - 18, 1, 18, tileD); R.rect(px2 - 1, B - 19, 6, 1, roofK); }
      R.rect(gx - w / 2, B - 16, w, 4, gateM); R.rect(gx - w / 2, B - 17, w, 1, gateC); R.rect(gx - w / 2, B - 12, w, 1, gateK);
    };
    gate(1405, 12); gate(3520, 14); gate(4930, 16); gate(5330, 10);
    /* the Shuto Route 6 viaduct: green steel girders on T-shaped concrete piers */
    const exS = M.add('#6f9a93', KF, '#4f9088', 0.05), exSD = M.add('#557a74'), exP = M.add('#b9b8b1'), exPD = M.add('#8f8e88'), exR = M.add('#d6d8d2');
    const exL = M.add('#f0d9a0', KN, '#ffcf70', 0.9), tail = M.add('#d24a3a', KN, '#ff3a2a', 0.9), head = M.add('#eef2ff', KN, '#ffffff', 0.9);
    for (let px2 = EX0 + 8; px2 < EX1 - 4; px2 += 26) {
      if (nearBridge(px2, 8)) continue;
      R.rect(px2 - 1, exTop + 4, 3, B - 4 - exTop - 4, exP); R.rect(px2 + 1, exTop + 4, 1, B - 4 - exTop - 4, exPD);
      R.rect(px2 - 4, exTop + 4, 9, 2, exP); R.rect(px2 - 4, exTop + 5, 9, 1, exPD);
    }
    R.rect(EX0, exTop, EX1 - EX0, 4, exS); R.rect(EX0, exTop + 3, EX1 - EX0, 1, exSD); R.rect(EX0, exTop - 1, EX1 - EX0, 1, exR);
    for (let x = EX0; x < EX1; x += 6) R.px(x, exTop + 1, exSD);
    for (let x = EX0 + 14; x < EX1; x += 30) { R.rect(x, exTop - 4, 1, 3, Q.post); R.px(x + 1, exTop - 4, exL); }
    for (let x = EX0 + 5; x < EX1; x += ri(rng, 9, 23)) R.px(x, exTop - 2, rng() < 0.55 ? tail : head);
    /* north end: the viaduct comes out of the Mukōjima trees */
    woods(R, rng, EX0 - 26, EX0 + 10, B - 6, x2 => 15 + 3 * Math.sin(x2 * 0.5), Q.leaf, { rMin: 3, rMax: 4.5 });
    /* the ramp down from Route 6 at Komagata */
    R.poly([bx(1780), exTop + 4, bx(1890), B - 8, bx(1890), B - 6, bx(1780), exTop + 7], exSD);
    /* bridge abutments */
    const ab = (m, w, h, mm, mD) => { const r = bx(m); R.rect(r - w / 2 - 3, B - h - 1, w + 6, h + 1, mm); R.rect(r + w / 2, B - h - 1, 3, h + 1, mD); R.rect(r - w / 2 - 3, B - h - 2, w + 6, 1, Q.top); };
    for (const m of XM) if (m !== 3420) ab(m, 14, 8, Q.wall, Q.wallD);
    ab(3420, 16, 15, exP, exPD);
    /* blue tarps, a little shrine, the River Center pier building at Ryōgoku */
    for (let i = 0; i < 6; i++) { const x = bx(rf(rng, 600, 3300)); if (!nearBridge(x, 14)) R.rect(x, B - 8, 3, 2, tarp); }
    shrine(BK, bx(2600), B - 9, 1); shrine(BK, bx(4380), B - 9, 1);
    { const x0 = bx(3330), wt = M.add('#e4e6e2'); R.rect(x0, B - 13, 22, 9, wt); R.rect(x0, B - 14, 22, 1, roofKL); for (let x = x0 + 2; x < x0 + 20; x += 3) R.rect(x, B - 11, 2, 3, pick(rng, W.on)); }
    /* moored yakatabune at Mukōjima and Kuramae */
    const hull = M.add('#5a3e2e'), cab = M.add('#efe6d2'), lant = M.add('#d84a3a', KN, '#ff6a4a', 1.0), shoji = M.add('#4a4038', KW, '#ffe0a0', 0.6);
    const moored = (x) => { R.rect(x, B - 2, 26, 2, hull); R.rect(x + 2, B - 5, 22, 3, cab); for (let i = x + 3; i < x + 23; i += 3) R.px(i, B - 4, shoji); R.rect(x + 1, B - 6, 24, 1, roofK); for (let i = x + 2; i < x + 25; i += 2) R.px(i, B - 7, lant); };
    for (const m of [430, 2250, 2330, 3700]) moored(bx(m));
    /* pontoons on the water */
    const dock = M.add('#b9b4a6'), pile = M.add('#5f5a52'), S2 = SH.R;
    for (const [a, n] of [[bx(3320), 40], [bx(1300), 26], [bx(2280), 46], [bx(5600), 30]]) { S2.rect(a, 1, n, 2, dock); S2.rect(a, 3, n, 1, pile); for (let p = a + 2; p < a + n; p += 9) S2.rect(p, 0, 1, 7, pile); }
  }

  /* ============ the bridges, each crossing toward the camera ============ */
  const road = M.add('#5d6068'), walk = M.add('#9c9a94'), mark = M.add('#d8d4c4'), railK = M.add('#34363c'), conc = M.add('#a8a49c'), concD = M.add('#87847d');
  const lampM = M.add('#f1e2b6', KN, '#ffe08a', 0.85), globe = M.add('#f6f0dc', KN, '#fff3c8', 1);
  const bc = (c, e) => [M.add(c, KF, e, 0.4), M.add(shadeHex(c, 0.78), KF, e, 0.2)];
  function shadeHex(c, k) { const a = hex(c); return '#' + a.map(v => Math.round(v * k).toString(16).padStart(2, '0')).join(''); }
  const [kotoS, kotoD] = bc('#4f80ba', '#6fa8ff'), [tobuS, tobuD] = bc('#7d8f9c', '#a8c8e0'), [azS, azD] = bc('#c8352b', '#ff5a40');
  const [koS, koD] = bc('#8fb6d8', '#a8d8ff'), [umS, umD] = bc('#5f9c6e', '#7fe8a0'), [kuS, kuD] = bc('#dfb43a', '#ffd860');
  const [soS, soD] = bc('#6c9a58', '#9fdc80'), [ryS, ryD] = bc('#7f978e', '#a8d0c0'), [shS, shD] = bc('#e0a23a', '#ffc860');
  const [kiS, kiD] = bc('#4f86c6', '#70a8ff'), [eiS, eiD] = bc('#93b9d8', '#b8dcff'), [chS, chD] = bc('#e8ebee', '#e0ecff'), [saS] = bc('#d9d6cc', '#fff0d8');
  const exG = M.add('#6f9a93', KF, '#5fb0a0', 0.12);
  /* upright sprites: tower portals, pylons, catenary posts */
  const spr = (w, h, f) => { const R = new Raster(w, h); f(R); return R; };
  const sprites = [
    /* 0 Kiyosu Bridge tower: a riveted portal frame with an arched brace */
    spr(17, 22, R => { R.rect(0, 0, 3, 22, kiS); R.rect(14, 0, 3, 22, kiS); R.rect(2, 0, 1, 22, kiD); R.rect(0, 0, 17, 3, kiS); R.rect(0, 2, 17, 1, kiD); R.ring(8.5, 13, 7.4, 1.6, kiS); R.rect(0, 13, 17, 9, 0); R.rect(0, 13, 3, 9, kiS); R.rect(14, 13, 3, 9, kiS); R.rect(2, 13, 1, 9, kiD); R.rect(1, 21, 15, 1, 0); }),
    /* 1 Shin-Ōhashi pylon: two slender legs with a crossbeam */
    spr(17, 28, R => { R.rect(1, 0, 2, 28, shS); R.rect(14, 0, 2, 28, shS); R.rect(2, 0, 1, 28, shD); R.rect(1, 4, 15, 2, shS); R.rect(1, 17, 15, 1, shD); }),
    /* 2 Chūō-Ōhashi pylon: an inverted Y */
    spr(19, 34, R => { R.rect(8, 0, 3, 16, chS); R.rect(10, 0, 1, 16, chD); R.line(8, 15, 1, 33, chS); R.line(9, 15, 2, 33, chS); R.line(10, 15, 17, 33, chS); R.line(11, 15, 18, 33, chD); R.rect(7, 0, 5, 1, chD); }),
    /* 3 Tobu bridge catenary post */
    spr(13, 8, R => { R.rect(0, 0, 1, 8, tobuD); R.rect(12, 0, 1, 8, tobuD); R.rect(0, 0, 13, 1, tobuD); R.rect(0, 2, 13, 1, railK); }),
  ];
  /* helpers for the shapes that stand above a deck */
  const arcs = (spans, h, rise, lat, n) => spans.map(([a, b]) => hangLine(a, h, b, h, -rise, lat, n || 10));
  const hangers = (a, b, h, rise, lat, step) => { const out = []; for (let z = a + step; z < b - step / 2; z += step) { const t = (z - a) / (b - a); out.push([[z, h, lat], [z, h + rise * 4 * t * (1 - t), lat]]); } return out; };
  const drop = (a, b, step, lat, f) => { const out = []; for (let z = a + step; z < b - step / 2; z += step) if (f(z) > 8.5) out.push([[z, 7, lat], [z, f(z), lat]]); return out; };
  const L = (m, ptsList) => ptsList.map(pts => ({ m, pts }));
  const both = (w, f) => [...f(-w / 2), ...f(w / 2)];
  /* Kiyosu: self-anchored eyebar chains */
  const kiyosuLines = both(13, lat => [
    ...L(kiS, [hangLine(0, 8, 40, 27, 4, lat, 6), hangLine(0, 9, 40, 28, 4, lat, 6), hangLine(40, 27, 150, 27, 15, lat, 14), hangLine(40, 28, 150, 28, 15, lat, 14), hangLine(150, 27, 200, 8, 4, lat, 6)]),
    ...L(kiD, drop(40, 150, 11, lat, z => { const t = (z - 40) / 110; return 27 - 15 * 4 * t * (1 - t); })),
  ]);
  /* Eitai: one big tied arch, braced across the top */
  const eitaiLines = [
    ...both(14, lat => [...L(eiS, arcs([[20, 170]], 8, 24, lat, 16)), ...L(eiD, hangers(20, 170, 8, 24, lat, 10))]),
    ...[60, 80, 95, 110, 130].map(z => { const t = (z - 20) / 150, hh = 8 + 24 * 4 * t * (1 - t); return { m: eiD, pts: [[z, hh, -7], [z, hh, 7]] }; }),
  ];
  /* Umaya: three arches above the deck */
  const umSp = [[0, 58], [58, 122], [122, 190]];
  const umayaLines = both(14, lat => [...L(umS, arcs(umSp, 7, 9, lat, 8)), ...umSp.flatMap(([a, b]) => L(umD, hangers(a, b, 7, 9, lat, 9)))]);
  /* Komagata: the arch rises above the deck in the middle span */
  const komaLines = both(13, lat => [...L(koS, arcs([[58, 125]], 4, 15, lat, 10)), ...L(koD, drop(64, 120, 8, lat, z => { const t = (z - 58) / 67; return 4 + 15 * 4 * t * (1 - t); }))]);
  /* JR Sōbu Line: braced-rib tied arches */
  const soSp = [[0, 62], [62, 128], [128, 196]];
  const sobuLines = both(9, lat => [...L(soS, [...arcs(soSp, 7, 12, lat, 10), ...arcs(soSp, 7, 8, lat, 10)]),
    ...soSp.map(([a, b]) => ({ m: soD, pts: Array.from({ length: 9 }, (_, i) => { const z = a + (b - a) * i / 8, t = i / 8; return [z, 7 + (i & 1 ? 12 : 8) * 4 * t * (1 - t), lat]; }) }))]);
  /* Tobu: a low truss with catenary posts */
  const tobuLines = both(10, lat => [{ m: tobuS, pts: [[0, 12, lat], [210, 12, lat]] }, { m: tobuD, pts: Array.from({ length: 27 }, (_, i) => [i * 8, i & 1 ? 12 : 7, lat]) }]);
  const tobuPosts = [];
  for (let z = 14; z < 220; z += 30) tobuPosts.push({ z, spr: 3, base: 12 });
  /* Shin-Ōhashi: cable-stayed fans from two pylons */
  const fan = (tz, top, lat, ds) => ds.map(d => [[tz, top, lat], [tz + d, 8, lat]]);
  const shinLines = both(14, lat => L(shD, [...fan(50, 33, lat, [-40, -28, -16, 16, 28, 40]), ...fan(150, 33, lat, [-40, -28, -16, 16, 28, 40])]));
  const chuoLines = both(14, lat => L(chD, fan(95, 40, lat * 0.25, [-80, -64, -48, -32, 32, 48, 64, 80]).map(([a, b]) => [a, [b[0], 8, lat]])));
  /* Azuma: red deck arches under the road and a red parapet */
  const azSp = [[0, 58], [58, 124], [124, 196]];
  const azumaLines = both(11, lat => [...L(azS, azSp.map(([a, b]) => hangLine(a, 7, b, 7, 5, lat, 10))), ...L(azS, azSp.map(([a, b]) => hangLine(a, 6, b, 6, 4, lat, 10))), { m: azS, pts: [[0, 9, lat], [220, 9, lat]] }]);
  const crossings = [
    { name: 'Sakura Bridge', r: rp(0), w: 7, h: 6, th: 2, pw: 3, piers: [70, 140], top: walk, side: saS, pier: conc, rail: saS, lamp: lampM, lampEvery: 26 },
    { name: 'the Kototoi Bridge', r: rp(587), w: 12, h: 7, th: 3, pw: 5, piers: [55, 120, 185], top: road, walk, mark, side: kotoS, pier: conc, rail: kotoD, lamp: lampM, lampEvery: 22 },
    { name: 'the Tobu railway bridge', r: rp(999), w: 10, h: 7, th: 3, pw: 5, piers: [60, 130], top: M.add('#6b625a'), walk, side: tobuS, pier: conc, rail: tobuD, towers: tobuPosts, lines: tobuLines },
    { name: 'the Azuma Bridge', r: rp(1231), w: 11, h: 8, th: 2, pw: 5, piers: [58, 124], arch: 30, top: road, walk: azD, mark, side: azS, pier: azD, rail: azS, lamp: lampM, lampEvery: 18, lines: azumaLines },
    { name: 'the Komagata Bridge', r: rp(1637), w: 13, h: 7, th: 2, pw: 5, piers: [58, 125], arch: 26, top: road, walk, mark, side: koS, pier: conc, rail: koD, lamp: lampM, lampEvery: 20, lines: komaLines },
    { name: 'the Umaya Bridge', r: rp(2062), w: 14, h: 7, th: 2, pw: 5, piers: [58, 122, 190], top: road, walk, mark, side: umS, pier: conc, rail: umD, lamp: lampM, lampEvery: 20, lines: umayaLines },
    { name: 'the Kuramae Bridge', r: rp(2441), w: 16, h: 8, th: 2, pw: 5, piers: [58, 124, 192], arch: 30, top: road, walk, mark, side: kuS, pier: kuD, rail: kuD, lamp: lampM, lampEvery: 20 },
    { name: 'the Sōbu Line bridge', r: rp(3130), w: 9, h: 7, th: 2, pw: 5, piers: [62, 128], top: M.add('#6b625a'), side: soS, pier: conc, rail: soD, lines: sobuLines },
    { name: 'the Ryōgoku Bridge', r: rp(3279), w: 14, h: 7, th: 3, pw: 6, piers: [62, 130, 198], top: road, walk, mark, side: ryS, pier: conc, rail: ryD, lamp: globe, lampEvery: 13 },
    { name: 'the Shuto Expressway', r: rp(3420), w: 15, h: 15, th: 3, pw: 4, piers: [45, 105, 165, 225], top: road, mark, side: exG, pier: conc, rail: concD },
    { name: 'the Shin-Ōhashi', r: rp(4187), w: 14, h: 8, th: 2, pw: 5, piers: [50, 150], top: road, walk, mark, side: shD, pier: conc, rail: shS, lamp: lampM, lampEvery: 22, towers: [{ z: 50, spr: 1, base: 6 }, { z: 150, spr: 1, base: 6 }], lines: shinLines },
    { name: 'the Kiyosu Bridge', r: rp(4671), w: 13, h: 8, th: 3, pw: 6, piers: [40, 150], top: road, walk, mark, side: kiS, pier: conc, rail: kiD, lamp: lampM, lampEvery: 16, towers: [{ z: 40, spr: 0, base: 6 }, { z: 150, spr: 0, base: 6 }], lines: kiyosuLines },
    { name: 'the Eitai Bridge', r: rp(5472), w: 14, h: 8, th: 3, pw: 7, piers: [20, 170], top: road, walk, mark, side: eiS, pier: conc, rail: eiD, lamp: lampM, lampEvery: 18, lines: eitaiLines },
    { name: 'the Chūō-Ōhashi', r: rp(6110), w: 14, h: 8, th: 2, pw: 6, piers: [95], top: road, walk, mark, side: chS, pier: conc, rail: chD, lamp: lampM, lampEvery: 18, towers: [{ z: 95, spr: 2, base: 6 }], lines: chuoLines },
  ];
  for (const c of crossings) if (c.name !== 'Sakura Bridge') landmarks.push({ L: 'bank', x: Math.round(c.r), name: c.name });

  /* boats and the traffic on the expressway */
  const bm = {
    n: M.add('#6a4a36'), N: M.add('#4a3326'), k: M.add('#2f2a28'), w: M.add('#efe6d2'), W: M.add('#4a4038', KW, '#ffe0a0', 0.6),
    R: M.add('#d84a3a', KN, '#ff6a4a', 1.0), s: M.add('#cfd6de'), S: M.add('#a7b3c0'), g: M.add('#8fb6d8', KG), G: M.add('#5f88b0', KG), L: M.add('#e9e2c8', KN, '#ffef9a', 0.9),
    r: M.add('#c4342c'), D: M.add('#2c3a5a'), y: M.add('#e2c044'), b: M.add('#3c5f8c'), c: M.add('#8f8576'), t: M.add('#d7d3c9'),
  };
  const yakata = [
    '....R.R.R.R.R.R.R.R.R.R.R.R.R.R.....', '..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..', '...wWwwWwwWwwWwwWwwWwwWwwWwwWwwW....',
    '...wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..', 'nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn', '.nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn.', '..NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN..',
  ];
  /* Himiko: the silver-blue teardrop water bus */
  const himiko = [
    '..............ggggggggg..............', '..........ggGgggGgggGgggGg...........', '.......ssggGgggGgggGgggGgggGss.......',
    '....ssssssssssssssssssssssssssssss...', '..sssssssssssssssssssssssssssssssssss', 'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSL', '..SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS..',
  ];
  /* the red water bus, as under the expressway in the photo */
  const redbus = [
    '..........kkkkkkkk..........................', '......rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr.......', '......rwWwwWwwWwwWwwWwwWwwWwwWwwWwwWr.......',
    '....rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr....', '....rWwwWwwWwwWwwWwwWwwWwwWwwWwwWwwWwwr....', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrL',
    '.DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.', '...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD...',
  ];
  /* a sand barge pushed by a small tug */
  const barge = [
    '.....................................kk......', '..........ccccccc....................ww......', '......ccccccccccccccc..............wwWww.....',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb..bbbbbbbbbL..', '.bbbbbbbbbbbbbbbbbbbbbbbbbbbbb...kkkkkkkkk...',
  ];
  const boats = [
    { frames: [rasterFromRows(yakata, bm)], speed: 6, depth: 0.3, name: 'yakatabune' },
    { frames: [rasterFromRows(himiko, bm)], speed: 13, depth: 0.55, name: 'Himiko' },
    { frames: [rasterFromRows(redbus, bm)], speed: 10, depth: 0.8, name: 'water bus' },
    { frames: [rasterFromRows(barge, bm)], speed: 7, depth: 0.15, name: 'barge' },
  ];
  /* a lorry, a car and a bus on Route 6 */
  const traffic = [
    '..tttttttt.....................bbbbbbbbbbb..',
    '..ttttttttgg.......yyyyy.......bgbgbgbgbgb..',
    '..ttttttttttL....yyyyyyyL......bbbbbbbbbbbL.',
  ];
  const vehicle = { L: 'bank', x0: EX0 + 4, x1: EX1 - 4, y: exTop - 3, sprite: rasterFromRows(traffic, bm), speed: 30, idle: 4 };
  return {
    id: 'tokyo', name: 'Tokyo', meta: '35.71° N · 139.80° E', river: 'Sumida River',
    M, layers: [LF, LC, LO, LM, LN, BK, SH], crossings, sprites, camD: 360, J0: 40, cloudAfter: 0,
    hero: { r: rp(1300), p: LN.p }, dyn, landmarks, boats, vehicle,
  };
}
