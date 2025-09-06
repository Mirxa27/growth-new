import { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Button } from '@/components/ui/button';

interface GeolocationComponentProps {
  onLocationReceived: (position: Position) => void;
  className?: string;
}

export function GeolocationComponent({ onLocationReceived, className }: GeolocationComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);

  // Check permission on component mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        // Request permission if not granted
        await Geolocation.requestPermissions();
      }
    } catch (err) {
      console.error('Error checking geolocation permission:', err);
    }
  };

  const getCurrentPosition = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      setCurrentPosition(position);
      onLocationReceived(position);
    } catch (err: any) {
      if (err.message.includes('User denied')) {
        setError('Location access denied. Please enable location services.');
      } else if (err.message.includes('timeout')) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Unable to get location. Please check your device settings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Watch position for real-time updates
  const watchPosition = () => {
    const callbackId = Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err) {
          setError('Error watching position: ' + err.message);
          return;
        }
        if (position) {
          setCurrentPosition(position);
          onLocationReceived(position);
        }
      }
    );

    // Cleanup on unmount
    return () => Geolocation.clearWatch({ id: callbackId });
  };

  return (
    <div className={className}>
      <Button
        onClick={getCurrentPosition}
        disabled={isLoading}
        className="bg-gradient-primary hover:opacity-90"
      >
        {isLoading ? '📍 Getting Location...' : '📍 Get Current Location'}
      </Button>

      <Button
        onClick={watchPosition}
        variant="outline"
        className="ml-2"
      >
        🔄 Watch Position
      </Button>

      {currentPosition && (
        <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg">
          <h4 className="font-semibold mb-2">Current Location:</h4>
          <p className="text-sm">
            Latitude: {currentPosition.coords.latitude?.toFixed(6)}
          </p>
          <p className="text-sm">
            Longitude: {currentPosition.coords.longitude?.toFixed(6)}
          </p>
          <p className="text-sm">
            Accuracy: ±{currentPosition.coords.accuracy?.toFixed(0)} meters
          </p>
          {currentPosition.timestamp && (
            <p className="text-xs text-gray-400 mt-1">
              Updated: {new Date(currentPosition.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}