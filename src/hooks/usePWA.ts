/**
 * Progressive Web App Hook
 * Manages service worker registration, update notifications, and PWA features
 */

import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface PWAActions {
  install: () => Promise<void>;
  update: () => Promise<void>;
  showInstallPrompt: () => void;
  dismissUpdate: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = (): PWAState & PWAActions => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    hasUpdate: false,
    isRegistered: false,
    registration: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('[PWA] Service Worker registered successfully:', registration);
        
        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration
        }));

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                setState(prev => ({ ...prev, hasUpdate: true }));
                setShowUpdateNotification(true);
              }
            });
          }
        });

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }, []);

  /**
   * Handle install prompt
   */
  const handleInstallPrompt = useCallback((e: Event) => {
    const event = e as BeforeInstallPromptEvent;
    // Prevent the mini-infobar from appearing
    event.preventDefault();
    
    // Save the event for later use
    setDeferredPrompt(event);
    setState(prev => ({ ...prev, isInstallable: true }));
  }, []);

  /**
   * Handle app installed
   */
  const handleAppInstalled = useCallback(() => {
    console.log('[PWA] App was installed');
    setDeferredPrompt(null);
    setState(prev => ({
      ...prev,
      isInstallable: false,
      isInstalled: true
    }));
  }, []);

  /**
   * Handle online/offline status
   */
  const handleOnline = useCallback(() => {
    setState(prev => ({ ...prev, isOffline: false }));
  }, []);

  const handleOffline = useCallback(() => {
    setState(prev => ({ ...prev, isOffline: true }));
  }, []);

  /**
   * Install the app
   */
  const install = useCallback(async () => {
    if (!deferredPrompt) {
      throw new Error('No install prompt available');
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));
      }
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      throw error;
    }
  }, [deferredPrompt]);

  /**
   * Update the app
   */
  const update = useCallback(async () => {
    if (!state.registration) {
      throw new Error('No service worker registration available');
    }

    try {
      const newWorker = state.registration.waiting;
      if (newWorker) {
        // Tell the service worker to skip waiting
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Listen for the controlling service worker to change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload the page to get the new version
          window.location.reload();
        });
      }
    } catch (error) {
      console.error('[PWA] Update failed:', error);
      throw error;
    }
  }, [state.registration]);

  /**
   * Show install prompt manually
   */
  const showInstallPrompt = useCallback(() => {
    if (deferredPrompt) {
      install().catch(console.error);
    }
  }, [deferredPrompt, install]);

  /**
   * Dismiss update notification
   */
  const dismissUpdate = useCallback(() => {
    setShowUpdateNotification(false);
    setState(prev => ({ ...prev, hasUpdate: false }));
  }, []);

  /**
   * Check if running as PWA
   */
  const checkIfPWA = useCallback(() => {
    // Check if running in PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInWebAppChrome = document.referrer.includes('android-app://');
    
    const isPWA = isStandalone || isInWebAppiOS || isInWebAppChrome;
    
    setState(prev => ({ ...prev, isInstalled: isPWA }));
  }, []);

  // Initialize PWA
  useEffect(() => {
    registerServiceWorker();
    checkIfPWA();

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registerServiceWorker, checkIfPWA, handleInstallPrompt, handleAppInstalled, handleOnline, handleOffline]);

  return {
    ...state,
    install,
    update,
    showInstallPrompt,
    dismissUpdate,
  };
};

/**
 * Hook for PWA install prompt
 */
export const useInstallPrompt = () => {
  const { isInstallable, isInstalled, install, showInstallPrompt } = usePWA();
  
  return {
    canInstall: isInstallable && !isInstalled,
    isInstalled,
    install,
    showInstallPrompt,
  };
};

/**
 * Hook for offline status
 */
export const useOfflineStatus = () => {
  const { isOffline } = usePWA();
  
  const [wasOffline, setWasOffline] = useState(false);
  
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    }
  }, [isOffline]);
  
  return {
    isOffline,
    isOnline: !isOffline,
    hasBeenOffline: wasOffline,
  };
};

/**
 * Hook for app updates
 */
export const useAppUpdate = () => {
  const { hasUpdate, update, dismissUpdate } = usePWA();
  
  return {
    hasUpdate,
    updateApp: update,
    dismissUpdate,
  };
};