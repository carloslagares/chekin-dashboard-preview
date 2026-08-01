/* ============================================================
   Local Network — Economics kernel
   The calculation, and nothing else. This file never touches LN_DATA:
   every input arrives as an argument, so the same code can price a real
   booking, a historic line, or a hypothetical in the submit wizard.

   computeAccrual() is the ONLY place a residual euro is produced.
   NetworkService re-exports it; nothing else in the module may
   multiply a percentage by a GMV.
   ============================================================ */
(function () {
  'use strict';
  var C = window.LN_CONFIG;

  // The "today" the module runs against, injected by NetworkService at boot
  // so fixtures stay deterministic and this file stays free of Date.now().
  var TODAY_ISO = '1970-01-01';
  function setToday(iso) { TODAY_ISO = iso; }

  function dayjs(s) { return new Date(String(s).slice(0, 10) + 'T00:00:00Z'); }
  function monthsBetween(a, b) {
    var x = dayjs(a), y = dayjs(b);
    return (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + (y.getUTCMonth() - x.getUTCMonth());
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function monthKey(d) { return String(d).slice(0, 7); }

  /** The premium available on this supplier in this destination. A category
   *  the destination already covers well is "saturated" — we do not pay a full
   *  sourcing premium for supply we already have. */
  function premiumFor(destination, supplier) {
    if (!destination || !supplier) return C.networkPremiumPctOfGmv;
    var saturated = destination.supplyDensity === 'high' &&
      destination.categoriesCovered.indexOf(supplier.category) >= 0;
    return saturated ? C.saturatedPremiumPctOfGmv : C.networkPremiumPctOfGmv;
  }
  function isSaturated(destination, supplier) {
    return premiumFor(destination, supplier) !== C.networkPremiumPctOfGmv;
  }

  /** Quality band by score. Bands are matched highest-first on `score >= min`
   *  so a value that falls between two published band edges still resolves. */
  function qualityBand(score) {
    for (var i = 0; i < C.qualityBands.length; i++) {
      if (score >= C.qualityBands[i].min) return C.qualityBands[i];
    }
    return C.qualityBands[C.qualityBands.length - 1];
  }
  function qualityMultiplier(score) { return qualityBand(score).multiplier; }

  /** Decay step for a claim, as of a date. Month 1 is the first month live. */
  function decayFor(liveAt, asOf) {
    if (!liveAt) return { step: 1, multiplier: C.decaySchedule[0].multiplier, label: C.decaySchedule[0].label, monthsLive: 0 };
    var m = monthsBetween(liveAt, asOf || TODAY_ISO) + 1;
    if (m < 1) m = 1;
    for (var i = 0; i < C.decaySchedule.length; i++) {
      var s = C.decaySchedule[i];
      if (m >= s.fromMonth && (s.toMonth === null || m <= s.toMonth)) {
        return { step: i + 1, multiplier: s.multiplier, label: s.label, monthsLive: m };
      }
    }
    var last = C.decaySchedule[C.decaySchedule.length - 1];
    return { step: C.decaySchedule.length, multiplier: last.multiplier, label: last.label, monthsLive: m };
  }

  /** States in which a claim accrues at all. Suspending a claim zeroes the
   *  residual — it never touches the supplier, so guests are unaffected. */
  var ACCRUING_STATES = ['live', 'watch'];

  /** Why a claim earns nothing, in the host's own terms. Returns null when it does earn. */
  function blockedReason(claim, supplier) {
    if (!claim) return 'No claim on this supplier.';
    if (claim.sharingMode === 'private') return 'Private mode — this supplier serves only your properties, so no network pool accrues.';
    if (claim.sharingMode === 'delayed' && !claim.networkAt) return 'In delayed exclusivity — the residual starts when the exclusivity window closes.';
    if (ACCRUING_STATES.indexOf(claim.state) < 0) {
      return { suspended: 'Claim suspended — accrual is zero until it is reinstated. The supplier stays bookable.',
        dormant: 'Claim dormant — the sourcing host is no longer an active Chekin customer.',
        released: 'Claim released — the reactivation window closed.',
        terminated: 'Claim terminated.', expired: 'Claim expired — the supplier never confirmed.'
      }[claim.state] || 'Claim is not live yet.';
    }
    if (supplier && supplier.score < C.qualityFloorForAccrual) return 'Score is below the quality floor of ' + C.qualityFloorForAccrual.toFixed(2) + ' — nothing accrues.';
    return null;
  }

  /**
   * THE calculation. Every euro of residual in this module comes from here.
   *
   *   poolPct  = min(base × quality, premium)
   *   poolPct *= decay
   *   poolPct *= bounty boost (if within the boost window)
   *   poolPct *= delayed boost (if within the boost window)
   *   poolPct  = min(poolPct, premium)          // never exceed the premium
   *   amount   = gmv × poolPct / 100
   *   then split across the roles actually held.
   *
   * @param {number} gmv
   * @param {Object} claim
   * @param {Object} supplier
   * @param {Object} destination
   * @param {string} [asOf]  ISO date — defaults to today. Historic lines pass
   *                         their own date so the decay step is the one that
   *                         applied when the booking happened.
   */
  function computeAccrual(gmv, claim, supplier, destination, asOf) {
    asOf = asOf || TODAY_ISO;
    var premium = premiumFor(destination, supplier);
    var chain = [];
    var blocked = blockedReason(claim, supplier);

    var band = qualityBand(supplier ? supplier.score : 0);
    var decay = decayFor(claim && claim.liveAt, asOf);

    if (blocked) {
      chain.push({ kind: 'base', label: 'Base pool', value: C.basePoolPctOfGmv, runningPct: C.basePoolPctOfGmv });
      chain.push({ kind: 'result', label: blocked, value: 0, runningPct: 0 });
      return {
        id: null, orderLineId: null, claimId: claim ? claim.id : null, supplierId: supplier ? supplier.id : null,
        servingPropertyId: null, gmv: gmv, poolPct: 0, poolAmount: 0, decayStep: decay.step,
        qualityMultiplier: band.multiplier, qualityLabel: band.label, bountyBoost: 1, delayedBoost: 1,
        premiumCapPct: premium, saturated: isSaturated(destination, supplier), blockedReason: blocked,
        chain: chain, roleSplits: [], unallocatedAmount: 0, periodMonth: monthKey(asOf), status: 'void'
      };
    }

    // 1 — base × quality, capped at the premium
    var pct = C.basePoolPctOfGmv;
    chain.push({ kind: 'base', label: 'base', value: C.basePoolPctOfGmv, runningPct: pct });
    pct = pct * band.multiplier;
    chain.push({ kind: 'quality', label: band.label.toLowerCase() + ' quality', value: band.multiplier, runningPct: pct });
    if (pct > premium) { pct = premium; chain.push({ kind: 'cap', label: 'capped at premium', value: premium, runningPct: pct }); }

    // 2 — decay
    pct = pct * decay.multiplier;
    chain.push({ kind: 'decay', label: 'decay · ' + decay.label.toLowerCase(), value: decay.multiplier, runningPct: pct });

    // 3 — bounty boost, for the first bountyBoostMonths after go-live
    var bountyBoost = 1;
    if (claim.bountyId && monthsBetween(claim.liveAt, asOf) < C.bountyBoostMonths) {
      bountyBoost = C.bountyBoostMultiplier;
      pct = pct * bountyBoost;
      chain.push({ kind: 'bounty', label: 'bounty boost', value: bountyBoost, runningPct: pct });
    }

    // 4 — delayed-sharing boost, for the first delayedBoostMonths on network
    var delayedBoost = 1;
    if (claim.sharingMode === 'delayed' && claim.networkAt && monthsBetween(claim.networkAt, asOf) < C.delayedBoostMonths) {
      delayedBoost = C.delayedBoostMultiplier;
      pct = pct * delayedBoost;
      chain.push({ kind: 'delayed', label: 'delayed-sharing boost', value: delayedBoost, runningPct: pct });
    }

    // 5 — hard cap: the pool can never exceed the premium that funds it
    if (pct > premium) { pct = premium; chain.push({ kind: 'cap', label: 'capped at premium', value: premium, runningPct: pct }); }

    pct = Math.round(pct * 1000) / 1000;
    var amount = round2(gmv * pct / 100);
    chain.push({ kind: 'result', label: 'residual', value: amount, runningPct: pct });

    // 6 — split across the roles actually held. A released role is not paid to
    //     anyone; its share stays with Chekin rather than inflating the others.
    var held = (claim.roles || []).filter(function (r) { return r.holderAccountId && !r.until; });
    var heldPct = held.reduce(function (s, r) { return s + r.sharePct; }, 0);
    var allocated = round2(amount * heldPct / 100);
    var splits = held.map(function (r) {
      return { role: r.role, holderAccountId: r.holderAccountId, sharePct: r.sharePct, amount: round2(amount * r.sharePct / 100) };
    });
    // Absorb rounding into the largest share so the parts can never sum to more
    // than the whole — a cent of drift here would show up as a broken total.
    if (splits.length) {
      var sum = splits.reduce(function (s, x) { return s + x.amount; }, 0);
      var diff = round2(allocated - sum);
      if (diff !== 0) {
        var big = 0;
        for (var j = 1; j < splits.length; j++) if (splits[j].amount > splits[big].amount) big = j;
        splits[big].amount = round2(splits[big].amount + diff);
      }
    }

    return {
      id: null, orderLineId: null, claimId: claim.id, supplierId: supplier.id, servingPropertyId: null,
      gmv: gmv, poolPct: pct, poolAmount: amount, decayStep: decay.step, decayLabel: decay.label,
      monthsLive: decay.monthsLive, qualityMultiplier: band.multiplier, qualityLabel: band.label,
      bountyBoost: bountyBoost, delayedBoost: delayedBoost, premiumCapPct: premium,
      saturated: isSaturated(destination, supplier), blockedReason: null,
      chain: chain, roleSplits: splits, unallocatedAmount: round2(amount - allocated),
      periodMonth: monthKey(asOf), status: 'posted'
    };
  }

  window.LNEconomics = {
    setToday: setToday,
    premiumFor: premiumFor, isSaturated: isSaturated,
    qualityBand: qualityBand, qualityMultiplier: qualityMultiplier,
    decayFor: decayFor, blockedReason: blockedReason,
    computeAccrual: computeAccrual,
    accruingStates: ACCRUING_STATES
  };
})();
