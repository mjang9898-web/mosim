/*
 * K-Wellness Concierge — interactive overlay.
 *
 * The original JSX prototypes are static — clicks don't toggle state.
 * This script runs after React mounts and attaches event delegation so
 * the design-system patterns (.kw-segmented, .kw-med, .kw-cul, etc.)
 * behave like real toggles.
 *
 * For data identification, the JSX adds `data-kw-field` / `data-kw-value`
 * attributes; this script reads them so each page knows which field has
 * which value selected.
 */
(function () {
  'use strict';

  // ── Pattern definitions ────────────────────────────────────────
  // single-select: only one item active inside the group (radio-like)
  // multi-select : any number of items active (checkbox-like)
  var PATTERNS = {
    // Segmented button groups — parent .kw-segmented, one child button has .is-active
    segmented: {
      groupSelector: '.kw-segmented',
      itemSelector: 'button',
      activeClass: 'is-active',
      mode: 'single'
    },
    // Medical / Culture / Cuisine cards — toggle each card (multi-select)
    medCard: {
      itemSelector: '.kw-med',
      activeClass: 'is-selected',
      mode: 'multi'
    },
    culCard: {
      itemSelector: '.kw-cul',
      activeClass: 'is-selected',
      mode: 'multi'
    },
    pkgCard: {
      groupSelector: '.kw-pkg-grid',
      itemSelector: '.kw-pkg',
      activeClass: 'is-selected',
      mode: 'single'
    },
    // Page tabs (Heritage / Crafts / Modern, etc.) — single-select
    pageTabs: {
      groupSelector: '.kw-page-tabs',
      itemSelector: 'button',
      activeClass: 'is-active',
      mode: 'single'
    },
    // Allergen / diet grids — multi-select
    chipMulti: {
      itemSelector: '.kw-chip',
      activeClass: 'is-selected',
      mode: 'multi'
    }
  };

  function bindPattern(root, p) {
    if (p.mode === 'single' && p.groupSelector) {
      root.querySelectorAll(p.groupSelector).forEach(function (group) {
        group.addEventListener('click', function (ev) {
          var btn = ev.target.closest(p.itemSelector);
          if (!btn || !group.contains(btn)) return;
          group.querySelectorAll(p.itemSelector).forEach(function (b) {
            b.classList.remove(p.activeClass);
          });
          btn.classList.add(p.activeClass);
        });
      });
    } else if (p.mode === 'multi') {
      // Document-level event delegation — pattern match by selector
      document.addEventListener('click', function (ev) {
        var el = ev.target.closest(p.itemSelector);
        if (!el) return;
        el.classList.toggle(p.activeClass);
      });
    } else if (p.mode === 'single' && !p.groupSelector) {
      // single-select without a group selector — left as a stub for
      // future extension (no current pattern uses this branch).
    }
  }

  function bindAll() {
    Object.keys(PATTERNS).forEach(function (k) {
      bindPattern(document, PATTERNS[k]);
    });
  }

  // ── DOM scrape — collect currently selected values ─────────────
  /**
   * Walks every element carrying a `data-kw-field` attribute and returns
   * an object of { field: value | [values] }:
   *   - single-select with .is-active   -> scalar value
   *   - multi-select  with .is-selected -> array
   *   - <input> / <textarea> / <select> -> .value
   */
  function scrape() {
    var result = {};
    document.querySelectorAll('[data-kw-field]').forEach(function (el) {
      var field = el.dataset.kwField;
      var value = el.dataset.kwValue;

      // input / textarea / select
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        if (el.type === 'checkbox' || el.type === 'radio') {
          if (el.checked) {
            value = el.dataset.kwValue || el.value;
            pushValue(result, field, value, /*multi*/ el.type === 'checkbox');
          }
        } else {
          if (el.value !== '') result[field] = el.value;
        }
        return;
      }

      // Selection state via class names
      var selected = el.classList.contains('is-selected');
      var active = el.classList.contains('is-active');
      var multi = el.dataset.kwMulti === 'true';

      if (selected || active) {
        if (multi) {
          pushValue(result, field, value, true);
        } else {
          result[field] = value;
        }
      }
    });
    return result;
  }

  function pushValue(obj, field, value, multi) {
    if (multi) {
      if (!Array.isArray(obj[field])) obj[field] = [];
      if (obj[field].indexOf(value) === -1) obj[field].push(value);
    } else {
      obj[field] = value;
    }
  }

  // Public surface
  window.kwInteractive = {
    bindAll: bindAll,
    scrape: scrape
  };

  // Bindings must run after React has mounted. Each page's bootstrap
  // script calls kwInteractive.bindAll() right after ReactDOM.createRoot(...).render(...).
})();
