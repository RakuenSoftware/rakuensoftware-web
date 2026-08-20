import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Publishing is a line in rakuen-blog's articles/PUBLISHED, and the site pulls
 * it on a three-minute timer with no human in the path. That removed the pull
 * request that used to be the last place a mistake could be caught, so what is
 * left is this script's guards, and they are worth holding still.
 *
 * The one they exist for: on 2026-08-12 eleven unpublished articles went live
 * at once and the build reported success. Two of these cases are that incident.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const script = resolve(root, 'scripts/sync-articles.mjs');

const ARTICLES = [
  'hello-rakuen-software',
  'one-call-one-turn',
  'synthesis-model-selection',
  'a-held-article',
  'another-held-article',
  'a-third-held-article',
  'a-fourth-held-article',
];

function blog(published) {
  const dir = mkdtempSync(join(tmpdir(), 'rakuen-blog-'));
  for (const slug of ARTICLES) {
    const articleDir = join(dir, 'articles', slug, 'article');
    mkdirSync(articleDir, { recursive: true });
    writeFileSync(
      join(articleDir, `${slug}.md`),
      `---\ntitle: "${slug}"\ndate: 2026-08-20\n---\n\nBody.\n`,
    );
  }
  if (published !== null) {
    writeFileSync(join(dir, 'articles', 'PUBLISHED'), `${published.join('\n')}\n`);
  }
  return dir;
}

function sync(blogDir, postsDir, env = {}) {
  return new Promise((done) => {
    execFile(
      process.execPath,
      [script],
      { env: { ...process.env, BLOG_LOCAL: blogDir, POSTS_DIR: postsDir, ...env } },
      (error, stdout, stderr) => done({ code: error?.code ?? 0, stdout, stderr }),
    );
  });
}

function slugs(postsDir) {
  try {
    return readdirSync(postsDir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort();
  } catch {
    return [];
  }
}

function scratch(t) {
  const dir = mkdtempSync(join(tmpdir(), 'rakuen-posts-'));
  const posts = join(dir, 'posts');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return posts;
}

const LIVE = ['hello-rakuen-software', 'one-call-one-turn', 'synthesis-model-selection'];

test('the manifest decides what ships, and only what it names', async (t) => {
  const posts = scratch(t);
  const result = await sync(blog(LIVE), posts);

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(slugs(posts), [...LIVE].sort());
});

test('comments and blank lines are not article names', async (t) => {
  const posts = scratch(t);
  const result = await sync(
    blog(['# the live blog', '', 'hello-rakuen-software', 'one-call-one-turn  # shipped']),
    posts,
  );

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(slugs(posts), ['hello-rakuen-software', 'one-call-one-turn']);
});

test('adding one line publishes one article, and the log names it', async (t) => {
  const posts = scratch(t);
  await sync(blog(LIVE), posts);
  const result = await sync(blog([...LIVE, 'a-held-article']), posts);

  assert.equal(result.code, 0, result.stderr);
  assert.ok(slugs(posts).includes('a-held-article'));
  assert.match(result.stdout, /new \+ a-held-article/);
});

test('a slug that is not a slug is refused rather than cleaned up', async (t) => {
  const posts = scratch(t);
  const result = await sync(blog(['hello-rakuen-software', '../../../etc/passwd']), posts);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /unusable line/);
  assert.deepEqual(slugs(posts), []);
});

test('a missing manifest does not mean an empty blog', async (t) => {
  const posts = scratch(t);
  const result = await sync(blog(null), posts);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /no articles\/PUBLISHED/);
});

test('an empty manifest does not mean an empty blog', async (t) => {
  const posts = scratch(t);
  const result = await sync(blog(['# everything is held']), posts);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /names no articles/);
});

test('a renamed article stops the build instead of retiring its URL', async (t) => {
  const posts = scratch(t);
  const result = await sync(blog([...LIVE, 'renamed-out-from-under-us']), posts);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /renamed-out-from-under-us/);
});

test('retiring a live URL needs ALLOW_UNPUBLISH', async (t) => {
  const posts = scratch(t);
  await sync(blog(LIVE), posts);

  const refused = await sync(blog(LIVE.slice(0, 2)), posts);
  assert.equal(refused.code, 1);
  assert.match(refused.stderr, /previously published/);
  assert.deepEqual(slugs(posts), [...LIVE].sort(), 'the live set must survive a refusal');

  const allowed = await sync(blog(LIVE.slice(0, 2)), posts, { ALLOW_UNPUBLISH: '1' });
  assert.equal(allowed.code, 0, allowed.stderr);
  assert.deepEqual(slugs(posts), [...LIVE.slice(0, 2)].sort());
});

test('publishing a pile at once needs ALLOW_BULK_PUBLISH', async (t) => {
  const posts = scratch(t);
  await sync(blog(LIVE), posts);

  const refused = await sync(blog(ARTICLES), posts);
  assert.equal(refused.code, 1);
  assert.match(refused.stderr, /would go live at once/);
  assert.deepEqual(slugs(posts), [...LIVE].sort());

  const allowed = await sync(blog(ARTICLES), posts, { ALLOW_BULK_PUBLISH: '1' });
  assert.equal(allowed.code, 0, allowed.stderr);
  assert.deepEqual(slugs(posts), [...ARTICLES].sort());
});

/* The guards used to be checked after the posts had already been written, so a
 * refused run left the rejected set on disk. That set became the next run's
 * idea of what was already published, the delta came out empty, and the same
 * guard passed. The autopublish timer retries every three minutes, so a refusal
 * would have approved itself on the following tick with nobody watching.
 */
test('a refusal does not approve itself on the retry', async (t) => {
  const posts = scratch(t);
  await sync(blog(LIVE), posts);

  const first = await sync(blog(ARTICLES), posts);
  const second = await sync(blog(ARTICLES), posts);

  assert.equal(first.code, 1);
  assert.equal(second.code, 1, 'the retry must refuse for the same reason');
  assert.match(second.stderr, /would go live at once/);
  assert.deepEqual(slugs(posts), [...LIVE].sort());
});
