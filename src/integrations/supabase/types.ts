export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          conditions: Json
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          rarity: string | null
        }
        Insert: {
          category?: string | null
          conditions: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          rarity?: string | null
        }
        Update: {
          category?: string | null
          conditions?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          rarity?: string | null
        }
        Relationships: []
      }
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
      ai_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string
          expires_at: string | null
          id: string
          listing_id: string
          metadata: Json | null
          reasoning: string | null
          recommendation_type: string
          shown_to_user: boolean | null
          user_id: string | null
          user_interaction: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_id: string
          metadata?: Json | null
          reasoning?: string | null
          recommendation_type?: string
          shown_to_user?: boolean | null
          user_id?: string | null
          user_interaction?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_id?: string
          metadata?: Json | null
          reasoning?: string | null
          recommendation_type?: string
          shown_to_user?: boolean | null
          user_id?: string | null
          user_interaction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      analytics_insights: {
        Row: {
          confidence_score: number | null
          expires_at: string | null
          generated_at: string
          id: string
          insight_data: Json
          insight_type: string
          listing_id: string
        }
        Insert: {
          confidence_score?: number | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_data: Json
          insight_type: string
          listing_id: string
        }
        Update: {
          confidence_score?: number | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_insights_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          ip_address: unknown | null
          page_views: number | null
          referrer: string | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_views?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_views?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_bump_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          interval_hours: number | null
          last_auto_bump_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          interval_hours?: number | null
          last_auto_bump_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          interval_hours?: number | null
          last_auto_bump_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_bump_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_moderation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          id: string
          is_enabled: boolean | null
          rule_name: string
          rule_type: string
          severity: number | null
        }
        Insert: {
          actions: Json
          conditions: Json
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          rule_name: string
          rule_type: string
          severity?: number | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          rule_name?: string
          rule_type?: string
          severity?: number | null
        }
        Relationships: []
      }
      bot_commands: {
        Row: {
          category: string | null
          command_name: string
          cooldown_seconds: number | null
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean | null
          permissions_required: string[] | null
          usage_example: string | null
        }
        Insert: {
          category?: string | null
          command_name: string
          cooldown_seconds?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          permissions_required?: string[] | null
          usage_example?: string | null
        }
        Update: {
          category?: string | null
          command_name?: string
          cooldown_seconds?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          permissions_required?: string[] | null
          usage_example?: string | null
        }
        Relationships: []
      }
      bot_usage_stats: {
        Row: {
          channel_id: string | null
          command_name: string
          error_message: string | null
          guild_id: string | null
          id: string
          response_time_ms: number | null
          success: boolean | null
          used_at: string
          user_discord_id: string
        }
        Insert: {
          channel_id?: string | null
          command_name: string
          error_message?: string | null
          guild_id?: string | null
          id?: string
          response_time_ms?: number | null
          success?: boolean | null
          used_at?: string
          user_discord_id: string
        }
        Update: {
          channel_id?: string | null
          command_name?: string
          error_message?: string | null
          guild_id?: string | null
          id?: string
          response_time_ms?: number | null
          success?: boolean | null
          used_at?: string
          user_discord_id?: string
        }
        Relationships: []
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
      challenge_participations: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          listing_id: string
          progress: Json | null
          rank: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id: string
          progress?: Json | null
          rank?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          progress?: Json | null
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "community_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "user_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          participation_criteria: Json
          reward_metadata: Json | null
          reward_type: string | null
          start_date: string
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          participation_criteria?: Json
          reward_metadata?: Json | null
          reward_type?: string | null
          start_date: string
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          participation_criteria?: Json
          reward_metadata?: Json | null
          reward_type?: string | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          created_at: string
          flag_type: string
          id: string
          reason: string | null
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          flag_type: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          flag_type?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          status_channel_id: string | null
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
          status_channel_id?: string | null
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
          status_channel_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      discovery_categories: {
        Row: {
          auto_generated: boolean | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          sort_order: number | null
        }
        Insert: {
          auto_generated?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          sort_order?: number | null
        }
        Update: {
          auto_generated?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "discovery_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string | null
          id: string
          registered_at: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          registered_at?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          registered_at?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "server_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          category_id: string
          content: string
          created_at: string
          id: string
          last_reply_at: string | null
          locked: boolean | null
          pinned: boolean | null
          reply_count: number | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          id?: string
          last_reply_at?: string | null
          locked?: boolean | null
          pinned?: boolean | null
          reply_count?: number | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          last_reply_at?: string | null
          locked?: boolean | null
          pinned?: boolean | null
          reply_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      geographic_regions: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          parent_region_id: string | null
          region_type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          parent_region_id?: string | null
          region_type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          parent_region_id?: string | null
          region_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "geographic_regions_parent_region_id_fkey"
            columns: ["parent_region_id"]
            isOneToOne: false
            referencedRelation: "geographic_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          calculated_at: string
          category: string
          id: string
          period: string
          rank: number | null
          score: number
          user_id: string | null
        }
        Insert: {
          calculated_at?: string
          category: string
          id?: string
          period?: string
          rank?: number | null
          score: number
          user_id?: string | null
        }
        Update: {
          calculated_at?: string
          category?: string
          id?: string
          period?: string
          rank?: number | null
          score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          bot_id: string | null
          bump_count: number | null
          certified_bot: boolean | null
          commands_count: number | null
          created_at: string
          custom_styling: Json | null
          description: string
          discord_id: string
          discord_webhook_url: string | null
          featured: boolean | null
          github_url: string | null
          guilds_count: number | null
          id: string
          invite_url: string | null
          join_count: number | null
          last_bumped_at: string | null
          library: string | null
          long_description: string | null
          member_count: number | null
          monthly_votes: number | null
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
          vote_count: number | null
          website_url: string | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          boost_level?: number | null
          bot_id?: string | null
          bump_count?: number | null
          certified_bot?: boolean | null
          commands_count?: number | null
          created_at?: string
          custom_styling?: Json | null
          description: string
          discord_id: string
          discord_webhook_url?: string | null
          featured?: boolean | null
          github_url?: string | null
          guilds_count?: number | null
          id?: string
          invite_url?: string | null
          join_count?: number | null
          last_bumped_at?: string | null
          library?: string | null
          long_description?: string | null
          member_count?: number | null
          monthly_votes?: number | null
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
          vote_count?: number | null
          website_url?: string | null
        }
        Update: {
          analytics_enabled?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          boost_level?: number | null
          bot_id?: string | null
          bump_count?: number | null
          certified_bot?: boolean | null
          commands_count?: number | null
          created_at?: string
          custom_styling?: Json | null
          description?: string
          discord_id?: string
          discord_webhook_url?: string | null
          featured?: boolean | null
          github_url?: string | null
          guilds_count?: number | null
          id?: string
          invite_url?: string | null
          join_count?: number | null
          last_bumped_at?: string | null
          library?: string | null
          long_description?: string | null
          member_count?: number | null
          monthly_votes?: number | null
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
          vote_count?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action_type: string
          auto_generated: boolean | null
          created_at: string
          id: string
          metadata: Json | null
          moderator_id: string | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          auto_generated?: boolean | null
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          auto_generated?: boolean | null
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      network_memberships: {
        Row: {
          id: string
          joined_at: string
          listing_id: string
          network_id: string
          role: string | null
        }
        Insert: {
          id?: string
          joined_at?: string
          listing_id: string
          network_id: string
          role?: string | null
        }
        Update: {
          id?: string
          joined_at?: string
          listing_id?: string
          network_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_memberships_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_memberships_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "server_networks"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          priority: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          clicks: number | null
          id: string
          page_title: string | null
          page_url: string
          referrer: string | null
          scroll_depth: number | null
          session_id: string | null
          time_on_page: number | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          clicks?: number | null
          id?: string
          page_title?: string | null
          page_url: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          clicks?: number | null
          id?: string
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_bump_enabled: boolean | null
          auto_bump_interval_hours: number | null
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
          auto_bump_enabled?: boolean | null
          auto_bump_interval_hours?: number | null
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
          auto_bump_enabled?: boolean | null
          auto_bump_interval_hours?: number | null
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
      reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
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
      review_votes: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "user_reviews"
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
      server_events: {
        Row: {
          created_at: string
          current_participants: number | null
          description: string | null
          end_time: string | null
          event_type: string | null
          id: string
          is_recurring: boolean | null
          listing_id: string | null
          max_participants: number | null
          organizer_id: string | null
          recurrence_pattern: Json | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_recurring?: boolean | null
          listing_id?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          recurrence_pattern?: Json | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_recurring?: boolean | null
          listing_id?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          recurrence_pattern?: Json | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      server_networks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          network_type: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          network_type?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          network_type?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_networks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      server_statistics: {
        Row: {
          channels_count: number | null
          created_at: string
          id: string
          left_members: number | null
          listing_id: string | null
          member_count: number | null
          message_count: number | null
          new_members: number | null
          online_count: number | null
          roles_count: number | null
          stat_date: string
          voice_minutes: number | null
        }
        Insert: {
          channels_count?: number | null
          created_at?: string
          id?: string
          left_members?: number | null
          listing_id?: string | null
          member_count?: number | null
          message_count?: number | null
          new_members?: number | null
          online_count?: number | null
          roles_count?: number | null
          stat_date: string
          voice_minutes?: number | null
        }
        Update: {
          channels_count?: number | null
          created_at?: string
          id?: string
          left_members?: number | null
          listing_id?: string | null
          member_count?: number | null
          message_count?: number | null
          new_members?: number | null
          online_count?: number | null
          roles_count?: number | null
          stat_date?: string
          voice_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "server_statistics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      server_verification: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          rejection_reason: string | null
          updated_at: string
          verification_criteria: Json | null
          verification_level: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          rejection_reason?: string | null
          updated_at?: string
          verification_criteria?: Json | null
          verification_level?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          rejection_reason?: string | null
          updated_at?: string
          verification_criteria?: Json | null
          verification_level?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "server_verification_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_verification_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_maintenance: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_maintenance_mode: boolean
          maintenance_message: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_maintenance_mode?: boolean
          maintenance_message?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_maintenance_mode?: boolean
          maintenance_message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_status_messages: {
        Row: {
          created_at: string
          discord_channel_id: string
          discord_message_id: string
          id: string
          last_updated_at: string
          status_data: Json | null
        }
        Insert: {
          created_at?: string
          discord_channel_id: string
          discord_message_id: string
          id?: string
          last_updated_at?: string
          status_data?: Json | null
        }
        Update: {
          created_at?: string
          discord_channel_id?: string
          discord_message_id?: string
          id?: string
          last_updated_at?: string
          status_data?: Json | null
        }
        Relationships: []
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
      trending_metrics: {
        Row: {
          created_at: string
          date: string
          engagement_score: number | null
          growth_velocity: number | null
          id: string
          listing_id: string
          member_growth: number | null
          trending_score: number | null
          updated_at: string
          view_growth: number | null
          vote_growth: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          engagement_score?: number | null
          growth_velocity?: number | null
          id?: string
          listing_id: string
          member_growth?: number | null
          trending_score?: number | null
          updated_at?: string
          view_growth?: number | null
          vote_growth?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          engagement_score?: number | null
          growth_velocity?: number | null
          id?: string
          listing_id?: string
          member_growth?: number | null
          trending_score?: number | null
          updated_at?: string
          view_growth?: number | null
          vote_growth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trending_metrics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string
          id: string
          progress: Json | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string
          id?: string
          progress?: Json | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string
          id?: string
          progress?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          page_url: string | null
          target_element: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          target_element?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          target_element?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          likes_count: number | null
          listing_id: string | null
          parent_comment_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          likes_count?: number | null
          listing_id?: string | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          likes_count?: number | null
          listing_id?: string | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_comments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "user_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_levels: {
        Row: {
          created_at: string
          experience_points: number | null
          id: string
          level: number | null
          level_up_at: string | null
          total_points_earned: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          experience_points?: number | null
          id?: string
          level?: number | null
          level_up_at?: string | null
          total_points_earned?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          experience_points?: number | null
          id?: string
          level?: number | null
          level_up_at?: string | null
          total_points_earned?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_levels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          recipient_id: string | null
          replied_to: string | null
          sender_id: string | null
          subject: string | null
          thread_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          recipient_id?: string | null
          replied_to?: string | null
          sender_id?: string | null
          subject?: string | null
          thread_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          recipient_id?: string | null
          replied_to?: string | null
          sender_id?: string | null
          subject?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_replied_to_fkey"
            columns: ["replied_to"]
            isOneToOne: false
            referencedRelation: "user_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          level: number
          lifetime_points: number
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id?: string
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
      user_reviews: {
        Row: {
          created_at: string
          helpful_count: number | null
          id: string
          is_verified: boolean | null
          listing_id: string
          rating: number
          reported_count: number | null
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          listing_id: string
          rating: number
          reported_count?: number | null
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          listing_id?: string
          rating?: number
          reported_count?: number | null
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          exit_page: string | null
          id: string
          ip_address: string | null
          landing_page: string | null
          page_views: number | null
          referrer: string | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          page_views?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          page_views?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_warnings: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          moderator_id: string | null
          reason: string
          severity: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          moderator_id?: string | null
          reason: string
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          moderator_id?: string | null
          reason?: string
          severity?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          id: string
          ip_address: string | null
          target_id: string
          target_type: string
          user_id: string
          vote_date: string
          voted_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          target_id: string
          target_type: string
          user_id: string
          vote_date?: string
          voted_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
          vote_date?: string
          voted_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_achievement: {
        Args: { p_user_id: string; p_achievement_name: string }
        Returns: boolean
      }
      calculate_trending_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_orphaned_records: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_sample_user_levels: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_user_subscription_tier: {
        Args: { user_id: string }
        Returns: string
      }
      handle_vote: {
        Args: {
          p_user_id: string
          p_target_id: string
          p_target_type: string
          p_ip_address?: string
        }
        Returns: boolean
      }
      populate_sample_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_leaderboards: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_listing_analytics: {
        Args: { p_listing_id: string; p_event_type: string; p_metadata?: Json }
        Returns: undefined
      }
    }
    Enums: {
      listing_status: "active" | "pending" | "suspended"
      listing_type: "server" | "bot"
      subscription_tier: "free" | "gold" | "platinum"
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
      listing_status: ["active", "pending", "suspended"],
      listing_type: ["server", "bot"],
      subscription_tier: ["free", "gold", "platinum"],
    },
  },
} as const
