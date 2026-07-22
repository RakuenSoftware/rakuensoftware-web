import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { validatePost } from './src/lib/frontmatter';

const BLOG_DIR = 'src/content/blog';

/**
 * Fails the build when a blog post has unusable frontmatter. Without this the
 * posts module would only discover the problem in the browser, where the reader
 * gets a missing post instead of the author getting an error.
 */
function checkPosts(): Plugin {
  return {
    name: 'check-posts',
    buildStart() {
      const problems: string[] = [];
      for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))) {
        const raw = readFileSync(join(BLOG_DIR, file), 'utf8');
        for (const problem of validatePost(raw)) {
          problems.push(`  ${file}: ${problem}`);
        }
      }
      if (problems.length > 0) {
        this.error(`Invalid blog frontmatter:\n${problems.join('\n')}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), checkPosts()],
});
