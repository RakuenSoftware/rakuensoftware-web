import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, ResolvedConfig } from 'vite';
import { excerptFrom, parseFrontmatter, str, validatePost } from './src/lib/frontmatter';
import { PRODUCTS } from './src/content/products';
import {
  STATIC_PAGES,
  headTags,
  injectHead,
  pageTitle,
  postMeta,
  productMeta,
  robotsTxt,
  siteOrigin,
  sitemapXml,
} from './lib/site-meta.mjs';

/* The generated article directory. sync-articles.mjs writes exactly the
 * published set here before every build, so it is both what the site renders
 * and what the sitemap should advertise. */
const POSTS_DIR = 'src/content/posts';

/**
 * Fails the build when a blog post has unusable frontmatter. Without this the
 * posts module would only discover the problem in the browser, where the reader
 * gets a missing post instead of the author getting an error.
 *
 * This used to read src/content/blog, which is a stale copy that nothing
 * renders: the live articles have been in src/content/posts since the move to
 * rakuen-blog. It was therefore validating eight files the site never serves
 * and none of the twelve it does. The prerendering below depends on every post
 * having a title and a date, so the checker now points at the same directory
 * the rest of the build reads.
 */
function checkPosts(): Plugin {
  return {
    name: 'check-posts',
    buildStart() {
      if (!existsSync(POSTS_DIR)) {
        this.error(`${POSTS_DIR} does not exist — run \`npm run sync\` before building.`);
      }
      const problems: string[] = [];
      for (const file of readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))) {
        const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
        for (const problem of validatePost(raw)) {
          problems.push(`  ${file}: ${problem}`);
        }
      }
      if (problems.length > 0) {
        this.error(`Invalid blog frontmatter:\n${problems.join('\n')}`);
      }
    },
  };
}

interface Route {
  path: string;
  title: string;
  description: string;
  type?: string;
  published?: string;
  noindex?: boolean;
}

function readPosts(): { slug: string; title: string; excerpt: string; date: string; review: boolean }[] {
  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const { data, body } = parseFrontmatter(readFileSync(join(POSTS_DIR, file), 'utf8'));
      return {
        slug: str(data.slug) ?? file.slice(0, -3),
        title: str(data.title)!,
        date: str(data.date)!,
        excerpt: excerptFrom(data, body),
        review: str(data.site_status) === 'right-of-reply-review',
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function routes(): Route[] {
  const list: Route[] = Object.entries(STATIC_PAGES).map(([path, meta]) => ({ path, ...meta }));
  for (const product of PRODUCTS) {
    list.push({ path: `/products/${product.slug}`, ...productMeta(product) });
  }
  for (const post of readPosts()) {
    list.push({
      path: `/blog/${post.slug}`,
      ...postMeta(post),
      type: 'article',
      published: post.review ? undefined : post.date,
      noindex: post.review,
    });
  }
  return list;
}

/**
 * Writes one prerendered document per route, plus robots.txt and sitemap.xml.
 *
 * The site is a client-rendered SPA, so before this every URL served the same
 * shell: one title ("Rakuen Software"), one description, no canonical and no
 * Open Graph tags at all. Googlebot renders JavaScript and could eventually see
 * the real titles on a second pass, but the link crawlers behind Reddit,
 * LinkedIn, Slack and Discord do not run scripts at all — they read the served
 * HTML once. Reddit is where most of this site's readers come from, so every
 * article shared there previewed as the same generic card.
 *
 * These files only replace the <head>. The body is still the empty root div and
 * React still renders everything, so there is no second rendering path to keep
 * in step with the app — which is the part of prerendering that usually rots.
 */
function emitSeo(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'emit-seo',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle() {
      /* deploy.sh builds into a scratch directory and swaps it in, so this must
       * follow the resolved outDir rather than assuming "dist". */
      const outDir = resolve(config.root, config.build.outDir);
      const indexPath = join(outDir, 'index.html');
      if (!existsSync(indexPath)) {
        this.error(`emit-seo: ${indexPath} was not produced by the build`);
      }
      const template = readFileSync(indexPath, 'utf8');
      const origin = siteOrigin(process.env.SITE_HOST ?? 'rakuensoftware.com');
      const all = routes();

      for (const route of all) {
        const html = injectHead(
          template,
          headTags({
            origin,
            path: route.path,
            title: route.title,
            description: route.description,
            type: route.type,
            published: route.published,
            noindex: route.noindex,
          }),
        );
        const file =
          route.path === '/' ? indexPath : join(outDir, route.path.slice(1), 'index.html');
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, html);
      }

      /* The shell served for any path with no page behind it.
       *
       * The SPA fallback used to send index.html, which now carries the home
       * page's title and — the part that matters — its canonical. A mistyped or
       * retired URL answering with rel=canonical pointing at the home page
       * invites a search engine to fold it in as another copy of the home page.
       * This shell claims nothing and asks not to be indexed; React still
       * renders NotFound into it. */
      writeFileSync(
        join(outDir, '404.html'),
        injectHead(
          template,
          headTags({
            origin,
            path: '/404',
            title: pageTitle('Page not found'),
            noindex: true,
          }),
        ),
      );

      writeFileSync(join(outDir, 'robots.txt'), robotsTxt(origin));
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        sitemapXml(
          origin,
          all.filter((r) => !r.noindex).map((r) => ({ path: r.path, lastmod: r.published })),
        ),
      );

      config.logger.info(
        `emit-seo: ${all.length} prerendered pages, robots.txt and sitemap.xml -> ${config.build.outDir}`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), checkPosts(), emitSeo()],
});
