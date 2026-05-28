// My Page > Profile — editable form for profiles row.

(function () {
const { useEffect, useState } = React;

function MeProfile() {
  const [supa, setSupa] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', language:'en', origin_country:'' });
  const [loading, setLoading] = useState(true);
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
          name: data.name || '',
          phone: data.phone || '',
          language: data.language || 'en',
          origin_country: data.origin_country || ''
        });
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
    setMsg(error ? { kind:'err', text: error.message } : { kind:'ok', text:'Saved.' });
  }

  if (loading) return <div style={{padding:20, color:'#777'}}>Loading...</div>;

  return (
    <form onSubmit={onSave} style={{background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:28, maxWidth:560}}>
      <div style={{display:'flex', flexDirection:'column', gap:18}}>
        <Field label="Email (read-only)">
          <input value={user.email} disabled style={inputStyleDisabled} />
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
      <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Save'}</button>
      {msg && <div style={{marginTop:12, color: msg.kind === 'err' ? '#a00' : '#0a6', fontSize:15}}>{msg.text}</div>}
    </form>
  );
}

function Field({label, children}) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:6}}>
      <span style={{fontSize:15, color:'#444'}}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = { padding:'12px 14px', fontSize:19, border:'1px solid #e2e2e2', borderRadius:10, fontFamily:'inherit' };
const inputStyleDisabled = { ...inputStyle, background:'#f5f5f5', color:'#777' };
const btnStyle = { marginTop:24, padding:'14px 22px', background:'#B21464', color:'#fff', border:0, borderRadius:10, fontSize:19, fontWeight:600, cursor:'pointer' };

const root = document.getElementById('me-profile-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeProfile />, root);
}
})();
