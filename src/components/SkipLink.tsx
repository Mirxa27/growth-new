/**
 * Skip Link Component
 * Provides keyboard navigation skip link for accessibility
 */

import React from 'react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href = "#main-content", 
  children = "Skip to main content" 
}) => {
  return (
    <a 
      href={href}
      className="skip-link"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            (target as HTMLElement).focus();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }}
    >
      {children}
    </a>
  );
};

export default SkipLink;