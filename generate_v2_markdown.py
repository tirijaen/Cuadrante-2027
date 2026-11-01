import json, datetime

with open("cuadrante_2027_v2.json", "r", encoding="utf-8") as f:
    data = json.load(f)

workers = data["workers"]
dates_str = data["dates"]
matrix_dot = data["matrix_dot"]
matrix_plain = data["matrix"]

dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in dates_str]

holidays = {
    datetime.date(2027, 1, 1),
    datetime.date(2027, 1, 6),
    datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25),
    datetime.date(2027, 3, 26),
    datetime.date(2027, 4, 23),
    datetime.date(2027, 4, 26),
    datetime.date(2027, 5, 1),
    datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6),
    datetime.date(2027, 10, 12),
    datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6),
    datetime.date(2027, 12, 8),
    datetime.date(2027, 12, 25),
}

month_names_es = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
wd_initials = ["L", "M", "X", "J", "V", "S", "D"]

out_md = []

# Audit calculations with new weekend definition (Viernes Noche a Domingo Tarde)
print("=== AUDIT SUMMARY FOR VERSION 2 (Viernes N a Domingo T) ===")
weekends = []
for d_idx, dt in enumerate(dates[:-2]):
    if dt.weekday() == 4:  # Viernes
        weekends.append((d_idx, d_idx + 1, d_idx + 2))

total_broken = 0
for w_i, w_name in enumerate(workers):
    comp_trab = 0
    comp_libre = 0
    partidos = 0
    for (fri_idx, sat_idx, sun_idx) in weekends:
        cnt = 0
        if matrix_plain[w_i][fri_idx] == "N":
            cnt += 1
        if matrix_plain[w_i][sat_idx] in ("M", "T", "N"):
            cnt += 1
        if matrix_plain[w_i][sun_idx] in ("M", "T"):
            cnt += 1
        
        if cnt == 1:
            partidos += 1
        elif cnt >= 2:
            comp_trab += 1
        else:
            comp_libre += 1
    total_broken += partidos
    
    tot_d = sum(1 for c in matrix_dot[w_i] if c.strip() != "")
    tot_m = sum(1 for c in matrix_dot[w_i] if "M" in c)
    tot_t = sum(1 for c in matrix_dot[w_i] if "T" in c)
    tot_n = sum(1 for c in matrix_dot[w_i] if "N" in c)
    tot_f = sum(1 for c in matrix_dot[w_i] if "." in c)
    print(f"{w_name:12s}: Total={tot_d:3d} (M={tot_m:2d}, T={tot_t:2d}, N={tot_n:2d}, Fest={tot_f:2d}) | Findes (V_N->D_T): Compl.Trab={comp_trab:2d}, Compl.Libre={comp_libre:2d}, Partidos={partidos:2d}")

print(f"\nTOTAL FINDES PARTIDOS EN TODA LA PLANTILLA: {total_broken}")

# Generate monthly tables
for m in range(1, 13):
    m_days = [d_idx for d_idx, dt in enumerate(dates) if dt.month == m]
    header_d = "| Trabajador | " + " | ".join(f"{dates[d_idx].day:02d}" for d_idx in m_days) + " | Tot | M | T | N | Fest(.) |"
    header_wd = "|:---| " + " | ".join(f"{wd_initials[dates[d_idx].weekday()]}" for d_idx in m_days) + " |:---:|:---:|:---:|:---:|:---:|"
    sep = "|:---| " + " | ".join("---" for _ in m_days) + " |:---:|:---:|:---:|:---:|:---:|"
    
    out_md.append(f"### {m:02d}. {month_names_es[m-1]} 2027\n")
    out_md.append(header_d)
    out_md.append(header_wd)
    
    for w_i, w_name in enumerate(workers):
        shifts = [matrix_dot[w_i][d_idx] for d_idx in m_days]
        tot = sum(1 for s in shifts if s.strip() != "")
        m_cnt = sum(1 for s in shifts if "M" in s)
        t_cnt = sum(1 for s in shifts if "T" in s)
        n_cnt = sum(1 for s in shifts if "N" in s)
        f_cnt = sum(1 for s in shifts if "." in s)
        
        row_str = f"| **{w_name}** | " + " | ".join(f"`{s}`" if s.strip() != "" else " " for s in shifts) + f" | **{tot}** | {m_cnt} | {t_cnt} | {n_cnt} | {f_cnt} |"
        out_md.append(row_str)
    out_md.append("\n")

with open("all_tables_v2.md", "w", encoding="utf-8") as f:
    f.write("\n".join(out_md))

print("Wrote all_tables_v2.md successfully!")
