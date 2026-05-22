#!/bin/sh
set -e

# Start API and Engine processes and forward signals for graceful shutdown

API_CMD="node /app/api/dist/index.js"
ENGINE_CMD="node /app/engine/node_modules/.bin/next start -p 3001"

echo "Starting API: $API_CMD"
sh -c "$API_CMD" &
API_PID=$!

echo "Starting Engine (Next): $ENGINE_CMD"
sh -c "$ENGINE_CMD" &
ENGINE_PID=$!

_term() {
  echo "Received SIGTERM, shutting down..."
  kill -TERM "$API_PID" 2>/dev/null || true
  kill -TERM "$ENGINE_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null
  wait "$ENGINE_PID" 2>/dev/null
  exit 0
}

trap _term SIGTERM SIGINT

# Wait on children
wait $API_PID
wait $ENGINE_PID
