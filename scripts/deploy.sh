#!/usr/bin/env bash
# Deploy main on the website host. autopublish.sh calls this after a branch move;
# it can also be run manually. Articles-only rebuilds retain the current code.
# All publishers share one lock. A failed attempt restores the previous code,
# dependencies and bundle, and leaves the successful-deployment marker unchanged.
set -euo pipefail

REPO=${REPO:-/opt/rakuen-web}
PORT=${PORT:-3000}
SERVICE=${SERVICE:-rakuen-web.service}
SYSTEMD_DIR=${SYSTEMD_DIR:-/etc/systemd/system}
cd "$REPO"

exec 9> .publish.lock
flock 9

old_rev=$(git rev-parse HEAD)
new_rev=$old_rev
code_changed=0
deps_changed=0
previous_bundle=0
swapped=0
unit_changed=0
unit_existed=0
unit_backup=''

rollback() {
  result=$?
  trap - EXIT
  set +e
  if [ "$result" -ne 0 ]; then
    echo "!! Deployment failed; restoring $old_rev" >&2
    if [ "$swapped" = 1 ]; then rm -rf dist; fi
    if [ "$previous_bundle" = 1 ]; then mv dist.prev dist; fi
    if [ "$code_changed" = 1 ]; then
      git reset --hard --quiet "$old_rev" || echo '!! Could not restore checkout' >&2
    fi
    if [ "$deps_changed" = 1 ]; then
      npm ci --no-audit --no-fund || echo '!! Could not restore dependencies' >&2
    fi
    if [ "$unit_changed" = 1 ]; then
      if [ "$unit_existed" = 1 ]; then
        cp "$unit_backup" "$SYSTEMD_DIR/$SERVICE"
      else
        rm -f "$SYSTEMD_DIR/$SERVICE"
      fi
      systemctl daemon-reload
    fi
    if [ "$swapped" = 1 ]; then
      systemctl restart "$SERVICE" || echo '!! Could not restart the previous server' >&2
    fi
  fi
  rm -rf dist.new
  if [ -n "$unit_backup" ]; then rm -f "$unit_backup"; fi
  exit "$result"
}
trap rollback EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ -n "$(git status --porcelain)" ]; then
  echo "refusing to deploy: working tree at $REPO has local changes" >&2
  git status --short >&2
  exit 1
fi

if [ "${ARTICLES_ONLY:-0}" = 1 ]; then
  if [ "$(cat .last-site-sha 2>/dev/null || echo none)" != "$old_rev" ]; then
    echo 'refusing article rebuild: checkout differs from the last verified deployment' >&2
    exit 1
  fi
  echo "==> Articles only, leaving the checkout at $old_rev"
else
  echo '==> Syncing main'
  git fetch --quiet origin main
  new_rev=$(git rev-parse origin/main)
  if [ "$new_rev" != "$old_rev" ]; then
    if ! git diff --quiet "$old_rev" "$new_rev" -- package-lock.json; then
      deps_changed=1
    fi
    code_changed=1
    git reset --hard --quiet "$new_rev"
  fi
  echo "    $old_rev -> $new_rev"
  last_live=$(cat .last-site-sha 2>/dev/null || echo none)
  if [ "$deps_changed" = 1 ] || [ ! -d node_modules ] || [ "$last_live" != "$new_rev" ]; then
    # A partial install must be repaired on rollback as well.
    deps_changed=1
    echo '==> Installing locked dependencies'
    npm ci --no-audit --no-fund
  fi
fi

# The same gate CI runs on pull requests.
scripts/verify.sh

# Keep the checked-in web service definition authoritative.
if ! cmp -s scripts/rakuen-web.service "$SYSTEMD_DIR/$SERVICE"; then
  unit_backup=$(mktemp)
  if [ -f "$SYSTEMD_DIR/$SERVICE" ]; then
    cp "$SYSTEMD_DIR/$SERVICE" "$unit_backup"
    unit_existed=1
  fi
  unit_changed=1
  install -m 0644 scripts/rakuen-web.service "$SYSTEMD_DIR/$SERVICE"
  systemctl daemon-reload
fi

echo '==> Swapping dist into place'
rm -rf dist.prev
if [ -d dist ]; then mv dist dist.prev; previous_bundle=1; fi
mv dist.new dist
swapped=1
systemctl restart "$SERVICE"

echo '==> Verifying'
asset=$(grep -oE 'assets/index-[^"]+\.js' dist/index.html | head -1)
ok=''
for _ in 1 2 3 4 5; do
  if curl -fsS --connect-timeout 3 --max-time 10 "http://127.0.0.1:$PORT/$asset" -o /dev/null \
    && curl -fsS --connect-timeout 3 --max-time 10 "http://127.0.0.1:$PORT/__analytics/health" -o /dev/null; then ok=1; break; fi
  sleep 1
done
if [ -z "$ok" ]; then
  echo "!! Verification failed for $asset" >&2
  exit 1
fi

# HEAD alone is not evidence that its build reached production. Only publish a
# marker after validation, service restart and HTTP checks have all succeeded.
printf '%s\n' "$new_rev" > .last-site-sha.tmp
mv .last-site-sha.tmp .last-site-sha
trap - EXIT
if [ -n "$unit_backup" ]; then rm -f "$unit_backup"; fi
rm -rf dist.prev
echo "==> Live: $asset (commit $new_rev)"
