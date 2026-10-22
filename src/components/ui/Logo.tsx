import { cx } from '../../lib';

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill={light ? '#fff' : '#2F2B6E'} />
        <path d="M16 6c-4 5.5-7 9.6-7 13a7 7 0 0 0 14 0c0-3.4-3-7.5-7-13z" fill={light ? '#2F2B6E' : '#fff'} />
        <circle cx="16" cy="19" r="3" fill="#E88A1A" />
      </svg>
      <span className={cx('font-serif text-xl font-bold tracking-tight', light ? 'text-white' : 'text-navy')}>
        Doodh<span className="text-saffron">Drishti</span>
      </span>
    </span>
  );
}
