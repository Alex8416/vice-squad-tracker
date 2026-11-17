// Von Hand gepflegt, passend zu supabase/schema.sql
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type EventKind = 'mission' | 'milestone' | 'purchase' | 'achievement' | 'death' | 'note'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_color: string
          avatar_url: string | null
          crew_role: string | null
          created_at: string
        }
        Insert: never
        Update: {
          username?: string
          avatar_color?: string
          avatar_url?: string | null
          crew_role?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          user_id: string
          story_percent: number
          completion_percent: number
          missions_done: number
          current_mission: string | null
          money: number
          properties_owned: number
          vehicles_owned: number
          playtime_hours: number
          max_wanted_stars: number
          busted_count: number
          wasted_count: number
          status_message: string | null
          updated_at: string
        }
        Insert: never
        Update: {
          story_percent?: number
          completion_percent?: number
          missions_done?: number
          current_mission?: string | null
          money?: number
          properties_owned?: number
          vehicles_owned?: number
          playtime_hours?: number
          max_wanted_stars?: number
          busted_count?: number
          wasted_count?: number
          status_message?: string | null
        }
        Relationships: []
      }
      progress_events: {
        Row: {
          id: number
          user_id: string
          kind: EventKind
          title: string
          details: Json | null
          created_at: string
        }
        Insert: {
          user_id: string
          kind: EventKind
          title: string
          details?: Json | null
        }
        Update: never
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string | null
          icon: string | null
          points: number
          sort: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          id: string
          username: string
          avatar_color: string
          avatar_url: string | null
          crew_role: string | null
          story_percent: number
          completion_percent: number
          missions_done: number
          money: number
          playtime_hours: number
          wasted_count: number
          busted_count: number
          updated_at: string
          achievement_points: number
        }
        Relationships: []
      }
    }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']
export type Profile = PublicSchema['Tables']['profiles']['Row']
export type Progress = PublicSchema['Tables']['progress']['Row']
export type ProgressUpdate = PublicSchema['Tables']['progress']['Update']
export type ProgressEvent = PublicSchema['Tables']['progress_events']['Row']
export type Achievement = PublicSchema['Tables']['achievements']['Row']
export type UserAchievement = PublicSchema['Tables']['user_achievements']['Row']
export type LeaderboardRow = PublicSchema['Views']['leaderboard']['Row']
