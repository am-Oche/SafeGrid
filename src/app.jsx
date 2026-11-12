/* src/app.jsx — router, guards, shell composition. */

const PAGES = {
  '/overview': () => <OverviewPage />,
  '/fleet': () => <FleetPage />,
};

function AppShell({ route }) {
  const s = useSG();
  const [cmd, setCmd] = useState(false);
  const role = s.session.role;
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((x) => !x); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  // client-side guard
  const items = navFor(role);
  const item = SG_NAV.items.find((i) => route.path.startsWith(i.path));
  const allowed = item && items.some((i) => i.id === item.id);
  useEffect(() => { if (!item || (!allowed && route.path !== '/')) {} }, [route.path]);
  let body;
  if (!item) body = <div className="page-enter"><Empty icon="map-pin-off" title="Page not found" body={`Nothing lives at ${route.path}.`} action={<Btn v="primary" onClick={() => nav(SG_NAV.roles[role].home)}>Go home</Btn>} /></div>;
  else if (!allowed) body = <div className="page-enter card" style={{ marginTop: 24 }}><Empty icon="lock" title="No access" body={`${SG_NAV.roles[role].label} accounts can’t open ${item.label}. Ask an Organisation Admin${SG_BRAND.demoMode ? ', or switch role from Demo mode' : ''}.`} action={<Btn v="primary" onClick={() => nav(SG_NAV.roles[role].home)}>Back to {SG_NAV.items.find((i) => i.path === SG_NAV.roles[role].home)?.short || 'home'}</Btn>} /></div>;
  else body = PAGES[item.path] ? PAGES[item.path]() : <ComingPhase item={item} />;
  return (
    <div className={'app' + (s.ui.collapsed ? ' collapsed' : '')}>
      <Sidebar route={route} />
      <div className="main">
        <Banners />
        <Header onCmd={() => setCmd(true)} />
        <MobileTop onCmd={() => setCmd(true)} />
        <main className="content" key={route.path}>{body}</main>
      </div>
      <BottomBar route={route} />
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  );
}

function App() {
  const route = useRoute();
  const s = useSG((x) => x.session ? x.session.role : null);
  const ui = SG.store.get().ui;
  useEffect(() => applyTheme(ui), [ui.theme, ui.hc]);
  useSG((x) => x.ui.theme + x.ui.hc);
  useEffect(() => { SG.startSim(); }, []);
  // SOS arrival: sound + toast
  const prevOpen = useRef(null);
  useSG((x) => x.data.sos.filter((y) => y.status === 'open').length);
  const openIds = SG.store.get().data.sos.filter((y) => y.status === 'open').map((y) => y.id).join(',');
  useEffect(() => {
    if (prevOpen.current != null && openIds.split(',').some((id) => id && !prevOpen.current.includes(id))) {
      if (SG.store.get().ui.sound) SG.beep();
    }
    prevOpen.current = openIds;
  }, [openIds]);

  const sess = SG.store.get().session;
  // route resolution
  useEffect(() => {
    if (route.path === '/' || route.path === '') nav(sess ? SG_NAV.roles[sess.role].home : '/login');
    else if (!sess && !['/login', '/demo'].includes(route.path)) nav('/login');
  }, [route.path, !!sess]);

  if (route.path === '/demo') return <><DemoPage /><Toaster /></>;
  if (!sess || route.path === '/login') return <><Login /><Toaster /></>;
  return <><AppShell route={route} /><Toaster /></>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
