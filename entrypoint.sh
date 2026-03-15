#!/bin/sh
set -e

# Start unbrowse server in background (if available)
if command -v unbrowse >/dev/null 2>&1; then
  echo "[entrypoint] Starting unbrowse server on port 6969..."
  unbrowse serve --port 6969 &
  UNBROWSE_PID=$!
  # Give it a moment to start
  sleep 2
  if kill -0 "$UNBROWSE_PID" 2>/dev/null; then
    echo "[entrypoint] Unbrowse server started (PID $UNBROWSE_PID)"
  else
    echo "[entrypoint] Unbrowse server failed to start, continuing without it"
  fi
else
  echo "[entrypoint] Unbrowse CLI not found, skipping (fallback mode)"
fi

# Start Next.js
echo "[entrypoint] Starting Next.js server..."
exec node server.js
