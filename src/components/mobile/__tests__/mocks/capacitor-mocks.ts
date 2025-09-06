// Import vitest globals for mocking
import { vi } from 'vitest';

// Mock Capacitor plugins for testing
export const mockCapacitorPlugins = {
  // Camera plugin mock
  Camera: {
    getPhoto: vi.fn(),
  },

  // Geolocation plugin mock
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },

  // Push notifications plugin mock
  PushNotifications: {
    requestPermissions: vi.fn(),
    register: vi.fn(),
    getToken: vi.fn(),
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },

  // Local notifications plugin mock
  LocalNotifications: {
    schedule: vi.fn(),
    cancel: vi.fn(),
    getPending: vi.fn(),
    registerActionTypes: vi.fn(),
  },
};

// Mock Capacitor core
export const mockCapacitor = {
  getPlatform: vi.fn(() => 'web'),
  isNative: vi.fn(() => false),
};

// Utility to reset all mocks
export const resetAllMocks = () => {
  Object.values(mockCapacitorPlugins).forEach(plugin => {
    Object.values(plugin).forEach((method: any) => {
      if (typeof method === 'function' && method.mockClear) {
        method.mockClear();
      }
    });
  });

  mockCapacitor.getPlatform.mockClear();
  mockCapacitor.isNative.mockClear();
};

// Utility to simulate different platforms
export const setPlatform = (platform: 'web' | 'ios' | 'android') => {
  mockCapacitor.getPlatform.mockReturnValue(platform);
  mockCapacitor.isNative.mockReturnValue(platform !== 'web');
};

// Mock Position data for geolocation
export const mockPosition = {
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

// Mock Photo data for camera
export const mockPhoto = {
  base64String: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  format: 'png',
  exif: null,
  webPath: 'blob:example',
};

// Mock Notification data
export const mockNotification = {
  title: 'Test Notification',
  body: 'This is a test notification',
  id: 1,
  data: { test: true },
};

// Mock Permission data
export const mockPermissionGranted = {
  location: 'granted',
  camera: 'granted',
  notifications: 'granted',
};

export const mockPermissionDenied = {
  location: 'denied',
  camera: 'denied',
  notifications: 'denied',
};

export const mockPermissionPrompt = {
  location: 'prompt',
  camera: 'prompt',
  notifications: 'prompt',
};