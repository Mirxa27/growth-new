import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

// Dynamic imports for Capacitor to avoid build issues on web
let Capacitor: any;
let App: any;
let StatusBar: any;
let SplashScreen: any;
let Keyboard: any;
let OfflineSyncService: any;

// Dynamically import Capacitor modules only when needed
const initializeCapacitorModules = async () => {
  try {
    const capacitorCore = await import('@capacitor/core');
    Capacitor = capacitorCore.Capacitor;
    
    if (Capacitor.isNativePlatform()) {
      const [appModule, statusBarModule, splashScreenModule, keyboardModule, syncService] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
        import('@capacitor/keyboard'),
        import('@/services/mobile/offline-sync.service')
      ]);
      
      App = appModule.App;
      StatusBar = statusBarModule.StatusBar;
      SplashScreen = splashScreenModule.SplashScreen;
      Keyboard = keyboardModule.Keyboard;
      OfflineSyncService = syncService.OfflineSyncService;
    }
    
    return true;
  } catch (error) {
    logger.warn('Capacitor modules not available, running in web mode', error);
    return false;
  }
};

interface MobileWrapperProps {
  children: React.ReactNode;
}

/**
 * Mobile wrapper component that handles mobile-specific functionality
 * Includes deep linking, status bar management, and offline sync
 */
export const MobileWrapper: React.FC<MobileWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    lastSync: null as string | null,
    pendingItems: 0
  });

  useEffect(() => {
    initializeMobileApp();
    return () => {
      // Cleanup on unmount
      if (OfflineSyncService) {
        OfflineSyncService.stopPeriodicSync();
      }
    };
  }, []);

  useEffect(() => {
    // Update sync status periodically
    const updateSyncStatus = async () => {
      if (Capacitor?.isNativePlatform() && OfflineSyncService) {
        try {
          const status = await OfflineSyncService.getSyncStatus();
          setSyncStatus(status);
        } catch (error) {
          logger.warn('Failed to update sync status', error);
        }
      }
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const initializeMobileApp = async () => {
    try {
      logger.info('Initializing mobile app...');
      
      // Initialize Capacitor modules
      const capacitorAvailable = await initializeCapacitorModules();
      
      if (!capacitorAvailable || !Capacitor?.isNativePlatform()) {
        logger.info('Running in web mode');
        setIsInitialized(true);
        return;
      }

      // Initialize offline sync service
      if (OfflineSyncService) {
        await OfflineSyncService.initialize();
      }

      // Configure status bar
      await configureStatusBar();

      // Set up deep link handling
      setupDeepLinkHandling();

      // Set up keyboard handling
      setupKeyboardHandling();

      // Set up app state handling
      setupAppStateHandling();

      // Hide splash screen
      if (SplashScreen) {
        await SplashScreen.hide();
      }

      setIsInitialized(true);
      logger.info('Mobile app initialized successfully');

      // Show welcome message for first-time users
      const isFirstLaunch = localStorage.getItem('newomen_first_launch');
      if (!isFirstLaunch) {
        localStorage.setItem('newomen_first_launch', 'false');
        toast({
          title: 'Welcome to Newomen!',
          description: 'Explore assessments and track your personal growth journey.',
          duration: 5000
        });
      }

    } catch (error) {
      logger.error('Failed to initialize mobile app', 'MobileWrapper', error);
      setIsInitialized(true); // Continue anyway
    }
  };

  const configureStatusBar = async () => {
    try {
      if (StatusBar) {
        const { Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.show();
      }
    } catch (error) {
      logger.warn('Failed to configure status bar', error);
    }
  };

  const setupDeepLinkHandling = () => {
    if (!App) return;
    
    try {
      // Handle app URL (deep links)
      App.addListener('appUrlOpen', (event) => {
        logger.info('Deep link received:', event.url);
        handleDeepLink(event.url);
      });

      // Handle initial URL if app was opened via deep link
      App.getLaunchUrl().then((result) => {
        if (result?.url) {
          logger.info('Launch URL:', result.url);
          handleDeepLink(result.url);
        }
      });
    } catch (error) {
      logger.warn('Failed to setup deep link handling', error);
    }
  };

  const handleDeepLink = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      logger.info(`Handling deep link: ${path}`, { searchParams: Object.fromEntries(searchParams) });

      // Handle different deep link patterns
      if (path.startsWith('/assessment/')) {
        const assessmentSlug = path.split('/')[2];
        if (assessmentSlug) {
          navigate(`/assessment/${assessmentSlug}`);
          toast({
            title: 'Assessment Loaded',
            description: 'Opening assessment from link...'
          });
        }
      } else if (path.startsWith('/course/')) {
        const courseSlug = path.split('/')[2];
        if (courseSlug) {
          navigate(`/course/${courseSlug}`);
          toast({
            title: 'Course Loaded',
            description: 'Opening course from link...'
          });
        }
      } else if (path === '/results' && searchParams.has('attempt')) {
        const attemptId = searchParams.get('attempt');
        navigate(`/results?attempt=${attemptId}`);
      } else if (path === '/admin' && searchParams.has('token')) {
        const token = searchParams.get('token');
        navigate(`/admin?token=${token}`);
      } else {
        // Default navigation
        navigate(path || '/');
      }
    } catch (error) {
      logger.error('Failed to handle deep link', 'MobileWrapper', error);
      navigate('/');
    }
  };

  const setupKeyboardHandling = () => {
    if (!Keyboard) return;
    
    try {
      // Handle keyboard show/hide for better UX
      Keyboard.addListener('keyboardWillShow', (info) => {
        logger.debug('Keyboard will show', info);
        document.body.classList.add('keyboard-open');
      });

      Keyboard.addListener('keyboardWillHide', () => {
        logger.debug('Keyboard will hide');
        document.body.classList.remove('keyboard-open');
      });
    } catch (error) {
      logger.warn('Failed to setup keyboard handling', error);
    }
  };

  const setupAppStateHandling = () => {
    if (!App) return;
    
    try {
      // Handle app state changes
      App.addListener('appStateChange', (state) => {
        logger.info('App state changed:', state.isActive);
        
        if (state.isActive) {
          // App became active - sync data
          if (OfflineSyncService) {
            OfflineSyncService.syncOfflineData();
          }
        } else {
          // App went to background - save any pending data
          // This is handled automatically by the sync service
        }
      });

      // Handle back button
      App.addListener('backButton', (result) => {
        if (result.canGoBack) {
          window.history.back();
        } else {
          // Show exit confirmation
          App.exitApp();
        }
      });
    } catch (error) {
      logger.warn('Failed to setup app state handling', error);
    }
  };

  const renderSyncStatus = () => {
    if (!Capacitor?.isNativePlatform() || syncStatus.pendingItems === 0) {
      return null;
    }

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-sm text-center py-2">
        {!syncStatus.isOnline ? (
          <span>Offline - {syncStatus.pendingItems} items pending sync</span>
        ) : (
          <span>Syncing {syncStatus.pendingItems} items...</span>
        )}
      </div>
    );
  };

  const renderOfflineIndicator = () => {
    if (!Capacitor?.isNativePlatform() || syncStatus.isOnline) {
      return null;
    }

    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-800 text-white text-sm text-center py-2 px-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>You're offline. Changes will sync when connected.</span>
        </div>
      </div>
    );
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Newomen</h2>
          <p className="text-muted-foreground">Initializing your personal growth journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app-wrapper">
      {renderSyncStatus()}
      {renderOfflineIndicator()}
      
      <div className={`min-h-screen ${syncStatus.pendingItems > 0 ? 'pt-10' : ''}`}>
        {children}
      </div>

      {/* Mobile-specific styles */}
      <style jsx>{`
        .mobile-app-wrapper {
          /* Ensure proper viewport handling */
          min-height: 100vh;
          min-height: -webkit-fill-available;
        }

        .keyboard-open {
          /* Adjust layout when keyboard is open */
          height: auto !important;
        }

        /* Mobile-specific scrolling improvements */
        .mobile-app-wrapper * {
          -webkit-overflow-scrolling: touch;
        }

        /* Prevent zoom on input focus */
        input, select, textarea {
          font-size: 16px !important;
        }

        /* Safe area handling for newer devices */
        @supports (padding-top: env(safe-area-inset-top)) {
          .mobile-app-wrapper {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
};

export default MobileWrapper;