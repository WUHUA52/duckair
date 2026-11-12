"""Tour (city rotation) and Match sky to clock (#skySwitch) in an ordinary browser window."""
import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
_os.makedirs(ROOT + '/shots', exist_ok=True)

import json, datetime
from playwright.sync_api import sync_playwright

APP = f'file://{ROOT}/DuckAir.html?debug'
OUT = f'{ROOT}/shots'
D = 'window.__duckair'
fails = []

def check(name, cond, info=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' :: ' + str(info)) if info != '' else ''))
    if not cond: fails.append(name)

def ev(pg, js):
    return json.loads(pg.evaluate(f'JSON.stringify({js})'))

S = f"""{{ city: {D}.city, stateCity: {D}.state.city, tour: {D}.state.tour, trans: {D}.trans.on, tourAt: {D}.tourAt, t: {D}.world.t,
  aria: document.getElementById('cityBtn').getAttribute('aria-label'), title: document.getElementById('cityBtn').title,
  toast: document.getElementById('toast').classList.contains('is-on') ? document.getElementById('toast').textContent : '',
  tod: {D}.state.tod, auto: {D}.state.auto, sw: document.getElementById('skySwitch').getAttribute('aria-checked'), todChecked: (document.querySelector('#todSeg [aria-checked=true]') || {{}}).dataset.v, xfade: {D}.crossfading }}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, timezone_id='America/New_York')
    pg = ctx.new_page(); msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    pg.clock.set_fixed_time(datetime.datetime(2026, 10, 22, 12, 0, tzinfo=datetime.timezone(datetime.timedelta(hours=-4))))
    pg.goto(APP); pg.wait_for_timeout(1200)

    # ---------- Tour ----------
    s = ev(pg, S)
    check('tour off by default in a browser', not s['tour'] and s['city'] == 'philadelphia', s)
    pg.keyboard.press('6'); pg.wait_for_timeout(300)
    s = ev(pg, S)
    check('6 starts the tour and heads to the next city', s['tour'] and s['stateCity'] == 'nyc' and s['trans'], s)
    check('tour toast', 'Touring all five' in s['toast'], s['toast'])
    check('city button says touring', 'touring' in (s['aria'] or '') and 'Touring' in s['title'], (s['aria'], s['title']))
    check('next hop scheduled about 5 min out', abs(s['tourAt'] - s['t'] - 300) < 2, s['tourAt'] - s['t'])
    pg.wait_for_timeout(4500)
    s = ev(pg, S)
    check('arrived in New York', s['city'] == 'nyc' and not s['trans'], s)
    pg.keyboard.press('6'); pg.wait_for_timeout(200)
    s = ev(pg, S)
    check('6 again reports time to the next city', 'next city in about 5 min' in s['toast'], s['toast'])
    # pause: no hop while paused even when due
    pg.keyboard.press('p'); pg.wait_for_timeout(200)
    pg.evaluate(f'{D}.world.t = {D}.tourAt + 1')
    pg.wait_for_timeout(600)
    s = ev(pg, S)
    check('no hop while paused', s['city'] == 'nyc' and not s['trans'], s)
    pg.keyboard.press('p'); pg.wait_for_timeout(300)
    s = ev(pg, S)
    check('hop when due after resuming', s['stateCity'] == 'paris' and s['trans'], s)
    pg.wait_for_timeout(4500)
    s = ev(pg, S)
    check('arrived in Paris, next hop rescheduled', s['city'] == 'paris' and s['tourAt'] - s['t'] > 290, s)
    # menu state and keyboard
    pg.click('#cityBtn'); pg.wait_for_timeout(250)
    m = ev(pg, "{ sel: [...document.querySelectorAll('#cityMenu li')].filter(li => li.getAttribute('aria-selected') === 'true').map(li => li.dataset.city), now: [...document.querySelectorAll('#cityMenu li.is-now')].map(li => li.dataset.city), active: document.getElementById('cityMenu').getAttribute('aria-activedescendant') }")
    check('menu: Tour selected, Paris marked now, Tour active', m['sel'] == ['tour'] and m['now'] == ['paris'] and m['active'] == 'opt-tour', m)
    pg.keyboard.press('Home'); a1 = pg.evaluate("document.getElementById('cityMenu').getAttribute('aria-activedescendant')")
    pg.keyboard.press('ArrowUp'); a2 = pg.evaluate("document.getElementById('cityMenu').getAttribute('aria-activedescendant')")
    pg.keyboard.press('ArrowUp'); a3 = pg.evaluate("document.getElementById('cityMenu').getAttribute('aria-activedescendant')")
    check('menu keys wrap through all six', (a1, a2, a3) == ('opt-philadelphia', 'opt-tour', 'opt-london'), (a1, a2, a3))
    pg.screenshot(path=f'{OUT}/tour_menu.png')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    # picking the current city stops the tour and stays
    pg.keyboard.press('3'); pg.wait_for_timeout(200)
    s = ev(pg, S)
    check('choosing the current city stops the tour', not s['tour'] and s['city'] == 'paris' and not s['trans'] and 'Staying over Paris' in s['toast'], s)
    check('city button back to normal', 'touring' not in (s['aria'] or ''), s['aria'])
    pg.evaluate(f'{D}.world.t = {D}.tourAt + 10'); pg.wait_for_timeout(500)
    s = ev(pg, S)
    check('no hops once the tour is off', s['city'] == 'paris' and not s['trans'], s)
    # tour, then pick a different city from the menu
    pg.keyboard.press('6'); pg.wait_for_timeout(200)
    pg.click('#cityBtn'); pg.wait_for_timeout(200)
    pg.click('#opt-philadelphia'); pg.wait_for_timeout(300)
    s = ev(pg, S)
    check('menu pick ends the tour and flies there', not s['tour'] and s['stateCity'] == 'philadelphia', s)
    pg.wait_for_timeout(4800)

    # ---------- Auto sky ----------
    s = ev(pg, S)
    check('noon starts as day', s['tod'] == 'day' and not s['auto'], s)
    pg.click('#clockBtn'); pg.wait_for_timeout(250)
    pg.click('#skySwitch'); pg.wait_for_timeout(300)
    s = ev(pg, S)
    check('Match sky on, day at noon', s['auto'] and s['sw'] == 'true' and s['tod'] == 'day' and s['todChecked'] == 'day' and s['tod'] == pg.evaluate(f'{D}.skyNow()'), s)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.clock.set_fixed_time(datetime.datetime(2026, 10, 22, 18, 30, tzinfo=datetime.timezone(datetime.timedelta(hours=-4))))
    pg.wait_for_timeout(21500)
    s = ev(pg, S)
    check('6:30 PM turns to sunset on its own', s['tod'] == 'sunset' and s['auto'] and s['todChecked'] == 'sunset', s)
    pg.clock.set_fixed_time(datetime.datetime(2026, 10, 22, 20, 0, tzinfo=datetime.timezone(datetime.timedelta(hours=-4))))
    pg.wait_for_timeout(21000)
    s = ev(pg, S)
    check('8 PM turns to night', s['tod'] == 'night', s)
    pg.screenshot(path=f'{OUT}/auto_night.png')
    # T cycles the four manual options and switches Match sky off
    seq = []
    for _ in range(4):
        pg.keyboard.press('t'); pg.wait_for_timeout(150)
        s = ev(pg, S); seq.append(s['todChecked'])
    check('T cycles through all four', seq == ['morning', 'day', 'sunset', 'night'], seq)
    check('T turned Match sky off', not s['auto'] and s['sw'] == 'false', s)
    # arrow keys inside the radio group
    pg.focus('#todSeg [data-v=night]'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(150)
    s = ev(pg, S)
    check('arrow keys wrap from Night to Morning', s['todChecked'] == 'morning' and not s['auto'], s)
    # persistence of tour + match sky
    pg.evaluate('document.activeElement.blur()')
    pg.click('#clockBtn'); pg.wait_for_timeout(250); pg.click('#skySwitch'); pg.wait_for_timeout(300)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    s = ev(pg, S)
    check('Match sky back on, night at 8 PM', s['auto'] and s['tod'] == 'night', s)
    pg.keyboard.press('6'); pg.wait_for_timeout(600)
    pg.reload(); pg.wait_for_timeout(1500)
    s = ev(pg, S)
    check('tour and match sky restored after reload', s['tour'] and s['auto'] and s['todChecked'] == 'night' and s['tod'] == 'night', s)
    check('restored tour waits a full interval', abs(s['tourAt'] - 300) < 1, s['tourAt'])
    check('console clean', not msgs, msgs)
    b.close()

print('\n' + ('ALL PASS' if not fails else 'FAILURES: ' + ', '.join(fails)))
