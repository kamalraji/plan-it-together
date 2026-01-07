import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Align = "start" | "center" | "end";

type SelectContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  value?: string;
  setValue: (value: string) => void;
  onValueChange?: (value: string) => void;
  triggerRef: React.RefObject<HTMLElement>;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectCtx(component: string): SelectContextValue {
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

// Root
const Select: React.FC<{
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}> = ({ children, value, defaultValue, onValueChange }) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string>(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);

  const currentValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const ctx = React.useMemo<SelectContextValue>(
    () => ({ open, setOpen, value: currentValue, setValue, onValueChange, triggerRef }),
    [open, currentValue, setValue, onValueChange],
  );

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
};

// shadcn compatibility (no-op wrappers)
const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

const SelectValue: React.FC<{ placeholder?: string; className?: string }> = ({
  placeholder,
  className,
}) => {
  const { value } = useSelectCtx("SelectValue");
  const content = value && value.trim().length > 0 ? value : placeholder;
  return <span className={cn("truncate", className)}>{content}</span>;
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelectCtx("SelectTrigger");

  const setRefs = (node: HTMLButtonElement | null) => {
    (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  };

  return (
    <button
      type="button"
      ref={setRefs}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(!open);
      }}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <span className="ml-2 opacity-50">▾</span>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    align?: Align;
    sideOffset?: number;
    position?: "item-aligned" | "popper";
  }
> = ({ className, children, align = "start", sideOffset = 6, ...props }) => {
  const { open, setOpen, triggerRef } = useSelectCtx("SelectContent");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const recalc = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;
    const next = computePosition(triggerEl, align, sideOffset);
    setPos({ top: next.top, left: next.left });
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

  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="listbox"
      style={{ position: "fixed", top: pos.top, left: pos.left }}
      className={cn(
        "z-[9999] max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>,
    document.body,
  );
};
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, children, value, onClick, ...props }, ref) => {
  const { setOpen, setValue, value: current } = useSelectCtx("SelectItem");
  const selected = current === value;

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={selected}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        setValue(value);
        setOpen(false);
      }}
      className={cn(
        "relative flex w-full select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        selected && "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
SelectItem.displayName = "SelectItem";

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
  ),
);
SelectLabel.displayName = "SelectLabel";

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  ),
);
SelectSeparator.displayName = "SelectSeparator";

// Not supported in this simple implementation (kept for compatibility)
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

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
