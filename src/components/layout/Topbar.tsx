
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Menu } from 'lucide-react';
import { USE_MOCK } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { USE_MOCK } from '../../api/client';

type TopbarProps = {
  onMenuClick?: () => void;
};

// Map actual backend role values to translation keys.
const roleKeys = {
  cooperative_admin: 'cooperativeAdmin',
  centre_operator: 'centreOperator',
  food_safety_officer: 'foodSafetyOfficer',
} as const;

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get the translated role.
  const roleKey =
    user?.role && user.role in roleKeys
      ? roleKeys[user.role as keyof typeof roleKeys]
      : null;

  const roleLabel = roleKey
    ? t(roleKey)
    : user?.role ?? '';

  // Logout
  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-lavender bg-white/70 px-4 py-4 sm:px-6">

      {/* Left section */}
      <div className="flex items-center gap-3">

        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-navy hover:bg-lavender lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Demo data badge */}
        {USE_MOCK && (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Demo data
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {t('welcome')}
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </p>
          <p className="text-xs text-slate-500">{t('tagline')}</p>
        </div>

        {USE_MOCK && (
          <span
            className="hidden rounded-full bg-saffron-light px-2.5 py-0.5 text-xs font-semibold text-saffron-dark sm:inline"
            title="Showing built-in demo data, not the live backend. Set VITE_USE_MOCK=false in .env to use the backend."
          >
            {t('demoData')}
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 sm:gap-5">

        {/* User information */}
        <div className="text-right">
          <p className="font-semibold text-navy">
            {user?.name ?? ''}
          </p>

          <p className="text-sm text-slate-500">
            {roleLabel}
          </p>
        </div>

        {/* User avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-light font-semibold text-white"
          aria-hidden="true"
        >
          {(user?.name?.trim().charAt(0) || 'U').toUpperCase()}
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-navy transition-colors hover:bg-lavender"
          aria-label={t('logout')}
          title={t('logout')}
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">
            {t('logout')}
          </span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
