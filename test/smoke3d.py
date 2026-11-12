import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
_os.makedirs(ROOT + '/shots', exist_ok=True)
import json, sys
from playwright.sync_api import sync_playwright
APP = f'file://{ROOT}/DuckAir.html?debug'
OUT = f'{ROOT}/shots'
views = sys.argv[1].split(',') if len(sys.argv) > 1 else ['side', 'front', 'rear', '3d']
city = sys.argv[2] if len(sys.argv) > 2 else 'philadelphia'
tod = sys.argv[3] if len(sys.argv) > 3 else 'day'
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, device_scale_factor=1, timezone_id='America/New_York')
    pg = ctx.new_page(); msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    pg.add_init_script("localStorage.setItem('duckair.prefs.v1', JSON.stringify({seenHint:true, city:'%s', tod:'%s'}))" % (city, tod))
    pg.goto(APP); pg.wait_for_timeout(1200)
    for v in views:
        pg.evaluate("v => window.__duckair.setView(v, true)", v); pg.wait_for_timeout(2200)
        print(v, pg.evaluate("JSON.stringify({view: window.__duckair.state.view, ok: window.__duckair.V3.ok, why: window.__duckair.V3.why, tris: window.__duckair.V3.city && window.__duckair.V3.city.tris, cls: document.documentElement.className})"))
        pg.screenshot(path=f'{OUT}/v_{city}_{tod}_{v}.png')
    print('msgs', msgs[:8])
    b.close()
