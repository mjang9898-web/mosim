// Pure validation for a single payment amount against a remaining balance.
// No I/O — unit tested in test/amount.test.mjs.

export function normalizeAmount(input, balance) {
  const amt = Number(input);
  if (!Number.isFinite(amt)) return { ok: false, error: 'Amount must be a number' };
  const rounded = Math.round(amt * 100) / 100;
  if (rounded < 1) return { ok: false, error: 'Minimum payment is $1' };
  if (rounded > balance) return { ok: false, error: 'Amount exceeds remaining balance' };
  return { ok: true, amount: rounded };
}
