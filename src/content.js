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
          title: "Worked Example",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Use the <strong>CLRS 22.4</strong> preset and step through it. Watch how <code>[d[v], f[v]]</code> sits inside <code>[d[u], f[u]]</code> when <code>u</code> is an ancestor of <code>v</code>.</p></div>"
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
          title: "CLO-3: Design Paradigm",
          open: false,
          body:
            "<div class=\"detail-body\"><p>DFS decomposes the graph into dependency-respecting pieces. Once you have a topological order, dynamic programming on a DAG becomes natural because every state is processed after its prerequisites. This tool shows that with longest path on a DAG.</p></div>"
        },
        {
          title: "Important Restriction",
          open: false,
          body:
            "<div class=\"detail-body\"><p>Topological sort only makes sense on a DAG. If DFS discovers a back edge, the graph has a directed cycle and no valid topological order exists.</p></div>"
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
