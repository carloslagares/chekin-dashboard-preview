/* ============================================================
   Guest CRM — Agent Orchestration (mocked, deterministic)
   Every function returns a STRUCTURED object (never plain text),
   plus a reasoningSummary so the UI can show an explainable "Why?".
   Responses are rule-based on the fixtures so the demo is stable.
   Swap the bodies for real LLM tool-calls later; signatures stay.
   No real messages are ever sent here.
   ============================================================ */
(function () {
  'use strict';
  var D = window.CRM_DATA;

  // ---------- intent parsing (keyword heuristics) ----------
  function parse(prompt) {
    var p = (prompt || '').toLowerCase();
    return {
      family: /(family|families|children|kids|child)/.test(p),
      couple: /(couple|romantic|honeymoon)/.test(p),
      business: /(business|work|corporate)/.test(p),
      weekend: /(weekend|saturday|sunday)/.test(p),
      arriving: /(arriv|coming|upcoming|check.?in)/.test(p),
      departing: /(depart|checkout|check.?out|leaving)/.test(p),
      parking: /(parking|car|garage|drive)/.test(p),
      spa: /(spa|wellness|massage)/.test(p),
      earlyCheckin: /(early check.?in|arrive early)/.test(p),
      lateCheckout: /(late check.?out|stay later)/.test(p),
      dining: /(restaurant|dining|food|breakfast|dinner)/.test(p),
      abandoned: /(abandon|not.*complet|unfinished|incomplete)/.test(p),
      pastSummer: /(last summer|past summer|previous|stayed before|returning)/.test(p),
      noConsent: /(without.*consent|no.*consent|exclude.*consent|opted.out)/.test(p),
      transfer: /(transfer|airport|pickup)/.test(p),
      days: parseWindowDays(p),
      // segmentation
      whale: /\bwhale(s)?\b/.test(p),
      vip: /\bvip\b/.test(p),
      preferred: /\bpreferred\b/.test(p),
      repeatGuest: /(repeat.guest|repeated.guest|returning.guest)/.test(p) || (/repeat/.test(p) && !/(restaurant|dining)/.test(p)),
      highAppSales: /(high.app.sales|app.sales.potential|app.sales.prospect)/.test(p),
      highOpportunity: /(high.opportunit|best.guest|top.guest|highest.opportunit|opportunit.score|score.above|score.over)/.test(p),
      excludeNeg: /(exclude.unwanted|exclude.do.not|suppress.unwanted|without.unwanted|no.unwanted)/.test(p),
      unwanted: /unwanted.guest/.test(p),
      doNotContact: /do.not.contact/.test(p),
      noFutureBooking: /(no.future|no.booking|not.rebook|haven.t.book|without.future)/.test(p),
      scoreThreshold: parseScoreThreshold(p)
    };
  }
  function parseScoreThreshold(p) {
    var m = p.match(/score\s+(above|over|greater.than|>)\s*(\d+)/);
    if (m) return +m[2];
    m = p.match(/(\d+)\s*\+?\s*score/);
    if (m) return +m[1];
    return null;
  }
  function parseWindowDays(p) {
    var m = p.match(/next (\d+)\s?(day|days|hour|hours|h)\b/);
    if (!m) return null;
    var n = +m[1], unit = m[2];
    if (unit.charAt(0) === 'h') return Math.max(1, Math.round(n / 24)); // hours → days
    return n;
  }

  // ---------- buildGuestSummary ----------
  function buildGuestSummary(guest) {
    var S = window.CRMService;
    var res = S.getGuestReservations(guest.id);
    var buys = S.getGuestPurchases(guest.id);
    var spent = buys.reduce(function (s, b) { return s + b.amount; }, 0);
    var topIntents = (guest.interests || []).slice(0, 3);
    return {
      type: 'guest_profile',
      headline: guest.aiSummary,
      facts: [
        { label: 'Lifecycle', value: guest.lifecycleStage },
        { label: 'Stays', value: res.length + ' on record' },
        { label: 'App Sales', value: '€' + guest.appSalesRevenue + ' (' + buys.length + ' purchases)' },
        { label: 'Lifetime revenue', value: '€' + guest.totalRevenue }
      ],
      signals: topIntents,
      nextBest: guest.recommendedActions,
      reasoningSummary: 'Synthesised from ' + res.length + ' reservations, ' + buys.length + ' purchases (€' + spent + '), consent state and detected interests (' + topIntents.join(', ') + ').'
    };
  }

  // ---------- generateSegmentFromPrompt ----------
  function generateSegmentFromPrompt(prompt) {
    var i = parse(prompt), rules = [], excl = [], nlBits = [];
    var maxDays = i.days ? +i.days : (i.weekend ? 3 : 7);
    if (i.arriving) { rules.push({ field: 'checkInDate', operator: 'between', value: ['today', 'today+' + maxDays + 'd'], label: 'Arrives in next ' + maxDays + ' days' }); nlBits.push('arriving in the next ' + maxDays + ' days'); }
    if (i.departing) { rules.push({ field: 'checkOutDate', operator: 'between', value: ['today', 'today+' + maxDays + 'd'], label: 'Departs in next ' + maxDays + ' days' }); nlBits.push('departing soon'); }
    if (i.family) { rules.push({ field: 'children', operator: 'greater_than', value: 0, label: 'Has children' }); nlBits.push('with children'); }
    if (i.couple) { rules.push({ field: 'tags', operator: 'contains', value: 'couple', label: 'Couple' }); nlBits.push('couples'); }
    if (i.business) { rules.push({ field: 'tags', operator: 'contains', value: 'business', label: 'Business traveller' }); nlBits.push('business travellers'); }
    if (i.abandoned) { rules.push({ field: 'checkinStatus', operator: 'equals', value: 'abandoned', label: 'Check-in abandoned' }); nlBits.push('who have not completed check-in'); }
    // Parking filters the audience ONLY when phrased as an inquiry ("asked about parking"),
    // not when parking is merely an offered deal. Avoids over-narrowing campaign audiences.
    var parkingAsk = /(ask|asking|asked|inquir|interest).{0,24}(parking|car\b|garage)/.test((prompt || '').toLowerCase()) || /parking intent/.test((prompt || '').toLowerCase());
    if (i.parking && parkingAsk) { rules.push({ field: 'detectedIntent', operator: 'equals', value: 'parking_inquiry', label: 'Asked about parking' }); nlBits.push('who asked about parking'); }
    if (i.pastSummer) { rules.push({ field: 'lastStaySeason', operator: 'equals', value: 'summer_2025', label: 'Stayed last summer' }); rules.push({ field: 'nextStayAt', operator: 'is_false', value: null, label: 'No future booking' }); nlBits.push('who stayed last summer with no future booking'); }
    // ---- segmentation tag / score rules ----
    if (i.whale) { rules.push({ field: 'segmentTags', operator: 'contains', value: 'whale', label: 'Tagged: Whale' }); nlBits.push('Whale guests'); }
    if (i.vip) { rules.push({ field: 'segmentTags', operator: 'contains', value: 'vip', label: 'Tagged: VIP' }); nlBits.push('VIP guests'); }
    if (i.preferred) { rules.push({ field: 'segmentTags', operator: 'contains', value: 'preferred', label: 'Tagged: Preferred' }); nlBits.push('Preferred guests'); }
    if (i.highAppSales) { rules.push({ field: 'segmentTags', operator: 'contains', value: 'high_app_sales_potential', label: 'Tagged: High App Sales Potential' }); nlBits.push('high app sales potential guests'); }
    if (i.highOpportunity && !i.scoreThreshold) { rules.push({ field: 'opportunityScore', operator: 'greater_than', value: 70, label: 'Opportunity Score > 70' }); nlBits.push('high opportunity guests'); }
    if (i.scoreThreshold) { rules.push({ field: 'opportunityScore', operator: 'greater_than', value: i.scoreThreshold, label: 'Score > ' + i.scoreThreshold }); nlBits.push('guests with score above ' + i.scoreThreshold); }
    if (i.repeatGuest && !i.family && !i.couple && !i.arriving) { rules.push({ field: 'segmentTags', operator: 'contains', value: 'repeat_guest', label: 'Tagged: Repeat Guest' }); nlBits.push('repeat guests'); }
    if (i.noFutureBooking) { rules.push({ field: 'nextStayAt', operator: 'is_false', value: null, label: 'No future booking' }); nlBits.push('with no future booking'); }
    if (i.excludeNeg || i.doNotContact || i.unwanted) {
      rules.push({ field: 'segmentTags', operator: 'not_contains', value: 'do_not_contact', label: 'Exclude Do Not Contact' });
      rules.push({ field: 'segmentTags', operator: 'not_contains', value: 'unwanted_guest', label: 'Exclude Unwanted Guests' });
      rules.push({ field: 'segmentTags', operator: 'not_contains', value: 'do_not_promote', label: 'Exclude Do Not Promote' });
      nlBits.push('excluding unwanted/suppressed guests');
    }
    if (!rules.length) rules.push({ field: 'lifecycleStage', operator: 'equals', value: 'guest', label: 'Active guests' });

    var preview = window.CRMService.previewSegmentAudience(rules);
    if (i.noConsent || true) excl.push('No email marketing consent', 'Global unsubscribe');

    return {
      type: 'segment_builder',
      name: titleCase(nlBits.join(', ')) || 'New segment',
      naturalLanguageQuery: prompt,
      rules: rules,
      estimatedSize: preview.estimatedSize,
      eligibleSize: preview.eligibleSize,
      excludedSize: preview.excludedSize,
      exclusions: excl,
      sample: preview.sample,
      examples: SEGMENT_EXAMPLES,
      reasoningSummary: 'Parsed the request into ' + rules.length + ' structured rule(s): ' + rules.map(function (r) { return r.label; }).join('; ') + '. Estimated ' + preview.estimatedSize + ' guests, ' + preview.eligibleSize + ' eligible after consent.'
    };
  }

  // ---------- recommendDeals ----------
  function recommendDeals(rulesOrAudience) {
    var i = inferIntentFromRules(rulesOrAudience);
    var scored = D.deals.filter(function (d) { return d.active; }).map(function (d) {
      var score = d.conversionRate * 0.5;
      var reasons = [];
      if (i.family && d.tags.indexOf('family') >= 0) { score += 0.5; reasons.push('matches family audience'); }
      if (i.couple && d.tags.indexOf('couple') >= 0) { score += 0.4; reasons.push('fits couples'); }
      if (i.business && d.tags.indexOf('business') >= 0) { score += 0.4; reasons.push('relevant to business trips'); }
      if (i.parking && d.id === 'deal_parking') { score += 0.8; reasons.push('directly answers the parking request'); }
      if (i.arriving && (d.id === 'deal_early_checkin' || d.tags.indexOf('arrival') >= 0)) { score += 0.3; reasons.push('relevant on arrival'); }
      if (i.departing && d.id === 'deal_late_checkout') { score += 0.5; reasons.push('relevant on departure'); }
      if (i.spa && d.tags.indexOf('wellness') >= 0) { score += 0.5; reasons.push('wellness interest'); }
      if (i.dining && d.tags.indexOf('dining') >= 0) { score += 0.3; reasons.push('dining interest'); }
      return {
        dealId: d.id, title: d.title, providerType: d.providerType, providerName: d.providerName,
        price: d.price, currency: d.currency, margin: d.margin, commission: d.commission,
        conversionRate: d.conversionRate, averageRevenue: d.averageRevenue,
        fit: Math.min(0.99, +score.toFixed(2)),
        reason: reasons.length ? cap(reasons[0]) + (reasons.length > 1 ? '; also ' + reasons.slice(1).join(', ') : '') + '.' : 'Broad-appeal offer with solid conversion.'
      };
    }).sort(function (a, b) { return b.fit - a.fit; });
    return { type: 'deal_matching', deals: scored.slice(0, 5), reasoningSummary: 'Ranked ' + scored.length + ' active deals by tag overlap with the audience and historical conversion rate.' };
  }

  // ---------- runConsentCheck ----------
  function runConsentCheck(campaign) {
    var rules = campaign.audienceRules || [];
    // Reuse the canonical audience matcher so consent sizes match the segment preview.
    // Only fall back to a demo audience when NO rules are defined yet — a real
    // rule set that matches zero guests must stay empty so the check can FAIL
    // and block activation (compliance guardrail), never silently pass.
    var matched = rules.length ? window.CRMService.getAudienceGuests(rules) : D.guests.slice(0, campaign.consentCheck ? campaign.consentCheck.audienceSize : 6);
    var ch = campaign.channel || 'email';
    var blocked = [];
    var unsub = matched.filter(function (g) { return g.consentSummary.globalUnsubscribe; });
    var noCh = matched.filter(function (g) {
      if (g.consentSummary.globalUnsubscribe) return false;
      if (ch === 'email') return g.consentSummary.emailMarketing !== 'granted';
      if (ch === 'whatsapp') return g.consentSummary.whatsappMarketing !== 'granted';
      if (ch === 'sms') return g.consentSummary.smsMarketing !== 'granted';
      return false;
    });
    if (unsub.length) blocked.push({ reason: 'Global unsubscribe', count: unsub.length });
    if (noCh.length) blocked.push({ reason: 'No ' + ch + ' marketing consent', count: noCh.length });
    var excluded = unsub.length + noCh.length;
    var eligible = matched.length - excluded;
    var status = eligible <= 0 ? 'failed' : (excluded > 0 ? 'warning' : 'passed');
    return {
      type: 'compliance_check', status: status, channel: ch,
      audienceSize: matched.length, eligibleSize: eligible, excludedSize: excluded,
      exclusions: blocked,
      notes: status === 'failed' ? ['No eligible recipients with consent — activation blocked.'] : (excluded ? ['Excluded ' + excluded + ' guest(s) automatically. Activation allowed for the eligible ' + eligible + '.'] : ['All recipients have valid ' + ch + ' marketing consent.']),
      canActivate: status !== 'failed',
      reasoningSummary: 'Checked ' + matched.length + ' guests against ' + ch + ' marketing consent and the global suppression list. ' + excluded + ' excluded, ' + eligible + ' eligible.'
    };
  }

  // ---------- generateCampaignPlan ----------
  function generateCampaignPlan(prompt) {
    var i = parse(prompt);
    var seg = generateSegmentFromPrompt(prompt);
    var rec = recommendDeals(seg.rules);
    var objective = i.abandoned ? 'check-in recovery' : i.pastSummer ? 'rebooking' : i.lateCheckout || i.earlyCheckout || i.departing ? 'upsell' : i.spa || i.dining ? 'cross-sell' : i.business ? 'retention' : 'upsell';
    // WhatsApp only when parking is the *primary* intent (a fast operational nudge);
    // otherwise email, the broadest-consented channel.
    var parkingPrimary = i.parking && !i.family && !i.couple && !i.pastSummer && !i.spa && !i.dining;
    var channel = parkingPrimary ? 'whatsapp' : 'email';
    var topDeals = rec.deals.slice(0, i.family ? 3 : 2);
    var automation = i.arriving ? { type: 'days_before_arrival', value: i.weekend ? 2 : 3 } : i.departing ? { type: 'before_checkout' } : i.abandoned ? { type: 'checkin_abandoned' } : i.pastSummer ? { type: 'segment_entered' } : { type: 'day_of_arrival' };
    var name = titleCase((i.earlyCheckin ? 'Early check-in' : i.lateCheckout ? 'Late checkout' : i.parking ? 'Parking' : i.spa ? 'Wellness' : topDeals[0] ? topDeals[0].title : 'Upsell') + ' for ' + (i.family ? 'upcoming family arrivals' : i.couple ? 'arriving couples' : i.pastSummer ? 'past summer guests' : i.abandoned ? 'abandoned check-ins' : i.departing ? 'upcoming departures' : 'upcoming arrivals'));

    var content = {
      subject: i.earlyCheckin ? 'Arrive earlier and start your stay with no rush'
        : i.parking ? 'Your parking spot is one tap away'
        : i.spa ? 'Unwind — a wellness moment for your stay'
        : i.pastSummer ? 'Your favourite escape is back this summer'
        : i.lateCheckout || i.departing ? 'No rush — keep your room a little longer'
        : 'A little extra for your upcoming stay',
      previewText: 'A personalised offer for {{firstName}} at {{propertyName}}.',
      body: 'Hi {{firstName}}, your stay at {{propertyName}} ' + (i.pastSummer ? 'was a great one — plan this year\'s trip with perks ready to go.' : 'is coming up on {{checkInDate}}. ' + (topDeals[0] ? 'We picked out ' + topDeals[0].title + ' for you.' : 'Here\'s something to make it smoother.')),
      ctaLabel: topDeals[0] ? 'Add ' + topDeals[0].title : 'See your offer',
      ctaUrl: 'https://app.chekin.com/deals',
      language: 'en', tone: 'warm', personalizationTokens: ['firstName', 'propertyName', 'checkInDate']
    };

    var variants = [
      { id: 'var_a', name: 'A — Warm', content: content, allocationPercentage: 50 },
      { id: 'var_b', name: 'B — Direct', content: Object.assign({}, content, { subject: (topDeals[0] ? topDeals[0].title : 'Your offer') + ' — book it in one tap', tone: 'direct' }), allocationPercentage: 50 }
    ];

    var consentCheck = runConsentCheck({ audienceRules: seg.rules, channel: channel });
    var convRate = topDeals[0] ? topDeals[0].conversionRate : 0.12;
    var expConv = Math.max(1, Math.round(consentCheck.eligibleSize * convRate));
    var price = topDeals[0] ? topDeals[0].price : 30;

    return {
      type: 'campaign_planner',
      name: name, objective: objective,
      audience: { naturalLanguage: seg.naturalLanguageQuery, rules: seg.rules, estimatedSize: seg.estimatedSize, eligibleSize: consentCheck.eligibleSize, excludedSize: consentCheck.excludedSize, exclusions: seg.exclusions },
      channel: channel,
      deals: topDeals.map(function (d) { return { dealId: d.dealId, title: d.title, reason: d.reason }; }),
      content: content, variants: variants,
      automation: automation,
      successMetric: objective === 'check-in recovery' ? 'completed_checkins' : 'app_sales_revenue',
      consentCheck: consentCheck,
      revenueEstimate: { expectedConversions: expConv, expectedRevenue: expConv * price, currency: D.currency },
      riskChecks: [
        { type: 'consent', status: consentCheck.status === 'failed' ? 'failed' : 'passed' },
        { type: 'frequency', status: 'passed' },
        { type: 'channel_ready', status: channel === 'email' ? 'passed' : 'warning' }
      ],
      requiresApproval: true,
      reasoningSummary: 'Built objective "' + objective + '" from the prompt, generated a ' + seg.rules.length + '-rule audience (' + seg.estimatedSize + ' guests), matched ' + topDeals.length + ' deal(s), ran a ' + channel + ' consent check (' + consentCheck.eligibleSize + ' eligible), drafted copy + an A/B variant, and estimated ' + expConv + ' conversions.'
    };
  }

  // ---------- summarizeCampaignPerformance ----------
  function summarizeCampaignPerformance(campaign) {
    var a = campaign.analytics;
    if (!a) return { type: 'analytics_summary', headline: 'No data yet — this campaign has not run.', metrics: [], reasoningSummary: 'Campaign has no analytics; it is in ' + campaign.status + ' state.' };
    var openRate = a.delivered ? (a.opened / a.delivered) : 0;
    var convRate = a.sent ? (a.converted / a.sent) : 0;
    var roiNote = a.revenue > 0 ? 'Generated €' + a.revenue + ' from ' + a.converted + ' conversions.' : 'No revenue recorded yet.';
    return {
      type: 'analytics_summary',
      headline: cap(campaign.objective) + ' campaign reached ' + a.delivered + ' guests with a ' + pct(convRate) + ' conversion rate. ' + roiNote,
      metrics: [
        { label: 'Open rate', value: pct(openRate) },
        { label: 'Click rate', value: pct(a.clickRate) },
        { label: 'Conversion rate', value: pct(convRate) },
        { label: 'Revenue', value: '€' + a.revenue }
      ],
      recommendations: [
        a.clickRate < 0.3 ? 'Test a more direct subject line (variant B) to lift clicks.' : 'Click rate is healthy — keep the current subject.',
        a.unsubscribed > 0 ? 'Watch frequency: ' + a.unsubscribed + ' unsubscribe(s) this send.' : 'No unsubscribes — frequency looks safe.'
      ],
      reasoningSummary: 'Computed open/click/conversion from raw counts and compared click rate to a 30% benchmark to suggest next steps.'
    };
  }

  // ---------- helpers ----------
  function inferIntentFromRules(rules) {
    var i = { family: false, couple: false, business: false, parking: false, arriving: false, departing: false, spa: false, dining: false };
    (rules || []).forEach(function (r) {
      if (r.field === 'children') i.family = true;
      if (r.field === 'tags' && r.value === 'couple') i.couple = true;
      if (r.field === 'tags' && r.value === 'business') i.business = true;
      if (r.field === 'detectedIntent') i.parking = true;
      if (r.field === 'checkInDate') i.arriving = true;
      if (r.field === 'checkOutDate') i.departing = true;
    });
    return i;
  }
  function roughMatch(rules, g) {
    try { return window.CRMService.previewSegmentAudience(rules) && require_(rules, g); } catch (e) { return true; }
  }
  function require_(rules, g) {
    // reuse the service matcher indirectly: replicate minimal logic
    return rules.every(function (r) {
      if (r.field === 'children') return (g.tags.indexOf('family') >= 0);
      if (r.field === 'tags') return r.operator === 'contains' ? g.tags.indexOf(r.value) >= 0 : true;
      if (r.field === 'detectedIntent') return g.interests && g.interests.indexOf('parking') >= 0;
      if (r.field === 'checkinStatus') return g.tags.indexOf('abandoned_checkin') >= 0;
      if (r.field === 'lastStaySeason') return g.tags.indexOf('summer') >= 0;
      if (r.field === 'nextStayAt') return !g.nextStayAt;
      if (r.field === 'checkInDate') return !!g.nextStayAt;
      if (r.field === 'lifecycleStage') return g.lifecycleStage === r.value;
      return true;
    });
  }
  function titleCase(s) { return (s || '').replace(/\b\w/g, function (c) { return c.toUpperCase(); }).replace(/^./, function (c) { return c.toUpperCase(); }); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function pct(x) { return Math.round(x * 100) + '%'; }

  var SEGMENT_EXAMPLES = [
    'Guests arriving in the next 7 days who have not completed check-in',
    'Families who stayed last summer and have no future booking',
    'Couples arriving this weekend who have not bought spa deals',
    'Guests who asked about parking and arrive in the next 72 hours',
    'Whale guests with no future reservation',
    'VIP guests arriving this month',
    'Guests with Opportunity Score above 70',
    'Repeat guests that have not booked again',
    'Guests tagged as High App Sales Potential',
    'Exclude Unwanted Guests and Do Not Contact'
  ];

  window.CRMAgent = {
    buildGuestSummary: buildGuestSummary,
    generateSegmentFromPrompt: generateSegmentFromPrompt,
    generateCampaignPlan: generateCampaignPlan,
    recommendDeals: recommendDeals,
    runConsentCheck: runConsentCheck,
    summarizeCampaignPerformance: summarizeCampaignPerformance,
    SEGMENT_EXAMPLES: SEGMENT_EXAMPLES
  };
})();
