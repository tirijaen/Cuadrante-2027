import json, datetime

with open('cuadrante_2027_v2.json') as f:
    data = json.load(f)

workers = data['workers']
dates = [datetime.date.fromisoformat(d) for d in data['dates']]
matrix = data['matrix']
matrix_dot = data['matrix_dot']
total_days = len(dates)

holidays = {
    datetime.date(2027, 1, 1), datetime.date(2027, 1, 6), datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25), datetime.date(2027, 3, 26), datetime.date(2027, 4, 23),
    datetime.date(2027, 4, 26), datetime.date(2027, 5, 1), datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6), datetime.date(2027, 10, 12), datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6), datetime.date(2027, 12, 8), datetime.date(2027, 12, 25),
}

def is_festivo(d, s):
    if s in ['', ' ']: return False
    wd = d.weekday()
    if d in holidays and s in ['M', 'T']: return True
    if wd == 4 and s == 'N': return True
    if wd == 5: return True
    if wd == 6 and s in ['M', 'T']: return True
    return False

errors = []

# 1. Check coverage every day
for d_idx, dt in enumerate(dates):
    shifts_today = [matrix[w][d_idx].strip() for w in range(len(workers))]
    m_cnt = shifts_today.count('M')
    t_cnt = shifts_today.count('T')
    n_cnt = shifts_today.count('N')
    
    if n_cnt != 1:
        errors.append(f"Error cobertura Noche en {dt}: hay {n_cnt} noches (debe ser 1)")
        
    wd = dt.weekday()
    is_h = (dt in holidays) or (dt == datetime.date(2027, 4, 23))
    is_summer = dt.month in [6, 7, 8, 9]
    
    if wd in [5, 6] or is_h:
        if m_cnt != 1 or t_cnt != 1:
            errors.append(f"Error cobertura Festivo/Finde en {dt}: M={m_cnt}, T={t_cnt} (debe ser 1M, 1T)")
    else:
        if is_summer and wd in [2, 3, 4]:
            if not (2 <= m_cnt <= 3 and 2 <= t_cnt <= 3):
                errors.append(f"Error cobertura Verano X-V en {dt}: M={m_cnt}, T={t_cnt}")
        else:
            if m_cnt != 3 or not (2 <= t_cnt <= 3):
                errors.append(f"Error cobertura Laboral en {dt}: M={m_cnt}, T={t_cnt}")

# 2. Check rest 12h
for w_idx, w_name in enumerate(workers):
    for d_idx in range(total_days - 1):
        s1 = matrix[w_idx][d_idx].strip()
        s2 = matrix[w_idx][d_idx+1].strip()
        if s1 == 'T' and s2 == 'M':
            errors.append(f"{w_name}: descanso roto T->M en {dates[d_idx]} a {dates[d_idx+1]}")
        if s1 == 'N' and s2 in ['M', 'T']:
            errors.append(f"{w_name}: descanso roto N->{s2} en {dates[d_idx]} a {dates[d_idx+1]}")

# 3. Check consecutive days <= 5
for w_idx, w_name in enumerate(workers):
    consec = 0
    for d_idx in range(total_days):
        s = matrix[w_idx][d_idx].strip()
        if s in ['M', 'T', 'N']:
            consec += 1
            if consec > 5:
                errors.append(f"{w_name}: >5 días consecutivos trabajados en {dates[d_idx]} (consec={consec})")
        else:
            consec = 0

# 4. Check weekends conciliation (Fri N to Sun T)
weekends = []
for d_idx, dt in enumerate(dates[:-2]):
    if dt.weekday() == 4:
        weekends.append((d_idx, d_idx + 1, d_idx + 2))

broken_count = 0
for w_idx, w_name in enumerate(workers):
    if w_name == 'Hilario': continue
    for (fri_idx, sat_idx, sun_idx) in weekends:
        fri_n = 1 if matrix[w_idx][fri_idx].strip() == 'N' else 0
        sat_any = 1 if matrix[w_idx][sat_idx].strip() in ['M', 'T', 'N'] else 0
        sun_day = 1 if matrix[w_idx][sun_idx].strip() in ['M', 'T'] else 0
        wknd_shifts = fri_n + sat_any + sun_day
        if wknd_shifts == 1:
            broken_count += 1
            errors.append(f"{w_name}: Finde partido (solo 1 turno) en finde {dates[fri_idx]}")

# 5. Check annual days
for w_idx, w_name in enumerate(workers):
    tot = sum(1 for d in range(total_days) if matrix[w_idx][d].strip() in ['M', 'T', 'N'])
    if w_name != 'Extra 1' and tot != 220:
        errors.append(f"{w_name}: Días totales = {tot} (debe ser 220)")
    if w_name == 'Extra 1' and not (80 <= tot <= 85):
        errors.append(f"Extra 1: Días totales = {tot} (debe ser 80-85)")

print(f"--- AUDITORÍA COMPLETA ---")
print(f"Total de errores encontrados: {len(errors)}")
print(f"Total fines de semana partidos (Viernes N a Domingo T): {broken_count}")
if errors:
    for e in errors[:10]:
        print("  ->", e)
else:
    print("TODAS LAS REGLAS Y RESTRICCIONES SE CUMPLEN AL 100% DE FORMA PERFECTA!")
