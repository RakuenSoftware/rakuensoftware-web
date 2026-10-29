#!/usr/bin/env bash
# The release gate: sync articles, type-check, build a candidate bundle into
# dist.new and run the tests against it. deploy.sh runs this before it swaps the
# live bundle, and CI runs it on every pull request, so a change that production
# would roll back fails its pull request first. Run from the repository root
# with dependencies installed.
set -euo pipefail

echo '==> Pulling articles'
node scripts/sync-articles.mjs

echo '==> Type checking and building'
# Do not rewrite the tracked tsconfig.tsbuildinfo.
npx tsc --noEmit --incremental false
rm -rf dist.new
npx vite build --outDir dist.new --emptyOutDir

echo '==> Testing the candidate bundle'
SITE_DIST_DIR="$PWD/dist.new" npm test
