import { Loader2, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { USE_MOCK, toApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input, Label, Select } from '../components/ui/Field';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { cx, isValidEmail } from '../lib';
import { DEMO_ACCOUNT } from '../mocks/handlers';
import { ROLE_LABELS, type Role } from '../types';

const MIN_PASSWORD = 8;

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

/** Sign in at /login, create an account at /signup. */
export default function Login() {
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const isSignup = location.pathname === '/signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<Role>('cooperative_admin');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (isSignup && !name.trim()) errs.name = 'Enter your full name.';
    if (!email.trim()) errs.email = 'Enter your email address.';
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address, like name@cooperative.in.';
    if (!password) errs.password = 'Enter your password.';
    else if (isSignup && password.length < MIN_PASSWORD) errs.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (isSignup && password && confirm !== password) errs.confirm = "Passwords don't match.";
    return errs;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      if (isSignup) await signup({ name: name.trim(), email: email.trim(), password, role });
      else await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      const { status, message } = toApiError(err);
      if (!isSignup && status === 401 && !USE_MOCK) setError('Incorrect email or password.');
      else if (isSignup && status === 404) setError("Sign up isn't available on the server yet. Ask your cooperative admin for an account.");
      else setError(message);
    } finally {
      setBusy(false);
    }
  }

  function switchTo(path: '/login' | '/signup') {
    setFieldErrors({});
    setError(null);
    navigate(path, { replace: true, state: location.state });
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
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-lavender p-1" role="tablist" aria-label="Account">
              {([['/login', 'Sign in'], ['/signup', 'Sign up']] as const).map(([path, label]) => {
                const active = (path === '/signup') === isSignup;
                return (
                  <button
                    key={path}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => !active && switchTo(path)}
                    className={cx(
                      'rounded-lg py-2 text-sm font-semibold transition-colors',
                      active ? 'bg-white text-navy shadow-soft' : 'text-slate-500 hover:text-navy',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <h1 className="font-serif text-2xl font-bold text-navy">{isSignup ? 'Create your account' : 'Sign in'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isSignup ? 'Choose the role you work in. It decides which tools you see.' : 'Welcome back. Sign in with your work email.'}
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              {isSignup && (
                <Field id="name" label="Full name" error={fieldErrors.name}>
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="name" autoComplete="name" placeholder="Priya Debnath" className="pl-9" value={name}
                    aria-invalid={Boolean(fieldErrors.name)} onChange={(e) => setName(e.target.value)} />
                </Field>
              )}
              <Field id="email" label="Email" error={fieldErrors.email}>
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@cooperative.in" className="pl-9"
                  value={email} aria-invalid={Boolean(fieldErrors.email)} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="password" label="Password" error={fieldErrors.password}
                hint={isSignup ? `At least ${MIN_PASSWORD} characters.` : undefined}>
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="••••••••"
                  className="pl-9" value={password} aria-invalid={Boolean(fieldErrors.password)} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              {isSignup && (
                <>
                  <Field id="confirm" label="Confirm password" error={fieldErrors.confirm}>
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" className="pl-9"
                      value={confirm} aria-invalid={Boolean(fieldErrors.confirm)} onChange={(e) => setConfirm(e.target.value)} />
                  </Field>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}

              {error && (
                <p className="rounded-xl bg-adulterated-bg px-3 py-2 text-sm text-adulterated" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSignup ? (busy ? 'Creating account…' : 'Create account') : busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {isSignup ? 'Already have an account? ' : 'New to DoodhDrishti? '}
              <button type="button" className="font-semibold text-purple hover:text-navy" onClick={() => switchTo(isSignup ? '/login' : '/signup')}>
                {isSignup ? 'Sign in' : 'Create an account'}
              </button>
            </p>

            {USE_MOCK && !isSignup && (
              <p className="mt-5 rounded-xl bg-saffron-light px-3 py-2 text-xs text-saffron-dark">
                Demo mode: accounts are saved in this browser only. Try the demo account{' '}
                <span className="font-semibold">{DEMO_ACCOUNT.email}</span> / <span className="font-semibold">{DEMO_ACCOUNT.password}</span>, or sign up.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-adulterated" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
