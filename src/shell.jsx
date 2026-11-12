/* src/shell.jsx — sidebar / icon rail / bottom bar, header, alerts bell,
   command palette, demo role switcher, banners, login, /demo. */

const DEMO_USERS = {
  dispatcher:     { name: 'Ngozi Adebayo',  email: 'ngozi@apex.example',   title: 'Operations dispatcher' },
  driver:         { name: 'Emeka Okafor',   email: 'emeka@apex.example',   title: 'Driver · KJA-412-XA', driverId: 'd1' },
  org_admin:      { name: 'Folake Ogun',    email: 'folake@apex.example',  title: 'Fleet manager' },
  platform_admin: { name: 'Aisha Lawal',    email: 'aisha@safegrid.example', title: 'SafeGrid operations' },
};
function signIn(role) {
  const u = DEMO_USERS[role];
  SG.store.set((s) => {
    s.session = { role, ...u, at: Date.now() };
    SG.audit(s, 'Signed in', SG_NAV.roles[role].label, 'Demo account');
    SG.log(s, { method: 'POST', path: '/v1/session', status: 200, ms: 120, msg: 'demo sign-in · ' + role });
  });
  nav(SG_NAV.roles[role].home);
}
function signOut() { SG.store.set((s) => { SG.audit(s, 'Signed out', '', ''); s.session = null; }); nav('/login'); }
function switchRole(role) {
  if (!SG_BRAND.demoMode) return;
  signIn(role);
  toast('Switched to ' + SG_NAV.roles[role].label, { body: 'Demo mode · instant switch, no password', icon: 'repeat' });
}

function navFor(role) {
  return SG_NAV.items.filter((i) => i.roles.includes(role) && !(i.demoOnlyForNonPlatform && role !== 'platform_admin' && !SG_BRAND.demoMode));
}
function badgeValue(key, s) { if (key === 'sosOpen') return s.data.sos.filter((x) => x.status === 'open').length; return 0; }

function setTheme(t) { SG.store.set((s) => { s.ui.theme = t; }); }
function applyTheme(ui) {
  document.documentElement.classList.toggle('dark', ui.theme === 'dark');
  document.documentElement.classList.toggle('hc', !!ui.hc);
}

/* ── Demo role menu ─────────────────────────────────── */
function DemoMenu({ onClose, anchor = 'bottom' }) {
  const s = useSG();
  const lat = s.dev.latency;
  return (
    <div className="popover" style={anchor === 'bottom' ? { left: 8, bottom: 52, width: 290, transformOrigin: 'bottom left' } : { right: 0, top: 46, width: 290 }} role="menu">
      <div style={{ padding: '12px 14px 6px' }} className="row"><span className="caps">Demo mode</span><span className="grow" /><DemoTag>No real login</DemoTag></div>
      <div style={{ padding: '0 6px' }}>
        {Object.entries(SG_NAV.roles).map(([id, r]) => (
          <button key={id} role="menuitemradio" aria-checked={s.session && s.session.role === id} className={'menu-item' + (s.session && s.session.role === id ? ' sel' : '')} onClick={() => { switchRole(id); onClose(); }}>
            <Ico n={r.icon} s={16} /><span className="grow"><span style={{ display: 'block', fontWeight: 500 }}>{r.label}</span><span className="muted" style={{ fontSize: 11.5 }}>{DEMO_USERS[id].name}</span></span>
            {s.session && s.session.role === id && <Ico n="check" s={15} />}
          </button>
        ))}
      </div>
      <hr className="hair" style={{ margin: '6px 0' }} />
      <div style={{ padding: '4px 14px 8px' }}>
        <div className="caps" style={{ marginBottom: 6 }}>API latency <SimTag /></div>
        <Tabs items={[{ id: 'normal', label: 'Normal' }, { id: 'slow', label: 'Slow 3G' }, { id: 'offline', label: 'Offline' }]} value={lat} onChange={(v) => setLatency(v)} ariaLabel="API latency" />
      </div>
      <div style={{ padding: '0 6px 6px' }}>
        <button className="menu-item" onClick={() => { nav('/demo'); onClose(); }}><Ico n="layout-panel-top" s={16} />All demo accounts</button>
        <button className="menu-item" onClick={() => { resetDemo(); onClose(); }}><Ico n="rotate-ccw" s={16} />Reset demo data</button>
      </div>
    </div>
  );
}
function setLatency(v) {
  const prev = SG.store.get().dev.latency;
  SG.store.set((s) => { s.dev.latency = v; SG.log(s, { level: v === 'offline' ? 'warn' : 'info', method: 'SYS', path: '/dev/latency', status: 200, msg: 'latency → ' + v }); });
  if (v === 'offline') toast('You’re offline (simulated)', { body: 'Changes are queued on this device.', icon: 'wifi-off' });
  else if (prev === 'offline') {
    const n = SG.store.get().queue.length;
    toast('Back online', { body: n ? `Syncing ${n} queued ${n === 1 ? 'change' : 'changes'}…` : 'Nothing queued.', icon: 'wifi', tone: 'good' });
    if (n) SG.api.flush().then(() => { const f = SG.store.get().queue.length; toast(f ? `${f} item failed to sync` : 'Offline queue synced', { tone: f ? 'danger' : 'good', icon: f ? 'circle-alert' : 'circle-check' }); });
  }
}
function resetDemo() {
  const snap = JSON.stringify(SG.store.get());
  SG.store.reset(true);
  toast('Demo data reset', { body: 'Trips, incidents and SOS restored to the starting scene.', icon: 'rotate-ccw', action: { label: 'Undo', fn: () => { SG.store.set(() => JSON.parse(snap)); } } });
}

/* ── Sidebar ────────────────────────────────────────── */
function Sidebar({ route }) {
  const s = useSG();
  const [demo, setDemo] = useState(false);
  const ref = useRef(); useOutside(ref, demo, () => setDemo(false));
  const role = s.session.role;
  const items = navFor(role);
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sb-top">
        <LogoMark size={32} />
        <span className="sb-word">SafeGrid</span>
        <span className="grow" />
        <button className="icon-btn sb-collapse sb-hide" style={{ width: 30, height: 30 }} aria-label="Collapse sidebar" title="Collapse sidebar" onClick={() => SG.store.set((x) => { x.ui.collapsed = !x.ui.collapsed; })}><Ico n="panel-left-close" s={17} /></button>
      </div>
      {s.ui.collapsed && <button className="icon-btn sb-collapse" style={{ margin: '0 auto 10px' }} aria-label="Expand sidebar" title="Expand sidebar" onClick={() => SG.store.set((x) => { x.ui.collapsed = false; })}><Ico n="panel-left-open" s={17} /></button>}
      <div className="sb-org">
        <span className="avatar" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 11, background: 'var(--ink)', color: 'var(--surface)', border: 0 }}>{role === 'platform_admin' ? 'SG' : 'AL'}</span>
        <div className="grow" style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 500, fontSize: 13 }}>{role === 'platform_admin' ? 'SafeGrid Platform' : SG_BRAND.orgName}</div><div className="muted ellipsis" style={{ fontSize: 11.5 }}>{role === 'platform_admin' ? 'All organisations' : '3 corridors · Pilot'}</div></div>
      </div>
      <nav className="sb-scroll">
        {SG_NAV.groups.map((g) => {
          const gi = items.filter((i) => i.group === g.id);
          if (!gi.length) return null;
          return <div key={g.id}>
            <div className="sb-group caps"><span>{g.label}</span></div>
            {gi.map((i) => {
              const b = i.badge ? badgeValue(i.badge, s) : 0;
              return <a key={i.id} href={'#' + i.path} className={'nav-item' + (route.path.startsWith(i.path) ? ' active' : '')} title={i.label} aria-current={route.path.startsWith(i.path) ? 'page' : undefined}>
                <Ico n={i.icon} s={18} /><span className="nav-label">{i.label}</span>
                {b > 0 && <span className="nav-badge pulse">{b}</span>}
              </a>;
            })}
          </div>;
        })}
      </nav>
      <div className="sb-bottom" ref={ref} style={{ position: 'relative' }}>
        {SG_BRAND.demoMode && <button className="demo-pill" onClick={() => setDemo((x) => !x)} aria-haspopup="menu" aria-expanded={demo} title="Demo mode: switch role">
          <span className="dot" /><span className="nav-label">Demo mode · {SG_NAV.roles[role].short}</span><Ico n="chevrons-up-down" s={14} className="sb-hide" />
        </button>}
        {demo && <DemoMenu onClose={() => setDemo(false)} />}
        <div className="row" style={{ gap: 10, padding: '4px 2px' }}>
          <Avatar name={s.session.name} size={32} />
          <div className="grow sb-hide" style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontSize: 13, fontWeight: 500 }}>{s.session.name}</div><div className="muted ellipsis" style={{ fontSize: 11.5 }}>{s.session.title}</div></div>
          <button className="icon-btn sb-hide" style={{ width: 30, height: 30 }} aria-label="Sign out" title="Sign out" onClick={signOut}><Ico n="log-out" s={16} /></button>
        </div>
      </div>
    </aside>
  );
}

/* ── Alerts bell (dropdown, never blocking) ─────────── */
const NOTE_ICON = { alert: ['triangle-alert', 'var(--amber-ink)'], checkin: ['map-pin-check', 'var(--violet-ink)'], trip: ['route', 'var(--ink-2)'], good: ['circle-check', '#7FA800'], sos: ['siren', 'var(--danger)'], info: ['info', 'var(--muted)'] };
function Bell({ align = 'right' }) {
  const s = useSG((x) => x.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(); useOutside(ref, open, () => setOpen(false));
  const unread = s.notifications.filter((n) => !n.read).length;
  useNow(30000);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <IconBtn n="bell" label={`Alerts${unread ? ', ' + unread + ' unread' : ''}`} badge={unread ? (unread > 9 ? '9+' : unread) : null} onClick={() => setOpen((x) => !x)} aria-expanded={open} />
      {open && <div className="popover" style={{ [align]: 0, top: 46, width: 'min(380px, calc(100vw - 24px))' }}>
        <div className="row" style={{ padding: '14px 16px 10px' }}><span style={{ fontWeight: 550 }}>Alerts</span>{unread > 0 && <Chip tone="violet" dot={false}>{unread} new</Chip>}<span className="grow" />
          <button className="btn btn-ghost btn-sm" onClick={() => SG.store.set((x) => x.notifications.forEach((n) => (n.read = true)))}>Mark all read</button></div>
        <hr className="hair" />
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: 6 }}>
          {s.notifications.length === 0 && <Empty icon="bell-off" title="All quiet" body="New check-ins, reports and SOS alerts appear here as they arrive." />}
          {s.notifications.slice(0, 30).map((n) => { const [ic, col] = NOTE_ICON[n.kind] || NOTE_ICON.info; return (
            <button key={n.id} className="menu-item" style={{ alignItems: 'flex-start', padding: '10px' }} onClick={() => { SG.store.set((x) => { const m = x.notifications.find((y) => y.id === n.id); if (m) m.read = true; }); if (n.link) nav(n.link); setOpen(false); }}>
              <span style={{ color: col, marginTop: 1 }}><Ico n={ic} s={16} /></span>
              <span className="grow" style={{ minWidth: 0 }}><span style={{ display: 'block', fontWeight: n.read ? 400 : 550 }}>{n.title}</span><span className="muted" style={{ fontSize: 12 }}>{n.body}</span></span>
              <span className="muted mono" style={{ fontSize: 11 }}>{SG.time.t(n.at)}</span>
              {!n.read && <span style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--violet)', marginTop: 6 }} />}
            </button>); })}
        </div>
      </div>}
    </div>
  );
}

/* ── Header ─────────────────────────────────────────── */
function Header({ onCmd }) {
  const s = useSG((x) => x.ui.theme + x.dev.latency + x.queue.length);
  const [sc, setSc] = useState(false);
  useEffect(() => { const f = () => setSc(window.scrollY > 4); window.addEventListener('scroll', f); return () => window.removeEventListener('scroll', f); }, []);
  const now = useNow(30000);
  const dark = s.ui.theme === 'dark';
  return (
    <header className={'header' + (sc ? ' scrolled' : '')}>
      <button className="search-btn" onClick={onCmd} aria-label="Search and commands"><Ico n="search" s={16} /><span className="grow" style={{ textAlign: 'left' }}>Search trips, plates, drivers, incidents…</span><span className="kbd">⌘K</span></button>
      <span className="grow" />
      {s.queue.length > 0 && <Chip tone="amber"><span>Offline queue ({s.queue.length})</span></Chip>}
      {s.dev.latency !== 'normal' && <Chip tone={s.dev.latency === 'offline' ? 'amber' : 'violet'}>{s.dev.latency === 'offline' ? 'Offline' : 'Slow 3G'} · simulated</Chip>}
      <span className="muted mono" style={{ fontSize: 12 }} title="West Africa Time">{SG.time.wat(now)}</span>
      <button className={'btn btn-outline btn-sm btn-pill'} onClick={() => setTheme(dark ? 'light' : 'dark')} aria-pressed={dark} title="Night shift (dark mode)"><Ico n={dark ? 'sun' : 'moon'} s={14} />Night shift</button>
      <Bell />
      <a className="icon-btn" href={'tel:' + SG.store.get().settings.emergencyNumber} title={`Emergency ${SG.store.get().settings.emergencyNumber} · SafeGrid is not an emergency service`} aria-label="Call emergency number"><Ico n="phone" /></a>
    </header>
  );
}

/* ── Phone top bar + account sheet ──────────────────── */
function MobileTop({ onCmd }) {
  const s = useSG();
  const [acct, setAcct] = useState(false);
  return (
    <div className="m-topbar">
      <LogoMark size={28} />
      <span style={{ fontWeight: 600, letterSpacing: '-.02em' }}>SafeGrid</span>
      <span className="grow" />
      {s.queue.length > 0 && <Chip tone="amber">Queue {s.queue.length}</Chip>}
      <IconBtn n="search" label="Search" onClick={onCmd} />
      <Bell />
      <button onClick={() => setAcct(true)} aria-label="Account menu"><Avatar name={s.session.name} size={32} /></button>
      <Drawer open={acct} onClose={() => setAcct(false)} title={s.session.name} sub={s.session.title}>
        <div className="col" style={{ gap: 4 }}>
          <button className="menu-item" onClick={() => setTheme(s.ui.theme === 'dark' ? 'light' : 'dark')}><Ico n="moon" s={16} /><span className="grow">Night shift</span><Toggle on={s.ui.theme === 'dark'} onChange={() => {}} label="Night shift" /></button>
          <a className="menu-item" href={'tel:' + s.settings.emergencyNumber}><Ico n="phone" s={16} /><span className="grow">Emergency {s.settings.emergencyNumber}</span></a>
          <button className="menu-item" onClick={signOut}><Ico n="log-out" s={16} />Sign out</button>
        </div>
        {SG_BRAND.demoMode && <div className="card" style={{ marginTop: 16, padding: 14, background: 'var(--violet-50)', borderColor: 'var(--violet-100)' }}>
          <div className="row" style={{ marginBottom: 8 }}><span className="caps" style={{ color: 'var(--violet-ink)' }}>Demo mode · switch role</span></div>
          {Object.entries(SG_NAV.roles).map(([id, r]) => (
            <button key={id} className={'menu-item' + (s.session.role === id ? ' sel' : '')} style={{ minHeight: 48 }} onClick={() => { switchRole(id); setAcct(false); }}><Ico n={r.icon} s={16} /><span className="grow">{r.label}</span>{s.session.role === id && <Ico n="check" s={15} />}</button>
          ))}
          <div className="caps" style={{ margin: '10px 0 6px' }}>API latency</div>
          <Tabs items={[{ id: 'normal', label: 'Normal' }, { id: 'slow', label: 'Slow 3G' }, { id: 'offline', label: 'Offline' }]} value={s.dev.latency} onChange={setLatency} />
          <button className="menu-item" style={{ marginTop: 6 }} onClick={() => { resetDemo(); setAcct(false); }}><Ico n="rotate-ccw" s={16} />Reset demo data</button>
        </div>}
      </Drawer>
    </div>
  );
}
function BottomBar({ route }) {
  const s = useSG();
  const role = s.session.role;
  const ids = SG_NAV.mobileTabs[role] || [];
  const items = ids.map((id) => SG_NAV.items.find((i) => i.id === id)).filter(Boolean);
  const [more, setMore] = useState(false);
  const rest = navFor(role).filter((i) => !ids.includes(i.id));
  return (
    <nav className="bottombar" aria-label="Tabs">
      {items.map((i) => { const b = i.badge ? badgeValue(i.badge, s) : 0; return (
        <a key={i.id} href={'#' + i.path} className={'bb-item' + (route.path.startsWith(i.path) ? ' active' : '')}><span className="bb-ico"><Ico n={i.icon} s={20} /></span>{i.short}{b > 0 && <span className="nav-badge pulse">{b}</span>}</a>); })}
      {rest.length > 0 && <button className="bb-item" onClick={() => setMore(true)}><span className="bb-ico"><Ico n="ellipsis" s={20} /></span>More</button>}
      <Drawer open={more} onClose={() => setMore(false)} title="More">
        {rest.map((i) => <a key={i.id} href={'#' + i.path} className="menu-item" style={{ minHeight: 52 }} onClick={() => setMore(false)}><Ico n={i.icon} s={18} /><span className="grow">{i.label}</span><Ico n="chevron-right" s={16} /></a>)}
      </Drawer>
    </nav>
  );
}

/* ── Banners: SOS, offline, slow ────────────────────── */
function Banners() {
  const s = useSG();
  const open = s.data.sos.filter((x) => x.status === 'open');
  const unseen = open.filter((x) => !s.ui.sosSeen.includes(x.id));
  const role = s.session && s.session.role;
  const showSos = role && role !== 'driver' && role !== 'platform_admin' && unseen.length > 0;
  return <>
    {showSos && unseen.slice(0, 1).map((x) => { const d = SG.q.driver(s, x.driverId), v = SG.q.vehicle(s, x.vehicleId), c = SG.q.corridor(s, x.corridorId); return (
      <div key={x.id} className="banner banner-sos" role="alert">
        <span className="ring" /><Ico n="siren" s={17} />
        <span className="grow"><b>SOS {x.id}</b> · {d.name} · <span className="mono">{v.plate}</span> · {c.name} · {SG.time.rel(x.atTime)}</span>
        <button className="btn btn-sm" style={{ background: '#fff', color: 'var(--danger-ink)' }} onClick={() => nav('/sos?focus=' + x.id)}>Open SOS log</button>
        <button className="btn btn-sm" style={{ color: '#fff' }} onClick={() => SG.store.set((z) => { z.ui.sosSeen.push(x.id); })}>Hide</button>
      </div>); })}
    {s.dev.latency === 'offline' && <div className="banner banner-off" role="status"><Ico n="wifi-off" s={16} /><span className="grow">Offline (simulated). Showing the last data on this device. {s.queue.length ? `${s.queue.length} ${s.queue.length === 1 ? 'change' : 'changes'} waiting to sync.` : 'New changes will be queued.'}</span><button className="btn btn-sm btn-outline" onClick={() => setLatency('normal')}>Go back online</button></div>}
    {s.dev.latency === 'slow' && <div className="banner banner-slow" role="status"><Ico n="gauge" s={16} /><span className="grow">Slow network (simulated Slow 3G). Requests take 2–3 s.</span><button className="btn btn-sm btn-ghost" onClick={() => setLatency('normal')}>Reset</button></div>}
  </>;
}

/* ── Command palette ────────────────────────────────── */
function CommandPalette({ open, onClose }) {
  const s = useSG();
  const [q, setQ] = useState('');
  const [k, setK] = useState(0);
  const inRef = useRef();
  useEffect(() => { if (open) { setQ(''); setK(0); setTimeout(() => inRef.current && inRef.current.focus(), 10); } }, [open]);
  useEsc(open, onClose);
  const role = s.session && s.session.role;
  const items = useMemo(() => {
    if (!role) return [];
    const out = [];
    navFor(role).forEach((i) => out.push({ g: 'Go to', icon: i.icon, label: i.label, run: () => nav(i.path) }));
    out.push({ g: 'Actions', icon: 'moon', label: 'Toggle Night shift', kw: 'dark theme', run: () => setTheme(s.ui.theme === 'dark' ? 'light' : 'dark') });
    out.push({ g: 'Actions', icon: 'panel-left', label: 'Toggle sidebar', run: () => SG.store.set((x) => { x.ui.collapsed = !x.ui.collapsed; }) });
    if (SG_BRAND.demoMode) {
      Object.entries(SG_NAV.roles).forEach(([id, r]) => out.push({ g: 'Demo · role', icon: r.icon, label: 'Switch role → ' + r.label, kw: 'role demo', run: () => switchRole(id) }));
      ['normal', 'slow', 'offline'].forEach((l) => out.push({ g: 'Demo · network', icon: l === 'offline' ? 'wifi-off' : 'gauge', label: 'API latency → ' + { normal: 'Normal', slow: 'Slow 3G', offline: 'Offline' }[l], kw: 'latency network', run: () => setLatency(l) }));
      out.push({ g: 'Demo', icon: 'rotate-ccw', label: 'Reset demo data', run: resetDemo });
    }
    out.push({ g: 'Account', icon: 'log-out', label: 'Sign out', run: signOut });
    if (role !== 'driver') {
      s.data.trips.forEach((t) => out.push({ g: 'Trips', icon: 'route', label: `${t.id} · ${SG.q.corridor(s, t.corridorId).name}`, kw: SG.q.driver(s, t.driverId).name + ' ' + t.vehicleIds.map((v) => SG.q.vehicle(s, v).plate).join(' '), mono: true, run: () => nav('/overview?trip=' + t.id) }));
      s.data.vehicles.forEach((v) => out.push({ g: 'Vehicles', icon: 'truck', label: `${v.plate} · ${v.make}`, kw: v.type, run: () => nav('/fleet?tab=vehicles&v=' + v.id) }));
      s.data.drivers.forEach((d) => out.push({ g: 'Drivers', icon: 'user', label: d.name, kw: d.phone, run: () => nav('/fleet?tab=drivers&d=' + d.id) }));
      s.data.incidents.forEach((i) => out.push({ g: 'Incidents', icon: 'triangle-alert', label: `${i.id} · ${i.category}`, kw: i.location + ' ' + i.status, run: () => nav('/incidents?i=' + i.id) }));
    }
    return out;
  }, [role, s.data, s.ui.theme, open]);
  const ql = q.trim().toLowerCase();
  const filtered = (ql ? items.filter((i) => (i.label + ' ' + (i.kw || '') + ' ' + i.g).toLowerCase().includes(ql)) : items.filter((i) => !['Trips', 'Vehicles', 'Drivers', 'Incidents'].includes(i.g))).slice(0, 40);
  useEffect(() => setK(0), [q]);
  if (!open) return null;
  const run = (i) => { onClose(); setTimeout(i.run, 10); };
  let lastG = null;
  return ReactDOM.createPortal(<>
    <div className="scrim" onClick={onClose} style={{ zIndex: 90 }} />
    <div className="cmdk" role="dialog" aria-label="Command palette">
      <div className="cmdk-in"><Ico n="search" s={18} className="muted" />
        <input ref={inRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or type a command… try “role” or a plate" aria-label="Search"
          onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setK((x) => Math.min(filtered.length - 1, x + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setK((x) => Math.max(0, x - 1)); } if (e.key === 'Enter' && filtered[k]) run(filtered[k]); }} />
        <span className="kbd">esc</span></div>
      <div className="cmdk-list">
        {filtered.length === 0 && <Empty icon="search-x" title="No matches" body={`Nothing found for “${q}”. Try a plate like KJA-412-XA or a name.`} />}
        {filtered.map((i, idx) => { const head = i.g !== lastG; lastG = i.g; return (
          <Fragment key={i.g + i.label}>
            {head && <div className="cmdk-g caps">{i.g}</div>}
            <button className={'menu-item' + (idx === k ? ' kb' : '')} onMouseEnter={() => setK(idx)} onClick={() => run(i)}><Ico n={i.icon} s={16} className="muted" /><span className={'grow ellipsis' + (i.mono ? ' mono' : '')}>{i.label}</span>{idx === k && <Ico n="corner-down-left" s={14} className="muted" />}</button>
          </Fragment>); })}
      </div>
    </div>
  </>, document.body);
}

/* ── Phase placeholder (honest, not dead) ───────────── */
function ComingPhase({ item }) {
  const plans = {
    map: 'MapLibre map with OSM tiles and an SVG fallback, three corridors, gliding vehicles, verified vs pending markers, clustering, layer toggles, context card and trip timeline.',
    trips: 'Trip table with filters, Create New Trip & Briefing wizard, convoy mode, briefing statuses and the trip detail page with check-in timeline.',
    incidents: 'Incident list, map and filters, Submit Incident Report with photo preview, moderation queue and time-of-day heatmap.',
    sos: 'Control-room SOS log with per-recipient delivery, Mark Resolved with required note and sound toggle.',
    driver: 'Phone-first driver app: briefing acknowledgement, 1-Tap Check-In, Report Road Incident, hold-to-send SOS, offline queue and PWA shell.',
    exports: 'Browser-generated CSV with disclaimer and freshness stamp, printable summary and weekly corridor report.',
    intelligence: 'Morning brief, briefing drafts, Ask SafeGrid chat and approval cards. All labelled simulated.',
    settings: 'Organisation profile, users & roles matrix, corridors, notification rules, integrations and audit log.',
    admin: 'Organisations, incident moderation and platform health.',
    developer: 'Simulated server log, latency toggle, database sync and webhook tester.',
  };
  return (
    <div className="page-enter">
      <div className="ph"><div><div className="caps">{SG_NAV.groups.find((g) => g.id === item.group).label}</div><h1>{item.label}</h1></div></div>
      <div className="card"><Empty icon={item.icon} title={`Ships in Phase ${item.phase}`} body={plans[item.id]} action={<Btn v="outline" icon="arrow-left" onClick={() => nav(SG_NAV.roles[SG.store.get().session.role].home === item.path ? '/fleet' : SG_NAV.roles[SG.store.get().session.role].home)}>Back to {SG.store.get().session.role === 'platform_admin' ? 'Fleet' : 'Overview'}</Btn>} /></div>
    </div>
  );
}

/* ── Login (mock) ───────────────────────────────────── */
function Login() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const hit = Object.entries(DEMO_USERS).find(([, u]) => u.email === email.trim().toLowerCase());
    if (!email.trim()) return setErr('Enter your work email.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('That doesn’t look like an email address.');
    if (!hit) return setErr('No demo account for that email. Pick one of the demo accounts below.');
    signIn(hit[0]);
  };
  return (
    <div className="auth">
      <div className="auth-side">
        <Logo size={34} variant="ink" color="#fff" />
        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: '-.035em', lineHeight: 1.08, maxWidth: 480 }}>Know your corridor before your trucks do.</div>
          <div style={{ marginTop: 14, opacity: .8, maxWidth: 440, fontSize: 14.5 }} className="tw-pretty">Verified incident reports on Nigeria’s freight corridors, a route-risk briefing before every dispatch, and an SOS your drivers can trust.</div>
        </div>
        <LoginArt />
        <div className="row" style={{ marginTop: 28, fontSize: 12, opacity: .7 }}><span>Report</span>→<span>Verify</span>→<span>Brief</span>→<span>Dispatch</span></div>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ width: 'min(400px,100%)' }} className="page-enter">
          <div className="row" style={{ marginBottom: 28 }}><span className="mobile-only-logo"><LogoMark size={34} /></span></div>
          <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-.03em', margin: 0 }}>Sign in to SafeGrid</h1>
          <p className="muted" style={{ marginTop: 6 }}>Demo environment. No passwords, nothing leaves this browser.</p>
          <form onSubmit={submit} className="col" style={{ gap: 12, marginTop: 20 }} noValidate>
            <Field label="Work email" error={err}><input className={'input' + (err ? ' invalid' : '')} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} placeholder="you@company.com" autoComplete="email" /></Field>
            <Btn v="primary" size="lg" type="submit" iconR="arrow-right">Continue</Btn>
          </form>
          {SG_BRAND.demoMode && <>
            <div className="row" style={{ margin: '26px 0 10px' }}><span className="caps">Demo accounts</span><span className="grow hair" /></div>
            <div className="col" style={{ gap: 8 }}>
              {Object.entries(SG_NAV.roles).map(([id, r]) => (
                <button key={id} className="role-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '12px 14px' }} onClick={() => signIn(id)}>
                  <span className="role-ico" style={{ width: 34, height: 34 }}><Ico n={r.icon} s={17} /></span>
                  <span className="grow"><span style={{ display: 'block', fontWeight: 500 }}>{r.label}</span><span className="muted mono" style={{ fontSize: 11.5 }}>{DEMO_USERS[id].email}</span></span>
                  <Ico n="arrow-right" s={16} className="muted" />
                </button>
              ))}
            </div>
          </>}
          <p className="muted" style={{ fontSize: 12, marginTop: 24 }}>{SG_BRAND.notEmergency} <a href={'tel:' + SG_BRAND.emergencyNumber} style={{ color: 'var(--danger-ink)', fontWeight: 500 }}>Call {SG_BRAND.emergencyNumber}</a></p>
        </div>
      </div>
    </div>
  );
}
function LoginArt() {
  // calm route line with two trucks gliding along it
  const d = 'M -20 150 C 80 60, 160 220, 260 130 S 420 40, 520 110';
  return (
    <svg viewBox="0 0 500 200" style={{ width: '100%', marginTop: 32, overflow: 'visible' }} aria-hidden="true">
      <path d={d} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="10" strokeLinecap="round" />
      <path d={d} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      {[[0, 's'], [9, 'm']].map(([delay, k]) => (
        <g key={k} style={{ offsetPath: `path("${d}")`, animation: `glide 22s ${-delay}s linear infinite`, offsetRotate: 'auto' }}>
          <rect x="-11" y="-6" width="22" height="12" rx="4" fill="#fff" /><rect x="5" y="-6" width="6" height="12" rx="2" fill="#0E0E12" />
        </g>
      ))}
      <g transform="translate(262,130)"><circle r="16" fill="rgba(240,72,72,.2)"><animate attributeName="r" values="8;20;8" dur="3s" repeatCount="indefinite" /></circle><circle r="6" fill="#F04848" stroke="#fff" strokeWidth="2" /></g>
      <g transform="translate(420,62)"><circle r="6" fill="none" stroke="#C8F23C" strokeWidth="2" /><circle r="2.5" fill="#C8F23C" /></g>
    </svg>
  );
}

/* ── /demo page ─────────────────────────────────────── */
function DemoPage() {
  const s = useSG();
  if (!SG_BRAND.demoMode) return <div className="content"><Empty icon="lock" title="Demo mode is off" body="Set demoMode: true in config/brand.js to enable demo accounts." /></div>;
  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }} className="page-enter">
        <div className="row"><Logo size={32} /><span className="grow" /><DemoTag /></div>
        <h1 style={{ fontSize: 34, fontWeight: 300, letterSpacing: '-.035em', margin: '40px 0 6px' }}>Pick a role to explore</h1>
        <p className="muted" style={{ margin: 0 }}>Every role sees its own navigation. Switch any time from the Demo mode pill or with ⌘K → “role”.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 28 }} className="stagger">
          {Object.entries(SG_NAV.roles).map(([id, r]) => (
            <button key={id} className="role-card" onClick={() => signIn(id)} style={s.session && s.session.role === id ? { borderColor: 'var(--violet)' } : null}>
              <span className="role-ico"><Ico n={r.icon} s={20} /></span>
              <span style={{ fontWeight: 550, fontSize: 15.5, letterSpacing: '-.01em' }}>{r.label}</span>
              <span className="muted tw-pretty" style={{ fontSize: 13 }}>{r.blurb}</span>
              <span className="row muted" style={{ fontSize: 12, marginTop: 'auto' }}><Avatar name={DEMO_USERS[id].name} size={22} />{DEMO_USERS[id].name}</span>
            </button>
          ))}
        </div>
        <div className="row wrap" style={{ marginTop: 24, gap: 10 }}>
          <Btn icon="rotate-ccw" onClick={resetDemo}>Reset demo data</Btn>
          {s.session && <Btn v="ghost" icon="arrow-left" onClick={() => nav(SG_NAV.roles[s.session.role].home)}>Back to app</Btn>}
        </div>
        <Disclaimer style={{ marginTop: 32, maxWidth: 640 }} />
      </div>
    </div>
  );
}

Object.assign(window, { DEMO_USERS, signIn, signOut, switchRole, navFor, Sidebar, Header, MobileTop, BottomBar, Banners, CommandPalette, ComingPhase, Login, DemoPage, applyTheme, setLatency, resetDemo, Bell });
