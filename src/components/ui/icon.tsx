import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number | string;
  filled?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
  className?: string;
}

/**
 * Material Symbols Rounded Component
 * Official Google Material Design 3 icon system with variable weight & fill.
 */
export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      name,
      size = 20,
      filled = false,
      weight = 400,
      grade = 0,
      opticalSize = 24,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const sizePx = typeof size === "number" ? `${size}px` : size;

    const fontVariationSettings = `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`;

    return (
      <span
        ref={ref}
        className={cn(
          "material-symbols-rounded inline-flex items-center justify-center select-none leading-none shrink-0 transition-all duration-150",
          className
        )}
        style={{
          fontSize: sizePx,
          width: sizePx,
          height: sizePx,
          fontVariationSettings,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      >
        {name}
      </span>
    );
  }
);
Icon.displayName = "Icon";

export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "tonal" | "primary" | "surface" | "outline";
  children: React.ReactNode;
}

/**
 * Material 3 Icon Container
 * Wraps icons in standardized tonal surfaces with rounded geometry.
 */
export function IconContainer({
  size = "md",
  variant = "tonal",
  className,
  children,
  ...props
}: IconContainerProps) {
  const sizeClasses = {
    sm: "w-7 h-7 rounded-lg text-xs",
    md: "w-9 h-9 rounded-xl text-sm",
    lg: "w-11 h-11 rounded-2xl text-base",
    xl: "w-14 h-14 rounded-3xl text-xl",
  }[size];

  const variantClasses = {
    tonal: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
    primary: "bg-emerald-700 text-white shadow-2xs",
    surface: "bg-slate-100 text-slate-700 border border-slate-200/80",
    outline: "bg-white text-slate-700 border border-slate-300",
  }[variant];

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 transition-colors duration-150",
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
