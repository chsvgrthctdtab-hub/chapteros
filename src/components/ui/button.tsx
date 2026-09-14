import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-transparent font-semibold shadow-2xs",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent font-semibold shadow-2xs",
        outline:
          "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 font-semibold shadow-2xs",
        secondary:
          "bg-blue-50 text-blue-900 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/60 font-semibold",
        ghost:
          "text-slate-700 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-950 font-medium",
        link:
          "text-blue-600 underline-offset-4 hover:underline p-0 h-auto font-medium",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-transparent font-semibold shadow-2xs",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        xs: "h-7.5 px-2.5 text-xs font-semibold rounded-lg",
        sm: "h-8.5 px-3.5 text-xs font-semibold rounded-lg",
        lg: "h-11 px-6 text-base font-semibold",
        icon: "h-9 w-9 p-0 rounded-xl shrink-0",
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
