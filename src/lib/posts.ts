import { marked } from 'marked';
import { parseFrontmatter, str, validatePost } from './frontmatter';

export interface Post {
  slug: string;
  title: string;
  /** ISO date, e.g. "2026-07-22". Used for sorting and <time datetime>. */
  date: string;
  author?: string;
  tags: string[];
  excerpt: string;
  /** Markdown body rendered to HTML. */
  html: string;
}

/**
 * Blog posts are markdown files committed alongside the site. Vite inlines their
 * source into the bundle at build time, so there is no runtime fetch and no CMS
 * to operate. The markdown-to-HTML transform runs once at module init.
 *
 * Frontmatter is validated during the build by the checkPosts plugin in
 * vite.config.ts, so a malformed post fails `npm run build` rather than
 * reaching a browser.
 */
const files = import.meta.glob('../content/blog/*.md', {
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
  const explicitExcerpt = str(data.excerpt);
  const excerpt =
    explicitExcerpt ??
    body.split(/\r?\n\r?\n/).map((p) => p.trim()).find((p) => p !== '' && !p.startsWith('#')) ??
    '';

  return {
    slug: str(data.slug) ?? slugFromPath(path),
    title: str(data.title)!,
    date: str(data.date)!,
    author: str(data.author),
    tags,
    excerpt,
    html: marked.parse(body, { async: false }),
  };
}

/** All posts, newest first. */
export const POSTS: Post[] = Object.entries(files)
  .map(([path, raw]) => buildPost(path, raw))
  .filter((p): p is Post => p !== null)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

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
