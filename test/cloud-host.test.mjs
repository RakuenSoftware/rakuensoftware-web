import assert from 'node:assert/strict';
import test from 'node:test';
import { isCloudHost } from '../lib/cloud-host.mjs';

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
