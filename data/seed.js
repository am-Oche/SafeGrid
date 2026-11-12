/* ─────────────────────────────────────────────────────────────
   data/seed.js — DEMO DATA. Every name, plate and number here is
   a placeholder. Times are minute offsets from "now" and are
   resolved to absolute timestamps when the store is seeded.
   ───────────────────────────────────────────────────────────── */
(function () {
  const corridors = [
    {
      id: 'LAG-IBD', name: 'Lagos–Ibadan', from: 'Lagos (Ojota)', to: 'Ibadan', km: 128, color: '#6A3DF5',
      path: [[6.5856,3.3830],[6.6420,3.3700],[6.7350,3.4100],[6.8050,3.4380],[6.8800,3.4900],[6.9580,3.5480],[7.0700,3.6600],[7.1800,3.7800],[7.2950,3.8650],[7.3780,3.9300]],
      checkpoints: [
        { id: 'cp-berger',  name: 'Berger',               type: 'checkpoint', at: 0.05 },
        { id: 'cp-mowe',    name: 'Mowe / Ibafo',         type: 'checkpoint', at: 0.24 },
        { id: 'cp-ogere',   name: 'Ogere rest stop',      type: 'rest',       at: 0.47 },
        { id: 'cp-ibtoll',  name: 'Ibadan toll gate',     type: 'toll',       at: 0.88 },
        { id: 'cp-ibadan',  name: 'Ibadan (Ojoo depot)',  type: 'checkpoint', at: 1.0 },
      ],
    },
    {
      id: 'ABJ-KAD', name: 'Abuja–Kaduna', from: 'Abuja (Zuba)', to: 'Kaduna', km: 185, color: '#0E0E12',
      path: [[9.0579,7.4951],[9.0900,7.3300],[9.1060,7.2180],[9.2600,7.2400],[9.4000,7.2700],[9.5500,7.3000],[9.7200,7.3600],[9.8800,7.4000],[10.0300,7.4300],[10.2500,7.4400],[10.5200,7.4400]],
      checkpoints: [
        { id: 'cp-zuba',    name: 'Zuba interchange',     type: 'checkpoint', at: 0.12 },
        { id: 'cp-jere',    name: 'Jere',                 type: 'checkpoint', at: 0.42 },
        { id: 'cp-katari',  name: 'Katari',               type: 'checkpoint', at: 0.64 },
        { id: 'cp-rijana',  name: 'Rijana',               type: 'rest',       at: 0.74 },
        { id: 'cp-kaduna',  name: 'Kaduna (Kakuri depot)',type: 'checkpoint', at: 1.0 },
      ],
    },
    {
      id: 'LAG-BEN', name: 'Lagos–Benin', from: 'Lagos (Ojota)', to: 'Benin City', km: 318, color: '#6B6B78',
      path: [[6.5856,3.3830],[6.6420,3.3700],[6.7350,3.4100],[6.8400,3.6400],[6.8200,3.9200],[6.7900,4.4000],[6.7500,4.8800],[6.7200,5.2000],[6.5500,5.4300],[6.3350,5.6270]],
      checkpoints: [
        { id: 'cp-sagamu',  name: 'Sagamu interchange',   type: 'toll',       at: 0.16 },
        { id: 'cp-ijebu',   name: 'Ijebu-Ode',            type: 'checkpoint', at: 0.28 },
        { id: 'cp-ore',     name: 'Ore junction',         type: 'rest',       at: 0.58 },
        { id: 'cp-okada',   name: 'Ofosu / Okada axis',   type: 'checkpoint', at: 0.78 },
        { id: 'cp-benin',   name: 'Benin (Ugbowo depot)', type: 'checkpoint', at: 1.0 },
      ],
    },
  ];

  const drivers = [
    { id: 'd1',  name: 'Emeka Okafor',        phone: '+234 803 000 0101', licence: 'LAG-DL-58812', years: 11, langs: ['English','Pidgin','Igbo'],  trips: 412, checkInRate: 97, status: 'on_trip' },
    { id: 'd2',  name: 'Ibrahim Musa',        phone: '+234 806 000 0102', licence: 'ABJ-DL-30417', years: 8,  langs: ['English','Hausa'],          trips: 286, checkInRate: 94, status: 'on_trip' },
    { id: 'd3',  name: 'Adebayo Tunde',       phone: '+234 802 000 0103', licence: 'OYO-DL-11280', years: 6,  langs: ['English','Yoruba','Pidgin'], trips: 198, checkInRate: 91, status: 'on_trip' },
    { id: 'd4',  name: 'Chinedu Eze',         phone: '+234 809 000 0104', licence: 'LAG-DL-77031', years: 14, langs: ['English','Igbo','Pidgin'],   trips: 530, checkInRate: 98, status: 'on_trip' },
    { id: 'd5',  name: 'Musa Abdullahi',      phone: '+234 807 000 0105', licence: 'KAD-DL-44120', years: 9,  langs: ['English','Hausa'],          trips: 301, checkInRate: 88, status: 'on_trip' },
    { id: 'd6',  name: 'Tunde Bakare',        phone: '+234 805 000 0106', licence: 'OGN-DL-20955', years: 4,  langs: ['English','Yoruba'],         trips: 121, checkInRate: 86, status: 'on_trip' },
    { id: 'd7',  name: 'Yusuf Garba',         phone: '+234 803 000 0107', licence: 'ABJ-DL-61302', years: 12, langs: ['English','Hausa','Pidgin'],  trips: 455, checkInRate: 96, status: 'available' },
    { id: 'd8',  name: 'Oluwaseun Adeyemi',   phone: '+234 816 000 0108', licence: 'LAG-DL-90414', years: 5,  langs: ['English','Yoruba'],         trips: 143, checkInRate: 93, status: 'available' },
    { id: 'd9',  name: 'Kelechi Nwosu',       phone: '+234 813 000 0109', licence: 'EDO-DL-15567', years: 7,  langs: ['English','Igbo','Pidgin'],   trips: 239, checkInRate: 90, status: 'on_trip' },
    { id: 'd10', name: 'Samuel Okon',         phone: '+234 810 000 0110', licence: 'LAG-DL-33018', years: 3,  langs: ['English','Pidgin'],         trips: 74,  checkInRate: 84, status: 'off_duty' },
  ];

  const vehicles = [
    { id: 'v1',  plate: 'KJA-412-XA', type: 'Tanker · 33,000 L',  make: 'MAN TGS 33.400',      year: 2019, status: 'on_trip',     driverId: 'd1',  health: 86, fuel: 62, odometer: 284310, serviceDueKm: 6200,  lastCheckInMin: -12 },
    { id: 'v2',  plate: 'KUJ-118-AB', type: 'Flatbed · 40 ft',    make: 'Mack Granite',        year: 2018, status: 'on_trip',     driverId: 'd2',  health: 74, fuel: 48, odometer: 341980, serviceDueKm: 1450,  lastCheckInMin: -38 },
    { id: 'v3',  plate: 'APP-302-EK', type: 'Box truck · 20 t',   make: 'Iveco Trakker',       year: 2020, status: 'on_trip',     driverId: 'd3',  health: 91, fuel: 71, odometer: 158220, serviceDueKm: 9800,  lastCheckInMin: -54 },
    { id: 'v4',  plate: 'LSR-883-AA', type: 'Tanker · 45,000 L',  make: 'Mercedes Actros',     year: 2021, status: 'on_trip',     driverId: 'd4',  health: 94, fuel: 55, odometer: 121040, serviceDueKm: 11200, lastCheckInMin: -7  },
    { id: 'v5',  plate: 'KRD-561-KD', type: 'Tipper · 30 t',      make: 'Sinotruk Howo',       year: 2017, status: 'on_trip',     driverId: 'd5',  health: 63, fuel: 33, odometer: 402770, serviceDueKm: 300,   lastCheckInMin: -22 },
    { id: 'v6',  plate: 'SMK-915-JT', type: 'Box truck · 15 t',   make: 'DAF CF',              year: 2019, status: 'on_trip',     driverId: 'd6',  health: 82, fuel: 59, odometer: 211450, serviceDueKm: 4100,  lastCheckInMin: -71 },
    { id: 'v7',  plate: 'GWA-640-FC', type: 'Flatbed · 40 ft',    make: 'MAN TGS 26.440',      year: 2020, status: 'idle',        driverId: 'd7',  health: 88, fuel: 92, odometer: 176300, serviceDueKm: 7600,  lastCheckInMin: -190 },
    { id: 'v8',  plate: 'EPE-509-LG', type: 'Reefer · 15 t',      make: 'Mercedes Atego',      year: 2022, status: 'idle',        driverId: 'd8',  health: 97, fuel: 88, odometer: 64110,  serviceDueKm: 14800, lastCheckInMin: -260 },
    { id: 'v9',  plate: 'BEN-247-ED', type: 'Tanker · 33,000 L',  make: 'Sinotruk Howo',       year: 2018, status: 'on_trip',     driverId: 'd9',  health: 69, fuel: 41, odometer: 366510, serviceDueKm: 2100,  lastCheckInMin: -31 },
    { id: 'v10', plate: 'IKD-736-LA', type: 'Box truck · 20 t',   make: 'Iveco Eurocargo',     year: 2016, status: 'maintenance', driverId: null,  health: 41, fuel: 18, odometer: 498020, serviceDueKm: -850,  lastCheckInMin: -1440 },
    { id: 'v11', plate: 'FKJ-774-BN', type: 'Tipper · 30 t',      make: 'Mack Granite',        year: 2017, status: 'offline',     driverId: 'd10', health: 58, fuel: 22, odometer: 433870, serviceDueKm: 900,   lastCheckInMin: -620 },
    { id: 'v12', plate: 'ABJ-221-KD', type: 'Flatbed · 40 ft',    make: 'DAF XF 480',          year: 2021, status: 'on_trip',     driverId: 'd1',  health: 90, fuel: 66, odometer: 98400,   serviceDueKm: 10400, lastCheckInMin: -12, convoyOf: 'TRP-24117' },
  ];
  // v12 rides in convoy with v1 under one briefing; driver shown is the convoy lead.
  vehicles[11].driverId = null;

  // trips: progress 0..1 along corridor; departMin/etaMin = offsets from now
  const trips = [
    { id: 'TRP-24117', corridorId: 'LAG-IBD', vehicleIds: ['v1','v12'], driverId: 'd1', cargo: 'AGO diesel + steel coils', origin: 'Apapa depot', destination: 'Ojoo depot, Ibadan', departMin: -95,  etaMin: 55,  progress: 0.58, speed: 54, status: 'on_route', convoy: true,
      briefing: { id: 'BRF-8841', status: 'Acknowledged', sentMin: -110, ackMin: -101, incidentIds: ['INC-3107','INC-3112'] },
      checkIns: [{ min: -92, cp: 'Berger', kind: 'manual' }, { min: -61, cp: 'Mowe / Ibafo', kind: 'manual' }, { min: -12, cp: 'Ogere rest stop', kind: 'manual' }] },
    { id: 'TRP-24118', corridorId: 'ABJ-KAD', vehicleIds: ['v2'], driverId: 'd2', cargo: 'Cement · 600 bags', origin: 'Zuba yard', destination: 'Kakuri depot, Kaduna', departMin: -140, etaMin: 70,  progress: 0.52, speed: 0,  status: 'on_route',
      briefing: { id: 'BRF-8842', status: 'Acknowledged', sentMin: -160, ackMin: -150, incidentIds: ['INC-3101','INC-3109'] },
      checkIns: [{ min: -128, cp: 'Zuba interchange', kind: 'manual' }, { min: -38, cp: 'Jere', kind: 'manual' }] },
    { id: 'TRP-24119', corridorId: 'LAG-BEN', vehicleIds: ['v3'], driverId: 'd3', cargo: 'FMCG · 14 pallets', origin: 'Ikeja DC', destination: 'Ugbowo depot, Benin', departMin: -210, etaMin: 190, progress: 0.42, speed: 61, status: 'on_route',
      briefing: { id: 'BRF-8843', status: 'Acknowledged', sentMin: -230, ackMin: -222, incidentIds: ['INC-3104','INC-3110'] },
      checkIns: [{ min: -186, cp: 'Sagamu interchange', kind: 'manual' }, { min: -140, cp: 'Ijebu-Ode', kind: 'auto' }] },
    { id: 'TRP-24120', corridorId: 'LAG-IBD', vehicleIds: ['v4'], driverId: 'd4', cargo: 'PMS petrol · 45,000 L', origin: 'Apapa depot', destination: 'Ojoo depot, Ibadan', departMin: -40,  etaMin: 105, progress: 0.22, speed: 48, status: 'on_route',
      briefing: { id: 'BRF-8844', status: 'Acknowledged', sentMin: -55, ackMin: -48, incidentIds: ['INC-3107'] },
      checkIns: [{ min: -34, cp: 'Berger', kind: 'manual' }, { min: -7, cp: 'Mowe / Ibafo', kind: 'auto' }] },
    { id: 'TRP-24121', corridorId: 'ABJ-KAD', vehicleIds: ['v5'], driverId: 'd5', cargo: 'Granite chippings · 30 t', origin: 'Zuba quarry', destination: 'Kaduna site', departMin: -75,  etaMin: 120, progress: 0.26, speed: 43, status: 'on_route',
      briefing: { id: 'BRF-8845', status: 'Acknowledged', sentMin: -90, ackMin: -82, incidentIds: ['INC-3101'] },
      checkIns: [{ min: -66, cp: 'Zuba interchange', kind: 'manual' }, { min: -22, cp: 'Zuba interchange', kind: 'auto', note: 'Slow traffic past Gauraka' }] },
    { id: 'TRP-24122', corridorId: 'LAG-BEN', vehicleIds: ['v6'], driverId: 'd6', cargo: 'Beverages · 1,200 cases', origin: 'Agbara plant', destination: 'Ugbowo depot, Benin', departMin: -260, etaMin: 150, progress: 0.55, speed: 0,  status: 'on_route',
      briefing: { id: 'BRF-8846', status: 'Acknowledged', sentMin: -280, ackMin: -270, incidentIds: ['INC-3104','INC-3110'] },
      checkIns: [{ min: -230, cp: 'Sagamu interchange', kind: 'manual' }, { min: -150, cp: 'Ijebu-Ode', kind: 'manual' }, { min: -71, cp: 'Ijebu-Ode', kind: 'auto', note: 'Stopped, queue at fuel station' }] },
    { id: 'TRP-24123', corridorId: 'LAG-BEN', vehicleIds: ['v9'], driverId: 'd9', cargo: 'AGO diesel · 33,000 L', origin: 'Apapa depot', destination: 'Ugbowo depot, Benin', departMin: -30,  etaMin: 330, progress: 0.09, speed: 39, status: 'on_route',
      briefing: { id: 'BRF-8847', status: 'Sent', sentMin: -45, ackMin: null, incidentIds: ['INC-3104','INC-3110','INC-3113'] },
      checkIns: [{ min: -31, cp: 'Ojota gate', kind: 'manual' }] },
    { id: 'TRP-24124', corridorId: 'ABJ-KAD', vehicleIds: ['v7'], driverId: 'd7', cargo: 'Steel rods · 28 t', origin: 'Zuba yard', destination: 'Kakuri depot, Kaduna', departMin: 50,   etaMin: 260, progress: 0,    speed: 0,  status: 'scheduled',
      briefing: { id: 'BRF-8848', status: 'Draft', sentMin: null, ackMin: null, incidentIds: ['INC-3101','INC-3109'] },
      checkIns: [] },
    { id: 'TRP-24125', corridorId: 'LAG-IBD', vehicleIds: ['v8'], driverId: 'd8', cargo: 'Frozen fish · 12 t (reefer)', origin: 'Ikeja DC', destination: 'Ojoo depot, Ibadan', departMin: 120, etaMin: 270, progress: 0, speed: 0, status: 'scheduled',
      briefing: { id: 'BRF-8849', status: 'Draft', sentMin: null, ackMin: null, incidentIds: ['INC-3107','INC-3112'] },
      checkIns: [] },
    { id: 'TRP-24109', corridorId: 'LAG-IBD', vehicleIds: ['v4'], driverId: 'd4', cargo: 'PMS petrol · 45,000 L', origin: 'Apapa depot', destination: 'Ojoo depot, Ibadan', departMin: -520, etaMin: -330, progress: 1, speed: 0, status: 'completed',
      briefing: { id: 'BRF-8830', status: 'Acknowledged', sentMin: -540, ackMin: -532, incidentIds: [] },
      checkIns: [{ min: -510, cp: 'Berger', kind: 'manual' }, { min: -440, cp: 'Ogere rest stop', kind: 'manual' }, { min: -335, cp: 'Ibadan (Ojoo depot)', kind: 'manual' }] },
    { id: 'TRP-24104', corridorId: 'ABJ-KAD', vehicleIds: ['v7'], driverId: 'd7', cargo: 'Cement · 600 bags', origin: 'Zuba yard', destination: 'Kakuri depot, Kaduna', departMin: -600, etaMin: -380, progress: 1, speed: 0, status: 'completed',
      briefing: { id: 'BRF-8826', status: 'Expired', sentMin: -640, ackMin: null, incidentIds: ['INC-3101'] },
      checkIns: [{ min: -590, cp: 'Zuba interchange', kind: 'manual' }, { min: -385, cp: 'Kaduna (Kakuri depot)', kind: 'manual' }] },
  ];

  // incidents: at = fraction along the corridor
  const incidents = [
    { id: 'INC-3101', corridorId: 'ABJ-KAD', at: 0.60, category: 'Kidnapping risk',         severity: 'critical', status: 'verified', source: 'Verified by SafeGrid', location: 'Katari–Rijana stretch',   reportedMin: -310, verifiedMin: -260, reports: 4, description: 'Multiple reports of armed men stopping vehicles at dusk. Convoy travel and daylight-only movement advised.' },
    { id: 'INC-3104', corridorId: 'LAG-BEN', at: 0.60, category: 'Crash / obstruction',     severity: 'high',     status: 'verified', source: 'Vetted source',        location: 'Ore junction, eastbound',  reportedMin: -95,  verifiedMin: -70,  reports: 3, description: 'Articulated truck overturned across two lanes. Single-lane passage with 40–60 min delay.' },
    { id: 'INC-3107', corridorId: 'LAG-IBD', at: 0.62, category: 'Robbery / armed attack',  severity: 'high',     status: 'verified', source: 'Verified by SafeGrid', location: 'Ogere–Ogunmakin, km 64',   reportedMin: -180, verifiedMin: -140, reports: 2, description: 'Attempted robbery on stationary trucks overnight. Avoid unscheduled stops between Ogere and Ogunmakin.' },
    { id: 'INC-3109', corridorId: 'ABJ-KAD', at: 0.38, category: 'Police checkpoint delay', severity: 'medium',   status: 'verified', source: 'Driver report',        location: 'Jere checkpoint',          reportedMin: -65,  verifiedMin: -40,  reports: 5, description: 'Extended document checks. Average 25 min wait for heavy goods vehicles.' },
    { id: 'INC-3110', corridorId: 'LAG-BEN', at: 0.80, category: 'Bad road / potholes',     severity: 'medium',   status: 'verified', source: 'Vetted source',        location: 'Ofosu–Okada, km 248',      reportedMin: -1400, verifiedMin: -1300, reports: 6, description: 'Deep failed sections in both lanes. Reduce speed; tankers advised under 40 km/h.' },
    { id: 'INC-3112', corridorId: 'LAG-IBD', at: 0.86, category: 'Road works',              severity: 'low',      status: 'verified', source: 'Vetted source',        location: 'Before Ibadan toll gate',  reportedMin: -2000, verifiedMin: -1900, reports: 1, description: 'Lane closure for resurfacing, 07:00–17:00. Expect 10–15 min.' },
    { id: 'INC-3113', corridorId: 'LAG-BEN', at: 0.30, category: 'Protest / roadblock',     severity: 'high',     status: 'pending',  source: 'Driver report',        location: 'Ijebu-Ode bypass',         reportedMin: -18,  verifiedMin: null, reports: 1, description: 'Driver reports youths blocking the bypass. Awaiting second source.' },
    { id: 'INC-3114', corridorId: 'LAG-IBD', at: 0.30, category: 'Crash / obstruction',     severity: 'medium',   status: 'pending',  source: 'Driver report',        location: 'Mowe, Lagos-bound',        reportedMin: -9,   verifiedMin: null, reports: 1, description: 'Minor collision, one lane blocked. Traffic building.' },
    { id: 'INC-3115', corridorId: 'ABJ-KAD', at: 0.15, category: 'Fuel scarcity queue',     severity: 'low',      status: 'pending',  source: 'Driver report',        location: 'Zuba filling stations',    reportedMin: -27,  verifiedMin: null, reports: 2, description: 'Queues spilling onto the service lane near Zuba.' },
    { id: 'INC-3099', corridorId: 'LAG-IBD', at: 0.40, category: 'Flooding',                severity: 'medium',   status: 'expired',  source: 'Vetted source',        location: 'Long Bridge approach',     reportedMin: -4300, verifiedMin: -4200, reports: 3, description: 'Water receded. Road open.' },
    { id: 'INC-3098', corridorId: 'ABJ-KAD', at: 0.50, category: 'Robbery / armed attack',  severity: 'high',     status: 'rejected', source: 'Driver report',        location: 'Jere–Katari',              reportedMin: -3000, verifiedMin: -2900, reports: 1, description: 'Could not be corroborated; duplicate of an older report.' },
  ];

  const recipients = [
    { id: 'r1', name: 'Apex Control Desk',      role: 'Control room (24/7)',  channel: 'SMS',       number: '+234 800 000 0001' },
    { id: 'r2', name: 'Ngozi Adebayo',          role: 'Operations manager',   channel: 'WhatsApp',  number: '+234 803 000 0002' },
    { id: 'r3', name: 'Danjuma Bello',          role: 'Fleet security lead',  channel: 'Voice call',number: '+234 806 000 0003' },
    { id: 'r4', name: 'SafeGrid Duty Desk',     role: 'Platform escalation',  channel: 'SMS',       number: '+234 800 000 0004' },
  ];

  const sos = [
    { id: 'SOS-0412', tripId: 'TRP-24118', driverId: 'd2', vehicleId: 'v2', corridorId: 'ABJ-KAD', at: 0.52, min: -16, status: 'open',
      delivery: [{ r: 'r1', s: 'Delivered' }, { r: 'r2', s: 'Delivered' }, { r: 'r3', s: 'Failed' }, { r: 'r4', s: 'Delivered' }], note: '' },
    { id: 'SOS-0409', tripId: 'TRP-24104', driverId: 'd7', vehicleId: 'v7', corridorId: 'ABJ-KAD', at: 0.44, min: -1900, status: 'resolved',
      delivery: [{ r: 'r1', s: 'Delivered' }, { r: 'r2', s: 'Delivered' }, { r: 'r3', s: 'Delivered' }, { r: 'r4', s: 'Delivered' }], note: 'Tyre blow-out near Jere. Driver safe, recovery truck dispatched.', resolvedBy: 'Ngozi Adebayo', resolvedMin: -1840 },
    { id: 'SOS-0405', tripId: 'TRP-24109', driverId: 'd4', vehicleId: 'v4', corridorId: 'LAG-IBD', at: 0.50, min: -5200, status: 'resolved',
      delivery: [{ r: 'r1', s: 'Delivered' }, { r: 'r2', s: 'Failed' }, { r: 'r3', s: 'Delivered' }, { r: 'r4', s: 'Delivered' }], note: 'Accidental press confirmed by call-back.', resolvedBy: 'Control desk', resolvedMin: -5190 },
  ];

  const handover = [
    { id: 'h1', author: 'Ngozi Adebayo', role: 'Night dispatcher', min: -420, text: 'KUJ-118-AB had a slow Jere checkpoint last night. Keep Abuja–Kaduna departures before 15:00. Ore crash still unconfirmed at 05:30, re-check before releasing Benin loads.' },
  ];

  const approvals = [
    { id: 'ap1', kind: 'briefing', title: 'Hold TRP-24124 until 06:00 tomorrow', body: 'Departure at 15:40 puts the Katari–Rijana stretch after dusk. Verified kidnapping risk there (INC-3101).', impact: 'Avoids dusk on a critical stretch', target: 'TRP-24124', status: 'pending' },
    { id: 'ap2', kind: 'service',  title: 'Book service for KRD-561-KD after this trip', body: 'Service due in 300 km and health 63. The trip to Kaduna is 185 km, so it will be due on the return leg.', impact: 'Avoids a roadside stop on return', target: 'v5', status: 'pending' },
    { id: 'ap3', kind: 'checkin',  title: 'Call Tunde Bakare (SMK-915-JT)', body: 'No check-in for 71 min, above the 45 min rule. Last auto check-in shows the truck stopped near Ijebu-Ode.', impact: 'Confirms driver status', target: 'TRP-24122', status: 'pending' },
  ];

  const history = {
    activeVehicles:    [7, 8, 8, 9, 8, 9, 9, 9],
    tripsOnRoute:      [5, 6, 6, 7, 6, 7, 7, 7],
    corridorIncidents: [9, 8, 10, 8, 9, 7, 8, 9],
    sosOpen:           [0, 1, 0, 0, 2, 0, 0, 1],
  };

  const orgs = [
    { id: 'o1', name: 'Apex Logistics Ltd', plan: 'Pilot', vehicles: 12, corridors: 3, since: 'Aug 2026', status: 'active' },
  ];

  window.SG_SEED = { corridors, drivers, vehicles, trips, incidents, recipients, sos, handover, approvals, history, orgs };
})();
