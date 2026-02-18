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
      dwolla_webhook_events: {
        Row: {
          id: string
          topic: string
          resource_id: string | null
          created_at: string | null
          processed_at: string | null
        }
        Insert: {
          id: string
          topic: string
          resource_id?: string | null
          created_at?: string | null
          processed_at?: string | null
        }
        Update: {
          id?: string
          topic?: string
          resource_id?: string | null
          created_at?: string | null
          processed_at?: string | null
        }
        Relationships: []
      }
      dwolla_transfers: {
        Row: {
          id: string
          donation_id: string | null
          stripe_payment_intent_id: string
          split_bank_account_id: string
          amount_cents: number
          status: string
          dwolla_transfer_url: string | null
          error_message: string | null
          created_at: string | null
          updated_at: string | null
          retry_count: number | null
          max_retries: number | null
          next_retry_at: string | null
          dwolla_event_id: string | null
        }
        Insert: {
          id?: string
          donation_id?: string | null
          stripe_payment_intent_id: string
          split_bank_account_id: string
          amount_cents: number
          status?: string
          dwolla_transfer_url?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
          retry_count?: number | null
          max_retries?: number | null
          next_retry_at?: string | null
          dwolla_event_id?: string | null
        }
        Update: {
          id?: string
          donation_id?: string | null
          stripe_payment_intent_id?: string
          split_bank_account_id?: string
          amount_cents?: number
          status?: string
          dwolla_transfer_url?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
          retry_count?: number | null
          max_retries?: number | null
          next_retry_at?: string | null
          dwolla_event_id?: string | null
        }
        Relationships: []
      }
      internal_split_payouts: {
        Row: {
          id: string
          stripe_payment_intent_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          stripe_payment_intent_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          stripe_payment_intent_id?: string
          created_at?: string | null
        }
        Relationships: []
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
      feed_item_comments: {
        Row: {
          id: string
          feed_item_id: string
          user_id: string
          organization_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          feed_item_id: string
          user_id: string
          organization_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          feed_item_id?: string
          user_id?: string
          organization_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_item_comments_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_item_reactions: {
        Row: {
          id: string
          feed_item_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          feed_item_id: string
          user_id: string
          reaction_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          feed_item_id?: string
          user_id?: string
          reaction_type?: string
          created_at?: string
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
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          show_endowment_selection: boolean | null
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
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          show_endowment_selection?: boolean | null
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
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          show_endowment_selection?: boolean | null
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
      organization_domains: {
        Row: {
          id: string
          organization_id: string
          domain: string
          status: string
          verified_at: string | null
          dns_provider: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          domain: string
          status?: string
          verified_at?: string | null
          dns_provider?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          domain?: string
          status?: string
          verified_at?: string | null
          dns_provider?: string | null
          created_at?: string | null
          updated_at?: string | null
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
      organizations: {
        Row: {
          card_preview_image_url: string | null
          card_preview_video_url: string | null
          causes: string[] | null
          city: string | null
          created_at: string | null
          description: string | null
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
          website_url?: string | null
          years_in_operation?: number | null
        }
        Relationships: []
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
          id: string
          organization_id: string
          dwolla_customer_url: string | null
          dwolla_funding_source_url: string | null
          plaid_account_id: string | null
          account_name: string | null
          routing_number_masked: string | null
          account_number_last4: string | null
          is_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          dwolla_customer_url?: string | null
          dwolla_funding_source_url?: string | null
          plaid_account_id?: string | null
          account_name?: string | null
          routing_number_masked?: string | null
          account_number_last4?: string | null
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          dwolla_customer_url?: string | null
          dwolla_funding_source_url?: string | null
          plaid_account_id?: string | null
          account_name?: string | null
          routing_number_masked?: string | null
          account_number_last4?: string | null
          is_verified?: boolean | null
          created_at?: string | null
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
      website_builder_projects: {
        Row: {
          created_at: string
          id: string
          name: string | null
          organization_id: string
          project: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id: string
          project?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
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
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_cms_featured_sermon: {
        Row: {
          id: string
          organization_id: string
          title: string
          tag: string | null
          description: string | null
          image_url: string | null
          video_url: string | null
          audio_url: string | null
          duration_minutes: number | null
          speaker_name: string | null
          published_at: string | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          tag?: string | null
          description?: string | null
          image_url?: string | null
          video_url?: string | null
          audio_url?: string | null
          duration_minutes?: number | null
          speaker_name?: string | null
          published_at?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          tag?: string | null
          description?: string | null
          image_url?: string | null
          video_url?: string | null
          audio_url?: string | null
          duration_minutes?: number | null
          speaker_name?: string | null
          published_at?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
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
          id: string
          organization_id: string
          title: string
          description: string | null
          spotify_url: string | null
          apple_podcasts_url: string | null
          youtube_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title?: string
          description?: string | null
          spotify_url?: string | null
          apple_podcasts_url?: string | null
          youtube_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          spotify_url?: string | null
          apple_podcasts_url?: string | null
          youtube_url?: string | null
          created_at?: string | null
          updated_at?: string | null
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
          id: string
          organization_id: string
          episode_number: number
          title: string
          published_at: string | null
          duration_minutes: number | null
          audio_url: string | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          episode_number: number
          title: string
          published_at?: string | null
          duration_minutes?: number | null
          audio_url?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          episode_number?: number
          title?: string
          published_at?: string | null
          duration_minutes?: number | null
          audio_url?: string | null
          sort_order?: number | null
          created_at?: string | null
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
      website_cms_worship_recordings: {
        Row: {
          id: string
          organization_id: string
          title: string
          subtitle: string | null
          duration_text: string | null
          url: string | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          subtitle?: string | null
          duration_text?: string | null
          url?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          subtitle?: string | null
          duration_text?: string | null
          url?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
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
          marketing_consent: boolean | null
          needs_tech_integration_help: boolean | null
          onboarding_completed: boolean | null
          organization_id: string | null
          owns_business_outside_church: boolean | null
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
          marketing_consent?: boolean | null
          needs_tech_integration_help?: boolean | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          owns_business_outside_church?: boolean | null
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
          marketing_consent?: boolean | null
          needs_tech_integration_help?: boolean | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          owns_business_outside_church?: boolean | null
          preferred_endowment_fund_id?: string | null
          preferred_organization_id?: string | null
          role?: string
          updated_at?: string | null
          willing_to_pay_tech_help?: boolean | null
        }
        Relationships: [
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
