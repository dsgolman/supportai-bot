import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "w-full h-2 bg-secondary rounded-full overflow-hidden",
  {
    variants: {
      size: {
        default: "h-2",
        sm: "h-1",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const progressBarVariants = cva(
  "h-full transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number
  max?: number
  variant?: VariantProps<typeof progressBarVariants>["variant"]
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, size, variant, ...props }, ref) => {
    const percentage = Math.min(Math.max(value, 0), max) / max * 100

    return (
      <div
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        {...props}
      >
        <div
          className={cn(progressBarVariants({ variant }))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }

export default function Component() {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 10))
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">Progress Examples</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Default Progress</h3>
        <Progress value={progress} className="w-full" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Small Progress (Success)</h3>
        <Progress value={progress} size="sm" variant="success" className="w-full" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Large Progress (Warning)</h3>
        <Progress value={progress} size="lg" variant="warning" className="w-full" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Custom Max Value (Danger)</h3>
        <Progress value={progress} max={200} variant="danger" className="w-full" />
      </div>
    </div>
  )
}