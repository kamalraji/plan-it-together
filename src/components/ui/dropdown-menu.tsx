import * as React from "react";
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from "@/components/ui/simple-dropdown";

// Simple, non-Radix dropdown-menu shim to avoid Popper scope crashes.

const DropdownMenu = SimpleDropdown;
const DropdownMenuTrigger = SimpleDropdownTrigger;
const DropdownMenuContent = SimpleDropdownContent as any;
const DropdownMenuItem = SimpleDropdownItem as any;

// Compatibility exports (not used in most of the app; provided as no-ops/wrappers)
const DropdownMenuGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const DropdownMenuPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const DropdownMenuSub: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const DropdownMenuRadioGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const DropdownMenuSubTrigger = DropdownMenuItem;
const DropdownMenuSubContent = DropdownMenuContent;
const DropdownMenuCheckboxItem = DropdownMenuItem;
const DropdownMenuRadioItem = DropdownMenuItem;
const DropdownMenuLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => <>{children}</>;
const DropdownMenuSeparator: React.FC = () => null;
const DropdownMenuShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ children }) => (
  <span style={{ marginLeft: "auto", opacity: 0.6, fontSize: 12 }}>{children}</span>
);

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
