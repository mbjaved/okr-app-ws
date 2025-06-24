// Accessible MultiSelect component for selecting multiple users (owners)
// Best_Practices.md: Accessibility, modularity, ARIA, keyboard support
// Design_prompts: Modern, minimal, clear selection UI
import * as React from "react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  avatarUrl?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  isMulti?: boolean;
  maxSelected?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  disabled = false,
  className = "",
  isMulti = true,
  maxSelected,
}) => {
  console.log('[MultiSelect DEBUG] props:', { options, value });
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listboxRef = React.useRef<HTMLUListElement>(null);
  const [focusIndex, setFocusIndex] = React.useState<number>(-1);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        setFocusIndex((prev) => Math.min(prev + 1, options.length - 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setFocusIndex((prev) => Math.max(prev - 1, 0));
        e.preventDefault();
      } else if (e.key === "Enter" && focusIndex >= 0) {
        const selected = options[focusIndex];
        if (selected) toggle(selected.value);
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, focusIndex, options]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        !listboxRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      // Enforce single-select or maxSelected
      if (!isMulti) {
        onChange([val]);
      } else if (maxSelected && value.length >= maxSelected) {
        // Do not add more than maxSelected
        return;
      } else {
        onChange([...value, val]);
      }
    }
  };


  const selectedOptions = options.filter((opt) => {
    const result = value.map(String).includes(String(opt.value));
    if (value.length > 0) {
      value.forEach(v => {
        console.log('[MultiSelect DEBUG] compare:', { optValue: String(opt.value), v: String(v), equal: String(opt.value) === String(v) });
      });
    }
    return result;
  });
  console.log('[MultiSelect DEBUG] selectedOptions:', selectedOptions);

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="block mb-1 font-medium text-sm">{label}</label>
      )}
      <button
        type="button"
        ref={buttonRef}
        className={cn(
          "w-full border rounded px-3 py-2 flex items-center justify-between gap-2 bg-white transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer focus:outline-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || placeholder}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className="flex flex-wrap gap-1 max-w-[80%]">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span key={opt.value} className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                {opt.avatarUrl && (
                  <img src={opt.avatarUrl} alt="" className="w-4 h-4 rounded-full mr-1" />
                )}
                {opt.label}
              </span>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <svg className={cn("w-4 h-4 ml-2 transition-transform", open && "rotate-180")}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.25 3.85a.75.75 0 01-1.02 0l-4.25-3.85a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <ul
          ref={listboxRef}
          className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto focus:outline-none"
          tabIndex={-1}
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value.includes(opt.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/20 text-sm",
                value.includes(opt.value) && "bg-primary/5 font-semibold",
                focusIndex === idx && "bg-primary/20"
              )}
              tabIndex={-1}
              onClick={() => toggle(opt.value)}
              onMouseEnter={() => setFocusIndex(idx)}
            >
              {opt.avatarUrl && (
                <img src={opt.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
              )}
              <span>{opt.label}</span>
              {value.includes(opt.value) && (
                <svg className="w-4 h-4 ml-auto text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 6.29a1 1 0 010 1.42l-7.004 7a1 1 0 01-1.42 0l-3.004-3a1 1 0 011.42-1.42l2.294 2.293 6.294-6.293a1 1 0 011.42 0z" clipRule="evenodd" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
