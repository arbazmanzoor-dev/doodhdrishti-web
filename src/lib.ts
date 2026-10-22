import type { Verdict } from './types';

export const VERDICT_LABEL: Record<Verdict, string> = {
  pure: 'Pure',
  suspicious: 'Suspicious',
  adulterated: 'Adulterated',
};

export const VERDICT_COLOR: Record<Verdict, string> = {
  pure: '#16A34A',
  suspicious: '#D97706',
  adulterated: '#DC2626',
};

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function shortCentre(name: string) {
  // "Mandya Milk Union – Maddur" -> "Maddur"
  const parts = name.split('–');
  return (parts[1] ?? parts[0]).trim();
}

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
