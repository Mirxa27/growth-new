/**
 * Comprehensive Accessibility Audit Utilities
 * Automated accessibility testing and compliance monitoring
 */

import { useEffect, useRef, useCallback } from 'react';

interface AccessibilityIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element: Element;
  selector: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriteria: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  fixes: string[];
}

interface AccessibilityAuditResult {
  issues: AccessibilityIssue[];
  passed: number;
  failed: number;
  warnings: number;
  score: number;
  compliance: {
    wcagA: boolean;
    wcagAA: boolean;
    wcagAAA: boolean;
  };
}

interface AuditOptions {
  includeWarnings?: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  rootElement?: Element;
  ignoreRules?: string[];
  enableLiveAudit?: boolean;
  reportCallback?: (result: AccessibilityAuditResult) => void;
}

class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];
  private mutationObserver: MutationObserver | null = null;
  private liveAuditEnabled = false;
  private lastAuditTime = 0;
  private auditThrottle = 1000; // 1 second throttle

  /**
   * Run comprehensive accessibility audit
   */
  async audit(options: AuditOptions = {}): Promise<AccessibilityAuditResult> {
    const {
      includeWarnings = true,
      wcagLevel = 'AA',
      rootElement = document.body,
      ignoreRules = [],
      reportCallback
    } = options;

    this.issues = [];
    const startTime = performance.now();

    // Run all audit checks
    await Promise.all([
      this.auditKeyboardAccess(rootElement, ignoreRules),
      this.auditSemanticStructure(rootElement, ignoreRules),
      this.auditColorContrast(rootElement, ignoreRules),
      this.auditImages(rootElement, ignoreRules),
      this.auditForms(rootElement, ignoreRules),
      this.auditHeadings(rootElement, ignoreRules),
      this.auditLandmarks(rootElement, ignoreRules),
      this.auditTouchTargets(rootElement, ignoreRules),
      this.auditFocus(rootElement, ignoreRules),
      this.auditLabels(rootElement, ignoreRules)
    ]);

    // Filter issues by WCAG level and preferences
    const filteredIssues = this.issues.filter(issue => {
      if (!includeWarnings && issue.severity === 'warning') return false;
      if (ignoreRules.includes(issue.rule)) return false;
      
      const levelOrder = { A: 1, AA: 2, AAA: 3 };
      return levelOrder[issue.wcagLevel] <= levelOrder[wcagLevel];
    });

    // Calculate metrics
    const passed = this.countPassedChecks(rootElement);
    const failed = filteredIssues.filter(i => i.severity === 'error').length;
    const warnings = filteredIssues.filter(i => i.severity === 'warning').length;
    const score = this.calculateAccessibilityScore(passed, failed, warnings);

    const result: AccessibilityAuditResult = {
      issues: filteredIssues,
      passed,
      failed,
      warnings,
      score,
      compliance: {
        wcagA: filteredIssues.filter(i => i.wcagLevel === 'A' && i.severity === 'error').length === 0,
        wcagAA: filteredIssues.filter(i => ['A', 'AA'].includes(i.wcagLevel) && i.severity === 'error').length === 0,
        wcagAAA: filteredIssues.filter(i => i.severity === 'error').length === 0
      }
    };

    const auditTime = performance.now() - startTime;
    console.log(`[A11y] Audit completed in ${auditTime.toFixed(2)}ms - Score: ${score}`);

    if (reportCallback) {
      reportCallback(result);
    }

    return result;
  }

  /**
   * Audit keyboard accessibility
   */
  private async auditKeyboardAccess(root: Element, ignoreRules: string[]): Promise<void> {
    // Check for focusable elements without proper tab order
    const focusableElements = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      
      // Check for positive tabindex (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addIssue({
          rule: 'tabindex-positive',
          severity: 'warning',
          element,
          description: 'Avoid positive tabindex values as they disrupt natural tab order',
          wcagLevel: 'A',
          wcagCriteria: '2.4.3',
          impact: 'moderate',
          fixes: ['Remove positive tabindex or set to 0', 'Use logical DOM order for navigation']
        });
      }

      // Check for missing focus indicators
      const computedStyle = window.getComputedStyle(element, ':focus');
      const hasVisibleFocus = (
        computedStyle.outline !== 'none' ||
        computedStyle.boxShadow !== 'none' ||
        computedStyle.border !== 'none'
      );

      if (!hasVisibleFocus) {
        this.addIssue({
          rule: 'focus-indicator-missing',
          severity: 'error',
          element,
          description: 'Interactive element lacks visible focus indicator',
          wcagLevel: 'AA',
          wcagCriteria: '2.4.7',
          impact: 'serious',
          fixes: [
            'Add focus styles with outline, box-shadow, or border',
            'Ensure focus indicator has 3:1 contrast ratio',
            'Use :focus-visible for better UX'
          ]
        });
      }

      // Check for keyboard traps
      if (element instanceof HTMLElement) {
        const isTrapped = this.checkForKeyboardTrap(element);
        if (isTrapped) {
          this.addIssue({
            rule: 'keyboard-trap',
            severity: 'error',
            element,
            description: 'Element creates keyboard trap',
            wcagLevel: 'A',
            wcagCriteria: '2.1.2',
            impact: 'critical',
            fixes: [
              'Ensure Tab key can exit the element',
              'Provide escape mechanism (Escape key)',
              'Implement proper focus management'
            ]
          });
        }
      }
    });

    // Check for elements that should be focusable but aren't
    const clickableElements = root.querySelectorAll('[onclick], .clickable, [role="button"]');
    clickableElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      const isFocusable = element.matches('button, [href], input, select, textarea') || 
                         (tabIndex !== null && tabIndex !== '-1');

      if (!isFocusable) {
        this.addIssue({
          rule: 'interactive-not-focusable',
          severity: 'error',
          element,
          description: 'Interactive element is not keyboard accessible',
          wcagLevel: 'A',
          wcagCriteria: '2.1.1',
          impact: 'serious',
          fixes: [
            'Add tabindex="0" to make element focusable',
            'Use semantic button or link element',
            'Add keyboard event handlers'
          ]
        });
      }
    });
  }

  /**
   * Audit semantic HTML structure
   */
  private async auditSemanticStructure(root: Element, ignoreRules: string[]): Promise<void> {
    // Check for proper heading hierarchy
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;

    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel > lastLevel + 1 && lastLevel > 0) {
        this.addIssue({
          rule: 'heading-hierarchy-skip',
          severity: 'warning',
          element: heading,
          description: `Heading level ${currentLevel} skips levels in hierarchy`,
          wcagLevel: 'A',
          wcagCriteria: '1.3.1',
          impact: 'moderate',
          fixes: [
            'Use sequential heading levels (h1, h2, h3, etc.)',
            'Consider semantic importance over visual styling',
            'Use CSS for visual adjustments'
          ]
        });
      }
      
      lastLevel = currentLevel;
    });

    // Check for missing main landmark
    const mainElements = root.querySelectorAll('main, [role="main"]');
    if (mainElements.length === 0) {
      this.addIssue({
        rule: 'missing-main-landmark',
        severity: 'error',
        element: root,
        description: 'Page missing main landmark',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1',
        impact: 'moderate',
        fixes: [
          'Add <main> element to page',
          'Use role="main" on existing element',
          'Ensure only one main landmark per page'
        ]
      });
    } else if (mainElements.length > 1) {
      this.addIssue({
        rule: 'multiple-main-landmarks',
        severity: 'warning',
        element: root,
        description: 'Multiple main landmarks found',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1',
        impact: 'minor',
        fixes: [
          'Use only one main landmark per page',
          'Consider using section elements instead',
          'Add aria-labelledby to distinguish multiple main areas'
        ]
      });
    }

    // Check for generic div/span usage where semantic elements would be better
    const genericElements = root.querySelectorAll('div[onclick], span[onclick]');
    genericElements.forEach(element => {
      this.addIssue({
        rule: 'generic-clickable-element',
        severity: 'warning',
        element,
        description: 'Generic element used for interactive content',
        wcagLevel: 'A',
        wcagCriteria: '4.1.2',
        impact: 'moderate',
        fixes: [
          'Use button element for actions',
          'Use anchor element for navigation',
          'Add appropriate ARIA role'
        ]
      });
    });
  }

  /**
   * Audit color contrast compliance
   */
  private async auditColorContrast(root: Element, ignoreRules: string[]): Promise<void> {
    const textElements = root.querySelectorAll('*');
    
    for (const element of textElements) {
      const computedStyle = window.getComputedStyle(element);
      const hasText = element.textContent?.trim();
      
      if (!hasText) continue;

      const backgroundColor = computedStyle.backgroundColor;
      const color = computedStyle.color;
      const fontSize = parseFloat(computedStyle.fontSize);
      const fontWeight = computedStyle.fontWeight;

      // Skip transparent or inherit values
      if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
        continue;
      }

      try {
        const contrast = this.calculateColorContrast(color, backgroundColor);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        
        // WCAG AA requirements
        const requiredContrast = isLargeText ? 3 : 4.5;
        const requiredContrastAAA = isLargeText ? 4.5 : 7;

        if (contrast < requiredContrast) {
          this.addIssue({
            rule: 'color-contrast-insufficient',
            severity: 'error',
            element,
            description: `Color contrast ratio ${contrast.toFixed(2)}:1 is below required ${requiredContrast}:1`,
            wcagLevel: 'AA',
            wcagCriteria: '1.4.3',
            impact: 'serious',
            fixes: [
              'Increase contrast between text and background',
              'Use darker text or lighter background',
              'Test with color contrast analyzer tools'
            ]
          });
        } else if (contrast < requiredContrastAAA) {
          this.addIssue({
            rule: 'color-contrast-aaa',
            severity: 'info',
            element,
            description: `Color contrast ratio ${contrast.toFixed(2)}:1 meets AA but not AAA standards`,
            wcagLevel: 'AAA',
            wcagCriteria: '1.4.6',
            impact: 'minor',
            fixes: [
              'Consider increasing contrast for AAA compliance',
              'Current contrast meets AA requirements'
            ]
          });
        }
      } catch (error) {
        // Skip elements where contrast cannot be calculated
        continue;
      }
    }
  }

  /**
   * Audit images for accessibility
   */
  private async auditImages(root: Element, ignoreRules: string[]): Promise<void> {
    const images = root.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      const role = img.getAttribute('role');
      
      // Check for missing alt attribute
      if (alt === null) {
        this.addIssue({
          rule: 'img-missing-alt',
          severity: 'error',
          element: img,
          description: 'Image missing alt attribute',
          wcagLevel: 'A',
          wcagCriteria: '1.1.1',
          impact: 'serious',
          fixes: [
            'Add descriptive alt text',
            'Use alt="" for decorative images',
            'Consider if image is essential to content'
          ]
        });
      }

      // Check for poor alt text
      else if (alt && this.isPoorAltText(alt)) {
        this.addIssue({
          rule: 'img-poor-alt',
          severity: 'warning',
          element: img,
          description: 'Image alt text appears to be poor quality or generic',
          wcagLevel: 'A',
          wcagCriteria: '1.1.1',
          impact: 'moderate',
          fixes: [
            'Provide specific, meaningful description',
            'Describe the function, not just appearance',
            'Avoid "image of" or "picture of" phrases'
          ]
        });
      }

      // Check for complex images without detailed description
      if (this.isComplexImage(img) && !this.hasDetailedDescription(img)) {
        this.addIssue({
          rule: 'complex-img-missing-description',
          severity: 'warning',
          element: img,
          description: 'Complex image may need detailed description',
          wcagLevel: 'A',
          wcagCriteria: '1.1.1',
          impact: 'moderate',
          fixes: [
            'Add longdesc attribute or link',
            'Provide detailed description in nearby text',
            'Use aria-describedby to reference description'
          ]
        });
      }
    });

    // Check for background images with content
    const elementsWithBgImages = root.querySelectorAll('*');
    elementsWithBgImages.forEach(element => {
      const style = window.getComputedStyle(element);
      const bgImage = style.backgroundImage;
      
      if (bgImage && bgImage !== 'none' && element.textContent?.trim()) {
        const hasAltText = element.getAttribute('aria-label') || 
                         element.getAttribute('aria-labelledby') ||
                         element.getAttribute('role') === 'img';
        
        if (!hasAltText) {
          this.addIssue({
            rule: 'bg-img-missing-alt',
            severity: 'warning',
            element,
            description: 'Background image may convey important information without alternative text',
            wcagLevel: 'A',
            wcagCriteria: '1.1.1',
            impact: 'moderate',
            fixes: [
              'Add aria-label if image is meaningful',
              'Use role="img" for informative background images',
              'Provide text alternative nearby'
            ]
          });
        }
      }
    });
  }

  /**
   * Audit forms for accessibility
   */
  private async auditForms(root: Element, ignoreRules: string[]): Promise<void> {
    const formElements = root.querySelectorAll('input, textarea, select');
    
    formElements.forEach(element => {
      const type = element.getAttribute('type');
      const id = element.getAttribute('id');
      const name = element.getAttribute('name');
      const required = element.hasAttribute('required');
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      
      // Check for missing labels
      const hasLabel = this.hasAssociatedLabel(element) || ariaLabel || ariaLabelledBy;
      if (!hasLabel) {
        this.addIssue({
          rule: 'form-missing-label',
          severity: 'error',
          element,
          description: 'Form control missing accessible label',
          wcagLevel: 'A',
          wcagCriteria: '1.3.1',
          impact: 'serious',
          fixes: [
            'Add <label> element with for attribute',
            'Use aria-label attribute',
            'Use aria-labelledby to reference existing text'
          ]
        });
      }

      // Check for missing required indicators
      if (required && !this.hasRequiredIndicator(element)) {
        this.addIssue({
          rule: 'form-missing-required-indicator',
          severity: 'warning',
          element,
          description: 'Required field lacks clear indication',
          wcagLevel: 'A',
          wcagCriteria: '3.3.2',
          impact: 'moderate',
          fixes: [
            'Add aria-required="true"',
            'Include "required" in label text',
            'Use consistent visual indicator'
          ]
        });
      }

      // Check for missing error descriptions
      if (this.hasErrorState(element) && !this.hasErrorDescription(element)) {
        this.addIssue({
          rule: 'form-missing-error-description',
          severity: 'error',
          element,
          description: 'Form field in error state lacks descriptive error message',
          wcagLevel: 'A',
          wcagCriteria: '3.3.1',
          impact: 'serious',
          fixes: [
            'Add aria-describedby linking to error message',
            'Provide specific error description',
            'Use aria-invalid="true" for invalid fields'
          ]
        });
      }
    });

    // Check fieldsets and legends
    const fieldsets = root.querySelectorAll('fieldset');
    fieldsets.forEach(fieldset => {
      const legend = fieldset.querySelector('legend');
      if (!legend) {
        this.addIssue({
          rule: 'fieldset-missing-legend',
          severity: 'error',
          element: fieldset,
          description: 'Fieldset missing legend element',
          wcagLevel: 'A',
          wcagCriteria: '1.3.1',
          impact: 'moderate',
          fixes: [
            'Add <legend> element as first child of fieldset',
            'Use legend to describe the group of controls',
            'Consider using aria-labelledby if legend is not suitable'
          ]
        });
      }
    });
  }

  /**
   * Audit touch targets for mobile accessibility
   */
  private async auditTouchTargets(root: Element, ignoreRules: string[]): Promise<void> {
    const interactiveElements = root.querySelectorAll(
      'button, [href], input[type="button"], input[type="submit"], [onclick], [role="button"]'
    );

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // iOS/Android recommended minimum
      
      if (rect.width < minSize || rect.height < minSize) {
        this.addIssue({
          rule: 'touch-target-too-small',
          severity: 'warning',
          element,
          description: `Touch target ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px is below recommended 44x44px minimum`,
          wcagLevel: 'AAA',
          wcagCriteria: '2.5.5',
          impact: 'moderate',
          fixes: [
            'Increase button/link size to at least 44x44px',
            'Add padding to increase touch area',
            'Ensure adequate spacing between touch targets'
          ]
        });
      }

      // Check spacing between touch targets
      const nearby = this.getNearbyTouchTargets(element, interactiveElements);
      nearby.forEach(nearbyElement => {
        const distance = this.calculateElementDistance(element, nearbyElement);
        if (distance < 8) { // 8px minimum spacing
          this.addIssue({
            rule: 'touch-targets-too-close',
            severity: 'warning',
            element,
            description: 'Touch targets are too close together',
            wcagLevel: 'AAA',
            wcagCriteria: '2.5.5',
            impact: 'minor',
            fixes: [
              'Add margin/padding between touch targets',
              'Ensure at least 8px spacing',
              'Consider larger spacing for better usability'
            ]
          });
        }
      });
    });
  }

  /**
   * Helper methods
   */
  private addIssue(issue: Omit<AccessibilityIssue, 'id' | 'selector'>): void {
    const id = `a11y-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const selector = this.generateSelector(issue.element);
    
    this.issues.push({
      id,
      selector,
      ...issue
    });
  }

  private generateSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    
    let selector = element.tagName.toLowerCase();
    if (element.className) {
      selector += '.' + element.className.split(' ').join('.');
    }
    
    // Add nth-child if needed for uniqueness
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName === element.tagName && child.className === element.className
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    
    return selector;
  }

  private checkForKeyboardTrap(element: HTMLElement): boolean {
    // Simplified keyboard trap detection
    const focusableChildren = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return focusableChildren.length > 0 && element.style.position === 'fixed';
  }

  private calculateColorContrast(foreground: string, background: string): number {
    // Simplified contrast calculation
    // In real implementation, would parse RGB values and calculate luminance
    const fg = this.parseColor(foreground);
    const bg = this.parseColor(background);
    
    const l1 = this.getLuminance(fg.r, fg.g, fg.b);
    const l2 = this.getLuminance(bg.r, bg.g, bg.b);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    // Simplified color parsing - would need more robust implementation
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        return {
          r: parseInt(matches[0]),
          g: parseInt(matches[1]),
          b: parseInt(matches[2])
        };
      }
    }
    // Default to white for unparseable colors
    return { r: 255, g: 255, b: 255 };
  }

  private getLuminance(r: number, g: number, b: number): number {
    const sRGB = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  private isPoorAltText(alt: string): boolean {
    const poorPatterns = [
      /^(image|picture|photo|img)$/i,
      /^(click here|link|button)$/i,
      /^\d+\.jpg$/i,
      /^untitled$/i,
      /^(graphic|icon)$/i
    ];
    return poorPatterns.some(pattern => pattern.test(alt.trim()));
  }

  private isComplexImage(img: HTMLImageElement): boolean {
    // Heuristics for complex images
    const src = img.src.toLowerCase();
    return src.includes('chart') || 
           src.includes('graph') || 
           src.includes('diagram') ||
           img.naturalWidth > 800 || 
           img.naturalHeight > 600;
  }

  private hasDetailedDescription(img: HTMLImageElement): boolean {
    return !!(
      img.getAttribute('longdesc') ||
      img.getAttribute('aria-describedby') ||
      img.nextElementSibling?.textContent?.length > 100
    );
  }

  private hasAssociatedLabel(element: Element): boolean {
    const id = element.getAttribute('id');
    if (id) {
      return !!document.querySelector(`label[for="${id}"]`);
    }
    return !!element.closest('label');
  }

  private hasRequiredIndicator(element: Element): boolean {
    return !!(
      element.getAttribute('aria-required') ||
      element.getAttribute('aria-label')?.includes('required') ||
      this.hasAssociatedLabel(element) && 
      document.querySelector(`label[for="${element.id}"]`)?.textContent?.includes('*')
    );
  }

  private hasErrorState(element: Element): boolean {
    return !!(
      element.getAttribute('aria-invalid') === 'true' ||
      element.classList.contains('error') ||
      element.classList.contains('invalid')
    );
  }

  private hasErrorDescription(element: Element): boolean {
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const description = document.getElementById(describedBy);
      return !!(description && description.textContent?.trim());
    }
    return false;
  }

  private getNearbyTouchTargets(element: Element, allTargets: NodeListOf<Element>): Element[] {
    const rect = element.getBoundingClientRect();
    const nearby: Element[] = [];
    
    allTargets.forEach(target => {
      if (target === element) return;
      
      const targetRect = target.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(rect.left - targetRect.left, 2) + 
        Math.pow(rect.top - targetRect.top, 2)
      );
      
      if (distance < 100) { // Within 100px
        nearby.push(target);
      }
    });
    
    return nearby;
  }

  private calculateElementDistance(el1: Element, el2: Element): number {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    
    return Math.sqrt(
      Math.pow(rect1.left - rect2.left, 2) + 
      Math.pow(rect1.top - rect2.top, 2)
    );
  }

  private countPassedChecks(root: Element): number {
    // Simplified - would count all accessibility checks that passed
    const totalElements = root.querySelectorAll('*').length;
    const issueElements = new Set(this.issues.map(i => i.element));
    return totalElements - issueElements.size;
  }

  private calculateAccessibilityScore(passed: number, failed: number, warnings: number): number {
    const total = passed + failed + warnings;
    if (total === 0) return 100;
    
    // Weight errors more heavily than warnings
    const weightedFailed = failed * 2 + warnings;
    const score = Math.max(0, ((total - weightedFailed) / total) * 100);
    
    return Math.round(score);
  }

  // Additional audit methods would go here for headings, landmarks, focus, labels...
  private async auditHeadings(root: Element, ignoreRules: string[]): Promise<void> {
    // Implementation for heading audit
  }

  private async auditLandmarks(root: Element, ignoreRules: string[]): Promise<void> {
    // Implementation for landmark audit
  }

  private async auditFocus(root: Element, ignoreRules: string[]): Promise<void> {
    // Implementation for focus audit
  }

  private async auditLabels(root: Element, ignoreRules: string[]): Promise<void> {
    // Implementation for label audit
  }

  /**
   * Enable live accessibility monitoring
   */
  enableLiveAudit(options: AuditOptions = {}): void {
    if (this.liveAuditEnabled) return;
    
    this.liveAuditEnabled = true;
    
    this.mutationObserver = new MutationObserver((mutations) => {
      const now = Date.now();
      if (now - this.lastAuditTime < this.auditThrottle) return;
      
      this.lastAuditTime = now;
      this.audit(options).catch(console.error);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'aria-*', 'tabindex', 'alt']
    });
  }

  /**
   * Disable live accessibility monitoring
   */
  disableLiveAudit(): void {
    this.liveAuditEnabled = false;
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * Generate accessibility report
   */
  generateReport(result: AccessibilityAuditResult): string {
    let report = '# Accessibility Audit Report\n\n';
    
    report += `## Summary\n`;
    report += `- **Score**: ${result.score}/100\n`;
    report += `- **Passed**: ${result.passed}\n`;
    report += `- **Failed**: ${result.failed}\n`;
    report += `- **Warnings**: ${result.warnings}\n`;
    report += `- **WCAG AA Compliant**: ${result.compliance.wcagAA ? '✅' : '❌'}\n\n`;

    if (result.issues.length > 0) {
      report += `## Issues Found\n\n`;
      
      const errorIssues = result.issues.filter(i => i.severity === 'error');
      const warningIssues = result.issues.filter(i => i.severity === 'warning');
      const infoIssues = result.issues.filter(i => i.severity === 'info');

      if (errorIssues.length > 0) {
        report += `### 🚨 Errors (${errorIssues.length})\n`;
        errorIssues.forEach(issue => {
          report += `- **${issue.rule}** (${issue.wcagCriteria}): ${issue.description}\n`;
          report += `  - Element: \`${issue.selector}\`\n`;
          report += `  - Impact: ${issue.impact}\n`;
          report += `  - Fixes: ${issue.fixes.join(', ')}\n\n`;
        });
      }

      if (warningIssues.length > 0) {
        report += `### ⚠️ Warnings (${warningIssues.length})\n`;
        warningIssues.forEach(issue => {
          report += `- **${issue.rule}** (${issue.wcagCriteria}): ${issue.description}\n`;
          report += `  - Element: \`${issue.selector}\`\n`;
          report += `  - Fixes: ${issue.fixes.join(', ')}\n\n`;
        });
      }

      if (infoIssues.length > 0) {
        report += `### ℹ️ Information (${infoIssues.length})\n`;
        infoIssues.forEach(issue => {
          report += `- **${issue.rule}**: ${issue.description}\n`;
        });
      }
    }

    return report;
  }
}

// Singleton instance
export const accessibilityAuditor = new AccessibilityAuditor();

/**
 * React hook for accessibility auditing
 */
export function useAccessibilityAudit(options: AuditOptions = {}) {
  const auditRef = useRef<AccessibilityAuditor>(accessibilityAuditor);
  const [result, setResult] = useState<AccessibilityAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const runAudit = useCallback(async (customOptions?: AuditOptions) => {
    setIsAuditing(true);
    try {
      const auditResult = await auditRef.current.audit({
        ...options,
        ...customOptions,
        reportCallback: (result) => {
          setResult(result);
          options.reportCallback?.(result);
        }
      });
      setResult(auditResult);
      return auditResult;
    } finally {
      setIsAuditing(false);
    }
  }, [options]);

  const enableLiveAudit = useCallback(() => {
    auditRef.current.enableLiveAudit({
      ...options,
      reportCallback: setResult
    });
  }, [options]);

  const disableLiveAudit = useCallback(() => {
    auditRef.current.disableLiveAudit();
  }, []);

  return {
    result,
    isAuditing,
    runAudit,
    enableLiveAudit,
    disableLiveAudit,
    generateReport: (auditResult?: AccessibilityAuditResult) => 
      auditRef.current.generateReport(auditResult || result!)
  };
}

// Development helper
if (process.env.NODE_ENV === 'development') {
  (window as any).accessibilityAuditor = accessibilityAuditor;
  
  // Run audit on page load in development
  window.addEventListener('load', () => {
    setTimeout(() => {
      accessibilityAuditor.audit({
        includeWarnings: true,
        wcagLevel: 'AA',
        reportCallback: (result) => {
          console.group('[A11y] Accessibility Audit Results');
          console.log('Score:', result.score);
          console.log('Issues:', result.issues);
          console.log('Report:', accessibilityAuditor.generateReport(result));
          console.groupEnd();
        }
      });
    }, 2000);
  });
}

export default accessibilityAuditor;