# 📍 Checkpoint Relevo y Exportación 2027 - Cuadrante Oficial Andújar

Este directorio contiene la copia de seguridad inmutable y verificada del **Checkpoint de Relevo y Exportación (2027)**, que incluye todas las mejoras acumuladas hasta la **Sesión 17**.

---

## 📌 Identificadores de Recuperación

1. **Etiqueta Git (Tag)**: `checkpoint-relevo-2027`
2. **Rama Git (Branch)**: `checkpoint-relevo-2027`
3. **Script de Restauración Rápida**:
   ```bash
   python3 restaurar_checkpoint_relevo.py
   # o bien:
   ./restaurar_checkpoint_relevo.sh
   ```
   *También puedes indicarle al asistente:* **"Vuelve al checkpoint de relevo"** *o* **"Restaura el checkpoint de exportación"**.

---

## 📊 Estado y Métricas Consolidadas en este Checkpoint

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
| **Extra 1** | 81 | 33 | 26 | 22 | **12** | 5 |

### 🌟 Mejoras Clave Incluidas Respecto al Punto de Oro Inicial:
1. **Simetría Perfecta en Hilario**: Exactamente **110 Mañanas y 110 Tardes** sin tocar fines de semana, noches ni festivos de la plantilla.
2. **Tab 4 (Festivos y Vacaciones) Completamente Integrada**:
   - Botones estilizados con diseño oscuro (glassmorphism).
   - Visor dinámico de rotación quincenal por parejas (2027 Oficial, 2028 Previsión, 2029 Previsión).
   - Histórico oficial completo de quincenas (2018 a 2026) importado desde el Excel.
3. **Paquete Autónomo de Relevo (`exportación/`)**:
   - Carpeta depurada con archivos indispensables y guía `README.md` para futuros agentes.
4. **Auditoría Oficial**: 0 errores en `audit_v3_final.py`.
