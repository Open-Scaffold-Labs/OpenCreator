'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { jwtSecret, DEV_JWT_SECRET } = require('./jwtSecret');

describe('jwtSecret', () => {
  it('falls back in development', () => {
    assert.equal(jwtSecret({}), DEV_JWT_SECRET);
  });

  it('refuses a missing, fallback, or example secret in production', () => {
    assert.throws(() => jwtSecret({ NODE_ENV: 'production' }), /STARTUP ERROR/);
    assert.throws(() => jwtSecret({ NODE_ENV: 'production', JWT_SECRET: DEV_JWT_SECRET }), /known development value/);
    assert.throws(
      () => jwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'change-me-to-a-long-random-string' }),
      /known development value/,
    );
  });

  it('accepts a unique production secret', () => {
    assert.equal(
      jwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'a-unique-production-secret' }),
      'a-unique-production-secret',
    );
  });
});
