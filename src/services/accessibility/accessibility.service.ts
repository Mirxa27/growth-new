/**
 * Accessibility Service
 * Comprehensive accessibility features and WCAG compliance tools
 */

import React from 'react';
import { logger } from '@/services/logging/logger.service';

export interface AccessibilityOptions {
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableFocusManagement: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'auto' | 'light' | 'dark' | 'high-contrast';
}

export interface AccessibilityAuditResult {
  issues: AccessibilityIssue[];
  score: number;
  recommendations: string[];
}

export interface AccessibilityIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  element: string;
  description: string;
  suggestion: string;
}

class AccessibilityService {
  private static instance: AccessibilityService;
  private options: AccessibilityOptions;
  private initialized = false;

  private constructor() {
    this.options = {
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableHighContrast: false,
      enableReducedMotion: false,
      enableFocusManagement: true,
      fontSize: 'medium',
      colorScheme: 'auto'
    };
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  /**
   * Initialize accessibility features
   */
  async initialize(customOptions?: Partial<AccessibilityOptions>): Promise<void> {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;

    // Merge with user preferences
    this.options = { ...this.options, ...customOptions };
    
    // Load user preferences from storage
    await this.loadUserPreferences();

    // Setup accessibility features
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.setupColorScheme();
    this.setupFontSize();
    this.setupMotionPreferences();
    this.setupLiveRegions();

    this.initialized = true;
    
    logger.info('Accessibility service initialized', {
      component: 'AccessibilityService',
      action: 'initialize',
      metadata: { options: this.options }
    });
  }

  /**
   * Run accessibility audit on current page
   */
  async auditPage(): Promise<AccessibilityAuditResult> {
    const issues: AccessibilityIssue[] = [];
    
    try {
      // Check for missing alt text
      issues.push(...this.checkImageAltText());
      
      // Check for proper headings structure
      issues.push(...this.checkHeadingStructure());
      
      // Check for focus indicators
      issues.push(...this.checkFocusIndicators());
      
      // Check for color contrast
      issues.push(...this.checkColorContrast());
      
      // Check for aria labels
      issues.push(...this.checkAriaLabels());
      
      // Check for keyboard accessibility
      issues.push(...this.checkKeyboardAccessibility());
      
    } catch (error) {
      logger.error('Accessibility audit failed', {
        component: 'AccessibilityService',
        action: 'auditPage',
        error
      });
    }

    const score = this.calculateAccessibilityScore(issues);
    const recommendations = this.generateRecommendations(issues);

    return {
      issues,
      score,
      recommendations
    };
  }

  /**
   * Update accessibility preferences
   */
  async updatePreferences(newOptions: Partial<AccessibilityOptions>): Promise<void> {
    this.options = { ...this.options, ...newOptions };
    await this.saveUserPreferences();
    await this.applyPreferences();
    
    logger.info('Accessibility preferences updated', {
      component: 'AccessibilityService',
      action: 'updatePreferences',
      metadata: { options: this.options }
    });
  }

  /**
   * Get current accessibility preferences
   */
  getPreferences(): AccessibilityOptions {
    return { ...this.options };
  }

  /**
   * Private setup methods
   */
  private setupKeyboardNavigation(): void {
    if (!this.options.enableKeyboardNavigation) return;

    // Add keyboard navigation styles
    const style = document.createElement('style');
    style.id = 'accessibility-keyboard-nav';
    style.textContent = `
      .keyboard-user *:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }
      
      .keyboard-user *:focus:not(:focus-visible) {
        outline: none !important;
      }

      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        z-index: 1000;
        text-decoration: none;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);

    // Track keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-user');
    });

    // Add skip links
    this.addSkipLinks();
  }

  private setupScreenReaderSupport(): void {
    if (!this.options.enableScreenReaderSupport) return;

    // Add screen reader only content
    const style = document.createElement('style');
    style.id = 'accessibility-screen-reader';
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
    `;
    document.head.appendChild(style);
  }

  private setupFocusManagement(): void {
    if (!this.options.enableFocusManagement) return;

    // Enhanced focus trap utility
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]:not([inert])');
        if (modal) {
          const closeButton = modal.querySelector('[data-close]') as HTMLElement;
          closeButton?.click();
        }
      }
    });
  }

  private setupColorScheme(): void {
    const root = document.documentElement;
    
    switch (this.options.colorScheme) {
      case 'light': {
        root.classList.remove('dark', 'high-contrast');
        break;
      }
      case 'dark': {
        root.classList.add('dark');
        root.classList.remove('high-contrast');
        break;
      }
      case 'high-contrast': {
        root.classList.add('high-contrast');
        break;
      }
      case 'auto':
      default: {
        // Follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        break;
      }
    }

    if (this.options.enableHighContrast) {
      root.classList.add('high-contrast');
    }
  }

  private setupFontSize(): void {
    const root = document.documentElement;
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
    root.classList.add(`text-${this.options.fontSize}`);
  }

  private setupMotionPreferences(): void {
    if (this.options.enableReducedMotion) {
      const style = document.createElement('style');
      style.id = 'reduced-motion';
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const existingStyle = document.getElementById('reduced-motion');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }

  private setupLiveRegions(): void {
    // Add polite live region for status updates
    if (!document.getElementById('live-region-polite')) {
      const politeRegion = document.createElement('div');
      politeRegion.id = 'live-region-polite';
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
    }

    // Add assertive live region for important updates
    if (!document.getElementById('live-region-assertive')) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.id = 'live-region-assertive';
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
    }
  }

  private addSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Audit methods
   */
  private checkImageAltText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        issues.push({
          id: `img-alt-${index}`,
          severity: 'error',
          rule: 'Images must have alt text',
          element: `<img src="${img.src}">`,
          description: 'Image is missing alt text for screen readers',
          suggestion: 'Add descriptive alt text or aria-hidden="true" for decorative images'
        });
      }
    });

    return issues;
  }

  private checkHeadingStructure(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let currentLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1]);
      
      if (index === 0 && level !== 1) {
        issues.push({
          id: `heading-start-${index}`,
          severity: 'error',
          rule: 'Page must start with h1',
          element: heading.outerHTML,
          description: 'First heading should be h1',
          suggestion: 'Change the first heading to h1'
        });
      }
      
      if (level > currentLevel + 1) {
        issues.push({
          id: `heading-skip-${index}`,
          severity: 'warning',
          rule: 'Heading levels should not be skipped',
          element: heading.outerHTML,
          description: `Heading level ${level} follows level ${currentLevel}`,
          suggestion: 'Use sequential heading levels'
        });
      }
      
      currentLevel = level;
    });

    return issues;
  }

  private checkFocusIndicators(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    // This would check for proper focus indicators
    // For now, just check if elements are focusable
    focusableElements.forEach((element, index) => {
      if (element.getAttribute('tabindex') === '-1' && !element.getAttribute('aria-hidden')) {
        issues.push({
          id: `focus-${index}`,
          severity: 'warning',
          rule: 'Interactive elements should be focusable',
          element: element.outerHTML.substring(0, 100),
          description: 'Element is not keyboard accessible',
          suggestion: 'Remove tabindex="-1" or add proper keyboard handlers'
        });
      }
    });

    return issues;
  }

  private checkColorContrast(): AccessibilityIssue[] {
    // This would implement actual color contrast checking
    // For now, return empty array as full implementation would require complex color analysis
    return [];
  }

  private checkAriaLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    
    buttons.forEach((button, index) => {
      if (!button.textContent?.trim()) {
        issues.push({
          id: `button-label-${index}`,
          severity: 'error',
          rule: 'Buttons must have accessible names',
          element: button.outerHTML,
          description: 'Button has no text or aria-label',
          suggestion: 'Add aria-label or visible text content'
        });
      }
    });

    return issues;
  }

  private checkKeyboardAccessibility(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const clickableElements = document.querySelectorAll('[onclick], .clickable, .cursor-pointer');
    
    clickableElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      if (tagName !== 'button' && tagName !== 'a' && !element.getAttribute('tabindex')) {
        issues.push({
          id: `keyboard-${index}`,
          severity: 'warning',
          rule: 'Clickable elements should be keyboard accessible',
          element: element.outerHTML.substring(0, 100),
          description: 'Element appears clickable but is not keyboard accessible',
          suggestion: 'Use button element or add tabindex and keyboard event handlers'
        });
      }
    });

    return issues;
  }

  private calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    // Calculate score out of 100
    const penalties = (errorCount * 10) + (warningCount * 5);
    return Math.max(0, 100 - penalties);
  }

  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];
    
    const hasImageIssues = issues.some(i => i.rule.includes('alt text'));
    if (hasImageIssues) {
      recommendations.push('Add descriptive alt text to all images for screen reader users');
    }
    
    const hasHeadingIssues = issues.some(i => i.rule.includes('Heading'));
    if (hasHeadingIssues) {
      recommendations.push('Use proper heading hierarchy (h1 > h2 > h3) for better navigation');
    }
    
    const hasKeyboardIssues = issues.some(i => i.rule.includes('keyboard'));
    if (hasKeyboardIssues) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }
    
    const hasLabelIssues = issues.some(i => i.rule.includes('accessible names'));
    if (hasLabelIssues) {
      recommendations.push('Add proper labels and ARIA attributes for form controls');
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent! No major accessibility issues detected.');
    }

    return recommendations;
  }

  /**
   * Preference management
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        this.options = { ...this.options, ...preferences };
      }

      // Check for system preferences
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.options.enableReducedMotion = true;
      }

      if (window.matchMedia('(prefers-contrast: high)').matches) {
        this.options.enableHighContrast = true;
      }

      if (window.matchMedia('(prefers-color-scheme: dark)').matches && this.options.colorScheme === 'auto') {
        this.options.colorScheme = 'dark';
      }
    } catch (error) {
      logger.warn('Failed to load accessibility preferences', {
        component: 'AccessibilityService',
        action: 'loadUserPreferences',
        error
      });
    }
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.options));
    } catch (error) {
      logger.warn('Failed to save accessibility preferences', {
        component: 'AccessibilityService',
        action: 'saveUserPreferences',
        error
      });
    }
  }

  private async applyPreferences(): Promise<void> {
    this.setupColorScheme();
    this.setupFontSize();
    this.setupMotionPreferences();
  }

  /**
   * Utility methods
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const liveRegion = document.getElementById(`live-region-${priority}`);
    if (liveRegion) {
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  focusElement(selector: string): boolean {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }

  createFocusTrap(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }

  addAccessibilityAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  /**
   * ARIA utilities
   */
  setAriaExpanded(elementId: string, expanded: boolean): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString());
    }
  }

  setAriaHidden(elementId: string, hidden: boolean): void {
    const element = document.getElementById(elementId);
    if (element) {
      if (hidden) {
        element.setAttribute('aria-hidden', 'true');
        element.setAttribute('inert', '');
      } else {
        element.removeAttribute('aria-hidden');
        element.removeAttribute('inert');
      }
    }
  }

  updateAriaLabel(elementId: string, label: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-label', label);
    }
  }
}

// Export singleton instance and utilities
export const accessibilityService = AccessibilityService.getInstance();

// React hook for accessibility features
export function useAccessibility() {
  React.useEffect(() => {
    accessibilityService.initialize();
  }, []);

  const announceToScreenReader = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityService.announceToScreenReader(message, priority);
  }, []);

  const createFocusTrap = React.useCallback((container: HTMLElement) => {
    return accessibilityService.createFocusTrap(container);
  }, []);

  return {
    announceToScreenReader,
    createFocusTrap,
    focusElement: accessibilityService.focusElement.bind(accessibilityService),
    auditPage: accessibilityService.auditPage.bind(accessibilityService)
  };
}

export default accessibilityService;
