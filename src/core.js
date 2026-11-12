/* ─────────────────────────────────────────────────────────────
   src/core.js — the in-browser "backend":
   • store (persisted to localStorage, Zustand-style API)
   • time helpers (WAT), geometry helpers
   • derived metrics / alerts / exceptions
   • mock service layer with latency + offline queue
   • simulation loop (vehicles move, check-ins, new reports)
   Nothing here talks to a server. Swap SG.api.* for fetch() later.
   ───────────────────────────────────────────────────────────── */
(function () {
  const SG = (window.SG = window.SG || {});
  const KEY = 'safegrid.demo.v1';
  const MIN = 60000;

  /* ── time ─────────────────────────────────────────── */
  const tz = (window.SG_BRAND && SG_BRAND.timezone) || 'Africa/Lagos';
  const fT = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  const fD = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' });
  const fDS = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: 'short' });
  const fH = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hour12: false });
  const fS = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  SG.time = {
    t: (ms) => (ms == null ? '—' : fT.format(ms)),
    ts: (ms) => fS.format(ms),
    wat: (ms) => fT.format(ms) + ' WAT',
    day: (ms) => fD.format(ms),
    dshort: (ms) => fDS.format(ms),
    hour: (ms) => +fH.format(ms) % 24,
    rel(ms, now = Date.now()) {
      if (ms == null) return '—';
      const d = Math.round((ms - now) / MIN);
      const a = Math.abs(d);
      let s;
      if (a < 1) return 'just now';
      if (a < 60) s = a + ' min';
      else if (a < 1440) { const h = Math.floor(a / 60), m = a % 60; s = h + 'h' + (m ? ' ' + m + 'm' : ''); }
      else s = Math.round(a / 1440) + 'd';
      return d < 0 ? s + ' ago' : 'in ' + s;
    },
    mins: (ms, now = Date.now()) => Math.round((now - ms) / MIN),
    greet(ms = Date.now()) { const h = SG.time.hour(ms); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; },
  };

  /* ── geometry ─────────────────────────────────────── */
  function hav(a, b) {
    const R = 6371, r = Math.PI / 180;
    const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const cumCache = {};
  function cum(c) {
    if (cumCache[c.id]) return cumCache[c.id];
    const out = [0];
    for (let i = 1; i < c.path.length; i++) out.push(out[i - 1] + hav(c.path[i - 1], c.path[i]));
    return (cumCache[c.id] = out);
  }
  SG.geo = {
    pointAt(c, f) {
      const cs = cum(c), total = cs[cs.length - 1], d = Math.max(0, Math.min(1, f)) * total;
      let i = 1; while (i < cs.length - 1 && cs[i] < d) i++;
      const seg = cs[i] - cs[i - 1] || 1, t = (d - cs[i - 1]) / seg;
      const a = c.path[i - 1], b = c.path[i];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    },
    // project a corridor into a w×h box (for mini route drawings)
    project(c, w, h, pad = 10) {
      const lats = c.path.map((p) => p[0]), lons = c.path.map((p) => p[1]);
      const minLa = Math.min(...lats), maxLa = Math.max(...lats), minLo = Math.min(...lons), maxLo = Math.max(...lons);
      const sx = (w - pad * 2) / (maxLo - minLo || 1), sy = (h - pad * 2) / (maxLa - minLa || 1), s = Math.min(sx, sy);
      const ox = (w - (maxLo - minLo) * s) / 2, oy = (h - (maxLa - minLa) * s) / 2;
      return (p) => [ox + (p[1] - minLo) * s, h - (oy + (p[0] - minLa) * s)];
    },
  };

  /* ── seeding / persistence ────────────────────────── */
  function resolveSeed() {
    const S = JSON.parse(JSON.stringify(window.SG_SEED));
    const now = Date.now();
    const at = (m) => (m == null ? null : now + m * MIN);
    S.trips.forEach((t) => {
      t.departAt = at(t.departMin); t.etaAt = at(t.etaMin); delete t.departMin; delete t.etaMin;
      const b = t.briefing; b.sentAt = at(b.sentMin); b.ackAt = at(b.ackMin); delete b.sentMin; delete b.ackMin;
      t.checkIns = t.checkIns.map((c) => ({ at: at(c.min), cp: c.cp, kind: c.kind, note: c.note || '' }));
      t.passed = (window.SG_SEED.corridors.find((c) => c.id === t.corridorId).checkpoints || []).filter((cp) => cp.at <= t.progress).map((cp) => cp.id);
    });
    S.vehicles.forEach((v) => { v.lastCheckInAt = at(v.lastCheckInMin); delete v.lastCheckInMin; });
    S.incidents.forEach((i) => { i.reportedAt = at(i.reportedMin); i.verifiedAt = at(i.verifiedMin); delete i.reportedMin; delete i.verifiedMin; });
    S.sos.forEach((s) => { s.atTime = at(s.min); s.resolvedAt = at(s.resolvedMin); delete s.min; delete s.resolvedMin; });
    S.handover.forEach((h) => { h.at = at(h.min); delete h.min; });
    S.approvals.forEach((a) => { a.at = now - 6 * MIN; });
    S.acks = {};       // incidentId -> {at, by}
    S.alertSeen = {};  // incidentId -> first seen
    return S;
  }
  function freshState() {
    return {
      v: 1,
      seededAt: Date.now(),
      session: null,
      ui: { theme: 'light', collapsed: false, hc: false, lang: 'en', sound: false, sosSeen: [] },
      dev: { latency: 'normal' },
      settings: { missedCheckInMin: (window.SG_DASH && SG_DASH.missedCheckInDefault) || 45, emergencyNumber: SG_BRAND.emergencyNumber },
      data: resolveSeed(),
      notifications: [],
      log: [],
      queue: [],
      audit: [],
      sim: { spawned: 0, lastSpawn: Date.now() },
    };
  }
  // shift every numeric "*At"/"at"/"atTime" timestamp by delta (keeps demo data fresh across days)
  function shiftTimes(o, d) {
    if (Array.isArray(o)) { o.forEach((x) => shiftTimes(x, d)); return; }
    if (o && typeof o === 'object') {
      for (const k in o) {
        const v = o[k];
        if (typeof v === 'number' && (/At$/.test(k) || k === 'at' || k === 'atTime' || k === 't') && v > 1e12) o[k] = v + d;
        else if (v && typeof v === 'object') shiftTimes(v, d);
      }
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshState();
      const s = JSON.parse(raw);
      if (s.v !== 1) return freshState();
      // simulation is paused while the tab is closed: rebase time so the scene picks up where it was left
      const gap = Date.now() - (s.savedAt || Date.now());
      if (gap > 2 * MIN) { shiftTimes(s.data, gap); shiftTimes(s.notifications, gap); s.sim.lastSpawn = Date.now(); }
      return s;
    } catch (e) { return freshState(); }
  }

  /* ── store ────────────────────────────────────────── */
  let state = load();
  const subs = new Set();
  let saveT = null;
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { state.savedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }, 400);
  }
  const store = {
    get: () => state,
    set(fn) {
      const next = structuredClone(state);
      const r = fn(next);
      state = r || next;
      persist();
      subs.forEach((f) => f());
    },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    reset(keepSession = true) {
      const s = freshState();
      if (keepSession) { s.session = state.session; s.ui = { ...state.ui, sosSeen: [] }; }
      state = s; persist(); subs.forEach((f) => f());
    },
  };
  SG.store = store;
  window.addEventListener('beforeunload', () => { try { state.savedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} });

  /* ── lookups ──────────────────────────────────────── */
  SG.q = {
    corridor: (s, id) => s.data.corridors.find((c) => c.id === id),
    vehicle: (s, id) => s.data.vehicles.find((v) => v.id === id),
    driver: (s, id) => s.data.drivers.find((d) => d.id === id),
    trip: (s, id) => s.data.trips.find((t) => t.id === id),
    incident: (s, id) => s.data.incidents.find((i) => i.id === id),
    recipient: (s, id) => s.data.recipients.find((r) => r.id === id),
    tripForVehicle: (s, vid) => s.data.trips.find((t) => t.vehicleIds.includes(vid) && (t.status === 'on_route' || t.status === 'scheduled')),
    lastCheckIn: (t) => (t.checkIns.length ? t.checkIns[t.checkIns.length - 1] : null),
    nextCheckpoint(s, t) {
      const c = SG.q.corridor(s, t.corridorId);
      return c.checkpoints.find((cp) => cp.at > t.progress + 0.001) || null;
    },
    initials: (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join(''),
  };

  const SEVW = { critical: 10, high: 6, medium: 3, low: 1 };
  SG.SEV = SEVW;

  /* ── derived: route-risk alerts ranked by impact ─── */
  SG.alerts = function (s) {
    const now = Date.now();
    const live = s.data.incidents.filter((i) => i.status === 'verified' || i.status === 'pending');
    const out = [];
    live.forEach((inc) => {
      const trips = s.data.trips.filter((t) => t.corridorId === inc.corridorId && (t.status === 'on_route' || t.status === 'scheduled') && t.progress < inc.at);
      if (!trips.length) return;
      const nearest = trips.reduce((m, t) => Math.max(m, t.progress), 0);
      const c = SG.q.corridor(s, inc.corridorId);
      const kmAhead = Math.round((inc.at - nearest) * c.km);
      const prox = nearest > 0 ? Math.max(0.4, 1.6 - (inc.at - nearest) * 2) : 0.6;
      const conf = inc.status === 'verified' ? 1 : 0.55;
      const ageH = (now - inc.reportedAt) / 3600000;
      const fresh = ageH < 2 ? 1.2 : ageH < 12 ? 1 : 0.7;
      const score = SEVW[inc.severity] * (1 + 0.6 * (trips.length - 1)) * prox * conf * fresh;
      const vehicles = trips.reduce((n, t) => n + t.vehicleIds.length, 0);
      out.push({ inc, trips, kmAhead, score, vehicles, ack: s.data.acks[inc.id] || null,
        factors: { severity: inc.severity, trips: trips.length, vehicles, kmAhead, verified: inc.status === 'verified', ageH } });
    });
    out.sort((a, b) => (!!a.ack - !!b.ack) || b.score - a.score);
    return out;
  };

  /* ── derived: exceptions ─────────────────────────── */
  SG.exceptions = function (s) {
    const now = Date.now(), lim = s.settings.missedCheckInMin;
    const ex = [];
    s.data.sos.filter((x) => x.status === 'open').forEach((x) => {
      const d = SG.q.driver(s, x.driverId), v = SG.q.vehicle(s, x.vehicleId);
      ex.push({ id: 'ex-' + x.id, sev: 'critical', kind: 'SOS open', title: `${x.id} · ${d.name}`, sub: `${v.plate} · raised ${SG.time.rel(x.atTime)}`, impact: 'Driver safety', link: '/sos', act: 'Open SOS log', rank: 100 });
    });
    s.data.trips.filter((t) => t.status === 'on_route').forEach((t) => {
      const last = SG.q.lastCheckIn(t);
      const m = last ? SG.time.mins(last.at) : SG.time.mins(t.departAt);
      const d = SG.q.driver(s, t.driverId), v = SG.q.vehicle(s, t.vehicleIds[0]);
      if (m > lim) ex.push({ id: 'ex-ci-' + t.id, sev: 'high', kind: 'Missed check-in', title: `${d.name} · ${v.plate}`, sub: `No check-in for ${m} min (rule: ${lim} min)`, impact: m + ' min silent', tripId: t.id, act: 'Inspect', rank: 60 + m / 10 });
      if (t.briefing.status === 'Sent') ex.push({ id: 'ex-ack-' + t.id, sev: 'high', kind: 'Briefing not acknowledged', title: `${t.id} · ${d.name}`, sub: `Departed ${SG.time.rel(t.departAt)} without acknowledging ${t.briefing.id}`, impact: t.briefing.incidentIds.length + ' incidents on route', tripId: t.id, act: 'Inspect', rank: 55 });
      if (t.speed === 0 && !s.data.sos.some((x) => x.tripId === t.id && x.status === 'open')) ex.push({ id: 'ex-stop-' + t.id, sev: 'medium', kind: 'Vehicle stopped', title: `${v.plate} · ${SG.q.corridor(s, t.corridorId).name}`, sub: last && last.note ? `“${last.note}”` : 'Stationary on route', impact: 'ETA slipping', tripId: t.id, act: 'Inspect', rank: 35 });
    });
    s.data.trips.filter((t) => t.status === 'scheduled' && t.briefing.status === 'Draft').forEach((t) => {
      const mins = Math.round((t.departAt - now) / MIN);
      ex.push({ id: 'ex-draft-' + t.id, sev: mins < 60 ? 'high' : 'medium', kind: mins < 0 ? 'Departure overdue' : 'Briefing still in draft', title: `${t.id} · departs ${SG.time.t(t.departAt)}`, sub: `${t.briefing.id} not sent to driver`, impact: mins < 0 ? 'Truck held at yard' : 'Departs ' + SG.time.rel(t.departAt), tripId: t.id, act: 'Inspect', rank: mins < 60 ? 50 : 25 });
    });
    s.data.vehicles.filter((v) => v.serviceDueKm < 1000).forEach((v) => {
      ex.push({ id: 'ex-svc-' + v.id, sev: v.serviceDueKm < 0 ? 'high' : 'low', kind: v.serviceDueKm < 0 ? 'Service overdue' : 'Service due soon', title: `${v.plate} · ${v.make}`, sub: v.serviceDueKm < 0 ? `${Math.abs(v.serviceDueKm).toLocaleString()} km overdue` : `Due in ${v.serviceDueKm.toLocaleString()} km`, impact: 'Health ' + v.health, vehicleId: v.id, act: 'View vehicle', rank: v.serviceDueKm < 0 ? 30 : 12 });
    });
    return ex.sort((a, b) => b.rank - a.rank);
  };

  /* ── derived: metrics ─────────────────────────────── */
  SG.metrics = function (s) {
    const lim = s.settings.missedCheckInMin;
    const onRoute = s.data.trips.filter((t) => t.status === 'on_route');
    const activeVehicles = new Set(onRoute.flatMap((t) => t.vehicleIds)).size;
    const late = onRoute.filter((t) => { const l = SG.q.lastCheckIn(t); return SG.time.mins(l ? l.at : t.departAt) > lim; }).length;
    const live = s.data.incidents.filter((i) => i.status === 'verified' || i.status === 'pending');
    const weekAgo = Date.now() - 7 * 1440 * MIN;
    return {
      activeVehicles, fleetSize: s.data.vehicles.length,
      tripsOnRoute: onRoute.length, lateCheckins: late,
      corridorIncidents: live.length, pendingIncidents: live.filter((i) => i.status === 'pending').length,
      sosOpen: s.data.sos.filter((x) => x.status === 'open').length,
      sosWeek: s.data.sos.filter((x) => x.status === 'resolved' && x.resolvedAt > weekAgo).length,
    };
  };

  SG.brief = function (s) {
    const al = SG.alerts(s);
    // trips on route that reach a verified high/critical incident within the next 40 km
    const verifiedTrips = new Set();
    al.filter((a) => a.inc.status === 'verified' && (a.inc.severity === 'high' || a.inc.severity === 'critical')).forEach((a) => {
      const c = SG.q.corridor(s, a.inc.corridorId);
      a.trips.forEach((t) => { if (t.status === 'on_route' && (a.inc.at - t.progress) * c.km <= 40) verifiedTrips.add(t.id); });
    });
    const decisions = s.data.approvals.filter((a) => a.status === 'pending').length;
    const n = verifiedTrips.size;
    const head = n === 0
      ? 'No trips cross a verified incident right now. ' + (decisions ? `${decisions} ${decisions === 1 ? 'item needs' : 'items need'} a decision.` : 'Nothing needs a decision.')
      : `${n} ${n === 1 ? 'trip reaches' : 'trips reach'} a verified incident within 40 km. ${decisions ? decisions + (decisions === 1 ? ' needs a decision.' : ' need a decision.') : 'All decisions are made.'}`;
    // contributing causes = top alerts
    const causes = al.filter((a) => !a.ack).slice(0, 4).map((a) => ({
      label: `${a.inc.category} · ${a.inc.location}`, weight: Math.min(4, Math.max(1, Math.round(a.score / 3))), sev: a.inc.severity, id: a.inc.id,
    }));
    return { head, causes, decisions, n };
  };

  /* ── activity: notifications, log, audit ─────────── */
  let nid = Date.now();
  SG.notify = function (s, n) {
    s.notifications.unshift({ id: 'n' + nid++, at: Date.now(), read: false, ...n });
    s.notifications = s.notifications.slice(0, 60);
  };
  SG.log = function (s, e) {
    s.log.push({ t: Date.now(), level: e.level || 'info', method: e.method || 'EVT', path: e.path || '', status: e.status || 200, ms: e.ms || 0, msg: e.msg || '' });
    if (s.log.length > 400) s.log = s.log.slice(-400);
  };
  SG.audit = function (s, action, target, detail) {
    const who = s.session ? s.session.name : 'System';
    s.audit.unshift({ id: 'a' + nid++, at: Date.now(), who, role: s.session ? s.session.role : 'system', action, target, detail: detail || '' });
    s.audit = s.audit.slice(0, 300);
  };

  /* ── mock service layer ───────────────────────────── */
  const LAT = { normal: [220, 650], slow: [1800, 3400], offline: [600, 900] };
  const loaded = new Set();
  function delay() { const [a, b] = LAT[state.dev.latency] || LAT.normal; return a + Math.random() * (b - a); }
  SG.api = {
    // read: resolves after latency. Offline → rejects unless this resource was loaded this session (served from cache).
    read(path) {
      const d = delay(), lat = state.dev.latency;
      return new Promise((res, rej) => setTimeout(() => {
        if (lat === 'offline') {
          store.set((s) => SG.log(s, { level: 'warn', method: 'GET', path, status: 0, ms: Math.round(d), msg: 'network unreachable' + (loaded.has(path) ? ' · served from cache' : '') }));
          return loaded.has(path) ? res({ cached: true }) : rej(new Error('offline'));
        }
        loaded.add(path);
        store.set((s) => SG.log(s, { method: 'GET', path, status: 200, ms: Math.round(d) }));
        res({ cached: false });
      }, d));
    },
    // write: optimistic. apply(s) runs immediately. Offline → queued and replayed on sync.
    write({ method = 'POST', path, label, apply, status = 201 }) {
      const lat = state.dev.latency;
      store.set((s) => {
        apply(s);
        if (lat === 'offline') {
          s.queue.push({ id: 'q' + nid++, at: Date.now(), method, path, label, status: 'queued' });
          SG.log(s, { level: 'warn', method, path, status: 0, msg: 'queued offline · ' + label });
        }
      });
      if (lat === 'offline') return Promise.resolve({ queued: true });
      const d = delay();
      return new Promise((res) => setTimeout(() => { store.set((s) => SG.log(s, { method, path, status, ms: Math.round(d), msg: label })); res({ ok: true }); }, d));
    },
    // flush the offline queue one item at a time; onStep(i, result)
    async flush(onStep) {
      const items = state.queue.filter((q) => q.status !== 'synced');
      for (let i = 0; i < items.length; i++) {
        await new Promise((r) => setTimeout(r, 450 + Math.random() * 500));
        const ok = Math.random() > 0.08;
        store.set((s) => {
          const q = s.queue.find((x) => x.id === items[i].id); if (q) q.status = ok ? 'synced' : 'failed';
          SG.log(s, { level: ok ? 'info' : 'error', method: items[i].method, path: items[i].path, status: ok ? 201 : 500, ms: 300, msg: 'sync · ' + items[i].label });
        });
        onStep && onStep(i, ok, items.length);
      }
      store.set((s) => { s.queue = s.queue.filter((q) => q.status === 'failed').map((q) => ({ ...q, status: 'queued' })); });
    },
    isLoaded: (p) => loaded.has(p),
  };

  /* ── sound (optional SOS tone) ────────────────────── */
  SG.beep = function () {
    try {
      const C = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.28].forEach((t, i) => {
        const o = C.createOscillator(), g = C.createGain();
        o.frequency.value = i ? 660 : 880; o.type = 'sine';
        g.gain.setValueAtTime(0.0001, C.currentTime + t); g.gain.exponentialRampToValueAtTime(0.18, C.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, C.currentTime + t + 0.24);
        o.connect(g).connect(C.destination); o.start(C.currentTime + t); o.stop(C.currentTime + t + 0.26);
      });
    } catch (e) {}
  };

  /* ── simulation ───────────────────────────────────── */
  const TIME_SCALE = 6; // demo runs 6× faster than real road time so movement is visible
  const POOL = [
    { corridorId: 'LAG-IBD', at: 0.44, category: 'Crash / obstruction', severity: 'medium', location: 'Sagamu interchange approach', description: 'Driver reports a stalled trailer on the slow lane.' },
    { corridorId: 'ABJ-KAD', at: 0.70, category: 'Suspicious activity', severity: 'high', location: 'Rijana, northbound', description: 'Driver reports men on the shoulder flagging trucks to stop.' },
    { corridorId: 'LAG-BEN', at: 0.66, category: 'Police checkpoint delay', severity: 'low', location: 'After Ore junction', description: 'New stop-and-search point, about 15 min wait.' },
    { corridorId: 'LAG-IBD', at: 0.72, category: 'Bad road / potholes', severity: 'low', location: 'Ogunmakin, km 70', description: 'Fresh potholes after overnight rain.' },
    { corridorId: 'LAG-BEN', at: 0.90, category: 'Robbery / armed attack', severity: 'high', location: 'Okada axis, km 290', description: 'Reported attack on a stationary bus. Unconfirmed.' },
    { corridorId: 'ABJ-KAD', at: 0.30, category: 'Flooding', severity: 'medium', location: 'Gauraka bridge', description: 'Water over one lane after rainfall.' },
  ];
  let incN = 3120;
  function tick() {
    const s0 = state;
    if (!s0.session) return;
    const dtH = (2 / 3600) * TIME_SCALE;
    store.set((s) => {
      const now = Date.now();
      s.data.trips.forEach((t) => {
        const c = SG.q.corridor(s, t.corridorId);
        // departures
        if (t.status === 'scheduled' && now >= t.departAt && (t.briefing.status === 'Acknowledged')) {
          t.status = 'on_route'; t.speed = 45; t.vehicleIds.forEach((vid) => { const v = SG.q.vehicle(s, vid); if (v) v.status = 'on_trip'; });
          SG.notify(s, { kind: 'trip', title: `${t.id} departed`, body: `${c.name} · ${SG.q.driver(s, t.driverId).name}`, link: '/trips' });
          SG.log(s, { method: 'POST', path: `/v1/trips/${t.id}/depart`, status: 200, msg: 'trip departed' });
        }
        if (t.status !== 'on_route') return;
        const sosOpen = s.data.sos.some((x) => x.tripId === t.id && x.status === 'open');
        if (sosOpen) { t.speed = 0; return; }
        // speed wander; vehicles stopped in the seed stay stopped
        if (t.speed > 0) t.speed = Math.max(28, Math.min(78, t.speed + (Math.random() - 0.5) * 8));
        t.progress = Math.min(1, t.progress + (t.speed * dtH) / c.km);
        // geofence auto check-ins
        c.checkpoints.forEach((cp) => {
          if (cp.at <= t.progress && !t.passed.includes(cp.id)) {
            t.passed.push(cp.id);
            t.checkIns.push({ at: now, cp: cp.name, kind: 'auto', note: '' });
            t.vehicleIds.forEach((vid) => { const v = SG.q.vehicle(s, vid); if (v) v.lastCheckInAt = now; });
            SG.notify(s, { kind: 'checkin', title: `Check-in · ${cp.name}`, body: `${SG.q.vehicle(s, t.vehicleIds[0]).plate} · ${SG.q.driver(s, t.driverId).name}`, link: '/overview' });
            SG.log(s, { method: 'POST', path: '/v1/checkins', status: 201, ms: 140, msg: `${t.id} @ ${cp.name} (geofence)` });
          }
        });
        t.etaAt = now + ((1 - t.progress) * c.km / Math.max(t.speed, 35)) * 3600000 / TIME_SCALE * TIME_SCALE; // shown in real minutes
        if (t.progress >= 1) {
          t.status = 'completed'; t.speed = 0; t.etaAt = now;
          t.vehicleIds.forEach((vid) => { const v = SG.q.vehicle(s, vid); if (v) v.status = 'idle'; });
          SG.notify(s, { kind: 'good', title: `${t.id} arrived`, body: `${t.destination} · on time`, link: '/trips' });
          SG.log(s, { method: 'POST', path: `/v1/trips/${t.id}/complete`, status: 200, msg: 'trip completed' });
        }
      });
      // pending reports auto-verify after ~3 min (simulated moderation by SafeGrid)
      s.data.incidents.forEach((i) => {
        if (i.status === 'pending' && i.simAutoVerify && now - i.reportedAt > 3 * MIN) {
          i.status = 'verified'; i.verifiedAt = now; i.source = 'Verified by SafeGrid'; i.reports += 1;
          SG.notify(s, { kind: 'alert', title: `Verified · ${i.category}`, body: `${i.location} · ${SG.q.corridor(s, i.corridorId).name}`, link: '/overview' });
          SG.log(s, { method: 'PATCH', path: `/v1/incidents/${i.id}`, status: 200, msg: 'status → verified' });
        }
      });
      // new driver reports every ~70–110 s, max 6 per session
      if (s.sim.spawned < POOL.length && now - s.sim.lastSpawn > 70000 + Math.random() * 40000) {
        const p = POOL[s.sim.spawned];
        const id = 'INC-' + (incN + s.sim.spawned);
        s.data.incidents.unshift({ id, ...p, status: 'pending', source: 'Driver report', reportedAt: now, verifiedAt: null, reports: 1, simAutoVerify: s.sim.spawned % 2 === 0, fresh: true });
        s.sim.spawned++; s.sim.lastSpawn = now;
        SG.notify(s, { kind: 'alert', title: `New report · ${p.category}`, body: `${p.location} · pending verification`, link: '/overview' });
        SG.log(s, { method: 'POST', path: '/v1/incidents', status: 201, ms: 210, msg: `${id} driver report (pending)` });
      }
    });
  }
  SG.startSim = function () { if (SG._sim) return; SG._sim = setInterval(tick, 2000); };
})();
