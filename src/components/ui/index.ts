/**
 * Enhanced UI Components
 * Centralized exports for all shadcn/ui components with doodle enhancements
 */

// Core UI Components
export { Button, buttonVariants, type ButtonProps } from './button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Input } from './input';
export { Label } from './label';
export { Badge, badgeVariants, type BadgeProps } from './badge';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';
export { Textarea, type TextareaProps } from './textarea';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

// Newly migrated components
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Checkbox } from './checkbox';
export { Progress } from './progress';
export { Separator } from './separator';
export { Skeleton } from './skeleton';
export { Switch } from './switch';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// Re-export utility functions
export { cn } from '../../lib/utils';