"""Wallpaper mode: the wallpaper copy in a browser, simulated Plash (default, under the
menu bar, Dock hidden), browsing-mode toggles, insets, frame cap, Match sky to clock and Tour."""
import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
_os.makedirs(ROOT + '/shots', exist_ok=True)

import json, sys
from playwright.sync_api import sync_playwright

OUT = f'{ROOT}/shots'
WP = f'file://{ROOT}/build/DuckAir%20Wallpaper/index.html?debug'
APP = f'file://{ROOT}/DuckAir.html?debug'
D = 'window.__duckair'
fails = []

def check(name, cond, info=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' :: ' + str(info)) if info != '' else ''))
    if not cond: fails.append(name)

def screen_js(w, h, ah, at):
    return ("(() => { const def = (k, v) => Object.defineProperty(Screen.prototype, k, { get: () => v, configurable: true });"
            f" def('width', {w}); def('height', {h}); def('availWidth', {w}); def('availHeight', {ah}); def('availTop', {at}); }})();")

PLASH_JS = "document.addEventListener('DOMContentLoaded', () => setTimeout(() => document.documentElement.classList.add('is-plash-app'), 0));"

STATE = f"""JSON.stringify({{
  wp: {D}.wp, hidden: {D}.state.hidden, clockMode: {D}.state.clockMode, auto: {D}.state.auto, tour: {D}.state.tour, tod: {D}.state.tod, city: {D}.city,
  dpr: {D}.view.dpr, S: {D}.view.S, cw: document.getElementById('scene').width, insetTop: {D}.view.insetTop, insetBottom: {D}.view.insetBottom,
  cls: document.documentElement.className, showDisp: getComputedStyle(document.getElementById('showBtn')).display, showHidden: document.getElementById('showBtn').hidden,
  dockVis: getComputedStyle(document.getElementById('dock')).visibility, clockRect: document.getElementById('clock').getBoundingClientRect().toJSON(),
  clockShown: !document.getElementById('clock').hidden, tag: document.getElementById('tag').getBoundingClientRect().toJSON(), tagVis: getComputedStyle(document.getElementById('tag')).visibility,
  dock: document.getElementById('dock').getBoundingClientRect().toJSON(), todChecked: (document.querySelector('#todSeg [aria-checked=true]') || {{}}).dataset.v, sw: document.getElementById('skySwitch').getAttribute('aria-checked'), bgOn: {D}.bgClock.on,
  solar: {D}.skyNow(), boundsMinY: {D}.bounds.minY, boundsMaxY: {D}.bounds.maxY, vh: innerHeight, vw: innerWidth,
  toast: document.getElementById('toast').classList.contains('is-on') ? document.getElementById('toast').textContent : ''
}})"""

def st(pg):
    return json.loads(pg.evaluate(STATE))

def fps(pg, secs=3):
    a = pg.evaluate(f'{D}.frames'); pg.wait_for_timeout(int(secs * 1000)); b = pg.evaluate(f'{D}.frames')
    return (b - a) / secs

def new_page(b, vw, vh, dpr, init=None, tz=None):
    ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=dpr, timezone_id=tz or 'America/New_York')
    pg = ctx.new_page()
    msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    for js in (init or []): pg.add_init_script(js)
    return ctx, pg, msgs

with sync_playwright() as p:
    b = p.chromium.launch()

    # ---------- A: the wallpaper copy opened in an ordinary browser window ----------
    ctx, pg, msgs = new_page(b, 1280, 800, 2)
    pg.goto(WP); pg.wait_for_timeout(1500)
    s = st(pg)
    check('A wallpaper mode on', s['wp']['on'] and not s['wp']['plash'], s['wp'])
    check('A controls hidden, Show controls visible', s['hidden'] and s['showDisp'] != 'none' and not s['showHidden'], (s['hidden'], s['showDisp']))
    check('A first-run defaults: corner clock, match sky, tour', s['clockMode'] == 'corner' and s['auto'] and s['tour'] and s['clockShown'], (s['clockMode'], s['auto'], s['tour']))
    check('A sky matches the clock', s['tod'] == s['solar'] and s['todChecked'] == s['tod'] and s['sw'] == 'true', (s['tod'], s['solar'], s['todChecked'], s['sw']))
    check('A browser window gets no insets', s['insetTop'] == 0 and s['insetBottom'] == 0, (s['insetTop'], s['insetBottom']))
    check('A DPR capped to 1', s['dpr'] == 1 and s['cw'] == 1280, (s['dpr'], s['cw']))
    check('A clock top-left', abs(s['clockRect']['x'] - 16) < 2 and abs(s['clockRect']['y'] - 14) < 2, s['clockRect'])
    f = fps(pg)
    check('A frame cap about 30 fps', 25 <= f <= 32, f)
    pg.screenshot(path=f'{OUT}/wp_A1_browser_passive.png')
    pg.click('#showBtn'); pg.wait_for_timeout(700)
    s = st(pg)
    check('A Show controls restores the dock', not s['hidden'] and s['dockVis'] == 'visible', s['dockVis'])
    check('A tag sits below the clock', s['tag']['y'] >= s['clockRect']['y'] + s['clockRect']['height'] + 8, (s['tag']['y'], s['clockRect']['y'] + s['clockRect']['height']))
    pg.screenshot(path=f'{OUT}/wp_A2_browser_controls.png')
    check('A console clean', not msgs, msgs)
    ctx.close()

    # ---------- B: Plash default window (below the menu bar), Dock at the bottom ----------
    for label, url in (('B', WP), ('B2', APP)):
        ctx, pg, msgs = new_page(b, 1440, 864, 2, [screen_js(1440, 900, 787, 37), PLASH_JS])
        pg.goto(url); pg.wait_for_timeout(1500)
        s = st(pg)
        check(f'{label} Plash detected after load', s['wp']['on'] and s['wp']['plash'] and 'is-plash-app' in s['cls'] and 'wp-passive' in s['cls'], s['cls'])
        check(f'{label} passive: controls and Show button hidden', s['hidden'] and s['showDisp'] == 'none' and s['dockVis'] == 'hidden', (s['hidden'], s['showDisp'], s['dockVis']))
        check(f'{label} defaults applied after late detection', s['clockMode'] == 'corner' and s['auto'] and s['tour'] and s['sw'] == 'true' and s['tod'] == s['solar'], (s['clockMode'], s['auto'], s['tour'], s['sw'], s['tod'], s['solar']))
        check(f'{label} insets: none on top, Dock at bottom', s['insetTop'] == 0 and s['insetBottom'] == 76, (s['insetTop'], s['insetBottom']))
        check(f'{label} DPR capped', s['dpr'] == 1 and s['cw'] == 1440, (s['dpr'], s['cw']))
        check(f'{label} no toast on the wallpaper', s['toast'] == '', s['toast'])
        if label == 'B':
            f = fps(pg); check('B frame cap about 30 fps', 25 <= f <= 32, f)
            pg.screenshot(path=f'{OUT}/wp_B1_plash_passive.png')
        # Browsing Mode on
        pg.evaluate("document.documentElement.classList.add('plash-is-browsing-mode')"); pg.wait_for_timeout(700)
        s = st(pg)
        check(f'{label} browsing: controls shown', not s['hidden'] and s['dockVis'] == 'visible' and 'wp-passive' not in s['cls'], (s['hidden'], s['dockVis'], s['cls']))
        check(f'{label} browsing: toast explains', 'Browsing Mode' in s['toast'], s['toast'])
        check(f'{label} dock clears the macOS Dock', s['dock']['y'] + s['dock']['height'] <= 864 - 76 - 11, s['dock']['y'] + s['dock']['height'])
        check(f'{label} sound button available', pg.evaluate("getComputedStyle(document.getElementById('soundBtn')).display") != 'none')
        if label == 'B':
            pg.screenshot(path=f'{OUT}/wp_B2_plash_browsing.png')
            # steer by clicking the sky
            h0 = pg.evaluate(f'[{D}.plane.homeX, {D}.plane.homeY]')
            pg.mouse.click(1100, 300); pg.wait_for_timeout(300)
            h1 = pg.evaluate(f'[{D}.plane.homeX, {D}.plane.homeY]')
            check('B click steers in browsing mode', h1 != h0, (h0, h1))
            # context menu stays Plash's
            prevented = pg.evaluate("(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.getElementById('scene').dispatchEvent(e); return e.defaultPrevented; })()")
            check('B right-click left to Plash', prevented is False, prevented)
            # tour option in the city menu
            pg.click('#cityBtn'); pg.wait_for_timeout(300)
            menu = pg.evaluate("JSON.stringify({ items: [...document.querySelectorAll('#cityMenu li')].map(li => [li.dataset.city, li.getAttribute('aria-selected'), li.classList.contains('is-now')]), rect: document.getElementById('cityMenu').getBoundingClientRect().toJSON() })")
            menu = json.loads(menu)
            check('B menu shows Tour selected with the current city marked', menu['items'][-1][0] == 'tour' and menu['items'][-1][1] == 'true' and any(i[2] for i in menu['items']), menu['items'])
            check('B menu fits on screen', menu['rect']['y'] >= 0, menu['rect'])
            pg.screenshot(path=f'{OUT}/wp_B3_menu.png')
            pg.keyboard.press('Escape')
            # Browsing Mode off again
            pg.evaluate("document.documentElement.classList.remove('plash-is-browsing-mode')"); pg.wait_for_timeout(700)
            s = st(pg)
            check('B browsing off: controls tucked away', s['hidden'] and s['showDisp'] == 'none' and 'wp-passive' in s['cls'], (s['hidden'], s['showDisp']))
        check(f'{label} console clean', not msgs, msgs)
        ctx.close()

    # ---------- C: Plash under the menu bar (extended), Dock at the bottom ----------
    ctx, pg, msgs = new_page(b, 1440, 900, 2, [screen_js(1440, 900, 787, 37), PLASH_JS])
    pg.goto(WP); pg.wait_for_timeout(1500)
    s = st(pg)
    check('C insets: menu bar and Dock', s['insetTop'] == 37 and s['insetBottom'] == 76, (s['insetTop'], s['insetBottom']))
    check('C clock below the menu bar', abs(s['clockRect']['y'] - (14 + 37)) < 2, s['clockRect']['y'])
    check('C plane kept below the menu bar', s['boundsMinY'] >= 44 + 37 / s['S'] - 0.01, (s['boundsMinY'], s['S']))
    pg.screenshot(path=f'{OUT}/wp_C1_plash_extended.png')
    check('C console clean', not msgs, msgs)
    ctx.close()

    # ---------- D: Dock hidden (auto-hide) ----------
    ctx, pg, msgs = new_page(b, 1440, 864, 2, [screen_js(1440, 900, 859, 37), PLASH_JS])
    pg.goto(WP); pg.wait_for_timeout(1500)
    s = st(pg)
    check('D Dock hidden: no insets', s['insetTop'] == 0 and s['insetBottom'] == 0, (s['insetTop'], s['insetBottom']))
    ctx.close()

    # ---------- E: Dock appears later (screen metrics change without a resize) ----------
    ctx, pg, msgs = new_page(b, 1440, 864, 1, [screen_js(1440, 900, 859, 37), PLASH_JS])
    pg.goto(WP); pg.wait_for_timeout(1200)
    pg.evaluate("Object.defineProperty(Screen.prototype, 'availHeight', { get: () => 787, configurable: true })")
    pg.wait_for_timeout(2600)
    s = st(pg)
    check('E Dock change picked up', s['insetBottom'] == 76, s['insetBottom'])
    check('E console clean', not msgs, msgs)
    ctx.close()

    # ---------- F: saved settings win over wallpaper defaults ----------
    ctx, pg, msgs = new_page(b, 1440, 864, 1, [screen_js(1440, 900, 787, 37), PLASH_JS])
    pg.goto(WP); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('duckair.prefs.v1', JSON.stringify({ city: 'tokyo', tod: 'night', wx: 'rain', clockMode: 'off', auto: false, tour: false, seenHint: true })), location.reload()")
    pg.wait_for_timeout(1800)
    s = st(pg)
    check('F saved settings kept', s['city'] == 'tokyo' and s['tod'] == 'night' and s['clockMode'] == 'off' and not s['auto'] and not s['tour'], (s['city'], s['tod'], s['clockMode'], s['auto'], s['tour']))
    check('F console clean', not msgs, msgs)
    ctx.close()

    b.close()

print('\n' + ('ALL PASS' if not fails else 'FAILURES: ' + ', '.join(fails)))
