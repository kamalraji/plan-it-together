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
      bookings: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string
          currency: string
          event_id: string | null
          id: string
          metadata: Json | null
          organizer_id: string
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          amount?: number
          buyer_id?: string | null
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          organizer_id: string
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          organizer_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          end_date: string | null
          id: string
          invite_link: string | null
          landing_page_url: string | null
          leaderboard_enabled: boolean | null
          mode: Database["public"]["Enums"]["event_mode"]
          name: string
          organization_id: string | null
          organizer_id: string
          registration_deadline: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          venue: Json | null
          virtual_links: Json | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          branding?: Json | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          invite_link?: string | null
          landing_page_url?: string | null
          leaderboard_enabled?: boolean | null
          mode: Database["public"]["Enums"]["event_mode"]
          name: string
          organization_id?: string | null
          organizer_id: string
          registration_deadline?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: Json | null
          virtual_links?: Json | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          branding?: Json | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          invite_link?: string | null
          landing_page_url?: string | null
          leaderboard_enabled?: boolean | null
          mode?: Database["public"]["Enums"]["event_mode"]
          name?: string
          organization_id?: string | null
          organizer_id?: string
          registration_deadline?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: Json | null
          virtual_links?: Json | null
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
      follows: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_admins: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_admins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          banner_url: string | null
          category: Database["public"]["Enums"]["organization_category"]
          created_at: string
          description: string | null
          email: string | null
          follower_count: number
          id: string
          location: Json | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          social_links: Json | null
          updated_at: string
          verification_reason: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          category: Database["public"]["Enums"]["organization_category"]
          created_at?: string
          description?: string | null
          email?: string | null
          follower_count?: number
          id?: string
          location?: Json | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          social_links?: Json | null
          updated_at?: string
          verification_reason?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          category?: Database["public"]["Enums"]["organization_category"]
          created_at?: string
          description?: string | null
          email?: string | null
          follower_count?: number
          id?: string
          location?: Json | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          social_links?: Json | null
          updated_at?: string
          verification_reason?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          metadata?: Json | null
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
      services: {
        Row: {
          base_price: number
          category: string | null
          created_at: string
          currency: string
          description: string | null
          exclusions: string[] | null
          id: string
          inclusions: string[] | null
          is_active: boolean
          is_featured: boolean | null
          location: string | null
          metadata: Json | null
          name: string
          organizer_id: string
          photos: string[] | null
          pricing_type: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          vendor_id: string | null
          workspace_id: string | null
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          exclusions?: string[] | null
          id?: string
          inclusions?: string[] | null
          is_active?: boolean
          is_featured?: boolean | null
          location?: string | null
          metadata?: Json | null
          name: string
          organizer_id: string
          photos?: string[] | null
          pricing_type?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          vendor_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          exclusions?: string[] | null
          id?: string
          inclusions?: string[] | null
          is_active?: boolean
          is_featured?: boolean | null
          location?: string | null
          metadata?: Json | null
          name?: string
          organizer_id?: string
          photos?: string[] | null
          pricing_type?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          vendor_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          business_address: Json | null
          business_license: string | null
          business_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          insurance_certificate: string | null
          is_active: boolean | null
          portfolio_images: string[] | null
          rating: number | null
          response_time_hours: number | null
          review_count: number | null
          service_categories: string[]
          updated_at: string
          user_id: string
          verification_status: string
          website: string | null
        }
        Insert: {
          business_address?: Json | null
          business_license?: string | null
          business_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          insurance_certificate?: string | null
          is_active?: boolean | null
          portfolio_images?: string[] | null
          rating?: number | null
          response_time_hours?: number | null
          review_count?: number | null
          service_categories?: string[]
          updated_at?: string
          user_id: string
          verification_status?: string
          website?: string | null
        }
        Update: {
          business_address?: Json | null
          business_license?: string | null
          business_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          insurance_certificate?: string | null
          is_active?: boolean | null
          portfolio_images?: string[] | null
          rating?: number | null
          response_time_hours?: number | null
          review_count?: number | null
          service_categories?: string[]
          updated_at?: string
          user_id?: string
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          dissolved_at: string | null
          event_id: string
          id: string
          metadata: Json | null
          name: string
          organizer_id: string
          status: Database["public"]["Enums"]["workspace_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dissolved_at?: string | null
          event_id: string
          id?: string
          metadata?: Json | null
          name: string
          organizer_id: string
          status?: Database["public"]["Enums"]["workspace_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dissolved_at?: string | null
          event_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          organizer_id?: string
          status?: Database["public"]["Enums"]["workspace_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
      event_mode: "OFFLINE" | "ONLINE" | "HYBRID"
      event_status:
        | "DRAFT"
        | "PUBLISHED"
        | "ONGOING"
        | "COMPLETED"
        | "CANCELLED"
      event_visibility: "PUBLIC" | "PRIVATE" | "UNLISTED"
      organization_category: "COLLEGE" | "COMPANY" | "INDUSTRY" | "NON_PROFIT"
      registration_status: "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED"
      verification_status: "PENDING" | "VERIFIED" | "REJECTED"
      workspace_status: "ACTIVE" | "PAUSED" | "ARCHIVED"
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
      booking_status: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      event_mode: ["OFFLINE", "ONLINE", "HYBRID"],
      event_status: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"],
      event_visibility: ["PUBLIC", "PRIVATE", "UNLISTED"],
      organization_category: ["COLLEGE", "COMPANY", "INDUSTRY", "NON_PROFIT"],
      registration_status: ["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"],
      verification_status: ["PENDING", "VERIFIED", "REJECTED"],
      workspace_status: ["ACTIVE", "PAUSED", "ARCHIVED"],
    },
  },
} as const
