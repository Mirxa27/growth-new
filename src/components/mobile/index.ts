import { useState, useEffect } from 'react';

// Mobile components exports
export { CameraComponent } from './CameraComponent';
export { GeolocationComponent } from './GeolocationComponent';
export { NotificationsComponent } from './NotificationsComponent';

// Mobile utility types
export interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

// Mobile hook for device detection
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor (native mobile app)
    const checkMobile = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        setIsMobile(Capacitor.isNativePlatform());
      } catch {
        setIsMobile(false);
      }
    };

    checkMobile();
  }, []);

  return isMobile;
};