import sys, asyncio
from playwright.sync_api import sync_playwright
url, out = sys.argv[1], sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1536
h = int(sys.argv[4]) if len(sys.argv) > 4 else 800
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': w, 'height': h})
    msgs = []
    pg.on('console', lambda m: msgs.append(m.type + ': ' + m.text))
    pg.on('pageerror', lambda e: msgs.append('PAGEERROR: ' + str(e)))
    pg.goto(url)
    pg.wait_for_timeout(600)
    print('title:', pg.title())
    for m in msgs: print(m)
    pg.screenshot(path=out, full_page=True)
    b.close()
