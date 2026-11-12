D = 'window.__duckair'
def duck_click(i):
    return ('eval', f'(()=>{{const [x,y]={D}.duckScreen({i}); const el=document.elementFromPoint(x,y); const r=el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent("pointerdown",{{clientX:x,clientY:y,bubbles:true,pointerId:7,pointerType:"mouse",isPrimary:true}})); return el.id + " wave=" + {D}.DUCKS[{i}].wave.toFixed(2)}})()', f'click duck {i}')
run('desk', 1440, 900, 1, [
  duck_click(0), duck_click(2), ('wait', 250), ('shot', '02_wave'),
  ('eval', f'{D}.plane.homeX', 'homeX unchanged by duck click'),
  ('sel', '#cityBtn'), ('wait', 300), ('shot', '03_menu'),
  ('eval', 'JSON.stringify({expanded: document.getElementById("cityBtn").getAttribute("aria-expanded"), menuHidden: document.getElementById("cityMenu").hidden, focus: document.activeElement.id})', 'menu open'),
  ('sel', '#opt-paris'), ('wait', 1300), ('shot', '04_trans_mid'),
  ('eval', f'JSON.stringify({{on:{D}.trans.on, swapped:{D}.trans.swapped, city:{D}.city}})', 'mid transition'),
  ('wait', 3200), ('shot', '05_paris'),
  ('eval', f'JSON.stringify({{on:{D}.trans.on, city:{D}.city, label: document.getElementById("tagCity").textContent, btn: document.getElementById("cityBtnLabel").textContent}})', 'after transition'),
  ('key', 't'), ('wait', 2700), ('shot', '06_paris_sunset'),
  ('key', 't'), ('wait', 2700), ('shot', '07_paris_night'),
  ('eval', f'JSON.stringify({{tod:{D}.state.tod, crossfading:{D}.crossfading, E:{D}.cur.E.toFixed(2)}})', 'night'),
  ('key', 'w'), ('wait', 2800), ('shot', '08_paris_night_cloudy'),
  ('key', 'w'), ('wait', 3000), ('shot', '09_paris_night_rain'),
  ('eval', f'JSON.stringify({{wx:{D}.state.wx, rain:{D}.cur.rain.toFixed(2)}})', 'rain'),
])
