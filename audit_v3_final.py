import json, datetime

with open("cuadrante_2027_v3.json", "r", encoding="utf-8") as f:
    data = json.load(f)

workers = data["workers"]
dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in data["dates"]]
matrix_plain = data["matrix"]
matrix_dot = data["matrix_dot"]
w_map = {name: i for i, name in enumerate(workers)}

holidays = {
    datetime.date(2027, 1, 1), datetime.date(2027, 1, 6), datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25), datetime.date(2027, 3, 26),
    datetime.date(2027, 4, 26), datetime.date(2027, 5, 1), datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6), datetime.date(2027, 10, 12), datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6), datetime.date(2027, 12, 8), datetime.date(2027, 12, 25),
}

errors = []

# 1. 220 days for regular workers and Hilario, 80-88 for Extra 1
for w_i, w_name in enumerate(workers):
    days = sum(1 for s in matrix_plain[w_i] if s.strip() != "")
    if w_name == "Extra 1":
        if not (80 <= days <= 88):
            errors.append(f"Extra 1 tiene {days} días (debe estar entre 80 y 88)")
    else:
        if days != 220:
            errors.append(f"{w_name} tiene {days} días (debe ser exactamente 220)")

# 2. Hilario: no N, no fines de semana, no festivos
h_idx = w_map["Hilario"]
for d_idx, dt in enumerate(dates):
    s = matrix_plain[h_idx][d_idx].strip()
    if s == "N": errors.append(f"Hilario trabaja de noche el {dt}")
    if dt.weekday() in (5, 6) or dt in holidays:
        if s != "": errors.append(f"Hilario trabaja en fin de semana o festivo el {dt}")

# 3. Extra 1: no trabaja fuera de verano, no noches ni findes en junio 1-14, hasta 22 días/mes
e_idx = w_map["Extra 1"]
for d_idx, dt in enumerate(dates):
    s = matrix_plain[e_idx][d_idx].strip()
    if dt.month not in (6, 7, 8, 9) and s != "":
        errors.append(f"Extra 1 trabaja fuera de verano el {dt}")
    if dt.month == 6 and 1 <= dt.day <= 14:
        if s == "N": errors.append(f"Extra 1 trabaja de noche en periodo de aprendizaje el {dt}")
        if (dt.weekday() in (5, 6) or dt in holidays) and s != "":
            errors.append(f"Extra 1 trabaja en fin de semana o festivo en periodo de aprendizaje el {dt}")

# 3.1 Límites estrictos de días trabajados al mes: NUNCA 22 días para regulares e Hilario
vac_months_map = {
    "Antonio J": [6, 8], "Miguel B": [6, 8], "Paco C": [6, 8], "Fran Espin": [6, 8],
    "A. Leon": [7, 9], "Hilario": [7, 9], "Santi M": [7, 9], "Alberto H": [7, 9]
}
for w_i, w_name in enumerate(workers):
    if w_name == "Extra 1":
        for m in [6, 7, 8, 9]:
            m_days = sum(1 for d_idx, dt in enumerate(dates) if dt.month == m and matrix_plain[w_i][d_idx].strip() != "")
            if m_days > 22 or m_days < 18:
                errors.append(f"Extra 1 tiene {m_days} días en mes {m} (debe estar entre 18 y 22)")
    else:
        v_months = vac_months_map.get(w_name, [])
        for m in range(1, 13):
            m_days = sum(1 for d_idx, dt in enumerate(dates) if dt.month == m and matrix_plain[w_i][d_idx].strip() != "")
            if m in v_months:
                if not (9 <= m_days <= 12):
                    errors.append(f"{w_name} tiene {m_days} días en mes {m} de vacaciones (debe estar entre 9 y 12)")
            else:
                if m_days >= 22:
                    errors.append(f"VIOLACIÓN LÍMITE ESTRICTO: {w_name} tiene {m_days} días en mes {m} (NUNCA 22 días)")
                if m_days < 18 or m_days > 21:
                    errors.append(f"{w_name} tiene {m_days} días en mes {m} (debe estar entre 18 y 21)")

# 4. Vacaciones y víspera
vacations = [
    ("Antonio J", [(6, 1, 15), (8, 1, 15)]),
    ("Miguel B",  [(6, 1, 15), (8, 1, 15)]),
    ("Paco C",    [(6, 16, 30), (8, 16, 30)]),
    ("Fran Espin",[(6, 16, 30), (8, 16, 30)]),
    ("A. Leon",   [(7, 1, 15), (9, 1, 15)]),
    ("Hilario",   [(7, 1, 15), (9, 1, 15)]),
    ("Santi M",   [(7, 16, 30), (9, 16, 30)]),
    ("Alberto H", [(7, 16, 30), (9, 16, 30)]),
]
for w_name, periods in vacations:
    w_i = w_map[w_name]
    for (m, s_d, e_d) in periods:
        for d_idx, dt in enumerate(dates):
            if dt.month == m and s_d <= dt.day <= e_d:
                if matrix_plain[w_i][d_idx].strip() != "":
                    errors.append(f"{w_name} trabaja durante sus vacaciones el {dt}")
        v_start = datetime.date(2027, m, s_d)
        db = v_start - datetime.timedelta(days=1)
        if db >= dates[0]:
            db_idx = (db - dates[0]).days
            if matrix_plain[w_i][db_idx].strip() == "N":
                errors.append(f"{w_name} hace noche la víspera de vacaciones ({db})")

# 5. Descanso entre turnos (12h)
for w_i, w_name in enumerate(workers):
    for d_idx in range(len(dates) - 1):
        s1 = matrix_plain[w_i][d_idx].strip()
        s2 = matrix_plain[w_i][d_idx + 1].strip()
        if s1 == "T" and s2 == "M":
            errors.append(f"{w_name} hace Tarde seguido de Mañana el {dates[d_idx]} y {dates[d_idx+1]}")
        if s1 == "N" and s2 in ("M", "T"):
            errors.append(f"{w_name} hace Noche seguido de {s2} el {dates[d_idx]} y {dates[d_idx+1]}")

# 6. EXACTAMENTE 2 DÍAS DE DESCANSO TRAS NOCHES
for w_i, w_name in enumerate(workers):
    if w_name == "Hilario": continue
    shifts = [s.strip() for s in matrix_plain[w_i]]
    for d_idx in range(len(dates) - 2):
        if shifts[d_idx] == "N" and shifts[d_idx + 1] != "N":
            if shifts[d_idx + 1] != "":
                errors.append(f"{w_name} no descansa el día 1 tras salir de noche el {dates[d_idx+1]}")
            if shifts[d_idx + 2] != "":
                errors.append(f"{w_name} no descansa el día 2 tras salir de noche el {dates[d_idx+2]}")

# 7. Máximo de días consecutivos trabajados: 5 para titulares/Hilario, 6 para Extra 1 (con 2 descansos tras 6 días)
for w_i, w_name in enumerate(workers):
    consec = 0
    max_allowed = 6 if w_name == "Extra 1" else 5
    for d_idx, s in enumerate(matrix_plain[w_i]):
        if s.strip() != "":
            consec += 1
            if consec > max_allowed:
                errors.append(f"{w_name} trabaja más de {max_allowed} días seguidos (alcanza {consec} días el {dates[d_idx]})")
            if w_name == "Extra 1" and consec == 6:
                if d_idx + 1 < len(dates) and matrix_plain[w_i][d_idx + 1].strip() != "":
                    errors.append(f"Extra 1 no descansa el día 1 tras 6 días consecutivos el {dates[d_idx+1]}")
                if d_idx + 2 < len(dates) and matrix_plain[w_i][d_idx + 2].strip() != "":
                    errors.append(f"Extra 1 no descansa el día 2 tras 6 días consecutivos el {dates[d_idx+2]}")
        else:
            consec = 0

# 8. Fines de semana sin partir (V_N to D_T)
weekends = []
for d_idx, dt in enumerate(dates[:-2]):
    if dt.weekday() == 4: weekends.append((d_idx, d_idx + 1, d_idx + 2))

broken_weekends = 0
for w_i, w_name in enumerate(workers):
    for fri, sat, sun in weekends:
        cnt = 0
        if matrix_plain[w_i][fri] == "N": cnt += 1
        if matrix_plain[w_i][sat] in ("M", "T", "N"): cnt += 1
        if matrix_plain[w_i][sun] in ("M", "T"): cnt += 1
        if cnt == 1:
            broken_weekends += 1
            errors.append(f"{w_name} tiene fin de semana partido en {dates[fri]}..{dates[sun]}")

# 9. Coberturas diarias: exactamente 1N todos los días
for d_idx, dt in enumerate(dates):
    n_cnt = sum(1 for w_i in range(len(workers)) if matrix_plain[w_i][d_idx].strip() == "N")
    if n_cnt != 1:
        errors.append(f"El día {dt} tiene {n_cnt} noches (debe tener exactamente 1)")

# 10. REGLAS ESPECÍFICAS DE USUARIO
# Antonio J evento 2 de mayo y sin noche 1 de mayo
d_02may = (datetime.date(2027, 5, 2) - dates[0]).days
d_01may = (datetime.date(2027, 5, 1) - dates[0]).days
if matrix_plain[w_map["Antonio J"]][d_02may].strip() != "":
    errors.append("Antonio J no está libre el 2 de mayo")
if matrix_plain[w_map["Antonio J"]][d_01may].strip() == "N":
    errors.append("Antonio J hace turno de noche el 1 de mayo")

# Antonio J el 24 de diciembre solo mañana (si trabaja)
d_24dec = (datetime.date(2027, 12, 24) - dates[0]).days
if matrix_plain[w_map["Antonio J"]][d_24dec].strip() in ("T", "N"):
    errors.append(f"Antonio J trabaja {matrix_plain[w_map['Antonio J']][d_24dec]} el 24 de diciembre (solo puede Mañana)")

# Antonio J el 31 de diciembre noche
d_31dec = (datetime.date(2027, 12, 31) - dates[0]).days
if matrix_plain[w_map["Antonio J"]][d_31dec].strip() != "N":
    errors.append("Antonio J no hace noche el 31 de diciembre")

# Extra 1 noches de Feria (3, 4, 5, 6 de septiembre)
for ds in (3, 4, 5, 6):
    d_sep = (datetime.date(2027, 9, ds) - dates[0]).days
    if matrix_plain[w_map["Extra 1"]][d_sep].strip() != "N":
        errors.append(f"Extra 1 no hace noche de feria el {ds} de septiembre")

# Fran Espin evento 29 mayo
d_29may = (datetime.date(2027, 5, 29) - dates[0]).days
d_28may = (datetime.date(2027, 5, 28) - dates[0]).days
if matrix_plain[w_map["Fran Espin"]][d_29may].strip() != "":
    errors.append("Fran Espin no está libre el 29 de mayo")
if matrix_plain[w_map["Fran Espin"]][d_28may].strip() == "N":
    errors.append("Fran Espin hace noche el 28 de mayo")

# Miguel B evento 31 octubre
d_31oct = (datetime.date(2027, 10, 31) - dates[0]).days
d_30oct = (datetime.date(2027, 10, 30) - dates[0]).days
if matrix_plain[w_map["Miguel B"]][d_31oct].strip() != "":
    errors.append("Miguel B no está libre el 31 de octubre")
if matrix_plain[w_map["Miguel B"]][d_30oct].strip() == "N":
    errors.append("Miguel B hace noche el 30 de octubre")

# 1 Noviembre Antonio J y A. Leon en diurno
d_01nov = (datetime.date(2027, 11, 1) - dates[0]).days
if matrix_plain[w_map["Antonio J"]][d_01nov].strip() not in ("M", "T"):
    errors.append("Antonio J no está en diurno el 1 de noviembre")
if matrix_plain[w_map["A. Leon"]][d_01nov].strip() not in ("M", "T"):
    errors.append("A. Leon no está en diurno el 1 de noviembre")

# 23 de Abril: Laborable ordinario con 3M, 2T, 1N
d_23apr = (datetime.date(2027, 4, 23) - dates[0]).days
m_workers_23 = [workers[i] for i in range(len(workers)) if matrix_plain[i][d_23apr].strip() == "M"]
t_workers_23 = [workers[i] for i in range(len(workers)) if matrix_plain[i][d_23apr].strip() == "T"]
n_workers_23 = [workers[i] for i in range(len(workers)) if matrix_plain[i][d_23apr].strip() == "N"]

if sorted(m_workers_23) != sorted(["Alberto H", "Hilario", "Miguel B"]):
    errors.append(f"23 de Abril Mañanas incorrectas: {m_workers_23} (debe ser Alberto H, Hilario, Miguel B)")
if sorted(t_workers_23) != sorted(["Fran Espin", "Santi M"]):
    errors.append(f"23 de Abril Tardes incorrectas: {t_workers_23} (debe ser Fran Espin, Santi M)")
if n_workers_23 != ["A. Leon"]:
    errors.append(f"23 de Abril Noches incorrectas: {n_workers_23} (debe ser A. Leon)")

print("=== FINAL COMPREHENSIVE AUDIT REPORT ===")
print(f"Total de errores detectados: {len(errors)}")
print(f"Total fines de semana partidos: {broken_weekends}")
if len(errors) == 0:
    print("¡TODO EL CUADRANTE CUMPLE EL 100% DE LAS RESTRICCIONES DE FORMA IMPECABLE (0 ERRORES)!")
else:
    for e in errors[:10]:
        print(" -", e)

