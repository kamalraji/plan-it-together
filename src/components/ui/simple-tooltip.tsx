import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleTooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const TooltipContext = React.createContext<{ delayDuration: number }>({ delayDuration: 300 });

export const SimpleTooltipProvider: React.FC<SimpleTooltipProviderProps> = ({
  children,
  delayDuration = 300,
}) => {
  return (
    <TooltipContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
};

interface SimpleTooltipProps {
  children: React.ReactNode;
}

interface TooltipState {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  delayDuration: number;
  triggerRef: React.RefObject<HTMLElement>;
}

const TooltipStateContext = React.createContext<TooltipState | null>(null);

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const { delayDuration } = React.useContext(TooltipContext);
  const triggerRef = React.useRef<HTMLElement>(null);

  return (
    <TooltipStateContext.Provider value={{ open, setOpen, delayDuration, triggerRef }}>
      {children}
    </TooltipStateContext.Provider>
  );
};

interface SimpleTooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const SimpleTooltipTrigger = React.forwardRef<HTMLElement, SimpleTooltipTriggerProps>(
  ({ children, asChild }, ref) => {
    const ctx = React.useContext(TooltipStateContext);
    if (!ctx) throw new Error("SimpleTooltipTrigger must be used within SimpleTooltip");

    const { setOpen, delayDuration, triggerRef } = ctx;
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = React.useCallback(() => {
      timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
    }, [delayDuration, setOpen]);

    const handleMouseLeave = React.useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setOpen(false);
    }, [setOpen]);

    const handleFocus = React.useCallback(() => {
      setOpen(true);
    }, [setOpen]);

    const handleBlur = React.useCallback(() => {
      setOpen(false);
    }, [setOpen]);

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLElement | null) => {
          (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        },
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
      });
    }

    return (
      <span
        ref={(node) => {
          (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </span>
    );
  }
);
SimpleTooltipTrigger.displayName = "SimpleTooltipTrigger";

interface SimpleTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  hidden?: boolean;
}

export const SimpleTooltipContent: React.FC<SimpleTooltipContentProps> = ({
  children,
  className,
  side = "top",
  align = "center",
  sideOffset = 4,
  hidden = false,
  ...props
}) => {
  const ctx = React.useContext(TooltipStateContext);
  if (!ctx) throw new Error("SimpleTooltipContent must be used within SimpleTooltip");

  const { open, triggerRef } = ctx;
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPos(null);
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentEl = contentRef.current;
    
    let top = 0;
    let left = 0;

    const contentWidth = contentEl?.offsetWidth || 100;
    const contentHeight = contentEl?.offsetHeight || 30;

    switch (side) {
      case "top":
        top = triggerRect.top - contentHeight - sideOffset;
        left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + sideOffset;
        left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - contentHeight / 2;
        left = triggerRect.left - contentWidth - sideOffset;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - contentHeight / 2;
        left = triggerRect.right + sideOffset;
        break;
    }

    // Adjust for align
    if (side === "top" || side === "bottom") {
      if (align === "start") left = triggerRect.left;
      else if (align === "end") left = triggerRect.right - contentWidth;
    } else {
      if (align === "start") top = triggerRect.top;
      else if (align === "end") top = triggerRect.bottom - contentHeight;
    }

    // Keep in viewport
    left = Math.max(8, Math.min(left, window.innerWidth - contentWidth - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - contentHeight - 8));

    setPos({ top, left });
  }, [open, side, align, sideOffset, triggerRef]);

  if (!open || hidden) return null;

  return (
    <div
      ref={contentRef}
      role="tooltip"
      className={cn(
        "fixed z-[9999] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
      {...props}
    >
      {children}
    </div>
  );
};
SimpleTooltipContent.displayName = "SimpleTooltipContent";
