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
  }
};
