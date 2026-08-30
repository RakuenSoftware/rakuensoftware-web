import { Button, CallToAction, Hero, Section } from '@rakuensoftware/smoothgui';
import { PRODUCTS } from '../content/products';
import { PUBLISHED_POSTS, formatDate } from '../lib/posts';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';
import { STATIC_PAGES } from '../../lib/site-meta.mjs';

const FEATURED_SLUGS = new Set(['aimee', 'smoothnas', 'smoothrouter']);
const featuredProducts = PRODUCTS.filter((product) => FEATURED_SLUGS.has(product.slug));
const foundationProducts = PRODUCTS.filter((product) => !FEATURED_SLUGS.has(product.slug));

export default function Home() {
  const recent = PUBLISHED_POSTS.slice(0, 3);

  return (
    <div className="home-page">
      <Meta {...STATIC_PAGES['/']} />

      <Hero
        title={<>Linux infrastructure.<br /><span className="home-hero__accent">Without the black box.</span></>}
        subtitle="Storage, routing and AI tooling built on the Linux stack you already know. Operate it from a browser. Inspect it from a shell. Keep control of the machine underneath."
        actions={
          <>
            <a href="#products"><Button variant="primary">Explore the portfolio</Button></a>
            <a href="https://github.com/RakuenSoftware" target="_blank" rel="noreferrer">
              <Button variant="ghost">View the source</Button>
            </a>
          </>
        }
      />

      <section className="home-principles" aria-label="What Rakuen Software builds for">
        <div className="home-principles__inner">
          <p><strong>Linux-native</strong><span>No private replacement stack.</span></p>
          <p><strong>Inspectable</strong><span>The browser and shell tell the same story.</span></p>
          <p><strong>Ownable</strong><span>Your hardware, your data, your way out.</span></p>
        </div>
      </section>

      <div className="home-portfolio">
        <Section
          id="products"
          title="Systems you can understand under failure"
          description="The products solve different problems, but share one rule: the interface must expose the system, not hide it."
        >
          <div className="home-product-grid">
            {featuredProducts.map((product, index) => (
              <RouterLink
                key={product.slug}
                href={`/products/${product.slug}`}
                className="home-product"
              >
                <span className="home-product__index">0{index + 1}</span>
                {product.status != null && <span className="home-product__status">{product.status}</span>}
                <h3>{product.name}</h3>
                <p>{product.tagline}</p>
                <span className="home-product__link">Product overview <span aria-hidden="true">↗</span></span>
              </RouterLink>
            ))}
          </div>

          <div className="home-foundations">
            <div className="home-foundations__intro">
              <h3>Built once. Shared all the way down.</h3>
              <p>The filesystem, parity engine, interface, installer and kernel stay independent—and become infrastructure for everything above them.</p>
            </div>
            <div className="home-foundations__list">
              {foundationProducts.map((product, index) => (
                <RouterLink key={product.slug} href={`/products/${product.slug}`} className="home-foundation">
                  <span className="home-foundation__index">0{index + 4}</span>
                  <span className="home-foundation__name">{product.name}</span>
                  <span className="home-foundation__tagline">{product.tagline}</span>
                  <span className="home-foundation__arrow" aria-hidden="true">→</span>
                </RouterLink>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <div className="home-operating-model">
        <Section title="One stack. Clear boundaries.">
          <div className="home-model-grid">
            <article>
              <span>01</span>
              <h3>Standard underneath</h3>
              <p>mdadm, ZFS, nftables, dnsmasq and Debian remain visible and usable. Recovery never depends on our UI being alive.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Purpose-built above</h3>
              <p>The browser handles orchestration, policy and the work that should not require memorising six command-line interfaces.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Shared across products</h3>
              <p>One kernel, installer and interface keep hardware support, installation and operations from drifting apart.</p>
            </article>
          </div>
        </Section>
      </div>

      {recent.length > 0 && (
        <div className="home-writing">
          <Section
            title="Engineering, measured"
            description="Release notes, design decisions and experiments—including the results that changed our minds."
          >
            <div className="home-writing__grid">
              {recent.map((post, index) => (
                <article key={post.slug} className={index === 0 ? 'home-post home-post--lead' : 'home-post'}>
                  <p className="home-post__meta">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    {post.tags[0] != null && <span>{post.tags[0]}</span>}
                  </p>
                  <h3><RouterLink href={`/blog/${post.slug}`}>{post.title}</RouterLink></h3>
                  <p>{post.excerpt}</p>
                  <RouterLink href={`/blog/${post.slug}`} className="home-post__link">Read the article →</RouterLink>
                </article>
              ))}
            </div>
          </Section>
        </div>
      )}

      <CallToAction
        title="Built in public. Run on your hardware."
        description="Read the source, open an issue, or tell us what you are building."
        actions={
          <>
            <a href="https://github.com/RakuenSoftware" target="_blank" rel="noreferrer">
              <Button variant="primary">Browse GitHub</Button>
            </a>
            <a href="https://discord.gg/FjGjvcgAqz" target="_blank" rel="noreferrer">
              <Button variant="ghost">Join the Discord</Button>
            </a>
          </>
        }
      />
    </div>
  );
}
