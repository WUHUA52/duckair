# DuckAir city backgrounds — how a city is built

Goal: someone who knows the city recognises it with the label hidden. Every
city is ONE real flight line along its river, seen from a camera flying down
the river and looking across at one bank. Nothing may appear that this view
could not show; nothing famous is repeated; landmarks sit where the map puts
them. `src/city-philly.js` + `src/city3d-philly.js` are the finished exemplar:
read them fully before writing anything.

## The side view (2D): a stack of layers = true perspective

`mkLayer(name, W, H, opts)` makes a raster layer. All layers loop over the
same route (`ROUTE` = 4096 px of scroll), so **width fixes parallax**:
`p = W / 4096`. A point `r` route-px along the river is drawn at `x = p * r`
on that layer and appears on screen at `VW/2 + p * (r - scroll)`. That is
exactly a perspective camera: with the camera `d0` metres from the far bank,
something `d` metres inland belongs on the layer with `p ≈ d0 / (d0 + d)`.

- Pick route scale `k` px per metre on the bank so the whole route = 4096 px.
  Write positions in metres along the river and convert: `rp = m => (m - m0) * k`,
  `at = (Ly, m) => Math.round(Ly.p * rp(m))`.
- Sizes: true size on a layer is `k * p` px per metre. Philadelphia draws
  buildings at 0.8 of that (sky for the plane). Stay within 0.75–1.0 and be
  consistent; note any landmark you enlarge (max ~1.3x) as a deliberate
  simplification.
- Layers are listed back to front. Typical stack: far (p≈.25, W 1024),
  core (.31, W 1280), fore (.375, W 1536), mid (.5, W 2048), near (.75, W 3072),
  bank (1.0, W 4096), plus `shore` (W 4096, `{ water: true, dy: 11 }`, H 14)
  for things standing in the water at the bank (docks, boardwalks, moored
  boats, piers): its rows 0–2 are above the waterline, the rest below.
  Use the p values your geography needs; W must be an integer and ≤ 4096.
- A layer's bottom row sits on the bank line. `dy: -n` lifts a far layer n px.
  Every layer needs a ground strip along its whole width (a few px of
  ground/trees/low fabric) so no sky shows under it.
- Rasters wrap in x automatically. The loop seam (r = 4096 ≡ 0) must be
  concealed: end and start the route in similar quiet fabric (trees, generic
  blocks) so the join is not noticeable.
- The Screen is 480 x 270 art px at 16:9 (wider on wide windows); the bank
  line is at y = 216, so there are 216 px of sky. The plane flies in the
  upper half. Keep the tallest things ≤ ~140 px.
- Haze per layer is automatic from p. Light comes from the left: shade right
  flanks (`block()` does it).
- **Max 255 materials per city** (`M.add`), the build logs an error past that.

### Materials (`M.add(colour, kind, emissive, glow, late)`)
`KS` solid (default) · `KG` glass (picks up sky) · `KW` window (lights up at
dusk; `late` = later) · `KN` neon/lamp · `KF` floodlit stone. Use `KF` on
landmarks, `KN` for outlines/crowns/signs, so every landmark still reads at
night. `winMats(M, glassColour)` → `{off, on[4]}` for `winGrid`.

### Kit (src/kit.js, src/core.js) — read the source for details
`winGrid(R, rng, x, y, w, h, W, {cw, ch, ww, wh, lit, skip})` · `block(R, cx, w, h, m, mD, base)` ·
`woods(R, rng, x0, x1, base, hFn, leaf[3], {rMin, rMax})` · `tree(R, x, base, r, Q, leaf)` ·
`lampPost` · `quayMats(M, o)` · `pediment(R, x, y, w, rise, m, mL)` · `curve([[x,y],…])` ·
`lattice(R, cx, base, H, prof)` (returns its points, e.g. for the Eiffel sparkle) ·
`cable(...)`, `archBridge(...)` (flat bridges drawn INTO a raster, only for bridges
that run parallel to the bank) · `text3(R, x, y, 'TEXT', m)` · `rasterFromRows(rows, map)` ·
`hangLine(z0, h0, z1, h1, sag, lat, n)` · Raster: `px get span rect ellipse disc ring poly line`.
`ri(rng,a,b)`, `rf`, `pick`, `mulberry32(seed)`, `lerp`, `clamp`, `mod`.

### Bridges across the river = `crossings` (drawn live, in perspective)
The camera looks across the river, so a bridge runs from the far bank toward
the camera. Do NOT draw river-crossing bridges into rasters. List them:

```js
{ name, r,            // route px where it lands on the far bank
  w, h, th,           // deck width, height above water, fascia thickness (px at bank scale)
  top, side, pier, rail,      // materials (required: top, side)
  walk, mark,         // optional pavement strips / centre dashes
  piers: [z…], pw,    // pier positions: px out from the bank (bank scale), pier length
  arch: n,            // fascia deepens toward each pier over n px -> reads as arches
  lamp, lampEvery,    // lamp material + spacing in z
  z0, len,            // start / end distance from the bank (default 0 .. off-screen)
  towers: [{ z, spr, lat, base, s }],   // upright sprites (index into `sprites`): bridge towers,
                      // pylons, statues. Seen face-on along the bridge axis. base = px above water.
  lines: [{ m, pts: [[z, height, lateral], …] }] }   // cables, chains, trusses, walkways
```
`h` must stay below `J0` (40). Give the bank layer an abutment where each
bridge lands (see `ab()` in Philadelphia), and keep trees off it.
Bridges do not get reflections; that is fine.

### What the generator returns
```js
return { id, name, meta, river, M,
  layers: [far, …, bank, shore], crossings, sprites, camD: 360, J0: 40, cloudAfter: 0,
  hero: { r: <route px to open on>, p: <layer p of the hero> },
  dyn, landmarks, boats, vehicle };
```
- `landmarks`: `{ L: layerName, x: layer x, name }` → "Passing …" label. One per real landmark.
- `dyn.blink` `{L,x,y}` red aviation lights · `dyn.clocks` `{L,x,y,r}` real-time clock hands ·
  `dyn.signs` `{L,x,y,w,h,mode:'blink'|'scan',e:[r,g,b],ph}` · `dyn.sparkle` `{L, x, pts}` +
  `dyn.beacon` `{x,y}` (Eiffel) — all in that layer's own pixel coordinates.
- `boats`: `{frames:[Raster…], speed, fps, depth}`; `vehicle`: `{L, x0, x1, y, sprite, speed, idle}`
  moves along a layer between x0 and x1 (a train, bus, tram). Keep `id` and `name` unchanged.

## Front / Rear / 3D views (src/city3d-<city>.js)
Same route, same order: `x3d = routePx * 2400 / 4096` (the loop is `L3` = 2400).
The plane flies +x. **-z is the far bank you see in the side view; +z is the
near bank** (what is behind the side-view camera): put the other bank's real
landmarks there. River half-width `RW3` = 150, ground at `GY`. Depth inland may
be compressed (Philadelphia: `z = -(RW3 + 16 + metres * 0.14)`). `K.arch` /
`K.susp` build bridges across the river; `K.reserve(side, x0, x1, z0, z1)` keeps
generic rows out; `K.mark(name, x)` labels. `STYLE3.<id>.rows` take
`side`, `x0`, `x1` so density follows the real districts. Set
`synced: true` and `hero: <x>` in `STYLE3.<id>`. Mesh3 API: `src/gl.js`.

## Tools
```
python3 build.py && node --check build/app.js
python3 test/cityshot.py <city> [day|morning|sunset|night] [clear|cloudy|rain] [auto|r1,r2,…] [960x540] [out.png]
python3 test/city3d.py <city> [tod] [x1,x2,…]
```
`cityshot` with `auto` gives nine frames covering the whole route; pass route
positions for close looks (use 1440x810 for 3x zoom). Outputs land in `shots/`.
LOOK at the images (Read tool) and compare with `refs/*.jpg`.

## Definition of done
1. Whole route reviewed by day; hero stretches reviewed at night and sunset+rain.
2. Each landmark has its real silhouette and defining details, at believable
   relative size, in the right order, on the right bank, at the right depth.
3. The city's fabric has its own vocabulary (roofline, colours, window rhythm,
   quay, trees, boats). No generic towers where the city has none.
4. No landmark repeats; seam concealed; no sky gaps under layers; no errors.
5. 3D layout mirrors the route; near-bank landmarks are on +z.
6. Report: viewpoint, route order, what you checked against which reference,
   deliberate simplifications, anything unverified, any shared-code change you need.
