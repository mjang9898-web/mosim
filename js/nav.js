/*
 * K-Wellness Concierge — page navigation.
 *
 * Wires up the Continue / Back buttons on each step page. On Continue
 * it scrapes the current DOM selection state and persists it to
 * sessionStorage before navigating.
 */
(function () {
  'use strict';

  /** Move from the current step to the next page.
   *  step: 'trip' | 'medical' | 'culture' | 'cuisine'
   *  nextHref: destination page
   */
  function attachNavigation(step, nextHref, backHref) {
    // Buttons appear after React renders, so retry briefly until present.
    function tryAttach(attempt) {
      var continueBtn = findContinueButton();
      var backBtn = findBackButton();

      if (!continueBtn && attempt < 40) {
        setTimeout(function () { tryAttach(attempt + 1); }, 100);
        return;
      }

      if (continueBtn) {
        continueBtn.style.cursor = 'pointer';
        continueBtn.addEventListener('click', function (ev) {
          ev.preventDefault();
          var data = window.kwInteractive ? window.kwInteractive.scrape() : {};
          if (window.kwState) window.kwState.saveStep(step, data);
          window.location.href = nextHref;
        });
      } else {
        console.warn('[kw.nav] Continue button not found for step:', step);
      }

      if (backBtn && backHref) {
        backBtn.style.cursor = 'pointer';
        backBtn.addEventListener('click', function (ev) {
          ev.preventDefault();
          window.location.href = backHref;
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { tryAttach(0); });
    } else {
      tryAttach(0);
    }
  }

  /**
   * Locate the Continue / Submit / Generate button:
   * - inside .kw-actionbar, of class .kw-cta-lg (rightmost CTA)
   * - text containing "Continue", "Submit", "Compose", "Finish", or "Generate"
   */
  function findContinueButton() {
    var candidates = document.querySelectorAll('.kw-actionbar .kw-cta-lg, .kw-actionbar button.kw-cta');
    for (var i = 0; i < candidates.length; i++) {
      var t = (candidates[i].textContent || '').trim().toLowerCase();
      if (t.indexOf('continue') !== -1 || t.indexOf('submit') !== -1 || t.indexOf('compose') !== -1 || t.indexOf('finish') !== -1 || t.indexOf('generate') !== -1) {
        return candidates[i];
      }
    }
    // fallback — the last .kw-cta-lg in the action bar
    if (candidates.length > 0) return candidates[candidates.length - 1];
    return null;
  }

  function findBackButton() {
    var candidates = document.querySelectorAll('.kw-actionbar .kw-cta-ghost, .kw-actionbar .kw-cta-sm');
    for (var i = 0; i < candidates.length; i++) {
      var t = (candidates[i].textContent || '').trim().toLowerCase();
      if (t.indexOf('back') !== -1 || t.indexOf('←') !== -1) return candidates[i];
    }
    return null;
  }

  window.kwNav = { attach: attachNavigation };
})();
