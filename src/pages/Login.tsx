import { Loader2, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { USE_MOCK, toApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input, Label, Select } from '../components/ui/Field';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, type Role } from '../types';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('cooperative_admin');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login({ email: email.trim(), password, role });
      navigate(from, { replace: true });
    } catch (err) {
      const { status, message } = toApiError(err);
      setError(status === 401 ? 'Incorrect email or password.' : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white md:flex">
        <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-purple/40 blur-3xl" />
        <Link to="/">
          <Logo light />
        </Link>
        <div className="relative">
          <p className="font-serif text-4xl font-bold leading-tight">Seeing purity in every drop.</p>
          <p className="mt-4 max-w-sm text-white/75">
            Track milk quality across every collection centre, catch adulteration hotspots early, and keep farmers paid fairly.
          </p>
        </div>
        <p className="relative text-xs text-white/50">A Team Nexora project</p>
      </div>

      <div className="flex items-center justify-center bg-lavender px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block md:hidden">
            <Logo />
          </Link>
          <div className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
            <h1 className="font-serif text-2xl font-bold text-navy">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back. Choose your role to see the right tools.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="email" type="email" autoComplete="email" placeholder="you@cooperative.in" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>

              {error && (
                <p className="rounded-xl bg-adulterated-bg px-3 py-2 text-sm text-adulterated" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {USE_MOCK && (
              <p className="mt-5 rounded-xl bg-saffron-light px-3 py-2 text-xs text-saffron-dark">
                Demo mode: any email and password will sign you in.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
