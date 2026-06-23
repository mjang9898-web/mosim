/*
 * K-Wellness Concierge — client-side state store.
 *
 * Per-step data kept in sessionStorage. To move to a real backend / DB,
 * keep the public function signatures in this file unchanged and replace
 * the internals with fetch() calls.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mosim.state.v1';

  // Planner funnel data model — see docs/superpowers/specs/2026-06-01-planner-funnel-design.md
  var DEFAULT_STATE = {
    // Step 1 · Care.  needs: ['screening','knees','dental','eyes','derm','hanbang','hair','aesthetic','plastic','stemcell','unsure']
    // note: client-side ONLY — must NOT be persisted to the DB (privacy promise).
    care: { needs: [], note: '' },
    // Step 2 · Trip
    trip: {
      when: { mode: 'flexible', dates: { start: null, end: null }, season: '' }, // mode:'dates'|'flexible'
      length: '',      // 'under1w'|'1to2w'|'2plus'|'unsure'
      party: '',       // 'solo'|'couple'|'family'
      partySize: 1,
      stay: '',        // 'cozy'|'comfort'|'premium'
      arrival: 'ICN'   // constant — not asked
    },
    // Step 3 · Experiences — array of culture card codes, e.g.
    // ['gyeongbokgung','bukchon','tea','jeju'].  See js/step3-culture.jsx CULTURE_PAGES.
    experiences: [],
    // Step 4 · Taste & comfort — merged Comfort + Cuisine (절충안 C, funnel 5→4).
    //   items:     array of FB_PAGES dish codes (see js/step4-cuisine.jsx)
    //   allergens: array of ALLERGENS codes
    //   diets:     array of DIETS codes (diet / religion / lifestyle)
    //   spice:     a single SPICE_LEVELS code ('none'|'mild'|'medium'|'spicy'|'extra') or null
    //   notes:     free-text note for the kitchen / concierge
    // NOTE: pace/mobility are RETIRED. They used to live on the old `comfort` slice,
    // then briefly on `cuisine` (절충안 C). Neither is collected, written, or read
    // anymore (the brief/recap no longer use them). read() only guarantees it never
    // throws on an old saved state that still carries those fields.
    cuisine: { items: [], allergens: [], diets: [], spice: null, notes: '' }
  };

  function read() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_STATE);
      var parsed = JSON.parse(raw);
      var s = Object.assign({}, DEFAULT_STATE, parsed);
      // Ensure cuisine carries the current shape even for older stored states.
      // Object.assign merges any legacy cuisine fields (incl. retired pace/mobility)
      // harmlessly — they're simply ignored downstream. Never throw on old data.
      s.cuisine = Object.assign({}, DEFAULT_STATE.cuisine, parsed.cuisine || {});
      // Backward-compat: an old session may carry a legacy `comfort` slice.
      // pace/mobility are retired, so we no longer absorb them — but keep the raw
      // slice around so nothing downstream that defensively reads it explodes.
      if (parsed.comfort && typeof parsed.comfort === 'object') {
        s.comfort = parsed.comfort;
      }
      return s;
    } catch (e) {
      console.warn('[kw.state] failed to read state, resetting', e);
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  function write(next) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[kw.state] failed to write state', e);
    }
  }

  /** Replace one step's slice of state. */
  function saveStep(stepKey, data) {
    var s = read();
    s[stepKey] = data;
    write(s);
  }

  /** Return the full state (snapshot copy). */
  function loadAll() {
    return read();
  }

  function loadStep(stepKey) {
    return read()[stepKey] || null;
  }

  function clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  global.kwState = {
    saveStep: saveStep,
    loadAll: loadAll,
    loadStep: loadStep,
    clear: clear
  };
})(window);
