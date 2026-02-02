/**
 * YouTube Live Streaming Types
 * Industrial-grade type definitions for live streaming feature
 */

export type StreamPlatform = 'YOUTUBE' | 'FACEBOOK' | 'CUSTOM_RTMP';
export type StreamStatus = 'scheduled' | 'preparing' | 'live' | 'ended' | 'error';
export type PrivacyStatus = 'public' | 'unlisted' | 'private';

export interface LiveStream {
  id: string;
  session_id: string | null;
  event_id: string;
  workspace_id: string | null;
  platform: string;
  video_id: string | null;
  stream_url: string | null;
  stream_status: StreamStatus;
  youtube_broadcast_id: string | null;
  youtube_stream_key: string | null;
  title: string | null;
  description: string | null;
  privacy_status: PrivacyStatus;
  scheduled_start: string | null;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  chat_enabled: boolean;
  is_recording_available: boolean;
  recording_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreamViewerSession {
  id: string;
  stream_id: string;
  user_id: string;
  started_at: string;
  last_seen_at: string | null;
  watch_duration_seconds: number;
  quality_preference: string | null;
  device_type: string | null;
  created_at: string;
}

export interface StreamAnalytics {
  streamId: string;
  peakViewers: number;
  averageWatchTime: number;
  totalUniqueViewers: number;
  currentViewers: number;
  deviceBreakdown: Record<string, number>;
  viewerTimeline: { timestamp: string; count: number }[];
}

export interface CreateStreamInput {
  workspace_id: string;
  event_id: string;
  session_id?: string;
  title: string;
  description?: string;
  privacy_status?: PrivacyStatus;
  scheduled_start?: string;
  chat_enabled?: boolean;
}

export interface UpdateStreamInput {
  stream_id: string;
  title?: string;
  description?: string;
  privacy_status?: PrivacyStatus;
  scheduled_start?: string;
  chat_enabled?: boolean;
}

export interface YouTubeCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail?: string;
}

export interface YouTubeChannelInfo {
  id: string;
  name: string;
  thumbnail: string;
  subscriberCount: number;
  isLiveStreamingEnabled: boolean;
}

// Stream action types for edge function
export type StreamAction = 
  | 'create_broadcast'
  | 'start_stream'
  | 'end_stream'
  | 'get_status'
  | 'get_analytics'
  | 'update_stream';

export interface StreamActionRequest {
  action: StreamAction;
  workspace_id: string;
  stream_id?: string;
  event_id?: string;
  title?: string;
  description?: string;
  privacy_status?: PrivacyStatus;
  scheduled_start?: string;
  chat_enabled?: boolean;
}

export interface StreamActionResponse {
  success: boolean;
  data?: LiveStream | StreamAnalytics;
  error?: string;
  youtube_stream_key?: string;
  youtube_broadcast_id?: string;
}
