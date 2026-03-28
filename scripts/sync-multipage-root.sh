#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/multipage"

cp "$SOURCE_DIR/styles.css" "$ROOT_DIR/guide-styles.css"
cp "$SOURCE_DIR/app.js" "$ROOT_DIR/guide-app.js"
cp "$SOURCE_DIR/data.js" "$ROOT_DIR/guide-data.js"

cp "$SOURCE_DIR/index.html" "$ROOT_DIR/guide.html"
cp "$SOURCE_DIR/dfs.html" "$ROOT_DIR/dfs.html"
cp "$SOURCE_DIR/topo.html" "$ROOT_DIR/topo.html"
cp "$SOURCE_DIR/cycle.html" "$ROOT_DIR/cycle.html"

perl -0pi -e 's/href="\.\.\/brand\.css"/href="brand.css"/g; s/href="styles\.css"/href="guide-styles.css"/g; s/src="data\.js"/src="guide-data.js"/g; s/src="app\.js"/src="guide-app.js"/g; s/href="\.\.\/index\.html"/href="__ROOT_HOME__"/g; s/href="index\.html"/href="guide.html"/g; s/href="__ROOT_HOME__"/href="index.html"/g;' \
  "$ROOT_DIR/guide.html" \
  "$ROOT_DIR/dfs.html" \
  "$ROOT_DIR/topo.html" \
  "$ROOT_DIR/cycle.html"
