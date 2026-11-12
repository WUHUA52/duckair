/* =====================================================================
   Scene: layout, simulation and the per-frame render.
   Art pixels are drawn at an integer scale S onto a device-resolution
   canvas, so pixels stay crisp while layers glide smoothly.
   ===================================================================== */
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d', { alpha: false });
const PAR = { far: 0.2, mid: 0.45, near: 1, c0: 0.05, c1: 0.13, c2: 0.38, c3: 1.9 };
const BASE_SPEED = 36;
const LOOK_DUR = 2.4;
let lookDur = LOOK_DUR;
let viewMode = 'side'; // 'side' | 'front' | 'rear' | '3d'
const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const CITY_TZ = { philadelphia: 'America/New_York', nyc: 'America/New_York', paris: 'Europe/Paris', tokyo: 'Asia/Tokyo', london: 'Europe/London' };
const tzFmt = {};
/* hours, minutes and seconds right now in a time zone (falls back to local time) */
function timeIn(tz, out) {
  let f = tzFmt[tz];
  if (f === undefined) {
    try { f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); } catch (e) { f = null; }
    tzFmt[tz] = f;
  }
  const d = new Date();
  if (f) {
    const p = f.format(d).split(':');
    out[0] = (+p[0]) % 24; out[1] = +p[1]; out[2] = +p[2];
  } else { out[0] = d.getHours(); out[1] = d.getMinutes(); out[2] = d.getSeconds(); }
  return out;
}
const GENS = { philadelphia: genPhiladelphia, nyc: genNewYork, paris: genParis, tokyo: genTokyo, london: genLondon };

const view = { dprCap: 2, insetTop: 0, insetBottom: 0, dpr: 1, S: 4, CW: 1, CH: 1, VW: 480, VH: 270, HZ: 216, WH: 54, BY: 238, dockTop: 1e9, cssW: 1, cssH: 1 };
const bounds = { minX: 80, maxX: 400, minY: 44, maxY: 180 };
const world = { t: 0, scroll: 0, speed: 1, speedTarget: 1, paused: false };
const rngSim = mulberry32(20261022);
const hooks = { onCity: null, onQuack: null, onPhoto: null, onLandmark: null, onWave: null };

/* ---------- looks and their baked canvases ---------- */
function makeSlot() {
  return { look: null, sky: makeCanvas(1, 1), water: makeCanvas(1, 1), L: [], spr: [], lut: null, vehicle: makeCanvas(1, 1), clouds: [], boatC: [], boats: [], css: {} };
}
const slots = [makeSlot(), makeSlot()];
let LB = slots[0], LA = null, lookK = 1;
let city = null;
const cityCache = {};
function getCity(id) { return cityCache[id] || (cityCache[id] = prepCity(GENS[id]())); }
/* Fill in what a city generator may leave out. */
function prepCity(C) {
  if (!C.layers) {            // a city still drawn the old way: keep it flying
    C.layers = [{ name: 'far', R: C.far, W: C.far.w, H: C.far.h, p: C.far.w / ROUTE, dy: -3 }, { name: 'mid', R: C.mid, W: C.mid.w, H: C.mid.h, p: C.mid.w / ROUTE }];
    C.landmarks = C.landmarks.filter(l => l.L === 'mid');
    C.hero = { r: 420 / C.layers[1].p, p: C.layers[1].p };
    for (const k of ['eye', 'sparkle']) if (C.dyn[k]) C.dyn[k].L = 'mid';
    if (C.dyn.sparkle) C.dyn.sparkle.x = 420;
    if (C.dyn.signs) C.dyn.signs.forEach(g => { g.L = 'mid'; });
  }
  C.byName = {};
  if (C.M.list.length > 255) console.error(C.id + ': ' + C.M.list.length + ' materials, but a raster can only index 255');
  C.layers.forEach((Ly, i) => { Ly.i = i; C.byName[Ly.name] = Ly; });
  C.crossings = C.crossings || []; C.sprites = C.sprites || [];
  C.J0 = C.J0 || 40;
  if (C.cloudAfter == null) C.cloudAfter = 0;
  C.dyn.blink = C.dyn.blink || [];
  return C;
}
/* Haze for a layer, from how far away its parallax says it is. */
function layerHaze(L, Ly) {
  if (Ly.hz != null) return clamp(Ly.hz * L.haze[0] / 0.5, 0, 0.92);
  const p = Ly.p, h = L.haze;
  if (p <= 0.2) return h[0];
  if (p <= 0.3) return lerp(h[0], h[1] * 1.3, (p - 0.2) / 0.1);
  if (p <= 0.5) return lerp(h[1] * 1.3, h[1] * 0.8, (p - 0.3) / 0.2);
  return lerp(h[1] * 0.8, h[2], (p - 0.5) / 0.5);
}

function mixLook(a, b, t) {
  const out = {};
  for (const k in b) {
    const va = a[k], vb = b[k];
    if (typeof vb === 'number') out[k] = lerp(va, vb, t);
    else if (Array.isArray(vb)) out[k] = Array.isArray(vb[0]) ? vb.map((c, i) => mixc(va[i], c, t)) : mixc(va, vb, t);
    else out[k] = t < 0.5 ? va : vb;
  }
  return out;
}
function bakeScreen(s) {
  bakeSky(s.look, s.sky, view.VW, view.VH, view.HZ);
  bakeWater(s.look, s.water, view.VW, view.WH);
}
function bakeCityInto(s) {
  const L = s.look, C = city;
  C.layers.forEach((Ly, i) => {
    bakeRaster(Ly.R, C.M, L, layerHaze(L, Ly), s.L[i] || (s.L[i] = makeCanvas(1, 1)), {});
  });
  C.sprites.forEach((R, i) => bakeRaster(R, C.M, L, L.haze[2], s.spr[i] || (s.spr[i] = makeCanvas(1, 1)), { wrap: false }));
  s.lut = buildLUT(C.M, L, L.haze[2]).lut;
  let n = 0;
  s.boats = C.boats.map(b => b.frames.map(R => {
    const c = s.boatC[n] || (s.boatC[n] = makeCanvas(1, 1)); n++;
    return bakeRaster(R, C.M, L, L.haze[2] * 0.7, c, { wrap: false, glowScale: 0.8 });
  }));
  if (C.vehicle) bakeRaster(C.vehicle.sprite, C.M, L, L.haze[2], s.vehicle, { wrap: false });
  bakeClouds(L, s.clouds);
  s.css.cloudBase = css(L.cloud[1]); s.css.cloudHi = css(L.cloud[2]);
}
function bakeSlot(s) { bakeScreen(s); bakeCityInto(s); }

function setLook(tod, wx, instant, dur) {
  const look = buildLook(tod, wx);
  lookDur = dur || LOOK_DUR;
  if (instant || !LB.look) {
    LB.look = look; bakeSlot(LB); LA = null; lookK = 1; needsRender = true; return;
  }
  if (LA && lookK < 1) {
    LA.look = mixLook(LA.look, LB.look, easeInOut(lookK));
    bakeSlot(LA);
  } else {
    const spare = LB === slots[0] ? slots[1] : slots[0];
    LA = LB; LB = spare;
  }
  LB.look = look; bakeSlot(LB);
  lookK = 0; needsRender = true;
}

/* ---------- mixed per-frame values ---------- */
const cur = { k: 1, E: 0, stars: 0, reflA: 0.4, rain: 0, clouds: 0.2, wisps: 0.15, planeA: 0, planeTint: '#000', rainCol: 'rgb(220,230,245)', rainA: 0.5, hi: [255, 255, 255], hiCss: '#fff', night: 0, bodyX: 0.8, vis: 1, day: 1, speedCol: 'rgba(255,255,255,0.4)', ref: null };
function updateCur() {
  if (!LA && cur.ref === LB.look) return;
  cur.ref = LA ? null : LB.look;
  const k = LA ? easeInOut(lookK) : 1;
  const a = LA ? LA.look : LB.look, b = LB.look;
  cur.k = k;
  cur.E = lerp(a.emissive, b.emissive, k);
  cur.stars = lerp(a.stars, b.stars, k);
  cur.reflA = lerp(a.reflA, b.reflA, k);
  cur.rain = lerp(a.rainAmt, b.rainAmt, k);
  cur.clouds = lerp(a.cloudAmt, b.cloudAmt, k);
  cur.wisps = lerp(a.wisps, b.wisps, k);
  const night = b.tod === 'night' ? 1 : 0, nightA = a.tod === 'night' ? 1 : 0;
  cur.night = lerp(nightA, night, k);
  cur.day = lerp(a.tod === 'day' ? 1 : 0, b.tod === 'day' ? 1 : 0, k);
  cur.planeA = lerp(a.planeA, b.planeA, k) * 0.78;
  cur.planeTint = css(mixc(a.plane, b.plane, k));
  cur.rainCol = css(mixc(a.rain, b.rain, k));
  cur.rainA = lerp(a.rainA, b.rainA, k);
  cur.hi = mixc(a.waterHi, b.waterHi, k); cur.hiCss = css(cur.hi);
  cur.vis = lerp(a.vis, b.vis, k);
  cur.bodyX = (k < 0.5 ? a.bx : b.bx);
  cur.speedCol = cur.night > 0.5 ? 'rgba(190,205,255,0.32)' : 'rgba(255,255,255,0.45)';
}

/* ---------- layout ---------- */
let needsRender = true;
const reflBuf = makeCanvas(1, 1);
function layout() {
  const cssW = Math.max(1, window.innerWidth), cssH = Math.max(1, window.innerHeight);
  const dpr = Math.min(view.dprCap, window.devicePixelRatio || 1);
  const CW = Math.max(1, Math.round(cssW * dpr)), CH = Math.max(1, Math.round(cssH * dpr));
  const targetW = clamp(cssW * 0.4, 200, 300);
  const S = Math.max(1, Math.min(Math.floor(CH / 240), Math.floor(CW / targetW)));
  Object.assign(view, { dpr, cssW, cssH, CW, CH, S });
  canvas.width = CW; canvas.height = CH;
  ctx.imageSmoothingEnabled = false;
  view.VW = Math.ceil(CW / S); view.VH = Math.ceil(CH / S);
  view.WH = clamp(Math.round(view.VH * 0.2), 40, 90);
  view.HZ = view.VH - view.WH;
  view.BY = view.HZ + Math.round(view.WH * 0.42);
  computeBounds();
  genStars();
  if (LB.look) bakeScreen(LB);
  if (LA && LA.look) bakeScreen(LA);
  for (const pool of cloudPools) for (const c of pool) if (c.active) c.y = Math.min(c.y, view.HZ * 0.8);
  bgClock.key = ''; placeBgClock();
  v3resize();
  needsRender = true;
}
function computeBounds() {
  const v = view;
  const dockArt = v.dockTop < 1e8 ? (v.dockTop * v.dpr) / v.S : 1e9;
  bounds.minX = 78; bounds.maxX = v.VW - 62;
  if (bounds.maxX < bounds.minX) bounds.minX = bounds.maxX = Math.round(v.VW / 2 + 8);
  const topArt = (v.insetTop * v.dpr) / v.S, botArt = v.insetBottom ? ((v.cssH - v.insetBottom) * v.dpr) / v.S : 1e9;
  bounds.minY = 44 + topArt;
  bounds.maxY = Math.min(v.HZ - 3, dockArt - 4, botArt - 4) - 34;
  if (bounds.maxY < bounds.minY) { const m = Math.max(40, (bounds.minY + bounds.maxY) / 2); bounds.minY = bounds.maxY = m; }
  plane.homeX = clamp(plane.homeX, bounds.minX, bounds.maxX); plane.homeY = clamp(plane.homeY, bounds.minY, bounds.maxY);
  plane.x = clamp(plane.x, bounds.minX, bounds.maxX); plane.y = clamp(plane.y, bounds.minY, bounds.maxY);
}
function homeDefault() {
  plane.homeX = clamp(Math.round(view.VW * 0.42), bounds.minX, bounds.maxX);
  plane.homeY = Math.round(clamp(Math.max(view.HZ - 150, lerp(bounds.minY, bounds.maxY, 0.3)), bounds.minY, bounds.maxY));
  plane.x = plane.homeX; plane.y = plane.homeY;
}

/* ---------- the plane ---------- */
const plane = { x: 200, y: 110, vx: 0, vy: 0, homeX: 200, homeY: 110, wander: 1, rx: 200, ry: 110, rot: 0, prop: 0, ax: 0, ay: 0, bump: 0, bumpV: 0 };
const input = { up: 0, down: 0, left: 0, right: 0 };
const marker = { life: 0, x: 0, y: 0 };
function steerTo(ax, ay, fromKeys) {
  plane.homeX = clamp(ax, bounds.minX, bounds.maxX);
  plane.homeY = clamp(ay, bounds.minY, bounds.maxY);
  plane.wander = 0.15;
  if (!fromKeys) { marker.life = 1; marker.x = plane.homeX; marker.y = plane.homeY; }
  duckEnv.attention = 1.6;
  duckEnv.attentionDir = ax > plane.x + 20 ? 0.9 : ax < plane.x - 40 ? -0.9 : 0;
  duckEnv.attentionGaze = ay > plane.y + 25 ? 1 : ay < plane.y - 25 ? -1 : 0;
}
function intensity() { return (0.55 + 0.45 * Math.min(world.speed, 2.2)) * (REDUCED ? 0.5 : 1) * (1 + cur.rain * 0.35); }
function updatePlane(dt) {
  const t = world.t, inten = intensity();
  const kx = input.right - input.left, ky = input.down - input.up;
  if (kx || ky) {
    /* in the 3D views, left and right follow the camera: along the river side-on, across it from ahead or behind */
    const fore = viewMode === 'side' ? 1 : Math.cos(V3.cam.yaw), across = viewMode === 'side' ? 0 : -Math.sin(V3.cam.yaw);
    plane.homeX = clamp(plane.homeX + kx * fore * 70 * dt, bounds.minX, bounds.maxX); plane.homeY = clamp(plane.homeY + ky * 60 * dt, bounds.minY, bounds.maxY);
    V3.homeLat = clamp(V3.homeLat + kx * across * 44 * dt, -LAT_MAX, LAT_MAX);
    plane.wander = 0.15;
  }
  plane.wander = approach(plane.wander, 1, 0.18, dt);
  const wa = plane.wander;
  const wx = (Math.sin(t * 0.13) * 12 + Math.sin(t * 0.29 + 1.7) * 6) * wa;
  const wy = (Math.sin(t * 0.17 + 0.5) * 8 + Math.sin(t * 0.37 + 2.1) * 4) * wa;
  const tx = clamp(plane.homeX + wx, bounds.minX, bounds.maxX), ty = clamp(plane.homeY + wy, bounds.minY, bounds.maxY);
  const ax = (tx - plane.x) * 2.0 - plane.vx * 2.6, ay = (ty - plane.y) * 2.0 - plane.vy * 2.6;
  plane.vx += ax * dt; plane.vy += ay * dt;
  const v = Math.hypot(plane.vx, plane.vy);
  if (v > 78) { plane.vx *= 78 / v; plane.vy *= 78 / v; }
  plane.x = clamp(plane.x + plane.vx * dt, bounds.minX, bounds.maxX);
  plane.y = clamp(plane.y + plane.vy * dt, bounds.minY, bounds.maxY);
  plane.ax = approach(plane.ax, ax, 10, dt); plane.ay = approach(plane.ay, ay, 10, dt);
  plane.bumpV += (-30 * plane.bump - 5 * plane.bumpV) * dt; plane.bump += plane.bumpV * dt;
  const turb = (vnoise(t * 0.9) * 1.4 + vnoise(t * 2.3 + 7) * 0.6) * inten;
  plane.rx = plane.x + Math.sin(t * 0.7) * 0.8 * inten;
  plane.ry = plane.y + (Math.sin(t * 1.25) * 2.2 + Math.sin(t * 0.55 + 1) * 1.5) * inten + turb + plane.bump;
  const rotT = clamp(plane.vy * 0.007 + Math.sin(t * 1.05 + 0.4) * 0.03 * inten + vnoise(t * 1.6 + 3) * 0.025 * inten + plane.bumpV * 0.004, -0.26, 0.26);
  plane.rot = approach(plane.rot, rotT, 3.2, dt);
  plane.prop += (12 + 9 * world.speed) * dt;
  if (marker.life > 0) marker.life -= dt * 1.1;
}
const _pt = [0, 0];
function planeToWorld(lx, ly) {
  const c = Math.cos(plane.rot), s = Math.sin(plane.rot);
  _pt[0] = plane.rx + lx * c - ly * s; _pt[1] = plane.ry + lx * s + ly * c;
  return _pt;
}
function worldToPlane(ax, ay) {
  const dx = ax - plane.rx, dy = ay - plane.ry, c = Math.cos(plane.rot), s = Math.sin(plane.rot);
  return [dx * c + dy * s, -dx * s + dy * c];
}
/* which duck (if any) is under an art-space point */
function duckAt(ax, ay, generous) {
  const [lx, ly] = worldToPlane(ax, ay);
  let best = -1, bd = 1e9;
  DUCKS.forEach((d, i) => {
    const hx = d.seat + d.lean, hy = d.hy + d.bob;
    const dh = Math.hypot(lx - hx, ly - hy), db = Math.hypot((lx - d.seat) * 0.8, ly + 14);
    const dd = Math.min(dh, db);
    if (dd < bd) { bd = dd; best = i; }
  });
  const onPlane = lx > -74 && lx < 58 && ly > -42 && ly < 36;
  if (bd < 11 + (generous ? 5 : 0)) return best;
  if (onPlane) return best;
  return -1;
}

/* ---------- ducks ---------- */
const duckEnv = { t: 0, speed: 1, inten: 1, ax: 0, ay: 0, rng: rngSim, attention: 0, attentionDir: 0, attentionGaze: 0, landmarkDir: 0, onQuack: d => hooks.onQuack && hooks.onQuack(d), onPhoto: d => photoFlash(d) };
const idle = { quack: 9, photo: 14 };
function waveDuck(i) {
  const d = DUCKS[i];
  d.wave = 1.6; d.happy = 1.7; d.bobV -= 26;
  d.quackQueue.length = 0; d.quackQueue.push(0.02, 0.34);
  const [wx, wy] = planeToWorld(d.seat, d.hy - 6);
  emit('heart', wx + 2, wy - 4); emit('heart', wx + 6, wy - 2); emit('note', wx - 4, wy - 6);
  if (hooks.onWave) hooks.onWave(i);
}
function photoFlash(d) {
  const [wx, wy] = planeToWorld(d.seat + 9, d.hy);
  for (let i = 0; i < 4; i++) emit('spark', wx + rf(rngSim, -4, 4), wy + rf(rngSim, -4, 3));
  flash.a = 0.18;
  if (hooks.onPhoto) hooks.onPhoto(d);
}
function updateDucks(dt) {
  duckEnv.t = world.t; duckEnv.speed = world.speed; duckEnv.inten = intensity();
  duckEnv.ax = plane.ax; duckEnv.ay = plane.ay;
  if (duckEnv.attention > 0) duckEnv.attention -= dt;
  const lm = landmarkInView();
  duckEnv.landmarkDir = lm ? (lm.sx > plane.x ? 0.85 : -0.85) : 0;
  for (const d of DUCKS) updateDuck(d, dt, duckEnv);
  idle.quack -= dt;
  if (idle.quack <= 0) {
    idle.quack = rf(rngSim, 12, 30);
    const d = DUCKS[(rngSim() * 3) | 0];
    if (d.wave <= 0) d.quackQueue.push(0.01);
  }
  idle.photo -= dt;
  if (idle.photo <= 0 && lm && Math.abs(lm.sx - view.VW * 0.5) < view.VW * 0.3) {
    const pip = DUCKS[1];
    if (pip.wave <= 0) { pip.photo = 1.5; idle.photo = rf(rngSim, 24, 40); }
  }
}

/* ---------- which landmark is on screen ---------- */
function tileX(x, off, tw) {
  let sx = mod(x - off, tw);
  if (sx > view.VW + 160) sx -= tw;
  return sx;
}
function landmarkInView() {
  if (!city) return null;
  let best = null, bd = 1e9;
  for (const lm of city.landmarks) {
    const Ly = city.byName[lm.L];
    const sx = tileX(lm.x, world.scroll * Ly.p - view.VW * 0.5, Ly.W);
    if (sx < view.VW * 0.08 || sx > view.VW * 0.92) continue;
    const d = Math.abs(sx - view.VW * 0.5);
    if (d < bd) { bd = d; best = lm; best.sx = sx; }
  }
  return best;
}

/* ---------- clouds ---------- */
const CLOUD_LAYERS = [
  { par: PAR.c0, pool: 10, alpha: 0.72, yMin: 0.04, yMax: 0.48, set: CLOUD_SMALL.concat(CLOUD_MED), drift: 1.2, count: [2, 7] },
  { par: PAR.c1, pool: 10, alpha: 0.88, yMin: 0.12, yMax: 0.6, set: CLOUD_MED.concat(CLOUD_BIG), drift: 2.5, count: [1.2, 6] },
  { par: PAR.c2, pool: 8, alpha: 1, yMin: 0.06, yMax: 0.42, set: CLOUD_BIG, drift: 4, count: [0.5, 4.5] },
  { par: PAR.c3, pool: 6, alpha: 0.4, yMin: 0.05, yMax: 0.85, set: CLOUD_WISP, drift: 9, count: [0, 3] },
];
const cloudPools = CLOUD_LAYERS.map(L => Array.from({ length: L.pool }, () => ({ active: false, x: 0, y: 0, idx: 0, a: 0, ta: 0, w: 1 })));
function cloudTarget(li) {
  const L = CLOUD_LAYERS[li];
  const amt = li === 3 ? cur.wisps : cur.clouds;
  const area = clamp((view.VW * view.HZ) / (480 * 216), 0.6, 2.2);
  return Math.min(L.pool, Math.round(lerp(L.count[0], L.count[1], amt) * area));
}
function spawnCloud(li, c, anywhere) {
  const L = CLOUD_LAYERS[li];
  c.active = true;
  c.idx = pick(rngSim, L.set);
  c.w = CLOUD_MASKS[c.idx].w;
  c.x = anywhere ? rf(rngSim, -c.w * 0.5, view.VW) : view.VW + rf(rngSim, 4, 90);
  c.y = Math.round(rf(rngSim, L.yMin, L.yMax) * view.HZ);
  c.a = anywhere ? 0 : 1; c.ta = 1;
}
function seedClouds() {
  cloudPools.forEach((pool, li) => {
    pool.forEach(c => { c.active = false; });
    const n = cloudTarget(li);
    for (let i = 0; i < n; i++) { spawnCloud(li, pool[i], true); pool[i].a = 1; }
  });
}
function updateClouds(dt) {
  const base = BASE_SPEED * world.speed;
  cloudPools.forEach((pool, li) => {
    const L = CLOUD_LAYERS[li];
    const target = cloudTarget(li);
    let active = 0;
    for (const c of pool) if (c.active && c.ta > 0) active++;
    for (const c of pool) {
      if (!c.active) continue;
      c.x -= (base * L.par + L.drift) * dt;
      if (active > target && c.ta > 0 && rngSim() < dt * 0.6) { c.ta = 0; active--; }
      c.a = approach(c.a, c.ta, 0.9, dt);
      if (c.ta === 0 && c.a < 0.02) c.active = false;
      if (c.x + c.w < -6) {
        if (active <= target && c.ta > 0) spawnCloud(li, c, false); else { c.active = false; if (c.ta > 0) active--; }
      }
    }
    if (active < target) {
      const free = pool.find(c => !c.active);
      if (free && rngSim() < dt * (target - active) * 0.8) spawnCloud(li, free, rngSim() < 0.6);
    }
  });
}
function drawCloudLayer(li) {
  const L = CLOUD_LAYERS[li], S = view.S, k = cur.k;
  for (const c of cloudPools[li]) {
    if (!c.active || c.a < 0.01) continue;
    const B = LB.clouds[c.idx], A = LA ? LA.clouds[c.idx] : null;
    const dx = Math.round(c.x * S), dy = Math.round(c.y * S), w = B.width * S, h = B.height * S;
    const a = c.a * L.alpha * (li === 3 ? 1 - 0.65 * cur.night : 1);
    if (A) { ctx.globalAlpha = a; ctx.drawImage(A, dx, dy, w, h); ctx.globalAlpha = a * k; ctx.drawImage(B, dx, dy, w, h); }
    else { ctx.globalAlpha = a; ctx.drawImage(B, dx, dy, w, h); }
  }
  ctx.globalAlpha = 1;
}

/* ---------- stars, shooting stars, birds ---------- */
let stars = [];
function genStars() {
  const r = mulberry32(77);
  const n = Math.round(view.VW * view.HZ / 620);
  stars = [];
  const mx = Math.round(TOD_DEF.night.bx * view.VW), my = Math.round(TOD_DEF.night.by * view.HZ);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * view.VW), y = Math.floor(Math.pow(r(), 1.3) * view.HZ * 0.82);
    if (Math.hypot(x - mx, y - my) < 16) continue;
    stars.push({ x, y, b: 0.35 + r() * 0.65, f: 0.6 + r() * 2.2, ph: r() * TAU, big: r() < 0.08, c: r() < 0.2 ? '#fff1c8' : r() < 0.3 ? '#cfe0ff' : '#ffffff' });
  }
}
function drawStars() {
  if (cur.stars < 0.02) return;
  const S = view.S, t = world.t;
  for (const s of stars) {
    const a = cur.stars * s.b * (0.55 + 0.45 * Math.sin(t * s.f + s.ph));
    if (a < 0.03) continue;
    ctx.globalAlpha = a; ctx.fillStyle = s.c;
    ctx.fillRect(s.x * S, s.y * S, S, S);
    if (s.big) { ctx.globalAlpha = a * 0.45; ctx.fillRect((s.x - 1) * S, s.y * S, S * 3, S); ctx.fillRect(s.x * S, (s.y - 1) * S, S, S * 3); }
  }
  ctx.globalAlpha = 1;
}
const shoot = { on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, next: 7 };
function updateShoot(dt) {
  if (shoot.on) { shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life -= dt; if (shoot.life <= 0) shoot.on = false; return; }
  if (cur.stars < 0.5 || REDUCED) return;
  shoot.next -= dt;
  if (shoot.next <= 0) {
    shoot.next = rf(rngSim, 9, 22);
    Object.assign(shoot, { on: true, x: rf(rngSim, 0.35, 1) * view.VW, y: rf(rngSim, 0.04, 0.32) * view.HZ, vx: -rf(rngSim, 150, 210), vy: rf(rngSim, 40, 70), life: 0.85 });
  }
}
function drawShoot() {
  if (!shoot.on) return;
  const S = view.S, a = Math.min(1, shoot.life * 2) * cur.stars;
  ctx.fillStyle = '#fff6dc';
  for (let i = 0; i < 12; i++) {
    ctx.globalAlpha = a * (1 - i / 12);
    ctx.fillRect(Math.round((shoot.x - shoot.vx * i * 0.006) * S), Math.round((shoot.y - shoot.vy * i * 0.006) * S), S, S);
  }
  ctx.globalAlpha = 1;
}
const flock = { on: false, x: 0, y: 0, v: 16, m: [], next: 4 };
function updateBirds(dt) {
  if (flock.on) {
    flock.x -= (flock.v + BASE_SPEED * world.speed * 0.12) * dt;
    if (flock.x < -60) flock.on = false;
    return;
  }
  if (cur.night > 0.5 || cur.rain > 0.5) return;
  flock.next -= dt;
  if (flock.next <= 0) {
    flock.next = rf(rngSim, 16, 34);
    const n = ri(rngSim, 3, 5);
    flock.m = [];
    for (let i = 0; i < n; i++) flock.m.push({ dx: i * 7 + rf(rngSim, -1, 1), dy: Math.abs(i - (n - 1) / 2) * 3 + rf(rngSim, -1, 1), ph: rngSim() * 3 });
    Object.assign(flock, { on: true, x: view.VW + 8, y: rf(rngSim, 0.1, 0.42) * view.HZ, v: rf(rngSim, 10, 20) });
  }
}
function drawBirds() {
  if (!flock.on) return;
  const S = view.S;
  ctx.fillStyle = cur.day > 0.5 ? '#3d3a48' : '#2b2433';
  for (const b of flock.m) {
    const f = BIRD_ROWS[Math.floor(world.t * 7 + b.ph) % 3];
    const bx = Math.round(flock.x + b.dx), by = Math.round(flock.y + b.dy + Math.sin(world.t * 2 + b.ph) * 1.2);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) if (f[j][i] === 'k') ctx.fillRect((bx + i) * S, (by + j) * S, S, S);
  }
}

/* ---------- boats and vehicles ---------- */
const boats = { list: [], next: 1 };
function spawnBoat() {
  const C = city;
  const ti = (rngSim() * C.boats.length) | 0;
  if (boats.list.some(b => b.ti === ti)) return;
  const bt = C.boats[ti];
  const dir = rngSim() < 0.5 ? 1 : -1;
  const y = Math.round(lerp(view.HZ + 5, view.BY + 10, bt.depth));
  const df = lerp(0.55, 1.05, bt.depth);
  const w = bt.frames[0].w;
  const vs = dir * bt.speed - BASE_SPEED * world.speed * df;
  boats.list.push({ ti, dir, y, df, x: vs < 0 ? view.VW + 6 : -w - 6, w, ph: rngSim() * 5 });
}
function updateBoats(dt) {
  if (!city) return;
  for (let i = boats.list.length - 1; i >= 0; i--) {
    const b = boats.list[i], bt = city.boats[b.ti];
    b.x += (b.dir * bt.speed - BASE_SPEED * world.speed * b.df) * dt;
    if (b.x < -b.w - 40 || b.x > view.VW + 40) boats.list.splice(i, 1);
  }
  boats.next -= dt;
  if (boats.next <= 0) { boats.next = rf(rngSim, 4, 11); if (boats.list.length < 2) spawnBoat(); }
}
function drawBoats(behind) {
  const S = view.S, k = cur.k;
  for (const b of boats.list) {
    if ((b.y < view.BY) !== behind) continue;
    const bt = city.boats[b.ti];
    const fi = bt.fps ? Math.floor(world.t * bt.fps + b.ph) % bt.frames.length : 0;
    const B = LB.boats[b.ti][fi], A = LA ? LA.boats[b.ti][fi] : null;
    const h = B.height;
    const bob = Math.round(Math.sin(world.t * 1.6 + b.ph) * 0.6);
    blit(B, b.x, b.y, b.dir < 0, true, 0.22 * (0.6 + cur.reflA));
    ctx.fillStyle = cur.night > 0.5 ? 'rgba(200,215,255,0.35)' : 'rgba(255,255,255,0.6)';
    const wx = b.dir > 0 ? b.x - 3 : b.x + b.w + 1;
    for (let i = 0; i < 3; i++) {
      const len = 4 - i, off = (b.dir > 0 ? -1 : 1) * i * 4;
      ctx.globalAlpha = 0.6 - i * 0.18;
      ctx.fillRect(Math.round((wx + off) * S), Math.round((b.y + (i & 1)) * S), len * S, S);
    }
    ctx.globalAlpha = 1;
    if (A) { blit(A, b.x, b.y - h + bob, b.dir < 0, false, 1); blit(B, b.x, b.y - h + bob, b.dir < 0, false, k); }
    else blit(B, b.x, b.y - h + bob, b.dir < 0, false, 1);
  }
}
function blit(img, ax, ay, fx, fy, alpha) {
  const S = view.S, w = img.width * S, h = img.height * S;
  const dx = Math.round(ax * S), dy = Math.round(ay * S);
  ctx.globalAlpha = alpha;
  if (!fx && !fy) ctx.drawImage(img, dx, dy, w, h);
  else { ctx.save(); ctx.translate(dx + (fx ? w : 0), dy + (fy ? h : 0)); ctx.scale(fx ? -1 : 1, fy ? -1 : 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore(); }
  ctx.globalAlpha = 1;
}
const veh = { x: 0, wait: 2 };
function resetVehicle() { if (city && city.vehicle) { veh.x = city.vehicle.x0 - city.vehicle.sprite.w; veh.wait = 3; } }
function updateVehicle(dt) {
  const v = city && city.vehicle;
  if (!v) return;
  if (veh.wait > 0) { veh.wait -= dt; return; }
  veh.x += v.speed * dt;
  if (veh.x > v.x1) { veh.x = v.x0 - v.sprite.w; veh.wait = v.idle * rf(rngSim, 0.6, 1.4); }
}
function drawVehicle(off, ay, tw) {
  const v = city.vehicle;
  if (!v || veh.wait > 0) return;
  const S = view.S;
  const bx0 = tileX(v.x0, off, tw), span = v.x1 - v.x0;
  if (bx0 > view.VW || bx0 + span < 0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(Math.round(bx0 * S), 0, Math.round(span * S), view.CH); ctx.clip();
  const sx = bx0 + (veh.x - v.x0), sy = ay + v.y;
  if (LA) { blit(LA.vehicle, sx, sy, false, false, 1); blit(LB.vehicle, sx, sy, false, false, cur.k); }
  else blit(LB.vehicle, sx, sy, false, false, 1);
  ctx.restore();
}

/* ---------- tiles ---------- */
/* wrapA: alpha for the part of a tile that belongs to the other pass of the
   loop (across the seam), or 1 to draw the loop as one continuous strip. */
function drawTile(img, off, ay, alpha, wrapA, firstWrapped) {
  const S = view.S, tw = img.width, th = img.height;
  let o = off % tw; if (o < 0) o += tw;
  const oi = Math.floor(o);
  let dx = -Math.round((o - oi) * S), sx = oi, rem = view.VW + 1, seg = 0;
  const dy = Math.round(ay * S);
  const wa = wrapA == null ? 1 : wrapA;
  while (rem > 0) {
    const w = Math.min(tw - sx, rem);
    const wrapped = wa < 1 && (firstWrapped ? seg === 0 : seg > 0);
    const a = alpha * (wrapped ? wa : 1);
    if (a > 0.003) { ctx.globalAlpha = a; ctx.drawImage(img, sx, 0, w, th, dx, dy, w * S, th * S); }
    dx += w * S; rem -= w; sx = 0; seg++;
  }
  ctx.globalAlpha = 1;
}
function drawTileRow(img, off, row, ayRow, alpha) {
  const S = view.S, tw = img.width;
  let o = off % tw; if (o < 0) o += tw;
  const oi = Math.floor(o);
  let dx = -Math.round((o - oi) * S), sx = oi, rem = view.VW + 1;
  const dy = Math.round(ayRow * S);
  ctx.globalAlpha = alpha;
  while (rem > 0) {
    const w = Math.min(tw - sx, rem);
    ctx.drawImage(img, sx, row, w, 1, dx, dy, w * S, S);
    dx += w * S; rem -= w; sx = 0;
  }
}
/* Distant layers show more than half the loop at once, so near the seam they
   would put landmarks from the far end of the route beside those of the near
   end. Near the seam such a layer is drawn in narrow strips: content close
   to the seam stays whole (the join is continuous), content far from it on
   the other side of the seam fades into the haze, and as the camera crosses
   the seam the two sides trade places smoothly. */
function drawLayer(i, off, ay, sc) {
  const Ly = city.layers[i];
  const fade = sc != null && Ly.p < (Ly.seamP || 0.5) && Ly.seamFade !== false;
  const half = view.VW * 0.5, s = fade ? mod(sc, ROUTE) : 0;
  const win = half / Ly.p, F = Math.min(win * 0.6, ROUTE * 0.25);
  const d = Math.min(s, ROUTE - s);
  if (!fade || d > F + win) {
    if (LA) { drawTile(LA.L[i], off, ay, 1); drawTile(LB.L[i], off, ay, cur.k); }
    else drawTile(LB.L[i], off, ay, 1);
    return;
  }
  const kd = smoothstep(0, F, d), U0 = 120, U1 = Math.max(U0 + 100, Math.min(win * 0.55, 700));
  const atSeam0 = s < ROUTE / 2;
  const S = view.S, CH = 6;
  const imgs = LA ? [[LA.L[i], 1], [LB.L[i], cur.k]] : [[LB.L[i], 1]];
  const o = mod(off, Ly.W), x0 = -(o - Math.floor(o));
  const dy = Math.round(ay * S), th = Ly.R.h;
  for (let x = x0; x < view.VW + 1; x += CH) {
    const r = s + (x + CH / 2 - half) / Ly.p;          // unwrapped route position of this strip
    let a;
    if (r < 0 || r >= ROUTE) {                           // across the seam
      const u = r < 0 ? -r : r - ROUTE;
      a = (1 - smoothstep(U0, U1, u)) * (1 - kd);
    } else {
      const u = atSeam0 ? r : ROUTE - r;
      a = lerp(1 - smoothstep(U0, U1, u), 1, kd);
    }
    if (a < 0.003) continue;
    let sx = mod(Math.floor(o) + Math.round(x - x0), Ly.W);
    let w = CH, dx = Math.round(x * S);
    for (const [img, ka] of imgs) {
      ctx.globalAlpha = a * ka;
      let sx2 = sx, w2 = w, dx2 = dx;
      while (w2 > 0) {
        const ww = Math.min(Ly.W - sx2, w2);
        ctx.drawImage(img, sx2, 0, ww, th, dx2, dy, ww * S, th * S);
        dx2 += ww * S; w2 -= ww; sx2 = 0;
      }
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------- animated landmark details ---------- */
const DARK_HAND = '#2b2523';
const clock = { h: 0, m: 0, next: 0, hms: [0, 0, 0] };
function tickClock(nowMs) {
  if (nowMs < clock.next) return;
  clock.next = nowMs + 1000;
  const t = timeIn(CITY_TZ[city ? city.id : 'philadelphia'], clock.hms);
  clock.m = t[1] + t[2] / 60; clock.h = (t[0] % 12) + clock.m / 60;
}
function clockHand(cx, cy, ang, len, S) {
  const sx = Math.sin(ang), cy2 = Math.cos(ang);
  for (let s = 0; s <= len; s++) ctx.fillRect(Math.round(cx + sx * s) * S, Math.round(cy - cy2 * s) * S, S, S);
}
function drawDyn(layer, off, ay, tw) {
  const C = city, S = view.S, t = world.t, nightF = smoothstep(0.35, 0.9, cur.E);
  const D = C.dyn;
  if (nightF > 0.03) for (const b of D.blink) {
    if (b.L !== layer) continue;
    const sx = tileX(b.x, off, tw);
    if (sx < -4 || sx > view.VW + 4) continue;
    const ph = (t * 0.8 + b.x * 0.0137) % 1.6;
    if (ph > 0.18) continue;
    const y = ay + b.y;
    ctx.globalAlpha = nightF * 0.35; ctx.fillStyle = '#ff4a3a';
    ctx.fillRect((Math.round(sx) - 1) * S, (y - 1) * S, 3 * S, 3 * S);
    ctx.globalAlpha = nightF; ctx.fillStyle = '#ff6a58';
    ctx.fillRect(Math.round(sx) * S, y * S, S, S);
  }
  ctx.globalAlpha = 1;
  if (D.clocks) for (const c of D.clocks) {
    if (c.L !== layer) continue;
    const sx = tileX(c.x, off, tw);
    if (sx < -8 || sx > view.VW + 8) continue;
    ctx.fillStyle = DARK_HAND;
    const cx = Math.round(sx), cy = ay + c.y;
    clockHand(cx, cy, clock.h / 12 * TAU, c.r - 1, S);
    clockHand(cx, cy, clock.m / 60 * TAU, c.r, S);
  }
  if (D.eye && D.eye.L === layer) {
    const e = D.eye, sx = tileX(e.x, off, tw);
    if (sx > -70 && sx < view.VW + 70) {
      const cx = sx, cy = ay + e.y, rot = t * 0.045;
      ctx.fillStyle = nightF > 0.5 ? 'rgba(170,200,255,0.55)' : 'rgba(225,232,240,0.85)';
      for (let i = 0; i < 16; i++) {
        const a = rot + i * TAU / 16, c = Math.cos(a), s = Math.sin(a);
        for (let r = 6; r < e.r - 1; r += 3) ctx.fillRect(Math.round(cx + c * r) * S, Math.round(cy + s * r) * S, S, S);
      }
      for (let i = 0; i < e.n; i++) {
        const a = rot + i * TAU / e.n, x = Math.round(cx + Math.cos(a) * (e.r + 1.5)), y = Math.round(cy + Math.sin(a) * (e.r + 1.5));
        ctx.fillStyle = nightF > 0.5 ? (i % 2 ? '#ffd9f2' : '#bfe0ff') : '#eef4f8';
        ctx.fillRect((x - 1) * S, (y - 1) * S, 2 * S, 2 * S);
        if (nightF < 0.5) { ctx.fillStyle = '#7f9fb8'; ctx.fillRect(x * S, y * S, S, S); }
      }
    }
  }
  if (D.sparkle && D.sparkle.L === layer && nightF > 0.5) {
    const SX = D.sparkle.x, sx0 = tileX(SX, off, tw);
    if (sx0 > -40 && sx0 < view.VW + 40) {
      const cyc = t % 40;
      const pts = D.sparkle.pts;
      if (cyc < 9) {
        ctx.fillStyle = '#ffffff';
        const n = pts.length >> 1, seed = Math.floor(t * 14);
        for (let i = 0; i < 46; i++) {
          const j = Math.floor(hash1(seed * 31.7 + i * 7.3) * n);
          ctx.globalAlpha = nightF;
          ctx.fillRect(Math.round(sx0 + (pts[j * 2] - SX)) * S, (ay + pts[j * 2 + 1]) * S, S, S);
        }
        ctx.globalAlpha = 1;
      }
      const b = D.beacon, bx = (sx0 + (b.x - SX)) * S, by = (ay + b.y) * S;
      for (const base of [t * 0.9, t * 0.9 + Math.PI]) {
        const c = Math.cos(base), len = 170 * Math.abs(c) * S, dir = c > 0 ? 1 : -1;
        if (len < 6 * S) continue;
        ctx.globalAlpha = 0.5 * nightF * (0.35 + 0.65 * Math.abs(c));
        ctx.save(); ctx.translate(bx, by); ctx.scale(dir, 1);
        ctx.drawImage(beamSpr, 0, -len * 0.06 - 3 * S, len, (len * 0.06 + 3 * S) * 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  if (D.signs && nightF > 0.2) {
    for (const g of D.signs) {
      if (g.L !== layer) continue;
      const sx = tileX(g.x, off, tw);
      if (sx < -6 || sx > view.VW + 6) continue;
      const x = Math.round(sx) * S, y = (ay + g.y) * S;
      if (g.mode === 'blink') {
        const on = Math.sin(t * 2.6 + g.ph) > -0.2;
        ctx.globalAlpha = (on ? 0.35 : 0.55) * nightF;
        ctx.fillStyle = on ? css(g.e) : '#1a1626';
        ctx.fillRect(x, y, g.w * S, g.h * S);
      } else {
        const row = Math.floor((t * 10 + g.ph * 3) % g.h);
        ctx.globalAlpha = 0.65 * nightF; ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y + row * S, g.w * S, S);
        ctx.fillRect(x, y + ((row + (g.h >> 1)) % g.h) * S, g.w * S, S);
      }
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- water ---------- */
function drawWater() {
  const S = view.S, t = world.t, HZ = view.HZ, WH = view.WH, k = cur.k;
  const dy = HZ * S;
  if (LA) { ctx.drawImage(LA.water, 0, 0, view.VW, WH, 0, dy, view.VW * S, WH * S); ctx.globalAlpha = k; }
  ctx.drawImage(LB.water, 0, 0, view.VW, WH, 0, dy, view.VW * S, WH * S);
  ctx.globalAlpha = 1;
  const rh = Math.min(WH, HZ);
  if (reflBuf.width !== view.CW || reflBuf.height !== rh * S) sizeCanvas(reflBuf, view.CW, rh * S);
  reflBuf.ctx.clearRect(0, 0, reflBuf.width, reflBuf.height);
  reflBuf.ctx.drawImage(canvas, 0, (HZ - rh) * S, view.CW, rh * S, 0, 0, view.CW, rh * S);
  const ra = cur.reflA;
  for (let j = 0; j < rh; j++) {
    if ((j & 3) === 3) continue;
    const wave = Math.sin(j * 0.9 + t * 1.7) * (0.6 + j * 0.05) + Math.sin(j * 2.3 - t * 2.6) * 0.4;
    ctx.globalAlpha = ra * (1 - (j / rh) * 0.7);
    ctx.drawImage(reflBuf, 0, (rh - 1 - j) * S, view.CW, S, Math.round(wave * S * 0.75), dy + j * S, view.CW, S);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = cur.hiCss;
  const bodyX = cur.bodyX * view.VW;
  if (cur.vis > 0.15) {
    for (let i = 0; i < 22; i++) {
      const row = 2 + ((i * 7) % Math.max(3, WH - 4));
      const fl = hash1(i * 13.1 + Math.floor(t * 4 + i * 0.37));
      if (fl < 0.4) continue;
      const spread = 3 + row * 0.5;
      const x = bodyX + (hash1(i * 3.7 + Math.floor(t * 2 + i * 0.3)) - 0.5) * spread * 2;
      ctx.globalAlpha = cur.vis * (0.25 + fl * 0.45) * (1 - row / WH * 0.5);
      ctx.fillRect(Math.round(x) * S, (HZ + row) * S, (1 + Math.floor(fl * 4)) * S, S);
    }
  }
  const scrollN = world.scroll;
  for (let i = 0; i < 30; i++) {
    const row = 1 + ((i * 11) % Math.max(2, WH - 2));
    const df = 0.55 + 0.5 * row / WH;
    const x = mod(i * 97.3 - scrollN * df, view.VW + 30) - 15;
    const tw = Math.sin(t * 1.8 + i * 1.7);
    if (tw < 0.25) continue;
    ctx.globalAlpha = 0.22 * tw * (cur.night > 0.5 ? 0.6 : 1);
    ctx.fillRect(Math.round(x) * S, (HZ + row) * S, (2 + (i % 3)) * S, S);
  }
  ctx.globalAlpha = 1;
}
/* ---------- bridges that cross the river ----------
   The camera looks across the water, so a bridge runs from the far bank
   straight toward it. Each one is drawn in true perspective, row by row:
   a point z px out from the bank (measured at bank scale) has parallax
   pz = D / (D - z) and lands  J0 * (pz - 1)  rows below the bank line, so
   the far end stays pinned to the quay while the near end sweeps past. */
const xingCol = { key: '', css: [] };
function matCss(m) {
  const B = LB.lut, i = m * 4;
  if (!LA) return 'rgb(' + B[i] + ',' + B[i + 1] + ',' + B[i + 2] + ')';
  const A = LA.lut, k = cur.k;
  return 'rgb(' + Math.round(lerp(A[i], B[i], k)) + ',' + Math.round(lerp(A[i + 1], B[i + 1], k)) + ',' + Math.round(lerp(A[i + 2], B[i + 2], k)) + ')';
}
function pxLine(x0, y0, x1, y1, S) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  while (n++ < 2000) {
    ctx.fillRect(x0 * S, y0 * S, S, S);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function drawCrossings(sc) {
  const X = city.crossings;
  if (!X.length) return;
  const S = view.S, HZ = view.HZ, VH = view.VH, VW = view.VW, half = VW * 0.5, J0 = city.J0;
  const D = city.camD || 360;
  const nightF = smoothstep(0.35, 0.9, cur.E);
  for (const c of X) {
    const fx = mod(c.r - sc + ROUTE * 0.5, ROUTE) - ROUTE * 0.5;   // bank-scale offset from the screen centre
    const reach = Math.abs(fx) - c.w * 3;
    if (reach > half) continue;
    const h = c.h, w = c.w, th = c.th || 2, pw = c.pw || 3;
    const z1 = c.len || 1e9, z0 = c.z0 || 0;
    const side = fx >= 0 ? -1 : 1;              // which flank faces the camera
    const cTop = matCss(c.top), cSide = matCss(c.side), cPier = matCss(c.pier || c.side), cRail = matCss(c.rail || c.side);
    const cLamp = c.lamp ? matCss(c.lamp) : null;
    const cWalk = c.walk ? matCss(c.walk) : null, cMark = c.mark ? matCss(c.mark) : null;
    const piers = c.piers || [];
    const items = (c.towers || []).slice().sort((a, b) => a.z - b.z);
    let it = 0, pi = 0, lastY = -1e9, lastEdge = null;
    /* shadow on the water */
    ctx.fillStyle = 'rgba(8,14,30,' + (0.2 * (1 - cur.night * 0.4)).toFixed(3) + ')';
    for (let j = Math.max(0, J0 * (D / (D - z0) - 1)); j < VH - HZ; j++) {
      const pz = 1 + j / J0, z = D * (1 - 1 / pz);
      if (z > z1) break;
      const xc = half + fx * pz, hw = w * pz * 0.5;
      ctx.fillRect(Math.round(xc - hw + h * 0.25 * pz) * S, (HZ + Math.floor(j)) * S, Math.round(hw * 2) * S, S);
    }
    let zPrev = z0;
    for (let j = J0 * (D / (D - z0) - 1); j < 400; j += 0.5) {
      const pz = 1 + j / J0, z = D * (1 - 1 / pz);
      if (z > z1) break;
      const xc = half + fx * pz, hw = w * pz * 0.5;
      const yD = HZ + j - h * pz, yW = HZ + j;
      if (yD > VH + 4) break;
      /* towers and other upright pieces, far to near */
      while (it < items.length && items[it].z <= z) {
        const t = items[it++], pt = D / (D - t.z), jt = J0 * (pt - 1);
        const img = LB.spr[t.spr], iw = img.width * pt * (t.s || 1), ih = img.height * pt * (t.s || 1);
        const tx = Math.round(half + (fx + (t.lat || 0)) * pt - iw / 2), ty = Math.round(HZ + jt - (t.base || 0) * pt - ih);
        if (LA) { ctx.drawImage(LA.spr[t.spr], tx * S, ty * S, Math.round(iw) * S, Math.round(ih) * S); ctx.globalAlpha = cur.k; }
        ctx.drawImage(img, tx * S, ty * S, Math.round(iw) * S, Math.round(ih) * S);
        ctx.globalAlpha = 1;
      }
      /* the flank we can see: fascia, deepening into arches and piers */
      let depth = th * pz;
      let near = 1e9;
      for (const pzr of piers) { const d = Math.abs(z - pzr); if (d < near) near = d; }
      if (near < pw * 0.5) depth = h * pz;
      else if (c.arch) { const k = clamp(1 - (near - pw * 0.5) / c.arch, 0, 1); depth = Math.max(depth, (th + (h - th) * (1 - Math.sqrt(1 - k * k))) * pz); }
      const xe = xc + side * hw;
      if (lastEdge !== null) {
        const xa = Math.round(Math.min(xe, lastEdge)), xw = Math.max(1, Math.round(Math.abs(xe - lastEdge)));
        ctx.fillStyle = near < pw * 0.5 ? cPier : cSide;
        ctx.fillRect(xa * S, Math.round(yD) * S, xw * S, Math.max(1, Math.round(depth)) * S);
      }
      lastEdge = xe;
      /* a pier's near face spans the full width */
      while (pi < piers.length && piers[pi] + pw * 0.5 <= z) {
        if (piers[pi] >= z0) { ctx.fillStyle = cPier; ctx.fillRect(Math.round(xc - hw) * S, Math.round(yD) * S, Math.round(hw * 2) * S, Math.max(1, Math.round(yW - yD)) * S); }
        pi++;
      }
      /* the deck */
      const ry = Math.round(yD);
      if (ry !== lastY) {
        ctx.fillStyle = cTop;
        ctx.fillRect(Math.round(xc - hw) * S, ry * S, Math.max(1, Math.round(hw * 2)) * S, S);
        if (cWalk) {
          const ww = Math.max(1, Math.round(hw * 0.26));
          ctx.fillStyle = cWalk;
          ctx.fillRect(Math.round(xc - hw) * S, ry * S, ww * S, S);
          ctx.fillRect((Math.round(xc + hw) - ww) * S, ry * S, ww * S, S);
        }
        if (cMark && (Math.floor(z / 9) & 1)) { ctx.fillStyle = cMark; ctx.fillRect(Math.round(xc - pz * 0.4) * S, ry * S, Math.max(1, Math.round(pz * 0.8)) * S, S); }
        ctx.fillStyle = cRail;
        ctx.fillRect(Math.round(xc - hw) * S, (ry - 1) * S, S, S);
        ctx.fillRect((Math.round(xc + hw) - 1) * S, (ry - 1) * S, S, S);
        if (cLamp && c.lampEvery && Math.floor(z / c.lampEvery) !== Math.floor(zPrev / c.lampEvery)) {
          const lh = Math.max(2, Math.round(3 * pz));
          ctx.fillRect(Math.round(xc + side * hw) * S, (ry - lh) * S, S, lh * S);
          ctx.fillStyle = cLamp; ctx.globalAlpha = 0.35 + 0.65 * nightF;
          ctx.fillRect(Math.round(xc + side * hw) * S, (ry - lh - 1) * S, S, S);
          ctx.globalAlpha = 1;
        }
        lastY = ry; zPrev = z;
      }
    }
    /* cables, chains, trusses: poly-lines of [z, height, lateral] */
    if (c.lines) for (const ln of c.lines) {
      ctx.fillStyle = matCss(ln.m);
      let px = 0, py = 0, has = false;
      for (const q of ln.pts) {
        if (q[0] >= D * 0.9) break;
        const pq = D / (D - q[0]);
        if (J0 * (pq - 1) > VH - HZ + 6) break;      // the deck has left the bottom of the screen
        const x = half + (fx + q[2]) * pq, y = HZ + J0 * (pq - 1) - q[1] * pq;
        if (has && (Math.max(x, px) > -20 && Math.min(x, px) < VW + 20)) pxLine(px, py, x, y, S);
        px = x; py = y; has = true;
      }
    }
  }
}

/* ---------- rain ---------- */
const drops = Array.from({ length: 320 }, () => ({ on: false, x: 0, y: 0, v: 0, z: 1, end: 0 }));
const ripples = Array.from({ length: 48 }, () => ({ on: false, x: 0, y: 0, t: 0 }));
function rainTarget() { return Math.round(cur.rain * 230 * clamp(view.VW * view.VH / 130000, 0.5, 2.4)); }
function resetDrop(d, anywhere) {
  d.on = true; d.z = rf(rngSim, 0.55, 1);
  d.x = rf(rngSim, -10, view.VW + 60); d.y = anywhere ? rf(rngSim, -10, view.VH) : rf(rngSim, -30, -4);
  d.v = (170 + 90 * d.z);
  d.end = view.HZ + rf(rngSim, 1, view.WH - 1);
}
function updateRain(dt) {
  const target = rainTarget();
  let n = 0;
  const wind = (34 + 26 * world.speed);
  for (const d of drops) {
    if (!d.on) continue;
    n++;
    d.y += d.v * dt; d.x -= wind * d.z * dt;
    if (d.y > d.end) {
      if (d.end < view.VH - 1 && rngSim() < 0.5) {
        for (let i = 0; i < ripples.length; i++) { const r = ripples[i]; if (!r.on) { r.on = true; r.x = d.x; r.y = Math.round(d.end); r.t = 0; break; } }
      }
      if (n > target) { d.on = false; n--; } else resetDrop(d, false);
    }
  }
  if (n < target) for (const d of drops) { if (n >= target) break; if (!d.on) { resetDrop(d, rngSim() < 0.5); n++; } }
  for (const r of ripples) if (r.on) { r.t += dt; if (r.t > 0.6) r.on = false; }
}
function drawRain() {
  const S = view.S;
  ctx.fillStyle = cur.rainCol;
  for (const r of ripples) {
    if (!r.on) continue;
    const rr = 1 + Math.floor(r.t * 7);
    ctx.globalAlpha = (1 - r.t / 0.6) * 0.55;
    ctx.fillRect(Math.round(r.x - rr) * S, r.y * S, S, S); ctx.fillRect(Math.round(r.x + rr) * S, r.y * S, S, S);
  }
  for (const d of drops) {
    if (!d.on) continue;
    ctx.globalAlpha = cur.rainA * d.z;
    const x = Math.round(d.x) * S, y = Math.round(d.y) * S;
    ctx.fillRect(x, y, S, 2 * S); ctx.fillRect(x - S, y + 2 * S, S, 2 * S);
  }
  ctx.globalAlpha = 1;
}

/* ---------- particles, puffs, speed lines ---------- */
const parts = Array.from({ length: 32 }, () => ({ on: false, type: '', x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1 }));
const PART_SPR = {
  heart: ['.#.#.', '#####', '.###.', '..#..'],
  note: ['.##', '.#.', '.#.', '##.', '##.'],
  spark: ['.#.', '###', '.#.'],
};
const PART_COL = { heart: '#ff6f91', note: '#fff3d6', spark: '#ffffff' };
function emit(type, x, y) {
  const p = parts.find(p => !p.on);
  if (!p) return;
  Object.assign(p, { on: true, type, x, y, vx: rf(rngSim, -8, 4) - 6, vy: rf(rngSim, -20, -12), life: type === 'spark' ? 0.45 : 1.3, max: type === 'spark' ? 0.45 : 1.3 });
}
const puffs = Array.from({ length: 16 }, () => ({ on: false, x: 0, y: 0, r: 1, life: 0 }));
let puffT = 0;
const lines = Array.from({ length: 20 }, () => ({ on: false, x: 0, y: 0, len: 8, v: 300 }));
function updateFx(dt) {
  for (const p of parts) if (p.on) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 6 * dt; p.life -= dt; if (p.life <= 0) p.on = false; }
  puffT -= dt;
  if (puffT <= 0) {
    puffT = 0.32 / Math.max(0.4, world.speed);
    const p = puffs.find(p => !p.on);
    if (p) { const [x, y] = planeToWorld(44, 12); Object.assign(p, { on: true, x, y, r: 1, life: 1.5 }); }
  }
  for (const p of puffs) if (p.on) { p.x -= (BASE_SPEED * world.speed * 0.9 + 10) * dt; p.y -= 2 * dt; p.r += 1.6 * dt; p.life -= dt; if (p.life <= 0) p.on = false; }
  const rate = REDUCED ? 0 : Math.max(0, world.speed - 0.85) * 5;
  if (rngSim() < rate * dt) {
    const l = lines.find(l => !l.on);
    if (l) Object.assign(l, { on: true, x: view.VW + 4, y: rf(rngSim, 0.04, 0.95) * view.HZ, len: ri(rngSim, 6, 16), v: 220 + 170 * world.speed });
  }
  for (const l of lines) if (l.on) { l.x -= l.v * dt; if (l.x + l.len < -2) l.on = false; }
}
function drawSprite(rows, x, y, col, a) {
  const S = view.S;
  ctx.fillStyle = col; ctx.globalAlpha = a;
  const bx = Math.round(x), by = Math.round(y);
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) if (rows[j][i] === '#') ctx.fillRect((bx + i) * S, (by + j) * S, S, S);
  ctx.globalAlpha = 1;
}
function drawLines() {
  const S = view.S;
  ctx.fillStyle = cur.speedCol;
  for (const l of lines) if (l.on) ctx.fillRect(Math.round(l.x) * S, Math.round(l.y) * S, l.len * S, S);
}
function drawPuffs() {
  const S = view.S;
  ctx.fillStyle = cur.night > 0.5 ? '#7d86a8' : '#efe9e0';
  for (const p of puffs) {
    if (!p.on) continue;
    ctx.globalAlpha = 0.45 * (p.life / 1.5);
    const r = Math.round(p.r);
    ctx.fillRect(Math.round(p.x - r) * S, Math.round(p.y - r) * S, (2 * r + 1) * S, (2 * r + 1) * S);
  }
  ctx.globalAlpha = 1;
}
function drawParts() {
  for (const p of parts) if (p.on) drawSprite(PART_SPR[p.type], p.x, p.y, PART_COL[p.type], Math.min(1, p.life / p.max * 2));
}
const flash = { a: 0 };

/* ---------- city change through a cloud bank ---------- */
const trans = { on: false, t: 0, dur: 3.8, swapped: false, to: null, pending: null, x: 0, w: 0, lead: [], trail: [], inner: [], bumped: false };
function startTransition(id, instant) {
  if (instant || !city) { swapCity(id); return; }
  if (trans.on) { if (!trans.swapped) trans.to = id; else trans.pending = id; return; }
  if (id === city.id) return;
  getCity(id);
  const r = mulberry32((Math.random() * 1e9) | 0);
  const H = view.VH;
  const mk = (n, ox0, ox1) => Array.from({ length: n }, (_, i) => ({ ox: rf(r, ox0, ox1), y: lerp(-24, H - 4, (i + r() * 0.8) / n), idx: pick(r, CLOUD_BIG.concat([8])) }));
  const n = Math.ceil(H / 15) + 2;
  trans.lead = mk(n, -16, 22); trans.trail = mk(n, -22, 16); trans.inner = mk(Math.ceil(n * 0.8), 0, 1);
  Object.assign(trans, { on: true, t: 0, swapped: false, to: id, bumped: false });
}
function updateTransition(dt) {
  if (!trans.on) return;
  trans.t += dt;
  const W = view.VW;
  trans.w = W * 1.25 + 170;
  trans.x = W + 30 - (trans.t / trans.dur) * (W + trans.w + 100);
  if (!trans.bumped && trans.x < plane.rx + 50) { trans.bumped = true; plane.bumpV += rf(rngSim, -36, 36); DUCKS.forEach(d => { d.bobV -= 14; d.blink = 0.2; }); }
  if (!trans.swapped && ((trans.x + 30 < 0 && trans.x + trans.w - 30 > W) || trans.t > trans.dur * 0.62)) { swapCity(trans.to); trans.swapped = true; }
  if (trans.x + trans.w < -60) {
    trans.on = false;
    const p = trans.pending; trans.pending = null;
    if (p && p !== city.id) startTransition(p);
  }
  needsRender = true;
}
function resetCity() {
  const hero = city.hero;
  world.scroll = hero.r - view.VW * 0.28 / hero.p;
  boats.list.length = 0; boats.next = 2;
  resetVehicle();
  needsRender = true;
}
function swapCity(id) {
  city = getCity(id);
  clock.next = 0;
  if (LA) { LA = null; lookK = 1; }
  bakeCityInto(LB);
  resetCity();
  if (V3.city) v3city(id);
  if (hooks.onCity) hooks.onCity(city);
}
function drawTransition() {
  if (!trans.on) return;
  const S = view.S, x = trans.x, w = trans.w, H = view.VH;
  const cl = LB.clouds;
  ctx.fillStyle = LB.css.cloudBase;
  const cx0 = Math.round((x + 26) * S), cx1 = Math.round((x + w - 26) * S);
  if (cx1 > cx0) ctx.fillRect(cx0, 0, cx1 - cx0, view.CH);
  for (const p of trans.inner) {
    const img = cl[p.idx], px = x + 30 + p.ox * (w - 60 - img.width);
    if (px > view.VW || px + img.width < 0) continue;
    ctx.globalAlpha = 0.85; ctx.drawImage(img, Math.round(px * S), Math.round(p.y * S), img.width * S, img.height * S);
  }
  ctx.globalAlpha = 1;
  for (const p of trans.lead) {
    const img = cl[p.idx], px = x + p.ox - img.width * 0.3;
    if (px > view.VW || px + img.width < 0) continue;
    ctx.drawImage(img, Math.round(px * S), Math.round(p.y * S), img.width * S, img.height * S);
  }
  for (const p of trans.trail) {
    const img = cl[p.idx], px = x + w + p.ox - img.width * 0.7;
    if (px > view.VW || px + img.width < 0) continue;
    ctx.drawImage(img, Math.round(px * S), Math.round(p.y * S), img.width * S, img.height * S);
  }
  void H;
}
function drawTransitionMist() {
  if (!trans.on) return;
  const S = view.S, cl = LB.clouds;
  const inside = plane.rx > trans.x + 10 && plane.rx < trans.x + trans.w - 10;
  if (!inside) return;
  for (let i = 0; i < 5; i++) {
    const img = cl[CLOUD_WISP[i % 3]];
    const px = mod(view.VW - trans.t * (520 + i * 90) - i * 140, view.VW + 160) - 80;
    const py = plane.ry - 40 + i * 18;
    ctx.globalAlpha = 0.42;
    ctx.drawImage(img, Math.round(px * S), Math.round(py * S), img.width * S, img.height * S);
  }
  ctx.globalAlpha = 1;
}

/* ---------- a soft beam for the Eiffel Tower's searchlight ---------- */
const beamSpr = (() => {
  const c = makeCanvas(96, 24), g = c.ctx;
  for (let x = 0; x < 96; x++) {
    const u = x / 95, half = 1 + u * 11, a = (1 - u) * (1 - u) * 0.55;
    for (let y = 0; y < 24; y++) {
      const d = Math.abs(y + 0.5 - 12) / half;
      if (d < 1) { g.fillStyle = 'rgba(255,241,200,' + (a * (1 - d * d)).toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }
  }
  return c;
})();

/* ---------- glow sprite for lamps on the plane ---------- */
const glowSpr = (() => {
  const c = makeCanvas(16, 16), g = c.ctx;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5) / 8;
    if (d < 1) { g.fillStyle = 'rgba(255,255,255,' + ((1 - d) * (1 - d) * 0.9).toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
  }
  return c;
})();

/* ---------- simulation step ---------- */
function simulate(dt) {
  world.t += dt;
  world.speed = approach(world.speed, world.speedTarget, 1.6, dt);
  world.scroll += BASE_SPEED * world.speed * dt;
  updatePlane(dt);
  updateDucks(dt);
  updateClouds(dt);
  updateBirds(dt);
  updateShoot(dt);
  updateBoats(dt);
  updateVehicle(dt);
  updateRain(dt);
  updateFx(dt);
  v3update(dt);
  if (flash.a > 0) flash.a = Math.max(0, flash.a - dt * 1.4);
}

/* ---------- render ---------- */
const NAV_LAMPS = [29, 15, -68, -4, -61, -32];
function render() {
  const S = view.S, HZ = view.HZ, k = cur.k;
  tickClock(Date.now());
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const fullW = view.VW * S, fullH = view.VH * S;
  if (LA) { ctx.drawImage(LA.sky, 0, 0, view.VW, view.VH, 0, 0, fullW, fullH); ctx.globalAlpha = k; }
  ctx.drawImage(LB.sky, 0, 0, view.VW, view.VH, 0, 0, fullW, fullH);
  ctx.globalAlpha = 1;
  drawStars();
  drawShoot();
  drawCloudLayer(0);
  if (bgClock.on && bgClock.w > 1) { ctx.globalAlpha = bgClock.alpha; ctx.drawImage(bgClock.c, bgClock.x * S, bgClock.y * S, bgClock.w * S, bgClock.h * S); ctx.globalAlpha = 1; }
  const sc = world.scroll;
  const half = view.VW * 0.5, LY = city.layers, vdef = city.vehicle;
  let birds = false;
  for (let pass = 0; pass < 2; pass++) {
    if (pass) { if (!birds) drawBirds(); drawWater(); drawBoats(true); }
    for (let i = 0; i < LY.length; i++) {
      const Ly = LY[i];
      if (!!Ly.water !== !!pass) continue;
      /* a point r px along the route sits at  half + p * (r - scroll)  */
      const off = sc * Ly.p - half, ay = HZ - Ly.H + (Ly.dy || 0);
      if (!pass && !birds && Ly.p >= 0.6) { drawBirds(); birds = true; }
      drawLayer(i, off, ay, sc);
      drawDyn(Ly.name, off, ay, Ly.W);
      if (vdef && vdef.L === Ly.name) drawVehicle(off, ay, Ly.W);
      if (!pass && i === city.cloudAfter) drawCloudLayer(1);
    }
  }
  drawCrossings(sc);
  drawBoats(false);
  drawCloudLayer(2);
  drawTransition();
  drawLines();
  drawPuffs();
  // the plane
  const navOn = smoothstep(0.3, 0.9, cur.E);
  paintPlane(plane, duckEnv, cur.planeTint, cur.planeA, navOn, (world.t % 1.4) < 0.12);
  ctx.save();
  ctx.translate(Math.round(plane.rx * S), Math.round(plane.ry * S));
  ctx.rotate(plane.rot);
  ctx.drawImage(planeOut, -PB_OX * S, -PB_OY * S, PB_W * S, PB_H * S);
  ctx.restore();
  if (navOn > 0.05) {
    ctx.globalCompositeOperation = 'lighter';
    const n = (world.t % 1.4) < 0.12 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const p = planeToWorld(NAV_LAMPS[i * 2], NAV_LAMPS[i * 2 + 1]);
      ctx.globalAlpha = navOn * 0.55;
      ctx.drawImage(glowSpr, Math.round((p[0] - 4) * S), Math.round((p[1] - 4) * S), 8 * S, 8 * S);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  drawParts();
  drawCloudLayer(3);
  drawTransitionMist();
  if (cur.rain > 0.01) drawRain();
  if (marker.life > 0) {
    const a = Math.min(1, marker.life * 1.6), r = Math.round(2 + (1 - marker.life) * 5);
    ctx.fillStyle = cur.night > 0.5 ? '#fff1c8' : '#ffffff';
    ctx.globalAlpha = a * 0.85;
    const mx = Math.round(marker.x), my = Math.round(marker.y);
    ctx.fillRect((mx - r) * S, my * S, S, S); ctx.fillRect((mx + r) * S, my * S, S, S);
    ctx.fillRect(mx * S, (my - r) * S, S, S); ctx.fillRect(mx * S, (my + r) * S, S, S);
    ctx.globalAlpha = 1;
  }
  if (flash.a > 0) { ctx.globalAlpha = flash.a; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, view.CW, view.CH); ctx.globalAlpha = 1; }
}
