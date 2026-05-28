// My Page > Itineraries — list cards, delete button, link to viewer.

(function () {
const { useEffect, useState } = React;

function StatusBadge({ status }) {
  const colors = {
    new:        { bg:'#eef2ff', fg:'#3744a6' },
    reviewing:  { bg:'#fff4e5', fg:'#7a4a00' },
    quoted:     { bg:'#e9f7ef', fg:'#1b6e3d' },
    booked:     { bg:'#fde9f1', fg:'#7a0a3f' },
    archived:   { bg:'#eee', fg:'#666' }
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
    })();
  }, []);

  async function onDelete(id) {
    if (!confirm('Delete this itinerary? This can\'t be undone.')) return;
    const { error } = await supa.from('itineraries').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setRows(rows.filter(r => r.id !== id));
  }

  if (err)              return <div style={{padding:20, color:'#a00'}}>Could not load: {err}</div>;
  if (rows === null)    return <div style={{padding:20, color:'#777'}}>Loading...</div>;

  if (rows.length === 0) {
    return (
      <div style={{padding:40, textAlign:'center', background:'#fff', border:'1px solid #e2e2e2', borderRadius:12}}>
        <p style={{fontSize:19, color:'#444', margin:'0 0 18px'}}>
          You haven't saved any itineraries yet.
        </p>
        <a href="/step1.html" style={{
          display:'inline-block', padding:'12px 22px', background:'#B21464', color:'#fff',
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
            background:'#fff', border:'1px solid #e2e2e2', borderRadius:12,
            padding:20, display:'flex', flexDirection:'column', gap:10
          }}>
            <div style={{fontSize:19, fontWeight:600, color:'#1a1a1a'}}>{r.title || 'Untitled trip'}</div>
            <StatusBadge status={r.status} />
            <div style={{fontSize:15, color:'#777'}}>Saved {fmtDate(r.created_at)}</div>
            <div style={{display:'flex', gap:10, marginTop:6}}>
              <a href={`/result.html?itin=${r.id}`} style={{
                flex:1, textAlign:'center', padding:'10px 14px', background:'#B21464',
                color:'#fff', borderRadius:8, textDecoration:'none', fontSize:15, fontWeight:600
              }}>View</a>
              <button onClick={() => onDelete(r.id)} style={{
                padding:'10px 12px', background:'#fff', border:'1px solid #e2e2e2',
                borderRadius:8, cursor:'pointer', fontSize:15, color:'#a00'
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:24, textAlign:'center'}}>
        <a href="/step1.html" style={{fontSize:19, color:'#B21464', textDecoration:'none'}}>+ Plan a new trip</a>
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
