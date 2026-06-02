// My Page > Itineraries — list cards, delete button, link to viewer.

(function () {
const { useEffect, useState } = React;

function StatusBadge({ status }) {
  const colors = {
    new:        { bg:'#ECEEF3', fg:'#2A3C5E' },
    reviewing:  { bg:'#FAF0DA', fg:'#8A6A1F' },
    quoted:     { bg:'#E7F0E9', fg:'#3F6147' },
    booked:     { bg:'#EFE8DA', fg:'#6E5A2E' },
    archived:   { bg:'#ECE7DD', fg:'#8A8479' }
  };
  const c = colors[status] || colors.new;
  return (
    <span style={{
      display:'inline-block', padding:'4px 10px', borderRadius:999,
      background:c.bg, color:c.fg, fontSize:13, fontWeight:600, textTransform:'capitalize'
    }}>{status}</span>
  );
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function MeItineraries() {
  const [supa, setSupa] = useState(null);
  const [rows, setRows] = useState(null);
  const [err, setErr]   = useState(null);
  const [pay, setPay]   = React.useState({});

  useEffect(() => {
    (async () => {
      let t = 0;
      while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
      const client = await window.kwAuth.init();
      setSupa(client);
      const { data, error } = await client
        .from('itineraries')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false });
      if (error) { setErr(error.message); return; }
      setRows(data || []);
      const { data: pgs } = await client
        .from('payment_groups')
        .select('itinerary_id, total_amount, amount_paid, status');
      const payByItin = {};
      (pgs || []).forEach(p => { payByItin[p.itinerary_id] = p; });
      setPay(payByItin);
    })();
  }, []);

  async function onDelete(id) {
    if (!confirm('Delete this itinerary? This can\'t be undone.')) return;
    const { error } = await supa.from('itineraries').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setRows(rows.filter(r => r.id !== id));
  }

  if (err)              return <div style={{padding:20, color:'#A4452F'}}>Could not load: {err}</div>;
  if (rows === null)    return <div style={{padding:20, color:'#8A8479'}}>Loading...</div>;

  if (rows.length === 0) {
    return (
      <div style={{padding:40, textAlign:'center', background:'#fff', border:'1px solid #E5DBC8', borderRadius:12}}>
        <p style={{fontSize:19, color:'#54514B', margin:'0 0 18px'}}>
          You haven't saved any itineraries yet.
        </p>
        <a href="/step1.html" style={{
          display:'inline-block', padding:'12px 22px', background:'#1B2A4A', color:'#fff',
          borderRadius:10, textDecoration:'none', fontSize:19, fontWeight:600
        }}>Plan a trip</a>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:16}}>
        {rows.map(r => (
          <div key={r.id} style={{
            background:'#fff', border:'1px solid #E5DBC8', borderRadius:12,
            padding:20, display:'flex', flexDirection:'column', gap:10
          }}>
            <div style={{fontSize:19, fontWeight:600, color:'#1B2A4A'}}>{r.title || 'Untitled trip'}</div>
            <div style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:6}}>
              <StatusBadge status={r.status} />
              {pay[r.id] && (
                <span style={{ fontSize: 13, color: pay[r.id].status === 'paid' ? '#5C7C63' : '#1B2A4A', fontWeight: 600 }}>
                  {pay[r.id].status === 'paid'
                    ? 'Paid ✓'
                    : `$${Number(pay[r.id].amount_paid).toLocaleString()} of $${Number(pay[r.id].total_amount).toLocaleString()} paid`}
                </span>
              )}
            </div>
            <div style={{fontSize:15, color:'#8A8479'}}>Saved {fmtDate(r.created_at)}</div>
            <div style={{display:'flex', gap:10, marginTop:6}}>
              <a href={`/result.html?itin=${r.id}`} style={{
                flex:1, textAlign:'center', padding:'10px 14px', background:'#1B2A4A',
                color:'#fff', borderRadius:8, textDecoration:'none', fontSize:15, fontWeight:600
              }}>View</a>
              <button onClick={() => onDelete(r.id)} style={{
                padding:'10px 12px', background:'#fff', border:'1px solid #E5DBC8',
                borderRadius:8, cursor:'pointer', fontSize:15, color:'#A4452F'
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:24, textAlign:'center'}}>
        <a href="/step1.html" style={{fontSize:19, color:'#1B2A4A', textDecoration:'none'}}>+ Plan a new trip</a>
      </div>
    </div>
  );
}

const root = document.getElementById('me-itineraries-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeItineraries />, root);
}
})();
