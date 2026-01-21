#!/bin/bash

# Start all integration example servers
# VitePress: http://localhost:9901
# Docusaurus: http://localhost:9902
# MkDocs: http://localhost:9903

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXAMPLES_DIR="$PROJECT_DIR/integrations/examples"

echo "Starting integration examples..."
echo ""

# VitePress
echo "Starting VitePress on http://localhost:9901"
cd "$EXAMPLES_DIR/vitepress" && pnpm dev --port 9901 &

# Docusaurus
echo "Starting Docusaurus on http://localhost:9902"
cd "$EXAMPLES_DIR/docusaurus" && pnpm docusaurus start --port 9902 &

# MkDocs
echo "Starting MkDocs on http://localhost:9903"
cd "$EXAMPLES_DIR/mkdocs" && source .venv/bin/activate && mkdocs serve --dev-addr localhost:9903 &

echo ""
echo "All servers starting..."
echo ""
echo "  VitePress:  http://localhost:9901"
echo "  Docusaurus: http://localhost:9902"
echo "  MkDocs:     http://localhost:9903"
echo ""
echo "Press Ctrl+C to stop all servers"

wait
