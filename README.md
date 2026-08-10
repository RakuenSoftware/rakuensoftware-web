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

`dist/` is a static bundle. It is served in production by `server.mjs` on CT 121
(`rakuen-web`, .253), behind the nginx-proxy container (CT 118) which terminates
TLS for rakuensoftware.com. See `homelab/bootstrap/13-setup-rakuen-web.sh` in the
`infrastructure` repo for how the host was provisioned.

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

During `vite` development, tracking is disabled by default. Set
`VITE_ANALYTICS_ENABLED=true` only when intentionally exercising the collector.

## Deploy

There is no CI. Publishing is: merge to `main`, then run the deploy script on the
host. It fast-forwards the checkout to `origin/main`, rebuilds, swaps `dist/` in
atomically, restarts the server, and rolls back if the new bundle fails to serve:

```sh
# on the host (CT 121):
/opt/rakuen-web/scripts/deploy.sh
# or from a box with Proxmox access:
ssh root@.253 'pct exec 121 -- /opt/rakuen-web/scripts/deploy.sh'
```

## Content

### Products

Product copy lives in `src/content/products.ts`. Each entry drives both its card
on the home page and its own `/products/<slug>` page.

Keep it accurate: descriptions should reflect what the code actually does, not
what a design document once planned.

### Blog

Posts are markdown files in `src/content/blog/`. The filename becomes the slug.

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

## Updating smoothgui

The component library is vendored as a tarball rather than pulled from GitHub
Packages, so the build needs no registry credentials:

```sh
cd ../smoothgui && npm run build && npm pack --pack-destination ../rakuensoftware-web/vendor
# then bump the file: dependency in package.json and reinstall
```
