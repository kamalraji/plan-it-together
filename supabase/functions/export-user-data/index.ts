// ==============================================
// GDPR DATA EXPORT EDGE FUNCTION
// Exports all user data as JSON for GDPR Article 15 compliance
// ==============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  checkRateLimit,
  validateAuth,
  errorResponse,
  successResponse,
  initRequestContext,
  logInfo,
  logError,
  logRequestComplete,
} from "../_shared/security.ts";

interface ExportOptions {
  includeProfile?: boolean;
  includePosts?: boolean;
  includeActivity?: boolean;
  includeFollowers?: boolean;
  includeMessages?: boolean;
  includeSettings?: boolean;
  includeBadges?: boolean;
  includeRegistrations?: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeProfile: true,
  includePosts: true,
  includeActivity: true,
  includeFollowers: true,
  includeMessages: false, // Opt-in due to size
  includeSettings: true,
  includeBadges: true,
  includeRegistrations: true,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = initRequestContext("export-user-data");

  try {
    // 1. Authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated || !auth.userId) {
      logRequestComplete(401);
      return errorResponse("Unauthorized", 401, corsHeaders);
    }

    const userId = auth.userId;

    // 2. Rate limiting - 3 exports per hour max
    const rateCheck = checkRateLimit(userId, "data-export", {
      maxRequests: 3,
      windowMs: 3600000, // 1 hour
    });
    if (!rateCheck.allowed) {
      logRequestComplete(429);
      return errorResponse(
        "Rate limit exceeded. You can export data 3 times per hour.",
        429,
        corsHeaders
      );
    }

    // 3. Parse options
    let options: ExportOptions = DEFAULT_OPTIONS;
    try {
      const body = await req.json();
      options = { ...DEFAULT_OPTIONS, ...body };
    } catch {
      // Use defaults if no body provided
    }

    logInfo("Starting GDPR data export", { userId, options });

    // 4. Create Supabase client with service role for full data access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Build export data
    const exportData: Record<string, unknown> = {
      _metadata: {
        exportVersion: "1.0",
        exportedAt: new Date().toISOString(),
        userId: userId,
        requestId: requestId,
        gdprArticle: "Article 15 - Right of Access",
        dataCategories: Object.entries(options)
          .filter(([_, v]) => v)
          .map(([k]) => k.replace("include", "")),
      },
    };

    // 6. Fetch data in parallel for efficiency
    const fetchPromises: Promise<void>[] = [];

    // Profile data
    if (options.includeProfile) {
      fetchPromises.push(
        (async () => {
          const [profile, impactProfile, usernameHistory] = await Promise.all([
            supabase
              .from("user_profiles")
              .select("*")
              .eq("id", userId)
              .single(),
            supabase
              .from("impact_profiles")
              .select("*")
              .eq("user_id", userId)
              .single(),
            supabase
              .from("username_history")
              .select("*")
              .eq("user_id", userId)
              .order("changed_at", { ascending: false })
              .limit(50),
          ]);

          exportData.profile = {
            userProfile: profile.data,
            impactProfile: impactProfile.data,
            usernameHistory: usernameHistory.data || [],
          };
        })()
      );
    }

    // Posts (Sparks)
    if (options.includePosts) {
      fetchPromises.push(
        (async () => {
          const [posts, comments, reactions] = await Promise.all([
            supabase
              .from("spark_posts")
              .select("*")
              .eq("author_id", userId)
              .order("created_at", { ascending: false })
              .limit(1000),
            supabase
              .from("spark_comments")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1000),
            supabase
              .from("spark_reactions")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1000),
          ]);

          exportData.posts = {
            sparkPosts: posts.data || [],
            comments: comments.data || [],
            reactions: reactions.data || [],
            summary: {
              totalPosts: posts.data?.length || 0,
              totalComments: comments.data?.length || 0,
              totalReactions: reactions.data?.length || 0,
            },
          };
        })()
      );
    }

    // Activity & Events
    if (options.includeActivity) {
      fetchPromises.push(
        (async () => {
          const [savedEvents, attendance, sessionAttendance] = await Promise.all([
            supabase
              .from("saved_events")
              .select("*, events(id, name, start_date)")
              .eq("user_id", userId)
              .limit(500),
            supabase
              .from("attendance_records")
              .select("*, events(id, name)")
              .eq("user_id", userId)
              .order("check_in_time", { ascending: false })
              .limit(500),
            supabase
              .from("session_attendance")
              .select("*")
              .eq("user_id", userId)
              .limit(500),
          ]);

          exportData.activity = {
            savedEvents: savedEvents.data || [],
            attendanceRecords: attendance.data || [],
            sessionAttendance: sessionAttendance.data || [],
          };
        })()
      );
    }

    // Followers
    if (options.includeFollowers) {
      fetchPromises.push(
        (async () => {
          const [followers, following] = await Promise.all([
            supabase
              .from("followers")
              .select("follower_id, status, created_at")
              .eq("following_id", userId)
              .limit(5000),
            supabase
              .from("followers")
              .select("following_id, status, created_at")
              .eq("follower_id", userId)
              .limit(5000),
          ]);

          exportData.connections = {
            followers: followers.data || [],
            following: following.data || [],
            summary: {
              followerCount: followers.data?.length || 0,
              followingCount: following.data?.length || 0,
            },
          };
        })()
      );
    }

    // Messages (optional, can be large)
    if (options.includeMessages) {
      fetchPromises.push(
        (async () => {
          // Get channels user is member of
          const { data: memberships } = await supabase
            .from("channel_members")
            .select("channel_id")
            .eq("user_id", userId)
            .limit(100);

          const channelIds = memberships?.map((m) => m.channel_id) || [];

          // Get messages from those channels (limited)
          const { data: messages } = await supabase
            .from("channel_messages")
            .select("id, channel_id, content, created_at, message_type")
            .eq("sender_id", userId)
            .order("created_at", { ascending: false })
            .limit(2000);

          // Get group messages
          const { data: groupMemberships } = await supabase
            .from("chat_group_members")
            .select("group_id")
            .eq("user_id", userId)
            .limit(50);

          exportData.messages = {
            channelMemberships: channelIds.length,
            sentMessages: messages || [],
            groupMemberships: groupMemberships?.length || 0,
            _note:
              "Message content is encrypted. Decryption requires your device keys.",
          };
        })()
      );
    }

    // Settings
    if (options.includeSettings) {
      fetchPromises.push(
        (async () => {
          const [
            notificationPrefs,
            accessibilitySettings,
            securityPrefs,
            aiMatchingPrivacy,
            privacyConsents,
          ] = await Promise.all([
            supabase
              .from("notification_preferences")
              .select("*")
              .eq("user_id", userId)
              .single(),
            supabase
              .from("accessibility_settings")
              .select("*")
              .eq("user_id", userId)
              .single(),
            supabase
              .from("security_notification_preferences")
              .select("*")
              .eq("user_id", userId)
              .single(),
            supabase
              .from("ai_matching_privacy_settings")
              .select("*")
              .eq("user_id", userId)
              .single(),
            supabase
              .from("privacy_consents")
              .select("*")
              .eq("user_id", userId)
              .limit(50),
          ]);

          exportData.settings = {
            notificationPreferences: notificationPrefs.data,
            accessibilitySettings: accessibilitySettings.data,
            securityNotificationPreferences: securityPrefs.data,
            aiMatchingPrivacy: aiMatchingPrivacy.data,
            privacyConsents: privacyConsents.data || [],
          };
        })()
      );
    }

    // Badges & Gamification
    if (options.includeBadges) {
      fetchPromises.push(
        (async () => {
          const [userBadges, matchingMetrics] = await Promise.all([
            supabase
              .from("user_badges")
              .select("*, badges(*)")
              .eq("user_id", userId)
              .limit(100),
            supabase
              .from("ai_matching_metrics")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(50),
          ]);

          exportData.gamification = {
            badges: userBadges.data || [],
            matchingMetrics: matchingMetrics.data || [],
          };
        })()
      );
    }

    // Event Registrations
    if (options.includeRegistrations) {
      fetchPromises.push(
        (async () => {
          const [registrations, certificates] = await Promise.all([
            supabase
              .from("registrations")
              .select("*, events(id, name, start_date, end_date)")
              .eq("user_id", userId)
              .order("registered_at", { ascending: false })
              .limit(500),
            supabase
              .from("certificates")
              .select("*")
              .eq("recipient_id", userId)
              .limit(100),
          ]);

          exportData.registrations = {
            eventRegistrations: registrations.data || [],
            certificates: certificates.data || [],
          };
        })()
      );
    }

    // Wait for all fetches to complete
    await Promise.all(fetchPromises);

    // 7. Log the export for audit
    await supabase.from("admin_audit_logs").insert({
      admin_id: userId,
      admin_email: auth.email || null,
      action: "gdpr_data_export",
      target_type: "user_data",
      target_id: userId,
      details: {
        options,
        dataCategories: Object.keys(exportData).filter((k) => k !== "_metadata"),
        requestId,
      },
    });

    logInfo("GDPR data export completed", {
      userId,
      categories: Object.keys(exportData).length,
    });
    logRequestComplete(200);

    return successResponse(exportData, corsHeaders);
  } catch (error) {
    logError("GDPR export failed", error);
    logRequestComplete(500);
    return errorResponse("Failed to export data", 500, corsHeaders);
  }
});
