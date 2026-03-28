# DFS, Topological Sort, and Cycle Detection Tool

This project keeps the source readable in small files but produces the required single-file deliverable for GitHub Pages.

## Files

- `src/template.html`: page structure and inline placeholders
- `src/styles.css`: styling for the dark two-column teaching UI
- `src/content.js`: presets, pseudocode, and educational content
- `src/app.js`: graph parsing, DFS step engine, rendering, and controls
- `scripts/build-single-html.sh`: assembles the final single `index.html`
- `index.html`: generated deploy target
- `multipage/`: alternate multi-page version with separate DFS, topo, and cycle pages

## Build

Run:

```bash
./scripts/build-single-html.sh
```

## Test

Run:

```bash
node tests/smoke-test.js
```

## Run

Single-page version:

```bash
python3 -m http.server 8000
```

Then open:

```bash
cmd.exe /C start http://localhost:8000/index.html
```

Multi-page version:

```bash
cmd.exe /C start http://localhost:8000/multipage/index.html
```

## New UX Features

- Guided tour overlays with `Next`, `Back`, and `Skip`
- Single-page readability filters with `Show Essentials` and `Show All`
- Branch-choice explanation panels showing why DFS selected the current neighbor

## Deploy on GitHub Pages

1. Push the project to a GitHub repository.
2. Keep the generated `index.html` at the repository root.
3. In GitHub, open `Settings -> Pages`.
4. Set the source to deploy from the main branch root.

## Teaching Checklist

- DFS traversal with discovery and finish times
- Tree, back, forward, and cross edge classification
- Cycle detection through back-edge proof
- Topological order on DAGs
- Parenthesis theorem interval view
- Complexity comparison showing DFS and BFS are both `O(V + E)`
- DAG longest-path example to connect topo sort to dynamic programming
