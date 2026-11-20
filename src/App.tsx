/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinanceUI } from './context/FinanceContext';
import { PWAUpdateProvider } from './context/PWAUpdateContext';
import { DeviceFrame } from './components/shell/DeviceFrame';
import { TabBar } from './components/navigation/TabBar';
import { PWAUpdateBanner } from './components/common/PWAUpdateBanner';
import { TransactionModal } from './components/modals/TransactionModal';
import { IncomeCharityModal } from './components/modals/IncomeCharityModal';
import { AccountModal } from './components/modals/AccountModal';
import { CurrencyHoldModal } from './components/modals/CurrencyHoldModal';
import { AuthModal } from './components/modals/AuthModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { PreAuthStage, resolveInitialPreAuthStage } from './utils/onboardingFlow';

const AuthView = lazy(() =>
  import('./components/views/AuthView').then((m) => ({ default: m.AuthView }))
);
const PocketsView = lazy(() =>
  import('./components/views/PocketsView').then((m) => ({ default: m.PocketsView }))
);
const ScannerView = lazy(() =>
  import('./components/views/ScannerView').then((m) => ({ default: m.ScannerView }))
);
const ActivityView = lazy(() =>
  import('./components/views/ActivityView').then((m) => ({ default: m.ActivityView }))
);
const LaunchSplash = lazy(() =>
  import('./components/onboarding/LaunchSplash').then((m) => ({ default: m.LaunchSplash }))
);
const OnboardingFlow = lazy(() =>
  import('./components/onboarding/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow }))
);

const ScreenFallback: React.FC = () => (
  <div className="min-h-dvh flex-1 flex items-center justify-center bg-[#F4F5F0] dark:bg-[#0D0F0C]">
    <div
      role="status"
      aria-label="Loading view"
      className="w-7 h-7 rounded-full border-2 border-[#141617]/20 dark:border-white/20 border-t-[#141617] dark:border-t-[#C8EC45] animate-spin"
    />
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { activeTab, isSettingsModalOpen, closeSettingsModal } = useFinanceUI();
  const [preAuthStage, setPreAuthStage] = useState<PreAuthStage>(() =>
    resolveInitialPreAuthStage(
      typeof window !== 'undefined' ? window.location.search : ''
    )
  );

  // During initial launch, play the animated logo splash while auth status resolves.
  if (preAuthStage === 'splash' && (loading || !isAuthenticated)) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <LaunchSplash
          readyToAdvance={!loading}
          onComplete={() => setPreAuthStage('onboarding')}
        />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    if (preAuthStage === 'onboarding') {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <OnboardingFlow
            onComplete={() => setPreAuthStage('auth')}
            onReplaySplash={() => setPreAuthStage('splash')}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<ScreenFallback />}>
        <AuthView
          onBackToHighlights={() => setPreAuthStage('onboarding')}
          onReplaySplash={() => setPreAuthStage('splash')}
        />
      </Suspense>
    );
  }

  return (
    <DeviceFrame footer={<TabBar />}>
      <div className="flex-1 flex flex-col min-h-full">
        {/* Active Mobile Screen */}
        <div className="flex-1 flex flex-col">
          <Suspense fallback={<ScreenFallback />}>
            {activeTab === 'pockets' && <PocketsView />}
            {activeTab === 'scanner' && <ScannerView />}
            {activeTab === 'activity' && <ActivityView />}
          </Suspense>
        </div>

        {/* Dynamic Modals */}
        <TransactionModal />
        <IncomeCharityModal />
        <AccountModal />
        <CurrencyHoldModal />
        <AuthModal />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={closeSettingsModal} />
      </div>
    </DeviceFrame>
  );
};

export default function App() {
  return (
    <PWAUpdateProvider>
      <AuthProvider>
        <FinanceProvider>
          <AppContent />
          <PWAUpdateBanner />
        </FinanceProvider>
      </AuthProvider>
    </PWAUpdateProvider>
  );
}
