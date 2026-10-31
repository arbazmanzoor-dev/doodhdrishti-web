
import {
  Activity,
  Droplets,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Settings,
  Users,
  X,
} from 'lucide-react';

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

// Use exactly the same role mapping as Topbar.
const roleKeys = {
  cooperative_admin: 'cooperativeAdmin',
  centre_operator: 'centreOperator',
  food_safety_officer: 'foodSafetyOfficer',
} as const;

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Navigation items
  const navItems = [
    {
      label: t('dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: t('testSample'),
      path: '/test',
      icon: FlaskConical,
    },
    {
      label: t('samples'),
      path: '/samples',
      icon: Droplets,
    },
    {
      label: t('farmers'),
      path: '/farmers',
      icon: Users,
    },
    {
      label: t('hotspotMap'),
      path: '/hotspots',
      icon: MapPinned,
    },
    {
      label: t('settings'),
      path: '/settings',
      icon: Settings,
    },
  ];

  // Translate the actual backend role.
  const roleKey =
    user?.role && user.role in roleKeys
      ? roleKeys[user.role as keyof typeof roleKeys]
      : null;

  const roleLabel = roleKey
    ? t(roleKey)
    : user?.role ?? '';

  // Logout handler
  function handleLogout() {
    logout();
    onClose?.();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* Mobile background overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Activity className="h-6 w-6" />
            </div>

            <div>
              <p className="font-serif text-lg font-bold text-slate-900">
                DoodhDrishti
              </p>

              <p className="text-xs text-slate-500">
                {t('tagline')}
              </p>
            </div>
          </NavLink>

          {/* Mobile close button */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile and logout */}
        <div className="border-t border-slate-100 p-4">

          {/* User information */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-800">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.name ?? t('profile')}
              </p>

              <p className="truncate text-xs text-slate-500">
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Team project */}
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {t('teamProject')}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
