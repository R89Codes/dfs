const APP_CONTENT = {
  presets: [
    {
      id: "classic",
      label: "Classic DFS",
      defaultMode: "dfs",
      graph: "A: B D\nB: C E\nC: F\nD: B\nE: D F\nF:",
      note: "Balanced example for DFS search and edge classification. It shows tree, forward, and cross edges cleanly."
    },
    {
      id: "topo-clothes",
      label: "DAG / Topo",
      defaultMode: "topo",
      graph: "Undershorts: Pants Shoes\nPants: Belt Shoes\nBelt: Jacket\nShirt: Belt Tie\nTie: Jacket\nSocks: Shoes\nShoes:\nWatch:\nJacket:",
      note: "Classic dressing-order DAG. Reverse finish time gives a legal topological order."
    },
    {
      id: "cycle",
      label: "Has Cycle",
      defaultMode: "cycle",
      graph: "A: B C\nB: D\nC: E\nD: A\nE:",
      note: "Contains the cycle A -> B -> D -> A. DFS should discover a back edge to a GRAY ancestor."
    },
    {
      id: "disconnected",
      label: "Disconnected",
      defaultMode: "dfs",
      graph: "A: B C\nB: D\nC:\nD:\nE: F G\nF: H\nG:\nH:",
      note: "Shows why DFS must loop over every vertex, not just the chosen start node."
    },
    {
      id: "clrs",
      label: "CLRS 22.4",
      defaultMode: "dfs",
      graph: "u: v x\nv: y\nx: v\ny: x\nw: y z\nz:",
      note: "Useful for discovery and finish times, interval nesting, and the parenthesis theorem."
    },
    {
      id: "worst-case",
      label: "Worst Case",
      defaultMode: "dfs",
      graph: "A: B C D E F\nB: C D E F\nC: D E F\nD: E F\nE: F\nF: G\nG: H\nH:",
      note: "Dense-ish directed graph that pushes edge scans toward the worst case for O(V + E) analysis."
    }
  ],

  modes: {
    dfs: {
      label: "DFS",
      overviewTitle: "Depth-First Search",
      pseudocode: [
        "DFS(G):",
        "  for each vertex u in G.V:",
        "    color[u] = WHITE",
        "    parent[u] = NIL",
        "  time = 0",
        "  for each vertex u in G.V:",
        "    if color[u] == WHITE:",
        "      DFS-VISIT(u)",
        "",
        "DFS-VISIT(u):",
        "  time = time + 1",
        "  d[u] = time",
        "  color[u] = GRAY",
        "  for each v in Adj[u]:",
        "    classify (u -> v)",
        "    if color[v] == WHITE:",
        "      parent[v] = u",
        "      DFS-VISIT(v)",
        "  color[u] = BLACK",
        "  time = time + 1",
        "  f[u] = time"
      ],
      tips: {
        0: "DFS explores the entire graph, not just one connected component.",
        1: "Initialize every vertex first so disconnected components still get processed.",
        2: "WHITE means undiscovered.",
        3: "The parent pointer stores the DFS tree.",
        4: "One global timer produces unique discovery and finish timestamps.",
        5: "The outer loop is what lets DFS build a forest for disconnected graphs.",
        6: "Start a new DFS tree only from a WHITE vertex.",
        7: "DFS-VISIT recursively explores everything reachable from the root.",
        9: "This procedure drives search, timestamps, and edge classification.",
        10: "Discovery event: the vertex is encountered for the first time.",
        11: "d[u] marks when u became active.",
        12: "GRAY means u is currently on the recursion stack.",
        13: "Every outgoing edge is examined once, which is where the E term comes from.",
        14: "Edge type depends on the state of the neighbor when the edge is seen.",
        15: "Only WHITE neighbors create new recursive calls.",
        16: "Tree edges build the DFS forest.",
        17: "Recursive descent is the depth-first step.",
        18: "BLACK means the vertex is fully processed.",
        19: "Finish event: all outgoing edges are done.",
        20: "f[u] closes the interval [d[u], f[u]]."
      }
    },

    topo: {
      label: "Topo Sort",
      overviewTitle: "Topological Sort",
      pseudocode: [
        "TOPOLOGICAL-SORT(G):",
        "  order = empty list",
        "  for each vertex u in G.V:",
        "    color[u] = WHITE",
        "  time = 0",
        "  for each vertex u in G.V:",
        "    if color[u] == WHITE:",
        "      DFS-VISIT(u)",
        "  return order",
        "",
        "DFS-VISIT(u):",
        "  time = time + 1; d[u] = time",
        "  color[u] = GRAY",
        "  for each v in Adj[u]:",
        "    if color[v] == WHITE:",
        "      DFS-VISIT(v)",
        "  color[u] = BLACK",
        "  time = time + 1; f[u] = time",
        "  prepend u to order"
      ],
      tips: {
        0: "Topological sort is DFS plus one extra action when a vertex finishes.",
        1: "The order list is built from finish events.",
        2: "Initialization is still regular DFS.",
        3: "WHITE means not yet used in any DFS tree.",
        4: "The timer supports finish-time reasoning.",
        5: "Disconnected DAGs still need the outer loop.",
        6: "Each WHITE vertex can start a new DFS tree.",
        7: "DFS-VISIT handles the recursive part of the DAG.",
        8: "The returned order is valid only if no cycle exists.",
        10: "Discovery timestamps still matter because finish times drive the order.",
        11: "GRAY means the vertex is active on the stack.",
        12: "Explore every outgoing prerequisite edge.",
        13: "Only unvisited neighbors trigger recursion.",
        14: "Go deeper so descendants finish first.",
        15: "After descendants are done, u becomes BLACK.",
        16: "Finish times tell us which vertex must come earlier in the output.",
        17: "Prepending u means later finish times move toward the front."
      }
    },

    cycle: {
      label: "Cycle Detect",
      overviewTitle: "Cycle Detection",
      pseudocode: [
        "HAS-CYCLE(G):",
        "  for each vertex u in G.V:",
        "    color[u] = WHITE",
        "  for each vertex u in G.V:",
        "    if color[u] == WHITE:",
        "      DFS-VISIT(u)",
        "  return false",
        "",
        "DFS-VISIT(u):",
        "  time = time + 1; d[u] = time",
        "  color[u] = GRAY",
        "  for each v in Adj[u]:",
        "    if color[v] == GRAY:",
        "      return true",
        "    if color[v] == WHITE:",
        "      DFS-VISIT(v)",
        "  color[u] = BLACK",
        "  time = time + 1; f[u] = time"
      ],
      tips: {
        0: "Cycle detection watches the DFS traversal for back edges.",
        1: "Every vertex starts WHITE.",
        2: "WHITE means undiscovered and safe to enter.",
        3: "The outer loop keeps working across components.",
        4: "Only WHITE roots start fresh DFS trees.",
        5: "DFS-VISIT is where the proof happens.",
        6: "If no back edge is ever found, the graph is acyclic.",
        8: "The timestamp is not the proof, but it supports explanation and interval reasoning.",
        9: "GRAY means on the recursion stack right now.",
        10: "Every outgoing edge is checked against the neighbor color.",
        11: "A GRAY neighbor is an ancestor still on the stack.",
        12: "That back edge closes a directed cycle.",
        13: "WHITE neighbors are tree edges and recurse normally.",
        14: "Keep searching deeper if the neighbor is unvisited.",
        15: "BLACK means the vertex is finished and no longer on the stack.",
        16: "Finish times still close the interval."
      }
    }
  },

  tours: {
    common: [
      {
        id: 'controls',
        target: '#graphInput',
        title: 'Start With the Graph',
        body: 'Paste a directed adjacency list here or load a preset. Every build starts from this graph text, so this is the first place to change the lesson.'
      },
      {
        id: 'mode',
        target: '#modeRow',
        title: 'Choose the Goal',
        body: 'The same DFS engine powers all three modes. Switch here when you want to emphasize search, topological order, or cycle proof.'
      },
      {
        id: 'build',
        target: '#buildBtn',
        title: 'Build the Walkthrough',
        body: 'Build creates the full sequence of DFS states. Then Step, Step Back, Play, Pause, and Skip End let you control how fast you teach it.'
      },
      {
        id: 'filters',
        target: '#topFilterBtn',
        title: 'Make the Page Readable',
        body: 'Open the Filters menu here when you want a cleaner teaching view. The Essentials preset hides the supporting panels that are not needed for a focused walkthrough.'
      },
      {
        id: 'graph',
        target: '#graphSvg',
        title: 'Read the Main Graph',
        body: 'Nodes change WHITE, GRAY, and BLACK. The top tag shows depth level Lk. The lower labels show discovery and finish time as d/f.'
      },
      {
        id: 'scan',
        target: '#scanPanel',
        title: 'Why This Branch?',
        body: 'This panel explains the branch choice. Each build assigns randomized priorities 1 to 5, orders Adj[u] by that priority, and DFS chooses the first WHITE neighbor in that ordered list.'
      },
      {
        id: 'stack',
        target: '#stackPanel',
        title: 'Track Recursion',
        body: 'The recursion stack shows the active branch from root to current node. If a back edge points to a GRAY node in this stack, you have found a cycle.'
      },
      {
        id: 'depth',
        target: '#depthPanel',
        title: 'See Depth as a Diagram',
        body: 'This chart turns the recursive search tree into coordinates. X is depth level and Y is discovery order, so moving right means going deeper.'
      },
      {
        id: 'code',
        target: '#codePanel',
        title: 'Connect State to Pseudocode',
        body: 'The pseudocode highlight and the explanation box are synced to the current DFS step. Use them when students ask what the algorithm is doing right now.'
      }
    ],
    dfs: [
      {
        id: 'history',
        target: '#historySection',
        title: 'Revisit Important Moments',
        body: 'The history table keeps recent states clickable. This is useful when you want to go back to the first tree edge or the exact moment a branch was chosen.'
      },
      {
        id: 'complexity',
        target: '#complexitySection',
        title: 'Close With Complexity',
        body: 'Finish the story by showing why DFS is O(V + E): vertices are discovered once, and adjacency scans examine each edge once.'
      }
    ],
    topo: [
      {
        id: 'topo',
        target: '#topoPanel',
        title: 'Watch the Topological Order Grow',
        body: 'Vertices are added to the front when they finish. That is why reverse finish time becomes a valid topological order on a DAG.'
      },
      {
        id: 'dag',
        target: '#dagPanel',
        title: 'Connect It to Dynamic Programming',
        body: 'This panel shows how topological order supports longest path on a DAG. Dependencies come first, so later states can reuse earlier results.'
      }
    ],
    cycle: [
      {
        id: 'cycle',
        target: '#cyclePanel',
        title: 'Use the Proof Panel',
        body: 'When DFS sees an edge to a GRAY ancestor, this panel explains the exact cycle path using the current recursion stack.'
      }
    ]
  },

  practice: {
    common: [
      {
        id: 'practice-build',
        target: '#buildBtn',
        title: 'Build the Walkthrough',
        body: 'Click Build Steps now. Guided Practice waits for the real action before continuing.',
        action: 'build',
        waitingText: 'Waiting for you to click Build Steps.',
        doneText: 'Build detected. The DFS timeline is ready.'
      },
      {
        id: 'practice-step',
        target: '#stepBtn',
        title: 'Advance One DFS State',
        body: 'Click Step once so the tool advances to the next DFS state.',
        action: 'step',
        waitingText: 'Waiting for you to click Step.',
        doneText: 'Step detected. You can now see how one DFS action updates the graph.'
      }
    ],
    dfs: [
      {
        id: 'practice-filter',
        target: '#showEssentialsBtn',
        title: 'Reduce Visual Noise',
        body: 'Click Show Essentials so the page switches into a cleaner presenter view.',
        action: 'filter:essentials',
        waitingText: 'Waiting for you to click Show Essentials.',
        doneText: 'Essentials view applied.'
      }
    ],
    topo: [
      {
        id: 'practice-mode-topo',
        target: '#modeRow',
        title: 'Switch to Topological Sort',
        body: 'Click the Topo Sort mode button.',
        action: 'mode:topo',
        waitingText: 'Waiting for you to switch to Topo Sort mode.',
        doneText: 'Topo Sort mode detected.'
      },
      {
        id: 'practice-build-topo',
        target: '#topoPanel',
        title: 'Rebuild for the New Mode',
        body: 'Click Build Steps again so the topological-order walkthrough is generated.',
        action: 'build',
        waitingText: 'Waiting for you to click Build Steps in Topo mode.',
        doneText: 'Topo build detected.'
      }
    ],
    cycle: [
      {
        id: 'practice-mode-cycle',
        target: '#modeRow',
        title: 'Switch to Cycle Detect',
        body: 'Click the Cycle Detect mode button.',
        action: 'mode:cycle',
        waitingText: 'Waiting for you to switch to Cycle Detect mode.',
        doneText: 'Cycle Detect mode detected.'
      }
    ]
  },

  overview(mode) {
    const blocks = {
      dfs: [
        {
          title: "Core Idea",
          open: true,
          body:
            "<div class=\"detail-body\"><p><strong>Depth-first search</strong> explores as far as possible before backtracking. Every vertex moves through WHITE -> GRAY -> BLACK, and each active call stays on the recursion stack until all outgoing edges are scanned.</p></div>"
        },
        {
          title: "CLO-1: Complexity and Timestamps",
          open: false,
          body:
            "<div class=\"detail-body\"><p>DFS is <strong>O(V + E)</strong> because each vertex is discovered once and each directed edge is examined once from its adjacency list. Discovery and finish times create intervals <code>[d[u], f[u]]</code> that are either nested or disjoint. That is the parenthesis theorem.</p></div>"
        },
        {
          title: "CLO-2: DFS as Searching",
          open: false,
          body:
            "<div class=\"detail-body\"><p>DFS is not just recursion for its own sake. It is a <strong>depth-first searching strategy</strong>: when the current node has several outgoing choices, DFS commits to one branch, keeps going deeper, and only backtracks when no WHITE neighbor remains.</p><p>Changing adjacency order can change the DFS forest, discovery/finish times, and the order in which evidence appears. What does <strong>not</strong> change is the graph itself, the reachability facts, or the proof rule that a GRAY back edge witnesses a cycle.</p></div>"
        },
        {
          title: "Worked Example",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Use the <strong>CLRS 22.4</strong> preset and step through it. Watch how <code>[d[v], f[v]]</code> sits inside <code>[d[u], f[u]]</code> when <code>u</code> is an ancestor of <code>v</code>.</p></div>"
        },
        {
          title: "Common Mistakes",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Do not confuse <strong>GRAY</strong> with finished. GRAY means the node is still active on the recursion stack. Also do not assume timestamps are decoration: they are exactly what makes interval nesting and edge classification explainable.</p></div>"
        }
      ],
      topo: [
        {
          title: "Core Idea",
          open: true,
          body:
            "<div class=\"detail-body\"><p><strong>Topological sort</strong> outputs vertices in reverse finish-time order. If the graph is a DAG, every edge <code>u -> v</code> goes from an earlier vertex in the ordering to a later one.</p></div>"
        },
        {
          title: "CLO-3: Dynamic Programming on DAGs",
          open: false,
          body:
            "<div class=\"detail-body\"><p>The explicit paradigm here is <strong>dynamic programming on a DAG</strong>. DFS gives a topological order, and that order lets the tool process each node only after every prerequisite that can improve it has already been handled. The longest-path table is not an extra factoid; it is the CLO-3 paradigm demonstration.</p></div>"
        },
        {
          title: "Important Restriction",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Topological sort only makes sense on a DAG. If DFS discovers a back edge, the graph has a directed cycle and no valid topological order exists.</p></div>"
        },
        {
          title: "Worked Example",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Use the <strong>DAG / Topo</strong> preset. Build the DFS order first, then read the dynamic-programming panel row by row. Notice that each best distance is computed only after the nodes that feed into it are already settled.</p></div>"
        },
        {
          title: "Common Mistakes",
          open: false,
          body:
            "<div class=\"detail-body\"><p>A common mistake is to treat the topological order as the final goal. For CLO-3, the important point is <strong>why</strong> that order matters: it turns the DAG into a valid one-pass dynamic-programming schedule. In a cyclic graph, this schedule does not exist.</p></div>"
        }
      ],
      cycle: [
        {
          title: "Core Theorem",
          open: true,
          body:
            "<div class=\"detail-body\"><p>A directed graph contains a cycle <strong>if and only if</strong> DFS finds a back edge to a GRAY ancestor. GRAY is the key state because it means the ancestor is still on the active recursion stack.</p></div>"
        },
        {
          title: "Proof Sketch",
          open: false,
          body:
            "<div class=\"detail-body\"><p>If DFS sees <code>u -> v</code> while <code>v</code> is GRAY, then the stack already contains a path <code>v -> ... -> u</code>. Adding <code>u -> v</code> closes a cycle. If no back edge exists, DFS never closes such a loop.</p></div>"
        },
        {
          title: "Worked Example",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Use the <strong>Has Cycle</strong> preset. When DFS reaches <code>D -> A</code>, vertex <code>A</code> is still GRAY, so the tool can show the proof path <code>A -> B -> D -> A</code>.</p></div>"
        },
        {
          title: "Common Mistakes",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Do not call every edge to an already seen vertex a cycle. A cycle proof needs a <strong>back edge to a GRAY ancestor</strong>. Forward and cross edges point to BLACK vertices and do not by themselves prove a directed cycle.</p></div>"
        }
      ]
    };

    return blocks[mode]
      .map((block) => {
        const openAttr = block.open ? " open" : "";
        return `<details${openAttr}><summary>${block.title}</summary>${block.body}</details>`;
      })
      .join("");
  }
};
