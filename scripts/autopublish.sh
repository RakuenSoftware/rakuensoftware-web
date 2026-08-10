#!/usr/bin/env bash
#
# Publish articles automatically.
#
# Watches rakuen-blog main and rebuilds the site whenever it moves, so landing an
# article there is the whole publishing step. Runs from a systemd timer on the
# rakuen-web host; see rakuen-autopublish.service and .timer beside this file.
#
# It polls rather than receiving a webhook because the host takes no inbound
# traffic. A poll costs one ls-remote against a public repository.
#
# Articles only: it never moves the checkout, so a new article cannot drag
# along whatever code happens to be sitting on the site's main branch. Deploying
# code stays a deliberate run of deploy.sh.
#
# Install (as root on the host):
#   cp scripts/rakuen-autopublish.* /etc/systemd/system/
#   systemctl daemon-reload
#   systemctl enable --now rakuen-autopublish.timer
#
# Disable:
#   systemctl disable --now rakuen-autopublish.timer

set -euo pipefail

REPO=${REPO:-/opt/rakuen-web}
BLOG=${BLOG_REPO:-https://github.com/RakuenSoftware/rakuen-blog.git}
BLOG_BRANCH=${BLOG_BRANCH:-main}
STATE="$REPO/.last-blog-sha"

cd "$REPO"

remote=$(git ls-remote "$BLOG" "refs/heads/$BLOG_BRANCH" | cut -f1)
if [ -z "$remote" ]; then
  echo "autopublish: could not read $BLOG_BRANCH from $BLOG" >&2
  exit 1
fi

last=$(cat "$STATE" 2>/dev/null || echo none)

if [ "$remote" = "$last" ]; then
  exit 0
fi

echo "autopublish: articles moved ${last:0:8} -> ${remote:0:8}, rebuilding"

# The sync's own guards still apply: it refuses an empty blog, and refuses if a
# previously published article disappears. Either way this exits non-zero, the
# state file is not written, and the next tick tries again rather than the
# failure being swallowed.
ARTICLES_ONLY=1 "$REPO/scripts/deploy.sh"

echo "$remote" > "$STATE"
echo "autopublish: published ${remote:0:8}"
