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
      approval_request_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          request_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          request_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          request_type?: string
          updated_at?: string
          user_id?: string
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
      catering_dietary_requirements: {
        Row: {
          count: number
          event_id: string
          id: string
          requirement_type: string
          special_requests: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          count?: number
          event_id: string
          id?: string
          requirement_type: string
          special_requests?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          count?: number
          event_id?: string
          id?: string
          requirement_type?: string
          special_requests?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_dietary_requirements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catering_dietary_requirements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_inventory: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          id: string
          name: string
          required_stock: number
          status: string
          supplier: string | null
          unit: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number
          id?: string
          name: string
          required_stock?: number
          status?: string
          supplier?: string | null
          unit?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          id?: string
          name?: string
          required_stock?: number
          status?: string
          supplier?: string | null
          unit?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_inventory_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_meal_schedule: {
        Row: {
          created_at: string
          expected_guests: number
          id: string
          location: string | null
          meal_type: string
          name: string
          notes: string | null
          scheduled_time: string
          sort_order: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          expected_guests?: number
          id?: string
          location?: string | null
          meal_type: string
          name: string
          notes?: string | null
          scheduled_time: string
          sort_order?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          expected_guests?: number
          id?: string
          location?: string | null
          meal_type?: string
          name?: string
          notes?: string | null
          scheduled_time?: string
          sort_order?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_meal_schedule_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_menu_items: {
        Row: {
          allergens: string[] | null
          created_at: string
          description: string | null
          id: string
          is_gluten_free: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          meal_type: string
          name: string
          servings: number
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allergens?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_gluten_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          meal_type: string
          name: string
          servings?: number
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allergens?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_gluten_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          meal_type?: string
          name?: string
          servings?: number
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_menu_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_vendors: {
        Row: {
          address: string | null
          contact_name: string | null
          contract_value: number | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          status: string
          updated_at: string
          vendor_type: string
          workspace_id: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          contract_value?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
          vendor_type: string
          workspace_id: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          contract_value?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
          vendor_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_vendors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "workspace_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_messages: {
        Row: {
          attachments: Json | null
          channel_id: string
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          sender_id: string
          sender_name: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id: string
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          sender_id: string
          sender_name?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          sender_id?: string
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "workspace_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      event_page_views: {
        Row: {
          created_at: string
          event_id: string
          id: string
          ip_hash: string | null
          referrer: string | null
          section_viewed: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          section_viewed?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          section_viewed?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_page_views_event_id_fkey"
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
          category: Database["public"]["Enums"]["event_category"] | null
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
          slug: string | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          branding?: Json | null
          canvas_state?: Json | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
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
          slug?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          branding?: Json | null
          canvas_state?: Json | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
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
          slug?: string | null
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
      promo_codes: {
        Row: {
          applicable_tier_ids: string[] | null
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          event_id: string
          id: string
          is_active: boolean
          max_quantity: number | null
          max_uses: number | null
          min_quantity: number | null
          name: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_tier_ids?: string[] | null
          code: string
          created_at?: string
          current_uses?: number
          discount_type: string
          discount_value: number
          event_id: string
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          max_uses?: number | null
          min_quantity?: number | null
          name?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_tier_ids?: string[] | null
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          event_id?: string
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          max_uses?: number | null
          min_quantity?: number | null
          name?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_attendees: {
        Row: {
          created_at: string
          custom_fields: Json | null
          email: string | null
          full_name: string | null
          id: string
          is_primary: boolean
          phone: string | null
          registration_id: string
          ticket_tier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean
          phone?: string | null
          registration_id: string
          ticket_tier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean
          phone?: string | null
          registration_id?: string
          ticket_tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_attendees_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          created_at: string
          discount_amount: number | null
          event_id: string
          form_responses: Json
          id: string
          promo_code_id: string | null
          quantity: number
          status: Database["public"]["Enums"]["registration_status"]
          subtotal: number | null
          ticket_tier_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          event_id: string
          form_responses?: Json
          id?: string
          promo_code_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["registration_status"]
          subtotal?: number | null
          ticket_tier_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          event_id?: string
          form_responses?: Json
          id?: string
          promo_code_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["registration_status"]
          subtotal?: number | null
          ticket_tier_id?: string | null
          total_amount?: number | null
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
          {
            foreignKeyName: "registrations_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
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
      ticket_tiers: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          price: number
          quantity: number | null
          sale_end: string | null
          sale_start: string | null
          sold_count: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          quantity?: number | null
          sale_end?: string | null
          sale_start?: string | null
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          quantity?: number | null
          sale_end?: string | null
          sale_start?: string | null
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      volunteer_assignments: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          hours_logged: number | null
          id: string
          notes: string | null
          shift_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          hours_logged?: number | null
          id?: string
          notes?: string | null
          shift_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          hours_logged?: number | null
          id?: string
          notes?: string | null
          shift_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "volunteer_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_shifts: {
        Row: {
          created_at: string
          date: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          name: string
          required_volunteers: number
          start_time: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          name: string
          required_volunteers?: number
          start_time: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          name?: string
          required_volunteers?: number
          start_time?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_shifts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_access_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          priority: string | null
          requested_role: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          priority?: string | null
          requested_role?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          priority?: string | null
          requested_role?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_access_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
          priority: string | null
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
          priority?: string | null
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
          priority?: string | null
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
      workspace_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean | null
          metadata: Json | null
          name: string
          type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          metadata?: Json | null
          name: string
          type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          metadata?: Json | null
          name?: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_channels_workspace_id_fkey"
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
          delegated_at: string | null
          delegated_by: string | null
          delegated_from_workspace_id: string | null
          delegation_status: string | null
          due_date: string | null
          id: string
          is_template: boolean | null
          items: Json
          phase: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          committee_type?: string | null
          created_at?: string
          delegated_at?: string | null
          delegated_by?: string | null
          delegated_from_workspace_id?: string | null
          delegation_status?: string | null
          due_date?: string | null
          id?: string
          is_template?: boolean | null
          items?: Json
          phase?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          committee_type?: string | null
          created_at?: string
          delegated_at?: string | null
          delegated_by?: string | null
          delegated_from_workspace_id?: string | null
          delegation_status?: string | null
          due_date?: string | null
          id?: string
          is_template?: boolean | null
          items?: Json
          phase?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_checklists_delegated_from_workspace_id_fkey"
            columns: ["delegated_from_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_checklists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_content_items: {
        Row: {
          author_id: string | null
          author_name: string | null
          content_url: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_content_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_custom_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          priority: string | null
          tags: string[] | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          priority?: string | null
          tags?: string[] | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          priority?: string | null
          tags?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_custom_templates_workspace_id_fkey"
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
      workspace_integrations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          notification_types: string[] | null
          platform: string
          updated_at: string | null
          webhook_url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_types?: string[] | null
          platform: string
          updated_at?: string | null
          webhook_url: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_types?: string[] | null
          platform?: string
          updated_at?: string | null
          webhook_url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          custom_message: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          status: string | null
          token: string | null
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          custom_message?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role: string
          status?: string | null
          token?: string | null
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          custom_message?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string | null
          token?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_media_assets: {
        Row: {
          created_at: string
          description: string | null
          file_size: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          uploaded_by: string | null
          uploader_name: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          uploaded_by?: string | null
          uploader_name?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          uploaded_by?: string | null
          uploader_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_media_assets_workspace_id_fkey"
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
      workspace_resource_requests: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          priority: string | null
          purpose: string | null
          quantity: number
          requested_by: string
          requesting_workspace_id: string
          resource_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: string
          target_workspace_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          priority?: string | null
          purpose?: string | null
          quantity: number
          requested_by: string
          requesting_workspace_id: string
          resource_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          target_workspace_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          priority?: string | null
          purpose?: string | null
          quantity?: number
          requested_by?: string
          requesting_workspace_id?: string
          resource_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          target_workspace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_resource_requests_requesting_workspace_id_fkey"
            columns: ["requesting_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_resource_requests_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "workspace_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_resource_requests_target_workspace_id_fkey"
            columns: ["target_workspace_id"]
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
          auto_archive_after_event: boolean | null
          auto_archive_days_after: number | null
          created_at: string
          default_task_priority: string | null
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
          auto_archive_after_event?: boolean | null
          auto_archive_days_after?: number | null
          created_at?: string
          default_task_priority?: string | null
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
          auto_archive_after_event?: boolean | null
          auto_archive_days_after?: number | null
          created_at?: string
          default_task_priority?: string | null
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
      workspace_speakers: {
        Row: {
          accommodation_arranged: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          session_time: string | null
          session_title: string | null
          status: string
          travel_arranged: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accommodation_arranged?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          session_time?: string | null
          session_title?: string | null
          status?: string
          travel_arranged?: boolean | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accommodation_arranged?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          session_time?: string | null
          session_title?: string | null
          status?: string
          travel_arranged?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_speakers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subtasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          parent_task_id: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          parent_task_id: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          parent_task_id?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_task_drafts: {
        Row: {
          created_at: string
          draft_data: Json
          id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          draft_data?: Json
          id?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          draft_data?: Json
          id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_task_drafts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tasks: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          location: string | null
          priority: string
          progress: number | null
          role_scope: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          priority?: string
          progress?: number | null
          role_scope?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          priority?: string
          progress?: number | null
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
      workspace_time_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          hours: number
          id: string
          status: string
          task_id: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          hours: number
          id?: string
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          hours?: number
          id?: string
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_time_entries_workspace_id_fkey"
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
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
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_public_organization: {
        Args: { _slug: string }
        Returns: {
          banner_url: string
          category: string
          city: string
          country: string
          description: string
          id: string
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
          seo_description: string
          seo_image_url: string
          seo_title: string
          slug: string
          state: string
          verification_status: string
          website: string
        }[]
      }
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
      get_public_profile_basic: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          id: string
          organization: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_access: {
        Args: { _user_id?: string; _workspace_id: string }
        Returns: boolean
      }
      is_org_admin_for_org: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id?: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner: {
        Args: { _user_id?: string; _workspace_id: string }
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
      event_category:
        | "HACKATHON"
        | "BOOTCAMP"
        | "WORKSHOP"
        | "CONFERENCE"
        | "MEETUP"
        | "STARTUP_PITCH"
        | "HIRING_CHALLENGE"
        | "WEBINAR"
        | "COMPETITION"
        | "OTHER"
        | "SEMINAR"
        | "SYMPOSIUM"
        | "CULTURAL_FEST"
        | "SPORTS_EVENT"
        | "ORIENTATION"
        | "ALUMNI_MEET"
        | "CAREER_FAIR"
        | "LECTURE"
        | "QUIZ"
        | "DEBATE"
        | "PRODUCT_LAUNCH"
        | "TOWN_HALL"
        | "TEAM_BUILDING"
        | "TRAINING"
        | "AWARDS_CEREMONY"
        | "OFFSITE"
        | "NETWORKING"
        | "TRADE_SHOW"
        | "EXPO"
        | "SUMMIT"
        | "PANEL_DISCUSSION"
        | "DEMO_DAY"
        | "FUNDRAISER"
        | "GALA"
        | "CHARITY_EVENT"
        | "VOLUNTEER_DRIVE"
        | "AWARENESS_CAMPAIGN"
        | "CONCERT"
        | "EXHIBITION"
        | "FESTIVAL"
        | "SOCIAL_GATHERING"
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
      event_category: [
        "HACKATHON",
        "BOOTCAMP",
        "WORKSHOP",
        "CONFERENCE",
        "MEETUP",
        "STARTUP_PITCH",
        "HIRING_CHALLENGE",
        "WEBINAR",
        "COMPETITION",
        "OTHER",
        "SEMINAR",
        "SYMPOSIUM",
        "CULTURAL_FEST",
        "SPORTS_EVENT",
        "ORIENTATION",
        "ALUMNI_MEET",
        "CAREER_FAIR",
        "LECTURE",
        "QUIZ",
        "DEBATE",
        "PRODUCT_LAUNCH",
        "TOWN_HALL",
        "TEAM_BUILDING",
        "TRAINING",
        "AWARDS_CEREMONY",
        "OFFSITE",
        "NETWORKING",
        "TRADE_SHOW",
        "EXPO",
        "SUMMIT",
        "PANEL_DISCUSSION",
        "DEMO_DAY",
        "FUNDRAISER",
        "GALA",
        "CHARITY_EVENT",
        "VOLUNTEER_DRIVE",
        "AWARENESS_CAMPAIGN",
        "CONCERT",
        "EXHIBITION",
        "FESTIVAL",
        "SOCIAL_GATHERING",
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
