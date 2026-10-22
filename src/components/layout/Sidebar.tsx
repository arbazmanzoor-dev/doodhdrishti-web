import { FlaskConical, LayoutDashboard, List, Map, Settings, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cx } from '../../lib';
import { Logo } from '../ui/Logo';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/test', label: 'Test a sample', icon: FlaskConical },
  { to: '/samples', label: 'Samples', icon: List },
  { to: '/farmers', label: 'Farmers', icon: Users },
  { to: '/map', label: 'Hotspot map', icon: Map },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div
        className={cx('fixed inset-0 z-[1000] bg-navy-900/40 transition-opacity lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-[1001] flex w-64 flex-col bg-navy text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <NavLink to="/" onClick={onClose}>
            <Logo light />
          </NavLink>
          <button className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-white text-navy shadow-soft' : 'text-white/75 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 rounded-2xl bg-white/10 p-4 text-xs text-white/80">
          <p className="font-serif text-sm font-semibold text-white">Seeing purity in every drop</p>
          <p className="mt-1">A Team Nexora project</p>
        </div>
      </aside>
    </>
  );
}
