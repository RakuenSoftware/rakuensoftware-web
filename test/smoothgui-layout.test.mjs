import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const styles = readFileSync(
  new URL('../node_modules/@rakuensoftware/smoothgui/dist/smoothgui.css', import.meta.url),
  'utf8',
);

test('the split hero accent stays inside the copy grid cell', () => {
  assert.match(styles, /\.sg-hero__copy(?:::|:)before\{/);
  assert.doesNotMatch(styles, /\.sg-hero__inner(?:::|:)before\{/);
});
