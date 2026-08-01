/* ============================================================
   Local Network — Domain Types (JSDoc)
   The module is plain JS (no TS compiler), so types are expressed as
   JSDoc typedefs. They document the shape of LN_DATA and the
   NetworkService responses and keep the architecture ready for real
   typed APIs. No runtime code here.
   ============================================================ */

/**
 * @typedef {'storage'|'dining'|'wellness'|'equipment'|'pet'|'experience'|'tickets'|'transfer'|'mobility'} Category
 * @typedef {'central'|'network'|'property_partner'} SupplierOrigin
 * @typedef {'draft'|'screening'|'pending_supplier'|'onboarding'|'live'|'watch'|'suspended'|'terminated'} SupplierStatus
 * @typedef {'draft'|'screening'|'pending_supplier'|'onboarding'|'live'|'watch'|'suspended'|'terminated'|'expired'|'dormant'|'released'} ClaimState
 * @typedef {'private'|'network'|'delayed'} SharingMode
 * @typedef {'sourced'|'activated'|'maintained'} RoleKind
 * @typedef {'high'|'medium'|'low'} SupplyDensity
 * @typedef {'host'|'pm'|'supplier'|'chekin'|'admin'} Persona
 */

/**
 * The five factors that make up Supplier.score. Each is normalised 0..1 where
 * 1 is best, so the weighted mean is directly comparable across suppliers.
 * @typedef {Object} ScoreBreakdown
 * @property {number} confirmLatency    how fast they accept a booking
 * @property {number} cancellationRate  inverted — 1 means they never cancel
 * @property {number} noShowRate        inverted
 * @property {number} guestRating       post-experience guest rating
 * @property {number} disputeRate       inverted
 */

/**
 * A local experience provider. Ranking of suppliers is BLIND to who sourced
 * them — nothing on this type may be used to bias what a guest sees.
 * @typedef {Object} Supplier
 * @property {string} id                            sup_*
 * @property {string} name
 * @property {string} legalEntity
 * @property {string} taxId                         NIF/CIF
 * @property {Category} category
 * @property {string} subcategory
 * @property {string} destinationId                 dst_*
 * @property {{lat:number,lng:number}} geo
 * @property {{name:string,email:string,phone:string}} contact
 * @property {string[]} languages                   ISO 639-1
 * @property {SupplierOrigin} origin
 * @property {SupplierStatus} status
 * @property {number} score                         0..1
 * @property {ScoreBreakdown} scoreBreakdown
 * @property {number[]} scoreHistory                trailing months, oldest first
 * @property {Coverage} coverage
 * @property {number} contentCompleteness           0..100
 * @property {string[]} missingContent              keys the supplier still owes
 * @property {boolean} insuranceOnFile
 * @property {boolean} licenceOnFile
 * @property {boolean} aggregatorPresence           already sold via an OTA/aggregator
 * @property {string[]} media
 * @property {number} priceFrom
 * @property {string} currency
 * @property {string[]} riskFlags                   water|height|vehicles|alcohol|minors
 * @property {string} createdAt                     ISO date
 * @property {string|null} liveAt
 */

/**
 * The sourcing host's stake in a supplier. Suspending a claim NEVER suspends
 * the supplier — guests are insulated from any dispute about who earns.
 * @typedef {Object} Claim
 * @property {string} id                            clm_*
 * @property {string} supplierId
 * @property {string} sourcingAccountId
 * @property {ClaimState} state
 * @property {SharingMode} sharingMode
 * @property {string|null} exclusivityUntil         ISO date, delayed mode only
 * @property {ClaimRole[]} roles
 * @property {string|null} bountyId
 * @property {number} decayStep                     1..4, index into LN_CONFIG.decaySchedule
 * @property {number} qualityMultiplier             snapshot of the band multiplier
 * @property {boolean} selfDealingDeclared          host has an interest in the supplier
 * @property {string} createdAt
 * @property {string|null} liveAt
 * @property {string|null} dormantAt
 * @property {string|null} releasedAt
 * @property {string|null} networkAt                when delayed exclusivity ended
 * @property {number} suspensionsLast12m
 * @property {ClaimEvent[]} timeline
 */

/**
 * One of the three separable contributions. One level only — a role holder is
 * always the account that did the work. No account ever earns from another
 * account's sourcing.
 * @typedef {Object} ClaimRole
 * @property {RoleKind} role
 * @property {string} holderAccountId               acc_*
 * @property {number} sharePct                      from LN_CONFIG.roleShares
 * @property {string} since                         ISO date
 * @property {string|null} until
 * @property {string|null} releaseReason
 */

/**
 * @typedef {Object} ClaimEvent
 * @property {string} at                            ISO date
 * @property {'created'|'screened'|'invited'|'confirmed'|'onboarded'|'live'|'watch'|'suspended'|'reinstated'|'terminated'|'expired'|'dormant'|'released'|'role_released'|'mode_changed'|'flagged'|'note'} kind
 * @property {string} title
 * @property {string} detail
 * @property {string} [actor]
 */

/**
 * Where a supplier can be booked. Capped per category by
 * LN_CONFIG.coverageCapsKm — a locker and a transfer are not the same.
 * @typedef {Object} Coverage
 * @property {string} id                            cov_*
 * @property {string} supplierId
 * @property {Category} category
 * @property {'isochrone'|'radius'} basis
 * @property {number|null} minutes                  isochrone basis
 * @property {number|null} km                       radius basis
 * @property {number} capKm                         from config, for the category
 * @property {Array<{lat:number,lng:number}>|null} polygon
 * @property {number} propertiesInCoverage
 */

/**
 * A demand gap Chekin wants filled. Filling one boosts the pool for
 * LN_CONFIG.bountyBoostMonths. Bounties are published openly — every host in
 * the destination sees the same board.
 * @typedef {Object} Bounty
 * @property {string} id                            bty_*
 * @property {string} destinationId
 * @property {Category} category
 * @property {string} title
 * @property {{searches:number,emptyDecisions:number,period:string}} gapEvidence
 * @property {number} boostMultiplier
 * @property {number} activationBonus               one-off, in currency
 * @property {string} expiresAt                     ISO date
 * @property {'open'|'claimed'|'closed'} status
 * @property {string|null} claimedByAccountId
 */

/**
 * One posted earning line. Produced only by NetworkService.computeAccrual —
 * it is the single source of truth for money in this module.
 * @typedef {Object} Accrual
 * @property {string} id                            acr_*
 * @property {string} orderLineId
 * @property {string} claimId
 * @property {string} supplierId
 * @property {string} servingPropertyId
 * @property {number} gmv
 * @property {number} poolPct                       final, after caps
 * @property {number} poolAmount
 * @property {number} decayStep
 * @property {number} qualityMultiplier
 * @property {number} bountyBoost
 * @property {number} delayedBoost
 * @property {number} premiumCapPct                 the cap that applied
 * @property {AccrualStep[]} chain                  renderable breakdown
 * @property {Array<{role:RoleKind,holderAccountId:string,amount:number}>} roleSplits
 * @property {string} periodMonth                   YYYY-MM
 * @property {'posted'|'pending'|'void'} status
 */

/**
 * One link in the readable breakdown chain, e.g.
 * 4.0% base × 1.25 quality × 0.80 decay × 1.50 bounty → capped at 5.0% → €4.50
 * @typedef {Object} AccrualStep
 * @property {'base'|'quality'|'decay'|'bounty'|'delayed'|'cap'|'result'} kind
 * @property {string} label
 * @property {number} value
 * @property {number} runningPct
 */

/**
 * @typedef {Object} Destination
 * @property {string} id                            dst_*
 * @property {string} name
 * @property {string} country
 * @property {{lat:number,lng:number}} geo
 * @property {SupplyDensity} supplyDensity
 * @property {number} activeProperties
 * @property {number} liveSuppliers
 * @property {Category[]} categoriesCovered         drives the saturation rule
 * @property {boolean} densityFloorMet
 */

/**
 * Reuses the dashboard property shape, plus the fields the serving host needs
 * to exercise their veto (invariant #3).
 * @typedef {Object} Property
 * @property {string} id                            hou_*
 * @property {string} name
 * @property {string} city
 * @property {string} country
 * @property {string} accountId
 * @property {string} destinationId
 * @property {{lat:number,lng:number}} geo
 * @property {string[]} blockedSupplierIds
 * @property {Category[]} blockedCategories
 */

/**
 * @typedef {Object} Account
 * @property {string} id                            acc_*
 * @property {string} name
 * @property {'host'|'pm'|'supplier'} type
 * @property {boolean} isActive                     an inactive account's claims go dormant
 * @property {string[]} propertyIds
 * @property {string[]} curatorDestinationIds
 * @property {Category[]} blockedCategories         account-wide veto
 * @property {string} joinedAt
 * @property {string|null} churnedAt
 * @property {string} email
 */

/**
 * Derived view — one row of the supply book. Never stored; always computed by
 * NetworkService.getSupplyBook so the numbers cannot drift from computeAccrual.
 * @typedef {Object} SupplyBookEntry
 * @property {Claim} claim
 * @property {Supplier} supplier
 * @property {Destination} destination
 * @property {RoleKind[]} rolesHeld
 * @property {number} roleSharePct                  sum of the shares this account holds
 * @property {number} liveGmv                       trailing 12 months
 * @property {number} currentPoolPct
 * @property {AccrualStep[]} chain
 * @property {number} mtdResidual
 * @property {number} ytdResidual
 * @property {number} lifetimeResidual
 * @property {number} projectedAnnual
 * @property {number[]} trend                       trailing monthly residuals
 * @property {boolean} atRisk
 */

/**
 * @typedef {Object} EarningsSummary
 * @property {number} mtd
 * @property {number} ytd
 * @property {number} lifetime
 * @property {number} projectedAnnual
 * @property {Array<{supplierId:string,name:string,amount:number}>} bySupplier
 * @property {Array<{month:string,amount:number}>} byMonth
 */

/**
 * A flag raised for admin review. Never auto-acts — a human decides.
 * @typedef {Object} Flag
 * @property {string} id                            flg_*
 * @property {'exclusion'|'self_dealing'|'price_outlier'|'quality_watch'|'duplicate'|'safety'} kind
 * @property {'low'|'medium'|'high'} severity
 * @property {string} supplierId
 * @property {string|null} claimId
 * @property {string} title
 * @property {string} detail
 * @property {string} raisedAt
 */

/**
 * Result of NetworkService.screenClaim — duplicate, exclusion-list and
 * completeness checks, each with the reason spelled out so the rules read as
 * fair rather than arbitrary.
 * @typedef {Object} ScreeningResult
 * @property {'pass'|'blocked'|'needs_info'} outcome
 * @property {Array<{check:string,status:'pass'|'fail'|'warn',message:string}>} checks
 * @property {string} summary
 */

/**
 * @typedef {Object} SupplyGap
 * @property {string} destinationId
 * @property {Category} category
 * @property {number} searches
 * @property {number} emptyDecisions
 * @property {string} period
 * @property {string|null} bountyId
 * @property {number} projectedAnnualResidual
 */
