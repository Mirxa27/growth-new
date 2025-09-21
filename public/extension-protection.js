// Chrome Extension Protection Script
// Prevents extension conflicts with the application

(function() {
  'use strict';
  
  // List of known problematic extension script patterns
  const blockedScriptPatterns = [
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    // Block extension scripts that cause console spam
    'contentSelector-csui',
    'floatingSphere-csui',
    'utils-csui',
    'chunk-eb16e6c6',
    'index.iife.js',
    // Only block clearly malicious scripts
    'malicious-extension',
    'hacker-script',
    'spyware'
  ];
  
  // Prevent extension script injection
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    // Block suspicious script elements
    if (tagName.toLowerCase() === 'script') {
      const originalSetSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (value && blockedScriptPatterns.some(pattern => value.includes(pattern))) {
            console.warn('Blocked extension script:', value);
            return;
          }
          originalSetSrc.call(this, value);
        },
        get: function() {
          return this.getAttribute('src');
        }
      });
    }
    
    return element;
  };
  
  // Enhanced error patterns for third-party extensions
  const blockedErrorPatterns = [
    'extension://',
    // Block extension scripts that cause console spam
    'contentSelector-csui',
    'floatingSphere-csui',
    'utils-csui',
    'chunk-eb16e6c6',
    'index.iife.js',
    // Only block clearly malicious scripts, not legitimate extension functionality
    'malicious-script',
    'hacker-content',
    'spyware-extension',
    // Keep Capacitor import blocking in web context
    '@capacitor/core',
    'Failed to resolve module specifier',
    // Handle extension import statement errors gracefully
    'Cannot use import statement outside a module'
  ];
  
  // Protect against extension content script errors
  window.addEventListener('error', function(event) {
    const errorSource = event.filename || event.message || '';
    if (blockedErrorPatterns.some(pattern => errorSource.includes(pattern))) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Blocked extension error:', errorSource);
      return false;
    }
  }, true);
  
  // Also handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    if (blockedErrorPatterns.some(pattern => errorMessage.includes(pattern))) {
      event.preventDefault();
      console.warn('Blocked extension promise rejection:', errorMessage);
      return false;
    }
  });
  
  // Handle extension module import errors gracefully
  window.addEventListener('error', function(event) {
    const errorSource = event.filename || event.message || '';

    // Check for various extension-related errors
    const extensionErrors = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'LayoutGroupContext.mjs',
      'Cannot use import statement outside a module',
      'Cannot read properties of undefined (reading \'createContext\')',
      'contentSelector-csui',
      'floatingSphere-csui',
      'utils-csui',
      'chunk-eb16e6c6',
      'index.iife.js'
    ];

    if (extensionErrors.some(pattern => errorSource.includes(pattern))) {
      // This is a browser extension error - suppress it
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Monitor DOM mutations to catch extension injections
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for suspicious script tags
              if (node.tagName === 'SCRIPT') {
                const src = node.src || node.innerHTML;
                if (src && blockedScriptPatterns.some(pattern => src.includes(pattern))) {
                  console.warn('Removing injected extension script:', src.substring(0, 100));
                  node.remove();
                }
              }
              
              // Check for suspicious elements with extension-like IDs/classes
              const suspiciousSelectors = [
                '[id*="extension"]',
                '[class*="extension"]',
                '[id*="csui"]',
                '[class*="csui"]',
                '[id*="floating"]',
                '[class*="floating"]'
              ];
              
              suspiciousSelectors.forEach(selector => {
                try {
                  const elements = node.querySelectorAll ? node.querySelectorAll(selector) : [];
                  elements.forEach(el => {
                    console.warn('Removing suspicious extension element:', el.tagName, el.id || el.className);
                    el.remove();
                  });
                } catch (e) {
                  // Ignore selector errors
                }
              });
            }
          });
        }
      });
    });
    
    // Start observing after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  
  // Override console methods to suppress extension spam
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  // Also override debug, trace, and any other console methods
  const originalConsoleDebug = console.debug;
  const originalConsoleTrace = console.trace;
  
  const suppressConsolePatterns = [
    // Suppress extension-related console messages
    'ContentScript Loaded',
    'content script loaded',
    ' content script loaded', // With leading space
    'ctx sn',
    'ctx Es',
    'ctx Lt',
    'Calling function getSettings',
    'sendToBackground response',
    'loginStatus',
    '100x ContentScript Loaded',
    'Extension protection initialized',
    // Only suppress clearly problematic messages
    'malicious-extension-loaded',
    'spyware-detected',
    'unauthorized-script'
  ];
  
  function shouldSuppressMessage(message) {
    const messageStr = String(message);
    return suppressConsolePatterns.some(pattern => messageStr.includes(pattern));
  }
  
  console.log = function(...args) {
    if (!shouldSuppressMessage(args[0])) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  console.error = function(...args) {
    if (!shouldSuppressMessage(args[0])) {
      originalConsoleError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    if (!shouldSuppressMessage(args[0])) {
      originalConsoleWarn.apply(console, args);
    }
  };

  console.info = function(...args) {
    if (!shouldSuppressMessage(args[0])) {
      originalConsoleInfo.apply(console, args);
    }
  };

  console.debug = function(...args) {
    if (!shouldSuppressMessage(args[0])) {
      originalConsoleDebug.apply(console, args);
    }
  };

  console.trace = function(...args) {
    if (!shouldSuppressMessage(args[0])) {
      originalConsoleTrace.apply(console, args);
    }
  };

  console.log('Extension protection initialized');
})();
