import { Button, CallToAction, Hero, Section } from '@rakuensoftware/smoothgui';
import { PRODUCTS, PRODUCT_GROUPS } from '../content/products';
import { PUBLISHED_POSTS, formatDate } from '../lib/posts';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';
import { STATIC_PAGES } from '../../lib/site-meta.mjs';

export default function Home() {
  const recent = PUBLISHED_POSTS.slice(0, 3);

  return (
    <div className="home-page">
      <Meta {...STATIC_PAGES['/']} />

      <Hero
        title={<>Software you can own.<br /><span className="home-hero__accent">From the runtime down.</span></>}
        subtitle="Persistent AI work, Linux storage and networking, and the independent components underneath them. Run the systems on your hardware. Read the contracts. Keep control of your data."
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
          <p><strong>Own the state</strong><span>Your memory, storage and configuration.</span></p>
          <p><strong>Inspect the system</strong><span>Source, contracts and recovery paths.</span></p>
          <p><strong>Build in the open</strong><span>Public source, with one deliberate exception.</span></p>
        </div>
      </section>

      <Section title="Committed to public and open source code" width="narrow">
        <div className="source-commitment">
          <p>Rakuen Software is deeply committed to public and open source code. We build products and independent components that people can inspect, use and build on.</p>
          <p><RouterLink href="/products/smoothrouter">SmoothRouter is the sole exception.</RouterLink> As a public-facing security device, the authors regard publishing its code in the current cybersecurity climate as a fundamentally different security proposition. Its source stays private, and distribution is limited to specific opt-in arrangements, potentially indefinitely.</p>
        </div>
      </Section>

      <div className="home-portfolio">
        <Section id="products" title="Explore the Rakuen projects"
          description="From an AI working environment to a local message ring: find the system you need, or the component you want to build with.">
          <nav className="project-jump-links" aria-label="Project categories">
            {PRODUCT_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`}>{group.title} <span aria-hidden="true">↓</span></a>)}
          </nav>
          {PRODUCT_GROUPS.map((group) => (
            <section className="project-group" id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
              <div className="project-group__heading">
                <h3 id={`${group.id}-title`}>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <div className="home-product-grid">
                {PRODUCTS.filter((product) => product.group === group.id).map((product) => (
                  <RouterLink key={product.slug} href={`/products/${product.slug}`} className="home-product">
                    <span className="home-product__index">{product.status ?? (product.repo ? 'Open source' : 'Application catalog')}</span>
                    <h4>{product.name}</h4>
                    <p className="home-product__tagline">{product.tagline}</p>
                    <p>{product.summary}</p>
                    <span className="home-product__link">Explore {product.name} <span aria-hidden="true">→</span></span>
                  </RouterLink>
                ))}
              </div>
            </section>
          ))}
        </Section>
      </div>

      <div className="home-operating-model">
        <Section title="How the pieces fit.">
          <div className="home-model-grid">
            <article>
              <span>01</span>
              <h3>Systems with their own state</h3>
              <p>aimee owns the state around AI work. SmoothNAS orchestrates storage. SmoothRouter manages networking. Each keeps its responsibilities explicit.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Components with public contracts</h3>
              <p>ouroboros-ring connects local processes. SmoothFS handles storage placement. nonraid supplies parity. Each can evolve independently of its consumers.</p>
            </article>
            <article>
              <span>03</span>
              <h3>A platform maintained together</h3>
              <p>SmoothGUI, SmoothISO, SmoothKernel and smoothapt share interface, installation, hardware support and package delivery across the appliances.</p>
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
        title="Build with us. Run it your way."
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
