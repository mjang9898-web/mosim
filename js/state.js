/*
 * K-Wellness Concierge — client-side state store.
 *
 * Per-step data kept in sessionStorage. To move to a real backend / DB,
 * keep the public function signatures in this file unchanged and replace
 * the internals with fetch() calls.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'kw.state.v1';

  var DEFAULT_STATE = {
    contact: null, // { name, email, from, when, interest, note }
    trip: null,    // step 1 selections
    medical: null, // step 2 selections
    culture: null, // step 3 selections
    cuisine: null  // step 4 selections
  };

  function read() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_STATE);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_STATE, parsed);
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
