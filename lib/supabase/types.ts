/**
 * Generated from the public schema after applying supabase/migrations.
 * Regenerate from information_schema after a local apply. Do not edit by hand.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      affiliate_links: {
        Row: {
          key: string
          label: string
          href: string
          enabled: boolean
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['affiliate_links']['Row']>
        Update: Partial<Database['public']['Tables']['affiliate_links']['Row']>
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          owner_id: string
          title: string
          contact_name: string
          starts_at: string
          notes: string
          created_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['appointments']['Row']>
        Update: Partial<Database['public']['Tables']['appointments']['Row']>
        Relationships: []
      }
      automation_runs: {
        Row: {
          id: string
          automation_id: string
          workspace_id: string
          owner_id: string
          status: string
          detail: string
          started_at: string
          finished_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['automation_runs']['Row']>
        Update: Partial<Database['public']['Tables']['automation_runs']['Row']>
        Relationships: []
      }
      automation_steps: {
        Row: {
          id: string
          automation_id: string
          workspace_id: string
          owner_id: string
          position: number
          action_key: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['automation_steps']['Row']>
        Update: Partial<Database['public']['Tables']['automation_steps']['Row']>
        Relationships: []
      }
      automations: {
        Row: {
          id: string
          owner_id: string
          name: string
          trigger_key: string
          action_key: string
          enabled: boolean
          created_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['automations']['Row']>
        Update: Partial<Database['public']['Tables']['automations']['Row']>
        Relationships: []
      }
      ava_brand_context: {
        Row: {
          id: string
          user_id: string
          brand_name: string
          brand_voice: string
          brand_values: string[]
          target_audience: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['ava_brand_context']['Row']>
        Update: Partial<Database['public']['Tables']['ava_brand_context']['Row']>
        Relationships: []
      }
      ava_conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          context: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['ava_conversations']['Row']>
        Update: Partial<Database['public']['Tables']['ava_conversations']['Row']>
        Relationships: []
      }
      ava_dress_codes: {
        Row: {
          context: string
          description: string
        }
        Insert: Partial<Database['public']['Tables']['ava_dress_codes']['Row']>
        Update: Partial<Database['public']['Tables']['ava_dress_codes']['Row']>
        Relationships: []
      }
      ava_identity: {
        Row: {
          id: string
          version: string
          name: string
          phonetic_spelling: string
          ipa: string
          ssml_phoneme: string
          browser_lang: string
          browser_rate: number
          tts_model: string
          tts_voice: string
          visual: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['ava_identity']['Row']>
        Update: Partial<Database['public']['Tables']['ava_identity']['Row']>
        Relationships: []
      }
      ava_memory_store: {
        Row: {
          id: string
          user_id: string
          memory_type: string
          key: string
          value: Json
          importance_score: number
          last_accessed: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['ava_memory_store']['Row']>
        Update: Partial<Database['public']['Tables']['ava_memory_store']['Row']>
        Relationships: []
      }
      ava_messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: string
          content: string
          metadata: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['ava_messages']['Row']>
        Update: Partial<Database['public']['Tables']['ava_messages']['Row']>
        Relationships: []
      }
      ava_outfit_rotation: {
        Row: {
          position: number
          look_id: string
          name: string
          note: string
        }
        Insert: Partial<Database['public']['Tables']['ava_outfit_rotation']['Row']>
        Update: Partial<Database['public']['Tables']['ava_outfit_rotation']['Row']>
        Relationships: []
      }
      ava_voice_calls: {
        Row: {
          id: string
          user_id: string
          call_sid: string
          direction: string
          phone_number: string
          duration_seconds: number
          recording_url: string
          started_at: string
          ended_at: string
        }
        Insert: Partial<Database['public']['Tables']['ava_voice_calls']['Row']>
        Update: Partial<Database['public']['Tables']['ava_voice_calls']['Row']>
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          calendar_id: string
          appointment_id: string
          workspace_id: string
          owner_id: string
          title: string
          contact_name: string
          starts_at: string
          notes: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['bookings']['Row']>
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
        Relationships: []
      }
      calendars: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          name: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['calendars']['Row']>
        Update: Partial<Database['public']['Tables']['calendars']['Row']>
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          owner_id: string
          name: string
          channel: string
          status: string
          brief: string
          created_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['campaigns']['Row']>
        Update: Partial<Database['public']['Tables']['campaigns']['Row']>
        Relationships: []
      }
      client_files: {
        Row: {
          id: string
          owner_id: string
          filename: string
          path: string
          created_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['client_files']['Row']>
        Update: Partial<Database['public']['Tables']['client_files']['Row']>
        Relationships: []
      }
      client_memory: {
        Row: {
          id: string
          owner_id: string
          memory_key: string
          memory_value: string
          updated_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['client_memory']['Row']>
        Update: Partial<Database['public']['Tables']['client_memory']['Row']>
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          name: string
          website: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['companies']['Row']>
        Update: Partial<Database['public']['Tables']['companies']['Row']>
        Relationships: []
      }
      contact_notes: {
        Row: {
          id: string
          contact_id: string
          workspace_id: string
          owner_id: string
          body: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['contact_notes']['Row']>
        Update: Partial<Database['public']['Tables']['contact_notes']['Row']>
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          owner_id: string
          name: string
          email: string
          phone: string
          company: string
          notes: string
          created_at: string
          workspace_id: string
          company_id: string
        }
        Insert: Partial<Database['public']['Tables']['contacts']['Row']>
        Update: Partial<Database['public']['Tables']['contacts']['Row']>
        Relationships: []
      }
      deals: {
        Row: {
          id: string
          owner_id: string
          title: string
          contact_name: string
          stage: string
          notes: string
          created_at: string
          workspace_id: string
          pipeline_id: string
          stage_id: string
        }
        Insert: Partial<Database['public']['Tables']['deals']['Row']>
        Update: Partial<Database['public']['Tables']['deals']['Row']>
        Relationships: []
      }
      digimark_workspace: {
        Row: {
          id: string
          user_id: string
          kind: string
          title: string
          content: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['digimark_workspace']['Row']>
        Update: Partial<Database['public']['Tables']['digimark_workspace']['Row']>
        Relationships: []
      }
      email_list_members: {
        Row: {
          id: string
          list_id: string
          workspace_id: string
          owner_id: string
          email: string
          unsubscribed_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['email_list_members']['Row']>
        Update: Partial<Database['public']['Tables']['email_list_members']['Row']>
        Relationships: []
      }
      email_lists: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          campaign_id: string
          name: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['email_lists']['Row']>
        Update: Partial<Database['public']['Tables']['email_lists']['Row']>
        Relationships: []
      }
      email_sends: {
        Row: {
          id: string
          campaign_id: string
          list_id: string
          workspace_id: string
          owner_id: string
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['email_sends']['Row']>
        Update: Partial<Database['public']['Tables']['email_sends']['Row']>
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          email_hash: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['email_unsubscribes']['Row']>
        Update: Partial<Database['public']['Tables']['email_unsubscribes']['Row']>
        Relationships: []
      }
      funnel_pages: {
        Row: {
          id: string
          funnel_id: string
          workspace_id: string
          owner_id: string
          path: string
          headline: string
          position: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['funnel_pages']['Row']>
        Update: Partial<Database['public']['Tables']['funnel_pages']['Row']>
        Relationships: []
      }
      funnels: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          site_id: string
          name: string
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['funnels']['Row']>
        Update: Partial<Database['public']['Tables']['funnels']['Row']>
        Relationships: []
      }
      lead_audit: {
        Row: {
          id: string
          action: string
          staging_id: string
          lead_id: string
          email_hash: string
          detail: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_audit']['Row']>
        Update: Partial<Database['public']['Tables']['lead_audit']['Row']>
        Relationships: []
      }
      lead_consent: {
        Row: {
          id: string
          private_contact_id: string
          staging_id: string
          lead_id: string
          consent_contact: boolean
          consent_share: boolean
          recorded_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_consent']['Row']>
        Update: Partial<Database['public']['Tables']['lead_consent']['Row']>
        Relationships: []
      }
      lead_enrichment: {
        Row: {
          id: string
          staging_id: string
          provider: string
          status: string
          enriched_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_enrichment']['Row']>
        Update: Partial<Database['public']['Tables']['lead_enrichment']['Row']>
        Relationships: []
      }
      lead_niches: {
        Row: {
          key: string
          label: string
          words: string[]
        }
        Insert: Partial<Database['public']['Tables']['lead_niches']['Row']>
        Update: Partial<Database['public']['Tables']['lead_niches']['Row']>
        Relationships: []
      }
      lead_orders: {
        Row: {
          id: string
          buyer_id: string
          niche: string
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_orders']['Row']>
        Update: Partial<Database['public']['Tables']['lead_orders']['Row']>
        Relationships: []
      }
      lead_private_contacts: {
        Row: {
          id: string
          staging_id: string
          lead_id: string
          email: string
          email_hash: string
          full_name: string
          phone: string
          company: string
          notes: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_private_contacts']['Row']>
        Update: Partial<Database['public']['Tables']['lead_private_contacts']['Row']>
        Relationships: []
      }
      lead_records: {
        Row: {
          id: string
          niche: string
          region: string
          company_size: string
          score: number
          source_kind: string
          connector_id: string
          consent_contact: boolean
          consent_share: boolean
          consent_at: string
          has_company: boolean
          has_website: boolean
          message_chars: number
          sellable: boolean
          premium: boolean
          opted_out: boolean
          suppressed: boolean
          enriched_at: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_records']['Row']>
        Update: Partial<Database['public']['Tables']['lead_records']['Row']>
        Relationships: []
      }
      lead_rejected: {
        Row: {
          id: string
          email_hash: string
          niche: string
          score: number
          source_kind: string
          reason: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_rejected']['Row']>
        Update: Partial<Database['public']['Tables']['lead_rejected']['Row']>
        Relationships: []
      }
      lead_releases: {
        Row: {
          id: string
          order_id: string
          lead_id: string
          buyer_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_releases']['Row']>
        Update: Partial<Database['public']['Tables']['lead_releases']['Row']>
        Relationships: []
      }
      lead_staging: {
        Row: {
          id: string
          niche: string
          region: string
          company_size: string
          score: number
          source_kind: string
          connector_id: string
          consent_contact: boolean
          consent_share: boolean
          consent_at: string
          has_company: boolean
          has_website: boolean
          message_chars: number
          enriched_at: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_staging']['Row']>
        Update: Partial<Database['public']['Tables']['lead_staging']['Row']>
        Relationships: []
      }
      lead_suppressions: {
        Row: {
          email_hash: string
          reason: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['lead_suppressions']['Row']>
        Update: Partial<Database['public']['Tables']['lead_suppressions']['Row']>
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          name: string
          email: string
          company: string
          website: string
          service: string
          budget: string
          message: string
          source: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['leads']['Row']>
        Update: Partial<Database['public']['Tables']['leads']['Row']>
        Relationships: []
      }
      managed_backends: {
        Row: {
          id: string
          owner_id: string
          project_ref: string
          name: string
          region: string
          status: string
          api_url: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['managed_backends']['Row']>
        Update: Partial<Database['public']['Tables']['managed_backends']['Row']>
        Relationships: []
      }
      owner_office_appearance: {
        Row: {
          owner_id: string
          visitor_mode: boolean
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['owner_office_appearance']['Row']>
        Update: Partial<Database['public']['Tables']['owner_office_appearance']['Row']>
        Relationships: []
      }
      paypal_plans: {
        Row: {
          key: string
          name: string
          months: number
          amount: number
          currency: string
        }
        Insert: Partial<Database['public']['Tables']['paypal_plans']['Row']>
        Update: Partial<Database['public']['Tables']['paypal_plans']['Row']>
        Relationships: []
      }
      paypal_webhook_events: {
        Row: {
          id: string
          event_id: string
          event_type: string
          paypal_subscription_id: string
          payload: Json
          received_at: string
        }
        Insert: Partial<Database['public']['Tables']['paypal_webhook_events']['Row']>
        Update: Partial<Database['public']['Tables']['paypal_webhook_events']['Row']>
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          id: string
          pipeline_id: string
          owner_id: string
          key: string
          label: string
          position: number
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['pipeline_stages']['Row']>
        Update: Partial<Database['public']['Tables']['pipeline_stages']['Row']>
        Relationships: []
      }
      pipelines: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          name: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['pipelines']['Row']>
        Update: Partial<Database['public']['Tables']['pipelines']['Row']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string
          company_name: string
          phone: string
          subscription_tier: string
          subscription_status: string
          onboarding_completed: boolean
          role: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      provisioning_jobs: {
        Row: {
          id: string
          owner_id: string
          backend_id: string
          name: string
          region: string
          status: string
          detail: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['provisioning_jobs']['Row']>
        Update: Partial<Database['public']['Tables']['provisioning_jobs']['Row']>
        Relationships: []
      }
      sites: {
        Row: {
          id: string
          owner_id: string
          name: string
          path: string
          status: string
          headline: string
          created_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['sites']['Row']>
        Update: Partial<Database['public']['Tables']['sites']['Row']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          owner_id: string
          paypal_subscription_id: string
          paypal_plan_id: string
          plan_key: string
          status: string
          payer_email: string
          payer_id: string
          currency: string
          amount_value: number
          interval_count: number
          last_payment_amount: number
          last_payment_at: string
          next_billing_time: string
          activated_at: string
          cancelled_at: string
          last_event_type: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          contact_id: string
          title: string
          status: string
          due_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['tasks']['Row']>
        Update: Partial<Database['public']['Tables']['tasks']['Row']>
        Relationships: []
      }
      thread_messages: {
        Row: {
          id: string
          owner_id: string
          thread_id: string
          body: string
          sender: string
          created_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['thread_messages']['Row']>
        Update: Partial<Database['public']['Tables']['thread_messages']['Row']>
        Relationships: []
      }
      threads: {
        Row: {
          id: string
          owner_id: string
          contact_name: string
          subject: string
          created_at: string
          workspace_id: string
        }
        Insert: Partial<Database['public']['Tables']['threads']['Row']>
        Update: Partial<Database['public']['Tables']['threads']['Row']>
        Relationships: []
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['workspace_members']['Row']>
        Update: Partial<Database['public']['Tables']['workspace_members']['Row']>
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          owner_id: string
          name: string
          personal: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['workspaces']['Row']>
        Update: Partial<Database['public']['Tables']['workspaces']['Row']>
        Relationships: []
      }
    }
    Views: {
      inbox_conversations: {
        Row: {
          id: string
          owner_id: string
          workspace_id: string
          contact_name: string
          subject: string
          created_at: string
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          id: string
          owner_id: string
          workspace_id: string
          thread_id: string
          body: string
          sender: string
          created_at: string
        }
        Relationships: []
      }
      lead_previews: {
        Row: {
          id: string
          niche: string
          region: string
          company_size: string
          score: number
          premium: boolean
          created_at: string
        }
        Relationships: []
      }
      lead_store: {
        Row: {
          id: string
          niche: string
          region: string
          company_size: string
          score: number
          premium: boolean
          created_at: string
        }
        Relationships: []
      }
    }
    Functions: {
      promote_premium_leads: { Args: { min_score?: number }; Returns: Json }
      is_owner: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
