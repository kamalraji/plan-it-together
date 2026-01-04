import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type Align = "start" | "center" | "end";

type SelectContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string | undefined;
  setValue: (next: string, label?: string) => void;
  disabled?: boolean;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  labelByValue: Map<string, string>;
  registerLabel: (value: string, label: string) => void;
  selectedLabel: string | undefined;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(component: string) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error(`${component} must be used within <Select>`);
  return ctx;
}

function computePosition(triggerEl: HTMLElement, align: Align, sideOffset: number) {
  const r = triggerEl.getBoundingClientRect();
  const top = r.bottom + sideOffset;
  let left = r.left;

  if (align === "center") left = r.left + r.width / 2;
  if (align === "end") left = r.right;

  return { top, left, width: r.width };
}

/**
 * Crash-safe Select.
 * Keeps the common shadcn Select API but avoids Radix Popper runtime crashes.
 */
const Select: React.FC<{
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}> = ({ children, value: valueProp, defaultValue, onValueChange, disabled }) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;

  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const [labelByValue, setLabelByValue] = React.useState<Map<string, string>>(() => new Map());

  const registerLabel = React.useCallback((v: string, label: string) => {
    setLabelByValue((prev) => {
      if (prev.get(v) === label) return prev;
      const next = new Map(prev);
      next.set(v, label);
      return next;
    });
  }, []);

  const setValue = React.useCallback(
    (next: string, label?: string) => {
      if (label) registerLabel(next, label);
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [isControlled, onValueChange, registerLabel],
  );

  const selectedLabel = value ? labelByValue.get(value) : undefined;

  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      disabled,
      triggerRef,
      labelByValue,
      registerLabel,
      selectedLabel,
    }),
    [open, value, setValue, disabled, labelByValue, registerLabel, selectedLabel],
  );

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
};
Select.displayName = "Select";

const SelectGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn(className)} {...props} />
);
SelectGroup.displayName = "SelectGroup";

const SelectValue: React.FC<{ placeholder?: string; className?: string }> = ({ placeholder, className }) => {
  const { selectedLabel, value } = useSelectContext("SelectValue");

  return (
    <span className={cn("line-clamp-1", className)}>
      {selectedLabel ?? value ?? placeholder ?? ""}
    </span>
  );
};
SelectValue.displayName = "SelectValue";

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, onClick, disabled: disabledProp, ...props }, ref) => {
    const { open, setOpen, disabled, triggerRef } = useSelectContext("SelectTrigger");
    const isDisabled = disabled ?? disabledProp;

    const setRefs = (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    };

    return (
      <button
        type="button"
        ref={setRefs}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isDisabled}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented && !isDisabled) setOpen(!open);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: Align;
    sideOffset?: number;
    position?: "popper" | "item-aligned";
  }
>(({ className, children, align = "start", sideOffset = 4, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelectContext("SelectContent");
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const recalc = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;
    const next = computePosition(triggerEl, align, sideOffset);

    let left = next.left;
    const contentEl = contentRef.current;
    if (contentEl) {
      const w = contentEl.getBoundingClientRect().width;
      if (align === "center") left = next.left - w / 2;
      if (align === "end") left = next.left - w;

      const pad = 8;
      left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
    }

    setPos({ top: next.top, left, width: next.width });
  }, [align, sideOffset, triggerRef]);

  React.useLayoutEffect(() => {
    if (!open) return;
    recalc();
  }, [open, recalc]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (contentRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };

    const onScrollOrResize = () => recalc();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, recalc, setOpen, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={setRefs}
      role="listbox"
      style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, minWidth: pos?.width ?? 0, zIndex: 50 }}
      className={cn(
        "relative max-h-96 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>,
    document.body,
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, children, value, disabled, ...props }, ref) => {
  const { value: selected, setValue, registerLabel } = useSelectContext("SelectItem");

  const label = React.useMemo(() => {
    if (typeof children === "string") return children;
    if (typeof children === "number") return String(children);
    return value;
  }, [children, value]);

  React.useEffect(() => {
    registerLabel(value, label);
  }, [label, registerLabel, value]);

  const isSelected = selected === value;

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        setValue(value, label);
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected ? <Check className="h-4 w-4" /> : null}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";

// Compatibility shims
const SelectScrollUpButton: React.FC = () => null;
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton: React.FC = () => null;
SelectScrollDownButton.displayName = "SelectScrollDownButton";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
