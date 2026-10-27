#!/usr/bin/env bash
# Build + rsync ScanLead web with near-zero user-visible downtime.
# Edge proxy on :3010 stays up and shows "Updating…" while Next restarts on :3011.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-oracle-jogi}"
REMOTE="${DEPLOY_REMOTE:-/home/ubuntu/apps/scanlead/web}"

cd "$ROOT"
echo "==> Building"
npm run build

echo "==> Rsync standalone + static + edge scripts"
rsync -az --delete -e 'ssh -o BatchMode=yes' \
  "$ROOT/.next/standalone/" \
  "$HOST:$REMOTE/"
rsync -az -e 'ssh -o BatchMode=yes' \
  "$ROOT/.next/static/" \
  "$HOST:$REMOTE/.next/static/"
if [[ -d "$ROOT/public" ]]; then
  rsync -az -e 'ssh -o BatchMode=yes' \
    "$ROOT/public/" \
    "$HOST:$REMOTE/public/"
fi
# Edge scripts live next to server.js on the VM
rsync -az -e 'ssh -o BatchMode=yes' \
  "$ROOT/scripts/scanlead-edge.js" \
  "$ROOT/scripts/updating.html" \
  "$HOST:$REMOTE/scripts/"
scp -o BatchMode=yes "$ROOT/ecosystem.config.cjs" "$HOST:$REMOTE/ecosystem.config.cjs"

echo "==> Reload PM2 (edge stays up; only Next restarts)"
ssh -o BatchMode=yes "$HOST" "set -e
  export PATH=\"\$HOME/.nvm/versions/node/\$(ls \$HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:/usr/bin:\$PATH\"
  WEB='$REMOTE'
  mkdir -p \"\$WEB/scripts\" /home/ubuntu/apps/scanlead/logs

  # Fresh start from ecosystem so PORT=3011 applies (restart keeps stale env).
  # Edge comes up first on :3010; while Next boots it serves updating.html.
  pm2 delete scanlead-web 2>/dev/null || true
  if ! pm2 describe scanlead-edge >/dev/null 2>&1; then
    pm2 start \"\$WEB/ecosystem.config.cjs\" --only scanlead-edge --update-env
  fi
  pm2 start \"\$WEB/ecosystem.config.cjs\" --only scanlead-web --update-env
  pm2 save

  for i in \$(seq 1 25); do
    if curl -sf -o /dev/null http://127.0.0.1:3011/ \\
      && curl -sf -o /dev/null http://127.0.0.1:3010/; then
      echo \"edge:200 upstream:200\"
      pm2 list | grep scanlead || true
      exit 0
    fi
    sleep 1
  done
  echo 'Upstream health failed'
  pm2 logs scanlead-web --lines 40 --nostream || true
  pm2 logs scanlead-edge --lines 20 --nostream || true
  exit 1
"

echo "==> Done"
