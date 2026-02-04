# Project Structure

## Root Directory

```
├── lib/                    # Main application code
├── assets/                 # Static resources (images, icons)
├── android/                # Android platform configuration
├── ios/                    # iOS platform configuration
├── web/                    # Web platform configuration
├── supabase/              # Supabase migrations and config
├── pubspec.yaml           # Flutter dependencies
└── BUILD_INSTRUCTIONS.md  # Setup and build guide
```

## lib/ Organization

### Core Files
- `main.dart`: App entry point, Supabase initialization, theme setup
- `nav.dart`: GoRouter configuration, route definitions, navigation shell
- `theme.dart`: Theme data, color schemes, spacing constants, text styles

### Feature Modules

#### `/auth`
Authentication logic and managers
- `auth_manager.dart`: Abstract auth interface
- `supabase_auth_manager.dart`: Supabase auth implementation

#### `/pages`
UI screens organized by feature area

- `/auth`: Sign-in and sign-up pages
- `/chat`: Chat list, message threads, new message composer
- `/impact`: Impact Hub features (circles, spaces, profiles, pulse, spark, vibe)
- `/profile`: User profile, edit profile, QR code, settings
- `discover_page.dart`: Event discovery and browsing
- `event_detail_page.dart`: Event details with hero animations

#### `/models`
Data models with JSON serialization
- `models.dart`: Core models (Event, TicketTier, Registration, UserProfile, Message, etc.)
- `circle.dart`: Circle/group discussion models
- `space.dart`: Audio room models
- `impact_profile.dart`: Impact Hub profile models
- `notification_item.dart`: Notification data structures
- `connection_request_item.dart`: Connection request models

#### `/services`
Business logic and API interactions
- `event_service.dart`: Event CRUD, search, filtering
- `chat_service.dart`: Messaging and channels
- `profile_service.dart`: User profile management
- `notification_service.dart`: Notification handling
- `registration_service.dart`: Event registration logic
- `theme_service.dart`: Theme persistence and switching

#### `/supabase`
Backend integration layer
- `supabase_config.dart`: Client initialization, generic CRUD service
- `*_service.dart`: Feature-specific Supabase services (circle, space, spark, impact, gamification)
- `*.sql`: Database schema and RLS policies
- `database.types.ts`: TypeScript type definitions

#### `/widgets`
Reusable UI components with consistent styling
- `styled_*.dart`: Themed components (button, card, chip, text field, avatar, badge, etc.)
- `event_card.dart`: Event display card
- `*_actions_sheet.dart`: Bottom sheet actions
- `glassmorphism_bottom_sheet.dart`: Glassmorphic bottom sheet

#### `/utils`
Helper utilities
- `animations.dart`: Animation utilities
- `hero_animations.dart`: Hero animation configurations

## Naming Conventions

### Files
- Snake case: `event_detail_page.dart`, `chat_service.dart`
- Descriptive suffixes: `*_page.dart`, `*_service.dart`, `*_sheet.dart`

### Classes
- Pascal case: `EventDetailPage`, `ChatService`, `StyledButton`
- Suffix patterns: `*Page`, `*Service`, `Styled*`

### Variables & Functions
- Camel case: `getAllEvents()`, `eventId`, `isLoading`
- Private members: `_controller`, `_buildPageTransition()`

### Constants
- Camel case for classes: `AppColors`, `AppSpacing`, `AppRoutes`
- Upper case for enums: `EventMode.ONLINE`, `EventStatus.PUBLISHED`

## Code Organization Patterns

### Services
- Async methods returning `Future<T>` or `Future<List<T>>`
- Error handling with try-catch, returning empty lists or null on failure
- Debug prints with emoji prefixes (✅ success, ❌ error)

### Models
- Immutable data classes with `const` constructors
- `fromJson()` factory constructors with defensive parsing
- `toJson()` methods for serialization
- `copyWith()` methods for immutability

### Widgets
- Stateless widgets preferred when possible
- Theme access via `Theme.of(context).colorScheme`
- Context extensions for convenience (`context.colors`, `context.textStyles`)
- Compact, modern design with minimal spacing

### Pages
- Scaffold-based layouts
- AppBar with transparent background
- Bottom navigation via shell route
- Custom page transitions for navigation polish
