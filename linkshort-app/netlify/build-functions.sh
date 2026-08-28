#!/usr/bin/env bash
# Assembles a self-contained Netlify function bundle for Shrinqo.
#
# Netlify zips only the function directory (+ its node_modules). Shrinqo's real
# app is server.js + a public/ directory, both living outside the function dir.
# This copies them into netlify/functions/_server so the function is fully
# self-contained (and the adapter's require('./_server/server.js') resolves).
#
# Static files are read by server.js relative to its own __dirname, so public/
# must be copied next to server.js inside the bundle.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUNC_DIR="$ROOT/netlify/functions"
# Directory-based function: everything under netlify/functions/api/ is zipped
# as the function bundle. server.js + public are copied beside the entry so the
# function is fully self-contained.
BUNDLE_DIR="$FUNC_DIR/api/_server"

rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"

cp "$ROOT/server.js" "$BUNDLE_DIR/server.js"
cp "$ROOT/netlify/functions/api/turso-sync.js" "$BUNDLE_DIR/turso-sync.js"
cp -r "$ROOT/public" "$BUNDLE_DIR/public"

echo "[netlify-build] bundled server.js + public/ -> $BUNDLE_DIR"
