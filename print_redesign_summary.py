import json, datetime

with open("cuadrante_2027.json") as f:
    data = json.load(f)

workers = data["workers"]
dates_str = data["dates"]
matrix_dot = data["matrix_dot"]
matrix = data["matrix"]
dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in dates_str]

print("| Trabajador | Días Anuales | Horas Totales | Mañanas (h) | Tardes (h) | Noches (h) | Festivos (.) (h) | Libranzas |")
print("|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|")

for w_i, w_name in enumerate(workers):
    m_c = sum(1 for s in matrix[w_i] if s == "M")
    t_c = sum(1 for s in matrix[w_i] if s == "T")
    n_c = sum(1 for s in matrix[w_i] if s == "N")
    tot_d = m_c + t_c + n_c
    tot_h = tot_d * 8
    f_c = sum(1 for s in matrix_dot[w_i] if "." in s)
    f_h = f_c * 8
    libranzas = len(dates) - tot_d
    print(f"| {w_name:10s} | {tot_d:3d} días | {tot_h:4d} h | {m_c:2d} ({m_c*8}h) | {t_c:2d} ({t_c*8}h) | {n_c:2d} ({n_c*8}h) | {f_c:2d} ({f_h:3d}h) | {libranzas:3d} días |")
