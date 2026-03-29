#!/bin/bash
# Open Creator - One-command bootstrap
# Usage: bash boot.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting Open Creator..."

# Kill anything on our ports
lsof -ti:3012 | xargs kill -9 2>/dev/null || true
lsof -ti:5180 | xargs kill -9 2>/dev/null || true

# Install server deps if needed
if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
  echo "📦 Installing server dependencies..."
  (cd "$SCRIPT_DIR/server" && npm install)
fi

# Install client deps if needed
if [ ! -d "$SCRIPT_DIR/client/node_modules" ]; then
  echo "📦 Installing client dependencies..."
  (cd "$SCRIPT_DIR/client" && npm install)
fi

# Start server in background (using absolute paths, no cd needed)
echo "🖥️  Starting server on port 3012..."
node "$SCRIPT_DIR/server/src/index.js" &
SERVER_PID=$!

# Start client in background
echo "🌐 Starting client on port 5180..."
(cd "$SCRIPT_DIR/client" && node start.cjs) &
CLIENT_PID=$!

# Wait for client to be ready
sleep 3

# Open in browser
echo "🌍 Opening http://localhost:5180 ..."
open http://localhost:5180

# Trap Ctrl+C to kill both processes
trap "echo '🛑 Shutting down...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM

echo ""
echo "✅ Open Creator is running!"
echo "   Client: http://localhost:5180"
echo "   Server: http://localhost:3012"
echo "   Public site: http://localhost:3012/site"
echo ""
echo "Press Ctrl+C to stop."

# Wait for either process to exit
wait
