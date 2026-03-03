import {
  TooltipTrigger as AriaTooltipTrigger,
  Tooltip as AriaTooltip,
  OverlayArrow as AriaOverlayArrow,
} from 'react-aria-components';
import type { ReactNode } from 'react';

interface RATooltipProps {
  content: string;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const RATooltip = ({
  content,
  children,
  placement = 'top',
  delay = 500,
}: RATooltipProps) => {
  return (
    <AriaTooltipTrigger delay={delay}>
      {children}
      <AriaTooltip
        placement={placement}
        className="bg-bg-surface-elevated text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg border border-border-strong z-[9999] animate-fade-in"
      >
        <AriaOverlayArrow>
          <svg width={8} height={8} viewBox="0 0 8 8" className="fill-bg-surface-elevated stroke-border-strong">
            <path d="M0 0 L4 4 L8 0" />
          </svg>
        </AriaOverlayArrow>
        {content}
      </AriaTooltip>
    </AriaTooltipTrigger>
  );
};
