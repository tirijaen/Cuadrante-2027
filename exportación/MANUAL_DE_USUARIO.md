# 📖 Manual de Usuario Oficial · Cuadrante 2027
### Hospital de Alta Resolución de Andújar (HAG de Andújar)

> **Aplicación Web Progresiva (PWA):** [https://tirijaen.github.io/Cuadrante-2027/](https://tirijaen.github.io/Cuadrante-2027/)  
> **Versión del Sistema:** 2027 · V4.4 (Offline Cache, Semáforo Legal, Módulo de Vacaciones & Histórico de Festivos)  
> **Infografías Oficiales:** Disponibles dentro de la app o directamente en [infografia.html](file:///home/antonio/proyectos/Cuadrante%202027/infografia.html)

---

## 📌 Índice
1. [Introducción y Acceso](#1-introducción-y-acceso)
2. [Instalación en 30 Segundos (Android, iOS y PC)](#2-instalación-en-30-segundos)
3. [Estructura y Módulos de la Aplicación](#3-estructura-y-módulos-de-la-aplicación)
   * [1. Mi Cuadrante (Portal Personal)](#1-mi-cuadrante-portal-personal)
   * [2. Equipo y Coberturas (Dotación y Visor Mensual)](#2-equipo-y-coberturas)
   * [3. Permutas Inteligentes (Conformes por Ley y Doble Trabajo)](#3-permutas-inteligentes)
   * [4. Bolsa de Turnos y Apuntar Turno Manual](#4-bolsa-de-turnos-y-compensaciones)
   * [5. Módulo Oficial de Festivos y Vacaciones](#5-módulo-de-festivos-y-vacaciones)
   * [6. Volante Oficial para RRHH en PDF](#6-volante-oficial-para-rrhh)
   * [7. Comparador Dual ("¿Cuándo libramos juntos?")](#7-comparador-dual)
   * [8. Estadísticas de Jornada](#8-estadísticas-de-jornada)
4. [Guía Rápida en 10 Pasos para el Trabajador](#4-guía-rápida-en-10-pasos-para-el-trabajador)
5. [Preguntas Frecuentes (FAQ)](#5-preguntas-frecuentes-faq)

---

## 1. Introducción y Acceso

La aplicación del **Cuadrante 2027 del HAG de Andújar** ha sido concebida y desarrollada a medida para ofrecer a toda la plantilla una herramienta ágil, visual y privada para consultar turnos, solicitar cambios y prever descansos futuros.

### Principales Ventajas:
* **100% Privada:** Todos tus datos, notas personales y acuerdos de permutas se almacenan **únicamente en la memoria de tu dispositivo** (Local Storage del navegador). Ningún dato sale a servidores externos.
* **Funciona Sin Conexión (Offline):** Gracias a la tecnología PWA (*Progressive Web App*), la aplicación carga y funciona con total fluidez incluso en zonas del hospital sin cobertura Wi-Fi o datos móviles.
* **Sin Descargas de Tiendas:** No necesitas cuenta de Google Play ni App Store, no ocupa espacio significativo en memoria y se actualiza sola al abrirla con conexión.

---

## 2. Instalación en 30 Segundos

### 🤖 En Android (Google Chrome)
1. Abre [https://tirijaen.github.io/Cuadrante-2027/](https://tirijaen.github.io/Cuadrante-2027/) en **Chrome**.
2. Aparecerá un aviso en la parte inferior que indica **"Añadir a pantalla de inicio"**. Si no lo ves, pulsa el botón de los **3 puntos (⋮)** arriba a la derecha.
3. Pulsa **"Instalar aplicación"** o **"Añadir a pantalla de inicio"** y confirma en **Instalar**.
4. ¡Listo! Tendrás el icono oficial en tu menú de aplicaciones, abriéndose a pantalla completa como una app nativa.

### 🍏 En iPhone / iPad (Safari)
1. Abre el enlace oficial en el navegador **Safari**.
2. En la barra inferior, pulsa el icono de **Compartir** (el recuadro con la flecha hacia arriba `⎋`).
3. Desliza hacia abajo en el menú y selecciona **"Añadir a pantalla de inicio" ⊞**.
4. Pulsa **"Añadir"** en la esquina superior derecha. Se creará el acceso directo en tu pantalla de inicio.

### 💻 En Ordenador (PC o Mac - Chrome / Edge)
1. Abre el enlace en **Google Chrome** o **Microsoft Edge**.
2. En el extremo derecho de la barra de direcciones verás un icono que dice **"Instalar Cuadrante 2027" ⊕**. Si no aparece, abre el menú de opciones **⋮** → **"Instalar Cuadrante 2027..."**.
3. Confirma en **Instalar**: la app se abrirá en una ventana limpia de escritorio independiente, sin barras de navegación molestas.

---

## 3. Estructura y Módulos de la Aplicación

### 1. Mi Cuadrante (Portal Personal)
* **Tarjeta de Hoy:** Te indica de inmediato tu turno de hoy (Mañana, Tarde, Noche o Libre), con el horario exacto, insignia de festivo si aplica y la lista de compañeros que están de servicio contigo en ese mismo turno.
* **Próximos 7 Días:** Carrusel horizontal con la previsión a una semana vista para organizar tu día a día.
* **Calendario Mensual Interactivo:** Vista completa del mes con código de colores ergonómico:
  * 🟡 **Mañana (07:00 - 15:00)**
  * 🟠 **Tarde (15:00 - 23:00)**
  * 🟣 **Noche (23:00 - 07:00)**
  * 🟢 **Descanso / Vacaciones**
* **Notas Privadas:** Pulsa sobre cualquier día del calendario para añadir una nota personal (ej: *"Cita dentista 10:00"*, *"Cumpleaños familiar"*, *"Asunto propio"*). Se marcará con un lápiz y solo tú podrás leerla.
* **Sincronización Móvil (.ics):** Pulsa el botón *"Sincronizar mi Cuadrante (.ics)"* para volcar todas tus guardias en Google Calendar, Apple Calendar o Outlook con alarmas previas automáticas.

### 2. Equipo y Coberturas
* **Dotación del Día en Tiempo Real:** Selector de fecha diario que desglosa quién cubre la Mañana, la Tarde y la Noche ese día, junto con la lista del personal en Descanso o Vacaciones.
* **Matriz Mensual Completa:** Réplica exacta del cuadrante mensual de todo el servicio.
  * **Optimización PC:** En pantallas de ordenador la tabla se ajusta al 100% del ancho sin generar barras de desplazamiento horizontal molestas.
  * **Optimización Móvil:** Desplazamiento táctil fluido manteniendo fija la columna del nombre del trabajador.

### 3. Permutas Inteligentes
El módulo estrella para cambios de turno con total seguridad jurídica y laboral. Comprueba en tiempo real el cumplimiento del descanso mínimo de 12 horas y las 48h de descanso obligatorio tras salir de una noche.

* **Modalidad A: Cambio con un compañero que libra:**
  1. Eliges el día que trabajas y necesitas librar.
  2. La app te muestra en tarjetas a los compañeros libres clasificados con semáforo:
     * 🟢 **100% Conforme:** Cumple todos los descansos legales de 12h y post-noches.
     * 🟡 **Warning:** Requiere atención por descanso ajustado pero admisible.
     * 🔴 **No disponible:** Incumpliría descansos legales o saldría de noche.
  3. La app busca automáticamente qué días libres tienes tú en los que tu compañero trabaja para devolvérselo con equidad.
* **Modalidad B: ¡Novedad! Cambio de Turno Directo (Doble Trabajo):**
  * Si dos compañeros trabajan el mismo día (por ejemplo, Antonio J está de Mañana y Santi M está de Tarde o Noche), la app permite el **intercambio de turno directo**.
  * Valida que ninguno doble ni incumpla las 12h entre turnos ni el descanso post-noche.

### 4. Bolsa de Turnos y Compensaciones
* **Saldo de Favores:** Saldo dinámico acumulado (+1 favor a favor, -1 favor debido).
* **Botón "Apuntar Turno Manual":** ¿Acordaste un cambio de palabra o fuera del asistente? Pulsa este botón para registrar a quién le hiciste el turno, en qué fecha y qué turno cubriste, quedando anotado en la bolsa de inmediato.
* **Saldar Turnos:** Cuando el compañero te devuelva el turno, pulsa *Saldar* para archivar el movimiento y regularizar el saldo.
* **Exportar a WhatsApp / Portapapeles:** Copia un mensaje formateado con la fecha, turno y trabajadores implicados para enviarlo al compañero o al grupo de trabajo.

### 5. Módulo de Festivos y Vacaciones
Consolida el historial oficial de 17 años (2011 a 2027) y el ciclo de vacaciones:

#### Sub-vista Vacaciones:
* **Quincenas de 15 Días Exactos:**
  * **1ª Quincena:** del **1 al 15** (15 días naturales).
  * **2ª Quincena:** del **16 al 30** (15 días naturales).
  * Ni el 31 de julio ni el 31 de agosto pertenecen a la quincena (los días 31 quedan libres).
  * En total: 30 días naturales exactos ($15 + 15 = 30$).
* **Pareja Fija de Turno:** Las vacaciones se disfrutan en parejas estables para garantizar la cobertura del servicio sin doblajes.
* **Previsión Algorítmica 2028 y 2029:** La plantilla sigue un ciclo rotativo de 4 años: **cada año cada pareja avanza automáticamente +1 quincena**. Esto garantiza que en 4 años todos disfruten de los mejores meses (julio y agosto) con idéntica frecuencia.
* **Visor Histórico (2018-2026):** Consulta qué turno disfrutó cada trabajador en los últimos 9 años.

#### Sub-vista Festivos & Equidad (2011 a 2027):
* **Semáforo Acumulado:** Balance tras 17 años de registros oficiales con equidad perfecta (71 vs 70 festivos totales).
* **Matriz de las 20 Fiestas Oficiales:** Desglose fiesta por fiesta (Nochebuena, Nochevieja, Reyes, Romería, Semana Santa, etc.) para asegurar que nadie repita desproporcionadamente las fiestas más señaladas.
* **Mis Fiestas Señaladas:** Te indica qué fiestas has trabajado más veces (prioridad de descanso para el próximo año) y cuáles has trabajado menos (prioridad de asignación).
* **Relevos Históricos:** Se conservan las fórmulas de relevo de personal (Marcos Brito `MB` suma en el historial de Santiago Molina; Miguel Benítez `MG` es nuevo en 2027 y solo le precedió `AC`).

### 6. Volante Oficial para RRHH en PDF
* Genera con un solo clic el **Volante Oficial de Permuta** en formato estándar A4.
* Incluye automáticamente:
  * Nombres oficiales completos de ambos trabajadores y firmas.
  * Fecha de emisión y turnos exactos intercambiados.
  * Cláusula de cumplimiento de descansos legales y coberturas del servicio.
* Listo para imprimir o descargar en PDF y enviar por correo electrónico a la dirección/RRHH.

### 7. Comparador Dual ("¿Cuándo libramos?")
* Permite seleccionar a cualquier compañero de la plantilla para cruzar cuadrantes en tiempo real.
* Calcula al instante:
  * Número de fines de semana completos que libráis juntos.
  * Días libres simultáneos en laborables.
  * Turnos en los que coincidís de guardia (M con M, T con T, N con N).
* Botón **"Compartir por WhatsApp"**: redacta una propuesta automática para enviar a tu compañero con las fechas ideales para viajar, hacer guardia o compartir eventos.

### 8. Estadísticas de Jornada
* Cómputo anual de jornadas trabajadas (meta oficial: **220 jornadas anuales exactas**).
* Balance de turnos de Mañana, Tarde, Noche y Festivos trabajados.
* Verificación visual de cumplimiento del descanso de 48h tras las noches y límites de noches al mes.

---

## 4. Guía Rápida en 10 Pasos para el Trabajador

Sigue estos 10 pasos para empezar a usar la aplicación al 100%:

| Paso | Acción | Dónde se hace | Beneficio |
|:---:|---|---|---|
| **1** | **Selecciona tu nombre** | Menú desplegable superior derecho | La app recordará tu perfil para siempre en tu móvil. |
| **2** | **Consulta tu turno de hoy** | Pestaña *Mi Cuadrante* | Ves tu horario y qué compañeros entran contigo. |
| **3** | **Sincroniza con tu móvil** | Botón azul *Sincronizar mi Cuadrante (.ics)* | Se añaden todas tus guardias a tu calendario con alarmas. |
| **4** | **Apunta notas privadas** | Haz clic en cualquier día del calendario | Anota citas, asuntos propios o eventos personales. |
| **5** | **Comprueba la dotación diaria** | Pestaña *Equipo y Coberturas* | Consulta quién está de mañana, tarde o noche hoy. |
| **6** | **Pide un cambio de turno** | Pestaña *Permutas Inteligentes* | Elige el día: el semáforo te dice quién cumple la ley para cambiar. |
| **7** | **Haz un cambio directo (M ↔ T/N)** | Asistente de Permutas | Si ambos trabajáis hoy, intercambiaos el turno de inmediato. |
| **8** | **Genera el volante para RRHH** | Botón *Generar Volante RRHH (PDF)* | Obtén el impreso formal A4 listo para firmar. |
| **9** | **Controla tus favores** | Pestaña *Bolsa de Turnos* | Revisa quién te debe favores o usa *Apuntar Turno Manual*. |
| **10** | **Consulta tus vacaciones y festivos** | Pestaña *Festivos y Vacaciones* | Revisa tus quincenas de 15 días y qué te tocará en 2028. |

---

## 5. Preguntas Frecuentes (FAQ)

### ¿Qué pasa si cambio de móvil o borro el historial del navegador?
La app conserva el cuadrante oficial completo porque está programado en la aplicación. Si limpias los datos del navegador, únicamente tendrás que volver a seleccionar tu nombre y se restablecerán tus notas locales. Si tienes notas o acuerdos de bolsa importantes, puedes exportar tu copia de seguridad desde la pestaña *Exportar & Importar*.

### ¿Por qué las quincenas no llegan al 31 de julio ni al 31 de agosto?
Porque reglamentariamente todas las quincenas duran exactamente **15 días naturales**:
* 1ª Quincena: del 1 al 15 (15 días).
* 2ª Quincena: del 16 al 30 (15 días).
El día 31 de julio y el día 31 de agosto quedan fuera de la quincena para respetar la duración máxima legal de 30 días naturales de vacaciones al año.

### ¿Puedo cambiar un turno con un compañero si los dos trabajamos el mismo día?
**Sí.** El nuevo asistente permite el **Cambio de Turno Directo**. Si tú estás de mañana y tu compañero de tarde o noche, la aplicación comprobará que el intercambio respeta las 12 horas de descanso con los días anterior y posterior y te permitirá cerrar la permuta al instante.

### ¿Dónde entrego el Volante Oficial de Permuta?
Una vez que ambos trabajadores dais el visto bueno a la permuta, pulsáis en *Generar Volante RRHH (PDF)*, lo firmáis digitalmente o en papel y lo presentáis a vuestro supervisor/a o jefatura de personal según el procedimiento habitual del centro.

---
*Documentación oficial actualizada para el Hospital de Alta Resolución de Andújar. Cuadrante 2027 · Versión 4.4.*
