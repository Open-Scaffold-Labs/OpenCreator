'use strict';

/**
 * Production refuses a missing JWT_SECRET and known development values,
 * including the placeholder in server/.env.example. Local dev keeps the
 * historical fallback when JWT_SECRET is unset.
 */

const DEV_JWT_SECRET = 'your-secret-key';
const KNOWN_DEV = new Set([
  DEV_JWT_SECRET,
  'change-me-to-a-long-random-string',
]);

function jwtSecret(env) {
  const e = env || process.env;
  const value = typeof e.JWT_SECRET === 'string' ? e.JWT_SECRET.trim() : '';
  if (e.NODE_ENV === 'production') {
    if (!value || KNOWN_DEV.has(value)) {
      const message = 'STARTUP ERROR: JWT_SECRET is missing or is a known development value. Refusing to start while NODE_ENV=production. Set a unique secret (see server/.env.example) before deploy.';
      console.error(message);
      const err = new Error(message);
      err.code = 'INSECURE_JWT_SECRET';
      throw err;
    }
    return value;
  }
  return value || DEV_JWT_SECRET;
}

function assertProductionJwtSecret(env) {
  jwtSecret(env);
}

module.exports = { DEV_JWT_SECRET, jwtSecret, assertProductionJwtSecret };
