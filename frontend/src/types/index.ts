// Common types and interfaces for the frontend

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  profileCompleted?: boolean;
  bio?: string;
  organization?: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  JUDGE = 'JUDGE',
  VOLUNTEER = 'VOLUNTEER',
  SPEAKER = 'SPEAKER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Event Management Types
export interface Event {
  id: string;
  name: string;
  description: string;
  mode: EventMode;
  startDate: string;
  endDate: string;
  capacity?: number;
  registrationDeadline?: string;
  organizerId: string;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  status: EventStatus;
  landingPageUrl: string;
  timeline?: TimelineItem[];
  agenda?: AgendaItem[];
  prizes?: PrizeInfo[];
  sponsors?: SponsorInfo[];
  createdAt: string;
  updatedAt: string;
}

export enum EventMode {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID'
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface BrandingConfig {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
}

export interface VenueConfig {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  capacity?: number;
  facilities?: string[];
}

export interface VirtualConfig {
  meetingUrl: string;
  meetingId?: string;
  password?: string;
  platform: 'zoom' | 'teams' | 'meet' | 'webex' | 'other';
  instructions?: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'session' | 'break' | 'networking' | 'presentation';
  speaker?: string;
  location?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  location?: string;
  materials?: string[];
}

export interface PrizeInfo {
  id: string;
  title: string;
  description: string;
  value?: string;
  position: number;
  category?: string;
}

export interface SponsorInfo {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  tier: 'title' | 'platinum' | 'gold' | 'silver' | 'bronze';
  description?: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultMode: EventMode;
  defaultDuration: number; // in hours
  suggestedCapacity?: number;
  timeline?: Omit<TimelineItem, 'id'>[];
  branding?: Partial<BrandingConfig>;
}

export interface CreateEventDTO {
  name: string;
  description: string;
  mode: EventMode;
  startDate: string;
  endDate: string;
  capacity?: number;
  registrationDeadline?: string;
  templateId?: string;
  branding: BrandingConfig;
  venue?: VenueConfig;
  virtualLinks?: VirtualConfig;
  timeline?: Omit<TimelineItem, 'id'>[];
  agenda?: Omit<AgendaItem, 'id'>[];
  prizes?: Omit<PrizeInfo, 'id'>[];
  sponsors?: Omit<SponsorInfo, 'id'>[];
}
