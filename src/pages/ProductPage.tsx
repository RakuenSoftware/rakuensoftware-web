import { Navigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  CallToAction,
  FeatureCard,
  FeatureGrid,
  Hero,
  Prose,
  Section,
} from '@rakuensoftware/smoothgui';
import { productBySlug } from '../content/products';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';
import { productMeta } from '../../lib/site-meta.mjs';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug != null ? productBySlug(slug) : undefined;

  if (product == null) return <Navigate to="/404" replace />;

  return (
    <>
      <Meta {...productMeta(product)} />

      <div className="product-intro">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <RouterLink href="/#products">All projects</RouterLink><span aria-hidden="true"> / </span><span aria-current="page">{product.name}</span>
        </nav>

        <Hero
          eyebrow={product.status != null ? <Badge label={product.status} variant="neutral" /> : undefined}
          title={product.name}
          subtitle={product.summary}
          actions={
            <>
              {product.repo != null && (
                <a href={product.repo} target="_blank" rel="noreferrer">
                  <Button variant="primary">View on GitHub</Button>
                </a>
              )}
              {product.repo == null && product.resources.length > 0 && (
                <a href="#documentation"><Button variant="primary">Browse packages</Button></a>
              )}
            </>
          }
        />
      </div>

      {product.sourcePolicy != null && (
        <Section title="Why the source stays private" width="narrow" tone="muted">
          <Prose><p>{product.sourcePolicy}</p></Prose>
        </Section>
      )}

      <Section title="What it does">
        <FeatureGrid columns={3} variant="ruled">
          {product.features.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title}>
              {feature.body}
            </FeatureCard>
          ))}
        </FeatureGrid>
      </Section>

      {product.sections.map((section, i) => (
        <Section
          key={section.title}
          title={section.title}
          width="narrow"
          tone={i % 2 === 0 ? 'muted' : 'default'}
        >
          <Prose>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets != null && (
              <ul>{section.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            )}
          </Prose>
        </Section>
      ))}

      {product.resources.length > 0 && (
        <Section id="documentation" title="Documentation and source" tone="muted">
          <ul className="product-resources">
            {product.resources.map((resource) => (
              <li key={resource.href}><a href={resource.href} target="_blank" rel="noreferrer">{resource.label} <span aria-hidden="true">↗</span></a></li>
            ))}
          </ul>
        </Section>
      )}

      {product.related.length > 0 && (
        <Section title="Connected projects">
          <div className="related-projects">
            {product.related.map((relatedSlug) => {
              const related = productBySlug(relatedSlug);
              return related == null ? null : (
                <RouterLink key={related.slug} href={`/products/${related.slug}`} className="related-project">
                  <strong>{related.name} <span aria-hidden="true">→</span></strong>
                  <span>{related.tagline}</span>
                </RouterLink>
              );
            })}
          </div>
        </Section>
      )}

      {product.repo != null ? (
        <CallToAction
          title={`Build with ${product.name}`}
          description="Source, issues and releases are on GitHub."
          actions={
            <a href={product.repo} target="_blank" rel="noreferrer">
              <Button variant="primary">Open the repository</Button>
            </a>
          }
        />
      ) : (
        <CallToAction
          title={product.sourcePolicy != null ? `${product.name}: access by arrangement` : `Extend your SmoothNAS`}
          description={product.sourcePolicy != null ? 'Distribution is limited to specific opt-in arrangements and may remain that way indefinitely. Contact us to discuss access.' : 'Explore the application repositories above, or start with the SmoothNAS overview.'}
          actions={product.sourcePolicy != null
            ? <a href="https://discord.gg/FjGjvcgAqz" target="_blank" rel="noreferrer"><Button variant="primary">Contact the community</Button></a>
            : <RouterLink href="/products/smoothnas"><Button variant="primary">Explore SmoothNAS</Button></RouterLink>}
        />
      )}
    </>
  );
}
