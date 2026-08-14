#!/usr/bin/env node
/**
 * Pull published articles from the blog repository into src/content/posts.
 *
 * Publishing used to mean merging the same article to two repositories: the
 * evidence repo, which owns the article and its provenance, and this one, which
 * owned a copy with frontmatter bolted on. The copies drifted, and every fix had
 * to be made twice.
 *
 * Now rakuen-blog is the only source, and PUBLISHED below names what ships.
 *
 * That list used to be a frontmatter test: an article was published if its
 * markdown carried any. It never worked. Every article in rakuen-blog carries
 * frontmatter, including the ready-but-unpublished ones and the drafts whose own
 * provenance maps say their figures do not reproduce, so on 2026-08-12 a deploy
 * put eleven of them on the live site at once. The rule was silent about it: the
 * build succeeded, the count went up, and nothing named what was new.
 *
 * A file property cannot carry that decision, because the property is a side
 * effect of how articles are written and the decision belongs to a person.
 * Adding a line to PUBLISHED is what publishing is, and merging that one-line
 * diff is the gate.
 *
 * The output directory is generated and gitignored. Do not edit it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.blog-cache');
const OUT = join(ROOT, 'src', 'content', 'posts');
const REPO = process.env.BLOG_REPO ?? 'https://github.com/RakuenSoftware/rakuen-blog.git';
const BRANCH = process.env.BLOG_BRANCH ?? 'main';

// A local checkout wins when given, so the site can be built against an
// unmerged branch without pushing first.
const LOCAL = process.env.BLOG_LOCAL;

// The live blog, oldest first. A slug here is a rakuen-blog articles/<slug>
// directory, and it is also the URL: /blog/<slug>. Removing a line unpublishes,
// which needs ALLOW_UNPUBLISH=1 on the next build so it cannot happen by
// accident. Renaming one changes a live URL and breaks every inbound link.
const PUBLISHED = [
  'hello-rakuen-software',
  'smoothgui-0-9-site-primitives',
  'token-compression-tools-cost-more-than-they-save',
  'stacking-isnt-composing',
  'we-measured-our-reranker-and-deleted-it',
  'local-llm-fact-extraction-head-to-head',
  'speculative-decoding-was-free',
  'one-call-one-turn',
];

function git(args, cwd) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
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

const root = source();
const articlesDir = join(root, 'articles');

// What the last build published. An article that disappears from this list has
// either been unpublished on purpose or lost its frontmatter by accident, and
// the second case is invisible: the build succeeds and the post is simply gone.
const before = existsSync(OUT)
  ? readdirSync(OUT).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3))
  : [];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const published = [];
const missing = [];

for (const slug of PUBLISHED) {
  const md = join(articlesDir, slug, 'article', `${slug}.md`);
  if (!existsSync(md) || !hasFrontmatter(readFileSync(md, 'utf8'))) {
    missing.push(slug);
    continue;
  }
  writeFileSync(join(OUT, `${slug}.md`), readFileSync(md, 'utf8'));
  published.push(slug);
}

// A named article that cannot be found is a live post about to vanish, usually
// because a slug was renamed in rakuen-blog. Stop rather than serve a 404 where
// a published URL used to be.
if (missing.length > 0) {
  console.error(
    `articles: ${missing.length} published article(s) not found in rakuen-blog: ${missing.join(', ')}\n` +
      '  Each is named in PUBLISHED but has no articles/<slug>/article/<slug>.md with\n' +
      '  frontmatter. If a slug was renamed, changing it here changes a live URL.',
  );
  process.exit(1);
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
  console.error('articles: nothing published, refusing to build an empty blog');
  process.exit(1);
}

const vanished = before.filter((slug) => !published.includes(slug));
if (vanished.length > 0 && process.env.ALLOW_UNPUBLISH !== '1') {
  console.error(
    `articles: ${vanished.length} previously published article(s) are gone: ` +
      `${vanished.join(', ')}\n` +
      '  Each was dropped from PUBLISHED, which retires a live URL. If that is\n' +
      '  deliberate, re-run with ALLOW_UNPUBLISH=1.',
  );
  process.exit(1);
}

console.log(`articles: ${published.length} published, ${held.length} held`);
for (const s of published) console.log(`  + ${s}`);
for (const s of held) console.log(`  - ${s}`);
