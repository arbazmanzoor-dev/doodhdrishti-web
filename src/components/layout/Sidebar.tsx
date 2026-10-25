
import { useLanguage } from '../../context/LanguageContext';
import {
  FlaskConical,
  LayoutDashboard,
  List,
  Map,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cx } from '../../lib';
import { Logo } from '../ui/Logo';

const NAV = [
  {
    to: '/dashboard',
    key: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/test',
    key: 'testSample',
    icon: FlaskConical,
  },
  {
    to: '/samples',
    key: 'samples',
    icon: List,
  },
  {
    to: '/farmers',
    key: 'farmers',
    icon: Users,
  },
  {
    to: '/map',
    key: 'hotspotMap',
    icon: Map,
  },
  {
    to: '/settings',
    key: 'settings',
    icon: Settings,
  },
] as const;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile menu backdrop */}
      <div
        className={cx(
          'fixed inset-0 z-[1000] bg-navy-900/40 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-[1001] flex w-64 flex-col bg-navy text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5">
          <NavLink to="/" onClick={onClose} aria-label="DoodhDrishti home">
            <Logo light />
          </NavLink>

          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white text-navy shadow-soft'
                    : 'text-white/75 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Translated footer */}
        <div className="m-3 rounded-2xl bg-white/10 p-4 text-xs text-white/80">
          <p className="font-serif text-sm font-semibold text-white">
            {t('tagline')}
          </p>
          <p className="mt-1">{t('teamProject')}</p>
        </div>
      </aside>
    </>
  );
}
