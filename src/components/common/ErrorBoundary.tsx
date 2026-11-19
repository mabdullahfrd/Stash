/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Stash ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen w-full bg-[#F4F5F0] dark:bg-[#0D0F0C] text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',-apple-system,BlinkMacSystemFont,sans-serif]">
        <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.08] p-7 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold tracking-tight">Something went wrong</h1>
            <p className="text-xs text-[#6B7268] dark:text-[#8E9689] leading-relaxed">
              Stash encountered an unexpected error. Your saved data is safe—reload to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="w-full py-3 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Stash</span>
          </button>
        </div>
      </div>
    );
  }
}
