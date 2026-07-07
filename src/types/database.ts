export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          org: string | null
          plan: 'starter' | 'pro' | 'enterprise' | null
          plan_status: 'active' | 'trial' | 'cancelled' | 'past_due' | null
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: string
          city: string
          type: 'residential' | 'commercial' | 'transit' | 'government'
          readiness_score: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      incidents: {
        Row: {
          id: string
          property_id: string
          reported_by: string
          date: string
          cost_nok: number | null
          status: 'new' | 'open' | 'matched' | 'closed'
          signature_id: string | null
          ai_match_confidence: number | null
          photo_urls: string[]
          gps_lat: number | null
          gps_lng: number | null
          evidence_hash: string | null
          police_ref: string | null
          surface: string | null
          cctv: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['incidents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['incidents']['Insert']>
      }
      signatures: {
        Row: {
          id: string
          code: string
          cluster_size: number
          first_seen: string
          last_seen: string
          city_trail: string[]
          confidence: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['signatures']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['signatures']['Insert']>
      }
      bounties: {
        Row: {
          id: string
          incident_id: string | null
          signature_id: string | null
          amount_nok: number
          status: 'open' | 'claimed' | 'paid' | 'closed'
          tips_count: number
          posted_by: string
          description: string | null
          city: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bounties']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bounties']['Insert']>
      }
    }
  }
}
