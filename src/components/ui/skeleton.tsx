import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: "rounded" | "pill" | "square" | "circle";
}

function Skeleton({ className, shape = "rounded", ...props }: SkeletonProps) {
  const shapeClass =
    shape === "pill"
      ? "rounded-full"
      : shape === "circle"
      ? "rounded-full aspect-square"
      : shape === "square"
      ? "rounded-none"
      : "rounded-xl";

  return (
    <div
      className={cn("animate-pulse bg-slate-200/80", shapeClass, className)}
      {...props}
    />
  );
}

export { Skeleton };
