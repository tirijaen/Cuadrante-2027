"""
Solver Oficial V6 - Cuadrante 2027 Andújar
Ajuste definitivo de Feria:
- Festivo local de Andújar: 13 de Septiembre (en lugar de 6 de Septiembre).
- Feria diurna: 11, 12 y 13 de Septiembre (Paco Cantarero Mañana y Antonio Jesús Sánchez Tarde).
- Feria nocturna: 10, 11, 12 y 13 de Septiembre (Extra 1).
- 100% de cumplimiento de todas las reglas del cuadrante.
"""
import datetime, json, subprocess
from ortools.sat.python import cp_model

# 1. Cargar datos base desde git HEAD
raw = subprocess.check_output(['git', 'show', 'HEAD:cuadrante_2027_v3.json']).decode('utf-8')
data = json.loads(raw)
workers = data['workers']
dates_str = data['dates']
dates = [datetime.datetime.strptime(d, '%Y-%m-%d').date() for d in dates_str]
matrix = data['matrix']
n_workers = len(workers)
total_days = len(dates)
w_map = {w: i for i, w in enumerate(workers)}

# 2. Festivos oficiales actualizados (13 de Septiembre festivo local)
holidays = {
    datetime.date(2027, 1, 1), datetime.date(2027, 1, 6), datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25), datetime.date(2027, 3, 26),
    datetime.date(2027, 4, 26), datetime.date(2027, 5, 1), datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 13), datetime.date(2027, 10, 12), datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6), datetime.date(2027, 12, 8), datetime.date(2027, 12, 25),
}

sep_dates = [d for d in dates if d.month == 9]
n_sep = len(sep_dates) # 30

model = cp_model.CpModel()
x = {}
for w in range(n_workers):
    for d in range(n_sep):
        for s in range(4): # 0: Descanso, 1: M, 2: T, 3: N
            x[w, d, s] = model.NewBoolVar(f'x_{w}_{d}_{s}')
        model.Add(sum(x[w, d, s] for s in range(4)) == 1)

# Frontera 31 de Agosto:
# Miguel B hizo noche el 31 de Agosto -> Debe descansar 1 y 2 de Septiembre
model.Add(x[w_map['Miguel B'], 0, 0] == 1)
model.Add(x[w_map['Miguel B'], 1, 0] == 1)
# Extra 1 hizo Tarde el 31 de Agosto -> No puede hacer Mañana el 1 de Septiembre (12h)
model.Add(x[w_map['Extra 1'], 0, 1] == 0)

# Vacaciones en Septiembre:
# A. Leon & Hilario: 1 al 15 de Septiembre (d=0..14)
for d in range(15):
    model.Add(x[w_map['A. Leon'], d, 0] == 1)
    model.Add(x[w_map['Hilario'], d, 0] == 1)

# Santi M & Alberto H: 16 al 30 de Septiembre (d=15..29)
for d in range(15, 30):
    model.Add(x[w_map['Santi M'], d, 0] == 1)
    model.Add(x[w_map['Alberto H'], d, 0] == 1)

# Víspera de vacaciones: sin noche
model.Add(x[w_map['Santi M'], 14, 3] == 0)
model.Add(x[w_map['Alberto H'], 14, 3] == 0)

# Hilario: sin noches, ni fines de semana, ni festivos
for d, dt in enumerate(sep_dates):
    model.Add(x[w_map['Hilario'], d, 3] == 0)
    if dt.weekday() in [5, 6] or dt in holidays:
        model.Add(x[w_map['Hilario'], d, 0] == 1)

# Cobertura diaria en Septiembre
for d, dt in enumerate(sep_dates):
    wd = dt.weekday()
    is_hol = (dt in holidays)
    model.Add(sum(x[w, d, 3] for w in range(n_workers)) == 1)
    if wd in [5, 6] or is_hol:
        model.Add(sum(x[w, d, 1] for w in range(n_workers)) == 1)
        model.Add(sum(x[w, d, 2] for w in range(n_workers)) == 1)
    else:
        if wd in [2, 3, 4]: # Mié, Jue, Vie verano
            m_sum = sum(x[w, d, 1] for w in range(n_workers))
            model.Add(m_sum >= 2); model.Add(m_sum <= 3)
            t_sum = sum(x[w, d, 2] for w in range(n_workers))
            model.Add(t_sum >= 2); model.Add(t_sum <= 3)
        else: # Lun, Mar verano
            model.Add(sum(x[w, d, 1] for w in range(n_workers)) == 3)
            t_sum = sum(x[w, d, 2] for w in range(n_workers))
            model.Add(t_sum >= 2); model.Add(t_sum <= 3)

# Descanso de 12 horas entre turnos:
for w in range(n_workers):
    for d in range(n_sep - 1):
        model.Add(x[w, d, 2] + x[w, d+1, 1] <= 1)
        model.Add(x[w, d, 3] + x[w, d+1, 1] <= 1)
        model.Add(x[w, d, 3] + x[w, d+1, 2] <= 1)

# Doble descanso obligatorio tras salir de noche:
for w in range(n_workers):
    if workers[w] == 'Hilario': continue
    for d in range(n_sep - 2):
        model.Add(x[w, d+1, 0] == 1).OnlyEnforceIf([x[w, d, 3], x[w, d+1, 3].Not()])
        model.Add(x[w, d+2, 0] == 1).OnlyEnforceIf([x[w, d, 3], x[w, d+1, 3].Not()])

# REGLAS DE FERIA:
# Feria diurna: 11, 12 y 13 de Septiembre (d=10, 11, 12)
for d in (10, 11, 12):
    model.Add(x[w_map['Paco C'], d, 1] == 1) # Mañanas
    model.Add(x[w_map['Antonio J'], d, 2] == 1) # Tardes

# Feria nocturna: 10, 11, 12 y 13 de Septiembre (d=9, 10, 11, 12)
for d in (9, 10, 11, 12):
    model.Add(x[w_map['Extra 1'], d, 3] == 1)

# Noches fijadas por calendario:
model.Add(x[w_map['Extra 1'], 28, 3] == 1) # 29 Sep
model.Add(x[w_map['Extra 1'], 29, 3] == 1) # 30 Sep
model.Add(x[w_map['Santi M'], 0, 3] == 1)  # 1 Sep
model.Add(x[w_map['Santi M'], 1, 3] == 1)  # 2 Sep

# Cuotas exactas de noches en Septiembre (49 noches anuales para regulares, 22 para Extra 1):
sep_night_quotas = {
    'Antonio J': 2,
    'Santi M': 2,
    'Alberto H': 2,
    'Fran Espin': 5,
    'Miguel B': 5,
    'Paco C': 5,
    'A. Leon': 3,
    'Hilario': 0,
    'Extra 1': 6
}
for w_name, q in sep_night_quotas.items():
    model.Add(sum(x[w_map[w_name], d, 3] for d in range(n_sep)) == q)

# Cuotas exactas de días trabajados en Septiembre (220 anuales para regulares y límites de 18-21 días/mes):
sep_day_quotas = {
    'Antonio J': 21,
    'Santi M': 9,
    'Alberto H': 10,
    'Fran Espin': 21,
    'Miguel B': 18,
    'Paco C': 20,
    'A. Leon': 11,
    'Hilario': 11,
    'Extra 1': 20
}
for w_name, q in sep_day_quotas.items():
    model.Add(sum(1 - x[w_map[w_name], d, 0] for d in range(n_sep)) == q)

# Máximo de días consecutivos trabajados: 5 para regulares/Hilario, 6 para Extra 1 (con 2 descansos tras 6 días)
for w in range(n_workers):
    w_name = workers[w]
    if w_name == 'Extra 1':
        for d in range(n_sep - 6):
            model.Add(sum(1 - x[w, d+k, 0] for k in range(7)) <= 6)
            is_6 = model.NewBoolVar(f'e6_{w}_{d}')
            model.Add(sum(1 - x[w, d+k, 0] for k in range(6)) == 6).OnlyEnforceIf(is_6)
            model.Add(sum(1 - x[w, d+k, 0] for k in range(6)) < 6).OnlyEnforceIf(is_6.Not())
            if d + 6 < n_sep: model.Add(x[w, d+6, 0] == 1).OnlyEnforceIf(is_6)
            if d + 7 < n_sep: model.Add(x[w, d+7, 0] == 1).OnlyEnforceIf(is_6)
    else:
        for d in range(n_sep - 5):
            model.Add(sum(1 - x[w, d+k, 0] for k in range(6)) <= 5)

# Integridad de fines de semana (0 fines de semana partidos):
sep_weekends = [(2, 3, 4), (9, 10, 11), (16, 17, 18), (23, 24, 25)]
for w in range(n_workers):
    for fri, sat, sun in sep_weekends:
        v_fri_n = x[w, fri, 3]
        sat_worked = x[w, sat, 1] + x[w, sat, 2] + x[w, sat, 3]
        sun_worked = x[w, sun, 1] + x[w, sun, 2]
        tot_we = v_fri_n + sat_worked + sun_worked
        b_var = model.NewBoolVar(f'bwe_{w}_{fri}')
        model.Add(tot_we == 1).OnlyEnforceIf(b_var)
        model.Add(tot_we != 1).OnlyEnforceIf(b_var.Not())
        model.Add(b_var == 0)

# Paridad anual exacta de festivos:
reg_workers = ['Antonio J', 'Santi M', 'Alberto H', 'Fran Espin', 'Miguel B', 'Paco C', 'A. Leon']
fest_out = {'Antonio J': 45, 'Santi M': 48, 'Alberto H': 46, 'Fran Espin': 42, 'Miguel B': 42, 'Paco C': 45, 'A. Leon': 43}
target_fest = {'Antonio J': 48, 'Santi M': 48, 'Alberto H': 48, 'Fran Espin': 48, 'Miguel B': 48, 'Paco C': 48, 'A. Leon': 47}

for w_name in reg_workers:
    wi = w_map[w_name]
    fest_terms = []
    for d, dt in enumerate(sep_dates):
        wd = dt.weekday()
        is_hol = (dt in holidays)
        is_fest = (wd in [5, 6]) or is_hol
        is_friday = (wd == 4)
        is_sunday = (wd == 6)
        if is_fest:
            fest_terms.append(x[wi, d, 1])
            fest_terms.append(x[wi, d, 2])
        if is_friday or (is_fest and not is_sunday):
            fest_terms.append(x[wi, d, 3])
    needed = target_fest[w_name] - fest_out[w_name]
    model.Add(sum(fest_terms) == needed)

# Hilario: paridad exacta 110M / 110T
h_m_outside = sum(1 for d in range(total_days) if dates[d].month != 9 and matrix[w_map['Hilario']][d] == 'M')
h_t_outside = sum(1 for d in range(total_days) if dates[d].month != 9 and matrix[w_map['Hilario']][d] == 'T')
model.Add(h_m_outside + sum(x[w_map['Hilario'], d, 1] for d in range(n_sep)) == 110)
model.Add(h_t_outside + sum(x[w_map['Hilario'], d, 2] for d in range(n_sep)) == 110)

# Paridad anual de Mañanas y Tardes (diferencia <= 5)
m_outside = {w_name: sum(1 for d in range(total_days) if dates[d].month != 9 and matrix[w_map[w_name]][d] == 'M') for w_name in reg_workers}
t_outside = {w_name: sum(1 for d in range(total_days) if dates[d].month != 9 and matrix[w_map[w_name]][d] == 'T') for w_name in reg_workers}

min_m_var = model.NewIntVar(80, 110, 'min_m')
max_m_var = model.NewIntVar(80, 110, 'max_m')
for w_name in reg_workers:
    wi = w_map[w_name]
    tot_m = m_outside[w_name] + sum(x[wi, d, 1] for d in range(n_sep))
    model.Add(tot_m >= min_m_var)
    model.Add(tot_m <= max_m_var)
model.Add(max_m_var - min_m_var <= 5)

min_t_var = model.NewIntVar(60, 90, 'min_t')
max_t_var = model.NewIntVar(60, 90, 'max_t')
for w_name in reg_workers:
    wi = w_map[w_name]
    tot_t = t_outside[w_name] + sum(x[wi, d, 2] for d in range(n_sep))
    model.Add(tot_t >= min_t_var)
    model.Add(tot_t <= max_t_var)
model.Add(max_t_var - min_t_var <= 5)

# Función objetivo: maximizar estabilidad respetando el cuadrante original de HEAD
sep_head = []
for w in range(n_workers):
    row = []
    for d, dt in enumerate(sep_dates):
        d_all = dates.index(dt)
        s = matrix[w][d_all]
        s_val = 0 if s == '' else (1 if s == 'M' else (2 if s == 'T' else 3))
        row.append(s_val)
    sep_head.append(row)

obj = []
for w in range(n_workers):
    for d in range(n_sep):
        obj.append(x[w, d, sep_head[w][d]])
model.Maximize(sum(obj))

print('Optimizando cuadrante oficial con CP-SAT...')
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 60.0
st = solver.Solve(model)
print('Estado:', solver.StatusName(st))

if st in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
    print('Construyendo matrices completas...')
    shift_names = ['', 'M', 'T', 'N']
    full_plain = []
    full_dot = []
    for w in range(n_workers):
        p_row = []
        d_row = []
        for d, dt in enumerate(dates):
            wd = dt.weekday()
            is_fest = (wd in [5, 6]) or (dt in holidays)
            is_friday_night = (wd == 4)
            is_sunday_night = (wd == 6)
            if dt.month == 9:
                d_sep_i = dt.day - 1
                s_val = 0
                for s in range(4):
                    if solver.Value(x[w, d_sep_i, s]) == 1:
                        s_val = s
                code = shift_names[s_val]
            else:
                code = matrix[w][d]
            p_row.append(code)
            if code == '':
                d_row.append('')
            elif code in ['M', 'T']:
                if is_fest: d_row.append(f'{code}.')
                else: d_row.append(code)
            elif code == 'N':
                if is_friday_night or (is_fest and not is_sunday_night):
                    d_row.append('N.')
                else:
                    d_row.append('N')
        full_plain.append(p_row)
        full_dot.append(d_row)

    out_data = {
        'description': 'Cuadrante 2027 Andújar - Oficial V3 (Feria 11 a 13 de Septiembre)',
        'year': 2027,
        'workers': workers,
        'dates': dates_str,
        'matrix': full_plain,
        'matrix_dot': full_dot
    }
    with open('cuadrante_2027_v3.json', 'w', encoding='utf-8') as f:
        json.dump(out_data, f, indent=2, ensure_ascii=False)
    with open('cuadrante_2027.json', 'w', encoding='utf-8') as f:
        json.dump(out_data, f, indent=2, ensure_ascii=False)

    print('¡ÉXITO: cuadrante_2027_v3.json y cuadrante_2027.json guardados con éxito!')
