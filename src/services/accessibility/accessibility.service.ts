/**
 * Accessibility Service
 * Provides utilities for improving application accessibility
 */

export class AccessibilityService {
  private focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  private skipLinkId = 'skip-to-content';

  /**
   * Initialize accessibility features
   */
  initialize() {
    this.setupSkipLink();
    this.setupFocusManagement();
    this.setupKeyboardNavigation();
    this.announcePageChanges();
  }

  /**
   * Create and manage skip link for screen readers
   */
  private setupSkipLink() {
    if (document.getElementById(this.skipLinkId)) return;

    const skipLink = document.createElement('a');
    skipLink.id = this.skipLinkId;
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Manage focus for better keyboard navigation
   */
  private setupFocusManagement() {
    // Focus management for modals and dialogs
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      if (event.key === 'Tab') {
        this.handleTabKey(event);
      }
    });
  }

  /**
   * Handle escape key for closing modals
   */
  private handleEscapeKey() {
    const modal = document.querySelector('[role="dialog"]:not([hidden])');
    if (modal) {
      const closeButton = modal.querySelector('[aria-label="Close"], [data-close]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    }
  }

  /**
   * Handle tab key for focus trapping in modals
   */
  private handleTabKey(event: KeyboardEvent) {
    const modal = document.querySelector('[role="dialog"]:not([hidden])');
    if (!modal) return;

    const focusableElements = Array.from(modal.querySelectorAll(this.focusableElements)) as HTMLElement[];
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }

  /**
   * Setup keyboard navigation for custom components
   */
  private setupKeyboardNavigation() {
    // Handle arrow key navigation for custom components
    document.addEventListener('keydown', (event) => {
      const activeElement = document.activeElement as HTMLElement;
      
      if (activeElement?.getAttribute('role') === 'tab') {
        this.handleTabNavigation(event, activeElement);
      }
      
      if (activeElement?.getAttribute('role') === 'menuitem') {
        this.handleMenuNavigation(event, activeElement);
      }
    });
  }

  /**
   * Handle arrow key navigation for tabs
   */
  private handleTabNavigation(event: KeyboardEvent, activeTab: HTMLElement) {
    const tabList = activeTab.closest('[role="tablist"]');
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const currentIndex = tabs.indexOf(activeTab);

    let nextIndex: number;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
        break;
        
      case 'Home':
        event.preventDefault();
        tabs[0].focus();
        tabs[0].click();
        break;
        
      case 'End':
        event.preventDefault();
        tabs[tabs.length - 1].focus();
        tabs[tabs.length - 1].click();
        break;
    }
  }

  /**
   * Handle arrow key navigation for menus
   */
  private handleMenuNavigation(event: KeyboardEvent, activeItem: HTMLElement) {
    const menu = activeItem.closest('[role="menu"]');
    if (!menu) return;

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const currentIndex = items.indexOf(activeItem);

    let nextIndex: number;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        items[nextIndex].focus();
        break;
        
      case 'Home':
        event.preventDefault();
        items[0].focus();
        break;
        
      case 'End':
        event.preventDefault();
        items[items.length - 1].focus();
        break;
    }
  }

  /**
   * Announce page changes to screen readers
   */
  private announcePageChanges() {
    const announcer = this.getOrCreateAnnouncer();
    
    // Listen for route changes (simplified - in real app would integrate with router)
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => {
        const title = document.title;
        announcer.textContent = `Navigated to ${title}`;
      }, 100);
    };
  }

  /**
   * Get or create screen reader announcer element
   */
  private getOrCreateAnnouncer(): HTMLElement {
    let announcer = document.getElementById('sr-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    
    return announcer;
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = this.getOrCreateAnnouncer();
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
  }

  /**
   * Validate form accessibility
   */
  validateFormAccessibility(form: HTMLFormElement) {
    const issues: string[] = [];
    
    // Check for form labels
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!id || (!ariaLabel && !ariaLabelledBy)) {
        const label = form.querySelector(`label[for="${id}"]`);
        if (!label) {
          issues.push(`Input missing accessible label: ${input.tagName}${input.className ? '.' + input.className : ''}`);
        }
      }
    });
    
    // Check for required field indicators
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach((field) => {
      const ariaRequired = field.getAttribute('aria-required');
      if (ariaRequired !== 'true') {
        issues.push(`Required field missing aria-required: ${field.id || field.tagName}`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Improve color contrast for better readability
   */
  checkColorContrast() {
    // This is a simplified version - in production you'd use a proper contrast checking library
    const elements = document.querySelectorAll('*');
    const issues: string[] = [];
    
    elements.forEach((element) => {
      const styles = getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Basic contrast check (simplified)
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // In a real implementation, you'd calculate the actual contrast ratio
        // For now, just log elements that might have contrast issues
        if (element.textContent && element.textContent.trim().length > 0) {
          // This is where you'd implement actual contrast ratio calculation
        }
      }
    });
    
    return issues;
  }

  /**
   * Setup reduced motion preferences
   */
  setupReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };
    
    handleReducedMotion(prefersReducedMotion);
    prefersReducedMotion.addEventListener('change', handleReducedMotion);
  }

  /**
   * Focus management for single page applications
   */
  manageFocus(targetElement?: HTMLElement | string) {
    let element: HTMLElement | null = null;
    
    if (typeof targetElement === 'string') {
      element = document.querySelector(targetElement);
    } else if (targetElement instanceof HTMLElement) {
      element = targetElement;
    } else {
      // Default to main content or first heading
      element = document.querySelector('#main-content, main, h1') as HTMLElement;
    }
    
    if (element) {
      // Make element focusable if it's not already
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }
      
      element.focus();
      
      // Remove tabindex after focus if it was added
      setTimeout(() => {
        if (element?.getAttribute('tabindex') === '-1') {
          element.removeAttribute('tabindex');
        }
      }, 100);
    }
  }

  /**
   * Clean up accessibility features
   */
  cleanup() {
    const skipLink = document.getElementById(this.skipLinkId);
    skipLink?.remove();
    
    const announcer = document.getElementById('sr-announcer');
    announcer?.remove();
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();