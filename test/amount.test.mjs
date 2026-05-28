import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAmount } from '../api/_lib/amount.js';

test('accepts a valid amount within balance', () => {
  assert.deepEqual(normalizeAmount('2400', 4800), { ok: true, amount: 2400 });
});

test('rounds to cents', () => {
  assert.deepEqual(normalizeAmount(10.005, 4800), { ok: true, amount: 10.01 });
});

test('rejects non-numeric', () => {
  assert.equal(normalizeAmount('abc', 4800).ok, false);
});

test('rejects below $1 minimum', () => {
  assert.equal(normalizeAmount(0.5, 4800).ok, false);
});

test('rejects amount over the remaining balance', () => {
  const r = normalizeAmount(5000, 4800);
  assert.equal(r.ok, false);
  assert.match(r.error, /balance/i);
});

test('accepts paying the exact remaining balance', () => {
  assert.deepEqual(normalizeAmount(4800, 4800), { ok: true, amount: 4800 });
});
