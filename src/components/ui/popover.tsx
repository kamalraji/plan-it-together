import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Align = "start" | "center" | "end";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error(`${component} must be used within <Popover>`);
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

/** Crash-safe Popover (Radix-free) */
const Popover: React.FC<{
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({ children, open: openProp, defaultOpen = false, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? !!openProp : uncontrolledOpen;

  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const value = React.useMemo<PopoverContextValue>(() => ({ open, setOpen, triggerRef }), [open, setOpen]);

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
};
Popover.displayName = "Popover";

const PopoverTrigger = React.forwardRef<HTMLElement, { asChild?: boolean } & React.HTMLAttributes<HTMLElement>>(
  ({ asChild, onClick, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = usePopoverContext("PopoverTrigger");

    const setRefs = (node: HTMLElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    };

    const triggerProps = {
      ...props,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(!open);
      },
      ref: setRefs,
      "aria-haspopup": "dialog" as const,
      "aria-expanded": open,
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, triggerProps);
    }

    return (
      <button type="button" {...(triggerProps as any)}>
        {children}
      </button>
    );
  },
);
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: Align; sideOffset?: number }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const { open, setOpen, triggerRef } = usePopoverContext("PopoverContent");
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

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
    }

    // Keep in viewport
    if (contentEl) {
      const r = contentEl.getBoundingClientRect();
      const pad = 8;
      left = Math.max(pad, Math.min(left, window.innerWidth - r.width - pad));
    }

    setPos({ top: next.top, left });
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
      role="dialog"
      style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, zIndex: 50 }}
      className={cn(
        "w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    />,
    document.body,
  );
});
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };

