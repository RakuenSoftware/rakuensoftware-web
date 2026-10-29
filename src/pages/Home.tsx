import { CallToAction, Hero, Section } from '@rakuensoftware/smoothgui';
import { PRODUCTS, PRODUCT_GROUPS, sourceLabel } from '../content/products';
import { PUBLISHED_POSTS, formatDate } from '../lib/posts';
import RouterLink from '../components/RouterLink';
import ButtonLink from '../components/ButtonLink';
import Meta from '../components/Meta';
import { STATIC_PAGES } from '../../lib/site-meta.mjs';

export default function Home() {
  const recent = PUBLISHED_POSTS.slice(0, 3);

  return (
    <div className="home-page">
      <Meta {...STATIC_PAGES['/']} />

      <Hero
        title={<>Software you run yourself.<br /><span className="home-hero__accent">Down to the kernel.</span></>}
        subtitle="Aimee keeps the memory and code index your AI tools work from. SmoothNAS and SmoothRouter run storage and networking on Debian. All three are built from components you can use on their own, and run on hardware you choose."
        actions={
          <>
            <ButtonLink href="#products" variant="primary">Explore the projects</ButtonLink>
            <ButtonLink href="https://github.com/RakuenSoftware" variant="ghost">View the source</ButtonLink>
          </>
        }
      />

      <section className="home-principles" aria-label="What Rakuen Software builds for">
        <div className="home-principles__inner">
          <p><strong>Keep the state</strong><span>AI memory, storage pools and network settings stay on your machines.</span></p>
          <p><strong>Reach the tools</strong><span>The Linux tools under every interface stay usable from a shell.</span></p>
          <p><strong>Read the source</strong><span>Public for every project except SmoothRouter.</span></p>
        </div>
      </section>

      <div className="home-portfolio">
        <Section id="products" title="The projects"
          description="Three systems you operate, the components they are built from, and the platform that installs and updates them.">
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
                    <span className="home-product__index">{product.status ?? sourceLabel(product)}</span>
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

      <div className="home-source">
        <Section title="Public source, with one exception" width="narrow">
          <div className="source-commitment">
            <p>Every project here except SmoothRouter publishes its source on GitHub. Aimee, SmoothNAS, ouroboros-ring and smoothapt are licensed under the AGPL-3.0, and SmoothFS under the GPL-2.0. The other repositories are public but do not carry a license yet, so check each one before you build on it.</p>
            <p><RouterLink href="/products/smoothrouter">SmoothRouter is the exception.</RouterLink> It faces the internet and guards the network behind it, and we are not convinced publishing its source is wise. The source is private for now and may never be released. Access is by opt-in arrangement.</p>
          </div>
        </Section>
      </div>

      {recent.length > 0 && (
        <div className="home-writing">
          <Section
            title="Engineering, measured"
            description="Release notes, design decisions and experiments, including the results that changed our minds."
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
        title="Build with us"
        description="Read the source, open an issue, or tell us what you are building."
        actions={
          <>
            <ButtonLink href="https://github.com/RakuenSoftware" variant="primary">Browse GitHub</ButtonLink>
            <ButtonLink href="https://discord.gg/FjGjvcgAqz" variant="ghost">Join the Discord</ButtonLink>
          </>
        }
      />
    </div>
  );
}
