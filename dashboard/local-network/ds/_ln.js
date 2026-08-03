/* ============================================================
   Local Network — shared UI helpers (window.LN)
   Formatting, status pills, the breakdown-chain renderer, score
   gauge, hand-rolled SVG charts, sub-nav, persona switcher, drawer
   and toast. Loaded after the data / service / agent layer.

   Money is formatted in exactly one place (LN.money) and a
   percentage is never printed bare — LN.chain renders the whole
   explanation, because every rate has to be readable on the line.
   ============================================================ */
(function () {
  'use strict';
  var S = window.NetworkService, C = window.LN_CONFIG, D = S._dataset;

  // ---------- formatting ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n, opts) {
    opts = opts || {};
    var v = Number(n || 0);
    var sym = (opts.currency || D.currency) === 'EUR' ? '€' : (opts.currency || D.currency) + ' ';
    var dec = opts.cents ? 2 : (Math.abs(v) < 100 && v % 1 !== 0 ? 2 : 0);
    return sym + v.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function pct(n, dp) { return Number(n || 0).toFixed(dp == null ? 1 : dp) + '%'; }
  function num(n) { return Number(n || 0).toLocaleString('en-GB'); }
  function relDate(s) {
    if (!s) return '—';
    var t = new Date(D.today), d = new Date(String(s).slice(0, 10));
    var diff = Math.round((d - t) / 864e5);
    var nice = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1 && diff <= 30) return 'in ' + diff + 'd';
    if (diff < -1 && diff >= -30) return -diff + 'd ago';
    return nice + ' ' + d.getFullYear();
  }
  function monthLabel(m) {
    var d = new Date(m + '-01T00:00:00Z');
    return d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }) + (d.getUTCMonth() === 0 ? " '" + String(d.getUTCFullYear()).slice(2) : '');
  }
  var CAT = { storage: 'Storage', dining: 'Dining', wellness: 'Wellness', equipment: 'Equipment', pet: 'Pet care', experience: 'Experience', tickets: 'Tickets', transfer: 'Transfer', mobility: 'Mobility' };
  function catLabel(c) { return CAT[c] || String(c || '').replace(/_/g, ' '); }
  function categories() { var k, out = []; for (k in CAT) if (Object.prototype.hasOwnProperty.call(CAT, k)) out.push(k); return out; }
  function stateLabel(s) {
    return ({ draft: 'Draft', screening: 'Screening', pending_supplier: 'Awaiting supplier', onboarding: 'Onboarding',
      live: 'Live', watch: 'Watch', suspended: 'Suspended', terminated: 'Terminated', expired: 'Expired',
      dormant: 'Dormant', released: 'Released' })[s] || s;
  }
  function modeLabel(m) { return ({ private: 'Private', network: 'Network', delayed: 'Delayed' })[m] || m; }

  // ---------- icons ----------
  var I = {
    spark: '<svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/><path d="M19 15 19.8 17.5 22 18.2 19.8 19 19 21.5 18.2 19 16 18.2 18.2 17.5 Z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5z"/><path d="m9 12 2 2 4-4"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M9 3 3 5.5v16L9 19l6 2.5 6-2.5v-16L15 5.5 9 3z"/><path d="M9 3v16M15 5.5v16"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9.5A2.5 2.5 0 0 0 12 8h-.5a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4H12a2.5 2.5 0 0 1-2.5-1.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 3.6a3.2 3.2 0 0 1 0 6.2M18.5 20a5.5 5.5 0 0 0-3.2-5"/></svg>',
    store: '<svg viewBox="0 0 24 24"><path d="M3 9 4.5 4h15L21 9"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M3 9h18M9 21v-6h6v6"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>',
    block: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.8z"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>'
  };

  // ---------- status pills ----------
  function statePill(state, extra) {
    return '<span class="badge st-' + esc(state) + '"><span class="dot"></span>' + esc(stateLabel(state)) + (extra ? ' · ' + esc(extra) : '') + '</span>';
  }
  function countdownChip(claim) {
    var cd = S.countdownFor(claim);
    if (!cd) return '';
    var cls = cd.overdue ? 'over' : cd.days <= 10 ? 'warn' : '';
    var txt = cd.overdue ? Math.abs(cd.days) + 'd overdue' : cd.days + 'd ' + cd.label;
    return '<span class="cdown ' + cls + '">' + I.clock + esc(txt) + '</span>';
  }
  function modePill(mode) {
    var cls = mode === 'network' ? 'brand' : mode === 'delayed' ? 'violet' : '';
    return '<span class="pill ' + cls + '">' + esc(modeLabel(mode)) + '</span>';
  }

  /* ============================================================
     THE BREAKDOWN CHAIN
     Renders an Accrual.chain as a readable formula, e.g.
     4.0% base × 1.25 excellent quality × 0.80 decay → capped at 5.0% → €4.50
     A percentage never appears in this module without its chain.
     ============================================================ */
  function chain(accrual, opts) {
    opts = opts || {};
    if (!accrual) return '';
    if (accrual.blockedReason) {
      return '<div class="chainrow' + (opts.small ? ' sm' : '') + '">' +
        '<span class="seg zero">' + esc(accrual.blockedReason) + '</span></div>';
    }
    var parts = accrual.chain.map(function (s, i) {
      var op = i === 0 ? '' : (s.kind === 'cap' || s.kind === 'result') ? '<span class="op">→</span>' : '<span class="op">×</span>';
      var body;
      if (s.kind === 'base') body = pct(s.value) + ' <span class="lbl">base</span>';
      else if (s.kind === 'cap') body = '<span class="lbl">capped at</span> ' + pct(s.value);
      else if (s.kind === 'result') body = money(s.value, { cents: opts.cents !== false });
      // the operator span already carries the ×, so the value must not repeat it
      else body = s.value.toFixed(2) + ' <span class="lbl">' + esc(s.label) + '</span>';
      return op + '<span class="seg ' + s.kind + '">' + body + '</span>';
    }).join('');
    return '<div class="chainrow' + (opts.small ? ' sm' : '') + '">' + parts + '</div>';
  }
  /** The chain for a claim right now, per €100 of GMV — the comparable rate. */
  function chainForClaim(claim, opts) {
    var sup = S.getSupplierById(claim.supplierId);
    var dest = sup ? S.getDestinationById(sup.destinationId) : null;
    return chain(S.computeAccrual(100, claim, sup, dest), opts);
  }

  // ---------- score gauge & drivers ----------
  function bandClass(label) { return 'band-' + String(label).toLowerCase().replace(/\s+/g, '-'); }
  function strokeClass(label) { return 'stroke-' + String(label).toLowerCase().replace(/\s+/g, '-'); }
  function gauge(score) {
    var band = S.qualityBand(score);
    var R = 32, CIRC = 2 * Math.PI * R, on = CIRC * Math.max(0, Math.min(1, score));
    return '<div class="gauge">' +
      '<div class="ring"><svg viewBox="0 0 76 76">' +
        '<circle cx="38" cy="38" r="' + R + '" fill="none" stroke="#EFEFF7" stroke-width="7"/>' +
        '<circle cx="38" cy="38" r="' + R + '" fill="none" class="' + strokeClass(band.label) + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + on.toFixed(1) + ' ' + CIRC.toFixed(1) + '"/>' +
      '</svg><div class="val"><span class="n">' + score.toFixed(2) + '</span><span class="u">score</span></div></div>' +
      '<div class="meta"><div class="band ' + bandClass(band.label) + '">' + esc(band.label) + '</div>' +
        '<div class="mult">×' + band.multiplier.toFixed(2) + ' quality multiplier</div>' +
        '<div class="tiny" style="margin-top:3px">Band ' + band.min.toFixed(2) + '–' + band.max.toFixed(2) + '</div></div></div>';
  }
  var DRIVERS = [
    { k: 'confirmLatency', l: 'Confirmation latency' }, { k: 'cancellationRate', l: 'Cancellation rate' },
    { k: 'noShowRate', l: 'No-show rate' }, { k: 'guestRating', l: 'Guest rating' }, { k: 'disputeRate', l: 'Dispute rate' }
  ];
  function drivers(breakdown) {
    return '<div class="drivers">' + DRIVERS.map(function (d) {
      var v = breakdown[d.k] || 0;
      var cls = v < 0.6 ? 'bad' : v < 0.75 ? 'low' : '';
      return '<div class="driver ' + cls + '"><div class="dl">' + esc(d.l) + '</div>' +
        '<div class="db"><i style="width:' + (v * 100).toFixed(0) + '%"></i></div>' +
        '<div class="dv">' + v.toFixed(2) + '</div></div>';
    }).join('') + '</div>';
  }

  // ---------- charts (hand-rolled SVG, no libraries) ----------
  function sparkline(values, opts) {
    opts = opts || {};
    var vals = (values || []).slice();
    if (vals.length < 2) vals = [0, 0];
    var W = 88, H = 26, max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    var span = (max - min) || 1;
    var pts = vals.map(function (v, i) {
      return [(i / (vals.length - 1)) * W, H - ((v - min) / span) * (H - 4) - 2];
    });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var rising = vals[vals.length - 1] >= vals[0];
    var col = opts.color || (rising ? '#0F9F80' : '#FF2467');
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + pts[pts.length - 1][0].toFixed(1) + '" cy="' + pts[pts.length - 1][1].toFixed(1) + '" r="2.2" fill="' + col + '"/></svg>';
  }

  /** The decay curve: residual over N years with the decay steps marked. */
  function decayCurve(series, opts) {
    opts = opts || {};
    if (!series || !series.length) return '<div class="tiny">No projection available for this claim.</div>';
    var W = 640, H = 210, P = { l: 52, r: 18, t: 18, b: 34 };
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var max = Math.max.apply(null, series.map(function (s) { return s.amount; })) || 1;
    max = max * 1.15;
    function x(i) { return P.l + (series.length === 1 ? iw / 2 : (i / (series.length - 1)) * iw); }
    function y(v) { return P.t + ih - (v / max) * ih; }
    var line = series.map(function (s, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(s.amount).toFixed(1); }).join(' ');
    var area = line + ' L' + x(series.length - 1).toFixed(1) + ' ' + (P.t + ih) + ' L' + x(0).toFixed(1) + ' ' + (P.t + ih) + ' Z';
    var grid = '', i;
    for (i = 0; i <= 3; i++) {
      var gv = max * i / 3, gy = y(gv);
      grid += '<line class="grid" x1="' + P.l + '" y1="' + gy.toFixed(1) + '" x2="' + (W - P.r) + '" y2="' + gy.toFixed(1) + '"/>' +
        '<text class="axis" x="' + (P.l - 8) + '" y="' + (gy + 3.5).toFixed(1) + '" text-anchor="end">' + money(Math.round(gv)) + '</text>';
    }
    var marks = '', lastStep = null;
    series.forEach(function (s, idx) {
      if (s.decayStep !== lastStep) {
        lastStep = s.decayStep;
        marks += '<line class="stepline" x1="' + x(idx).toFixed(1) + '" y1="' + P.t + '" x2="' + x(idx).toFixed(1) + '" y2="' + (P.t + ih) + '"/>' +
          '<text class="steplbl" x="' + (x(idx) + 5).toFixed(1) + '" y="' + (P.t + 11) + '">' + esc(pct(s.poolPct) + ' · step ' + s.decayStep) + '</text>';
      }
    });
    var pts = series.map(function (s, idx) { return '<circle class="pt" cx="' + x(idx).toFixed(1) + '" cy="' + y(s.amount).toFixed(1) + '" r="4"/>'; }).join('');
    var xlab = series.map(function (s, idx) { return '<text class="axis" x="' + x(idx).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">Year ' + s.year + '</text>'; }).join('');
    return '<div class="chartwrap"><svg class="decaychart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Projected residual by year">' +
      '<defs><linearGradient id="lnGrad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#385BF8" stop-opacity=".22"/><stop offset="100%" stop-color="#385BF8" stop-opacity="0"/>' +
      '</linearGradient></defs>' + grid + marks +
      '<path class="area" d="' + area + '"/><path class="line" d="' + line + '"/>' + pts + xlab + '</svg></div>';
  }

  /** Monthly residual bars. `series` is [{month, amount}]. */
  function barChart(series) {
    if (!series || !series.length) return '<div class="tiny">No earnings recorded yet.</div>';
    var W = 640, H = 150, P = { l: 44, r: 10, t: 12, b: 24 };
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var max = Math.max.apply(null, series.map(function (s) { return s.amount; })) || 1;
    var bw = Math.max(3, iw / series.length - 4);
    var bars = series.map(function (s, i) {
      var h = Math.max(1, (s.amount / max) * ih);
      var bx = P.l + (i / series.length) * iw;
      return '<rect class="' + (i === series.length - 1 ? '' : 'dim') + '" x="' + bx.toFixed(1) + '" y="' + (P.t + ih - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2"><title>' + esc(monthLabel(s.month) + ' · ' + money(s.amount)) + '</title></rect>';
    }).join('');
    var labels = series.map(function (s, i) {
      if (i % 3 !== 0) return '';
      var bx = P.l + (i / series.length) * iw + bw / 2;
      return '<text class="axis" x="' + bx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(monthLabel(s.month)) + '</text>';
    }).join('');
    return '<div class="chartwrap"><svg class="barchart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Residual by month">' +
      '<line class="grid" x1="' + P.l + '" y1="' + (P.t + ih) + '" x2="' + (W - P.r) + '" y2="' + (P.t + ih) + '" stroke="#E5E6EE"/>' +
      '<text class="axis" x="' + (P.l - 6) + '" y="' + (P.t + 8) + '" text-anchor="end">' + money(Math.round(max)) + '</text>' +
      bars + labels + '</svg></div>';
  }

  /** Coverage circle over a grid, with the properties it reaches. */
  function coverageMap(km, capKm, inCoverage, totalProps) {
    var ratio = Math.max(0.12, Math.min(1, km / capKm));
    var size = 40 + ratio * 130;
    var dots = '';
    for (var i = 0; i < Math.min(totalProps, 40); i++) {
      var a = (i * 137.5) * Math.PI / 180, r = 8 + (i / 40) * 46;
      var px = 50 + Math.cos(a) * r, py = 50 + Math.sin(a) * r * 0.62;
      var inside = (i / Math.min(totalProps, 40)) < (inCoverage / Math.max(1, totalProps));
      dots += '<i class="prop' + (inside ? '' : ' out') + '" style="left:' + px.toFixed(1) + '%;top:' + py.toFixed(1) + '%"></i>';
    }
    return '<div class="covmap">' + dots +
      '<div class="circle" style="width:' + size.toFixed(0) + 'px;height:' + size.toFixed(0) + 'px"></div><div class="pin"></div>' +
      '<div class="lg"><span style="color:#0F9F80">■ in coverage</span><span style="color:#CECEDE">■ outside</span></div></div>';
  }

  /** The split bar. Proves visually that the residual is funded by the extra
   *  premium and NOT by carving into anyone else's share. */
  function splitBar(opts) {
    opts = opts || {};
    var base = C.baseNrpPctOfGmv;
    var hostPct = base * C.servingPropertySharePctOfExternalNrp / 100;
    var pmsPct = base * C.pmsPartnerSharePctOfNrp / 100;
    var chekinPct = base - hostPct - pmsPct;
    var poolPct = opts.poolPct != null ? opts.poolPct : 0;
    var total = base + (opts.network ? C.networkPremiumPctOfGmv : 0);
    function w(v) { return (v / total * 100).toFixed(2) + '%'; }
    var premiumRest = opts.network ? C.networkPremiumPctOfGmv - poolPct : 0;
    return '<div class="splitbar">' +
      '<span class="s-host" style="width:' + w(hostPct) + '">' + pct(hostPct) + '</span>' +
      '<span class="s-pms" style="width:' + w(pmsPct) + '">' + pct(pmsPct) + '</span>' +
      '<span class="s-chekin" style="width:' + w(chekinPct + premiumRest) + '">' + pct(chekinPct + premiumRest) + '</span>' +
      (poolPct > 0 ? '<span class="s-pool" style="width:' + w(poolPct) + '">' + pct(poolPct) + '</span>' : '') +
    '</div>' +
    '<div class="splitlegend">' +
      '<span><i style="background:#0F9F80"></i>Serving host ' + pct(hostPct) + ' of GMV</span>' +
      '<span><i style="background:#6B4FD8"></i>PMS partner ' + pct(pmsPct) + '</span>' +
      '<span><i style="background:#385BF8"></i>Chekin ' + pct(chekinPct + premiumRest) + '</span>' +
      (poolPct > 0 ? '<span><i style="background:#C47A1B"></i>Sourcing pool ' + pct(poolPct) + '</span>' : '') +
    '</div>';
  }

  // ---------- sub-nav ----------
  var ROUTES = [
    { k: 'overview', label: 'Overview', href: 'index-firstpass.html' },
    { k: 'supply-book', label: 'Supply book', href: 'supply-book.html' },
    { k: 'discover', label: 'Discover', href: 'discover.html' },
    { k: 'bounties', label: 'Bounties', href: 'bounties.html' },
    { k: 'submit', label: 'Submit a supplier', href: 'submit.html', personas: ['host', 'pm'] },
    { k: 'admin', label: 'Admin review', href: 'admin-review.html', personas: ['admin', 'chekin'] }
  ];
  function subnav(active) {
    var p = S.getPersona();
    return '<div class="ln-subnav">' + ROUTES.filter(function (r) { return !r.personas || r.personas.indexOf(p) >= 0; })
      .map(function (r) { return '<a class="ln-tab' + (r.k === active ? ' active' : '') + '" href="' + r.href + '">' + esc(r.label) + '</a>'; })
      .join('') + '</div>';
  }

  // ---------- persona switcher ----------
  var PERSONA_LABEL = { host: 'Host', pm: 'Property manager', supplier: 'Supplier', chekin: 'Chekin', admin: 'Admin' };
  var PERSONA_WHO = {
    host: 'A single-property owner — your suppliers, your earnings, gaps near you.',
    pm: 'A multi-property portfolio — the full supply book and coverage across properties.',
    supplier: 'The provider’s own view — confirm a claim, complete a profile, see bookings.',
    chekin: 'Internal staff — destination coverage, bounties and the supplier pipeline.',
    admin: 'Claim review, exclusion hits, self-dealing flags and suspensions.'
  };
  function personaBar() {
    var cur = S.getPersona(), acct = S.currentAccount();
    return '<div class="ln-personabar" id="ln-personabar">' +
      '<span class="lbl">' + I.users + 'Viewing as</span>' +
      '<div class="ln-personas">' + S.personas.map(function (p) {
        return '<button class="ln-persona' + (p === cur ? ' active' : '') + '" data-persona="' + p + '">' + esc(PERSONA_LABEL[p]) + '</button>';
      }).join('') + '</div>' +
      '<span class="who">' + (acct ? '<b>' + esc(acct.name) + '</b> · ' : '') + esc(PERSONA_WHO[cur]) + '</span>' +
      (S.hasSnapshot() && !S.isFirstRun()
        ? '<button class="tbtn sm" id="ln-reset" title="Discard everything created or changed in this demo session">Reset demo</button>' : '') +
    '</div>';
  }
  function mountPersonaBar() {
    var slot = document.getElementById('ln-persona');
    if (!slot) return;
    slot.outerHTML = personaBar();
    var bar = document.getElementById('ln-personabar');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      if (e.target.closest('#ln-reset')) { S.resetDemo(); return; }
      var b = e.target.closest('[data-persona]'); if (!b) return;
      S.setPersona(b.getAttribute('data-persona'));
      location.reload();
    });
  }

  // ---------- first-run bar ----------
  function firstRunBar() {
    if (!S.isFirstRun()) return '';
    return '<div class="ln-personabar" style="background:linear-gradient(90deg,#FFF2E0,#FFE4EC)">' +
      '<span class="lbl" style="color:var(--text-amber)">' + I.info + 'First-run mode</span>' +
      '<span class="who">Every page is showing its true empty state — the programme launches with no claims and no earnings.</span>' +
      '<button class="tbtn sm" id="ln-exit-firstrun">Load the demo dataset</button></div>';
  }
  function mountFirstRunBar() {
    var slot = document.getElementById('ln-firstrun');
    if (!slot) return;
    slot.outerHTML = firstRunBar();
    var b = document.getElementById('ln-exit-firstrun');
    if (b) b.addEventListener('click', function () { S.setFirstRun(false); });
  }

  // ---------- toast ----------
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = I.check + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 250); }, 3000);
  }

  // ---------- drawer ----------
  function ensureDrawerRoot() {
    var root = document.getElementById('ln-drawer-root');
    if (!root) { root = document.createElement('div'); root.id = 'ln-drawer-root'; document.body.appendChild(root); }
    return root;
  }
  function openDrawer(html, footHtml) {
    var root = ensureDrawerRoot();
    root.innerHTML = '<div class="drawer-backdrop" data-drawer-close></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true">' + html +
      (footHtml ? '<div class="dfoot">' + footHtml + '</div>' : '') + '</aside>';
    requestAnimationFrame(function () {
      root.querySelector('.drawer-backdrop').classList.add('open');
      root.querySelector('.drawer').classList.add('open');
    });
    root.querySelectorAll('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', escClose);
  }
  function closeDrawer() {
    var root = document.getElementById('ln-drawer-root'); if (!root) return;
    var d = root.querySelector('.drawer'), b = root.querySelector('.drawer-backdrop');
    if (d) d.classList.remove('open'); if (b) b.classList.remove('open');
    document.removeEventListener('keydown', escClose);
    setTimeout(function () { root.innerHTML = ''; }, 260);
  }
  function escClose(e) { if (e.key === 'Escape') closeDrawer(); }
  function section(title, inner, act) {
    return '<div class="card"><div class="hd"><h3>' + title + '</h3>' + (act ? '<div class="act">' + act + '</div>' : '') + '</div><div class="bd">' + inner + '</div></div>';
  }

  /** The "see the maths" drawer — the proof behind invariant #2. */
  function openEconomicsDrawer(ctx) {
    ctx = ctx || {};
    var sampleGmv = ctx.gmv || 100;
    var poolPct = ctx.poolPct != null ? ctx.poolPct : C.basePoolPctOfGmv;
    var base = C.baseNrpPctOfGmv;
    var hostPct = base * C.servingPropertySharePctOfExternalNrp / 100;
    var head = '<div class="dhead"><div style="flex:1;min-width:0">' +
      '<div style="font:600 18px var(--font-primary)">How a network booking splits</div>' +
      '<div class="tiny" style="margin-top:3px">On a sample ' + money(sampleGmv) + ' booking' + (ctx.supplierName ? ' with ' + esc(ctx.supplierName) : '') + '</div>' +
      '</div><button class="dclose" data-drawer-close>' + I.x + '</button></div>';
    var rows = '<div class="kv">' +
      '<div class="row"><div class="k">Booking value</div><div class="v">' + money(sampleGmv) + '</div></div>' +
      '<div class="row"><div class="k">Commission — central supply</div><div class="v">' + pct(base) + ' → ' + money(sampleGmv * base / 100, { cents: true }) + '</div></div>' +
      '<div class="row"><div class="k">Commission — network supply</div><div class="v">' + pct(base + C.networkPremiumPctOfGmv) + ' → ' + money(sampleGmv * (base + C.networkPremiumPctOfGmv) / 100, { cents: true }) + ' <span class="tiny">(the supplier accepts more because we bring demand they had no route to)</span></div></div>' +
      '<div class="row"><div class="k">Your share, either way</div><div class="v" style="color:var(--text-success);font-weight:700">' + pct(hostPct) + ' of GMV → ' + money(sampleGmv * hostPct / 100, { cents: true }) + '</div></div>' +
      '<div class="row"><div class="k">Sourcing pool</div><div class="v">' + pct(poolPct) + ' → ' + money(sampleGmv * poolPct / 100, { cents: true }) + ' <span class="tiny">(paid out of the extra ' + pct(C.networkPremiumPctOfGmv) + ', never out of your ' + pct(hostPct) + ')</span></div></div>' +
    '</div>';
    var body = '<div class="dbody">' +
      '<div class="ln-invariant"><div class="ic">' + I.shield + '</div><div class="tx">' +
        '<div class="t">Your share is identical on both sides</div>' +
        '<div class="d">' + pct(hostPct) + ' of GMV on centrally-sourced inventory, and ' + pct(hostPct) + ' of GMV on network inventory. The residual is funded entirely by the extra ' + pct(C.networkPremiumPctOfGmv) + ' the network supplier accepts.</div>' +
      '</div></div>' +
      section('Centrally-sourced booking', splitBar({ network: false })) +
      section('Network booking' + (ctx.supplierName ? ' · ' + esc(ctx.supplierName) : ''), splitBar({ network: true, poolPct: poolPct })) +
      section('Line by line', rows) +
      (ctx.chainHtml ? section('How that pool rate is reached', ctx.chainHtml) : '') +
    '</div>';
    openDrawer(head + body, '<button class="tbtn" data-drawer-close>Close</button>');
  }

  // ---------- small builders ----------
  function kpi(o) {
    return '<div class="kpi"><div class="ic ' + (o.ic || 'blue') + '"><svg viewBox="0 0 24 24">' + o.svg + '</svg></div>' +
      '<div><div class="v">' + o.v + (o.unit ? '<small>' + esc(o.unit) + '</small>' : '') + '</div>' +
      '<div class="l">' + esc(o.l) + '</div>' +
      (o.d ? '<div class="d ' + (o.dc || 'flat') + '">' + o.d + '</div>' : '') + '</div></div>';
  }
  function empty(o) {
    return '<div class="empty" style="grid-column:1/-1"><div class="ic">' + (o.icon || I.store) + '</div>' +
      '<h3>' + esc(o.title) + '</h3><p>' + o.body + '</p>' +
      (o.cta ? '<button class="btn-primary" style="margin-top:6px" onclick="' + o.cta.onclick + '">' + (o.cta.icon || I.plus) + ' ' + esc(o.cta.label) + '</button>' : '') + '</div>';
  }
  function supplierHref(s) { return 'supplier-detail.html?supplier=' + encodeURIComponent(s.id || s); }
  function feedKind(kind) {
    if (['live', 'confirmed', 'reinstated'].indexOf(kind) >= 0) return 'good';
    if (['watch', 'flagged', 'role_released'].indexOf(kind) >= 0) return 'warn';
    if (['suspended', 'terminated', 'expired'].indexOf(kind) >= 0) return 'bad';
    if (['dormant', 'released'].indexOf(kind) >= 0) return '';
    return 'info';
  }
  function feedIcon(kind) {
    return { live: I.check, confirmed: I.check, watch: I.warn, flagged: I.warn, suspended: I.block,
      terminated: I.x, expired: I.clock, created: I.plus, screened: I.shield, invited: I.arrow,
      onboarded: I.arrow, mode_changed: I.chart, role_released: I.warn, dormant: I.clock,
      released: I.clock, note: I.info }[kind] || I.info;
  }

  // ---------- boot ----------
  function boot(opts) {
    opts = opts || {};
    var slot = document.getElementById('ln-subnav');
    if (slot) slot.outerHTML = subnav(opts.active);
    mountPersonaBar();
    mountFirstRunBar();
  }

  window.LN = {
    icons: I, config: C, routes: ROUTES, personaLabel: PERSONA_LABEL,
    esc: esc, money: money, pct: pct, num: num, relDate: relDate, monthLabel: monthLabel,
    catLabel: catLabel, categories: categories, stateLabel: stateLabel, modeLabel: modeLabel,
    statePill: statePill, countdownChip: countdownChip, modePill: modePill,
    chain: chain, chainForClaim: chainForClaim,
    gauge: gauge, drivers: drivers, bandClass: bandClass,
    sparkline: sparkline, decayCurve: decayCurve, barChart: barChart, coverageMap: coverageMap, splitBar: splitBar,
    subnav: subnav, personaBar: personaBar, toast: toast,
    openDrawer: openDrawer, closeDrawer: closeDrawer, section: section, openEconomicsDrawer: openEconomicsDrawer,
    kpi: kpi, empty: empty, supplierHref: supplierHref, feedKind: feedKind, feedIcon: feedIcon,
    boot: boot
  };
})();
