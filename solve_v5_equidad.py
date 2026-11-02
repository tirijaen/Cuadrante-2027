"""
Solver Oficial V5 - Cuadrante 2027 Andújar
Incorpora:
1. Regla explícita del 01 de Enero: Antonio León (Mañana) y Alberto Higueras (Tarde).
2. Asignación obligatoria por mínimos históricos individuales de la plantilla Excel.
3. Límites mensuales estrictos: NUNCA 22 días trabajados al mes para regulares e Hilario (18-21 días).
4. Integridad de festivos multi-día (Semana Santa, Virgen de la Cabeza, Feria).
5. Doble descanso garantizado tras noches y tras 6 días de Extra 1.
6. 0 fines de semana partidos.
7. Equidad global acumulada perfecta: 69 a 70 festivos para toda la plantilla.
"""
import datetime, json
from ortools.sat.python import cp_model
import openpyxl

# Carga de datos base
with open('cuadrante_2027_v3.json') as f:
    data = json.load(f)

workers = data['workers']
dates_str = data['dates']
dates = [datetime.datetime.strptime(d, '%Y-%m-%d').date() for d in dates_str]
matrix = data['matrix']
n_workers = len(workers)
total_days = len(dates)
w_map = {w: i for i, w in enumerate(workers)}

fixed_n = {}
for w in range(n_workers):
    for d in range(total_days):
        fixed_n[w, d] = 1 if matrix[w][d] == 'N' else 0

start_date = dates[0]
def d_idx(y, m, day):
    return (datetime.date(y, m, day) - start_date).days

# Ajuste ergonómico de noches en Diciembre:
# Paco C pasa sus noches a finales de mes (21-23 y 28-29) para quedar libre en la Inmaculada (8 Dic).
# Antonio J asume las noches del 7 al 9 de diciembre.
# Fran Espín asume las noches del 5 y 6 de diciembre (quedando de descanso obligado tras noche el 7 y 8 de diciembre).
dec_night_map = {
    1: 'Santi M', 2: 'Santi M',
    3: 'Alberto H', 4: 'Alberto H',
    5: 'Fran Espin', 6: 'Fran Espin',
    7: 'Antonio J', 8: 'Antonio J', 9: 'Antonio J',
    10: 'Santi M', 11: 'Santi M',
    12: 'Miguel B', 13: 'Miguel B',
    14: 'A. Leon', 15: 'A. Leon', 16: 'A. Leon',
    17: 'Miguel B', 18: 'Miguel B',
    19: 'Fran Espin', 20: 'Fran Espin',
    21: 'Paco C', 22: 'Paco C', 23: 'Paco C',
    24: 'Alberto H', 25: 'Alberto H',
    26: 'Santi M', 27: 'Santi M',
    28: 'Paco C', 29: 'Paco C',
    30: 'Antonio J', 31: 'Antonio J'
}
for day, w_name in dec_night_map.items():
    for w_i in range(7):
        fixed_n[w_i, d_idx(2027, 12, day)] = 0
    fixed_n[w_map[w_name], d_idx(2027, 12, day)] = 1

holidays = {
    datetime.date(2027, 1, 1), datetime.date(2027, 1, 6), datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25), datetime.date(2027, 3, 26), datetime.date(2027, 4, 23),
    datetime.date(2027, 4, 26), datetime.date(2027, 5, 1), datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6), datetime.date(2027, 10, 12), datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6), datetime.date(2027, 12, 8), datetime.date(2027, 12, 25),
}

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

# Candidate pools basados en mínimos históricos de Cuadrante 2026 para Agente.xlsx:
holiday_candidate_pools = [
    ('2027-01-01', ['A. Leon', 'Alberto H']),
    ('2027-01-06', ['A. Leon', 'Alberto H']),
    ('2027-03-01', ['Paco C', 'Fran Espin', 'Santi M', 'Alberto H', 'Miguel B']),
    ('2027-03-25', ['Antonio J', 'Paco C', 'Fran Espin', 'Santi M']),
    ('2027-03-26', ['Antonio J', 'Paco C', 'Fran Espin', 'Santi M']),
    ('2027-03-27', ['Antonio J', 'Paco C', 'Fran Espin', 'Santi M']),
    ('2027-03-28', ['Antonio J', 'Paco C', 'Fran Espin', 'Santi M']),
    ('2027-04-23', ['Alberto H', 'Fran Espin', 'Paco C', 'Antonio J']),
    ('2027-04-24', ['Alberto H', 'Fran Espin', 'Paco C', 'Antonio J']),
    ('2027-04-25', ['Alberto H', 'Fran Espin', 'Paco C', 'Antonio J']),
    ('2027-04-26', ['Alberto H', 'Fran Espin', 'Paco C', 'Antonio J']),
    ('2027-05-01', ['Paco C', 'A. Leon', 'Fran Espin', 'Miguel B', 'Alberto H']),
    ('2027-08-16', ['Santi M', 'Miguel B', 'Alberto H']),
    ('2027-09-04', ['Antonio J', 'Miguel B', 'Paco C', 'Santi M']),
    ('2027-09-05', ['Antonio J', 'Miguel B', 'Paco C', 'Santi M']),
    ('2027-09-06', ['Antonio J', 'Miguel B', 'Paco C', 'Santi M']),
    ('2027-10-12', ['Fran Espin', 'A. Leon', 'Paco C', 'Miguel B', 'Santi M']),
    ('2027-11-01', ['Antonio J', 'A. Leon']),
    ('2027-12-06', ['Paco C', 'Fran Espin', 'Antonio J', 'Santi M', 'Alberto H']),
    ('2027-12-08', ['Paco C', 'Santi M']),
    ('2027-12-25', ['Miguel B', 'Antonio J', 'Paco C', 'Alberto H', 'Fran Espin']),
]

m2 = cp_model.CpModel()
x = {}
for w in range(n_workers):
    for d in range(total_days):
        for s in range(4):
            x[w, d, s] = m2.NewBoolVar(f'x_{w}_{d}_{s}')
        m2.Add(sum(x[w, d, s] for s in range(4)) == 1)
        m2.Add(x[w, d, 3] == int(fixed_n[w, d]))

for w_name, periods in vacations:
    w_i = w_map[w_name]
    for (m, s_day, e_day) in periods:
        for d, dt in enumerate(dates):
            if dt.month == m and s_day <= dt.day <= e_day:
                m2.Add(x[w_i, d, 0] == 1)

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

for w in range(n_workers):
    if workers[w] == 'Hilario': continue
    for d in range(total_days - 2):
        if fixed_n[w, d] == 1 and fixed_n[w, d+1] == 0:
            m2.Add(x[w, d+1, 0] == 1)
            m2.Add(x[w, d+2, 0] == 1)

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
            m2.Add(m_sum >= 2); m2.Add(m_sum <= 3)
            t_sum = sum(x[w, d, 2] for w in range(n_workers))
            m2.Add(t_sum >= 2); m2.Add(t_sum <= 3)
        else:
            m2.Add(sum(x[w, d, 1] for w in range(n_workers)) == 3)
            t_sum = sum(x[w, d, 2] for w in range(n_workers))
            m2.Add(t_sum >= 2); m2.Add(t_sum <= 3)

# 01 de Enero: Antonio León (Mañana) y Alberto Higueras (Tarde)
m2.Add(x[w_map['A. Leon'], d_idx(2027, 1, 1), 1] == 1)
m2.Add(x[w_map['Alberto H'], d_idx(2027, 1, 1), 2] == 1)

# Festivos multi-día íntegros
for w in range(n_workers):
    for d_k in [d_idx(2027, 3, 26), d_idx(2027, 3, 27), d_idx(2027, 3, 28)]:
        m2.Add(x[w, d_k, 1] == x[w, d_idx(2027, 3, 25), 1])
        m2.Add(x[w, d_k, 2] == x[w, d_idx(2027, 3, 25), 2])

for w in range(n_workers):
    for d_k in [d_idx(2027, 4, 24), d_idx(2027, 4, 25), d_idx(2027, 4, 26)]:
        m2.Add(x[w, d_k, 1] == x[w, d_idx(2027, 4, 23), 1])
        m2.Add(x[w, d_k, 2] == x[w, d_idx(2027, 4, 23), 2])

for w in range(n_workers):
    for d_k in [d_idx(2027, 9, 5), d_idx(2027, 9, 6)]:
        m2.Add(x[w, d_k, 1] == x[w, d_idx(2027, 9, 4), 1])
        m2.Add(x[w, d_k, 2] == x[w, d_idx(2027, 9, 4), 2])

# Mínimos históricos obligados
m2.Add(x[w_map['Alberto H'], d_idx(2027, 4, 23), 1] + x[w_map['Alberto H'], d_idx(2027, 4, 23), 2] == 1)
m2.Add(x[w_map['Antonio J'], d_idx(2027, 9, 4), 1] + x[w_map['Antonio J'], d_idx(2027, 9, 4), 2] == 1)
m2.Add(x[w_map['Alberto H'], d_idx(2027, 9, 4), 1] == 0)
m2.Add(x[w_map['Alberto H'], d_idx(2027, 9, 4), 2] == 0)
m2.Add(x[w_map['Miguel B'], d_idx(2027, 12, 25), 1] + x[w_map['Miguel B'], d_idx(2027, 12, 25), 2] == 1)

# 06 de Enero: Antonio León (Mañana) y Alberto Higueras (Tarde)
m2.Add(x[w_map['A. Leon'], d_idx(2027, 1, 6), 1] == 1)
m2.Add(x[w_map['Alberto H'], d_idx(2027, 1, 6), 2] == 1)

# 08 de Diciembre: Santi Molina (Mañana) y Paco Cantarero (Tarde)
m2.Add(x[w_map['Santi M'], d_idx(2027, 12, 8), 1] == 1)
m2.Add(x[w_map['Paco C'], d_idx(2027, 12, 8), 2] == 1)

# Fran Espin NO trabaja el 8 de Diciembre
m2.Add(x[w_map['Fran Espin'], d_idx(2027, 12, 8), 1] == 0)
m2.Add(x[w_map['Fran Espin'], d_idx(2027, 12, 8), 2] == 0)

# Pools de candidatos
for dt_str, cand_list in holiday_candidate_pools:
    d = d_idx(int(dt_str[:4]), int(dt_str[5:7]), int(dt_str[8:10]))
    cand_indices = [w_map[c] for c in cand_list]
    m2.Add(sum(x[ci, d, 1] + x[ci, d, 2] for ci in cand_indices) == 2)
    for w in range(n_workers):
        if w not in cand_indices and workers[w] != 'Hilario':
            m2.Add(x[w, d, 1] + x[w, d, 2] == 0)

# EQUIDAD GLOBAL Y ANUAL:
start_c = {
    'Antonio J': 66, 'Santi M': 65, 'Alberto H': 66,
    'Fran Espin': 65, 'Miguel B': 65, 'Paco C': 64, 'A. Leon': 65
}
official_holidays_terms = [
    # 5 Noches
    (d_idx(2027, 1, 1), 3), (d_idx(2027, 3, 25), 3), (d_idx(2027, 4, 23), 3),
    (d_idx(2027, 12, 24), 3), (d_idx(2027, 12, 31), 3),
    # 10 Diurnos individuales
    (d_idx(2027, 1, 1), 12), (d_idx(2027, 1, 6), 12), (d_idx(2027, 3, 1), 12),
    (d_idx(2027, 5, 1), 12), (d_idx(2027, 8, 16), 12), (d_idx(2027, 10, 12), 12),
    (d_idx(2027, 11, 1), 12), (d_idx(2027, 12, 6), 12), (d_idx(2027, 12, 8), 12),
    (d_idx(2027, 12, 25), 12),
    # 3 Diurnos multi-día (solo día 1 para contar como 1 fiesta)
    (d_idx(2027, 3, 25), 12), (d_idx(2027, 4, 23), 12), (d_idx(2027, 9, 4), 12),
]

for w_name, s_val in start_c.items():
    w = w_map[w_name]
    h_terms = []
    for d, s_kind in official_holidays_terms:
        if s_kind == 3: h_terms.append(x[w, d, 3])
        else: h_terms.append(x[w, d, 1] + x[w, d, 2])
    tot_2027 = sum(h_terms)
    cumul = s_val + tot_2027
    m2.Add(cumul >= 69)
    m2.Add(cumul <= 70)
    m2.Add(tot_2027 >= 4)
    m2.Add(tot_2027 <= 5)

# Fines de semana sin partir
weekends = []
for d, dt in enumerate(dates[:-2]):
    if dt.weekday() == 4: weekends.append((d, d+1, d+2))

for w in range(n_workers):
    for fri, sat, sun in weekends:
        v_fri_n = fixed_n[w, fri]
        sat_worked = x[w, sat, 1] + x[w, sat, 2] + fixed_n[w, sat]
        sun_worked = x[w, sun, 1] + x[w, sun, 2]
        tot_we = v_fri_n + sat_worked + sun_worked
        b_var = m2.NewBoolVar(f'bwe_{w}_{fri}')
        m2.Add(tot_we == 1).OnlyEnforceIf(b_var)
        m2.Add(tot_we != 1).OnlyEnforceIf(b_var.Not())
        m2.Add(b_var == 0)

# Max 5 días seguidos (6 Extra 1 con 2 descansos tras 6 días)
for w in range(n_workers):
    w_name = workers[w]
    if w_name == 'Extra 1':
        for d in range(total_days - 6):
            m2.Add(sum(1 - x[w, d+k, 0] for k in range(7)) <= 6)
            is_6 = m2.NewBoolVar(f'e6_{d}')
            m2.Add(sum(1 - x[w, d+k, 0] for k in range(6)) == 6).OnlyEnforceIf(is_6)
            m2.Add(sum(1 - x[w, d+k, 0] for k in range(6)) < 6).OnlyEnforceIf(is_6.Not())
            if d + 6 < total_days: m2.Add(x[w, d+6, 0] == 1).OnlyEnforceIf(is_6)
            if d + 7 < total_days: m2.Add(x[w, d+7, 0] == 1).OnlyEnforceIf(is_6)
    else:
        for d in range(total_days - 5):
            m2.Add(sum(1 - x[w, d+k, 0] for k in range(6)) <= 5)

for w in range(n_workers):
    if workers[w] == 'Extra 1':
        m2.Add(sum(1 - x[w, d, 0] for d in range(total_days)) >= 80)
        m2.Add(sum(1 - x[w, d, 0] for d in range(total_days)) <= 88)
    else:
        m2.Add(sum(1 - x[w, d, 0] for d in range(total_days)) == 220)

vac_months_dict = {
    'Antonio J': [6, 8], 'Miguel B': [6, 8], 'Paco C': [6, 8], 'Fran Espin': [6, 8],
    'A. Leon': [7, 9], 'Hilario': [7, 9], 'Santi M': [7, 9], 'Alberto H': [7, 9]
}
monthly_days = {m: [d for d, dt in enumerate(dates) if dt.month == m] for m in range(1, 13)}
for w in range(n_workers):
    w_name = workers[w]
    is_extra = (w_name == 'Extra 1')
    for m in range(1, 13):
        m_idxs = monthly_days[m]
        worked_in_m = sum(1 - x[w, d, 0] for d in m_idxs)
        if is_extra:
            if m in [6, 7, 8, 9]:
                m2.Add(worked_in_m >= 18)
                m2.Add(worked_in_m <= 22)
            else:
                m2.Add(worked_in_m == 0)
        else:
            has_vac = m in vac_months_dict.get(w_name, [])
            if has_vac:
                m2.Add(worked_in_m >= 9)
                m2.Add(worked_in_m <= 12)
            else:
                m2.Add(worked_in_m >= 18)
                m2.Add(worked_in_m <= 21)

m2.Add(x[w_map['Antonio J'], d_idx(2027, 5, 2), 0] == 1)
m2.Add(x[w_map['Fran Espin'], d_idx(2027, 5, 29), 0] == 1)
m2.Add(x[w_map['Miguel B'], d_idx(2027, 10, 31), 0] == 1)
m2.Add(x[w_map['Antonio J'], d_idx(2027, 12, 24), 2] == 0)

solver2 = cp_model.CpSolver()
st2 = solver2.Solve(m2)

if st2 in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
    matrix_plain = []
    matrix_dot = []
    shift_names = ['', 'M', 'T', 'N']
    for w in range(n_workers):
        row_plain = []
        row_dot = []
        for d, dt in enumerate(dates):
            wd = dt.weekday()
            is_fest = (wd in [5, 6]) or (dt in holidays) or (dt == datetime.date(2027, 4, 23))
            is_friday_night = (wd == 4)
            is_sunday_night = (wd == 6)
            s_val = 0
            for s in range(4):
                if s == 3:
                    if fixed_n[w, d] == 1: s_val = 3
                else:
                    if solver2.Value(x[w, d, s]) == 1: s_val = s
            code = shift_names[s_val]
            row_plain.append(code)
            if code == '':
                row_dot.append('')
            elif code in ['M', 'T']:
                if is_fest: row_dot.append(f'{code}.')
                else: row_dot.append(code)
            elif code == 'N':
                if is_friday_night or (is_fest and not is_sunday_night):
                    row_dot.append('N.')
                else:
                    row_dot.append('N')
        matrix_plain.append(row_plain)
        matrix_dot.append(row_dot)

    solution_data = {
        'description': 'Cuadrante 2027 Andújar - Mínimos Históricos Excel (AL Mañana y AH Tarde 01 Enero)',
        'year': 2027,
        'workers': workers,
        'dates': [d.strftime('%Y-%m-%d') for d in dates],
        'matrix': matrix_plain,
        'matrix_dot': matrix_dot
    }

    with open('cuadrante_2027_v3.json', 'w', encoding='utf-8') as f:
        json.dump(solution_data, f, indent=2, ensure_ascii=False)
    with open('cuadrante_2027.json', 'w', encoding='utf-8') as f:
        json.dump(solution_data, f, indent=2, ensure_ascii=False)
    print('SUCCESS: Quadrant saved!')
