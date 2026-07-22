import { Button, Hero, Section } from '@rakuensoftware/smoothgui';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';

export default function NotFound() {
  return (
    <>
      <Meta title="Page not found — Rakuen Software" />
      <Hero
        eyebrow="404"
        title="That page doesn’t exist"
        subtitle="The link may be out of date, or the page may have moved."
        actions={<RouterLink href="/"><Button variant="primary">Back to the home page</Button></RouterLink>}
      />
      <Section width="narrow" />
    </>
  );
}
