import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:border-transparent aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 transition-all duration-200 overflow-hidden shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25",
        secondary:
          "border-transparent bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-gray-500/25",
        destructive:
          "border-transparent bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-red-500/25",
        outline:
          "border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
        success:
          "border-transparent bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-500/25",
        warning:
          "border-transparent bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-yellow-500/25",
        info:
          "border-transparent bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-blue-500/25",
        purple:
          "border-transparent bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-purple-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
