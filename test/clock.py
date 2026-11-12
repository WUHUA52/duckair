D = 'window.__duckair'
q = lambda tag: ('eval', f'JSON.stringify({{mode:{D}.state.clockMode, h12:{D}.state.h12, hidden:document.getElementById("clock").hidden, pressed:document.getElementById("clockBtn").getAttribute("aria-pressed"), ampm:document.getElementById("clockAmpm").textContent, date:document.getElementById("clockDate").textContent, city:document.getElementById("clockCity").textContent, label:document.getElementById("clock").getAttribute("aria-label")}})', tag)
run('clk', 1440, 900, 1, [
  ('eval', 'localStorage.clear(), "c"'),
  ('key', 'c'), ('wait', 400), q('C: corner clock on'),
  ('shot', '01_desktop_clock'),
  ('key', '3'), ('wait', 4800), q('after switching to Paris'),
  ('sel', '#clock'), ('wait', 300), q('24h'),
  ('shot', '02_paris_24h'),
  ('key', 'h'), ('wait', 800), ('shot', '03_hidden_with_clock'),
  ('eval', 'JSON.stringify({clockVisible: getComputedStyle(document.getElementById("clock")).visibility, top: document.getElementById("clock").getBoundingClientRect().top})', 'clock in ambient mode'),
  ('key', 'h'), ('key', 'c'), ('wait', 300), q('C: background'), ('key', 'c'), ('wait', 300), q('C: off'),
  ('key', 'c'), ('wait', 300), q('C: corner again'),
])
run('clkm', 390, 844, 3, [
  ('eval', 'localStorage.setItem("duckair.prefs.v1", JSON.stringify({clock:true, h12:true, seenHint:true})), location.reload(), "r"'),
  ('wait', 2500), q('mobile clock restored from prefs'),
  ('eval', 'JSON.stringify({clock: document.getElementById("clock").getBoundingClientRect().toJSON(), tag: document.getElementById("tag").getBoundingClientRect().toJSON(), dock: document.getElementById("dock").getBoundingClientRect().toJSON(), docW: document.documentElement.scrollWidth})', 'mobile rects'),
  ('shot', '01_mobile_clock'),
  ('sel', '#hideBtn'), ('wait', 800), ('shot', '02_mobile_hidden'),
])
run('clkl', 844, 390, 3, [
  ('eval', 'localStorage.setItem("duckair.prefs.v1", JSON.stringify({clock:true, seenHint:true})), location.reload(), "r"'),
  ('wait', 2500),
  ('eval', 'JSON.stringify({clock: document.getElementById("clock").getBoundingClientRect().toJSON(), tag: document.getElementById("tag").getBoundingClientRect().toJSON(), dockH: document.getElementById("dock").getBoundingClientRect().height})', 'landscape rects'),
  ('shot', '01_landscape_clock'),
])
run('clks', 320, 568, 2, [
  ('eval', 'localStorage.setItem("duckair.prefs.v1", JSON.stringify({clock:true, seenHint:true})), location.reload(), "r"'),
  ('wait', 2000),
  ('eval', 'JSON.stringify({dock: document.getElementById("dock").getBoundingClientRect().toJSON(), docW: document.documentElement.scrollWidth})', 'small phone'),
])
