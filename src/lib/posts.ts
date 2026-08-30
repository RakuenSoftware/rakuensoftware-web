import { marked } from 'marked';
import { excerptFrom, parseFrontmatter, str, validatePost } from './frontmatter';

export interface Post {
  slug: string;
  title: string;
  /** ISO date, e.g. "2026-07-22". Used for sorting and <time datetime>. */
  date: string;
  author?: string;
  tags: string[];
  excerpt: string;
  /** Reachable for right of reply, but not an official publication. */
  review: boolean;
  /** Markdown body rendered to HTML. */
  html: string;
}

/**
 * Blog posts are pulled from the rakuen-blog repository by
 * scripts/sync-articles.mjs, which runs before every build, and written into
 * src/content/posts. That directory is generated: to change an article, change
 * it in rakuen-blog. Vite inlines the markdown into the bundle at build time,
 * so there is no runtime fetch and no CMS to operate.
 *
 * Frontmatter is validated during the build by the checkPosts plugin in
 * vite.config.ts, so a malformed post fails `npm run build` rather than
 * reaching a browser.
 */
const files = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

function buildPost(path: string, raw: string): Post | null {
  // Belt and braces: the build already rejects these, so anything caught here
  // means the checker was bypassed. Skip it rather than blanking the page.
  if (validatePost(raw).length > 0) {
    console.error(`Skipping malformed blog post: ${path}`);
    return null;
  }

  const { data, body } = parseFrontmatter(raw);
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const excerpt = excerptFrom(data, body);

  return {
    slug: str(data.slug) ?? slugFromPath(path),
    title: str(data.title)!,
    date: str(data.date)!,
    author: str(data.author),
    tags,
    excerpt,
    review: str(data.site_status) === 'right-of-reply-review',
    html: marked.parse(body, { async: false }),
  };
}

/** All posts, newest first. */
export const POSTS: Post[] = Object.entries(files)
  .map(([path, raw]) => buildPost(path, raw))
  .filter((p): p is Post => p !== null)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/** Officially published posts. Review copies are deliberately undiscoverable. */
export const PUBLISHED_POSTS = POSTS.filter((post) => !post.review);

export function postBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Renders an ISO date as e.g. "22 July 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
