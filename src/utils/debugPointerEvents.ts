// Debug utility to identify elements with pointer-events: none
export const debugPointerEvents = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Find all elements with pointer-events: none
  const allElements = document.querySelectorAll('*');
  const blockedElements: Element[] = [];
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.pointerEvents === 'none') {
      // Check if this element should be interactive
      const isInteractive = element.matches('button, [role="button"], a, input, select, textarea, .cursor-pointer, .interactive');
      if (isInteractive) {
        blockedElements.push(element);
        console.warn('Interactive element has pointer-events: none', element);
        // Add visual indicator
        (element as HTMLElement).style.outline = '2px solid red';
        (element as HTMLElement).style.outlineOffset = '2px';
      }
    }
  });
  
  if (blockedElements.length > 0) {
    console.error(`Found ${blockedElements.length} interactive elements that are not clickable due to pointer-events: none`);
    return blockedElements;
  }
  
  console.log('No pointer-events issues found');
  return [];
};

// Fix pointer events for specific elements
export const fixPointerEvents = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    (element as HTMLElement).style.pointerEvents = 'auto';
  });
  console.log(`Fixed pointer events for ${elements.length} elements matching: ${selector}`);
};

// Auto-fix common issues
export const autoFixPointerEvents = () => {
  // Fix buttons and interactive elements
  fixPointerEvents('button, [role="button"], .cursor-pointer, .interactive');
  
  // Fix navigation items
  fixPointerEvents('nav button, nav a, .mobile-nav button');
  
  // Fix cards that should be clickable
  fixPointerEvents('.cursor-pointer');
  
  console.log('Auto-fixed common pointer-events issues');
};