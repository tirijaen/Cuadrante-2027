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

La equidad acumulada tras 17 años de registros es matemáticamente perfecta (máxima diferencia de solo 1 festivo):

| Trabajador | Festivos Acumulados (2011 - 2027) | Objetivo para 2028 |
|---|:---:|---|
| **Antonio Jesús Sánchez** (`AJ`) | **72** | +0 o compensación |
| **Santiago Molina** (`SM`) | **71** | +0 o compensación |
| **Alberto Higueras** (`AH`) | **70** | **Prioridad +1 (para alcanzar 71)** |
| **Francisco Espín** (`FE`) | **70** | **Prioridad +1 (para alcanzar 71)** |
| **Miguel Benítez** (`MB`) | **70** | **Prioridad +1 (para alcanzar 71)** |
| **Francisco Cantarero** (`PC`) | **70** | **Prioridad +1 (para alcanzar 71)** |
| **Antonio León** (`AL`) | **71** | +0 o compensación |

> [!TIP]
> En el diseño del **Cuadrante 2028**, los trabajadores con 70 festivos (**Alberto Higueras, Francisco Espín, Miguel Benítez y Francisco Cantarero**) deben tener prioridad para asumir 1 festivo adicional y equilibrar a 71-72 con el resto del equipo.

---

## 3. Matriz Histórica de Festivos por Años Recientes (2020 - 2027)

| Festivo / Puesto | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | 2027 (Asignado) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **NOCHES DEL 1 DE ENERO** | PS | AL | PS | DC | FE | AC | PC | SM |
| **1 DE ENERO** | JM-AL | DC-PR | JM-PC | MB-FE | AL-AC | AJ-AH | AJ-AC | AL-AH |
| **6 DE ENERO** | PR-JM | PC-AJ | DC-AJ | PC-FE | AC-MB | MB-AL | FE-AC | AL-AH |
| **28 DE FEBRERO** | AL-DC | JM-PR | PC-AC | DC-AL | AJ-AH | AL-PC | AJ-AC | FE-PC |
| **SEMANA SANTA** | PR-DC | AL-PC | MB-DC | AJ-FE | AC-FE | PC-AL | AC-AH | AJ-SM |
| **NOCHES SEMANA SANTA** | AC | PR | JM-PC | DC | AL | AJ | MB | MG |
| **VIRGEN DE LA CABEZA** | PR-DC | JM-AC | AL-PC | AJ -MB | FE-AL | AH-AC | AL-SM | AJ-AH |
| **NOCHES VIRGEN DE LA CABEZA** | AJ | AL | AJ | FE | MB | PC | AH | AL |
| **1 DE MAYO** | JM-AC | AC-PR | AL-PS | AJ-MB | AC-AH | FE-PC | PC-SM | MG-FE |
| **15 DE AGOSTO ** | PC-AL | DC | AL | FE-PC | AC-AJ | AH-AC | AL | SM |
| **NOCHES DE FERIA** | X | PC | AC | AJ | MB | AH | AJ | EX1 |
| **FERIA** | DC-AC | JM | AL-PC | AL | AC-AL | AL-MB | FE | AJ |
| **12 DE OCTUBRE** | PC-JM | AL-AJ | DC-AJ | PC-MB | AC-MB | FE-PC | AH-AJ | MG-PC |
| **1 DE NOVIEMBRE** | AL-JM | AC-AJ | AC-PC | AL-DC | FE-MB | PC-MB | FE-AH | AJ-AL |
| **6 DICIEMBRE-CONSTITUCION** | AL-PC | JM-AC | AC-AJ | DC-MB | FE-AC | AJ-MB | AH-FE | PC-SM |
| **8 DICIEMBRE-INMACULADA** | PC-DC | AL-AC | AL-MB | DC-MB | AJ-AC | AJ-FE | AH-FE | PC-SM |
| **NOCHEBUENA** | AL | MB | DC | FE | PC | AJ | AC | AH |
| **25 DICIEMBRE-NAVIDAD** | PC-AJ | AL-DC | FE-MB | AC-AJ | AH-AJ | PC-MB | MB-AL | MG-FE |
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

| Festividad Oficial | AJ | SM | AH | FE | MB | PC | AL | Criterio de Equidad para 2028 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **NOCHES DEL 1 DE ENERO** | 3 | 2 | 2 | 2 | 2 | 2 | 2 | AJ máxima (3) libra; resto (2) en turno |
| **1 DE ENERO** | 4 | 5 | 5 | 5 | 4 | 4 | 4 | SM, AH, FE (5) descansan; AJ, MB, PC, AL (4) prioridad |
| **6 DE ENERO (Reyes)** | 4 | 4 | 5 | 4 | 4 | 6 | 4 | PC (6) y AH (5) descansan; AJ, SM, FE, MB, AL (4) prioridad |
| **28 DE FEBRERO (Día de Andalucía)** | 4 | 4 | 4 | 5 | 4 | 5 | 5 | FE, PC, AL (5) descansan; AJ, SM, AH, MB (4) prioridad |
| **SEMANA SANTA** | 5 | 5 | 6 | 4 | 4 | 4 | 4 | AH (6) y AJ, SM (5) descansan; FE, MB, PC, AL (4) prioridad |
| **NOCHES SEMANA SANTA** | 2 | 3 | 2 | 2 | 3 | 2 | 2 | SM, MB (3) descansan; AJ, AH, FE, PC, AL (2) en turno |
| **VIRGEN DE LA CABEZA (Romería)** | 5 | 5 | 4 | 4 | 5 | 4 | 5 | AJ, SM, MB, AL (5) descansan; AH, FE, PC (4) prioridad |
| **NOCHES VIRGEN DE LA CABEZA** | 4 | 2 | 2 | 2 | 3 | 2 | 3 | AJ (4) y MB, AL (3) descansan; SM, AH, FE, PC (2) en turno |
| **1 DE MAYO (Trabajo)** | 5 | 5 | 4 | 5 | 5 | 4 | 4 | AJ, SM, FE, MB (5) descansan; AH, PC, AL (4) prioridad |
| **15 DE AGOSTO (Asunción)** | 3 | 4 | 3 | 3 | 3 | 4 | 6 | AL (6) máxima libranza; AJ, AH, FE, MB (3) prioridad |
| **NOCHES DE FERIA** | 3 | 1 | 1 | 2 | 2 | 2 | 0 | AL (0) máxima prioridad de turno; AJ (3) descansa; SM, AH (1) en turno |
| **FERIA (Día)** | 3 | 3 | 4 | 4 | 3 | 3 | 4 | AH, FE, AL (4) descansan; AJ, SM, MB, PC (3) prioridad |
| **12 DE OCTUBRE (Hispanidad)** | 5 | 4 | 5 | 4 | 5 | 5 | 4 | AJ, AH, MB, PC (5) descansan; SM, FE, AL (4) prioridad |
| **1 DE NOVIEMBRE (Todos los Santos)** | 4 | 4 | 5 | 4 | 4 | 5 | 4 | AH, PC (5) descansan; AJ, SM, FE, MB, AL (4) prioridad |
| **6 DICIEMBRE (Constitución)** | 4 | 5 | 4 | 4 | 5 | 4 | 5 | SM, MB, AL (5) descansan; AJ, AH, FE, PC (4) prioridad |
| **8 DICIEMBRE (Inmaculada)** | 4 | 5 | 5 | 5 | 4 | 4 | 4 | SM, AH, FE (5) descansan; AJ, MB, PC, AL (4) prioridad |
| **NOCHEBUENA** | 2 | 2 | 3 | 2 | 2 | 2 | 2 | AH (3) descansa; AJ, SM, FE, MB, PC, AL (2) en turno |
| **25 DICIEMBRE (Navidad)** | 4 | 5 | 4 | 5 | 4 | 4 | 5 | SM, FE, AL (5) descansan; AJ, AH, MB, PC (4) prioridad |
| **NOCHE 31 DICIEMBRE (Nochevieja)** | 3 | 2 | 2 | 2 | 3 | 2 | 2 | AJ, MB (3) descansan; resto de plantilla (2) en turno |
| **TOTALES ACUMULADOS** | **71** | **70** | **70** | **68** | **69** | **68** | **69** | **Equidad global histórica: 68 - 71** |