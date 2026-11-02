# Compendio Oficial de Reglas y Criterios Operativos del Cuadrante (Andújar)

Este documento recopila la totalidad de las reglas, restricciones operativas, criterios ergonómicos, asignaciones fijas y directrices de diseño acumuladas para la generación, optimización y resolución matemática del cuadrante laboral. Servirá como **marco de referencia único y permanente para futuros diseños y revisiones**.

---

## 1. Plantilla y Roles

La plantilla consta de 9 trabajadores:
1. **Antonio Jesús Sánchez** (`Antonio J`) - Personal fijo, rotación completa (M, T, N, Festivos)
2. **Santiago Molina** (`Santi M`) - Personal fijo, rotación completa (M, T, N, Festivos)
3. **Alberto Higueras** (`Alberto H`) - Personal fijo, rotación completa (M, T, N, Festivos)
4. **Francisco Espín** (`Fran Espin`) - Personal fijo, rotación completa (M, T, N, Festivos)
5. **Miguel Benitez** (`Miguel B`) - Personal fijo, rotación completa (M, T, N, Festivos)
6. **Francisco Cantarero** (`Paco C`) - Personal fijo, rotación completa (M, T, N, Festivos)
7. **Antonio León** (`A. Leon`) - Personal fijo, rotación completa (M, T, N, Festivos)
8. **Hilario Gomez** (`Hilario`) - Régimen singular: Solo Mañanas y Tardes de Lunes a Viernes
9. **Extra 1** - Personal eventual de refuerzo de verano (Junio a Septiembre)

### Restricciones Individuales Específicas
* **Hilario**:
  * Solo puede trabajar en turnos de **Mañana (M)** y **Tarde (T)** de lunes a viernes laborables.
  * **NUNCA** realiza turnos de **Noche (N)**.
  * **NUNCA** trabaja en **fines de semana** (Sábado, Domingo) ni en **días festivos**.
  * Sus 220 jornadas anuales se reparten de forma equitativa exclusivamente entre Mañanas y Tardes (~110-120 M, ~100-110 T).
* **Extra 1**:
  * Contratado exclusivamente durante los 4 meses de verano: **Junio, Julio, Agosto y Septiembre** (para refuerzo y cobertura de vacaciones). En el resto de meses no trabaja (0 días).
  * Realiza entre 80 y 88 días anuales, pudiendo trabajar **hasta 22 días al mes** en los meses estivales.
  * **Jornadas Consecutivas**: Puede trabajar **hasta 6 días seguidos** (a diferencia del personal fijo cuyo tope es 5). Si trabaja 6 días seguidos, debe disponer preferiblemente de **dos días consecutivos de descanso posterior**.
  * **Periodo de Aprendizaje (1 al 14 de Junio)**: Durante sus dos primeras semanas no tiene autonomía para estar solo en turno:
    * No puede realizar turnos de Noche (N) durante esas 2 semanas.
    * No puede trabajar en fines de semana o festivos durante esas 2 semanas (ya que en esos días solo hay 1 trabajador por turno).
  * **Noches de Feria de Andújar**: Es el **candidato preferente** para realizar las noches de la Feria de Andújar (noches del 4, 5 y 6 de septiembre, complementado con la noche del viernes 3 de septiembre por coherencia y descanso de fin de semana).

---

## 2. Horarios de los Turnos y Coberturas Mínimas

### Horarios
* **Mañana (M)**: 07:00 a 15:00
* **Tarde (T)**: 15:00 a 23:00
* **Noche (N)**: 23:00 a 07:00

### Coberturas Diarias Mínimas y Absorción de Días Sobrantes
1. **Lunes a Viernes Ordinarios (Octubre a Mayo)**:
   * **Mañana (M)**: 3 trabajadores
   * **Tarde (T)**: 2 trabajadores (**ampliable a 3 turnos de tarde** para utilizar el sobrante de días trabajados y cuadrar perfectamente el cuadrante y las 220 jornadas anuales).
   * **Noche (N)**: 1 trabajador
2. **Lunes a Viernes en Verano (Junio, Julio, Agosto y Septiembre)**:
   * **Lunes y Martes**: 3 Mañanas, 2-3 Tardes, 1 Noche.
   * **Miércoles, Jueves y Viernes**: Habitualmente 2 Mañanas (ampliable a 3 si es necesario) y 2 a 3 Tardes para absorber jornadas sobrantes.
   * **Noche (N)**: 1 trabajador diario.
3. **Sábados, Domingos y Días Festivos**:
   * **Mañana (M)**: Exactamente 1 trabajador
   * **Tarde (T)**: Exactamente 1 trabajador
   * **Noche (N)**: Exactamente 1 trabajador
4. **Regla de Oro de la Noche**:
   * Todos los días del año (365 días) deben contar con **exactamente 1 trabajador en turno de Noche**.

---

## 3. Calendario, Festivos y Nomenclatura para Excel

### Calendario y Festivos Locales de Andújar
Además de los festivos nacionales y autonómicos oficiales de Andalucía, se aplican de forma fija e ineludible las dos fiestas locales:
* **26 de Abril**: Fiesta local oficial (Romería Virgen de la Cabeza).
* **6 de Septiembre**: Fiesta local oficial (Feria de Septiembre).
* *Viernes 23 de Abril*: Considerado operativo de Romería (coberturas reducidas de festivo: 1M, 1T, 1N).

### Consideración de Turnos Festivos
Se consideran legal y económicamente festivos:
1. Turnos de **Mañana (M)** y **Tarde (T)** de cualquier día festivo oficial.
2. Turnos de **Viernes Noche (N)** (inicia a las 23:00 del viernes y computa como festivo por transcurrir en la madrugada del sábado).
3. **Todos los turnos de los Sábados** (M, T, N).
4. Turnos de **Mañana (M)** y **Tarde (T)** de los **Domingos**.
5. *Excepción*: El turno de **Domingo Noche (N) NO es festivo**, ya que transcurre íntegramente de cara a la jornada laboral del lunes.

### Nomenclatura con Punto (`.`) para Fórmulas de Excel
Para automatizar el conteo de festivos en Excel mediante fórmulas de texto:
* Turno festivo de Mañana: `M.`
* Turno festivo de Tarde: `T.`
* Turno festivo de Noche: `N.`
* Turnos ordinarios de lunes a viernes: `M`, `T`, `N`.
* Días de descanso / vacaciones: **Celda verdaderamente vacía (`None` / en blanco, sin espacios fantasma)**.
* **Fórmulas dinámicas integradas en Excel**:
  * Total días trabajados: `=SUM(AH4:AJ4)` (suma exacta de las columnas Mañanas + Tardes + Noches) o `=COUNTA(B4:AF4)`.
  * Mañanas totales: `=COUNTIF(B4:AF4; "M*")`
  * Tardes totales: `=COUNTIF(B4:AF4; "T*")`
  * Noches totales: `=COUNTIF(B4:AF4; "N*")`
  * Festivos totales: `=COUNTIF(B4:AF4; "*.*")`

---

## 4. Jornada Laboral, Mensual y Descansos Legales

1. **Jornada Anual**:
   * **Exactamente 220 días trabajados al año** para todos los trabajadores regulares y para Hilario.
   * Extra 1 realiza entre 80 y 85 días (típicamente 84 días: 21 días/mes en verano).
2. **Jornadas Mensuales (Regla de los 20 días)**:
   * Objetivo prioritario: **20 días trabajados al mes**.
   * Rango de flexibilidad operativa: **18 a 21 días**.
   * Límite estricto: **NUNCA 22 días trabajados en un mes**.
   * *Excepción*: Los trabajadores que disfruten de su periodo de vacaciones en ese mes quedan exentos de esta regla (su jornada mensual será proporcional a los días laborables de la quincena activa).
3. **Días Consecutivos de Trabajo**:
   * **Máximo 5 días trabajados seguidos**.
   * **NUNCA 6 días seguidos** (salvo imposibilidad matemática insalvable de cobertura).
4. **Descanso entre Turnos**:
   * Mínimo legal ineludible de **12 horas de descanso** entre salida y entrada en el cuadrante base oficial.
   * **Criterio de Permutas Inteligentes en la Aplicación Web (PWA)**:
     - **Descanso menor de 8 horas (< 8h)**: Clasificado como **ERROR / NO DISPONIBLE**. Bloquea la permuta (por ejemplo, Noche [sale 07:00] seguido de Mañana [entra 07:00] con 0h de descanso, o cualquier doblaje incompatible).
     - **Descanso entre 8 horas y menos de 12 horas (8h a 11h)**: Clasificado como **WARNING (Advertencia)**. Permite el intercambio voluntario avisando de la reducción ergonómica (por ejemplo, Tarde a Mañana con 8h, o Noche a Tarde con 8h).
     - **Descanso de 12 horas o superior**: Clasificado como **100% Conforme**.
5. **Descanso Tras Ciclo de Noches (Garantía Obligatoria de 2 Días Libres)**:
   * Tras finalizar el último turno de noche de un bloque, el trabajador dispone **SIEMPRE de al menos 2 días completos consecutivos de descanso** (día saliente libre + día completo de descanso libre).
   * No se permite reincorporación al trabajo hasta transcurridas al menos 48 a 56 horas desde la salida de la última noche (0 excepciones en toda la plantilla durante todo el año).

---

## 5. Ergonomía de Turnos de Noche

1. **Agrupación en Bloques**:
   * Norma general: Los turnos de noche deben ser de **3 noches seguidas**.
   * Excepciones permitidas: Bloques de **2 noches** o **4 noches** cuando sea indispensable para cuadrar fines de semana o festivos fijos.
   * Prohibido: Noches sueltas de 1 día (salvo el 31 de diciembre que continúa en el año siguiente) o bloques de 5 o más noches seguidas.
2. **Límite Mensual de Noches**:
   * **Máximo 7 noches al mes por trabajador**.
3. **Víspera de Vacaciones (Regla de Salida)**:
   * El día inmediatamente anterior a comenzar el periodo de vacaciones, el trabajador **NO puede realizar turno de noche (N)** (garantizando que sus vacaciones comiencen descansadas a las 00:00 del día 1 o 16).
4. **Espaciado entre Grupos de Noches**:
   * **Media anual**: Los bloques de noches se distancian en promedio **~15 días entre sí** (más de dos semanas de descanso sin noches para cada trabajador regular).
   * **Mayoría amplia ($\ge 7$ días)**: El **70% de las transiciones** entre noches cuentan con **más de una semana de separación** (con intervalos de 7, 10, 14, 21 y hasta 59 días libres de noches).
   * **Cuellos de botella inevitables (separación de 2 a 5 días)**: En el 30% de los casos (44 transiciones en todo el año entre los 8 trabajadores), los bloques quedan a 2-5 días de distancia. Esto ocurre de forma matemáticamente obligada durante los cambios de quincena vacacional de verano (junio y agosto) —donde coinciden 4 trabajadores en vacaciones o vísperas, Extra 1 en adaptación e Hilario sin noches— y para preservar los fines de semana completos sin partir.

---

## 6. Conciliación Familiar y Fines de Semana Completos (Versión 2 Oficial)

1. **Definición Operativa del Fin de Semana**:
   * El fin de semana abarca formalmente los **6 turnos comprendidos entre el Viernes Noche y el Domingo Tarde**:
     * **Viernes**: Noche ($V_N$)
     * **Sábado**: Mañana ($S_M$), Tarde ($S_T$), Noche ($S_N$)
     * **Domingo**: Mañana ($D_M$), Tarde ($D_T$)
   * *Nota*: El turno de **Domingo Noche ($D_N$) NO forma parte del fin de semana festivo**, ya que transcurre íntegramente de cara a la jornada laboral ordinaria del lunes.
2. **Eliminación Total de Fines de Semana Partidos (0 partidos en el año)**:
   * Queda estrictamente prohibido que un trabajador realice turnos aislados o sueltos en el fin de semana ($\sum_{\text{turnos fin de semana}} = 1$).
   * Ningún trabajador trabaja solo un turno o un día suelto del fin de semana.
3. **Estructura Íntegra de Cobertura de Fin de Semana**:
   * **Mañanas**: Un trabajador cubre **Sábado Mañana + Domingo Mañana** (2 turnos).
   * **Tardes**: Un trabajador cubre **Sábado Tarde + Domingo Tarde** (2 turnos).
   * **Noches**: Un trabajador cubre **Viernes Noche + Sábado Noche** (2 turnos festivos de noche), encadenando habitualmente con el Domingo Noche para consolidar su bloque ergonómico de 3 noches.
   * **Descanso Pleno de Plantilla**: Los 6 trabajadores restantes disfrutan de **descanso íntegro e ininterrumpido** durante todo el fin de semana (desde el viernes por la tarde hasta el lunes por la mañana).

---

## 7. Criterios de Equidad Anual (7 Trabajadores Regulares)

Entre los 7 trabajadores en rotación completa (excluyendo a Hilario y Extra 1) debe mantenerse una estricta paridad:
* **Días Festivos trabajados**: Diferencia máxima de **1 día** ($\max - \min \le 1$).
* **Noches trabajadas**: Diferencia máxima de **3 noches** ($\max - \min \le 3$).
* **Mañanas trabajadas**: Diferencia máxima de **5 mañanas** ($\max - \min \le 5$).
* **Tardes trabajadas**: Diferencia máxima de **5 tardes** ($\max - \min \le 5$).

---

## 8. Periodos Vacacionales (Quincenas Reglamentarias)

Las vacaciones se distribuyen en dos quincenas de 15 días naturales cada una (del 1 al 15 y del 16 al 30; todas duran exactamente 15 días, sin extenderse hasta el 31 de julio ni el 31 de agosto):
* **Antonio J y Miguel B**: 
  * 1ª Quincena: 01 al 15 de Junio (15 días)
  * 2ª Quincena: 01 al 15 de Agosto (15 días)
* **Paco C y Fran Espin**: 
  * 1ª Quincena: 16 al 30 de Junio (15 días)
  * 2ª Quincena: 16 al 30 de Agosto (15 días)
* **A. Leon e Hilario**: 
  * 1ª Quincena: 01 al 15 de Julio (15 días)
  * 2ª Quincena: 01 al 15 de Septiembre (15 días)
* **Santi M y Alberto H**: 
  * 1ª Quincena: 16 al 30 de Julio (15 días)
  * 2ª Quincena: 16 al 30 de Septiembre (15 días)

---

## 9. Asignaciones Dinámicas por Criterio de Equidad Histórica Pura (2011 - 2027)

> **Criterios Rectores de Asignación**:
> 1. **Equidad en Cómputo Total Acumulado (2011-2027)**: Equilibrar los festivos globales de toda la plantilla para que todos los trabajadores se mantengan en una banda estrechísima entre **68 y 71 festivos totales** a lo largo de 17 años (máxima justicia distributiva histórica: diferencia máxima de 3 festivos en casi dos décadas).
> 2. **Equidad Específica por Festivo**: Asignar prioritariamente a los trabajadores que hayan realizado **menos veces esa festividad concreta** en el histórico 2011-2026.
> 3. **Criterio de Desempate Temporal**: En caso de empate en el mínimo acumulado, tiene prioridad de turno **el trabajador que más años lleve sin realizar esa festividad**.
> 4. **Regla de Integridad en Festivos Multi-Día**: Queda terminantemente prohibido utilizar varias personas para alternar el turno de mañana o tarde en una misma festividad de varios días (Semana Santa, Romería y Feria). **El trabajador que asume la mañana o la tarde de un festivo de varios días lo realiza íntegramente todos los días del bloque festivo**, computándosele de forma inequívoca el festivo en su registro histórico anual.
> 5. **Supresión de San Eufrasio (15 de Mayo)**: Eliminada de las restricciones y cómputos al haber dejado de ser festivo local oficial.

### 9.1. Cuadro de Asignaciones Óptimas y Oficiales 2027

* **01 de Enero (Año Nuevo)**:
  * **Noche**: **Santi M** (Prioridad absoluta: solo 1 vez en todo el histórico, realizada en 2019).
  * **Mañana y Tarde**: **Alberto H** y **Paco C**.
* **06 de Enero (Reyes)**:
  * **Mañana y Tarde**: **Fran Espín** y **A. León**.
* **01 de Marzo (Puente Día de Andalucía)**:
  * **Mañana y Tarde**: **Santi M** y **Paco C**.
* **25, 26, 27 y 28 de Marzo (Semana Santa - Jueves a Domingo)**:
  * **Noches (25, 26 y 27 de Marzo)**: **Miguel B** (Prioridad: 2 veces, no la realiza desde 2020 vía AC). Bloque íntegro de 3 noches.
  * **Mañana**: **Santi M** (Bloque íntegro los 4 días).
  * **Tarde**: **Paco C** (Bloque íntegro los 4 días).
* **23, 24, 25 y 26 de Abril (Romería Virgen de la Cabeza)**:
  * **Noches (23, 24 y 25 de Abril)**: **A. León** (Prioridad: 2 veces, no la realiza desde 2021). Bloque íntegro de 3 noches.
  * **Mañana**: **Alberto H** (Bloque íntegro los 4 días).
  * **Tarde**: **Paco C** (Bloque íntegro los 4 días).
* **01 de Mayo (Fiesta del Trabajo)**:
  * **Mañana y Tarde**: **A. León** y **Alberto H**.
* **16 de Agosto (Festivo local/trasladado)**:
  * **Mañana y Tarde**: **Miguel B** y **Extra 1**.
* **04, 05 y 06 de Septiembre (Feria de Andújar)**:
  * **Noches de Feria**: **Extra 1** realiza las noches de feria íntegras (noches del 3, 4, 5 y 6 de septiembre).
  * **Mañana de Feria**: **Alberto H** realiza las mañanas íntegras los 3 días (04, 05 y 06 Sep).
  * **Tarde de Feria**: **Antonio J** realiza las tardes íntegras los 3 días (04, 05 y 06 Sep).
  * A. León e Hilario descansan por quincena de vacaciones (1-15 Sep).
* **12 de Octubre (Fiesta Nacional)**:
  * **Mañana y Tarde**: **Paco C** y **Miguel B**.
* **01 de Noviembre (Todos los Santos)**:
  * **Mañana y Tarde**: **A. León** y **Antonio J** (los dos únicos trabajadores con solo 3 veces en histórico).
* **06 de Diciembre (Constitución)**:
  * **Mañana y Tarde**: **Fran Espín** y **Paco C**.
* **08 de Diciembre (Inmaculada)**:
  * **Mañana y Tarde**: **Santi M** y **Paco C**.
* **24 de Diciembre (Nochebuena)**:
  * **Noche**: **Alberto H** (2 veces, última 2022).
  * Regla específica Antonio J: Cuando le toque trabajar para cuadrar el cuadrante los días 24 y 31 de diciembre, **siempre lo hará en turno de Mañana (M)**, nunca de tarde.
* **25 de Diciembre (Navidad)**:
  * **Mañana y Tarde**: **Antonio J** y **Fran Espín**.
* **31 de Diciembre (Nochevieja)**:
  * **Noche**: **Antonio J** (Prioridad absoluta: 2 veces realizadas, ¡no la realiza desde 2020, 7 años transcurridos!). Esta asignación rompe la regla de mañana exclusiva al estar fijada su noche por equidad histórica.

### 9.1. Eventos Personales y Descansos Blindados
* **02 de Mayo**: Antonio Jesús Sánchez libre por evento personal (no puede tener turno ese día). En la víspera (**01 de Mayo**) no puede realizar turno de noche.
* **29 de Mayo**: Francisco Espín libre por evento personal. En la víspera (**28 de Mayo**) no realiza turno de noche.
* **31 de Octubre**: Miguel Benítez libre por evento personal. En la víspera (**30 de Octubre**) no realiza turno de noche.

---

## 10. Protocolo de Resolución de Conflictos

Si durante la formulación o resolución del modelo se detecta una interferencia o conflicto normativo entre dos reglas (por ejemplo, asignaciones fijas que colisionen con periodos de vacaciones concedidos o con el descanso mínimo obligatorio):
1. **NO tomar decisiones unilaterales arbitrarias**.
2. **Consultar inmediatamente al usuario exponiendo las alternativas técnicas viables**.
3. Proceder únicamente tras la elección explícita de la alternativa por parte del usuario.

---

## 11. Directriz de Entrega y Formato de Salida

* **Prescindir de tablas Markdown mes a mes en el chat**: Ya no es necesario volcar las 12 tablas mensuales en formato Markdown en las respuestas del chat, agilizando la lectura y evitando respuestas innecesariamente extensas.
* **Canal oficial de entrega**: Es suficiente y obligatorio entregar el archivo Excel (`.xlsx`) completamente generado, con su diseño visual profesional (cabeceras en azul marino, fines de semana en gris claro, festivos destacados en salmón, colores suaves para turnos `M`, `T`, `N`) y las fórmulas nativas de recuento `=COUNTIF(...)`.
* En la respuesta por chat bastará con:
  1. Resumen ejecutivo de novedades u optimizaciones introducidas.
  2. Tablas de auditoría matemática de cumplimiento (días anuales, equidad de turnos, noches por mes y métricas de fines de semana).
  3. Enlace directo de descarga y apertura al archivo Excel generado en el proyecto.
