import React from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';
import { Sidebar } from '@/components/Sidebar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
};