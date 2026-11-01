import datetime, calendar, json
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from ortools.sat.python import cp_model

# 1. Dates & Holidays setup
holidays = {
    datetime.date(2027, 1, 1): "Año Nuevo",
    datetime.date(2027, 1, 6): "Epifanía del Señor",
    datetime.date(2027, 3, 1): "Día de Andalucía",
    datetime.date(2027, 3, 25): "Jueves Santo",
    datetime.date(2027, 3, 26): "Viernes Santo",
    datetime.date(2027, 4, 23): "Romería Cabeza (Viernes)",
    datetime.date(2027, 4, 26): "Fiesta Local Andújar",
    datetime.date(2027, 5, 1): "Fiesta del Trabajo",
    datetime.date(2027, 8, 16): "Asunción de la Virgen",
    datetime.date(2027, 9, 6): "Fiesta Local Andújar",
    datetime.date(2027, 10, 12): "Fiesta Nacional de España",
    datetime.date(2027, 11, 1): "Todos los Santos",
    datetime.date(2027, 12, 6): "Día de la Constitución",
    datetime.date(2027, 12, 8): "Inmaculada Concepción",
    datetime.date(2027, 12, 25): "Natividad del Señor"
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
    # s: 0=L, 1=M, 2=T, 3=N
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

# Vacation days
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

# Santi M & Alberto H: Jul 16-31, Sep 16-30
for w in [w_map['Santi M'], w_map['Alberto H']]:
    for d_idx, dt in enumerate(dates):
        if (dt.month == 7 and 16 <= dt.day <= 31) or (dt.month == 9 and 16 <= dt.day <= 30):
            model.Add(x[w, d_idx, 0] == 1)

# A. Leon: Jul 1-15, Sep 1-15 (USER CHOSE OPTION 2: FULL VACATION SEP 1-15!)
for d_idx, dt in enumerate(dates):
    if (dt.month == 7 and 1 <= dt.day <= 15) or (dt.month == 9 and 1 <= dt.day <= 15):
        model.Add(x[w_map['A. Leon'], d_idx, 0] == 1)

# Extra 1 active only Jun-Sep
for d_idx, dt in enumerate(dates):
    if dt.month not in [6, 7, 8, 9]:
        model.Add(x[w_map['Extra 1'], d_idx, 0] == 1)

# Hilario restrictions: no N, no festivos / fines de semana
for d_idx, dt in enumerate(dates):
    model.Add(x[w_map['Hilario'], d_idx, 3] == 0)
    wd = dt.weekday()
    if wd in [5, 6] or (dt in holidays):
        model.Add(x[w_map['Hilario'], d_idx, 0] == 1)

# Rest >= 12h:
for w in range(n_workers):
    for d in range(total_days - 1):
        model.Add(x[w, d, 2] + x[w, d+1, 1] <= 1)
        model.Add(x[w, d, 3] + x[w, d+1, 1] <= 1)
        model.Add(x[w, d, 3] + x[w, d+1, 2] <= 1)

# RULE 3: NUNCA SE TRABAJARÁ 6 DÍAS SEGUIDOS (máximo 5 días seguidos trabajados)
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

# Sep 4, 5, 6 M/T: Antonio J & Extra 1
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

# Exactly 220 days for all regular workers!
for w in range(n_workers - 1):
    total_w = sum(1 - x[w, d_idx, 0] for d_idx in range(total_days))
    model.Add(total_w == 220)

# Extra 1 days
extra_total = sum(1 - x[w_map['Extra 1'], d_idx, 0] for d_idx in range(total_days))
model.Add(extra_total >= 80)
model.Add(extra_total <= 85)

# Monthly days worked limits (19-21 in regular months, 9-11 in vacation months)
monthly_days = {m: [d_idx for d_idx, dt in enumerate(dates) if dt.month == m] for m in range(1, 13)}
for w in range(n_workers):
    w_name = workers[w]
    for m in range(1, 13):
        m_idxs = monthly_days[m]
        worked_in_m = sum(1 - x[w, d_idx, 0] for d_idx in m_idxs)
        if w_name == 'Extra 1':
            if m in [6, 7, 8, 9]:
                model.Add(worked_in_m >= 19)
                model.Add(worked_in_m <= 22)
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
                model.Add(worked_in_m >= 18)
                model.Add(worked_in_m <= 21)

# RULE 4:
# Festivos: diferencia máxima de 1 día entre los 7 trabajadores regulares (max_f - min_f <= 1)
# Noches: diferencia máxima de 3 días entre los 7 trabajadores regulares (max_n - min_n <= 3)
reg_workers = [w for w in range(n_workers - 1) if workers[w] != 'Hilario']

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

# Hilario balance M & T
h_m = sum(x[w_map['Hilario'], d_idx, 1] for d_idx in range(total_days))
h_t = sum(x[w_map['Hilario'], d_idx, 2] for d_idx in range(total_days))
model.Add(h_m >= 100)
model.Add(h_m <= 120)
model.Add(h_t >= 100)
model.Add(h_t <= 120)

# RULE 1:
# STRICT 3-night blocks as general rule.
# Forbid 1 night. Forbid 5+ nights.
# Penalize lengths != 3 (i.e. length 2 or 4).
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
            
            # Forbidden: isolated single night
            model.Add(x[w, d+1, 3] == 1).OnlyEnforceIf(is_start)

            # Forbidden: 5 nights in a row
            if d < total_days - 4:
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

# Post-night rest rule:
# If w works N on d, and not N on d+1:
# If d+2 is worked, it CANNOT be M (must be T)
for w in range(n_workers):
    for d in range(total_days - 2):
        model.Add(x[w, d+2, 1] <= 1 - (x[w, d, 3] - x[w, d+1, 3]))

# Preference: 2 days rest after night block
pen_single_rest = []
for w in range(n_workers):
    for d in range(total_days - 2):
        pen_r = model.NewBoolVar(f"pen_r_{w}_{d}")
        model.AddBoolAnd([x[w, d, 3], x[w, d+1, 3].Not(), x[w, d+2, 0].Not()]).OnlyEnforceIf(pen_r)
        model.AddBoolOr([x[w, d, 3].Not(), x[w, d+1, 3], x[w, d+2, 0]]).OnlyEnforceIf(pen_r.Not())
        pen_single_rest.append(pen_r)

model.Minimize(sum(pen_night_len) * 50 + sum(pen_single_rest) * 2)

print("Solving CP-SAT final model...")
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 90.0
solver.parameters.num_workers = 8
status = solver.Solve(model)

print(f"Status: {solver.StatusName(status)}")
assert status in [cp_model.OPTIMAL, cp_model.FEASIBLE]

# Build matrix
shift_codes = {0: "", 1: "M", 2: "T", 3: "N"}
matrix = []
for w in range(n_workers):
    row = []
    for d in range(total_days):
        s_val = 0
        for s in [0, 1, 2, 3]:
            if solver.Value(x[w, d, s]) == 1:
                s_val = s
                break
        row.append(shift_codes[s_val])
    matrix.append(row)

# Save json
with open("cuadrante_2027.json", "w") as f:
    json.dump({
        "workers": workers,
        "dates": [d.strftime("%Y-%m-%d") for d in dates],
        "matrix": matrix
    }, f)

print("JSON saved successfully!")
