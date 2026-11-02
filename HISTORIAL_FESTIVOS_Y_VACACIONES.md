# 📚 Archivo Histórico de Festivos y Vacaciones (2011 - 2027+)

> Documento técnico que consolida los datos históricos del archivo `Cuadrante 2026 para Agente.xlsx`. Contiene el registro de asignación de festivos (2011-2027), el balance acumulado de equidad y el algoritmo de rotación de vacaciones para planificar automáticamente el **Cuadrante 2028**.

---

## 1. Mapeo Histórico de Trabajadores (Predecesores y Actuales)

A lo largo de los años (2011 a 2027) la plantilla ha tenido jubilaciones o relevos. Para mantener la justicia distributiva y el cómputo acumulado, los trabajadores actuales heredan el historial de sus predecesores según las fórmulas del Excel:

| Código Actual | Trabajador Actual | Predecesores Sumados en la Fórmula Excel | Motivo y Código(s) en Registro |
|---|---|---|---|
| **AJ** | Antonio Jesús Sánchez | `PS` + `AJ` | Relevó a `PS`. Códigos: `PS`, `AJ` |
| **SM** | Santiago Molina | `PR` + `MB (Marcos Brito)` + `SM` | Relevó a **Marcos Brito** (`MB` en todo el histórico previo a 2027) y a `PR`. |
| **AH** | Alberto Higueras | `DC` + `AH` | Relevó a `DC`. Códigos: `DC`, `AH` |
| **FE** | Francisco Espín | `JM` + `FE` | Relevó a `JM`. Códigos: `JM`, `FE` |
| **MB / MG** | Miguel Benítez | `AC` + `MG` (nuevo en 2027) | **Miguel Benítez es nuevo en 2027** y **únicamente lo ha precedido `AC`**. En 2027 se le asignó el código `MG` en las fórmulas para no confundir con `MB` (Marcos Brito). |
| **PC** | Francisco Cantarero | Sin predecesor (titular continuo) | Ha estado presente en todo el histórico (`PC`). |
| **AL** | Antonio León | `FR` + `AL` | Relevó a `FR`. Códigos: `FR`, `AL` |
| **HG** | Hilario Gómez | Exento de festivos (solo aparece en vacaciones) | Solo rota en quincenas de vacaciones (`HG`). |

> [!NOTE]
> **Criterio de Asignación en Festivos con 2 Trabajadores (ej. `AL-AH`, `FE-PC`):**  
> Cuando en una casilla del registro aparecen dos compañeros, significa que **uno realiza el turno de Mañana (07:00 a 15:00) y el otro realiza el de Tarde (15:00 a 23:00) indistintamente**, ya que ambos turnos tienen la misma consideración legal y retributiva de festivo diurno.


---

## 2. Balance Acumulado de Festivos (2011 - 2027)

La equidad acumulada tras 17 años de registros es matemáticamente perfecta (entre 68 y 71 festivos totales en casi dos décadas):

| Trabajador | Festivos Acumulados (2011 - 2027) | Objetivo para 2028 |
|---|:---:|---|
| **Antonio Jesús Sánchez** (`AJ`) | **71** | Equilibrio histórico consolidado |
| **Santiago Molina** (`SM`) | **68** | **Prioridad festivos 2028 (+1)** |
| **Alberto Higueras** (`AH`) | **70** | Equilibrio histórico consolidado |
| **Francisco Espín** (`FE`) | **70** | Equilibrio histórico consolidado |
| **Miguel Benítez** (`MB`) | **69** | Equilibrio histórico consolidado |
| **Francisco Cantarero** (`PC`) | **69** | Equilibrio histórico consolidado |
| **Antonio León** (`AL`) | **70** | Equilibrio histórico consolidado |

> [!TIP]
> En el diseño del **Cuadrante 2028**, el trabajador con 68 festivos (**Santiago Molina**) tendrá prioridad natural para asumir festivos adicionales y equilibrar con el resto del equipo.

---

## 3. Matriz Histórica de Festivos por Años Recientes (2020 - 2027)

| Festivo / Puesto | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | 2027 (Asignado) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **NOCHES DEL 1 DE ENERO** | PS | AL | PS | DC | FE | AC | PC | SM |
| **1 DE ENERO** | JM-AL | DC-PR | JM-PC | MB-FE | AL-AC | AJ-AH | AJ-AC | AH-PC |
| **6 DE ENERO** | PR-JM | PC-AJ | DC-AJ | PC-FE | AC-MB | MB-AL | FE-AC | AH-SM |
| **28 DE FEBRERO** | AL-DC | JM-PR | PC-AC | DC-AL | AJ-AH | AL-PC | AJ-AC | FE-PC |
| **SEMANA SANTA** | PR-DC | AL-PC | MB-DC | AJ-FE | AC-FE | PC-AL | AC-AH | AJ-PC |
| **NOCHES SEMANA SANTA** | AC | PR | JM-PC | DC | AL | AJ | MB | MG |
| **VIRGEN DE LA CABEZA** | PR-DC | JM-AC | AL-PC | AJ -MB | FE-AL | AH-AC | AL-SM | AH-FE |
| **NOCHES VIRGEN DE LA CABEZA** | AJ | AL | AJ | FE | MB | PC | AH | AL |
| **1 DE MAYO** | JM-AC | AC-PR | AL-PS | AJ-MB | AC-AH | FE-PC | PC-SM | AL-PC |
| **15 DE AGOSTO ** | PC-AL | DC | AL | FE-PC | AC-AJ | AH-AC | AL | MG-SM |
| **NOCHES DE FERIA** | X | PC | AC | AJ | MB | AH | AJ | EX1 |
| **FERIA** | DC-AC | JM | AL-PC | AL | AC-AL | AL-MB | FE | AJ-MG |
| **12 DE OCTUBRE** | PC-JM | AL-AJ | DC-AJ | PC-MB | AC-MB | FE-PC | AH-AJ | AL-FE |
| **1 DE NOVIEMBRE** | AL-JM | AC-AJ | AC-PC | AL-DC | FE-MB | PC-MB | FE-AH | AJ-AL |
| **6 DICIEMBRE-CONSTITUCION** | AL-PC | JM-AC | AC-AJ | DC-MB | FE-AC | AJ-MB | AH-FE | FE-PC |
| **8 DICIEMBRE-INMACULADA** | PC-DC | AL-AC | AL-MB | DC-MB | AJ-AC | AJ-FE | AH-FE | AL-FE |
| **NOCHEBUENA** | AL | MB | DC | FE | PC | AJ | AC | AH |
| **25 DICIEMBRE-NAVIDAD** | PC-AJ | AL-DC | FE-MB | AC-AJ | AH-AJ | PC-MB | MB-AL | AJ-MG |
| **NOCHE 31 DIEMBRE NOCHE** | AJ | DC | AC | MB | AL | FE | PC | AJ |

---

## 4. Patrón y Algoritmo de Rotación de Vacaciones

Las vacaciones se dividen en 8 quincenas anuales (Junio a Septiembre) y se asignan a 4 parejas estables:
1. **Pareja 1**: `AJ - MB` (Antonio Jesús Sánchez y Miguel Benítez - antiguamente `AC`)
2. **Pareja 2**: `PC - FE` (Francisco Cantarero y Francisco Espín)
3. **Pareja 3**: `AL - HG` (Antonio León e Hilario Gómez)
4. **Pareja 4**: `SM - AH` (Santiago Molina y Alberto Higueras - antiguamente `MB-DC`)

### Bloques Quincenales:
* **Turno 1**: 01 al 15 de Junio (15 días) y 01 al 15 de Agosto (15 días)
* **Turno 2**: 16 al 30 de Junio (15 días) y 16 al 30 de Agosto (15 días)
* **Turno 3**: 01 al 15 de Julio (15 días) y 01 al 15 de Septiembre (15 días)
* **Turno 4**: 16 al 30 de Julio (15 días) y 16 al 30 de Septiembre (15 días)

> [!IMPORTANT]
> **Duración exacta de las quincenas:** Todas las quincenas duran exactamente **15 días naturales** (del 1 al 15 y del 16 al 30). Por ello, **no duran hasta el 31 de julio ni hasta el 31 de agosto** (el día 31 queda fuera del periodo quincenal).

### Secuencia Histórica de Rotación y Proyección 2028:

| Año | Turno 1 (01-15 Jun & 01-15 Ago) | Turno 2 (16-30 Jun & 16-30 Ago) | Turno 3 (01-15 Jul & 01-15 Sep) | Turno 4 (16-30 Jul & 16-30 Sep) |
|:---:|:---:|:---:|:---:|:---:|
| **2025** | AL - HG | MB - AH | AJ - MB | PC - FE |
| **2026** | PC - FE | AL - HG | MB - AH | AJ - MB |
| **2027** | **AJ - MB** | **PC - FE** | **AL - HG** | **SM - AH** |
| **2028 (Previsto)** | **SM - AH** | **AJ - MB** | **PC - FE** | **AL - HG** |
| **2029 (Previsto)** | **AL - HG** | **SM - AH** | **AJ - MB** | **PC - FE** |

> La rotación es un ciclo puro de 4 años: cada año cada pareja avanza exactamente 1 turno (+1 quincena).

---

## 5. Tabla de Equidad por Cada Fiesta Individual (2011 - 2027)

> **Rango de referencia Excel:** Columnas `S2:Y21` / `AB2:AH21`.  
> En el servicio no solo se vigila la equidad del cómputo total de festivos anuales (71 vs 70), sino también **la justicia distributiva en cada festividad específica**. De este modo, nadie repite desproporcionadamente una fiesta señalada (Nochebuena, Nochevieja, Romería, Semana Santa, etc.) mientras otro no la realiza.

| Festividad Oficial | AJ | SM | AH | FE | MB | PC | AL | Criterio de Equidad 2027 / 2028 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **NOCHES DEL 1 DE ENERO** | 3 | 2 | 2 | 2 | 2 | 2 | 2 | Santi M (Noche) (tenía 1, mínimo de todos) |
| **1 DE ENERO** | 4 | 5 | 5 | 5 | 4 | 5 | 3 | Alberto H (M) y Paco C (T) en turno |
| **6 DE ENERO (Reyes)** | 4 | 5 | 5 | 4 | 4 | 6 | 3 | Alberto H (M) y Santi M (T); FE descansa |
| **28 DE FEBRERO (Día de Andalucía)** | 4 | 4 | 4 | 5 | 4 | 5 | 5 | Paco C (M) y Fran Espín (T); AL descansa |
| **SEMANA SANTA** | 5 | 4 | 6 | 4 | 4 | 5 | 4 | Antonio J (M) y Paco C (T) íntegros 25-28 Mar |
| **NOCHES SEMANA SANTA** | 2 | 3 | 2 | 2 | 3 | 2 | 2 | Miguel B (3) noches completas 25, 26 y 27 Mar |
| **VIRGEN DE LA CABEZA (Romería)** | 4 | 5 | 4 | 5 | 5 | 4 | 5 | Alberto H (M) y Fran Espín (T) íntegros 23-26 Abr |
| **NOCHES VIRGEN DE LA CABEZA** | 4 | 2 | 2 | 2 | 3 | 2 | 3 | A. León (3) noches completas 23, 24 y 25 Abr |
| **1 DE MAYO (Trabajo)** | 5 | 5 | 4 | 4 | 4 | 5 | 5 | Paco C (M) y A. León (T); AJ y SM descansan |
| **15 DE AGOSTO (Asunción)** | 3 | 4 | 3 | 3 | 4 | 4 | 6 | Santi M (M) y Miguel B (T) |
| **NOCHES DE FERIA** | 3 | 1 | 1 | 2 | 2 | 2 | 0 | Extra 1 (noches completas 03 al 06 Sep) |
| **FERIA (Día)** | 3 | 3 | 4 | 4 | 4 | 3 | 4 | Miguel B (M) y Antonio J (T) íntegros 4-6 Sep (Alberto H descansó) |
| **12 DE OCTUBRE (Hispanidad)** | 5 | 4 | 5 | 5 | 4 | 4 | 5 | Fran Espín (M) y A. León (T); AJ y AH descansan |
| **1 DE NOVIEMBRE (Todos los Santos)** | 4 | 4 | 5 | 4 | 4 | 5 | 4 | Antonio J (M) y A. León (T) (ambos tenían 3) |
| **6 DICIEMBRE (Constitución)** | 4 | 4 | 4 | 5 | 5 | 4 | 5 | Fran Espín (M) y Paco C (T) |
| **8 DICIEMBRE (Inmaculada)** | 4 | 4 | 5 | 6 | 4 | 3 | 5 | A. León (M) y Fran Espín (T) |
| **NOCHEBUENA** | 2 | 2 | 3 | 2 | 2 | 2 | 2 | Alberto H (3) turno de noche completo |
| **25 DICIEMBRE (Navidad)** | 5 | 5 | 4 | 4 | 4 | 4 | 5 | Miguel B (M, sube de 3 a 4) y Antonio J (T) |
| **NOCHE 31 DICIEMBRE (Nochevieja)** | 3 | 2 | 2 | 2 | 3 | 2 | 2 | Antonio J (3) turno de noche exclusivo |
| **TOTALES ACUMULADOS** | **71** | **68** | **70** | **70** | **69** | **69** | **70** | **Equidad global histórica: 68 - 71** |