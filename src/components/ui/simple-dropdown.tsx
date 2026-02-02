import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Align = "start" | "center" | "end";

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext(component: string): DropdownContextValue {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error(`${component} must be used within <SimpleDropdown>`);
  return ctx;
}

export const SimpleDropdown: React.FC<{ children: React.ReactNode; defaultOpen?: boolean }> = ({
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement>(null);

  const value = useMemo<DropdownContextValue>(
    () => ({ open, setOpen, triggerRef }),
    [open],
  );

  return <DropdownContext.Provider value={value}>{children}</DropdownContext.Provider>;
};

export const SimpleDropdownTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdownContext("SimpleDropdownTrigger");

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      (triggerRef as any).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref, triggerRef],
  );

  return (
    <button
      type="button"
      ref={setRefs}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(!open);
      }}
      className={className}
      {...props}
    />
  );
});
SimpleDropdownTrigger.displayName = "SimpleDropdownTrigger";

function computePosition(triggerEl: HTMLElement, align: Align, sideOffset: number) {
  const r = triggerEl.getBoundingClientRect();
  const top = r.bottom + sideOffset;
  let left = r.left;

  if (align === "center") left = r.left + r.width / 2;
  if (align === "end") left = r.right;

  return { top, left, width: r.width };
}

export const SimpleDropdownContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: Align;
  sideOffset?: number;
}> = ({ children, className, align = "start", sideOffset = 6 }) => {
  const { open, setOpen, triggerRef } = useDropdownContext("SimpleDropdownContent");
  const contentRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const recalc = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;
    const next = computePosition(triggerEl, align, sideOffset);
    setPos({ top: next.top, left: next.left });
  }, [align, sideOffset, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    recalc();
  }, [open, recalc]);

  useEffect(() => {
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
      role="menu"
      style={{ position: "fixed", top: pos.top, left: pos.left }}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
};

export const SimpleDropdownItem: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }
> = ({ className, inset, onClick, ...props }) => {
  const { setOpen } = useDropdownContext("SimpleDropdownItem");

  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
      className={cn(
        "relative flex w-full select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
};
