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
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          contacts_notified: Json | null
          created_at: string
          id: string
          journey_id: string | null
          lat: number | null
          lng: number | null
          message: string | null
          resolved: boolean | null
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          contacts_notified?: Json | null
          created_at?: string
          id?: string
          journey_id?: string | null
          lat?: number | null
          lng?: number | null
          message?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          contacts_notified?: Json | null
          created_at?: string
          id?: string
          journey_id?: string | null
          lat?: number | null
          lng?: number | null
          message?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          id: string
          journey_id: string
          lat: number | null
          lng: number | null
          prompted_at: string
          responded_at: string | null
          response: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          journey_id: string
          lat?: number | null
          lng?: number | null
          prompted_at?: string
          responded_at?: string | null
          response?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          journey_id?: string
          lat?: number | null
          lng?: number | null
          prompted_at?: string
          responded_at?: string | null
          response?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_zone_rules: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          location_id: string
          notify_on_enter: boolean
          notify_on_exit: boolean
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          location_id: string
          notify_on_enter?: boolean
          notify_on_exit?: boolean
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          location_id?: string
          notify_on_enter?: boolean
          notify_on_exit?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_zone_rules_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_zone_rules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "saved_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notify_email: boolean | null
          notify_on_start: boolean | null
          notify_sms: boolean | null
          phone: string
          priority: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notify_email?: boolean | null
          notify_on_start?: boolean | null
          notify_sms?: boolean | null
          phone: string
          priority?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notify_email?: boolean | null
          notify_on_start?: boolean | null
          notify_sms?: boolean | null
          phone?: string
          priority?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      geofence_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lat: number
          lng: number
          location_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lat: number
          lng: number
          location_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lat?: number
          lng?: number
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "saved_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          heading: number | null
          id: string
          journey_id: string
          lat: number
          lng: number
          recorded_at: string
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          journey_id: string
          lat: number
          lng: number
          recorded_at?: string
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          journey_id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          speed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_locations_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          checkin_interval: number | null
          completed_at: string | null
          created_at: string
          distance_m: number | null
          duration_s: number | null
          end_address: string | null
          end_lat: number
          end_lng: number
          id: string
          route_geometry: Json | null
          safety_score: number | null
          safety_weight: number | null
          start_address: string | null
          start_lat: number
          start_lng: number
          started_at: string | null
          status: Database["public"]["Enums"]["journey_status"]
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          checkin_interval?: number | null
          completed_at?: string | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          end_address?: string | null
          end_lat: number
          end_lng: number
          id?: string
          route_geometry?: Json | null
          safety_score?: number | null
          safety_weight?: number | null
          start_address?: string | null
          start_lat: number
          start_lng: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_status"]
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          checkin_interval?: number | null
          completed_at?: string | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          end_address?: string | null
          end_lat?: number
          end_lng?: number
          id?: string
          route_geometry?: Json | null
          safety_score?: number | null
          safety_weight?: number | null
          start_address?: string | null
          start_lat?: number
          start_lng?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_status"]
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: []
      }
      location_share_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          journey_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          journey_id: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          journey_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_share_tokens_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_notify_on_critical_battery: boolean | null
          battery_critical_threshold: number | null
          battery_warning_threshold: number | null
          created_at: string
          default_checkin_interval: number | null
          default_safety_weight: number | null
          enable_battery_alerts: boolean | null
          fake_call_caller_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          safe_word: string | null
          safety_preferences: Json | null
          shake_action: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_notify_on_critical_battery?: boolean | null
          battery_critical_threshold?: number | null
          battery_warning_threshold?: number | null
          created_at?: string
          default_checkin_interval?: number | null
          default_safety_weight?: number | null
          enable_battery_alerts?: boolean | null
          fake_call_caller_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          safe_word?: string | null
          safety_preferences?: Json | null
          shake_action?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_notify_on_critical_battery?: boolean | null
          battery_critical_threshold?: number | null
          battery_warning_threshold?: number | null
          created_at?: string
          default_checkin_interval?: number | null
          default_safety_weight?: number | null
          enable_battery_alerts?: boolean | null
          fake_call_caller_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          safe_word?: string | null
          safety_preferences?: Json | null
          shake_action?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_places: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          lat: number
          lng: number
          name: string
          opening_hours: Json | null
          phone: string | null
          source: string | null
          type: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          opening_hours?: Json | null
          phone?: string | null
          source?: string | null
          type: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          source?: string | null
          type?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      safety_reports: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          lat: number
          lng: number
          report_type: string
          time_relevance: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          lat: number
          lng: number
          report_type: string
          time_relevance?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          lat?: number
          lng?: number
          report_type?: string
          time_relevance?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safety_votes: {
        Row: {
          created_at: string
          id: string
          report_id: string
          user_id: string
          vote: number
        }
        Insert: {
          created_at?: string
          id?: string
          report_id: string
          user_id: string
          vote: number
        }
        Update: {
          created_at?: string
          id?: string
          report_id?: string
          user_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "safety_votes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "safety_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_locations: {
        Row: {
          address: string | null
          created_at: string
          geofence_enabled: boolean | null
          geofence_radius_m: number | null
          id: string
          label: string | null
          lat: number
          lng: number
          name: string
          notify_on_enter: boolean | null
          notify_on_exit: boolean | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          geofence_enabled?: boolean | null
          geofence_radius_m?: number | null
          id?: string
          label?: string | null
          lat: number
          lng: number
          name: string
          notify_on_enter?: boolean | null
          notify_on_exit?: boolean | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          geofence_enabled?: boolean | null
          geofence_radius_m?: number | null
          id?: string
          label?: string | null
          lat?: number
          lng?: number
          name?: string
          notify_on_enter?: boolean | null
          notify_on_exit?: boolean | null
          user_id?: string
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
    }
    Enums: {
      alert_type: "missed_checkin" | "sos" | "safe_word" | "manual"
      app_role: "admin" | "moderator" | "user"
      journey_status:
        | "planned"
        | "active"
        | "completed"
        | "alert_triggered"
        | "cancelled"
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
      alert_type: ["missed_checkin", "sos", "safe_word", "manual"],
      app_role: ["admin", "moderator", "user"],
      journey_status: [
        "planned",
        "active",
        "completed",
        "alert_triggered",
        "cancelled",
      ],
    },
  },
} as const
