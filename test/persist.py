D = 'window.__duckair'
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1200, 'height': 760})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(800)
    pg.keyboard.press('4'); pg.wait_for_timeout(300)
    pg.keyboard.press('t'); pg.keyboard.press('t'); pg.keyboard.press('w'); pg.keyboard.press(']')
    pg.wait_for_timeout(5000)
    print('before reload:', pg.evaluate(f'JSON.stringify({{city:{D}.city, tod:{D}.state.tod, wx:{D}.state.wx, speed:{D}.state.speed, ls: localStorage.getItem("duckair.prefs.v1")}})'))
    pg.reload(); pg.wait_for_timeout(1500)
    print('after reload:', pg.evaluate(f'JSON.stringify({{city:{D}.city, tod:{D}.state.tod, wx:{D}.state.wx, speed:{D}.state.speed, label:document.getElementById("tagCity").textContent, seg:[...document.querySelectorAll("#todSeg [aria-checked=true]")].map(b=>b.dataset.v)}})'))
    print('errors:', errs or 'none')
    ctx2 = b.new_context(viewport={'width': 1200, 'height': 760}, reduced_motion='reduce')
    pg2 = ctx2.new_page(); errs2 = []
    pg2.on('pageerror', lambda e: errs2.append(str(e)))
    pg2.goto(url); pg2.wait_for_timeout(2500)
    print('reduced motion:', pg2.evaluate(f'JSON.stringify({{speed:{D}.state.speed}})'), 'errors:', errs2 or 'none')
    b.close()
