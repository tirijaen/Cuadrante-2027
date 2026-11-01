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
    if s not in ["M", "T", "N"]: return False
    wd = d.weekday()
    is_hol = d in holidays
    if is_hol and s in ["M", "T"]: return True
    if wd == 4 and s == "N": return True
    if wd == 5: return True
    if wd == 6 and s in ["M", "T"]: return True
    return False

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
    
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=num_days + 6)
    cell_title = ws.cell(row=1, column=1)
    cell_title.value = f"CUADRANTE DE TURNOS - {month_names_es[m-1].upper()} 2027"
    cell_title.font = Font(name="Calibri", size=14, bold=True, color="1F4E78")
    cell_title.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 25
    
    ws.cell(row=2, column=1, value="TRABAJADOR").font = font_header
    ws.cell(row=2, column=1).fill = fill_header
    ws.cell(row=2, column=1).alignment = align_left
    ws.merge_cells("A2:A3")
    
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
            
    sum_headers = ["TOTAL DÍAS", "MAÑANAS", "TARDES", "NOCHES", "FESTIVOS"]
    for idx, sh in enumerate(sum_headers):
        col_pos = num_days + 2 + idx
        cell = ws.cell(row=2, column=col_pos, value=sh)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        ws.merge_cells(start_row=2, start_column=col_pos, end_row=3, end_column=col_pos)

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
            
    ws.column_dimensions['A'].width = 16
    for c in range(2, num_days + 2):
        col_letter = get_column_letter(c)
        ws.column_dimensions[col_letter].width = 3.5
    for c in range(num_days + 2, num_days + 7):
        col_letter = get_column_letter(c)
        ws.column_dimensions[col_letter].width = 12

wb.save("Cuadrante_2027_Andujar.xlsx")
print("Workbook Cuadrante_2027_Andujar.xlsx updated successfully!")
