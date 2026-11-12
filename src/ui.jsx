/* src/ui.jsx — primitives: icons, logo, router, store hook, Tabs/Segmented,
   chips, buttons, modal/drawer, toasts, count-up, sparkline, skeletons, states. */
const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment } = React;

/* ── store hook ─────────────────────────────────────── */
function useSG(sel) {
  const [, force] = useState(0);
  const selRef = useRef(sel); selRef.current = sel;
  const last = useRef();
  useEffect(() => SG.store.subscribe(() => {
    if (!selRef.current) return force((x) => x + 1);
    const n = selRef.current(SG.store.get());
    if (n !== last.current) { last.current = n; force((x) => x + 1); }
  }), []);
  const s = SG.store.get();
  if (sel) last.current = sel(s);
  return s;
}
function useNow(ms = 15000) {
  const [n, setN] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setN(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return n;
}
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── router (hash) ──────────────────────────────────── */
function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [p, q] = h.split('?');
  return { path: p || '/', query: Object.fromEntries(new URLSearchParams(q || '')) };
}
function useRoute() {
  const [r, setR] = useState(parseHash());
  useEffect(() => { const f = () => setR(parseHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return r;
}
function nav(path) { location.hash = path; }
function setQuery(k, v) {
  const r = parseHash(); const q = { ...r.query, [k]: v };
  if (v == null || v === '') delete q[k];
  const qs = new URLSearchParams(q).toString();
  history.replaceState(null, '', '#' + r.path + (qs ? '?' + qs : ''));
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/* ── icons (Lucide) ─────────────────────────────────── */
const pascal = (k) => k.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
function Ico({ n, s = 18, w = 1.75, className, style }) {
  const C = window.LucideReact && window.LucideReact[pascal(n)];
  if (!C) return <span style={{ width: s, height: s, display: 'inline-block', ...style }} />;
  return <C size={s} strokeWidth={w} className={className} style={style} aria-hidden="true" />;
}

/* ── logo: shield outline + 2×2 grid + lime dot ────── */
function LogoMark({ size = 32, variant = 'ink' }) {
  // variant: ink (black tile, white mark), violet (violet tile, white mark), light (white tile, black mark)
  const bg = variant === 'violet' ? '#6A3DF5' : variant === 'light' ? '#FFFFFF' : '#0E0E12';
  const fg = variant === 'light' ? '#0E0E12' : '#FFFFFF';
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" role="img" aria-label="SafeGrid" style={{ flex: 'none', display: 'block' }}>
      <rect width="42" height="42" rx="12" fill={bg} stroke={variant === 'light' ? '#E7E7EC' : 'none'} />
      <path d="M21 8.5 31 12.2v8.3c0 6.3-4.2 10.9-10 13-5.8-2.1-10-6.7-10-13v-8.3Z" fill="none" stroke={fg} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M21 13v17M14.2 20.4h13.6" stroke={fg} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="31.2" cy="31.2" r="4.2" fill="#C8F23C" stroke={bg} strokeWidth="1.6" />
    </svg>
  );
}
function Logo({ size = 30, variant = 'ink', word = true, color }) {
  return (
    <span className="row" style={{ gap: 10 }}>
      <LogoMark size={size} variant={variant} />
      {word && <span className="sb-word" style={{ color, fontSize: size * 0.56 }}>SafeGrid</span>}
    </span>
  );
}

/* ── chips & small bits ─────────────────────────────── */
function Chip({ tone = '', dot = true, children, title, style }) {
  return <span className={'chip ' + (tone ? 'chip-' + tone : '')} title={title} style={style}>{dot && <i className="cd" />}{children}</span>;
}
const STATUS_TONE = {
  // trips
  on_route: ['violet', 'On route'], scheduled: ['line', 'Scheduled'], completed: ['lime', 'Arrived'], cancelled: ['line', 'Cancelled'],
  // briefings
  Draft: ['line', 'Draft'], Sent: ['amber', 'Sent'], Acknowledged: ['lime', 'Acknowledged'], Expired: ['line', 'Expired'],
  // incidents
  pending: ['amber', 'Pending verification'], verified: ['danger', 'Verified'], rejected: ['line', 'Rejected'], expired: ['line', 'Expired'],
  // vehicles
  on_trip: ['violet', 'On trip'], idle: ['lime', 'Available'], maintenance: ['amber', 'In workshop'], offline: ['line', 'Offline'],
  // drivers
  available: ['lime', 'Available'], off_duty: ['line', 'Off duty'],
  // sos
  open: ['danger', 'Open'], resolved: ['lime', 'Resolved'],
  // delivery
  Queued: ['line', 'Queued'], Sending: ['violet', 'Sending'], Sent: ['amber', 'Sent'], Delivered: ['lime', 'Delivered'], Failed: ['danger', 'Failed'],
};
function Status({ s, label }) {
  const [tone, l] = STATUS_TONE[s] || ['', s];
  return <Chip tone={tone} key={s}>{label || l}</Chip>;
}
function Sev({ s }) { return <span className={'sev sev-' + s} title={s} />; }
function SevChip({ s }) {
  const map = { critical: 'danger', high: 'danger', medium: 'amber', low: 'line' };
  return <Chip tone={map[s]}>{s[0].toUpperCase() + s.slice(1)}</Chip>;
}
function Avatar({ name, size = 32, tone }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
  const bgs = ['#EDE7FE', '#F1F1F4', '#EAF5D0', '#FDEFD6', '#E6E9F4'];
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (!document.documentElement.classList.contains('dark')) style.background = tone || bgs[hue];
  return <span className="avatar" style={style}>{SG.q.initials(name)}</span>;
}
function DemoTag({ children = 'Demo data' }) { return <span className="demo-tag" title="All names, plates and numbers are placeholders">{children}</span>; }
function SimTag({ children = 'Simulated' }) { return <span className="sim-tag"><Ico n="flask-conical" s={11} />{children}</span>; }
function Disclaimer({ style }) {
  return <div className="disclaimer" style={style}><Ico n="info" s={14} style={{ flex: 'none', marginTop: 1 }} /><span className="tw-pretty">{SG_BRAND.disclaimer}</span></div>;
}
function Fresh({ at }) { return <span className="muted mono" style={{ fontSize: 11.5 }}>Updated {SG.time.wat(at || Date.now())}</span>; }

/* ── buttons ────────────────────────────────────────── */
function Btn({ v = 'outline', size, icon, iconR, children, className = '', ...p }) {
  return (
    <button className={`btn btn-${v} ${size ? 'btn-' + size : ''} ${className}`} {...p}>
      {icon && <Ico n={icon} s={size === 'sm' ? 14 : 16} />}{children}{iconR && <Ico n={iconR} s={size === 'sm' ? 14 : 16} />}
    </button>
  );
}
function IconBtn({ n, label, badge, pulse, ...p }) {
  return <button className="icon-btn" aria-label={label} title={label} {...p}><Ico n={n} />{badge ? <span className={'nav-badge' + (pulse ? ' pulse' : '')}>{badge}</span> : null}</button>;
}
function Toggle({ on, onChange, label }) {
  return <button role="switch" aria-checked={!!on} aria-label={label} className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} />;
}

/* ── Tabs / Segmented: sliding pill, ARIA, arrow keys, ?tab= sync ── */
function Tabs({ items, value, onChange, urlKey, variant = 'seg', counts = {}, ariaLabel, style }) {
  const route = useRoute();
  const cur = urlKey ? (route.query[urlKey] || value || items[0].id) : value;
  const ref = useRef(); const [pill, setPill] = useState(null);
  const select = (id) => { if (urlKey) setQuery(urlKey, id); onChange && onChange(id); };
  useLayoutEffect(() => {
    const el = ref.current && ref.current.querySelector(`[data-id="${cur}"]`);
    if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
  }, [cur, items.length, JSON.stringify(counts)]);
  useEffect(() => { const f = () => { const el = ref.current && ref.current.querySelector(`[data-id="${cur}"]`); if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth }); }; window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, [cur]);
  const onKey = (e) => {
    const i = items.findIndex((t) => t.id === cur);
    let n = null;
    if (e.key === 'ArrowRight') n = (i + 1) % items.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length;
    if (e.key === 'Home') n = 0; if (e.key === 'End') n = items.length - 1;
    if (n != null) { e.preventDefault(); select(items[n].id); ref.current.querySelector(`[data-id="${items[n].id}"]`).focus(); }
  };
  return (
    <div ref={ref} role="tablist" aria-label={ariaLabel} className={variant === 'line' ? 'tabs-line' : 'seg'} onKeyDown={onKey} style={style}>
      {pill && <span className="seg-pill" style={{ left: 0, width: pill.w, transform: `translateX(${pill.x - (variant === 'line' ? 0 : 0)}px)` }} />}
      {items.map((t) => (
        <button key={t.id} data-id={t.id} role="tab" aria-selected={cur === t.id} tabIndex={cur === t.id ? 0 : -1} className="seg-btn" onClick={() => select(t.id)}>
          {t.icon && <Ico n={t.icon} s={14} />}{t.label}{counts[t.id] != null && <span className="cnt">{counts[t.id]}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── count-up ───────────────────────────────────────── */
function CountUp({ value, dur = 900, fmt = (n) => Math.round(n).toLocaleString() }) {
  const [v, setV] = useState(reduced() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced()) { setV(value); return; }
    const a = from.current, b = value, t0 = performance.now(); let raf;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); setV(a + (b - a) * e); if (k < 1) raf = requestAnimationFrame(step); else from.current = b; };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(v)}</>;
}
function Sparkline({ data, w = 76, h = 28, color = 'currentColor' }) {
  const mx = Math.max(...data), mn = Math.min(...data), r = mx - mn || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * (w - 2) + 1, h - 3 - ((d - mn) / r) * (h - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path className="ln" d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" pathLength="200" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
}

/* ── typewriter ─────────────────────────────────────── */
function Typewriter({ text, speed = 18 }) {
  const [n, setN] = useState(reduced() ? text.length : 0);
  useEffect(() => {
    if (reduced()) { setN(text.length); return; }
    setN(0); let i = 0; const t = setInterval(() => { i += 1; setN(i); if (i >= text.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <>{text.slice(0, n)}{n < text.length && <span className="caret" />}</>;
}

/* ── overlays ───────────────────────────────────────── */
function useEsc(on, f) { useEffect(() => { if (!on) return; const h = (e) => e.key === 'Escape' && f(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [on, f]); }
function Modal({ open, onClose, title, sub, icon, children, footer, width }) {
  useEsc(open, onClose);
  if (!open) return null;
  return ReactDOM.createPortal(<>
    <div className="scrim" onClick={onClose} />
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={width ? { width: `min(${width}px, calc(100vw - 32px))` } : null}>
      <div className="modal-h">
        {icon && <span className="role-ico" style={{ width: 36, height: 36 }}><Ico n={icon} s={18} /></span>}
        <div className="grow"><div style={{ fontSize: 17, fontWeight: 550, letterSpacing: '-.015em' }}>{title}</div>{sub && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{sub}</div>}</div>
        <IconBtn n="x" label="Close" onClick={onClose} />
      </div>
      <div className="modal-b">{children}</div>
      {footer && <div className="modal-f">{footer}</div>}
    </div>
  </>, document.body);
}
function Drawer({ open, onClose, title, sub, head, children, footer }) {
  useEsc(open, onClose);
  if (!open) return null;
  return ReactDOM.createPortal(<>
    <div className="scrim" onClick={onClose} />
    <aside className="drawer" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Details'}>
      <div className="drawer-h">
        <div className="grow">{head}<div style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-.02em', marginTop: head ? 4 : 0 }}>{title}</div>{sub && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{sub}</div>}</div>
        <IconBtn n="x" label="Close" onClick={onClose} />
      </div>
      <div className="drawer-b">{children}</div>
      {footer && <div className="modal-f">{footer}</div>}
    </aside>
  </>, document.body);
}

/* ── toasts (never alert()) ─────────────────────────── */
const toastBus = { list: [], subs: new Set(), id: 1 };
function toast(title, opts = {}) {
  const t = { id: toastBus.id++, title, body: opts.body, action: opts.action, icon: opts.icon || (opts.tone === 'good' ? 'circle-check' : opts.tone === 'danger' ? 'circle-alert' : 'info'), tone: opts.tone, ttl: opts.ttl || (opts.action ? 6000 : 3800) };
  toastBus.list = [...toastBus.list, t].slice(-4);
  toastBus.subs.forEach((f) => f());
  setTimeout(() => dismissToast(t.id), t.ttl);
  return t.id;
}
function dismissToast(id) {
  const t = toastBus.list.find((x) => x.id === id); if (!t || t.out) return;
  t.out = true; toastBus.subs.forEach((f) => f());
  setTimeout(() => { toastBus.list = toastBus.list.filter((x) => x.id !== id); toastBus.subs.forEach((f) => f()); }, 220);
}
function Toaster() {
  const [, f] = useState(0);
  useEffect(() => { const s = () => f((x) => x + 1); toastBus.subs.add(s); return () => toastBus.subs.delete(s); }, []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toastBus.list.map((t) => (
        <div key={t.id} className={'toast' + (t.out ? ' out' : '')}>
          <span style={{ marginTop: 1, color: t.tone === 'good' ? 'var(--lime)' : t.tone === 'danger' ? '#FF8A8A' : 'inherit' }}><Ico n={t.icon} s={17} /></span>
          <div className="grow"><div style={{ fontWeight: 500 }}>{t.title}</div>{t.body && <div className="tb">{t.body}</div>}</div>
          {t.action && <button className="ta" onClick={() => { t.action.fn(); dismissToast(t.id); }}>{t.action.label}</button>}
          <button aria-label="Dismiss" onClick={() => dismissToast(t.id)} style={{ opacity: .6, padding: 2 }}><Ico n="x" s={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ── loading / empty / error states ─────────────────── */
function useResource(path, deps = []) {
  const lat = useSG((s) => s.dev.latency).dev.latency;
  const [st, setSt] = useState(SG.api.isLoaded(path) && lat !== 'offline' ? 'ok' : 'loading');
  const [cached, setCached] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    if (!SG.api.isLoaded(path) || n > 0) setSt('loading');
    SG.api.read(path).then((r) => { if (live) { setSt('ok'); setCached(!!r.cached); } }).catch(() => live && setSt('error'));
    return () => { live = false; };
  }, [path, n, lat, ...deps]);
  return { state: st, cached, retry: () => setN((x) => x + 1) };
}
function Sk({ w = '100%', h = 14, r, style }) { return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />; }
function SkRows({ n = 5, cols = 5 }) {
  return <div style={{ padding: '6px 18px 14px' }}>{Array.from({ length: n }).map((_, i) => (
    <div key={i} className="row" style={{ gap: 16, padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}>
      <Sk w={32} h={32} r={16} />{Array.from({ length: cols - 1 }).map((_, j) => <Sk key={j} w={j === 0 ? '28%' : (12 + ((i + j) % 3) * 4) + '%'} h={11} />)}
    </div>))}</div>;
}
function Empty({ icon = 'inbox', title, body, action }) {
  return <div className="state"><span className="ico"><Ico n={icon} s={22} /></span><h3>{title}</h3>{body && <p className="tw-pretty">{body}</p>}{action}</div>;
}
function ErrorState({ retry, title = 'Couldn’t load this', body }) {
  const lat = SG.store.get().dev.latency;
  return <div className="state">
    <span className="ico" style={{ color: 'var(--amber-ink)', background: 'var(--amber-50)', borderColor: 'transparent' }}><Ico n={lat === 'offline' ? 'wifi-off' : 'cloud-alert'} s={22} /></span>
    <h3>{lat === 'offline' ? 'You’re offline' : title}</h3>
    <p className="tw-pretty">{body || (lat === 'offline' ? 'This view hasn’t been cached on this device yet. Anything you change elsewhere is queued and will sync when you’re back online.' : 'The request failed. Your data is safe.')}</p>
    <Btn icon="rotate-cw" onClick={retry}>Retry</Btn>
  </div>;
}
function Guarded({ res, skeleton, children }) {
  if (res.state === 'loading') return skeleton || <SkRows />;
  if (res.state === 'error') return <ErrorState retry={res.retry} />;
  return children;
}

/* ── form field ─────────────────────────────────────── */
function Field({ label, hint, error, children, style }) {
  return <div className="field" style={style}>{label && <label>{label}</label>}{children}{error ? <div className="err"><Ico n="circle-alert" s={12} />{error}</div> : hint ? <div className="hint">{hint}</div> : null}</div>;
}

/* ── click outside ──────────────────────────────────── */
function useOutside(ref, on, f) {
  useEffect(() => {
    if (!on) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) f(); };
    setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => document.removeEventListener('mousedown', h);
  }, [on]);
}

/* ── mini corridor drawing (vehicle cards, previews) ── */
function MiniRoute({ corridorId, progress = null, w = 260, h = 112, incidents = true }) {
  const s = SG.store.get();
  const c = SG.q.corridor(s, corridorId);
  if (!c) return null;
  const P = SG.geo.project(c, w, h, 18);
  const pts = c.path.map(P);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const pos = progress != null ? P(SG.geo.pointAt(c, progress)) : null;
  const incs = incidents ? s.data.incidents.filter((i) => i.corridorId === corridorId && (i.status === 'verified' || i.status === 'pending')) : [];
  return (
    <svg className="route" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs><pattern id={'g' + corridorId} width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="var(--line)" strokeWidth=".6" /></pattern></defs>
      <rect width={w} height={h} fill={`url(#g${corridorId})`} />
      <path d={d} fill="none" stroke="var(--surface)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 4" />
      {progress != null && (() => {
        const cut = []; for (let i = 0; i <= 40; i++) { const f = (i / 40) * progress; cut.push(P(SG.geo.pointAt(c, f))); }
        return <path d={cut.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')} fill="none" stroke="var(--violet)" strokeWidth="2.4" strokeLinecap="round" />;
      })()}
      <circle cx={pts[0][0]} cy={pts[0][1]} r="3.5" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="var(--ink)" />
      {incs.map((i) => { const p = P(SG.geo.pointAt(c, i.at)); return i.status === 'verified'
        ? <circle key={i.id} cx={p[0]} cy={p[1]} r="4" fill="var(--danger)" stroke="var(--surface)" strokeWidth="1.5" />
        : <circle key={i.id} cx={p[0]} cy={p[1]} r="3.6" fill="var(--surface)" stroke="var(--amber)" strokeWidth="1.6" strokeDasharray="2 1.5" />; })}
      {pos && <g transform={`translate(${pos[0]},${pos[1]})`}><circle r="9" fill="var(--violet)" opacity=".15" /><circle r="5" fill="var(--violet)" stroke="var(--surface)" strokeWidth="2" /></g>}
    </svg>
  );
}

Object.assign(window, {
  useSG, useNow, reduced, useRoute, nav, setQuery, parseHash, Ico, LogoMark, Logo, Chip, Status, STATUS_TONE, Sev, SevChip, Avatar, DemoTag, SimTag,
  Disclaimer, Fresh, Btn, IconBtn, Toggle, Tabs, CountUp, Sparkline, Typewriter, Modal, Drawer, toast, dismissToast, Toaster,
  useResource, Sk, SkRows, Empty, ErrorState, Guarded, Field, useOutside, useEsc, MiniRoute,
});
