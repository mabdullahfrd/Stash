/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { UIProvider, useFinanceUI, UIContextType } from './UIContext';
import {
  GamificationProvider,
  useGamification,
  GamificationContextType,
} from './GamificationContext';
import {
  FinanceDataProvider,
  useFinanceData,
  FinanceDataContextType,
  ImportBackupResult,
  PledgeFulfillResult,
} from './FinanceDataContext';

export type { ImportBackupResult, PledgeFulfillResult };
export { useFinanceUI, useGamification, useFinanceData };

export type FinanceContextType = FinanceDataContextType &
  GamificationContextType &
  UIContextType;

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <UIProvider>
      <GamificationProvider>
        <FinanceDataProvider>{children}</FinanceDataProvider>
      </GamificationProvider>
    </UIProvider>
  );
};

export function useFinance(): FinanceContextType {
  const data = useFinanceData();
  const gamification = useGamification();
  const ui = useFinanceUI();

  return useMemo(
    () => ({
      ...data,
      ...gamification,
      ...ui,
    }),
    [data, gamification, ui]
  );
}
