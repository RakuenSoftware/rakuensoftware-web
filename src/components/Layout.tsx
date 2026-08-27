import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteFooter, SiteHeader, ThemeToggle } from '@rakuensoftware/smoothgui';
import type { SiteFooterGroup, SiteNavItem } from '@rakuensoftware/smoothgui';
import { PRODUCTS } from '../content/products';
import RouterLink from './RouterLink';
import { trackPageView } from '../lib/analytics';
import { aimeeCloudHref, AIMEE_CLOUD_URL } from '../../lib/cloud-host.mjs';

/* aimee cloud sits in the header beside the rest because it is a service
 * someone can sign up for, not a page about a product. Its href is decided per
 * render rather than baked into this list: on aimee.rakuensoftware.com the
 * service is the site, and a nav item there must not be an absolute link back
 * to the page the reader is already on. */
function navItems(cloudHref: string): SiteNavItem[] {
  return [
    { label: 'Products', href: '/#products' },
    { label: 'aimee cloud', href: cloudHref, external: cloudHref === AIMEE_CLOUD_URL },
    { label: 'Blog', href: '/blog' },
    { label: 'GitHub', href: 'https://github.com/RakuenSoftware', external: true },
    { label: 'Discord', href: 'https://discord.gg/FjGjvcgAqz', external: true },
  ];
}

const FOOTER_GROUPS: SiteFooterGroup[] = [
  {
    title: 'Products',
    links: PRODUCTS.map((p) => ({ label: p.name, href: `/products/${p.slug}` })),
  },
  {
    title: 'Project',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'GitHub', href: 'https://github.com/RakuenSoftware', external: true },
      { label: 'Discord', href: 'https://discord.gg/FjGjvcgAqz', external: true },
    ],
  },
];

export default function Layout() {
  const { pathname, hash, search } = useLocation();
  const cloudHref = aimeeCloudHref(typeof window === 'undefined' ? '' : window.location.hostname);

  useEffect(() => {
    trackPageView(`${pathname}${search}`);
  }, [pathname, search]);

  // Client-side navigation does not reset scroll on its own, and an in-page
  // anchor must still win when one is present.
  useEffect(() => {
    if (hash !== '') {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <SiteHeader
        brand={
          <RouterLink href="/" className="site-wordmark">
            <span className="site-wordmark__mark" aria-hidden="true">R</span>
            <span>Rakuen Software</span>
          </RouterLink>
        }
        items={navItems(cloudHref)}
        activeHref={pathname.startsWith('/blog') ? '/blog' : undefined}
        actions={<ThemeToggle defaultTheme="dark" storageKey="rakuen-theme" />}
        linkComponent={RouterLink}
      />
      <main>
        <Outlet />
      </main>
      <SiteFooter
        brand={
          <div className="site-footer-brand">
            <strong><span aria-hidden="true">R / </span>Rakuen Software</strong>
            <p>Linux storage, routing and AI tooling built on tools you already run.</p>
          </div>
        }
        groups={FOOTER_GROUPS}
        bottom={<span>© {new Date().getFullYear()} Rakuen Software</span>}
        linkComponent={RouterLink}
      />
    </>
  );
}
