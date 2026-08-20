#!/usr/bin/env bash
#
# Publish articles automatically.
#
# Watches rakuen-blog main and rebuilds the site whenever it moves, so landing a
# change there is the whole publishing step. Runs from a systemd timer on the
# rakuen-web host; see rakuen-autopublish.service and .timer beside this file.
#
# Both halves of publishing come through here, because both are commits to that
# branch. Editing a live article republishes it. Adding its slug to
# articles/PUBLISHED puts a new one on the site. Neither needs a commit to this
# repository and neither needs a deploy.
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

# The sync's own guards still apply. It refuses an empty blog, a manifest line
# that is not a slug, an article it cannot find, a previously published article
# that disappeared, and more than a handful going live at once. Any of those
# exits non-zero, the state file is not written, and the next tick tries again
# rather than the failure being swallowed.
#
# A refused sync writes nothing, so the retry sees the same state and refuses
# for the same reason. That is deliberate: it keeps failing every three minutes,
# visibly, until a person changes the manifest or re-runs with the override the
# error names. A guard that quietly passed on the second attempt would be no
# guard at all, and this loop is what would have made that happen.
ARTICLES_ONLY=1 "$REPO/scripts/deploy.sh"

echo "$remote" > "$STATE"
echo "autopublish: published ${remote:0:8}"
