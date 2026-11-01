# 📚 Archivo Histórico de Festivos y Vacaciones (2011 - 2027+)

> Documento técnico que consolida los datos históricos del archivo `Cuadrante 2026 para Agente.xlsx`. Contiene el registro de asignación de festivos (2011-2027), el balance acumulado de equidad y el algoritmo de rotación de vacaciones para planificar automáticamente el **Cuadrante 2028**.

---

## 1. Mapeo Histórico de Trabajadores (Predecesores y Actuales)

A lo largo de los años (2011 a 2027) la plantilla ha tenido jubilaciones o relevos. Para mantener la justicia distributiva y el cómputo acumulado, los trabajadores actuales heredan el historial de sus predecesores según las fórmulas del Excel:

| Código Actual | Trabajador Actual | Predecesores Sumados en la Fórmula Excel | Motivo y Código(s) en Registro |
|---|---|---|---|
| **AJ** | Antonio Jesús Sánchez | `PS` + `AJ` | Relevó a `PS`. Códigos: `PS`, `AJ` |
| **SM** | Santiago Molina | `PR` + `MB (antiguo)` + `SM` | Relevó a **Marcos Brito** (`MB` histórico) y a `PR`. |
| **AH** | Alberto Higueras | `DC` + `AH` | Relevó a `DC`. Códigos: `DC`, `AH` |
| **FE** | Francisco Espín | `JM` + `FE` | Relevó a `JM`. Códigos: `JM`, `FE` |
| **MB / MG** | Miguel Benítez | `AC` + `MB` (en 2027 anotado como `MG`) | Relevó a `AC`. En 2027 se le asignó la sigla **`MG`** para no crear confusión con el histórico Marcos Brito (`MB`). |
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
| **Antonio Jesús Sánchez** (`AJ`) | **71** | +0 o compensación |
| **Santiago Molina** (`SM`) | **71** | +0 o compensación |
| **Alberto Higueras** (`AH`) | **70** | **Prioridad +1 (para alcanzar 71)** |
| **Francisco Espín** (`FE`) | **70** | **Prioridad +1 (para alcanzar 71)** |
| **Miguel Benítez** (`MB`) | **71** | +0 o compensación |
| **Francisco Cantarero** (`PC`) | **70** | **Prioridad +1 (para alcanzar 71)** |
| **Antonio León** (`AL`) | **71** | +0 o compensación |

> [!TIP]
> En el diseño del **Cuadrante 2028**, los trabajadores con 70 festivos (**Alberto Higueras, Francisco Espín y Francisco Cantarero**) deben tener prioridad para asumir 1 festivo adicional y empatar a 71 con el resto del equipo.

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
| **15 DE MAYO SAN EUFRASIO** | X | X | PC-JM | AJ-AL | X | X |  |  |
| **15 DE AGOSTO ** | PC-AL | DC | AL | FE-PC | AC-AJ | AH-AC | AL | SM |
| **NOCHES DE FERIA** | X | PC | AC | AJ | MB | AH | AJ | AL |
| **FERIA** | DC-AC | JM | AL-PC | AL | AC-AL | AL-MB | FE | AJ |
| **12 DE OCTUBRE** | PC-JM | AL-AJ | DC-AJ | PC-MB | AC-MB | FE-PC | AH-AJ | MG-PC |
| **1 DE NOVIEMBRE** | AL-JM | AC-AJ | AC-PC | AL-DC | FE-MB | PC-MB | FE-AH | AJ-AL |
| **6 DICIEMBRE-CONSTITUCION** | AL-PC | JM-AC | AC-AJ | DC-MB | FE-AC | AJ-MB | AH-FE | PC-SM |
| **8 DICIEMBRE-INMACULADA** | PC-DC | AL-AC | AL-MB | DC-MB | AJ-AC | AJ-FE | AH-FE | PC-SM |
| **NOCHEBUENA** | AL | MB | DC | FE | PC | AJ | AC | AH |
| **25 DICIEMBRE-NAVIDAD** | PC-AJ | AL-DC | FE-MB | AC-AJ | AH-AJ | PC-MB | MB-AL | MG-FE |
| **NOCHE 31 DIEMBRE NOCHE** | AJ | DC | AC | MB | AL | FE | PC | MG |

---

## 4. Patrón y Algoritmo de Rotación de Vacaciones

Las vacaciones se dividen en 8 quincenas anuales (Junio a Septiembre) y se asignan a 4 parejas estables:
1. **Pareja 1**: `AJ - MB` (Antonio Jesús Sánchez y Miguel Benítez - antiguamente `AC`)
2. **Pareja 2**: `PC - FE` (Francisco Cantarero y Francisco Espín)
3. **Pareja 3**: `AL - HG` (Antonio León e Hilario Gómez)
4. **Pareja 4**: `SM - AH` (Santiago Molina y Alberto Higueras - antiguamente `MB-DC`)

### Bloques Quincenales:
* **Turno 1**: 1 al 15 de Junio y 1 al 15 de Agosto
* **Turno 2**: 16 al 30 de Junio y 16 al 31 de Agosto
* **Turno 3**: 1 al 15 de Julio y 1 al 15 de Septiembre
* **Turno 4**: 16 al 31 de Julio y 16 al 30 de Septiembre

### Secuencia Histórica de Rotación y Proyección 2028:

| Año | Turno 1 (1-15 Jun & 1-15 Ago) | Turno 2 (16-30 Jun & 16-31 Ago) | Turno 3 (1-15 Jul & 1-15 Sep) | Turno 4 (16-31 Jul & 16-30 Sep) |
|:---:|:---:|:---:|:---:|:---:|
| **2025** | AL - HG | MB - AH | AJ - MB | PC - FE |
| **2026** | PC - FE | AL - HG | MB - AH | AJ - MB |
| **2027** | **AJ - MB** | **PC - FE** | **AL - HG** | **SM - AH** |
| **2028 (Previsto)** | **SM - AH** | **AJ - MB** | **PC - FE** | **AL - HG** |
| **2029 (Previsto)** | **AL - HG** | **SM - AH** | **AJ - MB** | **PC - FE** |

> La rotación es un ciclo puro de 4 años: cada año cada pareja avanza exactamente 1 turno (+1 quincena).