// K-Wellness Concierge — nav auth indicator.
// Drop a <div id="kw-nav-auth"></div> into any page's nav and load this.
// Renders "Sign in" when logged out, "My Page" + email when logged in.
// Listens to onAuthStateChange so it updates instantly on login/logout.
//
// Depends on /js/auth.js being loaded with type="module" before this script.

(function () {
  const SLOT_ID = 'kw-nav-auth';
  let started = false;

  function render(user) {
    const slot = document.getElementById(SLOT_ID);
    if (!slot) return;
    if (user) {
      slot.innerHTML = `<a href="/me.html" class="kw-nav-auth-link" aria-label="My Page">My Page</a>`;
    } else {
      const path = window.location.pathname;
      const stepMatch = path.match(/\/step([1-4])\.html?$/);
      const nextParam = stepMatch ? '?next=step' + stepMatch[1] : '';
      slot.innerHTML = `<a href="/signin.html${nextParam}" class="kw-nav-auth-link" aria-label="Sign in">Sign in</a>`;
    }
  }

  async function start() {
    if (started) return;
    started = true;
    // Wait for kwAuth (auth.js is type=module so may load slightly after this script).
    let tries = 0;
    while (!window.kwAuth && tries < 50) {
      await new Promise(r => setTimeout(r, 50));
      tries++;
    }
    if (!window.kwAuth) {
      console.warn('[nav-auth] kwAuth not available');
      return;
    }
    const user = await window.kwAuth.getUser();
    render(user);
    window.kwAuth.onChange((_event, session) => render(session?.user || null));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
