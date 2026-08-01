/* ============================================================
   Local Network — Service Layer
   Single consumer of LN_DATA. Reads are synchronous against the
   in-memory fixtures, but every signature returns a plain value you
   can trivially wrap in a Promise when the real API lands.

   computeAccrual() is the ONLY place a residual euro is produced.
   Nothing else in the module may multiply a percentage by a GMV.
   ============================================================ */
(function () {
  'use strict';
  var C = window.LN_CONFIG;

  // ---------- first-run mode ----------
  // The programme launches empty. With the flag set the service serves a
  // dataset with no claims, no earnings and no network supply, so every page
  // shows its true pre-activation state. What survives is what genuinely
  // pre-exists: destinations, your properties, the centrally-sourced
  // marketplace, and the bounties Chekin publishes to bootstrap a destination.
  var FIRST_RUN = false;
  try {
    if (/[?&]first_run=1/.test(location.search)) { localStorage.setItem('ln_first_run', '1'); }
    FIRST_RUN = localStorage.getItem('ln_first_run') === '1';
  } catch (e) {}

  function emptyDataset(full) {
    var out = {}, k;
    for (k in full) if (Object.prototype.hasOwnProperty.call(full, k)) out[k] = full[k];
    out.suppliers = full.suppliers.filter(function (s) { return s.origin === 'central'; });
    out.claims = []; out.orderLines = []; out.activity = [];
    out.properties = full.properties.map(function (p) {
      return { id: p.id, name: p.name, city: p.city, country: p.country, accountId: p.accountId,
        destinationId: p.destinationId, geo: p.geo, blockedSupplierIds: [], blockedCategories: [] };
    });
    return out;
  }
  var D = FIRST_RUN ? emptyDataset(window.LN_DATA) : window.LN_DATA;

  // ---------- demo session persistence ----------
  // Fixtures are in-memory, so a claim created in the wizard would vanish the
  // moment you navigated. We snapshot only the mutable slices to localStorage
  // so a demo holds together across pages. Order lines are never written, and
  // nothing here is a substitute for a backend — resetDemo() wipes it.
  // Bump SNAP_VERSION whenever the fixture shape changes.
  var SNAP_KEY = 'ln_snapshot', SNAP_VERSION = 1;
  function snapshot() {
    if (FIRST_RUN) return;
    try {
      localStorage.setItem(SNAP_KEY, JSON.stringify({
        v: SNAP_VERSION, suppliers: D.suppliers, claims: D.claims, bounties: D.bounties,
        properties: D.properties, accounts: D.accounts, activity: D.activity.slice(0, 80)
      }));
    } catch (e) {}
  }
  function restore() {
    if (FIRST_RUN) return;
    try {
      var s = JSON.parse(localStorage.getItem(SNAP_KEY) || 'null');
      if (!s || s.v !== SNAP_VERSION) return;
      D.suppliers = s.suppliers; D.claims = s.claims; D.bounties = s.bounties;
      D.properties = s.properties; D.accounts = s.accounts; D.activity = s.activity;
    } catch (e) {}
  }
  function hasSnapshot() { try { return !!localStorage.getItem(SNAP_KEY); } catch (e) { return false; } }
  function resetDemo() {
    try { localStorage.removeItem(SNAP_KEY); } catch (e) {}
    location.href = location.pathname;
  }
  restore();

  var TODAY = new Date(D.today + 'T00:00:00Z');
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function dayjs(s) { return new Date(String(s).slice(0, 10) + 'T00:00:00Z'); }
  function daysBetween(a, b) { return Math.round((dayjs(b) - dayjs(a)) / 864e5); }
  function monthsBetween(a, b) {
    var x = dayjs(a), y = dayjs(b);
    return (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + (y.getUTCMonth() - x.getUTCMonth());
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function monthKey(d) { return String(d).slice(0, 7); }

  // ---------- persona / current account ----------
  // Default is PM — the primary persona the module is designed around.
  // ?persona=host|pm|supplier|chekin|admin deep-links a lens, the same way
  // ?first_run=1 deep-links the empty state.
  var PERSONAS = ['host', 'pm', 'supplier', 'chekin', 'admin'];
  function getPersona() {
    var p = 'pm';
    try {
      var m = /[?&]persona=([a-z]+)/.exec(location.search);
      if (m && PERSONAS.indexOf(m[1]) >= 0) localStorage.setItem('ln_persona', m[1]);
      p = localStorage.getItem('ln_persona') || 'pm';
    } catch (e) {}
    return PERSONAS.indexOf(p) >= 0 ? p : 'pm';
  }
  function setPersona(p) { try { localStorage.setItem('ln_persona', p); } catch (e) {} }
  function currentAccountId() { return D.personaAccounts[getPersona()] || null; }
  function currentAccount() { var id = currentAccountId(); return id ? find(D.accounts, id) : null; }

  /* ============================================================
     ECONOMICS — delegated to the pure kernel in economics.js.
     computeAccrual stays reachable as NetworkService.computeAccrual so
     callers still have exactly one door to money.
     ============================================================ */
  var E = window.LNEconomics;
  E.setToday(D.today);
  var premiumFor = E.premiumFor, isSaturated = E.isSaturated;
  var qualityBand = E.qualityBand, qualityMultiplier = E.qualityMultiplier;
  var decayFor = E.decayFor, blockedReason = E.blockedReason;
  var computeAccrual = E.computeAccrual;

  /* ============================================================
     SUPPLIERS & CLAIMS
     ============================================================ */
  function getSuppliers(f) {
    var rows = D.suppliers.slice();
    f = f || {};
    if (f.destination) rows = rows.filter(function (s) { return s.destinationId === f.destination; });
    if (f.category) rows = rows.filter(function (s) { return s.category === f.category; });
    if (f.status) rows = rows.filter(function (s) { return s.status === f.status; });
    if (f.origin) rows = rows.filter(function (s) { return s.origin === f.origin; });
    if (f.minScore != null) rows = rows.filter(function (s) { return s.score >= f.minScore; });
    if (f.search) {
      var q = f.search.toLowerCase();
      rows = rows.filter(function (s) { return (s.name + ' ' + s.subcategory + ' ' + s.legalEntity).toLowerCase().indexOf(q) >= 0; });
    }
    if (f.mine) {
      var mine = getClaims({ accountId: f.mine }).map(function (c) { return c.supplierId; });
      rows = rows.filter(function (s) { return mine.indexOf(s.id) >= 0; });
    }
    // Ranking is BLIND to sourcing (invariant #1): score then name, never origin.
    return rows.sort(function (a, b) { return b.score - a.score || (a.name < b.name ? -1 : 1); });
  }
  function getSupplierById(id) { return find(D.suppliers, id); }

  function getClaims(f) {
    var rows = D.claims.slice();
    f = f || {};
    if (f.accountId) rows = rows.filter(function (c) { return holdsAnyRole(c, f.accountId); });
    if (f.state) rows = rows.filter(function (c) { return c.state === f.state; });
    if (f.states) rows = rows.filter(function (c) { return f.states.indexOf(c.state) >= 0; });
    if (f.sharingMode) rows = rows.filter(function (c) { return c.sharingMode === f.sharingMode; });
    if (f.destination) rows = rows.filter(function (c) { var s = getSupplierById(c.supplierId); return s && s.destinationId === f.destination; });
    return rows;
  }
  function holdsAnyRole(claim, accountId) {
    if (claim.sourcingAccountId === accountId) return true;
    return (claim.roles || []).some(function (r) { return r.holderAccountId === accountId && !r.until; });
  }
  function getClaimById(id) { return find(D.claims, id); }
  function getClaimBySupplier(supplierId) {
    var live = D.claims.filter(function (c) { return c.supplierId === supplierId && ['released', 'expired', 'terminated'].indexOf(c.state) < 0; });
    return live[0] || D.claims.filter(function (c) { return c.supplierId === supplierId; })[0] || null;
  }

  function createClaim(draft) {
    var id = 'clm_new_' + (D.claims.length + 1);
    var supplierId = draft.supplierId;
    if (!supplierId) {
      supplierId = 'sup_new_' + (D.suppliers.length + 1);
      var dest = find(D.destinations, draft.destinationId) || D.destinations[0];
      var cap = C.coverageCapsKm[draft.category] || 15;
      var km = Math.min(draft.coverageKm || cap, cap);
      D.suppliers.push({
        id: supplierId, name: draft.name, legalEntity: draft.legalEntity || draft.name, taxId: draft.taxId || '—',
        category: draft.category, subcategory: draft.subcategory || draft.category, destinationId: dest.id,
        geo: { lat: dest.geo.lat, lng: dest.geo.lng },
        contact: { name: draft.contactName || '—', email: draft.contactEmail || '—', phone: draft.contactPhone || '—' },
        languages: draft.languages || ['es'], origin: 'network', status: 'screening', score: 0.80,
        scoreBreakdown: { confirmLatency: 0.8, cancellationRate: 0.8, noShowRate: 0.8, guestRating: 0.8, disputeRate: 0.8 },
        scoreHistory: [0.8], coverage: {
          id: 'cov_new_' + (D.suppliers.length + 1), supplierId: supplierId, category: draft.category,
          basis: km > 20 ? 'radius' : 'isochrone', minutes: km > 20 ? null : Math.round(km * 4), km: km, capKm: cap,
          polygon: null, propertiesInCoverage: propertiesInCoverage(dest.id, draft.category, km)
        },
        contentCompleteness: 25, missingContent: ['photos', 'price_list', 'cancellation_policy'],
        insuranceOnFile: false, licenceOnFile: false, aggregatorPresence: !!draft.aggregatorPresence,
        media: [], priceFrom: draft.priceFrom || 0, currency: D.currency, riskFlags: draft.riskFlags || [],
        createdAt: D.today, liveAt: null
      });
    }
    var accountId = draft.sourcingAccountId || currentAccountId();
    var c = {
      id: id, supplierId: supplierId, sourcingAccountId: accountId, state: 'screening',
      sharingMode: draft.sharingMode || 'network',
      exclusivityUntil: draft.sharingMode === 'delayed' && draft.exclusivityDays
        ? isoPlusDays(D.today, draft.exclusivityDays) : null,
      roles: ['sourced', 'activated', 'maintained'].map(function (r) {
        return { role: r, holderAccountId: accountId, sharePct: C.roleShares[r], since: D.today, until: null, releaseReason: null };
      }),
      bountyId: draft.bountyId || null, decayStep: 1, qualityMultiplier: 1,
      selfDealingDeclared: !!draft.selfDealingDeclared, createdAt: D.today, liveAt: null,
      dormantAt: null, releasedAt: null, networkAt: null, suspensionsLast12m: 0,
      timeline: [
        { at: D.today, kind: 'created', title: 'Claim submitted', detail: 'Introduced by ' + ((find(D.accounts, accountId) || {}).name || 'you') + '.', actor: (find(D.accounts, accountId) || {}).name || 'You' },
        { at: D.today, kind: 'screened', title: 'In screening', detail: 'Duplicate, exclusion-list and completeness checks running.', actor: 'System' }
      ]
    };
    D.claims.push(c);
    D.activity.unshift({ at: D.today, claimId: c.id, supplierId: supplierId, accountId: accountId, kind: 'created', title: 'Claim submitted', detail: draft.name || supplierId });
    if (draft.bountyId) claimBounty(draft.bountyId, accountId);
    return c;
  }
  function isoPlusDays(from, days) { var d = dayjs(from); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

  /** Duplicate, exclusion-list and completeness checks. Every result carries a
   *  reason — the rules have to read as fair, not arbitrary. */
  function screenClaim(claimId) {
    var c = getClaimById(claimId); if (!c) return null;
    var s = getSupplierById(c.supplierId);
    var checks = [];
    var dupes = D.suppliers.filter(function (x) {
      return x.id !== s.id && x.destinationId === s.destinationId &&
        x.name.toLowerCase().slice(0, 8) === s.name.toLowerCase().slice(0, 8);
    });
    checks.push(dupes.length
      ? { check: 'Duplicate supplier', status: 'fail', message: 'A supplier with a very similar name already exists in ' + destName(s.destinationId) + ': ' + dupes[0].name + '.' }
      : { check: 'Duplicate supplier', status: 'pass', message: 'No existing supplier matches this name or tax ID in ' + destName(s.destinationId) + '.' });
    checks.push(s.aggregatorPresence
      ? { check: 'Exclusion list', status: 'fail', message: 'Already sold through an aggregator, so there is no network premium to fund a residual. They can still be added as central supply.' }
      : { check: 'Exclusion list', status: 'pass', message: 'Not present on any aggregator we buy from, and not in the Chekin pipeline.' });
    checks.push(s.contentCompleteness >= 40
      ? { check: 'Profile completeness', status: 'pass', message: s.contentCompleteness + '% complete — enough to start screening.' }
      : { check: 'Profile completeness', status: 'warn', message: 'Only ' + s.contentCompleteness + '% complete. Missing: ' + s.missingContent.join(', ') + '.' });
    checks.push(c.selfDealingDeclared
      ? { check: 'Self-dealing', status: 'warn', message: 'Declared interest — a Chekin admin decides before this can go live.' }
      : { check: 'Self-dealing', status: 'pass', message: 'No declared interest.' });
    var gated = C.hardGateCategories.indexOf(s.category) >= 0 || (s.riskFlags || []).some(function (r) { return C.hardGateRisks.indexOf(r) >= 0; });
    if (gated) checks.push({ check: 'Safety gate', status: 'warn', message: 'Category or risk flags (' + ((s.riskFlags || []).join(', ') || s.category) + ') require a Chekin admin decision regardless of curator review.' });

    var outcome = checks.some(function (x) { return x.status === 'fail'; }) ? 'blocked'
      : checks.some(function (x) { return x.status === 'warn'; }) ? 'needs_info' : 'pass';
    return { outcome: outcome, checks: checks, summary: {
      pass: 'All checks passed. Ready to invite the supplier to confirm.',
      needs_info: 'Passed with items that need a human decision before go-live.',
      blocked: 'Cannot be claimed — see the failing check.'
    }[outcome] };
  }
  function destName(id) { var d = find(D.destinations, id); return d ? d.name : id; }

  /** Validates the transition against the state machine and appends to the timeline. */
  var TRANSITIONS = {
    draft: ['screening'], screening: ['pending_supplier', 'terminated'],
    pending_supplier: ['onboarding', 'expired'], onboarding: ['live', 'terminated'],
    live: ['watch', 'suspended', 'dormant', 'terminated'],
    watch: ['live', 'suspended', 'terminated'],
    suspended: ['live', 'watch', 'terminated'],
    dormant: ['live', 'released'], expired: [], released: [], terminated: []
  };
  function advanceClaim(claimId, toState, meta) {
    var c = getClaimById(claimId); if (!c) return null;
    var allowed = TRANSITIONS[c.state] || [];
    if (allowed.indexOf(toState) < 0) throw new Error('Cannot move a claim from ' + c.state + ' to ' + toState + '.');
    meta = meta || {};
    c.state = toState;
    if (toState === 'live' && !c.liveAt) {
      c.liveAt = D.today;
      if (c.sharingMode === 'network') c.networkAt = D.today;
      var s = getSupplierById(c.supplierId); if (s) { s.status = 'live'; s.liveAt = D.today; }
    }
    if (toState === 'suspended') c.suspensionsLast12m = (c.suspensionsLast12m || 0) + 1;
    if (toState === 'dormant') c.dormantAt = D.today;
    if (toState === 'released') c.releasedAt = D.today;
    if (['watch', 'suspended', 'terminated'].indexOf(toState) < 0 && toState !== 'live') {
      var sup = getSupplierById(c.supplierId); if (sup && sup.status !== 'live') sup.status = toState;
    }
    var e = { at: D.today, kind: toState, title: meta.title || ('Moved to ' + toState.replace(/_/g, ' ')), detail: meta.detail || '', actor: meta.actor || 'System' };
    c.timeline.push(e);
    D.activity.unshift({ at: D.today, claimId: c.id, supplierId: c.supplierId, accountId: c.sourcingAccountId, kind: toState, title: e.title, detail: e.detail });
    return c;
  }
  function setSharingMode(claimId, mode, days) {
    var c = getClaimById(claimId); if (!c) return null;
    c.sharingMode = mode;
    c.exclusivityUntil = mode === 'delayed' ? isoPlusDays(D.today, days || C.delayedExclusivityDays[0]) : null;
    c.networkAt = mode === 'network' ? (c.networkAt || c.liveAt || D.today) : null;
    c.timeline.push({ at: D.today, kind: 'mode_changed', title: 'Sharing mode set to ' + mode, detail: mode === 'delayed' ? 'Exclusive for ' + (days || C.delayedExclusivityDays[0]) + ' days, then network with a ×' + C.delayedBoostMultiplier + ' boost for ' + C.delayedBoostMonths + ' months.' : mode === 'network' ? 'Bookable across the whole coverage area.' : 'Serves only your properties. No network pool accrues.', actor: 'You' });
    return c;
  }
  function assignRole(claimId, role, accountId) {
    var c = getClaimById(claimId); if (!c) return null;
    var existing = (c.roles || []).filter(function (r) { return r.role === role && !r.until; })[0];
    if (existing) { existing.until = D.today; existing.releaseReason = 'Reassigned'; }
    c.roles.push({ role: role, holderAccountId: accountId, sharePct: C.roleShares[role], since: D.today, until: null, releaseReason: null });
    c.timeline.push({ at: D.today, kind: 'note', title: 'Role assigned: ' + role, detail: (find(D.accounts, accountId) || {}).name || accountId, actor: 'Chekin' });
    return c;
  }
  function releaseRole(claimId, role, reason) {
    var c = getClaimById(claimId); if (!c) return null;
    (c.roles || []).forEach(function (r) { if (r.role === role && !r.until) { r.until = D.today; r.releaseReason = reason || 'Released'; } });
    c.timeline.push({ at: D.today, kind: 'role_released', title: role.charAt(0).toUpperCase() + role.slice(1) + ' role released', detail: reason || '', actor: 'Chekin' });
    return c;
  }

  /* ============================================================
     COVERAGE
     ============================================================ */
  function propertiesInCoverage(destinationId, category, km) {
    var cap = C.coverageCapsKm[category] || 15;
    var d = find(D.destinations, destinationId);
    if (!d) return 0;
    return Math.max(1, Math.round(d.activeProperties * Math.min(1, km / cap)));
  }
  function getCoverageForSupplier(supplierId) { var s = getSupplierById(supplierId); return s ? s.coverage : null; }
  function getPropertiesInCoverage(supplierId) {
    var s = getSupplierById(supplierId); if (!s) return [];
    var reach = s.coverage.km / s.coverage.capKm;
    return D.properties.filter(function (p) { return p.destinationId === s.destinationId; })
      .filter(function (p, i) { return i / Math.max(1, D.properties.length) <= 1 && (i % 10) / 10 < reach; });
  }

  /** The serving-host view: what network supply is available to one property,
   *  and which of it this property has vetoed. */
  function getNetworkSupplyForProperty(propertyId) {
    var p = find(D.properties, propertyId); if (!p) return [];
    var acct = find(D.accounts, p.accountId) || {};
    return getSuppliers({ destination: p.destinationId, status: 'live' })
      .filter(function (s) { return s.origin !== 'central'; })
      .map(function (s) {
        var c = getClaimBySupplier(s.id);
        var blocked = p.blockedSupplierIds.indexOf(s.id) >= 0 ||
          p.blockedCategories.indexOf(s.category) >= 0 ||
          (acct.blockedCategories || []).indexOf(s.category) >= 0;
        return {
          supplier: s, claim: c, blocked: blocked,
          blockedBy: p.blockedSupplierIds.indexOf(s.id) >= 0 ? 'supplier'
            : p.blockedCategories.indexOf(s.category) >= 0 ? 'property_category'
              : (acct.blockedCategories || []).indexOf(s.category) >= 0 ? 'account_category' : null,
          sourcedByOther: !!(c && c.sourcingAccountId !== p.accountId),
          sourcedByName: c ? ((find(D.accounts, c.sourcingAccountId) || {}).name || 'another host') : null,
          distanceKm: Math.round(haversine(p.geo, s.geo) * 10) / 10
        };
      });
  }
  function haversine(a, b) {
    var R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function getNetworkSupplyForAccount(accountId) {
    var props = D.properties.filter(function (p) { return p.accountId === accountId; });
    var seen = {}, out = [];
    props.forEach(function (p) {
      getNetworkSupplyForProperty(p.id).forEach(function (row) {
        var k = row.supplier.id;
        if (!seen[k]) { seen[k] = row; row.properties = [p.name]; row.blockedCount = row.blocked ? 1 : 0; out.push(row); }
        else { seen[k].properties.push(p.name); if (row.blocked) seen[k].blockedCount++; if (row.distanceKm < seen[k].distanceKm) seen[k].distanceKm = row.distanceKm; }
      });
    });
    out.forEach(function (r) { r.blocked = r.blockedCount === r.properties.length && r.blockedCount > 0; });
    return out;
  }
  function blockSupplierForProperty(propertyId, supplierId) {
    var p = find(D.properties, propertyId); if (!p) return null;
    var i = p.blockedSupplierIds.indexOf(supplierId);
    if (i >= 0) p.blockedSupplierIds.splice(i, 1); else p.blockedSupplierIds.push(supplierId);
    return p;
  }
  function blockSupplierForAccount(accountId, supplierId) {
    D.properties.filter(function (p) { return p.accountId === accountId; })
      .forEach(function (p) { if (p.blockedSupplierIds.indexOf(supplierId) < 0) p.blockedSupplierIds.push(supplierId); });
    return true;
  }
  function unblockSupplierForAccount(accountId, supplierId) {
    D.properties.filter(function (p) { return p.accountId === accountId; })
      .forEach(function (p) { var i = p.blockedSupplierIds.indexOf(supplierId); if (i >= 0) p.blockedSupplierIds.splice(i, 1); });
    return true;
  }
  function blockCategoryForAccount(accountId, category) {
    var a = find(D.accounts, accountId); if (!a) return null;
    var i = a.blockedCategories.indexOf(category);
    if (i >= 0) a.blockedCategories.splice(i, 1); else a.blockedCategories.push(category);
    return a;
  }

  /* ============================================================
     BOUNTIES
     ============================================================ */
  function getBounties(f) {
    var rows = D.bounties.slice();
    f = f || {};
    if (f.destination) rows = rows.filter(function (b) { return b.destinationId === f.destination; });
    if (f.category) rows = rows.filter(function (b) { return b.category === f.category; });
    if (f.status) rows = rows.filter(function (b) { return b.status === f.status; });
    return rows.map(function (b) {
      var x = {}, k;
      for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) x[k] = b[k];
      x.daysLeft = daysBetween(D.today, b.expiresAt);
      x.projectedAnnualResidual = projectBountyResidual(b);
      x.destination = find(D.destinations, b.destinationId);
      return x;
    }).sort(function (a, b) { return b.projectedAnnualResidual - a.projectedAnnualResidual; });
  }
  /** What a host would earn in year one for filling this gap. Uses a synthetic
   *  claim so the number comes out of computeAccrual like every other euro. */
  function projectBountyResidual(bounty) {
    var d = find(D.destinations, bounty.destinationId);
    var synthetic = {
      id: 'clm_projection', state: 'live', sharingMode: 'network', liveAt: D.today, networkAt: D.today,
      bountyId: bounty.id, roles: ['sourced', 'activated', 'maintained'].map(function (r) {
        return { role: r, holderAccountId: '_', sharePct: C.roleShares[r], since: D.today, until: null };
      })
    };
    var supplier = { id: 'sup_projection', category: bounty.category, score: 0.85 };
    return round2(computeAccrual(assumedGmv(bounty.category), synthetic, supplier, d).poolAmount);
  }
  /** Expected annual GMV for a category, used only where no history exists. */
  function assumedGmv(category) {
    var m = C.assumedAnnualGmvByCategory || {};
    return m[category] != null ? m[category] : C.assumedAnnualGmvDefault;
  }

  function claimBounty(bountyId, accountId) {
    var b = find(D.bounties, bountyId); if (!b) return null;
    b.status = 'claimed'; b.claimedByAccountId = accountId || currentAccountId();
    return b;
  }
  function createBounty(draft) {
    var b = {
      id: 'bty_new_' + (D.bounties.length + 1), destinationId: draft.destinationId, category: draft.category,
      title: draft.title, gapEvidence: draft.gapEvidence || { searches: 0, emptyDecisions: 0, period: 'last 30 days' },
      boostMultiplier: C.bountyBoostMultiplier, activationBonus: draft.activationBonus || 0,
      expiresAt: isoPlusDays(D.today, draft.days || 60), status: 'open', claimedByAccountId: null
    };
    D.bounties.push(b);
    return b;
  }
  function closeBounty(bountyId) { var b = find(D.bounties, bountyId); if (b) b.status = 'closed'; return b; }

  /* ============================================================
     DESTINATIONS & GAPS
     ============================================================ */
  function getDestinations() { return D.destinations.slice(); }
  function getDestinationById(id) { return find(D.destinations, id); }
  function getSupplyGaps(destinationId) {
    return D.bounties.filter(function (b) { return !destinationId || b.destinationId === destinationId; })
      .map(function (b) {
        return {
          destinationId: b.destinationId, category: b.category, searches: b.gapEvidence.searches,
          emptyDecisions: b.gapEvidence.emptyDecisions, period: b.gapEvidence.period,
          bountyId: b.id, status: b.status, projectedAnnualResidual: projectBountyResidual(b)
        };
      }).sort(function (a, b) { return b.emptyDecisions - a.emptyDecisions; });
  }

  /* ============================================================
     ACCOUNTS / MISC
     ============================================================ */
  function getAccounts() { return D.accounts.slice(); }
  function getAccountById(id) { return find(D.accounts, id); }
  function getProperties(accountId) {
    return D.properties.filter(function (p) { return !accountId || p.accountId === accountId; });
  }
  function isCurator(accountId) {
    var live = getClaims({ accountId: accountId, state: 'live' });
    if (live.length < C.curatorThreshold.minLiveSuppliers) return false;
    var avg = live.reduce(function (t, c) { var s = getSupplierById(c.supplierId); return t + (s ? s.score : 0); }, 0) / live.length;
    return avg >= C.curatorThreshold.minAvgScore;
  }
  function curatorProgress(accountId) {
    var live = getClaims({ accountId: accountId, state: 'live' });
    var avg = live.length ? live.reduce(function (t, c) { var s = getSupplierById(c.supplierId); return t + (s ? s.score : 0); }, 0) / live.length : 0;
    return { liveSuppliers: live.length, avgScore: Math.round(avg * 100) / 100, met: isCurator(accountId),
      needLive: C.curatorThreshold.minLiveSuppliers, needScore: C.curatorThreshold.minAvgScore };
  }
  function getActivity(f) {
    f = f || {};
    var rows = D.activity.slice();
    if (f.accountId) rows = rows.filter(function (a) { return a.accountId === f.accountId; });
    return rows.slice(0, f.limit || 20);
  }
  /** Suppliers that became available to this account's properties recently. */
  function getNewInCoverage(accountId, limit) {
    return getNetworkSupplyForAccount(accountId)
      .filter(function (r) { return r.sourcedByOther && r.supplier.liveAt && monthsBetween(r.supplier.liveAt, D.today) <= 6; })
      .sort(function (a, b) { return a.supplier.liveAt < b.supplier.liveAt ? 1 : -1; })
      .slice(0, limit || 4);
  }
  /** Countdown for any state with a clock on it. */
  function countdownFor(claim) {
    if (!claim) return null;
    var W = C.claimWindows;
    function chip(from, days, label) {
      var left = days - daysBetween(from, D.today);
      return { days: left, label: label, overdue: left < 0 };
    }
    if (claim.state === 'pending_supplier') {
      var inv = (claim.timeline || []).filter(function (e) { return e.kind === 'invited'; }).pop();
      return chip(inv ? inv.at : claim.createdAt, W.supplierConfirmDays, 'to confirm');
    }
    if (claim.state === 'onboarding') {
      var on = (claim.timeline || []).filter(function (e) { return e.kind === 'onboarded'; }).pop();
      return chip(on ? on.at : claim.createdAt, W.activationDays, 'to go live');
    }
    if (claim.state === 'dormant' && claim.dormantAt) {
      return chip(claim.dormantAt, W.dormantReactivationMonths * 30, 'to reactivate');
    }
    if (claim.sharingMode === 'delayed' && claim.exclusivityUntil && daysBetween(D.today, claim.exclusivityUntil) > 0) {
      return { days: daysBetween(D.today, claim.exclusivityUntil), label: 'of exclusivity left', overdue: false };
    }
    return null;
  }

  function isFirstRun() { return FIRST_RUN; }
  function setFirstRun(on) {
    try { localStorage.setItem('ln_first_run', on ? '1' : '0'); } catch (e) {}
    location.href = location.pathname;
  }

  window.NetworkService = {
    _dataset: D, config: C,
    isFirstRun: isFirstRun, setFirstRun: setFirstRun,
    hasSnapshot: hasSnapshot, resetDemo: resetDemo, _snapshot: snapshot,
    getPersona: getPersona, setPersona: setPersona, personas: PERSONAS,
    currentAccountId: currentAccountId, currentAccount: currentAccount,
    // suppliers & claims
    getSuppliers: getSuppliers, getSupplierById: getSupplierById,
    getClaims: getClaims, getClaimById: getClaimById, getClaimBySupplier: getClaimBySupplier,
    createClaim: createClaim, screenClaim: screenClaim, advanceClaim: advanceClaim,
    setSharingMode: setSharingMode, assignRole: assignRole, releaseRole: releaseRole,
    holdsAnyRole: holdsAnyRole, countdownFor: countdownFor, transitions: TRANSITIONS,
    // coverage
    getCoverageForSupplier: getCoverageForSupplier, getPropertiesInCoverage: getPropertiesInCoverage,
    getNetworkSupplyForProperty: getNetworkSupplyForProperty, getNetworkSupplyForAccount: getNetworkSupplyForAccount,
    blockSupplierForProperty: blockSupplierForProperty, blockSupplierForAccount: blockSupplierForAccount,
    unblockSupplierForAccount: unblockSupplierForAccount, blockCategoryForAccount: blockCategoryForAccount,
    propertiesInCoverage: propertiesInCoverage, getNewInCoverage: getNewInCoverage,
    computeAccrual: computeAccrual, premiumFor: premiumFor, isSaturated: isSaturated,
    qualityBand: qualityBand, qualityMultiplier: qualityMultiplier, decayFor: decayFor,
    // bounties
    getBounties: getBounties, claimBounty: claimBounty, assumedGmv: assumedGmv, createBounty: createBounty, closeBounty: closeBounty,
    // destinations
    getDestinations: getDestinations, getDestinationById: getDestinationById, getSupplyGaps: getSupplyGaps,
    // accounts
    getAccounts: getAccounts, getAccountById: getAccountById, getProperties: getProperties,
    isCurator: isCurator, curatorProgress: curatorProgress, getActivity: getActivity
  };

  // Every write goes through the same door, so nothing can mutate the dataset
  // without the demo snapshot keeping up. A throwing mutator never snapshots.
  ['createClaim', 'advanceClaim', 'setSharingMode', 'assignRole', 'releaseRole',
   'blockSupplierForProperty', 'blockSupplierForAccount', 'unblockSupplierForAccount',
   'blockCategoryForAccount', 'claimBounty', 'createBounty', 'closeBounty'].forEach(function (k) {
    var orig = window.NetworkService[k];
    window.NetworkService[k] = function () {
      var r = orig.apply(null, arguments);
      snapshot();
      return r;
    };
  });
})();
