import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(path, 'utf8').trim();
function put(path, text, executable = false) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  if (executable) chmodSync(path, 0o755);
}
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// Real local remotes and checkouts exercise branch detection and rollback.
// Package tools, systemd and HTTP probes are confined to boundary doubles.
function fixture(t) {
  const scratch = mkdtempSync(join(tmpdir(), 'rakuen-deploy-'));
  t.after(() => rmSync(scratch, { recursive: true, force: true }));
  const source = join(scratch, 'source');
  const repo = join(scratch, 'deployment');
  const bin = join(scratch, 'bin');
  const trace = join(scratch, 'trace');
  put(trace, '');
  const units = join(scratch, 'units');
  const control = join(scratch, 'control');
  mkdirSync(source);
  mkdirSync(control);
  git(source, 'init', '-q', '-b', 'main');
  git(source, 'config', 'user.email', 'fixture@example.invalid');
  git(source, 'config', 'user.name', 'Deployment fixture');
  for (const name of ['deploy.sh', 'verify.sh', 'autopublish.sh', 'rakuen-web.service']) {
    put(join(source, 'scripts', name), readFileSync(join(root, 'scripts', name)), true);
  }
  put(join(source, '.gitignore'), 'dist/\ndist.new/\ndist.prev/\nnode_modules/\n.last-*\n.publish.lock\n');
  put(join(source, 'scripts/sync-articles.mjs'), "if (process.env.FAIL_STAGE === 'sync') process.exit(1);\n");
  put(join(source, 'package-lock.json'), '{"revision":"old"}\n');
  put(join(source, 'app.txt'), 'old code\n');
  git(source, 'add', '.');
  git(source, 'commit', '-qm', 'Initial deployment');
  const old = git(source, 'rev-parse', 'HEAD');
  const remote = join(scratch, 'website.git');
  git(source, 'clone', '--bare', '-q', source, remote);
  git(source, 'clone', '-q', remote, repo);
  put(join(source, 'package-lock.json'), '{"revision":"new"}\n');
  put(join(source, 'app.txt'), 'new code\n');
  git(source, 'add', '.');
  git(source, 'commit', '-qm', 'Merged website change');
  git(source, 'push', '-q', remote, 'main');
  const latest = git(source, 'rev-parse', 'HEAD');
  put(join(repo, 'dist/index.html'), '<script src="/assets/index-old.js"></script>\n');
  put(join(repo, 'dist/assets/index-old.js'), 'old bundle');
  put(join(repo, 'node_modules/revision'), 'old');
  put(join(repo, '.last-site-sha'), old);
  put(join(units, 'rakuen-web.service'), readFileSync(join(root, 'scripts/rakuen-web.service')));

  put(join(bin, 'npm'), `#!/bin/bash
set -eu
echo "npm $*" >> "$TRACE"
if [ "$1" = ci ]; then
  if [ "\${FAIL_STAGE:-}" = install ] && grep -q new package-lock.json; then exit 1; fi
  mkdir -p node_modules
  cp package-lock.json node_modules/revision
elif [ "$1" = test ]; then
  test "$SITE_DIST_DIR" = "$REPO/dist.new"
  test -f "$SITE_DIST_DIR/assets/index-new.js"
  if [ "\${FAIL_STAGE:-}" = test ]; then exit 1; fi
fi
`, true);
  put(join(bin, 'npx'), `#!/bin/bash
set -eu
echo "npx $*" >> "$TRACE"
if [ "$1" = tsc ]; then
  if [ "\${FAIL_STAGE:-}" = check ]; then exit 1; fi
elif [ "$1" = vite ]; then
  if [ "\${FAIL_STAGE:-}" = build ]; then exit 1; fi
  mkdir -p dist.new/assets
  echo '<script src="/assets/index-new.js"></script>' > dist.new/index.html
  echo 'new bundle' > dist.new/assets/index-new.js
fi
`, true);
  put(join(bin, 'systemctl'), `#!/bin/bash
set -eu
echo "systemctl $*" >> "$TRACE"
if [ "\${FAIL_STAGE:-}" = restart ] && [ "$1" = restart ] && [ ! -e "$CONTROL/restart-failed" ]; then
  touch "$CONTROL/restart-failed"
  exit 1
fi
`, true);
  put(join(bin, 'curl'), '#!/bin/bash\n[ "${FAIL_STAGE:-}" != verify ]\n', true);
  put(join(bin, 'sleep'), '#!/bin/bash\nexit 0\n', true);

  const blogSource = join(scratch, 'blog');
  mkdirSync(blogSource);
  git(blogSource, 'init', '-q', '-b', 'main');
  git(blogSource, 'config', 'user.email', 'fixture@example.invalid');
  git(blogSource, 'config', 'user.name', 'Blog fixture');
  put(join(blogSource, 'article.txt'), 'article one');
  git(blogSource, 'add', '.');
  git(blogSource, 'commit', '-qm', 'Published article');
  const blog = join(scratch, 'blog.git');
  git(blogSource, 'clone', '--bare', '-q', blogSource, blog);
  const env = { ...process.env, REPO: repo, BLOG_REPO: blog, BLOG_BRANCH: 'main',
    SYSTEMD_DIR: units, SERVICE: 'rakuen-web.service', TRACE: trace, CONTROL: control,
    ARTICLES_ONLY: '0', PATH: `${bin}:${process.env.PATH}` };
  return { repo, old, latest, source, remote, blog, blogSource, trace, units, env };
}
async function run(f, script = 'deploy.sh', extra = {}) {
  try {
    const result = await exec('bash', [join(f.repo, 'scripts', script)], { env: { ...f.env, ...extra } });
    return { code: 0, ...result };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

// Production and pull requests must run one gate. If either stops calling
// verify.sh, a change can again pass review and then be rolled back on deploy.
test('the deploy and the pull request check run the same release gate', () => {
  const deploy = readFileSync(join(root, 'scripts/deploy.sh'), 'utf8');
  const workflow = readFileSync(join(root, '.github/workflows/verify.yml'), 'utf8');
  const gate = readFileSync(join(root, 'scripts/verify.sh'), 'utf8');
  assert.match(deploy, /^scripts\/verify\.sh$/m);
  assert.match(workflow, /^\s*pull_request:/m);
  assert.match(workflow, /- run: scripts\/verify\.sh$/m);
  for (const step of ['scripts/sync-articles.mjs', 'npx tsc --noEmit', 'npx vite build --outDir dist.new', 'npm test']) {
    assert.ok(gate.includes(step), step);
  }
});

test('a main update validates the candidate, deploys it and records the full live revision', async (t) => {
  const f = fixture(t);
  const result = await run(f);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.latest);
  assert.equal(read(join(f.repo, '.last-site-sha')), f.latest);
  assert.equal(read(join(f.repo, 'dist/assets/index-new.js')), 'new bundle');
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
  const trace = read(f.trace);
  assert.ok(trace.indexOf('npm test') < trace.indexOf('systemctl restart'), trace);
  assert.equal(existsSync(join(f.repo, 'dist.prev')), false);
});

for (const stage of ['install', 'sync', 'check', 'build', 'test', 'restart', 'verify']) {
  test(`${stage} failure preserves the previous deployment and retries the same main revision`, async (t) => {
    const f = fixture(t);
    const failed = await run(f, 'deploy.sh', { FAIL_STAGE: stage });
    assert.notEqual(failed.code, 0);
    assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.old);
    assert.equal(read(join(f.repo, '.last-site-sha')), f.old);
    assert.equal(read(join(f.repo, 'dist/assets/index-old.js')), 'old bundle');
    assert.equal(existsSync(join(f.repo, 'dist.new')), false);
    assert.equal(read(join(f.repo, 'node_modules/revision')), '{"revision":"old"}');
    assert.equal(git(f.repo, 'status', '--porcelain'), '');
    const retry = await run(f);
    assert.equal(retry.code, 0, retry.stderr);
    assert.equal(read(join(f.repo, '.last-site-sha')), f.latest);
  });
}

test('a dirty checkout is refused without resetting operator edits', async (t) => {
  const f = fixture(t);
  put(join(f.repo, 'app.txt'), 'operator edit');
  const result = await run(f);
  assert.notEqual(result.code, 0);
  assert.equal(read(join(f.repo, 'app.txt')), 'operator edit');
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.old);
  assert.equal(read(join(f.repo, '.last-site-sha')), f.old);
});

test('the timer deploys main once, skips unchanged branches and rebuilds blog-only changes without moving code', async (t) => {
  const f = fixture(t);
  const first = await run(f, 'autopublish.sh');
  assert.equal(first.code, 0, first.stderr);
  assert.match(first.stdout, /website main moved/);
  assert.equal(read(join(f.repo, '.last-site-sha')), f.latest);
  assert.equal(read(join(f.repo, '.last-blog-sha')), git(f.blogSource, 'rev-parse', 'HEAD'));
  const trace = read(f.trace);
  assert.equal((trace.match(/npx vite/g) ?? []).length, 1);
  const unchanged = await run(f, 'autopublish.sh');
  assert.equal(unchanged.code, 0, unchanged.stderr);
  assert.equal(read(f.trace), trace);
  put(join(f.blogSource, 'article.txt'), 'article two');
  git(f.blogSource, 'add', '.');
  git(f.blogSource, 'commit', '-qm', 'Article update');
  git(f.blogSource, 'push', '-q', f.blog, 'main');
  const article = await run(f, 'autopublish.sh');
  assert.equal(article.code, 0, article.stderr);
  assert.match(article.stdout, /Articles only/);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.latest);
  assert.equal(read(join(f.repo, '.last-blog-sha')), git(f.blogSource, 'rev-parse', 'HEAD'));
});

test('the timer leaves both success markers unchanged after a failed deploy', async (t) => {
  const f = fixture(t);
  put(join(f.repo, '.last-blog-sha'), 'previous-blog');
  const failed = await run(f, 'autopublish.sh', { FAIL_STAGE: 'test' });
  assert.notEqual(failed.code, 0);
  assert.equal(read(join(f.repo, '.last-site-sha')), f.old);
  assert.equal(read(join(f.repo, '.last-blog-sha')), 'previous-blog');
  const retry = await run(f, 'autopublish.sh');
  assert.equal(retry.code, 0, retry.stderr);
  assert.equal(read(join(f.repo, '.last-site-sha')), f.latest);
});


test('a failed restart restores an existing service definition as well as code and bundle', async (t) => {
  const f = fixture(t);
  put(join(f.units, 'rakuen-web.service'), 'previous unit definition');
  const result = await run(f, 'deploy.sh', { FAIL_STAGE: 'restart' });
  assert.notEqual(result.code, 0);
  assert.equal(read(join(f.units, 'rakuen-web.service')), 'previous unit definition');
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.old);
  assert.equal(read(join(f.repo, 'dist/assets/index-old.js')), 'old bundle');
});

test('a missing deployment marker causes a verified deploy even when HEAD already equals main', async (t) => {
  const f = fixture(t);
  git(f.repo, 'fetch', '-q', 'origin', 'main');
  git(f.repo, 'reset', '--hard', f.latest);
  rmSync(join(f.repo, '.last-site-sha'));
  const result = await run(f, 'autopublish.sh');
  assert.equal(result.code, 0, result.stderr);
  assert.equal(read(join(f.repo, '.last-site-sha')), f.latest);
  assert.equal(read(join(f.repo, 'dist/assets/index-new.js')), 'new bundle');
});


test('the deployment lock keeps manual and timer builds from overlapping', async (t) => {
  const f = fixture(t);
  const ready = join(dirname(f.repo), 'lock-ready');
  const release = join(dirname(f.repo), 'lock-release');
  const holder = spawn('flock', ['--no-fork', join(f.repo, '.publish.lock'), process.execPath, '-e', `
    const fs = require('node:fs');
    fs.writeFileSync(process.argv[1], 'ready');
    setInterval(() => { if (fs.existsSync(process.argv[2])) process.exit(0); }, 10);
    setTimeout(() => process.exit(2), 5000);
  `, ready, release]);
  t.after(() => holder.kill());
  const stopped = once(holder, 'exit');
  for (let i = 0; !existsSync(ready) && i < 200; i++) await delay(10);
  assert.ok(existsSync(ready), 'lock holder did not start');
  const pending = run(f);
  await delay(60);
  assert.equal(read(f.trace), '', 'deployment began while another publisher held the lock');
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.old);
  put(release, 'release');
  assert.equal((await stopped)[0], 0);
  const result = await pending;
  assert.equal(result.code, 0, result.stderr);
  assert.equal(read(join(f.repo, '.last-site-sha')), f.latest);
});

test('a failed remote lookup does not deploy or advance publication markers', async (t) => {
  const f = fixture(t);
  put(join(f.repo, '.last-blog-sha'), 'previous-blog');
  const result = await run(f, 'autopublish.sh', { BLOG_REPO: join(dirname(f.repo), 'missing.git') });
  assert.notEqual(result.code, 0);
  assert.equal(read(f.trace), '');
  assert.equal(read(join(f.repo, '.last-site-sha')), f.old);
  assert.equal(read(join(f.repo, '.last-blog-sha')), 'previous-blog');
});


test('a feature branch push does not trigger a deployment', async (t) => {
  const f = fixture(t);
  const deployed = await run(f, 'autopublish.sh');
  assert.equal(deployed.code, 0, deployed.stderr);
  const before = read(f.trace);
  git(f.source, 'switch', '-qc', 'feature');
  put(join(f.source, 'app.txt'), 'unmerged change');
  git(f.source, 'add', '.');
  git(f.source, 'commit', '-qm', 'Unmerged change');
  git(f.source, 'push', '-q', f.remote, 'feature');
  const result = await run(f, 'autopublish.sh');
  assert.equal(result.code, 0, result.stderr);
  assert.equal(read(f.trace), before);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.latest);
});


test('article-only publishing refuses local code edits', async (t) => {
  const f = fixture(t);
  put(join(f.repo, 'app.txt'), 'unapproved local code');
  const result = await run(f, 'deploy.sh', { ARTICLES_ONLY: '1' });
  assert.notEqual(result.code, 0);
  assert.equal(read(join(f.repo, 'app.txt')), 'unapproved local code');
  assert.equal(read(f.trace), '');
  assert.equal(read(join(f.repo, '.last-site-sha')), f.old);
});

test('article-only publishing refuses a checkout that was never verified as deployed', async (t) => {
  const f = fixture(t);
  git(f.repo, 'fetch', '-q', 'origin', 'main');
  git(f.repo, 'reset', '--hard', f.latest);
  const result = await run(f, 'deploy.sh', { ARTICLES_ONLY: '1' });
  assert.notEqual(result.code, 0);
  assert.equal(read(f.trace), '');
  assert.equal(read(join(f.repo, '.last-site-sha')), f.old);
  assert.equal(read(join(f.repo, 'dist/assets/index-old.js')), 'old bundle');
});
