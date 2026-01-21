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
      accessibility_settings: {
        Row: {
          bold_text_enabled: boolean | null
          created_at: string | null
          high_contrast_enabled: boolean | null
          id: string
          larger_touch_targets: boolean | null
          reduce_motion_enabled: boolean | null
          screen_reader_optimized: boolean | null
          text_scale_factor: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bold_text_enabled?: boolean | null
          created_at?: string | null
          high_contrast_enabled?: boolean | null
          id?: string
          larger_touch_targets?: boolean | null
          reduce_motion_enabled?: boolean | null
          screen_reader_optimized?: boolean | null
          text_scale_factor?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bold_text_enabled?: boolean | null
          created_at?: string | null
          high_contrast_enabled?: boolean | null
          id?: string
          larger_touch_targets?: boolean | null
          reduce_motion_enabled?: boolean | null
          screen_reader_optimized?: boolean | null
          text_scale_factor?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      automation_execution_logs: {
        Row: {
          action_taken: string
          error_message: string | null
          id: string
          metadata: Json | null
          rule_id: string
          success: boolean
          task_id: string
          triggered_at: string
        }
        Insert: {
          action_taken: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          rule_id: string
          success?: boolean
          task_id: string
          triggered_at?: string
        }
        Update: {
          action_taken?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          rule_id?: string
          success?: boolean
          task_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_execution_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "workspace_automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_execution_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          description: string
          icon: string
          id: string
          name: string
          points_required: number
          rarity: string
        }
        Insert: {
          category: string
          description: string
          icon: string
          id?: string
          name: string
          points_required?: number
          rarity?: string
        }
        Update: {
          category?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points_required?: number
          rarity?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_at: string | null
          blocked_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      booth_visits: {
        Row: {
          booth_id: string
          collected_swag: boolean | null
          id: string
          notes: string | null
          scanned_qr: boolean | null
          user_id: string
          visited_at: string
        }
        Insert: {
          booth_id: string
          collected_swag?: boolean | null
          id?: string
          notes?: string | null
          scanned_qr?: boolean | null
          user_id: string
          visited_at?: string
        }
        Update: {
          booth_id?: string
          collected_swag?: boolean | null
          id?: string
          notes?: string | null
          scanned_qr?: boolean | null
          user_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_visits_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "sponsor_booths"
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
      catering_headcount_confirmations: {
        Row: {
          confirmation_deadline: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          confirmed_by_name: string | null
          confirmed_count: number | null
          created_at: string | null
          event_id: string | null
          expected_count: number
          id: string
          meal_date: string
          meal_name: string
          meal_schedule_id: string | null
          meal_type: string
          notes: string | null
          status: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_by_name?: string | null
          confirmed_count?: number | null
          created_at?: string | null
          event_id?: string | null
          expected_count?: number
          id?: string
          meal_date: string
          meal_name: string
          meal_schedule_id?: string | null
          meal_type?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_by_name?: string | null
          confirmed_count?: number | null
          created_at?: string | null
          event_id?: string | null
          expected_count?: number
          id?: string
          meal_date?: string
          meal_name?: string
          meal_schedule_id?: string | null
          meal_type?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_headcount_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catering_headcount_confirmations_meal_schedule_id_fkey"
            columns: ["meal_schedule_id"]
            isOneToOne: false
            referencedRelation: "catering_meal_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catering_headcount_confirmations_workspace_id_fkey"
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
          workspace_id: string | null
        }
        Insert: {
          conditions?: Json
          created_at?: string
          event_id: string
          id?: string
          type: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string
          event_id?: string
          id?: string
          type?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_criteria_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_criteria_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_delegation: {
        Row: {
          can_define_criteria: boolean | null
          can_design_templates: boolean | null
          can_distribute: boolean | null
          can_generate: boolean | null
          delegated_at: string | null
          delegated_by: string | null
          delegated_workspace_id: string
          id: string
          notes: string | null
          root_workspace_id: string
        }
        Insert: {
          can_define_criteria?: boolean | null
          can_design_templates?: boolean | null
          can_distribute?: boolean | null
          can_generate?: boolean | null
          delegated_at?: string | null
          delegated_by?: string | null
          delegated_workspace_id: string
          id?: string
          notes?: string | null
          root_workspace_id: string
        }
        Update: {
          can_define_criteria?: boolean | null
          can_design_templates?: boolean | null
          can_distribute?: boolean | null
          can_generate?: boolean | null
          delegated_at?: string | null
          delegated_by?: string | null
          delegated_workspace_id?: string
          id?: string
          notes?: string | null
          root_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_delegation_delegated_workspace_id_fkey"
            columns: ["delegated_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_delegation_root_workspace_id_fkey"
            columns: ["root_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          background_url: string | null
          branding: Json
          content: Json
          created_at: string | null
          created_by: string | null
          event_id: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          signature_url: string | null
          type: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          background_url?: string | null
          branding?: Json
          content?: Json
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          signature_url?: string | null
          type: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          background_url?: string | null
          branding?: Json
          content?: Json
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          signature_url?: string | null
          type?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          template_id: string | null
          type: string
          updated_at: string
          workspace_id: string | null
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
          template_id?: string | null
          type: string
          updated_at?: string
          workspace_id?: string | null
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
          template_id?: string | null
          type?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          cleared_at: string | null
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          muted_until: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          channel_id: string
          cleared_at?: string | null
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          muted_until?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          channel_id?: string
          cleared_at?: string | null
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          muted_until?: string | null
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
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          invited_by: string | null
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          muted_until: string | null
          nickname: string | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          invited_by?: string | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          muted_until?: string | null
          nickname?: string | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          invited_by?: string | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          muted_until?: string | null
          nickname?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          icon_url: string | null
          id: string
          is_public: boolean | null
          max_members: number | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_security_settings: {
        Row: {
          app_lock_enabled: boolean | null
          created_at: string | null
          hide_message_preview_locked: boolean | null
          id: string
          incognito_keyboard: boolean | null
          lock_timeout_minutes: number | null
          require_biometric: boolean | null
          screenshot_protection: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_lock_enabled?: boolean | null
          created_at?: string | null
          hide_message_preview_locked?: boolean | null
          id?: string
          incognito_keyboard?: boolean | null
          lock_timeout_minutes?: number | null
          require_biometric?: boolean | null
          screenshot_protection?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_lock_enabled?: boolean | null
          created_at?: string | null
          hide_message_preview_locked?: boolean | null
          id?: string
          incognito_keyboard?: boolean | null
          lock_timeout_minutes?: number | null
          require_biometric?: boolean | null
          screenshot_protection?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checklist_deadline_extensions: {
        Row: {
          checklist_id: string
          created_at: string | null
          current_due_date: string | null
          id: string
          justification: string
          requested_at: string | null
          requested_by: string
          requested_due_date: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          current_due_date?: string | null
          id?: string
          justification: string
          requested_at?: string | null
          requested_by: string
          requested_due_date: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          current_due_date?: string | null
          id?: string
          justification?: string
          requested_at?: string | null
          requested_by?: string
          requested_due_date?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_deadline_extensions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "workspace_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          circle_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_messages: {
        Row: {
          circle_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          circle_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_messages_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string | null
          icon: string
          id: string
          is_private: boolean
          is_public: boolean
          max_members: number | null
          member_count: number
          name: string
          tags: string[] | null
          type: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          icon?: string
          id?: string
          is_private?: boolean
          is_public?: boolean
          max_members?: number | null
          member_count?: number
          name: string
          tags?: string[] | null
          type?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          icon?: string
          id?: string
          is_private?: boolean
          is_public?: boolean
          max_members?: number | null
          member_count?: number
          name?: string
          tags?: string[] | null
          type?: string
        }
        Relationships: []
      }
      competition_badges: {
        Row: {
          badge_type: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
          points_value: number | null
          rarity: string | null
        }
        Insert: {
          badge_type: string
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
          points_value?: number | null
          rarity?: string | null
        }
        Update: {
          badge_type?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points_value?: number | null
          rarity?: string | null
        }
        Relationships: []
      }
      competition_presence: {
        Row: {
          created_at: string | null
          current_question_id: string | null
          event_id: string
          id: string
          is_online: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_question_id?: string | null
          event_id: string
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_question_id?: string | null
          event_id?: string
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_presence_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "competition_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_presence_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_questions: {
        Row: {
          activated_at: string | null
          correct_option_index: number
          created_at: string
          id: string
          options: Json
          points: number
          question: string
          question_number: number
          round_id: string
          status: string
          time_limit_seconds: number | null
        }
        Insert: {
          activated_at?: string | null
          correct_option_index?: number
          created_at?: string
          id?: string
          options?: Json
          points?: number
          question: string
          question_number?: number
          round_id: string
          status?: string
          time_limit_seconds?: number | null
        }
        Update: {
          activated_at?: string | null
          correct_option_index?: number
          created_at?: string
          id?: string
          options?: Json
          points?: number
          question?: string
          question_number?: number
          round_id?: string
          status?: string
          time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "competition_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          response_time_ms: number | null
          selected_option: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id: string
          response_time_ms?: number | null
          selected_option: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          response_time_ms?: number | null
          selected_option?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "competition_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_rounds: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_id: string
          id: string
          max_participants: number | null
          name: string
          round_number: number
          start_time: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          max_participants?: number | null
          name: string
          round_number?: number
          start_time?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          max_participants?: number | null
          name?: string
          round_number?: number
          start_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_scores: {
        Row: {
          best_streak: number
          correct_answers: number
          current_streak: number
          event_id: string
          id: string
          last_updated: string
          team_id: string | null
          total_answers: number
          total_score: number
          user_id: string
        }
        Insert: {
          best_streak?: number
          correct_answers?: number
          current_streak?: number
          event_id: string
          id?: string
          last_updated?: string
          team_id?: string | null
          total_answers?: number
          total_score?: number
          user_id: string
        }
        Update: {
          best_streak?: number
          correct_answers?: number
          current_streak?: number
          event_id?: string
          id?: string
          last_updated?: string
          team_id?: string | null
          total_answers?: number
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_team_scores: {
        Row: {
          average_score: number | null
          best_streak: number | null
          correct_answers: number | null
          event_id: string
          id: string
          last_updated: string | null
          member_count: number | null
          team_id: string
          total_answers: number | null
          total_score: number | null
        }
        Insert: {
          average_score?: number | null
          best_streak?: number | null
          correct_answers?: number | null
          event_id: string
          id?: string
          last_updated?: string | null
          member_count?: number | null
          team_id: string
          total_answers?: number | null
          total_score?: number | null
        }
        Update: {
          average_score?: number | null
          best_streak?: number | null
          correct_answers?: number | null
          event_id?: string
          id?: string
          last_updated?: string | null
          member_count?: number | null
          team_id?: string
          total_answers?: number | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_team_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_team_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connection_type: string
          created_at: string
          id: string
          match_score: number | null
          message: string | null
          receiver_id: string
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          id?: string
          match_score?: number | null
          message?: string | null
          receiver_id: string
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          id?: string
          match_score?: number | null
          message?: string | null
          receiver_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      consent_audit_log: {
        Row: {
          action: string
          category_key: string
          consent_version: string
          created_at: string
          id: string
          ip_address_hash: string | null
          new_value: boolean
          previous_value: boolean | null
          source: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          category_key: string
          consent_version: string
          created_at?: string
          id?: string
          ip_address_hash?: string | null
          new_value: boolean
          previous_value?: boolean | null
          source?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          category_key?: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address_hash?: string | null
          new_value?: boolean
          previous_value?: boolean | null
          source?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consent_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_required: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_exchanges: {
        Row: {
          created_at: string
          event_id: string
          id: string
          shared_fields: Json
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          shared_fields?: Json
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          shared_fields?: Json
          target_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_exchanges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      content_approval_stages: {
        Row: {
          approval_id: string
          created_at: string | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          stage: string
          status: string
        }
        Insert: {
          approval_id: string
          created_at?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          stage: string
          status?: string
        }
        Update: {
          approval_id?: string
          created_at?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approval_stages_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "content_approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      content_approvals: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          current_stage: string
          description: string | null
          id: string
          metadata: Json | null
          priority: string | null
          scheduled_publish_at: string | null
          source_committee: string | null
          submitted_at: string | null
          submitted_by: string | null
          target_platforms: string[] | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          current_stage?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          scheduled_publish_at?: string | null
          source_committee?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          target_platforms?: string[] | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          current_stage?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          scheduled_publish_at?: string | null
          source_committee?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          target_platforms?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_discovers: {
        Row: {
          created_at: string | null
          date: string
          discovered_user_id: string
          id: string
          match_score: number
          user_id: string
          viewed: boolean | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          discovered_user_id: string
          id?: string
          match_score?: number
          user_id: string
          viewed?: boolean | null
        }
        Update: {
          created_at?: string | null
          date?: string
          discovered_user_id?: string
          id?: string
          match_score?: number
          user_id?: string
          viewed?: boolean | null
        }
        Relationships: []
      }
      data_retention_settings: {
        Row: {
          activity_retention_days: number | null
          auto_delete_enabled: boolean | null
          created_at: string | null
          id: string
          message_retention_days: number | null
          search_history_retention_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_retention_days?: number | null
          auto_delete_enabled?: boolean | null
          created_at?: string | null
          id?: string
          message_retention_days?: number | null
          search_history_retention_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_retention_days?: number | null
          auto_delete_enabled?: boolean | null
          created_at?: string | null
          id?: string
          message_retention_days?: number | null
          search_history_retention_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          request_type: string
          requested_at: string
          response_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type: string
          requested_at?: string
          response_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type?: string
          requested_at?: string
          response_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disappearing_message_settings: {
        Row: {
          channel_id: string
          created_at: string | null
          duration_seconds: number
          enabled: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          duration_seconds?: number
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          duration_seconds?: number
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          include_qr_code: boolean | null
          is_default: boolean | null
          name: string
          subject: string
          updated_at: string
          variables: string[] | null
          workspace_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          include_qr_code?: boolean | null
          is_default?: boolean | null
          name: string
          subject: string
          updated_at?: string
          variables?: string[] | null
          workspace_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          include_qr_code?: boolean | null
          is_default?: boolean | null
          name?: string
          subject?: string
          updated_at?: string
          variables?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      event_announcements: {
        Row: {
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string
          event_id: string
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          title: string
          type: string
        }
        Insert: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          title: string
          type?: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_announcements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checkins: {
        Row: {
          checkin_date: string
          checkin_time: string
          checkout_time: string | null
          created_at: string | null
          event_id: string
          id: string
          location: string | null
          user_id: string
        }
        Insert: {
          checkin_date?: string
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          location?: string | null
          user_id: string
        }
        Update: {
          checkin_date?: string
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          location?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_drafts: {
        Row: {
          created_at: string
          draft_data: Json
          event_id: string | null
          id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft_data?: Json
          event_id?: string | null
          id?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draft_data?: Json
          event_id?: string | null
          id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_drafts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_icebreakers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          order_index: number
          question: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          order_index?: number
          question: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_icebreakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_materials: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string
          external_link: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_downloadable: boolean | null
          is_public: boolean | null
          material_type: string
          session_id: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id: string
          external_link?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean | null
          is_public?: boolean | null
          material_type: string
          session_id?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string
          external_link?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean | null
          is_public?: boolean | null
          material_type?: string
          session_id?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_materials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      event_poll_options: {
        Row: {
          created_at: string | null
          id: string
          poll_id: string
          text: string
          vote_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_id: string
          text: string
          vote_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_id?: string
          text?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      event_poll_votes: {
        Row: {
          id: string
          option_id: string
          poll_id: string
          user_id: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          option_id: string
          poll_id: string
          user_id: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "event_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      event_polls: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_publish_requests: {
        Row: {
          checklist_snapshot: Json | null
          created_at: string
          event_id: string
          id: string
          priority: string | null
          requested_at: string
          requested_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          checklist_snapshot?: Json | null
          created_at?: string
          event_id: string
          id?: string
          priority?: string | null
          requested_at?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          checklist_snapshot?: Json | null
          created_at?: string
          event_id?: string
          id?: string
          priority?: string | null
          requested_at?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_publish_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_publish_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          attendee_count: number | null
          created_at: string
          description: string | null
          end_time: string
          event_id: string
          id: string
          is_published: boolean | null
          location: string | null
          room: string | null
          speaker_avatar: string | null
          speaker_name: string | null
          start_time: string
          status: string
          stream_url: string | null
          tags: string[] | null
          title: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          attendee_count?: number | null
          created_at?: string
          description?: string | null
          end_time: string
          event_id: string
          id?: string
          is_published?: boolean | null
          location?: string | null
          room?: string | null
          speaker_avatar?: string | null
          speaker_name?: string | null
          start_time: string
          status?: string
          stream_url?: string | null
          tags?: string[] | null
          title: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          attendee_count?: number | null
          created_at?: string
          description?: string | null
          end_time?: string
          event_id?: string
          id?: string
          is_published?: boolean | null
          location?: string | null
          room?: string | null
          speaker_avatar?: string | null
          speaker_name?: string | null
          start_time?: string
          status?: string
          stream_url?: string | null
          tags?: string[] | null
          title?: string
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "event_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      event_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          event_id: string
          id: string
          new_status: string
          previous_status: string
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          new_status: string
          previous_status: string
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          new_status?: string
          previous_status?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_status_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tracks: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          event_id: string
          icon: string | null
          id: string
          location: string | null
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          icon?: string | null
          id?: string
          location?: string | null
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          icon?: string | null
          id?: string
          location?: string | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tracks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_waitlist: {
        Row: {
          created_at: string
          email: string
          event_id: string
          full_name: string
          id: string
          invited_at: string | null
          notes: string | null
          phone: string | null
          position: number
          priority: string
          promoted_at: string | null
          referred_by: string | null
          registration_id: string | null
          source: string
          status: string
          ticket_tier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          full_name: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          phone?: string | null
          position: number
          priority?: string
          promoted_at?: string | null
          referred_by?: string | null
          registration_id?: string | null
          source?: string
          status?: string
          ticket_tier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          phone?: string | null
          position?: number
          priority?: string
          promoted_at?: string | null
          referred_by?: string | null
          registration_id?: string | null
          source?: string
          status?: string
          ticket_tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlist_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlist_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
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
      export_history: {
        Row: {
          created_at: string
          event_id: string
          fields: string[]
          filename: string
          filters: Json | null
          format: string
          id: string
          record_count: number
          status: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          fields?: string[]
          filename: string
          filters?: Json | null
          format: string
          id?: string
          record_count?: number
          status?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          fields?: string[]
          filename?: string
          filters?: Json | null
          format?: string
          id?: string
          record_count?: number
          status?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          feature_type: string
          id: string
          target_user_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          feature_type: string
          id?: string
          target_user_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          feature_type?: string
          id?: string
          target_user_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_events: {
        Row: {
          actor_id: string
          actor_name: string | null
          created_at: string | null
          event_type: string
          group_id: string
          id: string
          new_value: string | null
          old_value: string | null
          target_id: string | null
          target_name: string | null
        }
        Insert: {
          actor_id: string
          actor_name?: string | null
          created_at?: string | null
          event_type: string
          group_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
          target_name?: string | null
        }
        Update: {
          actor_id?: string
          actor_name?: string | null
          created_at?: string | null
          event_type?: string
          group_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
          target_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_deadlines: {
        Row: {
          created_at: string
          deadline_at: string
          deadline_type: string
          description: string | null
          event_id: string
          id: string
          is_mandatory: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          deadline_at: string
          deadline_type: string
          description?: string | null
          event_id: string
          id?: string
          is_mandatory?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          deadline_at?: string
          deadline_type?: string
          description?: string | null
          event_id?: string
          id?: string
          is_mandatory?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_deadlines_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_submissions: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string | null
          event_id: string
          feedback: string | null
          id: string
          is_draft: boolean | null
          judging_status: string | null
          presentation_url: string | null
          project_name: string
          repo_url: string | null
          score: number | null
          screenshots: string[] | null
          submitted_at: string | null
          team_id: string
          tech_stack: string[] | null
          track: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          event_id: string
          feedback?: string | null
          id?: string
          is_draft?: boolean | null
          judging_status?: string | null
          presentation_url?: string | null
          project_name: string
          repo_url?: string | null
          score?: number | null
          screenshots?: string[] | null
          submitted_at?: string | null
          team_id: string
          tech_stack?: string[] | null
          track?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          event_id?: string
          feedback?: string | null
          id?: string
          is_draft?: boolean | null
          judging_status?: string | null
          presentation_url?: string | null
          project_name?: string
          repo_url?: string | null
          score?: number | null
          screenshots?: string[] | null
          submitted_at?: string | null
          team_id?: string
          tech_stack?: string[] | null
          track?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_team_members: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          skills: string[] | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          skills?: string[] | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          skills?: string[] | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_teams: {
        Row: {
          chat_group_id: string | null
          created_at: string
          created_by: string
          description: string | null
          event_id: string
          id: string
          is_looking_for_members: boolean | null
          looking_for_roles: string[] | null
          max_members: number | null
          name: string
          project_idea: string | null
          tech_stack: string[] | null
          updated_at: string
        }
        Insert: {
          chat_group_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_id: string
          id?: string
          is_looking_for_members?: boolean | null
          looking_for_roles?: string[] | null
          max_members?: number | null
          name: string
          project_idea?: string | null
          tech_stack?: string[] | null
          updated_at?: string
        }
        Update: {
          chat_group_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_id?: string
          id?: string
          is_looking_for_members?: boolean | null
          looking_for_roles?: string[] | null
          max_members?: number | null
          name?: string
          project_idea?: string | null
          tech_stack?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_teams_chat_group_id_fkey"
            columns: ["chat_group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      icebreaker_answers: {
        Row: {
          answer: string
          created_at: string
          icebreaker_id: string
          id: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          icebreaker_id: string
          id?: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          icebreaker_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "icebreaker_answers_icebreaker_id_fkey"
            columns: ["icebreaker_id"]
            isOneToOne: false
            referencedRelation: "event_icebreakers"
            referencedColumns: ["id"]
          },
        ]
      }
      id_card_print_jobs: {
        Row: {
          attendee_filter: Json | null
          attendee_ids: string[] | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          event_id: string
          generated_cards: number | null
          id: string
          name: string
          pdf_url: string | null
          status: string
          template_id: string
          total_cards: number | null
          workspace_id: string
        }
        Insert: {
          attendee_filter?: Json | null
          attendee_ids?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          event_id: string
          generated_cards?: number | null
          id?: string
          name: string
          pdf_url?: string | null
          status?: string
          template_id: string
          total_cards?: number | null
          workspace_id: string
        }
        Update: {
          attendee_filter?: Json | null
          attendee_ids?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          event_id?: string
          generated_cards?: number | null
          id?: string
          name?: string
          pdf_url?: string | null
          status?: string
          template_id?: string
          total_cards?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "id_card_print_jobs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_card_print_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "id_card_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_card_print_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      id_card_templates: {
        Row: {
          card_type: string | null
          created_at: string | null
          created_by: string | null
          design: Json
          dimensions: Json | null
          event_id: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          card_type?: string | null
          created_at?: string | null
          created_by?: string | null
          design?: Json
          dimensions?: Json | null
          event_id: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          card_type?: string | null
          created_at?: string | null
          created_by?: string | null
          design?: Json
          dimensions?: Json | null
          event_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "id_card_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_card_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_leaderboard: {
        Row: {
          event_id: string | null
          id: string
          rank: number
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          rank?: number
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string | null
          id?: string
          rank?: number
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      impact_profiles: {
        Row: {
          avatar_url: string | null
          badges: string[]
          bio: string | null
          boost_expires_at: string | null
          college: string | null
          created_at: string
          current_courses: string[] | null
          current_event_id: string | null
          education_status: string
          full_name: string
          graduation_year: number | null
          headline: string
          id: string
          impact_score: number
          interests: string[]
          is_boosted: boolean | null
          is_online: boolean
          is_premium: boolean | null
          is_verified: boolean | null
          last_seen: string
          last_streak_date: string | null
          level: number
          looking_for: string[]
          major: string | null
          organization: string | null
          relationship_status: string
          skills: string[]
          streak_actions_today: number | null
          streak_count: number | null
          super_like_count: number | null
          updated_at: string
          user_id: string
          verification_type: string | null
          verified_at: string | null
          vibe_emoji: string
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[]
          bio?: string | null
          boost_expires_at?: string | null
          college?: string | null
          created_at?: string
          current_courses?: string[] | null
          current_event_id?: string | null
          education_status?: string
          full_name: string
          graduation_year?: number | null
          headline?: string
          id?: string
          impact_score?: number
          interests?: string[]
          is_boosted?: boolean | null
          is_online?: boolean
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_seen?: string
          last_streak_date?: string | null
          level?: number
          looking_for?: string[]
          major?: string | null
          organization?: string | null
          relationship_status?: string
          skills?: string[]
          streak_actions_today?: number | null
          streak_count?: number | null
          super_like_count?: number | null
          updated_at?: string
          user_id: string
          verification_type?: string | null
          verified_at?: string | null
          vibe_emoji?: string
        }
        Update: {
          avatar_url?: string | null
          badges?: string[]
          bio?: string | null
          boost_expires_at?: string | null
          college?: string | null
          created_at?: string
          current_courses?: string[] | null
          current_event_id?: string | null
          education_status?: string
          full_name?: string
          graduation_year?: number | null
          headline?: string
          id?: string
          impact_score?: number
          interests?: string[]
          is_boosted?: boolean | null
          is_online?: boolean
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_seen?: string
          last_streak_date?: string | null
          level?: number
          looking_for?: string[]
          major?: string | null
          organization?: string | null
          relationship_status?: string
          skills?: string[]
          streak_actions_today?: number | null
          streak_count?: number | null
          super_like_count?: number | null
          updated_at?: string
          user_id?: string
          verification_type?: string | null
          verified_at?: string | null
          vibe_emoji?: string
        }
        Relationships: []
      }
      industry_template_usage: {
        Row: {
          created_at: string
          id: string
          import_options: Json | null
          tasks_imported: number
          template_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_options?: Json | null
          tasks_imported: number
          template_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          import_options?: Json | null
          tasks_imported?: number
          template_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "industry_template_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      locale_settings: {
        Row: {
          created_at: string | null
          date_format: string | null
          id: string
          language_code: string | null
          region_code: string | null
          time_format: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_format?: string | null
          id?: string
          language_code?: string | null
          region_code?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_format?: string | null
          id?: string
          language_code?: string | null
          region_code?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string | null
          email: string | null
          failure_reason: string | null
          id: string
          ip_address_hash: string | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address_hash?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address_hash?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      login_history: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          location: string | null
          os: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          os?: string | null
          success?: boolean
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          os?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      material_downloads: {
        Row: {
          downloaded_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_downloads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "event_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_slots: {
        Row: {
          booked_at: string | null
          booked_by_team_id: string | null
          created_at: string
          event_id: string
          expertise: string[] | null
          id: string
          is_virtual: boolean | null
          location: string | null
          meeting_link: string | null
          mentor_avatar: string | null
          mentor_id: string
          mentor_name: string
          notes: string | null
          slot_end: string
          slot_start: string
          status: string | null
        }
        Insert: {
          booked_at?: string | null
          booked_by_team_id?: string | null
          created_at?: string
          event_id: string
          expertise?: string[] | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          meeting_link?: string | null
          mentor_avatar?: string | null
          mentor_id: string
          mentor_name: string
          notes?: string | null
          slot_end: string
          slot_start: string
          status?: string | null
        }
        Update: {
          booked_at?: string | null
          booked_by_team_id?: string | null
          created_at?: string
          event_id?: string
          expertise?: string[] | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          meeting_link?: string | null
          mentor_avatar?: string | null
          mentor_id?: string
          mentor_name?: string
          notes?: string | null
          slot_end?: string
          slot_start?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_slots_booked_by_team_id_fkey"
            columns: ["booked_by_team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          message_id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          message_id: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          message_id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          channel_id: string
          content: string
          deleted_at: string | null
          edited_at: string | null
          group_id: string | null
          id: string
          is_deleted: boolean | null
          sender_avatar: string | null
          sender_id: string
          sender_name: string
          sent_at: string
        }
        Insert: {
          attachments?: Json | null
          channel_id: string
          content?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          is_deleted?: boolean | null
          sender_avatar?: string | null
          sender_id: string
          sender_name: string
          sent_at?: string
        }
        Update: {
          attachments?: Json | null
          channel_id?: string
          content?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          is_deleted?: boolean | null
          sender_avatar?: string | null
          sender_id?: string
          sender_name?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_meetings: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string | null
          proposed_location: string | null
          proposed_time: string
          receiver_id: string
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message?: string | null
          proposed_location?: string | null
          proposed_time: string
          receiver_id: string
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string | null
          proposed_location?: string | null
          proposed_time?: string
          receiver_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "networking_meetings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_security_alerts: boolean | null
          event_enabled: boolean
          id: string
          marketplace_enabled: boolean
          organization_enabled: boolean
          security_alerts_enabled: boolean | null
          sound_enabled: boolean
          system_enabled: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
          workspace_enabled: boolean
        }
        Insert: {
          created_at?: string
          email_security_alerts?: boolean | null
          event_enabled?: boolean
          id?: string
          marketplace_enabled?: boolean
          organization_enabled?: boolean
          security_alerts_enabled?: boolean | null
          sound_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
          workspace_enabled?: boolean
        }
        Update: {
          created_at?: string
          email_security_alerts?: boolean | null
          event_enabled?: boolean
          id?: string
          marketplace_enabled?: boolean
          organization_enabled?: boolean
          security_alerts_enabled?: boolean | null
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
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
      page_builder_history: {
        Row: {
          action_type: string
          created_at: string | null
          event_id: string
          id: string
          new_content: Json | null
          previous_content: Json | null
          section_id: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          event_id: string
          id?: string
          new_content?: Json | null
          previous_content?: Json | null
          section_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          event_id?: string
          id?: string
          new_content?: Json | null
          previous_content?: Json | null
          section_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_builder_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_builder_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      page_builder_sections: {
        Row: {
          created_at: string | null
          css_content: string | null
          event_id: string
          html_content: string | null
          id: string
          locked_at: string | null
          locked_by_user_id: string | null
          owned_by_workspace_id: string | null
          section_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          css_content?: string | null
          event_id: string
          html_content?: string | null
          id?: string
          locked_at?: string | null
          locked_by_user_id?: string | null
          owned_by_workspace_id?: string | null
          section_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          css_content?: string | null
          event_id?: string
          html_content?: string | null
          id?: string
          locked_at?: string | null
          locked_by_user_id?: string | null
          owned_by_workspace_id?: string | null
          section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_builder_sections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_builder_sections_owned_by_workspace_id_fkey"
            columns: ["owned_by_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_messages: {
        Row: {
          channel_id: string
          id: string
          message_id: string
          pinned_at: string | null
          pinned_by: string
        }
        Insert: {
          channel_id: string
          id?: string
          message_id: string
          pinned_at?: string | null
          pinned_by: string
        }
        Update: {
          channel_id?: string
          id?: string
          message_id?: string
          pinned_at?: string | null
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          project_url: string | null
          skills: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_url?: string | null
          skills?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_url?: string | null
          skills?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_consents: {
        Row: {
          analytics_consent: boolean | null
          consent_version: string
          consented_at: string | null
          created_at: string | null
          essential_consent: boolean | null
          id: string
          ip_address_hash: string | null
          marketing_consent: boolean | null
          personalization_consent: boolean | null
          third_party_sharing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analytics_consent?: boolean | null
          consent_version?: string
          consented_at?: string | null
          created_at?: string | null
          essential_consent?: boolean | null
          id?: string
          ip_address_hash?: string | null
          marketing_consent?: boolean | null
          personalization_consent?: boolean | null
          third_party_sharing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analytics_consent?: boolean | null
          consent_version?: string
          consented_at?: string | null
          created_at?: string | null
          essential_consent?: boolean | null
          id?: string
          ip_address_hash?: string | null
          marketing_consent?: boolean | null
          personalization_consent?: boolean | null
          third_party_sharing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      privacy_policy_versions: {
        Row: {
          content: string
          created_at: string
          effective_date: string
          id: string
          is_active: boolean
          summary: string | null
          title: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          effective_date: string
          id?: string
          is_active?: boolean
          summary?: string | null
          title: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          effective_date?: string
          id?: string
          is_active?: boolean
          summary?: string | null
          title?: string
          version?: string
        }
        Relationships: []
      }
      profile_skips: {
        Row: {
          created_at: string
          id: string
          skipped_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skipped_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skipped_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_verifications: {
        Row: {
          id: string
          linked_account_id: string | null
          linked_account_url: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          selfie_url: string | null
          status: string
          submitted_at: string
          user_id: string
          verification_type: string
        }
        Insert: {
          id?: string
          linked_account_id?: string | null
          linked_account_url?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          user_id: string
          verification_type: string
        }
        Update: {
          id?: string
          linked_account_id?: string | null
          linked_account_url?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
          verification_type?: string
        }
        Relationships: []
      }
      profile_visibility_settings: {
        Row: {
          allow_connection_requests: boolean | null
          allow_messages_from: string | null
          contact_sync_discoverable: boolean | null
          created_at: string | null
          email_visibility: string | null
          id: string
          location_visibility: string | null
          phone_visibility: string | null
          profile_visibility: string | null
          searchable: boolean | null
          show_activity_status: boolean | null
          show_in_nearby: boolean | null
          show_in_suggestions: boolean | null
          show_profile_views: boolean | null
          show_social_links: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_connection_requests?: boolean | null
          allow_messages_from?: string | null
          contact_sync_discoverable?: boolean | null
          created_at?: string | null
          email_visibility?: string | null
          id?: string
          location_visibility?: string | null
          phone_visibility?: string | null
          profile_visibility?: string | null
          searchable?: boolean | null
          show_activity_status?: boolean | null
          show_in_nearby?: boolean | null
          show_in_suggestions?: boolean | null
          show_profile_views?: boolean | null
          show_social_links?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_connection_requests?: boolean | null
          allow_messages_from?: string | null
          contact_sync_discoverable?: boolean | null
          created_at?: string | null
          email_visibility?: string | null
          id?: string
          location_visibility?: string | null
          phone_visibility?: string | null
          profile_visibility?: string | null
          searchable?: boolean | null
          show_activity_status?: boolean | null
          show_in_nearby?: boolean | null
          show_in_suggestions?: boolean | null
          show_profile_views?: boolean | null
          show_social_links?: boolean | null
          updated_at?: string | null
          user_id?: string
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
      reserved_usernames: {
        Row: {
          created_at: string | null
          reason: string
          username: string
        }
        Insert: {
          created_at?: string | null
          reason: string
          username: string
        }
        Update: {
          created_at?: string | null
          reason?: string
          username?: string
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          reason: string | null
          resource_id: string | null
          resource_type: string | null
          role_type: string
          target_user_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          role_type: string
          target_user_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          role_type?: string
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      saved_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notes: string | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_profiles: {
        Row: {
          created_at: string
          id: string
          saved_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          saved_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          saved_user_id?: string
          user_id?: string
        }
        Relationships: []
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
      security_activity_logs: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          event_type: string
          id: string
          ip_address_hash: string | null
          location: string | null
          metadata: Json | null
          os: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          ip_address_hash?: string | null
          location?: string | null
          metadata?: Json | null
          os?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          ip_address_hash?: string | null
          location?: string | null
          metadata?: Json | null
          os?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_notification_preferences: {
        Row: {
          created_at: string | null
          email_on_2fa_change: boolean | null
          email_on_new_login: boolean | null
          email_on_password_change: boolean | null
          email_on_suspicious_activity: boolean | null
          id: string
          push_on_2fa_change: boolean | null
          push_on_new_login: boolean | null
          push_on_password_change: boolean | null
          push_on_suspicious_activity: boolean | null
          updated_at: string | null
          user_id: string
          weekly_security_digest: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_on_2fa_change?: boolean | null
          email_on_new_login?: boolean | null
          email_on_password_change?: boolean | null
          email_on_suspicious_activity?: boolean | null
          id?: string
          push_on_2fa_change?: boolean | null
          push_on_new_login?: boolean | null
          push_on_password_change?: boolean | null
          push_on_suspicious_activity?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_security_digest?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_on_2fa_change?: boolean | null
          email_on_new_login?: boolean | null
          email_on_password_change?: boolean | null
          email_on_suspicious_activity?: boolean | null
          id?: string
          push_on_2fa_change?: boolean | null
          push_on_new_login?: boolean | null
          push_on_password_change?: boolean | null
          push_on_suspicious_activity?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_security_digest?: boolean | null
        }
        Relationships: []
      }
      skill_endorsements: {
        Row: {
          created_at: string
          endorser_id: string
          id: string
          skill: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endorser_id: string
          id?: string
          skill: string
          user_id: string
        }
        Update: {
          created_at?: string
          endorser_id?: string
          id?: string
          skill?: string
          user_id?: string
        }
        Relationships: []
      }
      social_analytics_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          platform: string
          records_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          platform: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          platform?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_analytics_sync_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_queue: {
        Row: {
          approval_id: string | null
          created_at: string | null
          error_message: string | null
          external_post_id: string | null
          id: string
          platform: string
          posted_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          social_post_id: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          approval_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          platform: string
          posted_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          social_post_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          approval_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          platform?: string
          posted_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          social_post_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_queue_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "content_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_queue_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "workspace_social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_queue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_audience: {
        Row: {
          id: string
          joined_at: string
          space_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_audience_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_speakers: {
        Row: {
          id: string
          is_muted: boolean
          joined_at: string
          space_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_speakers_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_live: boolean
          tags: string[] | null
          topic: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_live?: boolean
          tags?: string[] | null
          topic: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_live?: boolean
          tags?: string[] | null
          topic?: string
        }
        Relationships: []
      }
      spark_comments: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          content: string
          created_at: string
          id: string
          like_count: number | null
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "spark_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "spark_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_posts: {
        Row: {
          author_avatar: string | null
          author_id: string
          author_name: string | null
          comment_count: number
          content: string
          created_at: string
          event_id: string | null
          expires_at: string | null
          gif_url: string | null
          id: string
          image_url: string | null
          is_anonymous: boolean
          poll_id: string | null
          spark_count: number
          status: string
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          author_avatar?: string | null
          author_id: string
          author_name?: string | null
          comment_count?: number
          content: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          gif_url?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          poll_id?: string | null
          spark_count?: number
          status?: string
          tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string
          author_name?: string | null
          comment_count?: number
          content?: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          gif_url?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          poll_id?: string | null
          spark_count?: number
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_posts_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "vibe_games"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "spark_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_communications: {
        Row: {
          content: string | null
          created_at: string
          id: string
          sent_by: string | null
          sent_by_name: string | null
          speaker_id: string
          status: string | null
          subject: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          sent_by?: string | null
          sent_by_name?: string | null
          speaker_id: string
          status?: string | null
          subject: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          sent_by?: string | null
          sent_by_name?: string | null
          speaker_id?: string
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_communications_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "workspace_speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_communications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          is_published: boolean | null
          location: string | null
          notes: string | null
          room: string | null
          scheduled_date: string | null
          session_type: string | null
          speaker_id: string
          start_time: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          notes?: string | null
          room?: string | null
          scheduled_date?: string | null
          session_type?: string | null
          speaker_id: string
          start_time?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          notes?: string | null
          room?: string | null
          scheduled_date?: string | null
          session_type?: string | null
          speaker_id?: string
          start_time?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_sessions_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "workspace_speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_travel: {
        Row: {
          arrival_time: string | null
          check_in_date: string | null
          check_out_date: string | null
          created_at: string
          departure_time: string | null
          dietary_requirements: string | null
          flight_details: string | null
          flight_number: string | null
          flight_status: string | null
          hotel_details: string | null
          hotel_name: string | null
          hotel_status: string | null
          id: string
          meals_details: string | null
          meals_status: string | null
          notes: string | null
          speaker_id: string
          transport_details: string | null
          transport_status: string | null
          transport_type: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          arrival_time?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          departure_time?: string | null
          dietary_requirements?: string | null
          flight_details?: string | null
          flight_number?: string | null
          flight_status?: string | null
          hotel_details?: string | null
          hotel_name?: string | null
          hotel_status?: string | null
          id?: string
          meals_details?: string | null
          meals_status?: string | null
          notes?: string | null
          speaker_id: string
          transport_details?: string | null
          transport_status?: string | null
          transport_type?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          arrival_time?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          departure_time?: string | null
          dietary_requirements?: string | null
          flight_details?: string | null
          flight_number?: string | null
          flight_status?: string | null
          hotel_details?: string | null
          hotel_name?: string | null
          hotel_status?: string | null
          id?: string
          meals_details?: string | null
          meals_status?: string | null
          notes?: string | null
          speaker_id?: string
          transport_details?: string | null
          transport_status?: string | null
          transport_type?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_travel_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "workspace_speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_travel_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_booths: {
        Row: {
          booth_number: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean | null
          location: string | null
          offerings: string[] | null
          social_links: Json | null
          sponsor_logo: string | null
          sponsor_name: string
          tier: string | null
          updated_at: string
          visit_count: number | null
          website: string | null
        }
        Insert: {
          booth_number?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          offerings?: string[] | null
          social_links?: Json | null
          sponsor_logo?: string | null
          sponsor_name: string
          tier?: string | null
          updated_at?: string
          visit_count?: number | null
          website?: string | null
        }
        Update: {
          booth_number?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          offerings?: string[] | null
          social_links?: Json | null
          sponsor_logo?: string | null
          sponsor_name?: string
          tier?: string | null
          updated_at?: string
          visit_count?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_booths_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      starred_messages: {
        Row: {
          id: string
          message_id: string
          starred_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          starred_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          starred_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          college: string | null
          courses: string[] | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          major: string | null
          max_members: number | null
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          college?: string | null
          courses?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          major?: string | null
          max_members?: number | null
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          college?: string | null
          courses?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          major?: string | null
          max_members?: number | null
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      task_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          task_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          task_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approval_decisions: {
        Row: {
          approver_id: string
          approver_role: string
          decided_at: string
          decision: string
          delegated_reason: string | null
          delegated_to: string | null
          id: string
          level: number
          notes: string | null
          request_id: string
        }
        Insert: {
          approver_id: string
          approver_role: string
          decided_at?: string
          decision: string
          delegated_reason?: string | null
          delegated_to?: string | null
          id?: string
          level: number
          notes?: string | null
          request_id: string
        }
        Update: {
          approver_id?: string
          approver_role?: string
          decided_at?: string
          decision?: string
          delegated_reason?: string | null
          delegated_to?: string | null
          id?: string
          level?: number
          notes?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_approval_decisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "task_approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approval_policies: {
        Row: {
          allow_self_approval: boolean | null
          applies_to_categories: string[] | null
          applies_to_priorities: string[] | null
          applies_to_role_scopes: string[] | null
          approval_chain: Json
          auto_approve_after_hours: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          is_enabled: boolean | null
          min_estimated_hours: number | null
          name: string
          require_all_levels: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allow_self_approval?: boolean | null
          applies_to_categories?: string[] | null
          applies_to_priorities?: string[] | null
          applies_to_role_scopes?: string[] | null
          approval_chain?: Json
          auto_approve_after_hours?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          min_estimated_hours?: number | null
          name: string
          require_all_levels?: boolean | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allow_self_approval?: boolean | null
          applies_to_categories?: string[] | null
          applies_to_priorities?: string[] | null
          applies_to_role_scopes?: string[] | null
          approval_chain?: Json
          auto_approve_after_hours?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          min_estimated_hours?: number | null
          name?: string
          require_all_levels?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_approval_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approval_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          current_level: number
          final_decision_by: string | null
          final_decision_notes: string | null
          id: string
          original_status: string
          overall_status: string
          policy_id: string | null
          requested_at: string
          requested_by: string
          target_status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_level?: number
          final_decision_by?: string | null
          final_decision_notes?: string | null
          id?: string
          original_status: string
          overall_status?: string
          policy_id?: string | null
          requested_at?: string
          requested_by: string
          target_status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_level?: number
          final_decision_by?: string | null
          final_decision_notes?: string | null
          id?: string
          original_status?: string
          overall_status?: string
          policy_id?: string | null
          requested_at?: string
          requested_by?: string
          target_status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_approval_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "task_approval_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approval_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_edited: boolean | null
          mentions: string[] | null
          parent_id: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
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
      trivia_responses: {
        Row: {
          created_at: string
          game_id: string
          id: string
          is_correct: boolean
          option_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          is_correct?: boolean
          option_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          is_correct?: boolean
          option_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trivia_responses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "vibe_games"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          browser: string | null
          device_id: string
          device_name: string
          device_type: string | null
          expires_at: string | null
          id: string
          is_current: boolean | null
          last_used_at: string | null
          os: string | null
          trusted_at: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_id: string
          device_name: string
          device_type?: string | null
          expires_at?: string | null
          id?: string
          is_current?: boolean | null
          last_used_at?: string | null
          os?: string | null
          trusted_at?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_id?: string
          device_name?: string
          device_type?: string | null
          expires_at?: string | null
          id?: string
          is_current?: boolean | null
          last_used_at?: string | null
          os?: string | null
          trusted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_competition_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          event_id: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_competition_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "competition_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_competition_badges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          category_key: string
          consent_version: string
          created_at: string
          granted_at: string | null
          id: string
          ip_address_hash: string | null
          is_granted: boolean
          updated_at: string
          user_agent: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          category_key: string
          consent_version?: string
          created_at?: string
          granted_at?: string | null
          id?: string
          ip_address_hash?: string | null
          is_granted?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          category_key?: string
          consent_version?: string
          created_at?: string
          granted_at?: string | null
          id?: string
          ip_address_hash?: string | null
          is_granted?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_category_key_fkey"
            columns: ["category_key"]
            isOneToOne: false
            referencedRelation: "consent_categories"
            referencedColumns: ["key"]
          },
        ]
      }
      user_policy_acknowledgments: {
        Row: {
          acknowledged_at: string
          id: string
          ip_address_hash: string | null
          policy_version: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          ip_address_hash?: string | null
          policy_version: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          ip_address_hash?: string | null
          policy_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_policy_acknowledgments_policy_version_fkey"
            columns: ["policy_version"]
            isOneToOne: false
            referencedRelation: "privacy_policy_versions"
            referencedColumns: ["version"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          email: string | null
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
          updated_at: string | null
          username: string | null
          username_changed_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
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
          updated_at?: string | null
          username?: string | null
          username_changed_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
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
          updated_at?: string | null
          username?: string | null
          username_changed_at?: string | null
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
      user_security_preferences: {
        Row: {
          created_at: string | null
          id: string
          idle_timeout_enabled: boolean | null
          password_expiry_days: number | null
          require_reauthentication_sensitive: boolean | null
          session_timeout_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idle_timeout_enabled?: boolean | null
          password_expiry_days?: number | null
          require_reauthentication_sensitive?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idle_timeout_enabled?: boolean | null
          password_expiry_days?: number | null
          require_reauthentication_sensitive?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_active_at: string | null
          location: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string | null
          location?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string | null
          location?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          boost_credits: number
          created_at: string
          daily_rewind_limit: number
          expires_at: string | null
          id: string
          last_credit_refresh: string | null
          plan_type: string
          rewind_credits: number
          started_at: string
          status: string
          super_like_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          boost_credits?: number
          created_at?: string
          daily_rewind_limit?: number
          expires_at?: string | null
          id?: string
          last_credit_refresh?: string | null
          plan_type?: string
          rewind_credits?: number
          started_at?: string
          status?: string
          super_like_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          boost_credits?: number
          created_at?: string
          daily_rewind_limit?: number
          expires_at?: string | null
          id?: string
          last_credit_refresh?: string | null
          plan_type?: string
          rewind_credits?: number
          started_at?: string
          status?: string
          super_like_credits?: number
          updated_at?: string
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
      vibe_games: {
        Row: {
          correct_answer: number | null
          created_at: string
          event_id: string | null
          expires_at: string
          id: string
          name: string
          options: string[]
          participant_count: number
          question: string
          type: string
        }
        Insert: {
          correct_answer?: number | null
          created_at?: string
          event_id?: string | null
          expires_at: string
          id?: string
          name: string
          options: string[]
          participant_count?: number
          question: string
          type: string
        }
        Update: {
          correct_answer?: number | null
          created_at?: string
          event_id?: string | null
          expires_at?: string
          id?: string
          name?: string
          options?: string[]
          participant_count?: number
          question?: string
          type?: string
        }
        Relationships: []
      }
      vibe_responses: {
        Row: {
          created_at: string
          game_id: string
          id: string
          option_index: number | null
          response: number
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          option_index?: number | null
          response: number
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          option_index?: number | null
          response?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_responses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "vibe_games"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_messages: {
        Row: {
          audio_url: string
          created_at: string | null
          duration_seconds: number
          id: string
          message_id: string
          transcription: string | null
          waveform_data: Json | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          message_id: string
          transcription?: string | null
          waveform_data?: Json | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          message_id?: string
          transcription?: string | null
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
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
      work_experience: {
        Row: {
          company: string
          company_logo_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean
          location: string | null
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          company_logo_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          company_logo_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workshop_progress: {
        Row: {
          completed_at: string | null
          current_step: number | null
          event_id: string
          id: string
          last_activity_at: string
          notes: Json | null
          started_at: string
          total_steps: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          event_id: string
          id?: string
          last_activity_at?: string
          notes?: Json | null
          started_at?: string
          total_steps?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          event_id?: string
          id?: string
          last_activity_at?: string
          notes?: Json | null
          started_at?: string
          total_steps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_ab_tests: {
        Row: {
          campaign_id: string | null
          confidence_level: number | null
          created_at: string
          created_by: string | null
          current_sample: number | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          sample_size: number | null
          start_date: string | null
          status: string
          test_type: string
          updated_at: string
          variant_a: Json
          variant_a_metrics: Json | null
          variant_b: Json
          variant_b_metrics: Json | null
          winner: string | null
          workspace_id: string
        }
        Insert: {
          campaign_id?: string | null
          confidence_level?: number | null
          created_at?: string
          created_by?: string | null
          current_sample?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          sample_size?: number | null
          start_date?: string | null
          status?: string
          test_type?: string
          updated_at?: string
          variant_a?: Json
          variant_a_metrics?: Json | null
          variant_b?: Json
          variant_b_metrics?: Json | null
          winner?: string | null
          workspace_id: string
        }
        Update: {
          campaign_id?: string | null
          confidence_level?: number | null
          created_at?: string
          created_by?: string | null
          current_sample?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          sample_size?: number | null
          start_date?: string | null
          status?: string
          test_type?: string
          updated_at?: string
          variant_a?: Json
          variant_a_metrics?: Json | null
          variant_b?: Json
          variant_b_metrics?: Json | null
          winner?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "workspace_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_ab_tests_workspace_id_fkey"
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
      workspace_announcements: {
        Row: {
          announcement_type: string
          channels: Json | null
          content: string
          created_at: string
          id: string
          recipients_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          target_audience: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          announcement_type?: string
          channels?: Json | null
          content: string
          created_at?: string
          id?: string
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          target_audience?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          announcement_type?: string
          channels?: Json | null
          content?: string
          created_at?: string
          id?: string
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          target_audience?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_announcements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          previous_value: Json | null
          target_email: string | null
          target_user_id: string | null
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          previous_value?: Json | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          previous_value?: Json | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_automation_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_backup_equipment: {
        Row: {
          created_at: string | null
          deployed_at: string | null
          deployed_for: string | null
          equipment_type: string
          id: string
          last_tested_at: string | null
          last_tested_by: string | null
          location: string | null
          name: string
          notes: string | null
          order_index: number | null
          primary_equipment_id: string | null
          status: string | null
          test_result: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          deployed_at?: string | null
          deployed_for?: string | null
          equipment_type: string
          id?: string
          last_tested_at?: string | null
          last_tested_by?: string | null
          location?: string | null
          name: string
          notes?: string | null
          order_index?: number | null
          primary_equipment_id?: string | null
          status?: string | null
          test_result?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          deployed_at?: string | null
          deployed_for?: string | null
          equipment_type?: string
          id?: string
          last_tested_at?: string | null
          last_tested_by?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          order_index?: number | null
          primary_equipment_id?: string | null
          status?: string | null
          test_result?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_backup_equipment_primary_equipment_id_fkey"
            columns: ["primary_equipment_id"]
            isOneToOne: false
            referencedRelation: "workspace_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_backup_equipment_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_broadcast_messages: {
        Row: {
          channels: string[]
          content: string
          created_at: string | null
          delivery_stats: Json | null
          id: string
          message_type: string | null
          recipient_ids: string[] | null
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          target_audience: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          channels?: string[]
          content: string
          created_at?: string | null
          delivery_stats?: Json | null
          id?: string
          message_type?: string | null
          recipient_ids?: string[] | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          target_audience?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          channels?: string[]
          content?: string
          created_at?: string | null
          delivery_stats?: Json | null
          id?: string
          message_type?: string | null
          recipient_ids?: string[] | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          target_audience?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_broadcast_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      workspace_campaigns: {
        Row: {
          budget: number | null
          channel: string
          clicks: number | null
          conversions: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          impressions: number | null
          name: string
          spent: number | null
          start_date: string | null
          status: string
          target_audience: Json | null
          updated_at: string
          utm_params: Json | null
          workspace_id: string
        }
        Insert: {
          budget?: number | null
          channel?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name: string
          spent?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
          utm_params?: Json | null
          workspace_id: string
        }
        Update: {
          budget?: number | null
          channel?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name?: string
          spent?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
          utm_params?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_campaigns_workspace_id_fkey"
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
          event_id: string | null
          id: string
          is_shared: boolean | null
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
          event_id?: string | null
          id?: string
          is_shared?: boolean | null
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
          event_id?: string | null
          id?: string
          is_shared?: boolean | null
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
            foreignKeyName: "workspace_checklists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          category: string | null
          content_url: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string
          published_at: string | null
          review_status: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          scheduled_publish_date: string | null
          status: string
          tags: string[] | null
          target_word_count: number | null
          title: string
          type: string
          updated_at: string
          version: number | null
          view_count: number | null
          word_count: number | null
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          published_at?: string | null
          review_status?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          scheduled_publish_date?: string | null
          status?: string
          tags?: string[] | null
          target_word_count?: number | null
          title: string
          type?: string
          updated_at?: string
          version?: number | null
          view_count?: number | null
          word_count?: number | null
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          published_at?: string | null
          review_status?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          scheduled_publish_date?: string | null
          status?: string
          tags?: string[] | null
          target_word_count?: number | null
          title?: string
          type?: string
          updated_at?: string
          version?: number | null
          view_count?: number | null
          word_count?: number | null
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
      workspace_content_reviews: {
        Row: {
          assigned_at: string | null
          content_item_id: string
          created_at: string
          feedback: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          score: number | null
          status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_at?: string | null
          content_item_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_at?: string | null
          content_item_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_content_reviews_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "workspace_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_content_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_content_templates: {
        Row: {
          category: string | null
          content_type: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sample_content: string | null
          template_structure: Json | null
          thumbnail_url: string | null
          updated_at: string
          usage_count: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sample_content?: string | null
          template_structure?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sample_content?: string | null
          template_structure?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_content_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_contingency_procedures: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          last_drill_at: string | null
          name: string
          notes: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          priority: number | null
          procedure_steps: Json
          recovery_time_objective_minutes: number | null
          related_equipment: string[] | null
          related_zones: string[] | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          trigger_condition: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          workspace_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_drill_at?: string | null
          name: string
          notes?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          priority?: number | null
          procedure_steps?: Json
          recovery_time_objective_minutes?: number | null
          related_equipment?: string[] | null
          related_zones?: string[] | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          trigger_condition: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_drill_at?: string | null
          name?: string
          notes?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          priority?: number | null
          procedure_steps?: Json
          recovery_time_objective_minutes?: number | null
          related_equipment?: string[] | null
          related_zones?: string[] | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          trigger_condition?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_contingency_procedures_workspace_id_fkey"
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
      workspace_email_campaigns: {
        Row: {
          clicked_count: number | null
          completed_at: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          opened_count: number | null
          recipient_list: Json | null
          recipients_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          target_audience: string | null
          template_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          clicked_count?: number | null
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          opened_count?: number | null
          recipient_list?: Json | null
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          target_audience?: string | null
          template_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          clicked_count?: number | null
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          opened_count?: number | null
          recipient_list?: Json | null
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          target_audience?: string | null
          template_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_email_campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_engagement_reports: {
        Row: {
          created_at: string | null
          engagement_rate: number | null
          follower_growth: number | null
          id: string
          platform: string
          report_date: string
          top_performing_post_id: string | null
          total_comments: number | null
          total_followers: number | null
          total_impressions: number | null
          total_likes: number | null
          total_posts: number | null
          total_reach: number | null
          total_saves: number | null
          total_shares: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          engagement_rate?: number | null
          follower_growth?: number | null
          id?: string
          platform: string
          report_date: string
          top_performing_post_id?: string | null
          total_comments?: number | null
          total_followers?: number | null
          total_impressions?: number | null
          total_likes?: number | null
          total_posts?: number | null
          total_reach?: number | null
          total_saves?: number | null
          total_shares?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          engagement_rate?: number | null
          follower_growth?: number | null
          id?: string
          platform?: string
          report_date?: string
          top_performing_post_id?: string | null
          total_comments?: number | null
          total_followers?: number | null
          total_impressions?: number | null
          total_likes?: number | null
          total_posts?: number | null
          total_reach?: number | null
          total_saves?: number | null
          total_shares?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_engagement_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_equipment: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string | null
          created_by: string | null
          equipment_type: string
          event_id: string | null
          id: string
          last_tested_at: string | null
          last_tested_by: string | null
          last_tested_by_name: string | null
          location: string | null
          name: string
          next_maintenance_date: string | null
          notes: string | null
          order_index: number | null
          serial_number: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          created_by?: string | null
          equipment_type?: string
          event_id?: string | null
          id?: string
          last_tested_at?: string | null
          last_tested_by?: string | null
          last_tested_by_name?: string | null
          location?: string | null
          name: string
          next_maintenance_date?: string | null
          notes?: string | null
          order_index?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          created_by?: string | null
          equipment_type?: string
          event_id?: string | null
          id?: string
          last_tested_at?: string | null
          last_tested_by?: string | null
          last_tested_by_name?: string | null
          location?: string | null
          name?: string
          next_maintenance_date?: string | null
          notes?: string | null
          order_index?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_equipment_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_equipment_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_equipment_checkouts: {
        Row: {
          actual_return_date: string | null
          borrowed_by_committee: string | null
          borrowed_by_name: string
          borrowed_by_user_id: string | null
          borrowed_by_workspace_id: string | null
          checked_out_by: string | null
          checkout_date: string
          checkout_notes: string | null
          condition_at_checkout: string | null
          condition_at_return: string | null
          created_at: string | null
          damage_description: string | null
          equipment_id: string
          expected_return_date: string
          id: string
          return_notes: string | null
          returned_to: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          actual_return_date?: string | null
          borrowed_by_committee?: string | null
          borrowed_by_name: string
          borrowed_by_user_id?: string | null
          borrowed_by_workspace_id?: string | null
          checked_out_by?: string | null
          checkout_date?: string
          checkout_notes?: string | null
          condition_at_checkout?: string | null
          condition_at_return?: string | null
          created_at?: string | null
          damage_description?: string | null
          equipment_id: string
          expected_return_date: string
          id?: string
          return_notes?: string | null
          returned_to?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          actual_return_date?: string | null
          borrowed_by_committee?: string | null
          borrowed_by_name?: string
          borrowed_by_user_id?: string | null
          borrowed_by_workspace_id?: string | null
          checked_out_by?: string | null
          checkout_date?: string
          checkout_notes?: string | null
          condition_at_checkout?: string | null
          condition_at_return?: string | null
          created_at?: string | null
          damage_description?: string | null
          equipment_id?: string
          expected_return_date?: string
          id?: string
          return_notes?: string | null
          returned_to?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_equipment_checkouts_borrowed_by_workspace_id_fkey"
            columns: ["borrowed_by_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_equipment_checkouts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "workspace_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_equipment_checkouts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_equipment_tests: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          metrics: Json | null
          notes: string | null
          result: string
          test_type: string | null
          tested_by: string | null
          tested_by_name: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          metrics?: Json | null
          notes?: string | null
          result: string
          test_type?: string | null
          tested_by?: string | null
          tested_by_name?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          metrics?: Json | null
          notes?: string | null
          result?: string
          test_type?: string | null
          tested_by?: string | null
          tested_by_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_equipment_tests_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "workspace_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_equipment_tests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_event_briefings: {
        Row: {
          activity: string
          created_at: string
          event_date: string | null
          id: string
          lead_id: string | null
          lead_name: string | null
          location: string | null
          notes: string | null
          scheduled_time: string
          sort_order: number | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          event_date?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          location?: string | null
          notes?: string | null
          scheduled_time: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          event_date?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          location?: string | null
          notes?: string | null
          scheduled_time?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_event_briefings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          notes: string | null
          receipt_url: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_facility_checks: {
        Row: {
          area: string
          checked_at: string | null
          checked_by: string | null
          checked_by_name: string | null
          created_at: string
          follow_up_required: boolean | null
          id: string
          item: string
          notes: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          area: string
          checked_at?: string | null
          checked_by?: string | null
          checked_by_name?: string | null
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          item: string
          notes?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          area?: string
          checked_at?: string | null
          checked_by?: string | null
          checked_by_name?: string | null
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          item?: string
          notes?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_facility_checks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_gallery_reviews: {
        Row: {
          asset_id: string
          created_at: string | null
          feedback: string | null
          id: string
          is_featured: boolean | null
          rating: number | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          status: string | null
          updated_at: string | null
          usage_rights: string | null
          workspace_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          status?: string | null
          updated_at?: string | null
          usage_rights?: string | null
          workspace_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          status?: string | null
          updated_at?: string | null
          usage_rights?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_gallery_reviews_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "workspace_media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_gallery_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_gallery_reviews_workspace_id_fkey"
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
      workspace_hashtags: {
        Row: {
          category: string | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          is_primary: boolean | null
          last_tracked_at: string | null
          reach: number | null
          tag: string
          trend: string | null
          updated_at: string | null
          uses_count: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          is_primary?: boolean | null
          last_tracked_at?: string | null
          reach?: number | null
          tag: string
          trend?: string | null
          updated_at?: string | null
          uses_count?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          is_primary?: boolean | null
          last_tracked_at?: string | null
          reach?: number | null
          tag?: string
          trend?: string | null
          updated_at?: string | null
          uses_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_hashtags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_incidents: {
        Row: {
          affected_systems: string[] | null
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string
          description: string | null
          id: string
          impact_assessment: string | null
          incident_type: string | null
          is_recurring: boolean | null
          lessons_learned: string | null
          location: string | null
          post_event_notes: string | null
          preventive_actions: string | null
          related_incident_id: string | null
          reported_by: string | null
          reported_by_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          root_cause: string | null
          severity: string
          status: string
          time_to_resolve_minutes: number | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          affected_systems?: string[] | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_assessment?: string | null
          incident_type?: string | null
          is_recurring?: boolean | null
          lessons_learned?: string | null
          location?: string | null
          post_event_notes?: string | null
          preventive_actions?: string | null
          related_incident_id?: string | null
          reported_by?: string | null
          reported_by_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          time_to_resolve_minutes?: number | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          affected_systems?: string[] | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_assessment?: string | null
          incident_type?: string | null
          is_recurring?: boolean | null
          lessons_learned?: string | null
          location?: string | null
          post_event_notes?: string | null
          preventive_actions?: string | null
          related_incident_id?: string | null
          reported_by?: string | null
          reported_by_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          time_to_resolve_minutes?: number | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_incidents_workspace_id_fkey"
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
      workspace_invoices: {
        Row: {
          amount: number
          attachment_url: string | null
          created_at: string | null
          created_by: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_terms: string | null
          sent_at: string | null
          status: string
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string
          workspace_id: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          created_at?: string | null
          created_by: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name: string
          workspace_id: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          created_at?: string | null
          created_by?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "catering_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_issues: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          category: string | null
          created_at: string | null
          description: string | null
          escalated_to_incident: boolean | null
          event_id: string | null
          id: string
          incident_id: string | null
          location: string | null
          priority: string | null
          reporter_id: string | null
          reporter_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_id: string | null
          resolved_by_name: string | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          escalated_to_incident?: boolean | null
          event_id?: string | null
          id?: string
          incident_id?: string | null
          location?: string | null
          priority?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          resolved_by_name?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          escalated_to_incident?: boolean | null
          event_id?: string | null
          id?: string
          incident_id?: string | null
          location?: string | null
          priority?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          resolved_by_name?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_issues_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_issues_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "workspace_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_issues_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_it_tickets: {
        Row: {
          affected_users_count: number | null
          assigned_to_id: string | null
          assigned_to_name: string | null
          category: string
          created_at: string
          created_by_id: string | null
          description: string | null
          escalated_at: string | null
          escalated_to_id: string | null
          escalated_to_name: string | null
          escalation_level: number | null
          escalation_reason: string | null
          event_id: string | null
          first_response_at: string | null
          id: string
          impact_level: string | null
          internal_notes: string | null
          priority: string
          related_asset_id: string | null
          related_asset_name: string | null
          related_license_id: string | null
          requester_department: string | null
          requester_email: string | null
          requester_id: string | null
          requester_name: string
          resolution_category: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_id: string | null
          resolved_by_name: string | null
          satisfaction_feedback: string | null
          satisfaction_rating: number | null
          sla_resolution_breached: boolean | null
          sla_resolution_deadline: string | null
          sla_response_breached: boolean | null
          sla_response_deadline: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          affected_users_count?: number | null
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          category?: string
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          escalated_at?: string | null
          escalated_to_id?: string | null
          escalated_to_name?: string | null
          escalation_level?: number | null
          escalation_reason?: string | null
          event_id?: string | null
          first_response_at?: string | null
          id?: string
          impact_level?: string | null
          internal_notes?: string | null
          priority?: string
          related_asset_id?: string | null
          related_asset_name?: string | null
          related_license_id?: string | null
          requester_department?: string | null
          requester_email?: string | null
          requester_id?: string | null
          requester_name: string
          resolution_category?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          resolved_by_name?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          sla_resolution_breached?: boolean | null
          sla_resolution_deadline?: string | null
          sla_response_breached?: boolean | null
          sla_response_deadline?: string | null
          status?: string
          ticket_number: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          affected_users_count?: number | null
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          category?: string
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          escalated_at?: string | null
          escalated_to_id?: string | null
          escalated_to_name?: string | null
          escalation_level?: number | null
          escalation_reason?: string | null
          event_id?: string | null
          first_response_at?: string | null
          id?: string
          impact_level?: string | null
          internal_notes?: string | null
          priority?: string
          related_asset_id?: string | null
          related_asset_name?: string | null
          related_license_id?: string | null
          requester_department?: string | null
          requester_email?: string | null
          requester_id?: string | null
          requester_name?: string
          resolution_category?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          resolved_by_name?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          sla_resolution_breached?: boolean | null
          sla_resolution_deadline?: string | null
          sla_response_breached?: boolean | null
          sla_response_deadline?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_it_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_it_tickets_related_license_id_fkey"
            columns: ["related_license_id"]
            isOneToOne: false
            referencedRelation: "workspace_software_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_it_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_judge_assignments: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          judge_id: string
          priority: number | null
          rubric_id: string | null
          started_at: string | null
          status: string | null
          submission_id: string
          workspace_id: string
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          judge_id: string
          priority?: number | null
          rubric_id?: string | null
          started_at?: string | null
          status?: string | null
          submission_id: string
          workspace_id: string
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          judge_id?: string
          priority?: number | null
          rubric_id?: string | null
          started_at?: string | null
          status?: string | null
          submission_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_judge_assignments_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "workspace_judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_judge_assignments_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "workspace_rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_judge_assignments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "workspace_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_judge_assignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_judges: {
        Row: {
          assigned_count: number | null
          availability: Json | null
          category: string | null
          completed_count: number | null
          confirmed_at: string | null
          created_at: string | null
          expertise: string | null
          id: string
          invited_at: string | null
          judge_email: string | null
          judge_name: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          assigned_count?: number | null
          availability?: Json | null
          category?: string | null
          completed_count?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          expertise?: string | null
          id?: string
          invited_at?: string | null
          judge_email?: string | null
          judge_name: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          assigned_count?: number | null
          availability?: Json | null
          category?: string | null
          completed_count?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          expertise?: string | null
          id?: string
          invited_at?: string | null
          judge_email?: string | null
          judge_name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_judges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_judges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_logistics: {
        Row: {
          actual_arrival: string | null
          carrier: string | null
          created_at: string
          created_by: string | null
          destination: string | null
          eta: string | null
          id: string
          item_name: string
          notes: string | null
          origin: string | null
          priority: string | null
          progress: number | null
          status: string
          tracking_number: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actual_arrival?: string | null
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          eta?: string | null
          id?: string
          item_name: string
          notes?: string | null
          origin?: string | null
          priority?: string | null
          progress?: number | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actual_arrival?: string | null
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          eta?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          origin?: string | null
          priority?: string | null
          progress?: number | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_logistics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_logistics_reports: {
        Row: {
          content: Json | null
          created_at: string | null
          date_range_end: string | null
          date_range_start: string | null
          generated_by: string | null
          generated_by_name: string | null
          id: string
          report_type: string
          title: string
          workspace_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          generated_by?: string | null
          generated_by_name?: string | null
          id?: string
          report_type: string
          title: string
          workspace_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          generated_by?: string | null
          generated_by_name?: string | null
          id?: string
          report_type?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_logistics_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_media_assets: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          event_segment: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_exported: boolean | null
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
          usage_count: number
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          event_segment?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_exported?: boolean | null
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
          usage_count?: number
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          event_segment?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_exported?: boolean | null
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
          usage_count?: number
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
      workspace_network_zones: {
        Row: {
          bandwidth_alert_threshold: number | null
          created_at: string | null
          current_bandwidth_percent: number | null
          current_devices: number | null
          description: string | null
          device_alert_threshold: number | null
          event_id: string | null
          id: string
          ip_range: string | null
          last_checked_at: string | null
          last_checked_by: string | null
          last_checked_by_name: string | null
          location: string | null
          max_bandwidth_mbps: number | null
          max_devices: number | null
          name: string
          ssid: string | null
          status: string | null
          status_message: string | null
          updated_at: string | null
          vlan_id: number | null
          workspace_id: string
          zone_type: string | null
        }
        Insert: {
          bandwidth_alert_threshold?: number | null
          created_at?: string | null
          current_bandwidth_percent?: number | null
          current_devices?: number | null
          description?: string | null
          device_alert_threshold?: number | null
          event_id?: string | null
          id?: string
          ip_range?: string | null
          last_checked_at?: string | null
          last_checked_by?: string | null
          last_checked_by_name?: string | null
          location?: string | null
          max_bandwidth_mbps?: number | null
          max_devices?: number | null
          name: string
          ssid?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          vlan_id?: number | null
          workspace_id: string
          zone_type?: string | null
        }
        Update: {
          bandwidth_alert_threshold?: number | null
          created_at?: string | null
          current_bandwidth_percent?: number | null
          current_devices?: number | null
          description?: string | null
          device_alert_threshold?: number | null
          event_id?: string | null
          id?: string
          ip_range?: string | null
          last_checked_at?: string | null
          last_checked_by?: string | null
          last_checked_by_name?: string | null
          location?: string | null
          max_bandwidth_mbps?: number | null
          max_devices?: number | null
          name?: string
          ssid?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          vlan_id?: number | null
          workspace_id?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_network_zones_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_network_zones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_page_responsibilities: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          responsibility_type: string
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          responsibility_type?: string
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          responsibility_type?: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_page_responsibilities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_page_responsibilities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_partners: {
        Row: {
          commission_percentage: number | null
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          deliverables: Json | null
          engagement_rate: number | null
          id: string
          name: string
          notes: string | null
          partner_type: string
          partnership_value: number | null
          reach: number | null
          social_handles: Json | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          commission_percentage?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deliverables?: Json | null
          engagement_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          partner_type?: string
          partnership_value?: number | null
          reach?: number | null
          social_handles?: Json | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          commission_percentage?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deliverables?: Json | null
          engagement_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          partner_type?: string
          partnership_value?: number | null
          reach?: number | null
          social_handles?: Json | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_partners_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_power_circuits: {
        Row: {
          assigned_to: string | null
          circuit_number: string | null
          created_at: string | null
          current_load_amps: number | null
          equipment_connected: string[] | null
          id: string
          last_checked_at: string | null
          last_checked_by: string | null
          name: string
          notes: string | null
          rated_amps: number
          status: string | null
          updated_at: string | null
          workspace_id: string
          zone_id: string
        }
        Insert: {
          assigned_to?: string | null
          circuit_number?: string | null
          created_at?: string | null
          current_load_amps?: number | null
          equipment_connected?: string[] | null
          id?: string
          last_checked_at?: string | null
          last_checked_by?: string | null
          name: string
          notes?: string | null
          rated_amps: number
          status?: string | null
          updated_at?: string | null
          workspace_id: string
          zone_id: string
        }
        Update: {
          assigned_to?: string | null
          circuit_number?: string | null
          created_at?: string | null
          current_load_amps?: number | null
          equipment_connected?: string[] | null
          id?: string
          last_checked_at?: string | null
          last_checked_by?: string | null
          name?: string
          notes?: string | null
          rated_amps?: number
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_power_circuits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_power_circuits_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "workspace_power_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_power_zones: {
        Row: {
          allocated_amps: number | null
          created_at: string | null
          emergency_procedure: string | null
          fuel_level_percent: number | null
          generator_id: string | null
          id: string
          is_generator_backed: boolean | null
          location: string | null
          name: string
          notes: string | null
          order_index: number | null
          status: string | null
          total_capacity_amps: number | null
          updated_at: string | null
          workspace_id: string
          zone_type: string | null
        }
        Insert: {
          allocated_amps?: number | null
          created_at?: string | null
          emergency_procedure?: string | null
          fuel_level_percent?: number | null
          generator_id?: string | null
          id?: string
          is_generator_backed?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          order_index?: number | null
          status?: string | null
          total_capacity_amps?: number | null
          updated_at?: string | null
          workspace_id: string
          zone_type?: string | null
        }
        Update: {
          allocated_amps?: number | null
          created_at?: string | null
          emergency_procedure?: string | null
          fuel_level_percent?: number | null
          generator_id?: string | null
          id?: string
          is_generator_backed?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          order_index?: number | null
          status?: string | null
          total_capacity_amps?: number | null
          updated_at?: string | null
          workspace_id?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_power_zones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_pr_contacts: {
        Row: {
          beat: string | null
          contact_type: string
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          name: string
          notes: string | null
          outlet_name: string | null
          phone: string | null
          priority: string | null
          response_rate: number | null
          social_handles: Json | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          beat?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          notes?: string | null
          outlet_name?: string | null
          phone?: string | null
          priority?: string | null
          response_rate?: number | null
          social_handles?: Json | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          beat?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          notes?: string | null
          outlet_name?: string | null
          phone?: string | null
          priority?: string | null
          response_rate?: number | null
          social_handles?: Json | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_pr_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_press_releases: {
        Row: {
          attachments: Json | null
          author_id: string | null
          author_name: string | null
          content: string | null
          created_at: string | null
          distribution_channels: string[] | null
          distribution_date: string | null
          embargo_date: string | null
          id: string
          media_contacts: string[] | null
          notes: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          status: string
          title: string
          type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          distribution_channels?: string[] | null
          distribution_date?: string | null
          embargo_date?: string | null
          id?: string
          media_contacts?: string[] | null
          notes?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          status?: string
          title: string
          type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          distribution_channels?: string[] | null
          distribution_date?: string | null
          embargo_date?: string | null
          id?: string
          media_contacts?: string[] | null
          notes?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          status?: string
          title?: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_press_releases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_recurring_tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          last_created_at: string | null
          max_occurrences: number | null
          next_occurrence: string
          occurrence_count: number | null
          priority: string
          recurrence_config: Json
          recurrence_type: string
          role_scope: string | null
          template_data: Json
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          last_created_at?: string | null
          max_occurrences?: number | null
          next_occurrence: string
          occurrence_count?: number | null
          priority?: string
          recurrence_config?: Json
          recurrence_type: string
          role_scope?: string | null
          template_data?: Json
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          last_created_at?: string | null
          max_occurrences?: number | null
          next_occurrence?: string
          occurrence_count?: number | null
          priority?: string
          recurrence_config?: Json
          recurrence_type?: string
          role_scope?: string | null
          template_data?: Json
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_recurring_tasks_workspace_id_fkey"
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
      workspace_rubrics: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          max_total_score: number | null
          name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          max_total_score?: number | null
          name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          max_total_score?: number | null
          name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_rubrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_runsheet_cues: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          cue_type: string | null
          description: string | null
          duration_minutes: number | null
          event_id: string | null
          id: string
          notes: string | null
          order_index: number | null
          scheduled_time: string
          started_at: string | null
          status: string | null
          technician_id: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          cue_type?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_id?: string | null
          id?: string
          notes?: string | null
          order_index?: number | null
          scheduled_time: string
          started_at?: string | null
          status?: string | null
          technician_id?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          cue_type?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_id?: string | null
          id?: string
          notes?: string | null
          order_index?: number | null
          scheduled_time?: string
          started_at?: string | null
          status?: string | null
          technician_id?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_runsheet_cues_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_runsheet_cues_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_scheduled_content: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          content_item_id: string | null
          content_preview: string | null
          created_at: string
          id: string
          media_urls: string[] | null
          platform: string
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          content_item_id?: string | null
          content_preview?: string | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          platform: string
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          content_item_id?: string | null
          content_preview?: string | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          platform?: string
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_scheduled_content_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "workspace_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_scheduled_content_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_scores: {
        Row: {
          assignment_id: string
          comments: string | null
          created_at: string | null
          id: string
          is_finalist_vote: boolean | null
          judge_id: string
          private_notes: string | null
          rubric_id: string | null
          scored_at: string | null
          scores: Json
          submission_id: string
          total_score: number | null
          updated_at: string | null
          weighted_score: number | null
          workspace_id: string
        }
        Insert: {
          assignment_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          is_finalist_vote?: boolean | null
          judge_id: string
          private_notes?: string | null
          rubric_id?: string | null
          scored_at?: string | null
          scores?: Json
          submission_id: string
          total_score?: number | null
          updated_at?: string | null
          weighted_score?: number | null
          workspace_id: string
        }
        Update: {
          assignment_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          is_finalist_vote?: boolean | null
          judge_id?: string
          private_notes?: string | null
          rubric_id?: string | null
          scored_at?: string | null
          scores?: Json
          submission_id?: string
          total_score?: number | null
          updated_at?: string | null
          weighted_score?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_scores_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "workspace_judge_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "workspace_judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_scores_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "workspace_rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "workspace_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_scores_workspace_id_fkey"
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
      workspace_shot_lists: {
        Row: {
          assigned_to: string | null
          assignee_name: string | null
          camera_settings: string | null
          captured_asset_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_segment: string | null
          id: string
          location: string | null
          notes: string | null
          priority: string | null
          scheduled_time: string | null
          shot_type: string | null
          sort_order: number | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          assignee_name?: string | null
          camera_settings?: string | null
          captured_asset_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_segment?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string | null
          scheduled_time?: string | null
          shot_type?: string | null
          sort_order?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          assignee_name?: string | null
          camera_settings?: string | null
          captured_asset_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_segment?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string | null
          scheduled_time?: string | null
          shot_type?: string | null
          sort_order?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_shot_lists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_shot_lists_captured_asset_id_fkey"
            columns: ["captured_asset_id"]
            isOneToOne: false
            referencedRelation: "workspace_media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_shot_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_shot_lists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_social_api_credentials: {
        Row: {
          created_at: string | null
          created_by: string | null
          credential_type: string
          encrypted_credentials: Json
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          platform: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credential_type: string
          encrypted_credentials?: Json
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credential_type?: string
          encrypted_credentials?: Json
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_social_api_credentials_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_social_platforms: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          engagement_rate: number | null
          followers_count: number | null
          following_count: number | null
          handle: string
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          platform: string
          posts_count: number | null
          profile_url: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          following_count?: number | null
          handle: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          platform: string
          posts_count?: number | null
          profile_url?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          following_count?: number | null
          handle?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          platform?: string
          posts_count?: number | null
          profile_url?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_social_platforms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_social_posts: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          engagement_comments: number | null
          engagement_likes: number | null
          engagement_saves: number | null
          engagement_shares: number | null
          hashtags: string[] | null
          id: string
          impressions: number | null
          media_urls: string[] | null
          platform: string
          post_type: string | null
          published_at: string | null
          reach: number | null
          scheduled_for: string | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_comments?: number | null
          engagement_likes?: number | null
          engagement_saves?: number | null
          engagement_shares?: number | null
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          media_urls?: string[] | null
          platform: string
          post_type?: string | null
          published_at?: string | null
          reach?: number | null
          scheduled_for?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_comments?: number | null
          engagement_likes?: number | null
          engagement_saves?: number | null
          engagement_shares?: number | null
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          media_urls?: string[] | null
          platform?: string
          post_type?: string | null
          published_at?: string | null
          reach?: number | null
          scheduled_for?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_social_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_software_licenses: {
        Row: {
          assigned_to_department: string | null
          auto_renew: boolean | null
          cost_per_seat: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          documentation_url: string | null
          event_id: string | null
          expiry_alert_days: number | null
          expiry_date: string | null
          id: string
          license_key: string | null
          license_type: string | null
          name: string
          notes: string | null
          primary_contact_name: string | null
          purchase_date: string | null
          renewal_date: string | null
          seat_alert_threshold: number | null
          status: string | null
          total_cost: number | null
          total_seats: number | null
          updated_at: string | null
          used_seats: number | null
          vendor: string | null
          version: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to_department?: string | null
          auto_renew?: boolean | null
          cost_per_seat?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          documentation_url?: string | null
          event_id?: string | null
          expiry_alert_days?: number | null
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: string | null
          name: string
          notes?: string | null
          primary_contact_name?: string | null
          purchase_date?: string | null
          renewal_date?: string | null
          seat_alert_threshold?: number | null
          status?: string | null
          total_cost?: number | null
          total_seats?: number | null
          updated_at?: string | null
          used_seats?: number | null
          vendor?: string | null
          version?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to_department?: string | null
          auto_renew?: boolean | null
          cost_per_seat?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          documentation_url?: string | null
          event_id?: string | null
          expiry_alert_days?: number | null
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: string | null
          name?: string
          notes?: string | null
          primary_contact_name?: string | null
          purchase_date?: string | null
          renewal_date?: string | null
          seat_alert_threshold?: number | null
          status?: string | null
          total_cost?: number | null
          total_seats?: number | null
          updated_at?: string | null
          used_seats?: number | null
          vendor?: string | null
          version?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_software_licenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_software_licenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_speakers: {
        Row: {
          accommodation_arranged: boolean | null
          av_requirements_approved: boolean | null
          av_requirements_submitted: boolean | null
          av_requirements_text: string | null
          avatar_url: string | null
          bio: string | null
          bio_approved: boolean | null
          bio_submitted: boolean | null
          bio_url: string | null
          created_at: string
          email: string | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          photo_approved: boolean | null
          photo_submitted: boolean | null
          photo_url: string | null
          presentation_approved: boolean | null
          presentation_submitted: boolean | null
          presentation_url: string | null
          role: string | null
          room: string | null
          session_duration: string | null
          session_time: string | null
          session_title: string | null
          session_type: string | null
          status: string
          travel_arranged: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accommodation_arranged?: boolean | null
          av_requirements_approved?: boolean | null
          av_requirements_submitted?: boolean | null
          av_requirements_text?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_approved?: boolean | null
          bio_submitted?: boolean | null
          bio_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          photo_approved?: boolean | null
          photo_submitted?: boolean | null
          photo_url?: string | null
          presentation_approved?: boolean | null
          presentation_submitted?: boolean | null
          presentation_url?: string | null
          role?: string | null
          room?: string | null
          session_duration?: string | null
          session_time?: string | null
          session_title?: string | null
          session_type?: string | null
          status?: string
          travel_arranged?: boolean | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accommodation_arranged?: boolean | null
          av_requirements_approved?: boolean | null
          av_requirements_submitted?: boolean | null
          av_requirements_text?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_approved?: boolean | null
          bio_submitted?: boolean | null
          bio_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          photo_approved?: boolean | null
          photo_submitted?: boolean | null
          photo_url?: string | null
          presentation_approved?: boolean | null
          presentation_submitted?: boolean | null
          presentation_url?: string | null
          role?: string | null
          room?: string | null
          session_duration?: string | null
          session_time?: string | null
          session_title?: string | null
          session_type?: string | null
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
      workspace_sponsor_benefits: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          quantity: number | null
          tier: string
          updated_at: string | null
          value_estimate: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          quantity?: number | null
          tier: string
          updated_at?: string | null
          value_estimate?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          quantity?: number | null
          tier?: string
          updated_at?: string | null
          value_estimate?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_sponsor_benefits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_sponsor_communications: {
        Row: {
          attachments: string[] | null
          content: string | null
          created_at: string | null
          created_by: string | null
          direction: string | null
          id: string
          recipient_email: string | null
          scheduled_for: string | null
          sent_at: string | null
          sponsor_id: string
          status: string | null
          subject: string
          type: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          id?: string
          recipient_email?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sponsor_id: string
          status?: string | null
          subject: string
          type?: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          id?: string
          recipient_email?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sponsor_id?: string
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_sponsor_communications_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "workspace_sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_sponsor_communications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_sponsor_deliverables: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          notes: string | null
          priority: string | null
          proof_url: string | null
          sponsor_id: string
          status: string
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          notes?: string | null
          priority?: string | null
          proof_url?: string | null
          sponsor_id: string
          status?: string
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          priority?: string | null
          proof_url?: string | null
          sponsor_id?: string
          status?: string
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_sponsor_deliverables_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "workspace_sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_sponsor_deliverables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_sponsor_proposals: {
        Row: {
          assigned_to: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          id: string
          next_follow_up_date: string | null
          notes: string | null
          proposal_document_url: string | null
          proposed_tier: string
          proposed_value: number | null
          sponsor_id: string | null
          stage: string
          stage_entered_at: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          next_follow_up_date?: string | null
          notes?: string | null
          proposal_document_url?: string | null
          proposed_tier?: string
          proposed_value?: number | null
          sponsor_id?: string | null
          stage?: string
          stage_entered_at?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          next_follow_up_date?: string | null
          notes?: string | null
          proposal_document_url?: string | null
          proposed_tier?: string
          proposed_value?: number | null
          sponsor_id?: string | null
          stage?: string
          stage_entered_at?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_sponsor_proposals_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "workspace_sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_sponsor_proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_sponsors: {
        Row: {
          amount_paid: number | null
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_signed_at: string | null
          contract_value: number | null
          created_at: string
          deliverables: Json | null
          deliverables_status: Json | null
          id: string
          name: string
          notes: string | null
          payment_status: string | null
          proposal_sent_at: string | null
          status: string
          tier: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_paid?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_signed_at?: string | null
          contract_value?: number | null
          created_at?: string
          deliverables?: Json | null
          deliverables_status?: Json | null
          id?: string
          name: string
          notes?: string | null
          payment_status?: string | null
          proposal_sent_at?: string | null
          status?: string
          tier?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_paid?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_signed_at?: string | null
          contract_value?: number | null
          created_at?: string
          deliverables?: Json | null
          deliverables_status?: Json | null
          id?: string
          name?: string
          notes?: string | null
          payment_status?: string | null
          proposal_sent_at?: string | null
          status?: string
          tier?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_sponsors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_stakeholders: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          metadata: Json | null
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          priority: string | null
          role: string | null
          tags: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          priority?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          priority?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_stakeholders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_submissions: {
        Row: {
          created_at: string | null
          demo_url: string | null
          description: string | null
          event_id: string | null
          id: string
          metadata: Json | null
          presentation_url: string | null
          project_name: string
          repo_url: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          table_number: string | null
          team_name: string
          track: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          demo_url?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          presentation_url?: string | null
          project_name: string
          repo_url?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          table_number?: string | null
          team_name: string
          track?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          demo_url?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          presentation_url?: string | null
          project_name?: string
          repo_url?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          table_number?: string | null
          team_name?: string
          track?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_submissions_workspace_id_fkey"
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
      workspace_support_tickets: {
        Row: {
          affected_system: string | null
          assigned_at: string | null
          assigned_by: string | null
          assignee_id: string | null
          category: Database["public"]["Enums"]["support_ticket_category"]
          created_at: string
          description: string | null
          escalated_at: string | null
          escalated_to: string | null
          escalation_reason: string | null
          event_id: string | null
          first_response_at: string | null
          id: string
          internal_notes: string | null
          is_escalated: boolean | null
          linked_incident_id: string | null
          location: string | null
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          reporter_email: string | null
          reporter_id: string | null
          reporter_name: string | null
          reporter_phone: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_resolution_deadline: string | null
          sla_response_deadline: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          tags: string[] | null
          ticket_number: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          affected_system?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          event_id?: string | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          is_escalated?: boolean | null
          linked_incident_id?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_resolution_deadline?: string | null
          sla_response_deadline?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          tags?: string[] | null
          ticket_number: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          affected_system?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          event_id?: string | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          is_escalated?: boolean | null
          linked_incident_id?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_resolution_deadline?: string | null
          sla_response_deadline?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          tags?: string[] | null
          ticket_number?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_support_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_support_tickets_linked_incident_id_fkey"
            columns: ["linked_incident_id"]
            isOneToOne: false
            referencedRelation: "workspace_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_support_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          approval_policy_id: string | null
          approval_status: string | null
          assigned_by: string | null
          assigned_to: string | null
          attachments: string[] | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          end_date: string | null
          estimated_hours: number | null
          gantt_row_order: number | null
          id: string
          is_milestone: boolean
          location: string | null
          occurrence_number: number | null
          parent_task_id: string | null
          priority: string
          progress: number | null
          recurring_task_id: string | null
          requires_approval: boolean | null
          role_scope: string | null
          source_workspace_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approval_policy_id?: string | null
          approval_status?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          gantt_row_order?: number | null
          id?: string
          is_milestone?: boolean
          location?: string | null
          occurrence_number?: number | null
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          recurring_task_id?: string | null
          requires_approval?: boolean | null
          role_scope?: string | null
          source_workspace_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approval_policy_id?: string | null
          approval_status?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          gantt_row_order?: number | null
          id?: string
          is_milestone?: boolean
          location?: string | null
          occurrence_number?: number | null
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          recurring_task_id?: string | null
          requires_approval?: boolean | null
          role_scope?: string | null
          source_workspace_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recurring_task"
            columns: ["recurring_task_id"]
            isOneToOne: false
            referencedRelation: "workspace_recurring_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tasks_approval_policy_id_fkey"
            columns: ["approval_policy_id"]
            isOneToOne: false
            referencedRelation: "task_approval_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tasks_source_workspace_id_fkey"
            columns: ["source_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
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
      workspace_team_briefings: {
        Row: {
          agenda: string | null
          attendees: Json | null
          briefing_type: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          id: string
          location: string | null
          materials_url: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agenda?: string | null
          attendees?: Json | null
          briefing_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          materials_url?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agenda?: string | null
          attendees?: Json | null
          briefing_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          materials_url?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_team_briefings_workspace_id_fkey"
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
      workspace_tech_check_items: {
        Row: {
          assignee_id: string | null
          checked: boolean | null
          checked_at: string | null
          checked_by: string | null
          created_at: string | null
          description: string | null
          id: string
          label: string
          notes: string | null
          order_index: number | null
          section_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          checked?: boolean | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          notes?: string | null
          order_index?: number | null
          section_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assignee_id?: string | null
          checked?: boolean | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          notes?: string | null
          order_index?: number | null
          section_id?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tech_check_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "workspace_tech_check_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tech_check_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tech_check_sections: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string | null
          icon: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tech_check_sections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tech_check_sections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_ticket_activities: {
        Row: {
          activity_type: string
          comment: string | null
          created_at: string
          id: string
          new_value: string | null
          performed_by: string | null
          performed_by_name: string | null
          previous_value: string | null
          ticket_id: string
        }
        Insert: {
          activity_type: string
          comment?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          previous_value?: string | null
          ticket_id: string
        }
        Update: {
          activity_type?: string
          comment?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          previous_value?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ticket_activities_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "workspace_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_time_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          end_time: string | null
          hours: number
          id: string
          is_billable: boolean
          is_running: boolean
          start_time: string | null
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
          end_time?: string | null
          hours: number
          id?: string
          is_billable?: boolean
          is_running?: boolean
          start_time?: string | null
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
          end_time?: string | null
          hours?: number
          id?: string
          is_billable?: boolean
          is_running?: boolean
          start_time?: string | null
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
      workspace_transport_schedules: {
        Row: {
          capacity: number | null
          created_at: string | null
          created_by: string | null
          departure_time: string | null
          driver_contact: string | null
          driver_name: string | null
          dropoff_location: string | null
          id: string
          name: string
          notes: string | null
          passengers_booked: number | null
          pickup_location: string | null
          status: string
          transport_type: string
          updated_at: string | null
          vehicle_info: string | null
          workspace_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          departure_time?: string | null
          driver_contact?: string | null
          driver_name?: string | null
          dropoff_location?: string | null
          id?: string
          name: string
          notes?: string | null
          passengers_booked?: number | null
          pickup_location?: string | null
          status?: string
          transport_type?: string
          updated_at?: string | null
          vehicle_info?: string | null
          workspace_id: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          departure_time?: string | null
          driver_contact?: string | null
          driver_name?: string | null
          dropoff_location?: string | null
          id?: string
          name?: string
          notes?: string | null
          passengers_booked?: number | null
          pickup_location?: string | null
          status?: string
          transport_type?: string
          updated_at?: string | null
          vehicle_info?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_transport_schedules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_venue_walkthroughs: {
        Row: {
          attendees: string[] | null
          completed_at: string | null
          created_at: string
          findings: Json | null
          id: string
          lead_id: string | null
          lead_name: string | null
          name: string
          notes: string | null
          route_areas: string[] | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attendees?: string[] | null
          completed_at?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          name: string
          notes?: string | null
          route_areas?: string[] | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attendees?: string[] | null
          completed_at?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          name?: string
          notes?: string | null
          route_areas?: string[] | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_venue_walkthroughs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_vip_guests: {
        Row: {
          accessibility_needs: string | null
          arrival_time: string | null
          company: string | null
          created_at: string
          departure_time: string | null
          dietary_requirements: string | null
          email: string | null
          escort_assigned: string | null
          event_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          seating_assignment: string | null
          status: string
          title: string | null
          updated_at: string
          vip_level: string | null
          workspace_id: string
        }
        Insert: {
          accessibility_needs?: string | null
          arrival_time?: string | null
          company?: string | null
          created_at?: string
          departure_time?: string | null
          dietary_requirements?: string | null
          email?: string | null
          escort_assigned?: string | null
          event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          seating_assignment?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          vip_level?: string | null
          workspace_id: string
        }
        Update: {
          accessibility_needs?: string | null
          arrival_time?: string | null
          company?: string | null
          created_at?: string
          departure_time?: string | null
          dietary_requirements?: string | null
          email?: string | null
          escort_assigned?: string | null
          event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          seating_assignment?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          vip_level?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_vip_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_vip_guests_workspace_id_fkey"
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
          settings: Json | null
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
          settings?: Json | null
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
          settings?: Json | null
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
      check_blocked_status: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_event_slug_availability: {
        Args: { _event_id?: string; _organization_id: string; _slug: string }
        Returns: Json
      }
      check_username_availability: {
        Args: { _user_id?: string; _username: string }
        Returns: Json
      }
      count_not_checked_in: { Args: { p_event_id: string }; Returns: number }
      decrement_poll_vote: { Args: { p_option_id: string }; Returns: undefined }
      decrement_sold_count: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: boolean
      }
      decrement_ticket_sold_count: {
        Args: { quantity: number; ticket_id: string }
        Returns: undefined
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_catering_vendors_secure: {
        Args: { _workspace_id: string }
        Returns: {
          address: string
          contact_name: string
          contract_value: number
          created_at: string
          email: string
          id: string
          name: string
          notes: string
          phone: string
          rating: number
          status: string
          updated_at: string
          vendor_type: string
          workspace_id: string
        }[]
      }
      get_event_registrant_profile: {
        Args: { _event_id: string; _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          id: string
          organization: string
        }[]
      }
      get_event_registrants_profiles: {
        Args: { _event_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          organization: string
        }[]
      }
      get_org_member_profile: {
        Args: { _organization_id: string; _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          id: string
          organization: string
        }[]
      }
      get_org_members_profiles: {
        Args: { _organization_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          organization: string
        }[]
      }
      get_public_event_by_slug: {
        Args: { _event_slug: string; _org_slug: string }
        Returns: {
          branding: Json
          capacity: number
          category: Database["public"]["Enums"]["event_category"]
          description: string
          end_date: string
          id: string
          landing_page_data: Json
          landing_page_slug: string
          mode: Database["public"]["Enums"]["event_mode"]
          name: string
          slug: string
          start_date: string
        }[]
      }
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
      get_public_organizations_list: {
        Args: never
        Returns: {
          category: string
          city: string
          country: string
          description: string
          id: string
          logo_url: string
          name: string
          slug: string
          state: string
          verification_status: string
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
      get_team_member_count: { Args: { p_team_id: string }; Returns: number }
      has_certificate_permission: {
        Args: { _permission: string; _user_id?: string; _workspace_id: string }
        Returns: boolean
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
      has_workspace_management_access: {
        Args: { _user_id?: string; _workspace_id: string }
        Returns: boolean
      }
      increment_booth_visit: {
        Args: { p_booth_id: string }
        Returns: undefined
      }
      increment_poll_vote: { Args: { p_option_id: string }; Returns: undefined }
      increment_sold_count: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: boolean
      }
      increment_spark_count: { Args: { post_id: string }; Returns: undefined }
      increment_ticket_sold_count: {
        Args: { quantity: number; ticket_id: string }
        Returns: undefined
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
      log_role_change: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_new_value?: string
          p_old_value?: string
          p_reason?: string
          p_resource_id?: string
          p_resource_type?: string
          p_role_type: string
          p_target_user_id: string
          p_user_id: string
        }
        Returns: string
      }
      record_organization_product_metrics: {
        Args: { _event_type: string; _product_ids: string[] }
        Returns: undefined
      }
      reorder_waitlist_positions: {
        Args: { p_entry_id: string; p_event_id: string; p_new_position: number }
        Returns: undefined
      }
      search_messages_by_username: {
        Args: { _channel_id: string; _limit?: number; _search_term: string }
        Returns: {
          channel_id: string
          content: string
          id: string
          sender_avatar: string
          sender_id: string
          sender_name: string
          sent_at: string
        }[]
      }
      update_user_streak: { Args: { user_uuid: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "organizer" | "participant" | "vendor"
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
      support_ticket_category:
        | "bug"
        | "request"
        | "question"
        | "incident"
        | "feature"
        | "hardware"
        | "network"
        | "other"
      support_ticket_priority: "low" | "medium" | "high" | "critical"
      support_ticket_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "pending"
        | "on_hold"
        | "resolved"
        | "closed"
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
      app_role: ["admin", "organizer", "participant", "vendor"],
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
      support_ticket_category: [
        "bug",
        "request",
        "question",
        "incident",
        "feature",
        "hardware",
        "network",
        "other",
      ],
      support_ticket_priority: ["low", "medium", "high", "critical"],
      support_ticket_status: [
        "open",
        "assigned",
        "in_progress",
        "pending",
        "on_hold",
        "resolved",
        "closed",
      ],
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
