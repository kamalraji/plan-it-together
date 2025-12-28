export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          check_in_method: string
          check_in_time: string
          created_at: string
          event_id: string
          id: string
          registration_id: string
          session_id: string | null
          user_id: string
          volunteer_id: string | null
        }
        Insert: {
          check_in_method: string
          check_in_time?: string
          created_at?: string
          event_id: string
          id?: string
          registration_id: string
          session_id?: string | null
          user_id: string
          volunteer_id?: string | null
        }
        Update: {
          check_in_method?: string
          check_in_time?: string
          created_at?: string
          event_id?: string
          id?: string
          registration_id?: string
          session_id?: string | null
          user_id?: string
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          branding: Json | null
          capacity: number | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          mode: Database["public"]["Enums"]["event_mode"]
          name: string
          organization_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          branding?: Json | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          mode: Database["public"]["Enums"]["event_mode"]
          name: string
          organization_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          branding?: Json | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          mode?: Database["public"]["Enums"]["event_mode"]
          name?: string
          organization_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_assignments: {
        Row: {
          created_at: string
          id: string
          judge_id: string
          submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          judge_id: string
          submission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          judge_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_assignments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          event_enabled: boolean
          id: string
          marketplace_enabled: boolean
          organization_enabled: boolean
          sound_enabled: boolean
          system_enabled: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
          workspace_enabled: boolean
        }
        Insert: {
          created_at?: string
          event_enabled?: boolean
          id?: string
          marketplace_enabled?: boolean
          organization_enabled?: boolean
          sound_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
          workspace_enabled?: boolean
        }
        Update: {
          created_at?: string
          event_enabled?: boolean
          id?: string
          marketplace_enabled?: boolean
          organization_enabled?: boolean
          sound_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean
          workspace_enabled?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_checklist: {
        Row: {
          completed_at: string | null
          id: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_memberships: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_membership_role"]
          status: Database["public"]["Enums"]["organization_membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["organization_membership_role"]
          status?: Database["public"]["Enums"]["organization_membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_membership_role"]
          status?: Database["public"]["Enums"]["organization_membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          category: string
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          gov_registration_id: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          slug: string
          state: string | null
          verification_source: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          category: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gov_registration_id?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          state?: string | null
          verification_source?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gov_registration_id?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          state?: string | null
          verification_source?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      organizer_approvals: {
        Row: {
          approved_by: string
          created_at: string
          id: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          approved_by: string
          created_at?: string
          id?: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          approved_by?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          event_id: string
          form_responses: Json
          id: string
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          form_responses?: Json
          id?: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          form_responses?: Json
          id?: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          created_at: string
          criteria: Json
          description: string | null
          event_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria: Json
          description?: string | null
          event_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          judge_id: string
          rubric_id: string
          scores: Json
          submission_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          judge_id: string
          rubric_id: string
          scores: Json
          submission_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          judge_id?: string
          rubric_id?: string
          scores?: Json
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          metadata: Json
          rubric_id: string
          submitted_by: string
          team_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          metadata?: Json
          rubric_id: string
          submitted_by: string
          team_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          metadata?: Json
          rubric_id?: string
          submitted_by?: string
          team_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          organization: string | null
          phone: string | null
          qr_code: string
          twitter_url: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          organization?: string | null
          phone?: string | null
          qr_code: string
          twitter_url?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          organization?: string | null
          phone?: string | null
          qr_code?: string
          twitter_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_activities: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["workspace_activity_type"]
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          type: Database["public"]["Enums"]["workspace_activity_type"]
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["workspace_activity_type"]
          workspace_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin_for_org: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "organizer"
        | "participant"
        | "judge"
        | "volunteer"
        | "speaker"
      event_mode: "OFFLINE" | "ONLINE" | "HYBRID"
      event_status:
        | "DRAFT"
        | "PUBLISHED"
        | "ONGOING"
        | "COMPLETED"
        | "CANCELLED"
      event_visibility: "PUBLIC" | "PRIVATE" | "UNLISTED"
      organization_category: "COLLEGE" | "COMPANY" | "INDUSTRY" | "NON_PROFIT"
      organization_membership_role: "OWNER" | "ADMIN" | "ORGANIZER" | "VIEWER"
      organization_membership_status:
        | "PENDING"
        | "ACTIVE"
        | "REJECTED"
        | "REMOVED"
      registration_status: "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED"
      user_role:
        | "SUPER_ADMIN"
        | "ORGANIZER"
        | "PARTICIPANT"
        | "JUDGE"
        | "VOLUNTEER"
        | "SPEAKER"
      user_status: "PENDING" | "ACTIVE" | "SUSPENDED"
      verification_status: "PENDING" | "VERIFIED" | "REJECTED"
      workspace_activity_type: "task" | "communication" | "team" | "template"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "organizer",
        "participant",
        "judge",
        "volunteer",
        "speaker",
      ],
      event_mode: ["OFFLINE", "ONLINE", "HYBRID"],
      event_status: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"],
      event_visibility: ["PUBLIC", "PRIVATE", "UNLISTED"],
      organization_category: ["COLLEGE", "COMPANY", "INDUSTRY", "NON_PROFIT"],
      organization_membership_role: ["OWNER", "ADMIN", "ORGANIZER", "VIEWER"],
      organization_membership_status: [
        "PENDING",
        "ACTIVE",
        "REJECTED",
        "REMOVED",
      ],
      registration_status: ["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"],
      user_role: [
        "SUPER_ADMIN",
        "ORGANIZER",
        "PARTICIPANT",
        "JUDGE",
        "VOLUNTEER",
        "SPEAKER",
      ],
      user_status: ["PENDING", "ACTIVE", "SUSPENDED"],
      verification_status: ["PENDING", "VERIFIED", "REJECTED"],
      workspace_activity_type: ["task", "communication", "team", "template"],
    },
  },
} as const
