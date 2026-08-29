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
import Meta from '../components/Meta';
import { productMeta } from '../../lib/site-meta.mjs';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug != null ? productBySlug(slug) : undefined;

  if (product == null) return <Navigate to="/404" replace />;

  return (
    <>
      <Meta {...productMeta(product)} />

      <Hero
        title={product.name}
        subtitle={product.summary}
        actions={
          <>
            {product.status != null && <Badge label={product.status} variant="info" />}
            {product.repo != null && (
              <a href={product.repo} target="_blank" rel="noreferrer">
                <Button variant="primary">View on GitHub</Button>
              </a>
            )}
            {product.hosted != null && (
              <a href={product.hosted.href}>
                <Button variant="ghost">Try {product.hosted.name}</Button>
              </a>
            )}
          </>
        }
      />

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

      {product.hosted != null && product.repo != null ? (
        <CallToAction
          title={`Two ways to run ${product.name}`}
          description={`Run it yourself from the source, or let us run it for you. ${product.hosted.summary}`}
          actions={
            <>
              <a href={product.hosted.href}>
                <Button variant="primary">Go to {product.hosted.name}</Button>
              </a>
              <a href={product.repo} target="_blank" rel="noreferrer">
                <Button variant="ghost">Open the repository</Button>
              </a>
            </>
          }
        />
      ) : product.repo != null ? (
        <CallToAction
          title={`Try ${product.name}`}
          description="Source, issues and releases are on GitHub."
          actions={
            <a href={product.repo} target="_blank" rel="noreferrer">
              <Button variant="primary">Open the repository</Button>
            </a>
          }
        />
      ) : (
        <CallToAction
          title={`${product.name} is not public yet`}
          description="It is in active use and will be released publicly. Follow the blog for the announcement."
          actions={<a href="/blog"><Button variant="primary">Read the blog</Button></a>}
        />
      )}
    </>
  );
}
