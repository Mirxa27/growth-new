import { useState, useEffect } from 'react';
import {
  PushNotifications,
  ActionPerformed,
  Token
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface NotificationsComponentProps {
  className?: string;
}

export function NotificationsComponent({ className }: NotificationsComponentProps) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize push notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permission
      const result = await PushNotifications.requestPermissions();
      setPermissionGranted(result.receive === 'granted');

      if (result.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();

        // Get token
        const pushNotificationToken = await PushNotifications.getToken();
        setToken(pushNotificationToken.value);

        // Handle notification received
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          toast({
            title: notification.title,
            description: notification.body,
          });
        });

        // Handle notification action performed
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('Notification action performed:', notification);
          // Handle notification action (e.g., navigate to specific screen)
        });

        // Handle registration
        await PushNotifications.addListener('registration', (token: Token) => {
          setToken(token.value);
          console.log('Push notification token:', token.value);
        });

        // Handle registration error
        await PushNotifications.addListener('registrationError', (error) => {
          setError('Failed to register for push notifications: ' + error.error);
        });
      }
    } catch (err) {
      setError('Failed to initialize notifications: ' + (err as Error).message);
    }
  };

  const sendLocalNotification = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Test Notification',
            body: 'This is a test notification from Growth Echo!',
            id: 1,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: null,
          },
        ],
      });

      toast({
        title: 'Notification Scheduled',
        description: 'Test notification will appear in 1 second',
      });
    } catch (err) {
      setError('Failed to send local notification: ' + (err as Error).message);
    }
  };

  const requestPermission = async () => {
    try {
      const result = await PushNotifications.requestPermissions();
      setPermissionGranted(result.receive === 'granted');

      if (result.receive === 'granted') {
        await PushNotifications.register();
      }
    } catch (err) {
      setError('Failed to request permission: ' + (err as Error).message);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Push Notifications: {permissionGranted ? '✅ Enabled' : '❌ Disabled'}
          </span>
          {!permissionGranted && (
            <Button onClick={requestPermission} size="sm">
              Enable
            </Button>
          )}
        </div>

        <Button
          onClick={sendLocalNotification}
          disabled={!permissionGranted}
          className="w-full"
        >
          📱 Send Test Notification
        </Button>

        {token && (
          <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Push Token:</p>
            <p className="text-xs font-mono break-all">{token}</p>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}