/* ============================================================
   Local Network — Typed Fixtures (mock seed data)
   Exposes window.LN_DATA. Deterministic (no randomness, no Date.now)
   so countdowns, decay steps and charts are stable across reloads.
   "Today" anchor for every relative date: 2026-06-13.

   Money is NOT stored here. Fixtures hold raw order lines; every euro
   in the UI is derived by NetworkService.computeAccrual so the numbers
   can never drift from the configured economics.
   ============================================================ */
(function () {
  'use strict';

  var CUR = 'EUR';
  var TODAY = '2026-06-13';
  var T = new Date(TODAY + 'T09:00:00Z');

  function date(dayOffset) { var d = new Date(T); d.setDate(d.getDate() + dayOffset); return d.toISOString().slice(0, 10); }
  function months(m) { var d = new Date(T); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10); }
  // deterministic 0..1 from a string — replaces Math.random everywhere
  function h(s) { var x = 2166136261, i; for (i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = (x * 16777619) >>> 0; } return x >>> 0; }
  function rnd(s) { return (h(s) % 10000) / 10000; }
  function pick(s, arr) { return arr[h(s) % arr.length]; }

  // ---------- destinations ----------
  // Barcelona vs Cádiz is the contrast the whole product turns on: dense and
  // largely aggregator-covered vs thin and genuinely under-supplied.
  var destinations = [
    {
      id: 'dst_bcn', name: 'Barcelona', country: 'ES', geo: { lat: 41.3874, lng: 2.1686 },
      supplyDensity: 'high', activeProperties: 180, liveSuppliers: 42,
      // these categories drive the saturated-premium rule in LN_CONFIG
      categoriesCovered: ['storage', 'dining', 'wellness', 'transfer', 'tickets', 'mobility'],
      densityFloorMet: true
    },
    {
      id: 'dst_cad', name: 'Cádiz', country: 'ES', geo: { lat: 36.5271, lng: -6.2886 },
      supplyDensity: 'low', activeProperties: 34, liveSuppliers: 6,
      categoriesCovered: ['dining'],
      densityFloorMet: false
    }
  ];

  // ---------- accounts ----------
  var accounts = [
    { id: 'acc_pm_gaditana', name: 'Gaditana Stays', type: 'pm', isActive: true, email: 'ops@gaditanastays.es',
      propertyIds: [], curatorDestinationIds: ['dst_cad'], blockedCategories: [], joinedAt: months(-38), churnedAt: null },
    { id: 'acc_pm_costa', name: 'Costa Habitat', type: 'pm', isActive: true, email: 'hola@costahabitat.com',
      propertyIds: [], curatorDestinationIds: [], blockedCategories: ['mobility'], joinedAt: months(-44), churnedAt: null },
    { id: 'acc_host_marta', name: 'Marta Ferrán', type: 'host', isActive: true, email: 'marta.ferran@gmail.com',
      propertyIds: [], curatorDestinationIds: [], blockedCategories: [], joinedAt: months(-14), churnedAt: null },
    { id: 'acc_host_nuria', name: 'Nuria Belmonte', type: 'host', isActive: false, email: 'nuria.belmonte@gmail.com',
      propertyIds: [], curatorDestinationIds: [], blockedCategories: [], joinedAt: months(-30), churnedAt: months(-7) },
    { id: 'acc_sup_riera', name: 'Bodega Riera', type: 'supplier', isActive: true, email: 'reservas@bodegariera.es',
      propertyIds: [], curatorDestinationIds: [], blockedCategories: [], joinedAt: months(-8), churnedAt: null }
  ];

  // ---------- properties ----------
  var CAD_NAMES = ['La Caleta Loft', 'Casa Viña 4', 'Plaza de Mina 2A', 'Torre Tavira Ático', 'Santa María 11',
    'Mentidero Duplex', 'Playa Victoria 8', 'El Pópulo Patio', 'Candelaria Suite', 'San Juan de Dios 3',
    'Cortadura Beach', 'Muralla del Mar'];
  var BCN_NAMES = ['Gràcia Loft 3B', 'Eixample Dret 402', 'Born Atelier', 'Poblenou Sky', 'Sants Estació 12',
    'Sant Antoni Pati', 'Gòtic Ribera 7', 'Vila de Gràcia 21', 'Sagrada Vista', 'Poble Sec Terrat',
    'Barceloneta Mar', 'Sarrià Jardí', 'Clot Nou 5', 'Horta Verd'];

  var properties = [];
  function addProps(names, dst, accountId, prefix, offset) {
    names.forEach(function (n, i) {
      var seed = prefix + i;
      var d = destinations.filter(function (x) { return x.id === dst; })[0];
      properties.push({
        id: 'hou_' + prefix + '_' + (i + 1), name: n, city: d.name, country: d.country,
        accountId: accountId, destinationId: dst,
        geo: { lat: d.geo.lat + (rnd(seed + 'lat') - 0.5) * 0.06, lng: d.geo.lng + (rnd(seed + 'lng') - 0.5) * 0.06 },
        blockedSupplierIds: [], blockedCategories: []
      });
    });
    return offset;
  }
  addProps(CAD_NAMES, 'dst_cad', 'acc_pm_gaditana', 'gadcad');
  addProps(BCN_NAMES.slice(0, 4), 'dst_bcn', 'acc_pm_gaditana', 'gadbcn');
  addProps(BCN_NAMES.slice(4), 'dst_bcn', 'acc_pm_costa', 'costa');
  addProps(['Gràcia Loft 3B'], 'dst_bcn', 'acc_host_marta', 'marta');
  addProps(['Bahía Sur Ático'], 'dst_cad', 'acc_host_nuria', 'nuria');

  // one pre-existing veto so discover.html has a "blocked" state on first load
  properties[0].blockedCategories = ['mobility'];
  accounts.forEach(function (a) {
    a.propertyIds = properties.filter(function (p) { return p.accountId === a.id; }).map(function (p) { return p.id; });
  });

  // ---------- suppliers ----------
  // Blueprint tuple keeps the fixture readable:
  // [id, name, legalEntity, category, subcategory, destinationId, score,
  //  status, origin, aggregatorPresence, priceFrom, contentCompleteness, risks]
  var SUP = [
    // — Cádiz, claimed —
    ['riera', 'Bodega Riera', 'Bodega Riera SL', 'dining', 'Winery tour & tasting', 'dst_cad', 0.93, 'live', 'network', false, 32, 100, []],
    ['kayak', 'Kayak Caleta', 'Caleta Náutica SL', 'experience', 'Sea kayak tours', 'dst_cad', 0.88, 'live', 'network', false, 38, 92, ['water']],
    ['lockers', 'Consigna Cádiz Centro', 'Consigna Gadir SL', 'storage', 'Luggage lockers', 'dst_cad', 0.91, 'live', 'network', false, 6, 100, []],
    ['chef', 'Chef a Domicilio Gadir', 'Gadir Gastronomía SL', 'dining', 'Private chef at home', 'dst_cad', 0.86, 'live', 'network', false, 55, 96, []],
    ['ceramics', 'Taller Cerámica La Viña', 'La Viña Artesanía SC', 'experience', 'Ceramics workshop', 'dst_cad', 0.89, 'live', 'network', false, 45, 88, []],
    ['catedral', 'Catedral de Cádiz Tickets', 'Cabildo Catedralicio', 'tickets', 'Skip-the-line entry', 'dst_cad', 0.90, 'live', 'network', false, 9, 100, []],
    ['horse', 'Hípica Doñana', 'Hípica Doñana SL', 'experience', 'Horse riding on the dunes', 'dst_cad', 0.68, 'watch', 'network', false, 60, 74, ['height', 'minors']],
    ['pet', 'Guardería Canina Bahía', 'Bahía Mascotas SL', 'pet', 'Dog daycare', 'dst_cad', 0.84, 'onboarding', 'network', false, 22, 61, []],
    ['ebike', 'Gadir E-Bikes', 'Gadir Movilidad SL', 'mobility', 'E-bike hire', 'dst_cad', 0.80, 'pending_supplier', 'network', false, 18, 44, ['vehicles']],
    ['surf', 'Escuela Surf Santa María', 'Surf Santa María SC', 'equipment', 'Board & wetsuit hire', 'dst_cad', 0.82, 'screening', 'network', false, 25, 38, ['water']],
    ['tapas', 'Ruta de Tapas Gaditana', 'Gaditana Tours SL', 'dining', 'Guided tapas route', 'dst_cad', 0.85, 'draft', 'network', false, 42, 20, ['alcohol']],
    ['bikecad', 'Bahía Bike Rental', 'Bahía Bike SL', 'mobility', 'City bike hire', 'dst_cad', 0.79, 'screening', 'network', false, 14, 55, ['vehicles']],
    ['quad', 'Quads Aventura Chiclana', 'Aventura Chiclana SL', 'mobility', 'Quad excursions', 'dst_cad', 0.41, 'terminated', 'network', false, 75, 62, ['vehicles', 'minors']],
    ['museo', 'Museo del Vino Jerez', 'Museo del Vino SL', 'tickets', 'Museum entry', 'dst_cad', 0.83, 'draft', 'network', false, 12, 30, ['alcohol']],
    ['chiringuito', 'Chiringuito Playa Victoria', 'Playa Victoria Rest. SL', 'dining', 'Beachfront dining', 'dst_cad', 0.87, 'live', 'network', false, 28, 90, []],
    // — Barcelona, claimed —
    ['boat', 'Vela Barcelona Boat Trips', 'Vela BCN Náutica SL', 'experience', 'Sunset sailing', 'dst_bcn', 0.90, 'live', 'network', false, 65, 98, ['water']],
    ['transfer', 'Transfer Prat Directo', 'Prat Directo SL', 'transfer', 'Airport transfer', 'dst_bcn', 0.82, 'live', 'network', true, 42, 94, ['vehicles']],
    ['gastro', 'Cocina Mediterránea Raval', 'Raval Cuina SL', 'dining', 'Chef-led supper club', 'dst_bcn', 0.95, 'live', 'network', false, 48, 100, []],
    ['spa', 'Aigües de Gràcia Spa', 'Aigües Gràcia SL', 'wellness', 'Thermal circuit', 'dst_bcn', 0.88, 'live', 'network', true, 52, 97, []],
    ['flamenco', 'Tablao Gòtic', 'Tablao Gòtic SL', 'tickets', 'Flamenco show entry', 'dst_bcn', 0.87, 'live', 'network', true, 35, 93, []],
    ['lockersbcn', 'Guarda Equipaje Sants', 'Sants Consigna SL', 'storage', 'Luggage storage', 'dst_bcn', 0.86, 'live', 'network', true, 5, 91, []],
    ['kayakbcn', 'Kayak Costa Brava Express', 'Costa Brava Kayak SL', 'experience', 'Coastal kayak day trip', 'dst_bcn', 0.81, 'live', 'network', false, 55, 85, ['water']],
    ['yoga', 'Yoga Barceloneta', 'Barceloneta Wellness SC', 'wellness', 'Beach yoga class', 'dst_bcn', 0.55, 'suspended', 'network', false, 20, 70, []],
    ['celler', 'Celler del Poble', 'Celler del Poble SL', 'dining', 'Wine cellar tasting', 'dst_bcn', 0.84, 'live', 'network', false, 30, 89, ['alcohol']]
  ];

  // — unclaimed / centrally-sourced supply. Gives Barcelona its real density and
  //   gives discover.html a populated grid of supply nobody in view sourced.
  var CENTRAL = [
    ['Bus Turístic BCN', 'tickets', 'dst_bcn', 0.79, 28], ['Park Güell Entradas', 'tickets', 'dst_bcn', 0.85, 14],
    ['Sagrada Família Fast Pass', 'tickets', 'dst_bcn', 0.92, 33], ['Camp Nou Tour', 'tickets', 'dst_bcn', 0.81, 30],
    ['Taxi Aeroport 24h', 'transfer', 'dst_bcn', 0.74, 38], ['Shuttle Girona Express', 'transfer', 'dst_bcn', 0.77, 25],
    ['Scooter Rent Diagonal', 'mobility', 'dst_bcn', 0.83, 24], ['Bicing Turista', 'mobility', 'dst_bcn', 0.78, 16],
    ['Luggage Point Plaça Catalunya', 'storage', 'dst_bcn', 0.88, 6], ['Bag Drop Born', 'storage', 'dst_bcn', 0.80, 5],
    ['Massatge Eixample', 'wellness', 'dst_bcn', 0.86, 45], ['Hammam Al-Andalus BCN', 'wellness', 'dst_bcn', 0.91, 58],
    ['Pilates Poblenou', 'wellness', 'dst_bcn', 0.75, 22], ['Tapas Walking Tour Gòtic', 'dining', 'dst_bcn', 0.84, 40],
    ['Paella Cooking Class', 'dining', 'dst_bcn', 0.89, 62], ['Brunch Delivery BCN', 'dining', 'dst_bcn', 0.72, 18],
    ['Vermut Tour Sant Antoni', 'dining', 'dst_bcn', 0.87, 26], ['Ski Rent Pirineus', 'equipment', 'dst_bcn', 0.76, 35],
    ['Surf Rent Castelldefels', 'equipment', 'dst_bcn', 0.80, 27], ['Stroller & Baby Kit BCN', 'equipment', 'dst_bcn', 0.85, 15],
    ['Pet Hotel Eixample', 'pet', 'dst_bcn', 0.82, 30], ['Montserrat Day Trip', 'experience', 'dst_bcn', 0.88, 55],
    ['Hot Air Balloon Empordà', 'experience', 'dst_bcn', 0.90, 145], ['Segway Gòtic', 'experience', 'dst_bcn', 0.70, 42],
    ['Cava Tour Penedès', 'experience', 'dst_bcn', 0.86, 68], ['Consigna Estación Cádiz', 'storage', 'dst_cad', 0.77, 5],
    ['Taxi Bahía Jerez', 'transfer', 'dst_cad', 0.73, 55]
  ];

  var CAPS = window.LN_CONFIG.coverageCapsKm;
  var suppliers = [];

  function buildSupplier(id, name, entity, cat, sub, dst, score, status, origin, agg, price, content, risks, liveOffsetM) {
    var d = destinations.filter(function (x) { return x.id === dst; })[0];
    var cap = CAPS[cat];
    var km = Math.round((0.45 + rnd(id + 'km') * 0.5) * cap * 10) / 10;
    var seedy = rnd(id + 'sc');
    // score breakdown reconstructs to roughly the headline score, so the bars
    // on supplier-detail always look like they explain the number.
    function nudge(k, spread) { return Math.max(0, Math.min(1, score + (rnd(id + k) - 0.5) * spread)); }
    var history = [];
    for (var m = 5; m >= 0; m--) {
      var drift = status === 'watch' ? m * 0.045 : status === 'suspended' ? m * 0.06 : (rnd(id + 'h' + m) - 0.5) * 0.04;
      history.push(Math.max(0, Math.min(1, Math.round((score + drift) * 100) / 100)));
    }
    var MISSING = ['photos', 'cancellation_policy', 'languages', 'price_list', 'insurance_certificate', 'accessibility_notes'];
    var missing = content >= 100 ? [] : MISSING.slice(0, Math.max(1, Math.round((100 - content) / 18)));
    suppliers.push({
      id: 'sup_' + id, name: name, legalEntity: entity, taxId: 'B' + (10000000 + (h(id) % 89999999)),
      category: cat, subcategory: sub, destinationId: dst,
      geo: { lat: d.geo.lat + (rnd(id + 'lat') - 0.5) * 0.05, lng: d.geo.lng + (rnd(id + 'lng') - 0.5) * 0.05 },
      contact: { name: pick(id + 'c', ['Ana', 'Jordi', 'Rocío', 'Miguel', 'Laia', 'Álvaro', 'Carmen', 'Pau']) + ' ' + pick(id + 'd', ['Ruiz', 'Vidal', 'Serrano', 'Puig', 'Márquez', 'Ferrer']), email: id + '@' + id + '.es', phone: '+34 6' + (10000000 + (h(id + 'p') % 89999999)) },
      languages: seedy > 0.5 ? ['es', 'en'] : ['es', 'en', 'de'],
      origin: origin, status: status, score: score,
      scoreBreakdown: { confirmLatency: nudge('cl', 0.18), cancellationRate: nudge('cr', 0.14), noShowRate: nudge('ns', 0.10), guestRating: nudge('gr', 0.12), disputeRate: nudge('dr', 0.16) },
      scoreHistory: history,
      coverage: {
        id: 'cov_' + id, supplierId: 'sup_' + id, category: cat, basis: km > 20 ? 'radius' : 'isochrone',
        minutes: km > 20 ? null : Math.round(km * 4), km: km, capKm: cap, polygon: null,
        propertiesInCoverage: Math.max(1, Math.round(d.activeProperties * Math.min(1, km / cap)))
      },
      contentCompleteness: content, missingContent: missing,
      insuranceOnFile: content >= 70, licenceOnFile: content >= 55,
      aggregatorPresence: agg, media: content >= 80 ? ['hero.jpg', 'gallery-1.jpg', 'gallery-2.jpg'] : ['hero.jpg'],
      priceFrom: price, currency: CUR, riskFlags: risks,
      createdAt: months(liveOffsetM != null ? liveOffsetM - 2 : -6),
      liveAt: liveOffsetM != null ? months(liveOffsetM) : null
    });
  }

  // live-date offsets (months back from today) drive the decay step on screen
  var LIVE_AT = {
    riera: -8, kayak: -5, lockers: -14, chef: -40, ceramics: -4, catedral: -18, horse: -11,
    chiringuito: -5, boat: -26, transfer: -20, gastro: -1, spa: -33, flamenco: -3,
    lockersbcn: -9, kayakbcn: -16, yoga: -13, celler: -25
  };
  SUP.forEach(function (s) {
    buildSupplier(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], s[11], s[12], LIVE_AT[s[0]]);
  });
  CENTRAL.forEach(function (c, i) {
    var id = 'ctr' + i;
    buildSupplier(id, c[0], c[0] + ' SL', c[1], c[0], c[2], c[3], 'live', 'central', true, c[4], 90, [], -(6 + (h(id) % 30)));
  });

  function sup(id) { return suppliers.filter(function (s) { return s.id === 'sup_' + id; })[0]; }

  // ---------- bounties ----------
  var bounties = [
    { id: 'bty_cad_water', destinationId: 'dst_cad', category: 'experience', title: 'Water activities on the bay',
      gapEvidence: { searches: 412, emptyDecisions: 412, period: 'last 60 days' }, boostMultiplier: 1.50, activationBonus: 150,
      expiresAt: date(-30), status: 'claimed', claimedByAccountId: 'acc_pm_gaditana' },
    { id: 'bty_cad_transfer', destinationId: 'dst_cad', category: 'transfer', title: 'Jerez airport transfer',
      gapEvidence: { searches: 340, emptyDecisions: 340, period: 'last 30 days' }, boostMultiplier: 1.50, activationBonus: 250,
      expiresAt: date(48), status: 'open', claimedByAccountId: null },
    { id: 'bty_cad_pet', destinationId: 'dst_cad', category: 'pet', title: 'Dog daycare near the old town',
      gapEvidence: { searches: 96, emptyDecisions: 88, period: 'last 90 days' }, boostMultiplier: 1.50, activationBonus: 120,
      expiresAt: date(21), status: 'open', claimedByAccountId: null },
    { id: 'bty_cad_storage', destinationId: 'dst_cad', category: 'storage', title: 'Luggage storage at Playa Victoria',
      gapEvidence: { searches: 187, emptyDecisions: 174, period: 'last 30 days' }, boostMultiplier: 1.50, activationBonus: 90,
      expiresAt: date(9), status: 'open', claimedByAccountId: null },
    { id: 'bty_cad_wellness', destinationId: 'dst_cad', category: 'wellness', title: 'Spa or thermal circuit',
      gapEvidence: { searches: 143, emptyDecisions: 143, period: 'last 60 days' }, boostMultiplier: 1.50, activationBonus: 180,
      expiresAt: date(63), status: 'open', claimedByAccountId: null },
    { id: 'bty_cad_equipment', destinationId: 'dst_cad', category: 'equipment', title: 'Surf & beach equipment hire',
      gapEvidence: { searches: 221, emptyDecisions: 205, period: 'last 45 days' }, boostMultiplier: 1.50, activationBonus: 110,
      expiresAt: date(34), status: 'open', claimedByAccountId: null },
    { id: 'bty_cad_dining', destinationId: 'dst_cad', category: 'dining', title: 'Evening private chef',
      gapEvidence: { searches: 78, emptyDecisions: 61, period: 'last 90 days' }, boostMultiplier: 1.50, activationBonus: 140,
      expiresAt: date(76), status: 'open', claimedByAccountId: null },
    { id: 'bty_bcn_pet', destinationId: 'dst_bcn', category: 'pet', title: 'Dog daycare in Gràcia',
      gapEvidence: { searches: 154, emptyDecisions: 131, period: 'last 30 days' }, boostMultiplier: 1.50, activationBonus: 130,
      expiresAt: date(27), status: 'open', claimedByAccountId: null },
    { id: 'bty_bcn_equipment', destinationId: 'dst_bcn', category: 'equipment', title: 'Hiking & trekking kit hire',
      gapEvidence: { searches: 88, emptyDecisions: 79, period: 'last 60 days' }, boostMultiplier: 1.50, activationBonus: 100,
      expiresAt: date(55), status: 'open', claimedByAccountId: null }
  ];

  // ---------- claims ----------
  var RS = window.LN_CONFIG.roleShares;
  function roles(accountId, since, held) {
    held = held || ['sourced', 'activated', 'maintained'];
    return ['sourced', 'activated', 'maintained'].map(function (r) {
      var on = held.indexOf(r) >= 0;
      return { role: r, holderAccountId: on ? accountId : null, sharePct: RS[r], since: since, until: on ? null : since, releaseReason: on ? null : 'Not held' };
    }).filter(function (r) { return r.holderAccountId; });
  }
  function ev(at, kind, title, detail, actor) { return { at: at, kind: kind, title: title, detail: detail, actor: actor || 'System' }; }

  // decayStep is derived by the service from liveAt; the stored value is the
  // snapshot shown on the claim record and must agree with it.
  // month 1 is the first month live — matches NetworkService.decayFor exactly
  function stepFor(offsetM) { var n = -offsetM + 1; return n <= 12 ? 1 : n <= 24 ? 2 : n <= 36 ? 3 : 4; }

  function claim(o) {
    var liveOff = LIVE_AT[o.sup];
    var liveAt = o.liveAt !== undefined ? o.liveAt : (liveOff != null ? months(liveOff) : null);
    // months live, from whichever date we actually ended up with
    var liveMonths = liveAt ? Math.round((new Date(liveAt) - T) / 2592e6) : null;
    return {
      id: 'clm_' + o.sup, supplierId: 'sup_' + o.sup, sourcingAccountId: o.acc, state: o.state,
      sharingMode: o.mode || 'network', exclusivityUntil: o.exclusivityUntil || null,
      roles: roles(o.acc, liveAt || months(-6), o.held), bountyId: o.bounty || null,
      decayStep: liveMonths != null ? stepFor(liveMonths) : 1,
      qualityMultiplier: 1, // recomputed live by the service from the current score
      selfDealingDeclared: !!o.selfDealing,
      createdAt: months(o.created != null ? o.created : (liveOff != null ? liveOff - 2 : -3)),
      liveAt: liveAt, dormantAt: o.dormantAt || null, releasedAt: o.releasedAt || null,
      networkAt: o.networkAt !== undefined ? o.networkAt : liveAt,
      suspensionsLast12m: o.suspensions || 0,
      timeline: o.timeline || []
    };
  }

  var claims = [
    claim({ sup: 'riera', acc: 'acc_pm_gaditana', state: 'live', timeline: [
      ev(months(-10), 'created', 'Claim submitted', 'Gaditana Stays introduced Bodega Riera.', 'Gaditana Stays'),
      ev(months(-10), 'screened', 'Screening passed', 'No duplicate, no exclusion-list hit, profile 82% complete.'),
      ev(months(-9), 'confirmed', 'Supplier confirmed', 'Bodega Riera accepted the introduction within 6 days.', 'Bodega Riera'),
      ev(months(-8), 'live', 'Went live', 'Bookable across 31 properties in Cádiz coverage.')] }),
    claim({ sup: 'kayak', acc: 'acc_pm_gaditana', state: 'live', bounty: 'bty_cad_water', timeline: [
      ev(months(-7), 'created', 'Claim submitted against bounty', 'Filled the "Water activities on the bay" gap.', 'Gaditana Stays'),
      ev(months(-6), 'confirmed', 'Supplier confirmed', 'Caleta Náutica accepted in 3 days.', 'Kayak Caleta'),
      ev(months(-5), 'live', 'Went live', 'Bounty boost ×1.50 applied for 12 months.')] }),
    claim({ sup: 'lockers', acc: 'acc_pm_gaditana', state: 'live', timeline: [
      ev(months(-16), 'created', 'Claim submitted', 'Introduced by Gaditana Stays.', 'Gaditana Stays'),
      ev(months(-14), 'live', 'Went live', 'Storage coverage capped at 3 km.'),
      ev(months(-2), 'note', 'Decay step 2', 'Residual stepped from 100% to 80% at month 13.')] }),
    claim({ sup: 'chef', acc: 'acc_pm_gaditana', state: 'live', timeline: [
      ev(months(-42), 'created', 'Claim submitted', 'One of the first Cádiz introductions.', 'Gaditana Stays'),
      ev(months(-40), 'live', 'Went live', 'Now at the perpetual floor — 40% of the original rate.'),
      ev(months(-4), 'note', 'Decay floor reached', 'Month 37+ — rate holds at 40% for as long as the claim lives.')] }),
    claim({ sup: 'ceramics', acc: 'acc_pm_gaditana', state: 'live', mode: 'delayed',
      exclusivityUntil: date(23), networkAt: null, timeline: [
        ev(months(-6), 'created', 'Claim submitted', 'Delayed sharing chosen — 90-day exclusivity.', 'Gaditana Stays'),
        ev(months(-4), 'live', 'Went live (private)', 'Exclusive to Gaditana Stays until the window closes.'),
        ev(months(-4), 'mode_changed', 'Delayed mode set', '90-day exclusivity, then network with a ×1.15 boost for 12 months.')] }),
    claim({ sup: 'catedral', acc: 'acc_pm_gaditana', state: 'live', timeline: [
      ev(months(-20), 'created', 'Claim submitted', 'Introduced by Gaditana Stays.', 'Gaditana Stays'),
      ev(months(-18), 'live', 'Went live', 'Ticketing coverage capped at 25 km.')] }),
    // exclusivity already closed — this is the one showing an ACTIVE delayed boost
    claim({ sup: 'chiringuito', acc: 'acc_pm_gaditana', state: 'live', mode: 'delayed',
      exclusivityUntil: months(-2), networkAt: months(-2), timeline: [
        ev(months(-7), 'created', 'Claim submitted', 'Delayed sharing chosen — 60-day exclusivity.', 'Gaditana Stays'),
        ev(months(-5), 'live', 'Went live (private)', 'Exclusive to Gaditana Stays for the first 60 days.'),
        ev(months(-2), 'mode_changed', 'Opened to the network', 'Exclusivity closed. ×1.15 delayed-sharing boost runs for 12 months.')] }),
    claim({ sup: 'horse', acc: 'acc_pm_gaditana', state: 'watch', suspensions: 0, timeline: [
      ev(months(-13), 'created', 'Claim submitted', 'Introduced by Gaditana Stays.', 'Gaditana Stays'),
      ev(months(-11), 'live', 'Went live', 'Bookable across 25 km coverage.'),
      ev(months(-2), 'watch', 'Moved to watch', 'Score fell to 0.68 — confirm latency and cancellations both degraded.'),
      ev(months(-2), 'note', 'Remediation window open', 'Accrual reduced to the at-risk band until the score recovers.')] }),
    claim({ sup: 'pet', acc: 'acc_pm_gaditana', state: 'onboarding', bounty: 'bty_cad_pet', liveAt: null, created: -2, timeline: [
      ev(months(-2), 'created', 'Claim submitted', 'Against the Cádiz dog-daycare bounty.', 'Gaditana Stays'),
      ev(months(-2), 'screened', 'Screening passed', 'No exclusion hits.'),
      ev(months(-1), 'confirmed', 'Supplier confirmed', 'Bahía Mascotas accepted.', 'Guardería Canina Bahía'),
      ev(months(-1), 'onboarded', 'Onboarding started', '60 days to reach live or the activated role is released.')] }),
    claim({ sup: 'ebike', acc: 'acc_pm_gaditana', state: 'pending_supplier', liveAt: null, created: -1, timeline: [
      ev(months(-1), 'created', 'Claim submitted', 'Introduced by Gaditana Stays.', 'Gaditana Stays'),
      ev(months(-1), 'screened', 'Screening passed', 'Vehicle category — hard admin gate applies at approval.'),
      ev(date(-8), 'invited', 'Confirmation sent', 'Gadir E-Bikes has 30 days to confirm.')] }),
    claim({ sup: 'surf', acc: 'acc_pm_gaditana', state: 'screening', liveAt: null, created: 0, timeline: [
      ev(date(-3), 'created', 'Claim submitted', 'Against the surf-equipment bounty.', 'Gaditana Stays'),
      ev(date(-3), 'screened', 'In screening', 'Duplicate and exclusion checks running.')] }),
    claim({ sup: 'tapas', acc: 'acc_pm_gaditana', state: 'draft', liveAt: null, created: 0, timeline: [
      ev(date(-1), 'created', 'Draft started', 'Not yet submitted — coverage and sharing mode still to set.', 'Gaditana Stays')] }),
    claim({ sup: 'bikecad', acc: 'acc_host_marta', state: 'screening', selfDealing: true, liveAt: null, created: 0, timeline: [
      ev(date(-5), 'created', 'Claim submitted', 'Self-dealing declared — the host has a stake in this business.', 'Marta Ferrán'),
      ev(date(-5), 'flagged', 'Flagged for admin review', 'Declared interest requires a Chekin decision before it can go live.')] }),
    claim({ sup: 'quad', acc: 'acc_pm_gaditana', state: 'terminated', liveAt: months(-22), suspensions: 2, timeline: [
      ev(months(-24), 'created', 'Claim submitted', 'Introduced by Gaditana Stays.', 'Gaditana Stays'),
      ev(months(-22), 'live', 'Went live', 'Vehicle category — admin gated at approval.'),
      ev(months(-9), 'suspended', 'First suspension', 'Two guest safety complaints in one month.'),
      ev(months(-5), 'suspended', 'Second suspension', 'Repeat safety issue within 12 months.'),
      ev(months(-5), 'terminated', 'Claim voided', 'Two suspensions in 12 months voids the claim. The supplier record stays; only the claim ended.')] }),
    claim({ sup: 'museo', acc: 'acc_host_nuria', state: 'expired', liveAt: null, created: -4, timeline: [
      ev(months(-4), 'created', 'Claim submitted', 'Introduced by Nuria Belmonte.', 'Nuria Belmonte'),
      ev(months(-4), 'invited', 'Confirmation sent', '30 days to confirm.'),
      ev(months(-3), 'expired', 'Claim expired', 'Museo del Vino never confirmed. The supplier returned to the open pool — anyone may introduce them.')] }),
    // — Barcelona —
    claim({ sup: 'boat', acc: 'acc_pm_costa', state: 'live', timeline: [
      ev(months(-28), 'created', 'Claim submitted', 'Introduced by Costa Habitat.', 'Costa Habitat'),
      ev(months(-26), 'live', 'Went live', 'Bookable across Barcelona coverage.'),
      ev(months(-2), 'note', 'Decay step 3', 'Month 25+ — residual now at 60%.')] }),
    claim({ sup: 'transfer', acc: 'acc_pm_costa', state: 'live', timeline: [
      ev(months(-22), 'created', 'Claim submitted', 'Introduced by Costa Habitat.', 'Costa Habitat'),
      ev(months(-20), 'live', 'Went live', 'Transfer is a saturated category in Barcelona — reduced premium applies.')] }),
    claim({ sup: 'gastro', acc: 'acc_pm_costa', state: 'live', timeline: [
      ev(months(-3), 'created', 'Claim submitted', 'Introduced by Costa Habitat.', 'Costa Habitat'),
      ev(months(-1), 'live', 'Went live', 'Excellent quality band from the first month.')] }),
    claim({ sup: 'spa', acc: 'acc_pm_costa', state: 'live', timeline: [
      ev(months(-35), 'created', 'Claim submitted', 'Introduced by Costa Habitat.', 'Costa Habitat'),
      ev(months(-33), 'live', 'Went live', 'Now in decay step 3.')] }),
    claim({ sup: 'flamenco', acc: 'acc_host_marta', state: 'live', timeline: [
      ev(months(-5), 'created', 'Claim submitted', 'Introduced by Marta Ferrán.', 'Marta Ferrán'),
      ev(months(-3), 'live', 'Went live', 'Marta holds all three roles.')] }),
    claim({ sup: 'lockersbcn', acc: 'acc_host_marta', state: 'live', mode: 'private', networkAt: null, timeline: [
      ev(months(-11), 'created', 'Claim submitted', 'Private mode — serves Marta\'s properties only.', 'Marta Ferrán'),
      ev(months(-9), 'live', 'Went live (private)', 'No sourcing pool accrues in private mode.')] }),
    claim({ sup: 'kayakbcn', acc: 'acc_pm_costa', state: 'live', held: ['sourced', 'maintained'], timeline: [
      ev(months(-18), 'created', 'Claim submitted', 'Introduced by Costa Habitat.', 'Costa Habitat'),
      ev(months(-16), 'live', 'Went live', 'Chekin ops ran the onboarding.'),
      ev(months(-16), 'role_released', 'Activated role released', 'Onboarding was completed by Chekin, so the activated share does not sit with the sourcing host.')] }),
    claim({ sup: 'yoga', acc: 'acc_pm_costa', state: 'suspended', suspensions: 1, timeline: [
      ev(months(-15), 'created', 'Claim submitted', 'Introduced by Costa Habitat.', 'Costa Habitat'),
      ev(months(-13), 'live', 'Went live', 'Bookable across Barceloneta coverage.'),
      ev(months(-1), 'suspended', 'Claim suspended', 'Score fell below the quality floor. Accrual is zero while suspended — the supplier stays bookable and guests are unaffected.')] }),
    claim({ sup: 'celler', acc: 'acc_host_nuria', state: 'dormant', dormantAt: months(-4), timeline: [
      ev(months(-27), 'created', 'Claim submitted', 'Introduced by Nuria Belmonte.', 'Nuria Belmonte'),
      ev(months(-25), 'live', 'Went live', 'Bookable across Barcelona coverage.'),
      ev(months(-7), 'note', 'Sourcing host churned', 'Nuria Belmonte closed her Chekin account. 90-day grace started.'),
      ev(months(-4), 'dormant', 'Claim dormant', 'Grace elapsed. Accrual paused. 12-month window to reactivate by returning to Chekin.')] })
  ];
  // one fully released claim so the terminal state is visible in the fixtures
  claims.push((function () {
    var c = claim({ sup: 'ctr25', acc: 'acc_host_nuria', state: 'released', liveAt: months(-30), releasedAt: months(-1), timeline: [
      ev(months(-32), 'created', 'Claim submitted', 'Introduced by Nuria Belmonte.', 'Nuria Belmonte'),
      ev(months(-30), 'live', 'Went live', 'Bookable across Cádiz coverage.'),
      ev(months(-14), 'dormant', 'Claim dormant', 'Sourcing host churned; grace elapsed.'),
      ev(months(-1), 'released', 'Claim released', 'The 12-month reactivation window closed. The supplier is now unclaimed and open to anyone.')] });
    c.dormantAt = months(-14);
    // it entered through a host introduction, not the central catalogue
    sup('ctr25').origin = 'network';
    return c;
  })());

  // ---------- order lines ----------
  // Raw bookings. NetworkService.computeAccrual turns these into money — the
  // fixtures deliberately store no percentages and no euros of residual.
  var orderLines = [];
  var propsByDest = {};
  destinations.forEach(function (d) { propsByDest[d.id] = properties.filter(function (p) { return p.destinationId === d.id; }); });

  claims.forEach(function (c) {
    if (!c.liveAt) return;
    var s = suppliers.filter(function (x) { return x.id === c.supplierId; })[0];
    var pool = propsByDest[s.destinationId];
    var startM = Math.round((new Date(c.liveAt) - T) / 2592e6); // months back, negative
    var endM = c.state === 'terminated' || c.state === 'released' ? -5 : c.state === 'dormant' ? -4 : 0;
    var firstM = Math.max(startM, -18);
    for (var m = firstM; m <= endM; m++) {
      var seed = c.id + 'm' + m;
      // volume rises a little with score; each line is one booking for a party
      var vol = 2 + Math.floor(rnd(seed + 'v') * 2 + (s.score > 0.88 ? 1 : 0));
      if (c.state === 'suspended' && m > -1) vol = 0;
      for (var k = 0; k < vol; k++) {
        var ls = seed + 'l' + k;
        var prop = pool[h(ls) % pool.length];
        var d0 = new Date(T); d0.setMonth(d0.getMonth() + m); d0.setDate(1 + (h(ls + 'd') % 26));
        orderLines.push({
          id: 'orl_' + c.id.slice(4) + '_' + (m + 24) + '_' + k,
          claimId: c.id, supplierId: s.id, servingPropertyId: prop.id,
          // party size 2–8 × a small price spread
          gmv: Math.round(s.priceFrom * (2 + Math.floor(rnd(ls + 'q') * 7)) * (0.9 + rnd(ls + 'f') * 0.35)),
          date: d0.toISOString().slice(0, 10)
        });
      }
    }
  });

  // ---------- activity feed ----------
  var activity = [];
  claims.forEach(function (c) {
    c.timeline.forEach(function (e) {
      activity.push({ at: e.at, claimId: c.id, supplierId: c.supplierId, accountId: c.sourcingAccountId, kind: e.kind, title: e.title, detail: e.detail });
    });
  });
  activity.sort(function (a, b) { return a.at < b.at ? 1 : -1; });

  window.LN_DATA = {
    today: TODAY, currency: CUR,
    destinations: destinations, accounts: accounts, properties: properties,
    suppliers: suppliers, claims: claims, bounties: bounties,
    orderLines: orderLines, activity: activity,
    // persona → the account whose lens that persona looks through
    personaAccounts: { host: 'acc_host_marta', pm: 'acc_pm_gaditana', supplier: 'acc_sup_riera', chekin: null, admin: null },
    supplierAccountSupplierId: 'sup_riera'
  };
})();
