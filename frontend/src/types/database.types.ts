
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_audit_logs": {
                  Row: {
                    "action": string,"actor_user_id": string | null,"created_at": string,"entity_id": string,"entity_type": string,"id": number,"new_data": Json | null,"old_data": Json | null
                  }
                  Insert: {
                    "action": string,"actor_user_id"?: string | null,"created_at"?: string,"entity_id": string,"entity_type"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null
                  }
                  Update: {
                    "action"?: string,"actor_user_id"?: string | null,"created_at"?: string,"entity_id"?: string,"entity_type"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_audit_logs_actor_user_id_fkey"
      columns: ["actor_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"matches": {
                  Row: {
                    "away_team_abbreviation": string,"away_team_color": string,"away_team_name": string,"competition": string,"created_at": string,"home_team_abbreviation": string,"home_team_color": string,"home_team_name": string,"id": string,"official_away_score": number | null,"official_home_score": number | null,"round": number,"stadium": string | null,"starts_at": string,"status": string,"updated_at": string
                  }
                  Insert: {
                    "away_team_abbreviation": string,"away_team_color": string,"away_team_name": string,"competition": string,"created_at"?: string,"home_team_abbreviation": string,"home_team_color": string,"home_team_name": string,"id": string,"official_away_score"?: number | null,"official_home_score"?: number | null,"round": number,"stadium"?: string | null,"starts_at": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "away_team_abbreviation"?: string,"away_team_color"?: string,"away_team_name"?: string,"competition"?: string,"created_at"?: string,"home_team_abbreviation"?: string,"home_team_color"?: string,"home_team_name"?: string,"id"?: string,"official_away_score"?: number | null,"official_home_score"?: number | null,"round"?: number,"stadium"?: string | null,"starts_at"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"pool_matches": {
                  Row: {
                    "match_id": string,"official_away_score": number | null,"official_home_score": number | null,"pool_id": string,"status": string,"updated_at": string
                  }
                  Insert: {
                    "match_id": string,"official_away_score"?: number | null,"official_home_score"?: number | null,"pool_id": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "match_id"?: string,"official_away_score"?: number | null,"official_home_score"?: number | null,"pool_id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pool_matches_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pool_matches_pool_id_fkey"
      columns: ["pool_id"]
isOneToOne: false
      referencedRelation: "pools"
      referencedColumns: ["id"]
    }
                  ]
                },"pool_members": {
                  Row: {
                    "joined_at": string,"pool_id": string,"role": string,"user_id": string
                  }
                  Insert: {
                    "joined_at"?: string,"pool_id": string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"pool_id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pool_members_pool_id_fkey"
      columns: ["pool_id"]
isOneToOne: false
      referencedRelation: "pools"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pool_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"pools": {
                  Row: {
                    "competition": string,"created_at": string,"description": string,"id": string,"invite_code": string,"is_global": boolean,"name": string,"owner_id": string | null,"updated_at": string,"visibility": string
                  }
                  Insert: {
                    "competition": string,"created_at"?: string,"description"?: string,"id"?: string,"invite_code"?: string,"is_global"?: boolean,"name": string,"owner_id"?: string | null,"updated_at"?: string,"visibility"?: string
                  }
                  Update: {
                    "competition"?: string,"created_at"?: string,"description"?: string,"id"?: string,"invite_code"?: string,"is_global"?: boolean,"name"?: string,"owner_id"?: string | null,"updated_at"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pools_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"predictions": {
                  Row: {
                    "away_score": number,"home_score": number,"match_id": string,"pool_id": string,"saved_at": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "away_score": number,"home_score": number,"match_id": string,"pool_id": string,"saved_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "away_score"?: number,"home_score"?: number,"match_id"?: string,"pool_id"?: string,"saved_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "predictions_pool_id_match_id_fkey"
      columns: ["pool_id","match_id"]
isOneToOne: false
      referencedRelation: "pool_matches"
      referencedColumns: ["pool_id","match_id"]
    },{
      foreignKeyName: "predictions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"is_admin": boolean,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"full_name"?: string,"id": string,"is_admin"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"is_admin"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_official_match":
{ Args: { "away_team_abbreviation_value": string,"away_team_color_value": string,"away_team_name_value": string,"competition_value": string,"home_team_abbreviation_value": string,"home_team_color_value": string,"home_team_name_value": string,"round_value": number,"stadium_value": string,"starts_at_value": string }; Returns: string
                           },
"get_admin_audit_logs":
{ Args: { "result_limit"?: number,"result_offset"?: number }; Returns: {
              "action_name": string,"actor_name": string,"actor_user_id": string,"away_team_name": string,"event_created_at": string,"home_team_name": string,"log_id": number,"match_id": string,"new_status": string,"previous_status": string
            }[]
                           },
"get_pool_ranking":
{ Args: { "target_pool_id": string }; Returns: {
              "correct_results": number,"exact_scores": number,"points": number,"position": number,"user_id": string,"user_name": string,"wrong_predictions": number
            }[]
                           },
"get_pool_ranking_summary":
{ Args: { "ranking_limit"?: number,"target_pool_id": string }; Returns: {
              "correct_results": number,"exact_scores": number,"is_current_user": boolean,"is_top_entry": boolean,"points": number,"ranking_position": number,"total_participants": number,"user_id": string,"user_name": string,"wrong_predictions": number
            }[]
                           },
"is_application_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_global_pool":
{ Args: { "target_pool_id": string }; Returns: boolean
                           },
"is_pool_member":
{ Args: { "target_pool_id": string }; Returns: boolean
                           },
"is_pool_owner":
{ Args: { "target_pool_id": string }; Returns: boolean
                           },
"join_pool_by_code":
{ Args: { "provided_code": string }; Returns: string
                           },
"save_official_match_result":
{ Args: { "away_score_value": number,"home_score_value": number,"target_match_id": string }; Returns: undefined
                           },
"update_official_match_details":
{ Args: { "away_team_abbreviation_value": string,"away_team_color_value": string,"away_team_name_value": string,"competition_value": string,"home_team_abbreviation_value": string,"home_team_color_value": string,"home_team_name_value": string,"round_value": number,"stadium_value": string,"starts_at_value": string,"target_match_id": string }; Returns: undefined
                           },
"update_official_match_state":
{ Args: { "away_score_value"?: number,"home_score_value"?: number,"new_status": string,"target_match_id": string }; Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

