/* ---------------- New York City ----------------
   Flight line: north up the East River from the Battery to just past the
   Queensboro Bridge, camera looking WEST at Manhattan (south = screen left).
   Brooklyn and Queens are behind the camera (3D views only).
   Positions are metres (m) along the Manhattan shoreline from Whitehall,
   each landmark projected onto the bulkhead line:
     m =  180  Battery Maritime Building      m = 5389  Con Edison East River station
     m =  553  55 Water Street                m = 5933  Stuyvesant Town
     m =  774  40 Wall Street                 m = 6423  Waterside Plaza
     m =  885  70 Pine / 120 Wall / 28 Liberty m = 6610 Bellevue
     m =  960  One World Trade Center         m = 7213  American Copper Buildings
     m = 1139  Pier 17                        m = 7375  Empire State Building
     m = 1327  Woolworth, 1352 8 Spruce       m = 7651  Chrysler, 7733 Tudor City
     m = 1588  Brooklyn Bridge (shore)        m = 7825  UN Secretariat
     m = 1610  Municipal Building             m = 8095  Trump World Tower
     m = 2245  Manhattan Bridge (shore)       m = 8517  Citigroup Center
     m = 3727  Williamsburg Bridge (shore)    m = 8701  432 Park Avenue
                                              m = 9247  Queensboro Bridge (shore)
   The real 9.5 km is too long for one loop, so the route is piecewise:
   Lower Manhattan (m -40..2320) and Midtown East (m 7140..9500) at 0.69 px
   per metre; the Lower East Side to Kips Bay (m 2320..7140) is squeezed into
   839 px (0.174 px/m) that still shows its landmarks in order.
   Depth sets the layer: p = 400 / (400 + metres inland). Buildings are drawn
   at true perspective size; the far heroes up to 1.3x so they read. */
function genNewYork() {
  const rng = mulberry32(1898);
  const M = new Mats();
  const mk = (n, p, H, dy) => mkLayer(n, Math.round(p * ROUTE), H, { dy });
  const LF = mk('far', 0.18, 92, -6), LW = mk('wtc', 0.25, 136, -5), LC = mk('core', 0.32, 120, -4), LO = mk('fore', 0.42, 116, -3);
  const LM = mk('mid', 0.54, 128, -2), LN = mk('near', 0.68, 128, -1), LR = mk('front', 0.84, 140, 0), BK = mk('bank', 1, 72, 0);
  const SH = mkLayer('shore', 4096, 14, { water: true, dy: 11 });
  const dyn = { blink: [], clocks: [], signs: [] };
  const landmarks = [];
  /* metres -> route px, piecewise */
  const KH = 0.69, MA = -40, MB = 2320, MC = 7140, RB = (MB - MA) * KH, KC = (ROUTE - 2 * RB) / (MC - MB), RC = RB + (MC - MB) * KC;
  const rp = m => m <= MB ? (m - MA) * KH : m <= MC ? RB + (m - MB) * KC : RC + (m - MC) * KH;
  const mr = r => r <= RB ? MA + r / KH : r <= RC ? MB + (r - RB) / KC : MC + (r - RC) / KH;
  const at = (Ly, m) => Math.round(Ly.p * rp(m));
  const bx = m => Math.round(rp(m));
  const V = Ly => 0.69 * Ly.p;                           // px per metre of height on a layer (true size)
  const lm = (Ly, x, name) => landmarks.push({ L: Ly.name, x, name });

  /* ---- materials ---- */
  const W = winMats(M, '#3a4659'), WG = winMats(M, '#46607e'), WD = winMats(M, '#242a35');
  const stone = [M.add('#cdbf9f'), M.add('#bfb090'), M.add('#d8ccb0')], stoneD = M.add('#a39375'), stoneL = M.add('#e6dcc6');
  const brick = [M.add('#9a5845'), M.add('#8a4c3c'), M.add('#a8644e')], brickD = M.add('#6e3e31');
  const tan = [M.add('#c9ae8a'), M.add('#b89c7a')], tanD = M.add('#977d5f');
  const glass = [M.add('#5f82aa', KG), M.add('#7095bb', KG), M.add('#4f7198', KG)], glassD = M.add('#42618a', KG), glassL = M.add('#8eaccb', KG);
  const dark = [M.add('#3d4452'), M.add('#4a4844')], darkD = M.add('#2c313b'), darkL = M.add('#6a6f78');
  const white = [M.add('#d9d8d2'), M.add('#c6c7c4')], whiteD = M.add('#a3a5a6'), band = M.add('#5d6470');
  const wood = M.add('#8a5d3b'), woodD = M.add('#5f3f28');
  const Q = quayMats(M, { wall: '#857f78', wallD: '#5f5a55', top: '#aaa298', leaf0: '#33573a', leaf1: '#467444', leaf2: '#679a55', lamp: '#f6c27a', lampE: '#ffb75a' });
  const leafFar = [M.add('#56705a'), M.add('#66825f'), M.add('#7e9a6c')];
  const leafFall = [M.add('#8a5a34'), M.add('#b8793a'), M.add('#d9a04a')];
  const grass = M.add('#5f8f4c'), asph = M.add('#55585f'), asphL = M.add('#7a7d84');
  const pierBlue = M.add('#2f6f9e');
  const red = M.add('#ff4a3a', KN, '#ff3020', 1);
  const gnd = [M.add('#80888f'), M.add('#7a838a'), M.add('#737d84'), M.add('#6c767c'), M.add('#5f6a6c'), M.add('#556158'), M.add('#4d5a4f')];

  /* ---- generic Manhattan fabric ---- */
  function tank(R, x, y, v) {
    if (v < 0.27) return;
    R.rect(x, y - 1, 1, 1, woodD); R.rect(x + 2, y - 1, 1, 1, woodD);
    R.rect(x, y - 4, 3, 3, wood); R.rect(x + 2, y - 4, 1, 3, woodD);
    R.rect(x, y - 5, 3, 1, woodD); R.px(x + 1, y - 6, woodD);
  }
  function setback(R, x, w, y, m, mD, mL, n) {
    let tw = w;
    for (let i = 0; i < n && tw > 4; i++) {
      tw -= w > 11 ? 4 : 2;
      const th = ri(rng, 2, 4) + (w > 12 ? 2 : 0), tx = x + ((w - tw) >> 1), s = Math.max(1, Math.round(tw * 0.22));
      R.rect(tx, y - th, tw, th, m); R.rect(tx + tw - s, y - th, s, th, mD); if (mL) R.rect(tx, y - th, tw, 1, mL);
      for (let yy = y - th + 1; yy < y - 1; yy += 2) for (let xx = tx + 1; xx < tx + tw - s; xx += 2) if (rng() < 0.3) R.px(xx, yy, pick(rng, W.on));
      y -= th;
    }
    return y;
  }
  function bld(R, x, w, h, B, kind, v) {
    const sd = Math.max(1, Math.round(w * 0.22)), tiny = w < 6 || h < 12, ch = tiny ? 2 : 3, wh = tiny ? 1 : 2, y = B - h;
    if (kind === 'stone') {
      const m = pick(rng, stone);
      R.rect(x, y, w, h, m); R.rect(x + w - sd, y, sd, h, stoneD); R.rect(x, y, w, 1, stoneL);
      winGrid(R, rng, x + 1, y + 2, w - 1 - sd, h - 3, W, { cw: 2, ch, ww: 1, wh, lit: 0.42 });
      if (h > 22 && w >= 7 && rng() < 0.75) { const t = setback(R, x, w, y, m, stoneD, stoneL, ri(rng, 1, 3)); if (rng() < 0.3) R.rect(x + (w >> 1), t - 3, 1, 3, stoneD); }
      else if (w >= 5 && rng() < 0.5) tank(R, x + ri(rng, 1, w - 4), y, v);
    } else if (kind === 'glass') {
      const m = pick(rng, glass);
      R.rect(x, y, w, h, m); R.rect(x + w - sd, y, sd, h, glassD);
      for (let xx = x + 2; xx < x + w - sd; xx += 3) R.rect(xx, y + 1, 1, h - 1, glassL);
      winGrid(R, rng, x + 1, y + 2, w - 2, h - 3, WG, { cw: 3, ch, ww: 2, wh: 1, lit: 0.34 });
      if (w > 7 && rng() < 0.35) { R.rect(x + 2, y - 2, w - 4, 2, glassD); }
    } else if (kind === 'dark') {
      const m = pick(rng, dark);
      R.rect(x, y, w, h, m); R.rect(x + w - sd, y, sd, h, darkD);
      for (let yy = y + 2; yy < B - 1; yy += 3) R.rect(x, yy, w - sd, 1, darkL);
      winGrid(R, rng, x + 1, y + 1, w - 2, h - 2, WD, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.3, skip: 0.2 });
      R.rect(x, y, w, 2, darkD);
    } else if (kind === 'white') {
      const m = pick(rng, white);
      R.rect(x, y, w, h, m); R.rect(x + w - sd, y, sd, h, whiteD);
      for (let yy = y + 2; yy < B - 1; yy += ch) R.rect(x + 1, yy, w - 1 - sd, 1, band);
      winGrid(R, rng, x + 1, y + 2, w - 1 - sd, h - 3, W, { cw: 2, ch, ww: 1, wh: 1, lit: 0.42, skip: 0.3 });
      if (w >= 6 && rng() < 0.3) R.rect(x + 1, y - 2, ((w - 2) >> 1) + 1, 2, whiteD);
    } else if (kind === 'brick') {
      const m = pick(rng, brick);
      R.rect(x, y, w, h, m); R.rect(x + w - sd, y, sd, h, brickD); R.rect(x, y, w, 1, stoneL);
      winGrid(R, rng, x + 1, y + 2, w - 1 - sd, h - 3, W, { cw: 2, ch, ww: 1, wh, lit: 0.48 });
      if (w >= 5 && rng() < 0.6) tank(R, x + ri(rng, 1, w - 4), y, v);
    } else {
      const m = pick(rng, tan);
      R.rect(x, y, w, h, m); R.rect(x + w - sd, y, sd, h, tanD); R.rect(x, y, w, 1, stoneL);
      winGrid(R, rng, x + 1, y + 2, w - 1 - sd, h - 3, W, { cw: 2, ch, ww: 1, wh: 1, lit: 0.5 });
      if (w >= 6 && rng() < 0.4) R.rect(x + 2, y - 2, w - 5, 2, m);
      else if (w >= 5 && rng() < 0.5) tank(R, x + ri(rng, 1, w - 4), y, v);
    }
  }
  const MIX = {
    fidi: { stone: 0.3, glass: 0.25, dark: 0.25, white: 0.12, tan: 0.08 },
    midtown: { stone: 0.3, glass: 0.32, dark: 0.12, white: 0.14, tan: 0.12 },
    east: { tan: 0.32, white: 0.26, brick: 0.22, glass: 0.12, stone: 0.08 },
    lowrise: { brick: 0.55, tan: 0.2, stone: 0.15, white: 0.1 },
    haze: { stone: 0.4, glass: 0.35, white: 0.25 },
  };
  const kindOf = mix => { let u = rng(); for (const k in mix) { u -= mix[k]; if (u <= 0) return k; } return 'stone'; };
  /* space kept for the landmarks: fabric under them is capped at a height */
  const keep = {};
  const reserve = (Ly, m, halfPx, cap) => { const x = at(Ly, m); (keep[Ly.name] = keep[Ly.name] || []).push([x - halfPx, x + halfPx, cap]); };
  function capAt(Ly, x0, x1) { let c = 1e9; for (const k of keep[Ly.name] || []) if (x1 > k[0] && x0 < k[1]) c = Math.min(c, k[2]); return c; }
  function fabric(Ly, m0, m1, hM, o) {
    o = o || {};
    const R = Ly.R, B = R.h - (o.base == null ? 3 : o.base), v = V(Ly), xEnd = at(Ly, m1), mix = MIX[o.mix || 'fidi'];
    const wm = o.w || [24, 55];
    let x = at(Ly, m0);
    while (x < xEnd) {
      const w = Math.max(o.minW || 3, Math.round(rf(rng, wm[0], wm[1]) * v));
      const m = mr((x + w / 2) / Ly.p);
      let h = Math.round(hM(m) * v * rf(rng, 0.45, 1.05));
      h = Math.min(h, capAt(Ly, x, x + w));
      if (h >= 3 && rng() < (o.fill || 0.92)) bld(R, x, w, h, B, kindOf(mix), v);
      x += w + (rng() < (o.gap == null ? 0.2 : o.gap) ? ri(rng, 1, 3) : 0);
    }
  }
  function ground(Ly, h, m, tr) {
    const R = Ly.R;
    R.rect(0, R.h - h, R.w, h, m);
    if (tr) woods(R, rng, 0, R.w, R.h - 1, x => tr(mr(x / Ly.p)), leafFar, { rMin: 1.2, rMax: 2.2 });
  }
  /* parks along the route, metres */
  const parkH = m => (m < 60 || m > 9420 ? 9 : 0);

  /* ============ far (p .18): Midtown West, Billionaires' Row ============ */
  {
    const L = LF, R = L.R, B = R.h - 3, v = V(L);
    ground(L, 4, gnd[0], parkH);
    reserve(L, 8950, 14, 18);
    fabric(L, -40, 9560, curve([[-40, 30], [500, 70], [1200, 60], [2000, 35], [5500, 35], [7000, 70], [7600, 140], [8400, 160], [9100, 120], [9400, 40], [9560, 25]]), { mix: 'haze', w: [30, 70], fill: 0.85 });
    const s = v * 1.25;
    /* 111 West 57th: the thinnest tower, terracotta piers and a feathered top */
    { const t = M.add('#b9a58c'), tD = M.add('#97846d'), g = M.add('#93a9bf', KG);
      const cx = at(L, 8890), h = Math.round(435 * s);
      R.rect(cx - 1, B - h + 6, 3, h - 6, g); R.rect(cx - 1, B - h + 6, 1, h - 6, t); R.rect(cx + 1, B - h + 10, 1, h - 10, tD);
      R.rect(cx - 1, B - h + 3, 2, 3, t); R.rect(cx - 1, B - h, 1, 3, t); dyn.blink.push({ L: 'far', x: cx - 1, y: B - h - 1 }); }
    /* One57: blue glass, curving down in waves */
    { const g = M.add('#6d8fb8', KG), gL = M.add('#9ab5d4', KG); const cx = at(L, 8950), h = Math.round(306 * s);
      R.rect(cx - 3, B - h + 4, 6, h - 4, g); R.rect(cx - 2, B - h + 2, 4, 2, g); R.rect(cx - 1, B - h, 3, 2, g); for (let y = B - h + 6; y < B; y += 3) R.rect(cx - 3, y, 5, 1, gL); }
    /* Central Park Tower: the tallest, white with a cantilevered step */
    { const g = M.add('#c8d3dc', KG), gD = M.add('#9fb0c0', KG), cx = at(L, 9010), h = Math.round(472 * s);
      R.rect(cx - 2, B - h, 5, h, g); R.rect(cx + 2, B - h, 1, h, gD); R.rect(cx - 3, B - Math.round(h * 0.55), 1, Math.round(h * 0.55), g);
      for (let y = B - h + 3; y < B; y += 4) R.px(cx, y, gD);
      dyn.blink.push({ L: 'far', x: cx, y: B - h - 1 }); }
    lm(L, at(L, 8950), "Billionaires' Row");
  }

  /* ============ wtc (p .25): One WTC, Empire State, One Vanderbilt, 270 Park, 432 Park ============ */
  {
    const L = LW, R = L.R, B = R.h - 3, v = V(L);
    ground(L, 4, gnd[1], parkH);
    reserve(L, 960, 9, 22); reserve(L, 7375, 10, 16); reserve(L, 7604, 6, 18); reserve(L, 7995, 7, 18); reserve(L, 8701, 5, 18);
    fabric(L, -40, 9560, curve([[-40, 40], [300, 110], [700, 200], [1050, 220], [1350, 150], [1800, 60], [2400, 40], [6000, 50], [7000, 80], [7300, 150], [7900, 220], [8800, 200], [9250, 90], [9560, 40]]), { mix: 'midtown', w: [26, 60], fill: 0.97, gap: 0.08 });
    /* 3 World Trade Center beside it, dark glass with its X braces */
    { const cx = at(L, 1010), h = Math.round(329 * v); bld(R, cx - 3, 7, h, B, 'glass', v); R.line(cx - 3, B - h + 2, cx + 2, B - h + 10, glassD); R.line(cx + 2, B - h + 2, cx - 3, B - h + 10, glassD); }
    /* One World Trade Center: square base, eight tapering triangles, the mast */
    {
      const s = v * 1.3, cx = at(L, 960), h = Math.round(417 * s), hb = Math.round(57 * s);
      const pod = M.add('#a9b8c8'), pA = M.add('#86a8cb', KG), pB = M.add('#5c7ea6', KG), pL = M.add('#b3cbe2', KG), sp = M.add('#e0e4e9', KF, '#f4f8ff', 0.6);
      R.rect(cx - 5, B - hb, 11, hb, pod); for (let x = cx - 4; x < cx + 6; x += 2) R.rect(x, B - hb + 1, 1, hb - 1, pL);
      R.poly([cx - 5.5, B - hb, cx + 6.5, B - hb, cx + 4.5, B - h, cx - 3.5, B - h], pA);
      R.poly([cx + 0.5, B - hb, cx + 6.5, B - hb, cx + 4.5, B - h], pB);
      R.poly([cx - 3.5, B - h, cx + 4.5, B - h, cx + 0.5, B - hb], pL);
      for (let y = B - h + 3; y < B - hb - 1; y += 3) for (let x = cx - 5; x <= cx + 6; x++) { const c = R.get(x, y); if ((c === pA || c === pB || c === pL) && rng() < 0.35) R.px(x, y, pick(rng, WG.on)); }
      R.rect(cx - 3, B - h - 2, 8, 2, pod);
      R.rect(cx, B - h - 26, 1, 24, sp); R.rect(cx - 1, B - h - 8, 3, 1, sp); R.rect(cx - 1, B - h - 15, 3, 1, sp);
      dyn.blink.push({ L: 'wtc', x: cx, y: B - h - 27 });
      lm(L, cx, 'One World Trade Center');
    }
    /* Empire State Building: limestone set-backs, the mooring mast, its coloured crown */
    {
      const s = v * 1.3, cx = at(L, 7375);
      const esb = M.add('#cfc6b2'), esbD = M.add('#a29a86'), col = M.add('#8b8576');
      const top = M.add('#d9d0bc', KF, '#ffd27a', 0.7), mast = M.add('#e3ddcd', KF, '#fff3d8', 0.8), ant = M.add('#9aa0a8');
      const tiers = [[20, 0, 7], [15, 7, 12], [11, 12, Math.round(320 * s) - 8], [9, Math.round(320 * s) - 8, Math.round(320 * s)]];
      for (const [w, a, b] of tiers) {
        const x0 = cx - (w >> 1);
        R.rect(x0, B - b, w, b - a, esb); R.rect(x0 + w - 2, B - b, 2, b - a, esbD);
        for (let x = x0 + 1; x < x0 + w - 2; x += 2) { R.rect(x, B - b + 1, 1, b - a - 1, col); for (let y = B - b + 1; y < B - a - 1; y += 2) if (rng() < 0.3) R.px(x, y, pick(rng, W.on)); }
      }
      const yR = B - Math.round(320 * s);
      R.rect(cx - 3, yR - 3, 6, 3, top); R.rect(cx - 2, yR - 6, 4, 3, top); R.rect(cx + 1, yR - 6, 1, 6, esbD);
      R.rect(cx - 1, yR - 12, 3, 6, mast); R.px(cx, yR - 11, col); R.px(cx, yR - 8, col); R.rect(cx, yR - 14, 1, 2, mast);
      R.rect(cx, yR - 24, 1, 10, ant);
      dyn.blink.push({ L: 'wtc', x: cx, y: yR - 25 });
      lm(L, cx, 'the Empire State Building');
    }
    /* One Vanderbilt: terracotta-and-glass planes tapering to a pointed crown */
    {
      const cx = at(L, 7604), h = Math.round(400 * v), g = M.add('#b9c3c9', KG), gD = M.add('#8a98a5', KG), tc = M.add('#d8cfc2', KF, '#fff4dc', 0.4);
      R.poly([cx - 5, B, cx + 5, B, cx + 4, B - h + 12, cx + 1, B - h, cx - 3, B - h + 6], g);
      R.poly([cx + 1, B, cx + 5, B, cx + 4, B - h + 12, cx + 1, B - h + 2], gD);
      R.line(cx - 3, B - h + 6, cx - 4, B, tc); R.line(cx + 1, B - h, cx + 1, B - 4, tc);
      winGrid(R, rng, cx - 3, B - h + 14, 7, h - 16, WG, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.35, skip: 0.2 });
      R.rect(cx + 1, B - h - 7, 1, 7, tc); dyn.blink.push({ L: 'wtc', x: cx + 1, y: B - h - 8 });
    }
    /* 270 Park Avenue: the new JPMorgan tower, fanned columns at the foot, stepped crown with fins */
    {
      const cx = at(L, 7995), h = Math.round(388 * v), g = M.add('#a8b5c0', KG), gD = M.add('#7f8d9a', KG), fin = M.add('#d5dadf', KF, '#eef4ff', 0.35);
      R.rect(cx - 5, B - h + 14, 11, h - 14, g); R.rect(cx + 3, B - h + 14, 3, h - 14, gD);
      R.rect(cx - 4, B - h + 7, 9, 7, g); R.rect(cx - 3, B - h, 7, 7, g); R.rect(cx + 2, B - h, 2, 14, gD);
      for (const x of [cx - 4, cx - 2, cx + 1, cx + 3]) R.rect(x, B - h - 3, 1, 3, fin);
      R.line(cx - 5, B - 1, cx - 2, B - 7, fin); R.line(cx + 5, B - 1, cx + 2, B - 7, fin); R.rect(cx - 5, B - 3, 11, 3, 0);
      R.rect(cx - 1, B - 3, 2, 3, gD);
      winGrid(R, rng, cx - 4, B - h + 16, 8, h - 22, WG, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.35 });
    }
    /* 432 Park Avenue: a very tall, very thin square grid */
    {
      const s = v * 1.2, cx = at(L, 8701), h = Math.round(426 * s), p = M.add('#e8e5de'), pD = M.add('#c4c0b8'), win = M.add('#4a5566', KW, '#ffe0a0', 0.25, true);
      R.rect(cx - 2, B - h, 5, h, p); R.rect(cx + 2, B - h, 1, h, pD);
      for (let y = B - h + 2; y < B - 2; y += 2) { R.px(cx - 1, y, rng() < 0.3 ? win : W.off); R.px(cx + 1, y, rng() < 0.3 ? win : W.off); }
      for (const f of [0.3, 0.52, 0.74]) R.rect(cx - 2, B - Math.round(h * f), 5, 1, W.off);
      dyn.blink.push({ L: 'wtc', x: cx, y: B - h - 1 });
      lm(L, cx, '432 Park Avenue');
    }
  }

  /* ============ core (p .32): Woolworth, Chrysler, MetLife, Citigroup, 731 Lexington ============ */
  {
    const L = LC, R = L.R, B = R.h - 3, v = V(L);
    ground(L, 4, gnd[2], parkH);
    reserve(L, 1327, 9, 26); reserve(L, 7651, 9, 18); reserve(L, 7726, 10, 26); reserve(L, 8517, 6, 22); reserve(L, 9039, 7, 22);
    fabric(L, -40, 9560, curve([[-40, 40], [400, 160], [800, 200], [1250, 150], [1700, 70], [2400, 35], [6800, 45], [7300, 110], [7800, 170], [8800, 170], [9300, 90], [9560, 35]]), { mix: 'midtown', w: [26, 60], fill: 0.97, gap: 0.08 });
    /* Woolworth Building: a white terracotta gothic tower with a green copper top */
    {
      const s = v * 1.2, cx = at(L, 1327), tw = M.add('#e3dccb', KF, '#ffe8c0', 0.22), twD = M.add('#bcb39f'), cu = M.add('#78a58f', KF, '#a8e6c8', 0.5), cuD = M.add('#55806e');
      const hb = Math.round(118 * s), ht = Math.round(220 * s);
      R.rect(cx - 9, B - hb, 18, hb, tw); R.rect(cx + 5, B - hb, 4, hb, twD);
      for (let x = cx - 8; x < cx + 5; x += 2) R.rect(x, B - hb + 1, 1, hb - 2, twD);
      winGrid(R, rng, cx - 8, B - hb + 2, 13, hb - 4, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.35, skip: 0.4 });
      R.rect(cx - 4, B - ht, 8, ht - hb, tw); R.rect(cx + 2, B - ht, 2, ht - hb, twD);
      for (let x = cx - 3; x < cx + 2; x += 2) R.rect(x, B - ht + 2, 1, ht - hb - 2, twD);
      for (const px of [cx - 5, cx + 4]) { R.rect(px, B - ht - 2, 1, 4, tw); R.px(px, B - ht - 3, cu); }
      R.rect(cx - 3, B - ht - 3, 6, 3, tw); R.rect(cx - 3, B - ht - 3, 6, 1, twD);
      R.poly([cx - 3.5, B - ht - 3, cx + 3.5, B - ht - 3, cx, B - ht - 11], cu); R.poly([cx, B - ht - 3, cx + 3.5, B - ht - 3, cx, B - ht - 11], cuD);
      R.rect(cx, B - ht - 14, 1, 3, cu);
      lm(L, cx, 'the Woolworth Building');
    }
    /* Chrysler Building: the stainless-steel sunburst crown and spire */
    {
      const s = v * 1.2, cx = at(L, 7651), chr = M.add('#d7d3cb'), chrD = M.add('#aeaaa2'), col = M.add('#8d8a86');
      const st = M.add('#d6dce2', KF, '#f2f6ff', 0.55), stD = M.add('#9aa3ad', KF, '#c9d4e2', 0.3), tri = M.add('#2f3238', KN, '#fff3c0', 1.1), stL = M.add('#f2f5f8', KF, '#ffffff', 0.7);
      const hs = Math.round(240 * s);
      R.rect(cx - 9, B - 16, 18, 16, chr); R.rect(cx + 6, B - 16, 3, 16, chrD);
      R.rect(cx - 6, B - 22, 12, 6, chr); R.rect(cx - 4, B - hs, 9, hs - 16, chr); R.rect(cx + 3, B - hs, 2, hs - 16, chrD);
      for (let x = cx - 3; x < cx + 3; x += 2) { R.rect(x, B - hs + 1, 1, hs - 2, col); for (let y = B - hs + 1; y < B - 2; y += 2) if (rng() < 0.3) R.px(x, y, pick(rng, W.on)); }
      for (const ex of [cx - 5, cx + 5]) R.px(ex, B - hs + 2, st);
      /* the crown: five diminishing arches with triangular windows */
      for (let i = 0; i < 5; i++) {
        const w = 9 - i * 2 + (i === 0 ? 0 : 1), y = B - hs - i * 3;
        if (w < 2) break;
        R.ellipse(cx + 0.5, y, w / 2 + 0.3, 3.4, st); R.ellipse(cx + 1.5, y + 0.6, w / 2 - 1, 2.6, stD);
        R.px(cx - Math.floor(w / 2) + 1, y - 1, tri); R.px(cx + 0.5, y - 2, tri); R.px(cx + Math.floor(w / 2), y - 1, tri);
      }
      R.poly([cx - 1, B - hs - 14, cx + 2, B - hs - 14, cx + 0.5, B - Math.round(319 * s)], st);
      R.line(cx + 0.5, B - hs - 14, cx + 0.5, B - Math.round(319 * s) + 1, stL);
      lm(L, cx, 'the Chrysler Building');
    }
    /* MetLife: the broad octagonal slab astride Park Avenue */
    {
      const cx = at(L, 7726), h = Math.round(246 * v), c = M.add('#b9b8b0'), cD = M.add('#8f8f89'), sign = M.add('#e8eef6', KN, '#dfefff', 0.8);
      R.rect(cx - 9, B - h, 18, h, c); R.rect(cx - 10, B - h + 3, 1, h - 3, cD); R.rect(cx + 9, B - h + 3, 1, h - 3, cD); R.rect(cx + 5, B - h, 4, h, cD);
      for (let y = B - h + 3; y < B - 2; y += 2) R.rect(cx - 8, y, 13, 1, W.off);
      winGrid(R, rng, cx - 8, B - h + 3, 13, h - 5, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.3, skip: 0.3 });
      R.rect(cx - 8, B - h + 1, 12, 1, sign);
    }
    /* Citigroup Center: square shaft, 45-degree crown rising to the north, stilts at the foot */
    {
      const s = v * 1.1, cx = at(L, 8517), h = Math.round(220 * s), ht = Math.round(279 * s);
      const c = M.add('#cfd4da'), cD = M.add('#a7aeb7'), cTop = M.add('#e3e8ee', KF, '#f0f6ff', 0.55);
      R.rect(cx - 5, B - h, 10, h, c); R.rect(cx + 3, B - h, 2, h, cD);
      for (let y = B - h + 2; y < B - 6; y += 2) R.rect(cx - 5, y, 8, 1, W.off);
      winGrid(R, rng, cx - 5, B - h + 2, 8, h - 8, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.4 });
      R.poly([cx - 5, B - h, cx + 5, B - h, cx + 5, B - ht], cTop); R.line(cx - 5, B - h, cx + 5, B - ht, cD);
      R.rect(cx - 5, B - 6, 3, 6, 0); R.rect(cx + 2, B - 6, 3, 6, 0); R.rect(cx - 1, B - 6, 2, 6, cD);
      lm(L, cx, 'the Citigroup Center');
    }
    /* 731 Lexington (Bloomberg) */
    { const cx = at(L, 9039), h = Math.round(246 * v), g = M.add('#6f8fae', KG), gD = M.add('#557493', KG);
      R.rect(cx - 6, B - h, 9, h, g); R.rect(cx + 1, B - h, 2, h, gD); R.rect(cx + 3, B - Math.round(h * 0.55), 5, Math.round(h * 0.55), gD);
      winGrid(R, rng, cx - 5, B - h + 2, 6, h - 4, WG, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.4 }); dyn.blink.push({ L: 'core', x: cx - 2, y: B - h - 1 }); }
  }

  /* ============ fore (p .42): 40 Wall, 28 Liberty, 8 Spruce, Municipal Building ============ */
  {
    const L = LO, R = L.R, B = R.h - 3, v = V(L);
    ground(L, 4, gnd[3], parkH);
    reserve(L, 774, 7, 30); reserve(L, 888, 7, 30); reserve(L, 1352, 7, 30); reserve(L, 1610, 18, 30);
    fabric(L, -40, 9560, curve([[-40, 35], [300, 140], [700, 170], [1200, 130], [1650, 80], [2000, 50], [2400, 32], [6800, 40], [7200, 80], [7700, 130], [8600, 130], [9300, 80], [9560, 30]]), { mix: 'fidi', w: [26, 55], fill: 0.95, gap: 0.1 });
    /* 40 Wall Street: a slender shaft under a green pyramid and spire */
    {
      const s = v * 1.1, cx = at(L, 774), h = Math.round(232 * s), c = M.add('#c8b896'), cD = M.add('#a3946f');
      const cu = M.add('#6fa792', KF, '#9bf0c8', 0.6), cuD = M.add('#4f8571'), dorm = M.add('#e8e2cf', KN, '#fff0c0', 0.6);
      R.rect(cx - 7, B - 30, 14, 30, c); R.rect(cx + 4, B - 30, 3, 30, cD);
      R.rect(cx - 5, B - h, 10, h - 30, c); R.rect(cx + 3, B - h, 2, h - 30, cD);
      winGrid(R, rng, cx - 6, B - h + 2, 10, h - 4, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.4 });
      R.rect(cx - 4, B - h - 3, 8, 3, c);
      R.poly([cx - 4.5, B - h - 3, cx + 4.5, B - h - 3, cx, B - h - 14], cu); R.poly([cx, B - h - 3, cx + 4.5, B - h - 3, cx, B - h - 14], cuD);
      R.px(cx - 2, B - h - 5, dorm); R.px(cx + 1, B - h - 5, dorm); R.px(cx - 1, B - h - 8, dorm);
      R.rect(cx, B - h - 20, 1, 6, cu);
      lm(L, cx, '40 Wall Street');
    }
    /* 28 Liberty: a plain silver box with black bands */
    { const cx = at(L, 888), h = Math.round(248 * v), c = M.add('#c5ccd2'), cD = M.add('#9aa2aa');
      R.rect(cx - 6, B - h, 13, h, c); R.rect(cx + 4, B - h, 3, h, cD);
      for (let y = B - h + 2; y < B - 2; y += 2) R.rect(cx - 6, y, 13, 1, WD.off);
      winGrid(R, rng, cx - 5, B - h + 2, 9, h - 4, WD, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.35 }); }
    /* 8 Spruce Street: rippled stainless steel, stepping down on its flanks */
    {
      const cx = at(L, 1352), h = Math.round(265 * v), a = M.add('#d2d6da', KG), b = M.add('#a9b0b8', KG), c2 = M.add('#eef1f3', KG), sch = M.add('#9c6a52');
      R.rect(cx - 9, B - 8, 18, 8, sch); winGrid(R, rng, cx - 8, B - 7, 16, 6, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.6 });
      const steps = [[-5, 4, h], [-6, -5, h - 10], [4, 5, h - 6], [5, 6, h - 18]];
      for (const [l, r, hh] of steps) for (let x = cx + l; x < cx + r; x++) for (let y = B - hh; y < B - 8; y++) { const k = (y + Math.round(2 * Math.sin(x * 1.7 + y * 0.5))) % 4; R.px(x, y, k === 0 ? c2 : k === 2 ? b : a); }
      for (let y = B - h + 2; y < B - 9; y += 3) for (let x = cx - 5; x < cx + 4; x++) if (rng() < 0.18) R.px(x, y, pick(rng, WG.on));
      lm(L, cx, '8 Spruce Street');
    }
    /* Manhattan Municipal Building: wide wings, a colonnaded wedding-cake tower, Civic Fame on top */
    {
      const s = v * 1.2, cx = at(L, 1610), hb = Math.round(135 * s), st = M.add('#ddd3bd', KF, '#ffe2a8', 0.14), stD = M.add('#b5aa92');
      const gold = M.add('#d9b14a', KF, '#ffd86a', 0.9), col = M.add('#8f8673');
      R.rect(cx - 17, B - hb, 34, hb, st); R.rect(cx + 11, B - hb, 6, hb, stD); R.rect(cx - 17, B - hb, 34, 1, stD);
      winGrid(R, rng, cx - 16, B - hb + 3, 26, hb - 8, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.4 });
      R.rect(cx - 4, B - 8, 8, 8, col); R.rect(cx - 3, B - 7, 6, 7, 0);
      let y = B - hb;
      for (const [w, th] of [[16, 4], [11, 4], [8, 4], [6, 3], [4, 3]]) {
        R.rect(cx - (w >> 1), y - th, w, th, st); R.rect(cx + (w >> 1) - 2, y - th, 2, th, stD);
        for (let x = cx - (w >> 1) + 1; x < cx + (w >> 1) - 1; x += 2) R.rect(x, y - th + 1, 1, th - 1, col);
        y -= th;
      }
      for (const dx of [-7, 6]) { R.rect(cx + dx, B - hb - 4, 1, 4, st); R.px(cx + dx, B - hb - 5, stD); }
      R.rect(cx - 1, y - 2, 2, 2, stD); R.rect(cx, y - 6, 1, 4, gold); R.px(cx - 1, y - 5, gold); R.px(cx + 1, y - 6, gold);
      lm(L, cx, 'the Municipal Building');
    }
  }

  /* ============ mid (p .54): 70 Pine; LES housing, Stuyvesant Town, Kips Bay, Bellevue ============ */
  {
    const L = LM, R = L.R, B = R.h - 3, v = V(L);
    ground(L, 4, gnd[4], parkH);
    reserve(L, 884, 7, 30);
    fabric(L, -40, 2320, curve([[-40, 25], [250, 110], [700, 140], [1200, 90], [1700, 55], [2320, 50]]), { mix: 'fidi', w: [26, 55], fill: 0.92, gap: 0.12 });
    fabric(L, 7140, 9560, curve([[7140, 50], [7600, 80], [8600, 90], [9300, 60], [9560, 30]]), { mix: 'east', w: [26, 55], fill: 0.85 });
    /* the Lower East Side: red brick housing slabs over tenements */
    fabric(L, 2320, 7140, curve([[2320, 26], [5150, 24], [5500, 30], [7140, 40]]), { mix: 'lowrise', w: [18, 30], fill: 0.97, gap: 0.05 });
    const slab = (m, w, h, mm, mD) => { const x = at(L, m) - (w >> 1); R.rect(x, B - h, w, h, mm); R.rect(x + w - 2, B - h, 2, h, mD); R.rect(x, B - h, w, 1, stoneL); winGrid(R, rng, x + 1, B - h + 2, w - 3, h - 3, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.5 }); tank(R, x + 1, B - h, v); };
    for (const m of [2400, 2480, 2560, 2750, 2900, 3150, 3300, 3450, 3900, 4100, 4250, 4450, 4600, 4800, 5000]) slab(m, ri(rng, 9, 12), ri(rng, 18, 26), pick(rng, brick), brickD);
    /* Stuyvesant Town and Peter Cooper Village: rows of identical 13-storey brick slabs */
    for (let m = 5560; m < 6300; m += 46) slab(m, 9, 17, brick[1], brickD);
    /* Kips Bay Towers: two long concrete grids */
    { const kb = M.add('#d5d0c4'), kbD = M.add('#aaa497');
      for (const m of [6700, 6990]) { const x = at(L, m) - 9; R.rect(x, B - 20, 18, 20, kb); R.rect(x + 15, B - 20, 3, 20, kbD); for (let y = B - 19; y < B - 1; y += 2) for (let xx = x + 1; xx < x + 15; xx += 2) R.px(xx, y, rng() < 0.4 ? pick(rng, W.on) : W.off); } }
    /* Bellevue: the big tan hospital tower and the old brick building with its arcade */
    { const c = M.add('#c7b28f'), cD = M.add('#a08c6c'), x = at(L, 6610) - 14;
      R.rect(x, B - 30, 26, 30, c); R.rect(x + 21, B - 30, 5, 30, cD); for (let y = B - 28; y < B - 2; y += 2) R.rect(x + 1, y, 20, 1, W.off);
      winGrid(R, rng, x + 1, B - 28, 20, 26, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.6 }); R.rect(x + 4, B - 33, 10, 3, cD);
      const ox = x - 14; R.rect(ox, B - 12, 14, 12, brick[2]); R.rect(ox, B - 12, 14, 1, stoneL); for (let xx = ox + 1; xx < ox + 13; xx += 3) R.rect(xx, B - 5, 2, 5, W.off); winGrid(R, rng, ox + 1, B - 10, 12, 4, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.6 });
      lm(L, x + 12, 'Bellevue'); }
    lm(L, at(L, 5930), 'Stuyvesant Town');
    /* 70 Pine Street: a slender art-deco shaft, set-backs and a lit glass spire */
    {
      const cx = at(L, 884), h = Math.round(240 * v), c = M.add('#c9b394'), cD = M.add('#a28d6e'), lan = M.add('#e9eef2', KF, '#fff4d0', 0.9), sp = M.add('#d7d7cf', KF, '#fff4d0', 0.5);
      R.rect(cx - 8, B - 40, 16, 40, c); R.rect(cx + 5, B - 40, 3, 40, cD);
      R.rect(cx - 6, B - h + 12, 12, h - 52, c); R.rect(cx + 3, B - h + 12, 3, h - 52, cD);
      for (let x = cx - 5; x < cx + 3; x += 2) R.rect(x, B - h + 13, 1, h - 14, cD);
      winGrid(R, rng, cx - 6, B - h + 14, 9, h - 16, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.42 });
      R.rect(cx - 4, B - h + 4, 8, 8, c); R.rect(cx + 2, B - h + 4, 2, 8, cD); R.rect(cx - 3, B - h, 6, 4, c);
      R.rect(cx - 2, B - h - 4, 4, 4, lan); R.rect(cx - 1, B - h - 8, 2, 4, lan);
      R.rect(cx, B - Math.round(290 * v), 1, Math.round(290 * v) - h - 8, sp);
      dyn.blink.push({ L: 'mid', x: cx, y: B - Math.round(290 * v) - 1 });
      lm(L, cx, '70 Pine Street');
    }
  }

  /* ============ near (p .68): 55 Water, Southbridge; Con Ed; Tudor City, Trump World ============ */
  {
    const L = LN, R = L.R, B = R.h - 3, v = V(L);
    ground(L, 4, gnd[5], parkH);
    reserve(L, 553, 14, 22); reserve(L, 7733, 26, 14); reserve(L, 8095, 8, 26);
    fabric(L, 60, 1520, curve([[60, 40], [300, 90], [800, 80], [1200, 40], [1520, 30]]), { mix: 'fidi', w: [28, 55], fill: 0.6, gap: 0.5 });
    fabric(L, 7140, 9480, curve([[7140, 40], [7500, 70], [8600, 80], [9300, 60], [9480, 30]]), { mix: 'east', w: [26, 50], fill: 0.6, gap: 0.5 });
    /* Lower East Side co-ops and housing, low then rising to Peter Cooper and Kips Bay */
    fabric(L, 2330, 5250, curve([[2330, 45], [3700, 50], [5250, 30]]), { mix: 'lowrise', w: [26, 40], fill: 0.45, gap: 0.7 });
    fabric(L, 5600, 7100, curve([[5600, 35], [7100, 55]]), { mix: 'east', w: [26, 40], fill: 0.4, gap: 0.7 });
    /* 55 Water Street: the broad dark slab on the water */
    { const cx = at(L, 553), h = Math.round(209 * v), c = M.add('#5a4f48'), cD = M.add('#463d37'), fin = M.add('#7b6e64');
      R.rect(cx - 17, B - h, 34, h, c); R.rect(cx + 10, B - h, 7, h, cD); for (let x = cx - 16; x < cx + 10; x += 2) R.rect(x, B - h + 2, 1, h - 3, fin);
      winGrid(R, rng, cx - 15, B - h + 2, 24, h - 4, WD, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.35, skip: 0.15 });
      R.rect(cx + 17, B - 52, 20, 52, c); R.rect(cx + 32, B - 52, 5, 52, cD); for (let x = cx + 18; x < cx + 32; x += 2) R.rect(x, B - 50, 1, 49, fin);
      lm(L, cx, '55 Water Street'); }
    /* Southbridge Towers and the Smith Houses: brick slabs either side of the bridges */
    for (const m of [1480, 1540, 1800, 1860, 1930]) { const x = at(L, m) - 5, h = ri(rng, 22, 30), mm = m < 1600 ? tan[1] : brick[0]; R.rect(x, B - h, 10, h, mm); R.rect(x + 8, B - h, 2, h, m < 1600 ? tanD : brickD); winGrid(R, rng, x + 1, B - h + 2, 7, h - 3, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.5 }); }
    /* Con Edison East River station: a brick hall with tall striped stacks */
    { const x = at(L, 5389) - 20, br = M.add('#8d5242'), brD = M.add('#6d3d31'), stk = M.add('#bfb7aa'), stkD = M.add('#958d81'), rs = M.add('#c0453a');
      R.rect(x, B - 18, 40, 18, br); R.rect(x + 34, B - 18, 6, 18, brD); R.rect(x, B - 18, 40, 1, stoneL);
      for (let xx = x + 2; xx < x + 33; xx += 4) R.rect(xx, B - 15, 2, 10, W.off);
      for (const [dx, hh] of [[5, 52], [16, 56], [27, 52]]) { R.rect(x + dx, B - hh, 4, hh - 18, stk); R.rect(x + dx + 3, B - hh, 1, hh - 18, stkD); R.rect(x + dx, B - hh, 4, 2, rs); R.rect(x + dx, B - hh + 4, 4, 1, rs); dyn.blink.push({ L: 'near', x: x + dx + 1, y: B - hh - 1 }); }
      lm(L, x + 20, 'the Con Edison East River station'); }
    /* NYU Langone's new glass tower by the FDR */
    { const cx = at(L, 6920); bld(R, cx - 7, 14, 36, B, 'glass', v); }
    /* Tudor City: brick neo-gothic towers on their ridge, the red sign on the roof */
    {
      const x0 = at(L, 7733) - 24, br = M.add('#9d6450'), brD = M.add('#7c4c3c'), trim = M.add('#d9ccb0'), sign = M.add('#d8473a', KN, '#ff4a32', 1);
      for (const [dx, w, h] of [[0, 12, 26], [12, 10, 32], [22, 14, 38], [36, 12, 30]]) {
        const x = x0 + dx; R.rect(x, B - h, w, h, br); R.rect(x + w - 2, B - h, 2, h, brD);
        winGrid(R, rng, x + 1, B - h + 3, w - 3, h - 4, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.5 });
        R.rect(x, B - h, w, 1, trim); for (let xx = x + 1; xx < x + w; xx += 3) R.px(xx, B - h - 1, trim);
      }
      /* "TUDOR CITY" in tiny neon capitals */
      const F = { T: ['###', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '###'], D: ['##.', '#.#', '#.#', '##.'], O: ['###', '#.#', '#.#', '###'], R: ['##.', '#.#', '##.', '#.#'], C: ['###', '#..', '#..', '###'], I: ['#', '#', '#', '#'], Y: ['#.#', '#.#', '.#.', '.#.'] };
      let tx = x0 + 22 - 18, ty = B - 38 - 7;
      R.rect(tx - 1, ty + 4, 38, 2, brD);
      for (const ch of 'TUDOR CITY') { if (ch === ' ') { tx += 2; continue; } R.stamp(tx, ty, F[ch], { '#': sign }); tx += F[ch][0].length + 1; }
      lm(L, x0 + 24, 'Tudor City');
    }
    /* One UN Plaza: the folded green-glass tower beside the UN */
    { const cx = at(L, 7880), h = Math.round(154 * v), g = M.add('#5f8d8a', KG), gD = M.add('#4a706e', KG);
      R.poly([cx - 6, B, cx + 6, B, cx + 6, B - h + 4, cx + 2, B - h, cx - 6, B - h + 8], g); R.rect(cx + 3, B - h + 4, 3, h - 4, gD);
      for (let y = B - h + 8; y < B - 1; y += 2) R.rect(cx - 6, y, 9, 1, gD); }
    /* Trump World Tower: a tall, narrow dark bronze slab */
    { const cx = at(L, 8095), h = Math.round(262 * v * 0.85), g = M.add('#4a4238', KG), gD = M.add('#38322b', KG), gL = M.add('#6a5e50', KG);
      R.rect(cx - 6, B - h, 12, h, g); R.rect(cx + 3, B - h, 3, h, gD); for (let x = cx - 5; x < cx + 3; x += 2) R.rect(x, B - h + 1, 1, h - 1, gL);
      winGrid(R, rng, cx - 5, B - h + 2, 8, h - 4, WD, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.3 }); dyn.blink.push({ L: 'near', x: cx, y: B - h - 1 }); }
  }

  /* ============ front (p .84): 120 Wall, One Manhattan Sq; Waterside; American Copper; the UN ============ */
  {
    const L = LR, R = L.R, B = R.h - 3, v = V(L);
    ground(L, 4, gnd[6], parkH);
    /* South Street: low brick and the Seaport's Schermerhorn Row */
    fabric(L, 60, 1560, curve([[60, 25], [1560, 25]]), { mix: 'lowrise', w: [18, 35], fill: 0.55, gap: 0.6 });
    fabric(L, 8250, 9420, curve([[8250, 70], [9000, 90], [9420, 40]]), { mix: 'east', w: [24, 46], fill: 0.75, gap: 0.4 });
    /* 120 Wall Street: a wedding-cake ziggurat of buff brick */
    { const cx = at(L, 887), c = M.add('#d2bc96'), cD = M.add('#a99470');
      let y = B; for (const [w, th] of [[30, 20], [24, 14], [18, 12], [13, 8], [8, 5]]) { R.rect(cx - (w >> 1), y - th, w, th, c); R.rect(cx + (w >> 1) - 3, y - th, 3, th, cD); winGrid(R, rng, cx - (w >> 1) + 1, y - th + 2, w - 4, th - 3, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.45 }); R.rect(cx - (w >> 1), y - th, w, 1, stoneL); y -= th; }
      lm(L, cx, '120 Wall Street'); }
    /* One Manhattan Square: the tall dark glass slab right at the Manhattan Bridge */
    { const cx = at(L, 2290), h = Math.round(247 * v * 0.9), g = M.add('#3f5672', KG), gD = M.add('#30435a', KG), gL = M.add('#6a86a6', KG);
      R.rect(cx - 10, B - h, 20, h, g); R.rect(cx + 5, B - h, 5, h, gD); for (let x = cx - 9; x < cx + 5; x += 3) R.rect(x, B - h + 1, 1, h - 1, gL);
      R.rect(cx - 18, B - 22, 10, 22, g); R.rect(cx - 18, B - 22, 10, 1, gL);
      winGrid(R, rng, cx - 9, B - h + 2, 14, h - 4, WG, { cw: 3, ch: 2, ww: 2, wh: 1, lit: 0.4 }); dyn.blink.push({ L: 'front', x: cx, y: B - h - 1 });
      lm(L, cx, 'One Manhattan Square'); }
    /* Waterside Plaza: four chocolate-brick towers on a deck over the river */
    { const c = M.add('#6d4a3c'), cD = M.add('#55392e'), x0 = at(L, 6423) - 30;
      R.rect(x0 - 4, B - 6, 70, 6, c);
      for (const [dx, h] of [[0, 44], [17, 50], [34, 50], [51, 38]]) { const x = x0 + dx; R.rect(x, B - h, 12, h, c); R.rect(x + 9, B - h, 3, h, cD); R.px(x, B - h, 0); R.px(x + 11, B - h, 0); winGrid(R, rng, x + 1, B - h + 2, 8, h - 3, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.55 }); }
      lm(L, x0 + 28, 'Waterside Plaza'); }
    /* American Copper Buildings: two copper towers, bending apart, joined by a skybridge */
    {
      const cu = M.add('#b0704a'), cuD = M.add('#8a5536'), cuL = M.add('#cf8c5e'), sky = M.add('#9fc0d6', KN, '#ffe6b0', 0.5), x0 = at(L, 7213) - 16;
      const tower = (x, w, h, dir) => {
        for (let y = 0; y < h; y++) {
          const k = y > h * 0.45 ? Math.round(((y - h * 0.45) / (h * 0.55)) ** 1.6 * 4) : 0;
          const l = dir < 0 ? x - k : x, r = dir < 0 ? x + w : x + w + k;
          R.span(l, r, B - 1 - y, cu); R.px(dir < 0 ? l : r - 1, B - 1 - y, dir < 0 ? cuL : cuD);
        }
        for (let xx = x + 1; xx < x + w - 1; xx += 2) for (let y = B - h + 1; y < B - 1; y += 2) R.px(xx, y, rng() < 0.4 ? pick(rng, W.on) : cuD);
      };
      tower(x0, 12, Math.round(165 * v * 0.85), -1); tower(x0 + 20, 12, Math.round(140 * v * 0.85), 1);
      const sy = B - Math.round(100 * v * 0.85); R.rect(x0 + 12, sy - 3, 8, 3, sky); R.rect(x0 + 12, sy, 8, 1, cuD);
      lm(L, x0 + 16, 'the American Copper Buildings');
    }
    /* United Nations: the green Secretariat slab, the General Assembly with its dome */
    {
      const cx = at(L, 7825), h = Math.round(154 * v), w = 50, x = cx - 25;
      const g = M.add('#5f9a8c', KG), gD = M.add('#4a7f74', KG), gL = M.add('#8cc4b4', KG), mar = M.add('#e6e3da', KF, '#fff4dc', 0.25), louv = M.add('#2f3a3c');
      R.rect(x, B - h, w, h, g); R.rect(x, B - h, 2, h, mar); R.rect(x + w - 3, B - h, 3, h, mar); R.rect(x + w - 4, B - h, 1, h, whiteD);
      for (let yy = B - h + 2; yy < B - 2; yy += 2) R.rect(x + 2, yy, w - 6, 1, gD);
      for (let xx = x + 4; xx < x + w - 5; xx += 4) R.rect(xx, B - h + 1, 1, h - 2, gL);
      for (let yy = B - h + 3; yy < B - 3; yy += 2) for (let xx = x + 3; xx < x + w - 4; xx += 2) if (rng() < 0.32) R.px(xx, yy, pick(rng, WG.on));
      for (const f of [0.0, 0.18, 0.55]) R.rect(x + 2, B - h + Math.round(h * f) + (f ? 0 : 1), w - 5, 3, louv);
      R.rect(x - 1, B - h, w + 2, 1, mar);
      /* the low Conference Building along the river, flags in front */
      R.rect(x - 10, B - 8, w + 30, 8, white[1]); R.rect(x - 10, B - 8, w + 30, 1, mar); for (let xx = x - 9; xx < x + w + 19; xx += 3) R.rect(xx, B - 6, 2, 3, W.on[2]);
      /* the General Assembly: concave white box, low dome */
      const gx = at(L, 7930), ga = M.add('#e8e4d8', KF, '#fff2d0', 0.14), gaD = M.add('#c4bfb2'), dome = M.add('#c9c3b2');
      R.poly([gx - 18, B - 8, gx + 18, B - 8, gx + 19, B - 22, gx - 19, B - 22, gx - 18, B - 18, gx, B - 15], ga);
      R.poly([gx - 19, B - 22, gx + 19, B - 22, gx + 18, B - 25, gx - 18, B - 25], ga);
      R.line(gx - 18, B - 19, gx, B - 15, gaD); R.line(gx, B - 15, gx + 18, B - 19, gaD);
      R.ellipse(gx, B - 25, 7, 4, dome); R.rect(gx - 7, B - 25, 14, 1, gaD); R.rect(gx, B - 30, 1, 2, gaD);
      for (let xx = x - 6; xx < gx + 18; xx += 4) { R.rect(xx, B - 14, 1, 6, darkL); R.rect(xx + 1, B - 14, 2, 2, pick(rng, [red, glass[1], stone[0], Q.leaf[1], white[0]])); }
      lm(L, cx, 'the United Nations');
    }
    /* Rockefeller University: low stone labs among trees, north of the Queensboro */
    woods(R, rng, at(L, 9300), R.w + at(L, -40) + 30, B, x => 7 + 2 * Math.sin(x * 0.07), Q.leaf, { rMin: 2.5, rMax: 3.5 });
    woods(R, rng, 0, at(L, 40), B, x => 7 + 2 * Math.sin(x * 0.07), Q.leaf, { rMin: 2.5, rMax: 3.5 });
  }

  /* ============ the bank: the FDR Drive, the Battery, the Seaport, the parks ============ */
  const B = BK.R.h;
  const XM = [1588, 2245, 3727, 9247];                           // where the bridges land (metres)
  const nearBridge = (x, pad) => XM.some(m => Math.abs(x - rp(m)) < pad);
  {
    const R = BK.R, S2 = SH.R;
    const conc = M.add('#a9a59c'), concD = M.add('#7f7b74'), lampM = Q.lamp, rail = Q.rail;
    /* the bulkhead and esplanade */
    R.rect(0, B - 5, R.w, 1, Q.top); R.rect(0, B - 4, R.w, 3, Q.wall); R.rect(0, B - 1, R.w, 1, Q.wallD);
    for (let x = 0; x < R.w; x += 6) R.px(x + ((x / 6) & 1 ? 3 : 0), B - 3, Q.wallD);
    for (let x = 0; x < R.w; x++) if (!nearBridge(x, 16)) { R.px(x, B - 7, rail); if (x % 3 === 0) R.px(x, B - 6, rail); }
    R.rect(0, B - 9, R.w, 3, asph);
    /* the FDR Drive: elevated on steel bents in Lower Manhattan and along Sutton Place, at grade beside the parks */
    const viaduct = (m0, m1) => {
      const x0 = bx(m0), x1 = bx(m1);
      R.rect(x0, B - 17, x1 - x0, 3, conc); R.rect(x0, B - 17, x1 - x0, 1, asphL); R.rect(x0, B - 14, x1 - x0, 1, concD);
      for (let x = x0 + 3; x < x1; x += 11) { R.rect(x, B - 13, 2, 6, Q.post); }
      for (let x = x0 + 8; x < x1; x += 22) { R.rect(x, B - 20, 1, 3, Q.post); R.px(x + 1, B - 20, lampM); }
    };
    viaduct(140, 1530); viaduct(1650, 2190); viaduct(8150, 9200);
    R.rect(bx(2300), B - 11, bx(7140) - bx(2300), 2, asphL);
    for (let x = bx(2300); x < bx(9500); x += 9) if (!nearBridge(x, 14)) R.px(x, B - 12, lampM);
    /* Battery Park and the Carl Schurz end: trees across the seam */
    woods(R, rng, bx(9380), R.w + 40, B - 9, x => 10 + 3 * Math.sin(x * 0.09), Q.leaf, { rMin: 3, rMax: 5 });
    woods(R, rng, 0, bx(30), B - 9, x => 11 + 3 * Math.sin(x * 0.08), Q.leaf, { rMin: 3, rMax: 5 });
    /* Staten Island Ferry terminal at Whitehall */
    { const x = bx(40), g = M.add('#7f9fbf', KG), sn = M.add('#e9a13a', KN, '#ffb84a', 0.8);
      R.rect(x, B - 22, 40, 13, g); R.rect(x, B - 23, 40, 1, conc); R.rect(x + 34, B - 22, 6, 13, glassD); R.rect(x + 3, B - 20, 28, 1, sn); for (let xx = x + 2; xx < x + 33; xx += 3) R.rect(xx, B - 17, 2, 6, pick(rng, W.on)); }
    /* Battery Maritime Building: green cast-iron Beaux-Arts ferry house with three great slips */
    {
      const x = bx(180) - 26, gr = M.add('#5f8f7a', KF, '#9ee8c8', 0.35), grD = M.add('#466d5c'), gL = M.add('#8cbfa6', KF, '#c8ffe4', 0.4), rf2 = M.add('#7b8a85'), slip = M.add('#2c3236');
      R.rect(x, B - 26, 52, 21, gr); R.rect(x + 46, B - 26, 6, 21, grD); R.rect(x, B - 26, 52, 2, gL);
      for (const dx of [3, 19, 35]) { R.rect(x + dx, B - 20, 12, 15, slip); R.ellipse(x + dx + 6, B - 20, 6, 3, slip); R.rect(x + dx - 1, B - 22, 14, 1, gL); }
      for (let dx = 1; dx < 51; dx += 4) R.rect(x + dx, B - 24, 1, 3, gL);
      R.poly([x - 1, B - 26, x + 53, B - 26, x + 49, B - 30, x + 3, B - 30], rf2); R.rect(x + 22, B - 34, 8, 4, rf2);
      lm(BK, x + 26, 'the Battery Maritime Building');
    }
    /* Downtown Manhattan Heliport on Pier 6 */
    { const x = bx(426); S2.rect(x - 24, 1, 48, 2, conc); S2.rect(x - 24, 3, 48, 1, concD); for (let px = x - 22; px < x + 24; px += 7) S2.rect(px, 4, 1, 6, concD); S2.rect(x - 4, 1, 1, 1, Q.top); S2.rect(x + 8, 1, 1, 1, Q.top);
      R.rect(x - 20, B - 14, 12, 5, white[0]); R.rect(x - 20, B - 15, 12, 1, conc); for (let xx = x - 19; xx < x - 9; xx += 2) R.px(xx, B - 12, W.on[0]);
      const heli = M.add('#2e3a4e'); R.rect(x + 6, B - 9, 5, 2, heli); R.rect(x + 11, B - 9, 3, 1, heli); R.rect(x + 3, B - 10, 10, 1, darkL); R.px(x + 8, B - 10, heli); }
    /* Pier 11 at Wall Street: the ferry landing pavilion */
    { const x = bx(783); S2.rect(x - 20, 1, 40, 2, conc); S2.rect(x - 20, 3, 40, 1, concD); for (let px = x - 18; px < x + 20; px += 6) S2.rect(px, 4, 1, 6, concD);
      const roof = M.add('#3a6aa0'); R.poly([x - 16, B - 15, x + 16, B - 15, x + 12, B - 18, x - 12, B - 18], roof); for (const dx of [-14, -4, 4, 14]) R.rect(x + dx, B - 15, 1, 6, Q.post); }
    /* the South Street Seaport: tall ships at Pier 16, the glass box of Pier 17 */
    {
      const hull = M.add('#2b2e36'), hullR = M.add('#a8433a'), mast = M.add('#5a4636'), rig = M.add('#7d6a58');
      for (const [m, n, hh] of [[1030, 4, 30], [1085, 3, 26]]) {
        const x = bx(m); S2.rect(x - 22, 1, 44, 2, hull); S2.rect(x - 21, 3, 42, 1, hullR); R.rect(x - 22, B - 6, 44, 2, hull); R.poly([x + 22, B - 6, x + 30, B - 9, x + 22, B - 4], hull); R.line(x + 22, B - 7, x + 34, B - 12, mast);
        for (let i = 0; i < n; i++) { const mx = x - 15 + i * 10; R.rect(mx, B - 6 - hh + i % 2 * 2, 1, hh - i % 2 * 2, mast); for (let k = 1; k < 4; k++) R.rect(mx - 4 + k, B - 6 - hh + k * 7, 9 - 2 * k, 1, mast); R.line(mx, B - 6 - hh, mx + 9, B - 7, rig); }
      }
      const x = bx(1139), g = M.add('#9fb8c7', KG), gD = M.add('#7795a8', KG), rooftop = M.add('#f1e8d0', KN, '#ffe6a8', 0.8);
      S2.rect(x - 32, 1, 64, 2, conc); S2.rect(x - 32, 3, 64, 1, concD); for (let px = x - 30; px < x + 32; px += 6) S2.rect(px, 4, 1, 6, concD);
      R.rect(x - 28, B - 20, 56, 15, g); R.rect(x + 20, B - 20, 8, 15, gD); for (let xx = x - 27; xx < x + 20; xx += 4) R.rect(xx, B - 19, 1, 13, glassL);
      for (let xx = x - 26; xx < x + 20; xx += 3) for (const yy of [B - 17, B - 12]) R.px(xx, yy, rng() < 0.6 ? pick(rng, W.on) : W.off);
      R.rect(x - 26, B - 21, 52, 1, rooftop);
      lm(BK, x, 'the South Street Seaport');
    }
    /* bridge abutments */
    const ab = (m, w, h, mm, mD, mL) => { const r = bx(m); R.rect(r - w / 2 - 3, B - h - 1, w + 6, h + 1, mm); R.rect(r + w / 2, B - h - 1, 3, h + 1, mD); R.rect(r - w / 2 - 3, B - h - 2, w + 6, 1, mL); };
    const gran = M.add('#b8a88f'), granD = M.add('#8f8270'), granL = M.add('#cfc2aa');
    ab(1588, 22, 22, gran, granD, granL); for (let y = B - 20; y < B; y += 4) R.rect(bx(1588) - 13, y, 25, 1, granD);
    ab(2245, 24, 22, gran, granD, granL); R.rect(bx(2245) - 8, B - 16, 16, 11, granD); R.ellipse(bx(2245), B - 16, 8, 4, granD);
    ab(3727, 24, 22, conc, concD, Q.top); ab(9247, 18, 22, gran, granD, granL);
    lm(BK, bx(1588), 'the Brooklyn Bridge'); lm(BK, bx(2245), 'the Manhattan Bridge'); lm(BK, bx(3727), 'the Williamsburg Bridge'); lm(BK, bx(9247), 'the Queensboro Bridge');
    /* the Roosevelt Island Tramway station at the foot of the Queensboro */
    { const x = bx(9247) + 20, tr = M.add('#c0473c'); R.rect(x, B - 18, 16, 9, white[1]); R.rect(x, B - 19, 16, 1, tr); for (let xx = x + 1; xx < x + 15; xx += 3) R.rect(xx, B - 16, 2, 4, pick(rng, W.on)); }
    /* East River Park and Stuyvesant Cove: ball fields and trees between the FDR and the water */
    woods(R, rng, bx(2330), bx(3700), B - 9, x => 9 + 3 * Math.sin(x * 0.11), Q.leaf, { rMin: 3, rMax: 4.5 });
    woods(R, rng, bx(3760), bx(5200), B - 9, x => 10 + 3 * Math.sin(x * 0.09), Q.leaf, { rMin: 3, rMax: 4.5 });
    { const x = bx(4300) - 14, am = M.add('#d8d2c2'); R.rect(x, B - 16, 28, 7, am); R.ellipse(x + 14, B - 16, 14, 4, am); R.rect(x + 3, B - 15, 22, 5, darkD); }
    woods(R, rng, bx(5550), bx(6300), B - 9, x => 7 + 2 * Math.sin(x * 0.13), Q.leaf, { rMin: 2.5, rMax: 3.5 });
    /* the 34th Street ferry landing and heliport */
    { const x = bx(7001); S2.rect(x - 18, 1, 36, 2, conc); S2.rect(x - 18, 3, 36, 1, concD); R.rect(x - 10, B - 15, 20, 6, white[0]); R.rect(x - 11, B - 16, 22, 1, Q.post); }
    /* Waterside's deck over the water */
    { const x = bx(6423); S2.rect(x - 18, 1, 36, 2, conc); for (let px = x - 16; px < x + 18; px += 5) S2.rect(px, 3, 1, 7, concD); }
    /* street trees and lamps along the esplanade */
    for (let x = 30; x < R.w; x += ri(rng, 18, 36)) {
      const r = x, m = mr(r);
      if (nearBridge(x, 26) || (m > 100 && m < 260) || (m > 980 && m < 1200) || m < 40 || m > 9380 || (m > 2300 && m < 6320)) continue;
      tree(R, x, B - 9, ri(rng, 3, 4), Q, rng() < 0.15 ? leafFall : Q.leaf);
    }
    for (let lx = 10; lx < R.w; lx += 26) if (!nearBridge(lx, 20)) lampPost(R, lx, B - 5, 6, Q.post, lampM);
    /* a ferry landing in front of the UN and one at Stuyvesant Cove */
    for (const m of [5800, 8000]) { const x = bx(m); S2.rect(x - 10, 1, 20, 2, conc); S2.rect(x - 10, 3, 20, 1, concD); R.rect(x - 6, B - 11, 12, 2, pierBlue); }
  }

  /* ============ the four bridges, each crossing toward the camera ============ */
  const sprites = [];
  const spr = (w, h, fn) => { const R = new Raster(w, h); fn(R); sprites.push(R); return sprites.length - 1; };
  const lampW = M.add('#f3e6c4', KN, '#fff1c8', 0.9);
  /* Brooklyn Bridge: granite tower, two pointed Gothic arches */
  const bbS = M.add('#c8b89c', KF, '#ffd9a0', 0.14), bbD = M.add('#a3937a'), bbL = M.add('#ddd0b6', KF, '#ffe6b8', 0.18), bbK = M.add('#8a7c66');
  const sBB = spr(24, 46, R => {
    R.rect(1, 4, 22, 42, bbS); R.rect(19, 4, 4, 42, bbD); R.rect(0, 2, 24, 2, bbL); R.rect(1, 0, 22, 2, bbS); R.rect(0, 4, 24, 1, bbK);
    for (const ax of [5, 14]) {
      R.rect(ax, 14, 5, 12, 0); R.poly([ax - 0.2, 14.5, ax + 5.2, 14.5, ax + 2.5, 8.5], 0);
      R.rect(ax - 1, 14, 1, 12, bbK); R.rect(ax + 5, 14, 1, 12, bbK); R.line(ax - 1, 14, ax + 2, 7, bbK); R.line(ax + 5, 14, ax + 3, 7, bbK);
      R.rect(ax - 1, 26, 7, 1, bbK);
    }
    for (const px of [2, 11, 20]) R.rect(px, 6, 1, 18, bbK);
    for (let y = 30; y < 46; y += 4) R.rect(1, y, 22, 1, bbD);
    R.rect(0, 26, 24, 2, bbL);
  });
  /* Manhattan Bridge: blue steel tower, arched portal, ball finials */
  const mbS = M.add('#7f97b2', KF, '#b8d4ff', 0.25), mbD = M.add('#5f7690'), mbL = M.add('#a5bad0');
  const sMB = spr(26, 56, R => {
    for (const lx of [1, 20]) { R.rect(lx, 6, 5, 50, mbS); R.rect(lx + 4, 6, 1, 50, mbD); for (let y = 10; y < 52; y += 3) R.px(lx + 2, y, mbD); }
    R.rect(1, 6, 24, 9, mbS); R.rect(0, 5, 26, 2, mbL); R.ellipse(13, 15, 7, 6, 0); R.rect(6, 15, 14, 1, 0); R.ring(13, 15, 7.6, 1.2, mbD);
    for (const bx2 of [2, 6, 19, 23]) { R.rect(bx2, 3, 1, 2, mbD); R.disc(bx2 + 0.5, 2, 1.3, mbL); }
    R.rect(6, 22, 14, 2, mbD); R.line(6, 24, 19, 33, mbD); R.line(19, 24, 6, 33, mbD);
    R.rect(0, 50, 26, 6, bbD);
  });
  /* Williamsburg Bridge: grey steel lattice towers */
  const wbS = M.add('#8d9299', KF, '#c8d0dc', 0.2), wbD = M.add('#686d75');
  const sWB = spr(26, 57, R => {
    for (const lx of [1, 21]) { R.rect(lx, 3, 1, 50, wbS); R.rect(lx + 3, 3, 1, 50, wbD); for (let y = 3; y < 53; y += 4) { R.line(lx, y, lx + 3, y + 4, wbS); R.rect(lx, y, 4, 1, wbS); } }
    R.rect(0, 1, 26, 3, wbS); R.rect(0, 3, 26, 1, wbD); R.rect(2, 0, 22, 1, wbD);
    for (const [y0, y1] of [[4, 12], [12, 20]]) { R.line(5, y0, 20, y1, wbD); R.line(20, y0, 5, y1, wbD); R.rect(5, y1, 16, 1, wbS); }
    R.rect(0, 52, 26, 5, bbD);
  });
  /* Queensboro Bridge: the stone pier and steel tower with its spiky finials */
  const qbS = M.add('#9a9488', KF, '#ffe2b0', 0.2), qbD = M.add('#746f66'), qbP = M.add('#b6aa94');
  const sQB = spr(22, 62, R => {
    R.rect(0, 40, 22, 22, qbP); R.rect(17, 40, 5, 22, bbD); R.rect(0, 40, 22, 1, bbL);
    for (const lx of [1, 18]) { R.rect(lx, 10, 3, 30, qbS); R.rect(lx + 2, 10, 1, 30, qbD); R.poly([lx - 0.5, 10, lx + 3.5, 10, lx + 1.5, 1], qbS); R.px(lx + 1, 0, qbD); for (const k of [-2, 4]) { R.rect(lx + k, 7, 1, 3, qbS); R.px(lx + k, 6, qbD); } }
    R.rect(1, 12, 20, 2, qbD); R.line(4, 14, 18, 26, qbD); R.line(18, 14, 4, 26, qbD); R.rect(1, 26, 20, 1, qbD);
  });
  /* the Roosevelt Island Tram: a tower and a red cabin */
  const trS = M.add('#9aa2ab'), trR = M.add('#c63f35'), trW = M.add('#35404e', KW, '#ffe0a0', 0.6);
  const sTT = spr(9, 44, R => { R.poly([0, 44, 9, 44, 6, 2, 3, 2], trS); R.poly([2, 40, 7, 40, 5, 6, 4, 6], 0); R.rect(1, 0, 7, 3, trS); });
  const sTC = spr(8, 8, R => { R.rect(3, 0, 1, 3, trS); R.rect(0, 3, 8, 5, trR); R.rect(1, 4, 6, 2, trW); });
  /* materials for decks and cables */
  const road = M.add('#5c5f66'), mark = M.add('#d9d2b8'), walk = M.add('#a9a59c');
  const bbCab = M.add('#cfc6b4', KN, '#ffe9b8', 0.45), bbSt = M.add('#9f9888');
  const mbCab = M.add('#7d93ad', KN, '#bcd8ff', 0.4), wbCab = M.add('#7e838a', KN, '#ffe8c0', 0.35), qbCab = M.add('#8a857c', KN, '#ffe2b0', 0.4), tram = M.add('#4a4f57');
  const cables = (z0, h0, z1, sag, lats, m, n, back) => {
    const out = [];
    for (const lat of lats) {
      out.push({ m, pts: hangLine(z0, h0, z1, h0, sag, lat, n || 24) });
      if (back) out.push({ m, pts: hangLine(back[0], back[1], z0, h0, back[2], lat, 8).filter(p => p[0] >= -12) });
    }
    return out;
  };
  const hangers = (z0, h0, z1, sag, lat, deck, step, m) => {
    const out = [];
    for (let z = z0 + step; z < Math.min(z1, 250); z += step) { const t = (z - z0) / (z1 - z0), h = h0 - sag * 4 * t * (1 - t); out.push({ m, pts: [[z, h, lat], [z, deck + 1, lat]] }); }
    return out;
  };
  /* Brooklyn Bridge: tower at z 45, four cables, the diagonal stays */
  const bbLines = cables(46, 44, 380, 20, [-8, -2, 2, 8], bbCab, 28);
  for (const lat of [-8, 8]) {
    bbLines.push(...hangers(45, 44, 380, 20, lat, 22, 9, bbSt));
    for (const d of [12, 24, 36, 48, 60]) bbLines.push({ m: bbSt, pts: [[46, 40, lat], [46 + d, 23, lat]] });
  }
  /* Manhattan Bridge: tower at z 14 */
  const mbLines = cables(15, 54, 323, 30, [-9, -5, 5, 9], mbCab, 28);
  for (const lat of [-9, 9]) mbLines.push(...hangers(14, 54, 323, 30, lat, 22, 8, mbD));
  /* Williamsburg Bridge: tower at z 8; the side span runs straight to the anchorage */
  const wbLines = cables(8, 55, 345, 32, [-10, -7, 7, 10], wbCab, 28);
  for (const lat of [-10, 10]) { wbLines.push(...hangers(8, 55, 345, 32, lat, 22, 8, wbD));  }
  /* Queensboro: cantilever truss over the West Channel, the tram alongside */
  const qbLines = [];
  for (const lat of [-10, 10]) {
    const top = z => 22 + 28 * Math.pow(Math.abs(z - 130) / 126, 1.4), pts = [], zig = [];
    for (let z = 4; z <= 256; z += 6) pts.push([z, top(z), lat]);
    for (let z = 4, k = 0; z <= 250; z += 12, k++) { zig.push([z, k & 1 ? 23 : top(z), lat]); }
    qbLines.push({ m: qbCab, pts }, { m: qbD, pts: zig }, { m: qbD, pts: [[4, 23, lat], [256, 23, lat]] });
  }
  const tramLine = (dl) => ({ m: tram, pts: hangLine(4, 42, 280, 34, 6, 24 + dl, 12) });
  qbLines.push(tramLine(0), tramLine(1.5));
  const crossings = [
    { name: 'the Brooklyn Bridge', r: rp(1588), w: 18, h: 22, th: 3, top: road, walk, mark, side: bbD, pier: bbS, rail: bbK, lamp: lampW, lampEvery: 24,
      towers: [{ z: 45, spr: sBB, lat: 0, base: 0 }], lines: bbLines },
    { name: 'the Manhattan Bridge', r: rp(2245), w: 20, h: 22, th: 4, top: road, mark, side: mbD, rail: mbD, lamp: lampW, lampEvery: 22,
      towers: [{ z: 14, spr: sMB, lat: 0, base: 0 }], lines: mbLines },
    { name: 'the Williamsburg Bridge', r: rp(3727), w: 20, h: 22, th: 4, top: road, mark, side: wbD, rail: wbD, lamp: lampW, lampEvery: 22,
      towers: [{ z: 8, spr: sWB, lat: 0, base: 0 }], lines: wbLines },
    { name: 'the Queensboro Bridge', r: rp(9247), w: 18, h: 22, th: 4, top: road, mark, side: qbD, rail: qbD, lamp: lampW, lampEvery: 18,
      towers: [{ z: 4, spr: sQB, lat: 0, base: 0 }, { z: 6, spr: sTT, lat: 24, base: 0 }, { z: 70, spr: sTC, lat: 24.7, base: 31 }], lines: qbLines },
  ];

  /* the bridges are drawn 1.25x so their towers read against the skyline */
  for (const c of crossings) {
    c.h = Math.round(c.h * 1.25);
    for (const t of c.towers) { t.s = 1.25; t.base *= 1.25; }
    for (const ln of c.lines) for (const q of ln.pts) q[1] *= 1.25;
  }
  /* boats: NYC Ferry, a yellow water taxi, a tug pushing a barge; FDR traffic */
  const bm = {
    w: M.add('#eeeae0'), k: M.add('#2d2b31'), K: M.add('#1e1d22'), W: M.add('#3b4656', KW, '#ffd27a', 0.45), L: M.add('#e9e2c8', KN, '#ffef9a', 0.9),
    r: M.add('#c9433a'), R: M.add('#b53a32'), b: M.add('#2f5c8a'), t: M.add('#3fa4b8'), y: M.add('#f2c230'), Y: M.add('#c99a1a'),
    g: M.add('#6d6a66'), G: M.add('#8a7a5c'), s: M.add('#5a5e66'), c: M.add('#d0d3d8'),
  };
  const ferry = [
    '.........kkkkkkkkkkkkkk.........', '......wwwwwwwwwwwwwwwwwwwww......', '.....wWWwWWwWWwWWwWWwWWwWWww.....',
    '....wwwwwwwwwwwwwwwwwwwwwwwwwww.L', '...bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '..ttttttttttttttttttttttttttttttt.', '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..', '..kkkkk................kkkkkk....',
  ];
  const taxi = [
    '......kkkkkkk.......', '....yyyyyyyyyyyy....', '...yWWyWWyWWyWWyy...', '..yyyyyyyyyyyyyyyy.L', 'kykykykykykykykykyky', '.YYYYYYYYYYYYYYYYYY.', '..kkkkkkkkkkkkkkkk..',
  ];
  const tugBarge = [
    '..........................................kk......', '..........................................RR......',
    '........................................wwwwww....', '........................................wWwWww....',
    '..........GGGGGGGGGGGG..................wwwwwwwwwL', '......GGGGGGGGGGGGGGGGGGGG..............wwWwwWwww.',
    'ssssssssssssssssssssssssssssssssssss.rrrrrrrrrrrrrr', 'sggggggggggggggggggggggggggggggggggskkkkkkkkkkkkkk.', '.ssssssssssssssssssssssssssssssssss..KKKKKKKKKKKK..',
  ];
  const boats = [
    { frames: [rasterFromRows(ferry, bm)], speed: 14, depth: 0.45, name: 'NYC Ferry' },
    { frames: [rasterFromRows(taxi, bm)], speed: 18, depth: 0.75, name: 'water taxi' },
    { frames: [rasterFromRows(tugBarge, bm)], speed: 6, depth: 0.25 },
  ];
  const cars = [
    '.yyyy.....cccc......rrrr.....yyyy......bbbb.....cccc....', 'yyyyyyL..ccccccL...rrrrrrL..yyyyyyL...bbbbbbL..ccccccL..', '.k..k.....k..k......k..k.....k..k......k..k.....k..k....',
  ];
  const vehicle = { L: 'bank', x0: bx(200), x1: bx(1530), y: B - 20, sprite: rasterFromRows(cars, bm), speed: 30, idle: 4 };
  return {
    id: 'nyc', name: 'New York City', meta: '40.71° N · 74.01° W', river: 'East River',
    M, layers: [LF, LW, LC, LO, LM, LN, LR, BK, SH], crossings, sprites, camD: 300, J0: 40, cloudAfter: 0,
    hero: { r: rp(7825), p: LR.p }, dyn, landmarks, boats, vehicle,
  };
}
