"""Contact sheet of one city along its route.
   python3 test/cityshot.py <city> [tod=day] [wx=clear] [positions=auto|r1,r2,..] [WxH=960x540] [out]
   Each cell is the real app, paused at route position r (px of scroll), UI hidden.
   Add 'noplane' as a 7th argument to hide the plane."""
import sys, json, io, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(ROOT + '/shots', exist_ok=True)
from playwright.sync_api import sync_playwright
from PIL import Image
city = sys.argv[1]
tod = sys.argv[2] if len(sys.argv) > 2 else 'day'
wx = sys.argv[3] if len(sys.argv) > 3 else 'clear'
pos = sys.argv[4] if len(sys.argv) > 4 else 'auto'
size = sys.argv[5] if len(sys.argv) > 5 else '960x540'
out = sys.argv[6] if len(sys.argv) > 6 else f'{ROOT}/shots/city-{city}-{tod}-{wx}.png'
noplane = len(sys.argv) > 7
w, h = map(int, size.split('x'))
prefs = json.dumps({'seenHint': True, 'city': city, 'tod': tod, 'wx': wx, 'clockMode': 'off', 'auto': False, 'tour': False, 'view': 'side'})
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1).new_page(); msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    pg.add_init_script("if (window.name !== 'seeded') { window.name = 'seeded'; localStorage.setItem('duckair.prefs.v1', %s); }" % json.dumps(prefs))
    pg.goto('file://' + ROOT + '/DuckAir.html?debug'); pg.wait_for_timeout(1500)
    pg.add_style_tag(content='.ui{display:none !important}')
    vw = pg.evaluate('__duckair.view.VW'); route = pg.evaluate('__duckair.route')
    pg.evaluate("__duckair.world.paused = true; __duckair.state.paused = true;" + ("__duckair.plane.y = -900; __duckair.plane.ry = -900;" if noplane else ""))
    rs = [int(v) for v in pos.split(',')] if pos != 'auto' else list(range(vw // 2, route, int(vw * 0.9)))
    cells = []
    for r in rs:
        pg.evaluate(f"__duckair.seek({r})"); pg.wait_for_timeout(180)
        cells.append(Image.open(io.BytesIO(pg.screenshot())))
    cols = 3 if len(cells) > 4 else (2 if len(cells) > 1 else 1)
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w + (cols - 1) * 4, rows * h + (rows - 1) * 4), (20, 20, 24))
    for i, c in enumerate(cells): sheet.paste(c, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
    sheet.save(out)
    print(out, 'positions', rs, 'VW', vw, 'errors', msgs or 'none')
    b.close()
