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
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string
          hit_count: number
          lang: string
          last_hit_at: string
          prompt: string
          response: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          hit_count?: number
          lang: string
          last_hit_at?: string
          prompt: string
          response: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          hit_count?: number
          lang?: string
          last_hit_at?: string
          prompt?: string
          response?: Json
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_avatar: string | null
          author_name: string
          author_role: string
          category: string
          content_ar: string
          content_en: string
          excerpt_ar: string
          excerpt_en: string
          featured: boolean
          featured_image: string | null
          id: string
          published_at: string
          reading_time_minutes: number
          related_article_slugs: string[] | null
          related_movie_ids: number[] | null
          slug: string
          status: string
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string
          author_role?: string
          category?: string
          content_ar: string
          content_en: string
          excerpt_ar: string
          excerpt_en: string
          featured?: boolean
          featured_image?: string | null
          id?: string
          published_at?: string
          reading_time_minutes?: number
          related_article_slugs?: string[] | null
          related_movie_ids?: number[] | null
          slug: string
          status?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          author_role?: string
          category?: string
          content_ar?: string
          content_en?: string
          excerpt_ar?: string
          excerpt_en?: string
          featured?: boolean
          featured_image?: string | null
          id?: string
          published_at?: string
          reading_time_minutes?: number
          related_article_slugs?: string[] | null
          related_movie_ids?: number[] | null
          slug?: string
          status?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      collections_editorial: {
        Row: {
          badge: string | null
          cover_image: string | null
          created_at: string
          description_ar: string
          description_en: string
          editorial_intro_ar: string
          editorial_intro_en: string
          id: string
          is_featured: boolean
          movie_curation_notes: Json | null
          movie_ids: number[]
          slug: string
          status: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar: string
          description_en: string
          editorial_intro_ar: string
          editorial_intro_en: string
          id?: string
          is_featured?: boolean
          movie_curation_notes?: Json | null
          movie_ids?: number[]
          slug: string
          status?: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string
          description_en?: string
          editorial_intro_ar?: string
          editorial_intro_en?: string
          id?: string
          is_featured?: boolean
          movie_curation_notes?: Json | null
          movie_ids?: number[]
          slug?: string
          status?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      editorial_reviews: {
        Row: {
          acting_score: number | null
          author_id: string | null
          author_name: string
          author_role: string
          best_for: string | null
          content_notes: string | null
          editorial_score: number
          entertainment_score: number | null
          experience_level: string | null
          id: string
          mood: string | null
          movie_id: number
          published_at: string
          recommended_viewing: string | null
          review_content: string
          similar_reasons: Json | null
          status: string
          story_score: number | null
          strengths: string[] | null
          title: string
          updated_at: string
          verdict: string
          visuals_score: number | null
          weaknesses: string[] | null
          who_may_not_enjoy: string | null
          who_should_watch: string | null
          why_watch: string | null
        }
        Insert: {
          acting_score?: number | null
          author_id?: string | null
          author_name?: string
          author_role?: string
          best_for?: string | null
          content_notes?: string | null
          editorial_score: number
          entertainment_score?: number | null
          experience_level?: string | null
          id?: string
          mood?: string | null
          movie_id: number
          published_at?: string
          recommended_viewing?: string | null
          review_content: string
          similar_reasons?: Json | null
          status?: string
          story_score?: number | null
          strengths?: string[] | null
          title: string
          updated_at?: string
          verdict: string
          visuals_score?: number | null
          weaknesses?: string[] | null
          who_may_not_enjoy?: string | null
          who_should_watch?: string | null
          why_watch?: string | null
        }
        Update: {
          acting_score?: number | null
          author_id?: string | null
          author_name?: string
          author_role?: string
          best_for?: string | null
          content_notes?: string | null
          editorial_score?: number
          entertainment_score?: number | null
          experience_level?: string | null
          id?: string
          mood?: string | null
          movie_id?: number
          published_at?: string
          recommended_viewing?: string | null
          review_content?: string
          similar_reasons?: Json | null
          status?: string
          story_score?: number | null
          strengths?: string[] | null
          title?: string
          updated_at?: string
          verdict?: string
          visuals_score?: number | null
          weaknesses?: string[] | null
          who_may_not_enjoy?: string | null
          who_should_watch?: string | null
          why_watch?: string | null
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          count: number
          day: string
          ip: string
        }
        Insert: {
          count?: number
          day?: string
          ip: string
        }
        Update: {
          count?: number
          day?: string
          ip?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          movie_id: number
          poster: string | null
          rating: number | null
          title: string
          user_id: string
          year: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: number
          poster?: string | null
          rating?: number | null
          title: string
          user_id: string
          year?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: number
          poster?: string | null
          rating?: number | null
          title?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      sitemap_submissions: {
        Row: {
          created_at: string
          errors: number | null
          http_status: number | null
          id: string
          indexed_urls: number | null
          message: string | null
          status: string
          submitted_by: string | null
          submitted_urls: number | null
          warnings: number | null
        }
        Insert: {
          created_at?: string
          errors?: number | null
          http_status?: number | null
          id?: string
          indexed_urls?: number | null
          message?: string | null
          status: string
          submitted_by?: string | null
          submitted_urls?: number | null
          warnings?: number | null
        }
        Update: {
          created_at?: string
          errors?: number | null
          http_status?: number | null
          id?: string
          indexed_urls?: number | null
          message?: string | null
          status?: string
          submitted_by?: string | null
          submitted_urls?: number | null
          warnings?: number | null
        }
        Relationships: []
      }
      user_lists: {
        Row: {
          created_at: string
          id: string
          media_id: number
          media_type: string
          note: string | null
          poster: string | null
          rating: number | null
          status: string
          title: string
          tmdb_rating: number | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: number
          media_type: string
          note?: string | null
          poster?: string | null
          rating?: number | null
          status: string
          title: string
          tmdb_rating?: number | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: number
          media_type?: string
          note?: string | null
          poster?: string | null
          rating?: number | null
          status?: string
          title?: string
          tmdb_rating?: number | null
          updated_at?: string
          user_id?: string
          year?: string | null
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
