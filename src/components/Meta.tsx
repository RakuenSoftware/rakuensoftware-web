import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MARKER, headTags, siteOrigin } from '../../lib/site-meta.mjs';

/**
 * Keeps the document head correct across client-side navigation.
 *
 * The head that matters most is not this one. Every page is prerendered with
 * its own title, description, canonical and Open Graph tags by the emit-seo
 * plugin in vite.config.ts, because link crawlers read the served HTML once and
 * never run the bundle. This component exists for the other half: once the
 * router takes over, there is no new document, so the tags have to be replaced
 * in place or the reader carries the first page's identity around the site.
 *
 * Both halves build their tags from lib/site-meta.mjs, so they cannot disagree.
 */
export default function Meta({
  title,
  description,
  type,
  published,
  noindex,
}: {
  title: string;
  description?: string;
  /** "article" for a blog post; defaults to "website". */
  type?: string;
  /** ISO date, for article:published_time. */
  published?: string;
  noindex?: boolean;
}) {
  const { pathname } = useLocation();

  useEffect(() => {
    const tags = headTags({
      origin: siteOrigin(),
      path: pathname,
      title,
      description,
      type,
      published,
      noindex,
    });

    /* Clear the previous set — the prerendered one on first render, the last
     * route's on every one after — then write the new set. Replacing rather
     * than patching is what keeps a tag from a previous page (an article's
     * published time, a 404's noindex) surviving onto the next one. */
    for (const stale of Array.from(document.head.querySelectorAll(`[${MARKER}]`))) {
      stale.remove();
    }

    for (const t of tags) {
      if (t.tag === 'title') {
        if (t.text != null) document.title = t.text;
        continue;
      }
      const el = document.createElement(t.tag);
      for (const [key, value] of Object.entries(t.attrs ?? {})) el.setAttribute(key, value);
      document.head.appendChild(el);
    }
  }, [pathname, title, description, type, published, noindex]);

  return null;
}
