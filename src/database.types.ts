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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          first_name: string
          id: string
          is_default: boolean
          last_name: string
          phone: string
          postal_code: string
          state: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string
          created_at?: string
          first_name: string
          id?: string
          is_default?: boolean
          last_name: string
          phone: string
          postal_code: string
          state: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          is_default?: boolean
          last_name?: string
          phone?: string
          postal_code?: string
          state?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          convenience_fee: number | null
          created_at: string
          currency: string
          delivery_charge: number | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          convenience_fee?: number | null
          created_at?: string
          currency?: string
          delivery_charge?: number | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          subtotal: number
          tax_amount?: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          convenience_fee?: number | null
          created_at?: string
          currency?: string
          delivery_charge?: number | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
        }
        Relationships: []
      }
      part_fitments: {
        Row: {
          part_id: string
          vehicle_id: string
        }
        Insert: {
          part_id: string
          vehicle_id: string
        }
        Update: {
          part_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_fitments_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_fitments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          brand: string | null
          created_at: string
          description: string | null
          fts: unknown | null
          id: string
          image_urls: string[] | null
          is_active: boolean
          is_featured: boolean
          name: string
          part_number: string | null
          price: number
          seller_id: string | null
          sku: string | null
          specifications: Json | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          description?: string | null
          fts?: unknown | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          part_number?: string | null
          price: number
          seller_id?: string | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          description?: string | null
          fts?: unknown | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          part_number?: string | null
          price?: number
          seller_id?: string | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_fitments: {
        Row: {
          product_id: string
          vehicle_id: string
        }
        Insert: {
          product_id: string
          vehicle_id: string
        }
        Update: {
          product_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_fitments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_fitments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          dimensions: string | null
          engine_size: string | null
          fuel_type: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean
          is_featured: boolean
          min_stock_level: number | null
          name: string
          part_number: string | null
          price: number
          seller_id: string | null
          sku: string | null
          specifications: string | null
          stock_quantity: number
          tags: string[] | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          engine_size?: string | null
          fuel_type?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          min_stock_level?: number | null
          name: string
          part_number?: string | null
          price: number
          seller_id?: string | null
          sku?: string | null
          specifications?: string | null
          stock_quantity?: number
          tags?: string[] | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          engine_size?: string | null
          fuel_type?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          min_stock_level?: number | null
          name?: string
          part_number?: string | null
          price?: number
          seller_id?: string | null
          sku?: string | null
          specifications?: string | null
          stock_quantity?: number
          tags?: string[] | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          is_seller: boolean | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_seller?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_seller?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sellers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicle_makes: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_models: {
        Row: {
          created_at: string
          id: string
          make_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          make_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          make_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_makes"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_years: {
        Row: {
          created_at: string
          id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          year?: number
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          make: string
          model: string
          year: number
        }
        Insert: {
          id?: string
          make: string
          model: string
          year: number
        }
        Update: {
          id?: string
          make?: string
          model?: string
          year?: number
        }
        Relationships: []
      }
      email_subscriptions: {
        Row: {
          id: string
          user_id: string
          email: string
          subscribed_to_new_products: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          subscribed_to_new_products?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          subscribed_to_new_products?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          message: string
          user_id: string
          conversation_id: string
          is_admin: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          message: string
          user_id: string
          conversation_id: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          message?: string
          user_id?: string
          conversation_id?: string
          is_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      publish_new_part_standalone: {
        Args: {
          p_brand: string
          p_description: string
          p_image_urls: string[]
          p_make: string
          p_model: string
          p_name: string
          p_price: number
          p_seller_id: string
          p_specifications: Json
          p_stock_quantity: number
          p_year: number
        }
        Returns: string
      }
      publish_new_product: {
        Args: {
          p_brand: string
          p_category: string
          p_description: string
          p_image_urls: string[]
          p_make: string
          p_model: string
          p_name: string
          p_price: number
          p_seller_id: string
          p_specifications: string
          p_stock_quantity: number
          p_year: string
        }
        Returns: string
      }
      publish_new_vehicle_part: {
        Args: {
          p_brand: string
          p_category: string
          p_description: string
          p_image_urls: string[]
          p_make: string
          p_model: string
          p_name: string
          p_price: number
          p_seller_id: number
          p_specifications: Json
          p_stock_quantity: number
          p_year: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
