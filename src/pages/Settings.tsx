
import { Check, Languages, User as UserIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { USE_MOCK } from '../api/client';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input, Label } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { cx } from '../lib';
import { languageNames, type Language } from '../i18n/translations';
import { ROLE_LABELS } from '../types';

const LANGS: Language[] = ['en', 'hi', 'kn'];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState(user?.name ?? '');
  const [saved, setSaved] = useState(false);

  // Keep the profile field in sync if the authenticated user changes.
  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    updateUser({ name: trimmedName });
    setSaved(true);
  }

  // Use the shared LanguageContext so the rest of the app can react.
  function chooseLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  const roleLabel = user
    ? ROLE_LABELS[user.role]
    : '';

  return (
    <>
      <PageHeader
        title={t('settings')}
        subtitle={t('chooseLanguage')}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {t('profile')}
              </span>
            }
          />

          <form onSubmit={saveProfile} className="space-y-4 p-5">
            <div>
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
              />
            </div>

            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                value={user?.email ?? ''}
                disabled
                className="bg-lavender/60 text-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="role">{t('role')}</Label>
              <Input
                id="role"
                value={roleLabel}
                disabled
                className="bg-lavender/60 text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                {language === 'hi'
                  ? 'भूमिकाएँ आपके सहकारी प्रशासक द्वारा निर्धारित की जाती हैं।'
                  : language === 'kn'
                    ? 'ಪಾತ್ರಗಳನ್ನು ನಿಮ್ಮ ಸಹಕಾರಿ ನಿರ್ವಾಹಕರು ನಿಗದಿಪಡಿಸುತ್ತಾರೆ.'
                    : 'Roles are assigned by your cooperative admin.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={!name.trim() || name.trim() === user?.name}
              >
                {t('saveChanges')}
              </Button>

              {saved && (
                <span className="inline-flex items-center gap-1 text-sm text-pure">
                  <Check className="h-4 w-4" />
                  {language === 'hi'
                    ? 'सहेजा गया'
                    : language === 'kn'
                      ? 'ಉಳಿಸಲಾಗಿದೆ'
                      : 'Saved'}
                </span>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Language selection */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  {t('language')}
                </span>
              }
              subtitle={t('chooseLanguage')}
            />

            <div
              className="grid grid-cols-3 gap-3 p-5"
              role="radiogroup"
              aria-label={t('language')}
            >
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={language === code}
                  onClick={() => chooseLanguage(code)}
                  className={cx(
                    'rounded-2xl border-2 px-3 py-4 text-center transition-colors',
                    language === code
                      ? 'border-navy bg-lavender'
                      : 'border-lavender hover:border-purple-light',
                  )}
                >
                  <span className="block font-serif text-lg font-semibold text-navy">
                    {languageNames[code] === 'Hindi'
                      ? 'हिन्दी'
                      : languageNames[code] === 'Kannada'
                        ? 'ಕನ್ನಡ'
                        : 'English'}
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    {languageNames[code]}
                  </span>

                  {language === code && (
                    <Check
                      className="mx-auto mt-2 h-4 w-4 text-navy"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>

            <p className="px-5 pb-5 text-sm text-slate-500" aria-live="polite">
              {t('languageSaved')}
            </p>
          </Card>

          {/* Connection information */}
          <Card>
            <CardHeader title={t('connection')} />

            <dl className="space-y-3 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t('dataSource')}</dt>
                <dd className="font-medium text-navy">
                  {USE_MOCK
                    ? language === 'hi'
                      ? 'डेमो डेटा'
                      : language === 'kn'
                        ? 'ಡೆಮೊ ಡೇಟಾ'
                        : 'Demo data (mock API)'
                    : t('liveApi')}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">API URL</dt>
                <dd className="truncate font-mono text-xs text-navy">
                  {import.meta.env.VITE_API_URL ?? '—'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
