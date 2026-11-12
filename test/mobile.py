D = 'window.__duckair'
run('mob', 390, 844, 3, [
  ('wait', 4600), ('shot', '01_portrait'),
  ('eval', f'JSON.stringify({{dock: document.getElementById("dock").getBoundingClientRect().toJSON(), docW: document.documentElement.scrollWidth, bounds:{D}.bounds, home:[{D}.plane.homeX,{D}.plane.homeY]}})', 'layout'),
  ('tap', 60, 776), ('wait', 400), ('shot', '02_menu'),
  ('eval', 'JSON.stringify(document.getElementById("cityMenu").getBoundingClientRect().toJSON())', 'menu rect'),
  ('tap', 150, 700), ('wait', 600),
])
run('mob320', 320, 568, 2, [('wait', 4600), ('shot', '01'), ('eval', 'JSON.stringify({dock: document.getElementById("dock").getBoundingClientRect().toJSON(), docW: document.documentElement.scrollWidth})', 'layout')])
run('land', 844, 390, 3, [('wait', 4600), ('shot', '01'), ('eval', f'JSON.stringify({{dock: document.getElementById("dock").getBoundingClientRect().toJSON(), bounds:{D}.bounds, VH:{D}.view.VH, S:{D}.view.S}})', 'layout')])
run('tab', 768, 1024, 2, [('wait', 4600), ('shot', '01'), ('eval', 'JSON.stringify({dock: document.getElementById("dock").getBoundingClientRect().toJSON()})', 'layout')])
