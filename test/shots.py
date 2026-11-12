"""Generic screenshot helper: python3 shots.py name WxH[@dpr] 'js to run' [prefs-json] [wait_ms]"""
import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
_os.makedirs(ROOT + '/shots', exist_ok=True)

import sys, json
from playwright.sync_api import sync_playwright
name, size, js = sys.argv[1], sys.argv[2], sys.argv[3]
prefs = sys.argv[4] if len(sys.argv) > 4 else '{"seenHint":true}'
wait = int(sys.argv[5]) if len(sys.argv) > 5 else 2000
dpr = 1
if '@' in size: size, d = size.split('@'); dpr = float(d)
w, h = map(int, size.split('x'))
mobile = w < 700 or h < 500
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, timezone_id='America/New_York', has_touch=mobile, is_mobile=mobile)
    pg = ctx.new_page(); msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    pg.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('duckair.prefs.v1', %s); }" % json.dumps(prefs))
    pg.goto(f'file://{ROOT}/DuckAir.html?debug'); pg.wait_for_timeout(1200)
    if js: print(pg.evaluate(js))
    pg.wait_for_timeout(wait)
    pg.screenshot(path=f'{ROOT}/shots/{name}.png')
    print('errors', msgs or 'none')
    b.close()
