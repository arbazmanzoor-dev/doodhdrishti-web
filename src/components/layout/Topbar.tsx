import { LogOut, Menu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const roleKey =
    user?.role === 'cooperative_admin'
      ? 'cooperativeAdmin'
      : user?.role === 'centre_operator'
        ? 'centreOperator'
        : user?.role === 'food_safety_officer'
          ? 'foodSafetyOfficer'
          : null;

  const roleLabel = roleKey ? t(roleKey) : user?.role ?? '';

  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-lavender bg-white/70 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-navy hover:bg-lavender lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="text-right">
          <p className="font-semibold text-navy">
            {user?.name ?? ''}
          </p>
          <p className="text-sm text-slate-500">
            {roleLabel}
          </p>
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-light font-semibold text-white"
          aria-hidden="true"
        >
          {(user?.name?.trim().charAt(0) || 'U').toUpperCase()}
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-navy transition-colors hover:bg-lavender"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </header>
  );
}
