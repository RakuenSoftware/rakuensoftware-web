#!/usr/bin/env node
/**
 * Pull published articles from the blog repository into src/content/posts.
 *
 * Publishing used to mean merging the same article to two repositories: the
 * evidence repo, which owns the article and its provenance, and this one, which
 * owned a copy with frontmatter bolted on. The copies drifted, and every fix had
 * to be made twice.
 *
 * Now rakuen-blog is the only source. An article is published when its markdown
 * carries frontmatter; drafts have none and are skipped. This runs before every
 * build, so a merge to rakuen-blog plus a deploy is the whole publishing step.
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
const drafts = [];

for (const slug of readdirSync(articlesDir).sort()) {
  const md = join(articlesDir, slug, 'article', `${slug}.md`);
  if (!existsSync(md)) continue;
  const text = readFileSync(md, 'utf8');
  if (!hasFrontmatter(text)) {
    drafts.push(slug);
    continue;
  }
  writeFileSync(join(OUT, `${slug}.md`), text);
  published.push(slug);
}

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
      '  Most likely the frontmatter was dropped in rakuen-blog. If the removal\n' +
      '  is deliberate, re-run with ALLOW_UNPUBLISH=1.',
  );
  process.exit(1);
}

console.log(`articles: ${published.length} published, ${drafts.length} drafts skipped`);
for (const s of published) console.log(`  + ${s}`);
if (drafts.length) console.log(`  (drafts: ${drafts.join(', ')})`);
