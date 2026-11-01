import datetime, calendar
from ortools.sat.python import cp_model

# Calendar setup for 2027
holidays = {
    datetime.date(2027, 1, 1),
    datetime.date(2027, 1, 6),
    datetime.date(2027, 3, 1),
    datetime.date(2027, 3, 25),
    datetime.date(2027, 3, 26),
    datetime.date(2027, 4, 23), # Romeria Viernes
    datetime.date(2027, 4, 26), # Fiesta Local
    datetime.date(2027, 5, 1),
    datetime.date(2027, 8, 16),
    datetime.date(2027, 9, 6),  # Fiesta Local
    datetime.date(2027, 10, 12),
    datetime.date(2027, 11, 1),
    datetime.date(2027, 12, 6),
    datetime.date(2027, 12, 8),
    datetime.date(2027, 12, 25),
}

workers = [
    'Antonio J', 'Santi M', 'Alberto H', 'Fran Espin',
    'Miguel B', 'Paco C', 'A. Leon', 'Hilario', 'Extra 1'
]
n_workers = len(workers)

start_date = datetime.date(2027, 1, 1)
end_date = datetime.date(2027, 12, 31)
total_days = (end_date - start_date).days + 1
dates = [start_date + datetime.timedelta(days=i) for i in range(total_days)]

# Precompute day properties
def is_festivo_shift(d, s):
    # s: 0=L, 1=M, 2=T, 3=N
    if s == 0:
        return False
    wd = d.weekday()
    is_hol = d in holidays
    # Rule:
    # "turnos de mañana y tarde del día festivo"
    if is_hol and s in [1, 2]:
        return True
    # "los turnos de viernes noche"
    if wd == 4 and s == 3:
        return True
    # "los sabados todos los turnos"
    if wd == 5:
        return True
    # "domingos turnos de mañana y tarde"
    if wd == 6 and s in [1, 2]:
        return True
    return False

print(f"Total days: {total_days}")
