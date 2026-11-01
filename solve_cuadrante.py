import datetime, calendar
from ortools.sat.python import cp_model

# 1. Dates setup
holidays = {
    datetime.date(2027, 1, 1),
    datetime.date(2027, 1, 6),
    datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25),
    datetime.date(2027, 3, 26),
    datetime.date(2027, 4, 23), # Romeria Viernes
    datetime.date(2027, 4, 26), # Fiesta Local
    datetime.date(2027, 5, 1),
    datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6),  # Fiesta Local
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

# Shifts: 0: L, 1: M, 2: T, 3: N
SHIFTS = [0, 1, 2, 3]

def is_festivo_shift(d, s):
    if s == 0:
        return False
    wd = d.weekday()
    is_hol = d in holidays
    if is_hol and s in [1, 2]:
        return True
    if wd == 4 and s == 3: # Viernes noche
        return True
    if wd == 5: # Sabado M, T, N
        return True
    if wd == 6 and s in [1, 2]: # Domingo M, T
        return True
    return False

# Model
model = cp_model.CpModel()

# Variables: x[w, d, s]
x = {}
for w in range(n_workers):
    for d in range(total_days):
        for s in SHIFTS:
            x[w, d, s] = model.NewBoolVar(f"x_{w}_{d}_{s}")

# Exactly one shift per worker per day
for w in range(n_workers):
    for d in range(total_days):
        model.Add(sum(x[w, d, s] for s in SHIFTS) == 1)

# Vacation days
# Antonio J and Miguel B: Jun 1-15, Aug 1-15
for w in [w_map['Antonio J'], w_map['Miguel B']]:
    for d_idx, dt in enumerate(dates):
        if (dt.month == 6 and 1 <= dt.day <= 15) or (dt.month == 8 and 1 <= dt.day <= 15):
            model.Add(x[w, d_idx, 0] == 1)

# Paco C and Fran Espin: Jun 16-30, Aug 16-31
for w in [w_map['Paco C'], w_map['Fran Espin']]:
    for d_idx, dt in enumerate(dates):
        if (dt.month == 6 and 16 <= dt.day <= 30) or (dt.month == 8 and 16 <= dt.day <= 31):
            model.Add(x[w, d_idx, 0] == 1)

# A. Leon: Jul 1-15, Sep 1-15 (except Sep 3, 4, 5 where N is assigned)
for d_idx, dt in enumerate(dates):
    if dt.month == 7 and 1 <= dt.day <= 15:
        model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)
    if dt.month == 9 and 1 <= dt.day <= 15:
        if dt.day in [3, 4, 5]:
            pass # N assigned later
        else:
            model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)

# Hilario: Jul 1-15, Sep 1-15
for d_idx, dt in enumerate(dates):
    if (dt.month == 7 and 1 <= dt.day <= 15) or (dt.month == 9 and 1 <= dt.day <= 15):
        model.Add(x[w_map['Hilario'], d_idx, 0] == 1)

# Santi M and Alberto H: Jul 16-31, Sep 16-30
for w in [w_map['Santi M'], w_map['Alberto H']]:
    for d_idx, dt in enumerate(dates):
        if (dt.month == 7 and 16 <= dt.day <= 31) or (dt.month == 9 and 16 <= dt.day <= 30):
            model.Add(x[w, d_idx, 0] == 1)

# Extra 1: only works Jun to Sep
for d_idx, dt in enumerate(dates):
    if dt.month not in [6, 7, 8, 9]:
        model.Add(x[w_map['Extra 1'], d_idx, 0] == 1)

# Hilario restrictions: no N, no festivos / fines de semana
for d_idx, dt in enumerate(dates):
    model.Add(x[w_map['Hilario'], d_idx, 3] == 0) # No N
    wd = dt.weekday()
    if wd in [5, 6] or (dt in holidays):
        model.Add(x[w_map['Hilario'], d_idx, 0] == 1) # Must rest

# Rest between shifts >= 12h:
# T -> M forbidden
# N -> M forbidden
# N -> T forbidden
for w in range(n_workers):
    for d in range(total_days - 1):
        model.Add(x[w, d, 2] + x[w, d+1, 1] <= 1)
        model.Add(x[w, d, 3] + x[w, d+1, 1] <= 1)
        model.Add(x[w, d, 3] + x[w, d+1, 2] <= 1)

# Max 6 consecutive working days (any window of 7 days has >= 1 rest day)
for w in range(n_workers):
    for d in range(total_days - 6):
        model.Add(sum(x[w, d + k, 0] for k in range(7)) >= 1)

# Fixed assignments
def date_idx(y, m, d):
    return (datetime.date(y, m, d) - start_date).days

# 1 Enero: M/T A. Leon & Alberto H, N Santi M
d_0101 = date_idx(2027, 1, 1)
model.Add(x[w_map['A. Leon'], d_0101, 1] + x[w_map['A. Leon'], d_0101, 2] == 1)
model.Add(x[w_map['Alberto H'], d_0101, 1] + x[w_map['Alberto H'], d_0101, 2] == 1)
model.Add(x[w_map['Santi M'], d_0101, 3] == 1)

# 6 Enero: M/T A. Leon & Alberto H
d_0106 = date_idx(2027, 1, 6)
model.Add(x[w_map['A. Leon'], d_0106, 1] + x[w_map['A. Leon'], d_0106, 2] == 1)
model.Add(x[w_map['Alberto H'], d_0106, 1] + x[w_map['Alberto H'], d_0106, 2] == 1)

# 1 Marzo: M/T Fran Espin & Paco C
d_0301 = date_idx(2027, 3, 1)
model.Add(x[w_map['Fran Espin'], d_0301, 1] + x[w_map['Fran Espin'], d_0301, 2] == 1)
model.Add(x[w_map['Paco C'], d_0301, 1] + x[w_map['Paco C'], d_0301, 2] == 1)

# 25, 26, 27, 28 Marzo: M/T Antonio J & Santi M; 25, 26, 27 N Miguel B
for day in [25, 26, 27, 28]:
    d_m = date_idx(2027, 3, day)
    model.Add(x[w_map['Antonio J'], d_m, 1] + x[w_map['Antonio J'], d_m, 2] == 1)
    model.Add(x[w_map['Santi M'], d_m, 1] + x[w_map['Santi M'], d_m, 2] == 1)
    if day in [25, 26, 27]:
        model.Add(x[w_map['Miguel B'], d_m, 3] == 1)

# 23, 24, 25, 26 Abril: M/T Antonio J & Alberto H; 23, 24, 25 N Antonio L
for day in [23, 24, 25, 26]:
    d_a = date_idx(2027, 4, day)
    model.Add(x[w_map['Antonio J'], d_a, 1] + x[w_map['Antonio J'], d_a, 2] == 1)
    model.Add(x[w_map['Alberto H'], d_a, 1] + x[w_map['Alberto H'], d_a, 2] == 1)
    if day in [23, 24, 25]:
        model.Add(x[w_map['A. Leon'], d_a, 3] == 1)

# 1 Mayo: M/T Miguel B & Fran Espin
d_0501 = date_idx(2027, 5, 1)
model.Add(x[w_map['Miguel B'], d_0501, 1] + x[w_map['Miguel B'], d_0501, 2] == 1)
model.Add(x[w_map['Fran Espin'], d_0501, 1] + x[w_map['Fran Espin'], d_0501, 2] == 1)

# 16 Agosto: M/T Santi M & Extra 1
d_0816 = date_idx(2027, 8, 16)
model.Add(x[w_map['Santi M'], d_0816, 1] + x[w_map['Santi M'], d_0816, 2] == 1)
model.Add(x[w_map['Extra 1'], d_0816, 1] + x[w_map['Extra 1'], d_0816, 2] == 1)

# 3, 4, 5 Septiembre N Antonio L
for day in [3, 4, 5]:
    d_s = date_idx(2027, 9, day)
    model.Add(x[w_map['A. Leon'], d_s, 3] == 1)

# 4, 5, 6 Septiembre M/T Antonio J & Extra 1
for day in [4, 5, 6]:
    d_s = date_idx(2027, 9, day)
    model.Add(x[w_map['Antonio J'], d_s, 1] + x[w_map['Antonio J'], d_s, 2] == 1)
    model.Add(x[w_map['Extra 1'], d_s, 1] + x[w_map['Extra 1'], d_s, 2] == 1)

# 12 Octubre: M/T Miguel B & Paco C
d_1012 = date_idx(2027, 10, 12)
model.Add(x[w_map['Miguel B'], d_1012, 1] + x[w_map['Miguel B'], d_1012, 2] == 1)
model.Add(x[w_map['Paco C'], d_1012, 1] + x[w_map['Paco C'], d_1012, 2] == 1)

# 6 y 8 Diciembre: M/T Paco C & Santi M
for day in [6, 8]:
    d_d = date_idx(2027, 12, day)
    model.Add(x[w_map['Paco C'], d_d, 1] + x[w_map['Paco C'], d_d, 2] == 1)
    model.Add(x[w_map['Santi M'], d_d, 1] + x[w_map['Santi M'], d_d, 2] == 1)

# 24 Diciembre: N Alberto H
d_1224 = date_idx(2027, 12, 24)
model.Add(x[w_map['Alberto H'], d_1224, 3] == 1)

# 25 Diciembre: M/T Miguel B & Fran Espin
d_1225 = date_idx(2027, 12, 25)
model.Add(x[w_map['Miguel B'], d_1225, 1] + x[w_map['Miguel B'], d_1225, 2] == 1)
model.Add(x[w_map['Fran Espin'], d_1225, 1] + x[w_map['Fran Espin'], d_1225, 2] == 1)

# 31 Diciembre: N Miguel B
d_1231 = date_idx(2027, 12, 31)
model.Add(x[w_map['Miguel B'], d_1231, 3] == 1)

# Daily coverage constraints
# Night shift: exactly 1 worker every day
for d_idx in range(total_days):
    model.Add(sum(x[w, d_idx, 3] for w in range(n_workers)) == 1)

# Morning and Afternoon shifts
# Saturdays, Sundays, Holidays: exactly 1 M, 1 T
for d_idx, dt in enumerate(dates):
    wd = dt.weekday()
    is_hol = (dt in holidays) or (dt == datetime.date(2027, 4, 23))
    is_summer = dt.month in [6, 7, 8, 9]
    if wd in [5, 6] or is_hol:
        model.Add(sum(x[w, d_idx, 1] for w in range(n_workers)) == 1)
        model.Add(sum(x[w, d_idx, 2] for w in range(n_workers)) == 1)
    else:
        # Weekday non-holiday
        if is_summer and wd in [2, 3, 4]: # Wed, Thu, Fri in summer
            # Normally 2 M, can expand to 3 M
            m_sum = sum(x[w, d_idx, 1] for w in range(n_workers))
            model.Add(m_sum >= 2)
            model.Add(m_sum <= 3)
            # T can be 2 or 3
            t_sum = sum(x[w, d_idx, 2] for w in range(n_workers))
            model.Add(t_sum >= 2)
            model.Add(t_sum <= 3)
        else:
            # Mon-Fri standard
            model.Add(sum(x[w, d_idx, 1] for w in range(n_workers)) == 3)
            # T can be 2 or 3
            t_sum = sum(x[w, d_idx, 2] for w in range(n_workers))
            model.Add(t_sum >= 2)
            model.Add(t_sum <= 3)

# Monthly worked days preferences:
# General rule: ~20 days per month (flexible to 19-21)
# For vacation month with 15 days vacation: ~9-11 days
monthly_days = {}
for m in range(1, 13):
    monthly_days[m] = [d_idx for d_idx, dt in enumerate(dates) if dt.month == m]

for w in range(n_workers):
    w_name = workers[w]
    for m in range(1, 13):
        m_idxs = monthly_days[m]
        worked_in_m = sum(1 - x[w, d_idx, 0] for d_idx in m_idxs)
        if w_name == 'Extra 1':
            if m in [6, 7, 8, 9]:
                model.Add(worked_in_m >= 18)
                model.Add(worked_in_m <= 22)
            else:
                model.Add(worked_in_m == 0)
        else:
            # Check vacation in this month
            is_vac_month = False
            if w_name in ['Antonio J', 'Miguel B'] and m in [6, 8]:
                is_vac_month = True
            elif w_name in ['Paco C', 'Fran Espin'] and m in [6, 8]:
                is_vac_month = True
            elif w_name in ['A. Leon', 'Hilario'] and m in [7, 9]:
                is_vac_month = True
            elif w_name in ['Santi M', 'Alberto H'] and m in [7, 9]:
                is_vac_month = True
            
            if is_vac_month:
                model.Add(worked_in_m >= 8)
                model.Add(worked_in_m <= 12)
            else:
                model.Add(worked_in_m >= 18)
                model.Add(worked_in_m <= 22)

# Annual worked days: 220 target for regular workers
for w in range(n_workers - 1): # regular workers
    total_w = sum(1 - x[w, d_idx, 0] for d_idx in range(total_days))
    model.Add(total_w >= 218)
    model.Add(total_w <= 222)

# Grouping nights: penalize transitions from N to not-N unless it's a 3-night block
# Let's count night shifts per worker
for w in range(n_workers - 1):
    if workers[w] != 'Hilario':
        n_nights = sum(x[w, d_idx, 3] for d_idx in range(total_days))
        model.Add(n_nights >= 40)
        model.Add(n_nights <= 60)

# Festivos worked equity for regular workers (excluding Hilario and Extra 1)
festivo_worked = []
for w in range(n_workers - 1):
    if workers[w] != 'Hilario':
        # sum of festivo shifts
        f_sum = sum(x[w, d_idx, s] for d_idx, dt in enumerate(dates) for s in [1, 2, 3] if is_festivo_shift(dt, s))
        festivo_worked.append(f_sum)

# Objective:
# 1. Minimize distance from 220 days
# 2. Minimize distance from 20 days per month
# 3. Night block continuity (prefer blocks of 3)
# 4. Rest after nights (prefer 2 days rest after N)
# 5. Equity in festivos

target_devs = []
for w in range(n_workers - 1):
    tot = sum(1 - x[w, d_idx, 0] for d_idx in range(total_days))
    dev = model.NewIntVar(0, 10, f"dev_tot_{w}")
    model.AddAbsEquality(dev, tot - 220)
    target_devs.append(dev)

# Preference for 3-night blocks:
# Count night starts: x[w, d-1, 3]==0 and x[w, d, 3]==1
# If night starts at d, we prefer x[w, d+1, 3]==1 and x[w, d+2, 3]==1, and x[w, d+3, 3]==0
night_penalties = []
for w in range(n_workers):
    if workers[w] != 'Hilario':
        for d in range(total_days - 2):
            # penalize isolated single night: N then not N
            is_single = model.NewBoolVar(f"single_n_{w}_{d}")
            # if d==0 or d>0 and x[w, d-1, 3]==0:
            # simple proxy: penalize x[w, d, 3] != x[w, d+1, 3]
            pass

# Also prefer 2 rests after N: x[w, d, 3]==1 and x[w, d+1, 3]==0 => x[w, d+1, 0]==1 and x[w, d+2, 0]==1
post_n_penalties = []
for w in range(n_workers):
    for d in range(total_days - 2):
        # If w works N on d and doesn't work N on d+1:
        # we want x[w, d+2, 0] == 1 (second rest day)
        # penalty if x[w, d, 3] == 1 and x[w, d+1, 3] == 0 and x[w, d+2, 0] == 0
        pen = model.NewBoolVar(f"pen_post_n_{w}_{d}")
        model.AddBoolAnd([x[w, d, 3], x[w, d+1, 3].Not(), x[w, d+2, 0].Not()]).OnlyEnforceIf(pen)
        model.AddBoolOr([x[w, d, 3].Not(), x[w, d+1, 3], x[w, d+2, 0]]).OnlyEnforceIf(pen.Not())
        post_n_penalties.append(pen)

model.Minimize(sum(target_devs) * 20 + sum(post_n_penalties) * 5)

print("Solving CP-SAT model...")
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 60.0
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
