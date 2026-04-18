/* Shared Dashboard sidebar — injects into #sidebar-slot.
   Pages set <div id="sidebar-slot" data-nav="home|bookings|properties|…">.
*/
(function(){
  const SIDEBAR_HTML = `
<aside class="l1">
  <div class="brand">
    <img src="../ds/assets/logos/chekin-wordmark.png" alt="Chekin">
    <div class="collapse" title="Collapse"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></div>
  </div>

  <nav class="side">
    <div class="nav-item" data-k="home">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      Home
    </div>
    <div class="nav-item" data-k="bookings">
      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      Bookings
    </div>
    <div class="nav-item" data-k="properties">
      <svg viewBox="0 0 24 24"><path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
      Properties
    </div>
    <div class="nav-item" data-k="inbox">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Inbox
    </div>
    <div class="nav-item" data-k="upselling">
      <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
      Upselling
    </div>
    <div class="nav-item" data-k="documents">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>
      Documents
    </div>

    <div class="sgroup">Compliance</div>
    <div class="nav-item" data-k="legal">
      <svg viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5z"/></svg>
      Legal &amp; Police
    </div>
    <div class="nav-item" data-k="taxes">
      <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M6 14h4"/></svg>
      Tourist tax
    </div>
  </nav>

  <div class="foot">

    <details class="acc" data-acc="account" open>
      <summary>
        <div class="acc-head account">
          <div class="av">SM</div>
          <div class="labels">
            <div class="t">Sonder Madrid</div>
            <div class="s">madrid@email.com</div>
          </div>
          <svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </summary>
      <div class="subitems">
        <div class="sub-item">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.2 7.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
          Account Settings
        </div>

        <div class="switch-wrap">
          <div class="sub-item has-flyout selected" tabindex="0">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
            Account Switch
            <svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>
          </div>
          <div class="flyout" role="menu">
            <div class="fly-search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input placeholder="Search…">
            </div>
            <div class="fly-list">
              <div class="fly-row active">
                <svg viewBox="0 0 24 24"><path d="M2 20h20M3 20V8l9-5 9 5v12M8 20v-6h8v6"/></svg>
                madrid@email.com
                <span class="tag">Active</span>
              </div>
              <div class="fly-row">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                barcelona@email.com
              </div>
              <div class="fly-row">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                malaga@email.com
              </div>
              <div class="fly-row">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                sevilla@email.com
              </div>
            </div>
            <div class="fly-sep"></div>
            <div class="fly-row ghost">
              <svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>
              Request access…
            </div>
            <div class="fly-row ghost">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.2 7.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
              Access settings
            </div>
          </div>
        </div>

        <div class="sub-item">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Log out
        </div>
      </div>
    </details>

  </div>
</aside>`;

  function init(){
    const slot = document.getElementById('sidebar-slot');
    if(!slot) return;
    const nav = slot.getAttribute('data-nav');
    slot.outerHTML = SIDEBAR_HTML;
    if (nav) document.querySelector(`.l1 .nav-item[data-k="${nav}"]`)?.classList.add('active');
    // Inject Views section after Compliance if not present
    const compTaxes = document.querySelector('.l1 .nav-item[data-k="taxes"]');
    if (compTaxes && !document.querySelector('.l1 .nav-item[data-k="view-agenda"]')) {
      const VIEWS = `
        <div class="sgroup">Views</div>
        <div class="nav-item view" data-k="view-agenda">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h3M8 18h5"/></svg>
          Today's Agenda
        </div>
        <div class="nav-item view" data-k="view-compliance">
          <svg viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5z"/><path d="m9 12 2 2 4-4"/></svg>
          Compliance First
        </div>
        <div class="nav-item view" data-k="view-ai">
          <svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4v0a4 4 0 0 0 2 3.5V17a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2.5A4 4 0 0 0 20 11a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/></svg>
          AI Assistant
        </div>
        <div class="nav-item view" data-k="view-calendar">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><rect x="7" y="13" width="3" height="3"/><rect x="14" y="13" width="3" height="3"/></svg>
          Weekly Calendar
        </div>`;
      compTaxes.insertAdjacentHTML('afterend', VIEWS);
    }
    const NAV_HREFS = {
      home:              'index.html',
      bookings:          'bookings.html',
      properties:        'properties.html',
      'view-agenda':     'index.html?view=agenda',
      'view-compliance': 'index.html?view=compliance',
      'view-ai':         'index.html?view=ai',
      'view-calendar':   'index.html?view=calendar',
    };
    document.querySelectorAll('.l1 .nav-item').forEach(n => n.addEventListener('click', () => {
      document.querySelectorAll('.l1 .nav-item').forEach(x => x.classList.remove('active'));
      n.classList.add('active');
      const href = NAV_HREFS[n.getAttribute('data-k')];
      if (href) (window.top || window).location.href = href;
    }));
    initSupportMenu();
  }

  function initSupportMenu(){
    const btn = document.querySelector('header.top button.iconbtn[aria-label="Help"]');
    if (!btn || document.getElementById('supportMenu')) return;
    btn.setAttribute('aria-label', 'Support');
    btn.setAttribute('title', 'Support');
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');

    const menu = document.createElement('div');
    menu.id = 'supportMenu';
    menu.className = 'support-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
      <div class="sm-head">Support</div>
      <div class="sm-item" role="menuitem" tabindex="0">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <div class="sm-txt"><div class="t">Talk to an agent</div><div class="d">Average reply ~3 min</div></div>
      </div>
      <div class="sm-item" role="menuitem" tabindex="0">
        <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        <div class="sm-txt"><div class="t">Help Center</div><div class="d">Guides, setup & troubleshooting</div></div>
      </div>
      <div class="sm-item" role="menuitem" tabindex="0">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4M12 17h.01"/></svg>
        <div class="sm-txt"><div class="t">FAQs</div><div class="d">Quick answers to common questions</div></div>
      </div>
      <div class="sm-item" role="menuitem" tabindex="0">
        <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/></svg>
        <div class="sm-txt"><div class="t">Video tutorials</div><div class="d">Watch how things work</div></div>
      </div>`;
    document.body.appendChild(menu);

    function place(){
      const r = btn.getBoundingClientRect();
      menu.style.top = (r.bottom + 8) + 'px';
      menu.style.right = (window.innerWidth - r.right) + 'px';
    }
    function close(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    function open(){ place(); menu.classList.add('open'); btn.setAttribute('aria-expanded','true'); }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', e => {
      if (!menu.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (menu.classList.contains('open')) place(); });
    window.addEventListener('scroll', () => { if (menu.classList.contains('open')) place(); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
