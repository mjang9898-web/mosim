// Shared concierge-fee math + create-or-get for payment_groups.
// Single source of truth for the pricing policy ($1,200 per traveler for a 7-day
// trip, prorated to the itinerary's actual day count). Used by:
//   - api/payment-group.js        (owner/admin creates a group, public summary)
//   - api/admin/trip-status.js    (auto-create on 'booked')
import crypto from 'node:crypto';

export const BASE_FEE = 1200;   // concierge fee per traveler for a one-week (7-day) trip
export const BASE_DAYS = 7;     // the fee is prorated from this baseline to the actual trip length

// How many travelers — current planner model is trip.partySize; fall back to the
// legacy adults+children, then 1.
export function groupSize(state) {
  const t = state?.trip || {};
  const ps = parseInt(t.partySize, 10);
  if (Number.isFinite(ps) && ps > 0) return ps;
  const n = (parseInt(t.adults, 10) || 0) + (parseInt(t.children, 10) || 0);
  return n > 0 ? n : 1;
}

// Number of days in the trip. The finalized day-by-day itinerary is the source of
// truth; fall back to the planner's rough length range, then the 7-day base.
export function tripDays(state, schedule) {
  if (Array.isArray(schedule) && schedule.length > 0) return schedule.length;
  const t = state?.trip || {};
  const explicit = parseInt(t.days, 10);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const byRange = { under1w: 5, '1to2w': 10, '2plus': 16 };
  return byRange[t.length] || BASE_DAYS;
}

// $1,200 for a 7-day trip, prorated to the actual number of days, per traveler.
export function perPersonFee(days) {
  return Math.round((BASE_FEE / BASE_DAYS) * days);
}

// Total = per-person fee (by day count) × traveler count.
export function computeTotal(state, schedule, travelersOverride) {
  const people = Number.isFinite(travelersOverride) && travelersOverride > 0
    ? travelersOverride
    : groupSize(state);
  return perPersonFee(tripDays(state, schedule)) * people;
}

// Idempotent create-or-get of the payment_groups row for an itinerary.
// `admin` is a service-role supabase client. Returns:
//   { share_token, total, travelers, created }
// travelers defaults to the funnel party size; pass `travelers` to override.
// `totalOverride` (a positive number) wins over the computed total when given.
export async function ensurePaymentGroup(admin, { itinerary_id, state, schedule, travelers, totalOverride }) {
  const { data: existing } = await admin
    .from('payment_groups')
    .select('share_token, total_amount')
    .eq('itinerary_id', itinerary_id)
    .single();

  const people = Number.isFinite(travelers) && travelers > 0 ? travelers : groupSize(state);

  if (existing) {
    return {
      share_token: existing.share_token,
      total: Number(existing.total_amount),
      travelers: people,
      created: false
    };
  }

  const total = Number.isFinite(totalOverride) && totalOverride > 0
    ? Math.round(totalOverride)
    : computeTotal(state, schedule, people);

  const shareToken = crypto.randomBytes(24).toString('hex');
  const { data, error } = await admin
    .from('payment_groups')
    .insert({ itinerary_id, share_token: shareToken, total_amount: total })
    .select('share_token, total_amount')
    .single();

  if (error) {
    // Lost a concurrent create race — return the winner (idempotent).
    if (error.code === '23505') {
      const { data: winner } = await admin
        .from('payment_groups')
        .select('share_token, total_amount')
        .eq('itinerary_id', itinerary_id)
        .single();
      if (winner) {
        return {
          share_token: winner.share_token,
          total: Number(winner.total_amount),
          travelers: people,
          created: false
        };
      }
    }
    throw error;
  }

  return {
    share_token: data.share_token,
    total: Number(data.total_amount),
    travelers: people,
    created: true
  };
}
