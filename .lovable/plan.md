
# Phase 3: Vendor Reviews Aggregation & Article Rating Enhancement

## Overview
Wire real vendor review ratings to marketplace cards and complete the ServiceDetailPage reviews tab. The `article_ratings` table is already wired in KnowledgeBase.tsx - this plan focuses on the vendor reviews aggregation enhancements.

---

## Current State Analysis

### Already Working
- `vendor_reviews` table exists with proper schema
- `ReviewRatingUI.tsx` - Fully wired to submit/display reviews
- `VendorReviews.tsx` - Fetches and displays reviews for a vendor
- `FeaturedServices.tsx` - Already aggregates ratings correctly
- `KnowledgeBase.tsx` - Article ratings already wired to `article_ratings` table

### Issues to Fix
- `ServiceCard.tsx` uses hardcoded mock ratings (`avgRating: 4.5, reviewCount: 12`)
- `ProductCard.tsx` uses random mock ratings (`4.2 + Math.random() * 0.7`)
- `ServiceDetailPage.tsx` shows "Reviews feature coming soon" placeholder
- `ServiceDiscoveryUI.tsx` doesn't fetch rating data for services

---

## Implementation Plan

### Task 1: Extend ServiceListingData Interface
**File:** `src/components/marketplace/ServiceDiscoveryUI.tsx`

Add rating fields to the service data type:
```typescript
export interface ServiceListingData {
  // ... existing fields ...
  avg_rating?: number;
  review_count?: number;
}
```

### Task 2: Fetch Aggregated Ratings in ServiceDiscoveryUI
**File:** `src/components/marketplace/ServiceDiscoveryUI.tsx`

Modify `fetchServices` function to:
1. Get vendor IDs from fetched services
2. Query `vendor_reviews` table to aggregate ratings per vendor
3. Map ratings back to services

```typescript
// After fetching services, aggregate ratings
const vendorIds = data.map(s => s.vendor?.id).filter(Boolean);
const { data: reviews } = await supabase
  .from('vendor_reviews')
  .select('vendor_id, rating')
  .in('vendor_id', vendorIds);

const ratingMap = reviews?.reduce((acc, r) => {
  if (!acc[r.vendor_id]) acc[r.vendor_id] = { total: 0, count: 0 };
  acc[r.vendor_id].total += r.rating;
  acc[r.vendor_id].count += 1;
  return acc;
}, {});

// Add ratings to services
const servicesWithRatings = data.map(service => ({
  ...service,
  avg_rating: ratingMap[service.vendor?.id]?.total / ratingMap[service.vendor?.id]?.count || 0,
  review_count: ratingMap[service.vendor?.id]?.count || 0,
}));
```

### Task 3: Update ServiceCard to Use Real Ratings
**File:** `src/components/marketplace/ServiceCard.tsx`

Replace mock trustMetrics with service data:

```typescript
// Before (mock)
const trustMetrics = {
  avgRating: 4.5, // Would come from actual data
  reviewCount: 12, // Would come from actual data
};

// After (real)
const trustMetrics = {
  isVerified: service.vendor?.verification_status === 'VERIFIED',
  avgRating: service.avg_rating || 0,
  reviewCount: service.review_count || 0,
  responseTime: 'fast' as const,
};
```

### Task 4: Update ProductCard to Use Real Ratings
**File:** `src/components/marketplace/ProductCard.tsx`

Replace random mock ratings:

```typescript
// Before (mock)
const rating = 4.2 + Math.random() * 0.7;
const reviewCount = Math.floor(Math.random() * 200) + 10;

// After (real)
const rating = service.avg_rating || 0;
const reviewCount = service.review_count || 0;
```

Also conditionally render rating badge only when reviews exist.

### Task 5: Wire ServiceDetailPage Reviews Tab
**File:** `src/components/marketplace/ServiceDetailPage.tsx`

Replace placeholder with actual VendorReviews component:

```typescript
import { VendorReviews } from './VendorReviews';

// In the Reviews TabsContent:
<TabsContent value="reviews" className="space-y-4 mt-4">
  {service.vendor ? (
    <VendorReviews 
      vendorId={service.vendor.id} 
      vendorName={service.vendor.business_name} 
    />
  ) : (
    <p className="text-muted-foreground">No vendor information available</p>
  )}
</TabsContent>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/ServiceDiscoveryUI.tsx` | Add rating fields to interface, fetch aggregated ratings |
| `src/components/marketplace/ServiceCard.tsx` | Use `service.avg_rating` and `service.review_count` |
| `src/components/marketplace/ProductCard.tsx` | Use real ratings, conditional rendering |
| `src/components/marketplace/ServiceDetailPage.tsx` | Import and render VendorReviews component |

---

## Data Flow Diagram

```text
┌─────────────────────┐
│  vendor_reviews     │
│  (Database Table)   │
└─────────┬───────────┘
          │ SELECT vendor_id, rating
          ▼
┌─────────────────────┐
│ ServiceDiscoveryUI  │
│ - Aggregate ratings │
│ - Map to services   │
└─────────┬───────────┘
          │ Pass avg_rating, review_count
          ▼
┌─────────────────────┬─────────────────────┐
│   ServiceCard       │   ProductCard       │
│ - VendorTrustScore  │ - Rating Badge      │
│ - Real metrics      │ - Real count        │
└─────────────────────┴─────────────────────┘
```

---

## Technical Considerations

1. **Performance**: Rating aggregation adds one additional query per page load
2. **Caching**: React Query caches results, minimizing repeated fetches
3. **Fallbacks**: Components gracefully handle zero reviews
4. **Type Safety**: Interface extended to include optional rating fields

---

## Testing Checklist

- [ ] Verify ratings display correctly on ServiceCard
- [ ] Verify ratings display correctly on ProductCard  
- [ ] Confirm VendorReviews renders in ServiceDetailPage
- [ ] Test with vendors that have no reviews (should show 0 or hide)
- [ ] Test with vendors that have multiple reviews (should average correctly)

---

## Summary

This enhancement removes all mock/hardcoded rating data from marketplace components and wires them to real aggregated data from the `vendor_reviews` table. The article rating system is already complete and requires no changes.
