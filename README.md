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
npm test           # routing, SEO, content sync and analytics checks
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

- **one document per route** — `/`, `/blog`, every `/products/<slug>`
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

`server.mjs` resolves a request to `<path>/index.html` when no file matches.
The company home page is served consistently on every hostname.

aimee cloud has been discontinued. Its marketing page, hosted-product links,
and signup collection/mail transport have been removed. `/cloud` permanently
redirects to `/products/aimee`; `/api/signup` returns `410 Gone` without collecting
or emailing data. The retired service is absent from the sitemap. Historical
signup records are left untouched.

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

After activation, merging website changes to `main` publishes them automatically
on the existing `rakuen-autopublish.timer`, normally within three minutes
(plus build time and the timer's 30-second accuracy window). The host polls
`origin/main` and `rakuen-blog` over their existing Git connections; no inbound
webhook, GitHub Actions deployment key, or new service credential is needed.

The watcher compares the remote website revision with `.last-site-sha`, the
last **verified deployment**, rather than the checkout's HEAD. Website changes
run a full deploy; blog-only changes rebuild the deployed code. When both move,
one full deploy includes both. An unchanged pair does nothing.

Every deployment holds the same `.publish.lock`, including manual runs, so
publishers cannot overlap. The script installs locked dependencies when needed,
syncs articles, type-checks without rewriting the tracked TypeScript build info,
builds into `dist.new`, and runs the tests against that candidate using
`SITE_DIST_DIR`. Those steps live in `scripts/verify.sh`, which the `verify`
GitHub Actions check also runs on every pull request; `main` requires that check,
so a change the deploy would roll back cannot merge. Only then does it swap the bundle, restart the web service and
check its asset and health endpoints. On failure it restores the prior checkout,
dependencies, bundle and service definition. Failed attempts leave the success
markers unchanged and are retried on the next timer tick.

### One-time activation or upgrade from article-only publishing

An older article-only watcher cannot fetch its own code update. After approving
and merging this change, explicitly deploy it once on the VPS, then install the
updated timer definitions. These commands change production and should only be
run when the deployment is approved:

```sh
/opt/rakuen-web/scripts/deploy.sh
install -m 0644 /opt/rakuen-web/scripts/rakuen-autopublish.service /etc/systemd/system/
install -m 0644 /opt/rakuen-web/scripts/rakuen-autopublish.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now rakuen-autopublish.timer
```

Subsequent merges to `main` need no manual deployment. For an intentional manual
redeploy, run `/opt/rakuen-web/scripts/deploy.sh`; it uses the same lock and checks.
It prints `Live: <bundle> (commit <full sha>)` after verification. Inspect failures
with `journalctl -u rakuen-autopublish.service`, and stop automatic publishing with
`systemctl disable --now rakuen-autopublish.timer`.

Articles still publish through `rakuen-blog`'s manifest and existing sync guards.
Deployments pull that repository's current main; rolling website code back does
not pin or roll article content back. A manual rollback must also be accompanied
by stopping the publishing timer or reverting `main`, otherwise the next tick
will redeploy the current branch.

## Content

### Products

Product copy lives in `src/content/products.ts`. Each entry drives its categorized card on the home page, footer navigation, documentation
links, connected projects, `/products/<slug>` overview and build-time SEO metadata.
`PRODUCT_GROUPS` defines the shared directory and footer categories.

The portfolio covers aimee, SmoothNAS, SmoothRouter, ouroboros-ring, SmoothFS,
nonraid, SmoothGUI, SmoothISO, SmoothKernel, smoothapt and the SmoothNAS plugin
family. SmoothRouter is the sole exception to Rakuen’s product source-release policy:
its source will remain private, and distribution is limited to specific opt-in
arrangements that may remain the only distribution model indefinitely. The
product page explains the authors’ privacy and cybersecurity rationale.
The former `/products/smoothiso-smoothkernel` URL permanently redirects to
`/products/smoothiso`; SmoothKernel now has its own page.

`resources` links to authoritative documentation; `related` contains product
slugs and drives the connected-project navigation. Add new products here so
the directory, footer, overview and sitemap stay in step.

Keep it accurate: descriptions should reflect what the code actually does, not
what a design document once planned. Check the repository visibility before linking
source, and distinguish released features, opt-in functionality and research.
Do not turn private research repositories into public product announcements.

The October 2026 refresh was checked against the project repositories and
current guides: aimee’s quickstart, compatibility and security documentation;
ouroboros-ring’s specification and language implementations; SmoothFS’s support
matrix and storage-mode contracts; SmoothISO’s offline build configuration;
SmoothKernel and smoothapt’s package-delivery guides; and the SmoothNAS plugin
catalog. Blog articles remain owned by rakuen-blog.

After editing, run `npm run check`, `npm run build` and `npm test`. Check the
built site at desktop and mobile widths, including project navigation, retired cloud links, the old platform redirect
and per-project preview metadata.

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
# then bump the file: dependency in package.json, reinstall,
# and delete the previous tarball from vendor/
```
