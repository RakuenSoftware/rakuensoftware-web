import { Button, CallToAction, FeatureCard, FeatureGrid, Hero, Section } from '@rakuensoftware/smoothgui';
import { PRODUCTS } from '../content/products';
import { POSTS, formatDate } from '../lib/posts';
import { ArticleCard } from '@rakuensoftware/smoothgui';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';

export default function Home() {
  const recent = POSTS.slice(0, 3);

  return (
    <>
      <Meta
        title="Rakuen Software — Linux storage, routing and AI tooling"
        description="SmoothNAS, SmoothFS, SmoothRouter, nonraid, aimee and the Smooth* platform: Linux appliances that do not hide the Linux underneath."
      />

      <Hero
        eyebrow="Rakuen Software"
        title="Storage, routing and AI tooling built on real Linux"
        subtitle="Our appliances drive mdadm, ZFS, nftables and dnsmasq rather than replacing them. Manage everything from a browser, and keep every tool you already know when you SSH in."
        actions={
          <>
            <a href="#products"><Button variant="primary">Explore the products</Button></a>
            <a href="https://github.com/RakuenSoftware" target="_blank" rel="noreferrer">
              <Button variant="default">View on GitHub</Button>
            </a>
          </>
        }
      />

      <Section
        id="products"
        eyebrow="Products"
        title="What we build"
        description="Seven products. Each one works on its own, and they share a kernel, an installer and a component library."
        centered
      >
        <FeatureGrid columns={3}>
          {PRODUCTS.map((product) => (
            <FeatureCard
              key={product.slug}
              title={product.name}
              href={`/products/${product.slug}`}
              linkComponent={RouterLink}
            >
              {product.tagline}
            </FeatureCard>
          ))}
        </FeatureGrid>
      </Section>

      <Section tone="muted" title="Shared foundations" centered>
        <FeatureGrid columns={3}>
          <FeatureCard icon="🐧" title="One kernel">
            SmoothKernel builds a single kernel line into Debian packages. Every flavour installs it, so driver coverage and firmware baselines stay identical across products.
          </FeatureCard>
          <FeatureCard icon="💿" title="One installer">
            SmoothISO turns any product into a bootable Debian installer. Products supply hooks, so nobody maintains a private branch of the builder.
          </FeatureCard>
          <FeatureCard icon="🎨" title="One interface">
            SmoothGUI is the component library behind every console, every installer and this website. One fix lands everywhere.
          </FeatureCard>
        </FeatureGrid>
      </Section>

      {recent.length > 0 && (
        <Section title="Latest posts" width="narrow">
          {recent.map((post) => (
            <ArticleCard
              key={post.slug}
              title={post.title}
              href={`/blog/${post.slug}`}
              excerpt={post.excerpt}
              date={formatDate(post.date)}
              dateTime={post.date}
              author={post.author}
              tags={post.tags}
              linkComponent={RouterLink}
            />
          ))}
        </Section>
      )}

      <CallToAction
        title="Run it on hardware you already own"
        description="Every public product is on GitHub, licence and all. Clone it and see."
        actions={
          <a href="https://github.com/RakuenSoftware" target="_blank" rel="noreferrer">
            <Button variant="primary">Browse the source</Button>
          </a>
        }
      />
    </>
  );
}
