/* The app is TypeScript and lib/ is plain ESM. Only the members the app uses
 * are declared here. */
export interface PageMeta {
  title: string;
  description: string;
}
export interface HeadTag {
  tag: string;
  text?: string;
  attrs?: Record<string, string>;
}
export declare const SITE_NAME: string;
export declare const DEFAULT_DESCRIPTION: string;
export declare const STATIC_PAGES: Record<string, PageMeta>;
export declare function pageTitle(subject?: string): string;
export declare function siteOrigin(host?: string): string;
export declare function canonicalUrl(origin: string, path: string): string;
export declare function productMeta(product: { name: string; summary: string }): PageMeta;
export declare function postMeta(post: { title: string; excerpt: string }): PageMeta;
export declare function headTags(input: {
  origin: string;
  path: string;
  title: string;
  description?: string;
  type?: string;
  published?: string;
  noindex?: boolean;
}): HeadTag[];
export declare const MARKER: string;
