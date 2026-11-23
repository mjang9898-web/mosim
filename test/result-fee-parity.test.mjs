// Parity: the fee result.html DISPLAYS must equal what the server CHARGES.
// api/_lib/payment-group.js is the source of truth; browser pages can't import it
// (Vercel serves api/ as functions), so they mirror it. These tests extract the
// browser copies and fail CI on any drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { computeTotal, groupSize, BASE_FEE, BASE_DAYS } from '../api/_lib/payment-group.js';

const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

function loadResultFee() {
  const html = read('result.html');
  const m = html.match(/\/\/ FEE-MIRROR:BEGIN([\s\S]*?)\/\/ FEE-MIRROR:END/);
  assert.ok(m, 'FEE-MIRROR block not found in result.html');
  const ctx = {};
  vm.runInNewContext(m[1] + '\nthis.out = { PER_TRAVELER, BASE_DAYS, feeTotal, feeTravelers };', ctx);
  return ctx.out;
}

test('result.html fee constants equal the server constants', () => {
  const r = loadResultFee();
  assert.equal(r.PER_TRAVELER, BASE_FEE);
  assert.equal(r.BASE_DAYS, BASE_DAYS);
});

test('cockpit.html fee constants equal the server constants', () => {
  const m = read('cockpit.html').match(/const BASE_FEE = (\d+), BASE_DAYS = (\d+);/);
  assert.ok(m, 'cockpit.html BASE_FEE/BASE_DAYS declaration not found');
  assert.equal(Number(m[1]), BASE_FEE);
  assert.equal(Number(m[2]), BASE_DAYS);
});

test('result.html displayed fee === server computeTotal over the full matrix', () => {
  const r = loadResultFee();
  const daySources = [
    ...[3, 5, 7, 10, 14, 16].map((n) => ({ schedule: Array.from({ length: n }, () => ({})), length: '' })),
    ...['under1w', '1to2w', '2plus', 'unsure'].map((length) => ({ schedule: null, length }))
  ];
  const parties = ['solo', 'couple', 'family', 'friends', 'business'];
  let n = 0;
  for (const ds of daySources) {
    for (const travelers of [1, 2, 3, 4, 6]) {
      for (const party of parties) {
        // live step2 shape: partySize = adults + children for every party type
        const state = { trip: { party, partySize: travelers, adults: travelers, children: 0, length: ds.length } };
        const label = `${party} ×${travelers} · ${ds.schedule ? ds.schedule.length + 'd sched' : ds.length}`;
        assert.equal(r.feeTotal(state, ds.schedule), computeTotal(state, ds.schedule), label);
        assert.equal(r.feeTravelers(state), groupSize(state), label);
        n++;
      }
    }
  }
  assert.equal(n, 10 * 5 * 5);
});

test('fallbacks match the server (no partySize, explicit days, empty state)', () => {
  const r = loadResultFee();
  const cases = [
    { trip: { party: 'family', adults: 2, children: 2 } },          // legacy: adults+children
    { trip: { party: 'friends' } },                                 // nothing collected → 1
    { trip: { partySize: 2, days: 10 } },                           // explicit trip.days
    { trip: { partySize: '3', days: '12' } },                       // string inputs
    {},                                                             // empty state → 7d × 1
    null
  ];
  for (const s of cases) {
    assert.equal(r.feeTotal(s, null), computeTotal(s, null), JSON.stringify(s));
    assert.equal(r.feeTotal(s, []), computeTotal(s, []), JSON.stringify(s) + ' []');
  }
});

test('reported mismatch is fixed: 2 people × 10-day plan = $5,428', () => {
  const r = loadResultFee();
  const schedule = Array.from({ length: 10 }, () => ({}));
  assert.equal(r.feeTotal({ trip: { party: 'couple', partySize: 2 } }, schedule), 5428);
});
