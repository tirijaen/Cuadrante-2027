# 📋 Paquete de Relevo y Continuidad - Cuadrante Laboral 2027 (Andújar)

Bienvenido, agente o desarrollador. Este directorio (`exportación/`) contiene la selección depurada de archivos **indispensables y autónomos** para continuar, auditar, resolver o ampliar el proyecto del **Cuadrante 2027 de Andújar** sin necesidad del historial de scripts intermedios ni archivos residuales.

---

## 🏆 1. Estado Actual del Proyecto (Punto de Oro + Mejoras Validadas)

El cuadrante actual se encuentra en un estado de **perfección matemática y cumplimiento normativo del 100%**, auditado mediante [audit_v3_final.py](file:///home/antonio/proyectos/Cuadrante%202027/exportación/audit_v3_final.py) con **0 errores detectados**.

### 📊 Métricas Consolidadas Oficiales:

| Trabajador | Días Trab. | Mañanas | Tardes | Noches | Festivos Anuales (Fines + Fest.) | Fines de Semana |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Antonio J** | 220 | 97 | 74 | 49 | **48** | 17 |
| **Santi M** | 220 | 95 | 76 | 49 | **48** | 19 |
| **Alberto H** | 220 | 95 | 76 | 49 | **48** | 14 |
| **Fran Espin** | 220 | 97 | 74 | 49 | **48** | 17 |
| **Miguel B** | 220 | 96 | 75 | 49 | **48** | 15 |
| **Paco C** | 220 | 95 | 76 | 49 | **48** | 17 |
| **A. Leon** | 220 | 95 | 76 | 49 | **47** | 19 |
| **Hilario** | 220 | **110** | **110** | 0 | **0** | 0 |
| **Extra 1** (Refuerzo Verano) | 81 | 33 | 26 | 22 | **12** | 5 |

### 🎯 Logros Clave Asegurados:
1. **Noches Anuales**: Exactamente **49 noches** para los 7 trabajadores fijos ($\Delta = 0$).
2. **Equidad de Festivos**: 48 para 6 trabajadores y 47 para Antonio León ($\Delta = 1$, paridad matemática absoluta).
3. **Simetría de Hilario**: Exactamente **110 Mañanas y 110 Tardes**, sin fines de semana, sin festivos y sin noches.
4. **Fines de Semana Partidos**: **0** en todo el año (todos los fines de semana se trabajan completos o se libran completos).
5. **Descanso Ergonómico**: Mínimo 12 horas entre turnos y **2 días libres obligatorios** tras finalizar cualquier ciclo de noches.
6. **Límite Mensual**: Máximo 21 días en meses regulares (nunca 22 días).

---

## 🗂️ 2. Inventario de Archivos Indispensables

```text
exportación/
├── README.md                              <- Este documento guía de relevo para agentes
│
├── 📖 DOCUMENTACIÓN Y REGLAS OFICIALES
│   ├── REGLAS_OFICIALES_CUADRANTE.md      <- Compendio exhaustivo de reglas, descansos y metodología en 3 fases
│   ├── HISTORIAL_CONVERSACIONES.md        <- Registro íntegro de sesiones (1 a 16) con peticiones y resoluciones
│   ├── HISTORIAL_FESTIVOS_Y_VACACIONES.md <- Histórico de festivos 2011-2027 y rotación quincenal de vacaciones
│   ├── MANUAL_DE_USUARIO.md               <- Guía de uso de la aplicación web y PWA
│   ├── reglas cuadrante.odt               <- Documento inicial con requerimientos originales del usuario
│   └── calendario-laboral-andujar-2027-PDF.pdf <- Calendario oficial de festivos de Andújar 2027
│
├── 📊 DATOS BASE Y CUADRANTES OFICIALES
│   ├── Cuadrante 2026 para Agente.xlsx    <- Archivo Excel original de referencia (histórico festivos y vacaciones)
│   ├── Cuadrante_2027_Andujar.xlsx        <- Excel oficial del Cuadrante 2027 (formato final con fórmulas y estilos)
│   ├── Cuadrante_2027_Andujar_V3.xlsx     <- Copia sincronizada oficial V3
│   ├── cuadrante_2027.json                <- Matriz completa del cuadrante en formato JSON
│   └── cuadrante_2027_v3.json             <- Matriz V3 sincronizada
│
├── ⚙️ SCRIPTS DE RESOLUCIÓN Y AUDITORÍA
│   ├── audit_v3_final.py                  <- Auditoría integral (ejecuta y verifica 100% de reglas con 0 errores)
│   ├── solve_v5_equidad.py                <- Optimizador CP-SAT (Google OR-Tools) para equilibrado de festivos
│   ├── export_v3_deliverables.py          <- Generador automático de Excel y js/cuadrante_data.js desde el JSON
│   ├── restaurar_punto_oro.py             <- Script de restauración inmediata al Punto de Oro inmutable
│   ├── restaurar_punto_oro.sh             <- Script bash de restauración rápida
│   └── checkpoints/
│       └── punto_oro_2027/                <- Respaldo inmutable del Punto de Oro
│
├── 🌐 APLICACIÓN WEB INTERACTIVA (PWA)
│   ├── index.html                         <- Aplicación web interactiva (visores mensual, personal, equidad, etc.)
│   ├── infografia.html                    <- Tablero infográfico y resumen visual
│   ├── manifest.json                      <- Manifiesto PWA para instalación móvil y escritorio
│   ├── sw.js                              <- Service Worker (caché offline v14.0)
│   ├── css/
│   │   └── styles.css                     <- Sistema de diseño moderno (glassmorphism, modo oscuro, tokens)
│   ├── js/
│   │   ├── app.js                         <- Lógica interactiva de navegación, filtros y vistas
│   │   ├── cuadrante_data.js              <- Matriz del cuadrante inyectada en ventana web
│   │   ├── historical_data.js             <- Datos históricos de festivos y vacaciones
│   │   ├── validator.js                   <- Validador en tiempo real en el cliente
│   │   ├── calendar_export.js             <- Exportador iCal/Google Calendar
│   │   └── xlsx.full.min.js               <- Librería SheetJS para exportación Excel
│   └── icons/                             <- Iconos oficiales PWA (192x192, 512x512, SVG, Apple Touch)
│
└── 🤖 CONFIGURACIÓN AGENTE
    └── .agents/rules/reglas_cuadrante.md  <- Reglas automáticas para el IDE/Agente Antigravity
```

---

## 🚀 3. Comandos Esenciales para el Agente

### 1. Verificar la Auditoría Oficial (¡Comprobación obligatoria antes de cualquier cambio!):
```bash
python3 audit_v3_final.py
```
*Salida esperada:*
```text
=== FINAL COMPREHENSIVE AUDIT REPORT ===
Total de errores detectados: 0
Total fines de semana partidos: 0
¡TODO EL CUADRANTE CUMPLE EL 100% DE LAS RESTRICCIONES DE FORMA IMPECABLE (0 ERRORES)!
```

### 2. Regenerar los Entregables tras Modificar `cuadrante_2027_v3.json`:
```bash
python3 export_v3_deliverables.py
```
*Actualiza automáticamente:*
* `Cuadrante_2027_Andujar.xlsx` y `Cuadrante_2027_Andujar_V3.xlsx`.
* `cuadrante_2027.json`.
* `js/cuadrante_data.js`.

### 3. Re-resolver u Optimizar el Cuadrante con CP-SAT:
```bash
python3 solve_v5_equidad.py
```
*Utiliza Google OR-Tools para optimizar y generar una nueva solución conservando equidad.*

### 4. Lanzar la Aplicación Web para Verificación Visual:
```bash
python3 -m http.server 8080
```
Abrir `http://localhost:8080` en el navegador para comprobar la interfaz, cuadrantes mensuales, pestañas de festivos y vacaciones, e infografía.

### 5. Restaurar el Punto de Oro en Caso de Contingencia:
```bash
python3 restaurar_punto_oro.py
# o bien:
./restaurar_punto_oro.sh
```

---

## ⚠️ 4. Leyes Sagradas del Cuadrante (Reglas Inmutables)

Cualquier cambio que propongas o realices **DEBE** respetar estrictamente lo siguiente:
1. **Días Anuales**:
   - 7 fijos y Hilario: **Exactamente 220 días trabajados**.
   - Extra 1: **80 a 88 días** (actualmente 81), solo en Junio, Julio, Agosto y Septiembre.
2. **Equidad de Noches**:
   - Exactamente **49 noches** para los 7 trabajadores fijos.
   - Hilario: **0 noches**.
3. **Equidad de Festivos y Fines de Semana**:
   - La suma de turnos en festivos y fines de semana debe tener una diferencia máxima de 1 día entre los 7 fijos ($\Delta \le 1$). Actualmente: 6 trabajadores con 48 festivos y 1 con 47 festivos.
4. **Régimen de Hilario**:
   - Solo Mañanas y Tardes (110 M y 110 T).
   - Nunca fines de semana, nunca festivos, nunca noches.
5. **Ergonomía de Descanso**:
   - Nunca Tarde seguida de Mañana al día siguiente (mínimo 12h de descanso).
   - Siempre **2 días libres obligatorios** tras terminar un ciclo de noches.
   - **0 fines de semana partidos**: Un fin de semana se trabaja completo (M+M, T+T, N+N) o se libra completo (L+L).
6. **Límite Mensual**:
   - Ningún trabajador regular o Hilario debe trabajar 22 días en meses normales (máximo 21 días).
