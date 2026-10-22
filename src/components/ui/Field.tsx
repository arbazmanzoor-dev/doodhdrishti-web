import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cx } from '../../lib';

const base =
  'w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/30';

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(base, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(base, 'pr-8', className)} {...rest}>
      {children}
    </select>
  );
}
