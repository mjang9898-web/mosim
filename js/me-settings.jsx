// My Page > Settings — notification toggle + delete account.

const { useEffect, useState } = React;

function MeSettings() {
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm('Delete your account permanently? Your itineraries and profile will be removed. This cannot be undone.')) return;
    setDeleting(true);
    try {
      const supa = await window.kwAuth.init();
      const { data: { session } } = await supa.auth.getSession();
      if (!session) { alert('Not signed in.'); setDeleting(false); return; }
      const r = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      const body = await r.json();
      if (!r.ok) { alert(body.error || 'Failed to delete'); setDeleting(false); return; }
      await window.kwAuth.signOut();
      window.location.replace('/?deleted=1');
    } catch (e) {
      alert('Failed to delete: ' + e.message);
      setDeleting(false);
    }
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:24, maxWidth:560}}>
      <section style={{background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:24}}>
        <h2 style={{margin:'0 0 8px', fontSize:22}}>Notifications</h2>
        <label style={{display:'flex', alignItems:'center', gap:10, fontSize:19, color:'#444', marginTop:12}}>
          <input
            type="checkbox"
            checked={emailUpdates}
            onChange={e => setEmailUpdates(e.target.checked)}
            style={{width:18, height:18}}
          />
          Email me when my itinerary status changes
        </label>
        <p style={{fontSize:13, color:'#999', margin:'8px 0 0'}}>
          (Coming soon — for now we'll always email you on major updates.)
        </p>
      </section>

      <section style={{background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:24}}>
        <h2 style={{margin:'0 0 8px', fontSize:22, color:'#a00'}}>Danger zone</h2>
        <p style={{fontSize:15, color:'#666', margin:'0 0 16px'}}>
          Deleting your account removes your profile and saved itineraries.
          Past lead inquiries are kept but anonymized.
        </p>
        <button
          onClick={onDelete}
          disabled={deleting}
          style={{
            padding:'12px 20px', background:'#fff', color:'#a00', border:'1px solid #a00',
            borderRadius:10, fontSize:19, cursor:'pointer'
          }}
        >
          {deleting ? 'Deleting...' : 'Delete my account'}
        </button>
      </section>
    </div>
  );
}

const root = document.getElementById('me-settings-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeSettings />, root);
}
