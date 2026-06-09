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

  // Step 3 · Experiences — culture card code -> human label (each card's name
  // from js/step3-culture.jsx CULTURE_PAGES). Selections persist as an array
  // of these codes in state.experiences.
  var CULTURE_LABELS = {
    // Heritage
    'gyeongbokgung':     'Korean Royal Palace Tour',
    'changdeokgung':     'Royal Garden Palace Visit',
    'deoksugung':        'Evening Lantern Palace Walk',
    'changgyeonggung':   'Moonlit Palace Night Opening',
    'jongmyo':           'Royal Ancestral Shrine',
    'huwon':             "The King's Secret Garden Walk",
    'bukchon':           'Traditional Hanok Village Stroll',
    'bongeunsa':         'City Mountain Temple Visit',
    'jogyesa':           'Flower Lantern Temple Visit',
    'haeinsa':           'Tripitaka Templestay Overnight',
    'meditation':        'Buddhist Meditation Session',
    'tea':               'Private Tea Ceremony',
    'calligraphy':       'Brush Calligraphy with Master',
    'hanbok':            'Royal Dress Fitting & Photoshoot',
    'royalcuisine':      'Royal Court Cuisine Tasting',
    'nationalmuseum':    'National History Museum',
    'warmemorial':       'War Memorial & Monument',
    'cheonggye':         'Cheonggyecheon Stream Walk',
    // Shop
    'seongsu':           'Brooklyn-of-Seoul Café & Boutique Walk',
    'myeongdong':        'Main Shopping Street & K-Beauty',
    'apgujeong':         'Designer Luxury Boutique Row',
    'coex':              'Starfield Library & Mega Mall',
    'garosugil':         'Tree-lined Boutique Avenue',
    'hongdae':           'Youth Street Fashion Quarter',
    'ikseondong':        'Hanok Alleys, Cafés & Boutiques',
    'gwangjang':         'Traditional Street Food Market',
    'namdaemun':         'Largest Night Market',
    'ddp':               'Modern Design Plaza & Shopping',
    'ddm':               'Midnight Fashion Wholesale',
    'kbeauty':           'K-Beauty Flagship Tour',
    'insadong':          'Traditional Craft & Antique Lanes',
    'hannam':            'Boutique Gallery & Concept Row',
    'commonground':      'Container Market & Pop-ups',
    'taxfree':           'Tax-Free Designer Outlet Day',
    // Famous
    'baseball':          'KBO Baseball with Private Box',
    'golf':              'Signature Golf Course Round',
    'kpop-concert':      'K-Pop Concert with VIP Access',
    'hybe':              'K-Pop Label Studio Tour',
    'smtown':            'K-Pop Artists Museum',
    'kpop-class':        'K-Pop Dance Class',
    'namsan-tower':      'N Seoul Tower at Sunset',
    'lotte':             'Skyscraper SkyDeck at Sunset',
    'hanriver-yacht':    'Han River Sunset Yacht Cruise',
    'hanriver':          'Han River Sunrise Kayak',
    'forestbath':        'Mountain Forest Bathing',
    'dmz':               'Border Zone Private Tour',
    'royalmusic':        'Royal Court Music Recital',
    'bboy':              'B-Boy Showcase in Hongdae',
    'nanta':             'Non-Verbal Drum Show',
    'pansori':           'Korean Epic Vocal Performance',
    // Beyond Seoul
    'jeju':              'Jeju Island',
    'busan':             'Busan',
    'gyeongju':          'Gyeongju',
    'jeonju':            'Jeonju',
    'gangwon':           'Gangwon-do',
    'incheon':           'Incheon'
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
    // Step 3 · Experiences — an array of culture card codes (state.experiences).
    var experiences = Array.isArray(state.experiences) ? state.experiences : [];
    var cuisine = state.cuisine || {};

    var guestName = contact.name ? contact.name.split(' ')[0] : 'Guest';
    var arrival = trip.dates || contact.when || 'TBD';
    var hotel = trip['hotel-tier'] || trip.hotel || 'Heritage hanok';

    // Collect selected items per step (with sensible fallbacks)
    var medItems = collect(medical, MED_LABELS, ['Orientation consultation']);
    var cultureItems = collect(experiences, CULTURE_LABELS, ['Korean Royal Palace Tour', 'Traditional Hanok Village Stroll']);
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
    // Array of codes (e.g. Step 3 experiences): map each code -> label.
    if (Array.isArray(stepData)) {
      stepData.forEach(function (code) {
        if (labels[code]) out.push(labels[code]);
        else if (code) out.push(prettify(code));
      });
      if (out.length === 0) return fallback.slice();
      return out;
    }
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
