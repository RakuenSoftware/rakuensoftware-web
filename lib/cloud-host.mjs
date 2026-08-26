/* Which hostnames present aimee cloud as the site rather than a page on it.
 *
 * Lives in lib/ as a pure function so it can be tested. The routing decision
 * itself is one line in App.tsx, and a one-line decision that silently stops
 * being true — a renamed host, a subdomain that merely contains "aimee" — is
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
