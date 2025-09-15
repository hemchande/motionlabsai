import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-cyan-600 to-cyan-700 text-black shadow-lg shadow-cyan-600/25 hover:from-cyan-700 hover:to-cyan-800 hover:shadow-cyan-600/40 active:scale-95 font-bold",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-red-800 hover:shadow-red-600/40 active:scale-95",
        outline:
          "border-2 border-slate-700 bg-slate-900/50 backdrop-blur-sm text-slate-200 hover:bg-slate-800/50 hover:border-cyan-500 hover:text-cyan-400 active:scale-95",
        secondary:
          "bg-gradient-to-r from-slate-800 to-slate-900 text-slate-200 shadow-lg shadow-slate-800/25 hover:from-slate-700 hover:to-slate-800 hover:shadow-slate-700/40 active:scale-95",
        ghost: "text-slate-300 hover:bg-slate-800/50 hover:text-cyan-400 active:scale-95",
        link: "text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10 rounded-lg",
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
