# Unified Directory Structure for Design System Merger

## Overview
This document outlines the unified directory structure created for merging the doodle-hub-delight design system into the frontend application.

## New Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/ (existing - will be enhanced with shadcn components)
│   │   ├── doodles/
│   │   │   ├── original/ (original doodle characters)
│   │   │   ├── ligne-claire/ (clean line style characters)
│   │   │   ├── hand-drawn/ (sketch style characters)
│   │   │   └── index.ts (main doodle exports)
│   │   ├── enhanced/ (enhanced UI components with doodle variants)
│   │   └── [existing component directories...]
│   ├── styles/
│   │   ├── globals.css (merged global styles)
│   │   ├── animations.css (doodle animation system)
│   │   └── tokens.css (design tokens as CSS custom properties)
│   └── lib/
│       ├── design-system/
│       │   ├── types.ts (TypeScript interfaces)
│       │   ├── character-registry.ts (character management)
│       │   └── index.ts (design system exports)
│       └── [existing lib files...]
```

## Directory Purposes

### `/components/doodles/`
- **original/**: Contains the 13 existing doodle characters from doodle-hub-delight
- **ligne-claire/**: Clean line style variants with consistent line weights
- **hand-drawn/**: Sketch style variants with intentional imperfections
- **index.ts**: Main export file for all doodle characters

### `/components/enhanced/`
- Enhanced shadcn/ui components with doodle variants
- New button styles (hero, doodle, doodle-outline, sunny, teal)
- Other enhanced UI components from doodle-hub-delight

### `/components/ui/`
- Existing shadcn/ui components (will be preserved)
- Will be enhanced with additional components from doodle-hub-delight

### `/styles/`
- **globals.css**: Merged global styles from both projects
- **animations.css**: Custom keyframes and animation utilities
- **tokens.css**: Design tokens as CSS custom properties

### `/lib/design-system/`
- **types.ts**: TypeScript interfaces for characters and design tokens
- **character-registry.ts**: Centralized character management system
- **index.ts**: Main design system exports

## Implementation Status

✅ **Completed:**
- Directory structure created
- Index files with placeholders
- TypeScript interfaces defined
- Character registry system scaffolded

🔄 **Next Steps:**
- Dependency resolution and package.json merge
- Configuration system integration
- Design token migration
- Component migration

## File Organization Principles

1. **Separation of Concerns**: Each artistic style has its own directory
2. **Centralized Management**: Character registry for unified access
3. **Type Safety**: Comprehensive TypeScript interfaces
4. **Scalability**: Structure supports future artistic styles
5. **Backward Compatibility**: Existing components preserved

## Integration Points

- All doodle components accessible through `/components/doodles/`
- Design system utilities available through `/lib/design-system/`
- Styling system organized in `/styles/` directory
- Enhanced UI components in `/components/enhanced/`

This structure follows the design document specifications and supports the three artistic styles: Original Doodles, Ligne Claire, and Hand-Drawn Sketch.