import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Prevent zoom on iOS when focusing inputs
    const inputMode = type === 'email' ? 'email' : 
                     type === 'tel' ? 'tel' : 
                     type === 'number' ? 'numeric' : 
                     type === 'url' ? 'url' : 
                     undefined;
    
    return (
      <input
        type={type}
        inputMode={inputMode}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input/20 glass px-4 py-2 text-base text-foreground ring-offset-background min-h-[44px]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus:glass-glow focus:border-input/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm transition-all duration-200",
          // Mobile-specific enhancements
          "touch-manipulation", // Disable double-tap zoom
          "[font-size:16px]", // Prevent zoom on iOS
          "supports-[height:100dvh]:min-h-[44px]", // Dynamic viewport height support
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
