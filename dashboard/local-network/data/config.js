/* ============================================================
   Local Network — Economic configuration
   ------------------------------------------------------------
   EVERY number the programme runs on lives here. No percentage,
   multiplier, window or cap may be hard-coded anywhere else in
   the module — services, pages and the agent all read LN_CONFIG.

   This is the file to edit after the pilot. Each block explains
   what the number does and what moves if you change it.
   ============================================================ */
window.LN_CONFIG = {
  currency: 'EUR',

  /* ---------- Base platform economics (context, not editable here) ----------
     Mirrors the AppSell marketplace doc §17. Shown in the UI purely so hosts
     can see that the residual is NOT carved out of anyone else's share.
     If these drift from AppSell, update them here — the transparency panels
     on discover.html read these values directly. */
  baseNrpPctOfGmv: 20,                    // standard commission on external supply
  servingPropertySharePctOfExternalNrp: 40, // what the property serving the guest keeps
  pmsPartnerSharePctOfNrp: 30,            // what the PMS/channel partner keeps

  /* ---------- The network premium ----------
     A locally-sourced supplier who is not already on an aggregator accepts a
     higher commission (~25% instead of ~20%) because we bring them demand they
     had no other route to. Those extra 5 points — and ONLY those — fund the
     sourcing pool. The serving host's 40% and the PMS partner's 30% are
     computed off the base 20% and are untouched. This is invariant #2, and it
     is what makes the programme acceptable to hosts who did not source. */
  networkPremiumPctOfGmv: 5,

  /* Sourcing pool before decay/boosts = basePoolPctOfGmv × qualityMultiplier,
     then capped at the premium available in that destination/category. */
  basePoolPctOfGmv: 4,

  /* ---------- Role shares ----------
     Three separable contributions. Usually one host holds all three, but each
     can be held, released and re-assigned independently. MUST sum to 100. */
  roleShares: { sourced: 30, activated: 45, maintained: 25 },

  /* ---------- Decay ----------
     Months counted from the claim's go-live date. The residual steps down and
     then holds at a perpetual floor — it never reaches zero while the claim is
     live and the host is an active Chekin customer. */
  decaySchedule: [
    { fromMonth: 1,  toMonth: 12,   multiplier: 1.00, label: 'Year 1' },
    { fromMonth: 13, toMonth: 24,   multiplier: 0.80, label: 'Year 2' },
    { fromMonth: 25, toMonth: 36,   multiplier: 0.60, label: 'Year 3' },
    { fromMonth: 37, toMonth: null, multiplier: 0.40, label: 'Year 4+ (floor)' }
  ],

  /* ---------- Quality ----------
     The supplier's score scales the pool. Below the floor nothing accrues at
     all — we do not pay a residual on supply that is hurting guests.
     Bands are matched by `score >= min`, highest band first. */
  qualityBands: [
    { min: 0.90, max: 1.00, multiplier: 1.25, label: 'Excellent' },
    { min: 0.75, max: 0.89, multiplier: 1.00, label: 'Good' },
    { min: 0.60, max: 0.74, multiplier: 0.60, label: 'At risk' },
    { min: 0.00, max: 0.59, multiplier: 0.00, label: 'Failing' }
  ],

  /* ---------- Sharing modes ----------
     'private'  — supplier serves only the sourcing host's properties. No pool.
     'network'  — bookable across coverage from day one. Full pool.
     'delayed'  — exclusive to the sourcing host for a window, then goes to
                  network with a temporary boost as compensation for waiting. */
  delayedExclusivityDays: [60, 90],       // the two window lengths offered
  delayedBoostMultiplier: 1.15,
  delayedBoostMonths: 12,                 // boost applies to the first N network months

  /* ---------- Bounties ----------
     Demand gaps Chekin wants filled. Filling one boosts the pool for a year. */
  bountyBoostMultiplier: 1.50,
  bountyBoostMonths: 12,

  /* ---------- Coverage caps (km) ----------
     Per category, because a luggage locker and an airport transfer do not
     serve the same radius. Coverage can never exceed the cap for its category. */
  coverageCapsKm: {
    storage: 3, dining: 5, wellness: 15, equipment: 15,
    pet: 15, experience: 25, tickets: 25, transfer: 75, mobility: 75
  },

  /* ---------- Claim windows (days / months) ---------- */
  claimWindows: {
    supplierConfirmDays: 30,              // pending_supplier → expired
    activationDays: 60,                   // onboarding → activated role released
    churnGraceDays: 90,                   // host churns → dormant
    dormantReactivationMonths: 12         // dormant → released
  },

  /* ---------- Local Curator ----------
     Recognition only — it changes review latency, not economics. */
  curatorThreshold: { minLiveSuppliers: 3, minAvgScore: 0.85 },

  /* ---------- Enforcement ---------- */
  suspensionsVoidingClaim: 2,             // two suspensions within 12 months voids the claim
  qualityFloorForAccrual: 0.60,

  /* ---------- Saturation ----------
     Reduced premium for categories a destination already covers well. A
     category counts as saturated when the destination's supplyDensity is
     'high' AND the category appears in destination.categoriesCovered — we do
     not pay a full sourcing premium for supply we already have. Set to 0 to
     stop paying anything on saturated categories. */
  saturatedPremiumPctOfGmv: 1,

  /* ---------- Safety ----------
     Categories that always require a Chekin admin decision, regardless of who
     sourced them or whether a Local Curator has already reviewed. */
  hardGateCategories: ['experience', 'transfer', 'mobility'],
  hardGateRisks: ['water', 'height', 'vehicles', 'alcohol', 'minors'],

  /* ---------- Projection assumptions ----------
     Annual GMV a healthy supplier in each category is expected to do. Used
     ONLY where there is no booking history to read yet: the submit wizard's
     "what would this earn" cards and the bounty board's projected residual.
     These are calibrated against the observed book — keep them in step with
     reality after the pilot or the wizard will over-promise. */
  assumedAnnualGmvByCategory: {
    storage: 2000, dining: 5500, wellness: 8000, equipment: 4000,
    pet: 3500, experience: 8000, tickets: 3000, transfer: 7500, mobility: 3500
  },
  assumedAnnualGmvDefault: 5000
};
