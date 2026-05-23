/*
 * K-Wellness Concierge — AI schedule generator (template-based).
 *
 * Reads per-step selections from sessionStorage and assembles a 7-day
 * itinerary. Currently deterministic templates; to swap in a real backend
 * (Claude API, etc.) make generateSchedule async and replace the body:
 *
 *   // backend example (Vercel / AWS / Netlify Functions)
 *   async function generateSchedule(state) {
 *     const res = await fetch('/api/schedule', {
 *       method: 'POST', body: JSON.stringify(state)
 *     });
 *     return await res.json();
 *   }
 */
(function (global) {
  'use strict';

  // ── Data -> human label mapping ────────────────────────────────
  var MED_LABELS = {
    'dermatology':       'Skin conditioning & IV nutrient drip',
    'aesthetic':         'Aesthetic procedure consultation',
    'oriental':          'Hanbang pulse reading & prescription',
    'wellness':          'Wellness restoration program',
    'checkup':           'Comprehensive health screening',
    'spa':               'Premium spa treatment',
    'mental':            'Meditation & mental restoration'
  };

  var CULTURE_LABELS = {
    'heritage':          'Gyeongbokgung / Changdeokgung hanbok walk',
    'crafts':            'Traditional craft class (hanji · ceramics)',
    'modern':            'Han River night view & K-pop live',
    'tea':               'Traditional tea ceremony',
    'temple':            'Templestay (one night)',
    'royal':             'Royal court ritual viewing',
    'performance':       'Nanta / Jeongdong Theatre performance'
  };

  var CUISINE_LABELS = {
    'hansik':            'Royal-court hanjeongsik tasting (Seoul)',
    'street':            'Gwangjang Market night-food tour',
    'grill':             'Premium hanwoo omakase',
    'finedining':        'Michelin-starred Korean fine dining',
    'drinks':            'Traditional liquor & yakju pairing',
    'packages':          'Curated dining package'
  };

  // ── Main generator ─────────────────────────────────────────────
  function generateSchedule(state) {
    state = state || {};
    var contact = state.contact || {};
    var trip = state.trip || {};
    var medical = state.medical || {};
    var culture = state.culture || {};
    var cuisine = state.cuisine || {};

    var guestName = contact.name ? contact.name.split(' ')[0] : 'Guest';
    var arrival = trip.dates || contact.when || 'TBD';
    var hotel = trip['hotel-tier'] || trip.hotel || 'Heritage hanok';

    // Collect selected items per step (with sensible fallbacks)
    var medItems = collect(medical, MED_LABELS, ['Orientation consultation']);
    var cultureItems = collect(culture, CULTURE_LABELS, ['Gyeongbokgung hanbok walk', 'Bukchon Hanok Village tour']);
    var cuisineItems = collect(cuisine, CUISINE_LABELS, ['Royal-court hanjeongsik tasting', 'Gwangjang Market night tour']);

    var days = [
      {
        day: 1, title: 'Arrival & Welcome',
        items: [
          { time: '14:00', label: 'Incheon Airport pickup — private vehicle' },
          { time: '16:00', label: hotel + ' check-in & welcome tea ceremony' },
          { time: '19:00', label: 'Concierge briefing — week overview' }
        ]
      },
      {
        day: 2, title: 'Medical Diagnostics & Consultation',
        items: [
          { time: '09:00', label: medItems[0] || 'One-on-one consultation with lead physician' },
          { time: '14:00', label: medItems[1] || 'Hanbang pulse reading & constitution analysis' },
          { time: '19:00', label: cuisineItems[0] || 'Dinner — hanjeongsik' }
        ]
      },
      {
        day: 3, title: 'Cultural Immersion — Heritage',
        items: [
          { time: '10:00', label: cultureItems[0] || 'Gyeongbokgung hanbok walk' },
          { time: '14:00', label: cultureItems[1] || 'Bukchon Hanok Village' },
          { time: '19:30', label: cuisineItems[1] || 'Gwangjang Market food tour' }
        ]
      },
      {
        day: 4, title: 'Restoration & Wellness',
        items: [
          { time: '10:00', label: medItems[2] || 'Premium spa treatment' },
          { time: '15:00', label: 'Han River stroll + garden meditation' },
          { time: '19:00', label: 'In-room dining — restorative menu' }
        ]
      },
      {
        day: 5, title: 'Deep Procedure / Experience',
        items: [
          { time: '10:00', label: medItems[3] || 'Focused procedure / care' },
          { time: '14:00', label: cultureItems[2] || 'Traditional craft class' },
          { time: '19:30', label: cuisineItems[2] || 'Hanwoo omakase' }
        ]
      },
      {
        day: 6, title: 'Open Day',
        items: [
          { time: 'Morning', label: 'Free time — hotel lounge / Seoul stroll' },
          { time: '14:00', label: cultureItems[3] || 'National Museum of Korea' },
          { time: '19:00', label: cuisineItems[3] || 'Michelin-starred fine dining' }
        ]
      },
      {
        day: 7, title: 'Closing & Departure',
        items: [
          { time: '10:00', label: 'Closing consultation — aftercare plan handoff' },
          { time: '12:00', label: 'Hotel checkout' },
          { time: '14:00', label: 'Send-off to Incheon Airport — private vehicle' }
        ]
      }
    ];

    return {
      guestName: guestName,
      arrival: arrival,
      hotel: hotel,
      origin: trip.origin || contact.from || '',
      interest: contact.interest || '',
      note: contact.note || '',
      adults: trip.adults || '',
      children: trip.children || '',
      partyType: trip['party-type'] || '',
      travelClass: trip['travel-class'] || '',
      hotelTier: trip['hotel-tier'] || '',
      medicalSelections: medItems,
      cultureSelections: cultureItems,
      cuisineSelections: cuisineItems,
      allergens: arrayify(cuisine.allergens),
      diets: arrayify(cuisine.diets),
      spice: cuisine.spice || '',
      days: days
    };
  }

  // ── Helpers ────────────────────────────────────────────────────
  function collect(stepData, labels, fallback) {
    if (!stepData) return fallback.slice();
    var out = [];
    Object.keys(stepData).forEach(function (k) {
      var v = stepData[k];
      if (Array.isArray(v)) {
        v.forEach(function (val) {
          if (labels[val]) out.push(labels[val]);
          else out.push(prettify(val));
        });
      } else if (typeof v === 'string') {
        if (labels[v]) out.push(labels[v]);
      }
    });
    if (out.length === 0) return fallback.slice();
    return out;
  }

  function arrayify(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return [v];
  }

  function prettify(s) {
    if (!s) return '';
    return String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  global.kwSchedule = { generate: generateSchedule };
})(window);
