---
title: "SmoothGUI 0.9: the content half of the library"
date: 2026-07-22
author: Rakuen Software
tags: [release, smoothgui]
excerpt: "SmoothGUI was an appliance console library. Version 0.9 adds the primitives for public and long-form pages — and this website is the proof."
---

SmoothGUI started life as the console vocabulary for SmoothNAS: `AppShell`,
`Panel`, `DataTable`, `Wizard`. Everything you need to administer an appliance,
and nothing you need to explain one.

Version 0.9 adds the other half.

## What is new

Ten components for public, content-led pages:

- `SiteHeader` and `SiteFooter` for page chrome — the counterpart to `AppShell`,
  which keeps owning the signed-in console layout
- `Hero`, `Section` and `CallToAction` for page structure and vertical rhythm
- `FeatureGrid`, `FeatureCard` and `Card` for content grids
- `Prose` for rendered markdown, and `ArticleCard` for content listings
- `CodeBlock`, with copy-to-clipboard and deliberately no highlighting
  dependency

Plus dark-band and content-width tokens, so a hero and a footer can share one
definition of "dark surface" instead of inventing it twice.

## Routers are the consumer's business

Navigational components need to produce links, but a component library has no
business deciding how you route. So SmoothGUI does not import a router. Instead
the navigational components take an optional `linkComponent`:

```tsx
const RouterLink: LinkComponent = ({ href, ...rest }) => <Link to={href} {...rest} />;

<SiteHeader brand={<span>Rakuen Software</span>} items={NAV} linkComponent={RouterLink} />
```

Pass nothing and you get plain `<a>` elements, which is exactly right for a
static page. Pass an adapter and you get client-side navigation. The library
stays out of it either way.

## The constraint that keeps it honest

The same library now ships the appliance console, the installer that runs before
the appliance exists, and this marketing site. That is a useful constraint: a
component that only works inside a sidebar layout does not belong in a shared
library, and building a public site out of it surfaced every place we had
quietly assumed one.

Every existing export is unchanged. It is a purely additive release.
