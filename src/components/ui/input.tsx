import * as React from "react";
import { Search, X } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-sm text-[#1e293b] transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#94a3b8] hover:border-[#b8cce0] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2e89f7]/25 focus-visible:border-[#2e89f7] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f8fafd]",
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
  ({ className, value, onChange, onClear, placeholder = "Tìm kiếm...", ...props }, ref) => {
    const hasValue = Boolean(value);

    return (
      <div className="relative flex items-center w-full">
        <Search
          size={16}
          className="absolute left-3.5 text-[#94a3b8] pointer-events-none shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "flex h-9 w-full rounded-full border border-[#e2e8f0] bg-[#f8fafd] pl-9 pr-9 py-2 text-sm text-[#1e293b] transition-all duration-150 placeholder:text-[#94a3b8] hover:border-[#b8cce0] hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2e89f7]/25 focus-visible:border-[#2e89f7] focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-0.5 rounded-full text-[#94a3b8] hover:text-[#1e293b] hover:bg-[#f0f4f9] transition-colors cursor-pointer"
            aria-label="Clear search input"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { Input, SearchInput };
