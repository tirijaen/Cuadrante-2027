/**
 * Cuadrante 2027 Andújar - Validador Inteligente de Reglas y Permutas
 * Implementa el Compendio Oficial de Reglas y Criterios Operativos (REGLAS_OFICIALES_CUADRANTE.md)
 * Rediseño: 12h de descanso y máximo días trabajados se tratan como advertencias (warnings)
 * para permitir flexibilidad acordada entre trabajadores, manteniendo estrictas las reglas estructurales.
 */

window.CuadranteValidator = (function () {
  const DATA = window.CUADRANTE_DATA;

  // Convierte string de turno a tipo base ('M', 'T', 'N', 'L')
  function getBaseShift(shiftStr) {
    if (!shiftStr || shiftStr.trim() === '' || shiftStr === 'VAC' || shiftStr === 'LIBRE' || shiftStr === 'INACTIVO') {
      return 'L'; // Libre / Descanso / Vacaciones
    }
    const clean = shiftStr.replace('.', '').trim();
    if (['M', 'T', 'N'].includes(clean)) return clean;
    return 'L';
  }

  function isWorked(shiftStr) {
    return getBaseShift(shiftStr) !== 'L';
  }

  function isNight(shiftStr) {
    return getBaseShift(shiftStr) === 'N';
  }

  function isDayHoliday(dateStr) {
    return Boolean(DATA.holidays && DATA.holidays[dateStr]);
  }

  function getDayOfWeek(dateStr) {
    return new Date(dateStr + 'T12:00:00').getDay();
  }

  function isWeekend(dateStr) {
    const dow = getDayOfWeek(dateStr);
    return dow === 0 || dow === 6; // Sábado o Domingo
  }

  function getWorkerMeta(workerName) {
    return DATA.workersMeta.find(w => w.name === workerName) || null;
  }

  function isDateInVacation(workerName, dateStr) {
    const meta = getWorkerMeta(workerName);
    if (!meta || !meta.vacations || meta.vacations.length === 0) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    return meta.vacations.some(p => p.month === m && d >= p.start && d <= p.end);
  }

  function isEveOfVacation(workerName, dateStr) {
    const meta = getWorkerMeta(workerName);
    if (!meta || !meta.vacations) return false;
    const curDate = new Date(dateStr + 'T12:00:00');
    const nextDate = new Date(curDate);
    nextDate.setDate(curDate.getDate() + 1);
    const [ny, nm, nd] = [nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate()];
    return meta.vacations.some(p => p.month === nm && nd === p.start);
  }

  /**
   * Obtiene la secuencia completa de turnos para un trabajador (incluyendo posibles modificaciones simuladas)
   */
  function getWorkerSchedule(workerName, overrides = {}) {
    const wIdx = DATA.workers.indexOf(workerName);
    if (wIdx === -1) return [];

    return DATA.dates.map((dateStr, dIdx) => {
      let shift = overrides[dateStr] !== undefined ? overrides[dateStr] : DATA.matrix_dot[wIdx][dIdx];
      if ((!shift || shift.trim() === '') && isDateInVacation(workerName, dateStr)) {
        shift = 'VAC';
      }
      return {
        date: dateStr,
        dIdx: dIdx,
        shift: shift,
        base: getBaseShift(shift)
      };
    });
  }

  /**
   * Valida el cuadrante para un trabajador específico
   * REGLAS:
   *  - WARNING: Descanso mínimo 12h (T->M, N->M/T), máx. 5 días trabajados seguidos, descanso 48h tras noches
   *  - ERROR (Estrictas): Restricciones Hilario, Restricciones Extra 1, Víspera vacaciones
   */
  function validateWorkerSchedule(workerName, overrides = {}) {
    const schedule = getWorkerSchedule(workerName, overrides);
    const meta = getWorkerMeta(workerName);
    const violations = [];

    // 1. Descanso entre jornadas consecutivas:
    //    - Menor de 8 horas (< 8h): ERROR (NO DISPONIBLE por infringir descanso mínimo vital/legal).
    //    - Entre 8h y menos de 12 horas (8h <= descanso < 12h): WARNING (Permuta viable con advertencia).
    for (let i = 0; i < schedule.length - 1; i++) {
      const cur = schedule[i];
      const nxt = schedule[i + 1];

      // Caso A: Noche seguido de Mañana (sale a las 07:00 y entra a las 07:00 del mismo día -> 0h descanso)
      // Descanso = 0h (< 8h) -> ERROR / NO DISPONIBLE
      if (cur.base === 'N' && nxt.base === 'M') {
        violations.push({
          rule: 'Descanso < 8h (No disponible)',
          desc: `Noche el ${cur.date} y Mañana el ${nxt.date} (0h de descanso tras salir a las 07:00). Descanso inferior a 8h: NO DISPONIBLE.`,
          date: nxt.date,
          severity: 'error'
        });
      }

      // Caso B: Noche seguido de Tarde (sale a las 07:00 y entra a las 15:00 -> 8h descanso)
      // Descanso = 8h (>= 8h y < 12h) -> WARNING
      else if (cur.base === 'N' && nxt.base === 'T') {
        violations.push({
          rule: 'Descanso 12h',
          desc: `Noche el ${cur.date} y Tarde el ${nxt.date} (8h de descanso tras salir a las 07:00, inferior a 12h recomendadas).`,
          date: nxt.date,
          severity: 'warning'
        });
      }

      // Caso C: Tarde seguido de Mañana (sale a las 23:00 y entra a las 07:00 del día siguiente -> 8h descanso)
      // Descanso = 8h (>= 8h y < 12h) -> WARNING
      else if (cur.base === 'T' && nxt.base === 'M') {
        violations.push({
          rule: 'Descanso 12h',
          desc: `Tarde el ${cur.date} y Mañana el ${nxt.date} (solo 8h de descanso entre jornadas, inferior a 12h recomendadas).`,
          date: nxt.date,
          severity: 'warning'
        });
      }
    }

    // 2. Máximo 5 días trabajados seguidos (WARNING obviable)
    let consecutiveWorked = 0;
    for (let i = 0; i < schedule.length; i++) {
      if (schedule[i].base !== 'L') {
        consecutiveWorked++;
        if (consecutiveWorked >= 6) {
          violations.push({
            rule: 'Máximo 5 días seguidos',
            desc: `Acumula ${consecutiveWorked} días trabajados seguidos hasta el ${schedule[i].date}.`,
            date: schedule[i].date,
            severity: 'warning'
          });
        }
      } else {
        consecutiveWorked = 0;
      }
    }

    // 3. Ergonomía de Noches: Descanso de 48h tras bloque de noches (WARNING)
    for (let i = 0; i < schedule.length - 2; i++) {
      const cur = schedule[i];
      const d1 = schedule[i + 1];
      const d2 = schedule[i + 2];

      if (cur.base === 'N' && d1.base !== 'N') {
        if (d1.base === 'L') {
          if (d2 && d2.base === 'M') {
            violations.push({
              rule: 'Descanso tras noches',
              desc: `Reincorporación en Mañana el ${d2.date} con solo 24h tras salir de noche el ${cur.date} (norma aconseja 48h o reincorporación en Tarde).`,
              date: d2.date,
              severity: 'warning'
            });
          }
        }
      }
    }

    // 4. Restricciones específicas de Hilario (ESTRICTO - ERROR)
    if (meta && meta.type === 'hilario') {
      for (const item of schedule) {
        if (item.base === 'N') {
          violations.push({
            rule: 'Restricción Hilario',
            desc: `Hilario tiene asignación estricta sin noches (detectado turno Noche el ${item.date}).`,
            date: item.date,
            severity: 'error'
          });
        }
        if (item.base !== 'L' && (isWeekend(item.date) || isDayHoliday(item.date))) {
          violations.push({
            rule: 'Restricción Hilario',
            desc: `Hilario no trabaja en fines de semana ni festivos (${item.date}).`,
            date: item.date,
            severity: 'error'
          });
        }
      }
    }

    // 5. Restricciones específicas de Extra 1 (ESTRICTO - ERROR)
    if (meta && meta.type === 'extra') {
      for (const item of schedule) {
        const [y, m, d] = item.date.split('-').map(Number);
        if (![6, 7, 8, 9].includes(m) && item.base !== 'L') {
          violations.push({
            rule: 'Periodo Extra 1',
            desc: `Extra 1 solo está contratado de Junio a Septiembre (${item.date}).`,
            date: item.date,
            severity: 'error'
          });
        }
        if (m === 6 && d >= 1 && d <= 14) {
          if (item.base === 'N') {
            violations.push({
              rule: 'Formación Extra 1',
              desc: `Extra 1 no puede realizar noches durante sus dos primeras semanas (1-14 Junio).`,
              date: item.date,
              severity: 'error'
            });
          }
          if (item.base !== 'L' && (isWeekend(item.date) || isDayHoliday(item.date))) {
            violations.push({
              rule: 'Formación Extra 1',
              desc: `Extra 1 no puede estar solo en festivo/fin de semana en sus dos primeras semanas (1-14 Junio).`,
              date: item.date,
              severity: 'error'
            });
          }
        }
      }
    }

    // 6. Víspera de Vacaciones (ESTRICTO - ERROR)
    for (const item of schedule) {
      if (item.base === 'N' && isEveOfVacation(workerName, item.date)) {
        violations.push({
          rule: 'Víspera de Vacaciones',
          desc: `El día ${item.date} es víspera de inicio de vacaciones (prohibido hacer Noche).`,
          date: item.date,
          severity: 'error'
        });
      }
    }

    let totalWorked = 0;
    let mornings = 0;
    let afternoons = 0;
    let nights = 0;
    let holidaysCount = 0;

    for (const item of schedule) {
      if (item.base !== 'L') {
        totalWorked++;
        if (item.base === 'M') mornings++;
        if (item.base === 'T') afternoons++;
        if (item.base === 'N') nights++;
        if (item.shift.includes('.')) holidaysCount++;
      }
    }

    const hasErrors = violations.some(v => v.severity === 'error');
    const hasWarnings = violations.some(v => v.severity === 'warning');

    return {
      valid: !hasErrors,
      hasErrors,
      hasWarnings,
      violations,
      errors: violations.filter(v => v.severity === 'error'),
      warnings: violations.filter(v => v.severity === 'warning'),
      metrics: {
        totalWorked,
        mornings,
        afternoons,
        nights,
        holidaysCount,
        annualGoal: meta ? meta.annualGoal : 220,
        difference: totalWorked - (meta ? meta.annualGoal : 220)
      }
    };
  }

  /**
   * Analiza qué compañeros pueden cubrir a Worker A en dateA
   * Retorna estado de cada compañero:
   *  - 'clean': 100% disponible sin incidencias
   *  - 'warning': disponible con advertencia (obviando 12h descanso o 5 días seguidos)
   *  - 'working': ya tiene turno asignado ese día
   *  - 'blocked': no disponible por regla estricta (Hilario, Extra 1, víspera vacaciones, etc.)
   */
  function findAvailableCoverWorkers(workerA, dateA) {
    const wAIdx = DATA.workers.indexOf(workerA);
    const dAIdx = DATA.dates.indexOf(dateA);
    if (wAIdx === -1 || dAIdx === -1) return [];

    const shiftA = DATA.matrix_dot[wAIdx][dAIdx];
    const baseA = getBaseShift(shiftA);

    if (baseA === 'L') {
      return []; // Worker A ya está libre ese día
    }

    const results = [];

    DATA.workers.forEach(wB => {
      if (wB === workerA) return;

      const wBIdx = DATA.workers.indexOf(wB);
      const curShiftB = DATA.matrix_dot[wBIdx][dAIdx];
      const baseB = getBaseShift(curShiftB);

      if (baseB !== 'L') {
        results.push({
          worker: wB,
          status: 'working',
          badge: 'Ya trabaja hoy',
          reason: `Ya tiene turno asignado (${curShiftB}) en esta fecha.`,
          warnings: [],
          errors: []
        });
        return;
      }

      // Probar a que Worker B tome el turno de Worker A en dateA
      const overridesB = { [dateA]: shiftA };
      const resB = validateWorkerSchedule(wB, overridesB);

      if (resB.errors.length > 0) {
        results.push({
          worker: wB,
          status: 'blocked',
          badge: 'No disponible',
          reason: resB.errors.map(e => e.desc).join(' | '),
          warnings: [],
          errors: resB.errors
        });
      } else if (resB.warnings.length > 0) {
        results.push({
          worker: wB,
          status: 'warning',
          badge: 'Disponible con Warning',
          warnings: resB.warnings.map(w => w.desc),
          errors: []
        });
      } else {
        results.push({
          worker: wB,
          status: 'clean',
          badge: '100% Conforme',
          warnings: [],
          errors: []
        });
      }
    });

    // Ordenar: primero los limpios (clean), luego los con warning, luego los no disponibles
    const order = { 'clean': 1, 'warning': 2, 'working': 3, 'blocked': 4 };
    results.sort((a, b) => order[a.status] - order[b.status]);

    return results;
  }

  /**
   * Valida una permuta completa entre dos trabajadores o un cambio de turno recíproco
   */
  function validateSwap(swapConfig) {
    const { workerA, dateA, newShiftA, workerB, dateB, newShiftB } = swapConfig;

    if (!workerA || !workerB || !dateA || !dateB) {
      return {
        valid: false,
        hasWarnings: false,
        summary: 'Datos incompletos',
        details: 'Debes seleccionar ambos trabajadores y fechas para validar la permuta.',
        checks: [],
        errors: [],
        warnings: []
      };
    }

    const wAIdx = DATA.workers.indexOf(workerA);
    const wBIdx = DATA.workers.indexOf(workerB);
    const dAIdx = DATA.dates.indexOf(dateA);
    const dBIdx = DATA.dates.indexOf(dateB);

    if (wAIdx === -1 || wBIdx === -1 || dAIdx === -1 || dBIdx === -1) {
      return { valid: false, hasWarnings: false, checks: [], errors: [], warnings: [] };
    }

    if (dateA === dateB && workerA === workerB) {
      return {
        valid: false,
        hasWarnings: false,
        summary: 'Permuta no válida',
        details: 'No puedes permutar un turno contigo mismo en la misma fecha.',
        checks: [],
        errors: [{ rule: 'Misma persona y fecha', desc: 'No puedes permutar contigo mismo el mismo día.', worker: workerA, date: dateA }],
        warnings: []
      };
    }

    const origShiftA = DATA.matrix_dot[wAIdx][dAIdx];
    const origShiftB = DATA.matrix_dot[wBIdx][dBIdx];

    let overridesA = {};
    let overridesB = {};

    if (dateA === dateB) {
      overridesA[dateA] = newShiftA;
      overridesB[dateB] = newShiftB;
    } else {
      overridesA[dateA] = newShiftA;
      overridesA[dateB] = (origShiftB && origShiftB.trim() !== '') ? origShiftB : newShiftA;

      overridesB[dateA] = (origShiftA && origShiftA.trim() !== '') ? origShiftA : newShiftB;
      overridesB[dateB] = newShiftB;
    }

    const resA = validateWorkerSchedule(workerA, overridesA);
    const resB = validateWorkerSchedule(workerB, overridesB);

    // Cobertura Diaria del Cuadrante (ESTRICTO - ERROR)
    const coverageViolations = [];
    const datesToCheck = Array.from(new Set([dateA, dateB]));

    datesToCheck.forEach(dStr => {
      const dIdx = DATA.dates.indexOf(dStr);
      if (dIdx === -1) return;

      let mCount = 0, tCount = 0, nCount = 0;

      DATA.workers.forEach(wName => {
        let shift;
        if (wName === workerA && overridesA[dStr] !== undefined) {
          shift = overridesA[dStr];
        } else if (wName === workerB && overridesB[dStr] !== undefined) {
          shift = overridesB[dStr];
        } else {
          shift = DATA.matrix_dot[DATA.workers.indexOf(wName)][dIdx];
        }

        const base = getBaseShift(shift);
        if (base === 'M') mCount++;
        if (base === 'T') tCount++;
        if (base === 'N') nCount++;
      });

      if (nCount !== 1) {
        coverageViolations.push({
          rule: 'Regla de Oro de la Noche',
          desc: `El día ${dStr} quedaría con ${nCount} noches (es obligatorio que haya exactamente 1 trabajador de noche).`,
          date: dStr,
          severity: 'error'
        });
      }

      if (isWeekend(dStr) || isDayHoliday(dStr) || dStr === '2027-04-23') {
        if (mCount !== 1 || tCount !== 1) {
          coverageViolations.push({
            rule: 'Cobertura Festivo / Fin de Semana',
            desc: `El día ${dStr} debe contar con exactamente 1 Mañana y 1 Tarde (quedarían ${mCount}M y ${tCount}T).`,
            date: dStr,
            severity: 'error'
          });
        }
      }
    });

    const allErrors = [
      ...resA.errors.map(v => ({ ...v, worker: workerA })),
      ...resB.errors.map(v => ({ ...v, worker: workerB })),
      ...coverageViolations.map(v => ({ ...v, worker: 'Plantilla / Cobertura' }))
    ];

    const allWarnings = [
      ...resA.warnings.map(v => ({ ...v, worker: workerA })),
      ...resB.warnings.map(v => ({ ...v, worker: workerB }))
    ];

    const isValid = allErrors.length === 0;

    return {
      valid: isValid,
      hasWarnings: allWarnings.length > 0,
      errors: allErrors,
      warnings: allWarnings,
      checks: [
        { name: 'Descanso mínimo obligatorio (≥ 8h)', ok: !allErrors.some(e => e.rule.includes('Descanso')), isWarning: false },
        { name: 'Descanso ergonómico de 12h entre jornadas', ok: !allWarnings.some(w => w.rule.includes('12h')), isWarning: true },
        { name: 'Máximo 5 días trabajados seguidos', ok: !allWarnings.some(w => w.rule.includes('5 días')), isWarning: true },
        { name: 'Restricciones de Hilario (sin noches / findes)', ok: !allErrors.some(e => e.rule.includes('Hilario')), isWarning: false },
        { name: 'Restricciones de Extra 1 (verano y formación)', ok: !allErrors.some(e => e.rule.includes('Extra 1')), isWarning: false },
        { name: 'Salida de vacaciones (sin noche en víspera)', ok: !allErrors.some(e => e.rule.includes('Víspera')), isWarning: false },
        { name: 'Cobertura mínima de plantilla en Andújar', ok: coverageViolations.length === 0, isWarning: false }
      ],
      workerAStats: resA.metrics,
      workerBStats: resB.metrics
    };
  }

  /**
   * Encuentra los días viables en los que Worker A puede devolverle el turno a Worker B
   * Clasifica en 'clean' (100% conforme) y 'warning' (obviando 12h descanso o 5 días seguidos)
   */
  function findReturnDays(workerA, dateA, workerB) {
    const wAIdx = DATA.workers.indexOf(workerA);
    const wBIdx = DATA.workers.indexOf(workerB);
    const dAIdx = DATA.dates.indexOf(dateA);
    if (wAIdx === -1 || wBIdx === -1 || dAIdx === -1) return [];

    const shiftA = DATA.matrix_dot[wAIdx][dAIdx];
    const baseA = getBaseShift(shiftA);

    const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const results = [];

    DATA.dates.forEach((dateB, dBIdx) => {
      if (dateB === dateA) return;

      const shiftB = DATA.matrix_dot[wBIdx][dBIdx];
      const baseB = getBaseShift(shiftB);
      const shiftA_at_B = DATA.matrix_dot[wAIdx][dBIdx];
      const baseA_at_B = getBaseShift(shiftA_at_B);

      // B debe trabajar ese día, y A debe estar libre ese día
      if (baseB === 'L' || baseA_at_B !== 'L') return;

      const overridesA = { [dateA]: ' ', [dateB]: shiftB };
      const overridesB = { [dateA]: shiftA, [dateB]: ' ' };

      const resA = validateWorkerSchedule(workerA, overridesA);
      const resB = validateWorkerSchedule(workerB, overridesB);

      // Solo si ninguno tiene errores estrictos
      if (resA.errors.length === 0 && resB.errors.length === 0) {
        const dt = new Date(dateB + 'T12:00:00');
        const dow = dt.getDay();
        const mA = dateA.split('-')[1];
        const mB = dateB.split('-')[1];

        const warnings = [
          ...resA.warnings.map(w => `${workerA}: ${w.desc}`),
          ...resB.warnings.map(w => `${workerB}: ${w.desc}`)
        ];

        results.push({
          date: dateB,
          shift: shiftB,
          base: baseB,
          isHoliday: shiftB.includes('.') || isDayHoliday(dateB),
          holidayName: DATA.holidays[dateB] || null,
          weekdayName: WEEKDAYS[dow],
          isWeekend: (dow === 0 || dow === 6),
          sameMonth: (mA === mB),
          month: Number(mB),
          day: dt.getDate(),
          isClean: warnings.length === 0,
          warnings: warnings,
          workerAOriginalShift: shiftA,
          workerBOriginalShift: shiftB
        });
      }
    });

    // Ordenar: primero limpios del mismo mes, luego warnings del mismo mes, luego otros meses
    results.sort((a, b) => {
      if (a.sameMonth && !b.sameMonth) return -1;
      if (!a.sameMonth && b.sameMonth) return 1;
      if (a.isClean && !b.isClean) return -1;
      if (!a.isClean && b.isClean) return 1;
      return a.date.localeCompare(b.date);
    });

    return results;
  }

  return {
    getBaseShift,
    isWorked,
    isNight,
    isDayHoliday,
    isWeekend,
    getWorkerMeta,
    isDateInVacation,
    getWorkerSchedule,
    validateWorkerSchedule,
    validateSwap,
    findAvailableCoverWorkers,
    findReturnDays
  };
})();
