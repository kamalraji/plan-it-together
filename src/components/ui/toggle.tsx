import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";

import { cn } from "@/lib/utils";

type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";

type ToggleVariantsArgs = {
  variant?: ToggleVariant;
  size?: ToggleSize;
  className?: string;
};

const base =
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground";

const variantClasses: Record<ToggleVariant, string> = {
  default: "bg-transparent",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
};

const sizeClasses: Record<ToggleSize, string> = {
  default: "h-10 px-3",
  sm: "h-9 px-2.5",
  lg: "h-11 px-5",
};

const toggleVariants = ({ variant = "default", size = "default", className }: ToggleVariantsArgs = {}) =>
  cn(base, variantClasses[variant], sizeClasses[size], className);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & ToggleVariantsArgs
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={toggleVariants({ variant, size, className })} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
