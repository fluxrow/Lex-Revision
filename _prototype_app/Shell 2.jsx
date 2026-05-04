// App shell — sidebar, topbar, mobile nav, routing
// Depends on: Icon (from Icon.jsx)

const NAV_PRIMARY = [
  { id: 'dashboard',  label: 'Início',         icon: 'home' },
  { id: 'novo',       label: 'Novo contrato',  icon: 'plus' },
  { id: 'historico',  label: 'Histórico',      icon: 'history', badge: '24' },
  { id: 'modelos',    label: 'Modelos',        icon: 'folder' },
  { id: 'clientes',   label: 'Clientes',       icon: 'users' },
  { id: 'assinatura', label: 'Assinaturas',    icon: 'pen', badge: '3' },
];
const NAV_SECONDARY = [
  { id: 'faturamento', label: 'Faturamento', icon: 'card' },
  { id: 'config',      label: 'Configurações', icon: 'settings' },
];
const MOBILE_NAV = [
  { id: 'dashboard', label: 'Início',   icon: 'home' },
  { id: 'novo',      label: 'Novo',     icon: 'plus' },
  { id: 'historico', label: 'Histórico',icon: 'history' },
  { id: 'clientes',  label: 'Clientes', icon: 'users' },
  { id: 'config',    label: 'Mais',     icon: 'more' },
];

function useRoute() {
  const [route, setRoute] = React.useState(() => {
    const h = window.location.hash.slice(1);
    return h || 'dashboard';
  });
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const nav = React.useCallback((id) => { window.location.hash = id; }, []);
  return [route, nav];
}

function useTheme() {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem('lex-revision-theme') || 'dark'; } catch { return 'dark'; }
  });
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('lex-revision-theme', theme); } catch {}
  }, [theme]);
  return [theme, setTheme];
}

function Sidebar({ route, nav }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">L</div>
        <div className="sidebar-logo-text">
          Lex<span className="legal"> Revision</span>
        </div>
      </div>

      <div className="sidebar-section">Menu</div>
      {NAV_PRIMARY.map(item => (
        <div key={item.id}
          className={`nav-item ${route.startsWith(item.id) ? 'active' : ''}`}
          onClick={() => nav(item.id)}>
          <span className="nav-icon"><Icon name={item.icon} size={17}/></span>
          {item.label}
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </div>
      ))}

      <div className="sidebar-section">Conta</div>
      {NAV_SECONDARY.map(item => (
        <div key={item.id}
          className={`nav-item ${route.startsWith(item.id) ? 'active' : ''}`}
          onClick={() => nav(item.id)}>
          <span className="nav-icon"><Icon name={item.icon} size={17}/></span>
          {item.label}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="user-card" onClick={() => nav('config')}>
          <div className="avatar">MR</div>
          <div className="user-info">
            <div className="user-name">Marina Rocha</div>
            <div className="user-email">marina@silvaadv.com</div>
          </div>
          <Icon name="chevron-right" size={14} style={{color:'var(--text-dim)'}}/>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, sub, theme, setTheme, actions }) {
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {sub && <div className="muted" style={{fontSize:12, marginTop:2}}>{sub}</div>}
      </div>
      <div className="search-box">
        <Icon name="search" size={15}/>
        <input placeholder="Buscar contratos, clientes, modelos…"/>
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-actions">
        {actions}
        <button className="btn btn-ghost btn-icon" title="Alternar tema"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17}/>
        </button>
        <button className="btn btn-ghost btn-icon" title="Notificações">
          <Icon name="bell" size={17}/>
        </button>
      </div>
    </div>
  );
}

function MobileNav({ route, nav }) {
  return (
    <div className="mobile-nav">
      {MOBILE_NAV.map(item => (
        <div key={item.id}
          className={`mn-item ${route.startsWith(item.id) ? 'active' : ''}`}
          onClick={() => nav(item.id)}>
          <Icon name={item.icon} size={20}/>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, MobileNav, useRoute, useTheme, NAV_PRIMARY });
