/**
 * @test GeolocationComponent (Simplified)
 * @description Simplified test for GeolocationComponent focusing on basic functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { GeolocationComponent } from '../GeolocationComponent';

// Mock Capacitor Geolocation plugin
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

const mockPosition = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
};

const mockPermissionGranted = {
  location: 'granted',
};

describe('GeolocationComponent (Simplified)', () => {
  const mockOnLocationReceived = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with location buttons', () => {
    render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

    expect(screen.getByRole('button', { name: /📍 get current location/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🔄 watch position/i })).toBeInTheDocument();
  });

  it('should call onLocationReceived when position is retrieved', async () => {
    const { Geolocation } = await import('@capacitor/geolocation');
    (Geolocation.checkPermissions as any).mockResolvedValue(mockPermissionGranted);
    (Geolocation.getCurrentPosition as any).mockResolvedValue(mockPosition);

    render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

    const button = screen.getByRole('button', { name: /📍 get current location/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockOnLocationReceived).toHaveBeenCalledWith(mockPosition);
    });
  });

  it('should show loading state while getting location', async () => {
    const { Geolocation } = await import('@capacitor/geolocation');
    (Geolocation.checkPermissions as any).mockResolvedValue(mockPermissionGranted);
    (Geolocation.getCurrentPosition as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPosition), 100))
    );

    render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

    const button = screen.getByRole('button', { name: /📍 get current location/i });
    await userEvent.click(button);

    expect(screen.getByText(/📍 getting location\.\.\./i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('should handle geolocation error gracefully', async () => {
    const { Geolocation } = await import('@capacitor/geolocation');
    (Geolocation.checkPermissions as any).mockResolvedValue(mockPermissionGranted);
    (Geolocation.getCurrentPosition as any).mockRejectedValue(new Error('Location not available'));

    render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

    const button = screen.getByRole('button', { name: /📍 get current location/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/unable to get location/i)).toBeInTheDocument();
    });
  });

  it('should check permissions on mount', async () => {
    const { Geolocation } = await import('@capacitor/geolocation');
    (Geolocation.checkPermissions as any).mockResolvedValue(mockPermissionGranted);

    render(<GeolocationComponent onLocationReceived={mockOnLocationReceived} />);

    await waitFor(() => {
      expect(Geolocation.checkPermissions).toHaveBeenCalled();
    });
  });
});