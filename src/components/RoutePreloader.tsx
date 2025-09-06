/**
 * Route Preloader Component
 * Intelligent route preloading based on user behavior and interaction patterns
 */

import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { preloadStrategies, lazyRouteManager } from '@/utils/lazyRoutes';

interface RoutePreloaderProps {
  children: React.ReactNode;
}

interface RoutePreloadConfig {
  path: string;
  importFn: () => Promise<any>;
  strategy: 'hover' | 'viewport' | 'idle' | 'immediate';
  priority: 'high' | 'medium' | 'low';
  conditions?: () => boolean;
}

const ROUTE_PRELOAD_CONFIG: RoutePreloadConfig[] = [
  // High priority routes - preload immediately after initial load
  {
    path: '/assessment',
    importFn: () => import('@/pages/PublicAssessment'),
    strategy: 'immediate',
    priority: 'high'
  },
  {
    path: '/simple-assessment-landing',
    importFn: () => import('@/pages/SimpleAssessmentLanding'),
    strategy: 'immediate',
    priority: 'high'
  },

  // Medium priority routes - preload on hover or viewport
  {
    path: '/chat',
    importFn: () => import('@/pages/Chat'),
    strategy: 'hover',
    priority: 'medium',
    conditions: () => localStorage.getItem('auth_token') !== null
  },
  {
    path: '/dashboard',
    importFn: () => import('@/pages/Dashboard'),
    strategy: 'hover',
    priority: 'medium',
    conditions: () => localStorage.getItem('auth_token') !== null
  },
  {
    path: '/explorations',
    importFn: () => import('@/pages/Explorations'),
    strategy: 'hover',
    priority: 'medium',
    conditions: () => localStorage.getItem('auth_token') !== null
  },

  // Low priority routes - preload when idle
  {
    path: '/library',
    importFn: () => import('@/pages/Library'),
    strategy: 'idle',
    priority: 'low',
    conditions: () => localStorage.getItem('auth_token') !== null
  },
  {
    path: '/profile',
    importFn: () => import('@/pages/Profile'),
    strategy: 'idle',
    priority: 'low',
    conditions: () => localStorage.getItem('auth_token') !== null
  },
  {
    path: '/community',
    importFn: () => import('@/pages/Community'),
    strategy: 'idle',
    priority: 'low',
    conditions: () => localStorage.getItem('auth_token') !== null
  },

  // Admin routes - conditional preloading based on role
  {
    path: '/admin',
    importFn: () => import('@/pages/AdminDashboard'),
    strategy: 'hover',
    priority: 'low',
    conditions: () => {
      const userRole = localStorage.getItem('user_role');
      return userRole === 'admin' || userRole === 'super_admin';
    }
  }
];

export const RoutePreloader: React.FC<RoutePreloaderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const preloadedRoutes = useRef<Set<string>>(new Set());
  const hoverTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Setup immediate preloading for high priority routes
   */
  useEffect(() => {
    const immediateRoutes = ROUTE_PRELOAD_CONFIG.filter(
      config => config.strategy === 'immediate' && 
                config.priority === 'high' &&
                (!config.conditions || config.conditions())
    );

    immediateRoutes.forEach(route => {
      if (!preloadedRoutes.current.has(route.path)) {
        setTimeout(() => {
          lazyRouteManager.preloadComponent(route.importFn, route.path);
          preloadedRoutes.current.add(route.path);
        }, 2000); // Delay to not impact initial load
      }
    });
  }, []);

  /**
   * Setup idle preloading for low priority routes
   */
  useEffect(() => {
    const idleRoutes = ROUTE_PRELOAD_CONFIG.filter(
      config => config.strategy === 'idle' &&
                (!config.conditions || config.conditions())
    );

    idleRoutes.forEach(route => {
      if (!preloadedRoutes.current.has(route.path)) {
        preloadStrategies.onIdle(route.importFn, route.path);
        preloadedRoutes.current.add(route.path);
      }
    });
  }, []);

  /**
   * Setup hover preloading for navigation links
   */
  useEffect(() => {
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;

      const routeConfig = ROUTE_PRELOAD_CONFIG.find(config => 
        href.startsWith(config.path) && 
        config.strategy === 'hover' &&
        (!config.conditions || config.conditions())
      );

      if (routeConfig && !preloadedRoutes.current.has(routeConfig.path)) {
        // Clear any existing timeout for this route
        const existingTimeout = hoverTimeouts.current.get(routeConfig.path);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new timeout to preload after a brief delay
        const timeout = setTimeout(() => {
          lazyRouteManager.preloadComponent(routeConfig.importFn, routeConfig.path);
          preloadedRoutes.current.add(routeConfig.path);
          hoverTimeouts.current.delete(routeConfig.path);
        }, 100); // 100ms delay to avoid excessive preloading

        hoverTimeouts.current.set(routeConfig.path, timeout);
      }
    };

    const handleLinkLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;

      const routeConfig = ROUTE_PRELOAD_CONFIG.find(config => 
        href.startsWith(config.path)
      );

      if (routeConfig) {
        const timeout = hoverTimeouts.current.get(routeConfig.path);
        if (timeout) {
          clearTimeout(timeout);
          hoverTimeouts.current.delete(routeConfig.path);
        }
      }
    };

    document.addEventListener('mouseover', handleLinkHover);
    document.addEventListener('mouseout', handleLinkLeave);
    document.addEventListener('touchstart', handleLinkHover); // For mobile

    return () => {
      document.removeEventListener('mouseover', handleLinkHover);
      document.removeEventListener('mouseout', handleLinkLeave);
      document.removeEventListener('touchstart', handleLinkHover);
      
      // Clear all pending timeouts
      hoverTimeouts.current.forEach(timeout => clearTimeout(timeout));
      hoverTimeouts.current.clear();
    };
  }, []);

  /**
   * Preload routes based on current location patterns
   */
  useEffect(() => {
    const currentPath = location.pathname;

    // Predictive preloading based on current route
    const predictivePreload = () => {
      // If on auth page, preload dashboard
      if (currentPath === '/auth') {
        const dashboardConfig = ROUTE_PRELOAD_CONFIG.find(c => c.path === '/dashboard');
        if (dashboardConfig && !preloadedRoutes.current.has('/dashboard')) {
          setTimeout(() => {
            lazyRouteManager.preloadComponent(dashboardConfig.importFn, '/dashboard');
            preloadedRoutes.current.add('/dashboard');
          }, 1000);
        }
      }

      // If on dashboard, preload common next routes
      if (currentPath === '/dashboard') {
        const commonRoutes = ['/chat', '/explorations', '/assessment'];
        commonRoutes.forEach(path => {
          const config = ROUTE_PRELOAD_CONFIG.find(c => c.path === path);
          if (config && !preloadedRoutes.current.has(path) && 
              (!config.conditions || config.conditions())) {
            setTimeout(() => {
              lazyRouteManager.preloadComponent(config.importFn, path);
              preloadedRoutes.current.add(path);
            }, 2000);
          }
        });
      }

      // If on assessment, preload results page
      if (currentPath.startsWith('/assessment')) {
        // Preload results page since users typically complete assessments
        setTimeout(() => {
          import('@/pages/ResultsPage').catch(() => {}); // Silent fail
        }, 3000);
      }
    };

    predictivePreload();
  }, [location.pathname]);

  /**
   * Monitor user engagement and adjust preloading strategy
   */
  useEffect(() => {
    let userActiveTime = 0;
    let lastActivity = Date.now();
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const checkEngagement = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity < 1000) { // User active in last second
        userActiveTime += 1000;
      }

      // If user is highly engaged (>30s active), preload more aggressively
      if (userActiveTime > 30000) {
        const remainingRoutes = ROUTE_PRELOAD_CONFIG.filter(
          config => !preloadedRoutes.current.has(config.path) &&
                    (!config.conditions || config.conditions())
        );

        remainingRoutes.forEach((route, index) => {
          setTimeout(() => {
            lazyRouteManager.preloadComponent(route.importFn, route.path);
            preloadedRoutes.current.add(route.path);
          }, index * 500); // Stagger preloading
        });

        userActiveTime = 0; // Reset to avoid repeated preloading
      }
    };

    // Listen for user activity
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keydown', updateActivity);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('click', updateActivity);
    document.addEventListener('touchstart', updateActivity);

    // Check engagement every 5 seconds
    const engagementInterval = setInterval(checkEngagement, 5000);

    return () => {
      document.removeEventListener('mousemove', updateActivity);
      document.removeEventListener('keydown', updateActivity);
      document.removeEventListener('scroll', updateActivity);
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('touchstart', updateActivity);
      clearInterval(engagementInterval);
    };
  }, []);

  return <>{children}</>;
};

export default RoutePreloader;