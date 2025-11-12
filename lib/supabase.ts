import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      employers: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          industry: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employers']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['employers']['Insert']>;
      };
      candidates: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          resume_url: string | null;
          resume_text: string | null;
          skills: string[];
          experience_years: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['candidates']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['candidates']['Insert']>;
      };
      jobs: {
        Row: {
          id: string;
          employer_id: string;
          title: string;
          description: string | null;
          required_skills: string[];
          salary_min: number | null;
          salary_max: number | null;
          location: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'status'> & {
          id?: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
      job_intake: {
        Row: {
          id: string;
          job_id: string;
          leniency_score: number;
          priorities: string[];
          dealbreakers: string[];
          culture_fit: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['job_intake']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['job_intake']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          job_id: string;
          candidate_id: string;
          match_score: number;
          is_shortlisted: boolean;
          employer_viewed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      feedback: {
        Row: {
          id: string;
          match_id: string;
          employer_id: string;
          rating: number | null;
          comments: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['feedback']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>;
      };
    };
  };
};
