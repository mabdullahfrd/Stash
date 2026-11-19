/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryLabel?: string;
  tone?: 'danger' | 'neutral';
  confirmDisabled?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onSecondaryAction?: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  secondaryLabel,
  tone = 'danger',
  confirmDisabled = false,
  children,
  onConfirm,
  onSecondaryAction,
  onCancel,
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const focusTarget = cancelBtnRef.current;
    focusTarget?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              tone === 'danger'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                : 'bg-[#F4F5F0] dark:bg-white/[0.07] text-[#111315] dark:text-[#C8EC45]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3
              id={titleId}
              className="text-sm font-bold text-[#111315] dark:text-[#F4F5F0]"
            >
              {title}
            </h3>
            <p
              id={descId}
              className="text-xs text-[#6B7268] dark:text-[#8E9689] leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>

        {children}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] transition"
          >
            {cancelLabel}
          </button>

          {secondaryLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={() => void onSecondaryAction()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] text-xs font-semibold transition"
            >
              {secondaryLabel}
            </button>
          )}

          <button
            type="button"
            disabled={confirmDisabled}
            onClick={() => void onConfirm()}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 ${
              tone === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
