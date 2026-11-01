import json, datetime, calendar
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

with open("cuadrante_2027.json") as f:
    data = json.load(f)

workers = data["workers"]
dates_str = data["dates"]
matrix = data["matrix"]

dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in dates_str]
total_days = len(dates)

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

def is_festivo_shift(d, s):
    if s not in ["M", "T", "N"]:
        return False
    wd = d.weekday()
    is_hol = d in holidays
    if is_hol and s in ["M", "T"]:
        return True
    if wd == 4 and s == "N":
        return True
    if wd == 5:
        return True
    if wd == 6 and s in ["M", "T"]:
        return True
    return False

# Comprehensive Audit
print("=== AUDITORIA EXHAUSTIVA DE CUMPLIMIENTO ===")
errors = []

# 1. Check rest between shifts:
# T -> M forbidden
# N -> M forbidden
# N -> T forbidden
for w_idx, w_name in enumerate(workers):
    for d in range(total_days - 1):
        s1 = matrix[w_idx][d]
        s2 = matrix[w_idx][d+1]
        if s1 == "T" and s2 == "M":
            errors.append(f"Descanso <12h: {w_name} hace T el {dates[d]} y M el {dates[d+1]}")
        if s1 == "N" and s2 in ["M", "T"]:
            errors.append(f"Descanso <12h: {w_name} hace N el {dates[d]} y {s2} el {dates[d+1]}")

# 2. Max 6 consecutive days worked
for w_idx, w_name in enumerate(workers):
    consec = 0
    for d in range(total_days):
        if matrix[w_idx][d] in ["M", "T", "N"]:
            consec += 1
            if consec > 6:
                errors.append(f">6 dias seguidos: {w_name} trabaja mas de 6 dias seguidos en {dates[d]}")
        else:
            consec = 0

# 3. Hilario restrictions: no N, no festivos
h_idx = workers.index("Hilario")
for d in range(total_days):
    s = matrix[h_idx][d]
    if s == "N":
        errors.append(f"Hilario hace noche el {dates[d]}")
    if is_festivo_shift(dates[d], s):
        errors.append(f"Hilario trabaja en festivo el {dates[d]}: turno {s}")

# 4. Coverage check every day
for d_idx, dt in enumerate(dates):
    wd = dt.weekday()
    is_hol = (dt in holidays)
    is_summer = dt.month in [6, 7, 8, 9]
    col = [matrix[w][d_idx] for w in range(len(workers))]
    m_c = col.count("M")
    t_c = col.count("T")
    n_c = col.count("N")
    
    if n_c != 1:
        errors.append(f"Cobertura Noche != 1 en {dt}: {n_c}")
    
    if wd in [5, 6] or is_hol:
        if m_c != 1:
            errors.append(f"Cobertura M != 1 en fin de semana / festivo {dt}: {m_c}")
        if t_c != 1:
            errors.append(f"Cobertura T != 1 en fin de semana / festivo {dt}: {t_c}")
    else:
        if is_summer and wd in [2, 3, 4]:
            if m_c not in [2, 3]:
                errors.append(f"Cobertura M verano mier-vie fuera de rango [2,3] en {dt}: {m_c}")
            if t_c not in [2, 3]:
                errors.append(f"Cobertura T fuera de rango [2,3] en {dt}: {t_c}")
        else:
            if m_c != 3:
                errors.append(f"Cobertura M != 3 en laborable {dt}: {m_c}")
            if t_c not in [2, 3]:
                errors.append(f"Cobertura T fuera de rango [2,3] en {dt}: {t_c}")

# 5. Fixed assignments verification
fixed_checks = [
    ("1 Ene", datetime.date(2027, 1, 1), {"A. Leon": ["M", "T"], "Alberto H": ["M", "T"], "Santi M": ["N"]}),
    ("6 Ene", datetime.date(2027, 1, 6), {"A. Leon": ["M", "T"], "Alberto H": ["M", "T"]}),
    ("1 Mar", datetime.date(2027, 3, 1), {"Fran Espin": ["M", "T"], "Paco C": ["M", "T"]}),
    ("1 May", datetime.date(2027, 5, 1), {"Miguel B": ["M", "T"], "Fran Espin": ["M", "T"]}),
    ("16 Ago", datetime.date(2027, 8, 16), {"Santi M": ["M", "T"], "Extra 1": ["M", "T"]}),
    ("12 Oct", datetime.date(2027, 10, 12), {"Miguel B": ["M", "T"], "Paco C": ["M", "T"]}),
    ("6 Dic", datetime.date(2027, 12, 6), {"Paco C": ["M", "T"], "Santi M": ["M", "T"]}),
    ("8 Dic", datetime.date(2027, 12, 8), {"Paco C": ["M", "T"], "Santi M": ["M", "T"]}),
    ("24 Dic Noche", datetime.date(2027, 12, 24), {"Alberto H": ["N"]}),
    ("25 Dic", datetime.date(2027, 12, 25), {"Miguel B": ["M", "T"], "Fran Espin": ["M", "T"]}),
    ("31 Dic Noche", datetime.date(2027, 12, 31), {"Miguel B": ["N"]}),
]
for label, dt, reqs in fixed_checks:
    d_idx = dates.index(dt)
    for w_name, allowed in reqs.items():
        w_idx = workers.index(w_name)
        s = matrix[w_idx][d_idx]
        if s not in allowed:
            errors.append(f"Asignación fija violada en {label} ({dt}): {w_name} tiene {s}, esperado en {allowed}")

# Check 25-28 Mar
for d in [25, 26, 27, 28]:
    dt = datetime.date(2027, 3, d)
    d_idx = dates.index(dt)
    s_aj = matrix[workers.index("Antonio J")][d_idx]
    s_sm = matrix[workers.index("Santi M")][d_idx]
    if s_aj not in ["M", "T"] or s_sm not in ["M", "T"]:
        errors.append(f"25-28 Mar M/T violado en {dt}: Antonio J={s_aj}, Santi M={s_sm}")
    if d in [25, 26, 27]:
        s_mb = matrix[workers.index("Miguel B")][d_idx]
        if s_mb != "N":
            errors.append(f"25-27 Mar Noche Miguel B violado en {dt}: {s_mb}")

# Check 23-26 Apr
for d in [23, 24, 25, 26]:
    dt = datetime.date(2027, 4, d)
    d_idx = dates.index(dt)
    s_aj = matrix[workers.index("Antonio J")][d_idx]
    s_ah = matrix[workers.index("Alberto H")][d_idx]
    if s_aj not in ["M", "T"] or s_ah not in ["M", "T"]:
        errors.append(f"23-26 Abr M/T violado en {dt}: Antonio J={s_aj}, Alberto H={s_ah}")
    if d in [23, 24, 25]:
        s_al = matrix[workers.index("A. Leon")][d_idx]
        if s_al != "N":
            errors.append(f"23-25 Abr Noche Antonio L violado en {dt}: {s_al}")

# Check 3-6 Sep
for d in [3, 4, 5]:
    dt = datetime.date(2027, 9, d)
    d_idx = dates.index(dt)
    s_al = matrix[workers.index("A. Leon")][d_idx]
    if s_al != "N":
        errors.append(f"3-5 Sep Noche Antonio L violado en {dt}: {s_al}")
for d in [4, 5, 6]:
    dt = datetime.date(2027, 9, d)
    d_idx = dates.index(dt)
    s_aj = matrix[workers.index("Antonio J")][d_idx]
    s_ex = matrix[workers.index("Extra 1")][d_idx]
    if s_aj not in ["M", "T"] or s_ex not in ["M", "T"]:
        errors.append(f"4-6 Sep M/T violado en {dt}: Antonio J={s_aj}, Extra 1={s_ex}")

print(f"Total de errores/infracciones detectadas: {len(errors)}")
if errors:
    for e in errors[:10]:
        print("  -", e)
else:
    print(">>> VALIDACION 100% PERFECTA: CERO INFRACCIONES DE RESTRICCIONES DURAS O SUAVES <<<")

# Generate openpyxl spreadsheet
wb = openpyxl.Workbook()
# remove default sheet
wb.remove(wb.active)

# Color styles
fill_header = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
fill_festivo_day = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid")
fill_we_day = PatternFill(start_color="EDEDED", end_color="EDEDED", fill_type="solid")
fill_m = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid") # light blue
fill_t = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid") # light orange
fill_n = PatternFill(start_color="D0CECE", end_color="D0CECE", fill_type="solid") # gray
fill_l = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid") # white

font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_bold = Font(name="Calibri", size=10, bold=True)
font_regular = Font(name="Calibri", size=10)
font_festivo_header = Font(name="Calibri", size=10, bold=True, color="C00000")

thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

align_center = Alignment(horizontal='center', vertical='center')
align_left = Alignment(horizontal='left', vertical='center')

# Create monthly sheets
month_names_es = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

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
    
    wd_initials = ["L", "M", "X", "J", "V", "S", "D"]
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
            
    # Summary columns
    sum_headers = ["TOTAL DÍAS", "MAÑANAS", "TARDES", "NOCHES", "FESTIVOS"]
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
        
        m_count = 0
        t_count = 0
        n_count = 0
        f_count = 0
        
        for c_idx, d_idx in enumerate(m_days, start=2):
            dt = dates[d_idx]
            s = matrix[w_i][d_idx]
            cell = ws.cell(row=r_idx, column=c_idx, value=s)
            cell.alignment = align_center
            cell.border = thin_border
            cell.font = font_regular
            
            if s == "M":
                cell.fill = fill_m
                m_count += 1
            elif s == "T":
                cell.fill = fill_t
                t_count += 1
            elif s == "N":
                cell.fill = fill_n
                n_count += 1
            else:
                cell.fill = fill_l
                
            if is_festivo_shift(dt, s):
                f_count += 1
                
        tot_d = m_count + t_count + n_count
        summary_vals = [tot_d, m_count, t_count, n_count, f_count]
        for idx, val in enumerate(summary_vals):
            col_pos = num_days + 2 + idx
            scell = ws.cell(row=r_idx, column=col_pos, value=val)
            scell.font = font_bold
            scell.alignment = align_center
            scell.border = thin_border
            
    # Set column widths
    ws.column_dimensions['A'].width = 16
    for c in range(2, num_days + 2):
        col_letter = get_column_letter(c)
        ws.column_dimensions[col_letter].width = 3.5
    for c in range(num_days + 2, num_days + 7):
        col_letter = get_column_letter(c)
        ws.column_dimensions[col_letter].width = 12

wb.save("Cuadrante_2027_Andujar.xlsx")
print("Saved Cuadrante_2027_Andujar.xlsx successfully!")
