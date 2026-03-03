import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
type Size = 'sm' | 'md' | 'lg';

export interface RAButtonProps extends Omit<AriaButtonProps, 'className'> {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-nature-primary text-white hover:bg-nature-accent shadow-solid hover:translate-y-[2px] hover:shadow-none active:translate-y-[4px] font-bold',
  secondary:
    'bg-bg-surface-elevated border border-border-strong text-text-primary hover:border-nature-primary/50 font-bold',
  ghost:
    'text-text-secondary hover:bg-bg-surface-elevated hover:text-text-primary',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] font-bold',
  icon:
    'text-text-muted hover:text-text-primary hover:bg-bg-surface-elevated rounded-full p-2',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

export const RAButton = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: RAButtonProps) => {
  const base = 'inline-flex items-center justify-center gap-2 transition-all outline-none cursor-pointer';
  const focus = 'focus-visible:ring-2 focus-visible:ring-nature-primary/50';
  const disabled = 'disabled:opacity-50 disabled:pointer-events-none';
  const vCls = variantClasses[variant];
  const sCls = variant === 'icon' ? '' : sizeClasses[size];

  return (
    <AriaButton
      className={`${base} ${focus} ${disabled} ${vCls} ${sCls} ${className}`}
      {...props}
    >
      {children}
    </AriaButton>
  );
};
