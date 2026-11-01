import openpyxl
from openpyxl.utils import get_column_letter

files_to_fix = [
    "Cuadrante_2027_Andujar_V2.xlsx",
    "Cuadrante_2027_Andujar.xlsx",
    "Cuadrante_2027_Andujar_V1.xlsx"
]

for filename in files_to_fix:
    print(f"Fixing {filename}...")
    wb = openpyxl.load_workbook(filename)
    
    for ws in wb.worksheets:
        max_r = ws.max_row
        max_c = ws.max_column
        
        # Row 2 has day numbers, row 3 has weekday initials, row 4..12 has workers
        # Let's find where the days end and summary columns start
        # Summary headers in row 2: "TOTAL DÍAS", "MAÑANAS", "TARDES", "NOCHES", "FESTIVOS (.)"
        tot_col = None
        m_col = None
        t_col = None
        n_col = None
        fest_col = None
        
        for c in range(1, max_c + 1):
            val = ws.cell(row=2, column=c).value
            if val == "TOTAL DÍAS": tot_col = c
            elif val == "MAÑANAS": m_col = c
            elif val == "TARDES": t_col = c
            elif val == "NOCHES": n_col = c
            elif val == "FESTIVOS (.)": fest_col = c
            
        if not tot_col:
            continue
            
        first_day_col = 2
        last_day_col = tot_col - 1
        
        first_day_letter = get_column_letter(first_day_col)
        last_day_letter = get_column_letter(last_day_col)
        
        tot_letter = get_column_letter(tot_col)
        m_letter = get_column_letter(m_col)
        t_letter = get_column_letter(t_col)
        n_letter = get_column_letter(n_col)
        fest_letter = get_column_letter(fest_col)
        
        # Process worker rows
        for r in range(4, max_r + 1):
            w_name = ws.cell(row=r, column=1).value
            if not w_name: continue
            
            # 1. Clean resting cells to be truly None (empty)
            for c in range(first_day_col, last_day_col + 1):
                c_val = ws.cell(row=r, column=c).value
                if c_val is not None:
                    if str(c_val).strip() == "":
                        ws.cell(row=r, column=c).value = None
                        
            # 2. Update formulas:
            # For Total Días: =SUM(M:N) -> e.g. =SUM(AH4:AJ4)
            # This directly and unmistakably equals Mañanas + Tardes + Noches!
            # It also avoids any issue with space characters or empty cell definitions.
            ws.cell(row=r, column=tot_col).value = f"=SUM({m_letter}{r}:{n_letter}{r})"
            
            # For Mañanas, Tardes, Noches, Festivos:
            rng = f"{first_day_letter}{r}:{last_day_letter}{r}"
            ws.cell(row=r, column=m_col).value = f'=COUNTIF({rng}, "M*")'
            ws.cell(row=r, column=t_col).value = f'=COUNTIF({rng}, "T*")'
            ws.cell(row=r, column=n_col).value = f'=COUNTIF({rng}, "N*")'
            ws.cell(row=r, column=fest_col).value = f'=COUNTIF({rng}, "*.*")'
            
    wb.save(filename)
    print(f"Successfully fixed and saved {filename}")

