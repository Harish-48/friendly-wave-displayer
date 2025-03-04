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
      orders: {
        Row: {
          client_email: string
          created_at: string
          current_stage: string
          delivery_confirmed: boolean | null
          delivery_date: string | null
          delivery_driver_number: string | null
          delivery_loading: string | null
          delivery_successful: boolean | null
          delivery_timestamp: string | null
          delivery_vehicle_number: string | null
          id: string
          material_arrival: string | null
          material_estimation: string | null
          material_loading: string | null
          material_purchase_bill: string | null
          material_timestamp: string | null
          painting_inspection_needed: boolean | null
          painting_painting: string | null
          painting_primer: string | null
          painting_timestamp: string | null
          production1_cutting: string | null
          production1_design: string | null
          production1_design_approved: boolean | null
          production1_edge_preparation: string | null
          production1_joint_welding: string | null
          production1_marking: string | null
          production1_timestamp: string | null
          production2_full_welding: string | null
          production2_inspection_needed: boolean | null
          production2_surface_finishing: string | null
          production2_timestamp: string | null
          quotation_approved: boolean | null
          quotation_link: string | null
          quotation_timestamp: string | null
          status: string
        }
        Insert: {
          client_email: string
          created_at?: string
          current_stage: string
          delivery_confirmed?: boolean | null
          delivery_date?: string | null
          delivery_driver_number?: string | null
          delivery_loading?: string | null
          delivery_successful?: boolean | null
          delivery_timestamp?: string | null
          delivery_vehicle_number?: string | null
          id?: string
          material_arrival?: string | null
          material_estimation?: string | null
          material_loading?: string | null
          material_purchase_bill?: string | null
          material_timestamp?: string | null
          painting_inspection_needed?: boolean | null
          painting_painting?: string | null
          painting_primer?: string | null
          painting_timestamp?: string | null
          production1_cutting?: string | null
          production1_design?: string | null
          production1_design_approved?: boolean | null
          production1_edge_preparation?: string | null
          production1_joint_welding?: string | null
          production1_marking?: string | null
          production1_timestamp?: string | null
          production2_full_welding?: string | null
          production2_inspection_needed?: boolean | null
          production2_surface_finishing?: string | null
          production2_timestamp?: string | null
          quotation_approved?: boolean | null
          quotation_link?: string | null
          quotation_timestamp?: string | null
          status: string
        }
        Update: {
          client_email?: string
          created_at?: string
          current_stage?: string
          delivery_confirmed?: boolean | null
          delivery_date?: string | null
          delivery_driver_number?: string | null
          delivery_loading?: string | null
          delivery_successful?: boolean | null
          delivery_timestamp?: string | null
          delivery_vehicle_number?: string | null
          id?: string
          material_arrival?: string | null
          material_estimation?: string | null
          material_loading?: string | null
          material_purchase_bill?: string | null
          material_timestamp?: string | null
          painting_inspection_needed?: boolean | null
          painting_painting?: string | null
          painting_primer?: string | null
          painting_timestamp?: string | null
          production1_cutting?: string | null
          production1_design?: string | null
          production1_design_approved?: boolean | null
          production1_edge_preparation?: string | null
          production1_joint_welding?: string | null
          production1_marking?: string | null
          production1_timestamp?: string | null
          production2_full_welding?: string | null
          production2_inspection_needed?: boolean | null
          production2_surface_finishing?: string | null
          production2_timestamp?: string | null
          quotation_approved?: boolean | null
          quotation_link?: string | null
          quotation_timestamp?: string | null
          status?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
