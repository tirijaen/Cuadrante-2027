"""
Script de sincronización automática de festivos históricos (2011-2027)
Sincroniza:
1. Cuadrante 2026 para Agente.xlsx (hoja FESTIVOS, columna 2027 y fórmulas de recuento).
2. js/historical_data.js (items de festivos, conteos individuales y totales acumulados).
3. Asegura coherencia 100% con cuadrante_2027_v3.json.
"""
import openpyxl, json, datetime

# Carga de cuadrante oficial
with open('cuadrante_2027_v3.json', 'r', encoding='utf-8') as f:
    q_data = json.load(f)

workers = q_data['workers']
dates = q_data['dates']
matrix = q_data['matrix']
matrix_dot = q_data['matrix_dot']

worker_short = {
    'Antonio J': 'AJ',
    'Santi M': 'SM',
    'Alberto H': 'AH',
    'Fran Espin': 'FE',
    'Miguel B': 'MG', # Código histórico en Excel
    'Paco C': 'PC',
    'A. Leon': 'AL',
    'Extra 1': 'EX1',
    'Hilario': 'HG'
}

def get_day(dt_str):
    d_i = dates.index(dt_str)
    return {w: matrix[i][d_i] for i, w in enumerate(workers) if matrix[i][d_i]}

def get_mt_str(dt_str):
    sh = get_day(dt_str)
    m_w = [worker_short[w] for w, s in sh.items() if s == 'M']
    t_w = [worker_short[w] for w, s in sh.items() if s == 'T']
    return f'{m_w[0]}-{t_w[0]}' if m_w and t_w else '-'.join(m_w + t_w)

def get_n_str(dt_str):
    sh = get_day(dt_str)
    n_w = [worker_short[w] for w, s in sh.items() if s == 'N']
    return '-'.join(n_w)

# Mapeo oficial 2027 derivado del cuadrante
official_2027_map = {
    'NOCHES DEL 1 DE ENERO': get_n_str('2027-01-01'),        # SM
    '1 DE ENERO': get_mt_str('2027-01-01'),                   # AL-AH
    '6 DE ENERO': get_mt_str('2027-01-06'),                   # AL-AH
    '28 DE FEBRERO': get_mt_str('2027-02-28'),                # PC-MG (Paco C Mañana, Miguel B Tarde)
    'SEMANA SANTA': get_mt_str('2027-03-25'),                 # AJ-PC (Antonio J Mañana, Paco C Tarde)
    'NOCHES SEMANA SANTA': get_n_str('2027-03-25'),           # MG (Miguel B)
    'VIRGEN DE LA CABEZA': get_mt_str('2027-04-24'),          # AH-FE (Alberto H Mañana, Fran Espin Tarde)
    'NOCHES VIRGEN DE LA CABEZA': get_n_str('2027-04-24'),    # AL (Antonio León)
    '1 DE MAYO': get_mt_str('2027-05-01'),                    # PC-AL (Paco C Mañana, A. León Tarde)
    '15 DE AGOSTO ': get_mt_str('2027-08-16'),                # MG-SM (Miguel B Mañana, Santi M Tarde)
    'NOCHES DE FERIA': get_n_str('2027-09-11'),               # EX1 (Extra 1)
    'FERIA': get_mt_str('2027-09-11'),                        # PC-AJ (Paco C Mañana, Antonio J Tarde)
    '12 DE OCTUBRE': get_mt_str('2027-10-12'),                # FE-MG (Fran Espin Mañana, Miguel B Tarde)
    '1 DE NOVIEMBRE': get_mt_str('2027-11-01'),               # AJ-AL (Antonio J Mañana, A. León Tarde)
    '6 DICIEMBRE-CONSTITUCION': get_mt_str('2027-12-06'),     # SM-PC (Santi M Mañana, Paco C Tarde)
    '8 DICIEMBRE-INMACULADA': get_mt_str('2027-12-08'),       # SM-PC (Santi M Mañana, Paco C Tarde)
    'NOCHEBUENA': get_n_str('2027-12-24'),                    # AH (Alberto H)
    '25 DICIEMBRE-NAVIDAD': get_mt_str('2027-12-25'),         # FE-MG (Fran Espin Mañana, Miguel B Tarde)
    'NOCHE 31 DIEMBRE NOCHE': get_n_str('2027-12-31')         # AJ (Antonio J)
}

print('Asignaciones 2027 oficiales calculadas:')
for k, v in official_2027_map.items():
    print(f'  {k:28s}: {v}')

# 1. Actualizar Cuadrante 2026 para Agente.xlsx
wb = openpyxl.load_workbook('Cuadrante 2026 para Agente.xlsx')
ws = wb['FESTIVOS']
for r in range(2, 21):
    fest_name = ws.cell(row=r, column=1).value
    clean_name = fest_name.strip() if fest_name else ''
    match_key = None
    for k in official_2027_map:
        if k.strip() == clean_name:
            match_key = k
            break
    if match_key:
        val_2027 = official_2027_map[match_key]
        ws.cell(row=r, column=18, value=val_2027)

wb.save('Cuadrante 2026 para Agente.xlsx')
print('Cuadrante 2026 para Agente.xlsx actualizado con éxito!')

# 2. Actualizar js/historical_data.js
with open('js/historical_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

json_str = text.replace('window.HISTORICAL_DATA = ', '').rstrip(';\n')
hist_data = json.loads(json_str)

patterns = {
    'AJ': ['PS', 'AJ'],
    'SM': ['SM', 'PR', 'MB'], # Marcos Brito era predecesor de Santi M
    'AH': ['AH', 'DC'],
    'FE': ['FE', 'JM'],
    'MB': ['MG', 'AC'],        # Miguel Benitez en histórico es MG, predecesor AC
    'PC': ['PC'],
    'AL': ['AL', 'FR']
}

totals = {w: 0 for w in patterns}

for item in hist_data['festivos']['items']:
    name = item['name']
    clean_name = name.strip()
    match_key = None
    for k in official_2027_map:
        if k.strip() == clean_name:
            match_key = k
            break
    if match_key:
        item['years']['2027'] = official_2027_map[match_key]
    
    # Recalcular conteos del festivo
    item_counts = {w: 0 for w in patterns}
    valid_codes_count = 0
    for yr, val in item['years'].items():
        if val:
            for p in str(val).split('-'):
                clean = p.strip()
                if clean not in ['X', 'None', '', 'EX1', 'EX', 'HG', 'FH']:
                    valid_codes_count += 1
                for w, pats in patterns.items():
                    if clean in pats:
                        item_counts[w] += 1
                        totals[w] += 1
    item['counts'] = item_counts
    item['totalTimes'] = valid_codes_count

hist_data['festivos']['totals'] = totals

# Guardar js/historical_data.js
new_content = 'window.HISTORICAL_DATA = ' + json.dumps(hist_data, indent=2, ensure_ascii=False) + ';\n'
with open('js/historical_data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('js/historical_data.js actualizado con éxito!')
print('Nuevos totales acumulados (2011-2027):')
for w, tot in totals.items():
    print(f'  {w}: {tot}')
