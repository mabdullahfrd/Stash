/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface DeviceFrameProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children, footer }) => {
  return (
    <div className="min-h-screen w-full bg-[#F4F5F0] dark:bg-[#0D0F0C] text-[#111315] dark:text-[#F4F5F0] flex flex-col font-['Plus_Jakarta_Sans',-apple-system,BlinkMacSystemFont,sans-serif] transition-colors">
      {/* Centered Responsive Workspace Container */}
      <div className="flex-1 flex flex-col w-full max-w-[1040px] mx-auto relative pb-24 sm:pb-28">
        {children}
      </div>

      {/* Persistent Floating Bottom Capsule Navigation */}
      {footer && (
        <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-4 sm:pb-6 px-4 flex justify-center">
          <div className="pointer-events-auto w-full max-w-[360px]">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
};
