import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Compass, BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// --- Data (Defined outside component for performance) ---

const NAV_ITEMS = [
  { name: 'Home', icon: Home, path: '/dashboard' },
  { name: 'Chat', icon: MessageCircle, path: '/chat' },
  { name: 'Journey', icon: Compass, path: '/explorations' },
  { name: 'Library', icon: BookOpen, path: '/library' },
  { name: 'Community', icon: Users, path: '/community' },
];

// --- Sub-component for individual navigation items ---

interface NavItemProps {
  item: typeof NAV_ITEMS[0];
  isActive: boolean;
  onClick: (path: string) => void;
}

const NavItem = ({ item, isActive, onClick }: NavItemProps) => {
  const { name, icon: Icon, path } = item;

  return (
    <motion.button
      key={name}
      onClick={() => onClick(path)}
      aria-label={name}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "relative z-10 flex flex-col items-center justify-center gap-1 flex-1 p-2 transition-colors duration-300 touch-target-large",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium">{name}</span>

      {/* The magic sliding pill effect */}
      {isActive && (
        <motion.div
          layoutId="active-nav-pill"
          className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
          style={{ borderRadius: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </motion.button>
  );
};

// --- Main Mobile Navigation Component ---

export const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Conditional rendering based on auth status and route
  const hiddenRoutes = ['/', '/auth', '/assessment'];
  if (!user || hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-4 pb-safe">
      <nav className="relative flex justify-around items-center p-2 bg-background/50 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={isActive(item.path)}
            onClick={navigate}
          />
        ))}
      </nav>
    </div>
  );
};