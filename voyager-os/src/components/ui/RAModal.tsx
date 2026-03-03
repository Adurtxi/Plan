import {
  ModalOverlay as AriaModalOverlay,
  Modal as AriaModal,
  Dialog as AriaDialog,
} from 'react-aria-components';
import type { ReactNode } from 'react';

interface RAModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isDismissable?: boolean;
  className?: string;
  overlayClassName?: string;
  /** 'center' = centered modal, 'fullscreen' = full viewport */
  variant?: 'center' | 'fullscreen';
}

export const RAModal = ({
  isOpen,
  onClose,
  children,
  isDismissable = true,
  className = '',
  overlayClassName = '',
  variant = 'center',
}: RAModalProps) => {
  const overlayBase = 'fixed inset-0 z-[9998] bg-nature-primary/40 backdrop-blur-sm';
  const overlayAnimation = 'entering:animate-fade-in exiting:animate-fade-out';

  const modalCenter = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[480px] bg-bg-surface rounded-[32px] shadow-2xl z-[9999] p-6';
  const modalFull = 'fixed inset-4 bg-bg-surface rounded-[24px] shadow-2xl z-[9999] overflow-hidden';
  const modalAnimation = 'entering:animate-scale-in exiting:animate-scale-out';

  const modalCls = variant === 'fullscreen' ? modalFull : modalCenter;

  return (
    <AriaModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      isDismissable={isDismissable}
      className={`${overlayBase} ${overlayAnimation} ${overlayClassName}`}
    >
      <AriaModal className={`${modalCls} ${modalAnimation} ${className}`}>
        <AriaDialog className="outline-none h-full flex flex-col">
          {children}
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
};
