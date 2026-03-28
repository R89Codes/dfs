'use strict';

(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const MAX_HISTORY = 25;
  const NODE_RADIUS = 24;
  const PLAY_BASE_MS = 900;
  const FILTER_STORAGE_KEY = 'dfs-single-filters-v1';
  const FILTER_TARGETS = {
    overview: ['#overview'],
    topology: ['#topologyCluster'],
    stackDepth: ['#stackDepthCluster'],
    scanInterval: ['#scanIntervalCluster'],
    dag: ['#dagPanel'],
    codeExplain: ['#codeExplainCluster'],
    history: ['#historySection'],
    complexity: ['#complexitySection']
  };
  const ESSENTIAL_FILTERS = {
    overview: false,
    topology: true,
    stackDepth: true,
    scanInterval: true,
    dag: false,
    codeExplain: true,
    history: false,
    complexity: false
  };
  const VISUAL_THEME = {
    label: '#f3f6fb',
    meta: '#98a4bb',
    badge: '#ffbf72',
    panelFill: 'rgba(8, 11, 17, 0.92)',
    panelFillActive: 'rgba(53, 210, 195, 0.18)',
    panelStroke: 'rgba(196, 208, 226, 0.14)',
    orderLabel: '#ffbf72',
    orderLabelActive: '#d9fff9',
    nodeStrokeDefault: 'rgba(198, 208, 226, 0.22)',
    nodeStrokeGray: '#ffc379',
    nodeStrokeBlack: '#63e3ca',
    nodeHaloActive: 'rgba(53, 210, 195, 0.54)',
    nodeHaloCycle: 'rgba(212, 106, 120, 0.48)',
    gridSoft: 'rgba(188, 198, 220, 0.08)',
    axis: 'rgba(188, 198, 220, 0.24)',
    depthLink: '#48c7ff',
    intervalOpen: '#ffbf72',
    intervalClosed: '#63e3ca',
    intervalCurrent: '#35d2c3',
    chartDfs: '#35d2c3',
    chartBfs: '#7f83ff',
    chartContrast: '#d46a78',
    edge: {
      default: 'rgba(230, 238, 251, 0.24)',
      tree: '#48c7ff',
      back: '#ffb761',
      forward: '#8b8cff',
      cross: '#34c88a',
      active: '#35d2c3'
    }
  };

  const state = {
    mode: 'dfs',
    selectedPresetId: APP_CONTENT.presets[0].id,
    graph: null,
    nodePositions: {},
    steps: [],
    stepIndex: -1,
    playing: false,
    playToken: 0,
    history: [],
    status: 'Idle',
    codeHoverTip: 'Hover a line for the teaching note. The active line is highlighted during playback.',
    visuals: createEmptyVisuals(),
    panelFilters: {
      overview: true,
      topology: true,
      stackDepth: true,
      scanInterval: true,
      dag: true,
      codeExplain: true,
      history: true,
      complexity: true
    },
    tour: {
      steps: [],
      index: 0,
      active: false,
      mode: 'idle',
      actionSatisfied: false,
      overlay: null,
      spotlight: null,
      card: null,
      title: null,
      body: null,
      counter: null,
      nextBtn: null,
      backBtn: null,
      skipBtn: null,
      highlighted: null,
      masks: {}
    }
  };

  const dom = {
    modeRow: document.getElementById('modeRow'),
    graphInput: document.getElementById('graphInput'),
    presetGrid: document.getElementById('presetGrid'),
    presetNote: document.getElementById('presetNote'),
    speed: document.getElementById('speed'),
    speedLabel: document.getElementById('speedLabel'),
    startNode: document.getElementById('startNode'),
    buildBtn: document.getElementById('buildBtn'),
    stepBackBtn: document.getElementById('stepBackBtn'),
    stepBtn: document.getElementById('stepBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    skipBtn: document.getElementById('skipBtn'),
    resetBtn: document.getElementById('resetBtn'),
    topTutorialBtn: document.getElementById('topTutorialBtn'),
    topFilterBtn: document.getElementById('topFilterBtn'),
    topFilterMenu: document.getElementById('topFilterMenu'),
    startTourBtn: document.getElementById('startTourBtn'),
    startPracticeBtn: document.getElementById('startPracticeBtn'),
    showEssentialsBtn: document.getElementById('showEssentialsBtn'),
    showAllBtn: document.getElementById('showAllBtn'),
    filterGrid: document.getElementById('filterGrid'),
    overview: document.getElementById('overview'),
    graphSvg: document.getElementById('graphSvg'),
    topoPanel: document.getElementById('topoPanel'),
    topoRow: document.getElementById('topoRow'),
    cycleCallout: document.getElementById('cycleCallout'),
    stackDepthLabel: document.getElementById('stackDepthLabel'),
    stackList: document.getElementById('stackList'),
    depthSvg: document.getElementById('depthSvg'),
    depthSummary: document.getElementById('depthSummary'),
    scanSummary: document.getElementById('scanSummary'),
    scanRow: document.getElementById('scanRow'),
    intervalSvg: document.getElementById('intervalSvg'),
    dagPanel: document.getElementById('dagPanel'),
    dagSummary: document.getElementById('dagSummary'),
    pseudocode: document.getElementById('pseudocode'),
    codeHoverTip: document.getElementById('codeHoverTip'),
    explanationBox: document.getElementById('explanationBox'),
    historyBody: document.getElementById('historyBody'),
    complexitySvg: document.getElementById('complexitySvg'),
    complexityMetrics: document.getElementById('complexityMetrics'),
    vertexSlider: document.getElementById('vertexSlider'),
    edgeSlider: document.getElementById('edgeSlider'),
    vertexLabel: document.getElementById('vertexLabel'),
    edgeLabel: document.getElementById('edgeLabel'),
    stepCounter: document.getElementById('stepCounter'),
    statusText: document.getElementById('statusText'),
    nodesVisited: document.getElementById('nodesVisited'),
    edgesExplored: document.getElementById('edgesExplored'),
    treeEdges: document.getElementById('treeEdges'),
    backEdges: document.getElementById('backEdges'),
    componentCount: document.getElementById('componentCount'),
    timerValue: document.getElementById('timerValue')
  };

  const edgeEls = new Map();
  const nodeEls = new Map();

  function createEmptyVisuals() {
    return {
      nodeColors: {},
      discovery: {},
      finish: {},
      parents: {},
      depths: {},
      edgeTypes: {},
      activeNode: null,
      activeEdge: null,
      stack: [],
      topoOrder: [],
      cycleFound: false,
      cycleEdge: null,
      cyclePath: [],
      timer: 0,
      nodesVisited: 0,
      edgesExplored: 0,
      treeEdges: 0,
      backEdges: 0,
      components: 0,
      maxDepth: 0,
      currentStepType: 'idle',
      dagDp: null
    };
  }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function cloneVisuals(visuals) {
    return {
      nodeColors: { ...visuals.nodeColors },
      discovery: { ...visuals.discovery },
      finish: { ...visuals.finish },
      parents: { ...visuals.parents },
      depths: { ...visuals.depths },
      edgeTypes: { ...visuals.edgeTypes },
      activeNode: visuals.activeNode,
      activeEdge: visuals.activeEdge ? { ...visuals.activeEdge } : null,
      stack: [...visuals.stack],
      topoOrder: [...visuals.topoOrder],
      cycleFound: visuals.cycleFound,
      cycleEdge: visuals.cycleEdge ? { ...visuals.cycleEdge } : null,
      cyclePath: [...visuals.cyclePath],
      timer: visuals.timer,
      nodesVisited: visuals.nodesVisited,
      edgesExplored: visuals.edgesExplored,
      treeEdges: visuals.treeEdges,
      backEdges: visuals.backEdges,
      components: visuals.components,
      maxDepth: visuals.maxDepth,
      currentStepType: visuals.currentStepType,
      dagDp: visuals.dagDp
        ? {
            source: visuals.dagDp.source,
            topoOrder: [...visuals.dagDp.topoOrder],
            distances: { ...visuals.dagDp.distances },
            parents: { ...visuals.dagDp.parents },
            bestEnd: visuals.dagDp.bestEnd,
            bestPath: [...visuals.dagDp.bestPath],
            bestDistance: visuals.dagDp.bestDistance
          }
        : null
    };
  }

  function init() {
    buildModeButtons();
    buildPresetButtons();
    bindEvents();
    initializeFilters();
    initializeTour();
    loadPreset(APP_CONTENT.presets[0].id, true);
    renderOverview();
    renderPseudocode();
    updateSpeedLabel();
    drawComplexityChart();
    buildSteps();
    showTourWelcome();
  }

  function buildModeButtons() {
    dom.modeRow.innerHTML = '';
    Object.entries(APP_CONTENT.modes).forEach(([modeId, config]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `mode-btn${modeId === state.mode ? ' active' : ''}`;
      button.textContent = config.label;
      button.addEventListener('click', () => setMode(modeId));
      dom.modeRow.appendChild(button);
    });
  }

  function buildPresetButtons() {
    dom.presetGrid.innerHTML = '';
    APP_CONTENT.presets.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `preset-btn${preset.id === state.selectedPresetId ? ' active' : ''}`;
      button.textContent = preset.label;
      button.addEventListener('click', () => loadPreset(preset.id, false));
      dom.presetGrid.appendChild(button);
    });
  }

  function bindEvents() {
    dom.buildBtn.addEventListener('click', buildSteps);
    dom.stepBackBtn.addEventListener('click', stepBack);
    dom.stepBtn.addEventListener('click', stepForward);
    dom.playBtn.addEventListener('click', play);
    dom.pauseBtn.addEventListener('click', pause);
    dom.skipBtn.addEventListener('click', skipToEnd);
    dom.resetBtn.addEventListener('click', resetPlayback);
    if (dom.topTutorialBtn) {
      dom.topTutorialBtn.addEventListener('click', showTourWelcome);
    }
    if (dom.topFilterBtn) {
      dom.topFilterBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        setFilterMenuOpen(!isFilterMenuOpen());
      });
    }
    if (dom.topFilterMenu) {
      dom.topFilterMenu.addEventListener('click', (event) => event.stopPropagation());
    }
    if (dom.startTourBtn) {
      dom.startTourBtn.addEventListener('click', showTourWelcome);
    }
    if (dom.startPracticeBtn) {
      dom.startPracticeBtn.addEventListener('click', () => startPractice(true));
    }
    if (dom.showEssentialsBtn) {
      dom.showEssentialsBtn.addEventListener('click', () => {
        applyFilterPreset(ESSENTIAL_FILTERS);
        notifyTourAction('filter:essentials');
      });
    }
    if (dom.showAllBtn) {
      dom.showAllBtn.addEventListener('click', () => applyFilterPreset(allFilters(true)));
    }
    dom.speed.addEventListener('input', updateSpeedLabel);
    dom.vertexSlider.addEventListener('input', drawComplexityChart);
    dom.edgeSlider.addEventListener('input', drawComplexityChart);
    dom.graphInput.addEventListener('input', () => {
      state.selectedPresetId = '';
      buildPresetButtons();
      dom.presetNote.textContent = 'Custom graph detected. Build steps when you are ready.';
      syncStartNodesFromText();
    });
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('keydown', handleDocumentKeydown);
    }
  }

  function initializeFilters() {
    const stored = safeReadJSON(FILTER_STORAGE_KEY);
    if (stored) {
      state.panelFilters = { ...state.panelFilters, ...stored };
    }

    const labels = dom.filterGrid ? Array.from(dom.filterGrid.children) : [];
    labels.forEach((label) => {
      const input = label.children && label.children[0];
      if (!input || !input.dataset || !input.dataset.filterKey) {
        return;
      }
      const key = input.dataset.filterKey;
      input.checked = state.panelFilters[key] !== false;
      input.addEventListener('change', () => {
        state.panelFilters[key] = input.checked;
        applyFilters();
      });
    });

    applyFilters();
  }

  function applyFilterPreset(preset) {
    state.panelFilters = { ...state.panelFilters, ...preset };
    const labels = dom.filterGrid ? Array.from(dom.filterGrid.children) : [];
    labels.forEach((label) => {
      const input = label.children && label.children[0];
      if (!input || !input.dataset || !input.dataset.filterKey) {
        return;
      }
      input.checked = state.panelFilters[input.dataset.filterKey] !== false;
    });
    applyFilters();
  }

  function applyFilters() {
    Object.entries(FILTER_TARGETS).forEach(([key, selectors]) => {
      const shouldShow = state.panelFilters[key] !== false;
      selectors.forEach((selector) => {
        const target = document.querySelector ? document.querySelector(selector) : null;
        if (target) {
          target.classList.toggle('is-hidden-filter', !shouldShow);
        }
      });
    });

    safeWriteJSON(FILTER_STORAGE_KEY, state.panelFilters);
  }

  function initializeTour() {
    if (!document.body) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.innerHTML = `
      <div class="tour-mask" id="tourMaskTop"></div>
      <div class="tour-mask" id="tourMaskRight"></div>
      <div class="tour-mask" id="tourMaskBottom"></div>
      <div class="tour-mask" id="tourMaskLeft"></div>
      <div class="tour-spotlight" id="tourSpotlight"></div>
      <div class="tour-card" role="dialog" aria-modal="true" aria-live="polite">
        <p class="tour-step" id="tourStepCount">Guided Tour</p>
        <h3 id="tourTitle">Tour</h3>
        <p id="tourBody">Walk through the interface step by step.</p>
        <div class="tour-actions">
          <button type="button" id="tourBackBtn" class="secondary">Back</button>
          <button type="button" id="tourNextBtn">Next</button>
          <button type="button" id="tourSkipBtn" class="secondary">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    state.tour.overlay = overlay;
    state.tour.card = overlay.querySelector('.tour-card');
    state.tour.spotlight = overlay.querySelector('#tourSpotlight');
    state.tour.counter = overlay.querySelector('#tourStepCount');
    state.tour.title = overlay.querySelector('#tourTitle');
    state.tour.body = overlay.querySelector('#tourBody');
    state.tour.backBtn = overlay.querySelector('#tourBackBtn');
    state.tour.nextBtn = overlay.querySelector('#tourNextBtn');
    state.tour.skipBtn = overlay.querySelector('#tourSkipBtn');
    state.tour.masks = {
      top: overlay.querySelector('#tourMaskTop'),
      right: overlay.querySelector('#tourMaskRight'),
      bottom: overlay.querySelector('#tourMaskBottom'),
      left: overlay.querySelector('#tourMaskLeft')
    };

    state.tour.backBtn.addEventListener('click', previousTourStep);
    state.tour.nextBtn.addEventListener('click', nextTourStep);
    state.tour.skipBtn.addEventListener('click', stopTour);
    window.addEventListener('scroll', handleTourViewportChange, { passive: true });
    window.addEventListener('resize', handleTourViewportChange);
  }

  function getTourSteps() {
    return [
      ...APP_CONTENT.tours.common,
      ...(APP_CONTENT.tours[state.mode] || [])
    ];
  }

  function getPracticeSteps() {
    return [
      ...APP_CONTENT.practice.common,
      ...(APP_CONTENT.practice[state.mode] || [])
    ];
  }

  function startTour(forceRestart) {
    if (!state.tour.overlay) {
      return;
    }
    setFilterMenuOpen(false);
    applyFilterPreset(allFilters(true));
    state.tour.steps = getTourSteps();
    state.tour.index = 0;
    state.tour.active = true;
    state.tour.mode = 'tour';
    state.tour.actionSatisfied = false;
    state.tour.overlay.classList.add('open');
    renderTourStep();
  }

  function startPractice(forceRestart) {
    if (!state.tour.overlay) {
      return;
    }
    setFilterMenuOpen(false);
    applyFilterPreset(ESSENTIAL_FILTERS);
    state.tour.steps = getPracticeSteps();
    state.tour.index = 0;
    state.tour.active = true;
    state.tour.mode = 'practice';
    state.tour.actionSatisfied = false;
    state.tour.overlay.classList.add('open');
    renderTourStep();
  }

  function showTourWelcome() {
    if (!state.tour.overlay) {
      return;
    }
    setFilterMenuOpen(false);
    state.tour.active = true;
    state.tour.mode = 'welcome';
    state.tour.overlay.classList.add('open');
    clearSpotlight();
    state.tour.counter.textContent = 'Welcome';
    state.tour.title.textContent = 'Quick Tour or Explore?';
    state.tour.body.textContent = 'Choose Quick Tour if you want the interface explained step by step. Choose Explore if you want to use the page freely and start the tour later from the Tutorial button in the top-right corner.';
    state.tour.backBtn.style.display = 'none';
    state.tour.nextBtn.textContent = 'Quick Tour';
    state.tour.skipBtn.textContent = 'I Want to Explore';
  }

  function stopTour() {
    if (!state.tour.overlay) {
      return;
    }
    if (state.tour.highlighted) {
      state.tour.highlighted.classList.remove('tour-target-active');
    }
    state.tour.active = false;
    state.tour.mode = 'idle';
    state.tour.actionSatisfied = false;
    state.tour.highlighted = null;
    state.tour.overlay.classList.remove('open');
    clearSpotlight();
    if (dom.topTutorialBtn) {
      dom.topTutorialBtn.focus();
    } else if (dom.startTourBtn) {
      dom.startTourBtn.focus();
    }
  }

  function nextTourStep() {
    if (!state.tour.active) {
      return;
    }
    if (state.tour.mode === 'welcome') {
      state.tour.backBtn.style.display = '';
      state.tour.skipBtn.textContent = 'Skip';
      startTour(false);
      return;
    }
    if (state.tour.mode === 'practice') {
      const step = state.tour.steps[state.tour.index];
      if (step && step.action && !state.tour.actionSatisfied) {
        return;
      }
    }
    if (state.tour.index >= state.tour.steps.length - 1) {
      stopTour();
      return;
    }
    state.tour.index += 1;
    state.tour.actionSatisfied = false;
    renderTourStep();
  }

  function previousTourStep() {
    if (!state.tour.active || state.tour.mode !== 'tour') {
      return;
    }
    state.tour.index = Math.max(0, state.tour.index - 1);
    renderTourStep();
  }

  function renderTourStep() {
    const step = state.tour.steps[state.tour.index];
    if (!step) {
      stopTour();
      return;
    }

    if (state.tour.highlighted) {
      state.tour.highlighted.classList.remove('tour-target-active');
      state.tour.highlighted = null;
    }

    const target = resolveTourTarget(step.target);
    if (target) {
      prepareTourTarget(target);
      state.tour.highlighted = target;
      target.classList.add('tour-target-active');
      ensureTargetVisible(target);
      window.setTimeout(handleTourViewportChange, 0);
      window.setTimeout(handleTourViewportChange, 120);
    } else {
      state.tour.highlighted = null;
      clearSpotlight();
    }

    state.tour.counter.textContent = `Step ${state.tour.index + 1} of ${state.tour.steps.length}`;
    state.tour.title.textContent = step.title;
    if (state.tour.mode === 'practice' && step.action) {
      state.tour.body.textContent = state.tour.actionSatisfied
        ? (step.doneText || step.body)
        : `${step.body} ${step.waitingText || ''}`.trim();
    } else {
      state.tour.body.textContent = step.body;
    }
    state.tour.backBtn.disabled = state.tour.index === 0;
    state.tour.backBtn.style.display = '';
    state.tour.skipBtn.textContent = 'Skip';
    state.tour.nextBtn.textContent = state.tour.index === state.tour.steps.length - 1 ? 'Done' : 'Next';
    state.tour.nextBtn.disabled = state.tour.mode === 'practice' && step.action && !state.tour.actionSatisfied;
  }

  function ensureTargetVisible(target) {
    if (typeof target.getBoundingClientRect !== 'function' || typeof target.scrollIntoView !== 'function') {
      return;
    }
    const rect = target.getBoundingClientRect();
    const marginTop = 90;
    const marginBottom = 140;
    const viewportHeight = window.innerHeight || 900;
    if (rect.top < marginTop || rect.bottom > viewportHeight - marginBottom) {
      target.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }

  function prepareTourTarget(target) {
    if (!target || typeof target.closest !== 'function') {
      return;
    }
    const filterMenu = target.closest('#topFilterMenu');
    if (filterMenu) {
      setFilterMenuOpen(true);
    }
  }

  function updateSpotlight(target) {
    if (!state.tour.spotlight || typeof target.getBoundingClientRect !== 'function') {
      return;
    }
    const rect = target.getBoundingClientRect();
    const padding = 12;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
    const left = Math.max(8, Math.round(rect.left - padding));
    const top = Math.max(8, Math.round(rect.top - padding));
    const right = Math.min(viewportWidth - 8, Math.round(rect.right + padding));
    const bottom = Math.min(viewportHeight - 8, Math.round(rect.bottom + padding));

    state.tour.spotlight.style.left = `${left}px`;
    state.tour.spotlight.style.top = `${top}px`;
    state.tour.spotlight.style.width = `${Math.max(24, right - left)}px`;
    state.tour.spotlight.style.height = `${Math.max(24, bottom - top)}px`;
    state.tour.spotlight.classList.add('open');

    if (!state.tour.masks) {
      return;
    }

    const topMask = state.tour.masks.top;
    const rightMask = state.tour.masks.right;
    const bottomMask = state.tour.masks.bottom;
    const leftMask = state.tour.masks.left;

    if (topMask) {
      topMask.style.left = '0px';
      topMask.style.top = '0px';
      topMask.style.width = `${viewportWidth}px`;
      topMask.style.height = `${Math.max(0, top)}px`;
    }
    if (bottomMask) {
      bottomMask.style.left = '0px';
      bottomMask.style.top = `${bottom}px`;
      bottomMask.style.width = `${viewportWidth}px`;
      bottomMask.style.height = `${Math.max(0, viewportHeight - bottom)}px`;
    }
    if (leftMask) {
      leftMask.style.left = '0px';
      leftMask.style.top = `${top}px`;
      leftMask.style.width = `${Math.max(0, left)}px`;
      leftMask.style.height = `${Math.max(0, bottom - top)}px`;
    }
    if (rightMask) {
      rightMask.style.left = `${right}px`;
      rightMask.style.top = `${top}px`;
      rightMask.style.width = `${Math.max(0, viewportWidth - right)}px`;
      rightMask.style.height = `${Math.max(0, bottom - top)}px`;
    }
  }

  function clearSpotlight() {
    if (state.tour.spotlight) {
      state.tour.spotlight.classList.remove('open');
    }
    if (!state.tour.masks) {
      return;
    }
    Object.values(state.tour.masks).forEach((mask) => {
      if (!mask) {
        return;
      }
      mask.style.width = '0px';
      mask.style.height = '0px';
    });
  }

  function handleTourViewportChange() {
    if (!state.tour.active || !state.tour.highlighted || !state.tour.spotlight) {
      return;
    }
    updateSpotlight(state.tour.highlighted);
  }

  function resolveTourTarget(selector) {
    if (!selector) {
      return null;
    }
    if (selector.startsWith('#')) {
      return document.getElementById(selector.slice(1));
    }
    return document.querySelector ? document.querySelector(selector) : null;
  }

  function safeWriteJSON(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  function safeReadJSON(key) {
    try {
      if (!window.localStorage) {
        return null;
      }
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function isFilterMenuOpen() {
    return !!(dom.topFilterMenu && dom.topFilterMenu.classList.contains('open'));
  }

  function setFilterMenuOpen(open) {
    if (!dom.topFilterMenu) {
      return;
    }
    dom.topFilterMenu.classList.toggle('open', open);
    if (dom.topFilterBtn) {
      dom.topFilterBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  function handleDocumentClick(event) {
    if (!isFilterMenuOpen()) {
      return;
    }
    const target = event.target;
    if (dom.topFilterMenu && dom.topFilterMenu.contains(target)) {
      return;
    }
    if (dom.topFilterBtn && dom.topFilterBtn.contains(target)) {
      return;
    }
    setFilterMenuOpen(false);
  }

  function handleDocumentKeydown(event) {
    if (event.key === 'Escape') {
      setFilterMenuOpen(false);
    }
  }

  function allFilters(value) {
    return Object.keys(FILTER_TARGETS).reduce((acc, key) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  function updateSpeedLabel() {
    dom.speedLabel.textContent = `${Number(dom.speed.value).toFixed(2)}x`;
  }

  function notifyTourAction(actionName) {
    if (!state.tour.active || state.tour.mode !== 'practice') {
      return;
    }
    const step = state.tour.steps[state.tour.index];
    if (!step || !step.action) {
      return;
    }
    if (step.action === actionName) {
      state.tour.actionSatisfied = true;
      renderTourStep();
    }
  }

  function setMode(modeId) {
    if (modeId === state.mode) {
      return;
    }
    state.mode = modeId;
    notifyTourAction(`mode:${modeId}`);
    buildModeButtons();
    renderOverview();
    renderPseudocode();
    updateModePanels();
    state.status = `Mode switched to ${APP_CONTENT.modes[modeId].label}`;
    updateStats();
    buildSteps();
  }

  function loadPreset(presetId, silentModeChange) {
    const preset = APP_CONTENT.presets.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    state.selectedPresetId = preset.id;
    dom.graphInput.value = preset.graph;
    dom.presetNote.textContent = preset.note;

    if (!silentModeChange && preset.defaultMode !== state.mode) {
      state.mode = preset.defaultMode;
      buildModeButtons();
      renderOverview();
      renderPseudocode();
    }

    buildPresetButtons();
    syncStartNodesFromText();
  }

  function syncStartNodesFromText() {
    const parsed = parseGraph(dom.graphInput.value);
    populateStartNodes(parsed.nodes);
  }

  function populateStartNodes(nodes) {
    const previous = dom.startNode.value;
    dom.startNode.innerHTML = '';

    if (!nodes.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No nodes';
      dom.startNode.appendChild(option);
      return;
    }

    nodes.forEach((node) => {
      const option = document.createElement('option');
      option.value = node;
      option.textContent = node;
      dom.startNode.appendChild(option);
    });

    if (nodes.includes(previous)) {
      dom.startNode.value = previous;
    }
  }

  function parseGraph(text) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const nodeSet = new Set();
    const adjacency = {};
    const edges = [];
    const edgeSet = new Set();

    function ensureNode(node) {
      if (!nodeSet.has(node)) {
        nodeSet.add(node);
        adjacency[node] = [];
      }
    }

    lines.forEach((line) => {
      const splitAt = line.indexOf(':');
      if (splitAt === -1) {
        return;
      }

      const source = line.slice(0, splitAt).trim();
      if (!source) {
        return;
      }

      ensureNode(source);
      const rhs = line.slice(splitAt + 1).trim();
      if (!rhs) {
        return;
      }

      rhs
        .split(/[\s,]+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .forEach((target) => {
          ensureNode(target);
          const key = `${source}->${target}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            adjacency[source].push(target);
            edges.push({ from: source, to: target });
          }
        });
    });

    const nodes = Array.from(nodeSet);
    nodes.forEach((node) => {
      adjacency[node].sort();
    });
    edges.sort((a, b) => `${a.from}->${a.to}`.localeCompare(`${b.from}->${b.to}`));

    const bidirectional = new Set();
    edges.forEach((edge) => {
      if (edgeSet.has(`${edge.to}->${edge.from}`) && edge.from !== edge.to) {
        bidirectional.add(`${edge.from}->${edge.to}`);
      }
    });

    return {
      nodes,
      adjacency,
      edges,
      bidirectional,
      branchPriority: {}
    };
  }

  function assignBranchPriorities(graph) {
    if (!graph || !graph.nodes.length) {
      return graph;
    }

    graph.branchPriority = {};
    graph.nodes.forEach((node) => {
      graph.adjacency[node].forEach((neighbor) => {
        graph.branchPriority[edgeKey(node, neighbor)] = 1 + Math.floor(Math.random() * 5);
      });
      graph.adjacency[node].sort((left, right) => {
        const leftPriority = graph.branchPriority[edgeKey(node, left)];
        const rightPriority = graph.branchPriority[edgeKey(node, right)];
        return leftPriority - rightPriority || left.localeCompare(right);
      });
    });

    return graph;
  }

  function computeLayout(graph) {
    const topoAttempt = kahnTopo(graph);
    if (topoAttempt.acyclic) {
      return layeredLayout(graph, topoAttempt.order);
    }
    return circularLayout(graph.nodes);
  }

  function kahnTopo(graph) {
    const indegree = {};
    graph.nodes.forEach((node) => {
      indegree[node] = 0;
    });
    graph.edges.forEach((edge) => {
      indegree[edge.to] += 1;
    });

    const queue = graph.nodes.filter((node) => indegree[node] === 0).sort();
    const order = [];

    while (queue.length) {
      const node = queue.shift();
      order.push(node);
      graph.adjacency[node].forEach((neighbor) => {
        indegree[neighbor] -= 1;
        if (indegree[neighbor] === 0) {
          queue.push(neighbor);
          queue.sort();
        }
      });
    }

    return {
      acyclic: order.length === graph.nodes.length,
      order
    };
  }

  function layeredLayout(graph, order) {
    const level = {};
    graph.nodes.forEach((node) => {
      level[node] = 0;
    });

    order.forEach((node) => {
      graph.adjacency[node].forEach((neighbor) => {
        level[neighbor] = Math.max(level[neighbor], level[node] + 1);
      });
    });

    const buckets = new Map();
    order.forEach((node) => {
      const bucket = level[node];
      if (!buckets.has(bucket)) {
        buckets.set(bucket, []);
      }
      buckets.get(bucket).push(node);
    });

    const maxLevel = Math.max(...Array.from(buckets.keys()), 0);
    const width = 900;
    const height = 470;
    const positions = {};

    Array.from(buckets.entries()).forEach(([bucket, nodes]) => {
      const x = maxLevel === 0 ? width / 2 : 90 + (bucket / maxLevel) * (width - 180);
      const gap = height / (nodes.length + 1);
      nodes.forEach((node, index) => {
        positions[node] = {
          x,
          y: gap * (index + 1)
        };
      });
    });

    return positions;
  }

  function circularLayout(nodes) {
    const width = 900;
    const height = 470;
    const cx = width / 2;
    const cy = height / 2;
    const rx = Math.min(310, 120 + nodes.length * 16);
    const ry = Math.min(170, 90 + nodes.length * 10);
    const positions = {};

    nodes.forEach((node, index) => {
      const angle = (-Math.PI / 2) + (index / nodes.length) * Math.PI * 2;
      positions[node] = {
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry
      };
    });

    return positions;
  }

  function buildSteps() {
    pause();

    const graph = assignBranchPriorities(parseGraph(dom.graphInput.value));
    state.graph = graph;
    state.nodePositions = computeLayout(graph);
    syncComplexitySlidersToGraph(graph);
    populateStartNodes(graph.nodes);

    if (!graph.nodes.length) {
      state.steps = [];
      state.stepIndex = -1;
      state.history = [];
      state.visuals = createEmptyVisuals();
      state.status = 'No graph loaded';
      renderGraph();
      updateStats();
      renderHistory();
      renderPseudocode();
      renderOverview();
      dom.explanationBox.textContent = 'Enter an adjacency list to build steps.';
      renderAuxiliaryPanels();
      drawComplexityChart();
      return;
    }

    state.steps = generateSteps(graph, state.mode, dom.startNode.value || graph.nodes[0]);
    state.stepIndex = 0;
    state.history = [];
    renderGraph();
    applyStep(0);
    state.status = `Built ${state.steps.length} steps for ${APP_CONTENT.modes[state.mode].label}`;
    updateStats();
    drawComplexityChart();
    notifyTourAction('build');
  }

  function generateSteps(graph, mode, requestedStartNode) {
    const visuals = createEmptyVisuals();
    graph.nodes.forEach((node) => {
      visuals.nodeColors[node] = 'WHITE';
      visuals.parents[node] = null;
    });

    const steps = [];
    const startOrder = graph.nodes.includes(requestedStartNode)
      ? [requestedStartNode, ...graph.nodes.filter((node) => node !== requestedStartNode)]
      : [...graph.nodes];

    pushStep(steps, {
      type: 'init',
      codeLine: 0,
      focus: graph.nodes.length ? graph.nodes[0] : '',
      explanation: `Initialize ${graph.nodes.length} vertices to WHITE, clear parents, and set the DFS timer to 0.`,
      visuals
    });

    function visit(node, depth) {
      visuals.stack.push(node);
      visuals.timer += 1;
      visuals.discovery[node] = visuals.timer;
      visuals.depths[node] = depth;
      visuals.maxDepth = Math.max(visuals.maxDepth, depth);
      visuals.nodeColors[node] = 'GRAY';
      visuals.nodesVisited += 1;
      visuals.activeNode = node;
      visuals.activeEdge = null;
      visuals.currentStepType = 'discover';

      pushStep(steps, {
        type: 'discover',
        codeLine: mode === 'topo' ? 11 : mode === 'cycle' ? 9 : 10,
        focus: node,
        explanation: `Discover ${node}: timer becomes ${visuals.timer}, so d[${node}] = ${visuals.discovery[node]}. ${node} turns GRAY and is pushed onto the recursion stack at depth ${depth}.`,
        visuals
      });

      graph.adjacency[node].forEach((neighbor, neighborIndex) => {
        visuals.activeNode = node;
        visuals.activeEdge = { from: node, to: neighbor };
        visuals.edgesExplored += 1;
        visuals.currentStepType = 'edge';

        pushStep(steps, {
          type: 'examine-edge',
          codeLine: mode === 'topo' ? 13 : mode === 'cycle' ? 11 : 13,
          focus: `${node} -> ${neighbor}`,
          explanation: `Examine edge ${node} -> ${neighbor}. Adj[${node}] is ordered as [${graph.adjacency[node].map((item) => `${item}(P${graph.branchPriority[edgeKey(node, item)]})`).join(', ')}]. ${neighbor} is position ${neighborIndex + 1} with priority P${graph.branchPriority[edgeKey(node, neighbor)]} and current color ${visuals.nodeColors[neighbor]}.`,
          visuals
        });

        const edgeType = classifyEdge(visuals, node, neighbor);
        visuals.edgeTypes[edgeKey(node, neighbor)] = edgeType;
        if (edgeType === 'tree') {
          visuals.treeEdges += 1;
        }
        if (edgeType === 'back') {
          visuals.backEdges += 1;
          visuals.cycleFound = true;
          visuals.cycleEdge = { from: node, to: neighbor };
          visuals.cyclePath = extractCyclePath(visuals.stack, neighbor).concat(neighbor);
        }
        visuals.currentStepType = 'classify';

        pushStep(steps, {
          type: 'classify-edge',
          codeLine: mode === 'topo' ? 13 : mode === 'cycle' ? 12 : 14,
          focus: `${node} -> ${neighbor}`,
          explanation: edgeExplanation(visuals, node, neighbor, edgeType),
          visuals
        });

        if (edgeType === 'tree') {
          visuals.parents[neighbor] = node;
          visuals.currentStepType = 'recurse';
          pushStep(steps, {
            type: 'recurse',
            codeLine: mode === 'topo' ? 15 : mode === 'cycle' ? 15 : 17,
            focus: `${node} -> ${neighbor}`,
            explanation: `${neighbor} is WHITE, so ${node} -> ${neighbor} is a tree edge. Set parent[${neighbor}] = ${node} and recurse deeper.`,
            visuals
          });
          visit(neighbor, depth + 1);
          visuals.activeNode = node;
          visuals.activeEdge = { from: node, to: neighbor };
        }
      });

      visuals.nodeColors[node] = 'BLACK';
      visuals.timer += 1;
      visuals.finish[node] = visuals.timer;
      visuals.activeNode = node;
      visuals.activeEdge = null;
      visuals.currentStepType = 'finish';

      if (mode === 'topo') {
        visuals.topoOrder.unshift(node);
      }

      pushStep(steps, {
        type: 'finish',
        codeLine: mode === 'topo' ? 18 : mode === 'cycle' ? 16 : 18,
        focus: node,
        explanation: finishExplanation(mode, visuals, node),
        visuals
      });

      visuals.stack.pop();
      visuals.activeNode = visuals.stack[visuals.stack.length - 1] || null;
    }

    startOrder.forEach((node) => {
      if (visuals.nodeColors[node] !== 'WHITE') {
        return;
      }

      visuals.components += 1;
      visuals.activeNode = node;
      visuals.activeEdge = null;
      visuals.currentStepType = 'component';

      pushStep(steps, {
        type: 'component-root',
        codeLine: mode === 'topo' ? 6 : mode === 'cycle' ? 4 : 6,
        focus: node,
        explanation: `Start DFS tree ${visuals.components} at root ${node}. This outer-loop step is why DFS still covers disconnected graphs.`,
        visuals
      });

      visit(node, 0);
    });

    visuals.activeNode = null;
    visuals.activeEdge = null;
    visuals.currentStepType = 'done';
    if (mode === 'topo' && !visuals.cycleFound) {
      visuals.dagDp = computeDagLongestPath(graph, visuals.topoOrder, dom.startNode.value || graph.nodes[0]);
    }

    pushStep(steps, {
      type: 'done',
      codeLine: 0,
      focus: mode === 'topo' ? visuals.topoOrder.join(' -> ') : '',
      explanation: finalExplanation(mode, visuals, graph),
      visuals
    });

    return steps;
  }

  function pushStep(steps, payload) {
    steps.push({
      ...payload,
      snapshot: cloneVisuals(payload.visuals)
    });
  }

  function classifyEdge(visuals, from, to) {
    const neighborColor = visuals.nodeColors[to];
    if (neighborColor === 'WHITE') {
      return 'tree';
    }
    if (neighborColor === 'GRAY') {
      return 'back';
    }

    const du = visuals.discovery[from];
    const dv = visuals.discovery[to];
    const fu = visuals.finish[from];
    const fv = visuals.finish[to];
    if (du < dv && (!fu || fv < fu || fu === undefined)) {
      return 'forward';
    }
    return 'cross';
  }

  function edgeExplanation(visuals, from, to, type) {
    if (type === 'tree') {
      return `${from} -> ${to} is a tree edge because ${to} is WHITE. DFS will discover ${to} for the first time through ${from}.`;
    }
    if (type === 'back') {
      const cycleText = visuals.cyclePath.length ? visuals.cyclePath.join(' -> ') : `${to} -> ... -> ${from} -> ${to}`;
      return `${from} -> ${to} is a back edge because ${to} is GRAY and still on the stack. That closes the directed cycle ${cycleText}.`;
    }
    if (type === 'forward') {
      return `${from} -> ${to} is a forward edge. ${to} is already BLACK and was discovered after ${from}, so it is a descendant reached earlier in the DFS tree.`;
    }
    return `${from} -> ${to} is a cross edge. ${to} is BLACK, but it is not a descendant of ${from}; the edge connects across DFS subtrees or finished branches.`;
  }

  function finishExplanation(mode, visuals, node) {
    const interval = `[${visuals.discovery[node]}, ${visuals.finish[node]}]`;
    if (mode === 'topo') {
      return `Finish ${node}: set f[${node}] = ${visuals.finish[node]}, color it BLACK, and prepend it to the topological order. Current order: ${visuals.topoOrder.join(' -> ')}. Interval ${interval}.`;
    }
    if (mode === 'cycle') {
      return `Finish ${node}: it leaves the recursion stack and turns BLACK. Interval ${interval}. BLACK vertices cannot create new cycle proofs because they are no longer active ancestors.`;
    }
    return `Finish ${node}: set f[${node}] = ${visuals.finish[node]} and turn it BLACK. Its DFS interval is ${interval}. Any descendant interval must lie completely inside this range.`;
  }

  function finalExplanation(mode, visuals, graph) {
    if (mode === 'topo') {
      if (visuals.cycleFound) {
        return `DFS found a back edge, so the graph is not a DAG. A valid topological order does not exist.`;
      }
      return `Topological sort complete. Reverse finish order is ${visuals.topoOrder.join(' -> ')}. Every directed edge points from an earlier vertex to a later one.`;
    }
    if (mode === 'cycle') {
      if (visuals.cycleFound) {
        return `Cycle detected. Back edge ${visuals.cycleEdge.from} -> ${visuals.cycleEdge.to} proves the directed cycle ${visuals.cyclePath.join(' -> ')}.`;
      }
      return `No back edge was found in any DFS tree, so this directed graph is acyclic.`;
    }
    return `DFS complete: visited ${visuals.nodesVisited} vertices, examined ${visuals.edgesExplored} directed edges, and stamped discovery/finish times for all ${graph.nodes.length} vertices.`;
  }

  function extractCyclePath(stack, ancestor) {
    const index = stack.indexOf(ancestor);
    if (index === -1) {
      return [];
    }
    return stack.slice(index);
  }

  function computeDagLongestPath(graph, topoOrder, source) {
    const start = graph.nodes.includes(source) ? source : topoOrder[0];
    const distances = {};
    const parents = {};

    graph.nodes.forEach((node) => {
      distances[node] = Number.NEGATIVE_INFINITY;
      parents[node] = null;
    });
    distances[start] = 0;

    topoOrder.forEach((node) => {
      if (distances[node] === Number.NEGATIVE_INFINITY) {
        return;
      }
      graph.adjacency[node].forEach((neighbor) => {
        const candidate = distances[node] + 1;
        if (candidate > distances[neighbor]) {
          distances[neighbor] = candidate;
          parents[neighbor] = node;
        }
      });
    });

    let bestEnd = start;
    graph.nodes.forEach((node) => {
      if (distances[node] > distances[bestEnd]) {
        bestEnd = node;
      }
    });

    const bestPath = [];
    let cursor = bestEnd;
    while (cursor) {
      bestPath.unshift(cursor);
      cursor = parents[cursor];
    }

    return {
      source: start,
      topoOrder,
      distances,
      parents,
      bestEnd,
      bestPath,
      bestDistance: distances[bestEnd]
    };
  }

  function renderGraph() {
    while (dom.graphSvg.lastChild && dom.graphSvg.lastChild.tagName !== 'defs') {
      dom.graphSvg.removeChild(dom.graphSvg.lastChild);
    }
    edgeEls.clear();
    nodeEls.clear();

    if (!state.graph || !state.graph.nodes.length) {
      return;
    }

    const edgeLayer = svgEl('g');
    const nodeLayer = svgEl('g');
    dom.graphSvg.appendChild(edgeLayer);
    dom.graphSvg.appendChild(nodeLayer);

    state.graph.edges.forEach((edge) => {
      const group = svgEl('g');
      const path = svgEl('path', {
        fill: 'none',
        'stroke-linecap': 'round'
      });
      const labelBg = svgEl('rect', {
        rx: 6,
        ry: 6,
        opacity: 0
      });
      const label = svgEl('text', {
        'text-anchor': 'middle',
        'font-size': 11,
        'font-weight': 700,
        opacity: 0
      });
      const orderBg = svgEl('rect', {
        rx: 7,
        ry: 7,
        opacity: 1
      });
      const orderLabel = svgEl('text', {
        'text-anchor': 'middle',
        'font-size': 10,
        'font-weight': 700,
        opacity: 1
      });
      group.appendChild(path);
      group.appendChild(orderBg);
      group.appendChild(orderLabel);
      group.appendChild(labelBg);
      group.appendChild(label);
      edgeLayer.appendChild(group);
      edgeEls.set(edgeKey(edge.from, edge.to), { path, orderBg, orderLabel, labelBg, label });
    });

    state.graph.nodes.forEach((node) => {
      const pos = state.nodePositions[node];
      const group = svgEl('g');
      const halo = svgEl('circle', {
        cx: pos.x,
        cy: pos.y,
        r: NODE_RADIUS + 10,
        fill: 'none',
        stroke: 'none'
      });
      const circle = svgEl('circle', {
        cx: pos.x,
        cy: pos.y,
        r: NODE_RADIUS,
        stroke: VISUAL_THEME.nodeStrokeDefault,
        'stroke-width': 1.5
      });
      const label = svgEl('text', {
        x: pos.x,
        y: pos.y + 5,
        'text-anchor': 'middle',
        'font-size': node.length > 5 ? 10 : node.length > 3 ? 11 : 13,
        'font-weight': 700,
        fill: VISUAL_THEME.label
      });
      label.textContent = node;
      const depthBadge = svgEl('text', {
        x: pos.x,
        y: pos.y - NODE_RADIUS - 14,
        'text-anchor': 'middle',
        'font-size': 11,
        'font-weight': 700,
        fill: VISUAL_THEME.badge
      });
      const stamp = svgEl('text', {
        x: pos.x,
        y: pos.y + NODE_RADIUS + 18,
        'text-anchor': 'middle',
        'font-size': 11,
        fill: VISUAL_THEME.meta
      });
      const stampSub = svgEl('text', {
        x: pos.x,
        y: pos.y + NODE_RADIUS + 33,
        'text-anchor': 'middle',
        'font-size': 10,
        fill: VISUAL_THEME.badge
      });
      group.appendChild(halo);
      group.appendChild(circle);
      group.appendChild(depthBadge);
      group.appendChild(label);
      group.appendChild(stamp);
      group.appendChild(stampSub);
      nodeLayer.appendChild(group);
      nodeEls.set(node, { halo, circle, label, depthBadge, stamp, stampSub });
    });

    updateGraphVisuals();
  }

  function edgeKey(from, to) {
    return `${from}->${to}`;
  }

  function edgeOrderIndex(from, to) {
    if (!state.graph || !state.graph.branchPriority) {
      return '';
    }
    return state.graph.branchPriority[edgeKey(from, to)] || '';
  }

  function getEdgeGeometry(from, to) {
    const start = state.nodePositions[from];
    const end = state.nodePositions[to];
    if (!start || !end) {
      return null;
    }

    if (from === to) {
      return {
        selfLoop: true,
        path: `M ${start.x} ${start.y - NODE_RADIUS} C ${start.x + 40} ${start.y - 74}, ${start.x - 40} ${start.y - 74}, ${start.x} ${start.y - NODE_RADIUS}`,
        labelX: start.x,
        labelY: start.y - 82
      };
    }

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    const px = -uy;
    const py = ux;
    const isBidirectional = state.graph.bidirectional.has(edgeKey(from, to));
    const curve = isBidirectional ? 26 : 0;

    const sx = start.x + ux * NODE_RADIUS + px * curve * 0.25;
    const sy = start.y + uy * NODE_RADIUS + py * curve * 0.25;
    const ex = end.x - ux * NODE_RADIUS + px * curve * 0.25;
    const ey = end.y - uy * NODE_RADIUS + py * curve * 0.25;
    const mx = (sx + ex) / 2 + px * curve;
    const my = (sy + ey) / 2 + py * curve;

    const path = curve
      ? `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`
      : `M ${sx} ${sy} L ${ex} ${ey}`;

    return {
      selfLoop: false,
      path,
      labelX: curve ? mx : (sx + ex) / 2,
      labelY: curve ? my : (sy + ey) / 2
    };
  }

  function updateGraphVisuals() {
    if (!state.graph) {
      return;
    }

    const visuals = state.visuals;
    state.graph.edges.forEach((edge) => {
      const key = edgeKey(edge.from, edge.to);
      const els = edgeEls.get(key);
      const geometry = getEdgeGeometry(edge.from, edge.to);
      if (!els || !geometry) {
        return;
      }

      const type = visuals.edgeTypes[key];
      const isActive = visuals.activeEdge && visuals.activeEdge.from === edge.from && visuals.activeEdge.to === edge.to;
      const stroke = isActive ? colorForEdge('active') : colorForEdge(type || 'default');
      const marker = isActive ? 'url(#arrow-active)' : markerForEdge(type || 'default');
      const lineWidth = isActive ? 4 : type ? 3 : 2;
      const order = edgeOrderIndex(edge.from, edge.to);

      els.path.setAttribute('d', geometry.path);
      els.path.setAttribute('stroke', stroke);
      els.path.setAttribute('stroke-width', lineWidth);
      els.path.setAttribute('opacity', type || isActive ? 1 : 0.35);
      els.path.setAttribute('marker-end', geometry.selfLoop ? '' : marker);

      const sourcePos = state.nodePositions[edge.from];
      const targetPos = state.nodePositions[edge.to];
      if (sourcePos && targetPos) {
        const orderX = sourcePos.x + (targetPos.x - sourcePos.x) * 0.28;
        const orderY = sourcePos.y + (targetPos.y - sourcePos.y) * 0.28 - 10;
        els.orderBg.setAttribute('x', orderX - 8);
        els.orderBg.setAttribute('y', orderY - 8);
        els.orderBg.setAttribute('width', 16);
        els.orderBg.setAttribute('height', 16);
        els.orderBg.setAttribute('fill', isActive ? VISUAL_THEME.panelFillActive : VISUAL_THEME.panelFill);
        els.orderBg.setAttribute('stroke', VISUAL_THEME.panelStroke);
        els.orderLabel.setAttribute('x', orderX);
        els.orderLabel.setAttribute('y', orderY + 4);
        els.orderLabel.setAttribute('fill', isActive ? VISUAL_THEME.orderLabelActive : VISUAL_THEME.orderLabel);
        els.orderLabel.textContent = String(order);
      }

      if (type) {
        els.label.textContent = type[0].toUpperCase();
        els.label.setAttribute('x', geometry.labelX);
        els.label.setAttribute('y', geometry.labelY + 4);
        els.label.setAttribute('fill', stroke);
        els.label.setAttribute('opacity', 1);
        els.labelBg.setAttribute('x', geometry.labelX - 10);
        els.labelBg.setAttribute('y', geometry.labelY - 8);
        els.labelBg.setAttribute('width', 20);
        els.labelBg.setAttribute('height', 16);
        els.labelBg.setAttribute('fill', VISUAL_THEME.panelFill);
        els.labelBg.setAttribute('opacity', 1);
      } else {
        els.label.setAttribute('opacity', 0);
        els.labelBg.setAttribute('opacity', 0);
      }
    });

    state.graph.nodes.forEach((node) => {
      const els = nodeEls.get(node);
      if (!els) {
        return;
      }

      const color = visuals.nodeColors[node] || 'WHITE';
      const isActive = visuals.activeNode === node;
      const fill = colorForNode(color, isActive);
      const stroke = color === 'GRAY'
        ? VISUAL_THEME.nodeStrokeGray
        : color === 'BLACK'
          ? VISUAL_THEME.nodeStrokeBlack
          : VISUAL_THEME.nodeStrokeDefault;
      const cycleHighlight = visuals.cycleEdge && (visuals.cycleEdge.from === node || visuals.cycleEdge.to === node);

      els.circle.setAttribute('fill', fill);
      els.circle.setAttribute('stroke', stroke);
      els.halo.setAttribute('stroke', isActive ? VISUAL_THEME.nodeHaloActive : cycleHighlight ? VISUAL_THEME.nodeHaloCycle : 'none');
      els.halo.setAttribute('stroke-width', isActive || cycleHighlight ? 4 : 0);
      els.halo.setAttribute('stroke-dasharray', cycleHighlight && !isActive ? '6 5' : '');

      if (visuals.discovery[node] !== undefined) {
        const finish = visuals.finish[node];
        const depth = visuals.depths[node];
        const timeText = finish === undefined ? `d/f: ${visuals.discovery[node]}/...` : `d/f: ${visuals.discovery[node]}/${finish}`;
        els.stamp.textContent = timeText;
        els.stampSub.textContent = depth === undefined ? '' : `depth: L${depth}`;
        els.depthBadge.textContent = depth === undefined ? '' : `L${depth}`;
        els.depthBadge.setAttribute('opacity', '1');
      } else {
        els.stamp.textContent = '';
        els.stampSub.textContent = '';
        els.depthBadge.textContent = '';
        els.depthBadge.setAttribute('opacity', '0');
      }
    });
  }

  function colorForNode(color, isActive) {
    if (color === 'GRAY') {
      return isActive ? 'rgba(255, 194, 121, 0.96)' : 'rgba(255, 183, 97, 0.88)';
    }
    if (color === 'BLACK') {
      return isActive ? 'rgba(98, 233, 207, 0.94)' : 'rgba(53, 210, 195, 0.82)';
    }
    return isActive ? 'rgba(243, 246, 251, 0.18)' : 'rgba(243, 246, 251, 0.08)';
  }

  function colorForEdge(type) {
    return VISUAL_THEME.edge[type];
  }

  function markerForEdge(type) {
    return {
      default: 'url(#arrow-default)',
      tree: 'url(#arrow-tree)',
      back: 'url(#arrow-back)',
      forward: 'url(#arrow-forward)',
      cross: 'url(#arrow-cross)'
    }[type];
  }

  function applyStep(index) {
    if (!state.steps.length) {
      return;
    }

    const boundedIndex = Math.max(0, Math.min(index, state.steps.length - 1));
    const step = state.steps[boundedIndex];
    state.stepIndex = boundedIndex;
    state.visuals = cloneVisuals(step.snapshot);
    state.visuals.currentStepType = step.type;
    state.status = statusForStep(step);

    updateGraphVisuals();
    highlightCode(step.codeLine);
    dom.explanationBox.textContent = step.explanation;
    captureHistory(step);
    renderHistory();
    renderAuxiliaryPanels();
    updateStats();
  }

  function captureHistory(step) {
    const existingIndex = state.history.findIndex((entry) => entry.index === state.stepIndex);
    if (existingIndex !== -1) {
      state.history.splice(existingIndex, 1);
    }

    state.history.push({
      index: state.stepIndex,
      type: step.type,
      focus: step.focus,
      explanation: step.explanation
    });

    if (state.history.length > MAX_HISTORY) {
      state.history.splice(0, state.history.length - MAX_HISTORY);
    }
  }

  function statusForStep(step) {
    const labels = {
      init: 'Initialized',
      'component-root': 'Starting new DFS tree',
      discover: 'Discovering vertex',
      'examine-edge': 'Examining edge',
      'classify-edge': 'Classifying edge',
      recurse: 'Recursing',
      finish: 'Finishing vertex',
      done: 'Complete'
    };
    return labels[step.type] || 'Ready';
  }

  function renderAuxiliaryPanels() {
    renderTopoPanel();
    renderCyclePanel();
    renderStackPanel();
    renderDepthPanel();
    renderScanPanel();
    renderIntervalPanel();
    renderDagPanel();
  }

  function renderTopoPanel() {
    const showTopo = state.mode === 'topo';
    dom.topoPanel.classList.toggle('hidden', !showTopo);
    dom.topoRow.innerHTML = '';
    if (!showTopo || !state.graph) {
      return;
    }

    const topo = state.visuals.topoOrder;
    state.graph.nodes.forEach((_, index) => {
      const chip = document.createElement('div');
      chip.className = 'topo-chip';
      if (topo[index]) {
        chip.textContent = topo[index];
        chip.classList.add('filled');
        if (index === 0) {
          chip.classList.add('latest');
        }
      } else {
        chip.textContent = '...';
      }
      dom.topoRow.appendChild(chip);
    });
  }

  function renderCyclePanel() {
    const visuals = state.visuals;
    if (visuals.cycleFound && visuals.cycleEdge) {
      dom.cycleCallout.classList.add('alert');
      dom.cycleCallout.innerHTML =
        `<strong>Back edge found:</strong> ${visuals.cycleEdge.from} -> ${visuals.cycleEdge.to}. ` +
        `Because ${visuals.cycleEdge.to} is still GRAY on the stack, the active path ` +
        `<strong>${visuals.cyclePath.join(' -> ')}</strong> is a directed cycle.`;
      return;
    }

    dom.cycleCallout.classList.remove('alert');
    dom.cycleCallout.textContent =
      state.mode === 'cycle'
        ? 'No back edge has been found yet.'
        : 'Watch this panel while stepping. If DFS sees an edge to a GRAY ancestor, the graph is cyclic.';
  }

  function renderStackPanel() {
    dom.stackList.innerHTML = '';
    const stack = state.visuals.stack;
    dom.stackDepthLabel.textContent = `Depth ${stack.length}`;

    if (!stack.length) {
      const frame = document.createElement('div');
      frame.className = 'stack-frame';
      frame.innerHTML = '<span>Stack empty</span><small>No active recursive call</small>';
      dom.stackList.appendChild(frame);
      return;
    }

    [...stack].reverse().forEach((node, index) => {
      const frame = document.createElement('div');
      frame.className = 'stack-frame';
      const depth = stack.length - 1 - index;
      frame.innerHTML = `<span>DFS-VISIT(${node})</span><small>depth ${depth}</small>`;
      dom.stackList.appendChild(frame);
    });
  }

  function renderDepthPanel() {
    while (dom.depthSvg.firstChild) {
      dom.depthSvg.removeChild(dom.depthSvg.firstChild);
    }

    if (!state.graph || !state.graph.nodes.length) {
      dom.depthSummary.textContent = 'The x-axis shows recursion depth. The y-axis shows discovery order.';
      return;
    }

    const discoveredNodes = state.graph.nodes.filter((node) => state.visuals.discovery[node] !== undefined);
    const activeBranch = state.visuals.stack.length ? state.visuals.stack.join(' -> ') : 'none yet';
    dom.depthSummary.textContent =
      `Active branch: ${activeBranch}. X = recursion depth level, Y = discovery time, so deeper recursive calls move right.`;

    if (!discoveredNodes.length) {
      return;
    }

    const width = 420;
    const height = 240;
    const left = 56;
    const right = 18;
    const top = 18;
    const bottom = 28;
    const usableWidth = width - left - right;
    const usableHeight = height - top - bottom;
    const maxDepth = Math.max(state.visuals.maxDepth, 1);
    const maxDiscovery = Math.max(state.visuals.timer, 2);

    for (let depth = 0; depth <= maxDepth; depth += 1) {
      const x = left + (depth / maxDepth) * usableWidth;
      const grid = svgEl('line', {
        x1: x,
        y1: top,
        x2: x,
        y2: height - bottom,
        stroke: VISUAL_THEME.gridSoft,
        'stroke-width': 1
      });
      const label = svgEl('text', {
        x,
        y: height - 8,
        'text-anchor': 'middle',
        class: 'axis-label'
      });
      label.textContent = `L${depth}`;
      dom.depthSvg.appendChild(grid);
      dom.depthSvg.appendChild(label);
    }

    for (let tick = 1; tick <= maxDiscovery; tick += 1) {
      const y = top + ((tick - 1) / Math.max(maxDiscovery - 1, 1)) * usableHeight;
      const grid = svgEl('line', {
        x1: left,
        y1: y,
        x2: width - right,
        y2: y,
        stroke: VISUAL_THEME.gridSoft,
        'stroke-width': 1
      });
      const label = svgEl('text', {
        x: 34,
        y: y + 4,
        'text-anchor': 'end',
        class: 'axis-label'
      });
      label.textContent = String(tick);
      dom.depthSvg.appendChild(grid);
      dom.depthSvg.appendChild(label);
    }

    const xAxis = svgEl('line', {
      x1: left,
      y1: height - bottom,
      x2: width - right,
      y2: height - bottom,
      stroke: VISUAL_THEME.axis,
      'stroke-width': 1.5
    });
    const yAxis = svgEl('line', {
      x1: left,
      y1: top,
      x2: left,
      y2: height - bottom,
      stroke: VISUAL_THEME.axis,
      'stroke-width': 1.5
    });
    dom.depthSvg.appendChild(xAxis);
    dom.depthSvg.appendChild(yAxis);

    const plotPoint = (node) => {
      const depth = state.visuals.depths[node];
      const discovery = state.visuals.discovery[node];
      return {
        x: left + ((depth || 0) / maxDepth) * usableWidth,
        y: top + ((discovery - 1) / Math.max(maxDiscovery - 1, 1)) * usableHeight
      };
    };

    state.graph.nodes.forEach((node) => {
      const parent = state.visuals.parents[node];
      if (!parent || state.visuals.discovery[parent] === undefined || state.visuals.discovery[node] === undefined) {
        return;
      }
      const from = plotPoint(parent);
      const to = plotPoint(node);
      const line = svgEl('line', {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        stroke: VISUAL_THEME.depthLink,
        'stroke-width': 2.5,
        opacity: 0.9
      });
      dom.depthSvg.appendChild(line);
    });

    discoveredNodes.forEach((node) => {
      const point = plotPoint(node);
      const fill = colorForNode(state.visuals.nodeColors[node] || 'WHITE', state.visuals.activeNode === node);
      const circle = svgEl('circle', {
        cx: point.x,
        cy: point.y,
        r: state.visuals.activeNode === node ? 9 : 7,
        fill,
        stroke: VISUAL_THEME.axis,
        'stroke-width': 1.5
      });
      const label = svgEl('text', {
        x: point.x + 12,
        y: point.y + 4,
        class: 'axis-label'
      });
      label.textContent = `${node} (L${state.visuals.depths[node]})`;
      dom.depthSvg.appendChild(circle);
      dom.depthSvg.appendChild(label);
    });
  }

  function renderScanPanel() {
    dom.scanRow.innerHTML = '';

    if (!state.graph || !state.graph.nodes.length) {
      dom.scanSummary.textContent = 'Build steps to inspect the active adjacency list.';
      return;
    }

    const scanNode = state.visuals.activeEdge
      ? state.visuals.activeEdge.from
      : state.visuals.activeNode || state.visuals.stack[state.visuals.stack.length - 1];

    if (!scanNode) {
      dom.scanSummary.textContent = 'No active vertex yet. Start stepping to see adjacency order.';
      return;
    }

    const neighbors = state.graph.adjacency[scanNode] || [];
    const activeNeighbor = state.visuals.activeEdge ? state.visuals.activeEdge.to : null;
    if (!neighbors.length) {
      dom.scanSummary.textContent = `${scanNode} has no outgoing edges, so DFS must backtrack.`;
    } else if (activeNeighbor) {
      const position = neighbors.indexOf(activeNeighbor) + 1;
      const color = state.visuals.nodeColors[activeNeighbor];
      const edgeType = state.visuals.edgeTypes[edgeKey(scanNode, activeNeighbor)];
      const decision = describeBranchDecision(scanNode, state.visuals);
      dom.scanSummary.textContent =
        `Adj[${scanNode}] = [${neighbors.map((neighbor) => `${neighbor}(P${state.graph.branchPriority[edgeKey(scanNode, neighbor)]})`).join(', ')}]. ` +
        `DFS is on position ${position}: ${activeNeighbor} with priority P${state.graph.branchPriority[edgeKey(scanNode, activeNeighbor)]}. ` +
        `Current color is ${color}; edge type is ${edgeType || 'pending'}. ${decision}`;
    } else {
      dom.scanSummary.textContent =
        `Adj[${scanNode}] = [${neighbors.map((neighbor) => `${neighbor}(P${state.graph.branchPriority[edgeKey(scanNode, neighbor)]})`).join(', ')}]. ` +
        `${describeBranchDecision(scanNode, state.visuals)}`;
    }

    if (!neighbors.length) {
      return;
    }

    neighbors.forEach((neighbor) => {
      const chip = document.createElement('div');
      const color = (state.visuals.nodeColors[neighbor] || 'WHITE').toLowerCase();
      const type = state.visuals.edgeTypes[edgeKey(scanNode, neighbor)];
      chip.className = `scan-chip ${color}${type ? ` edge-${type}` : ''}${neighbor === activeNeighbor ? ' current' : ''}`;
      chip.textContent = `${neighbor} P${state.graph.branchPriority[edgeKey(scanNode, neighbor)]} ${state.visuals.nodeColors[neighbor] || 'WHITE'}`;
      dom.scanRow.appendChild(chip);
    });
  }

  function describeBranchDecision(node, visuals) {
    if (!state.graph) {
      return '';
    }

    const neighbors = state.graph.adjacency[node] || [];
    const skipped = [];
    let chosen = null;

    neighbors.forEach((neighbor) => {
      const color = visuals.nodeColors[neighbor] || 'WHITE';
      const priority = state.graph.branchPriority[edgeKey(node, neighbor)];
      if (!chosen && color === 'WHITE') {
        chosen = `${neighbor}(P${priority})`;
      } else {
        skipped.push(`${neighbor}(P${priority}) is ${color}`);
      }
    });

    const chosenText = chosen
      ? `DFS will choose ${chosen} because it is the first WHITE neighbor in priority order.`
      : 'No WHITE neighbor remains, so DFS will finish this node and backtrack.';
    const skippedText = skipped.length ? ` Other branches now visible: ${skipped.join(', ')}.` : '';
    return chosenText + skippedText;
  }

  function renderIntervalPanel() {
    while (dom.intervalSvg.firstChild) {
      dom.intervalSvg.removeChild(dom.intervalSvg.firstChild);
    }

    if (!state.graph || !state.graph.nodes.length) {
      return;
    }

    const nodes = state.graph.nodes.filter((node) => state.visuals.discovery[node] !== undefined);
    if (!nodes.length) {
      return;
    }

    const maxTime = Math.max(state.visuals.timer + 1, 2);
    const width = 420;
    const height = 220;
    const left = 72;
    const top = 24;
    const usableWidth = width - left - 24;
    const rowGap = Math.max(28, Math.floor((height - top - 18) / nodes.length));

    const axis = svgEl('line', {
      x1: left,
      y1: 18,
      x2: width - 20,
      y2: 18,
      stroke: VISUAL_THEME.axis,
      'stroke-width': 1.5
    });
    dom.intervalSvg.appendChild(axis);

    for (let t = 1; t <= maxTime; t += 1) {
      const x = left + (t / maxTime) * usableWidth;
      const tick = svgEl('line', {
        x1: x,
        y1: 14,
        x2: x,
        y2: 22,
        stroke: VISUAL_THEME.axis,
        'stroke-width': 1
      });
      const label = svgEl('text', {
        x,
        y: 11,
        'text-anchor': 'middle',
        class: 'axis-label'
      });
      label.textContent = String(t);
      dom.intervalSvg.appendChild(tick);
      dom.intervalSvg.appendChild(label);
    }

    nodes.forEach((node, index) => {
      const y = top + rowGap * index;
      const d = state.visuals.discovery[node];
      const f = state.visuals.finish[node] || state.visuals.timer + 0.65;
      const x1 = left + (d / maxTime) * usableWidth;
      const x2 = left + (f / maxTime) * usableWidth;

      const name = svgEl('text', {
        x: 18,
        y: y + 4,
        class: 'axis-label'
      });
      name.textContent = node;

      const line = svgEl('line', {
        x1,
        y1: y,
        x2,
        y2: y,
        stroke: state.visuals.finish[node] !== undefined ? VISUAL_THEME.intervalClosed : VISUAL_THEME.intervalOpen,
        'stroke-width': 5,
        'stroke-linecap': 'round'
      });

      const leftCap = svgEl('circle', {
        cx: x1,
        cy: y,
        r: 5,
        fill: VISUAL_THEME.intervalOpen
      });

      const rightCap = svgEl('circle', {
        cx: x2,
        cy: y,
        r: 5,
        fill: state.visuals.finish[node] !== undefined ? VISUAL_THEME.intervalClosed : VISUAL_THEME.intervalCurrent
      });

      dom.intervalSvg.appendChild(name);
      dom.intervalSvg.appendChild(line);
      dom.intervalSvg.appendChild(leftCap);
      dom.intervalSvg.appendChild(rightCap);
    });
  }

  function renderDagPanel() {
    const show = state.mode === 'topo';
    dom.dagPanel.classList.toggle('hidden', !show);

    if (!show) {
      return;
    }

    if (state.visuals.cycleFound) {
      dom.dagSummary.innerHTML = '<strong>Longest path disabled:</strong> dynamic programming on a topological order only works for DAGs.';
      return;
    }

    if (!state.visuals.dagDp) {
      dom.dagSummary.textContent = 'Run the traversal to completion on a DAG to populate this panel.';
      return;
    }

    const dp = state.visuals.dagDp;
    const distanceLines = Object.entries(dp.distances)
      .map(([node, distance]) => `${node}: ${distance === Number.NEGATIVE_INFINITY ? '-inf' : distance}`)
      .join(' | ');

    dom.dagSummary.innerHTML =
      `<strong>Source:</strong> ${dp.source}. ` +
      `<strong>Best path:</strong> ${dp.bestPath.join(' -> ')} ` +
      `(length ${dp.bestDistance}).<br>` +
      `<strong>DP over topological order:</strong> ${dp.topoOrder.join(' -> ')}.<br>` +
      `<strong>Longest-path table:</strong> ${distanceLines}`;
  }

  function renderPseudocode() {
    const config = APP_CONTENT.modes[state.mode];
    dom.pseudocode.innerHTML = '';
    config.pseudocode.forEach((line, index) => {
      const div = document.createElement('div');
      div.className = 'code-line';
      div.textContent = line || ' ';
      const tip = config.tips[index];
      if (tip) {
        div.title = tip;
        div.addEventListener('mouseenter', () => {
          dom.codeHoverTip.textContent = tip;
        });
        div.addEventListener('mouseleave', () => {
          dom.codeHoverTip.textContent = state.codeHoverTip;
        });
      }
      dom.pseudocode.appendChild(div);
    });
    highlightCode(0);
  }

  function highlightCode(lineIndex) {
    const lines = dom.pseudocode.querySelectorAll('.code-line');
    lines.forEach((line, index) => {
      line.classList.toggle('active', index === lineIndex);
    });
  }

  function renderOverview() {
    dom.overview.innerHTML = APP_CONTENT.overview(state.mode);
    updateModePanels();
  }

  function updateModePanels() {
    dom.topoPanel.classList.toggle('hidden', state.mode !== 'topo');
    dom.dagPanel.classList.toggle('hidden', state.mode !== 'topo');
  }

  function updateStats() {
    const visuals = state.visuals;
    const totalSteps = state.steps.length;
    const currentStep = totalSteps ? state.stepIndex + 1 : 0;
    dom.stepCounter.textContent = `${currentStep} / ${totalSteps}`;
    dom.statusText.textContent = state.status;
    dom.nodesVisited.textContent = String(visuals.nodesVisited);
    dom.edgesExplored.textContent = String(visuals.edgesExplored);
    dom.treeEdges.textContent = String(visuals.treeEdges);
    dom.backEdges.textContent = String(visuals.backEdges);
    dom.componentCount.textContent = String(visuals.components);
    dom.timerValue.textContent = String(visuals.timer);
  }

  function renderHistory() {
    dom.historyBody.innerHTML = '';
    state.history
      .slice()
      .reverse()
      .forEach((entry) => {
        const row = document.createElement('tr');
        if (entry.index === state.stepIndex) {
          row.classList.add('active-row');
        }
        row.innerHTML =
          `<td>${entry.index + 1}</td>` +
          `<td><span class="history-type">${entry.type}</span></td>` +
          `<td>${entry.focus || '-'}</td>` +
          `<td>${entry.explanation}</td>`;
        row.addEventListener('click', () => {
          pause();
          applyStep(entry.index);
        });
        dom.historyBody.appendChild(row);
      });
  }

  function stepForward() {
    pause();
    if (!state.steps.length) {
      buildSteps();
      return;
    }

    if (state.stepIndex >= state.steps.length - 1) {
      applyStep(state.steps.length - 1);
      return;
    }

    applyStep(state.stepIndex + 1);
    notifyTourAction('step');
  }

  function stepBack() {
    pause();
    if (!state.steps.length) {
      return;
    }
    applyStep(state.stepIndex - 1);
  }

  function skipToEnd() {
    pause();
    if (!state.steps.length) {
      return;
    }
    applyStep(state.steps.length - 1);
  }

  async function play() {
    if (!state.steps.length) {
      buildSteps();
    }
    if (!state.steps.length) {
      return;
    }
    if (state.playing) {
      return;
    }

    state.playing = true;
    state.playToken += 1;
    const token = state.playToken;

    while (state.playing && token === state.playToken && state.stepIndex < state.steps.length - 1) {
      applyStep(state.stepIndex + 1);
      const speed = Number(dom.speed.value) || 1;
      await wait(Math.max(120, PLAY_BASE_MS / speed));
    }

    state.playing = false;
  }

  function pause() {
    state.playing = false;
    state.playToken += 1;
  }

  function resetPlayback() {
    pause();
    if (!state.steps.length) {
      state.visuals = createEmptyVisuals();
      state.history = [];
      state.status = 'Idle';
      updateGraphVisuals();
      renderAuxiliaryPanels();
      renderHistory();
      updateStats();
      dom.explanationBox.textContent = 'Build steps to begin.';
      return;
    }

    state.history = [];
    applyStep(0);
    state.status = 'Reset to first step';
    updateStats();
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function drawComplexityChart() {
    const V = Number(dom.vertexSlider.value);
    const E = Number(dom.edgeSlider.value);
    dom.vertexLabel.textContent = String(V);
    dom.edgeLabel.textContent = String(E);

    while (dom.complexitySvg.firstChild) {
      dom.complexitySvg.removeChild(dom.complexitySvg.firstChild);
    }

    const width = 960;
    const height = 280;
    const left = 58;
    const right = 28;
    const top = 24;
    const bottom = 42;
    const usableWidth = width - left - right;
    const usableHeight = height - top - bottom;
    const maxX = Math.max(6, V + E);
    const dfsValue = V + E;
    const bfsValue = V + E;
    const denseContrast = V * Math.max(1, E);
    const maxY = Math.max(denseContrast, dfsValue + 2, 12);

    const axisX = svgEl('line', {
      x1: left,
      y1: height - bottom,
      x2: width - right,
      y2: height - bottom,
      stroke: VISUAL_THEME.axis,
      'stroke-width': 1.5
    });
    const axisY = svgEl('line', {
      x1: left,
      y1: top,
      x2: left,
      y2: height - bottom,
      stroke: VISUAL_THEME.axis,
      'stroke-width': 1.5
    });
    dom.complexitySvg.appendChild(axisX);
    dom.complexitySvg.appendChild(axisY);

    for (let i = 0; i <= 5; i += 1) {
      const ratio = i / 5;
      const x = left + ratio * usableWidth;
      const y = height - bottom - ratio * usableHeight;
      const vx = Math.round(ratio * maxX);
      const vy = Math.round(ratio * maxY);

      const vertical = svgEl('line', {
        x1: x,
        y1: top,
        x2: x,
        y2: height - bottom,
        stroke: VISUAL_THEME.gridSoft,
        'stroke-width': 1
      });
      const horizontal = svgEl('line', {
        x1: left,
        y1: y,
        x2: width - right,
        y2: y,
        stroke: VISUAL_THEME.gridSoft,
        'stroke-width': 1
      });
      const xLabel = svgEl('text', {
        x,
        y: height - 14,
        'text-anchor': 'middle',
        class: 'axis-label'
      });
      xLabel.textContent = String(vx);
      const yLabel = svgEl('text', {
        x: left - 10,
        y: y + 4,
        'text-anchor': 'end',
        class: 'axis-label'
      });
      yLabel.textContent = String(vy);
      dom.complexitySvg.appendChild(vertical);
      dom.complexitySvg.appendChild(horizontal);
      dom.complexitySvg.appendChild(xLabel);
      dom.complexitySvg.appendChild(yLabel);
    }

    const dfsPath = plotLine(maxX, maxY, usableWidth, usableHeight, left, height - bottom, (x) => x);
    const bfsPath = plotLine(maxX, maxY, usableWidth, usableHeight, left, height - bottom, (x) => x * 0.98 + 0.4);
    const densePath = plotLine(maxX, maxY, usableWidth, usableHeight, left, height - bottom, (x) => (V / maxX) * x * (E / maxX) * x);

    dom.complexitySvg.appendChild(makePath(dfsPath, VISUAL_THEME.chartDfs, 4));
    dom.complexitySvg.appendChild(makePath(bfsPath, VISUAL_THEME.chartBfs, 3));
    dom.complexitySvg.appendChild(makePath(densePath, VISUAL_THEME.chartContrast, 2, '8 7'));

    addChartLabel('DFS O(V + E)', VISUAL_THEME.chartDfs, usableWidth * 0.66 + left, mapY(maxY, usableHeight, height - bottom, dfsValue * 0.66));
    addChartLabel('BFS O(V + E)', VISUAL_THEME.chartBfs, usableWidth * 0.48 + left, mapY(maxY, usableHeight, height - bottom, bfsValue * 0.48 + 1));
    addChartLabel('Contrast: O(VE)', VISUAL_THEME.chartContrast, usableWidth * 0.7 + left, mapY(maxY, usableHeight, height - bottom, denseContrast * 0.48));

    const xAxisLabel = svgEl('text', {
      x: left + usableWidth / 2,
      y: height - 6,
      'text-anchor': 'middle',
      class: 'axis-label'
    });
    xAxisLabel.textContent = 'Graph size scale';

    const yAxisLabel = svgEl('text', {
      x: 16,
      y: top + usableHeight / 2,
      transform: `rotate(-90 16 ${top + usableHeight / 2})`,
      'text-anchor': 'middle',
      class: 'axis-label'
    });
    yAxisLabel.textContent = 'Estimated operations';

    dom.complexitySvg.appendChild(xAxisLabel);
    dom.complexitySvg.appendChild(yAxisLabel);

    const actualGraph = state.graph;
    const actualNote = actualGraph
      ? `Current graph: V = ${actualGraph.nodes.length}, E = ${actualGraph.edges.length}`
      : 'Build a graph to compare the actual V and E values.';

    dom.complexityMetrics.innerHTML =
      metricRow('DFS estimate', `${dfsValue} scans`) +
      metricRow('BFS estimate', `${bfsValue} scans`) +
      metricRow('Contrast O(VE)', `${denseContrast} operations`) +
      metricRow('Actual graph', actualNote);
  }

  function syncComplexitySlidersToGraph(graph) {
    if (!graph || !graph.nodes.length) {
      return;
    }

    const vMin = Number(dom.vertexSlider.min);
    const vMax = Number(dom.vertexSlider.max);
    const eMin = Number(dom.edgeSlider.min);
    const eMax = Number(dom.edgeSlider.max);

    dom.vertexSlider.value = String(Math.min(vMax, Math.max(vMin, graph.nodes.length)));
    dom.edgeSlider.value = String(Math.min(eMax, Math.max(eMin, graph.edges.length || 1)));
  }

  function plotLine(maxX, maxY, usableWidth, usableHeight, left, bottomY, fn) {
    const points = [];
    for (let x = 0; x <= maxX; x += 1) {
      const px = left + (x / maxX) * usableWidth;
      const py = mapY(maxY, usableHeight, bottomY, fn(x));
      points.push(`${x === 0 ? 'M' : 'L'} ${px} ${py}`);
    }
    return points.join(' ');
  }

  function mapY(maxY, usableHeight, bottomY, value) {
    return bottomY - (value / maxY) * usableHeight;
  }

  function makePath(d, stroke, width, dashArray = '') {
    const path = svgEl('path', {
      d,
      fill: 'none',
      stroke,
      'stroke-width': width,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round'
    });
    if (dashArray) {
      path.setAttribute('stroke-dasharray', dashArray);
    }
    return path;
  }

  function addChartLabel(text, color, x, y) {
    const label = svgEl('text', {
      x,
      y,
      class: 'chart-label',
      fill: color
    });
    label.textContent = text;
    dom.complexitySvg.appendChild(label);
  }

  function metricRow(label, value) {
    return `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`;
  }

  init();
})();
