import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="app-shell">
      <div className="ambient ambient--top" />
      <div className="ambient ambient--bottom" />
      <header className="site-header">
        <NavLink to="/" className="brand-mark">
          <span className="brand-mark__label">RPS Arena</span>
          <span className="brand-mark__sub">Bot duels, brackets, and live results</span>
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/quick-match" className="site-nav__link">
            Quick Match
          </NavLink>
          <NavLink to="/tournaments/new" className="site-nav__link">
            Tournament Setup
          </NavLink>
        </nav>
      </header>
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
