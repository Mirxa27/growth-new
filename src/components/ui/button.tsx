
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-spring duration-micro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 micro-bounce [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-105 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary/60 text-primary bg-background/80 backdrop-blur-sm hover:bg-primary/20 hover:border-primary hover:shadow-glow hover:scale-105 active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-glow",
        ghost: "text-foreground hover:bg-accent/20 hover:text-accent-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
        glass: "glass glass-glow text-foreground border border-white/20 hover:shadow-glow hover:scale-105 active:scale-95",
        hero: "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-ambient hover:scale-105 active:scale-95 font-semibold",
      },
      size: {
        default: "h-11 px-6 py-2 min-h-[44px]",
        sm: "h-11 min-h-[44px] rounded-lg px-4 text-sm",
        lg: "h-14 min-h-[44px] rounded-xl px-8 text-lg font-semibold",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
