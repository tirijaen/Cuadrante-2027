import datetime, calendar, json
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from ortools.sat.python import cp_model

start_date = datetime.date(2027, 1, 1)
end_date = datetime.date(2027, 12, 31)
total_days = (end_date - start_date).days + 1
dates = [start_date + datetime.timedelta(days=i) for i in range(total_days)]
def d_idx(y, m, d): return (datetime.date(y, m, d) - start_date).days

# Festivos oficiales 2027 (sin 15 de Mayo San Eufrasio)
holidays = {
    datetime.date(2027, 1, 1), datetime.date(2027, 1, 6), datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25), datetime.date(2027, 3, 26), datetime.date(2027, 4, 23),
    datetime.date(2027, 4, 26), datetime.date(2027, 5, 1), datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6), datetime.date(2027, 10, 12), datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6), datetime.date(2027, 12, 8), datetime.date(2027, 12, 25),
}

def is_festivo_shift(d, s):
    if s == 0: return False
    wd = d.weekday()
    is_hol = d in holidays
    if is_hol and s in [1, 2]: return True
    if wd == 4 and s == 3: return True
    if wd == 5: return True
    if wd == 6 and s in [1, 2]: return True
    return False

workers = ['Antonio J', 'Santi M', 'Alberto H', 'Fran Espin', 'Miguel B', 'Paco C', 'A. Leon', 'Hilario', 'Extra 1']
n_workers = len(workers)
w_map = {name: i for i, name in enumerate(workers)}

print("=== INICIANDO OPTIMIZACIÓN DEL CUADRANTE 2027 (V5 - EQUIDAD PURA Y SIN SAN EUFRASIO) ===")

vacations = [
    ('Antonio J', [(6, 1, 15), (8, 1, 15)]),
    ('Miguel B',  [(6, 1, 15), (8, 1, 15)]),
    ('Paco C',    [(6, 16, 30), (8, 16, 30)]),
    ('Fran Espin',[(6, 16, 30), (8, 16, 30)]),
    ('A. Leon',   [(7, 1, 15), (9, 1, 15)]),
    ('Hilario',   [(7, 1, 15), (9, 1, 15)]),
    ('Santi M',   [(7, 16, 30), (9, 16, 30)]),
    ('Alberto H', [(7, 16, 30), (9, 16, 30)]),
]

# Candidate pools for daytime festivos (based on minimum historical count and longest time since done)
holiday_candidates = [
    ('2027-01-01', ['A. Leon', 'Paco C', 'Alberto H', 'Antonio J']),
    ('2027-01-06', ['A. Leon', 'Alberto H', 'Antonio J', 'Santi M']),
    ('2027-03-01', ['Santi M', 'Fran Espin', 'Paco C', 'Alberto H']),
    ('2027-03-25', ['Antonio J', 'Santi M', 'Fran Espin', 'Paco C']),
    ('2027-03-26', ['Antonio J', 'Santi M', 'Fran Espin', 'Paco C']),
    ('2027-03-27', ['Antonio J', 'Santi M', 'Fran Espin', 'Paco C']),
    ('2027-03-28', ['Antonio J', 'Santi M', 'Fran Espin', 'Paco C']),
    ('2027-04-23', ['Alberto H', 'Paco C', 'Antonio J', 'Fran Espin']),
    ('2027-04-24', ['Alberto H', 'Paco C', 'Antonio J', 'Fran Espin']),
    ('2027-04-25', ['Alberto H', 'Paco C', 'Antonio J', 'Fran Espin']),
    ('2027-04-26', ['Alberto H', 'Paco C', 'Antonio J', 'Fran Espin']),
    ('2027-05-01', ['A. Leon', 'Alberto H', 'Miguel B', 'Fran Espin']),
    ('2027-08-16', ['Santi M', 'Miguel B', 'Alberto H', 'Extra 1', 'Antonio J']),
    ('2027-09-04', ['Antonio J', 'Paco C', 'Miguel B', 'Alberto H', 'Fran Espin']),
    ('2027-09-05', ['Antonio J', 'Paco C', 'Miguel B', 'Alberto H', 'Fran Espin']),
    ('2027-09-06', ['Antonio J', 'Paco C', 'Miguel B', 'Alberto H', 'Fran Espin']),
    ('2027-10-12', ['A. Leon', 'Miguel B', 'Paco C', 'Santi M', 'Fran Espin']),
    ('2027-11-01', ['Antonio J', 'A. Leon']), # Highest priority (only two with 3 times)
    ('2027-12-06', ['Paco C', 'Fran Espin', 'Antonio J', 'Santi M', 'Alberto H']),
    ('2027-12-08', ['Paco C', 'Santi M', 'A. Leon', 'Miguel B', 'Antonio J']),
    ('2027-12-25', ['Miguel B', 'Fran Espin', 'Antonio J', 'Alberto H', 'Paco C']),
]

max_attempts = 15
solved = False

for attempt in range(1, max_attempts + 1):
    seed = attempt * 17 + 3
    
    # --- STAGE 1: NOCHES ---
    m1 = cp_model.CpModel()
    n = {}
    for w in range(n_workers):
        for d in range(total_days):
            n[w, d] = m1.NewBoolVar(f'n_{w}_{d}')

    for d in range(total_days):
        m1.Add(sum(n[w, d] for w in range(n_workers)) == 1)

    for d in range(total_days): m1.Add(n[w_map['Hilario'], d] == 0)

    for d, dt in enumerate(dates):
        if dt.month not in [6, 7, 8, 9] or (dt.month == 6 and dt.day <= 14):
            m1.Add(n[w_map['Extra 1'], d] == 0)

    for w_name, periods in vacations:
        w_i = w_map[w_name]
        for (m, s_day, e_day) in periods:
            for d, dt in enumerate(dates):
                if dt.month == m and s_day <= dt.day <= e_day:
                    m1.Add(n[w_i, d] == 0)
            v_start = datetime.date(2027, m, s_day)
            db = v_start - datetime.timedelta(days=1)
            if db >= start_date:
                m1.Add(n[w_i, (db - start_date).days] == 0)

    # Noches señaladas oficiales (equidad pura)
    m1.Add(n[w_map['Santi M'], d_idx(2027, 1, 1)] == 1) # Mínimo acumulado (1 vez)
    for d in [25, 26, 27]: m1.Add(n[w_map['Miguel B'], d_idx(2027, 3, d)] == 1) # Mínimo acumulado (2 veces, desde 2020)
    for d in [23, 24, 25]: m1.Add(n[w_map['A. Leon'], d_idx(2027, 4, d)] == 1) # Mínimo acumulado (2 veces, desde 2021)
    m1.Add(n[w_map['Alberto H'], d_idx(2027, 12, 24)] == 1) # 2 veces, turno rotativo
    m1.Add(n[w_map['Antonio J'], d_idx(2027, 12, 31)] == 1) # 2 veces, no la hace desde 2020

    # Eventos personales blindados
    m1.Add(n[w_map['Fran Espin'], d_idx(2027, 5, 28)] == 0)
    m1.Add(n[w_map['Fran Espin'], d_idx(2027, 5, 29)] == 0)
    m1.Add(n[w_map['Miguel B'], d_idx(2027, 10, 30)] == 0)
    m1.Add(n[w_map['Miguel B'], d_idx(2027, 10, 31)] == 0)
    m1.Add(n[w_map['Antonio J'], d_idx(2027, 5, 1)] == 0)
    m1.Add(n[w_map['Antonio J'], d_idx(2027, 5, 2)] == 0)

    # Extra 1 candidato preferente en noches de Feria (3, 4, 5, 6 Sep)
    for d_sep in [3, 4, 5, 6]:
        m1.Add(n[w_map['Extra 1'], d_idx(2027, 9, d_sep)] == 1)

    # Extra 1 inicia noches 15-17 junio para relevo de vacaciones
    for d_jun in [15, 16, 17]:
        m1.Add(n[w_map['Extra 1'], d_idx(2027, 6, d_jun)] == 1)

    # Restricciones ergonómicas de noches
    for w in range(n_workers):
        if workers[w] == 'Hilario': continue
        for d in range(total_days - 1):
            is_start = m1.NewBoolVar(f'st_{w}_{d}')
            if d == 0: m1.Add(is_start == n[w, d])
            else:
                m1.Add(is_start <= n[w, d])
                m1.Add(is_start <= n[w, d-1].Not())
                m1.Add(is_start >= n[w, d] - n[w, d-1])
            m1.Add(n[w, d+1] == 1).OnlyEnforceIf(is_start)
            if d < total_days - 4:
                m1.Add(sum(n[w, d+k] for k in range(5)) <= 4)

    for w in range(n_workers):
        for m in range(1, 13):
            m1.Add(sum(n[w, d] for d, dt in enumerate(dates) if dt.month == m) <= 7)

    for d, dt in enumerate(dates[:-2]):
        if dt.weekday() == 4:
            for w in range(n_workers):
                m1.Add(n[w, d] == n[w, d+1])

    d_01may = d_idx(2027, 5, 1)
    d_02may = d_idx(2027, 5, 2)
    for w in range(n_workers):
        m1.Add(n[w, d_01may] == n[w, d_02may])

    gap_days = 7
    for w in range(n_workers):
        if workers[w] == 'Hilario': continue
        for d in range(total_days - 1):
            for k in range(1, gap_days + 1):
                if d + k < total_days:
                    m1.Add(n[w, d] - n[w, d+1] + n[w, d+k] <= 1)

    reg = [w for w in range(n_workers - 1) if workers[w] != 'Hilario']
    min_n = m1.NewIntVar(45, 55, 'min_n')
    max_n = m1.NewIntVar(45, 55, 'max_n')
    m1.Add(max_n - min_n <= 3)
    for w in reg:
        tot = sum(n[w, d] for d in range(total_days))
        m1.Add(tot >= min_n)
        m1.Add(tot <= max_n)

    fn_list = []
    for w in range(n_workers):
        if workers[w] != 'Hilario':
            for d in range(total_days - 3):
                fn = m1.NewBoolVar(f'fn_{w}_{d}')
                m1.Add(sum(n[w, d+k] for k in range(4)) == 4).OnlyEnforceIf(fn)
                m1.Add(sum(n[w, d+k] for k in range(4)) < 4).OnlyEnforceIf(fn.Not())
                fn_list.append(fn)

    m1.Minimize(sum(fn_list) * 1000 + (max_n - min_n) * 100)

    s1 = cp_model.CpSolver()
    s1.parameters.max_time_in_seconds = 8.0
    s1.parameters.random_seed = seed
    st1 = s1.Solve(m1)

    if st1 not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        continue

    fixed_n = {}
    for w in range(n_workers):
        for d in range(total_days):
            fixed_n[w, d] = s1.Value(n[w, d])

    # --- STAGE 2: DIURNOS (M, T, L) ---
    m2 = cp_model.CpModel()
    x = {}
    for w in range(n_workers):
        for d in range(total_days):
            for s in range(4):
                x[w, d, s] = m2.NewBoolVar(f'x_{w}_{d}_{s}')

    for w in range(n_workers):
        for d in range(total_days):
            m2.Add(sum(x[w, d, s] for s in range(4)) == 1)
            m2.Add(x[w, d, 3] == fixed_n[w, d])

    for w_name, periods in vacations:
        wi = w_map[w_name]
        for (m, s_day, e_day) in periods:
            for d, dt in enumerate(dates):
                if dt.month == m and s_day <= dt.day <= e_day:
                    m2.Add(x[wi, d, 0] == 1)

    for d, dt in enumerate(dates):
        if dt.month not in [6, 7, 8, 9]: m2.Add(x[w_map['Extra 1'], d, 0] == 1)
        if dt.month == 6 and 1 <= dt.day <= 14:
            wd = dt.weekday()
            if wd in [5, 6] or (dt in holidays): m2.Add(x[w_map['Extra 1'], d, 0] == 1)
        wd = dt.weekday()
        if wd in [5, 6] or (dt in holidays): m2.Add(x[w_map['Hilario'], d, 0] == 1)

    for w in range(n_workers):
        for d in range(total_days - 1):
            m2.Add(x[w, d, 2] + x[w, d+1, 1] <= 1)
            m2.Add(x[w, d, 3] + x[w, d+1, 1] <= 1)
            m2.Add(x[w, d, 3] + x[w, d+1, 2] <= 1)

    # 2 días libres tras noche
    for w in range(n_workers):
        if workers[w] == 'Hilario': continue
        for d in range(total_days - 2):
            if fixed_n[w, d] == 1 and fixed_n[w, d+1] == 0:
                m2.Add(x[w, d+1, 0] == 1)
                m2.Add(x[w, d+2, 0] == 1)

    # Coberturas diarias
    for d, dt in enumerate(dates):
        wd = dt.weekday()
        is_hol = (dt in holidays) or (dt == datetime.date(2027, 4, 23))
        is_summer = dt.month in [6, 7, 8, 9]
        if wd in [5, 6] or is_hol:
            m2.Add(sum(x[w, d, 1] for w in range(n_workers)) == 1)
            m2.Add(sum(x[w, d, 2] for w in range(n_workers)) == 1)
        else:
            if is_summer and wd in [2, 3, 4]:
                m_sum = sum(x[w, d, 1] for w in range(n_workers))
                m2.Add(m_sum >= 2)
                m2.Add(m_sum <= 3)
                t_sum = sum(x[w, d, 2] for w in range(n_workers))
                m2.Add(t_sum >= 2)
                m2.Add(t_sum <= 3)
            else:
                m2.Add(sum(x[w, d, 1] for w in range(n_workers)) == 3)
                t_sum = sum(x[w, d, 2] for w in range(n_workers))
                m2.Add(t_sum >= 2)
                m2.Add(t_sum <= 3)

    # Asignaciones de festivos señalados usando candidate pools
    for dt_str, cand_list in holiday_candidates:
        d = d_idx(int(dt_str[:4]), int(dt_str[5:7]), int(dt_str[8:10]))
        # Exactly 2 of the candidates must work M or T
        cand_indices = [w_map[c] for c in cand_list]
        m2.Add(sum(x[ci, d, 1] + x[ci, d, 2] for ci in cand_indices) == 2)
        # Workers outside candidate pool cannot work M or T on this holiday (unless Hilario on weekdays)
        for w in range(n_workers):
            if w not in cand_indices and workers[w] != 'Hilario':
                m2.Add(x[w, d, 1] + x[w, d, 2] == 0)

    # Eventos personales blindados
    m2.Add(x[w_map['Antonio J'], d_idx(2027, 5, 2), 0] == 1)
    m2.Add(x[w_map['Fran Espin'], d_idx(2027, 5, 29), 0] == 1)
    m2.Add(x[w_map['Miguel B'], d_idx(2027, 10, 31), 0] == 1)

    # Regla específica Antonio J: 24 Dic solo Mañana o libre
    d_24dec = d_idx(2027, 12, 24)
    m2.Add(x[w_map['Antonio J'], d_24dec, 2] == 0)
    m2.Add(x[w_map['Antonio J'], d_24dec, 3] == 0)

    # 0 FINES DE SEMANA PARTIDOS
    weekends = []
    for d, dt in enumerate(dates[:-2]):
        if dt.weekday() == 4: weekends.append((d, d+1, d+2))
    for w in range(n_workers):
        if workers[w] == 'Hilario': continue
        for (fri, sat, sun) in weekends:
            wknd_sum = (x[w, fri, 3] + x[w, sat, 1] + x[w, sat, 2] + x[w, sat, 3] + x[w, sun, 1] + x[w, sun, 2])
            m2.Add(wknd_sum != 1)

    # Límite días seguidos
    for w in range(n_workers - 1):
        for d in range(total_days - 5):
            m2.Add(sum(x[w, d + k, 0] for k in range(6)) >= 1)

    for d in range(total_days - 6):
        m2.Add(sum(x[w_map['Extra 1'], d + k, 0] for k in range(7)) >= 1)

    # Extra 1 tras 6 días descansa 2
    for d in range(total_days - 7):
        worked_6 = m2.NewBoolVar(f'ext_w6_{d}')
        m2.Add(sum(1 - x[w_map['Extra 1'], d + k, 0] for k in range(6)) == 6).OnlyEnforceIf(worked_6)
        m2.Add(sum(1 - x[w_map['Extra 1'], d + k, 0] for k in range(6)) <= 5).OnlyEnforceIf(worked_6.Not())
        m2.Add(x[w_map['Extra 1'], d + 6, 0] == 1).OnlyEnforceIf(worked_6)
        m2.Add(x[w_map['Extra 1'], d + 7, 0] == 1).OnlyEnforceIf(worked_6)

    # EXACTAMENTE 220 DÍAS ANUALES
    for w in range(n_workers - 1):
        m2.Add(sum(1 - x[w, d, 0] for d in range(total_days)) == 220)

    m2.Add(sum(1 - x[w_map['Extra 1'], d, 0] for d in range(total_days)) >= 80)
    m2.Add(sum(1 - x[w_map['Extra 1'], d, 0] for d in range(total_days)) <= 88)

    # Máximo 22 días al mes en verano para Extra 1
    monthly_days = {m: [d for d, dt in enumerate(dates) if dt.month == m] for m in range(1, 13)}
    for w in range(n_workers):
        w_name = workers[w]
        for m in range(1, 13):
            m_idxs = monthly_days[m]
            worked_in_m = sum(1 - x[w, d, 0] for d in m_idxs)
            if w_name == 'Extra 1':
                if m in [6, 7, 8, 9]:
                    m2.Add(worked_in_m >= 18)
                    m2.Add(worked_in_m <= 22)
                else:
                    m2.Add(worked_in_m == 0)

    # Equidad festivos anuales (diferencia <= 1)
    min_f = m2.NewIntVar(40, 52, 'min_f')
    max_f = m2.NewIntVar(40, 52, 'max_f')
    m2.Add(max_f - min_f <= 1)
    for w in reg:
        f_w = sum(x[w, d, s] for d, dt in enumerate(dates) for s in [1, 2, 3] if is_festivo_shift(dt, s))
        m2.Add(f_w >= min_f)
        m2.Add(f_w <= max_f)

    min_m = m2.NewIntVar(70, 105, 'min_m')
    max_m = m2.NewIntVar(70, 105, 'max_m')
    m2.Add(max_m - min_m <= 5)
    for w in reg:
        m_w = sum(x[w, d, 1] for d in range(total_days))
        m2.Add(m_w >= min_m)
        m2.Add(m_w <= max_m)

    min_t = m2.NewIntVar(70, 105, 'min_t')
    max_t = m2.NewIntVar(70, 105, 'max_t')
    m2.Add(max_t - min_t <= 5)
    for w in reg:
        t_w = sum(x[w, d, 2] for d in range(total_days))
        m2.Add(t_w >= min_t)
        m2.Add(t_w <= max_t)

    h_m = sum(x[w_map['Hilario'], d, 1] for d in range(total_days))
    h_t = sum(x[w_map['Hilario'], d, 2] for d in range(total_days))
    m2.Add(h_m >= 100)
    m2.Add(h_m <= 120)
    m2.Add(h_t >= 100)
    m2.Add(h_t <= 120)

    s2 = cp_model.CpSolver()
    s2.parameters.max_time_in_seconds = 45.0
    s2.parameters.num_workers = 8
    st2 = s2.Solve(m2)
    print(f"Intento {attempt} (seed {seed}): Stage 1={s1.StatusName(st1)} en {s1.WallTime():.2f}s | Stage 2={s2.StatusName(st2)} en {s2.WallTime():.2f}s")
    if st2 in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        print(f"¡EXITO! Cuadrante V5 resuelto con éxito en intento {attempt}.")
        solved = True
        break

if not solved:
    print("ERROR: No se encontró solución factible.")
    exit(1)

# Extracción de matrices
matrix_dot = []
matrix_plain = []
for w in range(n_workers):
    row_dot = []
    row_plain = []
    for d in range(total_days):
        s_val = 0
        for s in [1, 2, 3]:
            if s2.Value(x[w, d, s]) == 1:
                s_val = s
                break
        dt = dates[d]
        is_fest = is_festivo_shift(dt, s_val)
        if s_val == 1:
            row_plain.append("M")
            row_dot.append("M." if is_fest else "M")
        elif s_val == 2:
            row_plain.append("T")
            row_dot.append("T." if is_fest else "T")
        elif s_val == 3:
            row_plain.append("N")
            row_dot.append("N." if is_fest else "N")
        else:
            row_plain.append(" ")
            row_dot.append(" ")
    matrix_dot.append(row_dot)
    matrix_plain.append(row_plain)

# Guardar cuadrante_2027_v3.json y cuadrante_2027.json
c_data = {
    "description": "Cuadrante 2027 Andújar - Versión 5 (Equidad Pura Histórica sin San Eufrasio)",
    "year": 2027,
    "workers": workers,
    "dates": [dt.strftime("%Y-%m-%d") for dt in dates],
    "matrix_dot": matrix_dot,
    "matrix": matrix_plain
}

with open("cuadrante_2027.json", "w", encoding="utf-8") as f:
    json.dump(c_data, f, ensure_ascii=False, indent=2)

with open("cuadrante_2027_v3.json", "w", encoding="utf-8") as f:
    json.dump(c_data, f, ensure_ascii=False, indent=2)

print("Guardado cuadrante_2027.json correctamente.")

# Imprimir métricas
print("\n=== RESUMEN DE AUDITORÍA DE MÉTRICAS ===")
for w in range(n_workers):
    w_name = workers[w]
    tot = sum(1 for s in matrix_plain[w] if s != ' ')
    m_c = sum(1 for s in matrix_plain[w] if s == 'M')
    t_c = sum(1 for s in matrix_plain[w] if s == 'T')
    n_c = sum(1 for s in matrix_plain[w] if s == 'N')
    f_c = sum(1 for s in matrix_dot[w] if '.' in s)
    print(f"{w_name:<12}: Total={tot:3d} | M={m_c:2d} | T={t_c:2d} | N={n_c:2d} | Festivos(.)={f_c:2d}")

# Imprimir asignaciones de festivos señalados
print("\n=== ASIGNACIONES FINALES DE FESTIVOS SEÑALADOS 2027 ===")
for dt_str, cand_list in holiday_candidates:
    d = d_idx(int(dt_str[:4]), int(dt_str[5:7]), int(dt_str[8:10]))
    shifts_on_d = []
    for w in range(n_workers):
        s = matrix_plain[w][d]
        if s in ['M', 'T']:
            shifts_on_d.append(f"{workers[w]} ({s})")
    print(f"{dt_str}: {', '.join(shifts_on_d)}")
