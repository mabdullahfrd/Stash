/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  align?: 'bottom-sheet' | 'center';
  maxWidthClass?: string;
  zIndexClass?: string;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  labelledBy,
  align = 'bottom-sheet',
  maxWidthClass = 'max-w-md',
  zIndexClass = 'z-50',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(document.activeElement)) return;
      const firstFocusable = containerRef.current.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow higher-priority alertdialogs (e.g. ConfirmDialog) to handle Escape first
      const activeAlertDialog = document.querySelector('[role="alertdialog"]');
      if (activeAlertDialog && !containerRef.current?.contains(activeAlertDialog)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusable = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayAlign =
    align === 'center'
      ? 'items-center p-4'
      : 'items-end sm:items-center p-0 sm:p-4';

  const panelRadius =
    align === 'center'
      ? 'rounded-[28px]'
      : 'rounded-t-[28px] sm:rounded-[28px]';

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex justify-center ${overlayAlign} bg-black/50 backdrop-blur-xs animate-in fade-in duration-150`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`w-full ${maxWidthClass} bg-white dark:bg-[#161915] ${panelRadius} shadow-2xl border border-black/[0.08] dark:border-white/[0.08] max-h-[92vh] flex flex-col overflow-hidden`}
      >
        {children}
      </div>
    </div>
  );
};
