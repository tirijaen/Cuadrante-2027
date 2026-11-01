import json, datetime

with open("cuadrante_2027_v2.json", "r", encoding="utf-8") as f:
    data = json.load(f)

workers = data["workers"]
dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in data["dates"]]
matrix_dot = data["matrix_dot"]
matrix_plain = data["matrix"]

total_days = len(dates)

vacation_periods = [
    ('Antonio J', [(6, 1, 15), (8, 1, 15)]),
    ('Miguel B',  [(6, 1, 15), (8, 1, 15)]),
    ('Paco C',    [(6, 16, 30), (8, 16, 31)]),
    ('Fran Espin',[(6, 16, 30), (8, 16, 31)]),
    ('A. Leon',   [(7, 1, 15), (9, 1, 15)]),
    ('Hilario',   [(7, 1, 15), (9, 1, 15)]),
    ('Santi M',   [(7, 16, 31), (9, 16, 30)]),
    ('Alberto H', [(7, 16, 31), (9, 16, 30)]),
]

# 1. Check max consecutive days worked
print("--- CHECK CONSECUTIVE DAYS WORKED (MAX 5) ---")
for w_i, w_name in enumerate(workers):
    cur_streak = 0
    max_streak = 0
    for d in range(total_days):
        if matrix_plain[w_i][d].strip() != "":
            cur_streak += 1
            if cur_streak > max_streak:
                max_streak = cur_streak
        else:
            cur_streak = 0
    print(f"{w_name:12s}: Max consecutive days worked = {max_streak}")

# 2. Check nights per month (MAX 7)
print("\n--- CHECK NIGHTS PER MONTH (MAX 7) ---")
for w_i, w_name in enumerate(workers):
    monthly_n = {}
    for m in range(1, 13):
        m_days = [d for d in range(total_days) if dates[d].month == m]
        n_cnt = sum(1 for d in m_days if matrix_plain[w_i][d] == "N")
        monthly_n[m] = n_cnt
    max_n_m = max(monthly_n.values())
    print(f"{w_name:12s}: Max nights in any month = {max_n_m} -> {monthly_n}")

# 3. Check days worked per month (18-21 in non-vacation months, never 22)
print("\n--- CHECK DAYS PER MONTH (18-21 non-vacation, never 22) ---")
for w_i, w_name in enumerate(workers):
    monthly_days = {}
    for m in range(1, 13):
        m_days = [d for d in range(total_days) if dates[d].month == m]
        cnt = sum(1 for d in m_days if matrix_plain[w_i][d].strip() != "")
        monthly_days[m] = cnt
    print(f"{w_name:12s}: {monthly_days}")

# 4. Check night blocks
print("\n--- CHECK NIGHT BLOCK LENGTHS ---")
for w_i, w_name in enumerate(workers):
    blocks = []
    cur_b = 0
    for d in range(total_days):
        if matrix_plain[w_i][d] == "N":
            cur_b += 1
        else:
            if cur_b > 0:
                blocks.append(cur_b)
                cur_b = 0
    if cur_b > 0: blocks.append(cur_b)
    from collections import Counter
    c = Counter(blocks)
    print(f"{w_name:12s}: Night block lengths distribution: {dict(sorted(c.items()))}")

# 5. Check night before vacation (Rule 5)
print("\n--- CHECK NIGHT BEFORE VACATION ---")
for w_name, periods in vacation_periods:
    w_i = workers.index(w_name)
    for (m, s_d, e_d) in periods:
        v_start = datetime.date(2027, m, s_d)
        d_before = v_start - datetime.timedelta(days=1)
        d_idx = (d_before - datetime.date(2027, 1, 1)).days
        shift_before = matrix_plain[w_i][d_idx]
        print(f"{w_name:12s} before vac {v_start}: Shift on {d_before} = '{shift_before}' (OK: not N)")

