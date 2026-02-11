export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      connect_accounts: {
        Row: {
          created_at: string | null;
          details_submitted: boolean | null;
          endowment_fund_id: string | null;
          id: string;
          stripe_account_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          details_submitted?: boolean | null;
          endowment_fund_id?: string | null;
          id?: string;
          stripe_account_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          details_submitted?: boolean | null;
          endowment_fund_id?: string | null;
          id?: string;
          stripe_account_id?: string;
          updated_at?: string | null;
        };
        Relationships: [{ foreignKeyName: "connect_accounts_endowment_fund_id_fkey"; columns: ["endowment_fund_id"]; referencedRelation: "endowment_funds"; referencedColumns: ["id"] }];
      };
      donation_campaigns: {
        Row: {
          allow_anonymous: boolean | null;
          allow_recurring: boolean | null;
          created_at: string | null;
          current_amount_cents: number | null;
          description: string | null;
          goal_amount_cents: number | null;
          id: string;
          is_active: boolean | null;
          minimum_amount_cents: number | null;
          name: string;
          organization_id: string;
          suggested_amounts: Json | null;
          updated_at: string | null;
        };
        Insert: {
          allow_anonymous?: boolean | null;
          allow_recurring?: boolean | null;
          created_at?: string | null;
          current_amount_cents?: number | null;
          description?: string | null;
          goal_amount_cents?: number | null;
          id?: string;
          is_active?: boolean | null;
          minimum_amount_cents?: number | null;
          name: string;
          organization_id: string;
          suggested_amounts?: Json | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["donation_campaigns"]["Insert"]>;
        Relationships: [{ foreignKeyName: "donation_campaigns_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      donations: {
        Row: {
          amount_cents: number;
          campaign_id: string | null;
          created_at: string | null;
          currency: string;
          donor_email: string | null;
          donor_name: string | null;
          endowment_fund_id: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string | null;
          status: string;
          stripe_charge_id: string | null;
          stripe_payment_intent_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount_cents: number;
          campaign_id?: string | null;
          created_at?: string | null;
          currency?: string;
          donor_email?: string | null;
          donor_name?: string | null;
          endowment_fund_id?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string | null;
          status?: string;
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["donations"]["Insert"]>;
        Relationships: unknown[];
      };
      donor_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string | null;
          amount_cents: number;
          currency: string;
          interval: string;
          status: string;
          campaign_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          stripe_subscription_id: string;
          stripe_customer_id?: string | null;
          amount_cents: number;
          currency?: string;
          interval: string;
          status?: string;
          campaign_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["donor_subscriptions"]["Insert"]>;
        Relationships: unknown[];
      };
      donor_saved_organizations: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["donor_saved_organizations"]["Insert"]>;
        Relationships: unknown[];
      };
      endowment_funds: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          stripe_connect_account_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          stripe_connect_account_id?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["endowment_funds"]["Insert"]>;
        Relationships: never[];
      };
      form_customizations: {
        Row: {
          allow_custom_amount: boolean | null;
          background_color: string | null;
          button_border_radius: string | null;
          button_color: string | null;
          button_text_color: string | null;
          created_at: string | null;
          design_sets: Json | null;
          font_family: string | null;
          font_weight: string | null;
          header_image_url: string | null;
          header_text: string | null;
          id: string;
          logo_url: string | null;
          organization_id: string;
          primary_color: string | null;
          secondary_color: string | null;
          show_endowment_selection: boolean | null;
          subheader_text: string | null;
          suggested_amounts: Json | null;
          text_color: string | null;
          thank_you_message: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["form_customizations"]["Row"]> & { organization_id: string };
        Update: Partial<Database["public"]["Tables"]["form_customizations"]["Insert"]>;
        Relationships: [{ foreignKeyName: "form_customizations_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      organization_admins: {
        Row: { created_at: string | null; id: string; organization_id: string; role: string; user_id: string | null };
        Insert: { created_at?: string | null; id?: string; organization_id: string; role?: string; user_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["organization_admins"]["Insert"]>;
        Relationships: unknown[];
      };
      organizations: {
        Row: {
          created_at: string | null;
          description: string | null;
          eventbrite_access_token: string | null;
          eventbrite_org_id: string | null;
          eventbrite_refresh_token: string | null;
          id: string;
          logo_url: string | null;
          member_count: number | null;
          name: string;
          onboarding_completed: boolean | null;
          org_type: string | null;
          owner_user_id: string | null;
          slug: string;
          stripe_connect_account_id: string | null;
          updated_at: string | null;
          website_url: string | null;
          years_in_operation: number | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          eventbrite_access_token?: string | null;
          eventbrite_org_id?: string | null;
          eventbrite_refresh_token?: string | null;
          id?: string;
          logo_url?: string | null;
          member_count?: number | null;
          name: string;
          onboarding_completed?: boolean | null;
          org_type?: string | null;
          owner_user_id?: string | null;
          slug: string;
          stripe_connect_account_id?: string | null;
          updated_at?: string | null;
          website_url?: string | null;
          years_in_operation?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: never[];
      };
      events: {
        Row: {
          id: string;
          organization_id: string;
          slug: string;
          name: string;
          description: string | null;
          start_at: string;
          end_at: string;
          venue_name: string | null;
          venue_address: string | null;
          online_event: boolean;
          eventbrite_event_id: string | null;
          eventbrite_org_id: string | null;
          image_url: string | null;
          ticket_classes: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          slug: string;
          name: string;
          description?: string | null;
          start_at: string;
          end_at: string;
          venue_name?: string | null;
          venue_address?: string | null;
          online_event?: boolean;
          eventbrite_event_id?: string | null;
          eventbrite_org_id?: string | null;
          image_url?: string | null;
          ticket_classes?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [{ foreignKeyName: "events_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      user_profiles: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          onboarding_completed: boolean | null;
          organization_id: string | null;
          preferred_endowment_fund_id: string | null;
          preferred_organization_id: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          onboarding_completed?: boolean | null;
          organization_id?: string | null;
          preferred_endowment_fund_id?: string | null;
          preferred_organization_id?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
        Relationships: unknown[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
