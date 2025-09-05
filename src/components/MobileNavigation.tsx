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
    <nav className="fixed bottom-0 left-0 right-0 z-40 p-4 md:hidden" role="navigation" aria-label="Mobile Navigation">
      <div className="glass-strong rounded-2xl mx-2 p-2">
        <div className="flex justify-around">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-h-[56px] min-w-[56px] group ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`
              }
              aria-current={undefined}
            >
              <tab.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium mt-1">{tab.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};