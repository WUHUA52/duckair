D = 'window.__duckair'
st = lambda tag: ('eval', f'JSON.stringify({{city:{D}.city, trans:{D}.trans.on, pending:{D}.trans.pending, tod:{D}.state.tod, wx:{D}.state.wx, xfade:{D}.crossfading, label:document.getElementById("tagCity").textContent}})', tag)
run('rob', 1280, 800, 1, [
  ('key', '2'), ('wait', 600), ('key', '3'), ('wait', 1400), st('during 2->3 (should retarget to paris before swap)'),
  ('key', '4'), ('wait', 200), st('pressed 4 after swap -> pending tokyo'),
  ('wait', 7000), st('after chained transitions'),
  ('shot', '01_tokyo'),
  ('key', 't'), ('wait', 700), ('key', 't'), ('wait', 600), ('key', 'w'), ('wait', 3200), st('interrupted crossfades settled'),
  ('shot', '02_tokyo_night_cloudy'),
  ('key', 'p'), ('key', '5'), ('wait', 1600), st('paused + city change mid'),
  ('wait', 3500), st('paused + city change done'),
  ('shot', '03_london_paused'),
  ('key', 'p'),
  ('eval', '(()=>{const c=document.getElementById("scene");const r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent("pointerdown",{clientX:640,clientY:790,bubbles:true,pointerId:3,pointerType:"mouse"}));return "clicked water"})()'),
  ('wait', 3000),
  ('eval', f'JSON.stringify({{home:[{D}.plane.homeX,{D}.plane.homeY], y:{D}.plane.y.toFixed(1), maxY:{D}.bounds.maxY, planeBottomCss:({D}.planeScreen()[1] + 34*{D}.view.S/{D}.view.dpr).toFixed(0), dockTop:document.getElementById("dock").getBoundingClientRect().top}})', 'clamped to flight area'),
  ('eval', '(()=>{const c=document.getElementById("scene");c.dispatchEvent(new PointerEvent("pointerdown",{clientX:5,clientY:5,bubbles:true,pointerId:4,pointerType:"mouse"}));return "clicked corner"})()'),
  ('wait', 3500),
  ('eval', f'JSON.stringify({{x:{D}.plane.x.toFixed(1), y:{D}.plane.y.toFixed(1), b:{D}.bounds}})', 'top-left clamp'),
  ('key', '1'), ('wait', 1000),
  ('eval', 'window.resizeTo ? "n/a" : "n/a"'),
  ('eval', f'(()=>{{return new Promise(res=>{{let n=0,t0=performance.now(),last=t0,worst=0;function f(t){{n++;worst=Math.max(worst,t-last);last=t;if(t-t0<4000)requestAnimationFrame(f);else res(JSON.stringify({{fps:(n/((t-t0)/1000)).toFixed(1),worstMs:worst.toFixed(1)}}))}}requestAnimationFrame(f)}})}})()', 'frame rate during/after transition (headless, software GL)'),
  st('end'),
])
