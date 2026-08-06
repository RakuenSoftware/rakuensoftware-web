#!/usr/bin/env bash
#
# Deploy rakuensoftware.com.
#
# Runs on the rakuen-web host (Proxmox CT 107 on 192.168.1.253), where this repo is
# checked out at /opt/rakuen-web and served by the rakuen-web.service unit:
#
#     ExecStart=/usr/local/bin/serve -s /opt/rakuen-web/dist -l 3000
#
# The nginx-proxy container (CT 105) terminates TLS for rakuensoftware.com and
# forwards to :3000. There is no CI; publishing is: land the article on
# rakuen-blog main, then run this. The site itself only needs a deploy when its
# own code changes, because articles are pulled at build time.
#
# What it does: fast-forward the checkout to origin/main, install deps only if
# the lockfile moved, build into a scratch dir, swap it into place atomically,
# restart the server, and verify the new bundle is being served — rolling back
# to the previous dist if the check fails, so a broken build never goes live.
#
# Usage (from the host):   /opt/rakuen-web/scripts/deploy.sh
# Usage (from a jump box): ssh root@192.168.1.253 'pct exec 107 -- /opt/rakuen-web/scripts/deploy.sh'

set -euo pipefail

REPO=/opt/rakuen-web
BRANCH=main
PORT=3000
SERVICE=rakuen-web.service

cd "$REPO"

if [ -n "$(git status --porcelain)" ]; then
  echo "refusing to deploy: working tree at $REPO has local changes" >&2
  git status --short >&2
  exit 1
fi

echo "==> Syncing $BRANCH"
git fetch --quiet origin "$BRANCH"
old_rev=$(git rev-parse --short HEAD)
git reset --hard --quiet "origin/$BRANCH"
new_rev=$(git rev-parse --short HEAD)
echo "    $old_rev -> $new_rev"

# node_modules and the vendored smoothgui tarball are already present; only pay
# for a reinstall when the lockfile actually changed between the two revisions.
if ! git diff --quiet "$old_rev" "$new_rev" -- package-lock.json; then
  echo "==> package-lock.json changed, running npm ci"
  npm ci --no-audit --no-fund
else
  echo "==> Dependencies unchanged, skipping install"
fi

echo "==> Pulling articles"
node scripts/sync-articles.mjs

echo "==> Building"
rm -rf dist.new
npx vite build --outDir dist.new --emptyOutDir >/dev/null

echo "==> Swapping dist into place"
rm -rf dist.prev
[ -d dist ] && mv dist dist.prev
mv dist.new dist
systemctl restart "$SERVICE"

echo "==> Verifying"
asset=$(grep -oE 'assets/index-[^"]+\.js' dist/index.html | head -1)
ok=""
for _ in 1 2 3 4 5; do
  sleep 1
  if curl -fsS "http://127.0.0.1:$PORT/$asset" -o /dev/null; then ok=1; break; fi
done

if [ -n "$ok" ]; then
  echo "==> Live: $asset (commit $new_rev)"
  rm -rf dist.prev
else
  echo "!!  Verification failed for $asset — rolling back to $old_rev" >&2
  rm -rf dist
  mv dist.prev dist
  systemctl restart "$SERVICE"
  exit 1
fi
