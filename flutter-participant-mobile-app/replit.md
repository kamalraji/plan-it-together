# Thittam1Hub - Flutter Web Application

## Overview
Thittam1Hub is a Flutter-based social networking and event management application. It allows users to connect, discover events, and build their professional network while tracking their impact within the community.

## Tech Stack
- **Frontend**: Flutter Web (Dart)
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **State Management**: Provider
- **Routing**: go_router

## Project Structure
```
lib/
├── main.dart           # Application entry point
├── nav.dart            # Navigation configuration
├── theme.dart          # Theme definitions
├── auth/               # Authentication related code
├── database/           # Database utilities
├── models/             # Data models
├── pages/              # UI pages/screens
├── providers/          # State management providers
├── repositories/       # Data repositories
├── services/           # Business logic services
├── supabase/           # Supabase configuration and services
├── utils/              # Utility functions
└── widgets/            # Reusable UI components
```

## Development
The application runs on port 5000 in development mode using the Flutter web server.

### Running the App
The "Flutter Web" workflow starts the development server:
```bash
flutter run -d web-server --web-port=5000 --web-hostname=0.0.0.0
```

### Dependencies
Key packages used:
- supabase_flutter: Backend services
- go_router: Navigation
- provider: State management
- hive/hive_flutter: Local caching
- drift: SQLite database for offline support
- cryptography: End-to-end encryption

## Deployment
The app is configured for static deployment:
- Build command: `flutter build web --release`
- Output directory: `build/web`

## External Services
- **Supabase**: Database and authentication (configured in `lib/supabase/supabase_config.dart`)
- **Agora**: Video calling capabilities (requires API key configuration)

## Recent Changes
- January 2026: Initial Replit environment setup
- Updated package versions for Dart SDK 3.8.0 compatibility
- Fixed local_auth and workmanager API compatibility issues
