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
      badge_definitions: {
        Row: {
          auto_condition: string | null
          championship_id: string | null
          color: string
          created_at: string | null
          created_by: string | null
          custom_image_url: string | null
          description: string | null
          icon_name: string
          id: string
          is_automatic: boolean | null
          name: string
          show_preview: boolean
          updated_at: string | null
        }
        Insert: {
          auto_condition?: string | null
          championship_id?: string | null
          color?: string
          created_at?: string | null
          created_by?: string | null
          custom_image_url?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          is_automatic?: boolean | null
          name: string
          show_preview?: boolean
          updated_at?: string | null
        }
        Update: {
          auto_condition?: string | null
          championship_id?: string | null
          color?: string
          created_at?: string | null
          created_by?: string | null
          custom_image_url?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          is_automatic?: boolean | null
          name?: string
          show_preview?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badge_definitions_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_definitions_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships_public"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_members: {
        Row: {
          championship_id: string
          id: string
          joined_at: string | null
          profile_id: string
          role: Database["public"]["Enums"]["member_role"] | null
          status: Database["public"]["Enums"]["member_status"] | null
        }
        Insert: {
          championship_id: string
          id?: string
          joined_at?: string | null
          profile_id: string
          role?: Database["public"]["Enums"]["member_role"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
        }
        Update: {
          championship_id?: string
          id?: string
          joined_at?: string | null
          profile_id?: string
          role?: Database["public"]["Enums"]["member_role"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "championship_members_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_members_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      championships: {
        Row: {
          created_at: string | null
          id: string
          is_private: boolean | null
          logo_url: string | null
          name: string
          organizer_id: string | null
          rules_summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          logo_url?: string | null
          name: string
          organizer_id?: string | null
          rules_summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          logo_url?: string | null
          name?: string
          organizer_id?: string | null
          rules_summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "championships_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_badges: {
        Row: {
          awarded_by: string | null
          badge_definition_id: string | null
          badge_name: string
          badge_type: string
          championship_id: string | null
          earned_at: string | null
          id: string
          notes: string | null
          profile_id: string
        }
        Insert: {
          awarded_by?: string | null
          badge_definition_id?: string | null
          badge_name: string
          badge_type: string
          championship_id?: string | null
          earned_at?: string | null
          id?: string
          notes?: string | null
          profile_id: string
        }
        Update: {
          awarded_by?: string | null
          badge_definition_id?: string | null
          badge_name?: string
          badge_type?: string
          championship_id?: string | null
          earned_at?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_badges_badge_definition_id_fkey"
            columns: ["badge_definition_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_badges_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_badges_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_badges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          championship_id: string
          created_at: string | null
          date: string
          id: string
          name: string
          status: Database["public"]["Enums"]["event_status"] | null
          track_id: string | null
        }
        Insert: {
          championship_id: string
          created_at?: string | null
          date: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["event_status"] | null
          track_id?: string | null
        }
        Update: {
          championship_id?: string
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_visibility: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          label: string
          min_tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          label: string
          min_tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          label?: string
          min_tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      heat_results: {
        Row: {
          average_speed: number | null
          best_lap_time: string | null
          created_at: string | null
          driver_id: string | null
          driver_name_text: string | null
          gap_to_leader: string | null
          gap_to_previous: string | null
          heat_id: string
          id: string
          kart_number: number | null
          payment_status: boolean | null
          points: number | null
          position: number
          total_laps: number | null
          total_time: string | null
        }
        Insert: {
          average_speed?: number | null
          best_lap_time?: string | null
          created_at?: string | null
          driver_id?: string | null
          driver_name_text?: string | null
          gap_to_leader?: string | null
          gap_to_previous?: string | null
          heat_id: string
          id?: string
          kart_number?: number | null
          payment_status?: boolean | null
          points?: number | null
          position: number
          total_laps?: number | null
          total_time?: string | null
        }
        Update: {
          average_speed?: number | null
          best_lap_time?: string | null
          created_at?: string | null
          driver_id?: string | null
          driver_name_text?: string | null
          gap_to_leader?: string | null
          gap_to_previous?: string | null
          heat_id?: string
          id?: string
          kart_number?: number | null
          payment_status?: boolean | null
          points?: number | null
          position?: number
          total_laps?: number | null
          total_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heat_results_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heat_results_heat_id_fkey"
            columns: ["heat_id"]
            isOneToOne: false
            referencedRelation: "heats"
            referencedColumns: ["id"]
          },
        ]
      }
      heats: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          name: string
          start_time: string | null
          weather_condition:
            | Database["public"]["Enums"]["weather_condition"]
            | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          name: string
          start_time?: string | null
          weather_condition?:
            | Database["public"]["Enums"]["weather_condition"]
            | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          name?: string
          start_time?: string | null
          weather_condition?:
            | Database["public"]["Enums"]["weather_condition"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "heats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      lap_telemetry: {
        Row: {
          average_speed: number | null
          created_at: string | null
          gap_to_best: string | null
          gap_to_leader: string | null
          heat_result_id: string
          id: string
          kart_number: number | null
          lap_number: number
          lap_time: string
          sector1: string | null
          sector2: string | null
          sector3: string | null
          total_time: string | null
        }
        Insert: {
          average_speed?: number | null
          created_at?: string | null
          gap_to_best?: string | null
          gap_to_leader?: string | null
          heat_result_id: string
          id?: string
          kart_number?: number | null
          lap_number: number
          lap_time: string
          sector1?: string | null
          sector2?: string | null
          sector3?: string | null
          total_time?: string | null
        }
        Update: {
          average_speed?: number | null
          created_at?: string | null
          gap_to_best?: string | null
          gap_to_leader?: string | null
          heat_result_id?: string
          id?: string
          kart_number?: number | null
          lap_number?: number
          lap_time?: string
          sector1?: string | null
          sector2?: string | null
          sector3?: string | null
          total_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lap_telemetry_heat_result_id_fkey"
            columns: ["heat_result_id"]
            isOneToOne: false
            referencedRelation: "heat_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lap_telemetry_heat_result_id_fkey"
            columns: ["heat_result_id"]
            isOneToOne: false
            referencedRelation: "heat_results_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          instagram: string | null
          is_pro_member: boolean | null
          tiktok: string | null
          updated_at: string | null
          username: string | null
          website: string | null
          weight: number | null
          youtube: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          instagram?: string | null
          is_pro_member?: boolean | null
          tiktok?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          weight?: number | null
          youtube?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          is_pro_member?: boolean | null
          tiktok?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          weight?: number | null
          youtube?: string | null
        }
        Relationships: []
      }
      standalone_race_telemetry: {
        Row: {
          average_speed: number | null
          created_at: string | null
          gap_to_best: string | null
          gap_to_leader: string | null
          id: string
          kart_number: number | null
          lap_number: number
          lap_time: string
          sector1: string | null
          sector2: string | null
          sector3: string | null
          standalone_race_id: string
          total_time: string | null
        }
        Insert: {
          average_speed?: number | null
          created_at?: string | null
          gap_to_best?: string | null
          gap_to_leader?: string | null
          id?: string
          kart_number?: number | null
          lap_number: number
          lap_time: string
          sector1?: string | null
          sector2?: string | null
          sector3?: string | null
          standalone_race_id: string
          total_time?: string | null
        }
        Update: {
          average_speed?: number | null
          created_at?: string | null
          gap_to_best?: string | null
          gap_to_leader?: string | null
          id?: string
          kart_number?: number | null
          lap_number?: number
          lap_time?: string
          sector1?: string | null
          sector2?: string | null
          sector3?: string | null
          standalone_race_id?: string
          total_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standalone_race_telemetry_standalone_race_id_fkey"
            columns: ["standalone_race_id"]
            isOneToOne: false
            referencedRelation: "standalone_races"
            referencedColumns: ["id"]
          },
        ]
      }
      standalone_races: {
        Row: {
          average_speed: number | null
          best_lap_time: string | null
          created_at: string
          date: string
          gap_to_leader: string | null
          id: string
          kart_number: number | null
          notes: string | null
          points: number | null
          position: number | null
          race_type: string
          total_laps: number | null
          total_time: string | null
          track_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_speed?: number | null
          best_lap_time?: string | null
          created_at?: string
          date?: string
          gap_to_leader?: string | null
          id?: string
          kart_number?: number | null
          notes?: string | null
          points?: number | null
          position?: number | null
          race_type?: string
          total_laps?: number | null
          total_time?: string | null
          track_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_speed?: number | null
          best_lap_time?: string | null
          created_at?: string
          date?: string
          gap_to_leader?: string | null
          id?: string
          kart_number?: number | null
          notes?: string | null
          points?: number | null
          position?: number | null
          race_type?: string
          total_laps?: number | null
          total_time?: string | null
          track_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          created_at: string | null
          id: string
          length_meters: number | null
          location: string
          map_image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          length_meters?: number | null
          location: string
          map_image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          length_meters?: number | null
          location?: string
          map_image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      championships_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_private: boolean | null
          logo_url: string | null
          name: string | null
          organizer_avatar_url: string | null
          organizer_name: string | null
          rules_summary: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      heat_results_public: {
        Row: {
          average_speed: number | null
          best_lap_time: string | null
          created_at: string | null
          driver_id: string | null
          driver_name_text: string | null
          gap_to_leader: string | null
          gap_to_previous: string | null
          heat_id: string | null
          id: string | null
          kart_number: number | null
          points: number | null
          position: number | null
          total_laps: number | null
          total_time: string | null
        }
        Insert: {
          average_speed?: number | null
          best_lap_time?: string | null
          created_at?: string | null
          driver_id?: string | null
          driver_name_text?: string | null
          gap_to_leader?: string | null
          gap_to_previous?: string | null
          heat_id?: string | null
          id?: string | null
          kart_number?: number | null
          points?: number | null
          position?: number | null
          total_laps?: number | null
          total_time?: string | null
        }
        Update: {
          average_speed?: number | null
          best_lap_time?: string | null
          created_at?: string | null
          driver_id?: string | null
          driver_name_text?: string | null
          gap_to_leader?: string | null
          gap_to_previous?: string | null
          heat_id?: string | null
          id?: string | null
          kart_number?: number | null
          points?: number | null
          position?: number | null
          total_laps?: number | null
          total_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heat_results_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heat_results_heat_id_fkey"
            columns: ["heat_id"]
            isOneToOne: false
            referencedRelation: "heats"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_create_championships: { Args: never; Returns: boolean }
      can_view_analytics: { Args: never; Returns: boolean }
      can_view_payment_status: {
        Args: { p_driver_id: string; p_heat_id: string }
        Returns: boolean
      }
      can_view_profile_weight: {
        Args: { target_profile_id: string }
        Returns: boolean
      }
      ensure_profile_exists: { Args: never; Returns: undefined }
      get_my_pilot_id: { Args: never; Returns: string }
      get_user_tier: {
        Args: { target_user_id?: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_tier_or_higher: {
        Args: {
          required_tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_championship_organizer: {
        Args: { champ_id: string }
        Returns: boolean
      }
      is_moderator_or_higher: { Args: never; Returns: boolean }
      is_pilot_owner: { Args: { pilot_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "pilot"
      event_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      member_role: "driver" | "admin" | "organizer"
      member_status: "active" | "pending" | "banned"
      subscription_tier: "free" | "user" | "plus" | "moderator" | "admin"
      weather_condition: "dry" | "wet" | "mixed"
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
      app_role: ["admin", "pilot"],
      event_status: ["scheduled", "in_progress", "completed", "cancelled"],
      member_role: ["driver", "admin", "organizer"],
      member_status: ["active", "pending", "banned"],
      subscription_tier: ["free", "user", "plus", "moderator", "admin"],
      weather_condition: ["dry", "wet", "mixed"],
    },
  },
} as const
