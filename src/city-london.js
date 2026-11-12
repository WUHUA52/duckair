/* ---------------- London ----------------
   Flight line: east down the Thames (downstream), from Victoria Tower Gardens
   to St Katharine Docks, camera looking north at the north bank. West is
   screen-left. The river is drawn straightened (the bend at Waterloo is
   flattened), so positions are route px along the river, measured from the
   north bank landmarks projected onto the Thames centreline at 0.85 px per
   metre (route px 0 = 170 m below Lambeth Bridge, 4096 px = 4.8 km):
     r  208 Victoria Tower        r 1276 Waterloo Bridge     r 2624 Southwark Bridge
     r  300 Central Tower         r 1290-1470 Somerset House r 2856 Cannon Street
     r  432 Elizabeth Tower       r 1698 Temple Church       r 3029 London Bridge
     r  465 Westminster Bridge    r 1989 Unilever House      r 3142 the Monument
     r  709 Ministry of Defence   r 2067 Blackfriars Bridge  r 3150-3410 the City cluster
     r  858 Whitehall Court       r 2129 Blackfriars Railway r 3692 Tower of London
     r  939 Hungerford Bridge     r 2385 St Paul's on the    r 3851 Tower Bridge
     r 1117 Cleopatra's Needle           Millennium Bridge   r 3969 St Katharine Docks
     r 1160 Shell Mex House
   Depth inland sets the layer: p = 250 / (250 + metres inland). Heights are
   true perspective size (0.85 px per metre at p = 1); a few heroes
   are enlarged (noted where drawn). Nothing from the South Bank appears here:
   it is behind the camera (see city3d-london.js). */
function genLondon() {
  const rng = mulberry32(1859);
  const M = new Mats();
  const MC = {};
  const A = (c, k, e, g, late) => { const key = c + '|' + (k || 0) + '|' + (e || '') + '|' + (g || 0) + '|' + (late ? 1 : 0); return MC[key] || (MC[key] = M.add(c, k, e, g, late)); };
  const LF = mkLayer('far', 901, 66, { dy: -4 }), LC = mkLayer('core', 1147, 122, { dy: -3 }), LO = mkLayer('fore', 1393, 104, { dy: -2 });
  const LM = mkLayer('mid', 1843, 104, { dy: -1 }), LN = mkLayer('near', 2458, 72), LT = mkLayer('front', 3482, 84), BK = mkLayer('bank', 4096, 44);
  const SH = mkLayer('shore', 4096, 14, { water: true, dy: 11 });
  const dyn = { blink: [], clocks: [], signs: [] };
  const landmarks = [];
  /* Positions below are written in "map px" (0.85 px per metre along the river, as in the table above).
     The drawn route compresses them by 0.9 and shifts them 180 px east, which leaves a quiet stretch of
     Millbank (route 0-180) and Wapping (3870-4096) at the loop join, so the City cluster and Parliament
     are never on screen together. */
  const T = r => 180 + 0.9 * r, inv = r => (r - 180) / 0.9, bx = r => Math.round(T(r));
  const at = (Ly, r) => Math.round(Ly.p * T(r));               // map px -> layer x
  const hm = (Ly, m) => Math.round(m * 0.85 * Ly.p);        // metres of height -> px
  /* vertical exaggeration east of Westminster Bridge: 1.6x for the Embankment and the City, 1.65x for the City cluster */
  const EX = 1.6, CL = 1.65;
  const hx = (Ly, m) => hm(Ly, m * EX), hc = (Ly, m) => hm(Ly, m * CL);
  const exAt = r => (r < 440 || r > 4300 ? 1 : r < 520 ? lerp(1, EX, (r - 440) / 80) : r > 3990 ? lerp(EX, 1.1, Math.min(1, (r - 3990) / 120)) : EX);
  const wm = (Ly, m) => Math.max(1, Math.round(m * 0.85 * Ly.p));
  /* St Paul's stands on the axis of the Millennium Bridge: keep Peter's Hill open on every nearer layer */
  const AX = 2385;
  const offAxis = (ra, rb) => rb < AX - 17 || ra > AX + 17;
  const inR = (r, ex) => ex && ex.some(e => r > e[0] && r < e[1]);

  /* ---- materials ---- */
  const W = winMats(M, '#3b4250'), WG = winMats(M, '#3f566f');
  const port = [A('#e2ded3'), A('#d6d1c4'), A('#cbc5b6')], portD = A('#a8a294'), portL = A('#f0ede5');
  const stock = [A('#cdb98f'), A('#bea97f')], stockD = A('#9c8862');
  const red = [A('#a9583f'), A('#975041')], redD = A('#7a4234');
  const slate = A('#59606b'), slateL = A('#747c87'), lead = A('#8b939a'), leadD = A('#6c747c'), copper = A('#73a891'), copperD = A('#5a8a76');
  const chim = A('#8a5c49'), pot = A('#b8673f');
  const conc = A('#bebaaf'), concD = A('#95918a'), band = A('#6a6e76');
  const glass = [A('#7f9cb8', KG), A('#6c8aa8', KG)], glassD = A('#56708c', KG), glassL = A('#a4bfd6', KG);
  const dark = A('#3e3a37'), slit = A('#4a4239');
  const gold = A('#d8b450', KF, '#ffd56b', 0.55);
  const wren = A('#ebe7dc', KF, '#fff2d2', 0.3), wrenD = A('#c6c0b2', KF, '#d8c9a6', 0.12);
  const Q = quayMats(M, { wall: '#8e8b86', wallD: '#6a6762', top: '#b6b1a8', rail: '#2f3a33', post: '#2a332e', lamp: '#f3e6bc', lampE: '#ffe08a', leaf0: '#4a6c3d', leaf1: '#5d8a4b', leaf2: '#7fa35f', trunk: '#6b5a48' });
  const leafFar = [A('#5c7560'), A('#6c8968'), A('#86a07a')];
  const leafAut = [A('#7c7a3c'), A('#a39444'), A('#c9b25a')];

  /* ---- London fabric: Portland stone with mansards, stock and red brick under slate and chimney pots ---- */
  function bld(R, x, w, h, B, kind, small) {
    if (h < 2 || w < 2) return;
    const y = B - h, sd = Math.max(1, w >> 2);
    const wg = (Wm, o) => { if (h > 4 && w > 3) winGrid(R, rng, x + 1, y + 2, w - 1 - sd, h - 3, Wm, o); };
    if (kind === 'stone') {
      R.rect(x, y, w, h, pick(rng, port)); R.rect(x + w - sd, y, sd, h, portD); R.rect(x, y, w, 1, portL);
      wg(W, { cw: 2, ch: small ? 2 : 3, ww: 1, wh: small ? 1 : 2, lit: 0.42 });
      if (h > 5) {
        const mh = small ? 1 : 2;
        R.poly([x - 0.5, y, x + w + 0.5, y, x + w - 1, y - mh, x + 1, y - mh], slate);
        if (!small) for (let dx = x + 2; dx < x + w - 2; dx += 3) R.px(dx, y - 1, portL);
        if (!small && w > 8 && rng() < 0.16) { const cx = rng() < 0.5 ? x + 3 : x + w - 4; R.rect(cx - 1, y - 4, 3, 3, pick(rng, port)); R.ellipse(cx + 0.5, y - 4, 2, 2, lead); R.px(cx, y - 7, lead); }
        else if (rng() < 0.4) R.rect(x + ri(rng, 1, Math.max(1, w - 3)), y - mh - 2, 2, 2, chim);
      }
    } else if (kind === 'stock' || kind === 'red') {
      const m = kind === 'red' ? pick(rng, red) : pick(rng, stock), mD = kind === 'red' ? redD : stockD;
      R.rect(x, y, w, h, m); R.rect(x + w - sd, y, sd, h, mD);
      if (kind === 'red' && !small) for (let yy = y + 3; yy < B - 1; yy += 4) R.rect(x, yy, w, 1, portL);
      wg(W, { cw: 2, ch: small ? 2 : 3, ww: 1, wh: small ? 1 : 2, lit: 0.45 });
      const rh = small ? 1 : Math.min(4, Math.max(2, w >> 2));
      R.poly([x - 0.5, y, x + w + 0.5, y, x + w / 2, y - rh], slate);
      if (!small) for (const cx of [x + 1, x + w - 3]) { R.rect(cx, y - rh - 1, 2, rh + 1, chim); R.px(cx, y - rh - 2, pot); R.px(cx + 1, y - rh - 2, pot); }
    } else if (kind === 'office') {
      R.rect(x, y, w, h, conc); R.rect(x + w - sd, y, sd, h, concD);
      for (let yy = y + 2; yy < B - 1; yy += small ? 2 : 3) R.rect(x, yy, w - sd, 1, band);
      wg(W, { cw: 2, ch: small ? 2 : 3, ww: 1, wh: 1, lit: 0.45, skip: 0.3 });
      if (w > 6 && rng() < 0.5) R.rect(x + 2, y - 2, w - 4, 2, concD);
    } else {
      R.rect(x, y, w, h, pick(rng, glass)); R.rect(x + w - sd, y, sd, h, glassD);
      for (let xx = x + 2; xx < x + w - sd; xx += 3) R.rect(xx, y + 1, 1, h - 1, glassL);
      wg(WG, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.4 });
    }
  }
  function pickKind(mix) { let t = 0; for (const k in mix) t += mix[k]; let u = rng() * t; for (const k in mix) { u -= mix[k]; if (u <= 0) return k; } return 'stone'; }
  /* fabric along a layer between route px r0..r1; hM(r) gives a typical height in metres */
  function fabric(Ly, r0, r1, hM, mix, o) {
    o = o || {};
    const R = Ly.R, B = R.h - (o.base || 0), small = Ly.p < 0.4;
    let x = at(Ly, r0); const xEnd = at(Ly, r1);
    while (x < xEnd) {
      const w = ri(rng, o.wMin || (small ? 4 : 7), o.wMax || (small ? 9 : 14)), ra = inv(x / Ly.p), rb = inv((x + w) / Ly.p);
      const h = hm(Ly, hM((ra + rb) / 2) * exAt((ra + rb) / 2) * rf(rng, 0.6, 1.05));
      if (offAxis(ra, rb) && !inR(ra, o.ex) && !inR(rb, o.ex) && rng() < (o.fill || 0.92)) bld(R, x, w, h, B, pickKind(typeof mix === 'function' ? mix((ra + rb) / 2) : mix), small);
      x += w + (rng() < (o.gap == null ? 0.2 : o.gap) ? ri(rng, 1, 3) : 0);
    }
  }
  /* Wren's (and Hawksmoor's) white steeples, h px tall */
  function steeple(R, cx, B, h, type) {
    const tw = Math.max(3, Math.round(h * 0.17)), x0 = cx - (tw >> 1), th = Math.round(h * (type === 'pinn' ? 0.78 : 0.52));
    const body = type === 'brick' || type === 'copper' ? red[1] : wren, bodyD = type === 'brick' || type === 'copper' ? redD : wrenD;
    R.rect(x0, B - th, tw, th, body); R.rect(x0 + tw - 1, B - th, 1, th, bodyD);
    R.rect(cx - 1 + (tw & 1 ? 0 : 0), B - th + 2, 1, 2, slit);
    let y = B - th;
    if (type === 'tiers') {
      let w = tw + 1;
      for (let i = 0; i < 4 && y > B - h + 3; i++) { const sh = Math.max(2, Math.round(h * 0.09)); R.rect(cx - (w >> 1), y - sh, w, sh, wren); R.px(cx, y - sh + 1, slit); y -= sh; w = Math.max(1, w - 1); }
      R.rect(cx, B - h, 1, y - (B - h), wren);
    } else if (type === 'bow') {
      R.rect(cx - (tw >> 1) - 1, y - 3, tw + 2, 3, wren); for (let xx = cx - (tw >> 1); xx < cx + (tw >> 1) + 1; xx += 2) R.px(xx, y - 2, slit);
      y -= 3; R.rect(cx - 1, y - 4, 3, 4, wren); y -= 4; R.poly([cx - 1.5, y, cx + 2.5, y, cx + 0.5, B - h], wren); R.px(cx, B - h - 1, gold);
    } else if (type === 'lantern') {
      R.rect(cx - 1, y - 4, 3, 4, wren); R.px(cx, y - 3, slit); y -= 4;
      R.ellipse(cx + 0.5, y, 2, 2.5, lead); R.rect(cx, B - h, 1, y - 2 - (B - h), lead); R.px(cx, B - h - 1, gold);
    } else if (type === 'lead') {
      R.ellipse(cx + 0.5, y, tw / 2 + 0.3, 2.5, leadD); R.poly([cx - 1, y - 1, cx + 2, y - 1, cx + 0.5, B - h], leadD); R.px(cx, B - h - 1, gold);
    } else if (type === 'gothic') {
      R.px(x0, y - 1, wren); R.px(x0 + tw - 1, y - 1, wren);
      R.poly([x0 + 0.5, y, x0 + tw - 0.5, y, cx + 0.5, B - h], wren); R.line(x0, y - 1, cx, B - h + 1, wrenD);
    } else if (type === 'pinn') {
      for (const xx of [x0, x0 + tw - 1]) R.rect(xx, B - h, 1, h - th, wren);
      if (tw > 3) R.rect(cx, B - h + 1, 1, h - th - 1, wren);
    } else if (type === 'copper') {
      R.poly([x0 - 0.5, y, x0 + tw + 0.5, y, cx + 0.5, B - h], copper); R.line(cx + 1, y - 1, cx + 0.5, B - h + 1, copperD);
    } else {
      R.poly([x0, y, x0 + tw, y, cx + 0.5, y - 3], lead);
    }
  }
  function gnd(Ly, col) { Ly.R.rect(0, Ly.R.h - 3, Ly.W, 3, col); }

  /* ======================= far (p .22): BT Tower, the Barbican ======================= */
  {
    const R = LF.R, B = R.h;
    gnd(LF, A('#7f8a8e'));
    fabric(LF, -200, 4351, r => (r > 2600 && r < 3600 ? 42 : 30), { stone: 3, stock: 3, office: 2, red: 1 }, { wMin: 4, wMax: 9 });
    /* BT Tower, 2 km inland: drawn at 1.3x its true size for that depth */
    {
      const cx = at(LF, 1260), m = conc, mD = concD, ring = leadD;
      R.rect(cx - 1, B - 15, 3, 15, m); R.rect(cx + 1, B - 15, 1, 15, mD);
      for (const y of [B - 20, B - 18, B - 16]) R.rect(cx - 2, y, 5, 1, ring);
      R.rect(cx - 1, B - 21, 3, 6, m); R.rect(cx, B - 24, 1, 3, m);
      dyn.blink.push({ L: 'far', x: cx, y: B - 25 });
      landmarks.push({ L: 'far', x: cx, name: 'the BT Tower' });
    }
    /* the Barbican's three towers, serrated balcony edges */
    {
      const m = concD, mD = band;
      for (const r of [2351, 2419, 2462]) {
        const cx = at(LF, r), h = hx(LF, 123);
        R.rect(cx - 2, B - h, 5, h, m); R.rect(cx + 2, B - h, 1, h, mD);
        for (let y = B - h + 1; y < B - 2; y += 2) { R.px(cx - 3, y, m); R.px(cx + 3, y, mD); }
        R.rect(cx - 2, B - h - 1, 2, 1, mD);
      }
      landmarks.push({ L: 'far', x: at(LF, 2419), name: 'the Barbican' });
    }
  }

  /* ======================= core (p .28): 22 Bishopsgate, 8 Bishopsgate, the Cheesegrater, the Gherkin, Tower 42 ======================= */
  {
    const R = LC.R, B = R.h;
    gnd(LC, A('#7a868a'));
    fabric(LC, -200, 4351, r => (r > 2700 && r < 3550 ? 48 : 30), r => (r > 3050 && r < 3450 ? { stone: 2, office: 3, glass: 2 } : { stone: 3, stock: 3, office: 1, red: 1 }), { wMin: 5, wMax: 10 });
    /* Tower 42: dark, three lobed, flat crown */
    {
      const g = A('#4c5560'), gD = A('#3a424c'), gL = A('#66717d'), cx = at(LC, 3154), h = hc(LC, 183);
      R.rect(cx - 5, B - h, 10, h, g); R.rect(cx + 2, B - h, 3, h, gD); R.rect(cx - 1, B - h, 1, h, gD);
      R.rect(cx - 5, B - h, 10, 2, gL);
      winGrid(R, rng, cx - 4, B - h + 3, 7, h - 5, W, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.35 });
      landmarks.push({ L: 'core', x: cx, name: 'Tower 42' });
    }
    /* 22 Bishopsgate: the broad glass bulk, tallest in the City */
    {
      const g = A('#9fb6c9', KG), gD = A('#7f98ae', KG), gL = A('#c2d4e2', KG), cx = at(LC, 3217), h = hc(LC, 278);
      R.rect(cx - 8, B - h + 2, 17, h - 2, g); R.rect(cx - 7, B - h, 15, 2, g); R.rect(cx + 4, B - h + 1, 5, h - 1, gD);
      for (let x = cx - 6; x < cx + 4; x += 2) R.rect(x, B - h + 3, 1, h - 4, gL);
      winGrid(R, rng, cx - 7, B - h + 4, 11, h - 6, WG, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.3 });
      dyn.blink.push({ L: 'core', x: cx, y: B - h - 1 });
      landmarks.push({ L: 'core', x: cx, name: '22 Bishopsgate' });
    }
    /* 8 Bishopsgate: stacked, offset boxes */
    {
      const g = A('#8d99a6', KG), gD = A('#6f7b88', KG), cx = at(LC, 3190), h = hc(LC, 204);
      R.rect(cx - 5, B - h + 12, 10, h - 12, g); R.rect(cx - 3, B - h + 5, 9, 8, g); R.rect(cx - 4, B - h, 7, 6, g);
      R.rect(cx + 3, B - h + 12, 2, h - 12, gD); R.rect(cx + 4, B - h + 5, 2, 8, gD);
      for (const y of [B - h + 5, B - h + 12, B - h + 22]) R.rect(cx - 5, y, 10, 1, glassL);
      winGrid(R, rng, cx - 4, B - h + 14, 7, h - 16, WG, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.35 });
    }
    /* the Cheesegrater: a wedge leaning back to the north, white frame, yellow lift core */
    {
      const g = A('#a9c0d2', KG), gD = A('#88a2b8', KG), fr = A('#e9ecee', KF, '#eef6ff', 0.25), lift = A('#d9a43a'), cx = at(LC, 3263), h = hc(LC, 225);
      R.poly([cx - 7, B, cx + 6, B, cx + 6, B - h, cx + 3, B - h], g);
      R.rect(cx + 6, B - h + 2, 2, h - 2, lift); R.rect(cx + 4, B - h, 2, h, gD);
      for (let i = 1; i < 7; i++) { const y = B - Math.round(h * i / 7), xl = Math.round(cx - 7 + 10 * i / 7); R.rect(xl, y, cx + 6 - xl, 1, fr); }
      R.line(cx - 7, B - 1, cx + 3, B - h, fr);
      dyn.blink.push({ L: 'core', x: cx + 4, y: B - h - 1 });
      landmarks.push({ L: 'core', x: cx, name: 'the Cheesegrater' });
    }
    /* the Gherkin: diagonal bands on a bullet */
    {
      const g = A('#3f6a86', KG), gL = A('#6f9cb8', KG), gD = A('#2f526b', KG), cx = at(LC, 3351), h = hc(LC, 180);
      for (let k = 0; k < h; k++) {
        const t = k / h, hw = 6.4 * Math.sin(Math.PI * (0.18 + 0.82 * Math.pow(t, 0.85)) ) * (t < 0.36 ? 0.88 + 0.33 * t : 1) * (1 - Math.pow(Math.max(0, t - 0.75) / 0.25, 3) * 0.75);
        const y = B - 1 - k;
        for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) R.px(x, y, mod(x + k, 5) < 2 ? gL : (x > cx + hw * 0.4 ? gD : g));
      }
      R.rect(cx, B - h - 1, 1, 1, gD);
      landmarks.push({ L: 'core', x: cx, name: 'the Gherkin' });
    }
     /* Heron Tower with its mast (drawn on this layer, not further back, so it never peeks past the loop seam into Westminster) */
    {
      const g = glass[0], gD = glassD, cx = at(LC, 3300), h = hc(LC, 202);
      R.rect(cx - 4, B - h, 8, h, g); R.rect(cx + 2, B - h, 2, h, gD);
      winGrid(R, rng, cx - 3, B - h + 2, 5, h - 4, WG, { cw: 2, ch: 2, ww: 1, wh: 1, lit: 0.5 });
      R.rect(cx - 3, B - h - 1, 6, 1, gD); R.rect(cx, B - h - 7, 1, 6, gD);
      dyn.blink.push({ L: 'core', x: cx, y: B - h - 8 });
      landmarks.push({ L: 'core', x: cx, name: 'Heron Tower' });
    }
  }

  /* ======================= fore (p .34): Nelson's Column, St Mary-le-Bow, the Scalpel, Lloyd's, the Willis Building ======================= */
  {
    const R = LO.R, B = R.h;
    gnd(LO, A('#76828a'));
    fabric(LO, -200, 4351, r => (r > 2700 && r < 3500 ? 45 : 30), r => (r > 3080 && r < 3420 ? { stone: 2, office: 3, glass: 1 } : { stone: 4, stock: 3, office: 1, red: 1 }), { wMin: 6, wMax: 12 });
    /* Nelson's Column behind Charing Cross */
    { const cx = at(LO, 923), m = port[2], h = hx(LO, 52); R.rect(cx - 2, B - 5, 5, 5, m); R.rect(cx, B - h, 1, h, m); R.rect(cx - 1, B - h + 1, 3, 1, dark); R.px(cx, B - h - 1, dark); }
    steeple(R, at(LO, 2553), B, hx(LO, 68), 'bow');
    /* 52 Lime Street, the Scalpel: a sharp folded wedge */
    {
      const g = A('#b5cbdc', KG), gD = A('#8ea9bf', KG), gL = A('#d8e6ef', KG), cx = at(LO, 3256), h = hc(LO, 190);
      R.poly([cx - 7, B, cx + 7, B, cx + 7, B - h + 14, cx + 1, B - h], g);
      R.poly([cx + 2, B, cx + 7, B, cx + 7, B - h + 14, cx + 2, B - h + 6], gD);
      R.line(cx - 7, B - 1, cx + 1, B - h, gL);
      winGrid(R, rng, cx - 3, B - h + 18, 8, h - 20, WG, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.35 });
      dyn.blink.push({ L: 'fore', x: cx + 1, y: B - h - 1 });
      landmarks.push({ L: 'fore', x: cx, name: 'the Scalpel' });
    }
    /* Lloyd's: steel service towers, blue cranes, the barrel-vaulted atrium */
    {
      const s = A('#b9c0c6'), sD = A('#8d959c'), cr = A('#5d7fb0'), cx = at(LO, 3284), h = hc(LO, 88);
      R.rect(cx - 6, B - h + 5, 12, h - 5, s); R.rect(cx + 3, B - h + 5, 3, h - 5, sD);
      for (const tx of [cx - 7, cx - 1, cx + 5]) { R.rect(tx, B - h, 2, h, sD); R.rect(tx, B - h - 2, 1, 2, cr); R.rect(tx, B - h - 2, 3, 1, cr); }
      R.ellipse(cx, B - h + 5, 4, 3, A('#9fb8c8', KG));
      for (let y = B - h + 8; y < B - 2; y += 3) R.rect(cx - 5, y, 8, 1, sD);
      landmarks.push({ L: 'fore', x: cx, name: "Lloyd's of London" });
    }
    /* the Willis Building: three curved steps */
    {
      const g = A('#5f7f9a', KG), gD = A('#4a6780', KG), gL = A('#86a3bb', KG), cx = at(LO, 3347), h = hc(LO, 125);
      for (const [dx, hh] of [[-6, 0.62], [-3, 0.82], [0, 1]]) { const th = Math.round(h * hh); R.rect(cx + dx - 3, B - th, 9, th, g); R.ellipse(cx + dx + 1.5, B - th, 4.5, 1.5, g); }
      R.rect(cx + 4, B - h, 2, h, gD);
      for (let y = B - h + 2; y < B - 1; y += 2) R.rect(cx - 8, y, 13, 1, gL);
    }
  }

  /* ======================= mid (p .45): the Abbey, Charing Cross, Fleet Street steeples, ST PAUL'S, the Walkie-Talkie ======================= */
  {
    const R = LM.R, B = R.h;
    gnd(LM, A('#70806f'));
    fabric(LM, -200, 4351, r => (r < 480 ? 30 : r < 1300 ? 38 : r < 2600 ? 36 : r < 3500 ? 46 : 30),
      r => (r > 3000 && r < 3420 ? { stone: 3, office: 3, glass: 1 } : r > 2400 && r < 3500 ? { stone: 4, office: 2, red: 1 } : { stone: 4, stock: 2, red: 2, office: 1 }),
      { wMin: 8, wMax: 15, ex: [[200, 300], [930, 1015], [2300, 2470], [3220, 3280]] });
    /* Westminster Abbey: the west towers above the Palace roofs */
    {
      const st = A('#d2cab6', KF, '#ead6a4', 0.18), stD = A('#aca48f', KF, '#bfa877', 0.06), cx = at(LM, 250), h = hm(LM, 69);
      R.poly([cx - 14, B, cx + 18, B, cx + 18, B - 10, cx + 2, B - 14, cx - 14, B - 10], A('#7a8088'));
      R.rect(cx - 14, B - 10, 32, 10, st); R.rect(cx + 12, B - 10, 6, 10, stD);
      for (const tx of [cx - 6, cx + 3]) {
        R.rect(tx, B - h, 4, h, st); R.rect(tx + 3, B - h, 1, h, stD);
        R.rect(tx + 1, B - h + 3, 1, 5, slit); R.rect(tx + 1, B - h + 11, 1, 4, slit);
        for (const px of [tx, tx + 3]) R.rect(px, B - h - 3, 1, 3, st);
        R.rect(tx + 1, B - h - 1, 2, 1, st);
      }
      for (let x = cx - 12; x < cx + 12; x += 3) R.rect(x, B - 8, 1, 4, slit);
      landmarks.push({ L: 'mid', x: cx, name: 'Westminster Abbey' });
    }
    /* Embankment Place over Charing Cross: the great arched roof between two towers */
    {
      const st = A('#d9d6cf'), stD = A('#adaaa2'), gl = A('#7fa2a8', KG), glL = A('#a9c8cb', KG), cx = at(LM, 972), h = hx(LM, 46);
      R.rect(cx - 18, B - h + 4, 36, h - 4, st); R.rect(cx + 12, B - h + 4, 6, h - 4, stD);
      R.ellipse(cx, B - h + 5, 13, 9, gl); R.rect(cx - 13, B - h + 5, 26, 2, gl);
      for (let i = -12; i <= 12; i += 3) R.line(cx, B - h + 5, cx + i, B - h - 3 + Math.round(Math.abs(i) * 0.5), glL);
      for (const tx of [cx - 19, cx + 15]) { R.rect(tx, B - h - 1, 5, h + 1, st); R.rect(tx + 4, B - h - 1, 1, h + 1, stD); R.rect(tx, B - h - 2, 5, 1, stD); }
      winGrid(R, rng, cx - 16, B - h + 10, 28, h - 12, W, { cw: 2, ch: 3, ww: 1, wh: 2, lit: 0.5 });
      landmarks.push({ L: 'mid', x: cx, name: 'Charing Cross' });
    }
    /* St Clement Danes, the Royal Courts of Justice, St Bride's (the wedding cake), St Martin Ludgate */
    steeple(R, at(LM, 1499), B, hx(LM, 35), 'tiers');
    {
      const st = A('#d8d0bd'), cx = at(LM, 1577), h = hx(LM, 25);
      R.rect(cx - 9, B - h, 18, h, st); R.rect(cx + 6, B - h, 3, h, portD);
      R.poly([cx - 9.5, B - h, cx + 9.5, B - h, cx, B - h - 5], slate);
      R.rect(cx + 4, B - h - 9, 3, 9, st); R.poly([cx + 3.5, B - h - 9, cx + 7.5, B - h - 9, cx + 5.5, B - h - 14], lead);
      for (let x = cx - 7; x < cx + 5; x += 3) R.rect(x, B - h + 3, 1, 4, slit);
    }
    steeple(R, at(LM, 1942), B, hx(LM, 69) + 2, 'tiers');
    steeple(R, at(LM, 2184), B, hx(LM, 50), 'lead');
    /* ST PAUL'S, seen from the south: drawn at 1.25x so the dome reads */
    {
      const s = 0.85 * LM.p * 1.65;
      const st = A('#e4dfd2', KF, '#fff4dc', 0.38), stD = A('#bdb7a8', KF, '#d6c7a0', 0.15), stL = A('#f3f0e8', KF, '#fffbe8', 0.35);
      const dm = A('#8e979f', KF, '#c7d0db', 0.22), dmD = A('#6f7880', KF, '#8e98a6', 0.08), dmL = A('#b0b8bf', KF, '#e2e8f0', 0.25), col = A('#a39d8e');
      const cx = at(LM, AX), H = v => Math.round(v * s);
      /* nave and choir: two storeys under a balustrade, the apse at the east end */
      R.rect(cx - 30, B - H(31), 58, H(31), st); R.rect(cx - 30, B - H(31), 58, 1, stL);
      for (let x = cx - 28; x < cx + 26; x += 3) { R.rect(x, B - H(26), 1, 3, dark); R.rect(x, B - H(14), 1, 4, dark); }
      R.rect(cx - 30, B - H(18), 58, 1, stD);
      R.ellipse(cx + 28, B - H(15), 4, H(15), st); R.rect(cx + 28, B - H(30), 3, H(30), stD);
      R.poly([cx - 30, B - H(31), cx + 28, B - H(31), cx + 26, B - H(36), cx - 28, B - H(36)], lead);
      /* the south transept with its semicircular portico */
      R.rect(cx - 9, B - H(34), 18, H(34), st); R.rect(cx + 6, B - H(34), 3, H(34), stD);
      pediment(R, cx - 9, B - H(34), 18, 4, stL, stD);
      for (let x = cx - 6; x <= cx + 6; x += 2) R.rect(x, B - H(14), 1, H(14), col);
      R.ellipse(cx, B - H(14), 7, 2, stL);
      /* west towers (one behind the other) */
      for (const [tx, m] of [[cx - 25, stD], [cx - 29, st]]) {
        const th = H(67);
        R.rect(tx, B - th + 8, 7, th - 8, m); R.rect(tx + 5, B - th + 8, 2, th - 8, stD);
        R.rect(tx + 1, B - th + 3, 5, 5, m); R.ellipse(tx + 3.5, B - th + 3, 2.6, 2.5, dmL);
        R.rect(tx + 3, B - th - 1, 1, 2, gold);
        R.rect(tx + 2, B - th + 11, 1, 4, dark); R.rect(tx + 4, B - th + 11, 1, 4, dark);
      }
      /* drum, peristyle, attic */
      const d0 = B - H(36), d1 = B - H(58), d2 = B - H(64);
      R.rect(cx - 11, d1, 22, d0 - d1, st); R.rect(cx + 7, d1, 4, d0 - d1, stD);
      for (let x = cx - 10; x <= cx + 9; x += 2) R.rect(x, d1 + 2, 1, d0 - d1 - 3, col);
      R.rect(cx - 11, d1, 22, 1, stL); R.rect(cx - 12, d0 - 1, 24, 1, stD);
      R.rect(cx - 8, d2, 16, d1 - d2, st); R.rect(cx + 5, d2, 3, d1 - d2, stD);
      for (let x = cx - 6; x < cx + 6; x += 3) R.px(x, d2 + 2, dark);
      /* the dome, taller than a hemisphere */
      const dh = H(30), dw = 8.6;
      for (let k = 0; k < dh; k++) {
        const t = k / dh, hw = dw * Math.sqrt(Math.max(0, 1 - Math.pow(t, 1.6)));
        const y = d2 - 1 - k, xl = Math.round(cx - hw), xr = Math.round(cx + hw);
        R.span(xl, xr + 1, y, dm); if (xr - xl > 3) R.span(Math.round(cx + hw * 0.35), xr + 1, y, dmD);
        if (xr - xl > 4) R.px(Math.round(cx - hw * 0.45), y, dmL);
      }
      for (let i = -2; i <= 2; i++) R.line(cx + i * 3.4, d2 - 1, cx + i * 1.2, d2 - dh + 1, i < 1 ? dmL : dmD);
      /* lantern, golden ball and cross */
      const ly = d2 - dh;
      R.rect(cx - 2, ly - 6, 4, 7, st); R.rect(cx + 1, ly - 6, 1, 7, stD); R.px(cx - 1, ly - 4, dark);
      R.poly([cx - 2.5, ly - 6, cx + 2.5, ly - 6, cx + 0, ly - 9], dm);
      R.rect(cx - 1, ly - 11, 2, 2, gold); R.rect(cx - 1, ly - 15, 1, 4, gold); R.rect(cx - 2, ly - 14, 3, 1, gold);
      landmarks.push({ L: 'mid', x: cx, name: "St Paul's Cathedral" });
    }
    /* 20 Fenchurch Street, the Walkie-Talkie: top-heavy, bulging, white ribs, the Sky Garden on top */
    {
      const g = A('#6f8aa3', KG), gD = A('#56708a', KG), rib = A('#e7eaec'), sky = A('#bfe0c9', KN, '#d9ffd0', 0.5), cx = at(LM, 3249), h = hm(LM, 160 * 1.45);
      for (let k = 0; k < h; k++) {
        const t = k / h, hw = 9 + 5 * Math.pow(t, 1.8), y = B - 1 - k;
        const xl = Math.round(cx - hw), xr = Math.round(cx + hw);
        R.span(xl, xr + 1, y, g); R.span(xr - 3, xr + 1, y, gD);
        for (let x = xl + 1; x < xr - 2; x += 3) R.px(x, y, rib);
      }
      R.poly([cx - 14.5, B - h, cx + 14.5, B - h, cx + 13, B - h - 3, cx - 12, B - h - 6], sky);
      R.line(cx - 12, B - h - 6, cx + 13, B - h - 3, rib);
      winGrid(R, rng, cx - 8, B - h + 6, 14, h - 8, WG, { cw: 3, ch: 3, ww: 1, wh: 1, lit: 0.35 });
      landmarks.push({ L: 'mid', x: cx, name: 'the Walkie-Talkie' });
    }
  }

  /* ======================= near (p .6): Whitehall, the Strand, Somerset House, the Temple, City churches, the Monument, the White Tower ======================= */
  {
    const R = LN.R, B = R.h;
    gnd(LN, A('#66785f'));
    fabric(LN, -200, 4351, r => (r < 460 ? 28 : r < 1290 ? 36 : r < 1800 ? 28 : r < 3560 ? 38 : 22),
      r => (r > 3560 ? { stock: 4, red: 2 } : r > 2400 ? { stone: 4, office: 3, stock: 1 } : r > 1480 && r < 1830 ? { red: 4, stone: 2 } : { stone: 5, stock: 2, red: 1 }),
      { wMin: 9, wMax: 17, ex: [[540, 900], [1125, 1250], [1286, 1474], [1680, 1716], [3125, 3160], [3590, 3790]] });
    /* Norman Shaw's red and white striped New Scotland Yard */
    {
      const cx = at(LN, 596), h = hx(LN, 30), m = red[0];
      R.rect(cx - 13, B - h, 26, h, m); R.rect(cx + 8, B - h, 5, h, redD);
      for (let y = B - h + 2; y < B; y += 3) R.rect(cx - 13, y, 26, 1, portL);
      winGrid(R, rng, cx - 12, B - h + 3, 19, h - 4, W, { cw: 2, ch: 3, ww: 1, wh: 1, lit: 0.45 });
      R.poly([cx - 13.5, B - h, cx + 13.5, B - h, cx + 10, B - h - 5, cx - 10, B - h - 5], slate);
      for (const tx of [cx - 14, cx + 11]) { R.rect(tx, B - h - 3, 4, h + 3, m); R.poly([tx - 0.5, B - h - 3, tx + 4.5, B - h - 3, tx + 2, B - h - 8], slate); }
      for (const cx2 of [cx - 4, cx + 3]) R.rect(cx2, B - h - 8, 2, 3, chim);
    }
    /* Ministry of Defence: a long pale slab under a green copper roof */
    {
      const st = port[0], stD = portD, x0 = at(LN, 660), x1 = at(LN, 760), h = hx(LN, 40);
      R.rect(x0, B - h, x1 - x0, h, st); R.rect(x1 - 6, B - h, 6, h, stD); R.rect(x0, B - h, x1 - x0, 1, portL);
      winGrid(R, rng, x0 + 1, B - h + 2, x1 - x0 - 8, h - 3, W, { cw: 2, ch: 3, ww: 1, wh: 2, lit: 0.55 });
      R.poly([x0 - 0.5, B - h, x1 + 0.5, B - h, x1 - 2, B - h - 3, x0 + 2, B - h - 3], copper);
      for (const px of [x0 + 3, x1 - 13]) { R.rect(px, B - h - 6, 10, 4, st); R.poly([px - 0.5, B - h - 6, px + 10.5, B - h - 6, px + 8, B - h - 9, px + 2, B - h - 9], copper); }
      landmarks.push({ L: 'near', x: at(LN, 709), name: 'the Ministry of Defence' });
    }
    /* Whitehall Court: a French chateau skyline of spires and turrets */
    {
      const st = port[1], stD = portD, x0 = at(LN, 812), x1 = at(LN, 900), h = hx(LN, 34);
      R.rect(x0, B - h, x1 - x0, h, st); R.rect(x1 - 5, B - h, 5, h, stD);
      winGrid(R, rng, x0 + 1, B - h + 2, x1 - x0 - 6, h - 3, W, { cw: 2, ch: 3, ww: 1, wh: 2, lit: 0.5 });
      R.rect(x0, B - h - 3, x1 - x0, 3, slate);
      let k = 0;
      for (let x = x0 + 1; x < x1 - 3; x += ri(rng, 5, 8), k++) {
        const ty = k % 3 === 0 ? 10 : k % 3 === 1 ? 6 : 8;
        if (k % 3 === 1) { R.poly([x - 0.5, B - h - 3, x + 5.5, B - h - 3, x + 2.5, B - h - 3 - ty], slate); R.px(x + 2, B - h - 4 - ty, gold); }
        else { R.rect(x, B - h - ty + 3, 3, ty - 3, st); R.poly([x - 0.5, B - h - ty + 3, x + 3.5, B - h - ty + 3, x + 1.5, B - h - ty - 2], slate); R.px(x + 1, B - h - ty - 3, lead); }
      }
      landmarks.push({ L: 'near', x: at(LN, 858), name: 'Whitehall Court' });
    }
    /* Shell Mex House: white Art Deco, stepped, with the great clock */
    {
      const st = A('#ece9e1', KF, '#f6f1e4', 0.18), stD = portD, cx = at(LN, 1160), h = hx(LN, 46);
      R.rect(cx - 19, B - h, 38, h, st); R.rect(cx + 13, B - h, 6, h, stD);
      R.rect(cx - 15, B - h - 3, 30, 3, st); R.rect(cx + 11, B - h - 3, 4, 3, stD);
      winGrid(R, rng, cx - 18, B - h + 2, 30, h - 3, W, { cw: 2, ch: 3, ww: 1, wh: 2, lit: 0.5 });
      R.rect(cx - 5, B - h - 13, 10, 13, st); R.rect(cx + 3, B - h - 13, 2, 13, stD); R.rect(cx - 4, B - h - 15, 8, 2, st); R.rect(cx - 2, B - h - 17, 4, 2, st);
      const face = A('#f3ecd6', KN, '#fff3cc', 0.9);
      R.disc(cx + 0.5, B - h - 7.5, 4, A('#2e2c2e')); R.disc(cx + 0.5, B - h - 7.5, 3.2, face);
      dyn.clocks.push({ L: 'near', x: cx, y: B - h - 8, r: 3 });
      landmarks.push({ L: 'near', x: cx, name: 'Shell Mex House' });
    }
    /* the Savoy, its white river front */
    {
      const st = portL, cx = at(LN, 1222), h = hx(LN, 36);
      R.rect(cx - 14, B - h, 28, h, st); R.rect(cx + 10, B - h, 4, h, port[2]);
      for (let y = B - h + 3; y < B - 1; y += 3) R.rect(cx - 13, y, 22, 1, port[1]);
      winGrid(R, rng, cx - 13, B - h + 2, 22, h - 3, W, { cw: 3, ch: 3, ww: 2, wh: 1, lit: 0.6 });
      R.rect(cx - 12, B - h - 2, 24, 2, port[1]); R.rect(cx - 1, B - h - 5, 2, 3, gold);
      landmarks.push({ L: 'near', x: cx, name: 'the Savoy' });
    }
    /* Somerset House: the long neoclassical river front over its rusticated arcade */
    {
      const st = A('#ddd6c5', KF, '#f2e3bf', 0.16), stD = A('#b9b19e'), rus = A('#c9c1ad'), x0 = at(LN, 1290), x1 = at(LN, 1470), mx = (x0 + x1) >> 1;
      R.rect(x0, B - 12, x1 - x0, 12, rus);
      for (let y = B - 11; y < B; y += 2) R.rect(x0, y, x1 - x0, 1, stD);
      for (let x = x0 + 3; x < x1 - 3; x += 5) { R.rect(x, B - 9, 3, 9, dark); R.px(x, B - 9, rus); R.px(x + 2, B - 9, rus); }
      R.rect(x0 + 2, B - 29, x1 - x0 - 4, 17, st); R.rect(x0 + 2, B - 29, x1 - x0 - 4, 1, portL);
      for (let x = x0 + 4; x < x1 - 4; x += 3) for (const y of [B - 26, B - 21, B - 16]) R.rect(x, y, 1, 3, rng() < 0.35 ? pick(rng, W.on) : W.off);
      for (let x = x0 + 2; x < x1 - 2; x += 2) R.px(x, B - 30, st);
      for (const px of [x0 + 2, x0 + 24, x1 - 34, x1 - 12]) { R.rect(px, B - 32, 10, 20, st); pediment(R, px, B - 32, 10, 3, stD); for (let c = px + 1; c < px + 10; c += 2) R.rect(c, B - 30, 1, 14, stD); }
      R.rect(mx - 10, B - 34, 20, 22, st); pediment(R, mx - 10, B - 34, 20, 5, stD, portL); for (let c = mx - 8; c < mx + 9; c += 2) R.rect(c, B - 32, 1, 17, stD);
      R.rect(mx - 4, B - 42, 8, 4, st); R.ellipse(mx, B - 42, 4.5, 4, lead); R.rect(mx, B - 49, 1, 4, lead);
      landmarks.push({ L: 'near', x: mx, name: 'Somerset House' });
    }
    /* the Temple: red brick chambers and the round Temple Church */
    {
      const cx = at(LN, 1698), st = port[2], stD = portD;
      R.rect(cx - 9, B - 8, 10, 8, st); R.rect(cx - 2, B - 8, 3, 8, stD); R.poly([cx - 9.5, B - 8, cx + 1.5, B - 8, cx - 4, B - 12], slate);
      R.rect(cx + 1, B - 11, 9, 11, st); R.rect(cx + 7, B - 11, 3, 11, stD); R.poly([cx + 0.5, B - 11, cx + 10.5, B - 11, cx + 5.5, B - 15], slate);
      for (const x of [cx - 7, cx - 4, cx + 3, cx + 6]) R.rect(x, B - 7, 1, 3, slit);
      landmarks.push({ L: 'near', x: cx, name: 'the Temple' });
    }
    /* City churches near the river */
    steeple(R, at(LN, 2195), B, hx(LN, 26), 'brick');
    steeple(R, at(LN, 2423), B, hx(LN, 37), 'pinn');
    steeple(R, at(LN, 2487), B, hx(LN, 40), 'lead');
    steeple(R, at(LN, 2598), B, hx(LN, 44), 'lantern');
    steeple(R, at(LN, 2815), B, hx(LN, 39), 'lantern');
    steeple(R, at(LN, 3306), B, hx(LN, 45), 'gothic');
    steeple(R, at(LN, 3460), B, hx(LN, 36), 'copper');
    /* the Monument: Doric column, gallery, gilded urn of flames */
    {
      const st = wren, stD = wrenD, cx = at(LN, 3142), h = hx(LN, 62);
      R.rect(cx - 3, B - 6, 7, 6, st); R.rect(cx + 2, B - 6, 2, 6, stD);
      R.rect(cx - 1, B - h + 4, 3, h - 10, st); R.rect(cx + 1, B - h + 4, 1, h - 10, stD);
      R.rect(cx - 2, B - h + 3, 5, 1, dark); R.rect(cx - 1, B - h + 1, 3, 2, st);
      R.rect(cx, B - h - 2, 1, 3, gold); R.px(cx - 1, B - h - 1, gold); R.px(cx + 1, B - h - 1, gold);
      landmarks.push({ L: 'near', x: cx, name: 'the Monument' });
    }
    /* the White Tower: four turrets under lead cupolas (1.3x), Tower Hill trees */
    {
      const st = A('#e5dfcf', KF, '#fff0cc', 0.35), stD = A('#bdb5a1', KF, '#d6bd8a', 0.12), stL = A('#f2eee4', KF, '#fff6dc', 0.3);
      const cx = at(LN, 3692), s = 0.85 * LN.p * 2.1, h = Math.round(27 * s), hw = Math.round(18 * s);
      woods(R, rng, at(LN, 3560), at(LN, 3610), B - 2, x => 8, Q.leaf, { rMin: 2.5, rMax: 4 });
      woods(R, rng, at(LN, 3770), at(LN, 3830), B - 2, x => 8, Q.leaf, { rMin: 2.5, rMax: 4 });
      R.rect(cx - hw, B - h, hw * 2, h, st); R.rect(cx + hw - 5, B - h, 5, h, stD); R.rect(cx - hw, B - h, 1, h, stL);
      R.ellipse(cx + hw, B - h * 0.55, 3, h * 0.55, stD);
      for (let x = cx - hw + 3; x < cx + hw - 4; x += 4) { R.rect(x, B - h + 4, 1, 3, slit); R.rect(x, B - h + 11, 1, 3, slit); }
      for (let x = cx - hw; x < cx + hw; x += 2) R.px(x, B - h - 1, st);
      for (const [tx, round] of [[cx - hw - 1, 0], [cx - hw + 7, 0], [cx + hw - 9, 0], [cx + hw - 3, 1]]) {
        R.rect(tx, B - h - 4, 4, 4, round ? stD : st);
        R.ellipse(tx + 2, B - h - 5, 2.6, 2.4, lead); R.rect(tx + 1, B - h - 8, 2, 1, lead); R.px(tx + 2, B - h - 10, gold); R.px(tx + 2, B - h - 9, lead);
      }
      landmarks.push({ L: 'near', x: cx, name: 'the Tower of London' });
    }
  }

  /* ======================= front (p .85): the Palace of Westminster, Portcullis House, gardens, the City's river front, the Tower walls, St Katharine Docks ======================= */
  {
    const R = LT.R, B = R.h;
    R.rect(0, B - 2, LT.W, 2, A('#55684a'));
    /* trees: Victoria Tower Gardens, Whitehall Gardens, Embankment Gardens, the Temple gardens, St Katharine's */
    woods(R, rng, 0, at(LT, 178), B - 1, x => 10 + 2 * Math.sin(x * 0.11), Q.leaf, { rMin: 3, rMax: 5 });
    woods(R, rng, at(LT, 3992), LT.W + 2, B - 1, x => 9 + 2 * Math.sin(x * 0.13), Q.leaf, { rMin: 3, rMax: 5 });
    for (const [a, b, n] of [[540, 640, 4], [780, 905, 5], [985, 1110, 7], [1490, 1810, 14]]) for (let i = 0; i < n; i++) tree(R, ri(rng, at(LT, a), at(LT, b)), B - 1, ri(rng, 3, 5), Q, rng() < 0.15 ? leafAut : Q.leaf);
    /* Wapping: quiet brick wharves among the trees after St Katharine's; Millbank before the Gardens */
    fabric(LT, 4050, 4330, () => 16, { stock: 3, red: 2 }, { wMin: 14, wMax: 26, fill: 0.55, gap: 1 });
    fabric(LT, -190, -30, () => 18, { stone: 2, red: 1 }, { wMin: 14, wMax: 22, fill: 0.4, gap: 1 });
    /* the City's river front: low offices and old warehouses, Peter's Hill kept open */
    fabric(LT, 1830, 3570, r => (r < 2070 ? 22 : 28), r => (r < 2100 ? { stone: 3, red: 1 } : { office: 3, stone: 3, stock: 2, red: 1 }), { wMin: 12, wMax: 24, fill: 0.85, gap: 0.5,
      ex: [[1940, 2045], [2050, 2085], [2115, 2145], [2830, 2885], [2940, 3048], [3060, 3075], [3230, 3440]] });
    /* ---- the Palace of Westminster: honey-coloured gothic river front ---- */
    {
      const st = A('#d8be86', KF, '#f4c66c', 0.26), stD = A('#b39b68', KF, '#cf9f4e', 0.12), stL = A('#e9d5a5', KF, '#ffdc94', 0.24);
      const roof = A('#4c575f'), roofL = A('#66717a'), roofD = A('#3b444b');
      const f0 = at(LT, 220), f1 = at(LT, 424), fh = hm(LT, 26);
      /* roofs and lanterns behind the river front */
      R.poly([f0, B - fh, f1, B - fh, f1 - 3, B - fh - 5, f0 + 3, B - fh - 5], roof); R.rect(f0 + 3, B - fh - 5, f1 - f0 - 6, 1, roofL);
      for (const lx of [f0 + 34, f0 + 112, f1 - 28]) { R.rect(lx, B - fh - 11, 4, 7, st); R.rect(lx + 3, B - fh - 11, 1, 7, stD); R.poly([lx - 0.5, B - fh - 11, lx + 4.5, B - fh - 11, lx + 2, B - fh - 15], roof); }
      /* the Central Tower: octagonal lantern and stone spire */
      {
        const cx = at(LT, 300), h = hm(LT, 91);
        R.rect(cx - 4, B - 38, 8, 38 - fh, st); R.rect(cx + 2, B - 38, 2, 38 - fh, stD);
        for (const x of [cx - 2, cx]) R.rect(x, B - 35, 1, 6, slit);
        for (const x of [cx - 5, cx + 4]) { R.rect(x, B - 41, 1, 8, stL); }
        R.poly([cx - 4, B - 38, cx + 4, B - 38, cx + 0.5, B - h], st); R.poly([cx + 0.5, B - 38, cx + 4, B - 38, cx + 0.5, B - h], stD);
        for (let y = B - 41; y > B - h + 3; y -= 3) { const k = (B - 38 - y) / (h - 38); R.px(Math.round(cx - 4 + 4 * k) - 1, y, stL); }
        R.rect(cx, B - h - 3, 1, 3, gold);
      }
      /* the river front: three storeys of bays, a pinnacled parapet, end and centre pavilions */
      R.rect(f0, B - fh, f1 - f0, fh, st); R.rect(f0, B - fh, f1 - f0, 1, stL);
      for (let x = f0 + 1; x < f1 - 1; x += 3) {
        R.rect(x + 1, B - fh + 2, 1, fh - 3, stD);
        for (const yy of [B - fh + 3, B - fh + 8, B - fh + 13]) R.rect(x, yy, 1, 3, rng() < 0.3 ? pick(rng, W.on) : slit);
      }
      for (let x = f0; x < f1; x += 3) R.rect(x, B - fh - 2, 1, 2, stL);
      for (const px of [f0, ((f0 + f1) >> 1) - 7, f1 - 14]) {
        R.rect(px, B - fh - 6, 14, fh + 6, st); R.rect(px + 11, B - fh - 6, 3, fh + 6, stD); R.rect(px, B - fh - 6, 1, fh + 6, stL);
        R.poly([px - 0.5, B - fh - 6, px + 14.5, B - fh - 6, px + 11, B - fh - 12, px + 3, B - fh - 12], roof); R.poly([px + 7, B - fh - 6, px + 14.5, B - fh - 6, px + 11, B - fh - 12, px + 7, B - fh - 12], roofD);
        for (const qx of [px, px + 13]) R.rect(qx, B - fh - 10, 1, 4, stL);
        for (const qx of [px + 3, px + 6, px + 9]) for (const yy of [B - fh - 3, B - fh + 4, B - fh + 10]) R.rect(qx, yy, 1, 3, slit);
      }
      /* Victoria Tower, big and square, four corner pinnacles and the flag */
      {
        const vx = at(LT, 208), v0 = vx - 9, vw = 18, vh = hm(LT, 98) - 7;
        R.rect(v0, B - vh, vw, vh, st); R.rect(v0 + vw - 5, B - vh, 5, vh, stD); R.rect(v0, B - vh, 1, vh, stL);
        for (const x of [v0 - 1, v0 + vw - 1]) R.rect(x, B - vh + 3, 2, vh - 3, x < vx ? stL : stD);
        for (let y = B - vh + 4; y < B - 14; y += 9) R.rect(v0 + 1, y, vw - 2, 1, stL);
        for (const x of [v0 + 3, v0 + 6, v0 + 9]) { R.rect(x, B - vh + 6, 1, 11, slit); R.rect(x, B - vh + 24, 1, 9, slit); R.rect(x, B - vh + 38, 1, 7, slit); }
        R.rect(vx - 3, B - 11, 6, 11, slit); R.poly([vx - 3, B - 11, vx + 3, B - 11, vx, B - 15], slit);
        for (let x = v0; x < v0 + vw; x += 2) R.px(x, B - vh - 1, stL);
        for (const x of [v0 - 1, v0 + vw - 2]) { R.rect(x, B - vh - 6, 3, 6, x < vx ? st : stD); R.poly([x - 0.5, B - vh - 6, x + 3.5, B - vh - 6, x + 1.5, B - vh - 9], stL); }
        for (const x of [v0 + 4, v0 + vw - 6]) R.rect(x, B - vh - 3, 2, 3, st);
        const pole = A('#3b3633'), fr = A('#c8312c'), fb = A('#2a4a8c'), fw = A('#f2efe6');
        R.rect(vx, B - vh - 14, 1, 14, pole);
        R.stamp(vx + 1, B - vh - 14, ['bwrwb', 'rrrrr', 'bwrwb'], { b: fb, w: fw, r: fr });
      }
      /* ELIZABETH TOWER at the bridge end: clock stage, belfry, gilded spire (1.1x) */
      {
        const cx = at(LT, 432), face = A('#f2e8c8', KN, '#fff3c8', 0.95), rim = A('#2c2a2e');
        R.rect(cx - 4, B - 38, 8, 38, st); R.rect(cx + 2, B - 38, 2, 38, stD); R.rect(cx - 4, B - 38, 1, 38, stL);
        for (let y = B - 34; y < B - 6; y += 5) { R.rect(cx - 2, y, 1, 3, slit); R.rect(cx, y, 1, 3, slit); }
        R.rect(cx - 5, B - 39, 10, 1, stL);
        R.rect(cx - 5, B - 49, 10, 10, st); R.rect(cx + 3, B - 49, 2, 10, stD);
        R.disc(cx + 0.5, B - 43.5, 4.4, gold); R.disc(cx + 0.5, B - 43.5, 3.6, face); R.px(cx, B - 44, rim);
        dyn.clocks.push({ L: 'front', x: cx, y: B - 44, r: 3 });
        R.rect(cx - 5, B - 50, 10, 1, stL);
        R.rect(cx - 4, B - 55, 9, 5, st); R.rect(cx + 3, B - 55, 2, 5, stD);
        for (const dx of [-3, -1, 1]) R.rect(cx + dx, B - 54, 1, 3, slit);
        for (const px of [cx - 5, cx + 4]) R.rect(px, B - 58, 1, 4, gold);
        R.poly([cx - 4.5, B - 55, cx + 5.5, B - 55, cx + 0.5, B - 69], roof); R.poly([cx + 0.5, B - 55, cx + 5.5, B - 55, cx + 0.5, B - 69], roofD);
        R.line(cx - 3, B - 56, cx, B - 66, gold); R.px(cx - 1, B - 59, gold); R.px(cx + 2, B - 61, gold);
        R.rect(cx, B - 74, 1, 6, gold); R.rect(cx - 1, B - 72, 3, 1, gold);
        landmarks.push({ L: 'front', x: cx, name: 'Big Ben' });
      }
      landmarks.push({ L: 'front', x: at(LT, 290), name: 'the Houses of Parliament' });
    }
    /* Portcullis House: dark stone and bronze, its row of tall chimney flues */
    {
      const pb = A('#7d7569'), pbD = A('#5f584f'), bronze = A('#6c5539'), x0 = at(LT, 482), x1 = at(LT, 532), h = hx(LT, 26);
      R.rect(x0, B - h, x1 - x0, h, pb); R.rect(x1 - 7, B - h, 7, h, pbD);
      winGrid(R, rng, x0 + 1, B - h + 2, x1 - x0 - 8, h - 4, W, { cw: 3, ch: 3, ww: 2, wh: 2, lit: 0.5 });
      R.poly([x0 - 0.5, B - h, x1 + 0.5, B - h, x1 - 3, B - h - 5, x0 + 3, B - h - 5], leadD);
      for (let x = x0 + 1; x < x1 - 1; x += 5) { R.rect(x, B - h - 10, 2, 10, bronze); R.px(x, B - h - 11, bronze); }
      landmarks.push({ L: 'front', x: (x0 + x1) >> 1, name: 'Portcullis House' });
    }
    /* Unilever House: the curved white front by Blackfriars Bridge */
    {
      const st = A('#e8e4da', KF, '#fff3d6', 0.2), stD = portD, col = port[2], x0 = at(LT, 1945), x1 = at(LT, 2045), h = hx(LT, 40);
      R.rect(x0, B - h, x1 - x0 - 8, h, st); R.ellipse(x1 - 8, B - h / 2, 8, h / 2, st);
      R.ellipse(x1 - 6, B - h / 2, 5, h / 2, stD); R.rect(x0, B - h, x1 - x0 - 6, 2, portL);
      for (let x = x0 + 4; x < x1 - 4; x += 4) R.rect(x, B - h + 6, 1, h - 12, col);
      winGrid(R, rng, x0 + 2, B - h + 4, x1 - x0 - 8, h - 6, W, { cw: 4, ch: 3, ww: 2, wh: 2, lit: 0.55 });
      R.rect(x0, B - 6, x1 - x0, 1, stD);
      for (const px of [x0 + 1, x1 - 6]) { R.rect(px, B - h - 3, 4, 3, dark); R.px(px + 1, B - h - 4, dark); }
      landmarks.push({ L: 'front', x: (x0 + x1) >> 1, name: 'Unilever House' });
    }
    /* Blackfriars station's north entrance */
    { const x0 = at(LT, 2118), x1 = at(LT, 2142); R.rect(x0, B - 12, x1 - x0, 12, A('#4f5f72', KG)); R.rect(x0, B - 13, x1 - x0, 1, conc); winGrid(R, rng, x0 + 1, B - 11, x1 - x0 - 2, 10, WG, { cw: 3, ch: 3, ww: 2, wh: 2, lit: 0.6 }); }
    /* Cannon Street: twin brick towers with lead caps either side of the train shed */
    {
      const br = A('#b48f68'), brD = A('#8e6f50'), cx = at(LT, 2856), h = hx(LT, 41);
      R.rect(cx - 13, B - 13, 26, 13, br); R.rect(cx - 13, B - 13, 26, 1, portL);
      for (let x = cx - 11; x < cx + 11; x += 3) R.rect(x, B - 11, 1, 6, dark);
      for (const tx of [cx - 18, cx + 13]) {
        R.rect(tx, B - h, 6, h, br); R.rect(tx + 4, B - h, 2, h, brD);
        for (let y = B - h + 4; y < B - 4; y += 6) R.rect(tx + 2, y, 1, 3, slit);
        R.rect(tx - 1, B - h - 1, 8, 1, portL); R.ellipse(tx + 3, B - h - 2, 3.6, 3.5, lead); R.rect(tx + 2, B - h - 7, 2, 2, lead); R.px(tx + 3, B - h - 9, gold);
      }
      landmarks.push({ L: 'front', x: cx, name: 'Cannon Street station' });
    }
    /* Fishmongers' Hall on its river terrace, St Magnus the Martyr beside the bridge */
    {
      const st = A('#d4cebf', KF, '#f0e2c0', 0.18), stD = portD, col = concD, x0 = at(LT, 2945), x1 = at(LT, 3015), h = hx(LT, 22);
      R.rect(x0 - 2, B - 5, x1 - x0 + 4, 5, stD);
      R.rect(x0, B - 5 - h, x1 - x0, h, st); R.rect(x1 - 6, B - 5 - h, 6, h, stD); R.rect(x0, B - 5 - h, x1 - x0, 1, portL);
      const mx = (x0 + x1) >> 1;
      for (let c = mx - 9; c <= mx + 9; c += 3) R.rect(c, B - 3 - h, 2, h - 3, col);
      pediment(R, mx - 11, B - 5 - h, 22, 4, st, stD);
      winGrid(R, rng, x0 + 2, B - h, 12, h - 5, W, { cw: 3, ch: 4, ww: 1, wh: 2, lit: 0.5 }); winGrid(R, rng, x1 - 18, B - h, 11, h - 5, W, { cw: 3, ch: 4, ww: 1, wh: 2, lit: 0.5 });
      landmarks.push({ L: 'front', x: mx, name: "Fishmongers' Hall" });
      steeple(R, at(LT, 3065), B, hx(LT, 56), 'lantern');
    }
    /* Old Billingsgate and the Custom House: long low classical fronts on the river */
    {
      const ye = A('#d9c9a2'), yeD = A('#b2a27e'), x0 = at(LT, 3234), x1 = at(LT, 3318), h = hx(LT, 20);
      R.rect(x0, B - h, x1 - x0, h, ye); R.rect(x1 - 5, B - h, 5, h, yeD); R.rect(x0, B - h, x1 - x0, 1, portL);
      for (let x = x0 + 3; x < x1 - 4; x += 4) { R.rect(x, B - 6, 2, 6, dark); R.rect(x, B - h + 4, 1, 3, rng() < 0.4 ? W.on[0] : W.off); }
      for (const px of [x0, x1 - 12]) { R.rect(px, B - h - 3, 12, h + 3, ye); R.poly([px - 0.5, B - h - 3, px + 12.5, B - h - 3, px + 10, B - h - 8, px + 2, B - h - 8], slate); R.px(px + 6, B - h - 9, gold); }
      const mx = (x0 + x1) >> 1; pediment(R, mx - 8, B - h, 16, 4, ye, yeD); R.rect(mx - 1, B - h - 7, 2, 3, gold);
      landmarks.push({ L: 'front', x: mx, name: 'Old Billingsgate' });
      const st = port[0], stD = portD, c0 = at(LT, 3322), c1 = at(LT, 3436), ch = hx(LT, 21);
      R.rect(c0, B - ch, c1 - c0, ch, st); R.rect(c1 - 6, B - ch, 6, ch, stD); R.rect(c0, B - ch, c1 - c0, 1, portL);
      winGrid(R, rng, c0 + 2, B - ch + 3, c1 - c0 - 9, ch - 5, W, { cw: 3, ch: 4, ww: 1, wh: 2, lit: 0.5 });
      const cm = (c0 + c1) >> 1; R.rect(cm - 10, B - ch - 4, 20, ch + 4, st); for (let c = cm - 8; c <= cm + 8; c += 3) R.rect(c, B - ch - 1, 1, ch - 2, stD); R.rect(cm - 10, B - ch - 4, 20, 1, portL);
      landmarks.push({ L: 'front', x: cm, name: 'the Custom House' });
    }
    /* the Tower of London: curtain walls, round towers, Traitors' Gate */
    {
      const st = A('#cbc2ad', KF, '#f0d9a6', 0.25), stD = A('#a29880', KF, '#bf9f68', 0.08), stL = A('#ddd5c2', KF, '#fbe6b8', 0.22);
      const x0 = at(LT, 3592), x1 = at(LT, 3800);
      for (const [a, b, hh] of [[x0 + 14, x1 - 16, 18], [x0, x1, 11]]) {
        R.rect(a, B - hh, b - a, hh, hh > 10 ? stD : st); for (let x = a; x < b; x += 2) R.px(x, B - hh - 1, hh > 10 ? stD : st);
        R.rect(a, B - hh, b - a, 1, stL);
      }
      for (const [tx, w, hh] of [[x0 + 2, 10, 17], [x0 + 48, 13, 18], [x0 + 84, 11, 17], [x1 - 34, 10, 15], [x1 - 10, 10, 17], [x0 + 28, 9, 24], [x0 + 66, 10, 25]]) {
        R.rect(tx, B - hh, w, hh, st); R.rect(tx + w - 3, B - hh, 3, hh, stD); R.rect(tx, B - hh, 1, hh, stL);
        for (let x = tx; x < tx + w; x += 2) R.px(x, B - hh - 1, st);
        R.rect(tx + (w >> 1), B - hh + 3, 1, 2, slit);
      }
      const tg = x0 + 54; R.rect(tg - 4, B - 8, 9, 8, dark); R.ellipse(tg + 0.5, B - 8, 4.5, 4, dark);
      landmarks.push({ L: 'front', x: tg, name: "Traitors' Gate" });
    }
    /* St Katharine Docks: stock-brick warehouses and the Ivory House clock tower, then quiet wharves */
    {
      for (const [a, b, hh] of [[3878, 3912, 18], [3916, 3946, 20], [3950, 3988, 22]]) {
        const x0 = at(LT, a), x1 = at(LT, b), h = hx(LT, hh), m = pick(rng, stock);
        R.rect(x0, B - h, x1 - x0, h, m); R.rect(x1 - 5, B - h, 5, h, stockD);
        for (let x = x0 + 2; x < x1 - 4; x += 3) for (let y = B - h + 2; y < B - 2; y += 4) R.rect(x, y, 1, 2, rng() < 0.4 ? pick(rng, W.on) : W.off);
        R.poly([x0 - 0.5, B - h, x1 + 0.5, B - h, x1 - 3, B - h - 3, x0 + 3, B - h - 3], slate);
      }
      const ix = at(LT, 3969), h = hx(LT, 22) + 12;
      R.rect(ix - 3, B - h, 7, h, stock[0]); R.rect(ix + 2, B - h, 2, h, stockD);
      R.disc(ix + 0.5, B - h + 3.5, 2.2, A('#f0ead8', KN, '#fff0c8', 0.6)); R.poly([ix - 3.5, B - h, ix + 4.5, B - h, ix + 0.5, B - h - 5], slate); R.px(ix, B - h - 6, gold);
      landmarks.push({ L: 'front', x: ix, name: 'St Katharine Docks' });
    }
  }

  /* ======================= the bank: granite river wall, plane trees, dolphin lamps ======================= */
  const B = BK.R.h;
  const XR = [465, 939, 1276, 2067, 2129, 2385, 2624, 2856, 3029, 3851];   // where bridges land
  const nearBridge = (x, pad) => XR.some(r => Math.abs(x - T(r)) < pad);
  {
    const R = BK.R;
    const gran = A('#8e8b86'), granD = A('#6a6762'), granL = A('#b6b1a8'), road = A('#55585e'), pave = A('#a19d95');
    const terr = A('#b8a77f', KF, '#e0b96a', 0.12), terrD = A('#94845f');
    const dolphin = A('#2b3a33'), lampG = A('#f3e6bc', KN, '#ffe08a', 0.85), lion = A('#7a6a48');
    R.rect(0, B - 7, R.w, 2, road); R.rect(0, B - 7, R.w, 1, pave);
    R.rect(0, B - 5, R.w, 5, gran); R.rect(0, B - 5, R.w, 1, granL); R.rect(0, B - 1, R.w, 1, granD);
    for (let x = 0; x < R.w; x += 6) R.px(x + ((x / 6) & 1 ? 3 : 0), B - 3, granD);
    /* the Palace terrace wall, honey stone, no trees */
    { const a = bx(180), b = bx(438); R.rect(a, B - 8, b - a, 8, terr); R.rect(a, B - 8, b - a, 1, A('#d8c79c')); for (let x = a; x < b; x += 3) R.px(x, B - 9, terr); for (let x = a + 4; x < b; x += 8) R.rect(x, B - 4, 1, 3, terrD); }
    /* Tower Wharf: a row of old cannon */
    for (let x = bx(3600); x < bx(3790); x += 20) { R.rect(x, B - 8, 4, 1, dark); R.px(x, B - 7, dark); R.px(x + 3, B - 7, dark); }
    /* bridge abutments */
    const ab = (r, w, h, m, mD) => { r = bx(r); R.rect(r - w / 2 - 3, B - h, w + 6, h, m); R.rect(r + w / 2, B - h, 3, h, mD); R.rect(r - w / 2 - 3, B - h, w + 6, 1, granL); };
    ab(465, 22, 9, A('#9a958a'), granD); ab(939, 40, 10, A('#8d6b5a'), granD); ab(1276, 21, 10, A('#d0cec6'), A('#a4a199'));
    ab(2067, 22, 10, A('#b9b2a2'), granD); ab(2129, 24, 10, A('#7a756c'), granD); ab(2385, 5, 8, A('#b8bec4'), granD);
    ab(2624, 18, 10, A('#a9a596'), granD); ab(2856, 27, 9, A('#7a5b4b'), granD); ab(3029, 27, 11, A('#c7c4bc'), A('#a3a098')); ab(3851, 16, 9, A('#b8b09f'), granD);
    /* the Victoria Embankment: plane trees, dolphin lamp standards, lion-head mooring rings */
    let x = 4;
    while (x < R.w) {
      const xo = inv(x), emb = xo > 480 && xo < 2050, wapp = xo > 3880 || xo < 180;
      const dens = emb ? (xo > 1286 && xo < 1470 ? 0.3 : 0.62) : wapp ? 0.7 : 0.25;
      if (!(xo > 176 && xo < 442) && !nearBridge(x, 18) && offAxis(xo - 6, xo + 6) && rng() < dens) tree(R, x, B - 7, ri(rng, emb ? 4 : 3, emb ? 6 : 5), Q, rng() < 0.12 ? leafAut : Q.leaf);
      x += ri(rng, emb ? 11 : 13, emb ? 18 : 26);
    }
    for (let lx = 6; lx < R.w; lx += 22) {
      const lo = inv(lx); if ((lo > 176 && lo < 442) || nearBridge(lx, 14)) continue;
      R.rect(lx - 1, B - 7, 3, 2, dolphin); R.rect(lx, B - 13, 1, 6, dolphin); R.rect(lx - 1, B - 13, 3, 1, dolphin); R.px(lx, B - 14, lampG);
      if (lo > 470 && lo < 2060) R.px(lx + 11, B - 3, lion);
    }
    /* Cleopatra's Needle and its sphinxes on the river wall */
    {
      const nx = bx(1117), gr = A('#9a8a76'), grD = A('#7a6c5a'), bz = A('#5d4c36');
      R.rect(nx - 5, B - 9, 11, 2, granL); R.rect(nx - 3, B - 12, 7, 3, gran);
      R.poly([nx - 1.5, B - 12, nx + 2.5, B - 12, nx + 1.5, B - 28, nx - 0.5, B - 28], gr); R.rect(nx + 1, B - 27, 1, 15, grD); R.px(nx, B - 29, gr);
      for (const sx of [nx - 11, nx + 8]) { R.rect(sx, B - 9, 4, 2, bz); R.rect(sx + (sx < nx ? 3 : 0), B - 11, 1, 2, bz); }
      landmarks.push({ L: 'bank', x: nx, name: "Cleopatra's Needle" });
    }
  }
  /* the water's edge: piers, the moored ships */
  {
    const S = SH.R, deck = A('#7c7a74'), deckD = A('#4f4d49'), rail = A('#2f3a33');
    for (const [a0, b0] of [[490, 540], [960, 1010], [3505, 3565], [1880, 1915]]) { const a = bx(a0), b = bx(b0); S.rect(a, 1, b - a, 2, deck); S.rect(a, 3, b - a, 2, deckD); for (let x = a; x < b; x += 3) S.px(x, 0, rail); }
    /* the Tattershall Castle paddle steamer and HMS Wellington */
    const R = BK.R, hullB = A('#2b2a2e'), white = A('#ecebe6'), buff = A('#d1a24c'), grey = A('#8a9097'), win = A('#3b4656', KW, '#ffd27a', 0.5);
    { const a = bx(860), b = a + 52; S.rect(a, 0, b - a, 5, hullB); S.rect(a + 2, 5, b - a - 4, 1, hullB); R.rect(a + 4, B - 6, b - a - 10, 3, white); for (let x = a + 5; x < b - 7; x += 3) R.px(x, B - 5, win); R.rect(a + 22, B - 13, 3, 7, buff); R.rect(a + 22, B - 14, 3, 1, hullB); R.ellipse(a + 30, B - 2, 5, 3, white); }
    { const a = bx(1546), b = a + 60; S.rect(a, 0, b - a, 5, grey); S.rect(a, 0, b - a, 1, white); S.rect(a + 3, 5, b - a - 6, 1, grey); R.rect(a + 14, B - 6, 30, 3, white); for (let x = a + 15; x < a + 43; x += 3) R.px(x, B - 5, win); R.rect(a + 26, B - 11, 4, 5, buff); R.rect(a + 18, B - 19, 1, 13, hullB); R.rect(a + 38, B - 16, 1, 10, hullB); R.line(a + 2, B - 4, a + 18, B - 19, hullB); R.line(a + 18, B - 19, a + 38, B - 16, hullB); R.line(a + 38, B - 16, b - 2, B - 4, hullB);
      landmarks.push({ L: 'bank', x: a + 30, name: 'HMS Wellington' }); }
  }

  /* ======================= the bridges, each crossing toward the camera ======================= */
  const road = A('#5c5f66'), walk = A('#a19d95'), markM = A('#d9d2b8'), lampM = A('#f1e2b6', KN, '#ffe08a', 0.85);
  /* sprites: Tower Bridge main tower and abutment tower, Hungerford masts, a Millennium Bridge Y pier */
  const tbS = A('#d2c8b3', KF, '#ffe2a8', 0.4), tbSD = A('#a99f8a', KF, '#d6b27a', 0.15), tbSL = A('#e4dccb', KF, '#fff0c8', 0.35), tbR = A('#55606a'), tbP = A('#8e877a');
  const sprites = [];
  {
    const T = new Raster(24, 66), H = 66, y = k => H - 1 - k;
    T.rect(0, y(7), 24, 8, tbP); T.rect(0, y(7), 24, 1, tbSL); T.poly([0, y(0) + 1, 24, y(0) + 1, 22, y(3), 2, y(3)], tbP);
    T.rect(5, y(50), 14, 43, tbS); T.rect(15, y(50), 4, 43, tbSD);
    for (const [x, m] of [[3, tbSL], [18, tbSD]]) { T.rect(x, y(54), 3, 47, m); T.rect(x, y(54), 3, 1, tbSL); T.poly([x - 0.5, y(54), x + 3.5, y(54), x + 1.5, y(61)], tbR); T.px(x + 1, y(62), gold); }
    T.rect(8, y(19), 8, 12, dark); T.poly([8, y(19), 16, y(19), 12, y(23)], dark);
    for (const yy of [26, 35, 43]) for (const x of [8, 14]) { T.rect(x, y(yy + 4), 2, 4, dark); }
    T.rect(5, y(50), 14, 1, tbSL); T.rect(7, y(55), 10, 5, tbS); T.rect(14, y(55), 3, 5, tbSD); T.rect(11, y(54), 2, 3, dark);
    T.poly([6.5, y(55), 17.5, y(55), 12, y(64)], tbR); T.poly([12, y(55), 17.5, y(55), 12, y(64)], A('#434d56')); T.px(12, y(65), gold);
    sprites.push(T);
    const U = new Raster(16, 30), h2 = 30, u = k => h2 - 1 - k;
    U.rect(1, u(22), 14, 23, tbS); U.rect(11, u(22), 4, 23, tbSD); U.rect(0, u(4), 16, 5, tbP);
    for (const x of [1, 12]) { U.rect(x, u(25), 3, 4, x < 6 ? tbSL : tbSD); U.poly([x - 0.5, u(25), x + 3.5, u(25), x + 1.5, u(29)], tbR); }
    U.poly([3.5, u(22), 12.5, u(22), 8, u(27)], tbR); U.rect(6, u(16), 4, 6, dark); U.rect(6, u(9), 4, 4, dark);
    sprites.push(U);
    const mast = A('#eef0f2', KF, '#ffffff', 0.5);
    for (const dir of [-1, 1]) { const Mm = new Raster(6, 22); Mm.line(dir < 0 ? 5 : 0, 21, dir < 0 ? 0 : 5, 0, mast); Mm.line(dir < 0 ? 4 : 1, 21, dir < 0 ? 0 : 5, 1, mast); sprites.push(Mm); }
    const Y = new Raster(9, 9), steelY = A('#aeb6bd');
    Y.rect(4, 4, 1, 5, steelY); Y.line(4, 4, 0, 0, steelY); Y.line(4, 4, 8, 0, steelY); Y.rect(3, 7, 3, 2, A('#8e9499'));
    sprites.push(Y);
  }
  const tbBlue = A('#5e98c8', KF, '#8fd0ff', 0.45), tbBlueD = A('#3f6f9c'), tbBlueL = A('#8fc0e4', KN, '#a8dcff', 0.7);
  const tbLines = [];
  for (const lat of [-8, 8]) {
    for (const hh of [43, 47]) tbLines.push({ m: tbBlue, pts: [[55, hh, lat], [125, hh, lat]] });
    const zz = []; for (let z = 55, k = 0; z <= 125; z += 5, k++) zz.push([z, k & 1 ? 47 : 43, lat]);
    tbLines.push({ m: tbBlueD, pts: zz });
    tbLines.push({ m: tbBlueL, pts: hangLine(55, 46, 6, 18, 12, lat, 12) });
    tbLines.push({ m: tbBlueL, pts: hangLine(125, 46, 205, 16, 12, lat, 12) });
  }
  const hungStays = (lat, dir) => { const L = []; for (const z of [35, 80, 125, 170, 215]) for (const dz of [-14, 14]) L.push({ m: A('#d9dde0'), pts: [[z, 31, lat + dir * 5], [z + dz, 11, lat]] }); return L; };
  const masts = dir => [35, 80, 125, 170, 215].map(z => ({ z, spr: dir < 0 ? 2 : 3, lat: dir * 2, base: 10 }));
  const oldPiers = [36, 72, 108, 144, 180].map(z => ({ name: 'the old Blackfriars rail bridge', r: T(2098), w: 16, h: 7, th: 7, z0: z - 3, len: z + 3, piers: [z + 1], pw: 3, top: A('#b5463c'), side: A('#93372f'), pier: A('#93372f') }));
  const crossings = [
    { name: 'Westminster Bridge', r: T(465), w: 21, h: 9, th: 2, pw: 6, piers: [30, 60, 90, 120, 150, 180], arch: 14, top: road, walk, mark: markM, side: A('#4d8a68'), pier: A('#9a958a'), rail: A('#3b6c50'), lamp: lampM, lampEvery: 18 },
    { name: 'the Golden Jubilee Bridge', r: T(925), w: 5, h: 11, th: 1.5, top: A('#c9cdd0'), side: A('#e6e9eb'), rail: A('#e6e9eb'), towers: masts(-1), lines: hungStays(-2, -1), lamp: lampM, lampEvery: 14 },
    { name: 'Hungerford Bridge', r: T(939), w: 12, h: 10, th: 4, pw: 8, piers: [62, 140], top: A('#6a5f58'), side: A('#56514d'), pier: A('#8d6b5a'), rail: A('#3e3a37'),
      lines: [-6, 6].map(lat => { const p = []; for (let z = 0, k = 0; z < 320; z += 7, k++) p.push([z, k & 1 ? 10 : 16, lat]); return { m: A('#4a4643'), pts: p }; }).concat([-6, 6].map(lat => ({ m: A('#4a4643'), pts: [[0, 16, lat], [320, 16, lat]] }))) },
    { name: 'the Golden Jubilee Bridges', r: T(953), w: 5, h: 11, th: 1.5, top: A('#c9cdd0'), side: A('#e6e9eb'), rail: A('#e6e9eb'), towers: masts(1), lines: hungStays(2, 1), lamp: lampM, lampEvery: 14 },
    { name: 'Waterloo Bridge', r: T(1276), w: 20, h: 11, th: 2.5, pw: 7, piers: [42, 84, 126, 168], arch: 18, top: road, walk, mark: markM, side: A('#dcdad3'), pier: A('#b9b6ae'), rail: A('#a9a69f'), lamp: lampM, lampEvery: 24 },
    { name: 'Blackfriars Bridge', r: T(2067), w: 22, h: 10, th: 3, pw: 7, piers: [36, 72, 108, 144], arch: 16, top: road, walk, mark: markM, side: A('#b8433a'), pier: A('#cfc6b4'), rail: A('#e8e4dc'), lamp: lampM, lampEvery: 20 },
    ...oldPiers,
    { name: 'Blackfriars Railway Bridge', r: T(2129), w: 24, h: 10, th: 3, pw: 6, piers: [36, 72, 108, 144], arch: 14, top: A('#4b4d55'), side: A('#3d4d6a'), pier: A('#7a756c'), rail: A('#2f3646'),
      lines: [-11, 11].flatMap(lat => [{ m: A('#8fa3b5', KN, '#ffe6b0', 0.4), pts: [[0, 21, lat], [300, 21, lat]] }, { m: A('#c9d6df'), pts: [[0, 22, lat], [300, 22, lat]] }].concat([20, 50, 80, 110, 140, 170, 200, 230].map(z => ({ m: A('#2f3646'), pts: [[z, 10, lat], [z, 22, lat]] })))) },
    { name: 'the Millennium Bridge', r: T(AX), w: 4, h: 9, th: 1, pw: 2, piers: [70, 150], top: A('#b8bec4'), side: A('#d3d8dc'), pier: A('#8e9499'), rail: A('#e9edf0'), towers: [{ z: 70, spr: 4, base: 0 }, { z: 150, spr: 4, base: 0 }],
      lines: [-3, 3].flatMap(lat => [hangLine(0, 9, 70, 9, 1.5, lat, 8), hangLine(70, 9, 150, 9, 2, lat, 8), hangLine(150, 9, 300, 9, 3, lat, 10)].map(p => ({ m: A('#9aa3ab'), pts: p }))) },
    { name: 'Southwark Bridge', r: T(2624), w: 17, h: 10, th: 3, pw: 8, piers: [70, 140], arch: 30, top: road, walk, mark: markM, side: A('#4d7f62'), pier: A('#a9a596'), rail: A('#d9b23c'), lamp: lampM, lampEvery: 22 },
    { name: 'the Cannon Street railway bridge', r: T(2856), w: 26, h: 9, th: 4, pw: 6, piers: [45, 90, 135, 180], top: A('#4b4d55'), side: A('#6a4a40'), pier: A('#bdb8ac'), rail: A('#3e3a37') },
    { name: 'London Bridge', r: T(3029), w: 26, h: 11, th: 3, pw: 9, piers: [70, 140], arch: 40, top: road, walk, mark: markM, side: A('#c7c4bc'), pier: A('#a8a59d'), rail: A('#5c5f66'), lamp: lampM, lampEvery: 26 },
    { name: 'Tower Bridge', r: T(3851), w: 14, h: 8, th: 2, top: road, walk, mark: markM, side: tbBlue, rail: tbBlueL, lamp: lampM, lampEvery: 16,
      towers: [{ z: 6, spr: 1, base: 0, s: 0.85 }, { z: 55, spr: 0, base: 0, s: 1.15 }, { z: 125, spr: 0, base: 0, s: 1.15 }, { z: 205, spr: 1, base: 0, s: 0.75 }], lines: tbLines },
  ];
  landmarks.push({ L: 'bank', x: bx(465), name: 'Westminster Bridge' }, { L: 'bank', x: bx(939), name: 'Hungerford Bridge' }, { L: 'bank', x: bx(1276), name: 'Waterloo Bridge' },
    { L: 'bank', x: bx(2067), name: 'Blackfriars Bridge' }, { L: 'bank', x: bx(2600), name: 'Southwark Bridge' }, { L: 'bank', x: bx(3029), name: 'London Bridge' }, { L: 'bank', x: bx(3851), name: 'Tower Bridge' });

  /* boats, and the red bus on the Embankment */
  const bm = {
    r: A('#c9433a'), R: A('#a8352e'), w: A('#efeae0'), k: A('#2d2b31'), K: A('#1e1d22'), W: A('#3b4656', KW, '#ffd27a', 0.5),
    L: A('#e9e2c8', KN, '#ffef9a', 0.9), b: A('#24406b'), B: A('#3e66a0'), s: A('#a5523a'), S: A('#8a4330'), m: A('#5a4535'), n: A('#4a3a30'), y: A('#e0b23c'), g: A('#6f6a62'),
  };
  const clipper = ['......wwwwwwwwwwwwwwwww.......', '....wwWWwWWwWWwWWwWWwWWww.....', '..bbbbbbbbbbbbbbbbbbbbbbbbbbbL', '.bBBBBBBBBBBBBBBBBBBBBBBBBBBBb.', '..kkkk..................kkkk..'];
  const tour = ['...wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.....', '..wWWwWWwWWwWWwWWwWWwWWwWWwWWwWWww....', '.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.', 'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwL', '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.', '..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..'];
  const tow = [
    '...............................................kk......',
    '...............................................rr......',
    '.............................................wwwwww....',
    '.............................................wWwWww....',
    '..........................................wwwwwwwwwww..',
    'ggggggggggggggggg.ggggggggggggggggg.......wWwwWwwwwww.L',
    'nnnnnnnnnnnnnnnnnknnnnnnnnnnnnnnnnnkkkkkkkrrrrrrrrrrrrr',
    '.kkkkkkkkkkkkkkk...kkkkkkkkkkkkkkk.......kkkkkkkkkkkkk.',
  ];
  const bus = ['.rrrrrrrrrrr', 'rWWrWWrWWrWr', 'rrrrrrrrrrrr', 'rWWrWWrWWrrW', 'rrrrrrrrrrrr', '.kk......kk.'];
  const boats = [
    { frames: [rasterFromRows(clipper, bm)], speed: 22, depth: 0.7, name: 'Thames Clipper' },
    { frames: [rasterFromRows(tour, bm)], speed: 8, depth: 0.45, name: 'sightseeing boat' },
    { frames: [rasterFromRows(tow, bm)], speed: 5, depth: 0.25, name: 'tug and barges' },
  ];
  const vehicle = { L: 'bank', x0: bx(482), x1: bx(2050), y: B - 13, sprite: rasterFromRows(bus, bm), speed: 14, idle: 6 };
  return {
    id: 'london', name: 'London', meta: '51.51° N · 0.10° W', river: 'River Thames',
    M, layers: [LF, LC, LO, LM, LN, LT, BK, SH], crossings, sprites, camD: 360, J0: 40, cloudAfter: 0,
    hero: { r: T(330), p: LT.p }, dyn, landmarks, boats, vehicle,
  };
}
