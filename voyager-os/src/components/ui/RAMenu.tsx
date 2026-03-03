import {
  MenuTrigger as AriaMenuTrigger,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  Popover as AriaPopover,
  Separator as AriaSeparator,
  type MenuItemProps as AriaMenuItemProps,
} from 'react-aria-components';
import type { ReactNode } from 'react';

/* ── Trigger ── */
interface RAMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export const RAMenu = ({ trigger, children, className = '' }: RAMenuProps) => {
  return (
    <AriaMenuTrigger>
      {trigger}
      <AriaPopover
        className={`min-w-[12rem] bg-bg-surface border border-border-strong rounded-2xl shadow-2xl py-1.5 z-[5000] overflow-hidden animate-fade-in ${className}`}
        placement="bottom end"
        offset={5}
      >
        <AriaMenu className="outline-none">
          {children}
        </AriaMenu>
      </AriaPopover>
    </AriaMenuTrigger>
  );
};

/* ── Item ── */
interface RAMenuItemProps extends Omit<AriaMenuItemProps, 'className'> {
  icon?: ReactNode;
  destructive?: boolean;
  className?: string;
  children: ReactNode;
}

export const RAMenuItem = ({
  icon,
  destructive = false,
  className = '',
  children,
  ...props
}: RAMenuItemProps) => {
  const base = 'w-full text-left px-4 py-2 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer outline-none';
  const colorCls = destructive
    ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20'
    : 'text-text-secondary hover:bg-bg-surface-elevated focus:bg-bg-surface-elevated';

  return (
    <AriaMenuItem className={`${base} ${colorCls} ${className}`} {...props}>
      {icon}
      {children}
    </AriaMenuItem>
  );
};

/* ── Separator ── */
export const RAMenuSeparator = () => (
  <AriaSeparator className="my-1 h-px bg-border-strong" />
);
