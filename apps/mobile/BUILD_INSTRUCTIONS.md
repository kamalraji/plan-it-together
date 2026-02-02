# Build Instructions for Thittam1hub Flutter Project

This document provides detailed instructions on how to build and run the Thittam1hub Flutter application.

## Prerequisites

1. **Flutter SDK**: Version 3.38.7 or later
   - Download from: https://flutter.dev/docs/get-started/install
   - Add Flutter to your PATH
   - Verify installation: `flutter --version`

2. **Dart SDK**: Included with Flutter (version 3.10.7 or later)

3. **Development Environment**:
   - For Android: Android Studio with Android SDK
   - For iOS: macOS with Xcode
   - For Web: Any modern browser
   - For Linux Desktop: ninja-build and GTK development libraries

## Project Setup

1. **Clone or navigate to the project directory**:
   ```
   cd /path/to/remix-of-w-remix-1-of-project-ro-83
   ```

2. **Install Flutter dependencies**:
   ```
   flutter pub get
   ```

   This will download all required packages including:
   - supabase_flutter
   - go_router
   - provider
   - And other dependencies listed in pubspec.yaml

## Building the Application

### Web Build (Recommended for Development)

1. **Build for web**:
   ```
   flutter build web
   ```

2. **Serve the built application**:
   ```
   cd build/web
   python3 -m http.server 8000
   ```

3. **Open in browser**:
   - Navigate to http://localhost:8000
   - Or use your preferred browser

### Android Build

1. **Ensure Android SDK is installed**:
   ```
   flutter doctor --android-licenses
   ```

2. **Build APK**:
   ```
   flutter build apk
   ```

3. **Install on device**:
   ```
   flutter install
   ```

### iOS Build (macOS only)

1. **Ensure Xcode is installed and configured**

2. **Build for iOS**:
   ```
   flutter build ios
   ```

3. **Run on simulator**:
   ```
   flutter run
   ```

### Linux Desktop Build

1. **Install system dependencies**:
   ```
   sudo apt install ninja-build libgtk-3-dev
   ```

2. **Build for Linux**:
   ```
   flutter build linux
   ```

3. **Run the application**:
   ```
   flutter run -d linux
   ```

## Running in Development Mode

For faster development with hot reload:

1. **Run on web**:
   ```
   flutter run -d web-server --web-port=8080
   ```

2. **Run on Android emulator/device**:
   ```
   flutter run -d <device_id>
   ```

## Troubleshooting

### Common Issues

1. **Flutter SDK version mismatch**:
   - Ensure Flutter is upgraded: `flutter upgrade`
   - Check Dart version compatibility in pubspec.yaml

2. **Missing dependencies**:
   - Run `flutter pub get` again
   - Clear cache: `flutter pub cache repair`

3. **Build errors**:
   - Check for syntax errors: `flutter analyze`
   - Run tests: `flutter test`

4. **Platform-specific issues**:
   - Run `flutter doctor` to diagnose problems
   - Ensure all required SDKs are installed

### Known Fixes Applied

- Added missing `getUserCircles()` method in `CircleService` to return joined circle IDs as `Set<String>`

## Project Structure

- `lib/`: Main application code
- `android/`: Android-specific configuration
- `ios/`: iOS-specific configuration
- `web/`: Web-specific configuration
- `assets/`: Images and other assets
- `supabase/`: Database configuration and policies

## Environment Variables

Ensure you have configured Supabase credentials in `lib/supabase/supabase_config.dart` before running the application.

## Additional Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Supabase Flutter Documentation](https://supabase.com/docs/guides/getting-started/quickstarts/flutter)
- [Go Router Documentation](https://gorouter.dev/)