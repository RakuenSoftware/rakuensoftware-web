/* Every <head> tag that identifies a page, described once as data.
 *
 * Two consumers have to agree exactly, and they are written in different
 * languages at different times:
 *
 *   - The build (the emit-seo plugin in vite.config.ts) writes these into
 *     dist/<route>/index.html. That is the ONLY version a link crawler sees.
 *     Reddit, LinkedIn, Slack and Discord fetch the HTML once and never run its
 *     JavaScript, so a title set after hydration does not exist as far as they
 *     are concerned, and every share of every article previewed identically
 *     until this file existed.
 *   - Meta.tsx re-applies them on client-side navigation, where the router
 *     changes the page without there being a new document to serve.
 *
 * Describing the tags as data rather than as two blocks of markup is what stops
 * those two drifting: add a tag here and both ends get it.
 *
 * Plain ESM rather than TypeScript because the build scripts, the server and the
 * browser bundle all read it; site-meta.d.mts is where the app meets it.
 */

export const SITE_NAME = 'Rakuen Software';

export const DEFAULT_DESCRIPTION =
  'Linux storage, routing and AI tooling. SmoothNAS, SmoothFS, SmoothRouter, nonraid, aimee and the Smooth* platform, built on tools you already run.';

/* One separator everywhere. The pages had drifted to a mix of "—" and "|",
 * which reads as two different sites once titles are lined up in a search
 * results page. */
export function pageTitle(subject) {
  return subject == null || subject === '' ? SITE_NAME : `${subject} — ${SITE_NAME}`;
}

export function siteOrigin(host = 'rakuensoftware.com') {
  return `https://${host}`;
}

/* Canonical form: absolute, no trailing slash except at the root, no query.
 *
 * The trailing-slash rule matters because /blog/x and /blog/x/ both serve the
 * same page, and a canonical that disagrees with itself between two prerendered
 * files is worse than none. */
export function canonicalUrl(origin, path) {
  const clean = path.replace(/\/+$/, '');
  return clean === '' ? `${origin}/` : `${origin}${clean}`;
}

/* The static pages' own metadata, held here rather than inline in each page
 * component, because the build has to produce the identical strings without
 * rendering React. */
export const STATIC_PAGES = {
  '/': {
    title: 'Rakuen Software — Linux storage, routing and AI tooling',
    description:
      'SmoothNAS, SmoothFS, SmoothRouter, nonraid, aimee and the Smooth* platform. Linux appliances built on mdadm, ZFS, nftables and dnsmasq, managed from a browser.',
  },
  '/blog': {
    title: pageTitle('Blog'),
    description:
      'Release notes, design decisions and engineering write-ups from the Rakuen Software team.',
  },
  '/cloud': {
    title: pageTitle('aimee cloud'),
    description:
      'A hosted aimee knowledge base. We run the Postgres and the vectors; your agents keep running where they already are.',
  },
};

export function productMeta(product) {
  return { title: pageTitle(product.name), description: product.summary };
}

export function postMeta(post) {
  return { title: pageTitle(post.title), description: post.excerpt };
}

/* The tags themselves.
 *
 * `type` is "article" for blog posts and "website" for everything else, which is
 * what lets a preview card show a byline. og:image is deliberately absent: there
 * is no brand image asset in this repository, and pointing at one that 404s
 * makes previews worse rather than better.
 */
export function headTags({
  origin,
  path,
  title,
  description,
  type = 'website',
  published,
  noindex = false,
}) {
  const url = canonicalUrl(origin, path);
  const text = description == null || description === '' ? DEFAULT_DESCRIPTION : description;
  const tags = [
    { tag: 'title', text: title },
    /* A page asking not to be indexed has nothing to be canonical about, and a
     * canonical on the 404 shell would point a mistyped URL at itself. */
    ...(noindex ? [] : [{ tag: 'link', attrs: { rel: 'canonical', href: url } }]),
    { tag: 'meta', attrs: { name: 'description', content: text } },
    { tag: 'meta', attrs: { property: 'og:type', content: type } },
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
    { tag: 'meta', attrs: { property: 'og:title', content: title } },
    { tag: 'meta', attrs: { property: 'og:description', content: text } },
    { tag: 'meta', attrs: { property: 'og:url', content: url } },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary' } },
    { tag: 'meta', attrs: { name: 'twitter:title', content: title } },
    { tag: 'meta', attrs: { name: 'twitter:description', content: text } },
  ];
  if (published != null && published !== '') {
    tags.push({ tag: 'meta', attrs: { property: 'article:published_time', content: published } });
  }
  if (noindex) {
    tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex' } });
  }
  /* MARKER is on every generated tag so Meta.tsx can clear the prerendered set
   * and re-apply its own on a client-side navigation. Without it the two would
   * accumulate: the served document already carries these tags, and the router
   * changing the page does not reload it. */
  return tags.map((t) => (t.attrs ? { ...t, attrs: { ...t.attrs, [MARKER]: '' } } : t));
}

/** Attribute stamped on every tag this module generates. */
export const MARKER = 'data-site-meta';

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderHeadTags(tags, indent = '    ') {
  return tags
    .map((t) => {
      if (t.tag === 'title') return `${indent}<title>${escapeHtml(t.text)}</title>`;
      const attrs = Object.entries(t.attrs)
        .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
        .join(' ');
      return `${indent}<${t.tag} ${attrs} />`;
    })
    .join('\n');
}

/* Clears anything the generated head would duplicate.
 *
 * The template's own title and description go, or every page ships two of each
 * and a crawler picks whichever it likes. So does any previously generated tag,
 * which is what makes injection idempotent: a build into a directory that was
 * not emptied first reads an already-injected index.html as its template, and
 * without this the canonical and Open Graph tags would stack up on every run.
 */
export function stripTemplateMeta(html) {
  return html
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\n?/i, '')
    .replace(new RegExp(`[ \\t]*<[a-z]+\\b[^>]*\\b${MARKER}\\b[^>]*>\\n?`, 'gi'), '')
    .replace(/[ \t]*<meta\b[^>]*\bname="description"[^>]*>\n?/i, '');
}

export function injectHead(templateHtml, tags) {
  const stripped = stripTemplateMeta(templateHtml);
  if (!/<\/head>/i.test(stripped)) throw new Error('index.html has no </head> to inject into');
  /* Swallow the existing indentation before </head> so the generated block
   * lines up with the rest of the head rather than inheriting it. */
  return stripped.replace(/[ \t]*<\/head>/i, `${renderHeadTags(tags)}\n  </head>`);
}

export function robotsTxt(origin) {
  return [
    'User-agent: *',
    'Allow: /',
    /* Neither is a page. The analytics collector only answers POST, and the
     * signup endpoint accepts input; nothing there should be crawled or
     * indexed. */
    'Disallow: /__analytics/',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

/* `entries` are { path, lastmod? }, already deduplicated by the caller. */
export function sitemapXml(origin, entries) {
  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = `    <loc>${escapeHtml(canonicalUrl(origin, path))}</loc>`;
      const mod = lastmod ? `\n    <lastmod>${escapeHtml(lastmod)}</lastmod>` : '';
      return `  <url>\n${loc}${mod}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
