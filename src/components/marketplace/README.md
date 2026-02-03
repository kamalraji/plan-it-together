# Marketplace Organizer Interface

This directory contains the frontend components for the marketplace organizer interface, allowing event organizers to discover, book, and review services from vendors.

## Components

### MarketplaceOrganizerInterface
Main container component that provides tabbed navigation between the three main marketplace features.

**Props:**
- `eventId?: string` - Optional event ID to filter services and bookings for a specific event

**Features:**
- Tabbed navigation (Discover Services, My Bookings, Reviews)
- Responsive design
- Event-specific filtering when eventId is provided

### ServiceDiscoveryUI
Component for searching and discovering marketplace services.

**Features:**
- Advanced search with filters (category, location, budget, verified vendors)
- Service listings with vendor information and ratings
- Service comparison tools
- Booking request modal
- Responsive grid layout

**Search Filters:**
- Text search across service titles and descriptions
- Category filtering (Venue, Catering, Photography, etc.)
- Location-based filtering
- Budget range filtering
- Verified vendors only option
- Sort by relevance, price, rating, or distance

### BookingManagementUI
Component for managing booking requests and vendor communications.

**Features:**
- Booking status tracking with visual indicators
- Status-based filtering
- Integrated messaging system with vendors
- Quote acceptance/rejection
- Booking cancellation
- Real-time status updates

**Booking Statuses:**
- Pending - Initial request sent
- Vendor Reviewing - Vendor is reviewing the request
- Quote Sent - Vendor has provided a quote
- Quote Accepted - Organizer accepted the quote
- Confirmed - Booking is confirmed
- In Progress - Service is being delivered
- Completed - Service completed successfully
- Cancelled - Booking was cancelled
- Disputed - There's a dispute requiring resolution

### ReviewRatingUI
Component for writing and managing vendor reviews.

**Features:**
- Two-tab interface (My Reviews, Pending Reviews)
- Detailed rating system (overall + 4 categories)
- Review submission with title and comments
- Vendor response display
- Verified purchase indicators
- Review helpfulness tracking

**Rating Categories:**
- Service Quality
- Communication
- Timeliness
- Value for Money

## Integration

The marketplace interface is integrated into the organizer dashboard as a tab. To use it in other contexts:

```tsx
import { MarketplaceOrganizerInterface } from '../components/marketplace';

// Basic usage
<MarketplaceOrganizerInterface />

// With event-specific filtering
<MarketplaceOrganizerInterface eventId="event-123" />
```

## API Dependencies

The components rely on the following API endpoints:

### Service Discovery
- `GET /marketplace/services/search` - Search services with filters
- `POST /marketplace/bookings` - Create booking request

### Booking Management
- `GET /marketplace/bookings/organizer` - Get organizer's bookings
- `PATCH /marketplace/bookings/:id/accept-quote` - Accept vendor quote
- `PATCH /marketplace/bookings/:id/cancel` - Cancel booking
- `POST /marketplace/bookings/:id/messages` - Send message to vendor

### Reviews
- `GET /marketplace/reviews/organizer` - Get organizer's reviews
- `GET /marketplace/bookings/organizer?status=COMPLETED&withoutReview=true` - Get completed bookings without reviews
- `POST /marketplace/reviews` - Submit vendor review

## Testing

Unit tests are provided for the main interface component. To run tests:

```bash
npm test -- --testPathPattern=marketplace
```

## Styling

Components use Tailwind CSS for styling with a consistent design system:
- Blue color scheme for primary actions
- Gray color scheme for secondary elements
- Status-specific colors (green for success, yellow for pending, red for errors)
- Responsive breakpoints for mobile and desktop
- Consistent spacing and typography

## Requirements Validation

This implementation addresses the following requirements from the spec:

**Requirements 28.1, 28.2, 28.4** - Service Discovery UI
- ✅ Marketplace search interface with filtering and sorting
- ✅ Service comparison tools and detailed listings
- ✅ Integration with event planning workflow

**Requirements 29.1, 32.3** - Booking Management UI  
- ✅ Booking request interface with status tracking
- ✅ Vendor communication tools and messaging
- ✅ Quote acceptance and booking lifecycle management

**Requirements 30.1, 30.3** - Review and Rating UI
- ✅ Review submission forms with detailed ratings
- ✅ Review management interface showing past reviews
- ✅ Integration with completed bookings for review prompts