#!/bin/sh
set -e

# Bootstrap unbrowse and warm up the server (if available)
if command -v unbrowse >/dev/null 2>&1; then
  echo "[entrypoint] Initializing unbrowse..."
  # Run setup to accept terms and configure
  echo "y" | unbrowse setup --skip-browser 2>&1 || true
  # Health check triggers auto-start of the local HTTP server on port 6969
  unbrowse health 2>&1 || true
  echo "[entrypoint] Unbrowse server ready on port 6969"
else
  echo "[entrypoint] Unbrowse CLI not found, skipping (fallback mode)"
fi

# Start Next.js
echo "[entrypoint] Starting Next.js server..."
exec node server.js
