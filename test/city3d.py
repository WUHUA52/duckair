"""3D check for one city: front / rear / orbit views at several places along the river.
   python3 test/city3d.py <city> [tod=day] [positions=600,1200,1800]   (positions are 3D x, 0..2400)
   Writes shots/city3d-<city>-<tod>.png (rows = positions, columns = front, rear, 3d)."""
import sys, json, io, os
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(ROOT + '/shots', exist_ok=True)
city = sys.argv[1]; tod = sys.argv[2] if len(sys.argv) > 2 else 'day'
pos = [int(v) for v in (sys.argv[3] if len(sys.argv) > 3 else '600,1200,1800').split(',')]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={'width': 960, 'height': 540}, device_scale_factor=1).new_page(); msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    prefs = json.dumps({'seenHint': True, 'city': city, 'tod': tod, 'wx': 'clear', 'clockMode': 'off', 'auto': False, 'tour': False, 'view': 'side'})
    pg.add_init_script("if (window.name !== 'seeded') { window.name = 'seeded'; localStorage.setItem('duckair.prefs.v1', %s); }" % json.dumps(prefs))
    pg.goto('file://' + ROOT + '/DuckAir.html?debug'); pg.wait_for_timeout(1500)
    pg.add_style_tag(content='.ui{display:none !important}')
    cells = []
    for x in pos:
        for v in ['front', 'rear', '3d']:
            pg.evaluate(f"__duckair.setView('{v}', false, true); __duckair.V3.scroll = {x};")
            pg.wait_for_timeout(700)
            cells.append(Image.open(io.BytesIO(pg.screenshot())))
    w, h = cells[0].size
    sheet = Image.new('RGB', (3 * w + 8, len(pos) * h + (len(pos) - 1) * 4), (20, 20, 24))
    for i, c in enumerate(cells): sheet.paste(c, ((i % 3) * (w + 4), (i // 3) * (h + 4)))
    sheet = sheet.resize((sheet.width * 2 // 3, sheet.height * 2 // 3))
    out = f'{ROOT}/shots/city3d-{city}-{tod}.png'; sheet.save(out)
    print(out, 'tris', pg.evaluate('__duckair.V3.city && __duckair.V3.city.tris'), 'marks', pg.evaluate('__duckair.V3.city.marks.map(m => m.name + "@" + Math.round(m.x)).join(", ")'), 'errors', msgs or 'none')
    b.close()
