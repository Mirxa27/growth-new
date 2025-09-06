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
      <div className="mx-2 p-2 rounded-3xl shadow-2xl overflow-hidden">
        {/* Deep purple glassmorphism container */}
        <div className="relative rounded-2xl bg-white/6 backdrop-blur-md border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-violet-800/40 to-indigo-900/70 pointer-events-none" />
          <div className="relative flex justify-around items-center px-1 py-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.href}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] group focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-30 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10'
                  }`
                }
                aria-current={undefined}
                aria-label={`Navigate to ${tab.name}`}
              >
                {({ isActive }) => (
                  <>
                    <tab.icon
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive ? 'scale-110 text-white' : 'group-hover:scale-110 group-active:scale-95 text-white/80'
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-xs font-medium mt-1 transition-all duration-200 ${
                        isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
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
      </div>

      {/* Safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};