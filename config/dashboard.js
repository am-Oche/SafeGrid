/* ─────────────────────────────────────────────────────────────
   config/dashboard.js — KPI cards and Overview section order.
   `metric` keys are computed in src/core.js → SG.metrics().
   `sub` supports {tokens} filled from the same metrics object.
   ───────────────────────────────────────────────────────────── */
window.SG_DASH = {
  kpis: [
    { id: 'activeVehicles',    label: 'Active vehicles',     metric: 'activeVehicles',    sub: 'of {fleetSize} in fleet',            good: 'up',   history: 'activeVehicles' },
    { id: 'tripsOnRoute',      label: 'Trips on route',      metric: 'tripsOnRoute',      sub: '{lateCheckins} late check-in',       good: 'up',   history: 'tripsOnRoute' },
    { id: 'corridorIncidents', label: 'Corridor incidents',  metric: 'corridorIncidents', sub: '{pendingIncidents} pending verification', good: 'down', history: 'corridorIncidents' },
    { id: 'sosOpen',           label: 'Control room SOS',    metric: 'sosOpen',           sub: '{sosWeek} resolved this week',       good: 'down', history: 'sosOpen' },
  ],
  overviewSections: ['brief', 'kpis', 'trips', 'alerts', 'exceptions', 'handover'],
  missedCheckInDefault: 45, // minutes
};
