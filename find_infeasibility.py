import datetime
from ortools.sat.python import cp_model

holidays = {
    datetime.date(2027, 1, 1), datetime.date(2027, 1, 6), datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25), datetime.date(2027, 3, 26), datetime.date(2027, 4, 23),
    datetime.date(2027, 4, 26), datetime.date(2027, 5, 1), datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6), datetime.date(2027, 10, 12), datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6), datetime.date(2027, 12, 8), datetime.date(2027, 12, 25),
}

workers = [
    "Antonio J", "Santi M", "Alberto H", "Fran Espin",
    "Miguel B", "Paco C", "A. Leon", "Hilario", "Extra 1"
]
n_workers = len(workers)
w_map = {name: i for i, name in enumerate(workers)}

start_date = datetime.date(2027, 1, 1)
end_date = datetime.date(2027, 12, 31)
total_days = (end_date - start_date).days + 1
dates = [start_date + datetime.timedelta(days=i) for i in range(total_days)]
def get_d_idx(y, m, d): return (datetime.date(y, m, d) - start_date).days

fixed_mt_days = [
    ("2027-01-01", ["A. Leon", "Alberto H"]),
    ("2027-01-06", ["A. Leon", "Alberto H"]),
    ("2027-03-01", ["Fran Espin", "Paco C"]),
    ("2027-03-25", ["Antonio J", "Santi M"]),
    ("2027-03-26", ["Antonio J", "Santi M"]),
    ("2027-03-27", ["Antonio J", "Santi M"]),
    ("2027-03-28", ["Antonio J", "Santi M"]),
    ("2027-04-23", ["Antonio J", "Alberto H"]),
    ("2027-04-24", ["Antonio J", "Alberto H"]),
    ("2027-04-25", ["Antonio J", "Alberto H"]),
    ("2027-04-26", ["Antonio J", "Alberto H"]),
    ("2027-05-01", ["Miguel B", "Fran Espin"]),
    ("2027-08-16", ["Santi M", "Extra 1"]),
    ("2027-09-04", ["Antonio J", "Extra 1"]),
    ("2027-09-05", ["Antonio J", "Extra 1"]),
    ("2027-09-06", ["Antonio J", "Extra 1"]),
    ("2027-10-12", ["Miguel B", "Paco C"]),
    ("2027-12-06", ["Paco C", "Santi M"]),
    ("2027-12-08", ["Paco C", "Santi M"]),
    ("2027-12-25", ["Miguel B", "Fran Espin"]),
]

m_nights = cp_model.CpModel()
n = {}
for w in range(n_workers):
    for d in range(total_days):
        n[w, d] = m_nights.NewBoolVar(f"n_{w}_{d}")
for d in range(total_days): m_nights.Add(sum(n[w, d] for w in range(n_workers)) == 1)
for d in range(total_days): m_nights.Add(n[w_map["Hilario"], d] == 0)
for d, dt in enumerate(dates):
    if dt.month not in [6, 7, 8, 9] or (dt.month == 6 and dt.day <= 14):
        m_nights.Add(n[w_map["Extra 1"], d] == 0)

vacations = [
    ("Antonio J", [(6, 1, 15), (8, 1, 15)]),
    ("Miguel B",  [(6, 1, 15), (8, 1, 15)]),
    ("Paco C",    [(6, 16, 30), (8, 16, 31)]),
    ("Fran Espin",[(6, 16, 30), (8, 16, 31)]),
    ("A. Leon",   [(7, 1, 15), (9, 1, 15)]),
    ("Santi M",   [(7, 16, 31), (9, 16, 30)]),
    ("Alberto H", [(7, 16, 31), (9, 16, 30)]),
]
for w_name, periods in vacations:
    w_idx = w_map[w_name]
    for (m, s_day, e_day) in periods:
        for d, dt in enumerate(dates):
            if dt.month == m and s_day <= dt.day <= e_day:
                m_nights.Add(n[w_idx, d] == 0)
        v_start = datetime.date(2027, m, s_day)
        db = v_start - datetime.timedelta(days=1)
        if db >= start_date:
            m_nights.Add(n[w_idx, (db - start_date).days] == 0)

m_nights.Add(n[w_map["Santi M"], get_d_idx(2027, 1, 1)] == 1)
for d in [25, 26, 27]: m_nights.Add(n[w_map["Miguel B"], get_d_idx(2027, 3, d)] == 1)
for d in [23, 24, 25]: m_nights.Add(n[w_map["A. Leon"], get_d_idx(2027, 4, d)] == 1)
m_nights.Add(n[w_map["Alberto H"], get_d_idx(2027, 12, 24)] == 1)
m_nights.Add(n[w_map["Miguel B"], get_d_idx(2027, 12, 31)] == 1)

for dt_str, worker_list in fixed_mt_days:
    d = (datetime.datetime.strptime(dt_str, "%Y-%m-%d").date() - start_date).days
    for w_name in worker_list:
        w_idx = w_map[w_name]
        m_nights.Add(n[w_idx, d] == 0)
        if d >= 1: m_nights.Add(n[w_idx, d-1] == 0)
        if d >= 2: m_nights.Add(n[w_idx, d-2] - n[w_idx, d-1] <= 0)

for w in range(n_workers):
    if workers[w] == "Hilario": continue
    for d in range(total_days - 1):
        is_start = m_nights.NewBoolVar(f"start_{w}_{d}")
        if d == 0: m_nights.Add(is_start == n[w, d])
        else:
            m_nights.Add(is_start <= n[w, d])
            m_nights.Add(is_start <= n[w, d-1].Not())
            m_nights.Add(is_start >= n[w, d] - n[w, d-1])
        m_nights.Add(n[w, d+1] == 1).OnlyEnforceIf(is_start)
        if d < total_days - 4:
            m_nights.Add(sum(n[w, d+k] for k in range(5)) <= 4)

for w in range(n_workers):
    for m in range(1, 13):
        m_days_list = [d for d, dt in enumerate(dates) if dt.month == m]
        m_nights.Add(sum(n[w, d] for d in m_days_list) <= 7)

reg = [w for w in range(n_workers - 1) if workers[w] != "Hilario"]
min_n = m_nights.NewIntVar(45, 55, "min_n")
max_n = m_nights.NewIntVar(45, 55, "max_n")
m_nights.Add(max_n - min_n <= 3)
for w in reg:
    tot = sum(n[w, d] for d in range(total_days))
    m_nights.Add(tot >= min_n)
    m_nights.Add(tot <= max_n)

for d, dt in enumerate(dates[:-2]):
    if dt.weekday() == 4:
        for w in range(n_workers):
            m_nights.Add(n[w, d] == n[w, d+1])

gap_days = 7
for w in range(n_workers):
    if workers[w] == "Hilario": continue
    for d in range(total_days - 1):
        for k in range(1, gap_days + 1):
            if d + k < total_days:
                m_nights.Add(n[w, d] - n[w, d+1] + n[w, d+k] <= 1)

s1 = cp_model.CpSolver()
s1.Solve(m_nights)
fixed_nights = {(w, d): s1.Value(n[w, d]) for w in range(n_workers) for d in range(total_days)}

# Test each constraint in Stage 2
def test_stage2(c_names):
    m = cp_model.CpModel()
    x = {}
    for w in range(n_workers):
        for d in range(total_days):
            for s in [0, 1, 2, 3]:
                x[w, d, s] = m.NewBoolVar(f"x_{w}_{d}_{s}")
            m.Add(sum(x[w, d, s] for s in [0, 1, 2, 3]) == 1)
            m.Add(x[w, d, 3] == fixed_nights[w, d])
            
    if "vacations" in c_names:
        for w_name, periods in vacations:
            w_idx = w_map[w_name]
            for (m_num, s_day, e_day) in periods:
                for d_idx_v, dt in enumerate(dates):
                    if dt.month == m_num and s_day <= dt.day <= e_day:
                        m.Add(x[w_idx, d_idx_v, 0] == 1)
                        
    if "extra_hilario" in c_names:
        for d_idx_e, dt in enumerate(dates):
            if dt.month not in [6, 7, 8, 9]: m.Add(x[w_map["Extra 1"], d_idx_e, 0] == 1)
            if dt.month == 6 and 1 <= dt.day <= 14:
                wd = dt.weekday()
                if wd in [5, 6] or (dt in holidays): m.Add(x[w_map["Extra 1"], d_idx_e, 0] == 1)
        for d_idx_h, dt in enumerate(dates):
            wd = dt.weekday()
            if wd in [5, 6] or (dt in holidays): m.Add(x[w_map["Hilario"], d_idx_h, 0] == 1)

    if "rest_12h" in c_names:
        for w in range(n_workers):
            for d in range(total_days - 1):
                m.Add(x[w, d, 2] + x[w, d+1, 1] <= 1)
                m.Add(x[w, d, 3] + x[w, d+1, 1] <= 1)
                m.Add(x[w, d, 3] + x[w, d+1, 2] <= 1)

    if "2days_rest" in c_names:
        for w in range(n_workers):
            if workers[w] == "Hilario": continue
            for d in range(total_days - 2):
                if fixed_nights[w, d] == 1 and fixed_nights[w, d+1] == 0:
                    m.Add(x[w, d+1, 0] == 1)
                    m.Add(x[w, d+2, 0] == 1)

    if "daily_coverage" in c_names:
        for d_idx_c, dt in enumerate(dates):
            wd = dt.weekday()
            is_hol = (dt in holidays) or (dt == datetime.date(2027, 4, 23))
            is_summer = dt.month in [6, 7, 8, 9]
            if wd in [5, 6] or is_hol:
                m.Add(sum(x[w, d_idx_c, 1] for w in range(n_workers)) == 1)
                m.Add(sum(x[w, d_idx_c, 2] for w in range(n_workers)) == 1)
            else:
                if is_summer and wd in [2, 3, 4]:
                    m.Add(sum(x[w, d_idx_c, 1] for w in range(n_workers)) >= 2)
                    m.Add(sum(x[w, d_idx_c, 1] for w in range(n_workers)) <= 3)
                    m.Add(sum(x[w, d_idx_c, 2] for w in range(n_workers)) >= 2)
                    m.Add(sum(x[w, d_idx_c, 2] for w in range(n_workers)) <= 3)
                else:
                    m.Add(sum(x[w, d_idx_c, 1] for w in range(n_workers)) == 3)
                    m.Add(sum(x[w, d_idx_c, 2] for w in range(n_workers)) >= 2)
                    m.Add(sum(x[w, d_idx_c, 2] for w in range(n_workers)) <= 3)

    if "fixed_mt" in c_names:
        for dt_str, w_list in fixed_mt_days:
            d = (datetime.datetime.strptime(dt_str, "%Y-%m-%d").date() - start_date).days
            for w_name in w_list:
                m.Add(x[w_map[w_name], d, 1] + x[w_map[w_name], d, 2] == 1)

    if "weekends" in c_names:
        weekends = []
        for d_idx_w, dt in enumerate(dates[:-2]):
            if dt.weekday() == 4: weekends.append((d_idx_w, d_idx_w + 1, d_idx_w + 2))
        for w in range(n_workers):
            if workers[w] == "Hilario": continue
            for (fri_idx, sat_idx, sun_idx) in weekends:
                wknd_sum = (x[w, fri_idx, 3] +
                            x[w, sat_idx, 1] + x[w, sat_idx, 2] + x[w, sat_idx, 3] +
                            x[w, sun_idx, 1] + x[w, sun_idx, 2])
                m.Add(wknd_sum != 1)

    if "max_5_consec" in c_names:
        for w in range(n_workers):
            for d in range(total_days - 5):
                m.Add(sum(x[w, d + k, 0] for k in range(6)) >= 1)

    if "days_220" in c_names:
        for w in range(n_workers - 1):
            m.Add(sum(1 - x[w, d, 0] for d in range(total_days)) == 220)
        extra_total = sum(1 - x[w_map["Extra 1"], d, 0] for d in range(total_days))
        m.Add(extra_total >= 80)
        m.Add(extra_total <= 85)

    sol = cp_model.CpSolver()
    sol.parameters.max_time_in_seconds = 5.0
    st = sol.Solve(m)
    return sol.StatusName(st)

all_c = ["vacations", "extra_hilario", "rest_12h", "2days_rest", "daily_coverage", "fixed_mt", "weekends", "max_5_consec", "days_220"]
tested = []
for c in all_c:
    tested.append(c)
    res = test_stage2(tested)
    print(f"Adding {c:15s} -> Status: {res}")
    if res == "INFEASIBLE":
        print(f"FAILED AT: {c}!")
        break
