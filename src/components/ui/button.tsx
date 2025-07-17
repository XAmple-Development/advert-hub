import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
        destructive: "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground hover:from-red-600 hover:to-destructive shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5",
        outline: "border-2 border-border hover:border-primary/50 bg-transparent hover:bg-primary/10 text-foreground hover:text-primary backdrop-blur-sm",
        secondary: "bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground hover:from-secondary-dark hover:to-secondary shadow-md hover:shadow-secondary/20 hover:-translate-y-0.5",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm hover:-translate-y-0.5",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto bg-transparent hover:text-primary-light",
        premium: "bg-gradient-to-r from-accent to-accent-light text-accent-foreground hover:from-accent-dark hover:to-accent shadow-xl hover:shadow-accent/30 hover:-translate-y-1 border border-accent/20",
        cosmic: "bg-gradient-to-r from-primary via-accent to-primary-light text-white hover:scale-[1.02] shadow-xl hover:shadow-primary/40 animate-gradient background-size-200",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm",
        sm: "h-9 px-4 py-2 text-xs rounded-md",
        lg: "h-13 px-8 py-3 text-base rounded-xl",
        xl: "h-16 px-12 py-4 text-lg rounded-2xl",
        icon: "h-11 w-11 rounded-lg",
        "icon-sm": "h-9 w-9 rounded-md",
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
