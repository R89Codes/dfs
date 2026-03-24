#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT_DIR/src/template.html"
STYLE_FILE="$ROOT_DIR/src/styles.css"
CONTENT_FILE="$ROOT_DIR/src/content.js"
APP_FILE="$ROOT_DIR/src/app.js"
OUTPUT_FILE="$ROOT_DIR/index.html"

export TEMPLATE STYLE_FILE CONTENT_FILE APP_FILE OUTPUT_FILE

node <<'NODE'
const fs = require('node:fs');

const template = fs.readFileSync(process.env.TEMPLATE, 'utf8');
const style = fs.readFileSync(process.env.STYLE_FILE, 'utf8');
const content = fs.readFileSync(process.env.CONTENT_FILE, 'utf8');
const app = fs.readFileSync(process.env.APP_FILE, 'utf8');

const output = template
  .replace('__INLINE_STYLE__', style)
  .replace('__INLINE_CONTENT__', content)
  .replace('__INLINE_APP__', app);

fs.writeFileSync(process.env.OUTPUT_FILE, output);
NODE
