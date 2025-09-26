import React from 'react';
import { cn } from '@/lib/utils';

type GlassProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'soft' | 'strong';
};

export const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = 'soft', ...props }, ref) => {
    const base =
      'rounded-2xl border shadow-glass overflow-hidden';
    const variants: Record<string, string> = {
      soft: 'bg-white/6 backdrop-blur-md border-white/10',
      strong: 'bg-white/10 backdrop-blur-lg border-white/20',
    };

    return (
      <div
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }
);
Glass.displayName = 'Glass';

export default Glass;


