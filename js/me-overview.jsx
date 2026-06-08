// My Page > Overview — dashboard. "Trip at a glance" is the hero.

(function () {
const { useEffect, useState } = React;

const STAGES = ['new', 'reserved', 'reviewing', 'quoted', 'booked'];
const STATUS_LINE = {
  new:        "Your plan is saved. Reserve it when you're ready and we'll take it from there.",
  reserved:   "Reserved — we're confirming your care and dates, and we'll be in touch shortly.",
  reviewing:  "We're lining up your care and dates with the hospitals.",
  quoted:     "Confirmed and ready — your concierge fee quote is on its way.",
  booked:     "You're booked. We'll send pre-arrival details before you fly."
};
const CARE   = { screening:'Health screening', knees:'Knees & joints', dental:'Dental', eyes:'Eyes', unsure:'Care guidance' };
const LENGTH = { under1w:'Under a week', '1to2w':'1–2 weeks', '2plus':'2+ weeks', unsure:'Flexible' };
const PARTY  = { solo:'Just you', couple:'You & spouse', family:'With family' };
const PACE   = { relaxed:'Relaxed', balanced:'Balanced', full:'Full days' };

const card  = { background:'#fff', border:'1px solid #E5DBC8', borderRadius:16, padding:24 };
const label = { fontSize:12.5, fontWeight:600, letterSpacing:'1.6px', textTransform:'uppercase', color:'#C39A3F' };

function StatusBadge({ status }) {
  const colors = {
    new:{bg:'#ECEEF3',fg:'#2A3C5E'}, reserved:{bg:'#E7EBF3',fg:'#2A3C5E'}, reviewing:{bg:'#FAF0DA',fg:'#8A6A1F'},
    quoted:{bg:'#E7F0E9',fg:'#3F6147'}, booked:{bg:'#EFE8DA',fg:'#6E5A2E'}, archived:{bg:'#ECE7DD',fg:'#8A8479'}
  };
  const c = colors[status] || colors.new;
  return <span style={{display:'inline-block',padding:'4px 12px',borderRadius:999,background:c.bg,color:c.fg,fontSize:13,fontWeight:600,textTransform:'capitalize'}}>{status}</span>;
}

function MeOverview() {
  const [name, setName] = useState('');
  const [itin, setItin] = useState(undefined); // undefined=loading, null=none
  const [payg, setPayg] = useState(null);
  const [err, setErr]   = useState(null);
  const [copied, setCopied] = useState(false);
  const [supa, setSupa] = useState(null);
  const [mock, setMock] = useState(false);   // test-payment mode (PAYMENT_MOCK)
  const [setupBusy, setSetupBusy] = useState(false);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    (async () => {
      let t = 0;
      while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
      const client = await window.kwAuth.init();
      setSupa(client);
      const user = await window.kwAuth.getUser();
      setName((user && user.user_metadata && user.user_metadata.name) || (user && user.email && user.email.split('@')[0]) || '');
      fetch('/api/config').then(r => r.json()).then(c => setMock(!!c.paymentMock)).catch(() => {});
      const { data, error } = await client
        .from('itineraries')
        .select('id, title, state, schedule, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      if (error) { setErr(error.message); return; }
      setItin(data);
      if (data) {
        const { data: pg } = await client
          .from('payment_groups')
          .select('total_amount, amount_paid, status, share_token')
          .eq('itinerary_id', data.id).maybeSingle();
        setPayg(pg || null);
      }
    })();
  }, []);

  async function setupPayment() {
    if (!supa || !itin) return;
    setSetupBusy(true);
    try {
      const { data: { session } } = await supa.auth.getSession();
      const r = await fetch('/api/payment-group', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (session && session.access_token) },
        body: JSON.stringify({ itinerary_id: itin.id })
      });
      const b = await r.json();
      if (r.ok && b.token) { window.location.href = '/pay.html?g=' + b.token; return; }
      alert(b.error || 'Could not set up payment.');
    } catch (e) {
      alert('Could not set up payment.');
    }
    setSetupBusy(false);
  }

  async function reserveTrip() {
    if (!supa || !itin) return;
    setReserving(true);
    try {
      const { data: { session } } = await supa.auth.getSession();
      const r = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (session && session.access_token) },
        body: JSON.stringify({ itinerary_id: itin.id })
      });
      const b = await r.json();
      if (r.ok) setItin({ ...itin, status: b.status || 'reserved' });
      else alert(b.error || 'Could not reserve.');
    } catch (e) { alert('Could not reserve.'); }
    setReserving(false);
  }

  if (err) return <div style={{padding:20, color:'#A4452F'}}>Could not load: {err}</div>;
  if (itin === undefined) return <div style={{padding:20, color:'#8A8479'}}>Loading your dashboard…</div>;

  const greeting = (
    <div style={{marginBottom:24}}>
      <h1 style={{margin:'0 0 4px', fontSize:30, fontWeight:600, color:'#1B2A4A'}}>Welcome back{name ? ', ' + name : ''}.</h1>
      <p style={{margin:0, fontSize:18, color:'#54514B'}}>{itin ? "Here's where your trip stands." : "Let's plan your trip to Korea."}</p>
    </div>
  );

  if (itin === null) {
    return (
      <div>
        {greeting}
        <div style={{...card, textAlign:'center', padding:48}}>
          <p style={{fontSize:19, color:'#54514B', margin:'0 0 18px'}}>You haven't planned a trip yet.</p>
          <a href="/step1.html" style={{display:'inline-block', padding:'14px 28px', background:'#1B2A4A', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:17, fontWeight:600}}>Plan my trip</a>
        </div>
      </div>
    );
  }

  const state   = itin.state || {};
  const care    = (state.care && state.care.needs) || [];
  const trip    = state.trip || {};
  const comfort = state.comfort || {};
  const days    = Array.isArray(itin.schedule) ? itin.schedule.length : null;
  const stageIdx = STAGES.indexOf(itin.status) >= 0 ? STAGES.indexOf(itin.status) : 0;

  const facts = [];
  if (LENGTH[trip.length]) facts.push(['When', LENGTH[trip.length]]);
  if (PARTY[trip.party])   facts.push(['Travelers', PARTY[trip.party] + (trip.partySize > 1 ? ' · ' + trip.partySize : '')]);
  if (PACE[comfort.pace])  facts.push(['Pace', PACE[comfort.pace]]);
  if (days)                facts.push(['Plan', days + '-day plan']);

  const paid = payg && payg.status === 'paid';
  const due  = payg ? Math.max(0, Number(payg.total_amount) - Number(payg.amount_paid)) : null;

  return (
    <div>
      {greeting}

      {/* HERO — Trip at a glance (the priority) */}
      <div style={{...card, borderLeft:'4px solid #C39A3F', padding:30, marginBottom:18}}>
        <div style={label}>Your trip</div>
        <h2 style={{margin:'10px 0 12px', fontSize:26, fontWeight:600, color:'#1B2A4A'}}>{itin.title || 'Your Korea trip'}</h2>
        <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:18}}>
          <StatusBadge status={itin.status} />
          {care.map(k => (
            <span key={k} style={{fontSize:14, border:'1px solid #E5DBC8', borderRadius:999, padding:'5px 13px', color:'#1B2A4A'}}>{CARE[k] || k}</span>
          ))}
        </div>
        {facts.length > 0 && (
          <div style={{display:'flex', gap:30, flexWrap:'wrap', marginBottom:22}}>
            {facts.map(([l, v]) => (
              <div key={l}>
                <div style={{fontSize:12.5, fontWeight:600, letterSpacing:'.6px', textTransform:'uppercase', color:'#8A8479', marginBottom:3}}>{l}</div>
                <div style={{fontSize:17, color:'#1B2A4A', fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
        )}
        <a href={`/result.html?itin=${itin.id}`} style={{display:'inline-block', padding:'13px 26px', background:'#1B2A4A', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:16, fontWeight:600}}>View full itinerary →</a>

        {itin.status === 'new' && (
          <div style={{marginTop:20, paddingTop:20, borderTop:'1px solid #E5DBC8'}}>
            <p style={{margin:'0 0 13px', fontSize:16, color:'#54514B', lineHeight:1.55}}>Ready to make this real? <b style={{color:'#1B2A4A'}}>Reserve your trip</b> — it's free, with no commitment. It tells us you're serious so we can confirm your care and dates.</p>
            <button onClick={reserveTrip} disabled={reserving}
              style={{padding:'13px 28px', background:'#C39A3F', color:'#1B2A4A', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer'}}>
              {reserving ? 'Reserving…' : 'Reserve this trip'}
            </button>
          </div>
        )}
        {itin.status === 'reserved' && (
          <div style={{marginTop:20, paddingTop:20, borderTop:'1px solid #E5DBC8'}}>
            <p style={{margin:0, fontSize:16, color:'#3F6147', fontWeight:600, lineHeight:1.55}}>✓ Reserved — we're confirming your care and dates, and your concierge will reach out shortly.</p>
          </div>
        )}
      </div>

      {/* row: status + payment */}
      <div className="ov-row" style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18}}>
        <div style={card}>
          <div style={label}>Where it stands</div>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', margin:'18px 0 16px'}}>
            {STAGES.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:60}}>
                  <div style={{width:30, height:30, borderRadius:'50%', background:i<=stageIdx?'#1B2A4A':'#E5DBC8', color:i<=stageIdx?'#fff':'#8A8479', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700}}>{i+1}</div>
                  <div style={{fontSize:13, color:i<=stageIdx?'#1B2A4A':'#8A8479', textTransform:'capitalize'}}>{s}</div>
                </div>
                {i < STAGES.length - 1 && <div style={{flex:1, height:2, background:i<stageIdx?'#1B2A4A':'#E5DBC8', margin:'15px 6px 0'}} />}
              </React.Fragment>
            ))}
          </div>
          <p style={{margin:0, fontSize:16, color:'#54514B', lineHeight:1.55}}>{STATUS_LINE[itin.status] || ''}</p>
        </div>

        <div style={card}>
          <div style={label}>Payment</div>
          {!payg && (
            <div style={{marginTop:14}}>
              <p style={{margin:0, fontSize:16, color:'#54514B', lineHeight:1.55}}>No payment due yet — your concierge will send a clear quote.</p>
              {mock && (
                <div style={{marginTop:14, paddingTop:14, borderTop:'1px dashed #E5DBC8'}}>
                  <div style={{fontSize:13, color:'#8A8479', marginBottom:8}}>Test mode</div>
                  <button onClick={setupPayment} disabled={setupBusy}
                    style={{padding:'11px 20px', background:'#fff', color:'#1B2A4A', border:'1.5px solid #C39A3F', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer'}}>
                    {setupBusy ? 'Setting up…' : 'Set up a test payment'}
                  </button>
                </div>
              )}
            </div>
          )}
          {payg && paid && (
            <div style={{marginTop:14}}>
              <div style={{fontSize:22, fontWeight:700, color:'#5C7C63'}}>Paid in full ✓</div>
              <p style={{margin:'6px 0 0', fontSize:15, color:'#8A8479'}}>Thank you.</p>
            </div>
          )}
          {payg && !paid && (
            <div style={{marginTop:14}}>
              <div style={{fontSize:14, color:'#8A8479'}}>Balance due</div>
              <div style={{fontSize:28, fontWeight:600, color:'#1B2A4A', fontFamily:'Lora, serif'}}>${due.toLocaleString()}</div>
              <div style={{fontSize:13, color:'#8A8479', margin:'2px 0 14px'}}>${Number(payg.amount_paid).toLocaleString()} of ${Number(payg.total_amount).toLocaleString()} paid</div>
              <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                <a href={payg.share_token ? `/pay.html?g=${payg.share_token}` : '#'} style={{display:'inline-block', padding:'11px 22px', background:'#1B2A4A', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:15, fontWeight:600}}>Pay now</a>
                {payg.share_token && (
                  <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/pay.html?g=' + payg.share_token); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                    style={{padding:'11px 20px', background:'#fff', color:'#1B2A4A', border:'1.5px solid #C39A3F', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer'}}>
                    {copied ? 'Link copied ✓' : 'Split the cost'}
                  </button>
                )}
              </div>
              {payg.share_token && (
                <p style={{fontSize:13, color:'#8A8479', margin:'12px 0 0', lineHeight:1.5}}>Paying with others? Share that link — each person pays their share, no account needed.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{display:'flex', gap:24, marginTop:20, flexWrap:'wrap'}}>
        <a href="?tab=itineraries" style={{fontSize:16, color:'#1B2A4A', textDecoration:'none', fontWeight:500}}>All itineraries →</a>
        <a href="?tab=profile" style={{fontSize:16, color:'#1B2A4A', textDecoration:'none', fontWeight:500}}>Edit profile →</a>
        <a href="/step1.html" onClick={(e) => { if (!window.confirm('Start a fresh plan? This clears your current selections so you begin from scratch.')) { e.preventDefault(); return; } try { sessionStorage.removeItem('mosim.state.v1'); } catch (x) {} }} style={{fontSize:16, color:'#C39A3F', textDecoration:'none', fontWeight:600}}>Start a fresh plan ↺</a>
      </div>
    </div>
  );
}

const root = document.getElementById('me-overview-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeOverview />, root);
}
})();
