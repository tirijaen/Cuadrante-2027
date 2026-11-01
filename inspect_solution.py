import datetime, calendar
from solve_cuadrante import solver, x, workers, n_workers, total_days, dates, SHIFTS, is_festivo_shift

print("=== MONTHLY BREAKDOWN ===")
monthly_data = {w: {} for w in range(n_workers)}
for m in range(1, 13):
    m_days = [d_idx for d_idx, dt in enumerate(dates) if dt.month == m]
    print(f"\n--- MES {m:02d} ({calendar.month_name[m]}) ---")
    print(f"{'Trabajador':12s} | {'Dias':4s} | {'M':2s} {'T':2s} {'N':2s} | {'Fest':4s}")
    print("-" * 35)
    for w in range(n_workers):
        w_name = workers[w]
        tot = sum(1 - solver.Value(x[w, d, 0]) for d in m_days)
        m_c = sum(solver.Value(x[w, d, 1]) for d in m_days)
        t_c = sum(solver.Value(x[w, d, 2]) for d in m_days)
        n_c = sum(solver.Value(x[w, d, 3]) for d in m_days)
        f_c = sum(solver.Value(x[w, d, s]) for d in m_days for s in [1, 2, 3] if is_festivo_shift(dates[d], s))
        monthly_data[w][m] = (tot, m_c, t_c, n_c, f_c)
        print(f"{w_name:12s} | {tot:4d} | {m_c:2d} {t_c:2d} {n_c:2d} | {f_c:4d}")

# Check night blocks
print("\n=== NIGHT BLOCKS DISTRIBUTION ===")
for w in range(n_workers):
    if workers[w] == 'Hilario':
        continue
    blocks = []
    curr = 0
    for d in range(total_days):
        if solver.Value(x[w, d, 3]) == 1:
            curr += 1
        else:
            if curr > 0:
                blocks.append(curr)
                curr = 0
    if curr > 0:
        blocks.append(curr)
    print(f"{workers[w]:12s}: {len(blocks)} bloques -> {blocks}")

# Check rests after nights:
print("\n=== REST AFTER NIGHTS ===")
for w in range(n_workers):
    if workers[w] == 'Hilario':
        continue
    bad_rests = 0
    for d in range(total_days - 2):
        if solver.Value(x[w, d, 3]) == 1 and solver.Value(x[w, d+1, 3]) == 0:
            # End of night block. Check d+1 and d+2
            r1 = solver.Value(x[w, d+1, 0])
            r2 = solver.Value(x[w, d+2, 0])
            s2 = 1 if solver.Value(x[w, d+2, 1]) == 1 else (2 if solver.Value(x[w, d+2, 2]) == 1 else 0)
            if r1 != 1:
                print(f"ERROR: {workers[w]} works immediately after night on day {dates[d+1]}!")
            elif r2 != 1 and s2 == 1: # only 1 rest and starts with M!
                bad_rests += 1
                # print(f"Suboptimal: {workers[w]} only 1 rest and starts M on {dates[d+2]}")
    print(f"{workers[w]:12s}: 1-rest followed by M = {bad_rests}")
