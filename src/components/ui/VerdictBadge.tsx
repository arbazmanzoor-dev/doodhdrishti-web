import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { Verdict } from '../../types';
import { VERDICT_LABEL, cx } from '../../lib';

const style: Record<Verdict, string> = {
  pure: 'bg-pure-bg text-pure',
  suspicious: 'bg-suspicious-bg text-suspicious',
  adulterated: 'bg-adulterated-bg text-adulterated',
};
const Icon = { pure: CheckCircle2, suspicious: AlertTriangle, adulterated: XCircle };

export function VerdictBadge({ verdict, size = 'sm' }: { verdict: Verdict; size?: 'sm' | 'lg' }) {
  const I = Icon[verdict];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-4 py-1.5 text-base',
        style[verdict],
      )}
    >
      <I className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'} aria-hidden />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
