D = 'window.__duckair'
run('reg320', 320, 568, 2, [
  ('eval', 'localStorage.setItem("duckair.prefs.v1", JSON.stringify({clock:true, seenHint:true})), location.reload(), "r"'), ('wait', 2000),
  ('eval', 'JSON.stringify({dockH: document.getElementById("dock").getBoundingClientRect().height, docW: document.documentElement.scrollWidth})', '320 dock'),
  ('sel', '#hideBtn'), ('wait', 700),
  ('eval', 'JSON.stringify({toast: document.getElementById("toast").getBoundingClientRect().bottom, show: document.getElementById("showBtn").getBoundingClientRect().top, text: document.getElementById("toast").textContent})', 'toast clears show button'),
  ('shot', 'hidden'),
])
