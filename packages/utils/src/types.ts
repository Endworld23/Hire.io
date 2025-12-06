// Database types aligned with supabase/migrations/20251206030000_consolidate_schema.sql.
// Keep this in sync with the consolidated schema migration.

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
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          subdomain: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          subdomain?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          subdomain?: string | null
        }
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          metadata: Json | null
          role: 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          metadata?: Json | null
          role: 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          metadata?: Json | null
          role?: 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'
          tenant_id?: string | null
        }
      }
      jobs: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          location: string | null
          nice_to_have: Json | null
          required_skills: Json | null
          salary_max: number | null
          salary_min: number | null
          spec: Json | null
          status: 'draft' | 'active' | 'closed' | 'archived'
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          nice_to_have?: Json | null
          required_skills?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          spec?: Json | null
          status?: 'draft' | 'active' | 'closed' | 'archived'
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          nice_to_have?: Json | null
          required_skills?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          spec?: Json | null
          status?: 'draft' | 'active' | 'closed' | 'archived'
          tenant_id?: string
          title?: string
        }
      }
      candidates: {
        Row: {
          created_at: string | null
          email: string | null
          experience: Json | null
          full_name: string | null
          id: string
          is_global: boolean | null
          location: string | null
          owner_tenant_id: string | null
          phone: string | null
          public_id: string | null
          resume_text: string | null
          resume_url: string | null
          skills: Json | null
          user_id: string | null
          visibility: Json | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          id?: string
          is_global?: boolean | null
          location?: string | null
          owner_tenant_id?: string | null
          phone?: string | null
          public_id?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: Json | null
          user_id?: string | null
          visibility?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          id?: string
          is_global?: boolean | null
          location?: string | null
          owner_tenant_id?: string | null
          phone?: string | null
          public_id?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: Json | null
          user_id?: string | null
          visibility?: Json | null
        }
      }
      applications: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          job_id: string
          match_score: number | null
          notes: string | null
          score: number | null
          stage:
            | 'new'
            | 'applied'
            | 'recruiter_screen'
            | 'screening'
            | 'submitted_to_client'
            | 'client_shortlisted'
            | 'client_rejected'
            | 'interview'
            | 'offer'
            | 'hired'
            | 'rejected'
          tenant_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          job_id: string
          match_score?: number | null
          notes?: string | null
          score?: number | null
          stage?:
            | 'new'
            | 'applied'
            | 'recruiter_screen'
            | 'screening'
            | 'submitted_to_client'
            | 'client_shortlisted'
            | 'client_rejected'
            | 'interview'
            | 'offer'
            | 'hired'
            | 'rejected'
          tenant_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          job_id?: string
          match_score?: number | null
          notes?: string | null
          score?: number | null
          stage?:
            | 'new'
            | 'applied'
            | 'recruiter_screen'
            | 'screening'
            | 'submitted_to_client'
            | 'client_shortlisted'
            | 'client_rejected'
            | 'interview'
            | 'offer'
            | 'hired'
            | 'rejected'
          tenant_id?: string
        }
      }
      stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order: number
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order?: number
          tenant_id?: string
        }
      }
      events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
        }
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
      }
      job_application_feedback: {
        Row: {
          application_id: string
          author_user_id: string | null
          comment: string
          created_at: string | null
          id: string
          job_id: string
          rating: number | null
          tenant_id: string
        }
        Insert: {
          application_id: string
          author_user_id?: string | null
          comment: string
          created_at?: string | null
          id?: string
          job_id: string
          rating?: number | null
          tenant_id: string
        }
        Update: {
          application_id?: string
          author_user_id?: string | null
          comment?: string
          created_at?: string | null
          id?: string
          job_id?: string
          rating?: number | null
          tenant_id?: string
        }
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
  }
}

export type Role = Database['public']['Tables']['users']['Row']['role']
export type JobStatus = Database['public']['Tables']['jobs']['Row']['status']
export type ApplicationStage = Database['public']['Tables']['applications']['Row']['stage']

export type Tenant = Database['public']['Tables']['tenants']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type Candidate = Database['public']['Tables']['candidates']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type Stage = Database['public']['Tables']['stages']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type JobApplicationFeedback = Database['public']['Tables']['job_application_feedback']['Row']
