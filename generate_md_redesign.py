import json, datetime, calendar

with open("cuadrante_2027.json") as f:
    data = json.load(f)

workers = data["workers"]
dates_str = data["dates"]
matrix_dot = data["matrix_dot"]
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

month_names_es = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
wd_es = ["L", "M", "X", "J", "V", "S", "D"]

for m in range(1, 13):
    m_days = [d_idx for d_idx, dt in enumerate(dates) if dt.month == m]
    print(f"### {m:02d}. {month_names_es[m-1].upper()} 2027\n")
    
    header1 = "| Trabajador | " + " | ".join(f"{dates[d].day:02d}" for d in m_days) + " | Total Días | M | T | N | Festivos (.) |"
    header_sep = "|:---| " + " | ".join(":---:" for _ in m_days) + " |:---:|:---:|:---:|:---:|:---:|"
    
    print(header1)
    print(header_sep)
    
    wd_row = "| Día Semana | " + " | ".join(f"{wd_es[dates[d].weekday()]}{'*' if (dates[d] in holidays or dates[d].weekday() in [5,6]) else ''}" for d in m_days) + " | - | - | - | - | - |"
    print(wd_row)
    
    for w_i, w_name in enumerate(workers):
        m_c = 0
        t_c = 0
        n_c = 0
        f_c = 0
        shifts = []
        for d_idx in m_days:
            s = matrix_dot[w_i][d_idx]
            shifts.append(s)
            if "M" in s: m_c += 1
            elif "T" in s: t_c += 1
            elif "N" in s: n_c += 1
            if "." in s:
                f_c += 1
        tot = m_c + t_c + n_c
        row_str = f"| {w_name:10s} | " + " | ".join(f"{s:2s}" for s in shifts) + f" | {tot:2d} | {m_c:2d} | {t_c:2d} | {n_c:2d} | {f_c:2d} |"
        print(row_str)
    print()
