/**
 * @test NotificationsComponent
 * @description Tests the NotificationsComponent for notification permission handling, local notifications, and push notifications
 * @prerequisites
 *   - Capacitor PushNotifications plugin is mocked
 *   - Capacitor LocalNotifications plugin is mocked
 *   - Toast hook is mocked
 *   - Button component is available
 * @steps
 *   1. Mock Capacitor notification plugins
 *   2. Test initialization and permission request
 *   3. Test push notification registration
 *   4. Test local notification scheduling
 *   5. Test notification event handling
 *   6. Test error handling scenarios
 * @expected Component handles all notification scenarios correctly with proper permission handling and user feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsComponent } from '../NotificationsComponent';
import {
  mockCapacitorPlugins,
  mockNotification,
  mockPermissionGranted,
  mockPermissionDenied,
  setPlatform,
  resetAllMocks
} from './mocks/capacitor-mocks';

// Import setup to ensure mocks are configured
import './mocks/setup-tests';

describe('NotificationsComponent', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    resetAllMocks();
    mockToast.mockClear();

    // Reset mock implementations for toast
    const useToast = require('@/hooks/use-toast').useToast;
    useToast.mockReturnValue({
      toast: mockToast,
      dismiss: jest.fn(),
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component initialization', () => {
    it('should initialize notifications on mount', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.requestPermissions).toHaveBeenCalled();
        expect(mockCapacitorPlugins.PushNotifications.register).toHaveBeenCalled();
        expect(mockCapacitorPlugins.PushNotifications.getToken).toHaveBeenCalled();
      });
    });

    it('should handle permission denied on initialization', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionDenied);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/❌ disabled/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enable/i })).toBeInTheDocument();
      });
    });

    it('should handle initialization errors gracefully', async () => {
      const initError = new Error('Failed to initialize');
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockRejectedValue(initError);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/failed to initialize notifications/i)).toBeInTheDocument();
      });
    });

    it('should set up event listeners when permission is granted', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.addListener).toHaveBeenCalledTimes(4); // registration, registrationError, pushNotificationReceived, pushNotificationActionPerformed
      });
    });
  });

  describe('Permission handling', () => {
    it('should show enabled state when permission is granted', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /enable/i })).not.toBeInTheDocument();
      });
    });

    it('should show disabled state when permission is denied', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionDenied);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/❌ disabled/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enable/i })).toBeInTheDocument();
      });
    });

    it('should allow manual permission request', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions
        .mockResolvedValueOnce(mockPermissionDenied)
        .mockResolvedValueOnce(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);

      render(<NotificationsComponent />);

      // Wait for initial initialization with denied permission
      await waitFor(() => {
        expect(screen.getByText(/❌ disabled/i)).toBeInTheDocument();
      });

      // Click enable button
      const enableButton = screen.getByRole('button', { name: /enable/i });
      await userEvent.click(enableButton);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.requestPermissions).toHaveBeenCalledTimes(2);
        expect(mockCapacitorPlugins.PushNotifications.register).toHaveBeenCalled();
      });
    });

    it('should handle manual permission request failure', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockRejectedValue(new Error('Permission denied'));

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/❌ disabled/i)).toBeInTheDocument();
      });

      const enableButton = screen.getByRole('button', { name: /enable/i });
      await userEvent.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to request permission/i)).toBeInTheDocument();
      });
    });
  });

  describe('Push notification registration', () => {
    beforeEach(() => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
    });

    it('should register for push notifications when permission is granted', async () => {
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.register).toHaveBeenCalled();
        expect(mockCapacitorPlugins.PushNotifications.getToken).toHaveBeenCalled();
      });
    });

    it('should handle registration error', async () => {
      mockCapacitorPlugins.PushNotifications.register.mockRejectedValue(new Error('Registration failed'));
      mockCapacitorPlugins.PushNotifications.addListener.mockImplementation((event, callback) => {
        if (event === 'registrationError') {
          setTimeout(() => callback({ error: 'Registration failed' }), 0);
        }
        return Promise.resolve({ remove: jest.fn() } as any);
      });

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/failed to register for push notifications/i)).toBeInTheDocument();
      });
    });

    it('should update token when registration succeeds', async () => {
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'initial-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockImplementation((event, callback) => {
        if (event === 'registration') {
          setTimeout(() => callback({ value: 'updated-token' }), 0);
        }
        return Promise.resolve({ remove: jest.fn() } as any);
      });

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText('initial-token')).toBeInTheDocument();
      });

      // Simulate token update
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(screen.getByText('updated-token')).toBeInTheDocument();
      });
    });

    it('should display push token when available', async () => {
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-push-token-123' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText('test-push-token-123')).toBeInTheDocument();
      });
    });
  });

  describe('Local notifications', () => {
    beforeEach(() => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);
    });

    it('should send local notification when permission is granted', async () => {
      mockCapacitorPlugins.LocalNotifications.schedule.mockResolvedValue({ notifications: [mockNotification] });

      render(<NotificationsComponent />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /📱 send test notification/i });
      await userEvent.click(sendButton);

      expect(mockCapacitorPlugins.LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          {
            title: 'Test Notification',
            body: 'This is a test notification from Growth Echo!',
            id: 1,
            schedule: { at: expect.any(Date) },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: null,
          },
        ],
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Notification Scheduled',
          description: 'Test notification will appear in 1 second',
        });
      });
    });

    it('should disable send button when permission is denied', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionDenied);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/❌ disabled/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /📱 send test notification/i });
      expect(sendButton).toBeDisabled();
    });

    it('should handle local notification scheduling error', async () => {
      mockCapacitorPlugins.LocalNotifications.schedule.mockRejectedValue(new Error('Scheduling failed'));

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /📱 send test notification/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send local notification/i)).toBeInTheDocument();
      });
    });

    it('should schedule notification with 1 second delay', async () => {
      mockCapacitorPlugins.LocalNotifications.schedule.mockResolvedValue({ notifications: [mockNotification] });

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /📱 send test notification/i });
      await userEvent.click(sendButton);

      const call = mockCapacitorPlugins.LocalNotifications.schedule.mock.calls[0];
      const scheduledTime = call.notifications[0].schedule.at;
      const expectedTime = new Date(Date.now() + 1000);

      // Check that the scheduled time is approximately 1 second from now
      expect(Math.abs(scheduledTime.getTime() - expectedTime.getTime())).toBeLessThan(100);
    });
  });

  describe('Event handling', () => {
    beforeEach(() => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
    });

    it('should handle push notification received event', async () => {
      const receivedNotification = {
        title: 'Test Push Notification',
        body: 'This is a test push notification',
        id: '123',
        data: { type: 'test' },
      };

      mockCapacitorPlugins.PushNotifications.addListener.mockImplementation((event, callback) => {
        if (event === 'pushNotificationReceived') {
          setTimeout(() => callback(receivedNotification), 0);
        }
        return Promise.resolve({ remove: jest.fn() } as any);
      });

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.addListener).toHaveBeenCalledWith(
          'pushNotificationReceived',
          expect.any(Function)
        );
      });

      // Simulate notification received
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Test Push Notification',
          description: 'This is a test push notification',
        });
      });
    });

    it('should handle push notification action performed event', async () => {
      const actionPerformed = {
        notification: {
          title: 'Action Notification',
          body: 'Notification with action',
          id: '456',
          data: { action: 'open_screen' },
        },
        actionId: 'tap',
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockCapacitorPlugins.PushNotifications.addListener.mockImplementation((event, callback) => {
        if (event === 'pushNotificationActionPerformed') {
          setTimeout(() => callback(actionPerformed), 0);
        }
        return Promise.resolve({ remove: jest.fn() } as any);
      });

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.addListener).toHaveBeenCalledWith(
          'pushNotificationActionPerformed',
          expect.any(Function)
        );
      });

      // Simulate action performed
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Notification action performed:',
          actionPerformed
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle event listener removal on unmount', async () => {
      const removeListeners: Array<() => void> = [];
      mockCapacitorPlugins.PushNotifications.addListener.mockImplementation(() => {
        const remove = jest.fn();
        removeListeners.push(remove);
        return Promise.resolve({ remove } as any);
      });

      const { unmount } = render(<NotificationsComponent />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.addListener).toHaveBeenCalled();
      });

      unmount();

      removeListeners.forEach(remove => {
        expect(remove).toHaveBeenCalled();
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle partial permission states', async () => {
      const partialPermission = {
        receive: 'granted',
        // Other permission types might be missing
      };

      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(partialPermission as any);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
      });
    });

    it('should handle empty token response', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: '' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText('')).toBeInTheDocument(); // Empty token should still be displayed
      });
    });

    it('should handle malformed notification data', async () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });

      const malformedNotification = {
        // Missing required fields
        id: '123',
      };

      mockCapacitorPlugins.PushNotifications.addListener.mockImplementation((event, callback) => {
        if (event === 'pushNotificationReceived') {
          setTimeout(() => callback(malformedNotification), 0);
        }
        return Promise.resolve({ remove: jest.fn() } as any);
      });

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(mockCapacitorPlugins.PushNotifications.addListener).toHaveBeenCalled();
      });

      // Should handle malformed notification gracefully
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      // Should not throw error
      expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
    });

    it('should handle concurrent notification sends', async () => {
      mockCapacitorPlugins.LocalNotifications.schedule.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ notifications: [mockNotification] }), 100))
      );

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /📱 send test notification/i });

      // Send multiple notifications rapidly
      await userEvent.click(sendButton);
      await userEvent.click(sendButton);
      await userEvent.click(sendButton);

      expect(mockCapacitorPlugins.LocalNotifications.schedule).toHaveBeenCalledTimes(3);
    });

    it('should apply custom className correctly', () => {
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      render(<NotificationsComponent className="custom-notifications-class" />);

      const container = screen.getByText(/push notifications:/i).parentElement?.parentElement;
      expect(container).toHaveClass('custom-notifications-class');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle permission changes during component lifecycle', async () => {
      // Start with denied permission
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionDenied);

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/❌ disabled/i)).toBeInTheDocument();
      });

      // Simulate permission granted
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValue(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValue(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValue({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValue({} as any);

      // Click enable button
      const enableButton = screen.getByRole('button', { name: /enable/i });
      await userEvent.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /📱 send test notification/i })).toBeEnabled();
      });
    });

    it('should recover from initialization errors and allow retry', async () => {
      // First initialization fails
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockRejectedValueOnce(new Error('Network error'));

      render(<NotificationsComponent />);

      await waitFor(() => {
        expect(screen.getByText(/failed to initialize notifications/i)).toBeInTheDocument();
      });

      // Manual retry should work
      mockCapacitorPlugins.PushNotifications.requestPermissions.mockResolvedValueOnce(mockPermissionGranted);
      mockCapacitorPlugins.PushNotifications.register.mockResolvedValueOnce(undefined);
      mockCapacitorPlugins.PushNotifications.getToken.mockResolvedValueOnce({ value: 'test-token' });
      mockCapacitorPlugins.PushNotifications.addListener.mockResolvedValueOnce({} as any);

      const enableButton = screen.getByRole('button', { name: /enable/i });
      await userEvent.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText(/✅ enabled/i)).toBeInTheDocument();
      });
    });
  });
});