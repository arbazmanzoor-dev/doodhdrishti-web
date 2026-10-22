import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { USE_MOCK } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-[900] flex items-center gap-3 border-b border-navy/10 bg-lavender/85 px-4 py-3 backdrop-blur sm:px-6">
      <button className="rounded-lg p-2 text-navy hover:bg-white lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      {USE_MOCK && (
        <span className="hidden rounded-full bg-saffron-light px-2.5 py-0.5 text-xs font-semibold text-saffron-dark sm:inline">
          Demo data
        </span>
      )}
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight text-navy">{user?.name}</p>
          <p className="text-xs text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple text-sm font-semibold text-white" aria-hidden>
          {initials}
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-navy hover:bg-white"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
