import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-1 whitespace-nowrap tracking-wide select-none",
  {
    variants: {
      variant: {
        default:
          "border-[#d4e4fa] bg-[#e6f0ff] text-signal-blue font-medium",
        secondary:
          "border-hairline bg-pebble text-ink-navy font-medium",
        destructive:
          "border-rose-200/80 bg-rose-50 text-rose-700 font-medium",
        outline:
          "text-ink-navy border-hairline bg-white font-medium",
        success:
          "border-emerald-200/80 bg-emerald-50 text-emerald-800 font-medium",
        warning:
          "border-amber-200/80 bg-amber-50 text-amber-800 font-medium",
        info:
          "border-[#d4e4fa] bg-[#e6f0ff] text-signal-blue font-medium",
        purple:
          "border-purple-200/80 bg-purple-50 text-purple-800 font-medium",
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
        return "bg-signal-blue";
      default:
        return "bg-mist-gray";
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
