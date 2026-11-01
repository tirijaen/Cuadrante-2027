import datetime, calendar
from ortools.sat.python import cp_model

def test_model(antonio_l_option=1):
    print(f"\n================ TESTING OPTION {antonio_l_option} ================")
    holidays = {
        datetime.date(2027, 1, 1),
        datetime.date(2027, 1, 6),
        datetime.date(2027, 3, 1),
        datetime.date(2027, 3, 25),
        datetime.date(2027, 3, 26),
        datetime.date(2027, 4, 23),
        datetime.date(2027, 4, 26),
        datetime.date(2027, 5, 1),
        datetime.date(2027, 8, 16),
        datetime.date(2027, 9, 6),
        datetime.date(2027, 10, 12),
        datetime.date(2027, 11, 1),
        datetime.date(2027, 12, 6),
        datetime.date(2027, 12, 8),
        datetime.date(2027, 12, 25),
    }

    workers = [
        'Antonio J', 'Santi M', 'Alberto H', 'Fran Espin',
        'Miguel B', 'Paco C', 'A. Leon', 'Hilario', 'Extra 1'
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

    model = cp_model.CpModel()
    x = {}
    for w in range(n_workers):
        for d in range(total_days):
            for s in [0, 1, 2, 3]:
                x[w, d, s] = model.NewBoolVar(f"x_{w}_{d}_{s}")
            model.Add(sum(x[w, d, s] for s in [0, 1, 2, 3]) == 1)

    # Vacations
    # Antonio J & Miguel B: Jun 1-15, Aug 1-15
    for w in [w_map['Antonio J'], w_map['Miguel B']]:
        for d_idx, dt in enumerate(dates):
            if (dt.month == 6 and 1 <= dt.day <= 15) or (dt.month == 8 and 1 <= dt.day <= 15):
                model.Add(x[w, d_idx, 0] == 1)

    # Paco C & Fran Espin: Jun 16-30, Aug 16-31
    for w in [w_map['Paco C'], w_map['Fran Espin']]:
        for d_idx, dt in enumerate(dates):
            if (dt.month == 6 and 16 <= dt.day <= 30) or (dt.month == 8 and 16 <= dt.day <= 31):
                model.Add(x[w, d_idx, 0] == 1)

    # Hilario: Jul 1-15, Sep 1-15
    for d_idx, dt in enumerate(dates):
        if (dt.month == 7 and 1 <= dt.day <= 15) or (dt.month == 9 and 1 <= dt.day <= 15):
            model.Add(x[w_map['Hilario'], d_idx, 0] == 1)

    # Santi M & Alberto H: Jul 16-31, Sep 16-30 (unless option 3 swap)
    if antonio_l_option == 3:
        # Swap A. Leon and Santi M in Sept (A. Leon takes Sep 16-30, Santi M takes Sep 1-15)
        for d_idx, dt in enumerate(dates):
            if dt.month == 7 and 1 <= dt.day <= 15:
                model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)
            if dt.month == 9 and 16 <= dt.day <= 30:
                model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)
            if dt.month == 7 and 16 <= dt.day <= 31:
                model.Add(x[w_map['Santi M'], d_idx, 0] == 1)
                model.Add(x[w_map['Alberto H'], d_idx, 0] == 1)
            if dt.month == 9 and 1 <= dt.day <= 15:
                model.Add(x[w_map['Santi M'], d_idx, 0] == 1)
            if dt.month == 9 and 16 <= dt.day <= 30:
                model.Add(x[w_map['Alberto H'], d_idx, 0] == 1)
    else:
        for w in [w_map['Santi M'], w_map['Alberto H']]:
            for d_idx, dt in enumerate(dates):
                if (dt.month == 7 and 16 <= dt.day <= 31) or (dt.month == 9 and 16 <= dt.day <= 30):
                    model.Add(x[w, d_idx, 0] == 1)
        
        # A. Leon vacation in Jul and Sep
        for d_idx, dt in enumerate(dates):
            if dt.month == 7 and 1 <= dt.day <= 15:
                model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)
            if antonio_l_option == 1:
                # Sep 1-15 except 3, 4, 5, plus Sep 16, 17, 18
                if dt.month == 9:
                    if dt.day in [1, 2] or (6 <= dt.day <= 18):
                        model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)
            elif antonio_l_option == 2:
                # Sep 1-15 full vacation
                if dt.month == 9 and 1 <= dt.day <= 15:
                    model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)

    # Extra 1 active only Jun-Sep
    for d_idx, dt in enumerate(dates):
        if dt.month not in [6, 7, 8, 9]:
            model.Add(x[w_map['Extra 1'], d_idx, 0] == 1)

    # Hilario restrictions
    for d_idx, dt in enumerate(dates):
        model.Add(x[w_map['Hilario'], d_idx, 3] == 0)
        wd = dt.weekday()
        if wd in [5, 6] or (dt in holidays):
            model.Add(x[w_map['Hilario'], d_idx, 0] == 1)

    # Rest >= 12h
    for w in range(n_workers):
        for d in range(total_days - 1):
            model.Add(x[w, d, 2] + x[w, d+1, 1] <= 1)
            model.Add(x[w, d, 3] + x[w, d+1, 1] <= 1)
            model.Add(x[w, d, 3] + x[w, d+1, 2] <= 1)

    # RULE 3: NUNCA SE TRABAJARÁ 6 DÍAS SEGUIDOS (máximo 5 días seguidos trabajados)
    # Window of 6 consecutive days must contain at least 1 rest day!
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
                m_sum = sum(x[w, d_idx, 1] for w in range(n_workers))
                model.Add(m_sum >= 2)
                model.Add(m_sum <= 3)
                t_sum = sum(x[w, d_idx, 2] for w in range(n_workers))
                model.Add(t_sum >= 2)
                model.Add(t_sum <= 3)
            else:
                model.Add(sum(x[w, d_idx, 1] for w in range(n_workers)) == 3)
                t_sum = sum(x[w, d_idx, 2] for w in range(n_workers))
                model.Add(t_sum >= 2)
                model.Add(t_sum <= 3)

    def date_idx(y, m, d):
        return (datetime.date(y, m, d) - start_date).days

    # Fixed assignments
    d_0101 = date_idx(2027, 1, 1)
    model.Add(x[w_map['A. Leon'], d_0101, 1] + x[w_map['A. Leon'], d_0101, 2] == 1)
    model.Add(x[w_map['Alberto H'], d_0101, 1] + x[w_map['Alberto H'], d_0101, 2] == 1)
    model.Add(x[w_map['Santi M'], d_0101, 3] == 1)

    d_0106 = date_idx(2027, 1, 6)
    model.Add(x[w_map['A. Leon'], d_0106, 1] + x[w_map['A. Leon'], d_0106, 2] == 1)
    model.Add(x[w_map['Alberto H'], d_0106, 1] + x[w_map['Alberto H'], d_0106, 2] == 1)

    d_0301 = date_idx(2027, 3, 1)
    model.Add(x[w_map['Fran Espin'], d_0301, 1] + x[w_map['Fran Espin'], d_0301, 2] == 1)
    model.Add(x[w_map['Paco C'], d_0301, 1] + x[w_map['Paco C'], d_0301, 2] == 1)

    for day in [25, 26, 27, 28]:
        d_m = date_idx(2027, 3, day)
        model.Add(x[w_map['Antonio J'], d_m, 1] + x[w_map['Antonio J'], d_m, 2] == 1)
        model.Add(x[w_map['Santi M'], d_m, 1] + x[w_map['Santi M'], d_m, 2] == 1)
        if day in [25, 26, 27]:
            model.Add(x[w_map['Miguel B'], d_m, 3] == 1)

    for day in [23, 24, 25, 26]:
        d_a = date_idx(2027, 4, day)
        model.Add(x[w_map['Antonio J'], d_a, 1] + x[w_map['Antonio J'], d_a, 2] == 1)
        model.Add(x[w_map['Alberto H'], d_a, 1] + x[w_map['Alberto H'], d_a, 2] == 1)
        if day in [23, 24, 25]:
            model.Add(x[w_map['A. Leon'], d_a, 3] == 1)

    d_0501 = date_idx(2027, 5, 1)
    model.Add(x[w_map['Miguel B'], d_0501, 1] + x[w_map['Miguel B'], d_0501, 2] == 1)
    model.Add(x[w_map['Fran Espin'], d_0501, 1] + x[w_map['Fran Espin'], d_0501, 2] == 1)

    d_0816 = date_idx(2027, 8, 16)
    model.Add(x[w_map['Santi M'], d_0816, 1] + x[w_map['Santi M'], d_0816, 2] == 1)
    model.Add(x[w_map['Extra 1'], d_0816, 1] + x[w_map['Extra 1'], d_0816, 2] == 1)

    # Sep 3, 4, 5 N
    if antonio_l_option in [1, 3]:
        for day in [3, 4, 5]:
            d_s = date_idx(2027, 9, day)
            model.Add(x[w_map['A. Leon'], d_s, 3] == 1)
    elif antonio_l_option == 2:
        # A. Leon rests (vacation), someone else does N
        pass

    for day in [4, 5, 6]:
        d_s = date_idx(2027, 9, day)
        model.Add(x[w_map['Antonio J'], d_s, 1] + x[w_map['Antonio J'], d_s, 2] == 1)
        model.Add(x[w_map['Extra 1'], d_s, 1] + x[w_map['Extra 1'], d_s, 2] == 1)

    d_1012 = date_idx(2027, 10, 12)
    model.Add(x[w_map['Miguel B'], d_1012, 1] + x[w_map['Miguel B'], d_1012, 2] == 1)
    model.Add(x[w_map['Paco C'], d_1012, 1] + x[w_map['Paco C'], d_1012, 2] == 1)

    for day in [6, 8]:
        d_d = date_idx(2027, 12, day)
        model.Add(x[w_map['Paco C'], d_d, 1] + x[w_map['Paco C'], d_d, 2] == 1)
        model.Add(x[w_map['Santi M'], d_d, 1] + x[w_map['Santi M'], d_d, 2] == 1)

    d_1224 = date_idx(2027, 12, 24)
    model.Add(x[w_map['Alberto H'], d_1224, 3] == 1)

    d_1225 = date_idx(2027, 12, 25)
    model.Add(x[w_map['Miguel B'], d_1225, 1] + x[w_map['Miguel B'], d_1225, 2] == 1)
    model.Add(x[w_map['Fran Espin'], d_1225, 1] + x[w_map['Fran Espin'], d_1225, 2] == 1)

    d_1231 = date_idx(2027, 12, 31)
    model.Add(x[w_map['Miguel B'], d_1231, 3] == 1)

    # Exactly 220 days for all regular workers
    for w in range(n_workers - 1):
        total_w = sum(1 - x[w, d_idx, 0] for d_idx in range(total_days))
        model.Add(total_w == 220)

    # Extra 1
    extra_total = sum(1 - x[w_map['Extra 1'], d_idx, 0] for d_idx in range(total_days))
    model.Add(extra_total >= 80)
    model.Add(extra_total <= 85)

    # RULE 4:
    # Festivos: diferencia máxima de 1 día entre los 7 trabajadores (todos menos Hilario y Extra 1)
    # Noches: diferencia máxima de 3 días entre los 7 trabajadores
    reg_workers = [w for w in range(n_workers - 1) if workers[w] != 'Hilario']
    
    # Noches diff <= 3
    # Introduce min_n and max_n
    min_n = model.NewIntVar(45, 55, "min_n")
    max_n = model.NewIntVar(45, 55, "max_n")
    model.Add(max_n - min_n <= 3)
    for w in reg_workers:
        n_w = sum(x[w, d_idx, 3] for d_idx in range(total_days))
        model.Add(n_w >= min_n)
        model.Add(n_w <= max_n)

    # Festivos diff <= 1
    min_f = model.NewIntVar(40, 52, "min_f")
    max_f = model.NewIntVar(40, 52, "max_f")
    model.Add(max_f - min_f <= 1)
    for w in reg_workers:
        f_w = sum(x[w, d_idx, s] for d_idx, dt in enumerate(dates) for s in [1, 2, 3] if is_festivo_shift(dt, s))
        model.Add(f_w >= min_f)
        model.Add(f_w <= max_f)

    # RULE 1:
    # STRICT 3-night blocks:
    # If a block starts at d (x[w, d, 3]==1 and (d==0 or x[w, d-1, 3]==0)):
    # strictly 3 nights: x[w, d+1, 3]==1, x[w, d+2, 3]==1, and x[w, d+3, 3]==0.
    # Exceptionally allow 2 or 4 if no solution.
    # Let's enforce that block length is in [2, 4], and heavily penalize != 3!
    pen_night_len = []
    for w in range(n_workers):
        if workers[w] != 'Hilario':
            for d in range(total_days - 1):
                # Is start of night block?
                is_start = model.NewBoolVar(f"start_{w}_{d}")
                if d == 0:
                    model.Add(is_start == x[w, d, 3])
                else:
                    model.Add(is_start <= x[w, d, 3])
                    model.Add(is_start <= x[w, d-1, 3].Not())
                    model.Add(is_start >= x[w, d, 3] - x[w, d-1, 3])
                
                # Length 1 is FORBIDDEN (no single nights!)
                model.Add(x[w, d+1, 3] == 1).OnlyEnforceIf(is_start)

                # Length >= 5 is FORBIDDEN (no 5 or more nights!)
                if d < total_days - 4:
                    # cannot have 5 nights in a row
                    model.Add(sum(x[w, d+k, 3] for k in range(5)) <= 4)
                
                # Penalize length == 2: is_start and x[d+1]==1 and x[d+2]==0
                if d < total_days - 2:
                    p2 = model.NewBoolVar(f"p2_{w}_{d}")
                    model.AddBoolAnd([is_start, x[w, d+1, 3], x[w, d+2, 3].Not()]).OnlyEnforceIf(p2)
                    model.AddBoolOr([is_start.Not(), x[w, d+1, 3].Not(), x[w, d+2, 3]]).OnlyEnforceIf(p2.Not())
                    pen_night_len.append(p2)
                
                # Penalize length == 4: is_start and x[d+1]==1 and x[d+2]==1 and x[d+3]==1 and (d+4>=total_days or x[d+4]==0)
                if d < total_days - 3:
                    p4 = model.NewBoolVar(f"p4_{w}_{d}")
                    model.AddBoolAnd([is_start, x[w, d+1, 3], x[w, d+2, 3], x[w, d+3, 3]]).OnlyEnforceIf(p4)
                    model.AddBoolOr([is_start.Not(), x[w, d+1, 3].Not(), x[w, d+2, 3].Not(), x[w, d+3, 3].Not()]).OnlyEnforceIf(p4.Not())
                    pen_night_len.append(p4)

    # Post-night rest rule
    for w in range(n_workers):
        for d in range(total_days - 2):
            model.Add(x[w, d+2, 1] <= 1 - (x[w, d, 3] - x[w, d+1, 3]))

    model.Minimize(sum(pen_night_len))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    solver.parameters.num_workers = 8
    status = solver.Solve(model)
    print(f"Status for Option {antonio_l_option}: {solver.StatusName(status)}")
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        print("Success! Summary:")
        for w in range(n_workers):
            tot = sum(1 - solver.Value(x[w, d, 0]) for d in range(total_days))
            m_cnt = sum(solver.Value(x[w, d, 1]) for d in range(total_days))
            t_cnt = sum(solver.Value(x[w, d, 2]) for d in range(total_days))
            n_cnt = sum(solver.Value(x[w, d, 3]) for d in range(total_days))
            f_cnt = sum(solver.Value(x[w, d, s]) for d in range(total_days) for s in [1, 2, 3] if is_festivo_shift(dates[d], s))
            print(f"{workers[w]:12s}: Total={tot:3d} | M={m_cnt:3d}, T={t_cnt:3d}, N={n_cnt:3d} | Festivos={f_cnt:2d}")
        print("Night penalties (non-3-night blocks):", solver.ObjectiveValue())

test_model(1)
