/* ============================================================
   Local Network — Earnings service
   Turns raw order lines into money: the supply book, the accrual ledger,
   the earnings summary and the five-year decay projection.

   It owns no arithmetic of its own — every euro comes from
   NetworkService.computeAccrual (the economics kernel), so a number on
   the supply book can never disagree with the same number on a
   supplier's detail page. Merged onto window.NetworkService so pages
   keep talking to one service object.
   ============================================================ */
(function () {
  'use strict';
  var S = window.NetworkService, C = window.LN_CONFIG;
  var D = S._dataset;

  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function round2(n) { return Math.round(n * 100) / 100; }
  function monthKey(d) { return String(d).slice(0, 7); }
  function dayjs(s) { return new Date(String(s).slice(0, 10) + 'T00:00:00Z'); }
  function computeAccrual(g, c, s, d, a) { return S.computeAccrual(g, c, s, d, a); }
  function getClaimById(id) { return S.getClaimById(id); }
  function getSupplierById(id) { return S.getSupplierById(id); }
  function getClaims(f) { return S.getClaims(f); }
  function isCurator(id) { return S.isCurator(id); }
  function currentAccountId() { return S.currentAccountId(); }
  function assumedGmv(cat) { return S.assumedGmv(cat); }

  function accrualForLine(line) {
    var c = getClaimById(line.claimId), s = getSupplierById(line.supplierId);
    if (!c || !s) return null;
    var d = find(D.destinations, s.destinationId);
    var a = computeAccrual(line.gmv, c, s, d, line.date);
    a.id = 'acr_' + line.id.slice(4);
    a.orderLineId = line.id;
    a.servingPropertyId = line.servingPropertyId;
    return a;
  }
  function getAccruals(f) {
    f = f || {};
    var lines = D.orderLines;
    if (f.claimId) lines = lines.filter(function (l) { return l.claimId === f.claimId; });
    if (f.supplierId) lines = lines.filter(function (l) { return l.supplierId === f.supplierId; });
    if (f.month) lines = lines.filter(function (l) { return monthKey(l.date) === f.month; });
    if (f.fromMonth) lines = lines.filter(function (l) { return monthKey(l.date) >= f.fromMonth; });
    var rows = lines.map(accrualForLine).filter(Boolean);
    if (f.accountId) {
      rows = rows.filter(function (a) { return a.roleSplits.some(function (r) { return r.holderAccountId === f.accountId; }); });
    }
    return rows.sort(function (a, b) { return a.periodMonth < b.periodMonth ? 1 : -1; });
  }
  /** What one account actually receives from an accrual — its role shares only. */
  function shareOf(accrual, accountId) {
    return round2(accrual.roleSplits.reduce(function (s, r) { return s + (r.holderAccountId === accountId ? r.amount : 0); }, 0));
  }

  function getSupplyBook(accountId) {
    accountId = accountId || currentAccountId();
    var entries = getClaims({ accountId: accountId }).map(function (c) {
      var s = getSupplierById(c.supplierId);
      var d = s ? find(D.destinations, s.destinationId) : null;
      if (!s) return null;
      var rolesHeld = (c.roles || []).filter(function (r) { return r.holderAccountId === accountId && !r.until; });
      var current = computeAccrual(100, c, s, d);
      var accruals = getAccruals({ claimId: c.id });
      var thisMonth = monthKey(D.today), thisYear = D.today.slice(0, 4);
      var trend = trailingMonths(12).map(function (m) {
        return round2(accruals.filter(function (a) { return a.periodMonth === m; }).reduce(function (t, a) { return t + shareOf(a, accountId); }, 0));
      });
      var liveGmv = accruals.filter(function (a) { return a.periodMonth >= monthKey(addMonths(D.today, -12)); })
        .reduce(function (t, a) { return t + a.gmv; }, 0);
      var roleSharePct = rolesHeld.reduce(function (t, r) { return t + r.sharePct; }, 0);
      return {
        claim: c, supplier: s, destination: d,
        rolesHeld: rolesHeld.map(function (r) { return r.role; }), roleSharePct: roleSharePct,
        liveGmv: liveGmv, currentPoolPct: current.poolPct, chain: current.chain,
        blockedReason: current.blockedReason,
        mtdResidual: round2(accruals.filter(function (a) { return a.periodMonth === thisMonth; }).reduce(function (t, a) { return t + shareOf(a, accountId); }, 0)),
        ytdResidual: round2(accruals.filter(function (a) { return a.periodMonth.slice(0, 4) === thisYear; }).reduce(function (t, a) { return t + shareOf(a, accountId); }, 0)),
        lifetimeResidual: round2(accruals.reduce(function (t, a) { return t + shareOf(a, accountId); }, 0)),
        projectedAnnual: round2(liveGmv * current.poolPct / 100 * roleSharePct / 100),
        trend: trend, atRisk: c.state === 'watch' || c.state === 'suspended' || s.score < 0.75
      };
    }).filter(Boolean);

    var totals = {
      claims: entries.length,
      live: entries.filter(function (e) { return e.claim.state === 'live'; }).length,
      atRisk: entries.filter(function (e) { return e.atRisk; }).length,
      mtd: round2(entries.reduce(function (t, e) { return t + e.mtdResidual; }, 0)),
      ytd: round2(entries.reduce(function (t, e) { return t + e.ytdResidual; }, 0)),
      lifetime: round2(entries.reduce(function (t, e) { return t + e.lifetimeResidual; }, 0)),
      projectedAnnual: round2(entries.reduce(function (t, e) { return t + e.projectedAnnual; }, 0))
    };
    // 5-year book value: run the decay curve forward on every live claim
    totals.fiveYearValue = round2(entries.reduce(function (t, e) {
      return t + projectResidual(e.claim.id, 5, accountId).reduce(function (s, y) { return s + y.amount; }, 0);
    }, 0));
    return { entries: entries, totals: totals, isCurator: isCurator(accountId) };
  }
  function trailingMonths(n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) out.push(monthKey(addMonths(D.today, -i)));
    return out;
  }
  function addMonths(iso, n) { var d = dayjs(iso); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }

  function getEarningsSummary(accountId, period) {
    accountId = accountId || currentAccountId();
    var book = getSupplyBook(accountId);
    var months = trailingMonths(period || 18);
    var accruals = getAccruals({ accountId: accountId });
    return {
      mtd: book.totals.mtd, ytd: book.totals.ytd, lifetime: book.totals.lifetime,
      projectedAnnual: book.totals.projectedAnnual,
      bySupplier: book.entries.map(function (e) { return { supplierId: e.supplier.id, name: e.supplier.name, amount: e.lifetimeResidual }; })
        .sort(function (a, b) { return b.amount - a.amount; }),
      byMonth: months.map(function (m) {
        return { month: m, amount: round2(accruals.filter(function (a) { return a.periodMonth === m; }).reduce(function (t, a) { return t + shareOf(a, accountId); }, 0)) };
      })
    };
  }

  /** The decay curve, for charting. One entry per year, using the claim's
   *  trailing-12m GMV held flat so the shape is purely the decay schedule. */
  function projectResidual(claimId, years, accountId) {
    var c = getClaimById(claimId); if (!c) return [];
    accountId = accountId || currentAccountId();
    var s = getSupplierById(c.supplierId);
    var d = s ? find(D.destinations, s.destinationId) : null;
    var accruals = getAccruals({ claimId: claimId });
    var gmv12 = accruals.filter(function (a) { return a.periodMonth >= monthKey(addMonths(D.today, -12)); })
      .reduce(function (t, a) { return t + a.gmv; }, 0);
    if (!gmv12) gmv12 = assumedGmv(s && s.category);
    var shares = (c.roles || []).filter(function (r) { return r.holderAccountId === accountId && !r.until; })
      .reduce(function (t, r) { return t + r.sharePct; }, 0);
    var out = [];
    for (var y = 0; y < (years || 5); y++) {
      var asOf = addMonths(D.today, y * 12);
      var a = computeAccrual(gmv12, c, s, d, asOf);
      out.push({
        year: y + 1, asOf: asOf, poolPct: a.poolPct, decayStep: a.decayStep,
        decayLabel: a.decayLabel || '—', gmv: gmv12,
        amount: round2(a.poolAmount * shares / 100)
      });
    }
    return out;
  }

  S.accrualForLine = accrualForLine;
  S.getAccruals = getAccruals;
  S.shareOf = shareOf;
  S.getSupplyBook = getSupplyBook;
  S.getEarningsSummary = getEarningsSummary;
  S.projectResidual = projectResidual;
  S.trailingMonths = trailingMonths;
  S.addMonths = addMonths;
})();
