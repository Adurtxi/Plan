import {
  ModalOverlay as AriaModalOverlay,
  Modal as AriaModal,
  Dialog as AriaDialog,
} from 'react-aria-components';
import type { ReactNode } from 'react';

interface RASheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isDismissable?: boolean;
  className?: string;
  /** 'right' (default) or 'bottom' */
  side?: 'right' | 'bottom';
}

export const RASheet = ({
  isOpen,
  onClose,
  children,
  isDismissable = true,
  className = '',
  side = 'right',
}: RASheetProps) => {
  const overlayBase = 'fixed inset-0 z-[100] bg-nature-primary/20 backdrop-blur-sm';

  const sheetRight = 'fixed inset-y-0 right-0 w-full md:w-[440px] bg-bg-surface shadow-2xl z-[110] flex flex-col';
  const sheetBottom = 'fixed inset-x-0 bottom-0 max-h-[85vh] bg-bg-surface rounded-t-[24px] shadow-2xl z-[110] flex flex-col';

  const sheetCls = side === 'bottom' ? sheetBottom : sheetRight;
  const enterAnim = side === 'bottom'
    ? 'entering:animate-slide-up'
    : 'entering:animate-slide-in-right';
  const exitAnim = side === 'bottom'
    ? 'exiting:animate-slide-down'
    : 'exiting:animate-slide-out-right';

  return (
    <AriaModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      isDismissable={isDismissable}
      className={`${overlayBase} entering:animate-fade-in exiting:animate-fade-out`}
    >
      <AriaModal className={`${sheetCls} ${enterAnim} ${exitAnim} ${className}`}>
        <AriaDialog className="outline-none h-full flex flex-col overflow-hidden">
          {children}
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
};
