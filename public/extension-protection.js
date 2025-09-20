// Chrome Extension Protection Script
// Prevents extension conflicts with the application

(function() {
  'use strict';
  
  // Prevent extension script injection
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    // Block suspicious script elements
    if (tagName.toLowerCase() === 'script') {
      const originalSetSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (value && (
            value.includes('chrome-extension://') ||
            value.includes('moz-extension://') ||
            value.includes('safari-extension://')
          )) {
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
  
  // Protect against extension content script errors
  window.addEventListener('error', function(event) {
    if (event.filename && (
      event.filename.includes('extension://') ||
      event.filename.includes('content.js') ||
      event.filename.includes('contentSelector') ||
      event.filename.includes('floatingSphere')
    )) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Blocked extension error:', event.filename);
      return false;
    }
  }, true);
  
  // Protect against extension module errors
  const originalImport = window.import;
  if (originalImport) {
    window.import = function(specifier) {
      if (specifier && specifier.includes('extension://')) {
        console.warn('Blocked extension import:', specifier);
        return Promise.reject(new Error('Extension imports blocked'));
      }
      return originalImport.call(this, specifier);
    };
  }
  
  console.log('Extension protection initialized');
})();
