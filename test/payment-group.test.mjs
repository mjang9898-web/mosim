import { test } from 'node:test';
import assert from 'node:assert/strict';
import { perPersonFee, computeTotal, BASE_FEE, BASE_DAYS } from '../api/_lib/payment-group.js';

test('base fee is $1,900 per traveler for a 7-day trip', () => {
  assert.equal(BASE_FEE, 1900);
  assert.equal(BASE_DAYS, 7);
});

test('perPersonFee prorates from the 7-day base', () => {
  assert.equal(perPersonFee(7), 1900);
  assert.equal(perPersonFee(5), 1357);
  assert.equal(perPersonFee(10), 2714);
  assert.equal(perPersonFee(16), 4343);
});

test('computeTotal = per-person fee × travelers', () => {
  const state = { trip: { partySize: 2 } };
  const schedule = Array.from({ length: 7 }, () => ({}));
  assert.equal(computeTotal(state, schedule), 3800);
  assert.equal(computeTotal({ trip: { days: 7 } }, null, 2), 3800);
});
