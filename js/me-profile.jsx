// My Page > Profile — view + edit.

(function () {
const { useEffect, useState } = React;

const card   = { background:'#fff', border:'1px solid #E5DBC8', borderRadius:16, padding:28, maxWidth:600 };
const label  = { fontSize:12.5, fontWeight:600, letterSpacing:'1.6px', textTransform:'uppercase', color:'#C39A3F' };
const LANGS  = { en:'English', ko:'한국어' };

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month:'long', year:'numeric' });
}

function MeProfile() {
  const [supa, setSupa]       = useState(null);
  const [user, setUser]       = useState(null);
  const [form, setForm]       = useState({ name:'', phone:'', language:'en', origin_country:'' });
  const [createdAt, setCreatedAt] = useState(null);
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
        setForm({ name:data.name||'', phone:data.phone||'', language:data.language||'en', origin_country:data.origin_country||'' });
        setCreatedAt(data.created_at);
      }
      setLoading(false);
    })();
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const { error } = await supa
      .from('profiles')
      .update({
        name: form.name || null,
        phone: form.phone || null,
        language: form.language,
        origin_country: form.origin_country || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) { setMsg({ kind:'err', text: error.message }); return; }
    setMsg({ kind:'ok', text:'Saved.' });
    setEditing(false);
  }

  if (loading) return <div style={{padding:20, color:'#8A8479'}}>Loading...</div>;
  if (!user)   return <div style={{padding:20, color:'#8A8479'}}>Please sign in.</div>;

  const initial = (form.name || user.email || '?').trim().charAt(0).toUpperCase();

  // ── VIEW ──
  if (!editing) {
    const rows = [
      ['Phone', form.phone || '—'],
      ['Origin country', form.origin_country || '—'],
      ['Language', LANGS[form.language] || form.language]
    ];
    return (
      <div style={card}>
        <div style={{display:'flex', alignItems:'center', gap:18, marginBottom:26}}>
          <div style={{flex:'none', width:64, height:64, borderRadius:'50%', background:'#1B2A4A', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Lora, serif', fontSize:28, fontWeight:600}}>{initial}</div>
          <div>
            <div style={{fontFamily:'Lora, serif', fontSize:24, fontWeight:600, color:'#1B2A4A'}}>{form.name || 'Your name'}</div>
            <div style={{fontSize:16, color:'#54514B'}}>{user.email}</div>
            {createdAt && <div style={{fontSize:14, color:'#8A8479', marginTop:2}}>Member since {fmtDate(createdAt)}</div>}
          </div>
        </div>
        <div>
          {rows.map(([l, v]) => (
            <div key={l} style={{display:'flex', justifyContent:'space-between', gap:16, padding:'14px 0', borderTop:'1px solid #E5DBC8'}}>
              <span style={{fontSize:15, color:'#8A8479'}}>{l}</span>
              <span style={{fontSize:16, color:'#1B2A4A', fontWeight:500}}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setEditing(true); setMsg(null); }} style={{marginTop:24, padding:'13px 26px', background:'#1B2A4A', color:'#fff', border:0, borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer'}}>Edit profile</button>
        {msg && msg.kind === 'ok' && <span style={{marginLeft:14, color:'#5C7C63', fontSize:15}}>{msg.text}</span>}
      </div>
    );
  }

  // ── EDIT ──
  const inputStyle = { padding:'13px 15px', fontSize:19, border:'1.5px solid #E5DBC8', borderRadius:10, fontFamily:'inherit', color:'#1B2A4A', background:'#fff' };
  return (
    <form onSubmit={onSave} style={card}>
      <div style={label}>Edit profile</div>
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
          <input value={form.origin_country} onChange={e => setForm({...form, origin_country:e.target.value})} style={inputStyle} placeholder="US, JP, ..." />
        </Field>
        <Field label="Language">
          <select value={form.language} onChange={e => setForm({...form, language:e.target.value})} style={inputStyle}>
            <option value="en">English</option>
            <option value="ko">한국어</option>
          </select>
        </Field>
      </div>
      <div style={{display:'flex', gap:10, marginTop:24}}>
        <button type="submit" disabled={saving} style={{padding:'13px 26px', background:'#1B2A4A', color:'#fff', border:0, borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer'}}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={() => { setEditing(false); setMsg(null); }} style={{padding:'13px 22px', background:'#fff', color:'#1B2A4A', border:'1.5px solid #E5DBC8', borderRadius:10, fontSize:16, fontWeight:600, cursor:'pointer'}}>Cancel</button>
      </div>
      {msg && <div style={{marginTop:12, color: msg.kind === 'err' ? '#A4452F' : '#5C7C63', fontSize:15}}>{msg.text}</div>}
    </form>
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
