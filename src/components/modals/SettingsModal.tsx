/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useRef, useState } from 'react';
import {
  useFinanceData,
  useFinanceUI,
  useGamification,
} from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { usePWAUpdate } from '../../context/PWAUpdateContext';
import { CurrencyCode } from '../../types/finance';
import { CURRENCY_REGISTRY } from '../../utils/currencies';
import { parseBackupJson, ValidatedBackupData } from '../../utils/backupSchema';
import {
  X,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  User,
  ShieldCheck,
  ChevronRight,
  Volume2,
  VolumeX,
  AlertCircle,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ModalShell } from '../common/ModalShell';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    activeCurrency,
    setActiveCurrency,
    ratesUpdatedAt,
    ratesSource,
    isRefreshingRates,
    refreshExchangeRates,
    resetToDefaultData,
    clearAllDataToZero,
    exportDataJSON,
    exportTransactionsCSV,
    importDataJSON,
  } = useFinanceData();
  const { theme, setTheme } = useFinanceUI();
  const { soundEffectsEnabled, setSoundEffectsEnabled } = useGamification();

  const { user, isOnline, openAuthModal, deleteAccountAndData } = useAuth();
  const { buildId, updateStatus, checkForUpdates, applyUpdate } = usePWAUpdate();
  const titleId = useId();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [pendingRestore, setPendingRestore] = useState<{
    rawJson: string;
    summary: ValidatedBackupData;
  } | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currencies: CurrencyCode[] = ['KRW', 'USD', 'EUR', 'PKR'];
  const hasPasswordProvider = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );

  const formattedRateDate = ratesUpdatedAt
    ? new Date(ratesUpdatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Default reference rates';

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setRestoreFeedback(null);
    try {
      const text = await file.text();
      const parsed = parseBackupJson(text);
      if (!parsed.ok) {
        setRestoreFeedback({ type: 'error', text: parsed.error });
        return;
      }
      setPendingRestore({ rawJson: text, summary: parsed.data });
    } catch {
      setRestoreFeedback({ type: 'error', text: 'Could not read the selected JSON file.' });
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeletingAccount(true);
    try {
      await deleteAccountAndData(hasPasswordProvider ? deletePassword : undefined);
      setIsDeleteAccountConfirmOpen(false);
      setDeletePassword('');
      onClose();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete your account. Please try again.'
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        labelledBy={titleId}
        maxWidthClass="max-w-md"
      >
        <div className="p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 id={titleId} className="text-base font-bold text-[#111315] dark:text-[#F4F5F0]">
                Settings
              </h3>
              <p className="text-xs text-[#6B7268] dark:text-[#8E9689]">
                Currency, cloud account, and appearance
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Cloud Account */}
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689] mb-2">
                Account & Sync
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between hover:border-black/15 dark:hover:border-white/15 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#141617] dark:bg-[#C8EC45] flex items-center justify-center text-[#C8EC45] dark:text-[#111315] shrink-0">
                    {user ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">
                        {user ? user.displayName || user.email : 'Sign In / Connect Account'}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                      {user ? 'Real-time cloud sync active' : 'Sync data across devices'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E9689] shrink-0" />
              </button>
            </div>

            {/* Primary Currency & Live Rates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689]">
                  Primary Currency
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#111315] dark:text-[#C8EC45]">
                  {activeCurrency} ({CURRENCY_REGISTRY[activeCurrency].symbol})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currencies.map((code) => {
                  const meta = CURRENCY_REGISTRY[code];
                  const isSelected = activeCurrency === code;
                  return (
                    <button
                      key={code}
                      onClick={() => setActiveCurrency(code)}
                      type="button"
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                          : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06]'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-xs text-[#111315] dark:text-[#F4F5F0] block">
                          {meta.symbol} {code}
                        </span>
                        <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689] block truncate">
                          {meta.name}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#141617] dark:text-[#C8EC45] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                <span>
                  {ratesSource === 'live'
                    ? `Rates updated ${formattedRateDate}`
                    : 'Using offline fallback rates'}
                </span>
                <button
                  type="button"
                  disabled={isRefreshingRates}
                  onClick={() => void refreshExchangeRates()}
                  className="inline-flex items-center gap-1 font-semibold text-[#111315] dark:text-[#C8EC45] hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingRates ? 'Updating...' : 'Refresh rates'}</span>
                </button>
              </div>
            </div>

            {/* Appearance & Sound */}
            <div className="space-y-3">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689] mb-2">
                  Appearance
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    type="button"
                    className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      theme === 'light'
                        ? 'bg-[#141617] text-white border-[#141617]'
                        : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] text-[#5E655A] dark:text-[#A4AC9E]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    type="button"
                    className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      theme === 'dark'
                        ? 'bg-[#C8EC45] text-[#111315] border-[#C8EC45]'
                        : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] text-[#5E655A] dark:text-[#A4AC9E]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Dark
                  </button>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={soundEffectsEnabled}
                onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
                className="w-full p-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs transition"
              >
                <span className="flex items-center gap-2.5 font-semibold text-[#111315] dark:text-[#F4F5F0]">
                  {soundEffectsEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#141617] dark:text-[#C8EC45]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#8E9689]" />
                  )}
                  <span>Sound effects</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    soundEffectsEnabled
                      ? 'bg-[#C8EC45] text-[#111315]'
                      : 'bg-black/[0.06] dark:bg-white/[0.08] text-[#6B7268] dark:text-[#8E9689]'
                  }`}
                >
                  {soundEffectsEnabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            {/* Data & App Actions */}
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.07] space-y-2">
              <PWAInstallButton variant="card" />

              <div className="p-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                    App Updates
                  </span>
                  <span className="block text-[11px] text-[#6B7268] dark:text-[#8E9689] truncate">
                    {updateStatus === 'checking'
                      ? 'Checking for updates…'
                      : updateStatus === 'updating'
                        ? 'Downloading latest version…'
                        : updateStatus === 'ready'
                          ? 'New version ready to load'
                          : updateStatus === 'up-to-date'
                            ? `Up to date · ${buildId}`
                            : updateStatus === 'offline'
                              ? 'Offline — connect to check'
                              : updateStatus === 'error'
                                ? 'Could not check right now'
                                : `Auto-updates enabled · ${buildId}`}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={updateStatus === 'checking' || updateStatus === 'updating'}
                  onClick={() =>
                    void (updateStatus === 'ready' ? applyUpdate() : checkForUpdates())
                  }
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.08] border border-black/[0.07] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/20 text-[11px] font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${
                      updateStatus === 'checking' || updateStatus === 'updating'
                        ? 'animate-spin'
                        : ''
                    }`}
                  />
                  <span>
                    {updateStatus === 'ready'
                      ? 'Refresh'
                      : updateStatus === 'checking'
                        ? 'Checking'
                        : 'Check'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportTransactionsCSV}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={exportDataJSON}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Backup JSON
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Restore from JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFileChange}
                className="hidden"
              />

              {restoreFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] flex items-start gap-2 border ${
                    restoreFeedback.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-[#C8EC45]'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{restoreFeedback.text}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-500/25 hover:bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {user ? 'Start Fresh (Clear All to ₩0)' : 'Clear All to ₩0'}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletePassword('');
                    setIsDeleteAccountConfirmOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1.5 transition"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Delete my account & all data
                </button>
              )}

              {!user && (
                <button
                  type="button"
                  onClick={async () => {
                    await resetToDefaultData();
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-black/[0.07] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-xs font-medium text-[#6B7268] dark:text-[#8E9689] flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Demo Data (KRW)
                </button>
              )}
            </div>
          </div>
        </div>
      </ModalShell>

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear all accounts and transactions?"
        description={
          user
            ? 'This permanently removes all linked bank accounts, transactions, and charity pledges from your cloud ledger and resets your balance to ₩0.'
            : 'This removes all demo bank accounts, transactions, and charity pledges from this device and resets your balance to ₩0.'
        }
        confirmLabel="Clear everything"
        onConfirm={async () => {
          setIsClearConfirmOpen(false);
          await clearAllDataToZero();
          onClose();
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteAccountConfirmOpen}
        title="Delete your account permanently?"
        description="This permanently deletes all your Firestore accounts, transactions, charity pledges, user profile, and Firebase authentication account. This cannot be undone."
        confirmLabel={isDeletingAccount ? 'Deleting...' : 'Delete permanently'}
        confirmDisabled={isDeletingAccount || (hasPasswordProvider && deletePassword.length < 1)}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => {
          if (!isDeletingAccount) {
            setIsDeleteAccountConfirmOpen(false);
            setDeletePassword('');
            setDeleteError(null);
          }
        }}
      >
        <div className="space-y-2">
          {hasPasswordProvider && (
            <div>
              <label
                htmlFor="delete-account-password"
                className="block text-[11px] font-medium text-[#5E655A] dark:text-[#A4AC9E] mb-1"
              >
                Enter your password to confirm deletion
              </label>
              <input
                id="delete-account-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your current password"
                className="w-full px-3 py-2 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0]"
              />
            </div>
          )}
          {deleteError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={Boolean(pendingRestore)}
        tone="neutral"
        title="Restore backup from JSON?"
        description={
          pendingRestore
            ? `This backup contains ${pendingRestore.summary.accounts.length} accounts, ${pendingRestore.summary.transactions.length} transactions, and ${pendingRestore.summary.charityPledges.length} charity pledges. Restoring will replace your current view and sync to your ledger.`
            : ''
        }
        confirmLabel="Restore backup"
        onConfirm={async () => {
          if (!pendingRestore) return;
          const rawJson = pendingRestore.rawJson;
          setPendingRestore(null);
          const result = await importDataJSON(rawJson);
          if (result.ok && result.counts) {
            setRestoreFeedback({
              type: 'success',
              text: `Restored ${result.counts.accounts} accounts, ${result.counts.transactions} transactions, and ${result.counts.pledges} pledges.`,
            });
          } else {
            setRestoreFeedback({
              type: 'error',
              text: result.error || 'Backup restore failed.',
            });
          }
        }}
        onCancel={() => setPendingRestore(null)}
      />
    </>
  );
};
