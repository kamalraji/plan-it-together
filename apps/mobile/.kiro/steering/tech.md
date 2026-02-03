# Technology Stack

## Framework & Language

- **Flutter**: Cross-platform UI framework (SDK 3.6.0+)
- **Dart**: Programming language (3.10.7+)
- **Material 3**: Design system with light/dark theme support

## Key Dependencies

### Core
- `supabase_flutter`: Backend-as-a-Service for auth, database, and real-time features
- `go_router`: Declarative routing with auth guards and custom transitions
- `provider`: State management for theme and services
- `google_fonts`: Inter font family for typography

### Features
- `qr_flutter`: QR code generation for user profiles
- `image_picker` & `file_picker`: Media selection
- `agora_rtc_engine`: Real-time audio/video for Spaces feature
- `permission_handler`: Runtime permissions management
- `uuid`: Unique identifier generation

## Architecture Patterns

### Project Structure
- **Feature-based organization**: Code grouped by feature (auth, chat, impact, profile)
- **Service layer**: Business logic separated into service classes (e.g., `EventService`, `ChatService`)
- **Model layer**: Data classes with JSON serialization in `lib/models/`
- **Widget library**: Reusable styled components in `lib/widgets/`

### Navigation
- Shell routes with persistent bottom navigation bar
- Custom page transitions (fade-slide, hero animations)
- Auth-based redirects using `go_router` refresh stream

### Theming
- Centralized theme configuration in `lib/theme.dart`
- Context extensions for easy access (`context.colors`, `context.textStyles`)
- Compact spacing system (`AppSpacing`) and border radius (`AppRadius`)
- Brand colors: Purple primary (#8B5CF6), Cyan accent (#06B6D4)

### Backend Integration
- Generic `SupabaseService` class for CRUD operations
- Feature-specific services extend base patterns
- Real-time subscriptions for chat and notifications
- Row-level security policies defined in SQL files

## Common Commands

### Development
```bash
# Install dependencies
flutter pub get

# Run on web (development)
flutter run -d web-server --web-port=8080

# Run on Android/iOS
flutter run -d <device_id>

# Check for issues
flutter analyze
flutter doctor
```

### Building
```bash
# Web production build
flutter build web

# Android APK
flutter build apk

# iOS build (macOS only)
flutter build ios

# Linux desktop
flutter build linux
```

### Testing & Diagnostics
```bash
# Run tests
flutter test

# Check diagnostics
flutter doctor

# Clean build artifacts
flutter clean
```

## Environment Setup

- Supabase credentials configured in `lib/supabase/supabase_config.dart`
- Database schema in `lib/supabase/*.sql` and `supabase/migrations/`
- Platform-specific configs in `android/`, `ios/`, `web/` folders
