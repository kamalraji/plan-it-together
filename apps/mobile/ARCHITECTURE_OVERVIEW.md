# Architecture Overview

This document describes the layered architecture, data flow patterns, and provider lifecycle management of the Thittam1Hub Flutter application.

---

## Table of Contents

1. [Layered Architecture](#layered-architecture)
2. [Data Flow](#data-flow)
3. [Provider Lifecycle](#provider-lifecycle)
4. [Repository Pattern](#repository-pattern)
5. [Service Layer](#service-layer)
6. [Error Handling](#error-handling)
7. [State Management](#state-management)

---

## Layered Architecture

The application follows a strict layered architecture separating concerns across four distinct layers:

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[UI Pages & Widgets]
        Controllers[Page Controllers]
    end
    
    subgraph "State Management Layer"
        Providers[Global Providers]
        LocalState[Local ChangeNotifiers]
    end
    
    subgraph "Domain Layer"
        Repositories[Repository Interfaces]
        Services[Business Services]
    end
    
    subgraph "Data Layer"
        SupabaseImpl[Supabase Repositories]
        LocalDB[Drift SQLite]
        Cache[In-Memory Cache]
    end
    
    subgraph "External"
        Supabase[(Supabase Backend)]
        Storage[(File Storage)]
        EdgeFn[Edge Functions]
    end
    
    UI --> Controllers
    Controllers --> Providers
    Controllers --> LocalState
    Providers --> Repositories
    LocalState --> Services
    Services --> Repositories
    Repositories --> SupabaseImpl
    SupabaseImpl --> Supabase
    SupabaseImpl --> Storage
    SupabaseImpl --> EdgeFn
    Services --> LocalDB
    Services --> Cache
```

### Layer Responsibilities

| Layer | Responsibility | Key Files |
|-------|---------------|-----------|
| **Presentation** | UI rendering, user input handling | `lib/pages/`, `lib/widgets/` |
| **State Management** | Reactive state, cross-page sharing | `lib/providers/` |
| **Domain** | Business logic, abstractions | `lib/repositories/`, `lib/services/` |
| **Data** | Data persistence, API calls | `lib/repositories/supabase_*.dart` |

---

## Data Flow

### Read Flow (Query)

```mermaid
sequenceDiagram
    participant UI as UI Page
    participant Ctrl as Controller
    participant Prov as Provider
    participant Repo as Repository
    participant SB as Supabase
    
    UI->>Ctrl: User action / init
    Ctrl->>Prov: Request data
    Prov->>Repo: getData()
    Repo->>SB: SELECT query
    SB-->>Repo: Raw JSON
    Repo-->>Prov: Result<T>
    
    alt Success
        Prov-->>Ctrl: Data
        Ctrl->>Ctrl: Update state
        Ctrl-->>UI: notifyListeners()
    else Failure
        Prov-->>Ctrl: Error message
        Ctrl->>UI: Show error toast
    end
```

### Write Flow (Mutation)

```mermaid
sequenceDiagram
    participant UI as UI Page
    participant Ctrl as Controller
    participant Repo as Repository
    participant SB as Supabase
    participant RT as Realtime
    
    UI->>Ctrl: User submits form
    Ctrl->>Ctrl: Optimistic update
    Ctrl-->>UI: Immediate feedback
    Ctrl->>Repo: createItem()
    Repo->>SB: INSERT query
    
    alt Success
        SB-->>Repo: Created record
        Repo-->>Ctrl: Result.success()
        SB->>RT: Broadcast change
        RT-->>Ctrl: Realtime update
    else Failure
        SB-->>Repo: Error
        Repo-->>Ctrl: Result.failure()
        Ctrl->>Ctrl: Rollback optimistic update
        Ctrl-->>UI: Show error
    end
```

### Offline-First Flow

```mermaid
flowchart TD
    A[User Action] --> B{Online?}
    B -->|Yes| C[Execute via Repository]
    B -->|No| D[Queue in OfflineActionQueue]
    
    C --> E{Success?}
    E -->|Yes| F[Update Local State]
    E -->|No| G[Retry with Backoff]
    
    D --> H[Store in SharedPreferences]
    H --> I[Show Pending Indicator]
    
    J[Network Restored] --> K[Process Queue]
    K --> L[Sync Each Action]
    L --> M[Remove from Queue]
    M --> N[Update UI]
```

---

## Provider Lifecycle

### Initialization & Cleanup

```mermaid
stateDiagram-v2
    [*] --> Uninitialized: App Start
    
    Uninitialized --> Initializing: AuthStateListener detects signedIn
    Initializing --> Ready: Providers initialized
    
    Ready --> Ready: Normal operation
    Ready --> Refreshing: Pull to refresh
    Refreshing --> Ready: Data updated
    
    Ready --> Clearing: AuthStateListener detects signedOut
    Clearing --> Uninitialized: clearAll() complete
    
    Ready --> [*]: App terminated
```

### Provider Registration (main.dart)

```mermaid
graph LR
    subgraph "MultiProvider Tree"
        A[App] --> B[AuthStateListener]
        B --> C[ChatProvider]
        B --> D[ProfileProvider]
        B --> E[EventProvider]
        B --> F[NotificationProvider]
        B --> G[ZoneStateService]
    end
    
    subgraph "Injected Dependencies"
        C -.-> CR[SupabaseChatRepository]
        D -.-> IR[SupabaseImpactRepository]
        E -.-> ER[SupabaseEventRepository]
        F -.-> NR[SupabaseNotificationRepository]
    end
```

### Auth State Transitions

```mermaid
flowchart TD
    A[Supabase Auth Event] --> B{Event Type}
    
    B -->|signedIn| C[Initialize Providers]
    C --> D[Load user profile]
    D --> E[Setup realtime subscriptions]
    E --> F[Fetch initial data]
    
    B -->|signedOut| G[Clear All Providers]
    G --> H[Cancel subscriptions]
    H --> I[Clear cached data]
    I --> J[Navigate to login]
    
    B -->|tokenRefreshed| K[Refresh auth headers]
```

---

## Repository Pattern

### Abstract Interface Design

```mermaid
classDiagram
    class BaseRepository {
        <<abstract>>
        +String get tag
        +execute~T~(operation) Result~T~
        +executeWithRetry~T~(operation) Result~T~
        +logDbOperation(operation, table)
    }
    
    class SparkRepository {
        <<interface>>
        +getFeedPosts() Result~PaginatedList~
        +createPost() Result~SparkPost~
        +toggleSpark() Result~bool~
    }
    
    class SupabaseSparkRepository {
        -SupabaseClient _supabase
        +getFeedPosts() Result~PaginatedList~
        +createPost() Result~SparkPost~
    }
    
    BaseRepository <|-- SupabaseSparkRepository
    SparkRepository <|.. SupabaseSparkRepository
```

### Repository Registry

| Repository | Interface | Implementation | Domain |
|------------|-----------|----------------|--------|
| Chat | `ChatRepository` | `SupabaseChatRepository` | Direct messaging |
| GroupChat | `GroupChatRepository` | `SupabaseGroupChatRepository` | Group conversations |
| Spark | `SparkRepository` | `SupabaseSparkRepository` | Social feed |
| Impact | `ImpactRepository` | `SupabaseImpactRepository` | User profiles |
| Circle | `CircleRepository` | `SupabaseCircleRepository` | Community groups |
| Space | `SpaceRepository` | `SupabaseSpaceRepository` | Audio rooms |
| Followers | `FollowersRepository` | `SupabaseFollowersRepository` | Social graph |
| Comments | `CommentRepository` | `SupabaseCommentRepository` | Post comments |
| SavedEvents | `SavedEventsRepository` | `SupabaseSavedEventsRepository` | Bookmarks |
| Zone | `ZoneRepository` | `SupabaseZoneRepository` | Event sessions |

---

## Service Layer

### Service Hierarchy

```mermaid
graph TB
    subgraph "Base Classes"
        BS[BaseService]
        LM[LoggingMixin]
    end
    
    subgraph "Core Services"
        AS[AuthService]
        ES[EventService]
        NS[NotificationService]
        RS[RegistrationService]
    end
    
    subgraph "Feature Services"
        GS[GamificationService]
        SS[SparkService]
        CS[ChatService]
        MS[MatchingService]
    end
    
    subgraph "Infrastructure Services"
        LS[LoggingService]
        OQ[OfflineActionQueue]
        PN[PushNotificationService]
    end
    
    BS --> AS
    BS --> ES
    BS --> NS
    BS --> RS
    BS --> GS
    BS --> SS
    BS --> CS
    BS --> MS
    
    LM -.-> OQ
    LM -.-> PN
```

### Singleton Pattern

All services use the lazy-initialization singleton pattern:

```dart
class ExampleService extends BaseService {
  static ExampleService? _instance;
  static ExampleService get instance => _instance ??= ExampleService._();
  ExampleService._();
  
  @override
  String get tag => 'ExampleService';
}
```

---

## Error Handling

### Result<T> Pattern

```mermaid
flowchart TD
    A[Repository Method] --> B[execute wrapper]
    B --> C{Operation}
    
    C -->|Success| D[Result.success data]
    C -->|Exception| E[ErrorHandler.classify]
    
    E --> F{Error Type}
    F -->|Network| G[Result.failure 'Connection error']
    F -->|Auth| H[Result.failure 'Session expired']
    F -->|RLS| I[Result.failure 'Access denied']
    F -->|Validation| J[Result.failure 'Invalid input']
    F -->|Unknown| K[Result.failure 'Something went wrong']
    
    D --> L[Consumer]
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    L --> M{isSuccess?}
    M -->|Yes| N[Use data]
    M -->|No| O[Show errorMessage]
```

### Error Classification

```mermaid
graph LR
    subgraph "PostgrestException"
        PE[Error Code] --> |42501| RLS[RLS Violation]
        PE --> |23505| DUP[Duplicate Key]
        PE --> |23503| FK[Foreign Key Violation]
        PE --> |PGRST301| NF[Not Found]
    end
    
    subgraph "Network Errors"
        NE[SocketException] --> CONN[Connection Error]
        NE2[TimeoutException] --> TO[Request Timeout]
    end
    
    subgraph "Auth Errors"
        AE[AuthException] --> EXP[Session Expired]
        AE --> INV[Invalid Credentials]
    end
```

---

## State Management

### Page Controller Pattern

```mermaid
classDiagram
    class ChangeNotifier {
        <<flutter>>
        +notifyListeners()
    }
    
    class LoggingMixin {
        <<mixin>>
        +String get logTag
        +logInfo()
        +logError()
    }
    
    class HomePageController {
        -List~SparkPost~ _posts
        -bool _isLoading
        +loadPosts()
        +refreshFeed()
    }
    
    class HomePage {
        -HomePageController _controller
        +build() Widget
    }
    
    ChangeNotifier <|-- HomePageController
    LoggingMixin <|.. HomePageController
    HomePage --> HomePageController : uses
```

### Global vs Local State

```mermaid
graph TB
    subgraph "Global State (Providers)"
        GP[Shared across pages]
        GP --> Auth[Auth status]
        GP --> Profile[User profile]
        GP --> Theme[Theme settings]
        GP --> Notifications[Notification count]
    end
    
    subgraph "Local State (Controllers)"
        LP[Page-specific]
        LP --> Form[Form inputs]
        LP --> Scroll[Scroll position]
        LP --> Filter[Active filters]
        LP --> Selection[Selected items]
    end
    
    subgraph "Ephemeral State (StatefulWidget)"
        EP[Widget-specific]
        EP --> Animation[Animation state]
        EP --> Hover[Hover/focus]
        EP --> Expand[Expanded/collapsed]
    end
```

### Realtime Subscriptions

```mermaid
sequenceDiagram
    participant Ctrl as Controller
    participant SB as Supabase Realtime
    participant UI as UI
    
    Ctrl->>SB: Subscribe to channel
    activate SB
    
    loop While subscribed
        SB-->>Ctrl: INSERT event
        Ctrl->>Ctrl: Add to local list
        Ctrl-->>UI: notifyListeners()
        
        SB-->>Ctrl: UPDATE event
        Ctrl->>Ctrl: Update local item
        Ctrl-->>UI: notifyListeners()
        
        SB-->>Ctrl: DELETE event
        Ctrl->>Ctrl: Remove from list
        Ctrl-->>UI: notifyListeners()
    end
    
    Ctrl->>SB: Unsubscribe
    deactivate SB
```

---

## File Structure

```
lib/
├── config/                 # App configuration
│   └── supabase_config.dart
├── models/                 # Data models (immutable)
│   ├── spark_post.dart
│   ├── impact_profile.dart
│   └── ...
├── repositories/           # Data access layer
│   ├── base_repository.dart
│   ├── spark_repository.dart
│   ├── supabase_spark_repository.dart
│   └── ...
├── services/               # Business logic
│   ├── base_service.dart
│   ├── logging_service.dart
│   ├── auth_service.dart
│   └── ...
├── providers/              # Global state management
│   ├── chat_provider.dart
│   └── ...
├── pages/                  # UI screens
│   ├── home/
│   │   ├── home_page.dart
│   │   └── home_page_controller.dart
│   └── ...
├── widgets/                # Reusable components
├── utils/                  # Utilities
│   ├── result.dart
│   └── error_handler.dart
└── main.dart               # App entry point
```

---

## Key Principles

1. **Separation of Concerns**: UI → Controller → Provider → Repository → Supabase
2. **Dependency Inversion**: Controllers depend on abstract repositories, not implementations
3. **Result Pattern**: All async operations return `Result<T>` for explicit error handling
4. **Singleton Services**: Lazy-initialized via `static T get instance` pattern
5. **Optimistic Updates**: UI updates immediately, rollback on failure
6. **Realtime First**: Supabase subscriptions for live data synchronization
7. **Offline Queue**: Actions queued when offline, synced with exponential backoff
