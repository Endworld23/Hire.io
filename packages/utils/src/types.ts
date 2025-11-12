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
          id: string
          name: string
          subdomain: string | null
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain?: string | null
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string | null
          settings?: Json
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          role: 'admin' | 'recruiter' | 'client' | 'candidate'
          email: string
          full_name: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          role: 'admin' | 'recruiter' | 'client' | 'candidate'
          email: string
          full_name?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          role?: 'admin' | 'recruiter' | 'client' | 'candidate'
          email?: string
          full_name?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          tenant_id: string
          title: string
          location: string | null
          salary_min: number | null
          salary_max: number | null
          required_skills: Json
          nice_to_have: Json
          spec: Json
          status: 'draft' | 'active' | 'closed'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          required_skills?: Json
          nice_to_have?: Json
          spec?: Json
          status?: 'draft' | 'active' | 'closed'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          required_skills?: Json
          nice_to_have?: Json
          spec?: Json
          status?: 'draft' | 'active' | 'closed'
          created_by?: string | null
          created_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          public_id: string
          full_name: string
          email: string
          phone: string | null
          location: string | null
          skills: Json
          experience: Json
          resume_url: string | null
          resume_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          public_id?: string
          full_name: string
          email: string
          phone?: string | null
          location?: string | null
          skills?: Json
          experience?: Json
          resume_url?: string | null
          resume_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          public_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          location?: string | null
          skills?: Json
          experience?: Json
          resume_url?: string | null
          resume_text?: string | null
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          tenant_id: string
          job_id: string
          candidate_id: string
          stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
          score: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          job_id: string
          candidate_id: string
          stage?: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
          score?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          job_id?: string
          candidate_id?: string
          stage?: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
          score?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      stages: {
        Row: {
          id: string
          tenant_id: string
          name: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          order?: number
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          tenant_id: string
          actor_user_id: string | null
          entity_type: string
          entity_id: string | null
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          actor_user_id?: string | null
          entity_type: string
          entity_id?: string | null
          action: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          actor_user_id?: string | null
          entity_type?: string
          entity_id?: string | null
          action?: string
          metadata?: Json
          created_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          created_at?: string
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

export type Role = 'admin' | 'recruiter' | 'client' | 'candidate'
export type JobStatus = 'draft' | 'active' | 'closed'
export type ApplicationStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export type Tenant = Database['public']['Tables']['tenants']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type Candidate = Database['public']['Tables']['candidates']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type Stage = Database['public']['Tables']['stages']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
