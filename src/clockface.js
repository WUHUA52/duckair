/* =====================================================================
   Clock engine. Times come from the browser's own time-zone database
   through Intl, so daylight saving is always right and no location
   permission is ever asked for. Also paints the big pixel clock that
   hangs in the sky in Background mode, and works out morning / day /
   sunset / night for "Match sky to clock".
   ===================================================================== */
const LOCAL_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })();
function tzValid(tz) { if (!tz || typeof tz !== 'string') return false; try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; } }
/* Chrome still lists a few zones under their old IANA names (Asia/Calcutta); show the current ones people look for */
const ZONE_ALIAS = { 'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Saigon': 'Asia/Ho_Chi_Minh', 'Asia/Katmandu': 'Asia/Kathmandu', 'Asia/Rangoon': 'Asia/Yangon', 'Europe/Kiev': 'Europe/Kyiv', 'America/Buenos_Aires': 'America/Argentina/Buenos_Aires', 'Atlantic/Faeroe': 'Atlantic/Faroe', 'Pacific/Ponape': 'Pacific/Pohnpei', 'Pacific/Truk': 'Pacific/Chuuk', 'America/Indianapolis': 'America/Indiana/Indianapolis' };
const zoneName = tz => (ZONE_ALIAS[tz] && tzValid(ZONE_ALIAS[tz]) ? ZONE_ALIAS[tz] : tz);
const ZONES = (() => {
  let z = [];
  try { if (Intl.supportedValuesOf) z = Intl.supportedValuesOf('timeZone'); } catch (e) { z = []; }
  if (!z || z.length < 24) {
    z = ['Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'America/Halifax', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Mexico_City', 'America/Bogota', 'Atlantic/Reykjavik', 'Europe/London', 'Europe/Lisbon', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow', 'Africa/Cairo', 'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Nairobi', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Tokyo', 'Australia/Perth', 'Australia/Sydney', 'Pacific/Auckland', 'UTC'].filter(tzValid);
  }
  z = z.map(zoneName).filter((v, i, a) => a.indexOf(v) === i);
  if (LOCAL_TZ && !z.includes(zoneName(LOCAL_TZ))) z = z.concat(zoneName(LOCAL_TZ)).sort();
  return z;
})();
const zoneCity = tz => (tz ? zoneName(tz).split('/').pop().replace(/_/g, ' ') : 'My time');

const MONTHS3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const _partFmt = {};
function partFmt(tz) {
  const key = tz || '~';
  if (_partFmt[key] === undefined) {
    const o = { hourCycle: 'h23', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
    if (tz) o.timeZone = tz;
    try { _partFmt[key] = new Intl.DateTimeFormat('en-US', o); } catch (e) { _partFmt[key] = null; }
  }
  return _partFmt[key];
}
/* wall-clock parts for a moment in a zone: { y, mo (0-11), d, wd, mon, h, mi, s, abbr, off (minutes east of UTC) } */
function partsIn(tz, out, date) {
  const d = date || new Date(), f = partFmt(tz);
  if (f && f.formatToParts) {
    for (const p of f.formatToParts(d)) {
      switch (p.type) {
        case 'weekday': out.wd = p.value; break;
        case 'year': out.y = +p.value; break;
        case 'month': out.mon = p.value; out.mo = Math.max(0, MONTHS3.indexOf(p.value)); break;
        case 'day': out.d = +p.value; break;
        case 'hour': out.h = (+p.value) % 24; break;
        case 'minute': out.mi = +p.value; break;
        case 'second': out.s = +p.value; break;
        case 'timeZoneName': out.abbr = p.value; break;
        default: break;
      }
    }
    out.off = Math.round((Date.UTC(out.y, out.mo, out.d, out.h, out.mi, out.s) - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  } else {
    out.wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]; out.y = d.getFullYear(); out.mo = d.getMonth(); out.mon = MONTHS3[out.mo]; out.d = d.getDate();
    out.h = d.getHours(); out.mi = d.getMinutes(); out.s = d.getSeconds(); out.abbr = ''; out.off = -d.getTimezoneOffset();
  }
  return out;
}
const NOW = { y: 2026, mo: 0, d: 1, wd: '', mon: '', h: 0, mi: 0, s: 0, abbr: '', off: 0 };
const _scratch = { y: 0, mo: 0, d: 0, wd: '', mon: '', h: 0, mi: 0, s: 0, abbr: '', off: 0 };

/* ---------- where the sun is, roughly, for a time zone ---------- */
const CITY_GEO = { philadelphia: [39.95, -75.17], nyc: [40.71, -74.0], paris: [48.86, 2.35], tokyo: [35.68, 139.69], london: [51.51, -0.13] };
const PLACE_TABLE = [
  [/^Europe\/Madrid|^Africa\/Ceuta/, 40, -3.7], [/^Europe\/Lisbon|^Atlantic\/(Madeira|Canary)/, 38, -10],
  [/^Europe\/(Paris|Brussels|Luxembourg|Monaco|Andorra)/, 48, 2.5], [/^Europe\/(London|Dublin|Isle_of_Man|Guernsey|Jersey)/, 52, -2],
  [/^Atlantic\/Reykjavik/, 64, -22], [/^Europe\/(Oslo|Stockholm|Helsinki|Tallinn)/, 60, null],
  [/^Europe\/(Rome|Athens|Istanbul|Malta|Gibraltar|Nicosia|Sofia|Belgrade|Tirane|Skopje|Podgorica)/, 41, null],
  [/^Europe\/(Moscow|Kiev|Kyiv|Minsk|Vilnius|Riga|Amsterdam|Berlin|Warsaw|Copenhagen)/, 53, null], [/^Europe\//, 48, null],
  [/^America\/(Anchorage|Juneau|Sitka|Nome|Yakutat|Metlakatla)/, 61, -150], [/^America\/(Detroit|Indiana|Kentucky)/, 41, -85],
  [/^America\/(Vancouver|Edmonton|Winnipeg|Regina|Toronto|Montreal|Halifax|St_Johns|Moncton)/, 47, null],
  [/^America\/(Sao_Paulo|Argentina|Buenos_Aires|Montevideo|Santiago|Asuncion)/, -30, -55],
  [/^America\/(Mexico_City|Monterrey|Merida|Cancun|Guatemala|Panama|Bogota|Caracas|Lima|Costa_Rica|El_Salvador|Managua|Tegucigalpa|Havana|Jamaica|Puerto_Rico|Santo_Domingo|La_Paz|Guayaquil)/, 12, null],
  [/^America\//, 39, null], [/^Pacific\/Honolulu/, 21, -158],
  [/^Asia\/(Singapore|Kuala_Lumpur)/, 2, 103.8], [/^Asia\/(Kolkata|Calcutta)/, 22, 77], [/^Asia\/(Shanghai|Chongqing|Harbin|Urumqi)/, 33, 114], [/^Asia\/Tokyo/, 36, 139.7],
  [/^Asia\/(Jakarta|Manila|Bangkok|Ho_Chi_Minh|Saigon|Colombo|Dhaka|Yangon)/, 12, null],
  [/^Asia\/(Dubai|Riyadh|Qatar|Karachi|Hong_Kong|Taipei|Macau|Muscat)/, 24, null], [/^Asia\//, 36, null],
  [/^Australia\/(Darwin|Brisbane)/, -22, null], [/^Australia\/(Hobart|Melbourne)/, -38, null], [/^Australia\//, -33, null],
  [/^Pacific\/(Auckland|Chatham)/, -38, null],
  [/^Africa\/(Johannesburg|Maseru|Mbabane|Windhoek|Gaborone)/, -26, null], [/^Africa\/(Cairo|Algiers|Tunis|Casablanca|Tripoli)/, 32, null], [/^Africa\//, 5, null],
];
const _placeCache = {};
function placeFor(tz) {
  const key = tz || LOCAL_TZ || '~';
  if (_placeCache[key]) return _placeCache[key];
  let out = { lat: 40, lon: null };
  for (const [re, lat, lon] of PLACE_TABLE) if (re.test(key)) { out = { lat, lon }; break; }
  return (_placeCache[key] = out);
}
const _stdCache = {};
function stdOffset(tz, year) {
  const key = (tz || '~') + year;
  if (_stdCache[key] === undefined) {
    const a = partsIn(tz, _scratch, new Date(Date.UTC(year, 0, 1, 12))).off, b = partsIn(tz, _scratch, new Date(Date.UTC(year, 6, 1, 12))).off;
    _stdCache[key] = Math.min(a, b);
  }
  return _stdCache[key];
}
/* 'morning' | 'day' | 'sunset' | 'night' for the wall-clock parts P of zone tz (geo: optional [lat, lon]) */
function skyPhase(P, tz, geo) {
  const place = geo ? { lat: geo[0], lon: geo[1] } : placeFor(tz);
  const n = Math.floor((Date.UTC(P.y, P.mo, P.d) - Date.UTC(P.y, 0, 0)) / 86400000);
  const B = TAU * (n - 81) / 365, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.44 * Math.sin(TAU * (284 + n) / 365) * Math.PI / 180, lat = place.lat * Math.PI / 180;
  const dayLen = 2 * Math.acos(clamp(-Math.tan(lat) * Math.tan(decl), -1, 1)) * 12 / Math.PI;
  const noon = place.lon === null ? 12.1 - eot / 60 + (P.off - stdOffset(tz, P.y)) / 60 : 12 - eot / 60 + P.off / 60 - place.lon / 15;
  const rise = noon - dayLen / 2, set = noon + dayLen / 2, h = P.h + P.mi / 60;
  if (h < rise - 0.6 || h >= set + 0.75) return 'night';
  if (h < rise + 1.6) return 'morning';
  if (h >= set - 1.0) return 'sunset';
  return 'day';
}

/* ---------- pixel fonts ---------- */
const DIGITS = {
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'], '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ':': ['.', '.', '#', '.', '#', '.', '.'],
};
const FONT35 = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '.#.', '..#'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['##.', '..#', '.#.', '#..', '###'], '3': ['##.', '..#', '.#.', '..#', '##.'],
  '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '##.', '..#', '##.'], '6': ['.##', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'], '9': ['###', '#.#', '###', '..#', '##.'],
  ':': ['.', '#', '.', '#', '.'], '.': ['.', '.', '.', '.', '#'], ',': ['..', '..', '..', '.#', '#.'], '+': ['...', '.#.', '###', '.#.', '...'], '-': ['...', '...', '###', '...', '...'],
  '/': ['..#', '..#', '.#.', '#..', '#..'], '·': ['.', '.', '#', '.', '.'],
};
function pxWidth(str, font, gap) {
  let w = 0;
  for (const ch of str) { const g = font[ch]; w += g ? g[0].length + 1 : gap; }
  return Math.max(0, w - 1);
}
function pxDraw(g2, str, font, x, y, k, gap) {
  for (const ch of str) {
    const g = font[ch];
    if (!g) { x += gap * k; continue; }
    for (let j = 0; j < g.length; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '#') g2.fillRect(x + i * k, y + j * k, k, k);
    x += (g[0].length + 1) * k;
  }
}
const pad2 = n => (n < 10 ? '0' : '') + n;
const asciiUp = s => s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase() : s.toUpperCase();

/* ---------- the big clock in the sky ---------- */
const bgClock = { c: makeCanvas(1, 1), ver: 0, key: '', txt: '', x: 0, y: 0, w: 0, h: 0, on: false, alpha: 0.7 };
/* o: { h12, secs, date, zone, size, label } */
function paintBgClock(P, o) {
  const main = (o.h12 ? String(P.h % 12 || 12) : pad2(P.h)) + ':' + pad2(P.mi);
  const secs = o.secs ? ':' + pad2(P.s) : '', ampm = o.h12 ? (P.h < 12 ? 'AM' : 'PM') : '';
  const dateStr = o.date ? asciiUp(P.wd + ', ' + P.mon + ' ' + P.d) : '', zoneStr = o.zone ? asciiUp(o.label) : '';
  let k = Math.max(1, Math.round(clamp(Math.round(view.VW / 110), 2, 7) * o.size));
  const widthAt = kk => {
    const ks = Math.max(1, Math.round(kk * 0.5)), ka = Math.max(1, Math.round(kk * 0.4));
    return pxWidth(main, DIGITS, 3) * kk + (secs ? ks + pxWidth(secs, DIGITS, 3) * ks : 0) + (ampm ? 2 * ka + pxWidth(ampm, FONT35, 2) * ka : 0);
  };
  while (k > 1 && widthAt(k) > view.VW - 14) k--;
  const ks = Math.max(1, Math.round(k * 0.5)), ka = Math.max(1, Math.round(k * 0.4)), kl = Math.max(1, Math.round(k * 0.34));
  const wMain = pxWidth(main, DIGITS, 3) * k, wSec = secs ? pxWidth(secs, DIGITS, 3) * ks : 0, wAm = ampm ? pxWidth(ampm, FONT35, 2) * ka : 0;
  const wTop = widthAt(k), wDate = pxWidth(dateStr, FONT35, 2) * kl, wZone = pxWidth(zoneStr, FONT35, 2) * kl;
  const W = Math.max(wTop, wDate, wZone) + 2 * kl + 3, lineGap = 2 * kl + 1;
  const H = 7 * k + (dateStr ? lineGap + 5 * kl : 0) + (zoneStr ? lineGap + 5 * kl : 0) + 4;
  const c = bgClock.c;
  sizeCanvas(c, W, H);
  const g = c.ctx;
  g.clearRect(0, 0, W, H);
  /* a dark one-pixel edge on every side keeps the cream digits readable on bright daytime skies; the last pass is the cream face */
  const passes = [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2], [1, 1]];
  for (let pi = 0; pi < passes.length; pi++) {
    const face = pi === passes.length - 1, ox = passes[pi][0], oy = passes[pi][1];
    g.fillStyle = face ? '#fffaf0' : '#4b4a7c';
    let x = Math.round((W - 2 - wTop) / 2) + ox;
    g.globalAlpha = 1;
    pxDraw(g, main.slice(0, main.indexOf(':')), DIGITS, x, oy, k, 3);
    const xc = x + (pxWidth(main.slice(0, main.indexOf(':')), DIGITS, 3) + 1) * k;
    if (!o.secs && (P.s & 1)) g.globalAlpha = 0.45;
    pxDraw(g, ':', DIGITS, xc, oy, k, 3);
    g.globalAlpha = 1;
    pxDraw(g, main.slice(main.indexOf(':') + 1), DIGITS, xc + 2 * k, oy, k, 3);
    x += wMain;
    if (secs) { pxDraw(g, secs, DIGITS, x + ks, oy + 7 * k - 7 * ks, ks, 3); x += ks + wSec; }
    if (ampm) pxDraw(g, ampm, FONT35, x + 2 * ka, oy + 7 * k - 5 * ka, ka, 2);
    let y = 7 * k + lineGap + oy;
    if (dateStr) { pxDraw(g, dateStr, FONT35, Math.round((W - 2 - wDate) / 2) + ox, y, kl, 2); y += 5 * kl + lineGap; }
    if (zoneStr) pxDraw(g, zoneStr, FONT35, Math.round((W - 2 - wZone) / 2) + ox, y, kl, 2);
  }
  g.globalAlpha = 1;
  bgClock.w = W; bgClock.h = H; bgClock.ver++;
  bgClock.txt = main + secs + (ampm ? ' ' + ampm : '') + '|' + dateStr + '|' + zoneStr;
  placeBgClock();
}
function placeBgClock() {
  /* high in the sky, clear of the plane's usual height; on phones it also drops below the destination tag */
  const k = view.dpr / view.S, narrow = view.VW * view.S / view.dpr <= 520;
  const top = Math.round(Math.max(view.HZ * 0.06, narrow ? 86 * k : 0) + view.insetTop * k);
  bgClock.x = Math.round((view.VW - bgClock.w) / 2);
  bgClock.y = Math.max(4, Math.min(top, view.HZ - bgClock.h - 30));
}
