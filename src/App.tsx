/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { DeviceFrame } from './components/shell/DeviceFrame';
import { TabBar } from './components/navigation/TabBar';
import { AuthView } from './components/views/AuthView';
import { PocketsView } from './components/views/PocketsView';
import { ScannerView } from './components/views/ScannerView';
import { ActivityView } from './components/views/ActivityView';
import { CharityView } from './components/views/CharityView';
import { TransactionModal } from './components/modals/TransactionModal';
import { CharityPledgeModal } from './components/modals/CharityPledgeModal';
import { FulfillCharityModal } from './components/modals/FulfillCharityModal';
import { AccountModal } from './components/modals/AccountModal';
import { CurrencyHoldModal } from './components/modals/CurrencyHoldModal';
import { AuthModal } from './components/modals/AuthModal';
import { SettingsModal } from './components/modals/SettingsModal';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeTab, isSettingsModalOpen, closeSettingsModal } = useFinance();

  if (!isAuthenticated) {
    return (
      <DeviceFrame>
        <AuthView />
      </DeviceFrame>
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
          {activeTab === 'charity' && <CharityView />}
        </div>

        {/* Dynamic Modals */}
        <TransactionModal />
        <CharityPledgeModal />
        <FulfillCharityModal />
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
