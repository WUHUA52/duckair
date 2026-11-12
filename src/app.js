/* =====================================================================
   App: controls, keyboard and touch input, preferences, main loop.
   ===================================================================== */
const CITIES = [
  { id: 'philadelphia', name: 'Philadelphia', icon: 'bell' },
  { id: 'nyc', name: 'New York City', icon: 'esb' },
  { id: 'paris', name: 'Paris', icon: 'eiffel' },
  { id: 'tokyo', name: 'Tokyo', icon: 'torii' },
  { id: 'london', name: 'London', icon: 'bigben' },
];
const TODS = ['morning', 'day', 'sunset', 'night'], WXS = ['clear', 'cloudy', 'rain'];
const TOD_LABEL = { morning: 'Morning', day: 'Day', sunset: 'Sunset', night: 'Night' };
const CLOCK_MODES = ['off', 'corner', 'bg'], CLOCK_MODE_LABEL = { off: 'Off', corner: 'Corner', bg: 'Background' };
const CLOCK_SRCS = ['local', 'dest', 'zone'], CLOCK_SRC_LABEL = { local: 'My time zone', dest: 'Destination', zone: 'Other' };
const VIEWS = ['side', 'front', 'rear', '3d'], VIEW_LABEL = { side: 'Side', front: 'Front', rear: 'Rear', '3d': '3D' };
const VIEW_NOTE = {
  side: 'The original pixel-art view. Click or drag in the sky to steer.',
  front: 'Looking back at the nose. Click or drag to fly left, right, up and down.',
  rear: 'Following from behind. Click or drag to fly left, right, up and down.',
  '3d': 'Drag to orbit. Scroll or pinch to zoom. Arrow keys steer, and Shift with the arrows turns the camera.',
};
const WX_LABEL = { clear: 'Clear skies', cloudy: 'Clouds', rain: 'Gentle rain' };
const TOD_ICON = { morning: 'sunrise', day: 'sun', sunset: 'sunset', night: 'moon' };
const WX_ICON = { clear: 'clear', cloudy: 'cloud', rain: 'rain' };
const speedName = v => (v < 0.55 ? 'Drift' : v < 1.15 ? 'Cruise' : v < 1.75 ? 'Brisk' : 'Zoom');

const ICONS = {
  sun: ['.....#.....', '.#.......#.', '....###....', '...#####...', '..#######..', '#.#######.#', '..#######..', '...#####...', '....###....', '.#.......#.', '.....#.....'],
  sunrise: ['.....#.....', '....###....', '.....#.....', '...........', '.#..###..#.', '...#####...', '..#######..', '###########', '...........', '..#######..', '...........'],
  cube: ['.....#.....', '...##.##...', '.##.....##.', '#.##...##.#', '#...###...#', '#....#....#', '#....#....#', '#....#....#', '.##..#..##.', '...##.##...', '.....#.....'],
  sunset: ['...........', '.....#.....', '.#.......#.', '....###....', '...#####...', '..#######..', '###########', '...........', '..#######..', '...........', '....###....'],
  moon: ['...#####...', '..###......', '.###.......', '###........', '###........', '###........', '###........', '####.......', '.#####...#.', '..#######..', '...#####...'],
  clear: ['.....#.....', '.....#.....', '....###....', '....###....', '..#######..', '###########', '..#######..', '....###....', '....###....', '.....#.....', '.....#.....'],
  cloud: ['...........', '...........', '....###....', '...#####...', '..#######..', '.#########.', '###########', '###########', '.#########.', '...........', '...........'],
  rain: ['....###....', '...#####...', '..#######..', '.#########.', '###########', '.#########.', '...........', '..#..#..#..', '.#..#..#...', '...........', '#..#..#....'],
  sound: ['....#......', '...##...#..', '..###.#..#.', '####...#.#.', '####.#.#.#.', '####.#.#.#.', '####...#.#.', '..###.#..#.', '...##...#..', '....#......', '...........'],
  mute: ['....#......', '...##......', '..###.#...#', '####...#.#.', '####....#..', '####...#.#.', '####..#...#', '..###......', '...##......', '....#......', '...........'],
  pause: ['...........', '..##...##..', '..##...##..', '..##...##..', '..##...##..', '..##...##..', '..##...##..', '..##...##..', '..##...##..', '..##...##..', '...........'],
  play: ['...........', '..#........', '..##.......', '..###......', '..####.....', '..#####....', '..####.....', '..###......', '..##.......', '..#........', '...........'],
  frame: ['###.....###', '#.........#', '#.........#', '...........', '...........', '...........', '...........', '...........', '#.........#', '#.........#', '###.....###'],
  sliders: ['...#.......', '###########', '...#.......', '...........', '.......#...', '###########', '.......#...', '...........', '....#......', '###########', '....#......'],
  help: ['...#####...', '..##...##..', '..##...##..', '.......##..', '......##...', '.....##....', '.....##....', '...........', '.....##....', '.....##....', '...........'],
  pin: ['...#####...', '..#######..', '.###...###.', '.##.....##.', '.###...###.', '..#######..', '...#####...', '....###....', '.....#.....', '...........', '...........'],
  chev: ['...........', '...........', '...........', '.....#.....', '....###....', '...##.##...', '..##...##..', '.##.....##.', '...........', '...........', '...........'],
  bell: ['.....#.....', '....###....', '...#####...', '...#####...', '..#######..', '..###.###..', '..###.###..', '.####.####.', '###########', '...........', '.....#.....'],
  esb: ['.....#.....', '.....#.....', '....###....', '....###....', '...#####...', '...#####...', '...#####...', '..#######..', '..#######..', '.#########.', '.#########.'],
  eiffel: ['.....#.....', '.....#.....', '....###....', '....#.#....', '...##.##...', '...#####...', '..##...##..', '..#######..', '.##.....##.', '.#.......#.', '##.......##'],
  tower: ['.....#.....', '.....#.....', '....###....', '....#.#....', '...#####...', '...#...#...', '..#######..', '..#.....#..', '.##.....##.', '.#.......#.', '##.......##'],
  torii: ['###########', '.#########.', '...#...#...', '.#########.', '..#.....#..', '..#.....#..', '..#.....#..', '..#.....#..', '..#.....#..', '.###...###.', '...........'],
  tour: ['...........', '...#####.#.', '..#.....##.', '.#.....###.', '.#.........', '.#.......#.', '.........#.', '.###.....#.', '.##.....#..', '.#.#####...', '...........'],
  auto: ['...#####...', '..###..##..', '.####...##.', '.####....#.', '#####....##', '#####.....#', '#####....##', '.####....#.', '.####...##.', '..###..##..', '...#####...'],
  clock: ['...#####...', '..#.....#..', '.#...#...#.', '#....#....#', '#....#....#', '#....###..#', '#.........#', '#.........#', '.#.......#.', '..#.....#..', '...#####...'],
  bigben: ['.....#.....', '....###....', '...#####...', '...#.#.#...', '...#####...', '...##.##...', '...#.#.#...', '...#####...', '...#.#.#...', '...#####...', '..#######..'],
};
function iconSVG(name) {
  const rows = ICONS[name];
  if (!rows) return '';
  let r = '';
  for (let y = 0; y < rows.length; y++) {
    let x = 0;
    while (x < rows[y].length) {
      if (rows[y][x] === '#') { let e = x; while (e < rows[y].length && rows[y][e] === '#') e++; r += '<rect x="' + x + '" y="' + y + '" width="' + (e - x) + '" height="1"/>'; x = e; } else x++;
    }
  }
  return '<svg viewBox="0 0 11 11" aria-hidden="true" focusable="false" shape-rendering="crispEdges" fill="currentColor">' + r + '</svg>';
}
const $ = id => document.getElementById(id);
const COARSE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

/* ---------- state and preferences ---------- */
function defaultTod() { const h = new Date().getHours(); return h >= 5 && h < 9 ? 'morning' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night'; }
function defaultH12() { try { return !!new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12; } catch (e) { return true; } }
const state = { city: 'philadelphia', tod: defaultTod(), wx: 'clear', speed: REDUCED ? 0.6 : 1, sound: false, paused: false, hidden: false, menu: false, help: false, seenHint: false, h12: defaultH12(), auto: false, tour: false,
  clockMode: 'off', clockSrc: 'local', clockZone: '', secs: false, showDate: true, showZone: false, clockSize: 1, clockOpacity: 0.7, view: 'side', panel: '' };
let hadPrefs = false;
const PREF_KEY = 'duckair.prefs.v1';
function loadPrefs() {
  try {
    const raw = window.localStorage && window.localStorage.getItem(PREF_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    hadPrefs = true;
    if (p && CITIES.some(c => c.id === p.city)) state.city = p.city;
    if (p && TODS.includes(p.tod)) state.tod = p.tod;
    if (p && WXS.includes(p.wx)) state.wx = p.wx;
    if (p && typeof p.speed === 'number' && isFinite(p.speed)) state.speed = clamp(p.speed, 0.25, 2.5);
    if (p && p.seenHint) state.seenHint = true;
    /* older saves only knew a clock that was on or off */
    if (p && CLOCK_MODES.includes(p.clockMode)) state.clockMode = p.clockMode; else if (p && typeof p.clock === 'boolean') state.clockMode = p.clock ? 'corner' : 'off';
    if (p && CLOCK_SRCS.includes(p.clockSrc)) state.clockSrc = p.clockSrc;
    if (p && tzValid(p.clockZone)) state.clockZone = p.clockZone;
    if (state.clockSrc === 'zone' && !state.clockZone) state.clockSrc = 'local';
    if (p && typeof p.secs === 'boolean') state.secs = p.secs;
    if (p && typeof p.showDate === 'boolean') state.showDate = p.showDate;
    if (p && typeof p.showZone === 'boolean') state.showZone = p.showZone;
    if (p && typeof p.clockSize === 'number' && isFinite(p.clockSize)) state.clockSize = clamp(p.clockSize, 0.5, 2);
    if (p && typeof p.clockOpacity === 'number' && isFinite(p.clockOpacity)) state.clockOpacity = clamp(p.clockOpacity, 0.2, 1);
    if (p && VIEWS.includes(p.view)) state.view = p.view;
    if (p && typeof p.h12 === 'boolean') state.h12 = p.h12;
    if (p && typeof p.auto === 'boolean') state.auto = p.auto;
    if (p && typeof p.tour === 'boolean') state.tour = p.tour;
  } catch (e) { /* storage unavailable: defaults are fine */ }
}
let saveTimer = 0;
function savePrefs() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { window.localStorage.setItem(PREF_KEY, JSON.stringify({ city: state.city, tod: state.tod, wx: state.wx, speed: Math.round(state.speed * 100) / 100, seenHint: state.seenHint, clock: state.clockMode !== 'off', h12: state.h12, auto: state.auto, tour: state.tour,
      clockMode: state.clockMode, clockSrc: state.clockSrc, clockZone: state.clockZone, secs: state.secs, showDate: state.showDate, showZone: state.showZone, clockSize: state.clockSize, clockOpacity: state.clockOpacity, view: state.view })); } catch (e) { /* ignore */ }
  }, 250);
}

/* ---------- elements ---------- */
const ui = $('ui'), dock = $('dock'), tag = $('tag'), tagCity = $('tagCity'), tagMeta = $('tagMeta'), tagPass = $('tagPass'), tagIcon = $('tagIcon'), tagPaused = $('tagPaused');
const cityBtn = $('cityBtn'), cityBtnLabel = $('cityBtnLabel'), cityMenu = $('cityMenu');
const todSeg = $('todSeg'), wxSeg = $('wxSeg'), speedIn = $('speed'), speedOut = $('speedOut');
const soundBtn = $('soundBtn'), pauseBtn = $('pauseBtn'), helpBtn = $('helpBtn'), hideBtn = $('hideBtn'), showBtn = $('showBtn');
const help = $('help'), toastEl = $('toast'), announceEl = $('announce');
const clockEl = $('clock'), clockBtn = $('clockBtn'), clockTime = $('clockTime'), clockAmpm = $('clockAmpm'), clockDate = $('clockDate'), clockCity = $('clockCity'), clockZoneEl = $('clockZone');
const clockPanel = $('clockPanel'), viewPanel = $('viewPanel'), viewBtn = $('viewBtn'), zoneSel = $('zoneSel'), skySwitch = $('skySwitch');
const html = document.documentElement;

function setIcon(el, name) { const s = el.querySelector('.ico'); if (s) s.innerHTML = iconSVG(name); }
document.querySelectorAll('.ico[data-icon]').forEach(s => { s.innerHTML = iconSVG(s.dataset.icon); });

let toastTimer = 0;
function toast(msg, ms) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms || 1700);
}
function announce(msg) { announceEl.textContent = ''; setTimeout(() => { announceEl.textContent = msg; }, 30); }
function describe() {
  const c = CITIES.find(c => c.id === state.city);
  canvas.setAttribute('aria-label', 'Three ducks fly a little propeller plane over ' + c.name + ' at ' + TOD_LABEL[state.tod].toLowerCase() + ', ' + WX_LABEL[state.wx].toLowerCase() + ', seen in the ' + VIEW_LABEL[state.view] + ' view. Click the sky to steer, or click a duck to say hello.');
}

/* ---------- city menu ---------- */
let menuActive = 0;
const MENU = CITIES.map(c => c.id).concat('tour');
const TOUR_SECS = 300;
cityMenu.innerHTML = CITIES.map((c, i) => '<li role="option" id="opt-' + c.id + '" data-city="' + c.id + '" aria-selected="false"><span class="ico">' + iconSVG(c.icon) + '</span><span class="opt-name">' + c.name + '</span><kbd>' + (i + 1) + '</kbd></li>').join('') +
  '<li role="option" id="opt-tour" class="menu-tour" data-city="tour" aria-selected="false"><span class="ico">' + iconSVG('tour') + '</span><span class="opt-name">Tour all five<small>New city every 5 min</small></span><kbd>6</kbd></li>';
function setActive(i) {
  menuActive = mod(i, MENU.length);
  [...cityMenu.children].forEach((li, j) => li.classList.toggle('is-active', j === menuActive));
  cityMenu.setAttribute('aria-activedescendant', 'opt-' + MENU[menuActive]);
  const li = cityMenu.children[menuActive];
  if (li && !cityMenu.hidden && cityMenu.scrollHeight > cityMenu.clientHeight) li.scrollIntoView({ block: 'nearest' });
}
function openMenu() {
  if (state.help) setHelp(false);
  setPanel('');
  state.menu = true; cityMenu.hidden = false; cityBtn.setAttribute('aria-expanded', 'true');
  setActive(state.tour ? MENU.length - 1 : MENU.indexOf(state.city));
  cityMenu.focus();
}
function closeMenu(focusBtn) {
  if (!state.menu) return;
  state.menu = false; cityMenu.hidden = true; cityBtn.setAttribute('aria-expanded', 'false');
  if (focusBtn) cityBtn.focus();
}
cityBtn.addEventListener('click', () => (state.menu ? closeMenu(true) : openMenu()));
cityBtn.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); openMenu(); } });
cityMenu.addEventListener('click', e => { const li = e.target.closest('li[data-city]'); if (li) { chooseCity(li.dataset.city); closeMenu(false); cityMenu.blur(); } });
cityMenu.addEventListener('pointermove', e => { const li = e.target.closest('li[data-city]'); if (li && MENU[menuActive] !== li.dataset.city) setActive(MENU.indexOf(li.dataset.city)); });
cityMenu.addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'ArrowDown') setActive(menuActive + 1);
  else if (k === 'ArrowUp') setActive(menuActive - 1);
  else if (k === 'Home') setActive(0);
  else if (k === 'End') setActive(MENU.length - 1);
  else if (k === 'Enter' || k === ' ') { chooseCity(MENU[menuActive]); closeMenu(true); }
  else if (k === 'Escape') closeMenu(true);
  else if (/^[1-6]$/.test(k)) { chooseCity(MENU[+k - 1]); closeMenu(true); }
  else if (k === 'Tab') { closeMenu(false); return; }
  else return;
  e.preventDefault();
});
document.addEventListener('pointerdown', e => {
  if (state.menu && !cityMenu.contains(e.target) && !cityBtn.contains(e.target)) closeMenu(false);
  if (state.help && !help.contains(e.target) && !helpBtn.contains(e.target)) setHelp(false);
  if (state.panel === 'clock' && !clockPanel.contains(e.target) && !clockBtn.contains(e.target)) setPanel('');
  if (state.panel === 'view' && !viewPanel.contains(e.target) && !viewBtn.contains(e.target) && e.target !== gl3canvas && e.target !== canvas) setPanel('');
});

/* ---------- segmented controls (radio groups) ---------- */
function buildSeg(el, items, labels, icons, keyHint, onPick) {
  el.innerHTML = items.map(v => '<button type="button" role="radio" class="ctl seg-btn" data-v="' + v + '" aria-checked="false" tabindex="-1"' + (icons ? ' title="' + labels[v] + ' (' + keyHint + ' cycles)"><span class="ico">' + iconSVG(icons[v]) + '</span><span class="sr">' + labels[v] + '</span>' : '>' + labels[v]) + '</button>').join('');
  el.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) onPick(b.dataset.v, true); });
  el.addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const btns = [...el.querySelectorAll('button')];
    const i = Math.max(0, btns.indexOf(document.activeElement));
    const nb = btns[(i + step + btns.length) % btns.length];
    onPick(nb.dataset.v, true); nb.focus();
  });
}
function syncSeg(el, v) { el.querySelectorAll('button').forEach(b => { const on = b.dataset.v === v; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }); }
buildSeg(todSeg, TODS, TOD_LABEL, TOD_ICON, 'T', (v, user) => setTod(v, user));
buildSeg(wxSeg, WXS, WX_LABEL, WX_ICON, 'W', (v, user) => setWx(v, user));

/* ---------- actions ---------- */
function syncCityUI() {
  const c = CITIES.find(c => c.id === state.city);
  cityBtnLabel.textContent = c.name;
  $('cityBtnIcon').innerHTML = iconSVG(state.tour ? 'tour' : c.icon);
  cityBtn.setAttribute('aria-label', 'City: ' + c.name + (state.tour ? ', touring all five' : ''));
  cityBtn.title = state.tour ? 'Touring all five cities (1–6)' : 'Choose a city (1–6)';
  [...cityMenu.children].forEach(li => {
    const id = li.dataset.city;
    li.setAttribute('aria-selected', (state.tour ? id === 'tour' : id === state.city) ? 'true' : 'false');
    li.classList.toggle('is-now', state.tour && id === state.city);
  });
  describe();
}
/* Tour: hop to the next city every few minutes of flying (paused time does not count). */
let tourAt = TOUR_SECS;
function tourHop() {
  const next = CITIES[(CITIES.findIndex(c => c.id === state.city) + 1) % CITIES.length].id;
  state.city = next; syncCityUI(); savePrefs();
  startTransition(next, false);
  tourAt = world.t + TOUR_SECS;
}
function tourLeft() {
  const s = Math.max(0, tourAt - world.t);
  return s > 60 ? 'about ' + Math.ceil(s / 60) + ' min' : 'under a minute';
}
function chooseCity(id) {
  if (id === 'tour') {
    if (state.tour) { toast('Touring · next city in ' + tourLeft()); return; }
    state.tour = true;
    toast('Touring all five cities, a new one every 5 minutes', 2600);
    tourHop();
    return;
  }
  const name = CITIES.find(c => c.id === id).name, wasTour = state.tour;
  state.tour = false;
  if (state.city === id) { if (wasTour) { syncCityUI(); savePrefs(); } toast((wasTour ? 'Staying over ' : 'Already over ') + name); return; }
  state.city = id; syncCityUI(); savePrefs();
  startTransition(id, false);
}
/* Match sky to clock: the selected clock's zone decides morning, day, sunset or night.
   The change is a slow cross-fade, so the light drifts rather than snaps. */
const SKY_P = { y: 0, mo: 0, d: 0, wd: '', mon: '', h: 0, mi: 0, s: 0, abbr: '', off: 0 };
function skyNow() { const tz = clockTz(); return skyPhase(partsIn(tz, SKY_P), tz, clockGeo()); }
function applySky(instant) {
  const v = skyNow();
  if (state.tod === v) return;
  state.tod = v; syncSeg(todSeg, v); setLook(state.tod, state.wx, !!instant, 14); describe();
}
function setAuto(on, user) {
  state.auto = on;
  skySwitch.setAttribute('aria-checked', on ? 'true' : 'false');
  todSeg.classList.toggle('is-auto', on);
  if (on) applySky(false);
  savePrefs();
  if (user) toast(on ? 'The sky now follows the clock' : 'Sky set by hand: ' + TOD_LABEL[state.tod]);
}
function setTod(v, user) {
  const wasAuto = state.auto;
  if (wasAuto) { state.auto = false; skySwitch.setAttribute('aria-checked', 'false'); todSeg.classList.remove('is-auto'); }
  if (state.tod !== v) { state.tod = v; setLook(state.tod, state.wx, false); describe(); }
  syncSeg(todSeg, v); savePrefs();
  if (user) toast(TOD_LABEL[v] + (wasAuto ? ' · no longer following the clock' : ''), wasAuto ? 2400 : 0);
}
function setWx(v, user) {
  if (state.wx === v) return;
  state.wx = v; syncSeg(wxSeg, v); setLook(state.tod, state.wx, false); savePrefs(); describe();
  if (user) toast(WX_LABEL[v]);
}
function paintRange() { speedIn.style.setProperty('--fill', ((state.speed - 0.25) / 2.25 * 100).toFixed(1) + '%'); }
function setSpeed(v, user) {
  state.speed = clamp(Math.round(v * 100) / 100, 0.25, 2.5);
  world.speedTarget = state.speed;
  speedIn.value = String(state.speed);
  const name = speedName(state.speed);
  speedOut.textContent = name;
  speedIn.setAttribute('aria-valuetext', name + ', ' + state.speed.toFixed(2) + ' times');
  paintRange(); savePrefs();
  if (user === 'key') toast('Speed: ' + name);
}
speedIn.addEventListener('input', () => setSpeed(parseFloat(speedIn.value), 'slider'));
function toggleSound() {
  const on = !state.sound;
  if (on && !Sound.setEnabled(true)) { toast('Sound is not available in this browser'); return; }
  if (!on) Sound.setEnabled(false);
  state.sound = on;
  soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  setIcon(soundBtn, on ? 'sound' : 'mute');
  soundBtn.title = on ? 'Turn sound off (M)' : 'Turn sound on (M)';
  toast(on ? (state.paused ? 'Sound on. It plays when you resume.' : wp.plash ? 'Sound on. It keeps playing on your desktop.' : 'Sound on') : 'Sound off', on && wp.plash ? 2600 : 0);
  if (on && !state.paused) DUCKS[(Math.random() * 3) | 0].quackQueue.push(0.5);
}
function togglePause() {
  state.paused = !state.paused;
  world.paused = state.paused;
  Sound.setPaused(state.paused);
  pauseBtn.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
  setIcon(pauseBtn, state.paused ? 'play' : 'pause');
  pauseBtn.title = state.paused ? 'Resume (Space)' : 'Pause (Space)';
  pauseBtn.querySelector('.sr').textContent = state.paused ? 'Resume' : 'Pause';
  tagPaused.hidden = !state.paused;
  toast(state.paused ? 'Paused' : 'Flying again');
  needsRender = true;
}
function setHelp(on) {
  state.help = on; help.hidden = !on; helpBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  if (on) { closeMenu(false); setPanel(''); toastEl.classList.remove('is-on'); help.scrollTop = 0; }
}
/* the Clock and View panels share the spot above the dock; only one is open at a time */
function setPanel(name) {
  if (state.panel === name) return;
  state.panel = name;
  clockPanel.hidden = name !== 'clock'; viewPanel.hidden = name !== 'view';
  clockBtn.setAttribute('aria-expanded', name === 'clock' ? 'true' : 'false'); viewBtn.setAttribute('aria-expanded', name === 'view' ? 'true' : 'false');
  if (name) {
    closeMenu(false); if (state.help) setHelp(false);
    toastEl.classList.remove('is-on');
    if (name === 'clock') { fillZones(); syncClockUI(); clockPanel.scrollTop = 0; } else { syncViewUI(); viewPanel.scrollTop = 0; }
  }
}
clockBtn.addEventListener('click', () => setPanel(state.panel === 'clock' ? '' : 'clock'));
viewBtn.addEventListener('click', () => setPanel(state.panel === 'view' ? '' : 'view'));
$('clockClose').addEventListener('click', () => { setPanel(''); clockBtn.focus(); });
$('viewClose').addEventListener('click', () => { setPanel(''); viewBtn.focus(); });
helpBtn.addEventListener('click', () => setHelp(!state.help));
$('helpClose').addEventListener('click', () => { setHelp(false); helpBtn.focus(); });
let idleTimer = 0;
function pokeShow() {
  showBtn.classList.remove('is-idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => showBtn.classList.add('is-idle'), 3200);
}
function setHidden(h, silent) {
  if (state.hidden === h) return;
  const focusInDock = dock.contains(document.activeElement), focusOnShow = document.activeElement === showBtn;
  state.hidden = h;
  ui.classList.toggle('is-hidden', h);
  dock.inert = h; tag.inert = h;
  showBtn.hidden = !h;
  if (h) {
    closeMenu(false); setHelp(false); setPanel(''); pokeShow();
    if (focusInDock) showBtn.focus();
    if (!silent) toast(COARSE ? 'Controls hidden. Tap Show controls to bring them back.' : 'Controls hidden. Press H or click Show controls.', 2600);
  } else {
    if (focusOnShow || focusInDock) hideBtn.focus();
  }
  updateDockMetrics();
}
soundBtn.addEventListener('click', toggleSound);
pauseBtn.addEventListener('click', togglePause);
hideBtn.addEventListener('click', () => setHidden(true));
showBtn.addEventListener('click', () => setHidden(false));
['pointermove', 'pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { if (state.hidden) pokeShow(); }, { passive: true }));

/* ---------- clock ---------- */
function pixelTimeSVG(str) {
  let x = 0, digits = '', colon = '';
  for (const ch of str) {
    const g = DIGITS[ch];
    if (!g) continue;
    const w = g[0].length;
    let r = '';
    for (let y = 0; y < 7; y++) {
      let i = 0;
      while (i < w) {
        if (g[y][i] === '#') { let e = i; while (e < w && g[y][e] === '#') e++; r += '<rect x="' + (x + i) + '" y="' + y + '" width="' + (e - i) + '" height="1"/>'; i = e; } else i++;
      }
    }
    if (ch === ':') colon += r; else digits += r;
    x += w + 1;
  }
  const inner = digits + '<g class="clock-colon">' + colon + '</g>';
  return '<svg viewBox="0 0 ' + x + ' 8" aria-hidden="true" focusable="false"><g fill="rgba(20,13,30,0.55)" transform="translate(1 1)">' + inner + '</g><g fill="currentColor">' + inner + '</g></svg>';
}
const clockFmt = {};
function fmtIn(kind, tz, h12) {
  const key = kind + '|' + (tz || '~') + '|' + h12;
  if (clockFmt[key] === undefined) {
    const o = kind === 'time' ? { hour: 'numeric', minute: '2-digit', hour12: h12 } : { weekday: 'short', month: 'short', day: 'numeric' };
    if (tz) o.timeZone = tz;
    try { clockFmt[key] = new Intl.DateTimeFormat(undefined, o); } catch (e) { clockFmt[key] = null; }
  }
  const f = clockFmt[key];
  return f ? f.format(new Date()) : '';
}
const cityNow = () => CITIES.find(x => x.id === (city ? city.id : state.city));
function clockTz() { return state.clockSrc === 'dest' ? CITY_TZ[cityNow().id] : state.clockSrc === 'zone' && state.clockZone ? state.clockZone : LOCAL_TZ; }
function clockGeo() { return state.clockSrc === 'dest' ? CITY_GEO[cityNow().id] : null; }
function clockLabel(tz, P) {
  const name = state.clockSrc === 'local' ? 'My time' : state.clockSrc === 'dest' ? cityNow().name : zoneCity(tz);
  return P.abbr ? name + ' · ' + P.abbr : name;
}
let clockSec = -1, cornerKey = '';
/* Runs every frame but only works when the wall-clock second changes, so the clock
   stays right while the flight is paused and catches up at once after a tab switch. */
function clockTick(force) {
  const sec = Math.floor(Date.now() / 1000);
  if (!force && sec === clockSec) return;
  clockSec = sec;
  if (state.clockMode === 'off') return;
  const tz = clockTz(), P = partsIn(tz, NOW);
  if (state.clockMode === 'bg') {
    const key = P.h + ':' + P.mi + ':' + (state.secs ? P.s : P.s & 1) + '|' + P.d + '|' + state.h12 + state.secs + state.showDate + state.showZone + '|' + state.clockSize + '|' + tz + '|' + state.clockSrc + '|' + cityNow().id + '|' + view.VW;
    if (force || key !== bgClock.key) {
      bgClock.key = key;
      paintBgClock(P, { h12: state.h12, secs: state.secs, date: state.showDate, zone: state.showZone, size: state.clockSize, label: clockLabel(tz, P) });
      needsRender = true;
    }
    return;
  }
  const key = P.h + ':' + P.mi + (state.secs ? ':' + P.s : '') + '|' + P.d + '|' + state.h12 + state.showDate + state.showZone + '|' + tz + '|' + state.clockSrc + '|' + cityNow().id;
  if (!force && key === cornerKey) return;
  cornerKey = key;
  const shown = (state.h12 ? String(P.h % 12 || 12) : pad2(P.h)) + ':' + pad2(P.mi) + (state.secs ? ':' + pad2(P.s) : '');
  const ampm = state.h12 ? (P.h < 12 ? 'AM' : 'PM') : '', label = clockLabel(tz, P), c = cityNow();
  clockTime.innerHTML = pixelTimeSVG(shown);
  clockAmpm.textContent = ampm; clockAmpm.hidden = !ampm;
  clockDate.textContent = state.showDate ? fmtIn('date', tz, false) : ''; clockDate.hidden = !state.showDate;
  clockZoneEl.textContent = state.showZone ? label : ''; clockZoneEl.hidden = !state.showZone;
  const other = state.clockSrc === 'local' ? fmtIn('time', CITY_TZ[c.id], state.h12) : fmtIn('time', LOCAL_TZ, state.h12);
  const otherName = state.clockSrc === 'local' ? c.name : 'Your time';
  clockCity.innerHTML = other ? otherName + ' · <b>' + other + '</b>' : '';
  clockEl.setAttribute('aria-label', label + ' ' + shown + (ampm ? ' ' + ampm : '') + '. ' + (other ? (state.clockSrc === 'local' ? 'In ' + c.name + ' it is ' : 'Your own time is ') + other + '. ' : '') + 'Switch to ' + (state.h12 ? '24' : '12') + '-hour time.');
  clockEl.title = 'Switch to ' + (state.h12 ? '24' : '12') + '-hour time';
  html.style.setProperty('--clock-h', clockEl.offsetHeight + 'px');
}
function refreshClock() {
  bgClock.on = state.clockMode === 'bg'; bgClock.alpha = state.clockOpacity;
  clockEl.hidden = state.clockMode !== 'corner';
  clockBtn.classList.toggle('is-lit', state.clockMode !== 'off');
  clockBtn.title = 'Clock: ' + CLOCK_MODE_LABEL[state.clockMode] + ' (C)';
  bgClock.key = ''; cornerKey = '';
  clockTick(true);
  if (state.auto) applySky(false);
  needsRender = true;
  if (state.panel === 'clock') syncClockUI();
}
function setClockMode(mode, user) {
  state.clockMode = mode;
  refreshClock(); savePrefs();
  if (user) toast('Clock: ' + CLOCK_MODE_LABEL[mode]);
}
function setClockSrc(src, user) {
  if (src === 'zone' && !state.clockZone) state.clockZone = zoneName(LOCAL_TZ) || 'UTC';
  state.clockSrc = src;
  refreshClock(); savePrefs();
  if (user) toast('Clock: ' + clockLabel(clockTz(), NOW.abbr ? NOW : partsIn(clockTz(), NOW)));
}
/* the time-zone list is long, so it is only built the first time the panel opens */
let zonesFilled = false;
function fillZones() {
  if (zonesFilled) return;
  zonesFilled = true;
  const groups = {};
  for (const z of ZONES) { const i = z.indexOf('/'), g = i > 0 ? z.slice(0, i) : 'Other'; (groups[g] || (groups[g] = [])).push(z); }
  let h = '';
  for (const g of Object.keys(groups).sort()) {
    h += '<optgroup label="' + g + '">' + groups[g].map(z => '<option value="' + z + '">' + z.slice(z.indexOf('/') + 1).replace(/_/g, ' ').replace(/\//g, ' / ') + '</option>').join('') + '</optgroup>';
  }
  zoneSel.innerHTML = h;
}
buildSeg($('clockModeSeg'), CLOCK_MODES, CLOCK_MODE_LABEL, null, '', v => setClockMode(v, false));
buildSeg($('clockSrcSeg'), CLOCK_SRCS, CLOCK_SRC_LABEL, null, '', v => setClockSrc(v, false));
buildSeg($('clockFmtSeg'), ['12', '24'], { 12: '12-hour', 24: '24-hour' }, null, '', v => { state.h12 = v === '12'; refreshClock(); savePrefs(); });
function syncClockUI() {
  syncSeg($('clockModeSeg'), state.clockMode); syncSeg($('clockSrcSeg'), state.clockSrc); syncSeg($('clockFmtSeg'), state.h12 ? '12' : '24');
  $('zoneRow').hidden = state.clockSrc !== 'zone';
  if (state.clockSrc === 'zone' && zonesFilled) zoneSel.value = zoneName(state.clockZone);
  const tz = clockTz(), P = partsIn(tz, SKY_P);
  $('zoneNote').textContent = state.clockSrc === 'local' ? 'Detected from this device: ' + (LOCAL_TZ ? LOCAL_TZ.replace(/_/g, ' ') : 'local time') + (P.abbr ? ' (' + P.abbr + ')' : '') + '. No location permission is used.'
    : state.clockSrc === 'dest' ? 'Shows the time in ' + cityNow().name + (P.abbr ? ' (' + P.abbr + ')' : '') + ' and changes with the city.' : 'Now ' + fmtIn('time', tz, state.h12) + (P.abbr ? ' ' + P.abbr : '') + ' in ' + zoneCity(tz) + '.';
  $('chipSecs').setAttribute('aria-pressed', state.secs ? 'true' : 'false'); $('chipDate').setAttribute('aria-pressed', state.showDate ? 'true' : 'false'); $('chipZone').setAttribute('aria-pressed', state.showZone ? 'true' : 'false');
  const bg = state.clockMode === 'bg', off = state.clockMode === 'off';
  for (const id of ['clockSize', 'clockOpacity']) { const el = $(id); el.disabled = !bg; el.closest('.row').classList.toggle('is-off', !bg); }
  $('clockSize').value = String(state.clockSize); $('clockOpacity').value = String(state.clockOpacity);
  $('clockSize').style.setProperty('--fill', ((state.clockSize - 0.5) / 1.5 * 100).toFixed(1) + '%'); $('clockOpacity').style.setProperty('--fill', ((state.clockOpacity - 0.2) / 0.8 * 100).toFixed(1) + '%');
  $('clockSize').setAttribute('aria-valuetext', Math.round(state.clockSize * 100) + ' percent'); $('clockOpacity').setAttribute('aria-valuetext', Math.round(state.clockOpacity * 100) + ' percent');
  $('bgHint').hidden = bg; $('bgHint').textContent = off ? 'Turn the clock on to use these.' : 'Size and opacity apply to the Background clock.';
  skySwitch.setAttribute('aria-checked', state.auto ? 'true' : 'false');
}
zoneSel.addEventListener('change', () => { if (tzValid(zoneSel.value)) { state.clockZone = zoneSel.value; refreshClock(); savePrefs(); } });
for (const [id, key] of [['chipSecs', 'secs'], ['chipDate', 'showDate'], ['chipZone', 'showZone']]) $(id).addEventListener('click', () => { state[key] = !state[key]; refreshClock(); savePrefs(); });
$('clockSize').addEventListener('input', e => { state.clockSize = clamp(parseFloat(e.target.value) || 1, 0.5, 2); refreshClock(); savePrefs(); });
$('clockOpacity').addEventListener('input', e => { state.clockOpacity = clamp(parseFloat(e.target.value) || 0.7, 0.2, 1); refreshClock(); savePrefs(); });
skySwitch.addEventListener('click', () => setAuto(!state.auto, true));
clockEl.addEventListener('click', () => { state.h12 = !state.h12; refreshClock(); savePrefs(); toast(state.h12 ? '12-hour time' : '24-hour time'); });

/* ---------- views ---------- */
let viewFade = 0;
function syncViewUI() {
  syncSeg($('viewSeg'), state.view);
  viewBtn.title = 'View: ' + VIEW_LABEL[state.view] + ' (V)';
  $('viewBtnLabel').textContent = VIEW_LABEL[state.view];
  viewBtn.classList.toggle('is-lit', state.view !== 'side');
  const broken = V3.tried && !V3.ok;
  $('viewNote').textContent = broken ? V3.why + ' The Side view works as usual.' : VIEW_NOTE[state.view];
  $('viewSeg').querySelectorAll('button').forEach(b => { if (b.dataset.v !== 'side') b.disabled = broken; });
  $('camBox').hidden = state.view !== '3d';
}
function setView(v, user, instant) {
  if (v !== 'side' && !v3init()) {
    if (user) toast(V3.why + ' Staying in the Side view.', 5200);
    v = 'side';
  }
  const prev = state.view;
  state.view = v; viewMode = v;
  if (v === 'side' && prev !== 'side') v3sync(false);
  if (v !== 'side') {
    if (!V3.city || V3.city.id !== city.id) v3city(city.id);
    else if (prev === 'side') v3sync(true);
    v3resize();
    if (instant) V3.snap = true;
    else if (prev === 'side') { const c = V3.cam, s = POSE3.side; c.yaw = s.yaw; c.pitch = s.pitch; c.dist = s.dist; c.fov = s.fov; c.tx = (plane.rx - view.VW * 0.42) * 0.3; c.ty = altOf(plane.ry); c.tz = V3.lat; }
  }
  html.classList.toggle('v3d', v !== 'side'); html.classList.toggle('v3d-orbit', v === '3d');
  viewFade = instant || REDUCED || prev === v ? 0 : 0.55;
  syncViewUI(); describe(); needsRender = true;
  if (prev !== v) savePrefs();
  if (user && prev !== v) toast(v === '3d' ? '3D view · drag to look around' : VIEW_LABEL[v] + ' view', 2000);
}
buildSeg($('viewSeg'), VIEWS, VIEW_LABEL, null, '', v => setView(v, true));
function camPreset(name) {
  const o = V3.orbit, p = name === 'front' ? [Math.PI / 2, 0.12, 132] : name === 'rear' ? [-Math.PI / 2, 0.24, 142] : name === 'side' ? [0, 0.05, 172] : [POSE3.orbit.yaw, POSE3.orbit.pitch, POSE3.orbit.dist];
  o.yaw = p[0]; o.pitch = p[1]; o.dist = p[2];
  needsRender = true;
  announce(name === 'reset' ? 'Camera reset' : 'Camera at the ' + name);
}
function camZoom(f) { V3.orbit.dist = clamp(V3.orbit.dist * f, 60, 300); needsRender = true; }
$('camFront').addEventListener('click', () => camPreset('front'));
$('camSide').addEventListener('click', () => camPreset('side'));
$('camRear').addEventListener('click', () => camPreset('rear'));
$('camReset').addEventListener('click', () => camPreset('reset'));
$('camIn').addEventListener('click', () => camZoom(0.8));
$('camOut').addEventListener('click', () => camZoom(1.25));

/* ---------- label ---------- */
let passingName = '';
hooks.onCity = c => {
  const info = CITIES.find(x => x.id === c.id);
  tag.classList.add('is-swapping');
  setTimeout(() => {
    tagCity.textContent = c.name;
    tagMeta.textContent = c.meta + ' · ' + c.river;
    tagIcon.innerHTML = iconSVG(info.icon);
    tag.classList.remove('is-swapping', 'is-passing');
    passingName = '';
  }, 280);
  announce('Now flying over ' + c.name);
  refreshClock();
};
hooks.onQuack = d => { Sound.quack(d.voice, 0.85); const [wx, wy] = planeToWorld(d.seat + 6, d.hy - 10); emit('note', wx, wy); emit3(DUCKS.indexOf(d), 'note'); };
hooks.onPhoto = () => { Sound.shutter(); emit3(1, 'spark'); };
hooks.onWave = i => emit3(i, 'heart');
function updatePassing() {
  const lm = viewMode === 'side' ? landmarkInView() : null;
  const name = viewMode !== 'side' ? v3landmark() : lm && Math.abs(lm.sx - view.VW * 0.5) < view.VW * 0.24 ? lm.name : '';
  if (name === passingName) return;
  passingName = name;
  if (name) { tagPass.textContent = 'Passing ' + name; tag.classList.add('is-passing'); }
  else tag.classList.remove('is-passing');
}

/* ---------- pointer input on the scene ---------- */
let drag = null;
function toArt(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * view.dpr / view.S, (e.clientY - r.top) * view.dpr / view.S];
}
canvas.addEventListener('pointerdown', e => {
  if (state.menu) { closeMenu(false); return; }
  if (state.help) { setHelp(false); return; }
  if (state.panel === 'clock') { setPanel(''); return; }
  const [ax, ay] = toArt(e);
  const hit = duckAt(ax, ay, e.pointerType !== 'mouse');
  if (hit >= 0) {
    waveDuck(hit);
    needsRender = true;
    e.preventDefault();
    return;
  }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  drag = e.pointerId;
  steerTo(ax, ay, false);
  needsRender = true;
  e.preventDefault();
});
canvas.addEventListener('pointermove', e => {
  const [ax, ay] = toArt(e);
  if (drag === e.pointerId) { steerTo(ax, ay, true); marker.life = Math.max(marker.life, 0.6); marker.x = plane.homeX; marker.y = plane.homeY; return; }
  if (e.pointerType === 'mouse') canvas.style.cursor = duckAt(ax, ay, false) >= 0 ? 'pointer' : 'crosshair';
});
const endDrag = e => { if (drag === e.pointerId) drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('contextmenu', e => { if (!wp.on) e.preventDefault(); });

/* ---------- pointer input in the Front, Rear and 3D views ----------
   Front and Rear steer like the side view. In 3D a drag turns the camera instead,
   so steering there is left to the arrow keys and the two never fight. */
const ptr3 = new Map();
let tap3 = null, pinch = null;
function at3(e) { const r = gl3canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
gl3canvas.addEventListener('pointerdown', e => {
  if (state.menu) { closeMenu(false); return; }
  if (state.help) { setHelp(false); return; }
  if (state.panel === 'clock') { setPanel(''); return; }
  const [cx, cy] = at3(e);
  try { gl3canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  e.preventDefault();
  if (viewMode === '3d') {
    ptr3.set(e.pointerId, [cx, cy]);
    if (ptr3.size === 1) tap3 = { id: e.pointerId, x: cx, y: cy, t: performance.now(), moved: false, touch: e.pointerType !== 'mouse' };
    else { tap3 = null; const p = [...ptr3.values()]; pinch = { d: Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1, dist: V3.orbit.dist }; }
    return;
  }
  const hit = v3duckAt(cx, cy, e.pointerType !== 'mouse');
  if (hit >= 0) { waveDuck(hit); needsRender = true; return; }
  drag = e.pointerId;
  v3steer(cx, cy); needsRender = true;
});
gl3canvas.addEventListener('pointermove', e => {
  const [cx, cy] = at3(e);
  if (viewMode === '3d' && ptr3.has(e.pointerId)) {
    const prev = ptr3.get(e.pointerId), dx = cx - prev[0], dy = cy - prev[1];
    prev[0] = cx; prev[1] = cy;
    if (ptr3.size >= 2 && pinch) {
      const p = [...ptr3.values()], d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1;
      V3.orbit.dist = clamp(pinch.dist * pinch.d / d, 60, 300); V3.dragging = true; needsRender = true;
    } else if (tap3) {
      if (!tap3.moved && Math.hypot(cx - tap3.x, cy - tap3.y) > 6) tap3.moved = true;
      if (tap3.moved) { V3.orbit.yaw -= dx * 0.0075; V3.orbit.pitch = clamp(V3.orbit.pitch + dy * 0.006, -0.14, 1.25); V3.dragging = true; html.classList.add('is-orbiting'); needsRender = true; }
    }
    return;
  }
  if (drag === e.pointerId) { v3steer(cx, cy); needsRender = true; return; }
  if (e.pointerType === 'mouse' && V3.ok) gl3canvas.style.cursor = v3duckAt(cx, cy, false) >= 0 ? 'pointer' : '';
});
function end3(e) {
  if (drag === e.pointerId) drag = null;
  if (!ptr3.has(e.pointerId)) return;
  ptr3.delete(e.pointerId);
  if (tap3 && tap3.id === e.pointerId) {
    if (e.type === 'pointerup' && !tap3.moved && performance.now() - tap3.t < 600) { const hit = v3duckAt(tap3.x, tap3.y, tap3.touch); if (hit >= 0) { waveDuck(hit); needsRender = true; } }
    tap3 = null;
  }
  if (ptr3.size < 2) pinch = null;
  if (ptr3.size === 1) { const [id, p] = [...ptr3.entries()][0]; tap3 = { id, x: p[0], y: p[1], t: 0, moved: true, touch: true }; }
  if (ptr3.size === 0) { V3.dragging = false; html.classList.remove('is-orbiting'); }
}
gl3canvas.addEventListener('pointerup', end3);
gl3canvas.addEventListener('pointercancel', end3);
gl3canvas.addEventListener('wheel', e => { if (viewMode !== '3d') return; e.preventDefault(); camZoom(Math.exp(clamp(e.deltaY, -240, 240) * 0.0014)); }, { passive: false });
gl3canvas.addEventListener('contextmenu', e => { if (!wp.on) e.preventDefault(); });

/* ---------- keyboard ---------- */
const ARROWS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
window.addEventListener('keydown', e => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target, tagName = t && t.tagName;
  const inField = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
  if (ARROWS[e.key]) {
    if (inField || (t.closest && t.closest('[role="radiogroup"],[role="listbox"]'))) return;
    if (e.shiftKey && viewMode === '3d') {
      const o = V3.orbit;
      if (e.key === 'ArrowLeft') o.yaw += 0.14; else if (e.key === 'ArrowRight') o.yaw -= 0.14; else o.pitch = clamp(o.pitch + (e.key === 'ArrowUp' ? 0.1 : -0.1), -0.14, 1.25);
      needsRender = true; e.preventDefault(); return;
    }
    input[ARROWS[e.key]] = 1; e.preventDefault(); return;
  }
  if (e.key === ' ' || e.key === 'Spacebar') {
    if (tagName === 'BUTTON' || inField || tagName === 'LI') return;
    togglePause(); e.preventDefault(); return;
  }
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (/^[1-6]$/.test(k)) { chooseCity(MENU[+k - 1]); return; }
  switch (k) {
    case 't': setTod(TODS[(TODS.indexOf(state.tod) + 1) % TODS.length], true); break;
    case 'w': setWx(WXS[(WXS.indexOf(state.wx) + 1) % 3], true); break;
    case '[': case '-': setSpeed(state.speed - 0.25, 'key'); break;
    case ']': case '=': case '+': setSpeed(state.speed + 0.25, 'key'); break;
    case 'm': toggleSound(); break;
    case 'c': setClockMode(CLOCK_MODES[(CLOCK_MODES.indexOf(state.clockMode) + 1) % CLOCK_MODES.length], true); break;
    case 'v': setView(VIEWS[(VIEWS.indexOf(state.view) + 1) % VIEWS.length], true); break;
    case 'r': if (state.view === '3d') { camPreset('reset'); toast('Camera reset'); } break;
    case 'p': togglePause(); break;
    case 'h': setHidden(!state.hidden); break;
    case 'q': waveDuck((Math.random() * 3) | 0); needsRender = true; break;
    case '?': case '/': setHelp(!state.help); break;
    case 'Escape':
      if (state.menu) closeMenu(true); else if (state.help) setHelp(false); else if (state.panel) { const b = state.panel === 'clock' ? clockBtn : viewBtn; setPanel(''); b.focus(); } else if (state.hidden) setHidden(false);
      break;
    default: return;
  }
});
window.addEventListener('keyup', e => { if (ARROWS[e.key]) input[ARROWS[e.key]] = 0; });
window.addEventListener('blur', () => { input.up = input.down = input.left = input.right = 0; drag = null; });

/* ---------- layout bookkeeping ---------- */
let pendingLayout = true;
function updateDockMetrics() {
  const groups = dock.querySelectorAll('.dock-group');
  dock.classList.toggle('is-wrapped', groups.length > 1 && groups[1].offsetTop > groups[0].offsetTop + 4);
  const r = dock.getBoundingClientRect();
  const h = state.hidden ? 0 : r.height;
  document.documentElement.style.setProperty('--dock-h', Math.round(h) + 'px');
  view.dockTop = state.hidden ? 1e9 : r.top;
  computeBounds();
}
window.addEventListener('resize', () => { pendingLayout = true; });
if (window.ResizeObserver) new ResizeObserver(() => { if (!state.hidden) updateDockMetrics(); }).observe(dock);
let mq = null;
function watchDpr() {
  if (!window.matchMedia) return;
  if (mq) mq.removeEventListener ? mq.removeEventListener('change', onDpr) : mq.removeListener(onDpr);
  mq = window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
  mq.addEventListener ? mq.addEventListener('change', onDpr) : mq.addListener(onDpr);
}
function onDpr() { pendingLayout = true; watchDpr(); }
watchDpr();
document.addEventListener('visibilitychange', () => { Sound.suspendForHidden(document.hidden); last = 0; if (!document.hidden) { clockTick(true); if (state.auto) applySky(false); needsRender = true; } });
window.addEventListener('focus', () => { clockTick(true); });

/* ---------- main loop ---------- */
let last = 0, audioTick = 0, labelTick = 0, autoTick = 0, insetTick = 0, lastRun = 0, frameCount = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (wp.fps && lastRun && now - lastRun < 1000 / wp.fps - 2) return;
  lastRun = now; frameCount++;
  if (!last) last = now;
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) dt = 0;
  if (dt > 0.1) dt = 0.1;
  if (pendingLayout) { pendingLayout = false; if (wp.on) applyInsets(); layout(); updateDockMetrics(); }
  if (LA) { lookK += dt / lookDur; if (lookK >= 1) { lookK = 1; LA = null; } needsRender = true; }
  updateTransition(dt);
  updateCur();
  if (!world.paused) {
    let rem = dt;
    while (rem > 1e-6) { const h = Math.min(rem, 1 / 60); simulate(h); rem -= h; }
    needsRender = true;
  }
  clockTick(false);
  const in3 = viewMode !== 'side';
  if (viewFade > 0) { viewFade -= dt; needsRender = true; }
  if (in3 || viewFade > 0) {
    const c = V3.cam, y0 = c.yaw, p0 = c.pitch, d0 = c.dist, x0 = c.tx;
    v3camera(dt);
    if (Math.abs(c.yaw - y0) + Math.abs(c.pitch - p0) > 1e-4 || Math.abs(c.dist - d0) + Math.abs(c.tx - x0) > 1e-3) needsRender = true;
  }
  if (needsRender) {
    if (!in3 || viewFade > 0) render(); else tickClock(Date.now());
    if (in3 || viewFade > 0) v3render();
    needsRender = false;
  }
  audioTick -= dt;
  if (audioTick <= 0) { audioTick = 0.1; Sound.tick(world.t, world.speed, cur.rain); }
  labelTick -= dt;
  if (labelTick <= 0) { labelTick = 0.4; updatePassing(); }
  autoTick -= dt;
  if (autoTick <= 0) { autoTick = 15; if (state.auto) applySky(false); }
  if (state.tour && !world.paused && !trans.on && world.t >= tourAt) tourHop();
  if (wp.on) { insetTick -= dt; if (insetTick <= 0) { insetTick = 2; if (screenChanged()) pendingLayout = true; } }
}

/* ---------- wallpaper mode (Plash, or ?#wallpaper, or the wallpaper copy) ---------- */
/* A wallpaper runs at 30 fps and one pixel per CSS pixel to stay light on power, keeps
   its labels clear of the menu bar and the Dock, and starts with the clock, Auto sky and
   a city tour, unless this copy already has saved settings. */
const wp = { on: false, plash: false, browsing: null, fps: 0 };
function enableWallpaper(booting) {
  if (wp.on) return;
  wp.on = true; wp.fps = 30;
  html.classList.add('wp');
  view.dprCap = 1;
  applyInsets();
  if (!hadPrefs) {
    if (booting) { state.clockMode = 'corner'; state.auto = true; state.tour = true; }
    else {
      setClockMode('corner', false);
      setAuto(true, false);
      if (!state.tour) { state.tour = true; tourAt = world.t + TOUR_SECS; syncCityUI(); savePrefs(); }
    }
  }
  setHidden(true, true);
  pendingLayout = true;
}
/* Keep labels and controls clear of the menu bar and the Dock. The page only covers a
   whole display when it is a wallpaper; then the screen's available area tells how much
   the menu bar (when the page runs under it) and a bottom Dock take up. */
const scr = { w: 0, h: 0, ah: 0, at: 0, iw: 0, ih: 0 };
function screenChanged() {
  const s = window.screen || {};
  const at = typeof s.availTop === 'number' ? s.availTop : -1;
  if (scr.w === s.width && scr.h === s.height && scr.ah === s.availHeight && scr.at === at && scr.iw === window.innerWidth && scr.ih === window.innerHeight) return false;
  scr.w = s.width; scr.h = s.height; scr.ah = s.availHeight; scr.at = at; scr.iw = window.innerWidth; scr.ih = window.innerHeight;
  return true;
}
function measureInsets() {
  screenChanged();
  const { w, h, ah, at, iw, ih } = scr;
  if (!(h > 0 && ah > 0) || Math.abs(iw - w) > 2 || ih <= ah + 2) return [0, 0];
  const under = ih >= h - 2, gap = h - ah;
  const menu = under ? (at >= 0 && at < 60 ? at : Math.min(gap, 38)) : clamp(h - ih + 1, 0, 60);
  const dockH = clamp(gap - menu, 0, 220);
  return [under ? Math.round(menu) : 0, dockH > 6 ? Math.round(dockH) : 0];
}
function applyInsets() {
  const [top, bottom] = measureInsets();
  view.insetTop = top; view.insetBottom = bottom;
  html.style.setProperty('--inset-top', top + 'px');
  html.style.setProperty('--inset-bottom', bottom + 'px');
}
/* Plash marks its pages with classes on <html>: is-plash-app always, and
   plash-is-browsing-mode while Browsing Mode lets clicks through to the page. */
function syncPlash() {
  if (!html.classList.contains('is-plash-app')) return;
  wp.plash = true;
  enableWallpaper(false);
  if (!html.classList.contains('wp')) html.classList.add('wp');
  const browsing = html.classList.contains('plash-is-browsing-mode');
  if (browsing === wp.browsing) return;
  const first = wp.browsing === null;
  wp.browsing = browsing;
  html.classList.toggle('wp-passive', !browsing);
  setHidden(!browsing, true);
  if (browsing && !first) toast('Browsing Mode: the controls are yours', 2400);
}
if (window.MutationObserver) new MutationObserver(syncPlash).observe(html, { attributes: true, attributeFilter: ['class'] });

/* ---------- start ---------- */
function start() {
  loadPrefs();
  if (window.DUCKAIR_WALLPAPER || /(^|[#&])wallpaper\b/.test(location.hash) || html.classList.contains('is-plash-app')) enableWallpaper(true);
  if (state.auto) state.tod = skyNow();
  tourAt = TOUR_SECS;
  layout();
  city = getCity(state.city);
  setLook(state.tod, state.wx, true);
  world.speed = world.speedTarget = state.speed;
  homeDefault();
  resetCity();
  seedClouds();
  syncSeg(todSeg, state.tod); syncSeg(wxSeg, state.wx);
  todSeg.classList.toggle('is-auto', state.auto); skySwitch.setAttribute('aria-checked', state.auto ? 'true' : 'false');
  syncCityUI(); setSpeed(state.speed);
  hooks.onCity(city);
  setView(state.view, false, true);
  updateDockMetrics();
  homeDefault();
  syncPlash();
  if (!state.seenHint && !wp.on) {
    setTimeout(() => { if (!wp.on) toast('Tap the sky to steer. Tap a duck to say hello.', 4200); }, 900);
    state.seenHint = true; savePrefs();
  }
  document.documentElement.classList.add('is-ready');
  requestAnimationFrame(frame);
}
start();

/* test hook, only present when the page is opened with ?debug */
if (/[?&]debug\b/.test(location.search)) {
  window.__duckair = {
    state, world, plane, view, bounds, trans, cur, DUCKS, wp, skyNow, skyPhase, partsIn, V3, bgClock, setView, clockTz, tourHop,
    duck3(i) { const w = v3headWorld(DUCKS[i], [0, 0, 0]); const p = v3project(w[0], w[1], w[2]); return [p[0], p[1]]; }, get passing() { return passingName; }, get tourAt() { return tourAt; }, get frames() { return frameCount; },
    get city() { return city && city.id; }, seek(r) { world.scroll = r; needsRender = true; }, bake(t) { const t0 = performance.now(); setLook(t, state.wx, true); return performance.now() - t0; }, get route() { return ROUTE; }, get cityDef() { return city; }, get crossfading() { return !!LA; },
    duckScreen(i) { const d = DUCKS[i]; const [x, y] = planeToWorld(d.seat + d.lean, d.hy + d.bob); return [x * view.S / view.dpr, y * view.S / view.dpr]; },
    planeScreen() { return [plane.rx * view.S / view.dpr, plane.ry * view.S / view.dpr]; },
    toScreen(ax, ay) { return [ax * view.S / view.dpr, ay * view.S / view.dpr]; },
  };
}
