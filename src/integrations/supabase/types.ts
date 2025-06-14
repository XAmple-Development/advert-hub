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
      listings: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          boost_level: number | null
          bump_count: number | null
          created_at: string
          description: string
          discord_id: string
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
          status: Database["public"]["Enums"]["listing_status"]
          support_server_url: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
          user_id: string
          verification_level: string | null
          view_count: number | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          boost_level?: number | null
          bump_count?: number | null
          created_at?: string
          description: string
          discord_id: string
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
          status?: Database["public"]["Enums"]["listing_status"]
          support_server_url?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id: string
          verification_level?: string | null
          view_count?: number | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          boost_level?: number | null
          bump_count?: number | null
          created_at?: string
          description?: string
          discord_id?: string
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
          status?: Database["public"]["Enums"]["listing_status"]
          support_server_url?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id?: string
          verification_level?: string | null
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
          subscription_expires_at: string | null
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
          subscription_expires_at?: string | null
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
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
