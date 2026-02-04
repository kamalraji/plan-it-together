import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  /**
   * Optional delay in ms before the animation starts after the element enters the viewport.
   */
  delayMs?: number;
}

export function AnimateOnScroll({ children, className, delayMs = 0 }: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delayMs > 0) {
              window.setTimeout(() => setInView(true), delayMs);
            } else {
              setInView(true);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.15,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [delayMs]);

  return (
    <div
      ref={ref}
      data-inview={inView ? "true" : "false"}
      className={cn(
        "opacity-0 translate-y-4 transition-all duration-700 ease-out will-change-transform",
        "data-[inview=true]:opacity-100 data-[inview=true]:translate-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
