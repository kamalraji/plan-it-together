# Styled Component Catalog

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Design System:** Elite Modern

This catalog documents all standardized UI components in the Flutter participant app. Use these components to maintain consistency across the codebase.

---

## Table of Contents

1. [Core Components](#core-components)
   - [StyledCard](#styledcard)
   - [StyledButton](#styledbutton)
   - [StyledAvatar](#styledavatar)
   - [StyledBadge](#styledbadge)
   - [StyledChip](#styledchip)
2. [Form Components](#form-components)
   - [StyledTextField](#styledtextfield)
   - [StyledSearchField](#styledsearchfield)
3. [Feedback Components](#feedback-components)
   - [StyledEmptyState](#styledemptystate)
   - [StyledLoadingIndicator](#styledloadingindicator)
4. [Layout Components](#layout-components)
   - [StyledListTile](#styledlisttile)
   - [StyledBottomSheet](#styledbottomsheet)
5. [Settings Components](#settings-components)
   - [SettingsTabScaffold](#settingstabscaffold)
   - [SettingsSection](#settingssection)
   - [SettingsToggle](#settingstoggle)
   - [SettingsAction](#settingsaction)
6. [Migration Patterns](#migration-patterns)
7. [Best Practices](#best-practices)

---

## Core Components

### StyledCard

A themed card container with optional tap animation and entrance effects.

**Import:**
```dart
import 'package:your_app/widgets/styled_widgets.dart';
```

**Basic Usage:**
```dart
StyledCard(
  child: Text('Card content'),
  padding: const EdgeInsets.all(AppSpacing.md),
)
```

**With Tap Animation:**
```dart
StyledCard(
  enableTapAnimation: true,
  onTap: () => print('Card tapped'),
  child: ListTile(
    title: Text('Tapable Card'),
    subtitle: Text('With scale animation'),
  ),
)
```

**With Entrance Animation:**
```dart
StyledCard(
  enableEntrance: true,
  entranceDelay: Duration(milliseconds: 100),
  child: Text('Animated entrance'),
)
```

**Gradient Variant:**
```dart
StyledGradientCard(
  gradientColors: [AppColors.primary, AppColors.accent],
  child: Text('Gradient background'),
)
```

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `child` | `Widget` | required | Card content |
| `padding` | `EdgeInsets?` | `null` | Content padding |
| `margin` | `EdgeInsets?` | `null` | Outer margin |
| `onTap` | `VoidCallback?` | `null` | Tap handler |
| `borderRadius` | `double?` | `null` | Corner radius |
| `backgroundColor` | `Color?` | `null` | Background color |
| `elevation` | `double?` | `null` | Shadow elevation |
| `enableTapAnimation` | `bool` | `true` | Enable scale on tap |
| `enableEntrance` | `bool` | `false` | Enable fade-slide entrance |
| `entranceDelay` | `Duration` | `Duration.zero` | Entrance delay |

---

### StyledButton

A themed button with press animation and loading state support.

**Variants:**
- `primary` - Main action (filled)
- `secondary` - Secondary action
- `outline` - Outlined style
- `danger` - Destructive action
- `ghost` - Minimal style

**Sizes:**
- `small` - Compact buttons
- `medium` - Default size
- `large` - Prominent buttons

**Basic Usage:**
```dart
StyledButton(
  label: 'Submit',
  onPressed: () => handleSubmit(),
)
```

**With Icon:**
```dart
StyledButton(
  label: 'Add Item',
  icon: Icons.add,
  onPressed: () => addItem(),
)
```

**Loading State:**
```dart
StyledButton(
  label: 'Saving...',
  isLoading: _isSaving,
  onPressed: _isSaving ? null : () => save(),
)
```

**Danger Variant:**
```dart
StyledButton(
  label: 'Delete',
  variant: StyledButtonVariant.danger,
  icon: Icons.delete,
  onPressed: () => confirmDelete(),
)
```

**Compact Mode:**
```dart
StyledButton(
  label: 'Action',
  compact: true,
  size: ButtonSize.small,
  onPressed: () {},
)
```

**Icon Button:**
```dart
StyledIconButton(
  icon: Icons.settings,
  onPressed: () => openSettings(),
  tooltip: 'Settings',
)
```

---

### StyledAvatar

A themed avatar with online status indicator support.

**Sizes:**
- `xs` - 24px (inline use)
- `sm` - 32px (list items)
- `md` - 40px (default)
- `lg` - 56px (profiles)
- `xl` - 80px (large profiles)

**With Image:**
```dart
StyledAvatar(
  imageUrl: user.avatarUrl,
  avatarSize: StyledAvatarSize.md,
)
```

**With Initials:**
```dart
StyledAvatar(
  name: 'John Doe',
  avatarSize: StyledAvatarSize.lg,
)
```

**With Online Status:**
```dart
StyledAvatar(
  imageUrl: user.avatarUrl,
  isOnline: user.isOnline,
  avatarSize: StyledAvatarSize.md,
)
```

**With Tap Handler:**
```dart
StyledAvatar(
  imageUrl: user.avatarUrl,
  onTap: () => navigateToProfile(user.id),
)
```

---

### StyledBadge

A themed label badge with optional icon and dot indicator.

**Variants:**
- `primary`, `secondary`, `success`, `warning`, `error`, `info`, `outline`

**Sizes:**
- `sm`, `md`, `lg`

**Basic Usage:**
```dart
StyledBadge(
  label: 'New',
  variant: StyledBadgeVariant.success,
)
```

**With Icon:**
```dart
StyledBadge(
  label: 'Premium',
  icon: Icons.star,
  variant: StyledBadgeVariant.primary,
)
```

**With Dot Indicator:**
```dart
StyledBadge(
  label: 'Live',
  showDot: true,
  variant: StyledBadgeVariant.error,
)
```

**Notification Badge:**
```dart
StyledNotificationBadge(
  count: 5,
  child: Icon(Icons.notifications),
)
```

---

### StyledChip

A themed chip for filters and tags with selection animation.

**Variants:**
- `primary`, `secondary`, `outline`, `ghost`

**Sizes:**
- `small`, `medium`, `large`

**Filter Chip:**
```dart
StyledChip(
  label: 'Active',
  selected: _isActive,
  onTap: () => toggleActive(),
)
```

**With Icon:**
```dart
StyledChip(
  label: 'Location',
  icon: Icons.location_on,
  selected: true,
)
```

**With Delete:**
```dart
StyledChip(
  label: 'Tag Name',
  onDelete: () => removeTag(),
)
```

**Filter Chip Helper:**
```dart
StyledFilterChip(
  label: 'Category',
  selected: _selectedCategory == 'Category',
  onSelected: (selected) => selectCategory('Category'),
)
```

**Tag Chip:**
```dart
StyledTagChip(
  label: 'Flutter',
  color: Colors.blue,
  icon: Icons.flutter_dash,
)
```

---

## Form Components

### StyledTextField

A themed text input field with consistent styling.

**Basic Usage:**
```dart
StyledTextField(
  controller: _nameController,
  label: 'Full Name',
  hint: 'Enter your name',
)
```

**With Validation:**
```dart
StyledTextField(
  controller: _emailController,
  label: 'Email',
  keyboardType: TextInputType.emailAddress,
  validator: (value) {
    if (value?.isEmpty ?? true) return 'Email required';
    if (!value!.contains('@')) return 'Invalid email';
    return null;
  },
)
```

**With Icons:**
```dart
StyledTextField(
  controller: _passwordController,
  label: 'Password',
  obscureText: true,
  prefixIcon: Icons.lock,
  suffixIcon: Icons.visibility,
)
```

**Multiline:**
```dart
StyledTextField(
  controller: _bioController,
  label: 'Bio',
  maxLines: 4,
  maxLength: 200,
)
```

---

### StyledSearchField

A themed search input with debounce, focus animation, and clear button.

**Sizes:**
- `compact` - 36px height
- `normal` - 44px height (default)
- `large` - 52px height

**Basic Usage:**
```dart
StyledSearchField(
  controller: _searchController,
  hintText: 'Search...',
  onChanged: (query) => search(query),
)
```

**With Debounce:**
```dart
StyledSearchField(
  controller: _searchController,
  hintText: 'Search users...',
  debounceDuration: Duration(milliseconds: 300),
  onChanged: (query) => searchUsers(query),
  onClear: () => clearSearch(),
)
```

**With Loading State:**
```dart
StyledSearchField(
  controller: _searchController,
  isLoading: _isSearching,
  onChanged: (query) => search(query),
)
```

**Compact Size:**
```dart
StyledSearchField(
  size: SearchFieldSize.compact,
  hintText: 'Filter...',
  onChanged: (query) => filter(query),
)
```

---

## Feedback Components

### StyledEmptyState

A themed empty state with icon, title, subtitle, and optional action.

**Factory Constructors:**

```dart
// No search results
StyledEmptyState.noResults(
  query: searchQuery,
  onAction: () => clearSearch(),
  actionLabel: 'Clear Search',
)

// No data available
StyledEmptyState.noData(
  title: 'No Events',
  message: 'You haven\'t registered for any events yet.',
  icon: Icons.event,
  onRefresh: () => refresh(),
)

// No network connection
StyledEmptyState.noConnection(
  onRetry: () => retryConnection(),
)

// Permission denied
StyledEmptyState.noPermission(
  message: 'You don\'t have access to this content.',
)

// Error state
StyledEmptyState.error(
  message: 'Something went wrong',
  onRetry: () => retry(),
)
```

**Custom Usage:**
```dart
StyledEmptyState(
  icon: Icons.inbox,
  title: 'No Messages',
  subtitle: 'Your inbox is empty',
  compact: true,
  action: StyledButton(
    label: 'Compose',
    onPressed: () => compose(),
  ),
)
```

**Enhanced Empty State (with animations):**
```dart
EnhancedEmptyState(
  icon: Icons.explore,
  title: 'Discover Events',
  subtitle: 'Find exciting events near you',
  primaryButtonLabel: 'Browse Events',
  onPrimaryAction: () => browseEvents(),
  secondaryButtonLabel: 'Create Event',
  onSecondaryAction: () => createEvent(),
  animate: true,
)
```

---

### StyledLoadingIndicator

A themed loading indicator with message support.

**Sizes:**
- `small` - 16px (inline)
- `medium` - 24px (default)
- `large` - 40px (page-level)

**Styles:**
- `circular` - Spinning circle (default)
- `linear` - Progress bar

**Basic Usage:**
```dart
StyledLoadingIndicator()
```

**With Message:**
```dart
StyledLoadingIndicator(
  message: 'Loading data...',
  size: LoadingSize.large,
)
```

**Convenience Constructors:**
```dart
// Small inline
StyledLoadingIndicator.small()

// For buttons
StyledLoadingIndicator.button()

// Inline with text
StyledLoadingIndicator.inline()

// Full page
StyledLoadingIndicator.page(message: 'Loading...')

// Overlay style
StyledLoadingIndicator.overlay(message: 'Saving...')
```

**Loading Overlay Wrapper:**
```dart
LoadingOverlay(
  isLoading: _isLoading,
  message: 'Processing...',
  child: YourContent(),
)
```

---

## Layout Components

### StyledListTile

A themed list tile for menu items and settings rows.

**Basic Usage:**
```dart
StyledListTile(
  leadingIcon: Icons.person,
  title: 'Profile',
  onTap: () => navigateToProfile(),
)
```

**With Subtitle:**
```dart
StyledListTile(
  leadingIcon: Icons.notifications,
  title: 'Notifications',
  subtitle: 'Manage your notification preferences',
  onTap: () => openNotifications(),
)
```

**With Trailing Widget:**
```dart
StyledListTile(
  leadingIcon: Icons.dark_mode,
  title: 'Dark Mode',
  trailing: Switch(value: isDark, onChanged: toggleDark),
  showChevron: false,
)
```

**Compact Mode:**
```dart
StyledListTile(
  title: 'Settings',
  compact: true,
  onTap: () => openSettings(),
)
```

**List Section:**
```dart
StyledListSection(
  header: 'Account',
  tiles: [
    StyledListTile(title: 'Profile', ...),
    StyledListTile(title: 'Security', ...),
    StyledListTile(title: 'Privacy', ...),
  ],
)
```

---

### StyledBottomSheet

A themed bottom sheet with consistent styling.

**Show Bottom Sheet:**
```dart
showStyledBottomSheet(
  context: context,
  title: 'Options',
  child: Column(
    children: [
      ListTile(title: Text('Option 1')),
      ListTile(title: Text('Option 2')),
    ],
  ),
)
```

**With Actions:**
```dart
showStyledBottomSheet(
  context: context,
  title: 'Confirm Action',
  child: Text('Are you sure?'),
  actions: [
    StyledButton(label: 'Cancel', variant: StyledButtonVariant.outline),
    StyledButton(label: 'Confirm'),
  ],
)
```

**Action List:**
```dart
StyledBottomSheetActionList(
  actions: [
    StyledBottomSheetAction(
      icon: Icons.edit,
      label: 'Edit',
      onTap: () => edit(),
    ),
    StyledBottomSheetAction(
      icon: Icons.delete,
      label: 'Delete',
      isDestructive: true,
      onTap: () => delete(),
    ),
  ],
)
```

---

## Settings Components

### SettingsTabScaffold

A standardized scaffold for settings tab pages with loading/error states.

**Basic Usage:**
```dart
class _MySettingsTabState extends State<MySettingsTab> {
  bool _isLoading = true;
  String? _error;

  @override
  Widget build(BuildContext context) {
    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      children: [
        SettingsSection(
          title: 'General',
          children: [
            SettingsToggle(...),
            SettingsAction(...),
          ],
        ),
      ],
    );
  }
}
```

**With Header/Footer:**
```dart
SettingsTabScaffold(
  isLoading: false,
  header: ProfileCard(user: currentUser),
  footer: Text('Version 1.0.0'),
  children: [...],
)
```

---

### SettingsSection

An expandable settings section with header and content.

**Basic Usage:**
```dart
SettingsSection(
  title: 'Notifications',
  icon: Icons.notifications,
  iconColor: AppColors.blue500,
  children: [
    SettingsToggle(...),
    SettingsToggle(...),
  ],
)
```

**With Help Text:**
```dart
SettingsSection(
  title: 'Security',
  helpText: 'Configure your account security settings',
  children: [...],
)
```

---

### SettingsToggle

A settings row with a toggle switch.

**Basic Usage:**
```dart
SettingsToggle(
  title: 'Push Notifications',
  subtitle: 'Receive push notifications',
  value: _pushEnabled,
  onChanged: (value) => setState(() => _pushEnabled = value),
  icon: Icons.notifications,
)
```

**Disabled State:**
```dart
SettingsToggle(
  title: 'Premium Feature',
  value: false,
  enabled: isPremiumUser,
  onChanged: null,
)
```

---

### SettingsAction

A tappable settings row for navigation or actions.

**Basic Usage:**
```dart
SettingsAction(
  title: 'Privacy Policy',
  icon: Icons.privacy_tip,
  onTap: () => openPrivacyPolicy(),
)
```

**Destructive Action:**
```dart
SettingsAction(
  title: 'Delete Account',
  icon: Icons.delete_forever,
  isDestructive: true,
  onTap: () => confirmDeleteAccount(),
)
```

---

## Migration Patterns

### Migrating from Container to StyledCard

**Before:**
```dart
Container(
  padding: EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: theme.cardColor,
    borderRadius: BorderRadius.circular(12),
    boxShadow: [BoxShadow(...)],
  ),
  child: content,
)
```

**After:**
```dart
StyledCard(
  padding: EdgeInsets.all(AppSpacing.md),
  child: content,
)
```

### Migrating from ElevatedButton to StyledButton

**Before:**
```dart
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: theme.primaryColor,
    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
  ),
  onPressed: onPressed,
  child: Text('Submit'),
)
```

**After:**
```dart
StyledButton(
  label: 'Submit',
  onPressed: onPressed,
)
```

### Migrating from CircleAvatar to StyledAvatar

**Before:**
```dart
CircleAvatar(
  radius: 20,
  backgroundImage: NetworkImage(url),
  child: url == null ? Text(initials) : null,
)
```

**After:**
```dart
StyledAvatar(
  imageUrl: url,
  name: name,
  avatarSize: StyledAvatarSize.md,
)
```

### Migrating Settings Tabs

**Before:**
```dart
class _MyTabState extends State<MyTab> {
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(child: Text(_error!));
    }
    return ListView(
      children: [...],
    );
  }
}
```

**After:**
```dart
class _MyTabState extends State<MyTab> {
  @override
  Widget build(BuildContext context) {
    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _load,
      children: [...],
    );
  }
}
```

---

## Best Practices

### 1. Always Use Styled Components

❌ **Don't:**
```dart
Container(
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(8),
  ),
  child: ...,
)
```

✅ **Do:**
```dart
StyledCard(
  child: ...,
)
```

### 2. Use Theme Tokens

❌ **Don't:**
```dart
Text('Title', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))
```

✅ **Do:**
```dart
Text('Title', style: theme.textTheme.titleMedium)
```

### 3. Use AppSpacing Constants

❌ **Don't:**
```dart
Padding(padding: EdgeInsets.all(16))
```

✅ **Do:**
```dart
Padding(padding: EdgeInsets.all(AppSpacing.md))
```

### 4. Use AppColors

❌ **Don't:**
```dart
color: Color(0xFF3B82F6)
```

✅ **Do:**
```dart
color: AppColors.blue500
// or
color: cs.primary
```

### 5. Prefer Factory Constructors

For common patterns, use factory constructors:

```dart
// Instead of manually configuring
StyledEmptyState(
  icon: Icons.search_off,
  title: 'No results found',
  subtitle: 'Try adjusting your search',
)

// Use the factory
StyledEmptyState.noResults(
  query: searchQuery,
  onAction: clearSearch,
)
```

### 6. Leverage Loading Overlays

```dart
// Wrap content that loads asynchronously
LoadingOverlay(
  isLoading: _isSaving,
  message: 'Saving changes...',
  child: Form(...),
)
```

### 7. Consistent Settings Pages

All settings tabs should follow this pattern:

```dart
class MySettingsTab extends StatefulWidget {
  @override
  State<MySettingsTab> createState() => _MySettingsTabState();
}

class _MySettingsTabState extends State<MySettingsTab> {
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      // Load data
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() { _isLoading = false; _error = e.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      children: [
        SettingsSection(
          title: 'Section Title',
          children: [
            // Settings widgets
          ],
        ),
      ],
    );
  }
}
```

---

## Component File Locations

| Component | File Path |
|-----------|-----------|
| StyledCard | `lib/widgets/styled_card.dart` |
| StyledButton | `lib/widgets/styled_button.dart` |
| StyledAvatar | `lib/widgets/styled_avatar.dart` |
| StyledBadge | `lib/widgets/styled_badge.dart` |
| StyledChip | `lib/widgets/styled_chip.dart` |
| StyledTextField | `lib/widgets/styled_text_field.dart` |
| StyledSearchField | `lib/widgets/styled_search_field.dart` |
| StyledEmptyState | `lib/widgets/styled_empty_state.dart` |
| StyledLoadingIndicator | `lib/widgets/styled_loading_indicator.dart` |
| StyledListTile | `lib/widgets/styled_list_tile.dart` |
| StyledBottomSheet | `lib/widgets/styled_bottom_sheet.dart` |
| EnhancedEmptyState | `lib/widgets/enhanced_empty_state.dart` |
| SettingsTabScaffold | `lib/widgets/settings/settings_tab_scaffold.dart` |
| SettingsSection | `lib/widgets/settings_components.dart` |
| SettingsToggle | `lib/widgets/settings_components.dart` |
| SettingsAction | `lib/widgets/settings_components.dart` |

**Barrel Export:**
```dart
import 'package:your_app/widgets/styled_widgets.dart';
```

---

## Changelog

### v1.0.0 (January 2026)
- Initial component catalog
- Documented all Styled* components
- Added migration patterns
- Added best practices guide
