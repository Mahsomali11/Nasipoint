import React, { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: (SearchableSelectOption | string)[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  allowClear?: boolean;
  clearLabel?: string;
  id?: string;
  name?: string;
  align?: "start" | "center" | "end";
  autoFocusSearch?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Type to search...",
  emptyMessage = "No matching options found",
  disabled = false,
  required = false,
  className,
  triggerClassName,
  contentClassName,
  allowClear = false,
  clearLabel,
  id,
  name,
  align = "start",
  autoFocusSearch = true,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options into SearchableSelectOption objects
  const normalizedOptions = useMemo<SearchableSelectOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === "") return null;
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q);
      const subLabelMatch = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const badgeMatch = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
      return labelMatch || subLabelMatch || badgeMatch;
    });
  }, [normalizedOptions, search]);

  // Focus search input when popover opens & reset search
  useEffect(() => {
    if (open) {
      setSearch("");
      setHighlightedIndex(0);
      if (autoFocusSearch) {
        // Small delay to ensure popover DOM transition has mounted
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 60);
        return () => clearTimeout(timer);
      }
    }
  }, [open, autoFocusSearch]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLButtonElement>("[data-select-item]");
      const target = items[highlightedIndex];
      if (target) {
        target.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Keyboard navigation within the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    const totalItems = filteredOptions.length + (clearLabel ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, totalItems - 1)));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (clearLabel && highlightedIndex === 0) {
        handleSelect("");
      } else {
        const itemIndex = clearLabel ? highlightedIndex - 1 : highlightedIndex;
        const item = filteredOptions[itemIndex];
        if (item && !item.disabled) {
          handleSelect(item.value);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Hidden input for native HTML form validity */}
      {required && (
        <input
          tabIndex={-1}
          required={required}
          value={value || ""}
          onChange={() => {}}
          className="sr-only"
          aria-hidden="true"
        />
      )}
      {name && <input type="hidden" name={name} value={value || ""} />}

      <PopoverPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-disabled={disabled}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full px-3.5 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground",
              "flex items-center justify-between text-left transition-all shadow-sm outline-none",
              "hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none bg-muted/30",
              open && "border-primary ring-2 ring-primary/20",
              triggerClassName
            )}
          >
            <span className="truncate flex-1 pr-2">
              {selectedOption ? (
                <span className="font-medium text-foreground">
                  {selectedOption.label}
                  {selectedOption.subLabel && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                      {selectedOption.subLabel}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>

            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {allowClear && value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear selection"
                  className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={13} />
                </button>
              )}
              <ChevronsUpDown
                size={14}
                className={cn("transition-transform duration-200 opacity-60", open && "rotate-180 opacity-100 text-primary")}
              />
            </div>
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align={align}
            sideOffset={5}
            className={cn(
              "z-[9999] w-[var(--radix-popover-trigger-width)] min-w-[240px] max-w-[95vw]",
              "rounded-2xl border border-border bg-popover/95 backdrop-blur-md text-popover-foreground shadow-2xl p-2",
              "animate-in fade-in-0 zoom-in-95 duration-150 outline-none select-none",
              contentClassName
            )}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Header */}
            <div className="relative flex items-center px-2 pb-2 border-b border-border/50">
              <Search size={14} className="absolute left-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 h-9 rounded-xl bg-muted/50 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-4 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Options List */}
            <div
              ref={listRef}
              className="mt-1.5 max-h-60 overflow-y-auto space-y-0.5 pr-0.5 text-sm custom-scrollbar"
            >
              {/* Optional Clear / Reset to Default option */}
              {clearLabel && (
                <button
                  type="button"
                  data-select-item="true"
                  onClick={() => handleSelect("")}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all",
                    !value
                      ? "bg-primary/10 text-primary font-bold"
                      : highlightedIndex === 0
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="italic">{clearLabel}</span>
                  {!value && <Check size={14} className="text-primary shrink-0" />}
                </button>
              )}

              {filteredOptions.length === 0 ? (
                <div className="py-6 px-3 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
                  <Search size={18} className="opacity-40 mb-1" />
                  <p className="font-medium">{emptyMessage}</p>
                  {search && (
                    <p className="text-[11px] opacity-70">
                      No results matching "{search}"
                    </p>
                  )}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const effectiveIndex = clearLabel ? idx + 1 : idx;
                  const isHighlighted = highlightedIndex === effectiveIndex;

                  return (
                    <button
                      key={`${opt.value}-${idx}`}
                      type="button"
                      data-select-item="true"
                      disabled={opt.disabled}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(effectiveIndex)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group",
                        opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none",
                        isSelected
                          ? "bg-primary/15 text-primary font-bold shadow-2xs"
                          : isHighlighted
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted/70"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate text-xs sm:text-sm font-medium">
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subLabel && (
                          <p className="text-[11px] text-muted-foreground font-normal truncate mt-0.5">
                            {opt.subLabel}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <Check size={14} className="text-primary shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
};
