import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    // Normalize undefined value to empty string to avoid controlled -> uncontrolled warnings
    const textareaProps = {
      ...props,
      value: (props as any).value ?? ''
    };
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-input/20 glass px-4 py-3 text-base text-foreground ring-offset-background",
          "resize-y",
          "placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus:glass-glow focus:border-input/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm transition-all duration-200",
          // Mobile-specific enhancements
          "touch-manipulation", // Disable double-tap zoom
          "[font-size:16px]", // Prevent zoom on iOS
          "supports-[height:100dvh]:min-h-[80px]", // Dynamic viewport height support
          "scroll-py-2", // Scroll padding for better UX
          className
        )}
        ref={ref}
        {...textareaProps}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
