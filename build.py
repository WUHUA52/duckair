import re, pathlib, zipfile
root = pathlib.Path(__file__).parent
order = ['core.js','look.js','kit.js','city-philly.js','city-nyc.js','city-paris.js','city-tokyo.js','city-london.js','plane.js','gl.js','model3d.js','city3d.js','city3d-philly.js','city3d-nyc.js','city3d-paris.js','city3d-tokyo.js','city3d-london.js','clockface.js','scene.js','view3d.js','audio.js','app.js']
parts = []
for f in order:
    src = (root/'src'/f).read_text()
    src = src.replace("'use strict';\n", '', 1) if f == 'core.js' else src
    parts.append(src.rstrip() + '\n')
js = "(() => {\n'use strict';\n" + '\n'.join(parts) + "})();"
(root/'build').mkdir(exist_ok=True)
(root/'build'/'app.js').write_text(js)
shell = (root/'src'/'shell.html').read_text()
html = shell.replace('/*__SCRIPT__*/', js)
(root/'DuckAir.html').write_text(html)
(root/'index.html').write_text(html)   # the page GitHub Pages serves
# Artifact variant: the publisher supplies doctype/html/head/body and a viewport meta.
a = html
a = re.sub(r'<!DOCTYPE html>\s*', '', a, count=1)
a = re.sub(r'<html[^>]*>\s*', '', a, count=1)
a = re.sub(r'\s*</html>\s*$', '\n', a)
a = re.sub(r'<head>\s*', '', a, count=1)
a = re.sub(r'\s*</head>\s*', '\n', a, count=1)
a = re.sub(r'<body>\s*', '', a, count=1)
a = re.sub(r'\s*</body>', '', a, count=1)
a = re.sub(r'<meta charset="utf-8">\s*', '', a, count=1)
a = re.sub(r'<meta name="viewport"[^>]*>\s*', '', a, count=1)
(root/'build'/'duckair-artifact.html').write_text(a)
print('DuckAir.html', len(html)//1024, 'KB; js lines', js.count('\n'))

# Wallpaper copy for Plash: a folder with index.html that starts in wallpaper mode.
README = """DuckAir Wallpaper · by WUHUA

Make DuckAir your Mac wallpaper
1. Move this "DuckAir Wallpaper" folder somewhere it can stay, like Documents.
2. Install Plash, a free app from the Mac App Store.
3. Click the Plash icon in the menu bar and choose "Add Website…".
4. Click "Local Website…", choose this "DuckAir Wallpaper" folder, then add it.

Use the controls
- Choose "Browsing Mode" from the Plash menu bar icon. The DuckAir controls appear:
  steer the plane, tap the ducks, pick a city, the sky, weather, speed and sound.
- Choose "Browsing Mode" again when you are done. The controls tuck away and your
  desktop works as usual.

The first time it runs, the wallpaper shows a clock, matches the sky to that clock
(morning, day, sunset or night, via "Match sky to clock" in the Clock options) and
tours all five cities, a new one every 5 minutes. Change any of it in
Browsing Mode; your choices are remembered.

Tips
- Plash settings has "Deactivate while on battery" to save power on a laptop.
- To flip Browsing Mode with a keyboard shortcut, make a shortcut in the Shortcuts
  app with a "Run Shell Script" action containing:  open -g plash:toggle-browsing-mode
- You can also open index.html in any web browser to fly DuckAir in a window.
"""
wp_html = html.replace('<title>DuckAir</title>', '<title>DuckAir Wallpaper</title>', 1)
assert wp_html.count('<script>\n') == 1
wp_html = wp_html.replace('<script>\n', '<script>window.DUCKAIR_WALLPAPER = true;</script>\n<script>\n', 1)
wpdir = root/'build'/'DuckAir Wallpaper'
wpdir.mkdir(parents=True, exist_ok=True)
(wpdir/'index.html').write_text(wp_html)
(wpdir/'Read me.txt').write_text(README)
with zipfile.ZipFile(root/'DuckAir-Wallpaper.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for name in ['index.html', 'Read me.txt']:
        z.write(wpdir/name, 'DuckAir Wallpaper/' + name)
print('DuckAir-Wallpaper.zip', (root/'DuckAir-Wallpaper.zip').stat().st_size // 1024, 'KB')
