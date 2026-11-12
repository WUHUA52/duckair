/* =====================================================================
   The plane and its ducks. Drawn each frame into a small art-resolution
   buffer, outlined and lit, then placed on the scene with rotation.
   ===================================================================== */
const PB_W = 160, PB_H = 112, PB_OX = 82, PB_OY = 62;
const SEATS = [20, -6, -32];
const PC = {
  cream: '#f6e8cb', creamL: '#fff7e6', creamD: '#e1c79a', creamDD: '#c6a679',
  coral: '#ea5c43', coralL: '#ff8b69', coralD: '#b8452f', coralDD: '#8e3324',
  metal: '#8b8890', metalD: '#5d5a63', ink: '#2b1d1b',
  rim: '#6f4130', rimL: '#9b6246',
  glass: 'rgba(206,240,255,0.5)', glassHi: 'rgba(255,255,255,0.85)', glassFrame: '#6a4b3f',
  wood: '#8a5a3a', woodL: '#b57f52', tip: '#ffd54a',
  tire: '#2f2a31', hub: '#d8cfc0',
  bill: '#ff9d2e', billD: '#e2761b', billL: '#ffc163', blush: '#ff8fa0', white: '#ffffff',
  cap: '#7b4a2e', capL: '#9c6440', capD: '#5b3420', brass: '#d39a3c', lens: 'rgba(170,236,232,0.72)',
};
const OUTLINE = '#3e2622';

let PX = null; // context the pixel helpers draw into
const _xs = new Float64Array(16);
function fr(x, y, w, h, c) { PX.fillStyle = c; PX.fillRect(PB_OX + Math.round(x), PB_OY + Math.round(y), w, h); }
function fell(cx, cy, rx, ry, c, maxY) {
  PX.fillStyle = c;
  const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
  for (let y = y0; y <= y1; y++) {
    if (maxY !== undefined && y > maxY) break;
    const dy = (y + 0.5 - cy) / ry;
    if (dy <= -1 || dy >= 1) continue;
    const hw = rx * Math.sqrt(1 - dy * dy);
    const xa = Math.round(cx - hw), xb = Math.round(cx + hw);
    if (xb > xa) PX.fillRect(PB_OX + xa, PB_OY + y, xb - xa, 1);
  }
}
function fpoly(pts, c) {
  PX.fillStyle = c;
  const n = pts.length >> 1;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) { const y = pts[2 * i + 1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const sy = y + 0.5; let k = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const yi = pts[2 * i + 1], yj = pts[2 * j + 1];
      if ((yi > sy) !== (yj > sy)) _xs[k++] = pts[2 * i] + (sy - yi) * (pts[2 * j] - pts[2 * i]) / (yj - yi);
    }
    for (let a = 1; a < k; a++) { const v = _xs[a]; let b = a - 1; while (b >= 0 && _xs[b] > v) { _xs[b + 1] = _xs[b]; b--; } _xs[b + 1] = v; }
    for (let a = 0; a + 1 < k; a += 2) { const xa = Math.round(_xs[a]), xb = Math.round(_xs[a + 1]); if (xb > xa) PX.fillRect(PB_OX + xa, PB_OY + y, xb - xa, 1); }
  }
}
function fline(x0, y0, x1, y1, c) {
  PX.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let g = 0; g < 200; g++) {
    PX.fillRect(PB_OX + x0, PB_OY + y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/* ---------- static parts, drawn once ---------- */
function buildPlaneFront() {
  const c = makeCanvas(PB_W, PB_H);
  PX = c.ctx;
  // tail fin with a duck emblem
  fpoly([-44, -9, -55, -29, -58, -31, -64, -31, -67, -27, -67, -5, -56, -8], PC.coral);
  fpoly([-62, -30, -64, -30, -66, -27, -66, -7, -62, -7], PC.coralD);
  fr(-62, -29, 1, 22, PC.coralDD);
  fr(-65, -19, 16, 3, PC.cream); fr(-65, -19, 16, 1, PC.creamL);
  fell(-57.5, -24.5, 2.6, 2.2, '#ffd34d'); fr(-55, -24, 2, 1, PC.bill); fr(-58, -25, 1, 1, PC.ink);
  // fuselage
  fpoly([-67, -6, -56, -8, -44, -10, 34, -10, 42, -9, 47, -6, 49, -2, 49, 5, 46, 9, 40, 12, 12, 13, -20, 10, -48, 4, -67, -1], PC.cream);
  fpoly([-44, -10, 34, -10, 34, -8, -44, -8], PC.creamL);
  fpoly([-67, -1, -48, 4, -20, 10, 12, 13, 40, 12, 36, 10, 12, 10, -20, 7, -48, 1, -67, -3], PC.creamD);
  fpoly([36, -4, -20, -5, -50, -6, -66, -5, -66, -3, -50, -3, -20, -1, 36, 0], PC.coral);
  fpoly([36, -4, -20, -5, -50, -6, -66, -5, -66, -4.6, -50, -5.2, -20, -4.2, 36, -3.2], PC.coralL);
  // cowling
  fpoly([34, -10, 42, -9, 47, -6, 49, -2, 49, 5, 46, 9, 40, 12, 34, 12], PC.coral);
  fpoly([34, 6, 49, 5, 46, 9, 40, 12, 34, 12], PC.coralD);
  fr(35, -9, 9, 1, PC.coralL);
  fr(38, -7, 1, 14, PC.coralD); fr(41, -7, 1, 14, PC.coralD); fr(44, -6, 1, 12, PC.coralD);
  fr(40, 10, 5, 2, PC.metalD); fr(44, 10, 1, 1, PC.ink);
  // panel lines and rivets
  fr(-26, -7, 1, 16, PC.creamD); fr(31, -8, 1, 20, PC.creamD); fr(-50, -6, 1, 9, PC.creamD);
  for (let x = -40; x < 30; x += 5) PX.fillStyle = PC.creamDD, PX.fillRect(PB_OX + x, PB_OY + 6 + Math.round((x + 40) * 0.05), 1, 1);
  // cockpit rims
  for (const sx of SEATS) {
    fr(sx - 9, -12, 19, 2, PC.rim); fr(sx - 9, -12, 19, 1, PC.rimL);
    fr(sx - 10, -11, 1, 1, PC.rim); fr(sx + 10, -11, 1, 1, PC.rim);
    fr(sx + 9, -19, 4, 1, PC.glassFrame);
  }
  // horizontal stabilizer, near side
  fpoly([-50, -3, -64, -3, -73, 2, -60, 2], PC.coral); fr(-72, 1, 12, 1, PC.coralD); fr(-62, -3, 10, 1, PC.coralL);
  // landing gear
  fline(8, 13, 6, 24, PC.metalD); fline(16, 13, 14, 24, PC.metalD); fline(9, 13, 7, 24, PC.metal);
  fell(10, 28, 5, 5, PC.tire); fell(10, 28, 2, 2, PC.hub);
  fell(10, 24.5, 7, 4.2, PC.coral); fr(4, 23, 12, 1, PC.coralL); fr(5, 27, 10, 1, PC.coralD);
  fell(-60, 3, 1.6, 1.6, PC.tire);
  // low wing, near side
  fpoly([-12, 6, 24, 5, 31, 13, 27, 17, -6, 19, -14, 12], PC.coral);
  fpoly([-12, 6, 24, 5, 26.5, 8.5, -12.5, 9.5], PC.coralL);
  fpoly([-14, 12, -6, 19, 27, 17, 25.5, 15, -5, 16.5], PC.coralD);
  paintName('WUHUA', -2, 10);
  return c;
}
/* the plane's name, painted on the wing in a tiny pixel font */
const NAME_FONT = {
  W: ['#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'], A: ['.#.', '#.#', '###', '#.#', '#.#'],
};
function paintName(text, x0, y0) {
  for (const pass of [0, 1]) {
    let x = x0;
    for (const ch of text) {
      const g = NAME_FONT[ch];
      if (!g) { x += 4; continue; }
      for (let y = 0; y < g.length; y++) for (let i = 0; i < g[y].length; i++) {
        if (g[y][i] === '#') fr(x + i + (pass ? 0 : 1), y0 + y + (pass ? 0 : 1), 1, 1, pass ? PC.creamL : PC.coralDD);
      }
      x += g[0].length + 1;
    }
  }
}
const GLASS_POLYS = SEATS.map(sx => [sx + 8, -12, sx + 12.5, -12, sx + 12.5, -18, sx + 9.5, -18]);
const SPINNER_POLY = [49, -4, 53, -3, 56, 0, 56, 1.5, 53, 4.5, 49, 5.5];
function drawGlass() {
  for (let i = 0; i < SEATS.length; i++) {
    fpoly(GLASS_POLYS[i], PC.glass);
    fr(SEATS[i] + 10, -17, 1, 4, PC.glassHi);
  }
}
function drawSpinner() {
  fpoly(SPINNER_POLY, PC.coral);
  fr(50, -3, 3, 1, PC.coralL); fr(50, 4, 4, 1, PC.coralD); fr(55, 0, 1, 1, PC.coralL);
}
function propBlade(len, w) {
  if (Math.abs(len) < 1) return;
  const a = Math.min(0.5, 0.5 + len), b = Math.max(0.5, 0.5 + len);
  fr(50, Math.round(a), w, Math.round(b - a), PC.wood);
  fr(50, Math.round(a), 1, Math.round(b - a), PC.woodL);
  const tipLen = Math.min(3, Math.round(Math.abs(len)));
  if (len < 0) fr(50, Math.round(a), w, tipLen, PC.tip); else fr(50, Math.round(b) - tipLen, w, tipLen, PC.tip);
}
function drawProp(angle, blur) {
  const c = Math.cos(angle), L = 22;
  const w = 2 + Math.round(Math.abs(Math.sin(angle)) * 1.4);
  propBlade(-c * L, w); propBlade(c * L, w);
  if (blur > 0.01) { PX.globalAlpha = blur; fell(51.5, 0.5, 1.6, 23, '#f3e7cf'); PX.globalAlpha = 1; }
}

/* ---------- ducks ---------- */
const DUCKS = [
  { id: 'pilot', name: 'Captain', seat: SEATS[0], hy: -24, r: 7, ry: 6.5, body: '#ffd24a', bodyD: '#e7a52b', bodyL: '#fff1a6', scarf: ['#e8443a', '#b8302b'], seg: 8, cap: true, voice: 0.86 },
  { id: 'white', name: 'Pip', seat: SEATS[1], hy: -24, r: 7, ry: 6.5, body: '#f8f6ef', bodyD: '#d4cdbf', bodyL: '#ffffff', scarf: ['#3b8fe0', '#e9f4ff'], seg: 7, voice: 1.05, camera: true },
  { id: 'duckling', name: 'Dot', seat: SEATS[2], hy: -22, r: 6, ry: 5.5, body: '#ffe766', bodyD: '#efbd35', bodyL: '#fffac8', scarf: ['#4fc488', '#2f9a62'], seg: 6, tuft: true, voice: 1.55 },
];
const SEG_LEN = 2.1;
DUCKS.forEach((d, i) => {
  Object.assign(d, {
    look: 1, lookTarget: 1, gaze: 0, gazeTarget: 0, nextLook: 1 + i * 1.3, blink: 0, nextBlink: 1.2 + i * 0.9,
    bob: 0, bobV: 0, lean: 0, wave: 0, quack: 0, quackQueue: [], photo: 0, phase: i * 1.7, happy: 0,
    sx: new Float32Array(d.seg), sy: new Float32Array(d.seg), spx: new Float32Array(d.seg), spy: new Float32Array(d.seg), scarfInit: false,
  });
});


function updateDuck(d, dt, env) {
  const R = env.rng;
  // where to look
  d.nextLook -= dt;
  if (d.wave > 0 || d.photo > 0) { d.lookTarget = d.photo > 0 ? 0.9 : 0; d.gazeTarget = d.photo > 0 ? 1 : 0; }
  else if (env.attention > 0 && d.id !== 'pilot') { d.lookTarget = env.attentionDir; d.gazeTarget = env.attentionGaze; }
  else if (d.nextLook <= 0) {
    const u = R();
    if (d.id === 'pilot') {
      if (u < 0.72) { d.lookTarget = 1; d.gazeTarget = 0; } else if (u < 0.86) { d.lookTarget = 0; d.gazeTarget = 0; } else if (u < 0.96) { d.lookTarget = 0.85; d.gazeTarget = 1; } else { d.lookTarget = -1; d.gazeTarget = 0; }
      d.nextLook = rf(R, 2.5, 6.5);
    } else {
      if (u < 0.3) { d.lookTarget = 1; d.gazeTarget = 0; }
      else if (u < 0.55) { d.lookTarget = rf(R, -0.15, 0.15); d.gazeTarget = 0; }
      else if (u < 0.78) { d.lookTarget = env.landmarkDir || (R() < 0.5 ? 0.85 : -0.85); d.gazeTarget = 1; }
      else if (u < 0.9) { d.lookTarget = -1; d.gazeTarget = 0; }
      else { d.lookTarget = 0.4; d.gazeTarget = -1; }
      d.nextLook = rf(R, 1.8, 5);
    }
  }
  d.look = approach(d.look, d.lookTarget, 6.5, dt);
  d.gaze = approach(d.gaze, d.gazeTarget, 7, dt);
  // blinking
  d.nextBlink -= dt;
  if (d.nextBlink <= 0) { d.blink = 0.14; d.nextBlink = R() < 0.22 ? 0.3 : rf(R, 2.4, 6.2); }
  if (d.blink > 0) d.blink -= dt;
  // head bob: a damped spring pushed by the plane's vertical acceleration
  const acc = -40 * d.bob - 7 * d.bobV - env.ay * 0.018 + Math.sin(env.t * 2.2 + d.phase) * 2.4 * env.inten;
  d.bobV += acc * dt; d.bob += d.bobV * dt;
  if (d.bob > 3) { d.bob = 3; d.bobV *= -0.3; } else if (d.bob < -3.5) { d.bob = -3.5; d.bobV *= -0.3; }
  d.lean = approach(d.lean, clamp(-env.ax * 0.012, -1.4, 1.4), 4, dt);
  if (d.wave > 0) d.wave -= dt;
  if (d.happy > 0) d.happy -= dt;
  if (d.photo > 0) {
    const before = d.photo;
    d.photo -= dt;
    if (before > 0.75 && d.photo <= 0.75 && env.onPhoto) env.onPhoto(d);
  }
  if (d.quack > 0) d.quack -= dt;
  for (let i = d.quackQueue.length - 1; i >= 0; i--) {
    d.quackQueue[i] -= dt;
    if (d.quackQueue[i] <= 0) { d.quackQueue.splice(i, 1); d.quack = 0.2; if (env.onQuack) env.onQuack(d); }
  }
  updateScarf(d, dt, env);
}

function updateScarf(d, dt, env) {
  const ax = d.seat + Math.round(d.lean) - 3, ay = d.hy + Math.round(d.bob) + 6;
  const n = d.seg, X = d.sx, Y = d.sy, PXs = d.spx, PYs = d.spy;
  if (!d.scarfInit) {
    for (let i = 0; i < n; i++) { X[i] = PXs[i] = ax - i * SEG_LEN; Y[i] = PYs[i] = ay + i * 0.3; }
    d.scarfInit = true;
  }
  X[0] = ax; Y[0] = ay;
  const wind = 260 + 300 * env.speed;
  const dt2 = dt * dt;
  for (let i = 1; i < n; i++) {
    const vx = (X[i] - PXs[i]) * 0.9, vy = (Y[i] - PYs[i]) * 0.9;
    PXs[i] = X[i]; PYs[i] = Y[i];
    const f = i / n;
    const flutter = Math.sin(env.t * (11 + 6 * env.speed) - i * 1.25 + d.phase) * (90 + 120 * env.speed) * f
      + vnoise(env.t * 3.1 + i * 0.7 + d.phase * 5) * 70 * f;
    X[i] += vx + (-wind - env.ax * 0.5) * dt2;
    Y[i] += vy + (24 + flutter - env.ay * 0.5) * dt2;
  }
  for (let it = 0; it < 3; it++) for (let i = 1; i < n; i++) {
    const dx = X[i] - X[i - 1], dy = Y[i] - Y[i - 1];
    const dist = Math.hypot(dx, dy) || 0.0001, k = SEG_LEN / dist;
    X[i] = X[i - 1] + dx * k; Y[i] = Y[i - 1] + dy * k;
  }
}

function drawScarf(d) {
  const n = d.seg, X = d.sx, Y = d.sy;
  for (let i = 0; i < n - 1; i++) {
    const col = d.scarf[(i >> 1) & 1];
    for (let s = 0; s < 1; s += 0.34) {
      const x = X[i] + (X[i + 1] - X[i]) * s, y = Y[i] + (Y[i + 1] - Y[i]) * s;
      fr(x - 1, y - 1, 2, 2 + (i < 2 ? 1 : 0), col);
    }
  }
  const tx = X[n - 1], ty = Y[n - 1];
  fr(tx - 2, ty - 1, 1, 1, d.scarf[1]); fr(tx - 2, ty + 1, 1, 1, d.scarf[1]);
}

function eyePix(x, y, mode) {
  if (mode === 1) { fr(x, y + 1, 2, 1, PC.ink); return; }
  if (mode === 2) { fr(x - 1, y + 1, 1, 1, PC.ink); fr(x, y, 2, 1, PC.ink); fr(x + 2, y + 1, 1, 1, PC.ink); return; }
  fr(x, y, 2, 3, PC.ink); fr(x, y, 1, 1, PC.white);
}

function drawDuck(d, env) {
  const bob = Math.round(d.bob), lean = Math.round(d.lean);
  const sx = d.seat, hx = sx + lean, hy = d.hy + bob;
  const bodyY = -13 + (bob > 0 ? 1 : 0);
  // body, peeking above the cockpit rim
  fell(sx - 0.5, bodyY + 0.5, 9, 5.6, d.bodyD);
  fell(sx - 1.2, bodyY, 8.4, 5.1, d.body);
  fell(sx - 3, bodyY - 3, 4, 1.4, d.bodyL);
  if (d.wave <= 0) { fell(sx - 3, bodyY + 0.5, 4.6, 2.4, d.bodyD); fr(sx - 7, bodyY + 1, 3, 1, d.body); }
  // neck
  fr(hx - 3, hy + 3, 6, Math.max(1, bodyY - hy - 2), d.body);
  // head
  fell(hx + 0.6, hy + 0.6, d.r, d.ry, d.bodyD);
  fell(hx, hy, d.r - 0.2, d.ry - 0.2, d.body);
  fell(hx - 2.2, hy - 3, 2.6, 1.5, d.bodyL);
  // scarf wrap and knot
  fr(hx - 4, hy + 5, 8, 2, d.scarf[0]); fr(hx - 4, hy + 6, 8, 1, d.scarf[1]); fr(hx - 6, hy + 5, 2, 3, d.scarf[0]);
  if (d.tuft) { const w = Math.sin(env.t * 9 + d.phase) > 0 ? 1 : 0; fr(hx - 1, hy - d.ry - 2, 1, 2, d.body); fr(hx - 2 - w, hy - d.ry - 3, 1, 1, d.body); fr(hx, hy - d.ry - 3, 1, 1, d.bodyL); }
  if (d.cap) {
    fell(hx, hy - 1, d.r + 0.3, d.ry, PC.cap, hy - 3);
    fell(hx - 2, hy - 5, 2.4, 1.2, PC.capL);
  }
  // face
  const L = d.look, side = L >= 0 ? 1 : -1, a = Math.abs(L);
  const gy = Math.round(d.gaze);
  const eyeMode = d.happy > 0 || d.wave > 0 ? 2 : (d.blink > 0 ? 1 : 0);
  const open = d.quack > 0;
  if (a >= 0.62) {
    const ex = side > 0 ? hx + 2 : hx - 4, ey = hy - 2 + gy;
    if (d.cap) {
      fr(side > 0 ? hx - 7 : ex + 3, ey + 1, side > 0 ? ex - (hx - 7) : hx + 7 - (ex + 3), 1, PC.capD);
      fell(ex + 1, ey + 1.5, 3.1, 3.1, PC.brass);
      fell(ex + 1, ey + 1.5, 2.1, 2.1, '#e7fbf9');
      fr(side > 0 ? hx - 4 : hx + 2, hy - 1, 2, 4, PC.cap);
    } else fr(ex - side * 2 + (side > 0 ? -1 : 2), ey + 4, 2, 1, PC.blush);
    eyePix(ex, ey, eyeMode);
    if (d.cap) { PX.fillStyle = PC.lens; PX.fillRect(PB_OX + ex - 1, PB_OY + ey, 4, 3); fr(ex - 1, ey, 1, 1, PC.white); }
    const bx = side > 0 ? hx + 5 : hx - 11;
    fr(bx, hy - 1 + gy, 6, 2, PC.bill);
    fr(side > 0 ? bx + 5 : bx, hy - 1 + gy, 1, 1, PC.billL);
    fr(side > 0 ? bx : bx + 1, hy + 1 + gy + (open ? 1 : 0), 5, 1, PC.billD);
    if (open) fr(side > 0 ? bx + 1 : bx + 1, hy + 1 + gy, 4, 1, PC.ink);
    fr(side > 0 ? bx + 1 : bx + 4, hy - 1 + gy, 1, 1, PC.billD);
  } else if (a >= 0.22) {
    const ne = hx + side * 3 - (side > 0 ? 0 : 1), fe = hx - side * 2 - (side > 0 ? 1 : 0), ey = hy - 2 + gy;
    if (d.cap) {
      fell(ne + 1, ey + 1.5, 3.1, 3.1, PC.brass); fell(ne + 1, ey + 1.5, 2.1, 2.1, '#e7fbf9');
      fell(fe + 0.5, ey + 1.5, 2.4, 3, PC.brass); fell(fe + 0.5, ey + 1.5, 1.4, 2, '#e7fbf9');
    } else { fr(ne + side * 2, ey + 4, 2, 1, PC.blush); }
    eyePix(ne, ey, eyeMode);
    if (eyeMode === 1) fr(fe, ey + 1, 1, 1, PC.ink); else if (eyeMode === 2) fr(fe, ey + 1, 1, 1, PC.ink); else fr(fe, ey, 1, 3, PC.ink);
    if (d.cap) { PX.fillStyle = PC.lens; PX.fillRect(PB_OX + ne - 1, PB_OY + ey, 4, 3); }
    const bx = hx + side * 4 - 3;
    fr(bx, hy + 1 + gy, 7, 2, PC.bill); fr(bx + (side > 0 ? 5 : 0), hy + 1 + gy, 2, 1, PC.billL);
    fr(bx + 1, hy + 3 + gy + (open ? 1 : 0), 5, 1, PC.billD);
    if (open) fr(bx + 1, hy + 3 + gy, 5, 1, PC.ink);
  } else {
    const ey = hy - 2 + gy, l = hx - 4 + Math.round(L * 2), r = hx + 2 + Math.round(L * 2);
    if (d.cap) {
      for (const ex of [l, r]) { fell(ex + 1, ey + 1.5, 3, 3, PC.brass); fell(ex + 1, ey + 1.5, 2, 2, '#e7fbf9'); }
      fr(l + 3, ey + 1, r - l - 3, 1, PC.brass);
    } else { fr(l - 2, ey + 4, 2, 1, PC.blush); fr(r + 2, ey + 4, 2, 1, PC.blush); }
    eyePix(l, ey, eyeMode); eyePix(r, ey, eyeMode);
    if (d.cap) { PX.fillStyle = PC.lens; PX.fillRect(PB_OX + l - 1, PB_OY + ey, 4, 3); PX.fillRect(PB_OX + r - 1, PB_OY + ey, 4, 3); }
    const bx = hx - 3 + Math.round(L * 2);
    fr(bx, hy + 2 + gy, 6, 2, PC.bill); fr(bx + 1, hy + 2 + gy, 4, 1, PC.billL);
    fr(bx + 1, hy + 4 + gy + (open ? 1 : 0), 4, 1, PC.billD);
    if (open) fr(bx + 1, hy + 4 + gy, 4, 1, PC.ink);
  }
  // camera for Pip's photo
  if (d.photo > 0) {
    const cx = hx + 6, cy = hy - 1;
    fr(cx, cy, 5, 4, '#3a3a44'); fr(cx + 1, cy - 1, 2, 1, '#3a3a44'); fr(cx + 1, cy + 1, 2, 2, '#9fd3ff'); fr(cx + 4, cy, 1, 1, '#ffe08a');
    fr(cx - 2, cy + 2, 3, 2, d.body);
  }
  // waving wing
  if (d.wave > 0) {
    const t = env.t, ang = 1.2 + Math.sin(t * 15) * 0.42;
    const ox = sx + 3, oy = bodyY - 2;
    for (let s = 0; s <= 9; s += 1) {
      const x = ox + Math.cos(ang) * s * 0.75, y = oy - Math.sin(ang) * s;
      fell(x, y, s > 7 ? 1.2 : 1.7, s > 7 ? 1.2 : 1.7, s > 6 ? d.bodyL : d.body);
    }
    fr(ox - 1, oy, 2, 2, d.bodyD);
  }
}

/* Paint the plane for this frame into planeBuf, then outline and light it
   into planeOut. Canvas compositing only: nothing is allocated per frame. */
let planeFront = null;
const planeBuf = makeCanvas(PB_W, PB_H);
const planeOut = makeCanvas(PB_W, PB_H);
function paintPlane(state, env, tint, tintA, navOn, beaconOn) {
  if (!planeFront) planeFront = buildPlaneFront();
  PX = planeBuf.ctx;
  PX.clearRect(0, 0, PB_W, PB_H);
  for (const d of DUCKS) drawScarf(d);
  for (let i = DUCKS.length - 1; i >= 0; i--) drawDuck(DUCKS[i], env);
  PX.drawImage(planeFront, 0, 0);
  drawProp(state.prop, 0);
  drawSpinner();
  const o = planeOut.ctx;
  o.globalCompositeOperation = 'source-over';
  o.globalAlpha = 1;
  o.clearRect(0, 0, PB_W, PB_H);
  o.drawImage(planeBuf, -1, 0); o.drawImage(planeBuf, 1, 0); o.drawImage(planeBuf, 0, -1); o.drawImage(planeBuf, 0, 1);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = OUTLINE; o.fillRect(0, 0, PB_W, PB_H);
  o.globalCompositeOperation = 'source-over';
  o.drawImage(planeBuf, 0, 0);
  PX = o;
  drawGlass();
  if (tintA > 0.005) {
    o.globalCompositeOperation = 'source-atop';
    o.fillStyle = tint; o.globalAlpha = tintA;
    o.fillRect(0, 0, PB_W, PB_H);
    o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
  }
  PX.globalAlpha = clamp(0.12 + 0.1 * env.speed, 0, 0.35);
  fell(51.5, 0.5, 1.6, 23, '#f6ecd8');
  PX.globalAlpha = 1;
  if (navOn > 0.02) {
    PX.globalAlpha = navOn;
    fr(28, 14, 2, 2, '#7dff9a');
    fr(-68, -5, 1, 2, '#fff6dc');
    if (beaconOn) fr(-62, -32, 2, 1, '#ff5048');
    PX.globalAlpha = 1;
  }
}
