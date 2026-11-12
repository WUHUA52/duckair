import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
_os.makedirs(ROOT + '/shots', exist_ok=True)
import sys, json, time
from playwright.sync_api import sync_playwright
url = f'file://{ROOT}/DuckAir.html?debug'
OUT = f'{ROOT}/shots'
import os; os.makedirs(OUT, exist_ok=True)
def run(name, w, h, dpr, steps):
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        mobile = dpr > 1.5 and w < 900
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, has_touch=mobile, is_mobile=mobile)
        pg = ctx.new_page()
        msgs = []
        pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
        pg.goto(url)
        pg.wait_for_timeout(1200)
        for i, st in enumerate(steps):
            kind = st[0]
            if kind == 'shot': pg.screenshot(path=f'{OUT}/{name}_{st[1]}.png')
            elif kind == 'wait': pg.wait_for_timeout(st[1])
            elif kind == 'click': pg.mouse.click(st[1], st[2])
            elif kind == 'tap': pg.touchscreen.tap(st[1], st[2])
            elif kind == 'key': pg.keyboard.press(st[1])
            elif kind == 'sel': pg.click(st[1])
            elif kind == 'eval':
                r = pg.evaluate(st[1]); print(f'[{name}] eval {st[2] if len(st)>2 else ""}:', r)
        print(f'[{name}] console:', msgs if msgs else 'clean')
        b.close()
if __name__ == '__main__':
    which = sys.argv[1]
    exec(open(f'{ROOT}/test/{which}.py').read())
