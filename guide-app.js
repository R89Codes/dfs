'use strict';

(() => {
  const mode = document.body.dataset.mode;
  if (!mode) {
    return;
  }

  const NS = 'http://www.w3.org/2000/svg';
  const NODE_RADIUS = 24;
  const PLAY_MS = 900;
  const TOUR_STORAGE_PREFIX = 'dfs-multipage-tour-dismissed-';
  const FILTER_STORAGE_PREFIX = 'dfs-multipage-filters-';
  const FILTER_TARGETS = {
    controls: ['#controlsSection'],
    graph: ['#graphSection'],
    support: ['#supportSection'],
    diagram: ['#diagramSection'],
    timestamps: ['#stampPanel']
  };
  const ESSENTIAL_FILTERS = {
    controls: true,
    graph: true,
    support: true,
    diagram: true,
    timestamps: false
  };
  const state = {
    graph: null,
    steps: [],
    stepIndex: -1,
    visuals: emptyVisuals(),
    nodePositions: {},
    playing: false,
    playToken: 0,
    panelFilters: {
      controls: true,
      graph: true,
      support: true,
      diagram: true,
      timestamps: true
    },
    tour: {
      steps: [],
      index: 0,
      active: false,
      mode: 'idle',
      actionSatisfied: false,
      overlay: null,
      title: null,
      body: null,
      counter: null,
      nextBtn: null,
      backBtn: null,
      skipBtn: null,
      highlighted: null
    }
  };

  const dom = {
    presetSelect: document.getElementById('presetSelect'),
    graphInput: document.getElementById('graphInput'),
    startNode: document.getElementById('startNode'),
    speed: document.getElementById('speed'),
    speedLabel: document.getElementById('speedLabel'),
    buildBtn: document.getElementById('buildBtn'),
    stepBtn: document.getElementById('stepBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    startTourBtn: document.getElementById('startTourBtn'),
    startPracticeBtn: document.getElementById('startPracticeBtn'),
    topTutorialBtn: document.getElementById('topTutorialBtn'),
    topFilterBtn: document.getElementById('topFilterBtn'),
    topFilterMenu: document.getElementById('topFilterMenu'),
    showEssentialsBtn: document.getElementById('showEssentialsBtn'),
    showAllBtn: document.getElementById('showAllBtn'),
    filterGrid: document.getElementById('filterGrid'),
    statusText: document.getElementById('statusText'),
    stepCounter: document.getElementById('stepCounter'),
    visitedText: document.getElementById('visitedText'),
    edgesText: document.getElementById('edgesText'),
    modeNote: document.getElementById('modeNote'),
    graphSvg: document.getElementById('graphSvg'),
    stackList: document.getElementById('stackList'),
    stepExplain: document.getElementById('stepExplain'),
    diagramTitle: document.getElementById('diagramTitle'),
    diagramText: document.getElementById('diagramText'),
    diagramSvg: document.getElementById('diagramSvg'),
    scanSummary: document.getElementById('scanSummary'),
    scanRow: document.getElementById('scanRow'),
    stampBody: document.getElementById('stampBody'),
    topoStrip: document.getElementById('topoStrip')
  };

  const edgeEls = new Map();
  const nodeEls = new Map();

  function emptyVisuals() {
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
      cycleEdge: null,
      cyclePath: [],
      timer: 0,
      visited: 0,
      edges: 0,
      maxDepth: 0,
      dagSummary: null
    };
  }

  function cloneVisuals(v) {
    return {
      nodeColors: { ...v.nodeColors },
      discovery: { ...v.discovery },
      finish: { ...v.finish },
      parents: { ...v.parents },
      depths: { ...v.depths },
      edgeTypes: { ...v.edgeTypes },
      activeNode: v.activeNode,
      activeEdge: v.activeEdge ? { ...v.activeEdge } : null,
      stack: [...v.stack],
      topoOrder: [...v.topoOrder],
      cycleEdge: v.cycleEdge ? { ...v.cycleEdge } : null,
      cyclePath: [...v.cyclePath],
      timer: v.timer,
      visited: v.visited,
      edges: v.edges,
      maxDepth: v.maxDepth,
      dagSummary: v.dagSummary
        ? {
            bestPath: [...v.dagSummary.bestPath],
            bestDistance: v.dagSummary.bestDistance,
            source: v.dagSummary.source
          }
        : null
    };
  }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function nodeRadius(node) {
    return Math.max(NODE_RADIUS, Math.min(52, 12 + node.length * 4));
  }

  function init() {
    populatePresets();
    bind();
    initializeFilters();
    initializeTour();
    loadPreset(0);
    build();
  }

  function bind() {
    dom.presetSelect.addEventListener('change', () => loadPreset(dom.presetSelect.selectedIndex));
    dom.graphInput.addEventListener('input', syncStartNodes);
    dom.speed.addEventListener('input', () => {
      dom.speedLabel.textContent = `${Number(dom.speed.value).toFixed(2)}x`;
    });
    dom.buildBtn.addEventListener('click', build);
    dom.stepBtn.addEventListener('click', stepForward);
    dom.playBtn.addEventListener('click', play);
    dom.pauseBtn.addEventListener('click', pause);
    dom.resetBtn.addEventListener('click', () => {
      pause();
      applyStep(0);
    });
    if (dom.startTourBtn) {
      dom.startTourBtn.addEventListener('click', showTourWelcome);
    }
    if (dom.startPracticeBtn) {
      dom.startPracticeBtn.addEventListener('click', () => startPractice(true));
    }
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
    if (dom.showEssentialsBtn) {
      dom.showEssentialsBtn.addEventListener('click', () => {
        applyFilterPreset(ESSENTIAL_FILTERS);
      });
    }
    if (dom.showAllBtn) {
      dom.showAllBtn.addEventListener('click', () => {
        applyFilterPreset(allFilters(true));
      });
    }
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('keydown', handleDocumentKeydown);
    }
  }

  function initializeFilters() {
    const stored = safeReadJSON(FILTER_STORAGE_PREFIX + mode);
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

    safeWriteJSON(FILTER_STORAGE_PREFIX + mode, state.panelFilters);
  }

  function initializeTour() {
    if (!document.body) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.innerHTML = `
      <div class="tour-card" role="dialog" aria-modal="true" aria-live="polite">
        <p class="tour-step" id="tourStepCount">Guided Tour</p>
        <h3 id="tourTitle">Tour</h3>
        <p id="tourBody">Walk through this page step by step.</p>
        <div class="tour-actions">
          <button type="button" id="tourBackBtn" class="secondary">Back</button>
          <button type="button" id="tourNextBtn">Next</button>
          <button type="button" id="tourSkipBtn" class="secondary">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    state.tour.overlay = overlay;
    state.tour.counter = overlay.querySelector('#tourStepCount');
    state.tour.title = overlay.querySelector('#tourTitle');
    state.tour.body = overlay.querySelector('#tourBody');
    state.tour.backBtn = overlay.querySelector('#tourBackBtn');
    state.tour.nextBtn = overlay.querySelector('#tourNextBtn');
    state.tour.skipBtn = overlay.querySelector('#tourSkipBtn');

    state.tour.backBtn.addEventListener('click', previousTourStep);
    state.tour.nextBtn.addEventListener('click', nextTourStep);
    state.tour.skipBtn.addEventListener('click', stopTour);

    if (!safeReadJSON(TOUR_STORAGE_PREFIX + mode)) {
      window.setTimeout(showTourWelcome, 280);
    }
  }

  function startTour(forceRestart) {
    if (!state.tour.overlay) {
      return;
    }
    setFilterMenuOpen(false);
    if (forceRestart) {
      safeWriteJSON(TOUR_STORAGE_PREFIX + mode, false);
    }
    state.tour.steps = GUIDE_DATA.tours[mode] || [];
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
    if (forceRestart) {
      safeWriteJSON(TOUR_STORAGE_PREFIX + mode, false);
    }
    state.tour.steps = GUIDE_DATA.practice[mode] || [];
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
    state.tour.counter.textContent = 'Welcome';
    state.tour.title.textContent = 'Quick Tour or Explore?';
    state.tour.body.textContent = 'Choose Quick Tour for a short guided walkthrough. Choose Explore if you want to use the page freely and start the tour later from the Tutorial button in the top-right corner.';
    state.tour.backBtn.style.display = 'none';
    state.tour.nextBtn.textContent = 'Quick Tour';
    state.tour.skipBtn.textContent = 'I Want to Explore';
  }

  function stopTour() {
    if (!state.tour.overlay) {
      return;
    }
    if (state.tour.highlighted) {
      state.tour.highlighted.classList.remove('tour-target');
      state.tour.highlighted = null;
    }
    state.tour.active = false;
    state.tour.mode = 'idle';
    state.tour.actionSatisfied = false;
    state.tour.overlay.classList.remove('open');
    safeWriteJSON(TOUR_STORAGE_PREFIX + mode, true);
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
    if (!state.tour.active || (state.tour.mode !== 'tour' && state.tour.mode !== 'practice')) {
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
      state.tour.highlighted.classList.remove('tour-target');
      state.tour.highlighted = null;
    }

    const target = resolveTourTarget(step.target);
    if (target) {
      prepareTourTarget(target);
      state.tour.highlighted = target;
      target.classList.add('tour-target');
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
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

  function resolveTourTarget(selector) {
    if (!selector) {
      return null;
    }
    if (selector.startsWith('#')) {
      return document.getElementById(selector.slice(1));
    }
    return document.querySelector ? document.querySelector(selector) : null;
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

  function safeWriteJSON(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  function allFilters(value) {
    return Object.keys(FILTER_TARGETS).reduce((acc, key) => {
      acc[key] = value;
      return acc;
    }, {});
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

  function prepareTourTarget(target) {
    if (!target || typeof target.closest !== 'function') {
      return;
    }
    const filterMenu = target.closest('#topFilterMenu');
    if (filterMenu) {
      setFilterMenuOpen(true);
    }
  }

  function populatePresets() {
    GUIDE_DATA.presets[mode].forEach((preset) => {
      const option = document.createElement('option');
      option.textContent = preset.label;
      dom.presetSelect.appendChild(option);
    });
    dom.modeNote.textContent = GUIDE_DATA.descriptions[mode];
  }

  function loadPreset(index) {
    const preset = GUIDE_DATA.presets[mode][index] || GUIDE_DATA.presets[mode][0];
    dom.graphInput.value = preset.graph;
    dom.modeNote.textContent = preset.note;
    syncStartNodes();
  }

  function parseGraph(text) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const nodes = [];
    const adjacency = {};
    const edges = [];
    const edgeSet = new Set();

    function ensure(node) {
      if (!adjacency[node]) {
        adjacency[node] = [];
        nodes.push(node);
      }
    }

    lines.forEach((line) => {
      const split = line.indexOf(':');
      if (split < 0) {
        return;
      }
      const from = line.slice(0, split).trim();
      if (!from) {
        return;
      }
      ensure(from);
      line.slice(split + 1).trim().split(/[\s,]+/).filter(Boolean).forEach((to) => {
        ensure(to);
        const key = `${from}->${to}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          adjacency[from].push(to);
          edges.push({ from, to });
        }
      });
    });

    nodes.forEach((node) => adjacency[node].sort());
    return {
      nodes,
      adjacency,
      edges,
      bidirectional: new Set(edges.filter((edge) => edgeSet.has(`${edge.to}->${edge.from}`)).map((edge) => `${edge.from}->${edge.to}`)),
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
        graph.branchPriority[`${node}->${neighbor}`] = 1 + Math.floor(Math.random() * 5);
      });
      graph.adjacency[node].sort((left, right) => {
        const leftPriority = graph.branchPriority[`${node}->${left}`];
        const rightPriority = graph.branchPriority[`${node}->${right}`];
        return leftPriority - rightPriority || left.localeCompare(right);
      });
    });

    return graph;
  }

  function syncStartNodes() {
    const graph = parseGraph(dom.graphInput.value);
    const previous = dom.startNode.value;
    dom.startNode.innerHTML = '';
    graph.nodes.forEach((node) => {
      const option = document.createElement('option');
      option.value = node;
      option.textContent = node;
      dom.startNode.appendChild(option);
    });
    if (graph.nodes.includes(previous)) {
      dom.startNode.value = previous;
    }
  }

  function build() {
    pause();
    state.graph = assignBranchPriorities(parseGraph(dom.graphInput.value));
    state.nodePositions = computeLayout(state.graph);
    state.steps = buildSteps(state.graph, dom.startNode.value || state.graph.nodes[0]);
    renderGraph();
    applyStep(0);
    notifyTourAction('build');
  }

  function computeLayout(graph) {
    const width = 920;
    const height = 460;
    const cx = width / 2;
    const cy = height / 2;
    const rx = Math.min(320, 130 + graph.nodes.length * 14);
    const ry = Math.min(170, 90 + graph.nodes.length * 10);
    const positions = {};
    graph.nodes.forEach((node, index) => {
      const angle = (-Math.PI / 2) + (index / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
      positions[node] = { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
    });
    return positions;
  }

  function buildSteps(graph, startNode) {
    const visuals = emptyVisuals();
    graph.nodes.forEach((node) => {
      visuals.nodeColors[node] = 'WHITE';
      visuals.parents[node] = null;
    });

    const steps = [];
    const order = graph.nodes.includes(startNode)
      ? [startNode, ...graph.nodes.filter((node) => node !== startNode)]
      : [...graph.nodes];

    pushStep(steps, { explanation: 'Initialize all vertices to WHITE and clear the DFS state.', visuals });

    function visit(node, depth) {
      visuals.stack.push(node);
      visuals.timer += 1;
      visuals.discovery[node] = visuals.timer;
      visuals.depths[node] = depth;
      visuals.maxDepth = Math.max(visuals.maxDepth, depth);
      visuals.nodeColors[node] = 'GRAY';
      visuals.activeNode = node;
      visuals.activeEdge = null;
      visuals.visited += 1;
      pushStep(steps, { explanation: `Discover ${node} at depth ${depth}. d[${node}] = ${visuals.timer}.`, visuals });

      graph.adjacency[node].forEach((neighbor, index) => {
        visuals.activeEdge = { from: node, to: neighbor };
        visuals.activeNode = node;
        visuals.edges += 1;
        pushStep(steps, {
          explanation: `Scan Adj[${node}] = [${graph.adjacency[node].map((item) => `${item}(P${graph.branchPriority[`${node}->${item}`]})`).join(', ')}]. DFS is inspecting entry ${index + 1}: ${neighbor} with priority P${graph.branchPriority[`${node}->${neighbor}`]}.`,
          visuals
        });

        const type = classify(visuals, node, neighbor);
        visuals.edgeTypes[`${node}->${neighbor}`] = type;
        if (type === 'back') {
          visuals.cycleEdge = { from: node, to: neighbor };
          visuals.cyclePath = cyclePath(visuals.stack, neighbor).concat(neighbor);
        }
        pushStep(steps, { explanation: explainEdge(node, neighbor, type, visuals), visuals });

        if (type === 'tree') {
          visuals.parents[neighbor] = node;
          pushStep(steps, { explanation: `${neighbor} is WHITE, so DFS recurses immediately from ${node} to ${neighbor}. It is the first WHITE branch in the current priority order.`, visuals });
          visit(neighbor, depth + 1);
          visuals.activeNode = node;
          visuals.activeEdge = { from: node, to: neighbor };
        }
      });

      visuals.nodeColors[node] = 'BLACK';
      visuals.timer += 1;
      visuals.finish[node] = visuals.timer;
      if (mode === 'topo') {
        visuals.topoOrder.unshift(node);
      }
      pushStep(steps, { explanation: `Finish ${node}. f[${node}] = ${visuals.timer}.`, visuals });
      visuals.stack.pop();
      visuals.activeNode = visuals.stack[visuals.stack.length - 1] || null;
      visuals.activeEdge = null;
    }

    order.forEach((node) => {
      if (visuals.nodeColors[node] === 'WHITE') {
        pushStep(steps, { explanation: `Start a new DFS tree at ${node}.`, visuals });
        visit(node, 0);
      }
    });

    if (mode === 'topo' && !visuals.cycleEdge) {
      visuals.dagSummary = longestPath(graph, visuals.topoOrder, startNode);
    }
    pushStep(steps, { explanation: doneText(visuals), visuals });
    return steps;
  }

  function pushStep(steps, payload) {
    steps.push({ ...payload, snapshot: cloneVisuals(payload.visuals) });
  }

  function classify(visuals, from, to) {
    const color = visuals.nodeColors[to];
    if (color === 'WHITE') {
      return 'tree';
    }
    if (color === 'GRAY') {
      return 'back';
    }
    return visuals.discovery[from] < visuals.discovery[to] ? 'forward' : 'cross';
  }

  function explainEdge(from, to, type, visuals) {
    if (type === 'tree') {
      return `${from} -> ${to} is a tree edge because ${to} is still WHITE.`;
    }
    if (type === 'back') {
      return `${from} -> ${to} is a back edge because ${to} is GRAY. The stack already contains ${visuals.cyclePath.join(' -> ')}.`;
    }
    if (type === 'forward') {
      return `${from} -> ${to} is a forward edge to an already-finished descendant.`;
    }
    return `${from} -> ${to} is a cross edge into another finished branch.`;
  }

  function cyclePath(stack, ancestor) {
    const index = stack.indexOf(ancestor);
    return index < 0 ? [] : stack.slice(index);
  }

  function longestPath(graph, topoOrder, source) {
    const start = graph.nodes.includes(source) ? source : topoOrder[0];
    const dist = {};
    const parent = {};
    graph.nodes.forEach((node) => {
      dist[node] = Number.NEGATIVE_INFINITY;
      parent[node] = null;
    });
    dist[start] = 0;
    topoOrder.forEach((node) => {
      if (dist[node] === Number.NEGATIVE_INFINITY) {
        return;
      }
      graph.adjacency[node].forEach((neighbor) => {
        const next = dist[node] + 1;
        if (next > dist[neighbor]) {
          dist[neighbor] = next;
          parent[neighbor] = node;
        }
      });
    });
    let end = start;
    graph.nodes.forEach((node) => {
      if (dist[node] > dist[end]) {
        end = node;
      }
    });
    const bestPath = [];
    let cursor = end;
    while (cursor) {
      bestPath.unshift(cursor);
      cursor = parent[cursor];
    }
    return { source: start, bestPath, bestDistance: dist[end] };
  }

  function doneText(visuals) {
    if (mode === 'topo') {
      return visuals.cycleEdge
        ? 'A back edge was found, so the graph is not a DAG and topological sort is invalid.'
        : `Topological order: ${visuals.topoOrder.join(' -> ')}.`;
    }
    if (mode === 'cycle') {
      return visuals.cycleEdge
        ? `Cycle proved by back edge ${visuals.cycleEdge.from} -> ${visuals.cycleEdge.to}.`
        : 'No back edge was found, so the graph is acyclic.';
    }
    return `DFS complete: visited ${visuals.visited} vertices and scanned ${visuals.edges} edges.`;
  }

  function renderGraph() {
    while (dom.graphSvg.lastChild && dom.graphSvg.lastChild.tagName !== 'defs') {
      dom.graphSvg.removeChild(dom.graphSvg.lastChild);
    }
    edgeEls.clear();
    nodeEls.clear();

    const edgeLayer = svgEl('g');
    const nodeLayer = svgEl('g');
    dom.graphSvg.appendChild(edgeLayer);
    dom.graphSvg.appendChild(nodeLayer);

    state.graph.edges.forEach((edge) => {
      const path = svgEl('path', { fill: 'none', 'stroke-linecap': 'round' });
      const orderBg = svgEl('rect', { rx: 7, ry: 7, opacity: 1 });
      const orderLabel = svgEl('text', { 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, opacity: 1 });
      const label = svgEl('text', { 'text-anchor': 'middle', 'font-size': 11, opacity: 0 });
      edgeLayer.appendChild(path);
      edgeLayer.appendChild(orderBg);
      edgeLayer.appendChild(orderLabel);
      edgeLayer.appendChild(label);
      edgeEls.set(`${edge.from}->${edge.to}`, { path, orderBg, orderLabel, label });
    });

    state.graph.nodes.forEach((node) => {
      const pos = state.nodePositions[node];
      const radius = nodeRadius(node);
      const halo = svgEl('circle', { cx: pos.x, cy: pos.y, r: NODE_RADIUS + 10, fill: 'none', stroke: 'none' });
      const circle = svgEl('circle', { cx: pos.x, cy: pos.y, r: radius, 'stroke-width': 1.5 });
      const label = svgEl('text', { x: pos.x, y: pos.y + 4, 'text-anchor': 'middle', 'font-size': node.length > 8 ? 8 : node.length > 5 ? 10 : 12, 'font-weight': 700, fill: '#fff2e7' });
      label.textContent = node;
      const stamp = svgEl('text', { x: pos.x, y: pos.y + radius + 16, 'text-anchor': 'middle', 'font-size': 11, fill: '#d9bfa9' });
      nodeLayer.appendChild(halo);
      nodeLayer.appendChild(circle);
      nodeLayer.appendChild(label);
      nodeLayer.appendChild(stamp);
      nodeEls.set(node, { halo, circle, stamp, radius });
    });
  }

  function edgeGeom(from, to) {
    const a = state.nodePositions[from];
    const b = state.nodePositions[to];
    const ar = nodeRadius(from);
    const br = nodeRadius(to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const curve = state.graph.bidirectional.has(`${from}->${to}`) ? 28 : 0;
    const sx = a.x + ux * ar + px * curve * 0.25;
    const sy = a.y + uy * ar + py * curve * 0.25;
    const ex = b.x - ux * br + px * curve * 0.25;
    const ey = b.y - uy * br + py * curve * 0.25;
    const mx = (sx + ex) / 2 + px * curve;
    const my = (sy + ey) / 2 + py * curve;
    return {
      path: curve ? `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}` : `M ${sx} ${sy} L ${ex} ${ey}`,
      lx: curve ? mx : (sx + ex) / 2,
      ly: curve ? my : (sy + ey) / 2
    };
  }

  function applyStep(index) {
    if (!state.steps.length) {
      return;
    }
    state.stepIndex = Math.max(0, Math.min(index, state.steps.length - 1));
    state.visuals = cloneVisuals(state.steps[state.stepIndex].snapshot);
    updateGraph();
    renderStack();
    renderTable();
    renderScan();
    renderDiagram();
    renderTopoStrip();
    dom.stepExplain.textContent = state.steps[state.stepIndex].explanation;
    dom.statusText.textContent = state.stepIndex === state.steps.length - 1 ? 'Complete' : 'Stepping';
    dom.stepCounter.textContent = `${state.stepIndex + 1} / ${state.steps.length}`;
    dom.visitedText.textContent = String(state.visuals.visited);
    dom.edgesText.textContent = String(state.visuals.edges);
  }

  function updateGraph() {
    state.graph.edges.forEach((edge) => {
      const key = `${edge.from}->${edge.to}`;
      const els = edgeEls.get(key);
      const geom = edgeGeom(edge.from, edge.to);
      const type = state.visuals.edgeTypes[key];
      const active = state.visuals.activeEdge && state.visuals.activeEdge.from === edge.from && state.visuals.activeEdge.to === edge.to;
      const priority = state.graph.branchPriority[key];
      els.path.setAttribute('d', geom.path);
      els.path.setAttribute('stroke', active ? '#ff8c42' : edgeColor(type || 'default'));
      els.path.setAttribute('stroke-width', active ? 4 : type ? 3 : 2);
      els.path.setAttribute('opacity', type || active ? 1 : 0.35);
      els.path.setAttribute('marker-end', active ? 'url(#arrow-active)' : marker(type || 'default'));
      const source = state.nodePositions[edge.from];
      const target = state.nodePositions[edge.to];
      if (source && target) {
        const orderX = source.x + (target.x - source.x) * 0.28;
        const orderY = source.y + (target.y - source.y) * 0.28 - 10;
        els.orderBg.setAttribute('x', orderX - 8);
        els.orderBg.setAttribute('y', orderY - 8);
        els.orderBg.setAttribute('width', 16);
        els.orderBg.setAttribute('height', 16);
        els.orderBg.setAttribute('fill', active ? 'rgba(255,140,66,0.86)' : 'rgba(18,12,9,0.9)');
        els.orderBg.setAttribute('stroke', 'rgba(255,255,255,0.12)');
        els.orderLabel.setAttribute('x', orderX);
        els.orderLabel.setAttribute('y', orderY + 4);
        els.orderLabel.setAttribute('fill', active ? '#2a1600' : '#ffd166');
        els.orderLabel.textContent = String(priority);
      }
      if (type) {
        els.label.textContent = type[0].toUpperCase();
        els.label.setAttribute('x', geom.lx);
        els.label.setAttribute('y', geom.ly + 4);
        els.label.setAttribute('fill', edgeColor(type));
        els.label.setAttribute('opacity', 1);
      } else {
        els.label.setAttribute('opacity', 0);
      }
    });

    state.graph.nodes.forEach((node) => {
      const els = nodeEls.get(node);
      const active = state.visuals.activeNode === node;
      const cycle = state.visuals.cycleEdge && (state.visuals.cycleEdge.from === node || state.visuals.cycleEdge.to === node);
      const color = state.visuals.nodeColors[node] || 'WHITE';
      els.circle.setAttribute('fill', nodeColor(color, active));
      els.circle.setAttribute('stroke', color === 'GRAY' ? '#ffd166' : color === 'BLACK' ? '#80ed99' : 'rgba(255,255,255,0.16)');
      els.halo.setAttribute('stroke', active ? 'rgba(255,140,66,0.5)' : cycle ? 'rgba(255,107,107,0.45)' : 'none');
      els.halo.setAttribute('stroke-width', active || cycle ? 4 : 0);
      els.halo.setAttribute('r', (els.radius || nodeRadius(node)) + 10);
      if (state.visuals.discovery[node] !== undefined) {
        const f = state.visuals.finish[node];
        const d = state.visuals.depths[node];
        els.stamp.textContent = `${state.visuals.discovery[node]}/${f === undefined ? '...' : f} | L${d}`;
      } else {
        els.stamp.textContent = '';
      }
    });
  }

  function renderStack() {
    dom.stackList.innerHTML = '';
    if (!state.visuals.stack.length) {
      dom.stackList.innerHTML = '<div class="stack-frame">Stack empty</div>';
      return;
    }
    [...state.visuals.stack].reverse().forEach((node, index) => {
      const frame = document.createElement('div');
      frame.className = 'stack-frame';
      frame.textContent = `DFS-VISIT(${node}) depth ${state.visuals.stack.length - 1 - index}`;
      dom.stackList.appendChild(frame);
    });
  }

  function renderTable() {
    dom.stampBody.innerHTML = '';
    state.graph.nodes.forEach((node) => {
      const row = document.createElement('tr');
      row.innerHTML =
        `<td>${node}</td>` +
        `<td>${state.visuals.discovery[node] ?? ''}</td>` +
        `<td>${state.visuals.finish[node] ?? ''}</td>` +
        `<td>${state.visuals.depths[node] ?? ''}</td>`;
      dom.stampBody.appendChild(row);
    });
  }

  function renderScan() {
    dom.scanRow.innerHTML = '';
    const source = state.visuals.activeEdge ? state.visuals.activeEdge.from : state.visuals.activeNode;
    if (!source) {
      if (mode === 'topo' && state.visuals.dagSummary) {
        dom.scanSummary.textContent = `Longest path from ${state.visuals.dagSummary.source}: ${state.visuals.dagSummary.bestPath.join(' -> ')} (length ${state.visuals.dagSummary.bestDistance}).`;
      } else if (mode === 'cycle' && state.visuals.cycleEdge) {
        dom.scanSummary.textContent = `Back edge ${state.visuals.cycleEdge.from} -> ${state.visuals.cycleEdge.to} closes ${state.visuals.cyclePath.join(' -> ')}.`;
      } else {
        dom.scanSummary.textContent = 'No active adjacency scan yet.';
      }
      return;
    }

    const neighbors = state.graph.adjacency[source] || [];
    dom.scanSummary.textContent =
      `Adj[${source}] = [${neighbors.map((neighbor) => `${neighbor}(P${state.graph.branchPriority[`${source}->${neighbor}`]})`).join(', ')}]. ` +
      describeBranchChoice(source);
    neighbors.forEach((neighbor) => {
      const chip = document.createElement('div');
      const color = (state.visuals.nodeColors[neighbor] || 'WHITE').toLowerCase();
      const type = state.visuals.edgeTypes[`${source}->${neighbor}`];
      chip.className = `scan-chip ${color}${type ? ` edge-${type}` : ''}${state.visuals.activeEdge && state.visuals.activeEdge.to === neighbor ? ' current' : ''}`;
      chip.textContent = `${neighbor} P${state.graph.branchPriority[`${source}->${neighbor}`]} ${state.visuals.nodeColors[neighbor] || 'WHITE'}`;
      dom.scanRow.appendChild(chip);
    });
  }

  function describeBranchChoice(source) {
    const neighbors = state.graph.adjacency[source] || [];
    const skipped = [];
    let chosen = null;

    neighbors.forEach((neighbor) => {
      const color = state.visuals.nodeColors[neighbor] || 'WHITE';
      const priority = state.graph.branchPriority[`${source}->${neighbor}`];
      if (!chosen && color === 'WHITE') {
        chosen = `${neighbor}(P${priority})`;
      } else {
        skipped.push(`${neighbor}(P${priority}) is ${color}`);
      }
    });

    const chosenText = chosen
      ? `DFS chooses ${chosen} because it is the first WHITE branch in priority order.`
      : 'No WHITE branch remains, so DFS will backtrack after this scan.';
    const skippedText = skipped.length ? ` Visible alternatives: ${skipped.join(', ')}.` : '';
    return chosenText + skippedText;
  }

  function renderTopoStrip() {
    if (!dom.topoStrip) {
      return;
    }
    dom.topoStrip.innerHTML = '';
    state.graph.nodes.forEach((_, index) => {
      const chip = document.createElement('div');
      chip.className = 'topo-chip';
      if (state.visuals.topoOrder[index]) {
        chip.textContent = state.visuals.topoOrder[index];
        chip.classList.add('filled');
        if (index === 0) {
          chip.classList.add('latest');
        }
      } else {
        chip.textContent = '...';
      }
      dom.topoStrip.appendChild(chip);
    });
  }

  function renderDiagram() {
    while (dom.diagramSvg.firstChild) {
      dom.diagramSvg.removeChild(dom.diagramSvg.firstChild);
    }
    if (mode === 'dfs') {
      renderDepthDiagram();
    } else if (mode === 'topo') {
      renderTopoDiagram();
    } else {
      renderCycleDiagram();
    }
  }

  function renderDepthDiagram() {
    dom.diagramTitle.textContent = 'Depth Ladder';
    dom.diagramText.textContent = 'X shows recursion depth. Y shows discovery order.';
    const discovered = state.graph.nodes.filter((node) => state.visuals.discovery[node] !== undefined);
    if (!discovered.length) {
      return;
    }
    const width = 960;
    const height = 260;
    const left = 60;
    const top = 18;
    const bottom = 28;
    const usableWidth = width - left - 20;
    const usableHeight = height - top - bottom;
    const maxDepth = Math.max(state.visuals.maxDepth, 1);
    const maxDiscovery = Math.max(state.visuals.timer, 2);

    for (let depth = 0; depth <= maxDepth; depth += 1) {
      const x = left + (depth / maxDepth) * usableWidth;
      dom.diagramSvg.appendChild(svgEl('line', { x1: x, y1: top, x2: x, y2: height - bottom, stroke: 'rgba(255,255,255,0.08)' }));
      const label = svgEl('text', { x, y: height - 8, 'text-anchor': 'middle', class: 'axis-label' });
      label.textContent = `L${depth}`;
      dom.diagramSvg.appendChild(label);
    }

    const point = (node) => ({
      x: left + ((state.visuals.depths[node] || 0) / maxDepth) * usableWidth,
      y: top + ((state.visuals.discovery[node] - 1) / Math.max(maxDiscovery - 1, 1)) * usableHeight
    });

    state.graph.nodes.forEach((node) => {
      const parent = state.visuals.parents[node];
      if (!parent || state.visuals.discovery[parent] === undefined || state.visuals.discovery[node] === undefined) {
        return;
      }
      const a = point(parent);
      const b = point(node);
      dom.diagramSvg.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#8ecae6', 'stroke-width': 2.5 }));
    });

    discovered.forEach((node) => {
      const p = point(node);
      dom.diagramSvg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: state.visuals.activeNode === node ? 8 : 6, fill: nodeColor(state.visuals.nodeColors[node], state.visuals.activeNode === node) }));
      const label = svgEl('text', { x: p.x + 10, y: p.y + 4, class: 'axis-label' });
      label.textContent = `${node} d=${state.visuals.discovery[node]}`;
      dom.diagramSvg.appendChild(label);
    });
  }

  function renderTopoDiagram() {
    dom.diagramTitle.textContent = 'Finish-Time Conveyor';
    dom.diagramText.textContent = 'Finishing later means appearing earlier in the final topological order.';
    const width = 960;
    const height = 260;
    const left = 40;
    const top = 24;
    const laneY = 130;
    dom.diagramSvg.appendChild(svgEl('line', { x1: left, y1: laneY, x2: width - 20, y2: laneY, stroke: 'rgba(255,255,255,0.22)', 'stroke-width': 4 }));
    state.graph.nodes.forEach((node, index) => {
      const finish = state.visuals.finish[node];
      if (finish === undefined) {
        return;
      }
      const x = left + 50 + index * ((width - 120) / Math.max(state.graph.nodes.length - 1, 1));
      dom.diagramSvg.appendChild(svgEl('rect', { x: x - 32, y: laneY - 22, width: 64, height: 44, rx: 12, fill: 'rgba(255,209,102,0.18)', stroke: 'rgba(255,209,102,0.32)' }));
      const name = svgEl('text', { x, y: laneY - 2, 'text-anchor': 'middle', fill: '#fff2e7' });
      name.textContent = node;
      const stamp = svgEl('text', { x, y: laneY + 15, 'text-anchor': 'middle', class: 'axis-label' });
      stamp.textContent = `f=${finish}`;
      dom.diagramSvg.appendChild(name);
      dom.diagramSvg.appendChild(stamp);
    });
    state.visuals.topoOrder.forEach((node, index) => {
      const x = left + 50 + index * ((width - 120) / Math.max(state.graph.nodes.length - 1, 1));
      const y = 54;
      dom.diagramSvg.appendChild(svgEl('rect', { x: x - 32, y: y - 16, width: 64, height: 34, rx: 10, fill: index === 0 ? 'rgba(255,140,66,0.24)' : 'rgba(128,237,153,0.16)', stroke: 'rgba(255,213,173,0.16)' }));
      const label = svgEl('text', { x, y: y + 6, 'text-anchor': 'middle', fill: '#fff2e7' });
      label.textContent = node;
      dom.diagramSvg.appendChild(label);
    });
  }

  function renderCycleDiagram() {
    dom.diagramTitle.textContent = 'Cycle Proof Diagram';
    dom.diagramText.textContent = 'A back edge to a GRAY ancestor closes a loop on the active stack.';
    const width = 960;
    const startX = 90;
    const gap = 130;
    const y = 120;
    state.visuals.stack.forEach((node, index) => {
      const x = startX + gap * index;
      dom.diagramSvg.appendChild(svgEl('circle', { cx: x, cy: y, r: 30, fill: 'rgba(255,209,102,0.18)', stroke: 'rgba(255,209,102,0.3)' }));
      const label = svgEl('text', { x, y: y + 5, 'text-anchor': 'middle', fill: '#fff2e7' });
      label.textContent = node;
      dom.diagramSvg.appendChild(label);
      if (index > 0) {
        dom.diagramSvg.appendChild(svgEl('line', { x1: x - gap + 36, y1: y, x2: x - 36, y2: y, stroke: '#8ecae6', 'stroke-width': 3 }));
      }
    });
    if (state.visuals.cycleEdge) {
      const ancestorIndex = state.visuals.stack.indexOf(state.visuals.cycleEdge.to);
      const currentIndex = state.visuals.stack.indexOf(state.visuals.cycleEdge.from);
      if (ancestorIndex >= 0 && currentIndex >= 0) {
        const fromX = startX + gap * currentIndex;
        const toX = startX + gap * ancestorIndex;
        const path = svgEl('path', {
          d: `M ${fromX} ${y - 34} Q ${(fromX + toX) / 2} 18 ${toX} ${y - 34}`,
          fill: 'none',
          stroke: '#ff6b6b',
          'stroke-width': 4
        });
        dom.diagramSvg.appendChild(path);
        const label = svgEl('text', { x: (fromX + toX) / 2, y: 30, 'text-anchor': 'middle', fill: '#ffb3b3' });
        label.textContent = `${state.visuals.cycleEdge.from} -> ${state.visuals.cycleEdge.to}`;
        dom.diagramSvg.appendChild(label);
      }
    }
  }

  function stepForward() {
    pause();
    applyStep(state.stepIndex + 1);
    notifyTourAction('step');
  }

  async function play() {
    if (state.playing) {
      return;
    }
    state.playing = true;
    state.playToken += 1;
    const token = state.playToken;
    while (state.playing && token === state.playToken && state.stepIndex < state.steps.length - 1) {
      applyStep(state.stepIndex + 1);
      await new Promise((resolve) => window.setTimeout(resolve, Math.max(120, PLAY_MS / Number(dom.speed.value || 1))));
    }
    state.playing = false;
  }

  function pause() {
    state.playing = false;
    state.playToken += 1;
  }

  function nodeColor(color, active) {
    if (active) {
      return 'rgba(255,140,66,0.92)';
    }
    if (color === 'GRAY') {
      return 'rgba(255,209,102,0.88)';
    }
    if (color === 'BLACK') {
      return 'rgba(128,237,153,0.78)';
    }
    return 'rgba(255,255,255,0.08)';
  }

  function edgeColor(type) {
    return {
      default: 'rgba(255,255,255,0.24)',
      tree: '#8ecae6',
      back: '#ff6b6b',
      forward: '#80ed99',
      cross: '#ffd166'
    }[type];
  }

  function marker(type) {
    return {
      default: 'url(#arrow-default)',
      tree: 'url(#arrow-tree)',
      back: 'url(#arrow-back)',
      forward: 'url(#arrow-forward)',
      cross: 'url(#arrow-cross)'
    }[type];
  }

  init();
})();
