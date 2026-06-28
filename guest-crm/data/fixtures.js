/* ============================================================
   Guest CRM — Typed Fixtures (mock seed data)
   Realistic hospitality data. Deterministic (no randomness) so the
   demo is stable. Exposes window.CRM_DATA. Replace with real API
   responses later — the service layer is the only consumer.
   "Today" anchor for relative dates: 2026-06-13.
   ============================================================ */
(function () {
  'use strict';

  var ORG = 'org_sonder_madrid';
  var CUR = 'EUR';

  // ---- date helpers (anchored, deterministic) ----
  var TODAY = new Date('2026-06-13T09:00:00Z');
  function iso(d) { return d.toISOString(); }
  function day(offset) { var d = new Date(TODAY); d.setDate(d.getDate() + offset); return iso(d); }
  function date(offset) { return day(offset).slice(0, 10); }

  // ---- properties ----
  var properties = [
    { id: 'prop_sol', name: 'Puerta del Sol', city: 'Madrid', country: 'ES' },
    { id: 'prop_gracia', name: 'Gràcia Loft 3B', city: 'Barcelona', country: 'ES' },
    { id: 'prop_trastevere', name: 'Trastevere Suites', city: 'Rome', country: 'IT' },
    { id: 'prop_montmartre', name: 'Montmartre 9e', city: 'Paris', country: 'FR' },
    { id: 'prop_george', name: "Saint George's Palace", city: 'London', country: 'GB' },
    { id: 'prop_kreuzberg', name: 'Kreuzberg Hof', city: 'Berlin', country: 'DE' }
  ];

  // ---- deals (own + third-party) ----
  var deals = [
    { id: 'deal_early_checkin', title: 'Early Check-In', description: 'Arrive from 11:00 instead of 15:00.', category: 'check_in', providerType: 'own', providerName: 'Chekin', price: 25, currency: CUR, margin: 0.9, commission: 0, active: true, availability: 'Subject to housekeeping', eligibilityRules: [], tags: ['convenience', 'arrival', 'family'], propertyIds: ['prop_sol', 'prop_gracia', 'prop_trastevere', 'prop_montmartre', 'prop_george'], imageUrl: '', conversionRate: 0.18, averageRevenue: 25 },
    { id: 'deal_late_checkout', title: 'Late Checkout (14:00)', description: 'Keep the room until 14:00 on departure day.', category: 'check_out', providerType: 'own', providerName: 'Chekin', price: 30, currency: CUR, margin: 0.9, commission: 0, active: true, availability: 'Subject to next booking', eligibilityRules: [], tags: ['convenience', 'departure', 'couple', 'business'], propertyIds: ['prop_sol', 'prop_gracia', 'prop_trastevere', 'prop_montmartre', 'prop_george', 'prop_kreuzberg'], imageUrl: '', conversionRate: 0.22, averageRevenue: 30 },
    { id: 'deal_parking', title: 'Private Parking (per night)', description: 'Reserved on-site parking space.', category: 'transport', providerType: 'own', providerName: 'Chekin', price: 18, currency: CUR, margin: 0.85, commission: 0, active: true, availability: 'Limited spaces', eligibilityRules: [], tags: ['transport', 'car', 'parking', 'family'], propertyIds: ['prop_sol', 'prop_kreuzberg', 'prop_george'], imageUrl: '', conversionRate: 0.14, averageRevenue: 54 },
    { id: 'deal_airport_transfer', title: 'Airport Transfer', description: 'Private door-to-door transfer.', category: 'transport', providerType: 'third_party', providerName: 'WelcomePickups', price: 45, currency: CUR, margin: 0, commission: 0.2, active: true, availability: 'Book 12h ahead', eligibilityRules: [], tags: ['transport', 'arrival', 'business'], propertyIds: ['prop_sol', 'prop_gracia', 'prop_trastevere', 'prop_montmartre', 'prop_george', 'prop_kreuzberg'], imageUrl: '', conversionRate: 0.11, averageRevenue: 45 },
    { id: 'deal_spa', title: 'Spa & Wellness Pass', description: 'Day access to partner spa.', category: 'wellness', providerType: 'third_party', providerName: 'AireAncient Baths', price: 60, currency: CUR, margin: 0, commission: 0.25, active: true, availability: 'Reservation required', eligibilityRules: [], tags: ['wellness', 'couple', 'leisure', 'premium'], propertyIds: ['prop_sol', 'prop_gracia'], imageUrl: '', conversionRate: 0.09, averageRevenue: 120 },
    { id: 'deal_family_restaurant', title: 'Family Restaurant Set Menu', description: 'Kid-friendly set menu at a partner restaurant.', category: 'dining', providerType: 'third_party', providerName: 'La Mucca', price: 48, currency: CUR, margin: 0, commission: 0.18, active: true, availability: 'Evenings', eligibilityRules: [], tags: ['dining', 'family', 'children', 'leisure'], propertyIds: ['prop_sol', 'prop_gracia', 'prop_trastevere'], imageUrl: '', conversionRate: 0.12, averageRevenue: 96 },
    { id: 'deal_crib', title: 'Baby Crib & Kit', description: 'Crib, high-chair and baby essentials.', category: 'family', providerType: 'own', providerName: 'Chekin', price: 15, currency: CUR, margin: 0.8, commission: 0, active: true, availability: 'On request', eligibilityRules: [], tags: ['family', 'children', 'infants'], propertyIds: ['prop_sol', 'prop_gracia', 'prop_trastevere', 'prop_montmartre'], imageUrl: '', conversionRate: 0.27, averageRevenue: 15 },
    { id: 'deal_bike', title: 'City Bike Rental', description: 'E-bike for the duration of the stay.', category: 'transport', providerType: 'third_party', providerName: 'Donkey Republic', price: 22, currency: CUR, margin: 0, commission: 0.15, active: true, availability: 'Weather permitting', eligibilityRules: [], tags: ['transport', 'leisure', 'couple'], propertyIds: ['prop_gracia', 'prop_kreuzberg', 'prop_montmartre'], imageUrl: '', conversionRate: 0.08, averageRevenue: 22 },
    { id: 'deal_breakfast', title: 'Breakfast Delivery', description: 'Fresh breakfast box delivered each morning.', category: 'dining', providerType: 'own', providerName: 'Chekin', price: 12, currency: CUR, margin: 0.6, commission: 0, active: true, availability: 'Order by 22:00', eligibilityRules: [], tags: ['dining', 'leisure', 'business', 'couple'], propertyIds: ['prop_sol', 'prop_gracia', 'prop_trastevere', 'prop_montmartre', 'prop_george', 'prop_kreuzberg'], imageUrl: '', conversionRate: 0.16, averageRevenue: 36 },
    { id: 'deal_lounge', title: 'Co-working Day Pass', description: 'Desk + meeting room at a nearby hub.', category: 'business', providerType: 'third_party', providerName: 'Talent Garden', price: 28, currency: CUR, margin: 0, commission: 0.2, active: false, availability: 'Weekdays', eligibilityRules: [], tags: ['business', 'work'], propertyIds: ['prop_sol', 'prop_kreuzberg'], imageUrl: '', conversionRate: 0.07, averageRevenue: 28 }
  ];

  // ---- guest blueprints ----
  // scenario codes drive consent / lifecycle / tags / interests so pages can demo every case.
  var FLAGS = { ES: '🇪🇸', IT: '🇮🇹', FR: '🇫🇷', DE: '🇩🇪', GB: '🇬🇧', US: '🇺🇸', NL: '🇳🇱' };
  function consent(em, wa, sms, unsub) {
    return { emailMarketing: em, whatsappMarketing: wa, smsMarketing: sms, globalUnsubscribe: !!unsub };
  }

  // Each entry: [first,last,lang,country,city,stage, em,wa,sms,unsub, tags[], totalRev, appRev, lastStayOffset, nextStayOffset, interests[], summary]
  var G = [
    ['Lucía', 'Fernández', 'es', 'ES', 'Madrid', 'repeat', 'granted', 'granted', 'denied', false, ['family', 'repeat', 'spain'], 1840, 210, -120, 2, ['parking', 'family_restaurant', 'early_checkin'], 'Repeat family guest from Madrid, 4 past stays. Travels with two children, consistently books parking and asks about kid-friendly dining. High marketing engagement.'],
    ['Marco', 'Rossi', 'it', 'IT', 'Rome', 'vip', 'granted', 'granted', 'granted', false, ['vip', 'high_value', 'business'], 6120, 540, -45, 5, ['late_checkout', 'airport_transfer', 'breakfast'], 'High-value business traveller, 9 stays this year across Rome and Madrid. Always extends checkout and books transfers. Top 2% by lifetime revenue.'],
    ['Camille', 'Dubois', 'fr', 'FR', 'Paris', 'guest', 'granted', 'unknown', 'unknown', false, ['couple', 'leisure'], 980, 90, -200, 3, ['spa', 'breakfast', 'late_checkout'], 'Couple from Paris on a weekend leisure trip. Bought a spa pass last visit. Open to wellness and dining upsells.'],
    ['Hannah', 'Schmidt', 'de', 'DE', 'Berlin', 'guest', 'denied', 'granted', 'unknown', false, ['business', 'no_email_consent', 'whatsapp_ok'], 1320, 60, -30, 1, ['airport_transfer', 'coworking'], 'Business traveller from Berlin. Declined email marketing but accepts WhatsApp. Reach only via WhatsApp/transactional channels.'],
    ['James', 'Whitmore', 'en', 'GB', 'London', 'in_house', 'granted', 'unknown', 'granted', false, ['couple', 'in_house'], 1450, 175, -1, null, ['late_checkout', 'breakfast'], 'Currently in-house at Madrid for a city break with partner. Engaged with the breakfast upsell. Good candidate for a late-checkout offer.'],
    ['Sophie', 'Laurent', 'fr', 'FR', 'Lyon', 'past', 'granted', 'unknown', 'unknown', false, ['family', 'summer', 'dormant'], 760, 48, -310, null, ['family_restaurant', 'crib'], 'Stayed last summer with a baby; booked a crib. No future booking — strong win-back target for the next family season.'],
    ['Liam', "O'Connor", 'en', 'GB', 'Dublin', 'past', 'granted', 'granted', 'granted', false, ['family', 'summer', 'dormant'], 1100, 95, -300, null, ['parking', 'family_restaurant'], 'Family of four, stayed last summer. Asked about parking on arrival. No rebooking yet — reactivation candidate.'],
    ['Elena', 'Popescu', 'en', 'RO', 'Bucharest', 'prospect', 'unknown', 'unknown', 'unknown', false, ['lead', 'abandoned_checkin'], 0, 0, null, 1, [], 'Reservation created but online check-in abandoned at the ID step. Operational nudge needed before arrival tomorrow.'],
    ['Thomas', 'Müller', 'de', 'DE', 'Munich', 'guest', 'granted', 'granted', 'granted', false, ['business', 'repeat'], 2300, 180, -60, 4, ['coworking', 'late_checkout', 'airport_transfer'], 'Frequent business traveller, books co-working and late checkout. Reliable upsell taker on weekday trips.'],
    ['Isabella', 'Conti', 'it', 'IT', 'Milan', 'couple', 'granted', 'unknown', 'unknown', false, ['couple', 'leisure', 'weekend'], 540, 0, null, 2, ['spa', 'bike', 'breakfast'], 'Couple arriving this weekend in Barcelona, first stay. No deals purchased yet — fresh cross-sell opportunity for spa or breakfast.'],
    ['Noah', 'Andersen', 'en', 'DK', 'Copenhagen', 'guest', 'granted', 'unknown', 'unknown', false, ['leisure', 'bike'], 410, 22, -90, 6, ['bike', 'breakfast'], 'Leisure guest who enjoys cycling cities. Rented a bike previously. Good fit for active-leisure bundles.'],
    ['Maria', 'García', 'es', 'ES', 'Sevilla', 'vip', 'granted', 'granted', 'denied', false, ['vip', 'high_value', 'family'], 4800, 420, -25, 9, ['family_restaurant', 'parking', 'early_checkin', 'crib'], 'High-value repeat family guest. Books early check-in and parking every stay. Travels with toddler. Premium family-experience target.'],
    ['Oliver', 'Bennett', 'en', 'GB', 'Manchester', 'past', 'denied', 'denied', 'denied', true, ['unsubscribed', 'do_not_contact'], 320, 0, -150, null, [], 'Globally unsubscribed from marketing. Suppress from all campaigns; transactional only. Keep for compliance reference.'],
    ['Chloé', 'Moreau', 'fr', 'FR', 'Nice', 'guest', 'granted', 'granted', 'unknown', false, ['couple', 'spa', 'leisure'], 1230, 180, -70, 3, ['spa', 'late_checkout', 'breakfast'], 'Wellness-oriented couple. Already a spa buyer. Likely to convert on premium wellness + late checkout combos.'],
    ['Daniel', 'Nowak', 'en', 'PL', 'Warsaw', 'prospect', 'granted', 'unknown', 'unknown', false, ['lead', 'abandoned_checkin', 'parking_intent'], 0, 0, null, 3, ['parking'], 'Asked about parking in the inbox, then started but did not finish online check-in. Arrives in 3 days. Parking upsell + check-in recovery.'],
    ['Anna', 'Kowalczyk', 'en', 'PL', 'Kraków', 'guest', 'granted', 'unknown', 'unknown', false, ['family', 'children'], 880, 30, -40, 2, ['crib', 'family_restaurant', 'early_checkin'], 'Family arriving this weekend with two young children. Strong fit for early check-in, crib and family dining.'],
    ['Pierre', 'Lefèvre', 'fr', 'FR', 'Paris', 'business', 'granted', 'granted', 'granted', false, ['business', 'repeat', 'high_value'], 3100, 240, -20, 7, ['airport_transfer', 'late_checkout', 'coworking'], 'Repeat business traveller, Paris-Madrid corridor. Consistent transfer + late checkout buyer.'],
    ['Emma', 'Johansson', 'en', 'SE', 'Stockholm', 'couple', 'granted', 'unknown', 'unknown', false, ['couple', 'weekend', 'leisure'], 600, 36, -110, 2, ['breakfast', 'bike', 'spa'], 'Scandinavian couple, weekend city breaks. Light spender so far — nudge with breakfast and bike bundles.'],
    ['Carlos', 'Ramírez', 'es', 'ES', 'Valencia', 'repeat', 'granted', 'granted', 'denied', false, ['repeat', 'family', 'spain'], 2050, 165, -55, 4, ['parking', 'family_restaurant', 'early_checkin'], 'Repeat Spanish family guest. Drives to the property — reliable parking buyer. Books family dining when offered.'],
    ['Sofia', 'Nguyen', 'en', 'US', 'San Francisco', 'guest', 'granted', 'unknown', 'unknown', false, ['leisure', 'long_haul', 'high_value'], 2700, 210, -80, 5, ['airport_transfer', 'spa', 'breakfast'], 'Long-haul leisure guest from the US. Values convenience — books transfers and breakfast. Premium experience taker.'],
    ['Lukas', 'Bauer', 'de', 'DE', 'Hamburg', 'guest', 'denied', 'granted', 'unknown', false, ['business', 'no_email_consent', 'whatsapp_ok'], 990, 50, -35, 8, ['coworking', 'late_checkout'], 'WhatsApp-reachable business traveller without email consent. Co-working and late checkout interest.'],
    ['Giulia', 'Esposito', 'it', 'IT', 'Naples', 'past', 'granted', 'unknown', 'unknown', false, ['family', 'summer', 'dormant'], 1340, 110, -290, null, ['family_restaurant', 'crib', 'early_checkin'], 'Family who stayed last summer in Rome. Booked crib and family dining. No future booking — seasonal win-back target.'],
    ['Henry', 'Clarke', 'en', 'GB', 'Leeds', 'guest', 'granted', 'granted', 'granted', false, ['couple', 'leisure'], 720, 60, -100, 2, ['late_checkout', 'breakfast', 'spa'], 'Couple weekend traveller, fully opted-in across channels. Responsive to late checkout and breakfast.'],
    ['Júlia', 'Costa', 'es', 'PT', 'Lisbon', 'in_house', 'granted', 'unknown', 'unknown', false, ['couple', 'in_house', 'leisure'], 540, 30, -1, null, ['breakfast', 'late_checkout'], 'Currently in-house in Barcelona. Light spender — good moment for an in-stay late-checkout or breakfast nudge.'],
    ['Mateo', 'Sánchez', 'es', 'ES', 'Bilbao', 'prospect', 'granted', 'unknown', 'unknown', false, ['lead', 'parking_intent'], 0, 0, null, 4, ['parking'], 'New booking, asked about parking availability in the inbox. Arrives in 4 days. Parking upsell candidate.'],
    ['Freya', 'Wilson', 'en', 'GB', 'Bristol', 'past', 'granted', 'unknown', 'unknown', false, ['couple', 'dormant'], 980, 84, -240, null, ['spa', 'breakfast'], 'Past couple guest, lapsed ~8 months. Spa buyer historically — re-engagement candidate with a wellness offer.'],
    ['Niklas', 'Berg', 'en', 'NO', 'Oslo', 'guest', 'granted', 'unknown', 'unknown', false, ['leisure', 'family'], 1120, 70, -65, 3, ['family_restaurant', 'bike', 'crib'], 'Active family from Norway. Cycling and family dining fit. Moderate spender with upside.'],
    ['Valentina', 'Romero', 'es', 'ES', 'Málaga', 'vip', 'granted', 'granted', 'denied', false, ['vip', 'high_value', 'couple'], 5200, 480, -15, 6, ['spa', 'late_checkout', 'airport_transfer', 'breakfast'], 'Top-tier couple guest, frequent premium upsell taker (spa, transfers, late checkout). Among the highest app-sales contributors.'],
    ['Ben', 'Taylor', 'en', 'GB', 'London', 'guest', 'granted', 'unknown', 'granted', false, ['business', 'repeat'], 1680, 120, -28, 1, ['late_checkout', 'airport_transfer'], 'Repeat London business traveller arriving tomorrow. Strong late-checkout and transfer history.']
  ];

  var langName = { es: 'Spanish', it: 'Italian', fr: 'French', de: 'German', en: 'English' };
  var tz = { ES: 'Europe/Madrid', IT: 'Europe/Rome', FR: 'Europe/Paris', DE: 'Europe/Berlin', GB: 'Europe/London', RO: 'Europe/Bucharest', DK: 'Europe/Copenhagen', PL: 'Europe/Warsaw', SE: 'Europe/Stockholm', US: 'America/Los_Angeles', PT: 'Europe/Lisbon', NO: 'Europe/Oslo' };

  var guests = G.map(function (r, i) {
    var n = i + 1;
    var stage = r[5];
    var profileCompleteness = stage === 'prospect' ? 35 + (i % 3) * 8 : 70 + (i % 4) * 7;
    if (profileCompleteness > 100) profileCompleteness = 100;
    return {
      id: 'guest_' + String(n).padStart(3, '0'),
      organizationId: ORG,
      firstName: r[0], lastName: r[1], fullName: r[0] + ' ' + r[1],
      email: (r[0] + '.' + r[1]).toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@email.com',
      phone: '+' + (30 + (i % 9)) + ' 6' + String(10000000 + i * 13337).slice(0, 8),
      language: r[2], languageName: langName[r[2]] || r[2],
      country: r[3], flag: FLAGS[r[3]] || '🏳️', city: r[4], timezone: tz[r[3]] || 'Europe/Madrid',
      sourceChannel: ['email', 'whatsapp', 'inbox', 'sms'][i % 4],
      createdAt: day(-360 + i * 4), updatedAt: day(-(i % 30)),
      tags: r[10],
      lifecycleStage: stage,
      profileCompleteness: profileCompleteness,
      consentSummary: consent(r[6], r[7], r[8], r[9]),
      totalRevenue: r[11], appSalesRevenue: r[12],
      lastStayAt: r[13] == null ? null : date(r[13]),
      nextStayAt: r[14] == null ? null : date(r[14]),
      interests: r[15],
      aiSummary: r[16],
      recommendedActions: [] // filled below once deals/reservations exist
    };
  });

  function byId(id) { for (var i = 0; i < guests.length; i++) if (guests[i].id === id) return guests[i]; return null; }

  // ---- reservations ----
  var reservations = [];
  var resSeq = 1000;
  function addRes(guestId, propId, inOff, nights, status, adults, children, infants, purpose, channel, value, room) {
    var p = properties.filter(function (x) { return x.id === propId; })[0];
    reservations.push({
      id: 'res_' + (++resSeq), guestId: guestId, propertyId: propId, propertyName: p.name,
      bookingReference: 'CHK-' + (10000 + resSeq), checkInDate: date(inOff), checkOutDate: date(inOff + nights),
      status: status, channel: channel, adults: adults, children: children, infants: infants, nights: nights,
      totalValue: value, currency: CUR, roomType: room, purpose: purpose
    });
  }
  guests.forEach(function (g, i) {
    var prop = properties[i % properties.length].id;
    var fam = g.tags.indexOf('family') >= 0;
    var couple = g.tags.indexOf('couple') >= 0;
    var adults = couple ? 2 : (fam ? 2 : 1);
    var children = fam ? (1 + (i % 2)) : 0;
    var purpose = fam ? 'family' : couple ? 'couple' : (g.tags.indexOf('business') >= 0 ? 'business' : 'leisure');
    // past stay
    if (g.lastStayAt) addRes(g.id, prop, (new Date(g.lastStayAt) - TODAY) / 864e5 | 0, 2 + (i % 4), 'completed', adults, children, 0, purpose, ['direct', 'booking_com', 'airbnb'][i % 3], 320 + (i % 6) * 90, ['Studio', 'One-bed', 'Two-bed'][i % 3]);
    // current / next stay
    if (g.lifecycleStage === 'in_house') addRes(g.id, prop, -1, 3, 'in_house', adults, children, 0, purpose, 'direct', 410 + (i % 4) * 70, 'One-bed');
    else if (g.nextStayAt) addRes(g.id, prop, Math.round((new Date(g.nextStayAt) - TODAY) / 864e5), 2 + (i % 3), 'confirmed', adults, children, (fam && i % 3 === 0) ? 1 : 0, purpose, ['direct', 'booking_com', 'airbnb', 'expedia'][i % 4], 380 + (i % 5) * 80, ['Studio', 'One-bed', 'Two-bed'][i % 3]);
  });

  // ---- consents (detailed records) ----
  var consents = [];
  var cSeq = 0;
  function pushConsent(g, channel, category, status) {
    consents.push({
      id: 'consent_' + (++cSeq), guestId: g.id, channel: channel, category: category, status: status,
      source: g.sourceChannel === channel ? 'instant_checkin' : 'booking_form',
      capturedAt: g.createdAt, revokedAt: status === 'denied' ? g.updatedAt : null,
      proof: 'opt_in_log#' + cSeq
    });
  }
  guests.forEach(function (g) {
    var s = g.consentSummary;
    pushConsent(g, 'email', 'transactional', 'granted');
    pushConsent(g, 'email', 'marketing', s.globalUnsubscribe ? 'denied' : s.emailMarketing);
    pushConsent(g, 'whatsapp', 'marketing', s.globalUnsubscribe ? 'denied' : s.whatsappMarketing);
    pushConsent(g, 'sms', 'marketing', s.globalUnsubscribe ? 'denied' : s.smsMarketing);
  });

  // ---- preferences ----
  var preferences = [];
  var prefSeq = 0;
  function pushPref(g, key, value, source, conf) {
    preferences.push({ id: 'pref_' + (++prefSeq), guestId: g.id, key: key, value: value, source: source, confidence: conf, updatedAt: g.updatedAt });
  }
  guests.forEach(function (g) {
    pushPref(g, 'language', g.languageName, 'declared', 1);
    if (g.tags.indexOf('family') >= 0) pushPref(g, 'travels_with', 'children', 'inferred', 0.82);
    if (g.interests.indexOf('parking') >= 0) pushPref(g, 'needs_parking', 'yes', 'declared', 0.9);
    if (g.interests.indexOf('spa') >= 0) pushPref(g, 'wellness_interest', 'high', 'inferred', 0.7);
    if (g.tags.indexOf('business') >= 0) pushPref(g, 'trip_purpose', 'business', 'inferred', 0.78);
    pushPref(g, 'preferred_channel', g.sourceChannel, 'inferred', 0.65);
  });

  // ---- conversation events (inbox) ----
  var conversations = [];
  var convSeq = 0;
  function pushConv(g, channel, dir, off, summary, intent, sentiment) {
    conversations.push({ id: 'conv_' + (++convSeq), guestId: g.id, reservationId: null, channel: channel, direction: dir, timestamp: day(off), summary: summary, detectedIntent: intent, sentiment: sentiment, sourceConversationId: 'inbox_' + (1000 + convSeq) });
  }
  guests.forEach(function (g, i) {
    pushConv(g, g.sourceChannel, 'inbound', -(5 + i % 20), 'Guest reached out about their upcoming stay.', 'general_question', 'neutral');
    if (g.interests.indexOf('parking') >= 0) pushConv(g, 'inbox', 'inbound', -(2 + i % 6), 'Asked whether the property has parking or a nearby garage.', 'parking_inquiry', 'neutral');
    if (g.interests.indexOf('spa') >= 0) pushConv(g, 'email', 'inbound', -(10 + i % 10), 'Asked about spa and wellness options near the property.', 'wellness_inquiry', 'positive');
    if (g.tags.indexOf('abandoned_checkin') >= 0) pushConv(g, 'whatsapp', 'outbound', -1, 'Sent a reminder to finish online check-in before arrival.', 'checkin_nudge', 'neutral');
  });

  // ---- check-in events ----
  var checkins = [];
  var ckSeq = 0;
  reservations.forEach(function (res) {
    var g = byId(res.guestId);
    var status = 'completed', started = day(-3), completed = day(-3), abandoned = null, fields = ['name', 'document', 'contact', 'signature'];
    if (g.tags.indexOf('abandoned_checkin') >= 0 && res.status === 'confirmed') { status = 'abandoned'; started = day(-1); completed = null; abandoned = day(-1); fields = ['name', 'contact']; }
    else if (res.status === 'confirmed') { status = (g.profileCompleteness > 70 ? 'started' : 'not_started'); started = status === 'started' ? day(-2) : null; completed = null; fields = status === 'started' ? ['name', 'document'] : []; }
    checkins.push({ id: 'ck_' + (++ckSeq), guestId: res.guestId, reservationId: res.id, status: status, startedAt: started, completedAt: completed, abandonedAt: abandoned, collectedFields: fields });
  });

  // ---- app-sales purchases (past deal buys, drives revenue figures) ----
  var purchases = [];
  var pSeq = 0;
  guests.forEach(function (g) {
    g.interests.slice(0, 2).forEach(function (key, k) {
      var d = deals.filter(function (x) { return x.id === 'deal_' + key || x.id.indexOf(key) >= 0; })[0];
      if (!d || !g.lastStayAt) return;
      purchases.push({ id: 'buy_' + (++pSeq), guestId: g.id, dealId: d.id, dealTitle: d.title, amount: d.price * (1 + (k % 2)), currency: CUR, purchasedAt: g.lastStayAt, channel: 'guest_app' });
    });
  });

  // ---- recommended actions per guest (the "why" is explicit) ----
  guests.forEach(function (g) {
    var acts = [];
    if (g.lifecycleStage === 'in_house') acts.push({ id: 'ra_' + g.id + '_lc', label: 'Offer late checkout', reason: 'Guest is in-house and historically buys convenience add-ons.', kind: 'upsell', dealId: 'deal_late_checkout', estimatedRevenue: 30 });
    if (g.tags.indexOf('abandoned_checkin') >= 0) acts.push({ id: 'ra_' + g.id + '_ck', label: 'Recover abandoned check-in', reason: 'Online check-in was started but not completed before arrival.', kind: 'recover', estimatedRevenue: 0 });
    if (g.interests.indexOf('parking') >= 0 && g.nextStayAt) acts.push({ id: 'ra_' + g.id + '_pk', label: 'Promote parking', reason: 'Guest asked about parking and arrives soon.', kind: 'upsell', dealId: 'deal_parking', estimatedRevenue: 54 });
    if (g.tags.indexOf('dormant') >= 0) acts.push({ id: 'ra_' + g.id + '_re', label: 'Reactivate for next season', reason: 'Past guest with no future booking — strong win-back fit.', kind: 'reactivate', estimatedRevenue: 90 });
    if (g.tags.indexOf('family') >= 0 && g.nextStayAt) acts.push({ id: 'ra_' + g.id + '_fam', label: 'Family dining + early check-in', reason: 'Family arrival with children; high fit for family bundles.', kind: 'upsell', dealId: 'deal_early_checkin', estimatedRevenue: 73 });
    if (g.interests.indexOf('spa') >= 0 && g.nextStayAt) acts.push({ id: 'ra_' + g.id + '_spa', label: 'Wellness upsell', reason: 'Prior spa buyer with an upcoming stay.', kind: 'upsell', dealId: 'deal_spa', estimatedRevenue: 120 });
    if (!acts.length) acts.push({ id: 'ra_' + g.id + '_bf', label: 'Breakfast cross-sell', reason: 'Universal convenience offer with good conversion.', kind: 'upsell', dealId: 'deal_breakfast', estimatedRevenue: 36 });
    g.recommendedActions = acts.slice(0, 3);
  });

  // ---- automation triggers (catalog from the existing Automation Engine) ----
  var triggers = [
    { id: 'trg_reservation_created', name: 'Reservation created', eventType: 'reservation_created', description: 'Fires when a new booking is imported.', conditions: [], delay: 0, active: true },
    { id: 'trg_checkin_started', name: 'Check-in started', eventType: 'checkin_started', description: 'Guest began online check-in.', conditions: [], delay: 0, active: true },
    { id: 'trg_checkin_completed', name: 'Check-in completed', eventType: 'checkin_completed', description: 'Guest finished online check-in.', conditions: [], delay: 0, active: true },
    { id: 'trg_checkin_abandoned', name: 'Check-in abandoned', eventType: 'checkin_abandoned', description: 'Started but not completed before a threshold.', conditions: [], delay: 1440, active: true },
    { id: 'trg_days_before_arrival', name: 'Days before arrival', eventType: 'days_before_arrival', description: 'A set number of days before check-in.', conditions: [], delay: 0, active: true },
    { id: 'trg_day_of_arrival', name: 'Day of arrival', eventType: 'day_of_arrival', description: 'On the morning of check-in.', conditions: [], delay: 0, active: true },
    { id: 'trg_during_stay', name: 'During stay', eventType: 'during_stay', description: 'While the guest is in-house.', conditions: [], delay: 0, active: true },
    { id: 'trg_before_checkout', name: 'Before checkout', eventType: 'before_checkout', description: 'The evening before departure.', conditions: [], delay: 0, active: true },
    { id: 'trg_after_checkout', name: 'After checkout', eventType: 'after_checkout', description: 'After the guest departs.', conditions: [], delay: 0, active: true },
    { id: 'trg_deal_purchased', name: 'Deal purchased', eventType: 'deal_purchased', description: 'Guest bought an App Sales deal.', conditions: [], delay: 0, active: true },
    { id: 'trg_campaign_clicked', name: 'Campaign clicked', eventType: 'campaign_clicked', description: 'Guest clicked a campaign CTA.', conditions: [], delay: 0, active: true },
    { id: 'trg_segment_entered', name: 'Segment entered', eventType: 'segment_entered', description: 'Guest entered a dynamic segment.', conditions: [], delay: 0, active: true }
  ];

  // ---- segments ----
  var segments = [
    { id: 'seg_arriving_family', organizationId: ORG, name: 'Families arriving this weekend', description: 'Families with children arriving in the next 3 days.', naturalLanguageQuery: 'Families arriving this weekend with children', rules: [{ field: 'checkInDate', operator: 'between', value: ['today', 'today+3d'], label: 'Arrives in next 3 days' }, { field: 'children', operator: 'greater_than', value: 0, label: 'Has children' }], type: 'dynamic', estimatedSize: 6, eligibleSize: 5, excludedSize: 1, exclusions: ['No email marketing consent'], createdAt: day(-20), updatedAt: day(-2) },
    { id: 'seg_abandoned_checkin', organizationId: ORG, name: 'Abandoned check-ins', description: 'Guests who started but did not finish online check-in.', naturalLanguageQuery: 'Guests arriving in the next 7 days who have not completed check-in', rules: [{ field: 'checkinStatus', operator: 'equals', value: 'abandoned', label: 'Check-in abandoned' }, { field: 'checkInDate', operator: 'between', value: ['today', 'today+7d'], label: 'Arrives in next 7 days' }], type: 'dynamic', estimatedSize: 3, eligibleSize: 3, excludedSize: 0, exclusions: [], createdAt: day(-15), updatedAt: day(-1) },
    { id: 'seg_summer_families', organizationId: ORG, name: 'Last-summer families, no future booking', description: 'Win-back pool for the next family season.', naturalLanguageQuery: 'Families who stayed last summer and have no future booking', rules: [{ field: 'lastStaySeason', operator: 'equals', value: 'summer_2025', label: 'Stayed last summer' }, { field: 'tags', operator: 'contains', value: 'family', label: 'Family' }, { field: 'nextStayAt', operator: 'is_false', value: null, label: 'No future booking' }], type: 'dynamic', estimatedSize: 4, eligibleSize: 4, excludedSize: 0, exclusions: [], createdAt: day(-30), updatedAt: day(-5) },
    { id: 'seg_parking_intent', organizationId: ORG, name: 'Asked about parking, arriving soon', description: 'Guests who asked about parking and arrive within 72h.', naturalLanguageQuery: 'Guests who asked about parking and arrive in the next 72 hours', rules: [{ field: 'detectedIntent', operator: 'equals', value: 'parking_inquiry', label: 'Asked about parking' }, { field: 'checkInDate', operator: 'between', value: ['today', 'today+3d'], label: 'Arrives in 72h' }], type: 'ai_suggested', estimatedSize: 3, eligibleSize: 3, excludedSize: 0, exclusions: [], createdAt: day(-3), updatedAt: day(-1) }
  ];

  // ---- campaigns ----
  function content(subject, preview, body, cta) {
    return { subject: subject, previewText: preview, body: body, ctaLabel: cta, ctaUrl: 'https://app.chekin.com/deals', language: 'en', tone: 'warm', personalizationTokens: ['firstName', 'propertyName', 'checkInDate'] };
  }
  function analytics(sent, deliv, open, click, conv, rev, comm, unsub, fail) {
    return { sent: sent, delivered: deliv, opened: open, clicked: click, converted: conv, revenue: rev, commission: comm, unsubscribed: unsub, failed: fail, conversionRate: sent ? +(conv / sent).toFixed(3) : 0, clickRate: deliv ? +(click / deliv).toFixed(3) : 0 };
  }
  var campaigns = [
    {
      id: 'camp_early_family', organizationId: ORG, name: 'Early check-in for upcoming family arrivals', objective: 'upsell', status: 'active',
      segmentId: 'seg_arriving_family', audienceRules: segments[0].rules, channel: 'email', trigger: { type: 'days_before_arrival', value: 3 }, schedule: { mode: 'trigger' },
      deals: [{ dealId: 'deal_early_checkin', title: 'Early Check-In', reason: 'High fit for families arriving soon; convenience-oriented.' }, { dealId: 'deal_family_restaurant', title: 'Family Restaurant Set Menu', reason: 'Pairs with arrival; kid-friendly dining.' }],
      content: content('Arrive earlier and start your stay with no rush', 'Add early check-in to your upcoming stay.', 'Hi {{firstName}}, your stay at {{propertyName}} is coming up on {{checkInDate}}. Would you like to arrive earlier and start your trip with more comfort?', 'Add early check-in'),
      variants: [], consentCheck: { status: 'passed', audienceSize: 6, eligibleSize: 5, excludedSize: 1, exclusions: [{ reason: 'No email marketing consent', count: 1 }], notes: [] },
      revenueEstimate: { expectedConversions: 6, expectedRevenue: 210, currency: CUR },
      analytics: analytics(5, 5, 3, 2, 1, 73, 0, 0, 0), createdBy: 'Marta R.', createdAt: day(-10), updatedAt: day(-1), approvedBy: 'Marta R.', approvedAt: day(-9)
    },
    {
      id: 'camp_parking_72h', organizationId: ORG, name: 'Parking for guests asking about cars', objective: 'cross-sell', status: 'needs_review',
      segmentId: 'seg_parking_intent', audienceRules: segments[3].rules, channel: 'whatsapp', trigger: { type: 'day_of_arrival' }, schedule: { mode: 'trigger' },
      deals: [{ dealId: 'deal_parking', title: 'Private Parking (per night)', reason: 'Guests explicitly asked about parking and arrive within 72h.' }],
      content: content('Your parking spot is one tap away', 'Reserve on-site parking for your stay.', 'Hi {{firstName}}, we saw you asked about parking at {{propertyName}}. Reserve a private spot for your arrival on {{checkInDate}}.', 'Reserve parking'),
      variants: [], consentCheck: { status: 'passed', audienceSize: 3, eligibleSize: 3, excludedSize: 0, exclusions: [], notes: ['WhatsApp marketing consent present for all 3'] },
      revenueEstimate: { expectedConversions: 1, expectedRevenue: 54, currency: CUR },
      analytics: null, createdBy: 'Vela (AI draft)', createdAt: day(-2), updatedAt: day(-1), approvedBy: null, approvedAt: null
    },
    {
      id: 'camp_summer_winback', organizationId: ORG, name: 'Summer family win-back', objective: 'rebooking', status: 'draft',
      segmentId: 'seg_summer_families', audienceRules: segments[2].rules, channel: 'email', trigger: { type: 'segment_entered' }, schedule: { mode: 'one_shot', sendAt: date(2) },
      deals: [{ dealId: 'deal_family_restaurant', title: 'Family Restaurant Set Menu', reason: 'Resonates with past family guests.' }, { dealId: 'deal_crib', title: 'Baby Crib & Kit', reason: 'Several travelled with infants previously.' }],
      content: content('Your favourite summer escape is back', 'Come back this summer — family perks inside.', 'Hi {{firstName}}, last summer at {{propertyName}} was a great one. Plan this year\'s trip with family perks ready to go.', 'Plan this summer'),
      variants: [], consentCheck: { status: 'warning', audienceSize: 4, eligibleSize: 3, excludedSize: 1, exclusions: [{ reason: 'Global unsubscribe', count: 1 }], notes: ['1 guest globally unsubscribed — excluded automatically'] },
      revenueEstimate: { expectedConversions: 2, expectedRevenue: 180, currency: CUR },
      analytics: null, createdBy: 'Marta R.', createdAt: day(-5), updatedAt: day(-3), approvedBy: null, approvedAt: null
    },
    {
      id: 'camp_late_checkout_sun', organizationId: ORG, name: 'Late checkout for Sunday departures', objective: 'upsell', status: 'completed',
      segmentId: null, audienceRules: [{ field: 'checkOutDate', operator: 'equals', value: 'sunday', label: 'Departs Sunday' }], channel: 'email', trigger: { type: 'before_checkout' }, schedule: { mode: 'trigger' },
      deals: [{ dealId: 'deal_late_checkout', title: 'Late Checkout (14:00)', reason: 'Sunday departures value a slower morning.' }],
      content: content('No rush on Sunday — stay until 14:00', 'Add late checkout to your departure.', 'Hi {{firstName}}, enjoy a relaxed final morning at {{propertyName}}. Keep your room until 14:00.', 'Add late checkout'),
      variants: [], consentCheck: { status: 'passed', audienceSize: 42, eligibleSize: 38, excludedSize: 4, exclusions: [{ reason: 'No email marketing consent', count: 3 }, { reason: 'Global unsubscribe', count: 1 }], notes: [] },
      revenueEstimate: { expectedConversions: 9, expectedRevenue: 270, currency: CUR },
      analytics: analytics(38, 37, 21, 11, 8, 240, 0, 1, 1), createdBy: 'Marta R.', createdAt: day(-40), updatedAt: day(-30), approvedBy: 'Admin', approvedAt: day(-39)
    }
  ];

  // ---- automations (campaign ↔ trigger bindings) ----
  var automations = [
    { id: 'auto_1', name: 'Early check-in (3 days before arrival)', campaignId: 'camp_early_family', triggerType: 'days_before_arrival', triggerValue: 3, status: 'active', lastRun: day(-1), nextRun: day(1), runs: 14, conversions: 3, consentBlocks: 1, failures: 0 },
    { id: 'auto_2', name: 'Late checkout (before checkout)', campaignId: 'camp_late_checkout_sun', triggerType: 'before_checkout', triggerValue: null, status: 'paused', lastRun: day(-30), nextRun: null, runs: 42, conversions: 8, consentBlocks: 4, failures: 1 },
    { id: 'auto_3', name: 'Parking nudge (day of arrival)', campaignId: 'camp_parking_72h', triggerType: 'day_of_arrival', triggerValue: null, status: 'needs_review', lastRun: null, nextRun: null, runs: 0, conversions: 0, consentBlocks: 0, failures: 0 }
  ];

  // ---- approvals (audit trail) ----
  var approvals = [
    { id: 'appr_1', objectType: 'campaign', objectId: 'camp_early_family', status: 'approved', requestedBy: 'Vela (AI draft)', reviewedBy: 'Marta R.', reviewedAt: day(-9), comment: 'Looks good. Consent check passed.' },
    { id: 'appr_2', objectType: 'campaign', objectId: 'camp_parking_72h', status: 'pending', requestedBy: 'Vela (AI draft)', reviewedBy: null, reviewedAt: null, comment: 'Awaiting review — WhatsApp channel.' },
    { id: 'appr_3', objectType: 'campaign', objectId: 'camp_late_checkout_sun', status: 'approved', requestedBy: 'Marta R.', reviewedBy: 'Admin', reviewedAt: day(-39), comment: 'Approved for Sunday departures.' }
  ];

  // ---- agent runs (activity timeline) ----
  var agentRuns = [
    { id: 'run_1', type: 'campaign_planner', input: { prompt: 'Create a campaign for guests arriving this weekend with children, offering early check-in and a family restaurant deal.' }, output: { campaignId: 'camp_early_family' }, reasoningSummary: 'Matched families arriving in 3 days, attached early check-in + family dining, checked consent, drafted copy.', createdAt: day(-10), createdBy: 'Marta R.', status: 'completed' },
    { id: 'run_2', type: 'segment_builder', input: { prompt: 'Guests who asked about parking and arrive in the next 72 hours' }, output: { segmentId: 'seg_parking_intent' }, reasoningSummary: 'Parsed parking intent from inbox + arrival window into 2 rules. Estimated 3 guests.', createdAt: day(-3), createdBy: 'Marta R.', status: 'completed' },
    { id: 'run_3', type: 'deal_matching', input: { segmentId: 'seg_arriving_family' }, output: { deals: ['deal_early_checkin', 'deal_family_restaurant', 'deal_crib'] }, reasoningSummary: 'Ranked deals by tag overlap with family-arrival audience and historical conversion.', createdAt: day(-10), createdBy: 'Vela', status: 'completed' },
    { id: 'run_4', type: 'compliance_check', input: { campaignId: 'camp_summer_winback' }, output: { status: 'warning', excluded: 1 }, reasoningSummary: 'Excluded 1 globally-unsubscribed guest; flagged for review.', createdAt: day(-5), createdBy: 'Vela', status: 'completed' }
  ];

  // ---- dashboard AI suggestions ----
  var suggestions = [
    { id: 'sug_late_sun', title: 'Sell late checkout to Sunday departures', detail: '42 guests depart this Sunday and historically value a slower morning.', metric: '42 guests', estRevenue: 270, kind: 'upsell', dealId: 'deal_late_checkout', segmentHint: 'Departs Sunday' },
    { id: 'sug_recover_ck', title: 'Recover abandoned check-ins', detail: '3 guests started but did not finish online check-in before arrival.', metric: '3 guests', estRevenue: 0, kind: 'recover', segmentHint: 'Abandoned check-ins' },
    { id: 'sug_reactivate', title: 'Reactivate past summer family guests', detail: '4 families stayed last summer with no future booking yet.', metric: '4 families', estRevenue: 180, kind: 'reactivate', segmentHint: 'Last-summer families' },
    { id: 'sug_parking', title: 'Promote parking to arrivals asking about cars', detail: '3 arrivals asked about parking and arrive within 72 hours.', metric: '3 guests', estRevenue: 54, kind: 'upsell', dealId: 'deal_parking', segmentHint: 'Parking intent' }
  ];

  // ---- segmentation tags (CRM-managed, user-editable, drive campaign inclusion/exclusion) ----
  // Separate from descriptive guest.tags (family/couple/etc); these are CRM operator decisions.
  var SEG_TAGS = {
    guest_001: ['repeat_guest', 'family'],
    guest_002: ['whale', 'vip', 'high_app_sales_potential'],
    guest_003: ['couple'],
    guest_004: ['business'],
    guest_005: ['couple'],
    guest_006: ['family'],
    guest_007: ['family'],
    guest_008: ['needs_review'],
    guest_009: ['repeat_guest', 'business', 'high_app_sales_potential'],
    guest_010: ['couple'],
    guest_011: [],
    guest_012: ['vip', 'preferred', 'family'],
    guest_013: ['do_not_contact'],
    guest_014: ['couple', 'high_app_sales_potential'],
    guest_015: [],
    guest_016: ['family'],
    guest_017: ['whale', 'repeat_guest', 'business', 'high_app_sales_potential'],
    guest_018: ['couple'],
    guest_019: ['repeat_guest', 'family'],
    guest_020: ['preferred', 'high_app_sales_potential'],
    guest_021: ['business'],
    guest_022: ['family'],
    guest_023: ['couple'],
    guest_024: ['couple'],
    guest_025: [],
    guest_026: ['couple'],
    guest_027: ['family'],
    guest_028: ['whale', 'vip', 'high_app_sales_potential'],
    guest_029: ['repeat_guest', 'business']
  };
  var SEG_TAG_NOTES = {
    guest_013: { do_not_contact: 'Guest requested complete suppression from all marketing.' }
  };
  guests.forEach(function (g) {
    g.segmentTags = SEG_TAGS[g.id] || [];
    g.segmentTagNotes = SEG_TAG_NOTES[g.id] || {};
  });

  window.CRM_DATA = {
    organizationId: ORG, currency: CUR, today: date(0),
    properties: properties, guests: guests, reservations: reservations, deals: deals,
    consents: consents, preferences: preferences, conversations: conversations, checkins: checkins,
    purchases: purchases, triggers: triggers, segments: segments, campaigns: campaigns,
    automations: automations, approvals: approvals, agentRuns: agentRuns, suggestions: suggestions,
    _helpers: { date: date, day: day }
  };
})();
