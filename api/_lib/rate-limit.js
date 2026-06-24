// Lightweight, zero-cost, in-memory rate limiter for the Vercel serverless API.
//
// WHY in-memory (not a Supabase counter table):
//   - $0 and zero external dependency — no DB schema change, no extra round-trip,
//     no risk to the sacred funnel (a DB hiccup can never block a real customer).
//   - LIMITATION (documented, intentional): Vercel runs each function as one or
//     more isolated serverless instances. This Map lives per warm instance, so the
//     effective limit is per-instance, not strictly global. Under fan-out an
//     attacker hitting many cold instances could exceed the nominal limit. That is
//     acceptable here: this is a courtesy throttle to blunt rapid hammering of the
//     paid Claude endpoint and brute-force on sensitive endpoints, NOT a hard
//     security boundary. Thresholds are generous so a normal 1-pass funnel and
//     normal payment flows NEVER hit the limit. If real abuse appears, swap this
//     module's `check()` for a Supabase-counter-backed version (see
//     mosim-backend-conventions) — endpoints call only `enforceRateLimit`, so the
//     storage backend can change without touching any handler.
//
// Usage in an endpoint (place BEFORE any real work, right after the method gate):
//   import { enforceRateLimit } from './_lib/rate-limit.js';
//   if (enforceRateLimit(req, res, { key: 'schedule', limit: 5, windowMs: 5*60*1000 })) return;
// When it returns true it has already sent a 429 (+ Retry-After). On false, proceed.

// bucketKey -> { count, resetAt(ms epoch) }
const buckets = new Map();

// Opportunistic sweep so the Map can't grow unbounded on a long-lived warm
// instance. Cheap: only runs occasionally and only deletes expired windows.
let lastSweep = 0;
function sweep(now) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

// Best-effort client IP. Vercel sets x-forwarded-for to "client, proxy1, ...";
// the FIRST entry is the real client. Falls back to a constant so a missing
// header degrades to a shared bucket (fails safe-ish) rather than throwing.
export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return real.trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Pure check (no res). Returns { allowed, remaining, retryAfterSec }.
// Exported so it can be unit-tested with node:test without a fake res.
export function check(ip, { key, limit, windowMs }, now = Date.now()) {
  sweep(now);
  const bucketKey = key + ':' + ip;
  let b = buckets.get(bucketKey);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(bucketKey, b);
  }
  b.count += 1;
  if (b.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  return { allowed: true, remaining: limit - b.count, retryAfterSec: 0 };
}

// Express/Vercel guard. On limit: writes a 429 + Retry-After + friendly JSON and
// returns true (caller must `return`). Otherwise returns false (proceed).
// Never throws — a limiter bug must never break a real request.
export function enforceRateLimit(req, res, opts) {
  try {
    const ip = clientIp(req);
    const r = check(ip, opts);
    if (!r.allowed) {
      res.setHeader('Retry-After', String(r.retryAfterSec));
      res.status(429).json({
        error: 'Too many requests',
        message: "You're going a little fast. Please wait a moment and try again — your information is safe.",
        retryAfter: r.retryAfterSec
      });
      return true;
    }
  } catch (e) {
    // Fail OPEN: if the limiter errors, let the request through. The funnel must
    // never break because of a throttle.
    console.error('[rate-limit] check failed (allowing request):', e?.message || e);
  }
  return false;
}

// Test-only: reset internal state between unit tests.
export function _resetForTest() {
  buckets.clear();
  lastSweep = 0;
}
