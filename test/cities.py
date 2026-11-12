D = 'window.__duckair'
def go(key, tod_presses, name):
    steps = [('key', key), ('wait', 4600)]
    for _ in range(tod_presses): steps += [('key', 't'), ('wait', 2700)]
    steps += [('shot', name)]
    return steps
run('city', 1280, 800, 1, [
  ('eval', 'localStorage.clear(), "cleared"'),
  *go('2', 1, '01_nyc_sunset'),
  *go('1', 1, '02_philly_night'),
  *go('4', 0, '03_tokyo_night'),
  ('key', 't'), ('wait', 2700), *go('5', 0, '04_london_day'),
  ('wait', 6000), ('shot', '05_london_day_later'),
])
