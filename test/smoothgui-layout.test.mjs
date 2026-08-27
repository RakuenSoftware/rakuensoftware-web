import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const styles = readFileSync(
  new URL('../node_modules/@rakuensoftware/smoothgui/dist/smoothgui.css', import.meta.url),
  'utf8',
);

test('public heroes do not render a decorative rule', () => {
  assert.doesNotMatch(styles, /\.sg-hero__(?:copy|inner)(?:::|:)before\{/);
});

test('public pages do not render eyebrow subheadings', () => {
  const pages = new URL('../src/pages/', import.meta.url);
  for (const file of readdirSync(pages).filter((name) => name.endsWith('.tsx'))) {
    const source = readFileSync(new URL(file, pages), 'utf8');
    assert.doesNotMatch(source, /\beyebrow\s*=/, file);
  }
});
