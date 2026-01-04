import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "doodle"
  | "doodle-outline"
  | "sunny"
  | "teal"
  | "hero";

export type ButtonSize = "default" | "sm" | "lg" | "xl" | "icon";

export type ButtonVariantsProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const byVariant: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-doodle active:scale-95",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105",
  outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105",
  ghost: "hover:bg-muted hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  doodle:
    "bg-primary text-primary-foreground hover:scale-110 hover:rotate-1 hover:shadow-doodle active:scale-95 active:rotate-0 transition-all duration-200",
  "doodle-outline":
    "border-2 border-dashed border-primary bg-transparent text-primary hover:bg-primary/10 hover:scale-105 hover:border-solid",
  sunny: "bg-accent text-accent-foreground hover:scale-105 hover:shadow-soft hover:brightness-105",
  teal: "bg-secondary text-secondary-foreground hover:scale-105 hover:shadow-doodle",
  hero:
    "bg-primary text-primary-foreground px-8 py-6 text-lg hover:scale-105 hover:shadow-float hover:-translate-y-1 active:scale-100 active:translate-y-0",
};

const bySize: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-lg px-3",
  lg: "h-11 rounded-xl px-8",
  xl: "h-14 rounded-2xl px-10 text-base",
  icon: "h-10 w-10",
};

const buttonVariants = ({ variant = "default", size = "default", className }: ButtonVariantsProps = {}) =>
  cn(base, byVariant[variant], bySize[size], className);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantsProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={buttonVariants({ variant, size, className })} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
