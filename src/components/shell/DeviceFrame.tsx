/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Wifi, WifiOff, BatteryCharging, Moon, Sun } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children, footer }) => {
  const { theme, setTheme, isOnline } = useFinance();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center font-['Plus_Jakarta_Sans',-apple-system,BlinkMacSystemFont,sans-serif]">
      {/* Native Mobile App Canvas */}
      <div className="w-full max-w-[430px] h-screen sm:h-[900px] sm:max-h-[920px] bg-[#F2F2F7] dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col relative sm:rounded-[48px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_8px_#18181b] overflow-hidden border-0 sm:border border-slate-300 dark:border-slate-800">
        
        {/* Native Mobile Top Status Bar */}
        <div className="h-11 px-6 pt-1 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white select-none shrink-0 z-30">
          <span className="font-mono text-[13px]">{currentTime}</span>

          {/* Discreet Theme & Status Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            )}

            <span className="text-[10px] font-mono tracking-tight text-slate-500">5G</span>
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Scrollable Mobile App Body */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar">
          {children}
        </div>

        {/* Dedicated Fixed Footer Navigation - ALWAYS VISIBLE THE ENTIRE TIME */}
        {footer && (
          <div className="shrink-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {footer}
          </div>
        )}

        {/* Native Mobile Home Gesture Bar */}
        <div className="h-4 flex items-center justify-center bg-transparent shrink-0">
          <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
