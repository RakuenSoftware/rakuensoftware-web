#!/usr/bin/env bash
#
# Deploy rakuensoftware.com.
#
# Runs on the rakuen-web host (Proxmox CT 107 on 192.168.1.253), where this repo is
# checked out at /opt/rakuen-web and served by the rakuen-web.service unit:
#
#     ExecStart=/usr/bin/node /opt/rakuen-web/server.mjs
#
# The nginx-proxy container (CT 105) terminates TLS for rakuensoftware.com and
# forwards to :3000. There is no CI.
#
# This deploys CODE. Articles do not need it: publishing is a line in
# rakuen-blog's articles/PUBLISHED, and the autopublish timer beside this script
# picks that up within a few minutes and runs the article path below on its own.
# Reach for this when the site's own source has changed.
#
# What it does: fast-forward the checkout to origin/main, install deps only if
# the lockfile moved, pull the articles, build into a scratch dir, swap it into
# place atomically, restart the server, and verify the new bundle is being
# served — rolling back to the previous dist if the check fails, so a broken
# build never goes live.
#
# Deliberate tradeoff: this repo does not pin an article revision. It is a
# renderer over rakuen-blog main, so a deploy publishes whatever that branch says
# at the moment it runs. Two consequences worth knowing before you are surprised
# by them. Redeploying an older commit of THIS repo does not restore the article
# text that was live then, only the code. And the rollback below restores the
# previous dist, which is a real rollback, but redeploying after it will pull
# current articles again. If you need an exact past state, check out the article
# revision you want in a local clone and build with BLOG_LOCAL pointed at it.
#
# Usage (from the host):   /opt/rakuen-web/scripts/deploy.sh
# Usage (from a jump box): ssh root@192.168.1.253 'pct exec 107 -- /opt/rakuen-web/scripts/deploy.sh'

set -euo pipefail

REPO=/opt/rakuen-web
BRANCH=main
PORT=3000
SERVICE=rakuen-web.service

cd "$REPO"
old_rev=$(git rev-parse --short HEAD)
new_rev=$old_rev

# ARTICLES_ONLY=1 rebuilds from the current checkout without moving it. The
# autopublish timer uses it, so a new article never drags along whatever code
# happens to be sitting on main. Code changes stay a deliberate deploy.
if [ "${ARTICLES_ONLY:-0}" = "1" ]; then
  echo "==> Articles only, leaving the checkout at $(git rev-parse --short HEAD)"
else
  if [ -n "$(git status --porcelain)" ]; then
    echo "refusing to deploy: working tree at $REPO has local changes" >&2
    git status --short >&2
    exit 1
  fi

  echo "==> Syncing $BRANCH"
  git fetch --quiet origin "$BRANCH"
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

# Keep the checked-in service definition authoritative. Besides serving the
# public bundle, it starts the private analytics dashboard on its own port.
if ! cmp -s scripts/rakuen-web.service /etc/systemd/system/rakuen-web.service; then
  install -m 0644 scripts/rakuen-web.service /etc/systemd/system/rakuen-web.service
  systemctl daemon-reload
fi
systemctl restart "$SERVICE"

echo "==> Verifying"
asset=$(grep -oE 'assets/index-[^"]+\.js' dist/index.html | head -1)
ok=""
for _ in 1 2 3 4 5; do
  sleep 1
  if curl -fsS "http://127.0.0.1:$PORT/$asset" -o /dev/null \
    && curl -fsS "http://127.0.0.1:$PORT/__analytics/health" -o /dev/null; then ok=1; break; fi
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
