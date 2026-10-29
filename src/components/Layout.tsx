import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteFooter, SiteHeader, THEME_STORAGE_KEY, activeTheme, applyTheme, clearStoredTheme, storeTheme, storedTheme, systemTheme } from '@rakuensoftware/smoothgui';
import type { SiteFooterGroup, SiteNavItem, Theme, ThemeDefault } from '@rakuensoftware/smoothgui';
import { PRODUCTS, PRODUCT_GROUPS } from '../content/products';
import RouterLink from './RouterLink';
import ThemeControl from './ThemeControl';
import { trackPageView } from '../lib/analytics';

const NAV_ITEMS: SiteNavItem[] = [
  { label: 'Projects', href: '/#products' },
  { label: 'Blog', href: '/blog' },
  { label: 'GitHub', href: 'https://github.com/RakuenSoftware', external: true },
  { label: 'Discord', href: 'https://discord.gg/FjGjvcgAqz', external: true },
];

const FOOTER_GROUPS: SiteFooterGroup[] = [
  ...PRODUCT_GROUPS.map((group) => ({
    title: group.title,
    links: PRODUCTS.filter((product) => product.group === group.id)
      .map((product) => ({ label: product.name, href: `/products/${product.slug}` })),
  })),
  {
    title: 'Community',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'GitHub', href: 'https://github.com/RakuenSoftware', external: true },
      { label: 'Discord', href: 'https://discord.gg/FjGjvcgAqz', external: true },
    ],
  },
];

export default function Layout() {
  const { pathname, hash, search } = useLocation();
  const [mode, setMode] = useState<ThemeDefault>(() => storedTheme() ?? 'system');
  const [theme, setTheme] = useState<Theme>(() => activeTheme());

  function chooseTheme(next: ThemeDefault) {
    if (next === 'system') clearStoredTheme();
    else storeTheme(next);
    setMode(next);
    setTheme(next === 'system' ? systemTheme() : next);
  }

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystem = () => { if (mode === 'system') setTheme(systemTheme()); };
    media.addEventListener('change', syncSystem);
    return () => media.removeEventListener('change', syncSystem);
  }, [mode]);

  useEffect(() => {
    const syncStorage = (event: StorageEvent) => {
      if (event.key != null && event.key !== THEME_STORAGE_KEY) return;
      const stored = storedTheme();
      setMode(stored ?? 'system');
      setTheme(stored ?? systemTheme());
    };
    window.addEventListener('storage', syncStorage);
    return () => window.removeEventListener('storage', syncStorage);
  }, []);

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
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader
        brand={
          <RouterLink href="/" className="site-wordmark">
            <span className="site-wordmark__mark" aria-hidden="true">R</span>
            <span>Rakuen Software</span>
          </RouterLink>
        }
        items={NAV_ITEMS}
        activeHref={pathname.startsWith('/blog') ? '/blog' : pathname.startsWith('/products/') ? '/#products' : undefined}
        actions={<ThemeControl mode={mode} onChange={chooseTheme} />}
        linkComponent={RouterLink}
      />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter
        brand={
          <div className="site-footer-brand">
            <strong><span aria-hidden="true">R / </span>Rakuen Software</strong>
            <p>AI working environments, Linux appliances and independent systems components.</p>
          </div>
        }
        groups={FOOTER_GROUPS}
        bottom={<span>© {new Date().getFullYear()} Rakuen Software</span>}
        linkComponent={RouterLink}
      />
    </>
  );
}
