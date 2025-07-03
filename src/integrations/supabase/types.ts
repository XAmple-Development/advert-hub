export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          listing_id: string
          reason: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          listing_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          listing_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          listing_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          listing_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bump_cooldowns: {
        Row: {
          id: string
          last_bump_at: string
          listing_id: string
          user_discord_id: string
        }
        Insert: {
          id?: string
          last_bump_at?: string
          listing_id: string
          user_discord_id: string
        }
        Update: {
          id?: string
          last_bump_at?: string
          listing_id?: string
          user_discord_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bump_cooldowns_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bumps: {
        Row: {
          bump_type: string | null
          bumped_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          bump_type?: string | null
          bumped_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          bump_type?: string | null
          bumped_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bumps_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      custom_themes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          listing_id: string | null
          theme_data: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          listing_id?: string | null
          theme_data: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          listing_id?: string | null
          theme_data?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_themes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_bot_configs: {
        Row: {
          active: boolean | null
          admin_user_id: string
          bump_channel_id: string | null
          created_at: string
          discord_server_id: string
          id: string
          listing_channel_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          admin_user_id: string
          bump_channel_id?: string | null
          created_at?: string
          discord_server_id: string
          id?: string
          listing_channel_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          admin_user_id?: string
          bump_channel_id?: string | null
          created_at?: string
          discord_server_id?: string
          id?: string
          listing_channel_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      featured_queue: {
        Row: {
          active: boolean | null
          created_at: string
          end_date: string
          feature_type: string
          id: string
          listing_id: string
          start_date: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          end_date: string
          feature_type: string
          id?: string
          listing_id: string
          start_date?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          end_date?: string
          feature_type?: string
          id?: string
          listing_id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_queue_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_analytics: {
        Row: {
          bumps: number | null
          created_at: string
          date: string
          geographic_data: Json | null
          id: string
          joins: number | null
          listing_id: string
          referrer_data: Json | null
          unique_visitors: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          bumps?: number | null
          created_at?: string
          date?: string
          geographic_data?: Json | null
          id?: string
          joins?: number | null
          listing_id: string
          referrer_data?: Json | null
          unique_visitors?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          bumps?: number | null
          created_at?: string
          date?: string
          geographic_data?: Json | null
          id?: string
          joins?: number | null
          listing_id?: string
          referrer_data?: Json | null
          unique_visitors?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_categories: {
        Row: {
          category_id: string
          listing_id: string
        }
        Insert: {
          category_id: string
          listing_id: string
        }
        Update: {
          category_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_categories_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          analytics_enabled: boolean | null
          avatar_url: string | null
          banner_url: string | null
          boost_level: number | null
          bump_count: number | null
          created_at: string
          custom_styling: Json | null
          description: string
          discord_id: string
          discord_webhook_url: string | null
          featured: boolean | null
          id: string
          invite_url: string | null
          join_count: number | null
          last_bumped_at: string | null
          long_description: string | null
          member_count: number | null
          name: string
          nsfw: boolean | null
          online_count: number | null
          premium_featured: boolean | null
          priority_bump: boolean | null
          priority_ranking: number | null
          status: Database["public"]["Enums"]["listing_status"]
          support_server_url: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
          user_id: string
          verification_level: string | null
          verified_badge: boolean | null
          view_count: number | null
          website_url: string | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          boost_level?: number | null
          bump_count?: number | null
          created_at?: string
          custom_styling?: Json | null
          description: string
          discord_id: string
          discord_webhook_url?: string | null
          featured?: boolean | null
          id?: string
          invite_url?: string | null
          join_count?: number | null
          last_bumped_at?: string | null
          long_description?: string | null
          member_count?: number | null
          name: string
          nsfw?: boolean | null
          online_count?: number | null
          premium_featured?: boolean | null
          priority_bump?: boolean | null
          priority_ranking?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          support_server_url?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id: string
          verification_level?: string | null
          verified_badge?: boolean | null
          view_count?: number | null
          website_url?: string | null
        }
        Update: {
          analytics_enabled?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          boost_level?: number | null
          bump_count?: number | null
          created_at?: string
          custom_styling?: Json | null
          description?: string
          discord_id?: string
          discord_webhook_url?: string | null
          featured?: boolean | null
          id?: string
          invite_url?: string | null
          join_count?: number | null
          last_bumped_at?: string | null
          long_description?: string | null
          member_count?: number | null
          name?: string
          nsfw?: boolean | null
          online_count?: number | null
          premium_featured?: boolean | null
          priority_bump?: boolean | null
          priority_ranking?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          support_server_url?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id?: string
          verification_level?: string | null
          verified_badge?: boolean | null
          view_count?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      network_servers: {
        Row: {
          active: boolean | null
          added_at: string
          discord_id: string
          id: string
          last_seen_at: string | null
          member_count: number | null
          name: string
        }
        Insert: {
          active?: boolean | null
          added_at?: string
          discord_id: string
          id?: string
          last_seen_at?: string | null
          member_count?: number | null
          name: string
        }
        Update: {
          active?: boolean | null
          added_at?: string
          discord_id?: string
          id?: string
          last_seen_at?: string | null
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          discord_access_token: string | null
          discord_avatar: string | null
          discord_id: string | null
          discord_token_updated_at: string | null
          discord_username: string | null
          id: string
          is_admin: boolean | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          discord_access_token?: string | null
          discord_avatar?: string | null
          discord_id?: string | null
          discord_token_updated_at?: string | null
          discord_username?: string | null
          id: string
          is_admin?: boolean | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          discord_access_token?: string | null
          discord_avatar?: string | null
          discord_id?: string | null
          discord_token_updated_at?: string | null
          discord_username?: string | null
          id?: string
          is_admin?: boolean | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      review_helpfulness: {
        Row: {
          created_at: string
          helpful: boolean
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          helpful: boolean
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          helpful?: boolean
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfulness_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number | null
          id: string
          listing_id: string
          photos: string[] | null
          rating: number
          user_id: string
          verified_purchase: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          listing_id: string
          photos?: string[] | null
          rating: number
          user_id: string
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          listing_id?: string
          photos?: string[] | null
          rating?: number
          user_id?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          badges: Json | null
          created_at: string
          helpful_reviews: number | null
          id: string
          reputation_score: number | null
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: Json | null
          created_at?: string
          helpful_reviews?: number | null
          id?: string
          reputation_score?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: Json | null
          created_at?: string
          helpful_reviews?: number | null
          id?: string
          reputation_score?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_listing_analytics: {
        Args: { p_listing_id: string; p_event_type: string; p_metadata?: Json }
        Returns: undefined
      }
    }
    Enums: {
      listing_status: "active" | "pending" | "suspended"
      listing_type: "server" | "bot"
      subscription_tier: "free" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      listing_status: ["active", "pending", "suspended"],
      listing_type: ["server", "bot"],
      subscription_tier: ["free", "premium"],
    },
  },
} as const
