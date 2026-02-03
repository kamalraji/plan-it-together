// Shared marketplace types

export enum ServiceCategory {
  VENUE = 'VENUE',
  CATERING = 'CATERING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  VIDEOGRAPHY = 'VIDEOGRAPHY',
  ENTERTAINMENT = 'ENTERTAINMENT',
  DECORATION = 'DECORATION',
  AUDIO_VISUAL = 'AUDIO_VISUAL',
  TRANSPORTATION = 'TRANSPORTATION',
  SECURITY = 'SECURITY',
  CLEANING = 'CLEANING',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  PRINTING = 'PRINTING',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  VENDOR_REVIEWING = 'VENDOR_REVIEWING',
  QUOTE_SENT = 'QUOTE_SENT',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export interface PricingModel {
  type: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM_QUOTE';
  basePrice?: number;
  currency: string;
  minimumOrder?: number;
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
}

export interface VendorInfo {
  id: string;
  businessName: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating: number;
  reviewCount: number;
  responseTime: number;
}

export interface ServiceListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: ServiceCategory;
  pricing: PricingModel;
  serviceArea: string[];
  inclusions: string[];
  exclusions?: string[];
  media: MediaFile[];
  featured: boolean;
  vendor: VendorInfo;
}

export interface SearchFilters {
  query?: string;
  category?: ServiceCategory;
  location?: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  verifiedOnly: boolean;
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

export interface BookingRequest {
  id: string;
  eventId: string;
  serviceListingId: string;
  organizerId: string;
  vendorId: string;
  status: BookingStatus;
  serviceDate: string;
  requirements: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  quotedPrice?: number;
  finalPrice?: number;
  additionalNotes?: string;
  messages: BookingMessage[];
  serviceListing: {
    id: string;
    title: string;
    category: string;
    pricing: {
      type: string;
      basePrice?: number;
      currency: string;
    };
  };
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: string;
    rating: number;
    reviewCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: 'ORGANIZER' | 'VENDOR';
  message: string;
  sentAt: string;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  bookingId: string;
  organizerId: string;
  rating: number;
  title: string;
  comment: string;
  serviceQuality: number;
  communication: number;
  timeliness: number;
  value: number;
  wouldRecommend: boolean;
  vendorResponse?: string;
  vendorResponseAt?: string;
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: string;
  };
  booking: {
    id: string;
    serviceListing: {
      title: string;
      category: string;
    };
  };
}

export interface CompletedBooking {
  id: string;
  serviceListing: {
    id: string;
    title: string;
    category: string;
  };
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: string;
  };
  serviceDate: string;
  finalPrice?: number;
  currency: string;
  hasReview: boolean;
}

// Utility functions
export const formatPrice = (pricing: PricingModel) => {
  if (pricing.type === 'CUSTOM_QUOTE') {
    return 'Custom Quote';
  }
  
  const price = pricing.basePrice || 0;
  const currency = pricing.currency || 'USD';
  
  switch (pricing.type) {
    case 'FIXED':
      return `${currency} ${price.toLocaleString()}`;
    case 'HOURLY':
      return `${currency} ${price.toLocaleString()}/hour`;
    case 'PER_PERSON':
      return `${currency} ${price.toLocaleString()}/person`;
    default:
      return 'Contact for pricing';
  }
};

export const formatCategory = (category: string) => {
  return category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const getStatusText = (status: BookingStatus) => {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};
