import datetime, calendar, json
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

with open("cuadrante_2027_v3.json", "r", encoding="utf-8") as f:
    data = json.load(f)

workers = data["workers"]
dates_str = data["dates"]
matrix_plain = data["matrix"]
matrix_dot = data["matrix_dot"]

dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in dates_str]

holidays = {
    datetime.date(2027, 1, 1),
    datetime.date(2027, 1, 6),
    datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25),
    datetime.date(2027, 3, 26),
    datetime.date(2027, 4, 26),
    datetime.date(2027, 5, 1),
    datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 13),
    datetime.date(2027, 10, 12),
    datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6),
    datetime.date(2027, 12, 8),
    datetime.date(2027, 12, 25),
}

def export_excel(filename):
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
        
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=num_days + 6)
        cell_title = ws.cell(row=1, column=1)
        cell_title.value = f"CUADRANTE DE TURNOS 2027 - V3 CONCILIACIÓN Y DESCANSO NOCHES - {month_names_es[m-1].upper()}"
        cell_title.font = Font(name="Calibri", size=14, bold=True, color="1F4E78")
        cell_title.alignment = Alignment(horizontal="left", vertical="center")
        ws.row_dimensions[1].height = 25
        
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
                
        sum_headers = ["TOTAL DÍAS", "MAÑANAS", "TARDES", "NOCHES", "FESTIVOS (.)"]
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
            
            for c_idx, d_idx in enumerate(m_days, start=2):
                val = matrix_dot[w_i][d_idx]
                cell_val = val if val.strip() != "" else None
                cell = ws.cell(row=r_idx, column=c_idx, value=cell_val)
                cell.alignment = align_center
                cell.border = thin_border
                
                if val and "M" in val:
                    cell.fill = fill_m
                elif val and "T" in val:
                    cell.fill = fill_t
                elif val and "N" in val:
                    cell.fill = fill_n
                else:
                    cell.fill = fill_l
                
                if val and "." in val:
                    cell.font = font_festivo_cell
                else:
                    cell.font = font_regular
                    
            rng = f"{first_col_letter}{r_idx}:{last_col_letter}{r_idx}"
            m_col_letter = get_column_letter(num_days + 3)
            n_col_letter = get_column_letter(num_days + 5)
            f_tot = f'=SUM({m_col_letter}{r_idx}:{n_col_letter}{r_idx})'
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
                
        ws.column_dimensions['A'].width = 16
        for c in range(2, num_days + 2):
            col_letter = get_column_letter(c)
            ws.column_dimensions[col_letter].width = 4.2
        for c in range(num_days + 2, num_days + 7):
            col_letter = get_column_letter(c)
            ws.column_dimensions[col_letter].width = 13

    wb.save(filename)
    print(f"Saved {filename} successfully!")

export_excel("Cuadrante_2027_Andujar_V3.xlsx")
export_excel("Cuadrante_2027_Andujar.xlsx")

# Update cuadrante_2027.json
with open("cuadrante_2027.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Updated cuadrante_2027.json successfully!")

# Update js/cuadrante_data.js
import re
with open("js/cuadrante_data.js", "r", encoding="utf-8") as f:
    js_text = f.read()

match = re.search(r"window\.CUADRANTE_DATA\s*=\s*(\{.*?\});\s*$", js_text, re.DOTALL)
if match:
    js_data = json.loads(match.group(1))
    js_data["description"] = "Cuadrante 2027 Andújar - Versión 3 (Conciliación Fines de Semana y 2 Días Descanso Tras Noches)"
    js_data["matrix"] = matrix_plain
    js_data["matrix_dot"] = matrix_dot
    if "holidays" in js_data and "2027-04-23" in js_data["holidays"]:
        js_data["holidays"].pop("2027-04-23")
    new_js = "// Cuadrante 2027 Andújar - Datos Oficiales V3 (Descanso 2 días tras noche)\nwindow.CUADRANTE_DATA = " + json.dumps(js_data, indent=2, ensure_ascii=False) + ";\n"
    with open("js/cuadrante_data.js", "w", encoding="utf-8") as f:
        f.write(new_js)
    print("Updated js/cuadrante_data.js successfully!")
