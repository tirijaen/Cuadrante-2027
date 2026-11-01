/**
 * Cuadrante 2027 Andújar - Aplicación Principal
 * Manejo de estado reactivo, permutas con recomendador inteligente e importador Excel (.xlsx)
 */

document.addEventListener('DOMContentLoaded', () => {
  const DATA = window.CUADRANTE_DATA;
  if (!DATA) {
    console.error('No se encontraron los datos del cuadrante.');
    return;
  }

  // --- COPIA ORIGINAL DE DATOS (Para restablecer en caso de importar Excel) ---
  const ORIGINAL_MATRIX_DOT = JSON.parse(JSON.stringify(DATA.matrix_dot));

  // --- CARGA DE MATRIZ PERSONALIZADA SI FUE IMPORTADA PREVIAMENTE ---
  try {
    const savedCustomMatrix = localStorage.getItem('cuadrante_custom_matrix');
    if (savedCustomMatrix) {
      const parsed = JSON.parse(savedCustomMatrix);
      if (Array.isArray(parsed) && parsed.length === DATA.workers.length) {
        DATA.matrix_dot = parsed;
      }
    }
  } catch (e) {
    console.warn('Error al leer matriz personalizada guardada:', e);
  }

  // --- ESTADO DE LA APLICACIÓN ---
  const state = {
    currentWorker: localStorage.getItem('cuadrante_worker') || 'Antonio J',
    currentDate: '2027-01-01',
    calendarMonth: 1, // 1 a 12
    matrixMonth: 1,
    activeTab: 'tab-my-shift',
    theme: localStorage.getItem('cuadrante_theme') || 'dark',
    simulatedOverrides: {}, // { [workerName]: { [dateStr]: shiftStr } }
    notes: {}, // { [dateStr]: noteText }
    selectedWorkerB: null, // Compañero que cubre en Paso 2
    selectedDateB: null, // Día acordado de devolución en Paso 3
    returnFilter: 'all', // 'all' | 'clean' | 'warning' | 'month' | 'weekend'
    modalDate: null,
    swapsMode: 'assistant', // 'assistant' | 'bank'
    bankFilter: 'pending', // 'pending' | 'settled' | 'all'
    debts: [],
    appliedSwaps: [] // Permutas activas aplicadas permanentemente
  };

  // Cargar notas del trabajador actual
  function loadWorkerNotes() {
    try {
      const saved = localStorage.getItem(`cuadrante_notes_${state.currentWorker}`);
      state.notes = saved ? JSON.parse(saved) : {};
    } catch (e) {
      state.notes = {};
    }
  }
  loadWorkerNotes();

  // Cargar bolsa de deudas y compromisos
  function loadDebts() {
    try {
      const raw = localStorage.getItem('cuadrante_turn_debts');
      state.debts = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error cargando deudas:', e);
      state.debts = [];
    }
  }
  loadDebts();

  // Cargar permutas activas persistentes
  function loadAppliedSwaps() {
    try {
      const raw = localStorage.getItem('cuadrante_applied_swaps');
      state.appliedSwaps = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error cargando permutas aplicadas:', e);
      state.appliedSwaps = [];
    }
    rebuildOverridesFromSwaps();
  }
  loadAppliedSwaps();

  // --- ELEMENTOS DEL DOM ---
  const el = {
    workerSelect: document.getElementById('workerSelect'),
    workerAvatar: document.getElementById('workerAvatar'),
    headerSubtitle: document.getElementById('headerSubtitle'),
    headerCustomSheetBadge: document.getElementById('headerCustomSheetBadge'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeMoonIcon: document.getElementById('themeMoonIcon'),
    themeSunIcon: document.getElementById('themeSunIcon'),
    tabContents: document.querySelectorAll('.tab-content'),
    navItems: document.querySelectorAll('.nav-item'),
    dockBtns: document.querySelectorAll('.dock-btn'),

    // Tab 1: Mi Cuadrante
    heroWorkerName: document.getElementById('heroWorkerName'),
    heroWorkerBadge: document.getElementById('heroWorkerBadge'),
    heroDatePicker: document.getElementById('heroDatePicker'),
    heroShiftBadge: document.getElementById('heroShiftBadge'),
    heroShiftLetter: document.getElementById('heroShiftLetter'),
    heroHolidayDot: document.getElementById('heroHolidayDot'),
    heroShiftTitle: document.getElementById('heroShiftTitle'),
    heroShiftTime: document.getElementById('heroShiftTime'),
    heroHolidayName: document.getElementById('heroHolidayName'),
    heroBuddiesList: document.getElementById('heroBuddiesList'),
    timelineRow: document.getElementById('timelineRow'),
    timelineRangeText: document.getElementById('timelineRangeText'),
    calendarMonthTitle: document.getElementById('calendarMonthTitle'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    calendarGrid: document.getElementById('calendarGrid'),
    quickExportIcsBtn: document.getElementById('quickExportIcsBtn'),

    // Tab 2: Equipo
    teamDatePicker: document.getElementById('teamDatePicker'),
    teamDailyHolidayBadge: document.getElementById('teamDailyHolidayBadge'),
    teamHolidayText: document.getElementById('teamHolidayText'),
    teamListM: document.getElementById('teamListM'),
    teamListT: document.getElementById('teamListT'),
    teamListN: document.getElementById('teamListN'),
    teamListFree: document.getElementById('teamListFree'),
    mCountBadge: document.getElementById('mCountBadge'),
    tCountBadge: document.getElementById('tCountBadge'),
    nCountBadge: document.getElementById('nCountBadge'),
    matrixMonthSelect: document.getElementById('matrixMonthSelect'),
    matrixThead: document.getElementById('matrixThead'),
    matrixTbody: document.getElementById('matrixTbody'),

    // Tab 3: Permutas Inteligentes (Rediseño 4 Pasos)
    swapDateA: document.getElementById('swapDateA'),
    step1Card: document.getElementById('step1Card'),
    step1WorkerName: document.getElementById('step1WorkerName'),
    step1ShiftBanner: document.getElementById('step1ShiftBanner'),
    step1ShiftBadge: document.getElementById('step1ShiftBadge'),
    step1ShiftTitle: document.getElementById('step1ShiftTitle'),
    step1ShiftTime: document.getElementById('step1ShiftTime'),
    step1AlreadyFreeAlert: document.getElementById('step1AlreadyFreeAlert'),

    step2Card: document.getElementById('step2Card'),
    coverCandidatesGrid: document.getElementById('coverCandidatesGrid'),

    step3Card: document.getElementById('step3Card'),
    step3WorkerBName: document.getElementById('step3WorkerBName'),
    step3WorkerBNameSub: document.getElementById('step3WorkerBNameSub'),
    returnFilterPills: document.getElementById('returnFilterPills'),
    returnDaysGrid: document.getElementById('returnDaysGrid'),

    step4AgreementCard: document.getElementById('step4AgreementCard'),
    agreementResultBadge: document.getElementById('agreementResultBadge'),
    summaryDateA: document.getElementById('summaryDateA'),
    summaryCoverWorkerB: document.getElementById('summaryCoverWorkerB'),
    summaryDateB: document.getElementById('summaryDateB'),
    summaryCoverWorkerA: document.getElementById('summaryCoverWorkerA'),
    summaryWorkerBFree: document.getElementById('summaryWorkerBFree'),
    agreementValidationBox: document.getElementById('agreementValidationBox'),
    agreementValidationTitle: document.getElementById('agreementValidationTitle'),
    agreementChecklist: document.getElementById('agreementChecklist'),
    agreementWarningsList: document.getElementById('agreementWarningsList'),
    agreementWarningsPills: document.getElementById('agreementWarningsPills'),
    applySimulationBtn: document.getElementById('applySimulationBtn'),
    saveToBankBtn: document.getElementById('saveToBankBtn'),
    resetSimulationBtn: document.getElementById('resetSimulationBtn'),
    restartSwapBtn: document.getElementById('restartSwapBtn'),
    activeSimulationsNotice: document.getElementById('activeSimulationsNotice'),

    // Bolsa de Turnos & Historial de Deudas
    modeAssistantBtn: document.getElementById('modeAssistantBtn'),
    modeBankBtn: document.getElementById('modeBankBtn'),
    swapsAssistantView: document.getElementById('swapsAssistantView'),
    swapsBankView: document.getElementById('swapsBankView'),
    bankPendingCountPill: document.getElementById('bankPendingCountPill'),
    openManualDebtModalBtn: document.getElementById('openManualDebtModalBtn'),
    bankKpiReceiveCount: document.getElementById('bankKpiReceiveCount'),
    bankKpiGiveCount: document.getElementById('bankKpiGiveCount'),
    bankKpiBalance: document.getElementById('bankKpiBalance'),
    bankFilterPills: document.getElementById('bankFilterPills'),
    filterCountPending: document.getElementById('filterCountPending'),
    filterCountSettled: document.getElementById('filterCountSettled'),
    filterCountAll: document.getElementById('filterCountAll'),
    bankCurrentWorkerDisplay: document.getElementById('bankCurrentWorkerDisplay'),
    bankDebtsList: document.getElementById('bankDebtsList'),
    manualDebtModal: document.getElementById('manualDebtModal'),
    closeManualDebtModalBtn: document.getElementById('closeManualDebtModalBtn'),
    cancelManualDebtBtn: document.getElementById('cancelManualDebtBtn'),
    manualDebtForm: document.getElementById('manualDebtForm'),
    debtOtherWorker: document.getElementById('debtOtherWorker'),
    debtDateOriginal: document.getElementById('debtDateOriginal'),
    debtShiftOriginal: document.getElementById('debtShiftOriginal'),
    debtDateReturn: document.getElementById('debtDateReturn'),
    debtShiftReturn: document.getElementById('debtShiftReturn'),
    debtNotes: document.getElementById('debtNotes'),

    // Mejora 2: WhatsApp y Volante Oficial RRHH
    shareWhatsappBtn: document.getElementById('shareWhatsappBtn'),
    generatePdfBtn: document.getElementById('generatePdfBtn'),
    rrhhVolanteModal: document.getElementById('rrhhVolanteModal'),
    btnPrintVolante: document.getElementById('btnPrintVolante'),
    closeVolanteModalBtn: document.getElementById('closeVolanteModalBtn'),
    vRefCode: document.getElementById('vRefCode'),
    vEmissionDate: document.getElementById('vEmissionDate'),
    vWorker1Name: document.getElementById('vWorker1Name'),
    vWorker2Name: document.getElementById('vWorker2Name'),
    vDateA: document.getElementById('vDateA'),
    vShiftA: document.getElementById('vShiftA'),
    vWorkerAssumesA: document.getElementById('vWorkerAssumesA'),
    vDateB: document.getElementById('vDateB'),
    vShiftB: document.getElementById('vShiftB'),
    vWorkerAssumesB: document.getElementById('vWorkerAssumesB'),
    vSigWorker1: document.getElementById('vSigWorker1'),
    vSigWorker2: document.getElementById('vSigWorker2'),

    // Tab 4: Estadísticas
    statWorkedDays: document.getElementById('statWorkedDays'),
    statGoalText: document.getElementById('statGoalText'),
    statProgressBar: document.getElementById('statProgressBar'),
    statMornings: document.getElementById('statMornings'),
    statAfternoons: document.getElementById('statAfternoons'),
    statNights: document.getElementById('statNights'),
    statHolidays: document.getElementById('statHolidays'),
    statWeekendsWorked: document.getElementById('statWeekendsWorked'),
    statWeekendsFree: document.getElementById('statWeekendsFree'),
    statVacDays: document.getElementById('statVacDays'),
    equityTableBody: document.getElementById('equityTableBody'),

    // Tab 5: Utilidades & Importador Excel
    exportPeriodSelect: document.getElementById('exportPeriodSelect'),
    btnDownloadIcs: document.getElementById('btnDownloadIcs'),
    pwaInstallBtn: document.getElementById('pwaInstallBtn'),
    excelDropzone: document.getElementById('excelDropzone'),
    excelFileInput: document.getElementById('excelFileInput'),
    btnTriggerExcelUpload: document.getElementById('btnTriggerExcelUpload'),
    btnResetToOriginalExcel: document.getElementById('btnResetToOriginalExcel'),
    excelImportStatus: document.getElementById('excelImportStatus'),
    excelActiveBadge: document.getElementById('excelActiveBadge'),

    // Modal
    dayDetailModal: document.getElementById('dayDetailModal'),
    modalDayTitle: document.getElementById('modalDayTitle'),
    modalShiftBadge: document.getElementById('modalShiftBadge'),
    modalShiftName: document.getElementById('modalShiftName'),
    modalShiftTime: document.getElementById('modalShiftTime'),
    modalHolidayNotice: document.getElementById('modalHolidayNotice'),
    modalBuddiesList: document.getElementById('modalBuddiesList'),
    modalDayNote: document.getElementById('modalDayNote'),
    modalSaveNoteBtn: document.getElementById('modalSaveNoteBtn'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),

    // Banner y Modal de Permutas Activas (Opción A)
    calendarActiveSwapsBanner: document.getElementById('calendarActiveSwapsBanner'),
    calendarActiveSwapsTitle: document.getElementById('calendarActiveSwapsTitle'),
    calendarActiveSwapsSub: document.getElementById('calendarActiveSwapsSub'),
    btnViewActiveSwaps: document.getElementById('btnViewActiveSwaps'),
    btnResetAllSwaps: document.getElementById('btnResetAllSwaps'),
    activeSwapsListModal: document.getElementById('activeSwapsListModal'),
    closeActiveSwapsModalBtn: document.getElementById('closeActiveSwapsModalBtn'),
    activeSwapsModalList: document.getElementById('activeSwapsModalList'),
    modalResetAllSwapsBtn: document.getElementById('modalResetAllSwapsBtn'),
    modalCloseActiveSwapsBtn: document.getElementById('modalCloseActiveSwapsBtn'),

    // Detalle de permuta en modal de día
    modalSwapAlertBox: document.getElementById('modalSwapAlertBox'),
    modalSwapAlertText: document.getElementById('modalSwapAlertText'),
    modalBtnRevertSwap: document.getElementById('modalBtnRevertSwap'),
    modalBtnVolanteSwap: document.getElementById('modalBtnVolanteSwap'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // --- INICIALIZACIÓN ---
  function init() {
    initTheme();
    checkCustomExcelState();
    populateWorkerSelect();
    populateMonthSelects();
    setupNavigation();
    setupEventListeners();
    setupExcelImporter();
    updateAppView();
    initPwa();
  }

  // --- TEMA CLARO / OSCURO ---
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcons();
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('cuadrante_theme', state.theme);
    updateThemeIcons();
    showToast(`Tema ${state.theme === 'dark' ? 'Oscuro' : 'Claro'} activado`);
  }

  function updateThemeIcons() {
    if (state.theme === 'dark') {
      el.themeMoonIcon.style.display = 'block';
      el.themeSunIcon.style.display = 'none';
    } else {
      el.themeMoonIcon.style.display = 'none';
      el.themeSunIcon.style.display = 'block';
    }
  }

  // Comprobar si hay una hoja personalizada importada
  function checkCustomExcelState() {
    const custom = localStorage.getItem('cuadrante_custom_matrix');
    const filename = localStorage.getItem('cuadrante_custom_matrix_name') || 'Hoja importada';
    if (custom) {
      if (el.headerCustomSheetBadge) el.headerCustomSheetBadge.style.display = 'inline-block';
      if (el.excelActiveBadge) {
        el.excelActiveBadge.style.display = 'inline-block';
        el.excelActiveBadge.textContent = `Activo: ${filename}`;
      }
      if (el.btnResetToOriginalExcel) el.btnResetToOriginalExcel.style.display = 'inline-flex';
    } else {
      if (el.headerCustomSheetBadge) el.headerCustomSheetBadge.style.display = 'none';
      if (el.excelActiveBadge) el.excelActiveBadge.style.display = 'none';
      if (el.btnResetToOriginalExcel) el.btnResetToOriginalExcel.style.display = 'none';
    }
  }

  // --- SELECTORES DE TRABAJADOR Y MESES ---
  function populateWorkerSelect() {
    el.workerSelect.innerHTML = '';

    DATA.workers.forEach(worker => {
      const opt = document.createElement('option');
      opt.value = worker;
      opt.textContent = worker;
      if (worker === state.currentWorker) opt.selected = true;
      el.workerSelect.appendChild(opt);
    });

    if (el.step1WorkerName) el.step1WorkerName.textContent = state.currentWorker;
    updateWorkerAvatar();
  }

  function updateWorkerAvatar() {
    const parts = state.currentWorker.split(' ');
    const initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    el.workerAvatar.textContent = initials;
  }

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  function populateMonthSelects() {
    el.matrixMonthSelect.innerHTML = '';
    MONTH_NAMES.forEach((mName, idx) => {
      const opt = document.createElement('option');
      opt.value = idx + 1;
      opt.textContent = `${mName} 2027`;
      el.matrixMonthSelect.appendChild(opt);
    });
  }

  // --- NAVEGACIÓN ENTRE PESTAÑAS ---
  function setupNavigation() {
    function switchTab(tabId) {
      state.activeTab = tabId;
      el.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
      });
      el.navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
      });
      el.dockBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
      });

      if (tabId === 'tab-team') {
        renderTeamDaily();
        renderMatrix();
      } else if (tabId === 'tab-swaps') {
        if (state.swapsMode === 'assistant') {
          updatePermutasWorkflow();
        } else {
          renderBankView();
        }
      } else if (tabId === 'tab-stats') {
        renderStatistics();
      }
    }

    el.navItems.forEach(item => {
      item.addEventListener('click', () => switchTab(item.getAttribute('data-tab')));
    });
    el.dockBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Cambio de trabajador principal
    el.workerSelect.addEventListener('change', (e) => {
      state.currentWorker = e.target.value;
      localStorage.setItem('cuadrante_worker', state.currentWorker);
      updateWorkerAvatar();
      loadWorkerNotes();
      populateWorkerSelect();
      updateAppView();
      showToast(`Trabajador activo: ${state.currentWorker}`);
    });

    // Toggle de tema
    el.themeToggleBtn.addEventListener('click', toggleTheme);

    // Selector de fecha en Tab 1
    el.heroDatePicker.addEventListener('change', (e) => {
      state.currentDate = e.target.value;
      const m = parseInt(state.currentDate.split('-')[1], 10);
      state.calendarMonth = m;
      renderHeroCard();
      renderTimeline();
      renderCalendar();
    });

    // Navegación de meses en calendario
    el.prevMonthBtn.addEventListener('click', () => {
      state.calendarMonth = state.calendarMonth > 1 ? state.calendarMonth - 1 : 12;
      renderCalendar();
    });

    el.nextMonthBtn.addEventListener('click', () => {
      state.calendarMonth = state.calendarMonth < 12 ? state.calendarMonth + 1 : 1;
      renderCalendar();
    });

    // Exportar ICS rápido
    el.quickExportIcsBtn.addEventListener('click', () => {
      window.CuadranteCalendar.downloadIcs(state.currentWorker, state.calendarMonth);
      showToast(`Descargando calendario de ${MONTH_NAMES[state.calendarMonth - 1]}...`);
    });

    // Exportar ICS pestaña herramientas
    el.btnDownloadIcs.addEventListener('click', () => {
      const period = el.exportPeriodSelect.value;
      const m = period === 'all' ? null : Number(period);
      window.CuadranteCalendar.downloadIcs(state.currentWorker, m);
      showToast(`Generado archivo .ics para ${state.currentWorker}`);
    });

    // Tab 2: Fecha de cobertura
    el.teamDatePicker.addEventListener('change', () => {
      renderTeamDaily();
    });

    // Tab 2: Selector de mes en Matriz
    el.matrixMonthSelect.addEventListener('change', (e) => {
      state.matrixMonth = Number(e.target.value);
      renderMatrix();
    });

    // Tab 3: Permutas Inteligentes (4 Pasos)
    if (el.swapDateA) {
      ['change', 'input'].forEach(evt => {
        el.swapDateA.addEventListener(evt, () => {
          state.selectedWorkerB = null;
          state.selectedDateB = null;
          if (el.step3Card) el.step3Card.style.display = 'none';
          if (el.step4AgreementCard) el.step4AgreementCard.style.display = 'none';
          updatePermutasWorkflow();
        });
      });
    }

    if (el.returnFilterPills) {
      el.returnFilterPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.recom-filter-btn');
        if (!btn) return;
        el.returnFilterPills.querySelectorAll('.recom-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.returnFilter = btn.getAttribute('data-filter');
        renderReturnDays();
      });
    }

    if (el.applySimulationBtn) {
      el.applySimulationBtn.addEventListener('click', applyPermutaSimulation);
    }

    if (el.resetSimulationBtn) {
      el.resetSimulationBtn.addEventListener('click', resetSimulation);
    }

    if (el.restartSwapBtn) {
      el.restartSwapBtn.addEventListener('click', () => {
        state.selectedWorkerB = null;
        state.selectedDateB = null;
        if (el.step3Card) el.step3Card.style.display = 'none';
        if (el.step4AgreementCard) el.step4AgreementCard.style.display = 'none';
        updatePermutasWorkflow();
        if (el.step1Card) el.step1Card.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Bolsa de Turnos & Historial de Deudas
    if (el.modeAssistantBtn) {
      el.modeAssistantBtn.addEventListener('click', () => switchSwapsMode('assistant'));
    }
    if (el.modeBankBtn) {
      el.modeBankBtn.addEventListener('click', () => switchSwapsMode('bank'));
    }
    if (el.saveToBankBtn) {
      el.saveToBankBtn.addEventListener('click', saveCurrentPermutaToBank);
    }
    if (el.openManualDebtModalBtn) {
      el.openManualDebtModalBtn.addEventListener('click', openManualDebtModal);
    }
    if (el.closeManualDebtModalBtn) {
      el.closeManualDebtModalBtn.addEventListener('click', closeManualDebtModal);
    }
    if (el.cancelManualDebtBtn) {
      el.cancelManualDebtBtn.addEventListener('click', closeManualDebtModal);
    }
    if (el.manualDebtModal) {
      el.manualDebtModal.addEventListener('click', (e) => {
        if (e.target === el.manualDebtModal) closeManualDebtModal();
      });
    }
    if (el.manualDebtForm) {
      el.manualDebtForm.addEventListener('submit', handleManualDebtSubmit);
    }
    if (el.bankFilterPills) {
      el.bankFilterPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.recom-filter-btn');
        if (!btn) return;
        el.bankFilterPills.querySelectorAll('.recom-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.bankFilter = btn.getAttribute('data-bank-filter');
        renderBankView();
      });
    }

    // Mejora 2: Compartir WhatsApp y Volante Oficial RRHH
    if (el.shareWhatsappBtn) {
      el.shareWhatsappBtn.addEventListener('click', shareCurrentPermutaViaWhatsapp);
    }
    if (el.generatePdfBtn) {
      el.generatePdfBtn.addEventListener('click', () => openRrhhVolanteModal(null));
    }
    if (el.btnPrintVolante) {
      el.btnPrintVolante.addEventListener('click', printRrhhVolante);
    }
    if (el.closeVolanteModalBtn) {
      el.closeVolanteModalBtn.addEventListener('click', closeRrhhVolanteModal);
    }
    if (el.rrhhVolanteModal) {
      el.rrhhVolanteModal.addEventListener('click', (e) => {
        if (e.target === el.rrhhVolanteModal) closeRrhhVolanteModal();
      });
    }

    // Gestión de Permutas Activas (Opción A)
    if (el.btnViewActiveSwaps) {
      el.btnViewActiveSwaps.addEventListener('click', openActiveSwapsListModal);
    }
    if (el.btnResetAllSwaps) {
      el.btnResetAllSwaps.addEventListener('click', resetAllSwaps);
    }
    if (el.closeActiveSwapsModalBtn) {
      el.closeActiveSwapsModalBtn.addEventListener('click', closeActiveSwapsListModal);
    }
    if (el.modalCloseActiveSwapsBtn) {
      el.modalCloseActiveSwapsBtn.addEventListener('click', closeActiveSwapsListModal);
    }
    if (el.modalResetAllSwapsBtn) {
      el.modalResetAllSwapsBtn.addEventListener('click', resetAllSwaps);
    }
    if (el.activeSwapsListModal) {
      el.activeSwapsListModal.addEventListener('click', (e) => {
        if (e.target === el.activeSwapsListModal) closeActiveSwapsListModal();
      });
    }

    // Modal de Día
    el.modalCloseBtn.addEventListener('click', closeModal);
    el.dayDetailModal.addEventListener('click', (e) => {
      if (e.target === el.dayDetailModal) closeModal();
    });

    el.modalSaveNoteBtn.addEventListener('click', saveModalNote);
  }

  // --- HELPERS DE TURNOS Y DATOS ---
  function getOfficialShift(workerName, dateStr) {
    const wIdx = DATA.workers.indexOf(workerName);
    const dIdx = DATA.dates.indexOf(dateStr);
    if (wIdx === -1 || dIdx === -1) return ' ';
    let shift = DATA.matrix_dot[wIdx][dIdx];
    if ((!shift || shift.trim() === '') && window.CuadranteValidator.isDateInVacation(workerName, dateStr)) {
      return 'VAC';
    }
    return (!shift || shift.trim() === '') ? 'LIBRE' : shift;
  }

  function getEffectiveShift(workerName, dateStr) {
    if (state.simulatedOverrides[workerName] && state.simulatedOverrides[workerName][dateStr] !== undefined) {
      return state.simulatedOverrides[workerName][dateStr];
    }
    const wIdx = DATA.workers.indexOf(workerName);
    const dIdx = DATA.dates.indexOf(dateStr);
    if (wIdx === -1 || dIdx === -1) return ' ';

    let shift = DATA.matrix_dot[wIdx][dIdx];
    if ((!shift || shift.trim() === '') && window.CuadranteValidator.isDateInVacation(workerName, dateStr)) {
      return 'VAC';
    }
    if (workerName === 'Extra 1') {
      const m = parseInt(dateStr.split('-')[1], 10);
      if (![6, 7, 8, 9].includes(m)) {
        return 'INACTIVO';
      }
    }
    return (!shift || shift.trim() === '') ? 'LIBRE' : shift;
  }

  function getShiftDisplayInfo(shiftCode) {
    if (DATA.shiftTypes[shiftCode]) {
      return DATA.shiftTypes[shiftCode];
    }
    const base = shiftCode.replace('.', '').trim();
    if (DATA.shiftTypes[base]) {
      return {
        ...DATA.shiftTypes[base],
        name: DATA.shiftTypes[base].name + (shiftCode.includes('.') ? ' Festiva' : '')
      };
    }
    return {
      name: 'Descanso',
      short: 'L',
      time: 'Libre',
      color: '#64748b'
    };
  }

  // --- RENDERIZADO GLOBAL ---
  function updateAppView() {
    renderHeroCard();
    renderTimeline();
    renderCalendar();
    renderActiveSwapsBanner();
    renderTeamDaily();
    renderMatrix();
    renderStatistics();
    renderBankView();
    if (state.activeTab === 'tab-swaps') {
      if (state.swapsMode === 'assistant') {
        updatePermutasWorkflow();
      } else {
        renderBankView();
      }
    }
  }

  // --- TAB 1: HERO CARD ---
  function renderHeroCard() {
    const meta = DATA.workersMeta.find(w => w.name === state.currentWorker);
    el.heroWorkerName.textContent = state.currentWorker;
    el.heroWorkerBadge.textContent = meta ? meta.badge : 'Personal';

    const shift = getEffectiveShift(state.currentWorker, state.currentDate);
    const base = window.CuadranteValidator.getBaseShift(shift);
    const info = getShiftDisplayInfo(shift);
    const isHoliday = shift.includes('.') || Boolean(DATA.holidays[state.currentDate]);

    el.heroShiftBadge.className = 'shift-badge-large ' + (base !== 'L' ? base : (shift === 'VAC' ? 'VAC' : 'LIBRE'));
    el.heroShiftLetter.textContent = base === 'L' ? (shift === 'VAC' ? 'VAC' : 'L') : (shift.includes('.') ? `${base}.` : base);

    el.heroHolidayDot.style.display = isHoliday ? 'block' : 'none';
    el.heroShiftTitle.textContent = info.name;
    el.heroShiftTime.textContent = info.time;

    if (DATA.holidays[state.currentDate]) {
      el.heroHolidayName.textContent = `🎉 Festivo: ${DATA.holidays[state.currentDate]}`;
      el.heroHolidayName.style.display = 'block';
    } else if (DATA.specialDates && DATA.specialDates[state.currentDate]) {
      el.heroHolidayName.textContent = `⭐ ${DATA.specialDates[state.currentDate]}`;
      el.heroHolidayName.style.display = 'block';
    } else {
      el.heroHolidayName.style.display = 'none';
    }

    el.heroBuddiesList.innerHTML = '';
    if (base !== 'L') {
      const buddies = [];
      DATA.workers.forEach(w => {
        if (w !== state.currentWorker) {
          const s = getEffectiveShift(w, state.currentDate);
          if (window.CuadranteValidator.getBaseShift(s) === base) {
            buddies.push(w);
          }
        }
      });

      if (buddies.length > 0) {
        buddies.forEach(buddy => {
          const chip = document.createElement('div');
          chip.className = 'buddy-chip';
          chip.innerHTML = `<span>👤</span> ${buddy}`;
          el.heroBuddiesList.appendChild(chip);
        });
      } else {
        el.heroBuddiesList.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Estás solo en este turno (100% de servicio)</span>';
      }
    } else {
      el.heroBuddiesList.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Jornada de descanso / libre</span>';
    }
  }

  // --- TAB 1: TIMELINE (7 DÍAS) ---
  function renderTimeline() {
    el.timelineRow.innerHTML = '';
    const startDate = new Date(state.currentDate + 'T12:00:00');
    const WEEKDAY_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      if (y !== 2027) continue;

      const shift = getEffectiveShift(state.currentWorker, dateStr);
      const base = window.CuadranteValidator.getBaseShift(shift);
      const isSelected = dateStr === state.currentDate;
      const displayLabel = base === 'L' ? (shift === 'VAC' ? 'VAC' : 'L') : (shift.includes('.') ? `${base}.` : base);

      const card = document.createElement('div');
      card.className = `timeline-day-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="day-weekday">${WEEKDAY_SHORT[d.getDay()]}</div>
        <div class="day-number">${d.getDate()}</div>
        <div class="timeline-shift-pill shift-${base}">${displayLabel}</div>
      `;

      card.addEventListener('click', () => {
        state.currentDate = dateStr;
        el.heroDatePicker.value = dateStr;
        renderHeroCard();
        renderTimeline();
      });

      el.timelineRow.appendChild(card);
    }

    const endD = new Date(startDate);
    endD.setDate(startDate.getDate() + 6);
    el.timelineRangeText.textContent = `${startDate.getDate()} ${MONTH_NAMES[startDate.getMonth()]} - ${endD.getDate()} ${MONTH_NAMES[endD.getMonth()]}`;
  }

  // --- TAB 1: CALENDARIO MENSUAL ---
  // Corrección Error 1: Asegurar que sábados y domingos se coloreen con el turno correspondiente
  function renderCalendar() {
    el.calendarMonthTitle.textContent = `${MONTH_NAMES[state.calendarMonth - 1]} 2027`;
    el.calendarGrid.innerHTML = '';

    const year = 2027;
    const month = state.calendarMonth;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const totalDays = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-cell empty';
      el.calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dt = new Date(dateStr + 'T12:00:00');
      const dow = dt.getDay();
      const isWeekend = (dow === 0 || dow === 6);
      const isHoliday = Boolean(DATA.holidays[dateStr]);
      const shift = getEffectiveShift(state.currentWorker, dateStr);
      const base = window.CuadranteValidator.getBaseShift(shift);
      const isHolidayShift = shift.includes('.') || isHoliday;
      const hasNote = Boolean(state.notes[dateStr]);

      const activeSwap = getSwapForDate(state.currentWorker, dateStr);
      const isPermutaSwap = Boolean(activeSwap);
      let otherWorkerName = '';
      if (activeSwap) {
        otherWorkerName = activeSwap.workerA === state.currentWorker ? activeSwap.workerB : activeSwap.workerA;
      }

      const displayBadgeText = base === 'L' ? (shift === 'VAC' ? 'VAC' : 'L') : (shift.includes('.') ? `${base}.` : base);

      const cell = document.createElement('div');
      cell.className = `calendar-cell ${isWeekend ? 'weekend' : ''} ${isHoliday ? 'is-holiday' : ''} ${isPermutaSwap ? 'is-permuta-swap' : ''}`;
      
      // La clase CSS usa shift-${base} (ej: shift-M, shift-T, shift-N) para que funcione tanto en findes como entre semana
      cell.innerHTML = `
        <div class="cell-top">
          <span class="cell-date-num">${day}</span>
          <div style="display:flex; gap:3px; align-items:center;">
            ${isPermutaSwap ? `<span class="cell-swap-badge" title="Permuta activa con ${otherWorkerName}">🔀</span>` : ''}
            ${hasNote ? '<span class="cell-has-note" title="Tiene nota personal"></span>' : ''}
            ${isHoliday ? '<span class="cell-dot-fest" title="Festivo Oficial"></span>' : ''}
          </div>
        </div>
        <div class="cell-shift-badge shift-${base} ${isHolidayShift ? 'is-holiday-shift' : ''}">${displayBadgeText}</div>
      `;

      cell.addEventListener('click', () => {
        openDayModal(dateStr, shift, getShiftDisplayInfo(shift));
      });

      el.calendarGrid.appendChild(cell);
    }
  }

  // --- MODAL DETALLE DE DÍA & NOTAS ---
  function openDayModal(dateStr, shift, info) {
    state.modalDate = dateStr;
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(dateStr + 'T12:00:00');
    const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const base = window.CuadranteValidator.getBaseShift(shift);
    
    el.modalDayTitle.textContent = `${WEEKDAY_NAMES[dt.getDay()]}, ${d} de ${MONTH_NAMES[Number(m) - 1]} de ${y}`;
    el.modalShiftBadge.className = 'shift-badge-large ' + (base !== 'L' ? base : (shift === 'VAC' ? 'VAC' : 'LIBRE'));
    el.modalShiftBadge.textContent = base === 'L' ? (shift === 'VAC' ? 'VAC' : 'L') : (shift.includes('.') ? `${base}.` : base);
    el.modalShiftName.textContent = info.name;
    el.modalShiftTime.textContent = info.time;

    if (DATA.holidays[dateStr]) {
      el.modalHolidayNotice.textContent = `🎉 Festivo Oficial: ${DATA.holidays[dateStr]}`;
      el.modalHolidayNotice.style.display = 'block';
    } else {
      el.modalHolidayNotice.style.display = 'none';
    }

    // Comprobar si este día tiene una permuta activa
    const activeSwap = getSwapForDate(state.currentWorker, dateStr);
    if (activeSwap && el.modalSwapAlertBox) {
      el.modalSwapAlertBox.style.display = 'block';
      const otherWorker = activeSwap.workerA === state.currentWorker ? activeSwap.workerB : activeSwap.workerA;
      const otherFullName = getWorkerFullName(otherWorker);

      let explanation = '';
      if (activeSwap.workerA === state.currentWorker) {
        if (dateStr === activeSwap.dateA) {
          explanation = `Permuta activa con <strong>${otherFullName}</strong>. Solicitaste estar <strong>LIBRE</strong> en esta jornada (tu turno oficial en cuadrante era <strong>${formatShiftDesc(activeSwap.origShiftA)}</strong>). ${otherWorker} asume el servicio por ti.`;
        } else {
          explanation = `Permuta activa con <strong>${otherFullName}</strong>. Cubres el turno de tu compañero asumiendo <strong>${formatShiftDesc(activeSwap.origShiftB)}</strong> en devolución. Tu jornada oficial era Descanso.`;
        }
      } else {
        if (dateStr === activeSwap.dateA) {
          explanation = `Permuta activa con <strong>${otherFullName}</strong>. Cubres a tu compañero asumiendo su turno de <strong>${formatShiftDesc(activeSwap.origShiftA)}</strong>.`;
        } else {
          explanation = `Permuta activa con <strong>${otherFullName}</strong>. Disfrutas de jornada <strong>LIBRE</strong> por compensación pactada.`;
        }
      }

      if (el.modalSwapAlertText) el.modalSwapAlertText.innerHTML = explanation;
      if (el.modalBtnRevertSwap) {
        el.modalBtnRevertSwap.onclick = () => {
          if (confirm(`¿Deseas cancelar esta permuta con ${otherFullName} y restablecer los turnos oficiales de ambas fechas?`)) {
            cancelSingleSwap(activeSwap.id);
            closeModal();
          }
        };
      }
      if (el.modalBtnVolanteSwap) {
        el.modalBtnVolanteSwap.onclick = () => {
          openRrhhVolanteModal(activeSwap);
          closeModal();
        };
      }
    } else if (el.modalSwapAlertBox) {
      el.modalSwapAlertBox.style.display = 'none';
    }

    el.modalBuddiesList.innerHTML = '';
    if (base !== 'L') {
      const buddies = [];
      DATA.workers.forEach(w => {
        const s = getEffectiveShift(w, dateStr);
        if (window.CuadranteValidator.getBaseShift(s) === base) {
          buddies.push(w);
        }
      });
      buddies.forEach(b => {
        const chip = document.createElement('div');
        chip.className = 'buddy-chip' + (b === state.currentWorker ? ' is-active-user' : '');
        chip.innerHTML = `<span>👤</span> ${b} ${b === state.currentWorker ? ' (Tú)' : ''}`;
        el.modalBuddiesList.appendChild(chip);
      });
    } else {
      el.modalBuddiesList.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Sin servicio asignado (Descanso o Vacaciones)</span>';
    }

    el.modalDayNote.value = state.notes[dateStr] || '';
    el.dayDetailModal.classList.add('open');
  }

  function closeModal() {
    el.dayDetailModal.classList.remove('open');
    state.modalDate = null;
  }

  function saveModalNote() {
    if (!state.modalDate) return;
    const noteText = el.modalDayNote.value.trim();
    if (noteText) {
      state.notes[state.modalDate] = noteText;
    } else {
      delete state.notes[state.modalDate];
    }
    localStorage.setItem(`cuadrante_notes_${state.currentWorker}`, JSON.stringify(state.notes));
    closeModal();
    renderCalendar();
    showToast('Nota personal guardada');
  }

  // --- TAB 2: EQUIPO Y COBERTURAS ---
  function renderTeamDaily() {
    const dateStr = el.teamDatePicker.value;
    const isHoliday = Boolean(DATA.holidays[dateStr]);

    if (isHoliday) {
      el.teamHolidayText.textContent = `Festivo Oficial: ${DATA.holidays[dateStr]}`;
      el.teamDailyHolidayBadge.style.display = 'block';
    } else if (DATA.specialDates && DATA.specialDates[dateStr]) {
      el.teamHolidayText.textContent = DATA.specialDates[dateStr];
      el.teamDailyHolidayBadge.style.display = 'block';
    } else {
      el.teamDailyHolidayBadge.style.display = 'none';
    }

    el.teamListM.innerHTML = '';
    el.teamListT.innerHTML = '';
    el.teamListN.innerHTML = '';
    el.teamListFree.innerHTML = '';

    let mCount = 0, tCount = 0, nCount = 0;

    DATA.workers.forEach(w => {
      const shift = getEffectiveShift(w, dateStr);
      const base = window.CuadranteValidator.getBaseShift(shift);
      const isMe = (w === state.currentWorker);

      const item = document.createElement('div');
      item.className = 'worker-item-card' + (isMe ? ' is-active-user' : '');
      item.innerHTML = `
        <span class="name">👤 ${w} ${isMe ? '⭐' : ''}</span>
        <span class="role">${shift.includes('.') ? '⭐ Festivo' : ''}</span>
      `;

      if (base === 'M') {
        mCount++;
        el.teamListM.appendChild(item);
      } else if (base === 'T') {
        tCount++;
        el.teamListT.appendChild(item);
      } else if (base === 'N') {
        nCount++;
        el.teamListN.appendChild(item);
      } else {
        const chip = document.createElement('div');
        chip.className = 'buddy-chip' + (isMe ? ' is-active-user' : '');
        chip.textContent = `${w} (${shift === 'VAC' ? 'Vacaciones' : 'Libre'})`;
        el.teamListFree.appendChild(chip);
      }
    });

    el.mCountBadge.textContent = `${mCount} trab.`;
    el.tCountBadge.textContent = `${tCount} trab.`;
    el.nCountBadge.textContent = `${nCount} trab.`;
  }

  // --- TAB 2: MATRIZ GENERAL COMPLETA ---
  function renderMatrix() {
    const month = state.matrixMonth;
    const year = 2027;
    const lastDay = new Date(year, month, 0).getDate();

    let theadHtml = '<tr><th class="sticky-col">Trabajador</th>';
    for (let day = 1; day <= lastDay; day++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dt = new Date(dStr + 'T12:00:00');
      const dow = dt.getDay();
      const isWk = (dow === 0 || dow === 6);
      const isHol = Boolean(DATA.holidays[dStr]);
      const cls = isHol ? 'holiday-col' : (isWk ? 'weekend-col' : '');

      theadHtml += `<th class="${cls}">${day}</th>`;
    }
    theadHtml += '<th>Total</th></tr>';
    el.matrixThead.innerHTML = theadHtml;

    let tbodyHtml = '';
    DATA.workers.forEach(w => {
      const isMe = (w === state.currentWorker);
      tbodyHtml += `<tr style="${isMe ? 'background:rgba(99,102,241,0.06);' : ''}">`;
      tbodyHtml += `<td class="sticky-col">${w} ${isMe ? '⭐' : ''}</td>`;

      let monthWorked = 0;
      for (let day = 1; day <= lastDay; day++) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const shift = getEffectiveShift(w, dStr);
        const base = window.CuadranteValidator.getBaseShift(shift);
        if (base !== 'L') monthWorked++;

        const dt = new Date(dStr + 'T12:00:00');
        const dow = dt.getDay();
        const isWk = (dow === 0 || dow === 6);
        const isHol = Boolean(DATA.holidays[dStr]);
        const cls = isHol ? 'holiday-col' : (isWk ? 'weekend-col' : '');

        let displayShift = shift === 'LIBRE' || shift === 'INACTIVO' ? '' : shift;
        let colorStyle = '';
        if (base === 'M') colorStyle = 'color:var(--shift-m); font-weight:700;';
        if (base === 'T') colorStyle = 'color:var(--shift-t); font-weight:700;';
        if (base === 'N') colorStyle = 'color:var(--shift-n); font-weight:700;';
        if (shift === 'VAC') colorStyle = 'color:var(--shift-vac); font-weight:700; font-size:0.65rem;';

        tbodyHtml += `<td class="${cls}" style="${colorStyle}">${displayShift}</td>`;
      }

      tbodyHtml += `<td style="font-weight:700;">${monthWorked}d</td>`;
      tbodyHtml += '</tr>';
    });
    el.matrixTbody.innerHTML = tbodyHtml;
  }

  // --- TAB 3: PERMUTAS INTELIGENTES (REDISEÑO EN 4 PASOS) ---

  function formatDateSpanish(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dt = new Date(`${dateStr}T12:00:00`);
    const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${WEEKDAYS[dt.getDay()]}, ${d} de ${MONTH_NAMES[m - 1]}`;
  }

  function updatePermutasWorkflow() {
    const workerA = state.currentWorker;
    if (el.step1WorkerName) el.step1WorkerName.textContent = workerA;

    const dateA = el.swapDateA ? el.swapDateA.value : '2027-02-05';
    const curA = getEffectiveShift(workerA, dateA);
    const baseA = window.CuadranteValidator.getBaseShift(curA);

    // Si el trabajador ya está de descanso en esa fecha
    if (baseA === 'L') {
      if (el.step1AlreadyFreeAlert) el.step1AlreadyFreeAlert.style.display = 'block';
      if (el.step1ShiftBanner) el.step1ShiftBanner.style.opacity = '0.5';
      if (el.step2Card) {
        el.step2Card.style.opacity = '0.5';
        el.step2Card.style.pointerEvents = 'none';
      }
      if (el.step3Card) el.step3Card.style.display = 'none';
      if (el.step4AgreementCard) el.step4AgreementCard.style.display = 'none';
      if (el.coverCandidatesGrid) {
        el.coverCandidatesGrid.innerHTML = `
          <div style="grid-column: 1 / -1; font-size:0.85rem; color:var(--text-muted); padding:16px; text-align:center;">
            Elige una fecha en la que tengas un turno asignado de trabajo (M, T o N) para poder permutarlo.
          </div>`;
      }
      return;
    }

    // El trabajador tiene turno en dateA: actualizar banner
    if (el.step1AlreadyFreeAlert) el.step1AlreadyFreeAlert.style.display = 'none';
    if (el.step1ShiftBanner) el.step1ShiftBanner.style.opacity = '1';
    if (el.step2Card) {
      el.step2Card.style.opacity = '1';
      el.step2Card.style.pointerEvents = 'auto';
    }

    const info = getShiftDisplayInfo(curA);
    if (el.step1ShiftBadge) {
      el.step1ShiftBadge.className = `shift-badge-large ${baseA}`;
      el.step1ShiftBadge.textContent = curA;
    }
    if (el.step1ShiftTitle) el.step1ShiftTitle.textContent = info.name;
    if (el.step1ShiftTime) el.step1ShiftTime.textContent = info.time;

    // Render Paso 2: Análisis de compañeros que pueden cubrir
    renderCoverCandidates(workerA, dateA, curA);

    // Si ya hay un compañero elegido (workerB), render Paso 3
    if (state.selectedWorkerB) {
      renderReturnDays();
      // Si también hay fecha elegida (dateB), render Paso 4
      if (state.selectedDateB) {
        renderAgreementSummary();
      }
    } else {
      if (el.step3Card) el.step3Card.style.display = 'none';
      if (el.step4AgreementCard) el.step4AgreementCard.style.display = 'none';
    }
  }

  function renderCoverCandidates(workerA, dateA, curShiftA) {
    if (!el.coverCandidatesGrid) return;
    const candidates = window.CuadranteValidator.findAvailableCoverWorkers(workerA, dateA);

    el.coverCandidatesGrid.innerHTML = '';

    candidates.forEach(cand => {
      const isSelected = (state.selectedWorkerB === cand.worker);
      const card = document.createElement('div');
      card.className = `candidate-worker-card status-${cand.status} ${isSelected ? 'is-selected' : ''}`;

      // Iniciales
      const parts = cand.worker.split(' ');
      const initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();

      let badgeHtml = '';
      let actionBtnHtml = '';
      let detailHtml = '';

      if (cand.status === 'clean') {
        badgeHtml = `<span class="candidate-badge-pill">✓ 100% Conforme</span>`;
        detailHtml = `<div style="font-size:0.78rem; color:var(--text-secondary);">Está de descanso este día. Puede cubrirte sin vulnerar descansos de 12h ni superar 5 días.</div>`;
        actionBtnHtml = `<button class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:100%; justify-content:center;">${isSelected ? '✓ Seleccionado' : 'Elegir compañero'}</button>`;
      } else if (cand.status === 'warning') {
        badgeHtml = `<span class="candidate-badge-pill">⚠️ Con Warning</span>`;
        const warnItems = cand.warnings.map(w => `<div>• ${w}</div>`).join('');
        detailHtml = `
          <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:4px;">Disponible si se obvia la regla ergonómica:</div>
          <div class="candidate-warnings-list">${warnItems}</div>
        `;
        actionBtnHtml = `<button class="btn-secondary" style="padding:6px 12px; font-size:0.8rem; width:100%; justify-content:center; color:#f59e0b; border-color:#f59e0b;">${isSelected ? '✓ Seleccionado con Warning' : 'Elegir con Warning'}</button>`;
      } else if (cand.status === 'working') {
        badgeHtml = `<span class="candidate-badge-pill">Ya trabaja</span>`;
        detailHtml = `<div style="font-size:0.75rem; color:var(--text-muted);">${cand.reason}</div>`;
        actionBtnHtml = `<span style="font-size:0.75rem; color:var(--text-muted); text-align:center;">No disponible</span>`;
      } else {
        badgeHtml = `<span class="candidate-badge-pill" style="background:rgba(244,63,94,0.18); color:#f43f5e;">No disponible</span>`;
        detailHtml = `<div style="font-size:0.75rem; color:var(--text-muted);">${cand.reason}</div>`;
        actionBtnHtml = `<span style="font-size:0.75rem; color:#f43f5e; font-weight:600; text-align:center;">No disponible</span>`;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:32px; height:32px; border-radius:50%; background:var(--accent-gradient); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">${initials}</div>
            <div>
              <div style="font-weight:700; font-size:0.95rem;">${cand.worker}</div>
            </div>
          </div>
          ${badgeHtml}
        </div>
        <div style="flex-grow:1; margin:8px 0;">
          ${detailHtml}
        </div>
        <div>
          ${actionBtnHtml}
        </div>
      `;

      if (cand.status === 'clean' || cand.status === 'warning') {
        card.addEventListener('click', () => {
          selectCoverCandidate(cand.worker);
        });
      }

      el.coverCandidatesGrid.appendChild(card);
    });
  }

  function selectCoverCandidate(workerB) {
    state.selectedWorkerB = workerB;
    state.selectedDateB = null; // Reset devolución al cambiar de compañero

    // Resaltar en interfaz
    document.querySelectorAll('.candidate-worker-card').forEach(c => c.classList.remove('is-selected'));
    const cards = el.coverCandidatesGrid.querySelectorAll('.candidate-worker-card');
    cards.forEach(c => {
      if (c.innerHTML.includes(workerB)) c.classList.add('is-selected');
    });

    if (el.step3WorkerBName) el.step3WorkerBName.textContent = workerB;
    if (el.step3WorkerBNameSub) el.step3WorkerBNameSub.textContent = workerB;
    if (el.step3Card) {
      el.step3Card.style.display = 'block';
      el.step3Card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (el.step4AgreementCard) el.step4AgreementCard.style.display = 'none';

    renderReturnDays();
    showToast(`Compañero para cubrirte: ${workerB}`);
  }

  function renderReturnDays() {
    if (!el.returnDaysGrid) return;
    const workerA = state.currentWorker;
    const dateA = el.swapDateA.value;
    const workerB = state.selectedWorkerB;

    if (!workerA || !workerB || !dateA) {
      if (el.step3Card) el.step3Card.style.display = 'none';
      return;
    }

    const viableDays = window.CuadranteValidator.findReturnDays(workerA, dateA, workerB);

    // Filtros
    let filtered = viableDays;
    if (state.returnFilter === 'clean') {
      filtered = viableDays.filter(d => d.isClean);
    } else if (state.returnFilter === 'warning') {
      filtered = viableDays.filter(d => !d.isClean);
    } else if (state.returnFilter === 'month') {
      filtered = viableDays.filter(d => d.sameMonth);
    } else if (state.returnFilter === 'weekend') {
      filtered = viableDays.filter(d => d.isWeekend);
    }

    if (viableDays.length === 0) {
      el.returnDaysGrid.innerHTML = `
        <div style="grid-column: 1 / -1; font-size:0.85rem; color:var(--text-muted); padding:16px; text-align:center;">
          ⚠️ No se han encontrado días viables en todo el año para devolverle el turno a <strong>${workerB}</strong> sin romper reglas estrictas (cobertura o restricciones de plantilla).
        </div>`;
      return;
    }

    if (filtered.length === 0) {
      el.returnDaysGrid.innerHTML = `
        <div style="grid-column: 1 / -1; font-size:0.85rem; color:var(--text-muted); padding:16px; text-align:center;">
          No hay fechas disponibles con el filtro actual ("${state.returnFilter}"). Selecciona "Todas las opciones" para ver los ${viableDays.length} días viables.
        </div>`;
      return;
    }

    el.returnDaysGrid.innerHTML = '';

    filtered.slice(0, 45).forEach(item => {
      const isSelected = (state.selectedDateB === item.date);
      const card = document.createElement('div');
      card.className = `return-day-item-card ${item.isClean ? 'is-clean' : 'is-warning'} ${isSelected ? 'is-selected' : ''}`;

      const info = getShiftDisplayInfo(item.shift);

      let warningHtml = '';
      if (!item.isClean && item.warnings.length > 0) {
        const warnPills = item.warnings.map(w => `<div style="margin-top:2px;">• ${w}</div>`).join('');
        warningHtml = `
          <div class="candidate-warnings-list" style="margin-top:6px;">
            ${warnPills}
          </div>
        `;
      }

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <div>
              <div style="font-weight:700; font-size:0.95rem;">${item.weekdayName}, ${item.day} de ${MONTH_NAMES[item.month - 1]}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${item.date} ${item.isHoliday ? '· 🎉 Festivo' : (item.isWeekend ? '· Fin de semana' : '')}</div>
            </div>
            ${item.isClean
              ? '<span class="recom-badge-clean" style="font-size:0.7rem; font-weight:700; background:rgba(16,185,129,0.2); color:#10b981; padding:2px 8px; border-radius:10px;">✓ 100% Conforme</span>'
              : '<span class="recom-badge-warning" style="font-size:0.7rem; font-weight:700; background:rgba(245,158,11,0.2); color:#f59e0b; padding:2px 8px; border-radius:10px;">⚠️ Con Warning</span>'}
          </div>

          <div style="font-size:0.8rem; color:var(--text-secondary); margin:6px 0;">
            Turno de ${workerB} que asumes: <span class="timeline-shift-pill shift-${item.base}" style="font-size:0.75rem; padding:2px 8px;">${info.name} (${info.time})</span>
          </div>

          ${warningHtml}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span style="font-size:0.72rem; color:${item.sameMonth ? '#10b981' : 'var(--text-muted)'}; font-weight:600;">
            ${item.sameMonth ? '⭐ Mismo mes' : 'Mes próximo'}
          </span>
          <button class="btn-primary" style="padding:4px 10px; font-size:0.75rem;">
            ${isSelected ? '✓ Elegido' : 'Elegir esta fecha'}
          </button>
        </div>
      `;

      card.addEventListener('click', () => {
        selectReturnDay(item);
      });

      el.returnDaysGrid.appendChild(card);
    });
  }

  function selectReturnDay(item) {
    state.selectedDateB = item.date;

    // Resaltar en interfaz
    document.querySelectorAll('.return-day-item-card').forEach(c => c.classList.remove('is-selected'));
    const cards = el.returnDaysGrid.querySelectorAll('.return-day-item-card');
    cards.forEach(c => {
      if (c.innerHTML.includes(item.date)) c.classList.add('is-selected');
    });

    if (el.step4AgreementCard) {
      el.step4AgreementCard.style.display = 'block';
      el.step4AgreementCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderAgreementSummary();
    showToast(`Día acordado para devolver turno: ${item.weekdayName} ${item.day} de ${MONTH_NAMES[item.month - 1]}`);
  }

  function renderAgreementSummary() {
    const workerA = state.currentWorker;
    const dateA = el.swapDateA.value;
    const workerB = state.selectedWorkerB;
    const dateB = state.selectedDateB;

    if (!workerA || !workerB || !dateA || !dateB) {
      if (el.step4AgreementCard) el.step4AgreementCard.style.display = 'none';
      return;
    }

    const curShiftA = getEffectiveShift(workerA, dateA);
    const origShiftB = getEffectiveShift(workerB, dateB);

    if (el.summaryDateA) el.summaryDateA.textContent = formatDateSpanish(dateA);
    if (el.summaryCoverWorkerB) el.summaryCoverWorkerB.textContent = `Te cubre: ${workerB} (asume turno ${curShiftA})`;

    if (el.summaryDateB) el.summaryDateB.textContent = formatDateSpanish(dateB);
    if (el.summaryCoverWorkerA) el.summaryCoverWorkerA.textContent = `Tú cubres a ${workerB} (asumes turno ${origShiftB})`;
    if (el.summaryWorkerBFree) el.summaryWorkerBFree.textContent = `${workerB} queda: LIBRE`;

    // Validación oficial
    const res = window.CuadranteValidator.validateSwap({
      workerA, dateA, newShiftA: ' ',
      workerB, dateB, newShiftB: ' '
    });

    if (el.agreementValidationBox) {
      el.agreementValidationBox.className = 'validation-results-panel ' + (res.valid ? (res.hasWarnings ? 'has-warning' : 'valid') : 'invalid');
    }

    if (el.agreementResultBadge) {
      if (res.valid) {
        if (res.hasWarnings) {
          el.agreementResultBadge.textContent = 'Permuta Viable con Advertencia';
          el.agreementResultBadge.style.background = '#f59e0b';
          el.agreementResultBadge.style.color = '#fff';
        } else {
          el.agreementResultBadge.textContent = 'Permuta 100% Conforme';
          el.agreementResultBadge.style.background = '#10b981';
          el.agreementResultBadge.style.color = '#fff';
        }
      } else {
        el.agreementResultBadge.textContent = 'Permuta No Disponible';
        el.agreementResultBadge.style.background = '#f43f5e';
        el.agreementResultBadge.style.color = '#fff';
      }
    }

    if (el.agreementChecklist) {
      el.agreementChecklist.innerHTML = '';
      res.checks.forEach(chk => {
        const item = document.createElement('div');
        item.className = 'check-item ' + (chk.ok ? 'ok' : (chk.isWarning ? 'warning' : 'fail'));
        let icon = '✅';
        if (!chk.ok) icon = chk.isWarning ? '⚠️' : '❌';
        item.innerHTML = `<span>${icon}</span> ${chk.name}`;
        el.agreementChecklist.appendChild(item);
      });
    }

    if (el.agreementWarningsList) {
      if (res.warnings.length > 0) {
        el.agreementWarningsList.style.display = 'block';
        if (el.agreementWarningsPills) {
          el.agreementWarningsPills.innerHTML = '';
          res.warnings.forEach(warn => {
            const pill = document.createElement('div');
            pill.className = 'warning-pill';
            pill.innerHTML = `<strong>${warn.worker || ''} (${warn.date}):</strong> ${warn.desc}`;
            el.agreementWarningsPills.appendChild(pill);
          });
        }
      } else {
        el.agreementWarningsList.style.display = 'none';
      }
    }

    if (el.applySimulationBtn) {
      el.applySimulationBtn.disabled = !res.valid;
      el.applySimulationBtn.style.opacity = res.valid ? '1' : '0.5';
    }
  }

  function applyPermutaSimulation() {
    const workerA = state.currentWorker;
    const dateA = el.swapDateA.value;
    const workerB = state.selectedWorkerB;
    const dateB = state.selectedDateB;

    if (!workerA || !workerB || !dateA || !dateB) return;

    const curShiftA = getOfficialShift(workerA, dateA);
    const origShiftB = getOfficialShift(workerB, dateB);

    const newSwap = {
      id: 'swap_' + Date.now(),
      createdAt: new Date().toISOString(),
      workerA,
      workerB,
      dateA,
      origShiftA: curShiftA,
      newShiftA: 'LIBRE',
      dateB,
      origShiftB,
      newShiftB: 'LIBRE',
      status: 'active'
    };

    // Reemplazar si ya existía una permuta activa en esas fechas
    state.appliedSwaps = [newSwap, ...state.appliedSwaps.filter(s => 
      !(s.status === 'active' && 
        ((s.workerA === workerA && s.dateA === dateA) || 
         (s.workerA === workerA && s.dateB === dateB)))
    )];

    // Registrar también en la Bolsa de Turnos vinculada
    const linkedDebt = {
      id: 'debt_' + Date.now(),
      createdAt: new Date().toISOString(),
      workerA: workerA,
      workerB: workerB,
      direction: 'me_debe',
      dateOriginal: dateA,
      shiftOriginal: curShiftA,
      dateReturn: dateB,
      shiftReturn: origShiftB,
      notes: `Permuta aplicada en cuadrante con ${workerB}`,
      status: 'pending',
      settledDate: null,
      appliedToCalendar: true,
      swapId: newSwap.id
    };
    state.debts = [linkedDebt, ...state.debts];
    localStorage.setItem('cuadrante_turn_debts', JSON.stringify(state.debts));

    rebuildOverridesFromSwaps();
    updateAppView();

    showToast(`✓ Permuta guardada permanentemente en tu calendario con ${workerB}`);
  }

  function resetSimulation() {
    resetAllSwaps();
  }

  // ====================================================================
  // MEJORA 1: BOLSA DE TURNOS & HISTORIAL DE DEUDAS
  // ====================================================================

  function saveDebts(debts) {
    state.debts = debts;
    localStorage.setItem('cuadrante_turn_debts', JSON.stringify(debts));
    renderBankView();
  }

  function switchSwapsMode(mode) {
    state.swapsMode = mode;
    if (el.modeAssistantBtn) el.modeAssistantBtn.classList.toggle('active', mode === 'assistant');
    if (el.modeBankBtn) el.modeBankBtn.classList.toggle('active', mode === 'bank');
    
    if (el.swapsAssistantView) el.swapsAssistantView.style.display = (mode === 'assistant') ? 'block' : 'none';
    if (el.swapsBankView) el.swapsBankView.style.display = (mode === 'bank') ? 'block' : 'none';

    if (mode === 'bank') {
      renderBankView();
    } else {
      updatePermutasWorkflow();
    }
  }

  function getWorkerDebts(workerName) {
    return state.debts.map(d => {
      let isRelevant = false;
      let otherWorker = '';
      let theyOweMe = false;

      if (d.workerA === workerName) {
        isRelevant = true;
        otherWorker = d.workerB;
        theyOweMe = (d.direction === 'me_debe');
      } else if (d.workerB === workerName) {
        isRelevant = true;
        otherWorker = d.workerA;
        theyOweMe = (d.direction === 'le_debo');
      }

      if (!isRelevant) return null;

      return {
        ...d,
        otherWorker,
        theyOweMe
      };
    }).filter(Boolean);
  }

  function renderBankView() {
    if (!el.swapsBankView) return;

    if (el.bankCurrentWorkerDisplay) {
      el.bankCurrentWorkerDisplay.textContent = state.currentWorker;
    }

    const workerDebts = getWorkerDebts(state.currentWorker);
    const pendingDebts = workerDebts.filter(d => d.status === 'pending');
    const settledDebts = workerDebts.filter(d => d.status === 'settled');

    const receivePending = pendingDebts.filter(d => d.theyOweMe).length;
    const givePending = pendingDebts.filter(d => !d.theyOweMe).length;
    const balance = receivePending - givePending;

    // Actualizar KPIs
    if (el.bankKpiReceiveCount) el.bankKpiReceiveCount.textContent = `${receivePending} ${receivePending === 1 ? 'turno' : 'turnos'}`;
    if (el.bankKpiGiveCount) el.bankKpiGiveCount.textContent = `${givePending} ${givePending === 1 ? 'turno' : 'turnos'}`;
    
    if (el.bankKpiBalance) {
      if (balance > 0) {
        el.bankKpiBalance.textContent = `+${balance} a favor`;
        el.bankKpiBalance.style.color = '#10b981';
      } else if (balance < 0) {
        el.bankKpiBalance.textContent = `${balance} en contra`;
        el.bankKpiBalance.style.color = '#f59e0b';
      } else {
        el.bankKpiBalance.textContent = 'Al día (0)';
        el.bankKpiBalance.style.color = '#38bdf8';
      }
    }

    // Contadores en filtros y pastilla
    if (el.filterCountPending) el.filterCountPending.textContent = pendingDebts.length;
    if (el.filterCountSettled) el.filterCountSettled.textContent = settledDebts.length;
    if (el.filterCountAll) el.filterCountAll.textContent = workerDebts.length;

    if (el.bankPendingCountPill) {
      if (pendingDebts.length > 0) {
        el.bankPendingCountPill.style.display = 'inline-block';
        el.bankPendingCountPill.textContent = pendingDebts.length;
      } else {
        el.bankPendingCountPill.style.display = 'none';
      }
    }

    // Filtrar lista
    let filtered = workerDebts;
    if (state.bankFilter === 'pending') {
      filtered = pendingDebts;
    } else if (state.bankFilter === 'settled') {
      filtered = settledDebts;
    }

    // Renderizar lista
    if (!el.bankDebtsList) return;
    el.bankDebtsList.innerHTML = '';

    if (filtered.length === 0) {
      let emptyMsg = 'No tienes turnos registrados en la Bolsa.';
      if (state.bankFilter === 'pending') {
        emptyMsg = `¡Enhorabuena! No tienes ningún turno pendiente de cobro ni de devolución con tus compañeros.`;
      } else if (state.bankFilter === 'settled') {
        emptyMsg = 'Aún no tienes turnos marcados como saldados.';
      }

      el.bankDebtsList.innerHTML = `
        <div class="bank-empty-state">
          <div class="empty-icon">🤝</div>
          <div style="font-weight:700; font-size:1.05rem; color:var(--text-primary); margin-bottom:4px;">
            ${state.bankFilter === 'pending' ? 'Todo al día' : 'Bolsa vacía'}
          </div>
          <div style="font-size:0.85rem; max-width:400px; margin:0 auto 16px auto;">
            ${emptyMsg}
          </div>
          <button class="btn-primary" id="btnEmptyStateAdd" style="font-size:0.8rem; padding:7px 16px;">
            ➕ Apuntar un turno ahora
          </button>
        </div>
      `;
      const btnEmpty = el.bankDebtsList.querySelector('#btnEmptyStateAdd');
      if (btnEmpty) btnEmpty.addEventListener('click', openManualDebtModal);
      return;
    }

    filtered.forEach(debt => {
      const card = document.createElement('div');
      card.className = `debt-item-card ${debt.theyOweMe ? 'type-receive' : 'type-give'} ${debt.status === 'settled' ? 'status-settled' : ''}`;

      const otherInitials = debt.otherWorker.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
      const origInfo = getShiftDisplayInfo(debt.shiftOriginal || 'M');

      let badgeHtml = '';
      if (debt.status === 'settled') {
        badgeHtml = `<span class="debt-badge-pill gray">✓ Saldado</span>`;
      } else if (debt.theyOweMe) {
        badgeHtml = `<span class="debt-badge-pill green">🟢 Te debe 1 turno</span>`;
      } else {
        badgeHtml = `<span class="debt-badge-pill orange">🟠 Le debes 1 turno</span>`;
      }

      card.innerHTML = `
        <div class="debt-card-header">
          <div class="debt-worker-info">
            <div class="debt-avatar">${otherInitials}</div>
            <div>
              <div style="font-weight:700; font-size:1rem; color:var(--text-primary);">${debt.otherWorker}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">
                ${debt.theyOweMe ? 'Tiene un compromiso pendiente contigo' : 'Tienes un compromiso pendiente con él/ella'}
              </div>
            </div>
          <div>
            ${debt.appliedToCalendar ? `<span class="debt-badge-pill" style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); margin-right:6px;">🔀 En tu calendario</span>` : ''}
            ${badgeHtml}
          </div>
        </div>

        <div class="debt-details-flow">
          <div class="debt-flow-col">
            <div class="debt-flow-label">Turno Implicado:</div>
            <div class="debt-flow-val">
              <span class="timeline-shift-pill shift-${window.CuadranteValidator.getBaseShift(debt.shiftOriginal || 'M')}" style="padding:2px 8px; font-size:0.75rem;">
                ${debt.shiftOriginal || 'M'} (${origInfo.name})
              </span>
              <span>${formatDateSpanish(debt.dateOriginal)}</span>
            </div>
          </div>
          <div class="debt-flow-col">
            <div class="debt-flow-label">Devolución / Compensación:</div>
            <div class="debt-flow-val">
              ${debt.dateReturn ? `
                <span class="timeline-shift-pill shift-${window.CuadranteValidator.getBaseShift(debt.shiftReturn || 'M')}" style="padding:2px 8px; font-size:0.75rem;">
                  ${debt.shiftReturn || 'M'}
                </span>
                <span>${formatDateSpanish(debt.dateReturn)}</span>
              ` : `
                <span style="color:var(--text-muted); font-size:0.85rem; font-style:italic;">⏳ Pendiente de acordar fecha</span>
              `}
            </div>
          </div>
        </div>

        ${debt.notes ? `
          <div style="font-size:0.8rem; color:var(--text-secondary); background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
            💬 <em>"${debt.notes}"</em>
          </div>
        ` : ''}

        <div class="debt-card-actions">
          <button class="btn-share-debt-whatsapp" data-id="${debt.id}" title="Compartir acuerdo por WhatsApp">📲 WhatsApp</button>
          <button class="btn-print-debt-volante" data-id="${debt.id}" title="Generar Volante Oficial para RRHH">📄 Volante RRHH</button>
          ${debt.appliedToCalendar && debt.swapId ? `
            <button class="btn-revert-from-bank" data-swap-id="${debt.swapId}" style="padding:6px 12px; font-size:0.8rem; font-weight:600; border-radius:var(--radius-md); cursor:pointer; background:rgba(244,63,94,0.12); color:#f43f5e; border:1px solid rgba(244,63,94,0.3);" title="Revertir y quitar del calendario">↩️ Quitar de Calendario</button>
          ` : ''}
          ${debt.status === 'pending' ? `
            <button class="btn-settle" data-id="${debt.id}">✓ Saldar</button>
          ` : `
            <button class="btn-reopen" data-id="${debt.id}">↩️ Reabrir</button>
          `}
          <button class="btn-delete-debt" data-id="${debt.id}" title="Eliminar registro">🗑️</button>
        </div>
      `;

      // Event listeners en la tarjeta
      const shareWaBtn = card.querySelector('.btn-share-debt-whatsapp');
      if (shareWaBtn) {
        shareWaBtn.addEventListener('click', () => shareDebtViaWhatsapp(debt));
      }
      const printVolanteBtn = card.querySelector('.btn-print-debt-volante');
      if (printVolanteBtn) {
        printVolanteBtn.addEventListener('click', () => openRrhhVolanteModal(debt));
      }
      const revertBankBtn = card.querySelector('.btn-revert-from-bank');
      if (revertBankBtn) {
        revertBankBtn.addEventListener('click', () => {
          if (confirm('¿Deseas cancelar esta permuta y restablecer los turnos oficiales en tu calendario?')) {
            cancelSingleSwap(debt.swapId);
          }
        });
      }
      const settleBtn = card.querySelector('.btn-settle');
      if (settleBtn) {
        settleBtn.addEventListener('click', () => toggleDebtStatus(debt.id, 'settled'));
      }
      const reopenBtn = card.querySelector('.btn-reopen');
      if (reopenBtn) {
        reopenBtn.addEventListener('click', () => toggleDebtStatus(debt.id, 'pending'));
      }
      const deleteBtn = card.querySelector('.btn-delete-debt');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteDebt(debt.id));
      }

      el.bankDebtsList.appendChild(card);
    });
  }

  function toggleDebtStatus(id, newStatus) {
    const debts = state.debts.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: newStatus,
          settledDate: (newStatus === 'settled') ? new Date().toISOString() : null
        };
      }
      return d;
    });
    saveDebts(debts);
    showToast(newStatus === 'settled' ? '✓ Turno marcado como saldado' : '↩️ Compromiso reabierto como pendiente');
  }

  function deleteDebt(id) {
    if (!confirm('¿Deseas eliminar este registro de tu Bolsa de Turnos?')) return;
    const debts = state.debts.filter(d => d.id !== id);
    saveDebts(debts);
    showToast('🗑️ Registro eliminado de la Bolsa');
  }

  function saveCurrentPermutaToBank() {
    const workerA = state.currentWorker;
    const dateA = el.swapDateA.value;
    const workerB = state.selectedWorkerB;
    const dateB = state.selectedDateB;

    if (!workerA || !workerB || !dateA) {
      showToast('⚠️ No hay ningún acuerdo seleccionado para guardar.');
      return;
    }

    const curShiftA = getEffectiveShift(workerA, dateA);
    const origShiftB = dateB ? getEffectiveShift(workerB, dateB) : null;

    const newDebt = {
      id: 'debt_' + Date.now(),
      createdAt: new Date().toISOString(),
      workerA: workerA,
      workerB: workerB,
      direction: 'le_debo', // workerB cubre a workerA en dateA -> workerA le debe
      dateOriginal: dateA,
      shiftOriginal: curShiftA,
      dateReturn: dateB || null,
      shiftReturn: origShiftB || null,
      notes: dateB ? `Permuta completa: te cubre el ${dateA} y devuelves el ${dateB}` : `Te cubre el ${dateA} (pendiente de devolución)`,
      status: 'pending',
      settledDate: null
    };

    const debts = [newDebt, ...state.debts];
    saveDebts(debts);
    showToast(`🤝 Acuerdo con ${workerB} guardado en tu Bolsa`);
    switchSwapsMode('bank');
  }

  function openManualDebtModal() {
    if (!el.manualDebtModal) return;
    
    // Poblar selector de compañeros
    if (el.debtOtherWorker) {
      el.debtOtherWorker.innerHTML = '';
      DATA.workers.forEach(w => {
        if (w !== state.currentWorker) {
          const opt = document.createElement('option');
          opt.value = w;
          opt.textContent = w;
          el.debtOtherWorker.appendChild(opt);
        }
      });
    }

    if (el.debtDateOriginal) el.debtDateOriginal.value = '2027-02-01';
    if (el.debtDateReturn) el.debtDateReturn.value = '';
    if (el.debtNotes) el.debtNotes.value = '';

    el.manualDebtModal.style.display = 'flex';
  }

  function closeManualDebtModal() {
    if (el.manualDebtModal) el.manualDebtModal.style.display = 'none';
  }

  function handleManualDebtSubmit(e) {
    e.preventDefault();
    const otherWorker = el.debtOtherWorker.value;
    if (!otherWorker) return;

    const directionEl = document.querySelector('input[name="debtDirection"]:checked');
    const direction = directionEl ? directionEl.value : 'me_debe';

    const newDebt = {
      id: 'debt_' + Date.now(),
      createdAt: new Date().toISOString(),
      workerA: state.currentWorker,
      workerB: otherWorker,
      direction: direction,
      dateOriginal: el.debtDateOriginal.value,
      shiftOriginal: el.debtShiftOriginal.value,
      dateReturn: el.debtDateReturn.value || null,
      shiftReturn: el.debtShiftReturn.value || null,
      notes: el.debtNotes.value.trim(),
      status: 'pending',
      settledDate: null
    };

    const debts = [newDebt, ...state.debts];
    saveDebts(debts);
    closeManualDebtModal();
    showToast('✅ Deuda de turno registrada en tu Bolsa');
  }

  // ====================================================================
  // MEJORA 2: COMPARTIR POR WHATSAPP Y VOLANTE OFICIAL RRHH
  // ====================================================================

  function getWorkerFullName(shortName) {
    if (!shortName) return '';
    const meta = (DATA.workersMeta || []).find(w => w.name === shortName);
    if (meta && meta.fullName) return meta.fullName;
    const map = {
      'Antonio J': 'Antonio Jesús Sánchez',
      'Santi M': 'Santiago Molina',
      'Alberto H': 'Alberto Higueras',
      'Fran Espin': 'Francisco Espín',
      'Miguel B': 'Miguel Benitez',
      'Paco C': 'Francisco Cantarero',
      'A. Leon': 'Antonio León',
      'Hilario': 'Hilario Gomez',
      'Extra 1': 'Personal de Refuerzo'
    };
    return map[shortName] || shortName;
  }

  function formatDateSpanishWithYear(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dt = new Date(`${dateStr}T12:00:00`);
    const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${WEEKDAYS[dt.getDay()]}, ${d} de ${MONTH_NAMES[m - 1]} de ${y}`;
  }

  function formatShiftDesc(shiftCode) {
    if (!shiftCode || shiftCode.trim() === '') return 'Descanso';
    const base = window.CuadranteValidator.getBaseShift(shiftCode);
    const isHoliday = shiftCode.includes('.');
    let name = 'Mañana';
    let hours = '07:00 a 15:00';
    if (base === 'T') {
      name = 'Tarde';
      hours = '15:00 a 23:00';
    } else if (base === 'N') {
      name = 'Noche';
      hours = '23:00 a 07:00';
    }
    return `${name}${isHoliday ? ' (Festivo)' : ''} [${hours}]`;
  }

  function shareCurrentPermutaViaWhatsapp() {
    const workerA = state.currentWorker;
    const workerB = state.selectedWorkerB;
    const dateA = el.swapDateA ? el.swapDateA.value : null;
    const dateB = state.selectedDateB;

    if (!workerA || !workerB || !dateA || !dateB) {
      showToast('⚠️ Completa primero los 4 pasos de la permuta.');
      return;
    }

    const curShiftA = getEffectiveShift(workerA, dateA);
    const origShiftB = getEffectiveShift(workerB, dateB);

    const nameA = getWorkerFullName(workerA);
    const nameB = getWorkerFullName(workerB);
    const textDateA = formatDateSpanishWithYear(dateA);
    const textDateB = formatDateSpanishWithYear(dateB);

    const text = 
`🤝 *ACUERDO DE PERMUTA · CUADRANTE 2027*
📍 *Centro de Trabajo:* Andújar
👥 *Acuerdo entre:* ${nameA} ⇄ ${nameB}

📅 *1. DÍA DE LIBRANZA (Jornada A):*
• *Fecha:* ${textDateA}
• *Turno cedido:* ${formatShiftDesc(curShiftA)}
• *Asume el servicio:* ${nameB}
• *Situación de ${nameA}:* LIBRE / DESCANSO

📅 *2. DÍA DE DEVOLUCIÓN (Jornada B):*
• *Fecha:* ${textDateB}
• *Turno devuelto:* ${formatShiftDesc(origShiftB)}
• *Asume el servicio:* ${nameA}
• *Situación de ${nameB}:* LIBRE / DESCANSO

✅ *AUDITORÍA LABORAL:* Conforme con la normativa laboral y descansos.
📋 _Generado desde la App Cuadrante 2027 Andújar_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function shareDebtViaWhatsapp(debt) {
    if (!debt) return;
    const workerA = debt.workerA;
    const workerB = debt.workerB;
    const nameA = getWorkerFullName(workerA);
    const nameB = getWorkerFullName(workerB);

    const textDateA = formatDateSpanishWithYear(debt.dateOriginal);
    const textDateB = debt.dateReturn ? formatDateSpanishWithYear(debt.dateReturn) : 'Pendiente de acordar';

    const text = 
`🤝 *REGISTRO DE TURNO / PERMUTA · CUADRANTE 2027*
📍 *Centro de Trabajo:* Andújar
👥 *Trabajadores:* ${nameA} y ${nameB}

📋 *Detalle del Servicio:*
• *Turno:* ${formatShiftDesc(debt.shiftOriginal || 'M')}
• *Fecha:* ${textDateA}
• *Compromiso:* ${debt.theyOweMe ? `${nameB} tiene turno pendiente contigo` : `Tienes turno pendiente con ${nameB}`}
• *Devolución acordada:* ${textDateB}${debt.shiftReturn ? ` (${formatShiftDesc(debt.shiftReturn)})` : ''}
${debt.notes ? `• *Notas:* ${debt.notes}\n` : ''}
📋 _Bolsa de Turnos · Cuadrante 2027 Andújar_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function openRrhhVolanteModal(data) {
    let workerA, workerB, dateA, dateB, shiftA, shiftB;

    if (data) {
      workerA = data.workerA;
      workerB = data.workerB;
      dateA = data.dateOriginal;
      shiftA = data.shiftOriginal || 'M';
      dateB = data.dateReturn;
      shiftB = data.shiftReturn || 'M';
    } else {
      workerA = state.currentWorker;
      workerB = state.selectedWorkerB;
      dateA = el.swapDateA ? el.swapDateA.value : null;
      dateB = state.selectedDateB;

      if (!workerA || !workerB || !dateA || !dateB) {
        showToast('⚠️ Completa primero los 4 pasos de la permuta en el asistente.');
        return;
      }
      shiftA = getEffectiveShift(workerA, dateA);
      shiftB = getEffectiveShift(workerB, dateB);
    }

    const nameA = getWorkerFullName(workerA);
    const nameB = getWorkerFullName(workerB);

    // Código de referencia formal
    const cleanDateA = (dateA || '').replace(/-/g, '').slice(2);
    const randomCode = Math.floor(100 + Math.random() * 900);
    if (el.vRefCode) el.vRefCode.textContent = `PERM-2027-${cleanDateA || '00'}-${randomCode}`;

    // Fecha de emisión oficial
    const now = new Date();
    const dStr = String(now.getDate()).padStart(2, '0');
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const yStr = now.getFullYear();
    if (el.vEmissionDate) el.vEmissionDate.textContent = `${dStr}/${mStr}/${yStr}`;

    // Nombres oficiales completos
    if (el.vWorker1Name) el.vWorker1Name.textContent = nameA;
    if (el.vWorker2Name) el.vWorker2Name.textContent = nameB;

    // Jornada A
    if (el.vDateA) el.vDateA.textContent = formatDateSpanishWithYear(dateA);
    if (el.vShiftA) el.vShiftA.textContent = formatShiftDesc(shiftA);
    if (el.vWorkerAssumesA) el.vWorkerAssumesA.textContent = nameB;

    // Jornada B
    if (el.vDateB) el.vDateB.textContent = dateB ? formatDateSpanishWithYear(dateB) : 'Pendiente de acordar por las partes';
    if (el.vShiftB) el.vShiftB.textContent = dateB ? formatShiftDesc(shiftB) : 'A convenir con Jefatura / RRHH';
    if (el.vWorkerAssumesB) el.vWorkerAssumesB.textContent = nameA;

    // Firmas
    if (el.vSigWorker1) el.vSigWorker1.textContent = `D. ${nameA}`;
    if (el.vSigWorker2) el.vSigWorker2.textContent = `D. ${nameB}`;

    if (el.rrhhVolanteModal) {
      el.rrhhVolanteModal.style.display = 'flex';
    }
  }

  function closeRrhhVolanteModal() {
    if (el.rrhhVolanteModal) {
      el.rrhhVolanteModal.style.display = 'none';
    }
  }

  function printRrhhVolante() {
    window.print();
  }

  // ====================================================================
  // GESTIÓN Y PERSISTENCIA DE PERMUTAS ACTIVAS (OPCIÓN A)
  // ====================================================================

  function rebuildOverridesFromSwaps() {
    state.simulatedOverrides = {};
    (state.appliedSwaps || []).forEach(swap => {
      if (swap.status !== 'active') return;
      if (!state.simulatedOverrides[swap.workerA]) state.simulatedOverrides[swap.workerA] = {};
      if (!state.simulatedOverrides[swap.workerB]) state.simulatedOverrides[swap.workerB] = {};

      // workerA libra en dateA, trabaja origShiftB en dateB
      state.simulatedOverrides[swap.workerA][swap.dateA] = ' ';
      state.simulatedOverrides[swap.workerA][swap.dateB] = swap.origShiftB;

      // workerB trabaja origShiftA en dateA, libra en dateB
      state.simulatedOverrides[swap.workerB][swap.dateA] = swap.origShiftA;
      state.simulatedOverrides[swap.workerB][swap.dateB] = ' ';
    });
    localStorage.setItem('cuadrante_applied_swaps', JSON.stringify(state.appliedSwaps));
    localStorage.setItem('cuadrante_simulated_overrides', JSON.stringify(state.simulatedOverrides));
  }

  function getWorkerActiveSwaps(workerName) {
    return (state.appliedSwaps || []).filter(s => 
      s.status === 'active' && (s.workerA === workerName || s.workerB === workerName)
    );
  }

  function getSwapForDate(workerName, dateStr) {
    return (state.appliedSwaps || []).find(s => 
      s.status === 'active' && 
      ((s.workerA === workerName && (s.dateA === dateStr || s.dateB === dateStr)) ||
       (s.workerB === workerName && (s.dateA === dateStr || s.dateB === dateStr)))
    );
  }

  function renderActiveSwapsBanner() {
    if (!el.calendarActiveSwapsBanner) return;
    const workerSwaps = getWorkerActiveSwaps(state.currentWorker);
    if (workerSwaps.length > 0) {
      el.calendarActiveSwapsBanner.style.display = 'flex';
      if (el.calendarActiveSwapsTitle) {
        el.calendarActiveSwapsTitle.textContent = `${workerSwaps.length} ${workerSwaps.length === 1 ? 'permuta activa' : 'permutas activas'} en tu cuadrante`;
      }
      if (el.calendarActiveSwapsSub) {
        el.calendarActiveSwapsSub.textContent = `Tus turnos se muestran actualizados según los cambios acordados con tus compañeros.`;
      }
      if (el.activeSimulationsNotice) el.activeSimulationsNotice.style.display = 'block';
      if (el.resetSimulationBtn) el.resetSimulationBtn.style.display = 'inline-flex';
    } else {
      el.calendarActiveSwapsBanner.style.display = 'none';
      if (el.activeSimulationsNotice) el.activeSimulationsNotice.style.display = 'none';
      if (el.resetSimulationBtn) el.resetSimulationBtn.style.display = 'none';
    }
  }

  function openActiveSwapsListModal() {
    renderActiveSwapsModalList();
    if (el.activeSwapsListModal) {
      el.activeSwapsListModal.style.display = 'flex';
    }
  }

  function closeActiveSwapsListModal() {
    if (el.activeSwapsListModal) {
      el.activeSwapsListModal.style.display = 'none';
    }
  }

  function renderActiveSwapsModalList() {
    if (!el.activeSwapsModalList) return;
    const workerSwaps = getWorkerActiveSwaps(state.currentWorker);
    el.activeSwapsModalList.innerHTML = '';

    if (workerSwaps.length === 0) {
      el.activeSwapsModalList.innerHTML = `
        <div style="text-align:center; padding:24px 16px; color:var(--text-muted);">
          <div style="font-size:2rem; margin-bottom:8px;">✓</div>
          <div style="font-weight:700; color:var(--text-primary); font-size:1rem;">No tienes ninguna permuta activa</div>
          <div style="font-size:0.8rem; margin-top:4px;">Tu calendario coincide al 100% con el cuadrante oficial de Andújar.</div>
        </div>
      `;
      if (el.modalResetAllSwapsBtn) el.modalResetAllSwapsBtn.style.display = 'none';
      return;
    }

    if (el.modalResetAllSwapsBtn) el.modalResetAllSwapsBtn.style.display = 'inline-flex';

    workerSwaps.forEach(swap => {
      const otherWorker = swap.workerA === state.currentWorker ? swap.workerB : swap.workerA;
      const otherFullName = getWorkerFullName(otherWorker);
      const textDateA = formatDateSpanishWithYear(swap.dateA);
      const textDateB = formatDateSpanishWithYear(swap.dateB);

      const card = document.createElement('div');
      card.className = 'swap-active-item-card';
      card.innerHTML = `
        <div class="swap-active-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">🔀</span>
            <div>
              <div style="font-weight:800; font-size:0.95rem; color:var(--text-primary);">${otherFullName}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">Acuerdo de permuta mutua</div>
            </div>
          </div>
          <span style="background:rgba(56,189,248,0.2); color:#38bdf8; font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:4px; border:1px solid rgba(56,189,248,0.4);">
            Activa en Calendario
          </span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:rgba(0,0,0,0.2); padding:10px; border-radius:var(--radius-sm); font-size:0.8rem;">
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Jornada A (Cesión):</div>
            <div style="font-weight:700; margin:2px 0;">${textDateA}</div>
            <div style="color:#10b981;">${swap.workerA === state.currentWorker ? `Tú quedas: LIBRE (${otherWorker} te cubre)` : `${swap.workerA} queda LIBRE (tú cubres)`}</div>
          </div>
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Jornada B (Devolución):</div>
            <div style="font-weight:700; margin:2px 0;">${textDateB}</div>
            <div style="color:#38bdf8;">${swap.workerA === state.currentWorker ? `Tú cubres turno (${otherWorker} libra)` : `Tú libras (${swap.workerA} te cubre)`}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-top:4px;">
          <button type="button" class="btn-secondary btn-swap-item-wa" style="font-size:0.75rem; padding:5px 10px; color:#25D366; border-color:rgba(37,211,102,0.3);">
            📲 WhatsApp
          </button>
          <button type="button" class="btn-secondary btn-swap-item-pdf" style="font-size:0.75rem; padding:5px 10px; color:#cbd5e1; border-color:#475569;">
            📄 Volante RRHH
          </button>
          <button type="button" class="btn-secondary btn-swap-item-revert" style="font-size:0.75rem; padding:5px 10px; color:#f43f5e; border-color:rgba(244,63,94,0.4); background:rgba(244,63,94,0.08);">
            ↩️ Cancelar permuta
          </button>
        </div>
      `;

      card.querySelector('.btn-swap-item-wa').addEventListener('click', () => {
        shareDebtViaWhatsapp({
          workerA: swap.workerA,
          workerB: swap.workerB,
          dateOriginal: swap.dateA,
          shiftOriginal: swap.origShiftA,
          dateReturn: swap.dateB,
          shiftReturn: swap.origShiftB
        });
      });

      card.querySelector('.btn-swap-item-pdf').addEventListener('click', () => {
        openRrhhVolanteModal({
          workerA: swap.workerA,
          workerB: swap.workerB,
          dateOriginal: swap.dateA,
          shiftOriginal: swap.origShiftA,
          dateReturn: swap.dateB,
          shiftReturn: swap.origShiftB
        });
      });

      card.querySelector('.btn-swap-item-revert').addEventListener('click', () => {
        if (confirm(`¿Deseas cancelar esta permuta con ${otherFullName} y restablecer los turnos originales de ambas fechas en tu calendario?`)) {
          cancelSingleSwap(swap.id);
        }
      });

      el.activeSwapsModalList.appendChild(card);
    });
  }

  function cancelSingleSwap(swapId) {
    const swap = state.appliedSwaps.find(s => s.id === swapId);
    if (!swap) return;

    state.appliedSwaps = state.appliedSwaps.filter(s => s.id !== swapId);
    
    // Si hay una deuda enlazada en la Bolsa de Turnos, desmarcar appliedToCalendar
    state.debts = state.debts.map(d => {
      if (d.swapId === swapId) {
        return { ...d, appliedToCalendar: false };
      }
      return d;
    });
    localStorage.setItem('cuadrante_turn_debts', JSON.stringify(state.debts));

    rebuildOverridesFromSwaps();
    updateAppView();
    renderActiveSwapsModalList();
    showToast('↩️ Permuta cancelada. Turnos originales restablecidos.');
  }

  function resetAllSwaps() {
    const count = getWorkerActiveSwaps(state.currentWorker).length;
    if (count === 0) {
      showToast('No tienes permutas activas que restablecer.');
      return;
    }
    const confirmed = confirm(`¿Seguro que deseas restablecer tu cuadrante al calendario oficial?\nSe cancelarán las ${count} permutas activas de ${state.currentWorker}.`);
    if (!confirmed) return;

    // Eliminar permutas de este trabajador
    state.appliedSwaps = state.appliedSwaps.filter(s => s.workerA !== state.currentWorker && s.workerB !== state.currentWorker);

    // Desmarcar en la Bolsa
    state.debts = state.debts.map(d => {
      if (d.workerA === state.currentWorker || d.workerB === state.currentWorker) {
        return { ...d, appliedToCalendar: false };
      }
      return d;
    });
    localStorage.setItem('cuadrante_turn_debts', JSON.stringify(state.debts));

    rebuildOverridesFromSwaps();
    closeActiveSwapsListModal();
    updateAppView();

    showToast('✓ Cuadrante restablecido al calendario oficial.');
  }

  window.CuadranteApp = {
    openManualDebtModal,
    openRrhhVolanteModal,
    closeRrhhVolanteModal,
    shareCurrentPermutaViaWhatsapp,
    shareDebtViaWhatsapp,
    getWorkerFullName,
    openActiveSwapsListModal,
    closeActiveSwapsListModal,
    cancelSingleSwap,
    resetAllSwaps
  };

// --- TAB 4: ESTADÍSTICAS DE JORNADA ---
  function renderStatistics() {
    const meta = DATA.workersMeta.find(w => w.name === state.currentWorker);
    const goal = meta ? meta.annualGoal : 220;

    let totalWorked = 0;
    let mCount = 0;
    let tCount = 0;
    let nCount = 0;
    let holCount = 0;
    let weekendsWorked = 0;
    let weekendsFree = 0;

    DATA.dates.forEach((dStr, idx) => {
      const shift = getEffectiveShift(state.currentWorker, dStr);
      const base = window.CuadranteValidator.getBaseShift(shift);

      if (base !== 'L') {
        totalWorked++;
        if (base === 'M') mCount++;
        if (base === 'T') tCount++;
        if (base === 'N') nCount++;
        if (shift.includes('.')) holCount++;
      }

      const dt = new Date(dStr + 'T12:00:00');
      if (dt.getDay() === 6) {
        const nextDStr = DATA.dates[idx + 1];
        if (nextDStr) {
          const shiftNext = getEffectiveShift(state.currentWorker, nextDStr);
          const baseNext = window.CuadranteValidator.getBaseShift(shiftNext);
          if (base !== 'L' && baseNext !== 'L') {
            weekendsWorked++;
          } else if (base === 'L' && baseNext === 'L') {
            weekendsFree++;
          }
        }
      }
    });

    el.statWorkedDays.textContent = totalWorked;
    el.statGoalText.textContent = `de ${goal} días anuales`;
    const pct = Math.min(100, Math.round((totalWorked / goal) * 100));
    el.statProgressBar.style.width = `${pct}%`;

    el.statMornings.textContent = mCount;
    el.statAfternoons.textContent = tCount;
    el.statNights.textContent = nCount;
    el.statHolidays.textContent = holCount;
    el.statWeekendsWorked.textContent = weekendsWorked;
    el.statWeekendsFree.textContent = weekendsFree;
    el.statVacDays.textContent = meta && meta.type === 'extra' ? '0' : '30';

    renderEquityTable();
  }

  function renderEquityTable() {
    let html = '';
    DATA.workers.forEach(w => {
      let tot = 0, m = 0, t = 0, n = 0, hol = 0, wkWk = 0;

      DATA.dates.forEach((dStr, idx) => {
        const s = getEffectiveShift(w, dStr);
        const b = window.CuadranteValidator.getBaseShift(s);
        if (b !== 'L') {
          tot++;
          if (b === 'M') m++;
          if (b === 'T') t++;
          if (b === 'N') n++;
          if (s.includes('.')) hol++;
        }
        const dt = new Date(dStr + 'T12:00:00');
        if (dt.getDay() === 6 && DATA.dates[idx + 1]) {
          const sNext = getEffectiveShift(w, DATA.dates[idx + 1]);
          if (b !== 'L' && window.CuadranteValidator.getBaseShift(sNext) !== 'L') {
            wkWk++;
          }
        }
      });

      const isMe = (w === state.currentWorker);
      html += `
        <tr style="${isMe ? 'background:rgba(99,102,241,0.08); font-weight:700;' : ''}">
          <td style="text-align:left;">👤 ${w} ${isMe ? '⭐' : ''}</td>
          <td>${tot}</td>
          <td style="color:var(--shift-m);">${m}</td>
          <td style="color:var(--shift-t);">${t}</td>
          <td style="color:var(--shift-n);">${n}</td>
          <td style="color:var(--shift-fest);">${hol}</td>
          <td>${wkWk}</td>
        </tr>
      `;
    });
    el.equityTableBody.innerHTML = html;
  }

  // --- TAB 5: IMPORTADOR DE HOJA DE CÁLCULO EXCEL (.XLSX) ---
  function setupExcelImporter() {
    if (!el.excelFileInput || !el.excelDropzone) return;

    el.btnTriggerExcelUpload.addEventListener('click', () => {
      el.excelFileInput.click();
    });

    el.excelDropzone.addEventListener('click', () => {
      el.excelFileInput.click();
    });

    el.excelDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.excelDropzone.classList.add('dragover');
    });

    el.excelDropzone.addEventListener('dragleave', () => {
      el.excelDropzone.classList.remove('dragover');
    });

    el.excelDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      el.excelDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processExcelFile(e.dataTransfer.files[0]);
      }
    });

    el.excelFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processExcelFile(e.target.files[0]);
      }
    });

    if (el.btnResetToOriginalExcel) {
      el.btnResetToOriginalExcel.addEventListener('click', () => {
        DATA.matrix_dot = JSON.parse(JSON.stringify(ORIGINAL_MATRIX_DOT));
        localStorage.removeItem('cuadrante_custom_matrix');
        localStorage.removeItem('cuadrante_custom_matrix_name');
        checkCustomExcelState();
        updateAppView();
        showToast('Cuadrante restablecido al oficial de fábrica');
        if (el.excelImportStatus) {
          el.excelImportStatus.innerHTML = '<div class="excel-import-alert success">✓ Cuadrante original restablecido con éxito.</div>';
          el.excelImportStatus.style.display = 'block';
        }
      });
    }
  }

  /**
   * Lee y procesa un archivo Excel .xlsx oficial con SheetJS
   */
  function processExcelFile(file) {
    if (!file.name.endsWith('.xlsx')) {
      showExcelImportStatus('El archivo debe tener extensión .xlsx (libro oficial de Excel).', 'error');
      return;
    }

    if (typeof XLSX === 'undefined') {
      showExcelImportStatus('Error: La librería de lectura de Excel no está disponible.', 'error');
      return;
    }

    showExcelImportStatus(`Leyendo archivo "${file.name}"...`, 'success');

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length < 12) {
          showExcelImportStatus(`El libro debe contener al menos 12 hojas mensuales (encontradas: ${workbook.SheetNames.length}).`, 'error');
          return;
        }

        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const newMatrix = DATA.workers.map(() => []);

        // Procesar las 12 hojas
        for (let mIdx = 0; mIdx < 12; mIdx++) {
          const sName = workbook.SheetNames[mIdx];
          const ws = workbook.Sheets[sName];
          const numDays = daysInMonth[mIdx];

          if (!ws || !ws['!ref']) {
            throw new Error(`La hoja "${sName}" está vacía o dañada.`);
          }

          const range = XLSX.utils.decode_range(ws['!ref']);
          const workerRows = {};

          for (let r = range.s.r; r <= range.e.r; r++) {
            const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
            if (cell && cell.v) {
              const name = String(cell.v).trim();
              const match = DATA.workers.find(w => w.toLowerCase() === name.toLowerCase());
              if (match) workerRows[match] = r;
            }
          }

          // Localizar columna para día 1 en fila 2 (0-indexed 1)
          let day1Col = 1;
          for (let c = 0; c <= 5; c++) {
            const cell = ws[XLSX.utils.encode_cell({ r: 1, c })];
            if (cell && (cell.v === 1 || cell.v === '1')) {
              day1Col = c;
              break;
            }
          }

          DATA.workers.forEach((wName, wIdx) => {
            const r = workerRows[wName];
            for (let d = 1; d <= numDays; d++) {
              const c = day1Col + (d - 1);
              const cell = r !== undefined ? ws[XLSX.utils.encode_cell({ r, c })] : null;
              let val = cell && cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : ' ';
              if (!val) val = ' ';
              newMatrix[wIdx].push(val);
            }
          });
        }

        // Validar dimensiones resultantes (9 x 365)
        if (newMatrix.length !== 9 || newMatrix[0].length !== 365) {
          throw new Error(`Dimensiones inesperadas: ${newMatrix.length} trabajadores y ${newMatrix[0].length} días (esperado 9x365).`);
        }

        // Guardar y aplicar
        DATA.matrix_dot = newMatrix;
        localStorage.setItem('cuadrante_custom_matrix', JSON.stringify(newMatrix));
        localStorage.setItem('cuadrante_custom_matrix_name', file.name);

        checkCustomExcelState();
        updateAppView();

        showExcelImportStatus(`✓ Cuadrante importado con éxito desde "${file.name}" (365 días sincronizados para los 9 trabajadores).`, 'success');
        showToast('Cuadrante actualizado desde Excel con éxito');

      } catch (err) {
        console.error('Error importando Excel:', err);
        showExcelImportStatus(`Error al procesar el archivo Excel: ${err.message}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function showExcelImportStatus(msg, type) {
    if (!el.excelImportStatus) return;
    el.excelImportStatus.style.display = 'block';
    el.excelImportStatus.innerHTML = `<div class="excel-import-alert ${type}">${msg}</div>`;
  }

  // --- NOTIFICACIONES TOAST ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // --- SERVICE WORKER & PWA INSTALL ---
  let deferredPrompt;
  function initPwa() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (el.pwaInstallBtn) {
        el.pwaInstallBtn.style.display = 'inline-flex';
        el.pwaInstallBtn.addEventListener('click', () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(() => {
            el.pwaInstallBtn.style.display = 'none';
            deferredPrompt = null;
          });
        });
      }
    });
  }

  // Iniciar la app
  init();
});
