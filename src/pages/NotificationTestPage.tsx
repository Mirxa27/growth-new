import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';

export const NotificationTestPage = () => {
  const { success, error, warning, info } = useEnhancedToast();

  const testNotifications = () => {
    // Test success notification
    setTimeout(() => {
      success(
        "Community Post Shared! ✨",
        "Your inspiring message has been shared with the growth community."
      );
    }, 500);

    // Test error notification
    setTimeout(() => {
      error(
        "Unable to load posts",
        "We're having trouble connecting to the community. Please check your connection and try again."
      );
    }, 1500);

    // Test warning notification
    setTimeout(() => {
      warning(
        "Connection Unstable ⚠️",
        "Your internet connection seems unstable. Some features may not work properly."
      );
    }, 2500);

    // Test info notification
    setTimeout(() => {
      info(
        "New Features Available! 🚀",
        "Check out the new glassmorphism design and enhanced community features."
      );
    }, 3500);
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              Enhanced Glassmorphism Notifications
            </CardTitle>
            <CardDescription className="text-gray-200">
              Test the new glassmorphism toast notifications with blur effects and modern styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Individual Tests</h3>
                <div className="space-y-2">
                  <Button 
                    onClick={() => success("Success! ✅", "Operation completed successfully")}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-white border border-green-400/30"
                  >
                    Test Success Toast
                  </Button>
                  <Button 
                    onClick={() => error("Error! ❌", "Something went wrong")}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-white border border-red-400/30"
                  >
                    Test Error Toast
                  </Button>
                  <Button 
                    onClick={() => warning("Warning! ⚠️", "Please check your settings")}
                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-white border border-yellow-400/30"
                  >
                    Test Warning Toast
                  </Button>
                  <Button 
                    onClick={() => info("Info! 💡", "Here's some helpful information")}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-400/30"
                  >
                    Test Info Toast
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Sequence Demo</h3>
                <Button 
                  onClick={testNotifications}
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-white border border-purple-400/30"
                >
                  🎭 Run Notification Sequence Demo
                </Button>
                <p className="text-sm text-gray-300">
                  This will show all notification types in sequence to demonstrate the glassmorphism effects
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
              <ul className="space-y-2 text-gray-200">
                <li>• 🌟 Glassmorphism blur effects with backdrop-filter</li>
                <li>• 🎨 Color-coded variants (Success, Error, Warning, Info)</li>
                <li>• ⚡ Smooth animations and transitions</li>
                <li>• 📱 Responsive design for all screen sizes</li>
                <li>• 🔄 Fallback database queries for community posts</li>
                <li>• 🛡️ Enhanced error handling and user feedback</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationTestPage;
