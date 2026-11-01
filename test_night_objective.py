import datetime, calendar
from ortools.sat.python import cp_model
from test_vac_fix import model, x, workers, n_workers, total_days, dates, is_festivo_shift

# Let's add penalties for 2-night and 4-night blocks to favor 3-night blocks:
pen_night_len = []
for w in range(n_workers):
    if workers[w] != 'Hilario':
        for d in range(total_days - 1):
            is_start = model.NewBoolVar(f"start_{w}_{d}")
            if d == 0:
                model.Add(is_start == x[w, d, 3])
            else:
                model.Add(is_start <= x[w, d, 3])
                model.Add(is_start <= x[w, d-1, 3].Not())
                model.Add(is_start >= x[w, d, 3] - x[w, d-1, 3])
            
            # Penalize length == 2: is_start and x[d+1]==1 and x[d+2]==0
            if d < total_days - 2:
                p2 = model.NewBoolVar(f"p2_{w}_{d}")
                model.AddBoolAnd([is_start, x[w, d+1, 3], x[w, d+2, 3].Not()]).OnlyEnforceIf(p2)
                model.AddBoolOr([is_start.Not(), x[w, d+1, 3].Not(), x[w, d+2, 3]]).OnlyEnforceIf(p2.Not())
                pen_night_len.append(p2)
            
            # Penalize length == 4: is_start and x[d+1]==1 and x[d+2]==1 and x[d+3]==1
            if d < total_days - 3:
                p4 = model.NewBoolVar(f"p4_{w}_{d}")
                model.AddBoolAnd([is_start, x[w, d+1, 3], x[w, d+2, 3], x[w, d+3, 3]]).OnlyEnforceIf(p4)
                model.AddBoolOr([is_start.Not(), x[w, d+1, 3].Not(), x[w, d+2, 3].Not(), x[w, d+3, 3].Not()]).OnlyEnforceIf(p4.Not())
                pen_night_len.append(p4)

model.Minimize(sum(pen_night_len))

print("Solving with 3-night preference...")
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 30.0
solver.parameters.num_workers = 8
status = solver.Solve(model)

print(f"Status: {solver.StatusName(status)}")
if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
    print("Found solution!")
    for w in range(n_workers):
        tot = sum(1 - solver.Value(x[w, d, 0]) for d in range(total_days))
        m_cnt = sum(solver.Value(x[w, d, 1]) for d in range(total_days))
        t_cnt = sum(solver.Value(x[w, d, 2]) for d in range(total_days))
        n_cnt = sum(solver.Value(x[w, d, 3]) for d in range(total_days))
        f_cnt = sum(solver.Value(x[w, d, s]) for d in range(total_days) for s in [1, 2, 3] if is_festivo_shift(dates[d], s))
        print(f"{workers[w]:12s}: Total={tot:3d} | M={m_cnt:3d}, T={t_cnt:3d}, N={n_cnt:3d} | Festivos={f_cnt:2d}")
    
    print("\n--- BLOQUES DE NOCHE ---")
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
