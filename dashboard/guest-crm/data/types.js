/* ============================================================
   Guest CRM — Domain Types (JSDoc)
   The project is plain JS (no TS compiler), so types are expressed
   as JSDoc typedefs. They document the shape of CRM_DATA / service
   responses and keep the architecture ready for real typed APIs.
   No runtime code here.
   ============================================================ */

/**
 * @typedef {'lead'|'prospect'|'guest'|'in_house'|'past'|'repeat'|'vip'|'dormant'} LifecycleStage
 * @typedef {'email'|'whatsapp'|'sms'|'push'|'inbox'} Channel
 * @typedef {'transactional'|'marketing'|'operational'|'partner_marketing'} ConsentCategory
 * @typedef {'granted'|'denied'|'unknown'} ConsentStatus
 */

/**
 * @typedef {Object} ConsentSummary
 * @property {ConsentStatus} emailMarketing
 * @property {ConsentStatus} whatsappMarketing
 * @property {ConsentStatus} smsMarketing
 * @property {boolean} globalUnsubscribe
 */

/**
 * @typedef {Object} Guest
 * @property {string} id
 * @property {string} organizationId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} language        ISO 639-1
 * @property {string} country         ISO 3166-1 alpha-2
 * @property {string} city
 * @property {string} timezone
 * @property {Channel} sourceChannel
 * @property {string} createdAt        ISO date
 * @property {string} updatedAt
 * @property {string[]} tags
 * @property {LifecycleStage} lifecycleStage
 * @property {number} profileCompleteness  0..100
 * @property {ConsentSummary} consentSummary
 * @property {number} totalRevenue
 * @property {number} appSalesRevenue
 * @property {string|null} lastStayAt
 * @property {string|null} nextStayAt
 * @property {string} aiSummary
 * @property {RecommendedAction[]} recommendedActions
 */

/**
 * @typedef {Object} RecommendedAction
 * @property {string} id
 * @property {string} label
 * @property {string} reason          the "why?" explanation
 * @property {'upsell'|'recover'|'reactivate'|'operational'|'review'} kind
 * @property {string} [dealId]
 * @property {number} [estimatedRevenue]
 */

/**
 * @typedef {Object} GuestIdentity
 * @property {string} id
 * @property {string} guestId
 * @property {'email'|'phone'|'document'|'reservation'|'external_id'} type
 * @property {string} value
 * @property {number} confidence
 * @property {string} source
 */

/**
 * @typedef {Object} Reservation
 * @property {string} id
 * @property {string} guestId
 * @property {string} propertyId
 * @property {string} propertyName
 * @property {string} bookingReference
 * @property {string} checkInDate
 * @property {string} checkOutDate
 * @property {'confirmed'|'in_house'|'completed'|'cancelled'|'no_show'} status
 * @property {Channel|'ota'|'direct'|'booking_com'|'airbnb'|'expedia'} channel
 * @property {number} adults
 * @property {number} children
 * @property {number} infants
 * @property {number} nights
 * @property {number} totalValue
 * @property {string} currency
 * @property {string} roomType
 * @property {'leisure'|'business'|'family'|'couple'|'unknown'} purpose
 */

/**
 * @typedef {Object} GuestPreference
 * @property {string} id
 * @property {string} guestId
 * @property {string} key
 * @property {string} value
 * @property {'declared'|'inferred'|'imported'|'ai'} source
 * @property {number} confidence
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Consent
 * @property {string} id
 * @property {string} guestId
 * @property {Channel} channel
 * @property {ConsentCategory} category
 * @property {ConsentStatus} status
 * @property {string} source
 * @property {string} capturedAt
 * @property {string|null} revokedAt
 * @property {string} proof
 */

/**
 * @typedef {Object} ConversationEvent
 * @property {string} id
 * @property {string} guestId
 * @property {string|null} reservationId
 * @property {Channel} channel
 * @property {'inbound'|'outbound'} direction
 * @property {string} timestamp
 * @property {string} summary
 * @property {string} detectedIntent
 * @property {'positive'|'neutral'|'negative'} sentiment
 * @property {string} sourceConversationId
 */

/**
 * @typedef {Object} CheckInEvent
 * @property {string} id
 * @property {string} guestId
 * @property {string} reservationId
 * @property {'not_started'|'started'|'completed'|'abandoned'} status
 * @property {string|null} startedAt
 * @property {string|null} completedAt
 * @property {string|null} abandonedAt
 * @property {string[]} collectedFields
 */

/**
 * @typedef {Object} Deal
 * @property {string} id
 * @property {string} organizationId
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {'own'|'third_party'} providerType
 * @property {string} providerName
 * @property {number} price
 * @property {string} currency
 * @property {number} margin            0..1
 * @property {number} commission        0..1 (for third_party)
 * @property {boolean} active
 * @property {string} availability
 * @property {Object[]} eligibilityRules
 * @property {string[]} tags
 * @property {string[]} propertyIds
 * @property {string} imageUrl
 * @property {number} conversionRate     0..1
 * @property {number} averageRevenue
 */

/**
 * @typedef {Object} SegmentRule
 * @property {string} field
 * @property {'equals'|'not_equals'|'in'|'not_in'|'contains'|'not_contains'|'greater_than'|'less_than'|'between'|'is_true'|'is_false'} operator
 * @property {*} value
 * @property {string} [label]   human label for the chip
 */

/**
 * @typedef {Object} Segment
 * @property {string} id
 * @property {string} organizationId
 * @property {string} name
 * @property {string} description
 * @property {string} naturalLanguageQuery
 * @property {SegmentRule[]} rules
 * @property {'dynamic'|'static'|'ai_suggested'} type
 * @property {number} estimatedSize
 * @property {number} eligibleSize
 * @property {number} excludedSize
 * @property {string[]} exclusions
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} CampaignContent
 * @property {string} subject
 * @property {string} previewText
 * @property {string} body
 * @property {string} ctaLabel
 * @property {string} ctaUrl
 * @property {string} language
 * @property {string} tone
 * @property {string[]} personalizationTokens
 */

/**
 * @typedef {Object} CampaignVariant
 * @property {string} id
 * @property {string} name
 * @property {CampaignContent} content
 * @property {number} allocationPercentage
 */

/**
 * @typedef {Object} CampaignAnalytics
 * @property {number} sent
 * @property {number} delivered
 * @property {number} opened
 * @property {number} clicked
 * @property {number} converted
 * @property {number} revenue
 * @property {number} commission
 * @property {number} unsubscribed
 * @property {number} failed
 * @property {number} conversionRate
 * @property {number} clickRate
 */

/**
 * @typedef {Object} Campaign
 * @property {string} id
 * @property {string} organizationId
 * @property {string} name
 * @property {string} objective
 * @property {'draft'|'needs_review'|'approved'|'scheduled'|'active'|'paused'|'completed'} status
 * @property {string|null} segmentId
 * @property {SegmentRule[]} audienceRules
 * @property {Channel} channel
 * @property {AutomationTriggerRef} trigger
 * @property {Object} schedule
 * @property {{dealId:string,title:string,reason:string}[]} deals
 * @property {CampaignContent} content
 * @property {CampaignVariant[]} variants
 * @property {ConsentCheckResult} consentCheck
 * @property {RevenueEstimate} revenueEstimate
 * @property {CampaignAnalytics|null} analytics
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} approvedBy
 * @property {string|null} approvedAt
 */

/**
 * @typedef {Object} AutomationTriggerRef
 * @property {string} type
 * @property {number} [value]
 */

/**
 * @typedef {Object} AutomationTrigger
 * @property {string} id
 * @property {string} name
 * @property {string} eventType
 * @property {string} description
 * @property {Object[]} conditions
 * @property {number} delay
 * @property {boolean} active
 */

/**
 * @typedef {Object} RevenueEstimate
 * @property {number} expectedConversions
 * @property {number} expectedRevenue
 * @property {string} currency
 */

/**
 * @typedef {Object} ConsentCheckResult
 * @property {'passed'|'warning'|'failed'} status
 * @property {number} audienceSize
 * @property {number} eligibleSize
 * @property {number} excludedSize
 * @property {{reason:string,count:number}[]} exclusions
 * @property {string[]} notes
 */

/**
 * @typedef {Object} AgentRun
 * @property {string} id
 * @property {'guest_profile'|'segment_builder'|'campaign_planner'|'deal_matching'|'compliance_check'|'analytics_summary'} type
 * @property {Object} input
 * @property {Object} output
 * @property {string} reasoningSummary
 * @property {string} createdAt
 * @property {string} createdBy
 * @property {'queued'|'running'|'completed'|'failed'} status
 */

/**
 * @typedef {Object} Approval
 * @property {string} id
 * @property {'campaign'|'automation'|'segment'} objectType
 * @property {string} objectId
 * @property {'pending'|'approved'|'rejected'} status
 * @property {string} requestedBy
 * @property {string|null} reviewedBy
 * @property {string|null} reviewedAt
 * @property {string} comment
 */
