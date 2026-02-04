# Design System Documentation

## Overview

This document outlines the design system, component patterns, and styling conventions used in this codebase.

---

## Color System

### Semantic Tokens

All colors are defined as HSL values in `src/index.css` and mapped to Tailwind classes in `tailwind.config.ts`.

**Never use raw color values in components.** Always use semantic tokens.

#### Core Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | White | Dark slate | Page backgrounds |
| `--foreground` | Near black | White | Primary text |
| `--card` | White | Dark card | Card backgrounds |
| `--card-foreground` | Near black | White | Card text |
| `--primary` | Brand color | Brand color | CTAs, links |
| `--primary-foreground` | White | White | Text on primary |
| `--secondary` | Light gray | Dark gray | Secondary actions |
| `--muted` | Light gray | Dark gray | Subdued elements |
| `--muted-foreground` | Gray | Light gray | Secondary text |
| `--accent` | Light accent | Dark accent | Highlights |
| `--destructive` | Red | Red | Errors, delete |
| `--border` | Light border | Dark border | Borders |
| `--ring` | Focus ring | Focus ring | Focus states |

#### Usage Examples

```tsx
// ✅ Correct - Using semantic tokens
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
  <Button className="bg-primary text-primary-foreground">Action</Button>
</div>

// ❌ Wrong - Using raw colors
<div className="bg-white text-black">
  <p className="text-gray-500">Secondary text</p>
  <Button className="bg-blue-500 text-white">Action</Button>
</div>
```

---

## Component Patterns

### Button Variants

```tsx
import { Button } from '@/components/ui/button';

// Primary action
<Button variant="default">Submit</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Outline style
<Button variant="outline">Options</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost/minimal
<Button variant="ghost">More</Button>

// Link style
<Button variant="link">Learn more</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Form Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Layout Components

### Page Layout

```tsx
// Standard page layout
<div className="container mx-auto py-6 space-y-6">
  <PageHeader title="Page Title" description="Description" />
  <main>{/* Content */}</main>
</div>
```

### Grid System

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Dashboard layout
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-8">{/* Main content */}</div>
  <div className="lg:col-span-4">{/* Sidebar */}</div>
</div>
```

---

## Spacing Scale

Use Tailwind's spacing scale consistently:

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Icon spacing |
| `gap-2` | 8px | Tight grouping |
| `gap-3` | 12px | Related items |
| `gap-4` | 16px | Standard spacing |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Large sections |

---

## Typography

### Headings

```tsx
<h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-2xl font-semibold tracking-tight">Section Title</h2>
<h3 className="text-xl font-semibold">Subsection</h3>
<h4 className="text-lg font-medium">Card Title</h4>
```

### Body Text

```tsx
<p className="text-base text-foreground">Primary text</p>
<p className="text-sm text-muted-foreground">Secondary text</p>
<span className="text-xs text-muted-foreground">Caption</span>
```

---

## Icons

Use Lucide React icons consistently:

```tsx
import { Plus, Trash2, Edit, ChevronRight } from 'lucide-react';

// Standard sizes
<Plus className="h-4 w-4" />  // Small/inline
<Plus className="h-5 w-5" />  // Default
<Plus className="h-6 w-6" />  // Large

// With button
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>
```

---

## Animation

Use Framer Motion for complex animations:

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

For simple transitions, use Tailwind:

```tsx
<div className="transition-all duration-200 hover:scale-105">
  Hover me
</div>
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:

```tsx
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Accessible Button
</button>
```

### Screen Reader Text

```tsx
import { VisuallyHidden } from '@/components/accessibility/VisuallyHidden';

<Button>
  <Icon />
  <VisuallyHidden>Delete item</VisuallyHidden>
</Button>
```

### Skip Links

Skip links are automatically included in the App layout.

---

## State Management

### Zustand Stores

```tsx
import { useWorkspaceStore, useUIStore } from '@/stores';

// Reading state
const currentWorkspace = useWorkspaceStore(state => state.currentWorkspaceId);

// Using actions
const { setActiveTab } = useWorkspaceStore();
setActiveTab('tasks');

// Using selectors for optimized re-renders
const selectedCount = useSelectedTaskCount();
```

### React Query

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Queries
const { data, isLoading } = useQuery({
  queryKey: ['tasks', workspaceId],
  queryFn: () => fetchTasks(workspaceId),
});

// Mutations with optimistic updates
const { mutate } = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    await queryClient.cancelQueries(['tasks']);
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], old => /* optimistic update */);
    return { previous };
  },
  onError: (err, newTask, context) => {
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

---

## File Structure

```
src/
├── components/
│   ├── ui/           # Shadcn/Radix primitives
│   ├── workspace/    # Workspace-specific components
│   ├── events/       # Event-related components
│   └── shared/       # Shared components
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
├── lib/              # Utilities and services
├── types/            # TypeScript types
└── integrations/     # External integrations
```

---

## Component Naming

- **PascalCase** for components: `TaskCard.tsx`
- **camelCase** for hooks: `useTaskData.ts`
- **kebab-case** for utilities: `date-utils.ts`
- **UPPER_SNAKE** for constants: `API_ENDPOINTS.ts`

---

## Best Practices

1. **Keep components small** - Under 200 lines, extract subcomponents
2. **Use TypeScript strictly** - No `any` types, define interfaces
3. **Memoize appropriately** - Use `useMemo` and `useCallback` for expensive operations
4. **Handle loading states** - Always show skeletons or spinners
5. **Handle error states** - Show user-friendly error messages
6. **Test critical paths** - Use Vitest for unit tests
