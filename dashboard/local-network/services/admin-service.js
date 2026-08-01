/* ============================================================
   Local Network — Admin service
   The Chekin-internal surface: the claim review queue, the flags a human
   must decide on, the quality watchlist and suspensions.

   This layer reads through NetworkService rather than touching LN_DATA,
   so NetworkService stays the single consumer of the dataset. Its
   methods are merged onto window.NetworkService, so pages keep talking
   to one service object.

   Nothing here decides anything on its own — every flag surfaces for a
   person, and rejecting a claim is always separate from suspending a
   supplier, because one is about money and the other is about guests.
   ============================================================ */
(function () {
  'use strict';
  var S = window.NetworkService, C = window.LN_CONFIG;
  var TODAY = S._dataset.today;

  function dayjs(s) { return new Date(String(s).slice(0, 10) + 'T00:00:00Z'); }
  function daysBetween(a, b) { return Math.round((dayjs(b) - dayjs(a)) / 864e5); }
  function destName(id) { var d = S.getDestinationById(id); return d ? d.name : id; }

  function getReviewQueue(f) {
    f = f || {};
    return S.getClaims({ states: ['screening', 'pending_supplier', 'onboarding'] })
      .map(function (c) {
        var s = S.getSupplierById(c.supplierId);
        return {
          claim: c, supplier: s, account: S.getAccountById(c.sourcingAccountId),
          screening: S.screenClaim(c.id),
          hardGate: !!s && (C.hardGateCategories.indexOf(s.category) >= 0 ||
            (s.riskFlags || []).some(function (r) { return C.hardGateRisks.indexOf(r) >= 0; })),
          waitingDays: daysBetween(c.createdAt, TODAY)
        };
      })
      .filter(function (r) { return !f.hardGateOnly || r.hardGate; })
      .sort(function (a, b) { return a.claim.createdAt < b.claim.createdAt ? 1 : -1; });
  }
  function getFlags() {
    var flags = [];
    S.getClaims({}).forEach(function (c) {
      var s = S.getSupplierById(c.supplierId); if (!s) return;
      if (c.selfDealingDeclared) flags.push({ id: 'flg_sd_' + c.id, kind: 'self_dealing', severity: 'high', supplierId: s.id, claimId: c.id,
        title: 'Self-dealing declared · ' + s.name, detail: ((S.getAccountById(c.sourcingAccountId) || {}).name || 'A host') + ' declared an interest in this business. A Chekin admin must decide before it goes live.', raisedAt: c.createdAt });
      if (s.aggregatorPresence && c.state !== 'released' && ['live', 'watch'].indexOf(c.state) >= 0)
        flags.push({ id: 'flg_ex_' + c.id, kind: 'exclusion', severity: 'medium', supplierId: s.id, claimId: c.id,
          title: 'Aggregator presence · ' + s.name, detail: 'Already sold through an aggregator, so there is no network premium funding this claim. Review whether the residual should continue.', raisedAt: c.createdAt });
      if (c.suspensionsLast12m >= C.suspensionsVoidingClaim)
        flags.push({ id: 'flg_su_' + c.id, kind: 'quality_watch', severity: 'high', supplierId: s.id, claimId: c.id,
          title: 'Claim voided by repeat suspension · ' + s.name, detail: c.suspensionsLast12m + ' suspensions within 12 months. Threshold is ' + C.suspensionsVoidingClaim + '.', raisedAt: c.createdAt });
    });
    S.getSuppliers({}).forEach(function (s) {
      if (s.status === 'watch' || (s.status === 'live' && s.score < 0.75))
        flags.push({ id: 'flg_q_' + s.id, kind: 'quality_watch', severity: s.score < 0.60 ? 'high' : 'medium', supplierId: s.id, claimId: null,
          title: 'Quality watch · ' + s.name, detail: 'Score ' + s.score.toFixed(2) + ' (' + S.qualityBand(s.score).label + '). Driver: ' + worstDriver(s) + '.', raisedAt: TODAY });
      var peers = S.getSuppliers({}).filter(function (x) { return x.category === s.category && x.destinationId === s.destinationId && x.id !== s.id; });
      if (peers.length >= 2) {
        var avg = peers.reduce(function (t, x) { return t + x.priceFrom; }, 0) / peers.length;
        if (s.priceFrom > avg * 2)
          flags.push({ id: 'flg_p_' + s.id, kind: 'price_outlier', severity: 'low', supplierId: s.id, claimId: null,
            title: 'Price outlier · ' + s.name, detail: 'From ' + s.priceFrom + ' ' + s.currency + ' against a category average of ' + Math.round(avg) + ' in ' + destName(s.destinationId) + '.', raisedAt: TODAY });
      }
    });
    var order = { high: 0, medium: 1, low: 2 };
    return flags.sort(function (a, b) { return order[a.severity] - order[b.severity]; });
  }
  var DRIVER_LABEL = { confirmLatency: 'confirmation latency', cancellationRate: 'cancellation rate', noShowRate: 'no-show rate', guestRating: 'guest rating', disputeRate: 'dispute rate' };
  function worstDriver(s) {
    var worst = null, k;
    for (k in s.scoreBreakdown) if (Object.prototype.hasOwnProperty.call(s.scoreBreakdown, k)) {
      if (!worst || s.scoreBreakdown[k] < s.scoreBreakdown[worst]) worst = k;
    }
    return DRIVER_LABEL[worst] || worst;
  }
  function getQualityWatch() {
    return S.getSuppliers({}).filter(function (s) { return s.status === 'watch' || s.status === 'suspended' || (s.status === 'live' && s.score < 0.80); })
      .map(function (s) {
        var hist = s.scoreHistory || [];
        return { supplier: s, claim: S.getClaimBySupplier(s.id), band: S.qualityBand(s.score), driver: worstDriver(s),
          delta: hist.length > 1 ? Math.round((hist[hist.length - 1] - hist[0]) * 100) / 100 : 0 };
      }).sort(function (a, b) { return a.supplier.score - b.supplier.score; });
  }
  function approveClaim(id) {
    var c = S.getClaimById(id); if (!c) return null;
    if (c.state === 'screening') return S.advanceClaim(id, 'pending_supplier', { title: 'Approved — invitation sent', detail: 'The supplier has ' + C.claimWindows.supplierConfirmDays + ' days to confirm.', actor: 'Chekin admin' });
    if (c.state === 'pending_supplier') return S.advanceClaim(id, 'onboarding', { title: 'Supplier confirmed', detail: C.claimWindows.activationDays + ' days to reach live.', actor: 'Chekin admin' });
    if (c.state === 'onboarding') return S.advanceClaim(id, 'live', { title: 'Approved — now live', detail: 'Bookable across coverage.', actor: 'Chekin admin' });
    return c;
  }
  function rejectClaim(id, reason) {
    if (!reason) throw new Error('A reason is required to reject a claim.');
    return S.advanceClaim(id, 'terminated', { title: 'Claim rejected', detail: reason, actor: 'Chekin admin' });
  }
  /** Suspends the SUPPLIER (a guest-safety action). Distinct from suspending a
   *  claim, which only stops the residual. */
  function suspendSupplier(id, reason) {
    var s = S.getSupplierById(id); if (!s) return null;
    s.status = 'suspended';
    var c = getClaimBySupplier(id);
    if (c && ['live', 'watch'].indexOf(c.state) >= 0) S.advanceClaim(c.id, 'suspended', { title: 'Supplier suspended', detail: reason || '', actor: 'Chekin admin' });
    return s;
  }
  function getSuspensions() {
    return S.getClaims({}).filter(function (c) { return c.state === 'suspended' || c.suspensionsLast12m > 0; })
      .map(function (c) { return { claim: c, supplier: S.getSupplierById(c.supplierId), account: S.getAccountById(c.sourcingAccountId) }; });
  }


  S.getReviewQueue = getReviewQueue;
  S.getFlags = getFlags;
  S.getQualityWatch = getQualityWatch;
  S.approveClaim = approveClaim;
  S.rejectClaim = rejectClaim;
  S.suspendSupplier = suspendSupplier;
  S.getSuspensions = getSuspensions;

  // Admin writes snapshot too, so a decision survives navigation like any other.
  ['approveClaim', 'rejectClaim', 'suspendSupplier'].forEach(function (k) {
    var orig = S[k];
    S[k] = function () { var r = orig.apply(null, arguments); S._snapshot(); return r; };
  });
})();
