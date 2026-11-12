D = 'window.__duckair'
run('gal', 1920, 1080, 1, [
  ('eval', 'localStorage.clear(), "c"'),
  ('eval', f'(()=>{{window.__home=[{D}.plane.homeX,{D}.plane.homeY]; return "ok"}})()'),
  ('sel', '#cityBtn'), ('wait', 200), ('key', 'Escape'),
  ('sel', '#todSeg [data-v="sunset"]'), ('sel', '#wxSeg [data-v="cloudy"]'), ('sel', '#helpBtn'), ('sel', '#helpClose'),
  ('sel', '#pauseBtn'), ('sel', '#pauseBtn'), ('sel', '#speed'),
  ('eval', f'JSON.stringify({{homeBefore:window.__home, homeAfter:[{D}.plane.homeX,{D}.plane.homeY]}})', 'UI clicks never steer'),
  ('wait', 3500), ('shot', '01_philly_sunset_cloudy'),
  ('sel', '#wxSeg [data-v="rain"]'), ('key', '4'), ('wait', 5200), ('shot', '02_tokyo_sunset_rain'),
  ('key', '2'), ('sel', '#todSeg [data-v="night"]'), ('sel', '#wxSeg [data-v="clear"]'), ('wait', 5200), ('shot', '03_nyc_night'),
])
