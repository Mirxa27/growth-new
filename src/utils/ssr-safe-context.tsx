/**
 * SSR-Safe Context Creation Utility
 * Ensures React contexts work properly in production/SSR environments
 */

import React from 'react';

/**
 * Creates a React context that's safe for SSR environments
 */
export function createSSRSafeContext<T>(defaultValue: T): React.Context<T> {
  // Always create the context, but handle SSR safely
  try {
    return React.createContext<T>(defaultValue);
  } catch (error) {
    // Fallback for SSR or other environments where createContext might fail
    return {
      Provider: ({ children }: { children: React.ReactNode }) => children,
      Consumer: () => null,
      displayName: 'SSRSafeContext',
      $$typeof: Symbol.for('react.context'),
    } as React.Context<T>;
  }
}

/**
 * Hook factory for SSR-safe contexts
 */
export function createSSRSafeHook<T>(
  context: React.Context<T>, 
  contextName: string
) {
  return (): T => {
    // Skip context usage during SSR
    if (typeof window === 'undefined') {
      return {} as T;
    }

    const contextValue = React.useContext(context);
    if (contextValue === undefined) {
      throw new Error(`use${contextName} must be used within a ${contextName}Provider`);
    }
    return contextValue;
  };
}

/**
 * Wrapper component for client-side only rendering
 */
export function ClientOnly({ children, fallback = null }: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * HOC for client-side only components
 */
export function withClientOnly<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ClientOnlyComponent(props: P) {
    return (
      <ClientOnly fallback={<div className="animate-pulse bg-gray-200 rounded h-8" />}>
        <Component {...props} />
      </ClientOnly>
    );
  };
}

export default createSSRSafeContext;
