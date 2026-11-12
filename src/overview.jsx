/* src/overview.jsx — Operations Overview + shared trip drawer + approval card. */

/* ── Approval card: "AI proposes. A person approves." ── */
function applyApproval(s, ap) {
  if (ap.kind === 'briefing') {
    const t = SG.q.trip(s, ap.target); if (t) { const d = new Date(Date.now() + 86400000); t.departAt = Date.now() + 14 * 3600000; t.etaAt = t.departAt + 210 * 60000; }
  }
  if (ap.kind === 'service') { const v = SG.q.vehicle(s, ap.target); if (v) v.serviceBooked = true; }
  if (ap.kind === 'checkin') { const t = SG.q.trip(s, ap.target); if (t) t.callLogged = Date.now(); }
}
function decideApproval(id, decision) {
  const before = JSON.stringify(SG.store.get().data.approvals);
  const ap = SG.store.get().data.approvals.find((a) => a.id === id);
  SG.api.write({ method: 'PATCH', path: '/v1/approvals/' + id, label: `${decision} · ${ap.title}`, status: 200, apply: (s) => {
    const a = s.data.approvals.find((x) => x.id === id); a.status = decision; a.decidedAt = Date.now(); a.by = s.session.name;
    if (decision === 'approved') applyApproval(s, a);
    SG.audit(s, decision === 'approved' ? 'Approved suggestion' : 'Dismissed suggestion', a.title, 'Simulated intelligence');
  } });
  if (decision === 'dismissed') toast('Suggestion dismissed', { icon: 'x', action: { label: 'Undo', fn: () => SG.store.set((s) => { s.data.approvals = JSON.parse(before); }) } });
  else toast('Approved and logged', { body: ap.title, tone: 'good' });
}
function ApprovalCard({ ap, compact }) {
  const [open, setOpen] = useState(false);
  const done = ap.status === 'approved';
  return (
    <div className={'appr' + (done ? ' done' : '')}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
        <span className="tag"><Ico n="sparkles" s={12} /></span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 550, fontSize: 13.5, letterSpacing: '-.005em' }}>{ap.title}</div>
          <div className="muted tw-pretty" style={{ fontSize: 12.5, marginTop: 3 }}>{ap.body}</div>
          {!done && <div style={{ marginTop: 8 }}><Chip tone="lime" dot={false}>{ap.impact}</Chip></div>}
        </div>
      </div>
      <div className={'appr-expand' + (open ? ' open' : '')}><div>
        <div className="why-box" style={{ marginTop: 10 }}>
          <div className="caps" style={{ marginBottom: 4 }}>Evidence</div>
          {ap.kind === 'briefing' && <span>INC-3101 verified {SG.time.rel(SG.q.incident(SG.store.get(), 'INC-3101').verifiedAt)}, 4 independent reports. Sunset in Kaduna ≈ 18:30 WAT. Trip ETA at Katari with current departure ≈ 18:10.</span>}
          {ap.kind === 'service' && <span>Odometer and service interval from fleet records. Health score combines service interval, recent faults and tyre age.</span>}
          {ap.kind === 'checkin' && <span>Missed check-in rule: {SG.store.get().settings.missedCheckInMin} min (Settings). Last geofence ping: Ijebu-Ode, speed 0 km/h.</span>}
          <div className="muted" style={{ marginTop: 6, fontSize: 11.5 }}>Nothing changes until a person approves. The decision is logged with your name.</div>
        </div>
      </div></div>
      {done ? (
        <div className="row" style={{ marginTop: 12, fontSize: 12.5 }}><span className="check-pop"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.5 9.5 3.5" fill="none" stroke="#1B2400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span>Approved by {ap.by} · {SG.time.t(ap.decidedAt)}</span></div>
      ) : (
        <div className="row" style={{ marginTop: 12, gap: 6 }}>
          <Btn v="ink" size="sm" onClick={() => decideApproval(ap.id, 'approved')}>Approve</Btn>
          <Btn v="outline" size="sm" className="btn-pill" onClick={() => setOpen((x) => !x)} aria-expanded={open}>{open ? 'Hide' : 'Review'}</Btn>
          <Btn v="ghost" size="sm" className="btn-pill" onClick={() => decideApproval(ap.id, 'dismissed')}>Dismiss</Btn>
        </div>
      )}
    </div>
  );
}

/* ── Morning brief card ─────────────────────────────── */
function BriefCard() {
  const s = useSG();
  const b = SG.brief(s);
  const pending = s.data.approvals.filter((a) => a.status === 'pending');
  const [showProps, setShowProps] = useState(false);
  return (
    <section className="brief" aria-label="Morning brief">
      <div className="row" style={{ gap: 10 }}>
        <span className="agent"><LogoMark size={26} /></span>
        <div className="grow"><div style={{ fontWeight: 550, fontSize: 13 }}>{SG.time.hour(Date.now()) < 12 ? 'Morning brief' : 'Shift brief'}</div><div className="caps" style={{ color: 'var(--violet-ink)', fontSize: 10 }}>SafeGrid Intelligence · {SG.time.wat(Date.now())}</div></div>
        <SimTag>Simulated intelligence (demo)</SimTag>
      </div>
      <h2><Typewriter text={b.head} /></h2>
      {b.causes.length > 0 && <>
        <div className="caps" style={{ marginTop: 14, marginBottom: 4, color: 'var(--violet-ink)' }}>Why · contributing reports</div>
        {b.causes.map((c, i) => (
          <div className="why-row" key={c.id}>
            <span className="mono muted" style={{ fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</span>
            <span className="ellipsis">{c.label}</span>
            <span className="bars">{Array.from({ length: 4 }).map((_, j) => <i key={j} style={{ width: 22, opacity: j < c.weight ? 1 : .18, animationDelay: (0.3 + i * 0.08 + j * 0.05) + 's' }} />)}</span>
          </div>
        ))}
      </>}
      {pending.length > 0 && <>
        <div className="caps" style={{ marginTop: 14, marginBottom: 6, color: 'var(--violet-ink)' }}>Proposed · needs your approval</div>
        <div className="col" style={{ gap: 6 }}>
          {pending.map((a) => (
            <button key={a.id} className="prop-row" onClick={() => setShowProps(true)}>
              <Ico n={a.kind === 'briefing' ? 'clock' : a.kind === 'service' ? 'wrench' : 'phone'} s={15} style={{ color: 'var(--violet)' }} />
              <span className="grow ellipsis" style={{ textAlign: 'left' }}>{a.title}</span>
              <span className="muted" style={{ fontSize: 12 }}>{a.impact.split(' ').slice(0, 3).join(' ')}</span>
              <Ico n="chevron-right" s={15} className="muted" />
            </button>
          ))}
        </div>
      </>}
      <div className="row wrap" style={{ marginTop: 14, gap: 8 }}>
        {pending.length > 0 ? <Btn v="ink" size="sm" icon="check-check" onClick={() => setShowProps(true)}>Review {pending.length} {pending.length === 1 ? 'proposal' : 'proposals'}</Btn>
          : <Chip tone="lime">All proposals decided</Chip>}
        <Btn v="ghost" size="sm" onClick={() => nav('/intelligence')}>Open SafeGrid Intelligence</Btn>
      </div>
      <Disclaimer style={{ marginTop: 14 }} />
      <Modal open={showProps} onClose={() => setShowProps(false)} title="AI proposes. A person approves." sub="Each suggestion shows its evidence. Nothing changes until you approve." icon="sparkles" width={560}>
        <div className="col" style={{ gap: 10 }}>
          {s.data.approvals.filter((a) => a.status !== 'dismissed').map((a) => <ApprovalCard key={a.id} ap={a} />)}
          {s.data.approvals.every((a) => a.status === 'dismissed') && <Empty icon="check-check" title="Nothing to decide" body="New suggestions appear here when conditions change." />}
        </div>
      </Modal>
    </section>
  );
}

/* ── KPI strip (config-driven) ──────────────────────── */
function KpiStrip() {
  const s = useSG();
  const m = SG.metrics(s);
  const fill = (str) => str.replace(/\{(\w+)\}/g, (_, k) => m[k]);
  return (
    <div className="kpi-wrap"><section className="card kpis" aria-label="Key numbers">
      {SG_DASH.kpis.map((k) => {
        const hist = [...(s.data.history[k.history] || []), m[k.metric]];
        const prev = hist[hist.length - 2], cur = m[k.metric], delta = cur - prev;
        const good = delta === 0 ? 'flat' : (delta > 0) === (k.good === 'up') ? 'good' : 'bad';
        const danger = k.metric === 'sosOpen' && cur > 0;
        return (
          <div className="kpi" key={k.id}>
            <div className="row"><span className="caps">{k.label}</span></div>
            <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
              <span className="v num-xl" style={danger ? { color: 'var(--danger)' } : null}><CountUp value={cur} /></span>
              <span className={'trend ' + (danger ? 'bad' : good)}>{delta > 0 ? '+' : ''}{delta === 0 ? '±0' : delta}</span>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{fill(k.sub)}</div>
            <Sparkline data={hist} color={danger ? 'var(--danger)' : 'var(--muted-2)'} />
          </div>
        );
      })}
    </section></div>
  );
}

/* ── Trips table ────────────────────────────────────── */
function lastCheckInInfo(s, t) {
  const last = SG.q.lastCheckIn(t);
  const m = last ? SG.time.mins(last.at) : t.status === 'on_route' ? SG.time.mins(t.departAt) : null;
  const late = t.status === 'on_route' && m > s.settings.missedCheckInMin;
  return { last, m, late };
}
function TripsTable({ onInspect, highlight }) {
  const s = useSG();
  useNow(20000);
  const res = useResource('/v1/trips?today');
  const [tab, setTab] = useState('active');
  const lists = {
    active: s.data.trips.filter((t) => t.status === 'on_route'),
    pending: s.data.trips.filter((t) => t.briefing.status !== 'Acknowledged' && t.status !== 'completed'),
    all: s.data.trips,
  };
  const rows = lists[tab];
  return (
    <section className="card" aria-label="Active trips and driver check-ins">
      <div className="card-h wrap" style={{ paddingBottom: 12 }}>
        <span className="card-t">Active trips & driver check-ins</span><DemoTag />
        <span className="grow" />
        <Tabs items={SG_NAV.tabs.overviewTrips} value={tab} onChange={setTab} counts={{ active: lists.active.length, pending: lists.pending.length, all: lists.all.length }} ariaLabel="Trip filter" />
      </div>
      <Guarded res={res} skeleton={<SkRows n={6} cols={6} />}>
        {rows.length === 0 ? <Empty icon="route" title={tab === 'pending' ? 'Every briefing is acknowledged' : 'No trips here'} body={tab === 'pending' ? 'Drivers have acknowledged their route-risk briefings.' : 'Create a trip to see it here.'} /> :
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Trip</th><th>Vehicle · driver</th><th>Corridor</th><th style={{ minWidth: 150 }}>Progress</th><th>Last check-in</th><th>Briefing</th><th></th></tr></thead>
            <tbody className="stagger" key={tab}>
              {rows.map((t) => {
                const d = SG.q.driver(s, t.driverId), c = SG.q.corridor(s, t.corridorId);
                const vs = t.vehicleIds.map((v) => SG.q.vehicle(s, v));
                const ci = lastCheckInInfo(s, t);
                const sos = s.data.sos.some((x) => x.tripId === t.id && x.status === 'open');
                return (
                  <tr key={t.id} className={highlight === t.id ? 'hl' : ''}>
                    <td><div className="mono" style={{ fontWeight: 500 }}>{t.id}</div><div className="row" style={{ gap: 4, marginTop: 3 }}><Status s={t.status} />{t.convoy && <Chip tone="ink" dot={false}>Convoy ×{t.vehicleIds.length}</Chip>}</div></td>
                    <td><div className="row" style={{ gap: 10 }}><Avatar name={d.name} size={30} /><div><div style={{ fontWeight: 500 }}>{d.name}</div><div className="mono muted" style={{ fontSize: 12 }}>{vs.map((v) => v.plate).join(' + ')}</div></div></div></td>
                    <td><div>{c.name}</div><div className="muted" style={{ fontSize: 12 }}>{t.status === 'scheduled' ? 'Departs ' + SG.time.t(t.departAt) : t.status === 'completed' ? 'Arrived ' + SG.time.t(t.etaAt) : 'ETA ' + SG.time.t(t.etaAt)}</div></td>
                    <td><div className="row" style={{ gap: 8 }}><div className={'bar grow ' + (sos ? 'danger' : t.status === 'completed' ? 'lime' : 'violet')}><i style={{ width: Math.round(t.progress * 100) + '%' }} /></div><span className="mono muted" style={{ fontSize: 11.5, width: 32, textAlign: 'right' }}>{Math.round(t.progress * 100)}%</span></div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t.status === 'on_route' ? (t.speed > 0 ? Math.round(t.speed) + ' km/h' : sos ? 'Stopped · SOS' : 'Stopped') : '—'}</div></td>
                    <td>{ci.last ? <><div style={ci.late ? { color: 'var(--danger-ink)', fontWeight: 500 } : null}>{SG.time.rel(ci.last.at)}</div><div className="muted ellipsis" style={{ fontSize: 12, maxWidth: 160 }}>{ci.last.cp} · {ci.last.kind === 'auto' ? 'geofence' : '1-tap'}</div></> : <span className="muted">{t.status === 'scheduled' ? 'Not departed' : '—'}</span>}
                      {ci.late && <div style={{ marginTop: 3 }}><Chip tone="danger">Missed · {ci.m} min</Chip></div>}</td>
                    <td><Status s={t.briefing.status} /><div className="mono muted" style={{ fontSize: 11.5, marginTop: 3 }}>{t.briefing.id}</div></td>
                    <td style={{ textAlign: 'right' }}><Btn size="sm" onClick={() => onInspect(t.id)}>Inspect</Btn></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
      </Guarded>
    </section>
  );
}

/* ── Trip drawer (Inspect) ──────────────────────────── */
function TripDrawer({ id, onClose }) {
  const s = useSG();
  const t = id && SG.q.trip(s, id);
  if (!t) return null;
  const d = SG.q.driver(s, t.driverId), c = SG.q.corridor(s, t.corridorId);
  const vs = t.vehicleIds.map((v) => SG.q.vehicle(s, v));
  const ci = lastCheckInInfo(s, t);
  const next = SG.q.nextCheckpoint(s, t);
  const incs = t.briefing.incidentIds.map((i) => SG.q.incident(s, i)).filter(Boolean);
  const resend = () => SG.api.write({ path: `/v1/briefings/${t.briefing.id}/send`, label: 'briefing re-sent to ' + d.name, apply: (x) => { const tt = SG.q.trip(x, t.id); if (tt.briefing.status === 'Draft' || tt.briefing.status === 'Expired') tt.briefing.status = 'Sent'; tt.briefing.sentAt = Date.now(); SG.audit(x, 'Sent briefing', t.briefing.id, 'to ' + d.name); } }).then((r) => toast(r.queued ? 'Briefing queued (offline)' : 'Briefing sent (simulated)', { body: `${t.briefing.id} → ${d.name} · SMS + app`, icon: 'send' }));
  const call = () => { SG.store.set((x) => { SG.audit(x, 'Called driver', d.name, d.phone); SG.log(x, { method: 'EVT', path: '/call', status: 200, msg: 'tap-to-call ' + d.phone }); }); location.href = 'tel:' + d.phone.replace(/\s/g, ''); };
  return (
    <Drawer open onClose={onClose} head={<div className="row" style={{ gap: 6 }}><span className="caps mono">{t.id}</span><Status s={t.status} />{t.convoy && <Chip tone="ink" dot={false}>Convoy</Chip>}</div>}
      title={`${c.from.split(' (')[0]} → ${c.to}`} sub={`${t.cargo} · ${c.km} km`}
      footer={<><Btn icon="phone" onClick={call}>Call driver</Btn>{t.briefing.status !== 'Acknowledged' && <Btn v="primary" icon="send" onClick={resend}>{t.briefing.status === 'Draft' ? 'Send briefing' : 'Re-send briefing'}</Btn>}</>}>
      <div style={{ height: 150, borderRadius: 14, background: 'var(--canvas)', overflow: 'hidden', position: 'relative' }}><MiniRoute corridorId={c.id} progress={t.progress} w={440} h={150} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
        {[['Departed', t.status === 'scheduled' ? '—' : SG.time.t(t.departAt)], [t.status === 'completed' ? 'Arrived' : 'ETA', SG.time.t(t.etaAt)], ['Speed', t.status === 'on_route' ? Math.round(t.speed) + ' km/h' : '—']].map(([k, v]) => (
          <div key={k} className="card" style={{ padding: 12, boxShadow: 'none' }}><div className="caps">{k}</div><div className="num-xl" style={{ fontSize: 22, marginTop: 6 }}>{v}</div></div>
        ))}
      </div>
      <div className="card" style={{ padding: 12, marginTop: 10, boxShadow: 'none' }}>
        <div className="row" style={{ gap: 10 }}><Avatar name={d.name} size={36} /><div className="grow"><div style={{ fontWeight: 500 }}>{d.name}</div><div className="muted mono" style={{ fontSize: 12 }}>{d.phone}</div></div>{vs.map((v) => <span key={v.id} className="mono chip chip-line" style={{ height: 24 }}>{v.plate}</span>)}</div>
      </div>
      {ci.late && <div className="why-box" style={{ background: 'var(--danger-50)', borderColor: 'transparent', color: 'var(--danger-ink)' }}><b>Missed check-in.</b> No check-in for {ci.m} min, above the {s.settings.missedCheckInMin} min rule.{t.callLogged ? ' Call logged ' + SG.time.rel(t.callLogged) + '.' : ''}</div>}

      <div className="row" style={{ marginTop: 20, marginBottom: 10 }}><span className="card-t">Route-risk briefing</span><span className="mono muted" style={{ fontSize: 12 }}>{t.briefing.id}</span><span className="grow" /><Status s={t.briefing.status} /></div>
      {incs.length === 0 ? <div className="muted" style={{ fontSize: 13 }}>No verified incidents near this route at briefing time.</div> :
        <div className="col" style={{ gap: 8 }}>{incs.map((i) => (
          <div key={i.id} className="row" style={{ alignItems: 'flex-start', gap: 10, padding: 10, border: '1px solid var(--line)', borderRadius: 12 }}>
            <Sev s={i.severity} /><div className="grow" style={{ minWidth: 0, marginTop: -4 }}><div style={{ fontWeight: 500, fontSize: 13 }}>{i.category}</div><div className="muted" style={{ fontSize: 12 }}>{i.location} · km {Math.round(i.at * c.km)} · {i.source} · {SG.time.rel(i.reportedAt)}</div></div><Status s={i.status} />
          </div>))}</div>}
      <Disclaimer style={{ marginTop: 10 }} />

      <div className="row" style={{ marginTop: 22, marginBottom: 12 }}><span className="card-t">Check-in timeline</span><span className="grow" /><span className="muted" style={{ fontSize: 12 }}>{t.checkIns.length} check-ins</span></div>
      <div className="tl">
        <div className="tl-it ok"><div style={{ fontSize: 13, fontWeight: 500 }}>Briefing {t.briefing.status === 'Acknowledged' ? 'acknowledged' : t.briefing.status.toLowerCase()}</div><div className="muted mono" style={{ fontSize: 11.5 }}>{t.briefing.ackAt ? SG.time.wat(t.briefing.ackAt) : t.briefing.sentAt ? 'sent ' + SG.time.wat(t.briefing.sentAt) : 'not sent'}</div></div>
        {t.checkIns.map((x, i) => (
          <div key={i} className={'tl-it' + (x.kind === 'auto' ? ' ai' : '')}><div style={{ fontSize: 13, fontWeight: 500 }}>{x.cp}</div><div className="muted" style={{ fontSize: 12 }}><span className="mono">{SG.time.wat(x.at)}</span> · {x.kind === 'auto' ? 'Geofence auto check-in' : '1-tap check-in'}{x.note ? ' · “' + x.note + '”' : ''}</div></div>
        ))}
        {t.status !== 'completed' && next && <div className="tl-it future"><div style={{ fontSize: 13, fontWeight: 500 }} className="muted">Next: {next.name}</div><div className="muted" style={{ fontSize: 12 }}>km {Math.round(next.at * c.km)} · expected {SG.time.t(Date.now() + ((next.at - t.progress) * c.km / Math.max(t.speed || 40, 35)) * 3600000)}</div></div>}
      </div>
    </Drawer>
  );
}

/* ── Route risk alerts feed ─────────────────────────── */
function AlertsFeed() {
  const s = useSG();
  useNow(30000);
  const res = useResource('/v1/alerts/route-risk');
  const all = SG.alerts(s);
  const [why, setWhy] = useState(null);
  const [showAcked, setShowAcked] = useState(false);
  const [more, setMore] = useState(false);
  const open = all.filter((a) => !a.ack);
  const full = showAcked ? all : open;
  const list = more ? full : full.slice(0, 5);
  const ack = (a) => {
    SG.api.write({ path: `/v1/alerts/${a.inc.id}/ack`, label: 'acknowledged ' + a.inc.id, apply: (x) => { x.data.acks[a.inc.id] = { at: Date.now(), by: x.session.name }; SG.audit(x, 'Acknowledged alert', a.inc.id, a.inc.category); } })
      .then((r) => toast(r.queued ? 'Acknowledged · queued offline' : 'Alert acknowledged', { body: `${a.inc.category} · ${a.inc.location}`, icon: 'check', action: { label: 'Undo', fn: () => SG.store.set((x) => { delete x.data.acks[a.inc.id]; }) } }));
  };
  return (
    <section className="card" aria-label="Route risk alerts">
      <div className="card-h"><span className="card-t">Route risk alerts</span><Chip tone="violet" dot={false}>Ranked by impact</Chip><span className="grow" /><Fresh /></div>
      <div className="row" style={{ padding: '8px 18px 10px', gap: 8 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>{open.length} open · {all.length - open.length} acknowledged</span><span className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={() => setShowAcked((x) => !x)}>{showAcked ? 'Hide acknowledged' : 'Show acknowledged'}</button>
      </div>
      <Guarded res={res} skeleton={<SkRows n={4} cols={3} />}>
        {list.length === 0 ? <Empty icon="shield-check" title="No open route alerts" body="No reported incidents ahead of active or scheduled trips. Absence of reports does not imply absence of incidents." /> :
        <div style={{ borderTop: '1px solid var(--line-2)' }}>
          {list.map((a, idx) => {
            const c = SG.q.corridor(s, a.inc.corridorId);
            const isFresh = a.inc.fresh && Date.now() - a.inc.reportedAt < 8000;
            return (
              <div key={a.inc.id} className={'alert-it' + (isFresh ? ' fresh' : '')} style={a.ack ? { opacity: .6 } : null}>
                <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <span className={'rank' + (idx === 0 && !a.ack ? ' r1' : '')}>{idx + 1}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 550, fontSize: 13.5, lineHeight: 1.3 }}>{a.inc.category}</div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{a.inc.location} · {c.name}</div>
                    <div className="row wrap" style={{ gap: 6, marginTop: 6 }}><SevChip s={a.inc.severity} /><Status s={a.inc.status} /></div>
                    <div className="row wrap" style={{ gap: 6, marginTop: 8, fontSize: 12 }}>
                      <span className="chip chip-line" style={{ height: 22 }}><Ico n="truck" s={12} />{a.vehicles} {a.vehicles === 1 ? 'vehicle' : 'vehicles'} · {a.trips.length} {a.trips.length === 1 ? 'trip' : 'trips'}</span>
                      {a.trips.some((t) => t.status === 'on_route') && <span className="chip chip-line" style={{ height: 22 }}>{a.kmAhead} km ahead</span>}
                      <span className="muted">{a.inc.source} · {SG.time.rel(a.inc.reportedAt)}</span>
                    </div>
                    {why === a.inc.id && <div className="why-box">
                      <div className="caps" style={{ marginBottom: 6 }}>Why you’re seeing this</div>
                      <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
                        <li><b>{a.inc.severity[0].toUpperCase() + a.inc.severity.slice(1)}</b> severity · {a.inc.reports} {a.inc.reports === 1 ? 'report' : 'reports'}</li>
                        <li>{a.factors.verified ? 'Verified' : 'Not yet verified, ranked lower until confirmed'} · {a.inc.source}</li>
                        <li>Ahead of {a.trips.map((t) => t.id).join(', ')} ({a.vehicles} {a.vehicles === 1 ? 'vehicle' : 'vehicles'})</li>
                        <li>{a.factors.ageH < 2 ? 'Reported in the last 2 hours' : 'Reported ' + SG.time.rel(a.inc.reportedAt)}</li>
                      </ul>
                      <div className="muted" style={{ marginTop: 6, fontSize: 11.5 }}>Rank = severity × trips affected × proximity × verification × freshness. Score {a.score.toFixed(1)}.</div>
                    </div>}
                    <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                      {a.ack ? <span className="muted" style={{ fontSize: 12 }}><Ico n="check" s={12} /> Acknowledged by {a.ack.by} · {SG.time.t(a.ack.at)}</span>
                        : <Btn size="sm" v="ink" onClick={() => ack(a)}>Acknowledge</Btn>}
                      <Btn size="sm" v="ghost" className="btn-pill" onClick={() => setWhy(why === a.inc.id ? null : a.inc.id)} aria-expanded={why === a.inc.id}>Why am I seeing this?</Btn>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {full.length > 5 && <div style={{ padding: '8px 18px', borderTop: '1px solid var(--line-2)' }}><button className="btn btn-ghost btn-sm" onClick={() => setMore((x) => !x)}>{more ? 'Show top 5' : `Show all ${full.length}`}<Ico n={more ? 'chevron-up' : 'chevron-down'} s={14} /></button></div>}
        </div>}
      </Guarded>
      <div style={{ padding: '10px 18px 14px', borderTop: '1px solid var(--line-2)' }}><Disclaimer /></div>
    </section>
  );
}

/* ── Exceptions ─────────────────────────────────────── */
function ExceptionsList({ onInspect }) {
  const s = useSG();
  useNow(20000);
  const ex = SG.exceptions(s);
  const tone = { critical: 'danger', high: 'danger', medium: 'amber', low: 'line' };
  return (
    <section className="card" aria-label="Exceptions">
      <div className="card-h" style={{ paddingBottom: 10 }}><span className="card-t">Exceptions</span><Chip tone="line" dot={false}>{ex.length}</Chip><span className="grow" /><span className="muted" style={{ fontSize: 12 }}>Missed check-in rule: {s.settings.missedCheckInMin} min</span></div>
      {ex.length === 0 ? <Empty icon="circle-check" title="No exceptions" body="Every trip is checking in and every briefing is acknowledged." /> :
      <div className="tbl-wrap"><table className="tbl"><tbody className="stagger">
        {ex.slice(0, 8).map((e) => (
          <tr key={e.id}>
            <td style={{ width: 150 }}><Chip tone={tone[e.sev]}>{e.kind}</Chip></td>
            <td><div style={{ fontWeight: 500 }} className="ellipsis">{e.title}</div><div className="muted ellipsis" style={{ fontSize: 12, maxWidth: 380 }}>{e.sub}</div></td>
            <td className="muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{e.impact}</td>
            <td style={{ textAlign: 'right' }}><Btn size="sm" v="ghost" iconR="arrow-right" onClick={() => e.tripId ? onInspect(e.tripId) : e.vehicleId ? nav('/fleet?tab=vehicles&v=' + e.vehicleId) : nav(e.link)}>{e.act}</Btn></td>
          </tr>
        ))}
      </tbody></table></div>}
    </section>
  );
}

/* ── Shift handover notes ───────────────────────────── */
function HandoverCard() {
  const s = useSG();
  const [txt, setTxt] = useState('');
  const add = () => {
    if (!txt.trim()) return;
    SG.api.write({ path: '/v1/handover', label: 'handover note', apply: (x) => { x.data.handover.unshift({ id: 'h' + Date.now(), author: x.session.name, role: x.session.title, at: Date.now(), text: txt.trim() }); SG.audit(x, 'Added handover note', '', txt.trim().slice(0, 60)); } });
    setTxt(''); toast('Handover note saved', { icon: 'notebook-pen' });
  };
  return (
    <section className="card" aria-label="Shift handover">
      <div className="card-h"><span className="card-t">Shift handover</span><span className="grow" /><span className="muted" style={{ fontSize: 12 }}>{s.data.handover.length} notes</span></div>
      <div className="card-b">
        <div className="col" style={{ gap: 12, maxHeight: 260, overflowY: 'auto' }}>
          {s.data.handover.map((h) => (
            <div key={h.id} className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <Avatar name={h.author} size={28} />
              <div className="grow"><div style={{ fontSize: 12.5 }}><b style={{ fontWeight: 550 }}>{h.author}</b> <span className="muted">· {h.role} · {SG.time.rel(h.at)}</span></div><div className="tw-pretty" style={{ fontSize: 13, marginTop: 2 }}>{h.text}</div></div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 14, gap: 8, alignItems: 'flex-end' }}>
          <textarea className="textarea" style={{ minHeight: 44 }} rows={2} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Leave a note for the next shift…" aria-label="Handover note" onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) add(); }} />
          <Btn v="primary" icon="send" onClick={add} disabled={!txt.trim()} aria-label="Save note" />
        </div>
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────── */
function OverviewPage() {
  const s = useSG();
  const route = useRoute();
  const tripId = route.query.trip;
  const now = useNow(60000);
  const first = s.session.name.split(' ')[0];
  return (
    <div className="page-enter">
      <div className="ph">
        <div className="grow">
          <div className="caps">{SG.time.day(now)} · {SG.time.wat(now)}</div>
          <h1>{SG.time.greet(now)}, {first}</h1>
          <div className="sub">Here’s what needs your attention across {SG_BRAND.orgName}’s corridors.</div>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <DemoTag />
          <Btn icon="triangle-alert" onClick={() => nav('/incidents')}>Report incident</Btn>
          <Btn v="primary" icon="plus" onClick={() => nav('/trips?new=1')}>New trip & briefing</Btn>
        </div>
      </div>
      <div className="g-main">
        <div className="col" style={{ gap: 16, minWidth: 0 }}>
          <KpiStrip />
          <TripsTable onInspect={(id) => setQuery('trip', id)} highlight={tripId} />
          <ExceptionsList onInspect={(id) => setQuery('trip', id)} />
        </div>
        <div className="col" style={{ gap: 16, minWidth: 0 }}>
          <BriefCard />
          <AlertsFeed />
          <HandoverCard />
        </div>
      </div>
      <TripDrawer id={tripId} onClose={() => setQuery('trip', null)} />
    </div>
  );
}

Object.assign(window, { OverviewPage, ApprovalCard, decideApproval, TripDrawer, KpiStrip, BriefCard, AlertsFeed, lastCheckInInfo });
