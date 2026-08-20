#!/usr/bin/env node
/**
 * Pull published articles from the blog repository into src/content/posts.
 *
 * Publishing used to mean merging the same article to two repositories: the
 * evidence repo, which owns the article and its provenance, and this one, which
 * owned a copy with frontmatter bolted on. The copies drifted, and every fix had
 * to be made twice.
 *
 * Now rakuen-blog is the only source, and articles/PUBLISHED in that repository
 * names what ships. Adding a line to it and merging is what publishing is. The
 * autopublish timer notices the branch move and runs this, so a new article and
 * an edit to a live one reach the site by the same path, with no commit here and
 * no deploy.
 *
 * That list lived in this file until 2026-08-20. Splitting the decision from the
 * article meant two commits to publish one piece, and the two drifted.
 *
 * Before that it was not a list at all but a frontmatter test: an article was
 * published if its markdown carried any. It never worked. Every article in
 * rakuen-blog carries frontmatter, including the ready-but-unpublished ones and
 * the drafts whose own provenance maps say their figures do not reproduce, so on
 * 2026-08-12 a deploy put eleven of them on the live site at once. The rule was
 * silent about it: the build succeeded, the count went up, and nothing named
 * what was new.
 *
 * A file property cannot carry that decision, because the property is a side
 * effect of how articles are written and the decision belongs to a person.
 * Moving the list did not weaken that: the line is still written by hand, and
 * the guards below still refuse to publish or retire in bulk unless told to.
 *
 * The output directory is generated and gitignored. Do not edit it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.blog-cache');
// POSTS_DIR exists so the tests can exercise the guards against a scratch
// directory. The guards compare against what the last build left on disk, and
// pointing them at the real one would make running the tests change what the
// next build considers already published.
const OUT = process.env.POSTS_DIR
  ? resolve(process.env.POSTS_DIR)
  : join(ROOT, 'src', 'content', 'posts');
const REPO = process.env.BLOG_REPO ?? 'https://github.com/RakuenSoftware/rakuen-blog.git';
const BRANCH = process.env.BLOG_BRANCH ?? 'main';

// A local checkout wins when given, so the site can be built against an
// unmerged branch without pushing first.
const LOCAL = process.env.BLOG_LOCAL;

// The manifest is the publishing decision, so it lives with the articles.
const MANIFEST = 'articles/PUBLISHED';

// Publishing more than a couple of articles in one tick is not how anyone
// writes. It is how a bad merge, a reverted revert or a resurrected branch
// looks, which is what put eleven articles live on 2026-08-12. The list now
// arrives from another repository and lands without a pull request against this
// one, so the size of a jump is worth a deliberate confirmation.
const BULK = 3;

function git(args, cwd) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

function fail(message) {
  console.error(`articles: ${message}`);
  process.exit(1);
}

function source() {
  if (LOCAL) {
    if (!existsSync(join(LOCAL, 'articles'))) {
      throw new Error(`BLOG_LOCAL=${LOCAL} has no articles/ directory`);
    }
    console.log(`articles: using local checkout ${LOCAL}`);
    return LOCAL;
  }
  if (existsSync(join(CACHE, '.git'))) {
    git(['fetch', '--quiet', '--depth', '1', 'origin', BRANCH], CACHE);
    git(['reset', '--hard', '--quiet', `origin/${BRANCH}`], CACHE);
  } else {
    rmSync(CACHE, { recursive: true, force: true });
    git(['clone', '--quiet', '--depth', '1', '--branch', BRANCH, REPO, CACHE]);
  }
  console.log(`articles: ${REPO}@${BRANCH} ${git(['rev-parse', '--short', 'HEAD'], CACHE)}`);
  return CACHE;
}

function hasFrontmatter(text) {
  return /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(text);
}

// A slug becomes a path segment and a filename here, and it now arrives from
// another repository rather than from this file, so it is input. Anything but a
// plain lowercase slug is refused rather than cleaned up: a line that needs
// cleaning up is a line nobody meant to write.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readManifest(root) {
  const path = join(root, MANIFEST);
  if (!existsSync(path)) {
    fail(
      `no ${MANIFEST} in the blog checkout at ${root}\n` +
        '  That file is the list of live articles. Without it there is nothing to\n' +
        '  publish, and building an empty blog would quietly retire every URL.',
    );
  }

  const slugs = [];
  const seen = new Set();
  const bad = [];

  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const slug = line.replace(/#.*$/, '').trim();
      if (slug === '') return;
      if (!SLUG.test(slug)) {
        bad.push(`${MANIFEST}:${i + 1}: ${JSON.stringify(slug)}`);
        return;
      }
      if (seen.has(slug)) return;
      seen.add(slug);
      slugs.push(slug);
    });

  if (bad.length > 0) {
    fail(
      `${bad.length} unusable line(s) in ${MANIFEST}:\n` +
        bad.map((b) => `    ${b}`).join('\n') +
        '\n  A line is one article directory name: lowercase letters, digits and\n' +
        '  hyphens, nothing else. Comments start with #.',
    );
  }

  if (slugs.length === 0) {
    fail(`${MANIFEST} names no articles, refusing to build an empty blog`);
  }

  return slugs;
}

const root = source();
const articlesDir = join(root, 'articles');
const PUBLISHED = readManifest(root);

// What the last build published. An article that disappears from this list has
// either been unpublished on purpose or lost its frontmatter by accident, and
// the second case is invisible: the build succeeds and the post is simply gone.
//
// No output directory is a first build, not a deletion of everything, so the
// deltas below are only judged when there is a previous state to compare with.
const first = !existsSync(OUT);
const before = first
  ? []
  : readdirSync(OUT).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));

// Everything is resolved in memory and every guard runs before a single file is
// written, so a refused sync leaves the previous posts exactly where they were.
//
// Writing first and checking afterwards looks equivalent and is not: it leaves
// the rejected set on disk, which is what the next run reads as `before`. The
// delta is then empty and the same guard passes. With the autopublish timer
// retrying every three minutes, a refusal would wave itself through on the next
// tick without anyone seeing it.
const articles = new Map();
const missing = [];

for (const slug of PUBLISHED) {
  const md = join(articlesDir, slug, 'article', `${slug}.md`);
  if (!existsSync(md)) {
    missing.push(slug);
    continue;
  }
  const text = readFileSync(md, 'utf8');
  if (!hasFrontmatter(text)) {
    missing.push(slug);
    continue;
  }
  articles.set(slug, text);
}

const published = [...articles.keys()];

// A named article that cannot be found is a live post about to vanish, usually
// because a slug was renamed in rakuen-blog. Stop rather than serve a 404 where
// a published URL used to be.
if (missing.length > 0) {
  fail(
    `${missing.length} published article(s) not found in rakuen-blog: ${missing.join(', ')}\n` +
      `  Each is named in ${MANIFEST} but has no articles/<slug>/article/<slug>.md\n` +
      '  with frontmatter. If a slug was renamed, changing it there changes a live URL.',
  );
}

// Everything else is held on purpose. Naming it keeps the ready pile visible,
// so an article does not sit finished and unpublished because nobody noticed.
const held = readdirSync(articlesDir)
  .sort()
  .filter((slug) => !PUBLISHED.includes(slug))
  .filter((slug) => existsSync(join(articlesDir, slug, 'article', `${slug}.md`)));

// An empty blog is a silent failure that still builds and still serves, so it
// has to be loud here rather than discovered on the live site.
if (published.length === 0) {
  fail('nothing published, refusing to build an empty blog');
}

const vanished = before.filter((slug) => !published.includes(slug));
if (vanished.length > 0 && process.env.ALLOW_UNPUBLISH !== '1') {
  fail(
    `${vanished.length} previously published article(s) are gone: ${vanished.join(', ')}\n` +
      `  Each was dropped from ${MANIFEST}, which retires a live URL. If that is\n` +
      '  deliberate, re-run with ALLOW_UNPUBLISH=1.',
  );
}

const added = published.filter((slug) => !before.includes(slug));
if (!first && added.length > BULK && process.env.ALLOW_BULK_PUBLISH !== '1') {
  fail(
    `${added.length} article(s) would go live at once: ${added.join(', ')}\n` +
      `  More than ${BULK} in one run usually means ${MANIFEST} was restored from an\n` +
      '  older state rather than added to, and publishing eleven articles that way\n' +
      '  has actually happened. If it is deliberate, re-run with ALLOW_BULK_PUBLISH=1.',
  );
}

// Past every guard: replace the generated directory.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const [slug, text] of articles) writeFileSync(join(OUT, `${slug}.md`), text);

// Name what changed. The 2026-08-12 incident was not that the wrong articles
// shipped but that nothing said which ones had.
console.log(`articles: ${published.length} published, ${held.length} held`);
for (const s of published) console.log(`  ${!first && added.includes(s) ? 'new' : '   '} + ${s}`);
for (const s of held) console.log(`      - ${s}`);
