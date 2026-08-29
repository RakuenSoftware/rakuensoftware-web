/**
 * Frontmatter parsing and post validation, kept free of any Vite or DOM
 * dependency so the build-time checker and the browser bundle share one
 * implementation rather than drifting apart.
 */

export interface Frontmatter {
  [key: string]: string | string[];
}

/**
 * Minimal frontmatter parser: `key: value` pairs, plus `[a, b]` list values.
 * Deliberately not a YAML implementation — posts only need scalars and lists,
 * and a real YAML parser is a dependency this site does not need.
 */
export function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (match == null) return { data: {}, body: raw };

  const data: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const sep = line.indexOf(':');
    if (sep === -1) continue;

    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter((v) => v !== '');
    } else {
      data[key] = value;
    }
  }
  return { data, body: match[2] };
}

export function str(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * The post's summary line: the explicit `excerpt` when the author wrote one,
 * otherwise its first real paragraph.
 *
 * Lives here rather than in posts.ts because the build needs the same string
 * without loading the browser bundle — it becomes the meta description and the
 * og:description of the prerendered page, and those must match what the site
 * itself shows.
 */
export function excerptFrom(data: Frontmatter, body: string): string {
  return (
    str(data.excerpt) ??
    body
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .find((p) => p !== '' && !p.startsWith('#')) ??
    ''
  );
}

/**
 * Returns the reasons `raw` is not a publishable post, empty when it is fine.
 * Used by the build-time checker so authoring mistakes fail `npm run build`
 * instead of producing a blank page in the browser.
 */
export function validatePost(raw: string): string[] {
  const { data } = parseFrontmatter(raw);
  const problems: string[] = [];

  const title = str(data.title);
  if (title == null || title === '') {
    problems.push('missing a "title" in its frontmatter');
  }

  const date = str(data.date);
  if (date == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    problems.push(`needs a "date" in YYYY-MM-DD form (got: ${date ?? 'nothing'})`);
  }

  if (data.tags != null && !Array.isArray(data.tags)) {
    problems.push('has "tags" that are not a [list, like, this]');
  }

  return problems;
}
