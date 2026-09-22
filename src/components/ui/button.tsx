import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-signal-blue/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-signal-blue text-white hover:bg-[#005be0] active:bg-[#004eba] border border-transparent font-semibold shadow-sm",
        dark:
          "bg-ink-navy text-white hover:bg-[#082640] active:bg-[#061e32] border border-transparent font-semibold shadow-sm",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent font-semibold shadow-sm",
        outline:
          "border border-hairline bg-white text-ink-navy hover:bg-pebble hover:text-ink-navy active:bg-[#e4ebf4] font-semibold shadow-sm",
        secondary:
          "bg-pebble text-ink-navy hover:bg-[#e4ebf4] active:bg-[#d8e2ee] border border-hairline/60 font-semibold",
        ghost:
          "text-ink-navy hover:bg-pebble hover:text-ink-navy active:bg-[#e4ebf4] font-medium",
        link:
          "text-signal-blue underline-offset-4 hover:underline p-0 h-auto font-medium",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-transparent font-semibold shadow-sm",
      },
      size: {
        default: "h-9.5 px-4 py-2 text-sm rounded-lg",
        xs: "h-7.5 px-2.5 text-xs font-semibold rounded-lg",
        sm: "h-8.5 px-3 text-xs font-semibold rounded-lg",
        lg: "h-11 px-6 text-base font-semibold rounded-lg",
        icon: "h-9 w-9 p-0 rounded-lg shrink-0",
        "icon-sm": "h-8 w-8 p-0 rounded-lg shrink-0",
        "icon-xs": "h-7 w-7 p-0 rounded-lg shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps extends ButtonProps {
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "icon", ...props }, ref) => {
    return <Button ref={ref} size={size} className={className} {...props} />;
  }
);
IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };
