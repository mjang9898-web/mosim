// Universal payment + share page. No login required.
(function () {
  const token = new URLSearchParams(location.search).get('g');
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    $('trip').textContent = s.title + ' · ' + s.people + (s.people === 1 ? ' person' : ' people');
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
      createOrder: async () => {
        $('msg').textContent = '';
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
        render({ title: $('trip').textContent.split(' · ')[0], people: 1, total: b.total, paid: b.paid, balance: b.balance, status: b.status });
        $('msg').style.color = '#0a6';
        $('msg').textContent = b.status === 'paid' ? 'Fully paid ✓ Thank you!' : 'Payment received ✓';
      },
      onError: () => { $('msg').style.color = '#a00'; $('msg').textContent = 'PayPal error — please try again.'; }
    }).render('#paypal-buttons');
  }

  $('copyBtn') && $('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(location.href).then(() => {
      $('copyBtn').textContent = 'Link copied ✓';
      setTimeout(() => { $('copyBtn').textContent = 'Copy payment link'; }, 2000);
    });
  });

  (async function init() {
    if (!token) return showError('Invalid payment link.');
    try {
      const [summary, cfg] = await Promise.all([loadSummary(), fetch('/api/config').then(r => r.json())]);
      render(summary);
      if (summary.balance > 0 && summary.status !== 'paid') {
        await loadPayPalSdk(cfg.paypalClientId);
        mountButtons();
      }
    } catch (e) {
      showError('This payment link is invalid or has expired.');
    }
  })();
})();
