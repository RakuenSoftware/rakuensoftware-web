import { Navigate, useParams } from 'react-router-dom';
import { Badge, Hero, Prose, Section } from '@rakuensoftware/smoothgui';
import { formatDate, postBySlug } from '../lib/posts';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug != null ? postBySlug(slug) : undefined;

  if (post == null) return <Navigate to="/404" replace />;

  const byline = [formatDate(post.date), post.author].filter((v) => v != null).join(' · ');

  return (
    <>
      <Meta title={`${post.title} — Rakuen Software`} description={post.excerpt} />

      <Hero title={post.title} subtitle={post.excerpt} />

      <Section width="narrow">
        <p className="site-post-byline">{byline}</p>
        {post.tags.length > 0 && (
          <div
            className="site-post-tags"
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}
          >
            {post.tags.map((tag) => <Badge key={tag} label={tag} variant="neutral" />)}
          </div>
        )}
        {/* Trusted input: markdown committed to this repository, not user submissions. */}
        <Prose html={post.html} />
        <p style={{ marginTop: 40 }}>
          <RouterLink href="/blog">← Back to all posts</RouterLink>
        </p>
      </Section>
    </>
  );
}
