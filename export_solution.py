import datetime, calendar, json
import pandas as pd
from solve_perfect import solver, x, workers, n_workers, total_days, dates, SHIFTS, is_festivo_shift, holidays

shift_codes = {0: "", 1: "M", 2: "T", 3: "N"}

# Build full matrix: workers x days
matrix = []
for w in range(n_workers):
    row = []
    for d in range(total_days):
        s_val = 0
        for s in SHIFTS:
            if solver.Value(x[w, d, s]) == 1:
                s_val = s
                break
        row.append(shift_codes[s_val])
    matrix.append(row)

# Save to json for quick access
data = {
    "workers": workers,
    "dates": [d.strftime("%Y-%m-%d") for d in dates],
    "matrix": matrix
}
with open("cuadrante_2027.json", "w") as f:
    json.dump(data, f)

print("Saved cuadrante_2027.json successfully!")
