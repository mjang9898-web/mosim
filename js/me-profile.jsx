// My Page > Profile — view + edit. Visual-rich: completeness bar, country dropdown
// with flag, emergency contact, and a trips-at-a-glance mini card.

(function () {
const { useEffect, useState } = React;

const card  = { background:'#fff', border:'1px solid #E5DBC8', borderRadius:16, padding:28, maxWidth:600 };
const sechd = { fontSize:12.5, fontWeight:700, letterSpacing:'1.6px', textTransform:'uppercase', color:'#C39A3F', marginBottom:4 };
const LANGS = { en:'English', ko:'한국어' };

// Common origins first, then alphabetical. Stores ISO-2; flag is derived from the code.
const COUNTRIES = [
  ['US','United States'],['CA','Canada'],['GB','United Kingdom'],['AU','Australia'],
  ['AE','United Arab Emirates'],['AR','Argentina'],['AT','Austria'],['BE','Belgium'],['BR','Brazil'],
  ['CH','Switzerland'],['CL','Chile'],['CN','China'],['CO','Colombia'],['CZ','Czechia'],['DE','Germany'],
  ['DK','Denmark'],['EG','Egypt'],['ES','Spain'],['FI','Finland'],['FR','France'],['GR','Greece'],
  ['HK','Hong Kong'],['ID','Indonesia'],['IE','Ireland'],['IL','Israel'],['IN','India'],['IT','Italy'],
  ['JP','Japan'],['KR','South Korea'],['KW','Kuwait'],['MX','Mexico'],['MY','Malaysia'],['NL','Netherlands'],
  ['NO','Norway'],['NZ','New Zealand'],['PH','Philippines'],['PL','Poland'],['PT','Portugal'],['QA','Qatar'],
  ['SA','Saudi Arabia'],['SE','Sweden'],['SG','Singapore'],['TH','Thailand'],['TR','Türkiye'],['TW','Taiwan'],
  ['VN','Vietnam'],['ZA','South Africa']
];
const C_NAME = Object.fromEntries(COUNTRIES);
function flag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month:'long', year:'numeric' });
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

const COMPLETE_KEYS = ['name','phone','origin_country','city','emergency_phone'];

function MeProfile() {
  const [supa, setSupa]   = useState(null);
  const [user, setUser]   = useState(null);
  const [form, setForm]   = useState({ name:'', phone:'', language:'en', origin_country:'', city:'', emergency_name:'', emergency_phone:'' });
  const [createdAt, setCreatedAt] = useState(null);
  const [trips, setTrips] = useState(null);   // { count, status }
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  useEffect(() => {
    (async () => {
      let t = 0;
      while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
      const client = await window.kwAuth.init();
      setSupa(client);
      const u = await window.kwAuth.getUser();
      if (!u) { setLoading(false); return; }
      setUser(u);
      const { data } = await client.from('profiles').select('*').eq('id', u.id).single();
      if (data) {
        setForm({
          name:data.name||'', phone:data.phone||'', language:data.language||'en',
          origin_country:data.origin_country||'', city:data.city||'',
          emergency_name:data.emergency_name||'', emergency_phone:data.emergency_phone||''
        });
        setCreatedAt(data.created_at);
      }
      const { data: its } = await client.from('itineraries').select('id, status, created_at').eq('user_id', u.id).order('created_at', { ascending:false });
      if (its) setTrips({ count: its.length, status: its[0] && its[0].status });
      setLoading(false);
    })();
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const { error } = await supa.from('profiles').update({
      name: form.name || null,
      phone: form.phone || null,
      language: form.language,
      origin_country: form.origin_country || null,
      city: form.city || null,
      emergency_name: form.emergency_name || null,
      emergency_phone: form.emergency_phone || null,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);
    setSaving(false);
    if (error) { setMsg({ kind:'err', text: error.message }); return; }
    setMsg({ kind:'ok', text:'Saved.' });
    setEditing(false);
  }

  if (loading) return <div style={{padding:20, color:'#8A8479'}}>Loading...</div>;
  if (!user)   return <div style={{padding:20, color:'#8A8479'}}>Please sign in.</div>;

  const initial = (form.name || user.email || '?').trim().charAt(0).toUpperCase();
  const filled = COMPLETE_KEYS.filter(k => (form[k] || '').trim()).length;

  // ── EDIT ──
  if (editing) {
    const inputStyle = { padding:'13px 15px', fontSize:19, border:'1.5px solid #E5DBC8', borderRadius:10, fontFamily:'inherit', color:'#1B2A4A', background:'#fff', width:'100%', boxSizing:'border-box' };
    return (
      <form onSubmit={onSave} style={card}>
        <div style={sechd}>Edit profile</div>
        <div style={{display:'flex', flexDirection:'column', gap:18, marginTop:18}}>
          <Field label="Email (read-only)">
            <input value={user.email} disabled style={{...inputStyle, background:'#FBF8F2', color:'#8A8479'}} />
          </Field>
          <Field label="Name">
            <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} style={inputStyle} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} style={inputStyle} placeholder="+1 555 123 4567" />
          </Field>
          <Field label="Origin country">
            <select value={form.origin_country} onChange={e => setForm({...form, origin_country:e.target.value})} style={inputStyle}>
              <option value="">Select your country…</option>
              {COUNTRIES.map(([code, name]) => (
                <option key={code} value={code}>{flag(code)}  {name}</option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <input value={form.city} onChange={e => setForm({...form, city:e.target.value})} style={inputStyle} placeholder="Los Angeles" />
          </Field>
          <Field label="Language">
            <select value={form.language} onChange={e => setForm({...form, language:e.target.value})} style={inputStyle}>
              <option value="en">English</option>
              <option value="ko">한국어</option>
            </select>
          </Field>
          <div style={{borderTop:'1px solid #E5DBC8', paddingTop:18, marginTop:2}}>
            <div style={sechd}>Emergency contact</div>
            <div style={{fontSize:14, color:'#8A8479', marginTop:2, marginBottom:14}}>Who we'd reach if needed during your trip.</div>
            <div style={{display:'flex', flexDirection:'column', gap:18}}>
              <Field label="Contact name">
                <input value={form.emergency_name} onChange={e => setForm({...form, emergency_name:e.target.value})} style={inputStyle} placeholder="e.g. spouse, son, daughter" />
              </Field>
              <Field label="Contact phone">
                <input value={form.emergency_phone} onChange={e => setForm({...form, emergency_phone:e.target.value})} style={inputStyle} placeholder="+1 555 987 6543" />
              </Field>
            </div>
          </div>
        </div>
        <div style={{display:'flex', gap:10, marginTop:24}}>
          <button type="submit" disabled={saving} style={{padding:'13px 26px', background:'#1B2A4A', color:'#fff', border:0, borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer'}}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => { setEditing(false); setMsg(null); }} style={{padding:'13px 22px', background:'#fff', color:'#1B2A4A', border:'1.5px solid #E5DBC8', borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer'}}>Cancel</button>
        </div>
        {msg && <div style={{marginTop:12, color: msg.kind === 'err' ? '#A4452F' : '#5C7C63', fontSize:15}}>{msg.text}</div>}
      </form>
    );
  }

  // ── VIEW ──
  const contactRows = [
    ['Phone', form.phone || '—'],
    ['Origin country', form.origin_country ? (flag(form.origin_country) + '  ' + (C_NAME[form.origin_country] || form.origin_country)) : '—'],
    ['City', form.city || '—'],
    ['Language', LANGS[form.language] || form.language]
  ];
  const emRows = [
    ['Contact name', form.emergency_name || '—'],
    ['Contact phone', form.emergency_phone || '—']
  ];

  return (
    <div style={{display:'flex', flexDirection:'column', gap:18, maxWidth:600}}>

      {/* Header + completeness */}
      <div style={card}>
        <div style={{display:'flex', alignItems:'center', gap:18}}>
          <div style={{flex:'none', width:64, height:64, borderRadius:'50%', background:'#1B2A4A', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Lora, serif', fontSize:28, fontWeight:600}}>{initial}</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontFamily:'Lora, serif', fontSize:24, fontWeight:600, color:'#1B2A4A'}}>{form.name || 'Your name'}</div>
            <div style={{fontSize:16, color:'#54514B', overflow:'hidden', textOverflow:'ellipsis'}}>{user.email}</div>
            {createdAt && <div style={{fontSize:14, color:'#8A8479', marginTop:2}}>Member since {fmtDate(createdAt)}</div>}
          </div>
          <button onClick={() => { setEditing(true); setMsg(null); }} style={{flex:'none', padding:'10px 18px', background:'#fff', color:'#1B2A4A', border:'1.5px solid #C39A3F', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer'}}>Edit</button>
        </div>
        <div style={{marginTop:22, paddingTop:18, borderTop:'1px solid #E5DBC8'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
            <span style={{fontSize:14, color:'#8A8479'}}>Profile</span>
            <span style={{fontSize:14, color: filled === COMPLETE_KEYS.length ? '#5C7C63' : '#8A8479', fontWeight:600}}>{filled === COMPLETE_KEYS.length ? 'Complete ✓' : (filled + ' of ' + COMPLETE_KEYS.length + ' filled')}</span>
          </div>
          <div style={{display:'flex', gap:6}}>
            {COMPLETE_KEYS.map((k, i) => (
              <div key={k} style={{flex:1, height:7, borderRadius:4, background: i < filled ? '#C39A3F' : '#EFE7D6'}} />
            ))}
          </div>
        </div>
        {msg && msg.kind === 'ok' && <div style={{marginTop:14, color:'#5C7C63', fontSize:15}}>{msg.text}</div>}
      </div>

      {/* Details: contact + emergency */}
      <div style={card}>
        <div style={sechd}>Contact</div>
        <RowList rows={contactRows} />
        <div style={{borderTop:'1px solid #E5DBC8', marginTop:18, paddingTop:18}}>
          <div style={sechd}>Emergency contact</div>
          <RowList rows={emRows} />
        </div>
      </div>

      {/* Trips at a glance */}
      <a href="?tab=itineraries" style={{...card, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, textDecoration:'none', cursor:'pointer'}}>
        <div>
          <div style={{...sechd, marginBottom:6}}>Your trips</div>
          {trips && trips.count > 0 ? (
            <div style={{fontSize:17, color:'#1B2A4A', fontWeight:500}}>
              {trips.count} saved {trips.count === 1 ? 'itinerary' : 'itineraries'}
              {trips.status && <span style={{color:'#8A8479', fontWeight:400}}>  ·  {cap(trips.status)}</span>}
            </div>
          ) : (
            <div style={{fontSize:17, color:'#8A8479'}}>No saved trips yet</div>
          )}
        </div>
        <span style={{flex:'none', color:'#C39A3F', fontSize:16, fontWeight:600}}>{trips && trips.count > 0 ? 'View →' : 'Plan a trip →'}</span>
      </a>

    </div>
  );
}

function RowList({ rows }) {
  return (
    <div>
      {rows.map(([l, v], i) => (
        <div key={l} style={{display:'flex', justifyContent:'space-between', gap:16, padding:'13px 0', borderTop: i === 0 ? 'none' : '1px solid #F1EADC'}}>
          <span style={{fontSize:15, color:'#8A8479'}}>{l}</span>
          <span style={{fontSize:16, color:'#1B2A4A', fontWeight:500, textAlign:'right'}}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:6}}>
      <span style={{fontSize:15, color:'#54514B'}}>{label}</span>
      {children}
    </label>
  );
}

const root = document.getElementById('me-profile-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeProfile />, root);
}
})();
