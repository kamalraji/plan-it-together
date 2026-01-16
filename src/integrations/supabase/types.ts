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
          created_at: string
          current_event_id: string | null
          education_status: string
          full_name: string
          headline: string
          id: string
          impact_score: number
          interests: string[]
          is_online: boolean
          last_seen: string
          level: number
          looking_for: string[]
          organization: string | null
          relationship_status: string
          skills: string[]
          updated_at: string
          user_id: string
          vibe_emoji: string
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[]
          bio?: string | null
          created_at?: string
          current_event_id?: string | null
          education_status?: string
          full_name: string
          headline?: string
          id?: string
          impact_score?: number
          interests?: string[]
          is_online?: boolean
          last_seen?: string
          level?: number
          looking_for?: string[]
          organization?: string | null
          relationship_status?: string
          skills?: string[]
          updated_at?: string
          user_id: string
          vibe_emoji?: string
        }
        Update: {
          avatar_url?: string | null
          badges?: string[]
          bio?: string | null
          created_at?: string
          current_event_id?: string | null
          education_status?: string
          full_name?: string
          headline?: string
          id?: string
          impact_score?: number
          interests?: string[]
          is_online?: boolean
          last_seen?: string
          level?: number
          looking_for?: string[]
          organization?: string | null
          relationship_status?: string
          skills?: string[]
          updated_at?: string
          user_id?: string
          vibe_emoji?: string
        }
        Relationships: []
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
      messages: {
        Row: {
          attachments: Json | null
          channel_id: string
          content: string
          edited_at: string | null
          id: string
          sender_avatar: string | null
          sender_id: string
          sender_name: string
          sent_at: string
        }
        Insert: {
          attachments?: Json | null
          channel_id: string
          content?: string
          edited_at?: string | null
          id?: string
          sender_avatar?: string | null
          sender_id: string
          sender_name: string
          sent_at?: string
        }
        Update: {
          attachments?: Json | null
          channel_id?: string
          content?: string
          edited_at?: string | null
          id?: string
          sender_avatar?: string | null
          sender_id?: string
          sender_name?: string
          sent_at?: string
        }
        Relationships: []
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
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
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
          id: string
          is_anonymous: boolean
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
          id?: string
          is_anonymous?: boolean
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
          id?: string
          is_anonymous?: boolean
          spark_count?: number
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
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
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
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
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
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
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          reported_by: string | null
          reported_by_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          reported_by?: string | null
          reported_by_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          reported_by?: string | null
          reported_by_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
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
          role_scope: string | null
          source_workspace_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
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
          role_scope?: string | null
          source_workspace_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
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
      record_organization_product_metrics: {
        Args: { _event_type: string; _product_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "organizer" | "participant"
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
      app_role: ["admin", "organizer", "participant"],
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
