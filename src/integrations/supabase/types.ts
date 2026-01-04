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
      admin_audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
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
      certificate_criteria: {
        Row: {
          conditions: Json
          created_at: string
          event_id: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          event_id: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          event_id?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_criteria_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_id: string
          created_at: string
          distributed_at: string | null
          event_id: string
          id: string
          issued_at: string
          metadata: Json
          pdf_url: string | null
          qr_payload: string
          recipient_id: string
          type: string
          updated_at: string
        }
        Insert: {
          certificate_id: string
          created_at?: string
          distributed_at?: string | null
          event_id: string
          id?: string
          issued_at?: string
          metadata?: Json
          pdf_url?: string | null
          qr_payload: string
          recipient_id: string
          type: string
          updated_at?: string
        }
        Update: {
          certificate_id?: string
          created_at?: string
          distributed_at?: string | null
          event_id?: string
          id?: string
          issued_at?: string
          metadata?: Json
          pdf_url?: string | null
          qr_payload?: string
          recipient_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          branding: Json | null
          canvas_state: Json | null
          capacity: number | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          landing_page_data: Json | null
          landing_page_slug: string | null
          mode: Database["public"]["Enums"]["event_mode"]
          name: string
          organization_id: string | null
          owner_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          branding?: Json | null
          canvas_state?: Json | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          landing_page_data?: Json | null
          landing_page_slug?: string | null
          mode: Database["public"]["Enums"]["event_mode"]
          name: string
          organization_id?: string | null
          owner_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          branding?: Json | null
          canvas_state?: Json | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          landing_page_data?: Json | null
          landing_page_slug?: string | null
          mode?: Database["public"]["Enums"]["event_mode"]
          name?: string
          organization_id?: string | null
          owner_id?: string | null
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
      organization_products: {
        Row: {
          category: string | null
          click_count: number
          created_at: string
          description: string | null
          featured_position: number | null
          id: string
          impression_count: number
          is_featured: boolean
          link_url: string | null
          name: string
          organization_id: string
          position: number | null
          price: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          click_count?: number
          created_at?: string
          description?: string | null
          featured_position?: number | null
          id?: string
          impression_count?: number
          is_featured?: boolean
          link_url?: string | null
          name: string
          organization_id: string
          position?: number | null
          price?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          click_count?: number
          created_at?: string
          description?: string | null
          featured_position?: number | null
          id?: string
          impression_count?: number
          is_featured?: boolean
          link_url?: string | null
          name?: string
          organization_id?: string
          position?: number | null
          price?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_products_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sponsors: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          position: number | null
          tier: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          position?: number | null
          tier?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          position?: number | null
          tier?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_sponsors_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          created_at: string
          highlight: boolean
          id: string
          organization_id: string
          position: number | null
          quote: string
        }
        Insert: {
          author_name: string
          author_role?: string | null
          created_at?: string
          highlight?: boolean
          id?: string
          organization_id: string
          position?: number | null
          quote: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          created_at?: string
          highlight?: boolean
          id?: string
          organization_id?: string
          position?: number | null
          quote?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_testimonials_organization_fk"
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
          category: string
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          gov_registration_id: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          slug: string
          state: string | null
          verification_source: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          category: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gov_registration_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          slug: string
          state?: string | null
          verification_source?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gov_registration_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          slug?: string
          state?: string | null
          verification_source?: string | null
          verification_status?: string | null
          website?: string | null
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
      system_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
          portfolio_accent_color: string | null
          portfolio_is_public: boolean
          portfolio_layout: Database["public"]["Enums"]["portfolio_layout"]
          portfolio_sections: string[]
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
          portfolio_accent_color?: string | null
          portfolio_is_public?: boolean
          portfolio_layout?: Database["public"]["Enums"]["portfolio_layout"]
          portfolio_sections?: string[]
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
          portfolio_accent_color?: string | null
          portfolio_is_public?: boolean
          portfolio_layout?: Database["public"]["Enums"]["portfolio_layout"]
          portfolio_sections?: string[]
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
      vendor_bookings: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          event_date: string
          event_id: string | null
          event_location: string | null
          event_name: string
          final_price: number | null
          guest_count: number | null
          id: string
          organizer_email: string
          organizer_id: string
          organizer_name: string
          organizer_phone: string | null
          quoted_price: number | null
          requirements: string | null
          service_id: string | null
          status: string
          updated_at: string
          vendor_id: string
          vendor_notes: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          event_date: string
          event_id?: string | null
          event_location?: string | null
          event_name: string
          final_price?: number | null
          guest_count?: number | null
          id?: string
          organizer_email: string
          organizer_id: string
          organizer_name: string
          organizer_phone?: string | null
          quoted_price?: number | null
          requirements?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
          vendor_notes?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          event_date?: string
          event_id?: string | null
          event_location?: string | null
          event_name?: string
          final_price?: number | null
          guest_count?: number | null
          id?: string
          organizer_email?: string
          organizer_id?: string
          organizer_name?: string
          organizer_phone?: string | null
          quoted_price?: number | null
          requirements?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_reviews: {
        Row: {
          created_at: string
          event_id: string | null
          helpful_count: number | null
          id: string
          is_verified_booking: boolean | null
          rating: number
          response_at: string | null
          response_text: string | null
          review_text: string | null
          reviewer_id: string
          title: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_booking?: boolean | null
          rating: number
          response_at?: string | null
          response_text?: string | null
          review_text?: string | null
          reviewer_id: string
          title?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_booking?: boolean | null
          rating?: number
          response_at?: string | null
          response_text?: string | null
          review_text?: string | null
          reviewer_id?: string
          title?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_services: {
        Row: {
          availability: Json | null
          base_price: number | null
          category: string
          created_at: string
          description: string | null
          id: string
          inclusions: string[] | null
          media_urls: string[] | null
          name: string
          price_unit: string | null
          pricing_type: string
          service_areas: string[] | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          availability?: Json | null
          base_price?: number | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          inclusions?: string[] | null
          media_urls?: string[] | null
          name: string
          price_unit?: string | null
          pricing_type?: string
          service_areas?: string[] | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          availability?: Json | null
          base_price?: number | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          inclusions?: string[] | null
          media_urls?: string[] | null
          name?: string
          price_unit?: string | null
          pricing_type?: string
          service_areas?: string[] | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_services_vendor_fk"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          business_name: string
          business_type: string
          categories: string[] | null
          city: string | null
          contact_email: string
          contact_phone: string | null
          country: string | null
          created_at: string
          description: string | null
          documents: Json | null
          id: string
          portfolio_urls: string[] | null
          rejection_reason: string | null
          state: string | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["vendor_status"]
            | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string
          categories?: string[] | null
          city?: string | null
          contact_email: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          portfolio_urls?: string[] | null
          rejection_reason?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["vendor_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string
          categories?: string[] | null
          city?: string | null
          contact_email?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          portfolio_urls?: string[] | null
          rejection_reason?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["vendor_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
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
      workspace_budget_categories: {
        Row: {
          allocated: number
          budget_id: string
          created_at: string
          id: string
          name: string
          used: number
        }
        Insert: {
          allocated?: number
          budget_id: string
          created_at?: string
          id?: string
          name: string
          used?: number
        }
        Update: {
          allocated?: number
          budget_id?: string
          created_at?: string
          id?: string
          name?: string
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "workspace_budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "workspace_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_budget_requests: {
        Row: {
          created_at: string
          id: string
          reason: string
          requested_amount: number
          requested_by: string
          requesting_workspace_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_workspace_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          requested_amount: number
          requested_by: string
          requesting_workspace_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_workspace_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          requested_amount?: number
          requested_by?: string
          requesting_workspace_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_workspace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_budget_requests_requesting_workspace_id_fkey"
            columns: ["requesting_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_budget_requests_target_workspace_id_fkey"
            columns: ["target_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_budgets: {
        Row: {
          allocated: number
          created_at: string
          currency: string
          fiscal_year: string | null
          id: string
          updated_at: string
          used: number
          workspace_id: string
        }
        Insert: {
          allocated?: number
          created_at?: string
          currency?: string
          fiscal_year?: string | null
          id?: string
          updated_at?: string
          used?: number
          workspace_id: string
        }
        Update: {
          allocated?: number
          created_at?: string
          currency?: string
          fiscal_year?: string | null
          id?: string
          updated_at?: string
          used?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_checklists: {
        Row: {
          committee_type: string | null
          created_at: string
          id: string
          is_template: boolean | null
          items: Json
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          committee_type?: string | null
          created_at?: string
          id?: string
          is_template?: boolean | null
          items?: Json
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          committee_type?: string | null
          created_at?: string
          id?: string
          is_template?: boolean | null
          items?: Json
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_checklists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_goals: {
        Row: {
          category: string | null
          created_at: string
          current_value: number | null
          description: string | null
          due_date: string | null
          id: string
          status: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_milestones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_resources: {
        Row: {
          assigned_to_name: string | null
          assigned_to_workspace_id: string | null
          available: number
          created_at: string
          id: string
          metadata: Json | null
          name: string
          quantity: number
          status: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to_name?: string | null
          assigned_to_workspace_id?: string | null
          available?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          quantity?: number
          status?: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to_name?: string | null
          assigned_to_workspace_id?: string | null
          available?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          quantity?: number
          status?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_resources_assigned_to_workspace_id_fkey"
            columns: ["assigned_to_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_resources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_role_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          last_active_tab: string
          role_scope: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          last_active_tab?: string
          role_scope: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          last_active_tab?: string
          role_scope?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_role_views_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          allow_member_invites: boolean
          allow_task_creation: boolean
          created_at: string
          id: string
          notify_messages: boolean
          notify_new_members: boolean
          notify_task_updates: boolean
          notify_weekly_digest: boolean
          public_visibility: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allow_member_invites?: boolean
          allow_task_creation?: boolean
          created_at?: string
          id?: string
          notify_messages?: boolean
          notify_new_members?: boolean
          notify_task_updates?: boolean
          notify_weekly_digest?: boolean
          public_visibility?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allow_member_invites?: boolean
          allow_task_creation?: boolean
          created_at?: string
          id?: string
          notify_messages?: boolean
          notify_new_members?: boolean
          notify_task_updates?: boolean
          notify_weekly_digest?: boolean
          public_visibility?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          role_scope: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          role_scope?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          role_scope?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_team_assignments: {
        Row: {
          created_at: string
          hours_allocated: number | null
          hours_logged: number | null
          id: string
          status: string
          task_id: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          hours_allocated?: number | null
          hours_logged?: number | null
          id?: string
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          hours_allocated?: number | null
          hours_logged?: number | null
          id?: string
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_team_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_team_assignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_team_members: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          role: string
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          role?: string
          status?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          role?: string
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          department_id: string | null
          event_id: string
          id: string
          name: string
          organizer_id: string
          parent_workspace_id: string | null
          status: string
          updated_at: string
          workspace_type: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          event_id: string
          id?: string
          name: string
          organizer_id: string
          parent_workspace_id?: string | null
          status?: string
          updated_at?: string
          workspace_type?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          event_id?: string
          id?: string
          name?: string
          organizer_id?: string
          parent_workspace_id?: string | null
          status?: string
          updated_at?: string
          workspace_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_parent_workspace_id_fkey"
            columns: ["parent_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_portfolio: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          github_url: string
          id: string
          linkedin_url: string
          organization: string
          portfolio_accent_color: string
          portfolio_layout: Database["public"]["Enums"]["portfolio_layout"]
          portfolio_sections: string[]
          twitter_url: string
          website: string
        }[]
      }
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
      record_organization_product_metrics: {
        Args: { _event_type: string; _product_ids: string[] }
        Returns: undefined
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
      portfolio_layout: "stacked" | "grid"
      registration_status: "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED"
      user_role:
        | "SUPER_ADMIN"
        | "ORGANIZER"
        | "PARTICIPANT"
        | "JUDGE"
        | "VOLUNTEER"
        | "SPEAKER"
      user_status: "PENDING" | "ACTIVE" | "SUSPENDED"
      vendor_status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED"
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
      portfolio_layout: ["stacked", "grid"],
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
      vendor_status: ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"],
      verification_status: ["PENDING", "VERIFIED", "REJECTED"],
      workspace_activity_type: ["task", "communication", "team", "template"],
    },
  },
} as const
