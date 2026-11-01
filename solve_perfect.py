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

SHIFTS = [0, 1, 2, 3] # 0: L, 1: M, 2: T, 3: N

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

model = cp_model.CpModel()

x = {}
for w in range(n_workers):
    for d in range(total_days):
        for s in SHIFTS:
            x[w, d, s] = model.NewBoolVar(f"x_{w}_{d}_{s}")

for w in range(n_workers):
    for d in range(total_days):
        model.Add(sum(x[w, d, s] for s in SHIFTS) == 1)

# Vacation days
for w in [w_map['Antonio J'], w_map['Miguel B']]:
    for d_idx, dt in enumerate(dates):
        if (dt.month == 6 and 1 <= dt.day <= 15) or (dt.month == 8 and 1 <= dt.day <= 15):
            model.Add(x[w, d_idx, 0] == 1)

for w in [w_map['Paco C'], w_map['Fran Espin']]:
    for d_idx, dt in enumerate(dates):
        if (dt.month == 6 and 16 <= dt.day <= 30) or (dt.month == 8 and 16 <= dt.day <= 31):
            model.Add(x[w, d_idx, 0] == 1)

for d_idx, dt in enumerate(dates):
    if dt.month == 7 and 1 <= dt.day <= 15:
        model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)
    if dt.month == 9 and 1 <= dt.day <= 15:
        if dt.day in [3, 4, 5]:
            pass
        else:
            model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)

for d_idx, dt in enumerate(dates):
    if (dt.month == 7 and 1 <= dt.day <= 15) or (dt.month == 9 and 1 <= dt.day <= 15):
        model.Add(x[w_map['Hilario'], d_idx, 0] == 1)

for w in [w_map['Santi M'], w_map['Alberto H']]:
    for d_idx, dt in enumerate(dates):
        if (dt.month == 7 and 16 <= dt.day <= 31) or (dt.month == 9 and 16 <= dt.day <= 30):
            model.Add(x[w, d_idx, 0] == 1)

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

# Max 6 consecutive days worked
for w in range(n_workers):
    for d in range(total_days - 6):
        model.Add(sum(x[w, d + k, 0] for k in range(7)) >= 1)

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

for day in [3, 4, 5]:
    d_s = date_idx(2027, 9, day)
    model.Add(x[w_map['A. Leon'], d_s, 3] == 1)

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

# Monthly constraints
monthly_days = {m: [d_idx for d_idx, dt in enumerate(dates) if dt.month == m] for m in range(1, 13)}

for w in range(n_workers):
    w_name = workers[w]
    for m in range(1, 13):
        m_idxs = monthly_days[m]
        worked_in_m = sum(1 - x[w, d_idx, 0] for d_idx in m_idxs)
        if w_name == 'Extra 1':
            if m in [6, 7, 8, 9]:
                model.Add(worked_in_m >= 19)
                model.Add(worked_in_m <= 21)
            else:
                model.Add(worked_in_m == 0)
        else:
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
                model.Add(worked_in_m >= 9)
                model.Add(worked_in_m <= 11)
            else:
                model.Add(worked_in_m >= 19)
                model.Add(worked_in_m <= 21)

# Exactly 220 days for all 8 regular workers!
for w in range(n_workers - 1):
    total_w = sum(1 - x[w, d_idx, 0] for d_idx in range(total_days))
    model.Add(total_w == 220)

# Extra 1 total days between 80 and 84
extra_total = sum(1 - x[w_map['Extra 1'], d_idx, 0] for d_idx in range(total_days))
model.Add(extra_total >= 80)
model.Add(extra_total <= 84)

# Nights per regular worker: between 47 and 53
for w in range(n_workers - 1):
    if workers[w] != 'Hilario':
        n_nights = sum(x[w, d_idx, 3] for d_idx in range(total_days))
        model.Add(n_nights >= 46)
        model.Add(n_nights <= 53)

# Festivos worked equity: between 43 and 48 for regular workers
for w in range(n_workers - 1):
    if workers[w] != 'Hilario':
        f_sum = sum(x[w, d_idx, s] for d_idx, dt in enumerate(dates) for s in [1, 2, 3] if is_festivo_shift(dt, s))
        model.Add(f_sum >= 43)
        model.Add(f_sum <= 48)

# Hilario M and T balance: each around 105-115
h_m = sum(x[w_map['Hilario'], d_idx, 1] for d_idx in range(total_days))
h_t = sum(x[w_map['Hilario'], d_idx, 2] for d_idx in range(total_days))
model.Add(h_m >= 105)
model.Add(h_m <= 115)
model.Add(h_t >= 105)
model.Add(h_t <= 115)

# Regular workers M and T balance:
for w in range(n_workers - 1):
    if workers[w] != 'Hilario':
        w_m = sum(x[w, d_idx, 1] for d_idx in range(total_days))
        w_t = sum(x[w, d_idx, 2] for d_idx in range(total_days))
        model.Add(w_m >= 75)
        model.Add(w_m <= 95)
        model.Add(w_t >= 75)
        model.Add(w_t <= 95)

# STRICT Night grouping:
# If w works night on d, and d+1 is night, then d+2 should also be night (3-night blocks)
# Forbid isolated single night: x[d-1]==0 and x[d]==1 => x[d+1]==1
# Forbid isolated 2 nights if not fixed: penalize lengths != 3
bad_night_blocks = []
for w in range(n_workers):
    if workers[w] != 'Hilario':
        for d in range(total_days - 1):
            # If w works N on d, and didn't work N on d-1: start of block
            # If d+1 is not N, that's an isolated 1-night!
            is_start = model.NewBoolVar(f"nstart_{w}_{d}")
            if d == 0:
                model.Add(is_start == x[w, d, 3])
            else:
                model.Add(is_start <= x[w, d, 3])
                model.Add(is_start <= x[w, d-1, 3].Not())
                model.Add(is_start >= x[w, d, 3] - x[w, d-1, 3])
            
            # Isolated 1-night penalty: is_start and not x[w, d+1, 3]
            iso1 = model.NewBoolVar(f"iso1_{w}_{d}")
            model.AddBoolAnd([is_start, x[w, d+1, 3].Not()]).OnlyEnforceIf(iso1)
            model.AddBoolOr([is_start.Not(), x[w, d+1, 3]]).OnlyEnforceIf(iso1.Not())
            bad_night_blocks.append(iso1)

            # Block of 2 nights penalty (if d+2 < total_days): is_start and x[w, d+1, 3] and not x[w, d+2, 3]
            if d < total_days - 2:
                iso2 = model.NewBoolVar(f"iso2_{w}_{d}")
                model.AddBoolAnd([is_start, x[w, d+1, 3], x[w, d+2, 3].Not()]).OnlyEnforceIf(iso2)
                model.AddBoolOr([is_start.Not(), x[w, d+1, 3].Not(), x[w, d+2, 3]]).OnlyEnforceIf(iso2.Not())
                bad_night_blocks.append(iso2)

# Post-night rest:
# If block ends at d (x[w, d, 3]==1 and x[w, d+1, 3]==0):
# 1) d+1 MUST be rest: already enforced (N->M forbidden, N->T forbidden)
# 2) prefer d+2 is also rest (2 days rest)
# 3) if d+2 is NOT rest, it MUST be T (cannot be M: "en el caso de que solo pueda haber 1 que se empiece a trabajar en turno de tarde")
for w in range(n_workers):
    for d in range(total_days - 2):
        # If w works N on d, and not N on d+1:
        # Enforce that if d+2 is NOT Libre, it CANNOT be M!
        # That means: x[w, d, 3] == 1 and x[w, d+1, 3] == 0 => x[w, d+2, 1] == 0!
        model.Add(x[w, d+2, 1] <= 1 - (x[w, d, 3] - x[w, d+1, 3]))

post_n_single_rest = []
for w in range(n_workers):
    for d in range(total_days - 2):
        # Penalty if only 1 day of rest after night block:
        # x[w, d, 3] == 1 and x[w, d+1, 3] == 0 and x[w, d+2, 0] == 0
        pen = model.NewBoolVar(f"pen1rest_{w}_{d}")
        model.AddBoolAnd([x[w, d, 3], x[w, d+1, 3].Not(), x[w, d+2, 0].Not()]).OnlyEnforceIf(pen)
        model.AddBoolOr([x[w, d, 3].Not(), x[w, d+1, 3], x[w, d+2, 0]]).OnlyEnforceIf(pen.Not())
        post_n_single_rest.append(pen)

model.Minimize(sum(bad_night_blocks) * 100 + sum(post_n_single_rest) * 5)

print("Solving perfect CP-SAT model...")
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 120.0
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
