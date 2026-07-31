import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteFooter, SiteHeader } from '@rakuensoftware/smoothgui';
import type { SiteFooterGroup, SiteNavItem } from '@rakuensoftware/smoothgui';
import { PRODUCTS } from '../content/products';
import RouterLink from './RouterLink';

const NAV: SiteNavItem[] = [
  { label: 'Products', href: '/#products' },
  { label: 'Blog', href: '/blog' },
  { label: 'GitHub', href: 'https://github.com/RakuenSoftware', external: true },
  { label: 'Discord', href: 'https://discord.gg/FjGjvcgAqz', external: true },
];

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
  const { pathname, hash } = useLocation();

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
        brand={<RouterLink href="/">Rakuen Software</RouterLink>}
        items={NAV}
        activeHref={pathname.startsWith('/blog') ? '/blog' : undefined}
        linkComponent={RouterLink}
      />
      <main>
        <Outlet />
      </main>
      <SiteFooter
        brand={
          <>
            <strong>Rakuen Software</strong>
            <p>Linux storage, routing and AI tooling built on tools you already run.</p>
          </>
        }
        groups={FOOTER_GROUPS}
        bottom={<span>© {new Date().getFullYear()} Rakuen Software</span>}
        linkComponent={RouterLink}
      />
    </>
  );
}
