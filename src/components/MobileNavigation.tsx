import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Compass, BookOpen, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Hide mobile nav on landing page and auth pages
  if (!user || location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  const navItems = [
    {
      name: 'Home',
      icon: Home,
      path: '/dashboard',
      label: 'Dashboard'
    },
    {
      name: 'Chat',
      icon: MessageCircle,
      path: '/chat',
      label: 'AI Companion'
    },
    {
      name: 'Journey',
      icon: Compass,
      path: '/explorations',
      label: 'Explorations'
    },
    {
      name: 'Library',
      icon: BookOpen,
      path: '/library',
      label: 'Wellness'
    },
    {
      name: 'Profile',
      icon: User,
      path: '/profile',
      label: 'Profile'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass border-t border-glass px-2 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-0 flex-1",
                  active 
                    ? "text-primary bg-primary/10 scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-glass-ambient/5"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-1", active && "drop-shadow-glow")} />
                <span className="text-xs font-medium truncate">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};