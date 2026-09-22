import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked = false,
      indeterminate = false,
      onCheckedChange,
      onChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center cursor-pointer select-none align-middle",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "h-4.5 w-4.5 rounded border border-hairline bg-white transition-colors duration-150 flex items-center justify-center text-white peer-focus-visible:outline-hidden peer-focus-visible:ring-2 peer-focus-visible:ring-signal-blue/30 peer-focus-visible:ring-offset-1 peer-checked:bg-signal-blue peer-checked:border-signal-blue hover:border-slate-gray peer-disabled:bg-pebble peer-disabled:border-hairline",
            (checked || indeterminate) && "bg-signal-blue border-signal-blue",
            className
          )}
        >
          {indeterminate ? (
            <Minus className="h-3 w-3 stroke-[3]" />
          ) : checked ? (
            <Check className="h-3 w-3 stroke-[3]" />
          ) : null}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
