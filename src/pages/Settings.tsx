import { Check, Languages, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { USE_MOCK } from '../api/client';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input, Label } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { cx } from '../lib';
import { ROLE_LABELS } from '../types';

const LANGS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
] as const;
type Lang = (typeof LANGS)[number]['code'];
const LANG_KEY = 'dd_lang';

function readLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return LANGS.some((l) => l.code === v) ? (v as Lang) : 'en';
  } catch {
    return 'en';
  }
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState<Lang>(readLang);

  function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    // No profile endpoint in the API contract yet — persisted locally only.
    updateUser({ name: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function chooseLang(code: Lang) {
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile and app preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2"><UserIcon className="h-5 w-5" /> Profile</span>} />
          <form onSubmit={saveProfile} className="space-y-4 p-5">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ''} disabled className="bg-lavender/60 text-slate-500" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={user ? ROLE_LABELS[user.role] : ''} disabled className="bg-lavender/60 text-slate-500" />
              <p className="mt-1 text-xs text-slate-500">Roles are assigned by your cooperative admin.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!name.trim() || name.trim() === user?.name}>Save changes</Button>
              {saved && <span className="inline-flex items-center gap-1 text-sm text-pure"><Check className="h-4 w-4" /> Saved</span>}
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title={<span className="inline-flex items-center gap-2"><Languages className="h-5 w-5" /> Language</span>}
              subtitle="Translations are coming soon — your choice is remembered for when they land."
            />
            <div className="grid grid-cols-3 gap-3 p-5" role="radiogroup" aria-label="Language">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  role="radio"
                  aria-checked={lang === l.code}
                  onClick={() => chooseLang(l.code)}
                  className={cx(
                    'rounded-2xl border-2 px-3 py-4 text-center transition-colors',
                    lang === l.code ? 'border-navy bg-lavender' : 'border-lavender hover:border-purple-light',
                  )}
                >
                  <span className="block font-serif text-lg font-semibold text-navy">{l.native}</span>
                  <span className="text-xs text-slate-500">{l.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Connection" />
            <dl className="space-y-2 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Data source</dt>
                <dd className="font-medium text-navy">{USE_MOCK ? 'Demo data (mock API)' : 'Live API'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">API URL</dt>
                <dd className="truncate font-mono text-xs text-navy">{import.meta.env.VITE_API_URL ?? '—'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
