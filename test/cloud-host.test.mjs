import assert from 'node:assert/strict';
import test from 'node:test';
import { AIMEE_CLOUD_URL, aimeeCloudHref, isCloudHost } from '../lib/cloud-host.mjs';

test('the aimee hosts present the cloud page', () => {
  for (const host of [
    'aimee.rakuensoftware.com',
    'aimee.rakuensoft.com',
    'AIMEE.rakuensoftware.com',
    'aimee.localhost',
  ]) {
    assert.equal(isCloudHost(host), true, `${host} should be a cloud host`);
  }
});

test('every other host shows the company site', () => {
  for (const host of [
    'rakuensoftware.com',
    'www.rakuensoftware.com',
    'rakuensoft.com',
    'ackmud.com',
    'bailes.us',
    'localhost',
    '127.0.0.1',
  ]) {
    assert.equal(isCloudHost(host), false, `${host} should not be a cloud host`);
  }
});

// A substring match would claim hosts that merely contain the word, including
// one an attacker could register.
test('a name that only contains "aimee" is not a cloud host', () => {
  for (const host of [
    'notaimee.rakuensoftware.com',
    'myaimee.com',
    'aimeetings.example.com',
    'evil-aimee.example.com',
  ]) {
    assert.equal(isCloudHost(host), false, `${host} should not be a cloud host`);
  }
});

test('missing or malformed input is not a cloud host', () => {
  for (const host of ['', null, undefined, 42, {}]) {
    assert.equal(isCloudHost(host), false);
  }
});

test('a link to aimee cloud crosses hosts from the company site', () => {
  for (const host of ['rakuensoftware.com', 'www.rakuensoftware.com', 'rakuensoft.com']) {
    assert.equal(aimeeCloudHref(host), AIMEE_CLOUD_URL, `${host} should link out`);
  }
});

test('a link to aimee cloud stays in-app on the cloud host', () => {
  /* Otherwise the header link on aimee.rakuensoftware.com is a full page load
   * back to the page the reader is already standing on. */
  for (const host of ['aimee.rakuensoftware.com', 'aimee.rakuensoft.com', 'aimee.localhost']) {
    assert.equal(aimeeCloudHref(host), '/', `${host} should stay in-app`);
  }
});

test('the cloud address is absolute and on the canonical host', () => {
  assert.equal(AIMEE_CLOUD_URL, 'https://aimee.rakuensoftware.com');
  assert.equal(isCloudHost(new URL(AIMEE_CLOUD_URL).hostname), true);
});

test('an unusable hostname still yields a working link', () => {
  /* aimeeCloudHref runs on a hostname read from the browser; if that is ever
   * empty or absent the link must still go somewhere real. */
  for (const host of ['', undefined, null, 42]) {
    assert.equal(aimeeCloudHref(host), AIMEE_CLOUD_URL);
  }
});
