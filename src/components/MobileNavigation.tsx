import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, User, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const MobileNavigation: React.FC = () => {
  const { user } = useAuth();

  const tabs = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Assess', href: '/assessment', icon: Brain },
    { name: 'Learn', href: '/library', icon: BookOpen },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Profile', href: user ? '/profile' : '/auth', icon: User },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 p-4 md:hidden" 
      role="navigation" 
      aria-label="Mobile Navigation"
    >
      <div className="glass-strong rounded-2xl mx-2 p-2 shadow-lg backdrop-blur-xl bg-white/95 border border-white/20">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 touch-manipulation ${
                  // Ensure minimum touch target size of 44px (iOS standard)
                  'min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px]'
                } group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  isActive
                    ? 'bg-primary/20 text-primary shadow-sm scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10 active:bg-white/20 active:scale-95'
                }`
              }
              aria-current={undefined}
              // Enhanced accessibility
              aria-label={`Navigate to ${tab.name}`}
            >
              {({ isActive }) => (
                <>
                  <tab.icon 
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive 
                        ? 'scale-110 text-primary' 
                        : 'group-hover:scale-110 group-active:scale-95'
                    }`}
                    aria-hidden="true"
                  />
                  <span 
                    className={`text-xs font-medium mt-1 transition-all duration-200 ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {tab.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};