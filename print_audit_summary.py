import json, datetime

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

print("| Trabajador | Días Anuales | Horas Totales | Mañanas (h) | Tardes (h) | Noches (h) | Festivos (días) | Festivos (h) | Libranzas |")
print("|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|")

for w_i, w_name in enumerate(workers):
    m_c = matrix[w_i].count("M")
    t_c = matrix[w_i].count("T")
    n_c = matrix[w_i].count("N")
    tot_d = m_c + t_c + n_c
    tot_h = tot_d * 8
    f_c = sum(1 for d_i in range(len(dates)) if is_festivo_shift(dates[d_i], matrix[w_i][d_i]))
    f_h = f_c * 8
    libranzas = len(dates) - tot_d
    print(f"| {w_name:10s} | {tot_d:3d} días | {tot_h:4d} h | {m_c:2d} ({m_c*8}h) | {t_c:2d} ({t_c*8}h) | {n_c:2d} ({n_c*8}h) | {f_c:2d} días | {f_h:3d} h | {libranzas:3d} días |")
