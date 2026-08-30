# rakuensoftware-web

Public website for Rakuen Software — rakuensoftware.com.

Vite + React 19 + react-router, built on
[`@rakuensoftware/smoothgui`](https://github.com/RakuenSoftware/smoothgui).

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build      # tsc -b && vite build -> dist/
npm run preview    # serve the built output locally
npm start          # public site :3000 + private analytics :3001
npm test           # analytics aggregation and access-control tests
```

`dist/` is a static bundle. It is served in production by `server.mjs` on the
VPS that rakuensoftware.com resolves to — a Debian 13 box with the repo checked
out at `/opt/rakuen-web`, running as `rakuen-web.service`. nginx on that same
host terminates TLS and proxies to `:3000`.

This used to run on an LXC container in the homelab, and this file described that
for a while after it stopped being true — CT 107 behind an nginx-proxy container,
reached with `pct exec` through the Proxmox host. None of that applies. The
`infrastructure` repo's `homelab/bootstrap/13-setup-rakuen-web.sh` describes the
old container and is not what serves the site.

Because it is a single-page app, the host **must** rewrite unknown paths to
`index.html`. The production server does this itself; without that fallback,
`/blog` 404s on a hard refresh.

## Analytics

The production server records first-party, cookie-free page views at
`/__analytics/pageview`. It stores random visitor and session IDs, page paths,
referrers, UTM source/campaign values, and a coarse device class. It does not
store IP addresses, and browsers with Do Not Track enabled are skipped. Ingest
is capped per minute and per visitor; records are retained for 400 days. Data is
written as JSON Lines to `/var/lib/rakuen-web/pageviews.jsonl` by the systemd
service.

The dashboard is served separately on port 3001. Requests are checked against
the socket's remote address and only `192.168.0.0/23` is accepted—including no
loopback exception. `X-Forwarded-For` is deliberately not trusted. The defaults
can be changed with `ANALYTICS_PORT`, `ANALYTICS_ALLOWED_CIDR`,
`ANALYTICS_DATA_DIR`, `ANALYTICS_RETENTION_DAYS`, and `SITE_HOST` in the service
unit. The dashboard shows
unique visitors, page views, visits, bounce rate, traffic trends, acquisition
sources, top pages, and device mix for 7, 30, or 90 days.

That CIDR came from the homelab and moved to the VPS unchanged, where no client
can have a `192.168.x` source address. **The dashboard currently rejects
everyone**, which is why nobody has looked at it. Collection is unaffected —
pageviews are still being written. Reaching it again means deciding how it should
be reached (an ssh tunnel with a loopback exception, or a real login) rather than
widening the CIDR, which on a public address would publish the whole dataset.
Port 3001 is firewalled off externally, so nothing is exposed in the meantime.

During `vite` development, tracking is disabled by default. Set
`VITE_ANALYTICS_ENABLED=true` only when intentionally exercising the collector.

## Search and link previews

The site is a client-rendered SPA, so for a long time every URL served the same
`<head>`: one title (`Rakuen Software`), one description, no canonical, and no
Open Graph tags at all. Googlebot renders JavaScript and could eventually read
the per-route titles `Meta.tsx` sets after hydration, but the link crawlers
behind Reddit, LinkedIn, Slack and Discord do not run scripts — they fetch the
HTML once. Reddit supplies most of this site's readers, so every article shared
there previewed as the same generic card.

`vite.config.ts` now has an `emit-seo` plugin that runs after the bundle and
writes, into whatever `--outDir` the build used:

- **one document per route** — `/`, `/blog`, `/cloud`, every `/products/<slug>`
  and every `/blog/<slug>` — as `<route>/index.html`, each with its own title,
  description, canonical, Open Graph and Twitter tags. Only the `<head>` is
  prerendered; the body is still the empty root div and React renders
  everything, so there is no second rendering path to keep in step with the app.
- **`404.html`**, a shell that claims no canonical and asks not to be indexed.
  The server sends it for any path with no page behind it. Sending `index.html`
  there would tell a search engine a mistyped URL is another copy of the home
  page.
- **`robots.txt`** and **`sitemap.xml`**. Both used to 404 into the SPA fallback
  and answer `200 text/html`, which meant there was no sitemap to submit.

`server.mjs` resolves a request to `<path>/index.html` when no file matches, and
serves `/` from `cloud/index.html` when the `Host` is an aimee cloud hostname —
the same decision `App.tsx` makes for the index route, so a share of
`https://aimee.rakuensoftware.com/` previews as aimee cloud. Its canonical still
points at `rakuensoftware.com/cloud`: one page on two addresses, one of them
indexed.

Every tag comes from `lib/site-meta.mjs`, which the build and `Meta.tsx` both
read — the prerendered document and the tags the router swaps in during
client-side navigation cannot drift. `SITE_HOST` at build time sets the origin
in canonicals, `og:url`, `robots.txt` and the sitemap; it defaults to
`rakuensoftware.com`.

**None of this exists under `vite dev`.** The plugin is `apply: 'build'`, so in
development there is no `robots.txt`, no sitemap and no prerendered head — only
what `Meta.tsx` sets at runtime. Check preview cards against a build, not the
dev server.

There is deliberately **no `og:image`**: this repository has no brand image
asset, and pointing at one that 404s makes previews worse than having none. Add
one and the tag belongs in `headTags()` in `lib/site-meta.mjs`.

## Deploy

There is no CI. Deploying **code** is: merge to `main`, then run the deploy
script on the host. It fast-forwards the checkout to `origin/main`, rebuilds,
swaps `dist/` in atomically, restarts the server, and rolls back if the new
bundle fails to serve:

```sh
# on the VPS:
/opt/rakuen-web/scripts/deploy.sh
# or over ssh, as root on that host:
ssh root@<vps> '/opt/rakuen-web/scripts/deploy.sh'
```

It prints `Live: <bundle> (commit <sha>)`. That sha is the confirmation; a merge
on its own moves nothing.

**Articles do not need any of that.** They publish themselves; see below.

## Content

### Products

Product copy lives in `src/content/products.ts`. Each entry drives both its card
on the home page and its own `/products/<slug>` page.

Keep it accurate: descriptions should reflect what the code actually does, not
what a design document once planned.

### Blog

**Posts are not in this repository.** They live in
[rakuen-blog](https://github.com/RakuenSoftware/rakuen-blog), which owns each
article and the evidence behind it. `scripts/sync-articles.mjs` pulls the live
ones into `src/content/posts/` before every build. That directory is generated
and gitignored: editing it changes nothing, because the next build overwrites it.

`articles/PUBLISHED` in rakuen-blog is the list of officially published
articles, one slug per line, and a slug is both the article's directory there
and its URL here. **To publish, add a line to that file and merge it.** To change
a post, change it there. Either way `scripts/autopublish.sh` notices the branch
move within three minutes and rebuilds the site — no commit here, no deploy.

`articles/REVIEW` is a separate right-of-reply state. A named draft is served at
the same `/blog/<slug>` URL it will use if published, but it is absent from the
home page, blog index and sitemap, has no canonical or publication-time
metadata, and carries `noindex`. Moving the slug from `REVIEW` to `PUBLISHED`
publishes it without changing the URL.

Frontmatter is read from the article as it stands in rakuen-blog:

```markdown
---
title: "Post title"
date: 2026-07-22
author: Rakuen Software
tags: [release, smoothgui]
excerpt: "Shown on the blog index and in link previews."
---

Body markdown here.
```

`title` and a `YYYY-MM-DD` `date` are required — `npm run build` fails if either
is missing, so a broken post never reaches the site. `excerpt` defaults to the
first paragraph when omitted.

Because nothing here reviews an article before it goes live, the sync is where
the mistakes get caught. It refuses to build an empty blog, refuses a manifest
line that is not a slug, refuses when an article it is told to publish cannot be
found (a rename, which would retire a live URL), refuses when a previously
published article has been dropped, and refuses to put more than three articles
live at once. The last two are overridable with `ALLOW_UNPUBLISH=1` and
`ALLOW_BULK_PUBLISH=1`; the errors say so. A refused sync writes nothing, so it
keeps failing the same way until someone acts rather than passing on the retry.

To build against an unmerged branch without pushing:

```sh
BLOG_LOCAL=../rakuen-blog npm run sync
```

## Updating smoothgui

The component library is vendored as a tarball rather than pulled from GitHub
Packages, so the build needs no registry credentials:

```sh
cd ../smoothgui && npm run build && npm pack --pack-destination ../rakuensoftware-web/vendor
# then bump the file: dependency in package.json and reinstall
```
