// Universal payment + share page. No login required.
(function () {
  const token = new URLSearchParams(location.search).get('g');
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Consent gate — the pay buttons stay blocked until the terms box is ticked.
  const consented = () => { const c = $('consent'); return !c || c.checked; };
  function warnConsent() {
    $('msg').style.color = '#a00';
    $('msg').textContent = 'Please agree to the terms to continue.';
    const c = $('consent'); if (c) c.focus();
  }

  function showError(text) {
    $('error').textContent = text;
    $('error').style.display = 'block';
    $('summary').style.display = 'none';
    $('trip').style.display = 'none';
  }

  async function loadSummary() {
    const r = await fetch('/api/payment-group?token=' + encodeURIComponent(token));
    if (!r.ok) throw new Error('not found');
    return r.json();
  }

  function render(s) {
    $('trip').textContent = s.title + ' · ' + (s.days ? s.days + '-day trip · ' : '') + s.people + (s.people === 1 ? ' traveler' : ' travelers');
    if ($('basis') && s.perPerson) {
      $('basis').textContent = fmt(s.perPerson) + ' per traveler' + (s.days ? ' · ' + s.days + ' days, prorated from a $1,200 week' : '');
    }
    $('total').textContent = fmt(s.total);
    $('paid').textContent = fmt(s.paid);
    $('balance').textContent = fmt(s.balance);
    $('summary').style.display = 'block';
    const amt = $('amount');
    amt.value = s.balance.toFixed(2);
    amt.max = s.balance.toFixed(2);
    if (s.balance <= 0 || s.status === 'paid') {
      $('payArea').style.display = 'none';
      $('paidArea').style.display = 'block';
    }
  }

  function loadPayPalSdk(clientId) {
    return new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      // components=buttons,card-fields → enables both the wallet button and the
      // Advanced (inline) Card Fields. card-fields only renders if the account is eligible.
      sc.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(clientId)
        + '&currency=USD&components=buttons,card-fields';
      sc.onload = resolve; sc.onerror = reject;
      document.head.appendChild(sc);
    });
  }

  // ── shared validation + order/capture (one source for buttons AND card fields) ──
  function validAmount(msgEl) {
    const amt = parseFloat($('amount').value);
    const max = parseFloat($('amount').max);
    if (!amt || amt <= 0 || amt > max) {
      msgEl.style.color = '#a00';
      msgEl.textContent = 'Enter an amount between $0.01 and ' + fmt(max) + '.';
      return false;
    }
    return true;
  }

  async function createOrderReq() {
    $('msg').textContent = '';
    const r = await fetch('/api/paypal-order', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'create', token, amount: $('amount').value })
    });
    const b = await r.json();
    if (!r.ok) { $('msg').style.color = '#a00'; $('msg').textContent = b.error || 'Could not start payment'; throw new Error(b.error || 'create failed'); }
    return b.orderID;
  }

  // Captures, then refreshes the on-screen summary. Returns the capture body so
  // callers (card button) can re-enable themselves on a partial payment.
  async function captureAndRender(orderID) {
    const r = await fetch('/api/paypal-order', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'capture', token, orderID })
    });
    const b = await r.json();
    if (!r.ok) { $('msg').style.color = '#a00'; $('msg').textContent = b.error || 'Payment failed'; return b; }
    try {
      render(await loadSummary());              // authoritative — preserves title & people
    } catch (_) {
      $('total').textContent = fmt(b.total); $('paid').textContent = fmt(b.paid); $('balance').textContent = fmt(b.balance);
      if (b.status === 'paid' || b.balance <= 0) { $('payArea').style.display = 'none'; $('paidArea').style.display = 'block'; }
    }
    $('msg').style.color = '#0a6';
    $('msg').textContent = b.status === 'paid' ? 'Fully paid ✓ Thank you!' : 'Payment received ✓';
    return b;
  }

  function mountButtons() {
    window.paypal.Buttons({
      onClick: (data, actions) => {
        if (!consented()) { warnConsent(); return actions.reject(); }
        return actions.resolve();
      },
      createOrder: async () => {
        if (!consented()) { warnConsent(); throw new Error('consent required'); }
        if (!validAmount($('msg'))) throw new Error('invalid amount');
        return createOrderReq();
      },
      onApprove: async (data) => { await captureAndRender(data.orderID); },
      onError: () => { $('msg').style.color = '#a00'; $('msg').textContent = 'PayPal error — please try again.'; }
    }).render('#paypal-buttons').catch((e) => {
      console.error('paypal mount', e);
      $('msg').style.color = '#a00';
      $('msg').textContent = 'Could not load PayPal. Please reload.';
    });
  }

  // Advanced (inline) Card Fields — Visa/MC/Amex/Discover. Renders ONLY if the
  // PayPal account is eligible for Advanced Card Payments; otherwise the whole
  // card section stays hidden and the PayPal button alone carries the page.
  function mountCardFields() {
    const section = $('card-section');
    if (!section || !window.paypal || typeof window.paypal.CardFields !== 'function') return;
    const cardStyle = {
      input: { 'font-size': '19px', 'font-family': 'Inter, -apple-system, system-ui, sans-serif', color: '#1B2A4A' },
      '.invalid': { color: '#A4452F' },
      ':focus': { color: '#1B2A4A' }
    };
    let cardField;
    try {
      cardField = window.paypal.CardFields({
        style: cardStyle,
        createOrder: createOrderReq,
        // 3DS / Strong Customer Auth is handled by the SDK during submit(); onApprove
        // only fires once liability is resolved → we capture only on success.
        onApprove: async (data) => {
          const b = await captureAndRender(data.orderID);
          const btn = $('card-submit');
          if (btn && !(b && (b.status === 'paid' || b.balance <= 0))) { btn.disabled = false; btn.textContent = 'Pay with card'; }
        },
        onError: (err) => {
          console.error('[pay] card-fields error', err);
          $('card-msg').style.color = '#a00';
          $('card-msg').textContent = 'We couldn’t complete that card payment. Please re-check the details, or use the PayPal button above.';
          const btn = $('card-submit'); if (btn) { btn.disabled = false; btn.textContent = 'Pay with card'; }
        }
      });
    } catch (e) {
      console.error('[pay] CardFields init failed', e);
      section.style.display = 'none';
      return;
    }

    // Eligibility gate: a sandbox/live account without Advanced Card Payments
    // approval is NOT eligible → hide cleanly (no console errors, button still works).
    if (!cardField.isEligible || !cardField.isEligible()) {
      section.style.display = 'none';
      console.info('[pay] Advanced Card Fields not eligible for this PayPal account — inline card form hidden; PayPal button remains active.');
      return;
    }

    try {
      cardField.NameField().render('#card-name');
      cardField.NumberField().render('#card-number');
      cardField.ExpiryField().render('#card-expiry');
      cardField.CVVField().render('#card-cvv');
    } catch (e) {
      console.error('[pay] card field render failed', e);
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    const btn = $('card-submit');
    btn.addEventListener('click', () => {
      $('card-msg').textContent = '';
      if (!consented()) { warnConsent(); return; }
      if (!validAmount($('card-msg'))) return;
      btn.disabled = true; btn.textContent = 'Processing…';
      cardField.submit().catch((err) => {
        console.error('[pay] card submit', err);
        $('card-msg').style.color = '#a00';
        $('card-msg').textContent = 'That card couldn’t be processed. Please check the number, expiry and code — or use the PayPal button above.';
        btn.disabled = false; btn.textContent = 'Pay with card';
      });
    });
  }

  // Test mode: a single "Pay (test)" button that records the payment without PayPal.
  function mountMockButton() {
    const host = $('paypal-buttons');
    const note = document.createElement('div');
    note.style.cssText = 'font-size:14px;color:#8A8479;margin-bottom:10px;';
    note.textContent = 'Test mode — no real payment is taken.';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Pay (test)';
    btn.style.cssText = 'width:100%;font-size:18px;font-weight:600;padding:14px;border:0;border-radius:10px;background:#1B2A4A;color:#fff;cursor:pointer;min-height:48px;';
    btn.addEventListener('click', async () => {
      $('msg').textContent = '';
      if (!consented()) { warnConsent(); return; }
      const amt = parseFloat($('amount').value);
      const max = parseFloat($('amount').max);
      if (!amt || amt <= 0 || amt > max) {
        $('msg').style.color = '#a00';
        $('msg').textContent = 'Enter an amount between $0.01 and ' + fmt(max) + '.';
        return;
      }
      btn.disabled = true; btn.textContent = 'Processing…';
      try {
        const r = await fetch('/api/paypal-order', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'mock-pay', token, amount: $('amount').value })
        });
        const b = await r.json();
        if (!r.ok) {
          $('msg').style.color = '#a00'; $('msg').textContent = b.error || 'Test payment failed';
          btn.disabled = false; btn.textContent = 'Pay (test)'; return;
        }
        try {
          render(await loadSummary());
        } catch (_) {
          $('total').textContent = fmt(b.total); $('paid').textContent = fmt(b.paid); $('balance').textContent = fmt(b.balance);
          if (b.status === 'paid' || b.balance <= 0) { $('payArea').style.display = 'none'; $('paidArea').style.display = 'block'; }
        }
        $('msg').style.color = '#0a6';
        $('msg').textContent = b.status === 'paid' ? 'Fully paid ✓ (test)' : 'Test payment received ✓';
        if (!(b.status === 'paid' || b.balance <= 0)) { btn.disabled = false; btn.textContent = 'Pay (test)'; }
      } catch (e) {
        $('msg').style.color = '#a00'; $('msg').textContent = 'Test payment error.';
        btn.disabled = false; btn.textContent = 'Pay (test)';
      }
    });
    host.appendChild(note);
    host.appendChild(btn);
  }

  $('copyBtn') && $('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(location.href)
      .then(() => { $('copyBtn').textContent = 'Link copied ✓'; })
      .catch(() => { $('copyBtn').textContent = 'Copy failed — copy manually'; })
      .finally(() => setTimeout(() => { $('copyBtn').textContent = 'Copy payment link'; }, 2000));
  });

  // Email this payment link to a companion.
  const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  async function sendCompanionEmail() {
    const input = $('companionEmail');
    const msg = $('emailMsg');
    const btn = $('emailBtn');
    const email = (input.value || '').trim();
    if (!validEmail(email)) {
      msg.style.color = '#a00';
      msg.textContent = 'Please enter a valid email address.';
      input.focus();
      return;
    }
    btn.disabled = true; btn.textContent = 'Sending…'; msg.textContent = '';
    try {
      const r = await fetch('/api/payment-group', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: token, companion_email: email })
      });
      const b = await r.json().catch(() => ({}));
      if (r.ok && b.ok) {
        msg.style.color = '#0a6';
        msg.textContent = 'Sent ✓ — we emailed the payment link to ' + email + '.';
        input.value = '';
      } else {
        msg.style.color = '#a00';
        msg.textContent = b.error || 'Could not send — please try again.';
      }
    } catch (e) {
      msg.style.color = '#a00';
      msg.textContent = 'Could not send — please try again.';
    }
    btn.disabled = false; btn.textContent = 'Email this link';
  }
  $('emailBtn') && $('emailBtn').addEventListener('click', sendCompanionEmail);
  $('companionEmail') && $('companionEmail').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendCompanionEmail(); } });

  (async function init() {
    if (!token) return showError('Invalid payment link.');
    try {
      const [summary, cfg] = await Promise.all([loadSummary(), fetch('/api/config').then(r => r.json())]);
      render(summary);
      if (summary.balance > 0 && summary.status !== 'paid') {
        if (cfg.paymentMock) {
          mountMockButton();                       // test mode: no SDK, no card fields
        } else {
          await loadPayPalSdk(cfg.paypalClientId);
          mountButtons();
          mountCardFields();                       // self-hides if account not eligible
        }
      }
    } catch (e) {
      showError('This payment link is invalid or has expired.');
    }
  })();
})();
