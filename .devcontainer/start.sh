#!/usr/bin/env bash
# Run on every attach: brings the chain up and serves the app, then prints the
# URLs. The cluster's ports and operator keys are new on every start, so this
# cannot be baked into the image.
set -euo pipefail
cd "$(dirname "$0")/.."

if curl -sf -m 2 http://127.0.0.1:8997/ >/dev/null 2>&1; then
  echo "Regtest already running."
else
  echo "Starting the regtest environment. First run takes a few minutes."
  bash .devcontainer/sdk.sh
  bash .devcontainer/images.sh
  npm run regtest:up
fi

# Backgrounded: this command runs as part of attaching, and a dev server in the
# foreground would never hand the terminal back.
if ! curl -sf -m 2 http://127.0.0.1:5173 >/dev/null 2>&1; then
  nohup npm run dev -- --host 0.0.0.0 > /tmp/glow-dev.log 2>&1 &
fi

host="${CODESPACE_NAME:+https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}}"
cat <<BANNER

  Glow is starting.

  Open:  ${host:-http://localhost:5173}/?network=regtest

  Give yourself coins:  npm run regtest:fund -- 200000 3
  Mine blocks:          node local-regtest/btc.mjs mine 6

BANNER
