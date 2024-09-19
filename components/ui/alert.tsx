import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert } from "lucide-react";

import { cn } from "@/utils/tailwind";

const alertVariants = cva("text-left border rounded-lg p-4", {
  variants: {
    intent: {
      info: "border-blue-200 text-blue-600 bg-blue-50",
      danger: "border-red-200 text-red-600 bg-red-50",
    },
  },
  defaultVariants: {
    intent: "info",
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, intent, title, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ intent }), className)}
        {...props}
      >
        {title && (
          <AlertTitle>
            {intent === "danger" && <CircleAlert className="h-4 w-4" />}
            {title}
          </AlertTitle>
        )}
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "text-base font-semibold flex items-center gap-2 mb-2",
      className
    )}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";