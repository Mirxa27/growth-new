/**
 * PWA Install Prompt Component
 * Provides a user-friendly interface for installing the Progressive Web App
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  X, 
  Wifi, 
  Zap, 
  Shield,
  Star
} from 'lucide-react';
import { useInstallPrompt, useOfflineStatus } from '@/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallPromptProps {
  className?: string;
  onDismiss?: () => void;
  autoShow?: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = '',
  onDismiss,
  autoShow = true,
}) => {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const { isOffline } = useOfflineStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await install();
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if already installed, dismissed, or can't install
  if (isInstalled || isDismissed || (!canInstall && autoShow)) {
    return null;
  }

  const benefits = [
    {
      icon: <Zap className="w-4 h-4" />,
      title: 'Lightning Fast',
      description: 'Instant loading and smooth performance'
    },
    {
      icon: <Wifi className="w-4 h-4" />,
      title: 'Works Offline',
      description: 'Access your content even without internet'
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: 'Secure & Private',
      description: 'Your data stays safe and private'
    },
    {
      icon: <Smartphone className="w-4 h-4" />,
      title: 'Native-like Experience',
      description: 'Feels like a real mobile app'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 ${className}`}
      >
        <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Install Growth App</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      PWA
                    </Badge>
                    {isOffline && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        Works Offline
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4">
              Get the full app experience with faster loading, offline access, and native-like performance.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50"
                >
                  <div className="text-blue-600 mt-0.5">
                    {benefit.icon}
                  </div>
                  <div>
                    <div className="font-medium text-xs text-gray-900">
                      {benefit.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {benefit.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1"
                size="sm"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
              >
                Maybe Later
              </Button>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-500 text-center mt-3">
              Free • No download required • Works on all devices
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Compact install button for navigation bars
 */
export const PWAInstallButton: React.FC<{
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}> = ({ 
  variant = 'outline', 
  size = 'sm', 
  showText = true 
}) => {
  const { canInstall, install } = useInstallPrompt();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!canInstall) return null;

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await install();
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      disabled={isInstalling}
      className="min-w-0"
    >
      {isInstalling ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {showText && (
        <span className="ml-2 hidden sm:inline">
          {isInstalling ? 'Installing...' : 'Install'}
        </span>
      )}
    </Button>
  );
};

/**
 * App update notification
 */
export const AppUpdateNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // This would be connected to the PWA update hook in a real implementation
  // For now, showing how it would look
  
  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      // await updateApp();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
    >
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-blue-900 text-sm">
                  Update Available
                </div>
                <div className="text-blue-700 text-xs">
                  A new version is ready to install
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 mt-3">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Now'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PWAInstallPrompt;