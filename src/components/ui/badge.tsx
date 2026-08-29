import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-1 whitespace-nowrap tracking-wide select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-700 text-white",
        secondary:
          "border-slate-200/80 bg-slate-100 text-slate-800",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        outline:
          "text-slate-700 border-slate-300 bg-white",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800",
        info:
          "border-blue-200 bg-blue-50 text-blue-800",
        purple:
          "border-purple-200 bg-purple-50 text-purple-800",
      },
      shape: {
        pill: "rounded-full",
        rounded: "rounded-lg",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "pill",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  className?: string;
  children?: React.ReactNode;
  showDot?: boolean;
  dotClassName?: string;
}

function Badge({
  className,
  variant,
  shape,
  showDot = false,
  dotClassName,
  children,
  ...props
}: BadgeProps) {
  const getDotColor = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-600";
      case "destructive":
        return "bg-rose-600";
      case "warning":
        return "bg-amber-600";
      case "info":
      case "purple":
        return "bg-blue-600";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className={cn(badgeVariants({ variant, shape }), className)} {...props}>
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClassName || getDotColor())}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
