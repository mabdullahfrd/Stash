/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { DeviceFrame } from './components/shell/DeviceFrame';
import { TabBar } from './components/navigation/TabBar';
import { AuthView } from './components/views/AuthView';
import { PocketsView } from './components/views/PocketsView';
import { ScannerView } from './components/views/ScannerView';
import { ActivityView } from './components/views/ActivityView';
import { TransactionModal } from './components/modals/TransactionModal';
import { IncomeCharityModal } from './components/modals/IncomeCharityModal';
import { AccountModal } from './components/modals/AccountModal';
import { CurrencyHoldModal } from './components/modals/CurrencyHoldModal';
import { AuthModal } from './components/modals/AuthModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { LaunchSplash } from './components/onboarding/LaunchSplash';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { PreAuthStage, resolveInitialPreAuthStage } from './utils/onboardingFlow';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { activeTab, isSettingsModalOpen, closeSettingsModal } = useFinance();
  const [preAuthStage, setPreAuthStage] = useState<PreAuthStage>(() =>
    resolveInitialPreAuthStage(
      typeof window !== 'undefined' ? window.location.search : ''
    )
  );

  // During initial launch, play the animated logo splash while auth status resolves.
  if (preAuthStage === 'splash' && (loading || !isAuthenticated)) {
    return (
      <LaunchSplash
        readyToAdvance={!loading}
        onComplete={() => setPreAuthStage('onboarding')}
      />
    );
  }

  if (!isAuthenticated) {
    if (preAuthStage === 'onboarding') {
      return (
        <OnboardingFlow
          onComplete={() => setPreAuthStage('auth')}
          onReplaySplash={() => setPreAuthStage('splash')}
        />
      );
    }

    return (
      <AuthView
        onBackToHighlights={() => setPreAuthStage('onboarding')}
        onReplaySplash={() => setPreAuthStage('splash')}
      />
    );
  }

  return (
    <DeviceFrame footer={<TabBar />}>
      <div className="flex-1 flex flex-col min-h-full">
        {/* Active Mobile Screen */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'pockets' && <PocketsView />}
          {activeTab === 'scanner' && <ScannerView />}
          {activeTab === 'activity' && <ActivityView />}
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
    <AuthProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
