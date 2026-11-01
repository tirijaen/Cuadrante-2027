import json, datetime

with open("cuadrante_2027_v3.json", "r", encoding="utf-8") as f:
    data = json.load(f)

workers = data["workers"]
dates_str = data["dates"]
matrix_dot = data["matrix_dot"]
matrix_plain = data["matrix"]

dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in dates_str]

month_names_es = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
wd_initials = ["L", "M", "X", "J", "V", "S", "D"]

out_md = []

out_md.append("# Cuadrante 2027 Andújar - Versión 3 (Conciliación y 2 Días de Descanso Tras Noche)\n")

# Monthly tables
for m in range(1, 13):
    m_days = [d_idx for d_idx, dt in enumerate(dates) if dt.month == m]
    header_d = "| Trabajador | " + " | ".join(f"{dates[d_idx].day:02d}" for d_idx in m_days) + " | Tot | M | T | N | Fest(.) |"
    header_wd = "|:---| " + " | ".join(f"{wd_initials[dates[d_idx].weekday()]}" for d_idx in m_days) + " |:---:|:---:|:---:|:---:|:---:|"
    
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

with open("all_tables_v3.md", "w", encoding="utf-8") as f:
    f.write("\n".join(out_md))

print("Wrote all_tables_v3.md successfully!")
