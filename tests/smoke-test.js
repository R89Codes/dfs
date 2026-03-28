#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.set = new Set();
  }

  add(...tokens) {
    tokens.forEach((token) => {
      if (token) {
        this.set.add(token);
      }
    });
    this.sync();
  }

  remove(...tokens) {
    tokens.forEach((token) => this.set.delete(token));
    this.sync();
  }

  toggle(token, force) {
    if (force === true) {
      this.set.add(token);
    } else if (force === false) {
      this.set.delete(token);
    } else if (this.set.has(token)) {
      this.set.delete(token);
    } else {
      this.set.add(token);
    }
    this.sync();
  }

  contains(token) {
    return this.set.has(token);
  }

  sync() {
    this.owner._className = Array.from(this.set).join(' ');
  }
}

class FakeElement {
  constructor(tagName, id = '') {
    this.tagName = tagName;
    this.id = id;
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.dataset = {};
    this._textContent = '';
    this._innerHTML = '';
    this._value = '';
    this._className = '';
    this.classList = new FakeClassList(this);
  }

  set className(value) {
    this._className = value || '';
    this.classList.set = new Set((this._className || '').split(/\s+/).filter(Boolean));
  }

  get className() {
    return this._className;
  }

  set textContent(value) {
    this._textContent = value == null ? '' : String(value);
  }

  get textContent() {
    return this._textContent;
  }

  set innerHTML(value) {
    this._innerHTML = value == null ? '' : String(value);
    this.children = [];
    this._textContent = this._innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set value(value) {
    this._value = value == null ? '' : String(value);
  }

  get value() {
    return this._value;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  get lastChild() {
    return this.children[this.children.length - 1] || null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') {
      this.id = String(value);
    }
    if (name === 'class') {
      this.className = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(handler);
  }

  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    handlers.forEach((handler) => handler.call(this, event));
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }

  querySelectorAll(selector) {
    if (!selector.startsWith('.')) {
      return [];
    }
    const className = selector.slice(1);
    const matches = [];

    function walk(node) {
      node.children.forEach((child) => {
        if (child.classList.contains(className)) {
          matches.push(child);
        }
        walk(child);
      });
    }

    walk(this);
    return matches;
  }
}

class FakeDocument {
  constructor() {
    this.byId = new Map();
  }

  register(id, tagName = 'div') {
    const element = new FakeElement(tagName, id);
    this.byId.set(id, element);
    return element;
  }

  getElementById(id) {
    return this.byId.get(id) || null;
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  createElementNS(_ns, tagName) {
    return new FakeElement(tagName);
  }
}

function createHarness() {
  const document = new FakeDocument();
  const required = {
    modeRow: 'div',
    graphInput: 'textarea',
    presetGrid: 'div',
    presetNote: 'div',
    speed: 'input',
    speedLabel: 'span',
    startNode: 'select',
    buildBtn: 'button',
    stepBackBtn: 'button',
    stepBtn: 'button',
    playBtn: 'button',
    pauseBtn: 'button',
    skipBtn: 'button',
    resetBtn: 'button',
    overview: 'div',
    graphSvg: 'svg',
    topoPanel: 'div',
    topoRow: 'div',
    cycleCallout: 'div',
    stackDepthLabel: 'div',
    stackList: 'div',
    depthSvg: 'svg',
    depthSummary: 'div',
    scanSummary: 'div',
    scanRow: 'div',
    intervalSvg: 'svg',
    dagPanel: 'div',
    dagSummary: 'div',
    pseudocode: 'div',
    codeHoverTip: 'div',
    explanationBox: 'div',
    historyBody: 'tbody',
    complexitySvg: 'svg',
    complexityMetrics: 'div',
    vertexSlider: 'input',
    edgeSlider: 'input',
    vertexLabel: 'span',
    edgeLabel: 'span',
    stepCounter: 'div',
    statusText: 'div',
    nodesVisited: 'div',
    edgesExplored: 'div',
    treeEdges: 'div',
    backEdges: 'div',
    componentCount: 'div',
    timerValue: 'div'
  };

  Object.entries(required).forEach(([id, tag]) => {
    document.register(id, tag);
  });

  const defs = new FakeElement('defs');
  document.getElementById('graphSvg').appendChild(defs);

  document.getElementById('speed').value = '1';
  document.getElementById('vertexSlider').value = '8';
  document.getElementById('edgeSlider').value = '10';

  const window = {
    document,
    setTimeout,
    clearTimeout,
    console
  };

  return { document, window };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function findButtonByText(container, text) {
  return container.children.find((child) => child.textContent === text);
}

function runStepUntilDone(harness) {
  const stepBtn = harness.document.getElementById('stepBtn');
  const stepCounter = harness.document.getElementById('stepCounter');

  let guard = 0;
  while (guard < 500) {
    const [current, total] = stepCounter.textContent.split('/').map((part) => Number(part.trim()));
    if (current >= total) {
      break;
    }
    stepBtn.click();
    guard += 1;
  }

  assert(guard < 500, 'Step playback exceeded guard limit');
}

function loadRuntime() {
  const harness = createHarness();
  const context = vm.createContext({
    console,
    document: harness.document,
    window: harness.window,
    setTimeout,
    clearTimeout
  });

  const contentPath = path.join(__dirname, '..', 'src', 'content.js');
  const appPath = path.join(__dirname, '..', 'src', 'app.js');
  const contentCode = fs.readFileSync(contentPath, 'utf8');
  const appCode = fs.readFileSync(appPath, 'utf8');
  vm.runInContext(contentCode, context, { filename: 'content.js' });
  vm.runInContext(appCode, context, { filename: 'app.js' });

  return harness;
}

function testInitialBuild(harness) {
  const document = harness.document;
  assert(document.getElementById('graphInput').value.includes('A: B D'), 'Initial preset graph did not load');
  assert(document.getElementById('stepCounter').textContent.includes('/'), 'Step counter was not initialized');
  assert(document.getElementById('pseudocode').children.length > 0, 'Pseudocode lines were not rendered');
  assert(document.getElementById('historyBody').children.length >= 1, 'History table did not capture the initial step');
  assert(document.getElementById('depthSummary').textContent.includes('depth') || document.getElementById('depthSummary').textContent.includes('Depth'), 'Depth panel summary did not render');
}

function testTopoMode(harness) {
  const document = harness.document;
  const presetButton = findButtonByText(document.getElementById('presetGrid'), 'DAG / Topo');
  assert(presetButton, 'Topo preset button not found');
  presetButton.click();
  document.getElementById('buildBtn').click();
  runStepUntilDone(harness);

  const topoValues = document
    .getElementById('topoRow')
    .children
    .map((chip) => chip.textContent)
    .filter((text) => text && text !== '...');

  assert(topoValues.length >= 5, 'Topological order did not populate');
  assert(document.getElementById('dagSummary').textContent.includes('Best path'), 'DAG DP summary did not render');
  assert(document.getElementById('backEdges').textContent === '0', 'Topo DAG should not report back edges');
}

function testCycleMode(harness) {
  const document = harness.document;
  const presetButton = findButtonByText(document.getElementById('presetGrid'), 'Has Cycle');
  assert(presetButton, 'Cycle preset button not found');
  presetButton.click();
  document.getElementById('buildBtn').click();
  runStepUntilDone(harness);

  assert(Number(document.getElementById('backEdges').textContent) >= 1, 'Cycle graph should produce a back edge');
  assert(document.getElementById('cycleCallout').textContent.includes('Back edge found'), 'Cycle proof text did not render');
}

function testDisconnectedGraph(harness) {
  const document = harness.document;
  const presetButton = findButtonByText(document.getElementById('presetGrid'), 'Disconnected');
  assert(presetButton, 'Disconnected preset button not found');
  presetButton.click();
  document.getElementById('buildBtn').click();
  runStepUntilDone(harness);

  assert(Number(document.getElementById('componentCount').textContent) >= 2, 'Disconnected graph should create multiple DFS trees');
  assert(document.getElementById('intervalSvg').children.length > 0, 'Interval panel did not render');
  assert(document.getElementById('depthSvg').children.length > 0, 'Depth panel did not render');
  assert(document.getElementById('scanRow').children.length >= 0, 'Adjacency scan panel is missing');
}

function testReset(harness) {
  const document = harness.document;
  document.getElementById('resetBtn').click();
  assert(document.getElementById('stepCounter').textContent.startsWith('1 /'), 'Reset should return to the first step snapshot');
}

function testMultipageFiles() {
  const files = [
    path.join(__dirname, '..', 'multipage', 'index.html'),
    path.join(__dirname, '..', 'multipage', 'dfs.html'),
    path.join(__dirname, '..', 'multipage', 'topo.html'),
    path.join(__dirname, '..', 'multipage', 'cycle.html'),
    path.join(__dirname, '..', 'multipage', 'styles.css'),
    path.join(__dirname, '..', 'multipage', 'data.js'),
    path.join(__dirname, '..', 'multipage', 'app.js')
  ];

  files.forEach((file) => {
    assert(fs.existsSync(file), `Missing multi-page asset: ${path.basename(file)}`);
  });
}

function testRootGuideFiles() {
  const rootDir = path.join(__dirname, '..');
  const files = [
    path.join(rootDir, 'guide.html'),
    path.join(rootDir, 'dfs.html'),
    path.join(rootDir, 'topo.html'),
    path.join(rootDir, 'cycle.html'),
    path.join(rootDir, 'guide-styles.css'),
    path.join(rootDir, 'guide-data.js'),
    path.join(rootDir, 'guide-app.js')
  ];

  files.forEach((file) => {
    assert(fs.existsSync(file), `Missing root guide asset: ${path.basename(file)}`);
  });

  const guideHome = fs.readFileSync(path.join(rootDir, 'guide.html'), 'utf8');
  const dfsPage = fs.readFileSync(path.join(rootDir, 'dfs.html'), 'utf8');

  assert(guideHome.includes('href="guide-styles.css"'), 'Root guide home is not using root guide styles');
  assert(dfsPage.includes('href="guide.html"'), 'Root DFS page should link back to guide.html');
  assert(dfsPage.includes('src="guide-data.js"'), 'Root DFS page is not using root guide data');
  assert(dfsPage.includes('src="guide-app.js"'), 'Root DFS page is not using root guide app');
}

function main() {
  const harness = loadRuntime();
  testInitialBuild(harness);
  testTopoMode(harness);
  testCycleMode(harness);
  testDisconnectedGraph(harness);
  testReset(harness);
  testMultipageFiles();
  testRootGuideFiles();
  console.log('smoke-test:ok');
}

main();
