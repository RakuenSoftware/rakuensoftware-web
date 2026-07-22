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
        title="Appliances that don’t hide the Linux underneath"
        subtitle="Storage, routing and AI tooling built on mdadm, ZFS, LVM, nftables and dnsmasq — driven by a browser UI, without boxing you out of the tools doing the work."
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
        title="One platform, seven pieces"
        description="Each piece stands alone. Together they are an appliance family sharing a kernel, an installer and a component library."
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

      <Section tone="muted" title="How it fits together" centered>
        <FeatureGrid columns={3}>
          <FeatureCard icon="🐧" title="One kernel">
            SmoothKernel builds a single kernel line as Debian packages. Every flavour installs it, so driver coverage and firmware baselines never drift apart.
          </FeatureCard>
          <FeatureCard icon="💿" title="One installer">
            SmoothISO turns any product into a bootable Debian installer, with product behaviour injected through hooks rather than forks.
          </FeatureCard>
          <FeatureCard icon="🎨" title="One interface">
            SmoothGUI is the component library behind every console, every installer, and this website.
          </FeatureCard>
        </FeatureGrid>
      </Section>

      {recent.length > 0 && (
        <Section title="From the blog" width="narrow">
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
        description="Everything public lives on GitHub, licence and all."
        actions={
          <a href="https://github.com/RakuenSoftware" target="_blank" rel="noreferrer">
            <Button variant="primary">Browse the source</Button>
          </a>
        }
      />
    </>
  );
}
