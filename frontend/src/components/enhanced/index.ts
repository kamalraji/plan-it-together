/**
 * Enhanced UI Components
 * Centralized exports for enhanced shadcn/ui components with doodle variants
 * These components include additional styling and animations from the doodle design system
 */

// Re-export enhanced UI components
export { Button, buttonVariants } from '../ui/button';
export type { ButtonProps } from '../ui/button';

export { Input } from '../ui/input';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../ui/card';
export { Badge, badgeVariants } from '../ui/badge';
export type { BadgeProps } from '../ui/badge';

// Form components
export { Label } from '../ui/label';
export { Textarea } from '../ui/textarea';
export { Checkbox } from '../ui/checkbox';
export { RadioGroup, RadioGroupItem } from '../ui/radio-group';
export { Switch } from '../ui/switch';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Layout components
export { Separator } from '../ui/separator';
export { Skeleton } from '../ui/skeleton';
export { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// Navigation components
export { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from '../ui/navigation-menu';

// Overlay components
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
export { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
export { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Feedback components
export { Alert, AlertDescription, AlertTitle } from '../ui/alert';
export { toast, useToast } from '../ui/use-toast';
export { Toaster } from '../ui/toaster';
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '../ui/toast';

// Data display components
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';
export { Progress } from '../ui/progress';

// Interactive components
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
export { Toggle, toggleVariants } from '../ui/toggle';
export type { ToggleProps } from '../ui/toggle';

// Advanced components
export { Calendar } from '../ui/calendar';
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '../ui/command';
export { Slider } from '../ui/slider';

// Theme components
export { ThemeProvider, useThemeContext, ThemeToggle, useTheme } from '../theme';
export type { Theme } from '../theme';

/**
 * Enhanced component variants and utilities
 */
export const enhancedVariants = {
  button: {
    doodle: 'doodle',
    doodleOutline: 'doodle-outline',
    sunny: 'sunny',
    teal: 'teal',
    hero: 'hero',
  },
  animation: {
    float: 'animate-float',
    bounceGentle: 'animate-bounce-gentle',
    wave: 'animate-wave',
    wiggle: 'animate-wiggle',
    popIn: 'animate-pop-in',
    slideUp: 'animate-slide-up',
  },
  shadow: {
    soft: 'shadow-soft',
    doodle: 'shadow-doodle',
    float: 'shadow-float',
  },
} as const;

/**
 * Enhanced component presets for common use cases
 */
export const enhancedPresets = {
  heroButton: {
    variant: 'hero' as const,
    size: 'xl' as const,
    className: 'animate-float',
  },
  doodleCard: {
    className: 'shadow-doodle hover:shadow-float transition-all duration-300 hover:scale-105',
  },
  animatedInput: {
    className: 'input-animated hover:animate-pulse-glow focus:animate-pulse-glow',
  },
} as const;