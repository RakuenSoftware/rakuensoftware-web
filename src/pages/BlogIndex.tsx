import { ArticleCard, EmptyState, Hero, Section } from '@rakuensoftware/smoothgui';
import { PUBLISHED_POSTS, formatDate } from '../lib/posts';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';
import { STATIC_PAGES } from '../../lib/site-meta.mjs';

export default function BlogIndex() {
  return (
    <>
      <Meta {...STATIC_PAGES['/blog']} />

      <Hero
        title="Blog"
        subtitle="Release notes, design decisions and engineering write-ups."
      />

      <Section width="narrow">
        {PUBLISHED_POSTS.length === 0 ? (
          <EmptyState message="No posts yet. Check back soon." icon="📝" />
        ) : (
          PUBLISHED_POSTS.map((post) => (
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
          ))
        )}
      </Section>
    </>
  );
}
