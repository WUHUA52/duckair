/* =====================================================================
   The Front, Rear and 3D views: one WebGL scene seen through different
   cameras. It is drawn at the same chunky resolution as the pixel art
   and shares the flight's state (city, weather, light, speed, the plane
   and what the ducks are doing), so switching views never resets anything.
   ===================================================================== */
const gl3canvas = document.getElementById('scene3d');
const SPEED3 = 58, LAT_MAX = 46, ALT_MIN = 58, ALT_K = 0.7;
const HERO3 = { philadelphia: 770, nyc: 820, paris: 740, tokyo: 740, london: 600 };
const POSE3 = {
  side: { yaw: 0, pitch: -0.09, dist: 188, fov: 0.66 },
  front: { yaw: Math.PI / 2 - 0.3, pitch: 0.17, dist: 112, fov: 0.7 },
  rear: { yaw: -Math.PI / 2 + 0.2, pitch: 0.27, dist: 124, fov: 0.82 },
  orbit: { yaw: 0.72, pitch: 0.2, dist: 150, fov: 0.7 },
};
const V3 = {
  ok: false, tried: false, lost: false, why: '', gl: null, prog: null, W: 1, H: 1,
  scroll: 0, lat: 0, latV: 0, homeLat: 0, roll: 0, yawK: 0,
  cam: { yaw: 0, pitch: -0.09, dist: 188, fov: 0.66, tx: 0, ty: 110, tz: 0 },
  orbit: { yaw: POSE3.orbit.yaw, pitch: POSE3.orbit.pitch, dist: POSE3.orbit.dist },
  eye: new Float32Array(3), R: new Float32Array(3), U: new Float32Array(3), F: new Float32Array(3), tanY: 0.36, aspect: 1.6,
  view: M4.make(), proj: M4.make(), vp: M4.make(), pm: M4.make(), m: M4.make(), hm: M4.make(),
  P: new Float32Array(3), city: null, meshes: null, snap: false, dragging: false,
  clockVer: -1, clockTex: null, marker: { life: 0, y: 0, z: 0 },
};
const altOf = y => ALT_MIN + (bounds.maxY - y) * ALT_K;
const yOfAlt = a => bounds.maxY - (a - ALT_MIN) / ALT_K;
const altMid = () => ALT_MIN + (bounds.maxY - bounds.minY) * ALT_K * 0.5;
const wrapPi = a => a - TAU * Math.round(a / TAU);

/* ---------- start-up ---------- */
function v3init() {
  if (V3.tried) return V3.ok;
  V3.tried = true;
  try {
    const opts = { antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false };
    const gl = gl3canvas.getContext('webgl', opts) || gl3canvas.getContext('experimental-webgl', opts);
    if (!gl) { V3.why = 'This browser has WebGL switched off, so the 3D views cannot run here.'; return false; }
    V3.gl = gl;
    v3build();
    gl3canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); V3.lost = true; });
    gl3canvas.addEventListener('webglcontextrestored', () => { try { v3build(); V3.lost = false; needsRender = true; } catch (err) { V3.ok = false; } });
    V3.ok = true;
  } catch (e) {
    V3.ok = false;
    V3.why = '3D could not start in this browser (' + String((e && e.message) || e).slice(0, 90) + ').';
  }
  return V3.ok;
}
function v3build() {
  const gl = V3.gl;
  const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  const prec = hp && hp.precision > 0 ? 'highp' : 'mediump';
  V3.prog = {
    main: glProgram(gl, VS_MAIN, FS_MAIN, prec, ['aPos', 'aNor', 'aCol']), sky: glProgram(gl, VS_SKY, FS_SKY, prec, ['aP']),
    tex: glProgram(gl, VS_TEX, FS_TEX, 'mediump', ['aP']), line: glProgram(gl, VS_LINE, FS_LINE, 'mediump', ['aPos']),
  };
  const M = V3.meshes = {
    plane: buildPlane3().upload(gl), prop: buildProp3().upload(gl), disc: buildDisc3().upload(gl),
    cube: buildCube3(MT.solid).upload(gl), lamp: buildCube3(MT.lamp).upload(gl),
    heads: DUCKS.map(d => [buildHead3(d, false).upload(gl), buildHead3(d, true).upload(gl)]),
    camera: buildCamera3(DUCKS[1]).upload(gl),
    clouds: [11, 23, 37, 51, 68].map(s => buildCloud3(s).upload(gl)),
  };
  M.quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, M.quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  M.rain = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, M.rain);
  gl.bufferData(gl.ARRAY_BUFFER, rainBuf, gl.DYNAMIC_DRAW);
  V3.clockTex = gl.createTexture(); V3.clockVer = -1;
  gl.bindTexture(gl.TEXTURE_2D, V3.clockTex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  for (const id in city3Cache) city3Cache[id].gpu = null;
  gl.enableVertexAttribArray(0);
}
function v3resize() {
  if (!V3.ok) return;
  V3.W = view.VW; V3.H = view.VH;
  if (gl3canvas.width !== V3.W || gl3canvas.height !== V3.H) { gl3canvas.width = V3.W; gl3canvas.height = V3.H; }
  gl3canvas.style.width = (V3.W * view.S / view.dpr) + 'px';
  gl3canvas.style.height = (V3.H * view.S / view.dpr) + 'px';
}
function v3city(id) {
  V3.city = getCity3(id);
  const S = STYLE3[id];
  V3.scroll = (S.hero == null ? HERO3[id] : S.hero) - 460;
  v3sync(true);
}
/* The Side view and the 3D views fly the same stretch of river (3D x = route
   px * L3 / ROUTE), so switching views keeps the plane over the same place. */
function v3sync(to3d) {
  if (!V3.city || !city || V3.city.id !== city.id || !STYLE3[city.id].synced) return;
  if (to3d) V3.scroll = mod(world.scroll, ROUTE) / ROUTE * L3;
  else world.scroll = mod(V3.scroll, L3) / L3 * ROUTE;
}
function v3gpu(C) {
  const gl = V3.gl, up = m => (m && m.count ? m.upload(gl) : null);
  C.gpu = { chunks: C.chunks.map(up), wide: up(C.wide), backdrop: up(C.backdrop), spinners: C.spinners.map(s => up(s.mesh)) };
}

/* ---------- light and colour for this frame, from the same looks as the side view ---------- */
const E3 = {
  c0: new Float32Array(3), c1: new Float32Array(3), c2: new Float32Array(3), c3: new Float32Array(3), fog: new Float32Array(3), glow: new Float32Array(3),
  sunV: new Float32Array(3), sun: new Float32Array(3), sunCol: new Float32Array(3), amb: new Float32Array(3), hemi: new Float32Array(3),
  cloud: new Float32Array(3), hi: new Float32Array(3), water: new Float32Array(3), rain: new Float32Array(3), body: new Float32Array(4), fogR: new Float32Array(4),
  lit: 0, vis: 1, glowR: 0.4, white: 0,
};
function mix3(out, a, b, k, s) { out[0] = (a[0] + (b[0] - a[0]) * k) * s; out[1] = (a[1] + (b[1] - a[1]) * k) * s; out[2] = (a[2] + (b[2] - a[2]) * k) * s; }
const elevOf = L => (L.by >= 0 ? lerp(0.92, 0.14, clamp(L.by / 0.9, 0, 1)) : 0.085);
const BODY_ID = { sun: 0, sunset: 1, moon: 2 };
function env3() {
  const b = LB.look, a = LA ? LA.look : b, k = LA ? easeInOut(lookK) : 1, q = 1 / 255;
  mix3(E3.c0, a.sky[0], b.sky[0], k, q); mix3(E3.c1, a.sky[1], b.sky[1], k, q); mix3(E3.c2, a.sky[2], b.sky[2], k, q); mix3(E3.c3, a.sky[3], b.sky[3], k, q);
  mix3(E3.fog, a.hazeC, b.hazeC, k, q); mix3(E3.glow, a.glow, b.glow, k, q);
  mix3(E3.cloud, a.cloud[2], b.cloud[2], k, q); mix3(E3.hi, a.waterHi, b.waterHi, k, q); mix3(E3.rain, a.rain, b.rain, k, q);
  mix3(E3.water, a.water[0], b.water[0], k, q);
  mix3(E3.amb, a.light, b.light, k, 0.5); mix3(E3.hemi, a.light, b.light, k, 0.24); mix3(E3.sunCol, a.light, b.light, k, 0.5);
  E3.lit = clamp(lerp(a.emissive, b.emissive, k) * 1.1, 0, 1);
  E3.vis = lerp(a.vis, b.vis, k);
  E3.glowR = lerp(a.glowR, b.glowR, k) * 1.7;
  const main = k < 0.5 ? a : b;
  E3.body[0] = BODY_ID[main.body] || 0; E3.body[1] = E3.vis * (LA ? Math.abs(k - 0.5) * 2 : 1); E3.body[2] = lerp(a.glowAmt, b.glowAmt, k); E3.body[3] = lerp(a.stars, b.stars, k);
  const el = elevOf(main), bx = (main.bx - 0.5) * 2.3, hl = Math.hypot(bx, 1), ce = Math.cos(el);
  E3.sunV[0] = bx / hl * ce; E3.sunV[1] = Math.sin(el); E3.sunV[2] = -1 / hl * ce;
  const kx = E3.sunV[0] * 0.7, ky = Math.max(E3.sunV[1], 0.45) + 0.25, kz = 0.55, kl = Math.hypot(kx, ky, kz);
  E3.sun[0] = kx / kl; E3.sun[1] = ky / kl; E3.sun[2] = kz / kl;
  E3.fogR[0] = lerp(140, 430, E3.vis); E3.fogR[1] = lerp(880, 1750, E3.vis); E3.fogR[2] = 1;
  const u = trans.on ? trans.t / trans.dur : 0;
  E3.white = trans.on ? smoothstep(0.06, 0.34, u) * (1 - smoothstep(0.56, 0.94, u)) : 0;
  E3.fogR[3] = E3.white;
}

/* ---------- clouds, rain and little particles ---------- */
const clouds3 = Array.from({ length: 18 }, (_, i) => ({ x: 0, y: 0, z: 0, s: 1, i: i % 5, a: 0 }));
function placeCloud3(c, ahead) {
  const r = rngSim, low = r() < 0.34;
  c.x = ahead ? 1300 + r() * 200 : (r() * 2 - 1) * 1300;
  c.y = low ? rf(r, 60, 150) : rf(r, 170, 330);
  c.z = (r() < 0.5 ? -1 : 1) * (low ? rf(r, 130, 700) : rf(r, 40, 800));
  c.s = low ? rf(r, 0.7, 1.3) : rf(r, 1.2, 2.8);
  c.i = (r() * 5) | 0;
}
clouds3.forEach(c => placeCloud3(c, false));
const RAIN_N = 320, rainBuf = new Float32Array(RAIN_N * 6), rain3 = new Float32Array(RAIN_N * 3);
for (let i = 0; i < RAIN_N * 3; i += 3) { rain3[i] = (hash1(i) * 2 - 1) * 170; rain3[i + 1] = hash1(i + 9.1) * 220 - 90; rain3[i + 2] = (hash1(i + 3.7) * 2 - 1) * 170; }
const parts3 = Array.from({ length: 16 }, () => ({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, c: null }));
const C3 = {};
function col3(c) { return C3[c] || (C3[c] = new Float32Array(hex(c).map(v => v / 255))); }
function emit3(i, kind) {
  if (!V3.ok) return;
  const d = DUCKS[i], m = V3.pm, lx = d.seat + 1, ly = -d.hy + 9;
  const wx = m[0] * lx + m[4] * ly + m[12], wy = m[1] * lx + m[5] * ly + m[13], wz = m[2] * lx + m[6] * ly + m[14];
  for (let n = kind === 'heart' ? 3 : 1; n > 0; n--) {
    const p = parts3.find(q => !q.on);
    if (!p) return;
    Object.assign(p, { on: true, x: wx, y: wy, z: wz + rf(rngSim, -2, 2), vx: rf(rngSim, -16, -6), vy: rf(rngSim, 9, 16), vz: rf(rngSim, -5, 5), life: 1.2, max: 1.2, c: col3(kind === 'heart' ? '#ff6f91' : kind === 'spark' ? '#ffffff' : '#fff3d6') });
  }
}

/* ---------- per-step update: scenery, sideways flight, camera ---------- */
function v3update(dt) {
  const sp = SPEED3 * world.speed;
  V3.scroll += sp * dt;
  const in3 = viewMode !== 'side';
  if (!in3) V3.homeLat = approach(V3.homeLat, 0, 1.5, dt);
  const wz = in3 ? Math.sin(world.t * 0.11 + 2) * 9 * plane.wander : 0;
  const az = (clamp(V3.homeLat + wz, -LAT_MAX, LAT_MAX) - V3.lat) * 2.0 - V3.latV * 2.6;
  V3.latV += az * dt; V3.lat += V3.latV * dt;
  V3.roll = approach(V3.roll, clamp(V3.latV * 0.014, -0.5, 0.5) + Math.sin(world.t * 0.9) * 0.03 * intensity(), 4, dt);
  V3.yawK = approach(V3.yawK, clamp(-V3.latV * 0.006, -0.3, 0.3), 4, dt);
  if (V3.marker.life > 0) V3.marker.life -= dt * 1.1;
  const amt = lerp(6, 18, cur.clouds);
  for (let i = 0; i < clouds3.length; i++) {
    const c = clouds3[i];
    c.a = approach(c.a, i < amt ? 1 : 0, 0.8, dt);
    c.x -= (sp * 0.9 + 6) * dt;
    if (c.x < -1400) placeCloud3(c, true);
  }
  for (let i = 0; i < RAIN_N * 3; i += 3) {
    rain3[i + 1] -= 250 * dt; rain3[i] -= sp * 0.7 * dt;
    if (rain3[i + 1] < -100) { rain3[i + 1] += 230; rain3[i] = (rngSim() * 2 - 1) * 170; rain3[i + 2] = (rngSim() * 2 - 1) * 170; }
    if (rain3[i] < -170) rain3[i] += 340;
  }
  for (const p of parts3) if (p.on) { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt; if (p.life <= 0) p.on = false; }
}
/* the camera eases towards the pose for the current view; runs every frame, even when paused */
function v3camera(dt) {
  const c = V3.cam, mode = viewMode === '3d' ? 'orbit' : viewMode, g = mode === 'orbit' ? V3.orbit : POSE3[mode], fov = POSE3[mode].fov;
  const px = (plane.rx - view.VW * 0.42) * 0.3, alt = altOf(plane.ry), mid = altMid();
  let tx = px, ty = alt, tz = V3.lat;
  if (mode === 'front') { ty = lerp(mid, alt, 0.5) + 3; tz = V3.lat * 0.5; }
  else if (mode === 'rear') { tx = px + 24; ty = lerp(mid, alt, 0.5) + 6; tz = V3.lat * 0.5; }
  V3.P[0] = px; V3.P[1] = alt; V3.P[2] = V3.lat;
  const gy = c.yaw + wrapPi(g.yaw - c.yaw);
  if (V3.snap || REDUCED || V3.dragging) {
    c.yaw = gy; c.pitch = g.pitch; c.dist = g.dist; c.fov = fov;
    if (V3.snap || REDUCED) { c.tx = tx; c.ty = ty; c.tz = tz; }
    else { c.tx = approach(c.tx, tx, 7, dt); c.ty = approach(c.ty, ty, 7, dt); c.tz = approach(c.tz, tz, 7, dt); }
    V3.snap = false;
  } else {
    c.yaw = approach(c.yaw, gy, 4.2, dt); c.pitch = approach(c.pitch, g.pitch, 4.2, dt); c.dist = approach(c.dist, g.dist, 4.2, dt); c.fov = approach(c.fov, fov, 4.2, dt);
    c.tx = approach(c.tx, tx, 5, dt); c.ty = approach(c.ty, ty, 5, dt); c.tz = approach(c.tz, tz, 5, dt);
  }
  const cp = Math.cos(c.pitch), e = V3.eye;
  e[0] = c.tx + Math.sin(c.yaw) * cp * c.dist; e[1] = Math.max(10, c.ty + Math.sin(c.pitch) * c.dist); e[2] = c.tz + Math.cos(c.yaw) * cp * c.dist;
  V3.aspect = V3.W / V3.H;
  V3.tanY = Math.tan(c.fov / 2) * Math.max(1, 1.2 / V3.aspect);
  M4.lookAt(V3.view, e[0], e[1], e[2], c.tx, c.ty, c.tz, V3.R, V3.U, V3.F);
  M4.perspective(V3.proj, 2 * Math.atan(V3.tanY), V3.aspect, 7, 4600);
  M4.mul(V3.vp, V3.proj, V3.view);
  const m = M4.ident(V3.pm);
  M4.translate(m, px, alt, V3.lat); M4.rotY(m, V3.yawK); M4.rotZ(m, -plane.rot); M4.rotX(m, V3.roll); M4.scale(m, MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
}

/* ---------- picking and steering ---------- */
const _h = [0, 0, 0, 0];
function v3project(x, y, z) {
  const m = V3.vp, w = m[3] * x + m[7] * y + m[11] * z + m[15];
  _h[0] = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w * 0.5 + 0.5) * view.cssW;
  _h[1] = (0.5 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w * 0.5) * view.cssH;
  _h[2] = w; _h[3] = (view.cssH * 0.5) / (V3.tanY * Math.max(w, 1e-3));
  return _h;
}
function v3headWorld(d, out) {
  const m = V3.pm, lx = d.seat + d.lean + 0.5, ly = -d.hy - d.bob;
  out[0] = m[0] * lx + m[4] * ly + m[12]; out[1] = m[1] * lx + m[5] * ly + m[13]; out[2] = m[2] * lx + m[6] * ly + m[14];
  return out;
}
const _hw = [0, 0, 0];
function v3duckAt(cx, cy, generous) {
  let best = -1, bd = 1e9;
  for (let i = 0; i < DUCKS.length; i++) {
    const d = DUCKS[i], w = v3headWorld(d, _hw), p = v3project(w[0], w[1], w[2]);
    if (p[2] <= 0) continue;
    const r = Math.max(13, d.r * MODEL_SCALE * p[3] * 1.5) + (generous ? 9 : 0), dist = Math.hypot(cx - p[0], cy - p[1]);
    if (dist < r && dist < bd) { bd = dist; best = i; }
  }
  return best;
}
/* Front and Rear: aim the plane at a point on screen (left / right and up / down) */
function v3steer(cx, cy) {
  const nx = (cx / view.cssW) * 2 - 1, ny = 1 - (cy / view.cssH) * 2, tx = V3.tanY * V3.aspect, ty = V3.tanY;
  const dx = V3.F[0] + V3.R[0] * nx * tx + V3.U[0] * ny * ty, dy = V3.F[1] + V3.R[1] * nx * tx + V3.U[1] * ny * ty, dz = V3.F[2] + V3.R[2] * nx * tx + V3.U[2] * ny * ty;
  if (Math.abs(dx) < 1e-4) return;
  const s = (V3.P[0] - V3.eye[0]) / dx;
  if (s <= 0) return;
  const hy = V3.eye[1] + dy * s, hz = V3.eye[2] + dz * s, off = viewMode === 'rear' ? 6 : 3;
  const altGoal = altMid() + 2 * (hy - V3.cam.ty + off), latGoal = 2 * (hz - V3.cam.tz);
  V3.homeLat = clamp(latGoal, -LAT_MAX, LAT_MAX);
  plane.homeY = clamp(yOfAlt(altGoal), bounds.minY, bounds.maxY);
  plane.wander = 0.15;
  V3.marker.life = 1; V3.marker.y = altOf(plane.homeY); V3.marker.z = V3.homeLat;
  duckEnv.attention = 1.6; duckEnv.attentionDir = 0.9; duckEnv.attentionGaze = hy < V3.P[1] - 8 ? 1 : hy > V3.P[1] + 8 ? -1 : 0;
}
function v3landmark() {
  const C = V3.city;
  if (!C) return '';
  const s = mod(V3.scroll, L3);
  let best = '', bd = 150;
  for (const mk of C.marks) { const dx = Math.abs(wrapL(mk.x - s - V3.cam.tx)); if (dx < bd) { bd = dx; best = mk.name; } }
  return best;
}
const wrapL = x => x - L3 * Math.round(x / L3);

/* ---------- drawing ---------- */
function v3mesh(mesh) {
  const gl = V3.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.vertexAttribPointer(1, 3, gl.BYTE, true, 20, 12);
  gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 20, 16);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.n);
}
const WHITE3 = new Float32Array([1, 1, 1]), _mul = new Float32Array(3), _mx = M4.make();
function v3cube(mesh, base, x, y, z, sx, sy, sz, col, k) {
  const gl = V3.gl, u = V3.prog.main.u, m = _mx;
  m.set(base); M4.translate(m, x, y, z); M4.scale(m, sx, sy, sz);
  gl.uniformMatrix4fv(u.uModel, false, m);
  if (k === undefined) gl.uniform3fv(u.uMul, col); else { _mul[0] = col[0] * k; _mul[1] = col[1] * k; _mul[2] = col[2] * k; gl.uniform3fv(u.uMul, _mul); }
  v3mesh(mesh);
}
const ID4 = M4.make();
function v3render() {
  const gl = V3.gl;
  if (!V3.ok || V3.lost || !gl) return;
  if (!V3.city) v3city(city ? city.id : 'philadelphia');
  const C = V3.city, M = V3.meshes, P = V3.prog, t = world.t;
  if (!C.gpu) v3gpu(C);
  env3();
  gl.viewport(0, 0, V3.W, V3.H);
  gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.BLEND);
  gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
  // sky
  let u = P.sky.u;
  gl.useProgram(P.sky.p);
  gl.bindBuffer(gl.ARRAY_BUFFER, M.quad);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tx = V3.tanY * V3.aspect, ty = V3.tanY;
  gl.uniform3f(u.uF, V3.F[0], V3.F[1], V3.F[2]); gl.uniform3f(u.uR, V3.R[0] * tx, V3.R[1] * tx, V3.R[2] * tx); gl.uniform3f(u.uU, V3.U[0] * ty, V3.U[1] * ty, V3.U[2] * ty);
  gl.uniform3fv(u.c0, E3.c0); gl.uniform3fv(u.c1, E3.c1); gl.uniform3fv(u.c2, E3.c2); gl.uniform3fv(u.c3, E3.c3);
  gl.uniform3fv(u.uGlow, E3.glow); gl.uniform3fv(u.uSunV, E3.sunV); gl.uniform3fv(u.uFog, E3.fog); gl.uniform3fv(u.uCloud, E3.cloud);
  gl.uniform4fv(u.uBody, E3.body); gl.uniform1f(u.uT, t); gl.uniform1f(u.uWhite, E3.white); gl.uniform1f(u.uGlowR, E3.glowR); gl.uniform1f(u.uFlash, flash.a);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  // the big clock sits in the sky, behind everything solid
  if (bgClock.on && bgClock.w > 1) {
    u = P.tex.u;
    gl.useProgram(P.tex.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, V3.clockTex);
    if (V3.clockVer !== bgClock.ver) {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgClock.c);
      V3.clockVer = bgClock.ver;
    }
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(u.uTex, 0); gl.uniform1f(u.uA, bgClock.alpha * (1 - E3.white));
    gl.uniform4f(u.uRect, bgClock.x / V3.W * 2 - 1, 1 - (bgClock.y + bgClock.h) / V3.H * 2, bgClock.w / V3.W * 2, bgClock.h / V3.H * 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }
  // the solid world
  u = P.main.u;
  gl.useProgram(P.main.p);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
  gl.uniformMatrix4fv(u.uVP, false, V3.vp);
  gl.uniform3fv(u.uCam, V3.eye); gl.uniform3fv(u.uSun, E3.sun); gl.uniform3fv(u.uSunV, E3.sunV); gl.uniform3fv(u.uSunCol, E3.sunCol); gl.uniform3fv(u.uAmb, E3.amb); gl.uniform3fv(u.uHemi, E3.hemi);
  gl.uniform3fv(u.uFog, E3.fog); gl.uniform3fv(u.uSkyC, E3.c2); gl.uniform3fv(u.uCloud, E3.cloud); gl.uniform3fv(u.uHi, E3.hi); gl.uniform3fv(u.uWater, E3.water);
  gl.uniform1f(u.uT, t); gl.uniform1f(u.uLit, E3.lit); gl.uniform1f(u.uFlash, flash.a); gl.uniform1f(u.uVis, E3.vis);
  gl.uniform3fv(u.uMul, WHITE3);
  const G = C.gpu, m = V3.m;
  if (G.backdrop) {
    E3.fogR[2] = 0.62; gl.uniform4fv(u.uFogR, E3.fogR); gl.uniform1f(u.uCut, 0);
    gl.uniformMatrix4fv(u.uModel, false, ID4); v3mesh(G.backdrop);
    E3.fogR[2] = 1;
  }
  gl.uniform4fv(u.uFogR, E3.fogR); gl.uniform1f(u.uCut, 64);
  const s = mod(V3.scroll, L3), reach = E3.fogR[1] + 80, ex = V3.eye[0], fx = V3.F[0];
  for (let k = -1; k <= 1; k++) {
    const ox = k * L3 - s;
    if (ox + L3 < ex - reach || ox > ex + reach) continue;
    M4.ident(m); M4.translate(m, ox, 0, 0);
    gl.uniformMatrix4fv(u.uModel, false, m);
    if (G.wide) v3mesh(G.wide);
    for (let c = 0; c < G.chunks.length; c++) {
      const x0 = ox + c * CHUNK3 - 70, x1 = ox + (c + 1) * CHUNK3 + 70;
      if (!G.chunks[c] || x1 < ex - reach || x0 > ex + reach) continue;
      if ((fx > 0.82 && x1 < ex - 40) || (fx < -0.82 && x0 > ex + 40)) continue;
      v3mesh(G.chunks[c]);
    }
    for (let i = 0; i < C.spinners.length; i++) {
      const sp = C.spinners[i];
      if (!G.spinners[i] || Math.abs(ox + sp.x - ex) > reach) continue;
      M4.ident(m); M4.translate(m, ox + sp.x, sp.y, sp.z); M4.rotZ(m, t * sp.speed);
      gl.uniformMatrix4fv(u.uModel, false, m); v3mesh(G.spinners[i]);
      M4.ident(m); M4.translate(m, ox, 0, 0); gl.uniformMatrix4fv(u.uModel, false, m);
    }
  }
  gl.uniform1f(u.uCut, 0);
  // clouds
  for (const c of clouds3) {
    if (c.a < 0.03) continue;
    M4.ident(m); M4.translate(m, c.x, c.y, c.z); M4.scale(m, c.s * (0.3 + 0.7 * c.a), c.s * c.a, c.s * (0.3 + 0.7 * c.a));
    gl.uniformMatrix4fv(u.uModel, false, m); v3mesh(M.clouds[c.i]);
  }
  // the plane keeps a little fill light at night so the crew stays readable
  const pm = V3.pm, fill = clamp(1 - E3.amb[0] / 0.46, 0, 1) * 0.3;
  gl.uniform3f(u.uAmb, E3.amb[0] + fill, E3.amb[1] + fill, E3.amb[2] + fill * 1.12);
  gl.uniformMatrix4fv(u.uModel, false, pm); v3mesh(M.plane);
  m.set(pm); M4.translate(m, 51, -1, 0); M4.rotX(m, plane.prop);
  gl.uniformMatrix4fv(u.uModel, false, m); v3mesh(M.prop); v3mesh(M.disc);
  const camSide = V3.eye[2] - V3.P[2] >= 0 ? 1 : -1, hm = V3.hm;
  const camAz = Math.atan2(V3.eye[2] - V3.P[2], V3.eye[0] - V3.P[0]);
  for (let i = 0; i < DUCKS.length; i++) {
    const d = DUCKS[i], busy = d.wave > 0 || d.photo > 0;
    /* look = 1 faces forward; lower values turn the head towards whoever is watching */
    let yaw = -clamp(clamp(camAz, -1.7, 1.7) * (1 - d.look), -2.7, 2.7);
    if (busy) yaw = -clamp(camAz, -2.5, 2.5);
    d.yaw3 = d.yaw3 === undefined ? yaw : d.yaw3 + (yaw - d.yaw3) * 0.25;
    hm.set(pm); M4.translate(hm, d.seat + d.lean + 0.5, -d.hy - d.bob, 0); M4.rotY(hm, d.yaw3); M4.rotZ(hm, -0.2 * d.gaze + (d.happy > 0 ? 0.12 : 0));
    gl.uniformMatrix4fv(u.uModel, false, hm); gl.uniform3fv(u.uMul, WHITE3);
    v3mesh(M.heads[i][d.blink > 0 || d.happy > 0 || d.wave > 0 ? 1 : 0]);
    if (d.photo > 0 && d.camera) v3mesh(M.camera);
    v3cube(M.cube, hm, d.r + 1.6, -3 - (d.quack > 0 ? 1.5 : 0), 0, 5.6, 1.1, 5.2, col3(PC.billD));
    if (d.wave > 0) {
      m.set(pm); M4.translate(m, d.seat + 1, 14.4, camSide * 6.6); M4.rotX(m, camSide * 0.5); M4.rotZ(m, Math.sin(t * 15) * 0.45 - 0.1); M4.translate(m, 0, 4.8, 0); M4.scale(m, 3.8, 9.6, 1.9);
      gl.uniformMatrix4fv(u.uModel, false, m); gl.uniform3fv(u.uMul, col3(d.body)); v3mesh(M.cube);
    }
    for (let j = 1; j < d.seg; j++) {
      const f = j / d.seg;
      v3cube(M.cube, pm, d.sx[j], -d.sy[j], Math.sin(t * (9 + 5 * world.speed) - j * 1.1 + d.phase) * 1.6 * f, 2.7, 2.4 - f * 0.5, 2.5 - f * 0.6, col3(d.scarf[(j >> 1) & 1]));
    }
  }
  const navOn = smoothstep(0.3, 0.9, cur.E);
  if (navOn > 0.05) {
    v3cube(M.lamp, pm, 8, -4.2, 58.6, 2.6, 2.2, 2.2, col3('#7dff9a'), navOn); v3cube(M.lamp, pm, 8, -4.2, -58.6, 2.6, 2.2, 2.2, col3('#ff5048'), navOn);
    v3cube(M.lamp, pm, -68, 5, 0, 2, 2, 2, col3('#fff6dc'), navOn);
    if ((t % 1.4) < 0.12) v3cube(M.lamp, pm, -62, 32.4, 0, 2.6, 2, 2.6, col3('#ff5048'), navOn);
  }
  for (const p of parts3) if (p.on) { const k = Math.min(1, p.life / p.max * 2) * 1.9; v3cube(M.lamp, ID4, p.x, p.y, p.z, k, k, k, p.c); }
  if (V3.marker.life > 0 && (viewMode === 'front' || viewMode === 'rear')) {
    const a = Math.min(1, V3.marker.life * 1.6), r = 3 + (1 - V3.marker.life) * 6, wc = col3('#fff6dc');
    v3cube(M.lamp, ID4, V3.P[0], V3.marker.y + r, V3.marker.z, 0.8, 1.6 * a, 1.6 * a, wc); v3cube(M.lamp, ID4, V3.P[0], V3.marker.y - r, V3.marker.z, 0.8, 1.6 * a, 1.6 * a, wc);
    v3cube(M.lamp, ID4, V3.P[0], V3.marker.y, V3.marker.z + r, 0.8, 1.6 * a, 1.6 * a, wc); v3cube(M.lamp, ID4, V3.P[0], V3.marker.y, V3.marker.z - r, 0.8, 1.6 * a, 1.6 * a, wc);
  }
  gl.uniform3fv(u.uMul, WHITE3);
  // rain
  if (cur.rain > 0.02) {
    const n = Math.round(RAIN_N * clamp(cur.rain, 0, 1)), cx = V3.cam.tx, cy = V3.cam.ty, cz = V3.cam.tz, sl = SPEED3 * world.speed * 0.028;
    for (let i = 0; i < n; i++) {
      const x = cx + rain3[i * 3], y = cy + rain3[i * 3 + 1], z = cz + rain3[i * 3 + 2];
      rainBuf[i * 6] = x; rainBuf[i * 6 + 1] = y; rainBuf[i * 6 + 2] = z; rainBuf[i * 6 + 3] = x + sl; rainBuf[i * 6 + 4] = y + 7; rainBuf[i * 6 + 5] = z;
    }
    gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
    u = P.line.u;
    gl.useProgram(P.line.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, M.rain);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, rainBuf);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(u.uVP, false, V3.vp);
    gl.uniform3f(u.uCol, lerp(E3.rain[0], E3.fog[0], 0.45), lerp(E3.rain[1], E3.fog[1], 0.45), lerp(E3.rain[2], E3.fog[2], 0.45));
    gl.drawArrays(gl.LINES, 0, n * 2);
  }
}
