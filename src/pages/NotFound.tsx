import { Hero, Section } from '@rakuensoftware/smoothgui';
import ButtonLink from '../components/ButtonLink';
import Meta from '../components/Meta';
import { pageTitle } from '../../lib/site-meta.mjs';

export default function NotFound() {
  return (
    <>
      {/* noindex: a retired article answers 404 with this page, and without it
          the shell itself is a candidate for the index. */}
      <Meta title={pageTitle('Page not found')} noindex />
      <Hero
        title="That page doesn’t exist"
        subtitle="The link may be out of date, or the page may have moved."
        actions={<ButtonLink href="/" variant="primary">Back to the home page</ButtonLink>}
      />
      <Section width="narrow" />
    </>
  );
}
