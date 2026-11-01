import datetime, calendar
from ortools.sat.python import cp_model

# Let's import the model from test_redesign but remove the objective or test solve
import test_redesign

model = test_redesign.model
# Clear objective
model.Proto().ClearField("objective")

solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 10.0
solver.parameters.num_workers = 8
status = solver.Solve(model)
print("Status without objective:", solver.StatusName(status))
