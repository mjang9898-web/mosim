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
      sc.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(clientId) + '&currency=USD';
      sc.onload = resolve; sc.onerror = reject;
      document.head.appendChild(sc);
    });
  }

  function mountButtons() {
    window.paypal.Buttons({
      onClick: (data, actions) => {
        if (!consented()) { warnConsent(); return actions.reject(); }
        return actions.resolve();
      },
      createOrder: async () => {
        $('msg').textContent = '';
        if (!consented()) { warnConsent(); throw new Error('consent required'); }
        const amt = parseFloat($('amount').value);
        const max = parseFloat($('amount').max);
        if (!amt || amt <= 0 || amt > max) {
          $('msg').style.color = '#a00';
          $('msg').textContent = 'Enter an amount between $0.01 and ' + fmt(max) + '.';
          throw new Error('invalid amount');
        }
        const r = await fetch('/api/paypal-order', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'create', token, amount: $('amount').value })
        });
        const b = await r.json();
        if (!r.ok) { $('msg').style.color = '#a00'; $('msg').textContent = b.error || 'Could not start payment'; throw new Error(b.error); }
        return b.orderID;
      },
      onApprove: async (data) => {
        const r = await fetch('/api/paypal-order', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'capture', token, orderID: data.orderID })
        });
        const b = await r.json();
        if (!r.ok) { $('msg').style.color = '#a00'; $('msg').textContent = b.error || 'Payment failed'; return; }
        try {
          render(await loadSummary());            // authoritative — preserves title & people
        } catch (_) {
          // fall back to the totals the capture returned (people/title unchanged on screen)
          $('total').textContent = fmt(b.total); $('paid').textContent = fmt(b.paid); $('balance').textContent = fmt(b.balance);
          if (b.status === 'paid' || b.balance <= 0) { $('payArea').style.display = 'none'; $('paidArea').style.display = 'block'; }
        }
        $('msg').style.color = '#0a6';
        $('msg').textContent = b.status === 'paid' ? 'Fully paid ✓ Thank you!' : 'Payment received ✓';
      },
      onError: () => { $('msg').style.color = '#a00'; $('msg').textContent = 'PayPal error — please try again.'; }
    }).render('#paypal-buttons').catch((e) => {
      console.error('paypal mount', e);
      $('msg').style.color = '#a00';
      $('msg').textContent = 'Could not load PayPal. Please reload.';
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

  (async function init() {
    if (!token) return showError('Invalid payment link.');
    try {
      const [summary, cfg] = await Promise.all([loadSummary(), fetch('/api/config').then(r => r.json())]);
      render(summary);
      if (summary.balance > 0 && summary.status !== 'paid') {
        if (cfg.paymentMock) {
          mountMockButton();
        } else {
          await loadPayPalSdk(cfg.paypalClientId);
          mountButtons();
        }
      }
    } catch (e) {
      showError('This payment link is invalid or has expired.');
    }
  })();
})();
