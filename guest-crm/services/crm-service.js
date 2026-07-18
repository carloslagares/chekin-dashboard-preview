/* ============================================================
   Guest CRM — Service Layer
   Single consumer of CRM_DATA. Swap these implementations for real
   API calls later; component code only ever talks to window.CRMService.
   All reads are synchronous against the in-memory fixtures, but the
   signatures return values you can trivially wrap in Promises.
   ============================================================ */
(function () {
  'use strict';
  // ---------- first-run mode ----------
  // When the flag is set, the service serves an empty dataset so every page
  // shows its true pre-activation state. Static catalogs (properties,
  // trigger types) survive — they exist before any guest does.
  var FIRST_RUN = false;
  try { FIRST_RUN = localStorage.getItem('crm_first_run') === '1'; } catch (e) {}
  function emptyDataset(full) {
    return {
      organizationId: full.organizationId, currency: full.currency, today: full.today,
      properties: full.properties, triggers: full.triggers,
      guests: [], reservations: [], deals: [], consents: [], preferences: [],
      conversations: [], checkins: [], purchases: [], segments: [], campaigns: [],
      automations: [], approvals: [], agentRuns: [], suggestions: []
    };
  }
  var D = FIRST_RUN ? emptyDataset(window.CRM_DATA) : window.CRM_DATA;
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  // ---------- Guests ----------
  function getGuests(filter) {
    var rows = D.guests.slice();
    if (filter) {
      if (filter.search) {
        var q = filter.search.toLowerCase();
        rows = rows.filter(function (g) { return (g.fullName + ' ' + g.email + ' ' + g.phone).toLowerCase().indexOf(q) >= 0; });
      }
      if (filter.lifecycleStage) rows = rows.filter(function (g) { return g.lifecycleStage === filter.lifecycleStage; });
      if (filter.language) rows = rows.filter(function (g) { return g.language === filter.language; });
      if (filter.country) rows = rows.filter(function (g) { return g.country === filter.country; });
      if (filter.consent === 'marketing') rows = rows.filter(function (g) { return g.consentSummary.emailMarketing === 'granted' && !g.consentSummary.globalUnsubscribe; });
      if (filter.consent === 'no_marketing') rows = rows.filter(function (g) { return g.consentSummary.emailMarketing !== 'granted' || g.consentSummary.globalUnsubscribe; });
      if (filter.tag) rows = rows.filter(function (g) { return g.tags.indexOf(filter.tag) >= 0; });
      if (filter.segmentTag) rows = rows.filter(function (g) { return g.segmentTags && g.segmentTags.indexOf(filter.segmentTag) >= 0; });
      if (filter.upcoming) rows = rows.filter(function (g) { return !!g.nextStayAt; });
      if (filter.minRevenue) rows = rows.filter(function (g) { return g.totalRevenue >= filter.minRevenue; });
      if (filter.minScore != null) rows = rows.filter(function (g) { return computeOpportunityScore(g.id).score >= filter.minScore; });
      if (filter.excludeNegative) { rows = rows.filter(function (g) { return !g.segmentTags || !NEG_TAGS.some(function (t) { return g.segmentTags.indexOf(t) >= 0; }); }); }
    }
    return rows;
  }
  function getGuestById(id) { return find(D.guests, id); }
  function getGuestReservations(id) { return D.reservations.filter(function (r) { return r.guestId === id; }).sort(function (a, b) { return a.checkInDate < b.checkInDate ? 1 : -1; }); }
  function getGuestConsents(id) { return D.consents.filter(function (c) { return c.guestId === id; }); }
  function getGuestPreferences(id) { return D.preferences.filter(function (p) { return p.guestId === id; }); }
  function getGuestConversations(id) { return D.conversations.filter(function (c) { return c.guestId === id; }).sort(function (a, b) { return a.timestamp < b.timestamp ? 1 : -1; }); }
  function getGuestPurchases(id) { return D.purchases.filter(function (p) { return p.guestId === id; }); }
  function getGuestCheckins(id) { return D.checkins.filter(function (c) { return c.guestId === id; }); }
  function getGuestCampaigns(id) {
    // campaigns whose audience would include this guest (demo: by stage/tag heuristics)
    var g = getGuestById(id); if (!g) return [];
    return D.campaigns.filter(function (c) {
      if (c.objective === 'rebooking') return g.tags.indexOf('dormant') >= 0;
      if (c.id === 'camp_early_family') return g.tags.indexOf('family') >= 0 && g.nextStayAt;
      if (c.id === 'camp_parking_72h') return g.interests && g.interests.indexOf('parking') >= 0;
      if (c.id === 'camp_late_checkout_sun') return g.interests && g.interests.indexOf('late_checkout') >= 0;
      return false;
    });
  }
  function getGuestTimeline(id) {
    // Unified, reverse-chronological event stream across sources.
    var ev = [];
    getGuestReservations(id).forEach(function (r) {
      ev.push({ at: r.checkInDate, type: 'reservation', icon: 'calendar', title: r.status === 'in_house' ? 'In-house at ' + r.propertyName : 'Reservation · ' + r.propertyName, detail: r.bookingReference + ' · ' + r.nights + ' nights · ' + r.adults + ' adults' + (r.children ? ', ' + r.children + ' children' : ''), meta: r.status });
    });
    getGuestConversations(id).forEach(function (c) {
      ev.push({ at: c.timestamp.slice(0, 10), type: 'conversation', icon: 'inbox', title: 'Inbox · ' + c.channel, detail: c.summary, meta: c.detectedIntent, sentiment: c.sentiment });
    });
    getGuestPurchases(id).forEach(function (p) {
      ev.push({ at: p.purchasedAt, type: 'purchase', icon: 'tag', title: 'Bought ' + p.dealTitle, detail: '€' + p.amount + ' · ' + p.channel, meta: 'app_sales' });
    });
    getGuestCheckins(id).forEach(function (c) {
      if (c.status === 'completed' || c.status === 'abandoned' || c.status === 'started') ev.push({ at: (c.completedAt || c.abandonedAt || c.startedAt || '').slice(0, 10), type: 'checkin', icon: 'check', title: 'Online check-in · ' + c.status.replace('_', ' '), detail: c.collectedFields.length ? 'Collected: ' + c.collectedFields.join(', ') : 'No fields collected', meta: c.status });
    });
    return ev.filter(function (e) { return e.at; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }

  // ---------- Deals ----------
  function getDeals(filter) {
    var rows = D.deals.slice();
    if (filter) {
      if (filter.category) rows = rows.filter(function (d) { return d.category === filter.category; });
      if (filter.providerType) rows = rows.filter(function (d) { return d.providerType === filter.providerType; });
      if (filter.active != null) rows = rows.filter(function (d) { return d.active === filter.active; });
      if (filter.propertyId) rows = rows.filter(function (d) { return d.propertyIds.indexOf(filter.propertyId) >= 0; });
    }
    return rows;
  }
  function getDealById(id) { return find(D.deals, id); }

  // ---------- Segments ----------
  function getSegments() { return D.segments.slice(); }
  function getSegmentById(id) { return find(D.segments, id); }
  function createSegmentFromPrompt(prompt) { return window.CRMAgent.generateSegmentFromPrompt(prompt); }
  function getAudienceGuests(rules) {
    // Canonical audience matcher — the single source of truth reused by
    // the segment preview AND the consent check so sizes stay consistent.
    return D.guests.filter(function (g) { return rulesMatchGuest(rules, g); });
  }
  function previewSegmentAudience(rules) {
    var matched = getAudienceGuests(rules);
    var excluded = matched.filter(function (g) { return g.consentSummary.globalUnsubscribe || g.consentSummary.emailMarketing !== 'granted'; });
    return {
      estimatedSize: matched.length,
      eligibleSize: matched.length - excluded.length,
      excludedSize: excluded.length,
      sample: matched.slice(0, 8).map(function (g) { return { id: g.id, name: g.fullName, flag: g.flag, stage: g.lifecycleStage, nextStayAt: g.nextStayAt }; }),
      exclusions: excluded.length ? [{ reason: 'No email marketing consent / unsubscribed', count: excluded.length }] : []
    };
  }
  function rulesMatchGuest(rules, g) {
    return rules.every(function (r) {
      switch (r.field) {
        case 'children': return matchNum(g, 'children', r);
        case 'tags': return r.operator === 'contains' ? g.tags.indexOf(r.value) >= 0 : g.tags.indexOf(r.value) < 0;
        case 'lifecycleStage': return g.lifecycleStage === r.value;
        case 'nextStayAt': return r.operator === 'is_false' ? !g.nextStayAt : !!g.nextStayAt;
        case 'checkInDate': return !!g.nextStayAt && withinDays(g.nextStayAt, r.value);
        case 'detectedIntent': return g.interests && g.interests.indexOf('parking') >= 0; // demo proxy
        case 'checkinStatus': return g.tags.indexOf('abandoned_checkin') >= 0;
        case 'lastStaySeason': return g.tags.indexOf('summer') >= 0;
        case 'language': return g.language === r.value;
        case 'country': return g.country === r.value;
        case 'opportunityScore': {
          var sr = computeOpportunityScore(g.id);
          if (r.operator === 'greater_than') return sr.score > r.value;
          if (r.operator === 'less_than') return sr.score < r.value;
          if (r.operator === 'between') return sr.score >= r.value[0] && sr.score <= r.value[1];
          return sr.score === r.value;
        }
        case 'segmentTags':
          if (!g.segmentTags) return r.operator === 'not_contains';
          return r.operator === 'contains' ? g.segmentTags.indexOf(r.value) >= 0 : g.segmentTags.indexOf(r.value) < 0;
        default: return true;
      }
    });
  }
  function matchNum(g, key, r) {
    var res = (window.CRMService.getGuestReservations(g.id)[0]) || {};
    var v = res[key] || 0;
    if (r.operator === 'greater_than') return v > r.value;
    if (r.operator === 'less_than') return v < r.value;
    return v === r.value;
  }
  function withinDays(dateStr, range) {
    var t = new Date(D.today), d = new Date(dateStr);
    var diff = (d - t) / 864e5;
    var max = 3;
    if (Array.isArray(range) && /\+(\d+)d/.test(range[1])) max = +RegExp.$1;
    return diff >= -0.5 && diff <= max + 0.5;
  }

  // ---------- Campaigns ----------
  function getCampaigns(filter) {
    var rows = D.campaigns.slice();
    if (filter && filter.status) rows = rows.filter(function (c) { return c.status === filter.status; });
    return rows;
  }
  function getCampaignById(id) { return find(D.campaigns, id); }
  function generateCampaignPlan(prompt) { return window.CRMAgent.generateCampaignPlan(prompt); }
  function createCampaignDraft(plan) {
    var id = 'camp_' + Math.abs(hash(plan.name + D.campaigns.length)).toString(36);
    var camp = {
      id: id, organizationId: D.organizationId, name: plan.name, objective: plan.objective, status: 'draft',
      segmentId: null, audienceRules: plan.audience.rules, channel: plan.channel,
      trigger: plan.automation, schedule: { mode: 'trigger' }, deals: plan.deals.map(function (d) { return { dealId: d.dealId, title: d.title, reason: d.reason }; }),
      content: plan.content, variants: plan.variants || [], consentCheck: plan.consentCheck || null,
      revenueEstimate: plan.revenueEstimate, analytics: null, createdBy: 'Vela (AI draft)',
      createdAt: D.today, updatedAt: D.today, approvedBy: null, approvedAt: null
    };
    D.campaigns.push(camp);
    return camp;
  }
  function recommendDealsForAudience(rules) { return window.CRMAgent.recommendDeals(rules); }
  function runCampaignConsentCheck(campaignId) {
    var c = getCampaignById(campaignId); if (!c) return null;
    return window.CRMAgent.runConsentCheck(c);
  }
  function approveCampaign(campaignId, reviewer) {
    var c = getCampaignById(campaignId); if (!c) return null;
    if (c.consentCheck && c.consentCheck.status === 'failed') throw new Error('Cannot approve: consent check failed.');
    c.status = 'approved'; c.approvedBy = reviewer || 'Current user'; c.approvedAt = D.today; c.updatedAt = D.today;
    D.approvals.push({ id: 'appr_' + (D.approvals.length + 1), objectType: 'campaign', objectId: campaignId, status: 'approved', requestedBy: c.createdBy, reviewedBy: c.approvedBy, reviewedAt: D.today, comment: 'Approved.' });
    return c;
  }
  function scheduleCampaign(campaignId) {
    var c = getCampaignById(campaignId); if (!c) return null;
    if (c.status !== 'approved') throw new Error('Campaign must be approved before scheduling.');
    c.status = (c.schedule && c.schedule.mode === 'one_shot') ? 'scheduled' : 'active'; c.updatedAt = D.today;
    return c;
  }
  function summarizeCampaignPerformance(campaignId) {
    var c = getCampaignById(campaignId); if (!c) return null;
    return window.CRMAgent.summarizeCampaignPerformance(c);
  }
  function getApprovalsFor(objectId) { return D.approvals.filter(function (a) { return a.objectId === objectId; }); }

  // ---------- Automation ----------
  function getAutomationTriggers() { return D.triggers.slice(); }
  function getAutomations() { return D.automations.slice(); }
  function setAutomationStatus(id, status) { var a = find(D.automations, id); if (a) a.status = status; return a; }
  function simulateAutomationRun(triggerType, campaign) {
    // Simulated dry-run — NEVER sends real messages.
    var audience = campaign && campaign.consentCheck ? campaign.consentCheck.eligibleSize : 5;
    return {
      simulated: true, triggerType: triggerType, evaluatedAt: D.today,
      wouldSend: audience, blockedByConsent: campaign && campaign.consentCheck ? campaign.consentCheck.excludedSize : 0,
      sampleRecipients: getGuests({ upcoming: true }).slice(0, 3).map(function (g) { return g.fullName; }),
      channel: campaign ? campaign.channel : 'email',
      note: 'Dry run only. No messages were sent. Connect a channel to go live.'
    };
  }

  // ---------- Dashboard metrics ----------
  function getDashboardMetrics() {
    var gs = D.guests;
    var inHouse = gs.filter(function (g) { return g.lifecycleStage === 'in_house'; }).length;
    var upcoming = gs.filter(function (g) { return !!g.nextStayAt; }).length;
    var consented = gs.filter(function (g) { return g.consentSummary.emailMarketing === 'granted' && !g.consentSummary.globalUnsubscribe; }).length;
    var campaignRevenue = D.campaigns.reduce(function (s, c) { return s + (c.analytics ? c.analytics.revenue : 0); }, 0);
    var appSalesRevenue = gs.reduce(function (s, g) { return s + g.appSalesRevenue; }, 0);
    return {
      totalGuests: gs.length, upcoming: upcoming, inHouse: inHouse, marketingConsent: consented,
      campaignRevenue: campaignRevenue, appSalesRevenue: appSalesRevenue,
      activeCampaigns: D.campaigns.filter(function (c) { return c.status === 'active'; }).length,
      draftCampaigns: D.campaigns.filter(function (c) { return c.status === 'draft' || c.status === 'needs_review'; }).length,
      currency: D.currency
    };
  }
  function getSuggestions() { return D.suggestions.slice(); }
  function getTopDeals() {
    return D.deals.filter(function (d) { return d.active; }).slice().sort(function (a, b) { return (b.conversionRate * b.averageRevenue) - (a.conversionRate * a.averageRevenue); }).slice(0, 4);
  }
  function getAgentRuns() { return D.agentRuns.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }); }

  function hash(s) { s = String(s); var h = 0; for (var i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }

  // ---------- Opportunity Score (rule-based, always explainable) ----------
  var NEG_TAGS = ['do_not_contact', 'unwanted_guest', 'do_not_promote'];
  function computeOpportunityScore(guestId) {
    var g = getGuestById(guestId);
    if (!g) return { score: 0, reasons: [], tier: 'low', excluded: false };
    // Negative tags → excluded immediately
    var segtags = g.segmentTags || [];
    for (var ni = 0; ni < NEG_TAGS.length; ni++) {
      if (segtags.indexOf(NEG_TAGS[ni]) >= 0) {
        var label = NEG_TAGS[ni].replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        return { score: 0, reasons: ['Tagged as ' + label + ' — excluded from campaigns'], tier: 'excluded', excluded: true };
      }
    }
    var score = 0, reasons = [];
    var checkins = getGuestCheckins(guestId);
    // +25 upcoming reservation
    if (g.nextStayAt) { score += 25; reasons.push('Upcoming reservation'); }
    // +15 repeat guest
    if (g.lifecycleStage === 'repeat' || g.lifecycleStage === 'vip' || g.tags.indexOf('repeat') >= 0) { score += 15; reasons.push('Repeat guest'); }
    // +15 previous app sales
    if (g.appSalesRevenue > 0) { score += 15; reasons.push('Purchased App Sales before'); }
    // +10 high lifetime revenue
    if (g.totalRevenue >= 2000) { score += 10; reasons.push('High booking value'); }
    // +10 email marketing consent
    if (g.consentSummary.emailMarketing === 'granted' && !g.consentSummary.globalUnsubscribe) { score += 10; reasons.push('Email marketing consent'); }
    // +10 complete profile
    if (g.profileCompleteness >= 75) { score += 10; reasons.push('Complete guest profile'); }
    // +5 whatsapp consent
    if (g.consentSummary.whatsappMarketing === 'granted' && !g.consentSummary.globalUnsubscribe) { score += 5; reasons.push('WhatsApp consent'); }
    // +5 completed instant check-in
    var completedCk = checkins.filter(function (c) { return c.status === 'completed'; }).length > 0;
    if (completedCk) { score += 5; reasons.push('Completed instant check-in'); }
    // +5 currently in-house
    if (g.lifecycleStage === 'in_house') { score += 5; reasons.push('Currently in-house'); }
    // penalty: global unsubscribe
    if (g.consentSummary.globalUnsubscribe) score = Math.max(0, score - 20);
    score = Math.min(100, Math.max(0, score));
    var tier = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
    return { score: score, reasons: reasons.slice(0, 5), tier: tier, excluded: false };
  }

  // ---------- Segment Tag Management ----------
  var ALL_SEG_TAGS = ['whale', 'vip', 'preferred', 'repeat_guest', 'family', 'business', 'couple', 'high_app_sales_potential', 'needs_review', 'do_not_contact', 'do_not_promote', 'unwanted_guest'];
  function addGuestSegmentTag(guestId, tag, note) {
    var g = getGuestById(guestId); if (!g) return null;
    if (!g.segmentTags) g.segmentTags = [];
    if (!g.segmentTagNotes) g.segmentTagNotes = {};
    if (g.segmentTags.indexOf(tag) < 0) g.segmentTags.push(tag);
    if (note) g.segmentTagNotes[tag] = note;
    return g;
  }
  function removeGuestSegmentTag(guestId, tag) {
    var g = getGuestById(guestId); if (!g) return null;
    g.segmentTags = (g.segmentTags || []).filter(function (t) { return t !== tag; });
    if (g.segmentTagNotes) delete g.segmentTagNotes[tag];
    return g;
  }
  function getAllSegmentTags() { return ALL_SEG_TAGS.slice(); }

  // ---------- Segmentation Metrics (dashboard widgets) ----------
  function getSegmentationMetrics() {
    var gs = D.guests;
    function hasTag(g, t) { return g.segmentTags && g.segmentTags.indexOf(t) >= 0; }
    function hasAnyTag(g, arr) { return arr.some(function (t) { return hasTag(g, t); }); }
    var whales = gs.filter(function (g) { return hasTag(g, 'whale'); });
    var vips = gs.filter(function (g) { return hasTag(g, 'vip'); });
    var repeats = gs.filter(function (g) { return hasTag(g, 'repeat_guest'); });
    var highAps = gs.filter(function (g) { return hasTag(g, 'high_app_sales_potential'); });
    var excluded = gs.filter(function (g) { return hasAnyTag(g, NEG_TAGS); });
    var today = new Date(D.today);
    function daysDiff(dateStr) { return (new Date(dateStr) - today) / 864e5; }
    // High opportunity: score >= 70 and not excluded
    var highOpp = gs.filter(function (g) { var r = computeOpportunityScore(g.id); return r.score >= 70 && !r.excluded; });
    var whalesNoRebook = whales.filter(function (g) { return !g.nextStayAt && !hasAnyTag(g, NEG_TAGS); });
    var repeatsNoRebook = repeats.filter(function (g) { return !g.nextStayAt && !hasAnyTag(g, NEG_TAGS); });
    var highOppArriving = highOpp.filter(function (g) { return g.nextStayAt && daysDiff(g.nextStayAt) >= 0 && daysDiff(g.nextStayAt) <= 3; });
    var insights = [];
    if (whalesNoRebook.length) insights.push({ text: whalesNoRebook.length + ' Whale guest' + (whalesNoRebook.length > 1 ? 's have' : ' has') + ' no future reservation.', kind: 'whale', action: 'Create win-back campaign', prompt: 'Create a win-back campaign for Whale guests with no future reservation' });
    if (highOppArriving.length) insights.push({ text: highOppArriving.length + ' High Opportunity guest' + (highOppArriving.length > 1 ? 's arrive' : ' arrives') + ' this weekend.', kind: 'opportunity', action: 'Send pre-arrival upsell', prompt: 'Create an upsell campaign for High Opportunity guests arriving this weekend' });
    if (repeatsNoRebook.length) insights.push({ text: repeatsNoRebook.length + ' Repeat guest' + (repeatsNoRebook.length > 1 ? 's' : '') + ' could receive a rebooking campaign.', kind: 'repeat', action: 'Create rebooking campaign', prompt: 'Create a rebooking campaign for repeat guests with no future booking' });
    if (excluded.length) insights.push({ text: excluded.length + ' guest' + (excluded.length > 1 ? 's are' : ' is') + ' tagged as excluded and will be suppressed from all campaigns.', kind: 'excluded', action: null, prompt: null });
    return { highOpportunity: highOpp.length, whales: whales.length, vips: vips.length, repeatGuests: repeats.length, highAppSalesPotential: highAps.length, excluded: excluded.length, insights: insights };
  }

  // ---------- Top rebooking candidates ----------
  function getTopRebookingCandidates(limit) {
    limit = limit || 5;
    return D.guests.filter(function (g) {
      return !g.nextStayAt && g.lastStayAt && (g.segmentTags || []).indexOf('repeat_guest') >= 0 && !NEG_TAGS.some(function (t) { return (g.segmentTags || []).indexOf(t) >= 0; });
    }).sort(function (a, b) {
      return computeOpportunityScore(b.id).score - computeOpportunityScore(a.id).score;
    }).slice(0, limit);
  }

  function isFirstRun() { return FIRST_RUN; }
  function setFirstRun(on) {
    try { localStorage.setItem('crm_first_run', on ? '1' : '0'); } catch (e) {}
    location.reload();
  }

  window.CRMService = {
    _dataset: D, // consumed by the agent layer so it sees the same (possibly first-run) data
    isFirstRun: isFirstRun, setFirstRun: setFirstRun,
    getGuests: getGuests, getGuestById: getGuestById, getGuestReservations: getGuestReservations,
    getGuestConsents: getGuestConsents, getGuestPreferences: getGuestPreferences, getGuestConversations: getGuestConversations,
    getGuestPurchases: getGuestPurchases, getGuestCheckins: getGuestCheckins, getGuestCampaigns: getGuestCampaigns, getGuestTimeline: getGuestTimeline,
    getDeals: getDeals, getDealById: getDealById,
    getSegments: getSegments, getSegmentById: getSegmentById, createSegmentFromPrompt: createSegmentFromPrompt, previewSegmentAudience: previewSegmentAudience, getAudienceGuests: getAudienceGuests,
    getCampaigns: getCampaigns, getCampaignById: getCampaignById, generateCampaignPlan: generateCampaignPlan, createCampaignDraft: createCampaignDraft,
    recommendDealsForAudience: recommendDealsForAudience, runCampaignConsentCheck: runCampaignConsentCheck,
    approveCampaign: approveCampaign, scheduleCampaign: scheduleCampaign, summarizeCampaignPerformance: summarizeCampaignPerformance, getApprovalsFor: getApprovalsFor,
    getAutomationTriggers: getAutomationTriggers, getAutomations: getAutomations, setAutomationStatus: setAutomationStatus, simulateAutomationRun: simulateAutomationRun,
    getDashboardMetrics: getDashboardMetrics, getSuggestions: getSuggestions, getTopDeals: getTopDeals, getAgentRuns: getAgentRuns,
    getProperties: function () { return D.properties.slice(); },
    computeOpportunityScore: computeOpportunityScore, getAllSegmentTags: getAllSegmentTags,
    addGuestSegmentTag: addGuestSegmentTag, removeGuestSegmentTag: removeGuestSegmentTag,
    getSegmentationMetrics: getSegmentationMetrics, getTopRebookingCandidates: getTopRebookingCandidates
  };
})();
