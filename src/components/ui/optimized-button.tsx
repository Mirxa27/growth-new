/**
 * Optimized Button Component
 * Fixes INP issues by deferring heavy operations and using React.memo
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "glass text-foreground hover:bg-white/10",
        primary: "text-primary hover:bg-primary/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 min-h-[44px] rounded-lg px-4 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  deferredClick?: boolean
}

const OptimizedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    deferredClick = false,
    onClick,
    disabled,
    children,
    ...props 
  }, ref) => {
    const [isPending, setIsPending] = React.useState(false)
    const Comp = asChild ? Slot : "button"
    
    // Use React 18's startTransition for non-urgent updates
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading || isPending) {
        e.preventDefault()
        return
      }

      if (deferredClick && onClick) {
        // Defer heavy operations to avoid blocking the UI
        setIsPending(true)
        
        // Use requestIdleCallback for non-critical operations
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            React.startTransition(() => {
              onClick(e)
              setIsPending(false)
            })
          }, { timeout: 100 })
        } else {
          // Fallback to setTimeout for browsers without requestIdleCallback
          setTimeout(() => {
            React.startTransition(() => {
              onClick(e)
              setIsPending(false)
            })
          }, 0)
        }
      } else if (onClick) {
        // For critical operations, execute immediately but wrap in startTransition
        React.startTransition(() => {
          onClick(e)
        })
      }
    }, [onClick, disabled, loading, isPending, deferredClick])

    const isDisabled = disabled || loading || isPending

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        aria-busy={loading || isPending}
        aria-disabled={isDisabled}
        {...props}
      >
        {(loading || isPending) ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)

OptimizedButton.displayName = "OptimizedButton"

// Memoized loading spinner to prevent re-renders
const LoadingSpinner = React.memo(({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
))

LoadingSpinner.displayName = "LoadingSpinner"

// Export memoized version for performance
export const Button = React.memo(OptimizedButton)

// Also export non-memoized version for cases where memo isn't needed
export { OptimizedButton as ButtonBase, buttonVariants }