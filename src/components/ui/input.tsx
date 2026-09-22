import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9.5 w-full rounded-lg border border-hairline bg-white px-3.5 py-2 text-sm text-ink-navy shadow-sm transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-mist-gray hover:border-[#b8cce0] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-signal-blue/25 focus-visible:border-signal-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-pebble",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface SearchInputProps extends InputProps {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search...", ...props }, ref) => {
    const hasValue = Boolean(value);

    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 h-4 w-4 text-mist-gray pointer-events-none shrink-0" />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "flex h-9.5 w-full rounded-lg border border-hairline bg-white pl-10 pr-9 py-2 text-sm text-ink-navy shadow-sm transition-all duration-150 placeholder:text-mist-gray hover:border-[#b8cce0] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-signal-blue/25 focus-visible:border-signal-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-pebble",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-md text-mist-gray hover:text-ink-navy hover:bg-pebble transition-colors cursor-pointer"
            aria-label="Clear search input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { Input, SearchInput };

