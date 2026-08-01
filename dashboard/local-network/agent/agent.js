/* ============================================================
   Local Network — Agent layer (mocked, deterministic)
   Every intent returns a STRUCTURED object, never plain text, plus a
   reasoningSummary so the UI can always show the "why". Answers are
   rule-based on the fixtures so the demo is stable.

   Anything that MUTATES comes back as a proposal with an explicit
   diff and requires LNAgent.apply() — propose → diff → confirm,
   matching the AppSell agent pattern. The agent never writes on its
   own, and it never ranks supply by who sourced it.
   ============================================================ */
(function () {
  'use strict';
  var S = window.NetworkService, C = window.LN_CONFIG;

  // ---------- intent parsing (keyword heuristics) ----------
  function parse(prompt) {
    var p = (prompt || '').toLowerCase();
    // The property hint ("for my Gràcia properties") names a PLACE, not a
    // supplier. Strip it before matching or "Gràcia" hijacks the supplier.
    var hint = (p.match(/for (?:my|our) ([a-zà-ÿ'’ ]+?) (?:properties|property|homes|listings)/) || [])[1] || null;
    var forMatching = hint ? p.replace(/for (?:my|our) [a-zà-ÿ'’ ]+? (?:properties|property|homes|listings)/, ' ') : p;
    return {
      source: /(what should i source|source in|what to source|gap|opportunit|recommend.*suppl)/.test(p),
      dropped: /(drop|fell|down|lower|less than last|decreas|why.*residual)/.test(p),
      atRisk: /(at risk|risk|watch|failing|declin|problem|worst)/.test(p),
      worth: /(worth|value|run.?rate|how much.*book|projection|5.year|five.year)/.test(p),
      block: /\bblock\b|\bveto\b|\bexclude\b|\bremove\b/.test(p),
      switchMode: /(switch|change|move|set).*(network|private|delayed)|to network|to private|to delayed/.test(p),
      destination: /c[áa]diz/.test(p) ? 'dst_cad' : /barcelona|bcn|gr[àa]cia/.test(p) ? 'dst_bcn' : null,
      mode: /\bnetwork\b/.test(p) ? 'network' : /\bprivate\b/.test(p) ? 'private' : /\bdelayed\b/.test(p) ? 'delayed' : null,
      supplier: matchSupplier(forMatching, hint),
      propertyHint: hint
    };
  }
  /** Match a supplier by name. A full-name hit always wins; otherwise score by
   *  how many name words appear, and break ties toward the destination the
   *  property hint points at, so "the kayak operator for my Gràcia properties"
   *  resolves to the kayak operator in Barcelona rather than in Cádiz. */
  function matchSupplier(p, hint) {
    var hintDests = hint ? destinationsForHint(hint) : [];
    var best = null, bestScore = 0;
    S.getSuppliers({}).forEach(function (s) {
      var lower = s.name.toLowerCase();
      var score = 0;
      if (p.indexOf(lower) >= 0) score = 1000 + lower.length;
      else {
        lower.split(/\s+/).forEach(function (w) {
          if (w.length >= 4 && p.indexOf(w) >= 0) score += 10 + w.length;
        });
        // subcategory words help ("kayak operator", "private chef")
        String(s.subcategory || '').toLowerCase().split(/\s+/).forEach(function (w) {
          if (w.length >= 5 && p.indexOf(w) >= 0) score += 4;
        });
      }
      if (!score) return;
      if (hintDests.length && hintDests.indexOf(s.destinationId) >= 0) score += 3;
      if (score > bestScore) { best = s; bestScore = score; }
    });
    return best;
  }
  function destinationsForHint(hint) {
    var props = matchProperties(hint);
    var out = [];
    props.forEach(function (p) { if (out.indexOf(p.destinationId) < 0) out.push(p.destinationId); });
    return out;
  }
  function matchProperties(hint) {
    if (!hint) return [];
    var needle = hint.trim().toLowerCase();
    return S.getProperties(accountId()).filter(function (p) {
      return p.name.toLowerCase().indexOf(needle) >= 0 || p.city.toLowerCase().indexOf(needle) >= 0;
    });
  }

  function accountId() { return S.currentAccountId(); }

  /* ---------- 1. What should I source here? ---------- */
  function whatToSource(destinationId) {
    var dest = destinationId ? S.getDestinationById(destinationId) : preferredDestination();
    var bounties = S.getBounties({ destination: dest ? dest.id : null, status: 'open' });
    return {
      type: 'source_recommendations',
      headline: bounties.length
        ? 'Ranked by projected first-year residual, ' + bounties.length + ' open gap' + (bounties.length > 1 ? 's' : '') + ' in ' + (dest ? dest.name : 'your destinations') + '.'
        : 'No open gaps in ' + (dest ? dest.name : 'your destinations') + ' right now.',
      destination: dest,
      items: bounties.slice(0, 5).map(function (b) {
        var fiveYear = fiveYearForBounty(b);
        return {
          bountyId: b.id, title: b.title, category: b.category,
          evidence: b.gapEvidence.searches + ' guest searches, ' + b.gapEvidence.emptyDecisions + ' with no eligible supplier, ' + b.gapEvidence.period,
          projectedYear1: b.projectedAnnualResidual, projectedFiveYear: fiveYear,
          activationBonus: b.activationBonus, boost: b.boostMultiplier, daysLeft: b.daysLeft,
          href: 'submit.html?bounty=' + b.id
        };
      }),
      reasoningSummary: 'Ranked purely by projected residual from LN_CONFIG — base ' + C.basePoolPctOfGmv + '% × quality × decay × the ×' + C.bountyBoostMultiplier + ' bounty boost, capped at the ' + C.networkPremiumPctOfGmv + '% premium. Who sourced what has no bearing on this list.'
    };
  }
  function preferredDestination() {
    var props = S.getProperties(accountId());
    if (!props.length) return S.getDestinations()[0];
    var counts = {};
    props.forEach(function (p) { counts[p.destinationId] = (counts[p.destinationId] || 0) + 1; });
    var best = null;
    Object.keys(counts).forEach(function (k) { if (!best || counts[k] > counts[best]) best = k; });
    return S.getDestinationById(best);
  }
  function fiveYearForBounty(b) {
    // same synthetic-claim trick the service uses, run forward five years
    var total = 0, gmv = S.assumedGmv(b.category);
    var dest = S.getDestinationById(b.destinationId);
    var supplier = { id: 'sup_p', category: b.category, score: 0.85 };
    for (var y = 0; y < 5; y++) {
      var liveAt = shiftMonths(S._dataset.today, -y * 12);
      var claim = { id: 'clm_p', state: 'live', sharingMode: 'network', liveAt: liveAt, networkAt: liveAt,
        bountyId: b.id, roles: [{ role: 'sourced', holderAccountId: '_', sharePct: 100, since: liveAt, until: null }] };
      total += S.computeAccrual(gmv, claim, supplier, dest).poolAmount;
    }
    return Math.round(total);
  }
  function shiftMonths(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }

  /* ---------- 2. Why did my residual drop? ---------- */
  function whyResidualChanged() {
    var acct = accountId();
    var sum = S.getEarningsSummary(acct, 4);
    var months = sum.byMonth;
    var last = months[months.length - 2] || { amount: 0, month: '—' };
    var prev = months[months.length - 3] || { amount: 0, month: '—' };
    var delta = Math.round((last.amount - prev.amount) * 100) / 100;
    var book = S.getSupplyBook(acct);

    // attribute the change: which claims moved, and which factor moved on each
    var causes = [];
    book.entries.forEach(function (e) {
      var acr = S.getAccruals({ claimId: e.claim.id });
      var a = acr.filter(function (x) { return x.periodMonth === last.month; });
      var b = acr.filter(function (x) { return x.periodMonth === prev.month; });
      var av = a.reduce(function (t, x) { return t + S.shareOf(x, acct); }, 0);
      var bv = b.reduce(function (t, x) { return t + S.shareOf(x, acct); }, 0);
      var d = Math.round((av - bv) * 100) / 100;
      if (Math.abs(d) < 0.5) return;
      // Attribute the move to the factor that actually changed, checking the
      // rate first and only falling back to volume/value when the rate held.
      var agmv = a.reduce(function (t, x) { return t + x.gmv; }, 0);
      var bgmv = b.reduce(function (t, x) { return t + x.gmv; }, 0);
      var factor;
      if (!a.length) factor = 'no bookings posted this month (' + b.length + ' the month before)';
      else if (!b.length) factor = 'first bookings posted (' + a.length + ' this month)';
      else if (a[0].decayStep !== b[0].decayStep) factor = 'the decay step moved from ' + b[0].decayStep + ' to ' + a[0].decayStep + ' (×' + decayOf(b[0]) + ' → ×' + decayOf(a[0]) + ')';
      else if (a[0].qualityMultiplier !== b[0].qualityMultiplier) factor = 'the quality band moved to ' + a[0].qualityLabel + ' (×' + b[0].qualityMultiplier.toFixed(2) + ' → ×' + a[0].qualityMultiplier.toFixed(2) + ')';
      else if (a[0].bountyBoost !== b[0].bountyBoost) factor = 'the ×' + C.bountyBoostMultiplier + ' bounty boost ' + (a[0].bountyBoost > 1 ? 'started' : 'expired');
      else if (a[0].delayedBoost !== b[0].delayedBoost) factor = 'the ×' + C.delayedBoostMultiplier + ' delayed-sharing boost ' + (a[0].delayedBoost > 1 ? 'started' : 'expired');
      else if (a[0].poolPct !== b[0].poolPct) factor = 'the pool rate moved from ' + b[0].poolPct + '% to ' + a[0].poolPct + '%';
      else if (a.length !== b.length) factor = 'the rate held; booking volume changed (' + b.length + ' → ' + a.length + ' bookings)';
      else factor = 'the rate held; booking value changed (€' + Math.round(bgmv) + ' → €' + Math.round(agmv) + ' across ' + a.length + ' bookings)';
      causes.push({ supplierId: e.supplier.id, name: e.supplier.name, delta: d, factor: factor,
        chain: a.length ? a[0].chain : (b.length ? b[0].chain : null),
        blockedReason: e.blockedReason });
    });
    causes.sort(function (x, y) { return Math.abs(y.delta) - Math.abs(x.delta); });

    return {
      type: 'residual_change',
      headline: delta === 0 ? 'Your residual was flat month over month.'
        : (delta < 0 ? 'Your residual fell ' : 'Your residual rose ') + Math.abs(delta).toFixed(2) + ' EUR from ' + prev.month + ' to ' + last.month + '.',
      from: prev, to: last, delta: delta, causes: causes.slice(0, 5),
      reasoningSummary: 'Each line is recomputed by computeAccrual for both months and compared factor by factor — decay step, quality band, boosts, then volume. Nothing is estimated.'
    };
  }
  function decayOf(accrual) {
    var d = (accrual.chain || []).filter(function (s) { return s.kind === 'decay'; })[0];
    return d ? d.value.toFixed(2) : '1.00';
  }

  /* ---------- 3. Which of my suppliers are at risk? ---------- */
  function suppliersAtRisk() {
    var acct = accountId();
    var book = S.getSupplyBook(acct);
    var rows = book.entries.filter(function (e) { return e.atRisk; }).map(function (e) {
      var hist = e.supplier.scoreHistory || [];
      var watch = S.getQualityWatch().filter(function (w) { return w.supplier.id === e.supplier.id; })[0];
      return {
        supplierId: e.supplier.id, name: e.supplier.name, state: e.claim.state,
        score: e.supplier.score, band: S.qualityBand(e.supplier.score).label,
        driver: watch ? watch.driver : 'quality score',
        delta: hist.length > 1 ? Math.round((hist[hist.length - 1] - hist[0]) * 100) / 100 : 0,
        currentPoolPct: e.currentPoolPct, mtd: e.mtdResidual,
        atFullBand: Math.round(C.basePoolPctOfGmv * S.qualityBand(0.90).multiplier * 100) / 100,
        blockedReason: e.blockedReason, href: 'supplier-detail.html?supplier=' + e.supplier.id
      };
    }).sort(function (a, b) { return a.score - b.score; });
    return {
      type: 'at_risk',
      headline: rows.length ? rows.length + ' of your ' + book.entries.length + ' claims need attention.' : 'Nothing in your book is at risk right now.',
      items: rows,
      reasoningSummary: 'A claim is at risk when it is on watch or suspended, or its supplier score is under 0.75 — the point where the quality multiplier stops being ×1.00. The driver shown is the lowest-scoring component of the supplier score.'
    };
  }

  /* ---------- 4. How much is my supply book worth? ---------- */
  function bookValue() {
    var acct = accountId();
    var book = S.getSupplyBook(acct);
    var curve = [];
    for (var y = 1; y <= 5; y++) {
      var total = 0;
      book.entries.forEach(function (e) {
        var p = S.projectResidual(e.claim.id, 5, acct)[y - 1];
        if (p) total += p.amount;
      });
      curve.push({ year: y, amount: Math.round(total * 100) / 100 });
    }
    return {
      type: 'book_value',
      headline: 'Your book runs at ' + book.totals.projectedAnnual.toFixed(0) + ' EUR a year today, and is worth about ' + book.totals.fiveYearValue.toFixed(0) + ' EUR over five years.',
      runRate: book.totals.projectedAnnual, fiveYear: book.totals.fiveYearValue,
      mtd: book.totals.mtd, ytd: book.totals.ytd, lifetime: book.totals.lifetime,
      claims: book.totals.claims, live: book.totals.live, curve: curve,
      isCurator: book.isCurator,
      top: book.entries.slice().sort(function (a, b) { return b.projectedAnnual - a.projectedAnnual; }).slice(0, 4)
        .map(function (e) { return { name: e.supplier.name, projectedAnnual: e.projectedAnnual, poolPct: e.currentPoolPct }; }),
      reasoningSummary: 'Run-rate is trailing-12-month GMV at each claim\'s current pool rate and your role shares. The five-year figure runs the same claims forward through the decay schedule — nothing else is assumed to change.'
    };
  }

  /* ---------- 5 & 6. Mutating intents → propose, diff, confirm ---------- */
  function proposeBlock(supplier, propertyHint) {
    var acct = accountId();
    var props = S.getProperties(acct);
    var targets = propertyHint ? matchProperties(propertyHint) : props;
    if (!targets.length) targets = props;
    var already = targets.filter(function (p) { return p.blockedSupplierIds.indexOf(supplier.id) >= 0; });
    var toChange = targets.filter(function (p) { return p.blockedSupplierIds.indexOf(supplier.id) < 0; });
    return {
      type: 'proposal', action: 'block_supplier', requiresConfirm: true,
      headline: 'Block ' + supplier.name + ' on ' + toChange.length + ' of your ' + props.length + ' properties.',
      supplierId: supplier.id, supplierName: supplier.name,
      propertyIds: toChange.map(function (p) { return p.id; }),
      diff: toChange.map(function (p) { return { property: p.name, before: 'Bookable', after: 'Blocked' }; })
        .concat(already.map(function (p) { return { property: p.name, before: 'Blocked', after: 'Blocked', skip: true }; })),
      note: 'Blocking is your veto as the serving host and takes effect immediately for guests at those properties. It does not affect the supplier\'s claim, their score, or any other host\'s properties.',
      reasoningSummary: 'Matched "' + (propertyHint || 'all properties') + '" against your portfolio. ' + already.length + ' already blocked and will be skipped.'
    };
  }
  function proposeMode(supplier, mode) {
    var claim = S.getClaimBySupplier(supplier.id);
    if (!claim) return { type: 'error', headline: 'There is no claim on ' + supplier.name + ', so there is no sharing mode to change.' };
    if (claim.sharingMode === mode) {
      var d0 = S.getDestinationById(supplier.destinationId);
      var now = S.computeAccrual(100, claim, supplier, d0);
      return {
        type: 'no_change',
        headline: supplier.name + ' is already on ' + mode + ' sharing — nothing to change.',
        supplierId: supplier.id, supplierName: supplier.name, mode: mode, current: now,
        href: 'supplier-detail.html?supplier=' + supplier.id,
        reasoningSummary: 'The claim is already in that mode, so there is no delta to show. Its current rate is ' +
          (now.blockedReason ? '€0.00 — ' + now.blockedReason : now.poolPct + '% of booking value.')
      };
    }
    var dest = S.getDestinationById(supplier.destinationId);
    var before = S.computeAccrual(100, claim, supplier, dest);
    var after = S.computeAccrual(100, shallowWithMode(claim, mode), supplier, dest);
    return {
      type: 'proposal', action: 'set_sharing_mode', requiresConfirm: true,
      headline: 'Switch ' + supplier.name + ' from ' + claim.sharingMode + ' to ' + mode + ' sharing.',
      claimId: claim.id, supplierId: supplier.id, supplierName: supplier.name, mode: mode,
      diff: [
        { property: 'Sharing mode', before: claim.sharingMode, after: mode },
        { property: 'Pool rate (per €100 GMV)', before: before.blockedReason ? '€0.00' : '€' + before.poolAmount.toFixed(2), after: after.blockedReason ? '€0.00' : '€' + after.poolAmount.toFixed(2) },
        { property: 'Bookable by', before: bookableBy(claim.sharingMode, claim.networkAt), after: bookableBy(mode, mode === 'network' ? true : null) }
      ],
      beforeChain: before, afterChain: after,
      note: mode === 'network'
        ? 'Going to network makes this supplier bookable across the whole coverage area. Every serving host keeps their usual share — the residual comes out of the extra ' + C.networkPremiumPctOfGmv + '% the supplier accepts.'
        : mode === 'delayed'
          ? 'Delayed keeps them exclusive to you for ' + C.delayedExclusivityDays[0] + '–' + C.delayedExclusivityDays[1] + ' days, then opens to the network with a ×' + C.delayedBoostMultiplier + ' boost for ' + C.delayedBoostMonths + ' months.'
          : 'Private means this supplier serves only your properties and no sourcing pool accrues.',
      reasoningSummary: 'Both rates come from computeAccrual on the same supplier, score and destination — only the sharing mode differs.'
    };
  }
  /** Who can actually book, given the mode and whether exclusivity has ended. */
  function bookableBy(mode, networkAt) {
    if (mode === 'private') return 'Your properties only';
    if (mode === 'delayed' && !networkAt) return 'Your properties only, until exclusivity ends';
    return 'All properties in coverage';
  }
  function shallowWithMode(claim, mode) {
    var c = {}, k;
    for (k in claim) if (Object.prototype.hasOwnProperty.call(claim, k)) c[k] = claim[k];
    c.sharingMode = mode;
    if (mode === 'network') c.networkAt = c.networkAt || c.liveAt;
    if (mode === 'delayed' && !c.networkAt) c.networkAt = null;
    return c;
  }

  /** Applies a previously proposed change. The only write path in the agent. */
  function apply(proposal) {
    if (!proposal || proposal.type !== 'proposal') return { ok: false, message: 'Nothing to apply.' };
    if (proposal.action === 'block_supplier') {
      proposal.propertyIds.forEach(function (pid) { S.blockSupplierForProperty(pid, proposal.supplierId); });
      return { ok: true, message: proposal.supplierName + ' blocked on ' + proposal.propertyIds.length + ' propert' + (proposal.propertyIds.length === 1 ? 'y' : 'ies') + '.' };
    }
    if (proposal.action === 'set_sharing_mode') {
      S.setSharingMode(proposal.claimId, proposal.mode, C.delayedExclusivityDays[0]);
      return { ok: true, message: proposal.supplierName + ' switched to ' + proposal.mode + ' sharing.' };
    }
    return { ok: false, message: 'Unknown action.' };
  }

  /* ---------- router ---------- */
  function ask(prompt) {
    var q = parse(prompt);
    if (q.block && q.supplier) return proposeBlock(q.supplier, q.propertyHint);
    if (q.switchMode && q.supplier && q.mode) return proposeMode(q.supplier, q.mode);
    if (q.source) return whatToSource(q.destination);
    if (q.dropped) return whyResidualChanged();
    if (q.atRisk) return suppliersAtRisk();
    if (q.worth) return bookValue();
    if (q.supplier) {
      var s = q.supplier, c = S.getClaimBySupplier(s.id);
      return { type: 'supplier_summary', headline: s.name + ' · ' + s.subcategory + ' in ' + (S.getDestinationById(s.destinationId) || {}).name + '.',
        supplierId: s.id, state: c ? c.state : 'unclaimed', score: s.score,
        href: 'supplier-detail.html?supplier=' + s.id,
        reasoningSummary: 'Matched the supplier by name. Open the detail page for the full claim, coverage and economics.' };
    }
    return {
      type: 'help',
      headline: 'I can work on your supply book, gaps, quality and coverage.',
      suggestions: SUGGESTIONS.slice(),
      reasoningSummary: 'Everything I answer comes from the same service layer the pages use, so the numbers always agree.'
    };
  }

  var SUGGESTIONS = [
    'What should I source in Cádiz?',
    'Why did my residual drop last month?',
    'Which of my suppliers are at risk?',
    'How much is my supply book worth?',
    'Block the kayak operator for my Gràcia properties',
    'Switch Bodega Riera to network mode'
  ];

  window.LNAgent = {
    ask: ask, apply: apply, parse: parse, suggestions: SUGGESTIONS,
    whatToSource: whatToSource, whyResidualChanged: whyResidualChanged,
    suppliersAtRisk: suppliersAtRisk, bookValue: bookValue,
    proposeBlock: proposeBlock, proposeMode: proposeMode
  };
})();
