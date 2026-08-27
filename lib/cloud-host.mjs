/* Which hostnames present aimee cloud as the site rather than a page on it.
 *
 * Lives in lib/ as a pure function so it can be tested. The routing decision
 * itself is one line in App.tsx, and a one-line decision that silently stops
 * being true (a renamed host, or a subdomain that merely contains "aimee") is
 * exactly the kind of thing nobody notices until a customer reports the wrong
 * page.
 */
export function isCloudHost(hostname) {
  if (typeof hostname !== 'string' || hostname === '') return false;
  const host = hostname.toLowerCase();
  /* A prefix match on "aimee." and not a substring one: "notaimee.example.com"
   * and "myaimee.com" are not us, and a plain `includes` would claim them. */
  return host === 'aimee' || host.startsWith('aimee.');
}

/* The canonical public address of aimee cloud.
 *
 * Every link to the service comes from here rather than being typed at each
 * call site, so the header, the aimee product page and anything added later
 * cannot drift apart or outlive a rename.
 */
export const AIMEE_CLOUD_URL = 'https://aimee.rakuensoftware.com';

/* Where a link to aimee cloud should point when the reader is already on
 * `hostname`.
 *
 * On the cloud host itself the service is the site, so the link stays in-app
 * and the router handles it; anywhere else it has to cross to the other
 * hostname. Sending a reader on aimee.rakuensoftware.com to the absolute URL
 * would be a full page load back to the page they are standing on.
 */
export function aimeeCloudHref(hostname) {
  return isCloudHost(hostname) ? '/' : AIMEE_CLOUD_URL;
}
