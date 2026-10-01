import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold leading-none transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2e89f7]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#2e89f7] text-white hover:bg-[#1a73e8] active:bg-[#1557b0] border border-transparent font-semibold shadow-sm",
        dark:
          "bg-[#0b3558] text-white hover:bg-[#082640] active:bg-[#061e32] border border-transparent font-semibold shadow-sm",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent font-semibold shadow-sm",
        outline:
          "border border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f0f4f9] active:bg-[#e8f0fe] font-semibold shadow-xs",
        secondary:
          "bg-[#f0f4f9] text-[#1e293b] hover:bg-[#e8f0fe] active:bg-[#dbeafe] border border-[#e2e8f0] font-semibold",
        ghost:
          "text-[#1e293b] hover:bg-[#f0f4f9] hover:text-[#0b3558] active:bg-[#e8f0fe] font-medium",
        link:
          "text-[#2e89f7] underline-offset-4 hover:underline p-0 h-auto font-medium",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-transparent font-semibold shadow-sm",
      },
      size: {
        default: "h-9 px-4 text-sm rounded-xl",
        xs:      "h-7 px-2.5 text-xs font-semibold rounded-lg",
        sm:      "h-8 px-3 text-xs font-semibold rounded-xl",
        lg:      "h-10 px-5 text-sm font-semibold rounded-xl",
        icon:    "h-9 w-9 p-0 rounded-full shrink-0",
        "icon-sm":  "h-8 w-8 p-0 rounded-full shrink-0",
        "icon-xs":  "h-7 w-7 p-0 rounded-full shrink-0",
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
