import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';
const styles: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-700 shadow-soft',
  accent: 'bg-saffron text-white hover:bg-saffron-dark shadow-soft',
  outline: 'border border-navy/20 bg-white text-navy hover:bg-lavender',
  ghost: 'text-navy hover:bg-lavender',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        styles[variant],
        className,
      )}
      {...rest}
    />
  );
});
