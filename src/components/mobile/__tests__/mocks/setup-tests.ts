import '@testing-library/jest-dom';

// Import vitest globals for mocking
import { vi } from 'vitest';

// Import mock objects
import { mockCapacitor, mockCapacitorPlugins } from './capacitor-mocks';

// Mock Capacitor core
vi.mock('@capacitor/core', () => ({
  Capacitor: mockCapacitor,
}));

// Mock Camera plugin
vi.mock('@capacitor/camera', () => ({
  Camera: mockCapacitorPlugins.Camera,
  CameraResultType: {
    Base64: 'base64',
    Uri: 'uri',
    DataUrl: 'dataUrl',
  },
  CameraSource: {
    Prompt: 'prompt',
    Camera: 'camera',
    Photos: 'photos',
  },
}));

// Mock Geolocation plugin
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: mockCapacitorPlugins.Geolocation,
}));

// Mock Push notifications plugin
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: mockCapacitorPlugins.PushNotifications,
  LocalNotifications: mockCapacitorPlugins.LocalNotifications,
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
  })),
}));

// Mock File constructor for web fallback
global.File = class extends File {
  constructor(bits: BlobPart[], filename: string, options?: FilePropertyBag) {
    super(bits, filename, options);
  }
};

// Mock FileReader for web fallback
global.FileReader = class {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,${btoa('test-image-data')}`;
      if (this.onload) {
        this.onload.call(this, new ProgressEvent('load'));
      }
    }, 0);
  }
} as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = vi.fn();

// Setup global test utilities
global.describe = describe;
global.it = it;
global.test = test;
global.expect = expect;
global.vi = vi;

// Import mock utilities for use in tests
import { resetAllMocks, setPlatform } from './capacitor-mocks';

// Reset all mocks before each test
beforeEach(() => {
  resetAllMocks();
  vi.clearAllMocks();
});

// Mock window object for web platform testing
Object.defineProperty(window, 'webkitAudioContext', {
  value: vi.fn(),
});

Object.defineProperty(window, 'AudioContext', {
  value: vi.fn(),
});

// Mock navigator for web fallback testing
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(),
  },
});

Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// Mock Notification API for web fallback testing
Object.defineProperty(window, 'Notification', {
  value: class {
    static permission = 'granted';
    static requestPermission = vi.fn().mockResolvedValue('granted');

    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      this.body = options?.body || '';
      this.data = options?.data || null;
    }

    title: string;
    body: string;
    data: any;
    onclick: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onshow: (() => void) | null = null;

    close = vi.fn();
  },
  configurable: true,
});

// Export setup utilities
export { resetAllMocks, setPlatform };