import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 border border-transparent font-semibold",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent font-semibold",
        outline:
          "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 font-semibold",
        secondary:
          "bg-emerald-100 text-emerald-950 hover:bg-emerald-200 active:bg-emerald-300/80 border border-transparent font-semibold",
        ghost:
          "text-slate-700 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-950 font-medium",
        link:
          "text-emerald-700 underline-offset-4 hover:underline p-0 h-auto font-medium",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-transparent font-semibold",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        xs: "h-7.5 px-3 text-xs font-semibold",
        sm: "h-9 px-4 text-xs font-semibold",
        lg: "h-12 px-7 text-base font-semibold",
        icon: "h-10 w-10 p-0 rounded-full shrink-0",
        "icon-sm": "h-9 w-9 p-0 rounded-full shrink-0",
        "icon-xs": "h-7.5 w-7.5 p-0 rounded-full shrink-0",
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
