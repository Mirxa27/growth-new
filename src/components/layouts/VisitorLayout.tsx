import React from 'react';
import { useLocation } from 'react-router-dom';
import VisitorNavigation from '@/components/navigation/VisitorNavigation';
import VisitorFooter from '@/components/navigation/VisitorFooter';

interface VisitorLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
  className?: string;
}

export const VisitorLayout: React.FC<VisitorLayoutProps> = ({
  children,
  showNavigation = true,
  showFooter = true,
  className = ''
}) => {
  const location = useLocation();

  // Determine if we should show visitor navigation based on route
  const isVisitorRoute = () => {
    const visitorRoutes = ['/', '/assessments', '/assessment/', '/auth'];
    return visitorRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route)
    );
  };

  // Only show visitor layout for visitor routes
  if (!isVisitorRoute()) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showNavigation && <VisitorNavigation />}
      
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && <VisitorFooter />}
    </div>
  );
};

export default VisitorLayout;