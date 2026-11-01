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
    selectedWorkerB: null, // Compañero que cubre en Paso 2 o con quien se cambia turno
    isShiftSwap: false, // true si es intercambio de turno directo en la misma jornada
    selectedWorkerBShift: null, // Turno original del compañero en cambio directo
    selectedDateB: null, // Día acordado de devolución en Paso 3 (o misma fecha en cambio directo)
    returnFilter: 'all', // 'all' | 'clean' | 'warning' | 'month' | 'weekend'
    modalDate: null,
    swapsMode: 'assistant', // 'assistant' | 'bank'
    bankFilter: 'pending', // 'pending' | 'settled' | 'all'
    debts: [],
    appliedSwaps: [], // Permutas activas aplicadas permanentemente
    // Mejora 3: Comparador de cuadrantes
    teamMode: 'matrix', // 'matrix' | 'compare'
    compareWorker1: localStorage.getItem('cuadrante_worker') || 'Antonio J',
    compareWorker2: 'Alberto H',
    compareMonth: 1,
    compareFilter: 'all', // 'all' | 'free' | 'weekend' | 'shift' | 'swap'
    // Festivos & Vacaciones
    holidaysVacationsMode: 'vacations', // 'vacations' | 'holidays'
    vacationsViewYear: '2027', // '2027' | '2028' | '2029' | 'history'
    selectedHolidayTimeline: 'NOCHES DEL 1 DE ENERO',
    holidayMatrixView: 'matrix' // 'matrix' | 'personal'
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
    quickCompareBtn: document.getElementById('quickCompareBtn'),

    // Tab 2: Equipo y Coberturas
    teamModeMatrixBtn: document.getElementById('teamModeMatrixBtn'),
    teamModeCompareBtn: document.getElementById('teamModeCompareBtn'),
    teamMatrixView: document.getElementById('teamMatrixView'),
    teamCompareView: document.getElementById('teamCompareView'),
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

    // Mejora 3: Comparador de Cuadrantes
    compareAvatar1: document.getElementById('compareAvatar1'),
    compareWorker1Select: document.getElementById('compareWorker1Select'),
    compareSwapWorkersBtn: document.getElementById('compareSwapWorkersBtn'),
    compareAvatar2: document.getElementById('compareAvatar2'),
    compareWorker2Select: document.getElementById('compareWorker2Select'),
    compareQuickPills: document.getElementById('compareQuickPills'),
    compareKpiFree: document.getElementById('compareKpiFree'),
    compareKpiWeekend: document.getElementById('compareKpiWeekend'),
    compareKpiShift: document.getElementById('compareKpiShift'),
    compareKpiSwap: document.getElementById('compareKpiSwap'),
    comparePrevMonthBtn: document.getElementById('comparePrevMonthBtn'),
    compareMonthTitle: document.getElementById('compareMonthTitle'),
    compareNextMonthBtn: document.getElementById('compareNextMonthBtn'),
    compareCalendarGrid: document.getElementById('compareCalendarGrid'),
    compareAgendaList: document.getElementById('compareAgendaList'),
    compareAgendaSubtitle: document.getElementById('compareAgendaSubtitle'),
    btnShareComparisonWhatsapp: document.getElementById('btnShareComparisonWhatsapp'),
    btnShareWhatsappWorkerName: document.getElementById('btnShareWhatsappWorkerName'),

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
    toastContainer: document.getElementById('toastContainer'),

    // Tab Festivos & Vacaciones
    btnSubViewVacations: document.getElementById('btnSubViewVacations'),
    btnSubViewHolidays: document.getElementById('btnSubViewHolidays'),
    subViewVacationsContainer: document.getElementById('subViewVacationsContainer'),
    subViewHolidaysContainer: document.getElementById('subViewHolidaysContainer'),
    vacCurrentWorkerName: document.getElementById('vacCurrentWorkerName'),
    vacPartnerName: document.getElementById('vacPartnerName'),
    vac2027SlotName: document.getElementById('vac2027SlotName'),
    vac2027DatesText: document.getElementById('vac2027DatesText'),
    vac2028SlotName: document.getElementById('vac2028SlotName'),
    vac2028DatesText: document.getElementById('vac2028DatesText'),
    vacYearSelectorGroup: document.getElementById('vacYearSelectorGroup'),
    vacationQuincenasCards: document.getElementById('vacationQuincenasCards'),
    vacationHistoryTableWrapper: document.getElementById('vacationHistoryTableWrapper'),
    vacationHistoryTableBody: document.getElementById('vacationHistoryTableBody'),
    holidayEquityBarsList: document.getElementById('holidayEquityBarsList'),
    holidayMyWorkerTitle: document.getElementById('holidayMyWorkerTitle'),
    mySpecialFestList: document.getElementById('mySpecialFestList'),
    selectHolidayCategory: document.getElementById('selectHolidayCategory'),
    holidayTimelineContainer: document.getElementById('holidayTimelineContainer'),
    fixedHolidays2027List: document.getElementById('fixedHolidays2027List'),
    holidayMatrixTable: document.getElementById('holidayMatrixTable'),
    holidayMatrixContainer: document.getElementById('holidayMatrixContainer'),
    holidayPersonalListContainer: document.getElementById('holidayPersonalListContainer'),
    holidayPersonalAllList: document.getElementById('holidayPersonalAllList'),
    btnHolidayViewMatrix: document.getElementById('btnHolidayViewMatrix'),
    btnHolidayViewPersonal: document.getElementById('btnHolidayViewPersonal'),
    btnHolidayMyName: document.getElementById('btnHolidayMyName')
  };

  // --- INICIALIZACIÓN ---
  function init() {
    initTheme();
    checkCustomExcelState();
    populateWorkerSelect();
    populateMonthSelects();
    populateCompareWorkerSelects();
    renderCompareQuickPills();
    populateHolidayCategories();
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
      if (state.teamMode === 'matrix') {
        renderTeamDaily();
        renderMatrix();
      } else {
        renderCompareView();
      }
    } else if (tabId === 'tab-swaps') {
      if (state.swapsMode === 'assistant') {
        updatePermutasWorkflow();
      } else {
        renderBankView();
      }
    } else if (tabId === 'tab-holidays-vacations') {
      renderHolidaysVacations();
    } else if (tabId === 'tab-stats') {
      renderStatistics();
    }
  }

  function setupNavigation() {
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
      state.compareWorker1 = state.currentWorker;
      if (state.compareWorker1 === state.compareWorker2) {
        state.compareWorker2 = DATA.workers.find(w => w !== state.compareWorker1) || 'Alberto H';
      }
      updateWorkerAvatar();
      loadWorkerNotes();
      populateWorkerSelect();
      populateCompareWorkerSelects();
      renderCompareQuickPills();
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

    // Tab 1: Botón de acceso rápido al Comparador
    if (el.quickCompareBtn) {
      el.quickCompareBtn.addEventListener('click', () => {
        switchTab('tab-team');
        switchTeamMode('compare');
        if (el.teamCompareView) {
          el.teamCompareView.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

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

    // Tab 2: Selector de Sub-Modo (Matriz vs Comparador)
    if (el.teamModeMatrixBtn) {
      el.teamModeMatrixBtn.addEventListener('click', () => switchTeamMode('matrix'));
    }
    if (el.teamModeCompareBtn) {
      el.teamModeCompareBtn.addEventListener('click', () => switchTeamMode('compare'));
    }

    // Tab 2 (Comparador): Selectores de compañeros
    if (el.compareWorker1Select) {
      el.compareWorker1Select.addEventListener('change', (e) => {
        state.compareWorker1 = e.target.value;
        if (state.compareWorker1 === state.compareWorker2) {
          const alt = DATA.workers.find(w => w !== state.compareWorker1) || 'Alberto H';
          state.compareWorker2 = alt;
          if (el.compareWorker2Select) el.compareWorker2Select.value = alt;
        }
        updateCompareAvatars();
        renderCompareQuickPills();
        renderCompareView();
      });
    }

    if (el.compareWorker2Select) {
      el.compareWorker2Select.addEventListener('change', (e) => {
        state.compareWorker2 = e.target.value;
        if (state.compareWorker1 === state.compareWorker2) {
          const alt = DATA.workers.find(w => w !== state.compareWorker2) || 'Antonio J';
          state.compareWorker1 = alt;
          if (el.compareWorker1Select) el.compareWorker1Select.value = alt;
        }
        updateCompareAvatars();
        renderCompareQuickPills();
        renderCompareView();
      });
    }

    // Tab 2 (Comparador): Botón Swap de compañeros
    if (el.compareSwapWorkersBtn) {
      el.compareSwapWorkersBtn.addEventListener('click', () => {
        const temp = state.compareWorker1;
        state.compareWorker1 = state.compareWorker2;
        state.compareWorker2 = temp;
        if (el.compareWorker1Select) el.compareWorker1Select.value = state.compareWorker1;
        if (el.compareWorker2Select) el.compareWorker2Select.value = state.compareWorker2;
        updateCompareAvatars();
        renderCompareQuickPills();
        renderCompareView();
      });
    }

    // Tab 2 (Comparador): Navegación de meses
    if (el.comparePrevMonthBtn) {
      el.comparePrevMonthBtn.addEventListener('click', () => {
        state.compareMonth = state.compareMonth > 1 ? state.compareMonth - 1 : 12;
        renderCompareView();
      });
    }

    if (el.compareNextMonthBtn) {
      el.compareNextMonthBtn.addEventListener('click', () => {
        state.compareMonth = state.compareMonth < 12 ? state.compareMonth + 1 : 1;
        renderCompareView();
      });
    }

    // Tab 2 (Comparador): Filtros de vista mensual
    const compFilters = document.querySelectorAll('.compare-filter-pill');
    compFilters.forEach(pill => {
      pill.addEventListener('click', () => {
        compFilters.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.compareFilter = pill.getAttribute('data-filter') || 'all';
        renderCompareCalendar();
      });
    });

    // Tab 2 (Comparador): Compartir coincidencias por WhatsApp
    if (el.btnShareComparisonWhatsapp) {
      el.btnShareComparisonWhatsapp.addEventListener('click', shareComparisonViaWhatsapp);
    }

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

    // Tab Festivos & Vacaciones Event Listeners
    if (el.btnSubViewVacations) {
      el.btnSubViewVacations.addEventListener('click', () => {
        state.holidaysVacationsMode = 'vacations';
        el.btnSubViewVacations.classList.add('active');
        el.btnSubViewHolidays.classList.remove('active');
        renderHolidaysVacations();
      });
    }

    if (el.btnSubViewHolidays) {
      el.btnSubViewHolidays.addEventListener('click', () => {
        state.holidaysVacationsMode = 'holidays';
        el.btnSubViewHolidays.classList.add('active');
        el.btnSubViewVacations.classList.remove('active');
        renderHolidaysVacations();
      });
    }

    if (el.vacYearSelectorGroup) {
      el.vacYearSelectorGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.vac-pill-btn');
        if (!btn) return;
        const view = btn.getAttribute('data-vac-view');
        state.vacationsViewYear = view;
        el.vacYearSelectorGroup.querySelectorAll('.vac-pill-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        renderVacationsSubView();
      });
    }

    if (el.selectHolidayCategory) {
      el.selectHolidayCategory.addEventListener('change', (e) => {
        state.selectedHolidayTimeline = e.target.value;
        renderHolidayTimeline(state.selectedHolidayTimeline);
      });
    }

    if (el.btnHolidayViewMatrix) {
      el.btnHolidayViewMatrix.addEventListener('click', () => {
        state.holidayMatrixView = 'matrix';
        el.btnHolidayViewMatrix.classList.add('active');
        el.btnHolidayViewPersonal.classList.remove('active');
        if (el.holidayMatrixContainer) el.holidayMatrixContainer.style.display = 'block';
        if (el.holidayPersonalListContainer) el.holidayPersonalListContainer.style.display = 'none';
        renderHolidayMatrixTable();
      });
    }

    if (el.btnHolidayViewPersonal) {
      el.btnHolidayViewPersonal.addEventListener('click', () => {
        state.holidayMatrixView = 'personal';
        el.btnHolidayViewPersonal.classList.add('active');
        el.btnHolidayViewMatrix.classList.remove('active');
        if (el.holidayPersonalListContainer) el.holidayPersonalListContainer.style.display = 'block';
        if (el.holidayMatrixContainer) el.holidayMatrixContainer.style.display = 'none';
        renderHolidayPersonalList();
      });
    }
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
    renderCompareView();
    renderStatistics();
    renderBankView();
    renderHolidaysVacations();
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
      if (activeSwap.type === 'shift_exchange' || activeSwap.dateA === activeSwap.dateB) {
        const isWorkerA = (activeSwap.workerA === state.currentWorker);
        const myNewShift = isWorkerA ? (activeSwap.newShiftA || activeSwap.origShiftB) : (activeSwap.newShiftB || activeSwap.origShiftA);
        const myOrigShift = isWorkerA ? activeSwap.origShiftA : activeSwap.origShiftB;
        explanation = `Cambio de turno directo con <strong>${otherFullName}</strong>. Intercambiáis turnos en esta jornada: realizas <strong>${formatShiftDesc(myNewShift)}</strong> en lugar de tu turno oficial (<strong>${formatShiftDesc(myOrigShift)}</strong>). Compensación simultánea (saldo 0).`;
      } else if (activeSwap.workerA === state.currentWorker) {
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

  // ====================================================================
  // MEJORA 3: COMPARADOR DE CUADRANTES ("¿CUÁNDO LIBRAMOS JUNTOS?")
  // ====================================================================

  function switchTeamMode(mode) {
    state.teamMode = mode;
    if (el.teamModeMatrixBtn) el.teamModeMatrixBtn.classList.toggle('active', mode === 'matrix');
    if (el.teamModeCompareBtn) el.teamModeCompareBtn.classList.toggle('active', mode === 'compare');

    if (el.teamMatrixView) el.teamMatrixView.style.display = mode === 'matrix' ? 'block' : 'none';
    if (el.teamCompareView) el.teamCompareView.style.display = mode === 'compare' ? 'block' : 'none';

    if (mode === 'matrix') {
      renderTeamDaily();
      renderMatrix();
    } else {
      renderCompareView();
    }
  }

  function getWorkerInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function updateCompareAvatars() {
    if (el.compareAvatar1) el.compareAvatar1.textContent = getWorkerInitials(state.compareWorker1);
    if (el.compareAvatar2) el.compareAvatar2.textContent = getWorkerInitials(state.compareWorker2);
    if (el.btnShareWhatsappWorkerName) el.btnShareWhatsappWorkerName.textContent = state.compareWorker2;
  }

  function populateCompareWorkerSelects() {
    if (!el.compareWorker1Select || !el.compareWorker2Select) return;
    el.compareWorker1Select.innerHTML = '';
    el.compareWorker2Select.innerHTML = '';

    DATA.workers.forEach(w => {
      const opt1 = document.createElement('option');
      opt1.value = w;
      opt1.textContent = w;
      if (w === state.compareWorker1) opt1.selected = true;
      el.compareWorker1Select.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = w;
      opt2.textContent = w;
      if (w === state.compareWorker2) opt2.selected = true;
      el.compareWorker2Select.appendChild(opt2);
    });

    updateCompareAvatars();
  }

  function renderCompareQuickPills() {
    if (!el.compareQuickPills) return;
    el.compareQuickPills.innerHTML = '';

    DATA.workers.forEach(w => {
      if (w === state.compareWorker1) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'compare-quick-pill' + (w === state.compareWorker2 ? ' active' : '');
      btn.textContent = w;
      btn.addEventListener('click', () => {
        state.compareWorker2 = w;
        if (el.compareWorker2Select) el.compareWorker2Select.value = w;
        updateCompareAvatars();
        renderCompareQuickPills();
        renderCompareView();
      });
      el.compareQuickPills.appendChild(btn);
    });
  }

  function calculateComparisonData(w1, w2) {
    const result = {
      sharedFreeDays: [],
      sharedWeekends: [],
      sharedWeekendDaysSet: new Set(),
      sameShiftDays: [],
      swapDays: [],
      byDate: {}
    };

    const year = 2027;
    const daysInYear = 365;

    for (let i = 0; i < daysInYear; i++) {
      const dt = new Date(year, 0, 1 + i);
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const dateStr = `${year}-${m}-${d}`;

      const s1 = getEffectiveShift(w1, dateStr);
      const s2 = getEffectiveShift(w2, dateStr);

      const b1 = window.CuadranteValidator.getBaseShift(s1);
      const b2 = window.CuadranteValidator.getBaseShift(s2);

      const isFree1 = (b1 === 'L');
      const isFree2 = (b2 === 'L');
      const bothFree = isFree1 && isFree2;
      const sameShift = (!isFree1 && !isFree2 && b1 === b2);
      const canSwap = (isFree1 !== isFree2);

      if (bothFree) result.sharedFreeDays.push(dateStr);
      if (sameShift) result.sameShiftDays.push({ date: dateStr, shift: s1, base: b1 });
      if (canSwap) result.swapDays.push({ date: dateStr, s1, s2, w1Works: !isFree1, w2Works: !isFree2 });

      result.byDate[dateStr] = {
        dateStr,
        s1,
        s2,
        b1,
        b2,
        isFree1,
        isFree2,
        bothFree,
        sameShift,
        canSwap,
        isSharedWeekend: false
      };
    }

    // Identificar fines de semana completos (Sábado y Domingo libres ambos)
    for (let i = 0; i < daysInYear; i++) {
      const dt = new Date(year, 0, 1 + i);
      if (dt.getDay() === 6) { // Sábado
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        const satStr = `${year}-${m}-${d}`;

        const sunDt = new Date(dt);
        sunDt.setDate(dt.getDate() + 1);
        if (sunDt.getFullYear() === year) {
          const sm = String(sunDt.getMonth() + 1).padStart(2, '0');
          const sd = String(sunDt.getDate()).padStart(2, '0');
          const sunStr = `${year}-${sm}-${sd}`;

          const satInfo = result.byDate[satStr];
          const sunInfo = result.byDate[sunStr];

          if (satInfo && sunInfo && satInfo.bothFree && sunInfo.bothFree) {
            satInfo.isSharedWeekend = true;
            sunInfo.isSharedWeekend = true;
            result.sharedWeekendDaysSet.add(satStr);
            result.sharedWeekendDaysSet.add(sunStr);
            result.sharedWeekends.push({
              sat: satStr,
              sun: sunStr,
              label: `${dt.getDate()} y ${sunDt.getDate()} de ${MONTH_NAMES[dt.getMonth()]}`
            });
          }
        }
      }
    }

    return result;
  }

  function renderCompareView() {
    if (!el.teamCompareView) return;
    const w1 = state.compareWorker1;
    const w2 = state.compareWorker2;

    updateCompareAvatars();

    const data = calculateComparisonData(w1, w2);

    if (el.compareKpiFree) el.compareKpiFree.textContent = data.sharedFreeDays.length;
    if (el.compareKpiWeekend) el.compareKpiWeekend.textContent = data.sharedWeekends.length;
    if (el.compareKpiShift) el.compareKpiShift.textContent = data.sameShiftDays.length;
    if (el.compareKpiSwap) el.compareKpiSwap.textContent = data.swapDays.length;

    renderCompareCalendar(data);
    renderCompareAgenda(data);
  }

  function renderCompareCalendar(precalcData) {
    if (!el.compareCalendarGrid) return;
    const w1 = state.compareWorker1;
    const w2 = state.compareWorker2;
    const month = state.compareMonth;
    const year = 2027;

    if (el.compareMonthTitle) {
      el.compareMonthTitle.textContent = `${MONTH_NAMES[month - 1]} ${year}`;
    }

    const data = precalcData || calculateComparisonData(w1, w2);
    const lastDay = new Date(year, month, 0).getDate();

    // Primer día del mes (1 = Lun, ..., 7 = Dom)
    const firstDow = new Date(year, month - 1, 1).getDay();
    const offset = (firstDow === 0 ? 7 : firstDow) - 1;

    el.compareCalendarGrid.innerHTML = '';

    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('div');
      empty.className = 'compare-cell';
      empty.style.opacity = '0.12';
      empty.style.pointerEvents = 'none';
      el.compareCalendarGrid.appendChild(empty);
    }

    const currentFilter = state.compareFilter;

    for (let day = 1; day <= lastDay; day++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const info = data.byDate[dStr];
      if (!info) continue;

      let matchesFilter = true;
      if (currentFilter === 'free') {
        matchesFilter = info.bothFree;
      } else if (currentFilter === 'weekend') {
        matchesFilter = info.isSharedWeekend;
      } else if (currentFilter === 'shift') {
        matchesFilter = info.sameShift;
      } else if (currentFilter === 'swap') {
        matchesFilter = info.canSwap;
      }

      const cell = document.createElement('div');
      let cellCls = 'compare-cell';
      if (info.isSharedWeekend) {
        cellCls += ' is-shared-free is-shared-weekend';
      } else if (info.bothFree) {
        cellCls += ' is-shared-free';
      } else if (info.sameShift) {
        cellCls += ' is-shared-shift';
      }

      cell.className = cellCls;
      if (!matchesFilter) {
        cell.style.opacity = '0.22';
        cell.style.filter = 'grayscale(0.85)';
      }

      let tagHtml = '';
      if (info.isSharedWeekend) {
        tagHtml = '<span class="compare-cell-tag tag-weekend">☀️ Finde</span>';
      } else if (info.bothFree) {
        tagHtml = '<span class="compare-cell-tag tag-free">🟢 Libre</span>';
      } else if (info.sameShift) {
        tagHtml = `<span class="compare-cell-tag tag-shift">🔵 ${info.b1}</span>`;
      } else if (info.canSwap) {
        tagHtml = '<span class="compare-cell-tag" style="background:rgba(168,85,247,0.18); color:#c084fc;">🔀</span>';
      }

      function getPillStyle(shift, base) {
        if (base === 'M') return 'background:var(--shift-m); color:#fff;';
        if (base === 'T') return 'background:var(--shift-t); color:#fff;';
        if (base === 'N') return 'background:var(--shift-n); color:#fff;';
        if (shift === 'VAC') return 'background:var(--shift-vac); color:#fff;';
        return 'background:var(--shift-free); color:#94a3b8;';
      }

      const pill1Style = getPillStyle(info.s1, info.b1);
      const pill2Style = getPillStyle(info.s2, info.b2);

      const short1 = info.b1 !== 'L' ? (info.s1.includes('.') ? `${info.b1}.` : info.b1) : (info.s1 === 'VAC' ? 'VAC' : 'L');
      const short2 = info.b2 !== 'L' ? (info.s2.includes('.') ? `${info.b2}.` : info.b2) : (info.s2 === 'VAC' ? 'VAC' : 'L');

      cell.innerHTML = `
        <div class="compare-cell-header">
          <span>${day}</span>
          ${tagHtml}
        </div>
        <div class="compare-shifts-duo">
          <div class="compare-shift-pill" style="${pill1Style}" title="${w1}: ${info.s1}">
            ${short1}
          </div>
          <div class="compare-shift-pill" style="${pill2Style}" title="${w2}: ${info.s2}">
            ${short2}
          </div>
        </div>
      `;

      cell.addEventListener('click', () => {
        openDayDetailModal(dStr);
      });

      el.compareCalendarGrid.appendChild(cell);
    }
  }

  function renderCompareAgenda(data) {
    if (!el.compareAgendaList) return;
    el.compareAgendaList.innerHTML = '';

    const w1 = state.compareWorker1;
    const w2 = state.compareWorker2;

    const items = [];

    // Fines de semana completos
    data.sharedWeekends.slice(0, 4).forEach(wk => {
      items.push({
        icon: '☀️',
        title: `Fin de Semana: ${wk.label}`,
        subtitle: 'Sábado y Domingo libres ambos simultáneamente',
        tag: 'Finde Libre',
        tagCls: 'tag-weekend',
        borderCol: '#f59e0b'
      });
    });

    // Próximos días libres sueltos
    const freeSingles = data.sharedFreeDays.filter(d => !data.sharedWeekendDaysSet.has(d)).slice(0, 4);
    freeSingles.forEach(dStr => {
      items.push({
        icon: '🟢',
        title: formatDateSpanish(dStr),
        subtitle: `${w1} y ${w2} libran este día`,
        tag: 'Día Libre',
        tagCls: 'tag-free',
        borderCol: '#10b981'
      });
    });

    // Próximos mismos turnos
    data.sameShiftDays.slice(0, 3).forEach(item => {
      items.push({
        icon: '🔵',
        title: formatDateSpanish(item.date),
        subtitle: `Coincidís trabajando en turno de ${item.base === 'M' ? 'Mañana' : (item.base === 'T' ? 'Tarde' : 'Noche')}`,
        tag: `Mismo Turno (${item.base})`,
        tagCls: 'tag-shift',
        borderCol: '#38bdf8'
      });
    });

    if (items.length === 0) {
      el.compareAgendaList.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-muted); font-size:0.9rem;">
          No hay coincidencias registradas para esta selección.
        </div>
      `;
      return;
    }

    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'compare-agenda-item';
      card.style.borderLeftColor = it.borderCol;
      card.innerHTML = `
        <div>
          <div style="font-weight:700; font-size:0.88rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
            <span>${it.icon}</span> ${it.title}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">
            ${it.subtitle}
          </div>
        </div>
        <span class="compare-cell-tag ${it.tagCls}">${it.tag}</span>
      `;
      el.compareAgendaList.appendChild(card);
    });
  }

  function shareComparisonViaWhatsapp() {
    const w1 = state.compareWorker1;
    const w2 = state.compareWorker2;
    const data = calculateComparisonData(w1, w2);

    let msg = `👋 ¡Hola ${w2}!\n`;
    msg += `He revisado nuestros cuadrantes de 2027 en la app de Andújar y aquí tienes el resumen de nuestras coincidencias:\n\n`;
    msg += `🟢 *Días libres juntos:* ${data.sharedFreeDays.length} días en 2027\n`;
    msg += `☀️ *Fines de semana completos libres juntos:* ${data.sharedWeekends.length} fines de semana\n`;
    msg += `🔵 *Días que trabajamos en el mismo turno:* ${data.sameShiftDays.length} días\n`;
    msg += `🔀 *Ocasiones para hacernos favores/permutas:* ${data.swapDays.length} días\n\n`;

    if (data.sharedWeekends.length > 0) {
      msg += `☀️ *Próximos fines de semana completos libres que compartimos:*\n`;
      data.sharedWeekends.slice(0, 5).forEach(wk => {
        msg += `• ${wk.label}\n`;
      });
      msg += `\n`;
    }

    const freeSingles = data.sharedFreeDays.filter(d => !data.sharedWeekendDaysSet.has(d)).slice(0, 4);
    if (freeSingles.length > 0) {
      msg += `🟢 *Próximos días libres juntos entre semana:*\n`;
      freeSingles.forEach(dStr => {
        msg += `• ${formatDateSpanish(dStr)}\n`;
      });
      msg += `\n`;
    }

    msg += `¡Podemos ir cuadrando planes familiares, escapadas o intercambios de turnos! 🚀\n`;
    msg += `_Generado desde la app Cuadrante 2027 Andújar_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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
        if (cand.isShiftSwap) {
          badgeHtml = `<span class="candidate-badge-pill" style="background:rgba(16,185,129,0.2); color:#10b981;">✓ 100% Conforme (Cambio de Turno)</span>`;
          detailHtml = `<div style="font-size:0.78rem; color:var(--text-secondary);">Trabaja de <strong>${formatShiftDesc(cand.currentShiftB)}</strong>. Intercambio directo: tú realizas su turno (${cand.currentShiftB}) y él tu turno (${curShiftA}). 100% conforme a descansos y reglas.</div>`;
          actionBtnHtml = `<button class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:100%; justify-content:center;">${isSelected ? '✓ Seleccionado para Cambio' : '🔄 Cambiar turnos (' + curShiftA + ' ⇄ ' + cand.currentShiftB + ')'}</button>`;
        } else {
          badgeHtml = `<span class="candidate-badge-pill">✓ 100% Conforme (Te cubre)</span>`;
          detailHtml = `<div style="font-size:0.78rem; color:var(--text-secondary);">Está de descanso este día. Puede cubrirte sin vulnerar descansos de 12h ni superar 5 días.</div>`;
          actionBtnHtml = `<button class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:100%; justify-content:center;">${isSelected ? '✓ Seleccionado' : 'Elegir para cubrirte'}</button>`;
        }
      } else if (cand.status === 'warning') {
        if (cand.isShiftSwap) {
          badgeHtml = `<span class="candidate-badge-pill" style="background:rgba(245,158,11,0.2); color:#f59e0b;">⚠️ Cambio con Warning</span>`;
          const warnItems = cand.warnings.map(w => `<div>• ${w}</div>`).join('');
          detailHtml = `
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:4px;">Trabaja de <strong>${formatShiftDesc(cand.currentShiftB)}</strong>. Cambio directo viable obviando la regla ergonómica:</div>
            <div class="candidate-warnings-list">${warnItems}</div>
          `;
          actionBtnHtml = `<button class="btn-secondary" style="padding:6px 12px; font-size:0.8rem; width:100%; justify-content:center; color:#f59e0b; border-color:#f59e0b;">${isSelected ? '✓ Seleccionado con Warning' : '🔄 Cambiar con Warning'}</button>`;
        } else {
          badgeHtml = `<span class="candidate-badge-pill">⚠️ Cobertura con Warning</span>`;
          const warnItems = cand.warnings.map(w => `<div>• ${w}</div>`).join('');
          detailHtml = `
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:4px;">Disponible si se obvia la regla ergonómica:</div>
            <div class="candidate-warnings-list">${warnItems}</div>
          `;
          actionBtnHtml = `<button class="btn-secondary" style="padding:6px 12px; font-size:0.8rem; width:100%; justify-content:center; color:#f59e0b; border-color:#f59e0b;">${isSelected ? '✓ Seleccionado con Warning' : 'Elegir con Warning'}</button>`;
        }
      } else if (cand.status === 'same_shift') {
        badgeHtml = `<span class="candidate-badge-pill" style="background:rgba(148,163,184,0.15); color:var(--text-muted);">Mismo turno</span>`;
        detailHtml = `<div style="font-size:0.75rem; color:var(--text-muted);">${cand.reason}</div>`;
        actionBtnHtml = `<span style="font-size:0.75rem; color:var(--text-muted); text-align:center;">No disponible (mismo turno)</span>`;
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
          selectCoverCandidate(cand);
        });
      }

      el.coverCandidatesGrid.appendChild(card);
    });
  }

  function selectCoverCandidate(candOrWorker) {
    const workerB = (typeof candOrWorker === 'string') ? candOrWorker : candOrWorker.worker;
    const isShiftSwap = (typeof candOrWorker === 'object') ? Boolean(candOrWorker.isShiftSwap) : false;
    const shiftB = (typeof candOrWorker === 'object') ? candOrWorker.currentShiftB : null;

    state.selectedWorkerB = workerB;
    state.isShiftSwap = isShiftSwap;
    state.selectedWorkerBShift = shiftB;

    // Resaltar en interfaz
    document.querySelectorAll('.candidate-worker-card').forEach(c => c.classList.remove('is-selected'));
    const cards = el.coverCandidatesGrid.querySelectorAll('.candidate-worker-card');
    cards.forEach(c => {
      if (c.innerHTML.includes(workerB)) c.classList.add('is-selected');
    });

    if (el.step3WorkerBName) el.step3WorkerBName.textContent = workerB;
    if (el.step3WorkerBNameSub) el.step3WorkerBNameSub.textContent = workerB;

    if (isShiftSwap) {
      state.selectedDateB = el.swapDateA.value; // Misma fecha: compensación simultánea
      if (el.step3Card) {
        el.step3Card.style.display = 'block';
        el.step3Card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      renderReturnDays();
      if (el.step4AgreementCard) {
        el.step4AgreementCard.style.display = 'block';
      }
      renderAgreementSummary();
      showToast(`🔄 Seleccionado cambio de turno directo con ${workerB}`);
    } else {
      state.selectedDateB = null; // Reset devolución al cambiar de compañero
      if (el.step3Card) {
        el.step3Card.style.display = 'block';
        el.step3Card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (el.step4AgreementCard) el.step4AgreementCard.style.display = 'none';

      renderReturnDays();
      showToast(`Compañero para cubrirte: ${workerB}`);
    }
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

    if (state.isShiftSwap) {
      const curShiftA = getOfficialShift(workerA, dateA);
      const shiftB = state.selectedWorkerBShift || getOfficialShift(workerB, dateA);

      if (el.returnFilterPills) el.returnFilterPills.style.display = 'none';

      el.returnDaysGrid.innerHTML = `
        <div style="grid-column: 1 / -1; background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.22); border-radius:12px; padding:18px;">
          <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:var(--accent-primary); font-size:1rem; margin-bottom:8px;">
            <span style="font-size:1.2rem;">🔄</span> Compensación Simultánea: Cambio de Turno en la Misma Jornada
          </div>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin:0 0 12px 0; line-height:1.5;">
            Ambos prestáis servicio el <strong>${formatDateSpanish(dateA)}</strong>. Al realizar un intercambio directo de vuestros turnos (<strong>${curShiftA} ⇄ ${shiftB}</strong>), 
            <strong>la compensación queda saldada de forma inmediata</strong> (saldo 0 jornadas). No queda ninguna jornada pendiente de devolver.
          </p>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-bottom:12px;">
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px 14px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">TU NUEVA ASIGNACIÓN (${workerA})</div>
              <div style="font-size:0.95rem; font-weight:700; color:var(--accent-primary); margin-top:4px;">
                Turno ${shiftB} <span style="font-size:0.8rem; font-weight:500; color:var(--text-secondary);">(${formatShiftDesc(shiftB)})</span>
              </div>
            </div>
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px 14px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">NUEVA ASIGNACIÓN DE ${workerB}</div>
              <div style="font-size:0.95rem; font-weight:700; color:var(--accent-primary); margin-top:4px;">
                Turno ${curShiftA} <span style="font-size:0.8rem; font-weight:500; color:var(--text-secondary);">(${formatShiftDesc(curShiftA)})</span>
              </div>
            </div>
          </div>
          <div style="font-size:0.82rem; color:#10b981; font-weight:600; display:flex; align-items:center; gap:6px;">
            <span>✓</span> Saldo de permuta: 0 días pendientes. Revisa el análisis laboral en el Paso 4 a continuación.
          </div>
        </div>
      `;
      return;
    }

    if (el.returnFilterPills) el.returnFilterPills.style.display = 'flex';

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

    const isShiftSwap = Boolean(state.isShiftSwap || (dateA === dateB));
    const curShiftA = getOfficialShift(workerA, dateA);
    const origShiftB = isShiftSwap 
      ? (state.selectedWorkerBShift || getOfficialShift(workerB, dateA))
      : getOfficialShift(workerB, dateB);

    if (isShiftSwap) {
      if (el.summaryDateA) el.summaryDateA.textContent = formatDateSpanish(dateA);
      if (el.summaryCoverWorkerB) el.summaryCoverWorkerB.textContent = `${workerB} asume tu turno oficial: ${curShiftA} (${formatShiftDesc(curShiftA)})`;

      if (el.summaryDateB) el.summaryDateB.textContent = formatDateSpanish(dateA);
      if (el.summaryCoverWorkerA) el.summaryCoverWorkerA.textContent = `Tú asumes el turno oficial de ${workerB}: ${origShiftB} (${formatShiftDesc(origShiftB)})`;
      if (el.summaryWorkerBFree) el.summaryWorkerBFree.textContent = `Intercambio de turno simultáneo en la misma fecha (saldo 0)`;

      // Validación oficial para cambio directo de turno
      const res = window.CuadranteValidator.validateSwap({
        workerA, dateA, newShiftA: origShiftB,
        workerB, dateB: dateA, newShiftB: curShiftA
      });

      if (el.agreementValidationBox) {
        el.agreementValidationBox.className = 'validation-results-panel ' + (res.valid ? (res.hasWarnings ? 'has-warning' : 'valid') : 'invalid');
      }

      if (el.agreementResultBadge) {
        if (res.valid) {
          if (res.hasWarnings) {
            el.agreementResultBadge.textContent = 'Cambio Viable con Advertencia';
            el.agreementResultBadge.style.background = '#f59e0b';
            el.agreementResultBadge.style.color = '#fff';
          } else {
            el.agreementResultBadge.textContent = 'Cambio 100% Conforme';
            el.agreementResultBadge.style.background = '#10b981';
            el.agreementResultBadge.style.color = '#fff';
          }
        } else {
          el.agreementResultBadge.textContent = 'Cambio No Disponible';
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
    } else {
      if (el.summaryDateA) el.summaryDateA.textContent = formatDateSpanish(dateA);
      if (el.summaryCoverWorkerB) el.summaryCoverWorkerB.textContent = `Te cubre: ${workerB} (asume turno ${curShiftA})`;

      if (el.summaryDateB) el.summaryDateB.textContent = formatDateSpanish(dateB);
      if (el.summaryCoverWorkerA) el.summaryCoverWorkerA.textContent = `Tú cubres a ${workerB} (asumes turno ${origShiftB})`;
      if (el.summaryWorkerBFree) el.summaryWorkerBFree.textContent = `${workerB} queda: LIBRE`;

      // Validación oficial para cobertura con devolución
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
  }

  function applyPermutaSimulation() {
    const workerA = state.currentWorker;
    const dateA = el.swapDateA.value;
    const workerB = state.selectedWorkerB;
    const dateB = state.selectedDateB;

    if (!workerA || !workerB || !dateA || !dateB) return;

    const isShiftSwap = Boolean(state.isShiftSwap || (dateA === dateB));
    const curShiftA = getOfficialShift(workerA, dateA);
    const origShiftB = isShiftSwap 
      ? (state.selectedWorkerBShift || getOfficialShift(workerB, dateA))
      : getOfficialShift(workerB, dateB);

    const newSwap = {
      id: 'swap_' + Date.now(),
      createdAt: new Date().toISOString(),
      type: isShiftSwap ? 'shift_exchange' : 'day_cover',
      workerA,
      workerB,
      dateA,
      origShiftA: curShiftA,
      newShiftA: isShiftSwap ? origShiftB : 'LIBRE',
      dateB,
      origShiftB,
      newShiftB: isShiftSwap ? curShiftA : 'LIBRE',
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
      direction: isShiftSwap ? 'compensado' : 'me_debe',
      dateOriginal: dateA,
      shiftOriginal: curShiftA,
      dateReturn: dateB,
      shiftReturn: origShiftB,
      notes: isShiftSwap 
        ? `Cambio directo de turno en cuadrante: ${curShiftA} ⇄ ${origShiftB} con ${workerB}`
        : `Permuta aplicada en cuadrante con ${workerB}`,
      status: isShiftSwap ? 'settled' : 'pending',
      settledDate: isShiftSwap ? new Date().toISOString() : null,
      appliedToCalendar: true,
      swapId: newSwap.id
    };
    state.debts = [linkedDebt, ...state.debts];
    localStorage.setItem('cuadrante_turn_debts', JSON.stringify(state.debts));

    rebuildOverridesFromSwaps();
    updateAppView();

    showToast(isShiftSwap 
      ? `✓ Cambio de turno guardado en tu calendario con ${workerB}` 
      : `✓ Permuta guardada permanentemente en tu calendario con ${workerB}`);
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

    const isShiftSwap = Boolean(state.isShiftSwap || (dateA === dateB));
    const curShiftA = getOfficialShift(workerA, dateA);
    const origShiftB = isShiftSwap 
      ? (state.selectedWorkerBShift || getOfficialShift(workerB, dateA))
      : (dateB ? getOfficialShift(workerB, dateB) : null);

    const newDebt = {
      id: 'debt_' + Date.now(),
      createdAt: new Date().toISOString(),
      workerA: workerA,
      workerB: workerB,
      direction: isShiftSwap ? 'compensado' : 'le_debo',
      dateOriginal: dateA,
      shiftOriginal: curShiftA,
      dateReturn: dateB || null,
      shiftReturn: origShiftB || null,
      notes: isShiftSwap 
        ? `Cambio directo de turno en la misma jornada: ${curShiftA} ⇄ ${origShiftB} con ${workerB}`
        : (dateB ? `Permuta completa: te cubre el ${dateA} y devuelves el ${dateB}` : `Te cubre el ${dateA} (pendiente de devolución)`),
      status: isShiftSwap ? 'settled' : 'pending',
      settledDate: isShiftSwap ? new Date().toISOString() : null
    };

    const debts = [newDebt, ...state.debts];
    saveDebts(debts);
    showToast(isShiftSwap ? `🤝 Cambio de turno con ${workerB} registrado en tu Bolsa` : `🤝 Acuerdo con ${workerB} guardado en tu Bolsa`);
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

    const isShiftSwap = Boolean(state.isShiftSwap || (dateA === dateB));
    const curShiftA = getOfficialShift(workerA, dateA);
    const origShiftB = isShiftSwap 
      ? (state.selectedWorkerBShift || getOfficialShift(workerB, dateA))
      : getOfficialShift(workerB, dateB);

    const nameA = getWorkerFullName(workerA);
    const nameB = getWorkerFullName(workerB);
    const textDateA = formatDateSpanishWithYear(dateA);
    const textDateB = formatDateSpanishWithYear(dateB);

    let text = '';
    if (isShiftSwap) {
      text = 
`🤝 *ACUERDO DE CAMBIO DE TURNO DIRECTO · CUADRANTE 2027*
📍 *Centro de Trabajo:* HAG de Andújar
👥 *Acuerdo entre:* ${nameA} ⇄ ${nameB}

📅 *JORNADA DE INTERCAMBIO:*
• *Fecha:* ${textDateA}
• *${nameA}:* Pasa a turno *${formatShiftDesc(origShiftB)}* (oficial en cuadrante: ${formatShiftDesc(curShiftA)})
• *${nameB}:* Pasa a turno *${formatShiftDesc(curShiftA)}* (oficial en cuadrante: ${formatShiftDesc(origShiftB)})

⚖️ *AUDITORÍA LABORAL:* Conforme con la normativa laboral y descansos del HAG de Andújar.
📋 *Saldo de compensación:* Compensado simultáneamente en la misma jornada (saldo 0 días).
📋 _Generado desde la App Cuadrante 2027 Andújar_`;
    } else {
      text = 
`🤝 *ACUERDO DE PERMUTA · CUADRANTE 2027*
📍 *Centro de Trabajo:* HAG de Andújar
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
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function shareDebtViaWhatsapp(debt) {
    if (!debt) return;
    const workerA = debt.workerA;
    const workerB = debt.workerB;
    const nameA = getWorkerFullName(workerA);
    const nameB = getWorkerFullName(workerB);

    const isShiftSwap = (debt.dateOriginal === debt.dateReturn) || (debt.direction === 'compensado');
    const textDateA = formatDateSpanishWithYear(debt.dateOriginal);
    const textDateB = debt.dateReturn ? formatDateSpanishWithYear(debt.dateReturn) : 'Pendiente de acordar';

    let text = '';
    if (isShiftSwap) {
      text = 
`🤝 *REGISTRO DE CAMBIO DE TURNO DIRECTO · CUADRANTE 2027*
📍 *Centro de Trabajo:* HAG de Andújar
👥 *Trabajadores:* ${nameA} y ${nameB}

📅 *Fecha:* ${textDateA}
• *Intercambio pactado:* ${formatShiftDesc(debt.shiftOriginal || 'M')} ⇄ ${formatShiftDesc(debt.shiftReturn || 'T')}
${debt.notes ? `• *Detalle:* ${debt.notes}\n` : ''}• *Estado:* Compensado simultáneamente (saldo 0)
📋 _Bolsa de Turnos · Cuadrante 2027 Andújar_`;
    } else {
      text = 
`🤝 *REGISTRO DE TURNO / PERMUTA · CUADRANTE 2027*
📍 *Centro de Trabajo:* HAG de Andújar
👥 *Trabajadores:* ${nameA} y ${nameB}

📋 *Detalle del Servicio:*
• *Turno:* ${formatShiftDesc(debt.shiftOriginal || 'M')}
• *Fecha:* ${textDateA}
• *Compromiso:* ${debt.theyOweMe ? `${nameB} tiene turno pendiente contigo` : `Tienes turno pendiente con ${nameB}`}
• *Devolución acordada:* ${textDateB}${debt.shiftReturn ? ` (${formatShiftDesc(debt.shiftReturn)})` : ''}
${debt.notes ? `• *Notas:* ${debt.notes}\n` : ''}
📋 _Bolsa de Turnos · Cuadrante 2027 Andújar_`;
    }

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
      const isShiftSwap = Boolean(state.isShiftSwap || (dateA === dateB));
      shiftA = getOfficialShift(workerA, dateA);
      shiftB = isShiftSwap 
        ? (state.selectedWorkerBShift || getOfficialShift(workerB, dateA))
        : getOfficialShift(workerB, dateB);
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

      if (swap.type === 'shift_exchange' || swap.dateA === swap.dateB) {
        // Intercambio de turno directo el mismo día
        state.simulatedOverrides[swap.workerA][swap.dateA] = swap.newShiftA || swap.origShiftB;
        state.simulatedOverrides[swap.workerB][swap.dateA] = swap.newShiftB || swap.origShiftA;
      } else {
        // workerA libra en dateA, trabaja origShiftB en dateB
        state.simulatedOverrides[swap.workerA][swap.dateA] = ' ';
        state.simulatedOverrides[swap.workerA][swap.dateB] = swap.origShiftB;

        // workerB trabaja origShiftA en dateA, libra en dateB
        state.simulatedOverrides[swap.workerB][swap.dateA] = swap.origShiftA;
        state.simulatedOverrides[swap.workerB][swap.dateB] = ' ';
      }
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
      const isShiftSwap = (swap.type === 'shift_exchange') || (swap.dateA === swap.dateB);
      const textDateA = formatDateSpanishWithYear(swap.dateA);
      const textDateB = formatDateSpanishWithYear(swap.dateB);

      let detailsHtml = '';
      if (isShiftSwap) {
        const isWorkerA = (swap.workerA === state.currentWorker);
        const myNewShift = isWorkerA ? (swap.newShiftA || swap.origShiftB) : (swap.newShiftB || swap.origShiftA);
        const myOrigShift = isWorkerA ? swap.origShiftA : swap.origShiftB;
        const otherNewShift = isWorkerA ? (swap.newShiftB || swap.origShiftA) : (swap.newShiftA || swap.origShiftB);
        const otherOrigShift = isWorkerA ? swap.origShiftB : swap.origShiftA;

        detailsHtml = `
          <div style="grid-column: 1 / -1; background:rgba(0,0,0,0.2); padding:10px; border-radius:var(--radius-sm); font-size:0.8rem;">
            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Intercambio Directo (${textDateA}):</div>
            <div style="color:var(--text-primary); margin-top:3px; line-height:1.4;">
              Tú realizas: <strong>${formatShiftDesc(myNewShift)}</strong> (oficial: ${myOrigShift})<br>
              ${otherWorker} realiza: <strong>${formatShiftDesc(otherNewShift)}</strong> (oficial: ${otherOrigShift})
            </div>
            <div style="font-size:0.72rem; color:#10b981; margin-top:4px; font-weight:600;">✓ Compensación simultánea en la misma jornada (saldo 0)</div>
          </div>
        `;
      } else {
        detailsHtml = `
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
        `;
      }

      const card = document.createElement('div');
      card.className = 'swap-active-item-card';
      card.innerHTML = `
        <div class="swap-active-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">🔀</span>
            <div>
              <div style="font-weight:800; font-size:0.95rem; color:var(--text-primary);">${otherFullName}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">${isShiftSwap ? 'Cambio directo de turno' : 'Acuerdo de permuta mutua'}</div>
            </div>
          </div>
          <span style="background:rgba(56,189,248,0.2); color:#38bdf8; font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:4px; border:1px solid rgba(56,189,248,0.4);">
            Activa en Calendario
          </span>
        </div>

        <div style="display:grid; grid-template-columns:${isShiftSwap ? '1fr' : '1fr 1fr'}; gap:10px; background:rgba(0,0,0,0.2); padding:10px; border-radius:var(--radius-sm); font-size:0.8rem;">
          ${detailsHtml}
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

  // ==========================================================================
  // TAB: FESTIVOS & VACACIONES (HISTÓRICO 2011-2027 & PREVISIÓN 2028)
  // ==========================================================================

  function renderHolidaysVacations() {
    if (!window.HISTORICAL_DATA) return;

    if (state.holidaysVacationsMode === 'vacations') {
      if (el.subViewVacationsContainer) el.subViewVacationsContainer.style.display = 'block';
      if (el.subViewHolidaysContainer) el.subViewHolidaysContainer.style.display = 'none';
      renderVacationsSubView();
    } else {
      if (el.subViewVacationsContainer) el.subViewVacationsContainer.style.display = 'none';
      if (el.subViewHolidaysContainer) el.subViewHolidaysContainer.style.display = 'block';
      renderHolidaysSubView();
    }
  }

  function renderVacationsSubView() {
    const hist = window.HISTORICAL_DATA;
    if (!hist || !hist.vacaciones) return;

    const w = state.currentWorker;
    if (el.vacCurrentWorkerName) el.vacCurrentWorkerName.textContent = w;

    // Parejas y turnos rotativos
    const pairs = {
      'Antonio J': { partner: 'Miguel B', slot2027: 1, slot2028: 2 },
      'Miguel B': { partner: 'Antonio J', slot2027: 1, slot2028: 2 },
      'Paco C': { partner: 'Fran Espin', slot2027: 2, slot2028: 3 },
      'Fran Espin': { partner: 'Paco C', slot2027: 2, slot2028: 3 },
      'A. Leon': { partner: 'Hilario', slot2027: 3, slot2028: 4 },
      'Hilario': { partner: 'A. Leon', slot2027: 3, slot2028: 4 },
      'Santi M': { partner: 'Alberto H', slot2027: 4, slot2028: 1 },
      'Alberto H': { partner: 'Santi M', slot2027: 4, slot2028: 1 },
      'Extra 1': { partner: 'Personal de Refuerzo', slot2027: 0, slot2028: 0 }
    };

    const userPairInfo = pairs[w] || { partner: 'N/A', slot2027: 1, slot2028: 2 };

    if (el.vacPartnerName) {
      el.vacPartnerName.textContent = userPairInfo.partner;
    }

    const slotNames = {
      1: { name: 'Turno 1', q1: '01 al 15 de Junio', q2: '01 al 15 de Agosto' },
      2: { name: 'Turno 2', q1: '16 al 30 de Junio', q2: '16 al 31 de Agosto' },
      3: { name: 'Turno 3', q1: '01 al 15 de Julio', q2: '01 al 15 de Septiembre' },
      4: { name: 'Turno 4', q1: '16 al 31 de Julio', q2: '16 al 30 de Septiembre' }
    };

    if (w === 'Extra 1') {
      if (el.vac2027SlotName) el.vac2027SlotName.textContent = 'Refuerzo Estival';
      if (el.vac2027DatesText) {
        el.vac2027DatesText.innerHTML = `
          <div class="vac-date-row"><span>Periodo:</span> <strong>Junio a Septiembre (4 meses)</strong></div>
          <div class="vac-date-row"><span>Función:</span> <strong>Cobertura vacaciones de fijos</strong></div>
        `;
      }
      if (el.vac2028SlotName) el.vac2028SlotName.textContent = 'Refuerzo Estival';
      if (el.vac2028DatesText) {
        el.vac2028DatesText.innerHTML = `
          <div class="vac-date-row"><span>Periodo:</span> <strong>Junio a Septiembre</strong></div>
          <div class="vac-date-row"><span>Función:</span> <strong>Contratación temporal de verano</strong></div>
        `;
      }
    } else {
      const s27 = slotNames[userPairInfo.slot2027];
      const s28 = slotNames[userPairInfo.slot2028];

      if (el.vac2027SlotName) el.vac2027SlotName.textContent = s27.name;
      if (el.vac2027DatesText) {
        el.vac2027DatesText.innerHTML = `
          <div class="vac-date-row"><span>1ª Quincena:</span> <strong>${s27.q1}</strong></div>
          <div class="vac-date-row"><span>2ª Quincena:</span> <strong>${s27.q2}</strong></div>
        `;
      }

      if (el.vac2028SlotName) el.vac2028SlotName.textContent = s28.name;
      if (el.vac2028DatesText) {
        el.vac2028DatesText.innerHTML = `
          <div class="vac-date-row"><span>1ª Quincena:</span> <strong>${s28.q1}</strong></div>
          <div class="vac-date-row"><span>2ª Quincena:</span> <strong>${s28.q2}</strong></div>
        `;
      }
    }

    // Selector de vista
    const view = state.vacationsViewYear;
    if (view === 'history') {
      if (el.vacationQuincenasCards) el.vacationQuincenasCards.style.display = 'none';
      if (el.vacationHistoryTableWrapper) el.vacationHistoryTableWrapper.style.display = 'block';
      renderVacationHistoryTable();
    } else {
      if (el.vacationQuincenasCards) el.vacationQuincenasCards.style.display = 'grid';
      if (el.vacationHistoryTableWrapper) el.vacationHistoryTableWrapper.style.display = 'none';
      renderVacationQuincenasCards(view);
    }
  }

  function renderVacationQuincenasCards(viewYear) {
    if (!el.vacationQuincenasCards) return;

    const slotConfigs = {
      '2027': [
        { slotNum: 1, title: 'Turno 1', dates: '1-15 Jun & 1-15 Ago', pair: ['Antonio J', 'Miguel B'] },
        { slotNum: 2, title: 'Turno 2', dates: '16-30 Jun & 16-31 Ago', pair: ['Paco C', 'Fran Espin'] },
        { slotNum: 3, title: 'Turno 3', dates: '1-15 Jul & 1-15 Sep', pair: ['A. Leon', 'Hilario'] },
        { slotNum: 4, title: 'Turno 4', dates: '16-31 Jul & 16-30 Sep', pair: ['Santi M', 'Alberto H'] }
      ],
      '2028': [
        { slotNum: 1, title: 'Turno 1', dates: '1-15 Jun & 1-15 Ago', pair: ['Santi M', 'Alberto H'] },
        { slotNum: 2, title: 'Turno 2', dates: '16-30 Jun & 16-31 Ago', pair: ['Antonio J', 'Miguel B'] },
        { slotNum: 3, title: 'Turno 3', dates: '1-15 Jul & 1-15 Sep', pair: ['Paco C', 'Fran Espin'] },
        { slotNum: 4, title: 'Turno 4', dates: '16-31 Jul & 16-30 Sep', pair: ['A. Leon', 'Hilario'] }
      ],
      '2029': [
        { slotNum: 1, title: 'Turno 1', dates: '1-15 Jun & 1-15 Ago', pair: ['A. Leon', 'Hilario'] },
        { slotNum: 2, title: 'Turno 2', dates: '16-30 Jun & 16-31 Ago', pair: ['Santi M', 'Alberto H'] },
        { slotNum: 3, title: 'Turno 3', dates: '1-15 Jul & 1-15 Sep', pair: ['Antonio J', 'Miguel B'] },
        { slotNum: 4, title: 'Turno 4', dates: '16-31 Jul & 16-30 Sep', pair: ['Paco C', 'Fran Espin'] }
      ]
    };

    const slots = slotConfigs[viewYear] || slotConfigs['2027'];
    const activeWorker = state.currentWorker;

    el.vacationQuincenasCards.innerHTML = slots.map(s => {
      const isUserSlot = s.pair.includes(activeWorker);
      const w1Highlight = s.pair[0] === activeWorker ? 'highlight' : '';
      const w2Highlight = s.pair[1] === activeWorker ? 'highlight' : '';

      return `
        <div class="vac-quincena-card ${isUserSlot ? 'is-active-user' : ''}">
          <div class="vac-quincena-header">
            <span class="vac-slot-title">${s.title}</span>
            <span class="vac-dates-badge">${s.dates}</span>
          </div>
          <div class="vac-pair-display">
            <div class="vac-worker-name ${w1Highlight}">
              <span>👤</span> ${s.pair[0]}
            </div>
            <div class="vac-worker-name ${w2Highlight}">
              <span>👤</span> ${s.pair[1]}
            </div>
          </div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:auto;">
            ${isUserSlot ? '⭐ <strong>Tu turno asignado</strong>' : 'Descanso simultáneo de la pareja'}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderVacationHistoryTable() {
    if (!el.vacationHistoryTableBody || !window.HISTORICAL_DATA) return;
    const hist = window.HISTORICAL_DATA.vacaciones.history;
    const years = Object.keys(hist).map(Number).sort((a, b) => b - a);

    el.vacationHistoryTableBody.innerHTML = years.map(yr => {
      const q = hist[yr];
      return `
        <tr>
          <td><strong>${yr}</strong></td>
          <td>${q[0] || '-'}</td>
          <td>${q[1] || '-'}</td>
          <td>${q[2] || '-'}</td>
          <td>${q[3] || '-'}</td>
          <td>${q[4] || '-'}</td>
          <td>${q[5] || '-'}</td>
          <td>${q[6] || '-'}</td>
          <td>${q[7] || '-'}</td>
        </tr>
      `;
    }).join('');
  }

  function renderHolidaysSubView() {
    const hist = window.HISTORICAL_DATA;
    if (!hist || !hist.festivos) return;

    if (el.holidayMyWorkerTitle) {
      el.holidayMyWorkerTitle.textContent = state.currentWorker;
    }
    if (el.btnHolidayMyName) {
      el.btnHolidayMyName.textContent = state.currentWorker;
    }

    // 1. Barras de equidad
    renderHolidayEquityBars();

    // 2. Matriz de los 20 festivos o Vista Personal
    if (state.holidayMatrixView === 'personal') {
      if (el.holidayMatrixContainer) el.holidayMatrixContainer.style.display = 'none';
      if (el.holidayPersonalListContainer) el.holidayPersonalListContainer.style.display = 'block';
      renderHolidayPersonalList();
    } else {
      if (el.holidayMatrixContainer) el.holidayMatrixContainer.style.display = 'block';
      if (el.holidayPersonalListContainer) el.holidayPersonalListContainer.style.display = 'none';
      renderHolidayMatrixTable();
    }

    // 3. Mis Fiestas Señaladas
    renderMySpecialHolidays();

    // 4. Dropdown y Línea de Tiempo
    if (el.selectHolidayCategory && !el.selectHolidayCategory.children.length) {
      populateHolidayCategories();
    }
    renderHolidayTimeline(state.selectedHolidayTimeline);

    // 5. Asignaciones fijas 2027
    renderFixed2027Holidays();
  }

  function getWorkerShortCode(workerName) {
    if (!workerName) return 'AJ';
    if (workerName.includes('Antonio J')) return 'AJ';
    if (workerName.includes('Santi') || workerName.includes('Santiago')) return 'SM';
    if (workerName.includes('Alberto') || workerName.includes('Higueras')) return 'AH';
    if (workerName.includes('Fran Esp') || workerName.includes('Espín') || workerName.includes('Espin')) return 'FE';
    if (workerName.includes('Miguel') || workerName.includes('Benítez') || workerName.includes('Benitez')) return 'MB';
    if (workerName.includes('Paco') || workerName.includes('Cantarero')) return 'PC';
    if (workerName.includes('León') || workerName.includes('Leon') || workerName === 'A. Leon') return 'AL';
    return 'AJ';
  }

  function renderHolidayMatrixTable() {
    if (!el.holidayMatrixTable || !window.HISTORICAL_DATA) return;
    const items = window.HISTORICAL_DATA.festivos.items;
    const totals = window.HISTORICAL_DATA.festivos.totals || {};

    const workers = [
      { code: 'AJ', short: 'Antonio J', full: 'Antonio Jesús Sánchez' },
      { code: 'SM', short: 'Santi M', full: 'Santiago Molina' },
      { code: 'AH', short: 'Alberto H', full: 'Alberto Higueras' },
      { code: 'FE', short: 'Fran Esp', full: 'Francisco Espín' },
      { code: 'MB', short: 'Miguel B', full: 'Miguel Benítez' },
      { code: 'PC', short: 'Paco C', full: 'Francisco Cantarero' },
      { code: 'AL', short: 'A. León', full: 'Antonio León' }
    ];

    const currentCode = getWorkerShortCode(state.currentWorker);

    // Encabezados
    const thead = `
      <thead>
        <tr>
          <th style="text-align:left; padding-left:14px; min-width:180px;">Festividad Oficial (20)</th>
          ${workers.map(w => {
            const isAct = w.code === currentCode;
            return `
              <th class="${isAct ? 'is-active-col' : ''}" title="${w.full}">
                ${w.short}
                ${isAct ? '<div style="font-size:0.62rem; color:var(--accent-primary); font-weight:normal;">(Tú)</div>' : ''}
              </th>
            `;
          }).join('')}
          <th style="min-width:60px;">Total</th>
        </tr>
      </thead>
    `;

    // Filas de las 20 festividades
    const tbody = `
      <tbody>
        ${items.map(item => {
          const counts = item.counts || {};
          const vals = workers.map(w => counts[w.code] ?? 0);
          const minVal = Math.min(...vals);
          const maxVal = Math.max(...vals);
          const isDiff = minVal !== maxVal;

          return `
            <tr>
              <td class="fest-name-col">
                <a href="javascript:void(0)" class="matrix-fest-link" data-fest="${item.name}" style="color:var(--text-primary); text-decoration:none; display:flex; align-items:center; gap:6px;">
                  <span>${item.name}</span>
                </a>
              </td>
              ${workers.map(w => {
                const c = counts[w.code] ?? 0;
                const isAct = w.code === currentCode;
                let badgeClass = 'val-badge-normal';
                let titleAttr = `${w.short}: ${c} veces`;
                if (isDiff && c === minVal) {
                  badgeClass = 'val-badge-min';
                  titleAttr += ' (Mínimo de plantilla: Prioridad 2028)';
                } else if (isDiff && c === maxVal) {
                  badgeClass = 'val-badge-max';
                  titleAttr += ' (Máximo de plantilla: Prioridad descanso 2028)';
                }

                return `
                  <td class="${isAct ? 'is-active-col' : ''}">
                    <span class="${badgeClass}" title="${titleAttr}">${c}</span>
                  </td>
                `;
              }).join('')}
              <td style="font-weight:700; color:var(--text-secondary);">${item.totalTimes || vals.reduce((a, b) => a + b, 0)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;

    // Fila de totales acumulados
    const totalAll = workers.reduce((acc, w) => acc + (totals[w.code] || 0), 0);
    const tfoot = `
      <tfoot>
        <tr style="background:var(--bg-card); font-weight:800; border-top:2px solid var(--border-color);">
          <td style="text-align:left; padding-left:14px; font-weight:800; color:var(--accent-primary);">
            TOTAL ACUMULADO (2011-2027)
          </td>
          ${workers.map(w => {
            const tot = totals[w.code] || 0;
            const isAct = w.code === currentCode;
            const isFull = tot >= 71;
            return `
              <td class="${isAct ? 'is-active-col' : ''}" style="font-size:0.85rem;">
                <span style="${isFull ? 'color:#10b981;' : 'color:#f59e0b;'} font-weight:800;">${tot}</span>
                <div style="font-size:0.6rem; color:var(--text-muted); font-weight:normal;">
                  ${isFull ? 'Equitativo' : '+1 en 2028'}
                </div>
              </td>
            `;
          }).join('')}
          <td style="font-size:0.85rem; font-weight:800; color:var(--accent-primary);">${totalAll}</td>
        </tr>
      </tfoot>
    `;

    el.holidayMatrixTable.innerHTML = thead + tbody + tfoot;

    // Conectar clics en el nombre de la festividad para abrir su línea de tiempo directa
    el.holidayMatrixTable.querySelectorAll('.matrix-fest-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const festName = link.dataset.fest;
        if (festName && el.selectHolidayCategory) {
          state.selectedHolidayTimeline = festName;
          el.selectHolidayCategory.value = festName;
          renderHolidayTimeline(festName);
          el.selectHolidayCategory.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  function renderHolidayPersonalList() {
    if (!el.holidayPersonalAllList || !window.HISTORICAL_DATA) return;
    const items = window.HISTORICAL_DATA.festivos.items;
    const currentCode = getWorkerShortCode(state.currentWorker);

    const workers = [
      { code: 'AJ', name: 'Antonio J' },
      { code: 'SM', name: 'Santi M' },
      { code: 'AH', name: 'Alberto H' },
      { code: 'FE', name: 'Fran Esp' },
      { code: 'MB', name: 'Miguel B' },
      { code: 'PC', name: 'Paco C' },
      { code: 'AL', name: 'A. León' }
    ];

    el.holidayPersonalAllList.innerHTML = items.map(item => {
      const counts = item.counts || {};
      const myCount = counts[currentCode] ?? 0;
      const vals = workers.map(w => counts[w.code] ?? 0);
      const minVal = Math.min(...vals);
      const maxVal = Math.max(...vals);
      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
      const isDiff = minVal !== maxVal;

      let cardClass = 'my-fest-item-card';
      let badgeHtml = '';
      let equityNote = '';

      if (isDiff && myCount === minVal) {
        cardClass += ' is-priority';
        badgeHtml = '<span class="val-badge-min" style="font-size:0.7rem;">🟢 Menos Realizada</span>';
        equityNote = `Has hecho esta fiesta <strong>${myCount} veces</strong> (el mínimo de la plantilla es ${minVal}, media del equipo: ${avg}). Candidato preferente para realizarla en el cuadrante de 2028 para equilibrar.`;
      } else if (isDiff && myCount === maxVal) {
        cardClass += ' is-resting';
        badgeHtml = '<span class="val-badge-max" style="font-size:0.7rem;">🟠 Más Realizada</span>';
        equityNote = `Has hecho esta fiesta <strong>${myCount} veces</strong> (el máximo de la plantilla es ${maxVal}, media del equipo: ${avg}). Tienes preferencia de descanso/libranza en 2028.`;
      } else {
        badgeHtml = `<span style="font-size:0.7rem; color:var(--text-secondary); background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px;">Equilibrado</span>`;
        equityNote = `Has hecho esta fiesta <strong>${myCount} veces</strong> (dentro del rango normal de la plantilla entre ${minVal} y ${maxVal}, media: ${avg}).`;
      }

      return `
        <div class="${cardClass}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${item.name}</div>
            <div>${badgeHtml}</div>
          </div>
          <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4;">
            ${equityNote}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:var(--text-muted); border-top:1px dashed var(--border-color); padding-top:6px; margin-top:2px;">
            <span>Mi cómputo: <strong style="color:var(--accent-primary); font-size:0.8rem;">${myCount} veces</strong></span>
            <span>Rango plantilla: ${minVal} - ${maxVal}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderHolidayEquityBars() {
    if (!el.holidayEquityBarsList || !window.HISTORICAL_DATA) return;
    const totals = window.HISTORICAL_DATA.festivos.totals;

    const workers = [
      { name: 'Antonio J', full: 'Antonio Jesús Sánchez', code: 'AJ' },
      { name: 'Santi M', full: 'Santiago Molina', code: 'SM' },
      { name: 'Miguel B', full: 'Miguel Benítez', code: 'MB' },
      { name: 'A. Leon', full: 'Antonio León', code: 'AL' },
      { name: 'Alberto H', full: 'Alberto Higueras', code: 'AH' },
      { name: 'Fran Espin', full: 'Francisco Espín', code: 'FE' },
      { name: 'Paco C', full: 'Francisco Cantarero', code: 'PC' }
    ];

    const maxCount = 71;

    el.holidayEquityBarsList.innerHTML = workers.map(w => {
      const count = totals[w.code] || 70;
      const pct = (count / maxCount) * 100;
      const isMax = count === 71;
      const isActive = w.name === state.currentWorker;

      return `
        <div class="holiday-equity-row" style="${isActive ? 'background:rgba(56,189,248,0.06); padding:6px 10px; border-radius:8px; border:1px solid rgba(56,189,248,0.2);' : ''}">
          <div class="holiday-equity-meta">
            <span class="holiday-equity-name" style="${isActive ? 'color:var(--accent-primary);' : ''}">
              ${isActive ? '👉 ' : ''}${w.name} <span style="font-size:0.72rem; color:var(--text-muted); font-weight:normal;">(${w.full})</span>
            </span>
            <div class="holiday-equity-counts">
              <strong>${count} festivos</strong>
              ${isMax 
                ? '<span style="font-size:0.7rem; background:rgba(16,185,129,0.18); color:#10b981; padding:2px 6px; border-radius:4px; font-weight:700;">Cumplido (71)</span>'
                : '<span style="font-size:0.7rem; background:rgba(245,158,11,0.18); color:#f59e0b; padding:2px 6px; border-radius:4px; font-weight:700;">Prioridad 2028 (+1)</span>'
              }
            </div>
          </div>
          <div class="holiday-bar-track">
            <div class="holiday-bar-fill ${isMax ? 'gold' : 'silver'}" style="width:${pct.toFixed(1)}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderMySpecialHolidays() {
    if (!el.mySpecialFestList || !window.HISTORICAL_DATA) return;
    const w = state.currentWorker;

    // Fiestas clave
    const specialFestivals = [
      {
        id: 'nochebuena',
        title: '🎄 Nochebuena (24 Dic)',
        historyLast: {
          'Antonio J': '2025',
          'Santi M': '2021 (antiguo Marcos Brito)',
          'Alberto H': '2027 (¡Este año te toca!)',
          'Fran Espin': '2023',
          'Miguel B': '2026 (antiguo AC)',
          'Paco C': '2024',
          'A. Leon': '2020',
          'Hilario': 'Exento',
          'Extra 1': 'Exento'
        },
        works2027: (w === 'Alberto H'),
        text2027: (w === 'Alberto H' ? 'Turno de Noche (23:00 - 07:00)' : 'Descanso / Libre'),
        forecast2028: 'A. León (Rotación anual)'
      },
      {
        id: 'nochevieja',
        title: '🍾 Nochevieja (31 Dic)',
        historyLast: {
          'Antonio J': '2020',
          'Santi M': '2023 (antiguo Marcos Brito)',
          'Alberto H': '2021 (antiguo DC)',
          'Fran Espin': '2025',
          'Miguel B': '2027 (¡Este año te toca!)',
          'Paco C': '2026',
          'A. Leon': '2024',
          'Hilario': 'Exento',
          'Extra 1': 'Exento'
        },
        works2027: (w === 'Miguel B'),
        text2027: (w === 'Miguel B' ? 'Turno de Noche (23:00 - 07:00)' : 'Descanso / Libre'),
        forecast2028: 'Antonio J (Rotación anual)'
      },
      {
        id: 'semana_santa',
        title: '⛪ Semana Santa',
        historyLast: {
          'Antonio J': '2027 (Jueves a Domingo Diurno con Santi M)',
          'Santi M': '2027 (Jueves a Domingo Diurno con Antonio J)',
          'Alberto H': '2026 (Diurno)',
          'Fran Espin': '2024 (Diurno)',
          'Miguel B': '2027 (Noches 25, 26 y 27 de Marzo)',
          'Paco C': '2025 (Diurno)',
          'A. Leon': '2025 (Diurno)',
          'Hilario': 'Exento',
          'Extra 1': 'Exento'
        },
        works2027: (w === 'Antonio J' || w === 'Santi M' || w === 'Miguel B'),
        text2027: (w === 'Miguel B' ? 'Noches (25, 26 y 27 Mar)' : (w === 'Antonio J' || w === 'Santi M' ? 'Mañana/Tarde (25 al 28 Mar)' : 'Descanso')),
        forecast2028: 'Rotación según festivos'
      },
      {
        id: 'virgen_cabeza',
        title: '👑 Romería Virgen de la Cabeza',
        historyLast: {
          'Antonio J': '2027 (23 al 26 Abr con Alberto H)',
          'Santi M': '2026 (Diurno con A. León)',
          'Alberto H': '2027 (23 al 26 Abr con Antonio J)',
          'Fran Espin': '2024 (Diurno con A. León)',
          'Miguel B': '2024 (Noche)',
          'Paco C': '2025 (Noche)',
          'A. Leon': '2027 (Noches 23, 24 y 25 Abr)',
          'Hilario': 'Exento',
          'Extra 1': 'Exento'
        },
        works2027: (w === 'Antonio J' || w === 'Alberto H' || w === 'A. Leon'),
        text2027: (w === 'A. Leon' ? 'Noches (23, 24 y 25 Abr)' : (w === 'Antonio J' || w === 'Alberto H' ? 'Mañana/Tarde (23 al 26 Abr)' : 'Descanso')),
        forecast2028: 'Rotación según festivos'
      }
    ];

    el.mySpecialFestList.innerHTML = specialFestivals.map(fest => {
      const isWorking = fest.works2027;
      const last = fest.historyLast[w] || 'Sin registro';

      return `
        <div class="my-fest-card ${isWorking ? 'active-this-year' : ''}">
          <div class="my-fest-title">
            <span>${fest.title}</span>
          </div>
          <div class="my-fest-year-history">
            <strong>Histórico:</strong> ${last}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted);">
            <strong>En 2027:</strong> ${fest.text2027}
          </div>
          <span class="my-fest-status-pill ${isWorking ? 'working' : 'free'}">
            ${isWorking ? '⚠️ En servicio 2027' : '🏖️ Descanso en 2027'}
          </span>
        </div>
      `;
    }).join('');
  }

  function populateHolidayCategories() {
    if (!el.selectHolidayCategory || !window.HISTORICAL_DATA) return;
    const items = window.HISTORICAL_DATA.festivos.items;
    el.selectHolidayCategory.innerHTML = items.map(item => {
      const sel = item.name === state.selectedHolidayTimeline ? 'selected' : '';
      return `<option value="${item.name}" ${sel}>${item.name}</option>`;
    }).join('');
  }

  function renderHolidayTimeline(holidayName) {
    if (!el.holidayTimelineContainer || !window.HISTORICAL_DATA) return;
    const item = window.HISTORICAL_DATA.festivos.items.find(i => i.name === holidayName);
    if (!item) {
      el.holidayTimelineContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem;">No se encontraron datos para esta fiesta.</div>';
      return;
    }

    const years = window.HISTORICAL_DATA.festivos.years.slice().reverse(); // 2027 down to 2011

    const codeExpander = {
      'AJ': 'Antonio J',
      'PS': 'Antonio J (predecesor PS)',
      'SM': 'Santi M',
      'PR': 'Santi M (predecesor PR)',
      'MB': 'Miguel B / Marcos Brito',
      'MG': 'Miguel B',
      'AC': 'Miguel B (predecesor AC)',
      'AH': 'Alberto H',
      'DC': 'Alberto H (predecesor DC)',
      'FE': 'Fran Espin',
      'JM': 'Fran Espin (predecesor JM)',
      'PC': 'Paco C',
      'AL': 'A. Leon',
      'FR': 'A. Leon (predecesor FR)',
      'HG': 'Hilario',
      'FH': 'FH (histórico)',
      'X': 'No celebrado / Sin turno'
    };

    function expandWorkerCodes(rawCode) {
      if (!rawCode || rawCode === 'None' || rawCode === '') return '<span style="color:var(--text-muted); font-style:italic;">Sin registro</span>';
      if (rawCode === 'X') return '<span style="color:var(--text-muted);">-</span>';
      
      const parts = rawCode.split('-');
      return parts.map(p => {
        const clean = p.trim();
        const expanded = codeExpander[clean] || clean;
        const isCurrent = clean === 'AJ' && state.currentWorker === 'Antonio J' ||
                          clean === 'SM' && state.currentWorker === 'Santi M' ||
                          clean === 'AH' && state.currentWorker === 'Alberto H' ||
                          clean === 'FE' && state.currentWorker === 'Fran Espin' ||
                          (clean === 'MB' || clean === 'MG') && state.currentWorker === 'Miguel B' ||
                          clean === 'PC' && state.currentWorker === 'Paco C' ||
                          clean === 'AL' && state.currentWorker === 'A. Leon';
        
        return `<span style="${isCurrent ? 'color:var(--accent-primary); font-weight:800;' : ''}">${expanded}</span>`;
      }).join(' <span style="color:var(--text-muted); font-weight:normal;">+</span> ');
    }

    // Estadísticas de equidad para este festivo
    const workers = [
      { code: 'AJ', name: 'Antonio J' },
      { code: 'SM', name: 'Santi M' },
      { code: 'AH', name: 'Alberto H' },
      { code: 'FE', name: 'Fran Esp' },
      { code: 'MB', name: 'Miguel B' },
      { code: 'PC', name: 'Paco C' },
      { code: 'AL', name: 'A. León' }
    ];

    const currentCode = getWorkerShortCode(state.currentWorker);
    const counts = item.counts || {};
    const vals = workers.map(w => counts[w.code] ?? 0);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const minWorkers = workers.filter(w => (counts[w.code] ?? 0) === minVal).map(w => w.name);
    const maxWorkers = workers.filter(w => (counts[w.code] ?? 0) === maxVal).map(w => w.name);

    const equityHeaderHtml = `
      <div class="holiday-timeline-equity-box">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <strong style="font-size:0.85rem; color:var(--text-primary);">
            ⚖️ Historial individual acumulado en "${item.name}" (2011 - 2027):
          </strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">
            Total veces realizada: <strong>${item.totalTimes || vals.reduce((a, b) => a + b, 0)}</strong>
          </span>
        </div>
        <div class="holiday-workers-equity-pills">
          ${workers.map(w => {
            const c = counts[w.code] ?? 0;
            const isAct = w.code === currentCode;
            const isMin = minVal !== maxVal && c === minVal;
            const isMax = minVal !== maxVal && c === maxVal;
            let cls = 'holiday-worker-pill';
            if (isAct) cls += ' is-active';
            if (isMin) cls += ' is-min';
            if (isMax) cls += ' is-max';

            return `
              <div class="${cls}" title="${w.name}: ${c} veces realizadas">
                <span>${w.name}:</span>
                <strong>${c}</strong>
                ${isMin ? '<span style="color:#10b981; font-size:0.68rem; font-weight:700;">(Mín)</span>' : ''}
                ${isMax ? '<span style="color:#f59e0b; font-size:0.68rem; font-weight:700;">(Máx)</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
        ${minVal !== maxVal ? `
          <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; border-top:1px dashed var(--border-color); padding-top:8px;">
            📌 <strong>Criterio para Cuadrante 2028:</strong> Prioridad de turno para 
            <span style="color:#10b981; font-weight:700;">${minWorkers.join(', ')}</span> (${minVal} veces) y preferencia de libranza para 
            <span style="color:#f59e0b; font-weight:700;">${maxWorkers.join(', ')}</span> (${maxVal} veces).
          </div>
        ` : `
          <div style="font-size:0.75rem; color:var(--text-secondary); border-top:1px dashed var(--border-color); padding-top:8px;">
            ✅ <strong>Equidad perfecta:</strong> Todos los compañeros han realizado esta fiesta exactamente ${minVal} veces.
          </div>
        `}
      </div>
    `;

    el.holidayTimelineContainer.innerHTML = `
      ${equityHeaderHtml}
      <div class="holiday-timeline-wrap">
        ${years.map(yr => {
          const raw = item.years[yr] || '';
          const is2027 = yr === 2027;
          return `
            <div class="holiday-timeline-row ${is2027 ? 'is-current' : ''}">
              <div class="holiday-timeline-year">
                ${yr} ${is2027 ? '<span style="font-size:0.65rem; background:rgba(56,189,248,0.2); color:#38bdf8; padding:1px 5px; border-radius:4px;">ACTUAL</span>' : ''}
              </div>
              <div class="holiday-timeline-workers">
                ${expandWorkerCodes(raw)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderFixed2027Holidays() {
    if (!el.fixedHolidays2027List) return;

    const fixed2027 = [
      { name: '01 Enero (Año Nuevo)', workers: 'A. León & Alberto H (M y T) · Santi M (Noche)' },
      { name: '06 Enero (Reyes)', workers: 'A. León & Alberto H (M y T)' },
      { name: '28 Febrero / 01 Marzo', workers: 'Fran Espín & Paco C (M y T)' },
      { name: 'Semana Santa (25-28 Mar)', workers: 'Antonio J & Santi M (M y T) · Miguel B (Noches 25, 26 y 27)' },
      { name: 'Virgen de la Cabeza (23-26 Abr)', workers: 'Antonio J & Alberto H (M y T) · A. León (Noches 23, 24 y 25)' },
      { name: '01 Mayo (Fiesta del Trabajo)', workers: 'Miguel B & Fran Espín (M y T)' },
      { name: '16 Agosto (Festivo local)', workers: 'Santi M & Extra 1 (M y T)' },
      { name: 'Feria de Septiembre (04-06 Sep)', workers: 'Antonio J (Feria) & Extra 1 · A. León (Noches)' },
      { name: '12 Octubre (Fiesta Nacional)', workers: 'Miguel B & Paco C (M y T)' },
      { name: '01 Noviembre (Todos los Santos)', workers: 'Antonio J & A. León (M y T)' },
      { name: '06 y 08 Diciembre (Puente)', workers: 'Paco C & Santi M (M y T)' },
      { name: '24 Diciembre (Nochebuena)', workers: 'Alberto H (Noche)' },
      { name: '25 Diciembre (Navidad)', workers: 'Miguel B & Fran Espín (M y T)' },
      { name: '31 Diciembre (Nochevieja)', workers: 'Miguel B (Noche)' }
    ];

    el.fixedHolidays2027List.innerHTML = fixed2027.map(f => {
      return `
        <div class="fixed-holiday-card">
          <div class="title">📅 ${f.name}</div>
          <div class="assigned">${f.workers}</div>
        </div>
      `;
    }).join('');
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
