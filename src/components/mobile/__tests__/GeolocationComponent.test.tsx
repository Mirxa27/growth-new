/**
 * @test GeolocationComponent
 * @description Tests the GeolocationComponent for position retrieval, permission handling, and error scenarios
 * @prerequisites
 *   - Capacitor Geolocation plugin is mocked
 *   - Permission system is mocked
 *   - Button component is available
 * @steps
 *   1. Mock Capacitor Geolocation plugin
 *   2. Test permission checking on mount
 *   3. Test successful position retrieval
 *   4. Test permission denied scenarios
 *   5. Test timeout and error handling
 *   6. Test position watching functionality
 * @expected Component handles all geolocation scenarios correctly with proper permission handling and user feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeolocationComponent } from '../GeolocationComponent';
import {
  mockCapacitorPlugins,
  mockPosition,
  mockPermissionGranted,
  mockPermissionDenied,
  mockPermissionPrompt,
  setPlatform,
  resetAllMocks
} from './mocks/capacitor-mocks';

// Import setup to ensure mocks are configured
import './mocks/setup-tests';

describe('GeolocationComponent', () => {
  const mockOnLocationReceived = jest.fn();

  beforeEach(() => {
    resetAllMocks();
    mockOnLocationReceived.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component initialization', () => {
    it('should check permissions on component mount', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.Geolocation.checkPermissions).toHaveBeenCalled();
      });
    });

    it('should request permission when not granted on mount', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionPrompt);
      mockCapacitorPlugins.Geolocation.requestPermissions.mockResolvedValue(mockPermissionGranted);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.Geolocation.checkPermissions).toHaveBeenCalled();
        expect(mockCapacitorPlugins.Geolocation.requestPermissions).toHaveBeenCalled();
      });
    });

    it('should handle permission check error gracefully', async () => {
      const permissionError = new Error('Permission check failed');
      mockCapacitorPlugins.Geolocation.checkPermissions.mockRejectedValue(permissionError);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.Geolocation.checkPermissions).toHaveBeenCalled();
        // Component should still render without crashing
        expect(screen.getByRole('button', { name: /📍 get current location/i })).toBeInTheDocument();
      });
    });
  });

  describe('Position retrieval', () => {
    beforeEach(() => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);
    });

    it('should successfully get current position', async () => {
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockResolvedValue(mockPosition);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      expect(mockCapacitorPlugins.Geolocation.getCurrentPosition).toHaveBeenCalledWith({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      await waitFor(() => {
        expect(mockOnLocationReceived).toHaveBeenCalledWith(mockPosition);
      });

      // Should display position information
      expect(screen.getByText(/latitude:/i)).toBeInTheDocument();
      expect(screen.getByText(/longitude:/i)).toBeInTheDocument();
      expect(screen.getByText(/accuracy:/i)).toBeInTheDocument();
    });

    it('should show loading state while getting position', async () => {
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPosition), 100))
      );

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      expect(screen.getByText(/📍 getting location\.\.\./i)).toBeInTheDocument();
      expect(button).toBeDisabled();

      // Fast-forward timers
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByText(/📍 getting location\.\.\./i)).not.toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });

    it('should handle location permission denied', async () => {
      const permissionDeniedError = new Error('User denied access to location services');
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockRejectedValue(permissionDeniedError);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
      });
    });

    it('should handle timeout error', async () => {
      const timeoutError = new Error('Location request timed out');
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockRejectedValue(timeoutError);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/location request timed out/i)).toBeInTheDocument();
      });
    });

    it('should handle generic location error', async () => {
      const genericError = new Error('Location unavailable');
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockRejectedValue(genericError);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/unable to get location/i)).toBeInTheDocument();
      });
    });

    it('should update position display with new data', async () => {
      const firstPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 37.7749,
          longitude: -122.4194,
        },
      };

      const secondPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 40.7128,
          longitude: -74.0060,
        },
      };

      mockCapacitorPlugins.Geolocation.getCurrentPosition
        .mockResolvedValueOnce(firstPosition)
        .mockResolvedValueOnce(secondPosition);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });

      // First position
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('37.774900')).toBeInTheDocument();
        expect(screen.getByText('-122.419400')).toBeInTheDocument();
      });

      // Second position
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('40.712800')).toBeInTheDocument();
        expect(screen.getByText('-74.006000')).toBeInTheDocument();
      });
    });
  });

  describe('Position watching', () => {
    beforeEach(() => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);
    });

    it('should start watching position successfully', async () => {
      const watchCallback = jest.fn();
      mockCapacitorPlugins.Geolocation.watchPosition.mockReturnValue('watch-id-1');

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const watchButton = screen.getByRole('button', { name: /🔄 watch position/i });
      await userEvent.click(watchButton);

      expect(mockCapacitorPlugins.Geolocation.watchPosition).toHaveBeenCalledWith(
        { enableHighAccuracy: true },
        expect.any(Function)
      );

      // Simulate position update
      const callback = mockCapacitorPlugins.Geolocation.watchPosition.mock.calls[0][1];
      await act(async () => {
        callback(mockPosition);
      });

      await waitFor(() => {
        expect(mockOnLocationReceived).toHaveBeenCalledWith(mockPosition);
      });
    });

    it('should handle watch position errors', async () => {
      mockCapacitorPlugins.Geolocation.watchPosition.mockReturnValue('watch-id-2');

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const watchButton = screen.getByRole('button', { name: /🔄 watch position/i });
      await userEvent.click(watchButton);

      // Simulate watch error
      const callback = mockCapacitorPlugins.Geolocation.watchPosition.mock.calls[0][1];
      const watchError = { message: 'Watch failed' };
      await act(async () => {
        callback(null, watchError);
      });

      await waitFor(() => {
        expect(screen.getByText(/error watching position/i)).toBeInTheDocument();
      });
    });

    it('should clear watch on component unmount', async () => {
      mockCapacitorPlugins.Geolocation.watchPosition.mockReturnValue('watch-id-3');
      mockCapacitorPlugins.Geolocation.clearWatch.mockResolvedValue(undefined);

      const { unmount } = render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const watchButton = screen.getByRole('button', { name: /🔄 watch position/i });
      await userEvent.click(watchButton);

      unmount();

      expect(mockCapacitorPlugins.Geolocation.clearWatch).toHaveBeenCalledWith({ id: 'watch-id-3' });
    });

    it('should handle clear watch error', async () => {
      mockCapacitorPlugins.Geolocation.watchPosition.mockReturnValue('watch-id-4');
      mockCapacitorPlugins.Geolocation.clearWatch.mockRejectedValue(new Error('Clear failed'));

      const { unmount } = render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const watchButton = screen.getByRole('button', { name: /🔄 watch position/i });
      await userEvent.click(watchButton);

      // Should not throw error during unmount
      await expect(() => unmount()).not.toThrow();
    });
  });

  describe('Permission scenarios', () => {
    it('should handle permission denied from start', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionDenied);
      mockCapacitorPlugins.Geolocation.requestPermissions.mockResolvedValue(mockPermissionDenied);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
      });
    });

    it('should handle permission prompt then denied', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionPrompt);
      mockCapacitorPlugins.Geolocation.requestPermissions.mockResolvedValue(mockPermissionDenied);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
      });
    });

    it('should request permission when getting position without permission', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionPrompt);
      mockCapacitorPlugins.Geolocation.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockResolvedValue(mockPosition);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockCapacitorPlugins.Geolocation.requestPermissions).toHaveBeenCalled();
        expect(mockCapacitorPlugins.Geolocation.getCurrentPosition).toHaveBeenCalled();
        expect(mockOnLocationReceived).toHaveBeenCalledWith(mockPosition);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle invalid position data', async () => {
      const invalidPosition = {
        coords: {
          latitude: null,
          longitude: null,
          accuracy: null,
        },
        timestamp: Date.now(),
      };

      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockResolvedValue(invalidPosition as any);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockOnLocationReceived).toHaveBeenCalledWith(invalidPosition);
        // Component should handle null values gracefully
        expect(screen.getByText(/latitude:/i)).toBeInTheDocument();
      });
    });

    it('should handle missing position data', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockResolvedValue({} as any);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockOnLocationReceived).toHaveBeenCalledWith({});
      });
    });

    it('should handle rapid button clicks', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPosition), 200))
      );

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });

      // Click multiple times rapidly
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      // Should only trigger geolocation plugin once due to loading state
      expect(mockCapacitorPlugins.Geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('should apply custom className correctly', () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);

      render(
        <GeolocationComponent
          onLocationReceived={mockOnLocationReceived}
          className="custom-geolocation-class"
        />
      );

      const container = screen.getByRole('button', { name: /📍 get current location/i }).parentElement;
      expect(container).toHaveClass('custom-geolocation-class');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple position updates', async () => {
      const positions = [
        { ...mockPosition, coords: { ...mockPosition.coords, latitude: 37.7749 } },
        { ...mockPosition, coords: { ...mockPosition.coords, latitude: 40.7128 } },
        { ...mockPosition, coords: { ...mockPosition.coords, latitude: 51.5074 } },
      ];

      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.Geolocation.getCurrentPosition.mockImplementation(
        () => Promise.resolve(positions.shift()!)
      );

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });

      // Get multiple positions
      for (let i = 0; i < 3; i++) {
        await userEvent.click(button);
        await waitFor(() => {
          expect(mockOnLocationReceived).toHaveBeenCalledTimes(i + 1);
        });
      }

      expect(mockOnLocationReceived).toHaveBeenCalledTimes(3);
    });

    it('should recover from errors and allow retries', async () => {
      mockCapacitorPlugins.Geolocation.checkPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.Geolocation.getCurrentPosition
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPosition);

      render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

      const button = screen.getByRole('button', { name: /📍 get current location/i });

      // First attempt - should fail
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText(/unable to get location/i)).toBeInTheDocument();
      });

      // Second attempt - should succeed
      await userEvent.click(button);
      await waitFor(() => {
        expect(mockOnLocationReceived).toHaveBeenCalledWith(mockPosition);
      });
    });
  });
});