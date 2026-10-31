
import { Menu } from 'lucide-react';
import { USE_MOCK } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const roleKeys: Record<
    string,
    'cooperativeAdmin' | 'centreOperator' | 'farmerRole'
  > = {
    cooperativeAdmin: 'cooperativeAdmin',
    centreOperator: 'centreOperator',
    farmer: 'farmerRole',
  };

  const role = user?.role;
  const roleKey = role ? roleKeys[role] : undefined;
  const roleLabel = roleKey ? t(roleKey) : role ?? '';

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

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

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">
            {user?.name ?? t('profile')}
          </p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-800"
          aria-label={user?.name ?? t('profile')}
        >
          {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
