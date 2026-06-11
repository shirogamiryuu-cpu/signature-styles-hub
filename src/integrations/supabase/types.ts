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
      appointments: {
        Row: {
          appointment_datetime: string
          barber_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          style_id: string | null
          user_id: string | null
        }
        Insert: {
          appointment_datetime: string
          barber_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          style_id?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_datetime?: string
          barber_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          style_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "haircut_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_style_map: {
        Row: {
          barber_id: string
          style_id: string
        }
        Insert: {
          barber_id: string
          style_id: string
        }
        Update: {
          barber_id?: string
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_style_map_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_style_map_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "haircut_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          profile_image_url: string | null
          specialties: string[] | null
          years_of_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          profile_image_url?: string | null
          specialties?: string[] | null
          years_of_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          profile_image_url?: string | null
          specialties?: string[] | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      business_info: {
        Row: {
          address: string | null
          facebook_url: string | null
          google_maps_embed_link: string | null
          id: string
          opening_hours_text: string | null
          phone1: string | null
          phone2: string | null
          phone3: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          facebook_url?: string | null
          google_maps_embed_link?: string | null
          id?: string
          opening_hours_text?: string | null
          phone1?: string | null
          phone2?: string | null
          phone3?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          facebook_url?: string | null
          google_maps_embed_link?: string | null
          id?: string
          opening_hours_text?: string | null
          phone1?: string | null
          phone2?: string | null
          phone3?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      haircut_registers: {
        Row: {
          appointment_id: string | null
          barber_id: string
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          date_performed: string
          id: string
          notes: string | null
          price_charged: number | null
          style_id: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          date_performed?: string
          id?: string
          notes?: string | null
          price_charged?: number | null
          style_id: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          date_performed?: string
          id?: string
          notes?: string | null
          price_charged?: number | null
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "haircut_registers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "haircut_registers_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "haircut_registers_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "haircut_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      haircut_styles: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          style_image_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          style_image_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          style_image_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          appointment_id: string | null
          audience: string
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          audience: string
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          rating: number
          user_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_name: string
          id?: string
          is_approved?: boolean
          rating: number
          user_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "user"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
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
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
