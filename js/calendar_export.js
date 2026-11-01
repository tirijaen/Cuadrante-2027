/**
 * Cuadrante 2027 Andújar - Generador y Exportador iCalendar (.ics)
 * Compatible con Google Calendar, Apple Calendar (iPhone/Mac), y Microsoft Outlook
 */

window.CuadranteCalendar = (function () {
  const DATA = window.CUADRANTE_DATA;

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function formatIcsDateTime(dateStr, timeStr) {
    // dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
    const [y, m, d] = dateStr.split('-');
    const [hh, mm] = timeStr.split(':');
    return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
  }

  function getNextDay(dateStr) {
    const dt = new Date(dateStr + 'T12:00:00');
    dt.setDate(dt.getDate() + 1);
    const y = dt.getFullYear();
    const m = pad(dt.getMonth() + 1);
    const d = pad(dt.getDate());
    return `${y}-${m}-${d}`;
  }

  /**
   * Genera el contenido del archivo .ics para el trabajador
   * @param {string} workerName
   * @param {number|null} filterMonth null para todo el año, 1-12 para un mes concreto
   * @param {boolean} includeAlarms si añade alarma recordatoria de 90 min antes
   * @returns {string} Texto formateado en estándar RFC 5545
   */
  function generateIcs(workerName, filterMonth = null, includeAlarms = true) {
    const wIdx = DATA.workers.indexOf(workerName);
    if (wIdx === -1) return '';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cuadrante 2027 Andujar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Cuadrante 2027 - ${workerName}`,
      'X-WR-TIMEZONE:Europe/Madrid',
      `X-WR-CALDESC:Cuadrante Oficial de Turnos 2027 para ${workerName} (Andújar)`
    ];

    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    DATA.dates.forEach((dateStr, dIdx) => {
      const [y, mStr, d] = dateStr.split('-');
      const m = Number(mStr);

      if (filterMonth !== null && m !== filterMonth) {
        return;
      }

      let shift = DATA.matrix_dot[wIdx][dIdx];
      const isVacation = (!shift || shift.trim() === '') && window.CuadranteValidator.isDateInVacation(workerName, dateStr);

      if (isVacation) {
        // Evento de Vacaciones (Día completo)
        const nextDayStr = getNextDay(dateStr).replace(/-/g, '');
        const dayStr = dateStr.replace(/-/g, '');
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:cuadrante-2027-vac-${workerName}-${dateStr}@andujar.cuadrante`);
        lines.push(`DTSTAMP:${nowStr}`);
        lines.push(`DTSTART;VALUE=DATE:${dayStr}`);
        lines.push(`DTEND;VALUE=DATE:${nextDayStr}`);
        lines.push(`SUMMARY:🏖️ Vacaciones - Cuadrante Andújar`);
        lines.push(`DESCRIPTION:Periodo reglamentario de vacaciones de ${workerName}.`);
        lines.push('STATUS:CONFIRMED');
        lines.push('TRANSP:TRANSPARENT');
        lines.push('END:VEVENT');
        return;
      }

      if (!shift || shift.trim() === '') return;

      const isHoliday = shift.includes('.');
      const base = shift.replace('.', '').trim();

      let summary = '';
      let startTime = '';
      let endTime = '';
      let endDateStr = dateStr;

      if (base === 'M') {
        startTime = '07:00';
        endTime = '15:00';
        summary = `🌅 Turno de Mañana (07:00 - 15:00)${isHoliday ? ' [Festivo]' : ''}`;
      } else if (base === 'T') {
        startTime = '15:00';
        endTime = '23:00';
        summary = `☀️ Turno de Tarde (15:00 - 23:00)${isHoliday ? ' [Festivo]' : ''}`;
      } else if (base === 'N') {
        startTime = '23:00';
        endTime = '07:00';
        endDateStr = getNextDay(dateStr); // Cruza la medianoche
        summary = `🌙 Turno de Noche (23:00 - 07:00)${isHoliday ? ' [Festivo]' : ''}`;
      } else {
        return;
      }

      const holidayInfo = DATA.holidays[dateStr] ? ` (Festivo: ${DATA.holidays[dateStr]})` : '';
      const description = `Cuadrante 2027 Andújar\\nTrabajador: ${workerName}\\nHorario: ${startTime} a ${endTime}${holidayInfo}\\nTipo: ${DATA.shiftTypes[shift] ? DATA.shiftTypes[shift].name : shift}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:cuadrante-2027-${workerName}-${dateStr}-${base}@andujar.cuadrante`);
      lines.push(`DTSTAMP:${nowStr}`);
      lines.push(`DTSTART:${formatIcsDateTime(dateStr, startTime)}`);
      lines.push(`DTEND:${formatIcsDateTime(endDateStr, endTime)}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push(`LOCATION:Andújar`);
      lines.push('STATUS:CONFIRMED');

      if (includeAlarms) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:Recordatorio de entrada a turno (${startTime})`);
        lines.push('TRIGGER:-PT90M'); // 90 minutos antes
        lines.push('END:VALARM');
      }

      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Descarga el archivo .ics en el navegador
   */
  function downloadIcs(workerName, filterMonth = null) {
    const icsContent = generateIcs(workerName, filterMonth, true);
    if (!icsContent) {
      alert('No se pudo generar el calendario para este trabajador.');
      return;
    }

    const cleanWorker = workerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const monthSuffix = filterMonth ? `_Mes_${pad(filterMonth)}` : '_Ano_Completo';
    const filename = `Cuadrante_2027_${cleanWorker}${monthSuffix}.ics`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    generateIcs,
    downloadIcs
  };
})();
