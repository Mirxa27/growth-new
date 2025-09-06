/**
 * Mobile Optimization Service
 * Enhanced mobile experience with touch interactions, gestures, and performance
 */

import React from 'react';
import { logger } from '@/services/logging/logger.service';

export interface TouchOptions {
  enableHapticFeedback: boolean;
  enableSwipeGestures: boolean;
  enablePullToRefresh: boolean;
  touchFeedbackDuration: number;
  swipeThreshold: number;
}

export interface MobilePerformanceMetrics {
  touchLatency: number;
  scrollPerformance: number;
  batteryLevel?: number;
  networkType?: string;
  isLowEndDevice: boolean;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  element: HTMLElement;
}

class MobileOptimizerService {
  private static instance: MobileOptimizerService;
  private touchOptions: TouchOptions;
  private performanceMetrics: MobilePerformanceMetrics;
  private swipeHandlers = new Map<HTMLElement, (gesture: SwipeGesture) => void>();

  private constructor() {
    this.touchOptions = {
      enableHapticFeedback: true,
      enableSwipeGestures: true,
      enablePullToRefresh: false,
      touchFeedbackDuration: 100,
      swipeThreshold: 50
    };

    this.performanceMetrics = {
      touchLatency: 0,
      scrollPerformance: 0,
      isLowEndDevice: this.detectLowEndDevice()
    };

    this.initialize();
  }

  static getInstance(): MobileOptimizerService {
    if (!MobileOptimizerService.instance) {
      MobileOptimizerService.instance = new MobileOptimizerService();
    }
    return MobileOptimizerService.instance;
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    this.setupTouchOptimizations();
    this.setupViewportOptimizations();
    this.setupScrollOptimizations();
    this.monitorBattery();
    this.detectNetworkConditions();
    
    logger.info('Mobile optimizer initialized', {
      component: 'MobileOptimizerService',
      action: 'initialize',
      metadata: {
        touchOptions: this.touchOptions,
        isLowEndDevice: this.performanceMetrics.isLowEndDevice
      }
    });
  }

  /**
   * Setup touch optimizations
   */
  private setupTouchOptimizations(): void {
    // Optimize touch responsiveness
    const style = document.createElement('style');
    style.id = 'mobile-touch-optimizations';
    style.textContent = `
      /* Touch optimizations */
      * {
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-touch-callout: none;
      }

      .touch-optimized {
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
      }

      .touch-target {
        min-height: 44px;
        min-width: 44px;
        position: relative;
      }

      .touch-feedback {
        position: relative;
        overflow: hidden;
      }

      .touch-feedback::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      }

      .touch-feedback.active::before {
        width: 200px;
        height: 200px;
      }

      /* Scroll optimizations */
      .scroll-optimized {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        scroll-behavior: smooth;
      }

      /* Prevent zoom on input focus */
      input, textarea, select {
        font-size: 16px !important;
      }

      /* Mobile-specific animations */
      @media (hover: none) {
        .hover\\:scale-105 {
          transform: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Add touch feedback to interactive elements
    this.addTouchFeedback();

    // Setup global touch event listeners
    this.setupTouchEventListeners();
  }

  private addTouchFeedback(): void {
    const interactiveElements = document.querySelectorAll('button, [role="button"], .btn');
    
    interactiveElements.forEach(element => {
      element.classList.add('touch-optimized', 'touch-target');
      
      if (this.touchOptions.enableHapticFeedback) {
        this.addHapticFeedback(element as HTMLElement);
      }
    });
  }

  private addHapticFeedback(element: HTMLElement): void {
    element.addEventListener('touchstart', () => {
      if ('vibrate' in navigator) {
        navigator.vibrate(this.touchOptions.touchFeedbackDuration);
      }
      
      // Visual feedback
      element.classList.add('touch-feedback', 'active');
      setTimeout(() => {
        element.classList.remove('active');
      }, this.touchOptions.touchFeedbackDuration);
    });
  }

  private setupTouchEventListeners(): void {
    if (!this.touchOptions.enableSwipeGestures) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = touchEndTime - touchStartTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / deltaTime;

        if (distance > this.touchOptions.swipeThreshold && deltaTime < 500) {
          const gesture: SwipeGesture = {
            direction: Math.abs(deltaX) > Math.abs(deltaY) 
              ? (deltaX > 0 ? 'right' : 'left')
              : (deltaY > 0 ? 'down' : 'up'),
            distance,
            velocity,
            element: e.target as HTMLElement
          };

          this.handleSwipeGesture(gesture);
        }
      }
    }, { passive: true });
  }

  private handleSwipeGesture(gesture: SwipeGesture): void {
    let element: HTMLElement | null = gesture.element;
    
    // Find the nearest swipe handler
    while (element && !this.swipeHandlers.has(element)) {
      element = element.parentElement;
    }

    if (element && this.swipeHandlers.has(element)) {
      const handler = this.swipeHandlers.get(element);
      handler?.(gesture);
    }
  }

  /**
   * Setup viewport and scroll optimizations
   */
  private setupViewportOptimizations(): void {
    // Set optimal viewport
    const viewport = document.querySelector('meta[name=viewport]') || document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
    if (!document.querySelector('meta[name=viewport]')) {
      document.head.appendChild(viewport);
    }

    // Add safe area insets for devices with notches
    const safeAreaStyle = document.createElement('style');
    safeAreaStyle.id = 'safe-area-styles';
    safeAreaStyle.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }

      .safe-top { padding-top: var(--safe-area-inset-top); }
      .safe-bottom { padding-bottom: var(--safe-area-inset-bottom); }
      .safe-left { padding-left: var(--safe-area-inset-left); }
      .safe-right { padding-right: var(--safe-area-inset-right); }

      /* Dynamic viewport height for mobile browsers */
      .min-h-screen-safe {
        min-height: 100vh;
        min-height: 100dvh;
      }

      .h-screen-safe {
        height: 100vh;
        height: 100dvh;
      }
    `;
    document.head.appendChild(safeAreaStyle);
  }

  private setupScrollOptimizations(): void {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Monitor scroll performance
    let scrolling = false;
    let scrollStartTime = 0;

    window.addEventListener('scroll', () => {
      if (!scrolling) {
        scrolling = true;
        scrollStartTime = performance.now();
      }
    }, { passive: true });

    window.addEventListener('scrollend', () => {
      if (scrolling) {
        const scrollDuration = performance.now() - scrollStartTime;
        this.performanceMetrics.scrollPerformance = scrollDuration;
        
        if (scrollDuration > 16) { // 60fps = 16ms per frame
          logger.debug('Slow scroll performance detected', {
            component: 'MobileOptimizerService',
            action: 'monitorScroll',
            metadata: { duration: scrollDuration }
          });
        }
        
        scrolling = false;
      }
    }, { passive: true });
  }

  /**
   * Device and network detection
   */
  private detectLowEndDevice(): boolean {
    // Detect based on available APIs and hardware
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    
    // Consider low-end if memory < 4GB or cores < 4
    return (memory && memory < 4) || (cores && cores < 4) || false;
  }

  private async monitorBattery(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        this.performanceMetrics.batteryLevel = battery.level * 100;
        
        // Enable power-saving mode when battery is low
        if (battery.level < 0.2) {
          this.enablePowerSavingMode();
        }

        battery.addEventListener('levelchange', () => {
          this.performanceMetrics.batteryLevel = battery.level * 100;
          
          if (battery.level < 0.2) {
            this.enablePowerSavingMode();
          } else if (battery.level > 0.5) {
            this.disablePowerSavingMode();
          }
        });
      }
    } catch (error) {
      // Battery API not available or blocked
      logger.debug('Battery API not available', {
        component: 'MobileOptimizerService',
        action: 'monitorBattery'
      });
    }
  }

  private detectNetworkConditions(): void {
    try {
      const connection = (navigator as any).connection;
      if (connection) {
        this.performanceMetrics.networkType = connection.effectiveType;
        
        // Optimize for slow connections
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.enableDataSavingMode();
        }

        connection.addEventListener('change', () => {
          this.performanceMetrics.networkType = connection.effectiveType;
          
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            this.enableDataSavingMode();
          } else {
            this.disableDataSavingMode();
          }
        });
      }
    } catch (error) {
      // Network Information API not available
      logger.debug('Network Information API not available', {
        component: 'MobileOptimizerService',
        action: 'detectNetworkConditions'
      });
    }
  }

  /**
   * Performance modes
   */
  private enablePowerSavingMode(): void {
    document.body.classList.add('power-saving-mode');
    
    // Reduce animations and unnecessary features
    const style = document.createElement('style');
    style.id = 'power-saving-styles';
    style.textContent = `
      .power-saving-mode * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      .power-saving-mode .animate-pulse {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);

    logger.info('Power saving mode enabled', {
      component: 'MobileOptimizerService',
      action: 'enablePowerSavingMode',
      metadata: { batteryLevel: this.performanceMetrics.batteryLevel }
    });
  }

  private disablePowerSavingMode(): void {
    document.body.classList.remove('power-saving-mode');
    
    const powerSavingStyles = document.getElementById('power-saving-styles');
    if (powerSavingStyles) {
      powerSavingStyles.remove();
    }
  }

  private enableDataSavingMode(): void {
    document.body.classList.add('data-saving-mode');
    
    // Disable auto-playing media and reduce image quality
    const style = document.createElement('style');
    style.id = 'data-saving-styles';
    style.textContent = `
      .data-saving-mode video {
        preload: none !important;
      }
      
      .data-saving-mode img {
        loading: lazy !important;
      }
      
      .data-saving-mode .auto-play {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    logger.info('Data saving mode enabled', {
      component: 'MobileOptimizerService',
      action: 'enableDataSavingMode',
      metadata: { networkType: this.performanceMetrics.networkType }
    });
  }

  private disableDataSavingMode(): void {
    document.body.classList.remove('data-saving-mode');
    
    const dataSavingStyles = document.getElementById('data-saving-styles');
    if (dataSavingStyles) {
      dataSavingStyles.remove();
    }
  }

  /**
   * Public API methods
   */
  registerSwipeHandler(element: HTMLElement, handler: (gesture: SwipeGesture) => void): () => void {
    this.swipeHandlers.set(element, handler);
    
    return () => {
      this.swipeHandlers.delete(element);
    };
  }

  enableHapticFeedback(element: HTMLElement, intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
    element.addEventListener('touchstart', () => {
      this.triggerHapticFeedback(intensity);
    }, { passive: true });
  }

  triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.touchOptions.enableHapticFeedback) return;

    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30, 10, 20]
        };
        navigator.vibrate(patterns[intensity]);
      }
    } catch (error) {
      // Haptic feedback not supported
    }
  }

  optimizeForTouch(container: HTMLElement): void {
    // Add touch optimizations to container
    container.classList.add('touch-optimized');
    
    // Ensure all interactive elements meet touch target requirements
    const interactiveElements = container.querySelectorAll('button, a, [role="button"], input, textarea, select');
    
    interactiveElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      
      // Ensure minimum touch target size
      const rect = htmlElement.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        htmlElement.style.minWidth = '44px';
        htmlElement.style.minHeight = '44px';
        htmlElement.style.padding = htmlElement.style.padding || '8px 12px';
      }
      
      // Add touch feedback
      if (this.touchOptions.enableHapticFeedback && htmlElement.tagName === 'BUTTON') {
        this.enableHapticFeedback(htmlElement);
      }
    });
  }

  setupPullToRefresh(container: HTMLElement, onRefresh: () => Promise<void>): void {
    if (!this.touchOptions.enablePullToRefresh) return;

    let pullStartY = 0;
    let isPulling = false;
    
    container.addEventListener('touchstart', (e) => {
      if (container.scrollTop === 0) {
        pullStartY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (isPulling && container.scrollTop === 0) {
        const pullDistance = e.touches[0].clientY - pullStartY;
        
        if (pullDistance > 50) {
          container.style.transform = `translateY(${Math.min(pullDistance * 0.5, 50)}px)`;
          container.classList.add('pulling');
        }
      }
    }, { passive: true });

    container.addEventListener('touchend', async () => {
      if (isPulling) {
        const pullDistance = container.style.transform 
          ? parseInt(container.style.transform.match(/\d+/)?.[0] || '0')
          : 0;
        
        container.style.transform = '';
        container.classList.remove('pulling');
        
        if (pullDistance >= 50) {
          try {
            await onRefresh();
            this.triggerHapticFeedback('light');
          } catch (error) {
            logger.error('Pull to refresh failed', {
              component: 'MobileOptimizerService',
              action: 'pullToRefresh',
              error
            });
          }
        }
        
        isPulling = false;
      }
    }, { passive: true });
  }

  /**
   * Performance monitoring
   */
  measureTouchLatency(callback: () => void): number {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    this.performanceMetrics.touchLatency = latency;
    
    if (latency > 16) { // Longer than one frame at 60fps
      logger.warn('Slow touch response detected', {
        component: 'MobileOptimizerService',
        action: 'measureTouchLatency',
        metadata: { latency }
      });
    }

    return latency;
  }

  getDeviceCapabilities(): {
    supportsTouch: boolean;
    supportsHover: boolean;
    devicePixelRatio: number;
    maxTouchPoints: number;
    orientationType?: string;
    isLowEndDevice: boolean;
  } {
    return {
      supportsTouch: 'ontouchstart' in window,
      supportsHover: window.matchMedia('(hover: hover)').matches,
      devicePixelRatio: window.devicePixelRatio || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      orientationType: (screen.orientation || {}).type,
      isLowEndDevice: this.performanceMetrics.isLowEndDevice
    };
  }

  getPerformanceMetrics(): MobilePerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Utility methods for mobile optimization
   */
  preventZoom(): void {
    // Prevent pinch zoom
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });

    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
    });

    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
    });
  }

  enableSmoothScrolling(container?: HTMLElement): void {
    const target = container || document.documentElement;
    target.style.scrollBehavior = 'smooth';
    target.classList.add('scroll-optimized');
  }

  optimizeKeyboard(): void {
    // Handle virtual keyboard on mobile
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport;
      
      visualViewport?.addEventListener('resize', () => {
        const keyboardHeight = window.innerHeight - (visualViewport.height || 0);
        
        if (keyboardHeight > 150) {
          document.body.classList.add('keyboard-open');
          document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
        } else {
          document.body.classList.remove('keyboard-open');
          document.documentElement.style.removeProperty('--keyboard-height');
        }
      });
    }

    // Add styles for keyboard handling
    const style = document.createElement('style');
    style.id = 'keyboard-optimization';
    style.textContent = `
      .keyboard-open {
        --keyboard-height: 0px;
      }
      
      .keyboard-open .keyboard-aware {
        padding-bottom: var(--keyboard-height);
        transition: padding-bottom 0.3s ease;
      }
      
      /* Ensure focused inputs are visible */
      .keyboard-open input:focus,
      .keyboard-open textarea:focus {
        transform: translateY(-50px);
        transition: transform 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// Export singleton and React hooks
export const mobileOptimizer = MobileOptimizerService.getInstance();

// React hook for mobile optimizations
export function useMobileOptimization(containerRef: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (containerRef.current) {
      mobileOptimizer.optimizeForTouch(containerRef.current);
    }
  }, [containerRef]);

  const triggerHapticFeedback = React.useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    mobileOptimizer.triggerHapticFeedback(intensity);
  }, []);

  const registerSwipeHandler = React.useCallback((element: HTMLElement, handler: (gesture: SwipeGesture) => void) => {
    return mobileOptimizer.registerSwipeHandler(element, handler);
  }, []);

  const deviceCapabilities = React.useMemo(() => mobileOptimizer.getDeviceCapabilities(), []);

  return {
    triggerHapticFeedback,
    registerSwipeHandler,
    deviceCapabilities,
    measureTouchLatency: mobileOptimizer.measureTouchLatency.bind(mobileOptimizer)
  };
}

export default mobileOptimizer;
