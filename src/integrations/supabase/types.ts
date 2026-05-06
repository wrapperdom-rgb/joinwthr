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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          building: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          referrer: string | null
          revenue_stage: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          url: string | null
          why: string
        }
        Insert: {
          building: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          referrer?: string | null
          revenue_stage: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          url?: string | null
          why: string
        }
        Update: {
          building?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          referrer?: string | null
          revenue_stage?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          url?: string | null
          why?: string
        }
        Relationships: []
      }
      bot_runs: {
        Row: {
          action: string
          bot_id: string | null
          content: string | null
          created_at: string
          error: string | null
          group_id: string | null
          id: string
          success: boolean
          target_id: string | null
        }
        Insert: {
          action: string
          bot_id?: string | null
          content?: string | null
          created_at?: string
          error?: string | null
          group_id?: string | null
          id?: string
          success?: boolean
          target_id?: string | null
        }
        Update: {
          action?: string
          bot_id?: string | null
          content?: string | null
          created_at?: string
          error?: string | null
          group_id?: string | null
          id?: string
          success?: boolean
          target_id?: string | null
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          allow_group_posts: boolean
          allow_self_reply: boolean
          enabled: boolean
          group_post_chance: number
          id: number
          max_bots_per_tick: number
          max_posts_per_day: number
          self_reply_chance: number
          tick_minutes: number
          updated_at: string
          weight_like: number
          weight_post: number
          weight_reply: number
        }
        Insert: {
          allow_group_posts?: boolean
          allow_self_reply?: boolean
          enabled?: boolean
          group_post_chance?: number
          id?: number
          max_bots_per_tick?: number
          max_posts_per_day?: number
          self_reply_chance?: number
          tick_minutes?: number
          updated_at?: string
          weight_like?: number
          weight_post?: number
          weight_reply?: number
        }
        Update: {
          allow_group_posts?: boolean
          allow_self_reply?: boolean
          enabled?: boolean
          group_post_chance?: number
          id?: number
          max_bots_per_tick?: number
          max_posts_per_day?: number
          self_reply_chance?: number
          tick_minutes?: number
          updated_at?: string
          weight_like?: number
          weight_post?: number
          weight_reply?: number
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          group_id: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          group_id: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          bots_allowed: boolean
          created_at: string
          description: string
          id: string
          name: string
          owner_id: string
          slug: string
          topic: string
        }
        Insert: {
          bots_allowed?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          owner_id: string
          slug: string
          topic?: string
        }
        Update: {
          bots_allowed?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          topic?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          author_id: string
          created_at: string
          cta: string | null
          description: string
          id: string
          kind: string
          tags: string[] | null
          title: string
        }
        Insert: {
          author_id: string
          created_at?: string
          cta?: string | null
          description: string
          id?: string
          kind: string
          tags?: string[] | null
          title: string
        }
        Update: {
          author_id?: string
          created_at?: string
          cta?: string | null
          description?: string
          id?: string
          kind?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_author_profile_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          provider: string
          provider_event_id: string | null
          provider_payment_id: string | null
          raw: Json | null
          status: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_event_id?: string | null
          provider_payment_id?: string | null
          raw?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_event_id?: string | null
          provider_payment_id?: string | null
          raw?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_profile_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          bio: string | null
          building: string | null
          created_at: string
          handle: string
          id: string
          is_bot: boolean
          last_active_at: string | null
          looking_for: string[] | null
          name: string
          paid: boolean
          paid_at: string | null
          revenue_stage: string | null
          skills: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          building?: string | null
          created_at?: string
          handle: string
          id: string
          is_bot?: boolean
          last_active_at?: string | null
          looking_for?: string[] | null
          name: string
          paid?: boolean
          paid_at?: string | null
          revenue_stage?: string | null
          skills?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          building?: string | null
          created_at?: string
          handle?: string
          id?: string
          is_bot?: boolean
          last_active_at?: string | null
          looking_for?: string[] | null
          name?: string
          paid?: boolean
          paid_at?: string | null
          revenue_stage?: string | null
          skills?: string[] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_banned: { Args: { _uid: string }; Returns: boolean }
      is_group_admin: { Args: { _gid: string; _uid: string }; Returns: boolean }
      is_group_member: {
        Args: { _gid: string; _uid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
