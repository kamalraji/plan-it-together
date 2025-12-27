# Analytics and Reporting Implementation

## Overview
This document describes the implementation of the analytics and reporting functionality for Thittam1Hub, as specified in Requirements 15.1, 15.2, 15.3, and 15.4.

## Implemented Components

### 1. Analytics Service (`src/services/analytics.service.ts`)

The analytics service provides comprehensive data analysis capabilities for events.

#### Key Methods:

**calculateRegistrationsOverTime(eventId: string)**
- Calculates registration counts grouped by date
- Returns both daily counts and cumulative totals
- Requirements: 15.1

**calculateCheckInRatesBySession(eventId: string)**
- Calculates check-in rates for the overall event and individual sessions
- Computes percentage of confirmed registrations that checked in
- Requirements: 15.2

**calculateScoreDistributions(eventId: string)**
- Analyzes final scores and groups them into distribution buckets (0-20, 20-40, etc.)
- Calculates weighted scores based on rubric criteria
- Returns count and percentage for each bucket
- Requirements: 15.3

**aggregateJudgeParticipation(eventId: string)**
- Tracks judge participation across submissions
- Calculates completion rates (scored vs assigned submissions)
- Requirements: 15.3

**getComprehensiveReport(eventId: string)**
- Combines all analytics into a single comprehensive report
- Includes summary statistics (total registrations, attendance, average scores, etc.)
- Provides a complete view of event performance

### 2. Report Export Service (`src/services/report-export.service.ts`)

The report export service generates downloadable reports in multiple formats.

#### Key Methods:

**exportReport(eventId: string, format: 'CSV' | 'PDF')**
- Exports analytics data in the specified format
- Returns buffer, filename, and MIME type for download
- Requirements: 15.4

**exportToCSV(report: AnalyticsReport)**
- Generates CSV format with all analytics data
- Includes sections for:
  - Summary statistics
  - Registrations over time
  - Session check-in rates
  - Score distributions
  - Judge participation
- Requirements: 15.4

**exportToPDF(report: AnalyticsReport)**
- Generates professional PDF report using PDFKit
- Includes formatted tables and sections
- Optimized for printing and sharing
- Requirements: 15.4

**exportBatchReports(eventIds: string[], format: ExportFormat)**
- Exports reports for multiple events in batch
- Useful for organization-level reporting

### 3. Analytics Routes (`src/routes/analytics.routes.ts`)

RESTful API endpoints for accessing analytics functionality.

#### Endpoints:

**GET /api/analytics/events/:eventId/registrations-over-time**
- Returns registration counts over time
- Authorization: Organizer, Super Admin

**GET /api/analytics/events/:eventId/check-in-rates**
- Returns check-in rates by session
- Authorization: Organizer, Super Admin

**GET /api/analytics/events/:eventId/score-distributions**
- Returns score distribution data
- Authorization: Organizer, Super Admin

**GET /api/analytics/events/:eventId/judge-participation**
- Returns judge participation statistics
- Authorization: Organizer, Super Admin

**GET /api/analytics/events/:eventId/comprehensive**
- Returns complete analytics report
- Authorization: Organizer, Super Admin

**GET /api/analytics/events/:eventId/export?format=CSV|PDF**
- Exports analytics report in specified format
- Returns downloadable file
- Authorization: Organizer, Super Admin

### 4. Unit Tests (`src/services/__tests__/analytics.service.test.ts`)

Comprehensive unit tests for the analytics service covering:
- Registration calculations with date grouping
- Check-in rate calculations
- Score distribution bucketing
- Judge participation aggregation
- Edge cases (empty data, no rubric, etc.)

## Data Structures

### RegistrationOverTime
```typescript
{
  date: string;           // ISO date string (YYYY-MM-DD)
  count: number;          // Registrations on this date
  cumulativeCount: number; // Total registrations up to this date
}
```

### SessionCheckInRate
```typescript
{
  sessionId: string | null;  // null for overall event
  sessionName: string;       // Display name
  totalRegistrations: number;
  checkedIn: number;
  checkInRate: number;       // Percentage (0-100)
}
```

### ScoreDistribution
```typescript
{
  range: string;      // e.g., "0-20", "20-40"
  count: number;      // Number of submissions in this range
  percentage: number; // Percentage of total (0-100)
}
```

### JudgeParticipation
```typescript
{
  judgeId: string;
  judgeName: string;
  assignedSubmissions: number;
  scoredSubmissions: number;
  completionRate: number;  // Percentage (0-100)
}
```

### AnalyticsReport
Complete report structure combining all analytics data with summary statistics.

## Usage Examples

### Get Registrations Over Time
```typescript
const data = await analyticsService.calculateRegistrationsOverTime('event-123');
// Returns: [{ date: '2024-01-01', count: 5, cumulativeCount: 5 }, ...]
```

### Get Check-in Rates
```typescript
const rates = await analyticsService.calculateCheckInRatesBySession('event-123');
// Returns: [{ sessionId: null, sessionName: 'Overall Event', checkInRate: 75.5 }, ...]
```

### Export Report as CSV
```typescript
const result = await reportExportService.exportReport('event-123', 'CSV');
// Returns: { buffer: Buffer, filename: 'analytics-report-...csv', mimeType: 'text/csv' }
```

### Export Report as PDF
```typescript
const result = await reportExportService.exportReport('event-123', 'PDF');
// Returns: { buffer: Buffer, filename: 'analytics-report-...pdf', mimeType: 'application/pdf' }
```

### Get Comprehensive Report
```typescript
const report = await analyticsService.getComprehensiveReport('event-123');
// Returns complete AnalyticsReport with all data and summary
```

## Requirements Coverage

✅ **Requirement 15.1**: Calculate registration counts over time
- Implemented in `calculateRegistrationsOverTime()`
- Groups registrations by date with cumulative totals

✅ **Requirement 15.2**: Calculate check-in rates by session
- Implemented in `calculateCheckInRatesBySession()`
- Provides overall and per-session check-in rates

✅ **Requirement 15.3**: Calculate score distributions and judge participation
- Score distributions: `calculateScoreDistributions()`
- Judge participation: `aggregateJudgeParticipation()`
- Both integrated into comprehensive report

✅ **Requirement 15.4**: Generate CSV and PDF exports
- CSV export: `exportToCSV()`
- PDF export: `exportToPDF()`
- Both include all relevant analytics data

## Integration Notes

To integrate the analytics routes into the main application:

1. Import the analytics routes in `src/index.ts`:
```typescript
import analyticsRoutes from './routes/analytics.routes';
```

2. Register the routes:
```typescript
app.use('/api/analytics', analyticsRoutes);
```

3. Ensure authentication and authorization middleware are properly configured.

## Testing

Unit tests are provided in `__tests__/analytics.service.test.ts`. To run:
```bash
npm test analytics.service.test.ts
```

Tests cover:
- Registration calculations with various date patterns
- Check-in rate calculations with multiple sessions
- Score distribution bucketing
- Judge participation aggregation
- Edge cases and error handling

## Performance Considerations

- All queries use Prisma's efficient query builder
- Data is aggregated in-memory after fetching from database
- For large events (>10,000 registrations), consider:
  - Implementing pagination for detailed data
  - Caching comprehensive reports
  - Using database aggregation functions for summary statistics

## Future Enhancements

Potential improvements for future iterations:
- Real-time analytics updates using WebSockets
- Custom date range filtering
- Comparative analytics across multiple events
- Export to additional formats (Excel, JSON)
- Scheduled report generation and email delivery
- Dashboard visualizations with charts
