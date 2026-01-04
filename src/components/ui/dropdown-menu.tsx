import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Align = "start" | "center" | "end";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(component: string) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error(`${component} must be used within <DropdownMenu>`);
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
 * Crash-safe DropdownMenu.
 *
 * Why: Some Radix UI + Popper combinations can crash in preview environments
 * (e.g. `createPopperScope is not a function`). This keeps the same shadcn-ish
 * API but uses a lightweight, dependency-free implementation.
 */
const DropdownMenu: React.FC<{
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

  const value = React.useMemo<DropdownMenuContextValue>(
    () => ({ open, setOpen, triggerRef }),
    [open, setOpen],
  );

  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
};
DropdownMenu.displayName = "DropdownMenu";

const DropdownMenuTrigger = React.forwardRef<HTMLElement, { asChild?: boolean } & React.HTMLAttributes<HTMLElement>>(
  ({ asChild, className, onClick, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDropdownMenuContext("DropdownMenuTrigger");

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
      className,
      ref: setRefs,
      "aria-haspopup": "menu" as const,
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
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number;
    align?: Align;
  }
>(({ className, sideOffset = 4, align = "start", ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdownMenuContext("DropdownMenuContent");
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

    // If align is center/end, interpret left as anchor point.
    let left = next.left;
    const contentEl = contentRef.current;
    if (contentEl) {
      const w = contentEl.getBoundingClientRect().width;
      if (align === "center") left = next.left - w / 2;
      if (align === "end") left = next.left - w;
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
      role="menu"
      style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0 }}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    />,
    document.body,
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }
>(({ className, inset, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenuContext("DropdownMenuItem");

  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
  ),
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  ),
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn(className)} {...props} />
);
DropdownMenuGroup.displayName = "DropdownMenuGroup";

// Compatibility shims (kept to avoid breaking imports; minimal behavior).
const DropdownMenuPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
DropdownMenuPortal.displayName = "DropdownMenuPortal";

const DropdownMenuSub: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
DropdownMenuSub.displayName = "DropdownMenuSub";

const DropdownMenuSubTrigger = DropdownMenuItem;
const DropdownMenuSubContent = DropdownMenuContent;

const DropdownMenuRadioGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup";

const DropdownMenuCheckboxItem = DropdownMenuItem as any;
const DropdownMenuRadioItem = DropdownMenuItem as any;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

