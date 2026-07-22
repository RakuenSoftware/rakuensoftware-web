import { useEffect } from 'react';

/**
 * Sets the document title and meta description per route. The site is a client
 * -rendered SPA, so this is what search engines and link previews read after
 * hydration.
 */
export default function Meta({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    document.title = title;
    if (description == null) return;
    let tag = document.querySelector('meta[name="description"]');
    if (tag == null) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', description);
  }, [title, description]);

  return null;
}
