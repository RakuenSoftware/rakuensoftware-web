#!/usr/bin/env bash
# Poll the website and blog main branches on the existing publishing timer.
# Code changes get a full deploy; blog-only changes rebuild the deployed code.
# deploy.sh serializes all builds, validates the candidate, and rolls back on
# failure. Success markers are never advanced by a refused or failed build.
set -euo pipefail

REPO=${REPO:-/opt/rakuen-web}
BLOG=${BLOG_REPO:-https://github.com/RakuenSoftware/rakuen-blog.git}
BLOG_BRANCH=${BLOG_BRANCH:-main}
cd "$REPO"

site=$(git ls-remote origin refs/heads/main | cut -f1)
blog=$(git ls-remote "$BLOG" "refs/heads/$BLOG_BRANCH" | cut -f1)
if [ -z "$site" ] || [ -z "$blog" ]; then
  echo 'autopublish: could not read the website or blog branch' >&2
  exit 1
fi
last_site=$(cat .last-site-sha 2>/dev/null || echo none)
last_blog=$(cat .last-blog-sha 2>/dev/null || echo none)

if [ "$site" != "$last_site" ]; then
  echo "autopublish: website main moved ${last_site:0:8} -> ${site:0:8}, deploying"
  ARTICLES_ONLY=0 "$REPO/scripts/deploy.sh"
elif [ "$blog" != "$last_blog" ]; then
  echo "autopublish: articles moved ${last_blog:0:8} -> ${blog:0:8}, rebuilding"
  ARTICLES_ONLY=1 "$REPO/scripts/deploy.sh"
else
  exit 0
fi

# A full deploy also syncs articles. If the blog moves during a build, a stale
# marker merely causes another build on the next tick rather than skipping it.
printf '%s\n' "$blog" > .last-blog-sha.tmp
mv .last-blog-sha.tmp .last-blog-sha
echo 'autopublish: publication verified'
