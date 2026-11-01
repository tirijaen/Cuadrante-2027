import datetime, calendar, json
from ortools.sat.python import cp_model

holidays = {
    datetime.date(2027, 1, 1), datetime.date(2027, 1, 6), datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25), datetime.date(2027, 3, 26), datetime.date(2027, 4, 23),
    datetime.date(2027, 4, 26), datetime.date(2027, 5, 1), datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6), datetime.date(2027, 10, 12), datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6), datetime.date(2027, 12, 8), datetime.date(2027, 12, 25),
}

workers = [
    "Antonio J", "Santi M", "Alberto H", "Fran Espin",
    "Miguel B", "Paco C", "A. Leon", "Hilario", "Extra 1"
]
n_workers = len(workers)
w_map = {name: i for i, name in enumerate(workers)}

start_date = datetime.date(2027, 1, 1)
end_date = datetime.date(2027, 12, 31)
total_days = (end_date - start_date).days + 1
dates = [start_date + datetime.timedelta(days=i) for i in range(total_days)]

def is_festivo_shift(d, s):
    if s == 0: return False
    wd = d.weekday()
    is_hol = d in holidays
    if is_hol and s in [1, 2]: return True
    if wd == 4 and s == 3: return True
    if wd == 5: return True
    if wd == 6 and s in [1, 2]: return True
    return False

def build_investigation_model(gap_days=7):
    model = cp_model.CpModel()
    x = {}
    for w in range(n_workers):
        for d in range(total_days):
            for s in [0, 1, 2, 3]:
                x[w, d, s] = model.NewBoolVar(f"x_{w}_{d}_{s}")
            model.Add(sum(x[w, d, s] for s in [0, 1, 2, 3]) == 1)

    # Vacations & Day before
    vacation_periods = [
        ("Antonio J", [(6, 1, 15), (8, 1, 15)]),
        ("Miguel B",  [(6, 1, 15), (8, 1, 15)]),
        ("Paco C",    [(6, 16, 30), (8, 16, 31)]),
        ("Fran Espin",[(6, 16, 30), (8, 16, 31)]),
        ("A. Leon",   [(7, 1, 15), (9, 1, 15)]),
        ("Hilario",   [(7, 1, 15), (9, 1, 15)]),
        ("Santi M",   [(7, 16, 31), (9, 16, 30)]),
        ("Alberto H", [(7, 16, 31), (9, 16, 30)]),
    ]
    for w_name, periods in vacation_periods:
        w_idx = w_map[w_name]
        for (m, s_day, e_day) in periods:
            for d_idx, dt in enumerate(dates):
                if dt.month == m and s_day <= dt.day <= e_day:
                    model.Add(x[w_idx, d_idx, 0] == 1)
            vac_start = datetime.date(2027, m, s_day)
            day_before = vac_start - datetime.timedelta(days=1)
            if day_before >= start_date:
                db_idx = (day_before - start_date).days
                model.Add(x[w_idx, db_idx, 3] == 0)

    # Extra 1
    for d_idx, dt in enumerate(dates):
        if dt.month not in [6, 7, 8, 9]:
            model.Add(x[w_map["Extra 1"], d_idx, 0] == 1)
        if dt.month == 6 and 1 <= dt.day <= 14:
            model.Add(x[w_map["Extra 1"], d_idx, 3] == 0)
            wd = dt.weekday()
            if wd in [5, 6] or (dt in holidays):
                model.Add(x[w_map["Extra 1"], d_idx, 0] == 1)

    # Hilario
    for d_idx, dt in enumerate(dates):
        model.Add(x[w_map["Hilario"], d_idx, 3] == 0)
        wd = dt.weekday()
        if wd in [5, 6] or (dt in holidays):
            model.Add(x[w_map["Hilario"], d_idx, 0] == 1)

    # Rest >= 12h
    for w in range(n_workers):
        for d in range(total_days - 1):
            model.Add(x[w, d, 2] + x[w, d+1, 1] <= 1)
            model.Add(x[w, d, 3] + x[w, d+1, 1] <= 1)
            model.Add(x[w, d, 3] + x[w, d+1, 2] <= 1)

    # 2 DAYS OF REST AFTER NIGHT BLOCK (HARD CONSTRAINT)
    for w in range(n_workers):
        if workers[w] == "Hilario": continue
        for d in range(total_days - 2):
            model.Add(x[w, d, 3] - x[w, d+1, 3] + (1 - x[w, d+2, 0]) <= 1)

    # Max 5 consecutive days worked
    for w in range(n_workers):
        for d in range(total_days - 5):
            model.Add(sum(x[w, d + k, 0] for k in range(6)) >= 1)

    # Daily coverage
    for d_idx in range(total_days):
        model.Add(sum(x[w, d_idx, 3] for w in range(n_workers)) == 1)

    for d_idx, dt in enumerate(dates):
        wd = dt.weekday()
        is_hol = (dt in holidays) or (dt == datetime.date(2027, 4, 23))
        is_summer = dt.month in [6, 7, 8, 9]
        if wd in [5, 6] or is_hol:
            model.Add(sum(x[w, d_idx, 1] for w in range(n_workers)) == 1)
            model.Add(sum(x[w, d_idx, 2] for w in range(n_workers)) == 1)
        else:
            if is_summer and wd in [2, 3, 4]:
                model.Add(sum(x[w, d_idx, 1] for w in range(n_workers)) >= 2)
                model.Add(sum(x[w, d_idx, 1] for w in range(n_workers)) <= 3)
                model.Add(sum(x[w, d_idx, 2] for w in range(n_workers)) >= 2)
                model.Add(sum(x[w, d_idx, 2] for w in range(n_workers)) <= 3)
            else:
                model.Add(sum(x[w, d_idx, 1] for w in range(n_workers)) == 3)
                model.Add(sum(x[w, d_idx, 2] for w in range(n_workers)) >= 2)
                model.Add(sum(x[w, d_idx, 2] for w in range(n_workers)) <= 3)

    def date_idx(y, m, d): return (datetime.date(y, m, d) - start_date).days

    # Fixed assignments
    d_0101 = date_idx(2027, 1, 1)
    model.Add(x[w_map["A. Leon"], d_0101, 1] + x[w_map["A. Leon"], d_0101, 2] == 1)
    model.Add(x[w_map["Alberto H"], d_0101, 1] + x[w_map["Alberto H"], d_0101, 2] == 1)
    model.Add(x[w_map["Santi M"], d_0101, 3] == 1)

    d_0106 = date_idx(2027, 1, 6)
    model.Add(x[w_map["A. Leon"], d_0106, 1] + x[w_map["A. Leon"], d_0106, 2] == 1)
    model.Add(x[w_map["Alberto H"], d_0106, 1] + x[w_map["Alberto H"], d_0106, 2] == 1)

    d_0301 = date_idx(2027, 3, 1)
    model.Add(x[w_map["Fran Espin"], d_0301, 1] + x[w_map["Fran Espin"], d_0301, 2] == 1)
    model.Add(x[w_map["Paco C"], d_0301, 1] + x[w_map["Paco C"], d_0301, 2] == 1)

    for day in [25, 26, 27, 28]:
        d_m = date_idx(2027, 3, day)
        model.Add(x[w_map["Antonio J"], d_m, 1] + x[w_map["Antonio J"], d_m, 2] == 1)
        model.Add(x[w_map["Santi M"], d_m, 1] + x[w_map["Santi M"], d_m, 2] == 1)
        if day in [25, 26, 27]:
            model.Add(x[w_map["Miguel B"], d_m, 3] == 1)

    for day in [23, 24, 25, 26]:
        d_a = date_idx(2027, 4, day)
        model.Add(x[w_map["Antonio J"], d_a, 1] + x[w_map["Antonio J"], d_a, 2] == 1)
        model.Add(x[w_map["Alberto H"], d_a, 1] + x[w_map["Alberto H"], d_a, 2] == 1)
        if day in [23, 24, 25]:
            model.Add(x[w_map["A. Leon"], d_a, 3] == 1)

    d_0501 = date_idx(2027, 5, 1)
    model.Add(x[w_map["Miguel B"], d_0501, 1] + x[w_map["Miguel B"], d_0501, 2] == 1)
    model.Add(x[w_map["Fran Espin"], d_0501, 1] + x[w_map["Fran Espin"], d_0501, 2] == 1)

    d_0816 = date_idx(2027, 8, 16)
    model.Add(x[w_map["Santi M"], d_0816, 1] + x[w_map["Santi M"], d_0816, 2] == 1)
    model.Add(x[w_map["Extra 1"], d_0816, 1] + x[w_map["Extra 1"], d_0816, 2] == 1)

    for day in [4, 5, 6]:
        d_s = date_idx(2027, 9, day)
        model.Add(x[w_map["Antonio J"], d_s, 1] + x[w_map["Antonio J"], d_s, 2] == 1)
        model.Add(x[w_map["Extra 1"], d_s, 1] + x[w_map["Extra 1"], d_s, 2] == 1)

    d_1012 = date_idx(2027, 10, 12)
    model.Add(x[w_map["Miguel B"], d_1012, 1] + x[w_map["Miguel B"], d_1012, 2] == 1)
    model.Add(x[w_map["Paco C"], d_1012, 1] + x[w_map["Paco C"], d_1012, 2] == 1)

    for day in [6, 8]:
        d_d = date_idx(2027, 12, day)
        model.Add(x[w_map["Paco C"], d_d, 1] + x[w_map["Paco C"], d_d, 2] == 1)
        model.Add(x[w_map["Santi M"], d_d, 1] + x[w_map["Santi M"], d_d, 2] == 1)

    d_1224 = date_idx(2027, 12, 24)
    model.Add(x[w_map["Alberto H"], d_1224, 3] == 1)

    d_1225 = date_idx(2027, 12, 25)
    model.Add(x[w_map["Miguel B"], d_1225, 1] + x[w_map["Miguel B"], d_1225, 2] == 1)
    model.Add(x[w_map["Fran Espin"], d_1225, 1] + x[w_map["Fran Espin"], d_1225, 2] == 1)

    d_1231 = date_idx(2027, 12, 31)
    model.Add(x[w_map["Miguel B"], d_1231, 3] == 1)

    # Exactly 220 days
    for w in range(n_workers - 1):
        model.Add(sum(1 - x[w, d_idx, 0] for d_idx in range(total_days)) == 220)
    extra_total = sum(1 - x[w_map["Extra 1"], d_idx, 0] for d_idx in range(total_days))
    model.Add(extra_total >= 80)
    model.Add(extra_total <= 85)

    monthly_days = {m: [d_idx for d_idx, dt in enumerate(dates) if dt.month == m] for m in range(1, 13)}
    for w in range(n_workers):
        for m in range(1, 13):
            model.Add(sum(x[w, d_idx, 3] for d_idx in monthly_days[m]) <= 7)

    for w in range(n_workers):
        w_name = workers[w]
        for m in range(1, 13):
            m_idxs = monthly_days[m]
            worked_in_m = sum(1 - x[w, d_idx, 0] for d_idx in m_idxs)
            if w_name == "Extra 1":
                if m in [6, 7, 8, 9]:
                    model.Add(worked_in_m >= 18)
                    model.Add(worked_in_m <= 22)
                else:
                    model.Add(worked_in_m == 0)
            else:
                is_vac_month = False
                if w_name in ["Antonio J", "Miguel B"] and m in [6, 8]: is_vac_month = True
                elif w_name in ["Paco C", "Fran Espin"] and m in [6, 8]: is_vac_month = True
                elif w_name in ["A. Leon", "Hilario"] and m in [7, 9]: is_vac_month = True
                elif w_name in ["Santi M", "Alberto H"] and m in [7, 9]: is_vac_month = True
                if not is_vac_month:
                    model.Add(worked_in_m >= 18)
                    model.Add(worked_in_m <= 21)

    reg_workers = [w for w in range(n_workers - 1) if workers[w] != "Hilario"]
    min_n = model.NewIntVar(45, 55, "min_n")
    max_n = model.NewIntVar(45, 55, "max_n")
    model.Add(max_n - min_n <= 3)
    for w in reg_workers:
        n_w = sum(x[w, d_idx, 3] for d_idx in range(total_days))
        model.Add(n_w >= min_n)
        model.Add(n_w <= max_n)

    min_f = model.NewIntVar(40, 52, "min_f")
    max_f = model.NewIntVar(40, 52, "max_f")
    model.Add(max_f - min_f <= 1)
    for w in reg_workers:
        f_w = sum(x[w, d_idx, s] for d_idx, dt in enumerate(dates) for s in [1, 2, 3] if is_festivo_shift(dt, s))
        model.Add(f_w >= min_f)
        model.Add(f_w <= max_f)

    min_m = model.NewIntVar(70, 105, "min_m")
    max_m = model.NewIntVar(70, 105, "max_m")
    model.Add(max_m - min_m <= 5)
    for w in reg_workers:
        m_w = sum(x[w, d_idx, 1] for d_idx in range(total_days))
        model.Add(m_w >= min_m)
        model.Add(m_w <= max_m)

    min_t = model.NewIntVar(70, 105, "min_t")
    max_t = model.NewIntVar(70, 105, "max_t")
    model.Add(max_t - min_t <= 5)
    for w in reg_workers:
        t_w = sum(x[w, d_idx, 2] for d_idx in range(total_days))
        model.Add(t_w >= min_t)
        model.Add(t_w <= max_t)

    h_m = sum(x[w_map["Hilario"], d_idx, 1] for d_idx in range(total_days))
    h_t = sum(x[w_map["Hilario"], d_idx, 2] for d_idx in range(total_days))
    model.Add(h_m >= 100)
    model.Add(h_m <= 120)
    model.Add(h_t >= 100)
    model.Add(h_t <= 120)

    # Night grouping
    for w in range(n_workers):
        if workers[w] != "Hilario":
            for d in range(total_days - 1):
                is_start = model.NewBoolVar(f"start_{w}_{d}")
                if d == 0:
                    model.Add(is_start == x[w, d, 3])
                else:
                    model.Add(is_start <= x[w, d, 3])
                    model.Add(is_start <= x[w, d-1, 3].Not())
                    model.Add(is_start >= x[w, d, 3] - x[w, d-1, 3])
                model.Add(x[w, d+1, 3] == 1).OnlyEnforceIf(is_start)
                if d < total_days - 4:
                    model.Add(sum(x[w, d+k, 3] for k in range(5)) <= 4)

    # Weekend definition: Friday N to Sunday T
    weekends = []
    for d_idx, dt in enumerate(dates[:-2]):
        if dt.weekday() == 4:
            weekends.append((d_idx, d_idx + 1, d_idx + 2))

    for w in range(n_workers):
        if workers[w] == "Hilario": continue
        for (fri_idx, sat_idx, sun_idx) in weekends:
            wknd_sum = (x[w, fri_idx, 3] +
                        x[w, sat_idx, 1] + x[w, sat_idx, 2] + x[w, sat_idx, 3] +
                        x[w, sun_idx, 1] + x[w, sun_idx, 2])
            model.Add(wknd_sum != 1)

    # SOFT / MINIMIZATION OF SHORT GAPS (< gap_days):
    # Instead of an impossible hard constraint, let us count and minimize occurrences of short gaps!
    short_gap_vars = []
    for w in range(n_workers):
        if workers[w] == "Hilario": continue
        for d in range(total_days - 1):
            is_end = model.NewBoolVar(f"end_{w}_{d}")
            model.Add(is_end <= x[w, d, 3])
            model.Add(is_end <= x[w, d+1, 3].Not())
            model.Add(is_end >= x[w, d, 3] - x[w, d+1, 3])
            
            # Check if any night occurs in next gap_days
            for k in range(1, gap_days + 1):
                if d + k < total_days:
                    has_violation = model.NewBoolVar(f"viol_{w}_{d}_{k}")
                    # has_violation is True if is_end == 1 and x[w, d+k, 3] == 1
                    model.Add(has_violation >= is_end + x[w, d+k, 3] - 1)
                    model.Add(has_violation <= is_end)
                    model.Add(has_violation <= x[w, d+k, 3])
                    short_gap_vars.append(has_violation)

    # Also penalize 4-night blocks (favor 3-night blocks)
    four_night_blocks = []
    for w in range(n_workers):
        if workers[w] != "Hilario":
            for d in range(total_days - 3):
                four_n = model.NewBoolVar(f"fn_{w}_{d}")
                model.Add(sum(x[w, d+k, 3] for k in range(4)) == 4).OnlyEnforceIf(four_n)
                model.Add(sum(x[w, d+k, 3] for k in range(4)) < 4).OnlyEnforceIf(four_n.Not())
                four_night_blocks.append(four_n)

    # Primary objective: Minimize short gaps (< 7 days) heavily!
    # Secondary objective: Minimize 4-night blocks
    model.Minimize(sum(short_gap_vars) * 100 + sum(four_night_blocks))

    return model, x, short_gap_vars

if __name__ == "__main__":
    print("Building model with 2 days rest after nights and minimizing short gaps...")
    model, x, short_gaps = build_investigation_model(gap_days=7)
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 180.0
    solver.parameters.num_workers = 8
    solver.parameters.log_search_progress = True
    print("Solving...")
    status = solver.Solve(model)
    print("STATUS:", solver.StatusName(status))
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        total_viol = sum(solver.Value(v) for v in short_gaps)
        print(f"TOTAL SHORT GAPS (< 7 days) in the entire year: {total_viol}")
