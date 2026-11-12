/* =====================================================================
   The plane and its crew as a low-poly model for the Front, Rear and 3D
   views. It is measured in the same units as the side-view sprite
   (x forward, y up, z to the plane's right) and shares its colours,
   so the two versions are plainly the same aircraft and the same ducks.
   ===================================================================== */
const MODEL_SCALE = 0.4;

function buildPlane3() {
  const B = new Mesh3();
  /* fuselage: a loft through stations of [x, bottom, top, half width] */
  const ST = [[49, -5, 2.5, 4.6], [46, -9, 7, 7.6], [40, -12, 9.5, 9.2], [34, -12.5, 10, 9.6], [12, -13, 10, 9.6], [-20, -10, 10, 8.6], [-48, -4, 9.2, 5.2], [-67, 1, 6, 2.2]];
  const ring = s => {
    const x = s[0], yb = s[1], yt = s[2], hw = s[3], c = Math.min(hw * 0.42, (yt - yb) * 0.25);
    const s0 = clamp(-0.5, yb + c, yt - c), s1 = clamp(4.5, yb + c, yt - c);
    return [[x, yb, hw - c], [x, yb + c, hw], [x, s0, hw], [x, s1, hw], [x, yt - c, hw], [x, yt, hw - c]];
  };
  const flip = p => [p[0], p[1], -p[2]];
  for (let i = 0; i + 1 < ST.length; i++) {
    const A = ring(ST[i]), Bq = ring(ST[i + 1]), nose = ST[i + 1][0] >= 34;
    const cols = nose ? [PC.coralD, PC.coral, PC.coral, PC.coral, PC.coralL] : [PC.creamD, PC.cream, PC.coral, PC.cream, PC.creamL];
    B.quad(A[0], flip(A[0]), flip(Bq[0]), Bq[0], nose ? PC.coralD : PC.creamD);
    B.quad(A[5], Bq[5], flip(Bq[5]), flip(A[5]), nose ? PC.coralL : PC.creamL);
    for (let k = 0; k < 5; k++) {
      B.quad(A[k], Bq[k], Bq[k + 1], A[k + 1], cols[k]);
      B.quad(flip(A[k]), flip(A[k + 1]), flip(Bq[k + 1]), flip(Bq[k]), cols[k]);
    }
  }
  for (const end of [0, ST.length - 1]) {
    const R = ring(ST[end]), all = R.concat(R.map(flip).reverse()), cy = (ST[end][1] + ST[end][2]) / 2;
    for (let i = 0; i < all.length; i++) B.tri([ST[end][0], cy, 0], all[i], all[(i + 1) % all.length], end ? PC.creamD : PC.coralD);
  }
  // cowling rings and the spinner
  for (const x of [38, 41, 44]) B.box(x, -11.5, -9.4, x + 0.8, 9, 9.4, PC.coralD);
  B.push().move(49, -1, 0).rz(-Math.PI / 2).cyl(0, 0, 0, 4.4, 7.5, 0.9, 8, PC.coral).pop();
  B.box(40, -13.6, -2, 45, -12, 2, PC.metalD);
  // the name on both sides of the stripe
  B.push().move(-1.5, -9.2, 9.78).text('WUHUA', NAME_FONT, 1.6, PC.coralD).pop();
  B.push().move(32.1, -9.2, -9.78).ry(Math.PI).text('WUHUA', NAME_FONT, 1.6, PC.coralD).pop();
  // cockpits: a dark well, a wooden rim and a little windscreen for each seat
  for (const sx of SEATS) {
    B.quad([sx - 9, 10.06, -6.4], [sx + 9, 10.06, -6.4], [sx + 9, 10.06, 6.4], [sx - 9, 10.06, 6.4], '#3a2420');
    B.box(sx - 10, 10, -7.6, sx + 10, 11.7, -6.4, PC.rim, 0, PC.rimL); B.box(sx - 10, 10, 6.4, sx + 10, 11.7, 7.6, PC.rim, 0, PC.rimL);
    B.box(sx - 10, 10, -6.4, sx - 8.8, 11.7, 6.4, PC.rim, 0, PC.rimL); B.box(sx + 8.8, 10, -6.4, sx + 10, 11.7, 6.4, PC.rim, 0, PC.rimL);
    B.quad([sx + 11.4, 11.7, -5.6], [sx + 11.4, 11.7, 5.6], [sx + 10.2, 18, 5], [sx + 10.2, 18, -5], '#cfefff', MT.glass);
    B.beam([sx + 11.4, 11.7, -5.8], [sx + 10.2, 18.2, -5.2], 0.7, PC.glassFrame); B.beam([sx + 11.4, 11.7, 5.8], [sx + 10.2, 18.2, 5.2], 0.7, PC.glassFrame);
    B.beam([sx + 10.2, 18.2, -5.2], [sx + 10.2, 18.2, 5.2], 0.7, PC.glassFrame);
  }
  // low wings with a little dihedral, cream tip bands and the name on top
  const DIH = 0.095;
  for (const s of [1, -1]) {
    const P = (x, yo, zs) => [x, -9.6 + zs * Math.tan(DIH) + yo, s * (9 + zs)];
    const r0 = [-13, 26, 1.7], r1 = [-4, 19, 1.0], SP = 49;
    B.quad(P(r0[0], r0[2], 0), P(r0[1], r0[2], 0), P(r1[1], r1[2], SP), P(r1[0], r1[2], SP), PC.coral);
    B.quad(P(r0[0], -r0[2], 0), P(r1[0], -r1[2], SP), P(r1[1], -r1[2], SP), P(r0[1], -r0[2], 0), PC.coralD);
    B.quad(P(r0[1], r0[2], 0), P(r0[1], -r0[2], 0), P(r1[1], -r1[2], SP), P(r1[1], r1[2], SP), PC.coralL);
    B.quad(P(r0[0], -r0[2], 0), P(r0[0], r0[2], 0), P(r1[0], r1[2], SP), P(r1[0], -r1[2], SP), PC.coralD);
    B.quad(P(r1[0], r1[2], SP), P(r1[1], r1[2], SP), P(r1[1], -r1[2], SP), P(r1[0], -r1[2], SP), PC.cream);
    const band = (z0, z1) => { const a = z0 / SP, b = z1 / SP, e = 0.12; B.quad(P(lerp(r0[0], r1[0], a), lerp(r0[2], r1[2], a) + e, z0), P(lerp(r0[1], r1[1], a), lerp(r0[2], r1[2], a) + e, z0), P(lerp(r0[1], r1[1], b), lerp(r0[2], r1[2], b) + e, z1), P(lerp(r0[0], r1[0], b), lerp(r0[2], r1[2], b) + e, z1), PC.cream); };
    const z0 = s > 0 ? 3 : 41, tp = P(-1, lerp(r0[2], r1[2], 0.45) + 0.3, z0);
    B.push().move(tp[0], tp[1], tp[2]).rx(-s * DIH).ry(-Math.PI / 2).rx(-Math.PI / 2).text('WUHUA', NAME_FONT, 1.8, PC.creamL).pop();
    band(41, 46);
  }
  // tail: fin with a cream band and the duck emblem, then the stabiliser
  B.extrude([-44, 9, -55, 29, -58, 31, -64, 31, -67, 27, -67, 5, -56, 8], -1.2, 1.2, PC.coral, 0, PC.coralD);
  for (const s of [1, -1]) {
    B.quad([-65.6, 17, s * 1.32], [-50.5, 17, s * 1.32], [-52.1, 20, s * 1.32], [-65.6, 20, s * 1.32], PC.cream);
    B.box(-60, 22.5, s * 1.25, -55.4, 26.6, s * 1.5, '#ffd34d'); B.box(-55.4, 23.4, s * 1.25, -53.4, 24.8, s * 1.5, PC.bill);
    B.box(s > 0 ? -57.4 : -57.4, 25, s * 1.45, -56.4, 26, s * 1.6, PC.ink);
    const T = (x, zs) => [x, 3.2, s * (2 + zs)];
    const up = p => [p[0], p[1] + 1.3, p[2]];
    const a = T(-50, 0), b = T(-64, 0), c = T(-73, 22), d = T(-61, 22);
    B.quad(up(a), up(b), up(c), up(d), PC.coral); B.quad(a, d, c, b, PC.coralD);
    B.quad(a, up(a), up(d), d, PC.coralL); B.quad(b, c, up(c), up(b), PC.coralD); B.quad(d, up(d), up(c), c, PC.cream);
  }
  // landing gear with spats, and a tail wheel
  for (const s of [1, -1]) {
    B.beam([9, -11, s * 13], [10, -24, s * 17], 1.7, PC.metalD); B.beam([15, -11, s * 13], [11, -24, s * 17], 1.4, PC.metal);
    B.push().move(10, -28, s * 17).rx(Math.PI / 2).cyl(0, 0, -1.8, 5, 1.8, 5, 10, PC.tire).cyl(0, 0, -2.2, 2, 2.2, 2, 6, PC.hub).pop();
    B.taper(10, s * 17, -27.5, 15, 5.4, -21.5, 9, 4.2, PC.coral, 0, 0, 0, PC.coralL);
  }
  B.push().move(-60, -3.4, 0).rx(Math.PI / 2).cyl(0, 0, -0.9, 1.9, 0.9, 1.9, 6, PC.tire).pop();
  B.beam([-58, 1, 0], [-60, -3, 0], 1, PC.metalD);
  // the crew's bodies, tucked into their seats
  for (const d of DUCKS) {
    const k = d.r / 7;
    B.block(d.seat - 1, 0, 15 * k, 11.5 * k, 6, 15.6, d.body, 0, d.bodyL);
    B.block(d.seat - 2.5, 0, 9 * k, 12.6 * k, 9, 14.2, d.bodyD);
    B.block(d.seat + 0.5, 0, 6.4, 6.4, 14, 19, d.body);
    B.block(d.seat + 0.5, 0, 8.8, 8.8, 16.2, 18.8, d.scarf[0]); B.block(d.seat - 3.4, 0, 2.6, 3.4, 15.6, 18.6, d.scarf[1]);
  }
  return B;
}

/* A duck's head, centred on the origin and facing +x. closed: the blink / smile variant. */
function buildHead3(d, closed) {
  const B = new Mesh3(), r = d.r;
  B.box(-r, -r + 2.2, -r + 1.6, r, r - 2.2, r - 1.6, d.body);
  B.box(-r + 1.6, -r + 0.4, -r + 1.6, r - 1.6, r - 0.4, r - 1.6, d.body, 0, d.bodyL);
  B.box(-r + 1.6, -r + 2.2, -r, r - 1.6, r - 2.2, r, d.body);
  B.box(-r + 0.7, -r + 1.2, -r + 0.7, r - 0.7, r - 1.2, r - 0.7, d.body);
  B.box(-r + 1.2, -r - 0.2, -r + 2.4, r - 2.4, -r + 1, r - 2.4, d.bodyD);
  // upper bill
  B.box(r - 1.2, -2.3, -3.3, r + 4.6, 0.2, 3.3, PC.bill, 0, PC.billL);
  B.box(r + 4.6, -1.9, -2.7, r + 5.7, -0.1, 2.7, PC.billL);
  B.box(r + 2.6, 0.2, -1.6, r + 3.4, 0.5, -0.9, PC.billD); B.box(r + 2.6, 0.2, 0.9, r + 3.4, 0.5, 1.6, PC.billD);
  for (const s of [1, -1]) {
    const z0 = s * (r - 0.35), z1 = s * (r + 0.4), ey0 = closed ? 0.9 : -0.4, ey1 = closed ? 1.8 : 3.1;
    if (d.cap) {
      // goggles: brass frames, pale lenses, strap
      B.box(r - 6.3, -1.7, z0, r - 1.3, 4.4, s * (r + 0.25), PC.brass);
      B.box(r - 5.6, -1, s * (r + 0.2), r - 2, 3.7, s * (r + 0.55), '#dff8f6', MT.glass);
      B.box(r - 4.6, ey0 + 0.3, s * (r + 0.5), r - 3, ey1 - 0.3, s * (r + 0.78), PC.ink);
      B.box(r - 0.3, -1.7, s * 1.6, r + 0.35, 4.4, s * (r - 1.7), PC.brass);
      B.box(r + 0.3, -1, s * 2.2, r + 0.6, 3.7, s * (r - 2.3), '#dff8f6', MT.glass);
      B.box(r + 0.55, ey0 + 0.3, s * 3.1, r + 0.8, ey1 - 0.3, s * 4.5, PC.ink);
      B.box(-r - 0.3, 0.6, z0, r - 6.3, 2.2, s * (r + 0.2), PC.capD);
      B.box(-2.6, -3.6, s * (r - 0.3), 1.4, 1.4, s * (r + 0.7), PC.cap);
    } else {
      B.box(r - 4.9, ey0, z0, r - 2.5, ey1, z1, PC.ink);
      B.box(r - 0.4, ey0, s * 3.5, r + 0.3, ey1, s * 5.2, PC.ink);
      if (!closed) { B.box(r - 4.9, 2.1, s * (r + 0.35), r - 3.9, 3.1, s * (r + 0.5), PC.white); B.box(r + 0.25, 2.1, s * 3.5, r + 0.4, 3.1, s * 4.3, PC.white); }
      B.box(r - 6.2, -3.4, s * (r - 0.3), r - 3.6, -2.2, s * (r + 0.22), PC.blush);
    }
  }
  if (d.cap) {
    B.box(-r - 0.5, 1.7, -r + 1.1, r + 0.3, r - 1.7, r - 1.1, PC.cap);
    B.box(-r + 1.1, 1.7, -r - 0.5, r - 1.3, r - 1.7, r + 0.5, PC.cap);
    B.box(-r + 1.2, r - 2.2, -r + 1.2, r - 1.3, r + 0.35, r - 1.2, PC.cap, 0, PC.capL);
    B.box(r - 1.4, 3.4, -4, r + 1.6, 4.5, 4, PC.capD);
  }
  if (d.tuft) { B.box(-1, r - 0.6, -0.7, 0.4, r + 2.3, 0.7, d.body); B.box(-2.5, r + 1.5, -0.7, -0.8, r + 3.1, 0.7, d.body); B.box(0.2, r + 1.7, -0.6, 1.3, r + 2.9, 0.6, d.bodyL); }
  return B;
}

/* the two-blade propeller, spinning about x, with a stippled blur disc */
function buildProp3() {
  const B = new Mesh3();
  B.box(-0.9, -19, -1.7, 0.9, 19, 1.7, PC.wood); B.box(0.9, -19, -1.7, 1.3, 19, -0.6, PC.woodL);
  B.box(-0.9, 19, -1.7, 0.9, 22.5, 1.7, PC.tip); B.box(-0.9, -22.5, -1.7, 0.9, -19, 1.7, PC.tip);
  return B;
}
function buildDisc3() {
  const B = new Mesh3(), n = 14;
  for (let i = 0; i < n; i++) {
    const a0 = i * TAU / n, a1 = (i + 1) * TAU / n;
    B.tri([0, 0, 0], [0, Math.cos(a0) * 22.5, Math.sin(a0) * 22.5], [0, Math.cos(a1) * 22.5, Math.sin(a1) * 22.5], '#f6ecd8', MT.stipple);
  }
  return B;
}
function buildCamera3(d) {
  const B = new Mesh3(), r = d.r;
  B.box(r + 5.8, -3.2, -3.4, r + 9.4, 1.6, 3.4, '#3a3a44'); B.box(r + 6.4, 1.6, -1.6, r + 8.4, 2.5, 0.4, '#3a3a44');
  B.box(r + 9.4, -2.4, -1.9, r + 10.4, 0.8, 1.9, '#9fd3ff', MT.lamp); B.box(r + 9.4, 0.6, 2.2, r + 9.9, 1.4, 3, '#ffe08a', MT.lamp);
  return B;
}
function buildCube3(mat) { return new Mesh3().box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, '#ffffff', mat); }

/* voxel clouds: flat-bottomed clusters of boxes, shaded top to bottom */
function buildCloud3(seed) {
  const B = new Mesh3(), r = mulberry32(seed), n = 4 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n - 0.5, w = rf(r, 16, 30), h = (0.45 + 0.55 * Math.cos(u * Math.PI)) * rf(r, 11, 18), d = rf(r, 14, 24);
    const cx = u * 62 + rf(r, -4, 4), cz = rf(r, -7, 7);
    B.box(cx - w / 2, 0, cz - d / 2, cx + w / 2, h, cz + d / 2, [222, 222, 222], MT.cloud, [255, 255, 255]);
    B.box(cx - w / 2 + 2, -2.2, cz - d / 2 + 2, cx + w / 2 - 2, 0, cz + d / 2 - 2, [186, 186, 186], MT.cloud);
  }
  return B;
}
