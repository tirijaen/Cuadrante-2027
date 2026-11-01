import json, datetime, calendar

with open("cuadrante_2027.json") as f:
    data = json.load(f)

workers = data["workers"]
dates_str = data["dates"]
matrix = data["matrix"]
dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in dates_str]

holidays = {
    datetime.date(2027, 1, 1): "Año Nuevo",
    datetime.date(2027, 1, 6): "Epifanía del Señor",
    datetime.date(2027, 3, 1): "Día de Andalucía",
    datetime.date(2027, 3, 25): "Jueves Santo",
    datetime.date(2027, 3, 26): "Viernes Santo",
    datetime.date(2027, 4, 23): "Romería Cabeza",
    datetime.date(2027, 4, 26): "Fiesta Local",
    datetime.date(2027, 5, 1): "Fiesta del Trabajo",
    datetime.date(2027, 8, 16): "Asunción de la Virgen",
    datetime.date(2027, 9, 6): "Fiesta Local",
    datetime.date(2027, 10, 12): "Fiesta Nacional",
    datetime.date(2027, 11, 1): "Todos los Santos",
    datetime.date(2027, 12, 6): "Constitución",
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

month_names_es = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
wd_es = ["L", "M", "X", "J", "V", "S", "D"]

for m in range(1, 13):
    m_days = [d_idx for d_idx, dt in enumerate(dates) if dt.month == m]
    print(f"### {m:02d}. {month_names_es[m-1].upper()} 2027\n")
    
    # Headers
    header1 = "| Trabajador | " + " | ".join(f"{dates[d].day:02d}" for d in m_days) + " | Total Días | M | T | N | Festivos |"
    # Header day of week (and * for festivo)
    header_sep = "|:---| " + " | ".join(":---:" for _ in m_days) + " |:---:|:---:|:---:|:---:|:---:|"
    
    print(header1)
    print(header_sep)
    
    # Optional weekday row as first data row or in table
    wd_row = "| Día Semana | " + " | ".join(f"{wd_es[dates[d].weekday()]}{'*' if (dates[d] in holidays or dates[d].weekday() in [5,6]) else ''}" for d in m_days) + " | - | - | - | - | - |"
    print(wd_row)
    
    for w_i, w_name in enumerate(workers):
        m_c = 0
        t_c = 0
        n_c = 0
        f_c = 0
        shifts = []
        for d_idx in m_days:
            s = matrix[w_i][d_idx]
            shifts.append(s)
            if s == "M": m_c += 1
            elif s == "T": t_c += 1
            elif s == "N": n_c += 1
            if is_festivo_shift(dates[d_idx], s):
                f_c += 1
        tot = m_c + t_c + n_c
        row_str = f"| {w_name:10s} | " + " | ".join(f"{s:1s}" for s in shifts) + f" | {tot:2d} | {m_c:2d} | {t_c:2d} | {n_c:2d} | {f_c:2d} |"
        print(row_str)
    print()
