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

# Vacation periods & Rule 5 (No night shift the day before vacation)
vacation_periods = [
    ('Antonio J', [(6, 1, 15), (8, 1, 15)]),
    ('Miguel B',  [(6, 1, 15), (8, 1, 15)]),
    ('Paco C',    [(6, 16, 30), (8, 16, 31)]),
    ('Fran Espin',[(6, 16, 30), (8, 16, 31)]),
    ('A. Leon',   [(7, 1, 15), (9, 1, 15)]),
    ('Hilario',   [(7, 1, 15), (9, 1, 15)]),
    ('Santi M',   [(7, 16, 31), (9, 16, 30)]),
    ('Alberto H', [(7, 16, 31), (9, 16, 30)]),
]

for w_name, periods in vacation_periods:
    w_idx = w_map[w_name]
    for (m, s_day, e_day) in periods:
        for d_idx, dt in enumerate(dates):
            if dt.month == m and s_day <= dt.day <= e_day:
                model.Add(x[w_idx, d_idx, 0] == 1)
        
        # Rule 5: Day before vacation CANNOT have night shift (N)
        vac_start = datetime.date(2027, m, s_day)
        day_before = vac_start - datetime.timedelta(days=1)
        if day_before >= start_date:
            db_idx = (day_before - start_date).days
            model.Add(x[w_idx, db_idx, 3] == 0)

# Extra 1 active only Jun-Sep
for d_idx, dt in enumerate(dates):
    if dt.month not in [6, 7, 8, 9]:
        model.Add(x[w_map['Extra 1'], d_idx, 0] == 1)

# Rule 1: Durante las primeras 2 semanas de Extra 1 (1 al 14 de junio), no puede estar en turno solo
for d_idx, dt in enumerate(dates):
    if dt.month == 6 and 1 <= dt.day <= 14:
        model.Add(x[w_map['Extra 1'], d_idx, 3] == 0)
        wd = dt.weekday()
        if wd in [5, 6] or (dt in holidays):
            model.Add(x[w_map['Extra 1'], d_idx, 0] == 1)

# Hilario restrictions: no N, no festivos / fines de semana
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

# Max 5 consecutive days worked (never 6)
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

# Rule 4: Maximo 7 noches en un mes por trabajador
monthly_days = {m: [d_idx for d_idx, dt in enumerate(dates) if dt.month == m] for m in range(1, 13)}
for w in range(n_workers):
    for m in range(1, 13):
        m_idxs = monthly_days[m]
        n_in_m = sum(x[w, d_idx, 3] for d_idx in m_idxs)
        model.Add(n_in_m <= 7)

# Rule 6:
# En meses sin vacaciones: entre 18 y 21 días (NUNCA 22).
# En meses con vacaciones: NO entra en esta regla.
month_devs = []
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
            is_vac_month = False
            if w_name in ['Antonio J', 'Miguel B'] and m in [6, 8]:
                is_vac_month = True
            elif w_name in ['Paco C', 'Fran Espin'] and m in [6, 8]:
                is_vac_month = True
            elif w_name in ['A. Leon', 'Hilario'] and m in [7, 9]:
                is_vac_month = True
            elif w_name in ['Santi M', 'Alberto H'] and m in [7, 9]:
                is_vac_month = True
            
            if not is_vac_month:
                model.Add(worked_in_m >= 18)
                model.Add(worked_in_m <= 21)
                dev = model.NewIntVar(0, 2, f"dev_{w}_{m}")
                model.AddAbsEquality(dev, worked_in_m - 20)
                month_devs.append(dev)

# Equidad Festivos y Noches:
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

# Rule 2: Iguala las mañanas y las tardes de todos los trabajadores menos Hilario y Extra 1
# para que haya una diferencia como máximo de 5 mañanas y 5 tardes
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

# Hilario balance M & T
h_m = sum(x[w_map['Hilario'], d_idx, 1] for d_idx in range(total_days))
h_t = sum(x[w_map['Hilario'], d_idx, 2] for d_idx in range(total_days))
model.Add(h_m >= 100)
model.Add(h_m <= 120)
model.Add(h_t >= 100)
model.Add(h_t <= 120)

# Night grouping (no single nights, no 5+ nights, prefer 3 nights)
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

            # Penalize length == 2
            if d < total_days - 2:
                p2 = model.NewBoolVar(f"p2_{w}_{d}")
                model.AddBoolAnd([is_start, x[w, d+1, 3], x[w, d+2, 3].Not()]).OnlyEnforceIf(p2)
                model.AddBoolOr([is_start.Not(), x[w, d+1, 3].Not(), x[w, d+2, 3]]).OnlyEnforceIf(p2.Not())
                pen_night_len.append(p2)

            # Penalize length == 4
            if d < total_days - 3:
                p4 = model.NewBoolVar(f"p4_{w}_{d}")
                model.AddBoolAnd([is_start, x[w, d+1, 3], x[w, d+2, 3], x[w, d+3, 3]]).OnlyEnforceIf(p4)
                model.AddBoolOr([is_start.Not(), x[w, d+1, 3].Not(), x[w, d+2, 3].Not(), x[w, d+3, 3].Not()]).OnlyEnforceIf(p4.Not())
                pen_night_len.append(p4)

# Post-night rest rule
for w in range(n_workers):
    for d in range(total_days - 2):
        model.Add(x[w, d+2, 1] <= 1 - (x[w, d, 3] - x[w, d+1, 3]))

model.Minimize(sum(pen_night_len) * 5 + sum(month_devs) * 2)

print("Solving CP-SAT...")
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 45.0
solver.parameters.num_workers = 8
status = solver.Solve(model)

print(f"Status: {solver.StatusName(status)}")
assert status in [cp_model.OPTIMAL, cp_model.FEASIBLE]

# Build matrix with Rule 3:
# For festive shifts: 'M.', 'T.', 'N.'
# For ordinary shifts: 'M', 'T', 'N'
# For rest: ''
matrix_dot = []
matrix_plain = []
for w in range(n_workers):
    row_dot = []
    row_plain = []
    for d in range(total_days):
        s_val = 0
        for s in [0, 1, 2, 3]:
            if solver.Value(x[w, d, s]) == 1:
                s_val = s
                break
        plain_code = {0: "", 1: "M", 2: "T", 3: "N"}[s_val]
        row_plain.append(plain_code)
        
        is_fest = is_festivo_shift(dates[d], s_val)
        if s_val == 0:
            row_dot.append("")
        else:
            dot_code = plain_code + ("." if is_fest else "")
            row_dot.append(dot_code)
    matrix_dot.append(row_dot)
    matrix_plain.append(row_plain)

# Save json
with open("cuadrante_2027.json", "w") as f:
    json.dump({
        "workers": workers,
        "dates": [d.strftime("%Y-%m-%d") for d in dates],
        "matrix_dot": matrix_dot,
        "matrix": matrix_plain
    }, f)

print("Saved JSON successfully!")

# Now build updated Excel workbook with openpyxl and dynamic Excel formulas!
wb = openpyxl.Workbook()
wb.remove(wb.active)

fill_header = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
fill_festivo_day = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid")
fill_we_day = PatternFill(start_color="EDEDED", end_color="EDEDED", fill_type="solid")
fill_m = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
fill_t = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
fill_n = PatternFill(start_color="D0CECE", end_color="D0CECE", fill_type="solid")
fill_l = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_bold = Font(name="Calibri", size=10, bold=True)
font_regular = Font(name="Calibri", size=10)
font_festivo_header = Font(name="Calibri", size=10, bold=True, color="C00000")
font_festivo_cell = Font(name="Calibri", size=10, bold=True, color="9C0006")

thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

align_center = Alignment(horizontal='center', vertical='center')
align_left = Alignment(horizontal='left', vertical='center')

month_names_es = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
wd_initials = ["L", "M", "X", "J", "V", "S", "D"]

for m in range(1, 13):
    ws = wb.create_sheet(title=f"{m:02d}_{month_names_es[m-1][:3]}")
    m_days = [d_idx for d_idx, dt in enumerate(dates) if dt.month == m]
    num_days = len(m_days)
    
    # Title
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=num_days + 6)
    cell_title = ws.cell(row=1, column=1)
    cell_title.value = f"CUADRANTE DE TURNOS - {month_names_es[m-1].upper()} 2027"
    cell_title.font = Font(name="Calibri", size=14, bold=True, color="1F4E78")
    cell_title.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 25
    
    # Header row 2: Day numbers
    # Header row 3: Day of week
    ws.cell(row=2, column=1, value="TRABAJADOR").font = font_header
    ws.cell(row=2, column=1).fill = fill_header
    ws.cell(row=2, column=1).alignment = align_left
    ws.merge_cells("A2:A3")
    
    first_col_letter = get_column_letter(2)
    last_col_letter = get_column_letter(num_days + 1)
    
    for c_idx, d_idx in enumerate(m_days, start=2):
        dt = dates[d_idx]
        wd = dt.weekday()
        is_h = (dt in holidays)
        
        c2 = ws.cell(row=2, column=c_idx, value=dt.day)
        c3 = ws.cell(row=3, column=c_idx, value=wd_initials[wd])
        
        c2.font = font_festivo_header if is_h else font_bold
        c3.font = font_festivo_header if is_h else font_bold
        c2.alignment = align_center
        c3.alignment = align_center
        
        if is_h:
            c2.fill = fill_festivo_day
            c3.fill = fill_festivo_day
        elif wd in [5, 6]:
            c2.fill = fill_we_day
            c3.fill = fill_we_day
            
    # Summary columns with Excel formulas!
    sum_headers = ["TOTAL DÍAS", "MAÑANAS", "TARDES", "NOCHES", "FESTIVOS (.)"]
    for idx, sh in enumerate(sum_headers):
        col_pos = num_days + 2 + idx
        cell = ws.cell(row=2, column=col_pos, value=sh)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        ws.merge_cells(start_row=2, start_column=col_pos, end_row=3, end_column=col_pos)

    # Worker rows
    for r_idx, w_name in enumerate(workers, start=4):
        w_i = workers.index(w_name)
        cell_w = ws.cell(row=r_idx, column=1, value=w_name)
        cell_w.font = font_bold
        cell_w.alignment = align_left
        cell_w.border = thin_border
        
        for c_idx, d_idx in enumerate(m_days, start=2):
            val = matrix_dot[w_i][d_idx]
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            cell.alignment = align_center
            cell.border = thin_border
            
            if "M" in val:
                cell.fill = fill_m
            elif "T" in val:
                cell.fill = fill_t
            elif "N" in val:
                cell.fill = fill_n
            else:
                cell.fill = fill_l
            
            if "." in val:
                cell.font = font_festivo_cell
            else:
                cell.font = font_regular
                
        # Excel Formulas for this worker:
        # Total Días: =CONTAR.SI(B4:AF4; "?*")
        # Mañanas: =CONTAR.SI(B4:AF4; "M*")
        # Tardes: =CONTAR.SI(B4:AF4; "T*")
        # Noches: =CONTAR.SI(B4:AF4; "N*")
        # Festivos (.): =CONTAR.SI(B4:AF4; "*.*")
        rng = f"{first_col_letter}{r_idx}:{last_col_letter}{r_idx}"
        
        f_tot = f'=COUNTIF({rng}, "?*")'
        f_m = f'=COUNTIF({rng}, "M*")'
        f_t = f'=COUNTIF({rng}, "T*")'
        f_n = f'=COUNTIF({rng}, "N*")'
        f_fest = f'=COUNTIF({rng}, "*.*")'
        
        formulas = [f_tot, f_m, f_t, f_n, f_fest]
        for idx, form in enumerate(formulas):
            col_pos = num_days + 2 + idx
            scell = ws.cell(row=r_idx, column=col_pos, value=form)
            scell.font = font_bold
            scell.alignment = align_center
            scell.border = thin_border
            
    # Set column widths
    ws.column_dimensions['A'].width = 16
    for c in range(2, num_days + 2):
        col_letter = get_column_letter(c)
        ws.column_dimensions[col_letter].width = 4.2
    for c in range(num_days + 2, num_days + 7):
        col_letter = get_column_letter(c)
        ws.column_dimensions[col_letter].width = 13

wb.save("Cuadrante_2027_Andujar.xlsx")
print("Saved Cuadrante_2027_Andujar.xlsx with Excel formulas successfully!")
