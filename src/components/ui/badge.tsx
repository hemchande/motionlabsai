import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-cyan-600 to-cyan-700 text-black shadow-lg shadow-cyan-600/25 hover:shadow-cyan-600/40",
        secondary:
          "border-transparent bg-gradient-to-r from-slate-800 to-slate-900 text-slate-200 shadow-md shadow-slate-800/20 hover:shadow-slate-800/30",
        destructive:
          "border-transparent bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 hover:shadow-red-600/40",
        outline:
          "border-slate-700 bg-slate-900/50 text-slate-300 backdrop-blur-sm hover:bg-slate-800/50 hover:text-cyan-400 hover:border-cyan-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
