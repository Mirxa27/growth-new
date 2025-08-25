
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

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassmorphic Background with Gradient Border */}
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-xl transform scale-110 pointer-events-none"></div>
        
        {/* Main Navigation Container */}
        <nav className="relative glass border-t border-glass-border/30 mx-2 mb-2 rounded-2xl overflow-hidden z-10">
          {/* Aurora Background Effect */}
          <div className="absolute inset-0 bg-gradient-aurora opacity-30 animate-float pointer-events-none"></div>
          
          {/* Navigation Items */}
          <div className="relative flex justify-around items-center px-2 py-3 z-20">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center relative transition-all duration-300 ease-spring group",
                    "min-w-0 flex-1 p-3 rounded-xl",
                    active 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground hover:text-foreground hover:scale-105"
                  )}
                >
                  {/* Active Background Glow */}
                  {active && (
                    <div className="absolute inset-0 bg-primary/10 rounded-xl blur-sm animate-glow pointer-events-none"></div>
                  )}
                  
                  {/* Icon Container with Glass Effect */}
                  <div className={cn(
                    "relative mb-1 p-2 rounded-lg transition-all duration-300 z-10",
                    active 
                      ? "glass-glow bg-primary/20" 
                      : "group-hover:glass group-hover:bg-glass-ambient/10"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-all duration-300",
                      active && "drop-shadow-glow filter brightness-110"
                    )} />
                    
                    {/* Active Indicator Dot */}
                    {active && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse pointer-events-none"></div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-xs font-medium truncate transition-all duration-300 relative z-10",
                    active 
                      ? "text-primary font-semibold" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.name}
                  </span>

                  {/* Ripple Effect on Press */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-active:opacity-100 bg-white/10 animate-micro-bounce pointer-events-none"></div>
                </button>
              );
            })}
          </div>

          {/* Subtle Border Glow */}
          <div className="absolute inset-0 rounded-2xl border border-glass-glow/50 pointer-events-none"></div>
        </nav>

        {/* Bottom Safe Area */}
        <div className="h-safe-area-inset-bottom bg-transparent"></div>
      </div>
    </div>
  );
};
