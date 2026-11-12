/* src/fleet.jsx — Fleet & Drivers: vehicle cards, driver profiles, add forms,
   SOS recipients with simulated test send. */

/* tiny schema validator (Zod-style API surface, no dependency) */
const v8n = {
  req: (m = 'Required') => (x) => (String(x ?? '').trim() ? null : m),
  plate: () => (x) => (/^[A-Z]{3}-\d{3}-[A-Z]{2}$/.test(String(x).trim().toUpperCase()) ? null : 'Use the format ABC-123-XY'),
  phone: () => (x) => (/^\+?234[\s\d]{9,14}$/.test(String(x).replace(/\s+/g, ' ').trim()) ? null : 'Use a Nigerian number, e.g. +234 803 000 0000'),
  num: (min, max) => (x) => (x === '' || isNaN(+x) ? 'Enter a number' : +x < min || +x > max ? `Between ${min} and ${max}` : null),
};
function useForm(initial, schema) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const validate = (vals = values) => {
    const e = {};
    Object.entries(schema).forEach(([k, rules]) => { for (const r of rules) { const m = r(vals[k]); if (m) { e[k] = m; break; } } });
    return e;
  };
  const set = (k) => (ev) => { const v = ev && ev.target ? ev.target.value : ev; const nv = { ...values, [k]: v }; setValues(nv); if (touched) setErrors(validate(nv)); };
  const submit = (fn) => (ev) => { ev && ev.preventDefault(); setTouched(true); const e = validate(); setErrors(e); if (!Object.keys(e).length) fn(values); };
  return { values, errors, set, submit, reset: () => { setValues(initial); setErrors({}); setTouched(false); } };
}

function healthTone(h) { return h >= 80 ? 'lime' : h >= 60 ? 'amber' : 'danger'; }

function VehicleCard({ v, onOpen }) {
  const s = SG.store.get();
  const d = v.driverId && SG.q.driver(s, v.driverId);
  const t = SG.q.tripForVehicle(s, v.id);
  const lead = t && SG.q.driver(s, t.driverId);
  const svcTone = v.serviceDueKm < 0 ? 'var(--danger-ink)' : v.serviceDueKm < 1500 ? 'var(--amber-ink)' : 'var(--ink)';
  return (
    <button className="vcard" onClick={() => onOpen(v.id)} aria-label={`Vehicle ${v.plate}`}>
      <div className="vhead">
        {t ? <MiniRoute corridorId={t.corridorId} progress={t.status === 'on_route' ? t.progress : null} w={260} h={112} incidents={false} />
          : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--muted-2)' }}><Ico n={v.status === 'maintenance' ? 'wrench' : v.status === 'offline' ? 'wifi-off' : 'warehouse'} s={28} w={1.4} /></div>}
        <div className="tl-chips"><Status s={v.status} /><Chip tone={healthTone(v.health)} dot={false}><Ico n="activity" s={11} />Health {v.health}</Chip></div>
      </div>
      <div style={{ padding: '12px 14px 12px' }}>
        <div className="row"><div className="grow"><div className="vplate mono">{v.plate}</div><div className="muted" style={{ fontSize: 12 }}>{v.year} {v.make} · {v.type}</div></div>{(d || lead) && <Avatar name={(d || lead).name} size={30} />}</div>
        <div className="vstats">
          <div><div className="k">Fuel</div><div className="val">{v.fuel}%</div><div className={'bar ' + (v.fuel < 25 ? 'danger' : '')} style={{ marginTop: 5 }}><i style={{ width: v.fuel + '%' }} /></div></div>
          <div><div className="k">Odometer</div><div className="val">{v.odometer.toLocaleString()}</div><div className="muted" style={{ fontSize: 11 }}>km</div></div>
          <div><div className="k">Service</div><div className="val" style={{ color: svcTone }}>{v.serviceDueKm < 0 ? 'Overdue' : v.serviceDueKm.toLocaleString() + ' km'}</div>{v.serviceBooked && <div style={{ fontSize: 11, color: 'var(--violet-ink)' }}>Booked</div>}</div>
        </div>
      </div>
      <div className="vfoot"><Ico n="map-pin" s={13} /><span className="grow ellipsis">{t ? `${t.id} · ${SG.q.corridor(s, t.corridorId).name}` : v.status === 'maintenance' ? 'Ikeja workshop' : 'Yard'}</span><span className="mono">{SG.time.rel(v.lastCheckInAt)}</span></div>
    </button>
  );
}

function VehicleDrawer({ id, onClose }) {
  const s = useSG();
  const v = id && SG.q.vehicle(s, id);
  if (!v) return null;
  const t = SG.q.tripForVehicle(s, v.id);
  const d = v.driverId ? SG.q.driver(s, v.driverId) : t ? SG.q.driver(s, t.driverId) : null;
  const avail = s.data.drivers.filter((x) => x.status !== 'on_trip' || x.id === v.driverId);
  const setStatus = (st) => SG.api.write({ method: 'PATCH', path: '/v1/vehicles/' + v.id, label: `${v.plate} → ${st}`, status: 200, apply: (x) => { SG.q.vehicle(x, v.id).status = st; SG.audit(x, 'Changed vehicle status', v.plate, st); } }).then(() => toast(`${v.plate} marked ${STATUS_TONE[st][1].toLowerCase()}`));
  const assign = (did) => SG.api.write({ method: 'PATCH', path: '/v1/vehicles/' + v.id, label: `${v.plate} driver → ${did || 'none'}`, status: 200, apply: (x) => { SG.q.vehicle(x, v.id).driverId = did || null; SG.audit(x, 'Assigned driver', v.plate, did ? SG.q.driver(x, did).name : 'Unassigned'); } }).then(() => toast('Driver assignment saved'));
  const book = () => SG.api.write({ method: 'POST', path: '/v1/service-bookings', label: 'service booked ' + v.plate, apply: (x) => { SG.q.vehicle(x, v.id).serviceBooked = true; SG.audit(x, 'Booked service', v.plate, ''); } }).then(() => toast('Service booked', { body: v.plate + ' · Ikeja workshop (simulated)', tone: 'good' }));
  return (
    <Drawer open onClose={onClose} head={<div className="row" style={{ gap: 6 }}><Status s={v.status} /><Chip tone={healthTone(v.health)} dot={false}>Health {v.health}</Chip></div>} title={<span className="mono">{v.plate}</span>} sub={`${v.year} ${v.make} · ${v.type}`}
      footer={<>{v.status !== 'maintenance' ? <Btn icon="wrench" onClick={() => setStatus('maintenance')}>Send to workshop</Btn> : <Btn icon="circle-check" onClick={() => setStatus('idle')}>Mark available</Btn>}{!v.serviceBooked && v.serviceDueKm < 3000 && <Btn v="primary" icon="calendar-plus" onClick={book}>Book service</Btn>}</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[['Fuel', v.fuel + '%'], ['Odometer', (v.odometer / 1000).toFixed(1) + 'k km'], ['Service', v.serviceDueKm < 0 ? Math.abs(v.serviceDueKm) + ' km over' : v.serviceDueKm.toLocaleString() + ' km']].map(([k, val]) => (
          <div key={k} className="card" style={{ padding: 12, boxShadow: 'none' }}><div className="caps">{k}</div><div className="num-xl" style={{ fontSize: 20, marginTop: 6 }}>{val}</div></div>))}
      </div>
      <div className="caps" style={{ margin: '18px 0 8px' }}>Assigned driver</div>
      {t && t.status === 'on_route' ? <div className="row card" style={{ padding: 12, boxShadow: 'none', gap: 10 }}><Avatar name={d.name} size={34} /><div className="grow"><div style={{ fontWeight: 500 }}>{d.name}</div><div className="muted" style={{ fontSize: 12 }}>On {t.id} · locked while on route</div></div></div> :
        <select className="select" value={v.driverId || ''} onChange={(e) => assign(e.target.value)} aria-label="Assign driver"><option value="">Unassigned</option>{avail.map((x) => <option key={x.id} value={x.id}>{x.name} · {STATUS_TONE[x.status][1]}</option>)}</select>}
      {t && <>
        <div className="caps" style={{ margin: '18px 0 8px' }}>Current trip</div>
        <button className="card row" style={{ padding: 12, boxShadow: 'none', width: '100%', textAlign: 'left', gap: 10 }} onClick={() => nav('/overview?trip=' + t.id)}>
          <Ico n="route" s={18} className="muted" /><div className="grow"><div className="mono" style={{ fontWeight: 500 }}>{t.id}</div><div className="muted" style={{ fontSize: 12 }}>{SG.q.corridor(s, t.corridorId).name} · {Math.round(t.progress * 100)}% · ETA {SG.time.t(t.etaAt)}</div></div><Ico n="chevron-right" s={16} className="muted" />
        </button>
      </>}
      <div className="caps" style={{ margin: '18px 0 8px' }}>Health factors</div>
      <div className="col" style={{ gap: 10 }}>
        {[['Service interval', Math.max(5, Math.min(100, 100 - (v.serviceDueKm < 0 ? 100 : (15000 - v.serviceDueKm) / 150)))], ['Vehicle age', Math.max(10, 100 - (2026 - v.year) * 9)], ['Recent faults', v.health > 80 ? 92 : v.health > 60 ? 70 : 40]].map(([k, val]) => (
          <div key={k}><div className="row" style={{ fontSize: 12.5 }}><span className="grow">{k}</span><span className="mono muted">{Math.round(val)}</span></div><div className={'bar ' + (val > 75 ? 'lime' : val > 50 ? 'amber' : 'danger')} style={{ marginTop: 5 }}><i style={{ width: val + '%' }} /></div></div>))}
      </div>
      <div className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>Last check-in {SG.time.rel(v.lastCheckInAt)} · demo telemetry</div>
    </Drawer>
  );
}

function DriverDrawer({ id, onClose }) {
  const s = useSG();
  const d = id && SG.q.driver(s, id);
  if (!d) return null;
  const trips = s.data.trips.filter((t) => t.driverId === d.id);
  const veh = s.data.vehicles.find((v) => v.driverId === d.id);
  return (
    <Drawer open onClose={onClose} head={<Status s={d.status} />} title={d.name} sub={`${d.years} years driving · ${d.langs.join(', ')}`}
      footer={<><a className="btn btn-outline" href={'tel:' + d.phone.replace(/\s/g, '')}><Ico n="phone" s={16} />Call</a>{trips.find((t) => t.status !== 'completed') && <Btn v="primary" icon="route" onClick={() => nav('/overview?trip=' + trips.find((t) => t.status !== 'completed').id)}>Open current trip</Btn>}</>}>
      <div className="row" style={{ gap: 14 }}>
        <Avatar name={d.name} size={64} />
        <div className="col" style={{ gap: 4 }}><span className="mono">{d.phone}</span><span className="muted mono" style={{ fontSize: 12 }}>Licence {d.licence}</span>{veh && <span className="muted" style={{ fontSize: 12 }}>Usually drives <span className="mono">{veh.plate}</span></span>}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
        {[['Trips', d.trips], ['Check-in rate', d.checkInRate + '%'], ['Years', d.years]].map(([k, val]) => (
          <div key={k} className="card" style={{ padding: 12, boxShadow: 'none' }}><div className="caps">{k}</div><div className="num-xl" style={{ fontSize: 22, marginTop: 6 }}>{val}</div></div>))}
      </div>
      <div className="caps" style={{ margin: '18px 0 8px' }}>Recent trips</div>
      {trips.length === 0 ? <div className="muted" style={{ fontSize: 13 }}>No trips in this demo period.</div> :
        <div className="col" style={{ gap: 6 }}>{trips.map((t) => (
          <div key={t.id} className="row" style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 12, gap: 10 }}>
            <span className="mono" style={{ fontWeight: 500 }}>{t.id}</span><span className="muted grow ellipsis" style={{ fontSize: 12.5 }}>{SG.q.corridor(s, t.corridorId).name}</span><Status s={t.status} /><Status s={t.briefing.status} />
          </div>))}</div>}
      <div className="why-box" style={{ marginTop: 16 }}>Driver app language: <b>{d.langs.includes('Pidgin') ? 'Nigerian Pidgin' : 'English'}</b>. Hausa, Yoruba and Igbo strings are placeholders that need native review.</div>
    </Drawer>
  );
}

function AddVehicleModal({ open, onClose }) {
  const f = useForm({ plate: '', make: '', type: 'Tanker · 33,000 L', year: '2022', odometer: '0' }, { plate: [v8n.req(), v8n.plate()], make: [v8n.req('Enter make and model')], year: [v8n.num(1995, 2027)], odometer: [v8n.num(0, 2000000)] });
  const save = f.submit((vals) => {
    const plate = vals.plate.trim().toUpperCase();
    if (SG.store.get().data.vehicles.some((v) => v.plate === plate)) return toast('That plate is already in the fleet', { tone: 'danger' });
    const id = 'v' + Date.now();
    SG.api.write({ path: '/v1/vehicles', label: 'vehicle added ' + plate, apply: (s) => { s.data.vehicles.unshift({ id, plate, make: vals.make.trim(), type: vals.type, year: +vals.year, status: 'idle', driverId: null, health: 100, fuel: 100, odometer: +vals.odometer, serviceDueKm: 15000, lastCheckInAt: Date.now() }); SG.audit(s, 'Added vehicle', plate, vals.make); } })
      .then((r) => toast(r.queued ? 'Vehicle saved · queued offline' : 'Vehicle added', { body: plate, tone: 'good', action: { label: 'Undo', fn: () => SG.store.set((s) => { s.data.vehicles = s.data.vehicles.filter((v) => v.id !== id); }) } }));
    f.reset(); onClose();
  });
  return (
    <Modal open={open} onClose={onClose} title="Add vehicle" sub="Added vehicles appear in the fleet and can be assigned to trips." icon="truck"
      footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" onClick={save}>Add vehicle</Btn></>}>
      <form onSubmit={save} className="col" style={{ gap: 12 }} noValidate>
        <div className="g-2" style={{ gap: 12 }}>
          <Field label="Plate number" error={f.errors.plate} hint="e.g. KJA-412-XA"><input className={'input mono' + (f.errors.plate ? ' invalid' : '')} value={f.values.plate} onChange={f.set('plate')} placeholder="ABC-123-XY" style={{ textTransform: 'uppercase' }} /></Field>
          <Field label="Year" error={f.errors.year}><input className={'input' + (f.errors.year ? ' invalid' : '')} inputMode="numeric" value={f.values.year} onChange={f.set('year')} /></Field>
        </div>
        <Field label="Make & model" error={f.errors.make}><input className={'input' + (f.errors.make ? ' invalid' : '')} value={f.values.make} onChange={f.set('make')} placeholder="e.g. MAN TGS 33.400" /></Field>
        <div className="g-2" style={{ gap: 12 }}>
          <Field label="Type"><select className="select" value={f.values.type} onChange={f.set('type')}>{['Tanker · 33,000 L', 'Tanker · 45,000 L', 'Flatbed · 40 ft', 'Box truck · 15 t', 'Box truck · 20 t', 'Tipper · 30 t', 'Reefer · 15 t'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Odometer (km)" error={f.errors.odometer}><input className={'input' + (f.errors.odometer ? ' invalid' : '')} inputMode="numeric" value={f.values.odometer} onChange={f.set('odometer')} /></Field>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
function AddDriverModal({ open, onClose }) {
  const f = useForm({ name: '', phone: '+234 ', licence: '', years: '3', lang: 'English' }, { name: [v8n.req('Enter the driver’s full name')], phone: [v8n.req(), v8n.phone()], licence: [v8n.req('Enter licence number')], years: [v8n.num(0, 50)] });
  const save = f.submit((vals) => {
    const id = 'd' + Date.now();
    SG.api.write({ path: '/v1/drivers', label: 'driver added ' + vals.name, apply: (s) => { s.data.drivers.unshift({ id, name: vals.name.trim(), phone: vals.phone.trim(), licence: vals.licence.trim().toUpperCase(), years: +vals.years, langs: ['English', vals.lang].filter((x, i, a) => a.indexOf(x) === i), trips: 0, checkInRate: 100, status: 'available' }); SG.audit(s, 'Added driver', vals.name, ''); } })
      .then((r) => toast(r.queued ? 'Driver saved · queued offline' : 'Driver added', { body: vals.name + ' · invite SMS simulated', tone: 'good', action: { label: 'Undo', fn: () => SG.store.set((s) => { s.data.drivers = s.data.drivers.filter((d) => d.id !== id); }) } }));
    f.reset(); onClose();
  });
  return (
    <Modal open={open} onClose={onClose} title="Add driver" sub="The driver receives an app invite by SMS (simulated)." icon="user-plus"
      footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" onClick={save}>Add driver</Btn></>}>
      <form onSubmit={save} className="col" style={{ gap: 12 }} noValidate>
        <Field label="Full name" error={f.errors.name}><input className={'input' + (f.errors.name ? ' invalid' : '')} value={f.values.name} onChange={f.set('name')} placeholder="e.g. Adebayo Tunde" /></Field>
        <div className="g-2" style={{ gap: 12 }}>
          <Field label="Phone" error={f.errors.phone}><input className={'input mono' + (f.errors.phone ? ' invalid' : '')} value={f.values.phone} onChange={f.set('phone')} inputMode="tel" /></Field>
          <Field label="Licence number" error={f.errors.licence}><input className={'input mono' + (f.errors.licence ? ' invalid' : '')} value={f.values.licence} onChange={f.set('licence')} placeholder="LAG-DL-00000" /></Field>
        </div>
        <div className="g-2" style={{ gap: 12 }}>
          <Field label="Years driving" error={f.errors.years}><input className={'input' + (f.errors.years ? ' invalid' : '')} inputMode="numeric" value={f.values.years} onChange={f.set('years')} /></Field>
          <Field label="App language"><select className="select" value={f.values.lang} onChange={f.set('lang')}>{['English', 'Pidgin', 'Hausa', 'Yoruba', 'Igbo'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        {['Hausa', 'Yoruba', 'Igbo'].includes(f.values.lang) && <div className="why-box" style={{ marginTop: 0 }}>{f.values.lang} strings are placeholders and need native review before go-live.</div>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function RecipientsPanel() {
  const s = useSG();
  const [adding, setAdding] = useState(false);
  const [tests, setTests] = useState({});
  const f = useForm({ name: '', role: '', channel: 'SMS', number: '+234 ' }, { name: [v8n.req()], number: [v8n.req(), v8n.phone()] });
  const test = (r) => {
    setTests((x) => ({ ...x, [r.id]: 'Queued' }));
    if (s.dev.latency === 'offline') { setTimeout(() => setTests((x) => ({ ...x, [r.id]: 'Failed' })), 900); toast('Test not sent', { body: 'You are offline. Will not retry a test.', tone: 'danger' }); return; }
    const d = s.dev.latency === 'slow' ? 2200 : 700;
    setTimeout(() => setTests((x) => ({ ...x, [r.id]: 'Sent' })), d);
    setTimeout(() => {
      const ok = r.id !== 'r3' || Math.random() > 0.5;
      setTests((x) => ({ ...x, [r.id]: ok ? 'Delivered' : 'Failed' }));
      SG.store.set((x) => { SG.log(x, { level: ok ? 'info' : 'error', method: 'POST', path: '/v1/sos/test', status: ok ? 200 : 502, ms: d, msg: `test ${r.channel} → ${r.name} · ${ok ? 'delivered' : 'carrier rejected'}` }); SG.audit(x, 'Sent SOS test', r.name, r.channel); });
      toast(ok ? 'Test delivered (simulated)' : 'Test failed (simulated)', { body: `${r.channel} → ${r.name}`, tone: ok ? 'good' : 'danger' });
    }, d * 2.2);
  };
  const add = f.submit((vals) => {
    const id = 'r' + Date.now();
    SG.api.write({ path: '/v1/sos/recipients', label: 'recipient ' + vals.name, apply: (x) => { x.data.recipients.push({ id, ...vals }); SG.audit(x, 'Added SOS recipient', vals.name, vals.channel); } });
    toast('Recipient added', { body: vals.name, tone: 'good' }); f.reset(); setAdding(false);
  });
  const remove = (r) => {
    const snap = JSON.stringify(s.data.recipients);
    SG.api.write({ method: 'DELETE', path: '/v1/sos/recipients/' + r.id, label: 'remove ' + r.name, status: 204, apply: (x) => { x.data.recipients = x.data.recipients.filter((y) => y.id !== r.id); SG.audit(x, 'Removed SOS recipient', r.name, ''); } });
    toast('Recipient removed', { body: r.name, action: { label: 'Undo', fn: () => SG.store.set((x) => { x.data.recipients = JSON.parse(snap); }) } });
  };
  return (
    <div className="g-main">
      <section className="card">
        <div className="card-h" style={{ paddingBottom: 12 }}><span className="card-t">SOS recipients</span><Chip tone="line" dot={false}>{s.data.recipients.length}</Chip><span className="grow" /><Btn size="sm" v="primary" icon="plus" onClick={() => setAdding(true)}>Add recipient</Btn></div>
        {s.data.recipients.length === 0 ? <Empty icon="users" title="No SOS recipients" body="Add at least two people so a driver’s SOS always reaches someone." /> :
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Name</th><th>Channel</th><th>Number</th><th>Last test</th><th></th></tr></thead>
          <tbody className="stagger">{s.data.recipients.map((r) => (
            <tr key={r.id}>
              <td><div className="row" style={{ gap: 10 }}><Avatar name={r.name} size={30} /><div><div style={{ fontWeight: 500 }}>{r.name}</div><div className="muted" style={{ fontSize: 12 }}>{r.role || '—'}</div></div></div></td>
              <td><span className="chip chip-line" style={{ height: 24 }}><Ico n={r.channel === 'WhatsApp' ? 'message-circle' : r.channel === 'Voice call' ? 'phone-call' : 'message-square'} s={12} />{r.channel}</span></td>
              <td className="mono">{r.number}</td>
              <td>{tests[r.id] ? <Status s={tests[r.id]} /> : <span className="muted">—</span>}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><Btn size="sm" icon="send" onClick={() => test(r)} disabled={tests[r.id] && !['Delivered', 'Failed'].includes(tests[r.id])}>Send test (simulated)</Btn> <button className="icon-btn" style={{ display: 'inline-grid', width: 30, height: 30, verticalAlign: 'middle' }} aria-label={'Remove ' + r.name} onClick={() => remove(r)}><Ico n="trash-2" s={15} /></button></td>
            </tr>))}</tbody></table></div>}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line-2)' }} className="row"><SimTag>SMS, WhatsApp and calls are simulated</SimTag><span className="muted" style={{ fontSize: 12 }}>Numbers are placeholders, client to confirm.</span></div>
      </section>
      <section className="card"><div className="card-h"><span className="card-t">How an SOS is delivered</span></div>
        <div className="card-b">
          <div className="tl">
            <div className="tl-it"><b style={{ fontWeight: 550 }}>Driver holds SOS for 1.5 s</b><div className="muted" style={{ fontSize: 12.5 }}>5 second cancel window, then GPS and trip are attached.</div></div>
            <div className="tl-it ai"><b style={{ fontWeight: 550 }}>Queued → Sent</b><div className="muted" style={{ fontSize: 12.5 }}>Every recipient above, on their channel, in parallel.</div></div>
            <div className="tl-it ok"><b style={{ fontWeight: 550 }}>Delivered or Failed</b><div className="muted" style={{ fontSize: 12.5 }}>Shown per recipient. The app never says “alerted” without a delivery state.</div></div>
            <div className="tl-it warn"><b style={{ fontWeight: 550 }}>No signal</b><div className="muted" style={{ fontSize: 12.5 }}>“Not sent yet. Will retry.” and a tap-to-call button for the control desk.</div></div>
          </div>
          <div className="why-box" style={{ marginTop: 4 }}>{SG_BRAND.notEmergency} Emergency number: <a className="mono" href={'tel:' + s.settings.emergencyNumber} style={{ fontWeight: 600 }}>{s.settings.emergencyNumber}</a></div>
        </div>
      </section>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add SOS recipient" icon="user-plus" footer={<><Btn v="ghost" onClick={() => setAdding(false)}>Cancel</Btn><Btn v="primary" onClick={add}>Add recipient</Btn></>}>
        <form onSubmit={add} className="col" style={{ gap: 12 }} noValidate>
          <Field label="Name" error={f.errors.name}><input className={'input' + (f.errors.name ? ' invalid' : '')} value={f.values.name} onChange={f.set('name')} /></Field>
          <Field label="Role"><input className="input" value={f.values.role} onChange={f.set('role')} placeholder="e.g. Night supervisor" /></Field>
          <div className="g-2" style={{ gap: 12 }}>
            <Field label="Channel"><select className="select" value={f.values.channel} onChange={f.set('channel')}>{['SMS', 'WhatsApp', 'Voice call'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Number" error={f.errors.number}><input className={'input mono' + (f.errors.number ? ' invalid' : '')} value={f.values.number} onChange={f.set('number')} inputMode="tel" /></Field>
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  );
}

function FleetPage() {
  const s = useSG();
  const route = useRoute();
  const tab = route.query.tab || 'vehicles';
  const res = useResource('/v1/fleet');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [addV, setAddV] = useState(false);
  const [addD, setAddD] = useState(false);
  const vs = s.data.vehicles;
  const counts = { all: vs.length, on_trip: vs.filter((v) => v.status === 'on_trip').length, idle: vs.filter((v) => v.status === 'idle').length, maintenance: vs.filter((v) => v.status === 'maintenance' || v.serviceDueKm < 1000).length, offline: vs.filter((v) => v.status === 'offline').length };
  const ql = q.trim().toLowerCase();
  const shown = vs.filter((v) => (filter === 'all' || (filter === 'maintenance' ? (v.status === 'maintenance' || v.serviceDueKm < 1000) : v.status === filter)) && (!ql || (v.plate + v.make + v.type).toLowerCase().includes(ql)));
  const ds = s.data.drivers.filter((d) => !ql || (d.name + d.phone + d.licence).toLowerCase().includes(ql));
  const avgHealth = Math.round(vs.reduce((a, v) => a + v.health, 0) / vs.length);
  const fleetAps = s.data.approvals.filter((a) => a.kind === 'service' && a.status !== 'dismissed');
  return (
    <div className="page-enter">
      <div className="ph">
        <div className="grow"><div className="caps">Operations · Fleet</div><h1>Fleet & drivers</h1><div className="sub">What a dispatcher checks before calling a driver.</div></div>
        <div className="row wrap" style={{ gap: 8 }}><DemoTag />
          {tab === 'drivers' ? <Btn v="primary" icon="user-plus" onClick={() => setAddD(true)}>Add driver</Btn> : tab === 'vehicles' ? <Btn v="primary" icon="plus" onClick={() => setAddV(true)}>Add vehicle</Btn> : null}
        </div>
      </div>
      <section className="card kpis" style={{ marginBottom: 16 }}>
        {[['Vehicles', vs.length, `${counts.on_trip} on trip`], ['Available', counts.idle, 'ready to dispatch'], ['Average health', avgHealth, 'of 100'], ['Service due', vs.filter((v) => v.serviceDueKm < 1500).length, vs.filter((v) => v.serviceDueKm < 0).length + ' overdue']].map(([k, val, sub]) => (
          <div className="kpi" key={k}><div className="caps">{k}</div><div className="v num-xl"><CountUp value={val} /></div><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{sub}</div></div>))}
      </section>
      <div className="row wrap" style={{ gap: 12, marginBottom: 14 }}>
        <Tabs items={SG_NAV.tabs.fleet} urlKey="tab" variant="line" counts={{ vehicles: vs.length, drivers: s.data.drivers.length, recipients: s.data.recipients.length }} ariaLabel="Fleet sections" />
        <span className="grow" />
        {tab !== 'recipients' && <div className="search-in" style={{ width: 'min(280px,100%)' }}><Ico n="search" s={15} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'drivers' ? 'Search drivers…' : 'Search plate, make…'} aria-label="Search" /></div>}
      </div>
      {tab === 'vehicles' && <Guarded res={res} skeleton={<div className="vgrid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ padding: 8 }}><Sk h={112} r={12} /><div style={{ padding: 8 }}><Sk w="50%" h={20} style={{ marginTop: 8 }} /><Sk w="70%" h={10} style={{ marginTop: 8 }} /><Sk h={30} style={{ marginTop: 14 }} /></div></div>)}</div>}>
        <div className="g-main">
          <div style={{ minWidth: 0 }}>
            <Tabs items={[{ id: 'all', label: 'All' }, { id: 'on_trip', label: 'On trip' }, { id: 'idle', label: 'Available' }, { id: 'maintenance', label: 'Service' }, { id: 'offline', label: 'Offline' }]} value={filter} onChange={setFilter} counts={counts} ariaLabel="Vehicle status" style={{ marginBottom: 14 }} />
            {shown.length === 0 ? <div className="card"><Empty icon="truck" title="No vehicles match" body={ql ? `Nothing matches “${q}”.` : 'No vehicles in this state right now.'} action={<Btn onClick={() => { setQ(''); setFilter('all'); }}>Clear filters</Btn>} /></div> :
              <div className="vgrid stagger" key={filter + ql}>{shown.map((v) => <VehicleCard key={v.id} v={v} onOpen={(id) => setQuery('v', id)} />)}</div>}
          </div>
          <div className="col" style={{ gap: 12 }}>
            <section className="brief" style={{ padding: 16 }}>
              <div className="row"><span className="agent"><LogoMark size={26} /></span><div className="grow"><div style={{ fontWeight: 550, fontSize: 13 }}>Fleet health</div><div className="caps" style={{ fontSize: 10, color: 'var(--violet-ink)' }}>Predictive maintenance</div></div><SimTag /></div>
              <div style={{ fontSize: 17, marginTop: 10, letterSpacing: '-.015em' }} className="tw-pretty">{vs.filter((v) => v.serviceDueKm < 1500).length} vehicles need attention this week. Booking now avoids roadside stops on long corridors.</div>
            </section>
            {fleetAps.map((a) => <ApprovalCard key={a.id} ap={a} />)}
            {vs.filter((v) => v.serviceDueKm < 1500 && !v.serviceBooked && !fleetAps.some((a) => a.target === v.id)).slice(0, 2).map((v) => (
              <div key={v.id} className="appr"><div className="row" style={{ gap: 10 }}><span className="tag"><Ico n="wrench" s={12} /></span><div className="grow"><div style={{ fontWeight: 550, fontSize: 13.5 }}><span className="mono">{v.plate}</span> {v.serviceDueKm < 0 ? 'is overdue' : 'service due'}</div><div className="muted" style={{ fontSize: 12.5 }}>{v.serviceDueKm < 0 ? `${Math.abs(v.serviceDueKm)} km past interval · health ${v.health}` : `${v.serviceDueKm} km left · health ${v.health}`}</div></div></div>
                <div className="row" style={{ marginTop: 10, gap: 6 }}><Btn size="sm" v="ink" onClick={() => setQuery('v', v.id)}>Review</Btn></div></div>))}
          </div>
        </div>
      </Guarded>}
      {tab === 'drivers' && <Guarded res={res}>
        <section className="card">
          {ds.length === 0 ? <Empty icon="user-search" title="No drivers match" body={`Nothing matches “${q}”.`} /> :
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Driver</th><th>Status</th><th>Phone</th><th>Experience</th><th>Check-in rate</th><th>Languages</th><th></th></tr></thead>
            <tbody className="stagger">{ds.map((d) => (
              <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setQuery('d', d.id)}>
                <td><div className="row" style={{ gap: 10 }}><Avatar name={d.name} size={32} /><div><div style={{ fontWeight: 500 }}>{d.name}</div><div className="mono muted" style={{ fontSize: 11.5 }}>{d.licence}</div></div></div></td>
                <td><Status s={d.status} /></td>
                <td className="mono">{d.phone}</td>
                <td>{d.years} yrs · <span className="muted">{d.trips} trips</span></td>
                <td style={{ minWidth: 130 }}><div className="row" style={{ gap: 8 }}><div className={'bar grow ' + (d.checkInRate >= 92 ? 'lime' : d.checkInRate >= 88 ? 'amber' : 'danger')}><i style={{ width: d.checkInRate + '%' }} /></div><span className="mono muted" style={{ fontSize: 12 }}>{d.checkInRate}%</span></div></td>
                <td className="muted" style={{ fontSize: 12.5 }}>{d.langs.join(', ')}</td>
                <td style={{ textAlign: 'right' }}><Btn size="sm" onClick={(e) => { e.stopPropagation(); setQuery('d', d.id); }}>Profile</Btn></td>
              </tr>))}</tbody></table></div>}
        </section>
      </Guarded>}
      {tab === 'recipients' && <RecipientsPanel />}
      <VehicleDrawer id={route.query.v} onClose={() => setQuery('v', null)} />
      <DriverDrawer id={route.query.d} onClose={() => setQuery('d', null)} />
      <AddVehicleModal open={addV} onClose={() => setAddV(false)} />
      <AddDriverModal open={addD} onClose={() => setAddD(false)} />
    </div>
  );
}

Object.assign(window, { FleetPage, useForm, v8n, VehicleDrawer, DriverDrawer });
