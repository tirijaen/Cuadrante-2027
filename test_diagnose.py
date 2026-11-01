import datetime, calendar
from ortools.sat.python import cp_model
from test_redesign import *

# Let's inspect the solver log or run with log_search_progress
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 20.0
solver.parameters.log_search_progress = True
solver.parameters.num_workers = 8
status = solver.Solve(model)
print("Status:", solver.StatusName(status))
