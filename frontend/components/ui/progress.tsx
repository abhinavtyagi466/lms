"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

function Progress({
  className,
  value,
  variant = "default",
  size = "default",
  showLabel = false,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}) {
  const progressValue = value || 0;

  const variantClasses = {
    default: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  const sizeClasses = {
    sm: "h-1.5",
    default: "h-2",
    lg: "h-3",
  };

  const bgClasses = {
    default: "bg-blue-100",
    success: "bg-green-100",
    warning: "bg-yellow-100",
    danger: "bg-red-100",
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progressValue)}%</span>
        </div>
      )}
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "relative w-full overflow-hidden rounded-full transition-all duration-300",
          bgClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out rounded-full shadow-sm",
            variantClasses[variant]
          )}
          style={{ transform: `translateX(-${100 - Math.min(progressValue, 100)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

export { Progress };
