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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      broadcast_credits: {
        Row: {
          created_at: string
          credits_included: number
          credits_remaining: number
          credits_used: number
          id: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_included: number
          credits_remaining: number
          credits_used?: number
          id?: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_included?: number
          credits_remaining?: number
          credits_used?: number
          id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_credits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_live_transcript_chunks: {
        Row: {
          chunk_text: string
          created_at: string
          id: string
          organization_id: string
          sequence: number
          stream_id: string
        }
        Insert: {
          chunk_text: string
          created_at?: string
          id?: string
          organization_id: string
          sequence?: number
          stream_id: string
        }
        Update: {
          chunk_text?: string
          created_at?: string
          id?: string
          organization_id?: string
          sequence?: number
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_live_transcript_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_live_transcript_chunks_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "broadcast_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_member_responses: {
        Row: {
          created_at: string
          id: string
          member_id: string | null
          organization_id: string
          question_id: string
          response_score: number | null
          response_text: string
          sermon_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id?: string | null
          organization_id: string
          question_id: string
          response_score?: number | null
          response_text: string
          sermon_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string | null
          organization_id?: string
          question_id?: string
          response_score?: number | null
          response_text?: string
          sermon_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_member_responses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "broadcast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_member_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_member_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "broadcast_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_member_responses_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "broadcast_sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_members: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          opted_in: boolean
          organization_id: string
          phone: string | null
          push_platform: string | null
          push_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          opted_in?: boolean
          organization_id: string
          phone?: string | null
          push_platform?: string | null
          push_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          opted_in?: boolean
          organization_id?: string
          phone?: string | null
          push_platform?: string | null
          push_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_org_settings: {
        Row: {
          created_at: string
          default_question_count: number
          email_enabled: boolean
          facebook_page_id: string | null
          id: string
          organization_id: string
          podcast_rss_url: string | null
          push_enabled: boolean
          updated_at: string
          youtube_channel_id: string | null
        }
        Insert: {
          created_at?: string
          default_question_count?: number
          email_enabled?: boolean
          facebook_page_id?: string | null
          id?: string
          organization_id: string
          podcast_rss_url?: string | null
          push_enabled?: boolean
          updated_at?: string
          youtube_channel_id?: string | null
        }
        Update: {
          created_at?: string
          default_question_count?: number
          email_enabled?: boolean
          facebook_page_id?: string | null
          id?: string
          organization_id?: string
          podcast_rss_url?: string | null
          push_enabled?: boolean
          updated_at?: string
          youtube_channel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_org_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_podcast_episodes: {
        Row: {
          audio_url: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          organization_id: string
          podcast_platforms: Json
          published_at: string | null
          sermon_id: string
          status: string
          stream_id: string
          title: string
          updated_at: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          organization_id: string
          podcast_platforms?: Json
          published_at?: string | null
          sermon_id: string
          status?: string
          stream_id: string
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          organization_id?: string
          podcast_platforms?: Json
          published_at?: string | null
          sermon_id?: string
          status?: string
          stream_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_podcast_episodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_podcast_episodes_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "broadcast_sermons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_podcast_episodes_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "broadcast_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_question_sends: {
        Row: {
          channel: string
          id: string
          organization_id: string
          recipient_count: number
          sent_at: string
          sermon_id: string
        }
        Insert: {
          channel: string
          id?: string
          organization_id: string
          recipient_count?: number
          sent_at?: string
          sermon_id: string
        }
        Update: {
          channel?: string
          id?: string
          organization_id?: string
          recipient_count?: number
          sent_at?: string
          sermon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_question_sends_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_question_sends_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "broadcast_sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          organization_id: string
          question_text: string
          question_type: string
          scripture_ref: string | null
          sermon_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          organization_id: string
          question_text: string
          question_type?: string
          scripture_ref?: string | null
          sermon_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          organization_id?: string
          question_text?: string
          question_type?: string
          scripture_ref?: string | null
          sermon_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_questions_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "broadcast_sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_sermons: {
        Row: {
          ai_processed_at: string | null
          ai_processing_status: string
          created_at: string
          credits_used: number | null
          id: string
          main_points: Json | null
          organization_id: string
          scripture_refs: Json
          stream_id: string
          summary: string | null
          title: string
          transcript_id: string | null
          updated_at: string
        }
        Insert: {
          ai_processed_at?: string | null
          ai_processing_status?: string
          created_at?: string
          credits_used?: number | null
          id?: string
          main_points?: Json | null
          organization_id: string
          scripture_refs?: Json
          stream_id: string
          summary?: string | null
          title: string
          transcript_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_processed_at?: string | null
          ai_processing_status?: string
          created_at?: string
          credits_used?: number | null
          id?: string
          main_points?: Json | null
          organization_id?: string
          scripture_refs?: Json
          stream_id?: string
          summary?: string | null
          title?: string
          transcript_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_sermons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_sermons_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "broadcast_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_sermons_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "broadcast_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_streams: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          duration_seconds: number | null
          ended_at: string | null
          facebook_video_id: string | null
          id: string
          ingress_id: string | null
          livekit_room_name: string | null
          livekit_room_sid: string | null
          organization_id: string
          recording_url: string | null
          rtmp_output_urls: Json | null
          rtmp_url: string | null
          scheduled_start_at: string | null
          started_at: string | null
          status: string
          stream_key: string | null
          title: string
          updated_at: string
          viewer_peak_count: number | null
          youtube_video_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          facebook_video_id?: string | null
          id?: string
          ingress_id?: string | null
          livekit_room_name?: string | null
          livekit_room_sid?: string | null
          organization_id: string
          recording_url?: string | null
          rtmp_output_urls?: Json | null
          rtmp_url?: string | null
          scheduled_start_at?: string | null
          started_at?: string | null
          status?: string
          stream_key?: string | null
          title: string
          updated_at?: string
          viewer_peak_count?: number | null
          youtube_video_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          facebook_video_id?: string | null
          id?: string
          ingress_id?: string | null
          livekit_room_name?: string | null
          livekit_room_sid?: string | null
          organization_id?: string
          recording_url?: string | null
          rtmp_output_urls?: Json | null
          rtmp_url?: string | null
          scheduled_start_at?: string | null
          started_at?: string | null
          status?: string
          stream_key?: string | null
          title?: string
          updated_at?: string
          viewer_peak_count?: number | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_streams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_transcripts: {
        Row: {
          created_at: string
          full_text: string | null
          id: string
          organization_id: string
          raw_chunks: Json | null
          stream_id: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          full_text?: string | null
          id?: string
          organization_id: string
          raw_chunks?: Json | null
          stream_id: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          full_text?: string | null
          id?: string
          organization_id?: string
          raw_chunks?: Json | null
          stream_id?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_transcripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_transcripts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "broadcast_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender_id: string
          sender_type: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender_id: string
          sender_type: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          sender_type?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          connection_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "peer_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      church_market_survey_responses: {
        Row: {
          admin_hours_per_month: string | null
          ai_form_interest: string | null
          ai_member_curation: string | null
          ai_sermon_content: string | null
          allow_follow_up: boolean | null
          annual_budget: string | null
          auto_giving_features: string[] | null
          auto_giving_interest: string | null
          auto_transfer_fee_comfort: string | null
          automation_needs: string[] | null
          better_ways_to_give: string[] | null
          biggest_challenges: string[] | null
          campaign_tools_interest: string | null
          church_name: string | null
          communication_automation: string[] | null
          congregation_engagement: string[] | null
          contact_email: string | null
          created_at: string | null
          currently_live_stream: string | null
          distribution_method: string | null
          easier_giving_ideas: string | null
          event_posting_needs: string | null
          finance_staff_count: string | null
          has_website: string | null
          id: string
          live_stream_ai_features: string[] | null
          live_stream_challenges: string[] | null
          live_stream_giving_interest: string | null
          live_stream_platform: string | null
          member_communication: string[] | null
          member_development_tools: string[] | null
          missionaries_supported: string | null
          monthly_price_range: string | null
          networking_importance: string | null
          org_type: string | null
          paperwork_method: string | null
          pastor_approval_workflow: string | null
          percent_fee_preference: string | null
          phone_number: string | null
          respondent_name: string | null
          software_type: string | null
          software_vs_streaming: string | null
          spend_to_solve_problem: string | null
          switch_triggers: string[] | null
          teaching_packets_interest: string | null
          team_growth_tracking: string | null
          tech_type_needed: string | null
          top_features: string[] | null
          want_charts_dashboard: string | null
          website_tool_needs: string[] | null
          weekly_attendance: string | null
          wish_tech_improved: string[] | null
        }
        Insert: {
          admin_hours_per_month?: string | null
          ai_form_interest?: string | null
          ai_member_curation?: string | null
          ai_sermon_content?: string | null
          allow_follow_up?: boolean | null
          annual_budget?: string | null
          auto_giving_features?: string[] | null
          auto_giving_interest?: string | null
          auto_transfer_fee_comfort?: string | null
          automation_needs?: string[] | null
          better_ways_to_give?: string[] | null
          biggest_challenges?: string[] | null
          campaign_tools_interest?: string | null
          church_name?: string | null
          communication_automation?: string[] | null
          congregation_engagement?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          currently_live_stream?: string | null
          distribution_method?: string | null
          easier_giving_ideas?: string | null
          event_posting_needs?: string | null
          finance_staff_count?: string | null
          has_website?: string | null
          id?: string
          live_stream_ai_features?: string[] | null
          live_stream_challenges?: string[] | null
          live_stream_giving_interest?: string | null
          live_stream_platform?: string | null
          member_communication?: string[] | null
          member_development_tools?: string[] | null
          missionaries_supported?: string | null
          monthly_price_range?: string | null
          networking_importance?: string | null
          org_type?: string | null
          paperwork_method?: string | null
          pastor_approval_workflow?: string | null
          percent_fee_preference?: string | null
          phone_number?: string | null
          respondent_name?: string | null
          software_type?: string | null
          software_vs_streaming?: string | null
          spend_to_solve_problem?: string | null
          switch_triggers?: string[] | null
          teaching_packets_interest?: string | null
          team_growth_tracking?: string | null
          tech_type_needed?: string | null
          top_features?: string[] | null
          want_charts_dashboard?: string | null
          website_tool_needs?: string[] | null
          weekly_attendance?: string | null
          wish_tech_improved?: string[] | null
        }
        Update: {
          admin_hours_per_month?: string | null
          ai_form_interest?: string | null
          ai_member_curation?: string | null
          ai_sermon_content?: string | null
          allow_follow_up?: boolean | null
          annual_budget?: string | null
          auto_giving_features?: string[] | null
          auto_giving_interest?: string | null
          auto_transfer_fee_comfort?: string | null
          automation_needs?: string[] | null
          better_ways_to_give?: string[] | null
          biggest_challenges?: string[] | null
          campaign_tools_interest?: string | null
          church_name?: string | null
          communication_automation?: string[] | null
          congregation_engagement?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          currently_live_stream?: string | null
          distribution_method?: string | null
          easier_giving_ideas?: string | null
          event_posting_needs?: string | null
          finance_staff_count?: string | null
          has_website?: string | null
          id?: string
          live_stream_ai_features?: string[] | null
          live_stream_challenges?: string[] | null
          live_stream_giving_interest?: string | null
          live_stream_platform?: string | null
          member_communication?: string[] | null
          member_development_tools?: string[] | null
          missionaries_supported?: string | null
          monthly_price_range?: string | null
          networking_importance?: string | null
          org_type?: string | null
          paperwork_method?: string | null
          pastor_approval_workflow?: string | null
          percent_fee_preference?: string | null
          phone_number?: string | null
          respondent_name?: string | null
          software_type?: string | null
          software_vs_streaming?: string | null
          spend_to_solve_problem?: string | null
          switch_triggers?: string[] | null
          teaching_packets_interest?: string | null
          team_growth_tracking?: string | null
          tech_type_needed?: string | null
          top_features?: string[] | null
          want_charts_dashboard?: string | null
          website_tool_needs?: string[] | null
          weekly_attendance?: string | null
          wish_tech_improved?: string[] | null
        }
        Relationships: []
      }
      connect_accounts: {
        Row: {
          created_at: string | null
          details_submitted: boolean | null
          endowment_fund_id: string | null
          id: string
          stripe_account_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details_submitted?: boolean | null
          endowment_fund_id?: string | null
          id?: string
          stripe_account_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details_submitted?: boolean | null
          endowment_fund_id?: string | null
          id?: string
          stripe_account_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connect_accounts_endowment_fund_id_fkey"
            columns: ["endowment_fund_id"]
            isOneToOne: false
            referencedRelation: "endowment_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_campaigns: {
        Row: {
          allow_anonymous: boolean | null
          allow_recurring: boolean | null
          created_at: string | null
          current_amount_cents: number | null
          description: string | null
          goal_amount_cents: number | null
          goal_deadline: string | null
          id: string
          is_active: boolean | null
          minimum_amount_cents: number | null
          name: string
          organization_id: string
          suggested_amounts: Json | null
          updated_at: string | null
        }
        Insert: {
          allow_anonymous?: boolean | null
          allow_recurring?: boolean | null
          created_at?: string | null
          current_amount_cents?: number | null
          description?: string | null
          goal_amount_cents?: number | null
          goal_deadline?: string | null
          id?: string
          is_active?: boolean | null
          minimum_amount_cents?: number | null
          name: string
          organization_id: string
          suggested_amounts?: Json | null
          updated_at?: string | null
        }
        Update: {
          allow_anonymous?: boolean | null
          allow_recurring?: boolean | null
          created_at?: string | null
          current_amount_cents?: number | null
          description?: string | null
          goal_amount_cents?: number | null
          goal_deadline?: string | null
          id?: string
          is_active?: boolean | null
          minimum_amount_cents?: number | null
          name?: string
          organization_id?: string
          suggested_amounts?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_links: {
        Row: {
          created_at: string | null
          endowment_fund_id: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          split_mode: string | null
          splits: Json
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          endowment_fund_id?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          split_mode?: string | null
          splits?: Json
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          endowment_fund_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          split_mode?: string | null
          splits?: Json
          stripe_product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_links_endowment_fund_id_fkey"
            columns: ["endowment_fund_id"]
            isOneToOne: false
            referencedRelation: "endowment_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount_cents: number
          campaign_id: string | null
          created_at: string | null
          currency: string
          donor_email: string | null
          donor_name: string | null
          endowment_fund_id: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          receipt_token: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          endowment_fund_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          receipt_token?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          endowment_fund_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          receipt_token?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_endowment_fund_id_fkey"
            columns: ["endowment_fund_id"]
            isOneToOne: false
            referencedRelation: "endowment_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_saved_organizations: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_saved_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_subscriptions: {
        Row: {
          amount_cents: number
          campaign_id: string | null
          created_at: string | null
          currency: string
          id: string
          interval: string
          organization_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          interval: string
          organization_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          interval?: string
          organization_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_subscriptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dwolla_transfers: {
        Row: {
          amount_cents: number
          created_at: string | null
          donation_id: string | null
          dwolla_event_id: string | null
          dwolla_transfer_url: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          next_retry_at: string | null
          retry_count: number | null
          split_bank_account_id: string
          status: string
          stripe_payment_intent_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          donation_id?: string | null
          dwolla_event_id?: string | null
          dwolla_transfer_url?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          retry_count?: number | null
          split_bank_account_id: string
          status?: string
          stripe_payment_intent_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          donation_id?: string | null
          dwolla_event_id?: string | null
          dwolla_transfer_url?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          retry_count?: number | null
          split_bank_account_id?: string
          status?: string
          stripe_payment_intent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dwolla_transfers_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dwolla_transfers_split_bank_account_id_fkey"
            columns: ["split_bank_account_id"]
            isOneToOne: false
            referencedRelation: "split_bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      dwolla_webhook_events: {
        Row: {
          created_at: string | null
          id: string
          processed_at: string | null
          resource_id: string | null
          topic: string
        }
        Insert: {
          created_at?: string | null
          id: string
          processed_at?: string | null
          resource_id?: string | null
          topic: string
        }
        Update: {
          created_at?: string | null
          id?: string
          processed_at?: string | null
          resource_id?: string | null
          topic?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          created_at: string | null
          email_type: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email_type: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email_type?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      endowment_funds: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          stripe_connect_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          stripe_connect_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          stripe_connect_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_at: string
          eventbrite_event_id: string | null
          eventbrite_org_id: string | null
          id: string
          image_url: string | null
          name: string
          online_event: boolean | null
          organization_id: string
          slug: string
          start_at: string
          ticket_classes: Json | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_at: string
          eventbrite_event_id?: string | null
          eventbrite_org_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          online_event?: boolean | null
          organization_id: string
          slug: string
          start_at: string
          ticket_classes?: Json | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string
          eventbrite_event_id?: string | null
          eventbrite_org_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          online_event?: boolean | null
          organization_id?: string
          slug?: string
          start_at?: string
          ticket_classes?: Json | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
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
      feed_item_comments: {
        Row: {
          content: string
          created_at: string | null
          feed_item_id: string
          id: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          feed_item_id: string
          id?: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          feed_item_id?: string
          id?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_item_comments_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_item_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_item_reactions: {
        Row: {
          created_at: string | null
          feed_item_id: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feed_item_id: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feed_item_id?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_item_reactions_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          author_id: string | null
          author_type: string | null
          created_at: string
          geo_region: string | null
          id: string
          item_type: string
          organization_id: string
          payload: Json
        }
        Insert: {
          author_id?: string | null
          author_type?: string | null
          created_at?: string
          geo_region?: string | null
          id?: string
          item_type: string
          organization_id: string
          payload?: Json
        }
        Update: {
          author_id?: string | null
          author_type?: string | null
          created_at?: string
          geo_region?: string | null
          id?: string
          item_type?: string
          organization_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_customizations: {
        Row: {
          allow_custom_amount: boolean | null
          background_color: string | null
          button_border_radius: string | null
          button_color: string | null
          button_text_color: string | null
          created_at: string | null
          design_sets: Json | null
          donation_section_layout: string | null
          embed_form_theme: string | null
          font_family: string | null
          font_weight: string | null
          form_display_mode: string | null
          form_media_side: string | null
          header_image_url: string | null
          header_text: string | null
          id: string
          internal_splits: Json | null
          logo_url: string | null
          org_page_donate_link_slug: string | null
          org_page_embed_card_id: string | null
          website_embed_card_id: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          show_endowment_selection: boolean | null
          split_mode: string | null
          splits: Json | null
          subheader_text: string | null
          suggested_amounts: Json | null
          text_color: string | null
          thank_you_cta_text: string | null
          thank_you_cta_url: string | null
          thank_you_message: string | null
          thank_you_video_url: string | null
          updated_at: string | null
        }
        Insert: {
          allow_custom_amount?: boolean | null
          background_color?: string | null
          button_border_radius?: string | null
          button_color?: string | null
          button_text_color?: string | null
          created_at?: string | null
          design_sets?: Json | null
          donation_section_layout?: string | null
          embed_form_theme?: string | null
          font_family?: string | null
          font_weight?: string | null
          form_display_mode?: string | null
          form_media_side?: string | null
          header_image_url?: string | null
          header_text?: string | null
          id?: string
          internal_splits?: Json | null
          logo_url?: string | null
          org_page_donate_link_slug?: string | null
          org_page_embed_card_id?: string | null
          website_embed_card_id?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          show_endowment_selection?: boolean | null
          split_mode?: string | null
          splits?: Json | null
          subheader_text?: string | null
          suggested_amounts?: Json | null
          text_color?: string | null
          thank_you_cta_text?: string | null
          thank_you_cta_url?: string | null
          thank_you_message?: string | null
          thank_you_video_url?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_custom_amount?: boolean | null
          background_color?: string | null
          button_border_radius?: string | null
          button_color?: string | null
          button_text_color?: string | null
          created_at?: string | null
          design_sets?: Json | null
          donation_section_layout?: string | null
          embed_form_theme?: string | null
          font_family?: string | null
          font_weight?: string | null
          form_display_mode?: string | null
          form_media_side?: string | null
          header_image_url?: string | null
          header_text?: string | null
          id?: string
          internal_splits?: Json | null
          logo_url?: string | null
          org_page_donate_link_slug?: string | null
          org_page_embed_card_id?: string | null
          website_embed_card_id?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          show_endowment_selection?: boolean | null
          split_mode?: string | null
          splits?: Json | null
          subheader_text?: string | null
          suggested_amounts?: Json | null
          text_color?: string | null
          thank_you_cta_text?: string | null
          thank_you_cta_url?: string | null
          thank_you_message?: string | null
          thank_you_video_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_customizations_org_page_embed_card_id_fkey"
            columns: ["org_page_embed_card_id"]
            isOneToOne: false
            referencedRelation: "org_embed_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_customizations_website_embed_card_id_fkey"
            columns: ["website_embed_card_id"]
            isOneToOne: false
            referencedRelation: "org_embed_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_customizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_requests: {
        Row: {
          amount_cents: number
          created_at: string | null
          description: string | null
          fulfilled_amount_cents: number | null
          id: string
          requesting_org_id: string
          status: string
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          description?: string | null
          fulfilled_amount_cents?: number | null
          id?: string
          requesting_org_id: string
          status?: string
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          description?: string | null
          fulfilled_amount_cents?: number | null
          id?: string
          requesting_org_id?: string
          status?: string
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_requests_requesting_org_id_fkey"
            columns: ["requesting_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_split_payouts: {
        Row: {
          created_at: string | null
          id: string
          stripe_payment_intent_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_payment_intent_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_payment_intent_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      org_embed_cards: {
        Row: {
          button_color: string | null
          button_text_color: string | null
          campaign_id: string | null
          created_at: string | null
          deleted_at: string | null
          design_set: Json | null
          goal_description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          organization_id: string
          page_section: string | null
          primary_color: string | null
          sort_order: number | null
          split_mode: string | null
          splits: Json | null
          style: string
          updated_at: string | null
        }
        Insert: {
          button_color?: string | null
          button_text_color?: string | null
          campaign_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          design_set?: Json | null
          goal_description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          organization_id: string
          page_section?: string | null
          primary_color?: string | null
          sort_order?: number | null
          split_mode?: string | null
          splits?: Json | null
          style: string
          updated_at?: string | null
        }
        Update: {
          button_color?: string | null
          button_text_color?: string | null
          campaign_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          design_set?: Json | null
          goal_description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          organization_id?: string
          page_section?: string | null
          primary_color?: string | null
          sort_order?: number | null
          split_mode?: string | null
          splits?: Json | null
          style?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_embed_cards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_embed_cards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_admins: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string | null
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
      organization_domains: {
        Row: {
          acm_cert_arn: string | null
          created_at: string | null
          dns_provider: string | null
          domain: string
          id: string
          organization_id: string
          status: string
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          acm_cert_arn?: string | null
          created_at?: string | null
          dns_provider?: string | null
          domain: string
          id?: string
          organization_id: string
          status?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          acm_cert_arn?: string | null
          created_at?: string | null
          dns_provider?: string | null
          domain?: string
          id?: string
          organization_id?: string
          status?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_team_members: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          organization_id: string
          role: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          organization_id: string
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organization_id?: string
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          card_preview_image_url: string | null
          card_preview_video_url: string | null
          causes: string[] | null
          city: string | null
          created_at: string | null
          description: string | null
          dwolla_customer_url: string | null
          dwolla_source_funding_source_url: string | null
          eventbrite_access_token: string | null
          eventbrite_org_id: string | null
          eventbrite_refresh_token: string | null
          id: string
          logo_url: string | null
          member_count: number | null
          name: string
          onboarding_completed: boolean | null
          org_type: string | null
          owner_user_id: string | null
          page_about_image_side: string | null
          page_donation_goal_cents: number | null
          page_goals: string | null
          page_hero_image_url: string | null
          page_hero_video_url: string | null
          page_mission: string | null
          page_story: string | null
          page_story_image_side: string | null
          page_story_image_url: string | null
          page_summary: string | null
          profile_image_url: string | null
          published_website_project_id: string | null
          region: string | null
          slug: string
          state: string | null
          stripe_connect_account_id: string | null
          updated_at: string | null
          website_forms_forward_to_email: string | null
          website_forms_reply_name: string | null
          website_url: string | null
          years_in_operation: number | null
        }
        Insert: {
          card_preview_image_url?: string | null
          card_preview_video_url?: string | null
          causes?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          dwolla_customer_url?: string | null
          dwolla_source_funding_source_url?: string | null
          eventbrite_access_token?: string | null
          eventbrite_org_id?: string | null
          eventbrite_refresh_token?: string | null
          id?: string
          logo_url?: string | null
          member_count?: number | null
          name: string
          onboarding_completed?: boolean | null
          org_type?: string | null
          owner_user_id?: string | null
          page_about_image_side?: string | null
          page_donation_goal_cents?: number | null
          page_goals?: string | null
          page_hero_image_url?: string | null
          page_hero_video_url?: string | null
          page_mission?: string | null
          page_story?: string | null
          page_story_image_side?: string | null
          page_story_image_url?: string | null
          page_summary?: string | null
          profile_image_url?: string | null
          published_website_project_id?: string | null
          region?: string | null
          slug: string
          state?: string | null
          stripe_connect_account_id?: string | null
          updated_at?: string | null
          website_forms_forward_to_email?: string | null
          website_forms_reply_name?: string | null
          website_url?: string | null
          years_in_operation?: number | null
        }
        Update: {
          card_preview_image_url?: string | null
          card_preview_video_url?: string | null
          causes?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          dwolla_customer_url?: string | null
          dwolla_source_funding_source_url?: string | null
          eventbrite_access_token?: string | null
          eventbrite_org_id?: string | null
          eventbrite_refresh_token?: string | null
          id?: string
          logo_url?: string | null
          member_count?: number | null
          name?: string
          onboarding_completed?: boolean | null
          org_type?: string | null
          owner_user_id?: string | null
          page_about_image_side?: string | null
          page_donation_goal_cents?: number | null
          page_goals?: string | null
          page_hero_image_url?: string | null
          page_hero_video_url?: string | null
          page_mission?: string | null
          page_story?: string | null
          page_story_image_side?: string | null
          page_story_image_url?: string | null
          page_summary?: string | null
          profile_image_url?: string | null
          published_website_project_id?: string | null
          region?: string | null
          slug?: string
          state?: string | null
          stripe_connect_account_id?: string | null
          updated_at?: string | null
          website_forms_forward_to_email?: string | null
          website_forms_reply_name?: string | null
          website_url?: string | null
          years_in_operation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_published_website_project_id_fkey"
            columns: ["published_website_project_id"]
            isOneToOne: false
            referencedRelation: "website_builder_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_connections: {
        Row: {
          created_at: string | null
          id: string
          side_a_id: string
          side_a_type: string
          side_b_id: string
          side_b_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          side_a_id: string
          side_a_type: string
          side_b_id: string
          side_b_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          side_a_id?: string
          side_a_type?: string
          side_b_id?: string
          side_b_type?: string
        }
        Relationships: []
      }
      peer_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          recipient_id: string
          recipient_type: string
          requester_id: string
          requester_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id: string
          recipient_type: string
          requester_id: string
          requester_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id?: string
          recipient_type?: string
          requester_id?: string
          requester_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      public_page_blocks: {
        Row: {
          block_type: string
          config: Json
          created_at: string | null
          id: string
          is_enabled: boolean
          organization_id: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          block_type: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          organization_id: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          organization_id?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_page_blocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bank_accounts: {
        Row: {
          account_name: string
          account_number_last4: string
          created_at: string | null
          dwolla_customer_url: string | null
          dwolla_funding_source_url: string
          id: string
          is_verified: boolean
          organization_id: string
          plaid_account_id: string | null
          routing_number_masked: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number_last4: string
          created_at?: string | null
          dwolla_customer_url?: string | null
          dwolla_funding_source_url: string
          id?: string
          is_verified?: boolean
          organization_id: string
          plaid_account_id?: string | null
          routing_number_masked?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number_last4?: string
          created_at?: string | null
          dwolla_customer_url?: string | null
          dwolla_funding_source_url?: string
          id?: string
          is_verified?: boolean
          organization_id?: string
          plaid_account_id?: string | null
          routing_number_masked?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_bank_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      split_proposals: {
        Row: {
          amount_cents: number
          created_at: string | null
          description: string | null
          id: string
          proposer_accepted_at: string | null
          proposer_org_id: string
          recipient_accepted_at: string | null
          split_percentages: Json
          status: string
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          description?: string | null
          id?: string
          proposer_accepted_at?: string | null
          proposer_org_id: string
          recipient_accepted_at?: string | null
          split_percentages?: Json
          status?: string
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          description?: string | null
          id?: string
          proposer_accepted_at?: string | null
          proposer_org_id?: string
          recipient_accepted_at?: string | null
          split_percentages?: Json
          status?: string
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_proposals_proposer_org_id_fkey"
            columns: ["proposer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_proposals_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      split_reconciliation: {
        Row: {
          all_transfers_completed: boolean
          created_at: string | null
          donation_id: string | null
          id: string
          notes: string | null
          reconciled_at: string | null
          reconciliation_difference_cents: number
          stripe_amount_cents: number
          total_splits_amount_cents: number
        }
        Insert: {
          all_transfers_completed?: boolean
          created_at?: string | null
          donation_id?: string | null
          id?: string
          notes?: string | null
          reconciled_at?: string | null
          reconciliation_difference_cents: number
          stripe_amount_cents: number
          total_splits_amount_cents: number
        }
        Update: {
          all_transfers_completed?: boolean
          created_at?: string | null
          donation_id?: string | null
          id?: string
          notes?: string | null
          reconciled_at?: string | null
          reconciliation_difference_cents?: number
          stripe_amount_cents?: number
          total_splits_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "split_reconciliation_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      split_transfers: {
        Row: {
          created_at: string | null
          id: string
          stripe_payment_intent_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_payment_intent_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_payment_intent_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          business_description: string | null
          business_email: string | null
          church_role: string | null
          created_at: string | null
          desired_tools: string | null
          email: string | null
          full_name: string | null
          id: string
          is_missionary: boolean | null
          marketing_consent: boolean | null
          missionary_sponsor_org_id: string | null
          needs_tech_integration_help: boolean | null
          onboarding_completed: boolean | null
          organization_id: string | null
          owns_business_outside_church: boolean | null
          plans_to_be_missionary: boolean | null
          preferred_endowment_fund_id: string | null
          preferred_organization_id: string | null
          role: string
          updated_at: string | null
          willing_to_pay_tech_help: boolean | null
        }
        Insert: {
          business_description?: string | null
          business_email?: string | null
          church_role?: string | null
          created_at?: string | null
          desired_tools?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_missionary?: boolean | null
          marketing_consent?: boolean | null
          missionary_sponsor_org_id?: string | null
          needs_tech_integration_help?: boolean | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          owns_business_outside_church?: boolean | null
          plans_to_be_missionary?: boolean | null
          preferred_endowment_fund_id?: string | null
          preferred_organization_id?: string | null
          role?: string
          updated_at?: string | null
          willing_to_pay_tech_help?: boolean | null
        }
        Update: {
          business_description?: string | null
          business_email?: string | null
          church_role?: string | null
          created_at?: string | null
          desired_tools?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_missionary?: boolean | null
          marketing_consent?: boolean | null
          missionary_sponsor_org_id?: string | null
          needs_tech_integration_help?: boolean | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          owns_business_outside_church?: boolean | null
          plans_to_be_missionary?: boolean | null
          preferred_endowment_fund_id?: string | null
          preferred_organization_id?: string | null
          role?: string
          updated_at?: string | null
          willing_to_pay_tech_help?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_missionary_sponsor_org_id_fkey"
            columns: ["missionary_sponsor_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_preferred_endowment_fund_id_fkey"
            columns: ["preferred_endowment_fund_id"]
            isOneToOne: false
            referencedRelation: "endowment_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_preferred_organization_id_fkey"
            columns: ["preferred_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_builder_projects: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          organization_id: string
          project: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          organization_id: string
          project?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          project?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_builder_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_form_inquiries: {
        Row: {
          created_at: string
          fields: Json
          form_kind: string | null
          id: string
          last_message_at: string
          org_slug: string
          organization_id: string
          page_slug: string | null
          status: string
          subject: string
          thread_token: string
          updated_at: string
          visitor_email: string
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          created_at?: string
          fields?: Json
          form_kind?: string | null
          id?: string
          last_message_at?: string
          org_slug: string
          organization_id: string
          page_slug?: string | null
          status?: string
          subject: string
          thread_token: string
          updated_at?: string
          visitor_email: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          created_at?: string
          fields?: Json
          form_kind?: string | null
          id?: string
          last_message_at?: string
          org_slug?: string
          organization_id?: string
          page_slug?: string | null
          status?: string
          subject?: string
          thread_token?: string
          updated_at?: string
          visitor_email?: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_form_inquiries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_form_messages: {
        Row: {
          created_at: string
          direction: string
          from_email: string
          html: string | null
          id: string
          inquiry_id: string
          resend_email_id: string | null
          resend_received_email_id: string | null
          subject: string
          text: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          direction: string
          from_email: string
          html?: string | null
          id?: string
          inquiry_id: string
          resend_email_id?: string | null
          resend_received_email_id?: string | null
          subject: string
          text?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          direction?: string
          from_email?: string
          html?: string | null
          id?: string
          inquiry_id?: string
          resend_email_id?: string | null
          resend_received_email_id?: string | null
          subject?: string
          text?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_form_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "website_form_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      website_cms_featured_sermon: {
        Row: {
          audio_url: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          organization_id: string
          published_at: string | null
          sort_order: number | null
          speaker_name: string | null
          tag: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          organization_id: string
          published_at?: string | null
          sort_order?: number | null
          speaker_name?: string | null
          tag?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          organization_id?: string
          published_at?: string | null
          sort_order?: number | null
          speaker_name?: string | null
          tag?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_cms_featured_sermon_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_cms_podcast_config: {
        Row: {
          apple_podcasts_url: string | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          spotify_url: string | null
          title: string
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          apple_podcasts_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          spotify_url?: string | null
          title?: string
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          apple_podcasts_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          spotify_url?: string | null
          title?: string
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_cms_podcast_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_cms_podcast_episodes: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration_minutes: number | null
          episode_number: number
          id: string
          organization_id: string
          published_at: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          episode_number: number
          id?: string
          organization_id: string
          published_at?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          episode_number?: number
          id?: string
          organization_id?: string
          published_at?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_cms_podcast_episodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_cms_sermon_archive: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          organization_id: string
          published_at: string | null
          sort_order: number | null
          speaker_name: string | null
          tag: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          organization_id: string
          published_at?: string | null
          sort_order?: number | null
          speaker_name?: string | null
          tag?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          organization_id?: string
          published_at?: string | null
          sort_order?: number | null
          speaker_name?: string | null
          tag?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_cms_sermon_archive_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_cms_worship_recordings: {
        Row: {
          created_at: string | null
          duration_text: string | null
          id: string
          organization_id: string
          sort_order: number | null
          subtitle: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          duration_text?: string | null
          id?: string
          organization_id: string
          sort_order?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          duration_text?: string | null
          id?: string
          organization_id?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_cms_worship_recordings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_budget_template_to_month: {
        Args: { target_month: number; target_year: number; template_id: string }
        Returns: {
          amount: number
          budget_id: string
          category: string
        }[]
      }
      broadcast_is_org_admin: { Args: { org_id: string }; Returns: boolean }
      get_unique_donor_count: {
        Args: { p_organization_id: string }
        Returns: number
      }
    }
    Enums: {
      BudgetPeriod: "MONTHLY" | "QUARTERLY" | "YEARLY"
      GoalType: "SAVINGS" | "DEBT_PAYOFF" | "BUDGET" | "SPENDING_REDUCTION"
      RecurringFrequency:
        | "DAILY"
        | "WEEKLY"
        | "BIWEEKLY"
        | "MONTHLY"
        | "QUARTERLY"
        | "YEARLY"
        | "CUSTOM"
      TransactionType: "INCOME" | "EXPENSE"
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
      BudgetPeriod: ["MONTHLY", "QUARTERLY", "YEARLY"],
      GoalType: ["SAVINGS", "DEBT_PAYOFF", "BUDGET", "SPENDING_REDUCTION"],
      RecurringFrequency: [
        "DAILY",
        "WEEKLY",
        "BIWEEKLY",
        "MONTHLY",
        "QUARTERLY",
        "YEARLY",
        "CUSTOM",
      ],
      TransactionType: ["INCOME", "EXPENSE"],
    },
  },
} as const
