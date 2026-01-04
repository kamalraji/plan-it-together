import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetCtx() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within <Sheet />");
  return ctx;
}

type SheetProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

const Sheet: React.FC<SheetProps> = ({ open: openProp, defaultOpen = false, onOpenChange, children }) => {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolled;

  const setOpen = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setUncontrolled(next);
    },
    [onOpenChange, openProp],
  );

  // Lock body scroll while open (simple, no focus trapping)
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
};

type SheetTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(({ onClick, ...props }, ref) => {
  const { open, setOpen } = useSheetCtx();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(!open);
      }}
      {...props}
    />
  );
});
SheetTrigger.displayName = "SheetTrigger";

type SheetCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(({ onClick, ...props }, ref) => {
  const { setOpen } = useSheetCtx();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
      {...props}
    />
  );
});
SheetClose.displayName = "SheetClose";

const SheetPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};
SheetPortal.displayName = "SheetPortal";

type SheetOverlayProps = React.HTMLAttributes<HTMLDivElement>;
const SheetOverlay = React.forwardRef<HTMLDivElement, SheetOverlayProps>(({ className, ...props }, ref) => {
  const { setOpen } = useSheetCtx();
  return (
    <div
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      onMouseDown={() => setOpen(false)}
      {...props}
    />
  );
});
SheetOverlay.displayName = "SheetOverlay";

type SheetSide = "top" | "bottom" | "left" | "right";

type SheetContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: SheetSide;
};

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => {
    const { open, setOpen } = useSheetCtx();

    React.useEffect(() => {
      if (!open) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, setOpen]);

    if (!open) return null;

    const sideClasses: Record<SheetSide, string> = {
      top: "inset-x-0 top-0 border-b",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    };

    const motionClasses: Record<SheetSide, string> = {
      top: "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
      bottom: "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
      left: "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
      right: "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
    };

    return (
      <SheetPortal>
        <SheetOverlay data-state={open ? "open" : "closed"} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          data-state={open ? "open" : "closed"}
          className={cn(
            "fixed z-50 gap-4 bg-background p-6 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:duration-300 data-[state=open]:duration-500",
            sideClasses[side],
            motionClasses[side],
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h2 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />,
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />,
);
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};

