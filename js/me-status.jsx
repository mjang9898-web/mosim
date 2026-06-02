// My Page > Status — timeline for the user's most recent itinerary.

(function () {
const { useEffect, useState } = React;

const STAGES = ['new', 'reviewing', 'quoted', 'booked'];

function MeStatus() {
  const [latest, setLatest] = useState(undefined);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      let t = 0;
      while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
      const client = await window.kwAuth.init();
      const { data, error } = await client
        .from('itineraries')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) { setErr(error.message); return; }
      setLatest(data);
    })();
  }, []);

  if (err)              return <div style={{padding:20, color:'#A4452F'}}>Could not load: {err}</div>;
  if (latest === undefined) return <div style={{padding:20, color:'#8A8479'}}>Loading...</div>;
  if (latest === null) {
    return (
      <div style={{padding:40, textAlign:'center', background:'#fff', border:'1px solid #E5DBC8', borderRadius:12}}>
        <p style={{fontSize:19, color:'#54514B'}}>No itineraries yet. Plan one to see your concierge status here.</p>
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(latest.status) >= 0 ? STAGES.indexOf(latest.status) : 0;
  const explainer = {
    new:        "We've received your itinerary. A specialist will review within 48 hours.",
    reviewing:  "Our concierge is hand-crafting your detailed plan now.",
    quoted:     "A quote is on its way to your email. Reply to lock in your booking.",
    booked:     "You're all set. We'll send pre-arrival details one week before your trip."
  }[latest.status] || '';

  return (
    <div style={{background:'#fff', border:'1px solid #E5DBC8', borderRadius:12, padding:28}}>
      <h2 style={{margin:'0 0 6px', fontSize:22}}>{latest.title || 'Your trip'}</h2>
      <p style={{margin:'0 0 24px', color:'#8A8479', fontSize:15}}>
        Saved {new Date(latest.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
      </p>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24}}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, minWidth:80}}>
              <div style={{
                width:32, height:32, borderRadius:'50%',
                background: i <= stageIdx ? '#1B2A4A' : '#E5DBC8',
                color: i <= stageIdx ? '#fff' : '#8A8479',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:15, fontWeight:700
              }}>{i + 1}</div>
              <div style={{fontSize:15, color: i <= stageIdx ? '#1B2A4A' : '#8A8479', textTransform:'capitalize'}}>{s}</div>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{flex:1, height:2, background: i < stageIdx ? '#1B2A4A' : '#E5DBC8', margin:'0 8px'}} />
            )}
          </React.Fragment>
        ))}
      </div>

      <p style={{margin:0, fontSize:19, color:'#54514B'}}>{explainer}</p>
    </div>
  );
}

const root = document.getElementById('me-status-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeStatus />, root);
}
})();
