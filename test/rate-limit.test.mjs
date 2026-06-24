import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, clientIp, enforceRateLimit, _resetForTest } from '../api/_lib/rate-limit.js';

const OPTS = { key: 'unit', limit: 3, windowMs: 60_000 };

test('allows up to the limit, then blocks', () => {
  _resetForTest();
  const now = 1_000_000;
  for (let i = 1; i <= 3; i++) {
    const r = check('1.1.1.1', OPTS, now);
    assert.equal(r.allowed, true, `request ${i} should pass`);
  }
  const blocked = check('1.1.1.1', OPTS, now);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec > 0 && blocked.retryAfterSec <= 60);
});

test('window resets after it expires', () => {
  _resetForTest();
  const t0 = 5_000_000;
  for (let i = 0; i < 3; i++) check('2.2.2.2', OPTS, t0);
  assert.equal(check('2.2.2.2', OPTS, t0).allowed, false);
  // Past the window → fresh allowance.
  const t1 = t0 + 60_001;
  assert.equal(check('2.2.2.2', OPTS, t1).allowed, true);
});

test('different IPs have independent buckets', () => {
  _resetForTest();
  const now = 9_000_000;
  for (let i = 0; i < 3; i++) check('3.3.3.3', OPTS, now);
  assert.equal(check('3.3.3.3', OPTS, now).allowed, false);
  // A different IP is unaffected.
  assert.equal(check('4.4.4.4', OPTS, now).allowed, true);
});

test('different keys (endpoints) are independent for the same IP', () => {
  _resetForTest();
  const now = 11_000_000;
  for (let i = 0; i < 3; i++) check('5.5.5.5', { key: 'a', limit: 3, windowMs: 60_000 }, now);
  assert.equal(check('5.5.5.5', { key: 'a', limit: 3, windowMs: 60_000 }, now).allowed, false);
  assert.equal(check('5.5.5.5', { key: 'b', limit: 3, windowMs: 60_000 }, now).allowed, true);
});

test('clientIp takes the first x-forwarded-for entry', () => {
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1, 10.0.0.2' } }), '9.9.9.9');
  assert.equal(clientIp({ headers: { 'x-real-ip': '8.8.8.8' } }), '8.8.8.8');
  assert.equal(clientIp({ headers: {} }), 'unknown');
});

test('enforceRateLimit returns false and sends nothing while under limit', () => {
  _resetForTest();
  const sent = {};
  const res = mkRes(sent);
  const req = { headers: { 'x-forwarded-for': '6.6.6.6' } };
  const blocked = enforceRateLimit(req, res, OPTS);
  assert.equal(blocked, false);
  assert.equal(sent.status, undefined);
});

test('enforceRateLimit sends 429 + Retry-After when over limit', () => {
  _resetForTest();
  const req = { headers: { 'x-forwarded-for': '7.7.7.7' } };
  // exhaust
  for (let i = 0; i < 3; i++) enforceRateLimit(req, mkRes({}), OPTS);
  const sent = {};
  const blocked = enforceRateLimit(req, mkRes(sent), OPTS);
  assert.equal(blocked, true);
  assert.equal(sent.status, 429);
  assert.ok(Number(sent.headers['Retry-After']) > 0);
  assert.match(sent.body.message, /try again/i);
  assert.equal(sent.body.error, 'Too many requests');
});

test('enforceRateLimit fails OPEN if check throws (funnel must never break)', () => {
  // A req that makes clientIp throw inside enforce → should be swallowed → false.
  const badReq = { get headers() { throw new Error('boom'); } };
  const sent = {};
  const blocked = enforceRateLimit(badReq, mkRes(sent), OPTS);
  assert.equal(blocked, false);
  assert.equal(sent.status, undefined);
});

function mkRes(sent) {
  sent.headers = sent.headers || {};
  return {
    setHeader(k, v) { sent.headers[k] = v; },
    status(code) { sent.status = code; return this; },
    json(obj) { sent.body = obj; return this; }
  };
}
