"""Upgrade verification: Clock (formats, zones, DST, pause, match sky), Views (side/front/rear/3D),
WebGL fallback, prefs, mobile layout, reduced motion, soak. PASS/FAIL lines, then ALL PASS or FAILURES.
Usage: python3 test/upgrade.py [section ...]   (sections: clock zones pause sky views fallback prefs mobile reduced soak)"""
import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
_os.makedirs(ROOT + '/shots', exist_ok=True)

import sys, json, datetime, io, re, os, traceback, faulthandler
faulthandler.dump_traceback_later(150, repeat=True)
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

APP = f'file://{ROOT}/DuckAir.html?debug'
OUT = f'{ROOT}/shots'
os.makedirs(OUT, exist_ok=True)
D = 'window.__duckair'
KEY = 'duckair.prefs.v1'
fails = []
UTC = datetime.timezone.utc
CITY_TZ = {'philadelphia': 'America/New_York', 'nyc': 'America/New_York', 'paris': 'Europe/Paris', 'tokyo': 'Asia/Tokyo', 'london': 'Europe/London'}


def check(name, cond, info=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' :: ' + str(info)) if info != '' else ''), flush=True)
    if not cond: fails.append(name)


def ev(pg, js):
    return json.loads(pg.evaluate(f'JSON.stringify({js})'))


def mk(b, w=1280, h=800, dpr=1, tz='America/New_York', touch=False, prefs=None, fixed=None, init=(), reduced=False, url=APP):
    kw = dict(viewport={'width': w, 'height': h}, device_scale_factor=dpr, timezone_id=tz, has_touch=touch, is_mobile=touch)
    if reduced: kw['reduced_motion'] = 'reduce'
    ctx = b.new_context(**kw)
    pg = ctx.new_page(); msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    if prefs is not None:
        raw = prefs if isinstance(prefs, str) else json.dumps(prefs)
        # seed once per tab; window.name survives reloads (sessionStorage is not reliably there yet when init scripts run on file:// reloads)
        pg.add_init_script("if (window.name !== 'seeded') { window.name = 'seeded'; localStorage.setItem(%s, %s); }" % (json.dumps(KEY), json.dumps(raw)))
    for js in init: pg.add_init_script(js)
    if fixed: pg.clock.set_fixed_time(fixed)
    pg.goto(url)
    pg.wait_for_function(f'window.__duckair && {D}.frames > 5', timeout=15000)
    pg.wait_for_timeout(500)
    return ctx, pg, msgs


def at(*a): return datetime.datetime(*a, tzinfo=UTC)


def setfix(pg, dt, wait=1300):
    pg.clock.set_fixed_time(dt); pg.wait_for_timeout(wait)


def exp_time(dt, tz, h12, secs=False):
    z = dt.astimezone(ZoneInfo(tz))
    h = str(z.hour % 12 or 12) if h12 else f'{z.hour:02d}'
    return f'{h}:{z.minute:02d}' + (f':{z.second:02d}' if secs else ''), ('AM' if z.hour < 12 else 'PM') if h12 else ''


CORNER = """(() => { const g = id => document.getElementById(id), c = g('clock');
  return JSON.stringify({ hidden: c.hidden, vis: getComputedStyle(c).visibility, label: c.getAttribute('aria-label') || '', rects: c.querySelectorAll('svg rect').length,
  ampm: g('clockAmpm').hidden ? '' : g('clockAmpm').textContent, date: g('clockDate').hidden ? null : g('clockDate').textContent, zone: g('clockZone').hidden ? null : g('clockZone').textContent,
  other: g('clockCity').textContent, rect: c.getBoundingClientRect().toJSON(), mode: window.__duckair.state.clockMode }); })()"""


def corner(pg):
    c = json.loads(pg.evaluate(CORNER))
    m = re.search(r'(\d{1,2}:\d{2}(?::\d{2})?)(?: (?:AM|PM))?\. ', c['label'])
    c['shown'] = m.group(1) if m else None
    return c


def bg(pg):
    return ev(pg, f'{{on: {D}.bgClock.on, w: {D}.bgClock.w, h: {D}.bgClock.h, alpha: {D}.bgClock.alpha, ver: {D}.bgClock.ver, key: {D}.bgClock.key, txt: {D}.bgClock.txt}}')


def bgtime(pg):
    """what the Background clock painted: time text and am/pm"""
    t = bg(pg)['txt'].split('|')[0]
    m = re.match(r'(\d{1,2}:\d{2}(?::\d{2})?)(?: (AM|PM))?$', t)
    return (m.group(1), m.group(2) or '') if m else (t, '?')


def open_panel(pg, which):
    sel = {'clock': '#clockBtn', 'view': '#viewBtn'}[which]
    if pg.evaluate(f'{D}.state.panel') != which: pg.click(sel)
    pg.wait_for_timeout(150)


def close_panel(pg):
    if pg.evaluate(f'{D}.state.panel'): pg.keyboard.press('Escape')
    pg.wait_for_timeout(100)
    pg.evaluate('document.activeElement && document.activeElement.blur()')


def set_mode(pg, mode):
    open_panel(pg, 'clock'); pg.click(f'#clockModeSeg [data-v="{mode}"]'); pg.wait_for_timeout(250)


def set_src(pg, src):
    open_panel(pg, 'clock'); pg.click(f'#clockSrcSeg [data-v="{src}"]'); pg.wait_for_timeout(250)


def noerr(name, msgs):
    check(name + ' no console or page errors', not msgs, msgs[:4])


def distinct(png, clip=None):
    im = Image.open(io.BytesIO(png)).convert('RGB')
    if clip: im = im.crop(clip)
    a = np.asarray(im).reshape(-1, 3)
    return len(np.unique(a[:, 0].astype(np.int32) * 65536 + a[:, 1].astype(np.int32) * 256 + a[:, 2])), float(a.std())


def shot_diff(p1, p2, clip=None):
    a = Image.open(io.BytesIO(p1)).convert('RGB'); b2 = Image.open(io.BytesIO(p2)).convert('RGB')
    if clip: a = a.crop(clip); b2 = b2.crop(clip)
    return int((np.abs(np.asarray(a).astype(int) - np.asarray(b2).astype(int)).sum(axis=2) > 24).sum())


SECTIONS = {}
def section(f):
    SECTIONS[f.__name__] = f
    return f


# ---------------------------------------------------------------- 1. clock formats
@section
def clock(b):
    T = at(2026, 10, 22, 18, 5, 9)  # 14:05:09 in New York (EDT)
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'tod': 'day'}, fixed=T)
    pg.wait_for_timeout(1200)
    s = ev(pg, f'{D}.state')
    check('clock: default is off, corner card hidden, no background clock', s['clockMode'] == 'off' and corner(pg)['hidden'] and not bg(pg)['on'], s['clockMode'])
    # modes through the panel
    pg.click('#clockBtn'); pg.wait_for_timeout(250)
    check('clock: panel opens', pg.evaluate(f'{D}.state.panel') == 'clock' and pg.is_visible('#clockPanel'))
    check('clock: Show seg has Off / Corner / Background', pg.evaluate("[...document.querySelectorAll('#clockModeSeg button')].map(b => b.textContent).join('|')") == 'Off|Corner|Background')
    for mode in ('corner', 'bg', 'off', 'bg', 'corner'):
        pg.click(f'#clockModeSeg [data-v="{mode}"]'); pg.wait_for_timeout(300)
        c = corner(pg); g = bg(pg); st = ev(pg, f'{D}.state')
        ok = st['clockMode'] == mode and (not c['hidden']) == (mode == 'corner') and g['on'] == (mode == 'bg') and pg.get_attribute(f'#clockModeSeg [data-v="{mode}"]', 'aria-checked') == 'true'
        check(f'clock: panel Show={mode}', ok, (st['clockMode'], c['hidden'], g['on']))
    check('clock: dock button lit when on', 'is-lit' in pg.get_attribute('#clockBtn', 'class'))
    close_panel(pg)
    seq = []
    for _ in range(4):
        pg.keyboard.press('c'); pg.wait_for_timeout(250); seq.append(ev(pg, f'{D}.state.clockMode'))
    check('clock: C cycles corner -> bg -> off -> corner -> bg', seq == ['bg', 'off', 'corner', 'bg'], seq)
    pg.keyboard.press('c'); pg.wait_for_timeout(250)  # off
    pg.keyboard.press('c'); pg.wait_for_timeout(250)  # corner
    check('clock: C reaches corner again', ev(pg, f'{D}.state.clockMode') == 'corner')
    # 12h / 24h in the corner
    open_panel(pg, 'clock')
    pg.click('#clockFmtSeg [data-v="12"]'); pg.wait_for_timeout(300)
    c = corner(pg); t, ap = exp_time(T, 'America/New_York', True)
    check('clock: corner 12-hour shows 2:05 PM', c['shown'] == t and c['ampm'] == ap and c['rects'] > 10, (c['shown'], c['ampm'], c['rects']))
    pg.click('#clockFmtSeg [data-v="24"]'); pg.wait_for_timeout(300)
    c = corner(pg)
    check('clock: corner 24-hour shows 14:05, no AM/PM', c['shown'] == '14:05' and c['ampm'] == '', (c['shown'], c['ampm']))
    # seconds
    pg.click('#chipSecs'); pg.wait_for_timeout(300)
    c = corner(pg)
    check('clock: seconds on shows 14:05:09', c['shown'] == '14:05:09' and pg.get_attribute('#chipSecs', 'aria-pressed') == 'true', c['shown'])
    pg.click('#chipSecs'); pg.wait_for_timeout(300)
    check('clock: seconds off again', corner(pg)['shown'] == '14:05')
    # date
    c = corner(pg)
    check('clock: date shown by default (Thu, Oct 22)', c['date'] is not None and 'Oct 22' in c['date'] and c['date'].startswith('Thu'), c['date'])
    pg.click('#chipDate'); pg.wait_for_timeout(300)
    check('clock: date off hides the date', corner(pg)['date'] is None)
    pg.click('#chipDate'); pg.wait_for_timeout(300)
    check('clock: date on again', corner(pg)['date'] is not None)
    # zone label
    check('clock: zone label hidden by default', corner(pg)['zone'] is None)
    pg.click('#chipZone'); pg.wait_for_timeout(300)
    c = corner(pg)
    check('clock: zone label on shows My time and EDT', c['zone'] and 'My time' in c['zone'] and 'EDT' in c['zone'], c['zone'])
    pg.click('#chipZone'); pg.wait_for_timeout(300)
    check('clock: zone label off', corner(pg)['zone'] is None)
    # sliders: disabled unless Background
    for mode in ('off', 'corner', 'bg'):
        pg.click(f'#clockModeSeg [data-v="{mode}"]'); pg.wait_for_timeout(250)
        dis = pg.evaluate("[document.getElementById('clockSize').disabled, document.getElementById('clockOpacity').disabled]")
        check(f'clock: sliders disabled={mode != "bg"} in {mode}', dis == [mode != 'bg'] * 2, dis)
    # background: strings and sliders
    pg.click('#clockModeSeg [data-v=bg]'); pg.wait_for_timeout(300)
    g = bg(pg)
    check('clock: background painted 2:05 PM with the date', g['on'] and g['w'] > 20 and g['txt'].startswith('14:05|THU, OCT 22'), g['txt'])
    pg.click('#clockFmtSeg [data-v="12"]'); pg.wait_for_timeout(300)
    check('clock: background 12-hour text', bg(pg)['txt'].split('|')[0] == '2:05 PM', bg(pg)['txt'])
    pg.click('#clockFmtSeg [data-v="24"]'); pg.wait_for_timeout(300)
    check('clock: background 24-hour text', bg(pg)['txt'].split('|')[0] == '14:05', bg(pg)['txt'])
    pg.click('#chipSecs'); pg.wait_for_timeout(300)
    check('clock: background seconds', bg(pg)['txt'].split('|')[0] == '14:05:09', bg(pg)['txt'])
    pg.click('#chipSecs'); pg.wait_for_timeout(300)
    parts = bg(pg)['txt'].split('|')
    check('clock: background date text', parts[1] == 'THU, OCT 22', parts)
    pg.click('#chipDate'); pg.wait_for_timeout(300)
    check('clock: background date off', bg(pg)['txt'].split('|')[1] == '')
    pg.click('#chipDate'); pg.wait_for_timeout(300)
    pg.click('#chipZone'); pg.wait_for_timeout(300)
    check('clock: background zone label', 'MY TIME' in bg(pg)['txt'].split('|')[2] and 'EDT' in bg(pg)['txt'].split('|')[2], bg(pg)['txt'])
    pg.click('#chipZone'); pg.wait_for_timeout(300)
    ws = {}
    for sz in ('0.5', '1', '2'):
        pg.locator('#clockSize').fill(sz); pg.wait_for_timeout(300); ws[sz] = bg(pg)['w']
    check('clock: size slider changes bgClock.w (0.5 < 1 < 2)', ws['0.5'] < ws['1'] < ws['2'], ws)
    pg.locator('#clockOpacity').fill('0.4'); pg.wait_for_timeout(200)
    a1 = bg(pg)['alpha']
    pg.locator('#clockOpacity').fill('1'); pg.wait_for_timeout(200)
    a2 = bg(pg)['alpha']
    check('clock: opacity slider changes bgClock.alpha', abs(a1 - 0.4) < 0.01 and abs(a2 - 1) < 0.01, (a1, a2))
    pg.locator('#clockSize').fill('1'); pg.locator('#clockOpacity').fill('0.7')
    # the clock is actually drawn: pause, diff the sky area with and without it
    close_panel(pg)
    pg.keyboard.press('p'); pg.wait_for_timeout(400)
    g = bg(pg)
    S = ev(pg, f'{D}.view.S / {D}.view.dpr')
    clip = {'x': max(0, g['w'] and (ev(pg, f'{D}.bgClock.x') * S)), 'y': ev(pg, f'{D}.bgClock.y') * S, 'width': g['w'] * S, 'height': g['h'] * S}
    on_png = pg.screenshot(clip=clip)
    set_mode(pg, 'off'); close_panel(pg); pg.wait_for_timeout(300)
    off_png = pg.screenshot(clip=clip)
    n = shot_diff(on_png, off_png)
    check('clock: background clock visible in the side view (pixels differ from clock off)', n > 150, n)
    pg.screenshot(path=f'{OUT}/up_bg_side.png')
    # corner clock readable: card has opaque-ish panel and is on screen
    set_mode(pg, 'corner'); close_panel(pg)
    c = corner(pg)
    check('clock: corner card inside the viewport', c['rect']['x'] >= 0 and c['rect']['y'] >= 0 and c['rect']['x'] + c['rect']['width'] <= 1280, c['rect'])
    noerr('clock', msgs)
    ctx.close()


# ---------------------------------------------------------------- 2. time zones
@section
def zones(b):
    T = at(2026, 10, 22, 18, 5, 9)
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'clockMode': 'corner', 'h12': False, 'secs': True, 'tod': 'day'}, fixed=T)
    pg.wait_for_timeout(1300)
    t, _ = exp_time(T, 'America/New_York', False, True)
    check('zones: device zone (America/New_York) corner time', corner(pg)['shown'] == t, (corner(pg)['shown'], t))
    set_mode(pg, 'bg')
    check('zones: device zone background time', bgtime(pg)[0] == t, (bgtime(pg), t))
    set_mode(pg, 'corner')
    # destination follows the city
    set_src(pg, 'dest'); close_panel(pg)
    for key, cid in (('1', 'philadelphia'), ('4', 'tokyo'), ('3', 'paris'), ('5', 'london')):
        pg.keyboard.press(key)
        pg.wait_for_function(f'{D}.city === "{cid}" && !{D}.trans.on', timeout=15000); pg.wait_for_timeout(1400)
        t, _ = exp_time(T, CITY_TZ[cid], False, True)
        c = corner(pg)
        check(f'zones: destination {cid} corner time = {CITY_TZ[cid]}', c['shown'] == t, (c['shown'], t))
    set_mode(pg, 'bg'); close_panel(pg); pg.wait_for_timeout(1300)
    t, _ = exp_time(T, 'Europe/London', False, True)
    check('zones: destination background time (London)', bgtime(pg)[0] == t, (bgtime(pg), t))
    pg.keyboard.press('2'); pg.wait_for_function(f'{D}.city === "nyc" && !{D}.trans.on', timeout=15000); pg.wait_for_timeout(1400)
    t, _ = exp_time(T, 'America/New_York', False, True)
    check('zones: destination background follows city change (NYC)', bgtime(pg)[0] == t, (bgtime(pg), t))
    set_mode(pg, 'corner')
    # manual zones
    set_src(pg, 'zone')
    opts = pg.evaluate("[...document.querySelectorAll('#zoneSel option')].map(o => o.value)")
    check('zones: zone list is populated and grouped', len(opts) > 100 and pg.evaluate("document.querySelectorAll('#zoneSel optgroup').length") >= 5, len(opts))
    check('zones: list uses current names (Kolkata, not Calcutta; Kyiv, not Kiev)', 'Asia/Kolkata' in opts and 'Asia/Calcutta' not in opts and 'Europe/Kyiv' in opts and 'Europe/Kiev' not in opts, [o for o in opts if re.search('Calcutta|Kolkata|Kiev|Kyiv', o)])
    check('zones: no duplicate zones in the list', len(opts) == len(set(opts)))
    for tz in ('Asia/Kolkata', 'Europe/London', 'Pacific/Auckland', 'America/Los_Angeles'):
        want = tz
        if want not in opts: check(f'zones: {tz} selectable', False, 'missing from list'); continue
        pg.select_option('#zoneSel', want); pg.wait_for_timeout(1400)
        t, _ = exp_time(T, tz, False, True)
        c = corner(pg)
        check(f'zones: manual {tz} corner time', c['shown'] == t and ev(pg, f'{D}.state.clockZone') == want, (c['shown'], t, want))
    pg.select_option('#zoneSel', 'Asia/Kolkata'); pg.wait_for_timeout(300)
    set_mode(pg, 'bg'); pg.wait_for_timeout(1300)
    t, _ = exp_time(T, 'Asia/Kolkata', False, True)
    check('zones: manual Asia/Kolkata background time', bgtime(pg)[0] == t, (bgtime(pg), t))
    # Kolkata is +5:30; a half-hour zone also needs the right minutes in 12h
    pg.click('#clockFmtSeg [data-v="12"]'); pg.wait_for_timeout(300)
    t12, ap = exp_time(T, 'Asia/Kolkata', True, True)
    check('zones: half-hour zone 12-hour background', bg(pg)['txt'].split('|')[0] == f'{t12} {ap}', bg(pg)['txt'])
    pg.click('#clockFmtSeg [data-v="24"]')
    # zone label names the zone
    pg.click('#chipZone'); set_mode(pg, 'corner'); pg.wait_for_timeout(300)
    c = corner(pg)
    check('zones: zone name label shows Kolkata', c['zone'] and c['zone'].startswith('Kolkata'), c['zone'])
    close_panel(pg)
    noerr('zones', msgs)
    ctx.close()
    # old IANA aliases: a device or a saved pref using Asia/Calcutta still shows Kolkata in the picker
    T = at(2026, 10, 22, 18, 5, 9)
    ctx, pg, msgs = mk(b, tz='Asia/Calcutta', prefs={'seenHint': True, 'clockMode': 'corner', 'h12': False, 'secs': True}, fixed=T)
    set_src(pg, 'zone'); pg.wait_for_timeout(1300)
    check('zones: device Asia/Calcutta -> Other starts on Kolkata in the picker', pg.input_value('#zoneSel') == 'Asia/Kolkata' and corner(pg)['shown'] == exp_time(T, 'Asia/Kolkata', False, True)[0], (pg.input_value('#zoneSel'), corner(pg)['shown']))
    ctx.close()
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'clockMode': 'corner', 'clockSrc': 'zone', 'clockZone': 'Asia/Calcutta', 'h12': False, 'secs': True, 'showZone': True}, fixed=T)
    pg.wait_for_timeout(1300); open_panel(pg, 'clock')
    check('zones: saved Asia/Calcutta is shown as Kolkata and keeps the right time', pg.input_value('#zoneSel') == 'Asia/Kolkata' and corner(pg)['shown'] == '23:35:09' and corner(pg)['zone'].startswith('Kolkata'), (pg.input_value('#zoneSel'), corner(pg)))
    ctx.close()
    # DST, with a UTC device so only the zone choice can produce the right hour
    ctx, pg, msgs = mk(b, tz='UTC', prefs={'seenHint': True, 'clockMode': 'corner', 'clockSrc': 'zone', 'clockZone': 'America/New_York', 'h12': False, 'secs': True, 'tod': 'day'}, fixed=at(2026, 3, 8, 6, 59, 30))
    cases = [('America/New_York', at(2026, 3, 8, 6, 59, 30)), ('America/New_York', at(2026, 3, 8, 7, 0, 30)), ('America/New_York', at(2026, 11, 1, 5, 59, 30)), ('America/New_York', at(2026, 11, 1, 6, 0, 30)),
             ('Europe/London', at(2026, 3, 29, 0, 59, 30)), ('Europe/London', at(2026, 3, 29, 1, 0, 30)), ('Europe/London', at(2026, 10, 25, 0, 59, 30)), ('Europe/London', at(2026, 10, 25, 1, 0, 30)),
             ('America/New_York', at(2026, 7, 4, 16, 0, 0)), ('America/New_York', at(2026, 1, 4, 16, 0, 0))]
    cur = 'America/New_York'
    for tz, T in cases:
        if tz != cur:
            ev(pg, f'(() => {{ {D}.state.clockZone = "{tz}"; return 1; }})()'); open_panel(pg, 'clock'); pg.select_option('#zoneSel', tz); close_panel(pg); cur = tz
        setfix(pg, T)
        t, _ = exp_time(T, tz, False, True)
        c = corner(pg)
        check(f'zones: DST {tz} at {T:%Y-%m-%d %H:%M:%SZ} shows {t[:5]}', c['shown'] == t, (c['shown'], t))
    set_mode(pg, 'bg')
    for tz, T in (('America/New_York', at(2026, 3, 8, 7, 0, 30)), ('America/New_York', at(2026, 3, 8, 6, 59, 30))):
        setfix(pg, T)
        t, _ = exp_time(T, tz, False, True)
        check(f'zones: DST background {T:%H:%M:%S}Z', bgtime(pg)[0] == t, (bgtime(pg), t))
    noerr('zones DST', msgs)
    ctx.close()
    # a device zone with DST: local mode follows the device through the change
    ctx, pg, msgs = mk(b, tz='Europe/London', prefs={'seenHint': True, 'clockMode': 'corner', 'h12': False, 'secs': True}, fixed=at(2026, 10, 25, 0, 59, 30))
    for T in (at(2026, 10, 25, 0, 59, 30), at(2026, 10, 25, 1, 0, 30), at(2026, 3, 29, 1, 0, 30)):
        setfix(pg, T); t, _ = exp_time(T, 'Europe/London', False, True)
        check(f'zones: device Europe/London local mode {T:%m-%d %H:%M}Z', corner(pg)['shown'] == t, (corner(pg)['shown'], t))
    ctx.close()
    # a non-default device zone is detected, without any permission prompt
    T = at(2026, 10, 22, 18, 5, 9)
    geo = "window.__geo = 0; if (navigator.geolocation) { for (const k of ['getCurrentPosition', 'watchPosition']) { const o = navigator.geolocation[k].bind(navigator.geolocation); navigator.geolocation[k] = (...a) => { window.__geo++; return o(...a); }; } }"
    ctx, pg, msgs = mk(b, tz='Pacific/Auckland', prefs={'seenHint': True, 'clockMode': 'corner', 'h12': False, 'secs': True}, fixed=T, init=[geo])
    dialogs = []
    pg.on('dialog', lambda d: (dialogs.append(d.message), d.dismiss()))
    pg.wait_for_timeout(1300)
    t, _ = exp_time(T, 'Pacific/Auckland', False, True)
    check('zones: device Pacific/Auckland detected as My time zone', corner(pg)['shown'] == t, (corner(pg)['shown'], t))
    open_panel(pg, 'clock')
    note = pg.text_content('#zoneNote')
    check('zones: note names the detected zone and says no permission', 'Auckland' in note and 'No location permission' in note, note)
    check('zones: My time zone is the selected source', pg.get_attribute('#clockSrcSeg [data-v=local]', 'aria-checked') == 'true')
    check('zones: no geolocation call and no dialog', pg.evaluate('window.__geo') == 0 and not dialogs, (pg.evaluate('window.__geo'), dialogs))
    noerr('zones auto-detect', msgs)
    ctx.close()


# ---------------------------------------------------------------- 3. pause / refresh / hide
@section
def pause(b):
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'clockMode': 'corner', 'secs': True, 'tod': 'day'})
    a = corner(pg)['shown']
    pg.keyboard.press('p'); pg.wait_for_timeout(300)
    check('pause: flight paused', ev(pg, f'{D}.state.paused'))
    t0 = ev(pg, f'{D}.world.t')
    pg.wait_for_timeout(2500)
    b2 = corner(pg)['shown']
    check('pause: corner time still advances while paused', a != b2 and ev(pg, f'{D}.world.t') == t0, (a, b2))
    set_mode(pg, 'bg'); close_panel(pg)
    v0 = bg(pg); pg.wait_for_timeout(2500); v1 = bg(pg)
    check('pause: bgClock.ver and text advance while paused', v1['ver'] >= v0['ver'] + 2 and v1['txt'] != v0['txt'], (v0['ver'], v1['ver'], v0['txt'], v1['txt']))
    # visibilitychange and focus refresh at once (Date patched inside one synchronous evaluate so no frame can intervene)
    T1 = datetime.datetime(2026, 10, 22, 18, 5, 9, tzinfo=UTC)
    T2 = datetime.datetime(2026, 10, 22, 21, 47, 33, tzinfo=UTC)
    set_mode(pg, 'corner'); close_panel(pg)
    pg.clock.set_fixed_time(T1); pg.wait_for_timeout(1300)
    exp1, _ = exp_time(T1, 'America/New_York', True, True)
    c = corner(pg)
    check('pause: fixed time shown (7 hours of device zone)', c['shown'] == exp1 and c['ampm'] == 'PM', (c['shown'], exp1))
    for evname, tgt in (('visibilitychange', 'document'), ('focus', 'window')):
        pg.clock.set_fixed_time(T1); pg.wait_for_timeout(1300)
        ms = int(T2.timestamp() * 1000)
        r = pg.evaluate("""([ms, evname, tgt]) => { const RD = Date; class FD extends RD { constructor(...a) { if (a.length === 0) super(ms); else super(...a); } static now() { return ms; } }
          window.Date = FD; const before = document.getElementById('clock').getAttribute('aria-label');
          (tgt === 'document' ? document : window).dispatchEvent(new Event(evname));
          const after = document.getElementById('clock').getAttribute('aria-label'); window.Date = RD; return [before, after]; }""", [ms, evname, tgt])
        m = re.search(r'(\d{1,2}:\d{2}:\d{2}) (AM|PM)\. ', r[1] or '')
        t, ap = exp_time(T2, 'America/New_York', True, True)
        check(f'pause: {evname} refreshes the clock immediately', bool(m) and m.group(1) == t and m.group(2) == ap and r[0] != r[1], (r, t))
    # clock stays visible with the controls hidden
    pg.clock.set_fixed_time(T1); pg.wait_for_timeout(1200)
    pg.keyboard.press('h'); pg.wait_for_timeout(900)
    c = corner(pg)
    check('pause: corner clock visible with controls hidden (H)', ev(pg, f'{D}.state.hidden') and not c['hidden'] and c['vis'] == 'visible' and c['rect']['y'] >= 0 and c['rect']['width'] > 40, c['rect'])
    pg.screenshot(path=f'{OUT}/up_hidden_corner.png')
    pg.keyboard.press('c'); pg.wait_for_timeout(500)
    g = bg(pg)
    check('pause: background clock shows with controls hidden', ev(pg, f'{D}.state.clockMode') == 'bg' and g['on'] and g['w'] > 20 and corner(pg)['hidden'], g)
    pg.keyboard.press('h'); pg.wait_for_timeout(400)
    noerr('pause', msgs)
    ctx.close()


# ---------------------------------------------------------------- 4. match sky
@section
def sky(b):
    T = at(2026, 10, 22, 12, 0, 0)  # 08:00 New York, 21:00 Tokyo
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'clockMode': 'corner', 'tod': 'day'}, fixed=T)
    set_src(pg, 'zone')
    pg.select_option('#zoneSel', 'Asia/Tokyo'); pg.wait_for_timeout(300)
    pg.click('#skySwitch'); pg.wait_for_timeout(400)
    st = ev(pg, f'{{auto: {D}.state.auto, tod: {D}.state.tod, now: {D}.skyNow(), sw: document.getElementById("skySwitch").getAttribute("aria-checked"), cls: document.getElementById("todSeg").classList.contains("is-auto")}}')
    check('sky: switch on -> state.tod === skyNow() (Tokyo, 21:00 = night)', st['auto'] and st['sw'] == 'true' and st['tod'] == st['now'] == 'night' and st['cls'], st)
    ph = {}
    for tz in ('Asia/Tokyo', 'America/New_York', 'Europe/London', 'Pacific/Honolulu'):
        pg.select_option('#zoneSel', tz); pg.wait_for_timeout(400)
        ph[tz] = ev(pg, f'[{D}.skyNow(), {D}.state.tod]')
    check('sky: Tokyo vs New York give different phases at one instant', ph['Asia/Tokyo'][0] != ph['America/New_York'][0], ph)
    check('sky: state.tod follows each zone change while on', all(v[0] == v[1] for v in ph.values()), ph)
    check('sky: expected phases (Tokyo night, NY morning)', ph['Asia/Tokyo'][0] == 'night' and ph['America/New_York'][0] == 'morning', ph)
    # sanity of phases around the day in New York (device zone, local source)
    set_src(pg, 'local')
    seen = []
    for h in (3, 7, 12, 18, 23):
        T2 = at(2026, 6, 21, 0, 0, 0) + datetime.timedelta(hours=h + 4)  # EDT
        setfix(pg, T2, 600); seen.append((h, pg.evaluate(f'{D}.skyNow()')))
    check('sky: New York June 3/7/12/18/23h -> night/morning/day/day/night', [s for _, s in seen] == ['night', 'morning', 'day', 'day', 'night'], seen)
    seen = []
    for h in (4, 8, 12, 17, 18, 22):
        T2 = at(2026, 12, 21, 0, 0, 0) + datetime.timedelta(hours=h + 5)  # EST
        setfix(pg, T2, 600); seen.append((h, pg.evaluate(f'{D}.skyNow()')))
    check('sky: New York December 4/8/12/17/18/22h -> night/morning/day/sunset/night/night', [s for _, s in seen] == ['night', 'morning', 'day', 'sunset', 'night', 'night'], seen)
    setfix(pg, T, 600)
    # destination source: the sky follows the destination clock
    set_src(pg, 'dest'); close_panel(pg)
    pg.keyboard.press('4'); pg.wait_for_function(f'{D}.city === "tokyo" && !{D}.trans.on', timeout=15000); pg.wait_for_timeout(600)
    r1 = ev(pg, f'[{D}.state.tod, {D}.skyNow()]')
    pg.keyboard.press('1'); pg.wait_for_function(f'{D}.city === "philadelphia" && !{D}.trans.on', timeout=15000); pg.wait_for_timeout(600)
    r2 = ev(pg, f'[{D}.state.tod, {D}.skyNow()]')
    check('sky: destination clock - Tokyo night, then Philadelphia morning', r1 == ['night', 'night'] and r2 == ['morning', 'morning'], (r1, r2))
    # manual choice turns it off
    pg.click('#todSeg [data-v=sunset]'); pg.wait_for_timeout(300)
    st = ev(pg, f'{{auto: {D}.state.auto, tod: {D}.state.tod, sw: document.getElementById("skySwitch").getAttribute("aria-checked"), cls: document.getElementById("todSeg").classList.contains("is-auto")}}')
    check('sky: choosing a time of day turns the switch off', not st['auto'] and st['sw'] == 'false' and st['tod'] == 'sunset' and not st['cls'], st)
    setfix(pg, at(2026, 10, 22, 13, 0, 0), 600)
    pg.wait_for_timeout(16000)
    check('sky: stays manual (no snap back after 15 s)', ev(pg, f'{D}.state.tod') == 'sunset')
    # four manual options in the dock, no Auto button
    n = pg.evaluate("[...document.querySelectorAll('#todSeg button')].map(b => b.dataset.v)")
    check('sky: dock has exactly morning/day/sunset/night', n == ['morning', 'day', 'sunset', 'night'], n)
    # T cycles
    pg.evaluate('document.activeElement && document.activeElement.blur()')
    seq = []
    for _ in range(5):
        pg.keyboard.press('t'); pg.wait_for_timeout(120); seq.append(ev(pg, f'{D}.state.tod'))
    check('sky: T cycles the four manual options and wraps', seq == ['night', 'morning', 'day', 'sunset', 'night'], seq)
    # switching on again from the panel, then T while on turns it off
    open_panel(pg, 'clock'); pg.click('#skySwitch'); pg.wait_for_timeout(300)
    check('sky: switch back on', ev(pg, f'{D}.state.auto'))
    close_panel(pg); pg.keyboard.press('t'); pg.wait_for_timeout(200)
    check('sky: T turns match off', not ev(pg, f'{D}.state.auto'))
    # off clock mode + match: sky still follows the zone (switch is independent of the clock being visible)
    set_mode(pg, 'off'); pg.click('#skySwitch'); pg.wait_for_timeout(300)
    check('sky: match works with the clock off', ev(pg, f'{D}.state.auto && {D}.state.tod === {D}.skyNow()'))
    noerr('sky', msgs)
    ctx.close()


# ---------------------------------------------------------------- 5. views
def view_panel_set(pg, v):
    open_panel(pg, 'view'); pg.click(f'#viewSeg [data-v="{v}"]'); pg.wait_for_timeout(250)


def v3(pg):
    return ev(pg, f'{{yaw: {D}.V3.orbit.yaw, pitch: {D}.V3.orbit.pitch, dist: {D}.V3.orbit.dist, homeLat: {D}.V3.homeLat, homeX: {D}.plane.homeX, homeY: {D}.plane.homeY, view: {D}.state.view, cam: [{D}.V3.cam.yaw, {D}.V3.cam.pitch, {D}.V3.cam.dist]}}')


def scene_blank(pg, name):
    png = pg.screenshot(clip={'x': 0, 'y': 0, 'width': 1280, 'height': 640})
    n, sd = distinct(png)
    return n, sd, png


@section
def views(b):
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'city': 'philadelphia', 'tod': 'day', 'wx': 'clear', 'speed': 1.25, 'clockMode': 'bg', 'h12': False})
    pg.wait_for_function(f'{D}.V3.tried || true')
    base = ev(pg, f'{{city: {D}.state.city, wx: {D}.state.wx, tod: {D}.state.tod, speed: {D}.state.speed, clockMode: {D}.state.clockMode, h12: {D}.state.h12, auto: {D}.state.auto, secs: {D}.state.secs}}')
    # through the panel
    for v in ('front', 'rear', '3d', 'side', '3d', 'front', 'side'):
        view_panel_set(pg, v); pg.wait_for_timeout(1800)
        st = ev(pg, f'{{view: {D}.state.view, ok: {D}.V3.ok, cls: document.documentElement.className, op: getComputedStyle(document.getElementById("scene3d")).opacity, vis: getComputedStyle(document.getElementById("scene3d")).visibility, btn: document.getElementById("viewBtnLabel").textContent, checked: document.querySelector("#viewSeg [aria-checked=true]").dataset.v}}')
        is3 = v != 'side'
        check(f'views: panel -> {v}: state, classes and #scene3d visibility', st['view'] == v and st['checked'] == v and ('v3d' in st['cls'].split()) == is3 and ('v3d-orbit' in st['cls'].split()) == (v == '3d') and (st['op'] == '1' and st['vis'] == 'visible') == is3 and st['ok'], st)
        if is3:
            n, sd, png = scene_blank(pg, v)
            check(f'views: {v} renders a real scene ({n} distinct colours)', n > 300 and sd > 20, (n, round(sd, 1)))
            if v in ('front', '3d'): open('%s/up_view_%s.png' % (OUT, v), 'wb').write(png)
    check('views: panel switches keep city, weather, tod, speed, clock settings', ev(pg, f'{{city: {D}.state.city, wx: {D}.state.wx, tod: {D}.state.tod, speed: {D}.state.speed, clockMode: {D}.state.clockMode, h12: {D}.state.h12, auto: {D}.state.auto, secs: {D}.state.secs}}') == base, base)
    check('views: city unchanged in the world too', ev(pg, f'[{D}.city, {D}.world.speedTarget]') == ['philadelphia', 1.25])
    # V key cycles
    close_panel(pg)
    seq = []
    for _ in range(5):
        pg.keyboard.press('v'); pg.wait_for_timeout(300); seq.append(ev(pg, f'{D}.state.view'))
    check('views: V cycles side -> front -> rear -> 3d -> side -> front', seq == ['front', 'rear', '3d', 'side', 'front'], seq)
    pg.keyboard.press('v'); pg.keyboard.press('v'); pg.keyboard.press('v'); pg.wait_for_timeout(1500)  # -> rear, 3d, side
    check('views: back to side after cycling', ev(pg, f'{D}.state.view') == 'side' and 'v3d' not in pg.evaluate('document.documentElement.className'))
    # side view still steers by click
    px, py = ev(pg, f'{D}.planeScreen()')
    h0 = v3(pg); pg.mouse.click(px + 380 if px < 700 else px - 380, 260); pg.wait_for_timeout(400); h1 = v3(pg)
    check('views: side view click steers (homeX/homeY change)', (h0['homeX'], h0['homeY']) != (h1['homeX'], h1['homeY']), (h0, h1))

    # ---- 3D camera
    view_panel_set(pg, '3d'); close_panel(pg); pg.wait_for_timeout(2200)
    o0 = v3(pg)
    pg.mouse.move(300, 250); pg.mouse.down(); pg.mouse.move(380, 280, steps=4); pg.mouse.move(450, 300, steps=4); pg.mouse.up(); pg.wait_for_timeout(300)
    o1 = v3(pg)
    check('3d: drag changes orbit yaw and pitch', abs(o1['yaw'] - o0['yaw']) > 0.5 and abs(o1['pitch'] - o0['pitch']) > 0.1, (o0['yaw'], o1['yaw'], o0['pitch'], o1['pitch']))
    check('3d: drag does not steer the plane (homeX, homeY, homeLat unchanged)', (o1['homeX'], o1['homeY'], o1['homeLat']) == (o0['homeX'], o0['homeY'], o0['homeLat']), (o0, o1))
    pg.mouse.move(640, 350); d0 = v3(pg)['dist']; pg.mouse.wheel(0, 300); pg.wait_for_timeout(300); d1 = v3(pg)['dist']
    pg.mouse.wheel(0, -500); pg.wait_for_timeout(300); d2 = v3(pg)['dist']
    check('3d: wheel zooms (down = out, up = in)', d1 > d0 and d2 < d1, (d0, d1, d2))
    for _ in range(12): pg.mouse.wheel(0, 240)
    pg.wait_for_timeout(300)
    check('3d: zoom clamped to 60..300', 60 <= v3(pg)['dist'] <= 300, v3(pg)['dist'])
    # pinch, with real touch events through CDP
    cdp = ctx.new_cdp_session(pg)
    base_d = v3(pg)['dist']
    def touch(kind, pts):
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
    touch('touchStart', [(560, 300), (720, 300)]); pg.wait_for_timeout(60)
    for k in range(1, 7): touch('touchMove', [(560 - k * 25, 300), (720 + k * 25, 300)]); pg.wait_for_timeout(30)
    touch('touchEnd', []); pg.wait_for_timeout(300)
    pin_out = v3(pg)['dist']
    touch('touchStart', [(400, 300), (880, 300)]); pg.wait_for_timeout(60)
    for k in range(1, 7): touch('touchMove', [(400 + k * 40, 300), (880 - k * 40, 300)]); pg.wait_for_timeout(30)
    touch('touchEnd', []); pg.wait_for_timeout(300)
    pin_in = v3(pg)['dist']
    check('3d: two-finger pinch changes the distance (spread = closer, pinch = farther)', pin_out < base_d - 5 and pin_in > pin_out + 5, (base_d, pin_out, pin_in))
    # presets and Reset
    open_panel(pg, 'view')
    check('3d: camera buttons shown in 3D', pg.is_visible('#camBox'))
    exp = {'camFront': (np.pi / 2, 0.12, 132), 'camSide': (0, 0.05, 172), 'camRear': (-np.pi / 2, 0.24, 142), 'camReset': (0.72, 0.2, 150)}
    for bid, (yy, pp, dd) in exp.items():
        pg.click('#' + bid); pg.wait_for_timeout(250); o = v3(pg)
        check(f'3d: #{bid} sets orbit', abs(o['yaw'] - yy) < 1e-6 and abs(o['pitch'] - pp) < 1e-6 and abs(o['dist'] - dd) < 1e-6, (o['yaw'], o['pitch'], o['dist']))
    pg.wait_for_timeout(1800)
    o = v3(pg)
    check('3d: camera eases to the preset', abs(o['cam'][2] - 150) < 3, o['cam'])
    pg.click('#camIn'); pg.wait_for_timeout(150); a = v3(pg)['dist']; pg.click('#camOut'); pg.click('#camOut'); pg.wait_for_timeout(150); c2 = v3(pg)['dist']
    check('3d: + / - zoom buttons', abs(a - 120) < 1e-6 and abs(c2 - 187.5) < 1e-6, (a, c2))
    pg.click('#camFront'); pg.click('#camReset'); close_panel(pg)
    pg.mouse.move(300, 250); pg.mouse.down(); pg.mouse.move(500, 330, steps=6); pg.mouse.up(); pg.wait_for_timeout(200)
    pg.keyboard.press('r'); pg.wait_for_timeout(200); o = v3(pg)
    check('3d: R resets the camera', abs(o['yaw'] - 0.72) < 1e-6 and abs(o['pitch'] - 0.2) < 1e-6 and abs(o['dist'] - 150) < 1e-6, o)
    pg.wait_for_timeout(1500)
    # arrow keys and Shift+arrows in 3D
    pg.evaluate('document.activeElement && document.activeElement.blur()')
    a0 = v3(pg)
    pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(600); pg.keyboard.up('ArrowUp'); pg.wait_for_timeout(100)
    a1 = v3(pg)
    check('3d: ArrowUp steers (homeY decreases)', a1['homeY'] < a0['homeY'] - 5, (a0['homeY'], a1['homeY']))
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(600); pg.keyboard.up('ArrowRight'); pg.wait_for_timeout(100)
    a2 = v3(pg)
    check('3d: ArrowRight steers (homeX or homeLat changes)', abs(a2['homeX'] - a1['homeX']) > 5 or abs(a2['homeLat'] - a1['homeLat']) > 5, (a1['homeX'], a2['homeX'], a1['homeLat'], a2['homeLat']))
    s0 = v3(pg)
    pg.keyboard.press('Shift+ArrowLeft'); pg.wait_for_timeout(100); s1 = v3(pg)
    pg.keyboard.press('Shift+ArrowRight'); pg.keyboard.press('Shift+ArrowRight'); pg.wait_for_timeout(100); s2 = v3(pg)
    pg.keyboard.press('Shift+ArrowUp'); pg.wait_for_timeout(100); s3 = v3(pg)
    check('3d: Shift+ArrowLeft/Right turn the camera (yaw +/- 0.14)', abs(s1['yaw'] - s0['yaw'] - 0.14) < 1e-6 and abs(s2['yaw'] - s1['yaw'] + 0.28) < 1e-6, (s0['yaw'], s1['yaw'], s2['yaw']))
    check('3d: Shift+ArrowUp tilts the camera', abs(s3['pitch'] - s2['pitch'] - 0.1) < 1e-6, (s2['pitch'], s3['pitch']))
    check('3d: Shift+arrows do not steer the plane', (s3['homeX'], s3['homeY'], s3['homeLat']) == (s0['homeX'], s0['homeY'], s0['homeLat']))
    # clicking a duck in 3D waves (tap, no drag)
    pg.keyboard.press('r'); pg.wait_for_timeout(2500)
    for i in range(3):
        pg.wait_for_function(f'{D}.DUCKS[{i}].wave <= 0', timeout=8000)
        x, y = ev(pg, f'{D}.duck3({i})')
        pg.mouse.click(x, y); w = ev(pg, f'{D}.DUCKS[{i}].wave')
        check(f'3d: tapping duck {i} waves', w > 0, (x, y, w))
    # orbit still redraws while paused
    pg.keyboard.press('p'); pg.wait_for_timeout(500)
    t0 = ev(pg, f'{D}.world.t'); p1 = pg.screenshot(clip={'x': 0, 'y': 0, 'width': 1280, 'height': 640}); yaw0 = v3(pg)['cam'][0]
    pg.mouse.move(400, 250); pg.mouse.down(); pg.mouse.move(600, 250, steps=8); pg.mouse.up(); pg.wait_for_timeout(500)
    p2 = pg.screenshot(clip={'x': 0, 'y': 0, 'width': 1280, 'height': 640}); yaw1 = v3(pg)['cam'][0]
    n = shot_diff(p1, p2)
    check('3d: paused flight, orbit still redraws', ev(pg, f'{D}.world.t') == t0 and abs(yaw1 - yaw0) > 0.3 and n > 20000, (yaw0, yaw1, n))
    # paused 3D with the Background clock: the clock is drawn in the sky
    g = bg(pg); S = ev(pg, f'{D}.view.S / {D}.view.dpr')
    clip = {'x': ev(pg, f'{D}.bgClock.x') * S, 'y': ev(pg, f'{D}.bgClock.y') * S, 'width': g['w'] * S, 'height': g['h'] * S}
    pg.keyboard.press('r'); pg.wait_for_timeout(1500)
    a = pg.screenshot(clip=clip); set_mode(pg, 'off'); close_panel(pg); pg.wait_for_timeout(500); c0 = pg.screenshot(clip=clip)
    n = shot_diff(a, c0)
    check('3d: Background clock visible in the 3D sky (pixels differ from clock off)', n > 150, n)
    set_mode(pg, 'bg'); close_panel(pg)
    pg.keyboard.press('p'); pg.wait_for_timeout(300)
    # weather and night in 3D
    pg.keyboard.press('w'); pg.wait_for_timeout(200); pg.keyboard.press('w'); pg.wait_for_timeout(200)
    pg.click('#todSeg [data-v=night]'); pg.wait_for_timeout(2600)
    st = ev(pg, f'[{D}.state.wx, {D}.state.tod]')
    n, sd, png = scene_blank(pg, 'rain-night')
    open('%s/up_3d_rain_night.png' % OUT, 'wb').write(png)
    check('3d: rain at night renders (not blank, no errors)', st == ['rain', 'night'] and n > 300 and not msgs, (st, n, msgs[:3]))
    pg.keyboard.press('w'); pg.keyboard.press('w'); pg.click('#todSeg [data-v=day]'); pg.wait_for_timeout(2000)
    # city change inside 3D ends on the new city
    pg.evaluate('document.activeElement && document.activeElement.blur()')
    for key, cid in (('3', 'paris'), ('4', 'tokyo')):
        pg.keyboard.press(key)
        pg.wait_for_function(f'{D}.city === "{cid}" && !{D}.trans.on', timeout=15000); pg.wait_for_timeout(1500)
        check(f'3d: changing city to {cid} -> V3.city.id', ev(pg, f'{D}.V3.city.id') == cid and ev(pg, f'{D}.state.view') == '3d', ev(pg, f'{D}.V3.city && {D}.V3.city.id'))
    n, sd, png = scene_blank(pg, 'tokyo3d'); check('3d: new city renders', n > 300, n)
    noerr('views 3D', msgs)

    # ---- Front and Rear: click steers, duck click waves
    for v in ('front', 'rear'):
        pg.keyboard.press('1'); pg.wait_for_function(f'{D}.city === "philadelphia" && !{D}.trans.on', timeout=15000)
        view_panel_set(pg, v); close_panel(pg); pg.wait_for_timeout(2600)
        h0 = v3(pg)
        pg.mouse.click(230, 180); pg.wait_for_timeout(800); h1 = v3(pg)
        check(f'{v}: click away from the plane changes homeLat or homeY', abs(h1['homeLat'] - h0['homeLat']) > 1 or abs(h1['homeY'] - h0['homeY']) > 1, (h0['homeLat'], h1['homeLat'], h0['homeY'], h1['homeY']))
        pg.mouse.click(1050, 520); pg.wait_for_timeout(1000); h2 = v3(pg)
        check(f'{v}: a second click elsewhere moves it again', abs(h2['homeLat'] - h1['homeLat']) > 1 or abs(h2['homeY'] - h1['homeY']) > 1, (h1['homeLat'], h2['homeLat']))
        # drag steers continuously
        pg.mouse.move(400, 300); pg.mouse.down(); pg.mouse.move(850, 250, steps=6); pg.mouse.up(); pg.wait_for_timeout(500); h3 = v3(pg)
        check(f'{v}: drag steers', abs(h3['homeLat'] - h2['homeLat']) > 1 or abs(h3['homeY'] - h2['homeY']) > 1, (h2['homeLat'], h3['homeLat']))
        check(f'{v}: steering leaves the 3D orbit alone', abs(h3['yaw'] - 0.72) < 1e-6 and abs(h3['dist'] - 150) < 1e-6, (h3['yaw'], h3['dist']))
        pg.mouse.click(640, 750)  # a click on the dock-free bottom area must be harmless
        pg.wait_for_timeout(400)
        pg.mouse.move(640, 400); pg.wait_for_timeout(1500)
        for i in range(3):
            pg.wait_for_function(f'{D}.DUCKS[{i}].wave <= 0', timeout=8000)
            x, y = ev(pg, f'{D}.duck3({i})')
            pg.mouse.click(x, y); w = ev(pg, f'{D}.DUCKS[{i}].wave')
            check(f'{v}: clicking duck {i} waves', w > 0, (round(x), round(y), w))
            pg.wait_for_timeout(100)
        pg.screenshot(path=f'{OUT}/up_view_{v}.png')
        h = v3(pg); pg.mouse.click(230, 180); pg.wait_for_timeout(300)
    noerr('views front/rear', msgs)
    # rain + night in front/rear
    pg.keyboard.press('w'); pg.keyboard.press('w'); pg.click('#todSeg [data-v=night]'); pg.wait_for_timeout(2500)
    n, sd, png = scene_blank(pg, 'rear-rain'); check('rear: rain at night renders', n > 300, n)
    noerr('views rain', msgs)
    ctx.close()


# ---------------------------------------------------------------- 6. no WebGL
NOGL = "(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (t === 'webgl' || t === 'experimental-webgl' || t === 'webgl2') return null; return o.call(this, t, ...a); }; })();"


@section
def fallback(b):
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'tod': 'day'}, init=[NOGL])
    pg.click('#viewBtn'); pg.wait_for_timeout(250)
    pg.click('#viewSeg [data-v="3d"]'); pg.wait_for_timeout(500)
    toast = pg.evaluate("document.getElementById('toast').textContent"); on = pg.evaluate("document.getElementById('toast').classList.contains('is-on')")
    st = ev(pg, f'{{view: {D}.state.view, ok: {D}.V3.ok, why: {D}.V3.why, cls: document.documentElement.className}}')
    check('fallback: picking 3D stays in side', st['view'] == 'side' and not st['ok'] and 'v3d' not in st['cls'].split(), st)
    check('fallback: toast explains why', on and st['why'] and st['why'][:30] in toast and 'Side' in toast, toast)
    pg.click('#viewBtn') if pg.evaluate(f'{D}.state.panel') != 'view' else None
    pg.wait_for_timeout(200)
    note = pg.text_content('#viewNote')
    check('fallback: View panel note shows the reason', st['why'] in note, note)
    dis = pg.evaluate("Object.fromEntries([...document.querySelectorAll('#viewSeg button')].map(b => [b.dataset.v, b.disabled]))")
    check('fallback: Front/Rear/3D disabled, Side enabled', dis == {'side': False, 'front': True, 'rear': True, '3d': True}, dis)
    check('fallback: Side is still the checked view', pg.get_attribute('#viewSeg [data-v=side]', 'aria-checked') == 'true')
    close_panel(pg)
    pg.keyboard.press('v'); pg.wait_for_timeout(400)
    check('fallback: V key stays in side, with a toast', ev(pg, f'{D}.state.view') == 'side' and 'Side view' in pg.evaluate("document.getElementById('toast').textContent"))
    f0 = ev(pg, f'{D}.frames'); t0 = ev(pg, f'{D}.world.t'); pg.wait_for_timeout(1500)
    check('fallback: side view still animates', ev(pg, f'{D}.frames') > f0 + 20 and ev(pg, f'{D}.world.t') > t0 + 0.5)
    px, py = ev(pg, f'{D}.planeScreen()'); h0 = ev(pg, f'[{D}.plane.homeX, {D}.plane.homeY]'); pg.mouse.click(px + 380 if px < 700 else px - 380, 260); pg.wait_for_timeout(300)
    check('fallback: side steering works', ev(pg, f'[{D}.plane.homeX, {D}.plane.homeY]') != h0)
    pg.keyboard.press('c'); pg.keyboard.press('c'); pg.wait_for_timeout(400)
    check('fallback: background clock still works in side', ev(pg, f'{D}.state.clockMode') == 'bg' and bg(pg)['on'] and bg(pg)['w'] > 20)
    noerr('fallback', msgs)
    ctx.close()
    for v in ('3d', 'front', 'rear'):
        ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'view': v, 'clockMode': 'bg'}, init=[NOGL])
        pg.wait_for_timeout(800)
        st = ev(pg, f'{{view: {D}.state.view, ok: {D}.V3.ok, cls: document.documentElement.className, frames: {D}.frames}}')
        check(f'fallback: saved view {v} boots cleanly into side', st['view'] == 'side' and 'v3d' not in st['cls'].split() and st['frames'] > 10, st)
        check(f'fallback: boot with saved {v} has no page errors', not msgs, msgs)
        pg.screenshot(path=f'{OUT}/up_fallback_{v}.png') if v == '3d' else None
        ctx.close()


# ---------------------------------------------------------------- 7. prefs
@section
def prefs(b):
    full = {'seenHint': True, 'city': 'tokyo', 'tod': 'sunset', 'wx': 'cloudy', 'speed': 1.75, 'clockMode': 'bg', 'clockSrc': 'zone', 'clockZone': 'Asia/Tokyo', 'secs': True, 'showDate': False, 'showZone': True, 'clockSize': 1.5, 'clockOpacity': 0.45, 'h12': False, 'view': '3d'}
    ctx, pg, msgs = mk(b, prefs={'seenHint': True})
    # set via the UI, reload, compare
    pg.keyboard.press('4'); pg.wait_for_function(f'{D}.city === "tokyo" && !{D}.trans.on', timeout=15000)
    pg.click('#todSeg [data-v=sunset]'); pg.keyboard.press('w'); pg.wait_for_timeout(200)
    open_panel(pg, 'clock'); pg.click('#clockModeSeg [data-v=bg]'); pg.click('#clockSrcSeg [data-v=zone]'); pg.select_option('#zoneSel', 'Asia/Tokyo')
    pg.click('#clockFmtSeg [data-v="24"]'); pg.click('#chipSecs'); pg.click('#chipDate'); pg.click('#chipZone')
    pg.locator('#clockSize').fill('1.5'); pg.locator('#clockOpacity').fill('0.45')
    view_panel_set(pg, '3d'); pg.wait_for_timeout(600)
    before = ev(pg, f'{D}.state')
    pg.reload(); pg.wait_for_function(f'window.__duckair && {D}.frames > 5'); pg.wait_for_timeout(1500)
    after = ev(pg, f'{D}.state')
    keys = ['city', 'tod', 'wx', 'speed', 'clockMode', 'clockSrc', 'clockZone', 'secs', 'showDate', 'showZone', 'clockSize', 'clockOpacity', 'h12', 'view', 'auto']
    diff = {k: (before[k], after[k]) for k in keys if before[k] != after[k]}
    check('prefs: every new pref survives a reload', not diff, diff)
    check('prefs: restored values are what was set', all(after[k] == full[k] for k in ['city', 'tod', 'wx', 'clockMode', 'clockSrc', 'clockZone', 'secs', 'showDate', 'showZone', 'clockSize', 'clockOpacity', 'h12', 'view']), {k: after[k] for k in full if k in after})
    check('prefs: reload lands in the saved 3D view with it visible', ev(pg, f'{D}.V3.ok') and 'v3d-orbit' in pg.evaluate('document.documentElement.className').split() and bg(pg)['on'])
    open_panel(pg, 'clock')
    check('prefs: panel controls reflect the restored prefs', pg.input_value('#clockSize') == '1.5' and pg.input_value('#clockOpacity') == '0.45' and pg.input_value('#zoneSel') == 'Asia/Tokyo' and pg.get_attribute('#chipSecs', 'aria-pressed') == 'true' and pg.get_attribute('#chipDate', 'aria-pressed') == 'false')
    # auto persisted
    pg.click('#skySwitch'); pg.wait_for_timeout(500); pg.reload(); pg.wait_for_function(f'window.__duckair && {D}.frames > 5'); pg.wait_for_timeout(800)
    check('prefs: match sky survives a reload', ev(pg, f'{D}.state.auto') and ev(pg, f'{D}.state.tod === {D}.skyNow()'))
    noerr('prefs', msgs)
    ctx.close()
    # view front / rear persist too
    for v in ('front', 'rear'):
        ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'view': v})
        pg.wait_for_timeout(800)
        check(f'prefs: saved view {v} restored', ev(pg, f'{D}.state.view') == v and 'v3d' in pg.evaluate('document.documentElement.className').split(), ev(pg, f'{D}.state.view'))
        ctx.close()
    # old and broken saves
    old = [
        ('old: clock true, h12 false', {"city": "tokyo", "tod": "night", "wx": "rain", "clock": True, "h12": False, "speed": 1.5},
         lambda s, p: s['clockMode'] == 'corner' and s['h12'] is False and s['city'] == 'tokyo' and s['tod'] == 'night' and s['wx'] == 'rain' and s['speed'] == 1.5 and s['view'] == 'side' and s['clockSrc'] == 'local' and not s['auto'] and corner(p)['hidden'] is False),
        ('old: clock false', {"clock": False}, lambda s, p: s['clockMode'] == 'off' and s['city'] == 'philadelphia' and corner(p)['hidden'] and not bg(p)['on']),
        ('old: tod day / sunset', {"tod": "sunset", "clock": True}, lambda s, p: s['tod'] == 'sunset' and s['clockMode'] == 'corner'),
        ('garbage values', {"clockMode": "x", "clockSize": "big", "clockZone": "Not/AZone", "view": "7"},
         lambda s, p: s['clockMode'] == 'off' and s['clockSize'] == 1 and s['clockZone'] == '' and s['view'] == 'side' and s['clockSrc'] == 'local'),
        ('zone source with an invalid zone', {"clockMode": "corner", "clockSrc": "zone", "clockZone": "Mars/Base"}, lambda s, p: s['clockSrc'] == 'local' and s['clockZone'] == '' and not corner(p)['hidden']),
        ('out-of-range numbers are clamped', {"clockSize": 99, "clockOpacity": -4, "speed": 50}, lambda s, p: s['clockSize'] == 2 and s['clockOpacity'] == 0.2 and s['speed'] == 2.5),
        ('NaN-ish types', {"clockSize": None, "clockOpacity": "0.5", "secs": "yes", "view": None, "clockMode": 3}, lambda s, p: s['clockSize'] == 1 and s['clockOpacity'] == 0.7 and s['secs'] is False and s['view'] == 'side' and s['clockMode'] == 'off'),
        ('not JSON at all', 'this is { not json', lambda s, p: s['clockMode'] == 'off' and s['view'] == 'side'),
        ('JSON null', 'null', lambda s, p: s['clockMode'] == 'off'),
        ('JSON array', '[1,2,3]', lambda s, p: s['clockMode'] == 'off' and s['view'] == 'side'),
        ('JSON string', '"hello"', lambda s, p: s['clockMode'] == 'off'),
    ]
    for name, pf, okf in old:
        ctx, pg, msgs = mk(b, prefs=pf)
        pg.wait_for_timeout(500)
        s = ev(pg, f'{D}.state')
        check(f'prefs: {name} loads and maps sensibly', okf(s, pg) is True, {k: s[k] for k in ('clockMode', 'clockSrc', 'clockZone', 'clockSize', 'clockOpacity', 'h12', 'secs', 'view', 'city', 'tod', 'wx', 'speed')})
        check(f'prefs: {name} no errors', not msgs, msgs[:3])
        # an unusable save should be replaced by a healthy one after the first change
        if name.startswith('not JSON'):
            pg.keyboard.press('c'); pg.wait_for_timeout(500)
            raw = pg.evaluate(f'localStorage.getItem("{KEY}")')
            try: json.loads(raw); ok = True
            except Exception: ok = False
            check('prefs: a broken save is overwritten by a valid one', ok, raw)
        ctx.close()
    # localStorage unavailable
    ctx, pg, msgs = mk(b, init=["Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });"])
    pg.keyboard.press('c'); pg.keyboard.press('v'); pg.wait_for_timeout(600)
    check('prefs: blocked localStorage still works', ev(pg, f'{D}.state.clockMode') == 'corner' and not [m for m in msgs if 'PAGEERROR' in m], msgs[:3])
    ctx.close()


# ---------------------------------------------------------------- 8. mobile layout
SIZES = [(320, 568), (360, 740), (390, 844), (768, 1024), (844, 390), (568, 320)]
PROBE = """(() => { const r = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const dock = document.getElementById('dock'), dr = r(dock), iw = innerWidth, ih = innerHeight;
  const ctl = [...dock.querySelectorAll('button, input')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').map(e => ({ id: e.id || e.dataset.v || e.className, ...r(e) }));
  const bad = ctl.filter(c => c.w < 20 || c.h < 20 || c.l < dr.l - 1 || c.r > dr.r + 1 || c.t < dr.t - 1 || c.b > dr.b + 1 || c.l < 0 || c.r > iw + 0.5 || c.t < 0 || c.b > ih + 0.5);
  let overlaps = []; for (let i = 0; i < ctl.length; i++) for (let j = i + 1; j < ctl.length; j++) { const a = ctl[i], b = ctl[j]; const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t); if (ox > 2 && oy > 2) overlaps.push([a.id, b.id]); }
  return JSON.stringify({ iw, ih, sw: document.documentElement.scrollWidth, bsw: document.body.scrollWidth, dock: dr, n: ctl.length, bad, overlaps }); })()"""
PANEL = """((id) => { const p = document.getElementById(id), b = p.getBoundingClientRect(), iw = innerWidth, ih = innerHeight, dock = document.getElementById('dock').getBoundingClientRect();
  const els = [...p.querySelectorAll('button, input, select')].filter(e => !e.closest('[hidden]') && e.offsetParent !== null);
  const miss = [];
  for (const e of els) { e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(), pr = p.getBoundingClientRect(); const x = q.left + q.width / 2, y = q.top + q.height / 2;
    const hit = document.elementFromPoint(x, y); const inside = y >= pr.top - 1 && y <= pr.bottom + 1 && x >= pr.left - 1 && x <= pr.right + 1 && q.width >= 24 && q.height >= 24;
    if (!hit || !(e === hit || e.contains(hit) || hit.contains(e)) || !inside) miss.push([e.id || e.dataset.v || e.textContent.trim().slice(0, 12), Math.round(q.width), Math.round(q.height), hit ? (hit.id || hit.tagName) : null]); }
  const over = els.filter(e => { const q = e.getBoundingClientRect(), pr = p.getBoundingClientRect(); return q.right > pr.right - 8 || q.left < pr.left + 8; }).map(e => e.id || e.dataset.v || e.textContent.trim().slice(0, 12));
  p.scrollTop = 0; const b2 = p.getBoundingClientRect();
  return JSON.stringify({ t: b2.top, l: b2.left, r: b2.right, b: b2.bottom, iw, ih, dockTop: dock.top, scrollH: p.scrollHeight, clientH: p.clientHeight, oy: getComputedStyle(p).overflowY, n: els.length, miss, over, sw: document.documentElement.scrollWidth }); })"""


@section
def mobile(b):
    for (w, h) in SIZES:
        dpr = 2
        tag = f'{w}x{h}'
        ctx, pg, msgs = mk(b, w, h, dpr, touch=True, prefs={'seenHint': True, 'clockMode': 'bg', 'tod': 'day'})
        pg.wait_for_timeout(600)
        r = json.loads(pg.evaluate(PROBE))
        check(f'mobile {tag}: dock inside viewport', r['dock']['l'] >= 0 and r['dock']['r'] <= r['iw'] + 0.5 and r['dock']['t'] >= 0 and r['dock']['b'] <= r['ih'] + 0.5, r['dock'])
        check(f'mobile {tag}: no horizontal overflow', r['sw'] <= r['iw'] and r['bsw'] <= r['iw'], (r['sw'], r['bsw'], r['iw']))
        check(f'mobile {tag}: no dock control clipped or overlapping', not r['bad'] and not r['overlaps'], (r['bad'][:3], r['overlaps'][:3]))
        # Clock panel
        pg.tap('#clockBtn'); pg.wait_for_timeout(400)
        pr = json.loads(pg.evaluate(PANEL + "('clockPanel')"))
        check(f'mobile {tag}: Clock panel fully on screen', pr['t'] >= 0 and pr['l'] >= 0 and pr['r'] <= pr['iw'] + 0.5 and pr['b'] <= pr['dockTop'] + 1 and pr['b'] <= pr['ih'], pr)
        check(f'mobile {tag}: Clock panel controls stay inside the panel padding', not pr['over'], pr['over'])
        check(f'mobile {tag}: Clock panel scrolls if tall', pr['scrollH'] <= pr['clientH'] + 1 or pr['oy'] in ('auto', 'scroll'), (pr['scrollH'], pr['clientH'], pr['oy']))
        check(f'mobile {tag}: Clock panel controls tappable ({pr["n"]})', pr['n'] >= 12 and not pr['miss'], pr['miss'])
        check(f'mobile {tag}: no horizontal overflow with the Clock panel', pr['sw'] <= pr['iw'], pr['sw'])
        pg.evaluate("document.getElementById('clockPanel').scrollTop = 0")
        pg.screenshot(path=f'{OUT}/up_mob_{tag}_clock.png')
        # real taps in the panel
        pg.evaluate("document.getElementById('clockPanel').scrollTop = 0")
        pg.tap('#clockModeSeg [data-v=corner]'); pg.wait_for_timeout(300)
        check(f'mobile {tag}: tapping Corner works', ev(pg, f'{D}.state.clockMode') == 'corner')
        pg.tap('#clockModeSeg [data-v=bg]'); pg.wait_for_timeout(300)
        pg.tap('#chipSecs'); pg.wait_for_timeout(200)
        check(f'mobile {tag}: tapping Seconds works', ev(pg, f'{D}.state.secs') is True)
        pg.tap('#clockSrcSeg [data-v=zone]'); pg.wait_for_timeout(300)
        pr2 = json.loads(pg.evaluate(PANEL + "('clockPanel')"))
        check(f'mobile {tag}: Clock panel with zone picker still fits and is tappable', pr2['t'] >= 0 and pr2['b'] <= pr2['ih'] and not pr2['miss'], (pr2['t'], pr2['b'], pr2['miss']))
        pg.tap('#clockSrcSeg [data-v=local]'); pg.wait_for_timeout(200)
        pg.tap('#clockClose'); pg.wait_for_timeout(300)
        check(f'mobile {tag}: panel closes', pg.evaluate(f'{D}.state.panel') == '')
        # background clock fits the width
        g = bg(pg); vw = ev(pg, f'{D}.view.VW')
        check(f'mobile {tag}: background clock fits the screen width', g['w'] <= vw and g['w'] > 10 and ev(pg, f'{D}.bgClock.x') >= 0, (g['w'], vw))
        # View panel in 3D
        pg.tap('#viewBtn'); pg.wait_for_timeout(300)
        pg.tap('#viewSeg [data-v="3d"]'); pg.wait_for_timeout(2500)
        check(f'mobile {tag}: tapping 3D switches view', ev(pg, f'{D}.state.view') == '3d')
        pv = json.loads(pg.evaluate(PANEL + "('viewPanel')"))
        check(f'mobile {tag}: View panel fully on screen', pv['t'] >= 0 and pv['l'] >= 0 and pv['r'] <= pv['iw'] + 0.5 and pv['b'] <= pv['dockTop'] + 1 and pv['b'] <= pv['ih'], pv)
        check(f'mobile {tag}: View panel controls tappable ({pv["n"]})', pv['n'] >= 8 and not pv['miss'], pv['miss'])
        check(f'mobile {tag}: View panel controls stay inside the panel padding', not pv['over'], pv['over'])
        check(f'mobile {tag}: View panel scrolls if tall', pv['scrollH'] <= pv['clientH'] + 1 or pv['oy'] in ('auto', 'scroll'), (pv['scrollH'], pv['clientH']))
        pg.evaluate("document.getElementById('viewPanel').scrollTop = 0")
        pg.screenshot(path=f'{OUT}/up_mob_{tag}_view3d.png')
        o0 = v3(pg); pg.evaluate("document.getElementById('viewPanel').scrollTop = 1e4"); pg.wait_for_timeout(100)
        pg.tap('#camFront'); pg.wait_for_timeout(200)
        check(f'mobile {tag}: tapping Front camera preset works', abs(v3(pg)['yaw'] - np.pi / 2) < 1e-6)
        pg.tap('#viewClose'); pg.wait_for_timeout(300)
        # touch: pinch and drag work on the canvas; dock still fits in 3D
        r = json.loads(pg.evaluate(PROBE))
        check(f'mobile {tag}: layout intact in 3D', r['sw'] <= r['iw'] and not r['bad'] and r['dock']['b'] <= r['ih'] + 0.5, (r['sw'], r['bad'][:2]))
        # one-finger touch drag in 3D orbits
        cdp = ctx.new_cdp_session(pg)
        cx, cy = w // 2, max(60, h // 3)
        y0 = v3(pg)['yaw']
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': cx, 'y': cy, 'id': 0}]})
        for k in range(1, 6): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': cx + k * 12, 'y': cy, 'id': 0}]}); pg.wait_for_timeout(30)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(200)
        check(f'mobile {tag}: touch drag orbits the camera', abs(v3(pg)['yaw'] - y0) > 0.2, (y0, v3(pg)['yaw']))
        noerr(f'mobile {tag}', msgs)
        ctx.close()
    # Clock card in the corner on phones does not collide with the tag or the dock
    for (w, h) in ((320, 568), (390, 844), (844, 390)):
        ctx, pg, msgs = mk(b, w, h, 2, touch=True, prefs={'seenHint': True, 'clockMode': 'corner'})
        r = ev(pg, "(() => { const g = id => document.getElementById(id).getBoundingClientRect().toJSON(); return { c: g('clock'), t: g('tag'), d: g('dock') }; })()")
        ov = lambda a, b2: min(a['right'], b2['right']) - max(a['left'], b2['left']) > 1 and min(a['bottom'], b2['bottom']) - max(a['top'], b2['top']) > 1
        check(f'mobile {w}x{h}: corner clock overlaps neither tag nor dock, inside viewport', not ov(r['c'], r['t']) and not ov(r['c'], r['d']) and r['c']['left'] >= 0 and r['c']['right'] <= w, r)
        pg.screenshot(path=f'{OUT}/up_mob_{w}x{h}_corner.png')
        ctx.close()


# ---------------------------------------------------------------- 9. reduced motion
@section
def reduced(b):
    ctx, pg, msgs = mk(b, reduced=True, prefs={'seenHint': True, 'clockMode': 'bg'})
    check('reduced: REDUCED motion detected (speed default 0.6 not used with saved prefs)', pg.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"))
    goals = {'front': (np.pi / 2 - 0.3, 0.17, 112), 'rear': (-np.pi / 2 + 0.2, 0.27, 124), '3d': (0.72, 0.2, 150)}
    for v in ('front', 'rear', '3d', 'side', 'front', '3d'):
        view_panel_set(pg, v); pg.wait_for_timeout(250)
        st = ev(pg, f'{{view: {D}.state.view, op: getComputedStyle(document.getElementById("scene3d")).opacity, cam: [{D}.V3.cam.yaw, {D}.V3.cam.pitch, {D}.V3.cam.dist]}}')
        ok = st['view'] == v
        if v != 'side':
            g = goals[v]
            dy = (st['cam'][0] - g[0] + np.pi) % (2 * np.pi) - np.pi
            ok = ok and abs(dy) < 1e-3 and abs(st['cam'][1] - g[1]) < 1e-3 and abs(st['cam'][2] - g[2]) < 1e-2 and st['op'] == '1'
        else:
            ok = ok and st['op'] == '0'
        check(f'reduced: switching to {v} works and the camera snaps within 250 ms', ok, st)
    pg.click('#camFront'); pg.wait_for_timeout(250)
    c = ev(pg, f'{D}.V3.cam.yaw')
    check('reduced: camera preset snaps', abs(c - np.pi / 2) < 1e-3, c)
    close_panel(pg)
    pg.mouse.move(300, 250); pg.mouse.down(); pg.mouse.move(500, 300, steps=5); pg.mouse.up(); pg.wait_for_timeout(200)
    check('reduced: orbit drag still works', abs(v3(pg)['yaw'] - np.pi / 2) > 0.3)
    # contrast: the same switch without reduced motion takes time
    ctx2, pg2, msgs2 = mk(b, prefs={'seenHint': True})
    view_panel_set(pg2, 'rear'); pg2.wait_for_timeout(120)
    c2 = ev(pg2, f'{D}.V3.cam.yaw'); d2 = abs((c2 - (-np.pi / 2 + 0.2) + np.pi) % (2 * np.pi) - np.pi)
    check('reduced: (control) normal motion has not finished after 120 ms', d2 > 0.05, d2)
    ctx2.close()
    set_mode(pg, 'bg'); pg.keyboard.press('Escape')
    pg.keyboard.press('v'); pg.keyboard.press('v'); pg.wait_for_timeout(300)
    noerr('reduced', msgs)
    ctx.close()


# ---------------------------------------------------------------- 10. performance and soak
def heap(pg):
    pg.evaluate('window.gc && gc()'); pg.wait_for_timeout(200); pg.evaluate('window.gc && gc()')
    return round(pg.evaluate('performance.memory.usedJSHeapSize') / 1048576, 2)


def fps(pg, secs=3):
    a = pg.evaluate(f'{D}.frames'); pg.wait_for_timeout(int(secs * 1000)); return round((pg.evaluate(f'{D}.frames') - a) / secs, 1)


SECTIONS['soak'] = None  # runs in its own browser (needs gc flags), see soak_run

def soak_run(p):
    b = p.chromium.launch(args=['--js-flags=--expose-gc', '--enable-precise-memory-info'])
    ctx, pg, msgs = mk(b, prefs={'seenHint': True, 'clockMode': 'bg', 'secs': True})
    check('soak: gc and heap counters available', pg.evaluate("typeof window.gc === 'function' && !!performance.memory"))
    f_side = fps(pg, 3)
    view_panel_set(pg, '3d'); close_panel(pg); pg.wait_for_timeout(2500)
    f_3d = fps(pg, 3)
    print(f'INFO fps side={f_side} 3d={f_3d} (headless software GL, informational)', flush=True)
    check('soak: both views animate (fps > 2 under software GL)', f_side > 2 and f_3d > 2, (f_side, f_3d))
    cities = ['nyc', 'paris', 'tokyo', 'london', 'philadelphia']
    def city_to(i):
        k = ['philadelphia', 'nyc', 'paris', 'tokyo', 'london'].index(cities[i % 5]) + 1
        pg.keyboard.press(str(k)); pg.wait_for_function(f'{D}.city === "{cities[i % 5]}" && !{D}.trans.on', timeout=20000); pg.wait_for_timeout(300)
    def round_(n):
        views = ['front', 'rear', '3d', 'side']
        for i in range(12):
            pg.keyboard.press('v'); pg.wait_for_timeout(350)
        for i in range(5):
            city_to(i)
            pg.keyboard.press('v'); pg.wait_for_timeout(250)
        view_panel_set(pg, '3d'); close_panel(pg)
    pg.evaluate('document.activeElement && document.activeElement.blur()')
    round_(0)  # warm up (builds all five 3D cities, shaders, caches)
    h0 = heap(pg); print(f'INFO heap after warm-up round = {h0} MB', flush=True)
    for n in (1, 2):
        round_(n)
        print(f'INFO heap after round {n} = {heap(pg)} MB', flush=True)
    h2 = heap(pg)
    growth = h2 - h0
    check('soak: no page errors after 12 view switches + 5 city changes in 3D (x3 rounds)', not msgs, msgs[:3])
    check('soak: JS heap not growing (< 6 MB over two more rounds)', growth < 6, f'{h0} -> {h2} MB, growth {growth:+.2f}')
    check('soak: still rendering in 3D', ev(pg, f'{D}.state.view') in ('3d', 'side', 'front', 'rear') and ev(pg, f'{D}.V3.ok'))
    f_after = fps(pg, 3)
    print(f'INFO fps after soak = {f_after}', flush=True)
    check('soak: fps after soak not collapsed (>= 50% of before)', f_after >= 0.5 * min(f_side, f_3d) or f_after > 20, (f_side, f_3d, f_after))
    ctx.close(); b.close()


# ---------------------------------------------------------------- main
if __name__ == '__main__':
    which = sys.argv[1:] or list(SECTIONS) + []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name in which:
            if name == 'soak':
                continue
            if name not in SECTIONS: print('unknown section', name); continue
            print(f'\n=== {name} ===', flush=True)
            try: SECTIONS[name](b)
            except Exception as e:
                check(f'{name}: section crashed', False, repr(e)[:300]); traceback.print_exc()
        b.close()
        if 'soak' in which:
            print('\n=== soak ===', flush=True)
            try: soak_run(p)
            except Exception as e:
                check('soak: section crashed', False, repr(e)[:300]); traceback.print_exc()
    print('\n' + ('ALL PASS' if not fails else 'FAILURES: ' + '; '.join(fails)))
    sys.exit(1 if fails else 0)
