import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
_os.makedirs(ROOT + '/shots', exist_ok=True)
import sys, json
from playwright.sync_api import sync_playwright
url = f'file://{ROOT}/DuckAir.html'
out = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/shots/app.png'
w = int(sys.argv[2]) if len(sys.argv) > 2 else 1440
h = int(sys.argv[3]) if len(sys.argv) > 3 else 900
dpr = float(sys.argv[4]) if len(sys.argv) > 4 else 1
wait = int(sys.argv[5]) if len(sys.argv) > 5 else 1500
script = sys.argv[6] if len(sys.argv) > 6 else ''
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, has_touch=dpr > 1.5, is_mobile=dpr > 1.5)
    pg = ctx.new_page()
    msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text))
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    pg.goto(url)
    pg.wait_for_timeout(wait)
    if script:
        r = pg.evaluate(script)
        if r is not None: print('eval:', r)
        pg.wait_for_timeout(int(sys.argv[7]) if len(sys.argv) > 7 else 800)
    pg.screenshot(path=out)
    for m in msgs: print(m)
    b.close()
