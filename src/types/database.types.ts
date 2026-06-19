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
      articles: {
        Row: {
          body_md: string | null
          canonical_url: string | null
          category: string | null
          created_at: string
          eyecatch_image_url: string | null
          id: string
          meta_description: string | null
          noindex: boolean
          published_at: string | null
          seo_title: string | null
          slug: string
          status: string
          supervisor_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          canonical_url?: string | null
          category?: string | null
          created_at?: string
          eyecatch_image_url?: string | null
          id?: string
          meta_description?: string | null
          noindex?: boolean
          published_at?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          supervisor_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          canonical_url?: string | null
          category?: string | null
          created_at?: string
          eyecatch_image_url?: string | null
          id?: string
          meta_description?: string | null
          noindex?: boolean
          published_at?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          supervisor_name?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          body_md: string | null
          created_at: string
          faq_json: Json | null
          id: string
          intro_text: string | null
          meta_description: string | null
          name: string
          prefecture_id: string
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          faq_json?: Json | null
          id?: string
          intro_text?: string | null
          meta_description?: string | null
          name: string
          prefecture_id: string
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          created_at?: string
          faq_json?: Json | null
          id?: string
          intro_text?: string | null
          meta_description?: string | null
          name?: string
          prefecture_id?: string
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      feature_gyms: {
        Row: {
          comment: string | null
          created_at: string
          feature_id: string
          gym_id: string
          id: string
          sort_order: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feature_id: string
          gym_id: string
          id?: string
          sort_order?: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          feature_id?: string
          gym_id?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_gyms_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_gyms_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          body_md: string | null
          category: string | null
          city_id: string | null
          created_at: string
          faq_json: Json | null
          id: string
          meta_description: string | null
          prefecture_id: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          station_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          category?: string | null
          city_id?: string | null
          created_at?: string
          faq_json?: Json | null
          id?: string
          meta_description?: string | null
          prefecture_id?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          station_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          category?: string | null
          city_id?: string | null
          created_at?: string
          faq_json?: Json | null
          id?: string
          meta_description?: string | null
          prefecture_id?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          station_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_import_jobs: {
        Row: {
          city: string | null
          created_at: string
          duplicate_count: number
          error_count: number
          executed_by: string | null
          id: string
          keyword: string | null
          max_results: number | null
          new_count: number
          prefecture: string | null
          radius: number | null
          status: string
          total_results: number
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          duplicate_count?: number
          error_count?: number
          executed_by?: string | null
          id?: string
          keyword?: string | null
          max_results?: number | null
          new_count?: number
          prefecture?: string | null
          radius?: number | null
          status?: string
          total_results?: number
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          duplicate_count?: number
          error_count?: number
          executed_by?: string | null
          id?: string
          keyword?: string | null
          max_results?: number | null
          new_count?: number
          prefecture?: string | null
          radius?: number | null
          status?: string
          total_results?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_import_jobs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_import_results: {
        Row: {
          address: string | null
          created_at: string
          google_maps_url: string | null
          google_place_id: string
          google_rating: number | null
          google_review_count: number | null
          id: string
          import_status: string
          job_id: string
          latitude: number | null
          longitude: number | null
          matched_gym_id: string | null
          name: string | null
          phone: string | null
          raw_json: Json | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          google_maps_url?: string | null
          google_place_id: string
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          import_status?: string
          job_id: string
          latitude?: number | null
          longitude?: number | null
          matched_gym_id?: string | null
          name?: string | null
          phone?: string | null
          raw_json?: Json | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          google_maps_url?: string | null
          google_place_id?: string
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          import_status?: string
          job_id?: string
          latitude?: number | null
          longitude?: number | null
          matched_gym_id?: string | null
          name?: string | null
          phone?: string | null
          raw_json?: Json | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_import_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "google_import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_import_results_matched_gym_id_fkey"
            columns: ["matched_gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_claims: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          gym_id: string | null
          id: string
          message: string | null
          owner_name: string
          phone: string | null
          position: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          gym_id?: string | null
          id?: string
          message?: string | null
          owner_name: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          gym_id?: string | null
          id?: string
          message?: string | null
          owner_name?: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_claims_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_delete_requests: {
        Row: {
          created_at: string
          email: string
          gym_id: string | null
          id: string
          reason: string
          requester_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          gym_id?: string | null
          id?: string
          reason: string
          requester_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          gym_id?: string | null
          id?: string
          reason?: string
          requester_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_delete_requests_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_images: {
        Row: {
          alt_text: string | null
          attribution: string | null
          created_at: string
          gym_id: string
          id: string
          image_url: string
          is_cover: boolean
          photo_reference: string | null
          sort_order: number
          source: string
          storage_path: string | null
        }
        Insert: {
          alt_text?: string | null
          attribution?: string | null
          created_at?: string
          gym_id: string
          id?: string
          image_url: string
          is_cover?: boolean
          photo_reference?: string | null
          sort_order?: number
          source?: string
          storage_path?: string | null
        }
        Update: {
          alt_text?: string | null
          attribution?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          photo_reference?: string | null
          sort_order?: number
          source?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_images_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_plans: {
        Row: {
          created_at: string
          duration_weeks: number | null
          gym_id: string
          id: string
          monthly_equivalent: number | null
          name: string
          note: string | null
          price: number
          sessions: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          duration_weeks?: number | null
          gym_id: string
          id?: string
          monthly_equivalent?: number | null
          name: string
          note?: string | null
          price: number
          sessions?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          duration_weeks?: number | null
          gym_id?: string
          id?: string
          monthly_equivalent?: number | null
          name?: string
          note?: string | null
          price?: number
          sessions?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_tags: {
        Row: {
          gym_id: string
          tag_id: string
        }
        Insert: {
          gym_id: string
          tag_id: string
        }
        Update: {
          gym_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_tags_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_update_requests: {
        Row: {
          attachment_url: string | null
          created_at: string
          email: string
          gym_id: string | null
          id: string
          message: string
          requester_name: string
          status: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          email: string
          gym_id?: string | null
          id?: string
          message: string
          requester_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          email?: string
          gym_id?: string | null
          id?: string
          message?: string
          requester_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_update_requests_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          admission_fee: number | null
          area_name: string | null
          canonical_url: string | null
          city_id: string | null
          created_at: string
          description: string | null
          facilities: string | null
          google_maps_url: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          has_nutrition_support: boolean
          has_private_room: boolean
          has_trial: boolean
          id: string
          is_female_friendly: boolean
          is_near_station: boolean
          last_checked_at: string | null
          latitude: number | null
          longitude: number | null
          meta_description: string | null
          monthly_fee_min: number | null
          name: string
          nearest_station_id: string | null
          noindex: boolean
          opening_hours: Json | null
          phone: string | null
          prefecture_id: string | null
          published_at: string | null
          published_by: string | null
          recommended_points: string | null
          search_vector: unknown
          seo_title: string | null
          slug: string
          source: string
          status: string
          supports_contest: boolean
          target_users: string | null
          total_price_min: number | null
          trainer_info: string | null
          trial_fee: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          admission_fee?: number | null
          area_name?: string | null
          canonical_url?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          facilities?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          has_nutrition_support?: boolean
          has_private_room?: boolean
          has_trial?: boolean
          id?: string
          is_female_friendly?: boolean
          is_near_station?: boolean
          last_checked_at?: string | null
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          monthly_fee_min?: number | null
          name: string
          nearest_station_id?: string | null
          noindex?: boolean
          opening_hours?: Json | null
          phone?: string | null
          prefecture_id?: string | null
          published_at?: string | null
          published_by?: string | null
          recommended_points?: string | null
          search_vector?: unknown
          seo_title?: string | null
          slug: string
          source?: string
          status?: string
          supports_contest?: boolean
          target_users?: string | null
          total_price_min?: number | null
          trainer_info?: string | null
          trial_fee?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          admission_fee?: number | null
          area_name?: string | null
          canonical_url?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          facilities?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          has_nutrition_support?: boolean
          has_private_room?: boolean
          has_trial?: boolean
          id?: string
          is_female_friendly?: boolean
          is_near_station?: boolean
          last_checked_at?: string | null
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          monthly_fee_min?: number | null
          name?: string
          nearest_station_id?: string | null
          noindex?: boolean
          opening_hours?: Json | null
          phone?: string | null
          prefecture_id?: string | null
          published_at?: string | null
          published_by?: string | null
          recommended_points?: string | null
          search_vector?: unknown
          seo_title?: string | null
          slug?: string
          source?: string
          status?: string
          supports_contest?: boolean
          target_users?: string | null
          total_price_min?: number | null
          trainer_info?: string | null
          trial_fee?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gyms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gyms_nearest_station_id_fkey"
            columns: ["nearest_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gyms_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gyms_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prefectures: {
        Row: {
          body_md: string | null
          created_at: string
          faq_json: Json | null
          id: string
          intro_text: string | null
          meta_description: string | null
          name: string
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          faq_json?: Json | null
          id?: string
          intro_text?: string | null
          meta_description?: string | null
          name: string
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          created_at?: string
          faq_json?: Json | null
          id?: string
          intro_text?: string | null
          meta_description?: string | null
          name?: string
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      ranking_gyms: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          rank: number
          ranking_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          rank: number
          ranking_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          rank?: number
          ranking_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_gyms_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_gyms_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      rankings: {
        Row: {
          body_md: string | null
          category: string | null
          city_id: string | null
          closing_md: string | null
          created_at: string
          eyecatch_image_url: string | null
          id: string
          meta_description: string | null
          prefecture_id: string | null
          seo_title: string | null
          slug: string
          station_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          category?: string | null
          city_id?: string | null
          closing_md?: string | null
          created_at?: string
          eyecatch_image_url?: string | null
          id?: string
          meta_description?: string | null
          prefecture_id?: string | null
          seo_title?: string | null
          slug: string
          station_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          category?: string | null
          city_id?: string | null
          closing_md?: string | null
          created_at?: string
          eyecatch_image_url?: string | null
          id?: string
          meta_description?: string | null
          prefecture_id?: string | null
          seo_title?: string | null
          slug?: string
          station_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rankings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          city_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "stations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
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
