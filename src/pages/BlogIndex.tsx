import { ArticleCard, EmptyState, Hero, Section } from '@rakuensoftware/smoothgui';
import { POSTS, formatDate } from '../lib/posts';
import RouterLink from '../components/RouterLink';
import Meta from '../components/Meta';

export default function BlogIndex() {
  return (
    <>
      <Meta
        title="Blog — Rakuen Software"
        description="Release notes, design decisions and engineering write-ups from the Rakuen Software team."
      />

      <Hero
        title="Blog"
        subtitle="Release notes, design decisions and engineering write-ups."
      />

      <Section width="narrow">
        {POSTS.length === 0 ? (
          <EmptyState message="No posts yet. Check back soon." icon="📝" />
        ) : (
          POSTS.map((post) => (
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
