/* ============================================================
   Guest CRM — shared UI helpers (window.CRM)
   Formatting, badge renderers, sub-nav, toast, and the guest
   profile drawer. Loaded after the data/service/agent layer.
   ============================================================ */
(function () {
  'use strict';
  var S = window.CRMService, A = window.CRMAgent, D = window.CRM_DATA;

  // ---------- feature flag ----------
  var FLAGS = { guestCrmEnabled: true };

  // ---------- formatting ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n, cur) { return (cur === 'EUR' || !cur ? '€' : cur + ' ') + Number(n || 0).toLocaleString('en-GB'); }
  function initials(name) { return (name || '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function titleStage(s) { return ({ lead: 'Lead', prospect: 'Prospect', guest: 'Guest', in_house: 'In-house', past: 'Past guest', repeat: 'Repeat', vip: 'VIP', dormant: 'Dormant', couple: 'Couple', business: 'Business' }[s] || s); }
  function relDate(dateStr) {
    if (!dateStr) return '—';
    var t = new Date(D.today), d = new Date(dateStr);
    var diff = Math.round((d - t) / 864e5);
    var nice = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1 && diff <= 14) return 'in ' + diff + 'd · ' + nice;
    if (diff < -1 && diff >= -14) return diff * -1 + 'd ago · ' + nice;
    return nice + ' ' + d.getFullYear();
  }
  function pct(x) { return Math.round((x || 0) * 100) + '%'; }

  // ---------- icons ----------
  var I = {
    spark: '<svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/><path d="M19 15 19.8 17.5 22 18.2 19.8 19 19 21.5 18.2 19 16 18.2 18.2 17.5 Z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    q: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  };

  // ---------- badges ----------
  function statusBadge(status) {
    var label = { draft: 'Draft', needs_review: 'Needs review', approved: 'Approved', scheduled: 'Scheduled', active: 'Active', paused: 'Paused', completed: 'Completed' }[status] || status;
    return '<span class="badge sb-' + status + '"><span class="dot"></span>' + esc(label) + '</span>';
  }
  function consentBadges(summary, opts) {
    opts = opts || {};
    if (summary.globalUnsubscribe) return '<span class="cbadge denied">' + I.x + ' Unsubscribed (all)</span>';
    function one(label, st) {
      var ic = st === 'granted' ? I.check : st === 'denied' ? I.x : I.q;
      return '<span class="cbadge ' + st + '">' + ic + ' ' + label + '</span>';
    }
    var out = [one('Email', summary.emailMarketing), one('WhatsApp', summary.whatsappMarketing)];
    if (!opts.compact) out.push(one('SMS', summary.smsMarketing));
    return out.join('');
  }
  function tagPills(tags) { return (tags || []).map(function (t) { return '<span class="pill">' + esc(t.replace(/_/g, ' ')) + '</span>'; }).join(''); }

  function aiBlock(text, opts) {
    opts = opts || {};
    return '<div class="ai-block"><div class="spark">' + I.spark + '</div><div class="tx"><b>Vela · </b>' + text + (opts.why ? ' <span class="why" title="' + esc(opts.why) + '">' + I.info + ' Why?</span>' : '') + '</div></div>';
  }

  // ---------- sub-nav (CRM area tabs) ----------
  var ROUTES = [
    { k: 'overview', label: 'Overview', href: 'index.html' },
    { k: 'guests', label: 'Guests', href: 'guests.html' },
    { k: 'segments', label: 'Segments', href: 'segments.html' },
    { k: 'campaigns', label: 'Campaigns', href: 'campaigns.html' },
    { k: 'deals', label: 'Deals', href: 'deals.html' },
    { k: 'automation', label: 'Automation', href: 'automation.html' },
    { k: 'consent', label: 'Consent', href: 'consent.html' }
  ];
  function subnav(active) {
    return '<div class="crm-subnav">' + ROUTES.map(function (r) {
      return '<a class="crm-tab' + (r.k === active ? ' active' : '') + '" href="' + r.href + '">' + r.label + '</a>';
    }).join('') + '</div>';
  }
  function mountSubnav(active) {
    var slot = document.getElementById('crm-subnav');
    if (slot) slot.outerHTML = subnav(active);
  }

  // ---------- demo banner ----------
  function demoBanner() {
    return '<div class="demobar"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
      '<span><b>Demo mode</b> · Guest CRM is running on realistic mock data. AI drafts campaigns and recommendations; nothing is sent — you approve before activation.</span></div>';
  }

  // ---------- toast ----------
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = I.check + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 250); }, 2600);
  }

  // ---------- drawer ----------
  function ensureDrawerRoot() {
    var root = document.getElementById('crm-drawer-root');
    if (!root) { root = document.createElement('div'); root.id = 'crm-drawer-root'; document.body.appendChild(root); }
    return root;
  }
  function openDrawer(html, footHtml) {
    var root = ensureDrawerRoot();
    root.innerHTML =
      '<div class="drawer-backdrop" data-drawer-close></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true">' + html +
      (footHtml ? '<div class="dfoot">' + footHtml + '</div>' : '') + '</aside>';
    requestAnimationFrame(function () {
      root.querySelector('.drawer-backdrop').classList.add('open');
      root.querySelector('.drawer').classList.add('open');
    });
    root.querySelector('[data-drawer-close]').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', escClose);
  }
  function closeDrawer() {
    var root = document.getElementById('crm-drawer-root'); if (!root) return;
    var d = root.querySelector('.drawer'), b = root.querySelector('.drawer-backdrop');
    if (d) d.classList.remove('open'); if (b) b.classList.remove('open');
    document.removeEventListener('keydown', escClose);
    setTimeout(function () { root.innerHTML = ''; }, 260);
  }
  function escClose(e) { if (e.key === 'Escape') closeDrawer(); }

  // ---------- guest profile drawer (reused by Guests + Dashboard) ----------
  function openGuestDrawer(guestId) {
    var g = S.getGuestById(guestId); if (!g) return;
    var summary = A.buildGuestSummary(g);
    var res = S.getGuestReservations(guestId);
    var prefs = S.getGuestPreferences(guestId);
    var purchases = S.getGuestPurchases(guestId);
    var timeline = S.getGuestTimeline(guestId).slice(0, 8);
    var camps = S.getGuestCampaigns(guestId);

    var head =
      '<div class="dhead">' +
        '<div class="gav" style="width:48px;height:48px;font-size:16px">' + initials(g.fullName) + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font:600 18px var(--font-primary);display:flex;align-items:center;gap:8px">' + esc(g.fullName) + ' <span style="font-size:15px">' + g.flag + '</span></div>' +
          '<div class="tiny" style="margin-top:3px">' + esc(g.email) + ' · ' + esc(g.phone) + '</div>' +
          '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
            '<span class="badge blue">' + esc(titleStage(g.lifecycleStage)) + '</span>' +
            (g.nextStayAt ? '<span class="badge violet">Next stay ' + relDate(g.nextStayAt) + '</span>' : '') +
            '<span class="badge gray">' + esc(g.languageName) + '</span>' +
          '</div>' +
        '</div>' +
        '<button class="dclose" data-drawer-close>' + I.x + '</button>' +
      '</div>';

    function section(title, body) { return '<div class="card"><div class="hd"><h3>' + title + '</h3></div><div class="bd">' + body + '</div></div>'; }

    var aiHtml = aiBlock(esc(summary.headline), { why: summary.reasoningSummary }) +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + g.tags.map(function (t) { return '<span class="pill">' + esc(t.replace(/_/g, ' ')) + '</span>'; }).join('') + '</div>';

    var consentHtml = '<div class="consent-row">' + consentBadges(g.consentSummary) + '</div>';

    var oppHtml = g.recommendedActions.map(function (a) {
      return '<div class="opp"><div class="ic">' + I.spark + '</div><div class="tx"><div class="t">' + esc(a.label) + '</div><div class="r">' + esc(a.reason) + '</div></div>' + (a.estimatedRevenue ? '<div class="est">+' + money(a.estimatedRevenue) + '</div>' : '') + '</div>';
    }).join('');

    var resHtml = res.length ? res.map(function (r) {
      return '<div class="opp" style="border-style:solid"><div class="ic" style="background:var(--bg-violet-light);color:var(--text-violet)"><svg viewBox="0 0 24 24" style="width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><div class="tx"><div class="t">' + esc(r.propertyName) + ' · ' + esc(r.roomType) + '</div><div class="r">' + relDate(r.checkInDate) + ' → ' + relDate(r.checkOutDate) + ' · ' + r.nights + 'n · ' + esc(r.bookingReference) + '</div></div><div class="est" style="color:var(--text-dark)">' + money(r.totalValue) + '</div></div>';
    }).join('') : '<div class="tiny">No reservations on record.</div>';

    var prefHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap">' + prefs.map(function (p) { return '<span class="pill">' + esc(p.key.replace(/_/g, ' ')) + ': ' + esc(p.value) + ' <span class="src">' + esc(p.source) + '</span></span>'; }).join('') + '</div>';

    var buyHtml = purchases.length ? purchases.map(function (p) { return '<div class="opp"><div class="ic" style="background:var(--bg-success-light);color:var(--text-success)"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8"><path d="M20.6 8.4 12 17 3.4 8.4"/><path d="M3 8h18l-1 4H4z"/></svg></div><div class="tx"><div class="t">' + esc(p.dealTitle) + '</div><div class="r">' + relDate(p.purchasedAt) + ' · ' + esc(p.channel) + '</div></div><div class="est">' + money(p.amount) + '</div></div>'; }).join('') : '<div class="tiny">No App Sales purchases yet.</div>';

    var tlHtml = '<div class="timeline">' + timeline.map(function (e) {
      return '<div class="tl-item ' + e.type + '"><div class="dot">' + (I[e.icon] || I.info) + '</div><div class="ct"><div class="t">' + esc(e.title) + (e.sentiment ? ' <span class="badge ' + (e.sentiment === 'positive' ? 'green' : e.sentiment === 'negative' ? 'red' : 'gray') + '">' + e.sentiment + '</span>' : '') + '</div><div class="d">' + esc(e.detail) + '</div><div class="when">' + relDate(e.at) + '</div></div></div>';
    }).join('') + '</div>';

    var campHtml = camps.length ? camps.map(function (c) { return '<div class="opp"><div class="tx"><div class="t">' + esc(c.name) + '</div><div class="r">' + esc(c.objective) + ' · ' + esc(c.channel) + '</div></div>' + statusBadge(c.status) + '</div>'; }).join('') : '<div class="tiny">Not in any campaign yet.</div>';

    var body =
      '<div class="dbody">' +
        section('AI summary', aiHtml) +
        section('Consent', consentHtml) +
        section('Recommended actions', oppHtml) +
        section('Reservations', resHtml) +
        section('Preferences', prefHtml) +
        section('App Sales purchases', buyHtml) +
        section('Campaign history', campHtml) +
        section('Timeline', tlHtml) +
      '</div>';

    var foot =
      '<button class="btn-primary" onclick="CRM.toast(\'Opening Campaign Studio for this guest…\');setTimeout(function(){location.href=\'campaign-new.html?guest=' + g.id + '\'},600)">' + I.spark + ' Create campaign for this guest</button>' +
      '<button class="tbtn" onclick="CRM.toast(\'Finding similar guests…\')">Find similar guests</button>';

    openDrawer(head + body, foot);
  }

  // ---------- boot ----------
  function boot(opts) {
    opts = opts || {};
    if (opts.active) mountSubnav(opts.active);
    var demoSlot = document.getElementById('crm-demo');
    if (demoSlot) demoSlot.outerHTML = demoBanner();
  }

  window.CRM = {
    flags: FLAGS, icons: I,
    esc: esc, money: money, initials: initials, titleStage: titleStage, relDate: relDate, pct: pct,
    statusBadge: statusBadge, consentBadges: consentBadges, tagPills: tagPills, aiBlock: aiBlock,
    subnav: subnav, mountSubnav: mountSubnav, demoBanner: demoBanner, toast: toast,
    openDrawer: openDrawer, closeDrawer: closeDrawer, openGuestDrawer: openGuestDrawer,
    boot: boot, ROUTES: ROUTES
  };
})();
