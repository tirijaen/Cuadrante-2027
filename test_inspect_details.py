import json, datetime, calendar
from test_vac_fix import solver, x, workers, n_workers, total_days, dates, is_festivo_shift, monthly_days

SHIFTS = [0, 1, 2, 3]

print("=== VERIFICACIÓN REGLA 1 (Extra 1 primeras 2 semanas de junio) ===")
extra_idx = workers.index("Extra 1")
for d_idx, dt in enumerate(dates):
    if dt.month == 6 and 1 <= dt.day <= 14:
        s = [s for s in SHIFTS if solver.Value(x[extra_idx, d_idx, s]) == 1][0]
        code = {0: 'L', 1: 'M', 2: 'T', 3: 'N'}[s]
        if code != 'L':
            print(f"  {dt} ({dt.strftime('%a')}): Extra 1 hace {code}")

print("\n=== VERIFICACIÓN REGLA 4 (Máximo 7 noches por mes) ===")
max_n_month = 0
for w in range(n_workers):
    for m in range(1, 13):
        m_idxs = monthly_days[m]
        n_c = sum(solver.Value(x[w, d_idx, 3]) for d_idx in m_idxs)
        if n_c > max_n_month: max_n_month = n_c
print(f"Máximo de noches en un mes registrado: {max_n_month} (Límite: 7)")

print("\n=== VERIFICACIÓN REGLA 5 (Víspera de vacaciones sin noche) ===")
vac_starts = [
    ('Antonio J', [datetime.date(2027, 6, 1), datetime.date(2027, 8, 1)]),
    ('Miguel B',  [datetime.date(2027, 6, 1), datetime.date(2027, 8, 1)]),
    ('Paco C',    [datetime.date(2027, 6, 16), datetime.date(2027, 8, 16)]),
    ('Fran Espin',[datetime.date(2027, 6, 16), datetime.date(2027, 8, 16)]),
    ('A. Leon',   [datetime.date(2027, 7, 1), datetime.date(2027, 9, 1)]),
    ('Santi M',   [datetime.date(2027, 7, 16), datetime.date(2027, 9, 16)]),
    ('Alberto H', [datetime.date(2027, 7, 16), datetime.date(2027, 9, 16)]),
]
for w_name, dt_list in vac_starts:
    w_idx = workers.index(w_name)
    for v_dt in dt_list:
        db = v_dt - datetime.timedelta(days=1)
        d_idx = (db - dates[0]).days
        s = [s for s in SHIFTS if solver.Value(x[w_idx, d_idx, s]) == 1][0]
        code = {0: 'L', 1: 'M', 2: 'T', 3: 'N'}[s]
        print(f"  {w_name:10s} día antes de vac ({db}): turno {code}")

print("\n=== VERIFICACIÓN REGLA 6 (Días trabajados por mes) ===")
for m in range(1, 13):
    m_idxs = monthly_days[m]
    row = []
    for w in range(n_workers):
        tot = sum(1 - solver.Value(x[w, d_idx, 0]) for d_idx in m_idxs)
        row.append(f"{workers[w][:3]}:{tot:2d}")
    print(f"Mes {m:02d}: " + " | ".join(row))

print("\n=== BLOQUES DE NOCHE ===")
for w in range(n_workers):
    if workers[w] == 'Hilario': continue
    blocks = []
    curr = 0
    for d in range(total_days):
        if solver.Value(x[w, d, 3]) == 1:
            curr += 1
        else:
            if curr > 0:
                blocks.append(curr)
                curr = 0
    if curr > 0: blocks.append(curr)
    print(f"{workers[w]:12s}: {len(blocks)} bloques -> {blocks}")
