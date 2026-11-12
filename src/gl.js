/* =====================================================================
   A tiny WebGL kit for the Front, Rear and 3D views: 4x4 matrices, a
   mesh builder for boxes, tapers and prisms, and four small shaders.
   No libraries: everything the 3D views need is in this file.
   ===================================================================== */
const M4 = {
  make() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  ident(m) { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(o, a, b) {
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
  translate(m, x, y, z) { for (let i = 0; i < 4; i++) m[12 + i] += m[i] * x + m[4 + i] * y + m[8 + i] * z; return m; },
  scale(m, x, y, z) { for (let i = 0; i < 4; i++) { m[i] *= x; m[4 + i] *= y; m[8 + i] *= z; } return m; },
  rotX(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const y = m[4 + i], z = m[8 + i]; m[4 + i] = y * c + z * s; m[8 + i] = z * c - y * s; } return m; },
  rotY(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], z = m[8 + i]; m[i] = x * c - z * s; m[8 + i] = x * s + z * c; } return m; },
  rotZ(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], y = m[4 + i]; m[i] = x * c + y * s; m[4 + i] = y * c - x * s; } return m; },
  perspective(o, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    o.fill(0);
    o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf; o[11] = -1; o[14] = 2 * far * near * nf;
    return o;
  },
  /* view matrix looking from e to c with +y up; also fills the camera's right, up and forward axes */
  lookAt(o, ex, ey, ez, cx, cy, cz, R, U, F) {
    let fx = cx - ex, fy = cy - ey, fz = cz - ez;
    let l = Math.hypot(fx, fy, fz) || 1; fx /= l; fy /= l; fz /= l;
    let rx = -fz, ry = 0, rz = fx;               // forward x up(0,1,0)
    l = Math.hypot(rx, rz) || 1; rx /= l; rz /= l;
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    o[0] = rx; o[1] = ux; o[2] = -fx; o[3] = 0;
    o[4] = ry; o[5] = uy; o[6] = -fy; o[7] = 0;
    o[8] = rz; o[9] = uz; o[10] = -fz; o[11] = 0;
    o[12] = -(rx * ex + ry * ey + rz * ez); o[13] = -(ux * ex + uy * ey + uz * ez); o[14] = fx * ex + fy * ey + fz * ez; o[15] = 1;
    if (R) { R[0] = rx; R[1] = ry; R[2] = rz; U[0] = ux; U[1] = uy; U[2] = uz; F[0] = fx; F[1] = fy; F[2] = fz; }
    return o;
  },
};

const _rgbCache = {};
function rgb3(c) { return typeof c === 'string' ? (_rgbCache[c] || (_rgbCache[c] = hex(c))) : c; }
const shade3 = (c, k) => { const a = rgb3(c); return [clamp(a[0] * k, 0, 255), clamp(a[1] * k, 0, 255), clamp(a[2] * k, 0, 255)]; };

/* Materials understood by the main shader */
const MT = { solid: 0, windows: 1, water: 2, lamp: 3, cloud: 4, glass: 5, night: 6, stipple: 7, lattice: 8 };

/* ---------- mesh builder ---------- */
class Mesh3 {
  constructor() { this.P = []; this.N = []; this.C = []; this.m = M4.make(); this.st = []; }
  push() { this.st.push(new Float32Array(this.m)); return this; }
  pop() { this.m = this.st.pop(); return this; }
  move(x, y, z) { M4.translate(this.m, x, y, z); return this; }
  rx(a) { M4.rotX(this.m, a); return this; }
  ry(a) { M4.rotY(this.m, a); return this; }
  rz(a) { M4.rotZ(this.m, a); return this; }
  size(x, y, z) { M4.scale(this.m, x, y === undefined ? x : y, z === undefined ? x : z); return this; }
  get count() { return this.P.length / 3; }
  tri(a, b, c, col, mat) {
    const m = this.m, P = this.P;
    const i0 = P.length;
    for (const p of [a, b, c]) {
      P.push(m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]);
    }
    const ux = P[i0 + 3] - P[i0], uy = P[i0 + 4] - P[i0 + 1], uz = P[i0 + 5] - P[i0 + 2];
    const vx = P[i0 + 6] - P[i0], vy = P[i0 + 7] - P[i0 + 1], vz = P[i0 + 8] - P[i0 + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-9) { P.length = i0; return this; }
    nx /= l; ny /= l; nz /= l;
    const k = rgb3(col), mt = mat || 0;
    for (let i = 0; i < 3; i++) { this.N.push(nx, ny, nz); this.C.push(k[0], k[1], k[2], mt); }
    return this;
  }
  quad(a, b, c, d, col, mat) { this.tri(a, b, c, col, mat); return this.tri(a, c, d, col, mat); }
  /* axis-aligned box; top: optional colour for the roof face */
  box(x0, y0, z0, x1, y1, z1, col, mat, top) {
    const a = [x0, y0, z0], b = [x1, y0, z0], c = [x1, y0, z1], d = [x0, y0, z1];
    const e = [x0, y1, z0], f = [x1, y1, z0], g = [x1, y1, z1], h = [x0, y1, z1];
    this.quad(d, c, g, h, col, mat); this.quad(b, a, e, f, col, mat);
    this.quad(c, b, f, g, col, mat); this.quad(a, d, h, e, col, mat);
    this.quad(h, g, f, e, top || col, mat); this.quad(a, b, c, d, col, mat);
    return this;
  }
  /* box centred on (cx, cz) standing on y0 */
  block(cx, cz, w, d, y0, y1, col, mat, top) { return this.box(cx - w / 2, y0, cz - d / 2, cx + w / 2, y1, cz + d / 2, col, mat, top); }
  /* tapered block: w0 x d0 at y0 shrinking (or growing) to w1 x d1 at y1; ox, oz shift the top */
  taper(cx, cz, y0, w0, d0, y1, w1, d1, col, mat, ox, oz, top) {
    ox = ox || 0; oz = oz || 0;
    const a = [cx - w0 / 2, y0, cz - d0 / 2], b = [cx + w0 / 2, y0, cz - d0 / 2], c = [cx + w0 / 2, y0, cz + d0 / 2], d = [cx - w0 / 2, y0, cz + d0 / 2];
    const e = [cx + ox - w1 / 2, y1, cz + oz - d1 / 2], f = [cx + ox + w1 / 2, y1, cz + oz - d1 / 2], g = [cx + ox + w1 / 2, y1, cz + oz + d1 / 2], h = [cx + ox - w1 / 2, y1, cz + oz + d1 / 2];
    this.quad(d, c, g, h, col, mat); this.quad(b, a, e, f, col, mat);
    this.quad(c, b, f, g, col, mat); this.quad(a, d, h, e, col, mat);
    if (w1 > 0.01 && d1 > 0.01) this.quad(h, g, f, e, top || col, mat);
    this.quad(a, b, c, d, col, mat);
    return this;
  }
  /* n-sided prism or cone around the y axis */
  cyl(cx, cz, y0, r0, y1, r1, n, col, mat, phase) {
    const ph = phase || 0;
    for (let i = 0; i < n; i++) {
      const a0 = ph + i * TAU / n, a1 = ph + (i + 1) * TAU / n;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const p0 = [cx + c0 * r0, y0, cz + s0 * r0], p1 = [cx + c1 * r0, y0, cz + s1 * r0];
      const q0 = [cx + c0 * r1, y1, cz + s0 * r1], q1 = [cx + c1 * r1, y1, cz + s1 * r1];
      this.quad(p1, p0, q0, q1, col, mat);
      if (r1 > 0.01) this.tri([cx, y1, cz], q1, q0, col, mat);
      if (r0 > 0.01) this.tri([cx, y0, cz], p0, p1, col, mat);
    }
    return this;
  }
  /* a flat outline in the xy plane (pairs of x, y) given thickness from z0 to z1 */
  extrude(pts, z0, z1, col, mat, edge) {
    const n = pts.length >> 1;
    let cx = 0, cy = 0;
    for (let i = 0; i < n; i++) { cx += pts[i * 2]; cy += pts[i * 2 + 1]; }
    cx /= n; cy /= n;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ax = pts[i * 2], ay = pts[i * 2 + 1], bx = pts[j * 2], by = pts[j * 2 + 1];
      this.tri([cx, cy, z1], [ax, ay, z1], [bx, by, z1], col, mat);
      this.tri([cx, cy, z0], [bx, by, z0], [ax, ay, z0], col, mat);
      this.quad([ax, ay, z0], [bx, by, z0], [bx, by, z1], [ax, ay, z1], edge || col, mat);
    }
    return this;
  }
  /* pitched roof on a w x d footprint; the ridge runs along x (or along z when alongZ) */
  gable(cx, cz, w, d, y0, h, col, mat, alongZ) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    if (alongZ) {
      this.quad([x0, y0, z0], [x0, y0, z1], [cx, y1, z1], [cx, y1, z0], col, mat);
      this.quad([x1, y0, z1], [x1, y0, z0], [cx, y1, z0], [cx, y1, z1], col, mat);
      this.tri([x0, y0, z1], [x1, y0, z1], [cx, y1, z1], col, mat); this.tri([x1, y0, z0], [x0, y0, z0], [cx, y1, z0], col, mat);
    } else {
      this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, cz], [x0, y1, cz], col, mat);
      this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, cz], [x1, y1, cz], col, mat);
      this.tri([x1, y0, z1], [x1, y0, z0], [x1, y1, cz], col, mat); this.tri([x0, y0, z0], [x0, y0, z1], [x0, y1, cz], col, mat);
    }
    return this;
  }
  /* a straight beam between two points with a square section */
  beam(a, b, t, col, mat) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return this;
    this.push().move(a[0], a[1], a[2]);
    this.ry(Math.atan2(-dz, dx)); this.rz(Math.asin(clamp(dy / len, -1, 1)));
    this.box(0, -t / 2, -t / 2, len, t / 2, t / 2, col, mat);
    return this.pop();
  }
  /* pixel text from a row-string font, laid on the local xy plane (x right, y up) */
  text(str, font, px, col, mat) {
    let x = 0;
    for (const ch of str) {
      const g = font[ch];
      if (!g) { x += 4 * px; continue; }
      for (let j = 0; j < g.length; j++) for (let i = 0; i < g[j].length; i++) {
        if (g[j][i] !== '#') continue;
        const x0 = x + i * px, y0 = (g.length - 1 - j) * px;
        this.quad([x0, y0, 0], [x0 + px, y0, 0], [x0 + px, y0 + px, 0], [x0, y0 + px, 0], col, mat);
      }
      x += (g[0].length + 1) * px;
    }
    return this;
  }
  upload(gl) {
    const n = this.count, buf = new ArrayBuffer(n * 20);
    const f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf);
    for (let i = 0; i < n; i++) {
      f[i * 5] = this.P[i * 3]; f[i * 5 + 1] = this.P[i * 3 + 1]; f[i * 5 + 2] = this.P[i * 3 + 2];
      i8[i * 20 + 12] = Math.round(this.N[i * 3] * 127); i8[i * 20 + 13] = Math.round(this.N[i * 3 + 1] * 127); i8[i * 20 + 14] = Math.round(this.N[i * 3 + 2] * 127);
      u8[i * 20 + 16] = this.C[i * 4]; u8[i * 20 + 17] = this.C[i * 4 + 1]; u8[i * 20 + 18] = this.C[i * 4 + 2]; u8[i * 20 + 19] = this.C[i * 4 + 3];
    }
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
    return { vbo, n };
  }
}

/* ---------- shaders ---------- */
const GLSL_COMMON = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float b2(vec2 a){ a = floor(a); return fract(a.x * .5 + a.y * a.y * .75); }
float bayer(vec2 a){ return b2(.5 * a) * .25 + b2(a); }
vec3 crush(vec3 c){ return floor(clamp(c, 0., 1.) * 30. + bayer(gl_FragCoord.xy)) / 30.; }
`;
const VS_MAIN = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec4 aCol;
uniform mat4 uVP, uModel;
varying vec3 vW, vL, vN, vC; varying float vM;
void main(){
  vec4 w = uModel * vec4(aPos, 1.);
  vW = w.xyz; vL = aPos; vN = mat3(uModel) * aNor; vC = aCol.rgb; vM = aCol.a * 255.;
  gl_Position = uVP * w;
}`;
const FS_MAIN = GLSL_COMMON + `
varying vec3 vW, vL, vN, vC; varying float vM;
uniform vec3 uCam, uSun, uSunV, uSunCol, uAmb, uHemi, uFog, uMul, uSkyC, uCloud, uHi, uWater;
uniform vec4 uFogR;
uniform float uT, uLit, uFlash, uVis, uCut;
void main(){
  vec3 V = uCam - vW; float dist = length(V); V /= dist;
  if (uCut > 0. && dist < uCut && bayer(gl_FragCoord.xy) > dist / uCut - .1) discard;
  vec3 n = normalize(vN); if (dot(n, V) < 0.) n = -n;
  vec3 base = vC * uMul;
  vec3 light = uAmb + uHemi * (.5 + .5 * n.y) + uSunCol * max(dot(n, uSun), 0.);
  vec3 col = base * light;
  float m = floor(vM + .5), fogK = 1.;
  if (m == 1.) {
    if (abs(n.y) < .5) {
      float u = abs(vN.x) > abs(vN.z) ? vL.z : vL.x;
      vec2 g = vec2(u, vL.y) / vec2(3.2, 4.4), f = fract(g), id = floor(g);
      float win = step(.2, f.x) * step(f.x, .8) * step(.26, f.y) * step(f.y, .84);
      float bs = hash(floor(vC.rb * 97.) + floor(vC.g * 31.));
      float on = step(hash(id + floor(vC.rb * 97.)), uLit * mix(.12, .62, bs)) * step(.02, uLit);
      vec3 glass = col * .6 + uSkyC * .14;
      vec3 lamp = mix(vec3(1., .82, .5), vec3(.74, .88, 1.), step(.82, hash(id.yx + 3.)));
      float fade = 1. - smoothstep(380., 820., dist);
      col = mix(col, mix(glass, lamp, on), win * fade);
      col = mix(col, col * .9 + lamp * .2 * uLit, (1. - fade) * .6);
      fogK = 1. - on * win * .45;
    } else col *= .82;
  } else if (m == 2.) {
    float w1 = sin(vL.z * .55 + sin(vL.x * .045 + uT * .7) * 2.2 + uT * 1.2);
    float w2 = sin(vL.x * .21 - vL.z * .13 + uT * .9);
    float fres = pow(1. - max(V.y, 0.), 3.);
    col = mix(uWater * light, uSkyC, .22 + fres * .5);
    col += uHi * step(.84, w1 * .6 + w2 * .4) * .13;
    col -= step(w1 * .5 + w2 * .5, -.8) * .035;
    vec3 R = reflect(-V, vec3(0., 1., 0.));
    float gli = pow(max(dot(R, uSunV), 0.), 70.);
    col += uHi * gli * step(.4, hash(floor(vL.xz * .5) + floor(uT * 4.))) * uVis;
  } else if (m == 3.) { col = base * 1.08; fogK = .5; }
  else if (m == 4.) { col = uCloud * vC * (.9 + .1 * n.y); fogK = .45; }
  else if (m == 5.) { col = mix(base * light, uSkyC, .4) + .06; }
  else if (m == 6.) { col = mix(col, base * 1.12, uLit); fogK = 1. - .5 * uLit; }
  else if (m == 7.) { if (bayer(gl_FragCoord.xy) > .1) discard; col = mix(col, uSkyC, .3); }
  else if (m == 8.) {
    float u = abs(vN.x) > abs(vN.z) ? vL.z : vL.x;
    float x1 = abs(fract((u + vL.y) * .16) - .5), x2 = abs(fract((u - vL.y) * .16) - .5);
    float bar = step(min(x1, x2), .1) * (1. - smoothstep(260., 520., dist));
    col = mix(col * .72, col * 1.12, bar);
    col = mix(col, base * vec3(1.25, 1.02, .6), uLit * .8); fogK = 1. - .4 * uLit;
  }
  float fog = smoothstep(uFogR.x, uFogR.y, dist) * uFogR.z * fogK;
  col = mix(col, uFog, fog);
  col = mix(col, uCloud, uFogR.w);
  gl_FragColor = vec4(crush(col + uFlash), 1.);
}`;
const VS_SKY = `
attribute vec2 aP; varying vec2 vP;
void main(){ vP = aP; gl_Position = vec4(aP, 0., 1.); }`;
const FS_SKY = GLSL_COMMON + `
varying vec2 vP;
uniform vec3 uF, uR, uU, c0, c1, c2, c3, uGlow, uSunV, uFog, uCloud;
uniform vec4 uBody;
uniform float uT, uWhite, uGlowR, uFlash;
void main(){
  vec3 d = normalize(uF + vP.x * uR + vP.y * uU);
  float e = d.y, t = 1. - clamp(e / .6, 0., 1.);
  vec3 col = t < .45 ? mix(c0, c1, smoothstep(0., 1., t / .45)) : t < .8 ? mix(c1, c2, smoothstep(0., 1., (t - .45) / .35)) : mix(c2, c3, smoothstep(0., 1., (t - .8) / .2));
  if (e < 0.) col = mix(c3, uFog, clamp(-e * 9., 0., 1.));
  float sd = dot(d, uSunV), th = acos(clamp(sd, -1., 1.));
  col = mix(col, uGlow, exp(-(1. - sd) / (uGlowR * uGlowR)) * uBody.z);
  float r = uBody.x < .5 ? .05 : uBody.x < 1.5 ? .078 : .044;
  vec3 bc = uBody.x < .5 ? vec3(1., .98, .9) : uBody.x < 1.5 ? mix(vec3(1., .95, .7), vec3(1., .56, .31), clamp((uSunV.y - d.y) / r * .5 + .5, 0., 1.)) : vec3(.96, .94, .84);
  float disc = step(th, r);
  if (uBody.x > .5 && uBody.x < 1.5 && d.y < uSunV.y && mod(floor((uSunV.y - d.y) * 260.), 4.) == 0.) disc = 0.;
  col = mix(col, bc, disc * uBody.y);
  col = mix(col, bc, step(th, r * 1.45) * (1. - disc) * step(.5, b2(gl_FragCoord.xy)) * .3 * uBody.y);
  vec2 sp = vec2(atan(d.z, d.x) * 34., e * 46.), id = floor(sp);
  float h = hash(id);
  float st = step(.9, h) * step(length(fract(sp) - .5), .13) * uBody.w * (.6 + .4 * sin(uT * (1. + h * 3.) + h * 40.)) * step(.03, e);
  col += st * vec3(.92, .94, 1.);
  col = mix(col, uCloud, uWhite);
  gl_FragColor = vec4(crush(col + uFlash), 1.);
}`;
const VS_TEX = `
attribute vec2 aP; uniform vec4 uRect; varying vec2 vUV;
void main(){ vUV = vec2(aP.x * .5 + .5, .5 - aP.y * .5); gl_Position = vec4(uRect.xy + (aP * .5 + .5) * uRect.zw, 0., 1.); }`;
const FS_TEX = `
varying vec2 vUV; uniform sampler2D uTex; uniform float uA;
void main(){ gl_FragColor = texture2D(uTex, vUV) * uA; }`;
const VS_LINE = `
attribute vec3 aPos; uniform mat4 uVP;
void main(){ gl_Position = uVP * vec4(aPos, 1.); }`;
const FS_LINE = `
uniform vec3 uCol;
void main(){ gl_FragColor = vec4(uCol, 1.); }`;

function glProgram(gl, vs, fs, prec, attribs) {
  const mk = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader failed');
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, 'precision ' + prec + ' float;\n' + fs));
  (attribs || []).forEach((name, i) => gl.bindAttribLocation(p, i, name));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link failed');
  const out = { p, u: {}, a: {} };
  const nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < nu; i++) { const info = gl.getActiveUniform(p, i); out.u[info.name] = gl.getUniformLocation(p, info.name); }
  const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < na; i++) { const info = gl.getActiveAttrib(p, i); out.a[info.name] = gl.getAttribLocation(p, info.name); }
  return out;
}
