const GUIDE_DATA = {
  presets: {
    dfs: [
      {
        label: 'Classic DFS',
        graph: 'A: B D\nB: C E\nC: F\nD: B\nE: D F\nF:',
        note: 'Follow adjacency order and recursion depth as DFS commits to one branch before coming back.'
      },
      {
        label: 'Disconnected Forest',
        graph: 'A: B C\nB: D\nC:\nD:\nE: F G\nF: H\nG:\nH:',
        note: 'The outer loop starts a second DFS tree after the first component is finished.'
      },
      {
        label: 'CLRS 22.4',
        graph: 'u: v x\nv: y\nx: v\ny: x\nw: y z\nz:',
        note: 'Good for showing discovery/finish intervals and the parenthesis theorem.'
      }
    ],
    topo: [
      {
        label: 'Dressing DAG',
        graph: 'Undershorts: Pants Shoes\nPants: Belt Shoes\nBelt: Jacket\nShirt: Belt Tie\nTie: Jacket\nSocks: Shoes\nShoes:\nWatch:\nJacket:',
        note: 'Reverse finish order gives a legal dressing sequence.'
      },
      {
        label: 'Course Plan',
        graph: 'Intro: DS Algo\nDS: Graphs\nAlgo: Graphs\nGraphs: Project\nProject:\nMath: Algo',
        note: 'Dependencies flow left to right in the final order.'
      }
    ],
    cycle: [
      {
        label: 'Simple Cycle',
        graph: 'A: B C\nB: D\nC: E\nD: A\nE:',
        note: 'D -> A is a back edge to a GRAY ancestor, so DFS proves a cycle.'
      },
      {
        label: 'Cycle in Second Branch',
        graph: 'A: B\nB: C\nC:\nD: E\nE: F\nF: D',
        note: 'The first component is acyclic, but the second component contains a cycle.'
      }
    ]
  },

  descriptions: {
    dfs: 'DFS always scans adjacency lists in order and recurses immediately on the first WHITE neighbor. That is why one branch is chosen before the algorithm backtracks.',
    topo: 'Topological sort is DFS plus one extra rule: prepend a node when it finishes. A DAG is required because cycles destroy any valid dependency order.',
    cycle: 'Cycle detection watches for a back edge. If the current node points to a GRAY ancestor, the stack already contains a path back to that ancestor.'
  },

  tours: {
    dfs: [
      { target: '#graphInput', title: 'Set the Graph', body: 'Start with a preset or your own adjacency list. Every DFS walkthrough on this page comes from this directed graph.' },
      { target: '#buildBtn', title: 'Build the States', body: 'Build prepares the full DFS timeline. Then Step and Play let you control how the explanation unfolds.' },
      { target: '#topFilterBtn', title: 'Trim the Page When Needed', body: 'Open Filters here when you want a cleaner presentation view. You can hide timestamps or the full diagram section without leaving the page.' },
      { target: '#graphSvg', title: 'Read the Graph', body: 'The graph shows color changes, timestamps, and branch priorities. Depth is visible both in the labels and in the depth diagram.' },
      { target: '#scanSummary', title: 'Why This Branch?', body: 'This page explains branch choice directly. DFS chooses the first WHITE neighbor in the current priority order.' },
      { target: '#diagramSvg', title: 'Depth Ladder', body: 'The diagram turns recursion depth into a visual ladder, so students can see how the search dives and then backtracks.' }
    ],
    topo: [
      { target: '#graphInput', title: 'Start With a DAG', body: 'Topological sort needs an acyclic directed graph. Use the presets to show a valid dependency graph first.' },
      { target: '#topFilterBtn', title: 'Trim the Page When Needed', body: 'Open Filters here when you want to hide timestamps or secondary panels for a cleaner explanation.' },
      { target: '#topoStrip', title: 'Watch the Order Grow', body: 'Vertices are prepended when they finish. That is why reverse finish time becomes the final topological order.' },
      { target: '#scanSummary', title: 'Why This Branch?', body: 'This page still uses DFS branch choice. The branch explanation helps students see that topo sort is built on the same DFS engine.' },
      { target: '#diagramSvg', title: 'Finish-Time Conveyor', body: 'This diagram focuses on the finish events and the order they create, instead of the raw recursion tree.' }
    ],
    cycle: [
      { target: '#graphInput', title: 'Choose a Cyclic Graph', body: 'Use a preset with a real directed cycle so the page can show the first back edge clearly.' },
      { target: '#topFilterBtn', title: 'Trim the Page When Needed', body: 'Open Filters here when you want to simplify the page and keep only the cycle proof panels visible.' },
      { target: '#graphSvg', title: 'Watch for GRAY Ancestors', body: 'A back edge to a GRAY node is the signal. That node is still active on the recursion stack.' },
      { target: '#scanSummary', title: 'Why This Branch?', body: 'The scan panel still explains the branch order, but it also tells you when a branch leads to a cycle proof instead of deeper recursion.' },
      { target: '#diagramSvg', title: 'Cycle Proof Diagram', body: 'Once a back edge appears, this diagram shows the active stack path that closes the loop.' }
    ]
  },

  practice: {
    dfs: [
      { target: '#buildBtn', title: 'Build the DFS Walkthrough', body: 'Click Build to generate the DFS states for this page.', action: 'build', waitingText: 'Waiting for Build.', doneText: 'Build detected.' },
      { target: '#stepBtn', title: 'Advance One DFS State', body: 'Click Step once so the page advances by one DFS action.', action: 'step', waitingText: 'Waiting for Step.', doneText: 'Step detected.' }
    ],
    topo: [
      { target: '#buildBtn', title: 'Build the Topological Walkthrough', body: 'Click Build to generate the topological-sort sequence.', action: 'build', waitingText: 'Waiting for Build.', doneText: 'Build detected.' },
      { target: '#stepBtn', title: 'Advance One Finish Event', body: 'Click Step once and watch how the ordering starts to develop.', action: 'step', waitingText: 'Waiting for Step.', doneText: 'Step detected.' }
    ],
    cycle: [
      { target: '#buildBtn', title: 'Build the Cycle Walkthrough', body: 'Click Build to generate the cycle-detection sequence.', action: 'build', waitingText: 'Waiting for Build.', doneText: 'Build detected.' },
      { target: '#stepBtn', title: 'Advance One DFS State', body: 'Click Step once so the page moves closer to the back-edge proof.', action: 'step', waitingText: 'Waiting for Step.', doneText: 'Step detected.' }
    ]
  }
};
